"use client";

import { useState, useRef, useEffect, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { motion } from "motion/react";
import { useSession } from "@/lib/auth-client";
import Navbar from "@/components/layout/navbar";
import {
  Upload,
  Link as LinkIcon,
  Briefcase,
  Sliders,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  Cpu,
  FileText,
  Copy,
  Download,
  RefreshCw,
  Plus,
  X,
  ChevronRight,
  Award,
  HelpCircle,
  ExternalLink,
  Info,
  Zap,
  ArrowUpRight,
  BookmarkPlus,
  Save,
  LayoutDashboard,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "https://aura-screening.fastapicloud.dev";

// Sample candidates for instant 1-click testing
const SAMPLE_RESUMES = [
  {
    id: "alex",
    name: "Alex Rivera",
    role: "Senior Full-Stack Engineer",
    snippet: "10+ yrs exp in React, TypeScript, Node.js, PostgreSQL, Distributed Systems & Cloud Infra",
    text: `ALEX RIVERA
Senior Full-Stack Engineer & AI Systems Architect
Email: alex.rivera@example.com | GitHub: github.com/alexrivera-dev | Location: San Francisco, CA

SUMMARY
Versatile Senior Full-Stack Engineer with 10+ years of experience designing and scaling web applications, microservices, and AI-assisted recruitment platforms. Proven track record leading engineering teams, managing high-throughput PostgreSQL databases, and crafting ultra-responsive Next.js & React interfaces.

TECHNICAL SKILLS
- Languages: TypeScript, JavaScript, Python, Go, SQL, HTML5, CSS3
- Frontend: Next.js, React, Redux, TailwindCSS, Web Workers, WebSockets
- Backend: Node.js, Express, FastAPI, PostgreSQL, Redis, GraphQL, REST APIs
- Infrastructure: Docker, Kubernetes, AWS (S3, ECS, Lambda), CI/CD, Terraform
- AI & Data: Google Gemini API, OpenAI API, LangChain, Vector Databases (Pinecone, PgVector)

PROFESSIONAL EXPERIENCE

Principal Full-Stack Architect | NextGen Talent AI (2021 – Present)
- Led a team of 8 engineers building real-time resume parsing and screening algorithms using Next.js, Node.js, and PostgreSQL.
- Reduced candidate evaluation turnaround time by 82% while improving skill matching accuracy by 45%.
- Architected resilient PostgreSQL database schemas handling 5M+ candidate records with sub-50ms query response times using index optimization and Redis caching.

Senior Software Engineer | CloudScale Systems (2017 – 2021)
- Designed microservices architecture in Node.js and TypeScript serving 10M+ daily API requests.
- Integrated automated CI/CD pipelines via GitHub Actions and AWS ECS, reducing deployment cycle times from days to 15 minutes.
- Mentored 6 junior/mid-level developers in React performance optimization and defensive API development.

Full-Stack Developer | DataPulse Labs (2014 – 2017)
- Developed data analytics dashboards in React and Python for Fortune 500 HR teams.

EDUCATION & CERTIFICATIONS
- B.S. in Computer Science | University of California, Berkeley (2014)
- AWS Certified Solutions Architect – Professional (2022)
- Certified Scrum Master (CSM)`,
  },
  {
    id: "sophia",
    name: "Sophia Chen",
    role: "Lead AI & Data Scientist",
    snippet: "7 yrs exp in Machine Learning, PyTorch, LLM Fine-Tuning & NLP Infrastructure",
    text: `SOPHIA CHEN
Lead AI Engineer & NLP Researcher
Email: sophia.chen@example.io | LinkedIn: linkedin.com/in/sophiachen-ai

SUMMARY
Senior Data Scientist and Machine Learning Engineer with 7 years of specialized expertise in Natural Language Processing (NLP), Large Language Models (LLM) fine-tuning, PyTorch, and automated information extraction from unstructured documents.

TECHNICAL SKILLS
- Machine Learning: PyTorch, TensorFlow, Hugging Face Transformers, Scikit-Learn
- AI/LLM: Gemini API, LangChain, RAG Infrastructure, LlamaIndex, Vector Indexing
- Engineering: Python, FastAPI, Docker, PostgreSQL, Ray, Distributed Training
- Analytics: Pandas, NumPy, Data Visualization, A/B Testing, Feature Engineering

EXPERIENCE

Lead AI Engineer | NeuralExtract Tech (2022 – Present)
- Built autonomous document parsing pipeline using PyTorch fine-tuned Transformer models, processing 50,000+ CVs daily.
- Implemented RAG (Retrieval-Augmented Generation) pipeline for complex resume matching with 94.2% precision.

Senior Data Scientist | Intelligence Analytics (2019 – 2022)
- Developed sentiment and entity extraction engines in Python and FastAPI for resume skill categorization.

EDUCATION
- M.S. in Artificial Intelligence | Stanford University (2019)
- B.S. in Applied Mathematics & Statistics | MIT (2017)`,
  },
  {
    id: "marcus",
    name: "Marcus Vance",
    role: "Junior Web Developer",
    snippet: "1.5 yrs exp in HTML/CSS, JavaScript, basic React & Python scripts",
    text: `MARCUS VANCE
Junior Frontend Developer
Email: marcus.vance@example.com

OBJECTIVE
Motivated Junior Frontend Developer with 1.5 years of hands-on experience building interactive web pages and utility scripts using JavaScript, React, and CSS. Eager to contribute to a collaborative software team.

SKILLS
- Web Technologies: JavaScript (ES6+), HTML5, CSS3, Bootstrap, TailwindCSS
- Frameworks: Basic React.js, Node.js fundamentals
- Tools: Git, VS Code, Figma basics

EXPERIENCE
Junior Web Developer | WebCraft Studio (2024 – Present)
- Built responsive landing pages for small business clients using HTML, CSS, and basic JavaScript.
- Assisted senior developers in fixing bug tickets and updating React component state.

EDUCATION
- Associate Degree in Web Development | Community College of SF (2023)`,
  },
];

// Preset Job Criteria
const JOB_PRESETS = [
  {
    title: "Senior Full-Stack Engineer",
    seniority: "Senior",
    minExp: 5,
    skills: ["React", "TypeScript", "Node.js", "PostgreSQL", "Docker", "REST APIs", "AWS"],
    description: "We are seeking a Senior Full-Stack Engineer to architect and build high-scale web platforms. Candidate must have strong experience with React, TypeScript, Node.js, and relational database systems (PostgreSQL). Responsibility includes designing clean APIs, mentoring engineers, and implementing cloud infrastructure.",
    customCriteria: "Ensure strong production experience with PostgreSQL and TypeScript.",
  },
  {
    title: "Lead AI / ML Specialist",
    seniority: "Lead",
    minExp: 5,
    skills: ["Python", "PyTorch", "NLP", "LLMs", "RAG", "FastAPI", "Docker"],
    description: "Looking for a Lead AI Engineer to pioneer our document extraction and candidate screening LLM algorithms. Must possess expertise in PyTorch, NLP, prompt engineering, and building production RAG pipelines.",
    customCriteria: "Candidate must have proven experience fine-tuning or deploying LLM models in production.",
  },
  {
    title: "Product Manager - Talent Tech",
    seniority: "Mid",
    minExp: 3,
    skills: ["Product Strategy", "User Research", "Agile", "Data Analytics", "Roadmapping"],
    description: "Seeking a product-minded manager to lead feature development for our automated recruitment suite. Responsibilities include running user interviews, defining KPI benchmarks, and coordinating sprint execution.",
    customCriteria: "Experience in HR Tech or SaaS products is highly desirable.",
  },
];

function ScreeningContent() {
  const { data: sessionData } = useSession();
  const user = sessionData?.user;
  const searchParams = useSearchParams();
  const paramJobId = searchParams.get("job_id");
  const paramTitle = searchParams.get("title");

  const [usage, setUsage] = useState<{
    plan_name: string;
    credits_remaining: number;
    total_credits: number;
  } | null>(null);

  // User's Saved Jobs for auto-selection
  const [userJobs, setUserJobs] = useState<any[]>([]);
  const [selectedJobId, setSelectedJobId] = useState<string | null>(paramJobId || null);
  const [isSavingJob, setIsSavingJob] = useState<boolean>(false);

  // Headers with bearer token
  const getHeaders = () => {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };
    if (sessionData?.session?.token) {
      headers["Authorization"] = `Bearer ${sessionData.session.token}`;
    }
    return headers;
  };

  const fetchUsage = () => {
    if (!user?.id) return;
    fetch(`${BACKEND_URL}/payments/profile-usage?user_id=${encodeURIComponent(user.id)}`, {
      headers: getHeaders(),
    })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data) setUsage(data);
      })
      .catch(() => { });
  };

  useEffect(() => {
    fetchUsage();
  }, [user?.id]);

  // Fetch saved jobs from backend
  const fetchUserJobs = async () => {
    if (!user?.id) return;
    try {
      const res = await fetch(`${BACKEND_URL}/jobs?user_id=${encodeURIComponent(user.id)}`, {
        headers: getHeaders(),
      });
      if (res.ok) {
        const list = await res.json();
        setUserJobs(list);
        if (paramJobId) {
          const matched = list.find((j: any) => j.id === paramJobId);
          if (matched) {
            setSelectedJobId(matched.id);
            setJobTitle(matched.title);
            setSeniority(matched.seniority);
            setMinExpYears(matched.min_experience_years);
            if (matched.required_skills?.length) setRequiredSkills(matched.required_skills);
            if (matched.job_description) setJobDescription(matched.job_description);
            if (matched.custom_criteria) setCustomCriteria(matched.custom_criteria);
          }
        }
      }
    } catch (err) {
      console.error("Failed to load user jobs", err);
    }
  };

  useEffect(() => {
    fetchUserJobs();
  }, [user?.id, paramJobId]);

  // Handle switching to another saved job
  const handleSelectSavedJob = (jobId: string) => {
    setSelectedJobId(jobId || null);
    if (!jobId) {
      handleResetNewJob();
      return;
    }
    const found = userJobs.find((j) => j.id === jobId);
    if (found) {
      setJobTitle(found.title);
      setSeniority(found.seniority);
      setMinExpYears(found.min_experience_years);
      if (found.required_skills && found.required_skills.length > 0) {
        setRequiredSkills(found.required_skills);
      }
      if (found.job_description) setJobDescription(found.job_description);
      if (found.custom_criteria) setCustomCriteria(found.custom_criteria);
      toast.success(`Loaded saved job: ${found.title}`);
    }
  };

  // Start fresh job configuration
  const handleResetNewJob = () => {
    setSelectedJobId(null);
    setJobTitle("");
    setSeniority("Senior");
    setMinExpYears(3);
    setRequiredSkills(["React", "TypeScript", "Node.js"]);
    setJobDescription("");
    setCustomCriteria("");
    toast.info("Started fresh job form. Fill details and save to your dashboard.");
  };

  // Save current job configuration to backend database
  const saveJobToDashboard = async (options?: {
    silent?: boolean;
    advanceStep?: boolean;
  }): Promise<string | null> => {
    if (!jobTitle.trim()) {
      toast.error("Please enter a target job title.");
      return null;
    }
    if (!user?.id) {
      toast.error("Please log in to save this job to your dashboard.");
      return null;
    }

    try {
      setIsSavingJob(true);
      const payload = {
        title: jobTitle.trim(),
        seniority: seniority,
        min_experience_years: Number(minExpYears),
        required_skills: requiredSkills,
        job_description: jobDescription.trim(),
        custom_criteria: customCriteria.trim(),
        status: "active",
      };

      let savedId = selectedJobId;

      if (selectedJobId) {
        // Update existing job
        const res = await fetch(
          `${BACKEND_URL}/jobs/${selectedJobId}?user_id=${encodeURIComponent(user.id)}`,
          {
            method: "PATCH",
            headers: getHeaders(),
            body: JSON.stringify(payload),
          }
        );
        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.detail || "Failed to update job in dashboard");
        }
        const updatedJob = await res.json();
        setUserJobs((prev) =>
          prev.map((j) => (j.id === updatedJob.id ? updatedJob : j))
        );
        savedId = updatedJob.id;
        if (!options?.silent) {
          toast.success(`Job "${updatedJob.title}" updated in your dashboard!`);
        }
      } else {
        // Create new job
        const res = await fetch(
          `${BACKEND_URL}/jobs?user_id=${encodeURIComponent(user.id)}`,
          {
            method: "POST",
            headers: getHeaders(),
            body: JSON.stringify(payload),
          }
        );
        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.detail || "Failed to save job to dashboard");
        }
        const newJob = await res.json();
        setSelectedJobId(newJob.id);
        setUserJobs((prev) => [newJob, ...prev]);
        savedId = newJob.id;
        toast.success(`Job "${newJob.title}" saved to your dashboard!`);
      }

      if (options?.advanceStep) {
        setCurrentStep(2);
      }
      return savedId;
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Could not save job to dashboard.");
      return null;
    } finally {
      setIsSavingJob(false);
    }
  };

  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1);

  // Resume State
  const [inputTab, setInputTab] = useState<"upload" | "link" | "sample">("upload");
  const [resumeText, setResumeText] = useState<string>("");
  const [resumeSource, setResumeSource] = useState<"file" | "link" | "sample">("file");
  const [resumeFileName, setResumeFileName] = useState<string>("");
  const [resumeUrlInput, setResumeUrlInput] = useState<string>("");
  const [isFetchingUrl, setIsFetchingUrl] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Job Criteria State
  const [jobTitle, setJobTitle] = useState<string>("Senior Full-Stack Engineer");
  const [seniority, setSeniority] = useState<string>("Senior");
  const [minExpYears, setMinExpYears] = useState<number>(5);
  const [requiredSkills, setRequiredSkills] = useState<string[]>([
    "React",
    "TypeScript",
    "Node.js",
    "PostgreSQL",
    "Docker",
    "AWS",
  ]);
  const [newSkillInput, setNewSkillInput] = useState<string>("");
  const [jobDescription, setJobDescription] = useState<string>(
    "We are seeking a Senior Full-Stack Engineer to architect and build high-scale web platforms. Candidate must have strong experience with React, TypeScript, Node.js, and relational database systems (PostgreSQL). Responsibility includes designing clean APIs, mentoring engineers, and implementing cloud infrastructure."
  );
  const [customCriteria, setCustomCriteria] = useState<string>(
    "Ensure candidate has at least 4+ years of hands-on TypeScript and modern database experience."
  );

  // Evaluation State
  const [isEvaluating, setIsEvaluating] = useState<boolean>(false);
  const [evaluationStage, setEvaluationStage] = useState<string>("");
  const [evalResult, setEvalResult] = useState<any>(null);

  // --- Handlers: File Upload via FastAPI /extract-resume ---
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setResumeFileName(file.name);
    setResumeSource("file");

    const formData = new FormData();
    formData.append("file", file);

    try {
      toast.info("Extracting candidate data...");
      const res = await fetch(`${BACKEND_URL}/extract-resume`, {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Failed to extract file data.");

      setResumeText(data.raw_text);
      if (data.candidate_name && data.candidate_name !== "Candidate") {
        toast.success(`Extracted resume for ${data.candidate_name}`);
      } else {
        toast.success(`Loaded file: ${file.name}`);
      }
    } catch (err: any) {
      // Client-side fallback read if backend is starting up
      const reader = new FileReader();
      reader.onload = (ev) => {
        const text = ev.target?.result as string;
        if (text) setResumeText(text);
      };
      reader.readAsText(file);
      toast.warning("Extracted file locally");
    }
  };

  // --- Handlers: URL Fetching via FastAPI /extract-resume ---
  const handleFetchUrl = async () => {
    if (!resumeUrlInput || !resumeUrlInput.startsWith("http")) {
      toast.error("Please enter a valid URL starting with http:// or https://");
      return;
    }

    setIsFetchingUrl(true);
    try {
      const formData = new FormData();
      formData.append("url", resumeUrlInput);

      const res = await fetch(`${BACKEND_URL}/extract-resume`, {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Failed to parse link.");

      setResumeText(data.raw_text);
      setResumeSource("link");
      toast.success("Successfully extracted resume text.");
    } catch (err: any) {
      toast.error(err.message || "Failed to fetch resume link!");
    } finally {
      setIsFetchingUrl(false);
    }
  };

  // --- Handlers: Sample Pick ---
  const handleSelectSample = (sample: (typeof SAMPLE_RESUMES)[0]) => {
    setResumeText(sample.text);
    setResumeSource("sample");
    setResumeFileName(`${sample.name} - CV`);
    toast.success(`Loaded sample candidate: ${sample.name}`);
  };

  // --- Handlers: Preset Pick ---
  const handleApplyPreset = (preset: (typeof JOB_PRESETS)[0]) => {
    setSelectedJobId(null);
    setJobTitle(preset.title);
    setSeniority(preset.seniority);
    setMinExpYears(preset.minExp);
    setRequiredSkills([...preset.skills]);
    setJobDescription(preset.description);
    setCustomCriteria(preset.customCriteria);
    toast.success(`Applied job criteria preset for ${preset.title}. Save or proceed to add to dashboard.`);
  };

  // --- Handlers: Skill Tags ---
  const handleAddSkill = () => {
    if (!newSkillInput.trim()) return;
    const trimmed = newSkillInput.trim();
    if (!requiredSkills.some((s) => s.toLowerCase() === trimmed.toLowerCase())) {
      setRequiredSkills([...requiredSkills, trimmed]);
    }
    setNewSkillInput("");
  };

  const handleRemoveSkill = (skillToRemove: string) => {
    setRequiredSkills(requiredSkills.filter((s) => s !== skillToRemove));
  };

  // --- Handlers: Run Evaluation via FastAPI /analyze-resume ---
  const handleStartEvaluation = async () => {
    if (!jobTitle.trim()) {
      toast.error("Please specify a job title in Step 1.");
      setCurrentStep(1);
      return;
    }

    if (!resumeText || resumeText.trim().length < 30) {
      toast.error("Please upload or share a valid candidate resume in Step 2.");
      setCurrentStep(2);
      return;
    }

    setCurrentStep(3);
    setIsEvaluating(true);
    setEvalResult(null);

    const stages = [
      "Connecting to FastAPI Autonomous Screening Engine...",
      "Extracting skills, timeline & work experience matrix...",
      "Cross-referencing candidate against required job competencies...",
      "Evaluating multi-factor rubric scores & risk indicators...",
      "Synthesizing final executive screening report...",
    ];

    for (let i = 0; i < stages.length; i++) {
      setEvaluationStage(stages[i]);
      await new Promise((resolve) => setTimeout(resolve, 350));
    }

    try {
      // Ensure job is saved to dashboard so candidate evaluation attaches to it
      let effectiveJobId = selectedJobId;
      if (!effectiveJobId && user?.id) {
        effectiveJobId = await saveJobToDashboard({ silent: true });
      }

      const res = await fetch(`${BACKEND_URL}/analyze-resume`, {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify({
          resume_text: resumeText,
          job_title: jobTitle,
          seniority: seniority,
          required_skills: requiredSkills,
          min_experience_years: minExpYears,
          job_description: jobDescription,
          custom_criteria: customCriteria,
          candidate_name: resumeSource === "sample" ? SAMPLE_RESUMES.find(s => s.text === resumeText)?.name : undefined,
          job_id: effectiveJobId || undefined,
          user_id: user?.id || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "FastAPI evaluation failed.");

      setEvalResult(data);
      toast.success("Autonomous CV Evaluation Completed & Tracked in Dashboard!");

      if (user?.id) {
        fetch(`${BACKEND_URL}/payments/record-usage`, {
          method: "POST",
          headers: getHeaders(),
          body: JSON.stringify({ user_id: user.id }),
        })
          .then((res) => res.json())
          .then(() => fetchUsage())
          .catch(() => { });
      }
    } catch (err: any) {
      toast.error(err.message || "Could not connect to backend right now, Try Again Later!");
    } finally {
      setIsEvaluating(false);
    }
  };

  // Copy evaluation summary
  const handleCopySummary = () => {
    if (!evalResult) return;
    const summary = `Candidate: ${evalResult.candidateName}\nScore: ${evalResult.matchScore}/100 (${evalResult.fitRating})\nVerdict: ${evalResult.verdict}\n\nKey Strengths:\n${evalResult.strengths?.join("\n")}\n\nGaps:\n${evalResult.missingElements?.join("\n")}`;
    navigator.clipboard.writeText(summary);
    toast.success("Summary copied to clipboard!");
  };

  // Export JSON Report
  const handleDownloadJSON = () => {
    if (!evalResult) return;
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(evalResult, null, 2));
    const downloadAnchor = document.createElement("a");
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `Screening_${evalResult.candidateName.replace(/\s+/g, "_")}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    toast.success("Report downloaded successfully.");
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#faf9f5] text-[#141413]">
      <Navbar />

      <main className="flex-1 pt-24 pb-20">
        <div className="container mx-auto px-4 sm:px-6 max-w-6xl space-y-8">

          {/* Header Banner */}
          <div className="border-b border-[#e6dfd8] pb-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <div className="flex flex-wrap items-center gap-2 mb-2">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#efe9de] border border-[#e6dfd8]">
                    <span className="w-2 h-2 rounded-full bg-[#cc785c] animate-pulse" />
                    <span className="text-[11px] font-mono font-semibold uppercase tracking-wider text-[#141413]">
                      Agentic AI system for cv analyzing
                    </span>
                  </div>

                  <Link
                    href="/dashboard"
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white border border-[#e6dfd8] hover:border-[#cc785c] text-[11px] text-[#141413] transition-colors shadow-xs group"
                  >
                    <LayoutDashboard size={13} className="text-[#cc785c]" />
                    <span className="font-medium">My Dashboard</span>
                    {userJobs.length > 0 && (
                      <span className="bg-[#efe9de] text-[#3d3d3a] px-1.5 py-0.5 rounded-full text-[10px] font-mono">
                        {userJobs.length} {userJobs.length === 1 ? "job" : "jobs"}
                      </span>
                    )}
                    <span className="text-[#cc785c] group-hover:translate-x-0.5 transition-transform">→</span>
                  </Link>

                  {usage && (
                    <Link
                      href="/profile"
                      className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white border border-[#e6dfd8] hover:border-[#cc785c] text-[11px] text-[#141413] transition-colors shadow-xs group"
                    >
                      <Zap size={13} className="text-[#cc785c]" />
                      <span className="font-medium">{usage.credits_remaining} / {usage.total_credits} Runs Left</span>
                      <span className="text-[#cc785c] group-hover:underline">→ Profile</span>
                    </Link>
                  )}
                </div>
                <h1 className="font-serif text-3xl sm:text-4xl text-[#141413] tracking-tight font-normal">
                  Autonomous CV Screening Workspace
                </h1>
                <p className="text-sm text-[#3d3d3a] mt-1 max-w-2xl">
                  Create a job and configure criteria, add candidate resumes, and launch human-level autonomous evaluation.
                </p>
              </div>

              {/* Progress Stepper Pills */}
              <div className="flex items-center gap-2 self-start md:self-auto bg-[#efe9de]/60 p-1.5 rounded-xl border border-[#e6dfd8]">
                <button
                  onClick={() => setCurrentStep(1)}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${currentStep === 1
                    ? "bg-[#cc785c] text-white shadow-xs"
                    : "text-[#3d3d3a] hover:bg-[#e8e0d2]"
                    }`}
                >
                  <span className="w-4 h-4 rounded-full bg-white/20 text-center text-[10px] leading-4 font-bold">1</span>
                  <span>Create Job</span>
                </button>

                <ChevronRight size={14} className="text-[#a09d96]" />

                <button
                  onClick={async () => {
                    if (!selectedJobId && jobTitle.trim() && user?.id) {
                      await saveJobToDashboard({ silent: true, advanceStep: true });
                    } else {
                      setCurrentStep(2);
                    }
                  }}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${currentStep === 2
                    ? "bg-[#cc785c] text-white shadow-xs"
                    : "text-[#3d3d3a] hover:bg-[#e8e0d2]"
                    }`}
                >
                  <span className="w-4 h-4 rounded-full bg-white/20 text-center text-[10px] leading-4 font-bold">2</span>
                  <span>Add Candidates</span>
                </button>

                <ChevronRight size={14} className="text-[#a09d96]" />

                <button
                  onClick={() => {
                    if (evalResult || isEvaluating) setCurrentStep(3);
                    else handleStartEvaluation();
                  }}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${currentStep === 3
                    ? "bg-[#cc785c] text-white shadow-xs"
                    : "text-[#3d3d3a] hover:bg-[#e8e0d2]"
                    }`}
                >
                  <span className="w-4 h-4 rounded-full bg-white/20 text-center text-[10px] leading-4 font-bold">3</span>
                  <span>See Results</span>
                </button>
              </div>
            </div>
          </div>

          {/* STEP 1: CREATE JOB & EVALUATION CRITERIA */}
          {currentStep === 1 && (
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#efe9de]/40 p-4 rounded-2xl border border-[#e6dfd8]">
                <div>
                  <h2 className="text-base font-semibold text-[#141413]">Step 1: Create Job & Evaluation Criteria</h2>
                  <p className="text-xs text-[#6c6a64]">
                    Define target title, required technical skills, minimum experience, and custom rubric constraints.
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2.5">
                  {userJobs.length > 0 && (
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-mono text-[#cc785c] font-semibold">Your Jobs:</span>
                      <select
                        value={selectedJobId || ""}
                        onChange={(e) => handleSelectSavedJob(e.target.value)}
                        className="text-xs px-2.5 py-1 rounded-lg border border-[#cc785c] bg-white text-[#141413] focus:outline-none shadow-xs font-medium cursor-pointer"
                      >
                        <option value="">-- New / Unsaved Job --</option>
                        {userJobs.map((j) => (
                          <option key={j.id} value={j.id}>
                            {j.title} ({j.candidates_count} tracked)
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={handleResetNewJob}
                    className="inline-flex items-center gap-1 text-[11px] font-medium px-2.5 py-1 rounded-lg border border-[#e6dfd8] bg-white hover:bg-[#efe9de] text-[#141413] transition-all shadow-xs cursor-pointer"
                    title="Start fresh with a new job form"
                  >
                    <Plus size={12} className="text-[#cc785c]" />
                    <span>+ New Job</span>
                  </button>

                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-mono text-[#6c6a64]">Presets:</span>
                    <div className="flex items-center gap-1.5">
                      {JOB_PRESETS.map((preset) => (
                        <button
                          key={preset.title}
                          type="button"
                          onClick={() => handleApplyPreset(preset)}
                          className={`text-[11px] font-medium px-2.5 py-1 rounded-lg border transition-all cursor-pointer ${jobTitle === preset.title
                            ? "bg-[#cc785c] text-white border-[#cc785c]"
                            : "bg-[#faf9f5] border-[#e6dfd8] text-[#3d3d3a] hover:bg-[#efe9de]"
                            }`}
                        >
                          {preset.title.split(" ")[0]} {preset.title.split(" ")[1]}
                        </button>
                      ))}
                    </div>
                  </div>

                  <Link
                    href="/dashboard"
                    className="inline-flex items-center gap-1.5 text-[11px] font-medium px-2.5 py-1 rounded-lg bg-[#efe9de] hover:bg-[#e4ded3] text-[#3d3d3a] border border-[#e6dfd8] transition-all"
                  >
                    <LayoutDashboard size={12} />
                    <span>Dashboard</span>
                  </Link>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-12 gap-6">

                {/* Left Column (7 cols) */}
                <div className="md:col-span-7 space-y-5 bg-[#faf9f5] p-5 rounded-2xl border border-[#e6dfd8]">

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="sm:col-span-2 space-y-1.5">
                      <label className="block text-xs font-semibold uppercase tracking-wider text-[#3d3d3a]">
                        Target Job Title
                      </label>
                      <input
                        type="text"
                        value={jobTitle}
                        onChange={(e) => setJobTitle(e.target.value)}
                        placeholder="e.g. Senior Full-Stack Engineer"
                        className="w-full px-3.5 py-2 rounded-xl border border-[#e6dfd8] bg-[#efe9de]/30 text-xs text-[#141413] focus:outline-none focus:border-[#cc785c]"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="block text-xs font-semibold uppercase tracking-wider text-[#3d3d3a]">
                        Seniority Level
                      </label>
                      <select
                        value={seniority}
                        onChange={(e) => setSeniority(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-[#e6dfd8] bg-[#efe9de]/30 text-xs text-[#141413] focus:outline-none focus:border-[#cc785c]"
                      >
                        <option value="Junior">Junior (0-2 yrs)</option>
                        <option value="Mid">Mid-Level (2-5 yrs)</option>
                        <option value="Senior">Senior (5-8 yrs)</option>
                        <option value="Lead">Lead / Principal (8+ yrs)</option>
                      </select>
                    </div>
                  </div>

                  {/* Skills Editor */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="block text-xs font-semibold uppercase tracking-wider text-[#3d3d3a]">
                        Required Technical Skills & Competencies
                      </label>
                      <span className="text-[10px] text-[#6c6a64] font-mono">{requiredSkills.length} skills listed</span>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 p-3 rounded-xl border border-[#e6dfd8] bg-[#efe9de]/20 min-h-[56px]">
                      {requiredSkills.map((skill) => (
                        <span
                          key={skill}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#efe9de] text-[#141413] text-xs font-medium border border-[#e6dfd8]"
                        >
                          <span>{skill}</span>
                          <button
                            onClick={() => handleRemoveSkill(skill)}
                            className="text-[#a09d96] hover:text-[#c64545]"
                          >
                            <X size={12} />
                          </button>
                        </span>
                      ))}

                      <div className="flex items-center gap-1 text-xs">
                        <input
                          type="text"
                          value={newSkillInput}
                          onChange={(e) => setNewSkillInput(e.target.value)}
                          onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), handleAddSkill())}
                          placeholder="+ Add skill (press Enter)"
                          className="px-2 py-1 rounded-md bg-transparent text-xs text-[#141413] focus:outline-none placeholder:text-[#a09d96] w-36"
                        />
                        {newSkillInput && (
                          <button
                            onClick={handleAddSkill}
                            className="p-1 rounded bg-[#cc785c] text-white text-[10px]"
                          >
                            <Plus size={12} />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Min Exp Slider */}
                  <div className="space-y-2 pt-1">
                    <div className="flex justify-between items-center text-xs">
                      <label className="font-semibold uppercase tracking-wider text-[#3d3d3a]">
                        Minimum Experience Threshold
                      </label>
                      <span className="font-mono text-xs font-bold text-[#cc785c] bg-[#efe9de] px-2.5 py-0.5 rounded-full border border-[#e6dfd8]">
                        {minExpYears} Years Required
                      </span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="15"
                      step="1"
                      value={minExpYears}
                      onChange={(e) => setMinExpYears(Number(e.target.value))}
                      className="w-full accent-[#cc785c] cursor-pointer"
                    />
                    <div className="flex justify-between text-[10px] font-mono text-[#a09d96]">
                      <span>0 Yrs (Entry)</span>
                      <span>5 Yrs (Senior)</span>
                      <span>10+ Yrs (Principal)</span>
                    </div>
                  </div>

                </div>

                {/* Right Column (5 cols) */}
                <div className="md:col-span-5 space-y-4 bg-[#faf9f5] p-5 rounded-2xl border border-[#e6dfd8] flex flex-col justify-between">
                  <div className="space-y-4">
                    <div className="space-y-1.5">
                      <label className="block text-xs font-semibold uppercase tracking-wider text-[#3d3d3a]">
                        Full Job Description & Role Overview
                      </label>
                      <textarea
                        value={jobDescription}
                        onChange={(e) => setJobDescription(e.target.value)}
                        rows={5}
                        placeholder="Paste full job description or key responsibilities here..."
                        className="w-full p-3 rounded-xl border border-[#e6dfd8] bg-[#efe9de]/30 text-xs text-[#141413] focus:outline-none focus:border-[#cc785c] leading-relaxed"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="block text-xs font-semibold uppercase tracking-wider text-[#3d3d3a]">
                        Custom AI Agent Instructions / Non-Negotiables
                      </label>
                      <input
                        type="text"
                        value={customCriteria}
                        onChange={(e) => setCustomCriteria(e.target.value)}
                        placeholder="e.g. Ensure candidate has active cloud deployment experience."
                        className="w-full px-3.5 py-2.5 rounded-xl border border-[#e6dfd8] bg-[#efe9de]/30 text-xs text-[#141413] focus:outline-none focus:border-[#cc785c]"
                      />
                    </div>
                  </div>

                  <div className="pt-4 border-t border-[#e6dfd8] flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      {selectedJobId ? (
                        <div className="flex items-center gap-2">
                          <span className="inline-flex items-center gap-1.5 text-xs font-medium text-[#2d6a4f] bg-[#d8f3dc] px-2.5 py-1 rounded-lg border border-[#b7e4c7]">
                            <CheckCircle2 size={13} className="text-[#2d6a4f]" />
                            <span>Saved in Dashboard</span>
                          </span>
                          <Link
                            href="/dashboard"
                            className="inline-flex items-center gap-1 text-xs text-[#6c6a64] hover:text-[#cc785c] underline font-medium"
                          >
                            <span>Open in Dashboard</span>
                            <ArrowUpRight size={12} />
                          </Link>
                        </div>
                      ) : (
                        <span className="text-[11px] text-[#6c6a64]">
                          Save this job to track candidates and view metrics in your dashboard.
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2.5">
                      <button
                        type="button"
                        onClick={() => saveJobToDashboard()}
                        disabled={isSavingJob}
                        className="inline-flex items-center gap-1.5 rounded-xl border border-[#e6dfd8] bg-white hover:bg-[#efe9de] px-4 py-2.5 text-xs font-medium text-[#141413] shadow-xs transition-all disabled:opacity-60 cursor-pointer"
                      >
                        {isSavingJob ? (
                          <Loader2 size={14} className="animate-spin text-[#cc785c]" />
                        ) : selectedJobId ? (
                          <Save size={14} className="text-[#cc785c]" />
                        ) : (
                          <BookmarkPlus size={14} className="text-[#cc785c]" />
                        )}
                        <span>{selectedJobId ? "Update Job in Dashboard" : "Save Job to Dashboard"}</span>
                      </button>

                      <button
                        type="button"
                        onClick={async () => {
                          if (!jobTitle.trim()) {
                            toast.error("Please enter a job title before proceeding.");
                            return;
                          }
                          if (user?.id) {
                            await saveJobToDashboard({ silent: true, advanceStep: true });
                          } else {
                            setCurrentStep(2);
                          }
                        }}
                        disabled={isSavingJob}
                        className="inline-flex items-center gap-2 rounded-xl bg-[#cc785c] px-6 py-2.5 text-xs font-semibold text-white hover:bg-[#a9583e] shadow-xs transition-all active:scale-95 disabled:opacity-70 cursor-pointer"
                      >
                        {isSavingJob ? (
                          <Loader2 size={14} className="animate-spin" />
                        ) : (
                          <>
                            <span>Proceed to Add Candidates</span>
                            <ChevronRight size={16} />
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>

              </div>
            </motion.div>
          )}

          {/* STEP 2: ADD CANDIDATES */}
          {currentStep === 2 && (
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#efe9de]/40 p-4 rounded-2xl border border-[#e6dfd8]">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-base font-semibold text-[#141413]">Step 2: Add Candidate Resume</h2>
                    <span className="text-[11px] font-mono text-[#cc785c] bg-[#efe9de] px-2.5 py-0.5 rounded-full border border-[#e6dfd8]">
                      For Job: {jobTitle || "Untitled Job"}
                    </span>
                    {selectedJobId ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-mono text-[#2d6a4f] bg-[#d8f3dc] px-2.5 py-0.5 rounded-full border border-[#b7e4c7]">
                        <CheckCircle2 size={11} /> Saved in Dashboard
                      </span>
                    ) : null}
                  </div>
                  <p className="text-xs text-[#6c6a64] mt-1">
                    Choose your preferred source: Upload a document file, paste a direct web URL/link, or pick a sample candidate.
                  </p>
                </div>

                <div className="flex items-center gap-1 bg-[#efe9de] p-1 rounded-xl border border-[#e6dfd8]">
                  <button
                    onClick={() => setInputTab("upload")}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${inputTab === "upload"
                      ? "bg-[#faf9f5] text-[#141413] shadow-xs font-semibold"
                      : "text-[#6c6a64] hover:text-[#141413]"
                      }`}
                  >
                    <Upload size={14} />
                    <span>Upload File</span>
                  </button>

                  <button
                    onClick={() => setInputTab("link")}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${inputTab === "link"
                      ? "bg-[#faf9f5] text-[#141413] shadow-xs font-semibold"
                      : "text-[#6c6a64] hover:text-[#141413]"
                      }`}
                  >
                    <LinkIcon size={14} />
                    <span>Resume Link</span>
                  </button>

                  <button
                    onClick={() => setInputTab("sample")}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${inputTab === "sample"
                      ? "bg-[#faf9f5] text-[#141413] shadow-xs font-semibold"
                      : "text-[#6c6a64] hover:text-[#141413]"
                      }`}
                  >
                    <Sparkles size={14} className="text-[#cc785c]" />
                    <span>Quick Samples</span>
                  </button>
                </div>
              </div>

              {/* Upload File */}
              {inputTab === "upload" && (
                <div className="border-2 border-dashed border-[#e6dfd8] hover:border-[#cc785c] transition-colors rounded-2xl p-8 bg-[#faf9f5] text-center space-y-4"
                  onClick={() => fileInputRef.current?.click()}
                >

                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileUpload}
                    accept=".txt,.pdf,.doc,.docx,.md,.json"
                    className="hidden"
                  />
                  <div className="w-12 h-12 rounded-2xl bg-[#efe9de] text-[#cc785c] flex items-center justify-center mx-auto border border-[#e6dfd8]">
                    <Upload size={24} />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-[#141413]">Drag and drop your resume file here</h3>
                    <p className="text-xs text-[#6c6a64] mt-1">Parses PDF, DOCX, TXT, Markdown, or JSON via FastAPI</p>
                  </div>
                  <button
                    className="inline-flex items-center gap-2 rounded-md bg-[#cc785c] px-4 py-2 text-xs font-medium text-white transition-all hover:bg-[#a9583e]"
                  >
                    <FileText size={14} />
                    <span>Select Resume File</span>
                  </button>
                </div>
              )}

              {/* Share Link */}
              {inputTab === "link" && (
                <div className="border border-[#e6dfd8] rounded-2xl p-6 bg-[#faf9f5] space-y-4">
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-[#3d3d3a] mb-2">
                      Share Resume Web URL / Public Link
                    </label>
                    <div className="flex items-center gap-2">
                      <div className="relative flex-1">
                        <LinkIcon size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#a09d96]" />
                        <input
                          type="url"
                          value={resumeUrlInput}
                          onChange={(e) => setResumeUrlInput(e.target.value)}
                          placeholder="https://example.com/resume.pdf or https://raw.githubusercontent.com/..."
                          className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-[#e6dfd8] bg-[#efe9de]/30 text-xs text-[#141413] focus:outline-none focus:border-[#cc785c]"
                        />
                      </div>
                      <button
                        onClick={handleFetchUrl}
                        disabled={isFetchingUrl}
                        className="inline-flex items-center gap-2 rounded-xl bg-[#cc785c] px-4 py-2.5 text-xs font-semibold text-white hover:bg-[#a9583e] disabled:opacity-50"
                      >
                        {isFetchingUrl ? (
                          <RefreshCw size={14} className="animate-spin" />
                        ) : (
                          <ExternalLink size={14} />
                        )}
                        <span>Extract Link</span>
                      </button>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-[11px] text-[#6c6a64]">
                    <Info size={13} className="text-[#cc785c]" />
                    <span>Supports direct web pages, raw GitHub files, public PDF endpoints, or cloud storage links.</span>
                  </div>
                </div>
              )}

              {/* Quick Samples */}
              {inputTab === "sample" && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {SAMPLE_RESUMES.map((sample) => (
                    <div
                      key={sample.id}
                      onClick={() => handleSelectSample(sample)}
                      className={`p-4 rounded-xl border transition-all cursor-pointer space-y-2.5 ${resumeText === sample.text
                        ? "border-[#cc785c] bg-[#efe9de]/50 ring-1 ring-[#cc785c]"
                        : "border-[#e6dfd8] bg-[#faf9f5] hover:border-[#cc785c]/60"
                        }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-xs text-[#141413]">{sample.name}</span>
                        <span className="text-[10px] font-mono text-[#cc785c] bg-[#efe9de] px-2.5 py-0.5 rounded-full">
                          Sample
                        </span>
                      </div>
                      <p className="text-xs font-mono font-medium text-[#3d3d3a]">{sample.role}</p>
                      <p className="text-[11px] text-[#6c6a64] leading-relaxed">{sample.snippet}</p>
                    </div>
                  ))}
                </div>
              )}

              {/* Text Preview */}
              {resumeText && (
                <div className="border border-[#e6dfd8] rounded-2xl bg-[#faf9f5] p-5 space-y-3">
                  <div className="flex items-center justify-between border-b border-[#e6dfd8] pb-3">
                    <div className="flex items-center gap-2 text-xs font-semibold text-[#141413]">
                      <FileText size={15} className="text-[#cc785c]" />
                      <span>Extracted Resume Text Preview</span>
                      <span className="text-[10px] font-mono text-[#6c6a64] bg-[#efe9de] px-2 py-0.5 rounded-full">
                        Source: {resumeSource.toUpperCase()} {resumeFileName && `(${resumeFileName})`}
                      </span>
                    </div>
                    <div className="text-[11px] font-mono text-[#6c6a64]">
                      {resumeText.split(/\s+/).filter(Boolean).length} words • {resumeText.length} chars
                    </div>
                  </div>

                  <textarea
                    value={resumeText}
                    onChange={(e) => setResumeText(e.target.value)}
                    rows={8}
                    className="w-full p-3 rounded-xl border border-[#e6dfd8] bg-[#efe9de]/20 font-mono text-xs text-[#141413] focus:outline-none focus:border-[#cc785c] leading-relaxed"
                    placeholder="Resume text content will appear here..."
                  />

                  <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                    <button
                      onClick={() => setCurrentStep(1)}
                      className="px-4 py-2.5 rounded-xl border border-[#e6dfd8] text-xs font-medium text-[#3d3d3a] hover:bg-[#efe9de] transition-colors"
                    >
                      ← Back to Job Details
                    </button>

                    <button
                      onClick={handleStartEvaluation}
                      className="inline-flex items-center gap-2 rounded-xl bg-[#cc785c] px-6 py-2.5 text-xs font-semibold text-white hover:bg-[#a9583e] shadow-md transition-all active:scale-95"
                    >
                      <Cpu size={15} />
                      <span>Start Evaluation & See Results</span>
                      <ChevronRight size={16} />
                    </button>
                  </div>
                </div>
              )}

              {!resumeText && (
                <div className="flex items-center justify-between pt-2">
                  <button
                    onClick={() => setCurrentStep(1)}
                    className="px-4 py-2.5 rounded-xl border border-[#e6dfd8] text-xs font-medium text-[#3d3d3a] hover:bg-[#efe9de] transition-colors"
                  >
                    ← Back to Job Details
                  </button>
                  <p className="text-xs text-[#6c6a64]">
                    Select or upload a candidate resume to evaluate.
                  </p>
                </div>
              )}
            </motion.div>
          )}

          {/* STEP 3: EVALUATION CONSOLE */}
          {currentStep === 3 && (
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              {isEvaluating && (
                <div className="rounded-2xl bg-aura-secondary p-8 text-[#141413] border border-[#e6dfd8] shadow-2xl space-y-6 text-center">
                  <div className="w-16 h-16 rounded-full bg-[#cc785c]/20 border-2 border-[#cc785c] text-[#cc785c] flex items-center justify-center mx-auto animate-spin">
                    <Cpu size={32} />
                  </div>
                  <div className="space-y-2">
                    <h3 className="font-serif text-xl font-normal text-[#faf9f5]">
                      FastAPI Screening Engine Executing...
                    </h3>
                    <p className="font-mono text-xs text-[#5db8a6] animate-pulse">
                      {evaluationStage}
                    </p>
                  </div>

                  <div className="max-w-md mx-auto bg-[#1f1e1b] rounded-xl p-4 font-mono text-[11px] text-[#a09d96] border border-[#252320] text-left space-y-1.5">
                    <div className="text-[#faf9f5] font-semibold flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-[#5db8a6] animate-ping" />
                      <span>FASTAPI ENDPOINT: {BACKEND_URL}/analyze-resume</span>
                    </div>
                    <div>&gt; Candidate CV buffer length: {resumeText.length} chars...</div>
                    <div>&gt; Target Profile: {jobTitle} ({seniority})</div>
                    <div>&gt; Required Skills: [{requiredSkills.join(", ")}]</div>
                    <div>&gt; Multi-factor rubric evaluation active...</div>
                  </div>
                </div>
              )}

              {!isEvaluating && evalResult && (
                <div className="space-y-6">

                  {/* Dashboard Tracking Notification Banner */}
                  <div className="bg-[#efe9de] border border-[#e6dfd8] rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-xl bg-white border border-[#e6dfd8] flex items-center justify-center text-emerald-600 shrink-0">
                        <CheckCircle2 size={16} />
                      </div>
                      <div>
                        <p className="text-xs font-medium text-[#141413]">
                          Candidate Tracked under <strong>{jobTitle}</strong>
                        </p>
                        <p className="text-[11px] text-[#6c6a64]">
                          Saved in your Recruiter Workspace with full rubric logs and interview probes.
                        </p>
                      </div>
                    </div>
                    <Link
                      href="/dashboard"
                      className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#141413] hover:bg-[#2c2b29] text-white text-xs font-mono transition-colors shrink-0"
                    >
                      <span>View in Dashboard</span>
                      <ArrowUpRight size={13} />
                    </Link>
                  </div>

                  {/* Top Score Banner */}
                  <div className="rounded-2xl bg-aura-secondary p-6 sm:p-8 text-[#141413] border border-[#e6dfd8] shadow-2xl relative overflow-hidden">
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">

                      <div className="lg:col-span-4 flex flex-col items-center justify-center text-center border-b lg:border-b-0 lg:border-r border-[#252320] pb-6 lg:pb-0 lg:pr-6 space-y-3">
                        <div className="relative flex items-center justify-center">
                          <svg className="w-32 h-32 transform -rotate-90">
                            <circle
                              cx="64"
                              cy="64"
                              r="54"
                              stroke="#252320"
                              strokeWidth="10"
                              fill="transparent"
                            />
                            <circle
                              cx="64"
                              cy="64"
                              r="54"
                              stroke={
                                evalResult.overallScore >= 85
                                  ? "#5db8a6"
                                  : evalResult.overallScore >= 70
                                    ? "#e8a55a"
                                    : "#c64545"
                              }
                              strokeWidth="10"
                              strokeDasharray={339}
                              strokeDashoffset={339 - (339 * evalResult.overallScore) / 100}
                              strokeLinecap="round"
                              fill="transparent"
                              className="transition-all duration-1000 ease-out"
                            />
                          </svg>
                          <div className="absolute flex flex-col items-center">
                            <span className="font-mono text-3xl font-bold text-[#faf9f5]">
                              {evalResult.overallScore}%
                            </span>
                            <span className="text-[10px] font-mono text-[#a09d96]">MATCH SCORE</span>
                          </div>
                        </div>

                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#252320] border border-[#3d3d3a]">
                          <Award size={14} className="text-[#e8a55a]" />
                          <span className="text-xs font-mono text-[#faf9f5]">
                            RATING FIT: <strong className="text-[#5db8a6]">{evalResult.fitRating}</strong>
                          </span>
                        </div>
                      </div>

                      <div className="lg:col-span-8 space-y-4">
                        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#252320] pb-3">
                          <div>
                            <div className="text-xs font-mono text-[#a09d96]">CANDIDATE NAME</div>
                            <h2 className="font-serif text-2xl text-[#faf9f5]">{evalResult.candidateName}</h2>
                          </div>

                          <div
                            className={`px-4 py-1.5 rounded-full text-xs font-mono font-bold tracking-wide border uppercase ${evalResult.verdictBadge.includes("RECOMMENDED")
                              ? "bg-[#5db8a6]/15 text-[#5db8a6] border-[#5db8a6]/40"
                              : evalResult.verdictBadge.includes("POTENTIAL")
                                ? "bg-[#e8a55a]/15 text-[#e8a55a] border-[#e8a55a]/40"
                                : "bg-[#c64545]/15 text-[#c64545] border-[#c64545]/40"
                              }`}
                          >
                            {evalResult.verdictBadge}
                          </div>
                        </div>

                        <div className="space-y-1.5">
                          <div className="text-xs font-mono text-[#cc785c] flex items-center gap-1.5">
                            <Cpu size={13} />
                            <span>FASTAPI AGENT VERDICT ({evalResult.metadata?.agentEngine || "FastAPI"}):</span>
                          </div>
                          <p className="text-sm font-sans text-[#e6dfd8] leading-relaxed">
                            {evalResult.executiveSummary}
                          </p>
                        </div>

                        <div className="pt-2 flex flex-wrap items-center gap-3">
                          <button
                            onClick={handleCopySummary}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#252320] hover:bg-[#3d3d3a] text-xs font-mono text-[#faf9f5] border border-[#3d3d3a] transition-all"
                          >
                            <Copy size={13} />
                            <span>Copy Report</span>
                          </button>

                          <button
                            onClick={handleDownloadJSON}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#252320] hover:bg-[#3d3d3a] text-xs font-mono text-[#faf9f5] border border-[#3d3d3a] transition-all"
                          >
                            <Download size={13} />
                            <span>Export JSON</span>
                          </button>

                          <button
                            onClick={() => setCurrentStep(2)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#252320] hover:bg-[#3d3d3a] text-xs font-mono text-[#faf9f5] border border-[#3d3d3a] transition-all ml-auto"
                          >
                            <RefreshCw size={13} />
                            <span>Add Another Candidate</span>
                          </button>

                          <button
                            onClick={() => {
                              handleResetNewJob();
                              setCurrentStep(1);
                            }}
                            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-[#cc785c] hover:bg-[#a9583e] text-xs font-semibold text-white shadow-xs transition-all cursor-pointer"
                          >
                            <Briefcase size={13} />
                            <span>Create New Job</span>
                          </button>

                          <Link
                            href={selectedJobId ? `/dashboard?job_id=${selectedJobId}` : "/dashboard"}
                            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-xs font-medium text-[#faf9f5] border border-white/20 shadow-xs transition-all"
                          >
                            <LayoutDashboard size={13} />
                            <span>View in Dashboard</span>
                          </Link>
                        </div>
                      </div>

                    </div>
                  </div>

                  {/* Strengths vs Risks */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="p-6 rounded-2xl bg-[#faf9f5] border border-[#e6dfd8] space-y-4">
                      <div className="flex items-center gap-2 text-sm font-semibold text-[#141413]">
                        <CheckCircle2 size={18} className="text-[#5db8a6]" />
                        <span>Verified Candidate Strengths</span>
                      </div>

                      <ul className="space-y-2.5">
                        {evalResult.strengths.map((str: string, idx: number) => (
                          <li key={idx} className="flex items-start gap-2.5 text-xs text-[#3d3d3a] leading-relaxed">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#5db8a6] mt-1.5 shrink-0" />
                            <span>{str}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="p-6 rounded-2xl bg-[#faf9f5] border border-[#e6dfd8] space-y-4">
                      <div className="flex items-center gap-2 text-sm font-semibold text-[#141413]">
                        <AlertTriangle size={18} className="text-[#e8a55a]" />
                        <span>Identified Gaps & Risk Factors</span>
                      </div>

                      <ul className="space-y-2.5">
                        {evalResult.gapsAndRisks.map((gap: string, idx: number) => (
                          <li key={idx} className="flex items-start gap-2.5 text-xs text-[#3d3d3a] leading-relaxed">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#e8a55a] mt-1.5 shrink-0" />
                            <span>{gap}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  {/* Skill Matrix */}
                  <div className="p-6 rounded-2xl bg-[#faf9f5] border border-[#e6dfd8] space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-sm font-semibold text-[#141413]">
                        <Briefcase size={18} className="text-[#cc785c]" />
                        <span>Required Skill Alignment Matrix</span>
                      </div>
                      <span className="text-xs font-mono text-[#6c6a64]">
                        {evalResult.skillMatrix.filter((s: any) => s.status === "matched").length} / {evalResult.skillMatrix.length} Matched
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                      {evalResult.skillMatrix.map((item: any, idx: number) => (
                        <div
                          key={idx}
                          className={`p-3 rounded-xl border space-y-1.5 text-xs ${item.status === "matched"
                            ? "bg-[#5db8a6]/10 border-[#5db8a6]/30 text-[#141413]"
                            : item.status === "partial"
                              ? "bg-[#e8a55a]/10 border-[#e8a55a]/30 text-[#141413]"
                              : "bg-[#c64545]/10 border-[#c64545]/30 text-[#141413]"
                            }`}
                        >
                          <div className="flex items-center justify-between font-semibold">
                            <span>{item.skill}</span>
                            <span className="capitalize text-[10px] font-mono font-bold">
                              {item.status}
                            </span>
                          </div>
                          {item.evidence && (
                            <p className="text-[11px] font-mono text-[#6c6a64] line-clamp-2">
                              {item.evidence}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Rubric Breakdown */}
                  <div className="p-6 rounded-2xl bg-[#faf9f5] border border-[#e6dfd8] space-y-5">
                    <div className="flex items-center gap-2 text-sm font-semibold text-[#141413]">
                      <Sliders size={18} className="text-[#cc785c]" />
                      <span>Multi-Factor Rubric Scores</span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {Object.entries(evalResult.rubricScores).map(([key, val]: [string, any]) => (
                        <div key={key} className="space-y-2">
                          <div className="flex justify-between items-center text-xs">
                            <span className="font-semibold text-[#141413] capitalize">
                              {key.replace(/([A-Z])/g, " $1")}
                            </span>
                            <span className="font-mono font-bold text-[#cc785c]">
                              {val.score}/100
                            </span>
                          </div>
                          <div className="w-full bg-[#efe9de] h-2 rounded-full overflow-hidden">
                            <div
                              className="bg-[#cc785c] h-full rounded-full transition-all duration-700"
                              style={{ width: `${val.score}%` }}
                            />
                          </div>
                          <p className="text-[11px] text-[#6c6a64]">{val.comment}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Probe Questions */}
                  <div className="p-6 rounded-2xl bg-[#faf9f5] border border-[#e6dfd8] space-y-4">
                    <div className="flex items-center gap-2 text-sm font-semibold text-[#141413]">
                      <HelpCircle size={18} className="text-[#cc785c]" />
                      <span>Suggested Interview Probe Questions</span>
                    </div>

                    <div className="space-y-3">
                      {evalResult.interviewQuestions.map((q: any, idx: number) => (
                        <div key={idx} className="p-4 rounded-xl bg-[#efe9de]/30 border border-[#e6dfd8] space-y-1.5">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-mono text-[#cc785c] bg-[#efe9de] px-2 py-0.5 rounded-full font-semibold">
                              {q.targetArea}
                            </span>
                            <span className="text-[10px] font-mono text-[#a09d96]">Q{idx + 1}</span>
                          </div>
                          <p className="text-xs font-semibold text-[#141413]">"{q.question}"</p>
                          <p className="text-[11px] text-[#6c6a64]">{q.rationale}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                </div>
              )}
            </motion.div>
          )}

        </div>
      </main>
    </div>
  );
}

export default function ScreeningPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#faf9f5] flex items-center justify-center text-xs font-mono">Loading Screening Workspace...</div>}>
      <ScreeningContent />
    </Suspense>
  );
}
