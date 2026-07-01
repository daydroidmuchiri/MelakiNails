import { v2 as cloudinary, type UploadApiResponse } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

const MAX_IMAGE_BYTES = 5 * 1024 * 1024; // 5MB
const UPLOAD_FOLDER = "melaki";

// Validates MIME type by declared content-type AND by sniffing magic bytes —
// a client can freely lie about File.type, so it can't be trusted alone.
// This blocks e.g. an .html/.svg file renamed with an image content-type.
const ALLOWED_IMAGE_TYPES: Record<string, (buf: Buffer) => boolean> = {
  "image/jpeg": (buf) => buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff,
  "image/png": (buf) =>
    buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47,
  "image/webp": (buf) =>
    buf.slice(0, 4).toString("ascii") === "RIFF" && buf.slice(8, 12).toString("ascii") === "WEBP",
  "image/gif": (buf) => {
    const header = buf.slice(0, 6).toString("ascii");
    return header === "GIF87a" || header === "GIF89a";
  },
};

export interface UploadedImage {
  url: string;
  publicId: string;
}

/**
 * Validates and uploads an image to Cloudinary. Never touches the local
 * filesystem — required for serverless/read-only hosts like Vercel, and
 * keeps uploaded assets on CDN-backed storage with automatic optimization.
 */
export async function uploadProductImage(file: File): Promise<UploadedImage> {
  if (file.size === 0) {
    throw new Error("Empty file cannot be uploaded.");
  }
  if (file.size > MAX_IMAGE_BYTES) {
    throw new Error("Image is too large — maximum size is 5MB.");
  }

  const buffer = Buffer.from(await file.arrayBuffer());

  const sniffer = ALLOWED_IMAGE_TYPES[file.type];
  if (!sniffer || !sniffer(buffer)) {
    throw new Error("Unsupported file type — only JPEG, PNG, WEBP, and GIF images are allowed.");
  }

  const result = await new Promise<UploadApiResponse>((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder: UPLOAD_FOLDER, resource_type: "image" },
      (error, uploadResult) => {
        if (error || !uploadResult) {
          reject(error instanceof Error ? error : new Error("Cloudinary upload failed"));
        } else {
          resolve(uploadResult);
        }
      }
    );
    stream.end(buffer);
  });

  return { url: result.secure_url, publicId: result.public_id };
}

/**
 * Deletes an image from Cloudinary given its stored URL. Silently no-ops for
 * URLs that aren't Cloudinary-hosted (e.g. externally pasted image URLs, or
 * the Unsplash placeholder default) — those were never uploaded by us and
 * are never ours to delete. Best-effort: logs and swallows failures so a
 * transient Cloudinary error never blocks the product/category mutation
 * that triggered the cleanup.
 */
export async function deleteProductImage(url: string): Promise<void> {
  const publicId = extractPublicId(url);
  if (!publicId) return;

  try {
    await cloudinary.uploader.destroy(publicId);
  } catch (error) {
    console.error(`Failed to delete Cloudinary image ${publicId}:`, error);
  }
}

function extractPublicId(url: string): string | null {
  if (!url.includes("res.cloudinary.com")) return null;
  const match = url.match(/\/upload\/(?:v\d+\/)?(.+)\.[a-zA-Z0-9]+(?:\?.*)?$/);
  return match ? match[1] : null;
}
