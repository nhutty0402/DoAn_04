"use client"
import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { MoreVertical, Edit, Trash2, Receipt, Users, Calendar, ChevronDown, ChevronUp, Loader2 } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { motion } from "framer-motion"
import axios from "axios"
import Cookies from "js-cookie"
import { useRouter } from "next/navigation"
import { useToast } from "@/hooks/use-toast"

interface ExpensesListProps {
  expenses: any[]
  members: any[]
  onUpdateExpense: (expenses: any[]) => void
}

export function ExpensesList({ expenses, members, onUpdateExpense }: ExpensesListProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [expandedExpense, setExpandedExpense] = useState<string | null>(null)
  const [loadingDetail, setLoadingDetail] = useState<string | null>(null)
  const [expenseDetails, setExpenseDetails] = useState<Record<string, any>>({})
  const [deletingExpense, setDeletingExpense] = useState<string | null>(null)

  // ✅ Hàm lấy chi_phi_id từ expense (đảm bảo string)
  const getExpenseId = (expense: any): string | null => {
    const id = expense.chi_phi_id || expense.id
    return id ? String(id) : null
  }

  // ✅ Hàm gọi API GET chi tiết chi phí
  const fetchExpenseDetail = async (chiPhiId: string) => {
    // Nếu đã có chi tiết, chỉ toggle expand
    if (expenseDetails[chiPhiId]) {
      setExpandedExpense(expandedExpense === chiPhiId ? null : chiPhiId)
      return
    }

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

    setLoadingDetail(chiPhiId)
    try {
      console.log("🔍 Gọi API GET chi tiết chi phí:", chiPhiId)
      const response = await axios.get(
        `https://travel-planner-imdw.onrender.com/api/chi-phi/${chiPhiId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      )

      const data = response.data
      console.log("✅ API Response:", data)
      console.log("📋 Thanh vien:", data?.thanh_vien)
      
      setExpenseDetails((prev) => ({
        ...prev,
        [chiPhiId]: data,
      }))
      setExpandedExpense(chiPhiId)
    } catch (error: any) {
      console.error("❌ Lỗi khi lấy chi tiết chi phí:", error)
      if (error?.response?.status === 401 || error?.response?.status === 403) {
        toast({
          title: "Lỗi xác thực",
          description: error?.response?.data?.message || "Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.",
          variant: "destructive",
        })
        router.replace("/login")
      } else {
        toast({
          title: "Lỗi",
          description: error?.response?.data?.message || "Không thể tải chi tiết chi phí",
          variant: "destructive",
        })
      }
    } finally {
      setLoadingDetail(null)
    }
  }

  // ✅ Hàm xóa chi phí
  const handleDeleteExpense = async (chiPhiId: string, expenseName: string) => {
    if (!confirm(`Bạn có chắc chắn muốn xóa chi phí "${expenseName}"?`)) {
      return
    }

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

    setDeletingExpense(chiPhiId)
    try {
      const response = await axios.delete(
        `https://travel-planner-imdw.onrender.com/api/chi-phi/${chiPhiId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      )

      toast({
        title: "Thành công",
        description: response.data?.message || "Đã xóa chi phí thành công",
      })

      // ✅ Xóa chi phí khỏi danh sách
      const updatedExpenses = expenses.filter((exp) => exp.id !== chiPhiId && exp.chi_phi_id !== chiPhiId)
      onUpdateExpense(updatedExpenses)

      // ✅ Xóa chi tiết đã lưu
      setExpenseDetails((prev) => {
        const newDetails = { ...prev }
        delete newDetails[chiPhiId]
        return newDetails
      })
      setExpandedExpense(null)
    } catch (error: any) {
      console.error("❌ Lỗi khi xóa chi phí:", error)
      if (error?.response?.status === 401 || error?.response?.status === 403) {
        toast({
          title: "Lỗi xác thực",
          description: "Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.",
          variant: "destructive",
        })
        router.replace("/login")
      } else if (error?.response?.status === 403) {
        toast({
          title: "Không có quyền",
          description: error?.response?.data?.message || "Bạn không có quyền xóa chi phí này",
          variant: "destructive",
        })
      } else {
        toast({
          title: "Lỗi",
          description: error?.response?.data?.message || "Không thể xóa chi phí",
          variant: "destructive",
        })
      }
    } finally {
      setDeletingExpense(null)
    }
  }

  const getExpenseTypeLabel = (type: string) => {
    const types: Record<string, { label: string; color: string }> = {
      "ăn uống": { label: "Ăn uống", color: "bg-green-100 text-green-800" },
      "lưu trú": { label: "Lưu trú", color: "bg-blue-100 text-blue-800" },
      "di chuyển": { label: "Di chuyển", color: "bg-yellow-100 text-yellow-800" },
      "giải trí": { label: "Giải trí", color: "bg-purple-100 text-purple-800" },
      "mua sắm": { label: "Mua sắm", color: "bg-pink-100 text-pink-800" },
      "vé tham quan": { label: "Vé tham quan", color: "bg-indigo-100 text-indigo-800" },
      "dịch vụ": { label: "Dịch vụ", color: "bg-cyan-100 text-cyan-800" },
      "khác": { label: "Khác", color: "bg-gray-100 text-gray-800" },
      // Legacy English types for backward compatibility
      food: { label: "Ăn uống", color: "bg-green-100 text-green-800" },
      accommodation: { label: "Lưu trú", color: "bg-blue-100 text-blue-800" },
      transport: { label: "Di chuyển", color: "bg-yellow-100 text-yellow-800" },
      activity: { label: "Hoạt động", color: "bg-purple-100 text-purple-800" },
      shopping: { label: "Mua sắm", color: "bg-pink-100 text-pink-800" },
      other: { label: "Khác", color: "bg-gray-100 text-gray-800" },
    }
    return types[type] || types["khác"] || types.other
  }

  const getSplitMethodLabel = (method: string) => {
    const methods = {
      equal: "Chia đều",
      shares: "Theo phần",
      percent: "Theo %",
    }
    return methods[method as keyof typeof methods] || "Chia đều"
  }

  const getMemberName = (memberId: string) => {
    return members.find((m) => m.id === memberId)?.name || "Unknown"
  }

  const getParticipantCount = (expense: any) => {
    return expense.thanhVienThamGia.length
  }

  const getPaidCount = (expense: any) => {
    return Object.values(expense.chiTietChia).filter((detail: any) => detail.daTra).length
  }

  return (
    <div className="space-y-4">
      {expenses.length === 0 ? (
        <div className="text-center py-12">
          <Receipt className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-foreground mb-2">Chưa có chi phí nào</h3>
          <p className="text-muted-foreground">Bắt đầu bằng cách thêm chi phí đầu tiên</p>
        </div>
      ) : (
        expenses.map((expense, index) => (
          <motion.div
            key={expense.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: index * 0.05 }}
          >
            <Card className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <CardTitle 
                        className="text-lg font-[family-name:var(--font-space-grotesk)] cursor-pointer hover:text-primary"
                        onClick={() => {
                          const chiPhiId = getExpenseId(expense)
                          if (chiPhiId) {
                            fetchExpenseDetail(chiPhiId)
                          }
                        }}
                      >
                        {expense.tenChiPhi}
                      </CardTitle>
                      <Badge className={`text-xs ${getExpenseTypeLabel(expense.loaiChiPhi).color}`} variant="secondary">
                        {getExpenseTypeLabel(expense.loaiChiPhi).label}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        <span>{new Date(expense.ngayChiTieu).toLocaleDateString("vi-VN")}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Users className="h-4 w-4" />
                        <span>{getParticipantCount(expense)} người</span>
                      </div>
                      <span>•</span>
                      <span>{getSplitMethodLabel(expense.hinhThucChia)}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <p className="text-2xl font-bold text-primary">{expense.soTien.toLocaleString("vi-VN")} VNĐ</p>
                      {/* <p className="text-sm text-muted-foreground">
                        {getPaidCount(expense)}/{getParticipantCount(expense)} đã trả
                      </p> */}
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" disabled={deletingExpense === getExpenseId(expense)}>
                          {deletingExpense === getExpenseId(expense) ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <MoreVertical className="h-4 w-4" />
                          )}
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem 
                          className="text-destructive"
                          onClick={() => {
                            const chiPhiId = getExpenseId(expense)
                            if (chiPhiId) {
                              handleDeleteExpense(chiPhiId, expense.tenChiPhi)
                            }
                          }}
                          disabled={deletingExpense === getExpenseId(expense)}
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          {deletingExpense === getExpenseId(expense) ? "Đang xóa..." : "Xóa"}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">Người trả:</span>
                    <div className="flex items-center gap-2">
                      <Avatar className="h-6 w-6">
                        <AvatarFallback className="text-xs bg-primary text-primary-foreground">
                          {expense.nguoiTra
                            .split(" ")
                            .map((n: string) => n[0])
                            .join("")}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-sm font-medium">{expense.nguoiTra}</span>
                    </div>
                  </div>

                  {expense.ghiChu && (
                    <p className="text-sm text-muted-foreground font-[family-name:var(--font-dm-sans)]">
                      {expense.ghiChu}
                    </p>
                  )}

                  {/* Split Details */}
                  <div className="border-t pt-3">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-sm font-medium">Chi tiết chia tiền:</h4>
                      {(() => {
                        const chiPhiId = getExpenseId(expense)
                        return chiPhiId ? (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => fetchExpenseDetail(chiPhiId)}
                            disabled={loadingDetail === chiPhiId}
                          >
                            {loadingDetail === chiPhiId ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : expandedExpense === chiPhiId ? (
                              <>
                                <ChevronUp className="h-4 w-4 mr-1" />
                                Thu gọn
                              </>
                            ) : (
                              <>
                                <ChevronDown className="h-4 w-4 mr-1" />
                                Xem chi tiết
                              </>
                            )}
                          </Button>
                        ) : null
                      })()}
                    </div>
                    
                    {/* Chi tiết từ local data */}
                    {expense.chiTietChia && Object.keys(expense.chiTietChia).length > 0 && (
                      <div className="grid grid-cols-2 gap-2">
                        {Object.entries(expense.chiTietChia).map(([memberId, detail]: [string, any]) => (
                          <div key={memberId} className="flex items-center justify-between text-sm">
                            <span>{getMemberName(memberId)}</span>
                            <div className="flex items-center gap-2">
                              <span className="font-medium">{detail.soTien.toLocaleString("vi-VN")} VNĐ</span>
                              <div
                                className={`w-2 h-2 rounded-full ${detail.daTra ? "bg-green-500" : "bg-yellow-500"}`}
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* ✅ Chi tiết từ API khi expand */}
                    {(() => {
                      const chiPhiId = getExpenseId(expense)
                      const detail = chiPhiId ? expenseDetails[chiPhiId] : null
                      const isExpanded = expandedExpense === chiPhiId
                      
                      if (!isExpanded || !detail) return null
                      
                      const thanhVien = detail?.thanh_vien || []
                      
                      if (!Array.isArray(thanhVien) || thanhVien.length === 0) {
                        return (
                          <div className="mt-4 pt-4 border-t">
                            <p className="text-sm text-muted-foreground">Chưa có chi tiết từ hệ thống</p>
                          </div>
                        )
                      }
                      
                      return (
                        <div className="mt-4 pt-4 border-t">
                          {/* <h5 className="text-sm font-semibold mb-3">Chi tiết từ hệ thống:</h5> */}
                          <div className="space-y-2">
                            {thanhVien.map((member: any, idx: number) => (
                              <div key={member.nguoi_dung_id || idx} className="flex items-center justify-between p-2 bg-muted/50 rounded-md">
                                <div className="flex items-center gap-2">
                                  <Avatar className="h-8 w-8">
                                    <AvatarImage src={member.avatar_url || "/placeholder-user.jpg"} alt={member.ho_ten} />
                                    <AvatarFallback className="text-xs bg-primary text-primary-foreground">
                                      {member.ho_ten
                                        ?.split(" ")
                                        ?.map((n: string) => n[0])
                                        ?.join("")
                                        ?.toUpperCase()
                                        ?.slice(0, 2) || "U"}
                                    </AvatarFallback>
                                  </Avatar>
                                  <div>
                                    <p className="text-sm font-medium">{member.ho_ten || "Unknown"}</p>
                                    {member.ti_le && (
                                      <p className="text-xs text-muted-foreground">Tỷ lệ: {member.ti_le}</p>
                                    )}
                                    {member.phan_tram !== null && member.phan_tram !== undefined && (
                                      <p className="text-xs text-muted-foreground">Phần trăm: {member.phan_tram}%</p>
                                    )}
                                  </div>
                                </div>
                                <div className="text-right">
                                  <p className="text-sm font-semibold text-primary">
                                    {Number(member.so_tien_phai_tra || 0).toLocaleString("vi-VN")} VNĐ
                                  </p>
                                  <p className="text-xs text-muted-foreground">
                                    {member.hinh_thuc_chia === "equal" ? "Chia đều" : 
                                     member.hinh_thuc_chia === "custom" ? "Theo phần" : 
                                     member.hinh_thuc_chia === "percent" ? "Theo %" : ""}
                                  </p>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )
                    })()}
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))
      )}
    </div>
  )
}
