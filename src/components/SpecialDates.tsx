"use client";

import { useEffect, useRef, useState } from "react";
import gsap from "gsap";


interface SpecialDatesProps {
  appData: any;
}

export default function SpecialDates({ appData }: SpecialDatesProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [dates, setDates] = useState(appData.specialDates || []);
  const [isAdding, setIsAdding] = useState(false);
  const [newDate, setNewDate] = useState({ date: "", title: "", description: "" });
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (containerRef.current) {
      const items = containerRef.current.querySelectorAll(".date-card");
      gsap.fromTo(
        items,
        { opacity: 0, y: 20 },
        { opacity: 1, y: 0, stagger: 0.1, duration: 0.6, ease: "power2.out" }
      );
    }
  }, [dates]);

  const handleSave = async () => {
    if (!newDate.date || !newDate.title) return;
    setIsSaving(true);
    
    const updatedDates = [...dates, { id: `date-${Date.now()}`, ...newDate }];
    
    // Sort chronologically
    updatedDates.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    try {
      const res = await fetch("/api/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          target: "appData",
          data: { ...appData, specialDates: updatedDates }
        })
      });

      if (res.ok) {
        setDates(updatedDates);
        setIsAdding(false);
        setNewDate({ date: "", title: "", description: "" });
      } else {
        alert("Failed to save the date.");
      }
    } catch (error) {
      console.error(error);
      alert("Error saving date.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="w-full h-full bg-cream overflow-y-auto p-8 md:p-12 pb-32">
      <div className="max-w-4xl mx-auto" ref={containerRef}>
        <div className="text-center mb-16 relative">
          <h1 className="text-4xl md:text-5xl text-rose-deep mb-4" style={{ fontFamily: "var(--font-heading)" }}>
            Special Dates
          </h1>
          <div className="flex items-center justify-center gap-4">
            <div className="w-16 h-px bg-gold-light" />
            <span className="text-gold text-xl">🗓</span>
            <div className="w-16 h-px bg-gold-light" />
          </div>
          
          <button 
            onClick={() => setIsAdding(!isAdding)}
            className="mt-8 px-6 py-2 rounded-full border border-gold text-gold hover:bg-gold/10 transition-colors"
            style={{ fontFamily: "var(--font-heading)" }}
          >
            {isAdding ? "Cancel" : "+ Add Special Date"}
          </button>
        </div>

        {/* Add Date Form */}
        {isAdding && (
          <div className="mb-12 glass-card p-6 rounded-2xl max-w-2xl mx-auto animate-fade-in-up">
            <h3 className="text-xl text-rose-deep mb-4" style={{ fontFamily: "var(--font-heading)" }}>Add a Memory</h3>
            <div className="space-y-4">
              <input 
                type="date" 
                value={newDate.date}
                onChange={e => setNewDate({...newDate, date: e.target.value})}
                className="w-full p-3 rounded-lg border border-gold-light/50 bg-cream/50 text-ink focus:outline-none focus:border-gold"
              />
              <input 
                type="text" 
                placeholder="Title (e.g. Our First Anniversary)"
                value={newDate.title}
                onChange={e => setNewDate({...newDate, title: e.target.value})}
                className="w-full p-3 rounded-lg border border-gold-light/50 bg-cream/50 text-ink focus:outline-none focus:border-gold"
              />
              <textarea 
                placeholder="Description of the day..."
                value={newDate.description}
                onChange={e => setNewDate({...newDate, description: e.target.value})}
                className="w-full p-3 rounded-lg border border-gold-light/50 bg-cream/50 text-ink focus:outline-none focus:border-gold min-h-[100px]"
              />
              <button 
                onClick={handleSave}
                disabled={isSaving || !newDate.date || !newDate.title}
                className="w-full py-3 rounded-lg bg-rose-deep text-white hover:bg-rose-dark transition-colors disabled:opacity-50"
              >
                {isSaving ? "Saving..." : "Save Date"}
              </button>
            </div>
          </div>
        )}

        {/* Dates List */}
        <div className="space-y-6 max-w-2xl mx-auto">
          {dates.map((dateObj: any) => {
            const date = new Date(dateObj.date);
            const month = date.toLocaleString('default', { month: 'short' });
            const day = date.getDate();
            const year = date.getFullYear();

            return (
              <div key={dateObj.id} className="date-card glass-card p-6 rounded-2xl flex gap-6 items-center hover:-translate-y-1 transition-transform duration-300">
                {/* Date Badge */}
                <div className="flex flex-col items-center justify-center w-20 h-20 rounded-xl bg-gradient-to-br from-rose/20 to-gold/10 border border-gold/20 flex-shrink-0 shadow-inner">
                  <span className="text-sm font-semibold text-rose-deep uppercase tracking-widest">{month}</span>
                  <span className="text-2xl text-ink font-bold" style={{ fontFamily: "var(--font-heading)" }}>{day}</span>
                  <span className="text-xs text-ink-faint">{year}</span>
                </div>
                
                {/* Content */}
                <div>
                  <h3 className="text-xl text-rose-deep mb-2" style={{ fontFamily: "var(--font-heading)", fontWeight: 600 }}>
                    {dateObj.title}
                  </h3>
                  <p className="text-ink-light text-sm leading-relaxed" style={{ fontFamily: "var(--font-body)" }}>
                    {dateObj.description}
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
