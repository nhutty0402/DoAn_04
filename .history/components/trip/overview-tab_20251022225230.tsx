"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  Calendar,
  Users,
  MapPin,
  DollarSign,
  Clock,
  TrendingUp,
  Download,
  Share2,
  FileText,
  CreditCard,
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { PaymentModal } from "@/components/payment/payment-modal"

interface OverviewTabProps {
  trip: any
}

export function OverviewTab({ trip }: OverviewTabProps) {
  const [isExporting, setIsExporting] = useState(false)
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const { toast } = useToast()

  // Calculate trip duration if dates are available
  const getTripDuration = () => {
    if (trip?.ngay_bat_dau && trip?.ngay_ket_thuc) {
      const startDate = new Date(trip.ngay_bat_dau)
      const endDate = new Date(trip.ngay_ket_thuc)
      const duration = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1
      return `${duration} ngày`
    }
    return "Chưa cập nhật"
  }

  const getDateRange = () => {
    if (trip?.ngay_bat_dau && trip?.ngay_ket_thuc) {
      const startDate = new Date(trip.ngay_bat_dau)
      const endDate = new Date(trip.ngay_ket_thuc)
      return `${startDate.toLocaleDateString("vi-VN")} - ${endDate.toLocaleDateString("vi-VN")}`
    }
    return "Chưa cập nhật"
  }

  const stats = [
    {
      title: "Tổng số ngày",
      value: getTripDuration(),
      icon: <Calendar className="h-5 w-5 text-primary" />,
      description: getDateRange(),
    },
    {
      title: "Địa điểm xuất phát",
      value: trip?.dia_diem_xuat || "Chưa cập nhật",
      icon: <MapPin className="h-5 w-5 text-primary" />,
      description: "Nơi bắt đầu hành trình",
    },
    // khung dưới icon
    // {
    //   title: "Tiền tệ",
    //   value: trip?.tien_te || "VNĐ",
    //   icon: <DollarSign className="h-5 w-5 text-primary" />,
    //   description: "Đơn vị tiền tệ sử dụng",
    // },
    // {
    //   title: "Trạng thái",
    //   value: trip?.cong_khai ? "Công khai" : "Riêng tư",
    //   icon: <TrendingUp className="h-5 w-5 text-primary" />,
    //   description: trip?.trang_thai || "Chưa cập nhật",
    // },
  ]

  const recentActivities = [
    {
      action: "Thêm điểm đến",
      detail: "Bãi biển Mỹ Khê",
      user: "Nguyễn Văn A",
      time: "2 giờ trước",
      type: "location",
    },
    {
      action: "Cập nhật chi phí",
      detail: "Khách sạn Muong Thanh",
      user: "Trần Thị B",
      time: "5 giờ trước",
      type: "expense",
    },
    {
      action: "Mời thành viên",
      detail: "Lê Văn C",
      user: "Nguyễn Văn A",
      time: "1 ngày trước",
      type: "member",
    },
    {
      action: "Xuất PDF",
      detail: "Lịch trình chi tiết",
      user: "Trần Thị B",
      time: "2 ngày trước",
      type: "export",
    },
    {
      action: "Thanh toán",
      detail: "Đặt cọc khách sạn",
      user: "Nguyễn Văn A",
      time: "3 ngày trước",
      type: "payment",
    },
  ]

  const handleExportPDF = async () => {
    setIsExporting(true)
    try {
      // Simulate PDF generation
      await new Promise((resolve) => setTimeout(resolve, 2000))

      toast({
        title: "Xuất PDF thành công!",
        description: "Lịch trình đã được tải xuống",
      })
    } catch (error) {
      toast({
        title: "Lỗi xuất PDF",
        description: "Không thể tạo file PDF. Vui lòng thử lại.",
        variant: "destructive",
      })
    } finally {
      setIsExporting(false)
    }
  }

  const handleShare = async () => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: trip?.ten_chuyen_di || "Chuyến đi",
          text: `Tham gia chuyến đi ${trip?.ten_chuyen_di || "này"} cùng tôi!`,
          url: window.location.href,
        })
      } else {
        // Fallback: copy to clipboard
        await navigator.clipboard.writeText(window.location.href)
        toast({
          title: "Đã sao chép liên kết!",
          description: "Liên kết chuyến đi đã được sao chép vào clipboard",
        })
      }
    } catch (error) {
      toast({
        title: "Lỗi chia sẻ",
        description: "Không thể chia sẻ chuyến đi. Vui lòng thử lại.",
        variant: "destructive",
      })
    }
  }

  const handleSharePublic = async () => {
    const publicLink = `${window.location.origin}/feed/${trip?.chuyen_di_id || trip?.id}`
    try {
      if (navigator.share) {
        await navigator.share({
          title: trip?.ten_chuyen_di || "Chuyến đi",
          text: `Khám phá chuyến đi tuyệt vời: ${trip?.ten_chuyen_di || "này"}`,
          url: publicLink,
        })
      } else {
        await navigator.clipboard.writeText(publicLink)
        toast({
          title: "Đã sao chép liên kết công khai!",
          description: "Liên kết công khai đã được sao chép vào clipboard",
        })
      }
    } catch (error) {
      toast({
        title: "Lỗi chia sẻ",
        description: "Không thể chia sẻ chuyến đi. Vui lòng thử lại.",
        variant: "destructive",
      })
    }
  }

  const getActivityIcon = (type: string) => {
    switch (type) {
      case "location":
        return <MapPin className="h-3 w-3 text-blue-500" />
      case "expense":
        return <DollarSign className="h-3 w-3 text-green-500" />
      case "member":
        return <Users className="h-3 w-3 text-purple-500" />
      case "export":
        return <FileText className="h-3 w-3 text-orange-500" />
      case "payment":
        return <CreditCard className="h-3 w-3 text-red-500" />
      default:
        return <Clock className="h-3 w-3 text-gray-500" />
    }
  }

  return (
    <div className="space-y-6">
      {/* Export and Share Actions */}
      {/* <Card>
        <CardHeader>
          <CardTitle>Xuất dữ liệu & Chia sẻ</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <Button onClick={handleExportPDF} disabled={isExporting} className="flex items-center gap-2">
              <Download className="h-4 w-4" />
              {isExporting ? "Đang xuất PDF..." : "Xuất PDF"}
            </Button>
            <Button variant="outline" onClick={handleShare} className="flex items-center gap-2 bg-transparent">
              <Share2 className="h-4 w-4" />
              Chia sẻ chuyến đi
            </Button>
            <Button variant="outline" onClick={handleSharePublic} className="flex items-center gap-2 bg-transparent">
              <Share2 className="h-4 w-4" />
              Chia sẻ công khai
            </Button>
            <Button variant="outline" onClick={() => setShowPaymentModal(true)} className="flex items-center gap-2">
              <CreditCard className="h-4 w-4" />
              Thanh toán MoMo
            </Button>
          </div>
        </CardContent>
      </Card> */}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, index) => (
          <Card key={index}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">{stat.title}</p>
                  <p className="text-2xl font-bold text-foreground">{stat.value}</p>
                  <p className="text-xs text-muted-foreground mt-1">{stat.description}</p>
                </div>
                {stat.icon}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Progress Overview */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              Tiến Độ Chuyến Đi
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Lịch trình</span>
                <span className="font-medium">80%</span>
              </div>
              <div className="w-full bg-muted rounded-full h-2">
                <div className="bg-primary h-2 rounded-full" style={{ width: "80%" }} />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Chi phí</span>
                <span className="font-medium">65%</span>
              </div>
              <div className="w-full bg-muted rounded-full h-2">
                <div className="bg-secondary h-2 rounded-full" style={{ width: "65%" }} />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Thành viên</span>
                <span className="font-medium">75%</span>
              </div>
              <div className="w-full bg-muted rounded-full h-2">
                <div className="bg-accent h-2 rounded-full" style={{ width: "75%" }} />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Enhanced Recent Activities */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-primary" />
              Nhật Ký Hoạt Động
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4 max-h-64 overflow-y-auto">
              {recentActivities.map((activity, index) => (
                <div key={index} className="flex items-start gap-3 pb-3 border-b border-border last:border-0">
                  <div className="flex items-center justify-center w-6 h-6 rounded-full bg-muted mt-1">
                    {getActivityIcon(activity.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground">
                      {activity.action}: <span className="text-primary">{activity.detail}</span>
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {activity.user} • {activity.time}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Hành Động Nhanh</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-4 border border-border rounded-lg hover:bg-muted/50 cursor-pointer transition-colors">
              <Calendar className="h-6 w-6 text-primary mb-2" />
              <p className="font-medium text-sm">Thêm ngày mới</p>
            </div>
            <div className="p-4 border border-border rounded-lg hover:bg-muted/50 cursor-pointer transition-colors">
              <Users className="h-6 w-6 text-primary mb-2" />
              <p className="font-medium text-sm">Mời thành viên</p>
            </div>
            <div className="p-4 border border-border rounded-lg hover:bg-muted/50 cursor-pointer transition-colors">
              <DollarSign className="h-6 w-6 text-primary mb-2" />
              <p className="font-medium text-sm">Thêm chi phí</p>
            </div>
            <div className="p-4 border border-border rounded-lg hover:bg-muted/50 cursor-pointer transition-colors">
              <MapPin className="h-6 w-6 text-primary mb-2" />
              <p className="font-medium text-sm">Tìm địa điểm</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <PaymentModal
        isOpen={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        tripId={trip?.chuyen_di_id || trip?.id}
        amount={3900000}
      />
    </div>
  )
}
