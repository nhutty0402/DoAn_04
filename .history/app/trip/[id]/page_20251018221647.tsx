"use client"

import { useEffect, useState } from "react"
import axios from "axios"
import Cookies from "js-cookie"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Users, Calendar, MapPin, DollarSign, MessageCircle, Settings } from "lucide-react"
import { DashboardHeader } from "@/components/dashboard/dashboard-header"
import { ItineraryTab } from "@/components/trip/itinerary-tab"
import { MembersTab } from "@/components/trip/members-tab"
import { ExpensesTab } from "@/components/trip/expenses-tab"
import { ChatTab } from "@/components/trip/chat-tab"
import { OverviewTab } from "@/components/trip/overview-tab"
import { MapsTab } from "@/components/trip/maps-tab" // Import MapsTab component
import { SettingsTab } from "@/components/trip/settings-tab" // Import SettingsTab component
import { useRouter } from "next/navigation"

// Mock trip data (fallback)
const mockTrip = {
  id: "1",
  tenChuyenDi: "Du lịch Đà Nẵng",
  ngayBatDau: "2024-03-15",
  ngayKetThuc: "2024-03-20",
  soThanhVien: 4,
  tienDo: 75,
  trangThai: "planning",
  moTa: "Khám phá thành phố biển xinh đẹp",
  members: [
    { id: "1", name: "Nguyễn Văn A", email: "a@example.com", role: "owner", status: "accepted" },
    { id: "2", name: "Trần Thị B", email: "b@example.com", role: "member", status: "accepted" },
    { id: "3", name: "Lê Văn C", email: "c@example.com", role: "member", status: "pending" },
  ],
}

// Map API response to UI model
const mapApiToTrip = (apiData: any) => {
  if (!apiData) return null
  return {
    id: apiData.chuyen_di_id || apiData.id || String(apiData._id || ""),
    tenChuyenDi: apiData.ten_chuyen_di || apiData.tenChuyenDi || apiData.ten || "",
    moTa: apiData.mo_ta ?? apiData.moTa ?? "",
    diaDiemXuatPhat: apiData.dia_diem_xuat_phat ?? apiData.diaDiemXuatPhat ?? "",
    ngayBatDau: apiData.ngay_bat_dau || apiData.ngayBatDau || apiData.startDate || "",
    ngayKetThuc: apiData.ngay_ket_thuc || apiData.ngayKetThuc || apiData.endDate || "",
    soThanhVien: apiData.so_thanh_vien || apiData.soThanhVien || (apiData.members && apiData.members.length) || 0,
    tienDo: apiData.tien_do ?? apiData.progress ?? 0,
    tienTe: apiData.tien_te || apiData.currency || "",
    trangThai: apiData.trang_thai || apiData.trangThai || "draft",
    congKhai: apiData.cong_khai ?? apiData.public ?? false,
    taoLuc: apiData.tao_luc || apiData.createdAt || "",
    members: (apiData.members || apiData.thanh_vien || []).map((m: any, idx: number) => ({
      id: m.id || m._id || String(m.userId || idx),
      name: m.name || m.ten || m.ho_va_ten || "",
      email: m.email || m.mail || "",
      role: m.role || m.vai_tro || "member",
      status: m.status || m.trang_thai || "pending",
    })),
  }
}

