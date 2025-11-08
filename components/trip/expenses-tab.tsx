"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import {
  Plus,
  DollarSign,
  PieChart,
  Calculator,
  Receipt,
  Wallet,
  Settings,
  TrendingDown,
  TrendingUp,
} from "lucide-react"
import { AddExpenseModal } from "@/components/expenses/add-expense-modal"
import { ExpensesList } from "@/components/expenses/expenses-list"
import { ExpenseReports } from "@/components/expenses/expense-reports"
import { ExpenseSettlement } from "@/components/expenses/expense-settlement"
import { motion } from "framer-motion"

// Mock expense data
const mockExpenses = [
  {
    id: "exp1",
    tenChiPhi: "Khách sạn Muong Thanh",
    soTien: 2400000,
    ngayChiTieu: "2024-03-15",
    loaiChiPhi: "accommodation",
    nguoiTra: "Nguyễn Văn A",
    nguoiTraId: "user1",
    ghiChu: "2 phòng x 3 đêm",
    hinhThucChia: "equal",
    thanhVienThamGia: ["user1", "user2", "user3", "user4"],
    chiTietChia: {
      user1: { soTien: 600000, daTra: true },
      user2: { soTien: 600000, daTra: false },
      user3: { soTien: 600000, daTra: false },
      user4: { soTien: 600000, daTra: false },
    },
  },
  {
    id: "exp2",
    tenChiPhi: "Ăn trưa tại Chợ Hàn",
    soTien: 480000,
    ngayChiTieu: "2024-03-15",
    loaiChiPhi: "food",
    nguoiTra: "Trần Thị B",
    nguoiTraId: "user2",
    ghiChu: "Cơm gà, mì quảng",
    hinhThucChia: "equal",
    thanhVienThamGia: ["user1", "user2", "user3", "user4"],
    chiTietChia: {
      user1: { soTien: 120000, daTra: true },
      user2: { soTien: 120000, daTra: true },
      user3: { soTien: 120000, daTra: false },
      user4: { soTien: 120000, daTra: false },
    },
  },
  {
    id: "exp3",
    tenChiPhi: "Vé tham quan Bà Nà Hills",
    soTien: 2800000,
    ngayChiTieu: "2024-03-16",
    loaiChiPhi: "activity",
    nguoiTra: "Lê Văn C",
    nguoiTraId: "user3",
    ghiChu: "Vé cáp treo + buffet",
    hinhThucChia: "shares",
    thanhVienThamGia: ["user1", "user2", "user3", "user4"],
    chiTietChia: {
      user1: { soTien: 700000, daTra: false },
      user2: { soTien: 700000, daTra: false },
      user3: { soTien: 700000, daTra: true },
      user4: { soTien: 700000, daTra: false },
    },
  },
]

const mockMembers = [
  { id: "user1", name: "Nguyễn Văn A", email: "a@example.com" },
  { id: "user2", name: "Trần Thị B", email: "b@example.com" },
  { id: "user3", name: "Lê Văn C", email: "c@example.com" },
  { id: "user4", name: "Phạm Thị D", email: "d@example.com" },
]

interface ExpensesTabProps {
  tripId: string
}

