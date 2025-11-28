// "use client"

// import { useState, useEffect, useCallback } from "react"
// import { useRouter } from "next/navigation"
// import axios from "axios"
// import Cookies from "js-cookie"
// import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
// import { Badge } from "@/components/ui/badge"
// import { Button } from "@/components/ui/button"
// import { Input } from "@/components/ui/input"
// import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
// import { Search, MapPin, Calendar, Users, Eye, Download, Star, Loader2 } from "lucide-react"
// import { motion } from "framer-motion"
// import Link from "next/link"
// import { toast } from "sonner"

// // Interface cho trip từ API (cho phép null/undefined)
// interface TripFromAPI {
//   chuyen_di_id: number
//   ten_chuyen_di: string | null
//   mo_ta: string | null
//   url_avt: string | null
//   dia_diem_xuat_phat: string | null
//   ngay_bat_dau: string | null
//   ngay_ket_thuc: string | null
//   chu_so_huu_id: number
//   tien_te: string | null
//   trang_thai: string | null
//   tong_ngan_sach: string | number | null
//   tao_luc: string | null
//   cong_khai: number | null
//   chu_so_huu_ten: string | null
//   chu_so_huu_avatar: string | null
//   tong_thanh_vien: number | null
// }

// // Interface cho trip hiển thị
// interface DisplayTrip {
//   id: string
//   title: string
//   description: string
//   destination: string
//   duration: string
//   startDate: string
//   endDate: string
//   memberCount: number
//   viewCount: number
//   rating: number
//   tags: string[]
//   owner: {
//     name: string
//     avatar: string
//   }
//   coverImage: string
//   highlights: string[]
//   budget: string
//   isVerified: boolean
// }

// export default function PublicFeedPage() {
//   const router = useRouter()
//   const [searchTerm, setSearchTerm] = useState("")
//   const [selectedFilter, setSelectedFilter] = useState("all")
//   const [trips, setTrips] = useState<DisplayTrip[]>([])
//   const [filteredTrips, setFilteredTrips] = useState<DisplayTrip[]>([])
//   const [loading, setLoading] = useState(true)
//   const [error, setError] = useState<string | null>(null)

//   // Tính toán số ngày từ ngày bắt đầu và kết thúc
//   const calculateDuration = (startDate: string, endDate: string): string => {
//     try {
//       const start = new Date(startDate)
//       const end = new Date(endDate)
      
//       // Kiểm tra date hợp lệ
//       if (isNaN(start.getTime()) || isNaN(end.getTime())) {
//         return "Chưa xác định"
//       }
      
//       // Đảm bảo tính toán đúng với timezone
//       start.setHours(0, 0, 0, 0)
//       end.setHours(0, 0, 0, 0)
      
//       const diffTime = end.getTime() - start.getTime()
//       const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1 // +1 để tính cả ngày cuối
      
//       if (diffDays <= 0) {
//         return "1 ngày"
//       }
      
//       const nights = diffDays - 1
//       if (nights === 0) {
//         return "1 ngày"
//       }
      
//       return `${diffDays} ngày ${nights} đêm`
//     } catch (error) {
//       console.error("Lỗi khi tính duration:", error)
//       return "Chưa xác định"
//     }
//   }

//   // Format ngân sách
//   const formatBudget = (amount: string | number, currency: string): string => {
//     const numAmount = typeof amount === "string" ? parseFloat(amount) : amount
//     if (isNaN(numAmount)) return "Chưa cập nhật"
//     const formatted = new Intl.NumberFormat("vi-VN").format(numAmount)
//     return `${formatted} ${currency}`
//   }

//   // Map data từ API sang format hiển thị
//   const mapTripFromAPI = (trip: TripFromAPI): DisplayTrip => {
//     // ✅ Xử lý an toàn với null/undefined
//     const moTa = trip.mo_ta || ""
//     const ngayBatDau = trip.ngay_bat_dau || new Date().toISOString().split("T")[0]
//     const ngayKetThuc = trip.ngay_ket_thuc || ngayBatDau
    
//     const duration = calculateDuration(ngayBatDau, ngayKetThuc)
//     const budget = formatBudget(trip.tong_ngan_sach || 0, trip.tien_te || "VNĐ")
    
//     // ✅ Tạo tags từ mo_ta (kiểm tra null/undefined trước)
//     const tags: string[] = []
//     if (moTa) {
//       const lowerMoTa = moTa.toLowerCase()
//       if (lowerMoTa.includes("biển") || lowerMoTa.includes("beach")) {
//         tags.push("Biển")
//       }
//       if (lowerMoTa.includes("núi") || lowerMoTa.includes("mountain")) {
//         tags.push("Núi")
//       }
//       if (lowerMoTa.includes("văn hóa") || lowerMoTa.includes("culture")) {
//         tags.push("Văn hóa")
//       }
//       if (lowerMoTa.includes("thành phố") || lowerMoTa.includes("city")) {
//         tags.push("Thành phố")
//       }
//     }
//     if (tags.length === 0) {
//       tags.push("Du lịch")
//     }

