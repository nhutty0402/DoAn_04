"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { PieChart, BarChart, TrendingUp, Users, DollarSign, AreaChart as AreaChartIcon } from "lucide-react"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { Area, AreaChart, XAxis, YAxis, CartesianGrid, Legend } from "recharts"
import axios from "axios"
import Cookies from "js-cookie"
import { useRouter } from "next/navigation"

interface ExpenseReportsProps {
  expenses: any[]
  members: any[]
  tripId?: string
}

interface ChartDataItem {
  nhom: string
  tong_tien: number
  ti_le: number
}

interface ChartApiResponse {
  message: string
  chuyen_di_id: string
  tong_cong: number
  labels: string[]
  data: number[]
  items: ChartDataItem[]
}

interface MemberExpenseDetail {
  nguoi_dung_id: number
  chi_phi_id: number
  so_tien_phai_tra: string
  mo_ta: string
  nhom: string
  ngay: string
  hinh_thuc_chia: string
  nguoi_chi: string
}

interface MemberExpenseData {
  nguoi_dung_id: number
  ho_ten: string
  email: string
  tong_tien: number
  tong_tien_vnd_doc: string
  chi_tiet: MemberExpenseDetail[]
}

interface MemberExpenseApiResponse {
  message: string
  kieu_bao_cao: string
  tong_cong: number
  tong_cong_vnd_doc: string
  du_lieu: MemberExpenseData[]
}

