"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Bell, X, Check, MapPin, DollarSign, Users, MessageCircle, Calendar } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { useToast } from "@/hooks/use-toast"

// Mock notifications data
const mockNotifications = [
  {
    id: "notif1",
    type: "expense",
    title: "Chi phí mới được thêm",
    message: "Trần Thị B đã thêm chi phí 'Ăn trưa tại Chợ Hàn' - 480,000 VNĐ",
    timestamp: "2024-03-14T11:30:00Z",
    read: false,
    tripId: "trip1",
    tripName: "Du lịch Đà Nẵng",
  },
  {
    id: "notif2",
    type: "itinerary",
    title: "Lịch trình được cập nhật",
    message: "Nguyễn Văn A đã thêm điểm đến 'Bãi biển Mỹ Khê' vào ngày 15/03",
    timestamp: "2024-03-14T10:45:00Z",
    read: false,
    tripId: "trip1",
    tripName: "Du lịch Đà Nẵng",
  },
  {
    id: "notif3",
    type: "member",
    title: "Thành viên mới tham gia",
    message: "Phạm Thị D đã chấp nhận lời mời tham gia chuyến đi",
    timestamp: "2024-03-14T09:15:00Z",
    read: true,
    tripId: "trip1",
    tripName: "Du lịch Đà Nẵng",
  },
  {
    id: "notif4",
    type: "chat",
    title: "Tin nhắn mới",
    message: "Lê Văn C: Mình vừa thêm vé Bà Nà Hills vào chi phí rồi nhé",
    timestamp: "2024-03-14T08:30:00Z",
    read: true,
    tripId: "trip1",
    tripName: "Du lịch Đà Nẵng",
  },
  {
    id: "notif5",
    type: "booking",
    title: "Đề xuất khách sạn",
    message: "Tìm thấy 5 khách sạn phù hợp cho chuyến đi của bạn",
    timestamp: "2024-03-13T16:20:00Z",
    read: true,
    tripId: "trip1",
    tripName: "Du lịch Đà Nẵng",
  },
]

interface NotificationCenterProps {
  isOpen: boolean
  onClose: () => void
}

export function NotificationCenter({ isOpen, onClose }: NotificationCenterProps) {
  const [notifications, setNotifications] = useState(mockNotifications)
  const { toast } = useToast()

  const unreadCount = notifications.filter((n) => !n.read).length

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

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((notif) => ({ ...notif, read: true })))
    toast({
      title: "Đã đánh dấu tất cả",
      description: "Tất cả thông báo đã được đánh dấu là đã đọc",
    })
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
                  {notifications.length === 0 ? (
                    <div className="text-center py-12">
                      <Bell className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <h3 className="text-lg font-semibold text-foreground mb-2">Không có thông báo</h3>
                      <p className="text-muted-foreground">Bạn đã xem hết tất cả thông báo</p>
                    </div>
                  ) : (
                    notifications.map((notification) => (
                      <motion.div
                        key={notification.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20 }}
                        className={`p-4 border-b border-border hover:bg-muted/30 cursor-pointer transition-colors ${
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
                                  <Badge variant="outline" className="text-xs">
                                    {notification.tripName}
                                  </Badge>
                                  <span className="text-xs text-muted-foreground">
                                    {formatTime(notification.timestamp)}
                                  </span>
                                </div>
                              </div>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  deleteNotification(notification.id)
                                }}
                              >
                                <X className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                          {!notification.read && <div className="w-2 h-2 bg-primary rounded-full flex-shrink-0 mt-2" />}
                        </div>
                      </motion.div>
                    ))
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
