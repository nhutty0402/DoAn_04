"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Calendar, Users, MapPin, DollarSign, Download, Share2, FileText, Star } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface ReadOnlyOverviewTabProps {
  trip: any
}

export function ReadOnlyOverviewTab({ trip }: ReadOnlyOverviewTabProps) {
  const { toast } = useToast()

  const stats = [
    {
      title: "Tổng số ngày",
      value: trip.duration || "6 ngày",
      icon: <Calendar className="h-5 w-5 text-primary" />,
      description: `${new Date(trip.startDate).toLocaleDateString("vi-VN")} - ${new Date(trip.endDate).toLocaleDateString("vi-VN")}`,
    },
    {
      title: "Thành viên",
      value: `${trip.memberCount} người`,
      icon: <Users className="h-5 w-5 text-primary" />,
      description: "Chuyến đi nhóm",
    },
    {
      title: "Đ điểm xuất phát",
      value: `${trip.highlights?.length || 3} địa điểm`,
      icon: <MapPin className="h-5 w-5 text-primary" />,
      description: trip.destination,
    },
    {
      title: "Ngân sách",
      value: trip.budget,
      icon: <DollarSign className="h-5 w-5 text-primary" />,
      description: `${Math.round(Number.parseInt(trip.budget.replace(/[^\d]/g, "")) / trip.memberCount / 1000)}K VNĐ/người`,
    },
  ]

  const handleDownloadPDF = () => {
    // Mock PDF download functionality
    const link = document.createElement("a")
    link.href = "#"
    link.download = `${trip.title}.pdf`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)

    toast({
      title: "Tải PDF thành công!",
      description: "Lịch trình đã được tải xuống",
    })
  }

  const handleShare = async () => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: trip.title,
          text: trip.description,
          url: window.location.href,
        })
      } else {
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

  return (
    <div className="space-y-6">
      {/* Download and Share Actions - Read Only */}
      {/* <Card>
        <CardHeader>
          <CardTitle>Tải xuống & Chia sẻ</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <Button onClick={handleDownloadPDF} className="flex items-center gap-2">
              <Download className="h-4 w-4" />
              Tải PDF
            </Button>
            <Button variant="outline" onClick={handleShare} className="flex items-center gap-2 bg-transparent">
              <Share2 className="h-4 w-4" />
              Chia sẻ
            </Button>
          </div>
        </CardContent>
      </Card> */}

      {/* 4 ô thống kê*/}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
  {stats.map((stat, index) => (
    <Card key={index}>
      <CardContent className="p-5">
        <div className="flex items-center justify-between gap-3">
          <div className="flex-1 min-w-0 space-y-1.5">
            {/* Tiêu đề */}
            <p className="text-xs font-medium text-muted-foreground">
              {stat.title}
            </p>

            {/* Giá trị chính – quan trọng nhất: không xuống dòng, không bị cắt */}
            <p className="text-lg font-bold text-foreground whitespace-nowrap">
              {stat.value}
            </p>

            {/* Mô tả: cho phép xuống dòng tự nhiên nếu dài, nhưng ưu tiên giữ 1 dòng */}
            <p className="text-xs text-muted-foreground leading-tight line-clamp-2">
              {stat.description}
            </p>
          </div>

          {/* Icon */}
          <div className="flex-shrink-0">
            {stat.icon}
          </div>
        </div>
      </CardContent>
    </Card>
  ))}
</div>

      {/* Trip Highlights */}
      {/* <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Star className="h-5 w-5 text-primary" />
            Điểm nổi bật
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {trip.highlights?.map((highlight: string, index: number) => (
              <div key={index} className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
                <div className="w-2 h-2 bg-blue-500 rounded-full" />
                <span className="text-sm font-medium">{highlight}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card> */}

      {/* Budget Breakdown - Read Only */}
      {trip.expenses && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-primary" />
              Chi phí chi tiết
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {trip.expenses.breakdown?.map((expense: any, index: number) => (
                <div
                  key={index}
                  className="flex justify-between items-center py-2 border-b border-gray-100 last:border-0"
                >
                  <span className="text-gray-600">{expense.category}</span>
                  <span className="font-semibold">{expense.amount.toLocaleString()} VNĐ</span>
                </div>
              ))}
              <div className="flex justify-between items-center pt-3 border-t-2 border-blue-100 font-bold text-lg">
                <span>Tổng cộng</span>
                <span className="text-blue-600">{trip.expenses.total?.toLocaleString()} VNĐ</span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Trip Description */}
      {/* <Card>
        <CardHeader>
          <CardTitle>Về chuyến đi này</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground leading-relaxed">{trip.description}</p>
        </CardContent>
      </Card> */}

      {/* Read-Only Notice */}
      <Card className="border-blue-200 bg-blue-50">
        <CardContent className="p-4">
          <div className="flex items-center gap-2 text-blue-800">
            <FileText className="h-4 w-4" />
            <span className="text-sm font-medium">
              Đây là chế độ xem công khai. Bạn không thể chỉnh sửa nội dung này.
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
