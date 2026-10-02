import logging
from typing import Optional, List
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, Query, status, Header
from sqlmodel import Session, select, func

from models import engine, Job, CandidateEvaluation
from auth import verify_jwt_token
from schemas import (
    JobCreate,
    JobUpdate,
    JobResponse,
    CandidateCreate,
    CandidateStatusUpdate,
    CandidateResponse,
)

logger = logging.getLogger("jobs")
logger.setLevel(logging.INFO)

router = APIRouter(prefix="/jobs", tags=["Jobs"])
candidates_router = APIRouter(prefix="/candidates", tags=["Candidates"])


def get_authenticated_user_id(
    authorization: Optional[str] = Header(None),
    user_id: Optional[str] = Query(None),
) -> str:
    """
    Extracts authenticated user from Authorization Bearer token,
    or falls back to explicit user_id query parameter.
    """
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
        detail="Authentication required to access job resources.",
    )


# ==============================================================================
# JOBS CRUD
# ==============================================================================

@router.get("", response_model=List[JobResponse])
def list_jobs(
    user_id: str = Depends(get_authenticated_user_id),
    status_filter: Optional[str] = Query(None, alias="status"),
):
    """
    Lists all jobs created by the authenticated user with aggregated metrics
    (candidates count, average match score, strong fits count).
    """
    with Session(engine) as session:
        query = select(Job).where(Job.user_id == user_id)
        if status_filter and status_filter.lower() != "all":
            query = query.where(Job.status == status_filter)
        query = query.order_by(Job.created_at.desc())
        jobs = session.exec(query).all()

        responses = []
        for job in jobs:
            # Aggregate candidate metrics for each job
            cand_query = select(CandidateEvaluation).where(CandidateEvaluation.job_id == job.id)
            cands = session.exec(cand_query).all()

            cand_count = len(cands)
            avg_score = round(sum(c.match_score for c in cands) / cand_count, 1) if cand_count > 0 else 0.0
            strong_fits = sum(1 for c in cands if c.fit_rating and "strong" in c.fit_rating.lower())

            responses.append(
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
                    candidates_count=cand_count,
                    avg_score=avg_score,
                    strong_fits_count=strong_fits,
                )
            )

        return responses


@router.post("", response_model=JobResponse, status_code=status.HTTP_201_CREATED)
def create_job(
    body: JobCreate,
    user_id: str = Depends(get_authenticated_user_id),
):
    """
    Creates a new job position for the authenticated recruiter.
    """
    with Session(engine) as session:
        new_job = Job(
            user_id=user_id,
            title=body.title.strip(),
            department=body.department.strip() if body.department else None,
            seniority=body.seniority,
            min_experience_years=body.min_experience_years,
            required_skills=body.required_skills,
            job_description=body.job_description,
            custom_criteria=body.custom_criteria,
            status=body.status or "active",
        )
        session.add(new_job)
        session.commit()
        session.refresh(new_job)

        return JobResponse(
            id=new_job.id,
            user_id=new_job.user_id,
            title=new_job.title,
            department=new_job.department,
            seniority=new_job.seniority,
            min_experience_years=new_job.min_experience_years,
            required_skills=new_job.required_skills or [],
            job_description=new_job.job_description or "",
            custom_criteria=new_job.custom_criteria or "",
            status=new_job.status,
            created_at=new_job.created_at,
            updated_at=new_job.updated_at,
            candidates_count=0,
            avg_score=0.0,
            strong_fits_count=0,
        )


@router.get("/{job_id}", response_model=JobResponse)
def get_job(
    job_id: str,
    user_id: str = Depends(get_authenticated_user_id),
):
    """
    Fetches a specific job and its candidate metrics.
    """
    with Session(engine) as session:
        job = session.exec(select(Job).where(Job.id == job_id, Job.user_id == user_id)).first()
        if not job:
            raise HTTPException(status_code=404, detail="Job not found.")

        cand_query = select(CandidateEvaluation).where(CandidateEvaluation.job_id == job.id)
        cands = session.exec(cand_query).all()
        cand_count = len(cands)
        avg_score = round(sum(c.match_score for c in cands) / cand_count, 1) if cand_count > 0 else 0.0
        strong_fits = sum(1 for c in cands if c.fit_rating and "strong" in c.fit_rating.lower())

        return JobResponse(
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
            candidates_count=cand_count,
            avg_score=avg_score,
            strong_fits_count=strong_fits,
        )


