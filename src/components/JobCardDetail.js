"use client";

import { useState } from "react";
import {
  ArrowLeft, Plus, FileText, ClipboardCheck, Scale, Shield,
  Package, Receipt, CheckCircle2, Truck, Clock
} from "lucide-react";
import { useIONs, useRequestedSpares, useNACs, useProcurements, useCRVs, useCIVs } from "@/hooks/useData";
import Modal from "@/components/ui/Modal";
import StatusBadge from "@/components/ui/StatusBadge";

// ========== Section Components ==========

function TestingSection({ jobCard, onUpdate }) {
  const [testDate, setTestDate] = useState(jobCard.testDate || new Date().toISOString().split("T")[0]);
  const [testType, setTestType] = useState(jobCard.testType || "KPL");
  const [testResult, setTestResult] = useState(jobCard.testResult || "");

  const handleComplete = async () => {
    await onUpdate(jobCard.id, {
      testDate: testDate,
      testType: testType,
      testResult: testResult,
      status: "CLOSED",
      closedDate: new Date().toISOString().split("T")[0],
    });
  };

  return (
    <div className="notion-card p-5 space-y-4">
      <h3 className="text-sm font-semibold text-text-primary flex items-center gap-2">
        <ClipboardCheck size={16} className="text-teal" /> KPL / LPH Test
      </h3>
      <div className="grid grid-cols-3 gap-4 border-t border-border pt-4">
        <div>
          <label className="notion-label">Test Type</label>
          <select value={testType} onChange={(e) => setTestType(e.target.value)} className="notion-select">
            <option value="KPL">KPL (Km per Ltr)</option>
            <option value="LPH">LPH (Ltr per Hr)</option>
          </select>
        </div>
        <div>
          <label className="notion-label">Test Date</label>
          <input type="date" value={testDate} onChange={(e) => setTestDate(e.target.value)} className="notion-input" />
        </div>
        <div>
          <label className="notion-label">Result</label>
          <input type="text" value={testResult} onChange={(e) => setTestResult(e.target.value)}
            placeholder="e.g. 4.2 KPL" className="notion-input" />
        </div>
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

function IONSection({ jobCard, ions, addION, onUpdate, refetchSpares }) {
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ referenceNumber: "", dateRequested: new Date().toISOString().split("T")[0], remarks: "" });
  const [spares, setSpares] = useState([]);

  const addSpareRow = () => setSpares([...spares, { spareName: "", partNumber: "", quantityRequested: 1 }]);
  const updateSpareRow = (i, field, value) => {
    const updated = [...spares];
    updated[i][field] = value;
    setSpares(updated);
  };
  const removeSpareRow = (i) => setSpares(spares.filter((_, idx) => idx !== i));

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!form.referenceNumber.trim()) return;
    
    // Pass spares directly into the ION creation
    await addION({
      ...form,
      spares: spares.filter((s) => s.spareName.trim())
    });
    
    if (jobCard.status === "OPEN" || jobCard.status === "WAITING_FOR_ION") {
      await onUpdate(jobCard.id, { status: "WAITING_FOR_ION" });
    }
    
    setForm({ referenceNumber: "", dateRequested: new Date().toISOString().split("T")[0], remarks: "" });
    setSpares([]);
    setShowForm(false);
    
    // Explicitly refetch the global spares after ION brings in new nested spares
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
            <input type="date" value={form.dateRequested} onChange={(e) => setForm({ ...form, dateRequested: e.target.value })}
              className="notion-input" required />
          </div>
          <input type="text" value={form.remarks} onChange={(e) => setForm({ ...form, remarks: e.target.value })}
            placeholder="Remarks (optional)" className="notion-input" />
            
          <div className="space-y-2 pt-2 border-t border-border mt-3">
            <div className="flex items-center justify-between mt-2">
              <span className="text-sm font-medium text-text-secondary">Related Spares <span className="text-danger">*</span></span>
              <button type="button" onClick={addSpareRow} className="text-xs text-accent hover:underline">+ Add Spare Item</button>
            </div>
            {spares.map((spare, i) => (
              <div key={i} className="grid grid-cols-4 gap-2 items-center">
                <input type="text" value={spare.spareName} onChange={(e) => updateSpareRow(i, "spareName", e.target.value)} placeholder="Spare Name" className="notion-input" required />
                <input type="text" value={spare.partNumber} onChange={(e) => updateSpareRow(i, "partNumber", e.target.value)} placeholder="Part#" className="notion-input" />
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
            <div key={ion.id} className="flex items-center justify-between p-3 rounded-lg border border-border bg-bg-main hover:bg-bg-sidebar transition-colors">
              <div>
                <span className="text-sm font-mono font-bold text-warning">{ion.referenceNumber}</span>
                {ion.remarks && <p className="text-xs text-text-muted mt-0.5">{ion.remarks}</p>}
                {ion.requestedSpares?.length > 0 && (
                  <p className="text-xs text-text-secondary mt-1 border-t border-border/50 pt-1">
                    {ion.requestedSpares.length} Spares Included
                  </p>
                )}
              </div>
              <span className="text-xs text-text-secondary">{ion.dateRequested}</span>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-xs text-text-muted pt-2">No IONs added yet.</p>
      )}
    </div>
  );
}

