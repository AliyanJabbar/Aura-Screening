"use client";

import React, { useEffect, useState, Suspense } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "motion/react";
import { useSession } from "@/lib/auth-client";
import {
  User,
  Zap,
  Sparkles,
  ShieldCheck,
  ArrowRight,
  ArrowLeft,
  FileCheck2,
  Clock,
  CheckCircle2,
  Loader2,
  AlertCircle,
  CreditCard,
  ChevronRight,
  RefreshCw,
  Undo2,
  X,
  ExternalLink,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface ProfileUsageData {
  user_id: string | null;
  plan: string;
  plan_name: string;
  status: string;
  total_credits: number;
  credits_used: number;
  credits_remaining: number;
  interval: string;
  current_period_end: string | null;
}

const PLAN_FEATURES: Record<string, string[]> = {
  starter: [
    "10 CV evaluations / month",
    "Standard criteria matching engine",
    "Demographic bias shield",
    "Instant PDF & CSV export",
  ],
  pro: [
    "100 CV evaluations / month",
    "Multiple CV evaluation in a single run",
    "Real-time AI decision audit logs",
    "Priority batch processing queue",
    "Greenhouse & Lever ATS connectors",
  ],
  "pro-max": [
    "1,000 CV evaluations / month",
    "Custom LLM fine-tuning on company taxonomy",
    "Dedicated SOC2 & GDPR compliance shield",
    "SLA guaranteed inference latency",
    "Dedicated HR solutions architect",
  ],
};

interface RollbackTarget {
  planKey: string;
  name: string;
  runs: number;
}

function ProfileContent() {
  const { data: sessionData, isPending: isAuthPending } = useSession();
  const user = sessionData?.user;

  const [usage, setUsage] = useState<ProfileUsageData | null>(null);
  const [loadingUsage, setLoadingUsage] = useState(true);
  const [isUpgrading, setIsUpgrading] = useState(false);
  const [isOpeningPortal, setIsOpeningPortal] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Rollback Modal State
  const [rollbackTarget, setRollbackTarget] = useState<RollbackTarget | null>(null);
  const [isRollingBack, setIsRollingBack] = useState(false);

  const fetchUsage = async () => {
    try {
      setLoadingUsage(true);
      setError(null);

      const backendUrl =
        process.env.NEXT_PUBLIC_API_URL ||
        process.env.NEXT_PUBLIC_BACKEND_URL ||
        "https://aura-screening.fastapicloud.dev";

      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };

      const userToken = sessionData?.session?.token;
      if (userToken) {
        headers["Authorization"] = `Bearer ${userToken}`;
      }

      const queryParam = user?.id ? `?user_id=${encodeURIComponent(user.id)}` : "";
      const res = await fetch(`${backendUrl}/payments/profile-usage${queryParam}`, {
        headers,
      });

      if (!res.ok) {
        throw new Error(`Failed to load profile usage (status: ${res.status})`);
      }

      const data: ProfileUsageData = await res.json();
      setUsage(data);
    } catch (err: any) {
      console.error("Error loading profile credits:", err);
      setError(err?.message || "Could not retrieve credit information.");
    } finally {
      setLoadingUsage(false);
    }
  };

  useEffect(() => {
    if (!isAuthPending) {
      fetchUsage();
    }
  }, [user?.id, isAuthPending]);

  const handleUpgradeCheckout = async (targetPlan: string) => {
    try {
      setIsUpgrading(true);
      setError(null);
      const backendUrl =
        process.env.NEXT_PUBLIC_API_URL ||
        process.env.NEXT_PUBLIC_BACKEND_URL ||
        "https://aura-screening.fastapicloud.dev";

      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };

      const userToken = sessionData?.session?.token;
      if (userToken) {
        headers["Authorization"] = `Bearer ${userToken}`;
      }

      const res = await fetch(`${backendUrl}/payments/create-checkout-session`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          plan: targetPlan,
          interval: "month",
          user_id: user?.id || undefined,
          user_email: user?.email || undefined,
          ui_mode: "hosted",
        }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.detail || "Unable to initiate Stripe checkout.");
      }

      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      }
    } catch (err: any) {
      setError(err.message || "Failed to launch Stripe checkout");
      setIsUpgrading(false);
    }
  };

  const handleConfirmRollback = async () => {
    if (!rollbackTarget) return;

    try {
      setIsRollingBack(true);
      setError(null);

      const backendUrl =
        process.env.NEXT_PUBLIC_API_URL ||
        process.env.NEXT_PUBLIC_BACKEND_URL ||
        "https://aura-screening.fastapicloud.dev";

      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };

      const userToken = sessionData?.session?.token;
      if (userToken) {
        headers["Authorization"] = `Bearer ${userToken}`;
      }

      const res = await fetch(`${backendUrl}/payments/rollback-subscription`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          target_plan: rollbackTarget.planKey,
          user_id: user?.id || undefined,
        }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.detail || "Unable to process subscription rollback.");
      }

      const result = await res.json();
      setSuccessMessage(
        result.message || `Successfully rolled back subscription to ${rollbackTarget.name}.`
      );
      setRollbackTarget(null);
      await fetchUsage();
    } catch (err: any) {
      setError(err.message || "Rollback failed. Please try again.");
    } finally {
      setIsRollingBack(false);
    }
  };

  const handleOpenStripePortal = async () => {
    try {
      setIsOpeningPortal(true);
      setError(null);

      const backendUrl =
        process.env.NEXT_PUBLIC_API_URL ||
        process.env.NEXT_PUBLIC_BACKEND_URL ||
        "https://aura-screening.fastapicloud.dev";

      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };

      const userToken = sessionData?.session?.token;
      if (userToken) {
        headers["Authorization"] = `Bearer ${userToken}`;
      }

      const res = await fetch(`${backendUrl}/payments/create-portal-session`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          user_id: user?.id || undefined,
          return_url: `${window.location.origin}/profile`,
        }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.detail || "Unable to open billing portal.");
      }

      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      }
    } catch (err: any) {
      setError(err.message || "Could not launch Stripe billing portal.");
      setIsOpeningPortal(false);
    }
  };

  const getInitials = (name?: string | null, email?: string | null) => {
    if (name) return name.charAt(0).toUpperCase();
    if (email) return email.charAt(0).toUpperCase();
    return "U";
  };

  if (isAuthPending) {
    return (
      <div className="min-h-screen bg-[#faf9f5] flex items-center justify-center">
        <div className="flex items-center gap-3 text-sm text-[#6c6a64]">
          <Loader2 className="animate-spin text-[#cc785c]" size={20} />
          <span>Loading user profile...</span>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-[#faf9f5] flex items-center justify-center py-16 px-4">
        <div className="max-w-md w-full bg-white border border-[#e6dfd8] rounded-3xl p-8 sm:p-10 text-center shadow-xs">
          <div className="w-14 h-14 rounded-2xl bg-[#efe9de] text-[#141413] mx-auto flex items-center justify-center mb-5">
            <User size={28} />
          </div>
          <h2 className="font-serif text-2xl text-[#141413]">Account Required</h2>
          <p className="text-xs text-[#6c6a64] mt-2 mb-6">
            Please log in or create an account to view your profile and evaluate candidate CVs.
          </p>
          <div className="flex flex-col gap-2.5">
            <Link
              href="/login"
              className="w-full py-3 rounded-xl bg-[#cc785c] text-white text-xs font-semibold hover:bg-[#a9583e] transition-colors"
            >
              Log In
            </Link>
            <Link
              href="/register"
              className="w-full py-3 rounded-xl bg-[#efe9de] text-[#141413] text-xs font-medium hover:bg-[#e8e0d2] transition-colors border border-[#e6dfd8]"
            >
              Create Account
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const normalizedPlan = (usage?.plan || "starter").toLowerCase();
  const totalCredits = usage?.total_credits ?? 10;
  const usedCredits = usage?.credits_used ?? 0;
  const remainingCredits = usage?.credits_remaining ?? 10;
  const usagePercentage = Math.min(
    100,
    Math.round((usedCredits / (totalCredits || 1)) * 100)
  );

  const isProMax = normalizedPlan.includes("max");
  const isPro = normalizedPlan.includes("pro") && !isProMax;
  const isStarter = !isPro && !isProMax;

  const planFeatures =
    PLAN_FEATURES[normalizedPlan] ||
    (isProMax ? PLAN_FEATURES["pro-max"] : isPro ? PLAN_FEATURES["pro"] : PLAN_FEATURES["starter"]);

  return (
    <div className="min-h-screen bg-[#faf9f5] text-[#141413] pt-24 pb-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto space-y-8">
        {/* Navigation Breadcrumb */}
        <div className="flex items-center justify-between">
          <Link
            href="/screening"
            className="inline-flex items-center gap-2 text-xs font-medium text-[#6c6a64] hover:text-[#141413] transition-colors"
          >
            <ArrowLeft size={14} />
            Back to CV Screening Portal
          </Link>

          <button
            onClick={fetchUsage}
            disabled={loadingUsage}
            className="inline-flex items-center gap-1.5 text-xs text-[#6c6a64] hover:text-[#141413] transition-colors"
          >
            <RefreshCw size={13} className={loadingUsage ? "animate-spin" : ""} />
            <span>Refresh Status</span>
          </button>
        </div>

        {/* Feedback Alerts */}
        {error && (
          <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-red-800 text-xs flex items-center justify-between gap-3 shadow-xs">
            <div className="flex items-center gap-2">
              <AlertCircle size={16} className="shrink-0 text-red-600" />
              <span>{error}</span>
            </div>
            <button onClick={() => setError(null)} className="text-red-500 hover:text-red-800">
              <X size={14} />
            </button>
          </div>
        )}

        {successMessage && (
          <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center justify-between gap-3 shadow-xs">
            <div className="flex items-center gap-2">
              <CheckCircle2 size={16} className="shrink-0 text-emerald-600" />
              <span>{successMessage}</span>
            </div>
            <button
              onClick={() => setSuccessMessage(null)}
              className="text-emerald-500 hover:text-emerald-800"
            >
              <X size={14} />
            </button>
          </div>
        )}

        {/* Profile Header Card */}
        <div className="bg-white border border-[#e6dfd8] rounded-3xl p-6 sm:p-8 shadow-xs">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
            <div className="flex items-center gap-5">
              <Avatar className="h-16 w-16 border-2 border-[#e6dfd8]">
                <AvatarImage src={user.image || undefined} alt={user.name || "User"} />
                <AvatarFallback className="bg-[#cc785c] text-white font-serif text-2xl font-medium">
                  {getInitials(user.name, user.email)}
                </AvatarFallback>
              </Avatar>

              <div className="space-y-1">
                <div className="flex items-center gap-2.5">
                  <h1 className="font-serif text-2xl sm:text-3xl font-medium text-[#141413]">
                    {user.name || "Recruitment Specialist"}
                  </h1>
                  <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-700 border border-emerald-200 text-[11px] font-medium px-2 py-0.5 rounded-full">
                    <ShieldCheck size={12} />
                    Verified
                  </span>
                </div>
                <p className="text-xs text-[#6c6a64] font-mono">{user.email}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Link
                href="/screening"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-aura-primary text-white hover:bg-aura-primary/80  text-xs font-medium transition-all shadow-xs"
              >
                <FileCheck2 size={15} />
                <span>Launch Screening Engine</span>
                <ArrowRight size={14} />
              </Link>
            </div>
          </div>
        </div>

        {/* Credits & Subscription Dashboard Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Main Runs & Credits Card (Left Column) */}
          <div className="lg:col-span-7 bg-white border border-[#e6dfd8] rounded-3xl p-6 sm:p-8 shadow-xs space-y-6">
            <div className="flex items-center justify-between border-b border-[#e6dfd8] pb-5">
              <div>
                <span className="text-xs font-mono uppercase tracking-wider text-[#cc785c] font-semibold">
                  Usage & Capacity
                </span>
                <h2 className="font-serif text-2xl text-[#141413] mt-1 font-normal">
                  Evaluation Runs
                </h2>
              </div>

              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#cc785c]/10 text-[#cc785c] border border-[#cc785c]/20 text-xs font-semibold uppercase tracking-wider">
                <Sparkles size={13} />
                <span>{usage?.plan_name || "Starter Plan"}</span>
              </div>
            </div>

            {/* Run Counters Big Display */}
            <div className="grid grid-cols-3 gap-4 pt-2">
              <div className="bg-[#faf9f5] border border-[#e6dfd8] rounded-2xl p-4 text-center">
                <span className="text-[11px] font-mono uppercase text-[#6c6a64]">Available</span>
                <p className="font-serif text-3xl sm:text-4xl text-[#cc785c] font-normal mt-1">
                  {remainingCredits}
                </p>
                <span className="text-[10px] text-[#6c6a64]">runs left</span>
              </div>

              <div className="bg-[#faf9f5] border border-[#e6dfd8] rounded-2xl p-4 text-center">
                <span className="text-[11px] font-mono uppercase text-[#6c6a64]">Used</span>
                <p className="font-serif text-3xl sm:text-4xl text-[#141413] font-normal mt-1">
                  {usedCredits}
                </p>
                <span className="text-[10px] text-[#6c6a64]">evaluations run</span>
              </div>

              <div className="bg-[#faf9f5] border border-[#e6dfd8] rounded-2xl p-4 text-center">
                <span className="text-[11px] font-mono uppercase text-[#6c6a64]">Total Quota</span>
                <p className="font-serif text-3xl sm:text-4xl text-[#141413] font-normal mt-1">
                  {totalCredits}
                </p>
                <span className="text-[10px] text-[#6c6a64]">runs / month</span>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="space-y-2 pt-2">
              <div className="flex justify-between text-xs text-[#6c6a64]">
                <span>Monthly Quota Consumption</span>
                <span className="font-mono font-medium text-[#141413]">
                  {usedCredits} / {totalCredits} ({usagePercentage}%)
                </span>
              </div>
              <div className="w-full h-3 rounded-full bg-[#efe9de] overflow-hidden p-0.5 border border-[#e6dfd8]">
                <div
                  className="h-full rounded-full bg-[#cc785c] transition-all duration-500"
                  style={{ width: `${Math.max(4, usagePercentage)}%` }}
                />
              </div>
            </div>

            {/* Quota Reset / Renewal Info */}
            <div className="p-4 rounded-2xl bg-[#faf9f5] border border-[#e6dfd8] flex items-center gap-3 text-xs text-[#6c6a64]">
              <Clock size={16} className="text-[#cc785c] shrink-0" />
              <div>
                <span className="font-medium text-[#141413]">Monthly Reset: </span>
                Evaluations refresh every billing cycle. Unused runs reset at the start of your next cycle.
              </div>
            </div>

            {/* Action Buttons */}
            <div className="pt-2 space-y-3">
              <div className="flex flex-col sm:flex-row gap-3">
                <Link
                  href="/screening"
                  className="flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-[#cc785c] hover:bg-[#a9583e] text-white font-medium text-xs transition-all shadow-xs"
                >
                  <Zap size={15} />
                  <span>Evaluate a Resume Now</span>
                </Link>

                {/* Upgrade Button if not on Pro Max */}
                {!isProMax && (
                  <button
                    onClick={() => handleUpgradeCheckout(isPro ? "pro-max" : "pro")}
                    disabled={isUpgrading}
                    className="flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-aura-secondary hover:bg-aura-primary  text-black font-medium text-xs transition-all shadow-xs"
                  >
                    {isUpgrading ? (
                      <Loader2 size={14} className="animate-spin" />
                    ) : (
                      <CreditCard size={14} className="text-[#cc785c]" />
                    )}
                    <span>
                      {isUpgrading
                        ? "Opening Stripe..."
                        : isPro
                          ? "Upgrade to Pro Max (1,000 Runs)"
                          : "Upgrade to Pro (100 Runs)"}
                    </span>
                  </button>
                )}
              </div>

              {/* Rollback / Downgrade Controls */}
              {!isStarter && (
                <div className="pt-2 border-t border-[#e6dfd8] flex flex-wrap items-center gap-2.5">
                  <span className="text-[11px] font-mono uppercase text-[#6c6a64] mr-1">
                    Subscription Management:
                  </span>

                  {isProMax && (
                    <button
                      onClick={() =>
                        setRollbackTarget({
                          planKey: "pro",
                          name: "Pro Plan",
                          runs: 100,
                        })
                      }
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#e6dfd8] hover:border-[#cc785c] text-[#141413] hover:text-[#cc785c] text-xs font-medium bg-[#faf9f5] transition-all"
                    >
                      <Undo2 size={13} />
                      <span>Rollback to Pro</span>
                    </button>
                  )}

                  <button
                    onClick={() =>
                      setRollbackTarget({
                        planKey: "starter",
                        name: "Starter Plan (Free)",
                        runs: 10,
                      })
                    }
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#e6dfd8] hover:border-red-300 text-[#6c6a64] hover:text-red-700 text-xs font-medium bg-[#faf9f5] transition-all"
                  >
                    <Undo2 size={13} />
                    <span>Rollback to Starter (Cancel Subscription)</span>
                  </button>

                  <button
                    onClick={handleOpenStripePortal}
                    disabled={isOpeningPortal}
                    className="ml-auto inline-flex items-center gap-1 text-xs text-[#6c6a64] hover:text-[#141413] transition-colors"
                  >
                    {isOpeningPortal ? (
                      <Loader2 size={12} className="animate-spin" />
                    ) : (
                      <ExternalLink size={12} />
                    )}
                    <span>Stripe Billing Portal</span>
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Plan Details & Features (Right Column) */}
          <div className="lg:col-span-5 bg-white border border-[#e6dfd8] rounded-3xl p-6 sm:p-8 shadow-xs space-y-6">
            <div className="border-b border-[#e6dfd8] pb-5">
              <span className="text-xs font-mono uppercase tracking-wider text-[#6c6a64]">
                Current Tier
              </span>
              <h3 className="font-serif text-2xl text-[#141413] mt-1 font-medium capitalize">
                {usage?.plan_name || "Starter Plan"}
              </h3>
              <p className="text-xs text-[#6c6a64] mt-1">
                {isProMax
                  ? "Enterprise-level recruitment operations with 1,000 evaluations."
                  : isPro
                    ? "Scaling engineering and recruiting teams with 100 evaluations."
                    : "Free starter tier for testing AI candidate evaluation."}
              </p>
            </div>

            {/* Included Capabilities */}
            <div className="space-y-3">
              <h4 className="text-xs font-mono uppercase tracking-wider text-[#6c6a64]">
                Plan Capabilities
              </h4>
              <ul className="space-y-3">
                {planFeatures.map((feature, idx) => (
                  <li key={idx} className="flex items-start gap-2.5 text-xs text-[#3d3d3a]">
                    <CheckCircle2 size={15} className="text-[#5db872] shrink-0 mt-0.5" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Need More Runs Banner */}
            {!isProMax ? (
              <div className="p-5 rounded-2xl bg-primary text-white space-y-3">
                <div className="flex items-center gap-2 text-white text-xs font-mono uppercase font-semibold">
                  <Sparkles size={14} />
                  <span>Need More Runs?</span>
                </div>
                <p className="text-xs text-white/90 leading-relaxed">
                  Upgrade instantly via Stripe to unlock up to 1,000 CV screening runs and priority batch processing.
                </p>
                <Link
                  href="/#pricing"
                  className="inline-flex items-center gap-1.5 text-xs font-medium text-white hover:underline transition-colors"
                >
                  <span>Compare All Plans</span>
                  <ChevronRight size={14} />
                </Link>
              </div>
            ) : (
              <div className="p-5 rounded-2xl bg-[#faf9f5] border border-[#e6dfd8] text-[#141413] space-y-2">
                <div className="flex items-center gap-2 text-emerald-700 text-xs font-mono uppercase font-semibold">
                  <ShieldCheck size={15} />
                  <span>Highest Tier Active</span>
                </div>
                <p className="text-xs text-[#6c6a64] leading-relaxed">
                  You have full unlimited access to Pro Max features and dedicated enterprise capacity.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Rollback Confirmation Dialog Modal */}
      <AnimatePresence>
        {rollbackTarget && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="bg-white rounded-3xl border border-[#e6dfd8] max-w-md w-full p-6 sm:p-8 shadow-2xl space-y-6 text-[#141413]"
            >
              <div className="flex items-start justify-between">
                <div className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center">
                  <Undo2 size={24} />
                </div>
                <button
                  onClick={() => setRollbackTarget(null)}
                  disabled={isRollingBack}
                  className="p-1 rounded-lg text-[#6c6a64] hover:text-[#141413] hover:bg-[#faf9f5]"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="space-y-2">
                <h3 className="font-serif text-2xl font-normal">
                  Rollback to {rollbackTarget.name}
                </h3>
                <p className="text-xs text-[#6c6a64] leading-relaxed">
                  Are you sure you want to downgrade your current subscription to{" "}
                  <strong className="text-[#141413] font-medium">
                    {rollbackTarget.name}
                  </strong>
                  ?
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-[#faf9f5] border border-[#e6dfd8] space-y-3 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-[#6c6a64]">Monthly Quota:</span>
                  <span className="font-mono font-semibold text-[#141413]">
                    {rollbackTarget.runs} evaluations / month
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[#6c6a64]">Billing Impact:</span>
                  <span className="font-medium text-[#141413]">
                    {rollbackTarget.planKey === "starter"
                      ? "Stripe subscription will be canceled"
                      : "Stripe will prorate credit to your upcoming cycle"}
                  </span>
                </div>
              </div>

              <div className="pt-2 flex flex-col sm:flex-row gap-3">
                <button
                  onClick={() => setRollbackTarget(null)}
                  disabled={isRollingBack}
                  className="flex-1 py-3 px-4 rounded-xl border border-[#e6dfd8] text-xs font-medium text-[#6c6a64] hover:text-[#141413] hover:bg-[#faf9f5] transition-colors text-center"
                >
                  Keep Current Plan
                </button>
                <button
                  onClick={handleConfirmRollback}
                  disabled={isRollingBack}
                  className="flex-1 py-3 px-4 rounded-xl bg-[#cc785c] hover:bg-[#a9583e] text-white text-xs font-semibold transition-all flex items-center justify-center gap-2 shadow-xs"
                >
                  {isRollingBack ? (
                    <>
                      <Loader2 size={14} className="animate-spin" />
                      <span>Rolling Back...</span>
                    </>
                  ) : (
                    <span>Confirm Rollback</span>
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function ProfilePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#faf9f5] flex items-center justify-center">
          <div className="flex items-center gap-3 text-sm text-[#6c6a64]">
            <Loader2 className="animate-spin text-[#cc785c]" size={20} />
            <span>Loading profile...</span>
          </div>
        </div>
      }
    >
      <ProfileContent />
    </Suspense>
  );
}
