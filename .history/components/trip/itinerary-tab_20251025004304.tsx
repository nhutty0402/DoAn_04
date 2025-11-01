"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation" // <-- THÊM
import Cookies from "js-cookie" // <-- THÊM
import axios from "axios" // <-- THÊM
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
      // {
      //   id: "poi2",
      //   tenDiaDiem: "Chợ Hàn",
      //   loaiDiaDiem: "shopping",
      //   gioBatDau: "11:00",
      //   gioKetThuc: "12:30",
      //   ghiChu: "Mua sắm và ăn trưa",
      //   toaDo: { lat: 16.0678, lng: 108.2208 },
      //   thoiGianDiChuyen: 15,
      // },
      // {
      //   id: "poi3",
      //   tenDiaDiem: "Bãi biển Mỹ Khê",
      //   loaiDiaDiem: "beach",
      //   gioBatDau: "15:00",
      //   gioKetThuc: "18:00",
      //   ghiChu: "Tắm biển và ngắm hoàng hôn",
      //   toaDo: { lat: 16.0471, lng: 108.2487 },
      //   thoiGianDiChuyen: 20,
      // },
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

interface Day {
  id: string
  ngay: string
  tieuDe: string
  ghiChu?: string
  pois: any[]
}

export function ItineraryTab({ tripId }: ItineraryTabProps) {
  const [days, setDays] = useState<Day[]>([])
  const [isLoadingDays, setIsLoadingDays] = useState(false)
  const [isAddingDay, setIsAddingDay] = useState(false)
  const [showAddDayModal, setShowAddDayModal] = useState(false)
  const [showAddPoiModal, setShowAddPoiModal] = useState<string | null>(null)
  const [editingDay, setEditingDay] = useState<Day | null>(null)
  const { toast } = useToast()
  const router = useRouter()

  // Handlers for modals
  const handleAddDay = async (formData: any) => {
    if (isAddingDay) return
    setIsAddingDay(true)
    
    try {
      const token = Cookies.get("token")
      const response = await axios.post(
        `https://travel-planner-imdw.onrender.com/api/lich-trinh-ngay`, 
        {
          ...formData,
          chuyen_di_id: tripId
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      )

      const newDay = response.data
      setDays([...days, {
        id: newDay.lich_trinh_ngay_id || newDay.id,
        ngay: newDay.ngay,
        tieuDe: newDay.tieu_de || newDay.tieuDe || "",
        ghiChu: newDay.ghi_chu || newDay.ghiChu || "",
        pois: [],
      }])

      setShowAddDayModal(false)
      toast({
        title: "Thành công",
        description: "Đã thêm ngày mới vào lịch trình",
      })
    } catch (error) {
      console.error("Error adding day:", error)
      toast({
        title: "Lỗi",
        description: "Không thể thêm ngày. Vui lòng thử lại sau.",
        variant: "destructive",
      })
    } finally {
      setIsAddingDay(false)
    }
  }

  const handleAddPoi = async (formData: any) => {
    // Implement POI adding logic here
    setShowAddPoiModal(null)
  }

  // Fetch danh sách ngày khi component mount
  useEffect(() => {
    const fetchDaysList = async () => {
      setIsLoadingDays(true)
      const token = Cookies.get("token")
      console.log("Token từ cookie:", token)

      if (!token || token === "null" || token === "undefined") {
        console.warn("Không có token → chuyển về /login")
        router.replace("/login")
        return
      }

      try {
        console.log("Starting API call with:", { tripId, token: token?.slice(0, 10) })

        // Try different URL structures
        const urls = [
          `https://travel-planner-imdw.onrender.com/api/lich-trinh-ngay?chuyen_di_id=${tripId}`,
          `https://travel-planner-imdw.onrender.com/api/lich-trinh-ngay/${tripId}`,
          `https://travel-planner-imdw.onrender.com/api/lich_trinh_ngay?chuyen_di_id=${tripId}`
        ]

        let response = null
        let error = null

        for (const url of urls) {
          try {
            console.log("Trying URL:", url)
            response = await axios.get(url, {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            })
            if (response.data) {
              console.log("Success with URL:", url)
              break
            }
          } catch (e) {
            const err = e as { response?: { status: number } }
            console.log("Failed with URL:", url, err.response?.status)
            error = err
          }
        }

        if (!response) {
          throw error || new Error("All URLs failed")
        }

        console.log("Raw API Response:", response.data)

        // Map API response to component state
        let daysFromApi = []
        if (Array.isArray(response.data)) {
          daysFromApi = response.data
        } else if (response.data.data && Array.isArray(response.data.data)) {
          daysFromApi = response.data.data
        } else if (typeof response.data === 'object') {
          // If it's a single day, wrap in array
          daysFromApi = [response.data]
        }

        console.log("Processed days from API:", daysFromApi)

        const mappedDays = daysFromApi.map((day: any) => ({
          id: day.lich_trinh_ngay_id || day.id,
          ngay: day.ngay,
          tieuDe: day.tieu_de || day.tieuDe || "",
          ghiChu: day.ghi_chu || day.ghiChu || "",
          pois: day.pois || [],
        }))

        console.log("Final mapped days:", mappedDays)
        setDays(mappedDays)
      } catch (error: any) {
        console.error("Lỗi khi tải danh sách ngày:", error.response || error)
        
        // Handle 401/403 errors
        if (error.response?.status === 401 || error.response?.status === 403) {
          toast({
            title: "Phiên đăng nhập hết hạn",
            description: "Token không hợp lệ hoặc đã hết hạn. Vui lòng đăng nhập lại.",
            variant: "destructive",
          })
          router.replace("/login")
          return
        }

        toast({
          title: "Lỗi khi tải danh sách",
          description: "Không thể tải danh sách ngày. Vui lòng thử lại sau.",
          variant: "destructive",
        })
      } finally {
        setIsLoadingDays(false)
      }
    }

    if (tripId) {
      fetchDaysList()
    }
  }, [tripId, router, toast])

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
    // Nếu đang trong quá trình thêm, không cho bấm nữa
    if (isAddingDay) return
    
    setIsAddingDay(true) // Bắt đầu loading
    
    // Lấy token từ cookie
    const token = Cookies.get("token")
    console.log("Token từ cookie:", token)

    // Kiểm tra token như bạn yêu cầu
    if (!token || token === "null" || token === "undefined") {
      console.warn("Không có token → chuyển về /login")
      toast({
        title: "Lỗi xác thực",
        description: "Không tìm thấy token. Đang chuyển về trang đăng nhập.",
        variant: "destructive",
      })
      router.replace("/login")
      setIsAddingDay(false) // Dừng loading
      return // Dừng hàm
    }

    try {
      // Chuẩn bị payload
      const payload = {
        chuyen_di_id: tripId,
        ngay: dayData.ngay,
        tieu_de: dayData.tieuDe,
        ghi_chu: dayData.ghiChu,
      }

      // Gọi API với header Authorization
      const response = await axios.post(
        "https://travel-planner-imdw.onrender.com/api/lich-trinh-ngay",
        payload,
        {
          headers: {
            Authorization: `Bearer ${token}`, // <-- THÊM TOKEN VÀO HEADER
          },
        }
      )

      // Giả sử API trả về đối tượng ngày vừa tạo
      const newDayFromApi = response.data

      // Ánh xạ dữ liệu trả về từ API (snake_case) sang state (camelCase)
      const newDayForState = {
        id: newDayFromApi.id, // Giả sử API trả về 'id'
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

      // Xử lý lỗi 401
      if (axios.isAxiosError(error) && error.response?.status === 401) {
        toast({
          title: "Phiên đăng nhập hết hạn",
          description: "Token không hợp lệ hoặc đã hết hạn. Vui lòng đăng nhập lại.",
          variant: "destructive",
        })
        router.replace("/login") // Chuyển về login khi 401
      } else {
        toast({
          title: "Lỗi",
          description: "Không thể thêm ngày mới. Vui lòng thử lại.",
          variant: "destructive",
        })
      }
    } finally {
      setIsAddingDay(false) // Dừng loading
    }
  }

  const handleAddPoi = (dayId: string, poiData: any) => {
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
    // ... (hàm này không thay đổi) ...
    setDays(days.map((day) => (day.id === dayId ? { ...day, pois: day.pois.filter((poi: any) => poi.id !== poiId) } : day)))
    toast({
      title: "Đã xóa điểm đến",
      description: "Điểm đến đã được xóa khỏi lịch trình",
    })
  }

  const handleReorderDays = (newOrder: any[]) => {
    // ... (hàm này không thay đổi) ...
    setDays(newOrder)
  }

  console.log("Debug render:", { tripId, days, token: Cookies.get("token") })
  
  return (
    <div className="space-y-6">
      {/* Debug info */}
      <div className="bg-yellow-50 p-4 rounded-lg mb-4">
        <p className="font-semibold mb-2">Debug Info:</p>
        <pre className="text-sm whitespace-pre-wrap">
          {JSON.stringify({
            tripId,
            isLoadingDays,
            daysCount: days.length,
            days: days
          }, null, 2)}
        </pre>
      </div>

      {/* Simple list for debugging */}
      <div className="space-y-4">
        {isLoadingDays ? (
          <div>Đang tải...</div>
        ) : days.length === 0 ? (
          <div>Chưa có ngày nào</div>
        ) : (
          days.map(day => (
            <div key={day.id} className="p-4 border rounded">
              <h3>{day.tieuDe}</h3>
              <p>{day.ngay}</p>
              {day.ghiChu && <p className="text-gray-600">{day.ghiChu}</p>}
            </div>
          ))
        )}
      </div>
    </div>
  )
      {isLoadingDays ? (
        // Loading state
        <div className="space-y-4">
          {[1, 2].map((n) => (
            <Card key={n} className="border-l-4 border-l-primary animate-pulse">
              <CardHeader>
                <div className="h-6 bg-muted rounded w-1/3"></div>
                <div className="h-4 bg-muted rounded w-1/4 mt-2"></div>
              </CardHeader>
              <CardContent>
                <div className="h-24 bg-muted rounded"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="space-y-6">
            {days.map((day, dayIndex) => (
              <div key={day.id}>
              {/* hiện danh sách thêm ngày */}
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
      {/* <-- SỬA LỖI: Xóa prop 'isLoading' khỏi lời gọi để tránh crash --> */}
      {showAddDayModal && (
        <AddDayModal
          onClose={() => setShowAddDayModal(false)}
          onSubmit={handleAddDay}
          // isLoading={isAddingDay} // <-- Dòng này gây lỗi nên tạm thời xóa
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
