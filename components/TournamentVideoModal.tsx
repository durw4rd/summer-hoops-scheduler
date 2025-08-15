"use client";

import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Play } from "lucide-react";

interface TournamentVideoModalProps {
  videoId: string;
  title?: string;
  isAttendingTournament: boolean;
  onDontShowAgain: () => void;
}

export default function TournamentVideoModal({ 
  videoId,
  title = "Summer Hoops @het Marnix mini-tournament official draft",
  isAttendingTournament,
  onDontShowAgain
}: TournamentVideoModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [hasShown, setHasShown] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);

  // Auto-open modal for tournament attendees
  useEffect(() => {
    if (isAttendingTournament && !hasShown) {
      // Small delay to ensure the page is fully loaded
      const timer = setTimeout(() => {
        setIsOpen(true);
        setHasShown(true);
      }, 1000);

      return () => clearTimeout(timer);
    }
  }, [isAttendingTournament, hasShown]);

  const handleClose = () => {
    setIsOpen(false);
  };

  const handleDontShowAgain = () => {
    onDontShowAgain();
    setIsOpen(false);
  };

  const handlePlayVideo = () => {
    setIsPlaying(true);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="max-w-5xl w-[95vw] p-0 bg-gradient-to-br from-yellow-300 via-orange-200 to-yellow-100 border-yellow-500 text-yellow-900 shadow-2xl ring-4 ring-yellow-400">
        <DialogHeader className="p-6 bg-gradient-to-r from-yellow-400 to-orange-500 text-center">
          <DialogTitle className="text-2xl font-extrabold flex items-center justify-center gap-3 text-white">
            <span role="img" aria-label="trophy">🏆</span>
            <span className="drop-shadow-lg">TOURNAMENT TEAMS ANNOUNCEMENT</span>
            <span role="img" aria-label="fire">🔥</span>
          </DialogTitle>
          <DialogDescription className="text-lg mt-4 font-semibold text-white">
            <span className="block">Yo baller! The teams are set and ready to battle!</span>
            <span className="block mt-2 text-yellow-100">Watch the official draft announcement below</span>
          </DialogDescription>
        </DialogHeader>
        
        {/* Video Container */}
        <div className="p-4">
          <div className="relative w-full rounded-lg overflow-hidden shadow-2xl border-4 border-yellow-400" style={{ paddingBottom: '56.6%' }}>
            <iframe
              key={`${videoId}-${isPlaying}`}
              src={`https://player.vimeo.com/video/${videoId}?muted=0&autopause=1&app_id=58479&autoplay=${isPlaying ? 1 : 0}&fullscreen=1`}
              title={title}
              className="absolute top-0 left-0 w-full h-full"
              allow="autoplay; fullscreen; picture-in-picture; clipboard-write; encrypted-media; web-share"
              referrerPolicy="strict-origin-when-cross-origin"
            />
            {/* Play Button Overlay - Only show when not playing */}
            {!isPlaying && (
              <div 
                className="absolute inset-0 flex items-center justify-center bg-black/20 hover:bg-black/10 transition-colors cursor-pointer group"
                onClick={handlePlayVideo}
              >
                <div className="bg-yellow-500 hover:bg-yellow-600 text-white rounded-full p-4 shadow-lg transform group-hover:scale-110 transition-all duration-200">
                  <Play className="w-8 h-8" />
                </div>
              </div>
            )}
          </div>
        </div>
        
        {/* Action Buttons */}
        <div className="p-6 flex flex-col gap-3 items-center">
          <Button
            onClick={handleClose}
            className="bg-yellow-500 hover:bg-yellow-600 text-white font-extrabold py-3 px-8 rounded-full shadow-xl text-lg tracking-wider uppercase transition border-2 border-yellow-700 flex items-center gap-2"
          >
            <Play className="w-5 h-5" />
            Let's Get Ready to Ball!
          </Button>
          <button
            className="text-sm text-yellow-800 underline hover:text-orange-700 transition-colors"
            onClick={handleDontShowAgain}
          >
            Don't show this again
          </button>
        </div>
        
        {/* Festive Footer */}
        <div className="p-4 bg-gradient-to-r from-yellow-100 to-orange-100 text-center border-t-2 border-yellow-300">
          <p className="text-sm font-semibold text-yellow-800">
            <span role="img" aria-label="basketball">🏀</span>
            The battle lines are drawn! Time to bring the heat! 
            <span role="img" aria-label="crown">👑</span>
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
