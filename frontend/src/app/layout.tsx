import type { Metadata } from "next";
import { Cormorant_Garamond, Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import ClientLayout from "./clientLayout";

const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-cormorant",
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
});

export const metadata: Metadata = {
  title: "AuraScreening — Autonomous CV Screening Platform",
  description:
    "Autonomous candidate evaluation and resume shortlisting with human-level discernment and zero demographic bias.",
  keywords: [
    "CV Screening",
    "Autonomous Hiring",
    "AI Candidate Evaluation",
    "Resume Shortlisting",
    "Talent Acquisition",
  ],
  authors: [{ name: "AuraScreening" }],
  creator: "AuraScreening",
  icons: {
    icon: [
      { url: "/icon.svg", type: "image/svg+xml" },
      { url: "/icon", type: "image/png" },
    ],
    apple: "/apple-icon",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${cormorant.variable} ${inter.variable} ${jetbrainsMono.variable}`}
    >
      <body
        className={`${inter.className} bg-[#faf9f5] text-[#141413] antialiased selection:bg-[#cc785c]/20 selection:text-[#141413]`}
      >
        <ClientLayout>{children}</ClientLayout>
      </body>
    </html>
  );
}

