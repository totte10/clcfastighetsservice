import { useEffect, useRef } from "react"
import { Room, RoomEvent, createLocalAudioTrack } from "livekit-client"

interface Props {
  token: string
  serverUrl: string
  isMuted: boolean
  onDisconnected?: () => void
}

export function VoiceRoom({ token, serverUrl, isMuted, onDisconnected }: Props) {

  const roomRef = useRef<Room | null>(null)
  const trackRef = useRef<any>(null)

  useEffect(() => {

    async function startVoice() {

      const room = new Room({
        adaptiveStream: true,
        dynacast: true,
        audioCaptureDefaults: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          channelCount: 1,
          sampleRate: 48000
        }
      })

      roomRef.current = room

      room.on(RoomEvent.Disconnected, () => {
        onDisconnected && onDisconnected()
      })

      await room.connect(serverUrl, token)

      const track = await createLocalAudioTrack({
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true
      })

      trackRef.current = track

      await room.localParticipant.publishTrack(track)

      if (isMuted) {
        track.mute()
      }

    }

    startVoice()

    return () => {

      if (trackRef.current) {
        trackRef.current.stop()
      }

      if (roomRef.current) {
        roomRef.current.disconnect()
      }

    }

  }, [])

  useEffect(() => {

    if (!trackRef.current) return

    if (isMuted) {
      trackRef.current.mute()
    } else {
      trackRef.current.unmute()
    }

  }, [isMuted])

  return null
}
