"use client";

import { useState, useEffect, useRef } from "react";
import gsap from "gsap";

export default function SoundscapeToggle() {
  const [isPlaying, setIsPlaying] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    if (isPlaying) {
      if (audioRef.current) {
        audioRef.current.play().catch(e => console.error("Audio play failed:", e));
      }
      // Animate the button to show it's playing
      gsap.to(buttonRef.current, {
        scale: 1.1,
        boxShadow: "0 0 20px rgba(212, 165, 116, 0.4)",
        repeat: -1,
        yoyo: true,
        duration: 1.5,
        ease: "sine.inOut"
      });
    } else {
      if (audioRef.current) {
        audioRef.current.pause();
      }
      gsap.killTweensOf(buttonRef.current);
      gsap.to(buttonRef.current, {
        scale: 1,
        boxShadow: "0 4px 12px rgba(90, 62, 54, 0.1)",
        duration: 0.3
      });
    }
  }, [isPlaying]);

  return (
    <>
      <button
        ref={buttonRef}
        onClick={() => setIsPlaying(!isPlaying)}
        className={`fixed bottom-6 right-6 z-40 w-12 h-12 rounded-full glass-card flex items-center justify-center transition-colors duration-300 ${
          isPlaying ? "text-gold" : "text-ink-faint hover:text-gold"
        }`}
        aria-label={isPlaying ? "Pause music" : "Play music"}
        title="Ambient Soundscape: A Thousand Years"
      >
        {isPlaying ? (
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
            <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"></path>
          </svg>
        ) : (
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
            <line x1="23" y1="9" x2="17" y2="15"></line>
            <line x1="17" y1="9" x2="23" y2="15"></line>
          </svg>
        )}
      </button>

      {/* Native HTML5 Audio Player for "A Thousand Years" */}
      <audio
        ref={audioRef}
        src="/Christina Perri - A Thousand Years (PianoCello Cover).mp3"
        loop
        preload="auto"
        className="hidden"
      />
    </>
  );
}
