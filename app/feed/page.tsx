"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { useRouter } from "next/navigation"
import axios from "axios"
import Cookies from "js-cookie"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Search, MapPin, Calendar, Users, Eye, Download, Star, Loader2, MoreVertical, Flag, Home } from "lucide-react"
import { motion } from "framer-motion"
import Link from "next/link"
import { toast } from "sonner"

// Interface cho trip từ API (cho phép null/undefined)
interface TripFromAPI {
  chuyen_di_id: number
  ten_chuyen_di: string | null
  mo_ta: string | null
  url_avt: string | null
  dia_diem_xuat_phat: string | null
  dia_diem_den?: string | null
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
  da_thich?: boolean
  tong_luot_thich?: number
  tong_chi_phi?: string | number | null
  chi_phi?: {
    tong_chi_phi?: string | number | null
  } | null
  // Các trường từ API kham-pha
  ten_chu_so_huu?: string | null
  avatar_url?: string | null
  avatar_chu_so_huu?: string | null
  so_thanh_vien?: number | null
  so_ngay?: number | null
  diem_den?: DiemDen[] | null
  // Các trường từ API hot
  thoi_gian_tao?: string | null
  diem_hot_tong_hop?: string | null
}

// Interface cho điểm đến
interface DiemDen {
  ten_diem_den: string
  tong_ngay: number
  ngay_dau?: number
  ngay_cuoi?: number
}

// Interface cho trip hiển thị
interface DisplayTrip {
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
  }
  coverImage: string
  highlights: string[]
  budget: string
  totalExpense: string
  isVerified: boolean
  da_thich: boolean
  tong_luot_thich: number
  so_ngay: number
  tao_luc: string
  diem_den: DiemDen[]
  diem_hot_tong_hop?: string
}

