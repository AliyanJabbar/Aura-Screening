import os
import uuid
from datetime import datetime
from enum import Enum
from typing import Optional, List, Dict, Any
from sqlmodel import SQLModel, Field, create_engine, Session
from dotenv import load_dotenv
from sqlalchemy import text, Column, JSON

load_dotenv()
# Environment Configuration
DATABASE_URL = os.getenv("DATABASE_URL")
engine = create_engine(
    DATABASE_URL,
    pool_pre_ping=True,
    pool_recycle=300,
)

# --- PHASE II MODELS (Legacy Support) ---
class Category(str, Enum):
    backlog = "backlog"
    todo = "todo"
    doing = "doing"
    done = "done"

class Todo(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    title: str = Field(index=True)
    category: Category = Field(default=Category.backlog)
    user_id: str = Field(index=True)

class TodoCreate(SQLModel):
    title: str
    category: Category = Category.backlog

# --- PHASE III MODELS (AI Chatbot) ---
class Task(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: str = Field(index=True)
    title: str
    description: Optional[str] = None
    completed: bool = Field(default=False)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

class Conversation(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: str = Field(index=True)
    created_at: datetime = Field(default_factory=datetime.utcnow)

class Message(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    conversation_id: int = Field(foreign_key="conversation.id")
    role: str # 'user' or 'assistant'
    content: str
    created_at: datetime = Field(default_factory=datetime.utcnow)


# --- SUBSCRIPTION & PAYMENT MODELS ---
class Subscription(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: str = Field(index=True)
    stripe_customer_id: Optional[str] = Field(default=None, index=True)
    stripe_subscription_id: Optional[str] = Field(default=None, index=True)
    stripe_session_id: Optional[str] = Field(default=None, index=True)
    plan: str = Field(default="pro")
    interval: str = Field(default="month")  # month or year
    status: str = Field(default="active")   # active, past_due, canceled, trialing, incomplete
    amount: Optional[int] = Field(default=None)
    currency: Optional[str] = Field(default="usd")
    evaluations_used: int = Field(default=0)
    current_period_end: Optional[datetime] = Field(default=None)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)


# --- RECRUITER WORKSPACE & CANDIDATE TRACKING MODELS ---
class Job(SQLModel, table=True):
    __tablename__ = "job"
    id: str = Field(default_factory=lambda: str(uuid.uuid4()), primary_key=True)
    user_id: str = Field(index=True)
    title: str = Field(index=True)
    department: Optional[str] = Field(default=None)
    seniority: str = Field(default="Senior")
    min_experience_years: float = Field(default=3.0)
    required_skills: List[str] = Field(default_factory=list, sa_column=Column(JSON))
    job_description: Optional[str] = Field(default="")
    custom_criteria: Optional[str] = Field(default="")
    status: str = Field(default="active")  # active, paused, archived
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)


class CandidateEvaluation(SQLModel, table=True):
    __tablename__ = "candidate_evaluation"
    id: str = Field(default_factory=lambda: str(uuid.uuid4()), primary_key=True)
    job_id: str = Field(foreign_key="job.id", index=True)
    user_id: str = Field(index=True)
    candidate_name: str = Field(index=True)
    candidate_email: Optional[str] = Field(default=None)
    resume_snippet: Optional[str] = Field(default=None)
    resume_raw_text: Optional[str] = Field(default=None)
    match_score: int = Field(default=0)
    fit_rating: str = Field(default="Moderate Fit")
    verdict_badge: str = Field(default="POTENTIAL CANDIDATE")
    executive_summary: Optional[str] = Field(default=None)
    strengths: List[str] = Field(default_factory=list, sa_column=Column(JSON))
    gaps_and_risks: List[str] = Field(default_factory=list, sa_column=Column(JSON))
    rubric_scores: Optional[Dict[str, Any]] = Field(default_factory=dict, sa_column=Column(JSON))
    interview_questions: List[Dict[str, Any]] = Field(default_factory=list, sa_column=Column(JSON))
    skill_matrix: List[Dict[str, Any]] = Field(default_factory=list, sa_column=Column(JSON))
    hiring_status: str = Field(default="screened")  # screened, shortlisted, interviewed, rejected
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)


def init_db():
    SQLModel.metadata.create_all(engine)
    try:
        with engine.connect() as conn:
            conn.execute(text("ALTER TABLE subscription ADD COLUMN IF NOT EXISTS evaluations_used INTEGER DEFAULT 0;"))
            conn.commit()
    except Exception:
        pass

def get_session():
    with Session(engine) as session:
        yield session