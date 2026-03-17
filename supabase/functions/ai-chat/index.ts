import { GoogleGenerativeAI } from "@google/generative-ai"

const genAI = new GoogleGenerativeAI(
  Deno.env.get("GEMINI_API_KEY")!
)

const model = genAI.getGenerativeModel({
  model: "gemini-1.5-flash"
})

Deno.serve(async (req) => {

  try {

    const { messages } = await req.json()

    const system = `
Du är en AI för fastighetsservice.

Du hjälper med:
- ruttplanering
- väder
- jobbprioritering

Svara kort, konkret och smart.
`

    const chat = model.startChat({
      history: messages.map((m: any) => ({
        role: m.role,
        parts: [{ text: m.content }]
      }))
    })

    const result = await chat.sendMessageStream(system)

    const stream = new ReadableStream({
      async start(controller) {

        for await (const chunk of result.stream) {
          const text = chunk.text()
          if (text) {
            controller.enqueue(
              new TextEncoder().encode(
                `data: ${JSON.stringify({
                  choices: [{ delta: { content: text } }]
                })}\n\n`
              )
            )
          }
        }

        controller.enqueue(new TextEncoder().encode("data: [DONE]\n\n"))
        controller.close()
      }
    })

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        "Connection": "keep-alive",
      }
    })

  } catch (err: any) {

    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500 }
    )

  }

})