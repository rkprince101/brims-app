"use client";

import { useDashboardStats } from "@/hooks/useData";
import { Truck, ClipboardList, FileText, CheckCircle2 } from "lucide-react";
import StatusBadge from "@/components/ui/StatusBadge";
import Link from "next/link";

export default function Dashboard() {
  const { stats, loading } = useDashboardStats();

  return (
    <div className="max-w-5xl mx-auto px-8 py-10 animate-fade-in">
      <div className="mb-10">
        <h1 className="text-3xl font-bold text-text-primary mb-2">Workspace Overview</h1>
        <p className="text-text-secondary text-sm">BRIMS — Active operations and job card pipeline</p>
      </div>

      {loading ? (
        <div className="text-text-muted text-sm py-4">Loading stats...</div>
      ) : (
        <>
          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-12">
            {[
              { label: "Total VEPs", value: stats.totalVEPs, icon: Truck, color: "text-accent" },
              { label: "Active WOs", value: stats.activeWorkOrders, icon: ClipboardList, color: "text-warning" },
              { label: "Open Job Cards", value: stats.openJobCards, icon: FileText, color: "text-text-primary" },
              { label: "Closed Job Cards", value: stats.closedJobCards, icon: CheckCircle2, color: "text-success" },
            ].map((s, i) => {
              const Icon = s.icon;
              return (
                <div key={i} className="notion-card p-4 flex flex-col justify-between">
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-sm font-medium text-text-secondary">{s.label}</span>
                    <Icon size={16} className={s.color} />
                  </div>
                  <span className="text-3xl font-bold text-text-primary">{s.value}</span>
                </div>
              );
            })}
          </div>

          {/* Active Job Cards Pipeline */}
          <div className="mb-8">
            <h2 className="text-lg font-semibold text-text-primary mb-4 pb-2 border-b border-border flex justify-between items-center">
              Active Pipeline
              <Link href="/job-cards" className="text-sm text-text-muted hover:text-text-primary transition-colors font-normal">
                View all →
              </Link>
            </h2>

            {stats.recentJobCards.length === 0 ? (
              <div className="text-center py-10 border border-border rounded-lg bg-bg-card-hover border-dashed">
                <FileText size={32} className="mx-auto text-text-muted mb-3" />
                <p className="text-sm text-text-secondary mb-3">No active job cards in pipeline.</p>
                <Link href="/work-orders" className="notion-button-primary">
                  Go to Work Orders
                </Link>
              </div>
            ) : (
              <div className="space-y-2">
                {stats.recentJobCards.map((jc) => (
                  <Link 
                    key={jc.id} 
                    href={`/job-cards/${jc.id}`}
                    className="flex flex-col sm:flex-row sm:items-center justify-between p-3 border border-border rounded hover:bg-bg-card-hover transition-colors group cursor-pointer bg-bg-main"
                  >
                    <div className="flex items-center gap-4 mb-2 sm:mb-0">
                      <div className="w-10 h-10 rounded bg-bg-sidebar flex items-center justify-center border border-border">
                        <FileText size={18} className="text-text-muted group-hover:text-accent transition-colors" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-sm text-text-primary">{jc.jobCardNumber}</span>
                          <span className="text-xs font-mono text-text-muted bg-border px-1.5 py-0.5 rounded">
                            {jc.workOrder?.vep?.registrationNumber || "—"}
                          </span>
                        </div>
                        <p className="text-xs text-text-secondary mt-0.5">
                          Opened: {jc.openedDate}
                        </p>
                      </div>
                    </div>
                    <div>
                      <StatusBadge status={jc.status} />
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
