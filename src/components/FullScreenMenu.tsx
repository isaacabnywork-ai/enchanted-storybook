"use client";

import { useEffect, useRef, useState } from "react";
import gsap from "gsap";

export type AppView = "storybook" | "gallery" | "memorybook" | "dates" | "bottle";

interface FullScreenMenuProps {
  currentView: AppView;
  onChangeView: (view: AppView) => void;
}

const MENU_ITEMS: { id: AppView; label: string; icon: string }[] = [
  { id: "storybook", label: "Our Story", icon: "📖" },
  { id: "gallery", label: "Photo Gallery", icon: "✨" },
  { id: "memorybook", label: "Memory Book", icon: "📔" },
  { id: "dates", label: "Special Dates", icon: "🗓" },
  { id: "bottle", label: "Message in a Bottle", icon: "🍾" },
];

export default function FullScreenMenu({ currentView, onChangeView }: FullScreenMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isNight, setIsNight] = useState(false);
  const overlayRef = useRef<HTMLDivElement>(null);
  const itemsRef = useRef<(HTMLButtonElement | null)[]>([]);

  useEffect(() => {
    if (isOpen && overlayRef.current) {
      gsap.fromTo(
        overlayRef.current,
        { opacity: 0 },
        { opacity: 1, duration: 0.4, ease: "power2.out" }
      );
      
      gsap.fromTo(
        itemsRef.current,
        { opacity: 0, y: 30 },
        { opacity: 1, y: 0, stagger: 0.1, duration: 0.5, ease: "back.out(1.2)", delay: 0.2 }
      );
    } else if (!isOpen && overlayRef.current) {
      gsap.to(overlayRef.current, {
        opacity: 0,
        duration: 0.3,
        ease: "power2.in",
        onComplete: () => {
          gsap.set(overlayRef.current, { display: "none" }); // Wait, React conditional rendering handles display
        }
      });
    }
  }, [isOpen]);

  const handleSelect = (view: AppView) => {
    setIsOpen(false);
    setTimeout(() => {
      onChangeView(view);
    }, 300); // Wait for fade out
  };

  const toggleTheme = () => {
    setIsNight(!isNight);
    if (!isNight) {
      document.documentElement.classList.add("theme-night");
    } else {
      document.documentElement.classList.remove("theme-night");
    }
  };

  return (
    <>
      {/* Menu Toggle Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed top-6 right-6 z-40 w-12 h-12 rounded-full glass-card flex items-center justify-center text-gold transition-all duration-300 hover:scale-110 active:scale-95 shadow-md"
        aria-label="Open Menu"
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="3" y1="12" x2="21" y2="12"></line>
          <line x1="3" y1="6" x2="21" y2="6"></line>
          <line x1="3" y1="18" x2="21" y2="18"></line>
        </svg>
      </button>

      {/* Full Screen Overlay */}
      {isOpen && (
        <div
          ref={overlayRef}
          className="fixed inset-0 z-50 flex flex-col items-center justify-center"
          style={{
            background: "rgba(254,249,244,0.85)", // Cream with opacity
            backdropFilter: "blur(12px)",
            WebkitBackdropFilter: "blur(12px)",
          }}
        >
          {/* Close Button */}
          <button
            onClick={() => setIsOpen(false)}
            className="absolute top-6 right-6 w-12 h-12 rounded-full flex items-center justify-center text-rose-deep hover:scale-110 transition-transform"
            aria-label="Close Menu"
          >
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>

          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            className="absolute top-6 left-6 w-12 h-12 rounded-full flex items-center justify-center text-gold hover:scale-110 transition-transform"
            aria-label="Toggle Theme"
          >
            {isNight ? "☀️" : "🌙"}
          </button>

          {/* Menu Items */}
          <nav className="flex flex-col gap-6 items-center">
            {MENU_ITEMS.map((item, index) => (
              <button
                key={item.id}
                ref={(el) => { itemsRef.current[index] = el; }}
                onClick={() => handleSelect(item.id)}
                className={`flex items-center gap-4 px-8 py-4 rounded-2xl transition-all duration-300 ${
                  currentView === item.id 
                    ? "bg-rose-deep/10 text-rose-deep" 
                    : "text-ink hover:bg-gold-light/20 hover:text-gold-dark"
                }`}
              >
                <span className="text-2xl">{item.icon}</span>
                <span 
                  className="text-3xl tracking-wide" 
                  style={{ fontFamily: "var(--font-heading)" }}
                >
                  {item.label}
                </span>
                {currentView === item.id && (
                  <span className="text-gold text-lg absolute -left-4 animate-pulse">✦</span>
                )}
              </button>
            ))}
          </nav>
        </div>
      )}
    </>
  );
}
