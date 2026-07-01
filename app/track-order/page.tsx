"use client";

import { useState } from "react";
import { formatPrice } from "@/lib/utils";
import {
  Search,
  Loader2,
  Clock,
  CreditCard,
  Settings,
  Truck,
  CheckCircle,
  AlertCircle,
  Download
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

type OrderStatus = "PENDING" | "PROCESSING" | "PAID" | "SHIPPED" | "DELIVERED" | "CANCELLED";

interface OrderItem {
  id: string;
  quantity: number;
  price: number;
  product: {
    name: string;
    images: string[];
    sku: string | null;
  };
}

interface OrderDetail {
  id: string;
  customerName: string;
  email: string | null;
  phone: string;
  address: string;
  total: number;
  discountTotal: number;
  deliveryFee: number;
  couponCode: string | null;
  status: OrderStatus;
  trackingToken: string;
  createdAt: string;
  items: OrderItem[];
  payments: Array<{
    status: string;
    mpesaReceipt: string | null;
    paymentMethod: string;
  }>;
  statusHistory: Array<{
    status: OrderStatus;
    notes: string | null;
    createdAt: string;
  }>;
}

const TIMELINE_STEPS: Array<{ status: OrderStatus; label: string; icon: LucideIcon }> = [
  { status: "PENDING", label: "Order Received", icon: Clock },
  { status: "PAID", label: "Payment Confirmed", icon: CreditCard },
  { status: "PROCESSING", label: "Processing", icon: Settings },
  { status: "SHIPPED", label: "Shipped", icon: Truck },
  { status: "DELIVERED", label: "Delivered", icon: CheckCircle }
];

export default function TrackOrderPage() {
  const [query, setQuery] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [order, setOrder] = useState<OrderDetail | null>(null);

  const handleTrack = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim() || !email.trim()) return;

    setLoading(true);
    setError(null);
    setOrder(null);

    try {
      const res = await fetch(
        `/api/orders/track?query=${encodeURIComponent(query.trim())}&email=${encodeURIComponent(
          email.trim().toLowerCase()
        )}`
      );
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Order not found");
      }
      const data = await res.json();
      setOrder(data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Could not retrieve order details");
    } finally {
      setLoading(false);
    }
  };

  const getStepIndex = (status: OrderStatus): number => {
    if (status === "CANCELLED") return -1;
    // Map PAID and PROCESSING accurately to timeline
    if (status === "PAID") return 1;
    if (status === "PROCESSING") return 2;
    if (status === "SHIPPED") return 3;
    if (status === "DELIVERED") return 4;
    return 0; // PENDING
  };

  const currentStepIndex = order ? getStepIndex(order.status) : 0;

  // Estimate delivery: 2 business days from order placement
  const getEstimatedDelivery = (dateStr: string) => {
    const d = new Date(dateStr);
    d.setDate(d.getDate() + 2);
    return d.toLocaleDateString("en-KE", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric"
    });
  };

  return (
    <div className="bg-cream min-h-screen py-10">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-display font-bold text-charcoal text-center mb-2">
          Track Your Order
        </h1>
        <p className="text-sm text-muted text-center mb-8">
          Enter your order reference number and the email address used during checkout.
        </p>

        {/* Tracking Form */}
        <div className="bg-white rounded-2xl shadow-card p-6 md:p-8 mb-8 max-w-2xl mx-auto">
          <form onSubmit={handleTrack} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-charcoal mb-1.5">
                  Order Number / ID
                </label>
                <input
                  type="text"
                  placeholder="e.g. cld..."
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  className="input-base"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-charcoal mb-1.5">
                  Email Address
                </label>
                <input
                  type="email"
                  placeholder="jane@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="input-base"
                  required
                />
              </div>
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 bg-amber hover:bg-amber-dark text-white font-bold py-3 rounded-xl transition-colors duration-200"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Searching...
                </>
              ) : (
                <>
                  <Search className="w-4 h-4" />
                  Track Order
                </>
              )}
            </button>
          </form>

          {error && (
            <div className="mt-4 flex items-center gap-2 bg-red-50 border border-red-100 rounded-xl px-4 py-3 text-red-600 text-sm">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}
        </div>

        {/* Tracking Details */}
        {order && (
          <div className="space-y-8 animate-fadeIn">
            {/* Timeline Widget */}
            <div className="bg-white rounded-2xl shadow-card p-6 md:p-8">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border pb-6 mb-6">
                <div>
                  <span className="text-2xs font-semibold text-muted uppercase tracking-wider">
                    Order Reference
                  </span>
                  <h2 className="text-lg font-mono font-bold text-charcoal mt-0.5">
                    #{order.id.slice(-8).toUpperCase()}
                  </h2>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  {order.status === "CANCELLED" ? (
                    <span className="bg-red-50 text-red-600 border border-red-100 text-xs font-bold px-3 py-1 rounded-full">
                      ORDER CANCELLED
                    </span>
                  ) : (
                    <span className="bg-amber-50 text-amber border border-amber-100 text-xs font-bold px-3 py-1 rounded-full">
                      STATUS: {order.status}
                    </span>
                  )}
                  {/* Download Invoice Button */}
                  {(order.status === "PAID" || order.status === "PROCESSING" || order.status === "SHIPPED" || order.status === "DELIVERED") && (
                    <a
                      href={`/api/orders/${order.id}/invoice?token=${order.trackingToken}`}
                      download
                      className="inline-flex items-center gap-1.5 bg-charcoal hover:bg-charcoal-400 text-white text-xs font-semibold px-3.5 py-1.5 rounded-full transition-colors"
                    >
                      <Download className="w-3.5 h-3.5" />
                      Invoice PDF
                    </a>
                  )}
                </div>
              </div>

              {order.status === "CANCELLED" ? (
                <div className="p-4 bg-red-50 border border-red-100 rounded-xl text-red-600 text-sm leading-relaxed">
                  <strong>This order was cancelled.</strong> If this is a mistake or you require a refund, please contact customer support.
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Graphic Timeline */}
                  <div className="relative flex flex-col md:flex-row justify-between items-start md:items-center gap-6 md:gap-0 mt-2">
                    {/* Line Helper (Desktop only) */}
                    <div className="hidden md:block absolute top-[18px] left-[5%] right-[5%] h-1 bg-border z-0">
                      <div
                        className="h-full bg-amber transition-all duration-500"
                        style={{ width: `${(currentStepIndex / (TIMELINE_STEPS.length - 1)) * 100}%` }}
                      />
                    </div>

                    {TIMELINE_STEPS.map((step, idx) => {
                      const StepIcon = step.icon;
                      const isCompleted = idx <= currentStepIndex;
                      const isActive = idx === currentStepIndex;

                      return (
                        <div
                          key={step.status}
                          className="relative flex md:flex-col items-center gap-4 md:gap-2 z-10 w-full md:text-center"
                        >
                          <div
                            className={`w-9 h-9 rounded-full flex items-center justify-center border-2 transition-all duration-300 ${
                              isCompleted
                                ? "bg-amber border-amber text-white shadow-md shadow-amber/20"
                                : "bg-white border-border text-muted"
                            } ${isActive ? "ring-4 ring-amber-50" : ""}`}
                          >
                            <StepIcon className="w-4 h-4" />
                          </div>
                          <div>
                            <p
                              className={`text-xs font-bold ${
                                isCompleted ? "text-charcoal" : "text-muted"
                              }`}
                            >
                              {step.label}
                            </p>
                            {/* Dynamic Timestamp helper */}
                            {isCompleted && (
                              <p className="text-4xs text-muted block md:mt-0.5">
                                {idx === 0
                                  ? new Date(order.createdAt).toLocaleDateString("en-KE")
                                  : order.statusHistory.find((h) => {
                                      if (step.status === "PAID") return h.status === "PAID";
                                      if (step.status === "PROCESSING") return h.status === "PROCESSING" || h.status === "PAID";
                                      return h.status === step.status;
                                    })
                                    ? new Date(
                                        order.statusHistory.find((h) => {
                                          if (step.status === "PAID") return h.status === "PAID";
                                          if (step.status === "PROCESSING") return h.status === "PROCESSING" || h.status === "PAID";
                                          return h.status === step.status;
                                        })!.createdAt
                                      ).toLocaleDateString("en-KE")
                                    : ""}
                              </p>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Estimated delivery banner */}
                  {order.status !== "DELIVERED" && (
                    <div className="bg-cream rounded-xl px-5 py-3.5 text-sm text-charcoal border border-border/50">
                      🚚 <strong>Estimated Delivery:</strong> {getEstimatedDelivery(order.createdAt)}
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Items Table */}
              <div className="bg-white rounded-2xl shadow-card p-6 md:col-span-2 overflow-hidden flex flex-col">
                <h3 className="text-sm font-bold text-charcoal mb-4">Items Ordered</h3>
                <div className="divide-y divide-border overflow-x-auto flex-1">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-cream-50 text-3xs font-semibold text-muted uppercase tracking-wider border-b border-border">
                        <th className="py-2.5 px-3">Item</th>
                        <th className="py-2.5 px-3 text-center">Qty</th>
                        <th className="py-2.5 px-3 text-right">Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border text-xs">
                      {order.items.map((item) => (
                        <tr key={item.id}>
                          <td className="py-3 px-3">
                            <span className="font-medium text-charcoal block line-clamp-1">
                              {item.product.name}
                            </span>
                            {item.product.sku && (
                              <span className="text-4xs text-muted font-mono block">
                                SKU: {item.product.sku}
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-3 text-center text-muted">
                            {item.quantity}
                          </td>
                          <td className="py-3 px-3 text-right font-semibold text-charcoal">
                            {formatPrice(item.price * item.quantity)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="border-t border-border mt-4 pt-4 space-y-1.5 text-xs text-right">
                  <div className="flex justify-between text-muted max-w-[240px] ml-auto">
                    <span>Subtotal:</span>
                    <span className="font-medium text-charcoal">
                      {formatPrice(
                        order.items.reduce((sum, item) => sum + item.price * item.quantity, 0)
                      )}
                    </span>
                  </div>
                  {order.discountTotal > 0 && (
                    <div className="flex justify-between text-badge-sale max-w-[240px] ml-auto">
                      <span>Discount ({order.couponCode}):</span>
                      <span>-{formatPrice(order.discountTotal)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-muted max-w-[240px] ml-auto">
                    <span>Delivery:</span>
                    <span>{order.deliveryFee > 0 ? formatPrice(order.deliveryFee) : "FREE"}</span>
                  </div>
                  <div className="flex justify-between font-bold text-sm text-charcoal border-t border-border pt-2 max-w-[240px] ml-auto mt-1">
                    <span>Total Paid:</span>
                    <span className="text-amber">{formatPrice(order.total)}</span>
                  </div>
                </div>
              </div>

              {/* Delivery & Payment details */}
              <div className="bg-white rounded-2xl shadow-card p-6 space-y-6">
                <div>
                  <h3 className="text-sm font-bold text-charcoal mb-3">Delivery Information</h3>
                  <div className="space-y-2 text-xs text-muted">
                    <p>
                      <strong className="text-charcoal block">Customer</strong>
                      {order.customerName}
                    </p>
                    <p>
                      <strong className="text-charcoal block">Phone Number</strong>
                      {order.phone}
                    </p>
                    <p>
                      <strong className="text-charcoal block">Shipping Address</strong>
                      {order.address}
                    </p>
                  </div>
                </div>

                <div className="border-t border-border pt-4">
                  <h3 className="text-sm font-bold text-charcoal mb-3">Payment Details</h3>
                  <div className="space-y-2 text-xs text-muted">
                    <p>
                      <strong className="text-charcoal block">Payment Method</strong>
                      {order.payments[0]?.paymentMethod || "M-PESA"}
                    </p>
                    <p>
                      <strong className="text-charcoal block">Payment Status</strong>
                      <span className="font-semibold text-charcoal">
                        {order.payments[0]?.status || "PENDING"}
                      </span>
                    </p>
                    {order.payments[0]?.mpesaReceipt && (
                      <p>
                        <strong className="text-charcoal block">M-Pesa Receipt</strong>
                        <span className="font-mono font-bold text-charcoal">
                          {order.payments[0].mpesaReceipt}
                        </span>
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
