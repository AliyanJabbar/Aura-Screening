export interface JobTitleOption {
  title: string;
  category: "Engineering" | "AI & Data" | "Sales & Marketing" | "Product & Design" | "Operations & HR";
  suggestedSeniority?: "Junior" | "Mid" | "Senior" | "Lead";
  suggestedMinExp?: number;
  suggestedSkills: string[];
  descriptionTemplate: string;
  customCriteriaTemplate?: string;
}

export const JOB_TITLE_OPTIONS: JobTitleOption[] = [
  // --- Engineering ---
  {
    title: "Full Stack Engineer",
    category: "Engineering",
    suggestedSeniority: "Senior",
    suggestedMinExp: 4,
    suggestedSkills: ["React", "TypeScript", "Node.js", "PostgreSQL", "Next.js", "Docker", "REST APIs", "AWS"],
    descriptionTemplate: "Seeking an experienced Full Stack Engineer to architect and build high-scale web platforms. Must have strong hands-on experience with frontend frameworks (React/Next.js), robust backend services (Node.js/TypeScript), and relational database systems (PostgreSQL).",
    customCriteriaTemplate: "Ensure candidate demonstrates strong end-to-end architecture and modern TypeScript experience.",
  },
  {
    title: "Frontend Developer",
    category: "Engineering",
    suggestedSeniority: "Mid",
    suggestedMinExp: 3,
    suggestedSkills: ["React", "TypeScript", "Next.js", "TailwindCSS", "HTML5", "CSS3", "JavaScript", "State Management (Redux/Zustand)"],
    descriptionTemplate: "Looking for a talented Frontend Developer passionate about building pixel-perfect, accessible, and high-performance user interfaces. Candidate will translate Figma design systems into responsive React and Next.js applications.",
    customCriteriaTemplate: "Prioritize strong CSS proficiency, modern React hooks, and component library creation.",
  },
  {
    title: "Backend Developer",
    category: "Engineering",
    suggestedSeniority: "Mid",
    suggestedMinExp: 3,
    suggestedSkills: ["Node.js", "Python", "PostgreSQL", "Redis", "REST APIs", "Docker", "Microservices", "SQL Optimization"],
    descriptionTemplate: "Seeking a Backend Developer to engineer scalable APIs, manage relational and NoSQL databases, and implement resilient microservices. Experience with caching, async queues, and distributed systems is essential.",
    customCriteriaTemplate: "Candidate must show expertise in database query optimization and API security best practices.",
  },
  {
    title: "DevOps Engineer",
    category: "Engineering",
    suggestedSeniority: "Senior",
    suggestedMinExp: 4,
    suggestedSkills: ["Docker", "Kubernetes", "AWS", "Terraform", "CI/CD (GitHub Actions)", "Linux", "Monitoring (Prometheus/Datadog)"],
    descriptionTemplate: "Looking for a DevOps Engineer to automate cloud infrastructure, maintain CI/CD pipelines, and ensure high availability across containerized production workloads.",
    customCriteriaTemplate: "Strong experience with infrastructure-as-code (Terraform) and Kubernetes orchestration required.",
  },
  {
    title: "Mobile App Developer",
    category: "Engineering",
    suggestedSeniority: "Mid",
    suggestedMinExp: 3,
    suggestedSkills: ["React Native", "Flutter", "TypeScript", "iOS (Swift)", "Android (Kotlin)", "REST APIs", "Mobile CI/CD"],
    descriptionTemplate: "Seeking a Mobile Developer to build performant cross-platform mobile apps for iOS and Android. Experience with app store deployments, offline state caching, and native bridge modules is required.",
    customCriteriaTemplate: "Proven track record publishing high-rated mobile apps on the App Store and Google Play.",
  },
  {
    title: "QA / Test Automation Engineer",
    category: "Engineering",
    suggestedSeniority: "Mid",
    suggestedMinExp: 3,
    suggestedSkills: ["Playwright", "Cypress", "Selenium", "Jest", "TypeScript", "API Testing (Postman)", "CI/CD Integration"],
    descriptionTemplate: "Seeking a QA Automation Engineer to design automated end-to-end testing frameworks, perform regression testing, and maintain test coverage across web and API services.",
    customCriteriaTemplate: "Hands-on experience with modern automation frameworks like Playwright or Cypress.",
  },
  {
    title: "Cloud Solutions Architect",
    category: "Engineering",
    suggestedSeniority: "Lead",
    suggestedMinExp: 7,
    suggestedSkills: ["AWS / GCP / Azure", "Cloud Architecture", "Terraform", "Kubernetes", "Microservices", "Security & Compliance"],
    descriptionTemplate: "Seeking a Cloud Solutions Architect to guide enterprise cloud migration, define multi-region disaster recovery, and ensure cost-optimized, highly available architecture.",
    customCriteriaTemplate: "AWS Solutions Architect Professional certification or equivalent production experience preferred.",
  },

  // --- AI & Data ---
  {
    title: "AI Engineer",
    category: "AI & Data",
    suggestedSeniority: "Senior",
    suggestedMinExp: 4,
    suggestedSkills: ["Python", "PyTorch", "LLMs", "RAG Pipelines", "LangChain", "Vector Databases", "FastAPI", "Prompt Engineering"],
    descriptionTemplate: "Seeking an innovative AI Engineer to build generative AI solutions, semantic search pipelines, and autonomous agent workflows. Experience deploying LLMs and fine-tuning models in production is highly desired.",
    customCriteriaTemplate: "Hands-on experience with vector embeddings, RAG indexing, and modern LLM frameworks.",
  },
  {
    title: "AI Automation Engineer",
    category: "AI & Data",
    suggestedSeniority: "Mid",
    suggestedMinExp: 2,
    suggestedSkills: ["Python", "OpenAI / Gemini API", "n8n", "Workflow Automation", "LangChain", "Zapier", "Webhooks & REST APIs"],
    descriptionTemplate: "Looking for an AI Automation Engineer to connect enterprise software through autonomous agents, LLM pipelines, and automated webhook workflows. Candidate will streamline manual operations into automated agentic processes.",
    customCriteriaTemplate: "Demonstrated ability to deploy automated workflows and integrate third-party APIs with LLM orchestration.",
  },
  {
    title: "Machine Learning Engineer",
    category: "AI & Data",
    suggestedSeniority: "Senior",
    suggestedMinExp: 4,
    suggestedSkills: ["Python", "PyTorch", "TensorFlow", "Scikit-Learn", "MLOps (MLflow/Kubeflow)", "Feature Engineering", "Docker"],
    descriptionTemplate: "Seeking an ML Engineer to develop, train, validate, and deploy predictive models to production. Must possess strong mathematical foundation and deep understanding of model lifecycle management.",
    customCriteriaTemplate: "Production experience serving models with low latency and managing data drift monitoring.",
  },
  {
    title: "Data Scientist",
    category: "AI & Data",
    suggestedSeniority: "Mid",
    suggestedMinExp: 3,
    suggestedSkills: ["Python", "SQL", "Pandas", "Statistical Modeling", "Data Visualization (Tableau/PowerBI)", "A/B Testing", "Machine Learning"],
    descriptionTemplate: "Seeking a Data Scientist to analyze complex datasets, unearth predictive trends, formulate business hypotheses, and deliver executive-ready insights.",
    customCriteriaTemplate: "Advanced SQL fluency and proven ability to translate complex data into business decisions.",
  },
  {
    title: "Data Engineer",
    category: "AI & Data",
    suggestedSeniority: "Senior",
    suggestedMinExp: 4,
    suggestedSkills: ["Python", "SQL", "Apache Spark", "Airflow", "Snowflake / BigQuery", "ETL Pipelines", "Data Warehousing"],
    descriptionTemplate: "Seeking a Data Engineer to construct reliable, scalable ETL/ELT pipelines, manage cloud data warehouses, and guarantee high data quality for downstream analytics.",
    customCriteriaTemplate: "Experience handling high-volume distributed data streams and orchestration DAGs.",
  },
  {
    title: "Prompt Engineer",
    category: "AI & Data",
    suggestedSeniority: "Mid",
    suggestedMinExp: 2,
    suggestedSkills: ["Prompt Design & Optimization", "Few-Shot Learning", "LLM Evaluation", "Python", "OpenAI / Gemini APIs", "Chain-of-Thought"],
    descriptionTemplate: "Looking for a Prompt Engineer to systematically craft, evaluate, and benchmark prompts across diverse LLM foundation models to maximize accuracy and minimize hallucinations.",
    customCriteriaTemplate: "Deep understanding of prompt patterns, temperature calibration, and structured JSON output enforcement.",
  },

  // --- Sales & Marketing ---
  {
    title: "Sales Person",
    category: "Sales & Marketing",
    suggestedSeniority: "Mid",
    suggestedMinExp: 3,
    suggestedSkills: ["B2B Sales", "Lead Generation", "CRM (Salesforce / HubSpot)", "Cold Outreach", "Negotiation", "Client Relationship Management", "Product Demonstrations"],
    descriptionTemplate: "Seeking an energetic Sales Person / Account Executive to manage customer discovery, execute compelling software demonstrations, build pipeline, and close outbound/inbound deals.",
    customCriteriaTemplate: "Consistent history of exceeding quarterly quota targets and managing complex consultative sales cycles.",
  },
  {
    title: "Marketing",
    category: "Sales & Marketing",
    suggestedSeniority: "Mid",
    suggestedMinExp: 3,
    suggestedSkills: ["Digital Marketing", "Content Strategy", "SEO", "Google Analytics", "Social Media Marketing", "Email Campaigns", "Copywriting", "Paid Ads (PPC)"],
    descriptionTemplate: "Looking for an all-around Marketing Specialist to develop brand presence, run organic and paid customer acquisition campaigns, create compelling content, and measure conversion funnels.",
    customCriteriaTemplate: "Demonstrated success in driving qualified leads and scaling organic search presence.",
  },
  {
    title: "Business Development Representative (BDR)",
    category: "Sales & Marketing",
    suggestedSeniority: "Junior",
    suggestedMinExp: 1,
    suggestedSkills: ["Cold Calling", "Email Outreach", "LinkedIn Prospecting", "CRM (HubSpot/Salesforce)", "Lead Qualification (BANT)", "Sales Cadences"],
    descriptionTemplate: "Seeking a tenacious BDR to identify high-value target accounts, conduct multi-touch outreach, and book qualified meetings for account executives.",
    customCriteriaTemplate: "Strong communication skills and resilience with proven outbound appointment setting metrics.",
  },
  {
    title: "Digital Marketing Specialist",
    category: "Sales & Marketing",
    suggestedSeniority: "Mid",
    suggestedMinExp: 3,
    suggestedSkills: ["Google Ads", "Meta Ads Manager", "SEO / SEM", "Conversion Rate Optimization (CRO)", "Google Analytics 4", "Performance Marketing"],
    descriptionTemplate: "Seeking a performance-driven Digital Marketing Specialist to manage paid acquisition budgets, optimize landing pages, and scale customer acquisition cost (CAC) efficiencies.",
    customCriteriaTemplate: "Direct experience managing significant ad spend with positive ROAS and attribution modeling.",
  },
  {
    title: "Content Marketing Strategist",
    category: "Sales & Marketing",
    suggestedSeniority: "Mid",
    suggestedMinExp: 3,
    suggestedSkills: ["Content Strategy", "Copywriting", "SEO Optimization", "Case Studies", "Blog Management", "Editorial Calendars"],
    descriptionTemplate: "Seeking a Content Strategist to write captivating technical articles, customer case studies, newsletters, and white papers that educate our audience and build domain authority.",
    customCriteriaTemplate: "Exceptional written portfolio demonstrating engaging storytelling for B2B or tech audiences.",
  },
  {
    title: "Growth Marketer",
    category: "Sales & Marketing",
    suggestedSeniority: "Senior",
    suggestedMinExp: 4,
    suggestedSkills: ["Growth Hacking", "Viral Loops", "A/B Testing", "Mixpanel / Amplitude", "Product-Led Growth (PLG)", "Funnel Optimization"],
    descriptionTemplate: "Seeking a Growth Marketer to drive rapid experimentation across acquisition, activation, retention, referral, and revenue (AARRR) loops.",
    customCriteriaTemplate: "Proven track record running rigorous data-backed experiments that scaled user base significantly.",
  },

  // --- Product & Design ---
  {
    title: "Product Manager",
    category: "Product & Design",
    suggestedSeniority: "Mid",
    suggestedMinExp: 3,
    suggestedSkills: ["Product Strategy", "User Research", "Agile / Scrum", "Wireframing", "Roadmapping", "Data Analytics", "Cross-Functional Leadership"],
    descriptionTemplate: "Seeking a Product Manager to bridge user needs, business goals, and engineering execution. Will prioritize feature roadmaps, write crisp user stories, and track product adoption metrics.",
    customCriteriaTemplate: "Experience managing SaaS products from concept to launch with customer-centric discovery methods.",
  },
  {
    title: "UI/UX Designer",
    category: "Product & Design",
    suggestedSeniority: "Mid",
    suggestedMinExp: 3,
    suggestedSkills: ["Figma", "UI Design", "User Experience (UX)", "Prototyping", "Design Systems", "User Research", "Wireframing"],
    descriptionTemplate: "Seeking a creative UI/UX Designer to craft intuitive user flows, maintain a cohesive component design system in Figma, and build prototypes validated by real user testing.",
    customCriteriaTemplate: "Compelling portfolio highlighting end-to-end design thinking, micro-interactions, and design systems.",
  },

  // --- Operations & HR ---
  {
    title: "Customer Success Specialist",
    category: "Operations & HR",
    suggestedSeniority: "Mid",
    suggestedMinExp: 2,
    suggestedSkills: ["Customer Onboarding", "Account Management", "Zendesk / Intercom", "Churn Reduction", "Client Training", "Problem Solving"],
    descriptionTemplate: "Seeking a Customer Success Specialist to onboard new enterprise clients, ensure ongoing product satisfaction, resolve escalations, and drive renewal retention.",
    customCriteriaTemplate: "High empathy, excellent client communication, and experience maintaining high NPS / CSAT scores.",
  },
  {
    title: "HR & Talent Acquisition Specialist",
    category: "Operations & HR",
    suggestedSeniority: "Mid",
    suggestedMinExp: 3,
    suggestedSkills: ["Technical Recruiting", "Candidate Sourcing", "Interview Coordination", "ATS Management", "Employee Onboarding", "HR Policies"],
    descriptionTemplate: "Seeking a Talent Acquisition Specialist to drive full-lifecycle hiring, source top candidates, conduct screening interviews, and deliver an exceptional candidate experience.",
    customCriteriaTemplate: "Experience recruiting for engineering, AI, and commercial business roles in fast-growing teams.",
  },
];

// Flat list of all job titles
export const JOB_TITLES: string[] = JOB_TITLE_OPTIONS.map((item) => item.title);

/**
 * Filter job titles given an input query.
 * Matches available options containing the typed in query string.
 */
export function filterJobTitles(query: string, limit: number = 8): JobTitleOption[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  return JOB_TITLE_OPTIONS.filter((item) =>
    item.title.toLowerCase().includes(q)
  ).slice(0, limit);
}