function SparesSection({ jobCard, spares, updateSpare, onUpdate }) {
  const handleScaling = async (spare) => {
    await updateSpare(spare.id, {
      scalingStatus: "IN_PROGRESS",
      scalingStartDate: new Date().toISOString().split("T")[0],
      status: "SCALING",
    });
    if (jobCard.status !== "SCALING_IN_PROGRESS") {
      await onUpdate(jobCard.id, { status: "SCALING_IN_PROGRESS" });
    }
  };

  const handleAlreadyScaled = async (spare) => {
    await updateSpare(spare.id, { scalingStatus: "DONE", status: "NAC_REQUESTED" });
    // Same check to potentially transition to WAITING_FOR_NAC
    const allDone = spares.every((s) => s.id === spare.id || s.scalingStatus === "DONE");
    if (allDone) {
      await onUpdate(jobCard.id, { status: "WAITING_FOR_NAC" });
    }
  };

  const handleScalingDone = async (spare) => {
    await updateSpare(spare.id, { scalingStatus: "DONE", status: "NAC_REQUESTED" });
    const allDone = spares.every((s) => s.id === spare.id || s.scalingStatus === "DONE");
    if (allDone) {
      await onUpdate(jobCard.id, { status: "WAITING_FOR_NAC" });
    }
  };

  return (
    <div className="notion-card p-5 space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-text-primary flex items-center gap-2">
          <Scale size={16} className="text-accent" /> Requested Spares & Scaling
        </h3>
      </div>
      {spares && spares.length > 0 ? (
        <div className="overflow-x-auto pt-2">
          <table className="w-full text-xs text-left">
            <thead>
              <tr className="border-b border-border bg-bg-sidebar">
                <th className="py-2.5 px-3 font-medium text-text-muted">Spare & Part#</th>
                <th className="py-2.5 px-3 font-medium text-text-muted text-center">Qty</th>
                <th className="py-2.5 px-3 font-medium text-text-muted">ION</th>
                <th className="py-2.5 px-3 font-medium text-text-muted">Status</th>
                <th className="py-2.5 px-3 font-medium text-text-muted text-right">Scaling Action</th>
              </tr>
            </thead>
            <tbody>
              {spares.map((s) => (
                <tr key={s.id} className="border-b border-border hover:bg-bg-card-hover transition-colors">
                  <td className="py-3 px-3">
                    <div className="font-medium text-text-primary">{s.spareName}</div>
                    {s.partNumber && <div className="font-mono text-[10px] text-text-muted mt-0.5">{s.partNumber}</div>}
                  </td>
                  <td className="py-3 px-3 text-center text-text-secondary">{s.quantityReceived}/{s.quantityRequested}</td>
                  <td className="py-3 px-3 text-text-muted font-mono">{s.ion?.referenceNumber || "—"}</td>
                  <td className="py-3 px-3">
                    <div className="flex flex-col gap-1 items-start">
                      <StatusBadge status={s.scalingStatus} />
                      {s.status !== "PENDING" && s.status !== "SCALING" && <StatusBadge status={s.status} />}
                    </div>
                  </td>
                  <td className="py-3 px-3 text-right">
                    {s.scalingStatus === "NOT_STARTED" && (
                      <div className="flex justify-end gap-2">
                        <button onClick={() => handleAlreadyScaled(s)} className="notion-button text-success border-success-bg hover:bg-success-bg !py-1 !text-[11px]">
                          Already Scaled
                        </button>
                        <button onClick={() => handleScaling(s)} className="notion-button text-warning border-warning-bg hover:bg-warning-bg !py-1 !text-[11px]">
                          Start Scaling
                        </button>
                      </div>
                    )}
                    {s.scalingStatus === "IN_PROGRESS" && (
                      <button onClick={() => handleScalingDone(s)} className="notion-button text-success border-success-bg hover:bg-success-bg !py-1 !text-[11px]">
                        Mark Done
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="text-xs text-text-muted pt-2">No spares requested. Add spares from ION.</p>
      )}
    </div>
  );
}

function NACSection({ jobCardId, jobCard, onUpdate }) {
  const { nacs, addNAC, updateNAC } = useNACs(jobCardId);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ requestDate: new Date().toISOString().split("T")[0], remarks: "" });

  const handleAdd = async (e) => {
    e.preventDefault();
    await addNAC(form);
    await onUpdate(jobCard.id, { status: "WAITING_FOR_NAC" });
    setForm({ requestDate: new Date().toISOString().split("T")[0], remarks: "" });
    setShowForm(false);
  };

  const handleNACReceived = async (nac, nacResult) => {
    await updateNAC(nac.id, {
      receivedDate: new Date().toISOString().split("T")[0],
      nacStatus: nacResult,
    });
    if (nacResult === "NAC_ISSUED") {
      await onUpdate(jobCard.id, { status: "WAITING_FOR_PROCUREMENT" });
    } else {
      await onUpdate(jobCard.id, { status: "SPARES_RECEIVED" });
    }
  };

  return (
    <div className="notion-card p-5 space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-text-primary flex items-center gap-2">
          <Shield size={16} className="text-purple-600" /> NAC (Store Division)
        </h3>
        <button onClick={() => setShowForm(!showForm)} className="notion-button text-purple-700 bg-purple-50 border-purple-100 hover:bg-purple-100">
          <Plus size={12} /> Request NAC
        </button>
      </div>
      {showForm && (
        <form onSubmit={handleAdd} className="p-4 rounded-lg bg-bg-sidebar border border-border space-y-3 animate-fade-in mt-2">
          <div className="grid grid-cols-2 gap-3">
            <input type="date" value={form.requestDate} onChange={(e) => setForm({ ...form, requestDate: e.target.value })} className="notion-input" />
            <input type="text" value={form.remarks} onChange={(e) => setForm({ ...form, remarks: e.target.value })}
              placeholder="Remarks" className="notion-input" />
          </div>
          <div className="flex gap-2 pt-2">
            <button type="submit" className="notion-button bg-purple-600 text-white border-purple-600 hover:bg-purple-700">Submit Request</button>
            <button type="button" onClick={() => setShowForm(false)} className="notion-button">Cancel</button>
          </div>
        </form>
      )}
      {nacs.length > 0 ? (
        <div className="space-y-2 pt-2">
          {nacs.map((nac) => (
            <div key={nac.id} className="flex items-center justify-between p-3 rounded-lg border border-border bg-bg-main hover:bg-bg-sidebar transition-colors">
              <div>
                <span className="text-xs text-text-secondary">Requested: {nac.requestDate}</span>
                {nac.receivedDate && <span className="text-xs text-text-secondary ml-3">Received: {nac.receivedDate}</span>}
                {nac.remarks && <p className="text-xs text-text-muted mt-0.5">{nac.remarks}</p>}
              </div>
              <div className="flex items-center gap-3">
                <StatusBadge status={nac.nacStatus} />
                {nac.nacStatus === "REQUESTED" && (
                  <div className="flex gap-1.5 border-l border-border pl-3">
                    <button onClick={() => handleNACReceived(nac, "NAC_ISSUED")} className="notion-button text-purple-700 bg-purple-50 border-purple-200 !py-1 !text-[11px]">
                      NAC Issued
                    </button>
                    <button onClick={() => handleNACReceived(nac, "SPARES_PROVIDED_BY_STORE")} className="notion-button text-success bg-success-bg border-success/20 !py-1 !text-[11px]">
                      Store Provided
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-xs text-text-muted pt-2">No NAC requests yet.</p>
      )}
    </div>
  );
}

function ProcurementSection({ jobCardId }) {
  const { procurements, addProcurement } = useProcurements(jobCardId);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ method: "MoU", supplyOrderNumber: "", vendorName: "", procurementDate: new Date().toISOString().split("T")[0], remarks: "" });

  const handleAdd = async (e) => {
    e.preventDefault();
    await addProcurement(form);
    setForm({ method: "MoU", supplyOrderNumber: "", vendorName: "", procurementDate: new Date().toISOString().split("T")[0], remarks: "" });
    setShowForm(false);
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
            <input type="text" value={form.supplyOrderNumber} onChange={(e) => setForm({ ...form, supplyOrderNumber: e.target.value })}
              placeholder="SO / Order Number" className="notion-input" />
            <input type="text" value={form.vendorName} onChange={(e) => setForm({ ...form, vendorName: e.target.value })}
              placeholder="Vendor / Firm Name" className="notion-input" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <input type="date" value={form.procurementDate} onChange={(e) => setForm({ ...form, procurementDate: e.target.value })} className="notion-input" />
            <input type="text" value={form.remarks} onChange={(e) => setForm({ ...form, remarks: e.target.value })} placeholder="Remarks" className="notion-input" />
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
            <div key={p.id} className="flex items-center justify-between p-3 rounded-lg border border-border bg-bg-main hover:bg-bg-sidebar transition-colors">
              <div>
                <div className="flex items-center gap-2">
                  <StatusBadge status={p.method} />
                  <span className="text-sm font-mono text-text-primary font-medium">{p.supplyOrderNumber || "No SO#"}</span>
                </div>
                {p.vendorName && <p className="text-xs text-text-muted mt-1">{p.vendorName}</p>}
              </div>
              <span className="text-xs text-text-secondary">{p.procurementDate}</span>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-xs text-text-muted pt-2">No procurement details recorded.</p>
      )}
    </div>
  );
}

function CRVSection({ jobCardId, jobCard, onUpdate }) {
  const { crvs, addCRV } = useCRVs(jobCardId);
  const { procurements } = useProcurements(jobCardId);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ voucherType: "CRV", voucherNumber: "", vendorOrUnitName: "", receiptDate: new Date().toISOString().split("T")[0], procurementId: "", remarks: "" });
  const [items, setItems] = useState([]);

  const addItem = () => setItems([...items, { spareName: "", partNumber: "", quantityReceived: 1, requestedSpareId: null }]);
  const removeItem = (i) => setItems(items.filter((_, idx) => idx !== i));
  const updateItem = (i, field, value) => {
    const updated = [...items];
    updated[i][field] = value;
    setItems(updated);
  };

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!form.voucherNumber.trim()) return;
    await addCRV(form, items.filter((it) => it.spareName.trim()));
    await onUpdate(jobCard.id, { status: "SPARES_RECEIVED" });
    setForm({ voucherType: "CRV", voucherNumber: "", vendorOrUnitName: "", receiptDate: new Date().toISOString().split("T")[0], procurementId: "", remarks: "" });
    setItems([]);
    setShowForm(false);
  };

  return (
    <div className="notion-card p-5 space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-text-primary flex items-center gap-2">
          <Receipt size={16} className="text-teal-600" /> CRV / RV (Receipt Vouchers)
        </h3>
        <button onClick={() => { setShowForm(!showForm); if (!showForm && items.length === 0) addItem(); }} className="notion-button text-teal-700 bg-teal-50 border-teal-100 hover:bg-teal-100">
          <Plus size={12} /> Add CRV / RV
        </button>
      </div>
      {showForm && (
        <form onSubmit={handleAdd} className="p-4 rounded-lg bg-bg-sidebar border border-border space-y-3 animate-fade-in mt-2">
          <div className="grid grid-cols-3 gap-3">
            <select value={form.voucherType} onChange={(e) => setForm({ ...form, voucherType: e.target.value })} className="notion-select">
              <option value="CRV">CRV</option>
              <option value="RV">RV (Receive Voucher)</option>
            </select>
            <input type="text" value={form.voucherNumber} onChange={(e) => setForm({ ...form, voucherNumber: e.target.value })}
              placeholder="Voucher Number *" className="notion-input" required />
            <input type="text" value={form.vendorOrUnitName} onChange={(e) => setForm({ ...form, vendorOrUnitName: e.target.value })}
              placeholder="Vendor / Unit Name" className="notion-input" />
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
              <span className="text-sm font-medium text-text-secondary">Line Items</span>
              <button type="button" onClick={addItem} className="text-xs text-accent hover:underline">+ Add Item</button>
            </div>
            {items.map((item, i) => (
              <div key={i} className="grid grid-cols-4 gap-2 items-center">
                <input type="text" value={item.spareName} onChange={(e) => updateItem(i, "spareName", e.target.value)} placeholder="Spare Name" className="notion-input" />
                <input type="text" value={item.partNumber} onChange={(e) => updateItem(i, "partNumber", e.target.value)} placeholder="Part#" className="notion-input" />
                <input type="number" value={item.quantityReceived} onChange={(e) => updateItem(i, "quantityReceived", parseInt(e.target.value) || 1)} min="1" className="notion-input" />
                <button type="button" onClick={() => removeItem(i)} className="text-danger text-xs hover:underline">Remove</button>
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
              <div className="flex items-center justify-between pb-2 mb-2 border-b border-border/50">
                <div className="flex items-center gap-2">
                  <StatusBadge status={crv.voucherType} />
                  <span className="text-sm font-mono font-bold text-text-primary">{crv.voucherNumber}</span>
                </div>
                <span className="text-xs text-text-secondary">{crv.receiptDate}</span>
              </div>
              <div className="text-xs text-text-secondary space-y-1">
                {crv.vendorOrUnitName && <p>From: <span className="font-medium text-text-primary">{crv.vendorOrUnitName}</span></p>}
                {crv.procurement && <p>Procurement: <span className="font-mono bg-border px-1 py-0.5 rounded text-text-primary">{crv.procurement.method} — {crv.procurement.supplyOrderNumber || "N/A"}</span></p>}
              </div>
              {crv.crvItems?.length > 0 && (
                <div className="mt-3 bg-bg-card border border-border rounded overflow-hidden">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-bg-sidebar">
                      <tr>
                        <th className="py-1.5 px-3 font-medium text-text-muted border-b border-border">Spare</th>
                        <th className="py-1.5 px-3 font-medium text-text-muted border-b border-border">Part #</th>
                        <th className="py-1.5 px-3 font-medium text-text-muted border-b border-border text-center">Qty</th>
                      </tr>
                    </thead>
                    <tbody>
                      {crv.crvItems.map((item) => (
                        <tr key={item.id} className="border-b border-border/40 last:border-0">
                          <td className="py-1.5 px-3 text-text-secondary">{item.spareName}</td>
                          <td className="py-1.5 px-3 font-mono text-text-muted">{item.partNumber || "—"}</td>
                          <td className="py-1.5 px-3 text-center text-text-primary font-medium">{item.quantityReceived}</td>
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

function CIVSection({ jobCardId, jobCard, onUpdate }) {
  const { civs, addCIV } = useCIVs(jobCardId);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ civNumber: "", issueDate: new Date().toISOString().split("T")[0], remarks: "" });

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!form.civNumber.trim()) return;
    await addCIV(form);
    await onUpdate(jobCard.id, { status: "CLOSED", closedDate: new Date().toISOString().split("T")[0] });
    setForm({ civNumber: "", issueDate: new Date().toISOString().split("T")[0], remarks: "" });
    setShowForm(false);
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
            <input type="text" value={form.civNumber} onChange={(e) => setForm({ ...form, civNumber: e.target.value })}
              placeholder="CIV Number *" className="notion-input" required />
            <input type="date" value={form.issueDate} onChange={(e) => setForm({ ...form, issueDate: e.target.value })} className="notion-input" />
          </div>
          <input type="text" value={form.remarks} onChange={(e) => setForm({ ...form, remarks: e.target.value })}
            placeholder="Remarks" className="notion-input" />
          <div className="flex gap-2 pt-2">
            <button type="submit" className="notion-button bg-success text-white border-success hover:bg-success/90">Create CIV & Close Job Card</button>
            <button type="button" onClick={() => setShowForm(false)} className="notion-button">Cancel</button>
          </div>
        </form>
      )}
      {civs.length > 0 ? (
        <div className="space-y-2 pt-2">
          {civs.map((civ) => (
            <div key={civ.id} className="flex items-center justify-between p-3 rounded-lg border border-border bg-bg-main">
              <span className="text-sm font-mono font-bold text-success">{civ.civNumber}</span>
              <span className="text-xs text-text-secondary">{civ.issueDate}</span>
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
          <IONSection jobCardId={jobCard.id} jobCard={jobCard} onUpdate={onUpdate} />
          <SparesSection jobCardId={jobCard.id} jobCard={jobCard} onUpdate={onUpdate} />
          <NACSection jobCardId={jobCard.id} jobCard={jobCard} onUpdate={onUpdate} />
          <ProcurementSection jobCardId={jobCard.id} />
          <CRVSection jobCardId={jobCard.id} jobCard={jobCard} onUpdate={onUpdate} />

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

          <CIVSection jobCardId={jobCard.id} jobCard={jobCard} onUpdate={onUpdate} />
        </div>
      )}
    </div>
  );
}
