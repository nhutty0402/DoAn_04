"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Separator } from "@/components/ui/separator"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Plus, MapPin, Calendar, DollarSign, Clock, ChevronRight, ChevronLeft, FileDown, Loader2, MoreVertical, Pencil, Trash2, AlertTriangle, GitCompare, Save } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import jsPDF from "jspdf"
import html2canvas from "html2canvas"
import axios from "axios"
import Cookies from "js-cookie"

const BACKEND_URL = "https://travel-planner-imdw.onrender.com"

interface DiemDen {
  diem_den_id: number
  ten_diem_den: string
  thu_tu: number
  ngay_bat_dau: string
  ngay_ket_thuc: string
  dia_diem_xuat_phat: string
  ghi_chu: string
}

interface LichTrinh {
  lich_trinh_id: number
  diem_den_id: number
  ngay: string
  tieu_de: string
  ghi_chu: string
  gio_bat_dau: string
  gio_ket_thuc: string
}

interface ChiPhi {
  chi_phi_id: number
  diem_den_id: number
  lich_trinh_id?: number // Optional: liên kết với lịch trình
  nguoi_chi_id: number
  nguoi_chi_ten: string
  so_tien: number
  mo_ta: string
  nhom: string
  ngay: string
}

interface PlanningTabProps {
  tripId: string
}

// Danh sách tỉnh thành Việt Nam
const TINH_THANH = [
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
  "Cần Thơ (thành phố)",
  "Đà Nẵng (thành phố)",
  "Đắk Lắk",
  "Đắk Nông",
  "Điện Biên",
  "Đồng Nai",
  "Đồng Tháp",
  "Gia Lai",
  "Hà Giang",
  "Hà Nam",
  "Hà Nội (thủ đô)",
  "Hải Dương",
  "Hải Phòng (thành phố)",
  "Hậu Giang",
  "Hòa Bình",
  "Thành phố Hồ Chí Minh (thành phố)",
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
  "Yên Bái",
]

