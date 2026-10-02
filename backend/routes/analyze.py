import time
from typing import Optional
from fastapi import APIRouter, HTTPException, Header, Depends
from sqlmodel import Session, select

from schemas import AnalyzeResumeRequest, AnalyzeResumeResponse
from services.analysis_service import run_llm_agent_analysis, run_local_python_analysis
from models import engine, Job, CandidateEvaluation, Subscription
from routes.payments import get_optional_current_user, PLAN_LIMITS

router = APIRouter(tags=["Analyze"])


def save_candidate_to_database(
    analysis_data: dict,
    request: AnalyzeResumeRequest,
    user_id: str,
) -> Optional[CandidateEvaluation]:
    """
    Persists evaluation results to a Job and CandidateEvaluation record in PostgreSQL.
    If no job_id is provided, automatically finds or creates a Job matching job_title.
    """
    try:
        with Session(engine) as db_session:
            job = None
            if request.job_id:
                job = db_session.exec(select(Job).where(Job.id == request.job_id, Job.user_id == user_id)).first()

            if not job:
                # Find existing active job with same title or create a new job
                job = db_session.exec(
                    select(Job).where(Job.user_id == user_id, Job.title == request.job_title.strip())
                ).first()

            if not job:
                job = Job(
                    user_id=user_id,
                    title=request.job_title.strip(),
                    seniority=request.seniority or "Senior",
                    min_experience_years=request.min_experience_years or 3.0,
                    required_skills=request.required_skills or [],
                    job_description=request.job_description or "",
                    custom_criteria=request.custom_criteria or "",
                    status="active",
                )
                db_session.add(job)
                db_session.commit()
                db_session.refresh(job)

            # Convert rubricScores to dict if needed
            rubric_dict = analysis_data.get("rubricScores")
            if hasattr(rubric_dict, "model_dump"):
                rubric_dict = rubric_dict.model_dump()
            elif hasattr(rubric_dict, "dict"):
                rubric_dict = rubric_dict.dict()

            skill_matrix_list = analysis_data.get("skillMatrix", [])
            skill_matrix_dump = [
                s.model_dump() if hasattr(s, "model_dump") else (s.dict() if hasattr(s, "dict") else s)
                for s in skill_matrix_list
            ]

            interview_q_list = analysis_data.get("interviewQuestions", [])
            interview_q_dump = [
                q.model_dump() if hasattr(q, "model_dump") else (q.dict() if hasattr(q, "dict") else q)
                for q in interview_q_list
            ]

            candidate = CandidateEvaluation(
                job_id=job.id,
                user_id=user_id,
                candidate_name=analysis_data.get("candidateName") or request.candidate_name or "Candidate",
                candidate_email=request.candidate_email,
                resume_snippet=request.resume_text[:250].strip() + "...",
                resume_raw_text=request.resume_text,
                match_score=analysis_data.get("overallScore", 0),
                fit_rating=analysis_data.get("fitRating", "Moderate Fit"),
                verdict_badge=analysis_data.get("verdictBadge", "POTENTIAL CANDIDATE"),
                executive_summary=analysis_data.get("executiveSummary", ""),
                strengths=analysis_data.get("strengths", []),
                gaps_and_risks=analysis_data.get("gapsAndRisks", []),
                rubric_scores=rubric_dict or {},
                interview_questions=interview_q_dump,
                skill_matrix=skill_matrix_dump,
                hiring_status="screened",
            )
            db_session.add(candidate)

            # Auto-increment evaluations_used on user's subscription
            sub = db_session.exec(select(Subscription).where(Subscription.user_id == user_id)).first()
            if sub:
                sub.evaluations_used = (sub.evaluations_used or 0) + 1
                db_session.add(sub)
            else:
                new_sub = Subscription(
                    user_id=user_id,
                    plan="starter",
                    status="active",
                    evaluations_used=1,
                )
                db_session.add(new_sub)

            db_session.commit()
            db_session.refresh(candidate)
            return candidate
    except Exception as e:
        print(f"Error persisting candidate evaluation: {e}")
        return None


@router.post("/analyze-resume", response_model=AnalyzeResumeResponse)
async def analyze_resume(
    request: AnalyzeResumeRequest,
    authenticated_user_id: Optional[str] = Depends(get_optional_current_user),
):
    """
    Endpoint 2: Analyze Resume Based on Criteria
    Evaluates candidate's resume text against job requirements, skills, experience thresholds, and criteria.
    Uses Groq for autonomous LLM screening, with local Python engine fallback.
    Automatically persists candidate evaluation to the user's Job in PostgreSQL if authenticated or user_id provided.
    """
    start_time = time.time()
    
    resume_text = request.resume_text.strip()
    if not resume_text or len(resume_text) < 30:
        raise HTTPException(status_code=400, detail="Resume text is too short to perform criteria evaluation.")

    if not request.job_title.strip():
        raise HTTPException(status_code=400, detail="Target job_title is required.")

    effective_user_id = authenticated_user_id or request.user_id

    # 1. Autonomous LLM Agent Analysis (Groq)
    result_data = None
    try:
        agent_result = await run_llm_agent_analysis(request)
        if agent_result:
            execution_time = int((time.time() - start_time) * 1000)
            agent_result["metadata"]["executionTimeMs"] = execution_time
            result_data = agent_result
    except Exception as e:
        print(f"Agent screening error, falling back to local Python engine: {e}")

    # 2. Local Python Intelligent Reasoning Engine Fallback
    if not result_data:
        result_data = run_local_python_analysis(request, start_time)

    # 3. Auto-persist candidate tracking in database if user is known
    candidate_id = None
    saved_job_id = request.job_id
    if effective_user_id and result_data:
        saved_cand = save_candidate_to_database(result_data, request, effective_user_id)
        if saved_cand:
            candidate_id = saved_cand.id
            saved_job_id = saved_cand.job_id

    result_data["candidate_id"] = candidate_id
    result_data["job_id"] = saved_job_id

    return AnalyzeResumeResponse(**result_data)


