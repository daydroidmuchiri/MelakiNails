"use client";

import { useState, useTransition } from "react";
import Image from "next/image";
import {
  Plus,
  Search,
  Edit2,
  Trash2,
  X,
  Loader2,
  AlertCircle,
  Check,
} from "lucide-react";
import { formatPrice } from "@/lib/utils";
import { createProduct, updateProduct, deleteProduct } from "@/app/admin/actions";
import type { Product, Category } from "@/types";

interface ProductManagerProps {
  products: Product[];
  categories: Category[];
}

export function ProductManager({ products, categories }: ProductManagerProps) {
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isPending, startTransition] = useTransition();
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  // Form states
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [originalPrice, setOriginalPrice] = useState("");
  const [sku, setSku] = useState("");
  const [stock, setStock] = useState("");
  const [lowStockThreshold, setLowStockThreshold] = useState("5");
  const [categoryId, setCategoryId] = useState("");
  const [active, setActive] = useState(true);
  const [featured, setFeatured] = useState(false);
  const [badge, setBadge] = useState("");
  const [images, setImages] = useState<File[]>([]);
  const [existingImages, setExistingImages] = useState<string[]>([]);

  // Open modal for Create
  const handleOpenCreate = () => {
    setEditingProduct(null);
    setName("");
    setDescription("");
    setPrice("");
    setOriginalPrice("");
    setSku("");
    setStock("10");
    setLowStockThreshold("5");
    setCategoryId(categories[0]?.id || "");
    setActive(true);
    setFeatured(false);
    setBadge("");
    setImages([]);
    setExistingImages([]);
    setValidationErrors({});
    setModalOpen(true);
  };

  // Open modal for Edit
  const handleOpenEdit = (product: Product) => {
    setEditingProduct(product);
    setName(product.name);
    setDescription(product.description || "");
    setPrice(product.price.toString());
    setOriginalPrice(product.originalPrice?.toString() || "");
    setSku(product.sku || "");
    setStock(product.stock.toString());
    setLowStockThreshold(product.lowStockThreshold.toString());
    setCategoryId(product.categoryId);
    setActive(product.active);
    setFeatured(product.featured);
    setBadge(product.badge || "");
    setImages([]);
    setExistingImages(product.images);
    setValidationErrors({});
    setModalOpen(true);
  };

  // Validation
  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};
    if (!name.trim()) errors.name = "Product name is required";
    if (!price || parseFloat(price) < 0 || isNaN(parseFloat(price)))
      errors.price = "Enter a valid price (>= 0)";
    if (originalPrice && (parseFloat(originalPrice) < 0 || isNaN(parseFloat(originalPrice))))
      errors.originalPrice = "Enter a valid original price";
    if (!stock || parseInt(stock) < 0 || isNaN(parseInt(stock)))
      errors.stock = "Enter a valid stock (>= 0)";
    if (!lowStockThreshold || parseInt(lowStockThreshold) < 0 || isNaN(parseInt(lowStockThreshold)))
      errors.lowStockThreshold = "Enter a valid threshold (>= 0)";
    if (!categoryId) errors.categoryId = "Category is required";

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Submit Handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    const formData = new FormData();
    formData.append("name", name);
    formData.append("description", description);
    formData.append("price", price);
    formData.append("originalPrice", originalPrice);
    formData.append("sku", sku);
    formData.append("stock", stock);
    formData.append("lowStockThreshold", lowStockThreshold);
    formData.append("categoryId", categoryId);
    formData.append("active", active.toString());
    formData.append("featured", featured.toString());
    formData.append("badge", badge);

    // Append new uploaded images
    images.forEach((img) => formData.append("images", img));
    // Append existing images that remain
    existingImages.forEach((img) => formData.append("existingImages", img));

    startTransition(async () => {
      try {
        if (editingProduct) {
          await updateProduct(editingProduct.id, formData);
        } else {
          await createProduct(formData);
        }
        setModalOpen(false);
      } catch (error) {
        alert(error instanceof Error ? error.message : "Failed to save product.");
      }
    });
  };

  // Delete Handler
  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this product?")) return;
    startTransition(async () => {
      try {
        await deleteProduct(id);
      } catch (error) {
        alert(error instanceof Error ? error.message : "Failed to delete product.");
      }
    });
  };

  // Filtered products list
  const filteredProducts = products.filter((product) => {
    const matchesSearch =
      product.name.toLowerCase().includes(search.toLowerCase()) ||
      product.sku?.toLowerCase().includes(search.toLowerCase());
    const matchesCategory =
      categoryFilter === "all" || product.categoryId === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="space-y-6">
      {/* Search & Actions Bar */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-center bg-white p-4 rounded-xl shadow-card">
        <div className="flex flex-1 flex-col sm:flex-row gap-3 w-full">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
            <input
              type="text"
              placeholder="Search by name or SKU..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-cream-50 pl-10 pr-4 py-2 rounded-lg text-sm border border-border focus:ring-1 focus:ring-amber focus:border-amber focus:outline-none"
            />
          </div>
          {/* Category Filter */}
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="bg-cream-50 px-4 py-2 rounded-lg text-sm border border-border focus:ring-1 focus:ring-amber focus:border-amber focus:outline-none"
          >
            <option value="all">All Categories</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        <button
          onClick={handleOpenCreate}
          className="w-full sm:w-auto bg-amber hover:bg-amber-dark text-white font-semibold px-4 py-2 rounded-lg flex items-center justify-center gap-2 transition-colors duration-200 text-sm"
        >
          <Plus className="w-4 h-4" />
          Add Product
        </button>
      </div>

      {/* Products Table Card */}
      <div className="bg-white rounded-xl shadow-card overflow-hidden">
        <div className="overflow-x-auto">
          {filteredProducts.length === 0 ? (
            <div className="p-8 text-center text-sm text-muted">
              No products found matching your search.
            </div>
          ) : (
            <table className="w-full text-left border-collapse min-w-[700px]">
              <thead>
                <tr className="bg-cream-50 text-2xs font-semibold text-muted uppercase tracking-wider border-b border-border">
                  <th className="px-5 py-3">Product</th>
                  <th className="px-5 py-3">SKU</th>
                  <th className="px-5 py-3">Category</th>
                  <th className="px-5 py-3">Price</th>
                  <th className="px-5 py-3">Stock</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border text-sm">
                {filteredProducts.map((product) => {
                  const isLowStock = product.stock <= product.lowStockThreshold;
                  return (
                    <tr
                      key={product.id}
                      className="hover:bg-cream-50/50 transition-colors"
                    >
                      {/* Image + Title */}
                      <td className="px-5 py-3.5 flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg relative overflow-hidden bg-cream-200 shrink-0">
                          <Image
                            src={product.images[0] || "/placeholder.png"}
                            alt={product.name}
                            fill
                            className="object-cover"
                            sizes="40px"
                          />
                        </div>
                        <div>
                          <span className="font-semibold text-charcoal block line-clamp-1">
                            {product.name}
                          </span>
                          {product.featured && (
                            <span className="bg-amber-100 text-amber-800 text-3xs font-bold px-1.5 py-0.5 rounded uppercase tracking-wide">
                              Featured
                            </span>
                          )}
                        </div>
                      </td>

                      {/* SKU */}
                      <td className="px-5 py-3.5 text-muted font-medium uppercase tracking-wider text-xs">
                        {product.sku || "—"}
                      </td>

                      {/* Category */}
                      <td className="px-5 py-3.5 text-charcoal">
                        {product.category?.name || "—"}
                      </td>

                      {/* Price */}
                      <td className="px-5 py-3.5 font-semibold text-charcoal">
                        {formatPrice(product.price)}
                      </td>

                      {/* Stock */}
                      <td className="px-5 py-3.5">
                        <span
                          className={`inline-flex px-2 py-0.5 rounded text-xs font-bold ${
                            isLowStock
                              ? "bg-red-50 text-red-700 border border-red-100"
                              : "bg-green-50 text-green-700"
                          }`}
                        >
                          {product.stock} left
                        </span>
                      </td>

                      {/* Status */}
                      <td className="px-5 py-3.5">
                        <span
                          className={`inline-flex px-2 py-0.5 rounded-full text-2xs font-bold uppercase tracking-wider ${
                            product.active
                              ? "bg-green-100 text-green-800"
                              : "bg-charcoal-100 text-charcoal-400"
                          }`}
                        >
                          {product.active ? "Active" : "Inactive"}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="px-5 py-3.5 text-right space-x-1 whitespace-nowrap">
                        <button
                          onClick={() => handleOpenEdit(product)}
                          className="p-1.5 hover:bg-cream rounded text-charcoal-400 hover:text-amber transition-colors inline-block"
                          aria-label="Edit product"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(product.id)}
                          className="p-1.5 hover:bg-red-50 rounded text-charcoal-400 hover:text-red-600 transition-colors inline-block"
                          aria-label="Delete product"
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

      {/* Add/Edit Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-charcoal/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
            {/* Header */}
            <div className="px-6 py-4 border-b border-border flex items-center justify-between">
              <h3 className="font-display text-xl font-bold text-charcoal">
                {editingProduct ? "Edit Product" : "Add Product"}
              </h3>
              <button
                onClick={() => setModalOpen(false)}
                className="p-1.5 hover:bg-cream rounded-full text-muted hover:text-charcoal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form Scroll Container */}
            <form onSubmit={handleSubmit} className="overflow-y-auto p-6 flex-1 space-y-5">
              {/* Row 1: Name */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-charcoal block">
                  Product Name *
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full border border-border bg-cream-50 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-amber focus:border-amber"
                  placeholder="e.g. Rolling Manicure Cart Trolley"
                />
                {validationErrors.name && (
                  <p className="text-2xs text-red-600 flex items-center gap-1 font-medium mt-1">
                    <AlertCircle className="w-3 h-3" />
                    {validationErrors.name}
                  </p>
                )}
              </div>

              {/* Row 2: Category & SKU */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-charcoal block">
                    Category *
                  </label>
                  <select
                    value={categoryId}
                    onChange={(e) => setCategoryId(e.target.value)}
                    className="w-full border border-border bg-cream-50 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-amber focus:border-amber"
                  >
                    <option value="" disabled>Select category</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                  {validationErrors.categoryId && (
                    <p className="text-2xs text-red-600 flex items-center gap-1 font-medium mt-1">
                      <AlertCircle className="w-3 h-3" />
                      {validationErrors.categoryId}
                    </p>
                  )}
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-charcoal block">
                    SKU Code
                  </label>
                  <input
                    type="text"
                    value={sku}
                    onChange={(e) => setSku(e.target.value)}
                    className="w-full border border-border bg-cream-50 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-amber focus:border-amber"
                    placeholder="e.g. FUR-CART-ROLL"
                  />
                </div>
              </div>

              {/* Row 3: Price & Original Price */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-charcoal block">
                    Price (KSh) *
                  </label>
                  <input
                    type="number"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    className="w-full border border-border bg-cream-50 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-amber focus:border-amber"
                    placeholder="3850"
                  />
                  {validationErrors.price && (
                    <p className="text-2xs text-red-600 flex items-center gap-1 font-medium mt-1">
                      <AlertCircle className="w-3 h-3" />
                      {validationErrors.price}
                    </p>
                  )}
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-charcoal block">
                    Original Price (KSh) - For Sale Display
                  </label>
                  <input
                    type="number"
                    value={originalPrice}
                    onChange={(e) => setOriginalPrice(e.target.value)}
                    className="w-full border border-border bg-cream-50 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-amber focus:border-amber"
                    placeholder="5200"
                  />
                  {validationErrors.originalPrice && (
                    <p className="text-2xs text-red-600 flex items-center gap-1 font-medium mt-1">
                      <AlertCircle className="w-3 h-3" />
                      {validationErrors.originalPrice}
                    </p>
                  )}
                </div>
              </div>

              {/* Row 4: Stock & Threshold */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-charcoal block">
                    Inventory Stock *
                  </label>
                  <input
                    type="number"
                    value={stock}
                    onChange={(e) => setStock(e.target.value)}
                    className="w-full border border-border bg-cream-50 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-amber focus:border-amber"
                  />
                  {validationErrors.stock && (
                    <p className="text-2xs text-red-600 flex items-center gap-1 font-medium mt-1">
                      <AlertCircle className="w-3 h-3" />
                      {validationErrors.stock}
                    </p>
                  )}
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-charcoal block">
                    Low Stock Threshold *
                  </label>
                  <input
                    type="number"
                    value={lowStockThreshold}
                    onChange={(e) => setLowStockThreshold(e.target.value)}
                    className="w-full border border-border bg-cream-50 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-amber focus:border-amber"
                  />
                  {validationErrors.lowStockThreshold && (
                    <p className="text-2xs text-red-600 flex items-center gap-1 font-medium mt-1">
                      <AlertCircle className="w-3 h-3" />
                      {validationErrors.lowStockThreshold}
                    </p>
                  )}
                </div>
              </div>

              {/* Toggles */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-cream-100 p-4 rounded-xl">
                <label className="flex items-center gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={active}
                    onChange={(e) => setActive(e.target.checked)}
                    className="rounded border-border text-amber focus:ring-amber h-4 w-4"
                  />
                  <div>
                    <span className="text-xs font-semibold text-charcoal block">Active Status</span>
                    <span className="text-3xs text-muted block">Show on storefront</span>
                  </div>
                </label>

                <label className="flex items-center gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={featured}
                    onChange={(e) => setFeatured(e.target.checked)}
                    className="rounded border-border text-amber focus:ring-amber h-4 w-4"
                  />
                  <div>
                    <span className="text-xs font-semibold text-charcoal block">Featured Product</span>
                    <span className="text-3xs text-muted block">Pin to featured grid</span>
                  </div>
                </label>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-charcoal block">
                    Sale Badge Text
                  </label>
                  <input
                    type="text"
                    value={badge}
                    onChange={(e) => setBadge(e.target.value)}
                    className="w-full border border-border bg-white rounded-lg px-2.5 py-1 text-xs focus:outline-none"
                    placeholder="e.g. Sale, New, Hot"
                  />
                </div>
              </div>

              {/* Description */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-charcoal block">
                  Product Description
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full border border-border bg-cream-50 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-amber focus:border-amber min-h-[100px]"
                  placeholder="Detailed product information..."
                />
              </div>

              {/* Image upload */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-charcoal block">
                  Product Images
                </label>

                {/* Show existing images */}
                {existingImages.length > 0 && (
                  <div className="flex flex-wrap gap-2.5 mb-2.5">
                    {existingImages.map((imgUrl, i) => (
                      <div
                        key={imgUrl}
                        className="w-16 h-16 rounded border border-border relative overflow-hidden bg-cream-50"
                      >
                        <Image
                          src={imgUrl || "/placeholder.png"}
                          alt="product thumbnail"
                          fill
                          className="object-cover"
                          sizes="64px"
                        />
                        <button
                          type="button"
                          onClick={() =>
                            setExistingImages(existingImages.filter((_, idx) => idx !== i))
                          }
                          className="absolute top-0.5 right-0.5 bg-red-600 text-white rounded-full p-0.5 shadow-md hover:bg-red-700"
                        >
                          <X className="w-2.5 h-2.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                <div className="border-2 border-dashed border-border rounded-xl p-6 text-center hover:bg-cream-50/50 transition-colors relative cursor-pointer">
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={(e) => {
                      if (e.target.files) {
                        setImages(Array.from(e.target.files));
                      }
                    }}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                  <p className="text-xs text-muted">
                    {images.length > 0
                      ? `${images.length} files selected for upload`
                      : "Drag & drop images, or click to upload files"}
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-4 border-t border-border flex justify-end gap-3 bg-white sticky bottom-0">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="border border-border hover:bg-cream text-charcoal font-semibold px-4 py-2 rounded-lg text-sm transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="bg-amber hover:bg-amber-dark text-white font-semibold px-5 py-2 rounded-lg text-sm transition-colors flex items-center gap-2"
                >
                  {isPending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Check className="w-4 h-4" />
                  )}
                  Save Product
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