export default function PublicFeedPage() {
  const router = useRouter()
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedFilter, setSelectedFilter] = useState("all")
  const [trips, setTrips] = useState<DisplayTrip[]>([])
  const [filteredTrips, setFilteredTrips] = useState<DisplayTrip[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [likedTripIds, setLikedTripIds] = useState<Set<string>>(new Set())
  const [showReportDialog, setShowReportDialog] = useState(false)
  const [selectedTripId, setSelectedTripId] = useState<string | null>(null)
  const [reportLoai, setReportLoai] = useState<string>("chuyen_di")
  const [reportLyDo, setReportLyDo] = useState<string>("")
  const [isSubmittingReport, setIsSubmittingReport] = useState(false)

  // Tính toán số ngày từ ngày bắt đầu và kết thúc
  const calculateDuration = (startDate: string, endDate: string): string => {
    try {
      const start = new Date(startDate)
      const end = new Date(endDate)

      // Kiểm tra date hợp lệ
      if (isNaN(start.getTime()) || isNaN(end.getTime())) {
        return "Chưa xác định"
      }

      // Đảm bảo tính toán đúng với timezone
      start.setHours(0, 0, 0, 0)
      end.setHours(0, 0, 0, 0)

      const diffTime = end.getTime() - start.getTime()
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1 // +1 để tính cả ngày cuối

      if (diffDays <= 0) {
        return "1 ngày"
      }

      const nights = diffDays - 1
      if (nights === 0) {
        return "1 ngày"
      }

      return `${diffDays} ngày ${nights} đêm`
    } catch (error) {
      console.error("Lỗi khi tính duration:", error)
      return "Chưa xác định"
    }
  }

  // Format ngân sách
  const formatBudget = (amount: string | number, currency: string): string => {
    const numAmount = typeof amount === "string" ? parseFloat(amount) : amount
    if (isNaN(numAmount)) return "Chưa cập nhật"
    const formatted = new Intl.NumberFormat("vi-VN").format(numAmount)
    return `${formatted} ${currency}`
  }

  // Map data từ API sang format hiển thị
  const mapTripFromAPI = (trip: TripFromAPI, soNgayFromAPI?: number | null): DisplayTrip => {
    // ✅ Xử lý an toàn với null/undefined
    const moTa = trip.mo_ta || ""
    const ngayBatDau = trip.ngay_bat_dau || new Date().toISOString().split("T")[0]
    const ngayKetThuc = trip.ngay_ket_thuc || ngayBatDau

    // Sử dụng so_ngay từ API nếu có, nếu không thì tính toán
    let duration: string
    let soNgay: number
    if (soNgayFromAPI !== undefined && soNgayFromAPI !== null && soNgayFromAPI > 0) {
      soNgay = soNgayFromAPI
      if (soNgay === 1) {
        duration = "1 ngày"
      } else {
        const nights = soNgay - 1
        duration = `${soNgay} ngày ${nights} đêm`
      }
    } else {
      duration = calculateDuration(ngayBatDau, ngayKetThuc)
      // Tính so_ngay từ duration string hoặc từ dates
      const start = new Date(ngayBatDau)
      const end = new Date(ngayKetThuc)
      if (!isNaN(start.getTime()) && !isNaN(end.getTime())) {
        const diffTime = end.getTime() - start.getTime()
        soNgay = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1
      } else {
        soNgay = 1
      }
    }

    const budget = formatBudget(trip.tong_ngan_sach || 0, trip.tien_te || "VNĐ")
    // Lấy tổng chi phí từ tong_chi_phi hoặc chi_phi.tong_chi_phi
    const tongChiPhi = trip.tong_chi_phi ?? trip.chi_phi?.tong_chi_phi ?? null
    const totalExpense = formatBudget(tongChiPhi || 0, trip.tien_te || "VNĐ")

    // ✅ Tạo tags từ mo_ta (kiểm tra null/undefined trước)
    const tags: string[] = []
    if (moTa) {
      const lowerMoTa = moTa.toLowerCase()
      if (lowerMoTa.includes("biển") || lowerMoTa.includes("beach")) {
        tags.push("Biển")
      }
      if (lowerMoTa.includes("núi") || lowerMoTa.includes("mountain")) {
        tags.push("Núi")
      }
      if (lowerMoTa.includes("văn hóa") || lowerMoTa.includes("culture")) {
        tags.push("Văn hóa")
      }
      if (lowerMoTa.includes("thành phố") || lowerMoTa.includes("city")) {
        tags.push("Thành phố")
      }
    }
    if (tags.length === 0) {
      tags.push("Du lịch")
    }

    // ✅ Tạo highlights từ mo_ta (kiểm tra null/undefined trước)
    const highlights: string[] = []
    if (moTa) {
      const descriptionLines = moTa.split(".").filter((line) => line.trim().length > 0)
      highlights.push(...descriptionLines.slice(0, 3).map((line) => line.trim()))
    }
    if (highlights.length === 0) {
      highlights.push("Chuyến đi thú vị")
    }

    return {
      id: String(trip.chuyen_di_id),
      title: trip.ten_chuyen_di || "Chuyến đi không có tên",
      description: moTa || "Chưa có mô tả",
      destination: trip.dia_diem_xuat_phat || "Chưa xác định",
      duration,
      startDate: ngayBatDau,
      endDate: ngayKetThuc,
      memberCount: trip.tong_thanh_vien || trip.so_thanh_vien || 1,
      viewCount: 0, // API không trả về, có thể thêm sau
      rating: 4.5, // API không trả về, có thể thêm sau
      tags,
      owner: {
        name: trip.chu_so_huu_ten || trip.ten_chu_so_huu || "Người dùng",
        avatar: trip.chu_so_huu_avatar || trip.avatar_chu_so_huu || trip.avatar_url || "/placeholder-user.jpg",
      },
      coverImage: trip.url_avt || "/placeholder.svg",
      highlights,
      budget,
      totalExpense,
      isVerified: trip.cong_khai === 1,
      da_thich: trip.da_thich || false,
      tong_luot_thich: trip.tong_luot_thich || 0,
      so_ngay: soNgay,
      tao_luc: trip.thoi_gian_tao || trip.tao_luc || "",
      diem_den: trip.diem_den || [],
      diem_hot_tong_hop: trip.diem_hot_tong_hop || "",
    }
  }

  // Fetch trips từ API
  const fetchTrips = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      // ✅ Kiểm tra token theo yêu cầu
      const token = Cookies.get("token")
      console.log("Token từ cookie:", token)

      if (!token || token === "null" || token === "undefined") {
        console.warn("Không có token → chuyển về /login")
        router.replace("/login")
        return
      }

      // Gọi API lấy danh sách chuyến đi công khai
      const response = await axios.get(
        "https://travel-planner-imdw.onrender.com/api/chuyendi/trang-thai/cong-khai",
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      )

      console.log("✅ API Response:", response.data)

      // Kiểm tra cấu trúc response
      const data = response.data?.danh_sach || response.data?.data || []

      if (!Array.isArray(data)) {
        console.error("❌ Dữ liệu không hợp lệ từ API:", response.data)
        throw new Error("Dữ liệu không hợp lệ từ API")
      }

      console.log(`✅ Nhận được ${data.length} chuyến đi từ API`)

      // Map data từ API sang format hiển thị (với error handling)
      const mappedTrips = data
        .map((trip: any, index: number) => {
          try {
            return mapTripFromAPI(trip)
          } catch (err) {
            console.error(`❌ Lỗi khi map trip ${index}:`, err, trip)
            return null
          }
        })
        .filter((trip: DisplayTrip | null): trip is DisplayTrip => trip !== null)

      // Cập nhật likedTripIds từ các trips đã thích
      const likedIds = new Set(
        mappedTrips
          .filter(trip => trip.da_thich)
          .map(trip => trip.id)
      )
      setLikedTripIds(likedIds)

      setTrips(mappedTrips)
      setFilteredTrips(mappedTrips)
      console.log(`✅ Đã tải và map thành công ${mappedTrips.length} chuyến đi công khai`)
    } catch (error: any) {
      console.error("❌ Lỗi khi tải danh sách chuyến đi:", error)
      setError("Không thể tải danh sách chuyến đi. Vui lòng thử lại sau.")

      if (axios.isAxiosError(error)) {
        if (error.response?.status === 401) {
          toast.error("Phiên đăng nhập đã hết hạn")
          router.replace("/login")
        } else {
          toast.error(error.response?.data?.message || "Có lỗi xảy ra khi tải danh sách chuyến đi")
        }
      } else {
        toast.error("Có lỗi xảy ra khi tải danh sách chuyến đi")
      }
    } finally {
      setLoading(false)
    }
  }, [router])

  // Hàm mở dialog báo cáo
  const openReportDialog = (tripId: string, e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setSelectedTripId(tripId)
    setReportLoai("chuyen_di")
    setReportLyDo("")
    setShowReportDialog(true)
  }

  // Hàm đóng dialog báo cáo
  const closeReportDialog = () => {
    setShowReportDialog(false)
    setSelectedTripId(null)
    setReportLoai("chuyen_di")
    setReportLyDo("")
  }

  // Hàm gửi báo cáo
  const handleSubmitReport = async () => {
    if (!selectedTripId) return
    if (!reportLyDo.trim()) {
      toast.error("Vui lòng nhập lý do báo cáo")
      return
    }

    const token = Cookies.get("token")
    if (!token || token === "null" || token === "undefined") {
      toast.error("Vui lòng đăng nhập để báo cáo")
      router.replace("/login")
      return
    }

    setIsSubmittingReport(true)
    try {
      const response = await axios.post(
        "https://travel-planner-imdw.onrender.com/api/chuyendi/bao-cao",
        {
          loai: reportLoai,
          chuyen_di_id: parseInt(selectedTripId),
          ly_do: reportLyDo.trim(),
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      )

      toast.success(response.data.message || "Báo cáo đã được gửi. Chúng tôi sẽ kiểm tra và xử lý sớm.")
      closeReportDialog()
    } catch (error: any) {
      console.error("Lỗi khi gửi báo cáo:", error)
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 401) {
          toast.error("Phiên đăng nhập đã hết hạn")
          router.replace("/login")
        } else if (error.response?.status === 409) {
          toast.error(error.response?.data?.message || "Bạn đã gửi báo cáo tương tự và đang chờ xử lý.")
        } else {
          toast.error(error.response?.data?.message || "Có lỗi xảy ra khi gửi báo cáo")
        }
      } else {
        toast.error("Có lỗi xảy ra khi gửi báo cáo")
      }
    } finally {
      setIsSubmittingReport(false)
    }
  }

  // Hàm toggle thích/bỏ thích
  const toggleLike = async (tripId: string, currentLikeState: boolean) => {
    try {
      const token = Cookies.get("token")
      if (!token || token === "null" || token === "undefined") {
        toast.error("Vui lòng đăng nhập để thích bài viết")
        router.replace("/login")
        return
      }

      const response = await axios.post(
        `https://travel-planner-imdw.onrender.com/api/chuyendi/${tripId}/thich`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      )

      const { da_thich, tong_luot_thich, message } = response.data

      // Cập nhật likedTripIds
      setLikedTripIds((prev) => {
        const newSet = new Set(prev)
        if (da_thich) {
          newSet.add(tripId)
        } else {
          newSet.delete(tripId)
        }
        return newSet
      })

      // Cập nhật state của trip
      setTrips((prevTrips) =>
        prevTrips.map((trip) =>
          trip.id === tripId
            ? { ...trip, da_thich, tong_luot_thich }
            : trip
        )
      )

      setFilteredTrips((prevTrips) =>
        prevTrips.map((trip) =>
          trip.id === tripId
            ? { ...trip, da_thich, tong_luot_thich }
            : trip
        )
      )

      toast.success(message || (da_thich ? "Đã thích chuyến đi" : "Đã hủy thích chuyến đi"))
    } catch (error: any) {
      console.error("Lỗi khi toggle thích:", error)
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 401) {
          toast.error("Phiên đăng nhập đã hết hạn")
          router.replace("/login")
        } else {
          toast.error(error.response?.data?.message || "Có lỗi xảy ra khi thích bài viết")
        }
      } else {
        toast.error("Có lỗi xảy ra khi thích bài viết")
      }
    }
  }

  // Fetch danh sách chuyến đi Hot (mới)
  const fetchHotTripsNew = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const token = Cookies.get("token")
      if (!token || token === "null" || token === "undefined") {
        console.warn("Không có token → chuyển về /login")
        router.replace("/login")
        return
      }

      // Fetch danh sách chuyến đi đã thích trước để có likedTripIds
      let currentLikedIds = new Set<string>()
      try {
        const likedResponse = await axios.get(
          "https://travel-planner-imdw.onrender.com/api/chuyendi/da-thich",
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          }
        )
        if (Array.isArray(likedResponse.data)) {
          currentLikedIds = new Set(likedResponse.data.map((trip: any) => String(trip.chuyen_di_id)))
          setLikedTripIds(currentLikedIds)
        }
      } catch (likedError) {
        console.warn("Không thể lấy danh sách đã thích, sử dụng likedTripIds hiện tại")
        currentLikedIds = likedTripIds
      }

      // Gọi API hot trips mới
      const response = await axios.get(
        "https://travel-planner-imdw.onrender.com/api/chuyendi/hot",
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      )

      console.log("✅ API Response (Hot Trips New):", response.data)

      const data = Array.isArray(response.data) ? response.data : (response.data?.danh_sach || [])

      // Map data từ API sang format hiển thị
      const mappedTrips = data
        .map((trip: any, index: number) => {
          try {
            // Tạo TripFromAPI từ response của API hot với đầy đủ các trường
            const tripFromAPI: TripFromAPI = {
              chuyen_di_id: trip.chuyen_di_id,
              ten_chuyen_di: trip.ten_chuyen_di,
              mo_ta: trip.mo_ta,
              url_avt: trip.url_avt || null,
              dia_diem_xuat_phat: trip.dia_diem_xuat_phat || null,
              dia_diem_den: trip.dia_diem_den || null,
              ngay_bat_dau: trip.ngay_bat_dau,
              ngay_ket_thuc: trip.ngay_ket_thuc,
              chu_so_huu_id: trip.chu_so_huu_id || 0,
              tien_te: "VNĐ",
              trang_thai: null,
              tong_ngan_sach: null,
              tao_luc: trip.thoi_gian_tao || trip.tao_luc || null,
              cong_khai: 1,
              chu_so_huu_ten: trip.ten_chu_so_huu,
              chu_so_huu_avatar: trip.avatar_chu_so_huu || null,
              tong_thanh_vien: trip.so_thanh_vien,
              tong_luot_thich: trip.tong_luot_thich,
              // Các trường từ API hot
              ten_chu_so_huu: trip.ten_chu_so_huu,
              avatar_chu_so_huu: trip.avatar_chu_so_huu,
              so_thanh_vien: trip.so_thanh_vien,
              so_ngay: trip.so_ngay,
              diem_den: trip.diem_den || null,
              thoi_gian_tao: trip.thoi_gian_tao,
              diem_hot_tong_hop: trip.diem_hot_tong_hop,
            }

            // Truyền so_ngay từ API vào mapTripFromAPI
            const displayTrip = mapTripFromAPI(tripFromAPI, trip.so_ngay)
            const tripId = String(trip.chuyen_di_id)
            
            // Xử lý điểm đến - tính ngày đầu và ngày cuối cho mỗi điểm đến
            const diemDenWithDates: DiemDen[] = []
            if (trip.diem_den && Array.isArray(trip.diem_den) && trip.diem_den.length > 0) {
              let currentDay = 1
              trip.diem_den.forEach((diem: { ten_diem_den: string; tong_ngay: number }) => {
                diemDenWithDates.push({
                  ten_diem_den: diem.ten_diem_den,
                  tong_ngay: diem.tong_ngay,
                  ngay_dau: currentDay,
                  ngay_cuoi: currentDay + diem.tong_ngay - 1,
                })
                currentDay += diem.tong_ngay
              })
            }
            
            // Đảm bảo các trường được set đúng
            return {
              ...displayTrip,
              tong_luot_thich: trip.tong_luot_thich || 0,
              da_thich: currentLikedIds.has(tripId),
              so_ngay: trip.so_ngay || displayTrip.so_ngay,
              diem_den: diemDenWithDates,
              diem_hot_tong_hop: trip.diem_hot_tong_hop || "",
              tao_luc: trip.thoi_gian_tao || displayTrip.tao_luc,
            }
          } catch (err) {
            console.error(`❌ Lỗi khi map trip ${index}:`, err, trip)
            return null
          }
        })
        .filter((trip: DisplayTrip | null): trip is DisplayTrip => trip !== null)

      setTrips(mappedTrips)
      setFilteredTrips(mappedTrips)
      console.log(`✅ Đã tải và map thành công ${mappedTrips.length} chuyến đi hot`)
    } catch (error: any) {
      console.error("❌ Lỗi khi tải danh sách chuyến đi hot:", error)
      setError("Không thể tải danh sách chuyến đi hot. Vui lòng thử lại sau.")

      if (axios.isAxiosError(error)) {
        if (error.response?.status === 401) {
          toast.error("Phiên đăng nhập đã hết hạn")
          router.replace("/login")
        } else {
          toast.error(error.response?.data?.message || "Có lỗi xảy ra khi tải danh sách chuyến đi hot")
        }
      } else {
        toast.error("Có lỗi xảy ra khi tải danh sách chuyến đi hot")
      }
    } finally {
      setLoading(false)
    }
  }, [router, likedTripIds])

  // Fetch danh sách chuyến đi đã thích
  const fetchLikedTrips = useCallback(async () => {
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

      const response = await axios.get(
        "https://travel-planner-imdw.onrender.com/api/chuyendi/da-thich",
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      )

      console.log("✅ API Response (Liked Trips):", response.data)

      // ✅ API trả về object với danh_sach, không phải array trực tiếp
      const data = response.data?.danh_sach || (Array.isArray(response.data) ? response.data : [])
      
      console.log("✅ Danh sách chuyến đi từ API:", data)
      console.log("✅ Số lượng chuyến đi:", data.length)

      // Map data từ API sang format hiển thị
      const mappedTrips = data
        .map((trip: any, index: number) => {
          try {
            // Tạo TripFromAPI từ response của API liked trips với đầy đủ các trường
            const tripFromAPI: TripFromAPI = {
              chuyen_di_id: trip.chuyen_di_id,
              ten_chuyen_di: trip.ten_chuyen_di,
              mo_ta: trip.mo_ta,
              url_avt: trip.url_avt || null,
              dia_diem_xuat_phat: trip.dia_diem_xuat_phat,
              dia_diem_den: trip.dia_diem_den || null,
              ngay_bat_dau: trip.ngay_bat_dau,
              ngay_ket_thuc: trip.ngay_ket_thuc,
              chu_so_huu_id: trip.chu_so_huu_id || 0,
              tien_te: trip.tien_te || "VNĐ",
              trang_thai: trip.trang_thai,
              tong_ngan_sach: null,
              tao_luc: trip.thoi_gian_tao || trip.tao_luc || null,
              cong_khai: trip.cong_khai || 1,
              chu_so_huu_ten: trip.ten_chu_so_huu,
              chu_so_huu_avatar: trip.avatar_chu_so_huu || trip.avatar_url || null,
              tong_thanh_vien: trip.so_thanh_vien,
              tong_luot_thich: trip.tong_luot_thich,
              // Map tong_tien từ API vào tong_chi_phi để hiển thị
              tong_chi_phi: trip.tong_tien || null,
              // Các trường từ API da-thich
              ten_chu_so_huu: trip.ten_chu_so_huu,
              avatar_chu_so_huu: trip.avatar_chu_so_huu,
              so_thanh_vien: trip.so_thanh_vien,
              so_ngay: trip.so_ngay,
              diem_den: trip.diem_den || null,
              thoi_gian_tao: trip.thoi_gian_tao,
            }

            // Truyền so_ngay từ API vào mapTripFromAPI
            const displayTrip = mapTripFromAPI(tripFromAPI, trip.so_ngay)
            const tripId = String(trip.chuyen_di_id)
            
            // Xử lý điểm đến - tính ngày đầu và ngày cuối cho mỗi điểm đến
            const diemDenWithDates: DiemDen[] = []
            if (trip.diem_den && Array.isArray(trip.diem_den) && trip.diem_den.length > 0) {
              let currentDay = 1
              trip.diem_den.forEach((diem: { ten_diem_den: string; tong_ngay: number | null }) => {
                const tongNgay = diem.tong_ngay || 1
                diemDenWithDates.push({
                  ten_diem_den: diem.ten_diem_den,
                  tong_ngay: tongNgay,
                  ngay_dau: currentDay,
                  ngay_cuoi: currentDay + tongNgay - 1,
                })
                currentDay += tongNgay
              })
            }
            
            // Format tong_tien để hiển thị (nếu có)
            const tongTienFormatted = trip.tong_tien 
              ? formatBudget(trip.tong_tien, trip.tien_te || "VNĐ")
              : displayTrip.totalExpense

            // Đảm bảo các trường được set đúng
            return {
              ...displayTrip,
              da_thich: trip.da_thich !== undefined ? trip.da_thich : true,
              tong_luot_thich: trip.tong_luot_thich || 0,
              so_ngay: trip.so_ngay || displayTrip.so_ngay,
              diem_den: diemDenWithDates,
              tao_luc: trip.thoi_gian_tao || displayTrip.tao_luc,
              totalExpense: tongTienFormatted, // Cập nhật totalExpense từ tong_tien
            }
          } catch (err) {
            console.error(`❌ Lỗi khi map trip ${index}:`, err, trip)
            return null
          }
        })
        .filter((trip: DisplayTrip | null): trip is DisplayTrip => trip !== null)

      console.log("✅ Mapped trips:", mappedTrips)
      console.log("✅ Số lượng trips sau khi map:", mappedTrips.length)

      setTrips(mappedTrips)
      setFilteredTrips(mappedTrips)

      // Cập nhật likedTripIds
      const likedIds = new Set<string>(mappedTrips.map((trip: DisplayTrip) => trip.id))
      setLikedTripIds(likedIds)

      console.log(`✅ Đã tải và map thành công ${mappedTrips.length} chuyến đi đã thích`)
      console.log(`✅ Liked trip IDs:`, Array.from(likedIds))
    } catch (error: any) {
      console.error("❌ Lỗi khi tải danh sách chuyến đi đã thích:", error)
      setError("Không thể tải danh sách chuyến đi đã thích. Vui lòng thử lại sau.")

      if (axios.isAxiosError(error)) {
        if (error.response?.status === 401) {
          toast.error("Phiên đăng nhập đã hết hạn")
          router.replace("/login")
        } else if (error.response?.status === 404) {
          // Không có chuyến đi nào đã thích
          setTrips([])
          setFilteredTrips([])
        } else {
          toast.error(error.response?.data?.message || "Có lỗi xảy ra khi tải danh sách chuyến đi đã thích")
        }
      } else {
        toast.error("Có lỗi xảy ra khi tải danh sách chuyến đi đã thích")
      }
    } finally {
      setLoading(false)
    }
  }, [router])

  // Fetch chuyến đi hot/phổ biến
  const fetchHotTrips = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const token = Cookies.get("token")
      if (!token || token === "null" || token === "undefined") {
        console.warn("Không có token → chuyển về /login")
        router.replace("/login")
        return
      }

      // Fetch danh sách chuyến đi đã thích trước để có likedTripIds
      let currentLikedIds = new Set<string>()
      try {
        const likedResponse = await axios.get(
          "https://travel-planner-imdw.onrender.com/api/chuyendi/da-thich",
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          }
        )
        if (Array.isArray(likedResponse.data)) {
          currentLikedIds = new Set(likedResponse.data.map((trip: any) => String(trip.chuyen_di_id)))
          setLikedTripIds(currentLikedIds)
        }
      } catch (likedError) {
        console.warn("Không thể lấy danh sách đã thích, sử dụng likedTripIds hiện tại")
        currentLikedIds = likedTripIds
      }

      const response = await axios.get(
        "https://travel-planner-imdw.onrender.com/api/chuyendi/kham-pha",
        {
          params: {
            limit: 20,
          },
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      )

      console.log("✅ API Response (Hot Trips):", response.data)

      // Xử lý response mới với message, tong_so, danh_sach
      const responseData = response.data
      const data = responseData?.danh_sach || (Array.isArray(responseData) ? responseData : [])
      const tongSo = responseData?.tong_so || data.length

      console.log(`✅ Nhận được ${data.length} chuyến đi từ API (Tổng số: ${tongSo})`)

      // Map data từ API sang format hiển thị
      const mappedTrips = data
        .map((trip: any, index: number) => {
          try {
            // Tạo TripFromAPI từ response của API kham-pha với đầy đủ các trường
            const tripFromAPI: TripFromAPI = {
              chuyen_di_id: trip.chuyen_di_id,
              ten_chuyen_di: trip.ten_chuyen_di,
              mo_ta: trip.mo_ta,
              url_avt: trip.url_avt || null,
              dia_diem_xuat_phat: trip.dia_diem_xuat_phat || null,
              dia_diem_den: trip.dia_diem_den || null,
              ngay_bat_dau: trip.ngay_bat_dau,
              ngay_ket_thuc: trip.ngay_ket_thuc,
              chu_so_huu_id: trip.chu_so_huu_id || 0,
              tien_te: "VNĐ", // API không trả về, mặc định VNĐ
              trang_thai: null,
              tong_ngan_sach: null,
              tao_luc: trip.tao_luc,
              cong_khai: 1, // Chuyến đi hot thường là công khai
              chu_so_huu_ten: trip.ten_chu_so_huu,
              chu_so_huu_avatar: trip.avatar_chu_so_huu || trip.avatar_url || null,
              tong_thanh_vien: trip.so_thanh_vien,
              tong_luot_thich: trip.tong_luot_thich,
              // Các trường từ API kham-pha
              ten_chu_so_huu: trip.ten_chu_so_huu,
              avatar_url: trip.avatar_url,
              avatar_chu_so_huu: trip.avatar_chu_so_huu,
              so_thanh_vien: trip.so_thanh_vien,
              so_ngay: trip.so_ngay,
              diem_den: trip.diem_den || null,
            }

            // Truyền so_ngay từ API vào mapTripFromAPI
            const displayTrip = mapTripFromAPI(tripFromAPI, trip.so_ngay)
            const tripId = String(trip.chuyen_di_id)
            
            // Xử lý điểm đến - tính ngày đầu và ngày cuối cho mỗi điểm đến
            const diemDenWithDates: DiemDen[] = []
            if (trip.diem_den && Array.isArray(trip.diem_den) && trip.diem_den.length > 0) {
              let currentDay = 1
              trip.diem_den.forEach((diem: { ten_diem_den: string; tong_ngay: number }) => {
                diemDenWithDates.push({
                  ten_diem_den: diem.ten_diem_den,
                  tong_ngay: diem.tong_ngay,
                  ngay_dau: currentDay,
                  ngay_cuoi: currentDay + diem.tong_ngay - 1,
                })
                currentDay += diem.tong_ngay
              })
            }
            
            // Đảm bảo tong_luot_thich và da_thich được set đúng
            return {
              ...displayTrip,
              tong_luot_thich: trip.tong_luot_thich || 0,
              da_thich: currentLikedIds.has(tripId),
              so_ngay: trip.so_ngay || displayTrip.so_ngay,
              diem_den: diemDenWithDates,
            }
          } catch (err) {
            console.error(`❌ Lỗi khi map trip ${index}:`, err, trip)
            return null
          }
        })
        .filter((trip: DisplayTrip | null): trip is DisplayTrip => trip !== null)

      // Lọc ra các chuyến đi đã thích
      const filteredHotTrips = mappedTrips.filter((trip: DisplayTrip) => !currentLikedIds.has(trip.id))

      setTrips(filteredHotTrips)
      setFilteredTrips(filteredHotTrips)
      console.log(`✅ Đã tải và map thành công ${filteredHotTrips.length} chuyến đi hot (đã loại bỏ ${mappedTrips.length - filteredHotTrips.length} chuyến đi đã thích)`)
    } catch (error: any) {
      console.error("❌ Lỗi khi tải danh sách chuyến đi hot:", error)
      setError("Không thể tải danh sách chuyến đi hot. Vui lòng thử lại sau.")

      if (axios.isAxiosError(error)) {
        if (error.response?.status === 401) {
          toast.error("Phiên đăng nhập đã hết hạn")
          router.replace("/login")
        } else {
          toast.error(error.response?.data?.message || "Có lỗi xảy ra khi tải danh sách chuyến đi hot")
        }
      } else {
        toast.error("Có lỗi xảy ra khi tải danh sách chuyến đi hot")
      }
    } finally {
      setLoading(false)
    }
  }, [router, likedTripIds])

  // Fetch danh sách chuyến đi phổ biến (mới nhất)
  const fetchPopularTrips = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const token = Cookies.get("token")
      if (!token || token === "null" || token === "undefined") {
        console.warn("Không có token → chuyển về /login")
        router.replace("/login")
        return
      }

      // Fetch danh sách chuyến đi đã thích trước để có likedTripIds
      let currentLikedIds = new Set<string>()
      try {
        const likedResponse = await axios.get(
          "https://travel-planner-imdw.onrender.com/api/chuyendi/da-thich",
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          }
        )
        if (Array.isArray(likedResponse.data)) {
          currentLikedIds = new Set(likedResponse.data.map((trip: any) => String(trip.chuyen_di_id)))
          setLikedTripIds(currentLikedIds)
        }
      } catch (likedError) {
        console.warn("Không thể lấy danh sách đã thích, sử dụng likedTripIds hiện tại")
        currentLikedIds = likedTripIds
      }

      // Gọi API chuyến đi phổ biến (mới nhất)
      const response = await axios.get(
        "https://travel-planner-imdw.onrender.com/api/chuyendi/kham-pha/moi-nhat",
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      )

      console.log("✅ API Response (Popular Trips):", response.data)

      // API trả về: { message: "...", tong_so: number, danh_sach: [...] }
      const data = response.data?.danh_sach || []

      if (!Array.isArray(data)) {
        console.error("❌ Dữ liệu không hợp lệ từ API:", response.data)
        throw new Error("Dữ liệu không hợp lệ từ API")
      }

      // Map data từ API sang format hiển thị
      const mappedTrips = data
        .map((trip: any, index: number) => {
          try {
            // Tạo TripFromAPI từ response của API moi-nhat với đầy đủ các trường
            const tripFromAPI: TripFromAPI = {
              chuyen_di_id: trip.chuyen_di_id,
              ten_chuyen_di: trip.ten_chuyen_di,
              mo_ta: trip.mo_ta,
              url_avt: trip.url_avt || null,
              dia_diem_xuat_phat: trip.dia_diem_xuat_phat || null,
              dia_diem_den: null,
              ngay_bat_dau: trip.ngay_bat_dau,
              ngay_ket_thuc: trip.ngay_ket_thuc,
              chu_so_huu_id: 0,
              tien_te: "VNĐ",
              trang_thai: trip.trang_thai || null,
              tong_ngan_sach: null,
              tao_luc: trip.thoi_gian_tao || null,
              cong_khai: 1,
              chu_so_huu_ten: trip.ten_chu_so_huu || null,
              chu_so_huu_avatar: trip.avatar_chu_so_huu || null,
              tong_thanh_vien: trip.so_thanh_vien || null,
              tong_luot_thich: trip.tong_luot_thich || 0,
              // Map tong_tien từ API vào tong_chi_phi để hiển thị
              tong_chi_phi: trip.tong_tien || null,
              // Các trường từ API moi-nhat
              ten_chu_so_huu: trip.ten_chu_so_huu,
              avatar_chu_so_huu: trip.avatar_chu_so_huu,
              so_thanh_vien: trip.so_thanh_vien,
              so_ngay: trip.so_ngay,
              diem_den: trip.diem_den || null,
              thoi_gian_tao: trip.thoi_gian_tao,
            }

            // Truyền so_ngay từ API vào mapTripFromAPI
            const displayTrip = mapTripFromAPI(tripFromAPI, trip.so_ngay)
            const tripId = String(trip.chuyen_di_id)
            
            // Xử lý điểm đến - tính ngày đầu và ngày cuối cho mỗi điểm đến
            const diemDenWithDates: DiemDen[] = []
            if (trip.diem_den && Array.isArray(trip.diem_den) && trip.diem_den.length > 0) {
              let currentDay = 1
              trip.diem_den.forEach((diem: { ten_diem_den: string; tong_ngay: number | null }) => {
                const tongNgay = diem.tong_ngay || 1
                diemDenWithDates.push({
                  ten_diem_den: diem.ten_diem_den,
                  tong_ngay: tongNgay,
                  ngay_dau: currentDay,
                  ngay_cuoi: currentDay + tongNgay - 1,
                })
                currentDay += tongNgay
              })
            }
            
            // Format tong_tien để hiển thị (nếu có)
            const tongTienFormatted = trip.tong_tien 
              ? formatBudget(trip.tong_tien, "VNĐ")
              : displayTrip.totalExpense
            
            // Đảm bảo các trường được set đúng
            return {
              ...displayTrip,
              tong_luot_thich: trip.tong_luot_thich || 0,
              da_thich: currentLikedIds.has(tripId),
              so_ngay: trip.so_ngay || displayTrip.so_ngay,
              diem_den: diemDenWithDates,
              tao_luc: trip.thoi_gian_tao || displayTrip.tao_luc,
              totalExpense: tongTienFormatted, // Cập nhật totalExpense từ tong_tien
            }
          } catch (err) {
            console.error(`❌ Lỗi khi map trip ${index}:`, err, trip)
            return null
          }
        })
        .filter((trip: DisplayTrip | null): trip is DisplayTrip => trip !== null)

      setTrips(mappedTrips)
      setFilteredTrips(mappedTrips)
      console.log(`✅ Đã tải và map thành công ${mappedTrips.length} chuyến đi phổ biến`)
    } catch (error: any) {
      console.error("❌ Lỗi khi tải danh sách chuyến đi phổ biến:", error)
      setError("Không thể tải danh sách chuyến đi phổ biến. Vui lòng thử lại sau.")

      if (axios.isAxiosError(error)) {
        if (error.response?.status === 401) {
          toast.error("Phiên đăng nhập đã hết hạn")
          router.replace("/login")
        } else {
          toast.error(error.response?.data?.message || "Có lỗi xảy ra khi tải danh sách chuyến đi phổ biến")
        }
      } else {
        toast.error("Có lỗi xảy ra khi tải danh sách chuyến đi phổ biến")
      }
    } finally {
      setLoading(false)
    }
  }, [router, likedTripIds])

  // Fetch danh sách chuyến đi liên quan
  const fetchRelatedTrips = useCallback(async (chuyenDiId?: string) => {
    setLoading(true)
    setError(null)

    try {
      const token = Cookies.get("token")
      console.log("Token từ cookie:", token)
      
      if (!token || token === "null" || token === "undefined") {
        console.warn("Không có token → chuyển về /login")
        router.replace("/login")
        return
      }

      // Nếu không có chuyen_di_id, lấy từ chuyến đi đầu tiên trong danh sách hiện tại
      let tripId = chuyenDiId
      if (!tripId && trips.length > 0) {
        tripId = trips[0].id
      }

      // Nếu vẫn không có, hiển thị thông báo
      if (!tripId) {
        toast.error("Vui lòng chọn một chuyến đi để xem chuyến đi liên quan")
        setLoading(false)
        return
      }

      // Gọi API chuyến đi liên quan
      const response = await axios.get(
        `https://travel-planner-imdw.onrender.com/api/chuyendi/${tripId}/lien-quan`,
        {
          params: {
            limit: 10,
          },
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      )

      console.log("✅ API Response (Related Trips):", response.data)

      // API trả về: { message: "...", tong_so: number, danh_sach: [...] }
      const data = response.data?.danh_sach || []

      if (!Array.isArray(data)) {
        console.error("❌ Dữ liệu không hợp lệ từ API:", response.data)
        throw new Error("Dữ liệu không hợp lệ từ API")
      }

      // Map data từ API sang format hiển thị
      const mappedTrips = data
        .map((trip: any, index: number) => {
          try {
            // Tạo TripFromAPI từ response của API lien-quan với đầy đủ các trường
            const tripFromAPI: TripFromAPI = {
              chuyen_di_id: trip.chuyen_di_id,
              ten_chuyen_di: trip.ten_chuyen_di,
              mo_ta: trip.mo_ta,
              url_avt: null,
              dia_diem_xuat_phat: trip.dia_diem_xuat_phat || null,
              dia_diem_den: null,
              ngay_bat_dau: trip.ngay_bat_dau,
              ngay_ket_thuc: trip.ngay_ket_thuc,
              chu_so_huu_id: 0,
              tien_te: "VNĐ",
              trang_thai: null,
              tong_ngan_sach: null,
              tao_luc: trip.thoi_gian_tao || null,
              cong_khai: 1,
              chu_so_huu_ten: trip.ten_chu_so_huu || null,
              chu_so_huu_avatar: trip.avatar_chu_so_huu || null,
              tong_thanh_vien: trip.so_thanh_vien || null,
              tong_luot_thich: trip.tong_luot_thich || 0,
              // Map tong_tien từ API vào tong_chi_phi để hiển thị
              tong_chi_phi: trip.tong_tien || null,
              // Các trường từ API lien-quan
              ten_chu_so_huu: trip.ten_chu_so_huu,
              avatar_chu_so_huu: trip.avatar_chu_so_huu,
              so_thanh_vien: trip.so_thanh_vien,
              so_ngay: trip.so_ngay,
              diem_den: trip.diem_den || null,
              thoi_gian_tao: trip.thoi_gian_tao,
            }

            // Truyền so_ngay từ API vào mapTripFromAPI
            const displayTrip = mapTripFromAPI(tripFromAPI, trip.so_ngay)
            const tripIdStr = String(trip.chuyen_di_id)
            
            // Xử lý điểm đến
            const diemDenWithDates: DiemDen[] = []
            if (trip.diem_den && Array.isArray(trip.diem_den) && trip.diem_den.length > 0) {
              let currentDay = 1
              trip.diem_den.forEach((diem: { ten_diem_den: string; tong_ngay: number | null }) => {
                const tongNgay = diem.tong_ngay || 1
                diemDenWithDates.push({
                  ten_diem_den: diem.ten_diem_den,
                  tong_ngay: tongNgay,
                  ngay_dau: currentDay,
                  ngay_cuoi: currentDay + tongNgay - 1,
                })
                currentDay += tongNgay
              })
            }
            
            // Format tong_tien để hiển thị (nếu có)
            const tongTienFormatted = trip.tong_tien 
              ? formatBudget(trip.tong_tien, "VNĐ")
              : displayTrip.totalExpense
            
            // Đảm bảo các trường được set đúng
            return {
              ...displayTrip,
              tong_luot_thich: trip.tong_luot_thich || 0,
              da_thich: trip.da_thich || false,
              so_ngay: trip.so_ngay || displayTrip.so_ngay,
              diem_den: diemDenWithDates,
              tao_luc: trip.thoi_gian_tao || displayTrip.tao_luc,
              totalExpense: tongTienFormatted, // Cập nhật totalExpense từ tong_tien
            }
          } catch (err) {
            console.error(`❌ Lỗi khi map trip ${index}:`, err, trip)
            return null
          }
        })
        .filter((trip: DisplayTrip | null): trip is DisplayTrip => trip !== null)

      setTrips(mappedTrips)
      setFilteredTrips(mappedTrips)
      console.log(`✅ Đã tải và map thành công ${mappedTrips.length} chuyến đi liên quan`)
    } catch (error: any) {
      console.error("❌ Lỗi khi tải danh sách chuyến đi liên quan:", error)
      setError("Không thể tải danh sách chuyến đi liên quan. Vui lòng thử lại sau.")

      if (axios.isAxiosError(error)) {
        if (error.response?.status === 401) {
          toast.error("Phiên đăng nhập đã hết hạn")
          router.replace("/login")
        } else if (error.response?.status === 404) {
          toast.error("Không tìm thấy chuyến đi")
        } else {
          toast.error(error.response?.data?.message || "Có lỗi xảy ra khi tải danh sách chuyến đi liên quan")
        }
      } else {
        toast.error("Có lỗi xảy ra khi tải danh sách chuyến đi liên quan")
      }
    } finally {
      setLoading(false)
    }
  }, [router, trips])

  // Fetch trips khi component mount hoặc khi filter thay đổi
  useEffect(() => {
    if (selectedFilter === "liked") {
      fetchHotTripsNew() // Gọi API hot mới khi chọn filter "Hot"
    } else if (selectedFilter === "popular") {
      fetchPopularTrips() // Gọi API phổ biến (mới nhất)
    } else if (selectedFilter === "recent") {
      fetchLikedTrips() // Gọi API chuyến đi đã thích khi chọn filter "Đã thích"
    } else if (selectedFilter === "all") {
      // Khi chọn "Chuyến đi liên quan", cần có trips trước
      // Nếu chưa có trips, fetch trips thông thường trước
      if (trips.length === 0) {
        // Fetch trips trước, sau đó sẽ gọi fetchRelatedTrips trong useEffect khác
        fetchTrips()
      } else {
        // Nếu đã có trips, gọi fetchRelatedTrips với chuyen_di_id từ trip đầu tiên
        fetchRelatedTrips(trips[0].id)
      }
    } else {
      fetchTrips()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedFilter])

  // Khi trips thay đổi từ 0 thành > 0 và selectedFilter === "all", gọi fetchRelatedTrips
  // Sử dụng useRef để tránh gọi lại khi trips thay đổi từ fetchRelatedTrips
  const prevTripsLengthRef = useRef(0)
  useEffect(() => {
    if (
      selectedFilter === "all" && 
      trips.length > 0 && 
      prevTripsLengthRef.current === 0 &&
      !loading
    ) {
      // Chỉ gọi khi trips.length thay đổi từ 0 thành > 0 (từ fetchTrips)
      const firstTripId = trips[0]?.id
      if (firstTripId) {
        fetchRelatedTrips(firstTripId)
      }
    }
    prevTripsLengthRef.current = trips.length
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [trips.length, selectedFilter, loading])

  // Filter trips khi searchTerm hoặc selectedFilter thay đổi
  useEffect(() => {
    let filtered = trips

    // Filter by search term
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase()
      filtered = filtered.filter((trip) => {
        try {
          return (
            (trip.title || "").toLowerCase().includes(searchLower) ||
            (trip.destination || "").toLowerCase().includes(searchLower) ||
            trip.tags.some((tag) => (tag || "").toLowerCase().includes(searchLower)) ||
            (trip.description || "").toLowerCase().includes(searchLower)
          )
        } catch (error) {
          console.error("Lỗi khi filter trip:", error)
          return false
        }
      })
    }

    // Filter by category (skip if "liked" or "popular" because we already fetch filtered trips)
    if (selectedFilter !== "all" && selectedFilter !== "liked" && selectedFilter !== "popular") {
      filtered = filtered.filter((trip) => {
        try {
          switch (selectedFilter) {
            case "verified":
              return trip.isVerified
            case "recent":
              // Lọc các chuyến đi có ngày bắt đầu trong 30 ngày gần đây
              if (!trip.startDate) return false
              const thirtyDaysAgo = new Date()
              thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
              const startDate = new Date(trip.startDate)
              return !isNaN(startDate.getTime()) && startDate > thirtyDaysAgo
            default:
              return true
          }
        } catch (error) {
          console.error("Lỗi khi filter trip by category:", error)
          return false
        }
      })
    }

    setFilteredTrips(filtered)
  }, [searchTerm, selectedFilter, trips])

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-50 to-blue-50">
      {/* Header */}
      {/* <div className="bg-white border-b border-blue-100 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link href="/" className="text-2xl font-bold text-blue-600">
                TravelPlan
              </Link>
              <Badge variant="secondary" className="bg-blue-100 text-blue-700">
                Bản Tin Công Khai
              </Badge>
            </div>
            <div className="flex items-center space-x-4">
              <Link href="/dashboard">
                <Button variant="outline" className="border-blue-200 text-blue-600 hover:bg-blue-50">
                  Về Trang Chủ
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div> */}

      {/* Hero Section */}
      <div
        className="relative text-white py-13 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: "url('/gg1.jpg')",
        }}
      >
        <div className="absolute inset-0 bg-black/50" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center z-10">
          <motion.h1
            className="text-5xl md:text-6xl font-bold mb-4"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
          >
            Khám Phá Chuyến Đi
          </motion.h1>
          <motion.p
            className="text-xl md:text-2xl mb-8 text-blue-100 font-light"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.2 }}
          >
            Hàng ngàn lịch trình tuyệt vời từ VN-Travel
          </motion.p>
        </div>
      </div>

      {/* Sticky Search & Filter Bar - Chỉ bo tròn phần này */}
      <div className="sticky top-0 z-40 backdrop-blur-xl shadow-sm border-b border-gray-200/30 bg-white/50 rounded-b-3xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">

          {/* CĂN GIỮA TOÀN BỘ - Giữ nguyên layout cũ */}
          <div className="flex justify-center">
            <div className="w-full max-w-4xl">

              <div className="flex flex-col sm:flex-row gap-3 items-center">
                {/* Search Input - Bo tròn */}
                <div className="relative flex-1 max-w-xl w-full">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    placeholder="Tìm điểm đến, hoạt động..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 pr-4 h-10 text-sm bg-white/40 border-gray-300/40 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded-2xl placeholder:text-gray-400 backdrop-blur-sm"
                  />
                </div>

                {/* Filter Buttons - Bo tròn */}
                <div className="flex gap-2">
                 

                  <Button
                    variant={selectedFilter === "popular" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSelectedFilter("popular")}
                    className={`
      h-9 px-4 text-sm font-medium rounded-xl 
      border border-gray-300/40 backdrop-blur-sm 
      transition-all duration-300
      ${selectedFilter === "popular"
                        ? "bg-sky-50/80 text-sky-900 shadow-lg shadow-sky-100/60 hover:shadow-xl hover:shadow-sky-200/70 hover:bg-sky-50/90"
                        : "bg-white/40 text-gray-700 hover:bg-white/60 shadow-md hover:shadow-lg"
                      }
    `}
                  >
                    Tất cả
                  </Button>

                  <Button
                    variant={selectedFilter === "liked" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSelectedFilter("liked")}
                    className={`
      h-9 px-4 text-sm font-medium rounded-xl 
      border border-gray-300/40 backdrop-blur-sm 
      transition-all duration-300
      ${selectedFilter === "liked"
                        ? "bg-sky-50/80 text-sky-900 shadow-lg shadow-sky-100/60 hover:shadow-xl hover:shadow-sky-200/70 hover:bg-sky-50/90"
                        : "bg-white/40 text-gray-700 hover:bg-white/60 shadow-md hover:shadow-lg"
                      }
    `}
                  >
                   Hot
                  </Button>
                  <Button
                    variant={selectedFilter === "recent" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSelectedFilter("recent")}
                    className={`
      h-9 px-4 text-sm font-medium rounded-xl 
      border border-gray-300/40 backdrop-blur-sm 
      transition-all duration-300
      ${selectedFilter === "recent"
                        ? "bg-sky-50/80 text-sky-900 shadow-lg shadow-sky-100/60 hover:shadow-xl hover:shadow-sky-200/70 hover:bg-sky-50/90"
                        : "bg-white/40 text-gray-700 hover:bg-white/60 shadow-md hover:shadow-lg"
                      }
    `}
                  >
                    Đã thích
                  </Button>
                  <Button
                    variant={selectedFilter === "all" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSelectedFilter("all")}
                    className={`
     h-9 px-4 text-sm font-medium rounded-xl 
      border border-gray-300/40 backdrop-blur-sm 
      transition-all duration-300
      ${selectedFilter === "all"
                        ? "bg-sky-50/80 text-sky-900 shadow-lg shadow-sky-100/60 hover:shadow-xl hover:shadow-sky-200/70 hover:bg-sky-50/90"
                        : "bg-white/40 text-gray-700 hover:bg-white/60 shadow-md hover:shadow-lg"
                      }
    `}
                  >
                    Chuyến đi liên quan
                  </Button>
                  
                  <div className="flex items-center">
                    <Link href="/dashboard" className="group">
                      <Button
                        variant="outline"
                        className="h-9 px-5 text-sm font-medium rounded-xl border border-gray-300/40 bg-white/50 backdrop-blur-sm 
                 text-sky-700 hover:text-sky-800 hover:bg-sky-50/60 hover:border-sky-300/60 
                 shadow-md hover:shadow-lg hover:shadow-sky-100/50 
                 transition-all duration-300 flex items-center gap-2"
                      >
                        {/* Icon nhà - dùng lucide-react, nếu chưa có thì cài: npm install lucide-react */}
                        <Home className="h-4 w-4 group-hover:scale-110 transition-transform duration-200" />
                        <span>Trang Chủ</span>
                      </Button>
                    </Link>
                  </div>
                </div>
                {/* NƠI ĐỂ CODE TRANG CHỦ */}
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* Trip Cards - Giữ nguyên */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Loading State */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="h-12 w-12 animate-spin text-blue-600 mb-4" />
            <p className="text-lg text-gray-600">Đang tải danh sách chuyến đi...</p>
          </div>
        )}

        {/* Error State */}
        {error && !loading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-20"
          >
            <div className="text-red-400 mb-6">
              <Search className="h-20 w-20 mx-auto" />
            </div>
            <h3 className="text-2xl font-bold text-gray-800 mb-3">Có lỗi xảy ra</h3>
            <p className="text-gray-600 text-lg mb-4">{error}</p>
            <Button onClick={() => fetchTrips()} className="bg-blue-600 hover:bg-blue-700">
              Thử lại
            </Button>
          </motion.div>
        )}

        {/* Trip Cards Grid */}
        {!loading && !error && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredTrips.map((trip, index) => (
              <motion.div
                key={trip.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.4, delay: index * 0.05 }}
                className="group"
              >
                <Link href={`/feed/${trip.id}`} className="block h-full">
                  <Card className="h-full overflow-hidden rounded-2xl border-0 shadow-lg hover:shadow-2xl transition-all duration-300 bg-white group-hover:-translate-y-2">
                    {/* Cover Image - Tỉ lệ đẹp hơn */}
                    <div className="relative aspect-[4/3] overflow-hidden bg-gray-100">
                      <img
                        src={trip.coverImage || "/placeholder.svg"}
                        alt={trip.title}
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                      {/* Badge số lượt thích nổi bật - góc trên trái */}
                      {trip.tong_luot_thich > 0 && (
                        <div className="absolute top-3 left-3 z-10">
                          <Badge className="bg-yellow-500/90 backdrop-blur-sm text-white text-xs font-medium px-2 py-1 shadow-md">
                            <Star className="h-3 w-3 mr-1 fill-white" />
                            {trip.tong_luot_thich}
                          </Badge>
                        </div>
                      )}

                      {/* Nút báo cáo - góc trên phải */}
                      <div className="absolute top-3 right-3 z-10">
                        <button
                          onClick={(e) => openReportDialog(trip.id, e)}
                          className="p-2 rounded-full bg-white/80 backdrop-blur-sm hover:bg-white transition z-10 shadow-md"
                          title="Báo cáo chuyến đi"
                        >
                          <MoreVertical className="h-4 w-4 text-gray-600" />
                        </button>
                      </div>

                      {/* Tổng chi phí chuyến đi - chỉ hiển thị khi có giá trị */}
                      {trip.totalExpense && trip.totalExpense !== "Chưa cập nhật VNĐ" && (
                        <div className="absolute bottom-3 left-3 z-10">
                          <span className="bg-blue-600/90 backdrop-blur-sm text-white px-3 py-1.5 rounded-full text-sm font-bold shadow-lg">
                            {trip.totalExpense}
                          </span>
                        </div>
                      )}
                    </div>

                    <CardContent className="p-4 space-y-3">
                      {/* Title - ngắn gọn hơn */}
                      <h3 className="font-bold text-lg text-gray-900 line-clamp-2 leading-tight">
                        {trip.title}
                      </h3>

                      {/* Description - hiển thị mô tả ngắn */}
                      {trip.description && (
                        <p className="text-sm text-gray-600 line-clamp-2">
                          {trip.description}
                        </p>
                      )}

                      {/* Điểm Hot Tổng Hợp - hiển thị nổi bật */}
                      {trip.diem_hot_tong_hop && (
                        <div className="bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-200 rounded-lg px-3 py-2">
                          <div className="flex items-center gap-2">
                            <Star className="h-4 w-4 text-yellow-600 fill-yellow-600" />
                            <span className="text-sm font-semibold text-yellow-800">
                            
                            </span>
                            <span className="text-sm text-yellow-900 flex-1">
                              {trip.diem_hot_tong_hop}
                            </span>
                          </div>
                        </div>
                      )}

                      {/* Destination + Duration - ngang hàng, gọn */}
                      <div className="space-y-2">
                        <div className="flex items-center gap-4 text-sm text-gray-600 flex-wrap">
                          <div className="flex items-center gap-1.5">
                            <MapPin className="h-4 w-4 text-blue-600" />
                            <span className="font-medium">{trip.destination}</span>
                          </div>
                          {trip.so_ngay > 0 && (
                            <Badge variant="secondary" className="text-xs bg-blue-50 text-blue-700">
                              {trip.so_ngay} ngày
                            </Badge>
                          )}
                        </div>
                        {/* Ngày bắt đầu và kết thúc */}
                        {trip.startDate && trip.endDate && (
                          <div className="flex items-center gap-2 text-xs text-gray-500">
                            <Calendar className="h-3.5 w-3.5 text-blue-600" />
                            <span>
                              {new Date(trip.startDate).toLocaleDateString("vi-VN", {
                                day: "2-digit",
                                month: "2-digit",
                              })}
                              {" - "}
                              {new Date(trip.endDate).toLocaleDateString("vi-VN", {
                                day: "2-digit",
                                month: "2-digit",
                                year: "numeric",
                              })}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Điểm đến với ngày đầu và ngày cuối */}
                      {trip.diem_den && trip.diem_den.length > 0 && (
                        <div className="space-y-2 pt-2 border-t border-gray-100">
                          <div className="text-xs font-semibold text-gray-700 uppercase tracking-wide">
                            Điểm đến
                          </div>
                          <div className="space-y-1.5">
                            {trip.diem_den.map((diem: DiemDen, idx: number) => (
                              <div
                                key={idx}
                                className="flex items-center justify-between text-xs bg-blue-50/50 rounded-lg px-2.5 py-1.5"
                              >
                                <span className="font-medium text-gray-800 flex-1">
                                  {diem.ten_diem_den}
                                </span>
                                {diem.ngay_dau !== undefined && diem.ngay_cuoi !== undefined && (
                                  <Badge variant="outline" className="text-xs border-blue-300 text-blue-700 bg-white">
                                     {/* {diem.ngay_dau} */}
                                    {diem.ngay_dau !== diem.ngay_cuoi && `  ${diem.ngay_cuoi}`} Ngày
                                  </Badge>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Owner Info */}
                      <div className="flex items-center gap-2 pt-1">
                        <Avatar className="h-9 w-9 border-2 border-blue-100">
                          <AvatarImage src={trip.owner.avatar} />
                          <AvatarFallback className="text-xs bg-blue-50 text-blue-700">
                            {trip.owner.name[0]?.toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex flex-col flex-1 min-w-0">
                          <span className="text-sm font-semibold text-gray-800 truncate">
                            {trip.owner.name}
                          </span>
                          {trip.tao_luc && (
                            <span className="text-xs text-gray-500">
                              Tạo {new Date(trip.tao_luc).toLocaleDateString("vi-VN", {
                                day: "2-digit",
                                month: "2-digit",
                                year: "numeric",
                              })}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Stats: Thành viên + Lượt thích */}
                      <div className="flex items-center justify-between text-sm pt-2 border-t border-gray-100">
                        <div className="flex items-center gap-1.5 text-gray-600">
                          <Users className="h-4 w-4 text-blue-600" />
                          <span className="font-medium">{trip.memberCount} thành viên</span>
                        </div>

                        {/* Thích button */}
                        <Badge
                          className={`cursor-pointer text-xs font-medium px-3 py-1.5 shadow-md transition-colors duration-200 group ${trip.da_thich
                            ? "bg-yellow-500 text-yellow-50 hover:bg-yellow-600"
                            : "bg-emerald-500 text-white hover:bg-yellow-500 hover:text-yellow-50"
                            }`}
                          onClick={(e) => {
                            e.preventDefault()
                            e.stopPropagation()
                            toggleLike(trip.id, trip.da_thich)
                          }}
                        >
                          <Star className={`h-3 w-3 mr-1 transition-colors duration-200 ${trip.da_thich ? "fill-yellow-200" : "group-hover:fill-yellow-200"}`} />
                          <span>{trip.tong_luot_thich || 0}</span>
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              </motion.div>
            ))}
          </div>
        )}

        {/* No Results */}
        {!loading && !error && filteredTrips.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-20"
          >
            <div className="text-gray-400 mb-6">
              <Search className="h-20 w-20 mx-auto" />
            </div>
            <h3 className="text-2xl font-bold text-gray-800 mb-3">Không tìm thấy lịch trình nào</h3>
            <p className="text-gray-600 text-lg">Thử thay đổi từ khóa hoặc bộ lọc của bạn</p>
          </motion.div>
        )}
      </div>

      {/* Footer */}
      <footer className="bg-white border-t border-blue-100 mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <div className="text-center text-gray-600">
            <p className="text-sm">&copy; 2025 VN-Travel. Tất cả quyền được bảo lưu.</p>
            <p className="text-xs mt-2 text-gray-500">Made with love in Vietnam</p>
          </div>
        </div>
      </footer>

      {/* Dialog Báo Cáo Chuyến Đi */}
      <Dialog open={showReportDialog} onOpenChange={setShowReportDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 justify-center w-full -ml-7">
              <Flag className="h-5 w-5 text-red-500" />
              Báo cáo chuyến đi
            </DialogTitle>
            <DialogDescription>
              Vui lòng cung cấp thông tin về vấn đề bạn gặp phải với chuyến đi này.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Loại báo cáo */}
            <div className="space-y-2">
              <Label htmlFor="loai">Loại báo cáo</Label>
              <Select value={reportLoai} onValueChange={setReportLoai}    >
                <SelectTrigger id="loai" className="w-full h-11 
               border border-gray-300 
               bg-white 
               rounded-xl 
               shadow-sm                                      /* Nổi nhẹ */
               ring-1 ring-gray-200                          /* Viền sáng nhẹ bên trong */
               hover:border-gray-400 hover:ring-gray-300     /* Hover xám đậm hơn chút */
               focus:border-gray-500 focus:ring-gray-400     /* Focus xám rõ + ring đậm */
               focus-visible:outline-none 
               focus-visible:ring-2 focus-visible:ring-gray-500/40 
               transition-all duration-200">
                  <SelectValue placeholder="Chọn loại báo cáo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="chuyen_di">Báo cáo chuyến đi</SelectItem>
                  <SelectItem value="chi_phi">Báo cáo chi phí</SelectItem>
                  <SelectItem value="bai_viet">Báo cáo bài viết</SelectItem>
                  <SelectItem value="nguoi_dung">Báo cáo người dùng</SelectItem>
                  <SelectItem value="khac">Khác</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Lý do báo cáo */}
            <div className="space-y-2">
              <Label htmlFor="ly_do">Lý do báo cáo *</Label>
              <Textarea
                id="ly_do"
                placeholder="Vui lòng mô tả chi tiết lý do bạn báo cáo chuyến đi này..."
                value={reportLyDo}
                onChange={(e) => setReportLyDo(e.target.value)}
                className="min-h-[120px] resize-none 
                border border-gray-300 
                bg-white 
                rounded-xl 
                shadow-sm                                          /* Nổi nhẹ */
                ring-1 ring-gray-200                              /* Viền sáng bên trong */
                hover:border-gray-400 hover:ring-gray-300         /* Hover tinh tế */
                focus-visible:border-gray-500 
                focus-visible:ring-2 focus-visible:ring-gray-500/40 
                focus-visible:outline-none 
                transition-all duration-200 
                placeholder:text-gray-400"
                required
              />
              <p className="text-xs text-gray-500">
                Vui lòng cung cấp thông tin chi tiết để chúng tôi có thể xử lý báo cáo một cách hiệu quả.
              </p>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button
              variant="outline"
              onClick={closeReportDialog}
              disabled={isSubmittingReport}
            >
              Hủy
            </Button>
            <Button
              onClick={handleSubmitReport}
              disabled={isSubmittingReport || !reportLyDo.trim()}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {isSubmittingReport ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Đang gửi...
                </>
              ) : (
                <>
                  <Flag className="h-4 w-4 mr-2" />
                  Gửi báo cáo
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}