export default function TripDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState("overview")
  const [trip, setTrip] = useState<any | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      draft: { label: "Nháp", variant: "secondary" as const },
      planning: { label: "Đang lập kế hoạch", variant: "secondary" as const },
      completed: { label: "Hoàn thành", variant: "outline" as const },
    }
    return statusConfig[status as keyof typeof statusConfig] || statusConfig.draft
  }

  useEffect(() => {
    const fetchTrip = async () => {
      setLoading(true)
      setError(null)
      // Lấy token từ cookie
      const token = Cookies.get("token")
      console.log("Token từ cookie:", token)

      if (!token || token === "null" || token === "undefined") {
        console.warn("Không có token → chuyển về /login")
        router.replace("/login")
        setLoading(false)
        return
      }
      try {
        // API expects either GET /api/chuyendi/ or /api/chuyendi/:id
        const url = `https://travel-planner-imdw.onrender.com/api/chuyendi/${params.id}`
        const { data } = await axios.get(url, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })
        // The API may return an object or an array; try to pick the right payload
        const payload = data?.data ?? data?.chuyendi ?? data ?? null
        const mapped = mapApiToTrip(Array.isArray(payload) ? payload[0] ?? null : payload)
        setTrip(mapped)
      } catch (err: any) {
        setError(err?.response?.data?.message || err?.message || "Failed to load trip")
        setTrip(null)
      } finally {
        setLoading(false)
      }
    }

    fetchTrip()
  }, [params.id])

  const displayTrip = trip || mockTrip

  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader />

      <main className="container mx-auto px-4 py-8">
        {loading && (
          <div className="mb-4">Đang tải chuyến đi...</div>
        )}

        {error && (
          <div className="mb-4 text-destructive">Lỗi: {error}</div>
        )}
        {/* Trip Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <Button variant="ghost" size="icon" onClick={() => router.back()}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-foreground font-[family-name:var(--font-space-grotesk)]">
                {displayTrip.tenChuyenDi}
              </h1>
              <p className="text-muted-foreground mt-1 font-[family-name:var(--font-dm-sans)]">{displayTrip.moTa}</p>
            </div>
            <Badge {...getStatusBadge(displayTrip.trangThai)}>{getStatusBadge(displayTrip.trangThai).label}</Badge>
            <Button variant="outline" size="icon">
              <Settings className="h-4 w-4" />
            </Button>
          </div>

          {/* Trip Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-primary" />
                  <div>
                    <p className="text-sm text-muted-foreground">Thời gian</p>
                    <p className="font-semibold">
                      {displayTrip.ngayBatDau ? new Date(displayTrip.ngayBatDau).toLocaleDateString("vi-VN") : ""} -{" "}
                      {displayTrip.ngayKetThuc ? new Date(displayTrip.ngayKetThuc).toLocaleDateString("vi-VN") : ""}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-primary" />
                  <div>
                    <p className="text-sm text-muted-foreground">Thành viên</p>
                    <p className="font-semibold">{displayTrip.soThanhVien} người</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-primary" />
                  <div>
                    <p className="text-sm text-muted-foreground">Điểm đến</p>
                    <p className="font-semibold">12 địa điểm</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-primary" />
                  <div>
                    <p className="text-sm text-muted-foreground">Tổng chi phí</p>
                    <p className="font-semibold">15,500,000 VNĐ</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-7">
            <TabsTrigger value="overview" className="flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              <span className="hidden sm:inline">Tổng quan</span>
            </TabsTrigger>
            <TabsTrigger value="itinerary" className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              <span className="hidden sm:inline">Lịch trình</span>
            </TabsTrigger>
            <TabsTrigger value="members" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              <span className="hidden sm:inline">Thành viên</span>
            </TabsTrigger>
            <TabsTrigger value="expenses" className="flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              <span className="hidden sm:inline">Chi phí</span>
            </TabsTrigger>
            <TabsTrigger value="chat" className="flex items-center gap-2">
              <MessageCircle className="h-4 w-4" />
              <span className="hidden sm:inline">Chat</span>
            </TabsTrigger>
            <TabsTrigger value="maps" className="flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              <span className="hidden sm:inline">Bản đồ</span>
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              <span className="hidden sm:inline">Cài đặt</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            <OverviewTab trip={displayTrip} />
          </TabsContent>

          <TabsContent value="itinerary">
            <ItineraryTab tripId={params.id} />
          </TabsContent>

          <TabsContent value="members">
            <MembersTab members={displayTrip.members} tripId={params.id} />
          </TabsContent>

          <TabsContent value="expenses">
            <ExpensesTab tripId={params.id} />
          </TabsContent>

          <TabsContent value="chat">
            <ChatTab tripId={params.id} />
          </TabsContent>

          <TabsContent value="maps">
            <MapsTab tripId={params.id} />
          </TabsContent>

          <TabsContent value="settings">
            <SettingsTab tripId={params.id} isOwner={displayTrip.members.find((m: any) => m.id === "1")?.role === "owner"} />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}
