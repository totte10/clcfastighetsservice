import { useState } from "react"
import { supabase } from "@/integrations/supabase/client"
import { Loader2 } from "lucide-react"

export default function LoginPage() {

  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  /* 🔐 USERNAME LOGIN */

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!username.trim() || !password.trim()) return

    setLoading(true)
    setError("")

    const email = `${username.trim().toLowerCase()}@app.internal`

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      setError("Fel användarnamn eller lösenord")
      setLoading(false)
      return
    }

    setLoading(false)
  }

  /* 🌐 GOOGLE LOGIN */

  const handleGoogle = async () => {
    setLoading(true)
    setError("")

    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: window.location.origin
      }
    })

    if (error) {
      setError("Google login misslyckades")
      setLoading(false)
    }
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

        {/* DIVIDER */}
        <div className="flex items-center gap-3 my-4">
          <div className="flex-1 h-px bg-white/10" />
          <span className="text-xs text-muted-foreground">eller</span>
          <div className="flex-1 h-px bg-white/10" />
        </div>

        {/* GOOGLE LOGIN */}
        <button
          onClick={handleGoogle}
          disabled={loading}
          className="w-full py-3 rounded-xl bg-white/5 border border-white/10 text-sm text-white flex items-center justify-center gap-2"
        >
          <svg className="h-4 w-4" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>

          Logga in med Google
        </button>

        <p className="text-[11px] text-center text-muted-foreground mt-5">
          Endast behöriga användare
        </p>

      </div>

    </div>
  )
}