import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { ImagePlus, X, Loader2, ChevronLeft, ChevronRight } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface EntryImageUploadProps {
  images: string[];
  onImagesChange: (images: string[]) => void;
}

export function EntryImageUpload({ images, onImagesChange }: EntryImageUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const { toast } = useToast();

  const handleUpload = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.multiple = true;
    input.onchange = async (e) => {
      const files = (e.target as HTMLInputElement).files;
      if (!files || files.length === 0) return;
      setUploading(true);
      const newUrls: string[] = [];
      for (const file of Array.from(files)) {
        const ext = file.name.split(".").pop() || "jpg";
        const path = `${crypto.randomUUID()}.${ext}`;
        const { error } = await supabase.storage.from("entry-images").upload(path, file);
        if (error) {
          console.error("Upload error:", error);
          continue;
        }
        const { data: urlData } = supabase.storage.from("entry-images").getPublicUrl(path);
        newUrls.push(urlData.publicUrl);
      }
      if (newUrls.length > 0) {
        onImagesChange([...images, ...newUrls]);
        toast({ title: `${newUrls.length} bild(er) uppladdade` });
      }
      setUploading(false);
    };
    input.click();
  };

  const handleRemove = (index: number) => {
    onImagesChange(images.filter((_, i) => i !== index));
  };

  const showPrev = () => {
    if (lightboxIndex !== null && lightboxIndex > 0) setLightboxIndex(lightboxIndex - 1);
  };
  const showNext = () => {
    if (lightboxIndex !== null && lightboxIndex < images.length - 1) setLightboxIndex(lightboxIndex + 1);
  };

  return (
    <div className="space-y-2">
      <Button variant="outline" size="sm" onClick={handleUpload} disabled={uploading} className="gap-2">
        {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ImagePlus className="h-4 w-4" />}
        {uploading ? "Laddar upp..." : "Lägg till bild"}
      </Button>
      {images.length > 0 && (
        <div className="flex gap-2 flex-wrap">
          {images.map((url, i) => (
            <div key={i} className="relative group cursor-pointer" onClick={() => setLightboxIndex(i)}>
              <img src={url} alt={`Bild ${i + 1}`} className="w-20 h-20 object-cover rounded-md border border-border hover:ring-2 hover:ring-primary/50 transition-all" />
              <button
                onClick={(e) => { e.stopPropagation(); handleRemove(i); }}
                className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Fullscreen lightbox */}
      <Dialog open={lightboxIndex !== null} onOpenChange={() => setLightboxIndex(null)}>
        <DialogContent className="max-w-[95vw] max-h-[95vh] p-2 sm:p-4 flex items-center justify-center bg-black/95 border-none">
          {lightboxIndex !== null && (
            <div className="relative flex items-center justify-center w-full h-full">
              {images.length > 1 && lightboxIndex > 0 && (
                <button
                  onClick={showPrev}
                  className="absolute left-2 z-10 p-2 rounded-full bg-background/20 hover:bg-background/40 text-white transition-colors"
                >
                  <ChevronLeft className="h-6 w-6" />
                </button>
              )}
              <img
                src={images[lightboxIndex]}
                alt={`Bild ${lightboxIndex + 1}`}
                className="max-w-full max-h-[85vh] object-contain rounded-md"
              />
              {images.length > 1 && lightboxIndex < images.length - 1 && (
                <button
                  onClick={showNext}
                  className="absolute right-2 z-10 p-2 rounded-full bg-background/20 hover:bg-background/40 text-white transition-colors"
                >
                  <ChevronRight className="h-6 w-6" />
                </button>
              )}
              {images.length > 1 && (
                <span className="absolute bottom-2 left-1/2 -translate-x-1/2 text-xs text-white/70 bg-black/50 px-3 py-1 rounded-full">
                  {lightboxIndex + 1} / {images.length}
                </span>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
