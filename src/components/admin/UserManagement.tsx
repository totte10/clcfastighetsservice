import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Trash2, Plus, Loader2, Users, Shield, ShieldOff, UserPlus, KeyRound } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";

interface ManagedUser {
  id: string;
  email: string;
  created_at: string;
  last_sign_in_at: string | null;
  full_name: string;
  username: string | null;
  avatar_url: string | null;
  roles: string[];
}

async function callAdmin(action: string, method = "GET", body?: any) {
  const { data: { session } } = await supabase.auth.getSession();
  const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-users?action=${action}`;
  const r = await fetch(url, {
    method,
    headers: {
      Authorization: `Bearer ${session?.access_token}`,
      apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
      ...(method !== "GET" ? { "Content-Type": "application/json" } : {}),
    },
    ...(method !== "GET" && body ? { body: JSON.stringify(body) } : {}),
  });
  return r.json();
}

export default function UserManagement() {
  const [users, setUsers] = useState<ManagedUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  // Create user form
  const [showCreate, setShowCreate] = useState(false);
  const [createName, setCreateName] = useState("");
  const [createUsername, setCreateUsername] = useState("");
  const [createPassword, setCreatePassword] = useState("");
  const [createRole, setCreateRole] = useState<string>("worker");
  const [creating, setCreating] = useState(false);

  // Password reset dialog
  const [passwordUser, setPasswordUser] = useState<ManagedUser | null>(null);
  const [newPassword, setNewPassword] = useState("");
  const [resettingPw, setResettingPw] = useState(false);

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

  const handleCreate = async () => {
    if (!createName.trim() || !createUsername.trim() || !createPassword.trim()) return;
    setCreating(true);
    const res = await callAdmin("create-user", "POST", {
      name: createName.trim(),
      username: createUsername.trim(),
      password: createPassword.trim(),
      role: createRole,
    });
    if (res.ok) {
      toast({ title: `Användare "${createUsername.trim()}" skapad` });
      setCreateName("");
      setCreateUsername("");
      setCreatePassword("");
      setCreateRole("worker");
      setShowCreate(false);
      await loadUsers();
    } else {
      toast({ title: "Kunde inte skapa användare", description: res.error, variant: "destructive" });
    }
    setCreating(false);
  };

  const handleToggleRole = async (userId: string, role: string, hasRole: boolean) => {
    await callAdmin("set-role", "POST", { userId, role, remove: hasRole });
    await loadUsers();
    toast({ title: hasRole ? `${role}-roll borttagen` : `${role}-roll tilldelad` });
  };

  const handleDelete = async (userId: string, name: string) => {
    if (!confirm(`Radera användare ${name}?`)) return;
    const res = await callAdmin("delete-user", "POST", { userId });
    if (res.ok) {
      toast({ title: `${name} raderad` });
      await loadUsers();
    } else {
      toast({ title: "Kunde inte radera", description: res.error, variant: "destructive" });
    }
  };

  const handleResetPassword = async () => {
    if (!passwordUser || !newPassword.trim()) return;
    setResettingPw(true);
    const res = await callAdmin("update-password", "POST", { userId: passwordUser.id, password: newPassword.trim() });
    if (res.ok) {
      toast({ title: `Lösenord uppdaterat för ${passwordUser.full_name || passwordUser.username}` });
      setPasswordUser(null);
      setNewPassword("");
    } else {
      toast({ title: "Kunde inte uppdatera lösenord", description: res.error, variant: "destructive" });
    }
    setResettingPw(false);
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
      {/* Create user */}
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="text-lg flex items-center justify-between">
            <span className="flex items-center gap-2">
              <UserPlus className="h-5 w-5 text-primary" />
              Skapa ny användare
            </span>
            {!showCreate && (
              <Button size="sm" onClick={() => setShowCreate(true)} className="gap-1">
                <Plus className="h-4 w-4" /> Ny användare
              </Button>
            )}
          </CardTitle>
        </CardHeader>
        {showCreate && (
          <CardContent className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Namn</Label>
                <Input value={createName} onChange={(e) => setCreateName(e.target.value)} placeholder="T.ex. Mattias" />
              </div>
              <div className="space-y-1.5">
                <Label>Användarnamn</Label>
                <Input value={createUsername} onChange={(e) => setCreateUsername(e.target.value)} placeholder="T.ex. mattias" />
              </div>
              <div className="space-y-1.5">
                <Label>Lösenord</Label>
                <Input type="password" value={createPassword} onChange={(e) => setCreatePassword(e.target.value)} placeholder="Ange lösenord" />
              </div>
              <div className="space-y-1.5">
                <Label>Roll</Label>
                <Select value={createRole} onValueChange={setCreateRole}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="worker">Worker</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex gap-2">
              <Button onClick={handleCreate} disabled={creating || !createName.trim() || !createUsername.trim() || !createPassword.trim()} className="gap-2">
                {creating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                Skapa
              </Button>
              <Button variant="ghost" onClick={() => setShowCreate(false)}>Avbryt</Button>
            </div>
          </CardContent>
        )}
      </Card>

      {/* User list */}
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
              const uIsWorker = u.roles.includes("worker");
              const isSelf = u.id === user?.id;
              const displayName = u.full_name || u.username || u.email || "?";
              return (
                <div key={u.id} className="flex items-center justify-between p-3 rounded-md bg-muted/50 gap-3">
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    {u.avatar_url ? (
                      <img src={u.avatar_url} alt="" className="w-8 h-8 rounded-full shrink-0" />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                        <span className="text-xs font-medium text-primary">
                          {displayName[0].toUpperCase()}
                        </span>
                      </div>
                    )}
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">
                        {displayName}
                        {isSelf && <span className="text-muted-foreground ml-1">(du)</span>}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">
                        {u.username ? `@${u.username}` : u.email}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0 flex-wrap justify-end">
                    {uIsAdmin && <Badge variant="secondary" className="text-[10px]">Admin</Badge>}
                    {uIsWorker && <Badge variant="outline" className="text-[10px]">Worker</Badge>}
                    {!isSelf && (
                      <>
                        <Button variant="ghost" size="icon" onClick={() => handleToggleRole(u.id, "admin", uIsAdmin)} title={uIsAdmin ? "Ta bort admin" : "Gör till admin"}>
                          {uIsAdmin ? <ShieldOff className="h-4 w-4 text-orange-500" /> : <Shield className="h-4 w-4 text-muted-foreground" />}
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleToggleRole(u.id, "worker", uIsWorker)} title={uIsWorker ? "Ta bort worker" : "Gör till worker"}>
                          <Users className="h-3.5 w-3.5 text-muted-foreground" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => { setPasswordUser(u); setNewPassword(""); }} title="Byt lösenord">
                          <KeyRound className="h-4 w-4 text-muted-foreground" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDelete(u.id, displayName)} className="text-destructive hover:text-destructive">
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

      {/* Password reset dialog */}
      <Dialog open={!!passwordUser} onOpenChange={(open) => !open && setPasswordUser(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Byt lösenord för {passwordUser?.full_name || passwordUser?.username}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div className="space-y-1.5">
              <Label>Nytt lösenord</Label>
              <Input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="Ange nytt lösenord" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setPasswordUser(null)}>Avbryt</Button>
            <Button onClick={handleResetPassword} disabled={resettingPw || !newPassword.trim()}>
              {resettingPw ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Spara
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
