import os
import logging
from typing import Optional
from datetime import datetime
from fastapi import APIRouter, Request, HTTPException, Header, BackgroundTasks, status, Depends
from pydantic import BaseModel, Field
import stripe
from sqlmodel import Session, select
from dotenv import load_dotenv

from models import engine, Subscription
from auth import verify_jwt_token

load_dotenv()

logger = logging.getLogger("payments")
logger.setLevel(logging.INFO)

router = APIRouter(prefix="/payments", tags=["payments"])
webhook_router = APIRouter(tags=["webhooks"])

# Stripe Initialization
STRIPE_SECRET_KEY = os.getenv("STRIPE_SECRET_KEY", "")
STRIPE_WEBHOOK_SECRET = os.getenv("STRIPE_WEBHOOK_SECRET", "")
FRONTEND_URL = os.getenv("FRONTEND_URL", "https://aura-screening.vercel.app").rstrip("/")

if STRIPE_SECRET_KEY:
    stripe.api_key = STRIPE_SECRET_KEY
else:
    logger.warning("STRIPE_SECRET_KEY is not set. Stripe endpoints will require configuration.")

# Price ID Mapping Configuration
# Tiers: Pro ($25/mo or $20/mo yearly = $240/yr), Pro Max ($120/mo or $100/mo yearly = $1200/yr)
PRICE_ID_MAP = {
    ("pro", "month"): os.getenv("STRIPE_PRICE_PRO_MONTHLY", ""),
    ("pro", "monthly"): os.getenv("STRIPE_PRICE_PRO_MONTHLY", ""),
    ("pro", "year"): os.getenv("STRIPE_PRICE_PRO_YEARLY", ""),
    ("pro", "yearly"): os.getenv("STRIPE_PRICE_PRO_YEARLY", ""),
    ("pro max", "month"): os.getenv("STRIPE_PRICE_PRO_MAX_MONTHLY", ""),
    ("pro max", "monthly"): os.getenv("STRIPE_PRICE_PRO_MAX_MONTHLY", ""),
    ("pro max", "year"): os.getenv("STRIPE_PRICE_PRO_MAX_YEARLY", ""),
    ("pro max", "yearly"): os.getenv("STRIPE_PRICE_PRO_MAX_YEARLY", ""),
    ("pro_max", "month"): os.getenv("STRIPE_PRICE_PRO_MAX_MONTHLY", ""),
    ("pro_max", "monthly"): os.getenv("STRIPE_PRICE_PRO_MAX_MONTHLY", ""),
    ("pro_max", "year"): os.getenv("STRIPE_PRICE_PRO_MAX_YEARLY", ""),
    ("pro_max", "yearly"): os.getenv("STRIPE_PRICE_PRO_MAX_YEARLY", ""),
}

FALLBACK_PLAN_PRICES = {
    ("pro", "month"): 2500,        # $25.00
    ("pro", "monthly"): 2500,
    ("pro", "year"): 24000,        # $240.00 ($20/mo)
    ("pro", "yearly"): 24000,
    ("pro max", "month"): 12000,   # $120.00
    ("pro max", "monthly"): 12000,
    ("pro max", "year"): 120000,   # $1200.00 ($100/mo)
    ("pro max", "yearly"): 120000,
    ("pro_max", "month"): 12000,
    ("pro_max", "monthly"): 12000,
    ("pro_max", "year"): 120000,
    ("pro_max", "yearly"): 120000,
}


class CheckoutSessionRequest(BaseModel):
    plan: str = Field(default="pro", description="Subscription plan name (e.g. 'pro', 'pro_max')")
    interval: str = Field(default="month", description="Billing interval ('month' or 'year')")
    price_id: Optional[str] = Field(default=None, description="Explicit Stripe Price ID if pre-configured")
    user_id: Optional[str] = Field(default=None, description="User internal identifier")
    user_email: Optional[str] = Field(default=None, description="User contact email")
    ui_mode: Optional[str] = Field(default="hosted", description="Checkout UI mode ('hosted' or 'embedded')")


class RollbackSubscriptionRequest(BaseModel):
    target_plan: str = Field(..., description="Target plan to rollback to ('starter', 'pro')")
    user_id: Optional[str] = Field(default=None, description="User internal identifier")


class PortalSessionRequest(BaseModel):
    user_id: Optional[str] = Field(default=None, description="User internal identifier")
    return_url: Optional[str] = Field(default=None, description="Return URL after exiting customer portal")


