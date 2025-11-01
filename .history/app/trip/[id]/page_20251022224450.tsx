"use client"

import { useState, useEffect, use } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Users, Calendar, MapPin, DollarSign, MessageCircle, Settings, Copy, Check } from "lucide-react"
import { DashboardHeader } from "@/components/dashboard/dashboard-header"
import { ItineraryTab } from "@/components/trip/itinerary-tab"
import { MembersTab } from "@/components/trip/members-tab"
import { ExpensesTab } from "@/components/trip/expenses-tab"
import { ChatTab } from "@/components/trip/chat-tab"
import { OverviewTab } from "@/components/trip/overview-tab"
import { MapsTab } from "@/components/trip/maps-tab" // Import MapsTab component
import { SettingsTab } from "@/components/trip/settings-tab" // Import SettingsTab component
import { useRouter } from "next/navigation"
import Cookies from "js-cookie"

// Trip interface
interface Trip {
 chuyen_di_id: number
 ten_chuyen_di: string
 mo_ta: string
 dia_diem_xuat_phat: string  // ✅ Sửa từ dia_diem_xuat_phat thành dia_diem_xuat
 ngay_bat_dau: string
 ngay_ket_thuc: string
 chu_so_huu_id: number
 tien_te: string
 trang_thai: string
 tao_luc: string
 cong_khai: boolean
}

export default function TripDetailPage({ params }: { params: Promise<{ id: string }> }) {
 const router = useRouter()
 const [activeTab, setActiveTab] = useState("overview")
const [trip, setTrip] = useState<Trip | null>(null)
 const [loading, setLoading] = useState(true)
 const [error, setError] = useState<string | null>(null)
    const [copiedField, setCopiedField] = useState<string | null>(null)

// Unwrap params using React.use()
 const resolvedParams = use(params)

 // Function to decode JWT token
 const decodeToken = (token: string) => {
 try {
 const base64Url = token.split('.')[1]
 const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/')
const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
 return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)
 }).join(''))
return JSON.parse(jsonPayload)
 } catch (error) {
 console.error("❌ Error decoding token:", error)
 return null
}
 }

 // Fetch trip details from API (VERSION ĐÃ SỬA)
 const fetchTripDetails = async () => {
 setLoading(true)
 setError(null)

 try {
 const token = Cookies.get("token")
 console.log("🔑 Token từ cookie:", token)
 console.log("🆔 Trip ID từ URL:", resolvedParams.id)

if (!token || token === "null" || token === "undefined") {
 console.warn("❌ Không có token → chuyển về /login")
 router.replace("/login")
 return
 }
 
 const decodedToken = decodeToken(token)
 if (decodedToken && decodedToken.exp * 1000 < Date.now()) {
 console.warn("❌ Token đã hết hạn → chuyển về /login")
 router.replace("/login")
 return
 }

const apiUrl = `https://travel-planner-imdw.onrender.com/api/chuyendi/${resolvedParams.id}`
console.log("🌐 Gọi API URL:", apiUrl)

const response = await fetch(apiUrl, {
method: "GET",
headers: {
 "Authorization": `Bearer ${token}`,
"Content-Type": "application/json",
},
})

console.log("📡 Response status:", response.status)

if (!response.ok) {
const errorText = await response.text()
console.error("❌ Lỗi API:", errorText)
if(response.status === 401 || response.status === 403) {
throw new Error(`Lỗi xác thực (status: ${response.status}). Vui lòng đăng nhập lại.`)
}
throw new Error(`Lỗi HTTP! status: ${response.status} - ${errorText}`)
}

 const apiResponse = await response.json()
console.log("✅ Dữ liệu gốc từ API:", apiResponse)
      console.log("🔍 Các keys của dữ liệu gốc:", Object.keys(apiResponse))

      const finalTripData = apiResponse.data || apiResponse.result || apiResponse.chuyen_di || apiResponse

if (!finalTripData || typeof finalTripData !== 'object' || !finalTripData.chuyen_di_id) {
        console.error("❌ Không tìm thấy đối tượng chuyến đi hợp lệ trong response:", finalTripData)
        throw new Error("Cấu trúc dữ liệu trả về từ API không hợp lệ hoặc không chứa thông tin chuyến đi.")
      }
      
 console.log("🎯 Dữ liệu chuyến đi cuối cùng sẽ được set vào state:", finalTripData)
 setTrip(finalTripData as Trip)

 } catch (err) {
 console.error("❌ Đã xảy ra lỗi khi fetch chi tiết chuyến đi:", err)
 setError(err instanceof Error ? err.message : "Có lỗi xảy ra khi tải thông tin chuyến đi")
} finally {
setLoading(false)
 }
}

 useEffect(() => {
    if (resolvedParams.id) {
   fetchTripDetails()
    }
}, [resolvedParams.id])

    const handleCopy = async (field: string, text: string) => {
        if (!text) return
        try {
            await navigator.clipboard.writeText(text)
            setCopiedField(field)
            setTimeout(() => setCopiedField(null), 1500)
        } catch (err) {
            console.error("Không thể copy:", err)
        }
    }

const getStatusBadge = (status: string) => {
const statusConfig = {
draft: { label: "Nháp", variant: "secondary" as const },
planning: { label: "Đang lập kế hoạch", variant: "secondary" as const },
completed: { label: "Hoàn thành", variant: "outline" as const },
}
return statusConfig[status as keyof typeof statusConfig] || statusConfig.draft
 }

if (loading) {
return (
<div className="min-h-screen bg-background">
<DashboardHeader />
<main className="container mx-auto px-4 py-8">
<div className="flex items-center justify-center h-64">
<div className="text-center">
<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
<p className="text-muted-foreground">Đang tải thông tin chuyến đi...</p>
</div>
</div>
</main>
</div>
)
}