//     // ✅ Tạo highlights từ mo_ta (kiểm tra null/undefined trước)
//     const highlights: string[] = []
//     if (moTa) {
//       const descriptionLines = moTa.split(".").filter((line) => line.trim().length > 0)
//       highlights.push(...descriptionLines.slice(0, 3).map((line) => line.trim()))
//     }
//     if (highlights.length === 0) {
//       highlights.push("Chuyến đi thú vị")
//     }

//     return {
//       id: String(trip.chuyen_di_id),
//       title: trip.ten_chuyen_di || "Chuyến đi không có tên",
//       description: moTa || "Chưa có mô tả",
//       destination: trip.dia_diem_xuat_phat || "Chưa xác định",
//       duration,
//       startDate: ngayBatDau,
//       endDate: ngayKetThuc,
//       memberCount: trip.tong_thanh_vien || 1,
//       viewCount: 0, // API không trả về, có thể thêm sau
//       rating: 4.5, // API không trả về, có thể thêm sau
//       tags,
//       owner: {
//         name: trip.chu_so_huu_ten || "Người dùng",
//         avatar: trip.chu_so_huu_avatar || "/placeholder-user.jpg",
//       },
//       coverImage: trip.url_avt || "/placeholder.svg",
//       highlights,
//       budget,
//       isVerified: trip.cong_khai === 1,
//     }
//   }

//   // Fetch trips từ API
//   const fetchTrips = useCallback(async () => {
//     setLoading(true)
//     setError(null)

//     try {
//       // ✅ Kiểm tra token theo yêu cầu
//       const token = Cookies.get("token")
//       console.log("Token từ cookie:", token)

//       if (!token || token === "null" || token === "undefined") {
//         console.warn("Không có token → chuyển về /login")
//         router.replace("/login")
//         return
//       }

//       // Gọi API lấy danh sách chuyến đi công khai
//       const response = await axios.get(
//         "https://travel-planner-imdw.onrender.com/api/chuyendi/trang-thai/cong-khai",
//         {
//           headers: {
//             Authorization: `Bearer ${token}`,
//             "Content-Type": "application/json",
//           },
//         }
//       )

//       console.log("✅ API Response:", response.data)

//       // Kiểm tra cấu trúc response
//       const data = response.data?.danh_sach || response.data?.data || []
      
//       if (!Array.isArray(data)) {
//         console.error("❌ Dữ liệu không hợp lệ từ API:", response.data)
//         throw new Error("Dữ liệu không hợp lệ từ API")
//       }

//       console.log(`✅ Nhận được ${data.length} chuyến đi từ API`)

//       // Map data từ API sang format hiển thị (với error handling)
//       const mappedTrips = data
//         .map((trip: any, index: number) => {
//           try {
//             return mapTripFromAPI(trip)
//           } catch (err) {
//             console.error(`❌ Lỗi khi map trip ${index}:`, err, trip)
//             return null
//           }
//         })
//         .filter((trip: DisplayTrip | null): trip is DisplayTrip => trip !== null)
      
//       setTrips(mappedTrips)
//       setFilteredTrips(mappedTrips)
//       console.log(`✅ Đã tải và map thành công ${mappedTrips.length} chuyến đi công khai`)
//     } catch (error: any) {
//       console.error("❌ Lỗi khi tải danh sách chuyến đi:", error)
//       setError("Không thể tải danh sách chuyến đi. Vui lòng thử lại sau.")
      
//       if (axios.isAxiosError(error)) {
//         if (error.response?.status === 401) {
//           toast.error("Phiên đăng nhập đã hết hạn")
//           router.replace("/login")
//         } else {
//           toast.error(error.response?.data?.message || "Có lỗi xảy ra khi tải danh sách chuyến đi")
//         }
//       } else {
//         toast.error("Có lỗi xảy ra khi tải danh sách chuyến đi")
//       }
//     } finally {
//       setLoading(false)
//     }
//   }, [router])

//   // Fetch trips khi component mount
//   useEffect(() => {
//     fetchTrips()
//   }, [fetchTrips])

//   // Filter trips khi searchTerm hoặc selectedFilter thay đổi
//   useEffect(() => {
//     let filtered = trips

//     // Filter by search term
//     if (searchTerm) {
//       const searchLower = searchTerm.toLowerCase()
//       filtered = filtered.filter((trip) => {
//         try {
//           return (
//             (trip.title || "").toLowerCase().includes(searchLower) ||
//             (trip.destination || "").toLowerCase().includes(searchLower) ||
//             trip.tags.some((tag) => (tag || "").toLowerCase().includes(searchLower)) ||
//             (trip.description || "").toLowerCase().includes(searchLower)
//           )
//         } catch (error) {
//           console.error("Lỗi khi filter trip:", error)
//           return false
//         }
//       })
//     }

