from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

from routes.extract import router as extract_router
from routes.analyze import router as analyze_router
from routes.payments import router as payments_router, webhook_router
from routes.jobs import router as jobs_router, candidates_router
from routes.dashboard import router as dashboard_router
from models import init_db

load_dotenv()

app = FastAPI(
    title="Autonomous CV Screening Engine API",
    description="FastAPI Backend for Resume Data Extraction and Autonomous Criteria Analysis",
    version="1.0.0",
)

@app.on_event("startup")
def on_startup():
    try:
        init_db()
    except Exception as e:
        print(f"Database initialization notice: {e}")

# Enable CORS for Frontend communication
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include Routers
app.include_router(extract_router)
app.include_router(analyze_router)
app.include_router(payments_router)
app.include_router(webhook_router)
app.include_router(jobs_router)
app.include_router(candidates_router)
app.include_router(dashboard_router)


# ==============================================================================
# ROOT HEALTH CHECK ENDPOINT
# ==============================================================================

@app.get("/")
def health_check():
    return {
        "status": "online",
        "service": "Autonomous CV Screening FastAPI Engine",
        "endpoints": [
            "POST /extract-resume (Extract structured resume data from file/text/url)",
            "POST /extract-resume/json (JSON helper for URL extraction)",
            "POST /analyze-resume (Analyze resume against custom job criteria)",
            "GET  /dashboard/summary (User dashboard metrics, stats & usage)",
            "GET  /jobs (List user jobs)",
            "POST /jobs (Create recruiter job)",
            "GET  /jobs/{job_id}/candidates (Tracked candidates under job)",
            "PATCH /candidates/{candidate_id}/status (Update hiring pipeline stage)",
            "POST /payments/create-checkout-session (Stripe Embedded Checkout)",
            "GET /payments/session-status (Check session return status)",
            "POST /webhooks/stripe (Stripe Webhook Listener)"
        ]
    }
