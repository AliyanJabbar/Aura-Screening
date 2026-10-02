from datetime import datetime
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field


class LinkExtractRequest(BaseModel):
    url: str = Field(..., example="https://raw.githubusercontent.com/user/repo/main/cv.txt")


class ExtractResumeResponse(BaseModel):
    success: bool
    candidate_name: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    links: List[str] = Field(default_factory=list)
    professional_summary: Optional[str] = None
    skills: List[str] = Field(default_factory=list)
    total_experience_years: float = 0.0
    work_experience: List[Dict[str, Any]] = Field(default_factory=list)
    education: List[Dict[str, Any]] = Field(default_factory=list)
    certifications: List[str] = Field(default_factory=list)
    word_count: int = 0
    raw_text: str = ""


class AnalyzeResumeRequest(BaseModel):
    resume_text: str = Field(..., description="Raw text of candidate's CV/Resume")
    job_title: str = Field(..., description="Target job title", example="Senior Full-Stack Engineer")
    seniority: str = Field(default="Senior", description="Seniority level e.g. Junior, Mid, Senior, Lead")
    required_skills: List[str] = Field(default_factory=list, description="List of required skill tags")
    min_experience_years: float = Field(default=3.0, description="Minimum required years of experience")
    job_description: Optional[str] = Field(default="", description="Full job description text")
    custom_criteria: Optional[str] = Field(default="", description="Custom agent guidelines or rules")
    candidate_name: Optional[str] = Field(default=None, description="Optional override for candidate name")
    candidate_email: Optional[str] = Field(default=None, description="Optional candidate contact email")
    job_id: Optional[str] = Field(default=None, description="Optional associated Job ID to track candidate in database")
    user_id: Optional[str] = Field(default=None, description="Optional User ID for tracking")


class SkillMatchItem(BaseModel):
    skill: str
    required: bool = True
    status: str  # "matched" | "partial" | "missing"
    evidence: Optional[str] = None


class RubricCategory(BaseModel):
    score: int
    comment: str


class RubricScores(BaseModel):
    technicalCompetency: RubricCategory
    experienceFit: RubricCategory
    educationAndCredentials: RubricCategory
    roleAlignment: RubricCategory
    softSkills: RubricCategory


class InterviewQuestionItem(BaseModel):
    question: str
    targetArea: str
    rationale: str


class AnalyzeResumeResponse(BaseModel):
    success: bool = True
    candidateName: str
    overallScore: int  # 0 to 100
    verdictBadge: str  # "RECOMMENDED FOR INTERVIEW" | "POTENTIAL CANDIDATE" | "HIGH RISK / UNMATCHED"
    fitRating: str  # "A+" | "A" | "B+" | "B" | "C" | "F"
    executiveSummary: str
    skillMatrix: List[SkillMatchItem]
    strengths: List[str]
    gapsAndRisks: List[str]
    rubricScores: RubricScores
    interviewQuestions: List[InterviewQuestionItem]
    metadata: Dict[str, Any]
    candidate_id: Optional[str] = None
    job_id: Optional[str] = None


# --- JOB SCHEMAS ---
class JobCreate(BaseModel):
    title: str = Field(..., description="Job Title e.g. Senior Backend Engineer")
    department: Optional[str] = Field(default=None)
    seniority: str = Field(default="Senior")
    min_experience_years: float = Field(default=3.0)
    required_skills: List[str] = Field(default_factory=list)
    job_description: Optional[str] = Field(default="")
    custom_criteria: Optional[str] = Field(default="")
    status: str = Field(default="active")


class JobUpdate(BaseModel):
    title: Optional[str] = None
    department: Optional[str] = None
    seniority: Optional[str] = None
    min_experience_years: Optional[float] = None
    required_skills: Optional[List[str]] = None
    job_description: Optional[str] = None
    custom_criteria: Optional[str] = None
    status: Optional[str] = None


class JobResponse(BaseModel):
    id: str
    user_id: str
    title: str
    department: Optional[str] = None
    seniority: str
    min_experience_years: float
    required_skills: List[str]
    job_description: Optional[str] = ""
    custom_criteria: Optional[str] = ""
    status: str
    created_at: datetime
    updated_at: datetime
    candidates_count: int = 0
    avg_score: float = 0.0
    strong_fits_count: int = 0


# --- CANDIDATE SCHEMAS ---
class CandidateCreate(BaseModel):
    job_id: str
    candidate_name: str
    candidate_email: Optional[str] = None
    resume_snippet: Optional[str] = None
    resume_raw_text: Optional[str] = None
    match_score: int = 0
    fit_rating: str = "Moderate Fit"
    verdict_badge: str = "POTENTIAL CANDIDATE"
    executive_summary: Optional[str] = None
    strengths: List[str] = Field(default_factory=list)
    gaps_and_risks: List[str] = Field(default_factory=list)
    rubric_scores: Optional[Dict[str, Any]] = Field(default_factory=dict)
    interview_questions: List[Dict[str, Any]] = Field(default_factory=list)
    skill_matrix: List[Dict[str, Any]] = Field(default_factory=list)
    hiring_status: str = "screened"


class CandidateStatusUpdate(BaseModel):
    hiring_status: str = Field(..., description="screened | shortlisted | interviewed | rejected")


class CandidateResponse(BaseModel):
    id: str
    job_id: str
    user_id: str
    candidate_name: str
    candidate_email: Optional[str] = None
    resume_snippet: Optional[str] = None
    resume_raw_text: Optional[str] = None
    match_score: int
    fit_rating: str
    verdict_badge: str
    executive_summary: Optional[str] = None
    strengths: List[str]
    gaps_and_risks: List[str]
    rubric_scores: Optional[Dict[str, Any]] = None
    interview_questions: List[Dict[str, Any]] = Field(default_factory=list)
    skill_matrix: List[Dict[str, Any]] = Field(default_factory=list)
    hiring_status: str
    created_at: datetime
    updated_at: datetime
    job_title: Optional[str] = None


# --- DASHBOARD STATS SCHEMAS ---
class DashboardStats(BaseModel):
    total_jobs: int = 0
    active_jobs: int = 0
    total_candidates: int = 0
    shortlisted_candidates: int = 0
    average_score: float = 0.0


class DashboardUsage(BaseModel):
    plan: str
    plan_name: str
    credits_used: int
    total_credits: int
    credits_remaining: int
    percent_used: float
    interval: str
    current_period_end: Optional[datetime] = None


class DashboardSummaryResponse(BaseModel):
    stats: DashboardStats
    usage: DashboardUsage
    recent_jobs: List[JobResponse]
    recent_candidates: List[CandidateResponse]