export function ExpenseReports({ expenses, members, tripId }: ExpenseReportsProps) {
  const router = useRouter()
  const [chartData, setChartData] = useState<ChartApiResponse | null>(null)
  const [loadingChart, setLoadingChart] = useState(false)
  const [chartError, setChartError] = useState<string | null>(null)
  const [memberExpenseData, setMemberExpenseData] = useState<MemberExpenseApiResponse | null>(null)
  const [loadingMemberExpenses, setLoadingMemberExpenses] = useState(false)
  const [memberExpenseError, setMemberExpenseError] = useState<string | null>(null)

  // Debug: Log tripId prop
  useEffect(() => {
    console.log("📋 ExpenseReports component mounted/re-rendered")
    console.log("📋 tripId prop:", tripId)
    console.log("📋 tripId type:", typeof tripId)
    console.log("📋 tripId truthy:", !!tripId)
  }, [tripId])

  // Use API total if available, otherwise calculate from expenses
  const totalExpenses = memberExpenseData?.tong_cong || expenses.reduce((sum, exp) => sum + exp.soTien, 0)

  // Calculate expenses by category
  const expensesByCategory = expenses.reduce(
    (acc, expense) => {
      acc[expense.loaiChiPhi] = (acc[expense.loaiChiPhi] || 0) + expense.soTien
      return acc
    },
    {} as Record<string, number>,
  )

  // Calculate expenses by member from API data
  const expensesByMember = memberExpenseData?.du_lieu
    ? memberExpenseData.du_lieu.map((memberData) => {
        // Tính tổng số tiền đã trả (tổng các chi phí mà thành viên này là người chi)
        // Tìm tất cả các chi_phi_id duy nhất mà thành viên này là người chi
        // Cần kiểm tra trong tất cả chi_tiet của tất cả thành viên
        const paidExpenseIds = new Set<number>()
        memberExpenseData.du_lieu.forEach((m) => {
          m.chi_tiet.forEach((detail) => {
            if (detail.nguoi_chi === memberData.ho_ten) {
              paidExpenseIds.add(detail.chi_phi_id)
            }
          })
        })

        // Tính tổng số tiền đã trả bằng cách tính tổng của tất cả các chi phí mà thành viên này đã chi
        let totalPaid = 0
        paidExpenseIds.forEach((chiPhiId) => {
          // Tìm tổng số tiền của chi phí này từ chi_tiet của tất cả thành viên
          const expenseTotal = memberExpenseData.du_lieu.reduce((expSum, m) => {
            const memberDetail = m.chi_tiet.find((d) => d.chi_phi_id === chiPhiId)
            return expSum + (memberDetail ? Number(memberDetail.so_tien_phai_tra) : 0)
          }, 0)
          totalPaid += expenseTotal
        })

        // Tổng số tiền phải trả (tong_tien từ API)
        const totalOwed = memberData.tong_tien

        return {
          id: memberData.nguoi_dung_id,
          name: memberData.ho_ten,
          email: memberData.email,
          totalPaid,
          totalOwed,
          balance: totalPaid - totalOwed,
        }
      })
    : []

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

  // Màu sắc cho biểu đồ miền
  const areaChartColors = [
    "#10b981", // green-500
    "#3b82f6", // blue-500
    "#eab308", // yellow-500
    "#a855f7", // purple-500
    "#ec4899", // pink-500
    "#6b7280", // gray-500
    "#f59e0b", // amber-500
    "#ef4444", // red-500
  ]

  // Gọi API lấy dữ liệu biểu đồ
  useEffect(() => {
    if (!tripId) {
      console.warn("⚠️ Không có tripId, không thể gọi API biểu đồ")
      return
    }

    const fetchChartData = async () => {
      setLoadingChart(true)
      setChartError(null)

      const token = Cookies.get("token")
      console.log("🔑 Token từ cookie:", token)
      console.log("🆔 Trip ID:", tripId)

      if (!token || token === "null" || token === "undefined") {
        console.warn("❌ Không có token → chuyển về /login")
        router.replace("/login")
        return
      }

      const apiUrl = `https://travel-planner-imdw.onrender.com/api/chi-phi/bieu-do/nhom/${tripId}`
      console.log("🌐 Gọi API URL:", apiUrl)

      try {
        const response = await axios.get(apiUrl, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        })

        console.log("✅ API Response biểu đồ - Status:", response.status)
        console.log("✅ API Response biểu đồ - Data:", JSON.stringify(response.data, null, 2))

        // Validate response structure
        if (!response.data) {
          console.error("❌ Response data is null/undefined")
          setChartError("Dữ liệu từ API không hợp lệ")
          return
        }

        const data = response.data

        // Validate required fields
        if (!Array.isArray(data.labels)) {
          console.error("❌ labels is not an array:", data.labels)
          setChartError("Dữ liệu labels không hợp lệ")
          return
        }

        if (!Array.isArray(data.data)) {
          console.error("❌ data is not an array:", data.data)
          setChartError("Dữ liệu data không hợp lệ")
          return
        }

        if (!Array.isArray(data.items)) {
          console.error("❌ items is not an array:", data.items)
          setChartError("Dữ liệu items không hợp lệ")
          return
        }

        console.log(`✅ Validated data: ${data.labels.length} labels, ${data.data.length} data points, ${data.items.length} items`)
        
        setChartData(data)
      } catch (error: any) {
        console.error("❌ Lỗi khi lấy dữ liệu biểu đồ:", error)
        console.error("❌ Error response:", error.response?.data)
        console.error("❌ Error status:", error.response?.status)
        
        const errorMessage = error.response?.data?.message || error.message || "Không thể tải dữ liệu biểu đồ"
        setChartError(errorMessage)
      } finally {
        setLoadingChart(false)
      }
    }

    fetchChartData()
  }, [tripId, router])

  // Gọi API lấy dữ liệu chi phí theo thành viên
  useEffect(() => {
    if (!tripId) {
      console.warn("⚠️ Không có tripId, không thể gọi API chi phí theo thành viên")
      return
    }

    const fetchMemberExpenseData = async () => {
      setLoadingMemberExpenses(true)
      setMemberExpenseError(null)

      const token = Cookies.get("token")
      console.log("🔑 Token từ cookie:", token)
      console.log("🆔 Trip ID:", tripId)

      if (!token || token === "null" || token === "undefined") {
        console.warn("❌ Không có token → chuyển về /login")
        router.replace("/login")
        return
      }

      const apiUrl = `https://travel-planner-imdw.onrender.com/api/chi-phi/bao-cao/${tripId}?kieu=thanhvien`
      console.log("🌐 Gọi API URL chi phí theo thành viên:", apiUrl)

      try {
        const response = await axios.get(apiUrl, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        })

        console.log("✅ API Response chi phí theo thành viên - Status:", response.status)
        console.log("✅ API Response chi phí theo thành viên - Data:", JSON.stringify(response.data, null, 2))

        // Validate response structure
        if (!response.data) {
          console.error("❌ Response data is null/undefined")
          setMemberExpenseError("Dữ liệu từ API không hợp lệ")
          return
        }

        const data = response.data

        // Validate required fields
        if (!Array.isArray(data.du_lieu)) {
          console.error("❌ du_lieu is not an array:", data.du_lieu)
          setMemberExpenseError("Dữ liệu du_lieu không hợp lệ")
          return
        }

        console.log(`✅ Validated member expense data: ${data.du_lieu.length} members`)
        
        setMemberExpenseData(data)
      } catch (error: any) {
        console.error("❌ Lỗi khi lấy dữ liệu chi phí theo thành viên:", error)
        console.error("❌ Error response:", error.response?.data)
        console.error("❌ Error status:", error.response?.status)
        
        const errorMessage = error.response?.data?.message || error.message || "Không thể tải dữ liệu chi phí theo thành viên"
        setMemberExpenseError(errorMessage)
      } finally {
        setLoadingMemberExpenses(false)
      }
    }

    fetchMemberExpenseData()
  }, [tripId, router])

  // Chuẩn bị dữ liệu cho Area Chart
  const areaChartData = chartData?.labels && Array.isArray(chartData.labels) && chartData.labels.length > 0
    ? chartData.labels.map((label, index) => ({
        nhom: label || "",
        tong_tien: chartData.data && Array.isArray(chartData.data) ? (chartData.data[index] || 0) : 0,
        ti_le: chartData.items && Array.isArray(chartData.items) ? (chartData.items[index]?.ti_le || 0) : 0,
      }))
    : []

  // Debug logging
  useEffect(() => {
    if (chartData) {
      console.log("📊 Chart Data State:", chartData)
      console.log("📊 Area Chart Data:", areaChartData)
      console.log("📊 Has labels:", chartData.labels?.length > 0)
      console.log("📊 Has data:", chartData.data?.length > 0)
      console.log("📊 Has items:", chartData.items?.length > 0)
    }
  }, [chartData, areaChartData])

  // Chart config cho Area Chart
  const chartConfig = areaChartData.reduce(
    (acc, item, index) => {
      acc[item.nhom] = {
        label: item.nhom,
        color: areaChartColors[index % areaChartColors.length],
      }
      return acc
    },
    {} as Record<string, { label: string; color: string }>
  )

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
        {/* Biểu đồ miền - Chi phí theo nhóm */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AreaChartIcon className="h-5 w-5 text-primary" />
              Chi Phí Theo Nhóm
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loadingChart ? (
              <div className="flex items-center justify-center h-64">
                <div className="text-muted-foreground">Đang tải dữ liệu...</div>
              </div>
            ) : chartError ? (
              <div className="flex items-center justify-center h-64">
                <div className="text-destructive">{chartError}</div>
              </div>
            ) : !chartData ? (
              <div className="flex items-center justify-center h-64">
                <div className="text-muted-foreground">Đang khởi tạo...</div>
              </div>
            ) : areaChartData.length === 0 ? (
              <div className="flex items-center justify-center h-64">
                <div className="text-muted-foreground">
                  {chartData.labels?.length === 0 ? "Chưa có dữ liệu chi phí" : "Đang xử lý dữ liệu..."}
                </div>
              </div>
            ) : (
              <ChartContainer config={chartConfig} className="h-64 w-full">
                <AreaChart data={areaChartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <defs>
                    {areaChartData.map((item, index) => (
                      <linearGradient key={`gradient-${index}`} id={`colorGradient${index}`} x1="0" y1="0" x2="0" y2="1">
                        <stop
                          offset="5%"
                          stopColor={areaChartColors[index % areaChartColors.length]}
                          stopOpacity={0.8}
                        />
                        <stop
                          offset="95%"
                          stopColor={areaChartColors[index % areaChartColors.length]}
                          stopOpacity={0.1}
                        />
                      </linearGradient>
                    ))}
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis
                    dataKey="nhom"
                    className="text-xs"
                    tick={{ fill: "currentColor" }}
                    angle={-45}
                    textAnchor="end"
                    height={60}
                  />
                  <YAxis
                    className="text-xs"
                    tick={{ fill: "currentColor" }}
                    tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`}
                  />
                  <ChartTooltip
                    content={
                      <ChartTooltipContent
                        formatter={(value: any) => [
                          `${Number(value).toLocaleString("vi-VN")} VNĐ`,
                          "Tổng tiền",
                        ]}
                      />
                    }
                  />
                  <Legend />
                  <Area
                    type="monotone"
                    dataKey="tong_tien"
                    stroke={areaChartColors[0]}
                    fill={`url(#colorGradient0)`}
                    name="Tổng tiền (VNĐ)"
                  />
                </AreaChart>
              </ChartContainer>
            )}
            {chartData && chartData.items.length > 0 && (
              <div className="mt-4 space-y-2 pt-4 border-t">
                <div className="text-sm font-medium mb-2">Tổng cộng: {chartData.tong_cong.toLocaleString("vi-VN")} VNĐ</div>
                <div className="space-y-2">
                  {chartData.items.map((item, index) => (
                    <div key={item.nhom} className="flex justify-between text-xs">
                      <span className="flex items-center gap-2">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: areaChartColors[index % areaChartColors.length] }}
                        />
                        {item.nhom}
                      </span>
                      <span className="font-medium">
                        {item.ti_le.toFixed(1)}% ({item.tong_tien.toLocaleString("vi-VN")} VNĐ)
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
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
            {loadingMemberExpenses ? (
              <div className="flex items-center justify-center h-64">
                <div className="text-muted-foreground">Đang tải dữ liệu...</div>
              </div>
            ) : memberExpenseError ? (
              <div className="flex items-center justify-center h-64">
                <div className="text-destructive">{memberExpenseError}</div>
              </div>
            ) : !memberExpenseData ? (
              <div className="flex items-center justify-center h-64">
                <div className="text-muted-foreground">Đang khởi tạo...</div>
              </div>
            ) : expensesByMember.length === 0 ? (
              <div className="flex items-center justify-center h-64">
                <div className="text-muted-foreground">Chưa có dữ liệu chi phí theo thành viên</div>
              </div>
            ) : (
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
                    {totalExpenses > 0 && (
                      <>
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
                        {/* <div className="text-xs text-right">
                          Cân bằng:{" "}
                          <span className={member.balance >= 0 ? "text-green-600" : "text-red-600"}>
                            {member.balance.toLocaleString("vi-VN")} VNĐ
                          </span>
                        </div> */}
                      </>
                    )}
                  </div>
                ))}
                {memberExpenseData && memberExpenseData.tong_cong > 0 && (
                  <div className="mt-4 pt-4 border-t">
                    <div className="text-sm font-medium text-right">
                      Tổng cộng: {memberExpenseData.tong_cong.toLocaleString("vi-VN")} VNĐ
                    </div>
                  </div>
                )}
              </div>
            )}
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
                  <span className="text-lg font-bold text-primary">{(amount as number).toLocaleString("vi-VN")} VNĐ</span>
                </div>
              ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
