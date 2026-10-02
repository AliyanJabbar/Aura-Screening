"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "motion/react";
import { useSession, signOut } from "@/lib/auth-client";
import { LogOut, LayoutDashboard, Menu, X, ChevronRight, User, Zap, Briefcase } from "lucide-react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function Navbar() {
  const { data: sessionData, isPending } = useSession();
  const user = sessionData?.user;
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [profileUsage, setProfileUsage] = useState<{
    plan_name: string;
    credits_remaining: number;
    total_credits: number;
  } | null>(null);

  useEffect(() => {
    if (!user?.id) return;
    const backendUrl =
      process.env.NEXT_PUBLIC_API_URL ||
      process.env.NEXT_PUBLIC_BACKEND_URL ||
      "https://aura-screening.fastapicloud.dev";

    fetch(`${backendUrl}/payments/profile-usage?user_id=${encodeURIComponent(user.id)}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data) setProfileUsage(data);
      })
      .catch(() => { });
  }, [user?.id]);

  const getInitials = (name?: string | null, email?: string | null) => {
    if (name) return name.charAt(0).toUpperCase();
    if (email) return email.charAt(0).toUpperCase();
    return "S";
  };

  const navLinks = [
    { name: "Process", href: "/#pipeline" },
    { name: "Pricing", href: "/#pricing" },
    { name: "Screening Portal", href: "/screening" },
    { name: "Dashboard", href: "/dashboard" },
  ];

  const handleSmoothScroll = (
    e: React.MouseEvent<HTMLAnchorElement>,
    href: string
  ) => {
    if (!href.startsWith("/#")) return;
    if (window.location.pathname !== "/") return;

    e.preventDefault();
    const id = href.replace("/#", "");
    const el = document.getElementById(id);

    if (el) {
      const y = el.getBoundingClientRect().top + window.pageYOffset - 64;
      window.scrollTo({ top: y, behavior: "smooth" });
    }
  };

  const handleSignOut = async () => {
    await signOut({
      fetchOptions: {
        onSuccess: () => {
          window.location.href = "/";
        },
      },
    });
  };

  return (
    <>
      <motion.header
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        className="fixed top-0 z-50 w-full border-b border-[#e6dfd8] bg-[#faf9f5]/90 backdrop-blur-md"
      >
        <div className="container mx-auto flex h-16 items-center justify-between px-6 max-w-6xl">
          {/* Logo with Anthropic-style 4-spoke radial spike mark */}
          <Link
            href="/"
            className="flex items-center gap-2.5 font-semibold text-[#141413] group"
          >
            <svg
              className="w-5 h-5 text-[#141413] transition-transform duration-300 group-hover:rotate-45"
              viewBox="0 0 24 24"
              fill="currentColor"
            >
              {/* 4-spoke radial spike glyph */}
              <path d="M12 2L13.5 9.5L21 11L13.5 12.5L12 20L10.5 12.5L3 11L10.5 9.5L12 2Z" />
            </svg>
            <div className="flex items-baseline gap-1.5">
              <span className="font-serif text-xl tracking-tight font-medium text-[#141413]">
                AuraScreening
              </span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden gap-7 text-sm font-medium text-[#3d3d3a] md:flex">
            {navLinks.map((link) => (
              <Link
                key={link.name}
                href={link.href}
                onClick={(e) => handleSmoothScroll(e, link.href)}
                className="hover:text-[#cc785c] transition-colors relative py-1"
              >
                {link.name}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-3">
            {/* Auth Logic */}
            <div className="flex items-center gap-3">
              {isPending ? (
                <div className="h-8 w-8 animate-pulse rounded-full bg-[#efe9de] border border-[#e6dfd8]" />
              ) : user ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Avatar className="h-9 w-9 cursor-pointer border border-[#e6dfd8] hover:border-[#cc785c] transition-colors">
                      <AvatarImage
                        src={user.image || undefined}
                        alt={user.name || "User"}
                      />
                      <AvatarFallback className="bg-[#cc785c] text-white font-medium text-xs">
                        {getInitials(user.name, user.email)}
                      </AvatarFallback>
                    </Avatar>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent
                    align="end"
                    className="w-64 bg-[#faf9f5] border-[#e6dfd8] text-[#141413] shadow-lg rounded-2xl p-1.5"
                  >
                    <DropdownMenuLabel className="font-normal p-3">
                      <div className="flex flex-col space-y-1">
                        <p className="text-sm font-medium leading-none text-[#141413]">
                          {user.name || "Recruiter"}
                        </p>
                        <p className="text-xs leading-none text-[#6c6a64] truncate">
                          {user.email}
                        </p>
                      </div>

                      {profileUsage && (
                        <div className="mt-3 flex items-center justify-between rounded-xl bg-[#efe9de] px-2.5 py-1.5 text-[11px] border border-[#e6dfd8]">
                          <span className="font-medium text-[#141413]">{profileUsage.plan_name}</span>
                          <span className="font-mono font-bold text-[#cc785c]">
                            {profileUsage.credits_remaining} / {profileUsage.total_credits} runs left
                          </span>
                        </div>
                      )}
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator className="bg-[#e6dfd8]" />
                    <DropdownMenuItem className="focus:bg-[#efe9de] focus:text-[#141413] cursor-pointer rounded-lg my-0.5 p-0">
                      <Link href="/dashboard" className="flex items-center gap-2.5 w-full text-xs font-medium py-2 px-2.5">
                        <Briefcase className="h-4 w-4 text-[#cc785c]" />
                        <span>Recruiter Dashboard</span>
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem className="focus:bg-[#efe9de] focus:text-[#141413] cursor-pointer rounded-lg my-0.5 p-0">
                      <Link href="/profile" className="flex items-center gap-2.5 w-full text-xs font-medium py-2 px-2.5">
                        <User className="h-4 w-4 text-[#cc785c]" />
                        <span>Profile & Credits</span>
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem className="focus:bg-[#efe9de] focus:text-[#141413] cursor-pointer rounded-lg my-0.5 p-0">
                      <Link href="/screening" className="flex items-center gap-2.5 w-full text-xs font-medium py-2 px-2.5">
                        <LayoutDashboard className="h-4 w-4 text-[#cc785c]" />
                        <span>CV Screening Portal</span>
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator className="bg-[#e6dfd8]" />
                    <DropdownMenuItem
                      onClick={handleSignOut}
                      className="focus:bg-[#c64545]/10 focus:text-[#c64545] cursor-pointer text-[#c64545] rounded-lg my-0.5 py-2 px-2.5"
                    >
                      <LogOut className="mr-2 h-4 w-4" />
                      <span className="text-xs font-medium">Sign Out</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <>
                  <Link
                    href="/login"
                    className="hidden sm:block text-sm font-medium text-[#3d3d3a] hover:text-[#cc785c] transition-colors px-3 py-1.5"
                  >
                    Log In
                  </Link>
                  <Link
                    href="/register"
                    className="rounded-md bg-[#cc785c] px-4 py-2 text-xs font-semibold text-white transition-all hover:bg-[#a9583e] active:scale-95 shadow-xs"
                  >
                    Get Started
                  </Link>
                </>
              )}
            </div>

            {/* Mobile Menu Toggle */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="flex h-9 w-9 items-center justify-center rounded-md border border-[#e6dfd8] bg-[#efe9de] text-[#141413] md:hidden"
            >
              {isMobileMenuOpen ? <X size={18} /> : <Menu size={18} />}
            </button>
          </div>
        </div>
      </motion.header>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed inset-x-0 top-16 z-40 border-b border-[#e6dfd8] bg-[#faf9f5] p-6 shadow-xl md:hidden"
          >
            <nav className="flex flex-col gap-3">
              {navLinks.map((link) => (
                <Link
                  key={link.name}
                  href={link.href}
                  onClick={(e) => {
                    handleSmoothScroll(e, link.href);
                    setIsMobileMenuOpen(false);
                  }}
                  className="flex items-center justify-between rounded-md bg-[#efe9de] px-4 py-3 text-sm font-medium text-[#141413] hover:bg-[#e8e0d2]"
                >
                  {link.name}
                  <ChevronRight size={16} className="text-[#cc785c]" />
                </Link>
              ))}
              {user ? (
                <div className="flex flex-col gap-3 pt-3 border-t border-[#e6dfd8]">
                  <div className="flex items-center gap-3 px-1 py-1">
                    <Avatar className="h-9 w-9 border border-[#e6dfd8]">
                      <AvatarImage
                        src={user.image || undefined}
                        alt={user.name || "User"}
                      />
                      <AvatarFallback className="bg-[#cc785c] text-white font-medium text-xs">
                        {getInitials(user.name, user.email)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col min-w-0">
                      <p className="text-sm font-medium text-[#141413] truncate">
                        {user.name || "Recruiter"}
                      </p>
                      <p className="text-xs text-[#6c6a64] truncate">
                        {user.email}
                      </p>
                    </div>
                  </div>

                  {profileUsage && (
                    <div className="flex items-center justify-between rounded-md bg-[#efe9de] px-3 py-2 text-xs border border-[#e6dfd8]">
                      <span className="font-medium text-[#141413]">{profileUsage.plan_name}</span>
                      <span className="font-mono font-bold text-[#cc785c]">
                        {profileUsage.credits_remaining} / {profileUsage.total_credits} runs left
                      </span>
                    </div>
                  )}

                  <Link
                    href="/dashboard"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="flex items-center gap-2 rounded-md bg-[#efe9de] px-4 py-2.5 text-xs font-medium text-[#141413] hover:bg-[#e8e0d2]"
                  >
                    <Briefcase size={14} className="text-[#cc785c]" />
                    <span>Recruiter Dashboard</span>
                  </Link>

                  <Link
                    href="/profile"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="flex items-center gap-2 rounded-md bg-[#efe9de] px-4 py-2.5 text-xs font-medium text-[#141413] hover:bg-[#e8e0d2]"
                  >
                    <User size={14} className="text-[#cc785c]" />
                    <span>My Profile & Credits</span>
                  </Link>

                  <button
                    onClick={() => {
                      setIsMobileMenuOpen(false);
                      handleSignOut();
                    }}
                    className="flex items-center justify-center gap-2 rounded-md border border-[#c64545]/20 bg-[#c64545]/10 px-4 py-2.5 text-xs font-medium text-[#c64545] hover:bg-[#c64545]/20 transition-colors"
                  >
                    <LogOut size={14} />
                    <span>Sign Out</span>
                  </button>
                </div>
              ) : (
                <div className="flex flex-col gap-2 pt-2 border-t border-[#e6dfd8]">
                  <Link
                    href="/login"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="flex justify-center items-center rounded-md border border-[#e6dfd8] px-4 py-2.5 text-sm font-medium text-[#141413]"
                  >
                    Log In
                  </Link>
                  <Link
                    href="/register"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="flex justify-center items-center rounded-md bg-[#cc785c] px-4 py-2.5 text-sm font-semibold text-white"
                  >
                    Get Started
                  </Link>
                </div>
              )}
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

