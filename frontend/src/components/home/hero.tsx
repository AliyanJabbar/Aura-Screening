"use client";

import Link from "next/link";
import { Poppins } from "next/font/google";
import { useState, useRef, useEffect } from "react";
import { motion, useReducedMotion } from "motion/react";
import { Play, Pause, Maximize2, X, Volume2, VolumeX , ArrowRight } from "lucide-react";

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["300", "400", "600", "700"],
});

const EASE = [0.22, 1, 0.36, 1] as const;

// Video from Cloudinary (optimized)
const VIDEO_SRC = "https://res.cloudinary.com/zckaq7mm/video/upload/q_auto,f_auto,w_800/v1790975679/aura_screening.mp4";
const VIDEO_POSTER = "https://res.cloudinary.com/zckaq7mm/video/upload/q_auto,f_auto,w_800/v1790975679/aura_screening.jpg";

const VIDEO_SRC_FULL = "https://res.cloudinary.com/zckaq7mm/video/upload/q_auto,f_auto,w_1920/v1790975679/aura_screening.mp4";

const SITE_STEPS = [
  {
    step: "Step 1",
    title: "Create a Job",
    stat: "10x",
    statLabel: "faster",
    description: "Screening resumes takes hours. Meet Aura Screening. Create a job with requirements and criteria.",
  },
  {
    step: "Step 2",
    title: "Add Candidates",
    stat: "100%",
    statLabel: "unbiased",
    description: "Add candidates with resume URLs or upload. See evaluations and shortlist candidates.",
  },
  {
    step: "Step 3",
    title: "Shortlist Matches",
    stat: "Top 1%",
    statLabel: "matches",
    description: "Find your best matches.",
  }
];

