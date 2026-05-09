"use client";

import { useState, useEffect, useRef } from "react";
import {
  ArrowLeft, Plus, FileText, ClipboardCheck, Scale, Shield,
  Package, Receipt, CheckCircle2, Truck, Clock, Pencil, Trash2, Link as LinkIcon, Link2Off, X, Upload
} from "lucide-react";
import { useIONs, useRequestedSpares, useNACs, useProcurements, useCRVs, useCIVs, useGlobalCRVs, useJobCards } from "@/hooks/useData";
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

function TestingSection({ jobCard, onUpdate, isClosed, isEditingUnlocked }) {
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

  const readOnly = isClosed && !isEditingUnlocked;

  return (
    <div className="notion-card p-5 space-y-4">
      <h3 className="text-sm font-semibold text-text-primary flex items-center gap-2">
        <ClipboardCheck size={16} className="text-teal" /> KPL / LPH Test Details
      </h3>
      <div className="grid grid-cols-2 gap-4 border-t border-border pt-4">
        <div>
          <label className="notion-label">Test Date</label>
          <input type="date" value={testDate} onChange={(e) => setTestDate(e.target.value)} className="notion-input" disabled={readOnly} />
        </div>
        <div>
          <label className="notion-label">Current / Recorded Date</label>
          <input type="date" value={recordedDate} onChange={(e) => setRecordedDate(e.target.value)} className="notion-input" disabled={readOnly} />
        </div>
      </div>
      <div className="grid grid-cols-[1fr_1fr_1fr] gap-4">
        <div>
          <label className="notion-label">Test Type</label>
          <select value={testType} onChange={(e) => setTestType(e.target.value)} className="notion-select" disabled={readOnly}>
            <option value="KPL">KPL (Km per Ltr)</option>
            <option value="LPH">LPH (Ltr per Hr)</option>
            <option value="BOTH">BOTH (KPL & LPH)</option>
          </select>
        </div>
        {(testType === "KPL" || testType === "BOTH") && (
          <div>
            <label className="notion-label">KPL Result</label>
            <input type="text" value={testResult} onChange={(e) => setTestResult(e.target.value)} placeholder="e.g. 4.2" className="notion-input" disabled={readOnly} />
          </div>
        )}
        {(testType === "LPH" || testType === "BOTH") && (
          <div>
            <label className="notion-label">LPH Result</label>
            <input type="text" value={testResultLph} onChange={(e) => setTestResultLph(e.target.value)} placeholder="e.g. 2.1" className="notion-input" disabled={readOnly} />
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
function IONSection({ jobCard, ions, addION, updateION, deleteION, onUpdate, refetchSpares, isClosed, isEditingUnlocked }) {
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ referenceNumber: "", dateRequested: new Date().toISOString().split("T")[0], remarks: "" });
  const [spares, setSpares] = useState([]);
  const [editId, setEditId] = useState(null);
  const [editForm, setEditForm] = useState({ spares: [] });

  const fileInputRef = useRef(null);

  const canEdit = !isClosed || isEditingUnlocked;

  const addSpareRow = () => setSpares([...spares, { spareName: "", partNumber: "", quantityRequested: 1, remarks: "" }]);
  const updateSpareRow = (i, field, value) => { const u = [...spares]; u[i][field] = value; setSpares(u); };
  const removeSpareRow = (i) => setSpares(spares.filter((_, idx) => idx !== i));
  
  const addEditSpareRow = () => setEditForm(f => ({ ...f, spares: [...f.spares, { spareName: "", partNumber: "", quantityRequested: 1, remarks: "" }] }));
  const updateEditSpareRow = (i, field, value) => setEditForm(f => { const u = [...f.spares]; u[i][field] = value; return { ...f, spares: u }; });
  const removeEditSpareRow = (i) => setEditForm(f => ({ ...f, spares: f.spares.filter((_, idx) => idx !== i) }));

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target.result;
      const lines = text.split(/\r?\n/).filter(l => l.trim());
      
      let startIndex = 0;
      if (lines.length > 0 && (lines[0].toLowerCase().includes("name") || lines[0].toLowerCase().includes("spare") || lines[0].toLowerCase().includes("part"))) {
        startIndex = 1;
      }

      const importedSpares = [];
      for (let i = startIndex; i < lines.length; i++) {
        // Handle basic CSV splitting (ignoring commas inside quotes)
        const cols = lines[i].match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g) || lines[i].split(",");
        const cleanCols = cols.map(c => c.trim().replace(/^"|"$/g, ''));
        
        if (cleanCols.length >= 1 && cleanCols[0]) {
          importedSpares.push({
            spareName: cleanCols[0],
            partNumber: cleanCols[1] || "",
            quantityRequested: parseInt(cleanCols[2]) || 1,
            remarks: cleanCols[3] || ""
          });
        }
      }
      if (importedSpares.length > 0) {
        setSpares([...spares, ...importedSpares]);
      }
      e.target.value = null; // Reset input
    };
    reader.readAsText(file);
  };

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
        {canEdit && (
          <button onClick={() => { setShowForm(!showForm); if (!showForm && spares.length === 0) addSpareRow(); }} className="notion-button text-warning border-warning-bg hover:bg-warning-bg">
            <Plus size={12} /> Add ION & Spares
          </button>
        )}
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
              <div className="flex gap-2 items-center">
                <input 
                  type="file" 
                  accept=".csv" 
                  ref={fileInputRef} 
                  className="hidden" 
                  onChange={handleFileUpload} 
                />
                <button type="button" onClick={() => fileInputRef.current?.click()} className="text-[11px] text-info hover:underline flex items-center gap-1 bg-info-bg px-2 py-1 rounded border border-info/20">
                  <Upload size={12} /> Import CSV
                </button>
                <button type="button" onClick={addSpareRow} className="text-[11px] text-accent hover:underline px-2 py-1 bg-accent-muted rounded border border-accent/20">+ Add Spare</button>
              </div>
            </div>
            {spares.map((spare, i) => (
              <div key={i} className="grid grid-cols-[1fr_2fr_60px_1.5fr_40px] gap-2 items-center">
                <input type="text" value={spare.partNumber} onChange={(e) => updateSpareRow(i, "partNumber", e.target.value)} placeholder="Part#" className="notion-input !text-xs" />
                <input type="text" value={spare.spareName} onChange={(e) => updateSpareRow(i, "spareName", e.target.value)} placeholder="Spare Name" className="notion-input !text-xs" required />
                <input type="number" value={spare.quantityRequested} onChange={(e) => updateSpareRow(i, "quantityRequested", parseInt(e.target.value) || 1)} min="1" className="notion-input !text-xs" />
                <input type="text" value={spare.remarks || ""} onChange={(e) => updateSpareRow(i, "remarks", e.target.value)} placeholder="Remarks" className="notion-input !text-xs" />
                <button type="button" onClick={() => removeSpareRow(i)} className="text-danger text-[10px] hover:underline">Del</button>
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

                  <div className="space-y-2 pt-2 border-t border-border mt-2">
                    <div className="flex justify-between items-center">
                      <span className="text-[11px] font-medium text-text-secondary">Edit Spares</span>
                      <button type="button" onClick={addEditSpareRow} className="text-[10px] text-accent hover:underline">+ Add Spare</button>
                    </div>
                    {editForm.spares?.map((spare, i) => (
                      <div key={i} className="grid grid-cols-[1fr_2fr_60px_1.5fr_40px] gap-2 items-center">
                        <input type="text" value={spare.partNumber || ""} onChange={(e) => updateEditSpareRow(i, "partNumber", e.target.value)} placeholder="Part#" className="notion-input !text-xs !py-1" />
                        <input type="text" value={spare.spareName || ""} onChange={(e) => updateEditSpareRow(i, "spareName", e.target.value)} placeholder="Spare Name" className="notion-input !text-xs !py-1" required />
                        <input type="number" value={spare.quantityRequested || 1} onChange={(e) => updateEditSpareRow(i, "quantityRequested", parseInt(e.target.value) || 1)} min="1" className="notion-input !text-xs !py-1" />
                        <input type="text" value={spare.remarks || ""} onChange={(e) => updateEditSpareRow(i, "remarks", e.target.value)} placeholder="Remarks" className="notion-input !text-xs !py-1" />
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
                <div className="flex items-start justify-between">
                  <div className="w-full">
                    <div className="flex items-center justify-between mb-1">
                      <div>
                        <span className="text-sm font-mono font-bold text-warning">{ion.referenceNumber}</span>
                        {ion.remarks && <p className="text-xs text-text-muted mt-0.5">{ion.remarks}</p>}
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-xs text-text-secondary">{ion.dateRequested}</span>
                        {canEdit && (
                          <>
                            <button onClick={() => handleEdit(ion)} className="text-text-muted hover:text-accent transition-colors"><Pencil size={12} /></button>
                            <button onClick={() => { if (confirm("Delete this ION?")) deleteION(ion.id); }} className="text-text-muted hover:text-danger transition-colors"><Trash2 size={12} /></button>
                          </>
                        )}
                      </div>
                    </div>
                    {ion.requestedSpares?.length > 0 && (
                      <div className="mt-2 pt-2 border-t border-border/50">
                        <p className="text-[11px] font-medium text-text-secondary mb-1">Spares Requested ({ion.requestedSpares.length}):</p>
                        <div className="grid grid-cols-1 gap-y-1 bg-bg-card p-2 rounded border border-border">
                          {ion.requestedSpares.map((s, idx) => (
                            <div key={idx} className="text-[11px] flex justify-between items-center py-0.5 border-b border-border/30 last:border-0">
                              <span className="text-text-primary flex-1 truncate pr-2">
                                {s.partNumber ? <span className="font-mono text-text-muted mr-1">{s.partNumber}</span> : null}
                                {s.spareName}
                              </span>
                              {s.remarks && <span className="text-text-muted italic flex-1 truncate pr-2" title={s.remarks}>{s.remarks}</span>}
                              <span className="font-medium text-text-secondary whitespace-nowrap text-right w-12">x {s.quantityRequested}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
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
function SparesSection({ jobCard, spares, addSpare, updateSpare, deleteSpare, onUpdate, isClosed, isEditingUnlocked }) {
  const [scalingModal, setScalingModal] = useState(null);
  const [scalingRemarks, setScalingRemarks] = useState("");
  const [scalingDate, setScalingDate] = useState("");

  const canEdit = !isClosed || isEditingUnlocked;

  const handleScaling = async () => {
    const spare = scalingModal.spare;
    const action = scalingModal.action;
    const dateStr = scalingDate || (new Date().toISOString().split("T")[0] + " " + new Date().toTimeString().slice(0, 5));

    if (action === "start") {
      await updateSpare(spare.id, {
        scalingStatus: "IN_PROGRESS",
        scalingStartDate: dateStr,
        scalingStartRemarks: scalingRemarks,
        status: "SCALING",
      });
      if (jobCard.status !== "SCALING_IN_PROGRESS") {
        await onUpdate(jobCard.id, { status: "SCALING_IN_PROGRESS" });
      }
    } else if (action === "done") {
      await updateSpare(spare.id, {
        scalingStatus: "DONE",
        scalingDoneDate: dateStr,
        scalingDoneRemarks: scalingRemarks,
        status: "NAC_REQUESTED",
      });
      const allDone = spares.every((s) => s.id === spare.id || s.scalingStatus === "DONE");
      if (allDone) await onUpdate(jobCard.id, { status: "WAITING_FOR_NAC" });
    } else if (action === "already") {
      await updateSpare(spare.id, {
        scalingStatus: "DONE",
        scalingStartDate: dateStr,
        scalingDoneDate: dateStr,
        scalingStartRemarks: "Already scaled",
        scalingDoneRemarks: scalingRemarks || "Already scaled",
        status: "NAC_REQUESTED",
      });
      const allDone = spares.every((s) => s.id === spare.id || s.scalingStatus === "DONE");
      if (allDone) await onUpdate(jobCard.id, { status: "WAITING_FOR_NAC" });
    }
    setScalingModal(null);
    setScalingRemarks("");
    setScalingDate("");
  };

  return (
    <div className="notion-card p-5 space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-text-primary flex items-center gap-2">
          <Scale size={16} className="text-accent" /> Requested Spares & Scaling
        </h3>
      </div>

      {/* Scaling Action Modal */}
      {scalingModal && (
        <Modal onClose={() => { setScalingModal(null); setScalingRemarks(""); setScalingDate(""); }}
          title={`${scalingModal.action === "start" ? "Start Scaling" : scalingModal.action === "done" ? "Mark Scaling Done" : "Already Scaled"} — ${scalingModal.spare.spareName}`}>
          <div className="space-y-4">
            <div className="bg-bg-sidebar p-3 rounded text-sm text-text-secondary">
              <span className="font-medium text-text-primary">Part Number:</span> {scalingModal.spare.partNumber || "N/A"}<br/>
              <span className="font-medium text-text-primary">Quantity:</span> {scalingModal.spare.quantityRequested}
            </div>
            <div>
              <label className="notion-label">Date & Time</label>
              <input type="datetime-local" value={scalingDate} onChange={(e) => setScalingDate(e.target.value)} className="notion-input" />
              <p className="text-[10px] text-text-muted mt-1">Leave blank to use current time.</p>
            </div>
            <div>
              <label className="notion-label">Remarks / Note</label>
              <textarea value={scalingRemarks} onChange={(e) => setScalingRemarks(e.target.value)}
                placeholder="Add any notes about this scaling action..."
                className="notion-input min-h-[60px]" />
            </div>
            <div className="flex gap-2 pt-2 border-t border-border">
              <button onClick={handleScaling} className="notion-button-primary">Confirm</button>
              <button onClick={() => { setScalingModal(null); setScalingRemarks(""); setScalingDate(""); }} className="notion-button">Cancel</button>
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
                      <div className="flex justify-end gap-1.5 flex-wrap w-32 ml-auto">
                        {canEdit && s.scalingStatus === "NOT_STARTED" && (
                          <>
                            <button onClick={() => setScalingModal({ spare: s, action: "already" })} className="notion-button text-success border-success-bg hover:bg-success-bg !py-1 !text-[11px] w-full justify-center">Already Scaled</button>
                            <button onClick={() => setScalingModal({ spare: s, action: "start" })} className="notion-button text-warning border-warning-bg hover:bg-warning-bg !py-1 !text-[11px] w-full justify-center">Start Scaling</button>
                          </>
                        )}
                        {canEdit && s.scalingStatus === "IN_PROGRESS" && (
                          <button onClick={() => setScalingModal({ spare: s, action: "done" })} className="notion-button text-success border-success-bg hover:bg-success-bg !py-1 !text-[11px] w-full justify-center">Mark Done</button>
                        )}
                        {canEdit && (
                          <button onClick={() => { if (confirm(`Delete spare "${s.spareName}"?`)) deleteSpare(s.id); }}
                            className="text-text-muted hover:text-danger flex-shrink-0 transition-colors p-1"><Trash2 size={12} /></button>
                        )}
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
function NACSection({ jobCard, spares, nacs, addNAC, updateNAC, deleteNAC, onUpdate, isClosed, isEditingUnlocked }) {
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    requestedSpareIds: [], demandNumber: "", demandDate: "",
    requestDate: new Date().toISOString().split("T")[0], remarks: ""
  });
  const [editId, setEditId] = useState(null);
  const [editForm, setEditForm] = useState({});

  const canEdit = !isClosed || isEditingUnlocked;

  // Only show spares that have completed scaling and don't already have a NAC
  const scaledSpares = (spares || []).filter((s) => s.scalingStatus === "DONE" && !nacs.some(n => n.requestedSpareId === s.id));

  const toggleSpareSelection = (spareId) => {
    setForm(prev => {
      const isSelected = prev.requestedSpareIds.includes(spareId);
      return {
        ...prev,
        requestedSpareIds: isSelected 
          ? prev.requestedSpareIds.filter(id => id !== spareId)
          : [...prev.requestedSpareIds, spareId]
      };
    });
  };

  const selectAllSpares = () => {
    setForm(prev => ({
      ...prev,
      requestedSpareIds: scaledSpares.map(s => s.id)
    }));
  };

  const deselectAllSpares = () => {
    setForm(prev => ({
      ...prev,
      requestedSpareIds: []
    }));
  };

  const handleAdd = async (e) => {
    e.preventDefault();
    if (form.requestedSpareIds.length === 0) return;
    
    await addNAC({ ...form, jobCardId: jobCard.id });
    
    if (jobCard.status !== "WAITING_FOR_NAC") {
      await onUpdate(jobCard.id, { status: "WAITING_FOR_NAC" });
    }
    setForm({ requestedSpareIds: [], demandNumber: "", demandDate: "", requestDate: new Date().toISOString().split("T")[0], remarks: "" });
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
    setEditForm({ demandNumber: nac.demandNumber, demandDate: nac.demandDate || "", remarks: nac.remarks || "", controlNumber: nac.controlNumber || "", controlDate: nac.controlDate || "" });
  };

  const handleEditSave = async () => {
    await updateNAC(editId, editForm);
    setEditId(null);
  };

  return (
    <div className="notion-card p-5 space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-text-primary flex items-center gap-2">
          <Shield size={16} className="text-purple-600" /> NAC (Store Division) — Bulk Action
        </h3>
        {canEdit && (
          <button onClick={() => setShowForm(!showForm)} className="notion-button text-purple-700 bg-purple-50 border-purple-100 hover:bg-purple-100">
            <Plus size={12} /> Request NAC
          </button>
        )}
      </div>

      {showForm && (
        <form onSubmit={handleAdd} className="p-4 rounded-lg bg-bg-sidebar border border-border space-y-4 animate-fade-in mt-2">
          <div>
            <div className="flex justify-between items-end mb-2">
              <label className="notion-label mb-0">Select Spares <span className="text-danger">*</span></label>
              {scaledSpares.length > 0 && (
                <div className="flex gap-2 text-[10px]">
                  <button type="button" onClick={selectAllSpares} className="text-info hover:underline">Select All</button>
                  <button type="button" onClick={deselectAllSpares} className="text-text-muted hover:underline">Clear</button>
                </div>
              )}
            </div>
            
            {scaledSpares.length === 0 ? (
              <div className="p-3 bg-warning-bg text-warning rounded border border-warning/20 text-sm">
                No eligible spares available. Spares must have scaling completed and not already have a NAC.
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-1 max-h-40 overflow-y-auto border border-border rounded p-2 bg-bg-main">
                {scaledSpares.map((s) => (
                  <label key={s.id} className="flex items-center gap-2 text-xs p-1 hover:bg-bg-sidebar rounded cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={form.requestedSpareIds.includes(s.id)}
                      onChange={() => toggleSpareSelection(s.id)}
                      className="rounded border-border text-purple-600 focus:ring-purple-500"
                    />
                    <span className="flex-1 truncate">
                      {s.partNumber ? <span className="font-mono text-text-muted mr-1">{s.partNumber}</span> : null}
                      {s.spareName}
                    </span>
                    <span className="text-text-muted font-medium w-8 text-right">x {s.quantityRequested}</span>
                  </label>
                ))}
              </div>
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
            <button type="submit" className="notion-button bg-purple-600 text-white border-purple-600 hover:bg-purple-700" disabled={form.requestedSpareIds.length === 0}>Submit NAC Request</button>
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
                        <span className="text-xs font-medium text-purple-700 bg-purple-50 px-2 py-0.5 rounded border border-purple-200">
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
                      {canEdit && (
                        <>
                          <button onClick={() => handleEdit(nac)} className="text-text-muted hover:text-accent transition-colors"><Pencil size={12} /></button>
                          <button onClick={() => { if (confirm("Delete this NAC?")) deleteNAC(nac.id); }} className="text-text-muted hover:text-danger transition-colors"><Trash2 size={12} /></button>
                        </>
                      )}
                    </div>
                  </div>
                  {nac.nacStatus === "REQUESTED" && canEdit && (
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
function ProcurementSection({ procurements, addProcurement, updateProcurement, deleteProcurement, crvs = [], nacs = [], isClosed, isEditingUnlocked }) {
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
  const [form, setForm] = useState({ method: "MoU", supplyOrderNumber: "", vendorName: "", procurementDate: new Date().toISOString().split("T")[0], remarks: "", items: [] });
  const [editId, setEditId] = useState(null);
  const [editForm, setEditForm] = useState({});

  const canEdit = !isClosed || isEditingUnlocked;

  // Available spares for procurement: those with NAC issued
  const availableSpares = nacs.filter(n => n.nacStatus === "NAC_ISSUED" && n.requestedSpare).map(n => n.requestedSpare);

  const addItemRow = () => {
    setForm(prev => ({
      ...prev,
      items: [...prev.items, { requestedSpareId: "", spareName: "", partNumber: "", quantity: 1, rate: 0, gst: 0 }]
    }));
  };

  const updateItemRow = (i, field, value) => {
    setForm(prev => {
      const newItems = [...prev.items];
      newItems[i][field] = value;
      if (field === "requestedSpareId") {
        const spare = availableSpares.find(s => s.id === value);
        if (spare) {
          newItems[i].spareName = spare.spareName;
          newItems[i].partNumber = spare.partNumber || "";
          newItems[i].quantity = spare.quantityRequested; // Pre-fill with requested qty
        }
      }
      return { ...prev, items: newItems };
    });
  };

  const removeItemRow = (i) => {
    setForm(prev => ({ ...prev, items: prev.items.filter((_, idx) => idx !== i) }));
  };

  const calculateTotalAmount = (items) => {
    return items.reduce((sum, item) => sum + ((parseFloat(item.rate) || 0) * (parseInt(item.quantity) || 1)) + ((parseFloat(item.rate) || 0) * (parseInt(item.quantity) || 1) * (parseFloat(item.gst) || 0) / 100), 0);
  };

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!form.supplyOrderNumber.trim()) return;
    
    const amount = calculateTotalAmount(form.items);
    await addProcurement({ ...form, amount, items: form.items.filter(i => i.spareName.trim()) });
    
    setForm({ method: "MoU", supplyOrderNumber: "", vendorName: "", procurementDate: new Date().toISOString().split("T")[0], remarks: "", items: [] });
    setShowForm(false);
  };

  const handleEdit = (p) => {
    setEditId(p.id);
    setEditForm({ method: p.method, supplyOrderNumber: p.supplyOrderNumber || "", vendorName: p.vendorName || "", procurementDate: p.procurementDate || "", remarks: p.remarks || "" });
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
        {canEdit && (
          <button onClick={() => { setShowForm(!showForm); if (!showForm && form.items.length === 0) addItemRow(); }} className="notion-button text-indigo-700 bg-indigo-50 border-indigo-100 hover:bg-indigo-100">
            <Plus size={12} /> Add Procurement
          </button>
        )}
      </div>
      {showForm && (
        <form onSubmit={handleAdd} className="p-4 rounded-lg bg-bg-sidebar border border-border space-y-3 animate-fade-in mt-2">
          <div className="grid grid-cols-3 gap-3">
            <select value={form.method} onChange={(e) => setForm({ ...form, method: e.target.value })} className="notion-select">
              <option value="MoU">SO via MoU</option>
              <option value="GeM">SO via GeM</option>
              <option value="Imprest">Imprest</option>
            </select>
            <input type="text" value={form.supplyOrderNumber} onChange={(e) => setForm({ ...form, supplyOrderNumber: e.target.value })} placeholder="SO / Order Number" className="notion-input" required />
            <input type="text" value={form.vendorName} onChange={(e) => setForm({ ...form, vendorName: e.target.value })} placeholder="Vendor / Firm Name" className="notion-input" required />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <input type="date" value={form.procurementDate} onChange={(e) => setForm({ ...form, procurementDate: e.target.value })} className="notion-input" required />
            <input type="text" value={form.remarks} onChange={(e) => setForm({ ...form, remarks: e.target.value })} placeholder="Remarks" className="notion-input" />
          </div>
          
          <div className="space-y-2 pt-2 border-t border-border mt-3">
            <div className="flex items-center justify-between mt-2">
              <span className="text-sm font-medium text-text-secondary">Procured Spares / Line Items</span>
              <button type="button" onClick={addItemRow} className="text-xs text-indigo-600 hover:underline">+ Add Item</button>
            </div>
            
            {form.items.map((item, i) => (
              <div key={i} className="grid grid-cols-[1.5fr_1fr_60px_80px_60px_80px_40px] gap-2 items-center bg-bg-main p-2 rounded border border-border">
                {availableSpares.length > 0 ? (
                  <select 
                    value={item.requestedSpareId} 
                    onChange={(e) => updateItemRow(i, "requestedSpareId", e.target.value)}
                    className="notion-select !text-xs !py-1"
                  >
                    <option value="">Link to NAC Spare...</option>
                    {availableSpares.map(s => (
                      <option key={s.id} value={s.id}>{s.partNumber ? s.partNumber + " - " : ""}{s.spareName}</option>
                    ))}
                  </select>
                ) : (
                  <input type="text" value={item.spareName} onChange={(e) => updateItemRow(i, "spareName", e.target.value)} placeholder="Spare Name" className="notion-input !text-xs !py-1" required />
                )}
                
                <input type="text" value={item.partNumber} onChange={(e) => updateItemRow(i, "partNumber", e.target.value)} placeholder="Part#" className="notion-input !text-xs !py-1" />
                <input type="number" value={item.quantity} onChange={(e) => updateItemRow(i, "quantity", parseInt(e.target.value) || 1)} placeholder="Qty" min="1" className="notion-input !text-xs !py-1" required />
                <input type="number" step="0.01" value={item.rate} onChange={(e) => updateItemRow(i, "rate", parseFloat(e.target.value) || 0)} placeholder="Rate ₹" className="notion-input !text-xs !py-1" required />
                <input type="number" step="0.1" value={item.gst} onChange={(e) => updateItemRow(i, "gst", parseFloat(e.target.value) || 0)} placeholder="GST %" className="notion-input !text-xs !py-1" />
                <div className="text-xs font-medium text-right text-text-secondary">
                  ₹{(((parseFloat(item.rate) || 0) * (parseInt(item.quantity) || 1)) * (1 + (parseFloat(item.gst) || 0) / 100)).toFixed(2)}
                </div>
                <button type="button" onClick={() => removeItemRow(i)} className="text-danger text-[10px] hover:underline text-right w-full">Del</button>
              </div>
            ))}
            
            <div className="flex justify-end pt-2 text-sm">
              <span className="font-medium text-text-secondary mr-2">Total Estimated Amount:</span>
              <span className="font-bold text-indigo-700">₹{calculateTotalAmount(form.items).toFixed(2)}</span>
            </div>
          </div>
          
          <div className="flex gap-2 pt-2 border-t border-border mt-2">
            <button type="submit" className="notion-button bg-indigo-600 text-white border-indigo-600 hover:bg-indigo-700">Save Procurement</button>
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
                  <div className="grid grid-cols-2 gap-2">
                    <input type="date" value={editForm.procurementDate} onChange={(e) => setEditForm({ ...editForm, procurementDate: e.target.value })} className="notion-input !text-xs" />
                    <input value={editForm.remarks} onChange={(e) => setEditForm({ ...editForm, remarks: e.target.value })} className="notion-input !text-xs" placeholder="Remarks" />
                  </div>
                  <div className="flex gap-2">
                    <button onClick={handleEditSave} className="text-xs text-accent hover:underline">Save Details</button>
                    <button onClick={() => setEditId(null)} className="text-xs text-text-muted hover:underline">Cancel</button>
                  </div>
                </div>
              ) : (
                <div className="flex items-start justify-between">
                  <div className="flex-1 max-w-lg">
                    <div className="flex items-center gap-2">
                      <StatusBadge status={p.method} />
                      <span className="text-sm font-mono text-text-primary font-medium">{p.supplyOrderNumber || "No SO#"}</span>
                      {p._linkedFromJC && <span className="ml-1 px-1.5 py-0.5 bg-accent-muted text-accent text-[10px] rounded font-medium">from {p._linkedFromJC}</span>}
                    </div>
                    {p.vendorName && <p className="text-xs text-text-muted mt-1 font-medium">{p.vendorName}</p>}
                    {p.remarks && <p className="text-xs text-text-muted italic mt-0.5">{p.remarks}</p>}
                    
                    {p.items && p.items.length > 0 && (
                      <div className="mt-2 text-[11px] bg-bg-card p-2 rounded border border-border">
                        <div className="font-medium text-text-secondary mb-1">Line Items ({p.items.length}):</div>
                        {p.items.map((item, idx) => (
                          <div key={idx} className="flex justify-between items-center py-0.5 border-b border-border/30 last:border-0">
                            <span className="truncate pr-2">
                              {item.partNumber ? <span className="font-mono text-text-muted mr-1">{item.partNumber}</span> : null}
                              {item.spareName}
                            </span>
                            <span className="whitespace-nowrap text-text-muted">
                              {item.quantity} x ₹{item.rate} <span className="text-[9px]">(+{item.gst}%)</span> = <span className="font-medium text-text-primary">₹{(((item.rate || 0) * (item.quantity || 1)) * (1 + (item.gst || 0) / 100)).toFixed(2)}</span>
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                    
                    <div className="mt-2 flex items-center gap-2 text-xs">
                      <span className="font-medium text-text-secondary">Procurement Total:</span>
                      <span className="font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100">
                        ₹{(p.amount || 0).toFixed(2)}
                      </span>
                    </div>

                    {(() => {
                      const progress = calculateProgress(p);
                      if (!progress) return null;
                      return (
                        <div className="mt-3 text-xs w-full max-w-xs">
                          <div className="flex justify-between text-text-muted mb-0.5 text-[10px] font-medium">
                            <span>CRV Received: <span className="text-text-primary">₹{progress.totalCRV.toFixed(2)}</span></span>
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
                    {!p._linkedFromJC && canEdit && (
                      <>
                        <button onClick={() => handleEdit(p)} className="text-text-muted hover:text-accent transition-colors"><Pencil size={12} /></button>
                        <button onClick={() => { if (confirm("Delete this procurement?")) deleteProcurement(p.id); }} className="text-text-muted hover:text-danger transition-colors"><Trash2 size={12} /></button>
                      </>
                    )}
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
function CRVSection({ jobCard, crvs, addCRV, updateCRV, deleteCRV, procurements, spares, onUpdate, globalCRVs, updateGlobalCRV, isClosed, isEditingUnlocked }) {
  const [showForm, setShowForm] = useState(false);
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [form, setForm] = useState({ voucherType: "CRV", voucherNumber: "", brimsVoucherNumber: "", vendorOrUnitName: "", receiptDate: new Date().toISOString().split("T")[0], procurementId: "", remarks: "" });
  const [items, setItems] = useState([]);
  const [editId, setEditId] = useState(null);
  const [editForm, setEditForm] = useState({});

  const canEdit = !isClosed || isEditingUnlocked;

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
          {canEdit && (
            <>
              <button onClick={() => setShowLinkModal(true)} className="notion-button text-blue-700 bg-blue-50 border-blue-100 hover:bg-blue-100">
                <Plus size={12} /> Link Existing CRV
              </button>
              <button onClick={() => { setShowForm(!showForm); if (!showForm && items.length === 0) addItem(); }} className="notion-button text-teal-700 bg-teal-50 border-teal-100 hover:bg-teal-100">
                <Plus size={12} /> Create CRV / RV
              </button>
            </>
          )}
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
            <select value={form.procurementId} onChange={(e) => {
              const pid = e.target.value;
              setForm({ ...form, procurementId: pid });
              if (pid) {
                const proc = procurements.find(p => p.id === pid);
                if (proc && proc.items) {
                  setItems(proc.items.map(i => ({
                    requestedSpareId: i.requestedSpareId || null,
                    spareName: i.spareName,
                    partNumber: i.partNumber || "",
                    quantityReceived: i.quantity || 1,
                    rate: i.rate || 0,
                    gst: i.gst || 0,
                    amount: Number((((i.rate || 0) * (i.quantity || 1)) * (1 + (i.gst || 0) / 100)).toFixed(2))
                  })));
                }
              }
            }} className="notion-select">
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
                        {crv._linkedFromJC && <span className="px-1.5 py-0.5 bg-accent-muted text-accent text-[10px] rounded font-medium">from {crv._linkedFromJC}</span>}
                      </div>
                      {crv.brimsVoucherNumber && <div className="text-xs text-text-secondary">BRIMS Voucher: <span className="font-mono text-text-primary font-medium">{crv.brimsVoucherNumber}</span></div>}
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-text-secondary">{crv.receiptDate}</span>
                      {!crv._linkedFromJC && canEdit && (
                        <>
                          <button onClick={() => handleEdit(crv)} className="text-text-muted hover:text-accent transition-colors"><Pencil size={12} /></button>
                          <button onClick={() => { if (confirm("Delete this CRV/RV?")) deleteCRV(crv.id); }} className="text-text-muted hover:text-danger transition-colors"><Trash2 size={12} /></button>
                        </>
                      )}
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
function CIVSection({ jobCardId, jobCard, civs, addCIV, updateCIV, deleteCIV, onUpdate, linkedSpares = [], isClosed, isEditingUnlocked }) {
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ civNumber: "", issueDate: new Date().toISOString().split("T")[0], remarks: "" });
  const [editId, setEditId] = useState(null);
  const [editForm, setEditForm] = useState({});

  const canEdit = !isClosed || isEditingUnlocked;

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
        {jobCard.status !== "CLOSED" && canEdit && (
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
          {linkedSpares.length > 0 && (
            <div className="p-3 rounded border border-border bg-bg-main">
              <p className="text-xs font-medium text-text-secondary mb-2">Linked JC spares also available for issue:</p>
              <div className="space-y-1 max-h-32 overflow-y-auto">
                {linkedSpares.map((s) => (
                  <div key={s.id} className="text-xs text-text-muted flex justify-between">
                    <span>{s.partNumber ? `${s.partNumber} - ` : ""}{s.spareName}</span>
                    <span className="font-mono">{s.quantityReceived}/{s.quantityRequested}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
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
                    {canEdit && (
                      <>
                        <button onClick={() => handleEdit(civ)} className="text-text-muted hover:text-accent transition-colors"><Pencil size={12} /></button>
                        <button onClick={() => { if (confirm("Delete this CIV?")) deleteCIV(civ.id); }} className="text-text-muted hover:text-danger transition-colors"><Trash2 size={12} /></button>
                      </>
                    )}
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
  const { closeJobCard, linkJobCards, unlinkJobCards } = useJobCards();

  // ---- Linked JC state ----
  const [relatedJobCard, setRelatedJobCard] = useState(jobCard.relatedJobCard);
  const [relatedData, setRelatedData] = useState(null);
  const [linkModalOpen, setLinkModalOpen] = useState(false);
  const [closeModalOpen, setCloseModalOpen] = useState(false);
  const [closingRemark, setClosingRemark] = useState("");
  const [closingLoading, setClosingLoading] = useState(false);
  const [passwordModalOpen, setPasswordModalOpen] = useState(false);
  const [masterPassword, setMasterPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [isEditingUnlocked, setIsEditingUnlocked] = useState(false);

  useEffect(() => {
    setRelatedJobCard(jobCard.relatedJobCard);
  }, [jobCard.relatedJobCard]);

  // Fetch available JCs for linking when modal opens
  const [availableForLinking, setAvailableForLinking] = useState([]);
  const [loadingLinkOptions, setLoadingLinkOptions] = useState(false);

  useEffect(() => {
    if (linkModalOpen && wo?.vepId) {
      setLoadingLinkOptions(true);
      fetch("/api/job-cards")
        .then((r) => r.json())
        .then((jcs) => {
          const eligible = jcs.filter(
            (jc) =>
              jc.id !== jobCard.id &&
              !jc.relatedJobCardId &&
              jc.status === "CLOSED_BY_RCC" &&
              jc.workOrder?.vepId === wo.vepId
          );
          setAvailableForLinking(eligible);
          setLoadingLinkOptions(false);
        })
        .catch(() => setLoadingLinkOptions(false));
    }
  }, [linkModalOpen, jobCard.id, wo?.vepId]);

  // Fetch related JC's procurements and CRVs if linked
  const [fetchingRelated, setFetchingRelated] = useState(false);
  useEffect(() => {
    if (relatedJobCard) {
      setFetchingRelated(true);
      setRelatedData(null); // Reset before fetch
      Promise.all([
        fetch(`/api/procurements?jobCardId=${relatedJobCard.id}`).then((r) => {
          if (!r.ok) throw new Error("Failed to fetch procurements");
          return r.json();
        }),
        fetch(`/api/crvs?jobCardId=${relatedJobCard.id}`).then((r) => {
          if (!r.ok) throw new Error("Failed to fetch CRVs");
          return r.json();
        }),
        fetch(`/api/spares?jobCardId=${relatedJobCard.id}`).then((r) => {
          if (!r.ok) throw new Error("Failed to fetch spares");
          return r.json();
        }),
      ]).then(([procs, crvsData, sparesData]) => {
        setRelatedData({ procurements: procs, crvs: crvsData, spares: sparesData });
        setFetchingRelated(false);
      }).catch((err) => {
        console.error("Failed to fetch related JC data:", err);
        setFetchingRelated(false);
      });
    }
  }, [relatedJobCard]);

  // Combined spares for CIV (current JC + linked JC)
  const linkedSparesForCIV = relatedData?.spares?.filter((s) =>
    !nacs.some((n) => n.requestedSpareId === s.id && n.nacStatus === "SPARES_PROVIDED_BY_STORE")
  ) || [];

  // Combined CRVs for display
  const allCRVs = relatedData?.crvs ? [...crvs, ...relatedData.crvs.map((c) => ({ ...c, _linkedFromJC: relatedJobCard.jobCardNumber }))] : crvs;
  // Combined procurements for display
  const allProcurements = relatedData?.procurements ? [...procurements, ...relatedData.procurements.map((p) => ({ ...p, _linkedFromJC: relatedJobCard.jobCardNumber }))] : procurements;

  const handleLinkJC = async (parentJCId) => {
    const linked = await linkJobCards(jobCard.id, parentJCId);
    setRelatedJobCard(linked.relatedJobCard);
    setRelatedData(null);
    setLinkModalOpen(false);
  };

  const handleUnlinkJC = async () => {
    if (!confirm(`Remove link to ${relatedJobCard.jobCardNumber}? This cannot be undone.`)) return;
    await unlinkJobCards(jobCard.id);
    setRelatedJobCard(null);
    setRelatedData(null);
  };

  // ---- Password-protected edit unlock for closed job cards ----
  const isClosed = jobCard.status === "CLOSED" || jobCard.status === "CLOSED_BY_RCC";

  const handleEditUnlock = () => {
    if (!isClosed) return;
    if (isEditingUnlocked) return;
    setMasterPassword("");
    setPasswordError("");
    setPasswordModalOpen(true);
  };

  const handlePasswordSubmit = async () => {
    if (masterPassword !== "rishikesh.prince") {
      setPasswordError("Incorrect password");
      return;
    }
    setPasswordError("");
    setPasswordModalOpen(false);
    setIsEditingUnlocked(true);
  };

  const handleUpdateJC = (id, updates) => {
    onUpdate(id, updates);
  };

  const handleCloseJC = async () => {
    if (!closingRemark.trim()) return;
    setClosingLoading(true);
    await closeJobCard(jobCard.id, closingRemark);
    setClosingLoading(false);
    setCloseModalOpen(false);
    if (onUpdate) onUpdate(jobCard.id, { status: "CLOSED_BY_RCC", closingRemark, closedDate: new Date().toISOString().split("T")[0] });
  };

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
        <div className="flex gap-2 flex-shrink-0">
          {isClosed && !isEditingUnlocked && (
            <button
              onClick={handleEditUnlock}
              className="notion-button text-accent hover:bg-accent-muted"
            >
              <Pencil size={14} /> Edit
            </button>
          )}
          {isClosed && isEditingUnlocked && (
            <div className="flex items-center gap-1 px-2 py-1 rounded bg-green-50 text-green-700 text-xs border border-green-200">
              <Pencil size={12} /> Editing Unlocked
            </div>
          )}
          {!isClosed && (
            <>
              <button
                onClick={() => setLinkModalOpen(true)}
                className="notion-button text-accent hover:bg-accent-muted"
              >
                <LinkIcon size={14} /> Link JC
              </button>
              <button
                onClick={() => setCloseModalOpen(true)}
                className="notion-button text-warning hover:bg-warning-bg"
              >
                <X size={14} /> Close by RCC
              </button>
            </>
          )}
        </div>
      </div>

      {/* Linked JC Banner */}
      {relatedJobCard && (
        <div className="notion-card p-4 bg-info-bg border border-info/20 flex items-start gap-3">
          <LinkIcon size={18} className="text-info mt-0.5 flex-shrink-0" />
          <div className="flex-1">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-medium text-info">Linked to Previous Job Card</p>
                <p className="text-xs text-text-secondary mt-1">
                  {relatedJobCard.jobCardNumber} ({relatedJobCard.openedDate}) &mdash; Status: {relatedJobCard.status}
                  {relatedJobCard.closingRemark && <span className="block mt-1 italic text-text-muted">&ldquo;{relatedJobCard.closingRemark}&rdquo;</span>}
                </p>
              </div>
              <button
                onClick={handleUnlinkJC}
                className="flex-shrink-0 text-text-muted hover:text-danger transition-colors p-1 rounded hover:bg-danger-bg"
                title="Remove link"
              >
                <Link2Off size={16} />
              </button>
            </div>
            {fetchingRelated && <p className="text-xs text-text-muted mt-2">Loading linked data...</p>}
          </div>
        </div>
      )}

      {/* Conditional Sections */}
      {isTest ? (
        <TestingSection jobCard={jobCard} onUpdate={onUpdate} isClosed={isClosed} isEditingUnlocked={isEditingUnlocked} />
      ) : (
        <div className="space-y-6">
          <IONSection jobCard={jobCard} ions={ions} addION={addION} updateION={updateION} deleteION={deleteION} onUpdate={onUpdate} refetchSpares={refetchSpares} isClosed={isClosed} isEditingUnlocked={isEditingUnlocked} />
          <SparesSection jobCard={jobCard} spares={spares} addSpare={addSpare} updateSpare={updateSpare} deleteSpare={deleteSpare} onUpdate={onUpdate} isClosed={isClosed} isEditingUnlocked={isEditingUnlocked} />
          <NACSection jobCard={jobCard} spares={spares} nacs={nacs} addNAC={addNAC} updateNAC={updateNAC} deleteNAC={deleteNAC} onUpdate={onUpdate} isClosed={isClosed} isEditingUnlocked={isEditingUnlocked} />
          <ProcurementSection procurements={allProcurements} addProcurement={addProcurement} updateProcurement={updateProcurement} deleteProcurement={deleteProcurement} crvs={allCRVs} nacs={nacs} isClosed={isClosed} isEditingUnlocked={isEditingUnlocked} />
          <CRVSection jobCard={jobCard} crvs={allCRVs} addCRV={addCRV} updateCRV={updateCRV} deleteCRV={deleteCRV} procurements={allProcurements} 
            spares={spares.filter((s) => !nacs.some((n) => n.requestedSpareId === s.id && n.nacStatus === "SPARES_PROVIDED_BY_STORE"))} 
            onUpdate={onUpdate} globalCRVs={globalCRVs} updateGlobalCRV={updateGlobalCRV} isClosed={isClosed} isEditingUnlocked={isEditingUnlocked} />

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

          <CIVSection jobCardId={jobCard.id} jobCard={jobCard} civs={civs} addCIV={addCIV} updateCIV={updateCIV} deleteCIV={deleteCIV} onUpdate={onUpdate} linkedSpares={linkedSparesForCIV} isClosed={isClosed} isEditingUnlocked={isEditingUnlocked} />
        </div>
      )}

      {/* Link JC Modal */}
      {linkModalOpen && (
        <Modal title="Link to Previous Job Card" onClose={() => setLinkModalOpen(false)}>
          <div className="space-y-4">
            <p className="text-sm text-text-secondary">
              Link this Job Card to a previous one closed by RCC. This will show both JCs&apos; procurements and CRVs together.
            </p>
            {loadingLinkOptions ? (
              <div className="text-center py-6 text-text-muted text-sm">Loading...</div>
            ) : availableForLinking.length === 0 ? (
              <div className="p-4 rounded border border-dashed border-border text-center text-text-muted text-sm">
                No eligible previous Job Cards found for this VEP. Only &ldquo;RCC Closed&rdquo; cards without an existing link are shown.
              </div>
            ) : (
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {availableForLinking.map((jc) => (
                  <div key={jc.id} className="p-3 border border-border rounded-lg flex items-center justify-between hover:bg-bg-sidebar transition-colors">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-sm text-text-primary">{jc.jobCardNumber}</span>
                        <StatusBadge status={jc.status} />
                      </div>
                      <div className="text-xs text-text-secondary mt-1">
                        Opened: {jc.openedDate} {jc.closedDate ? ` &middot; Closed: ${jc.closedDate}` : ""}
                      </div>
                      {jc.closingRemark && <p className="text-xs text-text-muted italic mt-1">&ldquo;{jc.closingRemark}&rdquo;</p>}
                    </div>
                    <button
                      onClick={() => handleLinkJC(jc.id)}
                      className="notion-button-primary !py-1 !px-2 text-xs"
                    >
                      Link
                    </button>
                  </div>
                ))}
              </div>
            )}
            <div className="flex justify-end pt-2 border-t border-border">
              <button onClick={() => setLinkModalOpen(false)} className="notion-button">Close</button>
            </div>
          </div>
        </Modal>
      )}

      {/* Close by RCC Modal */}
      {closeModalOpen && (
        <Modal title="Close Job Card (RCC)" onClose={() => setCloseModalOpen(false)}>
          <div className="space-y-4">
            <div className="p-3 rounded-lg bg-warning-bg border border-warning/20 text-sm">
              <p className="text-warning font-medium mb-1">Job Card: {jobCard.jobCardNumber}</p>
              <p className="text-text-secondary text-xs">VEP: {vep?.registrationNumber} &middot; WO: {wo?.workOrderNumber}</p>
            </div>
            <div>
              <label className="notion-label">Closing Remark <span className="text-danger">*</span></label>
              <textarea
                className="notion-input min-h-[80px]"
                placeholder="e.g., Demand noted and Vehicle found road worthy"
                value={closingRemark}
                onChange={(e) => setClosingRemark(e.target.value)}
                autoFocus
              />
            </div>
            <p className="text-xs text-text-muted italic">This will close the job card with status &ldquo;RCC Closed&rdquo;. You can open a new Job Card later and link it to this one.</p>
            <div className="flex justify-end gap-2 pt-2 border-t border-border">
              <button onClick={() => setCloseModalOpen(false)} className="notion-button">Cancel</button>
              <button
                onClick={handleCloseJC}
                disabled={!closingRemark.trim() || closingLoading}
                className="notion-button-primary disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {closingLoading ? "Closing..." : <span className="flex items-center gap-1"><X size={14} /> Close Job Card</span>}
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Master Password Modal */}
      {passwordModalOpen && (
        <Modal title="Master Password Required" onClose={() => setPasswordModalOpen(false)}>
          <div className="space-y-4">
            <p className="text-sm text-text-secondary">
              This job card is closed. Enter the master password to unlock editing.
            </p>
            <div>
              <label className="notion-label">Master Password</label>
              <input
                type="password"
                className="notion-input"
                value={masterPassword}
                onChange={(e) => { setMasterPassword(e.target.value); setPasswordError(""); }}
                onKeyDown={(e) => { if (e.key === "Enter") handlePasswordSubmit(); }}
                autoFocus
              />
              {passwordError && (
                <p className="text-xs text-danger mt-1">{passwordError}</p>
              )}
            </div>
            <div className="flex justify-end gap-2 pt-2 border-t border-border">
              <button onClick={() => setPasswordModalOpen(false)} className="notion-button">Cancel</button>
              <button
                onClick={handlePasswordSubmit}
                disabled={!masterPassword.trim()}
                className="notion-button-primary disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Unlock Editing
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
