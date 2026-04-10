"use client";

import { useState } from "react";
import { Plus, X, Search, Truck } from "lucide-react";
import { useVEPs } from "@/hooks/useData";
import StatusBadge from "@/components/ui/StatusBadge";
import EmptyState from "@/components/ui/EmptyState";
import Modal from "@/components/ui/Modal";

export default function VEPManager() {
  const { veps, loading, addVEP, updateVEP, deleteVEP } = useVEPs();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [formData, setFormData] = useState({
    type: "Vehicle", // Vehicle, Equipment, Plant
    registrationNumber: "",
    category: "",
    oem: "",
    model: "",
    engineNumber: "",
    chassisNumber: "",
    status: "Active",
  });

  const filteredVeps = veps.filter(
    (v) =>
      v.registrationNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (v.oem && v.oem.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (v.model && v.model.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (v.engineNumber && v.engineNumber.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (v.chassisNumber && v.chassisNumber.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleSubmit = async (e) => {
    e.preventDefault();
    await addVEP(formData);
    setIsModalOpen(false);
    setFormData({
      type: "Vehicle",
      registrationNumber: "",
      category: "",
      oem: "",
      model: "",
      engineNumber: "",
      chassisNumber: "",
      status: "Active",
    });
  };

  const regLabel = formData.type === "Vehicle" ? "BA Number" : "EM Number";

  return (
    <div className="max-w-6xl mx-auto px-8 py-10 animate-fade-in">
      <div className="flex justify-between items-end mb-8 border-b border-border pb-6">
        <div>
          <h1 className="text-3xl font-bold text-text-primary mb-2">VEP Registry</h1>
          <p className="text-sm text-text-secondary">
            Manage Vehicles, Equipment, and Plant specifications
          </p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="notion-button-primary"
        >
          <Plus size={16} /> New VEP
        </button>
      </div>

      <div className="mb-6 relative max-w-md">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
        <input
          type="text"
          placeholder="Filter by Registration, OEM, Model, Engine, Chassis..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="notion-input pl-10"
        />
      </div>

      {loading ? (
        <div className="text-text-muted text-sm py-4">Loading...</div>
      ) : filteredVeps.length === 0 ? (
        <EmptyState
          icon={Truck}
          title="No VEPs found"
          description="Add a new Vehicle, Equipment, or Plant to get started."
        />
      ) : (
        <div className="notion-card overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead>
              <tr className="border-b border-border bg-bg-sidebar">
                <th className="py-2.5 px-4 font-medium text-text-muted">Type</th>
                <th className="py-2.5 px-4 font-medium text-text-muted">Reg Number</th>
                <th className="py-2.5 px-4 font-medium text-text-muted">OEM & Model</th>
                <th className="py-2.5 px-4 font-medium text-text-muted hidden md:table-cell">Category</th>
                <th className="py-2.5 px-4 font-medium text-text-muted hidden lg:table-cell">Engine/Chassis</th>
                <th className="py-2.5 px-4 font-medium text-text-muted">Status</th>
                <th className="py-2.5 px-4 font-medium text-text-muted text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredVeps.map((vep) => (
                <tr
                  key={vep.id}
                  className="border-b border-border last:border-0 hover:bg-bg-card-hover transition-colors"
                >
                  <td className="py-3 px-4 text-text-secondary">{vep.type}</td>
                  <td className="py-3 px-4 font-bold text-text-primary">
                    {vep.registrationNumber}
                  </td>
                  <td className="py-3 px-4">
                    <div className="text-text-primary">{vep.oem || "—"}</div>
                    <div className="text-text-muted text-xs">{vep.model || "—"}</div>
                  </td>
                  <td className="py-3 px-4 text-text-secondary hidden md:table-cell">
                    {vep.category || "—"}
                  </td>
                  <td className="py-3 px-4 text-text-muted text-xs hidden lg:table-cell font-mono">
                    <div>E: {vep.engineNumber || "—"}</div>
                    <div>C: {vep.chassisNumber || "—"}</div>
                  </td>
                  <td className="py-3 px-4">
                    <StatusBadge status={vep.status} />
                  </td>
                  <td className="py-3 px-4 text-right">
                    <button
                      onClick={() => deleteVEP(vep.id)}
                      className="text-danger hover:text-red-700 text-xs px-2 py-1 rounded hover:bg-danger-bg transition-colors"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {isModalOpen && (
        <Modal title="Register New VEP" onClose={() => setIsModalOpen(false)}>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="notion-label">Type</label>
                <select
                  className="notion-select"
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value, registrationNumber: "" })}
                >
                  <option value="Vehicle">Vehicle</option>
                  <option value="Equipment">Equipment</option>
                  <option value="Plant">Plant</option>
                </select>
              </div>

              <div>
                <label className="notion-label">{regLabel} <span className="text-danger">*</span></label>
                <input
                  type="text"
                  required
                  placeholder={formData.type === "Vehicle" ? "e.g., BA-12345" : "e.g., EM-98765"}
                  className="notion-input"
                  value={formData.registrationNumber}
                  onChange={(e) =>
                    setFormData({ ...formData, registrationNumber: e.target.value })
                  }
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 border-t border-border pt-4">
              <div className="col-span-2">
                <label className="notion-label">Category</label>
                <input
                  type="text"
                  placeholder="e.g., Small Utility Vehicle, Heavy Earth Mover"
                  className="notion-input"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                />
              </div>

              <div>
                <label className="notion-label">OEM</label>
                <input
                  type="text"
                  placeholder="e.g., Mahindra & Mahindra Ltd"
                  className="notion-input"
                  value={formData.oem}
                  onChange={(e) => setFormData({ ...formData, oem: e.target.value })}
                />
              </div>

              <div>
                <label className="notion-label">Model</label>
                <input
                  type="text"
                  placeholder="e.g., Scorpio 4x4"
                  className="notion-input"
                  value={formData.model}
                  onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 border-t border-border pt-4">
              <div>
                <label className="notion-label">Engine Number <span className="text-xs text-text-muted font-normal">(Optional)</span></label>
                <input
                  type="text"
                  className="notion-input font-mono text-xs"
                  value={formData.engineNumber}
                  onChange={(e) => setFormData({ ...formData, engineNumber: e.target.value })}
                />
              </div>

              <div>
                <label className="notion-label">Chassis Number <span className="text-xs text-text-muted font-normal">(Optional)</span></label>
                <input
                  type="text"
                  className="notion-input font-mono text-xs"
                  value={formData.chassisNumber}
                  onChange={(e) => setFormData({ ...formData, chassisNumber: e.target.value })}
                />
              </div>
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
                Save VEP
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
