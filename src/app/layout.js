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

export const metadata = {
  title: "BRIMS - Border Road Inventory Management System",
  description: "Track Work Orders, Job Cards, Spares, and Vouchers for border road equipment and vehicle maintenance.",
};

import Sidebar from "@/components/Sidebar";

export default function RootLayout({ children }) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex bg-[var(--color-bg-main)]">
        <Sidebar />
        <main className="flex-1 max-w-[100vw] h-screen h-[100dvh] overflow-y-auto bg-[var(--color-bg-main)] pb-10">
          {children}
        </main>
      </body>
    </html>
  );
}
