"use client"

import { useState, useEffect } from "react"
import { useSession, signIn, signOut } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Calendar, Clock, Users, Gift } from "lucide-react"

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

  // 2. Find the logged-in user's player name using their email
  const loggedInUser = session?.user;
  let playerName: string | undefined = undefined;
  if (loggedInUser?.email) {
    playerName = Object.keys(userMapping).find(
      name => userMapping[name].email.toLowerCase() === loggedInUser.email!.toLowerCase()
    );
  }

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
    } catch {}
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
  function getSlotForSession(date: string, time: string, player: string) {
    return availableSlots.find(
      (slot) =>
        slot.Date === date &&
        slot.Time === time &&
        slot.Player === player &&
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-50">
      <div className="bg-white border-b border-orange-200 sticky top-0 z-50">
        <div className="max-w-md mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <img src="/summerHoopsLogo.png" alt="Summer Hoops Logo" className="w-8 h-8 rounded-full" />
              <div>
                <h1 className="font-bold text-lg text-gray-900">Summer Hoops</h1>
                {loggedInUser ? (
                  <p className="text-xs text-gray-500">Hi {loggedInUser.name?.split(" ")[0]}!</p>
                ) : (
                  <p className="text-xs text-gray-500">Please log in</p>
                )}
              </div>
            </div>
            <div className="flex items-center space-x-2">
              {loggedInUser ? (
                <>
                  <Avatar className="w-8 h-8">
                    <AvatarImage src={loggedInUser.image || "/summerHoopsLogo.png"} alt={loggedInUser.name || "User"} />
                    <AvatarFallback>
                      {loggedInUser.name
                        ?.split(" ")
                        .map((n: string) => n[0])
                        .join("")}
                    </AvatarFallback>
                  </Avatar>
                  <Button size="sm" variant="outline" onClick={() => signOut()}>Logout</Button>
                </>
              ) : (
                <Button size="sm" variant="outline" onClick={() => signIn("google")}>Login with Google</Button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 7. Show the chosen schedule */}
      <div className="max-w-md mx-auto px-4 py-6">
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
            {loggedInUser ? (
              <>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-bold text-gray-900">{showAll ? "All Games" : "Your Games"}</h2>
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
                        <Card key={game.id} className="border-l-4 border-l-orange-500">
                          <CardHeader className="pb-3">
                            <div className="flex items-center justify-between">
                              <CardTitle className="text-lg">{game.day} ({game.date})</CardTitle>
                            </div>
                          </CardHeader>
                          <CardContent className="space-y-3">
                            {game.sessions.map((session: any) => {
                              const sessionId = `${game.date}-${session.time}`;
                              // Check if the logged-in user is a participant
                              const isUserParticipant = playerName && session.players.some((p: string) => p.toLowerCase() === playerName.toLowerCase());
                              // Check if this user's slot is up for grabs
                              const userSlot = isUserParticipant ? getSlotForSession(game.date, session.time, playerName!) : null;
                              // Check if any slot is up for grabs in this session (not by this user)
                              const otherSlot = session.players
                                .map((p: string) => getSlotForSession(game.date, session.time, p))
                                .find((slot: any) => slot && (!playerName || slot.Player !== playerName));
                              return (
                                <div
                                  key={session.id}
                                  className={`p-4 rounded-lg border-2 ${
                                    playerName && session.players.some((p: string) => p.toLowerCase() === playerName!.toLowerCase())
                                      ? "bg-orange-50 border-orange-200"
                                      : "bg-gray-50 border-gray-200"
                                  }`}
                                >
                                  <div className="flex items-center justify-between mb-2">
                                    <div className="flex items-center space-x-2">
                                      <Clock className="w-4 h-4 text-gray-600" />
                                    </div>
                                    <Badge
                                      variant={playerName && session.players.some((p: string) => p.toLowerCase() === playerName!.toLowerCase()) ? "default" : "secondary"}
                                      className={playerName && session.players.some((p: string) => p.toLowerCase() === playerName!.toLowerCase()) ? "bg-orange-500" : ""}
                                    >
                                      {session.hour}
                                    </Badge>
                                  </div>
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center space-x-2">
                                      <Users className="w-4 h-4 text-gray-600" />
                                      <span className="text-sm text-gray-600">
                                        {session.players.length}/{session.maxPlayers} players
                                      </span>
                                    </div>
                                  </div>
                                  {session.players.length > 0 && (
                                    <div className="mt-3 flex flex-wrap gap-1">
                                      {session.players.map((playerId: string) => {
                                        const playerColor = userMapping[playerId]?.color;
                                        const isCurrentUser = playerName && playerId.toLowerCase() === playerName.toLowerCase();
                                        return (
                                          <div
                                            key={playerId}
                                            className={`flex items-center space-x-1 bg-white rounded-full px-2 py-1 text-xs ${isCurrentUser ? "font-bold text-orange-600" : ""}`}
                                            style={playerColor ? { backgroundColor: playerColor, color: '#fff' } : {}}
                                          >
                                            <Avatar className="w-4 h-4">
                                              <AvatarImage src={"/summerHoopsLogo.png"} />
                                              <AvatarFallback className="text-xs">
                                                {playerId
                                                  .split(" ")
                                                  .map((n: string) => n[0])
                                                  .join("")}
                                              </AvatarFallback>
                                            </Avatar>
                                            <span>
                                              {isCurrentUser ? "You" : playerId.split(" ")[0]}
                                            </span>
                                          </div>
                                        );
                                      })}
                                    </div>
                                  )}
                                  {/* Slot for grabs actions */}
                                  <div className="mt-3 flex flex-wrap gap-2">
                                    {/* Offer slot button for the logged-in user */}
                                    {isUserParticipant && !userSlot && (
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        disabled={slotActionLoading === sessionId}
                                        onClick={() => handleOfferSlot(game.date, session.time, playerName!, sessionId)}
                                      >
                                        {slotActionLoading === sessionId ? "Offering..." : "Offer Slot For Grabs"}
                                      </Button>
                                    )}
                                    {/* Show indicator if user's slot is up for grabs */}
                                    {isUserParticipant && userSlot && (
                                      <Badge className="bg-yellow-200 text-yellow-900">Slot Up For Grabs</Badge>
                                    )}
                                    {/* Claim slot button for other users */}
                                    {!isUserParticipant && otherSlot && (
                                      <Button
                                        size="sm"
                                        variant="default"
                                        disabled={slotActionLoading === sessionId}
                                        onClick={() => handleClaimSlot(game.date, session.time, otherSlot.Player, playerName!, sessionId)}
                                      >
                                        {slotActionLoading === sessionId ? "Claiming..." : `Claim ${otherSlot.Player.split(' ')[0]}'s Slot`}
                                      </Button>
                                    )}
                                    {/* Show indicator if a slot is up for grabs (for non-participants) */}
                                    {!isUserParticipant && otherSlot && (
                                      <Badge className="bg-yellow-200 text-yellow-900">{otherSlot.Player.split(' ')[0]}'s Slot Up For Grabs</Badge>
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                          </CardContent>
                        </Card>
                      ))
                    )}
                  </>
                )}
              </>
            ) : (
              <div className="text-center text-gray-500 py-10">
                Please log in to view your schedule.
                <div className="mt-4">
                  <Button size="sm" variant="default" onClick={() => signIn("google")}>Login with Google</Button>
                </div>
              </div>
            )}
          </TabsContent>
          <TabsContent value="available" className="space-y-4">
            {loggedInUser ? (
              <>
                <div className="flex justify-end mb-4">
                  <Button
                    size="sm"
                    variant={showInactiveSlots ? "default" : "outline"}
                    onClick={() => setShowInactiveSlots((v) => !v)}
                  >
                    {showInactiveSlots ? "Hide Inactive Offers" : "Show Inactive Offers"}
                  </Button>
                </div>
                {slotsLoading ? (
                  <div className="text-center text-gray-500 py-10">Loading available slots...</div>
                ) : (
                  (() => {
                    const filteredSlots = showInactiveSlots
                      ? allSlots
                      : availableSlots;
                    if (filteredSlots.length === 0) {
                      return <div className="text-center text-gray-500">No slots currently up for grabs.</div>;
                    }
                    return filteredSlots.map((slot: any, idx: number) => {
                      const isOwner = playerName && slot.Player === playerName;
                      const isInactive = slot.Status !== 'offered';
                      return (
                        <Card key={idx} className={`border-l-4 ${slot.Status === 'offered' ? 'border-l-yellow-400' : slot.Status === 'claimed' ? 'border-l-green-400' : 'border-l-gray-400'}`}>
                          <CardHeader className="pb-2 flex flex-row items-center justify-between">
                            <CardTitle className="text-md flex items-center gap-2">
                              <span>{slot.Date}</span>
                              <span className="text-gray-400">/</span>
                              <span>{slot.Time}</span>
                            </CardTitle>
                            {isOwner && slot.Status === 'offered' && (
                              <Badge className="bg-yellow-200 text-yellow-900">Your Slot</Badge>
                            )}
                            {slot.Status === 'claimed' && (
                              <Badge className="bg-green-200 text-green-900">Claimed</Badge>
                            )}
                            {slot.Status === 'retracted' && (
                              <Badge className="bg-gray-200 text-gray-900">Retracted</Badge>
                            )}
                          </CardHeader>
                          <CardContent className="flex flex-col gap-2">
                            <div className="flex items-center gap-2">
                              <Avatar className="w-6 h-6">
                                <AvatarImage src={"/summerHoopsLogo.png"} />
                                <AvatarFallback className="text-xs">
                                  {slot.Player.split(" ").map((n: string) => n[0]).join("")}
                                </AvatarFallback>
                              </Avatar>
                              <span className="text-sm font-medium">
                                {isOwner ? "You" : slot.Player.split(" ")[0]}
                              </span>
                            </div>
                            {!isOwner && slot.Status === 'offered' && (
                              <Button
                                size="sm"
                                variant="default"
                                disabled={slotActionLoading === `available-${idx}`}
                                onClick={() => handleClaimSlot(slot.Date, slot.Time, slot.Player, playerName!, `available-${idx}`)}
                              >
                                {slotActionLoading === `available-${idx}` ? "Claiming..." : "Claim Slot"}
                              </Button>
                            )}
                            {isOwner && slot.Status === 'offered' && (
                              <Button
                                size="sm"
                                variant="destructive"
                                disabled={slotActionLoading === `recall-${idx}`}
                                onClick={() => handleRecallSlot(slot.Date, slot.Time, slot.Player, `recall-${idx}`)}
                              >
                                {slotActionLoading === `recall-${idx}` ? "Recalling..." : "Recall Slot"}
                              </Button>
                            )}
                            {slot.Status === 'claimed' && slot.ClaimedBy && (
                              <div className="text-xs text-green-700 mt-1">
                                Claimed by: <span className="font-semibold">{slot.ClaimedBy}</span>
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      );
                    });
                  })()
                )}
              </>
            ) : (
              <div className="text-center text-gray-500 py-10">
                Please log in to view available slots.
                <div className="mt-4">
                  <Button size="sm" variant="default" onClick={() => signIn("google")}>Login with Google</Button>
                </div>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
