"use client"

import { useEffect, useState } from "react"
import axios from "axios"
import Cookies from "js-cookie"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { MapPin, Navigation, Cloud, Sun, CloudRain, Search, Navigation2, Star, Plane, Calendar } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface MapsTabProps {
  tripId: string
}

// Mock data for demonstration
// const mockLocations = [
//   { id: "1", name: "Cầu Rồng", lat: 16.0544, lng: 108.2272, type: "attraction", rating: 4.5 },
//   { id: "2", name: "Bà Nà Hills", lat: 15.9969, lng: 107.9909, type: "attraction", rating: 4.8 },
//   { id: "3", name: "Hội An Ancient Town", lat: 15.8801, lng: 105.8468, type: "heritage", rating: 4.7 },
//   { id: "4", name: "My Khe Beach", lat: 16.0471, lng: 108.2425, type: "beach", rating: 4.6 },
// ]

// const mockWeather = {
//   current: { temp: 28, condition: "sunny", humidity: 65, wind: 12 },
//   forecast: [
//     { date: "2024-03-15", temp: { min: 22, max: 30 }, condition: "sunny" },
//     { date: "2024-03-16", temp: { min: 24, max: 32 }, condition: "cloudy" },
//     { date: "2024-03-17", temp: { min: 23, max: 29 }, condition: "rainy" },
//   ],
// }

// const mockBookingSuggestions = [
//   {
//     id: "1",
//     type: "hotel",
//     name: "Vinpearl Resort & Spa Da Nang",
//     price: "2,500,000 VNĐ/đêm",
//     rating: 4.8,
//     image: "/luxury-hotel-danang.jpg",
//   },
//   {
//     id: "2",
//     type: "flight",
//     name: "Vietnam Airlines - HAN → DAD",
//     price: "1,200,000 VNĐ",
//     duration: "1h 30m",
//     image: "/airplane-vietnam-airlines.jpg",
//   }
// ]

