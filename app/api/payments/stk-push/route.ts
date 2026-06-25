import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { initiateStkPush } from "@/lib/mpesa/stkPush";
import { formatPhoneNumber } from "@/lib/mpesa/utils";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { orderId, phoneNumber } = body;

    if (!orderId || !phoneNumber) {
      return NextResponse.json(
        { error: "orderId and phoneNumber are required" },
        { status: 400 }
      );
    }

    const order = await prisma.order.findUnique({
      where: { id: orderId },
    });

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    if (order.status !== "PENDING" && order.status !== "PROCESSING") {
      return NextResponse.json(
        { error: `Order is already in ${order.status} status` },
        { status: 400 }
      );
    }

    const formattedPhone = formatPhoneNumber(phoneNumber);
    if (!formattedPhone || formattedPhone.length < 10) {
      return NextResponse.json(
        { error: "Invalid phone number format" },
        { status: 400 }
      );
    }

    // Call Daraja STK Push
    const stkResponse = await initiateStkPush({
      amount: Number(order.total),
      phone: formattedPhone,
      orderId: order.id,
    });

    if (stkResponse.ResponseCode !== "0") {
      return NextResponse.json(
        { error: stkResponse.ResponseDescription || "STK Push initiation failed" },
        { status: 500 }
      );
    }

    // Create payment record in database
    await prisma.payment.create({
      data: {
        orderId: order.id,
        amount: order.total,
        paymentMethod: "M-PESA",
        status: "PENDING",
        checkoutRequestId: stkResponse.CheckoutRequestID,
        merchantRequestId: stkResponse.MerchantRequestID,
        phoneNumber: formattedPhone,
      },
    });

    return NextResponse.json({
      success: true,
      checkoutRequestId: stkResponse.CheckoutRequestID,
      customerMessage: stkResponse.CustomerMessage,
    });
  } catch (error) {
    const err = error as Error;
    console.error("STK Push Route Error:", err);
    return NextResponse.json(
      { error: err.message || "Failed to process STK Push" },
      { status: 500 }
    );
  }
}
