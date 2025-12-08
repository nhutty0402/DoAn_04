"use client"

import { useState, useEffect } from "react"
import axios from "axios"
import Cookies from "js-cookie"
import { useParams, useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import { ArrowLeft, Eye, Download, Star, Share2, Heart, AlertCircle, X, ChevronLeft, ChevronRight, Calendar, MapPin } from "lucide-react"
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
  dia_diem_den: string | null
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

interface ItineraryDiemDenAPI {
  diem_den_id: number | null
  ten_diem_den: string | null
  thu_tu: number | null
}

interface ItineraryDayAPI {
  lich_trinh_ngay_id: number
  ngay: string | null
  tieu_de: string | null
  ghi_chu: string | null
  gio_bat_dau: string | null
  gio_ket_thuc: string | null
  diem_den: ItineraryDiemDenAPI | number | null
  dia_diem: ItineraryLocationAPI[]
}

interface ExpenseGroupAPI {
  nhom: string | null
  tong_tien: string | number | null
  so_giao_dich: number | null
}

interface ExpenseDetailAPI {
  chi_phi_id: number
  nhom: string | null
  mo_ta: string | null
  so_tien: string | number | null
  ngay: string | null
  nguoi_chi: string | null
  avatar_url: string | null
  diem_den_id: number | null
  ten_diem_den: string | null
}

interface ChiPhiAPI {
  tong_chi_phi: string | number | null
  theo_nhom: ExpenseGroupAPI[] | null
  chi_tiet: ExpenseDetailAPI[] | null
}

interface DiemDenAPI {
  diem_den_id: number | null
  chuyen_di_id: number | null
  ten_diem_den: string | null
  thu_tu: number | null
  ngay_du_kien: number | null
  ghi_chu: string | null
  tao_luc: string | null
}

interface BaiVietDiemDenAPI {
  diem_den_id: number | null
  ten_diem_den: string | null
  thu_tu: number | null
  ngay_du_kien: number | null
}

interface BaiVietAPI {
  bai_viet_id: number
  noi_dung: string | null
  anh_chinh: string | null
  luot_thich: number | null
  tao_luc: string | null
  nguoi_dung_id: number | null
  ho_ten: string | null
  avatar_url: string | null
  anh_phu: string[] | null
  diem_den: BaiVietDiemDenAPI | null
}

interface TripDetailAPIResponse {
  message: string
  chuyen_di: TripInfoAPI
  diem_den: DiemDenAPI[]
  lich_trinh: ItineraryDayAPI[]
  bai_viet: BaiVietAPI[]
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
  totalExpense: string
  isVerified: boolean
  itinerary: any[]
  expenses?: {
    total: number
    breakdown: { category: string; amount: number }[]
  }
  expenseDetails: ExpenseDetailAPI[]
  posts: BaiVietAPI[]
  rawInfo: TripInfoAPI
  diem_den: DiemDenAPI[]
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

const formatTrangThai = (trangThai: string | null): string => {
  if (!trangThai) return "Không rõ"
  const status = trangThai.toLowerCase().trim()
  switch (status) {
    case "sap_toi":
      return "Sắp tới"
    case "dang_thuc_hien":
      return "Đang thực hiện"
    case "hoan_thanh":
      return "Hoàn thành"
    default:
      return trangThai
  }
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

const parseNumeric = (value: string | number | null | undefined): number | null => {
  if (value === null || value === undefined) return null
  const numeric = typeof value === "string" ? parseFloat(value) : value
  return Number.isNaN(Number(numeric)) ? null : Number(numeric)
}

const formatCurrencyValue = (value: string | number | null | undefined, currency: string | null | undefined): string => {
  const numeric = parseNumeric(value)
  if (numeric === null) return "Chưa cập nhật"
  return `${numeric.toLocaleString("vi-VN")} ${currency || "VNĐ"}`
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
      // Thêm các trường chi tiết
      dia_diem_id: activity.dia_diem_id,
      loai_dia_diem: activity.loai_dia_diem,
      vi_do: activity.vi_do,
      kinh_do: activity.kinh_do,
      google_place_id: activity.google_place_id,
      thoi_gian_bat_dau: activity.thoi_gian_bat_dau,
      thoi_gian_ket_thuc: activity.thoi_gian_ket_thuc,
      ghi_chu: activity.ghi_chu,
    }))

    // ✅ Sử dụng tieu_de nếu có, nếu không thì dùng ghi_chu hoặc mặc định
    const titleParts: string[] = []
    if (day.tieu_de) {
      titleParts.push(day.tieu_de)
    } else {
      titleParts.push(`Ngày ${index + 1}`)
    }
    if (day.ghi_chu && !day.tieu_de) {
      titleParts.push(day.ghi_chu)
    }

    // ✅ Format thời gian bắt đầu và kết thúc của ngày nếu có
    const dayTimeRange = formatTimeRange(day.gio_bat_dau, day.gio_ket_thuc)

    // ✅ Xử lý diem_den - có thể là object hoặc number
    let diemDenInfo: ItineraryDiemDenAPI | null = null
    if (day.diem_den) {
      if (typeof day.diem_den === 'object' && day.diem_den !== null) {
        diemDenInfo = day.diem_den as ItineraryDiemDenAPI
      }
    }

    return {
      day: index + 1,
      title: titleParts.join(": "),
      date: formatDateDisplay(day.ngay),
      dayTimeRange: dayTimeRange !== "Không rõ" ? dayTimeRange : undefined,
      // ✅ Thêm các trường mới
      tieu_de: day.tieu_de,
      ghi_chu: day.ghi_chu,
      gio_bat_dau: day.gio_bat_dau,
      gio_ket_thuc: day.gio_ket_thuc,
      diem_den: diemDenInfo,
      lich_trinh_ngay_id: day.lich_trinh_ngay_id,
      ngay: day.ngay,
      activities,
    }
  })

