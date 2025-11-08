"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Search, MapPin, Calendar, Users, Eye, Download, Star } from "lucide-react"
import { motion } from "framer-motion"
import Link from "next/link"

// Mock data for public shared trips
const publicTrips = [
  {
    id: "1",
    title: "Khám Phá Đà Nẵng - Hội An",
    description: "Chuyến đi 5 ngày 4 đêm khám phá vẻ đẹp của miền Trung Việt Nam",
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
    },
    coverImage: "/bana-hills-golden-bridge.jpg",
    highlights: ["Cầu Vàng Ba Na Hills", "Phố cổ Hội An", "Bãi biển Mỹ Khê"],
    budget: "2,500,000 VNĐ",
    isVerified: true,
  },
  {
    id: "2",
    title: "Sài Gòn - Mũi Né Adventure",
    description: "Trải nghiệm từ thành phố sôi động đến bãi biển thơ mộng",
    destination: "TP.HCM - Phan Thiết",
    duration: "4 ngày 3 đêm",
    startDate: "2024-04-01",
    endDate: "2024-04-04",
    memberCount: 6,
    viewCount: 890,
    rating: 4.6,
    tags: ["Thành phố", "Biển", "Phiêu lưu"],
    owner: {
      name: "Trần Thị B",
      avatar: "/vietnamese-woman.png",
    },
    coverImage: "/mui-ne-sand-dunes.jpg",
    highlights: ["Đồi cát Mũi Né", "Chợ Bến Thành", "Suối Tiên"],
    budget: "3,200,000 VNĐ",
    isVerified: false,
  },
  {
    id: "3",
    title: "Hà Nội - Sapa Trekking",
    description: "Chinh phục đỉnh Fansipan và khám phá văn hóa dân tộc",
    destination: "Hà Nội - Sapa",
    duration: "6 ngày 5 đêm",
    startDate: "2024-05-10",
    endDate: "2024-05-15",
    memberCount: 8,
    viewCount: 2100,
    rating: 4.9,
    tags: ["Núi", "Trekking", "Văn hóa"],
    owner: {
      name: "Lê Văn C",
      avatar: "/vietnamese-hiker.jpg",
    },
    coverImage: "/sapa-rice-terraces.jpg",
    highlights: ["Đỉnh Fansipan", "Ruộng bậc thang", "Bản Cát Cát"],
    budget: "4,500,000 VNĐ",
    isVerified: true,
  },
]

