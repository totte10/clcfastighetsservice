import { useState, useEffect, useRef } from "react"
import { supabase } from "@/integrations/supabase/client"
import { useAuth } from "@/hooks/useAuth"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

import { Send, MessageCircle } from "lucide-react"
import { toast } from "sonner"

import { VoiceChannels } from "@/components/voice/VoiceChannels"

interface ChatMessage{
id:string
sender_name:string
content:string
created_at:string
}

export default function ChatPage(){

const { user } = useAuth()

const [messages,setMessages] = useState<ChatMessage[]>([])
const [newMessage,setNewMessage] = useState("")
const [senderName,setSenderName] = useState("")

const bottomRef = useRef<HTMLDivElement>(null)

useEffect(()=>{

loadProfile()
fetchMessages()

const channel = supabase
.channel("chat_messages")
.on(
"postgres_changes",
{event:"INSERT",schema:"public",table:"chat_messages"},
(payload)=>{
setMessages(prev=>[...prev,payload.new as ChatMessage])
}
)
.subscribe()

return()=>{ supabase.removeChannel(channel) }

},[])

useEffect(()=>{
bottomRef.current?.scrollIntoView({behavior:"smooth"})
},[messages])

async function loadProfile(){

if(!user) return

const { data } = await supabase
.from("profiles")
.select("full_name,username")
.eq("id",user.id)
.single()

if(data){

setSenderName(
data.full_name ||
data.username ||
"Användare"
)

}

}

async function fetchMessages(){

const { data,error } = await supabase
.from("chat_messages")
.select("*")
.order("created_at",{ascending:true})
.limit(200)

if(error){
toast.error("Kunde inte hämta meddelanden")
return
}

setMessages(data || [])

}

async function handleSend(e:React.FormEvent){

e.preventDefault()

if(!newMessage.trim()) return

const { error } = await supabase
.from("chat_messages")
.insert({
sender_name:senderName,
content:newMessage.trim()
})

if(error){
toast.error("Kunde inte skicka meddelande")
return
}

setNewMessage("")

}

function formatTime(dateStr:string){

const d = new Date(dateStr)

return d.toLocaleTimeString("sv-SE",{
hour:"2-digit",
minute:"2-digit"
})

}

function formatDate(dateStr:string){

const d = new Date(dateStr)

return d.toLocaleDateString("sv-SE",{
weekday:"short",
day:"numeric",
month:"short"
})

}

const grouped:{date:string,msgs:ChatMessage[]}[]=[]

messages.forEach(msg=>{

const date = new Date(msg.created_at).toDateString()

const last = grouped[grouped.length-1]

if(last && last.date===date){
last.msgs.push(msg)
}else{
grouped.push({date,msgs:[msg]})
}

})

return(

<div className="flex flex-col h-[calc(100vh-2rem)] max-h-[calc(100vh-2rem)]">

<div className="flex items-center justify-between p-4 border-b border-border">

<div className="flex items-center gap-2">

<MessageCircle className="h-5 w-5 text-primary"/>

<h1 className="text-lg font-semibold">
Teamchatt
</h1>

</div>

<span className="text-xs text-muted-foreground">

Inloggad som <strong>{senderName}</strong>

</span>

</div>

<div className="p-3 border-b border-border">
<VoiceChannels/>
</div>

<div className="flex-1 overflow-y-auto p-4 space-y-4">

{grouped.length===0 &&(

<div className="flex items-center justify-center h-full text-muted-foreground text-sm">

Inga meddelanden ännu. Skriv det första!

</div>

)}

{grouped.map(group=>(

<div key={group.date}>

<div className="flex justify-center my-3">

<span className="text-[10px] uppercase tracking-widest text-muted-foreground bg-muted px-3 py-1 rounded-full">

{formatDate(group.msgs[0].created_at)}

</span>

</div>

<div className="space-y-1.5">

{group.msgs.map((msg,i)=>{

const isMe = msg.sender_name === senderName

const showName =
i===0 ||
group.msgs[i-1].sender_name!==msg.sender_name

return(

<div
key={msg.id}
className={`flex ${isMe ? "justify-end" : "justify-start"}`}
>

<div className={`max-w-[75%] ${isMe ? "items-end" : "items-start"} flex flex-col`}>

{showName && !isMe &&(

<span className="text-[10px] text-primary font-medium ml-3 mb-0.5">

{msg.sender_name}

</span>

)}

<div
className={`px-3 py-2 rounded-2xl text-sm leading-relaxed ${
isMe
? "bg-primary text-primary-foreground rounded-br-md"
: "bg-secondary text-secondary-foreground rounded-bl-md"
}`}
>

{msg.content}

<span className="text-[9px] ml-2 opacity-60">

{formatTime(msg.created_at)}

</span>

</div>

</div>

</div>

)

})}

</div>

</div>

))}

<div ref={bottomRef}/>

</div>

<form onSubmit={handleSend} className="p-3 border-t border-border flex gap-2">

<Input
value={newMessage}
onChange={(e)=>setNewMessage(e.target.value)}
placeholder="Skriv ett meddelande..."
className="flex-1"
/>

<Button type="submit" size="icon" disabled={!newMessage.trim()}>

<Send className="h-4 w-4"/>

</Button>

</form>

</div>

)

}