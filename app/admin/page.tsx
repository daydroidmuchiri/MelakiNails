import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { formatPrice } from "@/lib/utils";
import {
  TrendingUp,
  ShoppingBag,
  Package,
  AlertTriangle,
  ArrowUpRight,
  Clock,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import type { OrderStatus } from "@prisma/client";
import type { LucideIcon } from "lucide-react";

export const revalidate = 0; // Disable caching for dashboard

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

export default async function AdminDashboard() {
  // Fetch statistics
  const [
    totalProducts,
    totalOrders,
    completedPayments,
    lowStockProducts,
    recentOrders,
  ] = await Promise.all([
    prisma.product.count(),
    prisma.order.count(),
    prisma.payment.aggregate({
      where: { status: "SUCCESS" },
      _sum: { amount: true },
    }),
    prisma.product.findMany({
      where: {
        stock: {
          lte: prisma.product.fields.lowStockThreshold,
        },
      },
    }),
    prisma.order.findMany({
      take: 5,
      orderBy: { createdAt: "desc" },
    }),
  ]);

  const totalRevenue = completedPayments._sum.amount ? Number(completedPayments._sum.amount) : 0;
  const lowStockCount = lowStockProducts.length;

  return (
    <div className="space-y-8">
      {/* Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Revenue */}
        <div className="bg-white rounded-xl shadow-card p-6 flex items-center justify-between">
          <div className="space-y-1.5">
            <p className="text-xs font-semibold text-muted uppercase tracking-wider">
              Total Revenue
            </p>
            <h2 className="text-2xl font-bold text-charcoal font-display">
              {formatPrice(totalRevenue)}
            </h2>
          </div>
          <div className="w-12 h-12 bg-amber-50 rounded-xl flex items-center justify-center text-amber">
            <TrendingUp className="w-6 h-6" />
          </div>
        </div>

        {/* Orders */}
        <div className="bg-white rounded-xl shadow-card p-6 flex items-center justify-between">
          <div className="space-y-1.5">
            <p className="text-xs font-semibold text-muted uppercase tracking-wider">
              Total Orders
            </p>
            <h2 className="text-2xl font-bold text-charcoal font-display">
              {totalOrders}
            </h2>
          </div>
          <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center text-blue-500">
            <ShoppingBag className="w-6 h-6" />
          </div>
        </div>

        {/* Products */}
        <div className="bg-white rounded-xl shadow-card p-6 flex items-center justify-between">
          <div className="space-y-1.5">
            <p className="text-xs font-semibold text-muted uppercase tracking-wider">
              Active Products
            </p>
            <h2 className="text-2xl font-bold text-charcoal font-display">
              {totalProducts}
            </h2>
          </div>
          <div className="w-12 h-12 bg-green-50 rounded-xl flex items-center justify-center text-green-500">
            <Package className="w-6 h-6" />
          </div>
        </div>

        {/* Low Stock */}
        <div className="bg-white rounded-xl shadow-card p-6 flex items-center justify-between">
          <div className="space-y-1.5">
            <p className="text-xs font-semibold text-muted uppercase tracking-wider">
              Low Stock Items
            </p>
            <h2 className="text-2xl font-bold text-charcoal font-display">
              {lowStockCount}
            </h2>
          </div>
          <div className="w-12 h-12 bg-red-50 rounded-xl flex items-center justify-center text-red-500">
            <AlertTriangle className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Main Grid widgets */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Recent Orders */}
        <div className="bg-white rounded-xl shadow-card xl:col-span-2 overflow-hidden flex flex-col">
          <div className="p-5 border-b border-border flex items-center justify-between">
            <h3 className="font-display text-lg font-bold text-charcoal">
              Recent Orders
            </h3>
            <Link
              href="/admin/orders"
              className="text-xs font-semibold text-amber hover:text-amber-dark flex items-center gap-1 transition-colors"
            >
              View all orders
              <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          <div className="divide-y divide-border overflow-x-auto flex-1">
            {recentOrders.length === 0 ? (
              <div className="p-8 text-center text-sm text-muted">
                No orders placed yet.
              </div>
            ) : (
              <table className="w-full text-left border-collapse min-w-[500px]">
                <thead>
                  <tr className="bg-cream-50 text-2xs font-semibold text-muted uppercase tracking-wider border-b border-border">
                    <th className="px-5 py-3">Customer</th>
                    <th className="px-5 py-3">Phone</th>
                    <th className="px-5 py-3">Status</th>
                    <th className="px-5 py-3">Total</th>
                    <th className="px-5 py-3 text-right">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border text-sm">
                  {recentOrders.map((order) => {
                    const StatusIcon = STATUS_ICONS[order.status];
                    return (
                      <tr
                        key={order.id}
                        className="hover:bg-cream-50 transition-colors"
                      >
                        <td className="px-5 py-3.5">
                          <Link
                            href={`/admin/orders/${order.id}`}
                            className="font-medium text-charcoal hover:text-amber block"
                          >
                            {order.customerName}
                          </Link>
                          {order.email && (
                            <span className="text-3xs text-muted block">
                              {order.email}
                            </span>
                          )}
                        </td>
                        <td className="px-5 py-3.5 text-muted">{order.phone}</td>
                        <td className="px-5 py-3.5">
                          <span
                            className={`inline-flex items-center gap-1 text-2xs font-bold px-2 py-0.5 rounded-full ${
                              STATUS_COLORS[order.status]
                            }`}
                          >
                            <StatusIcon className="w-3 h-3" />
                            {order.status}
                          </span>
                        </td>
                        <td className="px-5 py-3.5 font-semibold text-charcoal">
                          {formatPrice(Number(order.total))}
                        </td>
                        <td className="px-5 py-3.5 text-muted text-right text-xs">
                          {new Date(order.createdAt).toLocaleDateString("en-KE", {
                            month: "short",
                            day: "numeric",
                          })}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Low Stock Warning */}
        <div className="bg-white rounded-xl shadow-card overflow-hidden flex flex-col">
          <div className="p-5 border-b border-border flex items-center justify-between">
            <h3 className="font-display text-lg font-bold text-charcoal">
              Low Stock Warnings
            </h3>
            <Link
              href="/admin/inventory"
              className="text-xs font-semibold text-amber hover:text-amber-dark flex items-center gap-1 transition-colors"
            >
              Manage Stock
              <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          <div className="divide-y divide-border overflow-y-auto flex-1 max-h-[300px]">
            {lowStockProducts.length === 0 ? (
              <div className="p-8 text-center text-sm text-muted">
                🎉 All items are fully stocked!
              </div>
            ) : (
              lowStockProducts.map((product) => (
                <div
                  key={product.id}
                  className="p-4 hover:bg-cream-50 transition-colors flex items-center justify-between text-sm"
                >
                  <div className="space-y-0.5">
                    <span className="font-medium text-charcoal block truncate max-w-[150px]">
                      {product.name}
                    </span>
                    <span className="text-3xs text-muted block uppercase tracking-wider font-semibold">
                      SKU: {product.sku || "N/A"}
                    </span>
                  </div>
                  <div className="text-right space-y-1">
                    <span className="text-xs font-bold text-red-600 bg-red-50 px-2 py-0.5 rounded border border-red-100 block">
                      {product.stock} left
                    </span>
                    <span className="text-3xs text-muted block">
                      Threshold: {product.lowStockThreshold}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
