"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Calendar,
  Phone,
  Mail,
  MapPin,
  FileText,
  CreditCard,
  History,
  CheckCircle,
  Loader2,
} from "lucide-react";
import { formatPrice } from "@/lib/utils";
import { updateOrderStatus, addOrderPayment } from "@/app/admin/actions";
import type { OrderStatus } from "@prisma/client";

// Define a type for our details to avoid strict type mapping errors
interface OrderDetailViewProps {
  order: {
    id: string;
    customerName: string;
    email: string | null;
    phone: string;
    address: string;
    total: number;
    status: OrderStatus;
    notes: string | null;
    createdAt: Date;
    items: Array<{
      id: string;
      productId: string;
      quantity: number;
      price: number;
      product: {
        name: string;
        sku: string | null;
      };
    }>;
    statusHistory: Array<{
      id: string;
      status: OrderStatus;
      notes: string | null;
      createdAt: Date;
    }>;
    payments: Array<{
      id: string;
      amount: number;
      paymentMethod: string;
      transactionRef: string | null;
      status: string;
      createdAt: Date;
      phoneNumber?: string | null;
      mpesaReceipt?: string | null;
      paidAt?: Date | null;
    }>;
  };
}

const ORDER_STATUSES: OrderStatus[] = [
  "PENDING",
  "PROCESSING",
  "PAID",
  "SHIPPED",
  "DELIVERED",
  "CANCELLED",
];

