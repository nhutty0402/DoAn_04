"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { X, MapPin, Clock, FileText } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { motion } from "framer-motion"

interface AddPoiModalProps {
  dayId: string
  onClose: () => void
  onSubmit: (dayId: string, poiData: any) => void
}

export function AddPoiModal({ dayId, onClose, onSubmit }: AddPoiModalProps) {
  const [formData, setFormData] = useState({
    tenDiaDiem: "",
    loaiDiaDiem: "landmark",
    gioBatDau: "",
    gioKetThuc: "",
    ghiChu: "",
  })
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()

  const poiTypes = [
    { value: "landmark", label: "Địa danh" },
    { value: "restaurant", label: "Nhà hàng" },
    { value: "hotel", label: "Khách sạn" },
    { value: "shopping", label: "Mua sắm" },
    { value: "beach", label: "Bãi biển" },
    { value: "historic", label: "Lịch sử" },
  ]

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
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
      await new Promise((resolve) => setTimeout(resolve, 500))
      onSubmit(dayId, {
        ...formData,
        toaDo: { lat: 16.0544 + Math.random() * 0.1, lng: 108.2272 + Math.random() * 0.1 }, // Mock coordinates
      })
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
                <Label htmlFor="tenDiaDiem">Tên địa điểm</Label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="tenDiaDiem"
                    type="text"
                    placeholder="Ví dụ: Cầu Rồng"
                    value={formData.tenDiaDiem}
                    onChange={(e) => handleChange("tenDiaDiem", e.target.value)}
                    className="pl-10"
                    required
                  />
                </div>
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
