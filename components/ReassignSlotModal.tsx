import React, { useState, useMemo, useRef, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface ReassignSlotModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sessionInfo: { date: string; time: string; currentPlayer: string };
  userMapping: Record<string, { email: string; color?: string }>;
  onReassign: (newPlayer: string) => Promise<void>;
  loading: boolean;
  error: string | null;
  selectedPlayer: string;
  warn: boolean;
  onConfirm: () => void;
}

const ReassignSlotModal: React.FC<ReassignSlotModalProps> = ({
  open,
  onOpenChange,
  sessionInfo,
  userMapping,
  onReassign,
  loading,
  error,
  selectedPlayer,
  warn,
  onConfirm,
}) => {
  const [search, setSearch] = useState("");
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // List of player names except the current player
  const playerNames = useMemo(
    () => Object.keys(userMapping).filter(name => name !== sessionInfo.currentPlayer),
    [userMapping, sessionInfo.currentPlayer]
  );

  // Filtered list based on search
  const filteredNames = useMemo(
    () => playerNames.filter(name => name.toLowerCase().includes(search.toLowerCase())),
    [playerNames, search]
  );

  // Keep input in sync with selectedPlayer
  useEffect(() => {
    if (selectedPlayer) setSearch(selectedPlayer);
  }, [selectedPlayer]);

  const handleSelect = (name: string) => {
    setSearch(name);
    setDropdownOpen(false);
    inputRef.current?.blur();
    // Do not call onReassign here; wait for button click
  };

  const handleInputFocus = () => {
    setDropdownOpen(true);
    setSearch("");
  };

  const handleClear = () => {
    setSearch("");
    setDropdownOpen(true);
    inputRef.current?.focus();
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
    setDropdownOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPlayer || warn) return;
    await onReassign(selectedPlayer);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Reassign Slot</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <div className="mb-2 text-sm text-gray-700">
              Reassign slot for <b>{sessionInfo.date} / {sessionInfo.time}</b> from <b>{sessionInfo.currentPlayer}</b> to:
            </div>
            <div className="relative">
              <Input
                ref={inputRef}
                placeholder="Search player..."
                value={selectedPlayer || search}
                onFocus={handleInputFocus}
                onChange={handleInputChange}
                disabled={loading}
                className="mb-2 pr-10"
                autoComplete="off"
              />
              {selectedPlayer && (
                <button
                  type="button"
                  className="absolute right-2 top-2 text-gray-400 hover:text-gray-700"
                  onClick={handleClear}
                  tabIndex={-1}
                >
                  ×
                </button>
              )}
              {dropdownOpen && filteredNames.length > 0 && (
                <div className="border rounded bg-white max-h-40 overflow-y-auto absolute w-full z-10">
                  {filteredNames.map(name => (
                    <div
                      key={name}
                      className={`p-2 cursor-pointer hover:bg-orange-100 ${selectedPlayer === name ? "bg-orange-200" : ""}`}
                      onClick={() => {
                        setDropdownOpen(false);
                        onReassign(name);
                      }}
                    >
                      {name}
                    </div>
                  ))}
                </div>
              )}
              {dropdownOpen && filteredNames.length === 0 && (
                <div className="border rounded bg-white max-h-40 overflow-y-auto absolute w-full z-10">
                  <div className="p-2 text-gray-400 text-sm">No players found</div>
                </div>
              )}
            </div>
            {selectedPlayer && (
              <div className="mt-1 text-sm text-green-700">Selected: <b>{selectedPlayer}</b></div>
            )}
            {warn && selectedPlayer && (
              <div className="mt-2 text-sm text-orange-700 bg-orange-100 border border-orange-300 rounded p-2">
                Warning: <b>{selectedPlayer}</b> is already in this session. Are you sure you want to reassign the slot to them?
                <div className="mt-2 flex justify-end">
                  <Button type="button" size="sm" variant="destructive" onClick={onConfirm} disabled={loading}>
                    Yes, reassign anyway
                  </Button>
                </div>
              </div>
            )}
          </div>
          {error && <div className="text-red-600 text-sm text-center">{error}</div>}
          <DialogFooter>
            <Button type="submit" disabled={!selectedPlayer || loading || warn}>
              {loading ? "Reassigning..." : "Confirm Reassignment"}
            </Button>
            <DialogClose asChild>
              <Button variant="outline" type="button">Cancel</Button>
            </DialogClose>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default ReassignSlotModal; 