"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Checkbox } from "@/components/ui/checkbox"
import { X, DollarSign, Receipt, Percent } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { motion } from "framer-motion"

interface AddExpenseModalProps {
  onClose: () => void
  onSubmit: (expenseData: any) => void
  members: any[]
}

export function AddExpenseModal({ onClose, onSubmit, members }: AddExpenseModalProps) {
  const [formData, setFormData] = useState({
    tenChiPhi: "",
    soTien: "",
    loaiChiPhi: "food",
    nguoiTraId: members[0]?.id || "",
    ghiChu: "",
    hinhThucChia: "equal",
    thanhVienThamGia: members.map((m) => m.id),
  })
  const [customShares, setCustomShares] = useState<Record<string, number>>({})
  const [customPercents, setCustomPercents] = useState<Record<string, number>>({})
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()

  const expenseTypes = [
    { value: "food", label: "Ăn uống" },
    { value: "accommodation", label: "Lưu trú" },
    { value: "transport", label: "Di chuyển" },
    { value: "activity", label: "Hoạt động" },
    { value: "shopping", label: "Mua sắm" },
    { value: "other", label: "Khác" },
  ]

  const handleChange = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleMemberToggle = (memberId: string, checked: boolean) => {
    if (checked) {
      setFormData((prev) => ({
        ...prev,
        thanhVienThamGia: [...prev.thanhVienThamGia, memberId],
      }))
    } else {
      setFormData((prev) => ({
        ...prev,
        thanhVienThamGia: prev.thanhVienThamGia.filter((id) => id !== memberId),
      }))
    }
  }

  const calculateSplit = () => {
    const amount = Number.parseFloat(formData.soTien)
    const participatingMembers = formData.thanhVienThamGia
    const chiTietChia: Record<string, { soTien: number; daTra: boolean }> = {}

    participatingMembers.forEach((memberId) => {
      let memberAmount = 0

      switch (formData.hinhThucChia) {
        case "equal":
          memberAmount = amount / participatingMembers.length
          break
        case "shares":
          const totalShares = participatingMembers.reduce((sum, id) => sum + (customShares[id] || 1), 0)
          memberAmount = (amount * (customShares[memberId] || 1)) / totalShares
          break
        case "percent":
          memberAmount = (amount * (customPercents[memberId] || 0)) / 100
          break
      }

      chiTietChia[memberId] = {
        soTien: Math.round(memberAmount),
        daTra: memberId === formData.nguoiTraId,
      }
    })

    return chiTietChia
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (formData.thanhVienThamGia.length === 0) {
      toast({
        title: "Lỗi",
        description: "Phải chọn ít nhất một thành viên tham gia",
        variant: "destructive",
      })
      return
    }

    if (formData.hinhThucChia === "percent") {
      const totalPercent = formData.thanhVienThamGia.reduce((sum, id) => sum + (customPercents[id] || 0), 0)
      if (Math.abs(totalPercent - 100) > 0.01) {
        toast({
          title: "Lỗi phần trăm",
          description: "Tổng phần trăm phải bằng 100%",
          variant: "destructive",
        })
        return
      }
    }

    setIsLoading(true)

    try {
      const chiTietChia = calculateSplit()
      const nguoiTra = members.find((m) => m.id === formData.nguoiTraId)

      await new Promise((resolve) => setTimeout(resolve, 500))
      onSubmit({
        ...formData,
        soTien: Number.parseFloat(formData.soTien),
        nguoiTra: nguoiTra?.name || "",
        chiTietChia,
      })
      toast({
        title: "Đã thêm chi phí",
        description: "Chi phí mới đã được thêm và chia sẻ",
      })
    } catch (error) {
      toast({
        title: "Lỗi thêm chi phí",
        description: "Có lỗi xảy ra khi thêm chi phí",
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
        className="bg-card rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
      >
        <Card className="border-0 shadow-none">
          <CardHeader className="relative">
            <Button variant="ghost" size="icon" className="absolute right-2 top-2" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
            <CardTitle className="text-2xl font-[family-name:var(--font-space-grotesk)]">Thêm Chi Phí</CardTitle>
            <CardDescription className="font-[family-name:var(--font-dm-sans)]">
              Thêm chi phí mới và chia sẻ với thành viên
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Basic Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="tenChiPhi">Tên chi phí</Label>
                  <div className="relative">
                    <Receipt className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="tenChiPhi"
                      type="text"
                      placeholder="Ví dụ: Ăn trưa tại nhà hàng"
                      value={formData.tenChiPhi}
                      onChange={(e) => handleChange("tenChiPhi", e.target.value)}
                      className="pl-10"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="soTien">Số tiền (VNĐ)</Label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="soTien"
                      type="number"
                      placeholder="500000"
                      value={formData.soTien}
                      onChange={(e) => handleChange("soTien", e.target.value)}
                      className="pl-10"
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="loaiChiPhi">Loại chi phí</Label>
                  <select
                    id="loaiChiPhi"
                    value={formData.loaiChiPhi}
                    onChange={(e) => handleChange("loaiChiPhi", e.target.value)}
                    className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground"
                  >
                    {expenseTypes.map((type) => (
                      <option key={type.value} value={type.value}>
                        {type.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="nguoiTra">Người trả</Label>
                  <select
                    id="nguoiTra"
                    value={formData.nguoiTraId}
                    onChange={(e) => handleChange("nguoiTraId", e.target.value)}
                    className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground"
                  >
                    {members.map((member) => (
                      <option key={member.id} value={member.id}>
                        {member.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="ghiChu">Ghi chú (tùy chọn)</Label>
                <Textarea
                  id="ghiChu"
                  placeholder="Mô tả chi tiết về chi phí..."
                  value={formData.ghiChu}
                  onChange={(e) => handleChange("ghiChu", e.target.value)}
                  className="min-h-[80px] resize-none"
                />
              </div>

              {/* Split Configuration */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Cách chia chi phí</h3>

                <Tabs value={formData.hinhThucChia} onValueChange={(value) => handleChange("hinhThucChia", value)}>
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="equal">Chia đều</TabsTrigger>
                    <TabsTrigger value="shares">Theo phần</TabsTrigger>
                    <TabsTrigger value="percent">Theo %</TabsTrigger>
                  </TabsList>

                  <TabsContent value="equal" className="space-y-4">
                    <p className="text-sm text-muted-foreground">Chia đều cho tất cả thành viên được chọn</p>
                  </TabsContent>

                  <TabsContent value="shares" className="space-y-4">
                    <p className="text-sm text-muted-foreground">Chia theo số phần (ví dụ: A=2 phần, B=1 phần)</p>
                    <div className="grid grid-cols-2 gap-4">
                      {formData.thanhVienThamGia.map((memberId) => {
                        const member = members.find((m) => m.id === memberId)
                        return (
                          <div key={memberId} className="flex items-center gap-2">
                            <Label className="flex-1">{member?.name}</Label>
                            <Input
                              type="number"
                              min="1"
                              value={customShares[memberId] || 1}
                              onChange={(e) =>
                                setCustomShares((prev) => ({
                                  ...prev,
                                  [memberId]: Number.parseInt(e.target.value) || 1,
                                }))
                              }
                              className="w-20"
                            />
                          </div>
                        )
                      })}
                    </div>
                  </TabsContent>

                  <TabsContent value="percent" className="space-y-4">
                    <p className="text-sm text-muted-foreground">Chia theo phần trăm (tổng phải bằng 100%)</p>
                    <div className="grid grid-cols-2 gap-4">
                      {formData.thanhVienThamGia.map((memberId) => {
                        const member = members.find((m) => m.id === memberId)
                        return (
                          <div key={memberId} className="flex items-center gap-2">
                            <Label className="flex-1">{member?.name}</Label>
                            <div className="relative">
                              <Input
                                type="number"
                                min="0"
                                max="100"
                                value={customPercents[memberId] || 0}
                                onChange={(e) =>
                                  setCustomPercents((prev) => ({
                                    ...prev,
                                    [memberId]: Number.parseFloat(e.target.value) || 0,
                                  }))
                                }
                                className="w-20 pr-8"
                              />
                              <Percent className="absolute right-2 top-3 h-4 w-4 text-muted-foreground" />
                            </div>
                          </div>
                        )
                      })}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Tổng:{" "}
                      {formData.thanhVienThamGia.reduce((sum, id) => sum + (customPercents[id] || 0), 0).toFixed(1)}%
                    </p>
                  </TabsContent>
                </Tabs>

                {/* Member Selection */}
                <div className="space-y-3">
                  <Label>Thành viên tham gia</Label>
                  <div className="grid grid-cols-2 gap-3">
                    {members.map((member) => (
                      <div key={member.id} className="flex items-center space-x-2">
                        <Checkbox
                          id={member.id}
                          checked={formData.thanhVienThamGia.includes(member.id)}
                          onCheckedChange={(checked) => handleMemberToggle(member.id, checked as boolean)}
                        />
                        <Label htmlFor={member.id} className="text-sm font-normal">
                          {member.name}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <Button type="button" variant="outline" onClick={onClose} className="flex-1 bg-transparent">
                  Hủy
                </Button>
                <Button type="submit" className="flex-1 bg-primary hover:bg-primary/90" disabled={isLoading}>
                  {isLoading ? "Đang thêm..." : "Thêm Chi Phí"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}
