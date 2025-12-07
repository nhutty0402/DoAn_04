"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import axios from "axios"
import Cookies from "js-cookie"
import { DashboardHeader } from "@/components/dashboard/dashboard-header"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Loader2, Plane, DollarSign, MapPin, TrendingUp, Calendar, X } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || "https://travel-planner-imdw.onrender.com"

interface ThongKeData {
  so_chuyen_di: number
  tong_chi_phi: number
  tong_diem_den: number
  bieu_do_theo_thang: Array<{
    thang: string
    so_chuyen_di: number
    so_diem_den: number
    tong_chi_phi: number
  }>
  thong_ke_trang_thai: {
    [key: string]: number
  }
}

interface DiaDiem {
  dia_diem_id: number
  ten_dia_diem: string
  chuyen_di_id: number
  ten_chuyen_di: string
  tao_luc: string
}

interface ChiPhiTheoChuyenDi {
  chuyen_di_id: number
  ten_chuyen_di: string
  tong_chi_phi_da_dung: number
}

export default function StatisticsPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [thongKeData, setThongKeData] = useState<ThongKeData | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [showDiaDiemModal, setShowDiaDiemModal] = useState(false)
  const [diaDiemList, setDiaDiemList] = useState<DiaDiem[]>([])
  const [loadingDiaDiem, setLoadingDiaDiem] = useState(false)
  const [showChiPhiModal, setShowChiPhiModal] = useState(false)
  const [chiPhiTheoChuyenDi, setChiPhiTheoChuyenDi] = useState<ChiPhiTheoChuyenDi[]>([])
  const [loadingChiPhi, setLoadingChiPhi] = useState(false)

  useEffect(() => {
    fetchThongKe()
  }, [])

  const fetchThongKe = async () => {
    setLoading(true)
    setError(null)

    try {
      const token = Cookies.get("token")
      if (!token || token === "null" || token === "undefined") {
        toast({
          title: "Lỗi xác thực",
          description: "Vui lòng đăng nhập để xem thống kê",
          variant: "destructive",
        })
        router.replace("/login")
        return
      }

      const response = await axios.get(
        `${BACKEND_URL}/api/taikhoan/thong-ke/ca-nhan`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      )

      if (response.data?.data) {
        setThongKeData(response.data.data)
      } else {
        setError("Không có dữ liệu thống kê")
      }
    } catch (err: any) {
      console.error("Lỗi khi lấy thống kê:", err)
      if (err.response?.status === 401) {
        toast({
          title: "Lỗi xác thực",
          description: "Phiên đăng nhập đã hết hạn",
          variant: "destructive",
        })
        router.replace("/login")
      } else {
        setError(err.response?.data?.message || "Không thể tải dữ liệu thống kê")
        toast({
          title: "Lỗi",
          description: err.response?.data?.message || "Không thể tải dữ liệu thống kê",
          variant: "destructive",
        })
      }
    } finally {
      setLoading(false)
    }
  }

  // Format số tiền
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(amount)
  }

  // Format tháng (YYYY-MM -> MM/YYYY)
  const formatMonth = (month: string) => {
    const [year, monthNum] = month.split("-")
    return `${monthNum}/${year}`
  }

  // Hàm lấy danh sách điểm đến từ API
  const fetchDiaDiemList = async () => {
    setLoadingDiaDiem(true)
    try {
      const token = Cookies.get("token")
      if (!token || token === "null" || token === "undefined") {
        toast({
          title: "Lỗi xác thực",
          description: "Vui lòng đăng nhập để xem danh sách điểm đến",
          variant: "destructive",
        })
        router.replace("/login")
        return
      }

      const response = await axios.get(
        `${BACKEND_URL}/api/taikhoan/thong-ke/ca-nhan`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      )

      if (response.data?.data?.danh_sach_dia_diem) {
        setDiaDiemList(response.data.data.danh_sach_dia_diem)
        setShowDiaDiemModal(true)
      } else {
        toast({
          title: "Thông báo",
          description: "Không có dữ liệu điểm đến",
        })
      }
    } catch (err: any) {
      console.error("Lỗi khi lấy danh sách điểm đến:", err)
      toast({
        title: "Lỗi",
        description: err.response?.data?.message || "Không thể tải danh sách điểm đến",
        variant: "destructive",
      })
    } finally {
      setLoadingDiaDiem(false)
    }
  }

  // Format ngày tháng
  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString)
      return date.toLocaleDateString("vi-VN", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    } catch {
      return dateString
    }
  }

  // Hàm lấy danh sách chi phí theo chuyến đi từ API
  const fetchChiPhiTheoChuyenDi = async (e?: React.MouseEvent) => {
    e?.preventDefault()
    e?.stopPropagation()
    
    console.log("🔵 Click vào chi phí - bắt đầu fetch")
    setLoadingChiPhi(true)
    setShowChiPhiModal(true) // Mở modal ngay để hiển thị loading
    
    try {
      const token = Cookies.get("token")
      if (!token || token === "null" || token === "undefined") {
        toast({
          title: "Lỗi xác thực",
          description: "Vui lòng đăng nhập để xem danh sách chi phí",
          variant: "destructive",
        })
        router.replace("/login")
        return
      }

      console.log("🔵 Đang gọi API...")
      const response = await axios.get(
        `${BACKEND_URL}/api/taikhoan/thong-ke/ca-nhan`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      )

      console.log("🔵 API Response:", response.data)

      if (response.data?.data?.chi_phi_theo_chuyen_di) {
        console.log("🔵 Có dữ liệu chi phí:", response.data.data.chi_phi_theo_chuyen_di)
        setChiPhiTheoChuyenDi(response.data.data.chi_phi_theo_chuyen_di)
      } else {
        console.log("🔵 Không có dữ liệu chi_phi_theo_chuyen_di trong response")
        setChiPhiTheoChuyenDi([])
        toast({
          title: "Thông báo",
          description: "Không có dữ liệu chi phí",
        })
      }
    } catch (err: any) {
      console.error("❌ Lỗi khi lấy danh sách chi phí:", err)
      setChiPhiTheoChuyenDi([])
      toast({
        title: "Lỗi",
        description: err.response?.data?.message || "Không thể tải danh sách chi phí",
        variant: "destructive",
      })
    } finally {
      setLoadingChiPhi(false)
    }
  }

  // Lấy tên trạng thái tiếng Việt
  const getTrangThaiName = (trangThai: string) => {
    const names: { [key: string]: string } = {
      cho_duyet: "Chờ duyệt",
      da_duyet: "Đã duyệt",
      dang_thuc_hien: "Đang thực hiện",
      da_hoan_thanh: "Đã hoàn thành",
      hoan_thanh: "Hoàn thành",
      da_huy: "Đã hủy",
      sap_toi: "Sắp tới",
    }
    return names[trangThai] || trangThai
  }

  // Màu sắc cho trạng thái
  const getTrangThaiColor = (trangThai: string) => {
    const colors: { [key: string]: string } = {
      cho_duyet: "bg-yellow-100 text-yellow-800",
      da_duyet: "bg-blue-100 text-blue-800",
      dang_thuc_hien: "bg-green-100 text-green-800",
      da_hoan_thanh: "bg-purple-100 text-purple-800",
      da_huy: "bg-red-100 text-red-800",
    }
    return colors[trangThai] || "bg-gray-100 text-gray-800"
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <DashboardHeader />
        <main className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
              <p className="text-muted-foreground">Đang tải thống kê...</p>
            </div>
          </div>
        </main>
      </div>
    )
  }

  if (error && !thongKeData) {
    return (
      <div className="min-h-screen bg-background">
        <DashboardHeader />
        <main className="container mx-auto px-4 py-8">
          <Card className="border-destructive">
            <CardContent className="p-6">
              <p className="text-destructive text-center">{error}</p>
            </CardContent>
          </Card>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader />
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground font-[family-name:var(--font-space-grotesk)]">
            Thống Kê Cá Nhân
          </h1>
          <p className="text-muted-foreground mt-2 font-[family-name:var(--font-dm-sans)]">
            Xem tổng quan về các hoạt động du lịch của bạn
          </p>
        </div>

        {thongKeData && (
          <div className="space-y-6">
            {/* Tổng quan số liệu */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Tổng số chuyến đi</CardTitle>
                  <Plane className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{thongKeData.so_chuyen_di}</div>
                  <p className="text-xs text-muted-foreground mt-1">Chuyến đi đã tham gia</p>
                </CardContent>
              </Card>

              <Card 
                className="cursor-pointer hover:bg-muted/50 transition-colors"
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  fetchChiPhiTheoChuyenDi(e)
                }}
                title="Click để xem chi tiết chi phí theo chuyến đi"
              >
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Tổng chi phí</CardTitle>
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{formatCurrency(thongKeData.tong_chi_phi)}</div>
                  <p className="text-xs text-muted-foreground mt-1">Tổng số tiền đã chi</p>
                  <p className="text-xs text-primary mt-2 font-medium">Click để xem chi tiết</p>
                </CardContent>
              </Card>

              <Card 
                className="cursor-pointer hover:bg-muted/50 transition-colors"
                onClick={fetchDiaDiemList}
              >
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Tổng điểm đến</CardTitle>
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{thongKeData.tong_diem_den}</div>
                  <p className="text-xs text-muted-foreground mt-1">Điểm đến đã đến</p>
                  <p className="text-xs text-primary mt-2 font-medium">Click để xem chi tiết</p>
                </CardContent>
              </Card>
            </div>

            {/* Thống kê theo trạng thái */}
            {thongKeData.thong_ke_trang_thai && Object.keys(thongKeData.thong_ke_trang_thai).length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="h-5 w-5" />
                    Thống kê theo trạng thái
                  </CardTitle>
                  <CardDescription>Phân bổ chuyến đi theo các trạng thái</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                    {Object.entries(thongKeData.thong_ke_trang_thai).map(([trangThai, soLuong]) => (
                      <div key={trangThai} className="text-center p-4 border rounded-lg">
                        <Badge className={`${getTrangThaiColor(trangThai)} mb-2`}>
                          {getTrangThaiName(trangThai)}
                        </Badge>
                        <div className="text-2xl font-bold mt-2">{soLuong}</div>
                        <p className="text-xs text-muted-foreground">chuyến đi</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Biểu đồ hoạt động theo tháng */}
            {thongKeData.bieu_do_theo_thang && thongKeData.bieu_do_theo_thang.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5" />
                    Hoạt động theo tháng (12 tháng gần nhất)
                  </CardTitle>
                  <CardDescription>Biểu đồ thể hiện hoạt động du lịch của bạn theo thời gian</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {thongKeData.bieu_do_theo_thang.map((item, index) => {
                      // Tính phần trăm cho mỗi chỉ số (dựa trên giá trị lớn nhất)
                      const maxChuyenDi = Math.max(...thongKeData.bieu_do_theo_thang.map(i => i.so_chuyen_di), 1)
                      const maxDiemDen = Math.max(...thongKeData.bieu_do_theo_thang.map(i => i.so_diem_den), 1)
                      const maxChiPhi = Math.max(...thongKeData.bieu_do_theo_thang.map(i => i.tong_chi_phi), 1)

                      const chuyenDiPercent = (item.so_chuyen_di / maxChuyenDi) * 100
                      const diemDenPercent = (item.so_diem_den / maxDiemDen) * 100
                      const chiPhiPercent = (item.tong_chi_phi / maxChiPhi) * 100

                      return (
                        <div key={index} className="border rounded-lg p-4">
                          <div className="flex items-center justify-between mb-3">
                            <h3 className="font-semibold">{formatMonth(item.thang)}</h3>
                          </div>
                          <div className="space-y-3">
                            {/* Chuyến đi */}
                            <div>
                              <div className="flex items-center justify-between mb-1">
                                <span className="text-sm text-muted-foreground flex items-center gap-2">
                                  <Plane className="h-3 w-3" />
                                  Chuyến đi
                                </span>
                                <span className="text-sm font-semibold">{item.so_chuyen_di}</span>
                              </div>
                              <div className="w-full bg-muted rounded-full h-2">
                                <div
                                  className="bg-blue-500 h-2 rounded-full transition-all"
                                  style={{ width: `${chuyenDiPercent}%` }}
                                />
                              </div>
                            </div>

                            {/* Điểm đến */}
                            <div>
                              <div className="flex items-center justify-between mb-1">
                                <span className="text-sm text-muted-foreground flex items-center gap-2">
                                  <MapPin className="h-3 w-3" />
                                  Điểm đến
                                </span>
                                <span className="text-sm font-semibold">{item.so_diem_den}</span>
                              </div>
                              <div className="w-full bg-muted rounded-full h-2">
                                <div
                                  className="bg-green-500 h-2 rounded-full transition-all"
                                  style={{ width: `${diemDenPercent}%` }}
                                />
                              </div>
                            </div>

                            {/* Chi phí */}
                            <div 
                              className="cursor-pointer hover:bg-muted/50 p-2 rounded-lg transition-colors"
                              onClick={(e) => {
                                e.preventDefault()
                                e.stopPropagation()
                                fetchChiPhiTheoChuyenDi(e)
                              }}
                              title="Click để xem chi tiết chi phí theo chuyến đi"
                            >
                              <div className="flex items-center justify-between mb-1">
                                <span className="text-sm text-muted-foreground flex items-center gap-2">
                                  <DollarSign className="h-3 w-3" />
                                  Chi phí
                                </span>
                                <span className="text-sm font-semibold">{formatCurrency(item.tong_chi_phi)}</span>
                              </div>
                              <div className="w-full bg-muted rounded-full h-2">
                                <div
                                  className="bg-orange-500 h-2 rounded-full transition-all"
                                  style={{ width: `${chiPhiPercent}%` }}
                                />
                              </div>
                              <p className="text-xs text-primary mt-1 font-medium">Click để xem chi tiết</p>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </CardContent>
              </Card>
            )}           
          </div>
        )}

        {/* Dialog hiển thị danh sách điểm đến */}
        <Dialog open={showDiaDiemModal} onOpenChange={setShowDiaDiemModal}>
          <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Danh sách điểm đến đã đến ({diaDiemList.length})
              </DialogTitle>
              <DialogDescription>
                Các điểm đến mà bạn đã tham quan trong các chuyến đi
              </DialogDescription>
            </DialogHeader>
            
            {loadingDiaDiem ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
                <span className="ml-2 text-muted-foreground">Đang tải danh sách...</span>
              </div>
            ) : diaDiemList.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <MapPin className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Chưa có điểm đến nào</p>
              </div>
            ) : (
              <div className="space-y-3 mt-4">
                {diaDiemList.map((diaDiem) => (
                  <Card key={diaDiem.dia_diem_id} className="hover:bg-muted/50 transition-colors">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <MapPin className="h-4 w-4 text-primary" />
                            <h3 className="font-semibold text-lg">{diaDiem.ten_dia_diem}</h3>
                          </div>
                          <div className="space-y-1 text-sm text-muted-foreground">
                            <p className="flex items-center gap-2">
                              <Plane className="h-3 w-3" />
                              <span>Chuyến đi: <span className="font-medium text-foreground">{diaDiem.ten_chuyen_di}</span></span>
                            </p>
                            <p className="flex items-center gap-2">
                              <Calendar className="h-3 w-3" />
                              <span>Tạo lúc: <span className="font-medium text-foreground">{formatDate(diaDiem.tao_luc)}</span></span>
                            </p>
                          </div>
                        </div>
                        {/* <Badge variant="secondary" className="ml-auto">
                          ID: {diaDiem.dia_diem_id}
                        </Badge> */}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Dialog hiển thị danh sách chi phí theo chuyến đi */}
        <Dialog open={showChiPhiModal} onOpenChange={setShowChiPhiModal}>
          <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Chi phí theo chuyến đi ({chiPhiTheoChuyenDi.length})
              </DialogTitle>
              <DialogDescription>
                Tổng chi phí đã sử dụng trong từng chuyến đi của bạn
              </DialogDescription>
            </DialogHeader>
            
            {loadingChiPhi ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
                <span className="ml-2 text-muted-foreground">Đang tải danh sách...</span>
              </div>
            ) : chiPhiTheoChuyenDi.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <DollarSign className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Chưa có dữ liệu chi phí</p>
              </div>
            ) : (
              <div className="space-y-3 mt-4">
                {chiPhiTheoChuyenDi.map((chiPhi) => (
                  <Card key={chiPhi.chuyen_di_id} className="hover:bg-muted/50 transition-colors">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <Plane className="h-4 w-4 text-primary" />
                            <h3 className="font-semibold text-lg">{chiPhi.ten_chuyen_di}</h3>
                          </div>
                          <div className="flex items-center gap-2 mt-3">
                            <DollarSign className="h-4 w-4 text-green-600" />
                            <span className="text-sm text-muted-foreground">Tổng chi phí đã dùng:</span>
                            <span className="text-lg font-bold text-green-600">
                              {formatCurrency(chiPhi.tong_chi_phi_da_dung)}
                            </span>
                          </div>
                        </div>
                        {/* <Badge variant="secondary" className="ml-auto">
                          ID: {chiPhi.chuyen_di_id}
                        </Badge> */}
                      </div>
                    </CardContent>
                  </Card>
                ))}
                {/* Tổng chi phí */}
                {chiPhiTheoChuyenDi.length > 0 && (
                  <Card className="border-primary/50 bg-primary/5">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-lg">Tổng cộng:</span>
                        <span className="text-2xl font-bold text-primary">
                          {formatCurrency(
                            chiPhiTheoChuyenDi.reduce((sum, cp) => sum + cp.tong_chi_phi_da_dung, 0)
                          )}
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            )}
          </DialogContent>
        </Dialog>
      </main>
    </div>
  )
}

