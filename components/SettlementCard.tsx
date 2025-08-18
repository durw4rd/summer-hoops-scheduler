'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { AlertCircle, TrendingUp, TrendingDown, DollarSign } from 'lucide-react';

interface SettlementData {
  playerName: string;
  settlements: Array<{
    fromPlayer: string;
    toPlayer: string;
    amount: number;
    description: string;
  }>;
  summary: {
    owes: number;
    owed: number;
    netAmount: number;
  };
  playerCredit: {
    playerName: string;
    credits: number;
    slotsGivenAway: number;
    slotsClaimed: number;
    slotsSettled: number;
  };
  userPreference: {
    smartSettle: boolean;
    email: string;
    color?: string;
    role?: string;
  };
}

interface SettlementCardProps {
  playerName: string;
  onToggleSmartSettle?: (enabled: boolean) => void;
}

export default function SettlementCard({ playerName, onToggleSmartSettle }: SettlementCardProps) {
  const [settlementData, setSettlementData] = useState<SettlementData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updatingPreference, setUpdatingPreference] = useState(false);

  useEffect(() => {
    fetchSettlementData();
  }, [playerName]);

  const fetchSettlementData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(`/api/settlement/user/${encodeURIComponent(playerName)}`);
      if (!response.ok) {
        throw new Error('Failed to fetch settlement data');
      }
      
      const data = await response.json();
      setSettlementData(data.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleSmartSettleToggle = async (enabled: boolean) => {
    if (!settlementData) return;
    
    try {
      setUpdatingPreference(true);
      
      const response = await fetch('/api/settlement/preferences', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          playerName: playerName,
          smartSettle: enabled,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update preference');
      }

      // Update local state
      setSettlementData(prev => prev ? { 
        ...prev, 
        userPreference: { ...prev.userPreference, smartSettle: enabled }
      } : null);
      
      // Call parent callback if provided
      onToggleSmartSettle?.(enabled);
      
      // Refresh data to get updated calculations
      await fetchSettlementData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update preference');
    } finally {
      setUpdatingPreference(false);
    }
  };



  if (loading) {
    return (
      <Card className="w-full">
        <CardContent className="p-6">
          <div className="animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-1/3 mb-4"></div>
            <div className="h-6 bg-gray-200 rounded w-1/2 mb-2"></div>
            <div className="h-4 bg-gray-200 rounded w-1/4"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="w-full border-red-200">
        <CardContent className="p-6">
          <div className="flex items-center gap-2 text-red-600">
            <AlertCircle className="h-4 w-4" />
            <span>Error loading settlement data: {error}</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!settlementData) {
    return (
      <Card className="w-full">
        <CardContent className="p-6">
          <div className="text-center text-gray-500">
            No settlement data available
          </div>
        </CardContent>
      </Card>
    );
  }

  const { playerCredit, userPreference, settlements } = settlementData;
  const { credits, slotsGivenAway, slotsClaimed } = playerCredit;
  const { smartSettle } = userPreference;
  const isCreditor = credits > 0;
  const isDebtor = credits < 0;
  const isNeutral = credits === 0;

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>The Bank</span>
          <Badge variant={isCreditor ? "default" : isDebtor ? "destructive" : "secondary"}>
            {isCreditor ? "Creditor" : isDebtor ? "Debtor" : "Settled"}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Balance Display */}
        <div className="text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <DollarSign className="h-5 w-5" />
            <span className="text-2xl font-bold">
              {isCreditor ? `+€${credits.toFixed(2)}` : `-€${Math.abs(credits).toFixed(2)}`}
            </span>
          </div>
          <p className="text-sm text-gray-600">
            {isCreditor 
              ? "You are owed this amount" 
              : isDebtor 
                ? "You owe this amount" 
                : "All settled up!"
            }
          </p>
        </div>

        {/* Slot Summary */}
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-green-600" />
              <span>{slotsGivenAway} slots given away</span>
            </div>
            <div className="flex items-center gap-2">
              <TrendingDown className="h-4 w-4 text-red-600" />
              <span>{slotsClaimed} slots claimed</span>
            </div>
          </div>
          {playerCredit.slotsSettled > 0 && (
            <div className="flex items-center justify-center gap-2">
              <Badge variant="outline" className="text-sm text-blue-600 border-blue-300 bg-blue-50">
                <DollarSign className="h-3 w-3 mr-1" />
                {playerCredit.slotsSettled} slots already settled
              </Badge>
            </div>
          )}
        </div>

        {/* Smart Settlement Toggle */}
        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
          <div>
            <p className="font-medium text-sm">Smart Settlement</p>
            <p className="text-xs text-gray-600">
              {smartSettle 
                ? "Participating in calculations & simplification" 
                : "Excluded from calculations & simplification"
              }
            </p>
          </div>
          <Switch
            checked={smartSettle}
            onCheckedChange={handleSmartSettleToggle}
            disabled={updatingPreference}
          />
        </div>



        {/* Settlements List */}
        {settlements.length > 0 && (
          <div>
            <h4 className="font-medium text-sm mb-2">Your Transactions</h4>
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {settlements.map((settlement, index) => (
                <div key={index} className="flex justify-between items-center p-2 bg-gray-50 rounded text-sm">
                  <span>
                    {settlement.fromPlayer === playerName 
                      ? `You owe ${settlement.toPlayer}`
                      : `${settlement.fromPlayer} owes you`
                    }
                  </span>
                  <span className="font-medium">€{settlement.amount.toFixed(2)}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        {!isNeutral && (
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              className="flex-1"
              onClick={() => window.open('/api/settlement/debug', '_blank')}
            >
              View Details
            </Button>
            {isDebtor && (
              <Button 
                size="sm" 
                className="flex-1"
                onClick={() => {
                  // TODO: Implement mark as settled functionality
                  console.log('Mark as settled clicked');
                }}
              >
                Mark as Settled
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
