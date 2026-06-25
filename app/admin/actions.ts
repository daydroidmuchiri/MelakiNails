"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";
import type { OrderStatus } from "@prisma/client";
import { slugify } from "@/lib/utils";
import { notifyOrderStatusUpdated, notifyPaymentSuccessful } from "@/lib/email/senders";
import { requireAdminSession } from "@/lib/adminAuth";

// ─── Image Upload Helper ─────────────────────────────────────────────────────
async function uploadImage(file: File | string | null): Promise<string | null> {
  if (!file || typeof file === "string") {
    return file;
  }
  
  if (file.size === 0) {
    return null;
  }

  try {
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const uploadDir = join(process.cwd(), "public", "uploads");
    await mkdir(uploadDir, { recursive: true });
    
    // Sanitize filename
    const cleanName = file.name.replace(/[^\w\s.-]/g, "").replace(/\s+/g, "-");
    const filename = `${Date.now()}-${cleanName}`;
    const filePath = join(uploadDir, filename);
    await writeFile(filePath, buffer);
    return `/uploads/${filename}`;
  } catch (error) {
    console.error("Failed to upload image:", error);
    return null;
  }
}

// ─── Product Actions ─────────────────────────────────────────────────────────
export async function createProduct(formData: FormData) {
  await requireAdminSession();
  const name = formData.get("name") as string;
  const description = formData.get("description") as string;
  const price = parseFloat(formData.get("price") as string);
  const originalPriceStr = formData.get("originalPrice") as string;
  const originalPrice = originalPriceStr ? parseFloat(originalPriceStr) : null;
  const sku = formData.get("sku") as string || null;
  const stock = parseInt(formData.get("stock") as string) || 0;
  const lowStockThreshold = parseInt(formData.get("lowStockThreshold") as string) || 5;
  const active = formData.get("active") === "true";
  const featured = formData.get("featured") === "true";
  const categoryId = formData.get("categoryId") as string;
  const badge = formData.get("badge") as string || null;

  if (!name.trim() || !categoryId || !Number.isFinite(price) || price < 0) {
    throw new Error("Invalid product details");
  }

  const imageFiles = formData.getAll("images") as (File | string)[];
  const imageUrls: string[] = [];

  for (const img of imageFiles) {
    if (typeof img === "string" && img.startsWith("http")) {
      imageUrls.push(img);
    } else if (img instanceof File && img.size > 0) {
      const url = await uploadImage(img);
      if (url) imageUrls.push(url);
    }
  }

  // Fallback placeholder image if none uploaded
  if (imageUrls.length === 0) {
    imageUrls.push("https://images.unsplash.com/photo-1604654894610-df63bc536371?w=600&q=80");
  }

  const slug = slugify(name);

  await prisma.product.create({
    data: {
      name,
      slug,
      description,
      price,
      originalPrice,
      sku,
      stock: Math.max(0, stock),
      lowStockThreshold: Math.max(0, lowStockThreshold),
      active,
      featured,
      categoryId,
      badge,
      images: imageUrls,
    },
  });

  revalidatePath("/products");
  revalidatePath("/admin/products");
  revalidatePath("/admin/inventory");
}

export async function updateProduct(id: string, formData: FormData) {
  await requireAdminSession();
  const name = formData.get("name") as string;
  const description = formData.get("description") as string;
  const price = parseFloat(formData.get("price") as string);
  const originalPriceStr = formData.get("originalPrice") as string;
  const originalPrice = originalPriceStr ? parseFloat(originalPriceStr) : null;
  const sku = formData.get("sku") as string || null;
  const stock = parseInt(formData.get("stock") as string) || 0;
  const lowStockThreshold = parseInt(formData.get("lowStockThreshold") as string) || 5;
  const active = formData.get("active") === "true";
  const featured = formData.get("featured") === "true";
  const categoryId = formData.get("categoryId") as string;
  const badge = formData.get("badge") as string || null;

  if (!name.trim() || !categoryId || !Number.isFinite(price) || price < 0) {
    throw new Error("Invalid product details");
  }

  // Existing images URL list
  const existingImages = formData.getAll("existingImages") as string[];
  const imageFiles = formData.getAll("images") as (File | string)[];
  const imageUrls: string[] = [...existingImages];

  for (const img of imageFiles) {
    if (img instanceof File && img.size > 0) {
      const url = await uploadImage(img);
      if (url) imageUrls.push(url);
    }
  }

  const slug = slugify(name);

  await prisma.product.update({
    where: { id },
    data: {
      name,
      slug,
      description,
      price,
      originalPrice,
      sku,
      stock: Math.max(0, stock),
      lowStockThreshold: Math.max(0, lowStockThreshold),
      active,
      featured,
      categoryId,
      badge,
      images: imageUrls,
    },
  });

  revalidatePath("/products");
  revalidatePath(`/products/${slug}`);
  revalidatePath("/admin/products");
  revalidatePath("/admin/inventory");
}

