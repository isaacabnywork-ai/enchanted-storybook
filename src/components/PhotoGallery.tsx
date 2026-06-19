"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import gsap from "gsap";

import MemoryMatch from "@/components/MemoryMatch";

type GalleryItem = {
  id: string;
  src: string;
  caption: string;
  images?: string[];
};

interface PhotoGalleryProps {
  appData: any;
}

export default function PhotoGallery({ appData }: PhotoGalleryProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [gallery, setGallery] = useState<GalleryItem[]>(appData.gallery || []);
  const [selectedImage, setSelectedImage] = useState<GalleryItem | null>(null);
  const [carouselIndex, setCarouselIndex] = useState(0);
  const [showGame, setShowGame] = useState(false);
  const [isEditingGlobal, setIsEditingGlobal] = useState(false);
  
  // Edit states
  const [isEditingAlbum, setIsEditingAlbum] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (containerRef.current) {
      const items = containerRef.current.querySelectorAll(".gallery-item");
      gsap.fromTo(
        items,
        { opacity: 0, y: 30, scale: 0.95 },
        { opacity: 1, y: 0, scale: 1, stagger: 0.1, duration: 0.8, ease: "power3.out" }
      );
    }
  }, [gallery]);

  const handleOpenAlbum = (img: GalleryItem) => {
    if (isEditingGlobal) {
      setSelectedImage(img);
      setIsEditingAlbum(true);
    } else {
      setSelectedImage(img);
      setCarouselIndex(0);
      setIsEditingAlbum(false);
    }
  };

  const closeOverlay = () => {
    setSelectedImage(null);
    setCarouselIndex(0);
    setIsEditingAlbum(false);
  };

  const nextSlide = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (selectedImage?.images) {
      setCarouselIndex((prev) => (prev + 1) % selectedImage.images!.length);
    }
  };

  const prevSlide = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (selectedImage?.images) {
      setCarouselIndex((prev) => (prev - 1 + selectedImage.images!.length) % selectedImage.images!.length);
    }
  };

  const saveGallery = async (newGallery: GalleryItem[]) => {
    try {
      const res = await fetch("/api/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          target: "appData",
          data: { ...appData, gallery: newGallery }
        })
      });
      if (res.ok) {
        setGallery(newGallery);
      }
    } catch (err) {
      console.error(err);
      alert("Failed to save gallery");
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0 || !selectedImage) return;

    setIsUploading(true);
    const file = e.target.files[0];

    try {
      // Upload directly from browser to Cloudinary (no server bottleneck)
      // Cloud name is public info — hardcoded for reliability
      const CLOUD_NAME = "dmbzkiclm";
      const UPLOAD_PRESET = "ml_default";

      console.log("[Upload] Starting direct Cloudinary upload...");

      const formData = new FormData();
      formData.append("file", file);
      formData.append("upload_preset", UPLOAD_PRESET);
      formData.append("folder", "enchanted-storybook");

      const res = await fetch(
        `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`,
        { method: "POST", body: formData }
      );

      const data = await res.json();
      console.log("[Upload] Cloudinary response:", data);

      if (data.secure_url) {
        const newImages = [...(selectedImage.images || [selectedImage.src]), data.secure_url];
        const updated = gallery.map(g =>
          g.id === selectedImage.id ? { ...g, images: newImages, src: newImages[0] } : g
        );
        saveGallery(updated);
        setSelectedImage({ ...selectedImage, images: newImages, src: newImages[0] });
      } else {
        console.error("Cloudinary error:", data);
        alert("Upload failed: " + (data.error?.message || JSON.stringify(data)));
      }
    } catch (err) {
      console.error("[Upload] Exception:", err);
      alert("Upload error: " + String(err));
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const removeImageFromMemory = (idx: number) => {
    if (!selectedImage || !selectedImage.images) return;
    const newImages = selectedImage.images.filter((_, i) => i !== idx);
    if (newImages.length === 0) return; // Don't allow empty memories
    const updated = gallery.map(g => g.id === selectedImage.id ? { ...g, images: newImages, src: newImages[0] } : g);
    saveGallery(updated);
    setSelectedImage({ ...selectedImage, images: newImages, src: newImages[0] });
    setCarouselIndex(0);
  };

  const updateCaption = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!selectedImage) return;
    const updated = gallery.map(g => g.id === selectedImage.id ? { ...g, caption: e.target.value } : g);
    saveGallery(updated);
    setSelectedImage({ ...selectedImage, caption: e.target.value });
  };

  const addNewMemory = () => {
    const id = `mem-${Date.now()}`;
    const newMemory: GalleryItem = {
      id,
      src: "https://images.unsplash.com/photo-1518568814500-bf0f8d125f46?auto=format&fit=crop&q=80&w=600",
      images: ["https://images.unsplash.com/photo-1518568814500-bf0f8d125f46?auto=format&fit=crop&q=80&w=600"],
      caption: "New Memory Album"
    };
    const updatedGallery = [...gallery, newMemory];
    saveGallery(updatedGallery);
    // Automatically open in edit mode
    setSelectedImage(newMemory);
    setIsEditingAlbum(true);
  };

  const deleteAlbum = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (!selectedImage) return;
    if (confirm("Are you sure you want to delete this entire album?")) {
      const updated = gallery.filter(g => g.id !== selectedImage.id);
      saveGallery(updated);
      closeOverlay();
    }
  };

  return (
    <div className="w-full h-full bg-cream overflow-y-auto p-8 md:p-12 pb-32">
      <div className="max-w-6xl mx-auto" ref={containerRef}>
        <div className="text-center mb-16 relative">
          <h1 className="text-4xl md:text-5xl text-rose-deep mb-4" style={{ fontFamily: "var(--font-heading)" }}>
            Our Memories
          </h1>
          <div className="flex items-center justify-center gap-4 mb-8">
            <div className="w-16 h-px bg-gold-light" />
            <span className="text-gold text-xl">✦</span>
            <div className="w-16 h-px bg-gold-light" />
          </div>
          
          <div className="flex justify-center gap-4 flex-wrap">
            <button 
              onClick={() => setShowGame(true)}
              className="px-6 py-2 bg-rose-deep text-white rounded-full font-semibold hover:bg-rose transition-colors shadow-md animate-fade-in-up"
            >
              Play Memory Match
            </button>
            <button 
              onClick={() => setIsEditingGlobal(!isEditingGlobal)}
              className={`px-6 py-2 rounded-full font-semibold transition-colors shadow-md animate-fade-in-up ${isEditingGlobal ? "bg-gold text-white" : "bg-cream border border-gold text-gold"}`}
            >
              {isEditingGlobal ? "Done Editing" : "Manage Albums"}
            </button>
          </div>
        </div>

        {isEditingGlobal && (
          <div className="mb-8 text-center animate-fade-in">
            <button 
              onClick={addNewMemory}
              className="px-6 py-3 bg-rose/10 text-rose-deep border border-rose-deep/30 border-dashed rounded-xl font-semibold hover:bg-rose/20 transition-colors w-full max-w-sm mx-auto flex items-center justify-center gap-2"
            >
              <span className="text-2xl">+</span> Add New Memory Album
            </button>
          </div>
        )}

        {/* Uniform Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {gallery.map((img) => (
            <div
              key={img.id}
              className={`gallery-item cursor-pointer group relative ${isEditingGlobal ? "ring-2 ring-gold/50 rounded-xl" : ""}`}
              onClick={() => handleOpenAlbum(img)}
            >
              <div className="relative rounded-xl overflow-hidden shadow-md transition-all duration-300 group-hover:shadow-xl group-hover:-translate-y-1 aspect-[4/3]">
                <img
                  src={img.src}
                  alt={img.caption}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-4">
                  <p className="text-white text-sm font-medium" style={{ fontFamily: "var(--font-body)" }}>
                    {img.caption}
                  </p>
                  
                  {/* Badge showing it's a carousel/album */}
                  {img.images && img.images.length > 1 && (
                    <div className="absolute top-4 right-4 bg-black/60 text-white text-xs px-3 py-1.5 rounded-full backdrop-blur-sm flex items-center gap-2">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <rect x="3" y="3" width="18" height="18" rx="2" />
                        <circle cx="8.5" cy="8.5" r="1.5" />
                        <path d="M21 15l-5-5L5 21" />
                      </svg>
                      {img.images.length}
                    </div>
                  )}

                  {/* Quick Edit Overlay Button */}
                  {isEditingGlobal && (
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedImage(img);
                        setIsEditingAlbum(true);
                      }}
                      className="absolute top-4 left-4 bg-white/90 text-rose-deep text-xs px-3 py-1.5 rounded-full backdrop-blur-sm font-semibold hover:bg-white transition-colors"
                    >
                      Edit Album
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Lightbox / View Mode Overlay */}
      {selectedImage && !isEditingAlbum && (
        <div 
          className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/95 backdrop-blur-md animate-fade-in select-none"
          onClick={closeOverlay}
        >
          <div className="absolute top-6 right-6 flex gap-4 z-[60]">
            <button 
              className="bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-full font-semibold transition-colors backdrop-blur-sm border border-white/20 text-sm"
              onClick={(e) => {
                e.stopPropagation();
                setIsEditingAlbum(true);
              }}
            >
              ✎ Edit Album
            </button>
            <button 
              className="text-white/70 hover:text-white hover:scale-110 transition-all flex items-center justify-center w-10 h-10 bg-black/50 rounded-full"
              onClick={closeOverlay}
            >
              ✕
            </button>
          </div>

          {/* Carousel */}
          <div className="relative max-w-6xl max-h-[75vh] w-full h-full flex items-center justify-center px-12">
            {selectedImage.images && selectedImage.images.length > 1 && (
              <button 
                onClick={prevSlide}
                className="absolute left-6 z-[60] w-14 h-14 flex items-center justify-center bg-white/10 hover:bg-white/20 text-white rounded-full backdrop-blur-md transition-colors border border-white/20 text-xl shadow-lg"
              >
                ❮
              </button>
            )}

            <div className="relative w-full h-full flex justify-center items-center">
              <img 
                src={selectedImage.images ? selectedImage.images[carouselIndex] : selectedImage.src} 
                alt={selectedImage.caption}
                className="max-w-full max-h-full object-contain rounded-lg shadow-2xl animate-fade-in"
                key={carouselIndex}
              />
            </div>

            {selectedImage.images && selectedImage.images.length > 1 && (
              <button 
                onClick={nextSlide}
                className="absolute right-6 z-[60] w-14 h-14 flex items-center justify-center bg-white/10 hover:bg-white/20 text-white rounded-full backdrop-blur-md transition-colors border border-white/20 text-xl shadow-lg"
              >
                ❯
              </button>
            )}
          </div>
          
          <div className="mt-8 text-center z-[60]">
            <p className="text-white text-2xl animate-fade-in font-medium" style={{ fontFamily: "var(--font-heading)" }}>
              {selectedImage.caption}
            </p>
            {selectedImage.images && selectedImage.images.length > 1 && (
              <div className="flex gap-3 justify-center mt-6">
                {selectedImage.images.map((_, i) => (
                  <button 
                    key={i} 
                    onClick={(e) => { e.stopPropagation(); setCarouselIndex(i); }}
                    className={`h-2.5 rounded-full transition-all ${i === carouselIndex ? 'w-8 bg-white' : 'w-2.5 bg-white/40 hover:bg-white/60'}`} 
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Edit Memory Album Modal */}
      {selectedImage && isEditingAlbum && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md p-4 animate-fade-in">
          <div className="w-full max-w-4xl bg-cream rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="flex justify-between items-center p-6 border-b border-gold/30 bg-parchment">
              <h2 className="text-2xl text-rose-deep font-semibold" style={{ fontFamily: "var(--font-heading)" }}>
                Edit Album
              </h2>
              <div className="flex items-center gap-3">
                <button 
                  onClick={deleteAlbum}
                  className="px-4 py-2 bg-red-100 text-red-600 rounded-full font-semibold text-sm hover:bg-red-200 transition-colors"
                >
                  Delete Album
                </button>
                <button 
                  onClick={() => setIsEditingAlbum(false)} 
                  className="px-6 py-2 bg-gold text-white rounded-full font-semibold hover:bg-gold-dark transition-colors"
                >
                  Done
                </button>
              </div>
            </div>

            <div className="p-6 overflow-y-auto flex-1 custom-scrollbar">
              <div className="space-y-8">
                <div>
                  <label className="block text-sm text-ink mb-2 font-semibold uppercase tracking-wider">Album Caption</label>
                  <input 
                    type="text" 
                    value={selectedImage.caption} 
                    onChange={updateCaption}
                    className="w-full p-4 rounded-xl border-2 border-gold/20 bg-white focus:border-gold/50 focus:outline-none transition-colors text-lg"
                    placeholder="E.g., Our first trip to the beach..."
                  />
                </div>

                <div>
                  <div className="flex justify-between items-end mb-4">
                    <label className="block text-sm text-ink font-semibold uppercase tracking-wider">Photos in this Album</label>
                    <span className="text-xs font-bold bg-gold/20 text-gold-dark px-3 py-1 rounded-full">
                      {selectedImage.images?.length || 1} Photos
                    </span>
                  </div>

                  {/* Add New Photo area */}
                  <div className="bg-white p-6 rounded-xl border-2 border-dashed border-gold/40 mb-6 flex flex-col items-center justify-center text-center hover:bg-cream/50 transition-colors">
                    <input 
                      type="file" 
                      accept="image/*" 
                      ref={fileInputRef}
                      onChange={handleFileUpload}
                      className="hidden"
                      id="file-upload"
                    />
                    <label 
                      htmlFor="file-upload"
                      className="cursor-pointer flex flex-col items-center"
                    >
                      <div className="w-16 h-16 bg-rose/10 text-rose-deep rounded-full flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                          <polyline points="17 8 12 3 7 8"></polyline>
                          <line x1="12" y1="3" x2="12" y2="15"></line>
                        </svg>
                      </div>
                      <span className="text-ink font-semibold text-lg">Click to Add Photo</span>
                      <span className="text-ink-light text-sm mt-1">Upload from your device</span>
                    </label>
                    {isUploading && (
                      <div className="mt-4 text-gold font-semibold animate-pulse">Uploading...</div>
                    )}
                  </div>

                  {/* Grid of images in the album */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                    {selectedImage.images?.map((imgUrl, idx) => (
                      <div key={idx} className="relative group aspect-square rounded-xl overflow-hidden border-2 border-gold/20 shadow-sm">
                        <img src={imgUrl} alt="" className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-[2px]">
                          <button 
                            onClick={() => removeImageFromMemory(idx)}
                            className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 flex items-center gap-2 rounded-full font-semibold transform translate-y-4 group-hover:translate-y-0 transition-all"
                          >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <polyline points="3 6 5 6 21 6"></polyline>
                              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                            </svg>
                            Delete
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Memory Match Game */}
      {showGame && (
        <MemoryMatch 
          images={gallery.map(g => ({ id: g.id, src: g.src, caption: g.caption }))} 
          onClose={() => setShowGame(false)} 
        />
      )}
    </div>
  );
}
