import { NextResponse } from "next/server";
import { settleSlot, settleSlotById } from "@/lib/googleSheets";

export async function PATCH(req: Request) {
  try {
    const { slotId, date, time, player, requestingUser, adminMode } = await req.json();
    
    // Support both old and new approaches for backward compatibility
    if (slotId) {
      // New ID-based approach
      if (!slotId || !requestingUser) {
        return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
      }
      const result = await settleSlotById({ slotId, requestingUser, adminMode });
      return NextResponse.json(result);
    } else {
      // Old approach for backward compatibility
      if (!date || !time || !player || !requestingUser) {
        return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
      }
      const result = await settleSlot({ date, time, player, requestingUser, adminMode });
      return NextResponse.json(result);
    }
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
} 