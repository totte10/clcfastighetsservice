import { VoiceChannels } from "@/components/voice/VoiceChannels";
import { Volume2 } from "lucide-react";

export default function VoicePage() {
  return (
    <div className="p-4 max-w-lg mx-auto space-y-4">
      <div className="flex items-center gap-2">
        <Volume2 className="h-5 w-5 text-primary" />
        <h1 className="text-lg font-semibold text-foreground">Röstkanaler</h1>
      </div>
      <VoiceChannels />
    </div>
  );
}
