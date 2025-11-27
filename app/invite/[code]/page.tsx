"use client"

import { useEffect, useMemo, useState } from "react"
import axios from "axios"
import Cookies from "js-cookie"
import Link from "next/link"
import { CalendarDays, Clock, Users } from "lucide-react"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

interface PreviewMember {
  ho_ten?: string
  avatar_url?: string
}

interface PreviewTrip {
  message?: string
  chuyen_di_id?: string | number
  ten_chuyen_di?: string
  ngay_tao?: string
  ngay_bat_dau?: string
  ngay_ket_thuc?: string
  so_luong_thanh_vien?: number
  thanh_vien?: PreviewMember[]
}

interface InvitePreviewPageProps {
  params: {
    code: string
  }
}

const formatDate = (value?: string, options?: Intl.DateTimeFormatOptions) => {
  if (!value) return "-"
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleDateString("vi-VN", options)
}

export default function InvitePreviewPage({ params }: InvitePreviewPageProps) {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [tripInfo, setTripInfo] = useState<PreviewTrip | null>(null)

  const inviteCode = useMemo(() => decodeURIComponent(params.code || "").trim(), [params.code])

  useEffect(() => {
    if (!inviteCode) return

    const fetchPreview = async () => {
      setLoading(true)
      setError(null)
      setTripInfo(null)

      try {
        const token = Cookies.get("token")
        const headers: Record<string, string> = {}
        if (token && token !== "null" && token !== "undefined") {
          headers.Authorization = `Bearer ${token}`
        }

        const response = await axios.get<PreviewTrip>(
          `https://travel-planner-imdw.onrender.com/api/moi-thanh-vien/xem-truoc/${encodeURIComponent(inviteCode)}`,
          { headers },
        )
        setTripInfo(response.data)
      } catch (err: any) {
        const message = err?.response?.data?.message || err?.message || "Không thể tải thông tin chuyến đi"
        setError(message)
      } finally {
        setLoading(false)
      }
    }

    void fetchPreview()
  }, [inviteCode])

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-sky-50 py-16 px-4">
      <div className="mx-auto max-w-3xl space-y-6">
        <div className="text-center space-y-2">
          <p className="text-sm text-primary font-medium tracking-wide uppercase">Lời mời tham gia chuyến đi</p>
          <h1 className="text-3xl md:text-4xl font-bold text-foreground">Khám phá chuyến đi cùng bạn bè</h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Xem tổng quan chuyến đi mà bạn bè đã mời. Đăng nhập để tham gia và tận hưởng hành trình cùng mọi người.
          </p>
        </div>

        <Card className="shadow-xl border-primary/10">
          <CardHeader className="space-y-2 border-b bg-muted/30">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <CardTitle className="text-2xl font-semibold">
                {tripInfo?.ten_chuyen_di || (loading ? "Đang tải chuyến đi..." : "Chuyến đi chưa xác định")}
              </CardTitle>
              {/* <span className="text-xs font-medium text-primary bg-primary/10 px-3 py-1 rounded-full">
                Mã mời: {inviteCode || "---"}
              </span> */}
            </div>
            {tripInfo?.message && (
              <p className="text-sm text-muted-foreground">{tripInfo.message}</p>
            )}
          </CardHeader>
          <CardContent className="space-y-6 pt-6">
            {loading ? (
              <div className="space-y-3">
                <div className="h-8 w-2/3 bg-muted animate-pulse rounded" />
                <div className="h-4 w-full bg-muted animate-pulse rounded" />
                <div className="h-4 w-5/6 bg-muted animate-pulse rounded" />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[1, 2, 3, 4].map((idx) => (
                    <div key={idx} className="h-20 bg-muted animate-pulse rounded" />
                  ))}
                </div>
              </div>
            ) : error ? (
              <div className="p-6 bg-destructive/10 border border-destructive/20 rounded-lg text-center space-y-3">
                <h2 className="text-lg font-semibold text-destructive">Không thể hiển thị chuyến đi</h2>
                <p className="text-sm text-muted-foreground">{error}</p>
                <Button variant="outline" onClick={() => window.location.reload()}>
                  Thử lại
                </Button>
              </div>
            ) : tripInfo ? (
              <div className="space-y-6">
                <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-start gap-3 rounded-lg border bg-background p-4">
                    <CalendarDays className="h-10 w-10 text-primary" />
                    <div>
                      <p className="text-xs uppercase text-muted-foreground mb-1 tracking-wide">Thời gian</p>
                      <p className="text-sm font-medium">
                        {formatDate(tripInfo.ngay_bat_dau, { day: "2-digit", month: "2-digit", year: "numeric" })} -
                        {` ${formatDate(tripInfo.ngay_ket_thuc, { day: "2-digit", month: "2-digit", year: "numeric" })}`}
                      </p>
                    </div>
                  </div>

                  {/* <div className="flex items-start gap-3 rounded-lg border bg-background p-4">
                    <Clock className="h-10 w-10 text-primary" />
                    <div>
                      <p className="text-xs uppercase text-muted-foreground mb-1 tracking-wide">Tạo lúc</p>
                      <p className="text-sm font-medium">
                        {formatDate(tripInfo.ngay_tao, {
                          day: "2-digit",
                          month: "2-digit",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>
                  </div> */}

                  <div className="flex items-start gap-3 rounded-lg border bg-background p-4">
                    <Users className="h-10 w-10 text-primary" />
                    <div>
                      <p className="text-xs uppercase text-muted-foreground mb-1 tracking-wide">Thành viên</p>
                      <p className="text-sm font-medium">{tripInfo.so_luong_thanh_vien ?? 0} người</p>
                    </div>
                  </div>
                </section>

                <section className="space-y-3">
                  <div className="flex items-center justify-between gap-3">
                    <h2 className="text-lg font-semibold">Thành viên hiện tại</h2>
                    <span className="text-xs text-muted-foreground">
                      {tripInfo.so_luong_thanh_vien ?? 0} người tham gia
                    </span>
                  </div>

                  {Array.isArray(tripInfo.thanh_vien) && tripInfo.thanh_vien.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {tripInfo.thanh_vien.map((member, index) => {
                        const initials =
                          member?.ho_ten
                            ?.split(" ")
                            ?.map((part) => part[0])
                            ?.join("")
                            ?.toUpperCase()
                            ?.slice(0, 2) || "TV"
                        return (
                          <div
                            key={`${member?.ho_ten || "member"}-${index}`}
                            className="flex items-center gap-3 rounded-lg border bg-muted/30 p-3"
                          >
                            <Avatar className="h-10 w-10">
                              <AvatarImage src={member?.avatar_url || "/placeholder-user.jpg"} alt={member?.ho_ten || "Thành viên"} />
                              <AvatarFallback>{initials}</AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="text-sm font-medium">{member?.ho_ten || "Thành viên"}</p>
                              <p className="text-xs text-muted-foreground">Bạn đồng hành trong chuyến đi</p>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  ) : (
                    <div className="rounded-lg border bg-muted/30 p-6 text-center text-sm text-muted-foreground">
                      Chưa có thành viên nào được thêm vào chuyến đi này.
                    </div>
                  )}
                </section>

                <section className="rounded-lg border bg-primary/5 p-5 space-y-3">
                  <h3 className="text-base font-semibold text-primary">Sẵn sàng tham gia chuyến đi?</h3>
                  <p className="text-sm text-muted-foreground">
                    Đăng nhập hoặc đăng ký để nhận lời mời chính thức và đồng hành cùng đội nhóm trong chuyến đi này.
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      onClick={() => {
                        // ✅ Lưu mã mời vào localStorage để dùng sau khi đăng nhập
                        if (inviteCode) {
                          localStorage.setItem("pending_invite_code", inviteCode)
                        }
                        window.location.href = `/login?invite_code=${encodeURIComponent(inviteCode)}`
                      }}
                    >
                      Đăng nhập
                    </Button>
                    <Button variant="outline" asChild>
                      <Link href="/register">Tạo tài khoản</Link>
                    </Button>
                  </div>
                </section>
              </div>
            ) : (
              <div className="text-center text-sm text-muted-foreground">
                Không có dữ liệu để hiển thị cho mã mời này.
              </div>
            )}
          </CardContent>
        </Card>

        {/* <div className="text-center text-xs text-muted-foreground">
          Mã mời: <span className="font-medium text-foreground">{inviteCode || "---"}</span>
        </div> */}
      </div>
    </div>
  )
}

