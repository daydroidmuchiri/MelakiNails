"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useCartStore } from "@/store/cartStore";
import { formatPrice } from "@/lib/utils";
import { CheckCircle2, Loader2, ArrowLeft, ShoppingBag } from "lucide-react";
import type { OrderFormData } from "@/types";

type CheckoutState = "form" | "loading" | "waiting-payment" | "success";

export default function CheckoutPage() {
  const { items, totalPrice, totalItems, clearCart } = useCartStore();
  const [checkoutState, setCheckoutState] = useState<CheckoutState>("form");
  const [orderId, setOrderId] = useState<string>("");
  const [checkoutRequestId, setCheckoutRequestId] = useState<string>("");
  const [errors, setErrors] = useState<Partial<OrderFormData>>({});
  const [formData, setFormData] = useState<OrderFormData>({
    customerName: "",
    email: "",
    phone: "",
    address: "",
  });

  useEffect(() => {
    if (checkoutState !== "waiting-payment" || !checkoutRequestId) return;



    const checkStatus = async () => {
      try {
        const res = await fetch(`/api/payments/status?checkoutRequestId=${checkoutRequestId}`);
        if (!res.ok) return;
        const data = await res.json();

        if (data.status === "SUCCESS") {
          clearInterval(intervalId);
          clearTimeout(timeoutId);
          clearCart();
          setCheckoutState("success");
        } else if (
          data.status === "FAILED" ||
          data.status === "CANCELLED" ||
          data.status === "TIMEOUT"
        ) {
          clearInterval(intervalId);
          clearTimeout(timeoutId);
          setCheckoutState("form");
          alert(`Payment failed or cancelled. Reason: ${data.resultDesc || data.status}`);
        }
      } catch (err) {
        console.error("Error checking payment status:", err);
      }
    };

    const intervalId = setInterval(checkStatus, 3000);

    const timeoutId = setTimeout(() => {
      clearInterval(intervalId);
      setCheckoutState("form");
      alert("Payment confirmation timed out. Please verify on your phone or try again.");
    }, 60000);

    checkStatus();

    return () => {
      clearInterval(intervalId);
      clearTimeout(timeoutId);
    };
  }, [checkoutState, checkoutRequestId, clearCart]);

  const subtotal = totalPrice();
  const delivery = subtotal >= 5000 ? 0 : 300;
  const total = subtotal + delivery;
  const itemCount = totalItems();

  const validate = (): boolean => {
    const newErrors: Partial<OrderFormData> = {};
    if (!formData.customerName.trim())
      newErrors.customerName = "Full name is required";
    if (!formData.phone.trim()) newErrors.phone = "Phone number is required";
    else if (!/^(\+254|0)[17]\d{8}$/.test(formData.phone.replace(/\s/g, "")))
      newErrors.phone = "Enter a valid Kenyan phone number";
    if (!formData.address.trim()) newErrors.address = "Delivery address is required";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name as keyof OrderFormData]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    if (items.length === 0) return;

    setCheckoutState("loading");

    try {
      // 1. Create Order record
      const response = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          items: items.map((item) => ({
            productId: item.productId,
            quantity: item.quantity,
            price: item.price,
          })),
          total,
        }),
      });

      if (!response.ok) throw new Error("Order creation failed. Please try again.");
      const order = await response.json();
      setOrderId(order.id);

      // 2. Initiate M-Pesa STK Push
      const stkResponse = await fetch("/api/payments/stk-push", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId: order.id,
          phoneNumber: formData.phone,
        }),
      });

      if (!stkResponse.ok) {
        const errData = await stkResponse.json();
        throw new Error(errData.error || "M-Pesa payment request failed");
      }

      const stkData = await stkResponse.json();
      setCheckoutRequestId(stkData.checkoutRequestId);
      setCheckoutState("waiting-payment");
    } catch (error) {
      const err = error as Error;
      setCheckoutState("form");
      alert(err.message || "Failed to process payment. Please try again.");
    }
  };

  // Empty cart redirect
  if (items.length === 0 && checkoutState === "form") {
    return (
      <div className="bg-cream min-h-screen flex items-center justify-center px-4">
        <div className="text-center">
          <ShoppingBag className="w-16 h-16 text-muted/40 mx-auto mb-4" />
          <h1 className="text-xl font-semibold text-charcoal mb-2">
            Nothing to checkout
          </h1>
          <Link
            href="/products"
            className="inline-flex items-center gap-2 bg-amber text-white font-semibold px-5 py-2.5 rounded-xl mt-4 hover:bg-amber-dark transition-colors"
          >
            Shop Now
          </Link>
        </div>
      </div>
    );
  }

  // Waiting payment screen
  if (checkoutState === "waiting-payment") {
    return (
      <div className="bg-cream min-h-screen flex items-center justify-center px-4">
        <div className="bg-white rounded-2xl shadow-card p-10 max-w-md w-full text-center">
          <div className="w-20 h-20 bg-amber-50 rounded-full flex items-center justify-center mx-auto mb-6">
            <Loader2 className="w-10 h-10 text-amber animate-spin" />
          </div>
          <h1 className="text-2xl font-display font-bold text-charcoal mb-2">
            M-Pesa STK Push Sent
          </h1>
          <p className="text-sm text-muted mb-6">
            Please check your phone (<strong>{formData.phone}</strong>) for the M-Pesa prompt.
            Enter your M-Pesa PIN to authorize the payment of <strong>{formatPrice(total)}</strong>.
          </p>
          <div className="bg-cream rounded-xl px-5 py-4 mb-6 text-left space-y-2">
            <p className="text-xs text-muted leading-relaxed">
              1. A pop-up prompt has been sent to your phone.
            </p>
            <p className="text-xs text-muted leading-relaxed">
              2. Enter your M-Pesa PIN and press OK.
            </p>
            <p className="text-xs text-muted leading-relaxed">
              3. Once you complete the payment, this page will update automatically.
            </p>
          </div>
          <div className="text-xs text-muted flex items-center justify-center gap-1.5">
            <Loader2 className="w-3.5 h-3.5 animate-spin text-amber" />
            <span>Waiting for payment confirmation...</span>
          </div>
        </div>
      </div>
    );
  }

  // Success screen
  if (checkoutState === "success") {
    return (
      <div className="bg-cream min-h-screen flex items-center justify-center px-4">
        <div className="bg-white rounded-2xl shadow-card p-10 max-w-md w-full text-center">
          <div className="w-20 h-20 bg-badge-new/10 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="w-10 h-10 text-badge-new" />
          </div>
          <h1 className="text-2xl font-display font-bold text-charcoal mb-2">
            Order Confirmed!
          </h1>
          <p className="text-sm text-muted mb-6">
            Thank you, {formData.customerName}! Your order has been placed
            successfully. We&apos;ll contact you at {formData.phone} to confirm
            delivery details.
          </p>
          <div className="bg-cream rounded-xl px-5 py-4 mb-6 text-left">
            <p className="text-xs text-muted mb-1">Order Reference</p>
            <p className="text-sm font-mono font-bold text-charcoal break-all">
              #{orderId.slice(-8).toUpperCase()}
            </p>
            <p className="text-xs text-muted mt-3 mb-1">Delivery Address</p>
            <p className="text-sm text-charcoal">{formData.address}</p>
            <p className="text-xs text-muted mt-3 mb-1">Order Total</p>
            <p className="text-base font-bold text-amber">
              {formatPrice(total)}
            </p>
          </div>
          <Link
            href="/products"
            id="continue-shopping-success"
            className="w-full flex items-center justify-center gap-2 bg-amber hover:bg-amber-dark text-white font-semibold py-3 rounded-xl transition-colors duration-200"
          >
            Continue Shopping
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-cream min-h-screen">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Back link */}
        <Link
          href="/cart"
          className="inline-flex items-center gap-1.5 text-sm text-charcoal-400 hover:text-charcoal transition-colors mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Cart
        </Link>

        <h1 className="text-2xl font-display font-bold text-charcoal mb-8">
          Checkout
        </h1>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
          {/* Form */}
          <div className="lg:col-span-3">
            <form onSubmit={handleSubmit} id="checkout-form" noValidate>
              <div className="bg-white rounded-2xl shadow-card p-6 md:p-8">
                <h2 className="text-base font-semibold text-charcoal mb-6">
                  Delivery Details
                </h2>

                <div className="space-y-4">
                  {/* Full Name */}
                  <div>
                    <label
                      htmlFor="customerName"
                      className="block text-xs font-semibold text-charcoal mb-1.5"
                    >
                      Full Name <span className="text-badge-sale">*</span>
                    </label>
                    <input
                      id="customerName"
                      name="customerName"
                      type="text"
                      value={formData.customerName}
                      onChange={handleChange}
                      placeholder="Jane Mwangi"
                      className={`input-base ${
                        errors.customerName ? "ring-2 ring-badge-sale border-badge-sale" : ""
                      }`}
                      autoComplete="name"
                    />
                    {errors.customerName && (
                      <p className="text-xs text-badge-sale mt-1">
                        {errors.customerName}
                      </p>
                    )}
                  </div>

                  {/* Email */}
                  <div>
                    <label
                      htmlFor="email"
                      className="block text-xs font-semibold text-charcoal mb-1.5"
                    >
                      Email Address{" "}
                      <span className="text-muted font-normal">(optional)</span>
                    </label>
                    <input
                      id="email"
                      name="email"
                      type="email"
                      value={formData.email}
                      onChange={handleChange}
                      placeholder="jane@example.com"
                      className="input-base"
                      autoComplete="email"
                    />
                  </div>

                  {/* Phone */}
                  <div>
                    <label
                      htmlFor="phone"
                      className="block text-xs font-semibold text-charcoal mb-1.5"
                    >
                      Phone Number <span className="text-badge-sale">*</span>
                    </label>
                    <input
                      id="phone"
                      name="phone"
                      type="tel"
                      value={formData.phone}
                      onChange={handleChange}
                      placeholder="0712 345 678"
                      className={`input-base ${
                        errors.phone ? "ring-2 ring-badge-sale border-badge-sale" : ""
                      }`}
                      autoComplete="tel"
                    />
                    {errors.phone && (
                      <p className="text-xs text-badge-sale mt-1">
                        {errors.phone}
                      </p>
                    )}
                  </div>

                  {/* Address */}
                  <div>
                    <label
                      htmlFor="address"
                      className="block text-xs font-semibold text-charcoal mb-1.5"
                    >
                      Delivery Address <span className="text-badge-sale">*</span>
                    </label>
                    <textarea
                      id="address"
                      name="address"
                      value={formData.address}
                      onChange={handleChange}
                      placeholder="e.g. Westlands, Nairobi — near Sarit Centre"
                      rows={3}
                      className={`input-base resize-none ${
                        errors.address ? "ring-2 ring-badge-sale border-badge-sale" : ""
                      }`}
                      autoComplete="street-address"
                    />
                    {errors.address && (
                      <p className="text-xs text-badge-sale mt-1">
                        {errors.address}
                      </p>
                    )}
                  </div>
                </div>

                {/* Note */}
                <div className="mt-6 bg-amber-50 border border-amber-100 rounded-xl px-4 py-3">
                  <p className="text-xs text-amber-600 leading-relaxed">
                    <strong>Note:</strong> Our team will call you to confirm your
                    order and arrange payment (M-Pesa or Cash on Delivery).
                  </p>
                </div>

                {/* Submit */}
                <button
                  type="submit"
                  id="place-order-btn"
                  disabled={checkoutState === "loading"}
                  className="mt-6 w-full flex items-center justify-center gap-2 bg-amber hover:bg-amber-dark text-white font-bold py-3.5 rounded-xl transition-colors duration-200 text-base disabled:opacity-75 disabled:cursor-wait"
                >
                  {checkoutState === "loading" ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Placing Order…
                    </>
                  ) : (
                    "Place Order"
                  )}
                </button>
              </div>
            </form>
          </div>

          {/* Order summary */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl shadow-card p-6 sticky top-24">
              <h2 className="text-base font-semibold text-charcoal mb-4">
                Your Order ({itemCount} items)
              </h2>
              <div className="space-y-3 max-h-64 overflow-y-auto scrollbar-hide">
                {items.map((item) => (
                  <div key={item.productId} className="flex items-center gap-3">
                    <span className="w-5 h-5 rounded-full bg-amber text-white text-2xs font-bold flex items-center justify-center shrink-0">
                      {item.quantity}
                    </span>
                    <span className="text-xs text-charcoal-400 flex-1 line-clamp-1">
                      {item.name}
                    </span>
                    <span className="text-xs font-semibold text-charcoal shrink-0">
                      {formatPrice(item.price * item.quantity)}
                    </span>
                  </div>
                ))}
              </div>

              <div className="border-t border-border mt-4 pt-4 space-y-2 text-sm">
                <div className="flex justify-between text-charcoal-400">
                  <span>Subtotal</span>
                  <span>{formatPrice(subtotal)}</span>
                </div>
                <div className="flex justify-between text-charcoal-400">
                  <span>Delivery</span>
                  <span className={delivery === 0 ? "text-badge-new font-semibold" : ""}>
                    {delivery === 0 ? "FREE" : formatPrice(delivery)}
                  </span>
                </div>
                <div className="flex justify-between font-bold text-base text-charcoal border-t border-border pt-3 mt-1">
                  <span>Total</span>
                  <span className="text-amber">{formatPrice(total)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
