import { Button } from "@/components/ui/button";
import SlotCard from "@/components/SlotCard";
import React from "react";

interface AvailableSlotsTabProps {
  allSlots: any[];
  availableSlots: any[];
  playerName?: string;
  schedule: any[];
  userMapping: Record<string, { email: string; color?: string }>;
  slotActionLoading: string | null;
  acceptSwapLoading: string | null;
  handleRecallSlot: (date: string, time: string, player: string, actionId: string) => void;
  handleAcceptSwap: (slot: any) => void;
  handleOfferSlot: (date: string, time: string, player: string, sessionId: string) => void;
  handleRequestSwap: (slot: any) => void;
  showInactiveSlots: boolean;
  setShowInactiveSlots: (v: (prev: boolean) => boolean) => void;
  showOnlyMine: boolean;
  setShowOnlyMine: (v: (prev: boolean) => boolean) => void;
  slotsLoading: boolean;
  getPlayerColor: (name: string) => string;
  isEligibleForSwap: (slot: any) => boolean;
  onClaimClick: (slot: any, claimSessionId: string) => void;
  loggedInUser: any;
}

const AvailableSlotsTab: React.FC<AvailableSlotsTabProps> = ({
  allSlots,
  availableSlots,
  playerName,
  schedule,
  userMapping,
  slotActionLoading,
  acceptSwapLoading,
  handleRecallSlot,
  handleAcceptSwap,
  handleOfferSlot,
  handleRequestSwap,
  showInactiveSlots,
  setShowInactiveSlots,
  showOnlyMine,
  setShowOnlyMine,
  slotsLoading,
  getPlayerColor,
  isEligibleForSwap,
  onClaimClick,
  loggedInUser,
}) => {
  return (
    <>
      {loggedInUser ? (
        <>
          <div className="flex justify-end mb-4 gap-2">
            <Button
              size="sm"
              variant={showInactiveSlots ? "default" : "outline"}
              onClick={() => setShowInactiveSlots((v) => !v)}
            >
              {showInactiveSlots ? "Hide Inactive Offers" : "Show Inactive Offers"}
            </Button>
            <Button
              size="sm"
              variant={showOnlyMine ? "default" : "outline"}
              onClick={() => setShowOnlyMine((v) => !v)}
            >
              {showOnlyMine ? "Show All Offers" : "Show Only Mine"}
            </Button>
          </div>
          {slotsLoading ? (
            <div className="text-center text-gray-500 py-10">Loading available slots...</div>
          ) : (
            (() => {
              const filteredSlots = showInactiveSlots ? allSlots : availableSlots;
              const mineFilteredSlots = showOnlyMine && playerName
                ? filteredSlots.filter((slot: any) => slot.Player === playerName)
                : filteredSlots;
              // Remove duplicate offers for the same session from the same user (keep most recent by Timestamp if available)
              const seen = new Map();
              mineFilteredSlots.forEach((slot: any) => {
                const key = `${slot.Date}__${slot.Time}__${slot.Player}`;
                if (!seen.has(key) || (slot.Timestamp && seen.get(key).Timestamp < slot.Timestamp)) {
                  seen.set(key, slot);
                }
              });
              // Sort by date and time
              const slotsArr = Array.from(seen.values());
              slotsArr.sort((a, b) => {
                const [dayA, monthA] = a.Date.split('.').map(Number);
                const [dayB, monthB] = b.Date.split('.').map(Number);
                const dateA = new Date(new Date().getFullYear(), monthA - 1, dayA);
                const dateB = new Date(new Date().getFullYear(), monthB - 1, dayB);
                if (dateA.getTime() !== dateB.getTime()) return dateA.getTime() - dateB.getTime();
                const timeA = a.Time.split(':').map(Number);
                const timeB = b.Time.split(':').map(Number);
                return timeA[0] - timeB[0] || timeA[1] - timeB[1];
              });
              return (
                <div className="space-y-3">
                  {slotsArr.length === 0 ? (
                    <div className="text-center text-gray-500">No available slots.</div>
                  ) : (
                    slotsArr.map((slot: any, idx: number) => {
                      let isUserInSession = false;
                      if (playerName) {
                        for (const game of schedule) {
                          if (game.date === slot.Date) {
                            for (const session of game.sessions) {
                              if (session.time.trim() === slot.Time.trim()) {
                                if (session.players.some((p: string) => p.toLowerCase() === playerName.toLowerCase())) {
                                  isUserInSession = true;
                                }
                              }
                            }
                          }
                        }
                      }
                      const isOwner = !!(playerName && slot.Player === playerName);
                      const isInactive = slot.Status !== 'offered';
                      const acceptSwapEligible = slot.SwapRequested === 'yes' && slot.Status === 'offered' && isEligibleForSwap(slot);
                      return (
                        <SlotCard
                          key={idx}
                          slot={slot}
                          idx={idx}
                          userMapping={userMapping}
                          slotActionLoading={slotActionLoading}
                          acceptSwapLoading={acceptSwapLoading}
                          handleRecallSlot={handleRecallSlot}
                          handleAcceptSwap={handleAcceptSwap}
                          handleOfferSlot={handleOfferSlot}
                          handleRequestSwap={handleRequestSwap}
                          isOwner={isOwner}
                          isInactive={isInactive}
                          isUserInSession={isUserInSession}
                          getPlayerColor={getPlayerColor}
                          acceptSwapEligible={acceptSwapEligible}
                          onClaimClick={onClaimClick}
                        />
                      );
                    })
                  )}
                </div>
              );
            })()
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

export default AvailableSlotsTab; 