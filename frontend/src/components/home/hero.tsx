"use client";

import Link from "next/link";
import { motion } from "motion/react";
import { ArrowRight, CheckCircle2, Cpu, ShieldCheck } from "lucide-react";

export default function Hero() {
  return (
    <section id="overview" className="relative pt-32 pb-24 md:pt-40 md:pb-32 bg-[#faf9f5]">
      <div className="container mx-auto px-6 max-w-6xl">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
          
          {/* Left Editorial Content (7 cols) */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="lg:col-span-7 space-y-6"
          >
            {/* Category Tag Pill */}
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#efe9de] border border-[#e6dfd8]">
              <span className="w-2 h-2 rounded-full bg-[#cc785c] animate-pulse" />
              <span className="text-xs font-semibold uppercase tracking-wider text-[#141413]">
                Autonomous Screening Engine
              </span>
            </div>

            {/* Editorial Serif Display Headline */}
            <h1 className="font-serif text-4xl sm:text-5xl md:text-6xl text-[#141413] tracking-tight leading-[1.08] font-normal">
              Autonomous candidate evaluation with human-level discernment.
            </h1>

            {/* Sub-headline */}
            <p className="text-base sm:text-lg text-[#3d3d3a] leading-relaxed max-w-xl font-sans">
              Screen thousands of CVs against nuanced hiring requirements in seconds. 
              Get transparent candidate scoring, skill verification, and bias-free rank ordering—built for modern talent teams.
            </p>

            {/* CTAs */}
            <div className="flex flex-wrap items-center gap-4 pt-2">
              <Link
                href="/screening"
                className="inline-flex items-center justify-center gap-2 rounded-md bg-[#cc785c] px-6 py-3 text-sm font-medium text-white transition-all hover:bg-[#a9583e] active:scale-95 shadow-xs"
              >
                <span>Launch Screening Portal</span>
                <ArrowRight size={16} />
              </Link>

              <Link
                href="#pipeline"
                className="inline-flex items-center justify-center rounded-md border border-[#e6dfd8] bg-[#faf9f5] px-6 py-3 text-sm font-medium text-[#141413] transition-all hover:bg-[#efe9de]"
              >
                View Pipeline Specs
              </Link>
            </div>

            {/* Key Value Micro-list */}
            <div className="pt-6 grid grid-cols-3 gap-4 border-t border-[#e6dfd8]">
              <div className="flex items-center gap-2 text-xs font-medium text-[#3d3d3a]">
                <CheckCircle2 size={14} className="text-[#5db8a6]" />
                <span>Zero Demographic Bias</span>
              </div>
              <div className="flex items-center gap-2 text-xs font-medium text-[#3d3d3a]">
                <CheckCircle2 size={14} className="text-[#5db8a6]" />
                <span>Semantic Skill Radar</span>
              </div>
              <div className="flex items-center gap-2 text-xs font-medium text-[#3d3d3a]">
                <CheckCircle2 size={14} className="text-[#5db8a6]" />
                <span>Transparent AI Audit</span>
              </div>
            </div>
          </motion.div>

          {/* Right Product Mockup Card (5 cols - Dark Navy Surface) */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="lg:col-span-5"
          >
            <div className="rounded-2xl bg-aura-secondary p-6 text-[#141413] border border-[#e6dfd8] shadow-2xl space-y-5">
              {/* Window Header Chrome */}
              <div className="flex items-center justify-between border-b border-[#e6dfd8] pb-4">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-[#c64545]" />
                  <div className="w-3 h-3 rounded-full bg-[#e8a55a]" />
                  <div className="w-3 h-3 rounded-full bg-[#5db8a6]" />
                  <span className="ml-2 font-mono text-xs text-[#6c6a64]">evaluator_engine.v2.py</span>
                </div>
                <span className="text-[10px] font-mono text-[#5db8a6] bg-[#5db8a6]/10 px-2 py-0.5 rounded-full border border-[#5db8a6]/20">
                  LIVE RUN
                </span>
              </div>

              {/* Candidate Info Badge */}
              <div className="bg-[#efe9de] p-3.5 rounded-xl border border-[#e6dfd8] flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-aura-primary text-white flex items-center justify-center font-medium text-xs">
                    AR
                  </div>
                  <div>
                    <div className="text-xs font-medium text-[#141413]">Alex Rivera, Lead AI Architect</div>
                    <div className="text-[11px] font-mono text-[#6c6a64]">12 yrs exp • Stanford MS CS</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-mono font-bold text-[#5db8a6]">96.4%</div>
                  <div className="text-[10px] font-mono text-[#6c6a64]">MATCH CONFIDENCE</div>
                </div>
              </div>

              {/* Realtime AI Reasoning Stream */}
              <div className="bg-[#faf9f5] rounded-xl p-4 font-mono text-xs space-y-2.5 border border-[#e6dfd8]">
                <div className="text-[#6c6a64] flex items-center gap-1.5 text-[11px]">
                  <Cpu size={12} className="text-aura-primary" />
                  <span>CRITERIA SCORE EVALUATION:</span>
                </div>

                <div className="space-y-1.5 pt-1">
                  <div className="flex justify-between items-center text-[11px]">
                    <span className="text-[#141413]">Distributed AI Infrastructure</span>
                    <span className="text-[#5db8a6]">10/10 (Expert)</span>
                  </div>
                  <div className="w-full bg-[#e6dfd8] h-1.5 rounded-full overflow-hidden">
                    <div className="bg-[#5db8a6] h-full rounded-full w-[100%]" />
                  </div>
                </div>

                <div className="space-y-1.5 pt-1">
                  <div className="flex justify-between items-center text-[11px]">
                    <span className="text-[#141413]">PyTorch & LLM Inference Tuning</span>
                    <span className="text-[#5db8a6]">9.5/10 (Strong)</span>
                  </div>
                  <div className="w-full bg-[#e6dfd8] h-1.5 rounded-full overflow-hidden">
                    <div className="bg-[#5db8a6] h-full rounded-full w-[95%]" />
                  </div>
                </div>

                <div className="pt-2 text-[11px] text-[#6c6a64] border-t border-[#e6dfd8] leading-relaxed">
                  <span className="text-[#e8a55a] font-semibold">AI Decision Log:</span> Candidate exhibits rare alignment with cross-modal architecture requirements. Recommend instant interview shortlist.
                </div>
              </div>

              {/* Status Bar */}
              <div className="flex items-center justify-between text-[11px] text-[#6c6a64] pt-1">
                <span className="flex items-center gap-1.5">
                  <ShieldCheck size={13} className="text-[#5db8a6]" />
                  Anonymized Demographics Applied
                </span>
                <span className="font-mono text-aura-primary">Rank #1 of 1,420</span>
              </div>

            </div>
          </motion.div>

        </div>
      </div>
    </section>
  );
}