//     // Filter by category
//     if (selectedFilter !== "all") {
//       filtered = filtered.filter((trip) => {
//         try {
//           switch (selectedFilter) {
//             case "popular":
//               return trip.viewCount > 1000
//             case "verified":
//               return trip.isVerified
//             case "recent":
//               // Lọc các chuyến đi có ngày bắt đầu trong 30 ngày gần đây
//               if (!trip.startDate) return false
//               const thirtyDaysAgo = new Date()
//               thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
//               const startDate = new Date(trip.startDate)
//               return !isNaN(startDate.getTime()) && startDate > thirtyDaysAgo
//             default:
//               return true
//           }
//         } catch (error) {
//           console.error("Lỗi khi filter trip by category:", error)
//           return false
//         }
//       })
//     }

//     setFilteredTrips(filtered)
//   }, [searchTerm, selectedFilter, trips])

//   return (
//     <div className="min-h-screen bg-gradient-to-br from-sky-50 to-blue-50">
//       {/* Header */}
//       {/* <div className="bg-white border-b border-blue-100 sticky top-0 z-50 shadow-sm">
//         <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
//           <div className="flex items-center justify-between">
//             <div className="flex items-center space-x-4">
//               <Link href="/" className="text-2xl font-bold text-blue-600">
//                 TravelPlan
//               </Link>
//               <Badge variant="secondary" className="bg-blue-100 text-blue-700">
//                 Bản Tin Công Khai
//               </Badge>
//             </div>
//             <div className="flex items-center space-x-4">
//               <Link href="/dashboard">
//                 <Button variant="outline" className="border-blue-200 text-blue-600 hover:bg-blue-50">
//                   Về Trang Chủ
//                 </Button>
//               </Link>
//             </div>
//           </div>
//         </div>
//       </div> */}

//       {/* Hero Section */}
//       <div
//         className="relative text-white py-13 bg-cover bg-center bg-no-repeat"
//         style={{
//           backgroundImage: "url('/gg1.jpg')",
//         }}
//       >
//         <div className="absolute inset-0 bg-black/50" />
//         <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center z-10">
//           <motion.h1
//             className="text-5xl md:text-6xl font-bold mb-4"
//             initial={{ opacity: 0, y: 30 }}
//             animate={{ opacity: 1, y: 0 }}
//             transition={{ duration: 0.7 }}
//           >
//             Khám Phá Chuyến Đi
//           </motion.h1>
//           <motion.p
//             className="text-xl md:text-2xl mb-8 text-blue-100 font-light"
//             initial={{ opacity: 0, y: 20 }}
//             animate={{ opacity: 1, y: 0 }}
//             transition={{ duration: 0.7, delay: 0.2 }}
//           >
//             Hàng ngàn lịch trình tuyệt vời từ TravelPlan
//           </motion.p>
//         </div>
//       </div>

//         {/* Sticky Search & Filter Bar - Phiên bản NHỎ GỌN, TINH TẾ */}
//            {/* Sticky Search Bar - CĂN GIỮA HOÀN HẢO */}
//            <div className="sticky top-16 z-40  backdrop-blur-md shadow-sm border-b border-gray-200">
//         <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          
//           {/* CĂN GIỮA TOÀN BỘ */}
//           <div className="flex justify-center">
//             <div className="w-full max-w-4xl">
              
//               <div className="flex flex-col sm:flex-row gap-3 items-center">
//                 {/* Search Input */}
//                 <div className="relative flex-1 max-w-xl w-full">
//                   <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
//                   <Input
//                     placeholder="Tìm điểm đến, hoạt động..."
//                     value={searchTerm}
//                     onChange={(e) => setSearchTerm(e.target.value)}
//                     className="pl-10 pr-4 h-10 text-sm bg-gray-50 border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded-lg placeholder:text-gray-400"
//                   />
//                 </div>

//                 {/* Filter Buttons */}
//                 <div className="flex gap-2">
//                   <Button
//                     variant={selectedFilter === "all" ? "default" : "outline"}
//                     size="sm"
//                     onClick={() => setSelectedFilter("all")}
//                     className="h-9 px-4 text-sm font-medium rounded-lg"
//                   >
//                     Tất cả
//                   </Button>
//                   <Button
//                     variant={selectedFilter === "popular" ? "default" : "outline"}
//                     size="sm"
//                     onClick={() => setSelectedFilter("popular")}
//                     className="h-9 px-4 text-sm font-medium rounded-lg"
//                   >
//                     Phổ biến
//                   </Button>
//                   <Button
//                     variant={selectedFilter === "verified" ? "default" : "outline"}
//                     size="sm"
//                     onClick={() => setSelectedFilter("verified")}
//                     className="h-9 px-4 text-sm font-medium rounded-lg"
//                   >
//                     Đã xác thực
//                   </Button>
//                   <Button
//                     variant={selectedFilter === "recent" ? "default" : "outline"}
//                     size="sm"
//                     onClick={() => setSelectedFilter("recent")}
//                     className="h-9 px-4 text-sm font-medium rounded-lg"
//                   >
//                     Mới nhất
//                   </Button>
//                 </div>
//                 <div className="flex items-center space-x-4">
//               <Link href="/dashboard">
//                 <Button variant="outline" className="border-blue-200 text-blue-600 hover:bg-blue-50">
//                   Về Trang Chủ
//                 </Button>
//               </Link>
//             </div>
//               </div>
              
