"use client";

import { useCallback, useEffect, useRef, useState } from "react";
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
  const SWIPE_THRESHOLD = 35;
  const VELOCITY_THRESHOLD = 0.2;

  // Sync leaf rotation state with flippedCount
  useEffect(() => {
    if (isFlipping) return;
    const book = bookRef.current;
    if (!book) return;

    const leaves = book.querySelectorAll<HTMLElement>("[data-leaf]");
    leaves.forEach((leaf) => {
      const idx = parseInt(leaf.getAttribute("data-leaf") || "-1", 10);
      if (idx >= 0) {
        if (idx < flippedCount) {
          gsap.set(leaf, { rotateY: -180, zIndex: idx + 1 });
        } else {
          gsap.set(leaf, { rotateY: 0, zIndex: totalLeaves - idx });
        }
      }
    });
  }, [flippedCount, totalLeaves, isFlipping]);

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

    // Bring flipping leaf above everything and ensure rotation starts at 0
    gsap.set(leafEl, { zIndex: totalLeaves + 10, rotateY: 0 });

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
    // Bring leaf to top and ensure it starts from -180
    gsap.set(leafEl, { zIndex: totalLeaves + 10, rotateY: -180 });

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

  // ─── Swipe & Tap Gesture Detection (Pointer Events for Mouse/Laptop) ───

  const handlePointerDown = useCallback(
    (e: React.PointerEvent) => {
      if (isFlipping) return;
      // Ignore touch pointers here so touch events handle mobile cleanly
      if (e.pointerType === "touch") return;

      const target = e.target as HTMLElement;
      if (target.closest("button, input, textarea, a, .cursor-pointer, .interactive")) {
        return;
      }

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
      if (e.pointerType === "touch") return;
      const swipe = swipeRef.current;
      if (!swipe.isTracking) return;
      swipe.isTracking = false;

      const deltaX = e.clientX - swipe.startX;
      const deltaY = e.clientY - swipe.startY;
      const elapsed = Math.max(Date.now() - swipe.startTime, 1);
      const velocity = Math.abs(deltaX) / elapsed;

      // Horizontal swipe on laptop (e.g. mouse drag)
      if (Math.abs(deltaX) > Math.abs(deltaY) * 1.15) {
        if (Math.abs(deltaX) > SWIPE_THRESHOLD || velocity > VELOCITY_THRESHOLD) {
          if (deltaX < 0) flipForward();
          else flipBackward();
          return;
        }
      }

      // Edge tap (clicks near the outer edges of the book)
      const target = e.target as HTMLElement;
      if (target.closest("button, input, textarea, a, .cursor-pointer, .interactive, .timeline-scroll")) {
        return;
      }

      const book = bookRef.current;
      if (book && Math.abs(deltaX) < 15 && Math.abs(deltaY) < 15) {
        const rect = book.getBoundingClientRect();
        const tapX = (e.clientX - rect.left) / rect.width;
        if (tapX < 0.18) flipBackward();
        else if (tapX > 0.82) flipForward();
      }
    },
    [flipForward, flipBackward]
  );

  // ─── Touch Gesture Detection (Dedicated for Phone & Tablet) ───

  const handleTouchStart = useCallback(
    (e: React.TouchEvent) => {
      if (isFlipping || e.touches.length !== 1) return;

      const target = e.target as HTMLElement;
      if (target.closest("button, input, textarea, a, .cursor-pointer, .interactive")) {
        return;
      }

      const touch = e.touches[0];
      swipeRef.current = {
        startX: touch.clientX,
        startY: touch.clientY,
        startTime: Date.now(),
        isTracking: true,
      };
    },
    [isFlipping]
  );

  const handleTouchEnd = useCallback(
    (e: React.TouchEvent) => {
      const swipe = swipeRef.current;
      if (!swipe.isTracking) return;
      swipe.isTracking = false;

      if (!e.changedTouches || e.changedTouches.length === 0) return;
      const touch = e.changedTouches[0];
      const deltaX = touch.clientX - swipe.startX;
      const deltaY = touch.clientY - swipe.startY;
      const elapsed = Math.max(Date.now() - swipe.startTime, 1);
      const velocity = Math.abs(deltaX) / elapsed;

      // Horizontal swipe: user swiped sideways to turn pages
      if (Math.abs(deltaX) > Math.abs(deltaY) * 1.15) {
        if (Math.abs(deltaX) > SWIPE_THRESHOLD || velocity > VELOCITY_THRESHOLD) {
          if (deltaX < 0) flipForward();
          else flipBackward();
          return;
        }
      }

      // Edge tap on mobile
      const target = e.target as HTMLElement;
      if (target.closest("button, input, textarea, a, .cursor-pointer, .interactive, .timeline-scroll")) {
        return;
      }

      const book = bookRef.current;
      if (book && Math.abs(deltaX) < 15 && Math.abs(deltaY) < 15) {
        const rect = book.getBoundingClientRect();
        const tapX = (touch.clientX - rect.left) / rect.width;
        if (tapX < 0.18) flipBackward();
        else if (tapX > 0.82) flipForward();
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
    setFlippedCount,
    isFlipping,
    bookRef,
    flipForward,
    flipBackward,
    handlePointerDown,
    handlePointerUp,
    handleTouchStart,
    handleTouchEnd,
    handleKeyDown,
    totalLeaves,
  };
}
