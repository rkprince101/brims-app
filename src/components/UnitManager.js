"use client";

import { useState } from "react";
import { Plus, X } from "lucide-react";
import { useUnits } from "@/hooks/useData";
import EmptyState from "@/components/ui/EmptyState";
import Modal from "@/components/ui/Modal";

export default function UnitManager() {
  const { units, loading, addUnit, updateUnit, deleteUnit } = useUnits();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editUnit, setEditUnit] = useState(null);
  const [formData, setFormData] = useState({ name: "", location: "", remarks: "" });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) return;
    if (editUnit) {
      await updateUnit(editUnit.id, formData);
    } else {
      await addUnit(formData);
    }
    setIsModalOpen(false);
    setEditUnit(null);
    setFormData({ name: "", location: "", remarks: "" });
  };

  const handleEdit = (unit) => {
    setEditUnit(unit);
    setFormData({ name: unit.name, location: unit.location || "", remarks: unit.remarks || "" });
    setIsModalOpen(true);
  };

  const handleDelete = async (id) => {
    if (confirm("Delete this unit? This cannot be undone.")) {
      await deleteUnit(id);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-8 py-10 animate-fade-in">
      <div className="flex justify-between items-end mb-8 border-b border-border pb-6">
        <div>
          <h1 className="text-3xl font-bold text-text-primary mb-2">Unit Registry</h1>
          <p className="text-sm text-text-secondary">
            Manage workshop units and divisions
          </p>
        </div>
        <button
          onClick={() => { setEditUnit(null); setFormData({ name: "", location: "", remarks: "" }); setIsModalOpen(true); }}
          className="notion-button-primary"
        >
          <Plus size={16} /> New Unit
        </button>
      </div>

      {loading ? (
        <div className="text-text-muted text-sm py-4">Loading...</div>
      ) : units.length === 0 ? (
        <EmptyState
          icon={() => (
            <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 21h18"/><path d="M5 21V7l8-4v18"/><path d="M19 21V11l-6-4"/><path d="M9 9v.01"/><path d="M9 12v.01"/><path d="M9 15v.01"/><path d="M9 18v.01"/>
            </svg>
          )}
          title="No units found"
          description="Add workshop units to categorize VEPs and organize demands."
        />
      ) : (
        <div className="notion-card overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead>
              <tr className="border-b border-border bg-bg-sidebar">
                <th className="py-2.5 px-4 font-medium text-text-muted">Unit Name</th>
                <th className="py-2.5 px-4 font-medium text-text-muted">Location</th>
                <th className="py-2.5 px-4 font-medium text-text-muted">Remarks</th>
                <th className="py-2.5 px-4 font-medium text-text-muted text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {units.map((unit) => (
                <tr
                  key={unit.id}
                  className="border-b border-border last:border-0 hover:bg-bg-card-hover transition-colors"
                >
                  <td className="py-3 px-4 font-bold text-text-primary">
                    {unit.name}
                  </td>
                  <td className="py-3 px-4 text-text-secondary">
                    {unit.location || "—"}
                  </td>
                  <td className="py-3 px-4 text-text-muted text-xs">
                    {unit.remarks || "—"}
                  </td>
                  <td className="py-3 px-4 text-right">
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => handleEdit(unit)}
                        className="text-accent hover:underline text-xs"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(unit.id)}
                        className="text-danger hover:text-red-700 text-xs px-2 py-1 rounded hover:bg-danger-bg transition-colors"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {isModalOpen && (
        <Modal title={editUnit ? "Edit Unit" : "Register New Unit"} onClose={() => { setIsModalOpen(false); setEditUnit(null); }}>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="notion-label">Unit Name <span className="text-danger">*</span></label>
              <input
                type="text"
                required
                placeholder="e.g., 102 Workshop, BEC, Base Workshop"
                className="notion-input"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>

            <div>
              <label className="notion-label">Location</label>
              <input
                type="text"
                placeholder="e.g., Station, City"
                className="notion-input"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              />
            </div>

            <div>
              <label className="notion-label">Remarks</label>
              <textarea
                className="notion-input min-h-[60px]"
                placeholder="Notes about this unit"
                value={formData.remarks}
                onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
              />
            </div>

            <div className="pt-4 flex justify-end gap-2 border-t border-border mt-4">
              <button
                type="button"
                onClick={() => { setIsModalOpen(false); setEditUnit(null); }}
                className="notion-button"
              >
                Cancel
              </button>
              <button type="submit" className="notion-button-primary">
                {editUnit ? "Save Changes" : "Save Unit"}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