export function PlanningTab({ tripId }: PlanningTabProps) {
  const { toast } = useToast()
  
  // States
  const [isExportingPDF, setIsExportingPDF] = useState(false)
  const [isSavingDiemDen, setIsSavingDiemDen] = useState(false)
  const [isSavingLichTrinh, setIsSavingLichTrinh] = useState(false)
  const [isSavingChiPhi, setIsSavingChiPhi] = useState(false)
  const [isUpdatingDiemDen, setIsUpdatingDiemDen] = useState(false)
  const [isUpdatingLichTrinh, setIsUpdatingLichTrinh] = useState(false)
  const [isUpdatingChiPhi, setIsUpdatingChiPhi] = useState(false)
  const [isDeletingDiemDen, setIsDeletingDiemDen] = useState(false)
  const pdfContentRef = useRef<HTMLDivElement>(null)
  
  // State cho dialog xác nhận xóa điểm đến
  const [showDeleteDiemDenDialog, setShowDeleteDiemDenDialog] = useState(false)
  const [deletingDiemDen, setDeletingDiemDen] = useState<DiemDen | null>(null)

  // State cho modal chỉnh sửa điểm đến
  const [showEditDiemDenModal, setShowEditDiemDenModal] = useState(false)
  const [editingDiemDen, setEditingDiemDen] = useState<DiemDen | null>(null)
  const [editDiemDenForm, setEditDiemDenForm] = useState({
    ten_diem_den: "",
    ngay_bat_dau: "",
    ngay_ket_thuc: "",
    ghi_chu: ""
  })

  // State cho modal chỉnh sửa lịch trình
  const [showEditLichTrinhModal, setShowEditLichTrinhModal] = useState(false)
  const [editingLichTrinh, setEditingLichTrinh] = useState<LichTrinh | null>(null)
  const [editLichTrinhForm, setEditLichTrinhForm] = useState({
    diem_den_id: 0,
    ngay: "",
    tieu_de: "",
    ghi_chu: "",
    gio_bat_dau: "",
    gio_ket_thuc: ""
  })

  // State cho modal chỉnh sửa chi phí
  const [showEditChiPhiModal, setShowEditChiPhiModal] = useState(false)
  const [editingChiPhi, setEditingChiPhi] = useState<ChiPhi | null>(null)
  const [editChiPhiForm, setEditChiPhiForm] = useState({
    diem_den_id: 0,
    lich_trinh_id: 0,
    nguoi_chi_id: 0,
    nguoi_chi_ten: "",
    so_tien: 0,
    mo_ta: "",
    nhom: "",
    ngay: ""
  })

  // State cho so sánh kế hoạch
  const [showCompareModal, setShowCompareModal] = useState(false)
  const [isLoadingCompare, setIsLoadingCompare] = useState(false)
  const [compareData, setCompareData] = useState<any>(null)

  // State cho lưu kế hoạch gốc
  const [isSavingOriginalPlan, setIsSavingOriginalPlan] = useState(false)

  // Hàm chuyển đổi tên trường sang tiếng Việt
  const getFieldLabel = (key: string): string => {
    const fieldLabels: { [key: string]: string } = {
      ten_diem_den: "Tên điểm đến",
      ngay_bat_dau: "Ngày bắt đầu",
      ngay_ket_thuc: "Ngày kết thúc",
      dia_diem_xuat_phat: "Địa điểm xuất phát",
      ghi_chu: "Ghi chú",
      thu_tu: "Thứ tự"
    }
    // Trả về nhãn tiếng Việt hoặc tên trường gốc nếu không tìm thấy
    return fieldLabels[key] || key
  }

  // Hàm format giá trị hiển thị
  const formatFieldValue = (key: string, value: any): string => {
    if (value === null || value === undefined || value === "") {
      return "—"
    }
    
    // Format ngày tháng
    if (key === "ngay_bat_dau" || key === "ngay_ket_thuc") {
      try {
        return new Date(value).toLocaleDateString("vi-VN", {
          day: "2-digit",
          month: "2-digit",
          year: "numeric"
        })
      } catch {
        return String(value)
      }
    }
    
    // Format số thứ tự
    if (key === "thu_tu") {
      return `#${value}`
    }
    
    return String(value)
  }

  // Function lưu kế hoạch gốc
  const handleSaveOriginalPlan = async () => {
    setIsSavingOriginalPlan(true)
    try {
      const token = Cookies.get("token")
      
      if (!token || token === "null" || token === "undefined") {
        toast({
          title: "Lỗi xác thực",
          description: "Vui lòng đăng nhập để sử dụng tính năng này",
          variant: "destructive",
        })
        setIsSavingOriginalPlan(false)
        return
      }

      const response = await axios.post(
        `${BACKEND_URL}/api/ke-hoach-chuyen-di/${tripId}/luu-ke-hoach-goc`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      )

      console.log("✅ API Response (Lưu kế hoạch gốc):", response.data)
      
      toast({
        title: "Lưu kế hoạch gốc thành công",
        description: response.data?.message || `Đã lưu ${response.data?.summary?.so_diem_den || 0} điểm đến, ${response.data?.summary?.so_lich_trinh || 0} lịch trình, ${response.data?.summary?.so_chi_phi || 0} chi phí`,
      })
    } catch (error: any) {
      console.error("❌ Lỗi khi lưu kế hoạch gốc:", error)
      
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 401) {
          toast({
            title: "Lỗi xác thực",
            description: "Phiên đăng nhập đã hết hạn",
            variant: "destructive",
          })
        } else if (error.response?.status === 403) {
          toast({
            title: "Không có quyền",
            description: "Chỉ chủ chuyến đi mới được lưu kế hoạch gốc",
            variant: "destructive",
          })
        } else if (error.response?.status === 404) {
          toast({
            title: "Không tìm thấy",
            description: "Không tìm thấy chuyến đi hoặc kế hoạch",
            variant: "destructive",
          })
        } else if (error.response?.status === 409) {
          toast({
            title: "Đã tồn tại",
            description: error.response?.data?.message || "Kế hoạch gốc đã được lưu trước đó",
            variant: "destructive",
          })
        } else {
          toast({
            title: "Lỗi",
            description: error.response?.data?.message || "Không thể lưu kế hoạch gốc",
            variant: "destructive",
          })
        }
      } else {
        toast({
          title: "Lỗi",
          description: "Có lỗi xảy ra khi lưu kế hoạch gốc",
          variant: "destructive",
        })
      }
    } finally {
      setIsSavingOriginalPlan(false)
    }
  }

  // Function so sánh kế hoạch
  const handleComparePlan = async () => {
    setIsLoadingCompare(true)
    try {
      const token = Cookies.get("token")
      
      if (!token || token === "null" || token === "undefined") {
        toast({
          title: "Lỗi xác thực",
          description: "Vui lòng đăng nhập để sử dụng tính năng này",
          variant: "destructive",
        })
        setIsLoadingCompare(false)
        return
      }

      const response = await axios.get(
        `${BACKEND_URL}/api/ke-hoach-chuyen-di/${tripId}/so-sanh-ke-hoach`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      )

      console.log("✅ API Response (So sánh kế hoạch):", response.data)
      setCompareData(response.data)
      setShowCompareModal(true)
      
      toast({
        title: "So sánh thành công",
        description: "Đã tải thông tin so sánh kế hoạch",
      })
    } catch (error: any) {
      console.error("❌ Lỗi khi so sánh kế hoạch:", error)
      
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 401) {
          toast({
            title: "Lỗi xác thực",
            description: "Phiên đăng nhập đã hết hạn",
            variant: "destructive",
          })
        } else if (error.response?.status === 404) {
          toast({
            title: "Không tìm thấy",
            description: "Không tìm thấy dữ liệu so sánh cho chuyến đi này",
            variant: "destructive",
          })
        } else {
          toast({
            title: "Lỗi",
            description: error.response?.data?.message || "Không thể so sánh kế hoạch",
            variant: "destructive",
          })
        }
      } else {
        toast({
          title: "Lỗi",
          description: "Có lỗi xảy ra khi so sánh kế hoạch",
          variant: "destructive",
        })
      }
    } finally {
      setIsLoadingCompare(false)
    }
  }
  
  // Mock data mẫu (fallback)
  const mockDiemDen: DiemDen[] = [
    {
      diem_den_id: 1,
      ten_diem_den: "Đà Nẵng",
      thu_tu: 1,
      ngay_bat_dau: "2024-12-01",
      ngay_ket_thuc: "2024-12-03",
      dia_diem_xuat_phat: "Sân bay Đà Nẵng",
      ghi_chu: "Thành phố biển xinh đẹp, nhiều điểm tham quan nổi tiếng"
    },
    {
      diem_den_id: 2,
      ten_diem_den: "Hội An",
      thu_tu: 2,
      ngay_bat_dau: "2024-12-04",
      ngay_ket_thuc: "2024-12-05",
      dia_diem_xuat_phat: "Từ Đà Nẵng",
      ghi_chu: "Phố cổ Hội An - Di sản văn hóa thế giới"
    },
    {
      diem_den_id: 3,
      ten_diem_den: "Huế",
      thu_tu: 3,
      ngay_bat_dau: "2024-12-06",
      ngay_ket_thuc: "2024-12-08",
      dia_diem_xuat_phat: "Từ Hội An",
      ghi_chu: "Cố đô Huế với nhiều di tích lịch sử"
    }
  ]

  const mockLichTrinh: LichTrinh[] = [
    {
      lich_trinh_id: 1,
      diem_den_id: 1,
      ngay: "2024-12-01",
      tieu_de: "Tham quan Cầu Rồng",
      ghi_chu: "Xem rồng phun lửa vào cuối tuần",
      gio_bat_dau: "09:00",
      gio_ket_thuc: "10:30"
    },
    {
      lich_trinh_id: 2,
      diem_den_id: 1,
      ngay: "2024-12-01",
      tieu_de: "Ăn trưa tại Chợ Hàn",
      ghi_chu: "Thử các món đặc sản địa phương",
      gio_bat_dau: "12:00",
      gio_ket_thuc: "13:30"
    },
    {
      lich_trinh_id: 3,
      diem_den_id: 1,
      ngay: "2024-12-02",
      tieu_de: "Tắm biển Mỹ Khê",
      ghi_chu: "Thư giãn và ngắm hoàng hôn",
      gio_bat_dau: "15:00",
      gio_ket_thuc: "18:00"
    },
    {
      lich_trinh_id: 4,
      diem_den_id: 2,
      ngay: "2024-12-04",
      tieu_de: "Tham quan Phố cổ Hội An",
      ghi_chu: "Đi bộ quanh phố cổ, chụp ảnh",
      gio_bat_dau: "08:00",
      gio_ket_thuc: "12:00"
    },
    {
      lich_trinh_id: 5,
      diem_den_id: 2,
      ngay: "2024-12-04",
      tieu_de: "Thả đèn hoa đăng",
      ghi_chu: "Hoạt động đặc trưng của Hội An",
      gio_bat_dau: "19:00",
      gio_ket_thuc: "21:00"
    },
    {
      lich_trinh_id: 6,
      diem_den_id: 3,
      ngay: "2024-12-06",
      tieu_de: "Tham quan Đại Nội Huế",
      ghi_chu: "Khám phá kiến trúc cung đình",
      gio_bat_dau: "08:00",
      gio_ket_thuc: "11:30"
    }
  ]

  const mockChiPhi: ChiPhi[] = [
    {
      chi_phi_id: 1,
      diem_den_id: 1,
      nguoi_chi_id: 1,
      nguoi_chi_ten: "Nguyễn Văn A",
      so_tien: 2400000,
      mo_ta: "Khách sạn Muong Thanh",
      nhom: "Lưu trú",
      ngay: "2024-12-01"
    },
    {
      chi_phi_id: 2,
      diem_den_id: 1,
      nguoi_chi_id: 2,
      nguoi_chi_ten: "Trần Thị B",
      so_tien: 480000,
      mo_ta: "Ăn trưa tại Chợ Hàn",
      nhom: "Ăn uống",
      ngay: "2024-12-01"
    },
    {
      chi_phi_id: 3,
      diem_den_id: 1,
      nguoi_chi_id: 3,
      nguoi_chi_ten: "Lê Văn C",
      so_tien: 500000,
      mo_ta: "Vé tham quan Bà Nà Hills",
      nhom: "Giải trí",
      ngay: "2024-12-02"
    },
    {
      chi_phi_id: 4,
      diem_den_id: 2,
      nguoi_chi_id: 1,
      nguoi_chi_ten: "Nguyễn Văn A",
      so_tien: 1500000,
      mo_ta: "Khách sạn Hội An",
      nhom: "Lưu trú",
      ngay: "2024-12-04"
    },
    {
      chi_phi_id: 5,
      diem_den_id: 2,
      nguoi_chi_id: 2,
      nguoi_chi_ten: "Trần Thị B",
      so_tien: 300000,
      mo_ta: "Vé thả đèn hoa đăng",
      nhom: "Giải trí",
      ngay: "2024-12-04"
    },
    {
      chi_phi_id: 6,
      diem_den_id: 3,
      nguoi_chi_id: 1,
      nguoi_chi_ten: "Nguyễn Văn A",
      so_tien: 2000000,
      mo_ta: "Khách sạn tại Huế",
      nhom: "Lưu trú",
      ngay: "2024-12-06"
    },
    {
      chi_phi_id: 7,
      diem_den_id: 3,
      nguoi_chi_id: 3,
      nguoi_chi_ten: "Lê Văn C",
      so_tien: 400000,
      mo_ta: "Vé tham quan Đại Nội",
      nhom: "Giải trí",
      ngay: "2024-12-06"
    }
  ]

  const [diemDenList, setDiemDenList] = useState<DiemDen[]>([])
  const [lichTrinhList, setLichTrinhList] = useState<LichTrinh[]>([])
  const [chiPhiList, setChiPhiList] = useState<ChiPhi[]>([])
  
  // Modal state
  const [showAddPlanModal, setShowAddPlanModal] = useState(false)
  const [activeTab, setActiveTab] = useState("diem-den")
  
  // Trip info để lấy dia_diem_xuat_phat và ngày bắt đầu/kết thúc
  const [tripInfo, setTripInfo] = useState<{
    dia_diem_xuat_phat?: string
    ngay_bat_dau?: string
    ngay_ket_thuc?: string
  } | null>(null)
  
  // Fetch trip info từ database
  useEffect(() => {
  const fetchTripInfo = async () => {
    try {
      const token = Cookies.get("token")
        if (!token) return

      const response = await axios.get(
        `${BACKEND_URL}/api/chuyen-di/${tripId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      )

        if (response.data && response.data.chuyen_di) {
          const trip = response.data.chuyen_di
        setTripInfo({
            dia_diem_xuat_phat: trip.dia_diem_xuat_phat || "",
            ngay_bat_dau: trip.ngay_bat_dau || "",
            ngay_ket_thuc: trip.ngay_ket_thuc || "",
          })
        }
      } catch (error) {
        console.error("Lỗi khi lấy thông tin chuyến đi:", error)
      }
    }

    fetchTripInfo()
  }, [tripId])

  // Fetch kế hoạch chuyến đi từ database
  useEffect(() => {
    const fetchKeHoach = async () => {
    try {
      const token = Cookies.get("token")
        if (!token) return

      const response = await axios.get(
          `${BACKEND_URL}/api/ke-hoach-chuyen-di/${tripId}/ke-hoach`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      )

        console.log("✅ API Response (Get Ke Hoach):", response.data)

        const data = response.data
        const diemDenArray = data?.diem_den || []
        const lichTrinhArray = data?.lich_trinh || []

        // Map điểm đến từ API
        const mappedDiemDen: DiemDen[] = diemDenArray.map((dd: any) => ({
          diem_den_id: dd.diem_den_id,
        ten_diem_den: dd.ten_diem_den || "",
          thu_tu: dd.thu_tu || 0,
        ngay_bat_dau: dd.ngay_bat_dau || "",
        ngay_ket_thuc: dd.ngay_ket_thuc || "",
        dia_diem_xuat_phat: dd.dia_diem_xuat_phat || "",
        ghi_chu: dd.ghi_chu || "",
      }))

        // Map lịch trình từ API
        const mappedLichTrinh: LichTrinh[] = lichTrinhArray.map((lt: any) => ({
          lich_trinh_id: lt.lich_trinh_ngay_id || lt.lich_trinh_id,
          diem_den_id: lt.diem_den_id || 0,
          ngay: lt.ngay || "",
          tieu_de: lt.tieu_de || "",
          ghi_chu: lt.ghi_chu || "",
          gio_bat_dau: lt.gio_bat_dau || "",
          gio_ket_thuc: lt.gio_ket_thuc || "",
        }))

        // Map chi phí từ API (từ diem_den.chi_phi)
        // Và liên kết với lịch trình qua ngày
        const mappedChiPhi: ChiPhi[] = []
        diemDenArray.forEach((dd: any) => {
          if (dd.chi_phi && Array.isArray(dd.chi_phi)) {
            dd.chi_phi.forEach((cp: any) => {
              // Tìm lịch trình có cùng ngày và cùng điểm đến
              const linkedLichTrinh = lichTrinhArray.find(
                (lt: any) =>
                  lt.diem_den_id === cp.diem_den_id &&
                  lt.ngay === cp.ngay
              )

              mappedChiPhi.push({
        chi_phi_id: cp.chi_phi_id,
                diem_den_id: cp.diem_den_id || dd.diem_den_id,
                lich_trinh_id: linkedLichTrinh
                  ? (linkedLichTrinh.lich_trinh_ngay_id || linkedLichTrinh.lich_trinh_id)
                  : undefined,
        nguoi_chi_id: cp.nguoi_chi_id || 0,
                nguoi_chi_ten: cp.nguoi_chi_ten || "",
                so_tien: parseFloat(cp.so_tien) || 0,
        mo_ta: cp.mo_ta || "",
        nhom: cp.nhom || "",
                // Ngày chi phí: ưu tiên lấy từ lịch trình nếu có liên kết, nếu không thì lấy từ chi phí
                ngay: linkedLichTrinh
                  ? (linkedLichTrinh.ngay || cp.ngay || "")
                  : (cp.ngay || ""),
              })
            })
          }
        })

        // Cập nhật state
      setDiemDenList(mappedDiemDen)
      setLichTrinhList(mappedLichTrinh)
      setChiPhiList(mappedChiPhi)

        // Cập nhật counter để tránh trùng ID
      if (mappedDiemDen.length > 0) {
          const maxDiemDenId = Math.max(...mappedDiemDen.map(dd => dd.diem_den_id))
        setDiemDenIdCounter(maxDiemDenId + 1)
      }
      if (mappedLichTrinh.length > 0) {
          const maxLichTrinhId = Math.max(...mappedLichTrinh.map(lt => lt.lich_trinh_id))
        setLichTrinhIdCounter(maxLichTrinhId + 1)
      }
      if (mappedChiPhi.length > 0) {
          const maxChiPhiId = Math.max(...mappedChiPhi.map(cp => cp.chi_phi_id))
        setChiPhiIdCounter(maxChiPhiId + 1)
      }
      } catch (error) {
        console.error("Lỗi khi lấy kế hoạch chuyến đi:", error)
      }
    }

    fetchKeHoach()
  }, [tripId])

  // Owner info để lấy tên người chi (frontend only)
  const [tripOwner] = useState<{
    nguoi_dung_id?: number
    ho_ten?: string
  } | null>({
    nguoi_dung_id: 1,
    ho_ten: "Người dùng"
  })

  // Danh sách loại chi phí (giống form Thêm Chi Phí)
  const expenseTypes = [
    { value: "ăn uống", label: "Ăn uống" },
    { value: "lưu trú", label: "Lưu trú" },
    { value: "di chuyển", label: "Di chuyển" },
    { value: "giải trí", label: "Giải trí" },
    { value: "mua sắm", label: "Mua sắm" },
    { value: "vé tham quan", label: "Vé tham quan" },
    { value: "dịch vụ", label: "Dịch vụ" },
    { value: "khác", label: "Khác" },
  ]

  // Form states
  const [diemDenForm, setDiemDenForm] = useState({
    ten_diem_den: "",
    thu_tu: 1,
    ngay_bat_dau: "",
    ngay_ket_thuc: "",
    dia_diem_xuat_phat: "",
    ghi_chu: ""
  })

  const [lichTrinhForm, setLichTrinhForm] = useState({
    diem_den_id: 0,
    ngay: "",
    tieu_de: "",
    ghi_chu: "",
    gio_bat_dau: "",
    gio_ket_thuc: ""
  })

  const [chiPhiForm, setChiPhiForm] = useState({
    diem_den_id: 0,
    lich_trinh_id: 0, // Thêm trường chọn lịch trình
    nguoi_chi_id: 0,
    nguoi_chi_ten: "",
    so_tien: 0,
    mo_ta: "",
    nhom: "",
    ngay: ""
  })

  // Hàm tạo danh sách ngày từ ngày bắt đầu đến ngày kết thúc
  const generateDateList = (startDate: string, endDate: string): string[] => {
    if (!startDate || !endDate) return []

    const start = new Date(startDate)
    const end = new Date(endDate)

    if (isNaN(start.getTime()) || isNaN(end.getTime())) return []
    if (start > end) return []

    const dates: string[] = []
    const currentDate = new Date(start)

    while (currentDate <= end) {
      dates.push(currentDate.toISOString().split('T')[0])
      currentDate.setDate(currentDate.getDate() + 1)
    }

    return dates
  }

  // Danh sách ngày từ ngày bắt đầu đến ngày kết thúc
  const availableDates = generateDateList(diemDenForm.ngay_bat_dau, diemDenForm.ngay_ket_thuc)

  // Hàm format số tiền: 200.000 cho hai trăm nghìn, 2.000.000 cho hai triệu
  const formatCurrency = (amount: number | string): string => {
    const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount
    if (isNaN(numAmount) || numAmount === 0) return "0"

    // Làm tròn về số nguyên (không có phần thập phân)
    const roundedAmount = Math.round(numAmount)

    // Chuyển sang string và format với dấu chấm làm phân cách hàng nghìn
    // Ví dụ: 200000 -> "200.000", 2000000 -> "2.000.000"
    const amountStr = roundedAmount.toString()

    // Format với regex: thêm dấu chấm sau mỗi 3 chữ số từ phải sang trái
    return amountStr.replace(/\B(?=(\d{3})+(?!\d))/g, '.')
  }

  // ID counters - tạm thời cho frontend
  const [diemDenIdCounter, setDiemDenIdCounter] = useState(1)
  const [lichTrinhIdCounter, setLichTrinhIdCounter] = useState(1)
  const [chiPhiIdCounter, setChiPhiIdCounter] = useState(1)

  // Tự động cập nhật địa điểm xuất phát khi mở modal (chỉ khi modal mới mở, không reset khi chuyển tab)
  useEffect(() => {
    if (showAddPlanModal && activeTab === "diem-den") {
      const autoDiaDiemXuatPhat = diemDenList.length === 0
        ? tripInfo?.dia_diem_xuat_phat || ""
        : diemDenList[diemDenList.length - 1]?.ten_diem_den || ""
      
      // Chỉ cập nhật nếu dia_diem_xuat_phat chưa có giá trị hoặc đang rỗng
      // Điều này đảm bảo không ghi đè dữ liệu người dùng đã nhập khi chuyển tab
      if (autoDiaDiemXuatPhat && !diemDenForm.dia_diem_xuat_phat) {
        setDiemDenForm(prev => ({
          ...prev,
          dia_diem_xuat_phat: autoDiaDiemXuatPhat
        }))
      }
    }
    // Không reset form khi chuyển tab - dữ liệu được lưu tự động trong state
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showAddPlanModal, diemDenList, tripInfo]) // Removed activeTab from dependencies to prevent reset on tab change

  // Handle Diem Den - Frontend only
  const handleDiemDenSubmit = (): boolean => {
    if (!diemDenForm.ten_diem_den.trim()) {
      toast({
        title: "Lỗi",
        description: "Vui lòng chọn tên điểm đến",
        variant: "destructive",
      })
      return false
    }

    // Kiểm tra ngày của điểm đến phải nằm trong khoảng ngày của chuyến đi
    if (tripInfo?.ngay_bat_dau && tripInfo?.ngay_ket_thuc) {
      if (diemDenForm.ngay_bat_dau || diemDenForm.ngay_ket_thuc) {
        try {
          const tripStartDate = new Date(tripInfo.ngay_bat_dau)
          tripStartDate.setHours(0, 0, 0, 0)
          const tripEndDate = new Date(tripInfo.ngay_ket_thuc)
          tripEndDate.setHours(0, 0, 0, 0)

          if (diemDenForm.ngay_bat_dau) {
            const diemDenStartDate = new Date(diemDenForm.ngay_bat_dau)
            if (isNaN(diemDenStartDate.getTime())) {
              toast({
                title: "Lỗi",
                description: "Ngày bắt đầu của điểm đến không hợp lệ",
                variant: "destructive",
              })
              return false
            }
            diemDenStartDate.setHours(0, 0, 0, 0)

            if (diemDenStartDate.getTime() < tripStartDate.getTime()) {
              toast({
                title: "Lỗi",
                description: `Ngày bắt đầu của điểm đến (${diemDenStartDate.toLocaleDateString("vi-VN")}) phải lớn hơn hoặc bằng ngày bắt đầu chuyến đi (${tripStartDate.toLocaleDateString("vi-VN")})`,
                variant: "destructive",
              })
              return false
            }

            if (diemDenStartDate.getTime() > tripEndDate.getTime()) {
              toast({
                title: "Lỗi",
                description: `Ngày bắt đầu của điểm đến (${diemDenStartDate.toLocaleDateString("vi-VN")}) phải nhỏ hơn hoặc bằng ngày kết thúc chuyến đi (${tripEndDate.toLocaleDateString("vi-VN")})`,
                variant: "destructive",
              })
              return false
            }
          }

          if (diemDenForm.ngay_ket_thuc) {
            const diemDenEndDate = new Date(diemDenForm.ngay_ket_thuc)
            if (isNaN(diemDenEndDate.getTime())) {
              toast({
                title: "Lỗi",
                description: "Ngày kết thúc của điểm đến không hợp lệ",
                variant: "destructive",
              })
              return false
            }
            diemDenEndDate.setHours(0, 0, 0, 0)

            if (diemDenEndDate.getTime() < tripStartDate.getTime()) {
              toast({
                title: "Lỗi",
                description: `Ngày kết thúc của điểm đến (${diemDenEndDate.toLocaleDateString("vi-VN")}) phải lớn hơn hoặc bằng ngày bắt đầu chuyến đi (${tripStartDate.toLocaleDateString("vi-VN")})`,
                variant: "destructive",
              })
              return false
            }

            if (diemDenEndDate.getTime() > tripEndDate.getTime()) {
              toast({
                title: "Lỗi",
                description: `Ngày kết thúc của điểm đến (${diemDenEndDate.toLocaleDateString("vi-VN")}) phải nhỏ hơn hoặc bằng ngày kết thúc chuyến đi (${tripEndDate.toLocaleDateString("vi-VN")})`,
                variant: "destructive",
              })
              return false
            }
          }

          // Kiểm tra ngày bắt đầu <= ngày kết thúc của điểm đến
          if (diemDenForm.ngay_bat_dau && diemDenForm.ngay_ket_thuc) {
            const diemDenStartDate = new Date(diemDenForm.ngay_bat_dau)
            diemDenStartDate.setHours(0, 0, 0, 0)
            const diemDenEndDate = new Date(diemDenForm.ngay_ket_thuc)
            diemDenEndDate.setHours(0, 0, 0, 0)

            if (diemDenStartDate.getTime() > diemDenEndDate.getTime()) {
              toast({
                title: "Lỗi",
                description: "Ngày bắt đầu của điểm đến phải nhỏ hơn hoặc bằng ngày kết thúc",
                variant: "destructive",
              })
              return false
            }
          }
        } catch (error) {
          console.error("Lỗi khi kiểm tra ngày điểm đến:", error)
          toast({
            title: "Lỗi",
            description: "Có lỗi khi kiểm tra ngày. Vui lòng thử lại.",
            variant: "destructive",
          })
          return false
        }
      }
    }

    // Tự động điền địa điểm xuất phát nếu chưa có
    let diaDiemXuatPhat = diemDenForm.dia_diem_xuat_phat
    
    if (!diaDiemXuatPhat) {
      // Nếu là điểm đến đầu tiên, lấy từ chuyến đi
      if (diemDenList.length === 0) {
        diaDiemXuatPhat = tripInfo?.dia_diem_xuat_phat || ""
      } else {
        // Nếu không phải điểm đầu tiên, lấy từ điểm đến trước đó
        const lastDiemDen = diemDenList[diemDenList.length - 1]
        diaDiemXuatPhat = lastDiemDen.ten_diem_den || ""
      }
    }

    const newDiemDen: DiemDen = {
      diem_den_id: diemDenIdCounter,
      ten_diem_den: diemDenForm.ten_diem_den.trim(),
      thu_tu: diemDenForm.thu_tu,
      ngay_bat_dau: diemDenForm.ngay_bat_dau,
      ngay_ket_thuc: diemDenForm.ngay_ket_thuc,
      dia_diem_xuat_phat: diaDiemXuatPhat,
      ghi_chu: diemDenForm.ghi_chu,
    }

    setDiemDenList([...diemDenList, newDiemDen])
    setDiemDenIdCounter(diemDenIdCounter + 1)
    
    toast({
      title: "Thành công",
      description: "Đã thêm điểm đến",
    })

    // Reset form và tự động điền địa điểm xuất phát cho lần tiếp theo
    const nextDiaDiemXuatPhat = newDiemDen.ten_diem_den

    setDiemDenForm({
      ten_diem_den: "",
      thu_tu: diemDenList.length + 2,
      ngay_bat_dau: "",
      ngay_ket_thuc: "",
      dia_diem_xuat_phat: nextDiaDiemXuatPhat, // Tự động điền điểm đến vừa thêm
      ghi_chu: ""
    })
    
    // Trả về true để báo submit thành công
    return true
  }

  // API call để lưu điểm đến
  const saveDiemDenToAPI = async (diemDenData: {
    ten_diem_den: string
    ngay_bat_dau: string
    ngay_ket_thuc: string
    ghi_chu: string
    dia_diem_xuat_phat: string
  }): Promise<{ success: boolean; diem_den?: any; error?: string }> => {
    try {
      const token = Cookies.get("token")
      if (!token) {
        return { success: false, error: "Không tìm thấy token xác thực" }
      }

      const response = await axios.post(
        `${BACKEND_URL}/api/ke-hoach-chuyen-di/${tripId}/them-diem-den`,
        {
          ten_diem_den: diemDenData.ten_diem_den,
          ngay_bat_dau: diemDenData.ngay_bat_dau || null,
          ngay_ket_thuc: diemDenData.ngay_ket_thuc || null,
          ghi_chu: diemDenData.ghi_chu || null,
          dia_diem_xuat_phat: diemDenData.dia_diem_xuat_phat || null,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      )

      return { success: true, diem_den: response.data.diem_den }
    } catch (error: any) {
      console.error("Lỗi khi lưu điểm đến:", error)
      const errorMessage = error.response?.data?.message || error.message || "Có lỗi xảy ra khi lưu điểm đến"
      return { success: false, error: errorMessage }
    }
  }

  // Hàm lưu lịch trình vào API
  const saveLichTrinhToAPI = async (lichTrinhData: {
    diem_den_id: number
    ngay: string
    tieu_de: string
    gio_bat_dau: string
    gio_ket_thuc: string
    ghi_chu: string
  }): Promise<{ success: boolean; lich_trinh?: any; error?: string }> => {
    try {
      const token = Cookies.get("token")
      if (!token) {
        return { success: false, error: "Không tìm thấy token xác thực" }
      }

      const response = await axios.post(
        `${BACKEND_URL}/api/ke-hoach-chuyen-di/${tripId}/them-lich-trinh`,
        {
          diem_den_id: lichTrinhData.diem_den_id,
          ngay: lichTrinhData.ngay || null,
          tieu_de: lichTrinhData.tieu_de || null,
          gio_bat_dau: lichTrinhData.gio_bat_dau || null,
          gio_ket_thuc: lichTrinhData.gio_ket_thuc || null,
          ghi_chu: lichTrinhData.ghi_chu || null,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      )

      return { success: true, lich_trinh: response.data.lich_trinh }
    } catch (error: any) {
      console.error("Lỗi khi lưu lịch trình:", error)
      const errorMessage = error.response?.data?.message || error.message || "Có lỗi xảy ra khi lưu lịch trình"
      return { success: false, error: errorMessage }
    }
  }

  // API call để cập nhật lịch trình
  const updateLichTrinhToAPI = async (lichTrinhNgayId: number, lichTrinhData: {
    ngay: string
    tieu_de: string
    ghi_chu: string
    gio_bat_dau: string
    gio_ket_thuc: string
  }): Promise<{ success: boolean; lich_trinh?: any; error?: string }> => {
    try {
      const token = Cookies.get("token")
      if (!token) {
        return { success: false, error: "Không tìm thấy token xác thực" }
      }

      const response = await axios.put(
        `${BACKEND_URL}/api/ke-hoach-chuyen-di/${tripId}/lich-trinh/${lichTrinhNgayId}`,
        {
          ngay: lichTrinhData.ngay || "",
          tieu_de: lichTrinhData.tieu_de || "",
          ghi_chu: lichTrinhData.ghi_chu || "",
          gio_bat_dau: lichTrinhData.gio_bat_dau || "",
          gio_ket_thuc: lichTrinhData.gio_ket_thuc || "",
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      )

      return { success: true, lich_trinh: response.data.lich_trinh }
    } catch (error: any) {
      console.error("Lỗi khi cập nhật lịch trình:", error)
      const errorMessage = error.response?.data?.message || error.message || "Có lỗi xảy ra khi cập nhật lịch trình"
      return { success: false, error: errorMessage }
    }
  }

  // Hàm lưu chi phí vào API
  const saveChiPhiToAPI = async (chiPhiData: {
    diem_den_id: number
    so_tien: number
    mo_ta: string
    nhom: string
    ngay: string
  }): Promise<{ success: boolean; chi_phi?: any; error?: string }> => {
    try {
      const token = Cookies.get("token")
      if (!token) {
        return { success: false, error: "Không tìm thấy token xác thực" }
      }

      const response = await axios.post(
        `${BACKEND_URL}/api/ke-hoach-chuyen-di/${tripId}/them-chi-phi`,
        {
          diem_den_id: chiPhiData.diem_den_id,
          so_tien: chiPhiData.so_tien || null,
          mo_ta: chiPhiData.mo_ta || null,
          nhom: chiPhiData.nhom || null,
          ngay: chiPhiData.ngay || null,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      )

      return { success: true, chi_phi: response.data.chi_phi }
    } catch (error: any) {
      console.error("Lỗi khi lưu chi phí:", error)
      const errorMessage = error.response?.data?.message || error.message || "Có lỗi xảy ra khi lưu chi phí"
      return { success: false, error: errorMessage }
    }
  }

  // API call để cập nhật chi phí
  const updateChiPhiToAPI = async (chiPhiId: number, chiPhiData: {
    diem_den_id: number
    so_tien: number
    mo_ta: string
    nhom: string
    ngay: string
  }): Promise<{ success: boolean; chi_phi?: any; error?: string }> => {
    try {
      const token = Cookies.get("token")
      if (!token) {
        return { success: false, error: "Không tìm thấy token xác thực" }
      }

      const response = await axios.put(
        `${BACKEND_URL}/api/ke-hoach-chuyen-di/${tripId}/chi-phi/${chiPhiId}`,
        {
          diem_den_id: chiPhiData.diem_den_id,
          so_tien: chiPhiData.so_tien,
          mo_ta: chiPhiData.mo_ta || "",
          nhom: chiPhiData.nhom || "",
          ngay: chiPhiData.ngay || "",
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      )

      return { success: true, chi_phi: response.data.chi_phi }
    } catch (error: any) {
      console.error("Lỗi khi cập nhật chi phí:", error)
      const errorMessage = error.response?.data?.message || error.message || "Có lỗi xảy ra khi cập nhật chi phí"
      return { success: false, error: errorMessage }
    }
  }

  // API call để xóa điểm đến
  const deleteDiemDenToAPI = async (diemDenId: number): Promise<{ success: boolean; error?: string }> => {
    try {
      const token = Cookies.get("token")
      if (!token) {
        return { success: false, error: "Không tìm thấy token xác thực" }
      }

      const response = await axios.delete(
        `${BACKEND_URL}/api/ke-hoach-chuyen-di/${tripId}/diem-den/${diemDenId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      )

      return { success: true }
    } catch (error: any) {
      console.error("Lỗi khi xóa điểm đến:", error)
      const errorMessage = error.response?.data?.message || error.message || "Có lỗi xảy ra khi xóa điểm đến"
      return { success: false, error: errorMessage }
    }
  }

  // Hàm xử lý xóa điểm đến
  const handleDeleteDiemDen = async () => {
    if (!deletingDiemDen) return false

    setIsDeletingDiemDen(true)
    const apiResult = await deleteDiemDenToAPI(deletingDiemDen.diem_den_id)
    setIsDeletingDiemDen(false)

    if (!apiResult.success) {
      toast({
        title: "Lỗi",
        description: apiResult.error || "Không thể xóa điểm đến. Vui lòng thử lại.",
        variant: "destructive",
      })
      return false
    }

    // Xóa điểm đến khỏi state
    setDiemDenList(prevList => prevList.filter(dd => dd.diem_den_id !== deletingDiemDen.diem_den_id))
    
    // Xóa các lịch trình và chi phí liên quan
    setLichTrinhList(prevList => prevList.filter(lt => lt.diem_den_id !== deletingDiemDen.diem_den_id))
    setChiPhiList(prevList => prevList.filter(cp => cp.diem_den_id !== deletingDiemDen.diem_den_id))

    toast({
      title: "Thành công",
      description: "Đã xóa điểm đến",
    })

    setShowDeleteDiemDenDialog(false)
    setDeletingDiemDen(null)

    return true
  }

  // API call để cập nhật điểm đến
  const updateDiemDenToAPI = async (diemDenId: number, diemDenData: {
    ten_diem_den: string
    ngay_bat_dau: string
    ngay_ket_thuc: string
    ghi_chu: string
  }): Promise<{ success: boolean; diem_den?: any; error?: string }> => {
    try {
      const token = Cookies.get("token")
      if (!token) {
        return { success: false, error: "Không tìm thấy token xác thực" }
      }

      const response = await axios.put(
        `${BACKEND_URL}/api/ke-hoach-chuyen-di/${tripId}/diem-den/${diemDenId}`,
        {
          ten_diem_den: diemDenData.ten_diem_den || "",
          ngay_bat_dau: diemDenData.ngay_bat_dau || "",
          ngay_ket_thuc: diemDenData.ngay_ket_thuc || "",
          ghi_chu: diemDenData.ghi_chu || "",
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      )

      return { success: true, diem_den: response.data.diem_den }
    } catch (error: any) {
      console.error("Lỗi khi cập nhật điểm đến:", error)
      const errorMessage = error.response?.data?.message || error.message || "Có lỗi xảy ra khi cập nhật điểm đến"
      return { success: false, error: errorMessage }
    }
  }

  // Hàm mở modal chỉnh sửa điểm đến
  const handleOpenEditDiemDen = (diemDen: DiemDen) => {
    setEditingDiemDen(diemDen)
    setEditDiemDenForm({
      ten_diem_den: diemDen.ten_diem_den,
      ngay_bat_dau: diemDen.ngay_bat_dau,
      ngay_ket_thuc: diemDen.ngay_ket_thuc,
      ghi_chu: diemDen.ghi_chu
    })
    setShowEditDiemDenModal(true)
  }

  // Hàm mở modal chỉnh sửa lịch trình
  const handleOpenEditLichTrinh = (diemDen: DiemDen) => {
    setShowEditLichTrinhModal(true)
  }

  // Hàm xử lý cập nhật lịch trình
  const handleUpdateLichTrinh = async () => {
    if (!editingLichTrinh) return false

    if (!editLichTrinhForm.tieu_de.trim()) {
      toast({
        title: "Lỗi",
        description: "Vui lòng nhập tiêu đề",
        variant: "destructive",
      })
      return false
    }

    if (!editLichTrinhForm.ngay) {
      toast({
        title: "Lỗi",
        description: "Vui lòng chọn ngày",
        variant: "destructive",
      })
      return false
    }

    // Lấy lich_trinh_ngay_id từ editingLichTrinh
    // Nếu không có, sử dụng lich_trinh_id
    const lichTrinhNgayId = (editingLichTrinh as any).lich_trinh_ngay_id || editingLichTrinh.lich_trinh_id

    setIsUpdatingLichTrinh(true)
    const apiResult = await updateLichTrinhToAPI(lichTrinhNgayId, {
      ngay: editLichTrinhForm.ngay,
      tieu_de: editLichTrinhForm.tieu_de.trim(),
      ghi_chu: editLichTrinhForm.ghi_chu,
      gio_bat_dau: editLichTrinhForm.gio_bat_dau,
      gio_ket_thuc: editLichTrinhForm.gio_ket_thuc,
    })
    setIsUpdatingLichTrinh(false)

    if (!apiResult.success) {
      toast({
        title: "Lỗi",
        description: apiResult.error || "Không thể cập nhật lịch trình. Vui lòng thử lại.",
        variant: "destructive",
      })
      return false
    }

    // Cập nhật state
    const updatedLichTrinh = apiResult.lich_trinh
    setLichTrinhList(prevList =>
      prevList.map(lt =>
        lt.lich_trinh_id === editingLichTrinh.lich_trinh_id
          ? {
              ...lt,
              ngay: updatedLichTrinh?.ngay || editLichTrinhForm.ngay,
              tieu_de: updatedLichTrinh?.tieu_de || editLichTrinhForm.tieu_de.trim(),
              ghi_chu: updatedLichTrinh?.ghi_chu || editLichTrinhForm.ghi_chu,
              gio_bat_dau: updatedLichTrinh?.gio_bat_dau || editLichTrinhForm.gio_bat_dau,
              gio_ket_thuc: updatedLichTrinh?.gio_ket_thuc || editLichTrinhForm.gio_ket_thuc,
            }
          : lt
      )
    )

    toast({
      title: "Thành công",
      description: "Đã cập nhật lịch trình",
    })

    setShowEditLichTrinhModal(false)
    setEditingLichTrinh(null)
    setEditLichTrinhForm({
      diem_den_id: 0,
      ngay: "",
      tieu_de: "",
      ghi_chu: "",
      gio_bat_dau: "",
      gio_ket_thuc: ""
    })

    return true
  }

  // Hàm mở modal chỉnh sửa chi phí
  const handleOpenEditChiPhi = (diemDen: DiemDen) => {
    setShowEditChiPhiModal(true)
  }

  // Hàm xử lý cập nhật chi phí
  const handleUpdateChiPhi = async () => {
    if (!editingChiPhi) return false

    if (!editChiPhiForm.mo_ta.trim()) {
      toast({
        title: "Lỗi",
        description: "Vui lòng nhập mô tả",
        variant: "destructive",
      })
      return false
    }

    if (!editChiPhiForm.so_tien || editChiPhiForm.so_tien <= 0) {
      toast({
        title: "Lỗi",
        description: "Vui lòng nhập số tiền hợp lệ",
        variant: "destructive",
      })
      return false
    }

    if (!editChiPhiForm.nhom) {
      toast({
        title: "Lỗi",
        description: "Vui lòng chọn nhóm chi phí",
        variant: "destructive",
      })
      return false
    }

    if (!editChiPhiForm.ngay) {
      toast({
        title: "Lỗi",
        description: "Vui lòng chọn ngày",
        variant: "destructive",
      })
      return false
    }

    setIsUpdatingChiPhi(true)
    const apiResult = await updateChiPhiToAPI(editingChiPhi.chi_phi_id, {
      diem_den_id: editChiPhiForm.diem_den_id,
      so_tien: editChiPhiForm.so_tien,
      mo_ta: editChiPhiForm.mo_ta.trim(),
      nhom: editChiPhiForm.nhom,
      ngay: editChiPhiForm.ngay,
    })
    setIsUpdatingChiPhi(false)

    if (!apiResult.success) {
      toast({
        title: "Lỗi",
        description: apiResult.error || "Không thể cập nhật chi phí. Vui lòng thử lại.",
        variant: "destructive",
      })
      return false
    }

    // Cập nhật state
    const updatedChiPhi = apiResult.chi_phi
    setChiPhiList(prevList =>
      prevList.map(cp =>
        cp.chi_phi_id === editingChiPhi.chi_phi_id
          ? {
              ...cp,
              diem_den_id: updatedChiPhi?.diem_den_id || editChiPhiForm.diem_den_id,
              so_tien: updatedChiPhi?.so_tien || editChiPhiForm.so_tien,
              mo_ta: updatedChiPhi?.mo_ta || editChiPhiForm.mo_ta.trim(),
              nhom: updatedChiPhi?.nhom || editChiPhiForm.nhom,
              ngay: updatedChiPhi?.ngay || editChiPhiForm.ngay,
            }
          : cp
      )
    )

    toast({
      title: "Thành công",
      description: "Đã cập nhật chi phí",
    })

    setShowEditChiPhiModal(false)
    setEditingChiPhi(null)
    setEditChiPhiForm({
      diem_den_id: 0,
      lich_trinh_id: 0,
      nguoi_chi_id: 0,
      nguoi_chi_ten: "",
      so_tien: 0,
      mo_ta: "",
      nhom: "",
      ngay: ""
    })

    return true
  }

  // Hàm xử lý cập nhật điểm đến
  const handleUpdateDiemDen = async () => {
    if (!editingDiemDen) return false

    if (!editDiemDenForm.ten_diem_den.trim()) {
      toast({
        title: "Lỗi",
        description: "Vui lòng nhập tên điểm đến",
        variant: "destructive",
      })
      return false
    }

    setIsUpdatingDiemDen(true)
    const apiResult = await updateDiemDenToAPI(editingDiemDen.diem_den_id, {
      ten_diem_den: editDiemDenForm.ten_diem_den.trim(),
      ngay_bat_dau: editDiemDenForm.ngay_bat_dau,
      ngay_ket_thuc: editDiemDenForm.ngay_ket_thuc,
      ghi_chu: editDiemDenForm.ghi_chu,
    })
    setIsUpdatingDiemDen(false)

    if (!apiResult.success) {
      toast({
        title: "Lỗi",
        description: apiResult.error || "Không thể cập nhật điểm đến. Vui lòng thử lại.",
        variant: "destructive",
      })
      return false
    }

    // Cập nhật state
    const updatedDiemDen = apiResult.diem_den
    setDiemDenList(prevList =>
      prevList.map(dd =>
        dd.diem_den_id === editingDiemDen.diem_den_id
          ? {
            ...dd,
            ten_diem_den: updatedDiemDen?.ten_diem_den || editDiemDenForm.ten_diem_den.trim(),
            ngay_bat_dau: updatedDiemDen?.ngay_bat_dau || editDiemDenForm.ngay_bat_dau,
            ngay_ket_thuc: updatedDiemDen?.ngay_ket_thuc || editDiemDenForm.ngay_ket_thuc,
            ghi_chu: updatedDiemDen?.ghi_chu || editDiemDenForm.ghi_chu,
          }
          : dd
      )
    )

    toast({
      title: "Thành công",
      description: "Đã cập nhật điểm đến",
    })

    setShowEditDiemDenModal(false)
    setEditingDiemDen(null)
    setEditDiemDenForm({
      ten_diem_den: "",
      ngay_bat_dau: "",
      ngay_ket_thuc: "",
      ghi_chu: ""
    })

    return true
  }

  // Handle Diem Den - Chỉ thêm vào danh sách, không đóng modal (dùng cho nút "Tiếp theo")
  const handleDiemDenNext = async (): Promise<boolean> => {
    if (!diemDenForm.ten_diem_den.trim()) {
      toast({
        title: "Lỗi",
        description: "Vui lòng chọn tên điểm đến",
        variant: "destructive",
      })
      return false
    }

    // Kiểm tra ngày của điểm đến phải nằm trong khoảng ngày của chuyến đi
    if (tripInfo?.ngay_bat_dau && tripInfo?.ngay_ket_thuc) {
      if (diemDenForm.ngay_bat_dau || diemDenForm.ngay_ket_thuc) {
        try {
          const tripStartDate = new Date(tripInfo.ngay_bat_dau)
          tripStartDate.setHours(0, 0, 0, 0)
          const tripEndDate = new Date(tripInfo.ngay_ket_thuc)
          tripEndDate.setHours(0, 0, 0, 0)

          if (diemDenForm.ngay_bat_dau) {
            const diemDenStartDate = new Date(diemDenForm.ngay_bat_dau)
            if (isNaN(diemDenStartDate.getTime())) {
              toast({
                title: "Lỗi",
                description: "Ngày bắt đầu của điểm đến không hợp lệ",
                variant: "destructive",
              })
              return false
            }
            diemDenStartDate.setHours(0, 0, 0, 0)

            if (diemDenStartDate.getTime() < tripStartDate.getTime()) {
              toast({
                title: "Lỗi",
                description: `Ngày bắt đầu của điểm đến (${diemDenStartDate.toLocaleDateString("vi-VN")}) phải lớn hơn hoặc bằng ngày bắt đầu chuyến đi (${tripStartDate.toLocaleDateString("vi-VN")})`,
                variant: "destructive",
              })
              return false
            }

            if (diemDenStartDate.getTime() > tripEndDate.getTime()) {
              toast({
                title: "Lỗi",
                description: `Ngày bắt đầu của điểm đến (${diemDenStartDate.toLocaleDateString("vi-VN")}) phải nhỏ hơn hoặc bằng ngày kết thúc chuyến đi (${tripEndDate.toLocaleDateString("vi-VN")})`,
                variant: "destructive",
              })
              return false
            }
          }

          if (diemDenForm.ngay_ket_thuc) {
            const diemDenEndDate = new Date(diemDenForm.ngay_ket_thuc)
            if (isNaN(diemDenEndDate.getTime())) {
              toast({
                title: "Lỗi",
                description: "Ngày kết thúc của điểm đến không hợp lệ",
                variant: "destructive",
              })
              return false
            }
            diemDenEndDate.setHours(0, 0, 0, 0)

            if (diemDenEndDate.getTime() < tripStartDate.getTime()) {
              toast({
                title: "Lỗi",
                description: `Ngày kết thúc của điểm đến (${diemDenEndDate.toLocaleDateString("vi-VN")}) phải lớn hơn hoặc bằng ngày bắt đầu chuyến đi (${tripStartDate.toLocaleDateString("vi-VN")})`,
                variant: "destructive",
              })
              return false
            }

            if (diemDenEndDate.getTime() > tripEndDate.getTime()) {
              toast({
                title: "Lỗi",
                description: `Ngày kết thúc của điểm đến (${diemDenEndDate.toLocaleDateString("vi-VN")}) phải nhỏ hơn hoặc bằng ngày kết thúc chuyến đi (${tripEndDate.toLocaleDateString("vi-VN")})`,
                variant: "destructive",
              })
              return false
            }
          }

          // Kiểm tra ngày bắt đầu <= ngày kết thúc của điểm đến
          if (diemDenForm.ngay_bat_dau && diemDenForm.ngay_ket_thuc) {
            const diemDenStartDate = new Date(diemDenForm.ngay_bat_dau)
            diemDenStartDate.setHours(0, 0, 0, 0)
            const diemDenEndDate = new Date(diemDenForm.ngay_ket_thuc)
            diemDenEndDate.setHours(0, 0, 0, 0)

            if (diemDenStartDate.getTime() > diemDenEndDate.getTime()) {
              toast({
                title: "Lỗi",
                description: "Ngày bắt đầu của điểm đến phải nhỏ hơn hoặc bằng ngày kết thúc",
                variant: "destructive",
              })
              return false
            }
          }
        } catch (error) {
          console.error("Lỗi khi kiểm tra ngày điểm đến:", error)
          toast({
            title: "Lỗi",
            description: "Có lỗi khi kiểm tra ngày. Vui lòng thử lại.",
            variant: "destructive",
          })
          return false
        }
      }
    }

    // Tự động tính địa điểm xuất phát theo logic backend:
    // - Điểm đến đầu tiên (diemDenList.length === 0): gửi tripInfo.dia_diem_xuat_phat
    // - Điểm đến sau: gửi empty string để backend tự lấy từ điểm đến trước đó trong database
    let diaDiemXuatPhat = ""
      if (diemDenList.length === 0) {
      // Điểm đầu tiên: gửi địa điểm xuất phát của chuyến đi
        diaDiemXuatPhat = tripInfo?.dia_diem_xuat_phat || ""
      } else {
      // Điểm sau: gửi empty string, backend sẽ tự lấy từ điểm đến trước đó
      diaDiemXuatPhat = ""
    }

    // Gọi API để lưu điểm đến
    setIsSavingDiemDen(true)
    const apiResult = await saveDiemDenToAPI({
      ten_diem_den: diemDenForm.ten_diem_den.trim(),
            ngay_bat_dau: diemDenForm.ngay_bat_dau,
            ngay_ket_thuc: diemDenForm.ngay_ket_thuc,
            ghi_chu: diemDenForm.ghi_chu,
      dia_diem_xuat_phat: diaDiemXuatPhat,
    })
    setIsSavingDiemDen(false)

    if (!apiResult.success) {
          toast({
        title: "Lỗi",
        description: apiResult.error || "Không thể lưu điểm đến. Vui lòng thử lại.",
        variant: "destructive",
          })
      return false
    }

    // Sử dụng dữ liệu từ API response (backend đã tự động tính dia_diem_xuat_phat)
    const savedDiemDen = apiResult.diem_den
    const newDiemDen: DiemDen = {
      diem_den_id: savedDiemDen.id || savedDiemDen.diem_den_id || diemDenIdCounter,
      ten_diem_den: savedDiemDen.ten_diem_den || diemDenForm.ten_diem_den.trim(),
      thu_tu: savedDiemDen.thu_tu || diemDenForm.thu_tu,
      ngay_bat_dau: savedDiemDen.ngay_bat_dau || diemDenForm.ngay_bat_dau,
      ngay_ket_thuc: savedDiemDen.ngay_ket_thuc || diemDenForm.ngay_ket_thuc,
      dia_diem_xuat_phat: savedDiemDen.dia_diem_xuat_phat || "", // Lấy từ backend response (đã được tính tự động)
      ghi_chu: savedDiemDen.ghi_chu || diemDenForm.ghi_chu,
    }

    // Lưu ID của điểm đến vừa thêm để sử dụng sau
    const newDiemDenId = newDiemDen.diem_den_id

    setDiemDenList([...diemDenList, newDiemDen])
    setDiemDenIdCounter(diemDenIdCounter + 1)
    
    toast({
      title: "Thành công",
      description: "Đã lưu điểm đến",
    })

    // Chuyển sang tab "Lịch trình"
    setActiveTab("lich-trinh")
    // Tự động chọn điểm đến vừa thêm trong tab "Lịch trình"
    setLichTrinhForm(prev => ({
      ...prev,
      diem_den_id: newDiemDenId
    }))

    return true
  }

  // Handle Lich Trinh - Frontend only
  const handleLichTrinhSubmit = async (): Promise<boolean> => {
    if (!lichTrinhForm.tieu_de.trim()) {
      toast({
        title: "Lỗi",
        description: "Vui lòng nhập tiêu đề",
        variant: "destructive",
      })
      return false
    }

    if (!lichTrinhForm.diem_den_id) {
      toast({
        title: "Lỗi",
        description: "Vui lòng chọn điểm đến",
        variant: "destructive",
      })
      return false
    }

    if (!lichTrinhForm.ngay) {
      toast({
        title: "Lỗi",
        description: "Vui lòng chọn ngày",
        variant: "destructive",
      })
      return false
    }

    // Nếu chọn điểm đến đang điền (value = -1), chuẩn bị điểm đến để kiểm tra validation trước
    let finalDiemDenId = lichTrinhForm.diem_den_id
    let selectedDiemDen: DiemDen | null = null
    let newDiemDenToAdd: DiemDen | null = null
    
    if (lichTrinhForm.diem_den_id === -1) {
      if (!diemDenForm.ten_diem_den.trim()) {
        toast({
          title: "Lỗi",
          description: "Vui lòng điền thông tin điểm đến ở tab 'Điểm đến' trước",
          variant: "destructive",
        })
        return false
      }

      // Chuẩn bị điểm đến để kiểm tra validation (chưa thêm vào danh sách)
      const autoDiaDiemXuatPhat = diemDenList.length === 0
        ? tripInfo?.dia_diem_xuat_phat || ""
        : diemDenList[diemDenList.length - 1]?.ten_diem_den || ""

      newDiemDenToAdd = {
        diem_den_id: diemDenIdCounter, // Tạm thời dùng ID từ counter, sẽ cập nhật sau
        ten_diem_den: diemDenForm.ten_diem_den.trim(),
        thu_tu: diemDenForm.thu_tu,
        ngay_bat_dau: diemDenForm.ngay_bat_dau,
        ngay_ket_thuc: diemDenForm.ngay_ket_thuc,
        dia_diem_xuat_phat: diemDenForm.dia_diem_xuat_phat || autoDiaDiemXuatPhat,
        ghi_chu: diemDenForm.ghi_chu,
      }

      selectedDiemDen = newDiemDenToAdd
    } else {
      // Tìm điểm đến được chọn từ danh sách
      selectedDiemDen = diemDenList.find(d => d.diem_den_id === finalDiemDenId) || null
    }

    // Kiểm tra ngày lịch trình có nằm trong khoảng ngày của điểm đến không
    if (!selectedDiemDen) {
      toast({
        title: "Lỗi",
        description: "Không tìm thấy thông tin điểm đến. Vui lòng chọn lại điểm đến.",
        variant: "destructive",
      })
      return false
    }

    // Kiểm tra nếu điểm đến có ngày bắt đầu hoặc ngày kết thúc
    if (selectedDiemDen.ngay_bat_dau || selectedDiemDen.ngay_ket_thuc) {
      try {
        // Reset time về 00:00:00 để so sánh chỉ ngày
        const ngayLichTrinh = new Date(lichTrinhForm.ngay)
        if (isNaN(ngayLichTrinh.getTime())) {
          toast({
            title: "Lỗi",
            description: "Ngày lịch trình không hợp lệ",
            variant: "destructive",
          })
          return false
        }
        ngayLichTrinh.setHours(0, 0, 0, 0)
        
        if (selectedDiemDen.ngay_bat_dau) {
          const ngayBatDau = new Date(selectedDiemDen.ngay_bat_dau)
          if (isNaN(ngayBatDau.getTime())) {
            // Nếu ngày bắt đầu không hợp lệ, bỏ qua validation này
          } else {
            ngayBatDau.setHours(0, 0, 0, 0)
            
            if (ngayLichTrinh.getTime() < ngayBatDau.getTime()) {
              toast({
                title: "Lỗi",
                description: `Ngày lịch trình (${ngayLichTrinh.toLocaleDateString("vi-VN")}) phải lớn hơn hoặc bằng ngày bắt đầu của điểm đến "${selectedDiemDen.ten_diem_den}" (${ngayBatDau.toLocaleDateString("vi-VN")})`,
                variant: "destructive",
              })
              return false
            }
          }
        }

        if (selectedDiemDen.ngay_ket_thuc) {
          const ngayKetThuc = new Date(selectedDiemDen.ngay_ket_thuc)
          if (isNaN(ngayKetThuc.getTime())) {
            // Nếu ngày kết thúc không hợp lệ, bỏ qua validation này
          } else {
            ngayKetThuc.setHours(0, 0, 0, 0)
            
            if (ngayLichTrinh.getTime() > ngayKetThuc.getTime()) {
              toast({
                title: "Lỗi",
                description: `Ngày lịch trình (${ngayLichTrinh.toLocaleDateString("vi-VN")}) phải nhỏ hơn hoặc bằng ngày kết thúc của điểm đến "${selectedDiemDen.ten_diem_den}" (${ngayKetThuc.toLocaleDateString("vi-VN")})`,
                variant: "destructive",
              })
              return false
            }
          }
        }
      } catch (error) {
        console.error("Lỗi khi kiểm tra ngày lịch trình:", error)
        toast({
          title: "Lỗi",
          description: "Có lỗi khi kiểm tra ngày. Vui lòng thử lại.",
          variant: "destructive",
        })
        return false
      }
    }

    // Nếu có điểm đến mới cần thêm (đã pass validation), thêm vào danh sách
    if (newDiemDenToAdd) {
      setDiemDenList([...diemDenList, newDiemDenToAdd])
      finalDiemDenId = newDiemDenToAdd.diem_den_id
      setDiemDenIdCounter(diemDenIdCounter + 1)
    }

    // Đảm bảo finalDiemDenId hợp lệ
    if (!finalDiemDenId || finalDiemDenId === 0) {
      toast({
        title: "Lỗi",
        description: "Vui lòng chọn điểm đến",
        variant: "destructive",
      })
      return false
    }

    // Kiểm tra trùng lặp thời gian với các lịch trình khác trong cùng ngày
    if (lichTrinhForm.gio_bat_dau && lichTrinhForm.gio_ket_thuc) {
      // Tìm các lịch trình trong cùng ngày và cùng điểm đến
      const lichTrinhTrungNgay = lichTrinhList.filter(lt => 
        lt.ngay === lichTrinhForm.ngay && 
        lt.diem_den_id === finalDiemDenId &&
        lt.gio_bat_dau && 
        lt.gio_ket_thuc
      )

      // Chuyển đổi giờ sang phút để so sánh dễ dàng
      const timeToMinutes = (time: string): number => {
        const [hours, minutes] = time.split(':').map(Number)
        return hours * 60 + minutes
      }

      const gioBatDauMinutes = timeToMinutes(lichTrinhForm.gio_bat_dau)
      const gioKetThucMinutes = timeToMinutes(lichTrinhForm.gio_ket_thuc)

      // Kiểm tra giờ bắt đầu phải nhỏ hơn giờ kết thúc
      if (gioBatDauMinutes >= gioKetThucMinutes) {
        toast({
          title: "Lỗi",
          description: "Giờ bắt đầu phải nhỏ hơn giờ kết thúc",
          variant: "destructive",
        })
        return false
      }

      // Kiểm tra trùng lặp với từng lịch trình
      for (const lt of lichTrinhTrungNgay) {
        if (lt.gio_bat_dau && lt.gio_ket_thuc) {
          const ltGioBatDauMinutes = timeToMinutes(lt.gio_bat_dau)
          const ltGioKetThucMinutes = timeToMinutes(lt.gio_ket_thuc)

          // Kiểm tra trùng lặp: (start1 < end2 && end1 > start2)
          if (gioBatDauMinutes < ltGioKetThucMinutes && gioKetThucMinutes > ltGioBatDauMinutes) {
            toast({
              title: "Lỗi",
              description: `Thời gian trùng lặp với lịch trình "${lt.tieu_de}" (${lt.gio_bat_dau} - ${lt.gio_ket_thuc}). Vui lòng chọn thời gian khác.`,
              variant: "destructive",
            })
            return false
          }
        }
      }
    }

    // Gọi API để lưu lịch trình
    setIsSavingLichTrinh(true)
    const apiResult = await saveLichTrinhToAPI({
      diem_den_id: Number(finalDiemDenId),
      ngay: lichTrinhForm.ngay,
      tieu_de: lichTrinhForm.tieu_de.trim(),
      gio_bat_dau: lichTrinhForm.gio_bat_dau,
      gio_ket_thuc: lichTrinhForm.gio_ket_thuc,
      ghi_chu: lichTrinhForm.ghi_chu,
    })
    setIsSavingLichTrinh(false)

    if (!apiResult.success) {
      toast({
        title: "Lỗi",
        description: apiResult.error || "Có lỗi xảy ra khi lưu lịch trình",
        variant: "destructive",
      })
      return false
    }

    // Tạo lịch trình từ dữ liệu API response
    const savedLichTrinh = apiResult.lich_trinh
    const newLichTrinh: LichTrinh = {
      lich_trinh_id: savedLichTrinh?.lich_trinh_id || savedLichTrinh?.id || lichTrinhIdCounter,
      diem_den_id: Number(finalDiemDenId),
      ngay: savedLichTrinh?.ngay || lichTrinhForm.ngay,
      tieu_de: savedLichTrinh?.tieu_de || lichTrinhForm.tieu_de.trim(),
      ghi_chu: savedLichTrinh?.ghi_chu || lichTrinhForm.ghi_chu,
      gio_bat_dau: savedLichTrinh?.gio_bat_dau || lichTrinhForm.gio_bat_dau,
      gio_ket_thuc: savedLichTrinh?.gio_ket_thuc || lichTrinhForm.gio_ket_thuc,
    }

    // Debug: Kiểm tra dữ liệu trước khi thêm
    console.log("🔍 Debug - Thêm lịch trình:", {
      newLichTrinh,
      savedLichTrinh,
      finalDiemDenId,
      currentLichTrinhList: lichTrinhList,
      diemDenList: diemDenList,
      diemDenListIds: diemDenList.map(d => d.diem_den_id)
    })

    setLichTrinhList([...lichTrinhList, newLichTrinh])
    setLichTrinhIdCounter(lichTrinhIdCounter + 1)
    
    toast({
      title: "Thành công",
      description: `Đã thêm lịch trình: ${newLichTrinh.tieu_de}${newLichTrinh.ngay ? ` (${newLichTrinh.ngay})` : ''}`,
    })

    // Reset form nhưng giữ lại diem_den_id để có thể dùng cho tab tiếp theo
    setLichTrinhForm({
      diem_den_id: Number(finalDiemDenId), // Giữ lại điểm đến đã chọn
      ngay: "",
      tieu_de: "",
      ghi_chu: "",
      gio_bat_dau: "",
      gio_ket_thuc: ""
    })
    
    // Trả về true để báo submit thành công
    return true
  }

  // Handle Lich Trinh - Thêm lịch trình nhưng không chuyển tab (dùng cho nút "Thêm lịch trình khác")
  const handleLichTrinhAdd = async (): Promise<boolean> => {
    const success = await handleLichTrinhSubmit()
    // Không chuyển tab, chỉ reset form (diem_den_id đã được giữ lại trong handleLichTrinhSubmit)
    return success
  }

  // Handle Lich Trinh - Chỉ thêm vào danh sách, không đóng modal (dùng cho nút "Tiếp theo")
  const handleLichTrinhNext = async (): Promise<boolean> => {
    // Lưu diem_den_id trước khi submit (vì form sẽ bị reset)
    const savedDiemDenId = lichTrinhForm.diem_den_id
    
    const success = await handleLichTrinhSubmit()
    if (success) {
      // Chuyển sang tab "Chi phí"
      setActiveTab("chi-phi")
      // Tự động set điểm đến trong tab "Chi phí" dựa trên diemDenForm.ten_diem_den
      // Tìm điểm đến trong danh sách hoặc dùng -1 nếu chưa được lưu
      if (diemDenForm.ten_diem_den) {
        const foundDiemDen = diemDenList.find(
          dd => dd.ten_diem_den.trim().toLowerCase() === diemDenForm.ten_diem_den.trim().toLowerCase()
        )
        setChiPhiForm(prev => ({
          ...prev,
          diem_den_id: foundDiemDen ? foundDiemDen.diem_den_id : -1
        }))
      } else if (savedDiemDenId) {
        setChiPhiForm(prev => ({
          ...prev,
          diem_den_id: savedDiemDenId
        }))
      }
    }
    return success
  }

  // Tự động cập nhật điểm đến trong tab "Chi phí" khi diemDenForm.ten_diem_den thay đổi
  useEffect(() => {
    if (activeTab === "chi-phi" && diemDenForm.ten_diem_den) {
      // Tìm điểm đến trong danh sách hoặc dùng -1 nếu chưa được lưu
      const foundDiemDen = diemDenList.find(
        dd => dd.ten_diem_den.trim().toLowerCase() === diemDenForm.ten_diem_den.trim().toLowerCase()
      )
      setChiPhiForm(prev => ({
        ...prev,
        diem_den_id: foundDiemDen ? foundDiemDen.diem_den_id : -1
      }))
    }
  }, [diemDenForm.ten_diem_den, activeTab, diemDenList])

  // Handle Chi Phi - Gọi API để lưu chi phí
  const handleChiPhiSubmit = async (): Promise<boolean> => {
    if (!chiPhiForm.mo_ta.trim()) {
      toast({
        title: "Lỗi",
        description: "Vui lòng nhập mô tả",
        variant: "destructive",
      })
      return false
    }

    if (!chiPhiForm.diem_den_id) {
      toast({
        title: "Lỗi",
        description: "Vui lòng chọn điểm đến",
        variant: "destructive",
      })
      return false
    }

    // Kiểm tra tên người chi từ form hoặc từ tripOwner
    const nguoiChiTen = chiPhiForm.nguoi_chi_ten.trim() || tripOwner?.ho_ten || ""
    if (!nguoiChiTen) {
      toast({
        title: "Lỗi",
        description: "Không tìm thấy thông tin chủ chuyến đi. Vui lòng thử lại.",
        variant: "destructive",
      })
      return false
    }

    if (chiPhiForm.so_tien <= 0) {
      toast({
        title: "Lỗi",
        description: "Vui lòng nhập số tiền hợp lệ",
        variant: "destructive",
      })
      return false
    }

    if (!chiPhiForm.ngay) {
      toast({
        title: "Lỗi",
        description: "Vui lòng chọn ngày",
        variant: "destructive",
      })
      return false
    }

    // Nếu chọn điểm đến đang điền (value = -1), chuẩn bị điểm đến để kiểm tra validation trước
    let finalDiemDenId = chiPhiForm.diem_den_id
    let selectedDiemDen: DiemDen | null = null
    let newDiemDenToAdd: DiemDen | null = null
    
    if (chiPhiForm.diem_den_id === -1) {
      if (!diemDenForm.ten_diem_den.trim()) {
        toast({
          title: "Lỗi",
          description: "Vui lòng điền thông tin điểm đến ở tab 'Điểm đến' trước",
          variant: "destructive",
        })
        return false
      }

      // Chuẩn bị điểm đến để kiểm tra validation (chưa thêm vào danh sách)
      const autoDiaDiemXuatPhat = diemDenList.length === 0
        ? tripInfo?.dia_diem_xuat_phat || ""
        : diemDenList[diemDenList.length - 1]?.ten_diem_den || ""

      newDiemDenToAdd = {
        diem_den_id: diemDenIdCounter,
        ten_diem_den: diemDenForm.ten_diem_den.trim(),
        thu_tu: diemDenForm.thu_tu,
        ngay_bat_dau: diemDenForm.ngay_bat_dau,
        ngay_ket_thuc: diemDenForm.ngay_ket_thuc,
        dia_diem_xuat_phat: diemDenForm.dia_diem_xuat_phat || autoDiaDiemXuatPhat,
        ghi_chu: diemDenForm.ghi_chu,
      }

      selectedDiemDen = newDiemDenToAdd
    } else {
      // Tìm điểm đến được chọn từ danh sách
      selectedDiemDen = diemDenList.find(d => d.diem_den_id === finalDiemDenId) || null
    }

    // Kiểm tra ngày chi phí có nằm trong khoảng ngày của điểm đến không
    if (!selectedDiemDen) {
      toast({
        title: "Lỗi",
        description: "Không tìm thấy thông tin điểm đến. Vui lòng chọn lại điểm đến.",
        variant: "destructive",
      })
      return false
    }

    // Kiểm tra nếu điểm đến có ngày bắt đầu hoặc ngày kết thúc
    if (selectedDiemDen.ngay_bat_dau || selectedDiemDen.ngay_ket_thuc) {
      try {
        // Reset time về 00:00:00 để so sánh chỉ ngày
        const ngayChiPhi = new Date(chiPhiForm.ngay)
        if (isNaN(ngayChiPhi.getTime())) {
          toast({
            title: "Lỗi",
            description: "Ngày chi phí không hợp lệ",
            variant: "destructive",
          })
          return false
        }
        ngayChiPhi.setHours(0, 0, 0, 0)
        
        if (selectedDiemDen.ngay_bat_dau) {
          const ngayBatDau = new Date(selectedDiemDen.ngay_bat_dau)
          if (isNaN(ngayBatDau.getTime())) {
            // Nếu ngày bắt đầu không hợp lệ, bỏ qua validation này
          } else {
            ngayBatDau.setHours(0, 0, 0, 0)
            
            if (ngayChiPhi.getTime() < ngayBatDau.getTime()) {
              toast({
                title: "Lỗi",
                description: `Ngày chi phí (${ngayChiPhi.toLocaleDateString("vi-VN")}) phải lớn hơn hoặc bằng ngày bắt đầu của điểm đến "${selectedDiemDen.ten_diem_den}" (${ngayBatDau.toLocaleDateString("vi-VN")})`,
                variant: "destructive",
              })
              return false
            }
          }
        }

        if (selectedDiemDen.ngay_ket_thuc) {
          const ngayKetThuc = new Date(selectedDiemDen.ngay_ket_thuc)
          if (isNaN(ngayKetThuc.getTime())) {
            // Nếu ngày kết thúc không hợp lệ, bỏ qua validation này
          } else {
            ngayKetThuc.setHours(0, 0, 0, 0)
            
            if (ngayChiPhi.getTime() > ngayKetThuc.getTime()) {
              toast({
                title: "Lỗi",
                description: `Ngày chi phí (${ngayChiPhi.toLocaleDateString("vi-VN")}) phải nhỏ hơn hoặc bằng ngày kết thúc của điểm đến "${selectedDiemDen.ten_diem_den}" (${ngayKetThuc.toLocaleDateString("vi-VN")})`,
                variant: "destructive",
              })
              return false
            }
          }
        }
      } catch (error) {
        console.error("Lỗi khi kiểm tra ngày chi phí:", error)
        toast({
          title: "Lỗi",
          description: "Có lỗi khi kiểm tra ngày. Vui lòng thử lại.",
          variant: "destructive",
        })
        return false
      }
    }

    // Nếu có điểm đến mới cần thêm (đã pass validation), thêm vào danh sách
    if (newDiemDenToAdd) {
      setDiemDenList([...diemDenList, newDiemDenToAdd])
      finalDiemDenId = newDiemDenToAdd.diem_den_id
      setDiemDenIdCounter(diemDenIdCounter + 1)
    }

    // Gọi API để lưu chi phí
    setIsSavingChiPhi(true)
    const apiResult = await saveChiPhiToAPI({
      diem_den_id: Number(finalDiemDenId),
      so_tien: chiPhiForm.so_tien,
      mo_ta: chiPhiForm.mo_ta.trim(),
      nhom: chiPhiForm.nhom,
      ngay: chiPhiForm.ngay || new Date().toISOString().split("T")[0],
    })
    setIsSavingChiPhi(false)

    if (!apiResult.success) {
          toast({
        title: "Lỗi",
        description: apiResult.error || "Có lỗi xảy ra khi lưu chi phí",
        variant: "destructive",
          })
      return false
    }

    // Tạo chi phí từ dữ liệu API response
    const savedChiPhi = apiResult.chi_phi
    const newChiPhi: ChiPhi = {
      chi_phi_id: savedChiPhi?.chi_phi_id || savedChiPhi?.id || chiPhiIdCounter,
      diem_den_id: Number(finalDiemDenId),
      lich_trinh_id: chiPhiForm.lich_trinh_id && chiPhiForm.lich_trinh_id !== 0 ? chiPhiForm.lich_trinh_id : undefined,
      nguoi_chi_id: chiPhiForm.nguoi_chi_id || tripOwner?.nguoi_dung_id || chiPhiIdCounter,
      nguoi_chi_ten: nguoiChiTen,
      so_tien: savedChiPhi?.so_tien || chiPhiForm.so_tien,
      mo_ta: savedChiPhi?.mo_ta || chiPhiForm.mo_ta.trim(),
      nhom: savedChiPhi?.nhom || chiPhiForm.nhom,
      ngay: savedChiPhi?.ngay || chiPhiForm.ngay || new Date().toISOString().split("T")[0],
    }

    setChiPhiList([...chiPhiList, newChiPhi])
    setChiPhiIdCounter(chiPhiIdCounter + 1)
    
    toast({
      title: "Thành công",
      description: `Đã thêm chi phí: ${newChiPhi.mo_ta} - ${formatCurrency(newChiPhi.so_tien)} VNĐ`,
    })

    // Reset form sau khi thêm thành công nhưng giữ lại diem_den_id để có thể thêm nhiều chi phí
    // KHÔNG giữ lại lich_trinh_id vì lịch trình đã có chi phí không thể chọn lại
    setChiPhiForm({
      diem_den_id: finalDiemDenId, // Giữ lại điểm đến đã chọn
      lich_trinh_id: 0, // Reset lịch trình về 0 (lịch trình đã có chi phí không thể chọn lại)
      nguoi_chi_id: chiPhiForm.nguoi_chi_id || tripOwner?.nguoi_dung_id || 0,
      nguoi_chi_ten: nguoiChiTen,
      so_tien: 0,
      mo_ta: "",
      nhom: chiPhiForm.nhom || "", // Giữ lại nhóm đã chọn
      ngay: chiPhiForm.ngay || "" // Giữ lại ngày đã chọn
    })
    
    // Trả về true để báo submit thành công
    return true
  }

  // Handle Chi Phi - Thêm chi phí nhưng không đóng modal (dùng cho nút "Thêm chi phí khác")
  const handleChiPhiAdd = async (): Promise<boolean> => {
    const success = await handleChiPhiSubmit()
    // Không đóng modal, chỉ reset form (diem_den_id và lich_trinh_id đã được giữ lại trong handleChiPhiSubmit)
    return success
  }

  const getDiemDenName = (id: number) => {
    // Nếu là điểm đến đang điền (tạm thời)
    if (id === -1) {
      return diemDenForm.ten_diem_den || "Đang điền..."
    }
    const diemDen = diemDenList.find(d => d.diem_den_id === id)
    return diemDen?.ten_diem_den || "N/A"
  }

  const getMemberName = (id: number) => {
    // For frontend only, we'll use the stored name
    const chiPhi = chiPhiList.find(cp => cp.nguoi_chi_id === id)
    return chiPhi?.nguoi_chi_ten || `ID: ${id}`
  }

  // Group lịch trình và chi phí theo điểm đến
  const getLichTrinhByDiemDen = (diemDenId: number) => {
    return lichTrinhList.filter(lt => lt.diem_den_id === diemDenId)
  }

  const getChiPhiByDiemDen = (diemDenId: number) => {
    return chiPhiList.filter(cp => cp.diem_den_id === diemDenId)
  }

  // Get chi phí theo ngày và điểm đến
  const getChiPhiByNgay = (diemDenId: number, ngay: string) => {
    return chiPhiList.filter(cp => cp.diem_den_id === diemDenId && cp.ngay === ngay)
  }

  // Get chi phí theo lịch trình (chỉ lấy chi phí có lich_trinh_id trùng khớp)
  const getChiPhiByLichTrinh = (lichTrinhId: number) => {
    return chiPhiList.filter(cp => cp.lich_trinh_id === lichTrinhId)
  }

  // Nhóm lịch trình theo ngày
  const groupLichTrinhByNgay = (lichTrinhList: LichTrinh[]) => {
    const grouped: { [key: string]: LichTrinh[] } = {}
    lichTrinhList.forEach(lt => {
      if (!grouped[lt.ngay]) {
        grouped[lt.ngay] = []
      }
      grouped[lt.ngay].push(lt)
    })
    return grouped
  }

  // Xuất PDF
  const handleExportPDF = async () => {
    if (!pdfContentRef.current) {
      toast({
        title: "Lỗi",
        description: "Không tìm thấy nội dung để xuất PDF",
        variant: "destructive",
      })
      return
    }

    setIsExportingPDF(true)
    try {
      // Kiểm tra dữ liệu
      if (diemDenList.length === 0) {
        toast({
          title: "Cảnh báo",
          description: "Chưa có dữ liệu để xuất PDF",
          variant: "destructive",
        })
        setIsExportingPDF(false)
        return
      }

      // Tạm thời hiển thị phần PDF content để html2canvas có thể chụp
      const pdfElement = pdfContentRef.current
      if (!pdfElement) {
        toast({
          title: "Lỗi",
          description: "Không tìm thấy nội dung để xuất PDF",
          variant: "destructive",
        })
        setIsExportingPDF(false)
        return
      }

      const originalStyles = {
        position: pdfElement.style.position || '',
        left: pdfElement.style.left || '',
        top: pdfElement.style.top || '',
        visibility: pdfElement.style.visibility || '',
        opacity: pdfElement.style.opacity || '',
        zIndex: pdfElement.style.zIndex || '',
        width: pdfElement.style.width || '',
      }

      // Hiển thị tạm thời ở vị trí có thể chụp được
      pdfElement.style.position = 'fixed'
      pdfElement.style.left = '0'
      pdfElement.style.top = '0'
      pdfElement.style.visibility = 'visible'
      pdfElement.style.opacity = '1'
      pdfElement.style.zIndex = '99999'
      pdfElement.style.width = '210mm'
      pdfElement.style.backgroundColor = '#ffffff'

      // Đợi để render xong
      await new Promise(resolve => setTimeout(resolve, 300))

      // Tạo canvas từ HTML content (đã dùng inline styles nên không cần override CSS)
      const canvas = await html2canvas(pdfElement, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: "#ffffff",
        width: pdfElement.scrollWidth,
        height: pdfElement.scrollHeight,
      })

      // Khôi phục style ban đầu
      pdfElement.style.position = originalStyles.position || 'absolute'
      pdfElement.style.left = originalStyles.left || '-9999px'
      pdfElement.style.top = originalStyles.top || '0'
      pdfElement.style.visibility = originalStyles.visibility || 'hidden'
      pdfElement.style.opacity = originalStyles.opacity || ''
      pdfElement.style.zIndex = originalStyles.zIndex || '-1'
      pdfElement.style.width = originalStyles.width || '210mm'

      const imgData = canvas.toDataURL("image/png")
      
      // Tính toán kích thước PDF
      const imgWidth = 210 // A4 width in mm
      const pageHeight = 297 // A4 height in mm
      const imgHeight = (canvas.height * imgWidth) / canvas.width
      let heightLeft = imgHeight

      // Tạo PDF
      const pdf = new jsPDF("p", "mm", "a4")
      let position = 0

      // Thêm trang đầu tiên
      pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight)
      heightLeft -= pageHeight

      // Thêm các trang tiếp theo nếu cần
      while (heightLeft > 0) {
        position = heightLeft - imgHeight
        pdf.addPage()
        pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight)
        heightLeft -= pageHeight
      }

      // Lấy tên chuyến đi từ tripInfo hoặc tripId
      const fileName = `ke-hoach-chuyen-di-${tripId}-${new Date().toISOString().split("T")[0]}.pdf`
      
      // Tải xuống PDF
      pdf.save(fileName)

      toast({
        title: "Thành công",
        description: "Đã xuất PDF kế hoạch chuyến đi",
      })
    } catch (error) {
      console.error("Lỗi khi xuất PDF:", error)
      toast({
        title: "Lỗi",
        description: "Không thể xuất PDF. Vui lòng thử lại.",
        variant: "destructive",
      })
    } finally {
      setIsExportingPDF(false)
    }
  }

  // Sort điểm đến theo thứ tự
  const sortedDiemDenList = [...diemDenList].sort((a, b) => a.thu_tu - b.thu_tu)

  return (
    <div className="space-y-6">
      {/* Header với nút Thêm kế hoạch */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Kế hoạch chuyến đi</h2>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            onClick={handleExportPDF}
            disabled={isExportingPDF || sortedDiemDenList.length === 0}
          >
            {isExportingPDF ? (
              <>
                <span className="mr-2">⏳</span>
                Đang xuất...
              </>
            ) : (
              <>
                <FileDown className="h-4 w-4 mr-2" />
                In PDF
              </>
            )}
          </Button>
         
          <Button 
            onClick={handleComparePlan}
            disabled={isLoadingCompare}
            variant="outline"
            className="border-primary/20 bg-gradient-to-r from-primary/5 to-primary/10 hover:from-primary/10 hover:to-primary/15 text-primary hover:text-primary/90 hover:border-primary/30 transition-all duration-200 shadow-sm hover:shadow-md"
          >
            {isLoadingCompare ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Đang so sánh...
              </>
            ) : (
              <>
                <GitCompare className="h-4 w-4 mr-2" />
                So sánh kế hoạch
              </>
            )}
          </Button>
          <Button 
          onClick={handleSaveOriginalPlan}
          disabled={isSavingOriginalPlan}
          variant="outline"
          className="border-primary/20 bg-gradient-to-r from-primary/5 to-primary/10 hover:from-primary/10 hover:to-primary/15 text-primary hover:text-primary/90 hover:border-primary/30 transition-all duration-200 shadow-sm hover:shadow-md"
        >
          {isSavingOriginalPlan ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Đang lưu...
            </>
          ) : (
            <>
              <Save className="h-4 w-4 mr-2" />
              Lưu kế hoạch gốc
            </>
          )}
        </Button>
        <Button onClick={() => setShowAddPlanModal(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Thêm kế hoạch
        </Button>
        </div>
      </div>

      {/* Nội dung để xuất PDF (ẩn các nút, chỉ hiển thị dữ liệu) */}
      <div 
        ref={pdfContentRef} 
        style={{ 
          position: 'absolute',
          left: '-9999px',
          top: '0',
          width: '210mm',
          backgroundColor: '#ffffff',
          visibility: 'hidden',
          zIndex: -1,
          color: '#000000',
          fontFamily: 'Arial, sans-serif'
        }}
      >
        <div style={{ padding: '32px', width: '210mm', minHeight: '297mm', backgroundColor: '#ffffff' }}>
          {/* Header PDF */}
          <div style={{ textAlign: 'center', marginBottom: '32px', borderBottom: '2px solid #d1d5db', paddingBottom: '16px' }}>
            <h1 style={{ fontSize: '30px', fontWeight: 'bold', color: '#1f2937', marginBottom: '8px' }}>Kế hoạch chuyến đi</h1>
            {tripInfo && (
              <div style={{ fontSize: '14px', color: '#4b5563' }}>
                {tripInfo.dia_diem_xuat_phat && (
                  <p style={{ margin: '4px 0' }}>Điểm xuất phát: {tripInfo.dia_diem_xuat_phat}</p>
                )}
                {tripInfo.ngay_bat_dau && tripInfo.ngay_ket_thuc && (
                  <p style={{ margin: '4px 0' }}>
                    Thời gian: {new Date(tripInfo.ngay_bat_dau).toLocaleDateString("vi-VN")} - {new Date(tripInfo.ngay_ket_thuc).toLocaleDateString("vi-VN")}
                  </p>
                )}
                <p style={{ fontSize: '12px', color: '#6b7280', marginTop: '8px' }}>
                  Xuất ngày: {new Date().toLocaleDateString("vi-VN")} {new Date().toLocaleTimeString("vi-VN")}
                </p>
              </div>
            )}
          </div>

          {/* Nội dung kế hoạch */}
          {diemDenList.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '32px 0', color: '#6b7280' }}>
              <p>Chưa có điểm đến nào trong kế hoạch.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              {[...diemDenList].sort((a, b) => a.thu_tu - b.thu_tu).map((diemDen, index) => {
                const lichTrinhOfDiemDen = getLichTrinhByDiemDen(diemDen.diem_den_id)
                const chiPhiOfDiemDen = getChiPhiByDiemDen(diemDen.diem_den_id)
                const totalChiPhi = chiPhiOfDiemDen.reduce((sum, cp) => sum + cp.so_tien, 0)

                return (
                  <div key={diemDen.diem_den_id} style={{ border: '1px solid #d1d5db', borderRadius: '8px', padding: '24px', marginBottom: '24px', pageBreakInside: 'avoid' }}>
                    {/* Header điểm đến */}
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px', marginBottom: '16px', paddingBottom: '16px', borderBottom: '1px solid #e5e7eb' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '48px', height: '48px', borderRadius: '50%', backgroundColor: '#dbeafe', color: '#1d4ed8', fontWeight: 'bold', fontSize: '18px', flexShrink: 0 }}>
                        {diemDen.thu_tu}
                      </div>
                      <div style={{ flex: 1 }}>
                        <h3 style={{ fontSize: '24px', fontWeight: 'bold', color: '#1f2937', marginBottom: '8px' }}>{diemDen.ten_diem_den}</h3>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', fontSize: '14px', color: '#4b5563' }}>
                          {diemDen.ngay_bat_dau && diemDen.ngay_ket_thuc && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                              <span>📅</span>
                              <span>
                                {new Date(diemDen.ngay_bat_dau).toLocaleDateString("vi-VN")} - {new Date(diemDen.ngay_ket_thuc).toLocaleDateString("vi-VN")}
                              </span>
                            </div>
                          )}
                          {diemDen.dia_diem_xuat_phat && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                              <span>📍</span>
                              <span>{diemDen.dia_diem_xuat_phat}</span>
                            </div>
                          )}
                        </div>
                        {diemDen.ghi_chu && (
                          <p style={{ fontSize: '14px', color: '#4b5563', marginTop: '8px', fontStyle: 'italic' }}>📝 {diemDen.ghi_chu}</p>
                        )}
                      </div>
                    </div>

                    {/* Lịch trình - Nhóm theo ngày */}
                    {lichTrinhOfDiemDen.length > 0 && (() => {
                      const lichTrinhGroupedByNgay = groupLichTrinhByNgay(lichTrinhOfDiemDen)
                      const sortedDates = Object.keys(lichTrinhGroupedByNgay).sort((a, b) =>
                        new Date(a).getTime() - new Date(b).getTime()
                      )

                      return (
                      <div style={{ marginBottom: '24px' }}>
                        <h4 style={{ fontSize: '18px', fontWeight: '600', color: '#1f2937', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span>📅</span>
                          Lịch trình ({lichTrinhOfDiemDen.length} hoạt động)
                        </h4>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginLeft: '24px' }}>
                            {sortedDates.map((ngay) => {
                              const lichTrinhTrongNgay = lichTrinhGroupedByNgay[ngay]
                              // Lấy tất cả chi phí có cùng ngày và cùng điểm đến
                              const chiPhiTrongNgay = getChiPhiByNgay(diemDen.diem_den_id, ngay)
                              const totalChiPhiNgay = chiPhiTrongNgay.reduce((sum, cp) => sum + cp.so_tien, 0)

                            return (
                                <div key={ngay} style={{ border: '2px solid #3b82f6', borderRadius: '8px', padding: '16px', backgroundColor: '#f9fafb' }}>
                                  {/* Header ngày */}
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px', paddingBottom: '8px', borderBottom: '2px solid #3b82f6' }}>
                                    <span style={{ fontSize: '16px' }}>📅</span>
                                    <h5 style={{ fontSize: '16px', fontWeight: '600', color: '#1f2937' }}>
                                      {new Date(ngay).toLocaleDateString("vi-VN", {
                                        weekday: "long",
                                        year: "numeric",
                                        month: "long",
                                        day: "numeric"
                                      })}
                                    </h5>
                                    <span style={{ fontSize: '12px', color: '#6b7280', marginLeft: 'auto' }}>
                                      ({lichTrinhTrongNgay.length} hoạt động)
                                  </span>
                                  </div>

                                  {/* Danh sách lịch trình trong ngày */}
                                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: chiPhiTrongNgay.length > 0 ? '12px' : '0' }}>
                                    {lichTrinhTrongNgay.map((lichTrinh) => (
                                      <div key={lichTrinh.lich_trinh_id} style={{ borderLeft: '3px solid #60a5fa', paddingLeft: '12px', paddingTop: '8px', paddingBottom: '8px', backgroundColor: '#ffffff', borderRadius: '0 4px 4px 0' }}>
                                        <h6 style={{ fontWeight: '600', color: '#1f2937', marginBottom: '4px', fontSize: '14px' }}>{lichTrinh.tieu_de}</h6>
                                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', fontSize: '12px', color: '#4b5563', marginBottom: '4px' }}>
                                  {lichTrinh.gio_bat_dau && lichTrinh.gio_ket_thuc && (
                                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                      <span>⏰</span>
                                      {lichTrinh.gio_bat_dau} - {lichTrinh.gio_ket_thuc}
                                    </span>
                                  )}
                                </div>
                                {lichTrinh.ghi_chu && (
                                          <p style={{ fontSize: '12px', color: '#4b5563', marginTop: '4px' }}>{lichTrinh.ghi_chu}</p>
                                        )}
                                      </div>
                                    ))}
                                  </div>

                                  {/* Chi phí trong ngày */}
                                  {chiPhiTrongNgay.length > 0 && (
                                    <div style={{ marginTop: '12px', paddingTop: '12px', borderTop: '2px solid #e5e7eb' }}>
                                      <p style={{ fontSize: '13px', fontWeight: '600', color: '#374151', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                        <span>💰</span>
                                        Chi phí trong ngày:
                                      </p>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginLeft: '12px' }}>
                                        {chiPhiTrongNgay.map((chiPhi) => (
                                          <div key={chiPhi.chi_phi_id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', padding: '4px 0' }}>
                                          <span style={{ color: '#4b5563' }}>
                                            • {chiPhi.mo_ta} {chiPhi.nhom && `(${chiPhi.nhom})`}
                                          </span>
                                          <span style={{ fontWeight: '600', color: '#1f2937' }}>
                                              {formatCurrency(chiPhi.so_tien)} VNĐ
                                          </span>
                                        </div>
                                      ))}
                                      {totalChiPhiNgay > 0 && (
                                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', fontWeight: '600', color: '#1f2937', marginTop: '8px', paddingTop: '8px', borderTop: '1px solid #e5e7eb' }}>
                                            <span>Tổng chi phí ngày:</span>
                                            <span>{formatCurrency(totalChiPhiNgay)} VNĐ</span>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                )}
                              </div>
                            )
                          })}
                        </div>
                      </div>
                      )
                    })()}

                    {/* Chi phí tổng hợp */}
                    {totalChiPhi > 0 && (
                      <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '2px solid #d1d5db' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#eff6ff', padding: '12px', borderRadius: '4px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span>💰</span>
                            <span style={{ fontWeight: '600', color: '#1f2937' }}>Tổng chi phí điểm đến:</span>
                          </div>
                          <span style={{ fontSize: '18px', fontWeight: 'bold', color: '#1d4ed8' }}>
                            {formatCurrency(totalChiPhi)} VNĐ
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}

              {/* Tổng kết */}
              {chiPhiList.length > 0 && (
                <div style={{ marginTop: '32px', paddingTop: '24px', borderTop: '2px solid #9ca3af' }}>
                  <div style={{ background: 'linear-gradient(to right, #dbeafe, #eff6ff)', padding: '24px', borderRadius: '8px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '24px' }}>💰</span>
                        <span style={{ fontSize: '20px', fontWeight: 'bold', color: '#1f2937' }}>Tổng chi phí toàn bộ chuyến đi:</span>
                      </div>
                      <span style={{ fontSize: '24px', fontWeight: 'bold', color: '#1d4ed8' }}>
                        {formatCurrency(chiPhiList.reduce((sum, cp) => sum + cp.so_tien, 0))} VNĐ
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Hiển thị điểm đến với lịch trình và chi phí (UI thông thường) */}
      {sortedDiemDenList.length === 0 ? (
        <Card>
          <CardContent className="p-8">
            <p className="text-muted-foreground text-center">Chưa có điểm đến nào. Hãy thêm điểm đến để bắt đầu!</p>
          </CardContent>
        </Card>
      ) : (
        <Accordion type="multiple" className="w-full space-y-4">
          {sortedDiemDenList.map((diemDen) => {
            const lichTrinhOfDiemDen = getLichTrinhByDiemDen(diemDen.diem_den_id)
            const chiPhiOfDiemDen = getChiPhiByDiemDen(diemDen.diem_den_id)
            const totalChiPhi = chiPhiOfDiemDen.reduce((sum, cp) => sum + cp.so_tien, 0)

            return (
              <AccordionItem key={diemDen.diem_den_id} value={`diem-den-${diemDen.diem_den_id}`} className="border rounded-lg px-4">
                <AccordionTrigger className="hover:no-underline">
                  <div className="flex items-center justify-between w-full pr-4">
                    <div className="flex items-center gap-3 flex-1 text-left">
                      <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary font-bold">
                        {diemDen.thu_tu}
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-lg">{diemDen.ten_diem_den}</h3>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                          {diemDen.ngay_bat_dau && diemDen.ngay_ket_thuc && (
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {new Date(diemDen.ngay_bat_dau).toLocaleDateString("vi-VN")} - {new Date(diemDen.ngay_ket_thuc).toLocaleDateString("vi-VN")}
                            </span>
                          )}
                          {diemDen.dia_diem_xuat_phat && (
                            <span className="flex items-center gap-1">
                              <MapPin className="h-3 w-3" />
                              {diemDen.dia_diem_xuat_phat}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 text-sm">
                      <Badge variant="secondary" className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {lichTrinhOfDiemDen.length} lịch trình
                      </Badge>
                      <Badge variant="secondary" className="flex items-center gap-1">
                        <DollarSign className="h-3 w-3" />
                        {chiPhiOfDiemDen.length} chi phí
                        {totalChiPhi > 0 && (
                          <span className="ml-1 font-semibold">
                            ({formatCurrency(totalChiPhi)} VNĐ)
                          </span>
                        )}
                      </Badge>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleOpenEditDiemDen(diemDen)}>
                            <Pencil className="mr-2 h-4 w-4" />
                            Chỉnh sửa điểm đến
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => {
                              setDeletingDiemDen(diemDen)
                              setShowDeleteDiemDenDialog(true)
                            }}
                            className="text-destructive focus:text-destructive"
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Xóa kế hoạch
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <div className="pt-4 space-y-6">
                    {/* Thông tin điểm đến */}
                    {diemDen.ghi_chu && (
                      <div className="bg-muted/50 p-3 rounded-md">
                        <p className="text-sm text-muted-foreground">
                          <span className="font-medium">Ghi chú: </span>
                          {diemDen.ghi_chu}
                        </p>
                      </div>
                    )}

                    {/* Lịch trình - Nhóm theo ngày */}
                    <div>
                      <div className="flex items-center gap-2 mb-3">
                        <Calendar className="h-4 w-4 text-primary" />
                        <h4 className="font-semibold">Lịch trình</h4>
                        <Badge variant="outline">{lichTrinhOfDiemDen.length} hoạt động</Badge>
                      </div>

                      {lichTrinhOfDiemDen.length === 0 ? (
                        <p className="text-sm text-muted-foreground pl-6">Chưa có lịch trình nào cho điểm đến này</p>
                      ) : (() => {
                        const lichTrinhGroupedByNgay = groupLichTrinhByNgay(lichTrinhOfDiemDen)
                        const sortedDates = Object.keys(lichTrinhGroupedByNgay).sort((a, b) =>
                          new Date(a).getTime() - new Date(b).getTime()
                        )

                            return (
                          <div className="space-y-4 pl-6">
                            {sortedDates.map((ngay) => {
                              const lichTrinhTrongNgay = lichTrinhGroupedByNgay[ngay]
                              // Lấy tất cả chi phí có cùng ngày và cùng điểm đến
                              const chiPhiTrongNgay = getChiPhiByNgay(diemDen.diem_den_id, ngay)
                              const totalChiPhiNgay = chiPhiTrongNgay.reduce((sum, cp) => sum + cp.so_tien, 0)

                              return (
                                <Card key={ngay} className="border-2 border-primary">
                                <CardContent className="p-4">
                                    {/* Header ngày */}
                                    <div className="flex items-center gap-2 mb-4 pb-3 border-b-2 border-primary">
                                      <Calendar className="h-4 w-4 text-primary" />
                                      <h5 className="font-semibold text-lg">
                                        {new Date(ngay).toLocaleDateString("vi-VN", {
                                          weekday: "long",
                                          year: "numeric",
                                          month: "long",
                                          day: "numeric"
                                        })}
                                      </h5>
                                      <Badge variant="secondary" className="ml-auto">
                                        {lichTrinhTrongNgay.length} hoạt động
                                      </Badge>

                                      <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                            <MoreVertical className="h-4 w-4" />
                                          </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end">
                                          <DropdownMenuItem onClick={() => handleOpenEditLichTrinh(diemDen)}>
                                            <Pencil className="mr-2 h-4 w-4" />
                                            Chỉnh sửa lịch trình
                                          </DropdownMenuItem>
                                          <DropdownMenuItem onClick={() => handleOpenEditChiPhi(diemDen)}>
                                            <Pencil className="mr-2 h-4 w-4" />
                                            Chỉnh sửa chi phí
                                          </DropdownMenuItem>
                                        </DropdownMenuContent>
                                      </DropdownMenu>
                                    </div>


                                    {/* Danh sách lịch trình trong ngày */}
                                    <div className="space-y-2 mb-4">
                                      {lichTrinhTrongNgay.map((lichTrinh) => (
                                        <div key={lichTrinh.lich_trinh_id} className="border-l-4 border-l-blue-400 pl-3 py-2 bg-muted/30 rounded-r">
                                          <h6 className="font-semibold text-sm mb-1">{lichTrinh.tieu_de}</h6>
                                          <div className="flex items-center gap-3 text-xs text-muted-foreground">
                                        {lichTrinh.gio_bat_dau && lichTrinh.gio_ket_thuc && (
                                          <span className="flex items-center gap-1">
                                            <Clock className="h-3 w-3" />
                                            {lichTrinh.gio_bat_dau} - {lichTrinh.gio_ket_thuc}
                                          </span>
                                        )}
                                      </div>
                                      {lichTrinh.ghi_chu && (
                                            <p className="text-xs text-muted-foreground mt-1">{lichTrinh.ghi_chu}</p>
                                      )}
                                        </div>
                                      ))}
                                    </div>

                                    {/* Chi phí trong ngày */}
                                    {chiPhiTrongNgay.length > 0 && (
                                      <div className="mt-4 pt-4 border-t-2">
                                        <div className="flex items-center gap-2 mb-3">
                                          <DollarSign className="h-4 w-4 text-primary" />
                                          <span className="text-sm font-semibold">Chi phí trong ngày:</span>
                                          {totalChiPhiNgay > 0 && (
                                            <Badge variant="default" className="ml-auto">
                                              Tổng: {formatCurrency(totalChiPhiNgay)} VNĐ
                                            </Badge>
                                          )}
                                        </div>
                                        <div className="space-y-2">
                                          {chiPhiTrongNgay.map((chiPhi) => (
                                            <div key={chiPhi.chi_phi_id} className="flex items-center justify-between p-2 bg-muted/30 rounded-md">
                                              <div className="flex-1">
                                                <div className="flex items-center gap-2">
                                                  <span className="text-sm font-medium">{chiPhi.mo_ta}</span>
                                                  {chiPhi.nhom && (
                                                    <Badge variant="outline" className="text-xs">{chiPhi.nhom}</Badge>
                                                  )}
                                                </div>
                                                <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
                                                  <span>Người chi: {chiPhi.nguoi_chi_ten || getMemberName(chiPhi.nguoi_chi_id)}</span>
                                                </div>
                                              </div>
                                              <div className="text-right">
                                                <p className="text-sm font-bold text-primary">
                                                  {formatCurrency(chiPhi.so_tien)} VNĐ
                                                </p>
                                              </div>
                                            </div>
                                          ))}
                                        </div>
                                      </div>
                                    )}
                                </CardContent>
                              </Card>
                            )
                          })}
                        </div>
                        )
                      })()}
                    </div>

                    {/* Tổng chi phí điểm đến */}
                    {totalChiPhi > 0 && (
                      <div className="mt-4 pt-4 border-t">
                        <div className="flex items-center justify-between p-3 bg-primary/5 rounded-md">
                          <div className="flex items-center gap-2">
                            <DollarSign className="h-4 w-4 text-primary" />
                            <span className="font-semibold">Tổng chi phí điểm đến:</span>
                          </div>
                          <Badge variant="default" className="text-lg px-3 py-1">
                            {formatCurrency(totalChiPhi)} VNĐ
                          </Badge>
                        </div>
                      </div>
                    )}
                  </div>
                </AccordionContent>
              </AccordionItem>
            )
          })}
        </Accordion>
      )}

      {/* Modal Thêm kế hoạch với Tabs */}
      <Dialog open={showAddPlanModal} onOpenChange={(open) => {
        setShowAddPlanModal(open)
        if (!open) {
          // Reset forms when closing
          // Tự động điền địa điểm xuất phát khi mở lại modal
          const autoDiaDiemXuatPhat = diemDenList.length === 0
            ? tripInfo?.dia_diem_xuat_phat || ""
            : diemDenList[diemDenList.length - 1]?.ten_diem_den || ""
          
          setDiemDenForm({
            ten_diem_den: "",
            thu_tu: diemDenList.length + 1,
            ngay_bat_dau: "",
            ngay_ket_thuc: "",
            dia_diem_xuat_phat: autoDiaDiemXuatPhat,
            ghi_chu: ""
          })
          setLichTrinhForm({
            diem_den_id: 0,
            ngay: "",
            tieu_de: "",
            ghi_chu: "",
            gio_bat_dau: "",
            gio_ket_thuc: ""
          })
          setChiPhiForm({
            diem_den_id: 0,
            lich_trinh_id: 0,
            nguoi_chi_id: 0,
            nguoi_chi_ten: "",
            so_tien: 0,
            mo_ta: "",
            nhom: "",
            ngay: ""
          })
          setActiveTab("diem-den")
        }
      }}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Thêm kế hoạch</DialogTitle>
          </DialogHeader>
          <Tabs 
            value={activeTab} 
            onValueChange={() => {
              // Vô hiệu hóa chuyển tab thủ công - chỉ cho phép chuyển tab tự động
              // Người dùng không thể tự chuyển tab, chỉ có thể chuyển qua nút "Tiếp theo"
            }} 
            className="w-full"
          >
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger
                value="diem-den"
                className={`flex items-center gap-2 pointer-events-none cursor-default transition-all ${activeTab === "diem-den"
                  ? "font-bold bg-blue-500 text-white border-2 border-blue-600 shadow-lg scale-105 hover:bg-blue-600"
                  : "opacity-40 border-2 border-transparent bg-muted text-muted-foreground"
                  }`}
                disabled={true}
              >
                <MapPin className="h-4 w-4" />
                Điểm đến
              </TabsTrigger>
              <TabsTrigger
                value="lich-trinh"
                className={`flex items-center gap-2 pointer-events-none cursor-default transition-all ${activeTab === "lich-trinh"
                  ? "font-bold bg-blue-500 text-white border-2 border-blue-600 shadow-lg scale-105 hover:bg-blue-600"
                  : "opacity-40 border-2 border-transparent bg-muted text-muted-foreground"
                  }`}
                disabled={true}
              >
                <Calendar className="h-4 w-4" />
                Lịch trình
              </TabsTrigger>
              <TabsTrigger
                value="chi-phi"
                className={`flex items-center gap-2 pointer-events-none cursor-default transition-all ${activeTab === "chi-phi"
                  ? "font-bold bg-blue-500 text-white border-2 border-blue-600 shadow-lg scale-105 hover:bg-blue-600"
                  : "opacity-40 border-2 border-transparent bg-muted text-muted-foreground"
                  }`}
                disabled={true}
              >
                <DollarSign className="h-4 w-4" />
                Chi phí
              </TabsTrigger>
            </TabsList>

            {/* Tab Điểm đến */}
            <TabsContent value="diem-den" className="space-y-4 mt-4">
              <div>
                <Label htmlFor="ten_diem_den" className="mb-2 block">Tên điểm đến *</Label>
                <Select
                  value={diemDenForm.ten_diem_den}
                  onValueChange={(val) => {
                    setDiemDenForm({ ...diemDenForm, ten_diem_den: val })
                    // Tự động cập nhật điểm đến ở tab Lịch trình
                    setLichTrinhForm({ ...lichTrinhForm, diem_den_id: -1 })
                  }}
                >
                  <SelectTrigger id="ten_diem_den" className="w-full">
                    <SelectValue placeholder="Chọn tỉnh thành..." />
                  </SelectTrigger>
                  <SelectContent className="max-h-[300px]">
                    {TINH_THANH.map((tinh) => (
                      <SelectItem key={tinh} value={tinh}>
                        {tinh}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="ngay_bat_dau" className="mb-2 block">Ngày bắt đầu</Label>
                  <Input
                    id="ngay_bat_dau"
                    type="date"
                    value={diemDenForm.ngay_bat_dau}
                    onChange={(e) => setDiemDenForm({ ...diemDenForm, ngay_bat_dau: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="ngay_ket_thuc" className="mb-2 block">Ngày kết thúc</Label>
                  <Input
                    id="ngay_ket_thuc"
                    type="date"
                    value={diemDenForm.ngay_ket_thuc}
                    onChange={(e) => setDiemDenForm({ ...diemDenForm, ngay_ket_thuc: e.target.value })}
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="dia_diem_xuat_phat" className="mb-2 block">Địa điểm xuất phát</Label>
                {(() => {
                  // Tự động tính địa điểm xuất phát theo logic backend:
                  // - Điểm đến đầu tiên: lấy từ chuyến đi (tripInfo.dia_diem_xuat_phat)
                  // - Điểm đến sau: lấy từ điểm đến trước đó (ten_diem_den của điểm có thu_tu lớn nhất)
                  const autoDiaDiemXuatPhat = diemDenList.length === 0
                    ? tripInfo?.dia_diem_xuat_phat || ""
                    : diemDenList[diemDenList.length - 1]?.ten_diem_den || ""

                  return (
                    <div className="flex h-10 w-full rounded-md border border-input bg-muted px-3 py-2 text-sm items-center">
                      <MapPin className="h-4 w-4 mr-2 text-muted-foreground" />
                      <span className={autoDiaDiemXuatPhat ? "text-foreground font-medium" : "text-muted-foreground italic"}>
                        {autoDiaDiemXuatPhat || "Sẽ được tự động điền"}
                      </span>
                    </div>
                  )
                })()}
                <p className="text-xs text-muted-foreground mt-1">
                  {diemDenList.length === 0
                    ? `Địa điểm xuất phát đầu tiên sẽ lấy từ điểm xuất phát của chuyến đi: ${tripInfo?.dia_diem_xuat_phat || "đang tải..."}`
                    : `Địa điểm xuất phát sẽ lấy từ điểm đến trước đó: ${diemDenList[diemDenList.length - 1]?.ten_diem_den || ""}`
                  }
                </p>
              </div>
              <div>
                <Label htmlFor="ghi_chu_diem_den" className="mb-2 block">Ghi chú</Label>
                <Textarea
                  id="ghi_chu_diem_den"
                  value={diemDenForm.ghi_chu}
                  onChange={(e) => setDiemDenForm({ ...diemDenForm, ghi_chu: e.target.value })}
                  placeholder="Nhập ghi chú"
                  rows={3}
                />
              </div>
              <DialogFooter>

                <Button
                  onClick={async () => {
                    await handleDiemDenNext()
                  }}
                  disabled={isSavingDiemDen}
                >
                  {isSavingDiemDen ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Đang lưu...
                    </>
                  ) : (
                    <>
                  <ChevronRight className="h-4 w-4 mr-2" />
                  Tiếp theo
                    </>
                  )}
                </Button>
              </DialogFooter>
            </TabsContent>

            {/* Tab Lịch trình */}
            <TabsContent value="lich-trinh" className="space-y-4 mt-4">
              {/* Hiển thị danh sách lịch trình đã thêm */}
              {lichTrinhList.length > 0 && (
                <div className="bg-muted/50 p-4 rounded-lg border">
                  <div className="flex items-center justify-between mb-2">
                    <Label className="text-sm font-semibold">Lịch trình đã thêm ({lichTrinhList.length})</Label>
                  </div>
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {lichTrinhList.map((lt) => {
                      const diemDen = diemDenList.find(dd => dd.diem_den_id === lt.diem_den_id)
                      return (
                        <div key={lt.lich_trinh_id} className="bg-background p-2 rounded border text-sm">
                          <div className="flex items-center justify-between">
                            <span className="font-medium">{lt.tieu_de}</span>
                            <Badge variant="outline" className="text-xs">
                              {lt.ngay}
                            </Badge>
                          </div>
                          {diemDen && (
                            <p className="text-xs text-muted-foreground mt-1">
                              📍 {diemDen.ten_diem_den}
                            </p>
                          )}
                          {lt.gio_bat_dau && lt.gio_ket_thuc && (
                            <p className="text-xs text-muted-foreground">
                              ⏰ {lt.gio_bat_dau} - {lt.gio_ket_thuc}
                            </p>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}
              <div>
                <Label htmlFor="diem_den_id_lich_trinh" className="mb-2 block">Điểm đến *</Label>
                {diemDenForm.ten_diem_den ? (
                  <div className="flex h-10 w-full rounded-md border border-input bg-muted px-3 py-2 text-sm items-center">
                    <MapPin className="h-4 w-4 mr-2 text-muted-foreground" />
                    <span className="font-medium text-foreground">{diemDenForm.ten_diem_den}</span>
                    <span className="ml-2 text-xs text-muted-foreground"></span>
                  </div>
                ) : (
                  <div className="flex h-10 w-full rounded-md border border-input bg-muted px-3 py-2 text-sm items-center text-muted-foreground">
                    <span>Chưa chọn điểm đến ở tab "Điểm đến"</span>
                  </div>
                )}
                {/* {diemDenForm.ten_diem_den && (
                  <p className="text-xs text-muted-foreground mt-1">
                    💡 Điểm đến đang điền ở tab "Điểm đến" sẽ được thêm vào danh sách sau khi bạn click "Thêm". Trường này đã được tự động điền và không thể chỉnh sửa.
                  </p>
                )} */}
              </div>
              <div>
                <Label htmlFor="ngay_lich_trinh" className="mb-2 block">Ngày *</Label>
                {availableDates.length > 0 ? (
                  <Select
                    value={lichTrinhForm.ngay}
                    onValueChange={(val) => setLichTrinhForm({ ...lichTrinhForm, ngay: val })}
                  >
                    <SelectTrigger id="ngay_lich_trinh" className="w-full">
                      <SelectValue placeholder="Chọn ngày..." />
                    </SelectTrigger>
                    <SelectContent className="max-h-[300px]">
                      {availableDates.map((date) => {
                        const dateObj = new Date(date)
                        const formattedDate = dateObj.toLocaleDateString("vi-VN", {
                          weekday: "long",
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        })
                      return (
                          <SelectItem key={date} value={date}>
                            {formattedDate}
                          </SelectItem>
                        )
                      })}
                    </SelectContent>
                  </Select>
                ) : (
                  <div className="flex h-10 w-full rounded-md border border-input bg-muted px-3 py-2 text-sm items-center text-muted-foreground">
                    <span>Vui lòng chọn ngày bắt đầu và ngày kết thúc ở tab "Điểm đến"</span>
                  </div>
                )}
                {diemDenForm.ngay_bat_dau && diemDenForm.ngay_ket_thuc && availableDates.length > 0 && (
                  <p className="text-xs text-muted-foreground mt-1">
                    💡 Chọn ngày từ {new Date(diemDenForm.ngay_bat_dau).toLocaleDateString("vi-VN")} đến {new Date(diemDenForm.ngay_ket_thuc).toLocaleDateString("vi-VN")}
                  </p>
                )}
              </div>
              <div>
                <Label htmlFor="tieu_de" className="mb-2 block">Tiêu đề *</Label>
                <Input
                  id="tieu_de"
                  value={lichTrinhForm.tieu_de}
                  onChange={(e) => setLichTrinhForm({ ...lichTrinhForm, tieu_de: e.target.value })}
                  placeholder="Nhập tiêu đề"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="gio_bat_dau" className="mb-2 block">Giờ bắt đầu</Label>
                  <Input
                    id="gio_bat_dau"
                    type="time"
                    value={lichTrinhForm.gio_bat_dau}
                    onChange={(e) => setLichTrinhForm({ ...lichTrinhForm, gio_bat_dau: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="gio_ket_thuc" className="mb-2 block">Giờ kết thúc</Label>
                  <Input
                    id="gio_ket_thuc"
                    type="time"
                    value={lichTrinhForm.gio_ket_thuc}
                    onChange={(e) => setLichTrinhForm({ ...lichTrinhForm, gio_ket_thuc: e.target.value })}
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="ghi_chu_lich_trinh" className="mb-2 block">Ghi chú</Label>
                <Textarea
                  id="ghi_chu_lich_trinh"
                  value={lichTrinhForm.ghi_chu}
                  onChange={(e) => setLichTrinhForm({ ...lichTrinhForm, ghi_chu: e.target.value })}
                  placeholder="Nhập ghi chú"
                  rows={3}
                />
              </div>
              <DialogFooter className="flex gap-2">

                {/* Nút quay lại - chỉ hiển thị khi đã có điểm đến */}
                {diemDenList.length > 0 && (
                  <Button
                    variant="outline"
                    onClick={() => {
                      setActiveTab("diem-den")
                    }}
                  >
                    <ChevronLeft className="h-4 w-4 mr-2" />
                    Quay lại
                </Button>
                )}
                <Button 
                  variant="secondary"
                  onClick={async () => {
                    await handleLichTrinhAdd()
                  }}
                  disabled={isSavingLichTrinh}
                >
                  {isSavingLichTrinh ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Đang lưu...
                    </>
                  ) : (
                    <>
                  <Plus className="h-4 w-4 mr-2" />
                  Thêm lịch trình khác
                    </>
                  )}
                </Button>
                <Button
                  onClick={async () => {
                    await handleLichTrinhNext()
                  }}
                  disabled={isSavingLichTrinh}
                >
                  {isSavingLichTrinh ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Đang lưu...
                    </>
                  ) : (
                    <>
                  <ChevronRight className="h-4 w-4 mr-2" />
                  Tiếp theo
                    </>
                  )}
                </Button>
              </DialogFooter>
            </TabsContent>

            {/* Tab Chi phí */}
            <TabsContent value="chi-phi" className="space-y-4 mt-4">
              {/* Hiển thị danh sách chi phí đã thêm */}
              {chiPhiList.length > 0 && (
                <div className="bg-muted/50 p-4 rounded-lg border">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                    <Label className="text-sm font-semibold">Chi phí đã thêm ({chiPhiList.length})</Label>
                      <Badge variant="secondary" className="text-xs font-medium">
                        Tổng: {formatCurrency(chiPhiList.reduce((sum, cp) => sum + cp.so_tien, 0))} VNĐ
                    </Badge>
                    </div>
                    <div className="flex items-center gap-2 bg-primary/10 px-3 py-1.5 rounded-lg border border-primary/20">
                      <DollarSign className="h-4 w-4 text-primary" />
                      <span className="text-sm font-bold text-primary">
                        {formatCurrency(chiPhiList.reduce((sum, cp) => sum + cp.so_tien, 0))} VNĐ
                      </span>
                    </div>
                  </div>
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {chiPhiList.map((cp) => {
                      const diemDen = diemDenList.find(dd => dd.diem_den_id === cp.diem_den_id)
                      const lichTrinh = cp.lich_trinh_id ? lichTrinhList.find(lt => lt.lich_trinh_id === cp.lich_trinh_id) : null
                      return (
                        <div key={cp.chi_phi_id} className="bg-background p-3 rounded-lg border border-border hover:border-primary/30 transition-colors">
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex-1 min-w-0">
                              <span className="font-medium text-sm">{cp.mo_ta}</span>
                              <div className="flex items-center gap-2 mt-2 flex-wrap">
                            {cp.nhom && (
                              <Badge variant="secondary" className="text-xs">
                                {cp.nhom}
                              </Badge>
                            )}
                            {cp.ngay && (
                                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                                    <Calendar className="h-3 w-3" />
                                    {new Date(cp.ngay).toLocaleDateString("vi-VN", {
                                      day: "2-digit",
                                      month: "2-digit",
                                      year: "numeric"
                                    })}
                              </span>
                            )}
                          </div>
                          {diemDen && (
                                <p className="text-xs text-muted-foreground mt-1.5 flex items-center gap-1">
                                  <MapPin className="h-3 w-3" />
                                  {diemDen.ten_diem_den}
                            </p>
                          )}
                          {lichTrinh && (
                                <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                                  <Clock className="h-3 w-3" />
                                  Lịch trình: {lichTrinh.tieu_de}
                            </p>
                          )}
                            </div>
                            <div className="flex-shrink-0">
                              <div className="flex items-center gap-1 bg-green-50 border border-green-200 px-2.5 py-1.5 rounded-lg">
                                <DollarSign className="h-3.5 w-3.5 text-green-700" />
                                <span className="text-sm font-bold text-green-700">
                                  {formatCurrency(cp.so_tien)}
                                </span>
                                <span className="text-xs text-green-600 ml-0.5">VNĐ</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}
              <div>
                <Label htmlFor="diem_den_id_chi_phi" className="mb-2 block">Điểm đến *</Label>
                {diemDenForm.ten_diem_den ? (
                  <div className="flex h-10 w-full rounded-md border border-input bg-muted px-3 py-2 text-sm items-center">
                    <MapPin className="h-4 w-4 mr-2 text-muted-foreground" />
                    <span className="font-medium text-foreground">{diemDenForm.ten_diem_den}</span>
                  </div>
                ) : (
                  <div className="flex h-10 w-full rounded-md border border-input bg-muted px-3 py-2 text-sm items-center text-muted-foreground">
                    <span>Chưa chọn điểm đến ở tab "Điểm đến"</span>
                  </div>
                )}
                  <p className="text-xs text-muted-foreground mt-1">
                  💡 Điểm đến được tự động lấy từ "Điểm đến" và không thể chỉnh sửa
                  </p>
              </div>

                <div>
                <Label htmlFor="ngay_chi_phi" className="mb-2 block">Ngày</Label>
                {availableDates.length > 0 ? (
                  <Select
                    value={chiPhiForm.ngay}
                    onValueChange={(val) => setChiPhiForm({ ...chiPhiForm, ngay: val })}
                  >
                    <SelectTrigger id="ngay_chi_phi" className="w-full">
                      <SelectValue placeholder="Chọn ngày..." />
                    </SelectTrigger>
                    <SelectContent className="max-h-[300px]">
                      {availableDates.map((date) => {
                        const dateObj = new Date(date)
                        const formattedDate = dateObj.toLocaleDateString("vi-VN", {
                          weekday: "long",
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        })
                        return (
                          <SelectItem key={date} value={date}>
                            {formattedDate}
                          </SelectItem>
                        )
                      })}
                    </SelectContent>
                  </Select>
                ) : (
                  <div className="flex h-10 w-full rounded-md border border-input bg-muted px-3 py-2 text-sm items-center text-muted-foreground">
                    <span>Vui lòng chọn ngày bắt đầu và ngày kết thúc ở tab "Điểm đến"</span>
                </div>
              )}
                {diemDenForm.ngay_bat_dau && diemDenForm.ngay_ket_thuc && availableDates.length > 0 && (
                <p className="text-xs text-muted-foreground mt-1">
                    💡 Chọn ngày từ {new Date(diemDenForm.ngay_bat_dau).toLocaleDateString("vi-VN")} đến {new Date(diemDenForm.ngay_ket_thuc).toLocaleDateString("vi-VN")}
                </p>
                )}
              </div>
              <div>
                <Label htmlFor="so_tien" className="mb-2 block">Số tiền *</Label>
                <Input
                  id="so_tien"
                  type="number"
                  value={chiPhiForm.so_tien || ""}
                  onChange={(e) => setChiPhiForm({ ...chiPhiForm, so_tien: parseFloat(e.target.value) || 0 })}
                  placeholder="Nhập số tiền"
                />
              </div>
              <div>
                <Label htmlFor="mo_ta" className="mb-2 block">Mô tả *</Label>
                <Input
                  id="mo_ta"
                  value={chiPhiForm.mo_ta}
                  onChange={(e) => setChiPhiForm({ ...chiPhiForm, mo_ta: e.target.value })}
                  placeholder="Nhập mô tả"
                />
              </div>
              <div>
                <Label htmlFor="nhom" className="mb-2 block">Nhóm *</Label>
                <select
                  id="nhom"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  value={chiPhiForm.nhom}
                  onChange={(e) => setChiPhiForm({ ...chiPhiForm, nhom: e.target.value })}
                  required
                >
                  <option value="">Chọn nhóm</option>
                  {expenseTypes.map((type) => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </div>

              <DialogFooter className="flex gap-2">

                {/* Nút quay lại - chỉ hiển thị khi đã có lịch trình */}
                {lichTrinhList.length > 0 && (
                  <Button
                    variant="outline"
                    onClick={() => {
                      setActiveTab("lich-trinh")
                    }}
                  >
                    <ChevronLeft className="h-4 w-4 mr-2" />
                    Quay lại
                </Button>
                )}
                <Button 
                  variant="secondary"
                  onClick={async () => {
                    await handleChiPhiAdd()
                  }}
                  disabled={isSavingChiPhi}
                >
                  {isSavingChiPhi ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Đang lưu...
                    </>
                  ) : (
                    <>
                  <Plus className="h-4 w-4 mr-2" />
                  Thêm chi phí khác
                    </>
                  )}
                </Button>
                <Button
                  onClick={async () => {
                    const success = await handleChiPhiSubmit()
                  if (success) {
                  setShowAddPlanModal(false)
                    // Reset form và quay về tab "Điểm đến" cho lần tiếp theo
                    setActiveTab("diem-den")
                    // Reset các form
                    const autoDiaDiemXuatPhat = diemDenList.length === 0
                      ? tripInfo?.dia_diem_xuat_phat || ""
                      : diemDenList[diemDenList.length - 1]?.ten_diem_den || ""
                    setDiemDenForm({
                      ten_diem_den: "",
                      thu_tu: diemDenList.length + 1,
                      ngay_bat_dau: "",
                      ngay_ket_thuc: "",
                      dia_diem_xuat_phat: autoDiaDiemXuatPhat,
                      ghi_chu: ""
                    })
                    setLichTrinhForm({
                      diem_den_id: 0,
                      ngay: "",
                      tieu_de: "",
                      ghi_chu: "",
                      gio_bat_dau: "",
                      gio_ket_thuc: ""
                    })
                    setChiPhiForm({
                      diem_den_id: 0,
                      lich_trinh_id: 0,
                      nguoi_chi_id: 0,
                      nguoi_chi_ten: "",
                      so_tien: 0,
                      mo_ta: "",
                      nhom: "",
                      ngay: ""
                    })
                  }
                  }}
                  disabled={isSavingChiPhi}
                >
                  {isSavingChiPhi ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Đang lưu...
                    </>
                  ) : (
                    "Tiếp theo"
                  )}
                </Button>
              </DialogFooter>
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>

      {/* Modal chỉnh sửa điểm đến */}
      <Dialog open={showEditDiemDenModal} onOpenChange={setShowEditDiemDenModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Chỉnh sửa điểm đến</DialogTitle>
            <DialogDescription>
              Cập nhật thông tin điểm đến
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div>
              <Label htmlFor="edit_ten_diem_den" className="mb-2 block">Tên điểm đến *</Label>
              <Select
                value={editDiemDenForm.ten_diem_den}
                onValueChange={(val) => setEditDiemDenForm({ ...editDiemDenForm, ten_diem_den: val })}
              >
                <SelectTrigger id="edit_ten_diem_den" className="w-full">
                  <SelectValue placeholder="Chọn tỉnh thành..." />
                </SelectTrigger>
                <SelectContent className="max-h-[300px]">
                  {TINH_THANH.map((tinh) => (
                    <SelectItem key={tinh} value={tinh}>
                      {tinh}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit_ngay_bat_dau" className="mb-2 block">Ngày bắt đầu</Label>
                <Input
                  id="edit_ngay_bat_dau"
                  type="date"
                  value={editDiemDenForm.ngay_bat_dau}
                  onChange={(e) => setEditDiemDenForm({ ...editDiemDenForm, ngay_bat_dau: e.target.value })}
                />
                </div>
              <div>
                <Label htmlFor="edit_ngay_ket_thuc" className="mb-2 block">Ngày kết thúc</Label>
                <Input
                  id="edit_ngay_ket_thuc"
                  type="date"
                  value={editDiemDenForm.ngay_ket_thuc}
                  onChange={(e) => setEditDiemDenForm({ ...editDiemDenForm, ngay_ket_thuc: e.target.value })}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="edit_ghi_chu" className="mb-2 block">Ghi chú</Label>
              <Textarea
                id="edit_ghi_chu"
                value={editDiemDenForm.ghi_chu}
                onChange={(e) => setEditDiemDenForm({ ...editDiemDenForm, ghi_chu: e.target.value })}
                placeholder="Nhập ghi chú"
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowEditDiemDenModal(false)
                setEditingDiemDen(null)
                setEditDiemDenForm({
                  ten_diem_den: "",
                  ngay_bat_dau: "",
                  ngay_ket_thuc: "",
                  ghi_chu: ""
                })
              }}
            >
              Hủy
            </Button>
            <Button
              onClick={async () => {
                await handleUpdateDiemDen()
              }}
              disabled={isUpdatingDiemDen}
            >
              {isUpdatingDiemDen ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Đang cập nhật...
                </>
              ) : (
                <>
                  <Pencil className="h-4 w-4 mr-2" />
                  Cập nhật
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal chỉnh sửa lịch trình */}
      <Dialog open={showEditLichTrinhModal} onOpenChange={(open) => {
        setShowEditLichTrinhModal(open)
        if (!open) {
          setEditingLichTrinh(null)
          setEditLichTrinhForm({
            diem_den_id: 0,
            ngay: "",
            tieu_de: "",
            ghi_chu: "",
            gio_bat_dau: "",
            gio_ket_thuc: ""
          })
        }
      }}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editingLichTrinh ? "Chỉnh sửa lịch trình" : "Chọn lịch trình cần chỉnh sửa"}</DialogTitle>
            <DialogDescription>
              {editingLichTrinh ? "Cập nhật thông tin lịch trình" : "Chọn lịch trình từ danh sách"}
            </DialogDescription>
          </DialogHeader>
          {editingLichTrinh ? (() => {
            // Tìm điểm đến tương ứng với lịch trình đang chỉnh sửa
            const diemDenForEdit = diemDenList.find(dd => dd.diem_den_id === editLichTrinhForm.diem_den_id)
            // Tạo danh sách ngày từ ngày bắt đầu đến ngày kết thúc của điểm đến
            const availableDatesForEdit = diemDenForEdit && diemDenForEdit.ngay_bat_dau && diemDenForEdit.ngay_ket_thuc
              ? generateDateList(diemDenForEdit.ngay_bat_dau, diemDenForEdit.ngay_ket_thuc)
              : []

            return (
              // Form chỉnh sửa lịch trình
              <div className="space-y-4 mt-4">
                <div>
                  <Label htmlFor="edit_ngay_lich_trinh" className="mb-2 block">Ngày *</Label>
                  {availableDatesForEdit.length > 0 ? (
                    <Select
                      value={editLichTrinhForm.ngay}
                      onValueChange={(val) => setEditLichTrinhForm({ ...editLichTrinhForm, ngay: val })}
                    >
                      <SelectTrigger id="edit_ngay_lich_trinh" className="w-full">
                        <SelectValue placeholder="Chọn ngày..." />
                      </SelectTrigger>
                      <SelectContent className="max-h-[300px]">
                        {availableDatesForEdit.map((date) => {
                          const dateObj = new Date(date)
                          const formattedDate = dateObj.toLocaleDateString("vi-VN", {
                            weekday: "long",
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                          })
                          return (
                            <SelectItem key={date} value={date}>
                              {formattedDate}
                            </SelectItem>
                          )
                        })}
                      </SelectContent>
                    </Select>
                  ) : (
                    <div className="flex h-10 w-full rounded-md border border-input bg-muted px-3 py-2 text-sm items-center text-muted-foreground">
                      <span>Vui lòng chọn ngày bắt đầu và ngày kết thúc ở điểm đến</span>
                      </div>
                  )}
                  {diemDenForEdit && diemDenForEdit.ngay_bat_dau && diemDenForEdit.ngay_ket_thuc && availableDatesForEdit.length > 0 && (
                    <p className="text-xs text-muted-foreground mt-1">
                      💡 Chọn ngày từ {new Date(diemDenForEdit.ngay_bat_dau).toLocaleDateString("vi-VN")} đến {new Date(diemDenForEdit.ngay_ket_thuc).toLocaleDateString("vi-VN")}
                    </p>
                  )}
                      </div>
                <div>
                  <Label htmlFor="edit_tieu_de_lich_trinh" className="mb-2 block">Tiêu đề *</Label>
                  <Input
                    id="edit_tieu_de_lich_trinh"
                    value={editLichTrinhForm.tieu_de}
                    onChange={(e) => setEditLichTrinhForm({ ...editLichTrinhForm, tieu_de: e.target.value })}
                    placeholder="Nhập tiêu đề"
                  />
                      </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="edit_gio_bat_dau_lich_trinh" className="mb-2 block">Giờ bắt đầu</Label>
                    <Input
                      id="edit_gio_bat_dau_lich_trinh"
                      type="time"
                      value={editLichTrinhForm.gio_bat_dau}
                      onChange={(e) => setEditLichTrinhForm({ ...editLichTrinhForm, gio_bat_dau: e.target.value })}
                    />
                      </div>
                  <div>
                    <Label htmlFor="edit_gio_ket_thuc_lich_trinh" className="mb-2 block">Giờ kết thúc</Label>
                    <Input
                      id="edit_gio_ket_thuc_lich_trinh"
                      type="time"
                      value={editLichTrinhForm.gio_ket_thuc}
                      onChange={(e) => setEditLichTrinhForm({ ...editLichTrinhForm, gio_ket_thuc: e.target.value })}
                    />
                      </div>
                    </div>
                <div>
                  <Label htmlFor="edit_ghi_chu_lich_trinh" className="mb-2 block">Ghi chú</Label>
                  <Textarea
                    id="edit_ghi_chu_lich_trinh"
                    value={editLichTrinhForm.ghi_chu}
                    onChange={(e) => setEditLichTrinhForm({ ...editLichTrinhForm, ghi_chu: e.target.value })}
                    placeholder="Nhập ghi chú"
                    rows={3}
                  />
                </div>
              </div>
            )
          })() : (
            // Danh sách lịch trình
            <div className="space-y-4 mt-4">
              {lichTrinhList.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">
                  Chưa có lịch trình nào để chỉnh sửa
                </p>
              ) : (
                <div className="space-y-2 max-h-[400px] overflow-y-auto">
                  {lichTrinhList.map((lt) => {
                    const diemDen = diemDenList.find(dd => dd.diem_den_id === lt.diem_den_id)
                    return (
                      <Card key={lt.lich_trinh_id} className="cursor-pointer hover:bg-muted/50 transition-colors">
                  <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <h4 className="font-semibold">{lt.tieu_de}</h4>
                              <div className="flex items-center gap-4 text-sm text-muted-foreground mt-2">
                                {diemDen && (
                                  <span className="flex items-center gap-1">
                                    <MapPin className="h-3 w-3" />
                                    {diemDen.ten_diem_den}
                                  </span>
                                )}
                                <span className="flex items-center gap-1">
                                  <Calendar className="h-3 w-3" />
                                  {new Date(lt.ngay).toLocaleDateString("vi-VN")}
                                </span>
                                {lt.gio_bat_dau && lt.gio_ket_thuc && (
                                  <span className="flex items-center gap-1">
                                    <Clock className="h-3 w-3" />
                                    {lt.gio_bat_dau} - {lt.gio_ket_thuc}
                                  </span>
                                )}
                              </div>
                              {lt.ghi_chu && (
                                <p className="text-sm text-muted-foreground mt-2">{lt.ghi_chu}</p>
                              )}
                            </div>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setEditingLichTrinh(lt)
                                setEditLichTrinhForm({
                                  diem_den_id: lt.diem_den_id,
                                  ngay: lt.ngay,
                                  tieu_de: lt.tieu_de,
                                  ghi_chu: lt.ghi_chu,
                                  gio_bat_dau: lt.gio_bat_dau,
                                  gio_ket_thuc: lt.gio_ket_thuc
                                })
                              }}
                            >
                              <Pencil className="h-4 w-4 mr-2" />
                              Chỉnh sửa
                            </Button>
                          </div>
                  </CardContent>
                </Card>
                    )
                  })}
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            {editingLichTrinh ? (
              <>
                <Button
                  variant="outline"
                  onClick={() => {
                    setEditingLichTrinh(null)
                    setEditLichTrinhForm({
                      diem_den_id: 0,
                      ngay: "",
                      tieu_de: "",
                      ghi_chu: "",
                      gio_bat_dau: "",
                      gio_ket_thuc: ""
                    })
                  }}
                >
                  Quay lại
                </Button>
                <Button
                  onClick={async () => {
                    await handleUpdateLichTrinh()
                  }}
                  disabled={isUpdatingLichTrinh}
                >
                  {isUpdatingLichTrinh ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Đang cập nhật...
                    </>
                  ) : (
                    <>
                      <Pencil className="h-4 w-4 mr-2" />
                      Cập nhật
                    </>
                  )}
                </Button>
              </>
            ) : (
              <Button
                variant="outline"
                onClick={() => setShowEditLichTrinhModal(false)}
              >
                Đóng
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal chỉnh sửa chi phí */}
      <Dialog open={showEditChiPhiModal} onOpenChange={(open) => {
        setShowEditChiPhiModal(open)
        if (!open) {
          setEditingChiPhi(null)
          setEditChiPhiForm({
            diem_den_id: 0,
            lich_trinh_id: 0,
            nguoi_chi_id: 0,
            nguoi_chi_ten: "",
            so_tien: 0,
            mo_ta: "",
            nhom: "",
            ngay: ""
          })
        }
      }}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editingChiPhi ? "Chỉnh sửa chi phí" : "Chọn chi phí cần chỉnh sửa"}</DialogTitle>
            <DialogDescription>
              {editingChiPhi ? "Cập nhật thông tin chi phí" : "Chọn chi phí từ danh sách"}
            </DialogDescription>
          </DialogHeader>
          {editingChiPhi ? (() => {
            // Tìm điểm đến tương ứng
            const diemDenForEdit = diemDenList.find(dd => dd.diem_den_id === editChiPhiForm.diem_den_id)
            // Tạo danh sách ngày từ ngày bắt đầu đến ngày kết thúc của điểm đến
            const availableDatesForEdit = diemDenForEdit && diemDenForEdit.ngay_bat_dau && diemDenForEdit.ngay_ket_thuc
              ? generateDateList(diemDenForEdit.ngay_bat_dau, diemDenForEdit.ngay_ket_thuc)
              : []

            return (
              // Form chỉnh sửa chi phí
              <div className="space-y-4 mt-4">
                          <div>
                  <Label htmlFor="edit_diem_den_chi_phi" className="mb-2 block">Điểm đến *</Label>
                  {diemDenForEdit ? (
                    <div className="flex h-10 w-full rounded-md border border-input bg-muted px-3 py-2 text-sm items-center">
                      <MapPin className="h-4 w-4 mr-2 text-muted-foreground" />
                      <span className="font-medium text-foreground">{diemDenForEdit.ten_diem_den}</span>
                    </div>
                  ) : (
                    <div className="flex h-10 w-full rounded-md border border-input bg-muted px-3 py-2 text-sm items-center text-muted-foreground">
                      <span>Không tìm thấy điểm đến</span>
                          </div>
                        )}
                  <p className="text-xs text-muted-foreground mt-1">
                    💡 Điểm đến không thể chỉnh sửa
                  </p>
                </div>
                          <div>
                  <Label htmlFor="edit_ngay_chi_phi" className="mb-2 block">Ngày *</Label>
                  {availableDatesForEdit.length > 0 ? (
                    <Select
                      value={editChiPhiForm.ngay}
                      onValueChange={(val) => setEditChiPhiForm({ ...editChiPhiForm, ngay: val })}
                    >
                      <SelectTrigger id="edit_ngay_chi_phi" className="w-full">
                        <SelectValue placeholder="Chọn ngày..." />
                      </SelectTrigger>
                      <SelectContent className="max-h-[300px]">
                        {availableDatesForEdit.map((date) => {
                          const dateObj = new Date(date)
                          const formattedDate = dateObj.toLocaleDateString("vi-VN", {
                            weekday: "long",
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                          })
                          return (
                            <SelectItem key={date} value={date}>
                              {formattedDate}
                            </SelectItem>
                          )
                        })}
                      </SelectContent>
                    </Select>
                  ) : (
                    <div className="flex h-10 w-full rounded-md border border-input bg-muted px-3 py-2 text-sm items-center text-muted-foreground">
                      <span>Vui lòng chọn ngày bắt đầu và ngày kết thúc ở điểm đến</span>
                          </div>
                        )}
                  {diemDenForEdit && diemDenForEdit.ngay_bat_dau && diemDenForEdit.ngay_ket_thuc && availableDatesForEdit.length > 0 && (
                    <p className="text-xs text-muted-foreground mt-1">
                      💡 Chọn ngày từ {new Date(diemDenForEdit.ngay_bat_dau).toLocaleDateString("vi-VN")} đến {new Date(diemDenForEdit.ngay_ket_thuc).toLocaleDateString("vi-VN")}
                    </p>
                  )}
                </div>
                          <div>
                  <Label htmlFor="edit_so_tien_chi_phi" className="mb-2 block">Số tiền *</Label>
                  <Input
                    id="edit_so_tien_chi_phi"
                    type="number"
                    value={editChiPhiForm.so_tien || ""}
                    onChange={(e) => setEditChiPhiForm({ ...editChiPhiForm, so_tien: parseFloat(e.target.value) || 0 })}
                    placeholder="Nhập số tiền"
                  />
                          </div>
                          <div>
                  <Label htmlFor="edit_mo_ta_chi_phi" className="mb-2 block">Mô tả *</Label>
                  <Input
                    id="edit_mo_ta_chi_phi"
                    value={editChiPhiForm.mo_ta}
                    onChange={(e) => setEditChiPhiForm({ ...editChiPhiForm, mo_ta: e.target.value })}
                    placeholder="Nhập mô tả"
                  />
                </div>
                <div>
                  <Label htmlFor="edit_nhom_chi_phi" className="mb-2 block">Nhóm *</Label>
                  <select
                    id="edit_nhom_chi_phi"
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    value={editChiPhiForm.nhom}
                    onChange={(e) => setEditChiPhiForm({ ...editChiPhiForm, nhom: e.target.value })}
                    required
                  >
                    <option value="">Chọn nhóm</option>
                    {expenseTypes.map((type) => (
                      <option key={type.value} value={type.value}>
                        {type.label}
                      </option>
                    ))}
                  </select>
                          </div>
              </div>
            )
          })() : (
            // Danh sách chi phí
            <div className="space-y-4 mt-4">
              {chiPhiList.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">
                  Chưa có chi phí nào để chỉnh sửa
                </p>
              ) : (
                <div className="space-y-2 max-h-[400px] overflow-y-auto">
                  {chiPhiList.map((cp) => {
                    const diemDen = diemDenList.find(dd => dd.diem_den_id === cp.diem_den_id)
                    const lichTrinh = cp.lich_trinh_id ? lichTrinhList.find(lt => lt.lich_trinh_id === cp.lich_trinh_id) : null
                    return (
                      <Card key={cp.chi_phi_id} className="cursor-pointer hover:bg-muted/50 transition-colors">
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <h4 className="font-semibold">{cp.mo_ta}</h4>
                                {cp.nhom && (
                                  <Badge variant="secondary" className="text-xs">{cp.nhom}</Badge>
                                )}
                              </div>
                              <div className="flex items-center gap-4 text-sm text-muted-foreground mt-2">
                                {diemDen && (
                                  <span className="flex items-center gap-1">
                                    <MapPin className="h-3 w-3" />
                                    {diemDen.ten_diem_den}
                                  </span>
                                )}
                                {cp.ngay && (
                                  <span className="flex items-center gap-1">
                                    <Calendar className="h-3 w-3" />
                                    {new Date(cp.ngay).toLocaleDateString("vi-VN")}
                                  </span>
                                )}
                                {lichTrinh && (
                                  <span className="flex items-center gap-1">
                                    <Clock className="h-3 w-3" />
                                    {lichTrinh.tieu_de}
                                  </span>
                                )}
                              </div>
                              <p className="text-sm font-bold text-primary mt-2">
                                {formatCurrency(cp.so_tien)} VNĐ
                              </p>
                            </div>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setEditingChiPhi(cp)
                                setEditChiPhiForm({
                                  diem_den_id: cp.diem_den_id,
                                  lich_trinh_id: cp.lich_trinh_id || 0,
                                  nguoi_chi_id: cp.nguoi_chi_id,
                                  nguoi_chi_ten: cp.nguoi_chi_ten,
                                  so_tien: cp.so_tien,
                                  mo_ta: cp.mo_ta,
                                  nhom: cp.nhom,
                                  ngay: cp.ngay
                                })
                              }}
                            >
                              <Pencil className="h-4 w-4 mr-2" />
                              Chỉnh sửa
                            </Button>
                          </div>
                      </CardContent>
                    </Card>
                    )
                  })}
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            {editingChiPhi ? (
              <>
                <Button
                  variant="outline"
                  onClick={() => {
                    setEditingChiPhi(null)
                    setEditChiPhiForm({
                      diem_den_id: 0,
                      lich_trinh_id: 0,
                      nguoi_chi_id: 0,
                      nguoi_chi_ten: "",
                      so_tien: 0,
                      mo_ta: "",
                      nhom: "",
                      ngay: ""
                    })
                  }}
                >
                  Quay lại
                </Button>
                <Button
                  onClick={async () => {
                    await handleUpdateChiPhi()
                  }}
                  disabled={isUpdatingChiPhi}
                >
                  {isUpdatingChiPhi ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Đang cập nhật...
                    </>
                  ) : (
                    <>
                      <Pencil className="h-4 w-4 mr-2" />
                      Cập nhật
                    </>
                  )}
                </Button>
              </>
            ) : (
              <Button
                variant="outline"
                onClick={() => setShowEditChiPhiModal(false)}
              >
                Đóng
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog so sánh kế hoạch */}
      <Dialog open={showCompareModal} onOpenChange={setShowCompareModal}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-primary" />
              So sánh kế hoạch
            </DialogTitle>
            <DialogDescription>
              So sánh kế hoạch hiện tại với kế hoạch gốc đã lưu
            </DialogDescription>
          </DialogHeader>

          {compareData ? (
            <div className="space-y-6 mt-4">
              {/* Thông tin thời gian */}
              {compareData.thoi_gian && (
                    <Card>
                      <CardHeader>
                    <CardTitle className="text-lg">Thông tin thời gian</CardTitle>
                      </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Kế hoạch gốc lưu lúc:</span>
                      <span className="font-medium">
                        {compareData.thoi_gian.ke_hoach_goc_luu_luc 
                          ? new Date(compareData.thoi_gian.ke_hoach_goc_luu_luc).toLocaleString("vi-VN")
                          : "—"}
                      </span>
                          </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Kế hoạch hiện tại lấy lúc:</span>
                      <span className="font-medium">
                        {compareData.thoi_gian.ke_hoach_hien_tai_lay_luc 
                          ? new Date(compareData.thoi_gian.ke_hoach_hien_tai_lay_luc).toLocaleString("vi-VN")
                          : "—"}
                      </span>
                          </div>
                    {compareData.thoi_gian.nguoi_tao_ke_hoach_goc && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Người tạo kế hoạch gốc:</span>
                        <span className="font-medium">{compareData.thoi_gian.nguoi_tao_ke_hoach_goc}</span>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  )}

              {/* Tóm tắt thay đổi */}
              {compareData.tom_tat && (
                    <Card>
                      <CardHeader>
                    <CardTitle className="text-lg">Tóm tắt thay đổi</CardTitle>
                      </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="text-center p-4 bg-muted rounded-lg">
                        <div className="text-2xl font-bold text-primary">{compareData.tom_tat.tong_so_thay_doi || 0}</div>
                        <div className="text-sm text-muted-foreground mt-1">Tổng số thay đổi</div>
                                  </div>
                      <div className="text-center p-4 bg-green-50 dark:bg-green-950/20 rounded-lg">
                        <div className="text-2xl font-bold text-green-600 dark:text-green-400">{compareData.tom_tat.so_the_moi || 0}</div>
                        <div className="text-sm text-muted-foreground mt-1">Đã thêm mới</div>
                                  </div>
                      <div className="text-center p-4 bg-yellow-50 dark:bg-yellow-950/20 rounded-lg">
                        <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">{compareData.tom_tat.so_da_sua || 0}</div>
                        <div className="text-sm text-muted-foreground mt-1">Đã chỉnh sửa</div>
                                </div>
                      <div className="text-center p-4 bg-red-50 dark:bg-red-950/20 rounded-lg">
                        <div className="text-2xl font-bold text-red-600 dark:text-red-400">{compareData.tom_tat.so_da_xoa || 0}</div>
                        <div className="text-sm text-muted-foreground mt-1">Đã xóa</div>
                              </div>
                          </div>
                  </CardContent>
                </Card>
              )}

              {/* Chi tiết thay đổi */}
              {compareData.thay_doi && (
                <div className="space-y-4">
                  {/* Điểm đến đã thêm */}
                  {compareData.thay_doi.da_them?.diem_den && compareData.thay_doi.da_them.diem_den.length > 0 && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg text-green-600 dark:text-green-400">
                          Điểm đến đã thêm ({compareData.thay_doi.da_them.diem_den.length})
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          {compareData.thay_doi.da_them.diem_den.map((dd: any, index: number) => (
                            <div key={index} className="p-3 bg-green-50 dark:bg-green-950/20 rounded-lg border border-green-200 dark:border-green-800">
                              <div className="font-semibold text-green-700 dark:text-green-300">{dd.ten_diem_den}</div>
                              <div className="text-sm text-muted-foreground mt-1">
                                Thứ tự: #{dd.thu_tu} • {dd.ngay_bat_dau && new Date(dd.ngay_bat_dau).toLocaleDateString("vi-VN")} - {dd.ngay_ket_thuc && new Date(dd.ngay_ket_thuc).toLocaleDateString("vi-VN")}
                                </div>
                              </div>
                            ))}
                          </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Điểm đến đã sửa */}
                  {compareData.thay_doi.da_sua?.diem_den && compareData.thay_doi.da_sua.diem_den.length > 0 && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg text-yellow-600 dark:text-yellow-400">
                          Điểm đến đã chỉnh sửa ({compareData.thay_doi.da_sua.diem_den.length})
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          {compareData.thay_doi.da_sua.diem_den.map((dd: any, index: number) => (
                            <div key={index} className="p-4 bg-yellow-50 dark:bg-yellow-950/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
                              <div className="font-semibold text-yellow-700 dark:text-yellow-300 mb-2">{dd.ten_diem_den}</div>
                              <div className="text-sm mb-2">
                                <span className="font-medium">Các trường thay đổi:</span> {dd.cac_truong_thay_doi?.map((field: string) => getFieldLabel(field)).join(", ") || "—"}
                                  </div>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3">
                                  <div>
                                  <div className="text-xs font-semibold text-muted-foreground mb-1">Giá trị cũ:</div>
                                  <div className="text-sm space-y-1">
                                    {dd.gia_tri_cu && Object.entries(dd.gia_tri_cu).map(([key, value]: [string, any]) => (
                                      <div key={key} className="text-red-600 dark:text-red-400">
                                        <span className="font-medium">{getFieldLabel(key)}:</span> {formatFieldValue(key, value)}
                                      </div>
                                    ))}
                                  </div>
                                  </div>
                                  <div>
                                  <div className="text-xs font-semibold text-muted-foreground mb-1">Giá trị mới:</div>
                                  <div className="text-sm space-y-1">
                                    {dd.gia_tri_moi && Object.entries(dd.gia_tri_moi).map(([key, value]: [string, any]) => (
                                      <div key={key} className="text-green-600 dark:text-green-400">
                                        <span className="font-medium">{getFieldLabel(key)}:</span> {formatFieldValue(key, value)}
                                      </div>
                                    ))}
                                  </div>
                              </div>
                          </div>
                            </div>
                          ))}
                          </div>
                      </CardContent>
                    </Card>
                  )}
                </div>
              )}

              {(!compareData.thay_doi || 
                (!compareData.thay_doi.da_them?.diem_den?.length && !compareData.thay_doi.da_sua?.diem_den?.length)) && (
                <div className="text-center py-8 text-muted-foreground">
                  Không có thay đổi nào so với kế hoạch gốc
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-8">
              <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
              <p className="text-muted-foreground">Đang tải dữ liệu so sánh...</p>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCompareModal(false)}>
              Đóng
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog xác nhận xóa điểm đến */}
      <AlertDialog open={showDeleteDiemDenDialog} onOpenChange={setShowDeleteDiemDenDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              Xác nhận xóa điểm đến
            </AlertDialogTitle>
            <AlertDialogDescription>
              Bạn có chắc chắn muốn xóa điểm đến <span className="font-semibold">"{deletingDiemDen?.ten_diem_den}"</span>? 
              Tất cả lịch trình và chi phí liên quan đến điểm đến này cũng sẽ bị xóa. Hành động này không thể hoàn tác.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => {
              setShowDeleteDiemDenDialog(false)
              setDeletingDiemDen(null)
            }}>
              Hủy
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={async () => {
                await handleDeleteDiemDen()
              }}
              disabled={isDeletingDiemDen}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeletingDiemDen ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Đang xóa...
                </>
              ) : (
                <>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Xóa
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
