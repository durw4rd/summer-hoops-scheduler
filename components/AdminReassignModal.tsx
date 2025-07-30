import React, { useState, useMemo, useRef, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Shield, UserCheck } from "lucide-react";

interface AdminReassignModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sessionInfo: { date: string; time: string; currentPlayer: string };
  userMapping: Record<string, { email: string; color?: string }>;
  onAdminReassign: (newPlayer: string) => Promise<void>;
  loading: boolean;
  error: string | null;
  selectedPlayer: string;
  warn: boolean;
  onConfirm: () => void;
  onPlayerSelect: (player: string) => void;
}

const AdminReassignModal: React.FC<AdminReassignModalProps> = ({
  open,
  onOpenChange,
  sessionInfo,
  userMapping,
  onAdminReassign,
  loading,
  error,
  selectedPlayer,
  warn,
  onConfirm,
  onPlayerSelect,
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
    // Only update the selected player, don't call reassignment yet
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
    await onAdminReassign(selectedPlayer);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-red-600" />
            Admin Reassignment
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="space-y-3">
            <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
              <Shield className="w-4 h-4 text-red-600" />
              <span className="text-sm text-red-800 font-medium">
                Admin Action: Reassign slot for <b>{sessionInfo.date} / {sessionInfo.time}</b>
              </span>
            </div>
            
            <div className="text-sm text-gray-700">
              Reassign slot from <b className="text-red-600">{sessionInfo.currentPlayer}</b> to:
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
                      className={`p-2 cursor-pointer hover:bg-red-100 ${selectedPlayer === name ? "bg-red-200" : ""}`}
                      onClick={() => {
                        setDropdownOpen(false);
                        // Only update selected player, don't call reassignment
                        setSearch(name);
                        onPlayerSelect(name);
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
              <div className="flex items-center gap-2 mt-1 text-sm text-green-700">
                <UserCheck className="w-4 h-4" />
                <span>Selected: <b>{selectedPlayer}</b></span>
              </div>
            )}
            
            {warn && selectedPlayer && (
              <div className="mt-2 text-sm text-orange-700 bg-orange-100 border border-orange-300 rounded p-3">
                <div className="flex items-center gap-2 mb-2">
                  <Shield className="w-4 h-4" />
                  <span className="font-medium">Admin Warning</span>
                </div>
                <p>
                  <b>{selectedPlayer}</b> is already in this session. This admin reassignment will add them again.
                </p>
                <div className="mt-3 flex justify-end">
                  <Button type="button" size="sm" variant="destructive" onClick={onConfirm} disabled={loading}>
                    Confirm Admin Reassignment
                  </Button>
                </div>
              </div>
            )}
          </div>
          
          {error && (
            <div className="text-red-600 text-sm text-center p-2 bg-red-50 border border-red-200 rounded">
              {error}
            </div>
          )}
          
          <DialogFooter>
            <Button type="submit" disabled={!selectedPlayer || loading || warn} className="bg-red-600 hover:bg-red-700">
              {loading ? "Processing..." : "Confirm Admin Reassignment"}
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

export default AdminReassignModal; 