if (error) {
return (
<div className="min-h-screen bg-background">
<DashboardHeader />
<main className="container mx-auto px-4 py-8">
<div className="flex items-center justify-center h-64">
 <div className="text-center">
<p className="text-destructive mb-4">{error}</p>
<Button onClick={fetchTripDetails} variant="outline"> Thử lại</Button>
 </div>
</div>
 </main>
 </div>
 )
 }

if (!trip) {
return (
 <div className="min-h-screen bg-background">
<DashboardHeader />
<main className="container mx-auto px-4 py-8">
 <div className="flex items-center justify-center h-64">
 <div className="text-center">
<p className="text-muted-foreground">Không tìm thấy thông tin chuyến đi</p>
</div>
</div>
</main>
</div>
)
}

return (
<div className="min-h-screen bg-background">
<DashboardHeader />

    <main className="container mx-auto px-4 py-6">
{/* Trip Header */}
                <div className="mb-6">
                                        <div className="flex items-start gap-3 mb-2 justify-start">
<Button variant="ghost" size="icon" onClick={() => router.back()}>
<ArrowLeft className="h-4 w-4" />
</Button>
              <div className="flex-none text-left">
            <h1 className="text-2xl font-bold text-foreground font-[family-name:var(--font-space-grotesk)]">
  {trip.ten_chuyen_di}
            </h1>
            <p className="text-sm text-muted-foreground mt-1 font-[family-name:var(--font-dm-sans)]">
            {trip.mo_ta}
            </p>
</div>
{/* <Badge {...getStatusBadge(trip.trang_thai)}>{getStatusBadge(trip.trang_thai).label}</Badge> */}
{/* <Button variant="outline" size="icon">
   <Settings className="h-4 w-4" />
  </Button> */}
</div>

{/* 4 CỘT */}
<div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <Card>
                            <CardContent className="p-4">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <Calendar className="h-4 w-4 text-primary" />
                                        <div>
                                            <p className="text-sm text-muted-foreground">Thời gian</p>
                                            <p className="font-semibold">
                                                {trip.ngay_bat_dau && trip.ngay_ket_thuc 
                                                    ? `${new Date(trip.ngay_bat_dau).toLocaleDateString("vi-VN")} - ${new Date(trip.ngay_ket_thuc).toLocaleDateString("vi-VN")}`
                                                    : "Chưa cập nhật"
                                                }
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <button
                                            aria-label="Copy thời gian"
                                            className="p-1 rounded hover:bg-muted"
                                            onClick={() => handleCopy('time', trip.ngay_bat_dau && trip.ngay_ket_thuc ? `${new Date(trip.ngay_bat_dau).toLocaleDateString("vi-VN")} - ${new Date(trip.ngay_ket_thuc).toLocaleDateString("vi-VN")}` : '')}
                                        >
                                            {copiedField === 'time' ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                                        </button>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardContent className="p-4">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <Users className="h-4 w-4 text-primary" />
                                        <div>
                                            <p className="text-sm text-muted-foreground">Địa điểm xuất phát</p>
                                            <p className="font-semibold">{trip.dia_diem_xuat_phat || "Chưa cập nhật"}</p>
                                        </div>
                                    </div>
                                    <div>
                                        <button aria-label="Copy địa điểm" className="p-1 rounded hover:bg-muted" onClick={() => handleCopy('start', trip.dia_diem_xuat_phat || '')}>
                                            {copiedField === 'start' ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                                        </button>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardContent className="p-4">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <MapPin className="h-4 w-4 text-primary" />
                                        <div>
                                            <p className="text-sm text-muted-foreground">Tiền tệ</p>
                                            <p className="font-semibold">{trip.tien_te || "VNĐ"}</p>
                                        </div>
                                    </div>
                                    {/* <div>
                                        <button aria-label="Copy tiền tệ" className="p-1 rounded hover:bg-muted" onClick={() => handleCopy('currency', trip.tien_te || 'VNĐ')}>
                                            {copiedField === 'currency' ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                                        </button>
                                    </div> */}
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardContent className="p-4">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <DollarSign className="h-4 w-4 text-primary" />
                                        <div>
                                            <p className="text-sm text-muted-foreground">Trạng thái</p>
                                            <p className="font-semibold">{trip.cong_khai ? "Công khai" : "Riêng tư"}</p>
                                        </div>
                                    </div>
                                    {/* copy */}
                                    {/* <div>
                                        <button aria-label="Copy trạng thái" className="p-1 rounded hover:bg-muted" onClick={() => handleCopy('public', trip.cong_khai ? 'Công khai' : 'Riêng tư')}>
                                            {copiedField === 'public' ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                                        </button>
                                    </div> */}
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
<OverviewTab trip={trip} />
</TabsContent>
<TabsContent value="itinerary">
<ItineraryTab tripId={resolvedParams.id} />
</TabsContent>

<TabsContent value="members">
<MembersTab members={[]} tripId={resolvedParams.id} />
</TabsContent>
<TabsContent value="expenses">
<ExpensesTab tripId={resolvedParams.id} />
</TabsContent>
<TabsContent value="chat">
<ChatTab tripId={resolvedParams.id} />
</TabsContent>

<TabsContent value="maps">
<MapsTab tripId={resolvedParams.id} />
</TabsContent>

<TabsContent value="settings">
<SettingsTab tripId={resolvedParams.id} isOwner={true} />
</TabsContent>
</Tabs>
</main>
</div>
)
}
