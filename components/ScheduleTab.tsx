import { Button } from "@/components/ui/button";
import ScheduleCard from "@/components/ScheduleCard";
import { Switch } from "@/components/ui/switch";
import React, { useState } from "react";
import ReassignSlotModal from "@/components/ReassignSlotModal";

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
  onClaimAvailableSlot?: (info: { date: string; time: string }) => void;
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
  onClaimAvailableSlot,
}) => {
  const [reassignModalOpen, setReassignModalOpen] = useState(false);
  const [reassignSession, setReassignSession] = useState<{ date: string; time: string; currentPlayer: string } | null>(null);
  const [reassignLoading, setReassignLoading] = useState(false);
  const [reassignError, setReassignError] = useState<string | null>(null);
  const [reassignSelectedPlayer, setReassignSelectedPlayer] = useState<string>("");
  const [reassignConfirm, setReassignConfirm] = useState(false);
  const [reassignWarn, setReassignWarn] = useState(false);

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
      window.location.reload(); // or call fetchSchedule() if available
    } catch (err: any) {
      setReassignError(err.message || "Reassignment failed");
    } finally {
      setReassignLoading(false);
    }
  }

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