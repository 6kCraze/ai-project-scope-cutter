import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.VERCEL_PROJECT_PRODUCTION_URL
      ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
      : "http://localhost:3000",
  ),
  title: "Project Scope Cutter — Big ideas. Smaller first steps.",
  description:
    "Turn your overambitious project idea into a focused MVP you can ship in 30 or 60 minutes. Get a build plan, a clear finish line, and a ready-to-paste AI coding prompt.",
  applicationName: "Project Scope Cutter",
  keywords: [
    "MVP",
    "project scope",
    "AI coding",
    "build in public",
    "indie hackers",
  ],
  openGraph: {
    title: "Your idea is big. Your first build shouldn’t be.",
    description: "A focused MVP. A realistic plan. A prompt to start building.",
    type: "website",
    siteName: "Project Scope Cutter",
  },
  twitter: {
    card: "summary_large_image",
    title: "Project Scope Cutter",
    description:
      "Turn someday into shipped. A smaller first step for your next big idea.",
  },
  icons: { icon: "/icon.svg", apple: "/apple-icon" },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
