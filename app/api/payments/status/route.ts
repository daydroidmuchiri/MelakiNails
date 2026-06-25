import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const checkoutRequestId = searchParams.get("checkoutRequestId");

    if (!checkoutRequestId) {
      return NextResponse.json(
        { error: "checkoutRequestId query parameter is required" },
        { status: 400 }
      );
    }

    const payment = await prisma.payment.findUnique({
      where: { checkoutRequestId },
      select: {
        status: true,
        resultCode: true,
        resultDesc: true,
      },
    });

    if (!payment) {
      return NextResponse.json({ error: "Payment not found" }, { status: 404 });
    }

    return NextResponse.json({
      status: payment.status,
      resultCode: payment.resultCode,
      resultDesc: payment.resultDesc,
    });
  } catch (error) {
    const err = error as Error;
    console.error("Payment Status Route Error:", err);
    return NextResponse.json(
      { error: err.message || "Failed to fetch payment status" },
      { status: 500 }
    );
  }
}
