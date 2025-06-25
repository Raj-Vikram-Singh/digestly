import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Image from "next/image";
import { AppHeaderNav } from "@/components/AppHeaderNav";
import { AppHeaderSignOut } from "@/components/AppHeaderSignOut";
import { LogoLink } from "@/components/LogoLink";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Digestly | Notion Database Digests to Your Inbox",
  description:
    "Schedule and receive email digests from your Notion databases with Digestly.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground min-h-screen`}
      >
        <header className="w-full border-b border-gray-200 bg-white/95 backdrop-blur sticky top-0 z-30 shadow-sm transition-all">
          <div className="max-w-6xl mx-auto flex items-center justify-between px-6 py-4">
            {/* Left: Logo and app name */}
            <div className="flex items-center gap-3">
              <LogoLink />
            </div>
            {/* Right: Menu and sign out */}
            <div className="flex items-center gap-4">
              <AppHeaderNav />
              <AppHeaderSignOut />
            </div>
          </div>
        </header>
        <main className="max-w-5xl mx-auto px-4 py-8">{children}</main>
        <footer className="bg-gray-50 border-t border-gray-200 py-8 mt-20">
          <div className="max-w-6xl mx-auto px-6">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
              <div className="flex items-center gap-2">
                <Image
                  src="/digestly_logo.png"
                  alt="Digestly Logo"
                  width={24}
                  height={24}
                  className="opacity-80"
                />
                <span className="text-sm text-gray-500">
                  © {new Date().getFullYear()} Digestly. All rights reserved.
                </span>
              </div>
              <div className="flex gap-6 text-sm text-gray-500">
                <a href="#" className="hover:text-blue-700 transition">
                  Privacy
                </a>
                <a href="#" className="hover:text-blue-700 transition">
                  Terms
                </a>
                <a
                  href="mailto:support@digestly.app"
                  className="hover:text-blue-700 transition"
                >
                  Contact
                </a>
              </div>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
