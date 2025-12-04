"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import axios from "axios"
import Cookies from "js-cookie"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { X, Calendar, FileText, Check, ChevronsUpDown, MapPin } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { motion } from "framer-motion"
import { cn } from "@/lib/utils"

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

interface EditDayModalProps {
  day: any // Điểm đến cần chỉnh sửa
  diem_den_id?: string // ID điểm đến (nếu có)
  tripId?: string // ID chuyến đi
  onClose: () => void
  onSubmit: (dayData: any) => void
}

export function EditDayModal({ day, diem_den_id, tripId, onClose, onSubmit }: EditDayModalProps) {
  // Lấy diem_den_id từ day nếu không có trong props
  const actualDiemDenId = diem_den_id || day.diem_den_id || day.id

  const [formData, setFormData] = useState({
    ten_diem_den: day.ten_diem_den || day.tieuDe?.replace(/^#\d+: /, "") || "",
    ngay_bat_dau: day.ngay_bat_dau || "",
    ngay_ket_thuc: day.ngay_ket_thuc || "",
    dia_diem_xuat_phat: day.dia_diem_xuat_phat || "",
    ghi_chu: day.ghi_chu || day.ghiChu || "",
  })
  const [isLoading, setIsLoading] = useState(false)
  const [openCombobox, setOpenCombobox] = useState(false)
  const { toast } = useToast()
  const router = useRouter()

  // Cập nhật formData khi day thay đổi
  useEffect(() => {
    setFormData({
      ten_diem_den: day.ten_diem_den || day.tieuDe?.replace(/^#\d+: /, "") || "",
      ngay_bat_dau: day.ngay_bat_dau || "",
      ngay_ket_thuc: day.ngay_ket_thuc || "",
      dia_diem_xuat_phat: day.dia_diem_xuat_phat || "",
      ghi_chu: day.ghi_chu || day.ghiChu || "",
    })
  }, [day])

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validation
    if (!formData.ten_diem_den || formData.ten_diem_den.trim() === "") {
      toast({
        title: "Thiếu thông tin",
        description: "Tên điểm đến là bắt buộc",
        variant: "destructive",
      })
      return
    }

    // Kiểm tra ngày bắt đầu <= ngày kết thúc
    if (formData.ngay_bat_dau && formData.ngay_ket_thuc) {
      const ngayBatDau = new Date(formData.ngay_bat_dau)
      const ngayKetThuc = new Date(formData.ngay_ket_thuc)
      if (ngayBatDau > ngayKetThuc) {
        toast({
          title: "Ngày không hợp lệ",
          description: "Ngày bắt đầu phải nhỏ hơn hoặc bằng ngày kết thúc",
          variant: "destructive",
        })
        return
      }
    }

    // Kiểm tra phải có cả hai ngày hoặc không có ngày nào
    if ((formData.ngay_bat_dau && !formData.ngay_ket_thuc) || (!formData.ngay_bat_dau && formData.ngay_ket_thuc)) {
      toast({
        title: "Ngày không hợp lệ",
        description: "Phải cung cấp cả ngày bắt đầu và ngày kết thúc, hoặc không cung cấp cả hai",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)

    try {
      // ✅ Lấy token từ cookie
      const token = Cookies.get("token")
      console.log("🔑 Token từ cookie:", token)
      console.log("🔑 Token type:", typeof token)
      console.log("🔑 Token length:", token?.length)
      console.log("🔑 Token is null?", token === null)
      console.log("🔑 Token is undefined?", token === undefined)
      console.log("🔑 Token is 'null'?", token === "null")
      console.log("🔑 Token is 'undefined'?", token === "undefined")

      // ✅ Kiểm tra token hợp lệ
      if (!token || token === "null" || token === "undefined") {
        console.warn("❌ Không có token hoặc token không hợp lệ → chuyển về /login")
        console.warn("Token value:", token)
        toast({
          title: "Lỗi xác thực",
          description: "Vui lòng đăng nhập để tiếp tục",
          variant: "destructive",
        })
        router.replace("/login")
        setIsLoading(false)
        return
      }

      console.log("✅ Token hợp lệ, tiếp tục gọi API")

      // Chuẩn bị payload
      const payload = {
        ten_diem_den: formData.ten_diem_den.trim(),
        ngay_bat_dau: formData.ngay_bat_dau || null,
        ngay_ket_thuc: formData.ngay_ket_thuc || null,
        dia_diem_xuat_phat: formData.dia_diem_xuat_phat || null,
        ghi_chu: formData.ghi_chu || null,
      }

      console.log("Payload gửi lên API (Edit Diem Den):", payload)
      console.log("Diem Den ID:", actualDiemDenId)

      // Gọi API PUT để cập nhật điểm đến
      const response = await axios.put(
        `https://travel-planner-imdw.onrender.com/api/diem-den/${actualDiemDenId}`,
        payload,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      )

      console.log("✅ API Response (Edit Diem Den):", response.data)

      toast({
        title: "Đã cập nhật",
        description: response.data?.message || "Đã cập nhật điểm đến thành công",
      })

      // Gọi onSubmit với dữ liệu đã cập nhật
      onSubmit({
        ...formData,
        diem_den_id: actualDiemDenId,
      })

      onClose()
    } catch (error: any) {
      console.error("❌ Lỗi khi cập nhật điểm đến:", error)

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
            description: error.response?.data?.message || "Bạn không có quyền cập nhật điểm đến này",
            variant: "destructive",
          })
        } else if (error.response?.status === 404) {
          toast({
            title: "Không tìm thấy điểm đến",
            description: error.response?.data?.message || "Điểm đến này có thể đã bị xóa",
            variant: "destructive",
          })
        } else if (error.response?.status === 400) {
          toast({
            title: "Dữ liệu không hợp lệ",
            description: error.response?.data?.message || "Vui lòng kiểm tra lại thông tin",
            variant: "destructive",
          })
        } else {
          toast({
            title: "Lỗi cập nhật điểm đến",
            description: error.response?.data?.message || "Có lỗi xảy ra khi cập nhật điểm đến",
            variant: "destructive",
          })
        }
      } else {
        toast({
          title: "Lỗi cập nhật điểm đến",
          description: "Có lỗi xảy ra khi cập nhật điểm đến",
          variant: "destructive",
        })
      }
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
        className="bg-card rounded-lg shadow-xl max-w-md w-full"
      >
        <Card className="border-0 shadow-none">
          <CardHeader className="relative">
            <Button variant="ghost" size="icon" className="absolute right-2 top-2" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
            <CardTitle className="text-2xl font-[family-name:var(--font-space-grotesk)]">Chỉnh Sửa Điểm Đến</CardTitle>
            <CardDescription className="font-[family-name:var(--font-dm-sans)]">
              Cập nhật thông tin điểm đến này
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="ten_diem_den">Tên điểm đến <span className="text-red-500">*</span></Label>
                <Popover open={openCombobox} onOpenChange={setOpenCombobox}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={openCombobox}
                      className="w-full justify-between"
                    >
                      {formData.ten_diem_den || "Chọn tỉnh thành..."}
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-full p-0" align="start">
                    <Command>
                      <CommandInput placeholder="Tìm kiếm tỉnh thành..." />
                      <CommandList>
                        <CommandEmpty>Không tìm thấy tỉnh thành.</CommandEmpty>
                        <CommandGroup>
                          {TINH_THANH.map((tinh) => (
                            <CommandItem
                              key={tinh}
                              value={tinh}
                              onSelect={() => {
                                handleChange("ten_diem_den", tinh)
                                setOpenCombobox(false)
                              }}
                            >
                              <Check
                                className={cn(
                                  "mr-2 h-4 w-4",
                                  formData.ten_diem_den === tinh ? "opacity-100" : "opacity-0"
                                )}
                              />
                              {tinh}
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="ngay_bat_dau">Ngày bắt đầu</Label>
                  <div className="relative">
                    <Calendar className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="ngay_bat_dau"
                      type="date"
                      value={formData.ngay_bat_dau}
                      onChange={(e) => handleChange("ngay_bat_dau", e.target.value)}
                      className="pl-8 text-sm"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="ngay_ket_thuc">Ngày kết thúc</Label>
                  <div className="relative">
                    <Calendar className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="ngay_ket_thuc"
                      type="date"
                      value={formData.ngay_ket_thuc}
                      onChange={(e) => handleChange("ngay_ket_thuc", e.target.value)}
                      className="pl-8 text-sm"
                      min={formData.ngay_bat_dau || undefined}
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="dia_diem_xuat_phat">Địa điểm xuất phát (tùy chọn)</Label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="dia_diem_xuat_phat"
                    type="text"
                    placeholder="Ví dụ: Sân bay Nội Bài, Ga Hà Nội..."
                    value={formData.dia_diem_xuat_phat}
                    onChange={(e) => handleChange("dia_diem_xuat_phat", e.target.value)}
                    className="pl-10"
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  Địa điểm xuất phát từ điểm đến này (để trống nếu không cần)
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="ghi_chu">Ghi chú (tùy chọn)</Label>
                <div className="relative">
                  <FileText className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Textarea
                    id="ghi_chu"
                    placeholder="Mô tả về điểm đến này..."
                    value={formData.ghi_chu}
                    onChange={(e) => handleChange("ghi_chu", e.target.value)}
                    className="pl-10 min-h-[80px] resize-none"
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <Button type="button" variant="outline" onClick={onClose} className="flex-1 bg-transparent">
                  Hủy
                </Button>
                <Button type="submit" className="flex-1 bg-primary hover:bg-primary/90" disabled={isLoading}>
                  {isLoading ? "Đang cập nhật..." : "Cập Nhật Điểm Đến"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}
