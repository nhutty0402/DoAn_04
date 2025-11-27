"use client"

import type React from "react"

import { useState, useEffect } from "react"
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
import axios from "axios"
import Cookies from "js-cookie"
import { useRouter } from "next/navigation"

interface AddExpenseModalProps {
  onClose: () => void
  onSubmit: (expenseData: any) => void
  members: any[]
  tripId: string
}

export function AddExpenseModal({ onClose, onSubmit, members, tripId }: AddExpenseModalProps) {
  // ✅ Lấy hình thức chia đã lưu từ localStorage (nếu có)
  const getSavedSplitType = (): "equal" | "shares" | "percent" => {
    if (typeof window === "undefined") return "equal"
    const saved = localStorage.getItem(`expense_split_preference_${tripId}`)
    if (saved && ["equal", "shares", "percent"].includes(saved)) {
      return saved as "equal" | "shares" | "percent"
    }
    return "equal"
  }

  // Tìm chủ chuyến đi (owner) hoặc lấy member đầu tiên
  const tripOwner = members.find((m) => m.role === "owner" || m.vai_tro === "owner") || members[0]

  const [formData, setFormData] = useState({
    tenChiPhi: "",
    soTien: "",
    loaiChiPhi: "ăn uống",
    nguoiTraId: tripOwner?.id || "",
    ghiChu: "",
    hinhThucChia: getSavedSplitType(), // ✅ Sử dụng hình thức đã lưu
    thanhVienThamGia: members.map((m) => m.id),
  })
  const [customShares, setCustomShares] = useState<Record<string, number>>({})
  const [customPercents, setCustomPercents] = useState<Record<string, number>>({})
  const [isLoading, setIsLoading] = useState(false)
  const [isFirstTime, setIsFirstTime] = useState(() => {
    if (typeof window === "undefined") return true
    return !localStorage.getItem(`expense_split_preference_${tripId}`)
  })
  const { toast } = useToast()
  const router = useRouter()

  // ✅ Kiểm tra xem đây có phải lần đầu tiên thêm chi phí không
  useEffect(() => {
    if (typeof window === "undefined") return
    const saved = localStorage.getItem(`expense_split_preference_${tripId}`)
    setIsFirstTime(!saved)
  }, [tripId])

  // ✅ Cập nhật nguoiTraId khi members thay đổi (chỉ set nếu chưa có)
  useEffect(() => {
    if (members.length > 0 && !formData.nguoiTraId) {
      // Tìm chủ chuyến đi (owner) hoặc lấy member đầu tiên
      const owner = members.find((m) => m.role === "owner" || m.vai_tro === "owner") || members[0]
      if (owner?.id) {
        setFormData((prev) => ({ ...prev, nguoiTraId: owner.id }))
      }
    }
  }, [members, formData.nguoiTraId])

  const expenseTypes = [
    { value: "ăn uống", label: "Ăn uống" },
    { value: "lưu trú", label: "Lưu trú" },
    { value: "di chuyển", label: "Di chuyển" },
    { value: "giải trí", label: "Giải trí" },
    { value: "mua sắm", label: "Mua sắm" },
    { value: "vé tham quan", label: "Vé tham quan" },
    { value: "dịch vụ", label: "Dịch vụ" },
    { value: "khác", label: "Khác" },
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
      const token = Cookies.get("token")
      if (!token || token === "null" || token === "undefined") {
        toast({
          title: "Lỗi xác thực",
          description: "Vui lòng đăng nhập lại",
          variant: "destructive",
        })
        router.replace("/login")
        return
      }

      // Map hinh_thuc_chia: equal -> "equal", shares -> "custom", percent -> "percent"
      // Lưu ý: formData.hinhThucChia có thể là "equal" | "shares" | "percent"
      // Nhưng API cần "equal" | "custom" | "percent"
      let hinhThucChia: "equal" | "custom" | "percent" = formData.hinhThucChia === "shares" ? "custom" : formData.hinhThucChia

      // ✅ Prepare thanh_vien array based on split type
      // Backend yêu cầu tất cả trường hợp đều phải là array các object có nguoi_dung_id
      let thanhVien: any[] = []
      
      if (formData.hinhThucChia === "equal") {
        // ✅ For equal split, vẫn phải gửi object với nguoi_dung_id
        thanhVien = formData.thanhVienThamGia.map((memberId) => {
          const member = members.find((m) => m.id === memberId || String(m.id) === String(memberId))
          
          if (!member) {
            console.error(`❌ Không tìm thấy member với id: ${memberId}`, { members, memberId })
            throw new Error(`Không tìm thấy thông tin thành viên với ID: ${memberId}`)
          }
          
          // ✅ Ưu tiên lấy nguoi_dung_id từ member, nếu không có thì parse từ id
          let nguoiDungId = member.nguoi_dung_id
          if (!nguoiDungId && member.id) {
            nguoiDungId = Number.parseInt(String(member.id))
          }
          if (!nguoiDungId) {
            nguoiDungId = Number.parseInt(String(memberId))
          }
          
          // ✅ Validate nguoi_dung_id không được null/undefined/NaN
          if (!nguoiDungId || isNaN(nguoiDungId) || nguoiDungId <= 0) {
            console.error(`❌ Invalid nguoi_dung_id:`, { member, memberId, nguoiDungId })
            throw new Error(`Không tìm thấy nguoi_dung_id hợp lệ cho thành viên: ${member.name || memberId}`)
          }
          
          return {
            nguoi_dung_id: nguoiDungId,
          }
        })
      } else if (formData.hinhThucChia === "shares") {
        // ✅ For shares/custom split, send objects with nguoi_dung_id and ti_le
        thanhVien = formData.thanhVienThamGia.map((memberId) => {
          const member = members.find((m) => m.id === memberId || String(m.id) === String(memberId))
          
          if (!member) {
            console.error(`❌ Không tìm thấy member với id: ${memberId}`, { members, memberId })
            throw new Error(`Không tìm thấy thông tin thành viên với ID: ${memberId}`)
          }
          
          // ✅ Ưu tiên lấy nguoi_dung_id từ member, nếu không có thì parse từ id
          let nguoiDungId = member.nguoi_dung_id
          if (!nguoiDungId && member.id) {
            nguoiDungId = Number.parseInt(String(member.id))
          }
          if (!nguoiDungId) {
            nguoiDungId = Number.parseInt(String(memberId))
          }
          
          // ✅ Validate nguoi_dung_id không được null/undefined/NaN
          if (!nguoiDungId || isNaN(nguoiDungId) || nguoiDungId <= 0) {
            console.error(`❌ Invalid nguoi_dung_id:`, { member, memberId, nguoiDungId })
            throw new Error(`Không tìm thấy nguoi_dung_id hợp lệ cho thành viên: ${member.name || memberId}`)
          }
          
          return {
            nguoi_dung_id: nguoiDungId,
            ti_le: customShares[memberId] || 1,
          }
        })
      } else if (formData.hinhThucChia === "percent") {
        // ✅ For percent split, send objects with nguoi_dung_id and phan_tram
        thanhVien = formData.thanhVienThamGia.map((memberId) => {
          const member = members.find((m) => m.id === memberId || String(m.id) === String(memberId))
          
          if (!member) {
            console.error(`❌ Không tìm thấy member với id: ${memberId}`, { members, memberId })
            throw new Error(`Không tìm thấy thông tin thành viên với ID: ${memberId}`)
          }
          
          // ✅ Ưu tiên lấy nguoi_dung_id từ member, nếu không có thì parse từ id
          let nguoiDungId = member.nguoi_dung_id
          if (!nguoiDungId && member.id) {
            nguoiDungId = Number.parseInt(String(member.id))
          }
          if (!nguoiDungId) {
            nguoiDungId = Number.parseInt(String(memberId))
          }
          
          // ✅ Validate nguoi_dung_id không được null/undefined/NaN
          if (!nguoiDungId || isNaN(nguoiDungId) || nguoiDungId <= 0) {
            console.error(`❌ Invalid nguoi_dung_id:`, { member, memberId, nguoiDungId })
            throw new Error(`Không tìm thấy nguoi_dung_id hợp lệ cho thành viên: ${member.name || memberId}`)
          }
          
          return {
            nguoi_dung_id: nguoiDungId,
            phan_tram: customPercents[memberId] || 0,
          }
        })
      }
      
      // ✅ Validate thanh_vien không được rỗng và tất cả đều có nguoi_dung_id hợp lệ
      if (thanhVien.length === 0) {
        throw new Error("Phải chọn ít nhất một thành viên tham gia")
      }
      
      const invalidMembers = thanhVien.filter(v => !v.nguoi_dung_id || isNaN(v.nguoi_dung_id))
      if (invalidMembers.length > 0) {
        console.error("❌ Invalid members:", invalidMembers)
        throw new Error("Có thành viên không có nguoi_dung_id hợp lệ")
      }

      // ✅ Prepare API payload
      const apiPayload = {
        chuyen_di_id: Number.parseInt(tripId),
        so_tien: Number.parseFloat(formData.soTien),
        nhom: formData.loaiChiPhi,
        ngay: new Date().toISOString().split("T")[0], // Current date in YYYY-MM-DD format
        mo_ta: formData.ghiChu || formData.tenChiPhi, // Use ghiChu or tenChiPhi as description
        tien_te: "VND",
        hinh_thuc_chia: hinhThucChia,
        thanh_vien: thanhVien,
      }

      // ✅ Log để debug
      console.log("🔑 Token từ cookie:", token)
      console.log("📦 API Payload:", JSON.stringify(apiPayload, null, 2))
      console.log("👥 Members data:", members)
      console.log("📋 Thanh vien array:", thanhVien)

      // ✅ Validate token
      if (!token || token === "null" || token === "undefined") {
        toast({
          title: "Lỗi xác thực",
          description: "Token không hợp lệ. Vui lòng đăng nhập lại",
          variant: "destructive",
        })
        router.replace("/login")
        return
      }

      // Call API to create expense
      const response = await axios.post(
        "https://travel-planner-imdw.onrender.com/api/chi-phi",
        apiPayload,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      )

      const responseData = response.data
      const createdExpense = responseData?.chi_phi || responseData

      // Calculate split details for local state
      const chiTietChia = calculateSplit()
      const nguoiTra = members.find((m) => m.id === formData.nguoiTraId)

      // Call onSubmit with the created expense data
      onSubmit({
        ...formData,
        id: createdExpense?.chi_phi_id || createdExpense?.id || `exp${Date.now()}`,
        soTien: Number.parseFloat(formData.soTien),
        nguoiTra: nguoiTra?.name || "",
        chiTietChia,
        ngayChiTieu: apiPayload.ngay,
        _api: createdExpense,
      })

      // ✅ Lưu hình thức chia vào localStorage sau khi thêm thành công
      if (typeof window !== "undefined") {
        localStorage.setItem(`expense_split_preference_${tripId}`, formData.hinhThucChia)
        setIsFirstTime(false)
      }

      // ✅ Hiển thị thông báo với thông tin từ API response
      const message = responseData?.message || "Chi phí mới đã được thêm và chia sẻ"
      const nganSachConLai = responseData?.ngan_sach_con_lai
      
      toast({
        title: "Thành công",
        description: nganSachConLai !== undefined 
          ? `${message}. Ngân sách còn lại: ${Number(nganSachConLai).toLocaleString("vi-VN")} VNĐ`
          : message,
        variant: nganSachConLai !== undefined && nganSachConLai < 0 ? "destructive" : "default",
      })

      onClose()
    } catch (error: any) {
      console.error("Lỗi khi thêm chi phí:", error)
      
      if (error?.response?.status === 401 || error?.response?.status === 403) {
        toast({
          title: "Lỗi xác thực",
          description: "Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.",
          variant: "destructive",
        })
        router.replace("/login")
      } else {
        toast({
          title: "Lỗi thêm chi phí",
          description: error?.response?.data?.message || "Có lỗi xảy ra khi thêm chi phí",
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
                    {members
                      .filter((member) => member.role === "owner" || member.vai_tro === "owner")
                      .map((member) => (
                        <option key={member.id} value={member.id}>
                          {member.name}
                        </option>
                      ))}
                    {members.filter((member) => member.role === "owner" || member.vai_tro === "owner").length === 0 && (
                      <option value={members[0]?.id || ""} disabled={!members[0]}>
                        {members[0]?.name || "Chưa có thành viên"}
                      </option>
                    )}
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
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold">Cách chia chi phí</h3>
                  {!isFirstTime && (
                    <p className="text-xs text-muted-foreground">
                      Đã lưu: {formData.hinhThucChia === "equal" ? "Chia đều" : formData.hinhThucChia === "shares" ? "Theo phần" : "Theo %"}
                    </p>
                  )}
                </div>
                {isFirstTime && (
                  <div className="p-3 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-md">
                    <p className="text-sm text-blue-800 dark:text-blue-200">
                      <strong>Lưu ý:</strong> Bạn chỉ được chọn cách chia 1 lần trong lần thêm chi phí đầu tiên. Hình thức chia này sẽ được lưu và áp dụng cho các chi phí tiếp theo.
                    </p>
                  </div>
                )}

                <Tabs 
                  value={formData.hinhThucChia} 
                  onValueChange={(value) => {
                    // ✅ Chỉ cho phép đổi nếu là lần đầu tiên
                    if (isFirstTime) {
                      handleChange("hinhThucChia", value)
                    } else {
                      toast({
                        title: "Thông báo",
                        description: "Hình thức chia đã được lưu. Bạn có thể đổi trong lần thêm chi phí đầu tiên.",
                        variant: "default",
                      })
                    }
                  }}
                >
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger 
                      value="equal"
                      disabled={!isFirstTime && formData.hinhThucChia !== "equal"}
                    >
                      Chia đều
                    </TabsTrigger>
                    <TabsTrigger 
                      value="shares"
                      disabled={!isFirstTime && formData.hinhThucChia !== "shares"}
                    >
                      Theo phần
                    </TabsTrigger>
                    <TabsTrigger 
                      value="percent"
                      disabled={!isFirstTime && formData.hinhThucChia !== "percent"}
                    >
                      Theo %
                    </TabsTrigger>
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
