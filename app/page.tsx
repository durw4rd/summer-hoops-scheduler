"use client"

import { useState, useEffect } from "react"
import { useSession, signIn, signOut } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Bell, Calendar, Clock, Users, Gift } from "lucide-react"

export default function SummerHoopsScheduler() {
  const { data: session } = useSession();
  const [schedule, setSchedule] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

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
      } finally {
        setLoading(false)
      }
    }
    fetchSchedule();
  }, []);

  // Helper to parse spreadsheet data into schedule structure
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
        maxPlayers: 8,
      });
    });
    return Object.values(scheduleMap);
  }

  // Try to match the logged-in user to a player name (by name or email)
  const loggedInUser = session?.user;
  // For now, match by name (case-insensitive) in the players list for each session
  // If you want to use email, ensure your spreadsheet or player data includes emails

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
                    <AvatarImage src={loggedInUser.image || "/placeholder.svg"} alt={loggedInUser.name || "User"} />
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

      {/* Loading state for schedule data or until mounted */}
      {(!mounted || loading) && (
        <div className="max-w-md mx-auto px-4 py-10 text-center text-gray-500">Loading schedule...</div>
      )}

      {/* Only show schedule if logged in, mounted, and not loading */}
      {loggedInUser && mounted && !loading && (
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
                    {game.sessions.map((session: any) => {
                      // Highlight if the logged-in user's name is in the session
                      const userInSession = loggedInUser && session.players.some((p: string) => p.toLowerCase() === loggedInUser.name?.toLowerCase());
                      return (
                        <div
                          key={session.id}
                          className={`p-4 rounded-lg border-2 ${
                            userInSession ? "bg-orange-50 border-orange-200" : "bg-gray-50 border-gray-200"
                          }`}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center space-x-2">
                              <Clock className="w-4 h-4 text-gray-600" />
                              <span className="font-medium text-sm">{session.time}</span>
                            </div>
                            <Badge
                              variant={userInSession ? "default" : "secondary"}
                              className={userInSession ? "bg-orange-500" : ""}
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
                              {session.players.map((playerId: string) => (
                                <div
                                  key={playerId}
                                  className={`flex items-center space-x-1 bg-white rounded-full px-2 py-1 text-xs ${playerId.toLowerCase() === loggedInUser?.name?.toLowerCase() ? "font-bold text-orange-600" : ""}`}
                                >
                                  <Avatar className="w-4 h-4">
                                    <AvatarImage src={"/placeholder.svg"} />
                                    <AvatarFallback className="text-xs">
                                      {playerId
                                        .split(" ")
                                        .map((n: string) => n[0])
                                        .join("")}
                                    </AvatarFallback>
                                  </Avatar>
                                  <span>
                                    {playerId.toLowerCase() === loggedInUser?.name?.toLowerCase() ? "You" : playerId.split(" ")[0]}
                                  </span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </CardContent>
                </Card>
              ))}
            </TabsContent>

            {/* Available slots tab can be re-enabled and implemented later */}
          </Tabs>
        </div>
      )}
    </div>
  )
}
