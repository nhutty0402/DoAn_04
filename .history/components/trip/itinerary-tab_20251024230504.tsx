"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Cookies from "js-cookie"
import axios from "axios"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Plus, Calendar, Clock, MapPin, GripVertical, Edit, Trash2, AlertCircle } from "lucide-react"
import { AddDayModal } from "@/components/itinerary/add-day-modal"
import { AddPoiModal } from "@/components/itinerary/add-poi-modal"
import { EditDayModal } from "@/components/itinerary/edit-day-modal"
import { Badge } from "@/components/ui/badge"
import { motion, Reorder } from "framer-motion"
import { useToast } from "@/hooks/use-toast"

// Mock itinerary data (không thay đổi)
const mockItinerary = [
  {
    id: "day1",
    ngay: "2024-03-15",
    tieuDe: "Ngày 1: Khám phá trung tâm Đà Nẵng",
    ghiChu: "Tham quan các điểm nổi tiếng trong thành phố",
    pois: [
      {
        id: "poi1",
        tenDiaDiem: "Cầu Rồng",
        loaiDiaDiem: "landmark",
        gioBatDau: "09:00",
        gioKetThuc: "10:30",
        ghiChu: "Xem rồng phun lửa vào cuối tuần",
        toaDo: { lat: 16.0544, lng: 108.2272 },
        thoiGianDiChuyen: 0,
      },
    ],
  },
  {
    id: "day2",
    ngay: "2024-03-16",
    tieuDe: "Ngày 2: Hội An cổ kính",
    ghiChu: "Khám phá phố cổ Hội An",
    pois: [
      {
        id: "poi4",
        tenDiaDiem: "Phố cổ Hội An",
        loaiDiaDiem: "historic",
        gioBatDau: "08:00",
        gioKetThuc: "12:00",
        ghiChu: "Tham quan các ngôi nhà cổ",
        toaDo: { lat: 15.8801, lng: 108.338 },
        thoiGianDiChuyen: 45,
      },
    ],
  },
]

interface ItineraryTabProps {
  tripId: string
}