//             </div>
//           </div>
          
//         </div>
//       </div>

//       {/* Trip Cards */}
//       <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
//         {/* Loading State */}
//         {loading && (
//           <div className="flex flex-col items-center justify-center py-20">
//             <Loader2 className="h-12 w-12 animate-spin text-blue-600 mb-4" />
//             <p className="text-lg text-gray-600">Đang tải danh sách chuyến đi...</p>
//           </div>
//         )}

//         {/* Error State */}
//         {error && !loading && (
//           <motion.div
//             initial={{ opacity: 0 }}
//             animate={{ opacity: 1 }}
//             className="text-center py-20"
//           >
//             <div className="text-red-400 mb-6">
//               <Search className="h-20 w-20 mx-auto" />
//             </div>
//             <h3 className="text-2xl font-bold text-gray-800 mb-3">Có lỗi xảy ra</h3>
//             <p className="text-gray-600 text-lg mb-4">{error}</p>
//             <Button onClick={() => fetchTrips()} className="bg-blue-600 hover:bg-blue-700">
//               Thử lại
//             </Button>
//           </motion.div>
//         )}

//         {/* Trip Cards Grid */}
//         {!loading && !error && (
//     <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
//     {filteredTrips.map((trip, index) => (
//       <motion.div
//         key={trip.id}
//         initial={{ opacity: 0, scale: 0.95 }}
//         animate={{ opacity: 1, scale: 1 }}
//         transition={{ duration: 0.4, delay: index * 0.05 }}
//         className="group"
//       >
//         <Link href={`/feed/${trip.id}`} className="block h-full">
//           <Card className="h-full overflow-hidden rounded-2xl border-0 shadow-lg hover:shadow-2xl transition-all duration-300 bg-white group-hover:-translate-y-2">
//             {/* Cover Image - Tỉ lệ đẹp hơn */}
//             <div className="relative aspect-[4/3] overflow-hidden bg-gray-100">
//               <img
//                 src={trip.coverImage || "/placeholder.svg"}
//                 alt={trip.title}
//                 className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
//               />
//               <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              
//               {/* Badges góc trên */}
//               <div className="absolute top-3 right-3 flex flex-col gap-2">
//                 {trip.isVerified && (
//                   <Badge className="bg-emerald-500 text-white text-xs font-medium px-2 py-1 shadow-md">
//                     <Star className="h-3 w-3 mr-1" />
//                     Đã xác thực
//                   </Badge>
//                 )}
//                 <Badge className="bg-white/90 backdrop-blur text-gray-800 text-xs font-medium px-2 py-1">
//                   <Eye className="h-3 w-3 mr-1" />
//                   {trip.viewCount > 999 ? `${(trip.viewCount/1000).toFixed(1)}k` : trip.viewCount}
//                 </Badge>
//               </div>

//               {/* Budget nổi bật góc dưới trái */}
//               <div className="absolute bottom-3 left-3">
//                 <span className="bg-blue-600 text-white px-3 py-1.5 rounded-full text-sm font-bold shadow-lg">
//                   {trip.budget}
//                 </span>
//               </div>
//             </div>

//             <CardContent className="p-4 space-y-3">
//               {/* Title - ngắn gọn hơn */}
//               <h3 className="font-bold text-lg text-gray-900 line-clamp-2 leading-tight">
//                 {trip.title}
//               </h3>

//               {/* Destination + Duration - ngang hàng, gọn */}
//               <div className="flex items-center gap-4 text-sm text-gray-600">
//                 <div className="flex items-center gap-1.5">
//                   <MapPin className="h-4 w-4 text-blue-600" />
//                   <span className="font-medium">{trip.destination}</span>
//                 </div>
//                 <div className="flex items-center gap-1.5">
//                   <Calendar className="h-4 w-4 text-blue-600" />
//                   <span>{trip.duration}</span>
//                 </div>
//               </div>

