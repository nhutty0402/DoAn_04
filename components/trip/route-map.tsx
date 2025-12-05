"use client"

import { useEffect, useRef, useState } from "react"
import mapboxgl from "mapbox-gl"
import "mapbox-gl/dist/mapbox-gl.css"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Loader2, MapPin, Navigation2, AlertCircle } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

interface RouteMapProps {
  origin: string // Địa điểm xuất phát
  destination: string // Địa điểm đến
  mapboxToken?: string // Mapbox token (từ env hoặc prop)
  travelMode?: "driving" | "driving-traffic" | "walking" | "cycling" | "motorcycle" // Phương tiện đi lại
}

// Mapbox token - sử dụng token đã có sẵn trong project
const MAPBOX_TOKEN = "pk.eyJ1IjoiZ29sZGVuYml1IiwiYSI6ImNtZ3h6MXcybDBhMnYyanBvdThpbzJtdzUifQ.P5vJLh6Gzx2A6y1YmeKCBw"

export function RouteMap({ origin, destination, mapboxToken, travelMode = "driving" }: RouteMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null)
  const map = useRef<mapboxgl.Map | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [routeInfo, setRouteInfo] = useState<{
    distance?: string
    duration?: string
  } | null>(null)

  const token = mapboxToken || MAPBOX_TOKEN

  // Geocoding: Chuyển đổi địa điểm thành tọa độ bằng Mapbox Geocoding API
  const geocodeAddress = async (address: string): Promise<[number, number] | null> => {
    try {
      const response = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(address)}.json?access_token=${token}&language=vi&country=vn&limit=1`
      )

      if (!response.ok) {
        throw new Error("Geocoding failed")
      }

      const data = await response.json()
      if (data.features && data.features.length > 0) {
        // Mapbox trả về [lng, lat]
        return data.features[0].center as [number, number]
      }
      return null
    } catch (err) {
      console.error("Geocoding error:", err)
      return null
    }
  }

  // Tính toán đường đi bằng Mapbox Directions API
  const calculateRoute = async (originCoords: [number, number], destCoords: [number, number], mode: string = travelMode) => {
    try {
      // Mapbox không có mode riêng cho xe máy, sử dụng driving mode
      const mapboxMode = mode === "motorcycle" ? "driving" : mode
      const url = `https://api.mapbox.com/directions/v5/mapbox/${mapboxMode}/${originCoords[0]},${originCoords[1]};${destCoords[0]},${destCoords[1]}?access_token=${token}&geometries=geojson&steps=true&language=vi&overview=full`
      
      const response = await fetch(url)
      if (!response.ok) {
        throw new Error("Directions API failed")
      }

      const data = await response.json()

      if (data.code === "Ok" && data.routes && data.routes.length > 0) {
        const route = data.routes[0]
        const leg = route.legs[0]

        // Lấy thông tin quãng đường
        const distanceKm = (leg.distance / 1000).toFixed(1)
        const durationHours = Math.floor(leg.duration / 3600)
        const durationMinutes = Math.floor((leg.duration % 3600) / 60)

        setRouteInfo({
          distance: `${distanceKm} km`,
          duration: durationHours > 0 
            ? `${durationHours} giờ ${durationMinutes} phút`
            : `${durationMinutes} phút`,
        })

        // Vẽ đường đi lên bản đồ
        if (map.current) {
          // Xóa route cũ nếu có
          if (map.current.getSource("route")) {
            map.current.removeLayer("route")
            map.current.removeSource("route")
          }

          // Thêm route mới
          map.current.addSource("route", {
            type: "geojson",
            data: {
              type: "Feature",
              geometry: route.geometry,
            },
          })

          map.current.addLayer({
            id: "route",
            type: "line",
            source: "route",
            layout: {
              "line-join": "round",
              "line-cap": "round",
            },
            paint: {
              "line-color": "#0077b6",
              "line-width": 4,
              "line-opacity": 0.75,
            },
          })

          // Fit bounds để hiển thị toàn bộ đường đi
          const coordinates = route.geometry.coordinates as [number, number][]
          const bounds = coordinates.reduce(
            (bounds, coord) => {
              return bounds.extend(coord as any)
            },
            new mapboxgl.LngLatBounds(coordinates[0], coordinates[0])
          )

          map.current.fitBounds(bounds, {
            padding: { top: 50, bottom: 50, left: 50, right: 50 },
          })
        }

        return route
      } else {
        throw new Error("No route found")
      }
    } catch (err) {
      console.error("Route calculation error:", err)
      throw err
    }
  }

  // Khởi tạo bản đồ
  useEffect(() => {
    if (!mapContainer.current || map.current) return
    if (!origin || !destination) return

    console.log("🗺️ Initializing map with:", { origin, destination, token: token ? "✅" : "❌" })

    setIsLoading(true)
    setError(null)

    // Set Mapbox access token
    mapboxgl.accessToken = token

    if (!token) {
      setError("Mapbox token chưa được cấu hình")
      setIsLoading(false)
      return
    }

    try {
      // Tạo bản đồ
      map.current = new mapboxgl.Map({
        container: mapContainer.current,
        style: "mapbox://styles/mapbox/streets-v12",
        center: [108.2272, 16.0544], // Đà Nẵng (mặc định)
        zoom: 10,
      })

    map.current.on("load", async () => {
      try {
        // Geocode cả 2 địa điểm
        const [originCoords, destCoords] = await Promise.all([
          geocodeAddress(origin),
          geocodeAddress(destination),
        ])

        if (!originCoords || !destCoords) {
          setError("Không thể tìm thấy tọa độ của một trong các địa điểm. Vui lòng kiểm tra lại tên địa điểm.")
          setIsLoading(false)
          return
        }

        // Thêm marker cho điểm xuất phát
        new mapboxgl.Marker({ color: "#0077b6" })
          .setLngLat(originCoords)
          .setPopup(new mapboxgl.Popup().setHTML(`<strong>Điểm xuất phát</strong><br>${origin}`))
          .addTo(map.current!)

        // Thêm marker cho điểm đến
        new mapboxgl.Marker({ color: "#10b981" })
          .setLngLat(destCoords)
          .setPopup(new mapboxgl.Popup().setHTML(`<strong>Điểm đến</strong><br>${destination}`))
          .addTo(map.current!)

        // Tính toán và vẽ đường đi
        await calculateRoute(originCoords, destCoords, travelMode)

        setIsLoading(false)
      } catch (err: any) {
        console.error("Error initializing map:", err)
        setError("Không thể khởi tạo bản đồ. Vui lòng thử lại sau.")
        setIsLoading(false)
      }
    })

    } catch (err: any) {
      console.error("Error creating map:", err)
      setError("Không thể khởi tạo bản đồ: " + (err.message || "Unknown error"))
      setIsLoading(false)
    }

    // Cleanup
    return () => {
      if (map.current) {
        map.current.remove()
        map.current = null
      }
    }
  }, [origin, destination, token, travelMode])

  // Recalculate route khi origin, destination hoặc travelMode thay đổi
  useEffect(() => {
    if (!map.current || !origin || !destination) return

    const recalculate = async () => {
      setIsLoading(true)
      setError(null)

      try {
        const [originCoords, destCoords] = await Promise.all([
          geocodeAddress(origin),
          geocodeAddress(destination),
        ])

        if (!originCoords || !destCoords) {
          setError("Không thể tìm thấy tọa độ của một trong các địa điểm.")
          setIsLoading(false)
          return
        }

        // Xóa markers cũ
        const markers = document.querySelectorAll(".mapboxgl-marker")
        markers.forEach((marker) => marker.remove())

        // Thêm markers mới
        new mapboxgl.Marker({ color: "#0077b6" })
          .setLngLat(originCoords)
          .setPopup(new mapboxgl.Popup().setHTML(`<strong>Điểm xuất phát</strong><br>${origin}`))
          .addTo(map.current!)

        new mapboxgl.Marker({ color: "#10b981" })
          .setLngLat(destCoords)
          .setPopup(new mapboxgl.Popup().setHTML(`<strong>Điểm đến</strong><br>${destination}`))
          .addTo(map.current!)

        // Tính toán lại đường đi
        await calculateRoute(originCoords, destCoords, travelMode)

        setIsLoading(false)
      } catch (err: any) {
        setError("Không thể tính toán đường đi. Vui lòng thử lại.")
        setIsLoading(false)
      }
    }

    // Chỉ recalculate nếu map đã load xong
    if (map.current.loaded()) {
      recalculate()
    } else {
      map.current.once("load", recalculate)
    }
  }, [origin, destination, travelMode])

  if (!origin || !destination) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5 text-primary" />
            Bản đồ đường đi
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Thiếu thông tin</AlertTitle>
            <AlertDescription>
              Chưa có thông tin điểm xuất phát hoặc điểm đến. Vui lòng cập nhật thông tin chuyến đi.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Navigation2 className="h-5 w-5 text-primary" />
          Bản đồ đường đi
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Thông tin điểm xuất phát và điểm đến */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
            <div className="flex items-center gap-2 text-sm text-blue-700 mb-1">
              <MapPin className="h-4 w-4" />
              <span className="font-medium">Điểm xuất phát</span>
            </div>
            <p className="text-sm font-semibold text-blue-900">{origin}</p>
          </div>
          <div className="p-3 bg-green-50 rounded-lg border border-green-200">
            <div className="flex items-center gap-2 text-sm text-green-700 mb-1">
              <MapPin className="h-4 w-4" />
              <span className="font-medium">Điểm đến</span>
            </div>
            <p className="text-sm font-semibold text-green-900">{destination}</p>
          </div>
        </div>

        {/* Thông tin quãng đường */}
        {routeInfo && (
          <div className="flex items-center gap-4 p-3 bg-muted rounded-lg">
            {routeInfo.distance && (
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-muted-foreground">Khoảng cách:</span>
                <span className="text-sm font-semibold">{routeInfo.distance}</span>
              </div>
            )}
            {routeInfo.duration && (
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-muted-foreground">Thời gian:</span>
                <span className="text-sm font-semibold">{routeInfo.duration}</span>
              </div>
            )}
          </div>
        )}

        {/* Bản đồ */}
        <div className="relative">
          {isLoading && (
            <div className="absolute inset-0 bg-background/80 flex items-center justify-center z-10 rounded-lg">
              <div className="flex flex-col items-center gap-2">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="text-sm text-muted-foreground">Đang tải bản đồ...</p>
              </div>
            </div>
          )}

          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Lỗi</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div
            ref={mapContainer}
            className="w-full h-[500px] rounded-lg border border-border overflow-hidden"
            style={{ minHeight: "500px" }}
          />
        </div>

        {/* Nút làm mới */}
          <div className="flex justify-between items-center">
            <div className="text-sm text-muted-foreground">
              {travelMode === "driving" && "🚗 Đang hiển thị đường đi bằng ô tô"}
              {travelMode === "driving-traffic" && "🚗 Đang hiển thị đường đi bằng ô tô (có tắc đường)"}
              {travelMode === "walking" && "🚶 Đang hiển thị đường đi bộ"}
              {travelMode === "cycling" && "🚴 Đang hiển thị đường đi xe đạp"}
              {travelMode === "motorcycle" && "🏍️ Đang hiển thị đường đi bằng xe máy"}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={async () => {
                if (!map.current || !origin || !destination) return

                setIsLoading(true)
                setError(null)

                try {
                  const [originCoords, destCoords] = await Promise.all([
                    geocodeAddress(origin),
                    geocodeAddress(destination),
                  ])

                  if (!originCoords || !destCoords) {
                    setError("Không thể tìm thấy tọa độ của một trong các địa điểm.")
                    setIsLoading(false)
                    return
                  }

                  await calculateRoute(originCoords, destCoords, travelMode)
                  setIsLoading(false)
                } catch (err: any) {
                  setError("Không thể tính toán đường đi. Vui lòng thử lại.")
                  setIsLoading(false)
                }
              }}
              disabled={isLoading || !map.current}
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Đang tải...
                </>
              ) : (
                <>
                  <Navigation2 className="h-4 w-4 mr-2" />
                  Làm mới đường đi
                </>
              )}
            </Button>
          </div>
      </CardContent>
    </Card>
  )
}
