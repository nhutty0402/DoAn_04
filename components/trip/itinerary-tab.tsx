"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation" // <-- THÊM
import Cookies from "js-cookie" // <-- THÊM
import axios from "axios" // <-- THÊM
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Plus, Calendar, Clock, MapPin, GripVertical, Edit, Trash2, Pencil, DollarSign, Navigation, FileText } from "lucide-react"
import { AddDayModal } from "@/components/itinerary/add-day-modal"
import { AddPoiModal } from "@/components/itinerary/add-poi-modal"
import { EditPoiModal } from "@/components/itinerary/edit-poi-modal"
import { EditDayModal } from "@/components/itinerary/edit-day-modal"
import { Badge } from "@/components/ui/badge"
import { motion, Reorder } from "framer-motion"
import { useToast } from "@/hooks/use-toast"

// Mock itinerary data
const mockItinerary = [
  // ... (dữ liệu mock không thay đổi) ...
  // {
  //   id: "day1",
  //   ngay: "2024-03-15",
  //   tieuDe: "Ngày 1: Khám phá trung tâm Đà Nẵng",
  //   ghiChu: "Tham quan các điểm nổi tiếng trong thành phố",
  //   pois: [
  //     {
  //       id: "poi1",
  //       tenDiaDiem: "Cầu Rồng",
  //       loaiDiaDiem: "landmark",
  //       gioBatDau: "09:00",
  //       gioKetThuc: "10:30",
  //       ghiChu: "Xem rồng phun lửa vào cuối tuần",
  //       toaDo: { lat: 16.0544, lng: 108.2272 },
  //       thoiGianDiChuyen: 0,
  //     },
  //     {
  //       id: "poi2",
  //       tenDiaDiem: "Chợ Hàn",
  //       loaiDiaDiem: "shopping",
  //       gioBatDau: "11:00",
  //       gioKetThuc: "12:30",
  //       ghiChu: "Mua sắm và ăn trưa",
  //       toaDo: { lat: 16.0678, lng: 108.2208 },
  //       thoiGianDiChuyen: 15,
  //     },
  //     {
  //       id: "poi3",
  //       tenDiaDiem: "Bãi biển Mỹ Khê",
  //       loaiDiaDiem: "beach",
  //       gioBatDau: "15:00",
  //       gioKetThuc: "18:00",
  //       ghiChu: "Tắm biển và ngắm hoàng hôn",
  //       toaDo: { lat: 16.0471, lng: 108.2487 },
  //       thoiGianDiChuyen: 20,
  //     },
  //   ],
  // },
  {
    id: "day2",
    ngay: "2024-03-16",
    tieuDe: "Ngày 2: Hội An cổ kính",
    ghiChu: "Khám phá phố cổ Hội An",
    pois: [
      {
        id: "poi4",
        tenDiaDiem: "Phố cổ Hội An",
        loaiDiaDiem: "historic",
        gioBatDau: "08:00",
        gioKetThuc: "12:00",
        ghiChu: "Tham quan các ngôi nhà cổ",
        toaDo: { lat: 15.8801, lng: 108.338 },
        thoiGianDiChuyen: 45,
      },
    ],
  },
]

interface ItineraryTabProps {
  tripId: string
  tripStartDate?: string
  tripEndDate?: string
}


