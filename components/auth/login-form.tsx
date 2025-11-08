// "use client"

// import type React from "react"
// import { useState } from "react"
// import { Button } from "@/components/ui/button"
// import { Input } from "@/components/ui/input"
// import { Label } from "@/components/ui/label"
// import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
// import { X, Eye, EyeOff, Mail, Lock } from "lucide-react"
// import { useToast } from "@/hooks/use-toast"
// import Cookies from "js-cookie" // ✅ thêm thư viện cookie

// interface LoginFormProps {
//   onClose: () => void
// }

// export function LoginForm({ onClose }: LoginFormProps) {
//   const [email, setEmail] = useState("")
//   const [password, setPassword] = useState("")
//   const [showPassword, setShowPassword] = useState(false)
//   const [isLoading, setIsLoading] = useState(false)
//   const { toast } = useToast()

//   const handleSubmit = async (e: React.FormEvent) => {
//     e.preventDefault()
//     setIsLoading(true)

//     try {
//       const response = await fetch("https://travel-planner-imdw.onrender.com/api/taikhoan/dang-nhap", {
//         method: "POST",
//         headers: {
//           "Content-Type": "application/json",
//         },
//         body: JSON.stringify({
//           email: email,
//           mat_khau: password,
//         }),
//       })

//       const data = await response.json()

//       if (!response.ok) {
//         throw new Error(data.message || "Đăng nhập thất bại")
//       }

//       // ✅ Lưu token vào cookie
//       if (data.token) {
//         Cookies.set("token", data.token, { expires: 7, sameSite: "Lax", secure: true })
//         console.log("Đã lưu token:", data.token)
//       }

//       // ✅ (tuỳ chọn) Lưu thông tin người dùng vào localStorage
//       localStorage.setItem("travelplan_user", JSON.stringify(data))

//       toast({
//         title: "Đăng nhập thành công!",
//         description: `Chào mừng bạn trở lại TravelPlan`,
//       })

//       // ✅ Chuyển hướng sau khi đăng nhập
//       window.location.href = "/dashboard"
//     } catch (error: any) {
//       toast({
//         title: "Lỗi đăng nhập",
//         description: error.message || "Email hoặc mật khẩu không chính xác. Vui lòng thử lại.",
//         variant: "destructive",
//       })
//     } finally {
//       setIsLoading(false)
//     }
//   }

//   return (
//     <Card className="border-0 shadow-none">
//       <CardHeader className="relative">
//         <Button variant="ghost" size="icon" className="absolute right-2 top-2" onClick={onClose}>
//           <X className="h-4 w-4" />
//         </Button>
//         <CardTitle className="text-2xl font-[family-name:var(--font-space-grotesk)]">Đăng Nhập</CardTitle>
//         <CardDescription className="font-[family-name:var(--font-dm-sans)]">
//           Nhập thông tin để truy cập tài khoản của bạn
//         </CardDescription>
//       </CardHeader>
//       <CardContent>
//         <form onSubmit={handleSubmit} className="space-y-4">
//           <div className="space-y-2">
//             <Label htmlFor="email">Email</Label>
//             <div className="relative">
//               <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
//               <Input
//                 id="email"
//                 type="email"
//                 placeholder="your@email.com"
//                 value={email}
//                 onChange={(e) => setEmail(e.target.value)}
//                 className="pl-10"
//                 required
//               />
//             </div>
//           </div>

//           <div className="space-y-2">
//             <Label htmlFor="password">Mật khẩu</Label>
//             <div className="relative">
//               <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
//               <Input
//                 id="password"
//                 type={showPassword ? "text" : "password"}
//                 placeholder="••••••••"
//                 value={password}
//                 onChange={(e) => setPassword(e.target.value)}
//                 className="pl-10 pr-10"
//                 required
//               />
//               <Button
//                 type="button"
//                 variant="ghost"
//                 size="icon"
//                 className="absolute right-1 top-1 h-8 w-8"
//                 onClick={() => setShowPassword(!showPassword)}
//               >
//                 {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
//               </Button>
//             </div>
//           </div>

//           <Button type="submit" className="w-full bg-primary hover:bg-primary/90" disabled={isLoading}>
//             {isLoading ? "Đang đăng nhập..." : "Đăng Nhập"}
//           </Button>

//           <div className="text-center">
//             <Button variant="link" className="text-sm text-muted-foreground">
//               Quên mật khẩu?
//             </Button>
//           </div>
//         </form>
//       </CardContent>
//     </Card>
//   )
// }
"use client"

import type React from "react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { X, Eye, EyeOff, Mail, Lock } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import Cookies from "js-cookie"
import axios from "axios" // Import Axios

interface LoginFormProps {
  onClose: () => void
}

