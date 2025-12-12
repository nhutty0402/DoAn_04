"use client"

import { useEffect, useState } from "react"
import axios from "axios"
import Cookies from "js-cookie"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { MapPin, Navigation2, Loader2, Car, Footprints, Bike, Search, ChevronDown, ChevronUp, X } from "lucide-react"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"

// Icon xe máy đơn giản (SVG)
const MotorcycleIcon = ({ className }: { className?: string }) => (
  <svg
    className={className}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <circle cx="5" cy="17" r="3" />
    <circle cx="19" cy="17" r="3" />
    <path d="M8 17h8" />
    <path d="M8 12h8" />
    <path d="M8 7h2" />
  </svg>
)
import { useToast } from "@/hooks/use-toast"
import { RouteMap } from "./route-map"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"

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
  const router = useRouter()
  const { toast } = useToast()
  
  // Trip info
  const [tripInfo, setTripInfo] = useState<{
    dia_diem_xuat_phat?: string
    dia_diem_den?: string
    ngay_bat_dau?: string
    ngay_ket_thuc?: string
    diem_den?: Array<{
      diem_den_id: number
      ten_diem_den: string
      thu_tu: number
      dia_diem_xuat_phat: string
      ngay_bat_dau: string
      ngay_ket_thuc: string
    }>
  } | null>(null)

  // Danh sách điểm đến để chọn
  const [diemDenList, setDiemDenList] = useState<Array<{
    diem_den_id: number
    ten_diem_den: string
    thu_tu: number
    dia_diem_xuat_phat: string
    ngay_bat_dau?: string
    ngay_ket_thuc?: string
  }>>([])
  const [selectedOrigin, setSelectedOrigin] = useState<string>("")
  const [selectedDestination, setSelectedDestination] = useState<string>("")
  const [travelMode, setTravelMode] = useState<"driving" | "driving-traffic" | "walking" | "cycling" | "motorcycle">("driving")
  const [loadingDiemDen, setLoadingDiemDen] = useState(false)
  
  // State cho tìm kiếm tỉnh thành
  const [showOriginSearch, setShowOriginSearch] = useState(false)
  const [showDestinationSearch, setShowDestinationSearch] = useState(false)
  const [originSearchQuery, setOriginSearchQuery] = useState("")
  const [destinationSearchQuery, setDestinationSearchQuery] = useState("")
  const [openOriginPopover, setOpenOriginPopover] = useState(false)
  const [openDestinationPopover, setOpenDestinationPopover] = useState(false)
  
  // Danh sách 63 tỉnh thành Việt Nam
  const TINH_THANH_LIST = [
    "An Giang",
    "Bà Rịa - Vũng Tàu",
    "Bạc Liêu",
    "Bắc Giang",
    "Bắc Kạn",
    "Bắc Ninh",
    "Bến Tre",
    "Bình Định",
    "Bình Dương",
    "Bình Phước",
    "Bình Thuận",
    "Cà Mau",
    "Cao Bằng",
    "Cần Thơ",
    "Đà Nẵng",
    "Đắk Lắk",
    "Đắk Nông",
    "Điện Biên",
    "Đồng Nai",
    "Đồng Tháp",
    "Gia Lai",
    "Hà Giang",
    "Hà Nam",
    "Hà Nội",
    "Hải Dương",
    "Hải Phòng",
    "Hậu Giang",
    "Hòa Bình",
    "Thành phố Hồ Chí Minh",
    "Hưng Yên",
    "Khánh Hòa",
    "Kiên Giang",
    "Kon Tum",
    "Lai Châu",
    "Lạng Sơn",
    "Lào Cai",
    "Lâm Đồng",
    "Long An",
    "Nam Định",
    "Nghệ An",
    "Ninh Bình",
    "Ninh Thuận",
    "Phú Thọ",
    "Phú Yên",
    "Quảng Bình",
    "Quảng Nam",
    "Quảng Ngãi",
    "Quảng Ninh",
    "Quảng Trị",
    "Sóc Trăng",
    "Sơn La",
    "Tây Ninh",
    "Thái Bình",
    "Thái Nguyên",
    "Thanh Hóa",
    "Thừa Thiên Huế",
    "Tiền Giang",
    "Trà Vinh",
    "Tuyên Quang",
    "Vĩnh Long",
    "Vĩnh Phúc",
    "Yên Bái"
  ]
  
  // Hàm lọc tỉnh thành theo query
  const filterTinhThanh = (query: string) => {
    if (!query.trim()) return TINH_THANH_LIST
    const lowerQuery = query.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    return TINH_THANH_LIST.filter(tinh => {
      const normalizedTinh = tinh.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")
      return normalizedTinh.includes(lowerQuery)
    })
  }

  // Fetch danh sách điểm đến từ API
  const fetchDiemDenList = async () => {
    setLoadingDiemDen(true)
    try {
      const token = Cookies.get("token")
      if (!token || token === "null" || token === "undefined") return

      const response = await axios.get(
        `https://travel-planner-imdw.onrender.com/api/chuyen-di/${tripId}/diem-den`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      )

      const diemDenArray = response.data?.data || []
      console.log("📍 Danh sách điểm đến:", diemDenArray)

      if (Array.isArray(diemDenArray) && diemDenArray.length > 0) {
        // Sắp xếp theo thu_tu
        const sortedDiemDen = [...diemDenArray].sort((a, b) => (a.thu_tu || 0) - (b.thu_tu || 0))
        setDiemDenList(sortedDiemDen)

        // Tự động chọn điểm đầu và điểm cuối làm mặc định
        const firstDiem = sortedDiemDen[0]
        const lastDiem = sortedDiemDen[sortedDiemDen.length - 1]
        
        // Điểm xuất phát: dia_diem_xuat_phat của điểm đầu tiên
        const originOption = firstDiem?.dia_diem_xuat_phat || ""
        // Điểm đến: ten_diem_den của điểm cuối cùng
        const destinationOption = lastDiem?.ten_diem_den || ""

        if (originOption && destinationOption) {
          setSelectedOrigin(originOption)
          setSelectedDestination(destinationOption)
        }
      }
    } catch (err) {
      console.error("Lỗi lấy danh sách điểm đến:", err)
      toast({
        title: "Lỗi",
        description: "Không thể tải danh sách điểm đến",
        variant: "destructive",
      })
    } finally {
      setLoadingDiemDen(false)
    }
  }

  // Fetch trip info để lấy thông tin địa điểm và ngày
  const fetchTripInfo = async () => {
    try {
      const token = Cookies.get("token")
      if (!token || token === "null" || token === "undefined") return

      const response = await axios.get(
        `https://travel-planner-imdw.onrender.com/api/chuyen-di/${tripId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      )

      const tripData = response.data?.data || response.data?.result || response.data?.chuyen_di || response.data
      const diemDenArray = response.data?.diem_den || tripData?.diem_den || []
      
      console.log("📍 Trip data for map:", tripData)
      console.log("📍 Diem den array:", diemDenArray)
      
      if (tripData || diemDenArray.length > 0) {
        // Nếu có mảng diem_den, sử dụng logic mới
        if (Array.isArray(diemDenArray) && diemDenArray.length > 0) {
          // Sắp xếp theo thu_tu để đảm bảo thứ tự đúng
          const sortedDiemDen = [...diemDenArray].sort((a, b) => (a.thu_tu || 0) - (b.thu_tu || 0))
          
          // Điểm xuất phát: dia_diem_xuat_phat của điểm đầu tiên
          const firstDiem = sortedDiemDen[0]
          const origin = firstDiem?.dia_diem_xuat_phat || tripData?.dia_diem_xuat_phat || ""
          
          // Điểm đến: ten_diem_den của điểm cuối cùng
          const lastDiem = sortedDiemDen[sortedDiemDen.length - 1]
          const destination = lastDiem?.ten_diem_den || ""
          
          setTripInfo({
            dia_diem_xuat_phat: origin,
            dia_diem_den: destination,
            ngay_bat_dau: tripData?.ngay_bat_dau || firstDiem?.ngay_bat_dau,
            ngay_ket_thuc: tripData?.ngay_ket_thuc || lastDiem?.ngay_ket_thuc,
            diem_den: sortedDiemDen,
          })
          
          console.log("✅ Trip info set (from diem_den array):", {
            dia_diem_xuat_phat: origin,
            dia_diem_den: destination,
            totalDiemDen: sortedDiemDen.length,
          })
        } else {
          // Fallback: sử dụng logic cũ nếu không có diem_den
          setTripInfo({
            dia_diem_xuat_phat: tripData?.dia_diem_xuat_phat,
            dia_diem_den: tripData?.dia_diem_den,
            ngay_bat_dau: tripData?.ngay_bat_dau,
            ngay_ket_thuc: tripData?.ngay_ket_thuc,
          })
          console.log("✅ Trip info set (fallback):", {
            dia_diem_xuat_phat: tripData?.dia_diem_xuat_phat,
            dia_diem_den: tripData?.dia_diem_den,
          })
        }
      }
    } catch (err) {
      console.error("Lỗi lấy thông tin chuyến đi:", err)
    }
  }

  // Fetch trip info và diem den list khi component mount
  useEffect(() => {
    if (tripId) {
      fetchTripInfo()
      fetchDiemDenList()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tripId])

  // Tạo danh sách options cho điểm xuất phát và điểm đến
  const getAllLocationOptions = () => {
    const options: string[] = []
    
    // Thêm điểm xuất phát của chuyến đi (nếu có)
    if (tripInfo?.dia_diem_xuat_phat && !options.includes(tripInfo.dia_diem_xuat_phat)) {
      options.push(tripInfo.dia_diem_xuat_phat)
    }
    
    // Thêm tất cả các điểm đến
    diemDenList.forEach((diem) => {
      // Thêm dia_diem_xuat_phat
      if (diem.dia_diem_xuat_phat && !options.includes(diem.dia_diem_xuat_phat)) {
        options.push(diem.dia_diem_xuat_phat)
      }
      // Thêm ten_diem_den
      if (diem.ten_diem_den && !options.includes(diem.ten_diem_den)) {
        options.push(diem.ten_diem_den)
      }
    })
    
    return options.sort()
  }

  const getOriginOptions = () => {
    return getAllLocationOptions()
  }

  const getDestinationOptions = () => {
    return getAllLocationOptions()
  }

  return (
    <div className="space-y-6">
      {/* Bản đồ đường đi với chọn điểm */}
      {loadingDiemDen ? (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Navigation2 className="h-5 w-5 text-primary" />
              Bản đồ đường đi
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="p-8 text-center text-muted-foreground">
              <Loader2 className="h-8 w-8 mx-auto mb-4 animate-spin" />
              <p>Đang tải danh sách điểm đến...</p>
            </div>
          </CardContent>
        </Card>
      ) : diemDenList.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Navigation2 className="h-5 w-5 text-primary" />
              Bản đồ đường đi
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Chọn điểm xuất phát, điểm đến và phương tiện */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="origin-select">Điểm xuất phát</Label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setShowOriginSearch(!showOriginSearch)}
                    className="h-7 px-3 text-xs border-2 hover:bg-primary/10 hover:border-primary transition-colors"
                  >
                    {showOriginSearch ? (
                      <>
                        <ChevronUp className="h-3 w-3 mr-1" />
                        Ẩn tìm kiếm
                      </>
                    ) : (
                      <>
                        <Search className="h-3 w-3 mr-1" />
                        Tìm kiếm
                      </>
                    )}
                  </Button>
                </div>
                {showOriginSearch ? (
                  <div className="space-y-2">
                    <Popover open={openOriginPopover} onOpenChange={setOpenOriginPopover}>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          role="combobox"
                          className="w-full justify-between"
                        >
                          {selectedOrigin || "Tìm kiếm tỉnh thành..."}
                          <Search className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-[300px] p-0" align="start" onOpenAutoFocus={(e) => e.preventDefault()}>
                        <div className="p-2 border-b">
                          <Input
                            placeholder="Tìm kiếm tỉnh thành..."
                            value={originSearchQuery}
                            onChange={(e) => setOriginSearchQuery(e.target.value)}
                            className="h-9"
                            autoFocus
                          />
                        </div>
                        <div className="max-h-[300px] overflow-y-auto">
                          {filterTinhThanh(originSearchQuery).length > 0 ? (
                            filterTinhThanh(originSearchQuery).map((tinh) => (
                              <div
                                key={tinh}
                                className="px-3 py-2 cursor-pointer hover:bg-accent text-sm transition-colors"
                                onClick={() => {
                                  setSelectedOrigin(tinh)
                                  setOriginSearchQuery("")
                                  setOpenOriginPopover(false)
                                }}
                              >
                                {tinh}
                              </div>
                            ))
                          ) : (
                            <div className="px-3 py-2 text-sm text-muted-foreground text-center">
                              Không tìm thấy
                            </div>
                          )}
                        </div>
                      </PopoverContent>
                    </Popover>
                    {selectedOrigin && (
                      <div className="flex items-center gap-2 p-2 bg-muted rounded-md">
                        <MapPin className="h-4 w-4 text-primary" />
                        <span className="text-sm flex-1 font-medium">{selectedOrigin}</span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSelectedOrigin("")
                            setOriginSearchQuery("")
                          }}
                          className="h-6 w-6 p-0"
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    )}
                  </div>
                ) : (
                  <Select
                    value={selectedOrigin}
                    onValueChange={setSelectedOrigin}
                    disabled={loadingDiemDen}
                  >
                    <SelectTrigger id="origin-select"
                    className="border-2 border-gray-400 rounded-lg h-12 px-4 focus:border-blue-500"
                    >
                      <SelectValue placeholder="Chọn điểm xuất phát" />
                    </SelectTrigger>
                    <SelectContent>
                      {getOriginOptions().map((origin, index) => (
                        <SelectItem key={`origin-${index}`} value={origin}>
                          {origin}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="destination-select">Điểm đến</Label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setShowDestinationSearch(!showDestinationSearch)}
                    className="h-7 px-3 text-xs border-2 hover:bg-primary/10 hover:border-primary transition-colors"
                  >
                    {showDestinationSearch ? (
                      <>
                        <ChevronUp className="h-3 w-3 mr-1" />
                        Ẩn tìm kiếm
                      </>
                    ) : (
                      <>
                        <Search className="h-3 w-3 mr-1" />
                        Tìm kiếm
                      </>
                    )}
                  </Button>
                </div>
                {showDestinationSearch ? (
                  <div className="space-y-2">
                    <Popover open={openDestinationPopover} onOpenChange={setOpenDestinationPopover}>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          role="combobox"
                          className="w-full justify-between"
                        >
                          {selectedDestination || "Tìm kiếm tỉnh thành..."}
                          <Search className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-[300px] p-0" align="start" onOpenAutoFocus={(e) => e.preventDefault()}>
                        <div className="p-2 border-b">
                          <Input
                            placeholder="Tìm kiếm tỉnh thành..."
                            value={destinationSearchQuery}
                            onChange={(e) => setDestinationSearchQuery(e.target.value)}
                            className="h-9"
                            autoFocus
                          />
                        </div>
                        <div className="max-h-[300px] overflow-y-auto">
                          {filterTinhThanh(destinationSearchQuery).length > 0 ? (
                            filterTinhThanh(destinationSearchQuery).map((tinh) => (
                              <div
                                key={tinh}
                                className="px-3 py-2 cursor-pointer hover:bg-accent text-sm transition-colors"
                                onClick={() => {
                                  setSelectedDestination(tinh)
                                  setDestinationSearchQuery("")
                                  setOpenDestinationPopover(false)
                                }}
                              >
                                {tinh}
                              </div>
                            ))
                          ) : (
                            <div className="px-3 py-2 text-sm text-muted-foreground text-center">
                              Không tìm thấy
                            </div>
                          )}
                        </div>
                      </PopoverContent>
                    </Popover>
                    {selectedDestination && (
                      <div className="flex items-center gap-2 p-2 bg-muted rounded-md">
                        <MapPin className="h-4 w-4 text-primary" />
                        <span className="text-sm flex-1 font-medium">{selectedDestination}</span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSelectedDestination("")
                            setDestinationSearchQuery("")
                          }}
                          className="h-6 w-6 p-0"
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    )}
                  </div>
                ) : (
                  <Select
                    value={selectedDestination}
                    onValueChange={setSelectedDestination}
                    disabled={loadingDiemDen}
                  >
                    <SelectTrigger id="destination-select"
                    className="border-2 border-gray-400 rounded-lg h-12 px-4 focus:border-blue-500"
                    >
                      <SelectValue placeholder="Chọn điểm đến" />
                    </SelectTrigger>
                    <SelectContent>
                      {getDestinationOptions().map((destination, index) => (
                        <SelectItem key={`dest-${index}`} value={destination}>
                          {destination}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="travel-mode-select">Phương tiện</Label>
                <Select
                  value={travelMode}
                  onValueChange={(value: "driving" | "driving-traffic" | "walking" | "cycling" | "motorcycle") => setTravelMode(value)}
                  disabled={loadingDiemDen}
                >
                  <SelectTrigger id="travel-mode-select">
                    <div className="flex items-center gap-2">
                      {travelMode === "driving" && <Car className="h-4 w-4" />}
                      {travelMode === "driving-traffic" && <Car className="h-4 w-4" />}
                      {travelMode === "walking" && <Footprints className="h-4 w-4" />}
                      {travelMode === "cycling" && <Bike className="h-4 w-4" />}
                      {travelMode === "motorcycle" && <MotorcycleIcon className="h-4 w-4" />}
                      <SelectValue placeholder="Chọn phương tiện" />
                    </div>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="driving">
                      <div className="flex items-center gap-2">
                        <Car className="h-4 w-4" />
                        <span>Ô tô</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="driving-traffic">
                      <div className="flex items-center gap-2">
                        <Car className="h-4 w-4" />
                        <span>Ô tô (có tắc đường)</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="walking">
                      <div className="flex items-center gap-2">
                        <Footprints className="h-4 w-4" />
                        <span>Đi bộ</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="cycling">
                      <div className="flex items-center gap-2">
                        <Bike className="h-4 w-4" />
                        <span>Xe đạp</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="motorcycle">
                      <div className="flex items-center gap-2">
                        <MotorcycleIcon className="h-4 w-4" />
                        <span>Xe máy</span>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Hiển thị bản đồ */}
            {selectedOrigin && selectedDestination ? (
              <RouteMap
                origin={selectedOrigin}
                destination={selectedDestination}
                travelMode={travelMode}
              />
            ) : (
              <div className="p-8 text-center text-muted-foreground border rounded-lg">
                <MapPin className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Vui lòng chọn điểm xuất phát và điểm đến để xem bản đồ</p>
              </div>
            )}
          </CardContent>
        </Card>
      ) : tripInfo?.dia_diem_xuat_phat && tripInfo?.dia_diem_den ? (
        <RouteMap
          origin={tripInfo.dia_diem_xuat_phat}
          destination={tripInfo.dia_diem_den}
        />
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Navigation2 className="h-5 w-5 text-primary" />
              Bản đồ đường đi
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="p-4 text-center text-muted-foreground">
              {!tripInfo ? (
                <p>Đang tải thông tin chuyến đi...</p>
              ) : (
                <div className="space-y-2">
                  <p>Chưa có đủ thông tin để hiển thị bản đồ.</p>
                  <p className="text-sm">
                    Cần có: Điểm xuất phát và Điểm đến
                  </p>
                  {tripInfo.dia_diem_xuat_phat && (
                    <p className="text-sm">✓ Điểm xuất phát: {tripInfo.dia_diem_xuat_phat}</p>
                  )}
                  {tripInfo.dia_diem_den && (
                    <p className="text-sm">✓ Điểm đến: {tripInfo.dia_diem_den}</p>
                  )}
                  {!tripInfo.dia_diem_xuat_phat && (
                    <p className="text-sm text-destructive">✗ Thiếu: Điểm xuất phát</p>
                  )}
                  {!tripInfo.dia_diem_den && (
                    <p className="text-sm text-destructive">✗ Thiếu: Điểm đến</p>
                  )}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
