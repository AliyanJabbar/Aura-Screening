"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Check,
  ShieldCheck,
  Loader2,
  AlertCircle,
  Undo2,
  Sparkles,
  X,
  CheckCircle2,
  ArrowRight,
} from "lucide-react";
import Link from "next/link";
import { useSession } from "@/lib/auth-client";

interface PricingTier {
  name: string;
  planKey: string;
  rank: number;
  price: { monthly: string; yearly: string };
  runsMonthly: number;
  description: string;
  features: string[];
  buttonText: string;
  highlight: boolean;
}

const tiers: PricingTier[] = [
  {
    name: "Starter",
    planKey: "starter",
    rank: 0,
    price: { monthly: "$0", yearly: "$0" },
    runsMonthly: 10,
    description: "Ideal for small teams testing AI candidate evaluation.",
    features: [
      "Up to 10 CV evaluations / mo",
      "Standard criteria matching engine",
      "Demographic bias shield",
      "CSV & PDF export",
    ],
    buttonText: "Start Free Screening",
    highlight: false,
  },
  {
    name: "Pro",
    planKey: "pro",
    rank: 1,
    price: { monthly: "$25", yearly: "$20" },
    runsMonthly: 100,
    description: "For scaling engineering and talent acquisition teams.",
    features: [
      "Up to 100 CV evaluations / mo",
      "Multiple CV's evaluation in a single run",
      "Real-time AI decision audit logs",
      "Greenhouse & Lever ATS connectors",
      "Priority batch processing",
    ],
    buttonText: "Upgrade to Pro",
    highlight: true,
  },
  {
    name: "Pro Max",
    planKey: "pro-max",
    rank: 2,
    price: { monthly: "$120", yearly: "$100" },
    runsMonthly: 1000,
    description: "For global enterprises with high-volume recruitment.",
    features: [
      "Up to 1,000 CV evaluations / mo",
      "Custom LLM fine-tuning on company taxonomy",
      "Dedicated SOC2 & GDPR compliance shield",
      "SLA guaranteed inference speed",
      "Dedicated HR solutions architect",
    ],
    buttonText: "Upgrade to Pro Max",
    highlight: false,
  },
];

