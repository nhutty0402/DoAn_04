"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { MapPin, Navigation, Cloud, Sun, CloudRain, Search, Navigation2, Star } from "lucide-react"

interface MapsTabProps {
  tripId: string
}

// Mock data for demonstration
const mockLocations = [
  { id: "1", name: "Cầu Rồng", lat: 16.0544, lng: 108.2272, type: "attraction", rating: 4.5 },
  { id: "2", name: "Bà Nà Hills", lat: 15.9969, lng: 107.9909, type: "attraction", rating: 4.8 },
  { id: "3", name: "Hội An Ancient Town", lat: 15.8801, lng: 105.8468, type: "heritage", rating: 4.7 },
  { id: "4", name: "My Khe Beach", lat: 16.0471, lng: 108.2425, type: "beach", rating: 4.6 },
]

const mockWeather = {
  current: { temp: 28, condition: "sunny", humidity: 65, wind: 12 },
  forecast: [
    { date: "2024-03-15", temp: { min: 22, max: 30 }, condition: "sunny" },
    { date: "2024-03-16", temp: { min: 24, max: 32 }, condition: "cloudy" },
    { date: "2024-03-17", temp: { min: 23, max: 29 }, condition: "rainy" },
  ],
}

const mockBookingSuggestions = [
  {
    id: "1",
    type: "hotel",
    name: "Vinpearl Resort & Spa Da Nang",
    price: "2,500,000 VNĐ/đêm",
    rating: 4.8,
    image: "/luxury-hotel-danang.jpg",
  },
  {
    id: "2",
    type: "flight",
    name: "Vietnam Airlines - HAN → DAD",
    price: "1,200,000 VNĐ",
    duration: "1h 30m",
    image: "/airplane-vietnam-airlines.jpg",
  },
  {
    id: "3",
    type: "activity",
    name: "Tour Bà Nà Hills",
    price: "850,000 VNĐ/người",
    rating: 4.7,
    image: "/bana-hills-golden-bridge.jpg",
  },
]

export function MapsTab({ tripId }: MapsTabProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedLocation, setSelectedLocation] = useState<string | null>(null)
  const [showDirections, setShowDirections] = useState(false)

  const getWeatherIcon = (condition: string) => {
    switch (condition) {
      case "sunny":
        return <Sun className="h-4 w-4 text-yellow-500" />
      case "cloudy":
        return <Cloud className="h-4 w-4 text-gray-500" />
      case "rainy":
        return <CloudRain className="h-4 w-4 text-blue-500" />
      default:
        return <Sun className="h-4 w-4 text-yellow-500" />
    }
  }

  const getLocationTypeColor = (type: string) => {
    switch (type) {
      case "attraction":
        return "bg-primary"
      case "heritage":
        return "bg-orange-500"
      case "beach":
        return "bg-blue-500"
      default:
        return "bg-gray-500"
    }
  }

  return (
    <div className="space-y-6">
      {/* Search and Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5 text-primary" />
            Bản đồ & Điều hướng
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 mb-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Tìm kiếm địa điểm..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button variant="outline" onClick={() => setShowDirections(!showDirections)}>
              <Navigation2 className="h-4 w-4 mr-2" />
              {showDirections ? "Ẩn chỉ đường" : "Chỉ đường"}
            </Button>
          </div>

          {/* Mock Google Maps Container */}
          <div className="w-full h-96 bg-gradient-to-br from-blue-50 to-green-50 rounded-lg border-2 border-dashed border-primary/20 flex items-center justify-center relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-100/50 to-green-100/50" />
            <div className="text-center z-10">
              <MapPin className="h-12 w-12 text-primary mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-2">Google Maps Integration</h3>
              <p className="text-muted-foreground mb-4">Bản đồ tương tác với các địa điểm trong chuyến đi</p>
              <div className="flex gap-2 justify-center">
                {mockLocations.map((location) => (
                  <div
                    key={location.id}
                    className={`w-3 h-3 rounded-full ${getLocationTypeColor(location.type)} animate-pulse`}
                  />
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Locations List */}
        <Card>
          <CardHeader>
            <CardTitle>Địa điểm trong chuyến đi</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {mockLocations.map((location) => (
                <div
                  key={location.id}
                  className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                    selectedLocation === location.id
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-primary/50"
                  }`}
                  onClick={() => setSelectedLocation(location.id)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-3 h-3 rounded-full ${getLocationTypeColor(location.type)}`} />
                      <div>
                        <h4 className="font-medium">{location.name}</h4>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                          <span>{location.rating}</span>
                        </div>
                      </div>
                    </div>
                    <Button variant="ghost" size="sm">
                      <Navigation className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Weather Forecast */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Cloud className="h-5 w-5 text-primary" />
              Thời tiết
            </CardTitle>
          </CardHeader>
          <CardContent>
            {/* Current Weather */}
            <div className="mb-4 p-4 bg-gradient-to-r from-blue-50 to-sky-50 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-2xl font-bold">{mockWeather.current.temp}°C</h3>
                  <p className="text-muted-foreground">Đà Nẵng, hôm nay</p>
                </div>
                {getWeatherIcon(mockWeather.current.condition)}
              </div>
              <div className="grid grid-cols-2 gap-4 mt-3 text-sm">
                <div>Độ ẩm: {mockWeather.current.humidity}%</div>
                <div>Gió: {mockWeather.current.wind} km/h</div>
              </div>
            </div>

            {/* Forecast */}
            <div className="space-y-2">
              <h4 className="font-medium">Dự báo 3 ngày tới</h4>
              {mockWeather.forecast.map((day, index) => (
                <div key={index} className="flex items-center justify-between p-2 rounded border">
                  <div className="flex items-center gap-3">
                    {getWeatherIcon(day.condition)}
                    <span className="text-sm">{new Date(day.date).toLocaleDateString("vi-VN")}</span>
                  </div>
                  <div className="text-sm">
                    {day.temp.min}° - {day.temp.max}°
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Booking Suggestions */}
      <Card>
        <CardHeader>
          <CardTitle>Gợi ý đặt chỗ</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {mockBookingSuggestions.map((suggestion) => (
              <div key={suggestion.id} className="border rounded-lg overflow-hidden hover:shadow-md transition-shadow">
                <img
                  src={suggestion.image || "/placeholder.svg"}
                  alt={suggestion.name}
                  className="w-full h-32 object-cover"
                />
                <div className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant="secondary" className="text-xs">
                      {suggestion.type === "hotel"
                        ? "Khách sạn"
                        : suggestion.type === "flight"
                          ? "Chuyến bay"
                          : "Hoạt động"}
                    </Badge>
                    {suggestion.rating && (
                      <div className="flex items-center gap-1 text-xs">
                        <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                        <span>{suggestion.rating}</span>
                      </div>
                    )}
                  </div>
                  <h4 className="font-medium mb-2 line-clamp-2">{suggestion.name}</h4>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-primary">{suggestion.price}</span>
                    <Button size="sm" variant="outline">
                      Xem chi tiết
                    </Button>
                  </div>
                  {suggestion.type === "flight" && (
                    <p className="text-xs text-muted-foreground mt-1">Thời gian bay: {(suggestion as any).duration}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
