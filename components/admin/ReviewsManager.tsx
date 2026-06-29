"use client";

import { useState } from "react";
import { CheckCircle, XCircle, Trash2, Star, AlertCircle } from "lucide-react";
import { useRouter } from "next/navigation";

interface Review {
  id: string;
  customerName: string;
  customerEmail: string | null;
  rating: number;
  title: string;
  comment: string;
  approved: boolean;
  verifiedPurchase: boolean;
  createdAt: string;
  product: { name: string; slug: string };
}

interface Props {
  initialReviews: Review[];
}

export default function ReviewsManager({ initialReviews }: Props) {
  const router = useRouter();
  const [filter, setFilter] = useState<"all" | "pending" | "approved">("pending");
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const reviews = initialReviews.filter((r) => {
    if (filter === "pending") return !r.approved;
    if (filter === "approved") return r.approved;
    return true;
  });

  const handleApprove = async (id: string) => {
    setActionLoading(id);
    await fetch("/api/reviews", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, approved: true }),
    });
    setActionLoading(null);
    router.refresh();
  };

  const handleReject = async (id: string) => {
    setActionLoading(id);
    await fetch("/api/reviews", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, approved: false }),
    });
    setActionLoading(null);
    router.refresh();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Permanently delete this review?")) return;
    setActionLoading(id);
    await fetch("/api/reviews", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    setActionLoading(null);
    router.refresh();
  };

  const pending = initialReviews.filter((r) => !r.approved).length;
  const approved = initialReviews.filter((r) => r.approved).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-display text-2xl font-bold text-charcoal">Product Reviews</h2>
          <p className="text-sm text-muted mt-0.5">
            Moderate customer reviews before they appear on the storefront.
          </p>
        </div>
        <div className="flex items-center gap-3">
          {pending > 0 && (
            <span className="inline-flex items-center gap-1.5 bg-amber-50 text-amber border border-amber-100 text-xs font-bold px-3 py-1 rounded-full">
              <AlertCircle className="w-3.5 h-3.5" />
              {pending} pending
            </span>
          )}
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-1 bg-cream rounded-xl p-1 w-fit">
        {(["pending", "approved", "all"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setFilter(tab)}
            className={`px-4 py-1.5 rounded-lg text-xs font-semibold capitalize transition-colors ${
              filter === tab
                ? "bg-white text-charcoal shadow-sm"
                : "text-muted hover:text-charcoal"
            }`}
          >
            {tab} {tab === "pending" ? `(${pending})` : tab === "approved" ? `(${approved})` : `(${initialReviews.length})`}
          </button>
        ))}
      </div>

      {/* Reviews List */}
      {reviews.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-card py-16 text-center">
          <Star className="w-10 h-10 text-muted/30 mx-auto mb-3" />
          <p className="text-sm text-muted">No {filter === "all" ? "" : filter} reviews.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {reviews.map((review) => (
            <div
              key={review.id}
              className={`bg-white rounded-2xl shadow-card p-5 border-l-4 ${
                review.approved ? "border-badge-new" : "border-amber"
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  {/* Product & Meta */}
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    <span className="text-xs font-semibold text-amber bg-amber-50 border border-amber-100 px-2 py-0.5 rounded">
                      {review.product.name}
                    </span>
                    {review.verifiedPurchase && (
                      <span className="text-2xs font-semibold text-badge-new bg-badge-new/10 border border-badge-new/20 px-2 py-0.5 rounded flex items-center gap-1">
                        <CheckCircle className="w-2.5 h-2.5" /> Verified Purchase
                      </span>
                    )}
                    {!review.approved && (
                      <span className="text-2xs font-semibold text-amber bg-amber/10 border border-amber/20 px-2 py-0.5 rounded">
                        Pending Approval
                      </span>
                    )}
                  </div>

                  {/* Rating Stars */}
                  <div className="flex items-center gap-0.5 mb-1">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star
                        key={i}
                        className={`w-3.5 h-3.5 ${
                          i < review.rating ? "fill-amber text-amber" : "text-border"
                        }`}
                      />
                    ))}
                    <span className="ml-1 text-xs text-muted">({review.rating}/5)</span>
                  </div>

                  {/* Review title and comment */}
                  <p className="text-sm font-bold text-charcoal mb-0.5">{review.title}</p>
                  <p className="text-xs text-muted leading-relaxed line-clamp-3">{review.comment}</p>

                  {/* Customer info */}
                  <p className="text-2xs text-muted mt-2">
                    By <strong className="text-charcoal">{review.customerName}</strong>
                    {review.customerEmail && ` — ${review.customerEmail}`}
                    {" · "}
                    {new Date(review.createdAt).toLocaleDateString("en-KE")}
                  </p>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 shrink-0">
                  {!review.approved && (
                    <button
                      onClick={() => handleApprove(review.id)}
                      disabled={actionLoading === review.id}
                      className="flex items-center gap-1.5 bg-badge-new/10 hover:bg-badge-new/20 text-badge-new text-xs font-semibold px-3 py-1.5 rounded-xl transition-colors border border-badge-new/20"
                    >
                      <CheckCircle className="w-3.5 h-3.5" />
                      Approve
                    </button>
                  )}
                  {review.approved && (
                    <button
                      onClick={() => handleReject(review.id)}
                      disabled={actionLoading === review.id}
                      className="flex items-center gap-1.5 bg-amber-50 hover:bg-amber-100 text-amber text-xs font-semibold px-3 py-1.5 rounded-xl transition-colors border border-amber-100"
                    >
                      <XCircle className="w-3.5 h-3.5" />
                      Unapprove
                    </button>
                  )}
                  <button
                    onClick={() => handleDelete(review.id)}
                    disabled={actionLoading === review.id}
                    className="p-1.5 text-muted hover:text-badge-sale transition-colors"
                    title="Delete review"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
