import Link from "next/link";
import { Heart } from "lucide-react";

export default function Footer() {
  return (
    <footer className="bg-aura-secondary text-[#6c6a64] py-16 border-t border-[#e6dfd8]">
      <div className="container mx-auto px-6 max-w-6xl space-y-12">
        
        {/* Top Wordmark Row */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 border-b border-[#e6dfd8] pb-10">
          <div className="flex items-center gap-2.5 text-[#141413]">
            <svg className="w-6 h-6 text-aura-primary" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2L13.5 9.5L21 11L13.5 12.5L12 20L10.5 12.5L3 11L10.5 9.5L12 2Z" />
            </svg>
            <span className="font-serif text-2xl font-normal tracking-tight text-[#141413]">
              AuraScreening
            </span>
          </div>

          <p className="text-xs font-mono text-[#6c6a64] max-w-md">
            Autonomous talent evaluation & resume screening infrastructure powered by Anthropic-class reasoning.
          </p>
        </div>

        {/* 4-Column Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-xs">
          
          {/* Col 1 */}
          <div className="space-y-3">
            <h4 className="font-mono text-[#141413] font-medium uppercase tracking-wider text-[11px]">
              Platform
            </h4>
            <ul className="space-y-2 font-sans">
              <li><Link href="#overview" className="hover:text-[#141413] transition-colors">Overview</Link></li>
              <li><Link href="#pipeline" className="hover:text-[#141413] transition-colors">Autonomous Pipeline</Link></li>
              <li><Link href="#capabilities" className="hover:text-[#141413] transition-colors">Evaluation Radar</Link></li>
              <li><Link href="#pricing" className="hover:text-[#141413] transition-colors">Enterprise Pricing</Link></li>
            </ul>
          </div>

          {/* Col 2 */}
          <div className="space-y-3">
            <h4 className="font-mono text-[#141413] font-medium uppercase tracking-wider text-[11px]">
              Solutions
            </h4>
            <ul className="space-y-2 font-sans">
              <li><Link href="/todo" className="hover:text-[#141413] transition-colors">Engineering Shortlisting</Link></li>
              <li><Link href="/todo" className="hover:text-[#141413] transition-colors">Executive Search</Link></li>
              <li><Link href="/todo" className="hover:text-[#141413] transition-colors">High-Volume Hiring</Link></li>
              <li><Link href="/todo" className="hover:text-[#141413] transition-colors">Bias Shield Auditing</Link></li>
            </ul>
          </div>

          {/* Col 3 */}
          <div className="space-y-3">
            <h4 className="font-mono text-[#141413] font-medium uppercase tracking-wider text-[11px]">
              Resources
            </h4>
            <ul className="space-y-2 font-sans">
              <li><Link href="/todo" className="hover:text-[#141413] transition-colors">API Documentation</Link></li>
              <li><Link href="/todo" className="hover:text-[#141413] transition-colors">Model Benchmarks</Link></li>
              <li><Link href="/todo" className="hover:text-[#141413] transition-colors">Security & Compliance</Link></li>
              <li><Link href="/todo" className="hover:text-[#141413] transition-colors">Integration Guides</Link></li>
            </ul>
          </div>

          {/* Col 4 */}
          <div className="space-y-3">
            <h4 className="font-mono text-[#141413] font-medium uppercase tracking-wider text-[11px]">
              Company
            </h4>
            <ul className="space-y-2 font-sans">
              <li><Link href="/todo" className="hover:text-[#141413] transition-colors">About AuraScreening</Link></li>
              <li><Link href="/todo" className="hover:text-[#141413] transition-colors">Research & Safety</Link></li>
              <li><Link href="/todo" className="hover:text-[#141413] transition-colors">Privacy Policy</Link></li>
              <li><Link href="/todo" className="hover:text-[#141413] transition-colors">Terms of Service</Link></li>
            </ul>
          </div>

        </div>

        {/* Bottom copyright */}
        <div className="pt-8 border-t border-[#e6dfd8] flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] font-mono text-[#6c6a64]">
          <p>© {new Date().getFullYear()} AuraScreening Technologies Inc. All rights reserved.</p>
          <div className="flex items-center gap-1">
            <span>Built with warm editorial aesthetics & AI precision.</span>
          </div>
        </div>

      </div>
    </footer>
  );
}

