import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Argon CRM — Leads & Prospektering",
  description: "Internt salgsprospekteringsverktøy for Argon Solutions",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="no">
      <body className={`${inter.className} bg-surface text-text antialiased`}>
        {children}
      </body>
    </html>
  );
}
