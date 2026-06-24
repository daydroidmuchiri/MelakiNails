"use client";

import { useState, useTransition } from "react";
import { Plus, Edit2, Trash2, X, Loader2, AlertCircle, Check, Percent } from "lucide-react";
import { createPromotion, updatePromotion, deletePromotion } from "@/app/admin/actions";

interface Promotion {
  id: string;
  title: string;
  description: string | null;
  discountPercentage: number;
  active: boolean;
  startDate: string | Date;
  endDate: string | Date;
}

interface PromotionManagerProps {
  promotions: Promotion[];
}

export function PromotionManager({ promotions }: PromotionManagerProps) {
  const [modalOpen, setModalOpen] = useState(false);
  const [editingPromotion, setEditingPromotion] = useState<Promotion | null>(null);
  const [isPending, startTransition] = useTransition();
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  // Form states
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [discountPercentage, setDiscountPercentage] = useState("10");
  const [active, setActive] = useState(true);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const handleOpenCreate = () => {
    setEditingPromotion(null);
    setTitle("");
    setDescription("");
    setDiscountPercentage("15");
    setActive(true);
    setStartDate(new Date().toISOString().split("T")[0]);
    setEndDate(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]);
    setValidationErrors({});
    setModalOpen(true);
  };

  const handleOpenEdit = (promo: Promotion) => {
    setEditingPromotion(promo);
    setTitle(promo.title);
    setDescription(promo.description || "");
    setDiscountPercentage(promo.discountPercentage.toString());
    setActive(promo.active);
    setStartDate(new Date(promo.startDate).toISOString().split("T")[0]);
    setEndDate(new Date(promo.endDate).toISOString().split("T")[0]);
    setValidationErrors({});
    setModalOpen(true);
  };

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};
    if (!title.trim()) errors.title = "Promotion title is required";
    
    const pct = parseFloat(discountPercentage);
    if (isNaN(pct) || pct <= 0 || pct > 100) {
      errors.discountPercentage = "Discount must be between 1% and 100%";
    }
    
    if (!startDate) errors.startDate = "Start date is required";
    if (!endDate) errors.endDate = "End date is required";
    
    if (startDate && endDate && new Date(startDate) > new Date(endDate)) {
      errors.endDate = "End date must be after start date";
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    const formData = new FormData();
    formData.append("title", title);
    formData.append("description", description);
    formData.append("discountPercentage", discountPercentage);
    formData.append("active", active.toString());
    formData.append("startDate", startDate);
    formData.append("endDate", endDate);

    startTransition(async () => {
      if (editingPromotion) {
        await updatePromotion(editingPromotion.id, formData);
      } else {
        await createPromotion(formData);
      }
      setModalOpen(false);
    });
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this promotion?")) return;
    startTransition(async () => {
      await deletePromotion(id);
    });
  };

  return (
    <div className="space-y-6">
      {/* Header action */}
      <div className="flex justify-end items-center bg-white p-4 rounded-xl shadow-card">
        <button
          onClick={handleOpenCreate}
          className="bg-amber hover:bg-amber-dark text-white font-semibold px-4 py-2 rounded-lg flex items-center gap-2 transition-colors duration-200 text-sm"
        >
          <Plus className="w-4 h-4" />
          Create Promotion
        </button>
      </div>

      {/* Promotions Table Card */}
      <div className="bg-white rounded-xl shadow-card overflow-hidden">
        <div className="overflow-x-auto">
          {promotions.length === 0 ? (
            <div className="p-8 text-center text-sm text-muted">
              No promotions or discount campaigns configured yet.
            </div>
          ) : (
            <table className="w-full text-left border-collapse min-w-[600px]">
              <thead>
                <tr className="bg-cream-50 text-2xs font-semibold text-muted uppercase tracking-wider border-b border-border">
                  <th className="px-5 py-3">Promotion Campaign</th>
                  <th className="px-5 py-3 text-center">Discount</th>
                  <th className="px-5 py-3">Duration</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border text-sm">
                {promotions.map((promo) => {
                  const isCurrent =
                    new Date(promo.startDate) <= new Date() &&
                    new Date(promo.endDate) >= new Date();
                  
                  return (
                    <tr
                      key={promo.id}
                      className="hover:bg-cream-50/50 transition-colors"
                    >
                      {/* Title & Description */}
                      <td className="px-5 py-3.5">
                        <span className="font-semibold text-charcoal block">
                          {promo.title}
                        </span>
                        {promo.description && (
                          <span className="text-3xs text-muted block line-clamp-1 max-w-[300px]">
                            {promo.description}
                          </span>
                        )}
                      </td>

                      {/* Discount Percent */}
                      <td className="px-5 py-3.5 text-center">
                        <span className="bg-amber-100 text-amber-800 text-xs font-bold px-2 py-0.5 rounded-full inline-flex items-center gap-0.5">
                          <Percent className="w-3.5 h-3.5" />
                          {promo.discountPercentage}% OFF
                        </span>
                      </td>

                      {/* Date bounds */}
                      <td className="px-5 py-3.5 text-xs text-muted whitespace-nowrap">
                        {new Date(promo.startDate).toLocaleDateString()} —{" "}
                        {new Date(promo.endDate).toLocaleDateString()}
                      </td>

                      {/* Status */}
                      <td className="px-5 py-3.5">
                        <span
                          className={`inline-flex px-2 py-0.5 rounded-full text-2xs font-bold uppercase tracking-wider ${
                            promo.active && isCurrent
                              ? "bg-green-100 text-green-800"
                              : !promo.active
                              ? "bg-charcoal-100 text-charcoal-400"
                              : "bg-amber-100 text-amber-800" // Scheduled/Expired
                          }`}
                        >
                          {promo.active && isCurrent
                            ? "Active Now"
                            : !promo.active
                            ? "Disabled"
                            : new Date(promo.startDate) > new Date()
                            ? "Scheduled"
                            : "Expired"}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="px-5 py-3.5 text-right space-x-1 whitespace-nowrap">
                        <button
                          onClick={() => handleOpenEdit(promo)}
                          className="p-1.5 hover:bg-cream rounded text-charcoal-400 hover:text-amber transition-colors inline-block"
                          aria-label="Edit promotion"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(promo.id)}
                          className="p-1.5 hover:bg-red-50 rounded text-charcoal-400 hover:text-red-600 transition-colors inline-block"
                          aria-label="Delete promotion"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-charcoal/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col">
            {/* Header */}
            <div className="px-6 py-4 border-b border-border flex items-center justify-between">
              <h3 className="font-display text-lg font-bold text-charcoal">
                {editingPromotion ? "Edit Promotion" : "Create Promotion"}
              </h3>
              <button
                onClick={() => setModalOpen(false)}
                className="p-1.5 hover:bg-cream rounded-full text-muted hover:text-charcoal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {/* Title */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-charcoal block">
                  Campaign Title *
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full border border-border bg-cream-50 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-amber"
                  placeholder="e.g. Easter Sales Event"
                />
                {validationErrors.title && (
                  <p className="text-2xs text-red-600 flex items-center gap-1 font-medium mt-1">
                    <AlertCircle className="w-3 h-3" />
                    {validationErrors.title}
                  </p>
                )}
              </div>

              {/* Discount Percentage */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-charcoal block">
                  Discount Percentage (%) *
                </label>
                <input
                  type="number"
                  value={discountPercentage}
                  onChange={(e) => setDiscountPercentage(e.target.value)}
                  className="w-full border border-border bg-cream-50 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-amber"
                  placeholder="15"
                />
                {validationErrors.discountPercentage && (
                  <p className="text-2xs text-red-600 flex items-center gap-1 font-medium mt-1">
                    <AlertCircle className="w-3 h-3" />
                    {validationErrors.discountPercentage}
                  </p>
                )}
              </div>

              {/* Date inputs */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-charcoal block">
                    Start Date *
                  </label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full border border-border bg-cream-50 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-amber"
                  />
                  {validationErrors.startDate && (
                    <p className="text-2xs text-red-600 flex items-center gap-1 font-medium mt-1">
                      <AlertCircle className="w-3 h-3" />
                      {validationErrors.startDate}
                    </p>
                  )}
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-charcoal block">
                    End Date *
                  </label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full border border-border bg-cream-50 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-amber"
                  />
                  {validationErrors.endDate && (
                    <p className="text-2xs text-red-600 flex items-center gap-1 font-medium mt-1">
                      <AlertCircle className="w-3 h-3" />
                      {validationErrors.endDate}
                    </p>
                  )}
                </div>
              </div>

              {/* Active Toggle */}
              <label className="flex items-center gap-2.5 cursor-pointer bg-cream-100 p-3 rounded-lg">
                <input
                  type="checkbox"
                  checked={active}
                  onChange={(e) => setActive(e.target.checked)}
                  className="rounded border-border text-amber focus:ring-amber h-4 w-4"
                />
                <div>
                  <span className="text-xs font-semibold text-charcoal block">Active Status</span>
                  <span className="text-3xs text-muted block">Activate campaign rules</span>
                </div>
              </label>

              {/* Description */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-charcoal block">
                  Description
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full border border-border bg-cream-50 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-amber min-h-[60px]"
                  placeholder="Promotion campaign brief details..."
                />
              </div>

              {/* Action buttons */}
              <div className="pt-4 border-t border-border flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="border border-border hover:bg-cream text-charcoal font-semibold px-4 py-2 rounded-lg text-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="bg-amber hover:bg-amber-dark text-white font-semibold px-5 py-2 rounded-lg text-sm flex items-center gap-2"
                >
                  {isPending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Check className="w-4 h-4" />
                  )}
                  Save Promotion
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