/* ─────────────────────────────────────────────────────────────
   Video framed as a CV page
───────────────────────────────────────────────────────────── */
function CvVideo({ onExpand }: { onExpand: () => void }) {
  const reduce = useReducedMotion();
  const [ready, setReady] = useState(false);
  const [isPlaying, setIsPlaying] = useState(!reduce);
  const [isMuted, setIsMuted] = useState(true);
  const videoRef = useRef<HTMLVideoElement>(null);

  const [stepIndex, setStepIndex] = useState(0);

  useEffect(() => {
    if (videoRef.current && videoRef.current.readyState >= 3) {
      setReady(true);
    }
  }, []);

  const handleTimeUpdate = () => {
    if (!videoRef.current) return;
    const time = videoRef.current.currentTime;
    
    setStepIndex(prev => {
      let next = 0;
      if (time >= 14) next = 2;
      else if (time >= 9) next = 1;
      
      return prev !== next ? next : prev;
    });
  };

  const currentStep = SITE_STEPS[stepIndex];

  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  return (
    <div className="relative mx-auto w-full max-w-[470px]">
      {/* Second page peeking out behind, like a stack of CVs */}
      <div
        aria-hidden
        className="absolute inset-0 translate-x-3 translate-y-3 rotate-[3deg] rounded-md border border-[#e6dfd8] bg-[#efe9de]"
      />
      <div
        aria-hidden
        className="absolute inset-0 -translate-x-2 translate-y-1.5 -rotate-[2deg] rounded-md border border-[#e6dfd8] bg-[#f5f1e8]"
      />

      {/* The CV */}
      <motion.div
        initial={reduce ? false : { opacity: 0, y: 24, rotate: -1 }}
        animate={{ opacity: 1, y: 0, rotate: 0 }}
        transition={{ duration: 0.7, delay: 0.2, ease: EASE }}
        className="relative rounded-md border border-[#e6dfd8] bg-[#fffdf9] p-6 shadow-[0_24px_50px_-26px_rgba(20,20,19,0.45)] sm:p-7"
      >
        {/* Header */}
        <div className="flex items-center gap-4">
          <div
            aria-hidden
            className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-[#efe9de] text-lg font-semibold text-[#6c6a64]"
          >
            ✓
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <motion.span
                key={currentStep.step}
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-xs font-semibold text-[#6c6a64]"
              >
                {currentStep.step}
              </motion.span>
            </div>
            <motion.p
              key={currentStep.title}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className="mt-1.5 text-sm font-semibold text-[#141413]"
            >
              {currentStep.title}
            </motion.p>
          </div>
          <div className="text-right">
            <motion.p
              key={currentStep.stat}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-2xl font-bold leading-none text-[#5db8a6]"
            >
              {currentStep.stat}
            </motion.p>
            <motion.p
              key={currentStep.statLabel}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="mt-1 text-[11px] font-medium text-[#6c6a64]"
            >
              {currentStep.statLabel}
            </motion.p>
          </div>
        </div>

        <div className="my-5 h-px bg-[#e6dfd8]" />

        {/* Video, placed where the CV's main section would be */}
        <div className="group relative aspect-[16/10] overflow-hidden rounded bg-[#e8e0d2]">
          <video
            ref={videoRef}
            src={VIDEO_SRC}
            poster={VIDEO_POSTER}
            autoPlay={!reduce}
            loop
            muted={isMuted}
            playsInline
            preload="metadata"
            onCanPlay={() => setReady(true)}
            onTimeUpdate={handleTimeUpdate}
            aria-hidden
            className={`h-full w-full object-cover transition-opacity duration-700 ${
              ready ? "opacity-100" : "opacity-0"
            }`}
          />
          {/* Controls overlay */}
          <div className="absolute inset-0 flex items-end justify-start bg-gradient-to-t from-black/50 via-transparent to-transparent p-4 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
            <div className="flex items-center gap-3">
              <button
                onClick={togglePlay}
                aria-label={isPlaying ? "Pause video" : "Play video"}
                className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-full bg-white/90 text-[#141413] shadow-lg transition-transform hover:scale-105"
              >
                {isPlaying ? (
                  <Pause size={18} className="fill-current" />
                ) : (
                  <Play size={18} className="ml-0.5 fill-current" />
                )}
              </button>
              <button
                onClick={toggleMute}
                aria-label={isMuted ? "Unmute video" : "Mute video"}
                className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-full bg-white/90 text-[#141413] shadow-lg transition-transform hover:scale-105"
              >
                {isMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}
              </button>
              <button
                onClick={onExpand}
                aria-label="Expand video"
                className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-full bg-white/90 text-[#141413] shadow-lg transition-transform hover:scale-105"
              >
                <Maximize2 size={16} />
              </button>
            </div>
          </div>
        </div>

        {/* Description */}
        <div className="mt-5 min-h-[60px]">
          <motion.p
            key={currentStep.description}
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-[13px] font-medium leading-[1.6] text-[#6c6a64]"
          >
            {currentStep.description}
          </motion.p>
        </div>
      </motion.div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   HERO
───────────────────────────────────────────────────────────── */
export default function Hero() {
  const [showPopup, setShowPopup] = useState(false);

  return (
    <>
      <section
      id="overview"
      className={`${poppins.className} relative overflow-hidden bg-[#faf9f5] pb-24 pt-28 md:pb-32 md:pt-36`}
    >
      <div className="container mx-auto max-w-6xl px-6">
        <div className="grid grid-cols-1 items-center gap-16 lg:grid-cols-2 lg:gap-12">
          {/* LEFT */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: EASE }}
          >
            <h1 className="text-[32px] lg:text-[56px] font-bold uppercase leading-[1.05] tracking-tight text-[#141413] sm:text-[3.2rem] md:text-[3.6rem]">
              AI-Powered CV Screening
              <br />
            </h1>

            <p className="mt-5 text-lg font-light uppercase tracking-[0.22em] text-[#6c6a64] sm:text-xl">
              Fair hiring for every candidate.
            </p>

            <p className="mt-6 text-[15px] font-light leading-[1.75] text-[#3d3d3a]">
              Upload a batch of CVs along with your job description. Our AI engine instantly anonymizes profiles to eliminate bias, evaluating each candidate purely on their skills and experience. Get a ranked shortlist of the best fits, complete with detailed, objective reasoning.
            </p>

            <div className="mt-9 flex flex-wrap items-center gap-x-7 gap-y-4">
              <Link
                href="/screening"
                className="inline-flex items-center justify-center gap-2 rounded-md bg-[#cc785c] px-6 py-3 text-sm font-medium text-white transition-all hover:bg-[#a9583e] active:scale-95 shadow-xs"
              >
                <span className="text-red">Start Screening </span>
                <ArrowRight size={16} />
              </Link>
              <Link
                href="#pipeline"
                id="hero-pipeline-btn"
                className="text-sm font-medium text-[#3d3d3a] underline decoration-[#cfc7bb] underline-offset-[6px] transition-colors hover:decoration-[#cc785c] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#cc785c]"
              >
                See how it works
              </Link>
            </div>
          </motion.div>

          {/* RIGHT */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.15, ease: EASE }}
            className="relative"
          >
            <CvVideo onExpand={() => setShowPopup(true)} />
          </motion.div>
        </div>
      </div>
    </section>

      {/* Video Popup Modal */}
      {showPopup && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#141413]/90 px-4 backdrop-blur-sm">
          <div className="relative w-full max-w-5xl rounded-xl bg-black shadow-2xl">
            <button
              onClick={() => setShowPopup(false)}
              className="absolute -right-4 -top-4 flex h-10 w-10 z-10 items-center justify-center rounded-full bg-white text-black shadow-md transition-transform hover:scale-105"
              aria-label="Close video"
            >
              <X size={20} />
            </button>
            <div className="aspect-[16/10] w-full overflow-hidden rounded-xl">
              <video
                src={VIDEO_SRC_FULL}
                controls
                autoPlay
                className="h-full w-full object-cover"
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
}