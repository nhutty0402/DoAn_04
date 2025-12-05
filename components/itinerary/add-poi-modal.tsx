"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import axios from "axios"
import Cookies from "js-cookie"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { X, MapPin, Clock, FileText, Navigation, Check, ChevronsUpDown } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { motion } from "framer-motion"
import { cn } from "@/lib/utils"

interface AddPoiModalProps {
  dayId: string
  tripId: string
  onClose: () => void
  onSubmit: (dayId: string, poiData: any) => void
}

interface DiemDenOption {
  diem_den_id: number
  ten_diem_den: string
}

export function AddPoiModal({ dayId, tripId, onClose, onSubmit }: AddPoiModalProps) {
  const [formData, setFormData] = useState({
    tieu_de: "",
    gio_bat_dau: "",
    gio_ket_thuc: "",
    ghi_chu: "",
  })
  const [diemDenList, setDiemDenList] = useState<DiemDenOption[]>([])
  const [isLoadingDiemDen, setIsLoadingDiemDen] = useState(false)
  const [openCombobox, setOpenCombobox] = useState(false)
  const [selectedDiemDenId, setSelectedDiemDenId] = useState<string>("")
  const [danhSachNgay, setDanhSachNgay] = useState<string[]>([])
  const [isLoadingNgay, setIsLoadingNgay] = useState(false)
  const [selectedNgay, setSelectedNgay] = useState<string>("")
  const [openNgayCombobox, setOpenNgayCombobox] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()
  const router = useRouter()

  // Fetch danh sách điểm đến khi component mount
  useEffect(() => {
    const fetchDiemDenList = async () => {
      setIsLoadingDiemDen(true)

      // ✅ Lấy token từ cookie
      const token = Cookies.get("token")
      console.log("Token từ cookie (Add POI):", token)

      // ✅ Kiểm tra token hợp lệ
      if (!token || token === "null" || token === "undefined") {
        console.warn("Không có token → chuyển về /login")
        toast({
          title: "Lỗi xác thực",
          description: "Vui lòng đăng nhập để tiếp tục",
          variant: "destructive",
        })
        router.replace("/login")
        setIsLoadingDiemDen(false)
        return
      }

      try {
        // Gọi API GET để lấy danh sách điểm đến
        const response = await axios.get(
          `https://travel-planner-imdw.onrender.com/api/chuyen-di/${tripId}/diem-den/ten`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        )

        console.log("✅ API Response (Get Diem Den List):", response.data)

        // API trả về: [{ diem_den_id, ten_diem_den }, ...]
        const data = Array.isArray(response.data) ? response.data : []
        setDiemDenList(data)

        // Tự động chọn điểm đến nếu dayId trùng với một điểm đến trong danh sách
        // (dayId có thể là diem_den_id)
        if (dayId && data.length > 0) {
          const matchingDiemDen = data.find((d: DiemDenOption) => String(d.diem_den_id) === String(dayId))
          if (matchingDiemDen) {
            const diemDenIdStr = String(matchingDiemDen.diem_den_id)
            setSelectedDiemDenId(diemDenIdStr)
            // Tự động fetch danh sách ngày khi tự động chọn điểm đến
            // Gọi sau khi state đã được set
            setTimeout(() => {
              fetchDanhSachNgay(diemDenIdStr)
            }, 100)
          }
        }
      } catch (error: any) {
        console.error("❌ Lỗi khi fetch danh sách điểm đến:", error)

        if (axios.isAxiosError(error)) {
          if (error.response?.status === 401) {
            toast({
              title: "Phiên đăng nhập hết hạn",
              description: "Vui lòng đăng nhập lại",
              variant: "destructive",
            })
            router.replace("/login")
          } else if (error.response?.status === 403) {
            toast({
              title: "Không có quyền",
              description: "Bạn không có quyền xem điểm đến của chuyến đi này",
              variant: "destructive",
            })
          } else if (error.response?.status === 404) {
            console.warn("Không tìm thấy điểm đến cho chuyến đi này")
          } else {
            toast({
              title: "Lỗi tải danh sách điểm đến",
              description: error.response?.data?.message || "Không thể tải danh sách điểm đến",
              variant: "destructive",
            })
          }
        }
      } finally {
        setIsLoadingDiemDen(false)
      }
    }

    fetchDiemDenList()
  }, [tripId, dayId, router, toast])

  const poiTypes = [
    { value: "POI", label: "Điểm tham quan" },
    { value: "hotel", label: "Khách sạn" },
    { value: "transport", label: "Phương tiện" },
    { value: "activity", label: "Hoạt động" },
    { value: "other", label: "Khác" },
  ]

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  // Fetch danh sách ngày khi chọn điểm đến
  const fetchDanhSachNgay = async (diemDenId: string) => {
    setIsLoadingNgay(true)
    setDanhSachNgay([])
    setSelectedNgay("")

    // ✅ Lấy token từ cookie
    const token = Cookies.get("token")
    console.log("Token từ cookie (Fetch Danh Sach Ngay):", token)

    // ✅ Kiểm tra token hợp lệ
    if (!token || token === "null" || token === "undefined") {
      console.warn("Không có token → chuyển về /login")
      toast({
        title: "Lỗi xác thực",
        description: "Vui lòng đăng nhập để tiếp tục",
        variant: "destructive",
      })
      router.replace("/login")
      setIsLoadingNgay(false)
      return
    }

    try {
      // Gọi API GET để lấy danh sách ngày của điểm đến
      const response = await axios.get(
        `https://travel-planner-imdw.onrender.com/api/lich-trinh-ngay/${tripId}`,
        {
          params: {
            diem_den_id: diemDenId,
          },
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      )

      console.log("✅ API Response (Get Danh Sach Ngay):", response.data)

      // API trả về: { danh_sach_ngay: [...] }
      const data = response.data?.danh_sach_ngay || []
      setDanhSachNgay(data)

      // Tự động chọn ngày đầu tiên nếu có
      if (data.length > 0) {
        setSelectedNgay(data[0])
      }
    } catch (error: any) {
      console.error("❌ Lỗi khi fetch danh sách ngày:", error)

      if (axios.isAxiosError(error)) {
        if (error.response?.status === 401) {
          toast({
            title: "Phiên đăng nhập hết hạn",
            description: "Vui lòng đăng nhập lại",
            variant: "destructive",
          })
          router.replace("/login")
        } else if (error.response?.status === 403) {
          toast({
            title: "Không có quyền",
            description: "Bạn không có quyền xem danh sách ngày của điểm đến này",
            variant: "destructive",
          })
        } else if (error.response?.status === 400) {
          // Điểm đến chưa có ngày bắt đầu và ngày kết thúc
          toast({
            title: "Điểm đến chưa có ngày",
            description: error.response?.data?.message || "Điểm đến này chưa có ngày bắt đầu và ngày kết thúc",
            variant: "destructive",
          })
        } else if (error.response?.status === 404) {
          toast({
            title: "Không tìm thấy điểm đến",
            description: error.response?.data?.message || "Không tìm thấy điểm đến",
            variant: "destructive",
          })
        } else {
          toast({
            title: "Lỗi tải danh sách ngày",
            description: error.response?.data?.message || "Không thể tải danh sách ngày",
            variant: "destructive",
          })
        }
      }
    } finally {
      setIsLoadingNgay(false)
    }
  }

  // Xử lý khi chọn điểm đến từ dropdown
  const handleDiemDenSelect = (diemDenId: string) => {
    const selectedDiemDen = diemDenList.find((d) => String(d.diem_den_id) === diemDenId)

    if (selectedDiemDen) {
      setSelectedDiemDenId(diemDenId)
      setOpenCombobox(false)

      // Tự động fetch danh sách ngày khi chọn điểm đến
      fetchDanhSachNgay(diemDenId)

      toast({
        title: "Đã chọn điểm đến",
        description: `Đã chọn: ${selectedDiemDen.ten_diem_den}`,
      })
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validation: Kiểm tra đã chọn điểm đến chưa
    if (!selectedDiemDenId) {
      toast({
        title: "Thiếu thông tin",
        description: "Vui lòng chọn điểm đến từ chuyến đi",
        variant: "destructive",
      })
      return
    }

    // Validation: Kiểm tra đã chọn ngày chưa
    if (!selectedNgay) {
      toast({
        title: "Thiếu thông tin",
        description: "Vui lòng chọn ngày",
        variant: "destructive",
      })
      return
    }

    // Validation: Kiểm tra tiêu đề
    if (!formData.tieu_de || formData.tieu_de.trim() === "") {
      toast({
        title: "Thiếu thông tin",
        description: "Vui lòng nhập tiêu đề",
        variant: "destructive",
      })
      return
    }

    // Validation: Kiểm tra giờ bắt đầu và kết thúc
    if (!formData.gio_bat_dau || formData.gio_bat_dau.trim() === "") {
      toast({
        title: "Thiếu thông tin",
        description: "Vui lòng nhập giờ bắt đầu",
        variant: "destructive",
      })
      return
    }

    if (!formData.gio_ket_thuc || formData.gio_ket_thuc.trim() === "") {
      toast({
        title: "Thiếu thông tin",
        description: "Vui lòng nhập giờ kết thúc",
        variant: "destructive",
      })
      return
    }

    if (formData.gio_ket_thuc <= formData.gio_bat_dau) {
      toast({
        title: "Lỗi thời gian",
        description: "Giờ kết thúc phải sau giờ bắt đầu",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)

    try {
      // ✅ Lấy token từ cookie
      const token = Cookies.get("token")
      console.log("Token từ cookie (Add Lich Trinh):", token)

      // ✅ Kiểm tra token hợp lệ
      if (!token || token === "null" || token === "undefined") {
        console.warn("Không có token → chuyển về /login")
        toast({
          title: "Lỗi xác thực",
          description: "Vui lòng đăng nhập để tiếp tục",
          variant: "destructive",
        })
        router.replace("/login")
        setIsLoading(false)
        return
      }

      // Chuẩn bị payload theo format API
      const formatTime = (timeValue: string) => {
        // Nếu input type="time" trả về "HH:mm", thêm ":00" để thành "HH:mm:ss"
        if (timeValue && timeValue.length === 5) {
          return `${timeValue}:00`
        }
        return timeValue || null
      }

      const payload = {
        diem_den_id: parseInt(selectedDiemDenId),
        ngay: selectedNgay,
        tieu_de: formData.tieu_de.trim(),
        ghi_chu: formData.ghi_chu || null,
        gio_bat_dau: formatTime(formData.gio_bat_dau),
        gio_ket_thuc: formatTime(formData.gio_ket_thuc),
      }

      console.log("Payload gửi lên API (Add Lich Trinh):", payload)
      console.log("Trip ID:", tripId)
      console.log("Selected Diem Den ID:", selectedDiemDenId)
      console.log("Selected Ngay:", selectedNgay)

      // Gọi API POST để thêm lịch trình
      // Thử endpoint với dấu / ở cuối (như trong itinerary-tab.tsx)
      const response = await axios.post(
        `https://travel-planner-imdw.onrender.com/api/lich-trinh-ngay/`,
        payload,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      )

      console.log("✅ API Response (Add Lich Trinh):", response.data)

      const message = response.data?.message || "Thêm lịch trình thành công"
      const chiTiet = response.data?.chi_tiet
      const huongDan = response.data?.huong_dan

      // Kiểm tra có cảnh báo lịch trình trùng không
      if (chiTiet?.lich_trinh_trung) {
        const lichTrinhTrung = chiTiet.lich_trinh_trung
        const gioMuonDat = chiTiet.gio_muon_dat

        toast({
          title: "Cảnh báo: Lịch trình trùng",
          description: `${message}. ${huongDan || ""} Lịch trình trùng: "${lichTrinhTrung.tieu_de}" vào lúc ${lichTrinhTrung.gio}. Giờ bạn muốn đặt: ${gioMuonDat}`,
          variant: "default",
        })
      } else {
        toast({
          title: "Thêm lịch trình thành công",
          description: message,
        })
      }

      // Gọi onSubmit với dữ liệu từ API
      // Response có thể là { message, lich_trinh_ngay: {...} } hoặc { message, lich_trinh_ngay_id, ... }
      const lichTrinhNgay = response.data?.lich_trinh_ngay || response.data
      const lichTrinhNgayId = lichTrinhNgay?.lich_trinh_ngay_id || response.data?.lich_trinh_ngay_id || response.data?.id

      console.log("✅ Lich Trinh Ngay ID từ response:", lichTrinhNgayId)
      console.log("✅ Full response data:", response.data)

      onSubmit(dayId, {
        ...payload,
        lich_trinh_ngay_id: lichTrinhNgayId,
      })

      onClose()
    } catch (error: any) {
      console.error("❌ Lỗi khi thêm lịch trình:", error)

      if (axios.isAxiosError(error)) {
        if (error.response?.status === 401) {
          toast({
            title: "Phiên đăng nhập hết hạn",
            description: "Vui lòng đăng nhập lại",
            variant: "destructive",
          })
          router.replace("/login")
        } else if (error.response?.status === 403) {
          toast({
            title: "Không có quyền",
            description: error.response?.data?.message || "Bạn không có quyền thêm lịch trình",
            variant: "destructive",
          })
        } else if (error.response?.status === 400) {
          const errorMessage = error.response?.data?.message || "Vui lòng kiểm tra lại thông tin"
          console.error("❌ Lỗi 400 - Chi tiết:", error.response?.data)
          toast({
            title: "Dữ liệu không hợp lệ",
            description: errorMessage,
            variant: "destructive",
          })
        } else if (error.response?.status === 404) {
          const errorMessage = error.response?.data?.message || "Không tìm thấy endpoint hoặc tài nguyên"
          console.error("❌ Lỗi 404 - Chi tiết:", error.response?.data)
          console.error("❌ URL được gọi:", `https://travel-planner-imdw.onrender.com/api/lich-trinh-ngay/`)
          console.error("❌ Request config:", error.config)
          toast({
            title: "Không tìm thấy",
            description: errorMessage,
            variant: "destructive",
          })
        } else if (error.response?.status === 409) {
          // Conflict - Lịch trình trùng
          const chiTiet = error.response?.data?.chi_tiet
          const huongDan = error.response?.data?.huong_dan
          if (chiTiet?.lich_trinh_trung) {
            toast({
              title: "Lịch trình trùng",
              description: `${error.response?.data?.message || "Lịch trình trùng với lịch trình khác"}. ${huongDan || ""}`,
              variant: "destructive",
            })
          } else {
            toast({
              title: "Lịch trình trùng",
              description: error.response?.data?.message || "Lịch trình trùng với lịch trình khác",
              variant: "destructive",
            })
          }
        } else {
          toast({
            title: "Lỗi thêm lịch trình",
            description: error.response?.data?.message || "Có lỗi xảy ra khi thêm lịch trình",
            variant: "destructive",
          })
        }
      } else {
        toast({
          title: "Lỗi thêm lịch trình",
          description: "Có lỗi xảy ra khi thêm lịch trình",
          variant: "destructive",
        })
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-card rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto"
      >
        <Card className="border-0 shadow-none">
          <CardHeader className="relative">
            <Button variant="ghost" size="icon" className="absolute right-2 top-2" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
            <CardTitle className="text-2xl font-[family-name:var(--font-space-grotesk)]">Thêm Lịch Trình</CardTitle>
            <CardDescription className="font-[family-name:var(--font-dm-sans)]">
              Thêm một lịch trình mới vào điểm đến bạn chọn
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Điểm đến và Ngày cùng một hàng */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="diem_den">Chọn điểm đến <span className="text-red-500">*</span></Label>
                  <Popover open={openCombobox} onOpenChange={setOpenCombobox}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={openCombobox}
                        className="w-full justify-between"
                        disabled={isLoadingDiemDen}
                      >
                        {selectedDiemDenId
                          ? diemDenList.find((d) => String(d.diem_den_id) === selectedDiemDenId)?.ten_diem_den
                          : isLoadingDiemDen
                            ? "Đang tải..."
                            : "Chọn điểm đến"}
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-full p-0" align="start">
                      {/* này là phần chọn điểm  */}
                      <Command>
                        <CommandInput placeholder="Tìm kiếm điểm đến..." />
                        <CommandList>
                          <CommandEmpty>
                            {isLoadingDiemDen ? "Đang tải..." : "Không tìm thấy điểm đến."}
                          </CommandEmpty>
                          <CommandGroup>
                            {diemDenList.map((diemDen) => (
                              <CommandItem
                                key={diemDen.diem_den_id}
                                value={diemDen.ten_diem_den}
                                onSelect={() => handleDiemDenSelect(String(diemDen.diem_den_id))}
                              >
                                <Check
                                  className={cn(
                                    "mr-2 h-4 w-4",
                                    selectedDiemDenId === String(diemDen.diem_den_id) ? "opacity-100" : "opacity-0"
                                  )}
                                />
                                {diemDen.ten_diem_den}
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="ngay">Chọn ngày <span className="text-red-500">*</span></Label>
                  <Popover open={openNgayCombobox} onOpenChange={setOpenNgayCombobox}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={openNgayCombobox}
                        className="w-full justify-between"
                        disabled={!selectedDiemDenId || isLoadingNgay || danhSachNgay.length === 0}
                      >
                        {selectedNgay
                          ? new Date(selectedNgay).toLocaleDateString("vi-VN")
                          : isLoadingNgay
                            ? "Đang tải ngày..."
                            : !selectedDiemDenId
                            ? "Chọn điểm đến trước"
                            : danhSachNgay.length === 0
                            ? "Không có ngày"
                            : "Chọn ngày"}
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-full p-0" align="start">
                      <Command>
                        <CommandInput placeholder="Tìm kiếm ngày..." />
                        <CommandList>
                          <CommandEmpty>
                            {isLoadingNgay ? "Đang tải..." : "Không tìm thấy ngày."}
                          </CommandEmpty>
                          <CommandGroup>
                            {danhSachNgay.map((ngay) => (
                              <CommandItem
                                key={ngay}
                                value={ngay}
                                onSelect={() => {
                                  setSelectedNgay(ngay)
                                  setOpenNgayCombobox(false)
                                }}
                              >
                                <Check
                                  className={cn(
                                    "mr-2 h-4 w-4",
                                    selectedNgay === ngay ? "opacity-100" : "opacity-0"
                                  )}
                                />
                                {new Date(ngay).toLocaleDateString("vi-VN", {
                                  weekday: "long",
                                  year: "numeric",
                                  month: "long",
                                  day: "numeric",
                                })}
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                  {/* {selectedDiemDenId && danhSachNgay.length === 0 && !isLoadingNgay && (
                    <p className="text-xs text-muted-foreground">
                      ⚠️ Điểm đến này chưa có ngày bắt đầu và ngày kết thúc
                    </p>
                  )} */}
                </div>
              </div>

              {diemDenList.length === 0 && !isLoadingDiemDen && (
                <p className="text-xs text-muted-foreground">
                  ⚠️ Chưa có lịch trình nào trong điểm đến. 
                </p>
              )}
              <div className="space-y-2">
                <Label htmlFor="tieu_de">Tiêu đề <span className="text-red-500">*</span></Label>
                <div className="relative">
                  <Input
                    id="tieu_de"
                    type="text"
                    placeholder="Ví dụ: Tham quan Cầu Rồng, Ăn trưa tại Chợ Hàn..."
                    value={formData.tieu_de}
                    onChange={(e) => handleChange("tieu_de", e.target.value)}
                    className="pl-3"
                    required
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  💡 Tiêu đề mô tả hoạt động trong ngày này
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="gio_bat_dau">Giờ bắt đầu <span className="text-red-500">*</span></Label>
                  <div className="relative">
                    <Clock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="gio_bat_dau"
                      type="time"
                      value={formData.gio_bat_dau}
                      onChange={(e) => handleChange("gio_bat_dau", e.target.value)}
                      className="pl-10"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="gio_ket_thuc">Giờ kết thúc <span className="text-red-500">*</span></Label>
                  <div className="relative">
                    <Clock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="gio_ket_thuc"
                      type="time"
                      value={formData.gio_ket_thuc}
                      onChange={(e) => handleChange("gio_ket_thuc", e.target.value)}
                      className="pl-10"
                      required
                      min={formData.gio_bat_dau || undefined}
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="ghi_chu">Ghi chú (tùy chọn)</Label>
                <div className="relative">
                  <FileText className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Textarea
                    id="ghi_chu"
                    placeholder="Ghi chú về lịch trình này..."
                    value={formData.ghi_chu}
                    onChange={(e) => handleChange("ghi_chu", e.target.value)}
                    className="pl-10 min-h-[80px] resize-none"
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <Button type="button" variant="outline" onClick={onClose} className="flex-1 bg-transparent">
                  Hủy
                </Button>
                <Button type="submit" className="flex-1 bg-primary hover:bg-primary/90" disabled={isLoading}>
                  {isLoading ? "Đang thêm..." : "Thêm Lịch Trình"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}
