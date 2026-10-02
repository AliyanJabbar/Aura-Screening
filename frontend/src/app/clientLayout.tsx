"use client";

import { usePathname } from "next/navigation";
import SmoothScroll from "@/components/providers/smooth-scroll";
import AuthProvider from "@/components/providers/session-provider";
import Navbar from "@/components/layout/navbar";
import Footer from "@/components/layout/footer";
import { Toaster } from "sonner";
// import AIAssistantWidget from "../components/layout/AIAssistantWidget";

export default function ClientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const AuthRoutes = [
    "/login",
    "/register",
    "/forgot-password",
    "/reset-password",
  ];
  return (
    <AuthProvider>
      <SmoothScroll>
        <Navbar />
        {/* <AIAssistantWidget/> */}
        <main className="flex min-h-screen flex-col">
          {children}
        </main>
        {!AuthRoutes.includes(pathname) && <Footer />}
        <Toaster />
      </SmoothScroll>
    </AuthProvider>
  );
}
