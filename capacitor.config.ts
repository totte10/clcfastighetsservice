import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "app.lovable.97f133e1bcec4740b042341f70e5224c",
  appName: "clcfastighetsservice",
  webDir: "dist",
  server: {
    url: "https://97f133e1-bcec-4740-b042-341f70e5224c.lovableproject.com?forceHideBadge=true",
    cleartext: true,
  },
  plugins: {
    KeepAwake: {
      // Keeps screen/process awake during voice
    },
  },
  ios: {
    backgroundColor: "#ffffff",
    contentInset: "automatic",
  },
  android: {
    backgroundColor: "#ffffff",
  },
};

export default config;
