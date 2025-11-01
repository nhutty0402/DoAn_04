"use client"

import { useState, useEffect } from "react"
import axios from "axios"
import Cookies from "js-cookie"
import { useRouter, usePathname } from "next/navigation"
import Link from "next/link"
import { NotificationCenter } from "@/components/notifications/notification-center"
// bạn bè
import { FriendsModal } from "@/components/friends/friends-modal"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Bell, Settings, LogOut, Plane, Globe, Home, Users } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"



export function DashboardHeader() {
  const [showNotifications, setShowNotifications] = useState(false)
  const [showFriends, setShowFriends] = useState(false)
  const pathname = usePathname()
  const router = useRouter()
  const unreadCount = 3

  // ✅ Khai báo interface và state người dùng
  interface User {
    nguoi_dung_id: string
    ho_ten: string
    email: string
    so_dien_thoai: string
    avatar_url: string
    tao_luc: string
  }

  const [user, setUser] = useState<User>({
    nguoi_dung_id: "",
    ho_ten: "",
    email: "",
    so_dien_thoai: "",
    avatar_url: "",
    tao_luc: "",
  })

  const [loading, setLoading] = useState(true)

  // ✅ Gọi API lấy thông tin người dùng
  useEffect(() => {
    const fetchUserInfo = async () => {
      // ✅ Lấy token từ cookie
      const token = Cookies.get("token")
      console.log("Token từ cookie:", token)

      // ✅ Nếu không có token → quay về /login
      if (!token || token === "null" || token === "undefined") {
        console.warn("Không có token → chuyển về /login")
        router.replace("/login")
        return
      }

      try {
        // ✅ Call API lấy thông tin người dùng với cache control
        const res = await axios.get("https://travel-planner-imdw.onrender.com/api/taikhoan/toi", {
          headers: {
            Authorization: `Bearer ${token}`,
            "Cache-Control": "no-cache",
            "Pragma": "no-cache",
          },
          // Thêm timestamp để tránh cache
          params: {
            _t: Date.now(),
          },
        })

        console.log("API Response:", res.data)

        // ✅ Cập nhật state người dùng
        setUser({
          nguoi_dung_id: res.data.nguoi_dung_id || "",
          ho_ten: res.data.ho_ten || "",
          email: res.data.email || "",
          so_dien_thoai: res.data.so_dien_thoai || "",
          avatar_url: res.data.avatar_url || "/placeholder.svg",
          tao_luc: res.data.tao_luc || "",
        })
      } catch (error: any) {
        console.error("Lỗi khi lấy thông tin người dùng:", error)
        
        // Kiểm tra loại lỗi
        if (axios.isAxiosError(error)) {
          if (error.response?.status === 401) {
            console.warn("Token không hợp lệ → chuyển về /login")
            router.replace("/login")
          } else if (error.response?.status === 304) {
            console.warn("Lỗi 304 - Cache issue, thử lại...")
            // Có thể thử lại request hoặc sử dụng cached data
          } else {
            console.error(`API Error ${error.response?.status}: ${error.response?.statusText}`)
          }
        } else {
          console.error("Unknown error:", error)
        }
        
        router.replace("/login") // fallback → quay lại login
      } finally {
        setLoading(false)
      }
    }

    fetchUserInfo()
  }, [router])

  if (loading) {
    return (
      <header className="border-b border-border/50 bg-background/80 sticky top-0 z-40 p-4 text-center text-muted-foreground">
        Đang tải thông tin người dùng...
      </header>
    )
  }

  return (
    <>
      <header className="border-b border-border/50 backdrop-blur-sm bg-background/80 sticky top-0 z-40">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          {/* Logo và Menu chính */}
          <div className="flex items-center space-x-6">
            <Link href="/dashboard" className="flex items-center space-x-2">
              <Plane className="h-8 w-8 text-primary" />
              <h1 className="text-2xl font-bold text-foreground font-[family-name:var(--font-space-grotesk)]">
                TravelPlan
              </h1>
            </Link>

            <nav className="hidden md:flex items-center space-x-1">
              <Link href="/dashboard">
                <Button
                  variant={pathname === "/dashboard" ? "default" : "ghost"}
                  size="sm"
                  className="flex items-center gap-2"
                >
                  <Home className="h-4 w-4" />
                  Trang Chủ
                </Button>
              </Link>
              <Link href="/feed">
                <Button
                  variant={pathname.startsWith("/feed") ? "default" : "ghost"}
                  size="sm"
                  className="flex items-center gap-2"
                >
                  <Globe className="h-4 w-4" />
                  Bản Tin
                </Button>
              </Link>
            </nav>
          </div>

          {/* Góc phải: Bạn bè + Thông báo + Tài khoản */}
          <div className="flex items-center space-x-4">
            {/* Nút bạn bè */}
            <Button variant="ghost" size="icon" className="relative" onClick={() => setShowFriends(true)}>
              <Users className="h-5 w-5" />
            </Button>

            {/* Nút chuông thông báo */}
            <Button variant="ghost" size="icon" className="relative" onClick={() => setShowNotifications(true)}>
              <Bell className="h-5 w-5" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 h-5 w-5 bg-destructive rounded-full text-xs flex items-center justify-center text-white font-medium">
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              )}
            </Button>

            {/*  Thông tin người dùng */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={user.avatar_url} alt={user.ho_ten} />
                    <AvatarFallback className="bg-primary text-primary-foreground">
                      {user.ho_ten ? user.ho_ten.slice(0, 2).toUpperCase() : "US"}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>

              <DropdownMenuContent className="w-56" align="end" forceMount>
                <div className="flex flex-col space-y-1 p-2">
                  <p className="text-sm font-medium leading-none">{user.ho_ten}</p>
                  <p className="text-xs leading-none text-muted-foreground">{user.email}</p>
                  {user.so_dien_thoai && (
                    <p className="text-xs leading-none text-muted-foreground">📞 {user.so_dien_thoai}</p>
                  )}
                  {user.tao_luc && (
                    <p className="text-xs leading-none text-muted-foreground">
                      ⏰ Tạo ngày: {new Date(user.tao_luc).toLocaleDateString("vi-VN")}
                    </p>
                  )}
                </div>
                <DropdownMenuSeparator />

                <DropdownMenuItem
                  className="text-destructive"
                  onClick={() => {
                    Cookies.remove("token")
                    router.replace("/login")
                  }}
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Đăng xuất</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      {/* Trung tâm thông báo */}
      <NotificationCenter isOpen={showNotifications} onClose={() => setShowNotifications(false)} />
      
      {/* Modal quản lý bạn bè */}
      <FriendsModal isOpen={showFriends} onClose={() => setShowFriends(false)} />
    </>
  )
}
