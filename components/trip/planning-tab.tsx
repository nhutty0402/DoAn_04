"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import axios from "axios"
import Cookies from "js-cookie"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Separator } from "@/components/ui/separator"
import { Plus, MapPin, Calendar, DollarSign, Clock, ChevronDown, Loader2, Save, ChevronRight } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

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

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || "https://travel-planner-imdw.onrender.com"

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
  const router = useRouter()
  
  // States
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
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
  
  // Owner info để lấy tên người chi
  const [tripOwner, setTripOwner] = useState<{
    nguoi_dung_id?: number
    ho_ten?: string
  } | null>(null)
  
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
  
  // ID counters - tạm thời cho frontend (sẽ được thay thế bằng ID từ backend)
  const [diemDenIdCounter, setDiemDenIdCounter] = useState(1)
  const [lichTrinhIdCounter, setLichTrinhIdCounter] = useState(1)
  const [chiPhiIdCounter, setChiPhiIdCounter] = useState(1)

  // Fetch thông tin chuyến đi để lấy dia_diem_xuat_phat
  const fetchTripInfo = async () => {
    try {
      const token = Cookies.get("token")
      if (!token || token === "null" || token === "undefined") {
        return
      }

      const response = await axios.get(
        `${BACKEND_URL}/api/chuyen-di/${tripId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      )

      const tripData = response.data?.chuyen_di || response.data
      if (tripData) {
        setTripInfo({
          dia_diem_xuat_phat: tripData.dia_diem_xuat_phat || "",
          ngay_bat_dau: tripData.ngay_bat_dau || "",
          ngay_ket_thuc: tripData.ngay_ket_thuc || "",
        })
      }
    } catch (err) {
      console.error("Lỗi khi lấy thông tin chuyến đi:", err)
    }
  }
  
  // Fetch danh sách thành viên để lấy chủ chuyến đi (owner)
  const fetchTripOwner = async () => {
    try {
      const token = Cookies.get("token")
      if (!token || token === "null" || token === "undefined") {
        return
      }

      const response = await axios.get(
        `${BACKEND_URL}/api/thanh-vien/${tripId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      )

      const members = response.data?.danh_sach || []
      // Tìm chủ chuyến đi (owner)
      const owner = members.find((m: any) => m.vai_tro === "owner" || m.role === "owner")
      
      if (owner) {
        setTripOwner({
          nguoi_dung_id: owner.nguoi_dung_id,
          ho_ten: owner.ho_ten || "",
        })
        // Tự động điền tên người chi
        setChiPhiForm(prev => ({
          ...prev,
          nguoi_chi_id: owner.nguoi_dung_id,
          nguoi_chi_ten: owner.ho_ten || "",
        }))
      }
    } catch (err) {
      console.error("Lỗi khi lấy thông tin chủ chuyến đi:", err)
    }
  }

  // Fetch kế hoạch hiện tại từ API
  const fetchKeHoachHienTai = async () => {
    setLoading(true)
    setError(null)
    
    try {
      const token = Cookies.get("token")
      if (!token || token === "null" || token === "undefined") {
        router.replace("/login")
        return
      }

      const response = await axios.get(
        `${BACKEND_URL}/api/ke-hoach-chuyen-di/${tripId}/ke-hoach-hien-tai`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      )

      const currentPlan = response.data?.current_plan
      if (!currentPlan) {
        // Không có dữ liệu, sử dụng empty arrays
        setDiemDenList([])
        setLichTrinhList([])
        setChiPhiList([])
        return
      }

      // Map dữ liệu từ backend format sang frontend format
      // Backend diem_den: id -> Frontend: diem_den_id
      const mappedDiemDen: DiemDen[] = (currentPlan.diem_den || []).map((dd: any) => ({
        diem_den_id: dd.id || dd.diem_den_id,
        ten_diem_den: dd.ten_diem_den || "",
        thu_tu: dd.thu_tu || 1,
        ngay_bat_dau: dd.ngay_bat_dau || "",
        ngay_ket_thuc: dd.ngay_ket_thuc || "",
        dia_diem_xuat_phat: dd.dia_diem_xuat_phat || "",
        ghi_chu: dd.ghi_chu || "",
      }))

      // Backend lich_trinh: lich_trinh_ngay_id -> Frontend: lich_trinh_id
      // Lưu ý: Backend không có diem_den_id trong lich_trinh, cần map theo ngày
      const mappedLichTrinh: LichTrinh[] = (currentPlan.lich_trinh || []).map((lt: any) => {
        // Tìm diem_den_id dựa trên ngày
        const matchingDiemDen = mappedDiemDen.find(
          (dd) => 
            (!dd.ngay_bat_dau || lt.ngay >= dd.ngay_bat_dau) &&
            (!dd.ngay_ket_thuc || lt.ngay <= dd.ngay_ket_thuc)
        )
        
        return {
          lich_trinh_id: lt.lich_trinh_ngay_id || lt.lich_trinh_id,
          diem_den_id: matchingDiemDen?.diem_den_id || 0,
          ngay: lt.ngay || "",
          tieu_de: lt.tieu_de || "",
          ghi_chu: lt.ghi_chu || "",
          gio_bat_dau: lt.gio_bat_dau || "",
          gio_ket_thuc: lt.gio_ket_thuc || "",
        }
      })

      // Backend chi_phi: đã có đầy đủ fields
      const mappedChiPhi: ChiPhi[] = (currentPlan.chi_phi || []).map((cp: any) => ({
        chi_phi_id: cp.chi_phi_id,
        diem_den_id: cp.diem_den_id || 0,
        nguoi_chi_id: cp.nguoi_chi_id || 0,
        nguoi_chi_ten: cp.nguoi_chi_ten || `ID: ${cp.nguoi_chi_id}`,
        so_tien: cp.so_tien || 0,
        mo_ta: cp.mo_ta || "",
        nhom: cp.nhom || "",
        ngay: cp.ngay || "",
      }))

      setDiemDenList(mappedDiemDen)
      setLichTrinhList(mappedLichTrinh)
      setChiPhiList(mappedChiPhi)

      // Cập nhật counters
      if (mappedDiemDen.length > 0) {
        const maxDiemDenId = Math.max(...mappedDiemDen.map(d => d.diem_den_id))
        setDiemDenIdCounter(maxDiemDenId + 1)
      }
      if (mappedLichTrinh.length > 0) {
        const maxLichTrinhId = Math.max(...mappedLichTrinh.map(l => l.lich_trinh_id))
        setLichTrinhIdCounter(maxLichTrinhId + 1)
      }
      if (mappedChiPhi.length > 0) {
        const maxChiPhiId = Math.max(...mappedChiPhi.map(c => c.chi_phi_id))
        setChiPhiIdCounter(maxChiPhiId + 1)
      }
    } catch (err: any) {
      console.error("Lỗi khi tải kế hoạch:", err)
      if (axios.isAxiosError(err) && err.response?.status === 401) {
        toast({
          title: "Lỗi xác thực",
          description: "Phiên đăng nhập đã hết hạn",
          variant: "destructive",
        })
        router.replace("/login")
      } else {
        setError(err.response?.data?.message || "Không thể tải kế hoạch")
        // Fallback về mock data nếu có lỗi
        setDiemDenList(mockDiemDen)
        setLichTrinhList(mockLichTrinh)
        setChiPhiList(mockChiPhi)
      }
    } finally {
      setLoading(false)
    }
  }

  // Lưu kế hoạch gốc lên API
  const saveKeHoachGoc = async () => {
    setSaving(true)
    
    try {
      const token = Cookies.get("token")
      if (!token || token === "null" || token === "undefined") {
        router.replace("/login")
        return
      }

      // Map dữ liệu từ frontend format sang backend format
      const diemDenPayload = diemDenList.map((dd) => ({
        ten_diem_den: dd.ten_diem_den,
        thu_tu: dd.thu_tu,
        ngay_bat_dau: dd.ngay_bat_dau || null,
        ngay_ket_thuc: dd.ngay_ket_thuc || null,
        dia_diem_xuat_phat: dd.dia_diem_xuat_phat || null,
        ghi_chu: dd.ghi_chu || null,
      }))

      // Map diem_den_id từ ID thực tế sang index trong mảng diem_den (backend yêu cầu)
      const lichTrinhPayload = lichTrinhList.map((lt) => {
        // Tìm index của điểm đến trong diemDenList
        let diemDenIndex = null
        if (lt.diem_den_id) {
          const index = diemDenList.findIndex(dd => dd.diem_den_id === lt.diem_den_id)
          if (index !== -1) {
            diemDenIndex = index
          } else {
            // Nếu không tìm thấy, thử dùng ID trực tiếp (backend sẽ xử lý)
            diemDenIndex = lt.diem_den_id
          }
        }
        
        return {
          ngay: lt.ngay,
          tieu_de: lt.tieu_de,
          ghi_chu: lt.ghi_chu || null,
          gio_bat_dau: lt.gio_bat_dau || null,
          gio_ket_thuc: lt.gio_ket_thuc || null,
          diem_den_id: diemDenIndex, // Backend cần index hoặc ID để map với điểm đến
        }
      })

      const chiPhiPayload = chiPhiList.map((cp) => ({
        diem_den_id: cp.diem_den_id || null,
        nguoi_chi_id: cp.nguoi_chi_id || null,
        so_tien: cp.so_tien,
        mo_ta: cp.mo_ta,
        nhom: cp.nhom || null,
        ngay: cp.ngay || null,
      }))

      // Debug: Log payload trước khi gửi
      const payload = {
        diem_den: diemDenPayload,
        lich_trinh: lichTrinhPayload,
        dia_diem: [], // Chưa có trong frontend
        chi_phi: chiPhiPayload,
      }
      
      console.log("🔍 Debug - Payload gửi lên API:", JSON.stringify(payload, null, 2))
      console.log("🔍 Debug - Số lượng:", {
        diem_den: diemDenPayload.length,
        lich_trinh: lichTrinhPayload.length,
        chi_phi: chiPhiPayload.length
      })

      const response = await axios.post(
        `${BACKEND_URL}/api/ke-hoach-chuyen-di/${tripId}/luu-ke-hoach-goc`,
        payload,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      )

      toast({
        title: "Thành công",
        description: response.data?.message || "Đã lưu kế hoạch gốc",
      })

      // Refresh dữ liệu sau khi lưu
      await fetchKeHoachHienTai()
    } catch (err: any) {
      console.error("Lỗi khi lưu kế hoạch:", err)
      toast({
        title: "Lỗi",
        description: err.response?.data?.message || "Không thể lưu kế hoạch",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  // Fetch dữ liệu khi component mount
  useEffect(() => {
    if (tripId) {
      fetchKeHoachHienTai()
      fetchTripInfo()
      fetchTripOwner() // Fetch thông tin chủ chuyến đi
    }
  }, [tripId])

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

  // Handle Diem Den - Chỉ thêm vào danh sách, không đóng modal (dùng cho nút "Tiếp theo")
  const handleDiemDenNext = (): boolean => {
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

    // Lưu ID của điểm đến vừa thêm để sử dụng sau
    const newDiemDenId = diemDenIdCounter

    setDiemDenList([...diemDenList, newDiemDen])
    setDiemDenIdCounter(diemDenIdCounter + 1)
    
    toast({
      title: "Thành công",
      description: "Đã thêm điểm đến",
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
  const handleLichTrinhSubmit = (): boolean => {
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

    const newLichTrinh: LichTrinh = {
      lich_trinh_id: lichTrinhIdCounter,
      diem_den_id: finalDiemDenId,
      ngay: lichTrinhForm.ngay,
      tieu_de: lichTrinhForm.tieu_de.trim(),
      ghi_chu: lichTrinhForm.ghi_chu,
      gio_bat_dau: lichTrinhForm.gio_bat_dau,
      gio_ket_thuc: lichTrinhForm.gio_ket_thuc,
    }

    // Debug: Kiểm tra dữ liệu trước khi thêm
    console.log("🔍 Debug - Thêm lịch trình:", {
      newLichTrinh,
      finalDiemDenId,
      currentLichTrinhList: lichTrinhList,
      diemDenList: diemDenList,
      diemDenListIds: diemDenList.map(d => d.diem_den_id)
    })

    // Đảm bảo diem_den_id là number
    const newLichTrinhWithCorrectId: LichTrinh = {
      ...newLichTrinh,
      diem_den_id: Number(finalDiemDenId)
    }

    setLichTrinhList([...lichTrinhList, newLichTrinhWithCorrectId])
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
  const handleLichTrinhAdd = (): boolean => {
    const success = handleLichTrinhSubmit()
    // Không chuyển tab, chỉ reset form (diem_den_id đã được giữ lại trong handleLichTrinhSubmit)
    return success
  }

  // Handle Lich Trinh - Chỉ thêm vào danh sách, không đóng modal (dùng cho nút "Tiếp theo")
  const handleLichTrinhNext = (): boolean => {
    // Lưu diem_den_id trước khi submit (vì form sẽ bị reset)
    const savedDiemDenId = lichTrinhForm.diem_den_id
    
    const success = handleLichTrinhSubmit()
    if (success) {
      // Chuyển sang tab "Chi phí"
      setActiveTab("chi-phi")
      // Tự động chọn điểm đến trong tab "Chi phí"
      if (savedDiemDenId) {
        setChiPhiForm(prev => ({
          ...prev,
          diem_den_id: savedDiemDenId
        }))
      }
    }
    return success
  }

  // Handle Chi Phi - Frontend only
  const handleChiPhiSubmit = (): boolean => {
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

    const newChiPhi: ChiPhi = {
      chi_phi_id: chiPhiIdCounter,
      diem_den_id: finalDiemDenId,
      lich_trinh_id: chiPhiForm.lich_trinh_id && chiPhiForm.lich_trinh_id !== 0 ? chiPhiForm.lich_trinh_id : undefined,
      nguoi_chi_id: chiPhiForm.nguoi_chi_id || tripOwner?.nguoi_dung_id || chiPhiIdCounter,
      nguoi_chi_ten: nguoiChiTen,
      so_tien: chiPhiForm.so_tien,
      mo_ta: chiPhiForm.mo_ta.trim(),
      nhom: chiPhiForm.nhom,
      ngay: chiPhiForm.ngay || new Date().toISOString().split("T")[0],
    }

    setChiPhiList([...chiPhiList, newChiPhi])
    setChiPhiIdCounter(chiPhiIdCounter + 1)
    
    toast({
      title: "Thành công",
      description: `Đã thêm chi phí: ${newChiPhi.mo_ta} - ${newChiPhi.so_tien.toLocaleString('vi-VN')} VNĐ`,
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
  const handleChiPhiAdd = (): boolean => {
    const success = handleChiPhiSubmit()
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

  // Sort điểm đến theo thứ tự
  const sortedDiemDenList = [...diemDenList].sort((a, b) => a.thu_tu - b.thu_tu)

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2 text-muted-foreground">Đang tải kế hoạch...</span>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header với nút Thêm kế hoạch và Lưu */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Kế hoạch chuyến đi</h2>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            onClick={saveKeHoachGoc}
            disabled={saving}
          >
            {saving ? (
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

      {error && (
        <Card className="border-destructive">
          <CardContent className="p-4">
            <p className="text-sm text-destructive">{error}</p>
          </CardContent>
        </Card>
      )}

      {/* Hiển thị điểm đến với lịch trình và chi phí */}
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
                            ({totalChiPhi.toLocaleString("vi-VN")} VNĐ)
                          </span>
                        )}
                      </Badge>
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

                    {/* Lịch trình */}
                    <div>
                      <div className="flex items-center gap-2 mb-3">
                        <Calendar className="h-4 w-4 text-primary" />
                        <h4 className="font-semibold">Lịch trình</h4>
                        <Badge variant="outline">{lichTrinhOfDiemDen.length} hoạt động</Badge>
                      </div>
                      {lichTrinhOfDiemDen.length === 0 ? (
                        <p className="text-sm text-muted-foreground pl-6">Chưa có lịch trình nào cho điểm đến này</p>
                      ) : (
                        <div className="space-y-3 pl-6">
                          {lichTrinhOfDiemDen.map((lichTrinh) => {
                            // Lấy chi phí của lịch trình này (nếu có lich_trinh_id) hoặc chi phí theo ngày (nếu không có lich_trinh_id)
                            const chiPhiOfLichTrinh = lichTrinh.lich_trinh_id 
                              ? getChiPhiByLichTrinh(lichTrinh.lich_trinh_id)
                              : getChiPhiByNgay(diemDen.diem_den_id, lichTrinh.ngay)
                            const totalChiPhiNgay = chiPhiOfLichTrinh.reduce((sum, cp) => sum + cp.so_tien, 0)

                            return (
                              <Card key={lichTrinh.lich_trinh_id} className="border-l-4 border-l-primary">
                                <CardContent className="p-4">
                                  <div className="space-y-3">
                                    {/* Thông tin lịch trình */}
                                    <div>
                                      <h5 className="font-semibold mb-2">{lichTrinh.tieu_de}</h5>
                                      <div className="flex items-center gap-4 text-sm text-muted-foreground mb-2">
                                        <span className="flex items-center gap-1">
                                          <Calendar className="h-3 w-3" />
                                          {new Date(lichTrinh.ngay).toLocaleDateString("vi-VN")}
                                        </span>
                                        {lichTrinh.gio_bat_dau && lichTrinh.gio_ket_thuc && (
                                          <span className="flex items-center gap-1">
                                            <Clock className="h-3 w-3" />
                                            {lichTrinh.gio_bat_dau} - {lichTrinh.gio_ket_thuc}
                                          </span>
                                        )}
                                      </div>
                                      {lichTrinh.ghi_chu && (
                                        <p className="text-sm text-muted-foreground">{lichTrinh.ghi_chu}</p>
                                      )}
                                    </div>

                                    {/* Chi phí của lịch trình này */}
                                    {chiPhiOfLichTrinh.length > 0 && (
                                      <div className="mt-3 pt-3 border-t">
                                        <div className="flex items-center gap-2 mb-2">
                                          <DollarSign className="h-3 w-3 text-secondary" />
                                          <span className="text-sm font-medium text-muted-foreground">Chi phí trong ngày:</span>
                                          {totalChiPhiNgay > 0 && (
                                            <Badge variant="secondary" className="ml-auto">
                                              Tổng: {totalChiPhiNgay.toLocaleString("vi-VN")} VNĐ
                                            </Badge>
                                          )}
                                        </div>
                                        <div className="space-y-2 ml-5">
                                          {chiPhiOfLichTrinh.map((chiPhi) => (
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
                                                  {chiPhi.so_tien.toLocaleString("vi-VN")} VNĐ
                                                </p>
                                              </div>
                                            </div>
                                          ))}
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                </CardContent>
                              </Card>
                            )
                          })}
                        </div>
                      )}
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
                            {totalChiPhi.toLocaleString("vi-VN")} VNĐ
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
            onValueChange={(value) => {
              // Lưu dữ liệu hiện tại trước khi chuyển tab
              // Dữ liệu đã được lưu trong state, chỉ cần chuyển tab
              setActiveTab(value)
            }} 
            className="w-full"
          >
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="diem-den" className="flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                Điểm đến
              </TabsTrigger>
              <TabsTrigger value="lich-trinh" className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Lịch trình
              </TabsTrigger>
              <TabsTrigger value="chi-phi" className="flex items-center gap-2">
                <DollarSign className="h-4 w-4" />
                Chi phí
              </TabsTrigger>
            </TabsList>

            {/* Tab Điểm đến */}
            <TabsContent value="diem-den" className="space-y-4 mt-4">
              <div>
                <Label htmlFor="ten_diem_den">Tên điểm đến *</Label>
                <Select
                  value={diemDenForm.ten_diem_den}
                  onValueChange={(val) => setDiemDenForm({ ...diemDenForm, ten_diem_den: val })}
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
              <div>
                <Label htmlFor="thu_tu">Thứ tự</Label>
                <Input
                  id="thu_tu"
                  type="number"
                  value={diemDenForm.thu_tu}
                  onChange={(e) => setDiemDenForm({ ...diemDenForm, thu_tu: parseInt(e.target.value) || 1 })}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="ngay_bat_dau">Ngày bắt đầu</Label>
                  <Input
                    id="ngay_bat_dau"
                    type="date"
                    value={diemDenForm.ngay_bat_dau}
                    onChange={(e) => setDiemDenForm({ ...diemDenForm, ngay_bat_dau: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="ngay_ket_thuc">Ngày kết thúc</Label>
                  <Input
                    id="ngay_ket_thuc"
                    type="date"
                    value={diemDenForm.ngay_ket_thuc}
                    onChange={(e) => setDiemDenForm({ ...diemDenForm, ngay_ket_thuc: e.target.value })}
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="dia_diem_xuat_phat">Địa điểm xuất phát</Label>
                <select
                  id="dia_diem_xuat_phat"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  value={diemDenForm.dia_diem_xuat_phat}
                  onChange={(e) => setDiemDenForm({ ...diemDenForm, dia_diem_xuat_phat: e.target.value })}
                >
                  <option value="" disabled>Chọn địa điểm xuất phát</option>
                  {/* Địa điểm xuất phát của chuyến đi */}
                  {tripInfo?.dia_diem_xuat_phat && (
                    <option value={tripInfo.dia_diem_xuat_phat}>
                      {tripInfo.dia_diem_xuat_phat} (Điểm xuất phát ban đầu)
                    </option>
                  )}
                  {/* Tất cả các điểm đến đã thêm */}
                  {diemDenList.map((diemDen) => (
                    <option key={diemDen.diem_den_id} value={diemDen.ten_diem_den}>
                      {diemDen.ten_diem_den}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-muted-foreground mt-1">
                  Chọn địa điểm xuất phát từ điểm xuất phát ban đầu hoặc các điểm đến đã thêm
                </p>
              </div>
              <div>
                <Label htmlFor="ghi_chu_diem_den">Ghi chú</Label>
                <Textarea
                  id="ghi_chu_diem_den"
                  value={diemDenForm.ghi_chu}
                  onChange={(e) => setDiemDenForm({ ...diemDenForm, ghi_chu: e.target.value })}
                  placeholder="Nhập ghi chú"
                  rows={3}
                />
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowAddPlanModal(false)}>
                  Hủy
                </Button>
                <Button onClick={() => {
                  handleDiemDenNext()
                }}>
                  <ChevronRight className="h-4 w-4 mr-2" />
                  Tiếp theo
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
                <Label htmlFor="diem_den_id_lich_trinh">Điểm đến *</Label>
                <select
                  id="diem_den_id_lich_trinh"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  value={lichTrinhForm.diem_den_id}
                  onChange={(e) => setLichTrinhForm({ ...lichTrinhForm, diem_den_id: parseInt(e.target.value) })}
                >
                  <option value={0} disabled>Chọn điểm đến</option>
                  {/* Kiểm tra xem điểm đến đang điền có trùng với danh sách không */}
                  {(() => {
                    const isDuplicate = diemDenList.some(
                      (dd) => dd.ten_diem_den.trim().toLowerCase() === diemDenForm.ten_diem_den.trim().toLowerCase()
                    )
                    // Chỉ hiển thị "đang điền" nếu không trùng với danh sách
                    if (diemDenForm.ten_diem_den && !isDuplicate) {
                      return (
                        <option value={-1} style={{ fontWeight: 'bold', color: '#3b82f6' }}>
                          {diemDenForm.ten_diem_den} (đang điền)
                        </option>
                      )
                    }
                    return null
                  })()}
                  {/* Hiển thị danh sách điểm đến đã thêm */}
                  {diemDenList.map((diemDen) => (
                    <option key={diemDen.diem_den_id} value={diemDen.diem_den_id}>
                      {diemDen.ten_diem_den}
                    </option>
                  ))}
                </select>
                {diemDenForm.ten_diem_den && (
                  <p className="text-xs text-muted-foreground mt-1">
                    💡 Điểm đến đang điền ở tab "Điểm đến" sẽ được thêm vào danh sách sau khi bạn click "Thêm"
                  </p>
                )}
              </div>
              <div>
                <Label htmlFor="ngay_lich_trinh">Ngày *</Label>
                <Input
                  id="ngay_lich_trinh"
                  type="date"
                  value={lichTrinhForm.ngay}
                  onChange={(e) => setLichTrinhForm({ ...lichTrinhForm, ngay: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="tieu_de">Tiêu đề *</Label>
                <Input
                  id="tieu_de"
                  value={lichTrinhForm.tieu_de}
                  onChange={(e) => setLichTrinhForm({ ...lichTrinhForm, tieu_de: e.target.value })}
                  placeholder="Nhập tiêu đề"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="gio_bat_dau">Giờ bắt đầu</Label>
                  <Input
                    id="gio_bat_dau"
                    type="time"
                    value={lichTrinhForm.gio_bat_dau}
                    onChange={(e) => setLichTrinhForm({ ...lichTrinhForm, gio_bat_dau: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="gio_ket_thuc">Giờ kết thúc</Label>
                  <Input
                    id="gio_ket_thuc"
                    type="time"
                    value={lichTrinhForm.gio_ket_thuc}
                    onChange={(e) => setLichTrinhForm({ ...lichTrinhForm, gio_ket_thuc: e.target.value })}
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="ghi_chu_lich_trinh">Ghi chú</Label>
                <Textarea
                  id="ghi_chu_lich_trinh"
                  value={lichTrinhForm.ghi_chu}
                  onChange={(e) => setLichTrinhForm({ ...lichTrinhForm, ghi_chu: e.target.value })}
                  placeholder="Nhập ghi chú"
                  rows={3}
                />
              </div>
              <DialogFooter className="flex gap-2">
                <Button variant="outline" onClick={() => setShowAddPlanModal(false)}>
                  Hủy
                </Button>
                <Button 
                  variant="secondary"
                  onClick={() => {
                    handleLichTrinhAdd()
                  }}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Thêm lịch trình khác
                </Button>
                <Button onClick={() => {
                  handleLichTrinhNext()
                }}>
                  <ChevronRight className="h-4 w-4 mr-2" />
                  Tiếp theo
                </Button>
              </DialogFooter>
            </TabsContent>

            {/* Tab Chi phí */}
            <TabsContent value="chi-phi" className="space-y-4 mt-4">
              {/* Hiển thị danh sách chi phí đã thêm */}
              {chiPhiList.length > 0 && (
                <div className="bg-muted/50 p-4 rounded-lg border">
                  <div className="flex items-center justify-between mb-2">
                    <Label className="text-sm font-semibold">Chi phí đã thêm ({chiPhiList.length})</Label>
                    <Badge variant="secondary" className="text-xs">
                      Tổng: {chiPhiList.reduce((sum, cp) => sum + cp.so_tien, 0).toLocaleString('vi-VN')} VNĐ
                    </Badge>
                  </div>
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {chiPhiList.map((cp) => {
                      const diemDen = diemDenList.find(dd => dd.diem_den_id === cp.diem_den_id)
                      const lichTrinh = cp.lich_trinh_id ? lichTrinhList.find(lt => lt.lich_trinh_id === cp.lich_trinh_id) : null
                      return (
                        <div key={cp.chi_phi_id} className="bg-background p-2 rounded border text-sm">
                          <div className="flex items-center justify-between">
                            <span className="font-medium">{cp.mo_ta}</span>
                            <Badge variant="outline" className="text-xs font-semibold">
                              {cp.so_tien.toLocaleString('vi-VN')} VNĐ
                            </Badge>
                          </div>
                          <div className="flex items-center gap-2 mt-1">
                            {cp.nhom && (
                              <Badge variant="secondary" className="text-xs">
                                {cp.nhom}
                              </Badge>
                            )}
                            {cp.ngay && (
                              <span className="text-xs text-muted-foreground">
                                📅 {cp.ngay}
                              </span>
                            )}
                          </div>
                          {diemDen && (
                            <p className="text-xs text-muted-foreground mt-1">
                              📍 {diemDen.ten_diem_den}
                            </p>
                          )}
                          {lichTrinh && (
                            <p className="text-xs text-muted-foreground">
                              📋 Lịch trình: {lichTrinh.tieu_de}
                            </p>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}
              <div>
                <Label htmlFor="diem_den_id_chi_phi">Điểm đến *</Label>
                <select
                  id="diem_den_id_chi_phi"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  value={chiPhiForm.diem_den_id}
                  onChange={(e) => setChiPhiForm({ ...chiPhiForm, diem_den_id: parseInt(e.target.value) })}
                >
                  <option value={0} disabled>Chọn điểm đến</option>
                  {/* Kiểm tra xem điểm đến đang điền có trùng với danh sách không */}
                  {(() => {
                    const isDuplicate = diemDenList.some(
                      (dd) => dd.ten_diem_den.trim().toLowerCase() === diemDenForm.ten_diem_den.trim().toLowerCase()
                    )
                    // Chỉ hiển thị "đang điền" nếu không trùng với danh sách
                    if (diemDenForm.ten_diem_den && !isDuplicate) {
                      return (
                        <option value={-1} style={{ fontWeight: 'bold', color: '#3b82f6' }}>
                          {diemDenForm.ten_diem_den} (đang điền)
                        </option>
                      )
                    }
                    return null
                  })()}
                  {/* Hiển thị danh sách điểm đến đã thêm */}
                  {diemDenList.map((diemDen) => (
                    <option key={diemDen.diem_den_id} value={diemDen.diem_den_id}>
                      {diemDen.ten_diem_den}
                    </option>
                  ))}
                </select>
                {diemDenForm.ten_diem_den && (
                  <p className="text-xs text-muted-foreground mt-1">
                    💡 Điểm đến đang điền ở tab "Điểm đến" sẽ được thêm vào danh sách sau khi bạn click "Thêm"
                  </p>
                )}
              </div>
              {/* Dropdown chọn lịch trình (filter theo điểm đến đã chọn) */}
              {chiPhiForm.diem_den_id && chiPhiForm.diem_den_id !== 0 && (
                <div>
                  <Label htmlFor="lich_trinh_id_chi_phi">Lịch trình (tùy chọn)</Label>
                  <select
                    id="lich_trinh_id_chi_phi"
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    value={chiPhiForm.lich_trinh_id || 0}
                    onChange={(e) => {
                      const selectedLichTrinhId = parseInt(e.target.value)
                      // Tự động điền ngày từ lịch trình đã chọn
                      if (selectedLichTrinhId && selectedLichTrinhId !== 0) {
                        const selectedLichTrinh = lichTrinhList.find(lt => lt.lich_trinh_id === selectedLichTrinhId)
                        if (selectedLichTrinh && selectedLichTrinh.ngay) {
                          setChiPhiForm(prev => ({ ...prev, lich_trinh_id: selectedLichTrinhId, ngay: selectedLichTrinh.ngay }))
                        } else {
                          setChiPhiForm(prev => ({ ...prev, lich_trinh_id: selectedLichTrinhId }))
                        }
                      } else {
                        setChiPhiForm(prev => ({ ...prev, lich_trinh_id: 0 }))
                      }
                    }}
                  >
                    <option value={0}>Không chọn lịch trình</option>
                    {(() => {
                      // Lấy danh sách các lịch trình đã có chi phí
                      const lichTrinhDaCoChiPhi = chiPhiList
                        .filter(cp => cp.lich_trinh_id && cp.lich_trinh_id !== 0)
                        .map(cp => cp.lich_trinh_id)
                      
                      // Filter lịch trình: chỉ hiển thị những lịch trình chưa có chi phí
                      // Loại bỏ hoàn toàn các lịch trình đã có chi phí
                      return lichTrinhList
                        .filter(lt => lt.diem_den_id === chiPhiForm.diem_den_id)
                        .filter(lt => !lichTrinhDaCoChiPhi.includes(lt.lich_trinh_id))
                        .map((lichTrinh) => (
                          <option key={lichTrinh.lich_trinh_id} value={lichTrinh.lich_trinh_id}>
                            {lichTrinh.tieu_de} - {lichTrinh.ngay} {lichTrinh.gio_bat_dau ? `(${lichTrinh.gio_bat_dau})` : ''}
                          </option>
                        ))
                    })()}
                  </select>
                  <p className="text-xs text-muted-foreground mt-1">
                    💡 Chọn lịch trình để liên kết chi phí với hoạt động cụ thể. Ngày sẽ được tự động điền.
                  </p>
                </div>
              )}
              <div>
                <Label htmlFor="nguoi_chi_ten">Tên người chi *</Label>
                <Input
                  id="nguoi_chi_ten"
                  value={chiPhiForm.nguoi_chi_ten || tripOwner?.ho_ten || ""}
                  readOnly
                  disabled
                  className="bg-muted cursor-not-allowed"
                  placeholder="Tự động điền từ chủ chuyến đi"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Tên người chi luôn là chủ của chuyến đi
                </p>
              </div>
              <div>
                <Label htmlFor="so_tien">Số tiền *</Label>
                <Input
                  id="so_tien"
                  type="number"
                  value={chiPhiForm.so_tien || ""}
                  onChange={(e) => setChiPhiForm({ ...chiPhiForm, so_tien: parseFloat(e.target.value) || 0 })}
                  placeholder="Nhập số tiền"
                />
              </div>
              <div>
                <Label htmlFor="mo_ta">Mô tả *</Label>
                <Input
                  id="mo_ta"
                  value={chiPhiForm.mo_ta}
                  onChange={(e) => setChiPhiForm({ ...chiPhiForm, mo_ta: e.target.value })}
                  placeholder="Nhập mô tả"
                />
              </div>
              <div>
                <Label htmlFor="nhom">Nhóm *</Label>
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
              <div>
                <Label htmlFor="ngay_chi_phi">Ngày</Label>
                <Input
                  id="ngay_chi_phi"
                  type="date"
                  value={chiPhiForm.ngay}
                  onChange={(e) => setChiPhiForm({ ...chiPhiForm, ngay: e.target.value })}
                />
              </div>
              <DialogFooter className="flex gap-2">
                <Button variant="outline" onClick={() => setShowAddPlanModal(false)}>
                  Hủy
                </Button>
                <Button 
                  variant="secondary"
                  onClick={() => {
                    handleChiPhiAdd()
                  }}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Thêm chi phí khác
                </Button>
                <Button onClick={() => {
                  const success = handleChiPhiSubmit()
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
                }}>
                  Hoàn thành
                </Button>
              </DialogFooter>
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>
    </div>
  )
}

