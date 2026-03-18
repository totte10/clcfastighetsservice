import { useState, useCallback, useEffect } from "react";
import { getAreas, updateArea, type Area } from "@/lib/store";
import { StatusBadge } from "@/components/StatusBadge";
import { GoogleMapView } from "@/components/GoogleMapView";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Fan, Wind, ImagePlus, X, Map } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

type Status = "pending" | "in-progress" | "done";

function getMarkerColor(blow: Status, sweep: Status): "green" | "orange" | "red" {
  if (blow === "done" && sweep === "done") return "green";
  if (blow === "pending" && sweep === "pending") return "red";
  return "orange";
}

export default function AreasPage() {
  const [areas, setAreas] = useState<Area[]>([]);
  const { toast } = useToast();

  const refresh = useCallback(async () => {
    setAreas(await getAreas());
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  const handleStatusChange = async (id: string, field: "blowStatus" | "sweepStatus", value: Status) => {
    await updateArea(id, { [field]: value });
    await refresh();
  };

  const handleImageUpload = (id: string) => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.multiple = true;
    input.onchange = async (e) => {
      const files = (e.target as HTMLInputElement).files;
      if (!files) return;
      const area = areas.find((a) => a.id === id);
      if (!area) return;
      const newImages = [...area.images];
      for (const file of Array.from(files)) {
        const result = await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.readAsDataURL(file);
        });
        newImages.push(result);
      }
      await updateArea(id, { images: newImages });
      await refresh();
      toast({ title: "Bilder uppladdade" });
    };
    input.click();
  };

  const removeImage = async (areaId: string, imgIndex: number) => {
    const area = areas.find((a) => a.id === areaId);
    if (!area) return;
    const newImages = area.images.filter((_, i) => i !== imgIndex);
    await updateArea(areaId, { images: newImages });
    await refresh();
  };

  const areasWithCoords = areas.filter((a) => a.lat != null && a.lng != null);

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

      <Card className="glass-card">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Alla områden</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y divide-border">
            {areas.map((area) => (
              <div key={area.id} className="flex items-center justify-between px-6 py-3">
                <div>
                  <p className="font-medium text-sm">{area.name}</p>
                  <p className="text-xs text-muted-foreground">{area.address}</p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1.5">
                    <Fan className="h-3.5 w-3.5 text-primary" />
                    <StatusBadge status={area.blowStatus} />
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Wind className="h-3.5 w-3.5 text-accent" />
                    <StatusBadge status={area.sweepStatus} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {areasWithCoords.length > 0 && (
        <Card className="glass-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Map className="h-5 w-5 text-primary" />
              Alla områden på karta
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <GoogleMapView
              height="300px"
              markers={areasWithCoords.map((a) => ({
                lat: a.lat!, lng: a.lng!, label: a.name, id: a.id,
                color: getMarkerColor(a.blowStatus, a.sweepStatus),
              }))}
            />
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {areas.map((area) => (
          <Card key={area.id} className="glass-card">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">{area.name}</CardTitle>
              <p className="text-sm text-muted-foreground">{area.address}</p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm font-medium">
                    <Fan className="h-4 w-4 text-primary" /> Framblåsning
                  </div>
                  <Select value={area.blowStatus} onValueChange={(v) => handleStatusChange(area.id, "blowStatus", v as Status)}>
                    <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">Ej påbörjad</SelectItem>
                      <SelectItem value="in-progress">Pågår</SelectItem>
                      <SelectItem value="done">Klart</SelectItem>
                    </SelectContent>
                  </Select>
                  <StatusBadge status={area.blowStatus} />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm font-medium">
                    <Wind className="h-4 w-4 text-accent" /> Maskinsopning
                  </div>
                  <Select value={area.sweepStatus} onValueChange={(v) => handleStatusChange(area.id, "sweepStatus", v as Status)}>
                    <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">Ej påbörjad</SelectItem>
                      <SelectItem value="in-progress">Pågår</SelectItem>
                      <SelectItem value="done">Klart</SelectItem>
                    </SelectContent>
                  </Select>
                  <StatusBadge status={area.sweepStatus} />
                </div>
              </div>

              <div className="space-y-2">
                <Button variant="outline" size="sm" onClick={() => handleImageUpload(area.id)} className="gap-2">
                  <ImagePlus className="h-4 w-4" /> Lägg till bild
                </Button>
                {area.images.length > 0 && (
                  <div className="flex gap-2 flex-wrap">
                    {area.images.map((img, i) => (
                      <div key={i} className="relative group">
                        <img src={img} alt={`Bild ${i + 1}`} className="w-20 h-20 object-cover rounded-md border" />
                        <button onClick={() => removeImage(area.id, i)} className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {area.notes && <p className="text-sm text-muted-foreground italic">{area.notes}</p>}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
