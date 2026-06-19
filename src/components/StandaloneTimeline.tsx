"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import storybookData from "@/data/storybookData.json";

export default function StandaloneTimeline() {
  const containerRef = useRef<HTMLDivElement>(null);

  // Extract timeline events from the storybook data
  const timelinePage = storybookData.pages.find((p) => p.type === "timeline");
  const events = timelinePage?.events || [];

  useEffect(() => {
    if (containerRef.current) {
      const items = containerRef.current.querySelectorAll(".timeline-node");
      gsap.fromTo(
        items,
        { opacity: 0, x: -30 },
        { opacity: 1, x: 0, stagger: 0.15, duration: 0.8, ease: "power3.out" }
      );
    }
  }, []);

  return (
    <div className="w-full h-full bg-cream overflow-y-auto p-8 md:p-12 pb-32">
      <div className="max-w-4xl mx-auto" ref={containerRef}>
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl text-rose-deep mb-4" style={{ fontFamily: "var(--font-heading)" }}>
            Our Journey
          </h1>
          <div className="flex items-center justify-center gap-4">
            <div className="w-16 h-px bg-gold-light" />
            <span className="text-gold text-xl">🧭</span>
            <div className="w-16 h-px bg-gold-light" />
          </div>
        </div>

        <div className="relative pl-8 md:pl-0">
          {/* Main Vertical Line */}
          <div className="absolute left-[39px] md:left-1/2 top-0 bottom-0 w-[2px] -translate-x-1/2 bg-gradient-to-b from-transparent via-gold-light to-transparent" />

          {events.map((event, index) => {
            const isEven = index % 2 === 0;
            return (
              <div key={index} className="timeline-node relative flex items-center justify-between mb-16 last:mb-0 w-full md:flex-row flex-col">
                
                {/* Desktop Left Side */}
                <div className={`hidden md:block w-5/12 text-right pr-12 ${!isEven ? 'opacity-0' : ''}`}>
                  {isEven && (
                    <>
                      <span className="text-sm tracking-widest text-gold-dark uppercase" style={{ fontFamily: "var(--font-heading)" }}>
                        {event.year}
                      </span>
                      <h3 className="text-2xl text-rose-deep mt-2 mb-3" style={{ fontFamily: "var(--font-heading)" }}>
                        {event.title}
                      </h3>
                      <p className="text-ink-light text-base leading-relaxed" style={{ fontFamily: "var(--font-body)" }}>
                        {event.description}
                      </p>
                    </>
                  )}
                </div>

                {/* Mobile / Tablet View (Left Aligned) & Desktop Center Node */}
                <div className="absolute md:static left-0 md:left-auto md:w-2/12 flex justify-center z-10">
                  <div className="w-14 h-14 rounded-full bg-cream border-4 border-gold-light flex items-center justify-center text-2xl shadow-lg hover:scale-110 transition-transform duration-300">
                    {event.icon}
                  </div>
                </div>

                {/* Desktop Right Side */}
                <div className={`hidden md:block w-5/12 pl-12 ${isEven ? 'opacity-0' : ''}`}>
                  {!isEven && (
                    <>
                      <span className="text-sm tracking-widest text-gold-dark uppercase" style={{ fontFamily: "var(--font-heading)" }}>
                        {event.year}
                      </span>
                      <h3 className="text-2xl text-rose-deep mt-2 mb-3" style={{ fontFamily: "var(--font-heading)" }}>
                        {event.title}
                      </h3>
                      <p className="text-ink-light text-base leading-relaxed" style={{ fontFamily: "var(--font-body)" }}>
                        {event.description}
                      </p>
                    </>
                  )}
                </div>

                {/* Mobile Content (always visible, always on the right of the line) */}
                <div className="md:hidden w-full pl-20 pb-8">
                  <span className="text-sm tracking-widest text-gold-dark uppercase" style={{ fontFamily: "var(--font-heading)" }}>
                    {event.year}
                  </span>
                  <h3 className="text-2xl text-rose-deep mt-1 mb-2" style={{ fontFamily: "var(--font-heading)" }}>
                    {event.title}
                  </h3>
                  <p className="text-ink-light text-base leading-relaxed" style={{ fontFamily: "var(--font-body)" }}>
                    {event.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
