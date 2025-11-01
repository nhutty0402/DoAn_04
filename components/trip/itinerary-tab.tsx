"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation" // <-- THÊM
import Cookies from "js-cookie" // <-- THÊM
import axios from "axios" // <-- THÊM
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Plus, Calendar, Clock, MapPin, GripVertical, Edit, Trash2, AlertCircle } from "lucide-react"
import { AddDayModal } from "@/components/itinerary/add-day-modal"
import { AddPoiModal } from "@/components/itinerary/add-poi-modal"
import { EditDayModal } from "@/components/itinerary/edit-day-modal"
import { Badge } from "@/components/ui/badge"
import { motion, Reorder } from "framer-motion"
import { useToast } from "@/hooks/use-toast"

// Mock itinerary data
const mockItinerary = [
  // ... (dữ liệu mock không thay đổi) ...
  {
    id: "day1",
    ngay: "2024-03-15",
    tieuDe: "Ngày 1: Khám phá trung tâm Đà Nẵng",
    ghiChu: "Tham quan các điểm nổi tiếng trong thành phố",
    pois: [
      {
        id: "poi1",
        tenDiaDiem: "Cầu Rồng",
        loaiDiaDiem: "landmark",
        gioBatDau: "09:00",
        gioKetThuc: "10:30",
        ghiChu: "Xem rồng phun lửa vào cuối tuần",
        toaDo: { lat: 16.0544, lng: 108.2272 },
        thoiGianDiChuyen: 0,
      },
      {
        id: "poi2",
        tenDiaDiem: "Chợ Hàn",
        loaiDiaDiem: "shopping",
        gioBatDau: "11:00",
        gioKetThuc: "12:30",
        ghiChu: "Mua sắm và ăn trưa",
        toaDo: { lat: 16.0678, lng: 108.2208 },
        thoiGianDiChuyen: 15,
      },
      {
        id: "poi3",
        tenDiaDiem: "Bãi biển Mỹ Khê",
        loaiDiaDiem: "beach",
        gioBatDau: "15:00",
        gioKetThuc: "18:00",
        ghiChu: "Tắm biển và ngắm hoàng hôn",
        toaDo: { lat: 16.0471, lng: 108.2487 },
        thoiGianDiChuyen: 20,
      },
    ],
  },
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
  const [editingDay, setEditingDay] = useState<any>(null)
  const [isAddingDay, setIsAddingDay] = useState(false) // <-- Vẫn giữ state loading
  const [isLoadingDays, setIsLoadingDays] = useState(false) // <-- THÊM LOADING STATE
  const { toast } = useToast()
  const router = useRouter() // <-- THÊM ROUTER

  // <-- THÊM USEEFFECT ĐỂ LOAD DỮ LIỆU KHI COMPONENT MOUNT -->
  useEffect(() => {
    fetchDaysFromAPI()
  }, [tripId]) // Chạy lại khi tripId thay đổi

  // <-- THÊM FUNCTION FETCH DAYS TỪ API -->
  const fetchDaysFromAPI = async () => {
    const token = Cookies.get("token")
    
    // Kiểm tra token
    if (!token || token === "null" || token === "undefined") {
      console.warn("Không có token để fetch days")
      return
    }

    setIsLoadingDays(true)
    
    try {
      // Sử dụng axios params option để tránh vấn đề encoding
      const response = await axios.get(
        `https://travel-planner-imdw.onrender.com/api/lich-trinh-ngay/${tripId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      )      

      // Chuyển đổi dữ liệu từ API (snake_case) sang state (camelCase)
      const apiDays = response.data.danh_sach.map((day: any) => ({
        id: day.lich_trinh_ngay_id,
        ngay: day.ngay,
        tieuDe: day.tieu_de,
        ghiChu: day.ghi_chu,
        pois: [], // Tạm thời để trống, có thể fetch POI riêng sau
      }))

      // Sắp xếp và đánh số thứ tự ngày
      updateDaysList(apiDays)
      
      toast({
        title: "Đã tải lịch trình",
        description: `Đã tải ${apiDays.length} ngày từ server`,
      })
    } catch (error) {
      console.error("Lỗi khi fetch days:", error)
      
      // Xử lý lỗi 401
      if (axios.isAxiosError(error) && error.response?.status === 401) {
        toast({
          title: "Phiên đăng nhập hết hạn",
          description: "Token không hợp lệ hoặc đã hết hạn. Vui lòng đăng nhập lại.",
          variant: "destructive",
        })
        router.replace("/login")
      } else {
        toast({
          title: "Lỗi tải dữ liệu",
          description: "Không thể tải lịch trình từ server. Sử dụng dữ liệu mẫu.",
          variant: "destructive",
        })
        // Giữ nguyên mock data khi có lỗi
      }
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

  // <-- THÊM FUNCTION SẮP XẾP VÀ ĐÁNH SỐ THỨ TỰ NGÀY -->
  const sortAndNumberDays = (daysList: any[]) => {
    // Sắp xếp theo ngày (từ sớm đến muộn)
    const sortedDays = [...daysList].sort((a, b) => {
      const dateA = new Date(a.ngay)
      const dateB = new Date(b.ngay)
      return dateA.getTime() - dateB.getTime()
    })

    // Đánh số thứ tự và cập nhật tiêu đề
    const numberedDays = sortedDays.map((day, index) => {
      const dayNumber = index + 1
      const formattedDate = new Date(day.ngay).toLocaleDateString("vi-VN", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    
      const rawTitle = day.tieuDe || "" // nếu null hoặc undefined → chuỗi rỗng
    
      return {
        ...day,
        tieuDe: `Ngày ${dayNumber}: ${rawTitle.replace(/^Ngày \d+: /, '')}`,
        dayNumber: dayNumber,
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

        // Thêm ngày mới và sắp xếp lại
        const updatedDays = [...days, newDayForState]
        updateDaysList(updatedDays)
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
      // Chuẩn bị payload theo format API
      const payload = {
        dia_diem_id: null, // Sẽ được tạo bởi backend
        chuyen_di_id: tripId,
        lich_trinh_ngay_id: dayId,
        ten_dia_diem: poiData.tenDiaDiem,
        loai_dia_diem: poiData.loaiDiaDiem,
        google_place_id: poiData.googlePlaceId || "",
        vi_do: poiData.viDo || (poiData.toaDo?.lat?.toString() || ""),
        kinh_do: poiData.kinhDo || (poiData.toaDo?.lng?.toString() || ""),
        thoi_gian_bat_dau: poiData.gioBatDau,
        thoi_gian_ket_thuc: poiData.gioKetThuc,
        ghi_chu: poiData.ghiChu || "",
        tao_luc: new Date().toISOString(),
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

      // Xử lý response từ API
      if (response.data) {
        // Tạo POI object cho local state
        const newPoi = {
          id: response.data.dia_diem_id || response.data.id || `poi${Date.now()}`,
          tenDiaDiem: poiData.tenDiaDiem,
          loaiDiaDiem: poiData.loaiDiaDiem,
          gioBatDau: poiData.gioBatDau,
          gioKetThuc: poiData.gioKetThuc,
          ghiChu: poiData.ghiChu,
          toaDo: poiData.toaDo,
          thoiGianDiChuyen: Math.floor(Math.random() * 30) + 5, // Mock travel time
        }

        // Cập nhật local state
        setDays(
          days.map((day) =>
            day.id === dayId
              ? { ...day, pois: [...day.pois, newPoi].sort((a, b) => a.gioBatDau.localeCompare(b.gioBatDau)) }
              : day,
          ),
        )
        
        setShowAddPoiModal(null)
        toast({
          title: "Đã thêm điểm đến",
          description: "Điểm đến mới đã được thêm vào lịch trình",
        })
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

  const handleDeletePoi = (dayId: string, poiId: string) => {
    // ... (hàm này không thay đổi) ...
    setDays(days.map((day) => (day.id === dayId ? { ...day, pois: day.pois.filter((poi) => poi.id !== poiId) } : day)))
    toast({
      title: "Đã xóa điểm đến",
      description: "Điểm đến đã được xóa khỏi lịch trình",
    })
  }

  // <-- THÊM FUNCTION XÓA NGÀY VỚI API -->
  const handleDeleteDay = async (dayId: string) => {
    // Xác nhận trước khi xóa
    const confirmed = window.confirm("Bạn có chắc chắn muốn xóa ngày này khỏi lịch trình? Hành động này không thể hoàn tác.")
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
      // Gọi API DELETE để xóa ngày
      const response = await axios.delete(
        `https://travel-planner-imdw.onrender.com/api/lich-trinh-ngay/${dayId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      )

      // Xử lý response từ API
      console.log("Response từ API xóa ngày:", response.data)
      
      // Cập nhật local state - xóa ngày khỏi danh sách
      const updatedDays = days.filter((day) => day.id !== dayId)
      updateDaysList(updatedDays)
      
      toast({
        title: "Đã xóa ngày",
        description: "Ngày đã được xóa khỏi lịch trình thành công",
      })
    } catch (error) {
      console.error("Lỗi khi xóa ngày:", error)
      
      // Xử lý lỗi 401
      if (axios.isAxiosError(error) && error.response?.status === 401) {
        toast({
          title: "Phiên đăng nhập hết hạn",
          description: "Token không hợp lệ hoặc đã hết hạn. Vui lòng đăng nhập lại.",
          variant: "destructive",
        })
        router.replace("/login")
      } else if (axios.isAxiosError(error) && error.response?.status === 404) {
        toast({
          title: "Không tìm thấy ngày",
          description: "Ngày này có thể đã bị xóa hoặc không tồn tại.",
          variant: "destructive",
        })
      } else if (axios.isAxiosError(error) && error.response?.status === 403) {
        toast({
          title: "Không có quyền",
          description: "Chỉ chủ chuyến đi mới được xóa ngày trong lịch trình.",
          variant: "destructive",
        })
      } else {
        toast({
          title: "Lỗi xóa ngày",
          description: "Không thể xóa ngày. Vui lòng thử lại.",
          variant: "destructive",
        })
      }
    }
  }

  // <-- THÊM FUNCTION CHỈNH SỬA NGÀY VỚI API -->
  const handleEditDay = async (dayData: any) => {
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

    // Validation ngày nếu có thay đổi ngày
    if (dayData.ngay && dayData.ngay !== editingDay?.ngay) {
      const dateValidation = validateDayDate(dayData.ngay)
      if (!dateValidation.isValid) {
        toast({
          title: "Ngày không hợp lệ",
          description: dateValidation.message,
          variant: "destructive",
        })
        return
      }
    }

    try {
      // Chuẩn bị payload cho API (theo backend code)
      const payload = {
        ngay: dayData.ngay,
        tieu_de: dayData.tieuDe,
        ghi_chu: dayData.ghiChu,
      }

      // Gọi API PUT với id trong URL (theo backend code)
      const response = await axios.put(
        `https://travel-planner-imdw.onrender.com/api/lich-trinh-ngay/${editingDay.id}`,
        payload,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      )

      // Xử lý response từ API
      if (response.data && response.data.lich_trinh_ngay) {
        console.log("Response từ API:", response.data)
        
        // Cập nhật local state với dữ liệu từ API
        const updatedDays = days.map((day) => 
          day.id === editingDay.id 
            ? { 
                ...day, 
                ngay: response.data.lich_trinh_ngay.ngay || dayData.ngay,
                tieuDe: response.data.lich_trinh_ngay.tieu_de || dayData.tieuDe,
                ghiChu: response.data.lich_trinh_ngay.ghi_chu || dayData.ghiChu
              }
            : day
        )
        
        // Sắp xếp lại và đánh số thứ tự
        updateDaysList(updatedDays)
        setEditingDay(null)
        
        toast({
          title: "Đã cập nhật ngày",
          description: "Thông tin ngày đã được cập nhật thành công",
        })
      } else {
        // Fallback nếu không có response data
        const updatedDays = days.map((day) => 
          day.id === editingDay.id 
            ? { ...day, ...dayData }
            : day
        )
        
        updateDaysList(updatedDays)
        setEditingDay(null)
        
        toast({
          title: "Đã cập nhật ngày",
          description: "Thông tin ngày đã được cập nhật thành công",
        })
      }
    } catch (error) {
      console.error("Lỗi khi cập nhật ngày:", error)
      
      // Xử lý lỗi 401
      if (axios.isAxiosError(error) && error.response?.status === 401) {
        toast({
          title: "Phiên đăng nhập hết hạn",
          description: "Token không hợp lệ hoặc đã hết hạn. Vui lòng đăng nhập lại.",
          variant: "destructive",
        })
        router.replace("/login")
      } else {
        toast({
          title: "Lỗi cập nhật",
          description: "Không thể cập nhật thông tin ngày. Vui lòng thử lại.",
          variant: "destructive",
        })
      }
    }
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
          Thêm Ngày
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
        <div className="space-y-6">
        <Reorder.Group axis="y" values={days} onReorder={handleReorderDays}>
          {days.map((day, dayIndex) => (
            <Reorder.Item key={day.id} value={day}>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: dayIndex * 0.1 }}
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
                              {(day as any).formattedDate || new Date(day.ngay).toLocaleDateString("vi-VN", {
                                weekday: "long",
                                year: "numeric",
                                month: "long",
                                day: "numeric",
                              })}
                            </span>
                          </div>
                          {day.ghiChu && (
                            <p className="text-sm text-muted-foreground mt-1 font-[family-name:var(--font-dm-sans)]">
                              {day.ghiChu}
                            </p>
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
                          Thêm Điểm
                        </Button>
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
                        <p>Chưa có điểm đến nào</p>
                        <Button variant="ghost" size="sm" onClick={() => setShowAddPoiModal(day.id)} className="mt-2">
                          Thêm điểm đến đầu tiên
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {day.pois.map((poi, poiIndex) => (
                          <div key={poi.id} className="flex items-start gap-4 p-4 bg-muted/30 rounded-lg">
                            <div className="flex flex-col items-center">
                              <div className="w-3 h-3 bg-primary rounded-full" />
                              {poiIndex < day.pois.length - 1 && <div className="w-0.5 h-8 bg-border mt-2" />}
                            </div>

                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between">
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-1">
                                    <h4 className="font-semibold text-foreground">{poi.tenDiaDiem}</h4>
                                    <Badge
                                      className={`text-xs ${getPoiTypeLabel(poi.loaiDiaDiem).color}`}
                                      variant="secondary"
                                    >
                                      {getPoiTypeLabel(poi.loaiDiaDiem).label}
                                    </Badge>
                                  </div>

                                  <div className="flex items-center gap-4 text-sm text-muted-foreground mb-2">
                                    <div className="flex items-center gap-1">
                                      <Clock className="h-4 w-4" />
                                      <span>
                                        {poi.gioBatDau} - {poi.gioKetThuc}
                                      </span>
                                    </div>
                                    {poi.thoiGianDiChuyen > 0 && (
                                      <div className="flex items-center gap-1 text-orange-600">
                                        <AlertCircle className="h-4 w-4" />
                                        <span>{poi.thoiGianDiChuyen} phút di chuyển</span>
                                      </div>
                                    )}
                                  </div>

                                  {poi.ghiChu && (
                                    <p className="text-sm text-muted-foreground font-[family-name:var(--font-dm-sans)]">
                                      {poi.ghiChu}
                                    </p>
                                  )}
                                </div>

                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleDeletePoi(day.id, poi.id)}
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

      {/* ... (phần không có lịch trình không đổi) ... */}
      {!isLoadingDays && days.length === 0 && (
        <div className="text-center py-12">
          <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-foreground mb-2">Chưa có lịch trình</h3>
          <p className="text-muted-foreground mb-4">Bắt đầu bằng cách thêm ngày đầu tiên</p>
          <Button onClick={() => setShowAddDayModal(true)} className="bg-primary hover:bg-primary/90">
            <Plus className="h-4 w-4 mr-2" />
            Thêm Ngày Đầu Tiên
          </Button>
        </div>
      )}


      {/* Modals */}
      {/* <-- SỬA LỖI: Xóa prop 'isLoading' khỏi lời gọi để tránh crash --> */}
      {showAddDayModal && (
        <AddDayModal
          onClose={() => setShowAddDayModal(false)}
          onSubmit={handleAddDay}
          // isLoading={isAddingDay} // <-- Dòng này gây lỗi nên tạm thời xóa
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
          onClose={() => setEditingDay(null)}
          onSubmit={handleEditDay}
        />
      )}
    </div>
  )
}
