type Msg = { role: "user" | "assistant"; content: string }

type AssistantContext = {
  weather?: { temp: number; rain: number; wind: number } | null
  jobs?: Array<{ name: string; address: string; status: string }> | null
  project?: { id: string; name: string; projectNumber?: string | null } | null
}

const AI_CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-chat`

export async function streamChat({
  messages,
  context,
  onDelta,
  onDone,
  onError,
}: {
  messages: Msg[]
  context?: AssistantContext
  onDelta: (text: string) => void
  onDone: () => void
  onError?: (error: string) => void
}) {
  try {
    const resp = await fetch(AI_CHAT_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
      },
      body: JSON.stringify({ messages, context }),
    })

    if (!resp.ok) {
      const data = await resp.json().catch(() => ({}))
      const fallback =
        resp.status === 429
          ? "För många AI-förfrågningar just nu. Försök snart igen."
          : resp.status === 402
            ? "AI-krediterna är slut för tillfället."
            : "AI-tjänsten svarade inte."
      onError?.(data.error || fallback)
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
    let textBuffer = ""
    let streamDone = false

    while (!streamDone) {
      const { done, value } = await reader.read()
      if (done) break
      textBuffer += decoder.decode(value, { stream: true })

      let newlineIndex: number
      while ((newlineIndex = textBuffer.indexOf("\n")) !== -1) {
        let line = textBuffer.slice(0, newlineIndex)
        textBuffer = textBuffer.slice(newlineIndex + 1)

        if (line.endsWith("\r")) line = line.slice(0, -1)
        if (line.startsWith(":") || line.trim() === "") continue
        if (!line.startsWith("data: ")) continue

        const jsonStr = line.slice(6).trim()
        if (jsonStr === "[DONE]") {
          streamDone = true
          break
        }

        try {
          const parsed = JSON.parse(jsonStr)
          const content = parsed.choices?.[0]?.delta?.content as string | undefined
          if (content) onDelta(content)
        } catch {
          textBuffer = `${line}\n${textBuffer}`
          break
        }
      }
    }

    if (textBuffer.trim()) {
      for (let raw of textBuffer.split("\n")) {
        if (!raw) continue
        if (raw.endsWith("\r")) raw = raw.slice(0, -1)
        if (raw.startsWith(":") || raw.trim() === "") continue
        if (!raw.startsWith("data: ")) continue

        const jsonStr = raw.slice(6).trim()
        if (jsonStr === "[DONE]") continue

        try {
          const parsed = JSON.parse(jsonStr)
          const content = parsed.choices?.[0]?.delta?.content as string | undefined
          if (content) onDelta(content)
        } catch {
          // ignore partial leftovers
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
