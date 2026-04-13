"use client";

import { useState } from "react";
import {
  ArrowLeft, Plus, FileText, ClipboardCheck, Scale, Shield,
  Package, Receipt, CheckCircle2, Truck, Clock, Pencil, Trash2
} from "lucide-react";
import { useIONs, useRequestedSpares, useNACs, useProcurements, useCRVs, useCIVs, useGlobalCRVs } from "@/hooks/useData";
import Modal from "@/components/ui/Modal";
import StatusBadge from "@/components/ui/StatusBadge";

// ========== Inline Edit Row ==========
function InlineEdit({ label, value, onSave, type = "text" }) {
  const [editing, setEditing] = useState(false);
  const [v, setV] = useState(value || "");
  const save = () => { onSave(v); setEditing(false); };
  if (!editing) return (
    <span className="group inline-flex items-center gap-1 cursor-pointer" onClick={() => setEditing(true)}>
      <span>{value || "—"}</span>
      <Pencil size={10} className="text-text-muted opacity-0 group-hover:opacity-100 transition-opacity" />
    </span>
  );
  return (
    <span className="inline-flex items-center gap-1">
      <input type={type} value={v} onChange={(e) => setV(e.target.value)} className="notion-input !py-0.5 !px-1 !text-xs w-28" autoFocus />
      <button onClick={save} className="text-[10px] text-accent hover:underline">Save</button>
      <button onClick={() => setEditing(false)} className="text-[10px] text-text-muted hover:underline">✕</button>
    </span>
  );
}

// ========== Section Components ==========

function TestingSection({ jobCard, onUpdate }) {
  const [testDate, setTestDate] = useState(jobCard.testDate || new Date().toISOString().split("T")[0]);
  const [recordedDate, setRecordedDate] = useState(jobCard.recordedDate || new Date().toISOString().split("T")[0]);
  const [testType, setTestType] = useState(jobCard.testType || "KPL");
  const [testResult, setTestResult] = useState(jobCard.testResult || "");
  const [testResultLph, setTestResultLph] = useState(jobCard.testResultLph || "");

  const handleComplete = async () => {
    await onUpdate(jobCard.id, {
      testDate, recordedDate, testType, testResult, testResultLph,
      status: "CLOSED",
      closedDate: new Date().toISOString().split("T")[0],
    });
  };

  return (
    <div className="notion-card p-5 space-y-4">
      <h3 className="text-sm font-semibold text-text-primary flex items-center gap-2">
        <ClipboardCheck size={16} className="text-teal" /> KPL / LPH Test Details
      </h3>
      <div className="grid grid-cols-2 gap-4 border-t border-border pt-4">
        <div>
          <label className="notion-label">Test Date</label>
          <input type="date" value={testDate} onChange={(e) => setTestDate(e.target.value)} className="notion-input" />
        </div>
        <div>
          <label className="notion-label">Current / Recorded Date</label>
          <input type="date" value={recordedDate} onChange={(e) => setRecordedDate(e.target.value)} className="notion-input" />
        </div>
      </div>
      <div className="grid grid-cols-[1fr_1fr_1fr] gap-4">
        <div>
          <label className="notion-label">Test Type</label>
          <select value={testType} onChange={(e) => setTestType(e.target.value)} className="notion-select">
            <option value="KPL">KPL (Km per Ltr)</option>
            <option value="LPH">LPH (Ltr per Hr)</option>
            <option value="BOTH">BOTH (KPL & LPH)</option>
          </select>
        </div>
        {(testType === "KPL" || testType === "BOTH") && (
          <div>
            <label className="notion-label">KPL Result</label>
            <input type="text" value={testResult} onChange={(e) => setTestResult(e.target.value)} placeholder="e.g. 4.2" className="notion-input" />
          </div>
        )}
        {(testType === "LPH" || testType === "BOTH") && (
          <div>
            <label className="notion-label">LPH Result</label>
            <input type="text" value={testResultLph} onChange={(e) => setTestResultLph(e.target.value)} placeholder="e.g. 2.1" className="notion-input" />
          </div>
        )}
      </div>
      {jobCard.status !== "CLOSED" && (
        <div className="pt-2">
          <button onClick={handleComplete} className="notion-button bg-success text-white border-success hover:bg-success/90">
            Complete Test & Close Job Card
          </button>
        </div>
      )}
    </div>
  );
}

