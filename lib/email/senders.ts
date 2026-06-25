import type { OrderStatus, Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { sendEmailWithRetry, type EmailType } from "./client";
import {
  renderOrderConfirmationEmail,
  type OrderEmailData,
} from "./templates/order-confirmation";
import { renderPaymentConfirmationEmail } from "./templates/payment-confirmation";
import { renderOrderStatusUpdateEmail } from "./templates/order-status-update";
import {
  renderAdminNewOrderEmail,
  renderAdminPaymentReceivedEmail,
} from "./templates/admin-new-order";

type OrderForEmail = Prisma.OrderGetPayload<{
  include: {
    items: {
      include: {
        product: {
          select: {
            name: true;
            sku: true;
          };
        };
      };
    };
  };
}>;

async function getEmailSettings() {
  const settings = await prisma.storeSettings.findUnique({
    where: { id: "singleton" },
  });

  return {
    from:
      settings?.emailSender ||
      process.env.STORE_FROM_EMAIL ||
      "orders@melaki.co.ke",
    admin:
      settings?.emailNotification ||
      process.env.ADMIN_NOTIFICATION_EMAIL ||
      "admin@melaki.co.ke",
    customerEnabled: settings?.emailCustomerEnabled ?? true,
    adminEnabled: settings?.emailAdminEnabled ?? true,
  };
}

function toEmailOrder(order: OrderForEmail): OrderEmailData {
  return {
    orderId: order.id,
    customerName: order.customerName,
    email: order.email,
    phone: order.phone,
    address: order.address,
    total: Number(order.total),
    items: order.items.map((item) => ({
      name: item.product.name,
      sku: item.product.sku,
      quantity: item.quantity,
      price: Number(item.price),
    })),
  };
}

async function sendRenderedEmail(args: {
  to: string;
  from: string;
  type: EmailType;
  rendered: {
    subject: string;
    html: string;
    text: string;
  };
}) {
  return sendEmailWithRetry({
    to: args.to,
    from: args.from,
    type: args.type,
    subject: args.rendered.subject,
    html: args.rendered.html,
    text: args.rendered.text,
  });
}

export async function notifyOrderCreated(order: OrderForEmail) {
  const settings = await getEmailSettings();
  const emailOrder = toEmailOrder(order);
  const sends: Promise<unknown>[] = [];

  if (settings.customerEnabled && order.email) {
    sends.push(
      sendRenderedEmail({
        to: order.email,
        from: settings.from,
        type: "ORDER_CONFIRMATION",
        rendered: renderOrderConfirmationEmail(emailOrder),
      })
    );
  }

  if (settings.adminEnabled && settings.admin) {
    sends.push(
      sendRenderedEmail({
        to: settings.admin,
        from: settings.from,
        type: "ADMIN_NEW_ORDER",
        rendered: renderAdminNewOrderEmail(emailOrder),
      })
    );
  }

  await Promise.allSettled(sends);
}

export async function notifyPaymentSuccessful(args: {
  order: OrderForEmail;
  amount: number;
  receipt?: string | null;
  paidAt?: Date | null;
}) {
  const settings = await getEmailSettings();
  const emailOrder = toEmailOrder(args.order);
  const sends: Promise<unknown>[] = [];

  if (settings.customerEnabled && args.order.email) {
    sends.push(
      sendRenderedEmail({
        to: args.order.email,
        from: settings.from,
        type: "PAYMENT_CONFIRMATION",
        rendered: renderPaymentConfirmationEmail({
          order: emailOrder,
          amount: args.amount,
          receipt: args.receipt,
          paidAt: args.paidAt,
        }),
      })
    );
  }

  if (settings.adminEnabled && settings.admin) {
    sends.push(
      sendRenderedEmail({
        to: settings.admin,
        from: settings.from,
        type: "ADMIN_PAYMENT_RECEIVED",
        rendered: renderAdminPaymentReceivedEmail({
          order: emailOrder,
          amount: args.amount,
          receipt: args.receipt,
        }),
      })
    );
  }

  await Promise.allSettled(sends);
}

export async function notifyOrderStatusUpdated(args: {
  order: OrderForEmail;
  status: OrderStatus;
  notes?: string | null;
}) {
  const notifiableStatuses: OrderStatus[] = [
    "PROCESSING",
    "SHIPPED",
    "DELIVERED",
    "CANCELLED",
  ];

  if (!notifiableStatuses.includes(args.status)) return;

  const settings = await getEmailSettings();
  if (!settings.customerEnabled || !args.order.email) return;

  await sendRenderedEmail({
    to: args.order.email,
    from: settings.from,
    type: "ORDER_STATUS_UPDATE",
    rendered: renderOrderStatusUpdateEmail(
      toEmailOrder(args.order),
      args.status,
      args.notes
    ),
  });
}
