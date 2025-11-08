"use client"

import type React from "react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { X, Eye, EyeOff, User, Mail, Lock, Phone } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface RegisterFormProps {
  onClose: () => void
}

export function RegisterForm({ onClose }: RegisterFormProps) {
  const [formData, setFormData] = useState({
    ho_ten: "",
    email: "",
    mat_khau: "",
    xacNhanMatKhau: "",
    so_dien_thoai: "",
  })
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (formData.mat_khau !== formData.xacNhanMatKhau) {
      toast({
        title: "Lỗi xác nhận mật khẩu",
        description: "Mật khẩu xác nhận không khớp",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)

    try {
      // Gửi dữ liệu đúng với định dạng API yêu cầu
      const response = await fetch("https://travel-planner-imdw.onrender.com/api/taikhoan/dang-ky", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ho_ten: formData.ho_ten,
          email: formData.email,
          mat_khau: formData.mat_khau,
          so_dien_thoai: formData.so_dien_thoai,
        }),
      })

      if (!response.ok) throw new Error("Đăng ký thất bại")

      toast({
        title: "Đăng ký thành công!",
        description: "Tài khoản của bạn đã được tạo. Vui lòng đăng nhập.",
      })

      onClose()
    } catch (error) {
      toast({
        title: "Lỗi đăng ký",
        description: "Có lỗi xảy ra khi tạo tài khoản",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className="border-0 shadow-none">
      <CardHeader className="relative">
        <Button variant="ghost" size="icon" className="absolute right-2 top-2" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
        <CardTitle className="text-2xl font-[family-name:var(--font-space-grotesk)]">Đăng Ký</CardTitle>
        <CardDescription className="font-[family-name:var(--font-dm-sans)]">
          Tạo tài khoản mới để bắt đầu lập kế hoạch du lịch
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Họ tên */}
          <div className="space-y-2">
            <Label htmlFor="ho_ten">Họ và tên</Label>
            <div className="relative">
              <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="ho_ten"
                type="text"
                placeholder="Nguyễn Văn A"
                value={formData.ho_ten}
                onChange={(e) => handleChange("ho_ten", e.target.value)}
                className="pl-10 pr-10 placeholder:text-gray-400" // 👈 thêm dòng này
                required
              />
            </div>
          </div>

          {/* Email */}
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="email"
                type="email"
                placeholder="your@email.com"
                value={formData.email}
                onChange={(e) => handleChange("email", e.target.value)}
                className="pl-10 pr-10 placeholder:text-gray-400" // 👈 thêm dòng này
                required
              />
            </div>
          </div>

          {/* Số điện thoại */}
          <div className="space-y-2">
            <Label htmlFor="so_dien_thoai">Số điện thoại</Label>
            <div className="relative">
              <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="so_dien_thoai"
                type="tel"
                placeholder="0123 456 789"
                value={formData.so_dien_thoai}
                onChange={(e) => handleChange("so_dien_thoai", e.target.value)}
                className="pl-10 pr-10 placeholder:text-gray-400" // 👈 thêm dòng này
                required
              />
            </div>
          </div>

          {/* Mật khẩu */}
          <div className="space-y-2">
            <Label htmlFor="mat_khau">Mật khẩu</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="mat_khau"
                type={showPassword ? "text" : "password"}
                placeholder="Nhập mật khẩu với 7 chữ số..."
                value={formData.mat_khau}
                onChange={(e) => handleChange("mat_khau", e.target.value)}
                className="pl-10 pr-10 placeholder:text-gray-400" // 👈 thêm dòng này
                required
              />

              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute right-1 top-1 h-8 w-8"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
            </div>
          </div>

          {/* Xác nhận mật khẩu */}
          <div className="space-y-2">
            <Label htmlFor="xacNhanMatKhau">Xác nhận mật khẩu</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="xacNhanMatKhau"
                type={showConfirmPassword ? "text" : "password"}
                placeholder="Nhập lại mật khẩu..."
                value={formData.xacNhanMatKhau}
                onChange={(e) => handleChange("xacNhanMatKhau", e.target.value)}
                className="pl-10 pr-10 placeholder:text-gray-400" // 👈 thêm dòng này
                required
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute right-1 top-1 h-8 w-8"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              >
                {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
            </div>
          </div>

          <Button type="submit" className="w-full bg-primary hover:bg-primary/90" disabled={isLoading}>
            {isLoading ? "Đang tạo tài khoản..." : "Đăng Ký"}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
