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
}

interface MapOfMemoriesProps {
  storybookData: any;
}

export default function MapOfMemories({ storybookData }: MapOfMemoriesProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<HTMLDivElement>(null);
  const [selectedEvent, setSelectedEvent] = useState<MapEvent | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [events, setEvents] = useState<MapEvent[]>([]);
  const [mapImage, setMapImage] = useState("/uploads/1781844965142-Pink_scenery_bg_.webp");
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Find the timeline page to sync with
  const timelinePageIdx = storybookData.pages.findIndex((p: any) => p.type === "timeline");

  useEffect(() => {
    // Extract events, assign default x,y if missing
    if (timelinePageIdx !== -1) {
      const pageEvents = storybookData.pages[timelinePageIdx].events || [];
      const positions = [
        { x: 20, y: 30 }, { x: 50, y: 20 }, { x: 70, y: 50 }, { x: 40, y: 70 }, { x: 80, y: 80 }
      ];
      const parsedEvents = pageEvents.map((e: any, index: number) => ({
        ...e,
        x: e.x !== undefined ? e.x : positions[index % positions.length].x,
        y: e.y !== undefined ? e.y : positions[index % positions.length].y,
      }));
      setEvents(parsedEvents);
      
      const firestoreImage = storybookData.pages[timelinePageIdx].mapImage;
      if (firestoreImage && firestoreImage !== "https://images.unsplash.com/photo-1506744626753-df839199d501?auto=format&fit=crop&q=80&w=2000" && firestoreImage !== "/uploads/1781844965142-Pink_scenery_bg_.webp") {
        setMapImage(firestoreImage);
      } else {
        setMapImage("https://images.unsplash.com/photo-1522383225653-ed111181a951?auto=format&fit=crop&q=80&w=2000");
        // Automatically trigger a save to update Firestore with the new image
        setTimeout(() => {
          saveEvents(parsedEvents, "https://images.unsplash.com/photo-1522383225653-ed111181a951?auto=format&fit=crop&q=80&w=2000");
        }, 1000);
      }
    }
  }, [timelinePageIdx, storybookData.pages]);

  useEffect(() => {
    if (containerRef.current) {
      gsap.fromTo(
        containerRef.current,
        { opacity: 0 },
        { opacity: 1, duration: 1, ease: "power2.out" }
      );
      
      const pins = containerRef.current.querySelectorAll("[data-pin]");
      gsap.fromTo(
        pins,
        { scale: 0, y: -20 },
        { scale: 1, y: 0, stagger: 0.15, duration: 0.6, ease: "back.out(2)", delay: 0.5 }
      );
    }
  }, [events.length]);

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
        body: JSON.stringify({
          target: "storybook",
          data: { ...storybookData, pages: newPages }
        })
      });
      if (res.ok) {
        setEvents(newEvents);
        if (newMapImage) setMapImage(newMapImage);
      }
    } catch (err) {
      console.error(err);
      alert("Failed to save map events");
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;

    setIsUploading(true);
    const file = e.target.files[0];

    try {
      // Upload directly from browser to Cloudinary (bypasses Vercel limits)
      const CLOUD_NAME = "dmbzkiclm";
      const UPLOAD_PRESET = "ml_default";

      const formData = new FormData();
      formData.append("file", file);
      formData.append("upload_preset", UPLOAD_PRESET);
      formData.append("folder", "enchanted-storybook");

      const res = await fetch(
        `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`,
        { method: "POST", body: formData }
      );
      const data = await res.json();

      if (data.secure_url) {
        saveEvents(events, data.secure_url);
      } else {
        console.error("Cloudinary error:", data);
        alert("Upload failed: " + (data.error?.message || JSON.stringify(data)));
      }
    } catch (err) {
      console.error(err);
      alert("Upload error: " + String(err));
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleMapClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isEditing || selectedEvent) return;
    
    // Add new pin at click location
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
        y
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
              <input 
                type="file" 
                accept="image/*" 
                ref={fileInputRef}
                onChange={handleFileUpload}
                className="hidden"
                id="map-bg-upload"
              />
              <label 
                htmlFor="map-bg-upload"
                className={`cursor-pointer px-6 py-2 rounded-full font-semibold transition-colors shadow-md animate-fade-in-up bg-white text-rose-deep border border-rose/30 flex items-center gap-2 ${isUploading ? 'opacity-50 pointer-events-none' : 'hover:bg-rose/10'}`}
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

      {/* Map Container (Scrollable/Draggable area) */}
      <div className="flex-1 overflow-auto relative touch-pan-x touch-pan-y timeline-scroll" style={{ scrollBehavior: 'smooth' }}>
        <div 
          ref={mapRef}
          className="relative w-[150vw] h-[150vh] md:w-[120vw] md:h-[120vh] cursor-crosshair"
          style={{ minWidth: "1000px", minHeight: "800px" }}
          onClick={handleMapClick}
        >
          {/* Map Background */}
          <div className="absolute inset-0 pointer-events-none" style={{ backgroundImage: `url('${mapImage}')` }}>
            <Image
              src={mapImage}
              alt="Map Scenery"
              fill
              className="object-cover opacity-80"
              unoptimized
            />
          </div>
          
          {/* Overlay to tint the map */}
          <div className="absolute inset-0 bg-gradient-to-br from-rose-deep/10 to-gold/10 pointer-events-none mix-blend-overlay" />

          {/* Interactive Pins */}
          {events.map((ev, i) => (
            <button
              key={i}
              data-pin
              onClick={(e) => {
                e.stopPropagation();
                setSelectedEvent(ev);
              }}
              className={`absolute w-12 h-12 -ml-6 -mt-12 flex flex-col items-center justify-end group transition-transform z-10 hover:scale-110 ${isEditing ? "animate-pulse" : ""}`}
              style={{ left: `${ev.x}%`, top: `${ev.y}%` }}
            >
              <div className="bg-cream border-2 border-rose-deep rounded-full w-10 h-10 flex items-center justify-center text-lg shadow-lg relative z-10">
                {ev.icon}
              </div>
              <div className="w-1 h-3 bg-rose-deep -mt-1 rounded-b" />
              <div className="absolute -bottom-1 w-6 h-2 bg-black/30 blur-[2px] rounded-[100%]" />
              
              {/* Tooltip on hover */}
              {!isEditing && (
                <div className="absolute top-[-40px] whitespace-nowrap bg-ink/80 text-cream px-3 py-1 rounded text-xs opacity-0 group-hover:opacity-100 transition-opacity" style={{ fontFamily: "var(--font-heading)" }}>
                  {ev.year}
                </div>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Detail Modal / Edit Modal */}
      {selectedEvent && (
        <div className="absolute inset-0 z-50 flex items-center justify-center p-4">
          <div 
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setSelectedEvent(null)}
          />
          <div className="relative w-full max-w-md glass-card rounded-2xl p-6 shadow-2xl animate-fade-in-up">
            <button 
              onClick={() => setSelectedEvent(null)}
              className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full bg-cream/50 text-ink hover:bg-cream transition-colors"
            >
              ✕
            </button>
            
            {isEditing ? (
              <div className="flex flex-col gap-4 mt-4">
                <h3 className="text-xl text-rose-deep font-semibold border-b border-gold/30 pb-2 mb-2" style={{ fontFamily: "var(--font-heading)" }}>Edit Memory Pin</h3>
                
                <div className="flex gap-4">
                  <div className="flex-1">
                    <label className="block text-xs text-ink mb-1 font-semibold uppercase">Icon (Emoji)</label>
                    <input 
                      className="w-full p-2 rounded border border-gold/40 bg-white"
                      value={selectedEvent.icon}
                      onChange={e => updateSelectedEvent({ icon: e.target.value })}
                    />
                  </div>
                  <div className="flex-1">
                    <label className="block text-xs text-ink mb-1 font-semibold uppercase">Year / Date</label>
                    <input 
                      className="w-full p-2 rounded border border-gold/40 bg-white"
                      value={selectedEvent.year}
                      onChange={e => updateSelectedEvent({ year: e.target.value })}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs text-ink mb-1 font-semibold uppercase">Title</label>
                  <input 
                    className="w-full p-2 rounded border border-gold/40 bg-white"
                    value={selectedEvent.title}
                    onChange={e => updateSelectedEvent({ title: e.target.value })}
                  />
                </div>

                <div>
                  <label className="block text-xs text-ink mb-1 font-semibold uppercase">Description</label>
                  <textarea 
                    className="w-full p-2 rounded border border-gold/40 bg-white resize-none"
                    rows={3}
                    value={selectedEvent.description}
                    onChange={e => updateSelectedEvent({ description: e.target.value })}
                  />
                </div>

                <div className="flex justify-between mt-2 pt-4 border-t border-gold/20">
                  <button 
                    onClick={deleteSelectedEvent}
                    className="px-4 py-2 bg-red-100 text-red-600 rounded font-semibold text-sm hover:bg-red-200 transition-colors"
                  >
                    Delete Pin
                  </button>
                  <button 
                    onClick={() => setSelectedEvent(null)}
                    className="px-6 py-2 bg-rose text-white rounded font-semibold text-sm hover:bg-rose-deep transition-colors"
                  >
                    Done
                  </button>
                </div>
              </div>
            ) : (
              <div className="text-center mb-4 mt-2">
                <span className="inline-block text-4xl mb-2">{selectedEvent.icon}</span>
                <div className="text-sm uppercase tracking-widest text-gold-dark mb-1" style={{ fontFamily: "var(--font-heading)" }}>
                  {selectedEvent.year}
                </div>
                <h3 className="text-2xl text-rose-deep font-semibold" style={{ fontFamily: "var(--font-heading)" }}>
                  {selectedEvent.title}
                </h3>
                <p className="text-ink-light mt-4 text-sm leading-relaxed text-center" style={{ fontFamily: "var(--font-body)" }}>
                  {selectedEvent.description}
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
