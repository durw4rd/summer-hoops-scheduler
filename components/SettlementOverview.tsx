'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AlertCircle, TrendingUp, TrendingDown, DollarSign, RefreshCw } from 'lucide-react';

interface PlayerCredit {
  playerName: string;
  credits: number;
  slotsGivenAway: number;
  slotsClaimed: number;
  slotsSettled: number;
}

interface SettlementOverviewProps {
  currentPlayer?: string;
}

export default function SettlementOverview({ currentPlayer }: SettlementOverviewProps) {
  const [playerCredits, setPlayerCredits] = useState<PlayerCredit[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchSettlementOverview();
  }, []);

  const fetchSettlementOverview = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch('/api/settlement/debug');
      if (!response.ok) {
        throw new Error('Failed to fetch settlement overview');
      }
      
      const data = await response.json();
      setPlayerCredits(data.data.playerCredits || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchSettlementOverview();
    setRefreshing(false);
  };

  if (loading) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Settlement Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex justify-between items-center">
                <div className="h-4 bg-gray-200 rounded w-1/3"></div>
                <div className="h-4 bg-gray-200 rounded w-1/4"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="w-full border-red-200">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            Settlement Overview
            <Button variant="outline" size="sm" onClick={handleRefresh} disabled={refreshing}>
              <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2 text-red-600">
            <AlertCircle className="h-4 w-4" />
            <span>Error loading settlement data: {error}</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  const creditors = playerCredits.filter(p => p.credits > 0).sort((a, b) => b.credits - a.credits);
  const debtors = playerCredits.filter(p => p.credits < 0).sort((a, b) => a.credits - b.credits);
  const neutral = playerCredits.filter(p => p.credits === 0);

  const totalCredits = creditors.reduce((sum, p) => sum + p.credits, 0);
  const totalDebits = Math.abs(debtors.reduce((sum, p) => sum + p.credits, 0));

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Settlement Overview</span>
          <Button variant="outline" size="sm" onClick={handleRefresh} disabled={refreshing}>
            <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">


        {/* Summary Stats */}
        <div className="grid grid-cols-3 gap-4 text-center">
          <div className="p-3 bg-green-50 rounded-lg">
            <div className="text-lg font-bold text-green-600">€{totalCredits.toFixed(2)}</div>
            <div className="text-xs text-green-600">Total Owed</div>
          </div>
          <div className="p-3 bg-red-50 rounded-lg">
            <div className="text-lg font-bold text-red-600">€{totalDebits.toFixed(2)}</div>
            <div className="text-xs text-red-600">Total Debt</div>
          </div>
          <div className="p-3 bg-gray-50 rounded-lg">
            <div className="text-lg font-bold text-gray-600">{playerCredits.length}</div>
            <div className="text-xs text-gray-600">Players</div>
          </div>
        </div>

        {/* Creditors */}
        {creditors.length > 0 && (
          <div>
            <h3 className="font-medium text-sm mb-3 flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-green-600" />
              Players Owed Money ({creditors.length})
            </h3>
            <div className="space-y-2">
              {creditors.map((player) => (
                <div 
                  key={player.playerName}
                  className={`flex justify-between items-center p-3 rounded-lg border ${
                    currentPlayer === player.playerName 
                      ? 'border-blue-300 bg-blue-50' 
                      : 'border-gray-200 bg-gray-50'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{player.playerName}</span>
                    {currentPlayer === player.playerName && (
                      <Badge variant="outline" className="text-xs">You</Badge>
                    )}
                  </div>
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2">
                      <span className="text-green-600 font-bold">+€{player.credits.toFixed(2)}</span>
                      <Badge variant="secondary" className="text-xs">
                        {player.slotsGivenAway} given, {player.slotsClaimed} claimed
                      </Badge>
                    </div>
                    {player.slotsSettled > 0 && (
                      <div className="flex justify-end">
                        <Badge variant="outline" className="text-xs text-blue-600 border-blue-300 bg-blue-50">
                          {player.slotsSettled} settled
                        </Badge>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Debtors */}
        {debtors.length > 0 && (
          <div>
            <h3 className="font-medium text-sm mb-3 flex items-center gap-2">
              <TrendingDown className="h-4 w-4 text-red-600" />
              Players Who Owe Money ({debtors.length})
            </h3>
            <div className="space-y-2">
              {debtors.map((player) => (
                <div 
                  key={player.playerName}
                  className={`flex justify-between items-center p-3 rounded-lg border ${
                    currentPlayer === player.playerName 
                      ? 'border-blue-300 bg-blue-50' 
                      : 'border-gray-200 bg-gray-50'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{player.playerName}</span>
                    {currentPlayer === player.playerName && (
                      <Badge variant="outline" className="text-xs">You</Badge>
                    )}
                  </div>
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2">
                      <span className="text-red-600 font-bold">-€{Math.abs(player.credits).toFixed(2)}</span>
                      <Badge variant="secondary" className="text-xs">
                        {player.slotsGivenAway} given, {player.slotsClaimed} claimed
                      </Badge>
                    </div>
                    {player.slotsSettled > 0 && (
                      <div className="flex justify-end">
                        <Badge variant="outline" className="text-xs text-blue-600 border-blue-300 bg-blue-50">
                          {player.slotsSettled} settled
                        </Badge>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Neutral Players */}
        {neutral.length > 0 && (
          <div>
            <h3 className="font-medium text-sm mb-3 flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-gray-600" />
              All Settled Up ({neutral.length})
            </h3>
            <div className="space-y-2">
              {neutral.map((player) => (
                <div 
                  key={player.playerName}
                  className={`flex justify-between items-center p-3 rounded-lg border ${
                    currentPlayer === player.playerName 
                      ? 'border-blue-300 bg-blue-50' 
                      : 'border-gray-200 bg-gray-50'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{player.playerName}</span>
                    {currentPlayer === player.playerName && (
                      <Badge variant="outline" className="text-xs">You</Badge>
                    )}
                  </div>
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2">
                      <span className="text-gray-600 font-bold">€0.00</span>
                      <Badge variant="secondary" className="text-xs">
                        {player.slotsGivenAway} given, {player.slotsClaimed} claimed
                      </Badge>
                    </div>
                    {player.slotsSettled > 0 && (
                      <div className="flex justify-end">
                        <Badge variant="outline" className="text-xs text-blue-600 border-blue-300 bg-blue-50">
                          {player.slotsSettled} settled
                        </Badge>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-2 pt-4 border-t">
          <Button 
            variant="outline" 
            size="sm" 
            className="flex-1"
            onClick={() => window.open('/api/settlement/debug', '_blank')}
          >
            View Full Details
          </Button>
          <Button 
            size="sm" 
            className="flex-1"
            onClick={() => window.open('/api/settlement/calculate', '_blank')}
          >
            View Transactions
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
