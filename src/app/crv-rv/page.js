"use client";

import { useState } from "react";
import { Plus, Receipt, Truck, FileText, CheckCircle2, Factory } from "lucide-react";
import { useGlobalCRVs, useGlobalProcurements } from "@/hooks/useData";
import StatusBadge from "@/components/ui/StatusBadge";
import Modal from "@/components/ui/Modal";

export default function CRVPage() {
  const { crvs, addCRV, loading: crvsLoading } = useGlobalCRVs();
  const { procurements, addProcurement } = useGlobalProcurements();

  const [showModal, setShowModal] = useState(false);
  
  // Creation form state
  const [form, setForm] = useState({ 
    voucherType: "CRV", 
    crvCategory: "",
    voucherNumber: "", 
    vendorOrUnitName: "", 
    receiptDate: new Date().toISOString().split("T")[0], 
    procurementId: "", 
    remarks: "" 
  });
  
  const [items, setItems] = useState([]);
  
  // Quick Procurement Add
  const [showProcForm, setShowProcForm] = useState(false);
  const [procForm, setProcForm] = useState({ 
    method: "MoU", supplyOrderNumber: "", vendorName: "", 
    procurementDate: new Date().toISOString().split("T")[0], remarks: "", amount: "" 
  });

  const addItem = () => setItems([...items, { spareName: "", partNumber: "", quantityReceived: 1, rate: 0, gst: 0, amount: 0 }]);
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

  const handleAddProcurement = async (e) => {
    e.preventDefault();
    await addProcurement(procForm);
    setProcForm({ method: "MoU", supplyOrderNumber: "", vendorName: "", procurementDate: new Date().toISOString().split("T")[0], remarks: "", amount: "" });
    setShowProcForm(false);
  };

  const handleSubmitCRV = async (e) => {
    e.preventDefault();
    if (!form.voucherNumber.trim()) return;
    await addCRV({
      voucherType: form.voucherType,
      crvCategory: form.crvCategory,
      voucherNumber: form.voucherNumber,
      vendorOrUnitName: form.vendorOrUnitName,
      receiptDate: form.receiptDate,
      procurementId: form.procurementId || undefined,
      remarks: form.remarks
    }, items.filter(it => it.spareName.trim()));

    setForm({ voucherType: "CRV", crvCategory: "", voucherNumber: "", vendorOrUnitName: "", receiptDate: new Date().toISOString().split("T")[0], procurementId: "", remarks: "" });
    setItems([]);
    setShowModal(false);
  };

  if (crvsLoading) return <div className="p-8 text-center text-text-muted">Loading CRVs...</div>;

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-20 animate-fade-in">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-text-primary">Global CRV / RV Ledger</h1>
          <p className="text-text-secondary mt-1 text-sm">Manage floating and standalone receipt vouchers seamlessly.</p>
        </div>
        <button onClick={() => setShowModal(true)} className="notion-button-primary bg-teal-600 hover:bg-teal-700 border-teal-600 flex items-center gap-2">
          <Plus size={16} /> Create CRV/RV
        </button>
      </div>

      <div className="grid gap-4">
        {crvs.map((crv) => (
          <div key={crv.id} className="notion-card p-5 hover:border-teal-200 transition-colors">
            <div className="flex items-center justify-between mb-3 border-b border-border/50 pb-3">
              <div className="flex flex-col gap-1.5">
                <div className="flex items-center gap-3">
                  <StatusBadge status={crv.voucherType} />
                  <span className="text-lg font-mono font-bold text-text-primary">{crv.voucherNumber}</span>
                  {crv.crvCategory === "MAINTENANCE_SUPPLY_ORDER" && (
                    <span className="px-2 py-0.5 bg-orange-100 text-orange-800 border border-orange-200 rounded text-xs font-semibold flex items-center gap-1">
                      <Factory size={12} /> Maintenance Order
                    </span>
                  )}
                  {crv.jobCardId ? (
                    <span className="px-2 py-0.5 bg-indigo-50 border border-indigo-200 text-indigo-700 rounded text-[10px] font-medium tracking-wide">
                      LINKED TO JC: {crv.jobCard?.jobCardNumber}
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 bg-gray-100 border border-gray-200 text-gray-600 rounded text-[10px] font-medium tracking-wide flex items-center gap-1">
                      <Truck size={10} /> FLOATING / STANDALONE
                    </span>
                  )}
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm font-medium text-text-secondary">{crv.receiptDate}</div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6 text-sm mb-4">
              <div className="space-y-1.5 text-text-secondary">
                {crv.vendorOrUnitName && <p>Source / Vendor: <span className="font-medium text-text-primary">{crv.vendorOrUnitName}</span></p>}
                {crv.remarks && <p className="italic">{crv.remarks}</p>}
              </div>
              <div className="space-y-1.5 text-text-secondary items-start justify-end flex">
                {crv.procurement ? (
                  <div className="bg-bg-sidebar px-3 py-2 rounded border border-border text-xs w-full max-w-sm">
                    <div className="font-medium text-text-primary mb-1 flex items-center gap-2">
                       <StatusBadge status={crv.procurement.method} /> Procurement Linked
                    </div>
                    SO Code: <span className="font-mono">{crv.procurement.supplyOrderNumber || "—"}</span>
                  </div>
                ) : (
                  <span className="text-xs text-text-muted mt-2">No Procurement Tied</span>
                )}
              </div>
            </div>

            {crv.crvItems?.length > 0 ? (
              <div className="bg-bg-card border border-border rounded overflow-hidden">
                <table className="w-full text-xs text-left">
                  <thead className="bg-bg-sidebar">
                    <tr>
                      <th className="py-2 px-3 font-medium text-text-muted border-b border-border">Part #</th>
                      <th className="py-2 px-3 font-medium text-text-muted border-b border-border">Spare Name</th>
                      <th className="py-2 px-3 font-medium text-text-muted border-b border-border text-center">Qty</th>
                      <th className="py-2 px-3 font-medium text-text-muted border-b border-border text-right">Rate</th>
                      <th className="py-2 px-3 font-medium text-text-muted border-b border-border text-right">Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {crv.crvItems.map((item) => (
                      <tr key={item.id} className="border-b border-border/40 last:border-0 hover:bg-bg-card-hover transition-colors">
                        <td className="py-2 px-3 font-mono text-text-muted">{item.partNumber || "—"}</td>
                        <td className="py-2 px-3 text-text-primary font-medium">{item.spareName}</td>
                        <td className="py-2 px-3 text-center font-medium bg-bg-sidebar/50">{item.quantityReceived}</td>
                        <td className="py-2 px-3 text-right text-text-secondary">₹{(item.rate || 0).toFixed(2)}</td>
                        <td className="py-2 px-3 text-right text-text-primary font-medium">₹{(item.amount || 0).toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-xs text-text-muted">No line items configured.</p>
            )}
          </div>
        ))}
        {crvs.length === 0 && (
          <div className="py-12 text-center text-text-muted border-2 border-dashed border-border rounded-xl">
            <Receipt size={48} className="mx-auto mb-4 opacity-20" />
            <p>No CRVs logged in the global ledger yet.</p>
          </div>
        )}
      </div>

      {showModal && (
        <Modal onClose={() => setShowModal(false)} title="Create Global CRV / RV" size="lg">
          <form onSubmit={handleSubmitCRV} className="space-y-4">
            <div className="grid grid-cols-2 gap-3 mb-3">
              <div>
                <label className="notion-label">Voucher Type</label>
                <select value={form.voucherType} onChange={(e) => setForm({ ...form, voucherType: e.target.value })} className="notion-select">
                  <option value="CRV">CRV</option>
                  <option value="RV">RV (Receive Voucher)</option>
                </select>
              </div>
              <div>
                <label className="notion-label">CRV Sub-Category</label>
                <select value={form.crvCategory} onChange={(e) => setForm({ ...form, crvCategory: e.target.value })} className="notion-select bg-orange-50 border-orange-200">
                  <option value="">General Purpose</option>
                  <option value="MAINTENANCE_SUPPLY_ORDER">Maintenance Supply Order (MoU / GeM)</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="notion-label">Native Voucher Number <span className="text-danger">*</span></label>
                <input type="text" value={form.voucherNumber} onChange={(e) => setForm({ ...form, voucherNumber: e.target.value })} placeholder="Required" className="notion-input" required />
              </div>
              <div>
                <label className="notion-label">Vendor or Unit Name</label>
                <input type="text" value={form.vendorOrUnitName} onChange={(e) => setForm({ ...form, vendorOrUnitName: e.target.value })} placeholder="Vendor / Origin Unit" className="notion-input" />
              </div>
            </div>

            <div className="grid grid-cols-[1fr_1fr_auto] gap-3 items-end">
              <div>
                <label className="notion-label">Receipt Date</label>
                <input type="date" value={form.receiptDate} onChange={(e) => setForm({ ...form, receiptDate: e.target.value })} className="notion-input" />
              </div>
              <div>
                <label className="notion-label">Link Global Procurement</label>
                <select value={form.procurementId} onChange={(e) => setForm({ ...form, procurementId: e.target.value })} className="notion-select">
                  <option value="">None (Optional)</option>
                  {procurements.map((p) => (
                    <option key={p.id} value={p.id}>{p.method} — {p.supplyOrderNumber || "No SO#"}</option>
                  ))}
                </select>
              </div>
              <button type="button" onClick={() => setShowProcForm(!showProcForm)} className="notion-button text-xs !py-2.5 bg-blue-50 text-blue-700 border-blue-200">
                + New SO
              </button>
            </div>

            {/* Quick Add Proc Form overlay */}
            {showProcForm && (
              <div className="p-3 bg-blue-50 border border-blue-100 rounded-lg space-y-2 mt-2">
                <div className="text-xs font-semibold text-blue-800">Quick-Add Procurement</div>
                <div className="grid grid-cols-3 gap-2">
                  <select value={procForm.method} onChange={(e) => setProcForm({ ...procForm, method: e.target.value })} className="notion-select !bg-white">
                    <option value="MoU">MoU</option>
                    <option value="GeM">GeM</option>
                  </select>
                  <input type="text" value={procForm.supplyOrderNumber} onChange={(e) => setProcForm({ ...procForm, supplyOrderNumber: e.target.value })} placeholder="SO Number" className="notion-input !bg-white" />
                  <input type="number" value={procForm.amount} onChange={(e) => setProcForm({ ...procForm, amount: parseFloat(e.target.value) || "" })} placeholder="Amount ₹" className="notion-input !bg-white" />
                </div>
                <button type="button" onClick={handleAddProcurement} className="notion-button bg-blue-600 text-white !py-1 text-xs">Save Procurement</button>
              </div>
            )}

            <div>
              <label className="notion-label">Remarks</label>
              <input type="text" value={form.remarks} onChange={(e) => setForm({ ...form, remarks: e.target.value })} placeholder="Optional details..." className="notion-input" />
            </div>

            <div className="space-y-2 pt-4 border-t border-border mt-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-semibold text-text-primary">Standard Line Items</span>
                <button type="button" onClick={addItem} className="text-xs text-accent bg-accent/10 px-2 py-1 rounded hover:bg-accent/20 transition-colors">+ Add Spare Item</button>
              </div>
              {items.map((item, i) => (
                <div key={i} className="grid grid-cols-[1fr_2fr_1fr_1fr_1fr_1.5fr] gap-2 items-center relative pr-8">
                  <input type="text" value={item.partNumber || ""} onChange={(e) => updateItem(i, "partNumber", e.target.value)} placeholder="Part#" className="notion-input !text-xs" />
                  <input type="text" value={item.spareName} onChange={(e) => updateItem(i, "spareName", e.target.value)} placeholder="Spare Name *" className="notion-input !text-xs" required />
                  <input type="number" value={item.quantityReceived} onChange={(e) => updateItem(i, "quantityReceived", parseInt(e.target.value) || 1)} min="1" className="notion-input !text-xs" title="Qty" />
                  <input type="number" step="0.01" value={item.rate || ""} onChange={(e) => updateItem(i, "rate", parseFloat(e.target.value) || 0)} placeholder="Rate" className="notion-input !text-xs" />
                  <input type="number" step="0.01" value={item.gst || ""} onChange={(e) => updateItem(i, "gst", parseFloat(e.target.value) || 0)} placeholder="GST(%)" className="notion-input !text-xs" />
                  <input type="number" step="0.01" value={item.amount || ""} onChange={(e) => updateItem(i, "amount", parseFloat(e.target.value) || 0)} placeholder="Amount" className="notion-input !text-xs bg-bg-sidebar font-medium" disabled />
                  <button type="button" onClick={() => removeItem(i)} className="absolute right-0 text-danger text-[10px] hover:underline px-1 py-2">Del</button>
                </div>
              ))}
            </div>

            <div className="flex gap-2 pt-6 pb-2">
              <button type="submit" className="notion-button-primary bg-teal-600 border-teal-600 hover:bg-teal-700 w-full text-base py-2">Complete Global CRV</button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
