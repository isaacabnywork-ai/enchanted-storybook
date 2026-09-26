"use client";

import Image from "next/image";
import ImageUploader from "./ImageUploader";
import { useEffect, useRef } from "react";
import gsap from "gsap";

/* ═══════════════════════════════════════════════
   TYPE DEFINITIONS
   ═══════════════════════════════════════════════ */
interface TimelineEvent {
  year: string;
  title: string;
  description: string;
  icon: string;
}

export interface PageData {
  id: string;
  type: "cover" | "chapter" | "timeline" | "letter" | "blank";
  title?: string;
  subtitle?: string;
  content?: string;
  greeting?: string;
  signature?: string;
  image?: string;
  events?: TimelineEvent[];
}

interface PageRendererProps {
  page: PageData;
  isActive: boolean;
  isEditing?: boolean;
  onChange?: (page: PageData) => void;
}

/* ═══════════════════════════════════════════════
   BLANK PAGE
   ═══════════════════════════════════════════════ */
function BlankPage() {
  return (
    <div className="relative w-full h-full parchment" />
  );
}

/* ═══════════════════════════════════════════════
   COVER PAGE
   ═══════════════════════════════════════════════ */
function CoverPage({ page, isActive, isEditing, onChange }: PageRendererProps) {
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isActive && contentRef.current) {
      const els = contentRef.current.querySelectorAll("[data-animate]");
      gsap.fromTo(
        els,
        { opacity: 0, y: 20 },
        { opacity: 1, y: 0, stagger: 0.15, duration: 0.6, ease: "power2.out", delay: 0.3 }
      );
    }
  }, [isActive]);

  return (
    <div className="relative w-full h-full flex flex-col items-center justify-end overflow-hidden parchment">
      {page.image && (
        <Image
          src={page.image}
          alt={page.title || "Cover"}
          fill
          className="object-cover"
          priority
          sizes="(max-width: 768px) 100vw, 50vw"
        />
      )}

      {isEditing && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-8">
           <div className="glass-card p-6 w-full max-w-sm rounded-xl">
              <label className="block text-rose-deep text-sm mb-1">Cover Title</label>
              <input 
                value={page.title || ""} 
                onChange={e => onChange?.({...page, title: e.target.value})}
                className="w-full p-2 mb-4 bg-cream/50 rounded border border-gold/30"
              />
              <label className="block text-rose-deep text-sm mb-1">Image</label>
              <ImageUploader 
                value={page.image} 
                onChange={(url) => onChange?.({...page, image: url})} 
              />
           </div>
        </div>
      )}

      <div ref={contentRef} className="relative z-10 text-center px-6 pb-6">
        <div
          data-animate
          className="inline-block px-5 py-2.5 rounded-full"
          style={{
            background: "rgba(254,249,244,0.75)",
            backdropFilter: "blur(8px)",
          }}
        >
          <p
            className="text-xs text-ink-faint"
            style={{ fontFamily: "var(--font-handwriting)" }}
          >
            Swipe or tap to begin ➜
          </p>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════
   CHAPTER PAGE
   ═══════════════════════════════════════════════ */