@router.patch("/{job_id}", response_model=JobResponse)
def update_job(
    job_id: str,
    body: JobUpdate,
    user_id: str = Depends(get_authenticated_user_id),
):
    """
    Updates a job's details or status (e.g., active, paused, archived).
    """
    with Session(engine) as session:
        job = session.exec(select(Job).where(Job.id == job_id, Job.user_id == user_id)).first()
        if not job:
            raise HTTPException(status_code=404, detail="Job not found.")

        if body.title is not None:
            job.title = body.title.strip()
        if body.department is not None:
            job.department = body.department.strip()
        if body.seniority is not None:
            job.seniority = body.seniority
        if body.min_experience_years is not None:
            job.min_experience_years = body.min_experience_years
        if body.required_skills is not None:
            job.required_skills = body.required_skills
        if body.job_description is not None:
            job.job_description = body.job_description
        if body.custom_criteria is not None:
            job.custom_criteria = body.custom_criteria
        if body.status is not None:
            job.status = body.status

        job.updated_at = datetime.utcnow()
        session.add(job)
        session.commit()
        session.refresh(job)

        cand_query = select(CandidateEvaluation).where(CandidateEvaluation.job_id == job.id)
        cands = session.exec(cand_query).all()
        cand_count = len(cands)
        avg_score = round(sum(c.match_score for c in cands) / cand_count, 1) if cand_count > 0 else 0.0
        strong_fits = sum(1 for c in cands if c.fit_rating and "strong" in c.fit_rating.lower())

        return JobResponse(
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
            candidates_count=cand_count,
            avg_score=avg_score,
            strong_fits_count=strong_fits,
        )


@router.delete("/{job_id}")
def delete_job(
    job_id: str,
    user_id: str = Depends(get_authenticated_user_id),
):
    """
    Deletes a job and cascade deletes all candidate evaluations tracked under it.
    """
    with Session(engine) as session:
        job = session.exec(select(Job).where(Job.id == job_id, Job.user_id == user_id)).first()
        if not job:
            raise HTTPException(status_code=404, detail="Job not found.")

        # Delete all candidate evaluations under this job
        candidates = session.exec(select(CandidateEvaluation).where(CandidateEvaluation.job_id == job_id)).all()
        for cand in candidates:
            session.delete(cand)

        session.delete(job)
        session.commit()

        return {"status": "success", "message": f"Job {job_id} and {len(candidates)} candidate records deleted."}


# ==============================================================================
# CANDIDATES UNDER JOB
# ==============================================================================

@router.get("/{job_id}/candidates", response_model=List[CandidateResponse])
def list_job_candidates(
    job_id: str,
    user_id: str = Depends(get_authenticated_user_id),
    status_filter: Optional[str] = Query(None, alias="status"),
    fit_filter: Optional[str] = Query(None, alias="fit"),
):
    """
    Lists all candidates evaluated and tracked under a specific job.
    Supports filtering by hiring status and fit rating.
    """
    with Session(engine) as session:
        job = session.exec(select(Job).where(Job.id == job_id, Job.user_id == user_id)).first()
        if not job:
            raise HTTPException(status_code=404, detail="Job not found.")

        query = select(CandidateEvaluation).where(CandidateEvaluation.job_id == job_id)
        if status_filter and status_filter.lower() != "all":
            query = query.where(CandidateEvaluation.hiring_status == status_filter.lower())
        if fit_filter and fit_filter.lower() != "all":
            query = query.where(CandidateEvaluation.fit_rating.ilike(f"%{fit_filter}%"))

        query = query.order_by(CandidateEvaluation.created_at.desc())
        candidates = session.exec(query).all()

        return [
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
                job_title=job.title,
            )
            for c in candidates
        ]


