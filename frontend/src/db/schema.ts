import {
  timestamp,
  pgTable,
  text,
  boolean,
  integer,
  json,
  real,
} from "drizzle-orm/pg-core";

export const user = pgTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("emailVerified").notNull().default(false),
  image: text("image"),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
  updatedAt: timestamp("updatedAt").notNull().defaultNow(),
});

export const session = pgTable("session", {
  id: text("id").primaryKey(),
  expiresAt: timestamp("expiresAt").notNull(),
  token: text("token").notNull().unique(),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
  updatedAt: timestamp("updatedAt").notNull().defaultNow(),
  ipAddress: text("ipAddress"),
  userAgent: text("userAgent"),
  userId: text("userId")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
});

export const account = pgTable("account", {
  id: text("id").primaryKey(),
  accountId: text("accountId").notNull(),
  providerId: text("providerId").notNull(),
  userId: text("userId")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  accessToken: text("accessToken"),
  refreshToken: text("refreshToken"),
  idToken: text("idToken"),
  accessTokenExpiresAt: timestamp("accessTokenExpiresAt"),
  refreshTokenExpiresAt: timestamp("refreshTokenExpiresAt"),
  scope: text("scope"),
  password: text("password"),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
  updatedAt: timestamp("updatedAt").notNull().defaultNow(),
  issuer: text("issuer"),
});

export const verification = pgTable("verification", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: timestamp("expiresAt").notNull(),
  createdAt: timestamp("createdAt"),
  updatedAt: timestamp("updatedAt"),
});

export const jwks = pgTable("jwks", {
  id: text("id").primaryKey(),
  publicKey: text("publicKey").notNull(),
  privateKey: text("privateKey").notNull(),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
  expiresAt: timestamp("expiresAt"),
  alg: text("alg"),
  crv: text("crv"),
});

export const subscription = pgTable("subscription", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull(),
  stripeCustomerId: text("stripe_customer_id"),
  stripeSubscriptionId: text("stripe_subscription_id"),
  stripeSessionId: text("stripe_session_id"),
  plan: text("plan").notNull().default("pro"),
  interval: text("interval").notNull().default("month"),
  status: text("status").notNull().default("active"),
  amount: integer("amount"),
  currency: text("currency").default("usd"),
  currentPeriodEnd: timestamp("current_period_end"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const job = pgTable("job", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull(),
  title: text("title").notNull(),
  department: text("department"),
  seniority: text("seniority").notNull().default("Senior"),
  minExperienceYears: real("min_experience_years").notNull().default(3.0),
  requiredSkills: json("required_skills"),
  jobDescription: text("job_description").default(""),
  customCriteria: text("custom_criteria").default(""),
  status: text("status").notNull().default("active"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const candidateEvaluation = pgTable("candidate_evaluation", {
  id: text("id").primaryKey(),
  jobId: text("job_id").notNull(),
  userId: text("user_id").notNull(),
  candidateName: text("candidate_name").notNull(),
  candidateEmail: text("candidate_email"),
  resumeSnippet: text("resume_snippet"),
  resumeRawText: text("resume_raw_text"),
  matchScore: integer("match_score").notNull().default(0),
  fitRating: text("fit_rating").notNull().default("Moderate Fit"),
  verdictBadge: text("verdict_badge").notNull().default("POTENTIAL CANDIDATE"),
  executiveSummary: text("executive_summary"),
  strengths: json("strengths"),
  gapsAndRisks: json("gaps_and_risks"),
  rubricScores: json("rubric_scores"),
  interviewQuestions: json("interview_questions"),
  skillMatrix: json("skill_matrix"),
  hiringStatus: text("hiring_status").notNull().default("screened"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Backward compatibility export aliases if referenced elsewhere
export const users = user;
export const accounts = account;
export const sessions = session;
export const passwordResetTokens = verification;
export const subscriptions = subscription;
export const jobs = job;
export const candidateEvaluations = candidateEvaluation;


