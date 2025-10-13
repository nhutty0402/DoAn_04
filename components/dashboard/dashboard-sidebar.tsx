"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Plus, Users, DollarSign, MapPin, Globe, Home } from "lucide-react"
import { CreateTripModal } from "@/components/trips/create-trip-modal"
import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"

export function DashboardSidebar() {
  const [showCreateModal, setShowCreateModal] = useState(false)
  const pathname = usePathname()

  const navigationItems = [
    {
      href: "/dashboard",
      icon: <Home className="h-4 w-4" />,
      label: "Dashboard",
      active: pathname === "/dashboard",
    },
    {
      href: "/feed",
      icon: <Globe className="h-4 w-4" />,
      label: "Bản Tin Công Khai",
      active: pathname.startsWith("/feed"),
    },
  ]

  const quickStats = [
    {
      title: "Chuyến đi",
      value: "3",
      icon: <MapPin className="h-4 w-4 text-blue-500" />,
      color: "text-blue-600",
    },
    {
      title: "Thành viên",
      value: "12",
      icon: <Users className="h-4 w-4 text-green-500" />,
      color: "text-green-600",
    },
    {
      title: "Chi phí",
      value: "45M",
      icon: <DollarSign className="h-4 w-4 text-orange-500" />,
      color: "text-orange-600",
    },
  ]

  return (
    <>
      <aside className="w-80 bg-card border-r border-border/50 p-6 space-y-6">
        {/* Create Trip Button */}
        <Button onClick={() => setShowCreateModal(true)} className="w-full bg-primary hover:bg-primary/90">
          <Plus className="h-4 w-4 mr-2" />
          Tạo Chuyến Đi Mới
        </Button>

        {/* Navigation */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Điều hướng</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {navigationItems.map((item) => (
              <Link key={item.href} href={item.href}>
                <Button variant={item.active ? "default" : "ghost"} className="w-full justify-start" size="sm">
                  {item.icon}
                  <span className="ml-2">{item.label}</span>
                </Button>
              </Link>
            ))}
          </CardContent>
        </Card>

        {/* Quick Stats */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Thống Kê Nhanh</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {quickStats.map((stat, index) => (
              <div key={index} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {stat.icon}
                  <span className="text-sm text-muted-foreground">{stat.title}</span>
                </div>
                <span className={`font-semibold ${stat.color}`}>{stat.value}</span>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Hoạt Động Gần Đây</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-3 text-sm">
              <div className="w-2 h-2 bg-blue-500 rounded-full" />
              <span className="text-muted-foreground">Cập nhật lịch trình Đà Nẵng</span>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <div className="w-2 h-2 bg-green-500 rounded-full" />
              <span className="text-muted-foreground">Thêm chi phí khách sạn</span>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <div className="w-2 h-2 bg-orange-500 rounded-full" />
              <span className="text-muted-foreground">Mời thành viên mới</span>
            </div>
          </CardContent>
        </Card>

        {/* Public Feed Promotion */}
        <Card className="bg-gradient-to-br from-blue-50 to-cyan-50 border-blue-200">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Globe className="h-5 w-5 text-blue-600" />
              <span className="font-semibold text-blue-900">Khám phá cộng đồng</span>
            </div>
            <p className="text-sm text-blue-700 mb-3">Tìm cảm hứng từ hàng ngàn chuyến đi được chia sẻ</p>
            <Link href="/feed">
              <Button
                size="sm"
                variant="outline"
                className="w-full bg-white hover:bg-blue-50 text-blue-600 border-blue-200"
              >
                Xem Bản Tin
              </Button>
            </Link>
          </CardContent>
        </Card>
      </aside>

      {/* {showCreateModal && <CreateTripModal onClose={() => setShowCreateModal(false)} />} */}
    </>
  )
}
