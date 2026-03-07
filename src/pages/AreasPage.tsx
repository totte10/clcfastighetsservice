import { useState, useCallback } from "react";
import { getAreas, updateArea, type Area } from "@/lib/store";
import { StatusBadge } from "@/components/StatusBadge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Snowflake, Wind, ImagePlus, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

type Status = "pending" | "in-progress" | "done";

export default function AreasPage() {
  const [areas, setAreas] = useState<Area[]>(getAreas);
  const { toast } = useToast();

  const refresh = useCallback(() => setAreas(getAreas()), []);

  const handleStatusChange = (
    id: string,
    field: "snowStatus" | "sweepStatus",
    value: Status
  ) => {
    updateArea(id, { [field]: value });
    refresh();
  };

  const handleImageUpload = (id: string) => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.multiple = true;
    input.onchange = (e) => {
      const files = (e.target as HTMLInputElement).files;
      if (!files) return;
      const area = areas.find((a) => a.id === id);
      if (!area) return;

      Array.from(files).forEach((file) => {
        const reader = new FileReader();
        reader.onload = () => {
          const result = reader.result as string;
          const current = getAreas().find((a) => a.id === id);
          if (current) {
            updateArea(id, { images: [...current.images, result] });
            refresh();
          }
        };
        reader.readAsDataURL(file);
      });
      toast({ title: "Bilder uppladdade" });
    };
    input.click();
  };

  const removeImage = (areaId: string, imgIndex: number) => {
    const area = areas.find((a) => a.id === areaId);
    if (!area) return;
    const newImages = area.images.filter((_, i) => i !== imgIndex);
    updateArea(areaId, { images: newImages });
    refresh();
  };

  if (areas.length === 0) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-bold tracking-tight">Områden</h1>
        <Card className="glass-card">
          <CardContent className="pt-6 text-center text-muted-foreground">
            <p>Inga områden tillagda ännu. Gå till Admin för att lägga till.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold tracking-tight">Områden</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {areas.map((area) => (
          <Card key={area.id} className="glass-card">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">{area.name}</CardTitle>
              <p className="text-sm text-muted-foreground">{area.address}</p>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Status selectors */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm font-medium">
                    <Snowflake className="h-4 w-4 text-primary" />
                    Snöröjning
                  </div>
                  <Select
                    value={area.snowStatus}
                    onValueChange={(v) =>
                      handleStatusChange(area.id, "snowStatus", v as Status)
                    }
                  >
                    <SelectTrigger className="h-9">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">Ej påbörjad</SelectItem>
                      <SelectItem value="in-progress">Pågår</SelectItem>
                      <SelectItem value="done">Klart</SelectItem>
                    </SelectContent>
                  </Select>
                  <StatusBadge status={area.snowStatus} />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm font-medium">
                    <Wind className="h-4 w-4 text-accent" />
                    Maskinsopning
                  </div>
                  <Select
                    value={area.sweepStatus}
                    onValueChange={(v) =>
                      handleStatusChange(area.id, "sweepStatus", v as Status)
                    }
                  >
                    <SelectTrigger className="h-9">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">Ej påbörjad</SelectItem>
                      <SelectItem value="in-progress">Pågår</SelectItem>
                      <SelectItem value="done">Klart</SelectItem>
                    </SelectContent>
                  </Select>
                  <StatusBadge status={area.sweepStatus} />
                </div>
              </div>

              {/* Images */}
              <div className="space-y-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleImageUpload(area.id)}
                  className="gap-2"
                >
                  <ImagePlus className="h-4 w-4" />
                  Lägg till bild
                </Button>
                {area.images.length > 0 && (
                  <div className="flex gap-2 flex-wrap">
                    {area.images.map((img, i) => (
                      <div key={i} className="relative group">
                        <img
                          src={img}
                          alt={`Bild ${i + 1}`}
                          className="w-20 h-20 object-cover rounded-md border"
                        />
                        <button
                          onClick={() => removeImage(area.id, i)}
                          className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {area.notes && (
                <p className="text-sm text-muted-foreground italic">
                  {area.notes}
                </p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
