import { MongoClient } from 'mongodb';
import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

export async function GET() {
  try {
    // If MONGODB_URI is provided, use MongoDB
    if (process.env.MONGODB_URI) {
      const client = new MongoClient(process.env.MONGODB_URI);
      try {
        await client.connect();
        const db = client.db('enchanted-storybook');
        const collection = db.collection('app_content');

        const docs = await collection.find({ _id: { $in: ['storybook', 'appData'] as never[] } }).toArray();

        let storybookData = null;
        let appData = null;

        for (const doc of docs) {
          if ((doc._id as unknown as string) === 'storybook') storybookData = doc.data;
          if ((doc._id as unknown as string) === 'appData') appData = doc.data;
        }

        if (storybookData || appData) {
          return NextResponse.json({ storybookData, appData });
        }
      } finally {
        await client.close();
      }
    }

    // Graceful fallback to local JSON files
    const storybookPath = path.join(process.cwd(), 'src', 'data', 'storybookData.json');
    const appDataPath = path.join(process.cwd(), 'src', 'data', 'appData.json');

    const [storybookRaw, appDataRaw] = await Promise.all([
      fs.readFile(storybookPath, 'utf-8').catch(() => null),
      fs.readFile(appDataPath, 'utf-8').catch(() => null),
    ]);

    const storybookData = storybookRaw ? JSON.parse(storybookRaw) : null;
    const appData = appDataRaw ? JSON.parse(appDataRaw) : null;

    return NextResponse.json({ storybookData, appData });
  } catch (error) {
    console.error("Load Error:", error);
    return NextResponse.json({ error: "Failed to load content" }, { status: 500 });
  }
}
