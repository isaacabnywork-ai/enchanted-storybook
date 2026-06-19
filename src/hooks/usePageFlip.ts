"use client";

import { useCallback, useRef, useState } from "react";
import gsap from "gsap";

interface UsePageFlipOptions {
  totalLeaves: number;
  onFlip?: (leafIndex: number, direction: "forward" | "backward") => void;
}

interface SwipeState {
  startX: number;
  startY: number;
  startTime: number;
  isTracking: boolean;
}

export function usePageFlip({ totalLeaves, onFlip }: UsePageFlipOptions) {
  const [flippedCount, setFlippedCount] = useState(0);
  const [isFlipping, setIsFlipping] = useState(false);
  const bookRef = useRef<HTMLDivElement>(null);
  const swipeRef = useRef<SwipeState>({
    startX: 0,
    startY: 0,
    startTime: 0,
    isTracking: false,
  });

  const FLIP_DURATION = 0.9;
  const SWIPE_THRESHOLD = 40;
  const VELOCITY_THRESHOLD = 0.25;

  const flipForward = useCallback(() => {
    if (isFlipping || flippedCount >= totalLeaves) return;

    const book = bookRef.current;
    if (!book) return;

    const leafIndex = flippedCount;
    const leafEl = book.querySelector(
      `[data-leaf="${leafIndex}"]`
    ) as HTMLElement;
    if (!leafEl) return;

    setIsFlipping(true);

    // Bring flipping leaf above everything
    gsap.set(leafEl, { zIndex: totalLeaves + 10 });

    const tl = gsap.timeline({
      onComplete: () => {
        gsap.set(leafEl, { zIndex: leafIndex + 1 });
        setFlippedCount((prev) => prev + 1);
        setIsFlipping(false);
        onFlip?.(leafIndex, "forward");
      },
    });

    // Main flip: rotate from 0 to -180 around the spine
    tl.to(leafEl, {
      rotateY: -180,
      duration: FLIP_DURATION,
      ease: "power2.inOut",
    });

    // Shadow overlay during flip
    const shadow = leafEl.querySelector(".leaf-shadow") as HTMLElement;
    if (shadow) {
      tl.fromTo(
        shadow,
        { opacity: 0 },
        { opacity: 0.35, duration: FLIP_DURATION * 0.4, ease: "power2.in" },
        0
      ).to(
        shadow,
        { opacity: 0, duration: FLIP_DURATION * 0.6, ease: "power2.out" },
        FLIP_DURATION * 0.4
      );
    }
  }, [isFlipping, flippedCount, totalLeaves, onFlip]);

  const flipBackward = useCallback(() => {
    if (isFlipping || flippedCount <= 0) return;

    const book = bookRef.current;
    if (!book) return;

    const leafIndex = flippedCount - 1;
    const leafEl = book.querySelector(
      `[data-leaf="${leafIndex}"]`
    ) as HTMLElement;
    if (!leafEl) return;

    setIsFlipping(true);
    gsap.set(leafEl, { zIndex: totalLeaves + 10 });

    const tl = gsap.timeline({
      onComplete: () => {
        gsap.set(leafEl, { zIndex: totalLeaves - leafIndex });
        setFlippedCount((prev) => prev - 1);
        setIsFlipping(false);
        onFlip?.(leafIndex, "backward");
      },
    });

    // Flip back: rotate from -180 to 0
    tl.to(leafEl, {
      rotateY: 0,
      duration: FLIP_DURATION,
      ease: "power2.inOut",
    });

    const shadow = leafEl.querySelector(".leaf-shadow") as HTMLElement;
    if (shadow) {
      tl.fromTo(
        shadow,
        { opacity: 0 },
        { opacity: 0.25, duration: FLIP_DURATION * 0.4, ease: "power2.in" },
        0
      ).to(
        shadow,
        { opacity: 0, duration: FLIP_DURATION * 0.6, ease: "power2.out" },
        FLIP_DURATION * 0.4
      );
    }
  }, [isFlipping, flippedCount, totalLeaves, onFlip]);

  // ─── Swipe & Tap Gesture Detection ───

  const handlePointerDown = useCallback(
    (e: React.PointerEvent) => {
      if (isFlipping) return;
      swipeRef.current = {
        startX: e.clientX,
        startY: e.clientY,
        startTime: Date.now(),
        isTracking: true,
      };
    },
    [isFlipping]
  );

  const handlePointerUp = useCallback(
    (e: React.PointerEvent) => {
      const swipe = swipeRef.current;
      if (!swipe.isTracking) return;
      swipe.isTracking = false;

      const deltaX = e.clientX - swipe.startX;
      const deltaY = e.clientY - swipe.startY;
      const elapsed = Date.now() - swipe.startTime;
      const velocity = Math.abs(deltaX) / elapsed;

      // Horizontal swipe
      if (Math.abs(deltaX) > Math.abs(deltaY) * 1.2) {
        if (
          Math.abs(deltaX) > SWIPE_THRESHOLD ||
          velocity > VELOCITY_THRESHOLD
        ) {
          if (deltaX < 0) flipForward();
          else flipBackward();
          return;
        }
      }

      // Edge tap
      const target = e.target as HTMLElement;
      if (target.closest('button, input, textarea, a, .cursor-pointer, .interactive')) {
        return; // Don't trigger page turn if clicking an interactive element
      }

      const book = bookRef.current;
      if (book && Math.abs(deltaX) < 10 && Math.abs(deltaY) < 10) {
        const rect = book.getBoundingClientRect();
        const tapX = (e.clientX - rect.left) / rect.width;
        if (tapX < 0.2) flipBackward();
        else if (tapX > 0.8) flipForward();
      }
    },
    [flipForward, flipBackward]
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "ArrowRight" || e.key === " ") {
        e.preventDefault();
        flipForward();
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        flipBackward();
      }
    },
    [flipForward, flipBackward]
  );

  return {
    flippedCount,
    isFlipping,
    bookRef,
    flipForward,
    flipBackward,
    handlePointerDown,
    handlePointerUp,
    handleKeyDown,
    totalLeaves,
  };
}
