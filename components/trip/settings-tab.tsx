"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Separator } from "@/components/ui/separator"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Globe,
  Lock,
  Users,
  Link2,
  Copy,
  Share2,
  Eye,
  Settings,
  Shield,
  Download,
  Trash2,
  AlertTriangle,
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { motion } from "framer-motion"

interface SettingsTabProps {
  tripId: string
  isOwner?: boolean
}

export function SettingsTab({ tripId, isOwner = true }: SettingsTabProps) {
  const [isPublic, setIsPublic] = useState(false)
  const [allowComments, setAllowComments] = useState(true)
  const [allowDownload, setAllowDownload] = useState(true)
  const [publicDescription, setPublicDescription] = useState("")
  const [shareableLink, setShareableLink] = useState(`https://travelplan.app/feed/${tripId}`)
  const [viewCount, setViewCount] = useState(0)
  const [privacyLevel, setPrivacyLevel] = useState("private")
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const { toast } = useToast()

  const handleTogglePublic = (checked: boolean) => {
    setIsPublic(checked)
    if (checked) {
      setPrivacyLevel("public")
      toast({
        title: "Chuyến đi đã được công khai",
        description: "Chuyến đi của bạn giờ đây có thể được xem bởi mọi người trên trang Bản Tin",
      })
    } else {
      setPrivacyLevel("private")
      toast({
        title: "Chuyến đi đã được đặt riêng tư",
        description: "Chỉ thành viên được mời mới có thể xem chuyến đi này",
      })
    }
  }

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareableLink)
      toast({
        title: "Đã sao chép liên kết!",
        description: "Liên kết chia sẻ đã được sao chép vào clipboard",
      })
    } catch (error) {
      toast({
        title: "Lỗi sao chép",
        description: "Không thể sao chép liên kết. Vui lòng thử lại.",
        variant: "destructive",
      })
    }
  }

  const handleShare = async () => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: "Tham gia chuyến đi cùng tôi!",
          text: publicDescription || "Khám phá chuyến đi tuyệt vời này",
          url: shareableLink,
        })
      } else {
        await handleCopyLink()
      }
    } catch (error) {
      console.log("Share cancelled or failed")
    }
  }

  const handleDeleteTrip = () => {
    toast({
      title: "Chuyến đi đã được xóa",
      description: "Chuyến đi và tất cả dữ liệu liên quan đã được xóa vĩnh viễn",
      variant: "destructive",
    })
    setShowDeleteConfirm(false)
  }

  const privacyOptions = [
    {
      value: "private",
      label: "Riêng tư",
      description: "Chỉ thành viên được mời mới có thể xem",
      icon: <Lock className="h-4 w-4" />,
    },
    {
      value: "public",
      label: "Công khai",
      description: "Mọi người có thể xem trên trang Bản Tin",
      icon: <Globe className="h-4 w-4" />,
    },
    {
      value: "link-only",
      label: "Chỉ qua liên kết",
      description: "Chỉ những người có liên kết mới có thể xem",
      icon: <Link2 className="h-4 w-4" />,
    },
  ]

  if (!isOwner) {
    return (
      <div className="space-y-6">
        <Card className="border-yellow-200 bg-yellow-50">
          <CardContent className="p-6">
            <div className="flex items-center gap-3 text-yellow-800">
              <Shield className="h-5 w-5" />
              <div>
                <h3 className="font-semibold">Quyền hạn bị hạn chế</h3>
                <p className="text-sm">Chỉ chủ chuyến đi mới có thể thay đổi cài đặt này</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Privacy & Sharing Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5 text-primary" />
            Quyền riêng tư & Chia sẻ
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Privacy Level */}
          <div className="space-y-3">
            <Label className="text-base font-semibold">Mức độ riêng tư</Label>
            <Select value={privacyLevel} onValueChange={setPrivacyLevel}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {privacyOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    <div className="flex items-center gap-2">
                      {option.icon}
                      <div>
                        <div className="font-medium">{option.label}</div>
                        <div className="text-xs text-muted-foreground">{option.description}</div>
                      </div>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Public Toggle */}
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Globe className="h-4 w-4 text-primary" />
                <Label htmlFor="public-toggle" className="font-medium">
                  Hiển thị trên Bản Tin Công khai
                </Label>
              </div>
              <p className="text-sm text-muted-foreground">
                Cho phép mọi người khám phá chuyến đi của bạn trên trang Bản Tin
              </p>
            </div>
            <Switch
              id="public-toggle"
              checked={privacyLevel === "public"}
              onCheckedChange={(checked) => {
                setPrivacyLevel(checked ? "public" : "private")
                handleTogglePublic(checked)
              }}
            />
          </div>

          {/* Public Description */}
          {privacyLevel === "public" && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="space-y-2"
            >
              <Label htmlFor="public-description">Mô tả công khai</Label>
              <Textarea
                id="public-description"
                placeholder="Viết mô tả hấp dẫn để thu hút người xem..."
                value={publicDescription}
                onChange={(e) => setPublicDescription(e.target.value)}
                className="min-h-[80px]"
              />
              <p className="text-xs text-muted-foreground">
                Mô tả này sẽ hiển thị trên trang Bản Tin để giúp mọi người hiểu về chuyến đi của bạn
              </p>
            </motion.div>
          )}

          {/* Shareable Link */}
          <div className="space-y-3">
            <Label className="text-base font-semibold">Liên kết chia sẻ</Label>
            <div className="flex gap-2">
              <Input value={shareableLink} readOnly className="font-mono text-sm" />
              <Button variant="outline" size="icon" onClick={handleCopyLink}>
                <Copy className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="icon" onClick={handleShare}>
                <Share2 className="h-4 w-4" />
              </Button>
            </div>
            {privacyLevel === "public" && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Eye className="h-4 w-4" />
                <span>{viewCount.toLocaleString()} lượt xem</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Permissions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            Quyền hạn người xem
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label htmlFor="allow-comments">Cho phép bình luận</Label>
              <p className="text-sm text-muted-foreground">Người xem có thể để lại bình luận về chuyến đi</p>
            </div>
            <Switch id="allow-comments" checked={allowComments} onCheckedChange={setAllowComments} />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label htmlFor="allow-download">Cho phép tải PDF</Label>
              <p className="text-sm text-muted-foreground">Người xem có thể tải xuống lịch trình dưới dạng PDF</p>
            </div>
            <Switch id="allow-download" checked={allowDownload} onCheckedChange={setAllowDownload} />
          </div>
        </CardContent>
      </Card>

      {/* Sharing Stats */}
      {privacyLevel === "public" && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5 text-primary" />
              Thống kê chia sẻ
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <Eye className="h-6 w-6 text-blue-600 mx-auto mb-2" />
                <p className="text-2xl font-bold text-blue-600">{viewCount}</p>
                <p className="text-sm text-muted-foreground">Lượt xem</p>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <Download className="h-6 w-6 text-green-600 mx-auto mb-2" />
                <p className="text-2xl font-bold text-green-600">0</p>
                <p className="text-sm text-muted-foreground">Lượt tải</p>
              </div>
              <div className="text-center p-4 bg-purple-50 rounded-lg">
                <Share2 className="h-6 w-6 text-purple-600 mx-auto mb-2" />
                <p className="text-2xl font-bold text-purple-600">0</p>
                <p className="text-sm text-muted-foreground">Lượt chia sẻ</p>
              </div>
              <div className="text-center p-4 bg-yellow-50 rounded-lg">
                <Users className="h-6 w-6 text-yellow-600 mx-auto mb-2" />
                <p className="text-2xl font-bold text-yellow-600">0</p>
                <p className="text-sm text-muted-foreground">Người theo dõi</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Trip Management */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5 text-primary" />
            Quản lý chuyến đi
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div className="space-y-1">
              <Label className="font-medium">Xuất dữ liệu</Label>
              <p className="text-sm text-muted-foreground">Tải xuống toàn bộ dữ liệu chuyến đi</p>
            </div>
            <Button variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Xuất dữ liệu
            </Button>
          </div>

          <Separator />

          <div className="space-y-4">
            <div className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" />
              <Label className="font-medium">Vùng nguy hiểm</Label>
            </div>

            {!showDeleteConfirm ? (
              <div className="flex items-center justify-between p-4 border border-destructive/20 rounded-lg bg-destructive/5">
                <div className="space-y-1">
                  <Label className="font-medium text-destructive">Xóa chuyến đi</Label>
                  <p className="text-sm text-muted-foreground">
                    Xóa vĩnh viễn chuyến đi và tất cả dữ liệu liên quan. Hành động này không thể hoàn tác.
                  </p>
                </div>
                <Button variant="destructive" onClick={() => setShowDeleteConfirm(true)}>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Xóa chuyến đi
                </Button>
              </div>
            ) : (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="p-4 border border-destructive rounded-lg bg-destructive/10"
              >
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-destructive">
                    <AlertTriangle className="h-5 w-5" />
                    <Label className="font-semibold">Xác nhận xóa chuyến đi</Label>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Bạn có chắc chắn muốn xóa chuyến đi này? Tất cả dữ liệu bao gồm lịch trình, thành viên, chi phí và
                    tin nhắn sẽ bị xóa vĩnh viễn.
                  </p>
                  <div className="flex gap-2">
                    <Button variant="outline" onClick={() => setShowDeleteConfirm(false)} className="flex-1">
                      Hủy
                    </Button>
                    <Button variant="destructive" onClick={handleDeleteTrip} className="flex-1">
                      Xác nhận xóa
                    </Button>
                  </div>
                </div>
              </motion.div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
