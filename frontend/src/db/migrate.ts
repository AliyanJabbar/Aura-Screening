import fs from "fs";
import path from "path";

const envFile = fs.readFileSync(path.join(process.cwd(), ".env"), "utf-8");
envFile.split("\n").forEach((line) => {
  const [key, ...vals] = line.split("=");
  if (key && vals.length > 0) {
    const val = vals.join("=").trim().replace(/^["']|["']$/g, "");
    process.env[key.trim()] = val;
  }
});

async function runMigration() {
  const { neon } = await import("@neondatabase/serverless");
  const sql = neon(process.env.DATABASE_URL!);

  console.log("Creating tables in Neon DB...");

  await sql`
    CREATE TABLE IF NOT EXISTS "user" (
      "id" TEXT PRIMARY KEY,
      "name" TEXT NOT NULL,
      "email" TEXT NOT NULL UNIQUE,
      "emailVerified" BOOLEAN NOT NULL DEFAULT false,
      "image" TEXT,
      "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
      "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW()
    );
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS "session" (
      "id" TEXT PRIMARY KEY,
      "expiresAt" TIMESTAMP NOT NULL,
      "token" TEXT NOT NULL UNIQUE,
      "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
      "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW(),
      "ipAddress" TEXT,
      "userAgent" TEXT,
      "userId" TEXT NOT NULL REFERENCES "user"("id") ON DELETE CASCADE
    );
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS "account" (
      "id" TEXT PRIMARY KEY,
      "accountId" TEXT NOT NULL,
      "providerId" TEXT NOT NULL,
      "userId" TEXT NOT NULL REFERENCES "user"("id") ON DELETE CASCADE,
      "accessToken" TEXT,
      "refreshToken" TEXT,
      "idToken" TEXT,
      "accessTokenExpiresAt" TIMESTAMP,
      "refreshTokenExpiresAt" TIMESTAMP,
      "scope" TEXT,
      "password" TEXT,
      "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
      "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW(),
      "issuer" TEXT
    );
  `;

  await sql`
    ALTER TABLE "account" ADD COLUMN IF NOT EXISTS "issuer" TEXT;
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS "verification" (
      "id" TEXT PRIMARY KEY,
      "identifier" TEXT NOT NULL,
      "value" TEXT NOT NULL,
      "expiresAt" TIMESTAMP NOT NULL,
      "createdAt" TIMESTAMP,
      "updatedAt" TIMESTAMP
    );
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS "jwks" (
      "id" TEXT PRIMARY KEY,
      "publicKey" TEXT NOT NULL,
      "privateKey" TEXT NOT NULL,
      "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
      "expiresAt" TIMESTAMP,
      "alg" TEXT,
      "crv" TEXT
    );
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS "subscription" (
      "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
      "user_id" TEXT NOT NULL,
      "stripe_customer_id" TEXT,
      "stripe_subscription_id" TEXT,
      "stripe_session_id" TEXT,
      "plan" TEXT NOT NULL DEFAULT 'pro',
      "interval" TEXT NOT NULL DEFAULT 'month',
      "status" TEXT NOT NULL DEFAULT 'active',
      "amount" INTEGER,
      "currency" TEXT DEFAULT 'usd',
      "current_period_end" TIMESTAMP,
      "created_at" TIMESTAMP NOT NULL DEFAULT NOW(),
      "updated_at" TIMESTAMP NOT NULL DEFAULT NOW()
    );
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS "job" (
      "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
      "user_id" TEXT NOT NULL,
      "title" TEXT NOT NULL,
      "department" TEXT,
      "seniority" TEXT NOT NULL DEFAULT 'Senior',
      "min_experience_years" REAL NOT NULL DEFAULT 3.0,
      "required_skills" JSON,
      "job_description" TEXT DEFAULT '',
      "custom_criteria" TEXT DEFAULT '',
      "status" TEXT NOT NULL DEFAULT 'active',
      "created_at" TIMESTAMP NOT NULL DEFAULT NOW(),
      "updated_at" TIMESTAMP NOT NULL DEFAULT NOW()
    );
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS "candidate_evaluation" (
      "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
      "job_id" TEXT NOT NULL REFERENCES "job"("id") ON DELETE CASCADE,
      "user_id" TEXT NOT NULL,
      "candidate_name" TEXT NOT NULL,
      "candidate_email" TEXT,
      "resume_snippet" TEXT,
      "resume_raw_text" TEXT,
      "match_score" INTEGER NOT NULL DEFAULT 0,
      "fit_rating" TEXT NOT NULL DEFAULT 'Moderate Fit',
      "verdict_badge" TEXT NOT NULL DEFAULT 'POTENTIAL CANDIDATE',
      "executive_summary" TEXT,
      "strengths" JSON,
      "gaps_and_risks" JSON,
      "rubric_scores" JSON,
      "interview_questions" JSON,
      "skill_matrix" JSON,
      "hiring_status" TEXT NOT NULL DEFAULT 'screened',
      "created_at" TIMESTAMP NOT NULL DEFAULT NOW(),
      "updated_at" TIMESTAMP NOT NULL DEFAULT NOW()
    );
  `;

  console.log("Tables created successfully!");
  const tables = await sql`SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'`;
  console.log("Current DB Tables:", tables);
}

runMigration().catch(console.error);
