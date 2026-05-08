"use client";

import { CheckCircle2, Clock } from "lucide-react";

const STEP_LABELS = {
  OPEN: "Open",
  WAITING_FOR_ION: "Waiting for ION",
  SCALING_IN_PROGRESS: "Scaling in Progress",
  WAITING_FOR_NAC: "Waiting for NAC",
  WAITING_FOR_PROCUREMENT: "Waiting for Procurement",
  SPARES_RECEIVED: "Spares Received",
  SPARES_ISSUED: "Spares Issued",
  CLOSED: "Closed",
  TESTING: "Testing",
};

export default function StatusSidebar({ status, isTest }) {
  const STEPS = isTest
    ? ["TESTING", "CLOSED"]
    : ["OPEN", "WAITING_FOR_ION", "SCALING_IN_PROGRESS", "WAITING_FOR_NAC", "WAITING_FOR_PROCUREMENT", "SPARES_RECEIVED", "SPARES_ISSUED", "CLOSED"];
  const currentStep = STEPS.indexOf(status);

  return (
    <aside className="status-sidebar">
      <h3 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-4">Job Card Status</h3>
      <div className="flex flex-col gap-0">
        {STEPS.map((step, i) => {
          const isCompleted = i < currentStep;
          const isCurrent = i === currentStep;
          return (
            <div key={step} className="flex items-start gap-3">
              {/* Vertical line connector */}
              <div className="flex flex-col items-center">
                <div className={`flex items-center justify-center w-6 h-6 rounded-full border-2 flex-shrink-0 transition-colors ${
                  isCompleted
                    ? "bg-success border-success text-white"
                    : isCurrent
                    ? "bg-text-primary border-text-primary text-white"
                    : "bg-bg-main border-border text-text-muted"
                }`}>
                  {isCompleted ? <CheckCircle2 size={12} /> : <Clock size={12} />}
                </div>
                {i < STEPS.length - 1 && (
                  <div className={`w-0.5 h-8 ${i < currentStep ? "bg-success" : "bg-border"}`} />
                )}
              </div>
              {/* Step label */}
              <div className={`pt-1 text-sm transition-colors ${
                isCompleted
                  ? "text-success font-medium"
                  : isCurrent
                  ? "text-text-primary font-semibold"
                  : "text-text-muted"
              }`}>
                {STEP_LABELS[step] || step.replace(/_/g, " ").toLowerCase().replace(/^\w/, c => c.toUpperCase())}
              </div>
            </div>
          );
        })}
      </div>
    </aside>
  );
}
