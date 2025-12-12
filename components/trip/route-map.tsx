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

  // Mapping tọa độ chính xác cho các tỉnh thành Việt Nam (tọa độ trung tâm tỉnh/thành phố)
  // Format: [longitude, latitude] theo chuẩn Mapbox
  const VIETNAM_PROVINCES_COORDS: Record<string, [number, number]> = {
    "An Giang": [105.1259, 10.5215], // Long Xuyên
    "Bà Rịa - Vũng Tàu": [107.2420, 10.3460], // Vũng Tàu
    "Bạc Liêu": [105.7214, 9.2945],
    "Bắc Giang": [106.1970, 21.2731],
    "Bắc Kạn": [105.8342, 22.1470],
    "Bắc Ninh": [106.0581, 21.1861],
    "Bến Tre": [106.3753, 10.2415],
    "Bình Định": [109.2197, 13.7750],
    "Bình Dương": [106.6297, 11.3254],
    "Bình Phước": [106.6000, 11.7500],
    "Bình Thuận": [108.1000, 11.0500],
    "Cà Mau": [105.1527, 9.1770],
    "Cao Bằng": [106.2522, 22.6657],
    "Cần Thơ": [105.7871, 10.0452],
    "Đà Nẵng": [108.2272, 16.0544],
    "Đắk Lắk": [108.0500, 12.6667],
    "Đắk Nông": [107.6833, 12.0000],
    "Điện Biên": [103.0167, 21.3833],
    "Đồng Nai": [106.9980, 10.9574],
    "Đồng Tháp": [105.6300, 10.4600],
    "Gia Lai": [108.0000, 13.9833],
    "Hà Giang": [104.9833, 22.8333],
    "Hà Nam": [105.9226, 20.5455],
    "Hà Nội": [105.8342, 21.0285],
    "Hải Dương": [106.3146, 20.9373],
    "Hải Phòng": [106.6822, 20.8449],
    "Hậu Giang": [105.6417, 9.7844],
    "Hòa Bình": [105.3389, 20.8133],
    "Thành phố Hồ Chí Minh": [106.6297, 10.8231],
    "Hưng Yên": [106.0519, 20.6464],
    "Khánh Hòa": [109.1920, 12.2388],
    "Kiên Giang": [105.0919, 9.9580],
    "Kon Tum": [108.0000, 14.3500],
    "Lai Châu": [103.3433, 22.3969],
    "Lạng Sơn": [106.7613, 21.8537],
    "Lào Cai": [103.9750, 22.4833],
    "Lâm Đồng": [108.4419, 11.9404],
    "Long An": [106.4139, 10.6086],
    "Nam Định": [106.1783, 20.4200],
    "Nghệ An": [105.6316, 18.6796],
    "Ninh Bình": [105.9794, 20.2539],
    "Ninh Thuận": [108.9917, 11.5646],
    "Phú Thọ": [105.2045, 21.3083],
    "Phú Yên": [109.3167, 13.0833],
    "Quảng Bình": [106.6226, 17.4684],
    "Quảng Nam": [108.0190, 15.8801],
    "Quảng Ngãi": [108.8000, 15.1167],
    "Quảng Ninh": [107.1833, 21.0167],
    "Quảng Trị": [107.2000, 16.7500],
    "Sóc Trăng": [105.9739, 9.6025],
    "Sơn La": [103.9167, 21.3167],
    "Tây Ninh": [106.1000, 11.3000],
    "Thái Bình": [106.3333, 20.4500],
    "Thái Nguyên": [105.8442, 21.5928],
    "Thanh Hóa": [105.7842, 19.8067],
    "Thừa Thiên Huế": [107.5900, 16.4674],
    "Tiền Giang": [106.3450, 10.3600],
    "Trà Vinh": [106.3450, 9.9347],
    "Tuyên Quang": [105.2181, 21.8233],
    "Vĩnh Long": [105.9700, 10.2531],
    "Vĩnh Phúc": [105.5928, 21.3083],
    "Yên Bái": [104.9000, 21.7000],
  }

  // Hàm chuẩn hóa tên tỉnh thành để so sánh
  const normalizeProvinceName = (name: string): string => {
    return name.trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")
  }

  // Geocoding: Chuyển đổi địa điểm thành tọa độ bằng Mapbox Geocoding API
  const geocodeAddress = async (address: string): Promise<[number, number] | null> => {
    try {
      const trimmedAddress = address.trim()
      
      // Kiểm tra xem có phải là tỉnh thành trong mapping không
      const normalizedInput = normalizeProvinceName(trimmedAddress)
      const matchedProvince = Object.keys(VIETNAM_PROVINCES_COORDS).find(
        province => normalizeProvinceName(province) === normalizedInput
      )
      
      if (matchedProvince) {
        const coords = VIETNAM_PROVINCES_COORDS[matchedProvince]
        console.log(`✅ Using mapped coordinates for "${trimmedAddress}" (${matchedProvince}):`, coords)
        return coords
      }
      
      // Nếu không có trong mapping, sử dụng Mapbox API
      // Chuẩn hóa địa chỉ: thêm "Vietnam" hoặc "Việt Nam" nếu chưa có
      let normalizedAddress = trimmedAddress
      
      // Kiểm tra xem đã có "Vietnam" hoặc "Việt Nam" chưa
      const hasCountry = normalizedAddress.toLowerCase().includes('vietnam') || 
                         normalizedAddress.toLowerCase().includes('việt nam') ||
                         normalizedAddress.toLowerCase().includes('viet nam')
      
      // Nếu chưa có, thêm "Vietnam" vào cuối để giới hạn kết quả trong Việt Nam
      if (!hasCountry) {
        normalizedAddress = `${normalizedAddress}, Vietnam`
      }

      const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(normalizedAddress)}.json?access_token=${token}&language=vi&country=vn&limit=5&types=place,locality,neighborhood,address,region`
      
      console.log(`🔍 Geocoding: "${address}" -> "${normalizedAddress}"`)
      
      const response = await fetch(url)

      if (!response.ok) {
        throw new Error("Geocoding failed")
      }

      const data = await response.json()
      
      console.log(`📍 Geocoding results for "${address}":`, data.features?.map((f: any) => ({
        place_name: f.place_name,
        center: f.center,
        relevance: f.relevance,
        types: f.place_type
      })))
      
      if (data.features && data.features.length > 0) {
        // Ưu tiên kết quả có relevance cao nhất và có country code là VN
        // Sắp xếp theo relevance (cao nhất trước)
        const sortedFeatures = data.features.sort((a: any, b: any) => {
          // Kiểm tra xem có phải địa điểm ở Việt Nam không
          const aIsVN = a.context?.some((ctx: any) => ctx.id?.startsWith('country.') && ctx.short_code === 'vn')
          const bIsVN = b.context?.some((ctx: any) => ctx.id?.startsWith('country.') && ctx.short_code === 'vn')
          
          // Ưu tiên địa điểm ở VN
          if (aIsVN && !bIsVN) return -1
          if (!aIsVN && bIsVN) return 1
          
          // Ưu tiên region (tỉnh/thành phố) hơn các loại khác
          const aIsRegion = a.place_type?.includes('region')
          const bIsRegion = b.place_type?.includes('region')
          if (aIsRegion && !bIsRegion) return -1
          if (!aIsRegion && bIsRegion) return 1
          
          // Nếu cùng ở VN hoặc không ở VN, sắp xếp theo relevance
          return (b.relevance || 0) - (a.relevance || 0)
        })
        
        const bestMatch = sortedFeatures[0]
        
        // Kiểm tra lại xem kết quả có hợp lý không
        const placeName = bestMatch.place_name?.toLowerCase() || ''
        const searchTerm = trimmedAddress.toLowerCase()
        const searchTermNormalized = normalizeProvinceName(searchTerm)
        
        // Kiểm tra xem có khớp với tỉnh thành trong mapping không
        const matchedInResults = Object.keys(VIETNAM_PROVINCES_COORDS).find(
          province => {
            const normalizedProvince = normalizeProvinceName(province)
            return placeName.includes(normalizedProvince) || normalizedProvince.includes(searchTermNormalized)
          }
        )
        
        // Nếu tìm thấy tỉnh thành khớp trong kết quả, sử dụng tọa độ từ mapping
        if (matchedInResults) {
          const coords = VIETNAM_PROVINCES_COORDS[matchedInResults]
          console.log(`✅ Using mapped coordinates for matched province "${matchedInResults}":`, coords)
          return coords
        }
        
        // Nếu tên địa điểm không chứa từ khóa tìm kiếm và relevance thấp, cảnh báo
        if (bestMatch.relevance < 0.5 && !placeName.includes(searchTerm.split(',')[0].trim())) {
          console.warn(`⚠️ Low relevance match for "${address}":`, bestMatch.place_name, `(relevance: ${bestMatch.relevance})`)
        }
        
        console.log(`✅ Selected: "${bestMatch.place_name}" (relevance: ${bestMatch.relevance})`)
        
        // Mapbox trả về [lng, lat]
        return bestMatch.center as [number, number]
      }
      
      console.warn(`❌ No geocoding results for "${address}"`)
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
              properties: {},
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
