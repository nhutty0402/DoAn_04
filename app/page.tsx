"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Plane, MapPin, Users, Calculator, MessageCircle, Globe, Eye } from "lucide-react"
import { LoginForm } from "@/components/auth/login-form"
import { RegisterForm } from "@/components/auth/register-form"
import { motion } from "framer-motion"
import Link from "next/link"

export default function HomePage() {
  const [showLogin, setShowLogin] = useState(false)
  const [showRegister, setShowRegister] = useState(false)

  const features = [
    {
      icon: <MapPin className="h-8 w-8 text-primary" />,
      title: "Lập Kế Hoạch Hành Trình",
      description: "Tạo lịch trình chi tiết với Google Maps và dự báo thời tiết",
    },
    {
      icon: <Calculator className="h-8 w-8 text-primary" />,
      title: "Quản Lý Chi Phí",
      description: "Chia sẻ và theo dõi chi phí một cách thông minh",
    },
    {
      icon: <Users className="h-8 w-8 text-primary" />,
      title: "Cộng Tác Nhóm",
      description: "Mời bạn bè và lập kế hoạch cùng nhau",
    },
    {
      icon: <MessageCircle className="h-8 w-8 text-primary" />,
      title: "Chat Thời Gian Thực",
      description: "Trò chuyện và thảo luận kế hoạch trực tiếp",
    },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-secondary/20 to-accent/30">
      {/* Header */}
      <header className="border-b border-border/50 backdrop-blur-sm bg-background/80">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Plane className="h-8 w-8 text-primary" />
            <h1 className="text-2xl font-bold text-foreground font-[family-name:var(--font-space-grotesk)]">
              TravelPlan
            </h1>
          </div>
          <div className="flex items-center space-x-4">
            <Link href="/feed">
              <Button variant="ghost" className="hover:bg-primary/10 flex items-center gap-2">
                <Globe className="h-4 w-4" />
                <span className="hidden sm:inline">Khám phá</span>
              </Button>
            </Link>
            <Button variant="ghost" onClick={() => setShowLogin(true)} className="hover:bg-primary/10">
              Đăng Nhập
            </Button>
            <Button onClick={() => setShowRegister(true)} className="bg-primary hover:bg-primary/90">
              Đăng Ký
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <h2 className="text-5xl font-bold text-foreground mb-6 font-[family-name:var(--font-space-grotesk)]">
              Lập Kế Hoạch Du Lịch
              <span className="text-primary"> Hoàn Hảo</span>
            </h2>
            <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto font-[family-name:var(--font-dm-sans)]">
              Quản lý hành trình, chia sẻ chi phí, và cộng tác với bạn bè trong một ứng dụng duy nhất
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Button
                size="lg"
                onClick={() => setShowRegister(true)}
                className="bg-primary hover:bg-primary/90 text-lg px-8 py-3"
              >
                Bắt Đầu Miễn Phí
              </Button>
              <Link href="/feed">
                <Button
                  size="lg"
                  variant="outline"
                  className="text-lg px-8 py-3 bg-transparent border-primary text-primary hover:bg-primary/10 flex items-center gap-2"
                >
                  <Eye className="h-5 w-5" />
                  Khám Phá Chuyến Đi
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 px-4">
        <div className="container mx-auto">
          <h3 className="text-3xl font-bold text-center text-foreground mb-12 font-[family-name:var(--font-space-grotesk)]">
            Tính Năng Nổi Bật
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
              >
                <Card className="h-full hover:shadow-lg transition-shadow duration-300 border-border/50">
                  <CardHeader className="text-center">
                    <div className="mx-auto mb-4 p-3 bg-primary/10 rounded-full w-fit">{feature.icon}</div>
                    <CardTitle className="font-[family-name:var(--font-space-grotesk)]">{feature.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="text-center font-[family-name:var(--font-dm-sans)]">
                      {feature.description}
                    </CardDescription>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 px-4 bg-gradient-to-r from-blue-50 to-cyan-50">
        <div className="container mx-auto text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <Globe className="h-16 w-16 text-primary mx-auto mb-6" />
            <h3 className="text-3xl font-bold text-foreground mb-4 font-[family-name:var(--font-space-grotesk)]">
              Khám Phá Chuyến Đi Từ Cộng Đồng
            </h3>
            <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto font-[family-name:var(--font-dm-sans)]">
              Tìm cảm hứng từ hàng ngàn chuyến đi được chia sẻ bởi cộng đồng du lịch Việt Nam
            </p>
            <Link href="/feed">
              <Button size="lg" variant="outline" className="bg-white hover:bg-gray-50 text-primary border-primary">
                <Eye className="h-5 w-5 mr-2" />
                Xem Bản Tin Công Khai
              </Button>
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Login Modal */}
      {showLogin && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-card rounded-lg shadow-xl max-w-md w-full"
          >
            <LoginForm onClose={() => setShowLogin(false)} />
          </motion.div>
        </div>
      )}

      {/* Register Modal */}
      {showRegister && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-card rounded-lg shadow-xl max-w-md w-full"
          >
            <RegisterForm onClose={() => setShowRegister(false)} />
          </motion.div>
        </div>
      )}
    </div>
  )
}
