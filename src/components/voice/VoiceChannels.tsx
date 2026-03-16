import { useState, useEffect, useMemo } from "react"
import { supabase } from "@/integrations/supabase/client"
import { useAuth } from "@/hooks/useAuth"
import { Mic, MicOff, PhoneOff, Volume2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import { VoiceRoom } from "./VoiceRoom"

interface Participant {
  id: string
  channel_name: string
  user_id: string
  display_name: string
  is_muted: boolean
}

const CHANNELS = [
  { name: "Maskinsopning", icon: "🧹" },
  { name: "Framblåsning", icon: "🌬️" },
]

export function VoiceChannels() {

  const { user, profile } = useAuth()

  const [participants,setParticipants] = useState<Participant[]>([])
  const [activeChannel,setActiveChannel] = useState<string | null>(null)

  const [token,setToken] = useState<string | null>(null)
  const [livekitUrl,setLivekitUrl] = useState<string | null>(null)

  const [isMuted,setIsMuted] = useState(false)

  /* ---------------- load participants realtime ---------------- */

  useEffect(()=>{

    fetchParticipants()

    const channel = supabase
      .channel("voice_presence")
      .on(
        "postgres_changes",
        { event:"*", schema:"public", table:"voice_channel_participants" },
        ()=>fetchParticipants()
      )
      .subscribe()

    return ()=> { supabase.removeChannel(channel) }

  },[])

  async function fetchParticipants(){

    const { data } = await supabase
      .from("voice_channel_participants")
      .select("*")

    if(data) setParticipants(data as Participant[])

  }

  /* ---------------- join channel ---------------- */

  async function joinChannel(channelName:string){

    if(!user) return

    try{

      const { data,error } = await supabase.functions.invoke(
        "livekit-token",
        { body:{ room:channelName } }
      )

      if(error || !data?.token){

        toast.error("Kunde inte ansluta")

        return

      }

      await supabase
        .from("voice_channel_participants")
        .delete()
        .eq("user_id",user.id)

      await supabase
        .from("voice_channel_participants")
        .insert({

          channel_name:channelName,
          user_id:user.id,
          display_name:profile?.fullName || "Användare",
          is_muted:false

        })

      setToken(data.token)
      setLivekitUrl(data.url)
      setActiveChannel(channelName)
      setIsMuted(false)

    }catch{

      toast.error("Röstkanal fel")

    }

  }

  /* ---------------- leave ---------------- */

  async function leaveChannel(){

    if(!user) return

    await supabase
      .from("voice_channel_participants")
      .delete()
      .eq("user_id",user.id)

    setActiveChannel(null)
    setToken(null)
    setLivekitUrl(null)
    setIsMuted(false)

  }

  /* ---------------- mute ---------------- */

  async function toggleMute(){

    if(!user || !activeChannel) return

    const newMuted = !isMuted

    setIsMuted(newMuted)

    await supabase
      .from("voice_channel_participants")
      .update({ is_muted:newMuted })
      .eq("user_id",user.id)

  }

  /* ---------------- helpers ---------------- */

  const channelParticipants = (name:string)=>
    participants.filter(p=>p.channel_name===name)

  const speakingIndicator = (muted:boolean)=>

    muted
      ? "text-red-400"
      : "text-emerald-400 animate-pulse"

  /* ---------------- UI ---------------- */

  return(

    <div className="space-y-3">

      <div className="flex items-center gap-2 text-xs text-muted-foreground uppercase tracking-wider">

        <Volume2 className="w-4 h-4"/>
        Röstkanaler

      </div>

      {CHANNELS.map(ch=>{

        const members = channelParticipants(ch.name)
        const isActive = activeChannel===ch.name

        return(

          <div
            key={ch.name}
            className="
            rounded-xl
            border border-white/5
            bg-white/[0.03]
            backdrop-blur-xl
            overflow-hidden
            ">

            {/* channel button */}

            <button

              onClick={()=>{

                if(isActive) return

                joinChannel(ch.name)

              }}

              className={`
              w-full
              flex
              items-center
              gap-2
              px-3
              py-3
              text-sm
              font-medium
              transition
              ${isActive
                ? "bg-emerald-500/10 text-emerald-400"
                : "hover:bg-white/[0.05]"}
              `}

            >

              <span>{ch.icon}</span>

              <span className="flex-1 text-left">
                {ch.name}
              </span>

              {members.length>0 &&

              <span className="
              text-[10px]
              bg-emerald-500/20
              text-emerald-400
              px-2
              py-[2px]
              rounded-full
              font-semibold
              ">

                {members.length}

              </span>

              }

            </button>

            {/* members */}

            {members.length>0 &&

            <div className="px-4 pb-3 space-y-1">

              {members.map(m=>

                <div
                  key={m.id}
                  className="flex items-center gap-2 text-xs text-muted-foreground"
                >

                  {m.is_muted

                    ? <MicOff className="w-3 h-3 text-red-400"/>

                    : <Mic className={`w-3 h-3 ${speakingIndicator(false)}`}/>

                  }

                  <span className={
                    m.user_id===user?.id
                      ? "text-foreground font-medium"
                      : ""
                  }>

                    {m.display_name}

                  </span>

                </div>

              )}

            </div>

            }

          </div>

        )

      })}

      {/* active controls */}

      {activeChannel &&

      <div className="
      flex
      items-center
      gap-2
      pt-1
      ">

        <div className="
        flex-1
        text-xs
        text-emerald-400
        font-medium
        flex
        items-center
        gap-1
        ">

          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"/>
          Ansluten till {activeChannel}

        </div>

        <Button
          size="icon"
          variant={isMuted ? "destructive" : "secondary"}
          className="h-7 w-7"
          onClick={toggleMute}
        >

          {isMuted
            ? <MicOff className="w-3.5 h-3.5"/>
            : <Mic className="w-3.5 h-3.5"/>
          }

        </Button>

        <Button
          size="icon"
          variant="destructive"
          className="h-7 w-7"
          onClick={leaveChannel}
        >

          <PhoneOff className="w-3.5 h-3.5"/>

        </Button>

      </div>

      }

      {/* hidden voice room */}

      {activeChannel && token && livekitUrl &&

        <VoiceRoom
          token={token}
          serverUrl={livekitUrl}
          isMuted={isMuted}
          onDisconnected={leaveChannel}
        />

      }

    </div>

  )

}
