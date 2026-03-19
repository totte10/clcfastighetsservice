import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

interface Profile {
  id: string;
  fullName: string;
  avatarUrl: string | null;
  username: string | null;
}

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  isAdmin: boolean;
  profile: Profile | null;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

async function loadProfileAndRole(userId: string) {
  const [profileResult, roleResult] = await Promise.all([
    supabase.from("profiles").select("id, full_name, avatar_url, username").eq("id", userId).maybeSingle(),
    supabase.from("user_roles").select("role").eq("user_id", userId),
  ]);

  if (profileResult.error) {
    console.error("Profile load error:", profileResult.error);
  }

  if (roleResult.error) {
    console.error("Role load error:", roleResult.error);
  }

  const profile = profileResult.data
    ? {
        id: profileResult.data.id,
        fullName: profileResult.data.full_name ?? "",
        avatarUrl: profileResult.data.avatar_url ?? null,
        username: profileResult.data.username ?? null,
      }
    : null;

  const isAdmin = (roleResult.data ?? []).some((role) => role.role === "admin");

  return { profile, isAdmin };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    let mounted = true;

    const applySession = (sessionUser: User | null) => {
      if (!mounted) return;
      setUser(sessionUser);

      if (!sessionUser) {
        setProfile(null);
        setIsAdmin(false);
        setLoading(false);
        return;
      }

      setLoading(true);
      void loadProfileAndRole(sessionUser.id)
        .then(({ profile: nextProfile, isAdmin: nextIsAdmin }) => {
          if (!mounted) return;
          setProfile(nextProfile);
          setIsAdmin(nextIsAdmin);
        })
        .catch((error) => {
          console.error("Auth metadata load error:", error);
          if (!mounted) return;
          setProfile(null);
          setIsAdmin(false);
        })
        .finally(() => {
          if (mounted) setLoading(false);
        });
    };

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      applySession(session?.user ?? null);
    });

    supabase.auth
      .getSession()
      .then(({ data, error }) => {
        if (error) {
          console.error("Get session error:", error);
        }
        applySession(data.session?.user ?? null);
      })
      .catch((error) => {
        console.error("Get session crash:", error);
        if (mounted) {
          setUser(null);
          setProfile(null);
          setIsAdmin(false);
          setLoading(false);
        }
      });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const value = useMemo(
    () => ({ user, loading, isAdmin, profile }),
    [user, loading, isAdmin, profile]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    return {
      user: null,
      loading: true,
      isAdmin: false,
      profile: null,
    } satisfies AuthContextValue;
  }

  return context;
}
