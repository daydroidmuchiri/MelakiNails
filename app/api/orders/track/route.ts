import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Uses request.nextUrl.searchParams — a dynamic API. Force dynamic
// explicitly so `next build` never attempts a static trial-render.
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const query = searchParams.get("query")?.trim();
    const email = searchParams.get("email")?.trim().toLowerCase();

    if (!query || !email) {
      return NextResponse.json(
        { error: "Order reference and email are required" },
        { status: 400 }
      );
    }

    // Try to find the order by ID or by tracking token, verifying the email matches
    const order = await prisma.order.findFirst({
      where: {
        OR: [
          { id: query },
          { trackingToken: query },
          { id: { endsWith: query } } // Support entering short order suffix
        ],
        email: {
          equals: email,
          mode: "insensitive"
        }
      },
      include: {
        items: {
          include: {
            product: true
          }
        },
        payments: {
          orderBy: {
            createdAt: "desc"
          }
        },
        statusHistory: {
          orderBy: {
            createdAt: "asc"
          }
        }
      }
    });

    if (!order) {
      return NextResponse.json(
        { error: "Order not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(order);
  } catch (error) {
    console.error("Order tracking API error:", error);
    return NextResponse.json(
      { error: "An error occurred while tracking your order" },
      { status: 500 }
    );
  }
}
