import { useState } from "react"
import { GoogleGenerativeAI } from "@google/generative-ai"

import { Bot, Send, Loader2 } from "lucide-react"

const genAI = new GoogleGenerativeAI(
  import.meta.env.VITE_GEMINI_API_KEY
)

const model = genAI.getGenerativeModel({
  model: "gemini-1.5-flash"
})

export default function AIAssistantPage(){

  const [messages,setMessages] = useState<any[]>([])
  const [input,setInput] = useState("")
  const [loading,setLoading] = useState(false)

  async function send(){

    if(!input || loading) return

    const userMsg = {
      role:"user",
      text:input
    }

    setMessages(prev=>[...prev,userMsg])
    setInput("")
    setLoading(true)

    try{

      const result = await model.generateContent({

        contents:[{
          role:"user",
          parts:[{
            text:`

Du är AI assistent för företaget CLC Fastighetsservice.

Du hjälper med:

- planering
- ruttoptimering
- arbetsrapporter
- maskinsopning
- halkrisk
- väderanalys
- effektivisering av arbetsdag

Svar ska vara korta, tydliga och professionella.

Fråga från användare:
${input}

`
          }]
        }]

      })

      const text = result.response.text()

      setMessages(prev=>[
        ...prev,
        {
          role:"ai",
          text
        }
      ])

    }catch(err){

      setMessages(prev=>[
        ...prev,
        {
          role:"ai",
          text:"AI kunde inte svara just nu."
        }
      ])

    }

    setLoading(false)

  }

  return(

    <div className="flex flex-col h-[calc(100vh-140px)]">

      {/* HEADER */}

      <div className="flex items-center gap-3 mb-4">

        <div className="w-9 h-9 rounded-xl bg-primary/20 flex items-center justify-center">
          <Bot size={18}/>
        </div>

        <div>

          <h1 className="font-semibold">
            CLC AI
          </h1>

          <p className="text-xs text-muted-foreground">
            Powered by Gemini
          </p>

        </div>

      </div>


      {/* CHAT */}

      <div className="flex-1 overflow-y-auto space-y-3 pr-1">

        {messages.length === 0 && (

          <div className="text-sm text-muted-foreground">

            Fråga AI om:

            <ul className="mt-2 space-y-1 list-disc pl-4">
              <li>Planera dagens rutt</li>
              <li>Hur lång tid tar maskinsopning</li>
              <li>Väder och halkrisk</li>
              <li>Arbetsrapport</li>
            </ul>

          </div>

        )}

        {messages.map((m,i)=>(

          <div
            key={i}
            className={`p-3 rounded-xl text-sm max-w-[80%]
            ${m.role==="user"
              ? "bg-primary text-white ml-auto"
              : "bg-white/[0.04] border border-white/[0.06]"
            }`}
          >

            {m.text}

          </div>

        ))}

        {loading && (

          <div className="flex items-center gap-2 text-sm text-muted-foreground">

            <Loader2 className="animate-spin" size={14}/>

            AI tänker...

          </div>

        )}

      </div>


      {/* INPUT */}

      <div className="mt-4 flex gap-2">

        <input
          value={input}
          onChange={(e)=>setInput(e.target.value)}
          placeholder="Fråga AI..."
          className="flex-1 bg-white/[0.04] border border-white/[0.08] rounded-xl px-3 py-2 text-sm"
        />

        <button
          onClick={send}
          disabled={loading}
          className="bg-primary text-white rounded-xl px-3 flex items-center justify-center"
        >

          <Send size={16}/>

        </button>

      </div>

    </div>

  )

}
