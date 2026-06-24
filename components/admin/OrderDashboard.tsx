"use client";

import { useState } from "react";
import Link from "next/link";
import { Search, Eye, Clock, TrendingUp, CheckCircle2, Package, XCircle } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { formatPrice } from "@/lib/utils";
import type { Order } from "@/types";
import type { OrderStatus } from "@prisma/client";

interface OrderDashboardProps {
  orders: Order[];
}

const STATUS_ICONS: Record<OrderStatus, LucideIcon> = {
  PENDING: Clock,
  PROCESSING: TrendingUp,
  PAID: CheckCircle2,
  SHIPPED: Package,
  DELIVERED: CheckCircle2,
  CANCELLED: XCircle,
};

const STATUS_COLORS: Record<OrderStatus, string> = {
  PENDING: "bg-amber-100 text-amber-800",
  PROCESSING: "bg-blue-100 text-blue-800",
  PAID: "bg-green-100 text-green-800",
  SHIPPED: "bg-indigo-100 text-indigo-800",
  DELIVERED: "bg-purple-100 text-purple-800",
  CANCELLED: "bg-red-100 text-red-800",
};

const TABS: Array<{ label: string; value: string }> = [
  { label: "All Orders", value: "all" },
  { label: "Pending", value: "PENDING" },
  { label: "Processing", value: "PROCESSING" },
  { label: "Paid", value: "PAID" },
  { label: "Shipped", value: "SHIPPED" },
  { label: "Delivered", value: "DELIVERED" },
  { label: "Cancelled", value: "CANCELLED" },
];

export function OrderDashboard({ orders }: OrderDashboardProps) {
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState("all");

  const filteredOrders = orders.filter((o) => {
    const matchesSearch =
      o.customerName.toLowerCase().includes(search.toLowerCase()) ||
      o.phone.includes(search) ||
      (o.email && o.email.toLowerCase().includes(search.toLowerCase())) ||
      o.id.toLowerCase().includes(search.toLowerCase());
    
    const matchesTab = activeTab === "all" || o.status === activeTab;
    return matchesSearch && matchesTab;
  });

  return (
    <div className="space-y-6">
      {/* Search & Tabs */}
      <div className="bg-white p-4 rounded-xl shadow-card space-y-4">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
          <input
            type="text"
            placeholder="Search by customer name, phone, email, or Order ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-cream-50 pl-10 pr-4 py-2.5 rounded-lg text-sm border border-border focus:ring-1 focus:ring-amber focus:border-amber focus:outline-none"
          />
        </div>

        {/* Tab Filters */}
        <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-2 border-b border-border">
          {TABS.map((tab) => (
            <button
              key={tab.value}
              onClick={() => setActiveTab(tab.value)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors duration-150 ${
                activeTab === tab.value
                  ? "bg-amber text-white"
                  : "bg-cream-100 text-charcoal hover:bg-cream-200"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Orders Table Card */}
      <div className="bg-white rounded-xl shadow-card overflow-hidden">
        <div className="overflow-x-auto">
          {filteredOrders.length === 0 ? (
            <div className="p-8 text-center text-sm text-muted">
              No orders found.
            </div>
          ) : (
            <table className="w-full text-left border-collapse min-w-[700px]">
              <thead>
                <tr className="bg-cream-50 text-2xs font-semibold text-muted uppercase tracking-wider border-b border-border">
                  <th className="px-5 py-3">Order ID</th>
                  <th className="px-5 py-3">Customer</th>
                  <th className="px-5 py-3">Phone</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3">Total</th>
                  <th className="px-5 py-3">Date</th>
                  <th className="px-5 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border text-sm">
                {filteredOrders.map((order) => {
                  const StatusIcon = STATUS_ICONS[order.status];
                  return (
                    <tr
                      key={order.id}
                      className="hover:bg-cream-50/50 transition-colors"
                    >
                      {/* Order ID */}
                      <td className="px-5 py-3.5 font-medium text-xs text-charcoal">
                        #{order.id.slice(-8).toUpperCase()}
                      </td>

                      {/* Customer */}
                      <td className="px-5 py-3.5">
                        <span className="font-semibold text-charcoal block">
                          {order.customerName}
                        </span>
                        {order.email && (
                          <span className="text-3xs text-muted block">
                            {order.email}
                          </span>
                        )}
                      </td>

                      {/* Phone */}
                      <td className="px-5 py-3.5 text-muted font-medium">
                        {order.phone}
                      </td>

                      {/* Status */}
                      <td className="px-5 py-3.5">
                        <span
                          className={`inline-flex items-center gap-1 text-2xs font-bold px-2 py-0.5 rounded-full ${
                            STATUS_COLORS[order.status]
                          }`}
                        >
                          <StatusIcon className="w-3.5 h-3.5" />
                          {order.status}
                        </span>
                      </td>

                      {/* Total */}
                      <td className="px-5 py-3.5 font-semibold text-charcoal">
                        {formatPrice(order.total)}
                      </td>

                      {/* Date */}
                      <td className="px-5 py-3.5 text-muted text-xs">
                        {new Date(order.createdAt).toLocaleDateString("en-KE", {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                        })}
                      </td>

                      {/* Actions */}
                      <td className="px-5 py-3.5 text-right whitespace-nowrap">
                        <Link
                          href={`/admin/orders/${order.id}`}
                          className="p-1.5 hover:bg-cream rounded text-charcoal-400 hover:text-amber transition-colors inline-flex items-center justify-center gap-1"
                        >
                          <Eye className="w-4 h-4" />
                          <span className="text-xs font-semibold">View</span>
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
