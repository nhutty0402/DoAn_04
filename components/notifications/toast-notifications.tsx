"use client"

import { useEffect } from "react"
import { useToast } from "@/hooks/use-toast"

// Mock real-time notification service
export function useRealtimeNotifications() {
  const { toast } = useToast()

  useEffect(() => {
    // Simulate real-time notifications
    const interval = setInterval(() => {
      if (Math.random() > 0.9) {
        // 10% chance every 10 seconds
        const notifications = [
          {
            title: "Chi phí mới",
            description: "Trần Thị B đã thêm chi phí mới vào chuyến đi",
          },
          {
            title: "Tin nhắn mới",
            description: "Lê Văn C đã gửi tin nhắn trong nhóm chat",
          },
          {
            title: "Lịch trình cập nhật",
            description: "Nguyễn Văn A đã thêm điểm đến mới",
          },
          {
            title: "Thành viên mới",
            description: "Phạm Thị D đã tham gia chuyến đi",
          },
        ]

        const randomNotification = notifications[Math.floor(Math.random() * notifications.length)]

        toast({
          title: randomNotification.title,
          description: randomNotification.description,
          duration: 5000,
        })
      }
    }, 10000) // Check every 10 seconds

    return () => clearInterval(interval)
  }, [toast])
}

// Component to be used in layout or main app component
export function ToastNotifications() {
  useRealtimeNotifications()
  return null
}
