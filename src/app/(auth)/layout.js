import { Geist, Geist_Mono } from "next/font/google";
import "../globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "BRIMS — Sign In",
  description: "Sign in to the Border Road Inventory Management System.",
};

export default function AuthLayout({ children }) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body
        className="h-screen overflow-hidden bg-[var(--color-bg-main)] flex items-center justify-center"
        suppressHydrationWarning
      >
        {children}
      </body>
    </html>
  );
}
