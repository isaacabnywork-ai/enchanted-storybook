"use client";

import { useState, useEffect } from "react";
import PasswordGate from "@/components/PasswordGate";
import StoryBook from "@/components/StoryBook";
import FullScreenMenu, { AppView } from "@/components/FullScreenMenu";
import PhotoGallery from "@/components/PhotoGallery";
import MapOfMemories from "@/components/MapOfMemories";
import SpecialDates from "@/components/SpecialDates";
import MessageInABottle from "@/components/MessageInABottle";
import SoundscapeToggle from "@/components/SoundscapeToggle";


export default function Home() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentView, setCurrentView] = useState<AppView>("storybook");
  
  const [isLoading, setIsLoading] = useState(true);
  const [storybookData, setStorybookData] = useState<any>(null);
  const [appData, setAppData] = useState<any>(null);

  useEffect(() => {
    let mounted = true;
    fetch("/api/load")
      .then(res => res.json())
      .then(data => {
        if (mounted && data.storybookData && data.appData) {
          setStorybookData(data.storybookData);
          setAppData(data.appData);
          setIsLoading(false);
        }
      })
      .catch(err => {
        console.error("Load error:", err);
        setIsLoading(false);
      });
    return () => { mounted = false; };
  }, []);

  if (isLoading || !storybookData || !appData) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center parchment">
        <div className="text-gold text-4xl mb-4 animate-pulse">✦ ✧ ✦</div>
        <p className="text-rose-deep" style={{ fontFamily: "var(--font-heading)" }}>Opening the enchanted book...</p>
      </div>
    );
  }

  return (
    <main id="app-root" className="w-full h-full relative transition-colors duration-1000">
      {!isAuthenticated ? (
        <PasswordGate
          password={storybookData.book.password}
          onSuccess={() => setIsAuthenticated(true)}
        />
      ) : (
        <>
          <FullScreenMenu currentView={currentView} onChangeView={setCurrentView} />
          <SoundscapeToggle />
          
          <div className="w-full h-full relative">
            {currentView === "storybook" && (
              <>
                <StoryBook pages={storybookData.pages} storybookData={storybookData} />
                {appData.dailyNotes && appData.dailyNotes.length > 0 && (
                  <div className="absolute top-6 left-1/2 transform -translate-x-1/2 z-[40] animate-fade-in-up drop-shadow-md transition-transform hover:scale-105 pointer-events-auto">
                    <div 
                      className="bg-cream/90 backdrop-blur-md border border-gold/40 rounded-xl px-6 py-3 flex flex-col items-center shadow-lg cursor-pointer max-w-sm text-center" 
                      onClick={() => setCurrentView("bottle")}
                    >
                      <span className="text-[10px] font-bold text-gold tracking-widest uppercase mb-1" style={{ fontFamily: "var(--font-heading)" }}>Daily Thought</span>
                      <p className="text-rose-deep text-lg" style={{ fontFamily: "var(--font-handwriting)" }}>"{appData.dailyNotes[appData.dailyNotes.length - 1].message}"</p>
                    </div>
                  </div>
                )}
              </>
            )}
            {currentView === "gallery" && (
              <PhotoGallery appData={appData} />
            )}
            {currentView === "timeline" && (
              <MapOfMemories storybookData={storybookData} />
            )}
            {currentView === "dates" && (
              <SpecialDates appData={appData} />
            )}
            {currentView === "bottle" && (
              <MessageInABottle appData={appData} />
            )}
          </div>
        </>
      )}
    </main>
  );
}
