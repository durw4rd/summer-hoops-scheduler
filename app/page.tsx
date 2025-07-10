"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Bell, Calendar, Clock, Users, Gift, CheckCircle } from "lucide-react"
import { toast } from "@/hooks/use-toast"

// Mock data
const currentUser = {
  id: "james",
  name: "James Wilson",
  email: "james@example.com",
  avatar: "/placeholder.svg?height=40&width=40",
}

const players = [
  { id: "mike", name: "Mike Chen", avatar: "/placeholder.svg?height=32&width=32" },
  { id: "ayo", name: "Ayo Johnson", avatar: "/placeholder.svg?height=32&width=32" },
  { id: "ben", name: "Ben Rodriguez", avatar: "/placeholder.svg?height=32&width=32" },
  { id: "alex", name: "Alex Kim", avatar: "/placeholder.svg?height=32&width=32" },
  { id: "jordan", name: "Jordan Smith", avatar: "/placeholder.svg?height=32&width=32" },
  { id: "tyler", name: "Tyler Brown", avatar: "/placeholder.svg?height=32&width=32" },
]

const initialSchedule = [
  {
    id: "week1-mon",
    date: "2024-07-15",
    day: "Monday",
    sessions: [
      {
        id: "session1",
        time: "6:00 PM - 7:00 PM",
        hour: "First Hour",
        players: ["james", "mike", "ayo", "ben"],
        maxPlayers: 8,
        userAssigned: true,
      },
      {
        id: "session2",
        time: "7:00 PM - 8:00 PM",
        hour: "Second Hour",
        players: ["alex", "jordan", "tyler"],
        maxPlayers: 8,
        userAssigned: false,
      },
    ],
  },
  {
    id: "week1-wed",
    date: "2024-07-17",
    day: "Wednesday",
    sessions: [
      {
        id: "session3",
        time: "6:00 PM - 7:00 PM",
        hour: "First Hour",
        players: ["alex", "jordan", "tyler", "mike"],
        maxPlayers: 8,
        userAssigned: false,
      },
      {
        id: "session4",
        time: "7:00 PM - 8:00 PM",
        hour: "Second Hour",
        players: ["james", "ayo", "ben"],
        maxPlayers: 8,
        userAssigned: true,
      },
    ],
  },
  {
    id: "week1-fri",
    date: "2024-07-19",
    day: "Friday",
    sessions: [
      {
        id: "session5",
        time: "6:00 PM - 7:00 PM",
        hour: "First Hour",
        players: ["james", "mike", "alex", "jordan"],
        maxPlayers: 8,
        userAssigned: true,
      },
    ],
  },
]

const availableSlots = [
  {
    id: "available1",
    date: "2024-07-15",
    day: "Monday",
    time: "7:00 PM - 8:00 PM",
    hour: "Second Hour",
    sessionId: "session2",
    offeredBy: "tyler",
    reason: "Work conflict",
  },
  {
    id: "available2",
    date: "2024-07-17",
    day: "Wednesday",
    time: "6:00 PM - 7:00 PM",
    hour: "First Hour",
    sessionId: "session3",
    offeredBy: "alex",
    reason: "Family dinner",
  },
]

