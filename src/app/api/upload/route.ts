import { NextResponse } from "next/server";
import { v2 as cloudinary } from "cloudinary";


// Extend function timeout on Vercel
export const maxDuration = 30;

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "No file received." }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Convert to base64 data URI — more reliable than streams on serverless
    const base64DataUri = `data:${file.type};base64,${buffer.toString("base64")}`;

    const result = await cloudinary.uploader.upload(base64DataUri, {
      folder: "enchanted-storybook",
      resource_type: "image",
    });

    return NextResponse.json({ url: result.secure_url, success: true });
  } catch (error: unknown) {
    const err = error as { message?: string };
    console.error("Upload error:", err?.message || error);
    return NextResponse.json(
      { error: "Failed to upload file.", detail: err?.message || String(error) },
      { status: 500 }
    );
  }
}
