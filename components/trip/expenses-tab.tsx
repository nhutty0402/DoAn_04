"use client"

import { useState, useEffect } from "react"
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
import axios from "axios"
import Cookies from "js-cookie"
import { useRouter } from "next/navigation"
import { useToast } from "@/hooks/use-toast"

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
  const router = useRouter()
  const { toast } = useToast()
  const [expenses, setExpenses] = useState(mockExpenses)
  const [showAddModal, setShowAddModal] = useState(false)
  const [activeTab, setActiveTab] = useState("list")
  const [totalBudget, setTotalBudget] = useState(0)
  const [showBudgetModal, setShowBudgetModal] = useState(false)
  const [tempBudget, setTempBudget] = useState("")
  const [isLoadingBudget, setIsLoadingBudget] = useState(false)
  const [isUpdatingBudget, setIsUpdatingBudget] = useState(false)
  const [budgetInfo, setBudgetInfo] = useState<{
    so_nguoi: number
    muc_toi_thieu: number
    canh_bao: boolean
    thong_diep: string
  } | null>(null)
  const [members, setMembers] = useState<any[]>([])
  const [loadingMembers, setLoadingMembers] = useState(false)
  const [loadingExpenses, setLoadingExpenses] = useState(false)

  const totalExpenses = expenses.reduce((sum, exp) => sum + exp.soTien, 0)
  const totalPerPerson = members.length > 0 ? totalExpenses / members.length : 0
  const remainingBudget = totalBudget - totalExpenses
  const budgetUsedPercentage = totalBudget > 0 ? (totalExpenses / totalBudget) * 100 : 0

  // Fetch expenses from API
  const fetchExpenses = async () => {
    try {
      const token = Cookies.get("token")
      if (!token || token === "null" || token === "undefined") {
        console.warn("Không có token để lấy danh sách chi phí")
        return
      }

      if (!tripId) return

      setLoadingExpenses(true)
      const response = await axios.get(
        `https://travel-planner-imdw.onrender.com/api/chi-phi/chuyen-di/${tripId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      )

      // Backend trả về: { message, tong_so, danh_sach: [...] }
      const apiData = response.data?.danh_sach || []

      // Map expenses from API response
      const expensesWithDetails = apiData.map((expense: any) => {
        // Map expense type (nhom) - it's already in Vietnamese
        const loaiChiPhi = expense.nhom || "khác"

        // Map hinh_thuc_chia - convert "custom" back to "shares" for display
        let hinhThucChia = expense.hinh_thuc_chia || "equal"
        if (hinhThucChia === "custom") {
          hinhThucChia = "shares"
        }

        // If chi_tiet is included in the response, use it
        // Otherwise, we'll need to fetch it separately or construct it
        const chiTiet = expense.chi_tiet || []
        const chiTietChia: Record<string, { soTien: number; daTra: boolean }> = {}
        const thanhVienThamGia: string[] = []

        if (Array.isArray(chiTiet) && chiTiet.length > 0) {
          chiTiet.forEach((detail: any) => {
            const memberId = String(detail.nguoi_dung_id || "")
            if (!thanhVienThamGia.includes(memberId)) {
              thanhVienThamGia.push(memberId)
            }
            chiTietChia[memberId] = {
              soTien: Number.parseFloat(detail.so_tien_phai_tra || 0),
              daTra: false, // Default to false, can be updated if there's a field for this
            }
          })
        }

        return {
          id: String(expense.chi_phi_id || ""),
          chi_phi_id: expense.chi_phi_id,
          tenChiPhi: expense.mo_ta || `${expense.nhom} - ${expense.ngay}`,
          soTien: Number.parseFloat(expense.so_tien || 0),
          loaiChiPhi,
          ngayChiTieu: expense.ngay || new Date().toISOString().split("T")[0],
          nguoiTra: expense.nguoi_chi || "",
          nguoiTraId: String(expense.nguoi_chi_id || ""),
          ghiChu: expense.mo_ta || "",
          hinhThucChia,
          thanhVienThamGia,
          chiTietChia,
          tien_te: expense.tien_te || "VND",
          tao_luc: expense.tao_luc || "",
          _api: expense,
        }
      })

      setExpenses(expensesWithDetails)
    } catch (error: any) {
      console.error("Lỗi khi lấy danh sách chi phí:", error)
      if (error?.response?.status === 401 || error?.response?.status === 403) {
        router.replace("/login")
      } else {
        toast({
          title: "Lỗi",
          description: error?.response?.data?.message || "Không thể tải danh sách chi phí",
          variant: "destructive",
        })
        // Keep mock expenses on error
      }
    } finally {
      setLoadingExpenses(false)
    }
  }

  // Fetch members from API
  const fetchMembers = async () => {
    try {
      const token = Cookies.get("token")
      if (!token || token === "null" || token === "undefined") {
        console.warn("Không có token để lấy danh sách thành viên")
        return
      }

      if (!tripId) return

      setLoadingMembers(true)
      const response = await axios.get(
        `https://travel-planner-imdw.onrender.com/api/thanh-vien/${tripId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      )

      // Backend trả về: { message, tong_so, danh_sach: [...] }
      const apiData = response.data?.danh_sach || []

      // Map API response to component format - only accepted members
      const mappedMembers = apiData
        .filter((item: any) => item.trang_thai_tham_gia === "accepted")
        .map((item: any) => ({
          id: String(item.nguoi_dung_id || ""),
          nguoi_dung_id: item.nguoi_dung_id,
          name: item.ho_ten || "",
          ho_ten: item.ho_ten || "",
          email: item.email || "",
          role: item.role || item.vai_tro || "",
          vai_tro: item.vai_tro || item.role || "",
        }))

      setMembers(mappedMembers)
    } catch (error: any) {
      console.error("Lỗi khi lấy danh sách thành viên:", error)
      if (error?.response?.status === 401 || error?.response?.status === 403) {
        router.replace("/login")
      } else {
        // Fallback to mock members if API fails
        setMembers(mockMembers)
      }
    } finally {
      setLoadingMembers(false)
    }
  }

  // Fetch members and expenses on mount
  useEffect(() => {
    if (tripId) {
      fetchMembers()
      fetchExpenses()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tripId])

  // Fetch budget from API
  const fetchBudget = async () => {
    try {
      const token = Cookies.get("token")
      console.log("Token từ cookie:", token)

      if (!token || token === "null" || token === "undefined") {
        console.warn("Không có token → chuyển về /login")
        router.replace("/login")
        return
      }

      if (!tripId) return

      setIsLoadingBudget(true)
      const res = await axios.get(
        `https://travel-planner-imdw.onrender.com/api/chi-phi/tong-ngan-sach/${tripId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      )

      const data = res?.data
      if (data) {
        setTotalBudget(data.tong_ngan_sach || 0)
        setBudgetInfo({
          so_nguoi: data.so_nguoi || 0,
          muc_toi_thieu: data.muc_toi_thieu || 0,
          canh_bao: data.canh_bao || false,
          thong_diep: data.thong_diep || "",
        })

        // Show warning toast if budget is low
        if (data.canh_bao && data.thong_diep) {
          toast({
            title: "⚠️ Cảnh báo ngân sách",
            description: data.thong_diep,
            variant: "destructive",
          })
        }
      }
    } catch (error: any) {
      console.error("Lỗi khi lấy ngân sách:", error)
      if (error?.response?.status === 401 || error?.response?.status === 403) {
        router.replace("/login")
      } else {
        toast({
          title: "Lỗi",
          description: error?.response?.data?.message || "Không thể lấy thông tin ngân sách",
          variant: "destructive",
        })
      }
    } finally {
      setIsLoadingBudget(false)
    }
  }

  // Fetch budget on mount
  useEffect(() => {
    if (tripId) {
      fetchBudget()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tripId])

  const handleAddExpense = async (expenseData: any) => {
    // ✅ Đóng modal trước
    setShowAddModal(false)
    
    // ✅ Gọi lại API chi phí và ngân sách sau khi thêm thành công
    try {
      await Promise.all([
        fetchExpenses(), // Refresh danh sách chi phí
        fetchBudget(),   // Refresh ngân sách (có thể đã thay đổi)
      ])
      
      // ✅ Tự động reload trang với tab expenses để hiển thị chi phí đã thêm
      const currentUrl = window.location.href.split('?')[0]
      window.location.href = `${currentUrl}?tab=expenses`
    } catch (error) {
      console.error("Lỗi khi refresh dữ liệu sau khi thêm chi phí:", error)
      // Vẫn reload với tab expenses ngay cả khi có lỗi
      const currentUrl = window.location.href.split('?')[0]
      window.location.href = `${currentUrl}?tab=expenses`
    }
  }

  const handleUpdateBudget = async () => {
    try {
      const token = Cookies.get("token")
      console.log("Token từ cookie:", token)

      if (!token || token === "null" || token === "undefined") {
        console.warn("Không có token → chuyển về /login")
        router.replace("/login")
        return
      }

      if (!tripId) {
        toast({
          title: "Thiếu ID chuyến đi",
          description: "Không tìm thấy ID chuyến đi",
          variant: "destructive",
        })
        return
      }

      const soTien = Number.parseFloat(tempBudget.replace(/[^\d]/g, ""))
      if (isNaN(soTien) || soTien <= 0) {
        toast({
          title: "Số tiền không hợp lệ",
          description: "Vui lòng nhập số tiền lớn hơn 0",
          variant: "destructive",
        })
        return
      }

      setIsUpdatingBudget(true)
      const res = await axios.post(
        `https://travel-planner-imdw.onrender.com/api/chi-phi/tong-ngan-sach/${tripId}`,
        {
          so_tien: soTien,
          mode: "add", // Cộng dồn theo yêu cầu
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      )

      const data = res?.data
      toast({
        title: "Thành công",
        description: data?.message || "Bổ sung ngân sách thành công",
      })

      // Update local state with new total budget
      if (data?.tong_ngan_sach_moi !== undefined) {
        setTotalBudget(data.tong_ngan_sach_moi)
      }

      // Refresh budget info
      await fetchBudget()

      setShowBudgetModal(false)
      setTempBudget("")
    } catch (error: any) {
      console.error("Lỗi khi cập nhật ngân sách:", error)
      if (error?.response?.status === 401 || error?.response?.status === 403) {
        router.replace("/login")
      } else {
        toast({
          title: "Cập nhật thất bại",
          description: error?.response?.data?.message || "Không thể cập nhật ngân sách",
          variant: "destructive",
        })
      }
    } finally {
      setIsUpdatingBudget(false)
    }
  }

  const stats = [
    {
      title: "Ngân sách tổng",
      value: isLoadingBudget ? "Đang tải..." : `${totalBudget.toLocaleString("vi-VN")} VNĐ`,
      icon: <Wallet className="h-5 w-5 text-blue-600" />,
      description: budgetInfo
        ? `${budgetInfo.so_nguoi} người • Tối thiểu: ${budgetInfo.muc_toi_thieu.toLocaleString("vi-VN")} VNĐ`
        : "Tổng tiền hiện có",
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
                    Số tiền bổ sung (VNĐ)
                  </Label>
                  <Input
                    id="budget"
                    type="text"
                    placeholder="Nhập số tiền muốn thêm (VNĐ)..."
                    value={tempBudget}
                    onChange={(e) => {
                      const value = e.target.value.replace(/[^\d]/g, "")
                      setTempBudget(value ? Number.parseInt(value).toLocaleString("vi-VN") + " VNĐ" : "")
                    }}
                    disabled={isUpdatingBudget}
                  />
                  <p className="text-xs text-muted-foreground">
                    Ngân sách hiện tại:{" "}
                    <span className="font-medium text-foreground">
                      {totalBudget.toLocaleString("vi-VN")} VNĐ
                    </span>
                    {budgetInfo && (
                      <>
                        <br />
                        Số người: {budgetInfo.so_nguoi} • Mức tối thiểu:{" "}
                        {budgetInfo.muc_toi_thieu.toLocaleString("vi-VN")} VNĐ
                        {budgetInfo.canh_bao && (
                          <span className="text-red-500 block mt-1">⚠️ {budgetInfo.thong_diep}</span>
                        )}
                      </>
                    )}
                  </p>
                </div>

                <div className="flex justify-end gap-2 pt-1">
                  <Button
                    variant="outline"
                    className="px-4 py-1.5 text-sm"
                    onClick={() => {
                      setShowBudgetModal(false)
                      setTempBudget("")
                    }}
                    disabled={isUpdatingBudget}
                  >
                    Hủy
                  </Button>
                  <Button
                    className="px-4 py-1.5 text-sm"
                    onClick={handleUpdateBudget}
                    disabled={isUpdatingBudget}
                  >
                    {isUpdatingBudget ? "Đang cập nhật..." : "Bổ sung ngân sách"}
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
        <TabsList className="inline-flex h-11 items-center justify-center rounded-full bg-muted p-1 text-muted-foreground mx-auto">
          <TabsTrigger
            value="list"
            className="inline-flex items-center justify-center whitespace-nowrap rounded-full px-6 py-2 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow"
          >
            <Receipt className="h-4 w-4 mr-2" />
            Danh sách
          </TabsTrigger>
          <TabsTrigger
            value="reports"
            className="inline-flex items-center justify-center whitespace-nowrap rounded-full px-6 py-2 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow"
          >
            <PieChart className="h-4 w-4 mr-2" />
            Báo cáo
          </TabsTrigger>
        </TabsList>

        <TabsContent value="list">
          <ExpensesList expenses={expenses} members={members.length > 0 ? members : mockMembers} onUpdateExpense={setExpenses} tripId={tripId} />
        </TabsContent>

        <TabsContent value="reports">
          <ExpenseReports expenses={expenses} members={members.length > 0 ? members : mockMembers} tripId={tripId} />
        </TabsContent>

        <TabsContent value="settlement">
          <ExpenseSettlement expenses={expenses} members={members.length > 0 ? members : mockMembers} />
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
        <AddExpenseModal
          onClose={() => setShowAddModal(false)}
          onSubmit={handleAddExpense}
          members={members.length > 0 ? members : mockMembers}
          tripId={tripId}
        />
      )}
    </div>
  )
}
