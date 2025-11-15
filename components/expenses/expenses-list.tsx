"use client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { MoreVertical, Edit, Trash2, Receipt, Users, Calendar } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { motion } from "framer-motion"

interface ExpensesListProps {
  expenses: any[]
  members: any[]
  onUpdateExpense: (expenses: any[]) => void
}

export function ExpensesList({ expenses, members, onUpdateExpense }: ExpensesListProps) {
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
                      <CardTitle className="text-lg font-[family-name:var(--font-space-grotesk)]">
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
                      <p className="text-sm text-muted-foreground">
                        {getPaidCount(expense)}/{getParticipantCount(expense)} đã trả
                      </p>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem className="text-destructive">
                          <Trash2 className="mr-2 h-4 w-4" />
                          Xóa
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
                    <h4 className="text-sm font-medium mb-2">Chi tiết chia tiền:</h4>
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
