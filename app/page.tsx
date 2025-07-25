"use client"

import { useState, useEffect, useCallback } from "react"
import { useSession, signIn, signOut } from "next-auth/react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Calendar, Store, Flag } from "lucide-react"
import Header from "@/components/Header";
import SwapModal from "@/components/SwapModal";
import ClaimConfirmationModal from "@/components/ClaimConfirmationModal";
import ScheduleTab from "@/components/ScheduleTab";
import MarketplaceTab from "@/components/MarketplaceTab";
import RegisterPrompt from "@/components/RegisterPrompt";
import LaunchDarklyDebug from "@/components/LaunchDarklyDebug";
import TournamentSplash from "@/components/TournamentSplash";
import { useLaunchDarkly } from "@/hooks/useLaunchDarkly";
import { getStorageKey, saveToStorage, loadFromStorage } from "@/lib/persistence";

// Types for better type safety
interface ScheduleData {
  id: string;
  date: string;
  day: string;
  sessions: SessionData[];
}

interface SessionData {
  id: string;
  time: string;
  hour: string;
  players: string[];
  maxPlayers: number;
}

interface UserMapping {
  [key: string]: { email: string; color?: string };
}

interface SlotData {
  Date: string;
  Time: string;
  Player?: string;
  Status?: string;
  [key: string]: string | undefined;
}

interface ConfirmationModalState {
  open: boolean;
  slot: SlotData | null;
  type: 'claim' | 'swap';
  alreadyInSession: boolean;
  claimSessionId?: string;
}

