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

// Mock itinerary data
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

// Hàm map POI từ API (snake_case) sang State (camelCase)
const mapPoiFromApi = (apiPoi: any) => ({
  id: apiPoi.id, // Giả sử API trả về 'id'
  tenDiaDiem: apiPoi.ten_dia_diem,
  loaiDiaDiem: apiPoi.loai_dia_diem,
  gioBatDau: apiPoi.gio_bat_dau,
  gioKetThuc: apiPoi.gio_ket_thuc,
  ghiChu: apiPoi.ghi_chu,
  toaDo: apiPoi.toa_do,
  thoiGianDiChuyen: apiPoi.thoi_gian_di_chuyen ?? 0,
})

// Hàm map Ngày từ API (snake_case) sang State (camelCase)
const mapDayFromApi = (apiDay: any) => ({
  id: apiDay.id ?? apiDay.lich_trinh_ngay_id,
  ngay: apiDay.ngay,
  tieuDe: apiDay.tieu_de,
  ghiChu: apiDay.ghi_chu,
  // Map các POI bên trong nếu API trả về
  pois: Array.isArray(apiDay.pois) ? apiDay.pois.map(mapPoiFromApi) : [],
})

export function ItineraryTab({ tripId }: ItineraryTabProps) {
  const [days, setDays] = useState<any[]>([])
  const [showAddDayModal, setShowAddDayModal] = useState(false)
  const [showAddPoiModal, setShowAddPoiModal] = useState<string | null>(null)
  const [editingDay, setEditingDay] = useState<any>(null)

  // State loading
  const [isLoadingDays, setIsLoadingDays] = useState(false)
  const [isAddingDay, setIsAddingDay] = useState(false)
  const [isSubmittingPoi, setIsSubmittingPoi] = useState(false)
  const [isEditingDay, setIsEditingDay] = useState(false)

  const { toast } = useToast()
  const router = useRouter()

  // Hàm xử lý lỗi chung, đặc biệt là 401
  const handleApiError = (error: unknown, context: string) => {
    console.error(`Lỗi khi ${context}:`, error)
    if (axios.isAxiosError(error) && error.response?.status === 401) {
      toast({
        title: "Phiên đăng nhập hết hạn",
        description: "Token không hợp lệ. Vui lòng đăng nhập lại.",
        variant: "destructive",
      })
      router.replace("/login")
    } else {
      toast({
        title: "Lỗi",
        description: `Không thể ${context}. Vui lòng thử lại.`,
        variant: "destructive",
      })
    }
  }

  // Lấy Token an toàn
  const getAuthToken = () => {
    const token = Cookies.get("token")
    if (!token || token === "null" || token === "undefined") {
      console.warn("Không có token → chuyển về /login")
      router.replace("/login")
      return null
    }
    return token
  }

  // Fetch days from API
  useEffect(() => {
    const fetchDays = async () => {
      setIsLoadingDays(true)
      const token = getAuthToken()
      if (!token) {
        setIsLoadingDays(false)
        return
      }

      try {
        const url = `https://travel-planner-imdw.onrender.com/api/lich-trinh-ngay/?chuyen_di_id=${encodeURIComponent(
          tripId,
        )}`
        const res = await axios.get(url, {
          headers: { Authorization: `Bearer ${token}` },
        })

        const items = Array.isArray(res.data) ? res.data : res.data.data || []

        // Cần lấy POI cho từng ngày
        const mappedDays = items.map(mapDayFromApi)

        // Giả sử API trả về POI bên trong `lich-trinh-ngay`
        // Nếu không, bạn cần một lệnh gọi API khác ở đây để lấy POI cho từng ngày

        setDays(mappedDays)
      } catch (error) {
        handleApiError(error, "tải lịch trình")
        setDays(mockItinerary) // Dùng mock data nếu lỗi
      } finally {
        setIsLoadingDays(false)
      }
    }

    if (tripId) fetchDays()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tripId])

  const getPoiTypeLabel = (type: string) => {
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
    const day = days.find((d) => d.id === dayId)
    if (!day) return []

    const newStart = new Date(`2024-01-01 ${newPoi.gioBatDau}`)
    const newEnd = new Date(`2024-01-01 ${newPoi.gioKetThuc}`)

    return day.pois.filter((poi: any) => {
      if (poi.id === newPoi.id) return false // Bỏ qua chính nó khi chỉnh sửa
      const poiStart = new Date(`2024-01-01 ${poi.gioBatDau}`)
      const poiEnd = new Date(`2024-01-01 ${poi.gioKetThuc}`)
      return newStart < poiEnd && newEnd > poiStart
    })
  }

  // === HÀM THÊM NGÀY (ĐÃ SỬA LỖI 404) ===
  const handleAddDay = async (dayData: any) => {
    if (isAddingDay) return
    setIsAddingDay(true)

    const token = getAuthToken()
    if (!token) {
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

      const response = await axios.post(
        "https://travel-planner-imdw.onrender.com/api/lich-trinh-ngay/", // <-- SỬA LỖI: Thêm dấu /
        payload,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      )

      const newDayForState = mapDayFromApi(response.data)
      setDays([...days, newDayForState])
      setShowAddDayModal(false)
      toast({
        title: "Đã thêm ngày mới",
        description: "Ngày mới đã được thêm vào lịch trình",
      })
    } catch (error) {
      handleApiError(error, "thêm ngày mới")
    } finally {
      setIsAddingDay(false)
    }
  }

  // === HÀM SỬA NGÀY (THÊM MỚI) ===
  const handleUpdateDay = async (dayData: any) => {
    if (isEditingDay || !editingDay) return
    setIsEditingDay(true)

    const token = getAuthToken()
    if (!token) {
      setIsEditingDay(false)
      return
    }

    try {
      const payload = {
        // Giả sử API yêu cầu các trường này
        ngay: dayData.ngay,
        tieu_de: dayData.tieuDe,
        ghi_chu: dayData.ghiChu,
      }

      // ⚠️ LƯU Ý: Đây là URL phỏng đoán (PUT)
      const url = `https://travel-planner-imdw.onrender.com/api/lich-trinh-ngay/${editingDay.id}/`
      const response = await axios.put(url, payload, {
        headers: { Authorization: `Bearer ${token}` },
      })

      const updatedDay = mapDayFromApi(response.data)

      setDays(
        days.map((day) =>
          day.id === editingDay.id ? { ...day, ...updatedDay } : day,
        ),
      )
      setEditingDay(null)
      toast({
        title: "Đã cập nhật ngày",
        description: "Thông tin ngày đã được cập nhật",
      })
    } catch (error) {
      handleApiError(error, "cập nhật ngày")
    } finally {
      setIsEditingDay(false)
    }
  }

  // === HÀM THÊM POI (THÊM MỚI) ===
  const handleAddPoi = async (dayId: string, poiData: any) => {
    // Kiểm tra trùng giờ (local)
    const overlaps = checkTimeOverlap(dayId, poiData)
    if (overlaps.length > 0) {
      toast({
        title: "Cảnh báo trùng giờ",
        description: `Thời gian trùng với ${overlaps.length} điểm khác`,
        variant: "destructive",
      })
      // Vẫn cho phép thêm nếu muốn, hoặc `return` nếu muốn chặn
    }

    if (isSubmittingPoi) return
    setIsSubmittingPoi(true)

    const token = getAuthToken()
    if (!token) {
      setIsSubmittingPoi(false)
      return
    }

    try {
      const payload = {
        lich_trinh_ngay_id: dayId,
        ten_dia_diem: poiData.tenDiaDiem,
        loai_dia_diem: poiData.loaiDiaDiem,
        gio_bat_dau: poiData.gioBatDau,
        gio_ket_thuc: poiData.gioKetThuc,
        ghi_chu: poiData.ghiChu,
        toa_do: poiData.toaDo, // Gửi object tọa độ
      }

      // ⚠️ LƯU Ý: Đây là URL phỏng đoán (POST)
      const url = "https://travel-planner-imdw.onrender.com/api/diem-dung/"
      const response = await axios.post(url, payload, {
        headers: { Authorization: `Bearer ${token}` },
      })

      const newPoi = mapPoiFromApi(response.data)

      setDays(
        days.map((day) =>
  M         day.id === dayId
            ? { ...day, pois: [...day.pois, newPoi].sort((a, b) => a.gioBatDau.localeCompare(b.gioBatDau)) }
            : day,
        ),
      )
      setShowAddPoiModal(null)
      toast({
        title: "Đã thêm điểm đến",
        description: "Điểm đến mới đã được thêm vào lịch trình",
      })
    } catch (error) {
      handleApiError(error, "thêm điểm đến")
    } finally {
      setIsSubmittingPoi(false)
    }
  }

  // === HÀM XÓA POI (THÊM MỚI) ===
  const handleDeletePoi = async (dayId: string, poiId: string) => {
    // Thêm xác nhận trước khi xóa
    if (!confirm("Bạn có chắc chắn muốn xóa điểm đến này?")) {
      return
    }

    const token = getAuthToken()
    if (!token) return

    try {
      // ⚠️ LƯU Ý: Đây là URL phỏng đoán (DELETE)
      const url = `https://travel-planner-imdw.onrender.com/api/diem-dung/${poiId}/`
      await axios.delete(url, {
        headers: { Authorization: `Bearer ${token}` },
      })

      // Xóa thành công trên API -> Cập nhật local state
      setDays(
        days.map((day) =>
          day.id === dayId ? { ...day, pois: day.pois.filter((poi: any) => poi.id !== poiId) } : day,
        ),
      )
      toast({
        title: "Đã xóa điểm đến",
        description: "Điểm đến đã được xóa khỏi lịch trình",
      })
    } catch (error) {
      handleApiError(error, "xóa điểm đến")
    }
  }

  const handleReorderDays = (newOrder: any[]) => {
    // TODO: Gọi API để lưu lại thứ tự mới
    // Hiện tại chỉ cập nhật local
    console.log("Thứ tự ngày đã thay đổi (local):", newOrder.map(d => d.id))
    setDays(newOrder)
    toast({
      title: "Đã cập nhật thứ tự ngày (Tạm thời)",
      description: "Chức năng lưu thứ tự lên server chưa được cài đặt.",
    })
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
        <Button
          onClick={() => setShowAddDayModal(true)}
          className="bg-primary hover:bg-primary/90"
          disabled={isAddingDay}
        >
          <Plus className="h-4 w-4 mr-2" />
          Thêm Ngày
        </Button>
      </div>

      {/* Loading Skeleton (Ví dụ) */}
      {isLoadingDays && (
        <div className="space-y-4">
          <div className="h-24 w-full animate-pulse bg-muted rounded-lg"></div>
          <div className="h-24 w-full animate-pulse bg-muted rounded-lg" style={{ animationDelay: "0.2s" }}></div>
        </div>
      )}

      {/* Timeline */}
      {!isLoadingDays && days.length > 0 && (
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
                        <div className="flex items-center gap-3 min-w-0">
                          <GripVertical className="h-5 w-5 text-muted-foreground cursor-grab flex-shrink-0" />
                          <div className="min-w-0">
                            <CardTitle className="font-[family-name:var(--font-space-grotesk)] truncate">
                              {day.tieuDe}
                            </CardTitle>
                            <div className="flex items-center gap-2 mt-1">
                              <Calendar className="h-4 w-4 text-muted-foreground" />
                              <span className="text-sm text-muted-foreground">
                                {new Date(day.ngay).toLocaleDateString("vi-VN", {
                                  weekday: "long",
                                  year: "numeric",
                                  month: "long",
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
                        <div className="flex items-center gap-2 flex-shrink-0">
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
                                {poiIndex < day.pois.length - 1 && (
                                  <div className="w-0.5 h-full min-h-[2rem] bg-border my-2" />
                                )}
                              </div>

                              <div className="flex-1 min-w-0">
                                <div className="flex items-start justify-between">
                                  <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                                      <h4 className="font-semibold text-foreground">{poi.tenDiaDiem}</h4>
                                      <Badge
                                        className={`text-xs ${getPoiTypeLabel(poi.loaiDiaDiem).color}`}
                                        variant="secondary"
                                      >
                                      M {getPoiTypeLabel(poi.loaiDiaDiem).label}
                                      </Badge>
                                    </div>

                                    <div className="flex items-center gap-4 text-sm text-muted-foreground mb-2 flex-wrap">
                                      <div className="flex items-center gap-1">
                                        <Clock className="h-4 w-4" />
                                        <span>
                                          {poi.gioBatDau} - {poi.gioKetThuc}
                                        </span>
                                      </div>
                                      {poi.thoiGianDiChuyen > 0 && (
                                        <div className="flex items-center gap-1 text-orange-600">
                                          <AlertCircle className="h-4 w-4" />
                                          <span>{poi.thoiGianDiChuyen} phút di chuyển</span>
                                        </div>
                                      )}
                                    </div>

                                    {poi.ghiChu && (
                                      <p className="text-sm text-muted-foreground font-[family-name:var(--font-dm-sans)]">
                                        {poi.ghiChu}
                                    TA</p>
                                    )}
                    _             </div>

                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => handleDeletePoi(day.id, poi.id)}
                                    className="text-muted-foreground hover:text-destructive"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                              </div>
                            </div>
S                         ))}
                        </div>
                      )}
                    </CardContent>
A                 </Card>
        _         </motion.div>
              </Reorder.Item>
            ))}
          </Reorder.Group>
        </div>
      )}

      {/* Trạng thái không có lịch trình */}
      {!isLoadingDays && days.length === 0 && (
        <div className="text-center py-12">
T         <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-foreground mb-2">Chưa có lịch trình</h3>
          <p className="text-muted-foreground mb-4">Bắt đầu bằng cách thêm ngày đầu tiên</p>
  KA       <Button onClick={() => setShowAddDayModal(true)} className="bg-primary hover:bg-primary/90">
            <Plus className="h-4 w-4 mr-2" />
            Thêm Ngày Đầu Tiên
          </Button>
        </div>
      )}

      {/* Modals */}
      {showAddDayModal && (
        <AddDayModal
    ci       onClose={() => setShowAddDayModal(false)}
          onSubmit={handleAddDay}
          isLoading={isAddingDay} // <-- SỬA LẠI TỪ isSubmitting
        />
      )}

      {showAddPoiModal && (
        <AddPoiModal
          dayId={showAddPoiModal}
          onClose={() => setShowAddPoiModal(null)}
          onSubmit={handleAddPoi}
          isLoading={isSubmittingPoi} // <-- SỬA LẠI TỪ isSubmitting
        />
      )}

      {editingDay && (
        <EditDayModal
          day={editingDay}
Enter         onClose={() => setEditingDay(null)}
          onSubmit={handleUpdateDay} // <-- Trỏ đến hàm handleUpdateDay mới
          isLoading={isEditingDay} // <-- SỬA LẠI TỪ isSubmitting
        />
      )}
    </div>
  )
}