export function ItineraryTab({ tripId }: ItineraryTabProps) {
  const [days, setDays] = useState<any[]>([])
  const [showAddDayModal, setShowAddDayModal] = useState(false)
  const [showAddPoiModal, setShowAddPoiModal] = useState<string | null>(null)
  const [editingDay, setEditingDay] = useState<any>(null)
  const [isAddingDay, setIsAddingDay] = useState(false)
  const [isLoadingDays, setIsLoadingDays] = useState(false)
  const { toast } = useToast()
  const router = useRouter()

  // Fetch days from API when tripId changes
  useEffect(() => {
    const fetchDays = async () => {
      setIsLoadingDays(true)
      const token = Cookies.get("token")
      console.log("Token từ cookie:", token)

      if (!token || token === "null" || token === "undefined") {
        console.warn("Không có token → chuyển về /login")
        router.replace("/login")
        setIsLoadingDays(false)
        return
      }

      try {
        // ⚠️ CẢNH BÁO: LỖI 404 TRONG ẢNH CỦA BẠN LÀ DO URL NÀY SAI
        // BẠN CẦN THAY THẾ BẰNG URL ĐÚNG TỪ BACKEND
        const url = `https://travel-planner-imdw.onrender.com/api/lich-trinh-ngay/?chuyen_di_id=${encodeURIComponent(
          tripId,
        )}`
        const res = await axios.get(url, {
          headers: { Authorization: `Bearer ${token}` },
        })

        const items = Array.isArray(res.data) ? res.data : res.data.data || []

        const mapped = items.map((item: any) => ({
          id: item.lich_trinh_ngay_id ?? item.id ?? `day-${Math.random().toString(36).slice(2, 9)}`,
          ngay: item.ngay,
          tieuDe: item.tieu_de ?? item.tieuDe ?? "",
          ghiChu: item.ghi_chu ?? item.ghiChu ?? "",
          pois: item.pois ?? [],
        }))

        setDays(mapped)
      } catch (error) {
        console.error("Failed to fetch itinerary days:", error) // Lỗi 404 sẽ log ra ở đây
        toast({
          title: "Lỗi khi tải lịch trình",
          description: "Không thể tải danh sách ngày. Sẽ hiển thị dữ liệu mẫu tạm thời.",
          variant: "destructive",
        })
        setDays(mockItinerary)
      } finally {
        setIsLoadingDays(false)
      }
    }

    if (tripId) fetchDays()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tripId])

  const getPoiTypeLabel = (type: string) => {
    // ... (hàm này không thay đổi) ...
    const types = {
      landmark: { label: "Địa danh", color: "bg-blue-100 text-blue-800" },
      restaurant: { label: "Nhà hàng", color: "bg-green-100 text-green-800" },
      hotel: { label: "Khách sạn", color: "bg-purple-100 text-purple-800" },
      shopping: { label: "Mua sắm", color: "bg-yellow-100 text-yellow-800" },
      beach: { label: "Bãi biển", color: "bg-cyan-100 text-cyan-800" },
      historic: { label: "Lịch sử", color: "bg-orange-100 text-orange-800" },
    }
    return types[type as keyof typeof types] || types.landmark
  }

  const checkTimeOverlap = (dayId: string, newPoi: any) => {
    // ... (hàm này không thay đổi) ...
    const day = days.find((d) => d.id === dayId)
    if (!day) return []

    const newStart = new Date(`2024-01-01 ${newPoi.gioBatDau}`)
    const newEnd = new Date(`2024-01-01 ${newPoi.gioKetThuc}`)

    return day.pois.filter((poi: any) => {
      if (poi.id === newPoi.id) return false
      const poiStart = new Date(`2024-01-01 ${poi.gioBatDau}`)
      const poiEnd = new Date(`2024-01-01 ${poi.gioKetThuc}`)
      return newStart < poiEnd && newEnd > poiStart
    })
  }

  // <-- SỬA LẠI HOÀN TOÀN HÀM NÀY -->
  const handleAddDay = async (dayData: any) => {
    if (isAddingDay) return
    setIsAddingDay(true)
    
    const token = Cookies.get("token")
    console.log("Token từ cookie:", token)

    if (!token || token === "null" || token === "undefined") {
      console.warn("Không có token → chuyển về /login")
      toast({
        title: "Lỗi xác thực",
        description: "Không tìm thấy token. Đang chuyển về trang đăng nhập.",
        variant: "destructive",
      })
      router.replace("/login")
      setIsAddingDay(false)
      return
    }

    try {
      const payload = {
        chuyen_di_id: tripId,
        ngay: dayData.ngay,
        tieu_de: dayData.tieuDe,
        ghi_chu: dayData.ghiChu,
      }

      // ✅ ===== SỬA LỖI 404 (POST) TẠI ĐÂY =====
      // Thêm dấu gạch chéo (/) vào cuối URL
      const response = await axios.post(
        "https://travel-planner-imdw.onrender.com/api/lich-trinh-ngay/", // <-- ĐÃ SỬA
        payload,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      )
      // =========================================

      const newDayFromApi = response.data

      const newDayForState = {
        id: newDayFromApi.id, 
        ngay: newDayFromApi.ngay,
        tieuDe: newDayFromApi.tieu_de,
        ghiChu: newDayFromApi.ghi_chu,
        pois: [],
      }

      setDays([...days, newDayForState])
      setShowAddDayModal(false)
      toast({
        title: "Đã thêm ngày mới",
        description: "Ngày mới đã được thêm vào lịch trình",
      })
    } catch (error) {
      console.error("Lỗi khi thêm ngày:", error) // Lỗi 404 (POST) sẽ log ra ở đây

      if (axios.isAxiosError(error) && error.response?.status === 401) {
        toast({
          title: "Phiên đăng nhập hết hạn",
          description: "Token không hợp lệ hoặc đã hết hạn. Vui lòng đăng nhập lại.",
          variant: "destructive",
        })
        router.replace("/login")
      } else {
        toast({
          title: "Lỗi",
          description: "Không thể thêm ngày mới. Vui lòng thử lại.",
          variant: "destructive",
        })
      }
    } finally {
      setIsAddingDay(false)
    }
  }

  // --- CÁC HÀM BÊN DƯỚI LÀ HÀM LOCAL (CHƯA GỌI API) ---
  // --- KHI BẠN TẢI LẠI TRANG, THAY ĐỔI SẼ BỊ MẤT ---

  const handleAddPoi = (dayId: string, poiData: any) => {
    // TODO: Cần gọi API (POST) để thêm POI
    const overlaps = checkTimeOverlap(dayId, poiData)

    if (overlaps.length > 0) {
      toast({
        title: "Cảnh báo trùng giờ",
        description: `Thời gian trùng với ${overlaps.length} điểm khác`,
        variant: "destructive",
      })
    }

    const newPoi = {
      id: `poi${Date.now()}`,
      ...poiData,
      thoiGianDiChuyen: Math.floor(Math.random() * 30) + 5,
    }

    setDays(
      days.map((day) =>
        day.id === dayId
          ? { ...day, pois: [...day.pois, newPoi].sort((a, b) => a.gioBatDau.localeCompare(b.gioBatDau)) }
          : day,
      ),
    )
    setShowAddPoiModal(null)
    toast({
      title: "Đã thêm điểm đến (Local)",
      description: "Điểm đến mới đã được thêm vào giao diện",
    })
  }

  const handleDeletePoi = (dayId: string, poiId: string) => {
    // TODO: Cần gọi API (DELETE) để xóa POI
    setDays(days.map((day) => (day.id === dayId ? { ...day, pois: day.pois.filter((poi: any) => poi.id !== poiId) } : day)))
    toast({
      title: "Đã xóa điểm đến (Local)",
      description: "Điểm đến đã được xóa khỏi giao diện",
    })
  }

  const handleReorderDays = (newOrder: any[]) => {
    // TODO: Cần gọi API (PUT/PATCH) để cập nhật thứ tự
    setDays(newOrder)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground font-[family-name:var(--font-space-grotesk)]">
            Lịch Trình Chi Tiết
          </h2>
        </div>
        <Button onClick={() => setShowAddDayModal(true)} className="bg-primary hover:bg-primary/90">
          <Plus className="h-4 w-4 mr-2" />
          Thêm Ngày
        </Button>
      </div>

      {/* Timeline */}
      <div className="space-y-6">
        <Reorder.Group axis="y" values={days} onReorder={handleReorderDays}>
          {days.map((day, dayIndex) => (
            <Reorder.Item key={day.id} value={day}>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: dayIndex * 0.1 }}
              >
                <Card className="border-l-4 border-l-primary">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <GripVertical className="h-5 w-5 text-muted-foreground cursor-grab" />
                        <div>
                    T       <CardTitle className="font-[family-name:var(--font-space-grotesk)]">{day.tieuDe}</CardTitle>
                          <div className="flex items-center gap-2 mt-1">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm text-muted-foreground">
                              {new Date(day.ngay).toLocaleDateString("vi-VN", {
                                weekday: "long",
                                year: "numeric",
IC                             month: "long",
                                day: "numeric",
                              })}
                            </span>
                          </div>
                          {day.ghiChu && (
                            <p className="text-sm text-muted-foreground mt-1 font-[family-name:var(--font-dm-sans)]">
                              {day.ghiChu}
                            </p>
                          )}
                        </div>
                      </div>
                       <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm" onClick={() => setEditingDay(day)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setShowAddPoiModal(day.id)}
                          className="bg-primary/10 hover:bg-primary/20 text-primary border-primary/20"
                        >
                          <Plus className="h-4 w-4 mr-1" />
                        Thêm Điểm
                        </Button>
                   </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {day.pois.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        <MapPin className="h-8 w-8 mx-auto mb-2 opacity-50" />
                        <p>Chưa có điểm đến nào</p>
                        <Button variant="ghost" size="sm" onClick={() => setShowAddPoiModal(day.id)} className="mt-2">
                          Thêm điểm đến đầu tiên
                        </Button>
                      </div>
                    ) : (
                  <div className="space-y-4">
                        {day.pois.map((poi: any, poiIndex: number) => (
                         <div key={poi.id} className="flex items-start gap-4 p-4 bg-muted/30 rounded-lg">
                           <div className="flex flex-col items-center">
                              <div className="w-3 h-3 bg-primary rounded-full" />
                              {poiIndex < day.pois.length - 1 && <div className="w-0.5 h-8 bg-border mt-2" />}
                            </div>

                            <div className="flex-1 min-w-0">
                             <div className="flex items-start justify-between">
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-1">
                                    <h4 className="font-semibold text-foreground">{poi.tenDiaDiem}</h4>
                                  <Badge
                                      className={`text-xs ${getPoiTypeLabel(poi.loaiDiaDiem).color}`}
s                                     variant="secondary"
                                    >
                                      {getPoiTypeLabel(poi.loaiDiaDiem).label}
A                                   </Badge>
                                  </div>

                                  <div className="flex items-center gap-4 text-sm text-muted-foreground mb-2">
                                    <div className="flex items-center gap-1">
                                      <Clock className="h-4 w-4" />
                                      <span>
                                        {poi.gioBatDau} - {poi.gioKetThuc}
                                      </span>
                                    </div>
                                    {poi.thoiGianDiChuyen > 0 && (
s                                     <div className="flex items-center gap-1 text-orange-600">
                                        <AlertCircle className="h-4 w-4" />
                                        <span>{poi.thoiGianDiChuyen} phút di chuyển</span>
E                                     </div>
                                    )}
                                  </div>

                                  {poi.ghiChu && (
Ai                                 <p className="text-sm text-muted-foreground font-[family-name:var(--font-dm-sans)]">
                                      {poi.ghiChu}
                                    </p>
                                  )}
                                </div>

is                               <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleDeletePoi(day.id, poi.id)}
                                  className="text-muted-foreground hover:text-destructive"
s                               >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
Z                         </div>
                        ))}
                      </div>
D                   )}
                  </CardContent>
                </Card>
              </motion.div>
            </Reorder.Item>
          ))}
        </Reorder.Group>
      </div>

      {/* ... (phần không có lịch trình không đổi) ... */}
