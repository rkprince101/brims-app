"use client";

import { useState, useCallback } from "react";
import { Search, Truck, ClipboardList, FileText } from "lucide-react";
import { useSearch } from "@/hooks/useData";
import StatusBadge from "@/components/ui/StatusBadge";

export default function SearchHistory() {
  const { results, loading, search } = useSearch();
  const [query, setQuery] = useState("");

  const handleSearch = useCallback(
    (e) => {
      const val = e.target.value;
      setQuery(val);
      search(val);
    },
    [search]
  );

  const hasResults =
    results.veps.length > 0 ||
    results.workOrders.length > 0 ||
    results.jobCards.length > 0;

  return (
    <div className="max-w-6xl mx-auto px-8 py-10 animate-fade-in space-y-8">
      <div className="border-b border-border pb-6">
        <h1 className="text-3xl font-bold text-text-primary mb-2">
          Search & History
        </h1>
        <p className="text-sm text-text-secondary">
          Find records by VEP registration, Work Order number, or Job Card number
        </p>
      </div>

      {/* Search Bar */}
      <div className="relative max-w-2xl mt-4">
        <Search
          size={20}
          className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted"
        />
        <input
          id="global-search"
          type="text"
          value={query}
          onChange={handleSearch}
          placeholder="Type VEP number, WO number, or JC number to search..."
          className="w-full pl-12 pr-4 py-3 rounded border border-border bg-bg-main shadow-sm text-text-primary focus:outline-none focus:ring-1 focus:ring-accent focus:border-accent transition-all"
        />
      </div>

      {loading && (
        <div className="text-text-muted text-sm py-4">
          Searching for "{query}"...
        </div>
      )}

      {!loading && query.length >= 2 && !hasResults && (
        <div className="text-center py-16 border border-border border-dashed rounded bg-bg-sidebar">
          <Search size={32} className="mx-auto mb-3 text-text-muted" />
          <p className="text-text-secondary text-sm font-medium">
            No results found for "{query}"
          </p>
          <p className="text-text-muted text-xs mt-1">Try searching by exact registration or voucher number.</p>
        </div>
      )}

      {!loading && hasResults && (
        <div className="space-y-8 animate-fade-in mt-6">
          {/* VEP Results */}
          {results.veps.length > 0 && (
            <div>
              <h2 className="text-sm font-semibold text-text-primary flex items-center gap-2 mb-3 pb-1 border-b border-border">
                <Truck size={16} className="text-accent" /> VEPs ({results.veps.length})
              </h2>
              <div className="notion-card overflow-hidden">
                <table className="w-full text-sm text-left">
                  <thead>
                    <tr className="border-b border-border bg-bg-sidebar">
                      <th className="py-2 px-4 text-text-muted font-medium">Registration</th>
                      <th className="py-2 px-4 text-text-muted font-medium">Type</th>
                      <th className="py-2 px-4 text-text-muted font-medium">Ident (Engine/Chassis)</th>
                      <th className="py-2 px-4 text-text-muted font-medium">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {results.veps.map((v) => (
                      <tr key={v.id} className="border-b border-border last:border-0 hover:bg-bg-card-hover transition-colors">
                        <td className="py-3 px-4 font-mono font-medium text-text-primary">{v.registrationNumber}</td>
                        <td className="py-3 px-4 text-text-secondary">{v.type}</td>
                        <td className="py-3 px-4">
                          <div className="text-xs font-mono text-text-muted">
                            E: {v.engineNumber || "—"}<br/>
                            C: {v.chassisNumber || "—"}
                          </div>
                        </td>
                        <td className="py-3 px-4"><StatusBadge status={v.status} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Work Order Results */}
          {results.workOrders.length > 0 && (
            <div>
              <h2 className="text-sm font-semibold text-text-primary flex items-center gap-2 mb-3 pb-1 border-b border-border">
                <ClipboardList size={16} className="text-warning" /> Work Orders ({results.workOrders.length})
              </h2>
              <div className="notion-card overflow-hidden">
                <table className="w-full text-sm text-left">
                  <thead>
                    <tr className="border-b border-border bg-bg-sidebar">
                      <th className="py-2 px-4 text-text-muted font-medium">WO Number</th>
                      <th className="py-2 px-4 text-text-muted font-medium">VEP</th>
                      <th className="py-2 px-4 text-text-muted font-medium">Date</th>
                      <th className="py-2 px-4 text-text-muted font-medium">Type</th>
                      <th className="py-2 px-4 text-text-muted font-medium">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {results.workOrders.map((wo) => (
                      <tr key={wo.id} className="border-b border-border last:border-0 hover:bg-bg-card-hover transition-colors">
                        <td className="py-3 px-4 font-mono font-medium text-text-primary">{wo.workOrderNumber}</td>
                        <td className="py-3 px-4 text-text-secondary">{wo.vep?.registrationNumber || "—"}</td>
                        <td className="py-3 px-4 text-text-secondary">{wo.dateReceived}</td>
                        <td className="py-3 px-4"><StatusBadge status={wo.workType} /></td>
                        <td className="py-3 px-4"><StatusBadge status={wo.status} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Job Card Results */}
          {results.jobCards.length > 0 && (
            <div>
              <h2 className="text-sm font-semibold text-text-primary flex items-center gap-2 mb-3 pb-1 border-b border-border">
                <FileText size={16} className="text-text-primary" /> Job Cards ({results.jobCards.length})
              </h2>
              <div className="notion-card overflow-hidden">
                <table className="w-full text-sm text-left">
                  <thead>
                    <tr className="border-b border-border bg-bg-sidebar">
                      <th className="py-2 px-4 text-text-muted font-medium">JC Number</th>
                      <th className="py-2 px-4 text-text-muted font-medium">Work Order</th>
                      <th className="py-2 px-4 text-text-muted font-medium">VEP</th>
                      <th className="py-2 px-4 text-text-muted font-medium">Opened</th>
                      <th className="py-2 px-4 text-text-muted font-medium">Closed</th>
                      <th className="py-2 px-4 text-text-muted font-medium">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {results.jobCards.map((jc) => (
                      <tr key={jc.id} className="border-b border-border last:border-0 hover:bg-bg-card-hover transition-colors">
                        <td className="py-3 px-4 font-mono font-medium text-text-primary">{jc.jobCardNumber}</td>
                        <td className="py-3 px-4 text-text-secondary font-mono text-xs">{jc.workOrder?.workOrderNumber || "—"}</td>
                        <td className="py-3 px-4 text-text-secondary">{jc.workOrder?.vep?.registrationNumber || "—"}</td>
                        <td className="py-3 px-4 text-text-secondary">{jc.openedDate}</td>
                        <td className="py-3 px-4 text-text-secondary">{jc.closedDate || "—"}</td>
                        <td className="py-3 px-4"><StatusBadge status={jc.status} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Prompt when no query */}
      {!loading && query.length < 2 && (
        <div className="py-10 mt-10 border-t border-border">
          <h3 className="text-sm font-semibold text-text-primary mb-1">Search the workspace</h3>
          <p className="text-xs text-text-muted max-w-sm">
            Enter at least 2 characters to search across all active and historical VEPs, Work Orders, and Job Cards. Details such as Engine Numbers and Chassis Numbers are indexed.
          </p>
        </div>
      )}
    </div>
  );
}
