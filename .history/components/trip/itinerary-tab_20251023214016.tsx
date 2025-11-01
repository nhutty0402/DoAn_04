"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Cookies from "js-cookie"
import axios from "axios"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Plus,
  Calendar,
  Clock,
  MapPin,
  GripVertical,
  Edit,
  Trash2,
  AlertCircle,
  // <-- THÊM CÁC ICON MỚI CHO THÔNG BÁO -->
  CheckCircle,
  AlertTriangle,
  XCircle,
} from "lucide-react"
import { AddDayModal } from "@/components/itinerary/add-day-modal"
import { AddPoiModal } from "@/components/itinerary/add-poi-modal"
import { EditDayModal } from "@/components/itinerary/edit-day-modal"
import { Badge } from "@/components/ui/badge"
import { motion, Reorder } from "framer-motion"
import { useToast } from "@/hooks/use-toast"

// Mock itinerary data
const mockItinerary = [
  // ... (dữ liệu mock không thay đổi) ...
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
      // ... (các POI khác)
    ],
  },
  {
    id: "day2",
    ngay: "2024-03-16",
    tieuDe: "Ngày 2: Hội An cổ kính",
    ghiChu: "Khám phá phố cổ Hội An",
    pois: [
      // ... (các POI khác)
    ],
  },
]

// <-- Thêm ngayBatDau và ngayKetThuc vào props -->
interface ItineraryTabProps {
  tripId: string
  ngayBatDau: string // (Định dạng YYYY-MM-DD)
  ngayKetThuc: string // (Định dạng YYYY-MM-DD)
}

