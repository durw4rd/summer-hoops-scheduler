import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useMemo } from "react";
import { getDayOfWeek } from "@/lib/utils";
import { getOptimizedProfileImage, handleProfileImageError } from "@/lib/utils";

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

// Utility function to get comprehensive status information
const getStatusInfo = (slot: any) => {
  switch (slot.Status) {
    case 'offered':
      if (slot.SwapRequested === 'yes') {
        return { 
          badge: 'Swap Offer', 
          color: 'blue', 
          details: null,
          borderColor: 'border-l-blue-400'
        };
      } else {
        return { 
          badge: 'Up For Grabs', 
          color: 'yellow', 
          details: null,
          borderColor: 'border-l-yellow-400'
        };
      }
    case 'claimed':
      return { 
        badge: 'Claimed', 
        color: 'green', 
        details: slot.ClaimedBy ? `by ${slot.ClaimedBy}` : null,
        borderColor: 'border-l-green-400'
      };
    case 'retracted':
      return { 
        badge: 'Retracted', 
        color: 'gray', 
        details: null,
        borderColor: 'border-l-gray-400'
      };
    case 'reassigned':
      return { 
        badge: 'Reassigned', 
        color: 'blue', 
        details: slot.ClaimedBy ? `to ${slot.ClaimedBy}` : null,
        borderColor: 'border-l-blue-400'
      };
    default:
      return { 
        badge: slot.Status || 'Unknown', 
        color: 'gray', 
        details: null,
        borderColor: 'border-l-gray-400'
      };
  }
};

// Utility function to format timestamp
const formatTimestamp = (timestamp: string) => {
  if (!timestamp) return null;
  try {
    const date = new Date(timestamp);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch {
    return null;
  }
};

// Utility function to get badge color classes
const getBadgeColorClasses = (color: string) => {
  switch (color) {
    case 'yellow':
      return 'bg-yellow-200 text-yellow-900';
    case 'green':
      return 'bg-green-200 text-green-900';
    case 'blue':
      return 'bg-blue-200 text-blue-900';
    case 'gray':
      return 'bg-gray-200 text-gray-900';
    default:
      return 'bg-gray-200 text-gray-900';
  }
};

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
  const statusInfo = getStatusInfo(slot);
  const formattedTimestamp = formatTimestamp(slot.Timestamp);

  return (
    <Card
      key={idx}
      className={`border-l-4 ${slot.Status === 'offered' ? '' : statusInfo.borderColor}`}
      style={slot.Status === 'offered' ? {
        borderLeftColor: getPlayerColor(slot.Player),
        background: `linear-gradient(90deg, ${getPlayerColor(slot.Player)}11 0%, transparent 100%)` // subtle tint
      } : {}}
    >
      <CardHeader className="pb-2 flex flex-row items-start justify-between">
        <CardTitle className="text-md flex items-center gap-2">
          <span>{slot.Date}</span>
          <span className="text-gray-400">({getDayOfWeek(slot.Date)})</span>
          <span className="text-gray-400">/</span>
          <span>{slot.Time}</span>
        </CardTitle>
        <div className="flex flex-col gap-1 items-end">
          {isOwner && slot.Status === 'offered' && (
            <Badge className="bg-yellow-200 text-yellow-900">Your Slot</Badge>
          )}
          <Badge className={getBadgeColorClasses(statusInfo.color)}>
            {statusInfo.badge}
          </Badge>
          {/* Only show 'Already in!' badge if user is in the session, it's not their own offer, and the slot is still offered */}
          {!isOwner && isUserInSession && slot.Status === 'offered' && (
            <Badge className="bg-orange-500 text-white">Already in!</Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <Avatar className="w-6 h-6">
            <AvatarImage
              src={getOptimizedProfileImage(slot.Player)}
              onError={(e) => handleProfileImageError(e, slot.Player)}
            />
            <AvatarFallback className="text-xs">
              {slot.Player.split(" ").map((n: string) => n[0]).join("")}
            </AvatarFallback>
          </Avatar>
          <span className="text-sm font-medium">
            {isOwner ? "You" : slot.Player.split(" ")[0]}
          </span>
        </div>
        
        {/* Status details section */}
        {statusInfo.details && (
          <div className="text-xs text-gray-600 mt-1">
            {statusInfo.details}
          </div>
        )}
        
        {/* Timestamp information */}
        {formattedTimestamp && (
          <div className="text-xs text-gray-500 mt-1">
            Last updated: {formattedTimestamp}
          </div>
        )}
        
        {/* Swap offer information */}
        {slot.SwapRequested === 'yes' ? (
          <div className="flex flex-col gap-1 mb-2">
            <div className="text-xs text-blue-900">
              Wants to swap for: <b>{slot.RequestedDate} / {slot.RequestedTime}</b>
            </div>
          </div>
        ) : slot.Status === 'offered' && (
          <Badge className="bg-yellow-200 text-yellow-900 mb-2">Up For Grabs</Badge>
        )}
        
        {/* Action buttons for owners */}
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
        
        {/* Recall button for owners */}
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
        
        {/* Claim button for non-owners, only for offered slots */}
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