PLAN_RANK = {
    "starter": 0,
    "pro": 1,
    "pro max": 2,
    "pro-max": 2,
    "pro_max": 2,
}


def get_optional_current_user(authorization: Optional[str] = Header(None)) -> Optional[str]:
    """
    Extracts authenticated user ID from Authorization header if present.
    Allows unauthenticated requests to proceed with optional client identifiers.
    """
    if not authorization or not authorization.startswith("Bearer "):
        return None
    token = authorization.split(" ")[1]
    try:
        return verify_jwt_token(token)
    except Exception:
        return None


# ==============================================================================
# 1. CREATE STRIPE CHECKOUT SESSION (HOSTED STRIPE UI DEFAULT)
# ==============================================================================
@router.post("/create-checkout-session")
async def create_checkout_session(
    body: CheckoutSessionRequest,
    authenticated_user_id: Optional[str] = Depends(get_optional_current_user),
):
    if not STRIPE_SECRET_KEY:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Stripe secret key is not configured in backend environment",
        )

    # Determine user identity from verified JWT or fallback request body
    effective_user_id = authenticated_user_id or body.user_id or "anonymous_guest"
    normalized_plan = body.plan.strip().lower()
    normalized_interval = "year" if body.interval.lower() in ("year", "yearly") else "month"

    # Determine line items: either explicit/mapped Stripe Price ID or dynamic price_data
    configured_price_id = body.price_id or PRICE_ID_MAP.get((normalized_plan, normalized_interval))

    if configured_price_id:
        line_items = [{"price": configured_price_id, "quantity": 1}]
    else:
        unit_amount = FALLBACK_PLAN_PRICES.get((normalized_plan, normalized_interval), 2500)
        plan_display_name = f"Autonomous CV Screening - {normalized_plan.title()} Plan"
        line_items = [
            {
                "price_data": {
                    "currency": "usd",
                    "product_data": {
                        "name": plan_display_name,
                        "description": f"Full access to AI CV Screening ({normalized_interval}ly billing)",
                    },
                    "unit_amount": unit_amount,
                    "recurring": {"interval": normalized_interval},
                },
                "quantity": 1,
            }
        ]

    try:
        is_embedded = body.ui_mode in ("embedded", "embedded_page")
        
        session_params = {
            "mode": "subscription",
            "line_items": line_items,
            "client_reference_id": effective_user_id,
            "metadata": {
                "user_id": effective_user_id,
                "plan": normalized_plan,
                "interval": normalized_interval,
            },
        }

        if is_embedded:
            session_params["ui_mode"] = "embedded_page"
            session_params["return_url"] = f"{FRONTEND_URL}/checkout/return?session_id={{CHECKOUT_SESSION_ID}}"
        else:
            # Hosted Stripe Checkout: user is redirected to checkout.stripe.com (Stripe UI solely)
            session_params["success_url"] = f"{FRONTEND_URL}/checkout/return?session_id={{CHECKOUT_SESSION_ID}}"
            session_params["cancel_url"] = f"{FRONTEND_URL}/#pricing"

        if body.user_email:
            session_params["customer_email"] = body.user_email

        session = stripe.checkout.Session.create(**session_params)

        return {
            "url": session.url,
            "sessionId": session.id,
            "clientSecret": session.client_secret,
            "client_secret": session.client_secret,
        }
    except Exception as e:
        logger.error(f"Error creating Stripe checkout session: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unable to create Stripe session: {str(e)}",
        )


def stripe_to_dict(obj) -> dict:
    """
    Safely converts a StripeObject or dict-like object to a standard Python dictionary.
    In stripe-python >= 8.0, StripeObject is no longer an iterable or mapping, so
    standard dict(obj) raises TypeError. obj.to_dict() must be used instead.
    """
    if obj is None:
        return {}
    if hasattr(obj, "to_dict"):
        return obj.to_dict()
    if isinstance(obj, dict):
        return obj
    try:
        return dict(obj)
    except Exception:
        return getattr(obj, "__dict__", {})


