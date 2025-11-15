"use client"

import { useState, useEffect } from "react"
import axios from "axios"
import { useParams, useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ArrowLeft, Eye, Download, Star, Share2, Heart, AlertCircle } from "lucide-react"
import { motion } from "framer-motion"
import Link from "next/link"
import { ReadOnlyOverviewTab } from "@/components/trip/read-only-overview-tab"
import { ReadOnlyItineraryTab } from "@/components/trip/read-only-itinerary-tab"
// import { ReadOnlyMapsTab } from "@/components/trip/read-only-maps-tab"

const DEFAULT_COVER_IMAGE = "/placeholder.svg"
const DEFAULT_AVATAR = "/placeholder-user.jpg"

interface TripInfoAPI {
  chuyen_di_id: number
  ten_chuyen_di: string | null
  mo_ta: string | null
  url_avt: string | null
  dia_diem_xuat_phat: string | null
  ngay_bat_dau: string | null
  ngay_ket_thuc: string | null
  chu_so_huu_id: number
  tien_te: string | null
  trang_thai: string | null
  tong_ngan_sach: string | number | null
  tao_luc: string | null
  cong_khai: number | null
  chu_so_huu_ten: string | null
  chu_so_huu_avatar: string | null
  tong_thanh_vien: number | null
}

interface ItineraryLocationAPI {
  vi_do: number | null
  ghi_chu: string | null
  kinh_do: number | null
  dia_diem_id: number | null
  ten_dia_diem: string | null
  loai_dia_diem: string | null
  google_place_id: string | null
  thoi_gian_bat_dau: string | null
  thoi_gian_ket_thuc: string | null
}

interface ItineraryDayAPI {
  lich_trinh_ngay_id: number
  ngay: string | null
  ghi_chu: string | null
  dia_diem: ItineraryLocationAPI[]
}

interface ExpenseItemAPI {
  nhom: string | null
  tong_so_tien: string | number | null
  so_giao_dich: number | null
}

interface ChiPhiAPI {
  tong_chi_phi: string | number | null
  danh_sach: ExpenseItemAPI[] | null
}

interface TripDetailAPIResponse {
  message: string
  thong_tin: TripInfoAPI
  lich_trinh: ItineraryDayAPI[]
  chi_phi: ChiPhiAPI | null
}

interface PublicTripDetail {
  id: string
  title: string
  description: string
  destination: string
  duration: string
  startDate: string
  endDate: string
  memberCount: number
  viewCount: number
  rating: number
  tags: string[]
  owner: {
    name: string
    avatar: string
    bio: string
  }
  coverImage: string
  highlights: string[]
  budget: string
  isVerified: boolean
  itinerary: any[]
  expenses?: {
    total: number
    breakdown: { category: string; amount: number }[]
  }
}

const normalizeTime = (time: string | null): string => {
  if (!time) return "--:--"
  const trimmed = time.trim()
  if (trimmed.length >= 5) return trimmed.slice(0, 5)
  return trimmed
}

const formatTimeRange = (start: string | null, end: string | null): string => {
  const startTime = normalizeTime(start)
  const endTime = normalizeTime(end)
  if (startTime === "--:--" && endTime === "--:--") return "Không rõ"
  if (startTime !== "--:--" && endTime !== "--:--") return `${startTime} - ${endTime}`
  return startTime !== "--:--" ? startTime : endTime
}

const formatDateDisplay = (dateString: string | null): string => {
  if (!dateString) return "Chưa xác định"
  const date = new Date(dateString)
  if (isNaN(date.getTime())) return "Chưa xác định"
  return date.toLocaleDateString("vi-VN")
}

const calculateDuration = (startDate: string | null, endDate: string | null): string => {
  if (!startDate || !endDate) return "Chưa xác định"
  const start = new Date(startDate)
  const end = new Date(endDate)
  if (isNaN(start.getTime()) || isNaN(end.getTime())) return "Chưa xác định"
  start.setHours(0, 0, 0, 0)
  end.setHours(0, 0, 0, 0)
  const diffTime = end.getTime() - start.getTime()
  const diffDays = Math.max(Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1, 1)
  const nights = Math.max(diffDays - 1, 0)
  return nights > 0 ? `${diffDays} ngày ${nights} đêm` : `${diffDays} ngày`
}

const formatBudget = (amount: string | number | null | undefined, currency: string | null | undefined): string => {
  if (amount === null || amount === undefined) return "Chưa cập nhật"
  const numericAmount = typeof amount === "string" ? parseFloat(amount) : amount
  if (numericAmount === null || isNaN(Number(numericAmount))) return "Chưa cập nhật"
  const formatted = new Intl.NumberFormat("vi-VN").format(Number(numericAmount))
  return `${formatted} ${currency || "VNĐ"}`
}

