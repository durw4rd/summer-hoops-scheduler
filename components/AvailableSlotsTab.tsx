import { Button } from "@/components/ui/button";
import SlotCard from "@/components/SlotCard";
import React, { useState } from "react";
import { Switch } from "@/components/ui/switch";

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
  const [showAllActive, setShowAllActive] = useState(false);
  const [showMine, setShowMine] = useState(false); // default to false
  const [showInactive, setShowInactive] = useState(false);

  // Filtering logic
  let baseSlots = showInactive ? allSlots : allSlots.filter((slot: any) => slot.Status === 'offered');
  if (!showMine) {
    baseSlots = baseSlots.filter((slot: any) => slot.Player !== playerName);
  }
  const filteredSlots = showAllActive
    ? baseSlots
    : baseSlots.filter((slot: any) => {
        if (!playerName) return false;
        // User's own offer (if showMine is true)
        if (showMine && slot.Player === playerName) return true;
        // Up for grabs: always show, even if user is already in session
        if (slot.Status === 'offered' && slot.SwapRequested !== 'yes') {
          return true;
        }
        // Swap offer: user is eligible to accept
        if (slot.SwapRequested === 'yes' && isEligibleForSwap(slot)) return true;
        return false;
      });

  // Filter description
  let filterDescription = '';
  if (showAllActive && showInactive && showMine) {
    filterDescription = 'Showing all offers, including inactive and your own.';
  } else if (showAllActive && showInactive) {
    filterDescription = 'Showing all offers, including inactive.';
  } else if (showAllActive && showMine) {
    filterDescription = 'Showing all active offers, including your own.';
  } else if (showAllActive) {
    filterDescription = 'Showing all active offers.';
  } else if (showInactive && showMine) {
    filterDescription = 'Showing eligible and your own offers, including inactive.';
  } else if (showInactive) {
    filterDescription = 'Showing eligible offers, including inactive.';
  } else if (showMine) {
    filterDescription = 'Showing eligible and your own active offers.';
  } else {
    filterDescription = 'Showing eligible active offers.';
  }

  return (
    <>
      {loggedInUser ? (
        <>
          <div className="mb-2 text-sm text-gray-700 text-center font-medium">
            {filterDescription}
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 gap-2">
            <Button
              size="sm"
              variant={showAllActive ? "default" : "outline"}
              onClick={() => setShowAllActive((v) => !v)}
              className={showAllActive ? 'bg-gray-200 border-gray-400' : ''}
            >
              {showAllActive ? "Show Only Eligible" : "Show All Active Offers"}
            </Button>
            <div className="flex items-center gap-4 mt-2 sm:mt-0">
              <div className="flex items-center gap-2">
                <Switch id="show-mine" checked={showMine} onCheckedChange={setShowMine} />
                <label htmlFor="show-mine" className="text-xs text-gray-700 select-none">Show My Offers</label>
              </div>
              <div className="flex items-center gap-2">
                <Switch id="show-inactive" checked={showInactive} onCheckedChange={setShowInactive} />
                <label htmlFor="show-inactive" className="text-xs text-gray-700 select-none">Show Inactive</label>
              </div>
            </div>
          </div>
          {slotsLoading ? (
            <div className="text-center text-gray-500 py-10">Loading available slots...</div>
          ) : (
            (() => {
              const slotsArr = filteredSlots;
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