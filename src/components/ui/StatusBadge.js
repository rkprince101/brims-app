"use client";

const STATUS_STYLES = {
  // Work Order statuses
  PENDING: { bg: "bg-warning-muted", text: "text-warning", label: "Pending" },
  ACCEPTED: { bg: "bg-info-muted", text: "text-info", label: "Accepted" },
  ASSIGNED_TO_JOB_CARD: { bg: "bg-purple-muted", text: "text-purple", label: "Assigned" },
  COMPLETED: { bg: "bg-success-muted", text: "text-success", label: "Completed" },

  // Job Card statuses
  OPEN: { bg: "bg-info-muted", text: "text-info", label: "Open" },
  TESTING: { bg: "bg-purple-muted", text: "text-purple", label: "Testing" },
  WAITING_FOR_ION: { bg: "bg-warning-muted", text: "text-warning", label: "Waiting ION" },
  SCALING_IN_PROGRESS: { bg: "bg-warning-muted", text: "text-warning", label: "Scaling" },
  WAITING_FOR_NAC: { bg: "bg-purple-muted", text: "text-purple", label: "Waiting NAC" },
  WAITING_FOR_PROCUREMENT: { bg: "bg-info-muted", text: "text-info", label: "Procuring" },
  SPARES_RECEIVED: { bg: "bg-teal-muted", text: "text-teal", label: "Spares In" },
  SPARES_ISSUED: { bg: "bg-success-muted", text: "text-success", label: "Issued" },
  CLOSED: { bg: "bg-success-muted", text: "text-success", label: "Closed" },

  // NAC statuses
  REQUESTED: { bg: "bg-warning-muted", text: "text-warning", label: "Requested" },
  SPARES_PROVIDED_BY_STORE: { bg: "bg-success-muted", text: "text-success", label: "Store Provided" },
  NAC_ISSUED: { bg: "bg-purple-muted", text: "text-purple", label: "NAC Issued" },

  // Spare status
  NOT_STARTED: { bg: "bg-warning-muted", text: "text-warning", label: "Not Started" },
  IN_PROGRESS: { bg: "bg-info-muted", text: "text-info", label: "In Progress" },
  DONE: { bg: "bg-success-muted", text: "text-success", label: "Done" },
  SCALING: { bg: "bg-warning-muted", text: "text-warning", label: "Scaling" },
  NAC_REQUESTED: { bg: "bg-purple-muted", text: "text-purple", label: "NAC Req." },
  PROCURING: { bg: "bg-info-muted", text: "text-info", label: "Procuring" },
  RECEIVED: { bg: "bg-teal-muted", text: "text-teal", label: "Received" },
  ISSUED: { bg: "bg-success-muted", text: "text-success", label: "Issued" },

  // Availability
  UNKNOWN: { bg: "bg-warning-muted", text: "text-warning", label: "Unknown" },
  AVAILABLE_IN_STORE: { bg: "bg-success-muted", text: "text-success", label: "Available" },
  NOT_AVAILABLE: { bg: "bg-danger-muted", text: "text-danger", label: "Unavailable" },

  // VEP types
  Active: { bg: "bg-success-muted", text: "text-success", label: "Active" },
  "Under Maintenance": { bg: "bg-warning-muted", text: "text-warning", label: "Maintenance" },

  // Work types
  KPL_LPH_TEST: { bg: "bg-teal-muted", text: "text-teal", label: "KPL/LPH Test" },
  SPARE_REPLACEMENT: { bg: "bg-purple-muted", text: "text-purple", label: "Spare Issue" },

  // Procurement methods
  MoU: { bg: "bg-info-muted", text: "text-info", label: "MoU" },
  GeM: { bg: "bg-purple-muted", text: "text-purple", label: "GeM" },
  Imprest: { bg: "bg-teal-muted", text: "text-teal", label: "Imprest" },

  // Voucher types
  CRV: { bg: "bg-info-muted", text: "text-info", label: "CRV" },
  RV: { bg: "bg-teal-muted", text: "text-teal", label: "RV" },
};

export default function StatusBadge({ status, className = "" }) {
  const style = STATUS_STYLES[status] || {
    bg: "bg-bg-card",
    text: "text-text-secondary",
    label: status,
  };

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${style.bg} ${style.text} ${className}`}
    >
      {style.label}
    </span>
  );
}
