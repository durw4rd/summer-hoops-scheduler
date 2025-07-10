import { NextResponse } from "next/server";
import { getSchedule } from "@/lib/googleSheets";

export async function GET() {
  try {
    const data = await getSchedule();
    return NextResponse.json({ data });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
} 