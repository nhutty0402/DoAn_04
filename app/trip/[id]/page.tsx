"use client"

import { useState } from "react"
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

// Mock trip data
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

export default function TripDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState("overview")

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      draft: { label: "Nháp", variant: "secondary" as const },
      planning: { label: "Đang lập kế hoạch", variant: "secondary" as const },
      completed: { label: "Hoàn thành", variant: "outline" as const },
    }
    return statusConfig[status as keyof typeof statusConfig] || statusConfig.draft
  }

  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader />

      <main className="container mx-auto px-4 py-8">
        {/* Trip Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <Button variant="ghost" size="icon" onClick={() => router.back()}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-foreground font-[family-name:var(--font-space-grotesk)]">
                {mockTrip.tenChuyenDi}
              </h1>
              <p className="text-muted-foreground mt-1 font-[family-name:var(--font-dm-sans)]">{mockTrip.moTa}</p>
            </div>
            <Badge {...getStatusBadge(mockTrip.trangThai)}>{getStatusBadge(mockTrip.trangThai).label}</Badge>
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
                      {new Date(mockTrip.ngayBatDau).toLocaleDateString("vi-VN")} -{" "}
                      {new Date(mockTrip.ngayKetThuc).toLocaleDateString("vi-VN")}
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
                    <p className="font-semibold">{mockTrip.soThanhVien} người</p>
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
            <OverviewTab trip={mockTrip} />
          </TabsContent>

          <TabsContent value="itinerary">
            <ItineraryTab tripId={params.id} />
          </TabsContent>

          <TabsContent value="members">
            <MembersTab members={mockTrip.members} tripId={params.id} />
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
            <SettingsTab tripId={params.id} isOwner={mockTrip.members.find((m) => m.id === "1")?.role === "owner"} />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}
