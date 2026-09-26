import { neon } from '@neondatabase/serverless';
import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

export async function GET() {
  try {
    // If DATABASE_URL is provided, use Neon database
    if (process.env.DATABASE_URL) {
      const sql = neon(process.env.DATABASE_URL);
      
      // Auto-create table if it doesn't exist
      await sql`
        CREATE TABLE IF NOT EXISTS app_content (
          id VARCHAR(50) PRIMARY KEY,
          data JSONB NOT NULL
        )
      `;

      const result = await sql`SELECT id, data FROM app_content`;
      
      let storybookData = null;
      let appData = null;

      for (const row of result) {
        if (row.id === 'storybook') storybookData = row.data;
        if (row.id === 'appData') appData = row.data;
      }

      if (storybookData || appData) {
        return NextResponse.json({ storybookData, appData });
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
