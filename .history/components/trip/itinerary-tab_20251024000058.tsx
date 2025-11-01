"use client"

import { useState, useEffect } from "react"
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
  Loader2,
} from "lucide-react"
import { AddDayModal } from "@/components/itinerary/add-day-modal"
import { AddPoiModal } from "@/components/itinerary/add-poi-modal"
import { EditDayModal } from "@/components/itinerary/edit-day-modal"
import { Badge } from "@/components/ui/badge"
import { motion, Reorder } from "framer-motion"
import { useToast } from "@/hooks/use-toast"

// Định nghĩa kiểu dữ liệu cho POI
interface Poi {
  id: string
  tenDiaDiem: string
  loaiDiaDiem: string
  gioBatDau: string
  gioKetThuc: string
  ghiChu: string
  toaDo: { lat: number; lng: number }
  thoiGianDiChuyen: number
}

// Định nghĩa kiểu dữ liệu cho Ngày
interface Day {
  id: string // Sẽ map từ "lich_trinh_ngay_id"
  ngay: string
  tieuDe: string
  ghiChu: string
  pois: Poi[]
}

interface ItineraryTabProps {
  tripId: string
}

export function ItineraryTab({ tripId }: ItineraryTabProps) {
  const [days, setDays] = useState<Day[]>([])
  const [isLoadingDays, setIsLoadingDays] = useState(true)
  const [showAddDayModal, setShowAddDayModal] = useState(false)
  const [showAddPoiModal, setShowAddPoiModal] = useState<string | null>(null)
  const [editingDay, setEditingDay] = useState<Day | null>(null)
  const [isAddingDay, setIsAddingDay] = useState(false)
  const { toast } = useToast()
  const router = useRouter()

  // Hook để tải dữ liệu khi component được gắn vào
  useEffect(() => {
    const fetchItineraryDays = async () => {
      setIsLoadingDays(true)
      const token = Cookies.get("token")

      if (!token || token === "null" || token === "undefined") {
        toast({
          title: "Lỗi xác thực",
          description: "Không tìm thấy token. Đang chuyển về trang đăng nhập.",
          variant: "destructive",
        })
        router.replace("/login")
        setIsLoadingDays(false)
        return
      }

      try {
        // <-- SỬA LỖI 404: Đưa tripId vào URL
        // Giả sử đây là URL đúng, nếu vẫn 404, bạn cần đổi lại
        const response = await axios.get(
          `https://travel-planner-imdw.onrender.com/api/lich-trinh-ngay/chuyen-di/${tripId}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        )

        // <-- SỬA MAP TRƯỜNG: Map dữ liệu API (snake_case) sang state (camelCase)
        const fetchedDays: Day[] = response.data.map((dayFromApi: any) => ({
          id: dayFromApi.lich_trinh_ngay_id, // <-- SỬA: Dùng đúng trường API
          ngay: dayFromApi.ngay,
          tieuDe: dayFromApi.tieu_de,
          ghiChu: dayFromApi.ghi_chu,
          // (Trường chuyen_di_id không cần lưu vào state vì đã có tripId)
          
          // Giả sử API trả về POI lồng nhau
          pois: (dayFromApi.pois || []).map((poiFromApi: any): Poi => ({
            id: poiFromApi.poi_id || poiFromApi.id, // Đảm bảo lấy đúng ID của POI
            tenDiaDiem: poiFromApi.ten_dia_diem,
            loaiDiaDiem: poiFromApi.loai_dia_diem,
            gioBatDau: poiFromApi.gio_bat_dau,
            gioKetThuc: poiFromApi.gio_ket_thuc,
            ghiChu: poiFromApi.ghi_chu,
            toaDo: poiFromApi.toa_do || { lat: 0, lng: 0 },
            thoiGianDiChuyen: poiFromApi.thoi_gian_di_chuyen || 0,
          })).sort((a: Poi, b: Poi) => a.gioBatDau.localeCompare(b.gioBatDau)),
        }))

        setDays(fetchedDays)
      } catch (error) {
        console.error("Lỗi khi tải lịch trình:", error)
        if (axios.isAxiosError(error) && error.response?.status === 401) {
          toast({
            title: "Phiên đăng nhập hết hạn",
            description: "Token không hợp lệ hoặc đã hết hạn. Vui lòng đăng nhập lại.",
            variant: "destructive",
          })
          router.replace("/login")
        } else if (axios.isAxiosError(error) && error.response?.status === 404) {
           toast({
            title: "Lỗi 404",
            description: "Không tìm thấy API. Vui lòng kiểm tra lại đường dẫn.",
            variant: "destructive",
          })
        }
         else {
          toast({
            title: "Lỗi",
            description: "Không thể tải lịch trình. Vui lòng thử lại.",
            variant: "destructive",
          })
        }
      } finally {
        setIsLoadingDays(false)
      }
    }

    if (tripId) {
      fetchItineraryDays()
    } else {
      setIsLoadingDays(false)
    }
  }, [tripId, router, toast])

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

  // Hàm kiểm tra trùng giờ (Đã sửa lỗi TypeScript)
  const checkTimeOverlap = (
    dayId: string,
    newPoiData: { id?: string; gioBatDau: string; gioKetThuc: string }
  ) => {
    const day = days.find((d) => d.id === dayId)
    if (!day) return []

    const newStart = new Date(`2024-01-01 ${newPoiData.gioBatDau}`)
    const newEnd = new Date(`2024-01-01 ${newPoiData.gioKetThuc}`)

    return day.pois.filter((poi) => {
      if (poi.id === newPoiData.id) return false
      const poiStart = new Date(`2024-01-01 ${poi.gioBatDau}`)
      const poiEnd = new Date(`2024-01-01 ${poi.gioKetThuc}`)
      return newStart < poiEnd && newEnd > poiStart
    })
  }

  // Hàm thêm ngày mới (đã sửa)
  const handleAddDay = async (dayData: any) => {
    if (isAddingDay) return
    setIsAddingDay(true)
    const token = Cookies.get("token")

    if (!token || token === "null" || token === "undefined") {
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
      // Chuẩn bị payload (dữ liệu gửi đi)
      const payload = {
        chuyen_di_id: tripId, // Gửi chuyen_di_id
        ngay: dayData.ngay,
        tieu_de: dayData.tieuDe,
        ghi_chu: dayData.ghiChu,
      }

      // Gọi API POST
      const response = await axios.post(
        "https://travel-planner-imdw.onrender.com/api/lich-trinh-ngay",
        payload,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      )

      // Dữ liệu API trả về
      const newDayFromApi = response.data

      // <-- SỬA MAP TRƯỜNG: Map dữ liệu API trả về sang state
      const newDayForState: Day = {
        id: newDayFromApi.lich_trinh_ngay_id, // <-- SỬA: Dùng đúng trường API
        ngay: newDayFromApi.ngay,
        tieuDe: newDayFromApi.tieu_de,
        ghiChu: newDayFromApi.ghi_chu,
        pois: [], // Ngày mới chưa có POI
      }

      setDays([...days, newDayForState])
      setShowAddDayModal(false)
      toast({
        title: "Đã thêm ngày mới",
        description: "Ngày mới đã được thêm vào lịch trình",
      })
    } catch (error) {
      console.error("Lỗi khi thêm ngày:", error)
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

  // Hàm thêm POI (đã sửa)
  const handleAddPoi = (dayId: string, poiData: Omit<Poi, 'id' | 'thoiGianDiChuyen' | 'toaDo'> & { toaDo?: { lat: number; lng: number }}) => {
    const overlaps = checkTimeOverlap(dayId, poiData)

    if (overlaps.length > 0) {
      toast({
        title: "Cảnh báo trùng giờ",
        description: `Thời gian trùng với ${overlaps.length} điểm khác`,
        variant: "destructive",
      })
    }

    const newPoi: Poi = {
      id: `poi${Date.now()}`,
      ...poiData,
      thoiGianDiChuyen: Math.floor(Math.random() * 30) + 5, // Mock travel time
      toaDo: poiData.toaDo || { lat: 0, lng: 0 } // Đảm bảo toaDo tồn tại
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
      title: "Đã thêm điểm đến",
      description: "Điểm đến mới đã được thêm vào lịch trình",
    })
  }

  // Hàm xóa POI (không đổi)
  const handleDeletePoi = (dayId: string, poiId: string) => {
    // (Đây là xóa ở local, bạn sẽ cần gọi API DELETE ở đây)
    setDays(days.map((day) => (day.id === dayId ? { ...day, pois: day.pois.filter((poi) => poi.id !== poiId) } : day)))
    toast({
      title: "Đã xóa điểm đến",
      description: "Điểm đến đã được xóa khỏi lịch trình",
    })
  }

  // Hàm sắp xếp ngày (không đổi)
  const handleReorderDays = (newOrder: Day[]) => {
    // (Đây là sắp xếp ở local, bạn sẽ cần gọi API PUT/PATCH để cập nhật thứ tự)
    setDays(newOrder)
  }

  // Phần JSX render (không đổi)
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

      {/* Loading state */}
      {isLoadingDays && (
        <div className="flex justify-center items-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="ml-3 text-muted-foreground">Đang tải lịch trình...</p>
        </div>
      )}

      {/* Timeline (hiển thị khi không loading và có data) */}
      {!isLoadingDays && days.length > 0 && (
        <div className="space-y-6">
          <Reorder.Group axis="y" values={days} onReorder={handleReorderDays}>
            {days.map((day: Day, dayIndex: number) => (
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
                                {new Date(day.ngay).toLocaleString("vi-VN", {
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
                        <div className="text-center py-8 text-muted-foreground">
                          <MapPin className="h-8 w-8 mx-auto mb-2 opacity-50" />
                          <p>Chưa có điểm đến nào</p>
                          <Button variant="ghost" size="sm" onClick={() => setShowAddPoiModal(day.id)} className="mt-2">
                            Thêm điểm đến đầu tiên
                          </Button>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {day.pois.map((poi: Poi, poiIndex: number) => (
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
      )}

      {/* Trạng thái trống (hiển thị khi không loading và không có data) */}
      {!isLoadingDays && days.length === 0 && (
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
          // isLoading={isAddingDay} // Bỏ comment dòng này nếu AddDayModal có hỗ trợ prop isLoading
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
            // (Đây là sửa ở local, bạn sẽ cần gọi API PUT/PATCH ở đây)
            setDays(days.map((day: Day) => (day.id === editingDay.id ? { ...day, ...dayData } : day)))
            setEditingDay(null)
            toast({
              title: "Đã cập nhật ngày",
              description: "Thông tin ngày đã được cập nhật",
            })
          }}
        />
      )}
    </div>
  )
}