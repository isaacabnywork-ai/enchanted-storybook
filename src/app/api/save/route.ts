import { NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";

export async function POST(req: Request) {
  try {
    const { target, data } = await req.json();

    if (!target || !data) {
      return NextResponse.json({ error: "Missing target or data" }, { status: 400 });
    }

    if (target !== "storybook" && target !== "appData") {
      return NextResponse.json({ error: "Invalid target" }, { status: 400 });
    }

    const dataDir = path.join(process.cwd(), "src/data");
    const fileName = target === "storybook" ? "storybookData.json" : "appData.json";
    const filePath = path.join(dataDir, fileName);

    await fs.writeFile(filePath, JSON.stringify(data, null, 2), "utf8");

    return NextResponse.json({ success: true, message: `Successfully saved ${target}` });
  } catch (error) {
    console.error("Save Error:", error);
    return NextResponse.json({ error: "Failed to save data" }, { status: 500 });
  }
}
