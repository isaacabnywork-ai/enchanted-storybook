"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import gsap from "gsap";
import Image from "next/image";

interface PasswordGateProps {
  password: string;
  onSuccess: () => void;
}

export default function PasswordGate({
  password,
  onSuccess,
}: PasswordGateProps) {
  const [value, setValue] = useState("");
  const [error, setError] = useState(false);
  const [unlocking, setUnlocking] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const sparklesRef = useRef<HTMLDivElement>(null);

  // Entrance animation
  useEffect(() => {
    if (!cardRef.current || !containerRef.current) return;

    gsap.fromTo(
      cardRef.current,
      { scale: 0.8, opacity: 0, y: 30 },
      { scale: 1, opacity: 1, y: 0, duration: 0.8, ease: "back.out(1.4)" }
    );

    // Focus input after animation
    setTimeout(() => inputRef.current?.focus(), 900);
  }, []);

  const createSparkles = useCallback(() => {
    if (!sparklesRef.current) return;
    const container = sparklesRef.current;

    for (let i = 0; i < 20; i++) {
      const sparkle = document.createElement("div");
      sparkle.textContent = ["✦", "✧", "⋆", "✨", "🌸"][
        Math.floor(Math.random() * 5)
      ];
      sparkle.style.position = "absolute";
      sparkle.style.left = "50%";
      sparkle.style.top = "50%";
      sparkle.style.fontSize = `${10 + Math.random() * 16}px`;
      sparkle.style.pointerEvents = "none";
      container.appendChild(sparkle);

      const angle = (Math.PI * 2 * i) / 20;
      const distance = 80 + Math.random() * 120;

      gsap.fromTo(
        sparkle,
        { opacity: 1, scale: 0, x: 0, y: 0 },
        {
          opacity: 0,
          scale: 1.5,
          x: Math.cos(angle) * distance,
          y: Math.sin(angle) * distance,
          duration: 0.8 + Math.random() * 0.4,
          ease: "power2.out",
          onComplete: () => sparkle.remove(),
        }
      );
    }
  }, []);

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();

      if (value.toLowerCase().trim() === password.toLowerCase().trim()) {
        setUnlocking(true);
        createSparkles();

        // Success animation
        if (cardRef.current) {
          gsap.to(cardRef.current, {
            scale: 1.05,
            duration: 0.3,
            ease: "power2.out",
            onComplete: () => {
              gsap.to(containerRef.current, {
                opacity: 0,
                scale: 1.1,
                duration: 0.5,
                ease: "power2.in",
                onComplete: onSuccess,
              });
            },
          });
        }
      } else {
        setError(true);
        // Shake animation
        if (cardRef.current) {
          const shakeTl = gsap.timeline({
            onComplete: () => setError(false),
          });
          shakeTl
            .to(cardRef.current, { x: -8, duration: 0.06, ease: "power2.out" })
            .to(cardRef.current, { x: 8, duration: 0.06, ease: "power2.out" })
            .to(cardRef.current, { x: -6, duration: 0.06, ease: "power2.out" })
            .to(cardRef.current, { x: 6, duration: 0.06, ease: "power2.out" })
            .to(cardRef.current, { x: -3, duration: 0.06, ease: "power2.out" })
            .to(cardRef.current, { x: 3, duration: 0.06, ease: "power2.out" })
            .to(cardRef.current, { x: 0, duration: 0.06, ease: "power2.out" });
        }
        setValue("");
        inputRef.current?.focus();
      }
    },
    [value, password, onSuccess, createSparkles]
  );

  return (
    <div
      ref={containerRef}
      id="password-gate"
      className="fixed inset-0 flex items-center justify-center z-50"
    >
      {/* Background image */}
      <Image
        src="/images/password_bg.png"
        alt=""
        fill
        className="object-cover"
        priority
        quality={90}
      />

      {/* Subtle animated gradient overlay */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse at 50% 50%, rgba(254,249,244,0.3) 0%, rgba(248,232,224,0.5) 100%)",
        }}
      />

      {/* Sparkle container */}
      <div
        ref={sparklesRef}
        className="absolute inset-0 pointer-events-none z-20"
      />

      {/* Gate card */}
      <div
        ref={cardRef}
        className="relative z-10 w-[340px] max-w-[90vw] px-8 py-10 rounded-2xl glass-card text-center"
        style={{ opacity: 0 }}
      >
        {/* Ornamental top */}
        <div className="flex justify-center mb-2 text-gold text-2xl animate-gentle-pulse select-none">
          ✦ ✧ ✦
        </div>

        {/* Decorative rose */}
        <div className="text-4xl mb-3 select-none">🌹</div>

        {/* Title */}
        <h1
          className="text-2xl mb-1 text-ink tracking-wide"
          style={{ fontFamily: "var(--font-heading)", fontWeight: 600 }}
        >
          Our Enchanted Tale
        </h1>

        {/* Subtitle */}
        <p
          className="text-ink-faint text-sm mb-6"
          style={{ fontFamily: "var(--font-handwriting)" }}
        >
          Speak the word to enter...
        </p>

        {/* Divider */}
        <div className="flex items-center gap-3 mb-6">
          <div className="flex-1 h-px bg-gradient-to-r from-transparent via-gold-light to-transparent" />
          <span className="text-gold text-xs select-none">✧</span>
          <div className="flex-1 h-px bg-gradient-to-r from-transparent via-gold-light to-transparent" />
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit}>
          <input
            ref={inputRef}
            id="password-input"
            type="password"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder="Enter the magic word"
            disabled={unlocking}
            autoComplete="off"
            className={`
              w-full px-4 py-3 rounded-xl text-center text-ink
              bg-white/60 border transition-all duration-300 outline-none
              placeholder:text-ink-faint/50
              focus:ring-2 focus:ring-gold-light/50 focus:border-gold
              disabled:opacity-50
              ${error ? "border-rose-dark" : "border-gold-light/40"}
            `}
            style={{ fontFamily: "var(--font-body)", fontSize: "15px" }}
          />

          {error && (
            <p
              className="text-rose-deep text-xs mt-2 animate-fade-in"
              style={{ fontFamily: "var(--font-body)" }}
            >
              Not quite... try again ✦
            </p>
          )}

          <button
            id="password-submit"
            type="submit"
            disabled={unlocking || !value}
            className="
              mt-5 w-full py-3 rounded-xl text-sm font-medium
              bg-gradient-to-r from-gold-light via-gold to-gold-light
              text-white tracking-wider uppercase
              transition-all duration-300
              hover:shadow-glow hover:scale-[1.02]
              active:scale-[0.98]
              disabled:opacity-40 disabled:hover:scale-100 disabled:hover:shadow-none
            "
            style={{
              fontFamily: "var(--font-heading)",
              letterSpacing: "0.15em",
            }}
          >
            {unlocking ? "✨ Opening..." : "Enter the Story"}
          </button>
        </form>

        {/* Bottom ornament */}
        <div className="flex justify-center mt-6 text-gold-light text-lg select-none">
          ❦
        </div>
      </div>

      {/* Floating decorative elements */}
      <div className="absolute top-[10%] left-[15%] text-2xl animate-float select-none opacity-30">
        ✧
      </div>
      <div
        className="absolute top-[20%] right-[12%] text-xl select-none opacity-25"
        style={{ animation: "float 4s ease-in-out infinite 1s" }}
      >
        ✦
      </div>
      <div
        className="absolute bottom-[15%] left-[20%] text-lg select-none opacity-20"
        style={{ animation: "float 3.5s ease-in-out infinite 0.5s" }}
      >
        ⋆
      </div>
      <div
        className="absolute bottom-[25%] right-[18%] text-2xl select-none opacity-20"
        style={{ animation: "float 5s ease-in-out infinite 2s" }}
      >
        🌸
      </div>
    </div>
  );
}
