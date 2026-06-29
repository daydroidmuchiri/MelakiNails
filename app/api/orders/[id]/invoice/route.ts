import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { PDFDocument, rgb, StandardFonts } from "pdf-lib";
import { getToken } from "next-auth/jwt";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const tokenParam = request.nextUrl.searchParams.get("token");

    // 1. Fetch Order Details
    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        items: {
          include: {
            product: true
          }
        },
        payments: {
          where: { status: "SUCCESS" }
        }
      }
    });

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    // 2. Validate Authorization
    // Allow if valid token param matches trackingToken, OR if authorized admin session exists
    let authorized = false;

    if (tokenParam && tokenParam === order.trackingToken) {
      authorized = true;
    } else {
      const session = await getToken({
        req: request,
        secret: process.env.NEXTAUTH_SECRET
      });
      if (session && (session.role === "ADMIN" || session.role === "SUPER_ADMIN")) {
        authorized = true;
      }
    }

    if (!authorized) {
      return NextResponse.json({ error: "Unauthorized access to invoice" }, { status: 401 });
    }

    // 3. Create PDF document using pdf-lib
    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([612, 792]); // Standard Letter size
    const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica);

    // Color definitions
    const primaryColor = rgb(0.70, 0.45, 0.15); // amber/gold accent
    const darkColor = rgb(0.12, 0.12, 0.12); // charcoal
    const lightGrey = rgb(0.6, 0.6, 0.6);
    const superLightGrey = rgb(0.95, 0.95, 0.95);

    // Draw header branding
    page.drawText("MELAKI NAILS & SALON", {
      x: 50,
      y: 730,
      size: 20,
      font: fontBold,
      color: primaryColor
    });

    page.drawText("INVOICE", {
      x: 480,
      y: 730,
      size: 20,
      font: fontBold,
      color: darkColor
    });

    // Divider Line
    page.drawLine({
      start: { x: 50, y: 710 },
      end: { x: 562, y: 710 },
      thickness: 1.5,
      color: primaryColor
    });

    // Invoice Meta Information
    const invoiceDate = new Date(order.createdAt).toLocaleDateString("en-KE", {
      year: "numeric",
      month: "long",
      day: "numeric"
    });
    
    page.drawText(`Invoice ID: INV-${order.id.slice(-8).toUpperCase()}`, { x: 50, y: 685, size: 10, font: fontBold, color: darkColor });
    page.drawText(`Order Date: ${invoiceDate}`, { x: 50, y: 670, size: 10, font: fontRegular, color: darkColor });
    page.drawText(`Payment Method: ${order.payments[0]?.paymentMethod || "M-PESA / Cash"}`, { x: 50, y: 655, size: 10, font: fontRegular, color: darkColor });
    
    if (order.payments[0]?.mpesaReceipt) {
      page.drawText(`M-Pesa Receipt: ${order.payments[0].mpesaReceipt}`, { x: 50, y: 640, size: 10, font: fontBold, color: darkColor });
    }

    // Customer Information Block
    page.drawText("BILLED TO:", { x: 350, y: 685, size: 10, font: fontBold, color: primaryColor });
    page.drawText(order.customerName, { x: 350, y: 670, size: 10, font: fontBold, color: darkColor });
    page.drawText(order.phone, { x: 350, y: 655, size: 10, font: fontRegular, color: darkColor });
    
    if (order.email) {
      page.drawText(order.email, { x: 350, y: 640, size: 10, font: fontRegular, color: darkColor });
    }

    // Shipping info
    page.drawText("DELIVERY ADDRESS:", { x: 350, y: 615, size: 9, font: fontBold, color: primaryColor });
    const addressLines = order.address.match(/.{1,45}/g) || [order.address];
    let addressY = 600;
    for (const line of addressLines) {
      page.drawText(line.trim(), { x: 350, y: addressY, size: 9, font: fontRegular, color: darkColor });
      addressY -= 12;
    }

    // Draw Table Header
    const tableHeaderY = 530;
    page.drawRectangle({
      x: 50,
      y: tableHeaderY - 5,
      width: 512,
      height: 20,
      color: superLightGrey
    });

    page.drawText("Item / Description", { x: 60, y: tableHeaderY, size: 9, font: fontBold, color: darkColor });
    page.drawText("Qty", { x: 320, y: tableHeaderY, size: 9, font: fontBold, color: darkColor });
    page.drawText("Unit Price (KES)", { x: 390, y: tableHeaderY, size: 9, font: fontBold, color: darkColor });
    page.drawText("Total (KES)", { x: 490, y: tableHeaderY, size: 9, font: fontBold, color: darkColor });

    // Populate Table Rows
    let currentY = tableHeaderY - 25;
    const subtotal = order.items.reduce((sum, item) => sum + Number(item.price) * item.quantity, 0);

    for (const item of order.items) {
      // Draw grid line
      page.drawLine({
        start: { x: 50, y: currentY + 12 },
        end: { x: 562, y: currentY + 12 },
        thickness: 0.5,
        color: lightGrey
      });

      const productName = item.product.name.length > 40 ? item.product.name.slice(0, 37) + "..." : item.product.name;
      page.drawText(productName, { x: 60, y: currentY, size: 9, font: fontRegular, color: darkColor });
      page.drawText(item.quantity.toString(), { x: 320, y: currentY, size: 9, font: fontRegular, color: darkColor });
      page.drawText(Number(item.price).toLocaleString("en-KE"), { x: 390, y: currentY, size: 9, font: fontRegular, color: darkColor });
      page.drawText((Number(item.price) * item.quantity).toLocaleString("en-KE"), { x: 490, y: currentY, size: 9, font: fontBold, color: darkColor });

      currentY -= 20;

      // Handle pagination simplified
      if (currentY < 150) {
        break; 
      }
    }

    // Border line under items
    page.drawLine({
      start: { x: 50, y: currentY + 12 },
      end: { x: 562, y: currentY + 12 },
      thickness: 1,
      color: primaryColor
    });

    // Subtotal and Totals Section
    currentY -= 10;
    const totalPaid = Number(order.total);
    const discount = Number(order.discountTotal);
    const deliveryFee = totalPaid >= 5000 ? 0 : 300;

    // Subtotal
    page.drawText("Subtotal:", { x: 390, y: currentY, size: 9, font: fontRegular, color: darkColor });
    page.drawText(subtotal.toLocaleString("en-KE"), { x: 490, y: currentY, size: 9, font: fontRegular, color: darkColor });
    currentY -= 15;

    // Coupon discount (if used)
    if (discount > 0) {
      page.drawText(`Discount (${order.couponCode || "Coupon"}):`, { x: 350, y: currentY, size: 9, font: fontRegular, color: rgb(0.8, 0.2, 0.2) });
      page.drawText(`-${discount.toLocaleString("en-KE")}`, { x: 490, y: currentY, size: 9, font: fontRegular, color: rgb(0.8, 0.2, 0.2) });
      currentY -= 15;
    }

    // Delivery Fee
    page.drawText("Delivery Fee:", { x: 390, y: currentY, size: 9, font: fontRegular, color: darkColor });
    page.drawText(deliveryFee === 0 ? "FREE" : deliveryFee.toLocaleString("en-KE"), { x: 490, y: currentY, size: 9, font: fontRegular, color: darkColor });
    currentY -= 18;

    // Divider before Total
    page.drawLine({
      start: { x: 380, y: currentY + 5 },
      end: { x: 562, y: currentY + 5 },
      thickness: 1,
      color: lightGrey
    });

    // Grand Total
    page.drawText("Total Paid:", { x: 390, y: currentY, size: 10, font: fontBold, color: darkColor });
    page.drawText(`KES ${totalPaid.toLocaleString("en-KE")}`, { x: 490, y: currentY, size: 11, font: fontBold, color: primaryColor });
    currentY -= 20;

    // VAT section (16% VAT included - future ready)
    const vatAmount = (totalPaid * 16) / 116;
    page.drawText(`* Includes 16% VAT of KES ${vatAmount.toFixed(2)}`, {
      x: 350,
      y: currentY,
      size: 7.5,
      font: fontRegular,
      color: lightGrey
    });

    // Footer
    page.drawText("Thank you for shopping with MELAKI! For returns or support, contact info@melaki.co.ke", {
      x: 50,
      y: 50,
      size: 8,
      font: fontRegular,
      color: lightGrey
    });

    // Save and send pdf response
    const pdfBytes = await pdfDoc.save();

    return new NextResponse(Buffer.from(pdfBytes), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="invoice-${order.id.slice(-8).toUpperCase()}.pdf"`
      }
    });
  } catch (error) {
    console.error("Invoice API Route Error:", error);
    return NextResponse.json({ error: "Failed to generate invoice PDF" }, { status: 500 });
  }
}
