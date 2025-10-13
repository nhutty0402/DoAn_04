"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { ArrowRight, Calculator, CreditCard, CheckCircle } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface ExpenseSettlementProps {
  expenses: any[]
  members: any[]
}

export function ExpenseSettlement({ expenses, members }: ExpenseSettlementProps) {
  const [settlements, setSettlements] = useState<any[]>([])
  const { toast } = useToast()

  // Calculate member balances
  const memberBalances = members.map((member) => {
    const totalPaid = expenses.filter((exp) => exp.nguoiTraId === member.id).reduce((sum, exp) => sum + exp.soTien, 0)

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

  // Calculate optimal transfers
  const calculateOptimalTransfers = () => {
    const creditors = memberBalances.filter((m) => m.balance > 0).sort((a, b) => b.balance - a.balance)
    const debtors = memberBalances.filter((m) => m.balance < 0).sort((a, b) => a.balance - b.balance)

    const transfers: any[] = []
    let creditorIndex = 0
    let debtorIndex = 0

    while (creditorIndex < creditors.length && debtorIndex < debtors.length) {
      const creditor = creditors[creditorIndex]
      const debtor = debtors[debtorIndex]

      const transferAmount = Math.min(creditor.balance, Math.abs(debtor.balance))

      if (transferAmount > 0) {
        transfers.push({
          id: `transfer_${transfers.length}`,
          from: debtor,
          to: creditor,
          amount: transferAmount,
          status: "pending",
        })

        creditor.balance -= transferAmount
        debtor.balance += transferAmount
      }

      if (creditor.balance === 0) creditorIndex++
      if (debtor.balance === 0) debtorIndex++
    }

    return transfers
  }

  const optimalTransfers = calculateOptimalTransfers()

  const handlePayment = (transferId: string) => {
    toast({
      title: "Thanh toán thành công",
      description: "Giao dịch đã được ghi nhận",
    })
    // In real app, this would update the transfer status
  }

  const totalToSettle = memberBalances.filter((m) => m.balance < 0).reduce((sum, m) => sum + Math.abs(m.balance), 0)

  return (
    <div className="space-y-6">
      {/* Settlement Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Cần quyết toán</p>
                <p className="text-2xl font-bold text-foreground">{totalToSettle.toLocaleString("vi-VN")} VNĐ</p>
              </div>
              <Calculator className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Số giao dịch</p>
                <p className="text-2xl font-bold text-foreground">{optimalTransfers.length}</p>
              </div>
              <ArrowRight className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Đã hoàn thành</p>
                <p className="text-2xl font-bold text-foreground">
                  {settlements.filter((s) => s.status === "completed").length}
                </p>
              </div>
              <CheckCircle className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Member Balances */}
      <Card>
        <CardHeader>
          <CardTitle>Số Dư Thành Viên</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {memberBalances.map((member) => (
              <div key={member.id} className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
                <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10">
                    <AvatarFallback className="bg-primary text-primary-foreground">
                      {member.name
                        .split(" ")
                        .map((n: string) => n[0])
                        .join("")}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="font-semibold">{member.name}</h3>
                    <div className="text-sm text-muted-foreground">
                      Trả: {member.totalPaid.toLocaleString("vi-VN")} • Nợ: {member.totalOwed.toLocaleString("vi-VN")}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div
                    className={`text-lg font-bold ${
                      member.balance > 0 ? "text-green-600" : member.balance < 0 ? "text-red-600" : "text-gray-600"
                    }`}
                  >
                    {member.balance > 0 ? "+" : ""}
                    {member.balance.toLocaleString("vi-VN")} VNĐ
                  </div>
                  <Badge
                    variant={member.balance > 0 ? "default" : member.balance < 0 ? "destructive" : "secondary"}
                    className="text-xs"
                  >
                    {member.balance > 0 ? "Được trả" : member.balance < 0 ? "Cần trả" : "Cân bằng"}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Optimal Transfers */}
      <Card>
        <CardHeader>
          <CardTitle>Giao Dịch Đề Xuất</CardTitle>
        </CardHeader>
        <CardContent>
          {optimalTransfers.length === 0 ? (
            <div className="text-center py-8">
              <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-2">Đã cân bằng</h3>
              <p className="text-muted-foreground">Tất cả thành viên đã thanh toán đủ</p>
            </div>
          ) : (
            <div className="space-y-4">
              {optimalTransfers.map((transfer) => (
                <div
                  key={transfer.id}
                  className="flex items-center justify-between p-4 border border-border rounded-lg"
                >
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className="bg-red-100 text-red-800 text-xs">
                          {transfer.from.name
                            .split(" ")
                            .map((n: string) => n[0])
                            .join("")}
                        </AvatarFallback>
                      </Avatar>
                      <span className="font-medium">{transfer.from.name}</span>
                    </div>

                    <ArrowRight className="h-4 w-4 text-muted-foreground" />

                    <div className="flex items-center gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className="bg-green-100 text-green-800 text-xs">
                          {transfer.to.name
                            .split(" ")
                            .map((n: string) => n[0])
                            .join("")}
                        </AvatarFallback>
                      </Avatar>
                      <span className="font-medium">{transfer.to.name}</span>
                    </div>

                    <div className="ml-4">
                      <div className="text-lg font-bold text-primary">
                        {transfer.amount.toLocaleString("vi-VN")} VNĐ
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePayment(transfer.id)}
                      className="bg-primary/10 hover:bg-primary/20 text-primary border-primary/20"
                    >
                      <CreditCard className="h-4 w-4 mr-1" />
                      Thanh toán
                    </Button>
                  </div>
                </div>
              ))}

              <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                <h4 className="font-semibold text-blue-900 mb-2">💡 Mẹo tối ưu</h4>
                <p className="text-sm text-blue-800">
                  Thực hiện {optimalTransfers.length} giao dịch này sẽ giúp tất cả thành viên cân bằng chi phí một cách
                  tối ưu nhất.
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
