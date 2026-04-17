import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Sidebar } from "@/components/Sidebar";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Argon CRM — Leads & Prospektering",
  description: "Internt salgsprospekteringsverktøy for Argon Solutions",
  robots: { index: false, follow: false },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="no">
      <body className={`${inter.className} bg-surface text-text antialiased`}>
        <Sidebar />
        <main className="min-h-screen pt-14 p-4 md:pt-0 md:ml-64 md:p-8">{children}</main>
      </body>
    </html>
  );
}
