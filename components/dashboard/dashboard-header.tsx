"use client"
import { Lock } from "lucide-react";
import { useState, useEffect, useRef } from "react"
import axios from "axios"
import Cookies from "js-cookie"
import { useRouter, usePathname } from "next/navigation"
import Link from "next/link"
import { NotificationCenter } from "@/components/notifications/notification-center"
// bạn bè
import { FriendsModal } from "@/components/friends/friends-modal"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Bell, Settings, LogOut, Plane, Globe, Home, Users, User, Upload, ImageIcon, Eye, EyeOff } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useToast } from "@/hooks/use-toast"



export function DashboardHeader() {
  const [showNotifications, setShowNotifications] = useState(false)
  const [showFriends, setShowFriends] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showAvatarModal, setShowAvatarModal] = useState(false)
  const [showChangePasswordModal, setShowChangePasswordModal] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)
  const [isUpdating, setIsUpdating] = useState(false)
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false)
  const [isChangingPassword, setIsChangingPassword] = useState(false)
  const [selectedAvatarFile, setSelectedAvatarFile] = useState<File | null>(null)
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)
  const [matKhauCu, setMatKhauCu] = useState("")
  const [matKhauMoi, setMatKhauMoi] = useState("")
  const [showMatKhauCu, setShowMatKhauCu] = useState(false)
  const [showMatKhauMoi, setShowMatKhauMoi] = useState(false)
  const avatarInputRef = useRef<HTMLInputElement>(null)
  const pathname = usePathname()
  const router = useRouter()
  const { toast } = useToast()

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

        // ✅ Backend trả về: { message: '...', user: { nguoi_dung_id, ho_ten, email, so_dien_thoai, avatar_url, tao_luc } }
        const userData = res.data?.user || res.data || {}

        // ✅ Cập nhật state người dùng
        setUser({
          nguoi_dung_id: String(userData.nguoi_dung_id || ""),
          ho_ten: userData.ho_ten || "",
          email: userData.email || "",
          so_dien_thoai: userData.so_dien_thoai || "",
          avatar_url: userData.avatar_url && userData.avatar_url !== "null" ? userData.avatar_url : "/placeholder.svg",
          tao_luc: userData.tao_luc || "",
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

  // ✅ Hàm fetch số thông báo chưa đọc
  const fetchUnreadCount = async () => {
    const token = Cookies.get("token")

    if (!token || token === "null" || token === "undefined") {
      return
    }

    try {
      const response = await axios.get("https://travel-planner-imdw.onrender.com/api/thong-bao", {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      })

      // Backend trả về: { message, tong_so, chua_doc, danh_sach: [...] }
      const chuaDoc = response.data?.chua_doc || 0
      setUnreadCount(chuaDoc)
    } catch (error: any) {
      console.error("❌ Lỗi khi đếm thông báo chưa đọc:", error)
      // Không cần xử lý lỗi quá chi tiết ở đây, chỉ set về 0
      setUnreadCount(0)
    }
  }

  // ✅ Gọi API đếm số thông báo chưa đọc khi component mount
  useEffect(() => {
    fetchUnreadCount()
  }, [])

  // ✅ Refresh số đếm khi đóng modal notification (để cập nhật sau khi đánh dấu đã đọc)
  useEffect(() => {
    if (!showNotifications) {
      // Delay một chút để đảm bảo API đã cập nhật
      const timer = setTimeout(() => {
        fetchUnreadCount()
      }, 500)
      return () => clearTimeout(timer)
    }
  }, [showNotifications])

  // ✅ Hàm xử lý chọn ảnh đại diện
  const handleAvatarSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      // Validate file type
      if (!file.type.startsWith("image/")) {
        toast({
          title: "Lỗi",
          description: "Vui lòng chọn file ảnh hợp lệ",
          variant: "destructive",
        })
        return
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "Lỗi",
          description: "Kích thước ảnh không được vượt quá 5MB",
          variant: "destructive",
        })
        return
      }

      setSelectedAvatarFile(file)

      // Create preview
      const reader = new FileReader()
      reader.onload = (e) => {
        setAvatarPreview(e.target?.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  // ✅ Hàm upload ảnh đại diện
  const handleUploadAvatar = async () => {
    if (!selectedAvatarFile) {
      toast({
        title: "Lỗi",
        description: "Vui lòng chọn ảnh đại diện",
        variant: "destructive",
      })
      return
    }

    setIsUploadingAvatar(true)
    const token = Cookies.get("token")

    if (!token || token === "null" || token === "undefined") {
      toast({
        title: "Lỗi",
        description: "Phiên đăng nhập đã hết hạn",
        variant: "destructive",
      })
      router.replace("/login")
      return
    }

    try {
      const formData = new FormData()
      formData.append("avatar", selectedAvatarFile)

      const response = await axios.put(
        "https://travel-planner-imdw.onrender.com/api/nguoi-dung/avatar",
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data",
          },
        }
      )

      const newAvatarUrl = response.data?.avatar_url || ""

      // Cập nhật lại state user
      setUser((prev) => ({
        ...prev,
        avatar_url: newAvatarUrl || "/placeholder.svg",
      }))

      toast({
        title: "Thành công",
        description: response.data?.message || "Cập nhật ảnh đại diện thành công",
      })

      setShowAvatarModal(false)
      setSelectedAvatarFile(null)
      setAvatarPreview(null)
      if (avatarInputRef.current) {
        avatarInputRef.current.value = ""
      }

      // Refresh lại thông tin người dùng
      const fetchUserInfo = async () => {
        try {
          const res = await axios.get("https://travel-planner-imdw.onrender.com/api/taikhoan/toi", {
            headers: {
              Authorization: `Bearer ${token}`,
              "Cache-Control": "no-cache",
              "Pragma": "no-cache",
            },
            params: {
              _t: Date.now(),
            },
          })

          const userData = res.data?.user || res.data || {}
          setUser({
            nguoi_dung_id: String(userData.nguoi_dung_id || ""),
            ho_ten: userData.ho_ten || "",
            email: userData.email || "",
            so_dien_thoai: userData.so_dien_thoai || "",
            avatar_url: userData.avatar_url && userData.avatar_url !== "null" ? userData.avatar_url : "/placeholder.svg",
            tao_luc: userData.tao_luc || "",
          })
        } catch (error) {
          console.error("Lỗi khi refresh thông tin:", error)
        }
      }

      fetchUserInfo()
    } catch (error: any) {
      console.error("❌ Lỗi khi upload ảnh đại diện:", error)
      toast({
        title: "Lỗi",
        description: error.response?.data?.message || error.message || "Không thể cập nhật ảnh đại diện",
        variant: "destructive",
      })
    } finally {
      setIsUploadingAvatar(false)
    }
  }

  // ✅ Hàm đổi mật khẩu
  const handleChangePassword = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsChangingPassword(true)

    const token = Cookies.get("token")
    if (!token || token === "null" || token === "undefined") {
      toast({
        title: "Lỗi",
        description: "Phiên đăng nhập đã hết hạn",
        variant: "destructive",
      })
      router.replace("/login")
      return
    }

    // Validate
    if (!matKhauCu || !matKhauMoi) {
      toast({
        title: "Lỗi",
        description: "Vui lòng nhập đầy đủ mật khẩu cũ và mật khẩu mới",
        variant: "destructive",
      })
      setIsChangingPassword(false)
      return
    }

    if (matKhauMoi.length < 6) {
      toast({
        title: "Lỗi",
        description: "Mật khẩu mới phải có ít nhất 6 ký tự",
        variant: "destructive",
      })
      setIsChangingPassword(false)
      return
    }

    if (matKhauMoi === matKhauCu) {
      toast({
        title: "Lỗi",
        description: "Mật khẩu mới không được trùng với mật khẩu cũ",
        variant: "destructive",
      })
      setIsChangingPassword(false)
      return
    }

    try {
      const response = await axios.put(
        "https://travel-planner-imdw.onrender.com/api/taikhoan/doi-mat-khau",
        {
          mat_khau_cu: matKhauCu,
          mat_khau_moi: matKhauMoi,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      )

      toast({
        title: "Thành công",
        description: response.data?.message || "Đổi mật khẩu thành công và đã gửi thông báo.",
      })

      // Reset form
      setMatKhauCu("")
      setMatKhauMoi("")
      setShowChangePasswordModal(false)
    } catch (error: any) {
      console.error("❌ Lỗi khi đổi mật khẩu:", error)
      toast({
        title: "Lỗi",
        description: error.response?.data?.message || error.message || "Không thể đổi mật khẩu",
        variant: "destructive",
      })
    } finally {
      setIsChangingPassword(false)
    }
  }

  // ✅ Hàm cập nhật thông tin người dùng
  const handleUpdateUser = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsUpdating(true)

    const token = Cookies.get("token")
    if (!token || token === "null" || token === "undefined") {
      toast({
        title: "Lỗi",
        description: "Phiên đăng nhập đã hết hạn",
        variant: "destructive",
      })
      router.replace("/login")
      return
    }

    try {
      const formData = new FormData(e.currentTarget)
      const updateData = {
        ho_ten: formData.get("ho_ten") as string,
        email: formData.get("email") as string,
        so_dien_thoai: formData.get("so_dien_thoai") as string,
      }

      await axios.put(
        "https://travel-planner-imdw.onrender.com/api/nguoi-dung/cap-nhat",
        updateData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      )

      toast({
        title: "Thành công",
        description: "Cập nhật thông tin thành công",
      })

      setShowEditModal(false)

      // Refresh lại thông tin người dùng để đồng bộ với server
      const fetchUserInfo = async () => {
        try {
          const res = await axios.get("https://travel-planner-imdw.onrender.com/api/taikhoan/toi", {
            headers: {
              Authorization: `Bearer ${token}`,
              "Cache-Control": "no-cache",
              "Pragma": "no-cache",
            },
            params: {
              _t: Date.now(),
            },
          })

          const userData = res.data?.user || res.data || {}
          setUser({
            nguoi_dung_id: String(userData.nguoi_dung_id || ""),
            ho_ten: userData.ho_ten || "",
            email: userData.email || "",
            so_dien_thoai: userData.so_dien_thoai || "",
            avatar_url: userData.avatar_url && userData.avatar_url !== "null" ? userData.avatar_url : "/placeholder.svg",
            tao_luc: userData.tao_luc || "",
          })
        } catch (error) {
          console.error("Lỗi khi refresh thông tin:", error)
        }
      }

      fetchUserInfo()
    } catch (error: any) {
      console.error("❌ Lỗi khi cập nhật thông tin:", error)
      toast({
        title: "Lỗi",
        description: error.response?.data?.message || error.message || "Không thể cập nhật thông tin",
        variant: "destructive",
      })
    } finally {
      setIsUpdating(false)
    }
  }

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
              VN-Travel
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

                <DropdownMenuItem onClick={() => setShowEditModal(true)}>
                  <User className="mr-2 h-4 w-4" />
                  <span>Cập nhật thông tin</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setShowChangePasswordModal(true)}>
                  <Lock className="mr-2 h-4 w-4" />
                  <span>Đổi mật khẩu</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setShowAvatarModal(true)}>
                  <Upload className="mr-2 h-4 w-4" />
                  <span>Cập nhật ảnh đại diện</span>
                </DropdownMenuItem>
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

      {/* Modal cập nhật thông tin người dùng */}
      <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Cập nhật thông tin</DialogTitle>
            <DialogDescription>Chỉnh sửa thông tin cá nhân của bạn. Nhấn lưu khi hoàn tất.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleUpdateUser}>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="ho_ten">Họ và tên</Label>
                <Input
                  id="ho_ten"
                  name="ho_ten"
                  defaultValue={user.ho_ten}
                  placeholder="Nhập họ và tên"
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  defaultValue={user.email}
                  placeholder="Nhập email"
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="so_dien_thoai">Số điện thoại</Label>
                <Input
                  id="so_dien_thoai"
                  name="so_dien_thoai"
                  type="tel"
                  defaultValue={user.so_dien_thoai}
                  placeholder="Nhập số điện thoại"
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowEditModal(false)} disabled={isUpdating}>
                Hủy
              </Button>
              <Button type="submit" disabled={isUpdating}>
                {isUpdating ? "Đang cập nhật..." : "Lưu thay đổi"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Modal cập nhật ảnh đại diện */}
      <Dialog open={showAvatarModal} onOpenChange={setShowAvatarModal}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Cập nhật ảnh đại diện</DialogTitle>
            <DialogDescription>Chọn ảnh đại diện mới cho tài khoản của bạn. (Tối đa 5MB)</DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            {/* Preview avatar */}
            <div className="flex flex-col items-center gap-4">
              <div className="relative">
                <Avatar className="h-32 w-32">
                  <AvatarImage src={avatarPreview || user.avatar_url} alt={user.ho_ten} />
                  <AvatarFallback className="bg-primary text-primary-foreground text-2xl">
                    {user.ho_ten ? user.ho_ten.slice(0, 2).toUpperCase() : "US"}
                  </AvatarFallback>
                </Avatar>
              </div>

              <input
                ref={avatarInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleAvatarSelect}
              />

              <Button
                type="button"
                variant="outline"
                onClick={() => avatarInputRef.current?.click()}
                className="w-full"
              >
                <ImageIcon className="mr-2 h-4 w-4" />
                {selectedAvatarFile ? "Chọn ảnh khác" : "Chọn ảnh"}
              </Button>

              {selectedAvatarFile && (
                <p className="text-sm text-muted-foreground text-center">
                  Đã chọn: {selectedAvatarFile.name}
                  <br />
                  Kích thước: {(selectedAvatarFile.size / 1024).toFixed(2)} KB
                </p>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setShowAvatarModal(false)
                setSelectedAvatarFile(null)
                setAvatarPreview(null)
                if (avatarInputRef.current) {
                  avatarInputRef.current.value = ""
                }
              }}
              disabled={isUploadingAvatar}
            >
              Hủy
            </Button>
            <Button
              type="button"
              onClick={handleUploadAvatar}
              disabled={!selectedAvatarFile || isUploadingAvatar}
            >
              {isUploadingAvatar ? "Đang tải lên..." : "Lưu ảnh đại diện"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal đổi mật khẩu */}
      <Dialog open={showChangePasswordModal} onOpenChange={setShowChangePasswordModal}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Đổi mật khẩu</DialogTitle>
            <DialogDescription>
              Nhập mật khẩu cũ và mật khẩu mới của bạn. Mật khẩu mới phải có ít nhất 6 ký tự.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleChangePassword}>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="mat_khau_cu">Mật khẩu cũ</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="mat_khau_cu"
                    type={showMatKhauCu ? "text" : "password"}
                    placeholder="Nhập mật khẩu cũ"
                    value={matKhauCu}
                    onChange={(e) => setMatKhauCu(e.target.value)}
                    className="pl-10 pr-10"
                    required
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-1 top-1 h-8 w-8"
                    onClick={() => setShowMatKhauCu(!showMatKhauCu)}
                  >
                    {showMatKhauCu ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="mat_khau_moi">Mật khẩu mới</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="mat_khau_moi"
                    type={showMatKhauMoi ? "text" : "password"}
                    placeholder="Nhập mật khẩu mới (tối thiểu 6 ký tự)"
                    value={matKhauMoi}
                    onChange={(e) => setMatKhauMoi(e.target.value)}
                    className="pl-10 pr-10"
                    required
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-1 top-1 h-8 w-8"
                    onClick={() => setShowMatKhauMoi(!showMatKhauMoi)}
                  >
                    {showMatKhauMoi ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setShowChangePasswordModal(false)
                  setMatKhauCu("")
                  setMatKhauMoi("")
                }}
                disabled={isChangingPassword}
              >
                Hủy
              </Button>
              <Button type="submit" disabled={isChangingPassword}>
                {isChangingPassword ? "Đang đổi mật khẩu..." : "Đổi mật khẩu"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}