export default function Pricing() {
  const [isYearly, setIsYearly] = useState(false);
  const [loadingTier, setLoadingTier] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Active User Plan State
  const { data: sessionData } = useSession();
  const user = sessionData?.user;
  const [currentPlanKey, setCurrentPlanKey] = useState<string | null>(null);
  const [isLoadingUserPlan, setIsLoadingUserPlan] = useState<boolean>(false);

  // Rollback Modal State
  const [rollbackTargetTier, setRollbackTargetTier] = useState<PricingTier | null>(null);
  const [isRollingBack, setIsRollingBack] = useState(false);

  const fetchUserPlan = async () => {
    if (!user?.id) {
      setCurrentPlanKey(null);
      return;
    }

    try {
      setIsLoadingUserPlan(true);
      const backendUrl =
        process.env.NEXT_PUBLIC_API_URL ||
        process.env.NEXT_PUBLIC_BACKEND_URL ||
        "https://aura-screening.fastapicloud.dev";

      const headers: Record<string, string> = {};
      const userToken = sessionData?.session?.token;
      if (userToken) {
        headers["Authorization"] = `Bearer ${userToken}`;
      }

      const res = await fetch(
        `${backendUrl}/payments/profile-usage?user_id=${encodeURIComponent(user.id)}`,
        { headers }
      );

      if (res.ok) {
        const data = await res.json();
        const rawPlan = (data.plan || "starter").toLowerCase();
        if (rawPlan.includes("max")) {
          setCurrentPlanKey("pro-max");
        } else if (rawPlan.includes("pro")) {
          setCurrentPlanKey("pro");
        } else {
          setCurrentPlanKey("starter");
        }
      }
    } catch (err) {
      console.error("Could not fetch user plan for pricing:", err);
    } finally {
      setIsLoadingUserPlan(false);
    }
  };

  useEffect(() => {
    fetchUserPlan();
  }, [user?.id, sessionData?.session?.token]);

  // Determine user rank: 0 (Starter), 1 (Pro), 2 (Pro Max)
  const getUserRank = (): number => {
    if (!user) return -1; // Unauthenticated
    if (currentPlanKey === "pro-max") return 2;
    if (currentPlanKey === "pro") return 1;
    return 0; // Default Starter
  };

  const userRank = getUserRank();

  // Stripe Checkout Flow (for Upgrades or new purchases)
  const handleCheckout = async (tier: PricingTier) => {
    if (tier.planKey === "starter") {
      window.location.href = "/screening";
      return;
    }

    try {
      setLoadingTier(tier.name);
      setErrorMessage(null);

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
          plan: tier.planKey,
          interval: isYearly ? "year" : "month",
          user_id: user?.id || undefined,
          user_email: user?.email || undefined,
          ui_mode: "hosted",
        }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.detail || `Server returned status ${res.status}`);
      }

      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        throw new Error("No Stripe checkout URL returned from server.");
      }
    } catch (err: any) {
      console.error("Stripe checkout initiation failed:", err);
      setErrorMessage(
        err?.message || "Failed to redirect to Stripe checkout. Please try again."
      );
      setLoadingTier(null);
    }
  };

  // Rollback Action Handler
  const confirmRollback = async () => {
    if (!rollbackTargetTier) return;

    try {
      setIsRollingBack(true);
      setErrorMessage(null);

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
          target_plan: rollbackTargetTier.planKey,
          user_id: user?.id || undefined,
        }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.detail || "Unable to complete plan rollback.");
      }

      const result = await res.json();
      setSuccessMessage(
        result.message || `Successfully rolled back to ${rollbackTargetTier.name} plan.`
      );
      setRollbackTargetTier(null);
      // Refresh current plan
      await fetchUserPlan();
    } catch (err: any) {
      console.error("Rollback error:", err);
      setErrorMessage(err.message || "Failed to rollback subscription.");
    } finally {
      setIsRollingBack(false);
    }
  };

  return (
    <section id="pricing" className="py-24 bg-[#faf9f5] border-t border-[#e6dfd8] relative">
      <div className="container mx-auto px-6 max-w-6xl space-y-12">
        <div className="text-center max-w-2xl mx-auto space-y-4">
          <span className="text-xs font-mono uppercase tracking-wider text-[#cc785c] font-semibold">
            Transparent Pricing
          </span>
          <h2 className="font-serif text-3xl sm:text-5xl text-[#141413] tracking-tight font-normal">
            Predictable plans for modern recruitment.
          </h2>
          <p className="text-base text-[#3d3d3a]">
            Choose the capacity that matches your hiring velocity.
          </p>

          {/* Billing Toggle */}
          <div className="pt-4 flex items-center justify-center gap-4">
            <span
              className={`text-sm font-medium ${!isYearly ? "text-[#141413]" : "text-[#6c6a64]"
                }`}
            >
              Monthly
            </span>
            <button
              onClick={() => setIsYearly(!isYearly)}
              className="relative h-6 w-12 rounded-full bg-[#efe9de] p-1 border border-[#e6dfd8] transition-colors"
              aria-label="Toggle Billing Interval"
            >
              <motion.div
                animate={{ x: isYearly ? 24 : 0 }}
                className="h-4 w-4 rounded-full bg-[#cc785c]"
              />
            </button>
            <span
              className={`text-sm font-medium ${isYearly ? "text-[#141413]" : "text-[#6c6a64]"
                }`}
            >
              Yearly <span className="text-xs text-[#5db872] font-semibold">(Save 20%)</span>
            </span>
          </div>

          {/* Feedback Messages */}
          {errorMessage && (
            <div className="mx-auto max-w-md p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-800 text-xs flex items-center justify-between gap-2 shadow-xs">
              <div className="flex items-center gap-2">
                <AlertCircle size={16} className="shrink-0 text-red-600" />
                <span>{errorMessage}</span>
              </div>
              <button
                onClick={() => setErrorMessage(null)}
                className="text-red-500 hover:text-red-800"
              >
                <X size={14} />
              </button>
            </div>
          )}

          {successMessage && (
            <div className="mx-auto max-w-md p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center justify-between gap-2 shadow-xs">
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
        </div>

        {/* Pricing Cards Grid */}
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3 items-stretch">
          {tiers.map((tier, ind) => {
            const isLoading = loadingTier === tier.name;
            const isUserLoggedIn = !!user;
            const isCurrentPlan = isUserLoggedIn && userRank === tier.rank;
            const isLowerTier = isUserLoggedIn && userRank > tier.rank;
            const isHigherTier = isUserLoggedIn && userRank < tier.rank;

            return (
              <motion.div
                key={tier.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: ind * 0.1 }}
                className={`relative flex flex-col rounded-2xl p-8 transition-all duration-200 ${isCurrentPlan
                  ? "bg-[#141413] text-[#faf9f5] border-2 border-[#cc785c] shadow-xl ring-2 ring-[#cc785c]/30"
                  : tier.highlight
                    ? "bg-aura-secondary text-[#141413] shadow-xl border border-[#e6dfd8]"
                    : "bg-[#faf9f5] text-[#141413] border border-[#e6dfd8] shadow-xs"
                  }`}
              >
                {/* Badges */}
                {isCurrentPlan ? (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 rounded-full bg-aura-primary px-3.5 py-0.5 text-[11px] font-mono font-bold uppercase tracking-wider text-white shadow-sm flex items-center gap-1.5">
                    <Check size={12} strokeWidth={3} />
                    <span>Selected Plan</span>
                  </div>
                ) : tier.highlight ? (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 rounded-full bg-[#efe9de] text-[#141413] border border-[#e6dfd8] px-3 py-0.5 text-[11px] font-mono font-semibold uppercase tracking-wider">
                    FEATURED TIER
                  </div>
                ) : null}

                {/* Plan Header */}
                <div className="mb-8 space-y-3">
                  <div className="flex items-center justify-between">
                    <h3
                      className={`text-xl font-medium ${isCurrentPlan ? "text-[#faf9f5]" : "text-[#141413]"
                        }`}
                    >
                      {tier.name}
                    </h3>
                    {isCurrentPlan && (
                      <span className="text-[10px] font-mono uppercase bg-white/10 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded-full">
                        Active
                      </span>
                    )}
                  </div>

                  <div className="flex items-baseline gap-1">
                    <span className="font-serif text-4xl md:text-5xl font-normal">
                      {isYearly ? tier.price.yearly : tier.price.monthly}
                    </span>
                    <span
                      className={`text-sm ${isCurrentPlan ? "text-[#a09d96]" : "text-[#6c6a64]"
                        }`}
                    >
                      /month
                    </span>
                  </div>
                  <p
                    className={`text-xs leading-relaxed ${isCurrentPlan ? "text-[#a09d96]" : "text-[#3d3d3a]"
                      }`}
                  >
                    {tier.description}
                  </p>
                </div>

                {/* Features List */}
                <ul className="mb-8 flex-1 space-y-3 border-t pt-6 border-current/10">
                  {tier.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-2.5 text-xs font-sans">
                      <Check
                        size={16}
                        className={`shrink-0 ${isCurrentPlan
                          ? "text-aura-primary"
                          : tier.highlight
                            ? "text-[#5db8a6]"
                            : "text-aura-primary"
                          }`}
                      />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>

                {/* Action Button depending on user plan & state */}
                {isCurrentPlan ? (
                  <Link
                    href="/profile"
                    className="flex h-11 items-center justify-center gap-2 rounded-xl text-xs font-semibold bg-white/10 hover:bg-white/15 text-white border border-white/20 transition-all text-center"
                  >
                    <Check size={14} className="text-emerald-400" />
                    <span>Current Plan (Manage Quota)</span>
                    <ArrowRight size={13} className="opacity-70" />
                  </Link>
                ) : isLowerTier ? (
                  <button
                    onClick={() => setRollbackTargetTier(tier)}
                    disabled={isLoading || loadingTier !== null}
                    className="flex h-11 items-center justify-center gap-2 rounded-xl text-xs font-semibold transition-all border border-[#cc785c]/40 text-[#cc785c] hover:bg-[#cc785c]/10 bg-transparent"
                  >
                    <Undo2 size={14} />
                    <span>Rollback to {tier.name}</span>
                  </button>
                ) : isHigherTier ? (
                  <button
                    onClick={() => handleCheckout(tier)}
                    disabled={isLoading || loadingTier !== null}
                    className={`flex h-11 items-center justify-center rounded-xl text-xs font-semibold transition-all disabled:opacity-60 ${tier.highlight
                      ? "bg-[#cc785c] text-white hover:bg-[#a9583e]"
                      : "bg-[#141413] text-white hover:bg-[#252320]"
                      }`}
                  >
                    {isLoading ? (
                      <span className="inline-flex items-center gap-2">
                        <Loader2 size={14} className="animate-spin" />
                        Opening Stripe...
                      </span>
                    ) : (
                      `Upgrade to ${tier.name}`
                    )}
                  </button>
                ) : (
                  // Signed-out or default state
                  <button
                    onClick={() => handleCheckout(tier)}
                    disabled={isLoading || loadingTier !== null}
                    className={`flex h-11 items-center justify-center rounded-xl text-xs font-semibold transition-all disabled:opacity-60 ${tier.highlight
                      ? "bg-[#cc785c] text-white hover:bg-[#a9583e]"
                      : "bg-[#efe9de] text-[#141413] hover:bg-[#e8e0d2] border border-[#e6dfd8]"
                      }`}
                  >
                    {isLoading ? (
                      <span className="inline-flex items-center gap-2">
                        <Loader2 size={14} className="animate-spin" />
                        Redirecting to Stripe...
                      </span>
                    ) : (
                      tier.buttonText
                    )}
                  </button>
                )}
              </motion.div>
            );
          })}
        </div>

        {/* Footer Trust Bar */}
        <div className="flex flex-wrap items-center justify-center gap-4 text-xs text-[#6c6a64]">
          <div className="flex items-center gap-1.5">
            <ShieldCheck size={16} className="text-[#5db872]" />
            <span>Enterprise-grade security</span>
          </div>
          <span>•</span>
          <span>GDPR & EEOC compliant</span>
          <span>•</span>
          <span>Cancel or rollback anytime with automatic proration</span>
        </div>
      </div>

      {/* Rollback Confirmation Modal */}
      <AnimatePresence>
        {rollbackTargetTier && (
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
                  onClick={() => setRollbackTargetTier(null)}
                  disabled={isRollingBack}
                  className="p-1 rounded-lg text-[#6c6a64] hover:text-[#141413] hover:bg-[#faf9f5]"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="space-y-2">
                <h3 className="font-serif text-2xl font-normal">
                  Rollback to {rollbackTargetTier.name}
                </h3>
                <p className="text-xs text-[#6c6a64] leading-relaxed">
                  You are about to rollback from your currently active subscription tier to the{" "}
                  <strong className="text-[#141413] font-medium">
                    {rollbackTargetTier.name} Plan
                  </strong>
                  .
                </p>
              </div>

              {/* Tier Transition Visual */}
              <div className="p-4 rounded-2xl bg-[#faf9f5] border border-[#e6dfd8] space-y-3 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-[#6c6a64]">New Monthly Quota:</span>
                  <span className="font-mono font-semibold text-[#141413]">
                    {rollbackTargetTier.runsMonthly} evaluations / mo
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[#6c6a64]">Billing Impact:</span>
                  <span className="font-medium text-[#141413]">
                    {rollbackTargetTier.planKey === "starter"
                      ? "Stripe subscription will be canceled"
                      : "Prorated credit applied by Stripe"}
                  </span>
                </div>
              </div>

              <div className="pt-2 flex flex-col sm:flex-row gap-3">
                <button
                  onClick={() => setRollbackTargetTier(null)}
                  disabled={isRollingBack}
                  className="flex-1 py-3 px-4 rounded-xl border border-[#e6dfd8] text-xs font-medium text-[#6c6a64] hover:text-[#141413] hover:bg-[#faf9f5] transition-colors text-center"
                >
                  Keep Current Plan
                </button>
                <button
                  onClick={confirmRollback}
                  disabled={isRollingBack}
                  className="flex-1 py-3 px-4 rounded-xl bg-[#cc785c] hover:bg-[#a9583e] text-white text-xs font-semibold transition-all flex items-center justify-center gap-2 shadow-xs"
                >
                  {isRollingBack ? (
                    <>
                      <Loader2 size={14} className="animate-spin" />
                      <span>Processing...</span>
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
    </section>
  );
}
