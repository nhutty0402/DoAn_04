"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { X, MapPin, Calendar, FileText, Map, Search } from "lucide-react"
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

export function CreateTripModal({ onClose, onSubmit }: CreateTripModalProps) {
  const router = useRouter()
  const [formData, setFormData] = useState({
    ten_chuyen_di: "",
    mo_ta: "",
    dia_diem_xuat_phat: "",
    dia_diem_den: "",
    ngay_bat_dau: "",
    ngay_ket_thuc: "",
    tien_te: "VND",
    trang_thai: "planned",
    cong_khai: "0", // "0" = riêng tư, "1" = công khai (string for Select)
    toaDo: null as { lat: number; lng: number } | null,
    toaDoDen: null as { lat: number; lng: number } | null,
  })
  const [isLoading, setIsLoading] = useState(false)
  const [locationSuggestions, setLocationSuggestions] = useState<any[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [locationSuggestionsDen, setLocationSuggestionsDen] = useState<any[]>([])
  const [showSuggestionsDen, setShowSuggestionsDen] = useState(false)
  const { toast } = useToast()

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))

    if (field === "dia_diem_xuat_phat" && value.length > 2) {
      // Simulate Google Places API search
      const mockSuggestions = [
        { id: 1, name: "Đà Nẵng, Việt Nam", address: "Đà Nẵng, Việt Nam", lat: 16.0544, lng: 108.2022 },
        { id: 2, name: "Hội An, Quảng Nam", address: "Hội An, Quảng Nam, Việt Nam", lat: 15.8801, lng: 108.338 },
        { id: 3, name: "Bà Nà Hills, Đà Nẵng", address: "Bà Nà Hills, Đà Nẵng, Việt Nam", lat: 15.9969, lng: 107.9953 },
        { id: 4, name: "Cầu Rồng, Đà Nẵng", address: "Cầu Rồng, Đà Nẵng, Việt Nam", lat: 16.0608, lng: 108.2277 },
        { id: 5, name: "Bãi biển Mỹ Khê", address: "Bãi biển Mỹ Khê, Đà Nẵng, Việt Nam", lat: 16.0471, lng: 108.2425 },
      ].filter(
        (place) =>
          place.name.toLowerCase().includes(value.toLowerCase()) ||
          place.address.toLowerCase().includes(value.toLowerCase()),
      )

      setLocationSuggestions(mockSuggestions)
      setShowSuggestions(mockSuggestions.length > 0)
    } else if (field === "dia_diem_xuat_phat" && value.length <= 2) {
      setShowSuggestions(false)
    } else if (field === "dia_diem_den" && value.length > 2) {
      // Simulate Google Places API search for destination
      const mockSuggestions = [
        { id: 1, name: "Đà Nẵng, Việt Nam", address: "Đà Nẵng, Việt Nam", lat: 16.0544, lng: 108.2022 },
        { id: 2, name: "Hội An, Quảng Nam", address: "Hội An, Quảng Nam, Việt Nam", lat: 15.8801, lng: 108.338 },
        { id: 3, name: "Bà Nà Hills, Đà Nẵng", address: "Bà Nà Hills, Đà Nẵng, Việt Nam", lat: 15.9969, lng: 107.9953 },
        { id: 4, name: "Cầu Rồng, Đà Nẵng", address: "Cầu Rồng, Đà Nẵng, Việt Nam", lat: 16.0608, lng: 108.2277 },
        { id: 5, name: "Bãi biển Mỹ Khê", address: "Bãi biển Mỹ Khê, Đà Nẵng, Việt Nam", lat: 16.0471, lng: 108.2425 },
        { id: 6, name: "Hà Nội, Việt Nam", address: "Hà Nội, Việt Nam", lat: 21.0285, lng: 105.8542 },
        { id: 7, name: "TP. Hồ Chí Minh, Việt Nam", address: "TP. Hồ Chí Minh, Việt Nam", lat: 10.8231, lng: 106.6297 },
        { id: 8, name: "Huế, Thừa Thiên Huế", address: "Huế, Thừa Thiên Huế, Việt Nam", lat: 16.4637, lng: 107.5909 },
      ].filter(
        (place) =>
          place.name.toLowerCase().includes(value.toLowerCase()) ||
          place.address.toLowerCase().includes(value.toLowerCase()),
      )

      setLocationSuggestionsDen(mockSuggestions)
      setShowSuggestionsDen(mockSuggestions.length > 0)
    } else if (field === "dia_diem_den" && value.length <= 2) {
      setShowSuggestionsDen(false)
    }
  }

  const handleLocationSelect = (location: any) => {
    setFormData((prev) => ({
      ...prev,
      dia_diem_xuat_phat: location.name,
      toaDo: { lat: location.lat, lng: location.lng },
    }))
    setShowSuggestions(false)
    setLocationSuggestions([])
  }

  const handleLocationSelectDen = (location: any) => {
    setFormData((prev) => ({
      ...prev,
      dia_diem_den: location.name,
      toaDoDen: { lat: location.lat, lng: location.lng },
    }))
    setShowSuggestionsDen(false)
    setLocationSuggestionsDen([])
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

      // Lấy chu_so_huu_id từ tài khoản hiện tại
      let ownerId = ""
      try {
        const meRes = await axios.get("https://travel-planner-imdw.onrender.com/api/taikhoan/toi", {
          headers: { Authorization: `Bearer ${token}` },
        })
        ownerId = meRes.data?.nguoi_dung_id || ""
      } catch (error) {
        console.warn("Không thể lấy thông tin user:", error)
      }

      // Body chuẩn theo API yêu cầu
      const bodyPayload = {
        chuyen_di_id: null, // để null cho backend tự sinh
        ten_chuyen_di: formData.ten_chuyen_di,
        mo_ta: formData.mo_ta || "",
        dia_diem_xuat_phat: formData.dia_diem_xuat_phat,
        dia_diem_den: formData.dia_diem_den || "",
        ngay_bat_dau: formData.ngay_bat_dau,
        ngay_ket_thuc: formData.ngay_ket_thuc,
        chu_so_huu_id: ownerId,
        tien_te: formData.tien_te,
        trang_thai: formData.trang_thai,
        tao_luc: new Date().toISOString().replace('T', ' ').substring(0, 19), // Format: "2025-10-15 19:07:54"
        cong_khai: Number(formData.cong_khai), // 0 hoặc 1
      }

      // Sử dụng axios để gọi API
      const response = await axios.post("https://travel-planner-imdw.onrender.com/api/chuyendi", bodyPayload, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      })

      const created = response.data
      
      // Log để debug response structure
      console.log("API Response:", created)
      
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
        trang_thai: created?.trang_thai || created?.trangThai || "planned",
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
              <div className="space-y-2">
                <Label htmlFor="ten_chuyen_di">Tên chuyến đi</Label>
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

              <div className="space-y-2">
                <Label htmlFor="dia_diem_xuat_phat">Địa điểm xuất phát</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="dia_diem_xuat_phat"
                    type="text"
                    placeholder="Tìm kiếm địa điểm..."
                    value={formData.dia_diem_xuat_phat}
                    onChange={(e) => handleChange("dia_diem_xuat_phat", e.target.value)}
                    className="pl-10"
                    required
                  />
                  {showSuggestions && (
                    <div className="absolute top-full left-0 right-0 bg-card border border-border rounded-md shadow-lg z-10 max-h-48 overflow-y-auto">
                      {locationSuggestions.map((location) => (
                        <button
                          key={location.id}
                          type="button"
                          className="w-full text-left px-3 py-2 hover:bg-muted flex items-center gap-2"
                          onClick={() => handleLocationSelect(location)}
                        >
                          <Map className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <div className="font-medium text-sm">{location.name}</div>
                            <div className="text-xs text-muted-foreground">{location.address}</div>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                {formData.toaDo && (
                  <p className="text-xs text-muted-foreground">
                    📍 Tọa độ: {formData.toaDo.lat.toFixed(4)}, {formData.toaDo.lng.toFixed(4)}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="dia_diem_den">Điểm đến</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="dia_diem_den"
                    type="text"
                    placeholder="Tìm kiếm điểm đến..."
                    value={formData.dia_diem_den}
                    onChange={(e) => handleChange("dia_diem_den", e.target.value)}
                    className="pl-10"
                  />
                  {showSuggestionsDen && (
                    <div className="absolute top-full left-0 right-0 bg-card border border-border rounded-md shadow-lg z-10 max-h-48 overflow-y-auto">
                      {locationSuggestionsDen.map((location) => (
                        <button
                          key={location.id}
                          type="button"
                          className="w-full text-left px-3 py-2 hover:bg-muted flex items-center gap-2"
                          onClick={() => handleLocationSelectDen(location)}
                        >
                          <Map className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <div className="font-medium text-sm">{location.name}</div>
                            <div className="text-xs text-muted-foreground">{location.address}</div>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                {formData.toaDoDen && (
                  <p className="text-xs text-muted-foreground">
                    📍 Tọa độ: {formData.toaDoDen.lat.toFixed(4)}, {formData.toaDoDen.lng.toFixed(4)}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="ngay_bat_dau">Ngày bắt đầu</Label>
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
                  <Label htmlFor="ngay_ket_thuc">Ngày kết thúc</Label>
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

                {/* <div className="space-y-2">
               <Label>Trạng thái</Label>
              <Select
              value={formData.trang_thai || "planned"}
              onValueChange={(val) => handleChange("trang_thai", val)}
               disabled // 🟦 không cho chỉnh
                >
               <SelectTrigger className="w-full opacity-70 cursor-not-allowed">
                <SelectValue placeholder="Đang thực hiện" />
                </SelectTrigger>
                  <SelectContent>
                  <SelectItem value="planned">Đang thực hiện</SelectItem>
                 </SelectContent>
                 </Select>
                  </div> */}
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
