import { Sun, Cloud, CloudRain, Zap } from "lucide-react"

const forecast = [
  { day: "Mon", temp: "32° / 23°", icon: "sun" },
  { day: "Tue", temp: "32° / 24°", icon: "cloud", active: true },
  { day: "Wed", temp: "28° / 19°", icon: "cloud" },
  { day: "Thu", temp: "26° / 16°", icon: "storm" },
  { day: "Fri", temp: "24° / 14°", icon: "rain" },
  { day: "Sat", temp: "23° / 14°", icon: "storm" },
  { day: "Sun", temp: "26° / 18°", icon: "sun" }
]

function WeatherIcon({ type, size = 26 }: { type: string; size?: number }) {
  if (type === "sun") return <Sun size={size} className="text-yellow-400" />
  if (type === "cloud") return <Cloud size={size} className="text-gray-300" />
  if (type === "storm") return <Zap size={size} className="text-yellow-300" />
  if (type === "rain") return <CloudRain size={size} className="text-blue-400" />
  return null
}

export default function WeatherCard() {
  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-6">

      <div className="w-full max-w-4xl rounded-3xl p-6 
        bg-white/5 backdrop-blur-xl border border-white/10 
        shadow-[0_0_60px_rgba(0,0,0,0.6)] text-white flex gap-6">

        {/* LEFT PANEL */}
        <div className="flex-1 flex flex-col justify-between">

          <div className="flex items-center gap-4">
            <div className="p-3 rounded-full bg-white/10">
              <Cloud size={40} className="text-white/80" />
            </div>

            <div>
              <h1 className="text-5xl font-semibold">24°C</h1>
              <p className="text-sm text-white/60">H: 32° L: 24°</p>
            </div>
          </div>

          <div>
            <h2 className="text-3xl font-semibold mt-6">
              PARTLY CLOUDY
            </h2>

            <div className="flex gap-6 mt-6 text-sm text-white/70">
              <div>
                <p>🌬 Wind</p>
                <p className="text-white font-medium">9 km/h</p>
              </div>

              <div>
                <p>💧 Humidity</p>
                <p className="text-white font-medium">12%</p>
              </div>
            </div>
          </div>

        </div>

        {/* RIGHT PANEL */}
        <div className="flex-1">

          <div className="flex justify-between items-center mb-4">
            <h3 className="text-sm text-white/60 tracking-wide">
              VANCOUVER
            </h3>

            <p className="text-xs text-white/50">
              20 Feb, 8:21 PM
            </p>
          </div>

          <div className="grid grid-cols-4 gap-3">

            {forecast.map((f, i) => (
              <div
                key={i}
                className={`
                  p-3 rounded-xl flex flex-col items-center gap-2 
                  transition-all duration-300
                  ${f.active 
                    ? "bg-white/10 border border-white/20 scale-105 shadow-lg" 
                    : "bg-white/5 hover:bg-white/10"}
                `}
              >
                <p className="text-xs text-white/60">{f.day}</p>

                <WeatherIcon type={f.icon} />

                <p className="text-xs font-medium text-white/90">
                  {f.temp}
                </p>
              </div>
            ))}

          </div>

        </div>

      </div>
    </div>
  )
}