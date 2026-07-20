import { useState, useRef } from "react";

export default function ImageUploader({ value, onChange }: { value?: string, onChange: (url: string) => void }) {
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (data.url) {
        onChange(data.url);
      } else {
        alert("Upload failed.");
      }
    } catch (err) {
      console.error(err);
      alert("Error uploading file.");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  return (
    <div className="mt-1 flex gap-2 items-center w-full">
      <input 
        type="text" 
        className="flex-1 bg-white/50 border border-gold/30 rounded px-2 py-1 text-sm text-ink-light"
        value={value || ""} 
        onChange={e => onChange(e.target.value)}
        placeholder="Image URL"
      />
      <input 
        type="file" 
        accept="image/*" 
        className="hidden" 
        ref={fileInputRef} 
        onChange={handleUpload} 
      />
      <button 
        onClick={() => fileInputRef.current?.click()} 
        disabled={uploading}
        className="px-3 py-1 bg-gold text-white rounded text-sm hover:bg-gold-dark disabled:opacity-50 whitespace-nowrap"
      >
        {uploading ? "..." : "Upload"}
      </button>
    </div>
  );
}
