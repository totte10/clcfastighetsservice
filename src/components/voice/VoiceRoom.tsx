import { useEffect, useRef } from "react";
import { Room, RoomEvent, Track } from "livekit-client";

interface VoiceRoomProps {
  token: string;
  serverUrl: string;
  isMuted: boolean;
  onDisconnected: () => void;
}

export function VoiceRoom({ token, serverUrl, isMuted, onDisconnected }: VoiceRoomProps) {
  const roomRef = useRef<Room | null>(null);

  useEffect(() => {
    const room = new Room({
      adaptiveStream: true,
      dynacast: true,
    });

    roomRef.current = room;

    room.on(RoomEvent.Disconnected, () => {
      onDisconnected();
    });

    room.on(RoomEvent.TrackSubscribed, (track) => {
      if (track.kind === Track.Kind.Audio) {
        const el = track.attach();
        document.body.appendChild(el);
        el.style.display = "none";
        el.dataset.livekitAudio = "true";
      }
    });

    room.on(RoomEvent.TrackUnsubscribed, (track) => {
      track.detach().forEach((el) => el.remove());
    });

    room
      .connect(serverUrl, token)
      .then(async () => {
        await room.localParticipant.setMicrophoneEnabled(true);
        if (isMuted) {
          await room.localParticipant.setMicrophoneEnabled(false);
        }
      })
      .catch((err) => {
        console.error("LiveKit connect error:", err);
        onDisconnected();
      });

    return () => {
      // Cleanup audio elements
      document.querySelectorAll("[data-livekit-audio]").forEach((el) => el.remove());
      room.disconnect();
    };
  }, [token, serverUrl]);

  // Handle mute changes
  useEffect(() => {
    const room = roomRef.current;
    if (room?.localParticipant) {
      room.localParticipant.setMicrophoneEnabled(!isMuted);
    }
  }, [isMuted]);

  return null; // Audio-only, no visual rendering
}
