"use client";

import { useState } from "react";
import { BarChart3, FileSpreadsheet, FileText, Loader2 } from "lucide-react";

const PERIODS = [
  { value: "daily", label: "Today" },
  { value: "weekly", label: "Last 7 Days" },
  { value: "monthly", label: "This Month" },
  { value: "custom", label: "Custom Range" },
];

export default function AdminReportsPage() {
  const [period, setPeriod] = useState("monthly");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [loading, setLoading] = useState<string | null>(null);

  const handleExport = async (format: "xlsx" | "pdf") => {
    setLoading(format);

    const params = new URLSearchParams({ period, format });
    if (period === "custom") {
      if (!from || !to) {
        alert("Please select a date range for custom period.");
        setLoading(null);
        return;
      }
      params.set("from", from);
      params.set("to", to);
    }

    try {
      const res = await fetch(`/api/reports/export?${params.toString()}`);
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to export report");
      }

      const blob = await res.blob();
      const ext = format === "xlsx" ? "xlsx" : "pdf";
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `melaki-sales-${period}-${Date.now()}.${ext}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Export failed");
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-display text-2xl font-bold text-charcoal">Sales Reports</h2>
          <p className="text-sm text-muted mt-0.5">
            Export sales data in Excel or PDF format.
          </p>
        </div>
      </div>

      {/* Controls */}
      <div className="bg-white rounded-2xl shadow-card p-6">
        <div className="flex flex-wrap items-end gap-4">
          {/* Period selector */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-charcoal block">Report Period</label>
            <div className="flex flex-wrap gap-2">
              {PERIODS.map((p) => (
                <button
                  key={p.value}
                  onClick={() => setPeriod(p.value)}
                  className={`px-3.5 py-2 text-xs font-semibold rounded-lg border transition-colors ${
                    period === p.value
                      ? "bg-amber text-white border-amber"
                      : "bg-white text-muted border-border hover:border-amber hover:text-amber"
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {/* Custom range */}
          {period === "custom" && (
            <div className="flex items-center gap-3">
              <div>
                <label className="text-xs font-semibold text-charcoal block mb-1">From</label>
                <input
                  type="date"
                  value={from}
                  onChange={(e) => setFrom(e.target.value)}
                  className="input-base text-xs py-2"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-charcoal block mb-1">To</label>
                <input
                  type="date"
                  value={to}
                  onChange={(e) => setTo(e.target.value)}
                  className="input-base text-xs py-2"
                />
              </div>
            </div>
          )}
        </div>

        {/* Export buttons */}
        <div className="flex flex-wrap gap-3 mt-6 pt-5 border-t border-border">
          <button
            onClick={() => handleExport("xlsx")}
            disabled={loading !== null}
            className="inline-flex items-center gap-2 bg-badge-new hover:bg-green-700 text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition-colors disabled:opacity-60"
          >
            {loading === "xlsx" ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <FileSpreadsheet className="w-4 h-4" />
            )}
            Export Excel (.xlsx)
          </button>
          <button
            onClick={() => handleExport("pdf")}
            disabled={loading !== null}
            className="inline-flex items-center gap-2 bg-badge-sale hover:bg-red-700 text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition-colors disabled:opacity-60"
          >
            {loading === "pdf" ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <FileText className="w-4 h-4" />
            )}
            Export PDF
          </button>
        </div>
      </div>

      {/* Info card */}
      <div className="bg-white rounded-2xl shadow-card p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center">
            <BarChart3 className="w-5 h-5 text-amber" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-charcoal">Report Contents</h3>
            <p className="text-xs text-muted">What&apos;s included in your export</p>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
          <div className="bg-cream rounded-xl p-4">
            <p className="font-semibold text-charcoal mb-1">Excel Export</p>
            <ul className="space-y-1 text-muted list-disc list-inside">
              <li>Summary sheet with totals</li>
              <li>Orders sheet with line items</li>
              <li>Items sold sheet by product</li>
              <li>Revenue and payment data</li>
            </ul>
          </div>
          <div className="bg-cream rounded-xl p-4">
            <p className="font-semibold text-charcoal mb-1">PDF Export</p>
            <ul className="space-y-1 text-muted list-disc list-inside">
              <li>Summary statistics</li>
              <li>Order listing with status</li>
              <li>Payment receipt references</li>
              <li>MELAKI branded header</li>
            </ul>
          </div>
          <div className="bg-cream rounded-xl p-4">
            <p className="font-semibold text-charcoal mb-1">Data Filters</p>
            <ul className="space-y-1 text-muted list-disc list-inside">
              <li>Excludes cancelled orders</li>
              <li>Date range filtering</li>
              <li>All payment methods included</li>
              <li>Real-time data from database</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
