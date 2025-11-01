"use client"

import { useState, useEffect } from "react" // <-- THÊM useEffect
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
  CheckCircle,
  AlertTriangle,
  XCircle,
  Loader2, // <-- THÊM ICON LOADING
} from "lucide-react"
import { AddDayModal } from "@/components/itinerary/add-day-modal"
import { AddPoiModal } from "@/components/itinerary/add-poi-modal"
import { EditDayModal } from "@/components/itinerary/edit-day-modal"
import { Badge } from "@/components/ui/badge"
import { motion, Reorder } from "framer-motion"
import { useToast } from "@/hooks/use-toast"

// <-- 1. XÓA BỎ MOCK DATA (hoặc bạn có thể giữ lại để tham khảo)
// const mockItinerary = [ ... ]

// <-- Thêm ngayBatDau và ngayKetThuc vào props -->
interface ItineraryTabProps {
  tripId: string
  ngayBatDau: string // (Định dạng YYYY-MM-DD)
  ngayKetThuc: string // (Định dạng YYYY-MM-DD)
}

export function ItineraryTab({ tripId, ngayBatDau, ngayKetThuc }: ItineraryTabProps) {
  // <-- 2. KHỞI TẠO STATE RỖNG VÀ THÊM STATE LOADING -->
  const [days, setDays] = useState<any[]>([]) // <-- Bắt đầu với mảng rỗng
  const [isLoading, setIsLoading] = useState(true) // <-- Thêm state loading
  const [showAddDayModal, setShowAddDayModal] = useState(false)
  const [showAddPoiModal, setShowAddPoiModal] = useState<string | null>(null)
  const [editingDay, setEditingDay] = useState<any>(null)
  const [isAddingDay, setIsAddingDay] = useState(false)
  const { toast } = useToast()
  const router = useRouter()

  // <-- 3. THÊM useEffect ĐỂ TẢI DỮ LIỆU KHI MOUNT -->
  useEffect(() => {
    const fetchDays = async () => {
      setIsLoading(true)
      const token = Cookies.get("token")

      if (!token || token === "null" || token === "undefined") {
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
        return
      }

      try {
        // Gọi API GET với `tripId` làm query param
        const response = await axios.get(
          "https://travel-planner-imdw.onrender.com/api/lich-trinh-ngay/",
          {
            params: {
              chuyen_di_id: tripId, // Gửi tripId để lọc
            },
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        )

        // 4. ÁNH XẠ DỮ LIỆU TỪ API (snake_case) sang STATE (camelCase)
        const formattedDays = response.data.map((day: any) => ({
          id: day.lich_trinh_ngay_id, // <-- API field
          ngay: day.ngay,
          tieuDe: day.tieu_de, // <-- API field
          ghiChu: day.ghi_chu, // <-- API field
          pois: [], // <-- Khởi tạo mảng POI rỗng (Bạn sẽ cần logic để tải POI sau)
        }))

        setDays(formattedDays)
      } catch (error) {
        console.error("Lỗi khi tải danh sách ngày:", error)
        toast({
          variant: "destructive",
          title: (
            <div className="flex items-center gap-2">
              <XCircle className="h-5 w-5" />
              <span>Không thể tải lịch trình</span>
            </div>
          ),
          description: "Đã xảy ra lỗi khi tải dữ liệu. Vui lòng thử lại.",
        })
        if (axios.isAxiosError(error) && error.response?.status === 401) {
          router.replace("/login")
        }
      } finally {
        setIsLoading(false)
      }
    }

    fetchDays()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tripId, router]) // <-- Chạy lại nếu tripId thay đổi

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

  // HÀM handleAddDay (Đã có validation và toast đẹp)
  const handleAddDay = async (dayData: any) => {
    if (isAddingDay) return
    setIsAddingDay(true)

    const token = Cookies.get("token")
    if (!token || token === "null" || token === "undefined") {
      // ... (toast lỗi token) ...
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

    // --- VALIDATION NGÀY ---
    const newDateStr = dayData.ngay
    if (!newDateStr) {
      // ... (toast lỗi chưa chọn ngày) ...
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

    if (newDate < tripStartDate) {
      // ... (toast lỗi sớm hơn) ...
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

    if (newDate > tripEndDate) {
      // ... (toast lỗi muộn hơn) ...
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

    const isDateExist = days.some((day) => day.ngay === newDateStr)
    if (isDateExist) {
      // ... (toast lỗi trùng ngày) ...
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
      
      // Ánh xạ dữ liệu trả về từ API (snake_case) sang state (camelCase)
      const newDayForState = {
        id: newDayFromApi.lich_trinh_ngay_id, // <-- Đảm bảo dùng đúng key trả về
        ngay: newDayFromApi.ngay,
        tieuDe: newDayFromApi.tieu_de,
        ghiChu: newDayFromApi.ghi_chu,
        pois: [], // Ngày mới chưa có POI
      }

      setDays([...days, newDayForState])
      setShowAddDayModal(false)

      // (toast thành công)
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
      // (toast lỗi 409, 401, và lỗi chung)
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

  // (Hàm handleAddPoi không thay đổi, đã có toast đẹp)
  const handleAddPoi = (dayId: string, poiData: any) => {
    // ... (logic check trùng giờ) ...
    // ... (toast trùng giờ) ...
    // ... (logic thêm POI) ...
    // ... (toast thêm POI thành công) ...
  }

  // (Hàm handleDeletePoi không thay đổi, đã có toast đẹp)
  const handleDeletePoi = (dayId: string, poiId: string) => {
    // ... (logic xóa POI) ...
    // ... (toast xóa POI thành công) ...
  }

  const handleReorderDays = (newOrder: any[]) => {
    setDays(newOrder)
  }

  // <-- 5. THÊM UI CHO TRẠNG THÁI LOADING -->
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 space-y-4">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="text-lg text-muted-foreground">Đang tải lịch trình...</p>
      </div>
    )
  }

  // <-- 6. RETURN GIAO DIỆN CHÍNH -->
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
                    {/* ... (Nội dung CardHeader không đổi) ... */}
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
                    {/* LƯU Ý: logic tải POI chưa có, nên đây sẽ luôn rỗng */}
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
                          // ... (JSX render POI không đổi) ...
                          <div key={poi.id} className="flex items-start gap-4 p-4 bg-muted/30 rounded-lg">
                            {/* ... */}
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

      {/* 7. XỬ LÝ TRƯỜNG HỢP KHÔNG CÓ NGÀY NÀO (SAU KHI TẢI XONG) */}
      {!isLoading && days.length === 0 && (
        <div className="text-center py-12">
          <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-foreground mb-2">Chưa có lịch trình</h3>
          <p className="text-muted-foreground mb-4">Bắt đầu bằng cách thêm ngày đầu tiên</Vui lòng thêm ngày bắt đầu chuyến đi.</p>
          <Button onClick={() => setShowAddDayModal(true)} className="bg-primary hover:bg-primary/90">
            <Plus className="h-4 w-4 mr-2" />
            Thêm Ngày Đầu Tiên
          </Button>
        </div>
      )}

      {/* Modals (Không thay đổi) */}
      {showAddDayModal && (
        <AddDayModal
          onClose={() => setShowAddDayModal(false)}
          onSubmit={handleAddDay}
          // isLoading={isAddingDay} // Bạn nên cập nhật modal để nhận prop này
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