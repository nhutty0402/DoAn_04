"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import axios from "axios"
import Cookies from "js-cookie"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import {
  Users,
  UserPlus,
  UserCheck,
  UserX,
  UserMinus,
  Search,
  X,
  Check,
  Ban,
  Trash2
} from "lucide-react"
import { toast } from "sonner"

interface Friend {
  id: string
  nguoi_dung_id: string
  ho_ten: string
  email: string
  avatar_url: string
  trang_thai: string
  status?: "friend" | "pending_sent" | "pending_received" | "blocked"
  created_at?: string
}

interface SearchResult {
  nguoi_dung_id: string
  ho_ten: string
  email: string
  avatar_url: string
}

interface FriendsModalProps {
  isOpen: boolean
  onClose: () => void
}

export function FriendsModal({ isOpen, onClose }: FriendsModalProps) {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState("friends")
  const [searchKeyword, setSearchKeyword] = useState("")
  const [searchResults, setSearchResults] = useState<SearchResult[]>([])
  const [friends, setFriends] = useState<Friend[]>([])
  const [friendRequests, setFriendRequests] = useState<Friend[]>([])
  const [sentRequests, setSentRequests] = useState<{
    ban_be_id: string
    nguoi_gui_id: string
    nguoi_nhan_id: string
    trang_thai: string
    ho_ten: string
    email: string
    avatar_url: string
  }[]>([])
  const [loading, setLoading] = useState(false)
  const [searchTimeout, setSearchTimeout] = useState<NodeJS.Timeout | null>(null)
  const [currentUserId, setCurrentUserId] = useState<string>("")

  // Kiểm tra token khi mở modal
  useEffect(() => {
    if (!isOpen) return
    const token = Cookies.get("token")
    console.log("Token từ cookie:", token)
    if (!token || token === "null" || token === "undefined") {
      console.warn("Không có token → chuyển về /login")
      router.replace("/login")
    }
  }, [isOpen, router])

  // Lấy current user ID từ token
  useEffect(() => {
    if (isOpen) {
      const token = Cookies.get("token")
      if (token) {
        try {
          // Decode JWT token để lấy user ID (nếu token chứa thông tin này)
          // Hoặc có thể call API để lấy thông tin user hiện tại
          const payload = JSON.parse(atob(token.split('.')[1]))
          setCurrentUserId(payload.nguoi_dung_id || payload.sub || "")
        } catch (error) {
          console.error("Error decoding token:", error)
          // Fallback: lấy từ localStorage hoặc call API
          setCurrentUserId("")
        }
      }
    }
  }, [isOpen])

  // Tải danh sách bạn bè từ API
  const fetchFriends = useCallback(async () => {
    const token = Cookies.get("token")
    console.log("Token từ cookie:", token)

    if (!token || token === "null" || token === "undefined") {
      console.warn("Không có token → chuyển về /login")
      router.replace("/login")
      return
    }

    try {
      const res = await axios.get(
        "https://travel-planner-imdw.onrender.com/api/ban-be",
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      )

      // ✅ Backend trả về { message: '...', data: rows }
      const data = res.data?.data || []
      console.log("✅ Raw Friends API Response:", res.data)
      console.log("✅ Friends data array:", data)

      const mapped: Friend[] = data.map((item: any) => ({
        id: String(item.id ?? ""),
        nguoi_dung_id: String(item.nguoi_dung_id ?? ""),
        ho_ten: item.ho_ten ?? "",
        email: item.email ?? "",
        avatar_url: item.avatar_url || "/placeholder-user.jpg",
        trang_thai: item.trang_thai ?? "",
        status: mapTrangThaiToStatus(item.trang_thai),
        created_at: item.tao_luc ?? item.created_at ?? undefined,
      }))

      setFriends(mapped)
      console.log("✅ Mapped friends:", mapped)
    } catch (error: any) {
      console.error("❌ Lỗi khi tải danh sách bạn bè:", error)
      if (axios.isAxiosError(error) && error.response?.status === 401) {
        toast.error("Phiên đăng nhập đã hết hạn")
        router.replace("/login")
      } else {
        toast.error(
          error.response?.data?.message ||
          error.message ||
          "Không thể tải danh sách bạn bè"
        )
      }
    }
  }, [router])

  // Gọi API khi mở modal hoặc chuyển sang tab Bạn bè
  useEffect(() => {
    if (!isOpen) return
    if (activeTab === "friends") {
      fetchFriends()
    }
  }, [isOpen, activeTab, fetchFriends])

  // Map trạng thái API sang status nội bộ
  const mapTrangThaiToStatus = (trang_thai?: string): Friend["status"] => {
    if (!trang_thai) return undefined
    const lower = trang_thai.toLowerCase()
    if (lower.includes("cho") || lower.includes("pending") || lower.includes("dang cho")) return "pending_received"
    if (lower.includes("ban") || lower.includes("friend")) return "friend"
    if (lower.includes("chan") || lower.includes("block")) return "blocked"
    return undefined
  }

  // Lấy danh sách lời mời đã gửi
  const fetchSentRequests = useCallback(async () => {
    const token = Cookies.get("token")
    console.log("Token từ cookie:", token)

    if (!token || token === "null" || token === "undefined") {
      console.warn("Không có token → chuyển về /login")
      router.replace("/login")
      return
    }

    try {
      const res = await axios.get(
        "https://travel-planner-imdw.onrender.com/api/ban-be/loi-moi/da-gui",
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      )

      // API shape theo yêu cầu
      const data = Array.isArray(res.data?.data) ? res.data.data : res.data?.danh_sach || []
      const mapped = (data || []).map((x: any) => ({
        ban_be_id: String(x.ban_be_id ?? x.id ?? ""),
        nguoi_gui_id: String(x.nguoi_gui_id ?? ""),
        nguoi_nhan_id: String(x.nguoi_nhan_id ?? x.nguoi_dung_id ?? ""),
        trang_thai: String(x.trang_thai ?? "pending"),
        ho_ten: x.ho_ten ?? "",
        email: x.email ?? "",
        avatar_url: x.avatar_url || "/placeholder-user.jpg",
      }))
      setSentRequests(mapped)
    } catch (error: any) {
      console.error("❌ Lỗi khi tải lời mời đã gửi:", error)
      if (axios.isAxiosError(error) && error.response?.status === 401) {
        toast.error("Phiên đăng nhập đã hết hạn")
        router.replace("/login")
      }
    }
  }, [router])

  // Tải danh sách lời mời kết bạn
  const fetchFriendRequests = useCallback(async () => {
    const token = Cookies.get("token")
    console.log("Token từ cookie:", token)

    if (!token || token === "null" || token === "undefined") {
      console.warn("Không có token → chuyển về /login")
      router.replace("/login")
      return
    }

    try {
      const res = await axios.get(
        "https://travel-planner-imdw.onrender.com/api/ban-be/loi-moi",
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      )

      // ✅ Backend trả về { message: '...', data: rows }
      const data = res.data?.data || []
      console.log("✅ Raw API Response:", res.data)
      console.log("✅ Data array:", data)

      const mapped: Friend[] = data.map((item: any) => ({
        id: String(item.id ?? ""),
        nguoi_dung_id: String(item.nguoi_dung_id ?? ""),
        ho_ten: item.ho_ten ?? "",
        email: item.email ?? "",
        avatar_url: item.avatar_url || "/placeholder-user.jpg",
        status: mapTrangThaiToStatus(item.trang_thai),
        created_at: item.tao_luc ?? item.created_at ?? undefined,
      }))

      setFriendRequests(mapped)
      console.log("✅ Mapped friend requests:", mapped)
    } catch (error: any) {
      console.error("❌ Lỗi khi tải lời mời kết bạn:", error)
      if (axios.isAxiosError(error) && error.response?.status === 401) {
        toast.error("Phiên đăng nhập đã hết hạn")
        router.replace("/login")
      } else {
        toast.error(
          error.response?.data?.message ||
          error.message ||
          "Không thể tải lời mời"
        )
      }
    }
  }, [router]) // 👈 Đóng ngoặc đầy đủ


  // Gọi API khi mở modal hoặc chuyển sang tab Lời mời
  useEffect(() => {
    if (!isOpen) return
    if (activeTab === "requests") {
      fetchFriendRequests()
    }
    if (activeTab === "search") {
      fetchSentRequests()
    }
  }, [isOpen, activeTab, fetchFriendRequests, fetchSentRequests])

  // Cleanup timeout khi component unmount
  useEffect(() => {
    return () => {
      if (searchTimeout) {
        clearTimeout(searchTimeout)
      }
    }
  }, [searchTimeout])

  // Hàm tìm kiếm thực tế
  const performSearch = useCallback(async (keyword: string) => {
    if (!keyword.trim()) {
      setSearchResults([])
      return
    }

    setLoading(true)

    try {
      // ✅ Kiểm tra token đúng cách
      const token = Cookies.get("token")
      console.log("Token từ cookie:", token)

      if (!token || token === "null" || token === "undefined") {
        console.warn("Không có token → chuyển về /login")
        toast.error("Vui lòng đăng nhập lại")
        router.replace("/login")
        return
      }

      // Call API tìm kiếm người dùng
      const response = await axios.get(
        `https://travel-planner-imdw.onrender.com/api/ban-be/tim-kiem?tu_khoa=${encodeURIComponent(keyword)}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      )

      console.log("Search API Response:", response.data)

      // Lấy tất cả kết quả từ response
      let results: SearchResult[] = []

      // Kiểm tra cấu trúc response từ API
      if (response.data && response.data.danh_sach && Array.isArray(response.data.danh_sach)) {
        // API trả về { danh_sach: [...] }
        results = response.data.danh_sach.map((user: any) => ({
          nguoi_dung_id: user.nguoi_dung_id,
          ho_ten: user.ho_ten,
          email: user.email,
          avatar_url: user.avatar_url || "/placeholder-user.jpg"
        }))
        console.log(`✅ Tìm thấy ${results.length} kết quả từ danh_sach:`, results)
      } else if (response.data && Array.isArray(response.data)) {
        // Fallback: nếu API trả về array trực tiếp
        results = response.data.map((user: any) => ({
          nguoi_dung_id: user.nguoi_dung_id,
          ho_ten: user.ho_ten,
          email: user.email,
          avatar_url: user.avatar_url || "/placeholder-user.jpg"
        }))
        console.log(`✅ Tìm thấy ${results.length} kết quả từ array trực tiếp:`, results)
      } else if (response.data?.data && Array.isArray(response.data.data)) {
        // Fallback: nếu API trả về { data: [...] }
        results = response.data.data.map((user: any) => ({
          nguoi_dung_id: user.nguoi_dung_id,
          ho_ten: user.ho_ten,
          email: user.email,
          avatar_url: user.avatar_url || "/placeholder-user.jpg"
        }))
        console.log(`✅ Tìm thấy ${results.length} kết quả từ data:`, results)
      } else {
        console.log("⚠️ Không tìm thấy kết quả nào trong response")
      }

      setSearchResults(results)
    } catch (error: any) {
      console.error("Lỗi khi tìm kiếm người dùng:", error)

      if (axios.isAxiosError(error)) {
        if (error.response?.status === 401) {
          toast.error("Phiên đăng nhập đã hết hạn")
          router.replace("/login")
        } else if (error.response?.status === 404) {
          setSearchResults([])
          console.log("Không tìm thấy người dùng nào")
        } else {
          console.error(`Lỗi: ${error.response?.data?.message || error.message}`)
          toast.error(error.response?.data?.message || "Có lỗi xảy ra khi tìm kiếm")
        }
      } else {
        console.error("Có lỗi xảy ra khi tìm kiếm")
        toast.error("Có lỗi xảy ra khi tìm kiếm")
      }
      setSearchResults([])
    } finally {
      setLoading(false)
    }
  }, [router])

  // Debounced search - tự động tìm kiếm sau 500ms khi người dùng ngừng gõ
  const handleSearchInputChange = (value: string) => {
    console.log("Search input changed:", value)
    setSearchKeyword(value)

    // Clear timeout cũ nếu có
    if (searchTimeout) {
      clearTimeout(searchTimeout)
    }

    // Nếu input rỗng, clear kết quả ngay lập tức
    if (!value.trim()) {
      setSearchResults([])
      setLoading(false)
      return
    }

    // Set timeout mới để tìm kiếm sau 500ms
    const newTimeout = setTimeout(() => {
      console.log("Performing search for:", value)
      performSearch(value)
    }, 500)

    setSearchTimeout(newTimeout)
  }

  // Hàm tìm kiếm thủ công (khi nhấn nút hoặc Enter)
  const handleSearchUser = () => {
    if (!searchKeyword.trim()) {
      toast.error("Vui lòng nhập tên người dùng")
      return
    }

    // Clear timeout nếu có
    if (searchTimeout) {
      clearTimeout(searchTimeout)
    }

    // Tìm kiếm ngay lập tức
    performSearch(searchKeyword)
  }
 // Hủy lời mời kết bạn đã gửi
const handleCancelSentRequest = async (relationshipId: string) => {
 // 1. Lấy token và kiểm tra
 const token = Cookies.get("token")
 if (!token || token === "null" || token === "undefined") {
 toast.error("Vui lòng đăng nhập lại")
 router.replace("/login")
 return
 }
  
 // 2. Gọi API DELETE với ID của mối quan hệ
 // API này (huyKetBan) sẽ xóa bản ghi khỏi bảng ban_be
 try {
 const response = await axios.delete(
 // Dùng API xóa quan hệ
 `https://travel-planner-imdw.onrender.com/api/ban-be/${relationshipId}`, 
 {
headers: {
Authorization: `Bearer ${token}`,
"Content-Type": "application/json",
},
 }
 )
  
 // 3. Cập nhật UI khi thành công
 if (response.status === 200) {
 // Cập nhật lại state của "lời mời đã gửi"
 setSentRequests(prev => prev.filter(req => req.ban_be_id !== relationshipId))
 toast.success("Đã hủy lời mời kết bạn")
 } else {
 toast.error(response.data?.message || "Hủy lời mời không thành công")
 }
 
 } catch (error: any) {
 // 4. Xử lý lỗi
 console.error("❌ Lỗi khi hủy lời mời:", error)
 if (axios.isAxiosError(error) && error.response?.status === 401) {
 toast.error("Phiên đăng nhập đã hết hạn")
router.replace("/login")
 } else if (axios.isAxiosError(error) && error.response?.status === 404) {
 toast.error("Không tìm thấy lời mời để hủy")
 } else {
 toast.error(
error.response?.data?.message ||
error.message ||
"Không thể hủy lời mời"
 )
 }
 }
 }
  
  // Gửi lời mời kết bạn
  const handleSendFriendRequest = useCallback(async (userId: string) => {
    try {
      // ✅ Kiểm tra token đúng cách
      const token = Cookies.get("token")
      console.log("Token từ cookie:", token)

      if (!token || token === "null" || token === "undefined") {
        console.warn("Không có token → chuyển về /login")
        toast.error("Vui lòng đăng nhập lại")
        router.replace("/login")
        return
      }

      if (!currentUserId) {
        toast.error("Không thể xác định người dùng hiện tại")
        return
      }

      // Call API gửi lời mời kết bạn
      const response = await axios.post(
        "https://travel-planner-imdw.onrender.com/api/ban-be/gui-loi-moi",
        {
          ban_be_id: userId // Backend chỉ cần ban_be_id, nguoi_dung_id lấy từ token
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      )

      console.log("Send friend request response:", response.data)

      // Backend trả về 201 cho success
      if (response.status === 201) {
        toast.success("Đã gửi lời mời kết bạn")
        // Refresh danh sách lời mời đã gửi
        fetchSentRequests()
        // Không xóa kết quả để người dùng có thể gửi tiếp cho người khác
      } else if (response.data?.message === 'Đã có quan hệ trước đó') {
        toast.info(`Đã có quan hệ trước đó (${response.data.trang_thai})`)
        // Refresh danh sách lời mời đã gửi
        fetchSentRequests()
      }
    } catch (error: any) {
      console.error("Lỗi khi gửi lời mời kết bạn:", error)

      if (axios.isAxiosError(error)) {
        if (error.response?.status === 401) {
          toast.error("Phiên đăng nhập đã hết hạn")
          router.replace("/login")
        } else if (error.response?.status === 400) {
          const message = error.response.data.message || "Dữ liệu không hợp lệ"
          if (message.includes("Thiếu ban_be_id")) {
            toast.error("Không tìm thấy người dùng để gửi lời mời")
          } else if (message.includes("Không thể kết bạn với chính mình")) {
            toast.error("Bạn không thể kết bạn với chính mình")
          } else {
            toast.error(message)
          }
        } else if (error.response?.status === 201) {
          // Backend trả về 201 cho success case
          toast.success("Đã gửi lời mời kết bạn")
          // Refresh danh sách lời mời đã gửi
          fetchSentRequests()
        } else {
          toast.error(`Lỗi: ${error.response?.data?.message || error.message}`)
        }
      } else {
        toast.error("Có lỗi xảy ra khi gửi lời mời")
      }
    }
  }, [router, fetchSentRequests, currentUserId])

  // Chấp nhận lời mời kết bạn
  const handleAcceptFriendRequest = async (requestId: string | undefined) => {
    try {
      if (!requestId) return
      const token = Cookies.get("token")
      if (!token || token === "null" || token === "undefined") {
        toast.error("Vui lòng đăng nhập lại")
        router.replace("/login")
        return
      }

      await axios.patch(
        `https://travel-planner-imdw.onrender.com/api/ban-be/${requestId}/tra-loi`,
        { action: 'accept' },
        { headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" } }
      )

      // Cập nhật UI: chuyển lời mời sang danh sách bạn bè
      setFriendRequests(prev => prev.filter(req => req.id !== requestId))
      const accepted = friendRequests.find(req => req.id === requestId)
      if (accepted) {
        setFriends(prev => [...prev, { ...accepted, status: "friend" as const }])
      }
      toast.success("Đã chấp nhận lời mời kết bạn")
    } catch (error: any) {
      if (axios.isAxiosError(error) && error.response?.status === 401) {
        toast.error("Phiên đăng nhập đã hết hạn")
        router.replace("/login")
      } else {
        toast.error(error.response?.data?.message || error.message || "Không thể chấp nhận lời mời")
      }
    }
  }

  // Từ chối lời mời kết bạn
  const handleRejectFriendRequest = async (requestId: string | undefined) => {
    try {
      if (!requestId) return
      const token = Cookies.get("token")
      if (!token || token === "null" || token === "undefined") {
        toast.error("Vui lòng đăng nhập lại")
        router.replace("/login")
        return
      }

      await axios.patch(
        `https://travel-planner-imdw.onrender.com/api/ban-be/${requestId}/tra-loi`,
        { action: 'reject' },
        { headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" } }
      )

      setFriendRequests(prev => prev.filter(req => req.id !== requestId))
      toast.success("Đã từ chối lời mời kết bạn")
    } catch (error: any) {
      if (axios.isAxiosError(error) && error.response?.status === 401) {
        toast.error("Phiên đăng nhập đã hết hạn")
        router.replace("/login")
      } else {
        toast.error(error.response?.data?.message || error.message || "Không thể từ chối lời mời")
      }
    }
  }

  // Chặn người dùng
  const handleBlockUser = async (relationshipId: string) => {
    // 1. Lấy token và kiểm tra
    const token = Cookies.get("token")
    if (!token || token === "null" || token === "undefined") {
      toast.error("Vui lòng đăng nhập lại")
      router.replace("/login")
      return
    }
    try {
      await axios.patch(
        `https://travel-planner-imdw.onrender.com/api/ban-be/${relationshipId}/chan`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      )
      // Xóa khỏi danh sách bạn bè UI (nếu muốn)
      setFriends(prev => prev.filter(f => f.id !== relationshipId && f.nguoi_dung_id !== relationshipId))
      toast.success("Đã chặn người dùng")
    } catch (error: any) {
      console.error("❌ Lỗi khi chặn bạn bè:", error)
      if (axios.isAxiosError(error) && error.response?.status === 401) {
        toast.error("Phiên đăng nhập đã hết hạn")
        router.replace("/login")
      } else {
        toast.error(error.response?.data?.message || error.message || "Không thể chặn người dùng")
      }
    }
  }

  // Xóa bạn
  // Xóa bạn
  const handleRemoveFriend = async (relationshipId: string) => {
    // 1. Lấy token và kiểm tra
    const token = Cookies.get("token")
    if (!token || token === "null" || token === "undefined") {
      toast.error("Vui lòng đăng nhập lại")
      router.replace("/login")
      return
    }

    // 2. Gọi API DELETE với đúng ID của mối quan hệ
    try {
      // Backend của bạn cần :id (ID của mối quan hệ), không phải ID người dùng
      const response = await axios.delete(
        `https://travel-planner-imdw.onrender.com/api/ban-be/${relationshipId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      )

      // 3. Cập nhật UI khi thành công
      if (response.status === 200) {
        // Lọc ra người bạn dựa trên relationshipId (chính là friend.id)
        setFriends(prev => prev.filter(f => f.id !== relationshipId))
        toast.success("Đã xóa bạn thành công")
      } else {
        toast.error(response.data?.message || "Xóa bạn không thành công")
      }

    } catch (error: any) {
      // 4. Xử lý lỗi
      console.error("❌ Lỗi khi xóa bạn:", error)
      if (axios.isAxiosError(error) && error.response?.status === 401) {
        toast.error("Phiên đăng nhập đã hết hạn")
        router.replace("/login")
      } else if (axios.isAxiosError(error) && error.response?.status === 404) {
        // Lỗi này xảy ra khi bạn gửi sai ID
        toast.error("Không tìm thấy mối quan hệ bạn bè để xóa")
      } else {
        toast.error(
          error.response?.data?.message ||
          error.message ||
          "Không thể xóa bạn"
        )
      }
    }
  }


  // Hủy lời mời kết bạn đã gửi
  const handleCancelFriendRequest = (userId: string) => {
    // Mock hủy lời mời - trong thực tế sẽ call API DEL
    setFriends(prev => prev.filter(f => f.nguoi_dung_id !== userId))
    toast.success("Đã hủy lời mời kết bạn")
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Quản lý bạn bè
          </DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="friends">Bạn bè ({friends.length})</TabsTrigger>
            <TabsTrigger value="requests">Lời mời ({friendRequests.length})</TabsTrigger>
            <TabsTrigger value="search">Tìm kiếm</TabsTrigger>
          </TabsList>

          {/* bạn bè */}
          <TabsContent value="friends" className="space-y-4">
            <div className="max-h-96 overflow-y-auto space-y-3">
              {friends.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Chưa có bạn bè nào</p>
                </div>
              ) : (
                friends.map((friend) => (
                  <div key={friend.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center space-x-3">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={friend.avatar_url} alt={friend.ho_ten} />
                        <AvatarFallback>{friend.ho_ten.slice(0, 2).toUpperCase()}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">{friend.ho_ten}</p>
                        <p className="text-sm text-muted-foreground">{friend.email}</p>
                        {/* <p className="text-xs text-muted-foreground">
                          Kết bạn: {friend.created_at ? new Date(friend.created_at).toLocaleDateString("vi-VN") : "N/A"}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Trạng thái: {friend.trang_thai}
                        </p> */}
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge variant="secondary">Bạn bè</Badge>
                       <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleBlockUser(friend.id)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Ban className="h-4 w-4 mr-1" />
                        Chặn
                      </Button> 
                      <Button
                        variant="outline"
                        size="sm"
                        // SỬA Ở ĐÂY: Dùng friend.id (ID của mối quan hệ)
                        // không dùng friend.nguoi_dung_id
                        onClick={() => handleRemoveFriend(friend.id)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4 mr-1" />
                        Xóa bạn
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </TabsContent>


          {/*  Lời mời kết bạn */}
          <TabsContent value="requests" className="space-y-4">
            <div className="max-h-96 overflow-y-auto space-y-3">
              {friendRequests.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <UserPlus className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Không có lời mời kết bạn nào</p>
                </div>
              ) : (
                friendRequests.map((request) => (
                  <div key={request.id || request.nguoi_dung_id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center space-x-3">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={request.avatar_url} alt={request.ho_ten} />
                        <AvatarFallback>{request.ho_ten.slice(0, 2).toUpperCase()}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">{request.ho_ten}</p>
                        <p className="text-sm text-muted-foreground">{request.email}</p>
                        <p className="text-xs text-muted-foreground">
                          Gửi lời mời: {request.created_at ? new Date(request.created_at).toLocaleDateString("vi-VN") : "N/A"}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge variant="outline">Chờ phản hồi</Badge>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleAcceptFriendRequest(request.id)}
                        className="text-green-600 hover:text-green-700"
                      >
                        <Check className="h-4 w-4 mr-1" />
                        Chấp nhận
                      </Button>
                      {/* <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleRejectFriendRequest(request.id)}
                        className="text-destructive hover:text-destructive"
                      >
                        <X className="h-4 w-4 mr-1" />
                        Từ chối
                      </Button> */}
                    </div>
                  </div>
                ))
              )}
            </div>
          </TabsContent>

          {/* Tab Tìm kiếm */}
          <TabsContent value="search" className="space-y-4">
            <div className="space-y-4">
              {/* Thanh tìm kiếm */}
              <div className="space-y-2">
                <div className="flex space-x-2">
                  <Input
                    placeholder="Nhập tên, email người dùng để tìm kiếm..."
                    value={searchKeyword}
                    onChange={(e) => handleSearchInputChange(e.target.value)}
                    onKeyPress={(e) => e.key === "Enter" && handleSearchUser()}
                  />
                  <Button onClick={handleSearchUser} disabled={loading}>
                    <Search className="h-4 w-4 mr-2" />
                    {/* thanh tìm kiếm */}
                    {loading ? "Đang tìm..." : ""}
                  </Button>
                </div>
                {searchKeyword && !loading && searchResults.length === 0 && (
                  <p className="text-sm text-muted-foreground">💡 Nhập từ khóa để tìm kiếm...</p>
                )}
                {loading && (
                  <p className="text-sm text-muted-foreground">🔍 Đang tìm kiếm...</p>
                )}
                {!loading && searchKeyword && searchResults.length === 0 && (
                  <p className="text-sm text-muted-foreground">❌ Không tìm thấy kết quả nào</p>
                )}
              </div>

              {/* Kết quả tìm kiếm */}
              {searchResults.length > 0 && (
                <div className="space-y-2">
                  <p className="text-sm font-medium">Kết quả tìm kiếm ({searchResults.length})</p>
                  <div className="max-h-64 overflow-y-auto space-y-2">
                    {searchResults.map((result) => {
                      const hasSentRequest = sentRequests.some(
                        (req) =>
                          req.nguoi_nhan_id === result.nguoi_dung_id ||
                          req.ho_ten === result.ho_ten ||
                          req.email === result.email
                      )
                      const isFriend = friends.some(
                        (f) => f.nguoi_dung_id === result.nguoi_dung_id
                      )

                      return (
                        <div
                          key={result.nguoi_dung_id}
                          className="flex items-center justify-between p-3 border rounded-lg"
                        >
                          <div className="flex items-center space-x-3">
                            <Avatar className="h-10 w-10">
                              <AvatarImage
                                src={result.avatar_url}
                                alt={result.ho_ten}
                              />
                              <AvatarFallback>
                                {result.ho_ten.slice(0, 2).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-medium">{result.ho_ten}</p>
                              <p className="text-sm text-muted-foreground">{result.email}</p>
                              <p className="text-xs text-muted-foreground">
                                ID: {result.nguoi_dung_id}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            {isFriend ? (
                              <Badge variant="secondary">✅ Bạn bè</Badge>
                            ) : hasSentRequest ? (
                              <Badge variant="outline">✅ Đã gửi lời mời</Badge>
                            ) : (
                              <Button
                                onClick={() => handleSendFriendRequest(result.nguoi_dung_id)}
                                className="bg-primary hover:bg-primary/90"
                                size="sm"
                              >
                                <UserPlus className="h-4 w-4 mr-1" />
                                Gửi lời mời
                              </Button>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* Danh sách lời mời đã gửi */}
              {sentRequests.length > 0 && (
                <div className="space-y-2">
                  <p className="text-sm font-medium">Lời mời đã gửi ({sentRequests.length})</p>
                  <div className="max-h-64 overflow-y-auto space-y-2">
                    {sentRequests.map((req) => (
                      <div
                        key={`${req.ban_be_id}-${req.nguoi_nhan_id}`}
                        className="flex items-center justify-between p-3 border rounded-lg"
                      >
                        <div className="flex items-center space-x-3">
                          <Avatar className="h-10 w-10">
                            <AvatarImage src={req.avatar_url} alt={req.ho_ten} />
                            <AvatarFallback>
                              {(req.ho_ten || "??").slice(0, 2).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium">
                              {req.ho_ten || `ID: ${req.nguoi_nhan_id}`}
                            </p>
                            <p className="text-sm text-muted-foreground">{req.email}</p>
                            <p className="text-xs text-muted-foreground">
                              Trạng thái: {req.trang_thai}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Badge variant="outline">Đã gửi</Badge>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleCancelSentRequest(req.ban_be_id)}
                            className="text-destructive hover:text-destructive"
                          >
                            <X className="h-4 w-4 mr-1" />
                            Hủy lời mời
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </TabsContent>

        </Tabs>
      </DialogContent>
    </Dialog>
  )
}
