import { NextResponse } from "next/server";
import { requestSlotSwap, acceptSlotSwap } from "@/lib/googleSheets";

export async function POST(req: Request) {
  try {
    const { date, time, player, requestedDate, requestedTime } = await req.json();
    if (!date || !time || !player || !requestedDate || !requestedTime) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }
    const result = await requestSlotSwap({ date, time, player, requestedDate, requestedTime });
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const { date, time, player, requestedDate, requestedTime, acceptingPlayer } = await req.json();
    if (!date || !time || !player || !requestedDate || !requestedTime || !acceptingPlayer) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }
    const result = await acceptSlotSwap({ date, time, player, requestedDate, requestedTime, acceptingPlayer });
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
} 