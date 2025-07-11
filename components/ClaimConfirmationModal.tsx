import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import React from "react";

interface ClaimConfirmationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pendingSlot: any;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ClaimConfirmationModal({
  open,
  onOpenChange,
  pendingSlot,
  onConfirm,
  onCancel,
}: ClaimConfirmationModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Claim Additional Spot?</DialogTitle>
          <DialogDescription>
            You are already attending this session. Are you sure you want to claim an additional spot?
          </DialogDescription>
        </DialogHeader>
        <div className="flex justify-end gap-2 mt-4">
          <Button variant="outline" onClick={onCancel}>Cancel</Button>
          <Button variant="default" onClick={onConfirm}>
            Yes, claim anyway
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
} 