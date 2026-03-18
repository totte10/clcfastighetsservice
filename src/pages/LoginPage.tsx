import { useState } from "react"
import { supabase } from "@/integrations/supabase/client"
import { Loader2 } from "lucide-react"

export default function LoginPage() {

  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!username.trim() || !password.trim()) return

    setLoading(true)
    setError("")

    const email = `${username.trim().toLowerCase()}@app.internal`

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      setError("Fel användarnamn eller lösenord")
      setLoading(false)
      return
    }

    // 🔥 EXTRA: check admin role direkt
    const { data: role } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", data.user.id)
      .single()

    if (!role) {
      setError("Ingen behörighet")
      setLoading(false)
      return
    }

    // 🔥 DEBUG (du kan ta bort sen)
    console.log("Inloggad som:", role.role)

    setLoading(false)
  }

  return (
    <div
      className="min-h-[100dvh] flex items-center justify-center p-6"
      style={{
        background:
          "radial-gradient(circle at 20% 0%, rgba(31,111,84,0.25), transparent 40%), #0B1220",
      }}
    >

      <div
        className="w-full max-w-sm p-7 rounded-3xl"
        style={{
          background: "rgba(255,255,255,0.04)",
          border: "1px solid rgba(255,255,255,0.08)",
          backdropFilter: "blur(20px)",
        }}
      >

        {/* LOGO */}
        <div className="flex flex-col items-center mb-6">
          <div className="w-20 h-20 rounded-2xl overflow-hidden mb-3">
            <img src="/green-logo.jpg" className="w-full h-full object-cover" />
          </div>
          <h1 className="text-lg font-semibold text-white">
            CLC Fastighetsservice
          </h1>
        </div>

        {/* FORM */}
        <form onSubmit={handleLogin} className="space-y-3">

          <input
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Användarnamn"
            disabled={loading}
            className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-sm text-white"
          />

          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Lösenord"
            disabled={loading}
            className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-sm text-white"
          />

          {error && (
            <p className="text-xs text-red-400 text-center">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl bg-primary text-white font-medium"
          >
            {loading
              ? <Loader2 className="animate-spin mx-auto" size={18} />
              : "Logga in"}
          </button>

        </form>

        <p className="text-[11px] text-center text-muted-foreground mt-5">
          Endast behöriga användare
        </p>

      </div>

    </div>
  )
}