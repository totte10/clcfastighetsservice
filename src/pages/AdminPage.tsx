import { useState, useEffect, useCallback } from "react";
import { getAreas, addArea, deleteArea, type Area } from "@/lib/store";
import { geocodeAddress } from "@/lib/geocode";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Trash2, Plus, Loader2, Users, Shield, ShieldOff, UserPlus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

interface ManagedUser {
  id: string;
  email: string;
  created_at: string;
  last_sign_in_at: string | null;
  full_name: string;
  avatar_url: string | null;
  roles: string[];
}

async function callAdmin(action: string, method = "GET", body?: any) {
  const { data: { session } } = await supabase.auth.getSession();
  const res = await supabase.functions.invoke("admin-users", {
    method: method as any,
    headers: { "Content-Type": "application/json" },
    body: method === "GET" ? undefined : body,
  });
  // For GET with query params, use fetch directly
  if (method === "GET") {
    const { data: { session: s } } = await supabase.auth.getSession();
    const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-users?action=${action}`;
    const r = await fetch(url, {
      headers: {
        Authorization: `Bearer ${s?.access_token}`,
        apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
      },
    });
    return r.json();
  }
  // POST
  const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-users?action=${action}`;
  const { data: { session: s } } = await supabase.auth.getSession();
  const r = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${s?.access_token}`,
      apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
  return r.json();
}

function UserManagement() {
  const [users, setUsers] = useState<ManagedUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviting, setInviting] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  const loadUsers = useCallback(async () => {
    setLoading(true);
    try {
      const data = await callAdmin("list-users", "GET");
      if (Array.isArray(data)) {
        setUsers(data);
        setIsAdmin(true);
      } else {
        setIsAdmin(false);
      }
    } catch {
      setIsAdmin(false);
    }
    setLoading(false);
  }, []);

  useEffect(() => { loadUsers(); }, [loadUsers]);

  const handleInvite = async () => {
    if (!inviteEmail.trim()) return;
    setInviting(true);
    const res = await callAdmin("invite-user", "POST", { email: inviteEmail.trim() });
    if (res.ok) {
      toast({ title: `Inbjudan skickad till ${inviteEmail}` });
      setInviteEmail("");
      await loadUsers();
    } else {
      toast({ title: "Kunde inte bjuda in", description: res.error, variant: "destructive" });
    }
    setInviting(false);
  };

  const handleToggleAdmin = async (userId: string, currentlyAdmin: boolean) => {
    await callAdmin("set-role", "POST", { userId, role: "admin", remove: currentlyAdmin });
    await loadUsers();
    toast({ title: currentlyAdmin ? "Admin-roll borttagen" : "Admin-roll tilldelad" });
  };

  const handleDelete = async (userId: string, email: string) => {
    if (!confirm(`Radera användare ${email}?`)) return;
    const res = await callAdmin("delete-user", "POST", { userId });
    if (res.ok) {
      toast({ title: `${email} raderad` });
      await loadUsers();
    } else {
      toast({ title: "Kunde inte radera", description: res.error, variant: "destructive" });
    }
  };

  if (loading) {
    return (
      <Card className="glass-card">
        <CardContent className="py-8 flex justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  if (!isAdmin) {
    return (
      <Card className="glass-card">
        <CardContent className="py-8 text-center text-sm text-muted-foreground">
          Du har inte admin-behörighet för att hantera användare.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <UserPlus className="h-5 w-5 text-primary" />
            Bjud in ny användare
          </CardTitle>
        </CardHeader>
        <CardContent className="flex gap-3">
          <Input
            value={inviteEmail}
            onChange={(e) => setInviteEmail(e.target.value)}
            placeholder="E-postadress"
            type="email"
            className="flex-1"
          />
          <Button onClick={handleInvite} disabled={inviting} className="gap-2">
            {inviting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
            Bjud in
          </Button>
        </CardContent>
      </Card>

      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            Användare ({users.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {users.map((u) => {
              const uIsAdmin = u.roles.includes("admin");
              const isSelf = u.id === user?.id;
              return (
                <div key={u.id} className="flex items-center justify-between p-3 rounded-md bg-muted/50 gap-3">
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    {u.avatar_url ? (
                      <img src={u.avatar_url} alt="" className="w-8 h-8 rounded-full shrink-0" />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                        <span className="text-xs font-medium text-primary">
                          {(u.full_name || u.email || "?")[0].toUpperCase()}
                        </span>
                      </div>
                    )}
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">
                        {u.full_name || u.email}
                        {isSelf && <span className="text-muted-foreground ml-1">(du)</span>}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">{u.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {uIsAdmin && <Badge variant="secondary" className="text-[10px]">Admin</Badge>}
                    {!isSelf && (
                      <>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleToggleAdmin(u.id, uIsAdmin)}
                          title={uIsAdmin ? "Ta bort admin" : "Gör till admin"}
                        >
                          {uIsAdmin ? <ShieldOff className="h-4 w-4 text-warning" /> : <Shield className="h-4 w-4 text-muted-foreground" />}
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDelete(u.id, u.email || "")} className="text-destructive hover:text-destructive">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

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

  useEffect(() => { refresh(); }, [refresh]);

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
      lng: coords?.lng,
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
      <h1 className="text-2xl font-bold tracking-tight">Admin</h1>

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
          {areas.length === 0 ? (
            <p className="text-sm text-muted-foreground">Inga områden tillagda ännu.</p>
          ) : (
            <div className="space-y-2">
              {areas.map((area) => (
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
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
