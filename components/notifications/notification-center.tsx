"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import axios from "axios"
import Cookies from "js-cookie"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Bell, X, Check, MapPin, DollarSign, Users, MessageCircle, Calendar, Loader2, UserPlus, Eye, Flag } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { useToast } from "@/hooks/use-toast"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

interface Notification {
  id: string
  type: string
  title: string
  message: string
  timestamp: string
  read: boolean
  tripId?: string
  tripName?: string
}

interface Invitation {
  moi_id: number
  chuyen_di_id: number
  ten_chuyen_di: string
  ngay_bat_dau: string
  ngay_ket_thuc: string
  nguoi_gui_id: number
  ten_nguoi_gui: string
  avatar_nguoi_gui: string
  trang_thai_loi_moi: string
  tao_luc: string
}

interface Complaint {
  bao_cao_id: number
  chuyen_di_id: number
  ten_chuyen_di: string
  ly_do: string
  trang_thai: number // 0: chờ xử lý, 1: đã xử lý
  phan_hoi_cua_admin?: string | null
  tao_luc: string
  cap_nhat_luc: string
  ten_admin_phan_hoi?: string | null
  trang_thai_text: string
}

interface NotificationCenterProps {
  isOpen: boolean
  onClose: () => void
}

export function NotificationCenter({ isOpen, onClose }: NotificationCenterProps) {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [invitations, setInvitations] = useState<Invitation[]>([])
  const [complaints, setComplaints] = useState<Complaint[]>([])
  const [loading, setLoading] = useState(false)
  const [invitationsLoading, setInvitationsLoading] = useState(false)
  const [complaintsLoading, setComplaintsLoading] = useState(false)
  const [showComplaintDialog, setShowComplaintDialog] = useState(false)
  const [selectedTripIdForComplaint, setSelectedTripIdForComplaint] = useState<string | null>(null)
  const [complaintLyDo, setComplaintLyDo] = useState<string>("")
  const [isSubmittingComplaint, setIsSubmittingComplaint] = useState(false)
  const [activeTab, setActiveTab] = useState<string>("thong-bao")
  const [showComplaintDetailDialog, setShowComplaintDetailDialog] = useState(false)
  const [complaintDetail, setComplaintDetail] = useState<any>(null)
  const [complaintDetailLoading, setComplaintDetailLoading] = useState(false)
  const router = useRouter()
  const { toast } = useToast()

  // Map loai từ API sang type cho icon
  const mapLoaiToType = (loai: string): string => {
    const mapping: { [key: string]: string } = {
      chi_phi: "expense",
      lich_trinh: "itinerary",
      thanh_vien: "member",
      tin_nhan: "chat",
      dat_phong: "booking",
      chuyen_di: "trip",
    }
    return mapping[loai] || loai
  }

  // Tạo title từ loai và noi_dung
  const generateTitle = (loai: string): string => {
    const titleMap: { [key: string]: string } = {
      chi_phi: "Chi phí mới được thêm",
      lich_trinh: "Lịch trình được cập nhật",
      thanh_vien: "Thành viên mới tham gia",
      tin_nhan: "Tin nhắn mới",
      dat_phong: "Đề xuất khách sạn",
      chuyen_di: "Thông báo chuyến đi",
    }
    return titleMap[loai] || "Thông báo mới"
  }

  // Fetch invitations from API
  const fetchInvitations = async () => {
    setInvitationsLoading(true)
    try {
      const token = Cookies.get("token")
      
      if (!token || token === "null" || token === "undefined") {
        console.warn("Không có token → chuyển về /login")
        router.replace("/login")
        return
      }

      const response = await axios.get(
        "https://travel-planner-imdw.onrender.com/api/moi-thanh-vien/thong-bao",
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      )

      const apiInvitations = response.data?.thong_bao || []
      setInvitations(apiInvitations)
    } catch (error: any) {
      console.error("❌ Lỗi khi tải lời mời:", error)
      if (axios.isAxiosError(error) && error.response?.status === 401) {
        toast({
          title: "Lỗi xác thực",
          description: "Phiên đăng nhập đã hết hạn",
          variant: "destructive",
        })
        router.replace("/login")
      } else {
        // Don't show error toast for empty invitations
        if (error.response?.status !== 404) {
          toast({
            title: "Lỗi",
            description: error.response?.data?.message || error.message || "Không thể tải lời mời",
            variant: "destructive",
          })
        }
      }
    } finally {
      setInvitationsLoading(false)
    }
  }

  // Handle accept invitation
  const handleAcceptInvitation = async (invitation: Invitation) => {
    try {
      const token = Cookies.get("token")
      
      if (!token || token === "null" || token === "undefined") {
        console.warn("Không có token → chuyển về /login")
        router.replace("/login")
        return
      }

      await axios.patch(
        `https://travel-planner-imdw.onrender.com/api/moi-thanh-vien/${invitation.chuyen_di_id}/chap-nhan`,
        {
          message: "",
          chuyen_di_id: String(invitation.chuyen_di_id),
          trang_thai: "accepted",
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      )

      // Remove invitation from list
      setInvitations((prev) => prev.filter((inv) => inv.moi_id !== invitation.moi_id))
      
      toast({
        title: "Đã chấp nhận",
        description: `Bạn đã chấp nhận lời mời tham gia "${invitation.ten_chuyen_di}"`,
      })
    } catch (error: any) {
      console.error("❌ Lỗi khi chấp nhận lời mời:", error)
      if (axios.isAxiosError(error) && error.response?.status === 401) {
        toast({
          title: "Lỗi xác thực",
          description: "Phiên đăng nhập đã hết hạn",
          variant: "destructive",
        })
        router.replace("/login")
      } else {
        toast({
          title: "Lỗi",
          description: error.response?.data?.message || error.message || "Không thể chấp nhận lời mời",
          variant: "destructive",
        })
      }
    }
  }

  // Handle reject invitation
  const handleRejectInvitation = async (invitation: Invitation) => {
    try {
      const token = Cookies.get("token")
      
      if (!token || token === "null" || token === "undefined") {
        console.warn("Không có token → chuyển về /login")
        router.replace("/login")
        return
      }

      await axios.patch(
        `https://travel-planner-imdw.onrender.com/api/moi-thanh-vien/${invitation.chuyen_di_id}/tu-choi`,
        {
          message: "",
          chuyen_di_id: String(invitation.chuyen_di_id),
          trang_thai: "rejected",
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      )

      // Remove invitation from list
      setInvitations((prev) => prev.filter((inv) => inv.moi_id !== invitation.moi_id))
      
      toast({
        title: "Đã từ chối",
        description: `Bạn đã từ chối lời mời tham gia "${invitation.ten_chuyen_di}"`,
      })
    } catch (error: any) {
      console.error("❌ Lỗi khi từ chối lời mời:", error)
      if (axios.isAxiosError(error) && error.response?.status === 401) {
        toast({
          title: "Lỗi xác thực",
          description: "Phiên đăng nhập đã hết hạn",
          variant: "destructive",
        })
        router.replace("/login")
      } else {
        toast({
          title: "Lỗi",
          description: error.response?.data?.message || error.message || "Không thể từ chối lời mời",
          variant: "destructive",
        })
      }
    }
  }

  // Fetch complaints from API
  const fetchComplaints = async () => {
    setComplaintsLoading(true)
    try {
      const token = Cookies.get("token")
      
      if (!token || token === "null" || token === "undefined") {
        console.warn("Không có token → chuyển về /login")
        router.replace("/login")
        return
      }

      const response = await axios.get(
        "https://travel-planner-imdw.onrender.com/api/chuyen-di/khieu-nai",
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      )

      // Map API response to component format
      const apiData = response.data?.danh_sach || []
      console.log("📋 API complaints response:", response.data)
      console.log("📋 Danh sách khiếu nại:", apiData)
      
      const mappedComplaints: Complaint[] = apiData.map((item: any) => ({
        bao_cao_id: item.bao_cao_id || 0,
        chuyen_di_id: item.chuyen_di_id || 0,
        ten_chuyen_di: item.ten_chuyen_di || "Chuyến đi không xác định",
        ly_do: item.ly_do || "",
        trang_thai: item.trang_thai || 0,
        phan_hoi_cua_admin: item.phan_hoi_cua_admin || null,
        tao_luc: item.tao_luc || "",
        cap_nhat_luc: item.cap_nhat_luc || "",
        ten_admin_phan_hoi: item.ten_admin_phan_hoi || null,
        trang_thai_text: item.trang_thai_text || "",
      }))

      setComplaints(mappedComplaints)
    } catch (error: any) {
      console.error("❌ Lỗi khi tải khiếu nại:", error)
      if (axios.isAxiosError(error) && error.response?.status === 401) {
        toast({
          title: "Lỗi xác thực",
          description: "Phiên đăng nhập đã hết hạn",
          variant: "destructive",
        })
        router.replace("/login")
      } else {
        // Không hiển thị toast nếu không có khiếu nại nào
        if (error.response?.status !== 404) {
          toast({
            title: "Lỗi",
            description: error.response?.data?.message || error.message || "Không thể tải danh sách khiếu nại",
            variant: "destructive",
          })
        }
      }
    } finally {
      setComplaintsLoading(false)
    }
  }

  // Fetch notifications from API
  useEffect(() => {
    if (!isOpen) return

    const fetchNotifications = async () => {
      setLoading(true)
      try {
        const token = Cookies.get("token")
        
        if (!token || token === "null" || token === "undefined") {
          console.warn("Không có token → chuyển về /login")
          router.replace("/login")
          return
        }

        const response = await axios.get("https://travel-planner-imdw.onrender.com/api/thong-bao", {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        })

        // Map API response to component format
        // Backend trả về: { message, tong_so, chua_doc, danh_sach: [...] }
        // Backend đã sắp xếp ORDER BY tao_luc DESC rồi
        const apiData = response.data?.danh_sach || []
        console.log("📋 API thông báo response:", apiData)
        
        const mappedNotifications: Notification[] = apiData.map((item: any, index: number) => {
          // Ưu tiên lấy chuyen_di_id trực tiếp từ API nếu có
          let tripId: string | undefined = undefined
          
          // Nếu có chuyen_di_id trực tiếp trong response
          if (item.chuyen_di_id) {
            tripId = String(item.chuyen_di_id)
          } 
          // Nếu không có, thử extract từ lien_ket
          else if (item.lien_ket) {
            tripId = item.lien_ket
            if (typeof tripId === "string") {
              // Nếu là đường dẫn, extract ID
              if (tripId.includes("/")) {
                const parts = tripId.split("/").filter(p => p) // Loại bỏ phần rỗng
                // Tìm phần chứa số (có thể là ID)
                for (let i = parts.length - 1; i >= 0; i--) {
                  const part = parts[i]
                  // Nếu phần này là số hoặc chứa số, có thể là ID
                  if (/^\d+$/.test(part)) {
                    tripId = part
                    break
                  }
                }
                // Nếu không tìm thấy số, lấy phần cuối cùng
                if (tripId === item.lien_ket && parts.length > 0) {
                  tripId = parts[parts.length - 1]
                }
              }
            }
          }
          
          console.log(`📋 Notification ${index}:`, {
            loai: item.loai,
            lien_ket: item.lien_ket,
            chuyen_di_id: item.chuyen_di_id,
            extractedTripId: tripId
          })
          
          return {
            id: item.thong_bao_id ? String(item.thong_bao_id) : `notification-${index}-${Date.now()}`,
            type: mapLoaiToType(item.loai || ""),
            title: generateTitle(item.loai || ""),
            message: item.noi_dung || "",
            timestamp: item.tao_luc || "",
            read: Boolean(item.da_xem),
            tripId: tripId,
            tripName: undefined, // API không có tripName, có thể cần gọi thêm API nếu cần
          }
        })

        setNotifications(mappedNotifications)
      } catch (error: any) {
        console.error("❌ Lỗi khi tải thông báo:", error)
        if (axios.isAxiosError(error) && error.response?.status === 401) {
          toast({
            title: "Lỗi xác thực",
            description: "Phiên đăng nhập đã hết hạn",
            variant: "destructive",
          })
          router.replace("/login")
        } else {
          toast({
            title: "Lỗi",
            description: error.response?.data?.message || error.message || "Không thể tải thông báo",
            variant: "destructive",
          })
        }
      } finally {
        setLoading(false)
      }
    }

    fetchNotifications()
    fetchInvitations()
    fetchComplaints()
  }, [isOpen, router, toast])

  const unreadCount = notifications.filter((n) => !n.read).length + invitations.length

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "expense":
        return <DollarSign className="h-4 w-4 text-green-600" />
      case "itinerary":
        return <MapPin className="h-4 w-4 text-blue-600" />
      case "member":
        return <Users className="h-4 w-4 text-purple-600" />
      case "chat":
        return <MessageCircle className="h-4 w-4 text-orange-600" />
      case "booking":
        return <Calendar className="h-4 w-4 text-pink-600" />
      case "trip":
        return <MapPin className="h-4 w-4 text-indigo-600" />
      default:
        return <Bell className="h-4 w-4 text-gray-600" />
    }
  }

  const formatTime = (timestamp: string) => {
    const now = new Date()
    const notifTime = new Date(timestamp)
    const diffInMinutes = Math.floor((now.getTime() - notifTime.getTime()) / (1000 * 60))

    if (diffInMinutes < 1) return "Vừa xong"
    if (diffInMinutes < 60) return `${diffInMinutes} phút trước`
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)} giờ trước`
    return notifTime.toLocaleDateString("vi-VN")
  }

  const markAsRead = (notificationId: string) => {
    setNotifications((prev) => prev.map((notif) => (notif.id === notificationId ? { ...notif, read: true } : notif)))
  }

  const markAllAsRead = async () => {
    try {
      const token = Cookies.get("token")

      if (!token || token === "null" || token === "undefined") {
        console.warn("Không có token → chuyển về /login")
        router.replace("/login")
        return
      }

      await axios.put(
        "https://travel-planner-imdw.onrender.com/api/thong-bao/tat-ca/doc",
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      )

      setNotifications((prev) => prev.map((notif) => ({ ...notif, read: true })))
      toast({
        title: "Đã đánh dấu tất cả",
        description: "Tất cả thông báo đã được đánh dấu là đã đọc",
      })
    } catch (error: any) {
      console.error("❌ Lỗi khi đánh dấu tất cả thông báo là đã đọc:", error)
      if (axios.isAxiosError(error) && error.response?.status === 401) {
        toast({
          title: "Lỗi xác thực",
          description: "Phiên đăng nhập đã hết hạn",
          variant: "destructive",
        })
        router.replace("/login")
      } else {
        toast({
          title: "Lỗi",
          description: error.response?.data?.message || error.message || "Không thể đánh dấu tất cả thông báo",
          variant: "destructive",
        })
      }
    }
  }

  const deleteNotification = (notificationId: string) => {
    setNotifications((prev) => prev.filter((notif) => notif.id !== notificationId))
  }

  // Kiểm tra nếu notification là về chuyến đi bị ẩn
  const isHiddenTripNotification = (notification: Notification) => {
    return (
      notification.type === "trip" &&
      notification.tripId &&
      (notification.message.toLowerCase().includes("ẩn") ||
        notification.message.toLowerCase().includes("bị ẩn") ||
        notification.message.toLowerCase().includes("đã ẩn"))
    )
  }

  // Xử lý xem chi tiết chuyến đi
  const handleViewTripDetail = (tripId: string) => {
    router.push(`/trip/${tripId}`)
    onClose()
  }

  // Xử lý xem chi tiết khiếu nại
  const handleViewComplaintDetail = async (baoCaoId: number) => {
    setComplaintDetailLoading(true)
    setShowComplaintDetailDialog(true)
    try {
      const token = Cookies.get("token")
      
      if (!token || token === "null" || token === "undefined") {
        toast({
          title: "Lỗi xác thực",
          description: "Vui lòng đăng nhập",
          variant: "destructive",
        })
        router.replace("/login")
        return
      }

      const response = await axios.get(
        `https://travel-planner-imdw.onrender.com/api/chuyen-di/khieu-nai/${baoCaoId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      )

      console.log("📋 Chi tiết khiếu nại:", response.data)
      setComplaintDetail(response.data?.chi_tiet || null)
    } catch (error: any) {
      console.error("❌ Lỗi khi tải chi tiết khiếu nại:", error)
      if (axios.isAxiosError(error) && error.response?.status === 401) {
        toast({
          title: "Lỗi xác thực",
          description: "Phiên đăng nhập đã hết hạn",
          variant: "destructive",
        })
        router.replace("/login")
      } else {
        toast({
          title: "Lỗi",
          description: error.response?.data?.message || error.message || "Không thể tải chi tiết khiếu nại",
          variant: "destructive",
        })
      }
      setShowComplaintDetailDialog(false)
    } finally {
      setComplaintDetailLoading(false)
    }
  }

  // Xử lý đóng dialog chi tiết khiếu nại
  const handleCloseComplaintDetailDialog = () => {
    setShowComplaintDetailDialog(false)
    setComplaintDetail(null)
  }

  // Xử lý mở dialog khiếu nại
  const handleOpenComplaintDialog = (tripId: string) => {
    // Extract ID từ tripId nếu nó là đường dẫn (ví dụ: "/trip/123" -> "123")
    let extractedId = tripId
    if (tripId.includes("/")) {
      // Nếu là đường dẫn, lấy phần cuối cùng
      extractedId = tripId.split("/").pop() || tripId
    }
    console.log("🔍 Original tripId:", tripId)
    console.log("🔍 Extracted ID:", extractedId)
    setSelectedTripIdForComplaint(extractedId)
    setComplaintLyDo("")
    setShowComplaintDialog(true)
  }

  // Xử lý đóng dialog khiếu nại
  const handleCloseComplaintDialog = () => {
    setShowComplaintDialog(false)
    setSelectedTripIdForComplaint(null)
    setComplaintLyDo("")
  }

  // Xử lý gửi khiếu nại
  const handleSubmitComplaint = async () => {
    if (!selectedTripIdForComplaint) return
    if (!complaintLyDo.trim()) {
      toast({
        title: "Lỗi",
        description: "Vui lòng nhập lý do khiếu nại",
        variant: "destructive",
      })
      return
    }

    const token = Cookies.get("token")
    if (!token || token === "null" || token === "undefined") {
      toast({
        title: "Lỗi xác thực",
        description: "Vui lòng đăng nhập để gửi khiếu nại",
        variant: "destructive",
      })
      router.replace("/login")
      return
    }

    setIsSubmittingComplaint(true)
    try {
      // Đảm bảo selectedTripIdForComplaint có giá trị
      if (!selectedTripIdForComplaint) {
        toast({
          title: "Lỗi",
          description: "Không tìm thấy ID chuyến đi",
          variant: "destructive",
        })
        setIsSubmittingComplaint(false)
        return
      }

      // Extract ID nếu cần (trường hợp chưa extract ở handleOpenComplaintDialog)
      let tripId = selectedTripIdForComplaint
      if (tripId.includes("/")) {
        tripId = tripId.split("/").pop() || tripId
      }

      console.log("🔍 Gửi khiếu nại với tripId:", tripId)
      console.log("🔍 Lý do:", complaintLyDo.trim())
      
      const apiUrl = `https://travel-planner-imdw.onrender.com/api/chuyen-di/${tripId}/khieu-nai`
      console.log("🌐 API URL:", apiUrl)

      const response = await axios.post(
        apiUrl,
        {
          ly_do: complaintLyDo.trim(),
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      )

      console.log("✅ API Response:", response.data)

      toast({
        title: "Thành công",
        description: response.data.message || "Khiếu nại đã được gửi. Chúng tôi sẽ kiểm tra và xử lý sớm.",
      })
      handleCloseComplaintDialog()
    } catch (error: any) {
      console.error("Lỗi khi gửi khiếu nại:", error)
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 401) {
          toast({
            title: "Lỗi xác thực",
            description: "Phiên đăng nhập đã hết hạn",
            variant: "destructive",
          })
          router.replace("/login")
        } else if (error.response?.status === 409) {
          toast({
            title: "Lỗi",
            description: error.response?.data?.message || "Bạn đã gửi khiếu nại tương tự và đang chờ xử lý.",
            variant: "destructive",
          })
        } else {
          toast({
            title: "Lỗi",
            description: error.response?.data?.message || "Có lỗi xảy ra khi gửi khiếu nại",
            variant: "destructive",
          })
        }
      } else {
        toast({
          title: "Lỗi",
          description: "Có lỗi xảy ra khi gửi khiếu nại",
          variant: "destructive",
        })
      }
    } finally {
      setIsSubmittingComplaint(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-start justify-center pt-16 p-4 z-50">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className="bg-card rounded-lg shadow-xl max-w-md w-full max-h-[80vh] overflow-hidden"
      >
        <Card className="border-0 shadow-none h-full">
          <CardHeader className="relative">
            <Button variant="ghost" size="icon" className="absolute right-2 top-2" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
            <div className="flex items-center justify-between pr-8">
              <CardTitle className="text-xl font-[family-name:var(--font-space-grotesk)] flex items-center gap-2">
                <Bell className="h-5 w-5 text-primary" />
                Thông Báo
                {unreadCount > 0 && (
                  <Badge variant="destructive" className="text-xs">
                    {unreadCount}
                  </Badge>
                )}
              </CardTitle>
              </div>
 
              {/* Tabs Navigation và Đánh dấu tất cả */}
              <div className="mt-3 flex items-center justify-between">
                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-auto">
                  <TabsList className="inline-flex h-7 items-center justify-center rounded-full bg-muted p-0.5 w-auto gap-0.5">
                    <TabsTrigger 
                      value="thong-bao" 
                      className="px-3 py-1 text-[11px] font-medium transition-all rounded-full data-[state=active]:bg-background data-[state=active]:shadow-sm data-[state=active]:text-foreground"
                    >
                      Thông báo
                    </TabsTrigger>
                    <TabsTrigger 
                      value="khieu-nai" 
                      className="px-3 py-1 text-[11px] font-medium transition-all rounded-full data-[state=active]:bg-background data-[state=active]:shadow-sm data-[state=active]:text-foreground"
                    >
                      Đã khiếu nại
                    </TabsTrigger>
                  </TabsList>
                </Tabs>
                {unreadCount > 0 && activeTab === "thong-bao" && (
                  <Button variant="ghost" size="sm" onClick={markAllAsRead} className="text-primary hover:text-primary/80">
                    <Check className="h-4 w-4 mr-1" />
                    Đánh dấu tất cả
                  </Button>
                )}
              </div>
           
          </CardHeader>
          <CardContent className="p-0">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsContent value="thong-bao" className="mt-0">
                <ScrollArea className="h-[500px]">
              <div className="space-y-1">
                <AnimatePresence>
                  {loading || invitationsLoading ? (
                    <div className="text-center py-12">
                      <Loader2 className="h-12 w-12 text-primary mx-auto mb-4 animate-spin" />
                      <h3 className="text-lg font-semibold text-foreground mb-2">Đang tải thông báo...</h3>
                      <p className="text-muted-foreground">Vui lòng đợi trong giây lát</p>
                    </div>
                  ) : notifications.length === 0 && invitations.length === 0 ? (
                    <div className="text-center py-12">
                      <Bell className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <h3 className="text-lg font-semibold text-foreground mb-2">Không có thông báo</h3>
                      <p className="text-muted-foreground">Bạn đã xem hết tất cả thông báo</p>
                    </div>
                  ) : (
                    <>
                      {/* Invitations Section */}
                      {invitations.map((invitation, index) => (
                        <motion.div
                          key={invitation.moi_id ? `invitation-${invitation.moi_id}` : `invitation-${index}-${Date.now()}`}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: 20 }}
                          className="p-4 border-b border-border bg-primary/5 border-l-4 border-l-primary hover:bg-muted/30 transition-colors group"
                        >
                          <div className="flex items-start gap-3">
                            <div className="flex-shrink-0 mt-1">
                              <UserPlus className="h-4 w-4 text-purple-600" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between gap-2">
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-2">
                                    <Avatar className="h-6 w-6">
                                      <AvatarImage src={invitation.avatar_nguoi_gui} alt={invitation.ten_nguoi_gui} />
                                      <AvatarFallback>{invitation.ten_nguoi_gui.charAt(0)}</AvatarFallback>
                                    </Avatar>
                                    <h4 className="text-sm font-semibold text-foreground">
                                      {invitation.ten_nguoi_gui} mời bạn tham gia
                                    </h4>
                                  </div>
                                  <p className="text-sm font-medium text-foreground mb-1">{invitation.ten_chuyen_di}</p>
                                  <p className="text-xs text-muted-foreground mb-3">
                                    {new Date(invitation.ngay_bat_dau).toLocaleDateString("vi-VN")} - {new Date(invitation.ngay_ket_thuc).toLocaleDateString("vi-VN")}
                                  </p>
                                  <div className="flex items-center gap-2">
                                    <Button
                                      size="sm"
                                      onClick={(e) => {
                                        e.stopPropagation()
                                        handleAcceptInvitation(invitation)
                                      }}
                                      className="h-8"
                                    >
                                      <Check className="h-3 w-3 mr-1" />
                                      Chấp nhận
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={(e) => {
                                        e.stopPropagation()
                                        handleRejectInvitation(invitation)
                                      }}
                                      className="h-8"
                                    >
                                      <X className="h-3 w-3 mr-1" />
                                      Từ chối
                                    </Button>
                                    <span className="text-xs text-muted-foreground ml-auto">
                                      {formatTime(invitation.tao_luc)}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </div>
                            <div className="w-2 h-2 bg-primary rounded-full flex-shrink-0 mt-2" />
                          </div>
                        </motion.div>
                      ))}

                      {/* Regular Notifications */}
                      {notifications.map((notification) => {
                        const isHiddenTrip = isHiddenTripNotification(notification)
                        return (
                          <motion.div
                            key={notification.id}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 20 }}
                            className={`p-4 border-b border-border hover:bg-muted/30 cursor-pointer transition-colors group ${
                              !notification.read ? "bg-primary/5 border-l-4 border-l-primary" : ""
                            }`}
                            onClick={() => !notification.read && markAsRead(notification.id)}
                          >
                            <div className="flex items-start gap-3">
                              <div className="flex-shrink-0 mt-1">{getNotificationIcon(notification.type)}</div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-start justify-between">
                                  <div className="flex-1">
                                    <h4 className="text-sm font-semibold text-foreground mb-1">{notification.title}</h4>
                                    <p className="text-sm text-muted-foreground font-[family-name:var(--font-dm-sans)] mb-2">
                                      {notification.message}
                                    </p>
                                    <div className="flex items-center gap-2 mb-2">
                                      {notification.tripName && (
                                        <Badge variant="outline" className="text-xs">
                                          {notification.tripName}
                                        </Badge>
                                      )}
                                      <span className="text-xs text-muted-foreground">
                                        {formatTime(notification.timestamp)}
                                      </span>
                                    </div>
                                    {/* Hiển thị nút nếu là thông báo chuyến đi bị ẩn */}
                                    {isHiddenTrip && notification.tripId && (
                                      <div className="flex items-center gap-2 mt-3">
                                        <Button
                                          size="sm"
                                          variant="outline"
                                          onClick={(e) => {
                                            e.stopPropagation()
                                            console.log("🔍 Click gửi khiếu nại, notification:", {
                                              id: notification.id,
                                              tripId: notification.tripId,
                                              message: notification.message,
                                              title: notification.title
                                            })
                                            if (notification.tripId) {
                                              handleOpenComplaintDialog(notification.tripId)
                                            } else {
                                              toast({
                                                title: "Lỗi",
                                                description: "Không tìm thấy ID chuyến đi trong thông báo",
                                                variant: "destructive",
                                              })
                                            }
                                          }}
                                          className="h-8 text-xs"
                                        >
                                          <Flag className="h-3 w-3 mr-1" />
                                          Gửi khiếu nại
                                        </Button>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>
                              {!notification.read && <div className="w-2 h-2 bg-primary rounded-full flex-shrink-0 mt-2" />}
                            </div>
                          </motion.div>
                        )
                      })}
                    </>
                  )}
                </AnimatePresence>
              </div>
            </ScrollArea>
              </TabsContent>
              
              <TabsContent value="khieu-nai" className="mt-0">
                <ScrollArea className="h-[500px]">
                  <div className="space-y-1">
                    <AnimatePresence>
                      {complaintsLoading ? (
                        <div className="text-center py-12">
                          <Loader2 className="h-12 w-12 text-primary mx-auto mb-4 animate-spin" />
                          <h3 className="text-lg font-semibold text-foreground mb-2">Đang tải khiếu nại...</h3>
                          <p className="text-muted-foreground">Vui lòng đợi trong giây lát</p>
                        </div>
                      ) : complaints.length === 0 ? (
                        <div className="text-center py-12">
                          <Flag className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                          <h3 className="text-lg font-semibold text-foreground mb-2">Chưa có khiếu nại</h3>
                          <p className="text-muted-foreground">Bạn chưa gửi khiếu nại nào</p>
                        </div>
                      ) : (
                        complaints.map((complaint) => (
                          <motion.div
                            key={complaint.bao_cao_id}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 20 }}
                            className={`p-4 border-b border-border hover:bg-muted/30 transition-colors ${
                              complaint.trang_thai === 0 ? "bg-primary/5 border-l-4 border-l-primary" : "bg-muted/20"
                            }`}
                          >
                            <div className="flex items-start gap-3">
                              <div className="flex-shrink-0 mt-1">
                                <Flag className={`h-4 w-4 ${complaint.trang_thai === 0 ? "text-orange-600" : "text-green-600"}`} />
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-start justify-between gap-2">
                                  <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-2">
                                      <h4 className="text-sm font-semibold text-foreground">{complaint.ten_chuyen_di}</h4>
                                      <Badge variant={complaint.trang_thai === 0 ? "default" : "secondary"} className="text-xs">
                                        {complaint.trang_thai === 0 ? "Chờ xử lý" : "Đã xử lý"}
                                      </Badge>
                                    </div>
                                    <p className="text-sm text-muted-foreground mb-2">
                                      <span className="font-medium">Lý do:</span> {complaint.ly_do}
                                    </p>
                                    {complaint.phan_hoi_cua_admin && (
                                      <p className="text-sm text-foreground mb-2 p-2 bg-muted rounded-md">
                                        <span className="font-medium">Phản hồi từ {complaint.ten_admin_phan_hoi || "Admin"}:</span> {complaint.phan_hoi_cua_admin}
                                      </p>
                                    )}
                                    <div className="flex items-center gap-2 mt-2">
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={(e) => {
                                          e.stopPropagation()
                                          handleViewComplaintDetail(complaint.bao_cao_id)
                                        }}
                                        className="h-8 text-xs"
                                      >
                                        <Eye className="h-3 w-3 mr-1" />
                                        Xem chi tiết
                                      </Button>
                                      <span className="text-xs text-muted-foreground ml-auto">
                                        {formatTime(complaint.tao_luc)}
                                      </span>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </motion.div>
                        ))
                      )}
                    </AnimatePresence>
                  </div>
                </ScrollArea>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </motion.div>

      {/* Dialog Chi tiết Khiếu Nại */}
      <Dialog open={showComplaintDetailDialog} onOpenChange={setShowComplaintDetailDialog}>
        <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Flag className="h-5 w-5 text-orange-500" />
              Chi tiết khiếu nại
            </DialogTitle>
          </DialogHeader>

          {complaintDetailLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 text-primary animate-spin" />
            </div>
          ) : complaintDetail ? (
            <div className="space-y-4 py-4">
              {/* Thông tin chuyến đi */}
              <div className="space-y-2">
                <Label className="text-sm font-semibold">Thông tin chuyến đi</Label>
                <div className="p-3 bg-muted rounded-lg space-y-2">
                  <div>
                    <span className="text-sm font-medium">Tên chuyến đi:</span>
                    <p className="text-sm text-foreground">{complaintDetail.ten_chuyen_di || complaintDetail.chuyen_di?.ten_chuyen_di || "N/A"}</p>
                  </div>
                  {complaintDetail.chuyen_di?.mo_ta && (
                    <div>
                      <span className="text-sm font-medium">Mô tả:</span>
                      <p className="text-sm text-foreground">{complaintDetail.chuyen_di.mo_ta}</p>
                    </div>
                  )}
                  <div className="flex gap-4">
                    <div>
                      <span className="text-sm font-medium">Ngày bắt đầu:</span>
                      <p className="text-sm text-foreground">
                        {complaintDetail.ngay_bat_dau || complaintDetail.chuyen_di?.ngay_bat_dau 
                          ? new Date(complaintDetail.ngay_bat_dau || complaintDetail.chuyen_di.ngay_bat_dau).toLocaleDateString("vi-VN")
                          : "N/A"}
                      </p>
                    </div>
                    <div>
                      <span className="text-sm font-medium">Ngày kết thúc:</span>
                      <p className="text-sm text-foreground">
                        {complaintDetail.ngay_ket_thuc || complaintDetail.chuyen_di?.ngay_ket_thuc
                          ? new Date(complaintDetail.ngay_ket_thuc || complaintDetail.chuyen_di.ngay_ket_thuc).toLocaleDateString("vi-VN")
                          : "N/A"}
                      </p>
                    </div>
                  </div>
                  {complaintDetail.chuyen_di?.trang_thai && (
                    <div>
                      <span className="text-sm font-medium">Trạng thái:</span>
                      <Badge variant="outline" className="ml-2">{complaintDetail.chuyen_di.trang_thai}</Badge>
                    </div>
                  )}
                </div>
              </div>

              {/* Lý do khiếu nại */}
              <div className="space-y-2">
                <Label className="text-sm font-semibold">Lý do khiếu nại</Label>
                <div className="p-3 bg-muted rounded-lg">
                  <p className="text-sm text-foreground">{complaintDetail.ly_do || "N/A"}</p>
                </div>
              </div>

              {/* Trạng thái */}
              <div className="space-y-2">
                <Label className="text-sm font-semibold">Trạng thái xử lý</Label>
                <div className="flex items-center gap-2">
                  <Badge variant={complaintDetail.trang_thai === 0 ? "default" : "secondary"} className="text-xs">
                    {complaintDetail.trang_thai_text || (complaintDetail.trang_thai === 0 ? "Chờ xử lý" : "Đã xử lý")}
                  </Badge>
                </div>
              </div>

              {/* Phản hồi từ admin */}
              {complaintDetail.phan_hoi_cua_admin && (
                <div className="space-y-2">
                  <Label className="text-sm font-semibold">
                    Phản hồi từ {complaintDetail.admin_phan_hoi?.ho_ten || "Admin"}
                  </Label>
                  <div className="p-3 bg-primary/5 border border-primary/20 rounded-lg">
                    <p className="text-sm text-foreground">{complaintDetail.phan_hoi_cua_admin}</p>
                    {complaintDetail.admin_phan_hoi?.email && (
                      <p className="text-xs text-muted-foreground mt-1">
                        Email: {complaintDetail.admin_phan_hoi.email}
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Thông tin thời gian */}
              <div className="space-y-2">
                <Label className="text-sm font-semibold">Thông tin thời gian</Label>
                <div className="p-3 bg-muted rounded-lg space-y-1">
                  <div>
                    <span className="text-xs text-muted-foreground">Tạo lúc:</span>
                    <p className="text-sm text-foreground">
                      {complaintDetail.tao_luc 
                        ? new Date(complaintDetail.tao_luc).toLocaleString("vi-VN")
                        : "N/A"}
                    </p>
                  </div>
                  {complaintDetail.cap_nhat_luc && (
                    <div>
                      <span className="text-xs text-muted-foreground">Cập nhật lúc:</span>
                      <p className="text-sm text-foreground">
                        {new Date(complaintDetail.cap_nhat_luc).toLocaleString("vi-VN")}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Nút xem chuyến đi */}
              <div className="flex justify-end gap-2 pt-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    handleCloseComplaintDetailDialog()
                    handleViewTripDetail(String(complaintDetail.chuyen_di_id))
                  }}
                >
                  <Eye className="h-4 w-4 mr-2" />
                  Xem chuyến đi
                </Button>
                <Button variant="outline" onClick={handleCloseComplaintDetailDialog}>
                  Đóng
                </Button>
              </div>
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-muted-foreground">Không tìm thấy chi tiết khiếu nại</p>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Dialog Gửi Khiếu Nại */}
      <Dialog open={showComplaintDialog} onOpenChange={setShowComplaintDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 justify-center w-full">
              <Flag className="h-5 w-5 text-red-500" />
              Gửi khiếu nại
            </DialogTitle>
            <DialogDescription>
              Vui lòng cung cấp thông tin về vấn đề bạn gặp phải với chuyến đi này.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Lý do */}
            <div className="space-y-2">
              <Label htmlFor="ly_do">Lý do khiếu nại *</Label>
              <Textarea
                id="ly_do"
                placeholder="Vui lòng mô tả chi tiết lý do khiếu nại..."
                value={complaintLyDo}
                onChange={(e) => setComplaintLyDo(e.target.value)}
                className="min-h-[100px]"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={handleCloseComplaintDialog} disabled={isSubmittingComplaint}>
              Hủy
            </Button>
            <Button onClick={handleSubmitComplaint} disabled={isSubmittingComplaint || !complaintLyDo.trim()}>
              {isSubmittingComplaint ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Đang gửi...
                </>
              ) : (
                <>
                  <Flag className="h-4 w-4 mr-2" />
                  Gửi khiếu nại
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
