import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { OrderDetailView } from "@/components/admin/OrderDetailView";

export const revalidate = 0; // Fresh DB reads

interface PageProps {
  params: {
    id: string;
  };
}

export default async function AdminOrderDetailPage({ params }: PageProps) {
  const order = await prisma.order.findUnique({
    where: { id: params.id },
    include: {
      items: {
        include: {
          product: {
            select: {
              name: true,
              sku: true,
            },
          },
        },
      },
      payments: {
        orderBy: { createdAt: "desc" },
      },
      statusHistory: {
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!order) {
    notFound();
  }

  return <OrderDetailView order={order} />;
}
