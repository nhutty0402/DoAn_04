"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { X, AlertTriangle } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { motion } from "framer-motion"

interface DeleteTripModalProps {
  trip: any
  onClose: () => void
  onConfirm: () => void
}

export function DeleteTripModal({ trip, onClose, onConfirm }: DeleteTripModalProps) {
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()

  const handleConfirm = async () => {
    setIsLoading(true)

    try {
      await new Promise((resolve) => setTimeout(resolve, 500)) // Simulate API call
      onConfirm()
      toast({
        title: "Đã xóa chuyến đi",
        description: `Chuyến đi "${trip.tenChuyenDi}" đã được xóa thành công`,
      })
    } catch (error) {
      toast({
        title: "Lỗi xóa chuyến đi",
        description: "Có lỗi xảy ra khi xóa chuyến đi",
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
            <div className="flex items-center gap-3">
              <div className="p-2 bg-destructive/10 rounded-full">
                <AlertTriangle className="h-6 w-6 text-destructive" />
              </div>
              <div>
                <CardTitle className="text-xl font-[family-name:var(--font-space-grotesk)]">Xác Nhận Xóa</CardTitle>
                <CardDescription className="font-[family-name:var(--font-dm-sans)]">
                  Hành động này không thể hoàn tác
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-foreground mb-6 font-[family-name:var(--font-dm-sans)]">
              Bạn có chắc chắn muốn xóa chuyến đi <span className="font-semibold">"{trip.tenChuyenDi}"</span>? Tất cả dữ
              liệu liên quan sẽ bị xóa vĩnh viễn.
            </p>

            <div className="flex gap-3">
              <Button type="button" variant="outline" onClick={onClose} className="flex-1 bg-transparent">
                Hủy
              </Button>
              <Button onClick={handleConfirm} variant="destructive" className="flex-1" disabled={isLoading}>
                {isLoading ? "Đang xóa..." : "Xóa Chuyến Đi"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}