export function ItineraryTab({ tripId, ngayBatDau, ngayKetThuc }: ItineraryTabProps) {
  const [days, setDays] = useState(mockItinerary)
  const [showAddDayModal, setShowAddDayModal] = useState(false)
  const [showAddPoiModal, setShowAddPoiModal] = useState<string | null>(null)
  const [editingDay, setEditingDay] = useState<any>(null)
  const [isAddingDay, setIsAddingDay] = useState(false)
  const { toast } = useToast()
  const router = useRouter()

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

    return day.pois.filter((poi) => {
      if (poi.id === newPoi.id) return false
      const poiStart = new Date(`2024-01-01 ${poi.gioBatDau}`)
      const poiEnd = new Date(`2024-01-01 ${poi.gioKetThuc}`)
      return newStart < poiEnd && newEnd > poiStart
    })
  }

  // <-- CẬP NHẬT HÀM handleAddDay VỚI THÔNG BÁO MỚI -->
  const handleAddDay = async (dayData: any) => {
    if (isAddingDay) return
    setIsAddingDay(true)

    // Lấy token
    const token = Cookies.get("token")
    if (!token || token === "null" || token === "undefined") {
      console.warn("Không có token → chuyển về /login")
      toast({
        variant: "destructive",
        title: (
          <div className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5" />
            <span>Lỗi xác thực</span>
          </div>
        ),
        description: "Không tìm thấy token. Đang chuyển về trang đăng nhập.",
      })
      router.replace("/login")
      setIsAddingDay(false)
      return
    }

    // --- BẮT ĐẦU VALIDATION NGÀY ---
    const newDateStr = dayData.ngay
    if (!newDateStr) {
      toast({
        variant: "destructive",
        title: (
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            <span>Chưa chọn ngày</span>
          </div>
        ),
        description: "Vui lòng chọn một ngày để thêm vào lịch trình.",
      })
      setIsAddingDay(false)
      return
    }

    const newDate = new Date(newDateStr + "T00:00:00")
    const tripStartDate = new Date(ngayBatDau + "T00:00:00")
    const tripEndDate = new Date(ngayKetThuc + "T00:00:00")

    // Lỗi 1: Sớm hơn ngày bắt đầu
    if (newDate < tripStartDate) {
      toast({
        variant: "destructive",
        title: (
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            <span>Ngày không hợp lệ</span>
          </div>
        ),
        description: `Ngày ${newDateStr} sớm hơn ngày bắt đầu chuyến đi (${ngayBatDau}).`,
      })
      setIsAddingDay(false)
      return
    }

    // Lỗi 2: Muộn hơn ngày kết thúc
    if (newDate > tripEndDate) {
      toast({
        variant: "destructive",
        title: (
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            <span>Ngày không hợp lệ</span>
          </div>
        ),
        description: `Ngày ${newDateStr} muộn hơn ngày kết thúc chuyến đi (${ngayKetThuc}).`,
      })
      setIsAddingDay(false)
      return
    }

    // Lỗi 3: Trùng ngày đã có
    const isDateExist = days.some((day) => day.ngay === newDateStr)
    if (isDateExist) {
      toast({
        variant: "destructive",
        title: (
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            <span>Ngày bị trùng</span>
          </div>
        ),
        description: `Ngày ${newDateStr} đã có trong lịch trình. Vui lòng chọn ngày khác.`,
      })
      setIsAddingDay(false)
      return
    }
    // --- KẾT THÚC VALIDATION ---

    try {
      const payload = {
        chuyen_di_id: tripId,
        ngay: dayData.ngay,
        tieu_de: dayData.tieuDe,
        ghi_chu: dayData.ghiChu,
      }

      const response = await axios.post(
        "https://travel-planner-imdw.onrender.com/api/lich-trinh-ngay",
        payload,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      )

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

      // <-- THÔNG BÁO THÀNH CÔNG -->
      toast({
        title: (
          <div className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-600" />
            <span>Thêm ngày thành công</span>
          </div>
        ),
        description: `Đã thêm "${newDayForState.tieuDe}" vào lịch trình.`,
      })
    } catch (error) {
      console.error("Lỗi khi thêm ngày:", error)

      // Lỗi 409 (Trùng lặp server)
      if (axios.isAxiosError(error) && error.response?.status === 409) {
        toast({
          variant: "destructive",
          title: (
            <div className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5" />
              <span>Lỗi trùng lặp từ máy chủ</span>
            </div>
          ),
          description: "Ngày này đã tồn tại trên máy chủ. Vui lòng làm mới trang.",
        })
      }
      // Lỗi 401 (Hết hạn token)
      else if (axios.isAxiosError(error) && error.response?.status === 401) {
        toast({
          variant: "destructive",
          title: (
            <div className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5" />
              <span>Phiên đăng nhập hết hạn</span>
            </div>
          ),
          description: "Token không hợp lệ. Vui lòng đăng nhập lại.",
        })
        router.replace("/login")
      }
      // Lỗi chung
      else {
        toast({
          variant: "destructive",
          title: (
            <div className="flex items-center gap-2">
              <XCircle className="h-5 w-5" />
              <span>Đã xảy ra lỗi</span>
            </div>
          ),
          description: "Không thể thêm ngày mới. Vui lòng thử lại.",
        })
      }
    } finally {
      setIsAddingDay(false)
    }
  }

  // <-- CẬP NHẬT HÀM handleAddPoi VỚI THÔNG BÁO MỚI -->
  const handleAddPoi = (dayId: string, poiData: any) => {
    const overlaps = checkTimeOverlap(dayId, poiData)

    if (overlaps.length > 0) {
      // Thông báo trùng giờ
      toast({
        variant: "destructive",
        title: (
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            <span>Cảnh báo trùng giờ</span>
          </div>
        ),
        description: `Thời gian trùng với ${overlaps.length} điểm đến khác.`,
      })
    }

    const newPoi = {
      id: `poi${Date.now()}`,
      ...poiData,
      thoiGianDiChuyen: Math.floor(Math.random() * 30) + 5, // Mock travel time
    }

    setDays(
      days.map((day) =>
        day.id === dayId
          ? { ...day, pois: [...day.pois, newPoi].sort((a, b) => a.gioBatDau.localeCompare(b.gioBatDau)) }
          : day,
      ),
    )
    setShowAddPoiModal(null)
    
    // Thông báo thêm POI thành công
    toast({
      title: (
        <div className="flex items-center gap-2">
          <CheckCircle className="h-5 w-5 text-green-600" />
          <span>Đã thêm điểm đến</span>
        </div>
      ),
      description: `Đã thêm "${newPoi.tenDiaDiem}" vào lịch trình.`,
    })
  }

  // <-- CẬP NHẬT HÀM handleDeletePoi VỚI THÔNG BÁO MỚI -->
  const handleDeletePoi = (dayId: string, poiId: string) => {
    setDays(days.map((day) => (day.id === dayId ? { ...day, pois: day.pois.filter((poi) => poi.id !== poiId) } : day)))
    
    // Thông báo xóa POI
    toast({
      title: (
        <div className="flex items-center gap-2">
          <CheckCircle className="h-5 w-5 text-green-600" />
          <span>Đã xóa điểm đến</span>
        </div>
      ),
      description: "Điểm đến đã được xóa khỏi lịch trình.",
    })
  }

  const handleReorderDays = (newOrder: any[]) => {
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
                          <CardTitle className="font-[family-name:var(--font-space-grotesk)]">{day.tieuDe}</CardTitle>
                          <div className="flex items-center gap-2 mt-1">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm text-muted-foreground">
                              {new Date(day.ngay + "T00:00:00").toLocaleDateString("vi-VN", {
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
                      // ... (Nội dung không đổi)
                      <div className="text-center py-8 text-muted-foreground">
                        <MapPin className="h-8 w-8 mx-auto mb-2 opacity-50" />
                        <p>Chưa có điểm đến nào</p>
                        <Button variant="ghost" size="sm" onClick={() => setShowAddPoiModal(day.id)} className="mt-2">
                          Thêm điểm đến đầu tiên
                        </Button>
                      </div>
                    ) : (
                      // ... (Nội dung không đổi)
                      <div className="space-y-4">
                        {day.pois.map((poi, poiIndex) => (
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
                                      variant="secondary"
                                    >
                                      {getPoiTypeLabel(poi.loaiDiaDiem).label}
                                    </Badge>
                                  </div>

                                  <div className="flex items-center gap-4 text-sm text-muted-foreground mb-2">
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
                                    </p>
                                  )}
                                </div>

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
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            </Reorder.Item>
          ))}
        </Reorder.Group>
      </div>

      {/* Phần không có lịch trình */}
      {days.length === 0 && (
        // ... (Nội dung không đổi)
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
      {showAddDayModal && (
        <AddDayModal
          onClose={() => setShowAddDayModal(false)}
          onSubmit={handleAddDay}
          // Bạn nên cập nhật AddDayModal để nhận 'isLoading'
          // và disable nút submit khi đang tải
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
            // ... (logic Sửa ngày)
            setDays(days.map((day) => (day.id === editingDay.id ? { ...day, ...dayData } : day)))
            setEditingDay(null)
            
            // <-- CẬP NHẬT THÔNG BÁO SỬA NGÀY -->
            toast({
              title: (
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <span>Đã cập nhật ngày</span>
                </div>
              ),
              description: "Thông tin ngày đã được cập nhật thành công.",
            })
          }}
        />
      )}
    </div>
  )
}