export async function deleteProduct(id: string) {
  await requireAdminSession();
  await prisma.product.delete({
    where: { id },
  });
  revalidatePath("/products");
  revalidatePath("/admin/products");
  revalidatePath("/admin/inventory");
}

// ─── Category Actions ────────────────────────────────────────────────────────
export async function createCategory(formData: FormData) {
  await requireAdminSession();
  const name = formData.get("name") as string;
  const displayOrder = parseInt(formData.get("displayOrder") as string) || 0;
  const active = formData.get("active") === "true";
  const imageFile = formData.get("image") as File | string | null;

  const imageUrl = await uploadImage(imageFile);
  const slug = slugify(name);

  if (!name.trim()) {
    throw new Error("Category name is required");
  }

  await prisma.category.create({
    data: {
      name,
      slug,
      displayOrder,
      active,
      image: imageUrl,
    },
  });

  revalidatePath("/products");
  revalidatePath("/admin/categories");
}

export async function updateCategory(id: string, formData: FormData) {
  await requireAdminSession();
  const name = formData.get("name") as string;
  const displayOrder = parseInt(formData.get("displayOrder") as string) || 0;
  const active = formData.get("active") === "true";
  const imageFile = formData.get("image") as File | string | null;
  const existingImage = formData.get("existingImage") as string || null;

  let imageUrl = existingImage;
  if (imageFile instanceof File && imageFile.size > 0) {
    const uploaded = await uploadImage(imageFile);
    if (uploaded) imageUrl = uploaded;
  }

  const slug = slugify(name);

  if (!name.trim()) {
    throw new Error("Category name is required");
  }

  await prisma.category.update({
    where: { id },
    data: {
      name,
      slug,
      displayOrder,
      active,
      image: imageUrl,
    },
  });

  revalidatePath("/products");
  revalidatePath("/admin/categories");
}

export async function deleteCategory(id: string) {
  await requireAdminSession();
  await prisma.category.delete({
    where: { id },
  });
  revalidatePath("/products");
  revalidatePath("/admin/categories");
}

// ─── Order & Payment Actions ─────────────────────────────────────────────────
export async function updateOrderStatus(orderId: string, status: OrderStatus, notes?: string) {
  await requireAdminSession();
  const order = await prisma.order.update({
    where: { id: orderId },
    data: {
      status,
      statusHistory: {
        create: {
          status,
          notes: notes || `Order status updated to ${status}`,
        },
      },
    },
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
    },
  });

  await notifyOrderStatusUpdated({ order, status, notes }).catch((error) => {
    console.error("Order status notification failed:", error);
  });

  revalidatePath("/admin/orders");
  revalidatePath(`/admin/orders/${orderId}`);
}

export async function addOrderPayment(
  orderId: string,
  amount: number,
  paymentMethod: string,
  transactionRef?: string
) {
  await requireAdminSession();
  if (!Number.isFinite(amount) || amount <= 0) {
    throw new Error("Invalid payment amount");
  }

  const [, order] = await prisma.$transaction([
    prisma.payment.create({
      data: {
        orderId,
        amount,
        paymentMethod,
        transactionRef: transactionRef || null,
        status: "SUCCESS",
      },
    }),
    prisma.order.update({
      where: { id: orderId },
      data: {
        status: "PAID",
        statusHistory: {
          create: {
            status: "PAID",
            notes: `Payment of KSh ${amount.toLocaleString()} received via ${paymentMethod}. Ref: ${transactionRef || "N/A"}`,
          },
        },
      },
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
      },
    }),
  ]);

  await notifyPaymentSuccessful({
    order,
    amount,
    receipt: transactionRef,
    paidAt: new Date(),
  }).catch((error) => {
    console.error("Manual payment notification failed:", error);
  });

  revalidatePath("/admin/orders");
  revalidatePath(`/admin/orders/${orderId}`);
}

