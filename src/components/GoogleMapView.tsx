import { GoogleMap, Marker, InfoWindow, useLoadScript } from "@react-google-maps/api"
import { useState, useMemo } from "react"
import { Loader2 } from "lucide-react"

export interface MapMarker {
  lat: number
  lng: number
  label?: string
  color?: "green" | "orange" | "red" | "blue"
  id?: string
}

interface GoogleMapViewProps {
  markers: MapMarker[]
  center?: { lat: number; lng: number }
  zoom?: number
  className?: string
  height?: string
}

const STATUS_COLORS: Record<string, string> = {
  green: "#22c55e",
  orange: "#f59e0b",
  red: "#ef4444",
  blue: "#3b82f6",
}

const MAP_STYLES = [
  { elementType: "geometry", stylers: [{ color: "#1a1a2e" }] },
  { elementType: "labels.text.stroke", stylers: [{ color: "#1a1a2e" }] },
  { elementType: "labels.text.fill", stylers: [{ color: "#9ca3af" }] },
  { featureType: "road", elementType: "geometry", stylers: [{ color: "#2d2d44" }] },
  { featureType: "road", elementType: "geometry.stroke", stylers: [{ color: "#1a1a2e" }] },
  { featureType: "road.highway", elementType: "geometry", stylers: [{ color: "#374151" }] },
  { featureType: "water", elementType: "geometry", stylers: [{ color: "#0f0f1a" }] },
  { featureType: "poi", elementType: "geometry", stylers: [{ color: "#1e1e30" }] },
  { featureType: "poi", elementType: "labels.text.fill", stylers: [{ color: "#6b7280" }] },
  { featureType: "transit", elementType: "geometry", stylers: [{ color: "#1e1e30" }] },
  { featureType: "administrative", elementType: "geometry", stylers: [{ color: "#374151" }] },
  { featureType: "administrative.country", elementType: "labels.text.fill", stylers: [{ color: "#9ca3af" }] },
  { featureType: "administrative.locality", elementType: "labels.text.fill", stylers: [{ color: "#d1d5db" }] },
]

function createMarkerIcon(color: string = "blue") {
  const hex = STATUS_COLORS[color] || STATUS_COLORS.blue
  return {
    path: "M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z",
    fillColor: hex,
    fillOpacity: 1,
    strokeColor: "#ffffff",
    strokeWeight: 2,
    scale: 1.6,
    anchor: new window.google.maps.Point(12, 22),
  }
}

export function GoogleMapView({
  markers,
  center,
  zoom = 12,
  className = "w-full rounded-xl overflow-hidden",
  height = "280px",
}: GoogleMapViewProps) {
  const [activeMarker, setActiveMarker] = useState<string | null>(null)

  const { isLoaded } = useLoadScript({
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_KEY || "",
  })

  const validMarkers = useMemo(
    () => markers.filter((m) => m.lat != null && m.lng != null && !isNaN(m.lat) && !isNaN(m.lng)),
    [markers]
  )

  const mapCenter = useMemo(() => {
    if (center) return center
    if (validMarkers.length > 0) return { lat: validMarkers[0].lat, lng: validMarkers[0].lng }
    return { lat: 57.7089, lng: 11.9746 }
  }, [center, validMarkers])

  if (!isLoaded) {
    return (
      <div
        className={`${className} bg-[#1a1a2e] flex items-center justify-center`}
        style={{ height }}
      >
        <Loader2 className="animate-spin text-primary" size={24} />
      </div>
    )
  }

  if (validMarkers.length === 0) {
    return (
      <div
        className={`${className} bg-[#1a1a2e] flex items-center justify-center`}
        style={{ height }}
      >
        <p className="text-sm text-muted-foreground">Inga kartpositioner ännu</p>
      </div>
    )
  }

  return (
    <div className={className} style={{ height }}>
      <GoogleMap
        zoom={zoom}
        center={mapCenter}
        mapContainerStyle={{ width: "100%", height: "100%" }}
        options={{
          styles: MAP_STYLES,
          disableDefaultUI: false,
          zoomControl: true,
          streetViewControl: false,
          mapTypeControl: false,
          fullscreenControl: false,
        }}
      >
        {validMarkers.map((marker, index) => {
          const markerId = marker.id || `marker-${index}`
          return (
            <Marker
              key={markerId}
              position={{ lat: marker.lat, lng: marker.lng }}
              icon={isLoaded ? createMarkerIcon(marker.color || "blue") : undefined}
              onClick={() => setActiveMarker(markerId)}
            >
              {activeMarker === markerId && marker.label && (
                <InfoWindow onCloseClick={() => setActiveMarker(null)}>
                  <div style={{ color: "#111", fontWeight: 600, fontSize: 13, maxWidth: 180 }}>
                    {marker.label}
                  </div>
                </InfoWindow>
              )}
            </Marker>
          )
        })}
      </GoogleMap>
    </div>
  )
}
