"use client"

import { useState, useEffect } from "react" // <-- THÊM useEffect
import { useRouter } from "next/navigation"
import Cookies from "js-cookie"
import axios from "axios"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Plus, Calendar, Clock, MapPin, GripVertical, Edit, Trash2, AlertCircle, Loader2 } from "lucide-react" // <-- THÊM Loader2
import { AddDayModal } from "@/components/itinerary/add-day-modal"
import { AddPoiModal } from "@/components/itinerary/add-poi-modal"
import { EditDayModal } from "@/components/itinerary/edit-day-modal"
import { Badge } from "@/components/ui/badge"
import { motion, Reorder } from "framer-motion"
import { useToast } from "@/hooks/use-toast"

// KHÔNG DÙNG MOCK DATA NỮA
// const mockItinerary = [ ... ]

interface ItineraryTabProps {
  tripId: string
}

// --- KIỂU DỮ LIỆU TỪ API (snake_case) ---
interface ApiDay {
  lich_trinh_ngay_id: string;
  chuyen_di_id: string;
  ngay: string;
  tieu_de: string;
  ghi_chu: string | null;
  pois: ApiPoi[]; // Giả sử API trả về POI lồng nhau
}

interface ApiPoi {
  id: string; // Giả sử POI id
  ten_dia_diem: string;
  loai_dia_diem: string;
  gio_bat_dau: string;
  gio_ket_thuc: string;
  ghi_chu: string | null;
  // ... các trường snake_case khác của POI
}

// --- KIỂU DỮ LIỆU TRONG STATE (camelCase) ---
interface DayState {
  id: string;
  ngay: string;
  tieuDe: string;
  ghiChu: string | null;
  pois: PoiState[];
}

interface PoiState {
  id: string;
  tenDiaDiem: string;
  loaiDiaDiem: string;
  gioBatDau: string;
  gioKetThuc: string;
  ghiChu: string | null;
  toaDo?: { lat: number, lng: number }; // Giữ lại từ mock cũ
  thoiGianDiChuyen: number; // Giữ lại từ mock cũ
}


