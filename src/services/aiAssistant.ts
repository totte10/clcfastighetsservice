type Msg = { role: "user" | "assistant"; content: string }

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:streamGenerateContent?alt=sse&key=${GEMINI_API_KEY}`

const SYSTEM_PROMPT = `Du är en ELIT AI för CLC Fastighetsservice.

Du fungerar som:
- Driftchef
- Arbetsledare
- Ruttoptimerare

─────────────────────────────
PRIORITERING:
─────────────────────────────
1. Säkerhet (halkrisk först)
2. Effektivitet
3. Minimera körtid

─────────────────────────────
REGLER:
─────────────────────────────
- Ge alltid konkreta beslut
- Prioritera jobb i rätt ordning
- Anpassa efter väder
- Tänk som en chef

─────────────────────────────
SVARFORMAT:
─────────────────────────────
• Punktlista
• Max 5 rader
• Direkt beslut (inga långa texter)`

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
    // Convert messages to Gemini format
    const geminiContents = messages.map((m) => ({
      role: m.role === "assistant" ? "model" : "user",
      parts: [{ text: m.content }],
    }))

    const resp = await fetch(GEMINI_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        systemInstruction: {
          parts: [{ text: SYSTEM_PROMPT }],
        },
        contents: geminiContents,
        generationConfig: {
          temperature: 0.3,
        },
      }),
    })

    if (!resp.ok) {
      const data = await resp.json().catch(() => ({}))
      const msg = data.error?.message || "AI-tjänsten svarade inte."
      onError?.(msg)
      onDone()
      return
    }

    if (!resp.body) {
      onError?.("Inget svar från AI.")
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

      let newlineIndex: number
      while ((newlineIndex = buffer.indexOf("\n")) !== -1) {
        let line = buffer.slice(0, newlineIndex)
        buffer = buffer.slice(newlineIndex + 1)

        if (line.endsWith("\r")) line = line.slice(0, -1)
        if (line.startsWith(":") || line.trim() === "") continue
        if (!line.startsWith("data: ")) continue

        const jsonStr = line.slice(6).trim()
        if (jsonStr === "[DONE]") {
          onDone()
          return
        }

        try {
          const parsed = JSON.parse(jsonStr)
          const text = parsed.candidates?.[0]?.content?.parts?.[0]?.text as string | undefined
          if (text) onDelta(text)
        } catch {
          // Skip malformed chunks
        }
      }
    }
  } catch (e) {
    onError?.(e instanceof Error ? e.message : "Okänt fel")
  }

  onDone()
}

export function useGeminiAssistant() {
  return { streamChat }
}