export default function SummerHoopsScheduler() {
  const { data: session, status } = useSession();
  const { getFlagValue } = useLaunchDarkly();
  const showFlagsTab = getFlagValue('showFlagsTab', false);
  
  // Consolidated state management
  const [schedule, setSchedule] = useState<ScheduleData[]>([]);
  const [userMapping, setUserMapping] = useState<UserMapping>({});
  const [availableSlots, setAvailableSlots] = useState<SlotData[]>([]);
  const [allSlots, setAllSlots] = useState<SlotData[]>([]);
  
  // UI state
  const [showAll, setShowAll] = useState(false);
  const [showPast, setShowPast] = useState(false);
  const [condensedMode, setCondensedMode] = useState(false);
  const [showOnlyMine, setShowOnlyMine] = useState(false);
  const [showInactiveSlots, setShowInactiveSlots] = useState(false);
  const [activeTab, setActiveTab] = useState<string>("schedule");
  
  // Loading states
  const [scheduleLoading, setScheduleLoading] = useState(true);
  const [scheduleTabLoading, setScheduleTabLoading] = useState(false);
  const [slotsLoading, setSlotsLoading] = useState(true);
  const [userMappingLoading, setUserMappingLoading] = useState(true);
  const [slotActionLoading, setSlotActionLoading] = useState<string | null>(null);
  const [acceptSwapLoading, setAcceptSwapLoading] = useState<string | null>(null);
  
  // Modal states
  const [swapModalOpen, setSwapModalOpen] = useState(false);
  const [swapSourceSlot, setSwapSourceSlot] = useState<string>("");
  const [swapTarget, setSwapTarget] = useState<string>("");
  const [swapLoading, setSwapLoading] = useState(false);
  const [confirmationModal, setConfirmationModal] = useState<ConfirmationModalState | null>(null);
  
  // Tournament splash
  const [showTournamentSplash, setShowTournamentSplash] = useState(false);
  const [tournamentSplashOptOut, setTournamentSplashOptOut] = useState(false);

  // Tab state persistence
  const [isTabStateLoaded, setIsTabStateLoaded] = useState(false);
  const [hasMounted, setHasMounted] = useState(false);

  // Set mounted state after hydration
  useEffect(() => {
    setHasMounted(true);
  }, []);

  // Data fetching functions
  const fetchSchedule = useCallback(async (): Promise<void> => {
    try {
      setScheduleLoading(true);
      setUserMappingLoading(true);
      const res = await fetch("/api/schedule");
      const json = await res.json();
      if (json.data) {
        setSchedule(parseScheduleData(json.data));
      }
      if (json.userMapping) {
        setUserMapping(json.userMapping);
      }
    } catch (error) {
      console.error('Failed to fetch schedule:', error);
    } finally {
      setScheduleLoading(false);
      setUserMappingLoading(false);
    }
  }, []);

  const refreshScheduleForTab = async (): Promise<void> => {
    try {
      setScheduleTabLoading(true);
      const res = await fetch("/api/schedule");
      const json = await res.json();
      if (json.data) {
        setSchedule(parseScheduleData(json.data));
      }
      if (json.userMapping) {
        setUserMapping(json.userMapping);
      }
    } catch (error) {
      console.error('Failed to refresh schedule:', error);
    } finally {
      setScheduleTabLoading(false);
    }
  };

  const fetchMarketplaceData = async (): Promise<void> => {
    try {
      setSlotsLoading(true);
      const res = await fetch("/api/slots");
      const json = await res.json();
      if (json.slots) {
        setAvailableSlots(json.slots.filter((slot: SlotData) => slot.Status === 'offered'));
        setAllSlots(json.slots);
      }
    } catch (error) {
      console.error('Failed to fetch marketplace data:', error);
    } finally {
      setSlotsLoading(false);
    }
  };

  // Event handlers
  const handleTabChange = (tab: string): void => {
    setActiveTab(tab);
    
    // Save tab state to localStorage (client-side only)
    if (hasMounted && session?.user?.email) {
      const userId = session.user.email;
      const tabKey = getStorageKey(userId, 'tab', 'active');
      saveToStorage(tabKey, tab);
    }
    
    if (tab === "available") {
      fetchMarketplaceData();
    } else if (tab === "schedule") {
      refreshScheduleForTab();
    }
  };

  const handleOfferSlot = async (date: string, time: string, player: string, sessionId: string): Promise<void> => {
    setSlotActionLoading(sessionId);
    try {
      await fetch("/api/slots", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ date, time, player }),
      });
      await Promise.all([fetchMarketplaceData(), fetchSchedule()]);
    } finally {
      setSlotActionLoading(null);
    }
  };

  const handleClaimSlot = async (date: string, time: string, player: string, claimer: string, sessionId: string): Promise<void> => {
    setSlotActionLoading(sessionId);
    try {
      await fetch("/api/slots", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ date, time, player: player || 'free spot', claimer }),
      });
      const res = await fetch("/api/slots");
      const json = await res.json();
      if (json.slots) {
        setAvailableSlots(json.slots.filter((slot: SlotData) => slot.Status === 'offered'));
        setAllSlots(json.slots);
      }
      await fetchSchedule();
    } finally {
      setSlotActionLoading(null);
    }
  };

  const handleRecallSlot = async (date: string, time: string, player: string, actionId: string): Promise<void> => {
    setSlotActionLoading(actionId);
    try {
      await fetch("/api/slots", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ date, time, player }),
      });
      await fetchMarketplaceData();
    } finally {
      setSlotActionLoading(null);
    }
  };

  const handleRequestSwap = (slot: SlotData): void => {
    setSwapModalOpen(true);
    setSwapSourceSlot(`${slot.Date}__${slot.Time}`);
    setSwapTarget("");
  };

  const handleConfirmSwap = async (): Promise<void> => {
    if (!swapSourceSlot || !swapTarget || !playerName) return;
    setSwapLoading(true);
    const [date, time] = swapSourceSlot.split("__");
    const [requestedDate, requestedTime] = swapTarget.split("__");
    try {
      await fetch("/api/slots/swap", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date,
          time,
          player: playerName,
          requestedDate,
          requestedTime,
        }),
      });
      setSwapModalOpen(false);
      setSwapSourceSlot("");
      setSwapTarget("");
      fetchMarketplaceData();
    } finally {
      setSwapLoading(false);
    }
  };

  const handleRegister = async (name: string): Promise<void> => {
    if (!session?.user?.email) throw new Error("No email found");
    const res = await fetch("/api/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email: session.user.email }),
    });
    const json = await res.json();
    if (!json.success) throw new Error(json.error || "Registration failed");
    await fetchSchedule();
  };

  // Helper functions
  const normalizeDate = (date: string): string => {
    if (!date) return '';
    const [d, m] = date.split('.').map(Number);
    if (isNaN(d) || isNaN(m)) return date.trim();
    return `${d.toString().padStart(2, '0')}.${m.toString().padStart(2, '0')}`;
  };

  const getSlotForSession = (date: string, time: string, player: string): SlotData | undefined => {
    const normalize = (v: string) => v.trim().toLowerCase();
    return availableSlots.find(
      (slot) =>
        normalizeDate(slot.Date) === normalizeDate(date) &&
        normalize(slot.Time) === normalize(time) &&
        normalize(slot.Player || '') === normalize(player) &&
        slot.Status === "offered"
    );
  };

  const getEligibleTargetSessions = (): Array<{ Date: string; Time: string; Day: string }> => {
    if (!playerName) return [];
    const now = new Date();
    let sessions: Array<{ Date: string; Time: string; Day: string }> = [];
    schedule.forEach((game) => {
      game.sessions.forEach((session) => {
        const [day, month] = game.date.split(".").map(Number);
        const [startHour] = session.time.split(":");
        const sessionDate = new Date(now.getFullYear(), month - 1, day, Number(startHour));
        if (sessionDate < now) return;
        if (session.players.some((p: string) => p.toLowerCase() === playerName!.toLowerCase())) return;
        const slotOffered = allSlots.find((slot: SlotData) => slot.Date === game.date && slot.Time === session.time && slot.Status === "offered");
        if (slotOffered) return;
        sessions.push({ Date: game.date, Time: session.time, Day: game.day });
      });
    });
    return sessions;
  };

  const parseScheduleData = (raw: any[][]): ScheduleData[] => {
    if (!Array.isArray(raw) || raw.length === 0) return [];
    const isHeader = isNaN(Date.parse(raw[0][0])) && !/^\d{2}\.\d{2}/.test(raw[0][0]);
    const rows = isHeader ? raw.slice(1) : raw;
    const scheduleMap: Record<string, ScheduleData> = {};
    rows.forEach((row) => {
      const [dateTime, playersStr, maxPlayersStr] = row;
      if (!dateTime) return;
      const [datePart, day, time] = dateTime.split(" / ").map((s: string) => s.trim());
      const dateKey = `${datePart} / ${day}`;
      if (!scheduleMap[dateKey]) {
        scheduleMap[dateKey] = {
          id: dateKey,
          date: datePart,
          day,
          sessions: [],
        };
      }
      let maxPlayers = parseInt(maxPlayersStr, 10);
      if (isNaN(maxPlayers)) maxPlayers = 10;
      scheduleMap[dateKey].sessions.push({
        id: `${dateKey}-${time}`,
        time,
        hour: time,
        players: playersStr ? playersStr.split(",").map((p: string) => p.trim()) : [],
        maxPlayers,
      });
    });
    return Object.values(scheduleMap);
  };

  const getPlayerColor = (name: string): string => {
    return userMapping[name]?.color || '#E0E0E0';
  };

  // Helper functions for session data
  const getPlayerName = (): string | undefined => {
    const userEmail = session?.user?.email;
    if (!userEmail) return undefined;
    return Object.keys(userMapping).find(
      name => userMapping[name].email.toLowerCase() === userEmail.toLowerCase()
    );
  };

  const playerName = getPlayerName();
  const isRegistered = !!playerName;

  // Helper to determine if a session is in the future
  const isSessionUpcoming = (date: string, time: string): boolean => {
    const [day, month] = date.split(".").map(Number);
    const [startTime] = time.split("-");
    const [startHour, startMinute] = startTime.trim().split(":").map(Number);
    const now = new Date();
    const sessionDate = new Date(now.getFullYear(), month - 1, day, startHour, startMinute);
    return sessionDate >= now;
  };

  // Filter sessions by upcoming/past
  const filterByUpcoming = (scheduleArr: ScheduleData[]): ScheduleData[] => {
    return scheduleArr
      .map((game) => ({
        ...game,
        sessions: game.sessions.filter((session) =>
          showPast || isSessionUpcoming(game.date, session.time)
        ),
      }))
      .filter((game) => game.sessions.length > 0);
  };

  // Filter the schedule to only show sessions where the player is scheduled or can claim a spot
  const getFilteredSchedule = (): ScheduleData[] => {
    if (!playerName) return [];
    
    return schedule
      .map((game) => ({
        ...game,
        sessions: game.sessions.filter((session) => {
          const isAttending = session.players.some((p: string) => p.toLowerCase() === playerName!.toLowerCase());
          const hasAvailableSlot = session.players.length < session.maxPlayers;
          return isAttending || (!isAttending && hasAvailableSlot);
        }),
      }))
      .filter((game) => game.sessions.length > 0);
  };

  // Choose which schedule to display, then filter by upcoming
  const baseSchedule = session?.user && !showAll ? (playerName ? getFilteredSchedule() : []) : schedule;
  const scheduleToDisplay = filterByUpcoming(baseSchedule);

  // Effects
  useEffect(() => {
    if (typeof window !== 'undefined') {
      setTournamentSplashOptOut(localStorage.getItem('tournamentSplashOptOut') === '1');
    }
  }, []);

  // Load saved tab state when user is authenticated (client-side only)
  useEffect(() => {
    if (hasMounted && status === "authenticated" && session?.user?.email && !isTabStateLoaded) {
      const userId = session.user.email;
      const tabKey = getStorageKey(userId, 'tab', 'active');
      const savedTab = loadFromStorage(tabKey, 'schedule');
      
      // Validate that the saved tab is still available
      const validTabs = ['schedule', 'available'];
      if (showFlagsTab) {
        validTabs.push('flags');
      }
      
      const finalTab = validTabs.includes(savedTab) ? savedTab : 'schedule';
      setActiveTab(finalTab);
      setIsTabStateLoaded(true);
    }
  }, [hasMounted, status, session, isTabStateLoaded, showFlagsTab]);

  useEffect(() => {
    if (status === "authenticated" && session) {
      fetchSchedule();
    }
  }, [status, session, fetchSchedule]);

  useEffect(() => {
    if (status === "authenticated" && session) {
      fetchMarketplaceData();
    }
  }, [status, session]);

  useEffect(() => {
    if (!playerName || !schedule.length || tournamentSplashOptOut) return;
    const isInTournament = schedule.some(game =>
      game.date === '20.08' &&
      game.sessions.some((session) =>
        session.players.some((p: string) => p.toLowerCase() === playerName.toLowerCase())
      )
    );
    setShowTournamentSplash(isInTournament);
  }, [playerName, schedule, tournamentSplashOptOut]);

  // Early returns for better readability
  if (status === "loading") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-50">
        <Header session={session} onSignIn={() => signIn("google")} onSignOut={signOut} userMapping={userMapping} />
        <div className="max-w-md mx-auto px-4 py-6">
          <div className="text-center text-gray-500 py-10">Loading...</div>
        </div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-50">
        <Header session={session} onSignIn={() => signIn("google")} onSignOut={signOut} userMapping={userMapping} />
        <div className="max-w-md mx-auto px-4 py-6">
          <div className="text-center text-gray-500 py-10">You need to log in to use the app.</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-50">
      <Header session={session} onSignIn={() => signIn("google")} onSignOut={signOut} userMapping={userMapping} />

      {/* Tab Navigation - Always visible when authenticated */}
      {session && (
        <div className="bg-white border-b border-orange-100 shadow-sm">
          <div className="max-w-md mx-auto px-4 py-3">
            <Tabs value={activeTab} className="w-full" onValueChange={handleTabChange}>
              <TabsList className={`grid w-full ${showFlagsTab ? 'grid-cols-3' : 'grid-cols-2'}`}>
                <TabsTrigger value="schedule" className="flex items-center space-x-2">
                  <Calendar className="w-4 h-4" />
                  <span>Schedule</span>
                </TabsTrigger>
                <TabsTrigger value="available" className="flex items-center space-x-2">
                  <Store className="w-4 h-4" />
                  <span>Marketplace</span>
                </TabsTrigger>
                {showFlagsTab && (
                  <TabsTrigger value="flags" className="flex items-center space-x-2">
                    <Flag className="w-4 h-4" />
                    <span>Feature Flags</span>
                  </TabsTrigger>
                )}
              </TabsList>
            </Tabs>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="max-w-md mx-auto px-4 py-3">
        <Tabs value={activeTab} className="w-full" onValueChange={handleTabChange}>
          <TabsContent value="schedule" className="space-y-2">
            {userMappingLoading ? (
              <div className="text-center text-gray-500 py-10">Loading...</div>
            ) : !isRegistered && session ? (
              <RegisterPrompt email={session.user?.email || ""} onRegister={handleRegister} />
            ) : (
              <ScheduleTab
                scheduleToDisplay={scheduleToDisplay}
                userMapping={userMapping}
                playerName={playerName}
                allSlots={allSlots}
                condensedMode={condensedMode}
                setCondensedMode={setCondensedMode}
                slotActionLoading={slotActionLoading}
                handleOfferSlot={handleOfferSlot}
                handleRequestSwap={handleRequestSwap}
                scheduleLoading={scheduleLoading}
                scheduleTabLoading={scheduleTabLoading}
                showAll={showAll}
                showPast={showPast}
                setShowAll={setShowAll}
                setShowPast={setShowPast}
                loggedInUser={session}
                onClaimAvailableSlot={({ date, time }) => {
                  setConfirmationModal({
                    open: true,
                    slot: { Date: date, Time: time },
                    type: 'claim',
                    alreadyInSession: false,
                    claimSessionId: `${date}-${time}-available`,
                  });
                }}
                onScheduleRefresh={refreshScheduleForTab}
              />
            )}
          </TabsContent>
          
          <TabsContent value="available" className="space-y-2">
            {userMappingLoading ? (
              <div className="text-center text-gray-500 py-10">Loading...</div>
            ) : !isRegistered && session ? (
              <RegisterPrompt email={session.user?.email || ""} onRegister={handleRegister} />
            ) : (
              <MarketplaceTab
                allSlots={allSlots}
                availableSlots={availableSlots}
                playerName={playerName}
                schedule={schedule}
                userMapping={userMapping}
                slotActionLoading={slotActionLoading}
                acceptSwapLoading={acceptSwapLoading}
                handleRecallSlot={handleRecallSlot}
                handleAcceptSwap={(swapSlot) => {
                  let isUserInOfferingSession = false;
                  for (const game of schedule) {
                    if (normalizeDate(game.date) === normalizeDate(swapSlot.Date)) {
                      for (const session of game.sessions) {
                        if (session.time.trim() === swapSlot.Time.trim()) {
                          if (session.players.some((p: string) => p.toLowerCase() === playerName!.toLowerCase())) {
                            isUserInOfferingSession = true;
                          }
                        }
                      }
                    }
                  }
                  setConfirmationModal({
                    open: true,
                    slot: swapSlot,
                    type: 'swap',
                    alreadyInSession: isUserInOfferingSession,
                  });
                }}
                handleOfferSlot={handleOfferSlot}
                handleRequestSwap={handleRequestSwap}
                showInactiveSlots={showInactiveSlots}
                setShowInactiveSlots={setShowInactiveSlots}
                showOnlyMine={showOnlyMine}
                setShowOnlyMine={setShowOnlyMine}
                slotsLoading={slotsLoading}
                getPlayerColor={getPlayerColor}
                isEligibleForSwap={(slot) => {
                  if (!playerName) return false;
                  for (const game of schedule) {
                    if (game.date === slot.RequestedDate) {
                      for (const session of game.sessions) {
                        if (session.time === slot.RequestedTime) {
                          return session.players.some((p: string) => p.toLowerCase() === playerName.toLowerCase());
                        }
                      }
                    }
                  }
                  return false;
                }}
                onClaimClick={(slot, claimSessionId) => {
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
                  setConfirmationModal({
                    open: true,
                    slot,
                    type: 'claim',
                    alreadyInSession: isUserInSession,
                    claimSessionId,
                  });
                }}
                loggedInUser={session}
              />
            )}
          </TabsContent>
          
          {showFlagsTab && (
            <TabsContent value="flags" className="space-y-4">
              {userMappingLoading ? (
                <div className="text-center text-gray-500 py-10">Loading...</div>
              ) : !isRegistered && session ? (
                <RegisterPrompt email={session.user?.email || ""} onRegister={handleRegister} />
              ) : (
                <LaunchDarklyDebug />
              )}
            </TabsContent>
          )}
        </Tabs>
      </div>

        {/* Modals */}
        <SwapModal
          open={swapModalOpen}
          onOpenChange={setSwapModalOpen}
          sourceSlot={swapSourceSlot}
          target={swapTarget}
          onTargetChange={setSwapTarget}
          eligibleSessions={getEligibleTargetSessions()}
          onConfirm={handleConfirmSwap}
          loading={swapLoading}
        />

        <ClaimConfirmationModal
          open={!!confirmationModal?.open}
          onOpenChange={(open) => {
            if (!open) setConfirmationModal(null);
          }}
          pendingSlot={confirmationModal?.slot}
          type={confirmationModal?.type}
          alreadyInSession={!!confirmationModal?.alreadyInSession}
          onConfirm={async () => {
            if (!confirmationModal) return;
            if (confirmationModal.type === 'claim' && confirmationModal.slot) {
              handleClaimSlot(
                confirmationModal.slot.Date,
                confirmationModal.slot.Time,
                confirmationModal.slot.Player || '',
                playerName!,
                confirmationModal.claimSessionId || ""
              );
            } else if (confirmationModal.type === 'swap' && confirmationModal.slot) {
              setAcceptSwapLoading(`${confirmationModal.slot.Date}-${confirmationModal.slot.Time}-${confirmationModal.slot.Player}`);
              try {
                await fetch('/api/slots/swap', {
                  method: 'PATCH',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    date: confirmationModal.slot.Date,
                    time: confirmationModal.slot.Time,
                    player: confirmationModal.slot.Player,
                    requestedDate: confirmationModal.slot.RequestedDate,
                    requestedTime: confirmationModal.slot.RequestedTime,
                    acceptingPlayer: playerName,
                  }),
                });
                await fetchMarketplaceData();
              } finally {
                setAcceptSwapLoading(null);
              }
            }
            setConfirmationModal(null);
          }}
          onCancel={() => setConfirmationModal(null)}
        />

        <TournamentSplash
          open={showTournamentSplash}
          onOpenChange={setShowTournamentSplash}
          onDontShowAgain={() => {
            setTournamentSplashOptOut(true);
            localStorage.setItem('tournamentSplashOptOut', '1');
            setShowTournamentSplash(false);
          }}
        />
      </div>
  );
}
