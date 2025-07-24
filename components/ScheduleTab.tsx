import { Button } from "@/components/ui/button";
import ScheduleCard from "@/components/ScheduleCard";
import React, { useState, useEffect } from "react";
import ReassignSlotModal from "@/components/ReassignSlotModal";
import FilterBar, { FilterItem } from "@/components/ui/filter-bar";
import { getStorageKey, saveToStorage, loadFromStorage } from "@/lib/persistence";

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
  scheduleTabLoading?: boolean;
  showAll: boolean;
  showPast: boolean;
  setShowAll: (v: (prev: boolean) => boolean) => void;
  setShowPast: (v: (prev: boolean) => boolean) => void;
  loggedInUser: any;
  onClaimAvailableSlot?: (info: { date: string; time: string }) => void;
  onScheduleRefresh?: () => Promise<void>;
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
  scheduleTabLoading = false,
  showAll,
  showPast,
  setShowAll,
  setShowPast,
  loggedInUser,
  onClaimAvailableSlot,
  onScheduleRefresh,
}) => {
  const [reassignModalOpen, setReassignModalOpen] = useState(false);
  const [reassignSession, setReassignSession] = useState<{ date: string; time: string; currentPlayer: string } | null>(null);
  const [reassignLoading, setReassignLoading] = useState(false);
  const [reassignError, setReassignError] = useState<string | null>(null);
  const [reassignSelectedPlayer, setReassignSelectedPlayer] = useState<string>("");
  const [reassignConfirm, setReassignConfirm] = useState(false);
  const [reassignWarn, setReassignWarn] = useState(false);

  // Track if component has mounted to prevent hydration mismatches
  const [hasMounted, setHasMounted] = useState(false);

  // Set mounted state after hydration
  useEffect(() => {
    setHasMounted(true);
  }, []);

  // Load saved filter states on component mount (client-side only)
  useEffect(() => {
    if (hasMounted && loggedInUser?.user?.email) {
      const userId = loggedInUser.user.email;
      
      // Load showAll filter
      const showAllKey = getStorageKey(userId, 'schedule', 'showAll');
      const savedShowAll = loadFromStorage(showAllKey, false);
      setShowAll(() => savedShowAll);
      
      // Load showPast filter
      const showPastKey = getStorageKey(userId, 'schedule', 'showPast');
      const savedShowPast = loadFromStorage(showPastKey, false);
      setShowPast(() => savedShowPast);
      
      // Load condensedMode filter
      const condensedModeKey = getStorageKey(userId, 'schedule', 'condensedMode');
      const savedCondensedMode = loadFromStorage(condensedModeKey, false);
      setCondensedMode(savedCondensedMode);
    }
  }, [hasMounted, loggedInUser?.user?.email, setShowAll, setShowPast, setCondensedMode]);

  // Save filter states when they change (client-side only)
  useEffect(() => {
    if (hasMounted && loggedInUser?.user?.email) {
      const userId = loggedInUser.user.email;
      
      const showAllKey = getStorageKey(userId, 'schedule', 'showAll');
      saveToStorage(showAllKey, showAll);
      
      const showPastKey = getStorageKey(userId, 'schedule', 'showPast');
      saveToStorage(showPastKey, showPast);
      
      const condensedModeKey = getStorageKey(userId, 'schedule', 'condensedMode');
      saveToStorage(condensedModeKey, condensedMode);
    }
  }, [hasMounted, showAll, showPast, condensedMode, loggedInUser?.user?.email]);

  function handleReassignClick(sessionInfo: { date: string; time: string; currentPlayer: string }) {
    setReassignSession(sessionInfo);
    setReassignModalOpen(true);
    setReassignSelectedPlayer("");
    setReassignConfirm(false);
    setReassignWarn(false);
    setReassignError(null);
  }

  // Helper to check if a player is already in the session
  function isPlayerInSession(date: string, time: string, player: string) {
    for (const game of scheduleToDisplay) {
      if (game.date === date) {
        for (const session of game.sessions) {
          if (session.time === time) {
            return session.players.some((p: string) => p.toLowerCase() === player.toLowerCase());
          }
        }
      }
    }
    return false;
  }

  async function handleReassign(newPlayer: string) {
    if (!reassignSession) return;
    setReassignError(null);
    setReassignSelectedPlayer(newPlayer);
    // Check if player is already in session
    const alreadyInSession = isPlayerInSession(reassignSession.date, reassignSession.time, newPlayer);
    if (alreadyInSession && !reassignConfirm) {
      setReassignWarn(true);
      setReassignConfirm(true);
      return;
    }
    setReassignLoading(true);
    try {
      const res = await fetch("/api/schedule/reassign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date: reassignSession.date,
          time: reassignSession.time,
          fromPlayer: reassignSession.currentPlayer,
          toPlayer: newPlayer,
        }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error || "Reassignment failed");
      setReassignModalOpen(false);
      setReassignSession(null);
      setReassignSelectedPlayer("");
      setReassignConfirm(false);
      setReassignWarn(false);
      await new Promise(r => setTimeout(r, 300)); // UX: allow modal to close
      // Refresh schedule data after successful reassignment
      if (onScheduleRefresh) {
        await onScheduleRefresh();
      }
    } catch (err: any) {
      setReassignError(err.message || "Reassignment failed");
    } finally {
      setReassignLoading(false);
    }
  }

  // Create filter items for the FilterBar
  const filterItems: FilterItem[] = [
    {
      id: 'showAll',
      type: 'toggle',
      label: 'Show All Sessions',
      value: showAll,
    },
    {
      id: 'showPast',
      type: 'toggle',
      label: 'Show Past Sessions',
      value: showPast,
    },
    {
      id: 'condensedMode',
      type: 'toggle',
      label: 'Condensed View',
      value: condensedMode,
    },
  ];

  const handleFilterChange = (filterId: string, value: any) => {
    switch (filterId) {
      case 'showAll':
        setShowAll(() => value);
        break;
      case 'showPast':
        setShowPast(() => value);
        break;
      case 'condensedMode':
        setCondensedMode(value);
        break;
    }
  };

  return (
    <>
      {loggedInUser ? (
        <>
          {/* <div className="mb-2"> */}
            <FilterBar
              title="Schedule Filters"
              filters={filterItems}
              onFilterChange={handleFilterChange}
              isExpanded={false}
            />
          {/* </div> */}
          {(scheduleLoading || scheduleTabLoading) ? (
            <div className="text-center text-gray-500 py-10">
              {scheduleTabLoading ? "Refreshing schedule..." : "Loading schedule..."}
            </div>
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
                    onReassignClick={handleReassignClick}
                    onClaimAvailableSlot={onClaimAvailableSlot}
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
      {reassignSession && (
        <ReassignSlotModal
          open={reassignModalOpen}
          onOpenChange={setReassignModalOpen}
          sessionInfo={reassignSession}
          userMapping={userMapping}
          onReassign={handleReassign}
          loading={reassignLoading}
          error={reassignError}
          selectedPlayer={reassignSelectedPlayer}
          warn={reassignWarn}
          onConfirm={() => handleReassign(reassignSelectedPlayer)}
        />
      )}
    </>
  );
};

export default ScheduleTab; 