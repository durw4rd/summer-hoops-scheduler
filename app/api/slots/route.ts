import { NextResponse } from "next/server";
import { getAvailableSlots, offerSlotForGrabs, claimSlot, retractSlot, getAllSlots, requestSlotSwap } from "@/lib/googleSheets";

export async function GET() {
  try {
    const slots = await getAllSlots();
    return NextResponse.json({ slots });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const { date, time, player } = await req.json();
    if (!date || !time || !player) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }
    const result = await offerSlotForGrabs({ date, time, player });
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const { date, time, player, claimer } = await req.json();
    if (!date || !time || !player || !claimer) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }
    const result = await claimSlot({ date, time, player, claimer });
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { date, time, player } = await req.json();
    if (!date || !time || !player) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }
    const result = await retractSlot({ date, time, player });
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}

// New: handle POST /api/slots/swap for swap requests
export async function POST_SWAP(req: Request) {
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

// New: handle GET /api/slots/swaps to list all swap requests
export async function GET_SWAPS() {
  try {
    const slots = await getAllSlots();
    // Only rows with SwapRequested === 'yes'
    const swaps = slots.filter((slot: any) => slot.SwapRequested === 'yes');
    return NextResponse.json({ swaps });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
} 