// ========== ION Section ==========
function IONSection({ jobCard, ions, addION, updateION, deleteION, onUpdate, refetchSpares }) {
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ referenceNumber: "", dateRequested: new Date().toISOString().split("T")[0], remarks: "" });
  const [spares, setSpares] = useState([]);
  const [editId, setEditId] = useState(null);
  const [editForm, setEditForm] = useState({ spares: [] });

  const addSpareRow = () => setSpares([...spares, { spareName: "", partNumber: "", quantityRequested: 1 }]);
  const updateSpareRow = (i, field, value) => { const u = [...spares]; u[i][field] = value; setSpares(u); };
  const removeSpareRow = (i) => setSpares(spares.filter((_, idx) => idx !== i));
  
  const addEditSpareRow = () => setEditForm(f => ({ ...f, spares: [...f.spares, { spareName: "", partNumber: "", quantityRequested: 1 }] }));
  const updateEditSpareRow = (i, field, value) => setEditForm(f => { const u = [...f.spares]; u[i][field] = value; return { ...f, spares: u }; });
  const removeEditSpareRow = (i) => setEditForm(f => ({ ...f, spares: f.spares.filter((_, idx) => idx !== i) }));

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!form.referenceNumber.trim()) return;
    await addION({ ...form, spares: spares.filter((s) => s.spareName.trim()) });
    if (jobCard.status === "OPEN" || jobCard.status === "WAITING_FOR_ION") {
      await onUpdate(jobCard.id, { status: "WAITING_FOR_ION" });
    }
    setForm({ referenceNumber: "", dateRequested: new Date().toISOString().split("T")[0], remarks: "" });
    setSpares([]);
    setShowForm(false);
    if (refetchSpares) refetchSpares();
  };

  const handleEdit = (ion) => {
    setEditId(ion.id);
    setEditForm({ 
      referenceNumber: ion.referenceNumber, 
      dateRequested: ion.dateRequested, 
      remarks: ion.remarks || "",
      spares: JSON.parse(JSON.stringify(ion.requestedSpares || []))
    });
  };

  const handleEditSave = async () => {
    await updateION(editId, editForm);
    setEditId(null);
    if (refetchSpares) refetchSpares();
  };

  return (
    <div className="notion-card p-5 space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-text-primary flex items-center gap-2">
          <FileText size={16} className="text-warning" /> ION (Inter Office Notes)
        </h3>
        <button onClick={() => { setShowForm(!showForm); if (!showForm && spares.length === 0) addSpareRow(); }} className="notion-button text-warning border-warning-bg hover:bg-warning-bg">
          <Plus size={12} /> Add ION & Spares
        </button>
      </div>
      {showForm && (
        <form onSubmit={handleAdd} className="p-4 rounded-lg bg-bg-sidebar border border-border space-y-3 animate-fade-in mt-2">
          <div className="grid grid-cols-2 gap-3">
            <input type="text" value={form.referenceNumber} onChange={(e) => setForm({ ...form, referenceNumber: e.target.value })}
              placeholder="ION Reference Number *" className="notion-input" required />
            <input type="date" value={form.dateRequested} onChange={(e) => setForm({ ...form, dateRequested: e.target.value })} className="notion-input" required />
          </div>
          <input type="text" value={form.remarks} onChange={(e) => setForm({ ...form, remarks: e.target.value })}
            placeholder="Remarks (optional)" className="notion-input" />
          <div className="space-y-2 pt-2 border-t border-border mt-3">
            <div className="flex items-center justify-between mt-2">
              <span className="text-sm font-medium text-text-secondary">Related Spares</span>
              <button type="button" onClick={addSpareRow} className="text-xs text-accent hover:underline">+ Add Spare Item</button>
            </div>
            {spares.map((spare, i) => (
              <div key={i} className="grid grid-cols-4 gap-2 items-center">
                <input type="text" value={spare.partNumber} onChange={(e) => updateSpareRow(i, "partNumber", e.target.value)} placeholder="Part#" className="notion-input" />
                <input type="text" value={spare.spareName} onChange={(e) => updateSpareRow(i, "spareName", e.target.value)} placeholder="Spare Name" className="notion-input" required />
                <input type="number" value={spare.quantityRequested} onChange={(e) => updateSpareRow(i, "quantityRequested", parseInt(e.target.value) || 1)} min="1" className="notion-input" />
                <button type="button" onClick={() => removeSpareRow(i)} className="text-danger text-xs hover:underline">Remove</button>
              </div>
            ))}
          </div>
          <div className="flex gap-2 pt-2">
            <button type="submit" className="notion-button bg-warning text-white border-warning hover:bg-warning/90">Save ION & Spares</button>
            <button type="button" onClick={() => { setShowForm(false); setSpares([]); }} className="notion-button">Cancel</button>
          </div>
        </form>
      )}
      {ions.length > 0 ? (
        <div className="space-y-2 pt-2">
          {ions.map((ion) => (
            <div key={ion.id} className="p-3 rounded-lg border border-border bg-bg-main hover:bg-bg-sidebar transition-colors">
              {editId === ion.id ? (
                <div className="space-y-2 animate-fade-in">
                  <div className="grid grid-cols-2 gap-2">
                    <input value={editForm.referenceNumber} onChange={(e) => setEditForm({ ...editForm, referenceNumber: e.target.value })} className="notion-input !text-xs" />
                    <input type="date" value={editForm.dateRequested} onChange={(e) => setEditForm({ ...editForm, dateRequested: e.target.value })} className="notion-input !text-xs" />
                  </div>
                  <input value={editForm.remarks} onChange={(e) => setEditForm({ ...editForm, remarks: e.target.value })} placeholder="Remarks" className="notion-input !text-xs" />

                  {/* Inline Edit Spares array */}
                  <div className="space-y-2 pt-2 border-t border-border mt-2">
                    <div className="flex justify-between items-center">
                      <span className="text-[11px] font-medium text-text-secondary">Edit Spares</span>
                      <button type="button" onClick={addEditSpareRow} className="text-[10px] text-accent hover:underline">+ Add Spare</button>
                    </div>
                    {editForm.spares?.map((spare, i) => (
                      <div key={i} className="grid grid-cols-[1fr_2fr_60px_40px] gap-2 items-center">
                        <input type="text" value={spare.partNumber || ""} onChange={(e) => updateEditSpareRow(i, "partNumber", e.target.value)} placeholder="Part#" className="notion-input !text-xs !py-1" />
                        <input type="text" value={spare.spareName || ""} onChange={(e) => updateEditSpareRow(i, "spareName", e.target.value)} placeholder="Spare Name" className="notion-input !text-xs !py-1" required />
                        <input type="number" value={spare.quantityRequested || 1} onChange={(e) => updateEditSpareRow(i, "quantityRequested", parseInt(e.target.value) || 1)} min="1" className="notion-input !text-xs !py-1" />
                        <button type="button" onClick={() => removeEditSpareRow(i)} className="text-danger text-[10px] hover:underline">Del</button>
                      </div>
                    ))}
                  </div>

                  <div className="flex gap-2 pt-1">
                    <button onClick={handleEditSave} className="text-xs text-accent hover:underline">Save</button>
                    <button onClick={() => setEditId(null)} className="text-xs text-text-muted hover:underline">Cancel</button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-sm font-mono font-bold text-warning">{ion.referenceNumber}</span>
                    {ion.remarks && <p className="text-xs text-text-muted mt-0.5">{ion.remarks}</p>}
                    {ion.requestedSpares?.length > 0 && (
                      <p className="text-xs text-text-secondary mt-1 border-t border-border/50 pt-1">{ion.requestedSpares.length} Spares Included</p>
                    )}
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-text-secondary">{ion.dateRequested}</span>
                    <button onClick={() => handleEdit(ion)} className="text-text-muted hover:text-accent transition-colors"><Pencil size={12} /></button>
                    <button onClick={() => { if (confirm("Delete this ION?")) deleteION(ion.id); }} className="text-text-muted hover:text-danger transition-colors"><Trash2 size={12} /></button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <p className="text-xs text-text-muted pt-2">No IONs added yet.</p>
      )}
    </div>
  );
}

// ========== Spares & Scaling Section ==========
function SparesSection({ jobCard, spares, addSpare, updateSpare, deleteSpare, onUpdate }) {
  const [scalingModal, setScalingModal] = useState(null); // { spare, action }
  const [scalingRemarks, setScalingRemarks] = useState("");

  const now = () => new Date().toISOString().split("T")[0] + " " + new Date().toTimeString().slice(0, 5);

  const handleScaling = async () => {
    const spare = scalingModal.spare;
    const action = scalingModal.action;
    if (action === "start") {
      await updateSpare(spare.id, {
        scalingStatus: "IN_PROGRESS",
        scalingStartDate: now(),
        scalingStartRemarks: scalingRemarks,
        status: "SCALING",
      });
      if (jobCard.status !== "SCALING_IN_PROGRESS") {
        await onUpdate(jobCard.id, { status: "SCALING_IN_PROGRESS" });
      }
    } else if (action === "done") {
      await updateSpare(spare.id, {
        scalingStatus: "DONE",
        scalingDoneDate: now(),
        scalingDoneRemarks: scalingRemarks,
        status: "NAC_REQUESTED",
      });
      const allDone = spares.every((s) => s.id === spare.id || s.scalingStatus === "DONE");
      if (allDone) await onUpdate(jobCard.id, { status: "WAITING_FOR_NAC" });
    } else if (action === "already") {
      await updateSpare(spare.id, {
        scalingStatus: "DONE",
        scalingStartDate: now(),
        scalingDoneDate: now(),
        scalingStartRemarks: "Already scaled",
        scalingDoneRemarks: scalingRemarks || "Already scaled",
        status: "NAC_REQUESTED",
      });
      const allDone = spares.every((s) => s.id === spare.id || s.scalingStatus === "DONE");
      if (allDone) await onUpdate(jobCard.id, { status: "WAITING_FOR_NAC" });
    }
    setScalingModal(null);
    setScalingRemarks("");
  };

  const [extraModal, setExtraModal] = useState(false);
  const [extraForm, setExtraForm] = useState({ partNumber: "", spareName: "", quantityRequested: 1, sourceType: "UNIT_STORE", unitStoreCategory: "MAINTENANCE_DEMAND" });

  const handleExtraAdd = async (e) => {
    e.preventDefault();
    await addSpare({
      ...extraForm,
      quantityReceived: extraForm.quantityRequested,
      scalingStatus: "NOT_REQUIRED",
      status: "SPARES_ISSUED", // Book directly to issued since it's an extra spare coming from store physically
    });
    setExtraModal(false);
    setExtraForm({ partNumber: "", spareName: "", quantityRequested: 1, sourceType: "UNIT_STORE", unitStoreCategory: "MAINTENANCE_DEMAND" });
  };

  return (
    <div className="notion-card p-5 space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-text-primary flex items-center gap-2">
          <Scale size={16} className="text-accent" /> Requested Spares & Scaling
        </h3>
        <button onClick={() => setExtraModal(true)} className="notion-button text-amber-700 bg-amber-50 border-amber-200 hover:bg-amber-100">
          <Plus size={12} /> Book Extra Spares
        </button>
      </div>

      {extraModal && (
        <Modal onClose={() => setExtraModal(false)} title="Book Extra Spares (Stores)">
          <form onSubmit={handleExtraAdd} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="notion-label">Origin Source</label>
                <select value={extraForm.sourceType} onChange={(e) => setExtraForm({ ...extraForm, sourceType: e.target.value })} className="notion-select bg-gray-50 font-medium">
                  <option value="UNIT_STORE">Unit's Store</option>
                  <option value="STORE_DIVISION">Store Division</option>
                </select>
              </div>
              {extraForm.sourceType === "UNIT_STORE" && (
                <div>
                  <label className="notion-label">Store Category</label>
                  <select value={extraForm.unitStoreCategory} onChange={(e) => setExtraForm({ ...extraForm, unitStoreCategory: e.target.value })} className="notion-select bg-amber-50">
                    <option value="MAINTENANCE_DEMAND">Maintenance Demand</option>
                    <option value="FIRM_DEMAND">Firm Demand</option>
                    <option value="QUARTERLY_MAINTENANCE">Quarterly Maintenance</option>
                  </select>
                </div>
              )}
            </div>
            <div className="grid grid-cols-[1fr_2fr_1fr] gap-3">
              <div>
                <label className="notion-label">Part Number</label>
                <input type="text" value={extraForm.partNumber} onChange={(e) => setExtraForm({ ...extraForm, partNumber: e.target.value })} className="notion-input" />
              </div>
              <div>
                <label className="notion-label">Spare Name *</label>
                <input type="text" value={extraForm.spareName} onChange={(e) => setExtraForm({ ...extraForm, spareName: e.target.value })} className="notion-input" required />
              </div>
              <div>
                <label className="notion-label">Qnty</label>
                <input type="number" value={extraForm.quantityRequested} onChange={(e) => setExtraForm({ ...extraForm, quantityRequested: parseInt(e.target.value) || 1 })} className="notion-input" min="1" required />
              </div>
            </div>
            <p className="text-xs text-text-muted italic">Note: Extra spares bypass NAC/Scaling queues and are injected as issued components natively.</p>
            <div className="flex gap-2 pt-2 border-t border-border mt-3">
              <button type="submit" className="notion-button bg-amber-600 text-white border-amber-600 hover:bg-amber-700">Add Spare</button>
              <button type="button" onClick={() => setExtraModal(false)} className="notion-button">Cancel</button>
            </div>
          </form>
        </Modal>
      )}

      {/* Scaling Action Modal */}
      {scalingModal && (
        <Modal onClose={() => { setScalingModal(null); setScalingRemarks(""); }}
          title={`${scalingModal.action === "start" ? "Start Scaling" : scalingModal.action === "done" ? "Mark Scaling Done" : "Already Scaled"} — ${scalingModal.spare.spareName}`}>
          <div className="space-y-3">
            <div>
              <label className="notion-label">Date & Time</label>
              <p className="text-sm text-text-primary font-mono">{now()}</p>
            </div>
            <div>
              <label className="notion-label">Remarks / Note</label>
              <textarea value={scalingRemarks} onChange={(e) => setScalingRemarks(e.target.value)}
                placeholder="Add any notes about this scaling action..."
                className="notion-input min-h-[60px]" />
            </div>
            <div className="flex gap-2 pt-2 border-t border-border">
              <button onClick={handleScaling} className="notion-button-primary">Confirm</button>
              <button onClick={() => { setScalingModal(null); setScalingRemarks(""); }} className="notion-button">Cancel</button>
            </div>
          </div>
        </Modal>
      )}

      {spares && spares.length > 0 ? (
        <div className="overflow-x-auto pt-2">
          <table className="w-full text-xs text-left">
            <thead>
              <tr className="border-b border-border bg-bg-sidebar">
                <th className="py-2.5 px-3 font-medium text-text-muted">Part# - Spare Name</th>
                <th className="py-2.5 px-3 font-medium text-text-muted text-center">Qty</th>
                <th className="py-2.5 px-3 font-medium text-text-muted">ION</th>
                <th className="py-2.5 px-3 font-medium text-text-muted">Status / Scaling Log</th>
                <th className="py-2.5 px-3 font-medium text-text-muted text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {spares.map((s) => {
                const rowClass = s.sourceType === "STORE_DIVISION" 
                  ? "bg-blue-50/60 hover:bg-blue-100/60 border-l-4 border-l-blue-400"
                  : s.sourceType === "UNIT_STORE" 
                  ? "bg-amber-50/60 hover:bg-amber-100/60 border-l-4 border-l-amber-400"
                  : "bg-bg-main hover:bg-bg-card-hover border-l-4 border-l-transparent";

                return (
                  <tr key={s.id} className={`border-b border-border transition-colors ${rowClass}`}>
                    <td className="py-3 px-3">
                      <div className="font-mono text-[10px] text-text-muted mb-0.5">{s.partNumber || "No Part#"}</div>
                      <div className="font-medium text-text-primary">{s.spareName}</div>
                      {s.sourceType === "STORE_DIVISION" && <div className="text-[10px] font-semibold text-blue-700 tracking-wide mt-1">STORE DIVISION</div>}
                      {s.sourceType === "UNIT_STORE" && <div className="text-[10px] font-semibold text-amber-700 tracking-wide mt-1">UNIT STORE: {s.unitStoreCategory?.replace(/_/g, " ")}</div>}
                    </td>
                    <td className="py-3 px-3 text-center text-text-secondary font-medium">{s.quantityReceived}/{s.quantityRequested}</td>
                    <td className="py-3 px-3 text-text-muted font-mono">{s.ion?.referenceNumber || "—"}</td>
                    <td className="py-3 px-3">
                      <div className="flex flex-col gap-1 items-start">
                        {s.scalingStatus !== "NOT_REQUIRED" && <StatusBadge status={s.scalingStatus} />}
                        {s.scalingStartDate && (
                          <div className="text-[10px] text-text-muted">
                            Started: {s.scalingStartDate}
                            {s.scalingStartRemarks && <span className="italic ml-1">— {s.scalingStartRemarks}</span>}
                          </div>
                        )}
                        {s.scalingDoneDate && (
                          <div className="text-[10px] text-success">
                            Done: {s.scalingDoneDate}
                            {s.scalingDoneRemarks && <span className="italic ml-1">— {s.scalingDoneRemarks}</span>}
                          </div>
                        )}
                        {s.status !== "PENDING" && s.status !== "SCALING" && <StatusBadge status={s.status} />}
                      </div>
                    </td>
                    <td className="py-3 px-3 text-right">
                      <div className="flex justify-end gap-1.5 flex-wrap w-32">
                        {s.scalingStatus === "NOT_STARTED" && (
                          <>
                            <button onClick={() => setScalingModal({ spare: s, action: "already" })} className="notion-button text-success border-success-bg hover:bg-success-bg !py-1 !text-[11px] w-full justify-center">Already Scaled</button>
                            <button onClick={() => setScalingModal({ spare: s, action: "start" })} className="notion-button text-warning border-warning-bg hover:bg-warning-bg !py-1 !text-[11px] w-full justify-center">Start Scaling</button>
                          </>
                        )}
                        {s.scalingStatus === "IN_PROGRESS" && (
                          <button onClick={() => setScalingModal({ spare: s, action: "done" })} className="notion-button text-success border-success-bg hover:bg-success-bg !py-1 !text-[11px] w-full justify-center">Mark Done</button>
                        )}
                        <button onClick={() => { if (confirm(`Delete spare "${s.spareName}"?`)) deleteSpare(s.id); }}
                          className="text-text-muted hover:text-danger flex-shrink-0 transition-colors p-1"><Trash2 size={12} /></button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="text-xs text-text-muted pt-2">No spares requested. Add spares from ION.</p>
      )}
    </div>
  );
}

// ========== NAC Section (Per-Spare) ==========
function NACSection({ jobCard, spares, nacs, addNAC, updateNAC, deleteNAC, onUpdate }) {
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    requestedSpareId: "", demandNumber: "", demandDate: "",
    requestDate: new Date().toISOString().split("T")[0], remarks: ""
  });
  const [editId, setEditId] = useState(null);
  const [editForm, setEditForm] = useState({});

  // Only show spares that have completed scaling
  const scaledSpares = (spares || []).filter((s) => s.scalingStatus === "DONE");

  const handleAdd = async (e) => {
    e.preventDefault();
    await addNAC({ ...form, jobCardId: jobCard.id });
    if (jobCard.status !== "WAITING_FOR_NAC") {
      await onUpdate(jobCard.id, { status: "WAITING_FOR_NAC" });
    }
    setForm({ requestedSpareId: "", demandNumber: "", demandDate: "", requestDate: new Date().toISOString().split("T")[0], remarks: "" });
    setShowForm(false);
  };

  const handleNACReceived = async (nac, nacResult) => {
    await updateNAC(nac.id, {
      receivedDate: new Date().toISOString().split("T")[0],
      nacStatus: nacResult,
      controlNumber: editForm.controlNumber || nac.controlNumber,
      controlDate: editForm.controlDate || nac.controlDate,
    });
    // Check if all NACs for all spares are resolved
    if (nacResult === "NAC_ISSUED") {
      await onUpdate(jobCard.id, { status: "WAITING_FOR_PROCUREMENT" });
    } else {
      await onUpdate(jobCard.id, { status: "SPARES_RECEIVED" });
    }
  };

  const handleEdit = (nac) => {
    setEditId(nac.id);
    setEditForm({
      demandNumber: nac.demandNumber || "",
      demandDate: nac.demandDate || "",
      controlNumber: nac.controlNumber || "",
      controlDate: nac.controlDate || "",
      remarks: nac.remarks || "",
    });
  };

  const handleEditSave = async () => {
    await updateNAC(editId, editForm);
    setEditId(null);
  };

  return (
    <div className="notion-card p-5 space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-text-primary flex items-center gap-2">
          <Shield size={16} className="text-purple-600" /> NAC (Store Division) — Per Spare
        </h3>
        <button onClick={() => setShowForm(!showForm)} className="notion-button text-purple-700 bg-purple-50 border-purple-100 hover:bg-purple-100">
          <Plus size={12} /> Request NAC
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleAdd} className="p-4 rounded-lg bg-bg-sidebar border border-border space-y-3 animate-fade-in mt-2">
          <div>
            <label className="notion-label">Select Spare Part <span className="text-danger">*</span></label>
            {scaledSpares.length === 0 ? (
              <div className="p-3 bg-warning-bg text-warning rounded border border-warning/20 text-sm">
                No spares have completed scaling yet. Complete scaling first.
              </div>
            ) : (
              <select required value={form.requestedSpareId} onChange={(e) => setForm({ ...form, requestedSpareId: e.target.value })} className="notion-select">
                <option value="" disabled>Select a spare...</option>
                {scaledSpares.map((s) => (
                  <option key={s.id} value={s.id}>{s.partNumber ? `${s.partNumber} - ` : ""}{s.spareName}</option>
                ))}
              </select>
            )}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="notion-label">Demand Number <span className="text-danger">*</span></label>
              <input type="text" required value={form.demandNumber} onChange={(e) => setForm({ ...form, demandNumber: e.target.value })}
                placeholder="Unit demand number" className="notion-input" />
            </div>
            <div>
              <label className="notion-label">Demand Date</label>
              <input type="date" value={form.demandDate} onChange={(e) => setForm({ ...form, demandDate: e.target.value })} className="notion-input" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="notion-label">Request Date</label>
              <input type="date" value={form.requestDate} onChange={(e) => setForm({ ...form, requestDate: e.target.value })} className="notion-input" />
            </div>
            <div>
              <label className="notion-label">Remarks</label>
              <input type="text" value={form.remarks} onChange={(e) => setForm({ ...form, remarks: e.target.value })}
                placeholder="Notes" className="notion-input" />
            </div>
          </div>
          <div className="flex gap-2 pt-2">
            <button type="submit" className="notion-button bg-purple-600 text-white border-purple-600 hover:bg-purple-700" disabled={scaledSpares.length === 0}>Submit NAC Request</button>
            <button type="button" onClick={() => setShowForm(false)} className="notion-button">Cancel</button>
          </div>
        </form>
      )}

      {nacs.length > 0 ? (
        <div className="space-y-2 pt-2">
          {nacs.map((nac) => (
            <div key={nac.id} className="p-3 rounded-lg border border-border bg-bg-main hover:bg-bg-sidebar transition-colors">
              {editId === nac.id ? (
                <div className="space-y-2 animate-fade-in">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[10px] text-text-muted uppercase tracking-wider">Demand No.</label>
                      <input value={editForm.demandNumber} onChange={(e) => setEditForm({ ...editForm, demandNumber: e.target.value })} className="notion-input !text-xs" />
                    </div>
                    <div>
                      <label className="text-[10px] text-text-muted uppercase tracking-wider">Demand Date</label>
                      <input type="date" value={editForm.demandDate} onChange={(e) => setEditForm({ ...editForm, demandDate: e.target.value })} className="notion-input !text-xs" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[10px] text-text-muted uppercase tracking-wider">Control No.</label>
                      <input value={editForm.controlNumber} onChange={(e) => setEditForm({ ...editForm, controlNumber: e.target.value })} className="notion-input !text-xs" placeholder="Store control number" />
                    </div>
                    <div>
                      <label className="text-[10px] text-text-muted uppercase tracking-wider">Control Date</label>
                      <input type="date" value={editForm.controlDate} onChange={(e) => setEditForm({ ...editForm, controlDate: e.target.value })} className="notion-input !text-xs" />
                    </div>
                  </div>
                  <input value={editForm.remarks} onChange={(e) => setEditForm({ ...editForm, remarks: e.target.value })} placeholder="Remarks" className="notion-input !text-xs" />
                  <div className="flex gap-2">
                    <button onClick={handleEditSave} className="text-xs text-accent hover:underline">Save</button>
                    <button onClick={() => setEditId(null)} className="text-xs text-text-muted hover:underline">Cancel</button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-medium text-purple-700 bg-purple-50 px-2 py-0.5 rounded">
                          {nac.requestedSpare ? (nac.requestedSpare.partNumber ? nac.requestedSpare.partNumber + " - " : "") + nac.requestedSpare.spareName : "Unlinked Spare"}
                        </span>
                        <StatusBadge status={nac.nacStatus} />
                      </div>
                      {nac.demandNumber && <p className="text-xs text-text-secondary">Demand: <span className="font-mono font-medium">{nac.demandNumber}</span>{nac.demandDate ? ` (${nac.demandDate})` : ""}</p>}
                      <p className="text-xs text-text-secondary">Requested: {nac.requestDate}{nac.receivedDate ? ` → Received: ${nac.receivedDate}` : ""}</p>
                      {nac.controlNumber && <p className="text-xs text-text-secondary">Control: <span className="font-mono font-medium">{nac.controlNumber}</span>{nac.controlDate ? ` (${nac.controlDate})` : ""}</p>}
                      {nac.remarks && <p className="text-xs text-text-muted italic">{nac.remarks}</p>}
                    </div>
                    <div className="flex items-center gap-2">
                      <button onClick={() => handleEdit(nac)} className="text-text-muted hover:text-accent transition-colors"><Pencil size={12} /></button>
                      <button onClick={() => { if (confirm("Delete this NAC?")) deleteNAC(nac.id); }} className="text-text-muted hover:text-danger transition-colors"><Trash2 size={12} /></button>
                    </div>
                  </div>
                  {nac.nacStatus === "REQUESTED" && (
                    <div className="flex gap-1.5 border-t border-border pt-2 mt-2">
                      <div className="flex gap-2 items-center flex-1">
                        <input placeholder="Control No." className="notion-input !text-xs !py-1 flex-1"
                          onChange={(e) => setEditForm((f) => ({ ...f, controlNumber: e.target.value }))} />
                        <input type="date" className="notion-input !text-xs !py-1 flex-1"
                          onChange={(e) => setEditForm((f) => ({ ...f, controlDate: e.target.value }))} />
                      </div>
                      <button onClick={() => handleNACReceived(nac, "NAC_ISSUED")} className="notion-button text-purple-700 bg-purple-50 border-purple-200 !py-1 !text-[11px]">NAC Issued</button>
                      <button onClick={() => handleNACReceived(nac, "SPARES_PROVIDED_BY_STORE")} className="notion-button text-success bg-success-bg border-success/20 !py-1 !text-[11px]">Store Provided</button>
                    </div>
                  )}
                </>
              )}
            </div>
          ))}
        </div>
      ) : (
        <p className="text-xs text-text-muted pt-2">No NAC requests yet.</p>
      )}
    </div>
  );
}

