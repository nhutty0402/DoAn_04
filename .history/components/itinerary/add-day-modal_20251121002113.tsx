"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { X, Calendar, FileText } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { motion } from "framer-motion"

interface AddDayModalProps {
  onClose: () => void
  onSubmit: (dayData: any) => Promise<void> | void
}

export function AddDayModal({ onClose, onSubmit }: AddDayModalProps) {
  const [formData, setFormData] = useState({
    ngay: "",
    tieuDe: "",
    ghiChu: "",
  })
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()
  const router = useRouter()

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      await new Promise((resolve) => setTimeout(resolve, 500))
      onSubmit(formData)
    } catch (error) {
      toast({
        title: "Lỗi thêm ngày",
        description: "Có lỗi xảy ra khi thêm ngày mới",
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
        className="bg-card rounded-lg shadow-xl max-w-md w-full"
      >
        <Card className="border-0 shadow-none">
          <CardHeader className="relative">
            <Button variant="ghost" size="icon" className="absolute right-2 top-2" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
            <CardTitle className="text-2xl font-[family-name:var(--font-space-grotesk)]">Thêm Ngày Mới</CardTitle>
            <CardDescription className="font-[family-name:var(--font-dm-sans)]">
              Thêm một ngày mới vào lịch trình của bạn
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="ngay">Ngày</Label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="ngay"
                    type="date"
                    value={formData.ngay}
                    onChange={(e) => handleChange("ngay", e.target.value)}
                    className="pl-10"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="tieuDe">Tiêu đề</Label>
                <Input
                  id="tieuDe"
                  type="text"
                  placeholder="Ví dụ: Ngày 1: Khám phá trung tâm thành phố"
                  value={formData.tieuDe}
                  onChange={(e) => handleChange("tieuDe", e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="ghiChu">Ghi chú (tùy chọn)</Label>
                <div className="relative">
                  <FileText className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Textarea
                    id="ghiChu"
                    placeholder="Mô tả hoạt động chính trong ngày..."
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
                  {isLoading ? "Đang thêm..." : "Thêm Ngày"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}
