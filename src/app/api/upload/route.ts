import { NextResponse } from "next/server";
import { v2 as cloudinary } from "cloudinary";
import fs from "fs/promises";
import path from "path";

// Extend function timeout on Vercel
export const maxDuration = 30;

if (process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });
}

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "No file received." }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Try Cloudinary first if configured
    if (process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET) {
      try {
        const base64DataUri = `data:${file.type || "image/png"};base64,${buffer.toString("base64")}`;
        const result = await cloudinary.uploader.upload(base64DataUri, {
          folder: "enchanted-storybook",
          resource_type: "image",
        });
        return NextResponse.json({ url: result.secure_url, success: true });
      } catch (cloudErr) {
        console.warn("Cloudinary upload failed, falling back to local storage:", cloudErr);
      }
    }

    // Local filesystem storage fallback
    const uploadsDir = path.join(process.cwd(), "public", "uploads");
    await fs.mkdir(uploadsDir, { recursive: true });

    const safeName = (file.name || "image.png").replace(/[^a-zA-Z0-9._-]/g, "_");
    const filename = `${Date.now()}-${safeName}`;
    const filePath = path.join(uploadsDir, filename);

    await fs.writeFile(filePath, buffer);

    return NextResponse.json({ url: `/uploads/${filename}`, success: true });
  } catch (error: unknown) {
    const err = error as { message?: string };
    console.error("Upload error:", err?.message || error);
    return NextResponse.json(
      { error: "Failed to upload file.", detail: err?.message || String(error) },
      { status: 500 }
    );
  }
}

