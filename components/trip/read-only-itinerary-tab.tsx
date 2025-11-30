"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Clock, MapPin, Calendar, Navigation, FileText, Globe } from "lucide-react"

interface ReadOnlyItineraryTabProps {
  itinerary: any[]
}

export function ReadOnlyItineraryTab({ itinerary }: ReadOnlyItineraryTabProps) {
  const getActivityTypeColor = (type: string) => {
    const colors = {
      transport: "bg-blue-100 text-blue-700",
      accommodation: "bg-green-100 text-green-700",
      sightseeing: "bg-purple-100 text-purple-700",
      dining: "bg-orange-100 text-orange-700",
      entertainment: "bg-pink-100 text-pink-700",
    }
    return colors[type as keyof typeof colors] || "bg-gray-100 text-gray-700"
  }

  const getActivityTypeLabel = (type: string) => {
    const labels = {
      transport: "Di chuyển",
      accommodation: "Lưu trú",
      sightseeing: "Tham quan",
      dining: "Ăn uống",
      entertainment: "Giải trí",
    }
    return labels[type as keyof typeof labels] || "Khác"
  }

  return (
<div className="max-h-[80vh] overflow-y-auto">  {/* Wrapper thêm thanh cuộn */}
  <div className="space-y-6">
    {/* Read-Only Notice */}
    {/* <Card className="border-blue-200 bg-blue-50">
      <CardContent className="p-4">
        <div className="flex items-center gap-2 text-blue-800">
          <Calendar className="h-4 w-4" />
          <span className="text-sm font-medium">Lịch trình chi tiết - Chế độ xem công khai</span>
        </div>
      </CardContent>
    </Card> */}

    {/* Itinerary Days */}
    {itinerary?.map((day: any, dayIndex: number) => (
      <Card key={dayIndex || day.lich_trinh_ngay_id}>
        <CardHeader>
          <CardTitle className="flex items-center gap-3">
            <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold">
              {day.day}
            </div>
            {day.title}
          </CardTitle>
          {/* <div className="space-y-1 mt-2">
            <p className="text-sm text-gray-600">{day.date}</p>
            {day.ngay && (
              <p className="text-xs text-gray-500">Ngày gốc: {day.ngay}</p>
            )}
            {day.ghi_chu && (
              <div className="flex items-start gap-2 mt-2 p-2 bg-blue-50 rounded-md">
                <FileText className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                <p className="text-sm text-gray-700">{day.ghi_chu}</p>
              </div>
            )}
            {day.lich_trinh_ngay_id && (
              <p className="text-xs text-gray-400">ID: {day.lich_trinh_ngay_id}</p>
            )}
          </div> */}
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {day.activities?.map((activity: any, actIndex: number) => (
              <div key={actIndex || activity.dia_diem_id} className="flex gap-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Clock className="h-5 w-5 text-blue-600" />
                  </div>
                </div>
                <div className="flex-1 space-y-3">
                  {/* Header với thời gian và loại */}
                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                    {/* <span className="text-sm font-semibold text-blue-600">{activity.time}</span>
                    <Badge variant="outline" className="text-xs">
                      {activity.duration}
                    </Badge> */}
                    <Badge className={`text-xs ${getActivityTypeColor(activity.type)}`}>
                      {getActivityTypeLabel(activity.type)}
                    </Badge>
                    {/* poi hotel */}
                    {/* {activity.loai_dia_diem && (
                      <Badge variant="outline" className="text-xs text-gray-600">
                        {activity.loai_dia_diem}
                      </Badge>
                    )} */}
                  </div>

                  {/* Tên địa điểm */}
                  <h4 className="font-semibold text-gray-900">{activity.title}</h4>
                  
                  {/* Địa chỉ */}
                  <p className="text-sm text-gray-600 flex items-center gap-1">
                    <MapPin className="h-3 w-3 flex-shrink-0" />
                    <span>{activity.location}</span>
                  </p>

                  {/* Ghi chú địa điểm */}
                  {activity.ghi_chu && (
                    <div className="flex items-start gap-2 p-2 bg-white rounded border border-gray-200">
                      <FileText className="h-3 w-3 text-gray-500 mt-0.5 flex-shrink-0" />
                      <p className="text-sm text-gray-700">{activity.ghi_chu}</p>
                    </div>
                  )}

                  {/* Thông tin chi tiết */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 pt-2 border-t border-gray-200">
                    {/* Tọa độ */}
                    {(activity.vi_do !== null || activity.kinh_do !== null) && (
                      <div className="flex items-center gap-2 text-xs text-gray-600">
                        <Navigation className="h-3 w-3" />
                        <span>
                          {activity.vi_do !== null && activity.kinh_do !== null
                            ? `${activity.vi_do}, ${activity.kinh_do}`
                            : activity.vi_do !== null
                            ? `Vĩ độ: ${activity.vi_do}`
                            : `Kinh độ: ${activity.kinh_do}`}
                        </span>
                      </div>
                    )}

                    {/* Google Place ID */}
                    {/* {activity.google_place_id && (
                      <div className="flex items-center gap-2 text-xs text-gray-600">
                        <Globe className="h-3 w-3" />
                        <span className="truncate" title={activity.google_place_id}>
                          Place ID: {activity.google_place_id}
                        </span>
                      </div>
                    )} */}

                    {/* ID địa điểm */}
                    {/* {activity.dia_diem_id && (
                      <div className="text-xs text-gray-500">
                        ID: {activity.dia_diem_id}
                      </div>
                    )} */}

                    {/* Thời gian chi tiết */}
                    {/* {(activity.thoi_gian_bat_dau || activity.thoi_gian_ket_thuc) && (
                      <div className="text-xs text-gray-500 space-y-0.5">
                        {activity.thoi_gian_bat_dau && (
                          <div>Bắt đầu: {activity.thoi_gian_bat_dau}</div>
                        )}
                        {activity.thoi_gian_ket_thuc && (
                          <div>Kết thúc: {activity.thoi_gian_ket_thuc}</div>
                        )}
                      </div>
                    )} */}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    ))}

    {/* Empty State */}
    {(!itinerary || itinerary.length === 0) && (
      <Card>
        <CardContent className="p-12 text-center">
          <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Chưa có lịch trình</h3>
          <p className="text-gray-600">Lịch trình chi tiết sẽ được hiển thị ở đây</p>
        </CardContent>
      </Card>
    )}
  </div>
</div>
  )
}
