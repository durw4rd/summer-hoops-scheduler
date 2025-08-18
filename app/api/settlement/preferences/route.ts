import { NextRequest, NextResponse } from 'next/server';
import { updateUserSettlementPreference } from '@/lib/googleSheets';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { playerName, smartSettle } = body;

    // Validate input
    if (!playerName || typeof smartSettle !== 'boolean') {
      return NextResponse.json(
        { success: false, error: 'Invalid input. playerName and smartSettle (boolean) are required.' },
        { status: 400 }
      );
    }

    // Update user preference
    await updateUserSettlementPreference({ playerName, smartSettle });

    return NextResponse.json({
      success: true,
      message: `Updated smartSettle preference for ${playerName} to ${smartSettle}`
    });
  } catch (error) {
    console.error('Error updating settlement preference:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update settlement preference' },
      { status: 500 }
    );
  }
}