// ─── Inventory Actions ───────────────────────────────────────────────────────
export async function adjustInventory(productId: string, stock: number, lowStockThreshold: number) {
  await requireAdminSession();
  if (!Number.isFinite(stock) || !Number.isFinite(lowStockThreshold)) {
    throw new Error("Invalid inventory values");
  }

  await prisma.product.update({
    where: { id: productId },
    data: {
      stock: Math.max(0, Math.floor(stock)),
      lowStockThreshold: Math.max(0, Math.floor(lowStockThreshold)),
    },
  });

  revalidatePath("/admin/products");
  revalidatePath("/admin/inventory");
  revalidatePath("/products");
}

// ─── Promotion Actions ───────────────────────────────────────────────────────
export async function createPromotion(formData: FormData) {
  await requireAdminSession();
  const title = formData.get("title") as string;
  const description = formData.get("description") as string;
  const discountPercentage = parseFloat(formData.get("discountPercentage") as string);
  const active = formData.get("active") === "true";
  const startDate = new Date(formData.get("startDate") as string);
  const endDate = new Date(formData.get("endDate") as string);

  if (!title.trim() || !Number.isFinite(discountPercentage) || discountPercentage < 0 || discountPercentage > 100 || startDate > endDate) {
    throw new Error("Invalid promotion details");
  }

  await prisma.promotion.create({
    data: {
      title,
      description,
      discountPercentage,
      active,
      startDate,
      endDate,
    },
  });

  revalidatePath("/admin/promotions");
  revalidatePath("/products");
}

export async function updatePromotion(id: string, formData: FormData) {
  await requireAdminSession();
  const title = formData.get("title") as string;
  const description = formData.get("description") as string;
  const discountPercentage = parseFloat(formData.get("discountPercentage") as string);
  const active = formData.get("active") === "true";
  const startDate = new Date(formData.get("startDate") as string);
  const endDate = new Date(formData.get("endDate") as string);

  if (!title.trim() || !Number.isFinite(discountPercentage) || discountPercentage < 0 || discountPercentage > 100 || startDate > endDate) {
    throw new Error("Invalid promotion details");
  }

  await prisma.promotion.update({
    where: { id },
    data: {
      title,
      description,
      discountPercentage,
      active,
      startDate,
      endDate,
    },
  });

  revalidatePath("/admin/promotions");
  revalidatePath("/products");
}

export async function deletePromotion(id: string) {
  await requireAdminSession();
  await prisma.promotion.delete({
    where: { id },
  });
  revalidatePath("/admin/promotions");
}

// ─── Settings Actions ────────────────────────────────────────────────────────
export async function saveStoreSettings(formData: FormData) {
  await requireAdminSession();
  const storeName = formData.get("storeName") as string;
  const phone = formData.get("phone") as string;
  const phone2 = formData.get("phone2") as string || null;
  const email = formData.get("email") as string;
  const address = formData.get("address") as string;
  const facebook = formData.get("facebook") as string || null;
  const instagram = formData.get("instagram") as string || null;
  const twitter = formData.get("twitter") as string || null;
  const youtube = formData.get("youtube") as string || null;
  const whatsapp = formData.get("whatsapp") as string || null;
  const hours = formData.get("hours") as string;

  if (!storeName.trim() || !email.includes("@") || !phone.trim() || !address.trim()) {
    throw new Error("Invalid store settings");
  }

  await prisma.storeSettings.upsert({
    where: { id: "singleton" },
    update: {
      storeName,
      phone,
      phone2,
      email,
      address,
      facebook,
      instagram,
      twitter,
      youtube,
      whatsapp,
      hours,
    },
    create: {
      id: "singleton",
      storeName,
      phone,
      phone2,
      email,
      address,
      facebook,
      instagram,
      twitter,
      youtube,
      whatsapp,
      hours,
    },
  });

  revalidatePath("/", "layout");
}

export async function saveEmailSettings(formData: FormData) {
  await requireAdminSession();
  const emailSender = formData.get("emailSender") as string;
  const emailNotification = formData.get("emailNotification") as string;
  const emailCustomerEnabled = formData.get("emailCustomerEnabled") === "true";
  const emailAdminEnabled = formData.get("emailAdminEnabled") === "true";

  if (!emailSender.includes("@") || !emailNotification.includes("@")) {
    throw new Error("Invalid email settings");
  }

  await prisma.storeSettings.upsert({
    where: { id: "singleton" },
    update: {
      emailSender,
      emailNotification,
      emailCustomerEnabled,
      emailAdminEnabled,
    },
    create: {
      id: "singleton",
      emailSender,
      emailNotification,
      emailCustomerEnabled,
      emailAdminEnabled,
    },
  });

  revalidatePath("/admin/settings/email");
}