// ========== Procurement Section ==========
function ProcurementSection({ procurements, addProcurement, updateProcurement, deleteProcurement, crvs = [] }) {
  const calculateProgress = (p) => {
    if (!p.amount) return null;
    const totalCRV = crvs.filter(c => c.procurementId === p.id).reduce((sum, c) => {
      const crvAmount = c.crvItems?.reduce((ac, item) => ac + (item.amount || 0), 0) || 0;
      return sum + crvAmount;
    }, 0);
    const percentage = Math.min((totalCRV / p.amount) * 100, 100).toFixed(0);
    return { totalCRV, percentage, isComplete: totalCRV >= p.amount };
  };
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ method: "MoU", supplyOrderNumber: "", vendorName: "", procurementDate: new Date().toISOString().split("T")[0], remarks: "", amount: "" });
  const [editId, setEditId] = useState(null);
  const [editForm, setEditForm] = useState({});

  const handleAdd = async (e) => {
    e.preventDefault();
    await addProcurement(form);
    setForm({ method: "MoU", supplyOrderNumber: "", vendorName: "", procurementDate: new Date().toISOString().split("T")[0], remarks: "", amount: "" });
    setShowForm(false);
  };

  const handleEdit = (p) => {
    setEditId(p.id);
    setEditForm({ method: p.method, supplyOrderNumber: p.supplyOrderNumber || "", vendorName: p.vendorName || "", procurementDate: p.procurementDate || "", remarks: p.remarks || "", amount: p.amount || "" });
  };

  const handleEditSave = async () => {
    await updateProcurement(editId, editForm);
    setEditId(null);
  };

  return (
    <div className="notion-card p-5 space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-text-primary flex items-center gap-2">
          <Package size={16} className="text-indigo-600" /> Procurement Details
        </h3>
        <button onClick={() => setShowForm(!showForm)} className="notion-button text-indigo-700 bg-indigo-50 border-indigo-100 hover:bg-indigo-100">
          <Plus size={12} /> Add Procurement
        </button>
      </div>
      {showForm && (
        <form onSubmit={handleAdd} className="p-4 rounded-lg bg-bg-sidebar border border-border space-y-3 animate-fade-in mt-2">
          <div className="grid grid-cols-3 gap-3">
            <select value={form.method} onChange={(e) => setForm({ ...form, method: e.target.value })} className="notion-select">
              <option value="MoU">SO via MoU</option>
              <option value="GeM">SO via GeM</option>
              <option value="Imprest">Imprest</option>
            </select>
            <input type="text" value={form.supplyOrderNumber} onChange={(e) => setForm({ ...form, supplyOrderNumber: e.target.value })} placeholder="SO / Order Number" className="notion-input" />
            <input type="text" value={form.vendorName} onChange={(e) => setForm({ ...form, vendorName: e.target.value })} placeholder="Vendor / Firm Name" className="notion-input" />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <input type="date" value={form.procurementDate} onChange={(e) => setForm({ ...form, procurementDate: e.target.value })} className="notion-input" />
            <input type="text" value={form.remarks} onChange={(e) => setForm({ ...form, remarks: e.target.value })} placeholder="Remarks" className="notion-input" />
            <input type="number" step="0.01" value={form.amount} onChange={(e) => setForm({ ...form, amount: parseFloat(e.target.value) || "" })} placeholder="Amount (₹)" className="notion-input" />
          </div>
          <div className="flex gap-2 pt-2">
            <button type="submit" className="notion-button bg-indigo-600 text-white border-indigo-600 hover:bg-indigo-700">Save</button>
            <button type="button" onClick={() => setShowForm(false)} className="notion-button">Cancel</button>
          </div>
        </form>
      )}
      {procurements.length > 0 ? (
        <div className="space-y-2 pt-2">
          {procurements.map((p) => (
            <div key={p.id} className="p-3 rounded-lg border border-border bg-bg-main hover:bg-bg-sidebar transition-colors">
              {editId === p.id ? (
                <div className="space-y-2 animate-fade-in">
                  <div className="grid grid-cols-3 gap-2">
                    <select value={editForm.method} onChange={(e) => setEditForm({ ...editForm, method: e.target.value })} className="notion-select !text-xs">
                      <option value="MoU">SO via MoU</option><option value="GeM">SO via GeM</option><option value="Imprest">Imprest</option>
                    </select>
                    <input value={editForm.supplyOrderNumber} onChange={(e) => setEditForm({ ...editForm, supplyOrderNumber: e.target.value })} className="notion-input !text-xs" placeholder="SO#" />
                    <input value={editForm.vendorName} onChange={(e) => setEditForm({ ...editForm, vendorName: e.target.value })} className="notion-input !text-xs" placeholder="Vendor" />
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <input type="date" value={editForm.procurementDate} onChange={(e) => setEditForm({ ...editForm, procurementDate: e.target.value })} className="notion-input !text-xs" />
                    <input value={editForm.remarks} onChange={(e) => setEditForm({ ...editForm, remarks: e.target.value })} className="notion-input !text-xs" placeholder="Remarks" />
                    <input type="number" step="0.01" value={editForm.amount} onChange={(e) => setEditForm({ ...editForm, amount: parseFloat(e.target.value) || "" })} className="notion-input !text-xs" placeholder="Amount (₹)" />
                  </div>
                  <div className="flex gap-2">
                    <button onClick={handleEditSave} className="text-xs text-accent hover:underline">Save</button>
                    <button onClick={() => setEditId(null)} className="text-xs text-text-muted hover:underline">Cancel</button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-between">
                  <div className="flex-1 max-w-sm">
                    <div className="flex items-center gap-2">
                      <StatusBadge status={p.method} />
                      <span className="text-sm font-mono text-text-primary font-medium">{p.supplyOrderNumber || "No SO#"}</span>
                      {p.amount && <span className="ml-2 px-1.5 py-0.5 bg-green-50 text-green-700 text-[10px] rounded border border-green-200">₹{p.amount}</span>}
                    </div>
                    {p.vendorName && <p className="text-xs text-text-muted mt-1">{p.vendorName}</p>}
                    {p.remarks && <p className="text-xs text-text-muted italic mt-0.5">{p.remarks}</p>}
                    
                    {(() => {
                      const progress = calculateProgress(p);
                      if (!progress) return null;
                      return (
                        <div className="mt-3 text-xs w-full max-w-xs">
                          <div className="flex justify-between text-text-muted mb-0.5 text-[10px] font-medium">
                            <span>CRV Total: <span className="text-text-primary">₹{progress.totalCRV.toFixed(2)}</span></span>
                            <span className={progress.isComplete ? "text-success" : ""}>{progress.percentage}%</span>
                          </div>
                          <div className="w-full h-1.5 bg-border/80 rounded-full overflow-hidden flex">
                            <div className={`h-full transition-all duration-500 ${progress.isComplete ? 'bg-success' : 'bg-accent'}`} style={{ width: `${progress.percentage}%` }} />
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-text-secondary">{p.procurementDate}</span>
                    <button onClick={() => handleEdit(p)} className="text-text-muted hover:text-accent transition-colors"><Pencil size={12} /></button>
                    <button onClick={() => { if (confirm("Delete this procurement?")) deleteProcurement(p.id); }} className="text-text-muted hover:text-danger transition-colors"><Trash2 size={12} /></button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <p className="text-xs text-text-muted pt-2">No procurement details recorded.</p>
      )}
    </div>
  );
}

// ========== CRV Section ==========
function CRVSection({ jobCard, crvs, addCRV, updateCRV, deleteCRV, procurements, spares, onUpdate, globalCRVs, updateGlobalCRV }) {
  const [showForm, setShowForm] = useState(false);
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [form, setForm] = useState({ voucherType: "CRV", voucherNumber: "", brimsVoucherNumber: "", vendorOrUnitName: "", receiptDate: new Date().toISOString().split("T")[0], procurementId: "", remarks: "" });
  const [items, setItems] = useState([]);
  const [editId, setEditId] = useState(null);
  const [editForm, setEditForm] = useState({});

  const addItem = () => setItems([...items, { spareName: "", partNumber: "", quantityReceived: 1, rate: 0, gst: 0, amount: 0, requestedSpareId: null }]);
  const removeItem = (i) => setItems(items.filter((_, idx) => idx !== i));
  const updateItem = (i, field, value) => { 
    const u = [...items]; 
    u[i][field] = value; 
    if (field === "rate" || field === "gst" || field === "quantityReceived") {
      const r = parseFloat(u[i].rate) || 0;
      const g = parseFloat(u[i].gst) || 0;
      const q = parseInt(u[i].quantityReceived) || 1;
      u[i].amount = Number(((r * q) + ((r * q) * g / 100)).toFixed(2));
    }
    setItems(u); 
  };

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!form.voucherNumber.trim()) return;
    await addCRV(form, items.filter((it) => it.spareName.trim()));
    await onUpdate(jobCard.id, { status: "SPARES_RECEIVED" });
    setForm({ voucherType: "CRV", voucherNumber: "", brimsVoucherNumber: "", vendorOrUnitName: "", receiptDate: new Date().toISOString().split("T")[0], procurementId: "", remarks: "" });
    setItems([]);
    setShowForm(false);
  };

  const handleEdit = (crv) => {
    setEditId(crv.id);
    setEditForm({ voucherType: crv.voucherType, voucherNumber: crv.voucherNumber, brimsVoucherNumber: crv.brimsVoucherNumber || "", vendorOrUnitName: crv.vendorOrUnitName || "", receiptDate: crv.receiptDate, remarks: crv.remarks || "" });
  };

  const handleEditSave = async () => {
    await updateCRV(editId, editForm);
    setEditId(null);
  };

  const standaloneCRVs = globalCRVs?.filter(c => !c.jobCardId) || [];

  return (
    <div className="notion-card p-5 space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-text-primary flex items-center gap-2">
          <Receipt size={16} className="text-teal-600" /> CRV / RV (Receipt Vouchers)
        </h3>
        <div className="flex gap-2">
          <button onClick={() => setShowLinkModal(true)} className="notion-button text-blue-700 bg-blue-50 border-blue-100 hover:bg-blue-100">
            <Plus size={12} /> Link Existing CRV
          </button>
          <button onClick={() => { setShowForm(!showForm); if (!showForm && items.length === 0) addItem(); }} className="notion-button text-teal-700 bg-teal-50 border-teal-100 hover:bg-teal-100">
            <Plus size={12} /> Create CRV / RV
          </button>
        </div>
      </div>
      
      {showLinkModal && (
        <Modal onClose={() => setShowLinkModal(false)} title="Link Global CRV">
          <div className="space-y-4">
            <p className="text-sm text-text-secondary">Select an existing floating CRV/RV to link to this Job Card.</p>
            {standaloneCRVs.length === 0 ? (
              <div className="p-4 rounded border border-dashed border-border text-center text-text-muted text-sm">
                No floating CRVs available globally. Create one directly or via the Global Ledger.
              </div>
            ) : (
              <div className="max-h-64 overflow-y-auto space-y-2 pr-1 hide-scrollbar">
                {standaloneCRVs.map(c => (
                  <div key={c.id} className="p-3 border border-border rounded-lg flex items-center justify-between hover:bg-bg-sidebar transition-colors">
                    <div>
                      <div className="flex items-center gap-2">
                        <StatusBadge status={c.voucherType} />
                        <span className="font-mono font-bold text-sm">{c.voucherNumber}</span>
                      </div>
                      <div className="text-xs text-text-secondary mt-1">{c.receiptDate} | From: {c.vendorOrUnitName || "Unknown"}</div>
                    </div>
                    <button 
                      onClick={async () => {
                        await updateGlobalCRV(c.id, { jobCardId: jobCard.id });
                        // force local refresh
                        await onUpdate(jobCard.id, { status: "SPARES_RECEIVED" });
                        setShowLinkModal(false);
                      }}
                      className="notion-button-primary !py-1 !px-2 text-xs"
                    >
                      Link
                    </button>
                  </div>
                ))}
              </div>
            )}
            <div className="flex justify-end pt-2 border-t border-border mt-2">
              <button onClick={() => setShowLinkModal(false)} className="notion-button">Close</button>
            </div>
          </div>
        </Modal>
      )}
      {showForm && (
        <form onSubmit={handleAdd} className="p-4 rounded-lg bg-bg-sidebar border border-border space-y-3 animate-fade-in mt-2">
          <div className="grid grid-cols-2 gap-3 mb-3">
            <select value={form.voucherType} onChange={(e) => setForm({ ...form, voucherType: e.target.value })} className="notion-select">
              <option value="CRV">CRV</option>
              <option value="RV">RV (Receive Voucher)</option>
            </select>
            <input type="text" value={form.vendorOrUnitName} onChange={(e) => setForm({ ...form, vendorOrUnitName: e.target.value })} placeholder="Vendor / Unit Name" className="notion-input" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <input type="text" value={form.voucherNumber} onChange={(e) => setForm({ ...form, voucherNumber: e.target.value })} placeholder="CRV / Voucher Number *" className="notion-input" required />
            <input type="text" value={form.brimsVoucherNumber} onChange={(e) => setForm({ ...form, brimsVoucherNumber: e.target.value })} placeholder="BRIMS CRV / Voucher Number" className="notion-input" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <input type="date" value={form.receiptDate} onChange={(e) => setForm({ ...form, receiptDate: e.target.value })} className="notion-input" />
            <select value={form.procurementId} onChange={(e) => setForm({ ...form, procurementId: e.target.value })} className="notion-select">
              <option value="">Link Procurement (optional)</option>
              {procurements.map((p) => <option key={p.id} value={p.id}>{p.method} — {p.supplyOrderNumber || "No SO#"}</option>)}
            </select>
          </div>
          <div className="space-y-2 pt-2 border-t border-border mt-3">
            <div className="flex items-center justify-between mt-2">
              <span className="text-sm font-medium text-text-secondary">Line Items (select from ION spares)</span>
              <button type="button" onClick={addItem} className="text-xs text-accent hover:underline">+ Add Item</button>
            </div>
            {items.map((item, i) => (
              <div key={i} className="grid grid-cols-[2fr_1fr_1fr_1fr_1.5fr_60px] gap-2 items-center">
                <select value={item.requestedSpareId || ""} onChange={(e) => {
                  const sel = spares.find(s => s.id === e.target.value);
                  if (sel) { updateItem(i, "requestedSpareId", sel.id); updateItem(i, "spareName", sel.spareName); updateItem(i, "partNumber", sel.partNumber || ""); }
                }} className="notion-select !text-xs">
                  <option value="">Select spare...</option>
                  {spares.map((s) => <option key={s.id} value={s.id}>{s.partNumber ? `${s.partNumber} - ` : ""}{s.spareName}</option>)}
                </select>
                <input type="number" value={item.quantityReceived} onChange={(e) => updateItem(i, "quantityReceived", parseInt(e.target.value) || 1)} min="1" className="notion-input !text-xs" title="Qty" />
                <input type="number" step="0.01" value={item.rate || ""} onChange={(e) => updateItem(i, "rate", parseFloat(e.target.value) || 0)} placeholder="Rate" className="notion-input !text-xs" />
                <input type="number" step="0.01" value={item.gst || ""} onChange={(e) => updateItem(i, "gst", parseFloat(e.target.value) || 0)} placeholder="GST(%)" className="notion-input !text-xs" />
                <input type="number" step="0.01" value={item.amount || ""} onChange={(e) => updateItem(i, "amount", parseFloat(e.target.value) || 0)} placeholder="Amount" className="notion-input !text-xs" />
                <button type="button" onClick={() => removeItem(i)} className="text-danger text-[10px] hover:underline">Remove</button>
              </div>
            ))}
          </div>
          <div className="flex gap-2 pt-3">
            <button type="submit" className="notion-button bg-teal-600 text-white border-teal-600 hover:bg-teal-700">Save CRV/RV</button>
            <button type="button" onClick={() => { setShowForm(false); setItems([]); }} className="notion-button">Cancel</button>
          </div>
        </form>
      )}
      {crvs.length > 0 ? (
        <div className="space-y-3 pt-2">
          {crvs.map((crv) => (
            <div key={crv.id} className="p-4 rounded-lg border border-border bg-bg-main hover:bg-bg-sidebar transition-colors">
              {editId === crv.id ? (
                <div className="space-y-2 animate-fade-in">
                  <div className="grid grid-cols-2 gap-2 mb-2">
                    <select value={editForm.voucherType} onChange={(e) => setEditForm({ ...editForm, voucherType: e.target.value })} className="notion-select !text-xs">
                      <option value="CRV">CRV</option><option value="RV">RV</option>
                    </select>
                    <input value={editForm.vendorOrUnitName} onChange={(e) => setEditForm({ ...editForm, vendorOrUnitName: e.target.value })} className="notion-input !text-xs" placeholder="Vendor / Unit" />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <input value={editForm.voucherNumber} onChange={(e) => setEditForm({ ...editForm, voucherNumber: e.target.value })} className="notion-input !text-xs" placeholder="Voucher No." />
                    <input value={editForm.brimsVoucherNumber} onChange={(e) => setEditForm({ ...editForm, brimsVoucherNumber: e.target.value })} className="notion-input !text-xs" placeholder="BRIMS Voucher No." />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <input type="date" value={editForm.receiptDate} onChange={(e) => setEditForm({ ...editForm, receiptDate: e.target.value })} className="notion-input !text-xs" />
                    <input value={editForm.remarks} onChange={(e) => setEditForm({ ...editForm, remarks: e.target.value })} className="notion-input !text-xs" placeholder="Remarks" />
                  </div>
                  <div className="flex gap-2">
                    <button onClick={handleEditSave} className="text-xs text-accent hover:underline">Save</button>
                    <button onClick={() => setEditId(null)} className="text-xs text-text-muted hover:underline">Cancel</button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex items-center justify-between pb-2 mb-2 border-b border-border/50">
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-2">
                        <StatusBadge status={crv.voucherType} />
                        <span className="text-sm font-mono font-bold text-text-primary">{crv.voucherNumber}</span>
                      </div>
                      {crv.brimsVoucherNumber && <div className="text-xs text-text-secondary">BRIMS Voucher: <span className="font-mono text-text-primary font-medium">{crv.brimsVoucherNumber}</span></div>}
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-text-secondary">{crv.receiptDate}</span>
                      <button onClick={() => handleEdit(crv)} className="text-text-muted hover:text-accent transition-colors"><Pencil size={12} /></button>
                      <button onClick={() => { if (confirm("Delete this CRV/RV?")) deleteCRV(crv.id); }} className="text-text-muted hover:text-danger transition-colors"><Trash2 size={12} /></button>
                    </div>
                  </div>
                  <div className="text-xs text-text-secondary space-y-1">
                    {crv.vendorOrUnitName && <p>From: <span className="font-medium text-text-primary">{crv.vendorOrUnitName}</span></p>}
                    {crv.procurement && <p>Procurement: <span className="font-mono bg-border px-1 py-0.5 rounded text-text-primary">{crv.procurement.method} — {crv.procurement.supplyOrderNumber || "N/A"}</span></p>}
                    {crv.remarks && <p className="italic">{crv.remarks}</p>}
                  </div>
                </>
              )}
              {crv.crvItems?.length > 0 && editId !== crv.id && (
                <div className="mt-3 bg-bg-card border border-border rounded overflow-hidden">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-bg-sidebar">
                      <tr>
                        <th className="py-1.5 px-3 font-medium text-text-muted border-b border-border">Part #</th>
                        <th className="py-1.5 px-3 font-medium text-text-muted border-b border-border">Spare Name</th>
                        <th className="py-1.5 px-3 font-medium text-text-muted border-b border-border text-center">Qty</th>
                        <th className="py-1.5 px-3 font-medium text-text-muted border-b border-border text-right">Rate</th>
                        <th className="py-1.5 px-3 font-medium text-text-muted border-b border-border text-right">GST</th>
                        <th className="py-1.5 px-3 font-medium text-text-muted border-b border-border text-right">Amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      {crv.crvItems.map((item) => (
                        <tr key={item.id} className="border-b border-border/40 last:border-0">
                          <td className="py-1.5 px-3 font-mono text-text-muted">{item.partNumber || "—"}</td>
                          <td className="py-1.5 px-3 text-text-secondary">{item.spareName}</td>
                          <td className="py-1.5 px-3 text-center text-text-primary font-medium">{item.quantityReceived}</td>
                          <td className="py-1.5 px-3 text-right text-text-primary">₹{(item.rate || 0).toFixed(2)}</td>
                          <td className="py-1.5 px-3 text-right text-text-secondary">{(item.gst || 0)}%</td>
                          <td className="py-1.5 px-3 text-right text-text-primary font-medium">₹{(item.amount || 0).toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <p className="text-xs text-text-muted pt-2">No receipt vouchers recorded.</p>
      )}
    </div>
  );
}

// ========== CIV Section ==========
function CIVSection({ jobCardId, jobCard, civs, addCIV, updateCIV, deleteCIV, onUpdate }) {
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ civNumber: "", issueDate: new Date().toISOString().split("T")[0], remarks: "" });
  const [editId, setEditId] = useState(null);
  const [editForm, setEditForm] = useState({});

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!form.civNumber.trim()) return;
    await addCIV(form);
    await onUpdate(jobCard.id, { status: "CLOSED", closedDate: new Date().toISOString().split("T")[0] });
    setForm({ civNumber: "", issueDate: new Date().toISOString().split("T")[0], remarks: "" });
    setShowForm(false);
  };

  const handleEdit = (civ) => {
    setEditId(civ.id);
    setEditForm({ civNumber: civ.civNumber, issueDate: civ.issueDate, remarks: civ.remarks || "" });
  };

  const handleEditSave = async () => {
    await updateCIV(editId, editForm);
    setEditId(null);
  };

  return (
    <div className="notion-card p-5 space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-text-primary flex items-center gap-2">
          <CheckCircle2 size={16} className="text-success" /> CIV (Issue Voucher) & Closure
        </h3>
        {jobCard.status !== "CLOSED" && (
          <button onClick={() => setShowForm(!showForm)} className="notion-button text-success bg-success-bg border-success/20 hover:bg-success/20">
            <Plus size={12} /> Create CIV & Close
          </button>
        )}
      </div>
      {showForm && (
        <form onSubmit={handleAdd} className="p-4 rounded-lg bg-bg-sidebar border border-border space-y-3 animate-fade-in mt-2">
          <div className="grid grid-cols-2 gap-3">
            <input type="text" value={form.civNumber} onChange={(e) => setForm({ ...form, civNumber: e.target.value })} placeholder="CIV Number *" className="notion-input" required />
            <input type="date" value={form.issueDate} onChange={(e) => setForm({ ...form, issueDate: e.target.value })} className="notion-input" />
          </div>
          <input type="text" value={form.remarks} onChange={(e) => setForm({ ...form, remarks: e.target.value })} placeholder="Remarks" className="notion-input" />
          <div className="flex gap-2 pt-2">
            <button type="submit" className="notion-button bg-success text-white border-success hover:bg-success/90">Create CIV & Close Job Card</button>
            <button type="button" onClick={() => setShowForm(false)} className="notion-button">Cancel</button>
          </div>
        </form>
      )}
      {civs.length > 0 ? (
        <div className="space-y-2 pt-2">
          {civs.map((civ) => (
            <div key={civ.id} className="p-3 rounded-lg border border-border bg-bg-main">
              {editId === civ.id ? (
                <div className="space-y-2 animate-fade-in">
                  <div className="grid grid-cols-2 gap-2">
                    <input value={editForm.civNumber} onChange={(e) => setEditForm({ ...editForm, civNumber: e.target.value })} className="notion-input !text-xs" />
                    <input type="date" value={editForm.issueDate} onChange={(e) => setEditForm({ ...editForm, issueDate: e.target.value })} className="notion-input !text-xs" />
                  </div>
                  <input value={editForm.remarks} onChange={(e) => setEditForm({ ...editForm, remarks: e.target.value })} placeholder="Remarks" className="notion-input !text-xs" />
                  <div className="flex gap-2">
                    <button onClick={handleEditSave} className="text-xs text-accent hover:underline">Save</button>
                    <button onClick={() => setEditId(null)} className="text-xs text-text-muted hover:underline">Cancel</button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-sm font-mono font-bold text-success">{civ.civNumber}</span>
                    {civ.remarks && <p className="text-xs text-text-muted mt-0.5 italic">{civ.remarks}</p>}
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-text-secondary">{civ.issueDate}</span>
                    <button onClick={() => handleEdit(civ)} className="text-text-muted hover:text-accent transition-colors"><Pencil size={12} /></button>
                    <button onClick={() => { if (confirm("Delete this CIV?")) deleteCIV(civ.id); }} className="text-text-muted hover:text-danger transition-colors"><Trash2 size={12} /></button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <p className="text-xs text-text-muted pt-2">No CIV created yet.</p>
      )}
    </div>
  );
}

// ========== Main Detail Component ==========

export default function JobCardDetail({ jobCard, onBack, onUpdate }) {
  const wo = jobCard.workOrder;
  const vep = wo?.vep;
  const isTest = wo?.workType === "KPL_LPH_TEST";

  // ---- Lifted hooks: single source of truth for all sections ----
  const { ions, addION, updateION, deleteION } = useIONs(jobCard.id);
  const { spares, refetch: refetchSpares, addSpare, updateSpare, deleteSpare } = useRequestedSpares(jobCard.id);
  const { nacs, addNAC, updateNAC, deleteNAC } = useNACs(jobCard.id);
  const { procurements, addProcurement, updateProcurement, deleteProcurement } = useProcurements(jobCard.id);
  const { crvs, addCRV, updateCRV, deleteCRV } = useCRVs(jobCard.id);
  const { civs, addCIV, updateCIV, deleteCIV } = useCIVs(jobCard.id);
  const { crvs: globalCRVs, updateCRV: updateGlobalCRV } = useGlobalCRVs();

  // Status step indicator
  const STEPS = isTest
    ? ["TESTING", "CLOSED"]
    : ["OPEN", "WAITING_FOR_ION", "SCALING_IN_PROGRESS", "WAITING_FOR_NAC", "WAITING_FOR_PROCUREMENT", "SPARES_RECEIVED", "SPARES_ISSUED", "CLOSED"];
  const currentStep = STEPS.indexOf(jobCard.status);

  const handleIssueSpares = async () => {
    await onUpdate(jobCard.id, { status: "SPARES_ISSUED" });
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-20 animate-fade-in">
      {/* Back button + Header */}
      <div className="flex items-start gap-4 mb-8">
        <button onClick={onBack} className="p-1.5 mt-1 rounded hover:bg-border text-text-muted hover:text-text-primary transition-colors cursor-pointer">
          <ArrowLeft size={20} />
        </button>
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-3xl font-bold text-text-primary">{jobCard.jobCardNumber}</h1>
            <StatusBadge status={jobCard.status} />
          </div>
          <div className="flex items-center flex-wrap gap-x-4 gap-y-2 text-sm text-text-secondary border-b border-border pb-4">
            <div>WO: <span className="font-mono font-medium text-text-primary">{wo?.workOrderNumber || "N/A"}</span></div>
            <div>VEP: <span className="font-mono font-medium text-text-primary">{vep?.registrationNumber || "N/A"}</span></div>
            <div>Opened: <span className="font-medium text-text-primary">{jobCard.openedDate}</span></div>
            {jobCard.closedDate && <div>Closed: <span className="font-medium text-text-primary">{jobCard.closedDate}</span></div>}
          </div>
        </div>
      </div>

      {/* Progress bar */}
      <div className="notion-card p-4 overflow-hidden">
        <div className="flex items-center gap-1 overflow-x-auto pb-1 hide-scrollbar">
          {STEPS.map((step, i) => (
            <div key={step} className="flex items-center">
              <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium whitespace-nowrap transition-colors ${
                i < currentStep
                  ? "bg-success-bg text-success"
                  : i === currentStep
                  ? "bg-text-primary text-white shadow-sm"
                  : "bg-bg-sidebar text-text-muted border border-border"
              }`}>
                {i < currentStep ? <CheckCircle2 size={14} /> : <Clock size={14} />}
                {step.replace(/_/g, " ").toLowerCase().replace(/^\w/, c => c.toUpperCase())}
              </div>
              {i < STEPS.length - 1 && (
                <div className={`w-8 h-px mx-1 ${i < currentStep ? "bg-success" : "bg-border"}`} />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Conditional Sections */}
      {isTest ? (
        <TestingSection jobCard={jobCard} onUpdate={onUpdate} />
      ) : (
        <div className="space-y-6">
          <IONSection jobCard={jobCard} ions={ions} addION={addION} updateION={updateION} deleteION={deleteION} onUpdate={onUpdate} refetchSpares={refetchSpares} />
          <SparesSection jobCard={jobCard} spares={spares} addSpare={addSpare} updateSpare={updateSpare} deleteSpare={deleteSpare} onUpdate={onUpdate} />
          <NACSection jobCard={jobCard} spares={spares} nacs={nacs} addNAC={addNAC} updateNAC={updateNAC} deleteNAC={deleteNAC} onUpdate={onUpdate} />
          <ProcurementSection procurements={procurements} addProcurement={addProcurement} updateProcurement={updateProcurement} deleteProcurement={deleteProcurement} crvs={crvs} />
          <CRVSection jobCard={jobCard} crvs={crvs} addCRV={addCRV} updateCRV={updateCRV} deleteCRV={deleteCRV} procurements={procurements} 
            spares={spares.filter((s) => !nacs.some((n) => n.requestedSpareId === s.id && n.nacStatus === "SPARES_PROVIDED_BY_STORE"))} 
            onUpdate={onUpdate} globalCRVs={globalCRVs} updateGlobalCRV={updateGlobalCRV} />

          {/* Issue Spares action */}
          {jobCard.status === "SPARES_RECEIVED" && (
            <div className="notion-card p-6 flex flex-col items-center justify-center text-center bg-bg-sidebar border-dashed border-2">
              <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-sm border border-border mb-3">
                <Truck size={20} className="text-accent" />
              </div>
              <h3 className="font-medium text-text-primary mb-1">Spares Ready for Issuance</h3>
              <p className="text-sm text-text-secondary mb-4">All requested spares have been received via CRV/RV.</p>
              <button onClick={handleIssueSpares} className="notion-button-primary">
                Issue Spares to Job Card
              </button>
            </div>
          )}

          <CIVSection jobCardId={jobCard.id} jobCard={jobCard} civs={civs} addCIV={addCIV} updateCIV={updateCIV} deleteCIV={deleteCIV} onUpdate={onUpdate} />
        </div>
      )}
    </div>
  );
}