def sync_subscription_from_stripe_session(session_obj) -> Optional[Subscription]:
    """
    Safely synchronizes or provisions a user's subscription record in PostgreSQL
    given a verified Stripe Checkout Session object or event payload.
    """
    s_dict = stripe_to_dict(session_obj)

    client_ref = getattr(session_obj, "client_reference_id", None) or s_dict.get("client_reference_id")
    metadata = getattr(session_obj, "metadata", None) or s_dict.get("metadata")
    metadata_dict = stripe_to_dict(metadata)
    user_id = client_ref or metadata_dict.get("user_id")

    if not user_id or user_id == "anonymous_guest":
        return None

    customer_id = getattr(session_obj, "customer", None) or s_dict.get("customer")
    subscription_id = getattr(session_obj, "subscription", None) or s_dict.get("subscription")
    session_id = getattr(session_obj, "id", None) or s_dict.get("id")
    plan = metadata_dict.get("plan", "pro")
    interval = metadata_dict.get("interval", "month")
    amount_total = getattr(session_obj, "amount_total", None) or s_dict.get("amount_total")
    currency = getattr(session_obj, "currency", None) or s_dict.get("currency", "usd")

    try:
        with Session(engine) as db_session:
            stmt = select(Subscription).where(Subscription.user_id == user_id)
            existing_sub = db_session.exec(stmt).first()

            if existing_sub:
                existing_sub.stripe_customer_id = customer_id or existing_sub.stripe_customer_id
                existing_sub.stripe_subscription_id = subscription_id or existing_sub.stripe_subscription_id
                existing_sub.stripe_session_id = session_id or existing_sub.stripe_session_id
                existing_sub.plan = plan
                existing_sub.interval = interval
                existing_sub.status = "active"
                existing_sub.amount = amount_total or existing_sub.amount
                existing_sub.currency = currency or existing_sub.currency
                existing_sub.updated_at = datetime.utcnow()
                db_session.add(existing_sub)
                db_session.commit()
                db_session.refresh(existing_sub)
                logger.info(f"Updated subscription for user {user_id} to plan {plan}")
                return existing_sub
            else:
                new_sub = Subscription(
                    user_id=user_id,
                    stripe_customer_id=customer_id,
                    stripe_subscription_id=subscription_id,
                    stripe_session_id=session_id,
                    plan=plan,
                    interval=interval,
                    status="active",
                    amount=amount_total,
                    currency=currency,
                    evaluations_used=0,
                )
                db_session.add(new_sub)
                db_session.commit()
                db_session.refresh(new_sub)
                logger.info(f"Provisioned new subscription for user {user_id} with plan {plan}")
                return new_sub
    except Exception as e:
        logger.error(f"Failed to synchronize subscription for user {user_id}: {e}")
        return None


# ==============================================================================
# 2. SESSION STATUS (RETURN VERIFICATION & INSTANT PROVISIONING)
# ==============================================================================
@router.get("/session-status")
async def get_session_status(session_id: str):
    if not STRIPE_SECRET_KEY:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Stripe secret key is not configured in backend environment",
        )

    try:
        session = stripe.checkout.Session.retrieve(session_id)

        # If payment is completed/paid, immediately synchronize subscription state
        if getattr(session, "status", None) == "complete" or getattr(session, "payment_status", None) == "paid":
            sync_subscription_from_stripe_session(session)

        customer_email = None
        if hasattr(session, "customer_details") and session.customer_details:
            customer_email = getattr(session.customer_details, "email", None)

        metadata_dict = stripe_to_dict(getattr(session, "metadata", None))

        return {
            "status": getattr(session, "status", None),
            "payment_status": getattr(session, "payment_status", None),
            "customer_email": customer_email,
            "client_reference_id": getattr(session, "client_reference_id", None),
            "metadata": metadata_dict,
        }
    except Exception as e:
        logger.error(f"Error retrieving session status for {session_id}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Error retrieving session: {str(e)}",
        )


# ==============================================================================
# 3. USER PROFILE CREDITS & RUNS USAGE
# ==============================================================================
PLAN_LIMITS = {
    "starter": 10,
    "pro": 100,
    "pro max": 1000,
    "pro-max": 1000,
    "pro_max": 1000,
}

