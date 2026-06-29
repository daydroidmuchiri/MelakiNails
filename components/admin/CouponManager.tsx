"use client";

import { useState } from "react";
import { formatPrice } from "@/lib/utils";
import { Plus, Trash2, CheckCircle, XCircle, Ticket, RefreshCw } from "lucide-react";
import { useRouter } from "next/navigation";

interface Coupon {
  id: string;
  code: string;
  description: string | null;
  percentageDiscount: number | null;
  fixedDiscount: number | string | null;
  minimumOrder: number | string | null;
  usageLimit: number | null;
  perCustomerLimit: number | null;
  freeShipping: boolean;
  active: boolean;
  expiryDate: string | null;
  createdAt: string;
  _count: { usages: number; orders: number };
}

interface Props {
  initialCoupons: Coupon[];
}

const emptyForm = {
  code: "",
  description: "",
  percentageDiscount: "",
  fixedDiscount: "",
  minimumOrder: "",
  usageLimit: "",
  perCustomerLimit: "1",
  freeShipping: false,
  active: true,
  expiryDate: "",
};

export default function CouponManager({ initialCoupons }: Props) {
  const router = useRouter();
  const [coupons] = useState<Coupon[]>(initialCoupons);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.code.trim()) return;
    setSaving(true);
    setError(null);

    try {
      const res = await fetch("/api/admin/coupons", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: form.code.trim().toUpperCase(),
          description: form.description || null,
          percentageDiscount: form.percentageDiscount ? Number(form.percentageDiscount) : null,
          fixedDiscount: form.fixedDiscount ? Number(form.fixedDiscount) : null,
          minimumOrder: form.minimumOrder ? Number(form.minimumOrder) : null,
          usageLimit: form.usageLimit ? Number(form.usageLimit) : null,
          perCustomerLimit: form.perCustomerLimit ? Number(form.perCustomerLimit) : 1,
          freeShipping: form.freeShipping,
          active: form.active,
          expiryDate: form.expiryDate ? new Date(form.expiryDate).toISOString() : null,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to create coupon");
      }

      setShowForm(false);
      setForm(emptyForm);
      router.refresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to create coupon");
    } finally {
      setSaving(false);
    }
  };

  const handleToggle = async (id: string, active: boolean) => {
    await fetch("/api/admin/coupons", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, active: !active }),
    });
    router.refresh();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this coupon? This cannot be undone.")) return;
    await fetch("/api/admin/coupons", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    router.refresh();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-display text-2xl font-bold text-charcoal">Coupons</h2>
          <p className="text-sm text-muted mt-0.5">
            Create and manage discount codes for your customers.
          </p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="inline-flex items-center gap-2 bg-amber hover:bg-amber-dark text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition-colors"
        >
          <Plus className="w-4 h-4" />
          New Coupon
        </button>
      </div>

      {/* Create Form */}
      {showForm && (
        <div className="bg-white rounded-2xl shadow-card p-6 border border-border">
          <h3 className="text-base font-semibold text-charcoal mb-5">Create New Coupon</h3>
          <form onSubmit={handleCreate} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-charcoal mb-1.5">
                Coupon Code <span className="text-badge-sale">*</span>
              </label>
              <input
                type="text"
                placeholder="e.g. SAVE20"
                value={form.code}
                onChange={(e) => setForm((f) => ({ ...f, code: e.target.value.toUpperCase() }))}
                className="input-base uppercase"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-charcoal mb-1.5">Description</label>
              <input
                type="text"
                placeholder="20% off all orders"
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                className="input-base"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-charcoal mb-1.5">
                Percentage Discount (%)
              </label>
              <input
                type="number"
                placeholder="e.g. 20"
                min="1"
                max="100"
                value={form.percentageDiscount}
                onChange={(e) => setForm((f) => ({ ...f, percentageDiscount: e.target.value }))}
                className="input-base"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-charcoal mb-1.5">
                Fixed Discount (KES)
              </label>
              <input
                type="number"
                placeholder="e.g. 500"
                min="0"
                value={form.fixedDiscount}
                onChange={(e) => setForm((f) => ({ ...f, fixedDiscount: e.target.value }))}
                className="input-base"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-charcoal mb-1.5">
                Minimum Order (KES)
              </label>
              <input
                type="number"
                placeholder="e.g. 2000"
                min="0"
                value={form.minimumOrder}
                onChange={(e) => setForm((f) => ({ ...f, minimumOrder: e.target.value }))}
                className="input-base"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-charcoal mb-1.5">
                Usage Limit (total)
              </label>
              <input
                type="number"
                placeholder="Leave blank for unlimited"
                min="1"
                value={form.usageLimit}
                onChange={(e) => setForm((f) => ({ ...f, usageLimit: e.target.value }))}
                className="input-base"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-charcoal mb-1.5">
                Per-Customer Limit
              </label>
              <input
                type="number"
                min="1"
                value={form.perCustomerLimit}
                onChange={(e) => setForm((f) => ({ ...f, perCustomerLimit: e.target.value }))}
                className="input-base"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-charcoal mb-1.5">
                Expiry Date
              </label>
              <input
                type="date"
                value={form.expiryDate}
                onChange={(e) => setForm((f) => ({ ...f, expiryDate: e.target.value }))}
                className="input-base"
              />
            </div>
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.freeShipping}
                  onChange={(e) => setForm((f) => ({ ...f, freeShipping: e.target.checked }))}
                  className="rounded border-border"
                />
                <span className="text-xs font-medium text-charcoal">Free Shipping</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.active}
                  onChange={(e) => setForm((f) => ({ ...f, active: e.target.checked }))}
                  className="rounded border-border"
                />
                <span className="text-xs font-medium text-charcoal">Active</span>
              </label>
            </div>
            {error && (
              <div className="sm:col-span-2 text-xs text-badge-sale bg-red-50 rounded-lg px-3 py-2">
                {error}
              </div>
            )}
            <div className="sm:col-span-2 flex gap-3 pt-2">
              <button
                type="submit"
                disabled={saving}
                className="bg-amber hover:bg-amber-dark text-white text-sm font-bold px-5 py-2.5 rounded-xl transition-colors disabled:opacity-70"
              >
                {saving ? "Creating..." : "Create Coupon"}
              </button>
              <button
                type="button"
                onClick={() => { setShowForm(false); setForm(emptyForm); setError(null); }}
                className="bg-cream hover:bg-border text-charcoal text-sm font-medium px-5 py-2.5 rounded-xl transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Coupons Table */}
      <div className="bg-white rounded-2xl shadow-card overflow-hidden">
        {coupons.length === 0 ? (
          <div className="py-16 text-center">
            <Ticket className="w-10 h-10 text-muted/30 mx-auto mb-3" />
            <p className="text-sm text-muted">No coupons yet. Create one above!</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-cream text-xs font-semibold text-muted uppercase tracking-wider border-b border-border">
                  <th className="px-5 py-3">Code</th>
                  <th className="px-5 py-3">Discount</th>
                  <th className="px-5 py-3">Min. Order</th>
                  <th className="px-5 py-3">Usages</th>
                  <th className="px-5 py-3">Expiry</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border text-sm">
                {coupons.map((coupon) => (
                  <tr key={coupon.id} className="hover:bg-cream/50 transition-colors">
                    <td className="px-5 py-4">
                      <span className="font-mono font-bold text-charcoal text-xs bg-cream px-2 py-0.5 rounded">
                        {coupon.code}
                      </span>
                      {coupon.freeShipping && (
                        <span className="ml-2 text-2xs bg-badge-new/10 text-badge-new border border-badge-new/20 rounded px-1.5 py-0.5">
                          + Free Ship
                        </span>
                      )}
                      {coupon.description && (
                        <p className="text-2xs text-muted mt-0.5">{coupon.description}</p>
                      )}
                    </td>
                    <td className="px-5 py-4 text-charcoal font-medium">
                      {coupon.percentageDiscount
                        ? `${coupon.percentageDiscount}%`
                        : coupon.fixedDiscount
                        ? `KES ${Number(coupon.fixedDiscount).toLocaleString("en-KE")}`
                        : "—"}
                    </td>
                    <td className="px-5 py-4 text-muted">
                      {coupon.minimumOrder
                        ? formatPrice(Number(coupon.minimumOrder))
                        : "No min."}
                    </td>
                    <td className="px-5 py-4 text-muted">
                      {coupon._count.usages}
                      {coupon.usageLimit ? ` / ${coupon.usageLimit}` : " / ∞"}
                    </td>
                    <td className="px-5 py-4 text-muted">
                      {coupon.expiryDate
                        ? new Date(coupon.expiryDate).toLocaleDateString("en-KE")
                        : "Never"}
                    </td>
                    <td className="px-5 py-4">
                      {coupon.active ? (
                        <span className="inline-flex items-center gap-1 text-xs font-semibold text-badge-new bg-badge-new/10 px-2 py-0.5 rounded-full">
                          <CheckCircle className="w-3 h-3" /> Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs font-semibold text-muted bg-border px-2 py-0.5 rounded-full">
                          <XCircle className="w-3 h-3" /> Inactive
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleToggle(coupon.id, coupon.active)}
                          className="p-1.5 text-muted hover:text-amber transition-colors"
                          title={coupon.active ? "Disable" : "Enable"}
                        >
                          <RefreshCw className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(coupon.id)}
                          className="p-1.5 text-muted hover:text-badge-sale transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
