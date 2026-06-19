import { NextResponse } from "next/server";
import { doc, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebaseConfig";

export async function POST(req: Request) {
  try {
    const { target, data } = await req.json();

    if (!target || !data) {
      return NextResponse.json({ error: "Missing target or data" }, { status: 400 });
    }

    if (target !== "storybook" && target !== "appData") {
      return NextResponse.json({ error: "Invalid target" }, { status: 400 });
    }

    const docRef = doc(db, "content", target);
    await setDoc(docRef, data);

    return NextResponse.json({ success: true, message: `Successfully saved ${target}` });
  } catch (error) {
    console.error("Save Error:", error);
    return NextResponse.json({ error: "Failed to save data" }, { status: 500 });
  }
}
