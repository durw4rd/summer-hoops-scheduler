import { Button } from "@/components/ui/button";
import SlotCard from "@/components/SlotCard";
import React, { useState, useMemo, useEffect, useRef } from "react";
import FilterBar, { FilterItem } from "@/components/ui/filter-bar";
import { compareSlotsByDateTime, getDayOfWeek, normalizeDate, isSessionInPast, shouldSlotBeExpired } from "@/lib/utils";
import { getStorageKey, saveToStorage, loadFromStorage } from "@/lib/persistence";

interface MarketplaceTabProps {
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

const MarketplaceTab: React.FC<MarketplaceTabProps> = ({
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
  const [showAllActive, setShowAllActive] = useState(true); // default to true - show all active offers
  const [showMine, setShowMine] = useState(false); // default to false - don't show mine
  const [showInactive, setShowInactive] = useState(true); // default to true - show all slots including inactive ones
  const [selectedEvents, setSelectedEvents] = useState<Set<string>>(new Set(['all']));

  const [hasMounted, setHasMounted] = useState(false);

  // Set mounted state after hydration
  useEffect(() => {
    setHasMounted(true);
  }, []);



  // Load saved filter states on component mount (client-side only)
  useEffect(() => {
    if (hasMounted && loggedInUser?.user?.email) {
      const userId = loggedInUser.user.email;
      
      // Load showAllActive filter
      const showAllActiveKey = getStorageKey(userId, 'available', 'showAllActive');
      const savedShowAllActive = loadFromStorage(showAllActiveKey, true);
      setShowAllActive(savedShowAllActive);
      
      // Load showMine filter
      const showMineKey = getStorageKey(userId, 'available', 'showMine');
      const savedShowMine = loadFromStorage(showMineKey, false);
      setShowMine(savedShowMine);
      
      // Load showInactive filter
      const showInactiveKey = getStorageKey(userId, 'available', 'showInactive');
      const savedShowInactive = loadFromStorage(showInactiveKey, true);
      setShowInactive(savedShowInactive);
      
      // Load selectedEvents filter
      const selectedEventsKey = getStorageKey(userId, 'available', 'selectedEvents');
      const savedSelectedEvents = loadFromStorage(selectedEventsKey, ['all']);
      if (savedSelectedEvents && Array.isArray(savedSelectedEvents)) {
        setSelectedEvents(new Set(savedSelectedEvents));
      }
    }
  }, [hasMounted, loggedInUser?.user?.email]);

  // Save filter states when they change (client-side only)
  useEffect(() => {
    if (hasMounted && loggedInUser?.user?.email) {
      const userId = loggedInUser.user.email;
      
      const showAllActiveKey = getStorageKey(userId, 'available', 'showAllActive');
      saveToStorage(showAllActiveKey, showAllActive);
      
      const showMineKey = getStorageKey(userId, 'available', 'showMine');
      saveToStorage(showMineKey, showMine);
      
      const showInactiveKey = getStorageKey(userId, 'available', 'showInactive');
      saveToStorage(showInactiveKey, showInactive);
      
      const selectedEventsKey = getStorageKey(userId, 'available', 'selectedEvents');
      saveToStorage(selectedEventsKey, Array.from(selectedEvents));
    }
  }, [hasMounted, showAllActive, showMine, showInactive, selectedEvents, loggedInUser?.user?.email]);

  // Extract unique events from slots for filtering
  const uniqueEvents = useMemo(() => {
    const events = [...new Set(allSlots.map(slot => slot.Date))];
    return events.sort((a, b) => {
      // Sort by date (assuming DD.MM format)
      const [dayA, monthA] = a.split('.').map(Number);
      const [dayB, monthB] = b.split('.').map(Number);
      const dateA = new Date(new Date().getFullYear(), monthA - 1, dayA);
      const dateB = new Date(new Date().getFullYear(), monthB - 1, dayB);
      return dateA.getTime() - dateB.getTime();
    });
  }, [allSlots]);

  // Helper function to check if a date is in the past
  const isDateInPast = (dateStr: string) => {
    const [day, month] = dateStr.split('.').map(Number);
    const eventDate = new Date(new Date().getFullYear(), month - 1, day);
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Reset time to start of day for comparison
    return eventDate < today;
  };



  // Enhanced filtering logic with multi-event filtering
  let baseSlots = showInactive ? allSlots : allSlots.filter((slot: any) => 
    slot.Status === 'offered' || 
    slot.Status === 'claimed' || 
    slot.Status === 'retracted' || 
    slot.Status === 'reassigned' || 
    slot.Status === 'admin-reassigned' ||
    slot.Status === 'expired'
  );

  // Client-side expiration check - mark slots as expired if they're more than 1 hour past their event time
  const expiredSlots: any[] = [];
  baseSlots = baseSlots.map((slot: any) => {
    if (slot.Status === 'offered' && shouldSlotBeExpired(slot.Date, slot.Time)) {
      expiredSlots.push(slot);
      return { ...slot, Status: 'expired' };
    }
    return slot;
  });

  // Update expired slots in the sheet if any were found
  useEffect(() => {
    if (expiredSlots.length > 0) {
      const updateExpiredSlots = async () => {
        try {
          const response = await fetch('/api/slots/update-expired', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ expiredSlots }),
          });
          
          const result = await response.json();
          if (result.success && result.updatedCount > 0) {
            console.log(`Updated ${result.updatedCount} slots to expired status`);
          }
        } catch (error) {
          console.error('Error updating expired slots:', error);
        }
      };
      
      updateExpiredSlots();
    }
  }, [expiredSlots.length]);
  
  // Event filtering - show slots for any selected event
  if (!selectedEvents.has('all')) {
    baseSlots = baseSlots.filter((slot: any) => selectedEvents.has(slot.Date));
  }
  
  // Ownership filtering
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

  // Create filter items for the FilterBar
  const filterItems: FilterItem[] = [
    {
      id: 'eventFilter',
      type: 'multi-select',
      label: 'Filter by Dates',
      value: selectedEvents,
      options: uniqueEvents.map(event => ({
        value: event,
        label: `${event} (${getDayOfWeek(event)})${isDateInPast(event) ? ' (past)' : ''}`
      })),
    },
    {
      id: 'showAllActive',
      type: 'toggle',
      label: 'Show Only Eligible Offers',
      value: !showAllActive,
    },
    {
      id: 'showMine',
      type: 'toggle',
      label: 'Show My Offers',
      value: showMine,
    },
    {
      id: 'showInactive',
      type: 'toggle',
      label: 'Show Inactive',
      value: showInactive,
    },
  ];

  const handleFilterChange = (filterId: string, value: any) => {
    switch (filterId) {
      case 'eventFilter':
        setSelectedEvents(value);
        break;
      case 'showAllActive':
        setShowAllActive(!value);
        break;
      case 'showMine':
        setShowMine(value);
        break;
      case 'showInactive':
        setShowInactive(value);
        break;
    }
  };

  return (
    <>
      {loggedInUser ? (
        <>
          <div className="mb-2">
            <FilterBar
              title="Marketplace Filters"
              filters={filterItems}
              onFilterChange={handleFilterChange}
              isExpanded={false}
            />
          </div>
          {slotsLoading ? (
            <div className="text-center text-gray-500 py-10">Loading marketplace...</div>
          ) : (
            (() => {
              const slotsArr = [...filteredSlots].sort(compareSlotsByDateTime);
              return (
                <div className="space-y-3">
                  {slotsArr.length === 0 ? (
                    <div className="text-center text-gray-500">
                      {!selectedEvents.has('all') 
                        ? `No slots available for the selected events.` 
                        : 'No slots available in the marketplace.'}
                    </div>
                  ) : (
                    slotsArr.map((slot: any, idx: number) => {
                      let isUserInSession = false;
                      if (playerName) {
                        for (const game of schedule) {
                          if (normalizeDate(game.date) === normalizeDate(slot.Date)) {
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

export default MarketplaceTab; 