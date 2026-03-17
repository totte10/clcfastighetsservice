type Msg = { role: "user" | "assistant"; content: string }

/* ─────────────────────────────
   URLS
───────────────────────────── */

const BASE_URL = import.meta.env.VITE_SUPABASE_URL
const CHAT_URL = `${BASE_URL}/functions/v1/ai-chat`
const IMAGE_URL = `${BASE_URL}/functions/v1/ai-image`

/* ─────────────────────────────
   FREE LIMIT SYSTEM (DAILY)
───────────────────────────── */

const LIMIT_PER_DAY = 20

function checkLimit() {
  const today = new Date().toDateString()
  const key = `ai_usage_${today}`

  const used = Number(localStorage.getItem(key) || 0)

  if (used >= LIMIT_PER_DAY) {
    throw new Error("Gratisgräns nådd idag (20 AI-anrop)")
  }

  localStorage.setItem(key, String(used + 1))
}

/* ─────────────────────────────
   CHAT STREAM (TEXT AI)
───────────────────────────── */

export async function streamChat({
  messages,
  onDelta,
  onDone,
  onError,
}: {
  messages: Msg[]
  onDelta: (text: string) => void
  onDone: () => void
  onError?: (error: string) => void
}) {

  try {

    checkLimit()

    const resp = await fetch(CHAT_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
      },
      body: JSON.stringify({ messages }),
    })

    if (!resp.ok) {
      let msg = "AI svarade inte"
      try {
        const data = await resp.json()
        msg = data.error || msg
      } catch {}
      onError?.(msg)
      onDone()
      return
    }

    if (!resp.body) {
      onError?.("Tomt svar från AI")
      onDone()
      return
    }

    const reader = resp.body.getReader()
    const decoder = new TextDecoder()
    let buffer = ""

    while (true) {

      const { done, value } = await reader.read()
      if (done) break

      buffer += decoder.decode(value, { stream: true })

      const lines = buffer.split("\n")
      buffer = lines.pop() || ""

      for (let line of lines) {

        line = line.trim()

        if (!line || line.startsWith(":")) continue
        if (!line.startsWith("data:")) continue

        const jsonStr = line.replace("data:", "").trim()

        if (jsonStr === "[DONE]") {
          onDone()
          return
        }

        try {

          const parsed = JSON.parse(jsonStr)

          const content =
            parsed?.choices?.[0]?.delta?.content ||
            parsed?.text ||
            ""

          if (content) onDelta(content)

        } catch {
          buffer = jsonStr + buffer
        }
      }
    }

    onDone()

  } catch (err: any) {

    console.error("AI stream error:", err)

    onError?.(err?.message || "Nätverksfel")
    onDone()

  }
}

/* ─────────────────────────────
   IMAGE ANALYSIS (GEMINI)
───────────────────────────── */

export async function analyzeImage(base64: string) {

  try {

    checkLimit()

    const resp = await fetch(IMAGE_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
      },
      body: JSON.stringify({ image: base64 }),
    })

    if (!resp.ok) {
      let msg = "Bildanalys misslyckades"
      try {
        const data = await resp.json()
        msg = data.error || msg
      } catch {}
      throw new Error(msg)
    }

    const data = await resp.json()

    return data.result || "Ingen analys"

  } catch (err: any) {

    console.error("Image error:", err)

    throw new Error(err?.message || "Bildfel")

  }
}

/* ─────────────────────────────
   HOOK
───────────────────────────── */

export function useGeminiAssistant() {
  return {
    streamChat,
    analyzeImage
  }
}