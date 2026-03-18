import { useState } from "react"
import { supabase } from "@/integrations/supabase/client"
import { lovable } from "@/integrations/lovable/index"
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
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) setError("Fel användarnamn eller lösenord")
    setLoading(false)
  }

  const handleGoogle = async () => {
    setLoading(true)
    setError("")
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin,
    })
    if (result?.error) {
      setError("Inloggning misslyckades. Kontakta admin.")
      setLoading(false)
    }
  }

  return (
    <div
      className="min-h-[100dvh] flex flex-col items-center justify-center p-6"
      style={{
        background:
          "radial-gradient(ellipse at 30% 0%, rgba(244,162,97,0.18), transparent 50%), radial-gradient(ellipse at 70% 100%, rgba(231,111,81,0.12), transparent 50%), #0A0A0F",
      }}
    >

      {/* Card */}
      <div
        className="w-full max-w-sm p-7 rounded-3xl animate-scale-in"
        style={{
          background: "rgba(255,255,255,0.04)",
          border: "1px solid rgba(255,255,255,0.09)",
          boxShadow: "0 24px 80px rgba(0,0,0,0.6)",
          backdropFilter: "blur(24px)",
        }}
      >

        {/* Logo + Title */}
        <div className="flex flex-col items-center mb-7">
          <div className="w-20 h-20 rounded-[1.75rem] overflow-hidden mb-4 border border-border/60 shadow-2xl shadow-black/30 bg-card">
            <img src="/green-logo.jpg" alt="CLC" className="w-full h-full object-cover" />
          </div>
          <h1 className="text-xl font-bold text-white tracking-tight">CLC Fastighetsservice</h1>
          <p className="text-xs text-muted-foreground mt-1">Logga in för att fortsätta</p>
        </div>

        {/* Form */}
        <form onSubmit={handleLogin} className="space-y-3">
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Användarnamn"
            autoComplete="username"
            disabled={loading}
            className="w-full px-4 py-3.5 rounded-2xl text-sm text-foreground placeholder:text-muted-foreground bg-transparent focus:outline-none focus:ring-2 focus:ring-primary/50 transition disabled:opacity-50"
            style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)" }}
          />
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Lösenord"
            autoComplete="current-password"
            disabled={loading}
            className="w-full px-4 py-3.5 rounded-2xl text-sm text-foreground placeholder:text-muted-foreground bg-transparent focus:outline-none focus:ring-2 focus:ring-primary/50 transition disabled:opacity-50"
            style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)" }}
          />

          {error && (
            <p className="text-xs text-red-400 text-center py-1.5 rounded-xl" style={{ background: "rgba(255,80,80,0.08)" }}>
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading || !username.trim() || !password.trim()}
            className="w-full py-3.5 rounded-2xl text-sm font-semibold text-white transition-all duration-150 active:scale-[0.98] disabled:opacity-40 mt-1"
            style={{ background: "linear-gradient(135deg,#F4A261,#E76F51)", boxShadow: "0 8px 28px rgba(244,162,97,0.35)" }}
          >
            {loading
              ? <span className="flex items-center justify-center gap-2"><Loader2 size={15} className="animate-spin" /> Loggar in...</span>
              : "Logga in"
            }
          </button>
        </form>

        {/* Divider */}
        <div className="flex items-center gap-3 my-4">
          <div className="flex-1 h-px" style={{ background: "rgba(255,255,255,0.08)" }} />
          <span className="text-xs text-muted-foreground">eller</span>
          <div className="flex-1 h-px" style={{ background: "rgba(255,255,255,0.08)" }} />
        </div>

        {/* Google */}
        <button
          onClick={handleGoogle}
          disabled={loading}
          className="w-full py-3.5 rounded-2xl text-sm font-medium text-foreground flex items-center justify-center gap-2 transition-all duration-150 active:scale-[0.98] disabled:opacity-40"
          style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)" }}
        >
          <svg className="h-4 w-4 flex-shrink-0" viewBox="0 0 24 24">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
          </svg>
          Logga in med Google
        </button>

        <p className="text-[11px] text-muted-foreground text-center mt-5 leading-relaxed">
          Kontakta din administratör om du inte har tillgång
        </p>

      </div>

    </div>
  )
}
