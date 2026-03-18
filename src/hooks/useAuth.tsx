import { useEffect, useState } from "react"
import { supabase } from "@/integrations/supabase/client"

export function useAuth() {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setUser(data.session?.user ?? null)
      setLoading(false)
    })

    const { data: listener } = supabase.auth.onAuthStateChange(
      (_, session) => {
        setUser(session?.user ?? null)
      }
    )

    return () => {
      listener.subscription.unsubscribe()
    }
  }, [])

  // 🔥 ADMIN FIX
  const isAdmin = user?.email === "totte@celecinvest.com"

  return {
    user,
    isAdmin,
    loading
  }
}