export function OrderDetailView({ order }: OrderDetailViewProps) {
  const [isPending, startTransition] = useTransition();
  const [selectedStatus, setSelectedStatus] = useState<OrderStatus>(order.status);
  const [statusNotes, setStatusNotes] = useState("");

  // Payment Form State
  const [paymentAmount, setPaymentAmount] = useState(order.total.toString());
  const [paymentMethod, setPaymentMethod] = useState("M-PESA");
  const [transactionRef, setTransactionRef] = useState("");
  const [paymentError, setPaymentError] = useState("");

  // Update Status Submit
  const handleStatusUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    startTransition(async () => {
      await updateOrderStatus(order.id, selectedStatus, statusNotes);
      setStatusNotes("");
      alert("Order status updated successfully!");
    });
  };

  // Add Payment Submit
  const handleAddPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    setPaymentError("");
    const amount = parseFloat(paymentAmount);
    if (isNaN(amount) || amount <= 0) {
      setPaymentError("Please enter a valid amount");
      return;
    }

    startTransition(async () => {
      await addOrderPayment(order.id, amount, paymentMethod, transactionRef);
      setTransactionRef("");
      alert("Payment recorded successfully!");
    });
  };

  const isOrderPaid = order.payments.some((p) => p.status === "SUCCESS") || order.status === "PAID";

  return (
    <div className="space-y-8">
      {/* Back navigation */}
      <div className="flex items-center gap-3">
        <Link
          href="/admin/orders"
          className="p-2 bg-white rounded-lg hover:bg-cream border border-border transition-colors text-charcoal"
          aria-label="Back to orders"
        >
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div>
          <h2 className="font-display text-xl font-bold text-charcoal">
            Order Detail: #{order.id.slice(-8).toUpperCase()}
          </h2>
          <div className="flex items-center gap-2 text-xs text-muted mt-0.5">
            <Calendar className="w-3.5 h-3.5" />
            <span>Ordered on {new Date(order.createdAt).toLocaleString("en-KE")}</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Side: Order particulars */}
        <div className="lg:col-span-2 space-y-6">
          {/* Customer Particulars */}
          <div className="bg-white rounded-xl shadow-card p-6 space-y-4">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-muted border-b border-border pb-2">
              Customer Information
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              <div className="space-y-1">
                <span className="text-muted block text-2xs">Client Name</span>
                <span className="font-bold text-charcoal">{order.customerName}</span>
              </div>
              <div className="space-y-1">
                <span className="text-muted block text-2xs">Phone Number</span>
                <a
                  href={`tel:${order.phone}`}
                  className="font-semibold text-amber hover:underline flex items-center gap-1.5"
                >
                  <Phone className="w-3.5 h-3.5" />
                  {order.phone}
                </a>
              </div>
              <div className="space-y-1">
                <span className="text-muted block text-2xs">Email Address</span>
                {order.email ? (
                  <a
                    href={`mailto:${order.email}`}
                    className="font-medium text-amber hover:underline flex items-center gap-1.5"
                  >
                    <Mail className="w-3.5 h-3.5" />
                    {order.email}
                  </a>
                ) : (
                  <span className="text-muted italic">No email provided</span>
                )}
              </div>
              <div className="space-y-1">
                <span className="text-muted block text-2xs">Delivery Address</span>
                <span className="font-medium text-charcoal flex items-start gap-1.5 leading-relaxed">
                  <MapPin className="w-4 h-4 text-muted shrink-0 mt-0.5" />
                  {order.address}
                </span>
              </div>
            </div>
            {order.notes && (
              <div className="bg-cream-100 p-3 rounded-lg border border-border flex gap-2">
                <FileText className="w-4 h-4 text-muted shrink-0 mt-0.5" />
                <div className="text-xs">
                  <span className="font-semibold text-charcoal block">Customer Notes:</span>
                  <p className="text-charcoal-400 mt-1 leading-relaxed">{order.notes}</p>
                </div>
              </div>
            )}
          </div>

          {/* Line Items */}
          <div className="bg-white rounded-xl shadow-card p-6 space-y-4">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-muted border-b border-border pb-2">
              Items Ordered
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="text-2xs font-semibold text-muted uppercase tracking-wider border-b border-border">
                    <th className="py-2.5">Item Description</th>
                    <th className="py-2.5">SKU</th>
                    <th className="py-2.5 text-center">Qty</th>
                    <th className="py-2.5 text-right">Price</th>
                    <th className="py-2.5 text-right">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {order.items.map((item) => (
                    <tr key={item.id}>
                      <td className="py-3 font-semibold text-charcoal">
                        {item.product.name}
                      </td>
                      <td className="py-3 text-muted text-xs uppercase tracking-wider font-medium">
                        {item.product.sku || "N/A"}
                      </td>
                      <td className="py-3 text-center font-bold text-charcoal">
                        {item.quantity}
                      </td>
                      <td className="py-3 text-right text-charcoal">
                        {formatPrice(item.price)}
                      </td>
                      <td className="py-3 text-right font-bold text-charcoal">
                        {formatPrice(item.price * item.quantity)}
                      </td>
                    </tr>
                  ))}
                  {/* Totals */}
                  <tr className="border-t-2 border-charcoal">
                    <td colSpan={3} />
                    <td className="py-4 font-semibold text-muted text-right">Subtotal:</td>
                    <td className="py-4 font-bold text-charcoal text-right">
                      {formatPrice(order.total)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Order Status History Timeline */}
          <div className="bg-white rounded-xl shadow-card p-6 space-y-4">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-muted border-b border-border pb-2 flex items-center gap-2">
              <History className="w-4 h-4 text-muted" />
              Order Status History Log
            </h3>
            <div className="space-y-4 relative pl-4 border-l border-border mt-4 ml-2">
              {order.statusHistory.map((history) => (
                <div key={history.id} className="relative space-y-1">
                  {/* Bullet */}
                  <div className="absolute -left-[21px] top-1.5 w-2.5 h-2.5 rounded-full bg-amber border-2 border-white shadow" />
                  
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-charcoal bg-cream px-2 py-0.5 rounded uppercase tracking-wider">
                      {history.status}
                    </span>
                    <span className="text-muted">
                      {new Date(history.createdAt).toLocaleString("en-KE")}
                    </span>
                  </div>
                  {history.notes && (
                    <p className="text-xs text-charcoal-400 pl-1 leading-relaxed">
                      {history.notes}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Side: Status Update and Payments recording */}
        <div className="space-y-6">
          {/* Status Update Form */}
          <div className="bg-white rounded-xl shadow-card p-6 space-y-4">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-muted border-b border-border pb-2">
              Management Actions
            </h3>
            <form onSubmit={handleStatusUpdate} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-charcoal block">
                  Change Status
                </label>
                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value as OrderStatus)}
                  className="w-full border border-border bg-cream-50 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-amber"
                >
                  {ORDER_STATUSES.map((status) => (
                    <option key={status} value={status}>
                      {status}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-charcoal block">
                  Status Change Notes
                </label>
                <textarea
                  value={statusNotes}
                  onChange={(e) => setStatusNotes(e.target.value)}
                  className="w-full border border-border bg-cream-50 rounded-lg px-3 py-2 text-xs focus:outline-none min-h-[60px]"
                  placeholder="Notes for order timeline log..."
                />
              </div>

              <button
                type="submit"
                disabled={isPending}
                className="w-full bg-charcoal hover:bg-charcoal-600 text-white font-semibold py-2 rounded-lg text-xs transition-colors flex items-center justify-center gap-2"
              >
                {isPending && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                Update Status
              </button>
            </form>
          </div>

          {/* Payment Receipts Ledgers */}
          <div className="bg-white rounded-xl shadow-card p-6 space-y-4">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-muted border-b border-border pb-2 flex items-center justify-between">
              Payment Ledgers
              {isOrderPaid && (
                <span className="bg-green-100 text-green-800 text-3xs font-bold px-2 py-0.5 rounded-full flex items-center gap-0.5">
                  <CheckCircle className="w-2.5 h-2.5" />
                  PAID
                </span>
              )}
            </h3>

            {/* List payments */}
            {order.payments.length === 0 ? (
              <p className="text-xs text-muted italic">No payment transactions recorded.</p>
            ) : (
              <div className="space-y-2.5">
                {order.payments.map((p) => (
                  <div key={p.id} className="bg-cream-50 border border-border p-3 rounded-lg text-xs space-y-1.5">
                    <div className="flex justify-between font-bold text-charcoal">
                      <span>{p.paymentMethod}</span>
                      <span>{formatPrice(p.amount)}</span>
                    </div>
                    {p.transactionRef && (
                      <p className="text-3xs text-muted">Ref: <span className="font-semibold uppercase text-charcoal-400">{p.transactionRef}</span></p>
                    )}
                    {p.phoneNumber && (
                      <p className="text-3xs text-muted">Phone: <span className="font-semibold text-charcoal-400">{p.phoneNumber}</span></p>
                    )}
                    {p.mpesaReceipt && (
                      <p className="text-3xs text-muted">M-Pesa Receipt: <span className="font-semibold uppercase text-charcoal-400">{p.mpesaReceipt}</span></p>
                    )}
                    {p.paidAt && (
                      <p className="text-3xs text-muted">Paid At: <span className="font-semibold text-charcoal-400">{new Date(p.paidAt).toLocaleString("en-KE")}</span></p>
                    )}
                    <div className="flex justify-between items-center text-3xs text-muted pt-1">
                      <span>{new Date(p.createdAt).toLocaleDateString()}</span>
                      <span className={`font-bold uppercase tracking-wider ${
                        p.status === "SUCCESS" ? "text-green-700" :
                        p.status === "PENDING" || p.status === "PROCESSING" ? "text-amber-700" :
                        "text-red-700"
                      }`}>{p.status}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Record New Payment Form */}
            {!isOrderPaid && (
              <form onSubmit={handleAddPayment} className="border-t border-border pt-4 mt-4 space-y-3.5">
                <span className="text-xs font-semibold text-charcoal block">
                  Record New Payment Receipt
                </span>
                
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <label className="text-3xs font-semibold text-muted block">Method</label>
                    <select
                      value={paymentMethod}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                      className="w-full border border-border bg-cream-50 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none"
                    >
                      <option value="M-PESA">M-Pesa</option>
                      <option value="CARD">Credit Card</option>
                      <option value="CASH">Cash</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-3xs font-semibold text-muted block">Amount (KSh)</label>
                    <input
                      type="number"
                      value={paymentAmount}
                      onChange={(e) => setPaymentAmount(e.target.value)}
                      className="w-full border border-border bg-cream-50 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-3xs font-semibold text-muted block">Transaction Ref (M-Pesa Code)</label>
                  <input
                    type="text"
                    value={transactionRef}
                    onChange={(e) => setTransactionRef(e.target.value)}
                    className="w-full border border-border bg-cream-50 rounded-lg px-3 py-1.5 text-xs focus:outline-none"
                    placeholder="e.g. QWX123456789"
                  />
                </div>

                {paymentError && (
                  <p className="text-3xs text-red-600 font-medium">{paymentError}</p>
                )}

                <button
                  type="submit"
                  disabled={isPending}
                  className="w-full bg-amber hover:bg-amber-dark text-white font-semibold py-2 rounded-lg text-xs transition-colors flex items-center justify-center gap-1.5"
                >
                  <CreditCard className="w-3.5 h-3.5" />
                  Record & Verify Payment
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
