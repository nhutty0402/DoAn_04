"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { X, MapPin, Calendar, FileText, Map, Search } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { motion } from "framer-motion"

interface CreateTripModalProps {
  onClose: () => void
  onSubmit: (tripData: any) => void
}

export function CreateTripModal({ onClose, onSubmit }: CreateTripModalProps) {
  const [formData, setFormData] = useState({
    tenChuyenDi: "",
    ngayBatDau: "",
    ngayKetThuc: "",
    moTa: "",
    diaDiem: "",
    toaDo: null as { lat: number; lng: number } | null,
  })
  const [isLoading, setIsLoading] = useState(false)
  const [locationSuggestions, setLocationSuggestions] = useState<any[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const { toast } = useToast()

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))

    if (field === "diaDiem" && value.length > 2) {
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
    } else if (field === "diaDiem" && value.length <= 2) {
      setShowSuggestions(false)
    }
  }

  const handleLocationSelect = (location: any) => {
    setFormData((prev) => ({
      ...prev,
      diaDiem: location.name,
      toaDo: { lat: location.lat, lng: location.lng },
    }))
    setShowSuggestions(false)
    setLocationSuggestions([])
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (new Date(formData.ngayKetThuc) <= new Date(formData.ngayBatDau)) {
      toast({
        title: "Lỗi ngày tháng",
        description: "Ngày kết thúc phải sau ngày bắt đầu",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)

    try {
      await new Promise((resolve) => setTimeout(resolve, 500))
      onSubmit(formData)
      toast({
        title: "Tạo chuyến đi thành công!",
        description: "Chuyến đi mới đã được tạo và sẵn sàng để lập kế hoạch",
      })
    } catch (error) {
      toast({
        title: "Lỗi tạo chuyến đi",
        description: "Có lỗi xảy ra khi tạo chuyến đi",
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
                <Label htmlFor="tenChuyenDi">Tên chuyến đi</Label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="tenChuyenDi"
                    type="text"
                    placeholder="Ví dụ: Du lịch Đà Nẵng"
                    value={formData.tenChuyenDi}
                    onChange={(e) => handleChange("tenChuyenDi", e.target.value)}
                    className="pl-10"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="diaDiem">Địa điểm</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="diaDiem"
                    type="text"
                    placeholder="Tìm kiếm địa điểm..."
                    value={formData.diaDiem}
                    onChange={(e) => handleChange("diaDiem", e.target.value)}
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

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="ngayBatDau">Ngày bắt đầu</Label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="ngayBatDau"
                      type="date"
                      value={formData.ngayBatDau}
                      onChange={(e) => handleChange("ngayBatDau", e.target.value)}
                      className="pl-10"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="ngayKetThuc">Ngày kết thúc</Label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="ngayKetThuc"
                      type="date"
                      value={formData.ngayKetThuc}
                      onChange={(e) => handleChange("ngayKetThuc", e.target.value)}
                      className="pl-10"
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="moTa">Mô tả (tùy chọn)</Label>
                <div className="relative">
                  <FileText className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Textarea
                    id="moTa"
                    placeholder="Mô tả ngắn về chuyến đi..."
                    value={formData.moTa}
                    onChange={(e) => handleChange("moTa", e.target.value)}
                    className="pl-10 min-h-[80px] resize-none"
                  />
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
