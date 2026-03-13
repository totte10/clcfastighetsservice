import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { UserPlus, X, Users } from "lucide-react";

interface Assignment {
  id: string;
  user_id: string;
  user_name: string;
}

interface Profile {
  id: string;
  full_name: string;
  username: string | null;
}

interface WorkerAssignmentProps {
  entryType: string;
  entryId: string;
  compact?: boolean;
}

export function WorkerAssignment({ entryType, entryId, compact }: WorkerAssignmentProps) {
  const { isAdmin } = useAuth();
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [allUsers, setAllUsers] = useState<Profile[]>([]);
  const [selectedUser, setSelectedUser] = useState("");
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    // Load assignments for this entry
    const { data: assignData } = await supabase
      .from("project_assignments" as any)
      .select("id, user_id")
      .eq("entry_type", entryType)
      .eq("entry_id", entryId);

    if (assignData && assignData.length > 0) {
      // Get user names
      const userIds = assignData.map((a: any) => a.user_id);
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, full_name, username")
        .in("id", userIds);

      setAssignments(
        assignData.map((a: any) => ({
          id: a.id,
          user_id: a.user_id,
          user_name: profiles?.find((p) => p.id === a.user_id)?.full_name
            || (profiles?.find((p) => p.id === a.user_id) as any)?.username
            || "Okänd",
        }))
      );
    } else {
      setAssignments([]);
    }

    // Load all users for admin dropdown
    if (isAdmin) {
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, full_name, username");
      setAllUsers(
        (profiles || []).map((p) => ({
          id: p.id,
          full_name: p.full_name,
          username: (p as any).username,
        }))
      );
    }
  }, [entryType, entryId, isAdmin]);

  useEffect(() => { load(); }, [load]);

  const handleAssign = async () => {
    if (!selectedUser) return;
    setLoading(true);
    await supabase.from("project_assignments" as any).insert({
      entry_type: entryType,
      entry_id: entryId,
      user_id: selectedUser,
    });
    setSelectedUser("");
    await load();
    setLoading(false);
  };

  const handleRemove = async (assignmentId: string) => {
    setLoading(true);
    await supabase.from("project_assignments" as any).delete().eq("id", assignmentId);
    await load();
    setLoading(false);
  };

  const unassignedUsers = allUsers.filter(
    (u) => !assignments.some((a) => a.user_id === u.id)
  );

  if (compact && assignments.length === 0 && !isAdmin) return null;

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 flex-wrap">
        <Users className="h-3.5 w-3.5 text-muted-foreground" />
        <span className="text-xs font-medium text-muted-foreground">Tilldelade:</span>
        {assignments.length === 0 && (
          <span className="text-xs text-muted-foreground italic">Inga tilldelade</span>
        )}
        {assignments.map((a) => (
          <Badge key={a.id} variant="secondary" className="text-xs gap-1">
            {a.user_name}
            {isAdmin && (
              <button onClick={() => handleRemove(a.id)} className="ml-0.5 hover:text-destructive" disabled={loading}>
                <X className="h-3 w-3" />
              </button>
            )}
          </Badge>
        ))}
      </div>

      {isAdmin && unassignedUsers.length > 0 && (
        <div className="flex items-center gap-2">
          <Select value={selectedUser} onValueChange={setSelectedUser}>
            <SelectTrigger className="h-8 text-xs w-40">
              <SelectValue placeholder="Välj arbetare..." />
            </SelectTrigger>
            <SelectContent>
              {unassignedUsers.map((u) => (
                <SelectItem key={u.id} value={u.id}>
                  {u.full_name || u.username || "Okänd"}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button size="sm" variant="outline" onClick={handleAssign} disabled={!selectedUser || loading} className="h-8 gap-1 text-xs">
            <UserPlus className="h-3.5 w-3.5" />
            Tilldela
          </Button>
        </div>
      )}
    </div>
  );
}
