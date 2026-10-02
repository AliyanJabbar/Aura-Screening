import logging
from typing import Optional, List
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, Query, status, Header
from sqlmodel import Session, select, func

from models import engine, Job, CandidateEvaluation, Subscription
from auth import verify_jwt_token
from routes.payments import PLAN_LIMITS
from schemas import (
    DashboardSummaryResponse,
    DashboardStats,
    DashboardUsage,
    JobResponse,
    CandidateResponse,
)

logger = logging.getLogger("dashboard")
logger.setLevel(logging.INFO)

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])


def get_authenticated_user_id(
    authorization: Optional[str] = Header(None),
    user_id: Optional[str] = Query(None),
) -> str:
    if authorization and authorization.startswith("Bearer "):
        token = authorization.split(" ")[1]
        try:
            verified_id = verify_jwt_token(token)
            if verified_id:
                return verified_id
        except Exception:
            pass

    if user_id:
        return user_id

    raise HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Authentication required to access dashboard.",
    )


@router.get("/summary", response_model=DashboardSummaryResponse)
def get_dashboard_summary(
    user_id: str = Depends(get_authenticated_user_id),
):
    """
    Returns consolidated dashboard metrics for the authenticated user:
    1. Overall stats (jobs count, candidates tracked, average score, shortlists)
    2. Real-time subscription & usage credits
    3. Recent jobs with candidate stats
    4. Recent candidates evaluated
    """
    with Session(engine) as session:
        # 1. Fetch user's jobs
        jobs_query = select(Job).where(Job.user_id == user_id).order_by(Job.created_at.desc())
        jobs = session.exec(jobs_query).all()

        total_jobs = len(jobs)
        active_jobs = sum(1 for j in jobs if j.status == "active")

        # 2. Fetch user's candidates
        candidates_query = (
            select(CandidateEvaluation)
            .where(CandidateEvaluation.user_id == user_id)
            .order_by(CandidateEvaluation.created_at.desc())
        )
        all_candidates = session.exec(candidates_query).all()

        total_candidates = len(all_candidates)
        shortlisted_candidates = sum(1 for c in all_candidates if c.hiring_status == "shortlisted")
        avg_score = (
            round(sum(c.match_score for c in all_candidates) / total_candidates, 1)
            if total_candidates > 0
            else 0.0
        )

        stats = DashboardStats(
            total_jobs=total_jobs,
            active_jobs=active_jobs,
            total_candidates=total_candidates,
            shortlisted_candidates=shortlisted_candidates,
            average_score=avg_score,
        )

        # 3. Fetch subscription usage
        sub_query = select(Subscription).where(Subscription.user_id == user_id)
        sub = session.exec(sub_query).first()

        plan_key = (sub.plan if sub else "starter").strip().lower()
        limit = PLAN_LIMITS.get(plan_key, 10)
        credits_used = sub.evaluations_used if sub else 0
        credits_remaining = max(0, limit - credits_used)
        percent_used = round(min(100.0, (credits_used / limit) * 100), 1) if limit > 0 else 0.0

        usage = DashboardUsage(
            plan=plan_key,
            plan_name=f"{plan_key.replace('_', ' ').replace('-', ' ').title()} Plan",
            credits_used=credits_used,
            total_credits=limit,
            credits_remaining=credits_remaining,
            percent_used=percent_used,
            interval=sub.interval if sub else "month",
            current_period_end=sub.current_period_end if sub else None,
        )

        # Map job lookup for fast candidate job title association
        job_map = {j.id: j.title for j in jobs}

        # 4. Map recent jobs
        recent_jobs: List[JobResponse] = []
        for job in jobs[:6]:
            job_cands = [c for c in all_candidates if c.job_id == job.id]
            c_count = len(job_cands)
            job_avg = round(sum(c.match_score for c in job_cands) / c_count, 1) if c_count > 0 else 0.0
            strong_count = sum(1 for c in job_cands if c.fit_rating and "strong" in c.fit_rating.lower())

            recent_jobs.append(
                JobResponse(
                    id=job.id,
                    user_id=job.user_id,
                    title=job.title,
                    department=job.department,
                    seniority=job.seniority,
                    min_experience_years=job.min_experience_years,
                    required_skills=job.required_skills or [],
                    job_description=job.job_description or "",
                    custom_criteria=job.custom_criteria or "",
                    status=job.status,
                    created_at=job.created_at,
                    updated_at=job.updated_at,
                    candidates_count=c_count,
                    avg_score=job_avg,
                    strong_fits_count=strong_count,
                )
            )

        # 5. Map recent candidates
        recent_candidates: List[CandidateResponse] = []
        for c in all_candidates[:10]:
            recent_candidates.append(
                CandidateResponse(
                    id=c.id,
                    job_id=c.job_id,
                    user_id=c.user_id,
                    candidate_name=c.candidate_name,
                    candidate_email=c.candidate_email,
                    resume_snippet=c.resume_snippet,
                    resume_raw_text=c.resume_raw_text,
                    match_score=c.match_score,
                    fit_rating=c.fit_rating,
                    verdict_badge=c.verdict_badge,
                    executive_summary=c.executive_summary,
                    strengths=c.strengths or [],
                    gaps_and_risks=c.gaps_and_risks or [],
                    rubric_scores=c.rubric_scores or {},
                    interview_questions=c.interview_questions or [],
                    skill_matrix=c.skill_matrix or [],
                    hiring_status=c.hiring_status,
                    created_at=c.created_at,
                    updated_at=c.updated_at,
                    job_title=job_map.get(c.job_id, "Archived Job"),
                )
            )

        return DashboardSummaryResponse(
            stats=stats,
            usage=usage,
            recent_jobs=recent_jobs,
            recent_candidates=recent_candidates,
        )