//               {/* Owner + Rating - nhỏ gọn */}
//               <div className="flex items-center justify-between">
//                 <div className="flex items-center gap-2">
//                   <Avatar className="h-8 w-8">
//                     <AvatarImage src={trip.owner.avatar} />
//                     <AvatarFallback className="text-xs">
//                       {trip.owner.name[0]}
//                     </AvatarFallback>
//                   </Avatar>
//                   <span className="text-sm font-medium text-gray-800">
//                     {trip.owner.name.split(" ").slice(-1)}
//                   </span>
//                 </div>
//                 <div className="flex items-center gap-1">
//                   <Star className="h-4 w-4 text-yellow-500 fill-current" />
//                   <span className="text-sm font-bold text-gray-700">{trip.rating}</span>
//                 </div>
//               </div>

//               {/* Tags - nhỏ, tối đa 3 */}
//               <div className="flex flex-wrap gap-1.5">
//                 {trip.tags.slice(0, 3).map((tag) => (
//                   <Badge
//                     key={tag}
//                     variant="secondary"
//                     className="text-xs py-0.5 px-2 bg-blue-50 text-blue-700"
//                   >
//                     {tag}
//                   </Badge>
//                 ))}
//                 {trip.tags.length > 3 && (
//                   <span className="text-xs text-gray-500">+{trip.tags.length - 3}</span>
//                 )}
//               </div>

//               {/* Thành viên */}
//               <div className="flex items-center justify-between text-sm">
//                 <div className="flex items-center gap-1.5 text-gray-600">
//                   <Users className="h-4 w-4 text-blue-600" />
//                   <span>{trip.memberCount} thành viên</span>
//                 </div>
//                 <Button
//                   variant="ghost"
//                   size="sm"
//                   className="text-blue-600 hover:bg-blue-50 -mr-2"
//                   onClick={(e) => {
//                     e.preventDefault();
//                     e.stopPropagation();
//                     // handle download
//                   }}
//                 >
//                   <Download className="h-4 w-4" />
//                 </Button>
//               </div>
//             </CardContent>
//           </Card>
//         </Link>
//       </motion.div>
//     ))}
//   </div>
// )}

//         {/* No Results */}
//         {!loading && !error && filteredTrips.length === 0 && (
//           <motion.div
//             initial={{ opacity: 0 }}
//             animate={{ opacity: 1 }}
//             className="text-center py-20"
//           >
//             <div className="text-gray-400 mb-6">
//               <Search className="h-20 w-20 mx-auto" />
//             </div>
//             <h3 className="text-2xl font-bold text-gray-800 mb-3">Không tìm thấy lịch trình nào</h3>
//             <p className="text-gray-600 text-lg">Thử thay đổi từ khóa hoặc bộ lọc của bạn</p>
//           </motion.div>
//         )}
//       </div>

//       {/* Footer */}
//       <footer className="bg-white border-t border-blue-100 mt-20">
//         <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
//           <div className="text-center text-gray-600">
//             <p className="text-sm">&copy; 2024 TravelPlan. Tất cả quyền được bảo lưu.</p>
//             <p className="text-xs mt-2 text-gray-500">Made with love in Vietnam</p>
//           </div>
//         </div>
//       </footer>
//     </div>
//   )
// }
"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import axios from "axios"
import Cookies from "js-cookie"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Search, MapPin, Calendar, Users, Eye, Download, Star, Loader2 } from "lucide-react"
import { motion } from "framer-motion"
import Link from "next/link"
import { toast } from "sonner"

// Interface cho trip từ API (cho phép null/undefined)
interface TripFromAPI {
  chuyen_di_id: number
  ten_chuyen_di: string | null
  mo_ta: string | null
  url_avt: string | null
  dia_diem_xuat_phat: string | null
  ngay_bat_dau: string | null
  ngay_ket_thuc: string | null
  chu_so_huu_id: number
  tien_te: string | null
  trang_thai: string | null
  tong_ngan_sach: string | number | null
  tao_luc: string | null
  cong_khai: number | null
  chu_so_huu_ten: string | null
  chu_so_huu_avatar: string | null
  tong_thanh_vien: number | null
}

// Interface cho trip hiển thị
interface DisplayTrip {
  id: string
  title: string
  description: string
  destination: string
  duration: string
  startDate: string
  endDate: string
  memberCount: number
  viewCount: number
  rating: number
  tags: string[]
  owner: {
    name: string
    avatar: string
  }
  coverImage: string
  highlights: string[]
  budget: string
  isVerified: boolean
}

