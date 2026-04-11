"use client";

import { useState } from "react";
import { Plus, Search, ClipboardList } from "lucide-react";
import { useWorkOrders, useVEPs } from "@/hooks/useData";
import StatusBadge from "@/components/ui/StatusBadge";
import EmptyState from "@/components/ui/EmptyState";
import Modal from "@/components/ui/Modal";

export default function WorkOrders() {
  const { workOrders, loading, addWorkOrder } = useWorkOrders();
  const { veps } = useVEPs();
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [formData, setFormData] = useState({
    workOrderNumber: "",
    vepId: "",
    dateReceived: new Date().toISOString().split("T")[0],
    workType: "SPARE_REPLACEMENT",
    remarks: "",
    issues: "",
  });

  const filteredOrders = workOrders.filter(
    (wo) =>
      wo.workOrderNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (wo.vep && wo.vep.registrationNumber.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleSubmit = async (e) => {
    e.preventDefault();
    await addWorkOrder(formData);
    setIsModalOpen(false);
    setFormData({
      workOrderNumber: "",
      vepId: "",
      dateReceived: new Date().toISOString().split("T")[0],
      workType: "SPARE_REPLACEMENT",
      remarks: "",
      issues: "",
    });
  };

  return (
    <div className="max-w-6xl mx-auto px-8 py-10 animate-fade-in">
      <div className="flex justify-between items-end mb-8 border-b border-border pb-6">
        <div>
          <h1 className="text-3xl font-bold text-text-primary mb-2">Work Orders</h1>
          <p className="text-sm text-text-secondary">
            Receive and process unit work requests
          </p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="notion-button-primary"
        >
          <Plus size={16} /> Receive Work Order
        </button>
      </div>

      <div className="mb-6 relative max-w-md">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
        <input
          type="text"
          placeholder="Filter by WO Number or VEP..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="notion-input pl-10"
        />
      </div>

      {loading ? (
        <div className="text-text-muted text-sm py-4">Loading...</div>
      ) : filteredOrders.length === 0 ? (
        <EmptyState
          icon={ClipboardList}
          title="No Work Orders"
          description="Receive a new work order to begin processing."
        />
      ) : (
        <div className="notion-card overflow-hidden">
          <table className="w-full text-sm text-left">
            <thead>
              <tr className="border-b border-border bg-bg-sidebar">
                <th className="py-2.5 px-4 font-medium text-text-muted">WO Number</th>
                <th className="py-2.5 px-4 font-medium text-text-muted">VEP</th>
                <th className="py-2.5 px-4 font-medium text-text-muted">Type</th>
                <th className="py-2.5 px-4 font-medium text-text-muted">Date</th>
                <th className="py-2.5 px-4 font-medium text-text-muted">Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredOrders.map((wo) => (
                <tr
                  key={wo.id}
                  className="border-b border-border last:border-0 hover:bg-bg-card-hover transition-colors cursor-pointer group"
                >
                  <td className="py-3 px-4 font-medium text-text-primary group-hover:text-accent transition-colors">
                    {wo.workOrderNumber}
                  </td>
                  <td className="py-3 px-4">
                    <div className="font-bold text-text-primary text-xs">
                      {wo.vep?.registrationNumber || "—"}
                    </div>
                    {(wo.vep?.oem || wo.vep?.model) && (
                      <div className="text-text-muted text-[10px] uppercase tracking-wider mt-0.5">
                        {wo.vep?.oem} {wo.vep?.model}
                      </div>
                    )}
                    {wo.issues && (
                      <div className="text-warning text-xs mt-1 italic truncate max-w-[200px]" title={wo.issues}>
                        Issues: {wo.issues}
                      </div>
                    )}
                  </td>
                  <td className="py-3 px-4">
                    <StatusBadge status={wo.workType} />
                  </td>
                  <td className="py-3 px-4 text-text-secondary">{wo.dateReceived}</td>
                  <td className="py-3 px-4">
                    <StatusBadge status={wo.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {isModalOpen && (
        <Modal title="Receive Work Order" onClose={() => setIsModalOpen(false)}>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="notion-label">Work Order Number <span className="text-danger">*</span></label>
              <input
                type="text"
                required
                className="notion-input"
                value={formData.workOrderNumber}
                onChange={(e) =>
                  setFormData({ ...formData, workOrderNumber: e.target.value })
                }
              />
            </div>

            <div>
              <label className="notion-label">Target VEP <span className="text-danger">*</span></label>
              <select
                required
                className="notion-select"
                value={formData.vepId}
                onChange={(e) => setFormData({ ...formData, vepId: e.target.value })}
              >
                <option value="" disabled>Select a VEP...</option>
                {veps.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.registrationNumber} - {v.oem} {v.model}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="notion-label">Work Type</label>
                <select
                  className="notion-select"
                  value={formData.workType}
                  onChange={(e) =>
                    setFormData({ ...formData, workType: e.target.value })
                  }
                >
                  <option value="SPARE_REPLACEMENT">Spare Issue/Replacement</option>
                  <option value="KPL_LPH_TEST">KPL/LPH Test</option>
                </select>
              </div>

              <div>
                <label className="notion-label">Date Received <span className="text-danger">*</span></label>
                <input
                  type="date"
                  required
                  className="notion-input"
                  value={formData.dateReceived}
                  onChange={(e) =>
                    setFormData({ ...formData, dateReceived: e.target.value })
                  }
                />
              </div>
            </div>

            {formData.workType === "SPARE_REPLACEMENT" && (
              <div>
                <label className="notion-label">Issues / Defects <span className="text-xs font-normal text-text-muted">(If any)</span></label>
                <textarea
                  className="notion-input min-h-[60px]"
                  placeholder="List down the issues in the VEP..."
                  value={formData.issues}
                  onChange={(e) => setFormData({ ...formData, issues: e.target.value })}
                />
              </div>
            )}

            <div>
              <label className="notion-label">Remarks <span className="text-xs font-normal text-text-muted">(Optional)</span></label>
              <textarea
                className="notion-input min-h-[60px]"
                value={formData.remarks}
                onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
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
              <button type="submit" className="notion-button-primary">
                Receive Work Order
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
