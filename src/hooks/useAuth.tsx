import { useEffect, useState } from "react"
import { supabase } from "@/integrations/supabase/client"

export function useAuth() {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Hämta session
    supabase.auth.getSession().then(({ data }) => {
      setUser(data.session?.user ?? null)
      setLoading(false)
    })

    // Lyssna på login/logout
    const { data: listener } = supabase.auth.onAuthStateChange(
      (_, session) => {
        setUser(session?.user ?? null)
      }
    )

    return () => {
      listener.subscription.unsubscribe()
    }
  }, [])

  // 🔥 TEMP: gör dig alltid admin (så inget blockerar)
  const isAdmin = true

  return {
    user,
    isAdmin,
    loading
  }
}