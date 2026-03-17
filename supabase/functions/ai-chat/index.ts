import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {

    const { messages, context } = await req.json();

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY saknas");
    }

    /* 🔥 LIVE DATA */
    const dynamicContext = `
LIVE DATA:
${context?.weather ? `
Temperatur: ${context.weather.temp}°C
Nederbörd: ${context.weather.rain} mm
Vind: ${context.weather.wind} m/s
` : "Ingen väderdata"}

${context?.jobs ? `
JOBB:
${context.jobs.map((j: any, i: number) => `
${i + 1}. ${j.name}
Adress: ${j.address}
Status: ${j.status}
`).join("")}
` : "Inga jobb"}
`;

    /* 🧠 ELIT AI */
    const systemPrompt = `
Du är en ELIT AI för CLC Fastighetsservice.

ROLLER:
- Driftchef
- Arbetsledare
- Ruttoptimerare

MÅL:
1. Minimera körtid
2. Prioritera halkrisk
3. Maximera effektivitet

REGLER:
- Svara kort (max 5 rader)
- Punktlista
- Alltid konkreta beslut
-