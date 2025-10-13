"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { X, Mail, Link, Copy, QrCode, Share2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { motion } from "framer-motion"

interface InviteMemberModalProps {
  onClose: () => void
  tripId: string
}

export function InviteMemberModal({ onClose, tripId }: InviteMemberModalProps) {
  const [email, setEmail] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [inviteCode] = useState(() => Math.random().toString(36).substring(2, 8).toUpperCase())
  const [inviteLink] = useState(`https://travelplan.app/join/${tripId}?code=${inviteCode}`)
  const { toast } = useToast()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      await new Promise((resolve) => setTimeout(resolve, 1000))
      toast({
        title: "Lời mời đã được gửi!",
        description: `Lời mời tham gia đã được gửi đến ${email}`,
      })
      onClose()
    } catch (error) {
      toast({
        title: "Lỗi gửi lời mời",
        description: "Có lỗi xảy ra khi gửi lời mời",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const copyToClipboard = async (text: string, type: string) => {
    try {
      await navigator.clipboard.writeText(text)
      toast({
        title: "Đã sao chép!",
        description: `${type} đã được sao chép vào clipboard`,
      })
    } catch (error) {
      toast({
        title: "Lỗi sao chép",
        description: "Không thể sao chép vào clipboard",
        variant: "destructive",
      })
    }
  }

  const shareInvite = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: "Tham gia chuyến đi",
          text: `Bạn được mời tham gia chuyến đi! Sử dụng mã: ${inviteCode}`,
          url: inviteLink,
        })
      } catch (error) {
        copyToClipboard(inviteLink, "Link mời")
      }
    } else {
      copyToClipboard(inviteLink, "Link mời")
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-card rounded-lg shadow-xl max-w-md w-full"
      >
        <Card className="border-0 shadow-none">
          <CardHeader className="relative">
            <Button variant="ghost" size="icon" className="absolute right-2 top-2" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
            <CardTitle className="text-2xl font-[family-name:var(--font-space-grotesk)]">Mời Thành Viên</CardTitle>
            <CardDescription className="font-[family-name:var(--font-dm-sans)]">
              Gửi lời mời tham gia chuyến đi qua email hoặc chia sẻ mã/link
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Email Invitation */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="friend@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10"
                    required
                  />
                </div>
              </div>

              <div className="flex gap-3">
                <Button type="button" variant="outline" onClick={onClose} className="flex-1 bg-transparent">
                  Hủy
                </Button>
                <Button type="submit" className="flex-1 bg-primary hover:bg-primary/90" disabled={isLoading}>
                  {isLoading ? "Đang gửi..." : "Gửi Lời Mời"}
                </Button>
              </div>
            </form>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-border" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-card px-2 text-muted-foreground">Hoặc</span>
              </div>
            </div>

            <div className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <QrCode className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">Mã mời</span>
                </div>
                <div className="flex gap-2">
                  <div className="flex-1 p-3 bg-muted rounded-lg text-center">
                    <span className="text-2xl font-mono font-bold text-primary">{inviteCode}</span>
                  </div>
                  <Button variant="outline" size="icon" onClick={() => copyToClipboard(inviteCode, "Mã mời")}>
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground text-center">Chia sẻ mã này để bạn bè có thể tham gia</p>
              </div>

              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Link className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">Link mời</span>
                </div>
                <div className="flex gap-2">
                  <div className="flex-1 p-2 bg-muted rounded text-xs font-mono break-all">{inviteLink}</div>
                  <Button variant="outline" size="icon" onClick={() => copyToClipboard(inviteLink, "Link mời")}>
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
                <Button variant="outline" className="w-full bg-transparent" onClick={shareInvite}>
                  <Share2 className="h-4 w-4 mr-2" />
                  Chia sẻ link
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}
