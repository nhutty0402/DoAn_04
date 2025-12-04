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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { X, Calendar, FileText, Plus, Trash2, Check, ChevronsUpDown } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { motion } from "framer-motion"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { cn } from "@/lib/utils"

interface AddDayModalProps {
  onClose: () => void
  onSubmit: (dayData: any) => void
  tripId: string
}

interface DiemDenItem {
  ten_diem_den: string
  ngay_bat_dau: string
  ngay_ket_thuc: string
  ghi_chu: string
}

// Danh sách tỉnh thành Việt Nam
const TINH_THANH = [
  "An Giang",
  "Bà Rịa - Vũng Tàu",
  "Bạc Liêu",
  "Bắc Giang",
  "Bắc Kạn",
  "Bắc Ninh",
  "Bến Tre",
  "Bình Định",
  "Bình Dương",
  "Bình Phước",
  "Bình Thuận",
  "Cà Mau",
  "Cao Bằng",
  "Cần Thơ (thành phố)",
  "Đà Nẵng (thành phố)",
  "Đắk Lắk",
  "Đắk Nông",
  "Điện Biên",
  "Đồng Nai",
  "Đồng Tháp",
  "Gia Lai",
  "Hà Giang",
  "Hà Nam",
  "Hà Nội (thủ đô)",
  "Hải Dương",
  "Hải Phòng (thành phố)",
  "Hậu Giang",
  "Hòa Bình",
  "Thành phố Hồ Chí Minh (thành phố)",
  "Hưng Yên",
  "Khánh Hòa",
  "Kiên Giang",
  "Kon Tum",
  "Lai Châu",
  "Lạng Sơn",
  "Lào Cai",
  "Lâm Đồng",
  "Long An",
  "Nam Định",
  "Nghệ An",
  "Ninh Bình",
  "Ninh Thuận",
  "Phú Thọ",
  "Phú Yên",
  "Quảng Bình",
  "Quảng Nam",
  "Quảng Ngãi",
  "Quảng Ninh",
  "Quảng Trị",
  "Sóc Trăng",
  "Sơn La",
  "Tây Ninh",
  "Thái Bình",
  "Thái Nguyên",
  "Thanh Hóa",
  "Thừa Thiên Huế",
  "Tiền Giang",
  "Trà Vinh",
  "Tuyên Quang",
  "Vĩnh Long",
  "Vĩnh Phúc",
  "Yên Bái",
]

