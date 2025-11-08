"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import axios from "axios"
import Cookies from "js-cookie"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Bell, X, Check, MapPin, DollarSign, Users, MessageCircle, Calendar, Loader2, UserPlus } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { useToast } from "@/hooks/use-toast"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

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

interface NotificationCenterProps {
  isOpen: boolean
  onClose: () => void
}

export function NotificationCenter({ isOpen, onClose }: NotificationCenterProps) {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [invitations, setInvitations] = useState<Invitation[]>([])
  const [loading, setLoading] = useState(false)
  const [invitationsLoading, setInvitationsLoading] = useState(false)
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
        const mappedNotifications: Notification[] = apiData.map((item: any) => ({
          id: String(item.thong_bao_id || ""),
          type: mapLoaiToType(item.loai || ""),
          title: generateTitle(item.loai || ""),
          message: item.noi_dung || "",
          timestamp: item.tao_luc || "",
          read: Boolean(item.da_xem),
          tripId: item.lien_ket || undefined,
          tripName: undefined, // API không có tripName, có thể cần gọi thêm API nếu cần
        }))

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
            {unreadCount > 0 && (
              <Button variant="ghost" size="sm" onClick={markAllAsRead} className="text-primary hover:text-primary/80">
                <Check className="h-4 w-4 mr-1" />
                Đánh dấu tất cả
              </Button>
            )}
          </CardHeader>
          <CardContent className="p-0">
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
                      {invitations.map((invitation) => (
                        <motion.div
                          key={`invitation-${invitation.moi_id}`}
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
                      {notifications.map((notification) => (
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
                                  <div className="flex items-center gap-2">
                                    {notification.tripName && (
                                    <Badge variant="outline" className="text-xs">
                                      {notification.tripName}
                                    </Badge>
                                    )}
                                    <span className="text-xs text-muted-foreground">
                                      {formatTime(notification.timestamp)}
                                    </span>
                                  </div>
                                </div>
                                {/* nút X */}
                                {/* <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    deleteNotification(notification.id)
                                  }}
                                >
                                  <X className="h-3 w-3" />
                                </Button> */}
                              </div>
                            </div>
                            {!notification.read && <div className="w-2 h-2 bg-primary rounded-full flex-shrink-0 mt-2" />}
                          </div>
                        </motion.div>
                      ))}
                    </>
                  )}
                </AnimatePresence>
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}
