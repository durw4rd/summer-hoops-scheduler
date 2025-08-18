'use client';

import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import SettlementCard from './SettlementCard';
import SettlementOverview from './SettlementOverview';

interface SettlementTabProps {
  currentPlayer?: string;
}

export default function SettlementTab({ currentPlayer }: SettlementTabProps) {
  const [activeTab, setActiveTab] = useState('overview');

  const handleSmartSettleToggle = (enabled: boolean) => {
    // Refresh the overview when a player toggles their preference
    if (activeTab === 'overview') {
      // The SettlementOverview component will handle its own refresh
      // This is just for potential future enhancements
    }
  };

  return (
    <div className="w-full">
      {/* Global Disclaimer */}
      <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
        <div className="flex items-start gap-2">
          <div className="text-blue-600 mt-0.5">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
          </div>
                      <div className="text-sm text-blue-800">
              <p className="font-medium mb-1">The Bank - Settlement System</p>
              <p className="text-xs">Calculates settlements from marketplace slot transfers. Settled slots are excluded. 1h = €3.80, 2h = €7.60.</p>
            </div>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="personal">My Settlement</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview" className="mt-6">
          <SettlementOverview currentPlayer={currentPlayer} />
        </TabsContent>
        
        <TabsContent value="personal" className="mt-6">
          {currentPlayer ? (
            <SettlementCard 
              playerName={currentPlayer} 
              onToggleSmartSettle={handleSmartSettleToggle}
            />
          ) : (
            <div className="text-center text-gray-500 p-8">
              Please log in to view your personal settlement information.
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
