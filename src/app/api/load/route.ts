import { neon } from '@neondatabase/serverless';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const sql = neon(process.env.DATABASE_URL!);
    
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

    return NextResponse.json({ storybookData, appData });
  } catch (error) {
    console.error("Database Load Error:", error);
    return NextResponse.json({ error: "Failed to load database" }, { status: 500 });
  }
}