A     {days.length === 0 && (
        <div className="text-center py-12">
          <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-foreground mb-2">Chưa có lịch trình</h3>
          <p className="text-muted-foreground mb-4">Bắt đầu bằng cách thêm ngày đầu tiên</p>
          <Button onClick={() => setShowAddDayModal(true)} className="bg-primary hover:bg-primary/90">
            <Plus className="h-4 w-4 mr-2" />
            Thêm Ngày Đầu Tiên
          </Button>
        </div>
      )}

      {/* Modals */}
      {/* <-- SỬA LỖI: Xóa prop 'isLoading' khỏi lời gọi để tránh crash --> */}
Z     {showAddDayModal && (
        <AddDayModal
          onClose={() => setShowAddDayModal(false)}
          onSubmit={handleAddDay}
          // isLoading={isAddingDay} // <-- Bạn đã comment dòng này, hãy đảm bảo AddDayModal có nhận prop này
        />
      )}

      {showAddPoiModal && (
        <AddPoiModal dayId={showAddPoiModal} onClose={() => setShowAddPoiModal(null)} onSubmit={handleAddPoi} />
      )}

      {editingDay && (
        <EditDayModal
          day={editingDay}
          onClose={() => setEditingDay(null)}
          onSubmit={(dayData) => {
            // TODO: Cần gọi API (PUT/PATCH) để cập nhật ngày
            setDays(days.map((day) => (day.id === editingDay.id ? { ...day, ...dayData } : day)))
            setEditingDay(null)
            toast({
              title: "Đã cập nhật ngày (Local)",
              description: "Thông tin ngày đã được cập nhật trên giao diện",
            })
          }}
        />
      )}
    </div>
  )
}