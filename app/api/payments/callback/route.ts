import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyCallback } from "@/lib/mpesa/verifyCallback";
import { MpesaCallbackPayload } from "@/lib/mpesa/types";
import { notifyPaymentSuccessful } from "@/lib/email/senders";

export async function POST(request: NextRequest) {
  try {
    const body: MpesaCallbackPayload = await request.json();
    const headers = Object.fromEntries(request.headers.entries());

    // 1. Verify Callback Signature
    if (
      !verifyCallback({
        headers,
        callbackSecret: request.nextUrl.searchParams.get("secret"),
      })
    ) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }

    const stkCallback = body?.Body?.stkCallback;
    if (!stkCallback) {
      return NextResponse.json({ error: "Invalid callback body" }, { status: 400 });
    }

    const { CheckoutRequestID, ResultCode, ResultDesc, CallbackMetadata } = stkCallback;

    // 2. Fetch existing payment record
    const payment = await prisma.payment.findUnique({
      where: { checkoutRequestId: CheckoutRequestID },
      include: {
        order: {
          include: {
            items: {
              include: {
                product: true,
              },
            },
          },
        },
      },
    });

    if (!payment) {
      console.error(`Payment record not found for CheckoutRequestID: ${CheckoutRequestID}`);
      return NextResponse.json({ error: "Payment record not found" }, { status: 404 });
    }

    // Idempotency check: Already processed
    if (payment.status !== "PENDING" && payment.status !== "PROCESSING") {
      return NextResponse.json({ ResponseCode: "0", ResponseDesc: "Already processed" });
    }

    if (ResultCode === 0) {
      // Payment succeeded
      const metadataItems = CallbackMetadata?.Item || [];
      const receiptItem = metadataItems.find((item) => item.Name === "MpesaReceiptNumber");
      const phoneItem = metadataItems.find((item) => item.Name === "PhoneNumber");

      const mpesaReceipt = receiptItem?.Value ? String(receiptItem.Value) : null;
      const phone = phoneItem?.Value ? String(phoneItem.Value) : null;

      // Run transactional operations to ensure atomicity
      await prisma.$transaction(async (tx) => {
        // Step 1: Inventory stock protection verification
        for (const item of payment.order.items) {
          const product = await tx.product.findUnique({
            where: { id: item.productId },
          });

          if (!product || product.stock < item.quantity) {
            throw new Error(
              `Insufficient inventory for product: ${product?.name || item.productId}. Stock is ${product?.stock || 0}, requested ${item.quantity}.`
            );
          }
        }

        // Step 2: Update Payment Status
        await tx.payment.update({
          where: { id: payment.id },
          data: {
            status: "SUCCESS",
            mpesaReceipt,
            phoneNumber: phone || payment.phoneNumber,
            resultCode: ResultCode,
            resultDesc: ResultDesc,
            paidAt: new Date(),
            transactionRef: mpesaReceipt,
          },
        });

        // Step 3: Update Order Status to PAID and write timeline log
        await tx.order.update({
          where: { id: payment.orderId },
          data: {
            status: "PAID",
            statusHistory: {
              create: {
                status: "PAID",
                notes: `Payment of KSh ${Number(payment.amount).toLocaleString()} verified via M-Pesa. Receipt: ${mpesaReceipt || "N/A"}`,
              },
            },
          },
        });

        // Step 4: Reduce inventory stock
        for (const item of payment.order.items) {
          await tx.product.update({
            where: { id: item.productId },
            data: {
              stock: {
                decrement: item.quantity,
              },
            },
          });
        }
      });

      await notifyPaymentSuccessful({
        order: payment.order,
        amount: Number(payment.amount),
        receipt: mpesaReceipt,
        paidAt: new Date(),
      }).catch((error) => {
        console.error("Payment notification failed:", error);
      });

      console.log(`Payment SUCCESS processed for order ${payment.orderId}, receipt: ${mpesaReceipt}`);
    } else {
      // Payment failed, cancelled, or timed out
      let finalStatus: "FAILED" | "CANCELLED" | "TIMEOUT" = "FAILED";
      
      if (ResultCode === 1032) {
        finalStatus = "CANCELLED";
      } else if (ResultCode === 2001 || ResultCode === 1037) {
        finalStatus = "TIMEOUT";
      }

      await prisma.payment.update({
        where: { id: payment.id },
        data: {
          status: finalStatus,
          resultCode: ResultCode,
          resultDesc: ResultDesc,
        },
      });

      // Log failure in order status history timeline (keeps order status PENDING)
      await prisma.orderStatusHistory.create({
        data: {
          orderId: payment.orderId,
          status: payment.order.status,
          notes: `M-Pesa payment failed/cancelled with status: ${finalStatus}. Code: ${ResultCode}, Description: ${ResultDesc}`,
        },
      });

      console.log(`Payment FAILED/CANCELLED processed for order ${payment.orderId}. Status: ${finalStatus}`);
    }

    return NextResponse.json({ ResponseCode: "0", ResponseDesc: "success" });
  } catch (error) {
    const err = error as Error;
    console.error("M-Pesa Callback Route Error:", err);
    return NextResponse.json(
      { error: err.message || "Callback processing failed" },
      { status: 500 }
    );
  }
}