export function MapsTab({ tripId }: MapsTabProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedLocation, setSelectedLocation] = useState<string | null>(null)
  const [showDirections, setShowDirections] = useState(false)
  const [hotelQuery, setHotelQuery] = useState("")
  const [hotels, setHotels] = useState<any[]>([])
  const [loadingHotels, setLoadingHotels] = useState(false)
  const [hotelError, setHotelError] = useState<string | null>(null)
  const [selectedHotel, setSelectedHotel] = useState<any | null>(null)
  const router = useRouter()
  const { toast } = useToast()

  // Weather state
  const [weather, setWeather] = useState<any | null>(null)
  const [weatherLoading, setWeatherLoading] = useState<boolean>(false)
  const [weatherError, setWeatherError] = useState<string | null>(null)

  // Forecast state
  const [forecast, setForecast] = useState<{ dia_diem?: string; quoc_gia?: string; du_bao?: Record<string, any[]> } | null>(null)
  const [forecastLoading, setForecastLoading] = useState<boolean>(false)
  const [forecastError, setForecastError] = useState<string | null>(null)

  // Flight states
  const [roundTripFlights, setRoundTripFlights] = useState<any | null>(null)
  const [loadingRoundTrip, setLoadingRoundTrip] = useState<boolean>(false)
  const [roundTripError, setRoundTripError] = useState<string | null>(null)
  
  const [oneWayFlights, setOneWayFlights] = useState<any[]>([])
  const [loadingOneWay, setLoadingOneWay] = useState<boolean>(false)
  const [oneWayError, setOneWayError] = useState<string | null>(null)
  
  // One-way flight search form
  const [flightFrom, setFlightFrom] = useState("")
  const [flightTo, setFlightTo] = useState("")
  const [flightDate, setFlightDate] = useState("")
  
  // Trip info
  const [tripInfo, setTripInfo] = useState<{
    dia_diem_xuat_phat?: string
    dia_diem_den?: string
    ngay_bat_dau?: string
    ngay_ket_thuc?: string
  } | null>(null)

  // Các địa điểm phổ biến để gợi ý (hỗ trợ cả tiếng Việt có dấu và không dấu)
  const popularLocations = [
    "Cần Thơ",
    "An Giang",
    "Thành Phố Hồ Chí Minh",
    "Đồng Tháp",
  ]

  // Function tìm khách sạn
  const searchHotels = async (diaDiem: string) => {
    // Kiểm tra input không rỗng
    if (!diaDiem || diaDiem.trim() === "") {
      toast({
        title: "Thiếu thông tin",
        description: "Vui lòng nhập địa điểm để tìm khách sạn",
        variant: "destructive",
      })
      return
    }

    const token = Cookies.get("token")
    console.log("Token từ cookie:", token)
    if (!token || token === "null" || token === "undefined") {
      console.warn("Không có token → chuyển về /login")
      toast({
        title: "Lỗi xác thực",
        description: "Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.",
        variant: "destructive",
      })
      router.replace("/login")
      return
    }

    setLoadingHotels(true)
    setHotelError(null)
    try {
      // Axios params tự động encode URL, hỗ trợ tiếng Việt có dấu
      const resp = await axios.get(
        "https://travel-planner-imdw.onrender.com/api/goi-y-khach-san",
        {
          params: {
            dia_diem: diaDiem.trim(), // Axios sẽ tự động encode tiếng Việt có dấu
          },
          headers: { Authorization: `Bearer ${token}` },
        },
      )
      const danhSach = resp.data?.khach_san || []
      
      // Map giữ nguyên theo API
      setHotels(
        danhSach.map((h: any, idx: number) => ({
          id: `${h.ten}-${idx}`,
          ten: h.ten,
          vi_tri: h.vi_tri,
          gia: h.gia,
          danh_gia: h.danh_gia,
          toa_do: h.toa_do,
          anh: h.anh,
          link: h.link,
        })),
      )

      toast({
        title: "Tìm thấy khách sạn",
        description: `Tìm thấy ${resp.data?.tong_so ?? danhSach.length} khách sạn`,
      })
    } catch (err: any) {
      console.error("Lỗi tìm khách sạn:", err)
      
      if (axios.isAxiosError(err)) {
        if (err.response?.status === 404) {
          const errorMsg = err.response?.data?.message || `Không tìm thấy dữ liệu cho "${diaDiem}"`
          setHotelError(errorMsg)
          toast({
            title: "Không tìm thấy",
            description: errorMsg,
            variant: "destructive",
          })
        } else if (err.response?.status === 400) {
          const errorMsg = err.response?.data?.message || "Thiếu tham số địa điểm"
          setHotelError(errorMsg)
          toast({
            title: "Lỗi dữ liệu",
            description: errorMsg,
            variant: "destructive",
          })
        } else if (err.response?.status === 401) {
          toast({
            title: "Phiên đăng nhập hết hạn",
            description: "Token không hợp lệ. Vui lòng đăng nhập lại.",
            variant: "destructive",
          })
          router.replace("/login")
        } else {
          setHotelError(err?.response?.data?.message || "Không thể tải dữ liệu khách sạn")
          toast({
            title: "Lỗi",
            description: err?.response?.data?.message || "Không thể tải dữ liệu khách sạn",
            variant: "destructive",
          })
        }
      } else {
        setHotelError("Không thể tải dữ liệu khách sạn")
        toast({
          title: "Lỗi",
          description: "Không thể tải dữ liệu khách sạn",
          variant: "destructive",
        })
      }
    } finally {
      setLoadingHotels(false)
    }
  }

  const getWeatherIcon = (condition: string) => {
    switch (condition) {
      case "sunny":
        return <Sun className="h-4 w-4 text-yellow-500" />
      case "cloudy":
        return <Cloud className="h-4 w-4 text-gray-500" />
      case "rainy":
        return <CloudRain className="h-4 w-4 text-blue-500" />
      default:
        return <Sun className="h-4 w-4 text-yellow-500" />
    }
  }

  const getLocationTypeColor = (type: string) => {
    switch (type) {
      case "attraction":
        return "bg-primary"
      case "heritage":
        return "bg-orange-500"
      case "beach":
        return "bg-blue-500"
      default:
        return "bg-gray-500"
    }
  }

  // Fetch current weather by lat/lon
  const fetchCurrentWeather = async (lat: number, lon: number) => {
    setWeatherLoading(true)
    setWeatherError(null)
    try {
      const token = Cookies.get("token")
      if (!token || token === "null" || token === "undefined") {
        console.warn("Không có token → chuyển về /login")
        setWeatherError("Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.")
        router.replace("/login")
        setWeatherLoading(false)
        return
      }
      const resp = await axios.get(
        "https://travel-planner-imdw.onrender.com/api/thoitiet/hientai",
        { params: { lat, lon }, headers: { Authorization: `Bearer ${token}` } },
      )
      setWeather(resp.data)
    } catch (err: any) {
      console.error("Lỗi lấy thời tiết:", err)
      if (axios.isAxiosError(err)) {
        setWeatherError(err.response?.data?.message || err.message || "Không thể lấy dữ liệu thời tiết")
      } else {
        setWeatherError("Không thể lấy dữ liệu thời tiết")
      }
    } finally {
      setWeatherLoading(false)
    }
  }

  // Fetch 5-day forecast by lat/lon
  const fetchForecast = async (lat: number, lon: number) => {
    setForecastLoading(true)
    setForecastError(null)
    try {
      const token = Cookies.get("token")
      if (!token || token === "null" || token === "undefined") {
        console.warn("Không có token → chuyển về /login")
        setForecastError("Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.")
        router.replace("/login")
        setForecastLoading(false)
        return
      }
      const resp = await axios.get(
        "https://travel-planner-imdw.onrender.com/api/thoitiet/du-bao",
        { params: { lat, lon }, headers: { Authorization: `Bearer ${token}` } },
      )
      setForecast(resp.data)
    } catch (err: any) {
      console.error("Lỗi lấy dự báo thời tiết:", err)
      if (axios.isAxiosError(err)) {
        setForecastError(err.response?.data?.message || err.message || "Không thể lấy dữ liệu dự báo")
      } else {
        setForecastError("Không thể lấy dữ liệu dự báo")
      }
    } finally {
      setForecastLoading(false)
    }
  }

  // Fetch trip info để lấy thông tin địa điểm và ngày
  const fetchTripInfo = async () => {
    try {
      const token = Cookies.get("token")
      if (!token || token === "null" || token === "undefined") return

      const response = await axios.get(
        `https://travel-planner-imdw.onrender.com/api/chuyendi/${tripId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      )

      const tripData = response.data?.data || response.data?.result || response.data
      if (tripData) {
        setTripInfo({
          dia_diem_xuat_phat: tripData.dia_diem_xuat_phat,
          dia_diem_den: tripData.dia_diem_den,
          ngay_bat_dau: tripData.ngay_bat_dau,
          ngay_ket_thuc: tripData.ngay_ket_thuc,
        })
      }
    } catch (err) {
      console.error("Lỗi lấy thông tin chuyến đi:", err)
    }
  }

  // Fetch chuyến bay khứ hồi dựa trên tripId
  const fetchRoundTripFlights = async () => {
    setLoadingRoundTrip(true)
    setRoundTripError(null)
    try {
      const token = Cookies.get("token")
      if (!token || token === "null" || token === "undefined") {
        setRoundTripError("Phiên đăng nhập đã hết hạn")
        return
      }

      const response = await axios.get(
        `https://travel-planner-imdw.onrender.com/api/ve-may-bay/chuyendi/${tripId}/khu-hoi`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      )

      console.log("✅ Chuyến bay khứ hồi:", response.data)
      setRoundTripFlights(response.data)
    } catch (err: any) {
      console.error("Lỗi lấy chuyến bay khứ hồi:", err)
      if (axios.isAxiosError(err)) {
        if (err.response?.status === 400) {
          setRoundTripError(err.response?.data?.message || "Chuyến đi chưa có đủ thông tin để gợi ý vé khứ hồi")
        } else if (err.response?.status === 404) {
          setRoundTripError("Không tìm thấy chuyến đi")
        } else {
          setRoundTripError(err.response?.data?.message || "Không thể tải gợi ý chuyến bay")
        }
      } else {
        setRoundTripError("Không thể tải gợi ý chuyến bay")
      }
    } finally {
      setLoadingRoundTrip(false)
    }
  }

  // Tìm kiếm chuyến bay một chiều
  const searchOneWayFlights = async () => {
    if (!flightFrom || !flightTo || !flightDate) {
      toast({
        title: "Thiếu thông tin",
        description: "Vui lòng nhập đầy đủ: Đi từ, Đến, Ngày bay",
        variant: "destructive",
      })
      return
    }

    setLoadingOneWay(true)
    setOneWayError(null)
    try {
      const token = Cookies.get("token")
      if (!token || token === "null" || token === "undefined") {
        toast({
          title: "Lỗi xác thực",
          description: "Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.",
          variant: "destructive",
        })
        router.replace("/login")
        return
      }

      const response = await axios.get(
        "https://travel-planner-imdw.onrender.com/api/ve-may-bay/goi-y-don-gian",
        {
          params: {
            from: flightFrom.trim(),
            to: flightTo.trim(),
            ngay_di: flightDate,
          },
          headers: { Authorization: `Bearer ${token}` },
        }
      )

      console.log("✅ Chuyến bay một chiều:", response.data)
      setOneWayFlights(response.data?.danh_sach || [])
      
      if (response.data?.tong_so === 0) {
        setOneWayError("Không tìm thấy chuyến bay phù hợp")
      }
    } catch (err: any) {
      console.error("Lỗi tìm chuyến bay:", err)
      if (axios.isAxiosError(err)) {
        if (err.response?.status === 400) {
          setOneWayError(err.response?.data?.message || "Thiếu thông tin hoặc không xác định được mã sân bay")
        } else if (err.response?.status === 401) {
          toast({
            title: "Phiên đăng nhập hết hạn",
            description: "Token không hợp lệ. Vui lòng đăng nhập lại.",
            variant: "destructive",
          })
          router.replace("/login")
        } else {
          setOneWayError(err.response?.data?.message || "Không thể tìm chuyến bay")
        }
      } else {
        setOneWayError("Không thể tìm chuyến bay")
      }
      const errorMsg = err.response?.data?.message || "Không thể tìm chuyến bay"
      toast({
        title: "Lỗi",
        description: errorMsg,
        variant: "destructive",
      })
    } finally {
      setLoadingOneWay(false)
    }
  }

  // Try browser geolocation first, fallback to Đà Nẵng
  useEffect(() => {
    const fallbackDaNang = { lat: 16.0471, lon: 108.2425 }
    if (typeof window !== "undefined" && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const { latitude, longitude } = pos.coords
          fetchCurrentWeather(latitude, longitude)
          fetchForecast(latitude, longitude)
        },
        () => {
          fetchCurrentWeather(fallbackDaNang.lat, fallbackDaNang.lon)
          fetchForecast(fallbackDaNang.lat, fallbackDaNang.lon)
        },
        { enableHighAccuracy: true, timeout: 8000 },
      )
    } else {
      fetchCurrentWeather(fallbackDaNang.lat, fallbackDaNang.lon)
      fetchForecast(fallbackDaNang.lat, fallbackDaNang.lon)
    }
  }, [])

  // Fetch trip info và round trip flights khi component mount
  useEffect(() => {
    if (tripId) {
      fetchTripInfo().then(() => {
        fetchRoundTripFlights()
      })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tripId])

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Thời Tiết */}
        <Card className="h-fit">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Cloud className="h-5 w-5 text-primary" />
              Thời tiết
            </CardTitle>
          </CardHeader>
          <CardContent>
            {/* Current Weather */}
            <div className="mb-6 p-4 bg-gradient-to-r from-blue-50 to-sky-50 rounded-lg">
              {weatherLoading && (
                <p className="text-sm text-muted-foreground">Đang tải thời tiết...</p>
              )}
              {weatherError && (
                <p className="text-sm text-destructive">{weatherError}</p>
              )}
              {!weatherLoading && !weatherError && weather && (
                <>
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-3xl font-bold">{weather.nhiet_do || "--"}</h3>
                      <p className="text-muted-foreground">{weather.dia_diem || "Vị trí hiện tại"}</p>
                    </div>
                    {weather.icon ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={weather.icon} alt={weather.mo_ta || "weather"} className="h-16 w-16 object-contain" />
                    ) : (
                      getWeatherIcon("sunny")
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-4 mt-4 text-sm">
                    <div>Mô tả: {weather.mo_ta}</div>
                    <div>Nhiệt độ: {weather.nhiet_do_cam_nhan}</div>
                    <div>Độ ẩm: {weather.do_am}</div>
                    <div>Gió: {weather.toc_do_gio} {weather.huong_gio ? `(${weather.huong_gio})` : ""}</div>
                    <div> Mức mây: {weather.muc_may}</div>
                    <div>thời gian: {weather.thoi_gian}</div>
                  </div>
                  {weather.goi_y && (
                    <div className="mt-3 text-sm">
                      <span className="font-medium">Gợi ý:</span> {weather.goi_y}
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Forecast */}
            <div className="space-y-3">
              <h4 className="font-semibold text-lg">Dự báo 5 ngày tới</h4>
              {forecastLoading && (
                <p className="text-sm text-muted-foreground">Đang tải dự báo...</p>
              )}
              {forecastError && (
                <p className="text-sm text-destructive">{forecastError}</p>
              )}
              {!forecastLoading && !forecastError && forecast?.du_bao && (
                <div className="max-h-48 md:max-h-56 overflow-y-auto pr-2 forecast-scroll">
                  <div className="space-y-2">
                    {Object.entries(forecast.du_bao)
                      .slice(0, 5)
                      .map(([date, items]: [string, any[]], index) => {
                        const first = items[0]
                        return (
                          <div key={date} className="flex items-center justify-between p-3 rounded-lg border bg-muted/50">
                            <div className="flex items-center gap-3">
                              {first?.icon ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img src={first.icon} alt={first.mo_ta || "forecast"} className="h-6 w-6 object-contain" />
                              ) : (
                                getWeatherIcon("sunny")
                              )}
                              <span className="font-medium">{new Date(date).toLocaleDateString("vi-VN", { weekday: 'short', day: 'numeric', month: 'short' })}</span>
                            </div>
                            <div className="text-sm font-medium">
                              {first?.nhiet_do || "--"} • {first?.mo_ta || ""}
                            </div>
                          </div>
                        )
                      })}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>


        {/* Gợi ý khách sạn */}
        <Card className="h-fit">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Navigation className="h-5 w-5 text-primary" />
              Gợi ý khách sạn
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Input
                  value={hotelQuery}
                  onChange={(e) => setHotelQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && hotelQuery.trim()) {
                      searchHotels(hotelQuery)
                    }
                  }}
                  placeholder="Nhập địa điểm (ví dụ: Hà Nội, Đà Nẵng, Hồ Chí Minh hoặc Ha Noi, Da Nang)"
                />
                <Button
                  onClick={() => searchHotels(hotelQuery)}
                  disabled={loadingHotels || !hotelQuery.trim()}
                >
                  {loadingHotels ? "Đang tìm..." : "Tìm khách sạn"}
                </Button>
              </div>

              {/* Gợi ý địa điểm phổ biến */}
              {!loadingHotels && hotels.length === 0 && !hotelError && (
                <div className="space-y-2">
                  <p className="text-xs text-muted-foreground">Gợi ý địa điểm phổ biến:</p>
                  <div className="flex flex-wrap gap-2">
                    {popularLocations.map((location) => (
                      <Button
                        key={location}
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setHotelQuery(location)
                          // Tự động tìm khi click vào gợi ý
                          searchHotels(location)
                        }}
                        className="text-xs"
                      >
                        {location}
                      </Button>
                    ))}
                  </div>
                </div>
              )}

              {loadingHotels && (
                <p className="text-sm text-muted-foreground">Đang tải gợi ý khách sạn...</p>
              )}
              {hotelError && (
                <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
                  <p className="text-sm text-destructive">{hotelError}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    💡 Thử với các địa điểm khác như: Ha Noi, Da Nang, Ho Chi Minh, Hue, Hoi An...
                  </p>
                </div>
              )}

              <div className="max-h-96 md:max-h-[478px] overflow-y-auto pr-2">
                <div className="grid grid-cols-1 gap-4">
                {hotels.map((hotel) => (
                  <div
                    key={hotel.id}
                    className="border rounded-lg overflow-hidden hover:shadow-lg transition-shadow flex flex-col sm:flex-row"
                  >
                    <img
                      src={hotel.anh || "/placeholder.svg"}
                      alt={hotel.ten}
                      className="w-full sm:w-40 h-36 object-cover"
                    />
                    <div className="p-4 flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant="secondary" className="text-xs">Khách sạn</Badge>
                        {hotel.danh_gia != null && (
                          <div className="flex items-center gap-1 text-xs">
                            <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                            <span>{hotel.danh_gia}</span>
                          </div>
                        )}
                      </div>
                      <h4 className="font-semibold mb-1 line-clamp-2">{hotel.ten}</h4>
                      <p className="text-xs text-muted-foreground mb-2">{hotel.vi_tri}</p>
                      <div className="flex items-center justify-between mt-auto">
                        <span className="text-lg font-bold text-primary">{hotel.gia || "Liên hệ"}</span>
                        <div className="flex items-center gap-2">
                          <Button size="sm" variant="outline" onClick={() => setSelectedHotel(hotel)}>
                            Xem chi tiết
                          </Button>
                          {hotel.link && (
                            <a href={hotel.link} target="_blank" rel="noopener noreferrer">
                              <Button size="sm">Đặt ngay</Button>
                            </a>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
                {!loadingHotels && hotels.length === 0 && !hotelError && hotelQuery && (
                  <p className="text-sm text-muted-foreground">Nhập địa điểm và bấm "Tìm khách sạn" để xem gợi ý.</p>
                )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Gợi ý chuyến bay khứ hồi */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plane className="h-5 w-5 text-primary" />
            Gợi ý vé máy bay khứ hồi
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loadingRoundTrip && (
            <p className="text-sm text-muted-foreground">Đang tải gợi ý chuyến bay...</p>
          )}
          {roundTripError && (
            <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
              <p className="text-sm text-destructive">{roundTripError}</p>
            </div>
          )}
          {!loadingRoundTrip && !roundTripError && roundTripFlights && (
            <div className="space-y-6">
              {/* Chiều đi */}
              {roundTripFlights.chieu_di && (
                <div>
                  <h4 className="font-semibold text-lg mb-3 flex items-center gap-2">
                    <Navigation2 className="h-4 w-4" />
                    Chiều đi: {roundTripFlights.from} → {roundTripFlights.to}
                    <span className="text-xs text-muted-foreground ml-2">
                      ({new Date(roundTripFlights.ngay_di).toLocaleDateString("vi-VN")})
                    </span>
                  </h4>
                  <div className="max-h-64 overflow-y-auto space-y-3 pr-2">
                    {roundTripFlights.chieu_di.danh_sach && roundTripFlights.chieu_di.danh_sach.length > 0 ? (
                      roundTripFlights.chieu_di.danh_sach.slice(0, 5).map((flight: any, idx: number) => (
                        <div key={idx} className="border rounded-lg p-3 hover:shadow-md transition-shadow">
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-2">
                                <Badge variant="secondary">{flight.airline || "Không xác định"}</Badge>
                                <span className="text-sm font-medium">{flight.from} → {flight.to}</span>
                              </div>
                              <div className="text-xs text-muted-foreground space-y-1">
                                <div>Khởi hành: {flight.depart_time || "N/A"}</div>
                                {flight.return_time && <div>Đến: {flight.return_time}</div>}
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="text-lg font-bold text-primary">
                                {flight.price ? `${new Intl.NumberFormat("vi-VN").format(flight.price)} ${flight.currency || roundTripFlights.chieu_di.currency || "VNĐ"}` : "Liên hệ"}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-muted-foreground">Không tìm thấy chuyến bay chiều đi</p>
                    )}
                  </div>
                </div>
              )}

              {/* Chiều về */}
              {roundTripFlights.chieu_ve && (
                <div>
                  <h4 className="font-semibold text-lg mb-3 flex items-center gap-2">
                    <Navigation2 className="h-4 w-4 rotate-180" />
                    Chiều về: {roundTripFlights.to} → {roundTripFlights.from}
                    <span className="text-xs text-muted-foreground ml-2">
                      ({new Date(roundTripFlights.ngay_ve).toLocaleDateString("vi-VN")})
                    </span>
                  </h4>
                  <div className="max-h-64 overflow-y-auto space-y-3 pr-2">
                    {roundTripFlights.chieu_ve.danh_sach && roundTripFlights.chieu_ve.danh_sach.length > 0 ? (
                      roundTripFlights.chieu_ve.danh_sach.slice(0, 5).map((flight: any, idx: number) => (
                        <div key={idx} className="border rounded-lg p-3 hover:shadow-md transition-shadow">
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-2">
                                <Badge variant="secondary">{flight.airline || "Không xác định"}</Badge>
                                <span className="text-sm font-medium">{flight.from} → {flight.to}</span>
                              </div>
                              <div className="text-xs text-muted-foreground space-y-1">
                                <div>Khởi hành: {flight.depart_time || "N/A"}</div>
                                {flight.return_time && <div>Đến: {flight.return_time}</div>}
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="text-lg font-bold text-primary">
                                {flight.price ? `${new Intl.NumberFormat("vi-VN").format(flight.price)} ${flight.currency || roundTripFlights.chieu_ve.currency || "VNĐ"}` : "Liên hệ"}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-muted-foreground">Không tìm thấy chuyến bay chiều về</p>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Tìm kiếm chuyến bay một chiều */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plane className="h-5 w-5 text-primary" />
            Tìm kiếm vé máy bay một chiều
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label className="text-sm font-medium mb-1 block">Đi từ</label>
                <Input
                  value={flightFrom}
                  onChange={(e) => setFlightFrom(e.target.value)}
                  placeholder="Ví dụ: Hà Nội, Ha Noi"
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Đến</label>
                <Input
                  value={flightTo}
                  onChange={(e) => setFlightTo(e.target.value)}
                  placeholder="Ví dụ: Đà Nẵng, Da Nang"
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Ngày bay</label>
                <Input
                  type="date"
                  value={flightDate}
                  onChange={(e) => setFlightDate(e.target.value)}
                  min={new Date().toISOString().split("T")[0]}
                />
              </div>
            </div>
            <Button
              onClick={searchOneWayFlights}
              disabled={loadingOneWay || !flightFrom || !flightTo || !flightDate}
              className="w-full md:w-auto"
            >
              {loadingOneWay ? "Đang tìm..." : "Tìm chuyến bay"}
            </Button>

            {oneWayError && (
              <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
                <p className="text-sm text-destructive">{oneWayError}</p>
              </div>
            )}

            {!loadingOneWay && oneWayFlights.length > 0 && (
              <div className="space-y-3 mt-4">
                <h4 className="font-semibold">Kết quả tìm kiếm ({oneWayFlights.length} chuyến bay)</h4>
                <div className="max-h-96 overflow-y-auto space-y-3 pr-2">
                  {oneWayFlights.map((flight: any, idx: number) => (
                    <div key={idx} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <Badge variant="secondary">{flight.airline || "Không xác định"}</Badge>
                            <span className="text-sm font-medium">{flight.from} → {flight.to}</span>
                          </div>
                          <div className="text-xs text-muted-foreground space-y-1">
                            <div>Khởi hành: {flight.depart_time || "N/A"}</div>
                            {flight.return_time && <div>Đến: {flight.return_time}</div>}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-lg font-bold text-primary">
                            {flight.price ? `${new Intl.NumberFormat("vi-VN").format(flight.price)} ${flight.currency || "VNĐ"}` : "Liên hệ"}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Modal chi tiết khách sạn đơn giản */}
      {selectedHotel && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-card rounded-lg shadow-xl w-full max-w-lg overflow-hidden">
            <div className="relative">
              <img src={selectedHotel.anh || "/placeholder.svg"} alt={selectedHotel.ten} className="w-full h-56 object-cover" />
            </div>
            <div className="p-4 space-y-2">
              <h3 className="text-xl font-semibold">{selectedHotel.ten}</h3>
              <p className="text-sm text-muted-foreground">{selectedHotel.vi_tri}</p>
              {selectedHotel.danh_gia != null && (
                <div className="flex items-center gap-1 text-sm">
                  <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                  <span>{selectedHotel.danh_gia}</span>
                </div>
              )}
              {selectedHotel.gia && (
                <p className="text-primary font-medium">Giá: {selectedHotel.gia}</p>
              )}
              {selectedHotel.toa_do && (
                <p className="text-sm">Tọa độ: {selectedHotel.toa_do.lat}, {selectedHotel.toa_do.lng}</p>
              )}
              <div className="flex justify-end gap-2 pt-2">
                <Button variant="outline" onClick={() => setSelectedHotel(null)}>Đóng</Button>
                {selectedHotel.link && (
                  <a href={selectedHotel.link} target="_blank" rel="noopener noreferrer">
                    <Button>Đặt ngay</Button>
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
