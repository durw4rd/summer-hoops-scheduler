import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useMemo } from "react";

interface SlotCardProps {
  slot: any;
  idx: number;
  userMapping: Record<string, { email: string; color?: string }>;
  slotActionLoading: string | null;
  acceptSwapLoading: string | null;
  handleRecallSlot: (date: string, time: string, player: string, actionId: string) => void;
  handleAcceptSwap: (slot: any) => void;
  handleOfferSlot: (date: string, time: string, player: string, sessionId: string) => void;
  handleRequestSwap: (slot: any) => void;
  isOwner: boolean;
  isInactive: boolean;
  isUserInSession: boolean;
  getPlayerColor: (name: string) => string;
  acceptSwapEligible: boolean;
  onClaimClick: (slot: any, claimSessionId: string) => void;
}

function getDayOfWeek(dateStr: string) {
  const [day, month] = dateStr.split('.').map(Number);
  const date = new Date(new Date().getFullYear(), month - 1, day);
  return date.toLocaleDateString(undefined, { weekday: 'short' });
}

export default function SlotCard({
  slot,
  idx,
  userMapping,
  slotActionLoading,
  acceptSwapLoading,
  handleRecallSlot,
  handleAcceptSwap,
  handleOfferSlot,
  handleRequestSwap,
  isOwner,
  isInactive,
  isUserInSession,
  getPlayerColor,
  acceptSwapEligible,
  onClaimClick,
}: SlotCardProps) {
  return (
    <Card
      key={idx}
      className={`border-l-4 ${slot.Status === 'offered' ? '' : slot.Status === 'claimed' ? 'border-l-green-400' : 'border-l-gray-400'}`}
      style={slot.Status === 'offered' ? {
        borderLeftColor: getPlayerColor(slot.Player),
        background: `linear-gradient(90deg, ${getPlayerColor(slot.Player)}11 0%, transparent 100%)` // subtle tint
      } : {}}
    >
      <CardHeader className="pb-2 flex flex-row items-center justify-between">
        <CardTitle className="text-md flex items-center gap-2">
          <span>{slot.Date}</span>
          <span className="text-gray-400">({getDayOfWeek(slot.Date)})</span>
          <span className="text-gray-400">/</span>
          <span>{slot.Time}</span>
        </CardTitle>
        <div className="flex gap-2">
          {isOwner && slot.Status === 'offered' && (
            <Badge className="bg-yellow-200 text-yellow-900">Your Slot</Badge>
          )}
          {slot.Status === 'claimed' && (
            <Badge className="bg-green-200 text-green-900">Claimed</Badge>
          )}
          {slot.Status === 'retracted' && (
            <Badge className="bg-gray-200 text-gray-900">Retracted</Badge>
          )}
          {/* Only show 'Already in!' badge if user is in the session and it's not their own offer */}
          {!isOwner && isUserInSession && (
            <Badge className="bg-orange-500 text-white">Already in!</Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <Avatar className="w-6 h-6">
            <AvatarImage
              src={`/profile-${slot.Player.replace(/\s+/g, "").toLowerCase()}.png`}
              onError={(e) => { (e.currentTarget as HTMLImageElement).src = "/summerHoopsLogo.png"; }}
            />
            <AvatarFallback className="text-xs">
              {slot.Player.split(" ").map((n: string) => n[0]).join("")}
            </AvatarFallback>
          </Avatar>
          <span className="text-sm font-medium">
            {isOwner ? "You" : slot.Player.split(" ")[0]}
          </span>
        </div>
        {slot.SwapRequested === 'yes' ? (
          <div className="flex flex-col gap-1 mb-2">
            <Badge className="bg-blue-200 text-blue-900">Swap Offer</Badge>
            <div className="text-xs text-blue-900">
              Wants to swap for: <b>{slot.RequestedDate} / {slot.RequestedTime}</b>
            </div>
          </div>
        ) : (
          <Badge className="bg-yellow-200 text-yellow-900 mb-2">Up For Grabs</Badge>
        )}
        {isOwner && slot.Status !== 'offered' && slot.SwapRequested !== 'yes' && (
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleOfferSlot(slot.Date, slot.Time, slot.Player, `available-${idx}`)}
            >
              Offer for Grabs
            </Button>
            <Button
              size="sm"
              variant="secondary"
              onClick={() => handleRequestSwap(slot)}
            >
              Offer for Swap
            </Button>
          </div>
        )}
        {isOwner && slot.Status === 'offered' && (
          <Button
            size="sm"
            variant="destructive"
            disabled={slotActionLoading === `available-${idx}`}
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
        {/* For swap requests, show Accept Swap button if user is eligible */}
        {slot.SwapRequested === 'yes' && slot.Status === 'offered' && acceptSwapEligible && (
          <Button
            size="sm"
            variant="default"
            disabled={acceptSwapLoading === `${slot.Date}-${slot.Time}-${slot.Player}`}
            onClick={() => handleAcceptSwap(slot)}
          >
            {acceptSwapLoading === `${slot.Date}-${slot.Time}-${slot.Player}` ? 'Accepting...' : 'Accept swap'}
          </Button>
        )}
        {/* Claim button for non-owners, always visible, modal will warn if already in session */}
        {!isOwner && slot.Status === 'offered' && slot.SwapRequested !== 'yes' && (
          <Button
            size="sm"
            variant="default"
            disabled={slotActionLoading === `available-${idx}`}
            onClick={() => onClaimClick(slot, `available-${idx}`)}
          >
            {slotActionLoading === `available-${idx}` ? "Claiming..." : `Claim ${slot.Player.split(' ')[0]}'s Slot`}
          </Button>
        )}
      </CardContent>
    </Card>
  );
} 