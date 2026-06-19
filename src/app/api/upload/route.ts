import { NextResponse } from "next/server";
import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function POST(req: Request) {
  // --- Debug: log env var presence (not values) ---
  console.log("Cloudinary config check:", {
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME ? "SET" : "MISSING",
    api_key: process.env.CLOUDINARY_API_KEY ? "SET" : "MISSING",
    api_secret: process.env.CLOUDINARY_API_SECRET ? "SET" : "MISSING",
  });

  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "No file received." }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Upload to Cloudinary via upload stream
    const result = await new Promise<{ secure_url: string }>((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: "enchanted-storybook",
          resource_type: "image",
        },
        (error, result) => {
          if (error || !result) {
            console.error("Cloudinary upload_stream error:", error);
            return reject(error || new Error("Upload failed"));
          }
          resolve(result as { secure_url: string });
        }
      );
      uploadStream.end(buffer);
    });

    return NextResponse.json({ url: result.secure_url, success: true });
  } catch (error: any) {
    console.error("Upload error:", error?.message || error);
    return NextResponse.json(
      { error: "Failed to upload file.", detail: error?.message || "Unknown error" },
      { status: 500 }
    );
  }
}