export function ExpensesTab({ tripId }: ExpensesTabProps) {
  const [expenses, setExpenses] = useState(mockExpenses)
  const [showAddModal, setShowAddModal] = useState(false)
  const [activeTab, setActiveTab] = useState("list")
  const [totalBudget, setTotalBudget] = useState(10000000) // Default 10 million VND
  const [showBudgetModal, setShowBudgetModal] = useState(false)
  const [tempBudget, setTempBudget] = useState("")

  const totalExpenses = expenses.reduce((sum, exp) => sum + exp.soTien, 0)
  const totalPerPerson = totalExpenses / mockMembers.length
  const remainingBudget = totalBudget - totalExpenses
  const budgetUsedPercentage = totalBudget > 0 ? (totalExpenses / totalBudget) * 100 : 0

  const handleAddExpense = (expenseData: any) => {
    const newExpense = {
      id: `exp${Date.now()}`,
      ...expenseData,
      ngayChiTieu: new Date().toISOString().split("T")[0],
    }
    setExpenses([newExpense, ...expenses])
    setShowAddModal(false)
  }

  const handleUpdateBudget = () => {
    const newBudget = Number.parseFloat(tempBudget.replace(/,/g, ""))
    if (!isNaN(newBudget) && newBudget > 0) {
      setTotalBudget(newBudget)
      setShowBudgetModal(false)
      setTempBudget("")
    }
  }

  const stats = [
    {
      title: "Ngân sách tổng",
      value: `${totalBudget.toLocaleString("vi-VN")} VNĐ`,
      icon: <Wallet className="h-5 w-5 text-blue-600" />,
      description: "Tổng tiền hiện có",
    },
    {
      title: "Đã chi tiêu",
      value: `${totalExpenses.toLocaleString("vi-VN")} VNĐ`,
      icon: <DollarSign className="h-5 w-5 text-red-500" />,
      description: `${expenses.length} khoản chi`,
    },
    {
      title: "Còn lại",
      value: `${remainingBudget.toLocaleString("vi-VN")} VNĐ`,
      icon:
        remainingBudget >= 0 ? (
          <TrendingUp className="h-5 w-5 text-green-600" />
        ) : (
          <TrendingDown className="h-5 w-5 text-red-500" />
        ),
      description: remainingBudget >= 0 ? `${(100 - budgetUsedPercentage).toFixed(1)}% còn lại` : "Vượt ngân sách",
    },
    {
      title: "Chi phí/người",
      value: `${totalPerPerson.toLocaleString("vi-VN")} VNĐ`,
      icon: <Calculator className="h-5 w-5 text-primary" />,
      description: "Trung bình",
    },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground font-[family-name:var(--font-space-grotesk)]">
            Quản Lý Chi Phí
          </h2>
          {/* <p className="text-muted-foreground font-[family-name:var(--font-dm-sans)]">
            Theo dõi ngân sách và chia sẻ chi phí chuyến đi
          </p> */}
        </div>
        <div className="flex gap-2">
          <Dialog open={showBudgetModal} onOpenChange={setShowBudgetModal}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                <Settings className="h-4 w-4 mr-2" />
                Ngân sách
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Cập nhật ngân sách chuyến đi</DialogTitle>
              </DialogHeader>
              <div className="space-y-3 pt-2">
                <div className="space-y-1.5">
                  <Label htmlFor="budget" className="text-sm font-medium">
                    Tổng tiền hiện có (VNĐ)
                  </Label>
                  <Input
                    id="budget"
                    type="text"
                    placeholder="Nhập số tiền..."
                    value={tempBudget}
                    onChange={(e) => {
                      const value = e.target.value.replace(/[^\d]/g, "")
                      setTempBudget(value ? Number.parseInt(value).toLocaleString("vi-VN") : "")
                    }}
                  />
                  {/* <p className="text-xs text-muted-foreground">
                    Ngân sách hiện tại:{" "}
                    <span className="font-medium text-foreground">
                      {totalBudget.toLocaleString("vi-VN")} VNĐ
                    </span>
                  </p> */}
                </div>

                <div className="flex justify-end gap-2 pt-1">
                  <Button
                    variant="outline"
                    className="px-4 py-1.5 text-sm"
                    onClick={() => setShowBudgetModal(false)}
                  >
                    Hủy
                  </Button>
                  <Button className="px-4 py-1.5 text-sm" onClick={handleUpdateBudget}>
                    Cập nhật
                  </Button>
                </div>
              </div>

            </DialogContent>
          </Dialog>
          <Button onClick={() => setShowAddModal(true)} className="bg-primary hover:bg-primary/90">
            <Plus className="h-4 w-4 mr-2" />
            Thêm Chi Phí
          </Button>
        </div>
      </div>

      {/* THỐNG KÊ % NGÂN SÁCH*/}
      {/* <Card
        className={`border-2 ${remainingBudget < 0 ? "border-red-200 bg-red-50/50" : budgetUsedPercentage > 80 ? "border-yellow-200 bg-yellow-50/50" : "border-green-200 bg-green-50/50"}`}
      >
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-semibold text-foreground">Tình trạng ngân sách</h3>
              <p className="text-sm text-muted-foreground">
                {remainingBudget >= 0
                  ? `Còn lại ${remainingBudget.toLocaleString("vi-VN")} VNĐ`
                  : `Vượt ngân sách ${Math.abs(remainingBudget).toLocaleString("vi-VN")} VNĐ`}
              </p>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-foreground">{budgetUsedPercentage.toFixed(1)}%</p>
              <p className="text-sm text-muted-foreground">Đã sử dụng</p>
            </div>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div
              className={`h-3 rounded-full transition-all duration-300 ${
                remainingBudget < 0 ? "bg-red-500" : budgetUsedPercentage > 80 ? "bg-yellow-500" : "bg-green-500"
              }`}
              style={{ width: `${Math.min(budgetUsedPercentage, 100)}%` }}
            />
          </div>
        </CardContent>
      </Card> */}

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: index * 0.1 }}
          >
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">{stat.title}</p>
                    <p className="text-2xl font-bold text-foreground">{stat.value}</p>
                    <p className="text-xs text-muted-foreground mt-1">{stat.description}</p>
                  </div>
                  {stat.icon}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="list" className="flex items-center gap-2">
            <Receipt className="h-4 w-4" />
            <span className="hidden sm:inline">Danh sách</span>
          </TabsTrigger>
          <TabsTrigger value="reports" className="flex items-center gap-2">
            <PieChart className="h-4 w-4" />
            <span className="hidden sm:inline">Báo cáo</span>
          </TabsTrigger>
          <TabsTrigger value="settlement" className="flex items-center gap-2">
            <Calculator className="h-4 w-4" />
            <span className="hidden sm:inline">Quyết toán</span>
          </TabsTrigger>
          <TabsTrigger value="history" className="flex items-center gap-2">
            <DollarSign className="h-4 w-4" />
            <span className="hidden sm:inline">Lịch sử</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="list">
          <ExpensesList expenses={expenses} members={mockMembers} onUpdateExpense={setExpenses} />
        </TabsContent>

        <TabsContent value="reports">
          <ExpenseReports expenses={expenses} members={mockMembers} />
        </TabsContent>

        <TabsContent value="settlement">
          <ExpenseSettlement expenses={expenses} members={mockMembers} />
        </TabsContent>

        <TabsContent value="history">
          <div className="text-center py-12">
            <DollarSign className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">Lịch sử thanh toán</h3>
            <p className="text-muted-foreground">Tính năng đang được phát triển</p>
          </div>
        </TabsContent>
      </Tabs>

      {/* Add Expense Modal */}
      {showAddModal && (
        <AddExpenseModal onClose={() => setShowAddModal(false)} onSubmit={handleAddExpense} members={mockMembers} />
      )}
    </div>
  )
}