export default function PublicFeedPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedFilter, setSelectedFilter] = useState("all")
  const [filteredTrips, setFilteredTrips] = useState(publicTrips)

  useEffect(() => {
    let filtered = publicTrips

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(
        (trip) =>
          trip.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          trip.destination.toLowerCase().includes(searchTerm.toLowerCase()) ||
          trip.tags.some((tag) => tag.toLowerCase().includes(searchTerm.toLowerCase()))
      )
    }

    // Filter by category
    if (selectedFilter !== "all") {
      filtered = filtered.filter((trip) => {
        switch (selectedFilter) {
          case "popular":
            return trip.viewCount > 1000
          case "verified":
            return trip.isVerified
          case "recent":
            return new Date(trip.startDate) > new Date("2024-04-01")
          default:
            return true
        }
      })
    }

    setFilteredTrips(filtered)
  }, [searchTerm, selectedFilter])

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-50 to-blue-50">
      {/* Header */}
      <div className="bg-white border-b border-blue-100 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link href="/" className="text-2xl font-bold text-blue-600">
                TravelPlan
              </Link>
              <Badge variant="secondary" className="bg-blue-100 text-blue-700">
                Bản Tin Công Khai
              </Badge>
            </div>
            <div className="flex items-center space-x-4">
              <Link href="/dashboard">
                <Button variant="outline" className="border-blue-200 text-blue-600 hover:bg-blue-50">
                  Về Trang Chủ
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Hero Section */}
      <div
        className="relative text-white py-13 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: "url('/gg.jpg')",
        }}
      >
        <div className="absolute inset-0 bg-black/50" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center z-10">
          <motion.h1
            className="text-5xl md:text-6xl font-bold mb-4"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
          >
            Khám Phá Chuyến Đi
          </motion.h1>
          <motion.p
            className="text-xl md:text-2xl mb-8 text-blue-100 font-light"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.2 }}
          >
            Hàng ngàn lịch trình tuyệt vời từ TravelPlan
          </motion.p>
        </div>
      </div>

        {/* Sticky Search & Filter Bar - Phiên bản NHỎ GỌN, TINH TẾ */}
           {/* Sticky Search Bar - CĂN GIỮA HOÀN HẢO */}
           <div className="sticky top-16 z-40  backdrop-blur-md shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          
          {/* CĂN GIỮA TOÀN BỘ */}
          <div className="flex justify-center">
            <div className="w-full max-w-4xl">
              
              <div className="flex flex-col sm:flex-row gap-3 items-center">
                {/* Search Input */}
                <div className="relative flex-1 max-w-xl w-full">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    placeholder="Tìm điểm đến, hoạt động..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 pr-4 h-10 text-sm bg-gray-50 border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded-lg placeholder:text-gray-400"
                  />
                </div>

                {/* Filter Buttons */}
                <div className="flex gap-2">
                  <Button
                    variant={selectedFilter === "all" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSelectedFilter("all")}
                    className="h-9 px-4 text-sm font-medium rounded-lg"
                  >
                    Tất cả
                  </Button>
                  <Button
                    variant={selectedFilter === "popular" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSelectedFilter("popular")}
                    className="h-9 px-4 text-sm font-medium rounded-lg"
                  >
                    Phổ biến
                  </Button>
                  <Button
                    variant={selectedFilter === "verified" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSelectedFilter("verified")}
                    className="h-9 px-4 text-sm font-medium rounded-lg"
                  >
                    Đã xác thực
                  </Button>
                  <Button
                    variant={selectedFilter === "recent" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSelectedFilter("recent")}
                    className="h-9 px-4 text-sm font-medium rounded-lg"
                  >
                    Mới nhất
                  </Button>
                </div>
              </div>
              
            </div>
          </div>
          
        </div>
      </div>

      {/* Trip Cards */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredTrips.map((trip, index) => (
            <motion.div
              key={trip.id}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
            >
              <Card className="overflow-hidden hover:shadow-2xl transition-all duration-300 border-0 shadow-xl rounded-2xl">
                {/* Cover Image */}
                <div className="relative h-56 overflow-hidden">
                  <img
                    src={trip.coverImage || "/placeholder.svg"}
                    alt={trip.title}
                    className="w-full h-full object-cover transition-transform duration-500 hover:scale-110"
                  />
                  <div className="absolute top-4 right-4 flex gap-2">
                    {trip.isVerified && (
                      <Badge className="bg-gradient-to-r from-green-500 to-emerald-600 text-white shadow-lg">
                        <Star className="h-3 w-3 mr-1" />
                        Đã xác thực
                      </Badge>
                    )}
                    <Badge variant="secondary" className="bg-white/95 backdrop-blur-sm text-gray-800 font-medium">
                      <Eye className="h-3 w-3 mr-1" />
                      {trip.viewCount.toLocaleString()}
                    </Badge>
                  </div>
                </div>

                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between mb-2">
                    <CardTitle className="text-xl font-bold text-gray-900 line-clamp-2 pr-2">
                      {trip.title}
                    </CardTitle>
                  </div>
                  <p className="text-sm text-gray-600 line-clamp-2 mb-4">{trip.description}</p>

                  {/* Owner Info */}
                  <div className="flex items-center gap-3 mb-4">
                    <Avatar className="h-10 w-10 ring-2 ring-white shadow-md">
                      <AvatarImage src={trip.owner.avatar} />
                      <AvatarFallback className="bg-blue-100 text-blue-600 font-bold">
                        {trip.owner.name[0]}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-sm font-semibold text-gray-900">{trip.owner.name}</p>
                      <div className="flex items-center gap-1">
                        <Star className="h-4 w-4 text-yellow-500 fill-current" />
                        <span className="text-sm font-medium text-gray-700">{trip.rating}</span>
                      </div>
                    </div>
                  </div>

                  {/* Trip Details */}
                  <div className="space-y-3 text-sm">
                    <div className="flex items-center gap-3 text-gray-700">
                      <MapPin className="h-5 w-5 text-blue-600" />
                      <span className="font-medium">{trip.destination}</span>
                    </div>
                    <div className="flex items-center gap-3 text-gray-700">
                      <Calendar className="h-5 w-5 text-blue-600" />
                      <span>{trip.duration}</span>
                    </div>
                    <div className="flex items-center gap-3 text-gray-700">
                      <Users className="h-5 w-5 text-blue-600" />
                      <span>{trip.memberCount} thành viên</span>
                    </div>
                  </div>

                  {/* Tags */}
                  <div className="flex flex-wrap gap-2 mt-4">
                    {trip.tags.map((tag) => (
                      <Badge
                        key={tag}
                        variant="secondary"
                        className="text-xs bg-blue-50 text-blue-700 border border-blue-200"
                      >
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </CardHeader>

                <CardContent className="pt-0">
                  {/* Highlights */}
                  <div className="mb-5">
                    <p className="text-sm font-bold text-gray-900 mb-2">Điểm nổi bật:</p>
                    <ul className="text-sm text-gray-600 space-y-1.5">
                      {trip.highlights.slice(0, 3).map((highlight, idx) => (
                        <li key={idx} className="flex items-center gap-2">
                          <div className="w-1.5 h-1.5 bg-blue-600 rounded-full" />
                          <span>{highlight}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Budget */}
                  <div className="flex items-center justify-between mb-5 px-1">
                    <span className="text-sm font-medium text-gray-600">Ngân sách ước tính:</span>
                    <span className="text-lg font-bold text-blue-600">{trip.budget}</span>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-3">
                    <Link href={`/feed/${trip.id}`} className="flex-1">
                      <Button className="w-full h-12 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold rounded-xl shadow-lg">
                        <Eye className="h-5 w-5 mr-2" />
                        Xem Chi Tiết
                      </Button>
                    </Link>
                    <Button
                      variant="outline"
                      size="lg"
                      className="border-2 border-blue-200 text-blue-700 hover:bg-blue-50 font-semibold rounded-xl"
                    >
                      <Download className="h-5 w-5" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* No Results */}
        {filteredTrips.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-20"
          >
            <div className="text-gray-400 mb-6">
              <Search className="h-20 w-20 mx-auto" />
            </div>
            <h3 className="text-2xl font-bold text-gray-800 mb-3">Không tìm thấy lịch trình nào</h3>
            <p className="text-gray-600 text-lg">Thử thay đổi từ khóa hoặc bộ lọc của bạn</p>
          </motion.div>
        )}
      </div>

      {/* Footer */}
      <footer className="bg-white border-t border-blue-100 mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <div className="text-center text-gray-600">
            <p className="text-sm">&copy; 2024 TravelPlan. Tất cả quyền được bảo lưu.</p>
            <p className="text-xs mt-2 text-gray-500">Made with love in Vietnam</p>
          </div>
        </div>
      </footer>
    </div>
  )
}