export function ItineraryTab({ tripId, tripStartDate, tripEndDate }: ItineraryTabProps) {
  const [days, setDays] = useState(mockItinerary)
  const [showAddDayModal, setShowAddDayModal] = useState(false)
  const [showAddPoiModal, setShowAddPoiModal] = useState<string | null>(null)
  const [editingPoi, setEditingPoi] = useState<{ poi: any; dayId: string } | null>(null)
  const [editingDay, setEditingDay] = useState<any>(null)
  const [isAddingDay, setIsAddingDay] = useState(false) // <-- Vẫn giữ state loading
  const [isLoadingDays, setIsLoadingDays] = useState(false) // <-- THÊM LOADING STATE
  const { toast } = useToast()
  const router = useRouter() // <-- THÊM ROUTER

  // <-- THÊM USEEFFECT ĐỂ LOAD DỮ LIỆU KHI COMPONENT MOUNT -->
  useEffect(() => {
    fetchDaysAndPoisFromAPI()
  }, [tripId]) // Chạy lại khi tripId thay đổi

  // <-- FUNCTION FETCH LỊCH TRÌNH THEO ĐIỂM ĐẾN ID -->
  const fetchLichTrinhByDiemDenId = async (diemDenId: string) => {
    const token = Cookies.get("token")

    // Kiểm tra token
    if (!token || token === "null" || token === "undefined") {
      console.warn("Không có token để fetch lịch trình")
      return []
    }

    try {
      // Gọi API GET để lấy lịch trình theo điểm đến ID
      const response = await axios.get(
        `https://travel-planner-imdw.onrender.com/api/lich-trinh-ngay/${diemDenId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      )

      // Backend trả về: [{ thu_tu, lich_trinh_ngay_id, diem_den_id, ngay, tieu_de, ghi_chu, gio_bat_dau, gio_ket_thuc }, ...]
      const apiLichTrinh = Array.isArray(response.data) ? response.data : []

      // Chuyển đổi dữ liệu từ API (snake_case) sang state (camelCase)
      const mappedLichTrinh = apiLichTrinh.map((lichTrinh: any) => ({
        id: String(lichTrinh.lich_trinh_ngay_id || `lich_trinh_${Date.now()}`),
        lich_trinh_ngay_id: lichTrinh.lich_trinh_ngay_id,
        thu_tu: lichTrinh.thu_tu,
        diem_den_id: lichTrinh.diem_den_id,
        ngay: lichTrinh.ngay || "",
        tieu_de: lichTrinh.tieu_de || "",
        ghi_chu: lichTrinh.ghi_chu || "",
        gio_bat_dau: lichTrinh.gio_bat_dau
          ? (typeof lichTrinh.gio_bat_dau === 'string'
            ? lichTrinh.gio_bat_dau.substring(0, 5) // HH:mm:ss -> HH:mm
            : lichTrinh.gio_bat_dau)
          : "",
        gio_ket_thuc: lichTrinh.gio_ket_thuc
          ? (typeof lichTrinh.gio_ket_thuc === 'string'
            ? lichTrinh.gio_ket_thuc.substring(0, 5) // HH:mm:ss -> HH:mm
            : lichTrinh.gio_ket_thuc)
          : "",
      }))

      return mappedLichTrinh
    } catch (error) {
      console.error("Lỗi khi fetch lịch trình:", error)

      // Xử lý lỗi 401
      if (axios.isAxiosError(error) && error.response?.status === 401) {
        toast({
          title: "Phiên đăng nhập hết hạn",
          description: "Token không hợp lệ hoặc đã hết hạn. Vui lòng đăng nhập lại.",
          variant: "destructive",
        })
        router.replace("/login")
      } else if (axios.isAxiosError(error) && error.response?.status === 403) {
        // Không có quyền xem lịch trình - không hiển thị toast, chỉ log
        console.warn("Không có quyền xem lịch trình của điểm đến này")
      } else if (axios.isAxiosError(error) && error.response?.status === 404) {
        // Không tìm thấy điểm đến hoặc không có lịch trình
        console.warn("Không tìm thấy lịch trình cho điểm đến này")
      }

      return [] // Trả về mảng rỗng nếu có lỗi
    }
  }

  // <-- THÊM FUNCTION FETCH ĐIỂM ĐẾN TỪ API -->
  const fetchDiemDenFromAPI = async () => {
    const token = Cookies.get("token")

    // Kiểm tra token
    if (!token || token === "null" || token === "undefined") {
      console.warn("Không có token để fetch điểm đến")
      return []
    }

    try {
      // Gọi API GET để lấy danh sách điểm đến
      const response = await axios.get(
        `https://travel-planner-imdw.onrender.com/api/chuyen-di/${tripId}/diem-den`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      )

      console.log("✅ API Response (Get Diem Den):", response.data)

      // API trả về: { message, data: [...], tong_so }
      const apiDiemDen = response.data?.data || []

      // Chuyển đổi dữ liệu điểm đến thành format "days" để UI vẫn hoạt động
      // Mỗi điểm đến sẽ được hiển thị như một "ngày" trong UI
      const apiDays = apiDiemDen.map((diemDen: any) => {
        // Sử dụng ngày bắt đầu nếu có, nếu không thì dùng ngày kết thúc, nếu không có thì dùng ngày hiện tại
        const ngayHienThi = diemDen.ngay_bat_dau || diemDen.ngay_ket_thuc || new Date().toISOString().split('T')[0]
        
        // Tạo tiêu đề từ tên điểm đến và thứ tự
        const tieuDe = diemDen.thu_tu 
          ? ` #${diemDen.thu_tu}: ${diemDen.ten_diem_den}`
          : diemDen.ten_diem_den

        return {
          id: String(diemDen.diem_den_id), // Sử dụng diem_den_id làm id
          diem_den_id: diemDen.diem_den_id, // Giữ lại để reference
          ngay: ngayHienThi,
          tieuDe: tieuDe,
          ghiChu: diemDen.ghi_chu || "",
          thu_tu: diemDen.thu_tu,
          ngay_bat_dau: diemDen.ngay_bat_dau,
          ngay_ket_thuc: diemDen.ngay_ket_thuc,
          dia_diem_xuat_phat: diemDen.dia_diem_xuat_phat,
          tao_luc: diemDen.tao_luc,
          so_luong_chi_phi: diemDen.so_luong_chi_phi,
          tong_chi_phi_ngay: diemDen.tong_chi_phi_ngay,
          pois: [], // Sẽ được map sau khi fetch POIs
        }
      })

      return apiDays
    } catch (error) {
      console.error("Lỗi khi fetch điểm đến:", error)

      // Xử lý lỗi 401
      if (axios.isAxiosError(error) && error.response?.status === 401) {
        toast({
          title: "Phiên đăng nhập hết hạn",
          description: "Token không hợp lệ hoặc đã hết hạn. Vui lòng đăng nhập lại.",
          variant: "destructive",
        })
        router.replace("/login")
      } else if (axios.isAxiosError(error) && error.response?.status === 403) {
        toast({
          title: "Không có quyền",
          description: "Bạn không có quyền xem điểm đến của chuyến đi này.",
          variant: "destructive",
        })
      } else if (axios.isAxiosError(error) && error.response?.status === 404) {
        console.warn("Không tìm thấy điểm đến cho chuyến đi này")
      }

      return [] // Trả về mảng rỗng nếu có lỗi
    }
  }

  // <-- FUNCTION FETCH CẢ ĐIỂM ĐẾN VÀ LỊCH TRÌNH -->
  const fetchDaysAndPoisFromAPI = async () => {
    setIsLoadingDays(true)

    try {
      // Fetch điểm đến
      const apiDiemDen = await fetchDiemDenFromAPI()

      // Fetch lịch trình cho từng điểm đến
      const daysWithLichTrinh = await Promise.all(
        apiDiemDen.map(async (diemDen: any) => {
          const diemDenId = String(diemDen.diem_den_id || diemDen.id)
          const lichTrinhList = await fetchLichTrinhByDiemDenId(diemDenId)
          
          return {
            ...diemDen,
            pois: lichTrinhList
              .sort((a: any, b: any) => {
                // Sắp xếp theo ngày trước, sau đó theo giờ bắt đầu
                const ngayCompare = a.ngay.localeCompare(b.ngay)
                if (ngayCompare !== 0) return ngayCompare
                return a.gio_bat_dau.localeCompare(b.gio_bat_dau)
              }),
          }
        })
      )

      // Sắp xếp và đánh số thứ tự điểm đến
      updateDaysList(daysWithLichTrinh)

      const totalLichTrinh = daysWithLichTrinh.reduce((sum, day) => sum + day.pois.length, 0)
      toast({
        title: "Đã tải lịch trình",
        description: `Đã tải ${daysWithLichTrinh.length} điểm đến và ${totalLichTrinh} lịch trình`,
      })
    } catch (error) {
      console.error("Lỗi khi fetch điểm đến và lịch trình:", error)
      toast({
        title: "Lỗi tải dữ liệu",
        description: "Không thể tải lịch trình từ server. Sử dụng dữ liệu mẫu.",
        variant: "destructive",
      })
      // Giữ nguyên mock data khi có lỗi
    } finally {
      setIsLoadingDays(false)
    }
  }

  // <-- THÊM FUNCTION VALIDATION NGÀY -->
  const validateDayDate = (selectedDate: string) => {
    if (!tripStartDate || !tripEndDate) {
      return { isValid: true, message: "" }
    }

    const selected = new Date(selectedDate)
    const startDate = new Date(tripStartDate)
    const endDate = new Date(tripEndDate)

    // Reset time to 00:00:00 để so sánh chỉ ngày
    selected.setHours(0, 0, 0, 0)
    startDate.setHours(0, 0, 0, 0)
    endDate.setHours(0, 0, 0, 0)

    if (selected < startDate) {
      return {
        isValid: false,
        message: `Ngày được chọn (${selectedDate}) phải sau hoặc bằng ngày bắt đầu chuyến đi (${tripStartDate})`
      }
    }

    if (selected > endDate) {
      return {
        isValid: false,
        message: `Ngày được chọn (${selectedDate}) phải trước hoặc bằng ngày kết thúc chuyến đi (${tripEndDate})`
      }
    }

    return { isValid: true, message: "" }
  }

  // <-- FUNCTION SẮP XẾP THEO SỐ THỨ TỰ (thu_tu) -->
  const sortAndNumberDays = (daysList: any[]) => {
    // Sắp xếp theo số thứ tự (thu_tu) - từ nhỏ đến lớn
    const sortedDays = [...daysList].sort((a, b) => {
      const thuTuA = a.thu_tu ?? 999999 // Nếu không có thu_tu, đặt cuối cùng
      const thuTuB = b.thu_tu ?? 999999
      return thuTuA - thuTuB
    })

    // Giữ nguyên tiêu đề từ API (đã có format #${thu_tu}: ${ten_diem_den})
    // Chỉ thêm formattedDate nếu cần
    const numberedDays = sortedDays.map((day) => {
      const formattedDate = day.ngay_bat_dau 
        ? new Date(day.ngay_bat_dau).toLocaleDateString("vi-VN", {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
          })
        : day.ngay_ket_thuc
        ? new Date(day.ngay_ket_thuc).toLocaleDateString("vi-VN", {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
          })
        : new Date(day.ngay).toLocaleDateString("vi-VN", {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
          })

      return {
        ...day,
        formattedDate: formattedDate
      }
    })

    return numberedDays
  }

  // <-- THÊM FUNCTION CẬP NHẬT DANH SÁCH NGÀY -->
  const updateDaysList = (newDaysList: any[]) => {
    const sortedAndNumbered = sortAndNumberDays(newDaysList)
    setDays(sortedAndNumbered)
  }

  const getPoiTypeLabel = (type: string) => {
    const types = {
      POI: { label: "Điểm tham quan", color: "bg-blue-100 text-blue-800" },
      hotel: { label: "Khách sạn", color: "bg-purple-100 text-purple-800" },
      transport: { label: "Phương tiện", color: "bg-green-100 text-green-800" },
      activity: { label: "Hoạt động", color: "bg-orange-100 text-orange-800" },
      other: { label: "Khác", color: "bg-gray-100 text-gray-800" },
      // Giữ lại các loại cũ để tương thích ngược
      landmark: { label: "Địa danh", color: "bg-blue-100 text-blue-800" },
      restaurant: { label: "Nhà hàng", color: "bg-green-100 text-green-800" },
      shopping: { label: "Mua sắm", color: "bg-yellow-100 text-yellow-800" },
      beach: { label: "Bãi biển", color: "bg-cyan-100 text-cyan-800" },
      historic: { label: "Lịch sử", color: "bg-orange-100 text-orange-800" },
    }
    return types[type as keyof typeof types] || types.POI
  }

  const checkTimeOverlap = (dayId: string, newPoi: any) => {
    // ... (hàm này không thay đổi) ...
    const day = days.find((d) => d.id === dayId)
    if (!day) return []

    const newStart = new Date(`2024-01-01 ${newPoi.gioBatDau}`)
    const newEnd = new Date(`2024-01-01 ${newPoi.gioKetThuc}`)

    return day.pois.filter((poi) => {
      if (poi.id === newPoi.id) return false
      const poiStart = new Date(`2024-01-01 ${poi.gioBatDau}`)
      const poiEnd = new Date(`2024-01-01 ${poi.gioKetThuc}`)
      return newStart < poiEnd && newEnd > poiStart
    })
  }

  // <-- SỬA LẠI HOÀN TOÀN HÀM NÀY -->
  const handleAddDay = async (dayData: any) => {
    // ✅ Kiểm tra xem đây là batch hay single
    if (dayData.batch && Array.isArray(dayData.data)) {
      // Đây là batch điểm đến đã được thêm thành công từ API
      console.log("✅ Batch điểm đến đã được thêm thành công:", dayData)
      
      // Refresh lại danh sách để hiển thị điểm đến mới
      await fetchDaysAndPoisFromAPI()
      
      toast({
        title: "Thêm điểm đến thành công",
        description: `Đã thêm ${dayData.tong_so} điểm đến vào chuyến đi`,
      })
      
      setShowAddDayModal(false)
      return
    }

    // ✅ Kiểm tra xem đây là dữ liệu điểm đến hay ngày
    // Nếu có diem_den_id thì đây là điểm đến đã được thêm thành công từ modal
    if (dayData.diem_den_id) {
      // Đây là điểm đến đã được thêm thành công từ API
      console.log("✅ Điểm đến đã được thêm thành công:", dayData)
      
      // Refresh lại danh sách để hiển thị điểm đến mới
      await fetchDaysAndPoisFromAPI()
      
      toast({
        title: "Thêm điểm đến thành công",
        description: `Đã thêm điểm đến "${dayData.ten_diem_den}" vào chuyến đi`,
      })
      
      setShowAddDayModal(false)
      return
    }

    // Nếu đang trong quá trình thêm, không cho bấm nữa
    if (isAddingDay) {
      console.log("Đang trong quá trình thêm ngày, bỏ qua request")
      return
    }

    // <-- THÊM VALIDATION NGÀY TRƯỚC KHI THÊM -->
    const dateValidation = validateDayDate(dayData.ngay)
    if (!dateValidation.isValid) {
      toast({
        title: "Ngày không hợp lệ",
        description: dateValidation.message,
        variant: "destructive",
      })
      return // Dừng hàm nếu ngày không hợp lệ
    }

    // <-- THÊM VALIDATION DUPLICATE NGÀY -->
    const existingDay = days.find(day => day.ngay === dayData.ngay)
    if (existingDay) {
      toast({
        title: "Ngày đã tồn tại",
        description: `Ngày ${dayData.ngay} đã có trong lịch trình. Vui lòng chọn ngày khác.`,
        variant: "destructive",
      })
      return // Dừng hàm nếu ngày đã tồn tại
    }

    // <-- THÊM VALIDATION FORMAT NGÀY -->
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/
    if (!dateRegex.test(dayData.ngay)) {
      toast({
        title: "Định dạng ngày không hợp lệ",
        description: "Ngày phải có định dạng YYYY-MM-DD (ví dụ: 2024-03-15)",
        variant: "destructive",
      })
      return
    }

    setIsAddingDay(true) // Bắt đầu loading
    console.log("Bắt đầu thêm ngày:", dayData.ngay)

    // Lấy token từ cookie
    const token = Cookies.get("token")
    console.log("Token từ cookie:", token)

    // Kiểm tra token như bạn yêu cầu
    if (!token || token === "null" || token === "undefined") {
      console.warn("Không có token → chuyển về /login")
      toast({
        title: "Lỗi xác thực",
        description: "Không tìm thấy token. Đang chuyển về trang đăng nhập.",
        variant: "destructive",
      })
      router.replace("/login")
      setIsAddingDay(false) // Dừng loading
      return // Dừng hàm
    }

    try {
      // Chuẩn bị payload
      const payload = {
        chuyen_di_id: tripId,
        ngay: dayData.ngay,
        tieu_de: dayData.tieuDe,
        ghi_chu: dayData.ghiChu,
      }

      // Debug logging
      console.log("Payload gửi lên API:", payload)
      console.log("Trip ID:", tripId)
      console.log("Ngày được chọn:", dayData.ngay)

      // Gọi API với header Authorization
      const response = await axios.post(
        "https://travel-planner-imdw.onrender.com/api/lich-trinh-ngay/",
        payload,
        {
          headers: {
            Authorization: `Bearer ${token}`, // <-- THÊM TOKEN VÀO HEADER
          },
        }
      )

      // Xử lý response từ API
      console.log("Response từ API thêm ngày:", response.data)

      if (response.data) {
        // Ánh xạ dữ liệu trả về từ API (snake_case) sang state (camelCase)
        const newDayForState = {
          id: response.data.lich_trinh_ngay_id || response.data.id,
          ngay: response.data.ngay,
          tieuDe: response.data.tieu_de,
          ghiChu: response.data.ghi_chu,
          pois: [], // Ngày mới chưa có POI
        }

        // Refresh lại danh sách để hiển thị lịch trình mới
        await fetchDaysAndPoisFromAPI()
      } else {
        // Fallback nếu không có response data
        const newDayForState = {
          id: `day_${Date.now()}`,
          ngay: dayData.ngay,
          tieuDe: dayData.tieuDe,
          ghiChu: dayData.ghiChu,
          pois: [],
        }

        const updatedDays = [...days, newDayForState]
        updateDaysList(updatedDays)
      }
      setShowAddDayModal(false)
      toast({
        title: "Đã thêm ngày mới",
        description: "Ngày mới đã được thêm vào lịch trình",
      })
    } catch (error) {
      console.error("Lỗi khi thêm ngày:", error)

      // Xử lý lỗi 401
      if (axios.isAxiosError(error) && error.response?.status === 401) {
        toast({
          title: "Phiên đăng nhập hết hạn",
          description: "Token không hợp lệ hoặc đã hết hạn. Vui lòng đăng nhập lại.",
          variant: "destructive",
        })
        router.replace("/login") // Chuyển về login khi 401
      } else if (axios.isAxiosError(error) && error.response?.status === 409) {
        // Xử lý lỗi 409 - Conflict (duplicate ngày)
        toast({
          title: "Ngày đã tồn tại",
          description: "Ngày này đã có trong lịch trình. Vui lòng chọn ngày khác.",
          variant: "destructive",
        })
      } else if (axios.isAxiosError(error) && error.response?.status === 400) {
        // Xử lý lỗi 400 - Bad Request
        const errorMessage = error.response?.data?.message || "Dữ liệu không hợp lệ"
        toast({
          title: "Dữ liệu không hợp lệ",
          description: errorMessage,
          variant: "destructive",
        })
      } else {
        toast({
          title: "Lỗi",
          description: "Không thể thêm ngày mới. Vui lòng thử lại.",
          variant: "destructive",
        })
      }
    } finally {
      setIsAddingDay(false) // Dừng loading
    }
  }

  const handleAddPoi = async (dayId: string, poiData: any) => {
    // ✅ Kiểm tra xem đây có phải là lịch trình mới đã được thêm thành công từ modal không
    // Nếu có lich_trinh_ngay_id trong poiData, nghĩa là modal đã gọi API thành công
    if (poiData.lich_trinh_ngay_id) {
      console.log("✅ Lịch trình đã được thêm thành công từ modal:", poiData)
      
      // Chỉ cần refresh lại danh sách điểm đến và POIs
      await fetchDaysAndPoisFromAPI()
      
      setShowAddPoiModal(null)
      return
    }

    // ✅ Nếu không có lich_trinh_ngay_id, đây là flow cũ (thêm POI vào điểm đến)
    // Giữ nguyên logic cũ để tương thích ngược
    // Kiểm tra trùng giờ
    const overlaps = checkTimeOverlap(dayId, poiData)

    if (overlaps.length > 0) {
      toast({
        title: "Cảnh báo trùng giờ",
        description: `Thời gian trùng với ${overlaps.length} điểm khác`,
        variant: "destructive",
      })
    }

    // Lấy token từ cookie
    const token = Cookies.get("token")

    // Kiểm tra token
    if (!token || token === "null" || token === "undefined") {
      toast({
        title: "Lỗi xác thực",
        description: "Không tìm thấy token. Đang chuyển về trang đăng nhập.",
        variant: "destructive",
      })
      router.replace("/login")
      return
    }

    try {
      // Chuẩn bị payload theo format API (backend yêu cầu HH:mm:ss cho thoi_gian_bat_dau và thoi_gian_ket_thuc)
      // Backend sẽ convert string HH:mm:ss thành TIME format
      const formatTime = (timeValue: string) => {
        // Nếu input type="time" trả về "HH:mm", thêm ":00" để thành "HH:mm:ss"
        if (timeValue && timeValue.length === 5) {
          return `${timeValue}:00`
        }
        return timeValue || null
      }

      const payload = {
        chuyen_di_id: tripId,
        lich_trinh_ngay_id: dayId,
        ten_dia_diem: poiData.tenDiaDiem,
        loai_dia_diem: poiData.loaiDiaDiem || "POI",
        google_place_id: poiData.googlePlaceId || null,
        vi_do: poiData.viDo ? parseFloat(poiData.viDo) : (poiData.toaDo?.lat || null),
        kinh_do: poiData.kinhDo ? parseFloat(poiData.kinhDo) : (poiData.toaDo?.lng || null),
        thoi_gian_bat_dau: formatTime(poiData.gioBatDau),
        thoi_gian_ket_thuc: formatTime(poiData.gioKetThuc),
        ghi_chu: poiData.ghiChu || null,
      }

      console.log("Payload gửi lên API thêm điểm:", payload)

      // Gọi API POST để thêm điểm
      const response = await axios.post(
        "https://travel-planner-imdw.onrender.com/api/dia-diem/them",
        payload,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      )

      console.log("Response từ API thêm điểm:", response.data)

      // Backend trả về: { message, dia_diem: {...}, canh_bao: [...] }
      const diaDiemData = response.data?.dia_diem || response.data
      const canhBao = response.data?.canh_bao || []

      if (diaDiemData) {
        // Refresh lại danh sách lịch trình từ API để đảm bảo đồng bộ
        await fetchDaysAndPoisFromAPI()

        setShowAddPoiModal(null)

        // Hiển thị toast với cảnh báo nếu có
        if (canhBao.length > 0) {
          toast({
            title: "Đã thêm điểm đến (có cảnh báo)",
            description: response.data?.message || `Có ${canhBao.length} hoạt động trùng khung giờ`,
            variant: "default",
          })
        } else {
          toast({
            title: "Đã thêm điểm đến",
            description: response.data?.message || "Điểm đến mới đã được thêm vào lịch trình",
          })
        }
      }
    } catch (error) {
      console.error("Lỗi khi thêm điểm:", error)

      // Xử lý lỗi 401
      if (axios.isAxiosError(error) && error.response?.status === 401) {
        toast({
          title: "Phiên đăng nhập hết hạn",
          description: "Token không hợp lệ hoặc đã hết hạn. Vui lòng đăng nhập lại.",
          variant: "destructive",
        })
        router.replace("/login")
      } else if (axios.isAxiosError(error) && error.response?.status === 409) {
        // Xử lý lỗi 409 - Conflict (trùng khung giờ)
        const errorMessage = error.response?.data?.message || "Trùng khung giờ với hoạt động khác"
        const canhBao = error.response?.data?.canh_bao || []
        toast({
          title: "Trùng khung giờ",
          description: errorMessage + (canhBao.length > 0 ? `. ${canhBao.length} hoạt động trùng.` : ""),
          variant: "destructive",
        })
      } else if (axios.isAxiosError(error) && error.response?.status === 403) {
        // Xử lý lỗi 403 - Forbidden (không phải chủ chuyến đi)
        const errorMessage = error.response?.data?.message || "Chỉ chủ chuyến đi mới được thêm điểm đến"
        toast({
          title: "Không có quyền",
          description: errorMessage,
          variant: "destructive",
        })
      } else if (axios.isAxiosError(error) && error.response?.status === 400) {
        // Xử lý lỗi 400 - Bad Request
        const errorMessage = error.response?.data?.message || "Dữ liệu không hợp lệ"
        toast({
          title: "Dữ liệu không hợp lệ",
          description: errorMessage,
          variant: "destructive",
        })
      } else if (axios.isAxiosError(error) && error.response?.status === 404) {
        toast({
          title: "Không tìm thấy ngày",
          description: "Ngày này có thể đã bị xóa hoặc không tồn tại.",
          variant: "destructive",
        })
      } else {
        toast({
          title: "Lỗi thêm điểm",
          description: "Không thể thêm điểm đến. Vui lòng thử lại.",
          variant: "destructive",
        })
      }
    }
  }

  const handleEditPoi = async (poiId: string, poiData: any) => {
    // Lấy token từ cookie
    const token = Cookies.get("token")
    
    // Kiểm tra token
    if (!token || token === "null" || token === "undefined") {
      toast({
        title: "Lỗi xác thực",
        description: "Không tìm thấy token. Đang chuyển về trang đăng nhập.",
        variant: "destructive",
      })
      router.replace("/login")
      return
    }

    if (!editingPoi) return

    try {
      // Validation: Kiểm tra giờ bắt đầu và kết thúc có được nhập
      const gioBatDauValue = poiData.gioBatDau?.trim() || ""
      const gioKetThucValue = poiData.gioKetThuc?.trim() || ""

      console.log("=== DEBUG handleEditPoi ===")
      console.log("poiData nhận từ modal:", poiData)
      console.log("gioBatDauValue:", gioBatDauValue)
      console.log("gioKetThucValue:", gioKetThucValue)

      if (!gioBatDauValue || gioBatDauValue === "") {
        toast({
          title: "Lỗi thời gian",
          description: "Vui lòng nhập giờ bắt đầu",
          variant: "destructive",
        })
        return
      }

      if (!gioKetThucValue || gioKetThucValue === "") {
        toast({
          title: "Lỗi thời gian",
          description: "Vui lòng nhập giờ kết thúc",
          variant: "destructive",
        })
        return
      }

      // Chuẩn bị payload theo format API (backend yêu cầu HH:mm:ss cho thoi_gian_bat_dau và thoi_gian_ket_thuc)
      const formatTime = (timeValue: string | undefined | null): string | null => {
        if (!timeValue || typeof timeValue !== 'string') return null
        
        const trimmed = timeValue.trim()
        if (!trimmed) return null

        // Nếu input type="time" trả về "HH:mm", thêm ":00" để thành "HH:mm:ss"
        if (trimmed.length === 5 && trimmed.match(/^\d{2}:\d{2}$/)) {
          return `${trimmed}:00`
        }
        
        // Nếu đã là "HH:mm:ss", trả về trực tiếp
        if (trimmed.length === 8 && trimmed.match(/^\d{2}:\d{2}:\d{2}$/)) {
          return trimmed
        }
        
        // Nếu có format khác (VD: "1970-01-01 HH:mm:ss"), extract phần giờ
        if (trimmed.includes(' ')) {
          const timePart = trimmed.split(' ')[1]
          if (timePart && timePart.length >= 5) {
            if (timePart.length === 5) {
              return `${timePart}:00`
            }
            return timePart.substring(0, 8)
          }
        }
        
        return null
      }

      const formattedGioBatDau = formatTime(gioBatDauValue)
      const formattedGioKetThuc = formatTime(gioKetThucValue)

      if (!formattedGioBatDau || !formattedGioKetThuc) {
        toast({
          title: "Lỗi thời gian",
          description: "Giờ bắt đầu hoặc giờ kết thúc không hợp lệ. Vui lòng kiểm tra lại.",
          variant: "destructive",
        })
        return
      }

      const payload = {
        chuyen_di_id: tripId,
        lich_trinh_ngay_id: editingPoi.dayId,
        ten_dia_diem: poiData.tenDiaDiem,
        loai_dia_diem: poiData.loaiDiaDiem || "POI",
        google_place_id: poiData.googlePlaceId || null,
        vi_do: poiData.viDo ? parseFloat(poiData.viDo) : (poiData.toaDo?.lat || null),
        kinh_do: poiData.kinhDo ? parseFloat(poiData.kinhDo) : (poiData.toaDo?.lng || null),
        thoi_gian_bat_dau: formattedGioBatDau,
        thoi_gian_ket_thuc: formattedGioKetThuc,
        ghi_chu: poiData.ghiChu || null,
      }

      console.log("Formatted gioBatDau:", formattedGioBatDau)
      console.log("Formatted gioKetThuc:", formattedGioKetThuc)
      console.log("Payload gửi lên API sửa điểm:", payload)
      console.log("=== END DEBUG ===")

      // Gọi API PUT để sửa điểm
      const response = await axios.put(
        `https://travel-planner-imdw.onrender.com/api/dia-diem/sua/${poiId}`,
        payload,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      )

      console.log("Response từ API sửa điểm:", response.data)

      const canhBao = response.data?.canh_bao || []

      // Refresh lại danh sách lịch trình từ API để đảm bảo đồng bộ
      await fetchDaysAndPoisFromAPI()

      setEditingPoi(null)

      // Hiển thị toast với cảnh báo nếu có
      if (canhBao.length > 0) {
        toast({
          title: "Đã cập nhật điểm đến (có cảnh báo)",
          description: response.data?.message || `Có ${canhBao.length} hoạt động trùng khung giờ`,
          variant: "default",
        })
      } else {
        toast({
          title: "Đã cập nhật điểm đến",
          description: response.data?.message || "Điểm đến đã được cập nhật thành công",
        })
      }
    } catch (error) {
      console.error("Lỗi khi sửa điểm:", error)

      // Xử lý lỗi 401
      if (axios.isAxiosError(error) && error.response?.status === 401) {
        toast({
          title: "Phiên đăng nhập hết hạn",
          description: "Token không hợp lệ hoặc đã hết hạn. Vui lòng đăng nhập lại.",
          variant: "destructive",
        })
        router.replace("/login")
      } else if (axios.isAxiosError(error) && error.response?.status === 409) {
        // Xử lý lỗi 409 - Conflict (trùng khung giờ)
        const errorMessage = error.response?.data?.message || "Trùng khung giờ với hoạt động khác"
        const canhBao = error.response?.data?.canh_bao || []
        toast({
          title: "Trùng khung giờ",
          description: errorMessage + (canhBao.length > 0 ? `. ${canhBao.length} hoạt động trùng.` : ""),
          variant: "destructive",
        })
      } else if (axios.isAxiosError(error) && error.response?.status === 403) {
        // Xử lý lỗi 403 - Forbidden (không phải chủ chuyến đi)
        const errorMessage = error.response?.data?.message || "Chỉ chủ chuyến đi mới được sửa điểm đến"
        toast({
          title: "Không có quyền",
          description: errorMessage,
          variant: "destructive",
        })
      } else if (axios.isAxiosError(error) && error.response?.status === 400) {
        // Xử lý lỗi 400 - Bad Request
        const errorMessage = error.response?.data?.message || "Dữ liệu không hợp lệ"
        toast({
          title: "Dữ liệu không hợp lệ",
          description: errorMessage,
          variant: "destructive",
        })
      } else if (axios.isAxiosError(error) && error.response?.status === 404) {
        toast({
          title: "Không tìm thấy điểm đến",
          description: "Điểm đến này có thể đã bị xóa.",
          variant: "destructive",
        })
      } else {
        toast({
          title: "Lỗi cập nhật điểm đến",
          description: "Không thể cập nhật điểm đến. Vui lòng thử lại.",
          variant: "destructive",
        })
      }
    }
  }

  const handleDeletePoi = async (dayId: string, lichTrinhId: string) => {
    // Xác nhận trước khi xóa
    const confirmed = window.confirm("Bạn có chắc chắn muốn xóa lịch trình này?")
    if (!confirmed) return

    // Lấy token từ cookie
    const token = Cookies.get("token")

    // Kiểm tra token
    if (!token || token === "null" || token === "undefined") {
      toast({
        title: "Lỗi xác thực",
        description: "Không tìm thấy token. Đang chuyển về trang đăng nhập.",
        variant: "destructive",
      })
      router.replace("/login")
      return
    }

    try {
      // Gọi API DELETE để xóa lịch trình
      const response = await axios.delete(
        `https://travel-planner-imdw.onrender.com/api/lich-trinh-ngay/${lichTrinhId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      )

      console.log("✅ API Response (Delete Lich Trinh):", response.data)

      // Lấy message từ response
      const message = response.data?.message || "Xóa lịch trình thành công"

      // Refresh lại danh sách lịch trình từ API
      await fetchDaysAndPoisFromAPI()

      toast({
        title: "Đã xóa lịch trình",
        description: message,
      })
    } catch (error) {
      console.error("Lỗi khi xóa lịch trình:", error)

      if (axios.isAxiosError(error) && error.response?.status === 401) {
        toast({
          title: "Phiên đăng nhập hết hạn",
          description: "Token không hợp lệ hoặc đã hết hạn. Vui lòng đăng nhập lại.",
          variant: "destructive",
        })
        router.replace("/login")
      } else if (axios.isAxiosError(error) && error.response?.status === 403) {
        const errorMessage = error.response?.data?.message || "Chỉ chủ chuyến đi mới được xóa lịch trình"
        toast({
          title: "Không có quyền",
          description: errorMessage,
          variant: "destructive",
        })
      } else if (axios.isAxiosError(error) && error.response?.status === 404) {
        const errorMessage = error.response?.data?.message || "Không tìm thấy lịch trình"
        toast({
          title: "Không tìm thấy lịch trình",
          description: errorMessage,
          variant: "destructive",
        })
      } else if (axios.isAxiosError(error) && error.response?.status === 500) {
        const errorMessage = error.response?.data?.error || error.response?.data?.message || "Có lỗi xảy ra trên server"
        toast({
          title: "Lỗi server",
          description: errorMessage,
          variant: "destructive",
        })
      } else {
        const errorMessage = axios.isAxiosError(error) 
          ? (error.response?.data?.message || "Không thể xóa lịch trình. Vui lòng thử lại.")
          : "Không thể xóa lịch trình. Vui lòng thử lại."
        toast({
          title: "Lỗi xóa lịch trình",
          description: errorMessage,
          variant: "destructive",
        })
      }
    }
  }

  // <-- FUNCTION XÓA ĐIỂM ĐẾN VỚI API -->
  const handleDeleteDay = async (dayId: string) => {
    // Tìm điểm đến để lấy tên và diem_den_id
    const dayToDelete = days.find((day) => day.id === dayId)
    const diemDenId = (dayToDelete as any)?.diem_den_id || dayId
    const tenDiemDen = (dayToDelete as any)?.tieuDe || "điểm đến này"

    // Xác nhận trước khi xóa
    const confirmed = window.confirm(
      `Bạn có chắc chắn muốn xóa điểm đến "${tenDiemDen}"? Hành động này không thể hoàn tác.`
    )
    if (!confirmed) return

    // ✅ Lấy token từ cookie
    const token = Cookies.get("token")
    console.log("Token từ cookie:", token)

    // ✅ Kiểm tra token hợp lệ
    if (!token || token === "null" || token === "undefined") {
      console.warn("Không có token → chuyển về /login")
      toast({
        title: "Lỗi xác thực",
        description: "Vui lòng đăng nhập để tiếp tục",
        variant: "destructive",
      })
      router.replace("/login")
      return
    }

    try {
      // Gọi API DELETE để xóa điểm đến
      const response = await axios.delete(
        `https://travel-planner-imdw.onrender.com/api/diem-den/${diemDenId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      )

      // Xử lý response từ API
      console.log("✅ API Response (Delete Diem Den):", response.data)

      const message = response.data?.message || "Xóa điểm đến thành công"
      const canhBao = response.data?.canh_bao

      // Refresh lại danh sách điểm đến và POIs từ API
      await fetchDaysAndPoisFromAPI()

      // Hiển thị toast với cảnh báo nếu có
      if (canhBao) {
        toast({
          title: message,
          description: canhBao,
          variant: "default",
        })
      } else {
        toast({
          title: "Đã xóa điểm đến",
          description: message,
        })
      }
    } catch (error: any) {
      console.error("❌ Lỗi khi xóa điểm đến:", error)

      if (axios.isAxiosError(error)) {
        if (error.response?.status === 401) {
          toast({
            title: "Phiên đăng nhập hết hạn",
            description: "Vui lòng đăng nhập lại",
            variant: "destructive",
          })
          router.replace("/login")
        } else if (error.response?.status === 403) {
          toast({
            title: "Không có quyền",
            description: error.response?.data?.message || "Chỉ chủ chuyến đi mới được xóa điểm đến",
            variant: "destructive",
          })
        } else if (error.response?.status === 404) {
          toast({
            title: "Không tìm thấy điểm đến",
            description: error.response?.data?.message || "Điểm đến này có thể đã bị xóa",
            variant: "destructive",
          })
        } else if (error.response?.status === 500) {
          toast({
            title: "Lỗi server",
            description: error.response?.data?.message || "Có lỗi xảy ra trên server. Vui lòng thử lại sau.",
            variant: "destructive",
          })
        } else {
          toast({
            title: "Lỗi xóa điểm đến",
            description: error.response?.data?.message || "Không thể xóa điểm đến. Vui lòng thử lại.",
            variant: "destructive",
          })
        }
      } else {
        toast({
          title: "Lỗi xóa điểm đến",
          description: "Có lỗi xảy ra khi xóa điểm đến",
          variant: "destructive",
        })
      }
    }
  }

  // <-- FUNCTION CHỈNH SỬA ĐIỂM ĐẾN -->
  // Lưu ý: API call đã được thực hiện trong edit-day-modal.tsx
  // Hàm này chỉ refresh lại danh sách sau khi cập nhật thành công
  const handleEditDay = async (dayData: any) => {
    console.log("✅ Điểm đến đã được cập nhật thành công:", dayData)
    
    // Refresh lại danh sách điểm đến và POIs từ API
    await fetchDaysAndPoisFromAPI()
    
    // Đóng modal
    setEditingDay(null)
    
    toast({
      title: "Đã cập nhật điểm đến",
      description: `Đã cập nhật điểm đến "${dayData.ten_diem_den || dayData.tieuDe}" thành công`,
    })
  }

  const handleReorderDays = (newOrder: any[]) => {
    // Sắp xếp lại và đánh số thứ tự khi user kéo thả
    updateDaysList(newOrder)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        {/* ... (phần header không đổi) ... */}
        <div>
          <h2 className="text-2xl font-bold text-foreground font-[family-name:var(--font-space-grotesk)]">
            Lịch Trình Chi Tiết
          </h2>
          {tripStartDate && tripEndDate && (
            <p className="text-sm text-muted-foreground mt-1">
              Thời gian hợp lệ: {new Date(tripStartDate).toLocaleDateString("vi-VN")} - {new Date(tripEndDate).toLocaleDateString("vi-VN")}
            </p>
          )}
        </div>
        <Button onClick={() => setShowAddDayModal(true)} className="bg-primary hover:bg-primary/90">
          <Plus className="h-4 w-4 mr-2" />
          Thêm điểm đến
        </Button>
      </div>

      {/* Loading State */}
      {isLoadingDays && (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Đang tải lịch trình...</p>
        </div>
      )}

      {/* Timeline */}
      {/* ... (phần timeline không đổi) ... */}
      {!isLoadingDays && (
        <div className="space-y-8">
          <Reorder.Group axis="y" values={days} onReorder={handleReorderDays}>
            {days.map((day, dayIndex) => (
              <Reorder.Item key={day.id} value={day}>
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: dayIndex * 0.1 }}
                  className="mb-2"
                >
                  <Card className="border-l-4 border-l-primary">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <GripVertical className="h-5 w-5 text-muted-foreground cursor-grab" />
                          <div>
                            <CardTitle className="font-[family-name:var(--font-space-grotesk)]">{day.tieuDe}</CardTitle>
                            <div className="flex items-center gap-2 mt-1">
                              <Calendar className="h-4 w-4 text-muted-foreground" />
                              <span className="text-sm text-muted-foreground">
                                {(day as any).ngay_bat_dau && (day as any).ngay_ket_thuc
                                  ? `${new Date((day as any).ngay_bat_dau).toLocaleDateString("vi-VN")} - ${new Date((day as any).ngay_ket_thuc).toLocaleDateString("vi-VN")}`
                                  : (day as any).ngay_bat_dau
                                  ? `Từ ${new Date((day as any).ngay_bat_dau).toLocaleDateString("vi-VN")}`
                                  : (day as any).ngay_ket_thuc
                                  ? `Đến ${new Date((day as any).ngay_ket_thuc).toLocaleDateString("vi-VN")}`
                                  : (day as any).formattedDate || new Date(day.ngay).toLocaleDateString("vi-VN", {
                                      weekday: "long",
                                      year: "numeric",
                                      month: "long",
                                      day: "numeric",
                                    })}
                              </span>
                              {/* Thứ tự */}
                              {/* {(day as any).thu_tu && (
                                <Badge variant="outline" className="text-xs">
                                  Thứ tự: #{(day as any).thu_tu}
                                </Badge>
                              )} */}
                            </div>
                            {day.ghiChu && (
                              <p className="text-sm text-muted-foreground mt-1 font-[family-name:var(--font-dm-sans)]">
                                {day.ghiChu}
                              </p>
                            )}
                            {/* Hiển thị địa điểm xuất phát */}
                            {(day as any).dia_diem_xuat_phat && (
                              <div className="flex items-center gap-1 mt-1">
                                <Navigation className="h-3 w-3 text-muted-foreground" />
                                <span className="text-xs text-muted-foreground">
                                  Xuất phát: {(day as any).dia_diem_xuat_phat}
                                </span>
                              </div>
                            )}
                            {/* Hiển thị thông tin chi phí */}
                            {((day as any).so_luong_chi_phi > 0 || (day as any).tong_chi_phi_ngay) && (
                              <div className="flex items-center gap-1 mt-1">
                                <DollarSign className="h-3 w-3 text-green-600" />
                                <span className="text-xs text-green-600 font-medium">
                                  {(day as any).tong_chi_phi_ngay 
                                    ? `${Number((day as any).tong_chi_phi_ngay).toLocaleString("vi-VN")} đ`
                                    : "0 đ"}
                                  {((day as any).so_luong_chi_phi > 0) && (
                                    <span className="text-muted-foreground ml-1">
                                      ({((day as any).so_luong_chi_phi)} giao dịch)
                                    </span>
                                  )}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {/* CHỈNH SỬA */}
                          <Button variant="outline" size="sm" onClick={() => setEditingDay(day)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setShowAddPoiModal(day.id)}
                            className="bg-primary/10 hover:bg-primary/20 text-primary border-primary/20"
                          >
                            <Plus className="h-4 w-4 mr-1" />
                            Thêm Lịch Trình
                          </Button>
                          {/* Xóa điểm đến */}
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeleteDay(day.id)}
                            className="text-destructive hover:text-destructive hover:bg-destructive/10"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      {day.pois.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                          <MapPin className="h-8 w-8 mx-auto mb-2 opacity-50" />
                          <p>Chưa có lịch trình nào</p>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {day.pois.map((lichTrinh: any, lichTrinhIndex: number) => (
                            <div key={lichTrinh.id} className="flex items-start gap-4 p-4 bg-muted/30 rounded-lg">
                              <div className="flex flex-col items-center">
                                <div className="w-3 h-3 bg-primary rounded-full" />
                                {lichTrinhIndex < day.pois.length - 1 && <div className="w-0.5 h-8 bg-border mt-2" />}
                              </div>

                              <div className="flex-1 min-w-0">
                                <div className="flex items-start justify-between">
                                  <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-1">
                                      <h4 className="font-semibold text-foreground">{lichTrinh.tieu_de}</h4>
                                      {lichTrinh.thu_tu && (
                                        <Badge variant="outline" className="text-xs">
                                          #{lichTrinh.thu_tu}
                                        </Badge>
                                      )}
                                    </div>

                                    <div className="flex items-center gap-4 text-sm text-muted-foreground mb-2">
                                      <div className="flex items-center gap-1">
                                        <Calendar className="h-4 w-4" />
                                        <span>
                                          {lichTrinh.ngay ? new Date(lichTrinh.ngay).toLocaleDateString("vi-VN") : ""}
                                        </span>
                                      </div>
                                      <div className="flex items-center gap-1">
                                        <Clock className="h-4 w-4" />
                                        <span>
                                          {lichTrinh.gio_bat_dau} - {lichTrinh.gio_ket_thuc}
                                        </span>
                                      </div>
                                    </div>

                                    {lichTrinh.ghi_chu && (
                                      <p className="text-sm text-muted-foreground font-[family-name:var(--font-dm-sans)]">
                                        {lichTrinh.ghi_chu}
                                      </p>
                                    )}
                                  </div>
                                   {/* CHỈNH SỬA */}
                                   {/* <Button
                                     variant="ghost"
                                     size="icon"
                                     className="text-muted-foreground hover:text-primary"
                                     onClick={() => setEditingPoi({ poi: lichTrinh, dayId: day.id })}
                                   >
                                     <Pencil className="h-4 w-4" />
                                   </Button> */}
                                  {/* Xóa lịch trình */}

                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => handleDeletePoi(day.id, lichTrinh.id)}
                                    className="text-muted-foreground hover:text-destructive"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </motion.div>
              </Reorder.Item>
            ))}
          </Reorder.Group>
        </div>
      )}

      {/* Empty State - Không có điểm đến */}
      {!isLoadingDays && days.length === 0 && (
        <div className="text-center py-12">
          <MapPin className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-foreground mb-2">Chưa có điểm đến</h3>
          <p className="text-muted-foreground mb-4">Bắt đầu bằng cách thêm điểm đến đầu tiên</p>
          <Button onClick={() => setShowAddDayModal(true)} className="bg-primary hover:bg-primary/90">
            <Plus className="h-4 w-4 mr-2" />
            Thêm Điểm Đến Đầu Tiên
          </Button>
        </div>
      )}


      {/* Modals */}
      {/* <-- SỬA LỖI: Xóa prop 'isLoading' khỏi lời gọi để tránh crash --> */}
      {showAddDayModal && (
        <AddDayModal
          tripId={tripId}
          onClose={() => setShowAddDayModal(false)}
          onSubmit={handleAddDay}
        />
      )}

      {showAddPoiModal && (
        <AddPoiModal
          dayId={showAddPoiModal}
          tripId={tripId}
          onClose={() => setShowAddPoiModal(null)}
          onSubmit={handleAddPoi}
        />
      )}

      {editingDay && (
        <EditDayModal
          day={editingDay}
          diem_den_id={editingDay.diem_den_id || editingDay.id}
          tripId={tripId}
          onClose={() => setEditingDay(null)}
          onSubmit={handleEditDay}
        />
      )}

      {editingPoi && (
        <EditPoiModal
          poi={editingPoi.poi}
          dayId={editingPoi.dayId}
          tripId={tripId}
          onClose={() => setEditingPoi(null)}
          onSubmit={handleEditPoi}
        />
      )}
    </div>
  )
}
