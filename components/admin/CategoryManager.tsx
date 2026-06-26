"use client";

import { useState, useTransition } from "react";
import Image from "next/image";
import {
  Plus,
  Edit2,
  Trash2,
  X,
  Loader2,
  AlertCircle,
  Check,
} from "lucide-react";
import { createCategory, updateCategory, deleteCategory } from "@/app/admin/actions";
import type { Category } from "@/types";

interface CategoryManagerProps {
  categories: Category[];
}

export function CategoryManager({ categories }: CategoryManagerProps) {
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [isPending, startTransition] = useTransition();
  const [validationError, setValidationError] = useState("");

  // Form states
  const [name, setName] = useState("");
  const [displayOrder, setDisplayOrder] = useState("0");
  const [active, setActive] = useState(true);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [existingImage, setExistingImage] = useState<string | null>(null);

  // Open modal for Create
  const handleOpenCreate = () => {
    setEditingCategory(null);
    setName("");
    setDisplayOrder("0");
    setActive(true);
    setImageFile(null);
    setExistingImage(null);
    setValidationError("");
    setModalOpen(true);
  };

  // Open modal for Edit
  const handleOpenEdit = (category: Category) => {
    setEditingCategory(category);
    setName(category.name);
    setDisplayOrder(category.displayOrder?.toString() || "0");
    setActive(category.active ?? true);
    setImageFile(null);
    setExistingImage(category.image || null);
    setValidationError("");
    setModalOpen(true);
  };

  // Submit Handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setValidationError("Category name is required");
      return;
    }

    const formData = new FormData();
    formData.append("name", name);
    formData.append("displayOrder", displayOrder);
    formData.append("active", active.toString());
    if (imageFile) {
      formData.append("image", imageFile);
    }
    if (existingImage) {
      formData.append("existingImage", existingImage);
    }

    startTransition(async () => {
      if (editingCategory) {
        await updateCategory(editingCategory.id, formData);
      } else {
        await createCategory(formData);
      }
      setModalOpen(false);
    });
  };

  // Delete Handler
  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this category? It will fail if products are linked to it.")) return;
    startTransition(async () => {
      try {
        await deleteCategory(id);
      } catch {
        alert("Cannot delete this category because there are active products inside it.");
      }
    });
  };

  return (
    <div className="space-y-6">
      {/* Category header and creation bar */}
      <div className="flex justify-end items-center bg-white p-4 rounded-xl shadow-card">
        <button
          onClick={handleOpenCreate}
          className="bg-amber hover:bg-amber-dark text-white font-semibold px-4 py-2 rounded-lg flex items-center gap-2 transition-colors duration-200 text-sm"
        >
          <Plus className="w-4 h-4" />
          Add Category
        </button>
      </div>

      {/* Categories Table Card */}
      <div className="bg-white rounded-xl shadow-card overflow-hidden">
        <div className="overflow-x-auto">
          {categories.length === 0 ? (
            <div className="p-8 text-center text-sm text-muted">
              No categories configured yet.
            </div>
          ) : (
            <table className="w-full text-left border-collapse min-w-[500px]">
              <thead>
                <tr className="bg-cream-50 text-2xs font-semibold text-muted uppercase tracking-wider border-b border-border">
                  <th className="px-5 py-3">Category</th>
                  <th className="px-5 py-3">Display Order</th>
                  <th className="px-5 py-3">Product Count</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border text-sm">
                {categories.map((category) => (
                  <tr
                    key={category.id}
                    className="hover:bg-cream-50/50 transition-colors"
                  >
                    {/* Image + Title */}
                    <td className="px-5 py-3.5 flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg relative overflow-hidden bg-cream-200 shrink-0 border border-border">
                        <Image
                          src={category.image || "https://images.unsplash.com/photo-1604654894610-df63bc536371?w=200&q=80"}
                          alt={category.name}
                          fill
                          className="object-cover"
                          sizes="40px"
                        />
                      </div>
                      <span className="font-semibold text-charcoal block">
                        {category.name}
                      </span>
                    </td>

                    {/* Display Order */}
                    <td className="px-5 py-3.5 text-muted font-medium text-xs">
                      {category.displayOrder ?? 0}
                    </td>

                    {/* Product count */}
                    <td className="px-5 py-3.5 font-semibold text-charcoal">
                      {category._count?.products ?? 0} items
                    </td>

                    {/* Status */}
                    <td className="px-5 py-3.5">
                      <span
                        className={`inline-flex px-2 py-0.5 rounded-full text-2xs font-bold uppercase tracking-wider ${
                          category.active
                            ? "bg-green-100 text-green-800"
                            : "bg-charcoal-100 text-charcoal-400"
                        }`}
                      >
                        {category.active ? "Active" : "Inactive"}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="px-5 py-3.5 text-right space-x-1 whitespace-nowrap">
                      <button
                        onClick={() => handleOpenEdit(category)}
                        className="p-1.5 hover:bg-cream rounded text-charcoal-400 hover:text-amber transition-colors inline-block"
                        aria-label="Edit category"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(category.id)}
                        disabled={(category._count?.products ?? 0) > 0}
                        className={`p-1.5 rounded inline-block transition-colors ${
                          (category._count?.products ?? 0) > 0
                            ? "text-charcoal-100 cursor-not-allowed"
                            : "hover:bg-red-50 text-charcoal-400 hover:text-red-600"
                        }`}
                        aria-label="Delete category"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Add/Edit Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-charcoal/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col">
            {/* Header */}
            <div className="px-6 py-4 border-b border-border flex items-center justify-between">
              <h3 className="font-display text-lg font-bold text-charcoal">
                {editingCategory ? "Edit Category" : "Add Category"}
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
              {/* Name */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-charcoal block">
                  Category Name *
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full border border-border bg-cream-50 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-amber"
                  placeholder="e.g. Nail Tools"
                />
                {validationError && (
                  <p className="text-2xs text-red-600 flex items-center gap-1 font-medium mt-1">
                    <AlertCircle className="w-3 h-3" />
                    {validationError}
                  </p>
                )}
              </div>

              {/* Display Order */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-charcoal block">
                  Display Order
                </label>
                <input
                  type="number"
                  value={displayOrder}
                  onChange={(e) => setDisplayOrder(e.target.value)}
                  className="w-full border border-border bg-cream-50 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-amber"
                  placeholder="0"
                />
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
                  <span className="text-3xs text-muted block">Show/Filter in storefront navigation</span>
                </div>
              </label>

              {/* Cover Image Upload */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-charcoal block">
                  Cover Image
                </label>

                {existingImage && existingImage.trim() !== "" && !imageFile && (
                  <div className="w-16 h-16 rounded border border-border relative overflow-hidden bg-cream-50 mb-2">
                    <Image
                      src={existingImage || "/placeholder.jpg"}
                      alt="thumbnail"
                      fill
                      className="object-cover"
                      sizes="64px"
                    />
                    <button
                      type="button"
                      onClick={() => setExistingImage(null)}
                      className="absolute top-0.5 right-0.5 bg-red-600 text-white rounded-full p-0.5 hover:bg-red-700"
                    >
                      <X className="w-2.5 h-2.5" />
                    </button>
                  </div>
                )}

                <div className="border border-dashed border-border rounded-lg p-4 text-center hover:bg-cream-50/55 transition-colors relative cursor-pointer">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        setImageFile(e.target.files[0]);
                      }
                    }}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                  <p className="text-2xs text-muted">
                    {imageFile ? imageFile.name : "Choose category cover image"}
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
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
                  Save Category
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
