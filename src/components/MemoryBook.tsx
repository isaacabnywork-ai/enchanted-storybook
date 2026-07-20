"use client";

import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import PageRenderer, { PageData } from "./PageRenderer";
import { usePageFlip } from "@/hooks/usePageFlip";
import { useParticles } from "@/hooks/useParticles";
interface MemoryBookProps {
  pages: PageData[];
  storybookData: { memoryBookPages?: PageData[]; [key: string]: unknown };
}

export default function MemoryBook({ pages: initialPages, storybookData }: MemoryBookProps) {
  const bookEntranceRef = useRef<HTMLDivElement>(null);
  const [pages, setPages] = useState<PageData[]>(initialPages);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  // Responsive state
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Calculate leaves. Every 2 pages is 1 leaf on Desktop. Every 1 page is 1 leaf on Mobile.
  const leavesCount = isMobile ? pages.length : Math.ceil(pages.length / 2);
  
  const {
    flippedCount,
    isFlipping,
    bookRef, 
    flipForward,
    flipBackward,
    handlePointerDown,
    handlePointerUp,
    handleKeyDown,
  } = usePageFlip({
    totalLeaves: leavesCount,
  });

  const { containerRef: particlesContainerRef, triggerBurst } = useParticles(true);

  // Wrappers to trigger burst on flip
  const handleFlipForward = () => {
    flipForward();
    triggerBurst();
  };

  const handleFlipBackward = () => {
    flipBackward();
    triggerBurst();
  };

  // Entrance animation for the book
  useEffect(() => {
    if (!bookEntranceRef.current) return;
    gsap.fromTo(
      bookEntranceRef.current,
      { scale: 0.85, opacity: 0, y: 30 },
      {
        scale: 1,
        opacity: 1,
        y: 0,
        duration: 1,
        ease: "power3.out",
        delay: 0.2,
      }
    );
  }, []);

  const handlePageChange = (pageId: string, updatedPage: PageData) => {
    setPages(prev => prev.map(p => p.id === pageId ? updatedPage : p));
  };

  const saveBook = async () => {
    setIsSaving(true);
    try {
      const res = await fetch("/api/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          target: "storybook",
          data: { ...storybookData, memoryBookPages: pages }
        })
      });

      if (res.ok) {
        setIsEditing(false);
      } else {
        alert("Failed to save book.");
      }
    } catch (error) {
      console.error(error);
      alert("Error saving book.");
    } finally {
      setIsSaving(false);
    }
  };

  // Derived indices for Flat Desktop View
  const leftPageIndex = flippedCount > 0 ? (flippedCount - 1) * 2 + 1 : -1;
  const rightPageIndex = flippedCount * 2;
  const leftPage = leftPageIndex >= 0 ? pages[leftPageIndex] : null;
  const rightPage = rightPageIndex < pages.length ? pages[rightPageIndex] : null;

  return (
    <div
      id="memorybook-container"
      className="fixed inset-0 flex items-center justify-center overflow-hidden"
      style={{
        background:
          "radial-gradient(ellipse at 50% 30%, var(--color-cream) 0%, var(--color-blush) 50%, var(--color-blush-light) 100%)",
      }}
    >
      {/* Particles */}
      <div
        ref={particlesContainerRef}
        className="absolute inset-0 pointer-events-none z-0 overflow-hidden"
      />

      {/* Editor Controls */}
      <div className="absolute top-4 left-4 md:top-6 md:left-6 z-50 flex items-center gap-4 animate-fade-in-up">
        <button
          onClick={() => isEditing ? saveBook() : setIsEditing(true)}
          disabled={isSaving}
          className="px-4 py-2 md:px-6 md:py-2 rounded-full glass-card text-rose-deep hover:bg-rose/10 transition-colors shadow-md border border-rose/20 flex items-center gap-2 text-sm md:text-base"
          style={{ fontFamily: "var(--font-heading)" }}
        >
          {isSaving ? "Saving..." : isEditing ? "Save Changes" : "✎ Edit Book"}
        </button>
        {isEditing && (
          <>
            <button
              onClick={() => {
                const newPageId = `mb-page-${Date.now()}`;
                const newPages = [...pages];
                const backCoverIndex = newPages.findIndex(p => p.id === "mb-back-cover" || p.id === "back-cover");
                const insertIndex = backCoverIndex >= 0 ? backCoverIndex : newPages.length;
                newPages.splice(insertIndex, 0, {
                  id: newPageId,
                  type: "chapter",
                  title: "New Memory",
                  content: "Write about this memory...",
                  image: "https://images.unsplash.com/photo-1522383225653-ed111181a951?auto=format&fit=crop&q=80&w=1000"
                });
                setPages(newPages);
              }}
              className="px-3 py-2 md:px-4 md:py-2 rounded-full glass-card text-gold hover:bg-gold/10 transition-colors border border-gold/20 flex items-center gap-2 text-sm"
            >
              + Add Page
            </button>
            <button
              onClick={() => {
                if (pages.length <= 3) return; // keep at least cover and back
                const newPages = [...pages];
                const backCoverIndex = newPages.findIndex(p => p.id === "mb-back-cover" || p.id === "back-cover");
                const removeIndex = backCoverIndex >= 0 ? backCoverIndex - 1 : newPages.length - 1;
                if (removeIndex > 0) {
                  newPages.splice(removeIndex, 1);
                  setPages(newPages);
                }
              }}
              className="px-3 py-2 md:px-4 md:py-2 rounded-full glass-card text-rose hover:bg-rose/10 transition-colors border border-rose/20 flex items-center gap-2 text-sm"
            >
              - Delete Last Page
            </button>
            <button
              onClick={() => {
                setPages(initialPages);
                setIsEditing(false);
              }}
              className="px-3 py-2 md:px-4 md:py-2 rounded-full text-ink-light hover:text-ink transition-colors text-sm"
            >
              Cancel
            </button>
          </>
        )}
      </div>

      <div
        ref={bookEntranceRef}
        className="relative z-10 w-full max-w-6xl px-2 md:px-8 flex justify-center items-center h-full"
        style={{ opacity: 0 }}
      >
        {/* DESKTOP FLAT EDIT VIEW */}
        {isEditing && !isMobile ? (
          <div className="relative flex justify-center items-center w-full max-w-[900px] aspect-[840/680] max-h-[85vh]">
             <div className="flex w-full h-full shadow-2xl rounded-xl border border-gold/30 bg-cream">
                {/* Left Page */}
                <div className="w-1/2 h-full border-r border-gold/20 relative">
                   {leftPage ? (
                     <PageRenderer
                        page={leftPage}
                        isActive={true}
                        isEditing={isEditing}
                        onChange={(updatedPage) => handlePageChange(leftPage.id, updatedPage)}
                     />
                   ) : (
                     <div className="w-full h-full parchment flex items-center justify-center text-ink-faint font-medium">Cover</div>
                   )}
                   <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-[rgba(0,0,0,0.05)] to-transparent pointer-events-none" />
                </div>
                {/* Right Page */}
                <div className="w-1/2 h-full relative">
                   {rightPage ? (
                     <PageRenderer
                        page={rightPage}
                        isActive={true}
                        isEditing={isEditing}
                        onChange={(updatedPage) => handlePageChange(rightPage.id, updatedPage)}
                     />
                   ) : (
                     <div className="w-full h-full parchment flex items-center justify-center text-ink-faint font-medium">Back Cover</div>
                   )}
                   <div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-[rgba(0,0,0,0.05)] to-transparent pointer-events-none" />
                </div>
             </div>
             
             {/* Simple flat navigation for edit mode */}
             <div className="absolute -bottom-16 left-0 right-0 flex justify-center gap-8">
                <button onClick={handleFlipBackward} disabled={flippedCount === 0} className="w-12 h-12 rounded-full glass-card flex items-center justify-center hover:scale-110 active:scale-95 disabled:opacity-30 text-gold">❮</button>
                <span className="flex items-center text-ink-faint font-semibold" style={{ fontFamily: "var(--font-heading)" }}>
                   Spread {flippedCount}
                </span>
                <button onClick={handleFlipForward} disabled={flippedCount === leavesCount} className="w-12 h-12 rounded-full glass-card flex items-center justify-center hover:scale-110 active:scale-95 disabled:opacity-30 text-gold">❯</button>
             </div>
          </div>
        ) : 
        
        /* 3D BOOK VIEW (Used for Mobile Read/Edit, and Desktop Read) */
        (
          <div className={`relative book-perspective flex justify-center items-center w-full ${isMobile ? "max-w-[420px] aspect-[420/680]" : "max-w-[840px] aspect-[840/680]"} max-h-[85vh]`}>
            
            {/* Book shadow */}
            {!isMobile && (
              <div
                className="absolute -bottom-6 left-8 right-8 h-12 rounded-full z-0 transition-all duration-500"
                style={{
                  background:
                    "radial-gradient(ellipse at center, rgba(90,62,54,0.2) 0%, transparent 70%)",
                  filter: "blur(12px)",
                  width: flippedCount === 0 || flippedCount === leavesCount ? "55%" : "100%",
                  marginLeft: flippedCount === 0 ? "45%" : flippedCount === leavesCount ? "0" : "0",
                }}
              />
            )}

            {/* Spine Binding Background */}
            {!isMobile && (
              <div 
                className="absolute top-0 bottom-0 left-1/2 w-16 -ml-8 rounded-sm z-0"
                style={{
                  background: "var(--color-gold-dark)",
                  boxShadow: "inset 0 0 20px rgba(0,0,0,0.5)",
                  display: (flippedCount > 0 && flippedCount < leavesCount) ? "block" : "none"
                }}
              />
            )}

            {/* Interactive Area */}
            <div
              ref={bookRef}
              id="book-viewport"
              role="region"
              aria-label="Storybook spread"
              aria-roledescription="book"
              tabIndex={0}
              onPointerDown={handlePointerDown}
              onPointerUp={handlePointerUp}
              onKeyDown={handleKeyDown}
              className={`relative w-full h-full outline-none z-10 touch-pan-y ${isEditing ? "" : "select-none cursor-grab active:cursor-grabbing"}`}
            >
              {Array.from({ length: leavesCount }).map((_, leafIndex) => {
                const frontPageIndex = isMobile ? leafIndex : leafIndex * 2;
                const backPageIndex = isMobile ? -1 : leafIndex * 2 + 1;
                const frontPage = pages[frontPageIndex];
                const backPage = backPageIndex >= 0 ? pages[backPageIndex] : null;
                
                const isFlipped = leafIndex < flippedCount;
                const zIndex = isFlipped ? leafIndex : leavesCount - leafIndex; 

                const isFrontActive = !isFlipped && leafIndex === flippedCount && !isFlipping;
                const isBackActive = !isMobile && isFlipped && leafIndex === flippedCount - 1 && !isFlipping;

                return (
                  <div
                    key={`leaf-${leafIndex}`}
                    data-leaf={leafIndex}
                    className={`absolute top-0 bottom-0 right-0 page-3d will-change-transform ${isMobile ? "w-full" : "w-1/2"}`}
                    style={{
                      transformOrigin: "left center",
                      zIndex,
                      // FLATTEN LEFT PAGE WHEN RESTING:
                      transform: (isFlipped 
                        ? (isFlipping ? "rotateY(-180deg)" : "translateX(-100%) rotateY(0deg)") 
                        : "rotateY(0deg)") + ` translateZ(${zIndex}px)`
                    }}
                  >
                    {/* FRONT FACE */}
                    {frontPage && (
                      <div 
                        className="absolute inset-0 page-front"
                        style={{
                          // Hide front page when resting on the left
                          display: (isFlipped && !isFlipping) ? "none" : "block",
                          borderRadius: isMobile ? "12px" : "0 12px 12px 0",
                          boxShadow: isFlipped ? "none" : "inset 4px 0 10px rgba(0,0,0,0.05), var(--shadow-page)",
                          backgroundColor: "var(--color-cream)", 
                        }}
                      >
                        <PageRenderer
                          page={frontPage}
                          isActive={isFrontActive}
                          isEditing={isEditing}
                          onChange={(updatedPage) => handlePageChange(frontPage.id, updatedPage)}
                        />
                        {!isMobile && (
                          <div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-[rgba(0,0,0,0.1)] to-transparent pointer-events-none" />
                        )}
                        <div className={`leaf-shadow absolute inset-0 bg-black pointer-events-none opacity-0 ${isMobile ? "rounded-xl" : "rounded-r-xl"}`} />
                      </div>
                    )}

                    {/* BACK FACE (Only for Desktop) */}
                    {!isMobile && backPage && (
                      <div 
                        className="absolute inset-0 page-back"
                        style={{
                          // Face forward when resting on the left!
                          transform: (isFlipped && !isFlipping) ? "rotateY(0deg)" : "rotateY(180deg)",
                          borderRadius: "12px 0 0 12px",
                          boxShadow: !isFlipped ? "none" : "inset -4px 0 10px rgba(0,0,0,0.05), var(--shadow-page)",
                          backgroundColor: "var(--color-cream)", 
                        }}
                      >
                        <PageRenderer
                          page={backPage}
                          isActive={isBackActive}
                          isEditing={false} // Edit bug workaround: we use flat view for edit on desktop
                          onChange={(updatedPage) => handlePageChange(backPage.id, updatedPage)}
                        />
                        <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-[rgba(0,0,0,0.1)] to-transparent pointer-events-none" />
                        <div className="leaf-shadow absolute inset-0 bg-black pointer-events-none opacity-0 rounded-l-xl" />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Navigation Controls */}
      {!isEditing && (
        <div className="absolute bottom-4 left-0 right-0 z-30 flex flex-col items-center gap-3">
          <div className="flex items-center gap-8">
            <button
              onClick={handleFlipBackward}
              disabled={flippedCount === 0 || isFlipping}
              className="w-12 h-12 rounded-full glass-card flex items-center justify-center
                         transition-all duration-200 hover:scale-110 active:scale-95
                         disabled:opacity-20 disabled:hover:scale-100 text-gold"
            >
              <svg width="20" height="20" viewBox="0 0 16 16" fill="none" className="mr-0.5">
                <path d="M10 3L5 8L10 13" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>

            <span
              className="text-sm font-semibold text-ink-faint min-w-[80px] text-center"
              style={{ fontFamily: "var(--font-heading)" }}
            >
              {isMobile 
                ? `${flippedCount + 1} / ${leavesCount}`
                : (flippedCount === 0 ? "Cover" : flippedCount === leavesCount ? "End" : `Spread ${flippedCount}`)
              }
            </span>

            <button
              onClick={handleFlipForward}
              disabled={flippedCount === leavesCount || isFlipping}
              className="w-12 h-12 rounded-full glass-card flex items-center justify-center
                         transition-all duration-200 hover:scale-110 active:scale-95
                         disabled:opacity-20 disabled:hover:scale-100 text-gold"
            >
              <svg width="20" height="20" viewBox="0 0 16 16" fill="none" className="ml-0.5">
                <path d="M6 3L11 8L6 13" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
