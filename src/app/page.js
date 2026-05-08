"use client";

import { useState } from "react";
import Dashboard from "@/components/Dashboard";

export default function Home() {
  return (
    <div className="flex-1 w-full max-w-6xl mx-auto p-6">
      <Dashboard />
    </div>
  );
}
