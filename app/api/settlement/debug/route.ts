import { NextRequest, NextResponse } from 'next/server';
import { getAllSlots, getUserMapping } from '@/lib/googleSheets';
import { SettlementCalculator } from '@/lib/settlementCalculator';

export async function GET(request: NextRequest) {
  try {
    // Get all slots and user mapping
    const [slots, userMapping] = await Promise.all([
      getAllSlots(),
      getUserMapping()
    ]);

    // Convert user mapping to the expected format
    const userPreferences: { [playerName: string]: { smartSettle: boolean; email: string; color?: string; role?: string } } = {};
    for (const [playerName, userData] of Object.entries(userMapping)) {
      userPreferences[playerName] = {
        smartSettle: userData.smartSettle,
        email: userData.email,
        color: userData.color,
        role: userData.role
      };
    }

    // Get detailed credit breakdown
    const creditBreakdown = SettlementCalculator.getCreditBreakdown(slots, userPreferences);

    // Calculate settlements
    const settlements = SettlementCalculator.calculateSettlements(slots, userPreferences);

    // Get user preferences summary
    const userPreferencesSummary = Object.entries(userPreferences).map(([playerName, prefs]) => ({
      playerName,
      smartSettle: prefs.smartSettle,
      email: prefs.email,
      color: prefs.color,
      role: prefs.role
    }));

    return NextResponse.json({
      success: true,
      data: {
        // Raw data
        totalSlots: creditBreakdown.summary.totalSlots,
        eligibleSlots: creditBreakdown.summary.eligibleSlots,
        
        // Credit calculations
        playerCredits: creditBreakdown.playerCredits,
        creditSummary: creditBreakdown.summary,
        
        // Final settlements
        settlements,
        
        // User preferences
        userPreferences: userPreferencesSummary,
        
        // Summary statistics
        summary: {
          totalPlayerCredits: creditBreakdown.playerCredits.length,
          totalSettlements: settlements.length,
          totalDebtAmount: settlements.reduce((sum, debt) => sum + debt.amount, 0),
          calculatedAt: new Date().toISOString()
        }
      }
    });
  } catch (error) {
    console.error('Error getting settlement debug data:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to get settlement debug data',
        data: null
      }, 
      { status: 500 }
    );
  }
}
