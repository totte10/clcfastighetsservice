import { useEffect, useRef, useCallback } from "react";
import { Room, RoomEvent, Track, ConnectionState } from "livekit-client";
import { Capacitor } from "@capacitor/core";
import { App } from "@capacitor/app";
import { Network } from "@capacitor/network";

interface VoiceRoomProps {
  token: string;
  serverUrl: string;
  isMuted: boolean;
  onDisconnected: () => void;
}

let keepAwakeModule: { keepAwake: () => Promise<void>; allowSleep: () => Promise<void> } | null = null;

async function loadKeepAwake() {
  if (Capacitor.isNativePlatform()) {
    try {
      const mod = await import("@capacitor-community/keep-awake");
      keepAwakeModule = { keepAwake: mod.KeepAwake.keepAwake, allowSleep: mod.KeepAwake.allowSleep };
    } catch {
      // Plugin not available
    }
  }
}

export function VoiceRoom({ token, serverUrl, isMuted, onDisconnected }: VoiceRoomProps) {
  const roomRef = useRef<Room | null>(null);
  const reconnectingRef = useRef(false);
  const tokenRef = useRef(token);
  const serverUrlRef = useRef(serverUrl);

  tokenRef.current = token;
  serverUrlRef.current = serverUrl;

  const connectRoom = useCallback(async (room: Room) => {
    try {
      await room.connect(serverUrlRef.current, tokenRef.current);
      await room.localParticipant.setMicrophoneEnabled(!isMuted);
      reconnectingRef.current = false;

      // Keep device awake while in voice
      if (Capacitor.isNativePlatform()) {
        await loadKeepAwake();
        keepAwakeModule?.keepAwake();
      }
    } catch (err) {
      console.error("LiveKit connect error:", err);
      // Retry after delay
      if (!reconnectingRef.current) {
        reconnectingRef.current = true;
        setTimeout(() => {
          if (roomRef.current) connectRoom(roomRef.current);
        }, 3000);
      }
    }
  }, [isMuted]);

  useEffect(() => {
    const room = new Room({
      adaptiveStream: true,
      dynacast: true,
      reconnectPolicy: {
        nextRetryDelayInMs: (context) => {
          // Exponential backoff: 1s, 2s, 4s, 8s, max 15s — up to 20 retries
          if (context.retryCount > 20) return null;
          return Math.min(1000 * Math.pow(2, context.retryCount), 15000);
        },
      },
    });

    roomRef.current = room;

    room.on(RoomEvent.Disconnected, () => {
      // Only truly disconnect if we're not trying to reconnect
      if (!reconnectingRef.current) {
        onDisconnected();
      }
    });

    room.on(RoomEvent.Reconnecting, () => {
      console.log("LiveKit: reconnecting...");
      reconnectingRef.current = true;
    });

    room.on(RoomEvent.Reconnected, () => {
      console.log("LiveKit: reconnected!");
      reconnectingRef.current = false;
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

    connectRoom(room);

    // --- Native app state handling ---
    let appStateListener: { remove: () => void } | null = null;
    let networkListener: { remove: () => void } | null = null;

    if (Capacitor.isNativePlatform()) {
      // Handle app going to background/foreground
      App.addListener("appStateChange", async ({ isActive }) => {
        if (isActive && room.state === ConnectionState.Disconnected) {
          console.log("App resumed — reconnecting voice...");
          reconnectingRef.current = true;
          await connectRoom(room);
        }
      }).then((l) => { appStateListener = l; });

      // Handle network changes (WiFi ↔ cellular)
      Network.addListener("networkStatusChange", async (status) => {
        if (status.connected && room.state === ConnectionState.Disconnected) {
          console.log("Network restored — reconnecting voice...");
          reconnectingRef.current = true;
          setTimeout(() => connectRoom(room), 1500);
        }
      }).then((l) => { networkListener = l; });
    } else {
      // Web: handle online/offline
      const handleOnline = () => {
        if (room.state === ConnectionState.Disconnected) {
          console.log("Network online — reconnecting voice...");
          reconnectingRef.current = true;
          setTimeout(() => connectRoom(room), 1500);
        }
      };
      window.addEventListener("online", handleOnline);

      // Handle visibility change for web
      const handleVisibility = () => {
        if (document.visibilityState === "visible" && room.state === ConnectionState.Disconnected) {
          console.log("Tab visible — reconnecting voice...");
          reconnectingRef.current = true;
          connectRoom(room);
        }
      };
      document.addEventListener("visibilitychange", handleVisibility);

      return () => {
        window.removeEventListener("online", handleOnline);
        document.removeEventListener("visibilitychange", handleVisibility);
        document.querySelectorAll("[data-livekit-audio]").forEach((el) => el.remove());
        keepAwakeModule?.allowSleep();
        room.disconnect();
      };
    }

    return () => {
      appStateListener?.remove();
      networkListener?.remove();
      document.querySelectorAll("[data-livekit-audio]").forEach((el) => el.remove());
      keepAwakeModule?.allowSleep();
      room.disconnect();
    };
  }, [token, serverUrl, connectRoom, onDisconnected]);

  // Handle mute changes
  useEffect(() => {
    const room = roomRef.current;
    if (room?.localParticipant) {
      room.localParticipant.setMicrophoneEnabled(!isMuted);
    }
  }, [isMuted]);

  return null; // Audio-only, no visual rendering
}