const inferActivityType = (rawType: string | null): string => {
  const type = rawType?.toLowerCase() || ""
  if (type.includes("di") || type.includes("move") || type.includes("transport")) return "transport"
  if (type.includes("khách") || type.includes("hotel") || type.includes("stay")) return "accommodation"
  if (type.includes("ăn") || type.includes("food") || type.includes("restaurant")) return "dining"
  if (type.includes("vui") || type.includes("giải trí") || type.includes("entertain")) return "entertainment"
  return "sightseeing"
}

const buildTags = (description: string | null): string[] => {
  if (!description) return ["Du lịch"]
  const tags: string[] = []
  const lower = description.toLowerCase()
  if (lower.includes("biển") || lower.includes("beach")) tags.push("Biển")
  if (lower.includes("núi") || lower.includes("mountain")) tags.push("Núi")
  if (lower.includes("văn hóa") || lower.includes("culture")) tags.push("Văn hóa")
  if (lower.includes("thành phố") || lower.includes("city")) tags.push("Thành phố")
  if (!tags.length) tags.push("Du lịch")
  return tags
}

const buildHighlights = (description: string | null, itinerary: ItineraryDayAPI[]): string[] => {
  const highlights: string[] = []
  if (description) {
    const sentences = description
      .split(".")
      .map((item) => item.trim())
      .filter((item) => item.length > 0)
    highlights.push(...sentences.slice(0, 3))
  }

  if (!highlights.length) {
    const locationNames = itinerary
      .flatMap((day) => day.dia_diem || [])
      .map((location) => location.ten_dia_diem)
      .filter((name): name is string => Boolean(name))
    highlights.push(...locationNames.slice(0, 3))
  }

  if (!highlights.length) {
    highlights.push("Chuyến đi thú vị")
  }

  return highlights
}

const buildItinerary = (itinerary: ItineraryDayAPI[]): any[] =>
  itinerary.map((day, index) => {
    const activities = (day.dia_diem || []).map((activity, actIndex) => ({
      time: normalizeTime(activity.thoi_gian_bat_dau),
      title: activity.ten_dia_diem || `Hoạt động ${actIndex + 1}`,
      location: activity.ten_dia_diem || "Địa điểm chưa cập nhật",
      duration: formatTimeRange(activity.thoi_gian_bat_dau, activity.thoi_gian_ket_thuc),
      type: inferActivityType(activity.loai_dia_diem),
    }))

    const titleParts = [`Ngày ${index + 1}`]
    if (day.ghi_chu) titleParts.push(day.ghi_chu)

    return {
      day: index + 1,
      title: titleParts.join(": "),
      date: formatDateDisplay(day.ngay),
      activities,
    }
  })

const buildExpenses = (chiPhi: ChiPhiAPI | null | undefined) => {
  if (!chiPhi) return undefined
  const breakdown = (chiPhi.danh_sach || [])
    .map((item) => {
      const amount = item?.tong_so_tien
      const numericAmount = typeof amount === "string" ? parseFloat(amount) : amount
      return {
        category: item?.nhom || "Khác",
        amount: isNaN(Number(numericAmount)) ? 0 : Number(numericAmount),
      }
    })
    .filter((expense) => expense.amount > 0)

  const totalFromList = breakdown.reduce((sum, expense) => sum + expense.amount, 0)
  const total = (() => {
    if (chiPhi.tong_chi_phi === null || chiPhi.tong_chi_phi === undefined) return totalFromList
    const numeric = typeof chiPhi.tong_chi_phi === "string" ? parseFloat(chiPhi.tong_chi_phi) : chiPhi.tong_chi_phi
    return isNaN(Number(numeric)) ? totalFromList : Number(numeric)
  })()

  if (!breakdown.length && total === 0) return undefined
  return { total, breakdown }
}

const mapTripDetailFromAPI = (payload: TripDetailAPIResponse): PublicTripDetail => {
  const info = payload.thong_tin
  const startDate = info.ngay_bat_dau || info.ngay_ket_thuc || new Date().toISOString().split("T")[0]
  const endDate = info.ngay_ket_thuc || startDate

  const itinerary = buildItinerary(payload.lich_trinh || [])
  const highlights = buildHighlights(info.mo_ta, payload.lich_trinh || [])
  const expenses = buildExpenses(payload.chi_phi)

  return {
    id: String(info.chuyen_di_id),
    title: info.ten_chuyen_di || "Chuyến đi không có tên",
    description: info.mo_ta || "Chưa có mô tả",
    destination: info.dia_diem_xuat_phat || "Chưa xác định",
    duration: calculateDuration(startDate, endDate),
    startDate,
    endDate,
    memberCount: info.tong_thanh_vien || 1,
    viewCount: 0,
    rating: 4.5,
    tags: buildTags(info.mo_ta),
    owner: {
      name: info.chu_so_huu_ten || "Người dùng",
      avatar: info.chu_so_huu_avatar || DEFAULT_AVATAR,
      bio: info.mo_ta || "Chuyến đi được chia sẻ từ cộng đồng TravelPlan.",
    },
    coverImage: info.url_avt || DEFAULT_COVER_IMAGE,
    highlights,
    budget: formatBudget(info.tong_ngan_sach, info.tien_te),
    isVerified: info.cong_khai === 1,
    itinerary,
    expenses,
  }
}

