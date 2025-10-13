"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Plus, Search, Filter, MapPin, Calendar, Users, MoreVertical } from "lucide-react"
import { CreateTripModal } from "@/components/trips/create-trip-modal"
import { EditTripModal } from "@/components/trips/edit-trip-modal"
import { DeleteTripModal } from "@/components/trips/delete-trip-modal"
import { DashboardHeader } from "@/components/dashboard/dashboard-header"
import { motion } from "framer-motion"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"

// Mock data for trips
const mockTrips = [
  {
    id: "1",
    tenChuyenDi: "Du lịch Đà Nẵng",
    ngayBatDau: "2024-03-15",
    ngayKetThuc: "2024-03-20",
    soThanhVien: 4,
    tienDo: 75,
    trangThai: "planning",
    moTa: "Khám phá thành phố biển xinh đẹp",
  },
  {
    id: "2",
    tenChuyenDi: "Phượt Sapa",
    ngayBatDau: "2024-04-01",
    ngayKetThuc: "2024-04-05",
    soThanhVien: 6,
    tienDo: 30,
    trangThai: "draft",
    moTa: "Chinh phục đỉnh Fansipan",
  },
  {
    id: "3",
    tenChuyenDi: "Hội An - Huế",
    ngayBatDau: "2024-02-10",
    ngayKetThuc: "2024-02-15",
    soThanhVien: 2,
    tienDo: 100,
    trangThai: "completed",
    moTa: "Khám phá di sản văn hóa",
  },
]

export default function DashboardPage() {
  const router = useRouter()
  const [trips, setTrips] = useState(mockTrips)
  const [searchTerm, setSearchTerm] = useState("")
  const [filterStatus, setFilterStatus] = useState("all")
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [editingTrip, setEditingTrip] = useState<any>(null)
  const [deletingTrip, setDeletingTrip] = useState<any>(null)

  const filteredTrips = trips.filter((trip) => {
    const matchesSearch = trip.tenChuyenDi.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesFilter = filterStatus === "all" || trip.trangThai === filterStatus
    return matchesSearch && matchesFilter
  })

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      draft: { label: "Nháp", variant: "secondary" as const },
      planning: { label: "Đang lập kế hoạch", variant: "secondary" as const },
      completed: { label: "Hoàn thành", variant: "outline" as const },
    }
    return statusConfig[status as keyof typeof statusConfig] || statusConfig.draft
  }

  const getProgressColor = (progress: number) => {
    if (progress >= 80) return "bg-green-500"
    if (progress >= 50) return "bg-primary"
    return "bg-yellow-500"
  }

  // const handleCreateTrip = (tripData: any) => {
  //   const newTrip = {
  //     id: Date.now().toString(),
  //     ...tripData,
  //     soThanhVien: 1,
  //     tienDo: 0,
  //     trangThai: "draft",
  //   }
  //   setTrips([newTrip, ...trips])
  //   setShowCreateModal(false)
  // }
  const handleCreateTrip = async (tripData: any) => {
  try {
    const token = localStorage.getItem("token")

    if (!token) {
      alert("Vui lòng đăng nhập để tạo chuyến đi!")
      return
    }

    const response = await fetch("https://travel-planner-imdw.onrender.com/api/chuyendi", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`,
      },
      body: JSON.stringify({
        ten_chuyen_di: tripData.tenChuyenDi,
        mo_ta: tripData.moTa,
        dia_diem_xuat_phat: tripData.diaDiemXuatPhat,
        ngay_bat_dau: tripData.ngayBatDau,
        ngay_ket_thuc: tripData.ngayKetThuc,
        tien_te: tripData.tienTe,
        trang_thai: tripData.trangThai || "draft",
      }),
    })

    // 🔍 Ghi log để xem API trả gì
    console.log("Response status:", response.status)
    const text = await response.text()
    console.log("Response text:", text)

    if (!response.ok) {
      throw new Error(`API Error ${response.status}: ${text}`)
    }

    const newTrip = JSON.parse(text)
    setTrips([newTrip, ...trips])
    setShowCreateModal(false)
  } catch (error) {
    console.error("Lỗi khi tạo chuyến đi:", error)
    alert("Tạo chuyến đi thất bại!")
  }
}


  const handleEditTrip = (tripData: any) => {
    setTrips(trips.map((trip) => (trip.id === editingTrip.id ? { ...trip, ...tripData } : trip)))
    setEditingTrip(null)
  }

  const handleDeleteTrip = () => {
    setTrips(trips.filter((trip) => trip.id !== deletingTrip.id))
    setDeletingTrip(null)
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
            <h1 className="text-3xl font-bold text-foreground font-[family-name:var(--font-space-grotesk)]">
              Chuyến Đi Của Tôi
            </h1>
            <p className="text-muted-foreground mt-2 font-[family-name:var(--font-dm-sans)]">
              Quản lý và theo dõi tất cả các chuyến đi của bạn
            </p>
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
              className="pl-10"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-3 py-2 border border-border rounded-md bg-background text-foreground"
            >
              <option value="all">Tất cả</option>
              <option value="draft">Nháp</option>
              <option value="planning">Đang lập kế hoạch</option>
              <option value="completed">Hoàn thành</option>
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
                          className="opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => setEditingTrip(trip)}>Chỉnh sửa</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setDeletingTrip(trip)} className="text-destructive">
                          Xóa
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                  <Badge {...getStatusBadge(trip.trangThai)} className="w-fit mt-2">
                    {getStatusBadge(trip.trangThai).label}
                  </Badge>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      <span>{new Date(trip.ngayBatDau).toLocaleDateString("vi-VN")}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Users className="h-4 w-4" />
                      <span>{trip.soThanhVien} người</span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Tiến độ</span>
                      <span className="font-medium">{trip.tienDo}%</span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2">
                      <div
                        className={`h-2 rounded-full transition-all duration-300 ${getProgressColor(trip.tienDo)}`}
                        style={{ width: `${trip.tienDo}%` }}
                      />
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
              {searchTerm || filterStatus !== "all"
                ? "Thử thay đổi từ khóa tìm kiếm hoặc bộ lọc"
                : "Bắt đầu tạo chuyến đi đầu tiên của bạn"}
            </p>
            {!searchTerm && filterStatus === "all" && (
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
