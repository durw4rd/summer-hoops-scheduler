import { NextResponse } from "next/server";
import { settleSlot } from "@/lib/googleSheets";

export async function PATCH(req: Request) {
  try {
    const { date, time, player } = await req.json();
    if (!date || !time || !player) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }
    const result = await settleSlot({ date, time, player });
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
} 