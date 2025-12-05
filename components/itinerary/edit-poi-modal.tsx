"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Cookies from "js-cookie"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { X, MapPin, Clock, FileText, Globe, Navigation } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { motion } from "framer-motion"
import { MapboxGeocodingAutocomplete } from "@/components/ui/mapbox-geocoding-autocomplete"

interface EditPoiModalProps {
  poi: any
  dayId: string
  tripId: string
  onClose: () => void
  onSubmit: (poiId: string, poiData: any) => void
}

export function EditPoiModal({ poi, dayId, tripId, onClose, onSubmit }: EditPoiModalProps) {
  // Helper để lấy giá trị từ POI (hỗ trợ cả camelCase và snake_case)
  const getPoiValue = (camelKey: string, snakeKey: string, defaultValue: any = "") => {
    return poi?.[camelKey] || poi?.[snakeKey] || defaultValue
  }

  const [formData, setFormData] = useState({
    tenDiaDiem: getPoiValue("tenDiaDiem", "ten_dia_diem"),
    loaiDiaDiem: getPoiValue("loaiDiaDiem", "loai_dia_diem", "POI"),
    gioBatDau: getPoiValue("gioBatDau", "thoi_gian_bat_dau"),
    gioKetThuc: getPoiValue("gioKetThuc", "thoi_gian_ket_thuc"),
    ghiChu: getPoiValue("ghiChu", "ghi_chu"),
    googlePlaceId: getPoiValue("googlePlaceId", "google_place_id"),
    viDo: (poi?.toaDo?.lat?.toString() || poi?.vi_do?.toString() || ""),
    kinhDo: (poi?.toaDo?.lng?.toString() || poi?.kinh_do?.toString() || ""),
  })
  const [mapboxSearch, setMapboxSearch] = useState(getPoiValue("tenDiaDiem", "ten_dia_diem"))
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()
  const router = useRouter()

  // Kiểm tra token khi component mount
  useEffect(() => {
    const token = Cookies.get("token") // ✅ lấy từ cookie
    console.log("Token từ cookie:", token)

    if (!token || token === "null" || token === "undefined") {
      console.warn("Không có token → chuyển về /login")
      toast({
        title: "Lỗi xác thực",
        description: "Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.",
        variant: "destructive",
      })
      router.replace("/login")
    }
  }, [router, toast])

  useEffect(() => {
    // Cập nhật formData khi poi thay đổi
    console.log("EditPoiModal useEffect - POI nhận được:", poi)
    
    // Helper để lấy giá trị từ POI (hỗ trợ cả camelCase và snake_case)
    const getPoiValue = (camelKey: string, snakeKey: string, defaultValue: any = "") => {
      return poi?.[camelKey] || poi?.[snakeKey] || defaultValue
    }
    
    // Đảm bảo format giờ đúng (HH:mm) cho input type="time"
    const formatTimeForInput = (timeValue: string | undefined | null): string => {
      if (!timeValue) return ""
      // Nếu là "HH:mm:ss", chỉ lấy "HH:mm"
      if (timeValue.length === 8 && timeValue.match(/^\d{2}:\d{2}:\d{2}$/)) {
        return timeValue.substring(0, 5)
      }
      // Nếu là "HH:mm", trả về trực tiếp
      if (timeValue.length === 5 && timeValue.match(/^\d{2}:\d{2}$/)) {
        return timeValue
      }
      // Nếu có format khác, thử parse
      if (timeValue.includes(' ')) {
        const timePart = timeValue.split(' ')[1]
        if (timePart && timePart.length >= 5) {
          return timePart.substring(0, 5)
        }
      }
      return timeValue
    }

    // Lấy giá trị từ POI (hỗ trợ cả camelCase và snake_case từ backend)
    const tenDiaDiem = getPoiValue("tenDiaDiem", "ten_dia_diem")
    const loaiDiaDiem = getPoiValue("loaiDiaDiem", "loai_dia_diem", "POI")
    const gioBatDau = formatTimeForInput(getPoiValue("gioBatDau", "thoi_gian_bat_dau"))
    const gioKetThuc = formatTimeForInput(getPoiValue("gioKetThuc", "thoi_gian_ket_thuc"))
    const ghiChu = getPoiValue("ghiChu", "ghi_chu")
    const googlePlaceId = getPoiValue("googlePlaceId", "google_place_id")
    const viDo = (poi?.toaDo?.lat?.toString() || poi?.vi_do?.toString() || "")
    const kinhDo = (poi?.toaDo?.lng?.toString() || poi?.kinh_do?.toString() || "")

    setFormData({
      tenDiaDiem,
      loaiDiaDiem,
      gioBatDau,
      gioKetThuc,
      ghiChu,
      googlePlaceId,
      viDo,
      kinhDo,
    })
    setMapboxSearch(tenDiaDiem)
  }, [poi])

  const poiTypes = [
    { value: "POI", label: "Điểm tham quan" },
    { value: "hotel", label: "Khách sạn" },
    { value: "transport", label: "Phương tiện" },
    { value: "activity", label: "Hoạt động" },
    { value: "other", label: "Khác" },
  ]

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleMapboxPlaceSelect = (place: any) => {
    console.log("Selected Mapbox Place:", place)
    
    // Mapbox trả về center là [lng, lat]
    const [lng, lat] = place.center || []
    
    // Cập nhật tên địa điểm
    const placeName = place.text || place.place_name.split(',')[0]
    setFormData((prev) => ({
      ...prev,
      tenDiaDiem: placeName,
      googlePlaceId: place.id || "",
      viDo: lat ? lat.toString() : "",
      kinhDo: lng ? lng.toString() : "",
    }))
    
    // Cập nhật search value
    setMapboxSearch(place.place_name)
    
    toast({
      title: "Đã chọn địa điểm",
      description: `Đã chọn: ${placeName}`,
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Kiểm tra token trước khi submit
    const token = Cookies.get("token") // ✅ lấy từ cookie
    console.log("Token từ cookie:", token)

    if (!token || token === "null" || token === "undefined") {
      console.warn("Không có token → chuyển về /login")
      toast({
        title: "Lỗi xác thực",
        description: "Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.",
        variant: "destructive",
      })
      router.replace("/login")
      return
    }

    if (formData.gioKetThuc <= formData.gioBatDau) {
      toast({
        title: "Lỗi thời gian",
        description: "Giờ kết thúc phải sau giờ bắt đầu",
        variant: "destructive",
      })
      return
    }

    // Validation: Kiểm tra giờ bắt đầu và kết thúc có được nhập
    if (!formData.gioBatDau || formData.gioBatDau.trim() === "") {
      toast({
        title: "Lỗi thời gian",
        description: "Vui lòng nhập giờ bắt đầu",
        variant: "destructive",
      })
      return
    }

    if (!formData.gioKetThuc || formData.gioKetThuc.trim() === "") {
      toast({
        title: "Lỗi thời gian",
        description: "Vui lòng nhập giờ kết thúc",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)

    try {
      // Chuẩn bị dữ liệu theo format API
      const poiData = {
        tenDiaDiem: formData.tenDiaDiem,
        loaiDiaDiem: formData.loaiDiaDiem,
        gioBatDau: formData.gioBatDau.trim(), // Đảm bảo loại bỏ khoảng trắng
        gioKetThuc: formData.gioKetThuc.trim(), // Đảm bảo loại bỏ khoảng trắng
        ghiChu: formData.ghiChu,
        googlePlaceId: formData.googlePlaceId || "",
        viDo: formData.viDo || "",
        kinhDo: formData.kinhDo || "",
        toaDo: formData.viDo && formData.kinhDo 
          ? { lat: parseFloat(formData.viDo), lng: parseFloat(formData.kinhDo) }
          : null,
      }

      console.log("EditPoiModal - FormData trước khi submit:", formData)
      console.log("EditPoiModal - POI Data gửi đi:", poiData)
      
      onSubmit(poi.id, poiData)
    } catch (error) {
      toast({
        title: "Lỗi cập nhật điểm đến",
        description: "Có lỗi xảy ra khi cập nhật điểm đến",
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
            <CardTitle className="text-2xl font-[family-name:var(--font-space-grotesk)]">Chỉnh Sửa Điểm Đến</CardTitle>
            <CardDescription className="font-[family-name:var(--font-dm-sans)]">
              Cập nhật thông tin điểm đến này
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <MapboxGeocodingAutocomplete
                  label="Tìm kiếm địa điểm"
                  value={mapboxSearch}
                  onChange={setMapboxSearch}
                  onPlaceSelect={handleMapboxPlaceSelect}
                  placeholder="Tìm kiếm địa điểm từ Mapbox..."
                  className="w-full"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="tenDiaDiem">Tên địa điểm</Label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="tenDiaDiem"
                    type="text"
                    placeholder="Tên địa điểm"
                    value={formData.tenDiaDiem}
                    onChange={(e) => handleChange("tenDiaDiem", e.target.value)}
                    className="pl-10"
                    required
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  💡 Sử dụng tìm kiếm Mapbox ở trên để tự động điền thông tin, hoặc chỉnh sửa thủ công
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="loaiDiaDiem">Loại địa điểm</Label>
                <select
                  id="loaiDiaDiem"
                  value={formData.loaiDiaDiem}
                  onChange={(e) => handleChange("loaiDiaDiem", e.target.value)}
                  className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground"
                  required
                >
                  {poiTypes.map((type) => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="googlePlaceId">Place ID (Mapbox)</Label>
                <div className="relative">
                  <Globe className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="googlePlaceId"
                    type="text"
                    placeholder="Mapbox Place ID"
                    value={formData.googlePlaceId}
                    onChange={(e) => handleChange("googlePlaceId", e.target.value)}
                    className="pl-10"
                    readOnly
                  />
                </div>
                {formData.googlePlaceId ? (
                  <p className="text-xs text-green-600">
                    ✅ Place ID từ Mapbox: {formData.googlePlaceId.substring(0, 30)}...
                  </p>
                ) : (
                  <p className="text-xs text-muted-foreground">
                    Place ID sẽ được điền tự động khi chọn từ Mapbox
                  </p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="viDo">Vĩ độ</Label>
                  <div className="relative">
                    <Navigation className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="viDo"
                      type="number"
                      step="any"
                      placeholder="16.0544"
                      value={formData.viDo}
                      onChange={(e) => handleChange("viDo", e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  {formData.viDo && (
                    <p className="text-xs text-green-600">
                      ✅ Tọa độ từ Mapbox
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="kinhDo">Kinh độ</Label>
                  <div className="relative">
                    <Navigation className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="kinhDo"
                      type="number"
                      step="any"
                      placeholder="108.2272"
                      value={formData.kinhDo}
                      onChange={(e) => handleChange("kinhDo", e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  {formData.kinhDo && (
                    <p className="text-xs text-green-600">
                      ✅ Tọa độ từ Mapbox
                    </p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="gioBatDau">Giờ bắt đầu</Label>
                  <div className="relative">
                    <Clock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="gioBatDau"
                      type="time"
                      value={formData.gioBatDau}
                      onChange={(e) => handleChange("gioBatDau", e.target.value)}
                      className="pl-10"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="gioKetThuc">Giờ kết thúc</Label>
                  <div className="relative">
                    <Clock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="gioKetThuc"
                      type="time"
                      value={formData.gioKetThuc}
                      onChange={(e) => handleChange("gioKetThuc", e.target.value)}
                      className="pl-10"
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="ghiChu">Ghi chú (tùy chọn)</Label>
                <div className="relative">
                  <FileText className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Textarea
                    id="ghiChu"
                    placeholder="Ghi chú về địa điểm này..."
                    value={formData.ghiChu}
                    onChange={(e) => handleChange("ghiChu", e.target.value)}
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

