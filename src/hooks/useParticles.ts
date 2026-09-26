"use client";

import { useEffect, useRef, useCallback } from "react";
import gsap from "gsap";

interface Particle {
  el: HTMLDivElement;
  type: "star" | "sparkle" | "petal";
}

const PARTICLE_CHARS: Record<string, string[]> = {
  star: ["✦", "✧", "⋆", "✵"],
  sparkle: ["✨", "·", "•", "°"],
  petal: ["🌸", "✿", "❀", "🌷"],
};

const MAX_PARTICLES = 25;

export function useParticles(active: boolean = true) {
  const containerRef = useRef<HTMLDivElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const createParticle = useCallback((startX?: number, startY?: number, isBurst?: boolean) => {
    if (!containerRef.current || particlesRef.current.length >= MAX_PARTICLES) return;

    const container = containerRef.current;

    const types: Array<"star" | "sparkle" | "petal"> = [
      "star",
      "sparkle",
      "petal",
    ];
    // Favor sparkles and stars for bursts
    const type = isBurst 
      ? (Math.random() > 0.3 ? "sparkle" : "star") 
      : types[Math.floor(Math.random() * types.length)];
      
    const chars = PARTICLE_CHARS[type];
    const char = chars[Math.floor(Math.random() * chars.length)];

    const el = document.createElement("div");
    el.textContent = char;
    el.style.position = "absolute";
    el.style.pointerEvents = "none";
    el.style.fontSize = `${8 + Math.random() * (isBurst ? 10 : 14)}px`;
    el.style.opacity = "0";
    el.style.zIndex = "10";
    el.style.willChange = "transform, opacity";
    el.style.color = isBurst ? "var(--color-gold-light)" : "inherit";

    const x = startX !== undefined ? startX : Math.random() * 100;
    const y = startY !== undefined ? startY : Math.random() * 100;
    el.style.left = `${x}%`;
    el.style.top = `${y}%`;

    container.appendChild(el);
    const particle: Particle = { el, type };
    particlesRef.current.push(particle);

    let driftX = (Math.random() - 0.5) * 80;
    let driftY = -30 - Math.random() * 60;
    
    if (isBurst) {
      // Explode outwards from center
      const angle = Math.random() * Math.PI * 2;
      const velocity = 50 + Math.random() * 100;
      driftX = Math.cos(angle) * velocity;
      driftY = Math.sin(angle) * velocity - 20; // Slight upward bias
    }

    const duration = isBurst ? (1 + Math.random() * 1.5) : (4 + Math.random() * 4);
    const rotation = (Math.random() - 0.5) * 360 * (isBurst ? 3 : 1);

    gsap.to(el, {
      x: driftX,
      y: driftY,
      rotation,
      opacity: isBurst ? 1 : 0.7,
      duration: duration * 0.2,
      ease: isBurst ? "power3.out" : "power2.out",
      onComplete: () => {
        gsap.to(el, {
          x: driftX * (isBurst ? 1.2 : 1.5),
          y: driftY * (isBurst ? 1.2 : 2),
          rotation: rotation * 2,
          opacity: 0,
          duration: duration * 0.8,
          ease: "power1.in",
          onComplete: () => {
            if (el.parentNode) {
              el.remove();
            }
            particlesRef.current = particlesRef.current.filter(
              (p) => p !== particle
            );
          },
        });
      },
    });
  }, []);

  const triggerBurst = useCallback(() => {
    if (!containerRef.current) return;
    
    // Create a burst of 10-15 particles in the center
    const burstCount = 10 + Math.floor(Math.random() * 6);
    for (let i = 0; i < burstCount; i++) {
      // Center of the screen
      createParticle(50, 50, true);
    }
  }, [createParticle]);

  useEffect(() => {
    if (!active || !containerRef.current) return;

    // Spawn ambient particles at intervals
    intervalRef.current = setInterval(() => createParticle(), 800);

    // Create a few initial particles
    for (let i = 0; i < 5; i++) {
      setTimeout(() => createParticle(), i * 200);
    }

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      particlesRef.current.forEach((p) => {
        gsap.killTweensOf(p.el);
        if (p.el.parentNode) p.el.remove();
      });
      particlesRef.current = [];
    };
  }, [active, createParticle]);

  return { containerRef, triggerBurst };
}