@router.get("/profile-usage")
async def get_profile_usage(
    user_id: Optional[str] = None,
    authenticated_user_id: Optional[str] = Depends(get_optional_current_user),
):
    """
    Returns user's current subscription tier, quota limits, used evaluations,
    and remaining runs for the profile dashboard.
    """
    effective_user_id = user_id or authenticated_user_id
    if not effective_user_id:
        return {
            "user_id": None,
            "plan": "starter",
            "plan_name": "Starter Plan",
            "status": "active",
            "total_credits": 10,
            "credits_used": 0,
            "credits_remaining": 10,
            "interval": "month",
            "current_period_end": None,
        }

    try:
        with Session(engine) as db_session:
            stmt = select(Subscription).where(Subscription.user_id == effective_user_id)
            sub = db_session.exec(stmt).first()

            # Automatic Stripe reconciliation fallback:
            # Only if user has NO record at all in DB and is a first-time subscriber
            if sub is None and STRIPE_SECRET_KEY:
                try:
                    stripe_sessions = stripe.checkout.Session.list(limit=10)
                    for s in stripe_sessions.data:
                        matched_user = s.client_reference_id or (s.metadata and s.metadata.get("user_id"))
                        if matched_user == effective_user_id and (s.status == "complete" or s.payment_status == "paid"):
                            sub = sync_subscription_from_stripe_session(s)
                            break
                except Exception as ex:
                    logger.warning(f"Could not verify Stripe sessions fallback: {ex}")

            if not sub:
                return {
                    "user_id": effective_user_id,
                    "plan": "starter",
                    "plan_name": "Starter Plan",
                    "status": "active",
                    "total_credits": 10,
                    "credits_used": 0,
                    "credits_remaining": 10,
                    "interval": "month",
                    "current_period_end": None,
                }

            plan_key = sub.plan.strip().lower()
            limit = PLAN_LIMITS.get(plan_key, 100 if "pro" in plan_key else 10)
            used = sub.evaluations_used or 0
            remaining = max(0, limit - used)

            return {
                "user_id": effective_user_id,
                "plan": sub.plan,
                "plan_name": f"{sub.plan.replace('_', ' ').replace('-', ' ').title()} Plan",
                "status": sub.status,
                "total_credits": limit,
                "credits_used": used,
                "credits_remaining": remaining,
                "interval": sub.interval,
                "current_period_end": sub.current_period_end,
            }
    except Exception as e:
        logger.error(f"Error fetching profile usage: {e}")
        # Safe fallback
        return {
            "user_id": effective_user_id,
            "plan": "starter",
            "plan_name": "Starter Plan",
            "status": "active",
            "total_credits": 10,
            "credits_used": 0,
            "credits_remaining": 10,
            "interval": "month",
            "current_period_end": None,
        }


@router.post("/record-usage")
async def record_usage(
    body: dict,
    authenticated_user_id: Optional[str] = Depends(get_optional_current_user),
):
    """
    Deducts/increments run count when an evaluation is performed.
    """
    effective_user_id = body.get("user_id") or authenticated_user_id
    if not effective_user_id:
        return {"status": "skipped", "reason": "Anonymous run"}

    try:
        with Session(engine) as db_session:
            stmt = select(Subscription).where(Subscription.user_id == effective_user_id)
            sub = db_session.exec(stmt).first()

            if sub:
                sub.evaluations_used = (sub.evaluations_used or 0) + 1
                sub.updated_at = datetime.utcnow()
                db_session.add(sub)
                db_session.commit()
                limit = PLAN_LIMITS.get(sub.plan.lower(), 10)
                return {
                    "status": "success",
                    "credits_used": sub.evaluations_used,
                    "credits_remaining": max(0, limit - sub.evaluations_used),
                }
            else:
                new_sub = Subscription(
                    user_id=effective_user_id,
                    plan="starter",
                    interval="month",
                    status="active",
                    evaluations_used=1,
                )
                db_session.add(new_sub)
                db_session.commit()
                return {
                    "status": "success",
                    "credits_used": 1,
                    "credits_remaining": 9,
                }
    except Exception as e:
        logger.error(f"Error recording usage: {e}")
        return {"status": "error", "detail": str(e)}


