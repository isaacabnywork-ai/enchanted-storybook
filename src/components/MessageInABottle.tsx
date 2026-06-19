"use client";

import { useEffect, useRef, useState } from "react";
import gsap from "gsap";


interface DailyNote {
  id: string;
  date: string;
  message: string;
}

interface MessageInABottleProps {
  appData: any;
}

export default function MessageInABottle({ appData }: MessageInABottleProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const bottleRef = useRef<HTMLDivElement>(null);
  const corkRef = useRef<HTMLDivElement>(null);
  const parchmentRef = useRef<HTMLDivElement>(null);
  
  const [isOpen, setIsOpen] = useState(false);
  const [notes, setNotes] = useState<DailyNote[]>(appData.dailyNotes || []);
  const [newMessage, setNewMessage] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    // Gentle bobbing animation for the bottle on the waves
    if (!isOpen && bottleRef.current) {
      gsap.to(bottleRef.current, {
        y: -15,
        rotation: 3,
        duration: 2,
        repeat: -1,
        yoyo: true,
        ease: "sine.inOut"
      });
    }
    
    // Entrance animation
    if (containerRef.current) {
      gsap.fromTo(containerRef.current,
        { opacity: 0, scale: 0.9 },
        { opacity: 1, scale: 1, duration: 1, ease: "power3.out" }
      );
    }
  }, [isOpen]);

  const handleOpenBottle = () => {
    if (isOpen || !bottleRef.current || !corkRef.current || !parchmentRef.current) return;

    const tl = gsap.timeline({
      onComplete: () => setIsOpen(true)
    });

    // Pop the cork
    tl.to(corkRef.current, {
      y: -100,
      rotation: 120,
      x: 50,
      opacity: 0,
      duration: 0.6,
      ease: "power2.out"
    });

    // Bring bottle down slightly
    tl.to(bottleRef.current, {
      y: 100,
      opacity: 0,
      scale: 0.8,
      duration: 0.5,
      ease: "power2.in"
    }, "-=0.3");

    // Unroll parchment
    tl.fromTo(parchmentRef.current,
      { y: 150, opacity: 0, height: 0 },
      { y: 0, opacity: 1, height: "auto", duration: 0.8, ease: "back.out(1.2)" },
      "-=0.1"
    );
  };

  const handleSave = async () => {
    if (!newMessage.trim()) return;
    setIsSaving(true);
    
    const newNote: DailyNote = {
      id: `note-${Date.now()}`,
      date: new Date().toISOString(),
      message: newMessage.trim()
    };
    
    const updatedNotes = [newNote, ...notes];

    try {
      const res = await fetch("/api/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          target: "appData",
          data: { ...appData, dailyNotes: updatedNotes }
        })
      });

      if (res.ok) {
        setNotes(updatedNotes);
        setNewMessage("");
      } else {
        alert("Failed to save note.");
      }
    } catch (error) {
      console.error(error);
      alert("Error saving note.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div ref={containerRef} className="absolute inset-0 flex flex-col items-center justify-center p-6 overflow-hidden">
      {/* Ocean Background Gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent to-[#d1e8e2]/40 -z-10" />

      {/* Title */}
      <h2 className="absolute top-10 text-3xl text-ink font-semibold animate-fade-in-up" style={{ fontFamily: "var(--font-heading)" }}>
        Message in a Bottle
      </h2>

      {/* The Bottle (Interactive) */}
      {!isOpen && (
        <div 
          className="relative cursor-pointer group mt-20"
          onClick={handleOpenBottle}
        >
          <div ref={bottleRef} className="relative w-32 h-64 flex flex-col items-center drop-shadow-xl">
            {/* Cork */}
            <div ref={corkRef} className="w-8 h-10 bg-[#8b5a2b] rounded-t-md mb-[-5px] z-20 border-b-2 border-black/20" />
            
            {/* Bottle Neck */}
            <div className="w-10 h-16 bg-[#e0f7fa]/60 backdrop-blur-md rounded-t-lg z-10 border border-white/40 border-b-0" />
            
            {/* Bottle Body */}
            <div className="w-32 h-40 bg-[#e0f7fa]/60 backdrop-blur-md rounded-b-3xl rounded-t-3xl border border-white/40 shadow-[inset_0_0_20px_rgba(255,255,255,0.5)] overflow-hidden relative flex justify-center items-center">
               {/* Rolled Paper Inside */}
               <div className="w-20 h-28 bg-[#f5ece3] rounded shadow-inner rotate-6 opacity-90 border-r-2 border-[#d4a574]/40" />
               {/* Glass Highlight */}
               <div className="absolute left-2 top-2 bottom-6 w-3 bg-white/40 rounded-full blur-[1px]" />
            </div>
            
            <div className="mt-6 text-sm text-ink-light font-medium tracking-widest uppercase opacity-0 group-hover:opacity-100 transition-opacity" style={{ fontFamily: "var(--font-heading)" }}>
              Tap to Open
            </div>
          </div>
        </div>
      )}

      {/* The Opened Parchment */}
      <div 
        ref={parchmentRef}
        className={`w-full max-w-md bg-parchment shadow-2xl rounded p-8 border border-gold/20 flex flex-col max-h-[80vh] ${!isOpen ? 'hidden' : 'flex'}`}
        style={{ backgroundImage: "var(--color-parchment)" }}
      >
        <div className="text-center mb-6 border-b border-gold/30 pb-4">
          <h3 className="text-2xl text-rose-deep" style={{ fontFamily: "var(--font-heading)" }}>Daily Thoughts</h3>
          <p className="text-xs text-ink-faint mt-1 uppercase tracking-widest">Uncorked Memories</p>
        </div>

        {/* Add New Note */}
        <div className="mb-6 bg-cream/50 p-4 rounded border border-gold/20">
          <textarea
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Write a thought for today..."
            className="w-full bg-transparent border-b border-gold/30 focus:border-gold outline-none resize-none mb-3 text-sm text-ink"
            rows={3}
            style={{ fontFamily: "var(--font-body)" }}
          />
          <button
            onClick={handleSave}
            disabled={isSaving || !newMessage.trim()}
            className="w-full py-2 bg-rose/10 hover:bg-rose/20 text-rose-deep rounded transition-colors text-sm font-semibold disabled:opacity-50"
          >
            {isSaving ? "Tossing into sea..." : "Save Note"}
          </button>
        </div>

        {/* Scrollable Note History */}
        <div className="flex-1 overflow-y-auto timeline-scroll space-y-6 pr-2">
          {notes.map(note => {
            const dateObj = new Date(note.date);
            const formattedDate = dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
            return (
              <div key={note.id} className="relative">
                <span className="text-[10px] uppercase text-gold-dark font-semibold tracking-wider" style={{ fontFamily: "var(--font-heading)" }}>
                  {formattedDate}
                </span>
                <p className="text-sm text-ink leading-relaxed mt-1" style={{ fontFamily: "var(--font-handwriting)", fontSize: '1.1rem' }}>
                  "{note.message}"
                </p>
                <div className="mt-3 w-12 h-px bg-gold-light/40" />
              </div>
            );
          })}
          {notes.length === 0 && (
            <p className="text-center text-ink-faint text-sm italic py-4">No notes found in the bottle yet.</p>
          )}
        </div>
      </div>
    </div>
  );
}