export function LoginForm({ onClose }: LoginFormProps) {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [formMode, setFormMode] = useState<"login" | "forgotPassword" | "verifyOtp">("login")
  const [otp, setOtp] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const { toast } = useToast()

  // Original login submit handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const response = await fetch("https://travel-planner-imdw.onrender.com/api/taikhoan/dang-nhap", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: email,
          mat_khau: password,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || "Đăng nhập thất bại")
      }

      if (data.token) {
        Cookies.set("token", data.token, { expires: 7, sameSite: "Lax", secure: true })
        console.log("Đã lưu token:", data.token)
      }

      localStorage.setItem("travelplan_user", JSON.stringify(data))

      toast({
        title: "Đăng nhập thành công!",
        description: `Chào mừng bạn trở lại TravelPlan`,
      })



      window.location.href = "/dashboard"
    } catch (error: any) {
      toast({
        title: "Lỗi đăng nhập",
        description: error.message || "Email hoặc mật khẩu không chính xác. Vui lòng thử lại.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Handler for sending OTP
  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const response = await axios.post("https://travel-planner-imdw.onrender.com/api/taikhoan/quen-mat-khau", {
        email,
      })

      toast({
        title: "OTP đã được gửi",
        description: "Vui lòng kiểm tra email của bạn để lấy mã OTP.",
      })

      setFormMode("verifyOtp")
    } catch (error: any) {
      toast({
        title: "Lỗi",
        description: error.response?.data?.message || "Không thể gửi OTP. Vui lòng thử lại.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Handler for OTP verification and new password submission
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validate password match
    if (newPassword !== confirmPassword) {
      toast({
        title: "Lỗi",
        description: "Mật khẩu mới và mật khẩu xác nhận không khớp. Vui lòng kiểm tra lại.",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)

    try {
      const response = await axios.post("https://travel-planner-imdw.onrender.com/api/taikhoan/xac-nhan-otp", {
        email,
        otp,
        mat_khau_moi: newPassword,
      })

      toast({
        title: "Đặt lại mật khẩu thành công",
        description: "Mật khẩu của bạn đã được cập nhật. Vui lòng đăng nhập lại.",
      })

      setFormMode("login")
      setEmail("")
      setOtp("")
      setNewPassword("")
      setConfirmPassword("")
    } catch (error: any) {
      toast({
        title: "Lỗi",
        description: error.response?.data?.message || "Mã OTP không hợp lệ hoặc đã hết hạn.",
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
        <CardTitle className="text-2xl font-[family-name:var(--font-space-grotesk)]">
          {formMode === "login" ? "Đăng Nhập" : formMode === "forgotPassword" ? "Quên Mật Khẩu" : "Xác Nhận OTP"}
        </CardTitle>
        <CardDescription className="font-[family-name:var(--font-dm-sans)]">
          {formMode === "login"
            ? "Nhập thông tin để truy cập tài khoản của bạn"
            : formMode === "forgotPassword"
            ? "Nhập email để nhận mã OTP"
            : "Nhập mã OTP và mật khẩu mới"}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {formMode === "login" && (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="your@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Mật khẩu</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Nhập mật khẩu"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 pr-10 placeholder:text-gray-400" // 👈 thêm dòng này"
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

            <Button type="submit" className="w-full bg-primary hover:bg-primary/90" disabled={isLoading}>
              {isLoading ? "Đang đăng nhập..." : "Đăng Nhập"}
            </Button>

            <div className="text-center">
              <Button
                variant="link"
                className="text-sm text-muted-foreground"
                onClick={() => setFormMode("forgotPassword")}
              >
                Quên mật khẩu?
              </Button>
            </div>
          </form>
        )}

        {formMode === "forgotPassword" && (
          <form onSubmit={handleForgotPassword} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="your@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10"
                  required
                />
              </div>
            </div>
            <Button type="submit" className="w-full bg-primary hover:bg-primary/90" disabled={isLoading}>
              {isLoading ? "Đang gửi..." : "Gửi OTP"}
            </Button>
            <div className="text-center">
              <Button
                variant="link"
                className="text-sm text-muted-foreground"
                onClick={() => setFormMode("login")}
              >
                Quay lại đăng nhập
              </Button>
            </div>
          </form>
        )}

        {formMode === "verifyOtp" && (
          <form onSubmit={handleResetPassword} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="your@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10"
                  required
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="otp">Mã OTP</Label>
              <div className="relative">
                <Input
                  id="otp"
                  type="text"
                  placeholder="Nhập mã OTP"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  className="pl-4"
                  required
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="newPassword">Mật khẩu mới</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="newPassword"
                  type={showNewPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="pl-10 pr-10"
                  required
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-1 top-1 h-8 w-8"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                >
                  {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Nhập lại mật khẩu</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="pl-10 pr-10"
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
              {isLoading ? "Đang xử lý..." : "Đặt lại mật khẩu"}
            </Button>
            <div className="text-center">
              <Button
                variant="link"
                className="text-sm text-muted-foreground"
                onClick={() => setFormMode("login")}
              >
                Quay lại đăng nhập
              </Button>
            </div>
          </form>
        )}
      </CardContent>
    </Card>
  )
}