export function ItineraryTab({ tripId }: ItineraryTabProps) {
  // Bắt đầu với mảng rỗng, thay vì mock data
  const [days, setDays] = useState<DayState[]>([])
  const [isLoading, setIsLoading] = useState(true) // <-- THÊM STATE LOADING
  const [error, setError] = useState<string | null>(null) // <-- THÊM STATE ERROR
  const [showAddDayModal, setShowAddDayModal] = useState(false)
  const [showAddPoiModal, setShowAddPoiModal] = useState<string | null>(null)
  const [editingDay, setEditingDay] = useState<DayState | null>(null) // <-- Gõ DayState
  const [isAddingDay, setIsAddingDay] = useState(false)
  const { toast } = useToast()
  const router = useRouter()

  // --- HÀM ÁNH XẠ (MAPPING) ---
  // Biến đổi POI từ API (snake_case) sang State (camelCase)
  const mapApiPoiToState = (apiPoi: ApiPoi): PoiState => ({
    id: apiPoi.id,
    tenDiaDiem: apiPoi.ten_dia_diem,
    loaiDiaDiem: apiPoi.loai_dia_diem,
    gioBatDau: apiPoi.gio_bat_dau,
    gioKetThuc: apiPoi.gio_ket_thuc,
    ghiChu: apiPoi.ghi_chu,
    thoiGianDiChuyen: Math.floor(Math.random() * 30) + 5, // Mock travel time
  });

  // Biến đổi Ngày từ API (snake_case) sang State (camelCase)
  const mapApiDayToState = (apiDay: ApiDay): DayState => ({
    id: apiDay.lich_trinh_ngay_id, // Quan trọng: Dùng lich_trinh_ngay_id
    ngay: apiDay.ngay,
    tieuDe: apiDay.tieu_de,
    ghiChu: apiDay.ghi_chu,
    pois: (apiDay.pois || []).map(mapApiPoiToState).sort((a, b) => a.gioBatDau.localeCompare(b.gioBatDau)),
  });

  // --- GỌI API ĐỂ LẤY DANH SÁCH NGÀY ---
  useEffect(() => {
    const fetchItineraryDays = async () => {
      const token = Cookies.get("token")
      if (!token || token === "null" || token === "undefined") {
        toast({
          title: "Lỗi xác thực",
          description: "Không tìm thấy token. Đang chuyển về trang đăng nhập.",
          variant: "destructive",
        })
        router.replace("/login")
        return
      }

      try {
        setIsLoading(true)
        setError(null)
        
        // Gọi API GET, lọc theo chuyen_di_id (đây là một phỏng đoán hợp lý)
        // Nếu endpoint của bạn khác, hãy thay đổi nó ở đây.
        const response = await axios.get(
          `https://travel-planner-imdw.onrender.com/api/lich-trinh-ngay/`,
          {
            params: {
              chuyen_di_id: tripId 
            },
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        )

        // Ánh xạ (map) dữ liệu trả về từ API (mảng ApiDay[]) sang mảng DayState[]
        const fetchedDays: DayState[] = response.data.map(mapApiDayToState);
        setDays(fetchedDays)

      } catch (err) {
        console.error("Lỗi khi tải lịch trình:", err)
        setError("Không thể tải dữ liệu lịch trình.")
        if (axios.isAxiosError(err) && err.response?.status === 401) {
          toast({
            title: "Phiên đăng nhập hết hạn",
            description: "Vui lòng đăng nhập lại.",
            variant: "destructive",
          })
          router.replace("/login")
        }
      } finally {
        setIsLoading(false)
      }
    }

    fetchItineraryDays()
  }, [tripId, router, toast]) // Thêm dependencies

  const getPoiTypeLabel = (type: string) => {
    // ... (hàm này không thay đổi) ...
    const types = {
      landmark: { label: "Địa danh", color: "bg-blue-100 text-blue-800" },
      restaurant: { label: "Nhà hàng", color: "bg-green-100 text-green-800" },
      hotel: { label: "Khách sạn", color: "bg-purple-100 text-purple-800" },
      shopping: { label: "Mua sắm", color: "bg-yellow-100 text-yellow-800" },
      beach: { label: "Bãi biển", color: "bg-cyan-100 text-cyan-800" },
      historic: { label: "Lịch sử", color: "bg-orange-100 text-orange-800" },
      // Thêm các loại khác nếu API của bạn trả về
      AN_UONG: { label: "Ăn uống", color: "bg-green-100 text-green-800" },
      THAM_QUAN: { label: "Tham quan", color: "bg-blue-100 text-blue-800" },
    }
    return types[type as keyof typeof types] || { label: type, color: "bg-gray-100 text-gray-800" }
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

  const handleAddDay = async (dayData: any) => {
    if (isAddingDay) return
    setIsAddingDay(true)
    const token = Cookies.get("token")
    
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

      const response = await axios.post(
        "https://travel-planner-imdw.onrender.com/api/lich-trinh-ngay/", // <-- Thêm dấu / cho nhất quán
        payload,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      )

      // Giờ response.data là 1 đối tượng ApiDay
      const newDayFromApi: ApiDay = response.data

      // Sử dụng hàm map để chuyển đổi nó sang DayState
      const newDayForState: DayState = mapApiDayToState(newDayFromApi);

      setDays([...days, newDayForState]) // Thêm ngày mới đã được map vào state
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

  const handleAddPoi = (dayId: string, poiData: any) => {
    // TODO: Cập nhật hàm này để gọi API POST /api/diem-den/ (tương tự handleAddDay)
    // ... (hàm này không thay đổi) ...
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
    // TODO: Cập nhật hàm này để gọi API DELETE /api/diem-den/{poiId}/
    // ... (hàm này không thay đổi) ...
    setDays(days.map((day) => (day.id === dayId ? { ...day, pois: day.pois.filter((poi) => poi.id !== poiId) } : day)))
    toast({
      title: "Đã xóa điểm đến",
      description: "Điểm đến đã được xóa khỏi lịch trình",
    })
  }

  const handleReorderDays = (newOrder: any[]) => {
    // TODO: Cần gọi API để cập nhật thứ tự
    // ... (hàm này không thay đổi) ...
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
  t   </div>

      {/* --- HIỂN THỊ TRẠNG THÁI LOADING VÀ ERROR --- */}
      {isLoading && (
        <div className="flex items-center justify-center py-12 text-muted-foreground">
          <Loader2 className="h-8 w-8 animate-spin mr-3" />
          <span>Đang tải lịch trình...</span>
        </div>
      )}

      {error && !isLoading && (
         <div className="flex items-center justify-center py-12 text-destructive">
           <AlertCircle className="h-8 w-8 mr-3" />
           <span>{error}</span>
         </div>
      )}

      {/* Timeline */}
      {!isLoading && !error && days.length > 0 && (
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
              _             <Edit className="h-4 w-4" />
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
                      D   <MapPin className="h-8 w-8 mx-auto mb-2 opacity-50" />
                          <p>Chưa có điểm đến nào</p>
                          <Button variant="ghost" size="sm" onClick={() => setShowAddPoiModal(day.id)} className="mt-2">
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


      {/* Màn hình trống khi không có lịch trình (sau khi đã tải xong) */}
      {!isLoading && !error && days.length === 0 && (
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
            // TODO: Cần gọi API PUT/PATCH để cập nhật ngày
            setDays(days.map((day) => (day.id === editingDay.id ? { ...day, ...dayData } : day)))
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