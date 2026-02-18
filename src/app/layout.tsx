import type { Metadata } from "next";
import { Inter, Outfit } from "next/font/google";
import "./globals.css";
import { AuthContextProvider } from "@/context/AuthContext";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const outfit = Outfit({ subsets: ["latin"], variable: "--font-outfit" });

export const metadata: Metadata = {
  title: "StrideIQ by ChanceTEK Fitness | Intelligent Agentic AI Coaching",
  description: "Intelligent Movement. Agentic Performance. The AI-powered fitness platform with autonomous coaching agents.",
  manifest: "/manifest.json",
};

import { SettingsProvider } from "@/context/SettingsContext";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.variable} ${outfit.variable}`} suppressHydrationWarning>
        <AuthContextProvider>
          <SettingsProvider>
            {children}
          </SettingsProvider>
        </AuthContextProvider>
      </body>
    </html>
  );
}
