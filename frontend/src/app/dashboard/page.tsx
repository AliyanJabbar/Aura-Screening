"use client";

import React, { useEffect, useState, useMemo, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "motion/react";
import { useSession } from "@/lib/auth-client";
import Navbar from "@/components/layout/navbar";
import {
  Briefcase,
  Users,
  Zap,
  Award,
  Plus,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  ChevronRight,
  ExternalLink,
  Sparkles,
  ArrowUpRight,
  Trash2,
  FileText,
  SlidersHorizontal,
  ChevronDown,
  X,
  Copy,
  Download,
  AlertCircle,
  HelpCircle,
  TrendingUp,
  Flame,
  ArrowLeft,
} from "lucide-react";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";
import JobTitleAutocomplete from "@/components/ui/job-title-autocomplete";
import { JobTitleOption } from "@/lib/job-titles";

// Types
interface JobData {
  id: string;
  user_id: string;
  title: string;
  department?: string | null;
  seniority: string;
  min_experience_years: number;
  required_skills: string[];
  job_description?: string;
  custom_criteria?: string;
  status: string;
  created_at: string;
  updated_at: string;
  candidates_count: number;
  avg_score: number;
  strong_fits_count: number;
}

interface CandidateData {
  id: string;
  job_id: string;
  user_id: string;
  candidate_name: string;
  candidate_email?: string | null;
  resume_snippet?: string | null;
  resume_raw_text?: string | null;
  match_score: number;
  fit_rating: string;
  verdict_badge: string;
  executive_summary?: string | null;
  strengths: string[];
  gaps_and_risks: string[];
  rubric_scores?: any;
  interview_questions: any[];
  skill_matrix: any[];
  hiring_status: string;
  created_at: string;
  updated_at: string;
  job_title?: string | null;
}

interface DashboardSummary {
  stats: {
    total_jobs: number;
    active_jobs: number;
    total_candidates: number;
    shortlisted_candidates: number;
    average_score: number;
  };
  usage: {
    plan: string;
    plan_name: string;
    credits_used: number;
    total_credits: number;
    credits_remaining: number;
    percent_used: number;
    interval: string;
    current_period_end: string | null;
  };
  recent_jobs: JobData[];
  recent_candidates: CandidateData[];
}

const PRESET_TEMPLATES = [
  {
    title: "Senior Full-Stack Engineer",
    seniority: "Senior",
    minExp: 5,
    skills: ["React", "TypeScript", "Node.js", "PostgreSQL", "Docker"],
    description: "Seeking a senior full-stack engineer to lead core architecture, develop high-throughput microservices, and design responsive user interfaces.",
    criteria: "Prioritize production distributed systems experience, cloud deployments (AWS/GCP), and clean code craftsmanship.",
  },
  {
    title: "Lead AI & Data Scientist",
    seniority: "Lead",
    minExp: 6,
    skills: ["Python", "PyTorch", "LLMs", "FastAPI", "RAG Systems"],
    description: "Looking for an AI expert to build and scale LLM pipelines, autonomous agents, and custom fine-tuned transformer architectures.",
    criteria: "Focus on real-world generative AI deployments, vector databases, and demonstrable production machine learning systems.",
  },
  {
    title: "Principal DevOps / Cloud Architect",
    seniority: "Principal",
    minExp: 8,
    skills: ["Kubernetes", "Terraform", "AWS", "CI/CD", "Security Compliance"],
    description: "Architecting zero-downtime multi-region Kubernetes clusters, security hardening, and high-velocity developer infrastructure.",
    criteria: "Look for deep container orchestration expertise, multi-cloud disaster recovery, and infrastructure-as-code mastery.",
  },
];

const BACKEND_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  process.env.NEXT_PUBLIC_BACKEND_URL ||
  "https://aura-screening.fastapicloud.dev";

function DashboardContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryJobId = searchParams.get("job_id");
  const { data: sessionData, isPending: isAuthPending } = useSession();
  const user = sessionData?.user;

  // Dashboard Data State
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [jobs, setJobs] = useState<JobData[]>([]);
  const [selectedJob, setSelectedJob] = useState<JobData | null>(null);
  const [candidates, setCandidates] = useState<CandidateData[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingCandidates, setLoadingCandidates] = useState(false);

  // Filters & Search
  const [jobSearch, setJobSearch] = useState("");
  const [candidateSearch, setCandidateSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [candidateHiringFilter, setCandidateHiringFilter] = useState("all");

  // Modals
  const [isCreateJobOpen, setIsCreateJobOpen] = useState(false);
  const [selectedCandidate, setSelectedCandidate] = useState<CandidateData | null>(null);

  // New Job Form State
  const [newTitle, setNewTitle] = useState("");
  const [newSeniority, setNewSeniority] = useState("Senior");
  const [newMinExp, setNewMinExp] = useState(3);
  const [newSkills, setNewSkills] = useState<string[]>(["React", "TypeScript", "Node.js"]);
  const [newSkillInput, setNewSkillInput] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [newCriteria, setNewCriteria] = useState("");
  const [isSubmittingJob, setIsSubmittingJob] = useState(false);

  // Auth Headers helper
  const getHeaders = () => {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };
    if (sessionData?.session?.token) {
      headers["Authorization"] = `Bearer ${sessionData.session.token}`;
    }
    return headers;
  };

  // Fetch initial summary & jobs
  const fetchDashboardData = async (silent = false) => {
    if (!user?.id) return;
    try {
      if (!silent) setLoading(true);
      const url = `${BACKEND_URL}/dashboard/summary?user_id=${encodeURIComponent(user.id)}`;
      const res = await fetch(url, { headers: getHeaders() });
      if (!res.ok) throw new Error("Failed to load dashboard summary");
      const data: DashboardSummary = await res.json();
      setSummary(data);

      // Fetch all user jobs
      const jobsRes = await fetch(`${BACKEND_URL}/jobs?user_id=${encodeURIComponent(user.id)}`, {
        headers: getHeaders(),
      });
      if (jobsRes.ok) {
        const jobsList: JobData[] = await jobsRes.json();
        setJobs(jobsList);
        // If a specific job_id was requested in query params, prioritize selecting it
        if (queryJobId) {
          const matched = jobsList.find((j) => j.id === queryJobId);
          if (matched) {
            setSelectedJob(matched);
          } else if (jobsList.length > 0 && !selectedJob) {
            setSelectedJob(jobsList[0]);
          }
        } else if (jobsList.length > 0 && !selectedJob) {
          setSelectedJob(jobsList[0]);
        }
      }
    } catch (err: any) {
      console.error(err);
      toast.error("Could not load dashboard data right now.");
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.id) {
      fetchDashboardData();
    }
  }, [user?.id]);

  // Keep selectedJob synced if queryJobId changes or jobs reload
  useEffect(() => {
    if (queryJobId && jobs.length > 0) {
      const matched = jobs.find((j) => j.id === queryJobId);
      if (matched) {
        setSelectedJob(matched);
      }
    }
  }, [queryJobId, jobs]);

  // Fetch candidates whenever selected job changes
  useEffect(() => {
    if (!selectedJob || !user?.id) return;
    const fetchCandidates = async () => {
      try {
        setLoadingCandidates(true);
        const url = `${BACKEND_URL}/jobs/${selectedJob.id}/candidates?user_id=${encodeURIComponent(user.id)}`;
        const res = await fetch(url, { headers: getHeaders() });
        if (res.ok) {
          const list: CandidateData[] = await res.json();
          setCandidates(list);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoadingCandidates(false);
      }
    };
    fetchCandidates();
  }, [selectedJob?.id, user?.id]);

  // Candidate Status Update handler
  const handleUpdateCandidateStatus = async (candidateId: string, newStatus: string) => {
    try {
      const res = await fetch(`${BACKEND_URL}/candidates/${candidateId}/status?user_id=${encodeURIComponent(user?.id || "")}`, {
        method: "PATCH",
        headers: getHeaders(),
        body: JSON.stringify({ hiring_status: newStatus }),
      });
      if (!res.ok) throw new Error("Could not update candidate status");
      const updated = await res.json();

      setCandidates((prev) =>
        prev.map((c) => (c.id === candidateId ? { ...c, hiring_status: newStatus } : c))
      );
      if (selectedCandidate?.id === candidateId) {
        setSelectedCandidate((prev) => (prev ? { ...prev, hiring_status: newStatus } : null));
      }
      toast.success(`Candidate marked as ${newStatus}`);
      fetchDashboardData(true);
    } catch (err: any) {
      toast.error(err.message || "Failed to update status");
    }
  };

  // Delete Job Handler
  const handleDeleteJob = async (jobId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm("Are you sure you want to delete this job and all tracked candidates?")) return;
    try {
      const res = await fetch(`${BACKEND_URL}/jobs/${jobId}?user_id=${encodeURIComponent(user?.id || "")}`, {
        method: "DELETE",
        headers: getHeaders(),
      });
      if (!res.ok) throw new Error("Failed to delete job");
      toast.success("Job and candidate records deleted.");
      setJobs((prev) => prev.filter((j) => j.id !== jobId));
      if (selectedJob?.id === jobId) {
        const remaining = jobs.filter((j) => j.id !== jobId);
        setSelectedJob(remaining.length > 0 ? remaining[0] : null);
      }
      fetchDashboardData(true);
    } catch (err: any) {
      toast.error(err.message || "Error deleting job");
    }
  };

  // Add skill to tag list
  const handleAddSkill = () => {
    if (!newSkillInput.trim()) return;
    const trimmed = newSkillInput.trim();
    if (!newSkills.some((s) => s.toLowerCase() === trimmed.toLowerCase())) {
      setNewSkills([...newSkills, trimmed]);
    }
    setNewSkillInput("");
  };

  // Remove skill
  const handleRemoveSkill = (skill: string) => {
    setNewSkills(newSkills.filter((s) => s !== skill));
  };

  // Apply preset to new job
  const handleApplyPreset = (preset: (typeof PRESET_TEMPLATES)[0]) => {
    setNewTitle(preset.title);
    setNewSeniority(preset.seniority);
    setNewMinExp(preset.minExp);
    setNewSkills([...preset.skills]);
    setNewDescription(preset.description);
    setNewCriteria(preset.criteria);
    toast.success(`Applied template: ${preset.title}`);
  };

  // Create Job Handler
  const handleCreateJob = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) {
      toast.error("Please enter a job title.");
      return;
    }
    try {
      setIsSubmittingJob(true);
      const res = await fetch(`${BACKEND_URL}/jobs?user_id=${encodeURIComponent(user?.id || "")}`, {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify({
          title: newTitle.trim(),
          seniority: newSeniority,
          min_experience_years: Number(newMinExp),
          required_skills: newSkills,
          job_description: newDescription.trim(),
          custom_criteria: newCriteria.trim(),
          status: "active",
        }),
      });
      if (!res.ok) throw new Error("Failed to create job");
      const createdJob: JobData = await res.json();
      toast.success(`Job "${createdJob.title}" created successfully!`);
      setJobs([createdJob, ...jobs]);
      setSelectedJob(createdJob);
      setIsCreateJobOpen(false);

      // Reset form
      setNewTitle("");
      setNewDescription("");
      setNewCriteria("");
      fetchDashboardData(true);
    } catch (err: any) {
      toast.error(err.message || "Could not create job");
    } finally {
      setIsSubmittingJob(false);
    }
  };

  // Filtered Jobs
  const filteredJobs = useMemo(() => {
    return jobs.filter((j) => {
      const matchesSearch =
        j.title.toLowerCase().includes(jobSearch.toLowerCase()) ||
        j.required_skills?.some((s) => s.toLowerCase().includes(jobSearch.toLowerCase()));
      const matchesStatus = statusFilter === "all" || j.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [jobs, jobSearch, statusFilter]);

  // Filtered Candidates
  const filteredCandidates = useMemo(() => {
    return candidates.filter((c) => {
      const matchesSearch =
        c.candidate_name.toLowerCase().includes(candidateSearch.toLowerCase()) ||
        (c.candidate_email && c.candidate_email.toLowerCase().includes(candidateSearch.toLowerCase())) ||
        (c.verdict_badge && c.verdict_badge.toLowerCase().includes(candidateSearch.toLowerCase()));
      const matchesStatus =
        candidateHiringFilter === "all" || c.hiring_status.toLowerCase() === candidateHiringFilter.toLowerCase();
      return matchesSearch && matchesStatus;
    });
  }, [candidates, candidateSearch, candidateHiringFilter]);

  // Client-side auth protection guard
  useEffect(() => {
    if (!isAuthPending && !user) {
      router.push("/login?callbackUrl=/dashboard");
    }
  }, [isAuthPending, user, router]);

  if (isAuthPending) {
    return (
      <div className="min-h-screen bg-[#faf9f5] flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="w-8 h-8 border-2 border-[#cc785c] border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs font-mono text-[#6c6a64]">Authenticating session...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-[#faf9f5] flex items-center justify-center py-16 px-4">
        <div className="max-w-md w-full bg-white border border-[#e6dfd8] rounded-3xl p-8 sm:p-10 text-center shadow-xs">
          <div className="w-14 h-14 rounded-2xl bg-[#efe9de] text-[#141413] mx-auto flex items-center justify-center mb-5">
            <Briefcase size={28} className="text-[#cc785c]" />
          </div>
          <h2 className="font-serif text-2xl text-[#141413]">Recruiter Access Required</h2>
          <p className="text-xs text-[#6c6a64] mt-2 mb-6">
            Please log in or create an account to view your jobs, tracked candidates, and screening usage.
          </p>
          <div className="flex flex-col gap-2.5">
            <Link
              href="/login?callbackUrl=/dashboard"
              className="w-full py-3 rounded-xl bg-[#cc785c] text-white text-xs font-semibold hover:bg-[#a9583e] transition-colors"
            >
              Log In to Dashboard
            </Link>
            <Link
              href="/register?callbackUrl=/dashboard"
              className="w-full py-3 rounded-xl bg-[#efe9de] text-[#141413] text-xs font-medium hover:bg-[#e8e0d2] transition-colors border border-[#e6dfd8]"
            >
              Create Account
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#faf9f5] text-[#141413]">
      <Navbar />

      <main className="flex-1 pt-24 pb-20">
        <div className="container mx-auto px-4 sm:px-6 max-w-6xl space-y-8">

          {/* Top Header & Overview Bar */}
          <div className="border-b border-[#e6dfd8] pb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#efe9de] border border-[#e6dfd8] text-[11px] font-mono font-medium text-[#141413]">
                  <span className="w-2 h-2 rounded-full bg-[#cc785c] animate-pulse" />
                  Recruiter Workspace & Candidate ATS
                </span>
                <span className="text-xs text-[#6c6a64] font-mono">
                  Autonomous CV Screening
                </span>
              </div>
              <h1 className="font-serif text-3xl sm:text-4xl text-[#141413] tracking-tight font-normal">
                Recruitment Dashboard
              </h1>
              <p className="text-sm text-[#5e5d59] mt-1 max-w-2xl">
                Monitor jobs created, track scored candidates in each role, and review real-time AI evaluation usage.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => setIsCreateJobOpen(true)}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#cc785c] hover:bg-[#b8684e] text-white text-xs font-medium transition-all shadow-xs cursor-pointer group"
              >
                <Plus size={15} className="group-hover:rotate-90 transition-transform duration-200" />
                <span>Create New Job</span>
              </button>

              <Link
                href="/screening"
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white hover:bg-[#efe9de] border border-[#e6dfd8] text-xs font-medium text-[#141413] transition-colors shadow-xs"
              >
                <Sparkles size={14} className="text-[#cc785c]" />
                <span>Screen Candidates</span>
              </Link>
            </div>
          </div>

          {/* KPI Stat Cards (3 core details: Jobs, Candidates, Usage) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Card 1: Jobs Created */}
            <div className="bg-white border border-[#e6dfd8] rounded-2xl p-5 shadow-xs flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono uppercase tracking-wider text-[#6c6a64]">Jobs Created</span>
                <div className="w-8 h-8 rounded-xl bg-[#efe9de] flex items-center justify-center text-[#cc785c]">
                  <Briefcase size={16} />
                </div>
              </div>
              {loading ? (
                <div className="mt-3 space-y-2">
                  <div className="flex items-baseline gap-2">
                    <Skeleton className="h-8 w-14 rounded-lg" />
                    <Skeleton className="h-4 w-16 rounded-md" />
                  </div>
                  <Skeleton className="h-3 w-32 rounded-md" />
                </div>
              ) : (
                <div className="mt-3">
                  <div className="flex items-baseline gap-2">
                    <span className="font-serif text-3xl font-medium text-[#141413]">
                      {summary?.stats.total_jobs ?? jobs.length}
                    </span>
                    <span className="text-xs text-[#6c6a64]">
                      ({summary?.stats.active_jobs ?? jobs.filter(j => j.status === 'active').length} active)
                    </span>
                  </div>
                  <p className="text-[11px] text-[#5e5d59] mt-1">Open recruitment positions</p>
                </div>
              )}
            </div>

            {/* Card 2: Candidates Tracked */}
            <div className="bg-white border border-[#e6dfd8] rounded-2xl p-5 shadow-xs flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono uppercase tracking-wider text-[#6c6a64]">Candidates Tracked</span>
                <div className="w-8 h-8 rounded-xl bg-[#efe9de] flex items-center justify-center text-[#cc785c]">
                  <Users size={16} />
                </div>
              </div>
              {loading ? (
                <div className="mt-3 space-y-2">
                  <div className="flex items-baseline gap-2">
                    <Skeleton className="h-8 w-14 rounded-lg" />
                    <Skeleton className="h-5 w-24 rounded-full" />
                  </div>
                  <Skeleton className="h-3 w-32 rounded-md" />
                </div>
              ) : (
                <div className="mt-3">
                  <div className="flex items-baseline gap-2">
                    <span className="font-serif text-3xl font-medium text-[#141413]">
                      {summary?.stats.total_candidates ?? 0}
                    </span>
                    <span className="text-xs text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full font-mono">
                      {summary?.stats.shortlisted_candidates ?? 0} Shortlisted
                    </span>
                  </div>
                  <p className="text-[11px] text-[#5e5d59] mt-1">Total evaluated applicants</p>
                </div>
              )}
            </div>

            {/* Card 3: Quality Index / Avg Score */}
            <div className="bg-white border border-[#e6dfd8] rounded-2xl p-5 shadow-xs flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono uppercase tracking-wider text-[#6c6a64]">Match Quality</span>
                <div className="w-8 h-8 rounded-xl bg-[#efe9de] flex items-center justify-center text-[#cc785c]">
                  <Award size={16} />
                </div>
              </div>
              {loading ? (
                <div className="mt-3 space-y-2">
                  <div className="flex items-baseline gap-2">
                    <Skeleton className="h-8 w-16 rounded-lg" />
                    <Skeleton className="h-4 w-16 rounded-md" />
                  </div>
                  <Skeleton className="h-3 w-36 rounded-md" />
                </div>
              ) : (
                <div className="mt-3">
                  <div className="flex items-baseline gap-2">
                    <span className="font-serif text-3xl font-medium text-[#141413]">
                      {summary?.stats.average_score ?? 0}%
                    </span>
                    <span className="text-xs text-[#6c6a64]">overall avg</span>
                  </div>
                  <p className="text-[11px] text-[#5e5d59] mt-1">Multi-factor rubric benchmark</p>
                </div>
              )}
            </div>

            {/* Card 4: Usage & Quota Meter */}
            <div className="bg-white border border-[#e6dfd8] rounded-2xl p-5 shadow-xs flex flex-col justify-between relative overflow-hidden">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono uppercase tracking-wider text-[#6c6a64]">Runs & Usage</span>
                <div className="w-8 h-8 rounded-xl bg-[#efe9de] flex items-center justify-center text-[#cc785c]">
                  <Zap size={16} />
                </div>
              </div>
              {loading ? (
                <div className="mt-3 space-y-2">
                  <div className="flex items-baseline justify-between">
                    <Skeleton className="h-5 w-24 rounded-md" />
                    <Skeleton className="h-5 w-20 rounded-full" />
                  </div>
                  <Skeleton className="h-1.5 w-full rounded-full" />
                  <div className="flex items-center justify-between pt-0.5">
                    <Skeleton className="h-3 w-20 rounded-md" />
                    <Skeleton className="h-3 w-14 rounded-md" />
                  </div>
                </div>
              ) : (
                <div className="mt-3 space-y-2">
                  <div className="flex items-baseline justify-between">
                    <span className="font-mono text-sm font-bold text-[#141413]">
                      {summary?.usage.credits_remaining ?? 10}
                      <span className="text-xs font-normal text-[#6c6a64]"> / {summary?.usage.total_credits ?? 10} left</span>
                    </span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#efe9de] text-[#cc785c] font-semibold uppercase">
                      {summary?.usage.plan_name ?? "Starter Plan"}
                    </span>
                  </div>

                  {/* Progress Bar */}
                  <div className="w-full bg-[#efe9de] rounded-full h-1.5 overflow-hidden">
                    <div
                      className="bg-[#cc785c] h-1.5 rounded-full transition-all duration-500"
                      style={{
                        width: `${summary?.usage.percent_used ?? 0}%`,
                      }}
                    />
                  </div>

                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-[#6c6a64]">{summary?.usage.credits_used ?? 0} runs used</span>
                    <Link href="/profile" className="text-[#cc785c] hover:underline font-medium inline-flex items-center gap-0.5">
                      Manage <ArrowUpRight size={12} />
                    </Link>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Main 2-Column Section: Jobs Workspace & Candidates Tracker */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

            {/* LEFT COLUMN: Jobs List (4 cols on lg) */}
            <div className="lg:col-span-4 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <h2 className="font-serif text-xl text-[#141413]">Your Jobs</h2>
                  {loading ? (
                    <Skeleton className="h-5 w-8 rounded-full" />
                  ) : (
                    <span className="text-xs font-mono text-[#6c6a64]">({filteredJobs.length})</span>
                  )}
                </div>
                <button
                  onClick={() => setIsCreateJobOpen(true)}
                  className="text-xs text-[#cc785c] hover:underline font-medium inline-flex items-center gap-1"
                >
                  <Plus size={13} /> Add Job
                </button>
              </div>

              {/* Job Search & Filter */}
              <div className="relative">
                <Search size={14} className="absolute left-3 top-3 text-[#6c6a64]" />
                <input
                  type="text"
                  placeholder="Search jobs by title or skills..."
                  value={jobSearch}
                  onChange={(e) => setJobSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-white border border-[#e6dfd8] rounded-xl text-xs text-[#141413] placeholder-[#6c6a64] focus:outline-none focus:border-[#cc785c]"
                />
              </div>

              {/* Jobs List */}
              <div className="space-y-3 max-h-[620px] overflow-y-auto pr-1">
                {loading ? (
                  <div className="space-y-3">
                    {[1, 2, 3].map((i) => (
                      <div
                        key={i}
                        className="p-4 rounded-2xl border border-[#e6dfd8] bg-white shadow-xs space-y-3"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <Skeleton className="h-5 w-3/4 rounded-md" />
                          <Skeleton className="h-4 w-12 rounded-full" />
                        </div>
                        <div className="flex items-center gap-2">
                          <Skeleton className="h-3 w-16 rounded-md" />
                          <span className="text-[#e6dfd8]">•</span>
                          <Skeleton className="h-3 w-20 rounded-md" />
                        </div>
                        <div className="flex gap-1.5 pt-0.5">
                          <Skeleton className="h-5 w-14 rounded-md" />
                          <Skeleton className="h-5 w-16 rounded-md" />
                          <Skeleton className="h-5 w-12 rounded-md" />
                        </div>
                        <div className="flex items-center justify-between pt-3 border-t border-[#e6dfd8]/60">
                          <Skeleton className="h-3.5 w-24 rounded-md" />
                          <Skeleton className="h-3.5 w-16 rounded-md" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : filteredJobs.length === 0 ? (
                  <div className="bg-white border border-dashed border-[#e6dfd8] rounded-2xl p-6 text-center space-y-3">
                    <Briefcase size={28} className="mx-auto text-[#6c6a64]" />
                    <p className="text-xs text-[#5e5d59]">No jobs found matching your criteria.</p>
                    <button
                      onClick={() => setIsCreateJobOpen(true)}
                      className="inline-flex items-center gap-1 text-xs text-[#cc785c] font-medium hover:underline"
                    >
                      <Plus size={13} /> Create your first job
                    </button>
                  </div>
                ) : (
                  filteredJobs.map((job) => {
                    const isSelected = selectedJob?.id === job.id;
                    return (
                      <div
                        key={job.id}
                        onClick={() => setSelectedJob(job)}
                        className={`p-4 rounded-2xl border transition-all cursor-pointer relative text-left ${isSelected
                          ? "bg-white border-[#cc785c] shadow-sm ring-1 ring-[#cc785c]"
                          : "bg-white border-[#e6dfd8] hover:border-[#cc785c]/60 shadow-xs"
                          }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <h3 className="font-medium text-sm text-[#141413] line-clamp-1">{job.title}</h3>
                          <div className="flex items-center gap-1">
                            <span
                              className={`text-[10px] font-mono px-2 py-0.5 rounded-full capitalize ${job.status === "active"
                                ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                : "bg-gray-100 text-gray-700"
                                }`}
                            >
                              {job.status}
                            </span>
                            <button
                              onClick={(e) => handleDeleteJob(job.id, e)}
                              className="p-1 text-[#6c6a64] hover:text-red-600 transition-colors"
                              title="Delete Job"
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </div>

                        {/* Badges: Seniority & Min Exp */}
                        <div className="flex items-center gap-2 mt-2 text-[11px] text-[#6c6a64] font-mono">
                          <span>{job.seniority}</span>
                          <span>•</span>
                          <span>{job.min_experience_years}+ yrs exp</span>
                        </div>

                        {/* Skill Pills */}
                        {job.required_skills && job.required_skills.length > 0 && (
                          <div className="flex flex-wrap gap-1.5 mt-2.5">
                            {job.required_skills.slice(0, 3).map((skill, idx) => (
                              <span
                                key={idx}
                                className="text-[10px] font-mono px-2 py-0.5 bg-[#efe9de] text-[#141413] rounded-md border border-[#e6dfd8]"
                              >
                                {skill}
                              </span>
                            ))}
                            {job.required_skills.length > 3 && (
                              <span className="text-[10px] text-[#6c6a64] self-center">
                                +{job.required_skills.length - 3}
                              </span>
                            )}
                          </div>
                        )}

                        {/* Candidate Stats Footer */}
                        <div className="flex items-center justify-between mt-3 pt-3 border-t border-[#e6dfd8]/60 text-xs">
                          <span className="text-[#5e5d59] font-mono text-[11px]">
                            <strong className="text-[#141413] font-semibold">{job.candidates_count}</strong> candidates
                          </span>
                          {job.candidates_count > 0 && (
                            <span className="text-[11px] font-mono text-emerald-700 font-medium">
                              Avg: {job.avg_score}%
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* RIGHT COLUMN: Candidates Tracked in Selected Job (8 cols on lg) */}
            <div className="lg:col-span-8 space-y-4">
              {loading ? (
                <div className="space-y-4">
                  {/* Selected Job Header Card Skeleton */}
                  <div className="bg-white border border-[#e6dfd8] rounded-2xl p-5 shadow-xs space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="space-y-2 flex-1">
                        <div className="flex items-center gap-2">
                          <Skeleton className="h-3.5 w-28 rounded-md" />
                          <span className="text-[#e6dfd8]">•</span>
                          <Skeleton className="h-3.5 w-20 rounded-md" />
                          <span className="text-[#e6dfd8]">•</span>
                          <Skeleton className="h-3.5 w-32 rounded-md" />
                        </div>
                        <Skeleton className="h-7 w-64 rounded-md" />
                        <Skeleton className="h-3.5 w-full max-w-lg rounded-md" />
                      </div>
                      <Skeleton className="h-9 w-36 rounded-xl shrink-0" />
                    </div>
                    <div className="flex flex-wrap items-center gap-2 pt-3 border-t border-[#e6dfd8]">
                      <Skeleton className="h-3.5 w-24 rounded-md" />
                      <Skeleton className="h-6 w-16 rounded-md" />
                      <Skeleton className="h-6 w-20 rounded-md" />
                      <Skeleton className="h-6 w-16 rounded-md" />
                    </div>
                  </div>

                  {/* Candidates Search & Status Filter Skeleton */}
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                    <Skeleton className="h-9 flex-1 rounded-xl" />
                    <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
                      {[1, 2, 3, 4, 5].map((idx) => (
                        <Skeleton key={idx} className="h-8 w-18 rounded-xl shrink-0" />
                      ))}
                    </div>
                  </div>

                  {/* Candidate List Skeletons */}
                  <div className="space-y-3">
                    {[1, 2, 3].map((idx) => (
                      <div
                        key={idx}
                        className="bg-white border border-[#e6dfd8] rounded-2xl p-4 sm:p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                      >
                        <div className="space-y-2.5 flex-1">
                          <div className="flex items-center gap-2">
                            <Skeleton className="h-5 w-40 rounded-md" />
                            <Skeleton className="h-4 w-32 rounded-md" />
                            <Skeleton className="h-4 w-16 rounded-full" />
                          </div>
                          <Skeleton className="h-3.5 w-full max-w-md rounded-md" />
                          <div className="flex items-center gap-2 pt-1">
                            <Skeleton className="h-3 w-28 rounded-md" />
                            <span className="text-[#e6dfd8]">•</span>
                            <Skeleton className="h-3 w-24 rounded-md" />
                          </div>
                        </div>
                        <div className="flex items-center gap-4 shrink-0 sm:border-l sm:border-[#e6dfd8] sm:pl-4">
                          <div className="flex flex-col items-center gap-1">
                            <Skeleton className="h-7 w-16 rounded-md" />
                            <Skeleton className="h-2.5 w-10 rounded-md" />
                          </div>
                          <div className="flex flex-col gap-2">
                            <Skeleton className="h-8 w-28 rounded-xl" />
                            <Skeleton className="h-3 w-24 rounded-md" />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : selectedJob ? (
                <>
                  {/* Selected Job Header Card */}
                  <div className="bg-white border border-[#e6dfd8] rounded-2xl p-5 shadow-xs">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-2 text-xs text-[#6c6a64] font-mono mb-1">
                          <span>Selected Job Role</span>
                          <span>•</span>
                          <span>{selectedJob.seniority}</span>
                          <span>•</span>
                          <span>{selectedJob.min_experience_years}+ Years Minimum</span>
                        </div>
                        <h2 className="font-serif text-2xl text-[#141413]">{selectedJob.title}</h2>
                        {selectedJob.job_description && (
                          <p className="text-xs text-[#5e5d59] mt-1 line-clamp-2 max-w-xl">
                            {selectedJob.job_description}
                          </p>
                        )}
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <Link
                          href={`/screening?job_id=${selectedJob.id}&title=${encodeURIComponent(selectedJob.title)}`}
                          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#cc785c] hover:bg-[#b8684e] text-white text-xs font-medium transition-colors shadow-xs"
                        >
                          <Plus size={14} />
                          <span>Screen for this Job</span>
                        </Link>
                      </div>
                    </div>

                    {/* All Required Skills */}
                    {selectedJob.required_skills && selectedJob.required_skills.length > 0 && (
                      <div className="flex flex-wrap items-center gap-1.5 mt-3 pt-3 border-t border-[#e6dfd8]">
                        <span className="text-[11px] text-[#6c6a64] font-mono mr-1">Required Skills:</span>
                        {selectedJob.required_skills.map((skill, idx) => (
                          <span
                            key={idx}
                            className="text-[11px] font-mono px-2 py-0.5 bg-[#efe9de] text-[#141413] rounded-md border border-[#e6dfd8]"
                          >
                            {skill}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Candidates Search & Status Filter */}
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                    <div className="relative flex-1">
                      <Search size={14} className="absolute left-3 top-3 text-[#6c6a64]" />
                      <input
                        type="text"
                        placeholder="Search candidates by name, email, or badge..."
                        value={candidateSearch}
                        onChange={(e) => setCandidateSearch(e.target.value)}
                        className="w-full pl-9 pr-3 py-2 bg-white border border-[#e6dfd8] rounded-xl text-xs text-[#141413] placeholder-[#6c6a64] focus:outline-none focus:border-[#cc785c]"
                      />
                    </div>

                    {/* Hiring Stage Filter */}
                    <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
                      {["all", "screened", "shortlisted", "interviewed", "rejected"].map((stage) => (
                        <button
                          key={stage}
                          onClick={() => setCandidateHiringFilter(stage)}
                          className={`px-3 py-1.5 rounded-xl text-xs font-mono capitalize transition-colors whitespace-nowrap cursor-pointer ${candidateHiringFilter === stage
                            ? "bg-[#141413] text-white"
                            : "bg-white border border-[#e6dfd8] text-[#6c6a64] hover:text-[#141413]"
                            }`}
                        >
                          {stage}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Candidates List / Table */}
                  <div className="space-y-3">
                    {loadingCandidates ? (
                      <div className="space-y-3">
                        {[1, 2, 3].map((idx) => (
                          <div
                            key={idx}
                            className="bg-white border border-[#e6dfd8] rounded-2xl p-4 sm:p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                          >
                            <div className="space-y-2.5 flex-1">
                              <div className="flex items-center gap-2">
                                <Skeleton className="h-5 w-40 rounded-md" />
                                <Skeleton className="h-4 w-32 rounded-md" />
                                <Skeleton className="h-4 w-16 rounded-full" />
                              </div>
                              <Skeleton className="h-3.5 w-full max-w-md rounded-md" />
                              <div className="flex items-center gap-2 pt-1">
                                <Skeleton className="h-3 w-28 rounded-md" />
                                <span className="text-[#e6dfd8]">•</span>
                                <Skeleton className="h-3 w-24 rounded-md" />
                              </div>
                            </div>
                            <div className="flex items-center gap-4 shrink-0 sm:border-l sm:border-[#e6dfd8] sm:pl-4">
                              <div className="flex flex-col items-center gap-1">
                                <Skeleton className="h-7 w-16 rounded-md" />
                                <Skeleton className="h-2.5 w-10 rounded-md" />
                              </div>
                              <div className="flex flex-col gap-2">
                                <Skeleton className="h-8 w-28 rounded-xl" />
                                <Skeleton className="h-3 w-24 rounded-md" />
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : filteredCandidates.length === 0 ? (
                      <div className="bg-white border border-dashed border-[#e6dfd8] rounded-2xl p-10 text-center space-y-3">
                        <Users size={32} className="mx-auto text-[#6c6a64]" />
                        <h4 className="font-serif text-lg text-[#141413]">No candidates tracked yet</h4>
                        <p className="text-xs text-[#5e5d59] max-w-md mx-auto">
                          Upload or paste resumes in the Autonomous Screening portal to automatically evaluate and track candidates under this job.
                        </p>
                        <Link
                          href={`/screening?job_id=${selectedJob.id}&title=${encodeURIComponent(selectedJob.title)}`}
                          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#cc785c] text-white text-xs font-medium hover:bg-[#b8684e] transition-colors"
                        >
                          <Sparkles size={14} />
                          <span>Screen First Candidate</span>
                        </Link>
                      </div>
                    ) : (
                      filteredCandidates.map((cand) => (
                        <div
                          key={cand.id}
                          className="bg-white border border-[#e6dfd8] hover:border-[#cc785c]/80 rounded-2xl p-4 sm:p-5 shadow-xs transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                        >
                          {/* Candidate Info */}
                          <div className="space-y-1.5 flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <h3 className="font-medium text-base text-[#141413]">{cand.candidate_name}</h3>
                              {cand.candidate_email && (
                                <span className="text-xs text-[#6c6a64] font-mono">({cand.candidate_email})</span>
                              )}
                              <span
                                className={`text-[10px] font-mono px-2 py-0.5 rounded-full font-semibold uppercase ${cand.match_score >= 80
                                  ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                  : cand.match_score >= 60
                                    ? "bg-amber-50 text-amber-700 border border-amber-200"
                                    : "bg-red-50 text-red-700 border border-red-200"
                                  }`}
                              >
                                {cand.fit_rating}
                              </span>
                            </div>

                            <p className="text-xs text-[#5e5d59] line-clamp-2 max-w-xl">
                              {cand.executive_summary || cand.resume_snippet}
                            </p>

                            <div className="flex items-center gap-3 text-[11px] text-[#6c6a64] font-mono pt-1">
                              <span>Screened: {new Date(cand.created_at).toLocaleDateString()}</span>
                              <span>•</span>
                              <span className="text-[#cc785c]">{cand.verdict_badge}</span>
                            </div>
                          </div>

                          {/* Score Gauge & Status Action */}
                          <div className="flex items-center gap-4 shrink-0 sm:border-l sm:border-[#e6dfd8] sm:pl-4">
                            {/* Score Ring */}
                            <div className="text-center">
                              <div className="font-serif text-2xl font-bold text-[#141413]">
                                {cand.match_score}
                                <span className="text-xs font-normal text-[#6c6a64]">/100</span>
                              </div>
                              <span className="text-[10px] font-mono text-[#6c6a64] uppercase tracking-wider">Score</span>
                            </div>

                            {/* Hiring Stage Dropdown */}
                            <div className="flex flex-col gap-1.5">
                              <select
                                value={cand.hiring_status}
                                onChange={(e) => handleUpdateCandidateStatus(cand.id, e.target.value)}
                                className="px-2.5 py-1.5 bg-[#efe9de] border border-[#e6dfd8] rounded-xl text-xs font-mono font-medium text-[#141413] focus:outline-none focus:border-[#cc785c] cursor-pointer"
                              >
                                <option value="screened">Screened</option>
                                <option value="shortlisted">Shortlisted</option>
                                <option value="interviewed">Interviewed</option>
                                <option value="rejected">Rejected</option>
                              </select>

                              <button
                                onClick={() => setSelectedCandidate(cand)}
                                className="inline-flex items-center justify-center gap-1 text-[11px] text-[#cc785c] hover:underline font-medium cursor-pointer"
                              >
                                <FileText size={12} /> View Scorecard
                              </button>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </>
              ) : (
                <div className="bg-white border border-[#e6dfd8] rounded-2xl p-12 text-center space-y-3">
                  <Briefcase size={36} className="mx-auto text-[#6c6a64]" />
                  <h3 className="font-serif text-xl text-[#141413]">No Job Selected</h3>
                  <p className="text-xs text-[#5e5d59]">Select a job position from the left or create a new job to start tracking candidates.</p>
                </div>
              )}
            </div>
          </div>

        </div>
      </main>

      {/* CREATE JOB MODAL */}
      <AnimatePresence>
        {isCreateJobOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-[#faf9f5] border border-[#e6dfd8] rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl p-6 sm:p-8 space-y-6"
            >
              <div className="flex items-center justify-between border-b border-[#e6dfd8] pb-4">
                <div>
                  <h3 className="font-serif text-2xl text-[#141413]">Create New Job Position</h3>
                  <p className="text-xs text-[#5e5d59]">Define role requirements, required skills, and custom evaluation criteria.</p>
                </div>
                <button
                  onClick={() => setIsCreateJobOpen(false)}
                  className="p-2 text-[#6c6a64] hover:text-[#141413] rounded-full hover:bg-[#efe9de] transition-colors"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Template Presets */}
              <div className="space-y-2">
                <span className="text-[11px] font-mono text-[#6c6a64] uppercase tracking-wider">Quick Presets:</span>
                <div className="flex flex-wrap gap-2">
                  {PRESET_TEMPLATES.map((tmpl, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleApplyPreset(tmpl)}
                      className="text-xs px-3 py-1.5 bg-white hover:bg-[#efe9de] border border-[#e6dfd8] rounded-xl text-[#141413] transition-colors font-medium"
                    >
                      {tmpl.title}
                    </button>
                  ))}
                </div>
              </div>

              <form onSubmit={handleCreateJob} className="space-y-4">
                <div>
                  <label className="block text-xs font-mono font-medium text-[#141413] mb-1">
                    Job Title <span className="text-red-500">*</span>
                  </label>
                  <JobTitleAutocomplete
                    value={newTitle}
                    onChange={(val) => setNewTitle(val)}
                    onSelectOption={(opt: JobTitleOption) => {
                      setNewTitle(opt.title);
                      if (opt.suggestedSeniority) {
                        setNewSeniority(opt.suggestedSeniority === "Mid" ? "Mid-Level" : opt.suggestedSeniority);
                      }
                      if (opt.suggestedMinExp !== undefined) {
                        setNewMinExp(opt.suggestedMinExp);
                      }
                      if (opt.suggestedSkills) {
                        setNewSkills([...opt.suggestedSkills]);
                      }
                      if (opt.descriptionTemplate) {
                        setNewDescription(opt.descriptionTemplate);
                      }
                      if (opt.customCriteriaTemplate) {
                        setNewCriteria(opt.customCriteriaTemplate);
                      }
                    }}
                    required
                    placeholder="e.g. Full Stack Engineer, AI Engineer, Marketing..."
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-mono font-medium text-[#141413] mb-1">Seniority Level</label>
                    <select
                      value={newSeniority}
                      onChange={(e) => setNewSeniority(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-white border border-[#e6dfd8] rounded-xl text-xs text-[#141413] focus:outline-none focus:border-[#cc785c]"
                    >
                      <option value="Junior">Junior (0-2 yrs)</option>
                      <option value="Mid-Level">Mid-Level (3-5 yrs)</option>
                      <option value="Senior">Senior (5-8 yrs)</option>
                      <option value="Lead">Lead (8+ yrs)</option>
                      <option value="Principal">Principal / Staff</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-mono font-medium text-[#141413] mb-1">
                      Min. Experience (Years)
                    </label>
                    <input
                      type="number"
                      min={0}
                      max={30}
                      step={0.5}
                      value={newMinExp}
                      onChange={(e) => setNewMinExp(parseFloat(e.target.value) || 0)}
                      className="w-full px-3.5 py-2.5 bg-white border border-[#e6dfd8] rounded-xl text-xs text-[#141413] focus:outline-none focus:border-[#cc785c]"
                    />
                  </div>
                </div>

                {/* Skills Tag Input */}
                <div>
                  <label className="block text-xs font-mono font-medium text-[#141413] mb-1">
                    Required Skills & Technologies
                  </label>
                  <div className="flex gap-2 mb-2">
                    <input
                      type="text"
                      placeholder="Type a skill and hit Add (e.g. Next.js, Python)"
                      value={newSkillInput}
                      onChange={(e) => setNewSkillInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          handleAddSkill();
                        }
                      }}
                      className="flex-1 px-3.5 py-2 bg-white border border-[#e6dfd8] rounded-xl text-xs text-[#141413] focus:outline-none focus:border-[#cc785c]"
                    />
                    <button
                      type="button"
                      onClick={handleAddSkill}
                      className="px-3.5 py-2 bg-[#efe9de] border border-[#e6dfd8] rounded-xl text-xs font-medium text-[#141413] hover:bg-[#e6dfd8]"
                    >
                      Add
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {newSkills.map((skill, idx) => (
                      <span
                        key={idx}
                        className="inline-flex items-center gap-1 text-[11px] font-mono px-2.5 py-1 bg-white border border-[#e6dfd8] rounded-lg text-[#141413]"
                      >
                        {skill}
                        <button
                          type="button"
                          onClick={() => handleRemoveSkill(skill)}
                          className="hover:text-red-500"
                        >
                          <X size={12} />
                        </button>
                      </span>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-mono font-medium text-[#141413] mb-1">
                    Job Description (Optional)
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Paste role overview, core responsibilities, and team mission..."
                    value={newDescription}
                    onChange={(e) => setNewDescription(e.target.value)}
                    className="w-full px-3.5 py-2 bg-white border border-[#e6dfd8] rounded-xl text-xs text-[#141413] focus:outline-none focus:border-[#cc785c]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono font-medium text-[#141413] mb-1">
                    Custom Criteria & Agent Instructions (Optional)
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Specific weights or dealbreaker requirements for the AI screening agent..."
                    value={newCriteria}
                    onChange={(e) => setNewCriteria(e.target.value)}
                    className="w-full px-3.5 py-2 bg-white border border-[#e6dfd8] rounded-xl text-xs text-[#141413] focus:outline-none focus:border-[#cc785c]"
                  />
                </div>

                <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#e6dfd8]">
                  <button
                    type="button"
                    onClick={() => setIsCreateJobOpen(false)}
                    className="px-4 py-2 rounded-xl text-xs font-medium text-[#6c6a64] hover:text-[#141413]"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmittingJob}
                    className="px-5 py-2.5 rounded-xl bg-[#cc785c] hover:bg-[#b8684e] text-white text-xs font-medium transition-colors shadow-xs disabled:opacity-50"
                  >
                    {isSubmittingJob ? "Creating Job..." : "Create Job Position"}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* CANDIDATE SCORECARD MODAL */}
      <AnimatePresence>
        {selectedCandidate && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-[#faf9f5] border border-[#e6dfd8] rounded-3xl max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-2xl p-6 sm:p-8 space-y-6"
            >
              <div className="flex items-start justify-between border-b border-[#e6dfd8] pb-4">
                <div>
                  <div className="flex items-center gap-2 text-xs font-mono text-[#6c6a64] mb-1">
                    <span>Candidate Scorecard</span>
                    <span>•</span>
                    <span className="text-[#cc785c]">{selectedCandidate.job_title}</span>
                  </div>
                  <h3 className="font-serif text-2xl text-[#141413]">{selectedCandidate.candidate_name}</h3>
                  {selectedCandidate.candidate_email && (
                    <p className="text-xs text-[#5e5d59] font-mono">{selectedCandidate.candidate_email}</p>
                  )}
                </div>

                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <div className="font-serif text-3xl font-bold text-[#141413]">
                      {selectedCandidate.match_score}
                      <span className="text-xs font-normal text-[#6c6a64]">/100</span>
                    </div>
                    <span className="text-[10px] font-mono text-emerald-700 font-semibold uppercase">
                      {selectedCandidate.fit_rating}
                    </span>
                  </div>
                  <button
                    onClick={() => setSelectedCandidate(null)}
                    className="p-2 text-[#6c6a64] hover:text-[#141413] rounded-full hover:bg-[#efe9de] transition-colors"
                  >
                    <X size={18} />
                  </button>
                </div>
              </div>

              {/* Status Selector in Modal */}
              <div className="flex items-center justify-between p-3 rounded-2xl bg-[#efe9de] border border-[#e6dfd8]">
                <span className="text-xs font-mono text-[#141413]">Current Hiring Pipeline Stage:</span>
                <select
                  value={selectedCandidate.hiring_status}
                  onChange={(e) => handleUpdateCandidateStatus(selectedCandidate.id, e.target.value)}
                  className="px-3 py-1.5 bg-white border border-[#e6dfd8] rounded-xl text-xs font-mono font-medium text-[#141413] focus:outline-none focus:border-[#cc785c]"
                >
                  <option value="screened">Screened</option>
                  <option value="shortlisted">Shortlisted</option>
                  <option value="interviewed">Interviewed</option>
                  <option value="rejected">Rejected</option>
                </select>
              </div>

              {/* Executive Summary */}
              {selectedCandidate.executive_summary && (
                <div className="space-y-1">
                  <h4 className="text-xs font-mono text-[#6c6a64] uppercase tracking-wider">Executive Verdict</h4>
                  <p className="text-xs text-[#141413] bg-white p-3.5 rounded-xl border border-[#e6dfd8] leading-relaxed">
                    {selectedCandidate.executive_summary}
                  </p>
                </div>
              )}

              {/* Strengths & Missing Elements */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <h4 className="text-xs font-mono text-emerald-700 uppercase tracking-wider font-semibold">
                    Key Strengths Identified
                  </h4>
                  <ul className="space-y-1.5 bg-white p-3.5 rounded-xl border border-[#e6dfd8]">
                    {selectedCandidate.strengths && selectedCandidate.strengths.length > 0 ? (
                      selectedCandidate.strengths.map((str, idx) => (
                        <li key={idx} className="text-xs text-[#141413] flex items-start gap-1.5">
                          <CheckCircle2 size={13} className="text-emerald-600 shrink-0 mt-0.5" />
                          <span>{str}</span>
                        </li>
                      ))
                    ) : (
                      <li className="text-xs text-[#6c6a64]">No notable strengths recorded.</li>
                    )}
                  </ul>
                </div>

                <div className="space-y-2">
                  <h4 className="text-xs font-mono text-amber-700 uppercase tracking-wider font-semibold">
                    Identified Gaps & Risks
                  </h4>
                  <ul className="space-y-1.5 bg-white p-3.5 rounded-xl border border-[#e6dfd8]">
                    {selectedCandidate.gaps_and_risks && selectedCandidate.gaps_and_risks.length > 0 ? (
                      selectedCandidate.gaps_and_risks.map((gap, idx) => (
                        <li key={idx} className="text-xs text-[#141413] flex items-start gap-1.5">
                          <AlertCircle size={13} className="text-amber-600 shrink-0 mt-0.5" />
                          <span>{gap}</span>
                        </li>
                      ))
                    ) : (
                      <li className="text-xs text-[#6c6a64]">No critical gaps recorded.</li>
                    )}
                  </ul>
                </div>
              </div>

              {/* Rubric Breakdown */}
              {selectedCandidate.rubric_scores && Object.keys(selectedCandidate.rubric_scores).length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-xs font-mono text-[#6c6a64] uppercase tracking-wider">Multi-Factor Rubric Scores</h4>
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                    {Object.entries(selectedCandidate.rubric_scores).map(([key, val]: any, idx) => (
                      <div key={idx} className="bg-white p-2.5 rounded-xl border border-[#e6dfd8] text-center">
                        <span className="text-[10px] font-mono text-[#6c6a64] capitalize block truncate">
                          {key.replace(/([A-Z])/g, " $1")}
                        </span>
                        <span className="font-serif text-lg font-bold text-[#141413]">
                          {val?.score ?? val ?? "-"}
                        </span>
                        <span className="text-[10px] text-[#6c6a64]">/100</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Tailored Interview Questions */}
              {selectedCandidate.interview_questions && selectedCandidate.interview_questions.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-xs font-mono text-[#6c6a64] uppercase tracking-wider">Suggested Interview Questions</h4>
                  <div className="space-y-2">
                    {selectedCandidate.interview_questions.map((q: any, idx: number) => (
                      <div key={idx} className="bg-white p-3 rounded-xl border border-[#e6dfd8] text-xs space-y-1">
                        <p className="font-medium text-[#141413]">{idx + 1}. {q.question || q}</p>
                        {q.rationale && <p className="text-[11px] text-[#6c6a64]">Rationale: {q.rationale}</p>}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#e6dfd8]">
                <button
                  onClick={() => setSelectedCandidate(null)}
                  className="px-4 py-2 rounded-xl text-xs font-medium text-[#6c6a64] hover:text-[#141413]"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#faf9f5] flex items-center justify-center text-xs font-mono">Loading Dashboard...</div>}>
      <DashboardContent />
    </Suspense>
  );
}