const buildExpenses = (chiPhi: ChiPhiAPI | null | undefined) => {
  if (!chiPhi) return undefined
  const breakdown = (chiPhi.theo_nhom || [])
    .map((item) => {
      const amount = item?.tong_tien
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
  // ✅ API mới sử dụng chuyen_di thay vì thong_tin
  const info = payload.chuyen_di
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
      bio: info.mo_ta || "Chuyến đi được chia sẻ từ cộng đồng VN-Travel.",
    },
    coverImage: info.url_avt || DEFAULT_COVER_IMAGE,
    highlights,
    budget: formatBudget(info.tong_ngan_sach, info.tien_te),
    totalExpense: formatBudget(payload.chi_phi?.tong_chi_phi || 0, info.tien_te),
    isVerified: info.cong_khai === 1,
    itinerary,
    expenses,
    expenseDetails: payload.chi_phi?.chi_tiet || [],
    posts: payload.bai_viet || [],
    rawInfo: info,
    diem_den: payload.diem_den || [],
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
  const [imageViewer, setImageViewer] = useState<{
    isOpen: boolean
    images: string[]
    currentIndex: number
  }>({
    isOpen: false,
    images: [],
    currentIndex: 0,
  })

  useEffect(() => {
    const id = params.id as string | undefined
    if (!id) return

    const fetchTripDetail = async () => {
      setLoading(true)
      setError(null)
      try {
        // ✅ Lấy token từ cookie
        const token = Cookies.get("token") // ✅ lấy từ cookie
        console.log("Token từ cookie:", token)

        // ✅ Kiểm tra token hợp lệ
        if (!token || token === "null" || token === "undefined") {
          console.warn("Không có token → chuyển về /login")
          router.replace("/login")
          return
        }

        const response = await axios.get<TripDetailAPIResponse>(
          `https://travel-planner-imdw.onrender.com/api/chuyen-di/${id}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          }
        )

        console.log("✅ API Response (Trip Detail):", response.data)

        if (!response.data?.chuyen_di) {
          setTrip(null)
          setError("Không tìm thấy chuyến đi.")
          return
        }

        setTrip(mapTripDetailFromAPI(response.data))
      } catch (err: unknown) {
        console.error("❌ Lỗi khi tải chi tiết chuyến đi:", err)
        if (axios.isAxiosError(err)) {
          if (err.response?.status === 401) {
            setError("Phiên đăng nhập đã hết hạn")
            router.replace("/login")
          } else {
            const message =
              err.response?.data?.message ||
              (err.response?.status === 404 ? "Không tìm thấy chuyến đi." : "Không thể tải chi tiết chuyến đi.")
            setError(message)
            if (err.response?.status === 404) {
              setTrip(null)
            }
          }
        } else {
          setError("Đã xảy ra lỗi bất ngờ khi tải chi tiết chuyến đi.")
        }
      } finally {
        setLoading(false)
      }
    }

    fetchTripDetail()
  }, [params.id, router])

  const handleDownloadPDF = () => {
    if (!trip) return
    const link = document.createElement("a")
    link.href = "#"
    link.download = `${trip.title}.pdf`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const openImageViewer = (images: string[], startIndex: number = 0) => {
    setImageViewer({
      isOpen: true,
      images,
      currentIndex: startIndex,
    })
  }

  const closeImageViewer = () => {
    setImageViewer({
      isOpen: false,
      images: [],
      currentIndex: 0,
    })
  }

  const nextImage = () => {
    if (imageViewer.images.length === 0) return
    setImageViewer((prev) => ({
      ...prev,
      currentIndex: (prev.currentIndex + 1) % prev.images.length,
    }))
  }

  const prevImage = () => {
    if (imageViewer.images.length === 0) return
    setImageViewer((prev) => ({
      ...prev,
      currentIndex: (prev.currentIndex - 1 + prev.images.length) % prev.images.length,
    }))
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
      {/* <div className="bg-white border-b border-blue-100 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link href="/feed">
                <Button variant="ghost" size="sm" className="text-blue-600 hover:bg-blue-50">
                  <ArrowLeft className="h-4 w-4 mr-2" />
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
      </div> */}

      {/* Hero Section */}
      <div className="relative h-96 overflow-hidden">
        <img src={trip.coverImage || DEFAULT_COVER_IMAGE} alt={trip.title} className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-8">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center gap-3 text-sm">
              {/* Nút quay lại – trong suốt hoàn toàn, chữ trắng xám sang trọng */}
              <Link
                href="/feed"
                className="group inline-flex items-center gap-1.5 px-4 py-2 rounded-xl
               bg-white/5 dark:bg-white/10
               backdrop-blur-sm
               border border-white/20 dark:border-white/30
               text-gray-200 dark:text-gray-100
               font-medium
               hover:bg-white/10 dark:hover:bg-white/20
               hover:border-white/40
               hover:text-white
               hover:shadow-xl hover:shadow-black/5
               transition-all duration-300"
              >
                <span className="group-hover:-translate-x-1 transition-transform duration-300 text-gray-400 group-hover:text-white">
                  ←
                </span>
                Quay lại Bản tin
              </Link>

              {/* Dấu chấm phân cách nhẹ nhàng */}
              {/* <span className="text-gray-400 dark:text-gray-500">•</span> */}

              {/* Tiêu đề bài viết */}
              {/* <span className="font-semibold text-white dark:text-gray-50 truncate max-w-md">
                {trip.title}
              </span> */}
            </div>
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
              {/* <div className="flex items-center gap-2 mb-4">
                {trip.isVerified && (
                  // thích
                  <Badge className="bg-green-500 text-white">
                    <Star className="h-3 w-3 mr-1" />              
                  </Badge>
                )}
                <Badge variant="secondary" className="bg-white/20 text-white border-white/30">
                  <Eye className="h-3 w-3 mr-1" />
                  {trip.viewCount.toLocaleString()} lượt xem
                </Badge>
              </div> */}
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
              <TabsList className="grid w-full grid-cols-5 mb-8">
                <TabsTrigger value="overview">Tổng quan</TabsTrigger>
                <TabsTrigger value="diem-den">Điểm đến</TabsTrigger>
                <TabsTrigger value="itinerary">Lịch trình</TabsTrigger>
                <TabsTrigger value="expenses">Chi phí</TabsTrigger>
                <TabsTrigger value="posts">Bài viết</TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="space-y-6">
                <ReadOnlyOverviewTab trip={trip} />
              </TabsContent>

              <TabsContent value="diem-den" className="space-y-6">
                {trip.diem_den && trip.diem_den.length > 0 ? (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <MapPin className="h-5 w-5 text-blue-600" />
                        Danh sách điểm đến ({trip.diem_den.length})
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {trip.diem_den.map((diem, index) => (
                          <div
                            key={diem.diem_den_id || index}
                            className="border border-gray-200 rounded-xl p-5 hover:shadow-md transition-all duration-200 bg-gradient-to-r from-white to-blue-50/30 hover:from-blue-50/50 hover:to-blue-100/30"
                          >
                            <div className="flex items-start gap-4">
                              <div className="flex items-center justify-center w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 text-white font-bold text-base shadow-md flex-shrink-0">
                                {diem.thu_tu || index + 1}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-2">
                                  <MapPin className="h-4 w-4 text-blue-600 flex-shrink-0" />
                                  <h3 className="text-lg font-bold text-gray-900">
                                    {diem.ten_diem_den || `Điểm đến ${index + 1}`}
                                  </h3>
                                </div>
                                
                                {diem.ghi_chu && (
                                  <div className="mt-2 ml-6 p-3 bg-white/60 rounded-lg border border-gray-200">
                                    <p className="text-sm text-gray-700 leading-relaxed">
                                      {diem.ghi_chu}
                                    </p>
                                  </div>
                                )}

                                <div className="flex items-center gap-4 mt-3 ml-6 text-sm text-gray-600 flex-wrap">
                                  {diem.ngay_du_kien !== null && diem.ngay_du_kien !== undefined && (
                                    <div className="flex items-center gap-1.5 bg-blue-50 px-3 py-1.5 rounded-full">
                                      <Calendar className="h-4 w-4 text-blue-600" />
                                      <span className="font-medium">Ngày {diem.ngay_du_kien}</span>
                                    </div>
                                  )}
                                  {diem.tao_luc && (
                                    <div className="flex items-center gap-1.5 text-gray-500">
                                      <span>Tạo: {formatDateDisplay(diem.tao_luc)}</span>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                ) : (
                  <Card>
                    <CardContent className="py-12 text-center">
                      <MapPin className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-600 text-base">Chưa có điểm đến nào được thêm vào chuyến đi này.</p>
                    </CardContent>
                  </Card>
                )}
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
                      {trip.expenseDetails.length > 0 && (
                        <div className="mt-8">
                          <h4 className="text-base font-semibold mb-3">Chi tiết giao dịch</h4>
                          {/* Container chính – đẹp, có shadow nhẹ, bo góc mềm */}
                          <div className="border border-gray-200 rounded-xl overflow-hidden shadow-sm bg-white">
                            {/* Thanh cuộn dọc mượt + giới hạn chiều cao hợp lý */}
                            <div className="max-h-96 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-400 scrollbar-track-gray-100">
                              {/* Thanh cuộn ngang (rất cần trên mobile) */}
                              <div className="overflow-x-auto">
                                <table className="min-w-full text-sm">
                                  <thead className="bg-gray-50 text-gray-700 sticky top-0 z-10 border-b border-gray-200">
                                    <tr>
                                      <th className="px-5 py-3.5 text-left font-semibold text-gray-800">Ngày</th>
                                      <th className="px-5 py-3.5 text-left font-semibold text-gray-800">Nhóm</th>
                                      <th className="px-5 py-3.5 text-left font-semibold text-gray-800">Mô tả</th>
                                      <th className="px-5 py-3.5 text-left font-semibold text-gray-800">Điểm đến</th>
                                      <th className="px-5 py-3.5 text-left font-semibold text-gray-800">Người chi</th>
                                      <th className="px-5 py-3.5 text-right font-semibold text-gray-800">Số tiền</th>
                                    </tr>
                                  </thead>

                                  <tbody className="divide-y divide-gray-100">
                                    {trip.expenseDetails.map((detail) => (
                                      <tr
                                        key={detail.chi_phi_id}
                                        className="hover:bg-gray-50/70 transition-colors duration-150"
                                      >
                                        <td className="px-5 py-4 text-gray-600 font-medium">
                                          {formatDateDisplay(detail.ngay)}
                                        </td>
                                        <td className="px-5 py-4 text-gray-800">
                                          {detail.nhom || "Không rõ"}
                                        </td>
                                        <td className="px-5 py-4 text-gray-700">
                                          {detail.mo_ta || "—"}
                                        </td>
                                        <td className="px-5 py-4 text-gray-600">
                                          {detail.ten_diem_den || "—"}
                                        </td>
                                        <td className="px-5 py-4">
                                          <div className="flex items-center gap-3">
                                            <Avatar className="h-6 w-6">
                                              <AvatarImage src={detail.avatar_url || DEFAULT_AVATAR} alt={detail.nguoi_chi || "Người dùng"} />
                                              <AvatarFallback>{detail.nguoi_chi?.[0] || "U"}</AvatarFallback>
                                            </Avatar>
                                            <span className="font-medium text-gray-800">
                                              {detail.nguoi_chi || "Người dùng"}
                                            </span>
                                          </div>
                                        </td>
                                        <td className="px-5 py-4 text-right font-semibold text-gray-900">
                                          {formatCurrencyValue(detail.so_tien, trip.rawInfo.tien_te)}
                                        </td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
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
              {/* CHI TIẾT BÀI VIẾT */}
              <TabsContent value="posts" className="mt-2">
                {/* Đây là lớp thêm thanh cuộn đẹp */}
                <div className="max-h-[600px] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-50 pr-2">

                  <div className="space-y-6">
                    {trip.posts.length ? (
                      trip.posts.map((post) => (
                        <Card key={post.bai_viet_id} className="overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-200">
                          <CardHeader className="pb-3">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <Avatar className="h-10 w-10 ring-2 ring-white shadow-md">
                                  <AvatarImage src={post.avatar_url || DEFAULT_AVATAR} alt={post.ho_ten || "Người dùng"} />
                                  <AvatarFallback className="text-sm font-medium">
                                    {post.ho_ten?.[0] || "U"}
                                  </AvatarFallback>
                                </Avatar>
                                <div>
                                  <CardTitle className="text-base font-semibold text-gray-900">
                                    {post.ho_ten || "Người dùng"}
                                  </CardTitle>
                                  <p className="text-xs text-gray-500">
                                    {formatDateDisplay(post.tao_luc)}
                                    {post.diem_den && (
                                      <span className="ml-2 text-blue-600">
                                        • {post.diem_den.ten_diem_den}
                                      </span>
                                    )}
                                  </p>
                                </div>
                              </div>
                              {post.luot_thich !== null && post.luot_thich !== undefined && (
                                <div className="flex items-center gap-1 text-sm text-gray-600">
                                  <Heart className="h-4 w-4 text-red-500 fill-red-500" />
                                  <span>{post.luot_thich}</span>
                                </div>
                              )}
                            </div>
                          </CardHeader>

                          <CardContent className="space-y-4 pt-2">
                            <p className="text-gray-700 leading-relaxed">
                              {post.noi_dung || "Không có nội dung."}
                            </p>

                            {post.anh_chinh && (
                              <img
                                src={post.anh_chinh}
                                alt={post.noi_dung || "Ảnh bài viết"}
                                className="w-full rounded-xl border border-gray-200 object-cover max-h-96 shadow-sm cursor-pointer hover:opacity-90 transition-opacity"
                                onClick={() => {
                                  const allImages = [post.anh_chinh, ...(post.anh_phu || [])].filter(Boolean) as string[]
                                  openImageViewer(allImages, 0)
                                }}
                              />
                            )}

                            {post.anh_phu?.length ? (
                              <div className="grid grid-cols-2 gap-3">
                                {post.anh_phu.map((url, idx) => {
                                  const allImages = [post.anh_chinh, ...(post.anh_phu || [])].filter(Boolean) as string[]
                                  const imageIndex = post.anh_chinh ? idx + 1 : idx
                                  return (
                                    <img
                                      key={`${post.bai_viet_id}-${idx}`}
                                      src={url}
                                      alt={`Ảnh phụ ${idx + 1}`}
                                      className="rounded-lg border border-gray-200 object-cover h-40 w-full shadow-sm hover:shadow transition-shadow cursor-pointer hover:opacity-90"
                                      onClick={() => openImageViewer(allImages, imageIndex)}
                                    />
                                  )
                                })}
                              </div>
                            ) : null}
                          </CardContent>
                        </Card>
                      ))
                    ) : (
                      <Card className="border-dashed">
                        <CardContent className="py-16 text-center">
                          <p className="text-gray-500 text-base">
                            Chưa có bài viết nào cho chuyến đi này.
                          </p>
                        </CardContent>
                      </Card>
                    )}
                  </div>
                </div>
              </TabsContent>

              {/* <TabsContent value="map" className="space-y-6">
                <ReadOnlyMapsTab tripId={trip.id} />
              </TabsContent> */}
            </Tabs>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Owner Info */}
            {/* <Card>
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
                  </div>
                </div>
                <p className="text-sm text-gray-600 mb-4 line-clamp-4">{trip.owner.bio}</p>
              </CardContent>
            </Card> */}

            {/* Người đã chi tiền */}
            {trip.expenseDetails && trip.expenseDetails.length > 0 && (() => {
              // Lấy danh sách unique những người đã chi tiền
              const uniqueSpenders = Array.from(
                new Map(
                  trip.expenseDetails
                    .filter((detail) => detail.nguoi_chi && detail.avatar_url)
                    .map((detail) => [
                      detail.nguoi_chi,
                      {
                        name: detail.nguoi_chi,
                        avatar: detail.avatar_url,
                      },
                    ])
                ).values()
              )
              
              if (uniqueSpenders.length === 0) return null

              return (
                <Card>
                  <CardHeader>
                    <CardTitle>Chủ chuyến đi</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {uniqueSpenders.map((spender, index) => (
                        <div key={index} className="flex items-center gap-3">
                          <Avatar className="h-10 w-10">
                            <AvatarImage 
                              src={spender.avatar || DEFAULT_AVATAR} 
                              alt={spender.name || "Người dùng"} 
                            />
                            <AvatarFallback>
                              {(spender.name || "N")[0].toUpperCase()}
                            </AvatarFallback>
                            
                          </Avatar>
                          <div className="flex-1">
                            <h4 className="font-medium text-sm">{spender.name || "Người dùng"}</h4>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )
            })()}

            {/* hành động */}
            {/* <Card>
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
            </Card> */}

            {/* Thống kê*/}
            {/* <Card>
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
            </Card> */}

            <Card>
              <CardHeader>
                <CardTitle>Thông tin chuyến đi</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                {/* <div className="flex justify-between">
                  <span className="text-gray-600">ID chuyến đi:</span>
                  <span className="font-semibold">{trip.rawInfo.chuyen_di_id}</span>
                </div> */}
                <div className="flex justify-between">
                  <span className="text-gray-600">Địa điểm đến:</span>
                  <span className="font-semibold">{trip.rawInfo.dia_diem_den || "Chưa cập nhật"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Trạng thái:</span>
                  <span className="font-semibold">{formatTrangThai(trip.rawInfo.trang_thai)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Tạo lúc:</span>
                  <span className="font-semibold">{formatDateDisplay(trip.rawInfo.tao_luc)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Chế độ:</span>
                  <span className="font-semibold">{trip.rawInfo.cong_khai ? "Công khai" : "Riêng tư"}</span>
                </div>
                {/* <div className="flex justify-between">
                  <span className="text-gray-600">Tiền tệ:</span>
                  <span className="font-semibold">{trip.rawInfo.tien_te || "VNĐ"}</span>
                </div> */}
                <div className="flex justify-between">
                  <span className="text-gray-600">Tổng chi phí:</span>
                  <span className="font-semibold">{trip.totalExpense || formatCurrencyValue(trip.expenses?.total || 0, trip.rawInfo.tien_te)}</span>
                </div>
                {/* <div className="flex justify-between">
                  <span className="text-gray-600">Chủ sở hữu ID:</span>
                  <span className="font-semibold">{trip.rawInfo.chu_so_huu_id}</span>
                </div> */}
              </CardContent>
            </Card>

            {/* Điểm đến */}
            {trip.diem_den && trip.diem_den.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MapPin className="h-5 w-5 text-blue-600" />
                    Điểm đến ({trip.diem_den.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3 max-h-64 overflow-y-auto">
                    {trip.diem_den.map((diem, index) => (
                      <div
                        key={diem.diem_den_id || index}
                        className="flex items-start gap-3 p-3 rounded-lg border border-gray-200 bg-gray-50/50 hover:bg-gray-100/50 transition-colors"
                      >
                        <div className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-600 text-white font-bold text-xs flex-shrink-0">
                          {diem.thu_tu || index + 1}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-semibold text-sm text-gray-900 truncate">
                            {diem.ten_diem_den || `Điểm đến ${index + 1}`}
                          </h4>
                          {diem.ngay_du_kien !== null && diem.ngay_du_kien !== undefined && (
                            <p className="text-xs text-gray-500 mt-1">
                              Ngày {diem.ngay_du_kien}
                            </p>
                          )}
                          {diem.ghi_chu && (
                            <p className="text-xs text-gray-600 mt-1 line-clamp-2">
                              {diem.ghi_chu}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Khoảnh khắc */}
            {/* <Card>
              <CardHeader>
                <CardTitle>Khoảnh khắc</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {trip.posts.length ? (
                  trip.posts.slice(0, 3).map((post) => (
                    <div key={post.bai_viet_id} className="border border-gray-100 rounded-lg p-3 space-y-2">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={post.avatar_url || DEFAULT_AVATAR} alt={post.ho_ten || "Người dùng"} />
                          <AvatarFallback>{post.ho_ten?.[0] || "U"}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="text-sm font-semibold text-gray-900">{post.ho_ten || "Người dùng"}</p>
                          <p className="text-xs text-gray-500">{formatDateDisplay(post.tao_luc)}</p>
                        </div>
                      </div>
                      <p className="text-sm text-gray-700 line-clamp-3">{post.noi_dung || "Chưa có nội dung chia sẻ."}</p>
                      {post.anh_chinh && (
                        <img
                          src={post.anh_chinh}
                          alt={post.noi_dung || "Ảnh bài viết"}
                          className="w-full h-32 object-cover rounded-md border"
                        />
                      )}
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-gray-600">Chưa có bài viết nào cho chuyến đi này.</p>
                )}
              </CardContent>
            </Card> */}
            <Card className="overflow-hidden">
              <CardHeader className="pb-3 bg-gray-50/50 border-b">
                <CardTitle className="text-lg font-bold text-gray-900">Bài viết</CardTitle>
              </CardHeader>

              <CardContent className="p-0">
                {/* Container cuộn – thu nhỏ chiều cao và thanh cuộn đẹp */}
                <div className="max-h-64 overflow-y-auto overflow-x-hidden">  {/* Thu nhỏ từ max-h-96 thành max-h-64 */}
                  <div
                    className="px-6 py-5 space-y-6"
                    // Tailwind + inline style để thanh cuộn mỏng + đẹp + đúng chiều dài
                    style={{
                      scrollbarWidth: "thin",
                      scrollbarColor: "#9ca3af transparent"
                    }}
                  >
                    {trip.posts.length ? (
                      trip.posts.slice(0, 3).map((post) => (
                        <div
                          key={post.bai_viet_id}
                          className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm hover:shadow-md transition-all duration-200"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <Avatar className="h-9 w-9 ring-2 ring-white shadow">
                                <AvatarImage src={post.avatar_url || DEFAULT_AVATAR} />
                                <AvatarFallback className="text-xs font-medium">
                                  {post.ho_ten?.[0] || "U"}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <p className="text-sm font-semibold text-gray-900">{post.ho_ten || "Người dùng"}</p>
                                <p className="text-xs text-gray-500">
                                  {formatDateDisplay(post.tao_luc)}
                                  {post.diem_den && (
                                    <span className="ml-2 text-blue-600">
                                      • {post.diem_den.ten_diem_den}
                                    </span>
                                  )}
                                </p>
                              </div>
                            </div>
                            {post.luot_thich !== null && post.luot_thich !== undefined && (
                              <div className="flex items-center gap-1 text-xs text-gray-600">
                                <Heart className="h-3.5 w-3.5 text-red-500 fill-red-500" />
                                <span>{post.luot_thich}</span>
                              </div>
                            )}
                          </div>

                          <p className="mt-3 text-sm text-gray-700 leading-relaxed line-clamp-3">
                            {post.noi_dung || "Chưa có nội dung chia sẻ."}
                          </p>

                          {post.anh_chinh && (
                            <img
                              src={post.anh_chinh}
                              alt="Khoảnh khắc"
                              className="mt-3 w-full h-48 object-cover rounded-lg border border-gray-200 shadow-sm"
                            />
                          )}
                        </div>
                      ))
                    ) : (
                      <div className="py-20 text-center">
                        <p className="text-gray-500 text-sm">Chưa có bài viết nào cho chuyến đi này.</p>
                      </div>
                    )}
                  </div>

                  {/* Thanh cuộn đẹp cho Chrome/Safari/Edge */}
                  <style jsx>{`
        div::-webkit-scrollbar {
          width: 7px;
        }
        div::-webkit-scrollbar-track {
          background: transparent;
        }
        div::-webkit-scrollbar-thumb {
          background-color: #9ca3af;
          border-radius: 4px;
          border: 2px solid transparent;
          background-clip: content-box;
        }
        div::-webkit-scrollbar-thumb:hover {
          background-color: #6b7280;
        }
      `}</style>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Image Viewer Modal */}
      <Dialog open={imageViewer.isOpen} onOpenChange={(open) => !open && closeImageViewer()}>
        <DialogContent className="max-w-[95vw] w-full h-[95vh] p-0 bg-black/95 border-none">
          <div className="relative w-full h-full flex items-center justify-center overflow-hidden">
            {/* Close Button */}
            <button
              onClick={closeImageViewer}
              className="absolute top-4 right-4 z-50 p-2 rounded-full bg-black/50 hover:bg-black/70 text-white transition-colors"
              aria-label="Đóng"
            >
              <X className="h-6 w-6" />
            </button>

            {/* Previous Button */}
            {imageViewer.images.length > 1 && (
              <button
                onClick={prevImage}
                className="absolute left-4 z-50 p-3 rounded-full bg-black/50 hover:bg-black/70 text-white transition-colors"
                aria-label="Ảnh trước"
              >
                <ChevronLeft className="h-6 w-6" />
              </button>
            )}

            {/* Image Container - Đảm bảo ảnh hiển thị đầy đủ */}
            {imageViewer.images[imageViewer.currentIndex] && (
              <div className="w-full h-full flex items-center justify-center p-4">
                <img
                  src={imageViewer.images[imageViewer.currentIndex]}
                  alt={`Ảnh ${imageViewer.currentIndex + 1}`}
                  className="max-w-full max-h-full w-auto h-auto object-contain"
                  style={{ maxWidth: '100%', maxHeight: '100%' }}
                />
              </div>
            )}

            {/* Next Button */}
            {imageViewer.images.length > 1 && (
              <button
                onClick={nextImage}
                className="absolute right-4 z-50 p-3 rounded-full bg-black/50 hover:bg-black/70 text-white transition-colors"
                aria-label="Ảnh sau"
              >
                <ChevronRight className="h-6 w-6" />
              </button>
            )}

            {/* Image Counter */}
            {imageViewer.images.length > 1 && (
              <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 px-4 py-2 rounded-full bg-black/50 text-white text-sm">
                {imageViewer.currentIndex + 1} / {imageViewer.images.length}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
