"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ArrowLeft, Eye, Download, Star, Share2, Heart } from "lucide-react"
import { motion } from "framer-motion"
import Link from "next/link"
import { ReadOnlyOverviewTab } from "@/components/trip/read-only-overview-tab"
import { ReadOnlyItineraryTab } from "@/components/trip/read-only-itinerary-tab"
import { ReadOnlyMapsTab } from "@/components/trip/read-only-maps-tab"

// Mock data for the specific trip
const getTripData = (id: string) => {
  const trips = {
    "1": {
      id: "1",
      title: "Khám Phá Đà Nẵng - Hội An",
      description:
        "Chuyến đi 5 ngày 4 đêm khám phá vẻ đẹp của miền Trung Việt Nam với những trải nghiệm tuyệt vời từ biển xanh đến phố cổ.",
      destination: "Đà Nẵng, Việt Nam",
      duration: "5 ngày 4 đêm",
      startDate: "2024-03-15",
      endDate: "2024-03-19",
      memberCount: 4,
      viewCount: 1250,
      rating: 4.8,
      tags: ["Biển", "Văn hóa", "Ẩm thực"],
      owner: {
        name: "Nguyễn Văn A",
        avatar: "/vietnamese-man.jpg",
        bio: "Travel blogger với 5 năm kinh nghiệm khám phá Việt Nam",
      },
      coverImage: "/bana-hills-golden-bridge.jpg",
      highlights: ["Cầu Vàng Ba Na Hills", "Phố cổ Hội An", "Bãi biển Mỹ Khê"],
      budget: "2,500,000 VNĐ",
      isVerified: true,
      itinerary: [
        {
          day: 1,
          title: "Ngày 1: Đến Đà Nẵng",
          date: "2024-03-15",
          activities: [
            {
              time: "08:00",
              title: "Bay từ TP.HCM đến Đà Nẵng",
              location: "Sân bay Đà Nẵng",
              duration: "2 giờ",
              type: "transport",
            },
            {
              time: "12:00",
              title: "Check-in khách sạn",
              location: "Khách sạn Mường Thanh",
              duration: "1 giờ",
              type: "accommodation",
            },
            {
              time: "14:00",
              title: "Tham quan Bãi biển Mỹ Khê",
              location: "Bãi biển Mỹ Khê",
              duration: "3 giờ",
              type: "sightseeing",
            },
            {
              time: "19:00",
              title: "Ăn tối tại chợ đêm Hàn",
              location: "Chợ đêm Hàn",
              duration: "2 giờ",
              type: "dining",
            },
          ],
        },
        {
          day: 2,
          title: "Ngày 2: Ba Na Hills",
          date: "2024-03-16",
          activities: [
            {
              time: "07:00",
              title: "Khởi hành đi Ba Na Hills",
              location: "Ba Na Hills",
              duration: "1 giờ",
              type: "transport",
            },
            {
              time: "09:00",
              title: "Tham quan Cầu Vàng",
              location: "Cầu Vàng Ba Na Hills",
              duration: "4 giờ",
              type: "sightseeing",
            },
            {
              time: "14:00",
              title: "Trải nghiệm Fantasy Park",
              location: "Fantasy Park",
              duration: "3 giờ",
              type: "entertainment",
            },
            {
              time: "18:00",
              title: "Về lại Đà Nẵng",
              location: "Khách sạn",
              duration: "1 giờ",
              type: "transport",
            },
          ],
        },
      ],
      expenses: {
        total: 2500000,
        breakdown: [
          { category: "Vé máy bay", amount: 800000 },
          { category: "Khách sạn", amount: 600000 },
          { category: "Ăn uống", amount: 500000 },
          { category: "Vé tham quan", amount: 400000 },
          { category: "Di chuyển", amount: 200000 },
        ],
      },
    },
  }

  return trips[id as keyof typeof trips] || null
}

