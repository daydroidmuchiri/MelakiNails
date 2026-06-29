"use client";

import { useState } from "react";
import { Star, Loader2, CheckCircle, AlertCircle } from "lucide-react";

interface ReviewFormProps {
  productId: string;
}

export default function ReviewForm({ productId }: ReviewFormProps) {
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [customerName, setCustomerName] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [title, setTitle] = useState("");
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (rating === 0 || !customerName.trim() || !title.trim() || !comment.trim()) return;

    setSubmitting(true);
    setError(null);
    setSuccess(false);

    try {
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId,
          customerName: customerName.trim(),
          customerEmail: customerEmail.trim() || null,
          rating,
          title: title.trim(),
          comment: comment.trim(),
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to submit review");
      }

      setSuccess(true);
      setRating(0);
      setCustomerName("");
      setCustomerEmail("");
      setTitle("");
      setComment("");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  };

  if (success) {
    return (
      <div className="bg-white rounded-2xl shadow-card p-6 text-center">
        <CheckCircle className="w-10 h-10 text-badge-new mx-auto mb-3" />
        <p className="text-sm font-semibold text-charcoal">Thank you!</p>
        <p className="text-xs text-muted mt-1">Your review has been submitted for moderation.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-card p-6">
      <h3 className="text-sm font-bold text-charcoal mb-4">Write a Review</h3>
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Star Rating */}
        <div>
          <label className="block text-xs font-semibold text-charcoal mb-2">Rating <span className="text-badge-sale">*</span></label>
          <div className="flex items-center gap-1">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onClick={() => setRating(star)}
                onMouseEnter={() => setHoverRating(star)}
                onMouseLeave={() => setHoverRating(0)}
                className="p-0.5 transition-transform hover:scale-110"
              >
                <Star
                  className={`w-6 h-6 ${
                    star <= (hoverRating || rating)
                      ? "text-amber fill-amber"
                      : "text-border"
                  }`}
                />
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-charcoal mb-1.5">
              Name <span className="text-badge-sale">*</span>
            </label>
            <input
              type="text"
              placeholder="Your name"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              className="input-base"
              required
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-charcoal mb-1.5">
              Email (optional)
            </label>
            <input
              type="email"
              placeholder="For verified badge"
              value={customerEmail}
              onChange={(e) => setCustomerEmail(e.target.value)}
              className="input-base"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-charcoal mb-1.5">
            Review Title <span className="text-badge-sale">*</span>
          </label>
          <input
            type="text"
            placeholder="Summarize your experience"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="input-base"
            required
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-charcoal mb-1.5">
            Your Review <span className="text-badge-sale">*</span>
          </label>
          <textarea
            placeholder="Tell others about your experience..."
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            rows={4}
            className="input-base resize-none"
            required
          />
        </div>

        {error && (
          <div className="flex items-center gap-2 bg-red-50 border border-red-100 rounded-xl px-4 py-3 text-red-600 text-xs">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <button
          type="submit"
          disabled={submitting || rating === 0}
          className="bg-amber hover:bg-amber-dark text-white text-sm font-bold px-6 py-2.5 rounded-xl transition-colors disabled:opacity-50 flex items-center gap-2"
        >
          {submitting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Submitting...
            </>
          ) : (
            "Submit Review"
          )}
        </button>
      </form>
    </div>
  );
}
