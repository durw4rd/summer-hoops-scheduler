"use client"

import { useState, useEffect } from "react"
import { useSession, signIn, signOut } from "next-auth/react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Calendar, Gift } from "lucide-react"
import Header from "@/components/Header";
import SwapModal from "@/components/SwapModal";
import ClaimConfirmationModal from "@/components/ClaimConfirmationModal";
import ScheduleTab from "@/components/ScheduleTab";
import AvailableSlotsTab from "@/components/AvailableSlotsTab";
import RegisterPrompt from "@/components/RegisterPrompt";

export default function SummerHoopsScheduler() {
  const { data: session } = useSession();
  const [schedule, setSchedule] = useState<any[]>([])
  const [userMapping, setUserMapping] = useState<Record<string, { email: string; color?: string }>>({})
  const [showAll, setShowAll] = useState(false);
  const [showPast, setShowPast] = useState(false);
  const [availableSlots, setAvailableSlots] = useState<any[]>([]);
  const [allSlots, setAllSlots] = useState<any[]>([]);
  const [slotActionLoading, setSlotActionLoading] = useState<string | null>(null); // sessionId for which action is loading
  const [activeTab, setActiveTab] = useState<string>("schedule");
  const [scheduleLoading, setScheduleLoading] = useState(true);
  const [slotsLoading, setSlotsLoading] = useState(true);
  const [showInactiveSlots, setShowInactiveSlots] = useState(false);
  const [acceptSwapLoading, setAcceptSwapLoading] = useState<string | null>(null);
  const [swapModalOpen, setSwapModalOpen] = useState(false);
  // State changes
  const [swapSourceSlot, setSwapSourceSlot] = useState<string>(""); // value: `${Date}__${Time}`
  const [swapTarget, setSwapTarget] = useState<string>(""); // value: `${Date}__${Time}`
  const [swapLoading, setSwapLoading] = useState(false);
  const [condensedMode, setCondensedMode] = useState(false);
  const [showOnlyMine, setShowOnlyMine] = useState(false);
  const [claimConfirmOpen, setClaimConfirmOpen] = useState(false);
  const [pendingClaimSlot, setPendingClaimSlot] = useState<any | null>(null);
  const [userMappingLoading, setUserMappingLoading] = useState(true);

  // 2. Find the logged-in user's player name using their email
  const loggedInUser = session?.user;
  let playerName: string | undefined = undefined;
  if (loggedInUser?.email) {
    playerName = Object.keys(userMapping).find(
      name => userMapping[name].email.toLowerCase() === loggedInUser.email!.toLowerCase()
    );
  }

  const isRegistered = !!playerName;

  // Helper to determine if a session is in the future
  function isSessionUpcoming(date: string, time: string) {
    // date: '15.07', time: '6:00 - 7:00'
    const [day, month] = date.split(".").map(Number);
    const [startTime] = time.split("-");
    const [startHour, startMinute] = startTime.trim().split(":").map(Number);
    const now = new Date();
    const sessionDate = new Date(now.getFullYear(), month - 1, day, startHour, startMinute);
    return sessionDate >= now;
  }

  // Filter sessions by upcoming/past
  function filterByUpcoming(scheduleArr: any[]) {
    return scheduleArr
      .map((game: any) => ({
        ...game,
        sessions: game.sessions.filter((session: any) =>
          showPast || isSessionUpcoming(game.date, session.time)
        ),
      }))
      .filter((game: any) => game.sessions.length > 0);
  }

  // 3. Filter the schedule to only show sessions where the player is scheduled
  const filteredSchedule = playerName
    ? schedule
      .map((game: any) => ({
        ...game,
        sessions: game.sessions.filter((session: any) =>
          session.players.some((p: string) => p.toLowerCase() === playerName!.toLowerCase())
        ),
      }))
      .filter((game: any) => game.sessions.length > 0)
    : [];

  // 5. Choose which schedule to display, then filter by upcoming
  const baseSchedule =
    loggedInUser && !showAll
      ? playerName
        ? filteredSchedule
        : [] // Show no sessions if not mapped
      : schedule;
  const scheduleToDisplay = filterByUpcoming(baseSchedule);

  // Fetch schedule
  async function fetchSchedule() {
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
    } catch (e) {
      // Optionally handle error
    } finally {
      setScheduleLoading(false);
      setUserMappingLoading(false);
    }
  }

  // Fetch available slots
  async function fetchAvailableSlots() {
    try {
      setSlotsLoading(true);
      const res = await fetch("/api/slots");
      const json = await res.json();
      if (json.slots) {
        setAvailableSlots(json.slots.filter((slot: any) => slot.Status === 'offered'));
        setAllSlots(json.slots);
      }
    } catch { }
    finally {
      setSlotsLoading(false);
    }
  }

  useEffect(() => {
    fetchSchedule();
  }, []);

  useEffect(() => {
    fetchAvailableSlots();
  }, []);

  // Tab change handler
  function handleTabChange(tab: string) {
    setActiveTab(tab);
    if (tab === "available") {
      fetchAvailableSlots();
    } else if (tab === "schedule") {
      fetchSchedule();
    }
  }

  // Helper to check if a slot is up for grabs for a session
  function normalizeDate(date: string) {
    // Accepts '4.08' or '04.08', returns '04.08'
    if (!date) return '';
    const [d, m] = date.split('.').map(Number);
    if (isNaN(d) || isNaN(m)) return date.trim();
    return `${d.toString().padStart(2, '0')}.${m.toString().padStart(2, '0')}`;
  }
  function getSlotForSession(date: string, time: string, player: string) {
    const normalize = (v: string) => v.trim().toLowerCase();
    return availableSlots.find(
      (slot) =>
        normalizeDate(slot.Date) === normalizeDate(date) &&
        normalize(slot.Time) === normalize(time) &&
        normalize(slot.Player) === normalize(player) &&
        slot.Status === "offered"
    );
  }

  // Handler to offer a slot
  async function handleOfferSlot(date: string, time: string, player: string, sessionId: string) {
    setSlotActionLoading(sessionId);
    try {
      await fetch("/api/slots", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ date, time, player }),
      });
      // Refresh available slots and schedule
      await Promise.all([fetchAvailableSlots(), fetchSchedule()]);
    } finally {
      setSlotActionLoading(null);
    }
  }

  // Handler to claim a slot
  async function handleClaimSlot(date: string, time: string, player: string, claimer: string, sessionId: string) {
    setSlotActionLoading(sessionId);
    try {
      await fetch("/api/slots", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ date, time, player, claimer }),
      });
      // Refresh available slots
      const res = await fetch("/api/slots");
      const json = await res.json();
      if (json.slots) {
        setAvailableSlots(json.slots.filter((slot: any) => slot.Status === 'offered'));
        setAllSlots(json.slots);
      }
    } finally {
      setSlotActionLoading(null);
    }
  }

  // Handler to recall a slot
  async function handleRecallSlot(date: string, time: string, player: string, actionId: string) {
    setSlotActionLoading(actionId);
    try {
      await fetch("/api/slots", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ date, time, player }),
      });
      await fetchAvailableSlots();
    } finally {
      setSlotActionLoading(null);
    }
  }

  // Handler to accept a swap
  async function handleAcceptSwap(swapSlot: any) {
    if (!playerName) return;
    setAcceptSwapLoading(`${swapSlot.Date}-${swapSlot.Time}-${swapSlot.Player}`);
    try {
      await fetch('/api/slots/swap', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date: swapSlot.Date,
          time: swapSlot.Time,
          player: swapSlot.Player, // the offering player
          requestedDate: swapSlot.RequestedDate,
          requestedTime: swapSlot.RequestedTime,
          acceptingPlayer: playerName, // the user accepting the swap
        }),
      });
      await fetchAvailableSlots();
    } finally {
      setAcceptSwapLoading(null);
    }
  }

  // handleRequestSwap always takes a slot and sets it as the source
  function handleRequestSwap(slot: any) {
    setSwapModalOpen(true);
    setSwapSourceSlot(`${slot.Date}__${slot.Time}`);
    setSwapTarget("");
  }

  // Helper: get all future sessions the user is NOT attending
  function getEligibleTargetSessions() {
    if (!playerName) return [];
    const now = new Date();
    // Use schedule (parsed from sheet) to get all sessions
    let sessions: any[] = [];
    schedule.forEach((game: any) => {
      game.sessions.forEach((session: any) => {
        // Only future sessions
        const [day, month] = game.date.split(".").map(Number);
        const [startHour] = session.time.split(":");
        const sessionDate = new Date(now.getFullYear(), month - 1, day, Number(startHour));
        if (sessionDate < now) return;
        // User is NOT attending
        if (session.players.some((p: string) => p.toLowerCase() === playerName!.toLowerCase())) return;
        // Exclude if already offered/swapped (find in allSlots)
        const slotOffered = allSlots.find((slot: any) => slot.Date === game.date && slot.Time === session.time && slot.Status === "offered");
        if (slotOffered) return;
        sessions.push({ Date: game.date, Time: session.time, Day: game.day });
      });
    });
    return sessions;
  }

  async function handleConfirmSwap() {
    if (!swapSourceSlot || !swapTarget) return;
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
      fetchAvailableSlots();
    } finally {
      setSwapLoading(false);
    }
  }

  function parseScheduleData(raw: any[][]) {
    if (!Array.isArray(raw) || raw.length === 0) return [];
    const isHeader = isNaN(Date.parse(raw[0][0])) && !/^\d{2}\.\d{2}/.test(raw[0][0]);
    const rows = isHeader ? raw.slice(1) : raw;
    const scheduleMap: Record<string, any> = {};
    rows.forEach((row) => {
      const [dateTime, playersStr] = row;
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
      scheduleMap[dateKey].sessions.push({
        id: `${dateKey}-${time}`,
        time,
        hour: time,
        players: playersStr ? playersStr.split(",").map((p: string) => p.trim()) : [],
        maxPlayers: 10,
      });
    });
    return Object.values(scheduleMap);
  }

  function isEligibleForSwap(slot: any) {
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
  }

  // Define a color map for up to 25 players (use the palette provided earlier)
  const playerColors: Record<string, string> = {
    "Nathan": "#4CAF50",
    "Amit": "#81C784",
    "Micha": "#388E3C",
    "Andreas": "#A5D6A7",
    "Bruno": "#FBC02D",
    "Mark": "#FFF176",
    "Kyle": "#FFD600",
    "Vedran": "#FFB300",
    "Jaime": "#FFA726",
    "Vic": "#FB8C00",
    "Shafiq": "#FF7043",
    "Chris": "#FFCC80",
    "Antoine": "#F57C00",
    "Thibault": "#C0CA33",
    "Tasos": "#D4E157",
    "Fran": "#AED581",
    "Romario": "#FFEB3B",
    "Varun": "#F9A825",
    "Sam": "#8D6E63",
    "Daryl": "#FFD54F",
    "Ricardo": "#43A047",
    "testMicha": "#C62828"
  };

  function getPlayerColor(name: string) {
    return playerColors[name] || '#E0E0E0'; // fallback to a neutral gray
  }

  function handleClaimClick(slot: any, claimSessionId: string) {
    // Check if user is already in the session
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
    if (isUserInSession) {
      setClaimConfirmOpen(true);
      setPendingClaimSlot({ ...slot, claimSessionId });
    } else {
      handleClaimSlot(slot.Date, slot.Time, slot.Player, playerName!, claimSessionId);
    }
  }

  async function handleRegister(name: string) {
    if (!loggedInUser?.email) throw new Error("No email found");
    const res = await fetch("/api/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email: loggedInUser.email }),
    });
    const json = await res.json();
    if (!json.success) throw new Error(json.error || "Registration failed");
    // Refresh user mapping
    await fetchSchedule();
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-50">
      <Header session={session} onSignIn={() => signIn("google") } onSignOut={signOut} />

      {/* 7. Show the chosen schedule */}
      <div className="max-w-md mx-auto px-4 py-6">
        {userMappingLoading ? (
          <div className="text-center text-gray-500 py-10">Loading...</div>
        ) : !loggedInUser ? (
          <div className="text-center text-gray-500 py-10">You need to log in to use the app.</div>
        ) : !isRegistered ? (
          <RegisterPrompt email={loggedInUser.email || ""} onRegister={handleRegister} />
        ) : (
          <Tabs defaultValue="schedule" className="w-full" onValueChange={handleTabChange}>
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="schedule" className="flex items-center space-x-2">
                <Calendar className="w-4 h-4" />
                <span>Schedule</span>
              </TabsTrigger>
              <TabsTrigger value="available" className="flex items-center space-x-2">
                <Gift className="w-4 h-4" />
                <span>Available Slots</span>
              </TabsTrigger>
            </TabsList>
            <TabsContent value="schedule" className="space-y-4">
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
                showAll={showAll}
                showPast={showPast}
                setShowAll={setShowAll}
                setShowPast={setShowPast}
                loggedInUser={loggedInUser}
              />
            </TabsContent>
            <TabsContent value="available" className="space-y-4">
              <AvailableSlotsTab
                allSlots={allSlots}
                availableSlots={availableSlots}
                playerName={playerName}
                schedule={schedule}
                userMapping={userMapping}
                slotActionLoading={slotActionLoading}
                acceptSwapLoading={acceptSwapLoading}
                handleRecallSlot={handleRecallSlot}
                handleAcceptSwap={handleAcceptSwap}
                handleOfferSlot={handleOfferSlot}
                handleRequestSwap={handleRequestSwap}
                showInactiveSlots={showInactiveSlots}
                setShowInactiveSlots={setShowInactiveSlots}
                showOnlyMine={showOnlyMine}
                setShowOnlyMine={setShowOnlyMine}
                slotsLoading={slotsLoading}
                getPlayerColor={getPlayerColor}
                isEligibleForSwap={isEligibleForSwap}
                onClaimClick={handleClaimClick}
                loggedInUser={loggedInUser}
              />
            </TabsContent>
          </Tabs>
        )}
      </div>

      {/* Swap Modal */}
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

      {/* Claim Confirmation Modal */}
      <ClaimConfirmationModal
        open={claimConfirmOpen}
        onOpenChange={setClaimConfirmOpen}
        pendingSlot={pendingClaimSlot}
        onConfirm={() => {
          if (pendingClaimSlot) {
            handleClaimSlot(
              pendingClaimSlot.Date,
              pendingClaimSlot.Time,
              pendingClaimSlot.Player,
              playerName!,
              pendingClaimSlot.claimSessionId
            );
          }
          setClaimConfirmOpen(false);
          setPendingClaimSlot(null);
        }}
        onCancel={() => {
          setClaimConfirmOpen(false);
          setPendingClaimSlot(null);
        }}
      />
    </div>
  )
}