export default function PublicTripDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [trip, setTrip] = useState<any>(null)
  const [activeTab, setActiveTab] = useState("overview")
  const [isLiked, setIsLiked] = useState(false)

  useEffect(() => {
    const tripData = getTripData(params.id as string)
    if (tripData) {
      setTrip(tripData)
    } else {
      router.push("/feed")
    }
  }, [params.id, router])

  if (!trip) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-sky-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Đang tải...</p>
        </div>
      </div>
    )
  }

  const handleDownloadPDF = () => {
    // Mock PDF download functionality
    const link = document.createElement("a")
    link.href = "#"
    link.download = `${trip.title}.pdf`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-50 to-blue-50">
      {/* Header */}
      <div className="bg-white border-b border-blue-100 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link href="/feed">
                <Button variant="ghost" size="sm" className="text-blue-600 hover:bg-blue-50">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Quay lại
                </Button>
              </Link>
              <div className="text-sm text-gray-600">
                <Link href="/feed" className="hover:text-blue-600">
                  Bản tin
                </Link>
                <span className="mx-2">/</span>
                <span className="text-gray-900">{trip.title}</span>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsLiked(!isLiked)}
                className={`border-blue-200 ${isLiked ? "bg-red-50 text-red-600 border-red-200" : "text-blue-600 hover:bg-blue-50"}`}
              >
                <Heart className={`h-4 w-4 mr-2 ${isLiked ? "fill-current" : ""}`} />
                {isLiked ? "Đã thích" : "Thích"}
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="border-blue-200 text-blue-600 hover:bg-blue-50 bg-transparent"
              >
                <Share2 className="h-4 w-4 mr-2" />
                Chia sẻ
              </Button>
              <Button onClick={handleDownloadPDF} className="bg-blue-600 hover:bg-blue-700 text-white">
                <Download className="h-4 w-4 mr-2" />
                Tải PDF
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Hero Section */}
      <div className="relative h-96 overflow-hidden">
        <img src={trip.coverImage || "/placeholder.svg"} alt={trip.title} className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-8">
          <div className="max-w-7xl mx-auto">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
              <div className="flex items-center gap-2 mb-4">
                {trip.isVerified && (
                  <Badge className="bg-green-500 text-white">
                    <Star className="h-3 w-3 mr-1" />
                    Xác thực
                  </Badge>
                )}
                <Badge variant="secondary" className="bg-white/20 text-white border-white/30">
                  <Eye className="h-3 w-3 mr-1" />
                  {trip.viewCount.toLocaleString()} lượt xem
                </Badge>
              </div>
              <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">{trip.title}</h1>
              <p className="text-xl text-white/90 mb-6 max-w-3xl">{trip.description}</p>
              <div className="flex flex-wrap gap-2">
                {trip.tags.map((tag: string) => (
                  <Badge key={tag} variant="outline" className="border-white/30 text-white bg-white/10">
                    {tag}
                  </Badge>
                ))}
              </div>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-3 mb-8">
                <TabsTrigger value="overview">Tổng quan</TabsTrigger>
                <TabsTrigger value="itinerary">Lịch trình</TabsTrigger>
                <TabsTrigger value="map">Bản đồ</TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="space-y-6">
                <ReadOnlyOverviewTab trip={trip} />
              </TabsContent>

              <TabsContent value="itinerary" className="space-y-6">
                <ReadOnlyItineraryTab itinerary={trip.itinerary} />
              </TabsContent>

              <TabsContent value="map" className="space-y-6">
                <ReadOnlyMapsTab tripId={trip.id} />
              </TabsContent>
            </Tabs>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Owner Info */}
            <Card>
              <CardHeader>
                <CardTitle>Người tạo</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-4 mb-4">
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={trip.owner.avatar || "/placeholder.svg"} />
                    <AvatarFallback>{trip.owner.name[0]}</AvatarFallback>
                  </Avatar>
                  <div>
                    <h4 className="font-semibold">{trip.owner.name}</h4>
                    <div className="flex items-center gap-1">
                      <Star className="h-4 w-4 text-yellow-400 fill-current" />
                      <span className="text-sm text-gray-600">{trip.rating}</span>
                    </div>
                  </div>
                </div>
                <p className="text-sm text-gray-600 mb-4">{trip.owner.bio}</p>
                <Button
                  variant="outline"
                  className="w-full border-blue-200 text-blue-600 hover:bg-blue-50 bg-transparent"
                >
                  Xem thêm chuyến đi
                </Button>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Hành động</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button onClick={handleDownloadPDF} className="w-full bg-blue-600 hover:bg-blue-700 text-white">
                  <Download className="h-4 w-4 mr-2" />
                  Tải kế hoạch PDF
                </Button>
                <Button
                  variant="outline"
                  className="w-full border-blue-200 text-blue-600 hover:bg-blue-50 bg-transparent"
                >
                  <Share2 className="h-4 w-4 mr-2" />
                  Chia sẻ chuyến đi
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setIsLiked(!isLiked)}
                  className={`w-full ${isLiked ? "bg-red-50 text-red-600 border-red-200" : "border-blue-200 text-blue-600 hover:bg-blue-50"}`}
                >
                  <Heart className={`h-4 w-4 mr-2 ${isLiked ? "fill-current" : ""}`} />
                  {isLiked ? "Bỏ thích" : "Yêu thích"}
                </Button>
              </CardContent>
            </Card>

            {/* Trip Stats */}
            <Card>
              <CardHeader>
                <CardTitle>Thống kê</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Lượt xem:</span>
                  <span className="font-semibold">{trip.viewCount.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Ngày tạo:</span>
                  <span className="font-semibold">15/03/2024</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Cập nhật:</span>
                  <span className="font-semibold">20/03/2024</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
