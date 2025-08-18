import { NextRequest, NextResponse } from 'next/server';
import { markSettlementComplete } from '@/lib/googleSheets';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { fromPlayer, toPlayer, amount } = body;

    // Validate input
    if (!fromPlayer || !toPlayer || typeof amount !== 'number') {
      return NextResponse.json(
        { success: false, error: 'Invalid input. fromPlayer, toPlayer, and amount (number) are required.' },
        { status: 400 }
      );
    }

    // For now, we'll need to find related slot IDs based on the players
    // This is a simplified approach - in a real implementation, you might want to pass slot IDs
    const relatedSlotIds: string[] = []; // TODO: Implement slot ID finding logic

    // Mark settlement as complete
    const result = await markSettlementComplete({ 
      fromPlayer, 
      toPlayer, 
      relatedSlotIds 
    });

    return NextResponse.json({
      success: true,
      message: `Marked settlement from ${fromPlayer} to ${toPlayer} as complete`,
      amount: amount,
      updatedSlots: result.updatedSlots
    });
  } catch (error) {
    console.error('Error marking settlement complete:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to mark settlement as complete' },
      { status: 500 }
    );
  }
}
