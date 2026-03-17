type Msg = { role: "user" | "assistant"; content: string }

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-chat`

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

    const resp = await fetch(CHAT_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
      },
      body: JSON.stringify({ messages }),
    })

    /* ❌ ERROR RESPONSE */
    if (!resp.ok) {
      let msg = "AI-tjänsten svarade inte."
      try {
        const data = await resp.json()
        msg = data.error || msg
      } catch {}
      onError?.(msg)
      onDone()
      return
    }

    if (!resp.body) {
      onError?.("Tomt svar från AI.")
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

        /* 🛑 DONE */
        if (jsonStr === "[DONE]") {
          onDone()
          return
        }

        try {

          const parsed = JSON.parse(jsonStr)

          const content =
            parsed?.choices?.[0]?.delta?.content ||
            parsed?.text || ""

          if (content) onDelta(content)

        } catch {
          // buffer incomplete JSON, vänta nästa chunk
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


/* 🔥 HOOK (redo för framtida features) */
export function useGeminiAssistant() {

  const send = async (params: any) => {
    return streamChat(params)
  }

  return {
    streamChat,
    send
  }
}