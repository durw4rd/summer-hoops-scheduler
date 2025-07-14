import { Button } from "@/components/ui/button";
import ScheduleCard from "@/components/ScheduleCard";
import { Switch } from "@/components/ui/switch";
import React from "react";

interface ScheduleTabProps {
  scheduleToDisplay: any[];
  userMapping: Record<string, { email: string; color?: string }>;
  playerName?: string;
  allSlots: any[];
  condensedMode: boolean;
  setCondensedMode: (v: boolean) => void;
  slotActionLoading: string | null;
  handleOfferSlot: (date: string, time: string, player: string, sessionId: string) => void;
  handleRequestSwap: (slot: any) => void;
  scheduleLoading: boolean;
  showAll: boolean;
  showPast: boolean;
  setShowAll: (v: (prev: boolean) => boolean) => void;
  setShowPast: (v: (prev: boolean) => boolean) => void;
  loggedInUser: any;
}

const ScheduleTab: React.FC<ScheduleTabProps> = ({
  scheduleToDisplay,
  userMapping,
  playerName,
  allSlots,
  condensedMode,
  setCondensedMode,
  slotActionLoading,
  handleOfferSlot,
  handleRequestSwap,
  scheduleLoading,
  showAll,
  showPast,
  setShowAll,
  setShowPast,
  loggedInUser,
}) => {
  return (
    <>
      {loggedInUser ? (
        <>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900">{showAll ? "All Games" : "Your Games"}</h2>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">Condensed</span>
              <Switch checked={condensedMode} onCheckedChange={setCondensedMode} />
            </div>
          </div>
          <div className="flex flex-col sm:flex-row justify-end gap-2 mb-4">
            <Button
              size="sm"
              variant={showAll ? "default" : "outline"}
              onClick={() => setShowAll((v) => !v)}
            >
              {showAll ? "Show Only My Sessions" : "Show All Sessions"}
            </Button>
            <Button
              size="sm"
              variant={showPast ? "default" : "outline"}
              onClick={() => setShowPast((v) => !v)}
            >
              {showPast ? "Hide Past Sessions" : "Show Past Sessions"}
            </Button>
          </div>
          {scheduleLoading ? (
            <div className="text-center text-gray-500 py-10">Loading schedule...</div>
          ) : (
            <>
              {scheduleToDisplay.length === 0 ? (
                <div className="text-center text-gray-500">No games scheduled{showAll ? "." : " for you."}</div>
              ) : (
                scheduleToDisplay.map((game: any) => (
                  <ScheduleCard
                    key={game.id}
                    game={game}
                    userMapping={userMapping}
                    playerName={playerName}
                    allSlots={allSlots}
                    condensedMode={condensedMode}
                    slotActionLoading={slotActionLoading}
                    handleOfferSlot={handleOfferSlot}
                    handleRequestSwap={handleRequestSwap}
                  />
                ))
              )}
            </>
          )}
        </>
      ) : (
        <div className="text-center text-gray-500 py-10">
          You need to log in to use the app.
        </div>
      )}
    </>
  );
};

export default ScheduleTab; 