function ChapterPage({ page, isActive, isEditing, onChange }: PageRendererProps) {
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isActive && contentRef.current && !isEditing) {
      const els = contentRef.current.querySelectorAll("[data-animate]");
      gsap.fromTo(
        els,
        { opacity: 0, y: 15 },
        { opacity: 1, y: 0, stagger: 0.12, duration: 0.5, ease: "power2.out", delay: 0.4 }
      );
    }
  }, [isActive, isEditing]);

  return (
    <div className="relative w-full h-full flex flex-col overflow-hidden parchment">
      {isEditing && (
        <div className="absolute top-4 left-8 right-8 z-20">
          <label className="block text-rose-deep text-sm mb-1">Image</label>
          <ImageUploader 
            value={page.image} 
            onChange={(url) => onChange?.({...page, image: url})} 
          />
        </div>
      )}

      {page.image && !isEditing && (
        <div className="relative w-full flex-shrink-0" style={{ height: "42%" }}>
          <Image
            src={page.image}
            alt={page.title || "Chapter Image"}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, 50vw"
          />
          <div
            className="absolute bottom-0 left-0 right-0 h-16"
            style={{
              background: "linear-gradient(to top, var(--color-parchment) 0%, transparent 100%)",
            }}
          />
        </div>
      )}

      <div ref={contentRef} className={`flex-1 px-6 py-4 flex flex-col ${isEditing ? 'mt-16' : ''}`} style={{ minHeight: 0 }}>
        <div data-animate className="flex items-center gap-3 mb-3">
          <div className="flex-1 h-px bg-gradient-to-r from-transparent via-gold-light to-transparent" />
          <span className="text-gold text-xs select-none">✧</span>
          <div className="flex-1 h-px bg-gradient-to-r from-transparent via-gold-light to-transparent" />
        </div>

        {isEditing ? (
          <input 
            type="text"
            value={page.title || ""} 
            onChange={e => onChange?.({...page, title: e.target.value})}
            className="text-2xl text-rose-deep text-center mb-3 bg-transparent border-b border-gold/30 focus:outline-none w-full"
            style={{ fontFamily: "var(--font-heading)", fontWeight: 600 }}
          />
        ) : (
          <h2 data-animate className="text-2xl text-rose-deep text-center mb-3" style={{ fontFamily: "var(--font-heading)", fontWeight: 600 }}>
            {page.title}
          </h2>
        )}

        <div data-animate className="flex-1 overflow-y-auto timeline-scroll flex flex-col" style={{ minHeight: 0 }}>
          {isEditing ? (
            <textarea
              value={page.content || ""}
              onChange={e => onChange?.({...page, content: e.target.value})}
              className="flex-1 w-full bg-transparent border border-gold/20 rounded p-2 focus:outline-none focus:border-gold/50 text-sm leading-relaxed text-ink-light resize-none"
              style={{ fontFamily: "var(--font-body)", lineHeight: 1.8 }}
            />
          ) : (
            <p className="text-sm leading-relaxed text-ink-light text-justify" style={{ fontFamily: "var(--font-body)", lineHeight: 1.8 }}>
              {page.content}
            </p>
          )}
        </div>

        <div data-animate className="text-center mt-3 text-gold-light text-sm select-none">
          ✦ ✧ ✦
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════
   TIMELINE PAGE
   ═══════════════════════════════════════════════ */
function TimelinePage({ page, isActive, isEditing, onChange }: PageRendererProps) {
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isActive && contentRef.current && !isEditing) {
      const items = contentRef.current.querySelectorAll("[data-timeline-item]");
      gsap.fromTo(
        items,
        { opacity: 0, x: -20 },
        { opacity: 1, x: 0, stagger: 0.12, duration: 0.5, ease: "power2.out", delay: 0.3 }
      );
    }
  }, [isActive, isEditing]);

  return (
    <div className="relative w-full h-full flex flex-col overflow-hidden parchment">
      <div className="px-6 pt-5 pb-2 text-center flex-shrink-0">
        {isEditing && (
          <div className="mb-4">
            <label className="block text-rose-deep text-sm mb-1 text-left">Image</label>
            <ImageUploader 
              value={page.image} 
              onChange={(url) => onChange?.({...page, image: url})} 
            />
          </div>
        )}
        <div className="text-gold text-lg mb-1 select-none">✦</div>
        {isEditing ? (
          <input 
            type="text"
            value={page.title || ""} 
            onChange={e => onChange?.({...page, title: e.target.value})}
            className="text-2xl text-rose-deep text-center mb-1 bg-white/60 border border-gold/50 rounded px-2 py-1 focus:outline-none w-full pointer-events-auto"
            style={{ fontFamily: "var(--font-heading)", fontWeight: 600 }}
          />
        ) : (
          <h2 className="text-2xl text-rose-deep mb-1" style={{ fontFamily: "var(--font-heading)", fontWeight: 600 }}>
            {page.title}
          </h2>
        )}
        <div className="flex items-center gap-3">
          <div className="flex-1 h-px bg-gradient-to-r from-transparent via-gold-light to-transparent" />
          <span className="text-gold text-xs select-none">🧭</span>
          <div className="flex-1 h-px bg-gradient-to-r from-transparent via-gold-light to-transparent" />
        </div>
      </div>

      <div ref={contentRef} className="flex-1 px-5 py-2 overflow-y-auto timeline-scroll" style={{ minHeight: 0 }}>
        <div className="relative">
          <div className="absolute left-[18px] top-2 bottom-2 w-[2px]" style={{ background: "linear-gradient(to bottom, transparent, var(--color-gold-light) 10%, var(--color-gold-light) 90%, transparent)" }} />

          {page.events?.map((event, i) => (
            <div key={i} data-timeline-item className="relative flex gap-4 mb-5 last:mb-2">
              <div className="relative z-10 flex-shrink-0 w-9 h-9 rounded-full bg-cream border-2 border-gold-light flex items-center justify-center text-base shadow-sm">
                {event.icon}
              </div>
              <div className="flex-1 pt-0.5">
                {isEditing ? (
                  <div className="space-y-1 mb-2 pointer-events-auto">
                    <input 
                      value={event.year} 
                      onChange={e => {
                        const newEvents = [...(page.events || [])];
                        newEvents[i].year = e.target.value;
                        onChange?.({...page, events: newEvents});
                      }}
                      className="text-[10px] uppercase tracking-widest text-gold-dark bg-white/60 border border-gold/50 rounded px-2 py-1 focus:outline-none w-full mb-1"
                      style={{ fontFamily: "var(--font-heading)" }}
                    />
                    <input 
                      value={event.title} 
                      onChange={e => {
                        const newEvents = [...(page.events || [])];
                        newEvents[i].title = e.target.value;
                        onChange?.({...page, events: newEvents});
                      }}
                      className="text-sm font-semibold text-ink bg-white/60 border border-gold/50 rounded px-2 py-1 focus:outline-none w-full mb-1"
                      style={{ fontFamily: "var(--font-heading)" }}
                    />
                    <textarea 
                      value={event.description} 
                      onChange={e => {
                        const newEvents = [...(page.events || [])];
                        newEvents[i].description = e.target.value;
                        onChange?.({...page, events: newEvents});
                      }}
                      className="text-xs text-ink-light bg-white/60 border border-gold/50 rounded px-2 py-1 focus:outline-none w-full resize-none min-h-[40px]"
                      style={{ fontFamily: "var(--font-body)" }}
                    />
                  </div>
                ) : (
                  <>
                    <span className="text-[10px] uppercase tracking-widest text-gold-dark" style={{ fontFamily: "var(--font-heading)" }}>{event.year}</span>
                    <h3 className="text-sm font-semibold text-ink mt-0.5" style={{ fontFamily: "var(--font-heading)" }}>{event.title}</h3>
                    <p className="text-xs text-ink-light mt-0.5 leading-relaxed" style={{ fontFamily: "var(--font-body)" }}>{event.description}</p>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className="px-6 pb-4 pt-1 text-center flex-shrink-0">
        <div className="text-gold-light text-sm select-none">✦ ✧ ✦</div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════
   LETTER PAGE
   ═══════════════════════════════════════════════ */
import { useState } from "react";

function LetterPage({ page, isActive, isEditing, onChange }: PageRendererProps) {
  const contentRef = useRef<HTMLDivElement>(null);
  const envelopeRef = useRef<HTMLDivElement>(null);
  const sealRef = useRef<SVGSVGElement>(null);
  
  // If editing, skip the sealed state
  const [isSealed, setIsSealed] = useState(!isEditing);
  const [isFullScreenEdit, setIsFullScreenEdit] = useState(false);

  useEffect(() => {
    // If editing changes to true, force open
    if (isEditing && isSealed) {
      setTimeout(() => setIsSealed(false), 0);
    }
  }, [isEditing, isSealed]);

  useEffect(() => {
    if (isActive && contentRef.current && !isEditing && !isSealed) {
      const els = contentRef.current.querySelectorAll("[data-animate]");
      gsap.fromTo(
        els,
        { opacity: 0, y: 10 },
        { opacity: 1, y: 0, stagger: 0.1, duration: 0.6, ease: "power2.out", delay: 0.2 }
      );
    }
  }, [isActive, isEditing, isSealed]);

  const handleBreakSeal = () => {
    if (!envelopeRef.current || !sealRef.current) return;

    const tl = gsap.timeline({
      onComplete: () => setIsSealed(false)
    });

    // Break the seal
    tl.to(sealRef.current, {
      scale: 1.2,
      opacity: 0,
      duration: 0.3,
      ease: "back.in(2)"
    });

    // Open flap & fade out envelope
    tl.to(envelopeRef.current, {
      scale: 1.05,
      opacity: 0,
      duration: 0.5,
      ease: "power2.inOut"
    }, "+=0.1");
  };

  return (
    <div className="relative w-full h-full flex flex-col overflow-hidden">
      {page.image && (
        <Image
          src={page.image}
          alt={page.title || "Letter Image"}
          fill
          className="object-cover opacity-15"
          sizes="(max-width: 768px) 100vw, 50vw"
        />
      )}
      <div className="absolute inset-0 parchment opacity-95" />

      {/* ENVELOPE OVERLAY */}
      {isSealed && (
        <div 
          ref={envelopeRef}
          className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-cream/95 backdrop-blur-sm cursor-pointer"
          onClick={handleBreakSeal}
        >
          <div className="relative w-64 h-48 bg-blush-light shadow-lg rounded flex items-center justify-center border border-gold/20 overflow-hidden group">
            {/* Flap lines */}
            <svg className="absolute inset-0 w-full h-full pointer-events-none" preserveAspectRatio="none">
              <path d="M0,0 L128,80 L256,0" fill="none" stroke="var(--color-gold-light)" strokeWidth="2" opacity="0.5" />
              <path d="M0,192 L128,80 L256,192" fill="none" stroke="var(--color-gold-light)" strokeWidth="2" opacity="0.5" />
            </svg>
            
            {/* Wax Seal */}
            <svg 
              ref={sealRef}
              width="60" 
              height="60" 
              viewBox="0 0 100 100" 
              className="z-10 drop-shadow-md transition-transform duration-300 group-hover:scale-110"
            >
              <circle cx="50" cy="50" r="45" fill="var(--color-rose-deep)" />
              <circle cx="50" cy="50" r="38" fill="none" stroke="var(--color-gold)" strokeWidth="2" opacity="0.8" />
              <path d="M35 65 L45 35 L55 65 M40 55 L50 55" stroke="var(--color-gold)" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" fill="none" />
              <path d="M65 35 L65 65" stroke="var(--color-gold)" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" fill="none" />
            </svg>

            <div className="absolute bottom-6 text-xs text-rose-deep tracking-widest uppercase opacity-0 group-hover:opacity-100 transition-opacity" style={{ fontFamily: "var(--font-heading)" }}>
              Tap to Open
            </div>
          </div>
        </div>
      )}

      {/* LETTER CONTENT */}
      {!isSealed && (
        <div ref={contentRef} className="relative z-10 flex-1 flex flex-col px-7 py-6 overflow-y-auto timeline-scroll">
          {isEditing && (
            <div className="mb-4 w-full">
              <label className="block text-rose-deep text-sm mb-1 text-left">Image</label>
              <ImageUploader 
                value={page.image} 
                onChange={(url) => onChange?.({...page, image: url})} 
              />
            </div>
          )}
          <div data-animate className="text-center mb-3">
            <div className="text-gold text-xl mb-1 select-none">✦ ✧ ✦</div>
            {isEditing ? (
              <input 
                value={page.title || ""} 
                onChange={e => onChange?.({...page, title: e.target.value})}
                className="text-xl text-rose-deep text-center mb-1 bg-white/60 border border-gold/50 rounded px-2 py-1 focus:outline-none w-full pointer-events-auto"
                style={{ fontFamily: "var(--font-heading)", fontWeight: 600 }}
              />
            ) : (
              <h2 className="text-xl text-rose-deep" style={{ fontFamily: "var(--font-heading)", fontWeight: 600 }}>{page.title}</h2>
            )}
          </div>

          <div data-animate className="flex items-center gap-3 mb-4">
            <div className="flex-1 h-px bg-gradient-to-r from-transparent via-gold-light to-transparent" />
            <span className="text-rose text-xs select-none">♡</span>
            <div className="flex-1 h-px bg-gradient-to-r from-transparent via-gold-light to-transparent" />
          </div>

          {isEditing ? (
            <input 
              value={page.greeting || ""} 
              onChange={e => onChange?.({...page, greeting: e.target.value})}
              className="text-lg text-ink mb-3 bg-white/60 border border-gold/50 rounded px-2 py-1 focus:outline-none w-full pointer-events-auto"
              style={{ fontFamily: "var(--font-handwriting)" }}
            />
          ) : (
            <p data-animate className="text-lg text-ink mb-3" style={{ fontFamily: "var(--font-handwriting)" }}>{page.greeting}</p>
          )}

          <div data-animate className="flex-1 flex flex-col" style={{ minHeight: 0 }}>
            {isEditing ? (
              <>
                <div 
                  className="flex-1 w-full border border-gold/20 rounded p-2 text-sm leading-relaxed text-ink-light bg-cream/50 cursor-pointer flex items-center justify-center hover:bg-cream transition-colors"
                  onClick={() => setIsFullScreenEdit(true)}
                  style={{ fontFamily: "var(--font-body)" }}
                >
                  <span className="text-rose-deep font-semibold">Click to Edit Letter Body</span>
                </div>

                {isFullScreenEdit && (
                  <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 md:p-12">
                    <div className="w-full h-full max-w-4xl bg-parchment rounded-xl shadow-2xl flex flex-col p-6 md:p-10 border border-gold/30">
                      <div className="flex justify-between items-center mb-6">
                        <h2 className="text-3xl text-rose-deep font-semibold" style={{ fontFamily: "var(--font-heading)" }}>Edit Letter</h2>
                        <button 
                          onClick={() => setIsFullScreenEdit(false)}
                          className="px-6 py-2 bg-rose text-white rounded-full font-semibold shadow hover:bg-rose-deep transition-colors"
                        >
                          Done
                        </button>
                      </div>
                      <textarea
                        value={page.content || ""}
                        onChange={e => onChange?.({...page, content: e.target.value})}
                        className="flex-1 w-full bg-transparent border border-gold/20 rounded p-6 focus:outline-none focus:border-gold/50 text-lg leading-relaxed text-ink resize-none shadow-inner timeline-scroll"
                        style={{ fontFamily: "var(--font-body)", lineHeight: 1.8 }}
                        placeholder="Write your beautiful letter here..."
                        autoFocus
                      />
                    </div>
                  </div>
                )}
              </>
            ) : (
              page.content?.split("\n\n").map((paragraph, i) => (
                <p key={i} className="text-sm text-ink-light mb-3 leading-relaxed" style={{ fontFamily: "var(--font-body)", lineHeight: 1.8 }}>
                  {paragraph}
                </p>
              ))
            )}
          </div>

          <div data-animate className="mt-4 text-right">
            {isEditing ? (
              <input 
                value={page.signature || ""} 
                onChange={e => onChange?.({...page, signature: e.target.value})}
                className="text-lg text-rose-deep text-right bg-white/60 border border-gold/50 rounded px-2 py-1 focus:outline-none w-full pointer-events-auto mt-4"
                style={{ fontFamily: "var(--font-handwriting)" }}
              />
            ) : (
              <p className="text-lg text-rose-deep" style={{ fontFamily: "var(--font-handwriting)" }}>{page.signature}</p>
            )}
          </div>
          
          <div data-animate className="text-center mt-3 select-none">
            <span className="text-3xl">💌</span>
          </div>
        </div>
      )}
    </div>
  );
}


/* ═══════════════════════════════════════════════
   PAGE RENDERER
   ═══════════════════════════════════════════════ */
export default function PageRenderer(props: PageRendererProps) {
  switch (props.page.type) {
    case "cover":
      return <CoverPage {...props} />;
    case "chapter":
      return <ChapterPage {...props} />;
    case "timeline":
      return <TimelinePage {...props} />;
    case "letter":
      return <LetterPage {...props} />;
    case "blank":
      return <BlankPage />;
    default:
      return null;
  }
}
