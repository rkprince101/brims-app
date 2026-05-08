import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Sidebar from "@/components/Sidebar";

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

export default function RootLayout({ children }) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="h-screen overflow-hidden bg-[var(--color-bg-main)]" suppressHydrationWarning>
        <Sidebar />
        <main className="h-screen overflow-y-auto bg-[var(--color-bg-main)] pb-10 pl-[240px] transition-[padding] duration-200">
          {children}
        </main>
      </body>
    </html>
  );
}
