"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "motion/react";
import Stepper, { Step } from "@/components/ui/stepper";
import { ArrowRight, ChevronRight, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

export default function ProductMockup() {
  const [activeStep, setActiveStep] = useState(1);

  const stepsList = [
    {
      step: 1,
      title: "Set Job Description",
      shortDesc: "Define criteria benchmarks, years of experience, and required skills.",
    },
    {
      step: 2,
      title: "Add Candidates",
      shortDesc: "Upload resumes directly, provide portfolio links, or connect a Google Sheet.",
    },
    {
      step: 3,
      title: "View Dashboard",
      shortDesc: "Inspect created jobs, real-time ranked candidates, and credit consumption.",
    },
  ];

  return (
    <section id="pipeline" className="py-20 sm:py-24 bg-[#faf9f5]">
      <div className="container mx-auto px-4 sm:px-6 max-w-6xl">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center">
          
          {/* Left Column: Editorial Text & Interactive Step Guide */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="lg:col-span-5 space-y-6"
          >
            {/* Category Tag */}
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#efe9de] border border-[#e6dfd8]">
              <span className="w-1.5 h-1.5 rounded-full bg-[#cc785c]" />
              <span className="text-xs font-mono font-semibold uppercase tracking-wider text-[#cc785c]">
                Simple 3-Step Process
              </span>
            </div>

            {/* Headline & Description */}
            <div className="space-y-3">
              <h2 className="font-serif text-3xl sm:text-4xl lg:text-[40px] text-[#141413] tracking-tight leading-[1.15] font-normal">
                How Autonomous Screening Works
              </h2>
              <p className="text-sm sm:text-base text-[#3d3d3a] leading-relaxed font-sans">
                Experience an end-to-end recruitment pipeline designed for speed and objectivity. Configure role rubrics, intake candidate profiles across any format, and review transparent AI evaluations in real time.
              </p>
            </div>

            {/* Interactive Step Navigator */}
            <div className="space-y-2 pt-1">
              {stepsList.map((item) => {
                const isActive = activeStep === item.step;
                return (
                  <button
                    key={item.step}
                    type="button"
                    onClick={() => setActiveStep(item.step)}
                    className={cn(
                      "w-full text-left p-3 sm:p-3.5 rounded-xl border transition-all flex items-start gap-3 cursor-pointer group",
                      isActive
                        ? "bg-[#efe9de] border-[#cc785c]/50 shadow-xs"
                        : "bg-transparent border-transparent hover:bg-[#efe9de]/50"
                    )}
                  >
                    <div
                      className={cn(
                        "w-7 h-7 rounded-full flex items-center justify-center font-mono text-xs font-semibold shrink-0 transition-all",
                        isActive
                          ? "bg-[#cc785c] text-white shadow-xs"
                          : "bg-[#e6dfd8] text-[#6c6a64] group-hover:bg-[#ded5c8] group-hover:text-[#141413]"
                      )}
                    >
                      {item.step}
                    </div>
                    <div className="space-y-0.5 min-w-0 flex-1">
                      <div className="flex items-center justify-between">
                        <h4
                          className={cn(
                            "text-sm font-semibold transition-colors",
                            isActive ? "text-[#141413]" : "text-[#3d3d3a]"
                          )}
                        >
                          {item.title}
                        </h4>
                        <ChevronRight
                          size={14}
                          className={cn(
                            "transition-transform text-[#6c6a64]",
                            isActive && "text-[#cc785c] translate-x-0.5"
                          )}
                        />
                      </div>
                      <p className="text-xs text-[#6c6a64] leading-relaxed">
                        {item.shortDesc}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* CTA */}
            <div className="pt-2 flex items-center gap-4">
              <Link
                href="/screening"
                className="inline-flex items-center gap-2 rounded-md bg-[#cc785c] px-5 py-2.5 text-xs font-medium text-white transition-all hover:bg-[#a9583e] active:scale-95 shadow-xs"
              >
                <span>Launch Screening Portal</span>
                <ArrowRight size={14} />
              </Link>
            </div>
          </motion.div>

          {/* Right Column: Product Mockup Stepper (Properly Sized & Reduced Width) */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.15 }}
            className="lg:col-span-7 flex justify-center lg:justify-end w-full"
          >
            <div className="w-full max-w-xl">
              <Stepper
                step={activeStep}
                onStepChange={(step) => setActiveStep(step)}
                initialStep={1}
                backButtonText="Previous"
                nextButtonText="Next"
                stepCircleContainerClassName="w-full bg-aura-secondary border border-[#e6dfd8] shadow-lg rounded-2xl"
              >
                {/* STEP 1: Job Description */}
                <Step>
                  <div className="space-y-3.5">
                    <div className="border-b border-[#e6dfd8] pb-3 flex items-center justify-between">
                      <div>
                        <span className="text-[11px] font-mono uppercase tracking-wider text-[#cc785c] font-semibold">
                          Step 01
                        </span>
                        <h3 className="text-base sm:text-lg font-serif text-[#141413]">
                          1. Set Job Description
                        </h3>
                      </div>
                      <span className="text-[11px] font-mono text-[#6c6a64] bg-[#efe9de] px-2.5 py-1 rounded-md border border-[#e6dfd8]">
                        Requirements
                      </span>
                    </div>

                    <div className="flex flex-col gap-2.5">
                      <div className="bg-[#efe9de] rounded-xl p-3.5 border border-[#e6dfd8] space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-[#cc785c] font-bold text-sm leading-none">•</span>
                          <h4 className="font-semibold text-xs sm:text-sm text-[#141413]">Set criteria</h4>
                        </div>
                        <p className="text-xs text-[#3d3d3a] leading-relaxed pl-3.5">
                          Define evaluation benchmarks, rubric weights, and minimum fit thresholds.
                        </p>
                      </div>

                      <div className="bg-[#efe9de] rounded-xl p-3.5 border border-[#e6dfd8] space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-[#cc785c] font-bold text-sm leading-none">•</span>
                          <h4 className="font-semibold text-xs sm:text-sm text-[#141413]">Years of experience</h4>
                        </div>
                        <p className="text-xs text-[#3d3d3a] leading-relaxed pl-3.5">
                          Specify required seniority, minimum industry experience, and domain thresholds.
                        </p>
                      </div>

                      <div className="bg-[#efe9de] rounded-xl p-3.5 border border-[#e6dfd8] space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-[#cc785c] font-bold text-sm leading-none">•</span>
                          <h4 className="font-semibold text-xs sm:text-sm text-[#141413]">Required skills etc...</h4>
                        </div>
                        <p className="text-xs text-[#3d3d3a] leading-relaxed pl-3.5">
                          Outline essential tech stack competencies, tools, education, and role constraints.
                        </p>
                      </div>
                    </div>
                  </div>
                </Step>

                {/* STEP 2: Candidates */}
                <Step>
                  <div className="space-y-3.5">
                    <div className="border-b border-[#e6dfd8] pb-3 flex items-center justify-between">
                      <div>
                        <span className="text-[11px] font-mono uppercase tracking-wider text-[#cc785c] font-semibold">
                          Step 02
                        </span>
                        <h3 className="text-base sm:text-lg font-serif text-[#141413]">
                          2. Add Candidates
                        </h3>
                      </div>
                      <span className="text-[11px] font-mono text-[#6c6a64] bg-[#efe9de] px-2.5 py-1 rounded-md border border-[#e6dfd8]">
                        Multi-Source
                      </span>
                    </div>

                    <div className="flex flex-col gap-2.5">
                      <div className="bg-[#efe9de] rounded-xl p-3.5 border border-[#e6dfd8] space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-[#cc785c] font-bold text-sm leading-none">•</span>
                          <h4 className="font-semibold text-xs sm:text-sm text-[#141413]">Add candidate's resume</h4>
                        </div>
                        <p className="text-xs text-[#3d3d3a] leading-relaxed pl-3.5">
                          Upload resume files directly (PDF, DOCX, TXT) with automatic text extraction.
                        </p>
                      </div>

                      <div className="bg-[#efe9de] rounded-xl p-3.5 border border-[#e6dfd8] space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-[#cc785c] font-bold text-sm leading-none">•</span>
                          <h4 className="font-semibold text-xs sm:text-sm text-[#141413]">Add links of candidate's resumes</h4>
                        </div>
                        <p className="text-xs text-[#3d3d3a] leading-relaxed pl-3.5">
                          Provide public web links, GitHub portfolios, or cloud documents.
                        </p>
                      </div>

                      <div className="bg-[#efe9de] rounded-xl p-3.5 border border-[#e6dfd8] space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-[#cc785c] font-bold text-sm leading-none">•</span>
                          <h4 className="font-semibold text-xs sm:text-sm text-[#141413]">Attach Google Sheet with resume links</h4>
                        </div>
                        <p className="text-xs text-[#3d3d3a] leading-relaxed pl-3.5">
                          Connect a Google Sheet for batch ingestion and synchronized screening.
                        </p>
                      </div>
                    </div>
                  </div>
                </Step>

                {/* STEP 3: In Dashboard */}
                <Step>
                  <div className="space-y-3.5">
                    <div className="border-b border-[#e6dfd8] pb-3 flex items-center justify-between">
                      <div>
                        <span className="text-[11px] font-mono uppercase tracking-wider text-[#cc785c] font-semibold">
                          Step 03
                        </span>
                        <h3 className="text-base sm:text-lg font-serif text-[#141413]">
                          3. View Dashboard
                        </h3>
                      </div>
                      <span className="text-[11px] font-mono text-[#6c6a64] bg-[#efe9de] px-2.5 py-1 rounded-md border border-[#e6dfd8]">
                        Results & Quota
                      </span>
                    </div>

                    <div className="flex flex-col gap-2.5">
                      <div className="bg-[#efe9de] rounded-xl p-3.5 border border-[#e6dfd8] space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-[#cc785c] font-bold text-sm leading-none">•</span>
                          <h4 className="font-semibold text-xs sm:text-sm text-[#141413]">View your created jobs</h4>
                        </div>
                        <p className="text-xs text-[#3d3d3a] leading-relaxed pl-3.5">
                          Track all active job listings, descriptions, and candidate pipeline counts.
                        </p>
                      </div>

                      <div className="bg-[#efe9de] rounded-xl p-3.5 border border-[#e6dfd8] space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-[#cc785c] font-bold text-sm leading-none">•</span>
                          <h4 className="font-semibold text-xs sm:text-sm text-[#141413]">View candidates evaluated in each job</h4>
                        </div>
                        <p className="text-xs text-[#3d3d3a] leading-relaxed pl-3.5">
                          Access ranked candidate dossiers, semantic fit scores, and evaluation breakdowns.
                        </p>
                      </div>

                      <div className="bg-[#efe9de] rounded-xl p-3.5 border border-[#e6dfd8] space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-[#cc785c] font-bold text-sm leading-none">•</span>
                          <h4 className="font-semibold text-xs sm:text-sm text-[#141413]">See how much credits you've used</h4>
                        </div>
                        <p className="text-xs text-[#3d3d3a] leading-relaxed pl-3.5">
                          Check real-time credit consumption, balance, and evaluation quotas.
                        </p>
                      </div>
                    </div>

                    <div className="pt-1 flex justify-end">
                      <Link
                        href="/screening"
                        className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#cc785c] hover:text-[#a9583e] transition-colors"
                      >
                        <span>Launch Workspace</span>
                        <ArrowRight size={13} />
                      </Link>
                    </div>
                  </div>
                </Step>
              </Stepper>
            </div>
          </motion.div>

        </div>
      </div>
    </section>
  );
}