@router.post("/{job_id}/candidates", response_model=CandidateResponse, status_code=status.HTTP_201_CREATED)
def add_candidate_to_job(
    job_id: str,
    body: CandidateCreate,
    user_id: str = Depends(get_authenticated_user_id),
):
    """
    Manually creates or persists a candidate evaluation record under a job.
    """
    with Session(engine) as session:
        job = session.exec(select(Job).where(Job.id == job_id, Job.user_id == user_id)).first()
        if not job:
            raise HTTPException(status_code=404, detail="Job not found.")

        candidate = CandidateEvaluation(
            job_id=job_id,
            user_id=user_id,
            candidate_name=body.candidate_name,
            candidate_email=body.candidate_email,
            resume_snippet=body.resume_snippet,
            resume_raw_text=body.resume_raw_text,
            match_score=body.match_score,
            fit_rating=body.fit_rating,
            verdict_badge=body.verdict_badge,
            executive_summary=body.executive_summary,
            strengths=body.strengths,
            gaps_and_risks=body.gaps_and_risks,
            rubric_scores=body.rubric_scores,
            interview_questions=body.interview_questions,
            skill_matrix=body.skill_matrix,
            hiring_status=body.hiring_status or "screened",
        )
        session.add(candidate)
        session.commit()
        session.refresh(candidate)

        return CandidateResponse(
            id=candidate.id,
            job_id=candidate.job_id,
            user_id=candidate.user_id,
            candidate_name=candidate.candidate_name,
            candidate_email=candidate.candidate_email,
            resume_snippet=candidate.resume_snippet,
            resume_raw_text=candidate.resume_raw_text,
            match_score=candidate.match_score,
            fit_rating=candidate.fit_rating,
            verdict_badge=candidate.verdict_badge,
            executive_summary=candidate.executive_summary,
            strengths=candidate.strengths or [],
            gaps_and_risks=candidate.gaps_and_risks or [],
            rubric_scores=candidate.rubric_scores or {},
            interview_questions=candidate.interview_questions or [],
            skill_matrix=candidate.skill_matrix or [],
            hiring_status=candidate.hiring_status,
            created_at=candidate.created_at,
            updated_at=candidate.updated_at,
            job_title=job.title,
        )


# ==============================================================================
# CANDIDATE ACTIONS
# ==============================================================================

@candidates_router.patch("/{candidate_id}/status", response_model=CandidateResponse)
def update_candidate_status(
    candidate_id: str,
    body: CandidateStatusUpdate,
    user_id: str = Depends(get_authenticated_user_id),
):
    """
    Updates the hiring stage of an evaluated candidate (e.g. screened -> shortlisted -> rejected).
    """
    with Session(engine) as session:
        candidate = session.exec(
            select(CandidateEvaluation).where(
                CandidateEvaluation.id == candidate_id,
                CandidateEvaluation.user_id == user_id,
            )
        ).first()

        if not candidate:
            raise HTTPException(status_code=404, detail="Candidate record not found.")

        candidate.hiring_status = body.hiring_status.strip().lower()
        candidate.updated_at = datetime.utcnow()
        session.add(candidate)
        session.commit()
        session.refresh(candidate)

        job = session.exec(select(Job).where(Job.id == candidate.job_id)).first()
        job_title = job.title if job else None

        return CandidateResponse(
            id=candidate.id,
            job_id=candidate.job_id,
            user_id=candidate.user_id,
            candidate_name=candidate.candidate_name,
            candidate_email=candidate.candidate_email,
            resume_snippet=candidate.resume_snippet,
            resume_raw_text=candidate.resume_raw_text,
            match_score=candidate.match_score,
            fit_rating=candidate.fit_rating,
            verdict_badge=candidate.verdict_badge,
            executive_summary=candidate.executive_summary,
            strengths=candidate.strengths or [],
            gaps_and_risks=candidate.gaps_and_risks or [],
            rubric_scores=candidate.rubric_scores or {},
            interview_questions=candidate.interview_questions or [],
            skill_matrix=candidate.skill_matrix or [],
            hiring_status=candidate.hiring_status,
            created_at=candidate.created_at,
            updated_at=candidate.updated_at,
            job_title=job_title,
        )


@candidates_router.delete("/{candidate_id}")
def delete_candidate(
    candidate_id: str,
    user_id: str = Depends(get_authenticated_user_id),
):
    """
    Deletes a candidate evaluation record.
    """
    with Session(engine) as session:
        candidate = session.exec(
            select(CandidateEvaluation).where(
                CandidateEvaluation.id == candidate_id,
                CandidateEvaluation.user_id == user_id,
            )
        ).first()

        if not candidate:
            raise HTTPException(status_code=404, detail="Candidate record not found.")

        session.delete(candidate)
        session.commit()
        return {"status": "success", "message": f"Candidate {candidate_id} removed."}
