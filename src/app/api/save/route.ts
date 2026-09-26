import { MongoClient } from 'mongodb';
import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

export async function POST(req: Request) {
  try {
    const { target, data } = await req.json();

    if (!target || !data) {
      return NextResponse.json({ error: "Missing target or data" }, { status: 400 });
    }

    if (target !== "storybook" && target !== "appData") {
      return NextResponse.json({ error: "Invalid target" }, { status: 400 });
    }

    // If MONGODB_URI is provided, use MongoDB
    if (process.env.MONGODB_URI) {
      let client: MongoClient | null = null;
      try {
        client = new MongoClient(process.env.MONGODB_URI, {
          serverSelectionTimeoutMS: 10000,
          connectTimeoutMS: 10000,
        });
        await client.connect();
        const db = client.db('enchanted-storybook');
        const collection = db.collection('app_content');

        await collection.updateOne(
          { _id: target as unknown as never },
          { $set: { data } },
          { upsert: true }
        );

        return NextResponse.json({ success: true, message: `Successfully saved ${target}` });
      } catch (dbError: unknown) {
        const message = dbError instanceof Error ? dbError.message : String(dbError);
        console.error("MongoDB Save Error:", message);
        return NextResponse.json({ error: `Database error: ${message}` }, { status: 500 });
      } finally {
        if (client) await client.close();
      }
    }

    // Local file fallback for development
    const filename = target === "storybook" ? "storybookData.json" : "appData.json";
    const filePath = path.join(process.cwd(), 'src', 'data', filename);

    await fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf-8');

    return NextResponse.json({ success: true, message: `Successfully saved ${target} locally` });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("Save Error:", message);
    return NextResponse.json({ error: `Failed to save data: ${message}` }, { status: 500 });
  }
}
