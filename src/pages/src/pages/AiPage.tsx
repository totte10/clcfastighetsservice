import { useState } from "react"
import { Bot, Send } from "lucide-react"

export default function AiPage(){

  const [message,setMessage] = useState("")
  const [messages,setMessages] = useState<any[]>([])

  const send = () => {

    if(!message) return

    const newMessages = [
      ...messages,
      {role:"user",content:message}
    ]

    setMessages(newMessages)
    setMessage("")

    const reply = "AI kommer svara här"

    setMessages([
      ...newMessages,
      {role:"assistant",content:reply}
    ])

  }

  return(

    <div className="flex flex-col h-full">

      <div className="flex items-center gap-2 mb-4">
        <Bot className="text-primary"/>
        <h1 className="text-xl font-semibold">AI Assistent</h1>
      </div>

      <div className="flex-1 overflow-y-auto space-y-3">

        {messages.map((m,i)=>(
          <div
            key={i}
            className={`p-3 rounded-xl max-w-[80%]
            ${m.role==="user"
              ? "bg-primary text-white ml-auto"
              : "bg-white/10 text-white"
            }`}
          >
            {m.content}
          </div>
        ))}

      </div>

      <div className="flex gap-2 mt-4">

        <input
          value={message}
          onChange={(e)=>setMessage(e.target.value)}
          placeholder="Fråga AI..."
          className="flex-1 bg-white/10 rounded-xl px-3 py-2 text-sm"
        />

        <button
          onClick={send}
          className="bg-primary px-3 rounded-xl"
        >
          <Send size={18}/>
        </button>

      </div>

    </div>

  )

}
