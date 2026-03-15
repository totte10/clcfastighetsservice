import { useState, useEffect, useCallback } from "react";
import { getAreas, addArea, deleteArea, type Area } from "@/lib/store";
import { geocodeAddress } from "@/lib/geocode";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Trash2, Plus, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import UserManagement from "@/components/admin/UserManagement";

export default function AdminPage() {
  const [areas, setAreas] = useState<Area[]>([]);
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const refresh = useCallback(async () => {
    setAreas(await getAreas());
  }, []);

  useEffect(() => {refresh();}, [refresh]);

  const handleAdd = async () => {
    if (!name.trim() || !address.trim()) {
      toast({ title: "Fyll i namn och adress", variant: "destructive" });
      return;
    }
    setLoading(true);
    const coords = await geocodeAddress(address.trim());
    await addArea({
      name: name.trim(),
      address: address.trim(),
      notes: notes.trim(),
      blowStatus: "pending",
      sweepStatus: "pending",
      images: [],
      lat: coords?.lat,
      lng: coords?.lng
    });
    await refresh();
    setName("");
    setAddress("");
    setNotes("");
    setLoading(false);
    toast({ title: coords ? "Område tillagt med kartposition!" : "Område tillagt" });
  };

  const handleDelete = async (id: string) => {
    await deleteArea(id);
    await refresh();
    toast({ title: "Område borttaget" });
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold tracking-tight text-primary-foreground ml-[5px] mt-0">Admin</h1>

      <UserManagement />

      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="text-lg">Lägg till nytt område</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Namn</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="T.ex. Parkering A" />
            </div>
            <div className="space-y-2">
              <Label>Adress</Label>
              <Input value={address} onChange={(e) => setAddress(e.target.value)} placeholder="T.ex. Storgatan 1, Stockholm" />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Anteckningar (valfritt)</Label>
            <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Ev. kommentarer" rows={2} />
          </div>
          <Button onClick={handleAdd} disabled={loading} className="gap-2">
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
            {loading ? "Söker kartposition..." : "Lägg till område"}
          </Button>
        </CardContent>
      </Card>

      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="text-lg">Alla områden ({areas.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {areas.length === 0 ?
          <p className="text-sm text-muted-foreground">Inga områden tillagda ännu.</p> :

          <div className="space-y-2">
              {areas.map((area) =>
            <div key={area.id} className="flex items-center justify-between p-3 rounded-md bg-muted/50">
                  <div>
                    <p className="text-sm font-medium">{area.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {area.address}
                      {area.lat != null && <span className="ml-2 text-success">📍 På karta</span>}
                    </p>
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => handleDelete(area.id)} className="text-destructive hover:text-destructive">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
            )}
            </div>
          }
        </CardContent>
      </Card>
    </div>);

}