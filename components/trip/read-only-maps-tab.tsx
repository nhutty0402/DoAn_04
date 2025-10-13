"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { MapPin, Navigation2, Clock } from "lucide-react"

interface ReadOnlyMapsTabProps {
  tripId: string
  destinations?: any[]
}

export function ReadOnlyMapsTab({ tripId, destinations = [] }: ReadOnlyMapsTabProps) {
  // Mock destinations data
  const mockDestinations = [
    {
      id: "1",
      name: "Cầu Vàng Ba Na Hills",
      address: "Ba Na Hills, Hòa Vang, Đà Nẵng",
      coordinates: { lat: 15.9956, lng: 107.9996 },
      type: "attraction",
      visitTime: "09:00 - 17:00",
      day: 2,
    },
    {
      id: "2",
      name: "Phố cổ Hội An",
      address: "Hội An, Quảng Nam",
      coordinates: { lat: 15.8801, lng: 108.338 },
      type: "cultural",
      visitTime: "14:00 - 18:00",
      day: 3,
    },
    {
      id: "3",
      name: "Bãi biển Mỹ Khê",
      address: "Ngũ Hành Sơn, Đà Nẵng",
      coordinates: { lat: 16.0544, lng: 108.2442 },
      type: "beach",
      visitTime: "06:00 - 19:00",
      day: 1,
    },
  ]

  const getDestinationType = (type: string) => {
    const types = {
      attraction: { label: "Điểm tham quan", color: "bg-blue-100 text-blue-700" },
      cultural: { label: "Văn hóa", color: "bg-purple-100 text-purple-700" },
      beach: { label: "Bãi biển", color: "bg-cyan-100 text-cyan-700" },
      restaurant: { label: "Nhà hàng", color: "bg-orange-100 text-orange-700" },
      hotel: { label: "Khách sạn", color: "bg-green-100 text-green-700" },
    }
    return types[type as keyof typeof types] || { label: "Khác", color: "bg-gray-100 text-gray-700" }
  }

  return (
    <div className="space-y-6">
      {/* Read-Only Notice */}
      <Card className="border-blue-200 bg-blue-50">
        <CardContent className="p-4">
          <div className="flex items-center gap-2 text-blue-800">
            <MapPin className="h-4 w-4" />
            <span className="text-sm font-medium">Bản đồ chuyến đi - Chế độ xem công khai</span>
          </div>
        </CardContent>
      </Card>

      {/* Interactive Map Placeholder */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Navigation2 className="h-5 w-5 text-primary" />
            Bản đồ tương tác
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-96 bg-gradient-to-br from-blue-50 to-cyan-50 rounded-lg flex items-center justify-center border-2 border-dashed border-blue-200">
            <div className="text-center text-blue-600">
              <MapPin className="h-16 w-16 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Bản đồ tương tác</h3>
              <p className="text-sm text-blue-500">
                Bản đồ Google Maps với các điểm đến được đánh dấu sẽ hiển thị ở đây
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Destinations List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5 text-primary" />
            Danh sách điểm đến
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {mockDestinations.map((destination, index) => (
              <div
                key={destination.id}
                className="flex items-start gap-4 p-4 border rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className="flex-shrink-0">
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                    <span className="text-sm font-bold text-blue-600">{index + 1}</span>
                  </div>
                </div>
                <div className="flex-1">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h4 className="font-semibold text-gray-900">{destination.name}</h4>
                      <p className="text-sm text-gray-600 flex items-center gap-1 mt-1">
                        <MapPin className="h-3 w-3" />
                        {destination.address}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className={`text-xs ${getDestinationType(destination.type).color}`}>
                        {getDestinationType(destination.type).label}
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        Ngày {destination.day}
                      </Badge>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <Clock className="h-3 w-3" />
                    <span>Thời gian tham quan: {destination.visitTime}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Route Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Tóm tắt lộ trình</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <MapPin className="h-8 w-8 text-blue-600 mx-auto mb-2" />
              <p className="text-2xl font-bold text-blue-600">{mockDestinations.length}</p>
              <p className="text-sm text-gray-600">Điểm đến</p>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <Navigation2 className="h-8 w-8 text-green-600 mx-auto mb-2" />
              <p className="text-2xl font-bold text-green-600">~45km</p>
              <p className="text-sm text-gray-600">Tổng quãng đường</p>
            </div>
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <Clock className="h-8 w-8 text-purple-600 mx-auto mb-2" />
              <p className="text-2xl font-bold text-purple-600">~2h</p>
              <p className="text-sm text-gray-600">Thời gian di chuyển</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
