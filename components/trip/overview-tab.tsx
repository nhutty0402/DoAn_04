"use client"
import { Edit, Trash2, X, ChevronLeft, ChevronRight } from "lucide-react";
import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
    Calendar,
    Users,
    Camera,
    DollarSign,
    Clock,
    TrendingUp,
    Download,
    Share2,
    FileText,
    CreditCard,
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { PaymentModal } from "@/components/payment/payment-modal"
import axios from "axios"
import Cookies from "js-cookie"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

interface OverviewTabProps {
    trip: any
    onSwitchTab?: (tab: string) => void
}

export function OverviewTab({ trip, onSwitchTab }: OverviewTabProps) {
    const [isExporting, setIsExporting] = useState(false)
    const [showPaymentModal, setShowPaymentModal] = useState(false)
    const { toast } = useToast()
    const [showMediaDialog, setShowMediaDialog] = useState(false)
    const [selectedAvatarFile, setSelectedAvatarFile] = useState<File | null>(null)
    const [isUploadingAvatar, setIsUploadingAvatar] = useState(false)
    const [postCaption, setPostCaption] = useState("")
    const [postFiles, setPostFiles] = useState<File[]>([])
    const [isPosting, setIsPosting] = useState(false)
    const [isLoadingPosts, setIsLoadingPosts] = useState(false)
    const [posts, setPosts] = useState<any[]>([])
    const [editingPostId, setEditingPostId] = useState<number | null>(null)
    const [editCaption, setEditCaption] = useState("")
    const [editFiles, setEditFiles] = useState<File[]>([])
    const [updatingPostId, setUpdatingPostId] = useState<number | null>(null)
    const [deletingPostId, setDeletingPostId] = useState<number | null>(null)
    const [tripAvatarUrl, setTripAvatarUrl] = useState<string | null>(null)
    const [isLoadingAvatar, setIsLoadingAvatar] = useState(false)
    const [imageViewer, setImageViewer] = useState<{
        isOpen: boolean
        images: string[]
        currentIndex: number
    }>({
        isOpen: false,
        images: [],
        currentIndex: 0,
    })

    const tripId = trip?.chuyen_di_id || trip?.id

    const fetchTripAvatar = async () => {
        try {
            if (!tripId) return
            const token = Cookies.get("token")
            if (!token || token === "null" || token === "undefined") return
            setIsLoadingAvatar(true)
            const res = await axios.get(
                `https://travel-planner-imdw.onrender.com/api/chuyendi/${tripId}/anh-dai-dien`,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            )
            const data = res?.data
            setTripAvatarUrl(data?.url_avt ?? null)
        } catch (error) {
            setTripAvatarUrl(null)
        } finally {
            setIsLoadingAvatar(false)
        }
    }

    const fetchPosts = async () => {
        try {
            const token = Cookies.get("token")
            if (!token || token === "null" || token === "undefined") return
            if (!tripId) return
            setIsLoadingPosts(true)
            const res = await axios.get(
                `https://travel-planner-imdw.onrender.com/api/bai-viet/chuyen-di/${tripId}`,
                { headers: { Authorization: `Bearer ${token}` } }
            )
            const data = res?.data
            setPosts(Array.isArray(data?.du_lieu) ? data.du_lieu : [])
        } catch (error) {
            // silent; will show empty
        } finally {
            setIsLoadingPosts(false)
        }
    }

    useEffect(() => {
        if (tripId) {
            fetchTripAvatar()
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [tripId])

    useEffect(() => {
        if (showMediaDialog) {
            fetchTripAvatar()
            fetchPosts()
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [showMediaDialog])

    // Calculate trip duration if dates are available
    const getTripDuration = () => {
        if (trip?.ngay_bat_dau && trip?.ngay_ket_thuc) {
            const startDate = new Date(trip.ngay_bat_dau)
            const endDate = new Date(trip.ngay_ket_thuc)
            const duration = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1
            return `${duration} ngày`
        }
        return "Chưa cập nhật"
    }

    const getDateRange = () => {
        if (trip?.ngay_bat_dau && trip?.ngay_ket_thuc) {
            const startDate = new Date(trip.ngay_bat_dau)
            const endDate = new Date(trip.ngay_ket_thuc)
            return `${startDate.toLocaleDateString("vi-VN")} - ${endDate.toLocaleDateString("vi-VN")}`
        }
        return "Chưa cập nhật"
    }

    const stats = [
        {
            title: "Tổng số ngày",
            value: getTripDuration(),
            icon: <Calendar className="h-5 w-5 text-primary" />,
            description: getDateRange(),
        },
        // địa điểm xuất phát
        // {
        //   title: "Địa điểm xuất phát",
        //   value: trip?.dia_diem_xuat_phat || "Chưa cập nhật",
        //   icon: <MapPin className="h-5 w-5 text-primary" />,
        //   description: "Nơi bắt đầu hành trình",
        // },


        // khung dưới icon
        // {
        //   title: "Tiền tệ",
        //   value: trip?.tien_te || "VNĐ",
        //   icon: <DollarSign className="h-5 w-5 text-primary" />,
        //   description: "Đơn vị tiền tệ sử dụng",
        // },
        // {
        //   title: "Trạng thái",
        //   value: trip?.cong_khai ? "Công khai" : "Riêng tư",
        //   icon: <TrendingUp className="h-5 w-5 text-primary" />,
        //   description: trip?.trang_thai || "Chưa cập nhật",
        // },
    ]

    // const recentActivities = [
    //   {
    //     action: "Thêm điểm đến",
    //     detail: "Bãi biển Mỹ Khê",
    //     user: "Nguyễn Văn A",
    //     time: "2 giờ trước",
    //     type: "location",
    //   },
    //   {
    //     action: "Cập nhật chi phí",
    //     detail: "Khách sạn Muong Thanh",
    //     user: "Trần Thị B",
    //     time: "5 giờ trước",
    //     type: "expense",
    //   },
    //   {
    //     action: "Mời thành viên",
    //     detail: "Lê Văn C",
    //     user: "Nguyễn Văn A",
    //     time: "1 ngày trước",
    //     type: "member",
    //   },
    //   {
    //     action: "Xuất PDF",
    //     detail: "Lịch trình chi tiết",
    //     user: "Trần Thị B",
    //     time: "2 ngày trước",
    //     type: "export",
    //   },
    //   {
    //     action: "Thanh toán",
    //     detail: "Đặt cọc khách sạn",
    //     user: "Nguyễn Văn A",
    //     time: "3 ngày trước",
    //     type: "payment",
    //   },
    // ]

    const handleExportPDF = async () => {
        setIsExporting(true)
        try {
            // Simulate PDF generation
            await new Promise((resolve) => setTimeout(resolve, 2000))

            toast({
                title: "Xuất PDF thành công!",
                description: "Lịch trình đã được tải xuống",
            })
        } catch (error) {
            toast({
                title: "Lỗi xuất PDF",
                description: "Không thể tạo file PDF. Vui lòng thử lại.",
                variant: "destructive",
            })
        } finally {
            setIsExporting(false)
        }
    }

    const handleShare = async () => {
        try {
            if (navigator.share) {
                await navigator.share({
                    title: trip?.ten_chuyen_di || "Chuyến đi",
                    text: `Tham gia chuyến đi ${trip?.ten_chuyen_di || "này"} cùng tôi!`,
                    url: window.location.href,
                })
            } else {
                // Fallback: copy to clipboard
                await navigator.clipboard.writeText(window.location.href)
                toast({
                    title: "Đã sao chép liên kết!",
                    description: "Liên kết chuyến đi đã được sao chép vào clipboard",
                })
            }
        } catch (error) {
            toast({
                title: "Lỗi chia sẻ",
                description: "Không thể chia sẻ chuyến đi. Vui lòng thử lại.",
                variant: "destructive",
            })
        }
    }

    const handleSharePublic = async () => {
        const publicLink = `${window.location.origin}/feed/${trip?.chuyen_di_id || trip?.id}`
        try {
            if (navigator.share) {
                await navigator.share({
                    title: trip?.ten_chuyen_di || "Chuyến đi",
                    text: `Khám phá chuyến đi tuyệt vời: ${trip?.ten_chuyen_di || "này"}`,
                    url: publicLink,
                })
            } else {
                await navigator.clipboard.writeText(publicLink)
                toast({
                    title: "Đã sao chép liên kết công khai!",
                    description: "Liên kết công khai đã được sao chép vào clipboard",
                })
            }
        } catch (error) {
            toast({
                title: "Lỗi chia sẻ",
                description: "Không thể chia sẻ chuyến đi. Vui lòng thử lại.",
                variant: "destructive",
            })
        }
    }

    const getActivityIcon = (type: string) => {
        switch (type) {
            case "location":
                return <Camera className="h-3 w-3 text-blue-500" />
            case "expense":
                return <DollarSign className="h-3 w-3 text-green-500" />
            case "member":
                return <Users className="h-3 w-3 text-purple-500" />
            case "export":
                return <FileText className="h-3 w-3 text-orange-500" />
            case "payment":
                return <CreditCard className="h-3 w-3 text-red-500" />
            default:
                return <Clock className="h-3 w-3 text-gray-500" />
        }
    }

    const handleUploadAvatar = async () => {
        try {
            if (!selectedAvatarFile) {
                toast({ title: "Chưa chọn ảnh", description: "Vui lòng chọn một ảnh để tải lên", variant: "destructive" })
                return
            }
            const token = Cookies.get("token")
            if (!token || token === "null" || token === "undefined") {
                toast({ title: "Chưa đăng nhập", description: "Vui lòng đăng nhập để tiếp tục", variant: "destructive" })
                return
            }
            if (!tripId) {
                toast({ title: "Thiếu ID chuyến đi", description: "Không tìm thấy ID chuyến đi", variant: "destructive" })
                return
            }
            setIsUploadingAvatar(true)
            const form = new FormData()
            form.append("file", selectedAvatarFile)
            form.append("chuyen_di_id", String(tripId))
            const res = await axios.put(
                "https://travel-planner-imdw.onrender.com/api/chuyendi/anh-dai-dien-file",
                form,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        "Content-Type": "multipart/form-data",
                    },
                }
            )
            const data = res?.data
            toast({
                title: "Thành công",
                description: data?.message || "Cập nhật ảnh đại diện thành công",
            })
            // Đóng dialog sau khi upload
            setShowMediaDialog(false)
            setSelectedAvatarFile(null)
            fetchTripAvatar()
        } catch (error: any) {
            toast({
                title: "Tải lên thất bại",
                description: error?.response?.data?.message || "Không thể cập nhật ảnh đại diện",
                variant: "destructive",
            })
        } finally {
            setIsUploadingAvatar(false)
        }
    }

    const handleCreatePost = async () => {
        try {
            if (!postFiles || postFiles.length === 0) {
                toast({ title: "Chưa chọn ảnh", description: "Vui lòng chọn tối thiểu 1 ảnh", variant: "destructive" })
                return
            }
            if (postFiles.length > 10) {
                toast({ title: "Quá số lượng ảnh", description: "Mỗi bài viết tối đa 10 ảnh", variant: "destructive" })
                return
            }
            const token = Cookies.get("token")
            if (!token || token === "null" || token === "undefined") {
                toast({ title: "Chưa đăng nhập", description: "Vui lòng đăng nhập để tiếp tục", variant: "destructive" })
                return
            }
            if (!tripId) {
                toast({ title: "Thiếu ID chuyến đi", description: "Không tìm thấy ID chuyến đi", variant: "destructive" })
                return
            }
            setIsPosting(true)
            const form = new FormData()
            form.append("chuyen_di_id", String(tripId))
            form.append("caption", postCaption || "")
            // Field name 'files' to match backend expecting req.files
            postFiles.forEach((file) => form.append("files", file))
            const res = await axios.post(
                "https://travel-planner-imdw.onrender.com/api/bai-viet",
                form,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        "Content-Type": "multipart/form-data",
                    },
                }
            )
            const data = res?.data
            toast({
                title: "Đăng bài thành công",
                description: data?.message || `Tạo bài viết thành công (${data?.so_anh ?? postFiles.length} ảnh)`,
            })
            // Cập nhật danh sách bài viết ngay lập tức (nếu API trả về đầy đủ)
            if (data?.bai_viet_id) {
                const newPost = {
                    bai_viet_id: data.bai_viet_id,
                    chuyen_di_id: tripId,
                    nguoi_dung_id: undefined,
                    caption: postCaption || "",
                    url_anh: null,
                    luot_thich: 0,
                    trang_thai: data?.trang_thai ?? "",
                    tao_luc: new Date().toISOString(),
                    ten_nguoi_tao: data?.nguoi_tao?.ho_ten ?? "",
                    avatar_nguoi_tao: data?.nguoi_tao?.avatar_url ?? "",
                    da_thich: 0,
                    ds_anh: Array.isArray(data?.ds_anh) ? data.ds_anh : [],
                }
                setPosts((prev) => [newPost, ...prev])
            } else {
                // Fallback: refetch
                fetchPosts()
            }
            // reset post form
            setPostCaption("")
            setPostFiles([])
            setShowMediaDialog(false)
        } catch (error: any) {
            toast({
                title: "Đăng bài thất bại",
                description: error?.response?.data?.message || "Không thể tạo bài viết",
                variant: "destructive",
            })
        } finally {
            setIsPosting(false)
        }
    }

    const startEditPost = (post: any) => {
        setEditingPostId(post.bai_viet_id)
        setEditCaption(post.caption || "")
        setEditFiles([])
    }

    const cancelEditPost = () => {
        setEditingPostId(null)
        setEditCaption("")
        setEditFiles([])
    }

    const handleUpdatePost = async (id: number) => {
        try {
            const token = Cookies.get("token")
            if (!token || token === "null" || token === "undefined") {
                toast({ title: "Chưa đăng nhập", description: "Vui lòng đăng nhập để tiếp tục", variant: "destructive" })
                return
            }
            setUpdatingPostId(id)
            const form = new FormData()
            form.append("caption", editCaption || "")
            // backend accepts optional new files to replace all
            if (editFiles.length > 0) {
                editFiles.forEach((f) => form.append("files", f))
            }
            const res = await axios.put(`https://travel-planner-imdw.onrender.com/api/bai-viet/${id}`, form, {
                headers: { Authorization: `Bearer ${token}`, "Content-Type": "multipart/form-data" },
            })
            const data = res?.data
            toast({ title: "Đã cập nhật", description: data?.message || "Cập nhật bài viết thành công" })
            // refresh or update local
            await fetchPosts()
            cancelEditPost()
        } catch (error: any) {
            toast({
                title: "Cập nhật thất bại",
                description: error?.response?.data?.message || "Không thể cập nhật bài viết",
                variant: "destructive",
            })
        } finally {
            setUpdatingPostId(null)
        }
    }

    const handleDeletePost = async (id: number) => {
        try {
            const token = Cookies.get("token")
            if (!token || token === "null" || token === "undefined") {
                toast({ title: "Chưa đăng nhập", description: "Vui lòng đăng nhập để tiếp tục", variant: "destructive" })
                return
            }
            if (!confirm("Bạn chắc chắn muốn xóa bài viết này?")) return
            setDeletingPostId(id)
            const res = await axios.delete(`https://travel-planner-imdw.onrender.com/api/bai-viet/${id}`, {
                headers: { Authorization: `Bearer ${token}` },
            })
            const data = res?.data
            toast({ title: "Đã xóa", description: data?.message || "Xóa bài viết thành công" })
            setPosts((prev) => prev.filter((p) => p.bai_viet_id !== id))
            if (editingPostId === id) cancelEditPost()
        } catch (error: any) {
            toast({
                title: "Xóa thất bại",
                description: error?.response?.data?.message || "Không thể xóa bài viết",
                variant: "destructive",
            })
        } finally {
            setDeletingPostId(null)
        }
    }

    const openImageViewer = (images: string[], startIndex: number = 0) => {
        setImageViewer({
            isOpen: true,
            images,
            currentIndex: startIndex,
        })
    }

    const closeImageViewer = () => {
        setImageViewer({
            isOpen: false,
            images: [],
            currentIndex: 0,
        })
    }

    const nextImage = () => {
        if (imageViewer.images.length === 0) return
        setImageViewer((prev) => ({
            ...prev,
            currentIndex: (prev.currentIndex + 1) % prev.images.length,
        }))
    }

    const prevImage = () => {
        if (imageViewer.images.length === 0) return
        setImageViewer((prev) => ({
            ...prev,
            currentIndex: (prev.currentIndex - 1 + prev.images.length) % prev.images.length,
        }))
    }

    return (
        <div className="space-y-6">
            {/* Export and Share Actions */}
            {/* <Card>
        <CardHeader>
          <CardTitle>Xuất dữ liệu & Chia sẻ</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <Button onClick={handleExportPDF} disabled={isExporting} className="flex items-center gap-2">
              <Download className="h-4 w-4" />
              {isExporting ? "Đang xuất PDF..." : "Xuất PDF"}
            </Button>
            <Button variant="outline" onClick={handleShare} className="flex items-center gap-2 bg-transparent">
              <Share2 className="h-4 w-4" />
              Chia sẻ chuyến đi
            </Button>
            <Button variant="outline" onClick={handleSharePublic} className="flex items-center gap-2 bg-transparent">
              <Share2 className="h-4 w-4" />
              Chia sẻ công khai
            </Button>
            <Button variant="outline" onClick={() => setShowPaymentModal(true)} className="flex items-center gap-2">
              <CreditCard className="h-4 w-4" />
              Thanh toán MoMo
            </Button>
          </div>
        </CardContent>
      </Card> */}

            {/* Ngày tháng*/}
            {/* <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, index) => (
          <Card key={index}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">{stat.title}</p>
                  <p className="text-2xl font-bold text-foreground">{stat.value}</p>
                  <p className="text-xs text-muted-foreground mt-1">{stat.description}</p>
                </div>
                {stat.icon}
              </div>
            </CardContent>
          </Card>   
        ))}
      </div> */}
            {/* <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              Tiến Độ Chuyến Đi
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Lịch trình</span>
                <span className="font-medium">80%</span>
              </div>
              <div className="w-full bg-muted rounded-full h-2">
                <div className="bg-primary h-2 rounded-full" style={{ width: "80%" }} />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Chi phí</span>
                <span className="font-medium">65%</span>
              </div>
              <div className="w-full bg-muted rounded-full h-2">
                <div className="bg-secondary h-2 rounded-full" style={{ width: "65%" }} />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Thành viên</span>
                <span className="font-medium">75%</span>
              </div>
              <div className="w-full bg-muted rounded-full h-2">
                <div className="bg-accent h-2 rounded-full" style={{ width: "75%" }} />
              </div>
            </div>
          </CardContent>
        </Card> */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Tiến độ*/}
                {/* <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              Tiến Độ Chuyến Đi
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Lịch trình</span>
                <span className="font-medium">80%</span>
              </div>
              <div className="w-full bg-muted rounded-full h-2">
                <div className="bg-primary h-2 rounded-full" style={{ width: "80%" }} />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Chi phí</span>
                <span className="font-medium">65%</span>
              </div>
              <div className="w-full bg-muted rounded-full h-2">
                <div className="bg-secondary h-2 rounded-full" style={{ width: "65%" }} />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Thành viên</span>
                <span className="font-medium">75%</span>
              </div>
              <div className="w-full bg-muted rounded-full h-2">
                <div className="bg-accent h-2 rounded-full" style={{ width: "75%" }} />
              </div>
            </div>
          </CardContent>
        </Card> */}

                {/* Nhật ký hoạt động */}
                {/* <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-primary" />
              Nhật Ký Hoạt Động
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4 max-h-64 overflow-y-auto">
              {recentActivities.map((activity, index) => (
                <div key={index} className="flex items-start gap-3 pb-3 border-b border-border last:border-0">
                  <div className="flex items-center justify-center w-6 h-6 rounded-full bg-muted mt-1">
                    {getActivityIcon(activity.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground">
                      {activity.action}: <span className="text-primary">{activity.detail}</span>
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {activity.user} • {activity.time}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card> */}
            </div>

            {/* Quick Actions */}
            <Card>
                <CardHeader>
                    <CardTitle>Hành Động Nhanh</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div 
                            className="p-4 border border-border rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
                            onClick={() => onSwitchTab?.("itinerary")}
                        >
                            <Calendar className="h-6 w-6 text-primary mb-2" />
                            <p className="font-medium text-sm">Thêm ngày mới</p>
                        </div>
                        <div 
                            className="p-4 border border-border rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
                            onClick={() => onSwitchTab?.("members")}
                        >
                            <Users className="h-6 w-6 text-primary mb-2" />
                            <p className="font-medium text-sm">Mời thành viên</p>
                        </div>
                        <div 
                            className="p-4 border border-border rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
                            onClick={() => onSwitchTab?.("expenses")}
                        >
                            <DollarSign className="h-6 w-6 text-primary mb-2" />
                            <p className="font-medium text-sm">Thêm chi phí</p>
                        </div>
                        <div
                            className="p-4 border border-border rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
                            onClick={() => setShowMediaDialog(true)}
                        >
                            <Camera className="h-6 w-6 text-primary mb-2" />
                            <p className="font-medium text-sm">Kho lưu trữ</p>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <Dialog open={showMediaDialog} onOpenChange={setShowMediaDialog}>
                <DialogContent className="max-h-[80vh] overflow-y-auto">
                    <div className="text-center space-y-8">
                        <DialogTitle className="text-2xl font-semibold">
                            Ảnh đại diện & bài viết
                        </DialogTitle>
                    </div>

                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="avatar">Ảnh đại diện chuyến đi</Label>
                            <div className="flex items-center gap-3">
                                <Avatar className="h-16 w-16">
                                    <AvatarImage src={tripAvatarUrl || ""} />
                                    <AvatarFallback>
                                        {(trip?.ten_chuyen_di || "T").slice(0, 1)}
                                    </AvatarFallback>
                                </Avatar>
                                <div className="text-sm text-muted-foreground">
                                    {isLoadingAvatar
                                        ? "Đang tải ảnh..."
                                        : tripAvatarUrl
                                            ? "Đây là ảnh đại diện hiện tại của chuyến đi."
                                            : "Chưa có ảnh đại diện được thiết lập."}
                                </div>
                            </div>
                            <Input
                                id="avatar"
                                type="file"
                                accept="image/*"
                                onChange={(e) => setSelectedAvatarFile(e.target.files?.[0] || null)}
                            />
                            <div className="flex gap-2">
                                <Button onClick={handleUploadAvatar} disabled={isUploadingAvatar} className="mt-2">
                                    {isUploadingAvatar ? "Đang tải..." : "Cập nhật ảnh đại diện"}
                                </Button>
                                {/* Làm mới ảnh đại diện load trang */}
                                {/* <Button
                  type="button"
                  variant="outline"
                  className="mt-2 bg-transparent"
                  onClick={fetchTripAvatar}
                  disabled={isLoadingAvatar}
                >
                  {isLoadingAvatar ? "Đang làm mới..." : "Làm mới ảnh"}
                </Button> */}
                            </div>
                        </div>
                        <div className="pt-4 border-t border-border space-y-3">
                            <Label>Đăng bài viết (tối đa 10 ảnh)</Label>
                            <Input
                                type="text"
                                placeholder="Chia sẻ cảm nghĩ về chuyến đi..."
                                value={postCaption}
                                onChange={(e) => setPostCaption(e.target.value)}
                                className="border-blue-100 focus-visible:ring-blue-100 focus-visible:ring-offset-1 
               placeholder:text-BLACK-400/70 text-blue-900 font-medium 
               transition-all duration-200"
                            />

                                <Input
                                type="file"
                                accept="image/*"
                                multiple
                                onChange={(e) => {
                                    const files = Array.from(e.target.files || [])
                                    const limited = files.slice(0, 10)
                                    setPostFiles(limited)
                                    if (files.length > 10) {
                                        toast({
                                            title: "Đã giới hạn 10 ảnh",
                                            description: "Chỉ lấy 10 ảnh đầu tiên bạn chọn",
                                        })
                                    }
                                }}
                            />
                            <div className="text-xs text-muted-foreground">
                                {postFiles.length > 0 ? `${postFiles.length} ảnh đã chọn` : "Chưa chọn ảnh nào"}
                            </div>
                            <div className="flex gap-2">
                                <Button onClick={handleCreatePost} disabled={isPosting} className="bg-primary hover:bg-primary/90">
                                    {isPosting ? "Đang đăng..." : "Đăng bài"}
                                </Button>
                            </div>
                        </div>
                        <div className="pt-4 border-t border-border">
                            <div className="flex items-center justify-between mb-2">
                                <p className="font-medium">Bài viết của chuyến đi</p>
                                {/* <Button variant="outline" className="bg-transparent" size="sm" onClick={fetchPosts} disabled={isLoadingPosts}>
                  {isLoadingPosts ? "Đang tải..." : "Làm mới"}
                </Button> */}
                            </div>
                            <div className="space-y-4">
                                {posts.length === 0 && !isLoadingPosts && (
                                    <p className="text-sm text-muted-foreground">Chưa có bài viết nào.</p>
                                )}
                                {posts.map((p) => (
                                    <div key={p.bai_viet_id} className="border border-border rounded-lg p-3">

                                        <div className="flex items-center gap-2 mb-2">
                                            <Avatar className="h-8 w-8">
                                                <AvatarImage src={p.avatar_nguoi_tao || ""} />
                                                <AvatarFallback>{(p.ten_nguoi_tao || "U").slice(0, 1)}</AvatarFallback>
                                            </Avatar>

                                            <div>
                                                <p className="text-sm font-medium">{p.ten_nguoi_tao || "Người dùng"}</p>
                                                <p className="text-xs text-muted-foreground">
                                                    {new Date(p.tao_luc || Date.now()).toLocaleString("vi-VN")}
                                                </p>
                                            </div>

                                            <div className="flex justify-end gap-2 mb-2">
                                                {editingPostId === p.bai_viet_id ? (
                                                    <>
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            onClick={() => handleUpdatePost(p.bai_viet_id)}
                                                            disabled={updatingPostId === p.bai_viet_id}
                                                        >
                                                            {updatingPostId === p.bai_viet_id ? "Đang lưu..." : "Lưu"}
                                                        </Button>
                                                        <Button variant="ghost" size="sm" onClick={cancelEditPost}>
                                                            Hủy
                                                        </Button>
                                                    </>
                                                ) : (
                                                    <>
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() => startEditPost(p)}
                                                            className="h-8 w-8 p-0 rounded-lg hover:bg-blue-50 hover:text-blue-600 transition-all"
                                                            title="Sửa bài viết"
                                                        >
                                                            <Edit className="h-4 w-4" />
                                                        </Button>
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() => handleDeletePost(p.bai_viet_id)}
                                                            disabled={deletingPostId === p.bai_viet_id}
                                                            className="h-8 w-8 p-0 rounded-lg hover:bg-red-50 hover:text-red-600 text-red-500 disabled:opacity-50 transition-all"
                                                            title="Xóa bài viết"
                                                        >
                                                            {deletingPostId === p.bai_viet_id ? (
                                                                <div className="h-4 w-4 animate-spin rounded-full border-2 border-red-600 border-t-transparent" />
                                                            ) : (
                                                                <Trash2 className="h-4 w-4" />
                                                            )}
                                                        </Button>
                                                    </>
                                                )}
                                            </div>

                                        </div>
                                        {editingPostId === p.bai_viet_id ? (
                                            <div className="space-y-2 mb-2">
                                                <Input
                                                    type="text"
                                                    placeholder="Cập nhật caption..."
                                                    value={editCaption}
                                                    onChange={(e) => setEditCaption(e.target.value)}
                                                />
                                                <Input
                                                    type="file"
                                                    accept="image/*"
                                                    multiple
                                                    onChange={(e) => setEditFiles(Array.from(e.target.files || []))}
                                                />
                                                <div className="text-xs text-muted-foreground">
                                                    {editFiles.length > 0
                                                        ? `${editFiles.length} ảnh mới sẽ thay ảnh cũ`
                                                        : "Không chọn ảnh mới → chỉ cập nhật caption"}
                                                </div>
                                            </div>
                                        ) : (
                                            p.caption && <p className="text-sm mb-2">{p.caption}</p>
                                        )}
                                        {Array.isArray(p.ds_anh) && p.ds_anh.length > 0 && (
                                            <div className="grid grid-cols-2 gap-2">
                                                {p.ds_anh.map((url: string, idx: number) => (
                                                    <img
                                                        key={idx}
                                                        src={url}
                                                        alt={`post-${p.bai_viet_id}-${idx}`}
                                                        className="w-full h-32 object-cover rounded-md cursor-pointer hover:opacity-90 transition-opacity"
                                                        loading="lazy"
                                                        onClick={() => openImageViewer(p.ds_anh, idx)}
                                                    />
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            <PaymentModal
                isOpen={showPaymentModal}
                onClose={() => setShowPaymentModal(false)}
                tripId={trip?.chuyen_di_id || trip?.id}
                amount={3900000}
            />

            {/* Image Viewer Modal */}
            <Dialog open={imageViewer.isOpen} onOpenChange={(open) => !open && closeImageViewer()}>
                <DialogContent className="max-w-[95vw] w-full h-[95vh] p-0 bg-black/95 border-none">
                    <div className="relative w-full h-full flex items-center justify-center overflow-hidden">
                        {/* Close Button */}
                        <button
                            onClick={closeImageViewer}
                            className="absolute top-4 right-4 z-50 p-2 rounded-full bg-black/50 hover:bg-black/70 text-white transition-colors"
                            aria-label="Đóng"
                        >
                            <X className="h-6 w-6" />
                        </button>

                        {/* Previous Button */}
                        {imageViewer.images.length > 1 && (
                            <button
                                onClick={prevImage}
                                className="absolute left-4 z-50 p-3 rounded-full bg-black/50 hover:bg-black/70 text-white transition-colors"
                                aria-label="Ảnh trước"
                            >
                                <ChevronLeft className="h-6 w-6" />
                            </button>
                        )}

                        {/* Image Container - Đảm bảo ảnh hiển thị đầy đủ */}
                        {imageViewer.images[imageViewer.currentIndex] && (
                            <div className="w-full h-full flex items-center justify-center p-4">
                                <img
                                    src={imageViewer.images[imageViewer.currentIndex]}
                                    alt={`Ảnh ${imageViewer.currentIndex + 1}`}
                                    className="max-w-full max-h-full w-auto h-auto object-contain"
                                    style={{ maxWidth: '100%', maxHeight: '100%' }}
                                />
                            </div>
                        )}

                        {/* Next Button */}
                        {imageViewer.images.length > 1 && (
                            <button
                                onClick={nextImage}
                                className="absolute right-4 z-50 p-3 rounded-full bg-black/50 hover:bg-black/70 text-white transition-colors"
                                aria-label="Ảnh sau"
                            >
                                <ChevronRight className="h-6 w-6" />
                            </button>
                        )}

                        {/* Image Counter */}
                        {imageViewer.images.length > 1 && (
                            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 px-4 py-2 rounded-full bg-black/50 text-white text-sm">
                                {imageViewer.currentIndex + 1} / {imageViewer.images.length}
                            </div>
                        )}
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    )
}
