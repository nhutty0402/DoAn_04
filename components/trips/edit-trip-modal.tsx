"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { X, MapPin, Calendar, FileText } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { motion } from "framer-motion"

interface EditTripModalProps {
  trip: any
  onClose: () => void
  onSubmit: (tripData: any) => void
}

export function EditTripModal({ trip, onClose, onSubmit }: EditTripModalProps) {
  const [formData, setFormData] = useState({
    tenChuyenDi: trip.tenChuyenDi,
    ngayBatDau: trip.ngayBatDau,
    ngayKetThuc: trip.ngayKetThuc,
    moTa: trip.moTa,
  })
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
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
      await new Promise((resolve) => setTimeout(resolve, 500)) // Simulate API call
      onSubmit(formData)
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
          <CardHeader className="relative">
            <Button variant="ghost" size="icon" className="absolute right-2 top-2" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
            <CardTitle className="text-2xl font-[family-name:var(--font-space-grotesk)]">Chỉnh Sửa Chuyến Đi</CardTitle>
            <CardDescription className="font-[family-name:var(--font-dm-sans)]">
              Cập nhật thông tin chuyến đi của bạn
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
                <Label htmlFor="moTa">Mô tả</Label>
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
                  {isLoading ? "Đang cập nhật..." : "Cập Nhật"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}
