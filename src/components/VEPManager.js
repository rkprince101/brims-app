"use client";

import { useState } from "react";
import { Plus, X, Search, Truck, Upload, Download, AlertCircle, CheckCircle, AlertTriangle, ArrowRightLeft } from "lucide-react";
import { useVEPs, useUnits } from "@/hooks/useData";
import StatusBadge from "@/components/ui/StatusBadge";
import EmptyState from "@/components/ui/EmptyState";
import Modal from "@/components/ui/Modal";

export default function VEPManager() {
  const { veps, loading, addVEP, updateVEP, deleteVEP, bulkImportVEPs } = useVEPs();
  const { units, loading: unitsLoading } = useUnits();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editVep, setEditVep] = useState(null);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [formData, setFormData] = useState({
    type: "Vehicle",
    registrationNumber: "",
    category: "",
    oem: "",
    model: "",
    engineNumber: "",
    chassisNumber: "",
    unitName: "",
    status: "Active",
  });
  const [importFile, setImportFile] = useState(null);
  const [importPreview, setImportPreview] = useState([]);
  const [importErrors, setImportErrors] = useState([]);
  const [importResult, setImportResult] = useState(null);
  const [importing, setImporting] = useState(false);
  const [moveModal, setMoveModal] = useState(null);
  const [moveDestUnit, setMoveDestUnit] = useState("");

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
    if (editVep) {
      await updateVEP(editVep.id, formData);
    } else {
      await addVEP(formData);
    }
    setIsModalOpen(false);
    setEditVep(null);
    setFormData({
      type: "Vehicle",
      registrationNumber: "",
      category: "",
      oem: "",
      model: "",
      engineNumber: "",
      chassisNumber: "",
      unitName: "",
      status: "Active",
    });
  };

  const parseCSV = (text) => {
    const lines = text.trim().split(/\r?\n/);
    if (lines.length < 2) return { rows: [], errors: ["CSV file is empty or has no data rows"] };

    const headers = lines[0].split(",").map((h) => h.trim().toLowerCase());
    const requiredFields = ["type", "registrationnumber"];
    const missingRequired = requiredFields.filter((f) => !headers.includes(f));
    if (missingRequired.length > 0) {
      return { rows: [], errors: [`Missing required columns: ${missingRequired.join(", ")}`] };
    }

    const rows = [];
    const errors = [];
    const validTypes = ["Vehicle", "Equipment", "Plant"];

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(",").map((v) => v.trim());
      if (values.length === 1 && values[0] === "") continue;

      const row = {};
      headers.forEach((h, idx) => {
        row[h] = values[idx] || "";
      });

      if (!row.registrationnumber) {
        errors.push(`Row ${i + 1}: Registration Number is required`);
        continue;
      }

      if (!row.type) {
        row.type = "Vehicle";
      }

      if (!validTypes.includes(row.type)) {
        errors.push(`Row ${i + 1}: Invalid type "${row.type}". Must be Vehicle, Equipment, or Plant`);
        continue;
      }

      rows.push({
        type: row.type,
        registrationNumber: row.registrationnumber,
        category: row.category || "",
        oem: row.oem || "",
        model: row.model || "",
        engineNumber: row.enginenumber || "",
        chassisNumber: row.chassisnumber || "",
        unitName: row.unitname || "",
        status: row.status || "Active",
      });
    }

    return { rows, errors };
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (!file.name.endsWith(".csv")) {
      setImportErrors(["Please upload a .csv file"]);
      return;
    }

    setImportFile(file);
    setImportErrors([]);
    setImportResult(null);

    const reader = new FileReader();
    reader.onload = (evt) => {
      const { rows, errors } = parseCSV(evt.target.result);
      setImportPreview(rows);
      setImportErrors(errors);
    };
    reader.readAsText(file);
  };

  const handleImport = async () => {
    if (importPreview.length === 0) return;
    setImporting(true);
    try {
      const result = await bulkImportVEPs(importPreview);
      setImportResult(result);
    } catch (e) {
      setImportErrors([e.message]);
    } finally {
      setImporting(false);
    }
  };

  const downloadTemplate = () => {
    const csv = "type,registrationNumber,category,oem,model,engineNumber,chassisNumber,unitName,status\nVehicle,BA-12345,Small Utility Vehicle,Mahindra,Scorpio 4x4,ENG001,CHS001,102 Workshop,Active\nEquipment,EM-98765,Heavy Earth Mover,CAT,320D,CAT-ENG-001,CAT-CHS-001,BEC,Active\n";
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "vep-import-template.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  const resetImport = () => {
    setImportFile(null);
    setImportPreview([]);
    setImportErrors([]);
    setImportResult(null);
    setIsImportModalOpen(false);
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
        <div className="flex gap-2">
          <button
            onClick={() => setIsImportModalOpen(true)}
            className="notion-button"
          >
            <Upload size={16} /> Import CSV
          </button>
          <button
            onClick={() => { setEditVep(null); setFormData({ type: "Vehicle", registrationNumber: "", category: "", oem: "", model: "", engineNumber: "", chassisNumber: "", unitName: "", status: "Active" }); setIsModalOpen(true); }}
            className="notion-button-primary"
          >
            <Plus size={16} /> New VEP
          </button>
        </div>
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
                <th className="py-2.5 px-4 font-medium text-text-muted hidden lg:table-cell">Unit</th>
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
                  <td className="py-3 px-4 text-text-secondary hidden lg:table-cell">
                    {vep.unitName || "—"}
                  </td>
                  <td className="py-3 px-4 text-text-muted text-xs hidden lg:table-cell font-mono">
                    <div>E: {vep.engineNumber || "—"}</div>
                    <div>C: {vep.chassisNumber || "—"}</div>
                  </td>
                  <td className="py-3 px-4">
                    <StatusBadge status={vep.status} />
                    {vep.isMovedOut && (
                      <span className="ml-2 px-2 py-0.5 bg-red-100 text-red-700 text-[10px] rounded-full font-semibold border border-red-200">
                        Moved → {vep.movedToUnit || "Unknown"}
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-right">
                    <div className="flex justify-end gap-2">
                      {!vep.isMovedOut && (
                        <button
                          onClick={() => { setMoveModal(vep); setMoveDestUnit(""); }}
                          className="text-orange-600 hover:underline text-xs flex items-center gap-0.5"
                        >
                          <ArrowRightLeft size={10} /> Move
                        </button>
                      )}
                      <button
                        onClick={() => { setEditVep(vep); setFormData({ type: vep.type, registrationNumber: vep.registrationNumber, category: vep.category || "", oem: vep.oem || "", model: vep.model || "", engineNumber: vep.engineNumber || "", chassisNumber: vep.chassisNumber || "", unitName: vep.unitName || "", status: vep.status }); setIsModalOpen(true); }}
                        className="text-accent hover:underline text-xs"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => deleteVEP(vep.id)}
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
        <Modal title={editVep ? "Edit VEP" : "Register New VEP"} onClose={() => { setIsModalOpen(false); setEditVep(null); }}>
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
              <div>
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
                <label className="notion-label">Unit</label>
                <select
                  className="notion-select"
                  value={formData.unitName}
                  onChange={(e) => setFormData({ ...formData, unitName: e.target.value })}
                >
                  <option value="">Select unit...</option>
                  {unitsLoading ? (
                    <option disabled>Loading...</option>
                  ) : (
                    units.map((u) => <option key={u.id} value={u.name}>{u.name}</option>)
                  )}
                </select>
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
                onClick={() => { setIsModalOpen(false); setEditVep(null); }}
                className="notion-button"
              >
                Cancel
              </button>
              <button type="submit" className="notion-button-primary">
                {editVep ? "Save Changes" : "Save VEP"}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {isImportModalOpen && (
        <Modal title="Import VEPs from CSV" onClose={resetImport} wide>
          <div className="space-y-4">
            {!importFile && (
              <>
                <p className="text-sm text-text-secondary">
                  Upload a CSV file to bulk import Vehicles, Equipment, and Plant records.
                </p>
                <div className="flex items-center gap-2">
                  <button
                    onClick={downloadTemplate}
                    className="notion-button text-accent hover:bg-accent-muted"
                  >
                    <Download size={14} /> Download Template
                  </button>
                </div>
                <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-border rounded-lg cursor-pointer hover:bg-bg-card-hover transition-colors">
                  <Upload size={24} className="text-text-muted mb-2" />
                  <span className="text-sm text-text-secondary">Click to upload or drag and drop</span>
                  <span className="text-xs text-text-muted mt-1">.csv files only</span>
                  <input
                    type="file"
                    accept=".csv"
                    className="hidden"
                    onChange={handleFileUpload}
                  />
                </label>
              </>
            )}

            {importErrors.length > 0 && (
              <div className="p-3 rounded-lg bg-danger-bg border border-danger/20 text-sm text-danger flex items-start gap-2">
                <AlertCircle size={16} className="mt-0.5 flex-shrink-0" />
                <div>
                  {importErrors.map((err, i) => (
                    <p key={i}>{err}</p>
                  ))}
                </div>
              </div>
            )}

            {importResult && (
              <div className="space-y-2">
                {importResult.created.length > 0 && (
                  <div className="p-3 rounded-lg bg-success-bg border border-success/20 text-sm text-success flex items-start gap-2">
                    <CheckCircle size={16} className="mt-0.5 flex-shrink-0" />
                    <span>Successfully imported {importResult.created.length} VEP(s)</span>
                  </div>
                )}
                {importResult.skipped.length > 0 && (
                  <div className="p-3 rounded-lg bg-warning-bg border border-warning/20 text-sm text-warning flex items-start gap-2">
                    <AlertTriangle size={16} className="mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-medium">{importResult.skipped.length} duplicate(s) skipped</p>
                      {importResult.skipped.map((s, i) => (
                        <p key={i} className="text-xs text-text-muted mt-0.5">{s.registrationNumber}</p>
                      ))}
                    </div>
                  </div>
                )}
                {importResult.errors.length > 0 && (
                  <div className="p-3 rounded-lg bg-danger-bg border border-danger/20 text-sm text-danger flex items-start gap-2">
                    <AlertCircle size={16} className="mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-medium">{importResult.errors.length} error(s)</p>
                      {importResult.errors.map((e, i) => (
                        <p key={i} className="text-xs text-text-muted mt-0.5">{e.registrationNumber}: {e.error}</p>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {importPreview.length > 0 && !importResult && (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-text-secondary">
                    Preview: {importPreview.length} VEP(s) to import
                  </span>
                  <button
                    onClick={resetImport}
                    className="text-xs text-text-muted hover:text-text-primary transition-colors"
                  >
                    Choose different file
                  </button>
                </div>
                <div className="max-h-64 overflow-y-auto border border-border rounded-lg">
                  <table className="w-full text-xs text-left">
                    <thead>
                      <tr className="border-b border-border bg-bg-sidebar sticky top-0">
                        <th className="py-1.5 px-2 font-medium text-text-muted">Type</th>
                        <th className="py-1.5 px-2 font-medium text-text-muted">Reg Number</th>
                        <th className="py-1.5 px-2 font-medium text-text-muted">OEM</th>
                        <th className="py-1.5 px-2 font-medium text-text-muted">Model</th>
                        <th className="py-1.5 px-2 font-medium text-text-muted hidden sm:table-cell">Category</th>
                        <th className="py-1.5 px-2 font-medium text-text-muted">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {importPreview.map((row, i) => (
                        <tr key={i} className="border-b border-border last:border-0 hover:bg-bg-card-hover">
                          <td className="py-1.5 px-2">{row.type}</td>
                          <td className="py-1.5 px-2 font-mono font-medium">{row.registrationNumber}</td>
                          <td className="py-1.5 px-2">{row.oem || "—"}</td>
                          <td className="py-1.5 px-2">{row.model || "—"}</td>
                          <td className="py-1.5 px-2 hidden sm:table-cell">{row.category || "—"}</td>
                          <td className="py-1.5 px-2"><StatusBadge status={row.status} /></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            <div className="flex justify-end gap-2 pt-2 border-t border-border">
              <button
                onClick={resetImport}
                className="notion-button"
              >
                {importResult ? "Close" : "Cancel"}
              </button>
              {importPreview.length > 0 && !importResult && (
                <button
                  onClick={handleImport}
                  disabled={importing}
                  className="notion-button-primary disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {importing ? "Importing..." : `Import ${importPreview.length} VEP(s)`}
                </button>
              )}
            </div>
          </div>
        </Modal>
      )}
      {moveModal && (
        <Modal title={`Move VEP: ${moveModal.registrationNumber}`} onClose={() => setMoveModal(null)}>
          <div className="space-y-4">
            <p className="text-sm text-text-secondary">
              This VEP will no longer appear in Work Order creation or other lists. It will remain in the VEP Registry with a red &ldquo;Moved&rdquo; tag.
            </p>
            <div>
              <label className="notion-label">Destination Unit Name <span className="text-danger">*</span></label>
              <input
                type="text"
                required
                placeholder="e.g., 102 Workshop, BEC"
                className="notion-input"
                value={moveDestUnit}
                onChange={(e) => setMoveDestUnit(e.target.value)}
                autoFocus
              />
            </div>
            <div className="flex gap-2 pt-2 border-t border-border">
              <button
                onClick={async () => {
                  if (!moveDestUnit.trim()) return;
                  await updateVEP(moveModal.id, { isMovedOut: true, movedToUnit: moveDestUnit.trim() });
                  setMoveModal(null);
                }}
                disabled={!moveDestUnit.trim()}
                className="notion-button bg-orange-600 text-white border-orange-600 hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ArrowRightLeft size={14} /> Confirm Move
              </button>
              <button onClick={() => setMoveModal(null)} className="notion-button">Cancel</button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
