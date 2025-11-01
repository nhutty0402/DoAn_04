"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { X, MapPin, Clock, FileText, Globe, Navigation } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { motion } from "framer-motion"
import { GooglePlacesAutocomplete } from "@/components/ui/google-places-autocomplete"

interface AddPoiModalProps {
  dayId: string
  tripId: string
  onClose: () => void
  onSubmit: (dayId: string, poiData: any) => void
}

export function AddPoiModal({ dayId, tripId, onClose, onSubmit }: AddPoiModalProps) {
  const [formData, setFormData] = useState({
    tenDiaDiem: "",
    loaiDiaDiem: "POI",
    gioBatDau: "",
    gioKetThuc: "",
    ghiChu: "",
    googlePlaceId: "",
    viDo: "",
    kinhDo: "",
  })
  const [googlePlaceSearch, setGooglePlaceSearch] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()

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

  const handleGooglePlaceSelect = (place: any) => {
    console.log("Selected Google Place:", place)
    
    // Cập nhật tên địa điểm
    setFormData((prev) => ({
      ...prev,
      tenDiaDiem: place.structured_formatting.main_text,
      googlePlaceId: place.place_id,
    }))
    
    // Cập nhật tọa độ nếu có
    if (place.geometry?.location) {
      setFormData((prev) => ({
        ...prev,
        viDo: place.geometry.location.lat.toString(),
        kinhDo: place.geometry.location.lng.toString(),
      }))
    }
    
    // Cập nhật search value
    setGooglePlaceSearch(place.description)
    
    toast({
      title: "Đã chọn địa điểm",
      description: `Đã chọn: ${place.structured_formatting.main_text}`,
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (formData.gioKetThuc <= formData.gioBatDau) {
      toast({
        title: "Lỗi thời gian",
        description: "Giờ kết thúc phải sau giờ bắt đầu",
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
        gioBatDau: formData.gioBatDau,
        gioKetThuc: formData.gioKetThuc,
        ghiChu: formData.ghiChu,
        googlePlaceId: formData.googlePlaceId || "",
        viDo: formData.viDo || "",
        kinhDo: formData.kinhDo || "",
        toaDo: formData.viDo && formData.kinhDo 
          ? { lat: parseFloat(formData.viDo), lng: parseFloat(formData.kinhDo) }
          : { lat: 16.0544 + Math.random() * 0.1, lng: 108.2272 + Math.random() * 0.1 }, // Mock coordinates nếu không có
      }
      
      onSubmit(dayId, poiData)
    } catch (error) {
      toast({
        title: "Lỗi thêm điểm đến",
        description: "Có lỗi xảy ra khi thêm điểm đến",
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
            <CardTitle className="text-2xl font-[family-name:var(--font-space-grotesk)]">Thêm Điểm Đến</CardTitle>
            <CardDescription className="font-[family-name:var(--font-dm-sans)]">
              Thêm một điểm đến mới vào ngày này
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <GooglePlacesAutocomplete
                  label="Tìm kiếm địa điểm"
                  value={googlePlaceSearch}
                  onChange={setGooglePlaceSearch}
                  onPlaceSelect={handleGooglePlaceSelect}
                  placeholder="Tìm kiếm địa điểm từ Google..."
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
                    placeholder="Tên địa điểm sẽ được điền tự động khi chọn từ Google"
                    value={formData.tenDiaDiem}
                    onChange={(e) => handleChange("tenDiaDiem", e.target.value)}
                    className="pl-10"
                    required
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  💡 Sử dụng tìm kiếm Google ở trên để tự động điền thông tin, hoặc nhập thủ công
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
                <Label htmlFor="googlePlaceId">Google Place ID</Label>
                <div className="relative">
                  <Globe className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="googlePlaceId"
                    type="text"
                    placeholder="ChIJ... (Google Place ID)"
                    value={formData.googlePlaceId}
                    onChange={(e) => handleChange("googlePlaceId", e.target.value)}
                    className="pl-10"
                    readOnly
                  />
                </div>
                {formData.googlePlaceId ? (
                  <p className="text-xs text-green-600">
                    ✅ Place ID từ Google Places: {formData.googlePlaceId}
                  </p>
                ) : (
                  <p className="text-xs text-muted-foreground">
                    Place ID sẽ được điền tự động khi chọn từ Google
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
                      ✅ Tọa độ từ Google Places
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
                      ✅ Tọa độ từ Google Places
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
                  {isLoading ? "Đang thêm..." : "Thêm Điểm Đến"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}
