import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useState } from "react";

interface Session {
  id: string;
  time: string;
  hour: string;
  players: string[];
  maxPlayers: number;
}

interface Game {
  id: string;
  date: string;
  day: string;
  sessions: Session[];
}

interface UserMapping {
  [player: string]: { email: string; color?: string };
}

interface ScheduleCardProps {
  game: Game;
  userMapping: UserMapping;
  playerName?: string;
  allSlots: any[];
  condensedMode: boolean;
  slotActionLoading: string | null;
  handleOfferSlot: (date: string, time: string, player: string, sessionId: string) => void;
  handleRequestSwap: (slot: any) => void;
}

function normalizeDate(date: string) {
  if (!date) return '';
  const [d, m] = date.split('.').map(Number);
  if (isNaN(d) || isNaN(m)) return date.trim();
  return `${d.toString().padStart(2, '0')}.${m.toString().padStart(2, '0')}`;
}

function getSlotForSession(availableSlots: any[], date: string, time: string, player: string) {
  const normalize = (v: string) => v.trim().toLowerCase();
  return availableSlots.find(
    (slot) =>
      normalizeDate(slot.Date) === normalizeDate(date) &&
      normalize(slot.Time) === normalize(time) &&
      normalize(slot.Player) === normalize(player) &&
      slot.Status === "offered"
  );
}

export default function ScheduleCard({
  game,
  userMapping,
  playerName,
  allSlots,
  condensedMode,
  slotActionLoading,
  handleOfferSlot,
  handleRequestSwap,
}: ScheduleCardProps) {
  return (
    <Card key={game.id} className="border-l-4 border-l-orange-500">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">{game.day} ({game.date})</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {game.sessions.map((session: any) => {
          const sessionId = `${game.date}-${session.time}`;
          const isUserParticipant = playerName && session.players.some((p: string) => p.toLowerCase() === playerName!.toLowerCase());
          let userSlot = isUserParticipant ? getSlotForSession(allSlots, game.date, session.time, playerName!) : null;
          let userSwapSlot = null;
          if (isUserParticipant) {
            userSwapSlot = allSlots.find(
              (slot: any) =>
                normalizeDate(slot.Date) === normalizeDate(game.date) &&
                slot.Time.trim() === session.time.trim() &&
                slot.Player === playerName &&
                slot.SwapRequested === 'yes' &&
                slot.Status === 'offered'
            );
          }
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
                <div className="flex items-center justify-between w-full">
                  <Badge
                    variant={playerName && session.players.some((p: string) => p.toLowerCase() === playerName!.toLowerCase()) ? "default" : "secondary"}
                    className={playerName && session.players.some((p: string) => p.toLowerCase() === playerName!.toLowerCase()) ? "bg-orange-500" : ""}
                  >
                    {session.hour}
                  </Badge>
                  <span className="text-sm text-gray-600 ml-2">
                    {session.players.length}/{session.maxPlayers} players
                  </span>
                </div>
              </div>
              {(!condensedMode && session.players.length > 0) && (
                <div className="mt-3 flex flex-wrap gap-1">
                  {/* Group and count players to avoid duplicate keys and show +N for multiples */}
                  {(() => {
                    const playerCounts: Record<string, number> = {};
                    session.players.forEach((p: string) => {
                      playerCounts[p] = (playerCounts[p] || 0) + 1;
                    });
                    const uniquePlayers = Object.keys(playerCounts);
                    return uniquePlayers.map((playerId, idx) => {
                      const playerColor = userMapping[playerId]?.color;
                      const isCurrentUser = playerName && playerId.toLowerCase() === playerName.toLowerCase();
                      const count = playerCounts[playerId];
                      return (
                        <div
                          key={playerId + '-' + idx}
                          className={`flex items-center space-x-1 bg-white rounded-full px-2 py-1 text-xs ${isCurrentUser ? "font-bold text-orange-600" : ""}`}
                          style={playerColor ? { backgroundColor: playerColor, color: '#fff' } : {}}
                        >
                          <Avatar className="w-4 h-4">
                            <AvatarImage
                              src={`/profile-${playerId.replace(/\s+/g, "").toLowerCase()}.png`}
                              onError={(e) => { (e.currentTarget as HTMLImageElement).src = "/summerHoopsLogo.png"; }}
                            />
                            <AvatarFallback className="text-xs">
                              {playerId
                                .split(" ")
                                .map((n: string) => n[0])
                                .join("")}
                            </AvatarFallback>
                          </Avatar>
                          <span>
                            {isCurrentUser ? "You" : playerId.split(" ")[0]}
                            {count > 1 && (
                              <span className="ml-1 text-xs font-semibold">+{count - 1}</span>
                            )}
                          </span>
                        </div>
                      );
                    });
                  })()}
                </div>
              )}
              {/* Show tag for user's slot offer type, only one at a time, and only for active offers, below player list or in same place if condensed */}
              {isUserParticipant && (
                userSwapSlot && userSwapSlot.Status === 'offered' ? (
                  <Badge className="mt-4 bg-blue-200 text-blue-900">Up for Swap</Badge>
                ) : userSlot && userSlot.Status === 'offered' ? (
                  <Badge className="mt-4 bg-yellow-200 text-yellow-900">Up for Grabs</Badge>
                ) : null
              )}
              {/* Slot for grabs actions */}
              <div className="mt-3 flex flex-wrap gap-2">
                {/* Offer slot button for the logged-in user */}
                {isUserParticipant && !userSlot && (
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={slotActionLoading === sessionId}
                      onClick={() => handleOfferSlot(game.date, session.time, playerName!, sessionId)}
                    >
                      {slotActionLoading === sessionId ? "Offering..." : "Offer Slot For Grabs"}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleRequestSwap({ Date: game.date, Time: session.time })}
                    >
                      Offer for Swap
                    </Button>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
} 