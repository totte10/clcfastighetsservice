import { useState } from "react";
import { getAreas, addArea, deleteArea, type Area } from "@/lib/store";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Trash2, Plus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function AdminPage() {
  const [areas, setAreas] = useState<Area[]>(getAreas);
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [notes, setNotes] = useState("");
  const { toast } = useToast();

  const handleAdd = () => {
    if (!name.trim() || !address.trim()) {
      toast({ title: "Fyll i namn och adress", variant: "destructive" });
      return;
    }
    addArea({
      name: name.trim(),
      address: address.trim(),
      notes: notes.trim(),
      snowStatus: "pending",
      sweepStatus: "pending",
      images: [],
    });
    setAreas(getAreas());
    setName("");
    setAddress("");
    setNotes("");
    toast({ title: "Område tillagt!" });
  };

  const handleDelete = (id: string) => {
    deleteArea(id);
    setAreas(getAreas());
    toast({ title: "Område borttaget" });
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold tracking-tight">Admin</h1>

      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="text-lg">Lägg till nytt område</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Namn</Label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="T.ex. Parkering A"
              />
            </div>
            <div className="space-y-2">
              <Label>Adress</Label>
              <Input
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="T.ex. Storgatan 1"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Anteckningar (valfritt)</Label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Ev. kommentarer om området"
              rows={2}
            />
          </div>
          <Button onClick={handleAdd} className="gap-2">
            <Plus className="h-4 w-4" />
            Lägg till område
          </Button>
        </CardContent>
      </Card>

      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="text-lg">
            Alla områden ({areas.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {areas.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Inga områden tillagda ännu.
            </p>
          ) : (
            <div className="space-y-2">
              {areas.map((area) => (
                <div
                  key={area.id}
                  className="flex items-center justify-between p-3 rounded-md bg-muted/50"
                >
                  <div>
                    <p className="text-sm font-medium">{area.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {area.address}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDelete(area.id)}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
