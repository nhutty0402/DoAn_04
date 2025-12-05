"use client"

import { useState, useEffect, useCallback } from "react"
import axios from "axios"
import Cookies from "js-cookie"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Plus, Search, Filter, MapPin, Calendar, MoreVertical } from "lucide-react"
import { CreateTripModal } from "@/components/trips/create-trip-modal"
import { EditTripModal } from "@/components/trips/edit-trip-modal"
import { DeleteTripModal } from "@/components/trips/delete-trip-modal"
import { DashboardHeader } from "@/components/dashboard/dashboard-header"
import { motion } from "framer-motion"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"

// Dữ liệu sẽ được tải từ API

export default function DashboardPage() {
  const router = useRouter()
  const [trips, setTrips] = useState<any[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [filterStatus, setFilterStatus] = useState("all")
  const [filterPrivacy, setFilterPrivacy] = useState("all")
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [editingTrip, setEditingTrip] = useState<any>(null)
  const [deletingTrip, setDeletingTrip] = useState<any>(null)

  // Helper: xác định trạng thái theo ngày kết thúc
  const deriveStatus = (ngayBatDau: string | undefined, ngayKetThuc: string | undefined, fallback: string) => {
    if (ngayKetThuc) {
      const today = new Date()
      const end = new Date(ngayKetThuc)
      // So sánh theo ngày (bỏ giờ)
      today.setHours(0, 0, 0, 0)
      end.setHours(0, 0, 0, 0)
      if (today.getTime() > end.getTime()) return "completed"
      if (today.getTime() === end.getTime()) return "upcoming"
    }
    return fallback || "planning"
  }

  const fetchTrips = useCallback(async () => {
    try {
      const token = Cookies.get("token")
      if (!token || token === "null" || token === "undefined") {
        return router.replace("/login")
      }

      const res = await axios.get("https://travel-planner-imdw.onrender.com/api/chuyen-di", {
        headers: {
          Authorization: `Bearer ${token}`,
          "Cache-Control": "no-cache",
          Pragma: "no-cache",
        },
        params: { _t: Date.now() },
      })

      const data = res?.data
      const mapped = (data?.danh_sach || []).map((item: any) => ({
        id: item?.chuyen_di_id?.toString() || "",
        tenChuyenDi: item?.ten_chuyen_di || "",
        moTa: item?.mo_ta || "",
        ngayBatDau: item?.ngay_bat_dau || "",
        ngayKetThuc: item?.ngay_ket_thuc || "",
        trangThai: deriveStatus(item?.ngay_bat_dau, item?.ngay_ket_thuc, "planning"),
        congKhai: typeof item?.cong_khai === 'number' ? item.cong_khai : Number(item?.cong_khai ?? 0),
        _api: item,
      }))
      setTrips(mapped)
    } catch (error: any) {
      if (axios.isAxiosError(error) && error.response?.status === 401) {
        return router.replace("/login")
      }
      console.error("Lỗi khi tải danh sách chuyến đi:", error)
    }
  }, [router])

  useEffect(() => {
    fetchTrips()
  }, [fetchTrips])

  const filteredTrips = trips.filter((trip) => {
    const matchesSearch = trip.tenChuyenDi.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatusFilter = filterStatus === "all" || trip.trangThai === filterStatus
    const matchesPrivacyFilter = 
      filterPrivacy === "all" || 
      (filterPrivacy === "public" && trip.congKhai === 1) ||
      (filterPrivacy === "private" && trip.congKhai === 0)
    return matchesSearch && matchesStatusFilter && matchesPrivacyFilter
  })

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      all:{label:"Tất cả", variant: "secondary" as const },
      planning: { label: "Đang thực hiện", variant: "secondary" as const },
      upcoming: { label: "Sắp tới", variant: "secondary" as const },
      completed: { label: "Hoàn thành", variant: "outline" as const },
      
    }
    
    return statusConfig[status as keyof typeof statusConfig] || statusConfig.planning
  }

  const handleCreateTrip = (created: any) => {
    try {
      if (created) {
        // Map từ schema API đã chuẩn hóa → schema UI của dashboard
        const mapped = {
          // Các trường UI đang dùng (camelCase) để tránh lỗi truy cập thuộc tính
          id: created?.chuyen_di_id || created?.id || Date.now().toString(),
          tenChuyenDi: created?.ten_chuyen_di || created?.tenChuyenDi || "",
          moTa: created?.mo_ta || created?.moTa || "",
          ngayBatDau: created?.ngay_bat_dau || created?.ngayBatDau || "",
          ngayKetThuc: created?.ngay_ket_thuc || created?.ngayKetThuc || "",
          trangThai: deriveStatus(created?.ngay_bat_dau || created?.ngayBatDau, created?.ngay_ket_thuc || created?.ngayKetThuc, created?.trang_thai || created?.trangThai || "planning"),
          congKhai: typeof created?.cong_khai === 'number' ? created.cong_khai : Number(created?.cong_khai ?? 0),
          _api: {
            chuyen_di_id: created?.chuyen_di_id || created?.id || null,
            ten_chuyen_di: created?.ten_chuyen_di || created?.tenChuyenDi || "",
            mo_ta: created?.mo_ta || created?.moTa || "",
            dia_diem_xuat_phat: created?.dia_diem_xuat_phat || created?.diaDiemXuatPhat || "",
            ngay_bat_dau: created?.ngay_bat_dau || created?.ngayBatDau || "",
            ngay_ket_thuc: created?.ngay_ket_thuc || created?.ngayKetThuc || "",
            chu_so_huu_id: created?.chu_so_huu_id || created?.chuSoHuuId || "",
            tien_te: created?.tien_te || created?.tienTe || "VND",
            trang_thai: deriveStatus(created?.ngay_bat_dau || created?.ngayBatDau, created?.ngay_ket_thuc || created?.ngayKetThuc, created?.trang_thai || created?.trangThai || "planning"),
            tao_luc: created?.tao_luc || created?.taoLuc || new Date().toISOString(),
            cong_khai: typeof created?.cong_khai === 'number' ? created.cong_khai : Number(created?.cong_khai ?? 0),
          },
        }
        // Cập nhật nhanh UI rồi gọi reload từ server để đồng bộ
        setTrips([mapped as any, ...trips])
        fetchTrips()
      }
    } finally {
      setShowCreateModal(false)
    }
  }


  const handleEditTrip = async (tripData: any) => {
    try {
      const token = Cookies.get("token")
      if (!token || token === "null" || token === "undefined") {
        return router.replace("/login")
      }

      const current = editingTrip
      const tripId = current?._api?.chuyen_di_id || current?.id
      if (!tripId) {
        throw new Error("Không xác định được ID chuyến đi để cập nhật")
      }

      // Chấp nhận cả camelCase và snake_case từ modal
      const tenChuyenDi = tripData?.tenChuyenDi ?? tripData?.ten_chuyen_di ?? current?.tenChuyenDi ?? ""
      const moTa = tripData?.moTa ?? tripData?.mo_ta ?? current?.moTa ?? ""
      const ngayBatDau = tripData?.ngayBatDau ?? tripData?.ngay_bat_dau ?? current?.ngayBatDau ?? ""
      const ngayKetThuc = tripData?.ngayKetThuc ?? tripData?.ngay_ket_thuc ?? current?.ngayKetThuc ?? ""
      const diaDiemXuatPhat = tripData?.diaDiemXuatPhat ?? tripData?.dia_diem_xuat_phat ?? current?._api?.dia_diem_xuat_phat ?? ""
      const congKhaiVal = ((): number => {
        if (typeof tripData?.congKhai === 'number') return tripData.congKhai
        if (typeof tripData?.cong_khai !== 'undefined') return Number(tripData.cong_khai)
        if (typeof current?.congKhai === 'number') return current.congKhai
        if (typeof current?._api?.cong_khai !== 'undefined') return Number(current._api.cong_khai)
        return 0
      })()

      const payload = {
        chuyen_di_id: tripId,
        ten_chuyen_di: tenChuyenDi,
        mo_ta: moTa,
        dia_diem_xuat_phat: diaDiemXuatPhat,
        ngay_bat_dau: ngayBatDau,
        ngay_ket_thuc: ngayKetThuc,
        chu_so_huu_id: current?._api?.chu_so_huu_id ?? "",
        tien_te: current?._api?.tien_te ?? "VND",
        trang_thai: current?._api?.trang_thai ?? current?.trangThai ?? "planning",
        tao_luc: current?._api?.tao_luc ?? new Date().toISOString(),
        cong_khai: congKhaiVal,
      }

      await axios.put(`https://travel-planner-imdw.onrender.com/api/chuyen-di/${tripId}`,
        payload,
        { headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" }, params: { _t: Date.now() } }
      )

      // Cập nhật UI lạc quan
      const updatedUi = {
        ...current,
        tenChuyenDi: tenChuyenDi,
        moTa: moTa,
        ngayBatDau: ngayBatDau,
        ngayKetThuc: ngayKetThuc,
        trangThai: deriveStatus(payload.ngay_bat_dau, payload.ngay_ket_thuc, payload.trang_thai),
        congKhai: congKhaiVal,
        _api: { ...(current?._api || {}), ...payload },
      }

      setTrips(trips.map((t) => (t.id === current.id ? updatedUi : t)))
      setEditingTrip(null)
      fetchTrips()
    } catch (error: any) {
      if (axios.isAxiosError(error) && error.response?.status === 401) {
        return router.replace("/login")
      }
      console.error("Lỗi khi cập nhật chuyến đi:", error)
      setEditingTrip(null)
    }
  }

  const handleDeleteTrip = async () => {
    try {
      const token = Cookies.get("token")
      if (!token || token === "null" || token === "undefined") {
        return router.replace("/login")
      }

      const tripId = deletingTrip?.id || deletingTrip?._api?.chuyen_di_id
      if (!tripId) {
        console.error("Không xác định được ID chuyến đi để xóa")
      } else {
        await axios.delete(`https://travel-planner-imdw.onrender.com/api/chuyen-di/${tripId}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
          params: { _t: Date.now() },
        })
      }

      // Cập nhật UI lạc quan và refetch để đồng bộ
      setTrips(trips.filter((trip) => trip.id !== tripId?.toString()))
      setDeletingTrip(null)
      fetchTrips()
    } catch (error: any) {
      if (axios.isAxiosError(error) && error.response?.status === 401) {
        return router.replace("/login")
      }
      console.error("Lỗi khi xóa chuyến đi:", error)
      setDeletingTrip(null)
    }
  }

  const handleViewTrip = (tripId: string) => {
    router.push(`/trip/${tripId}`)
  }

  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader />

      <main className="container mx-auto px-4 py-8">
        {/* Page Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-foreground font-[family-name:var(--font-space-grotesk)]">
  Chuyến Đi Của Tôi
</h1>

            {/* <p className="text-muted-foreground mt-2 font-[family-name:var(--font-dm-sans)]">
              Quản lý và theo dõi tất cả các chuyến đi của bạn
            </p> */}
          </div>
          <Button onClick={() => setShowCreateModal(true)} className="bg-primary hover:bg-primary/90">
            <Plus className="h-4 w-4 mr-2" />
            Tạo Chuyến Đi
          </Button>
        </div>

        {/* Search and Filter */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
             placeholder="Tìm kiếm chuyến đi..."
             value={searchTerm}
             onChange={(e) => setSearchTerm(e.target.value)}
             className="pl-10 bg-white/80 border border-gray-300 focus:border-blue-300 focus:ring-1 focus:ring-blue-200 shadow-sm rounded-md transition"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md bg-white text-foreground 
                         focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400
                         hover:border-gray-400 transition-all duration-200 shadow-sm
                         cursor-pointer"
            >
              <option value="all">Tất cả</option>
              <option value="planning">Đang thực hiện</option>
              {/* <option value="upcoming">Sắp tới</option> */}
              <option value="completed">Hoàn thành</option>
            </select>
          </div>
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <select
              value={filterPrivacy}
              onChange={(e) => setFilterPrivacy(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md bg-white text-foreground 
                         focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400
                         hover:border-gray-400 transition-all duration-200 shadow-sm
                         cursor-pointer"
            >
              <option value="all">Tất cả</option>
              <option value="public">Công khai</option>
              <option value="private">Riêng tư</option>
            </select>
          </div>
        </div>

        {/* Trips Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTrips.map((trip, index) => (
            <motion.div
              key={trip.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
            >
              <Card className="h-full hover:shadow-lg transition-all duration-300 border-border/50 group">
                <CardHeader className="relative">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="font-[family-name:var(--font-space-grotesk)] text-lg">
                        {trip.tenChuyenDi}
                      </CardTitle>
                      <CardDescription className="font-[family-name:var(--font-dm-sans)] mt-1">
                        {trip.moTa}
                      </CardDescription>
                    </div>
                    <DropdownMenu>
  <DropdownMenuTrigger asChild>
    <Button
      variant="ghost"
      size="icon"
      className="opacity-80 hover:opacity-100 transition-opacity hover:bg-accent rounded-full"
    >
      <MoreVertical className="h-4 w-4 text-muted-foreground hover:text-foreground transition-colors" />
    </Button>
  </DropdownMenuTrigger>

  <DropdownMenuContent align="end" className="w-40">
    <DropdownMenuItem
      onClick={() => setEditingTrip(trip)}
      className="flex items-center gap-2 hover:bg-accent"
    >
      ✏️ <span>Chỉnh sửa</span>
    </DropdownMenuItem>

    <DropdownMenuItem
      onClick={() => setDeletingTrip(trip)}
      className="text-destructive flex items-center gap-2 hover:bg-destructive/10"
    >
      🗑️ <span>Xóa</span>
    </DropdownMenuItem>
  </DropdownMenuContent>
</DropdownMenu>

                  </div>
                  <div className="flex items-center gap-2 mt-2">
  {/* 🟩 Trạng thái chuyến đi */}
  <Badge
    {...getStatusBadge(trip.trangThai)}
    className="w-fit px-3 py-1 text-sm rounded-full shadow-sm"
  >
    {getStatusBadge(trip.trangThai).label}
  </Badge>

  {/* 🟦 Công khai / Riêng tư */}
  {typeof trip.congKhai !== "undefined" && (
    <Badge
      variant="outline"
      className={`w-fit px-3 py-1 text-sm rounded-full shadow-sm ${
        trip.congKhai === 1
          ? "bg-blue-50 text-blue-600 border-blue-400"
          : "bg-gray-50 text-gray-600 border-gray-300"
      }`}
    >
      {trip.congKhai === 1 ? "Công khai" : "Riêng tư"}
    </Badge>
  )}
</div>

                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      <span>
                        {trip.ngayBatDau ? new Date(trip.ngayBatDau).toLocaleDateString("vi-VN") : "—"}
                        {" "}-{" "}
                        {trip.ngayKetThuc ? new Date(trip.ngayKetThuc).toLocaleDateString("vi-VN") : "—"}
                      </span>
                    </div>
                  </div>

                  <Button
                    variant="outline"
                    className="w-full mt-4 bg-transparent"
                    onClick={() => handleViewTrip(trip.id)}
                  >
                    <MapPin className="h-4 w-4 mr-2" />
                    Xem Chi Tiết
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {filteredTrips.length === 0 && (
          <div className="text-center py-12">
            <MapPin className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">Không tìm thấy chuyến đi</h3>
            <p className="text-muted-foreground mb-4">
              {searchTerm || filterStatus !== "all" || filterPrivacy !== "all"
                ? "Thử thay đổi từ khóa tìm kiếm hoặc bộ lọc"
                : "Bắt đầu tạo chuyến đi đầu tiên của bạn"}
            </p>
            {!searchTerm && filterStatus === "all" && filterPrivacy === "all" && (
              <Button onClick={() => setShowCreateModal(true)} className="bg-primary hover:bg-primary/90">
                <Plus className="h-4 w-4 mr-2" />
                Tạo Chuyến Đi Đầu Tiên
              </Button>
            )}
          </div>
        )}
      </main>

      {/* Modals */}
      {showCreateModal && <CreateTripModal onClose={() => setShowCreateModal(false)} onSubmit={handleCreateTrip} />}

      {editingTrip && (
        <EditTripModal trip={editingTrip} onClose={() => setEditingTrip(null)} onSubmit={handleEditTrip} />
      )}

      {deletingTrip && (
        <DeleteTripModal trip={deletingTrip} onClose={() => setDeletingTrip(null)} onConfirm={handleDeleteTrip} />
      )}
    </div>
  )
}
