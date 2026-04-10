"use client";

import { useState, useEffect } from "react";
import { FileStack } from "lucide-react";
import StatusBadge from "@/components/ui/StatusBadge";
import EmptyState from "@/components/ui/EmptyState";

const VOUCHER_TABS = [
  { key: "ions", label: "ION", api: "/api/ions", fields: ["referenceNumber", "dateRequested", "remarks"] },
  { key: "nacs", label: "NAC", api: "/api/nacs", fields: ["requestDate", "receivedDate", "nacStatus", "remarks"] },
  { key: "crvs", label: "CRV / RV", api: "/api/crvs", fields: ["voucherType", "voucherNumber", "vendorOrUnitName", "receiptDate"] },
  { key: "civs", label: "CIV", api: "/api/civs", fields: ["civNumber", "issueDate", "remarks"] },
];

export default function Vouchers() {
  const [activeTab, setActiveTab] = useState("ions");
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const tab = VOUCHER_TABS.find((t) => t.key === activeTab);
        const res = await fetch(tab.api);
        if (!res.ok) throw new Error("Failed to fetch data");
        const json = await res.json();
        setData(json || []);
      } catch (err) {
        console.error(err);
        setData([]);
      }
      setLoading(false);
    };
    fetchData();
  }, [activeTab]);

  const tab = VOUCHER_TABS.find((t) => t.key === activeTab);

  return (
    <div className="max-w-6xl mx-auto px-8 py-10 animate-fade-in">
      <div className="mb-8 pb-4">
        <h1 className="text-3xl font-bold text-text-primary mb-2">Vouchers</h1>
        <p className="text-sm text-text-secondary">
          Browse all IONs, NACs, CRVs, RVs, and CIVs across all job cards
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-border pb-0 mb-6 px-1">
        {VOUCHER_TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setActiveTab(t.key)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors cursor-pointer ${
              activeTab === t.key
                ? "border-text-primary text-text-primary"
                : "border-transparent text-text-muted hover:text-text-secondary"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Table */}
      {loading ? (
        <div className="text-text-muted text-sm py-4 px-2">Loading {tab.label} records...</div>
      ) : data.length === 0 ? (
        <EmptyState
          icon={FileStack}
          title={`No ${tab.label} records`}
          description={`${tab.label} vouchers will appear here once requested or created within individual job cards.`}
        />
      ) : (
        <div className="notion-card overflow-x-auto">
          <table className="w-full text-sm text-left whitespace-nowrap">
            <thead>
              <tr className="border-b border-border bg-bg-sidebar">
                <th className="py-2.5 px-4 font-medium text-text-muted">Job Card</th>
                {tab.fields.map((f) => (
                  <th key={f} className="py-2.5 px-4 font-medium text-text-muted capitalize">
                    {f.replace(/([A-Z])/g, ' $1').trim()}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.map((row) => (
                <tr
                  key={row.id}
                  className="border-b border-border last:border-0 hover:bg-bg-card-hover transition-colors group cursor-default"
                >
                  <td className="py-3 px-4 font-mono font-medium text-text-primary group-hover:text-accent transition-colors">
                    {row.jobCard?.jobCardNumber || "—"}
                  </td>
                  {tab.fields.map((f) => (
                    <td key={f} className="py-3 px-4 text-text-secondary">
                      {f === "nacStatus" || f === "voucherType" ? (
                        <StatusBadge status={row[f]} />
                      ) : (
                        row[f] || "—"
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
