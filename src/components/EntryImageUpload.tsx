import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { ImagePlus, X, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface EntryImageUploadProps {
  images: string[];
  onImagesChange: (images: string[]) => void;
}

export function EntryImageUpload({ images, onImagesChange }: EntryImageUploadProps) {
  const [uploading, setUploading] = useState(false);
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

  return (
    <div className="space-y-2">
      <Button variant="outline" size="sm" onClick={handleUpload} disabled={uploading} className="gap-2">
        {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ImagePlus className="h-4 w-4" />}
        {uploading ? "Laddar upp..." : "Lägg till bild"}
      </Button>
      {images.length > 0 && (
        <div className="flex gap-2 flex-wrap">
          {images.map((url, i) => (
            <div key={i} className="relative group">
              <img src={url} alt={`Bild ${i + 1}`} className="w-20 h-20 object-cover rounded-md border border-border" />
              <button
                onClick={() => handleRemove(i)}
                className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