export default function SummerHoopsScheduler() {
  const [schedule, setSchedule] = useState<any[]>([])
  const [openSlots, setOpenSlots] = useState(availableSlots)
  const [selectedSession, setSelectedSession] = useState<{ session: any; date: any; day: any } | null>(null)
  const [swapReason, setSwapReason] = useState("")
  const [swapTarget, setSwapTarget] = useState("")
  const [notifications, setNotifications] = useState([
    {
      id: "notif1",
      type: "swap_offered",
      message: "Tyler offered up Monday 7PM slot",
      time: "2 hours ago",
      unread: true,
    },
  ])

  // Helper to parse spreadsheet data into schedule structure
  function parseScheduleData(raw: any[][]) {
    if (!Array.isArray(raw) || raw.length === 0) return [];
    // Assume first row is header if not a date, skip if so
    const isHeader = isNaN(Date.parse(raw[0][0])) && !/^\d{2}\.\d{2}/.test(raw[0][0]);
    const rows = isHeader ? raw.slice(1) : raw;
    // Group by date
    const scheduleMap: Record<string, any> = {};
    rows.forEach((row) => {
      const [dateTime, playersStr] = row;
      if (!dateTime) return;
      // Split dateTime: '15.07 / Monday / 6:00 - 7:00'
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
        maxPlayers: 8,
        userAssigned: false, // You can update this based on logged-in user
      });
    });
    return Object.values(scheduleMap);
  }

  // Fetch and parse schedule data
  useEffect(() => {
    async function fetchSchedule() {
      try {
        const res = await fetch("/api/schedule");
        const json = await res.json();
        if (json.data) {
          setSchedule(parseScheduleData(json.data));
        }
      } catch (e) {
        // Optionally handle error
      }
    }
    fetchSchedule();
  }, []);

  const getPlayerName = (playerId: any) => {
    if (playerId === currentUser.id) return currentUser.name
    const player = players.find((p: any) => p.id === playerId)
    return player ? player.name : playerId
  }

  const getPlayerAvatar = (playerId: any) => {
    if (playerId === currentUser.id) return currentUser.avatar
    const player = players.find((p: any) => p.id === playerId)
    return player ? player.avatar : "/placeholder.svg?height=32&width=32"
  }

  const handleOfferSlot = (session: any, gameDate: any, gameDay: any) => {
    const newAvailableSlot = {
      id: `available_${Date.now()}`,
      date: gameDate,
      day: gameDay,
      time: session.time,
      hour: session.hour,
      sessionId: session.id,
      offeredBy: currentUser.id,
      reason: swapReason || "Schedule conflict",
    }

    setOpenSlots([...openSlots, newAvailableSlot])

    // Remove user from the session
    const updatedSchedule = schedule.map((game: any) => {
      if (game.date === gameDate) {
        return {
          ...game,
          sessions: game.sessions.map((s: any) => {
            if (s.id === session.id) {
              return {
                ...s,
                players: s.players.filter((p: any) => p !== currentUser.id),
                userAssigned: false,
              }
            }
            return s
          }),
        }
      }
      return game
    })

    setSchedule(updatedSchedule)
    setSwapReason("")
    setSelectedSession(null)

    toast({
      title: "Slot offered successfully!",
      description: `Your ${session.hour} slot for ${gameDay} has been offered to the group.`,
    })
  }

  const handleClaimSlot = (slot: any) => {
    // Add user to the session
    const updatedSchedule = schedule.map((game: any) => {
      if (game.date === slot.date) {
        return {
          ...game,
          sessions: game.sessions.map((s: any) => {
            if (s.id === slot.sessionId) {
              return {
                ...s,
                players: [...s.players, currentUser.id],
                userAssigned: true,
              }
            }
            return s
          }),
        }
      }
      return game
    })

    setSchedule(updatedSchedule)

    // Remove from available slots
    setOpenSlots(openSlots.filter((s: any) => s.id !== slot.id))

    toast({
      title: "Slot claimed successfully!",
      description: `You've claimed the ${slot.hour} slot for ${slot.day}.`,
    })
  }

  const formatDate = (dateString: any) => {
    const date = new Date(dateString)
    return date.toLocaleDateString("en-US", {
      weekday: "long",
      month: "short",
      day: "numeric",
    })
  }

  const isUpcoming = (dateString: any) => {
    const gameDate = new Date(dateString)
    const today = new Date()
    return gameDate >= today
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-50">
      <div className="bg-white border-b border-orange-200 sticky top-0 z-50">
        <div className="max-w-md mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center">
                <span className="text-white font-bold text-sm">🏀</span>
              </div>
              <div>
                <h1 className="font-bold text-lg text-gray-900">Summer Hoops</h1>
                <p className="text-xs text-gray-500">Hey {currentUser.name.split(" ")[0]}!</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <div className="relative">
                <Bell className="w-5 h-5 text-gray-600" />
                {notifications.some((n: any) => n.unread) && (
                  <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full"></div>
                )}
              </div>
              <Avatar className="w-8 h-8">
                <AvatarImage src={currentUser.avatar || "/placeholder.svg"} alt={currentUser.name} />
                <AvatarFallback>
                  {currentUser.name
                    .split(" ")
                    .map((n: string) => n[0])
                    .join("")}
                </AvatarFallback>
              </Avatar>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-md mx-auto px-4 py-6">
        <Tabs defaultValue="schedule" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="schedule" className="flex items-center space-x-2">
              <Calendar className="w-4 h-4" />
              <span>My Schedule</span>
            </TabsTrigger>
            <TabsTrigger value="available" className="flex items-center space-x-2">
              <Gift className="w-4 h-4" />
              <span>Available Slots</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="schedule" className="space-y-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900">Your Games</h2>
              <Badge variant="secondary" className="bg-orange-100 text-orange-800">
                Week 1
              </Badge>
            </div>

            {schedule.map((game: any) => (
              <Card key={game.id} className="border-l-4 border-l-orange-500">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{game.day} ({game.date})</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {game.sessions.map((session: any) => (
                    <div
                      key={session.id}
                      className={`p-4 rounded-lg border-2 ${
                        session.userAssigned ? "bg-orange-50 border-orange-200" : "bg-gray-50 border-gray-200"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-2">
                          <Clock className="w-4 h-4 text-gray-600" />
                          <span className="font-medium text-sm">{session.time}</span>
                        </div>
                        <Badge
                          variant={session.userAssigned ? "default" : "secondary"}
                          className={session.userAssigned ? "bg-orange-500" : ""}
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
                          {session.players.map((playerId: any) => (
                            <div
                              key={playerId}
                              className="flex items-center space-x-1 bg-white rounded-full px-2 py-1 text-xs"
                            >
                              <Avatar className="w-4 h-4">
                                <AvatarImage src={getPlayerAvatar(playerId) || "/placeholder.svg"} />
                                <AvatarFallback className="text-xs">
                                  {getPlayerName(playerId)
                                    .split(" ")
                                    .map((n: any) => n[0])
                                    .join("")}
                                </AvatarFallback>
                              </Avatar>
                              <span className={playerId === currentUser.id ? "font-medium text-orange-600" : ""}>
                                {playerId === currentUser.id ? "You" : getPlayerName(playerId).split(" ")[0]}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </CardContent>
              </Card>
            ))}
          </TabsContent>

          {/* Available slots tab can be re-enabled and implemented later */}
        </Tabs>
      </div>
    </div>
  )
}
