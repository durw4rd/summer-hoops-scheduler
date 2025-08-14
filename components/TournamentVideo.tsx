"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Play, X } from "lucide-react";

interface TournamentVideoProps {
  videoId?: string; // YouTube video ID
  title?: string;
}

export default function TournamentVideo({ 
  videoId = "dQw4w9WgXcQ", // Default video ID - replace with actual tournament announcement video
  title = "Tournament Team Announcement"
}: TournamentVideoProps) {
  const [isOpen, setIsOpen] = useState(false);

  const handleOpenVideo = () => {
    setIsOpen(true);
  };

  const handleCloseVideo = () => {
    setIsOpen(false);
  };

  return (
    <div className="mt-4">
      {/* Video Button */}
      <Button
        onClick={handleOpenVideo}
        className="w-full bg-gradient-to-r from-yellow-400 to-orange-500 hover:from-yellow-500 hover:to-orange-600 text-white font-bold py-4 px-6 rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 border-2 border-yellow-600 group"
      >
        <div className="flex items-center justify-center gap-3">
          <div className="relative">
            <Play className="w-6 h-6 group-hover:scale-110 transition-transform duration-200" />
            <div className="absolute inset-0 bg-white/20 rounded-full animate-ping"></div>
          </div>
          <span className="text-lg">
            <span role="img" aria-label="trophy">🏆</span>
            Watch Team Announcement
            <span role="img" aria-label="fire">🔥</span>
          </span>
        </div>
      </Button>

      {/* Video Modal */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-4xl w-[90vw] p-0 bg-black border-2 border-yellow-400 shadow-2xl">
          <DialogHeader className="p-4 bg-gradient-to-r from-yellow-400 to-orange-500">
            <div className="flex items-center justify-between">
              <DialogTitle className="text-white font-bold flex items-center gap-2">
                <span role="img" aria-label="trophy">🏆</span>
                {title}
                <span role="img" aria-label="fire">🔥</span>
              </DialogTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleCloseVideo}
                className="text-white hover:bg-white/20"
              >
                <X className="w-5 h-5" />
              </Button>
            </div>
          </DialogHeader>
          
          <div className="relative w-full" style={{ paddingBottom: '56.25%' }}>
            <iframe
              src={`https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0`}
              title={title}
              className="absolute top-0 left-0 w-full h-full"
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
          
          <div className="p-4 bg-gradient-to-r from-yellow-100 to-orange-100 text-center">
            <p className="text-sm font-semibold text-yellow-800">
              <span role="img" aria-label="basketball">🏀</span>
              The teams are ready to battle! 
              <span role="img" aria-label="crown">👑</span>
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
