"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { X, MapPin, Calendar, FileText } from "lucide-react"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { motion } from "framer-motion"
import Cookies from "js-cookie"
import { useRouter } from "next/navigation"
import axios from "axios"

interface CreateTripModalProps {
  onClose: () => void
  onSubmit: (tripData: any) => void
}

// Danh sách các tỉnh/thành phố Việt Nam
const TINH_THANH_PHO = [
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

export function CreateTripModal({ onClose, onSubmit }: CreateTripModalProps) {
  const router = useRouter()
  const [formData, setFormData] = useState({
    ten_chuyen_di: "",
    mo_ta: "",
    dia_diem_xuat_phat: "",
    ngay_bat_dau: "",
    ngay_ket_thuc: "",
    tien_te: "VND",
    cong_khai: "0", // "0" = riêng tư, "1" = công khai (string for Select)
  })
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (new Date(formData.ngay_ket_thuc) <= new Date(formData.ngay_bat_dau)) {
      toast({
        title: "Lỗi ngày tháng",
        description: "Ngày kết thúc phải sau ngày bắt đầu",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)

    try {
      const token = Cookies.get("token") // ✅ lấy từ cookie
      console.log("Token từ cookie:", token)
      if (!token || token === "null" || token === "undefined") {
        console.warn("Không có token → chuyển về /login")
        router.replace("/login")
        return
      }

      // Body chuẩn theo API yêu cầu - chỉ gửi các trường backend cần
      // Backend tự lấy chu_so_huu_id từ req.user và tự set trang_thai = 'dang_thuc_hien'
      const bodyPayload = {
        ten_chuyen_di: formData.ten_chuyen_di,
        mo_ta: formData.mo_ta || "",
        dia_diem_xuat_phat: formData.dia_diem_xuat_phat,
        ngay_bat_dau: formData.ngay_bat_dau,
        ngay_ket_thuc: formData.ngay_ket_thuc,
        tien_te: formData.tien_te,
        cong_khai: Number(formData.cong_khai), // 0 hoặc 1
      }

      // Sử dụng axios để gọi API
      const response = await axios.post("https://travel-planner-imdw.onrender.com/api/chuyen-di", bodyPayload, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      })

      // API response structure: { message: "...", chuyen_di: {...} }
      const responseData = response.data
      const created = responseData?.chuyen_di || responseData
      
      // Log để debug response structure
      console.log("API Response:", responseData)
      console.log("Chuyến đi đã tạo:", created)
      
      // Kiểm tra cấu trúc response và chuẩn hóa
      const normalizedResponse = {
        chuyen_di_id: created?.chuyen_di_id || created?.id || null,
        ten_chuyen_di: created?.ten_chuyen_di || created?.tenChuyenDi || "",
        mo_ta: created?.mo_ta || created?.moTa || "",
        dia_diem_xuat_phat: created?.dia_diem_xuat_phat || created?.diaDiemXuatPhat || "",
        ngay_bat_dau: created?.ngay_bat_dau || created?.ngayBatDau || "",
        ngay_ket_thuc: created?.ngay_ket_thuc || created?.ngayKetThuc || "",
        chu_so_huu_id: created?.chu_so_huu_id || created?.chuSoHuuId || "",
        tien_te: created?.tien_te || created?.tienTe || "VND",
        trang_thai: created?.trang_thai || created?.trangThai || "dang_thuc_hien",
        tao_luc: created?.tao_luc || created?.taoLuc || new Date().toISOString(),
        cong_khai: typeof created?.cong_khai === 'number' ? created.cong_khai : Number(created?.cong_khai ?? formData.cong_khai),
      }

      onSubmit(normalizedResponse)
      toast({
        title: "Tạo chuyến đi thành công!",
        description: "Chuyến đi mới đã được tạo và sẵn sàng để lập kế hoạch",
      })
      onClose()
    } catch (error: any) {
      console.error("Error creating trip:", error)
      
      let errorMessage = "Có lỗi xảy ra khi tạo chuyến đi"
      
      if (axios.isAxiosError(error)) {
        if (error.response) {
          // Server responded with error status
          errorMessage = error.response.data?.message || `HTTP ${error.response.status}: ${error.response.statusText}`
        } else if (error.request) {
          // Request was made but no response received
          errorMessage = "Không thể kết nối đến server. Vui lòng kiểm tra kết nối mạng."
        } else {
          // Something else happened
          errorMessage = error.message || "Có lỗi xảy ra khi tạo chuyến đi"
        }
      } else {
        errorMessage = error?.message || errorMessage
      }
      
      toast({
        title: "Lỗi tạo chuyến đi",
        description: errorMessage,
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-card rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto"
      >
        <Card className="border-0 shadow-none">
          <CardHeader className="relative">
            <Button variant="ghost" size="icon" className="absolute right-2 top-2" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
            <CardTitle className="text-2xl font-[family-name:var(--font-space-grotesk)]">Tạo Chuyến Đi Mới</CardTitle>
            <CardDescription className="font-[family-name:var(--font-dm-sans)]">
              Nhập thông tin cơ bản cho chuyến đi của bạn
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* 1. ten_chuyen_di - BẮT BUỘC */}
              <div className="space-y-2">
                <Label htmlFor="ten_chuyen_di">Tên chuyến đi <span className="text-destructive">*</span></Label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="ten_chuyen_di"
                    type="text"
                    placeholder="Ví dụ: Du lịch Đà Nẵng"
                    value={formData.ten_chuyen_di}
                    onChange={(e) => handleChange("ten_chuyen_di", e.target.value)}
                    className="pl-10"
                    required
                  />
                </div>
              </div>
              {/* 3. dia_diem_xuat_phat - BẮT BUỘC */}
              <div className="space-y-2">
                <Label htmlFor="dia_diem_xuat_phat">Địa điểm xuất phát <span className="text-destructive">*</span></Label>
                <Select
                  value={formData.dia_diem_xuat_phat}
                  onValueChange={(val) => handleChange("dia_diem_xuat_phat", val)}
                  required
                >
                  <SelectTrigger id="dia_diem_xuat_phat" className="w-full">
                    <SelectValue placeholder="Chọn tỉnh/thành phố" />
                  </SelectTrigger>
                  <SelectContent className="max-h-[300px]">
                    {TINH_THANH_PHO.map((tinh) => (
                      <SelectItem key={tinh} value={tinh}>
                        {tinh}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            


              {/* 4. ngay_bat_dau - BẮT BUỘC */}
              {/* 5. ngay_ket_thuc - BẮT BUỘC */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="ngay_bat_dau">Ngày bắt đầu <span className="text-destructive">*</span></Label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="ngay_bat_dau"
                      type="date"
                      value={formData.ngay_bat_dau}
                      onChange={(e) => handleChange("ngay_bat_dau", e.target.value)}
                      className="pl-10"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="ngay_ket_thuc">Ngày kết thúc <span className="text-destructive">*</span></Label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="ngay_ket_thuc"
                      type="date"
                      value={formData.ngay_ket_thuc}
                      onChange={(e) => handleChange("ngay_ket_thuc", e.target.value)}
                      className="pl-10"
                      required
                    />
                  </div>
                </div>
              </div>
  {/* 2. mo_ta - TÙY CHỌN */}
  <div className="space-y-2">
                <Label htmlFor="mo_ta">Mô tả (tùy chọn)</Label>
                <div className="relative">
                  <FileText className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Textarea
                    id="mo_ta"
                    placeholder="Mô tả ngắn về chuyến đi..."
                    value={formData.mo_ta}
                    onChange={(e) => handleChange("mo_ta", e.target.value)}
                    className="pl-10 min-h-[80px] resize-none"
                  />
                </div>
              </div>

              {/* 6. tien_te - BẮT BUỘC (mặc định VND) */}
              {/* 7. cong_khai - BẮT BUỘC */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Tiền tệ</Label>
                  <Select
                    value={formData.tien_te}
                    onValueChange={(val) => handleChange("tien_te", val)}
                    disabled
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Chọn tiền tệ" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="VND">VND</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="cong_khai">Chế độ hiển thị</Label>
                  <Select
                    value={formData.cong_khai}
                    onValueChange={(val) => handleChange("cong_khai", val)}
                  >
                    <SelectTrigger id="cong_khai" className="w-full cong_khai">
                      <SelectValue placeholder="Chọn chế độ hiển thị" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">Công khai</SelectItem>
                      <SelectItem value="0">Riêng tư</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <Button type="button" variant="outline" onClick={onClose} className="flex-1 bg-transparent">
                  Hủy
                </Button>
                <Button type="submit" className="flex-1 bg-primary hover:bg-primary/90" disabled={isLoading}>
                  {isLoading ? "Đang tạo..." : "Tạo Chuyến Đi"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}
