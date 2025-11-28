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
// import { OverviewTab } from "@/components/trip/overview-tab"
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
    const [activeTab, setActiveTab] = useState("ItineraryTab")
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
            const jsonPayload = decodeURIComponent(atob(base64).split('').map(function (c) {
                return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)
            }).join(''))
            return JSON.parse(jsonPayload)
        } catch (error) {
            console.error("❌ Error decoding token:", error)
            return null
        }
    }
    // bảng ngày tháng
    const getTripDuration = () => {
        if (trip?.ngay_bat_dau && trip?.ngay_ket_thuc) {
            const startDate = new Date(trip.ngay_bat_dau)
            const endDate = new Date(trip.ngay_ket_thuc)
            const duration = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1
            return `${duration} ngày`
        }
        return "Chưa cập nhật"
    }

    const getDateRange = () => {
        if (trip?.ngay_bat_dau && trip?.ngay_ket_thuc) {
            const startDate = new Date(trip.ngay_bat_dau)
            const endDate = new Date(trip.ngay_ket_thuc)
            return `${startDate.toLocaleDateString("vi-VN")} - ${endDate.toLocaleDateString("vi-VN")}`
        }
        return "Chưa cập nhật"
    }

    const stats = [
        {
            title: "Tổng số ngày",
            value: getTripDuration(),
            icon: <Calendar className="h-5 w-5 text-primary" />,
            description: getDateRange(),
        },
        // địa điểm xuất phát
        // {
        //   title: "Địa điểm xuất phát",
        //   value: trip?.dia_diem_xuat_phat || "Chưa cập nhật",
        //   icon: <MapPin className="h-5 w-5 text-primary" />,
        //   description: "Nơi bắt đầu hành trình",
        // },


        // khung dưới icon
        // {
        //   title: "Tiền tệ",
        //   value: trip?.tien_te || "VNĐ",
        //   icon: <DollarSign className="h-5 w-5 text-primary" />,
        //   description: "Đơn vị tiền tệ sử dụng",
        // },
        // {
        //   title: "Trạng thái",
        //   value: trip?.cong_khai ? "Công khai" : "Riêng tư",
        //   icon: <TrendingUp className="h-5 w-5 text-primary" />,
        //   description: trip?.trang_thai || "Chưa cập nhật",
        // },
    ]

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
                if (response.status === 401 || response.status === 403) {
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
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 lg:gap-6">
                        {/* CARD THỜI GIAN - ĐÃ SỬA ĐẸP NHẤT */}
                        <Card className="md:col-span-1"> {/* Đảm bảo chỉ chiếm 1 cột */}
                            <CardContent className="p-4 lg:p-5">
                                <div className="flex items-start justify-between gap-3">
                                    <div className="flex items-center gap-2 min-w-0 flex-1">
                                        <Calendar className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />

                                        {/* Thay grid lồng nhau bằng flex để không bị vỡ layout */}
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium text-muted-foreground">Thời gian</p>
                                            <p className="text-base lg:text-lg font-bold text-foreground mt-1 leading-tight">
                                                {trip.ngay_bat_dau && trip.ngay_ket_thuc
                                                    ? `${new Date(trip.ngay_bat_dau).toLocaleDateString("vi-VN")} - ${new Date(trip.ngay_ket_thuc).toLocaleDateString("vi-VN")}`
                                                    : "Chưa xác định"}
                                            </p>
                                            {trip.ngay_bat_dau && trip.ngay_ket_thuc && (
                                                <p className="text-xs text-muted-foreground mt-1">
                                                    Tổng cộng <span className="font-bold text-primary">335 ngày</span>
                                                </p>
                                            )}
                                        </div>
                                    </div>

                                    {/* Nút copy (nếu bật lại sau) */}
                                    {/* <button ... /> */}
                                </div>
                            </CardContent>
                        </Card>

                        {/* 3 CARD NHỎ CÒN LẠI - ĐỀU, ĐẸP, KHÍT */}
                        <Card>
                            <CardContent className="p-4 lg:p-5">
                                <div className="flex items-center justify-between gap-3">
                                    <div className="flex items-center gap-2.5">
                                        <MapPin className="h-4 w-4 text-primary flex-shrink-0" />
                                        <div className="min-w-0">
                                            <p className="text-sm text-muted-foreground">Địa điểm xuất phát</p>
                                            <p className="font-semibold text-foreground truncate">
                                                {trip.dia_diem_xuat_phat || "Chưa cập nhật"}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>



                        <Card>
                            <CardContent className="p-4 lg:p-5">
                                <div className="flex items-center justify-between gap-3">
                                    <div className="flex items-center gap-2.5">
                                        <Users className="h-4 w-4 text-primary flex-shrink-0" />
                                        <div>
                                            <p className="text-sm text-muted-foreground">Trạng thái</p>
                                            <p className="font-semibold text-foreground">
                                                {trip.cong_khai ? "Công khai" : "Riêng tư"}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                          {/* <Card>
                            <CardContent className="p-4 lg:p-5">
                                <div className="flex items-center justify-between gap-3">
                                    <div className="flex items-center gap-2.5">
                                        <DollarSign className="h-4 w-4 text-primary flex-shrink-0" />
                                        <div>
                                            <p className="text-sm text-muted-foreground">Tiền tệ</p>
                                            <p className="font-semibold text-foreground">{trip.tien_te || "VNĐ"}</p>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card> */}
                        <Card>
                            <CardContent className="space-y-4">
                                <div className="space-y-2">
                                    <div className="flex justify-between text-sm">
                                        <span>Lịch trình</span>
                                        <span className="font-medium">80%</span>
                                    </div>
                                    <div className="w-full bg-muted rounded-full h-2">
                                        <div className="bg-primary h-2 rounded-full" style={{ width: "80%" }} />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <div className="flex justify-between text-sm">
                                        <span>Chi phí</span>
                                        <span className="font-medium">65%</span>
                                    </div>
                                    <div className="w-full bg-muted rounded-full h-2">
                                        <div className="bg-secondary h-2 rounded-full" style={{ width: "65%" }} />
                                    </div>
                                </div>

                                {/* <div className="space-y-2">
                                    <div className="flex justify-between text-sm">
                                        <span>Thành viên</span>
                                        <span className="font-medium">75%</span>
                                    </div>
                                    <div className="w-full bg-muted rounded-full h-2">
                                        <div className="bg-accent h-2 rounded-full" style={{ width: "75%" }} />
                                    </div>
                                </div> */}
                            </CardContent>
                        </Card>
                    </div>
                </div>

                {/* Tabs */}
                <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
                <TabsList className="grid w-full [grid-template-columns:repeat(5,1fr)]">                  
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
                            <span className="hidden sm:inline">Gợi ý</span>
                        </TabsTrigger>  
                                            
                    </TabsList>
                 {/* 
                    <TabsContent value="itinerary">
                        <itineraryTab trip={trip} />
                    </TabsContent> */}
                    <TabsContent value="itinerary">
                        <ItineraryTab
                            tripId={resolvedParams.id}
                            tripStartDate={trip?.ngay_bat_dau}
                            tripEndDate={trip?.ngay_ket_thuc}
                        />
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
