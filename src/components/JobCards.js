"use client";

import { useState } from "react";
import { Plus, Search, FileText } from "lucide-react";
import { useJobCards, useWorkOrders } from "@/hooks/useData";
import StatusBadge from "@/components/ui/StatusBadge";
import EmptyState from "@/components/ui/EmptyState";
import Modal from "@/components/ui/Modal";
import Link from "next/link";

export default function JobCards() {
  const { jobCards, loading, addJobCard } = useJobCards();
  const { workOrders } = useWorkOrders();
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [formData, setFormData] = useState({
    jobCardNumber: "",
    workOrderId: "",
    openedDate: new Date().toISOString().split("T")[0],
    remarks: "",
  });

  // Only show work orders that have been received and aren't already linked to an active job card
  // (In a real app, you might want a specific status like "ACCEPTED")
  const availableWorkOrders = workOrders.filter(
    (wo) => wo.status !== "COMPLETED" && wo.status !== "ASSIGNED_TO_JOB_CARD"
  );

  const filteredCards = jobCards.filter(
    (jc) =>
      jc.jobCardNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (jc.workOrder?.vep?.registrationNumber?.toLowerCase()
        .includes(searchTerm.toLowerCase()))
  );

  const handleSubmit = async (e) => {
    e.preventDefault();
    await addJobCard(formData);
    setIsModalOpen(false);
    setFormData({
      jobCardNumber: "",
      workOrderId: "",
      openedDate: new Date().toISOString().split("T")[0],
      remarks: "",
    });
  };

  return (
    <div className="max-w-6xl mx-auto px-8 py-10 animate-fade-in">
      <div className="flex justify-between items-end mb-8 border-b border-border pb-6">
        <div>
          <h1 className="text-3xl font-bold text-text-primary mb-2">Job Cards</h1>
          <p className="text-sm text-text-secondary">
            Pipeline of all active tasks, tests, and spare procurement
          </p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="notion-button-primary"
        >
          <Plus size={16} /> Open Job Card
        </button>
      </div>

      <div className="mb-6 relative max-w-md">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
        <input
          type="text"
          placeholder="Filter by JC Number or VEP..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="notion-input pl-10"
        />
      </div>

      {loading ? (
        <div className="text-text-muted text-sm py-4">Loading...</div>
      ) : filteredCards.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="No Job Cards"
          description="Open a job card from an accepted work order to start tracking work."
          action={
            <button
              onClick={() => setIsModalOpen(true)}
              className="notion-button-primary mt-2"
            >
              Open Job Card
            </button>
          }
        />
      ) : (
        <div className="notion-card overflow-hidden">
          <table className="w-full text-sm text-left">
            <thead>
              <tr className="border-b border-border bg-bg-sidebar">
                <th className="py-2.5 px-4 font-medium text-text-muted">JC Number</th>
                <th className="py-2.5 px-4 font-medium text-text-muted">VEP</th>
                <th className="py-2.5 px-4 font-medium text-text-muted">Work Type</th>
                <th className="py-2.5 px-4 font-medium text-text-muted">Opened</th>
                <th className="py-2.5 px-4 font-medium text-text-muted">Status</th>
                <th className="py-2.5 px-4 font-medium text-text-muted">Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredCards.map((jc) => (
                <tr
                  key={jc.id}
                  className="border-b border-border last:border-0 hover:bg-bg-card-hover transition-colors group"
                >
                  <td className="py-3 px-4 font-medium text-text-primary">
                    {jc.jobCardNumber}
                  </td>
                  <td className="py-3 px-4">
                    <div className="font-bold text-text-primary text-xs">
                      {jc.workOrder?.vep?.registrationNumber || "—"}
                    </div>
                    {(jc.workOrder?.vep?.oem || jc.workOrder?.vep?.model) && (
                      <div className="text-text-muted text-[10px] uppercase tracking-wider mt-0.5">
                        {jc.workOrder?.vep?.oem} {jc.workOrder?.vep?.model}
                      </div>
                    )}
                  </td>
                  <td className="py-3 px-4 text-text-secondary">
                    {jc.workOrder?.workType === "KPL_LPH_TEST"
                      ? "Test"
                      : "Spares"}
                  </td>
                  <td className="py-3 px-4 text-text-secondary">{jc.openedDate}</td>
                  <td className="py-3 px-4">
                    <StatusBadge status={jc.status} />
                  </td>
                  <td className="py-3 px-4">
                    <Link
                      href={`/job-cards/${jc.id}`}
                      className="text-accent hover:text-accent-hover font-medium underline-offset-2 hover:underline inline-flex items-center gap-1 transition-colors"
                    >
                      Manage
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {isModalOpen && (
        <Modal title="Open New Job Card" onClose={() => setIsModalOpen(false)}>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="notion-label">Job Card Number <span className="text-danger">*</span></label>
              <input
                type="text"
                required
                className="notion-input"
                value={formData.jobCardNumber}
                onChange={(e) =>
                  setFormData({ ...formData, jobCardNumber: e.target.value })
                }
              />
            </div>

            <div>
              <label className="notion-label">Source Work Order <span className="text-danger">*</span></label>
              {availableWorkOrders.length === 0 ? (
                <div className="p-3 bg-warning-bg text-warning rounded border border-warning/20 text-sm">
                  No pending work orders available. Please receive a work order first.
                </div>
              ) : (
                <select
                  required
                  className="notion-select"
                  value={formData.workOrderId}
                  onChange={(e) =>
                    setFormData({ ...formData, workOrderId: e.target.value })
                  }
                >
                  <option value="" disabled>Select a Work Order...</option>
                  {availableWorkOrders.map((wo) => (
                    <option key={wo.id} value={wo.id}>
                      {wo.workOrderNumber} - {wo.vep?.registrationNumber} ({wo.workType})
                    </option>
                  ))}
                </select>
              )}
            </div>

            <div>
              <label className="notion-label">Date Opened <span className="text-danger">*</span></label>
              <input
                type="date"
                required
                className="notion-input"
                value={formData.openedDate}
                onChange={(e) =>
                  setFormData({ ...formData, openedDate: e.target.value })
                }
              />
            </div>

            <div className="pt-4 flex justify-end gap-2 border-t border-border mt-4">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="notion-button"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="notion-button-primary disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={availableWorkOrders.length === 0}
              >
                Create Job Card
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
