import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminApi } from "@/lib/adminAuth";
import ExcelJS from "exceljs";
import { PDFDocument, rgb, StandardFonts } from "pdf-lib";

// Uses request.nextUrl.searchParams and reads the admin auth token off the
// request (cookies/headers) — both dynamic APIs. Force dynamic explicitly.
export const dynamic = "force-dynamic";

function getDateRange(period: string, from?: string, to?: string) {
  const now = new Date();
  let start: Date;
  let end = new Date(now);
  end.setHours(23, 59, 59, 999);

  switch (period) {
    case "daily":
      start = new Date(now);
      start.setHours(0, 0, 0, 0);
      break;
    case "weekly":
      start = new Date(now);
      start.setDate(now.getDate() - 6);
      start.setHours(0, 0, 0, 0);
      break;
    case "monthly":
      start = new Date(now.getFullYear(), now.getMonth(), 1);
      break;
    case "custom":
      if (!from || !to) throw new Error("Custom period requires from and to dates");
      start = new Date(from);
      end = new Date(to);
      end.setHours(23, 59, 59, 999);
      break;
    default:
      start = new Date(now.getFullYear(), now.getMonth(), 1);
  }

  return { start, end };
}

export async function GET(request: NextRequest) {
  const unauthorized = await requireAdminApi(request);
  if (unauthorized) return unauthorized;

  const { searchParams } = request.nextUrl;
  const format = searchParams.get("format") ?? "xlsx"; // "xlsx" or "pdf"
  const period = searchParams.get("period") ?? "monthly";
  const from = searchParams.get("from") ?? undefined;
  const to = searchParams.get("to") ?? undefined;

  try {
    const { start, end } = getDateRange(period, from, to);

    const orders = await prisma.order.findMany({
      where: {
        createdAt: { gte: start, lte: end },
        status: { not: "CANCELLED" },
      },
      include: {
        items: { include: { product: { select: { name: true, sku: true } } } },
        payments: { where: { status: "SUCCESS" } },
      },
      orderBy: { createdAt: "asc" },
    });

    const periodLabel = period === "custom" ? `${from} to ${to}` : period.charAt(0).toUpperCase() + period.slice(1);

    if (format === "xlsx") {
      const workbook = new ExcelJS.Workbook();
      workbook.creator = "MELAKI Admin";
      workbook.created = new Date();

      // ─── Summary Sheet ───────────────────────────────────────────────────────
      const summary = workbook.addWorksheet("Summary");
      summary.columns = [
        { header: "Metric", key: "metric", width: 30 },
        { header: "Value", key: "value", width: 20 },
      ];
      const paidOrdersList = orders.filter((o) => o.payments.length > 0);
      const totalRevenue = paidOrdersList.reduce((sum, o) => sum + Number(o.total), 0);
      const totalOrders = orders.length;
      const paidOrders = paidOrdersList.length;
      const avgOrder = totalOrders > 0 ? totalRevenue / totalOrders : 0;

      summary.addRows([
        { metric: "Report Period", value: periodLabel },
        { metric: "Generated At", value: new Date().toLocaleString("en-KE") },
        { metric: "Total Orders", value: totalOrders },
        { metric: "Paid Orders", value: paidOrders },
        { metric: "Total Revenue (KES)", value: totalRevenue.toFixed(2) },
        { metric: "Avg. Order Value (KES)", value: avgOrder.toFixed(2) },
      ]);

      // Style header row
      summary.getRow(1).font = { bold: true };
      summary.getRow(1).fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFB87333" } };

      // ─── Orders Sheet ────────────────────────────────────────────────────────
      const sheet = workbook.addWorksheet("Orders");
      sheet.columns = [
        { header: "Order ID", key: "id", width: 20 },
        { header: "Date", key: "date", width: 16 },
        { header: "Customer", key: "customer", width: 22 },
        { header: "Phone", key: "phone", width: 14 },
        { header: "Status", key: "status", width: 12 },
        { header: "Subtotal (KES)", key: "subtotal", width: 15 },
        { header: "Discount (KES)", key: "discount", width: 14 },
        { header: "Total (KES)", key: "total", width: 14 },
        { header: "M-Pesa Receipt", key: "receipt", width: 18 },
      ];

      for (const order of orders) {
        sheet.addRow({
          id: order.id.slice(-8).toUpperCase(),
          date: new Date(order.createdAt).toLocaleDateString("en-KE"),
          customer: order.customerName,
          phone: order.phone,
          status: order.status,
          subtotal: order.items.reduce((s, i) => s + Number(i.price) * i.quantity, 0).toFixed(2),
          discount: Number(order.discountTotal ?? 0).toFixed(2),
          total: Number(order.total).toFixed(2),
          receipt: order.payments[0]?.mpesaReceipt ?? "-",
        });
      }

      // Style header
      sheet.getRow(1).font = { bold: true };
      sheet.getRow(1).fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFB87333" } };

      // ─── Items Sheet ─────────────────────────────────────────────────────────
      const items = workbook.addWorksheet("Items Sold");
      items.columns = [
        { header: "Order ID", key: "orderId", width: 20 },
        { header: "Date", key: "date", width: 14 },
        { header: "Product", key: "product", width: 30 },
        { header: "SKU", key: "sku", width: 14 },
        { header: "Qty", key: "qty", width: 8 },
        { header: "Unit Price (KES)", key: "price", width: 16 },
        { header: "Line Total (KES)", key: "lineTotal", width: 16 },
      ];

      for (const order of orders) {
        for (const item of order.items) {
          items.addRow({
            orderId: order.id.slice(-8).toUpperCase(),
            date: new Date(order.createdAt).toLocaleDateString("en-KE"),
            product: item.product.name,
            sku: item.product.sku ?? "-",
            qty: item.quantity,
            price: Number(item.price).toFixed(2),
            lineTotal: (Number(item.price) * item.quantity).toFixed(2),
          });
        }
      }

      items.getRow(1).font = { bold: true };
      items.getRow(1).fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFB87333" } };

      const buffer = await workbook.xlsx.writeBuffer();
      return new NextResponse(Buffer.from(buffer), {
        headers: {
          "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
          "Content-Disposition": `attachment; filename="melaki-sales-${period}-${Date.now()}.xlsx"`,
        },
      });
    }

    // ─── PDF Format ──────────────────────────────────────────────────────────
    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([612, 792]);
    const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    const fontReg = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const primaryColor = rgb(0.72, 0.45, 0.2);
    const darkColor = rgb(0.1, 0.1, 0.1);
    const grey = rgb(0.55, 0.55, 0.55);

    page.drawText("MELAKI — Sales Report", { x: 50, y: 740, size: 18, font: fontBold, color: primaryColor });
    page.drawText(`Period: ${periodLabel}`, { x: 50, y: 718, size: 10, font: fontReg, color: darkColor });
    page.drawText(`Generated: ${new Date().toLocaleString("en-KE")}`, { x: 50, y: 704, size: 10, font: fontReg, color: grey });

    page.drawLine({ start: { x: 50, y: 695 }, end: { x: 562, y: 695 }, thickness: 1.5, color: primaryColor });

    // Summary block
    const paidOrdersList = orders.filter((o) => o.payments.length > 0);
    const totalRevenue = paidOrdersList.reduce((sum, o) => sum + Number(o.total), 0);
    page.drawText(`Total Orders: ${orders.length}`, { x: 50, y: 675, size: 11, font: fontBold, color: darkColor });
    page.drawText(`Total Revenue: KES ${totalRevenue.toLocaleString("en-KE")}`, { x: 50, y: 658, size: 11, font: fontBold, color: darkColor });

    // Orders table
    let y = 630;
    page.drawText("Order", { x: 50, y, size: 9, font: fontBold, color: darkColor });
    page.drawText("Customer", { x: 120, y, size: 9, font: fontBold, color: darkColor });
    page.drawText("Status", { x: 280, y, size: 9, font: fontBold, color: darkColor });
    page.drawText("Total (KES)", { x: 380, y, size: 9, font: fontBold, color: darkColor });
    page.drawText("Receipt", { x: 470, y, size: 9, font: fontBold, color: darkColor });

    page.drawLine({ start: { x: 50, y: y - 4 }, end: { x: 562, y: y - 4 }, thickness: 0.7, color: grey });
    y -= 16;

    for (const order of orders.slice(0, 35)) {
      if (y < 60) break;
      page.drawText(`#${order.id.slice(-6).toUpperCase()}`, { x: 50, y, size: 8, font: fontReg, color: darkColor });
      page.drawText(order.customerName.slice(0, 18), { x: 120, y, size: 8, font: fontReg, color: darkColor });
      page.drawText(order.status, { x: 280, y, size: 8, font: fontReg, color: darkColor });
      page.drawText(Number(order.total).toLocaleString("en-KE"), { x: 380, y, size: 8, font: fontBold, color: darkColor });
      page.drawText(order.payments[0]?.mpesaReceipt ?? "-", { x: 470, y, size: 8, font: fontReg, color: grey });
      y -= 14;
    }

    page.drawText("MELAKI Nails & Salon — Confidential", { x: 50, y: 40, size: 8, font: fontReg, color: grey });

    const pdfBytes = await pdfDoc.save();
    return new NextResponse(Buffer.from(pdfBytes), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="melaki-sales-${period}-${Date.now()}.pdf"`,
      },
    });
  } catch (error) {
    console.error("Reports export error:", error);
    return NextResponse.json({ error: "Failed to generate report" }, { status: 500 });
  }
}
