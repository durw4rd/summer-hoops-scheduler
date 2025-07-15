import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useState } from "react";
// Remove icon imports
// import { Gift, Repeat, UserPlus } from "lucide-react";

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
  onReassignClick?: (sessionInfo: { date: string; time: string; currentPlayer: string }) => void;
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
  onReassignClick,
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
          // Count available slots for this session
          const availableCount = allSlots.filter(
            (slot: any) =>
              normalizeDate(slot.Date) === normalizeDate(game.date) &&
              slot.Time.trim() === session.time.trim() &&
              slot.Status === 'offered' &&
              slot.SwapRequested !== 'yes'
          ).length;
          // Count swap offers for this session
          const swapOfferCount = allSlots.filter(
            (slot: any) =>
              normalizeDate(slot.Date) === normalizeDate(game.date) &&
              slot.Time.trim() === session.time.trim() &&
              slot.Status === 'offered' &&
              slot.SwapRequested === 'yes'
          ).length;
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
                  {/* Available slots indicator */}
                  {availableCount > 0 && (
                    <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 border border-red-300">
                      Available: {availableCount}
                    </span>
                  )}
                  {/* Swap offers indicator */}
                  {swapOfferCount > 0 && (
                    <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 border border-blue-300">
                      Swap Offers: {swapOfferCount}
                    </span>
                  )}
                  {/* Removed player count */}
                </div>
              </div>
              {/* Subtle separator between badges and player names */}
              <div className="my-2 border-t border-gray-200" />
              {(!condensedMode && session.players.length > 0) && (
                <>
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
                                onError={(e) => { (e.currentTarget as HTMLImageElement).src = "/profile-default.png"; }}
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
                  {/* Subtle separator below player names */}
                  <div className="my-2 border-t border-gray-200" />
                </>
              )}
              {/* Show tag for user's slot offer type, only one at a time, and only for active offers, below player list or in same place if condensed */}
              {isUserParticipant && (
                userSwapSlot && userSwapSlot.Status === 'offered' ? (
                  <span className="border border-blue-500 text-blue-600 bg-blue-50 font-semibold rounded-full px-3 py-1 text-xs inline-block mt-1 mb-0">
                    Up for Swap
                  </span>
                ) : userSlot && userSlot.Status === 'offered' ? (
                  <span className="border border-red-500 text-red-600 bg-red-50 font-semibold rounded-full px-3 py-1 text-xs inline-block mt-1 mb-0">
                    Up for Grabs
                  </span>
                ) : null
              )}
              {/* Slot for grabs actions */}
              {isUserParticipant && !userSlot && (
                <div className="mt-3 flex flex-row w-full gap-x-1">
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex-1 min-w-0 whitespace-normal h-auto rounded-md font-semibold border-red-500 text-red-600 hover:bg-red-50 flex items-center justify-center gap-1"
                    disabled={slotActionLoading === sessionId}
                    onClick={() => handleOfferSlot(game.date, session.time, playerName!, sessionId)}
                  >
                    {slotActionLoading === sessionId ? "Offering..." : "Offer for grabs"}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex-1 min-w-0 whitespace-normal h-auto rounded-md font-semibold border-blue-500 text-blue-600 hover:bg-blue-50 flex items-center justify-center gap-1"
                    onClick={() => handleRequestSwap({ Date: game.date, Time: session.time })}
                  >
                    Offer for swap
                  </Button>
                  {onReassignClick && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-1 min-w-0 whitespace-normal h-auto rounded-md font-semibold border-gray-400 text-gray-700 hover:bg-gray-50 flex items-center justify-center gap-1"
                      onClick={() => onReassignClick({ date: game.date, time: session.time, currentPlayer: playerName! })}
                    >
                      Reassign
                    </Button>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
} 