"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { PieChart, BarChart, TrendingUp, Users, DollarSign } from "lucide-react"

interface ExpenseReportsProps {
  expenses: any[]
  members: any[]
}

export function ExpenseReports({ expenses, members }: ExpenseReportsProps) {
  const totalExpenses = expenses.reduce((sum, exp) => sum + exp.soTien, 0)

  // Calculate expenses by category
  const expensesByCategory = expenses.reduce(
    (acc, expense) => {
      acc[expense.loaiChiPhi] = (acc[expense.loaiChiPhi] || 0) + expense.soTien
      return acc
    },
    {} as Record<string, number>,
  )

  // Calculate expenses by member
  const expensesByMember = members.map((member) => {
    const memberExpenses = expenses.filter((exp) => exp.nguoiTraId === member.id)
    const totalPaid = memberExpenses.reduce((sum, exp) => sum + exp.soTien, 0)
    const totalOwed = expenses.reduce((sum, exp) => {
      const memberShare = exp.chiTietChia[member.id]
      return sum + (memberShare ? memberShare.soTien : 0)
    }, 0)
    return {
      ...member,
      totalPaid,
      totalOwed,
      balance: totalPaid - totalOwed,
    }
  })

  // Calculate expenses by day
  const expensesByDay = expenses.reduce(
    (acc, expense) => {
      const date = expense.ngayChiTieu
      acc[date] = (acc[date] || 0) + expense.soTien
      return acc
    },
    {} as Record<string, number>,
  )

  const categoryLabels = {
    food: "Ăn uống",
    accommodation: "Lưu trú",
    transport: "Di chuyển",
    activity: "Hoạt động",
    shopping: "Mua sắm",
    other: "Khác",
  }

  const categoryColors = {
    food: "bg-green-500",
    accommodation: "bg-blue-500",
    transport: "bg-yellow-500",
    activity: "bg-purple-500",
    shopping: "bg-pink-500",
    other: "bg-gray-500",
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Tổng chi phí</p>
                <p className="text-2xl font-bold text-foreground">{totalExpenses.toLocaleString("vi-VN")} VNĐ</p>
              </div>
              <DollarSign className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Trung bình/người</p>
                <p className="text-2xl font-bold text-foreground">
                  {Math.round(totalExpenses / members.length).toLocaleString("vi-VN")} VNĐ
                </p>
              </div>
              <Users className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Số khoản chi</p>
                <p className="text-2xl font-bold text-foreground">{expenses.length}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Expenses by Category */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChart className="h-5 w-5 text-primary" />
              Chi Phí Theo Danh Mục
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {Object.entries(expensesByCategory).map(([category, amount]) => {
                const percentage = ((amount / totalExpenses) * 100).toFixed(1)
                return (
                  <div key={category} className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="flex items-center gap-2">
                        <div
                          className={`w-3 h-3 rounded-full ${categoryColors[category as keyof typeof categoryColors]}`}
                        />
                        {categoryLabels[category as keyof typeof categoryLabels]}
                      </span>
                      <span className="font-medium">{percentage}%</span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2">
                      <div
                        className={`h-2 rounded-full ${categoryColors[category as keyof typeof categoryColors]}`}
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                    <div className="text-right text-xs text-muted-foreground">{amount.toLocaleString("vi-VN")} VNĐ</div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>

        {/* Expenses by Member */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart className="h-5 w-5 text-primary" />
              Chi Phí Theo Thành Viên
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {expensesByMember.map((member) => (
                <div key={member.id} className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="font-medium">{member.name}</span>
                    <div className="text-right text-sm">
                      <div className="font-medium">Trả: {member.totalPaid.toLocaleString("vi-VN")} VNĐ</div>
                      <div className="text-muted-foreground">Nợ: {member.totalOwed.toLocaleString("vi-VN")} VNĐ</div>
                    </div>
                  </div>
                  <div className="flex gap-1 h-2">
                    <div
                      className="bg-green-500 rounded-l"
                      style={{
                        width: `${(member.totalPaid / totalExpenses) * 100}%`,
                      }}
                    />
                    <div
                      className="bg-red-500 rounded-r"
                      style={{
                        width: `${(member.totalOwed / totalExpenses) * 100}%`,
                      }}
                    />
                  </div>
                  <div className="text-xs text-right">
                    Cân bằng:{" "}
                    <span className={member.balance >= 0 ? "text-green-600" : "text-red-600"}>
                      {member.balance.toLocaleString("vi-VN")} VNĐ
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Daily Expenses */}
      <Card>
        <CardHeader>
          <CardTitle>Chi Phí Theo Ngày</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {Object.entries(expensesByDay)
              .sort(([a], [b]) => new Date(a).getTime() - new Date(b).getTime())
              .map(([date, amount]) => (
                <div key={date} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                  <span className="font-medium">{new Date(date).toLocaleDateString("vi-VN")}</span>
                  <span className="text-lg font-bold text-primary">{amount.toLocaleString("vi-VN")} VNĐ</span>
                </div>
              ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
