"use client"

import type React from "react"

import { useState } from "react"
import axios from "axios"
import Cookies from "js-cookie"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { X, MapPin, Calendar, FileText, Search } from "lucide-react"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { motion } from "framer-motion"

interface EditTripModalProps {
  trip: any
  onClose: () => void
  onSubmit: (tripData: any) => void
}

export function EditTripModal({ trip, onClose, onSubmit }: EditTripModalProps) {
  const [formData, setFormData] = useState({
    ten_chuyen_di: trip?.tenChuyenDi ?? trip?._api?.ten_chuyen_di ?? "",
    ngay_bat_dau: trip?.ngayBatDau ?? trip?._api?.ngay_bat_dau ?? "",
    ngay_ket_thuc: trip?.ngayKetThuc ?? trip?._api?.ngay_ket_thuc ?? "",
    mo_ta: trip?.moTa ?? trip?._api?.mo_ta ?? "",
    dia_diem_xuat_phat: trip?._api?.dia_diem_xuat_phat ?? "",
    tien_te: trip?._api?.tien_te ?? "VND",
    trang_thai: trip?._api?.trang_thai ?? trip?.trangThai ?? "planned",
    cong_khai: typeof trip?.congKhai === 'number' ? String(trip.congKhai) : String(trip?._api?.cong_khai ?? "0"),
    toaDo: trip?.toaDo ?? null as { lat: number; lng: number } | null,
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
      const token = Cookies.get("token")
      if (!token || token === "null" || token === "undefined") {
        throw new Error("Unauthorized")
      }

      const tripId = trip?._api?.chuyen_di_id || trip?.id
      if (!tripId) {
        throw new Error("Không tìm thấy ID chuyến đi")
      }

      const payload = {
        chuyen_di_id: tripId,
        ten_chuyen_di: formData.ten_chuyen_di ?? trip.tenChuyenDi ?? "",
        mo_ta: formData.mo_ta ?? trip.moTa ?? "",
        dia_diem_xuat_phat: formData.dia_diem_xuat_phat ?? trip?._api?.dia_diem_xuat_phat ?? "",
        ngay_bat_dau: formData.ngay_bat_dau ?? trip.ngayBatDau ?? "",
        ngay_ket_thuc: formData.ngay_ket_thuc ?? trip.ngayKetThuc ?? "",
        chu_so_huu_id: trip?._api?.chu_so_huu_id ?? "",
        tien_te: trip?._api?.tien_te ?? "VND",
        trang_thai: trip?._api?.trang_thai ?? trip?.trangThai ?? "planning",
        tao_luc: trip?._api?.tao_luc ?? new Date().toISOString(),
        cong_khai: Number(formData.cong_khai ?? (typeof trip?.congKhai === 'number' ? trip.congKhai : (typeof trip?._api?.cong_khai === 'number' ? trip._api.cong_khai : 0))),
      }

      const res = await axios.put(`https://travel-planner-imdw.onrender.com/api/chuyendi/${tripId}`,
        payload,
        { headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" } }
      )

      const updated = res.data || payload

      onSubmit({
        tenChuyenDi: updated?.ten_chuyen_di ?? payload.ten_chuyen_di,
        ngayBatDau: updated?.ngay_bat_dau ?? payload.ngay_bat_dau,
        ngayKetThuc: updated?.ngay_ket_thuc ?? payload.ngay_ket_thuc,
        moTa: updated?.mo_ta ?? payload.mo_ta,
        trangThai: updated?.trang_thai ?? payload.trang_thai,
        congKhai: typeof updated?.cong_khai === 'number' ? updated.cong_khai : payload.cong_khai,
        _api: {
          ...(trip?._api || {}),
          ...updated,
        },
      })
      toast({
        title: "Cập nhật thành công!",
        description: "Thông tin chuyến đi đã được cập nhật",
      })
    } catch (error) {
      toast({
        title: "Lỗi cập nhật",
        description: "Có lỗi xảy ra khi cập nhật chuyến đi",
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
          <CardHeader className="relative pb-1">
            <Button variant="ghost" size="icon" className="absolute right-2 top-2" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
            <CardTitle className="text-2xl font-[family-name:var(--font-space-grotesk)] text-center block w-full">
              Chỉnh Sửa Chuyến Đi
            </CardTitle>
            {/* <CardDescription className="font-[family-name:var(--font-dm-sans)]">
              Cập nhật thông tin chuyến đi của bạn
            </CardDescription> */}
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
                  {/* Gợi ý địa điểm tạm thời tắt trong modal chỉnh sửa */}
                </div>
                {formData.toaDo && (
                  <p className="text-xs text-muted-foreground">
                    📍 Tọa độ: {formData.toaDo.lat.toFixed(4)}, {formData.toaDo.lng.toFixed(4)}
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
                  {isLoading ? "Đang tạo..." : "Cập nhật chuyến đi"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}
