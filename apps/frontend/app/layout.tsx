import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { AuthProvider } from "@/lib/auth-context";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "TenderOS — AI Procurement Intelligence Platform",
  description:
    "India's most advanced AI-powered government procurement intelligence platform. Discover, analyze, and win government tenders with AI.",
  keywords: ["government tenders", "procurement", "GeM", "CPPP", "AI", "India", "tenders"],
  openGraph: {
    title: "TenderOS — AI Procurement Intelligence",
    description: "Read every government tender in India, understand it, predict it, and help businesses win it.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`dark ${inter.variable}`}>
      <body className="antialiased">
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}