export function AddDayModal({ onClose, onSubmit, tripId }: AddDayModalProps) {
  const [activeTab, setActiveTab] = useState("single")
  const [formData, setFormData] = useState({
    ten_diem_den: "",
    ngay_bat_dau: "",
    ngay_ket_thuc: "",
    ghi_chu: "",
  })
  const [batchDiemDen, setBatchDiemDen] = useState<DiemDenItem[]>([
    { ten_diem_den: "", ngay_bat_dau: "", ngay_ket_thuc: "", ghi_chu: "" }
  ])
  const [isLoading, setIsLoading] = useState(false)
  const [openCombobox, setOpenCombobox] = useState(false)
  const [openBatchCombobox, setOpenBatchCombobox] = useState<boolean[]>([])
  const [existingDiemDen, setExistingDiemDen] = useState<string[]>([]) // Danh sách tỉnh thành đã có
  const { toast } = useToast()
  const router = useRouter()

  // Khởi tạo openBatchCombobox với độ dài đúng
  useEffect(() => {
    setOpenBatchCombobox(new Array(batchDiemDen.length).fill(false))
  }, [batchDiemDen.length])

  // Fetch danh sách điểm đến hiện có để kiểm tra trùng lặp
  useEffect(() => {
    const fetchExistingDiemDen = async () => {
      const token = Cookies.get("token")
      if (!token || token === "null" || token === "undefined") {
        return
      }

      try {
        const response = await axios.get(
          `https://travel-planner-imdw.onrender.com/api/chuyen-di/${tripId}/diem-den`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        )

        const data = response.data?.data || []
        // Lấy danh sách tên điểm đến (tỉnh thành) đã có
        const tenDiemDenList = data.map((diem: any) => diem.ten_diem_den?.trim().toLowerCase() || "")
        setExistingDiemDen(tenDiemDenList)
      } catch (error) {
        console.error("Lỗi khi fetch danh sách điểm đến:", error)
        // Không hiển thị lỗi vì đây chỉ là để validation
      }
    }

    fetchExistingDiemDen()
  }, [tripId])

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  // Hàm thêm điểm đến mới vào danh sách batch
  const addBatchDiemDen = () => {
    setBatchDiemDen([...batchDiemDen, { ten_diem_den: "", ngay_bat_dau: "", ngay_ket_thuc: "", ghi_chu: "" }])
    setOpenBatchCombobox([...openBatchCombobox, false])
  }

  // Hàm xóa điểm đến khỏi danh sách batch
  const removeBatchDiemDen = (index: number) => {
    if (batchDiemDen.length > 1) {
      setBatchDiemDen(batchDiemDen.filter((_, i) => i !== index))
      const newOpen = openBatchCombobox.filter((_, i) => i !== index)
      setOpenBatchCombobox(newOpen)
    }
  }

  // Hàm cập nhật điểm đến trong danh sách batch
  const updateBatchDiemDen = (index: number, field: keyof DiemDenItem, value: string) => {
    const updated = [...batchDiemDen]
    updated[index] = { ...updated[index], [field]: value }
    setBatchDiemDen(updated)
  }

  // Validation cho batch
  const validateBatchDiemDen = (): { isValid: boolean; errors: any[] } => {
    const errors: any[] = []
    
    batchDiemDen.forEach((diem, index) => {
      const viTri = index + 1
      
      // Kiểm tra tên điểm đến
      if (!diem.ten_diem_den || diem.ten_diem_den.trim() === "") {
        errors.push({
          vi_tri: viTri,
          ten_diem_den: diem.ten_diem_den || "(Không có tên)",
          ly_do: "Tên điểm đến là bắt buộc"
        })
        return
      }

      // Kiểm tra ngày bắt đầu <= ngày kết thúc
      if (diem.ngay_bat_dau && diem.ngay_ket_thuc) {
        const ngayBatDau = new Date(diem.ngay_bat_dau)
        const ngayKetThuc = new Date(diem.ngay_ket_thuc)
        if (ngayBatDau > ngayKetThuc) {
          errors.push({
            vi_tri: viTri,
            ten_diem_den: diem.ten_diem_den,
            ly_do: `Ngày bắt đầu (${diem.ngay_bat_dau}) phải nhỏ hơn hoặc bằng ngày kết thúc (${diem.ngay_ket_thuc})`
          })
          return
        }
      }

      // Kiểm tra phải có cả hai ngày hoặc không có ngày nào
      if ((diem.ngay_bat_dau && !diem.ngay_ket_thuc) || (!diem.ngay_bat_dau && diem.ngay_ket_thuc)) {
        errors.push({
          vi_tri: viTri,
          ten_diem_den: diem.ten_diem_den,
          ly_do: "Phải cung cấp cả ngày bắt đầu và ngày kết thúc, hoặc không cung cấp cả hai"
        })
        return
      }
    })

    return { isValid: errors.length === 0, errors }
  }

  // Hàm xử lý submit batch
  const handleSubmitBatch = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validation
    const validation = validateBatchDiemDen()
    if (!validation.isValid) {
      const errorMessages = validation.errors.map(err => `Vị trí ${err.vi_tri}: ${err.ly_do}`).join("\n")
      toast({
        title: `Có ${validation.errors.length} điểm đến không hợp lệ`,
        description: errorMessages,
        variant: "destructive",
      })
      return
    }

    // Lọc các điểm đến hợp lệ (có tên)
    const danhSachHopLe = batchDiemDen.filter(diem => diem.ten_diem_den.trim() !== "")

    if (danhSachHopLe.length === 0) {
      toast({
        title: "Thiếu thông tin",
        description: "Vui lòng nhập ít nhất một điểm đến hợp lệ",
        variant: "destructive",
      })
      return
    }

    // Kiểm tra trùng tỉnh thành trong batch
    const tenDiemDenInBatch = danhSachHopLe.map(diem => diem.ten_diem_den.trim().toLowerCase())
    const duplicatesInBatch: string[] = []
    const seenInBatch = new Set<string>()
    
    tenDiemDenInBatch.forEach((ten, index) => {
      if (seenInBatch.has(ten)) {
        if (!duplicatesInBatch.includes(ten)) {
          duplicatesInBatch.push(ten)
        }
      } else {
        seenInBatch.add(ten)
      }
    })

    if (duplicatesInBatch.length > 0) {
      toast({
        title: "Trùng tỉnh thành trong danh sách",
        description: `Các tỉnh thành sau bị trùng lặp: ${duplicatesInBatch.map(t => danhSachHopLe.find(d => d.ten_diem_den.trim().toLowerCase() === t)?.ten_diem_den || t).join(", ")}. Vui lòng xóa các mục trùng lặp.`,
        variant: "destructive",
      })
      return
    }

    // Kiểm tra trùng tỉnh thành với điểm đến đã có trong chuyến đi
    const duplicatesWithExisting: string[] = []
    tenDiemDenInBatch.forEach(ten => {
      if (existingDiemDen.includes(ten)) {
        const originalName = danhSachHopLe.find(d => d.ten_diem_den.trim().toLowerCase() === ten)?.ten_diem_den || ten
        if (!duplicatesWithExisting.includes(originalName)) {
          duplicatesWithExisting.push(originalName)
        }
      }
    })

    if (duplicatesWithExisting.length > 0) {
      toast({
        title: "Tỉnh thành đã tồn tại",
        description: `Các tỉnh thành sau đã có trong chuyến đi: ${duplicatesWithExisting.join(", ")}. Vui lòng chọn tỉnh thành khác.`,
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)

    try {
      // ✅ Lấy token từ cookie
      const token = Cookies.get("token")
      console.log("Token từ cookie:", token)

      // ✅ Kiểm tra token hợp lệ
      if (!token || token === "null" || token === "undefined") {
        console.warn("Không có token → chuyển về /login")
        toast({
          title: "Lỗi xác thực",
          description: "Vui lòng đăng nhập để tiếp tục",
          variant: "destructive",
        })
        router.replace("/login")
        return
      }

      // Chuẩn bị payload
      const payload = {
        danh_sach_diem_den: danhSachHopLe.map(diem => ({
          ten_diem_den: diem.ten_diem_den.trim(),
          ngay_bat_dau: diem.ngay_bat_dau || null,
          ngay_ket_thuc: diem.ngay_ket_thuc || null,
          ghi_chu: diem.ghi_chu || null,
        }))
      }

      console.log("Payload gửi lên API (Batch):", payload)
      console.log("Trip ID:", tripId)

      // Gọi API thêm nhiều điểm đến
      const response = await axios.post(
        `https://travel-planner-imdw.onrender.com/api/chuyen-di/${tripId}/diem-den/batch`,
        payload,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      )

      console.log("✅ API Response (Add Batch Diem Den):", response.data)

      const data = response.data?.data || []

      if (Array.isArray(data) && data.length > 0) {
        toast({
          title: response.data?.message || `Thêm ${data.length} điểm đến thành công`,
          description: `Đã thêm ${data.length} điểm đến vào chuyến đi`,
        })

        // Gọi onSubmit với dữ liệu từ API (gọi nhiều lần hoặc một lần với array)
        // Vì onSubmit có thể chỉ nhận một object, ta sẽ refresh danh sách thay vì gọi onSubmit
        // Hoặc có thể gọi onSubmit với data đầu tiên và refresh
        if (data.length > 0) {
          onSubmit({
            batch: true,
            data: data,
            tong_so: data.length
          })
        }

        // Reset form
        setBatchDiemDen([{ ten_diem_den: "", ngay_bat_dau: "", ngay_ket_thuc: "", ghi_chu: "" }])
        onClose()
      }
    } catch (error: any) {
      console.error("❌ Lỗi khi thêm nhiều điểm đến:", error)
      
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
            description: error.response?.data?.message || "Bạn không có quyền thêm điểm đến",
            variant: "destructive",
          })
        } else if (error.response?.status === 400) {
          // Hiển thị chi tiết lỗi validation từ API
          const errorData = error.response?.data
          if (errorData?.diem_den_khong_hop_le) {
            const errorMessages = errorData.diem_den_khong_hop_le
              .map((err: any) => `Vị trí ${err.vi_tri}: ${err.ly_do}`)
              .join("\n")
            toast({
              title: errorData.message || `Có ${errorData.tong_so_khong_hop_le} điểm đến không hợp lệ`,
              description: errorMessages,
              variant: "destructive",
            })
          } else {
            toast({
              title: "Lỗi thêm điểm đến",
              description: error.response?.data?.message || "Có lỗi xảy ra khi thêm điểm đến",
              variant: "destructive",
            })
          }
        } else {
          toast({
            title: "Lỗi thêm điểm đến",
            description: error.response?.data?.message || "Có lỗi xảy ra khi thêm điểm đến",
            variant: "destructive",
          })
        }
      } else {
        toast({
          title: "Lỗi thêm điểm đến",
          description: "Có lỗi xảy ra khi thêm điểm đến",
          variant: "destructive",
        })
      }
    } finally {
      setIsLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validation
    if (!formData.ten_diem_den || formData.ten_diem_den.trim() === "") {
      toast({
        title: "Thiếu thông tin",
        description: "Tên điểm đến là bắt buộc",
        variant: "destructive",
      })
      return
    }

    // Kiểm tra trùng tỉnh thành với điểm đến đã có
    const tenDiemDenNormalized = formData.ten_diem_den.trim().toLowerCase()
    const isDuplicate = existingDiemDen.some(existing => existing === tenDiemDenNormalized)
    
    if (isDuplicate) {
      toast({
        title: "Tỉnh thành đã tồn tại",
        description: `Tỉnh thành "${formData.ten_diem_den}" đã có trong chuyến đi. Vui lòng chọn tỉnh thành khác.`,
        variant: "destructive",
      })
      return
    }

    // Kiểm tra ngày bắt đầu <= ngày kết thúc
    if (formData.ngay_bat_dau && formData.ngay_ket_thuc) {
      const ngayBatDau = new Date(formData.ngay_bat_dau)
      const ngayKetThuc = new Date(formData.ngay_ket_thuc)
      if (ngayBatDau > ngayKetThuc) {
        toast({
          title: "Ngày không hợp lệ",
          description: "Ngày bắt đầu phải nhỏ hơn hoặc bằng ngày kết thúc",
          variant: "destructive",
        })
        return
      }
    }

    // Kiểm tra phải có cả hai ngày hoặc không có ngày nào
    if ((formData.ngay_bat_dau && !formData.ngay_ket_thuc) || (!formData.ngay_bat_dau && formData.ngay_ket_thuc)) {
      toast({
        title: "Ngày không hợp lệ",
        description: "Phải cung cấp cả ngày bắt đầu và ngày kết thúc, hoặc không cung cấp cả hai",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)

    try {
      // ✅ Lấy token từ cookie
      const token = Cookies.get("token")
      console.log("Token từ cookie:", token)

      // ✅ Kiểm tra token hợp lệ
      if (!token || token === "null" || token === "undefined") {
        console.warn("Không có token → chuyển về /login")
        toast({
          title: "Lỗi xác thực",
          description: "Vui lòng đăng nhập để tiếp tục",
          variant: "destructive",
        })
        router.replace("/login")
        return
      }

      // Chuẩn bị payload
      const payload = {
        ten_diem_den: formData.ten_diem_den.trim(),
        ngay_bat_dau: formData.ngay_bat_dau || null,
        ngay_ket_thuc: formData.ngay_ket_thuc || null,
        ghi_chu: formData.ghi_chu || null,
      }

      console.log("Payload gửi lên API:", payload)
      console.log("Trip ID:", tripId)

      // Gọi API thêm điểm đến
      const response = await axios.post(
        `https://travel-planner-imdw.onrender.com/api/chuyen-di/${tripId}/diem-den`,
        payload,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      )

      console.log("✅ API Response (Add Diem Den):", response.data)

      const data = response.data?.data || response.data

      if (data) {
        toast({
          title: response.data?.message || "Thêm điểm đến thành công",
          description: `Đã thêm điểm đến "${data.ten_diem_den}" vào chuyến đi`,
        })

        // Gọi onSubmit với dữ liệu từ API
        onSubmit({
          diem_den_id: data.diem_den_id,
          ten_diem_den: data.ten_diem_den,
          thu_tu: data.thu_tu,
          ngay_bat_dau: data.ngay_bat_dau,
          ngay_ket_thuc: data.ngay_ket_thuc,
          ghi_chu: data.ghi_chu,
          dia_diem_xuat_phat: data.dia_diem_xuat_phat,
        })

        // Reset form
        setFormData({
          ten_diem_den: "",
          ngay_bat_dau: "",
          ngay_ket_thuc: "",
          ghi_chu: "",
        })
        onClose()
      }
    } catch (error: any) {
      console.error("❌ Lỗi khi thêm điểm đến:", error)
      
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
            description: error.response?.data?.message || "Bạn không có quyền thêm điểm đến",
            variant: "destructive",
          })
        } else {
          toast({
            title: "Lỗi thêm điểm đến",
            description: error.response?.data?.message || "Có lỗi xảy ra khi thêm điểm đến",
            variant: "destructive",
          })
        }
      } else {
        toast({
          title: "Lỗi thêm điểm đến",
          description: "Có lỗi xảy ra khi thêm điểm đến",
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
        className={`bg-card rounded-lg shadow-xl w-full ${activeTab === "batch" ? "max-w-2xl max-h-[90vh]" : "max-w-md"}`}
      >
        <Card className="border-0 shadow-none">
          <CardHeader className="relative">
            <Button variant="ghost" size="icon" className="absolute right-2 top-2" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
            <CardTitle className="text-2xl font-[family-name:var(--font-space-grotesk)]">Thêm Điểm Đến</CardTitle>
            <CardDescription className="font-[family-name:var(--font-dm-sans)]">
              Thêm điểm đến mới vào lịch trình của bạn
            </CardDescription>
          </CardHeader>
          <CardContent className={activeTab === "batch" ? "max-h-[calc(90vh-200px)] overflow-y-auto" : ""}>
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-4">
                <TabsTrigger value="single">Thêm một điểm đến</TabsTrigger>
                <TabsTrigger value="batch">Thêm nhiều điểm đến</TabsTrigger>
              </TabsList>

              {/* Tab: Thêm một điểm đến */}
              <TabsContent value="single">
                <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="ten_diem_den">Tên điểm đến <span className="text-red-500">*</span></Label>
                <Popover open={openCombobox} onOpenChange={setOpenCombobox}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={openCombobox}
                      className="w-full justify-between"
                    >
                      {formData.ten_diem_den || "Chọn tỉnh thành..."}
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-full p-0" align="start">
                    <Command>
                      <CommandInput placeholder="Tìm kiếm tỉnh thành..." />
                      <CommandList>
                        <CommandEmpty>Không tìm thấy tỉnh thành.</CommandEmpty>
                        <CommandGroup>
                          {TINH_THANH.map((tinh) => (
                            <CommandItem
                              key={tinh}
                              value={tinh}
                              onSelect={() => {
                                handleChange("ten_diem_den", tinh)
                                setOpenCombobox(false)
                              }}
                            >
                              <Check
                                className={cn(
                                  "mr-2 h-4 w-4",
                                  formData.ten_diem_den === tinh ? "opacity-100" : "opacity-0"
                                )}
                              />
                              {tinh}
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>

              <div className="space-y-2">
                <Label htmlFor="ngay_bat_dau">Ngày bắt đầu (tùy chọn)</Label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="ngay_bat_dau"
                    type="date"
                    value={formData.ngay_bat_dau}
                    onChange={(e) => handleChange("ngay_bat_dau", e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="ngay_ket_thuc">Ngày kết thúc (tùy chọn)</Label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="ngay_ket_thuc"
                    type="date"
                    value={formData.ngay_ket_thuc}
                    onChange={(e) => handleChange("ngay_ket_thuc", e.target.value)}
                    className="pl-10"
                    min={formData.ngay_bat_dau || undefined}
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  {formData.ngay_bat_dau && formData.ngay_ket_thuc
                    ? "Phải cung cấp cả hai ngày hoặc không cung cấp cả hai"
                    : "Nếu chọn ngày bắt đầu, phải chọn cả ngày kết thúc"}
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="ghi_chu">Ghi chú (tùy chọn)</Label>
                <div className="relative">
                  <FileText className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Textarea
                    id="ghi_chu"
                    placeholder="Mô tả về điểm đến này..."
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
                      {isLoading ? "Đang thêm..." : "Thêm Điểm Đến"}
                    </Button>
                  </div>
                </form>
              </TabsContent>

              {/* Tab: Thêm nhiều điểm đến */}
              <TabsContent value="batch">
                <form onSubmit={handleSubmitBatch} className="space-y-4">
                  <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2">
                    {batchDiemDen.map((diem, index) => (
                      <Card key={index} className="border border-gray-200 p-4 space-y-3">
                        <div className="flex items-center justify-between mb-2">
                          <Label className="text-sm font-semibold text-gray-700">
                            Điểm đến #{index + 1}
                          </Label>
                          {batchDiemDen.length > 1 && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => removeBatchDiemDen(index)}
                              className="h-8 w-8 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor={`batch_ten_${index}`}>
                            Điểm đến <span className="text-red-500">*</span>
                          </Label>
                          <Popover 
                            open={openBatchCombobox[index] || false} 
                            onOpenChange={(open) => {
                              const newOpen = [...openBatchCombobox]
                              newOpen[index] = open
                              setOpenBatchCombobox(newOpen)
                            }}
                          >
                            <PopoverTrigger asChild>
                              <Button
                                variant="outline"
                                role="combobox"
                                aria-expanded={openBatchCombobox[index] || false}
                                className="w-full justify-between"
                              >
                                {diem.ten_diem_den || "Chọn tỉnh thành..."}
                                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-full p-0" align="start">
                              <Command>
                                <CommandInput placeholder="Tìm kiếm tỉnh thành..." />
                                <CommandList>
                                  <CommandEmpty>Không tìm thấy tỉnh thành.</CommandEmpty>
                                  <CommandGroup>
                                    {TINH_THANH.map((tinh) => (
                                      <CommandItem
                                        key={tinh}
                                        value={tinh}
                                        onSelect={() => {
                                          updateBatchDiemDen(index, "ten_diem_den", tinh)
                                          const newOpen = [...openBatchCombobox]
                                          newOpen[index] = false
                                          setOpenBatchCombobox(newOpen)
                                        }}
                                      >
                                        <Check
                                          className={cn(
                                            "mr-2 h-4 w-4",
                                            diem.ten_diem_den === tinh ? "opacity-100" : "opacity-0"
                                          )}
                                        />
                                        {tinh}
                                      </CommandItem>
                                    ))}
                                  </CommandGroup>
                                </CommandList>
                              </Command>
                            </PopoverContent>
                          </Popover>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-2">
                            <Label htmlFor={`batch_ngay_bat_dau_${index}`}>Ngày bắt đầu</Label>
                            <div className="relative">
                              <Calendar className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                              <Input
                                id={`batch_ngay_bat_dau_${index}`}
                                type="date"
                                value={diem.ngay_bat_dau}
                                onChange={(e) => updateBatchDiemDen(index, "ngay_bat_dau", e.target.value)}
                                className="pl-8 text-sm"
                              />
                            </div>
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor={`batch_ngay_ket_thuc_${index}`}>Ngày kết thúc</Label>
                            <div className="relative">
                              <Calendar className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                              <Input
                                id={`batch_ngay_ket_thuc_${index}`}
                                type="date"
                                value={diem.ngay_ket_thuc}
                                onChange={(e) => updateBatchDiemDen(index, "ngay_ket_thuc", e.target.value)}
                                className="pl-8 text-sm"
                                min={diem.ngay_bat_dau || undefined}
                              />
                            </div>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor={`batch_ghi_chu_${index}`}>Ghi chú (tùy chọn)</Label>
                          <Textarea
                            id={`batch_ghi_chu_${index}`}
                            placeholder="Mô tả về điểm đến này..."
                            value={diem.ghi_chu}
                            onChange={(e) => updateBatchDiemDen(index, "ghi_chu", e.target.value)}
                            className="min-h-[60px] resize-none text-sm"
                          />
                        </div>
                      </Card>
                    ))}
                  </div>

                  <Button
                    type="button"
                    variant="outline"
                    onClick={addBatchDiemDen}
                    className="w-full border-dashed"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Thêm điểm đến khác
                  </Button>

                  <div className="flex gap-3 pt-4">
                    <Button type="button" variant="outline" onClick={onClose} className="flex-1 bg-transparent">
                      Hủy
                    </Button>
                    <Button type="submit" className="flex-1 bg-primary hover:bg-primary/90" disabled={isLoading}>
                      {isLoading ? "Đang thêm..." : `Thêm ${batchDiemDen.filter(d => d.ten_diem_den.trim()).length} Điểm Đến`}
                    </Button>
                  </div>
                </form>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}
