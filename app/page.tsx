"use client"

import { useState } from "react"
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
  const [schedule, setSchedule] = useState(initialSchedule)
  const [openSlots, setOpenSlots] = useState(availableSlots)
  const [selectedSession, setSelectedSession] = useState(null)
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

  const getPlayerName = (playerId) => {
    if (playerId === currentUser.id) return currentUser.name
    const player = players.find((p) => p.id === playerId)
    return player ? player.name : playerId
  }

  const getPlayerAvatar = (playerId) => {
    if (playerId === currentUser.id) return currentUser.avatar
    const player = players.find((p) => p.id === playerId)
    return player ? player.avatar : "/placeholder.svg?height=32&width=32"
  }

  const handleOfferSlot = (session, gameDate, gameDay) => {
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
    const updatedSchedule = schedule.map((game) => {
      if (game.date === gameDate) {
        return {
          ...game,
          sessions: game.sessions.map((s) => {
            if (s.id === session.id) {
              return {
                ...s,
                players: s.players.filter((p) => p !== currentUser.id),
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

  const handleClaimSlot = (slot) => {
    // Add user to the session
    const updatedSchedule = schedule.map((game) => {
      if (game.date === slot.date) {
        return {
          ...game,
          sessions: game.sessions.map((s) => {
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
    setOpenSlots(openSlots.filter((s) => s.id !== slot.id))

    toast({
      title: "Slot claimed successfully!",
      description: `You've claimed the ${slot.hour} slot for ${slot.day}.`,
    })
  }

  const formatDate = (dateString) => {
    const date = new Date(dateString)
    return date.toLocaleDateString("en-US", {
      weekday: "long",
      month: "short",
      day: "numeric",
    })
  }

  const isUpcoming = (dateString) => {
    const gameDate = new Date(dateString)
    const today = new Date()
    return gameDate >= today
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-50">
      {/* Header */}
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
                {notifications.some((n) => n.unread) && (
                  <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full"></div>
                )}
              </div>
              <Avatar className="w-8 h-8">
                <AvatarImage src={currentUser.avatar || "/placeholder.svg"} alt={currentUser.name} />
                <AvatarFallback>
                  {currentUser.name
                    .split(" ")
                    .map((n) => n[0])
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

            {schedule.map((game) => (
              <Card key={game.id} className="border-l-4 border-l-orange-500">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{formatDate(game.date)}</CardTitle>
                    {isUpcoming(game.date) && (
                      <Badge variant="outline" className="text-green-600 border-green-600">
                        Upcoming
                      </Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {game.sessions.map((session) => (
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

                        {session.userAssigned && (
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button
                                size="sm"
                                variant="outline"
                                className="text-xs bg-transparent"
                                onClick={() => setSelectedSession({ session, date: game.date, day: game.day })}
                              >
                                Offer Up
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-sm mx-auto">
                              <DialogHeader>
                                <DialogTitle>Offer Up Your Slot</DialogTitle>
                                <DialogDescription>
                                  Offer your {session.hour} slot for {game.day} to the group.
                                </DialogDescription>
                              </DialogHeader>
                              <div className="space-y-4">
                                <div>
                                  <Label htmlFor="reason">Reason (optional)</Label>
                                  <Textarea
                                    id="reason"
                                    placeholder="e.g., Work conflict, family dinner..."
                                    value={swapReason}
                                    onChange={(e) => setSwapReason(e.target.value)}
                                    className="mt-1"
                                  />
                                </div>
                              </div>
                              <DialogFooter>
                                <Button
                                  onClick={() =>
                                    selectedSession &&
                                    handleOfferSlot(selectedSession.session, selectedSession.date, selectedSession.day)
                                  }
                                  className="w-full bg-orange-500 hover:bg-orange-600"
                                >
                                  Offer to Group
                                </Button>
                              </DialogFooter>
                            </DialogContent>
                          </Dialog>
                        )}
                      </div>

                      {session.players.length > 0 && (
                        <div className="mt-3 flex flex-wrap gap-1">
                          {session.players.map((playerId) => (
                            <div
                              key={playerId}
                              className="flex items-center space-x-1 bg-white rounded-full px-2 py-1 text-xs"
                            >
                              <Avatar className="w-4 h-4">
                                <AvatarImage src={getPlayerAvatar(playerId) || "/placeholder.svg"} />
                                <AvatarFallback className="text-xs">
                                  {getPlayerName(playerId)
                                    .split(" ")
                                    .map((n) => n[0])
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

          <TabsContent value="available" className="space-y-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900">Available Slots</h2>
              <Badge variant="secondary" className="bg-green-100 text-green-800">
                {openSlots.length} open
              </Badge>
            </div>

            {openSlots.length === 0 ? (
              <Card>
                <CardContent className="text-center py-8">
                  <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-3" />
                  <h3 className="font-medium text-gray-900 mb-1">All slots filled!</h3>
                  <p className="text-sm text-gray-500">No available slots at the moment.</p>
                </CardContent>
              </Card>
            ) : (
              openSlots.map((slot) => (
                <Card key={slot.id} className="border-l-4 border-l-green-500">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <h3 className="font-medium text-gray-900">
                          {slot.day}, {slot.hour}
                        </h3>
                        <p className="text-sm text-gray-600">{slot.time}</p>
                      </div>
                      <Badge variant="outline" className="text-green-600 border-green-600">
                        Available
                      </Badge>
                    </div>

                    <div className="flex items-center space-x-2 mb-3">
                      <Avatar className="w-6 h-6">
                        <AvatarImage src={getPlayerAvatar(slot.offeredBy) || "/placeholder.svg"} />
                        <AvatarFallback className="text-xs">
                          {getPlayerName(slot.offeredBy)
                            .split(" ")
                            .map((n) => n[0])
                            .join("")}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-sm text-gray-600">Offered by {getPlayerName(slot.offeredBy)}</span>
                    </div>

                    {slot.reason && <p className="text-sm text-gray-500 mb-3 italic">"{slot.reason}"</p>}

                    <Button
                      onClick={() => handleClaimSlot(slot)}
                      className="w-full bg-green-500 hover:bg-green-600"
                      size="sm"
                    >
                      Claim This Slot
                    </Button>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
