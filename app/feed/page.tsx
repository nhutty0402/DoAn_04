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
          trip.tags.some((tag) => tag.toLowerCase().includes(searchTerm.toLowerCase())),
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
      <div className="bg-white border-b border-blue-100 sticky top-0 z-10">
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
                <Button variant="outline" className="border-blue-200 text-blue-600 hover:bg-blue-50 bg-transparent">
                  Về Trang Chủ
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Trang đầu vÀ MENU */}
      <div className="bg-gradient-to-r from-blue-600 to-sky-500 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.h1
            className="text-4xl md:text-5xl font-bold mb-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            Khám Phá Lịch Trình Du Lịch
          </motion.h1>
          <motion.p
            className="text-xl mb-8 text-blue-100"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            Tìm hiểu những chuyến đi tuyệt vời được chia sẻ bởi cộng đồng
          </motion.p>

          {/* Search and Filter */}
          <motion.div
            className="max-w-2xl mx-auto"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
          >
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                <Input
                  placeholder="Tìm kiếm điểm đến, hoạt động..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 bg-white border-0 text-gray-900 placeholder-gray-500"
                />
              </div>
              <div className="flex gap-2">
                <Button
                  variant={selectedFilter === "all" ? "secondary" : "outline"}
                  onClick={() => setSelectedFilter("all")}
                  className="bg-white text-blue-600 border-white hover:bg-blue-50"
                >
                  Tất cả
                </Button>
                <Button
                  variant={selectedFilter === "popular" ? "secondary" : "outline"}
                  onClick={() => setSelectedFilter("popular")}
                  className="bg-white text-blue-600 border-white hover:bg-blue-50"
                >
                  Phổ biến
                </Button>
                <Button
                  variant={selectedFilter === "verified" ? "secondary" : "outline"}
                  onClick={() => setSelectedFilter("verified")}
                  className="bg-white text-blue-600 border-white hover:bg-blue-50"
                >
                  Đã thích
                </Button>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Trip Cards */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredTrips.map((trip, index) => (
            <motion.div
              key={trip.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
            >
              <Card className="overflow-hidden hover:shadow-xl transition-all duration-300 border-0 shadow-lg">
                {/* Cover Image */}
                <div className="relative h-48 overflow-hidden">
                  <img
                    src={trip.coverImage || "/placeholder.svg"}
                    alt={trip.title}
                    className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
                  />
                  <div className="absolute top-4 right-4 flex gap-2">
                    {trip.isVerified && (
                      <Badge className="bg-green-500 text-white">
                        <Star className="h-3 w-3 mr-1" />
                        {/* Xác thực */}
                      </Badge>
                    )}
                    <Badge variant="secondary" className="bg-white/90 text-gray-700">
                      <Eye className="h-3 w-3 mr-1" />
                      {trip.viewCount.toLocaleString()}
                    </Badge>
                  </div>
                </div>

                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg font-bold text-gray-900 mb-2 line-clamp-2">{trip.title}</CardTitle>
                      <p className="text-sm text-gray-600 line-clamp-2 mb-3">{trip.description}</p>
                    </div>
                  </div>

                  {/* Owner Info */}
                  <div className="flex items-center gap-3 mb-3">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={trip.owner.avatar || "/placeholder.svg"} />
                      <AvatarFallback>{trip.owner.name[0]}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-sm font-medium text-gray-900">{trip.owner.name}</p>
                      <div className="flex items-center gap-1">
                        <Star className="h-3 w-3 text-yellow-400 fill-current" />
                        <span className="text-xs text-gray-600">{trip.rating}</span>
                      </div>
                    </div>
                  </div>

                  {/* Trip Details */}
                  <div className="space-y-2 text-sm text-gray-600">
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-blue-500" />
                      <span>{trip.destination}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-blue-500" />
                      <span>{trip.duration}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-blue-500" />
                      <span>{trip.memberCount} thành viên</span>
                    </div>
                  </div>

                  {/* Tags */}
                  <div className="flex flex-wrap gap-1 mt-3">
                    {trip.tags.map((tag) => (
                      <Badge key={tag} variant="outline" className="text-xs border-blue-200 text-blue-600">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </CardHeader>

                <CardContent className="pt-0">
                  {/* Highlights */}
                  <div className="mb-4">
                    <p className="text-sm font-medium text-gray-900 mb-2">Điểm nổi bật:</p>
                    <ul className="text-xs text-gray-600 space-y-1">
                      {trip.highlights.slice(0, 3).map((highlight, idx) => (
                        <li key={idx} className="flex items-center gap-2">
                          <div className="w-1 h-1 bg-blue-500 rounded-full" />
                          {highlight}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Budget */}
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-sm text-gray-600">Ngân sách:</span>
                    <span className="text-sm font-semibold text-blue-600">{trip.budget}</span>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-2">
                    <Link href={`/feed/${trip.id}`} className="flex-1">
                      <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white">
                        <Eye className="h-4 w-4 mr-2" />
                        Xem Chi Tiết
                      </Button>
                    </Link>
                    <Button
                      variant="outline"
                      size="sm"
                      className="border-blue-200 text-blue-600 hover:bg-blue-50 bg-transparent"
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* No Results */}
        {filteredTrips.length === 0 && (
          <div className="text-center py-12">
            <div className="text-gray-400 mb-4">
              <Search className="h-16 w-16 mx-auto" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Không tìm thấy lịch trình nào</h3>
            <p className="text-gray-600">Thử thay đổi từ khóa tìm kiếm hoặc bộ lọc</p>
          </div>
        )}
      </div>

      {/* Footer */}
      <footer className="bg-white border-t border-blue-100 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center text-gray-600">
            <p>&copy; 2024 TravelPlan. Tất cả quyền được bảo lưu.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
