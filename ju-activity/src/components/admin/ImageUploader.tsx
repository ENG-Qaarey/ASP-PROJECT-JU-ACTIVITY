import { useState, useRef } from "react";
import { Upload, X, Image as ImageIcon } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { motion, AnimatePresence } from "framer-motion";
import { Label } from "@/components/ui/label";
import { API } from "@/constants/api";

const API_BASE = API.BASE_URL.replace(/\/api\/?$/, "");

interface ImageUploaderProps {
  activityId?: string;
  currentImageUrl?: string | null;
  onImageUploaded: (imageUrl: string) => void;
  /** Exposes the pending file so parent can upload after activity creation */
  onFileReady?: (file: File | null) => void;
}

const ImageUploader = ({ activityId, currentImageUrl, onImageUploaded, onFileReady }: ImageUploaderProps) => {
  const [preview, setPreview] = useState<string | null>(currentImageUrl || null);
  const [uploading, setUploading] = useState(false);
  const pendingFileRef = useRef<File | null>(null);
  const ref = useRef<HTMLInputElement>(null);

  const uploadToServer = async (file: File, id: string): Promise<string | null> => {
    try {
      const fd = new FormData();
      fd.append("file", file);
      const r = await fetch(`${API_BASE}/api/activities/${id}/image`, {
        method: "POST",
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        body: fd,
      });
      if (!r.ok) throw new Error();
      const d = await r.json();
      return d.imageUrl as string;
    } catch {
      return null;
    }
  };

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) return toast({ title: "Invalid file", variant: "destructive" });
    if (file.size > 5 * 1024 * 1024) return toast({ title: "Max 5MB", variant: "destructive" });

    const reader = new FileReader();
    reader.onload = () => setPreview(reader.result as string);
    reader.readAsDataURL(file);

    if (activityId) {
      setUploading(true);
      const url = await uploadToServer(file, activityId);
      setUploading(false);
      if (url) {
        onImageUploaded(url);
      } else {
        toast({ title: "Upload failed", variant: "destructive" });
      }
    } else {
      pendingFileRef.current = file;
      onFileReady?.(file);
      onImageUploaded(reader.result as string);
    }
  };

  const remove = () => {
    setPreview(null);
    pendingFileRef.current = null;
    onFileReady?.(null);
    onImageUploaded("");
    if (ref.current) ref.current.value = "";
  };

  /** Called by parent after activity is created to upload the pending file */
  const uploadPending = async (newActivityId: string): Promise<string | null> => {
    const file = pendingFileRef.current;
    if (!file) return null;
    setUploading(true);
    const url = await uploadToServer(file, newActivityId);
    setUploading(false);
    if (url) {
      pendingFileRef.current = null;
      onImageUploaded(url);
    }
    return url;
  };

  // Expose uploadPending via ref-like pattern using a data attribute on the container
  // Parent can call (ref.current as any).uploadPending(id)
  const containerRef = useRef<HTMLDivElement>(null);
  if (containerRef.current) {
    (containerRef.current as any).__uploadPending = uploadPending;
  }

  return (
    <div className="space-y-2" ref={containerRef}>
      <Label className="text-sm font-medium flex items-center gap-2">
        <ImageIcon className="w-4 h-4 text-muted-foreground" />
        Activity Image
      </Label>
      <AnimatePresence mode="wait">
        {preview ? (
          <motion.div key="preview" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }} className="relative">
            <img src={preview} alt="" className="w-full h-40 object-cover rounded-lg border" />
            <button type="button" onClick={remove}
              className="absolute top-2 right-2 w-6 h-6 rounded-full bg-background/80 backdrop-blur border flex items-center justify-center text-muted-foreground hover:text-destructive transition-colors">
              <X className="w-3.5 h-3.5" />
            </button>
            {uploading && (
              <div className="absolute inset-0 bg-background/60 backdrop-blur-sm rounded-lg flex items-center justify-center">
                <span className="text-xs font-medium text-muted-foreground">Uploading...</span>
              </div>
            )}
          </motion.div>
        ) : (
          <motion.div key="upload" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}>
            <button type="button" onClick={() => ref.current?.click()}
              className="w-full border border-dashed rounded-lg p-6 text-center hover:bg-muted/50 hover:border-primary/40 transition-all duration-200 group">
              <Upload className="w-6 h-6 mx-auto text-muted-foreground group-hover:text-primary transition-colors mb-2" />
              <p className="text-xs font-medium text-muted-foreground">Click to upload</p>
              <p className="text-[10px] text-muted-foreground/70 mt-0.5">PNG, JPG up to 5MB</p>
            </button>
          </motion.div>
        )}
      </AnimatePresence>
      <input ref={ref} type="file" accept="image/*" className="hidden" onChange={handleFile} />
    </div>
  );
};

export default ImageUploader;
