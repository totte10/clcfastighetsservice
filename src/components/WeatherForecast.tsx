import { Sun, Cloud, CloudRain, Zap } from "lucide-react"

const forecast = [
  {
    day: "Idag",
    temp: "15-20°",
    icon: "sun",
    label: "Soligt"
  },
  {
    day: "Mån",
    temp: "16-22°",
    icon: "cloud",
    label: "Molnigt"
  },
  {
    day: "Tis",
    temp: "17-20°",
    icon: "storm",
    label: "Åska"
  },
  {
    day: "Ons",
    temp: "16-21°",
    icon: "rain",
    label: "Regn"
  }
]

function WeatherIcon({ type }: { type: string }) {

  if (type === "sun") return <Sun className="text-yellow-400" size={22} />
  if (type === "cloud") return <Cloud className="text-gray-300" size={22} />
  if (type === "storm") return <Zap className="text-yellow-300" size={22} />
  if (type === "rain") return <CloudRain className="text-blue-400" size={22} />

  return null
}

export default function WeatherForecast() {

  return (

    <div className="glass-card p-4">

      <div className="flex gap-4 overflow-x-auto">

        {forecast.map((f, i) => (

          <div
            key={i}
            className="flex flex-col items-center gap-1 min-w-[80px]"
          >

            <p className="text-xs text-muted-foreground">
              {f.day}
            </p>

            <WeatherIcon type={f.icon} />

            <p className="text-xs text-white/80">
              {f.label}
            </p>

            <p className="text-xs font-semibold">
              {f.temp}
            </p>

          </div>

        ))}

      </div>

    </div>

  )
}
