"use client";

import { useState } from "react";
import Sidebar from "@/components/Sidebar";
import Dashboard from "@/components/Dashboard";
import WorkOrders from "@/components/WorkOrders";
import JobCards from "@/components/JobCards";
import VEPManager from "@/components/VEPManager";
import SearchHistory from "@/components/SearchHistory";
import Vouchers from "@/components/Vouchers";

export default function Home() {
  return (
    <div className="flex-1 w-full max-w-6xl mx-auto p-6">
      <Dashboard />
    </div>
  );
}