export default function PublicFeedPage() {
  const router = useRouter()
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedFilter, setSelectedFilter] = useState("all")
  const [trips, setTrips] = useState<DisplayTrip[]>([])
  const [filteredTrips, setFilteredTrips] = useState<DisplayTrip[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Tính toán số ngày từ ngày bắt đầu và kết thúc
  const calculateDuration = (startDate: string, endDate: string): string => {
    try {
      const start = new Date(startDate)
      const end = new Date(endDate)
      
      // Kiểm tra date hợp lệ
      if (isNaN(start.getTime()) || isNaN(end.getTime())) {
        return "Chưa xác định"
      }
      
      // Đảm bảo tính toán đúng với timezone
      start.setHours(0, 0, 0, 0)
      end.setHours(0, 0, 0, 0)
      
      const diffTime = end.getTime() - start.getTime()
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1 // +1 để tính cả ngày cuối
      
      if (diffDays <= 0) {
        return "1 ngày"
      }
      
      const nights = diffDays - 1
      if (nights === 0) {
        return "1 ngày"
      }
      
      return `${diffDays} ngày ${nights} đêm`
    } catch (error) {
      console.error("Lỗi khi tính duration:", error)
      return "Chưa xác định"
    }
  }

  // Format ngân sách
  const formatBudget = (amount: string | number, currency: string): string => {
    const numAmount = typeof amount === "string" ? parseFloat(amount) : amount
    if (isNaN(numAmount)) return "Chưa cập nhật"
    const formatted = new Intl.NumberFormat("vi-VN").format(numAmount)
    return `${formatted} ${currency}`
  }

  // Map data từ API sang format hiển thị
  const mapTripFromAPI = (trip: TripFromAPI): DisplayTrip => {
    // ✅ Xử lý an toàn với null/undefined
    const moTa = trip.mo_ta || ""
    const ngayBatDau = trip.ngay_bat_dau || new Date().toISOString().split("T")[0]
    const ngayKetThuc = trip.ngay_ket_thuc || ngayBatDau
    
    const duration = calculateDuration(ngayBatDau, ngayKetThuc)
    const budget = formatBudget(trip.tong_ngan_sach || 0, trip.tien_te || "VNĐ")
    
    // ✅ Tạo tags từ mo_ta (kiểm tra null/undefined trước)
    const tags: string[] = []
    if (moTa) {
      const lowerMoTa = moTa.toLowerCase()
      if (lowerMoTa.includes("biển") || lowerMoTa.includes("beach")) {
        tags.push("Biển")
      }
      if (lowerMoTa.includes("núi") || lowerMoTa.includes("mountain")) {
        tags.push("Núi")
      }
      if (lowerMoTa.includes("văn hóa") || lowerMoTa.includes("culture")) {
        tags.push("Văn hóa")
      }
      if (lowerMoTa.includes("thành phố") || lowerMoTa.includes("city")) {
        tags.push("Thành phố")
      }
    }
    if (tags.length === 0) {
      tags.push("Du lịch")
    }

    // ✅ Tạo highlights từ mo_ta (kiểm tra null/undefined trước)
    const highlights: string[] = []
    if (moTa) {
      const descriptionLines = moTa.split(".").filter((line) => line.trim().length > 0)
      highlights.push(...descriptionLines.slice(0, 3).map((line) => line.trim()))
    }
    if (highlights.length === 0) {
      highlights.push("Chuyến đi thú vị")
    }

    return {
      id: String(trip.chuyen_di_id),
      title: trip.ten_chuyen_di || "Chuyến đi không có tên",
      description: moTa || "Chưa có mô tả",
      destination: trip.dia_diem_xuat_phat || "Chưa xác định",
      duration,
      startDate: ngayBatDau,
      endDate: ngayKetThuc,
      memberCount: trip.tong_thanh_vien || 1,
      viewCount: 0, // API không trả về, có thể thêm sau
      rating: 4.5, // API không trả về, có thể thêm sau
      tags,
      owner: {
        name: trip.chu_so_huu_ten || "Người dùng",
        avatar: trip.chu_so_huu_avatar || "/placeholder-user.jpg",
      },
      coverImage: trip.url_avt || "/placeholder.svg",
      highlights,
      budget,
      isVerified: trip.cong_khai === 1,
    }
  }

  // Fetch trips từ API
  const fetchTrips = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      // ✅ Kiểm tra token theo yêu cầu
      const token = Cookies.get("token")
      console.log("Token từ cookie:", token)

      if (!token || token === "null" || token === "undefined") {
        console.warn("Không có token → chuyển về /login")
        router.replace("/login")
        return
      }

      // Gọi API lấy danh sách chuyến đi công khai
      const response = await axios.get(
        "https://travel-planner-imdw.onrender.com/api/chuyendi/trang-thai/cong-khai",
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      )

      console.log("✅ API Response:", response.data)

      // Kiểm tra cấu trúc response
      const data = response.data?.danh_sach || response.data?.data || []
      
      if (!Array.isArray(data)) {
        console.error("❌ Dữ liệu không hợp lệ từ API:", response.data)
        throw new Error("Dữ liệu không hợp lệ từ API")
      }

      console.log(`✅ Nhận được ${data.length} chuyến đi từ API`)

      // Map data từ API sang format hiển thị (với error handling)
      const mappedTrips = data
        .map((trip: any, index: number) => {
          try {
            return mapTripFromAPI(trip)
          } catch (err) {
            console.error(`❌ Lỗi khi map trip ${index}:`, err, trip)
            return null
          }
        })
        .filter((trip: DisplayTrip | null): trip is DisplayTrip => trip !== null)
      
      setTrips(mappedTrips)
      setFilteredTrips(mappedTrips)
      console.log(`✅ Đã tải và map thành công ${mappedTrips.length} chuyến đi công khai`)
    } catch (error: any) {
      console.error("❌ Lỗi khi tải danh sách chuyến đi:", error)
      setError("Không thể tải danh sách chuyến đi. Vui lòng thử lại sau.")
      
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 401) {
          toast.error("Phiên đăng nhập đã hết hạn")
          router.replace("/login")
        } else {
          toast.error(error.response?.data?.message || "Có lỗi xảy ra khi tải danh sách chuyến đi")
        }
      } else {
        toast.error("Có lỗi xảy ra khi tải danh sách chuyến đi")
      }
    } finally {
      setLoading(false)
    }
  }, [router])

  // Fetch trips khi component mount
  useEffect(() => {
    fetchTrips()
  }, [fetchTrips])

  // Filter trips khi searchTerm hoặc selectedFilter thay đổi
  useEffect(() => {
    let filtered = trips

    // Filter by search term
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase()
      filtered = filtered.filter((trip) => {
        try {
          return (
            (trip.title || "").toLowerCase().includes(searchLower) ||
            (trip.destination || "").toLowerCase().includes(searchLower) ||
            trip.tags.some((tag) => (tag || "").toLowerCase().includes(searchLower)) ||
            (trip.description || "").toLowerCase().includes(searchLower)
          )
        } catch (error) {
          console.error("Lỗi khi filter trip:", error)
          return false
        }
      })
    }

    // Filter by category
    if (selectedFilter !== "all") {
      filtered = filtered.filter((trip) => {
        try {
          switch (selectedFilter) {
            case "popular":
              return trip.viewCount > 1000
            case "verified":
              return trip.isVerified
            case "recent":
              // Lọc các chuyến đi có ngày bắt đầu trong 30 ngày gần đây
              if (!trip.startDate) return false
              const thirtyDaysAgo = new Date()
              thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
              const startDate = new Date(trip.startDate)
              return !isNaN(startDate.getTime()) && startDate > thirtyDaysAgo
            default:
              return true
          }
        } catch (error) {
          console.error("Lỗi khi filter trip by category:", error)
          return false
        }
      })
    }

    setFilteredTrips(filtered)
  }, [searchTerm, selectedFilter, trips])

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-50 to-blue-50">
      {/* Header */}
      {/* <div className="bg-white border-b border-blue-100 sticky top-0 z-50 shadow-sm">
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
      </div> */}

      {/* Hero Section */}
      <div
        className="relative text-white py-13 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: "url('/gg1.jpg')",
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

      {/* Sticky Search & Filter Bar - Chỉ bo tròn phần này */}
      <div className="sticky top-0 z-40 backdrop-blur-xl shadow-sm border-b border-gray-200/30 bg-white/50 rounded-b-3xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          
          {/* CĂN GIỮA TOÀN BỘ - Giữ nguyên layout cũ */}
          <div className="flex justify-center">
            <div className="w-full max-w-4xl">
              
              <div className="flex flex-col sm:flex-row gap-3 items-center">
                {/* Search Input - Bo tròn */}
                <div className="relative flex-1 max-w-xl w-full">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    placeholder="Tìm điểm đến, hoạt động..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 pr-4 h-10 text-sm bg-white/40 border-gray-300/40 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded-2xl placeholder:text-gray-400 backdrop-blur-sm"
                  />
                </div>

                {/* Filter Buttons - Bo tròn */}
                <div className="flex gap-2">
                  <Button
                    variant={selectedFilter === "all" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSelectedFilter("all")}
                    className="h-9 px-4 text-sm font-medium rounded-xl bg-white/40 backdrop-blur-sm border-gray-300/40"
                  >
                    Tất cả
                  </Button>
                  <Button
                    variant={selectedFilter === "popular" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSelectedFilter("popular")}
                    className="h-9 px-4 text-sm font-medium rounded-xl bg-white/40 backdrop-blur-sm border-gray-300/40"
                  >
                    Phổ biến
                  </Button>
                  <Button
                    variant={selectedFilter === "verified" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSelectedFilter("verified")}
                    className="h-9 px-4 text-sm font-medium rounded-xl bg-white/40 backdrop-blur-sm border-gray-300/40"
                  >
                    Đã xác thực
                  </Button>
                  <Button
                    variant={selectedFilter === "recent" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSelectedFilter("recent")}
                    className="h-9 px-4 text-sm font-medium rounded-xl bg-white/40 backdrop-blur-sm border-gray-300/40"
                  >
                    Mới nhất
                  </Button>
                </div>
                <div className="flex items-center space-x-4">
              <Link href="/dashboard">
                <Button variant="outline" className="border-blue-200/40 text-blue-600 hover:bg-blue-50/40 bg-white/40 backdrop-blur-sm rounded-xl">
                  Về Trang Chủ
                </Button>
              </Link>
            </div>
              </div>
              
            </div>
          </div>
          
        </div>
      </div>

      {/* Trip Cards - Giữ nguyên */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Loading State */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="h-12 w-12 animate-spin text-blue-600 mb-4" />
            <p className="text-lg text-gray-600">Đang tải danh sách chuyến đi...</p>
          </div>
        )}

        {/* Error State */}
        {error && !loading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-20"
          >
            <div className="text-red-400 mb-6">
              <Search className="h-20 w-20 mx-auto" />
            </div>
            <h3 className="text-2xl font-bold text-gray-800 mb-3">Có lỗi xảy ra</h3>
            <p className="text-gray-600 text-lg mb-4">{error}</p>
            <Button onClick={() => fetchTrips()} className="bg-blue-600 hover:bg-blue-700">
              Thử lại
            </Button>
          </motion.div>
        )}

        {/* Trip Cards Grid */}
        {!loading && !error && (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
    {filteredTrips.map((trip, index) => (
      <motion.div
        key={trip.id}
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4, delay: index * 0.05 }}
        className="group"
      >
        <Link href={`/feed/${trip.id}`} className="block h-full">
          <Card className="h-full overflow-hidden rounded-2xl border-0 shadow-lg hover:shadow-2xl transition-all duration-300 bg-white group-hover:-translate-y-2">
            {/* Cover Image - Tỉ lệ đẹp hơn */}
            <div className="relative aspect-[4/3] overflow-hidden bg-gray-100">
              <img
                src={trip.coverImage || "/placeholder.svg"}
                alt={trip.title}
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              
              {/* Xác thực */}
              <div className="absolute top-3 right-3 flex flex-col gap-2">
                {trip.isVerified && (
                  <Badge className="bg-emerald-500 text-white text-xs font-medium px-2 py-1 shadow-md">
                    <Star className="h-3 w-3 mr-1" />
                    
                  </Badge>
                )}
                {/* mắt nhìn */}
                {/* <Badge className="bg-white/90 backdrop-blur text-gray-800 text-xs font-medium px-2 py-1">
                  <Eye className="h-3 w-3 mr-1" />
                  {trip.viewCount > 999 ? `${(trip.viewCount/1000).toFixed(1)}k` : trip.viewCount}
                </Badge> */}
              </div>

              {/* Budget nổi bật góc dưới trái */}
              <div className="absolute bottom-3 left-3">
                <span className="bg-blue-600 text-white px-3 py-1.5 rounded-full text-sm font-bold shadow-lg">
                  {trip.budget}
                </span>
              </div>
            </div>

            <CardContent className="p-4 space-y-3">
              {/* Title - ngắn gọn hơn */}
              <h3 className="font-bold text-lg text-gray-900 line-clamp-2 leading-tight">
                {trip.title}
              </h3>

              {/* Destination + Duration - ngang hàng, gọn */}
              <div className="flex items-center gap-4 text-sm text-gray-600">
                <div className="flex items-center gap-1.5">
                  <MapPin className="h-4 w-4 text-blue-600" />
                  <span className="font-medium">{trip.destination}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Calendar className="h-4 w-4 text-blue-600" />
                  <span>{trip.duration}</span>
                </div>
              </div>

              {/* Owner + Rating - nhỏ gọn */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={trip.owner.avatar} />
                    <AvatarFallback className="text-xs">
                      {trip.owner.name[0]}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-sm font-medium text-gray-800">
                    {trip.owner.name.split(" ").slice(-1)}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <Star className="h-4 w-4 text-yellow-500 fill-current" />
                  <span className="text-sm font-bold text-gray-700">{trip.rating}</span>
                </div>
              </div>

              {/* Tags - nhỏ, tối đa 3 */}
              <div className="flex flex-wrap gap-1.5">
                {trip.tags.slice(0, 3).map((tag) => (
                  <Badge
                    key={tag}
                    variant="secondary"
                    className="text-xs py-0.5 px-2 bg-blue-50 text-blue-700"
                  >
                    {tag}
                  </Badge>
                ))}
                {trip.tags.length > 3 && (
                  <span className="text-xs text-gray-500">+{trip.tags.length - 3}</span>
                )}
              </div>

              {/* Thành viên */}
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-1.5 text-gray-600">
                  <Users className="h-4 w-4 text-blue-600" />
                  <span>{trip.memberCount} thành viên</span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-blue-600 hover:bg-blue-50 -mr-2"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    // handle download
                  }}
                >
                  <Download className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </Link>
      </motion.div>
    ))}
  </div>
)}

        {/* No Results */}
        {!loading && !error && filteredTrips.length === 0 && (
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