# ==============================================================================
# 4. SUBSCRIPTION ROLLBACK / DOWNGRADE
# ==============================================================================
@router.post("/rollback-subscription")
async def rollback_subscription(
    body: RollbackSubscriptionRequest,
    authenticated_user_id: Optional[str] = Depends(get_optional_current_user),
):
    """
    Rolls back / downgrades a user's active subscription tier to a lower plan
    (e.g., from Pro Max to Pro, or from Pro Max / Pro to Starter).
    Syncs with Stripe (cancellation or plan modification with proration) and updates local quota.
    """
    effective_user_id = authenticated_user_id or body.user_id
    if not effective_user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required to rollback subscription.",
        )

    target_plan_raw = body.target_plan.strip().lower().replace("-", "_").replace(" ", "_")
    if target_plan_raw not in ("starter", "pro"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid rollback target '{body.target_plan}'. You can only rollback to 'starter' or 'pro'.",
        )

    target_rank = PLAN_RANK.get(target_plan_raw, 0)

    try:
        with Session(engine) as db_session:
            stmt = select(Subscription).where(Subscription.user_id == effective_user_id)
            sub = db_session.exec(stmt).first()

            current_plan = (sub.plan if sub else "starter").strip().lower().replace("-", "_").replace(" ", "_")
            current_rank = PLAN_RANK.get(current_plan, 0)

            if current_rank <= 0:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="You are currently on the Starter plan. Cannot rollback further.",
                )

            if target_rank >= current_rank:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Cannot rollback to '{body.target_plan}'. Target plan must be lower than current plan '{sub.plan}'.",
                )

            stripe_sub_id = sub.stripe_subscription_id if sub else None

            # 1. Execute Stripe modification if subscription is managed through Stripe
            if stripe_sub_id and STRIPE_SECRET_KEY:
                try:
                    if target_plan_raw == "starter":
                        # Downgrade to free: Cancel active Stripe subscription immediately
                        try:
                            stripe.Subscription.cancel(stripe_sub_id)
                            logger.info(f"Stripe subscription {stripe_sub_id} canceled for user {effective_user_id}")
                        except stripe.error.InvalidRequestError as ex:
                            logger.warning(f"Stripe cancel warning: {ex}")
                    elif target_plan_raw == "pro":
                        # Downgrade from Pro Max to Pro in Stripe
                        stripe_sub = stripe.Subscription.retrieve(stripe_sub_id)
                        if stripe_sub and stripe_sub.get("items") and stripe_sub["items"]["data"]:
                            sub_item_id = stripe_sub["items"]["data"][0]["id"]
                            interval = sub.interval or "month"
                            # Determine Pro price ID
                            pro_price_id = PRICE_ID_MAP.get(("pro", interval))
                            if not pro_price_id:
                                unit_amt = FALLBACK_PLAN_PRICES.get(("pro", interval), 2500)
                                new_price = stripe.Price.create(
                                    unit_amount=unit_amt,
                                    currency="usd",
                                    recurring={"interval": interval},
                                    product_data={"name": "Autonomous CV Screening - Pro Plan"},
                                )
                                pro_price_id = new_price.id

                            stripe.Subscription.modify(
                                stripe_sub_id,
                                items=[{"id": sub_item_id, "price": pro_price_id}],
                                proration_behavior="create_prorations",
                            )
                            logger.info(f"Stripe subscription {stripe_sub_id} modified to Pro for user {effective_user_id}")
                except Exception as stripe_err:
                    logger.error(f"Error updating Stripe subscription during rollback: {stripe_err}")

            # 2. Update local database record
            if not sub:
                sub = Subscription(
                    user_id=effective_user_id,
                    plan=target_plan_raw,
                    status="active" if target_plan_raw != "starter" else "canceled",
                    interval="month",
                    amount=0 if target_plan_raw == "starter" else 2500,
                    evaluations_used=0,
                )
                db_session.add(sub)
            else:
                sub.plan = target_plan_raw
                if target_plan_raw == "starter":
                    sub.status = "canceled"
                    sub.amount = 0
                else:
                    sub.status = "active"
                    interval = sub.interval or "month"
                    sub.amount = FALLBACK_PLAN_PRICES.get((target_plan_raw, interval), 2500)
                sub.updated_at = datetime.utcnow()
                db_session.add(sub)

            db_session.commit()
            db_session.refresh(sub)

            new_limit = PLAN_LIMITS.get(target_plan_raw, 10)
            used = sub.evaluations_used or 0
            remaining = max(0, new_limit - used)

            return {
                "status": "success",
                "message": f"Successfully rolled back subscription to {target_plan_raw.replace('_', ' ').title()} plan.",
                "plan": target_plan_raw,
                "plan_name": f"{target_plan_raw.replace('_', ' ').title()} Plan",
                "total_credits": new_limit,
                "credits_used": used,
                "credits_remaining": remaining,
            }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to rollback subscription for user {effective_user_id}: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to process rollback: {str(e)}",
        )