export default function PublicTripDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [trip, setTrip] = useState<PublicTripDetail | null>(null)
  const [activeTab, setActiveTab] = useState("overview")
  const [isLiked, setIsLiked] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const id = params.id as string | undefined
    if (!id) return

    const fetchTripDetail = async () => {
      setLoading(true)
      setError(null)
      try {
        const response = await axios.get<TripDetailAPIResponse>(
          `https://travel-planner-imdw.onrender.com/api/chuyendi/cong-khai/${id}`
        )

        if (!response.data?.thong_tin) {
          setTrip(null)
          setError("Không tìm thấy chuyến đi.")
          return
        }

        setTrip(mapTripDetailFromAPI(response.data))
      } catch (err: unknown) {
        if (axios.isAxiosError(err)) {
          const message =
            err.response?.data?.message ||
            (err.response?.status === 404 ? "Không tìm thấy chuyến đi." : "Không thể tải chi tiết chuyến đi.")
          setError(message)
          if (err.response?.status === 404) {
            setTrip(null)
          }
        } else {
          setError("Đã xảy ra lỗi bất ngờ khi tải chi tiết chuyến đi.")
        }
      } finally {
        setLoading(false)
      }
    }

    fetchTripDetail()
  }, [params.id])

  const handleDownloadPDF = () => {
    if (!trip) return
    const link = document.createElement("a")
    link.href = "#"
    link.download = `${trip.title}.pdf`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-sky-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Đang tải chi tiết chuyến đi...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-sky-50 to-blue-50 flex items-center justify-center px-4">
        <Card className="max-w-lg w-full">
          <CardContent className="py-10 text-center space-y-4">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto" />
            <h2 className="text-xl font-semibold text-gray-900">Không thể tải chuyến đi</h2>
            <p className="text-gray-600">{error}</p>
            <div className="flex justify-center gap-3">
              <Button onClick={() => router.push("/feed")} variant="outline" className="border-blue-200 text-blue-600">
                Quay về bản tin
              </Button>
              <Button onClick={() => router.refresh()} className="bg-blue-600 hover:bg-blue-700">
                Thử lại
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!trip) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-sky-50 to-blue-50 flex items-center justify-center px-4">
        <Card className="max-w-lg w-full">
          <CardContent className="py-10 text-center space-y-4">
            <AlertCircle className="h-12 w-12 text-yellow-500 mx-auto" />
            <h2 className="text-xl font-semibold text-gray-900">Chuyến đi không khả dụng</h2>
            <p className="text-gray-600">Chuyến đi công khai này có thể đã bị xóa hoặc chuyển sang chế độ riêng tư.</p>
            <Button onClick={() => router.push("/feed")} className="bg-blue-600 hover:bg-blue-700">
              Quay về bản tin
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-50 to-blue-50">
      {/* Header */}
      <div className="bg-white border-b border-blue-100 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link href="/feed">
                <Button variant="ghost" size="sm" className="text-blue-600 hover:bg-blue-50">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Quay lại
                </Button>
              </Link>
              <div className="text-sm text-gray-600">
                <Link href="/feed" className="hover:text-blue-600">
                  Bản tin
                </Link>
                <span className="mx-2">/</span>
                <span className="text-gray-900">{trip.title}</span>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsLiked((prev) => !prev)}
                className={`border-blue-200 ${
                  isLiked ? "bg-red-50 text-red-600 border-red-200" : "text-blue-600 hover:bg-blue-50"
                }`}
              >
                <Heart className={`h-4 w-4 mr-2 ${isLiked ? "fill-current" : ""}`} />
                {isLiked ? "Đã thích" : "Thích"}
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="border-blue-200 text-blue-600 hover:bg-blue-50 bg-transparent"
              >
                <Share2 className="h-4 w-4 mr-2" />
                Chia sẻ
              </Button>
              <Button onClick={handleDownloadPDF} className="bg-blue-600 hover:bg-blue-700 text-white">
                <Download className="h-4 w-4 mr-2" />
                Tải PDF
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Hero Section */}
      <div className="relative h-96 overflow-hidden">
        <img src={trip.coverImage || DEFAULT_COVER_IMAGE} alt={trip.title} className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-8">
          <div className="max-w-7xl mx-auto">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
              <div className="flex items-center gap-2 mb-4">
                {trip.isVerified && (
                  <Badge className="bg-green-500 text-white">
                    <Star className="h-3 w-3 mr-1" />
                    Xác thực
                  </Badge>
                )}
                <Badge variant="secondary" className="bg-white/20 text-white border-white/30">
                  <Eye className="h-3 w-3 mr-1" />
                  {trip.viewCount.toLocaleString()} lượt xem
                </Badge>
              </div>
              <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">{trip.title}</h1>
              <p className="text-xl text-white/90 mb-6 max-w-3xl">{trip.description}</p>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-3 mb-8">
                <TabsTrigger value="overview">Tổng quan</TabsTrigger>
                <TabsTrigger value="itinerary">Lịch trình</TabsTrigger>
                <TabsTrigger value="expenses">Chi phí</TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="space-y-6">
                <ReadOnlyOverviewTab trip={trip} />
              </TabsContent>

              <TabsContent value="itinerary" className="space-y-6">
                <ReadOnlyItineraryTab itinerary={trip.itinerary} />
              </TabsContent>

              <TabsContent value="expenses" className="space-y-6">
                {trip.expenses ? (
                  <Card>
                    <CardHeader>
                      <CardTitle>Chi phí chuyến đi</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex items-center justify-between text-lg font-semibold">
                        <span>Tổng chi phí</span>
                        <span className="text-blue-600">
                          {trip.expenses.total.toLocaleString("vi-VN")} {trip.budget.includes("VNĐ") ? "VNĐ" : ""}
                        </span>
                      </div>
                      <div className="space-y-3">
                        {trip.expenses.breakdown.map((expense, index) => (
                          <div key={index} className="flex items-center justify-between border-b border-gray-100 pb-2">
                            <span className="text-gray-600">{expense.category}</span>
                            <span className="font-medium">{expense.amount.toLocaleString("vi-VN")} VNĐ</span>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                ) : (
                  <Card>
                    <CardContent className="py-12 text-center text-gray-600">
                      Chưa có dữ liệu chi phí cho chuyến đi này.
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              {/* <TabsContent value="map" className="space-y-6">
                <ReadOnlyMapsTab tripId={trip.id} />
              </TabsContent> */}
            </Tabs>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Owner Info */}
            <Card>
              <CardHeader>
                <CardTitle>Người tạo</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-4 mb-4">
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={trip.owner.avatar || DEFAULT_AVATAR} />
                    <AvatarFallback>{trip.owner.name[0]}</AvatarFallback>
                  </Avatar>
                  <div>
                    <h4 className="font-semibold">{trip.owner.name}</h4>
                    <div className="flex items-center gap-1">
                      <Star className="h-4 w-4 text-yellow-400 fill-current" />
                      <span className="text-sm text-gray-600">{trip.rating}</span>
                    </div>
                  </div>
                </div>
                <p className="text-sm text-gray-600 mb-4 line-clamp-4">{trip.owner.bio}</p>
                <Button
                  variant="outline"
                  className="w-full border-blue-200 text-blue-600 hover:bg-blue-50 bg-transparent"
                >
                  Xem thêm chuyến đi
                </Button>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Hành động</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button onClick={handleDownloadPDF} className="w-full bg-blue-600 hover:bg-blue-700 text-white">
                  <Download className="h-4 w-4 mr-2" />
                  Tải kế hoạch PDF
                </Button>
                <Button
                  variant="outline"
                  className="w-full border-blue-200 text-blue-600 hover:bg-blue-50 bg-transparent"
                >
                  <Share2 className="h-4 w-4 mr-2" />
                  Chia sẻ chuyến đi
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setIsLiked((prev) => !prev)}
                  className={`w-full ${
                    isLiked ? "bg-red-50 text-red-600 border-red-200" : "border-blue-200 text-blue-600 hover:bg-blue-50"
                  }`}
                >
                  <Heart className={`h-4 w-4 mr-2 ${isLiked ? "fill-current" : ""}`} />
                  {isLiked ? "Bỏ thích" : "Yêu thích"}
                </Button>
              </CardContent>
            </Card>

            {/* Trip Stats */}
            <Card>
              <CardHeader>
                <CardTitle>Thống kê</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Thành viên:</span>
                  <span className="font-semibold">{trip.memberCount}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Ngày bắt đầu:</span>
                  <span className="font-semibold">{formatDateDisplay(trip.startDate)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Ngày kết thúc:</span>
                  <span className="font-semibold">{formatDateDisplay(trip.endDate)}</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
