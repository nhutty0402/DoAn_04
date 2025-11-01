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

// Interface cho Day từ API
interface Day {
  id: string | number; // lich_trinh_ngay_id
  ngay: string;
  tieuDe: string; // tieu_de từ API
  ghiChu: string | null; // ghi_chu từ API
  pois: Array<{
    id: string;
    tenDiaDiem: string;
    loaiDiaDiem: string;
    gioBatDau: string;
    gioKetThuc: string;
    ghiChu: string;
    toaDo: { lat: number; lng: number };
    thoiGianDiChuyen: number;
  }>;
}

interface ItineraryTabProps {
  tripId: string
}

export function ItineraryTab({ tripId }: ItineraryTabProps) {
  const [days, setDays] = useState<Day[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddDayModal, setShowAddDayModal] = useState(false)
  const [showAddPoiModal, setShowAddPoiModal] = useState<string | null>(null)
  const [editingDay, setEditingDay] = useState<Day | null>(null)
  const [isAddingDay, setIsAddingDay] = useState(false)
  const { toast } = useToast()
  const router = useRouter()

  // Lấy token và kiểm tra global
  const token = Cookies.get("token")
  if (!token || token === "null" || token === "undefined") {
    console.warn("Không có token → chuyển về /login")
    router.replace("/login")
  }

  const API_BASE = "https://travel-planner-imdw.onrender.com/api"

  // Fetch danh sách ngày từ API
  useEffect(() => {
    const fetchDays = async () => {
      if (!token) return

      try {
        setLoading(true)
        const response = await axios.get(`${API_BASE}/lich-trinh-ngay/`, {  // Removed trailing slash
          headers: {
            Authorization: `Bearer ${token}`,
          },
          params: { chuyen_di_id: tripId }, // Keep query param
        })

        // Ánh xạ API response (snake_case) sang state (camelCase)
        const mappedDays: Day[] = response.data.map((apiDay: any) => ({
          id: apiDay.lich_trinh_ngay_id,
          ngay: apiDay.ngay,
          tieuDe: apiDay.tieu_de,
          ghiChu: apiDay.ghi_chu,
          pois: [], // POI sẽ fetch riêng sau nếu cần
        }))

        setDays(mappedDays)
      } catch (error) {
        console.error("Lỗi khi fetch days:", error)
        if (axios.isAxiosError(error) && error.response?.status === 401) {
          toast({
            title: "Phiên đăng nhập hết hạn",
            description: "Token không hợp lệ. Đang chuyển về trang đăng nhập.",
            variant: "destructive",
          })
          router.replace("/login")
        } else if (axios.isAxiosError(error) && error.response?.status === 404) {
          toast({
            title: "Lỗi",
            description: "Không tìm thấy endpoint. Kiểm tra đường dẫn API.",
            variant: "destructive",
          })
          console.log("404 - Có thể cần loại bỏ query param hoặc thay đổi path.")
        } else {
          toast({
            title: "Lỗi",
            description: "Không thể tải lịch trình. Vui lòng thử lại.",
            variant: "destructive",
          })
        }
      } finally {
        setLoading(false)
      }
    }

    fetchDays()
  }, [token, tripId])

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

    return day.pois.filter((poi) => {
      if (poi.id === newPoi.id) return false
      const poiStart = new Date(`2024-01-01 ${poi.gioBatDau}`)
      const poiEnd = new Date(`2024-01-01 ${poi.gioKetThuc}`)
      return newStart < poiEnd && newEnd > poiStart
    })
  }

  const handleAddDay = async (dayData: any) => {
    if (isAddingDay) return

    setIsAddingDay(true)

    if (!token) {
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

      const response = await axios.post(`${API_BASE}/lich-trinh-ngay/`, payload, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      })

      const newDayFromApi = response.data

      const newDayForState: Day = {
        id: newDayFromApi.lich_trinh_ngay_id,
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

  // Thêm handleEditDay cho EditDayModal
  const handleEditDay = async (dayData: any) => {
    if (!token || !editingDay) return

    try {
      const payload = {
        chuyen_di_id: tripId,
        ngay: dayData.ngay,
        tieu_de: dayData.tieuDe,
        ghi_chu: dayData.ghiChu,
      }

      const response = await axios.put(
        `${API_BASE}/lich-trinh-ngay/${editingDay.id}`,  // Removed trailing slash
        payload,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      )

      const updatedDayFromApi = response.data

      const updatedDayForState: Day = {
        ...editingDay,
        ngay: updatedDayFromApi.ngay,
        tieuDe: updatedDayFromApi.tieu_de,
        ghiChu: updatedDayFromApi.ghi_chu,
        pois: editingDay.pois, // Giữ nguyên pois
      }

      setDays(days.map((day) => (day.id === editingDay.id ? updatedDayForState : day)))
      setEditingDay(null)
      toast({
        title: "Đã cập nhật ngày",
        description: "Thông tin ngày đã được cập nhật",
      })
    } catch (error) {
      console.error("Lỗi khi cập nhật ngày:", error)

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
          description: "Không thể cập nhật ngày. Vui lòng thử lại.",
          variant: "destructive",
        })
      }
    }
  }

  const handleAddPoi = (dayId: string, poiData: any) => {
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
    toast({
      title: "Đã thêm điểm đến",
      description: "Điểm đến mới đã được thêm vào lịch trình",
    })
  }

  const handleDeletePoi = (dayId: string, poiId: string) => {
    setDays(days.map((day) => (day.id === dayId ? { ...day, pois: day.pois.filter((poi) => poi.id !== poiId) } : day)))
    toast({
      title: "Đã xóa điểm đến",
      description: "Điểm đến đã được xóa khỏi lịch trình",
    })
  }

  const handleReorderDays = (newOrder: Day[]) => {
    setDays(newOrder)
    // TODO: Gọi API để update order nếu backend hỗ trợ (ví dụ: PUT với thứ tự mới)
  }

  if (loading) {
    return <div className="text-center py-8">Đang tải lịch trình...</div>
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
                      <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm" onClick={() => setEditingDay(day)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setShowAddPoiModal(day.id.toString())}
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
                        <Button variant="ghost" size="sm" onClick={() => setShowAddPoiModal(day.id.toString())} className="mt-2">
                          Thêm điểm đến đầu tiên
                        </Button>
                      </div>
                    ) : (
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
                                  onClick={() => handleDeletePoi(day.id.toString(), poi.id)}
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

      {days.length === 0 && !loading && (
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
          // isLoading={isAddingDay} // Giữ nguyên xóa để tránh lỗi nếu modal không hỗ trợ
        />
      )}

      {showAddPoiModal && (
        <AddPoiModal dayId={showAddPoiModal} onClose={() => setShowAddPoiModal(null)} onSubmit={handleAddPoi} />
      )}

      {editingDay && (
        <EditDayModal
          day={editingDay}
          onClose={() => setEditingDay(null)}
          onSubmit={handleEditDay} // Sử dụng handleEditDay mới
        />
      )}
    </div>
  )
}