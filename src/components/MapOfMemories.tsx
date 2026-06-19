"use client";

import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import Image from "next/image";

interface MapEvent {
  year: string;
  title: string;
  description: string;
  icon: string;
  x: number; // percentage
  y: number; // percentage
  images?: string[]; // memory photos for this pin
}

interface MapOfMemoriesProps {
  storybookData: any;
}

const CLOUD_NAME = "dmbzkiclm";
const UPLOAD_PRESET = "ml_default";

async function uploadToCloudinary(file: File): Promise<string> {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", UPLOAD_PRESET);
  formData.append("folder", "enchanted-storybook/pins");
  const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`, {
    method: "POST",
    body: formData,
  });
  const data = await res.json();
  if (data.secure_url) return data.secure_url;
  throw new Error(data.error?.message || "Upload failed");
}

export default function MapOfMemories({ storybookData }: MapOfMemoriesProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<HTMLDivElement>(null);
  const [selectedEvent, setSelectedEvent] = useState<MapEvent | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [events, setEvents] = useState<MapEvent[]>([]);
  const [mapImage, setMapImage] = useState("/uploads/1781844965142-Pink_scenery_bg_.webp");
  const [isUploading, setIsUploading] = useState(false);
  const [isPinUploading, setIsPinUploading] = useState(false);
  const [carouselIndex, setCarouselIndex] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const pinImageInputRef = useRef<HTMLInputElement>(null);

  // Find the timeline page to sync with
  const timelinePageIdx = storybookData.pages.findIndex((p: any) => p.type === "timeline");

  useEffect(() => {
    if (timelinePageIdx !== -1) {
      const pageEvents = storybookData.pages[timelinePageIdx].events || [];
      const positions = [
        { x: 20, y: 30 }, { x: 50, y: 20 }, { x: 70, y: 50 }, { x: 40, y: 70 }, { x: 80, y: 80 }
      ];
      const parsedEvents = pageEvents.map((e: any, index: number) => ({
        ...e,
        x: e.x !== undefined ? e.x : positions[index % positions.length].x,
        y: e.y !== undefined ? e.y : positions[index % positions.length].y,
        images: e.images || [],
      }));
      setEvents(parsedEvents);

      const firestoreImage = storybookData.pages[timelinePageIdx].mapImage;
      if (firestoreImage && firestoreImage !== "https://images.unsplash.com/photo-1506744626753-df839199d501?auto=format&fit=crop&q=80&w=2000" && firestoreImage !== "/uploads/1781844965142-Pink_scenery_bg_.webp") {
        setMapImage(firestoreImage);
      } else {
        setMapImage("https://images.unsplash.com/photo-1522383225653-ed111181a951?auto=format&fit=crop&q=80&w=2000");
        setTimeout(() => {
          saveEvents(parsedEvents, "https://images.unsplash.com/photo-1522383225653-ed111181a951?auto=format&fit=crop&q=80&w=2000");
        }, 1000);
      }
    }
  }, [timelinePageIdx, storybookData.pages]);

  useEffect(() => {
    if (containerRef.current) {
      gsap.fromTo(containerRef.current, { opacity: 0 }, { opacity: 1, duration: 1, ease: "power2.out" });
      const pins = containerRef.current.querySelectorAll("[data-pin]");
      gsap.fromTo(pins, { scale: 0, y: -20 }, { scale: 1, y: 0, stagger: 0.15, duration: 0.6, ease: "back.out(2)", delay: 0.5 });
    }
  }, [events.length]);

  // Reset carousel when switching selected event
  useEffect(() => {
    setCarouselIndex(0);
  }, [selectedEvent?.title]);

  const saveEvents = async (newEvents: MapEvent[], newMapImage?: string) => {
    try {
      if (timelinePageIdx === -1) return;
      const newPages = [...storybookData.pages];
      newPages[timelinePageIdx] = {
        ...newPages[timelinePageIdx],
        events: newEvents,
        mapImage: newMapImage || mapImage
      };
      const res = await fetch("/api/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ target: "storybook", data: { ...storybookData, pages: newPages } })
      });
      if (res.ok) {
        setEvents(newEvents);
        if (newMapImage) setMapImage(newMapImage);
      }
    } catch (err) {
      console.error(err);
      alert("Failed to save map");
    }
  };

  // Upload map background image
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    setIsUploading(true);
    try {
      const url = await uploadToCloudinary(e.target.files[0]);
      saveEvents(events, url);
    } catch (err) {
      alert("Upload error: " + String(err));
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  // Upload image for a specific pin
  const handlePinImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0 || !selectedEvent) return;
    setIsPinUploading(true);
    try {
      const url = await uploadToCloudinary(e.target.files[0]);
      const updatedImages = [...(selectedEvent.images || []), url];
      const updatedEvent = { ...selectedEvent, images: updatedImages };
      setSelectedEvent(updatedEvent);
      const updatedEvents = events.map(ev =>
        (ev.title === selectedEvent.title && ev.year === selectedEvent.year) ? updatedEvent : ev
      );
      await saveEvents(updatedEvents);
      setCarouselIndex(updatedImages.length - 1);
    } catch (err) {
      alert("Upload error: " + String(err));
    } finally {
      setIsPinUploading(false);
      if (pinImageInputRef.current) pinImageInputRef.current.value = "";
    }
  };

  // Remove image from a pin
  const removePinImage = (idx: number) => {
    if (!selectedEvent) return;
    const updatedImages = (selectedEvent.images || []).filter((_, i) => i !== idx);
    const updatedEvent = { ...selectedEvent, images: updatedImages };
    setSelectedEvent(updatedEvent);
    setCarouselIndex(Math.min(carouselIndex, updatedImages.length - 1));
    const updatedEvents = events.map(ev =>
      (ev.title === selectedEvent.title && ev.year === selectedEvent.year) ? updatedEvent : ev
    );
    saveEvents(updatedEvents);
  };

  const handleMapClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isEditing || selectedEvent) return;
    if (mapRef.current) {
      const rect = mapRef.current.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 100;
      const y = ((e.clientY - rect.top) / rect.height) * 100;
      const newEvent: MapEvent = {
        year: new Date().getFullYear().toString(),
        title: "New Memory",
        description: "A beautiful moment worth remembering.",
        icon: "📍",
        x,
        y,
        images: [],
      };
      const updated = [...events, newEvent];
      saveEvents(updated);
      setSelectedEvent(newEvent);
    }
  };

  const updateSelectedEvent = (updates: Partial<MapEvent>) => {
    if (!selectedEvent) return;
    const updatedEvent = { ...selectedEvent, ...updates };
    setSelectedEvent(updatedEvent);
    const updatedEvents = events.map(ev =>
      (ev.title === selectedEvent.title && ev.year === selectedEvent.year) ? updatedEvent : ev
    );
    saveEvents(updatedEvents);
  };

  const deleteSelectedEvent = () => {
    if (!selectedEvent) return;
    const updatedEvents = events.filter(ev =>
      !(ev.title === selectedEvent.title && ev.year === selectedEvent.year)
    );
    saveEvents(updatedEvents);
    setSelectedEvent(null);
  };

  const pinImages = selectedEvent?.images || [];

  return (
    <div ref={containerRef} className="absolute inset-0 bg-[#e6d5c3] overflow-hidden flex flex-col select-none">
      <div className="absolute top-8 left-0 right-0 z-20 text-center pointer-events-none drop-shadow-md">
        <h2 className="text-4xl text-ink font-bold animate-fade-in-up" style={{ fontFamily: "var(--font-heading)" }}>
          Map of Memories
        </h2>
        <div className="mt-4 pointer-events-auto flex items-center justify-center gap-4">
          <button
            onClick={() => setIsEditing(!isEditing)}
            className={`px-6 py-2 rounded-full font-semibold transition-colors shadow-md animate-fade-in-up ${isEditing ? "bg-gold text-white" : "bg-cream border border-gold text-gold"}`}
          >
            {isEditing ? "Done Editing" : "Edit Map"}
          </button>

          {isEditing && (
            <div>
              <input type="file" accept="image/*" ref={fileInputRef} onChange={handleFileUpload} className="hidden" id="map-bg-upload" />
              <label
                htmlFor="map-bg-upload"
                className={`cursor-pointer px-6 py-2 rounded-full font-semibold transition-colors shadow-md animate-fade-in-up bg-white text-rose-deep border border-rose/30 flex items-center gap-2 ${isUploading ? "opacity-50 pointer-events-none" : "hover:bg-rose/10"}`}
              >
                {isUploading ? "Uploading..." : "Change Map Image"}
              </label>
            </div>
          )}
        </div>
        {isEditing && (
          <p className="mt-2 text-rose-deep font-semibold bg-cream/70 inline-block px-4 py-1 rounded-full text-sm">
            Click anywhere on the map to add a pin. Click a pin to edit.
          </p>
        )}
      </div>

      {/* Map Container */}
      <div className="flex-1 overflow-auto relative touch-pan-x touch-pan-y timeline-scroll" style={{ scrollBehavior: "smooth" }}>
        <div
          ref={mapRef}
          className="relative w-[150vw] h-[150vh] md:w-[120vw] md:h-[120vh] cursor-crosshair"
          style={{ minWidth: "1000px", minHeight: "800px" }}
          onClick={handleMapClick}
        >
          {/* Map Background */}
          <div className="absolute inset-0 pointer-events-none">
            <Image src={mapImage} alt="Map Scenery" fill className="object-cover opacity-80" unoptimized />
          </div>
          <div className="absolute inset-0 bg-gradient-to-br from-rose-deep/10 to-gold/10 pointer-events-none mix-blend-overlay" />

          {/* Interactive Pins */}
          {events.map((ev, i) => (
            <button
              key={i}
              data-pin
              onClick={(e) => { e.stopPropagation(); setSelectedEvent(ev); }}
              className={`absolute w-12 h-14 -ml-6 -mt-14 flex flex-col items-center justify-end group transition-transform z-10 hover:scale-110 ${isEditing ? "animate-pulse" : ""}`}
              style={{ left: `${ev.x}%`, top: `${ev.y}%` }}
            >
              {/* Photo badge */}
              {(ev.images?.length ?? 0) > 0 && (
                <div className="absolute -top-1 -right-1 bg-rose-deep text-white text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center z-20 shadow">
                  {ev.images!.length}
                </div>
              )}
              <div className="bg-cream border-2 border-rose-deep rounded-full w-10 h-10 flex items-center justify-center text-lg shadow-lg relative z-10">
                {ev.icon}
              </div>
              <div className="w-1 h-3 bg-rose-deep -mt-1 rounded-b" />
              <div className="absolute -bottom-1 w-6 h-2 bg-black/30 blur-[2px] rounded-[100%]" />
              {!isEditing && (
                <div className="absolute top-[-40px] whitespace-nowrap bg-ink/80 text-cream px-3 py-1 rounded text-xs opacity-0 group-hover:opacity-100 transition-opacity" style={{ fontFamily: "var(--font-heading)" }}>
                  {ev.year}
                </div>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Pin Detail / Edit Modal */}
      {selectedEvent && (
        <div className="absolute inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setSelectedEvent(null)} />

          <div className="relative w-full max-w-2xl bg-cream rounded-2xl shadow-2xl animate-fade-in-up overflow-hidden flex flex-col max-h-[90vh]">

            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gold/30 bg-parchment shrink-0">
              <div className="flex items-center gap-3">
                <span className="text-3xl">{selectedEvent.icon}</span>
                <div>
                  <div className="text-xs uppercase tracking-widest text-gold-dark font-semibold">{selectedEvent.year}</div>
                  <h3 className="text-xl text-rose-deep font-semibold" style={{ fontFamily: "var(--font-heading)" }}>{selectedEvent.title}</h3>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {!isEditing && (
                  <button
                    onClick={() => setIsEditing(true)}
                    className="px-4 py-1.5 bg-gold/20 text-gold-dark rounded-full text-sm font-semibold hover:bg-gold/30 transition-colors"
                  >
                    ✎ Edit
                  </button>
                )}
                <button
                  onClick={() => setSelectedEvent(null)}
                  className="w-8 h-8 flex items-center justify-center rounded-full bg-cream/70 text-ink hover:bg-cream transition-colors"
                >✕</button>
              </div>
            </div>

            {/* Scrollable body */}
            <div className="overflow-y-auto flex-1 custom-scrollbar">

              {/* ── VIEW MODE ── */}
              {!isEditing && (
                <div className="p-6">
                  {/* Photo Carousel */}
                  {pinImages.length > 0 ? (
                    <div className="mb-6">
                      {/* Main image */}
                      <div className="relative rounded-xl overflow-hidden aspect-[4/3] bg-black/5 mb-3 shadow-md">
                        <img
                          src={pinImages[carouselIndex]}
                          alt=""
                          key={carouselIndex}
                          className="w-full h-full object-cover animate-fade-in"
                        />
                        {pinImages.length > 1 && (
                          <>
                            <button
                              onClick={() => setCarouselIndex(p => (p - 1 + pinImages.length) % pinImages.length)}
                              className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 bg-black/40 hover:bg-black/60 text-white rounded-full flex items-center justify-center backdrop-blur-sm transition-colors"
                            >❮</button>
                            <button
                              onClick={() => setCarouselIndex(p => (p + 1) % pinImages.length)}
                              className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 bg-black/40 hover:bg-black/60 text-white rounded-full flex items-center justify-center backdrop-blur-sm transition-colors"
                            >❯</button>
                            <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-1.5">
                              {pinImages.map((_, i) => (
                                <button
                                  key={i}
                                  onClick={() => setCarouselIndex(i)}
                                  className={`rounded-full transition-all ${i === carouselIndex ? "w-5 h-2 bg-white" : "w-2 h-2 bg-white/50"}`}
                                />
                              ))}
                            </div>
                          </>
                        )}
                      </div>

                      {/* Thumbnail strip */}
                      {pinImages.length > 1 && (
                        <div className="flex gap-2 overflow-x-auto pb-1">
                          {pinImages.map((url, i) => (
                            <button
                              key={i}
                              onClick={() => setCarouselIndex(i)}
                              className={`shrink-0 w-14 h-14 rounded-lg overflow-hidden border-2 transition-all ${i === carouselIndex ? "border-rose-deep shadow-md scale-105" : "border-transparent opacity-60 hover:opacity-100"}`}
                            >
                              <img src={url} alt="" className="w-full h-full object-cover" />
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="mb-6 rounded-xl border-2 border-dashed border-gold/30 bg-gold/5 flex flex-col items-center justify-center py-10 text-center">
                      <span className="text-4xl mb-2">📷</span>
                      <p className="text-ink-light text-sm">No photos yet</p>
                      <button
                        onClick={() => setIsEditing(true)}
                        className="mt-3 text-xs text-rose-deep underline hover:no-underline"
                      >Add memories →</button>
                    </div>
                  )}

                  {/* Description */}
                  <p className="text-ink text-sm leading-relaxed" style={{ fontFamily: "var(--font-body)" }}>
                    {selectedEvent.description}
                  </p>
                </div>
              )}

              {/* ── EDIT MODE ── */}
              {isEditing && (
                <div className="p-6 space-y-5">
                  {/* Basic fields */}
                  <div className="flex gap-4">
                    <div className="flex-1">
                      <label className="block text-xs text-ink mb-1 font-semibold uppercase tracking-wider">Icon (Emoji)</label>
                      <input
                        className="w-full p-2.5 rounded-xl border-2 border-gold/20 bg-white focus:border-gold/50 focus:outline-none transition-colors"
                        value={selectedEvent.icon}
                        onChange={e => updateSelectedEvent({ icon: e.target.value })}
                      />
                    </div>
                    <div className="flex-1">
                      <label className="block text-xs text-ink mb-1 font-semibold uppercase tracking-wider">Year / Date</label>
                      <input
                        className="w-full p-2.5 rounded-xl border-2 border-gold/20 bg-white focus:border-gold/50 focus:outline-none transition-colors"
                        value={selectedEvent.year}
                        onChange={e => updateSelectedEvent({ year: e.target.value })}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs text-ink mb-1 font-semibold uppercase tracking-wider">Title</label>
                    <input
                      className="w-full p-2.5 rounded-xl border-2 border-gold/20 bg-white focus:border-gold/50 focus:outline-none transition-colors"
                      value={selectedEvent.title}
                      onChange={e => updateSelectedEvent({ title: e.target.value })}
                    />
                  </div>

                  <div>
                    <label className="block text-xs text-ink mb-1 font-semibold uppercase tracking-wider">Description</label>
                    <textarea
                      className="w-full p-2.5 rounded-xl border-2 border-gold/20 bg-white resize-none focus:border-gold/50 focus:outline-none transition-colors"
                      rows={3}
                      value={selectedEvent.description}
                      onChange={e => updateSelectedEvent({ description: e.target.value })}
                    />
                  </div>

                  {/* Photos Section */}
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <label className="text-xs text-ink font-semibold uppercase tracking-wider">Memory Photos</label>
                      <span className="text-xs font-bold bg-gold/20 text-gold-dark px-2.5 py-0.5 rounded-full">
                        {pinImages.length} photo{pinImages.length !== 1 ? "s" : ""}
                      </span>
                    </div>

                    {/* Upload drop zone */}
                    <div className="bg-white rounded-xl border-2 border-dashed border-gold/40 p-5 text-center mb-4 hover:bg-cream/50 transition-colors">
                      <input
                        type="file"
                        accept="image/*"
                        ref={pinImageInputRef}
                        onChange={handlePinImageUpload}
                        className="hidden"
                        id="pin-image-upload"
                      />
                      <label htmlFor="pin-image-upload" className={`cursor-pointer flex flex-col items-center gap-2 ${isPinUploading ? "opacity-50 pointer-events-none" : ""}`}>
                        <div className="w-12 h-12 bg-rose/10 text-rose-deep rounded-full flex items-center justify-center">
                          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                            <polyline points="17 8 12 3 7 8" />
                            <line x1="12" y1="3" x2="12" y2="15" />
                          </svg>
                        </div>
                        <span className="text-ink font-semibold text-sm">
                          {isPinUploading ? "Uploading..." : "Click to Add Photo"}
                        </span>
                        <span className="text-ink-light text-xs">Upload from your device</span>
                      </label>
                    </div>

                    {/* Photo grid */}
                    {pinImages.length > 0 && (
                      <div className="grid grid-cols-3 gap-2">
                        {pinImages.map((url, idx) => (
                          <div key={idx} className="relative group aspect-square rounded-xl overflow-hidden border-2 border-gold/20 shadow-sm">
                            <img src={url} alt="" className="w-full h-full object-cover" />
                            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                              <button
                                onClick={() => removePinImage(idx)}
                                className="bg-red-500 hover:bg-red-600 text-white p-2 rounded-full transform scale-90 group-hover:scale-100 transition-transform"
                              >
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                  <polyline points="3 6 5 6 21 6" />
                                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                                </svg>
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex justify-between pt-4 border-t border-gold/20">
                    <button
                      onClick={deleteSelectedEvent}
                      className="px-4 py-2 bg-red-100 text-red-600 rounded-full font-semibold text-sm hover:bg-red-200 transition-colors"
                    >
                      Delete Pin
                    </button>
                    <button
                      onClick={() => setIsEditing(false)}
                      className="px-6 py-2 bg-gold text-white rounded-full font-semibold text-sm hover:bg-gold-dark transition-colors"
                    >
                      Done
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
