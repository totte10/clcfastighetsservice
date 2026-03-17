import { useState } from "react"
import { GoogleGenerativeAI } from "@google/generative-ai"

const genAI = new GoogleGenerativeAI(
  import.meta.env.VITE_GEMINI_API_KEY
)

const model = genAI.getGenerativeModel({
  model: "gemini-1.5-flash"
})

export default function AIAssistantPage(){

  const [input,setInput] = useState("")
  const [messages,setMessages] = useState<any[]>([])

  async function send(){

    if(!input) return

    const userMsg = {role:"user",text:input}

    setMessages(prev=>[...prev,userMsg])

    const result = await model.generateContent(input)

    const reply = result.response.text()

    setMessages(prev=>[
      ...prev,
      {role:"ai",text:reply}
    ])

    setInput("")
  }

  return(

    <div className="p-4 space-y-4">

      <h1 className="text-xl font-bold">
        AI Assistent
      </h1>

      <div className="border rounded p-3 h-[400px] overflow-auto">

        {messages.map((m,i)=>(
          <div key={i} className="text-sm mb-2">

            <b>
              {m.role==="user" ? "Du" : "AI"}:
            </b>

            {" "}{m.text}

          </div>
        ))}

      </div>

      <div className="flex gap-2">

        <input
          value={input}
          onChange={(e)=>setInput(e.target.value)}
          placeholder="Fråga AI..."
          className="border rounded px-3 py-2 flex-1"
        />

        <button
          onClick={send}
          className="bg-primary text-white px-4 rounded"
        >
          Skicka
        </button>

      </div>

    </div>

  )
}
