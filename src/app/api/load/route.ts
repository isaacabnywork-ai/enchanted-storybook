import { NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";

export async function GET() {
  try {
    const dataDir = path.join(process.cwd(), "src/data");
    const storybookRaw = await fs.readFile(path.join(dataDir, "storybookData.json"), "utf8");
    const appRaw = await fs.readFile(path.join(dataDir, "appData.json"), "utf8");
    
    return NextResponse.json({
      storybookData: JSON.parse(storybookRaw),
      appData: JSON.parse(appRaw)
    });
  } catch (error) {
    console.error("Load Error:", error);
    return NextResponse.json({ error: "Failed to load data" }, { status: 500 });
  }
}
