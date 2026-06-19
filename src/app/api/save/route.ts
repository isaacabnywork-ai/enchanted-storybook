import { neon } from '@neondatabase/serverless';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { target, data } = await req.json();

    if (!target || !data) {
      return NextResponse.json({ error: "Missing target or data" }, { status: 400 });
    }

    if (target !== "storybook" && target !== "appData") {
      return NextResponse.json({ error: "Invalid target" }, { status: 400 });
    }

    const sql = neon(process.env.DATABASE_URL!);
    
    // Auto-create table if it doesn't exist just in case
    await sql`
      CREATE TABLE IF NOT EXISTS app_content (
        id VARCHAR(50) PRIMARY KEY,
        data JSONB NOT NULL
      )
    `;

    // Upsert the data (cast stringified JSON to JSONB type for Neon)
    await sql`
      INSERT INTO app_content (id, data)
      VALUES (${target}, ${JSON.stringify(data)}::jsonb)
      ON CONFLICT (id) DO UPDATE SET data = EXCLUDED.data
    `;

    return NextResponse.json({ success: true, message: `Successfully saved ${target}` });
  } catch (error) {
    console.error("Database Save Error:", error);
    return NextResponse.json({ error: "Failed to save data" }, { status: 500 });
  }
}