@router.post("/create-portal-session")
async def create_portal_session(
    body: Optional[PortalSessionRequest] = None,
    authenticated_user_id: Optional[str] = Depends(get_optional_current_user),
):
    """
    Creates a Stripe Customer Portal session so user can manage subscriptions, payment methods,
    and invoices directly on Stripe.
    """
    effective_user_id = authenticated_user_id or (body.user_id if body else None)
    if not effective_user_id:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Authentication required.")

    if not STRIPE_SECRET_KEY:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Stripe secret key is not configured.")

    try:
        with Session(engine) as db_session:
            stmt = select(Subscription).where(Subscription.user_id == effective_user_id)
            sub = db_session.exec(stmt).first()

            customer_id = sub.stripe_customer_id if sub else None
            if not customer_id:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="No active Stripe customer found for this user account.",
                )

            return_url = (body.return_url if body and body.return_url else f"{FRONTEND_URL}/profile")
            portal_session = stripe.billing_portal.Session.create(
                customer=customer_id,
                return_url=return_url,
            )
            return {"url": portal_session.url}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error creating billing portal session: {e}")
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


# ==============================================================================
# 5. BACKGROUND TASK DATABASE PROVISIONING
# ==============================================================================
def process_webhook_event_sync(event):
    """
    Background worker to securely update PostgreSQL subscription state
    without delaying the Stripe webhook HTTP response.
    """
    event_dict = stripe_to_dict(event)
    event_type = event_dict.get("type") or getattr(event, "type", None)
    data_payload = event_dict.get("data", {})
    data_object = data_payload.get("object", {}) if isinstance(data_payload, dict) else {}
    if not data_object and hasattr(event, "data"):
        data_object = getattr(getattr(event, "data", None), "object", {})

    logger.info(f"Processing webhook event asynchronously: {event_type}")

    try:
        with Session(engine) as db_session:
            if event_type == "checkout.session.completed":
                sync_subscription_from_stripe_session(data_object)

            elif event_type in ("customer.subscription.updated", "customer.subscription.deleted"):
                subscription_id = data_object.get("id")
                sub_status = data_object.get("status")
                current_period_end_timestamp = data_object.get("current_period_end")

                stmt = select(Subscription).where(Subscription.stripe_subscription_id == subscription_id)
                sub = db_session.exec(stmt).first()

                if sub:
                    sub.status = sub_status
                    if current_period_end_timestamp:
                        sub.current_period_end = datetime.fromtimestamp(current_period_end_timestamp)
                    sub.updated_at = datetime.utcnow()
                    db_session.add(sub)
                    db_session.commit()
                    logger.info(f"Updated subscription {subscription_id} status to {sub_status}")

    except Exception as e:
        logger.error(f"Failed to process webhook event {event_type} in database: {str(e)}", exc_info=True)


# ==============================================================================
# 4. STRIPE WEBHOOK HANDLERS (CRITICAL RAW BODY VERIFICATION)
# ==============================================================================
async def handle_stripe_webhook(request: Request, background_tasks: BackgroundTasks):
    """
    Secure webhook receiver: reads raw bytes before any JSON parsing
    to verify Stripe's HMAC signature.
    """
    # 1. Extract raw body bytes
    payload = await request.body()
    sig_header = request.headers.get("stripe-signature")

    if not sig_header:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Missing stripe-signature header",
        )

    # 2. Verify signature
    try:
        if STRIPE_WEBHOOK_SECRET:
            event = stripe.Webhook.construct_event(
                payload, sig_header, STRIPE_WEBHOOK_SECRET
            )
        else:
            # If webhook secret is not configured in local dev, decode JSON payload with warning
            logger.warning("STRIPE_WEBHOOK_SECRET is not configured. Skipping signature verification (dev mode).")
            event = stripe.Event.construct_from(
                await request.json(), stripe.api_key
            )
    except ValueError as e:
        logger.error(f"Invalid webhook payload: {str(e)}")
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid payload")
    except stripe.SignatureVerificationError as e:
        logger.error(f"Invalid Stripe webhook signature: {str(e)}")
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid signature")

    # 3. Queue asynchronous DB update
    background_tasks.add_task(process_webhook_event_sync, event)

    # 4. Promptly acknowledge receipt to Stripe
    return {"status": "success", "event_type": event.get("type")}


@webhook_router.post("/webhooks/stripe")
async def stripe_webhook_endpoint(request: Request, background_tasks: BackgroundTasks):
    return await handle_stripe_webhook(request, background_tasks)


@router.post("/webhook")
async def payment_webhook_alias(request: Request, background_tasks: BackgroundTasks):
    """Convenience alias for /payments/webhook"""
    return await handle_stripe_webhook(request, background_tasks)
