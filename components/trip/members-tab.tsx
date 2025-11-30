"use client"

import { useState, useEffect } from "react"
import axios from "axios"
import Cookies from "js-cookie"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Plus, Link, Users, Crown, User, Clock, MoreVertical, Shield, UserMinus, Settings } from "lucide-react"
import { InviteMemberModal } from "@/components/members/invite-member-modal"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useToast } from "@/hooks/use-toast"
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"

interface MembersTabProps {
  members: any[]
  tripId: string
  currentUserId?: string
}

interface Member {
  id: string
  nguoi_dung_id: string | number
  name: string
  ho_ten: string
  email: string
  avatar_url: string
  role: string
  vai_tro: string
  status: string
  trang_thai_tham_gia: string
  tham_gia_luc?: string
  la_ban_be?: boolean | number
  bi_chan?: boolean | number
}

export function MembersTab({ members: initialMembers, tripId, currentUserId }: MembersTabProps) {
  const [showInviteModal, setShowInviteModal] = useState(false)
  const { toast } = useToast()
  const [inviteInfo, setInviteInfo] = useState<{
    ma_code: string
    invite_link: string
    qr_code: string
    backend_link?: string
  } | null>(null)
  const [creatingInvite, setCreatingInvite] = useState(false)
  const [showFriendsModal, setShowFriendsModal] = useState(false)
  const [friendList, setFriendList] = useState<any[]>([])
  const [loadingFriends, setLoadingFriends] = useState(false)
  const [showPendingModal, setShowPendingModal] = useState(false)
  const [pendingList, setPendingList] = useState<any[]>([])
  const [loadingPending, setLoadingPending] = useState(false)
  const [members, setMembers] = useState<Member[]>([])
  const [loadingMembers, setLoadingMembers] = useState(false)
  const [showMembersModal, setShowMembersModal] = useState(false)
  const [membersCount, setMembersCount] = useState(0)
  const [showPreviewModal, setShowPreviewModal] = useState(false)
  const [loadingPreview, setLoadingPreview] = useState(false)
  const [previewInfo, setPreviewInfo] = useState<any | null>(null)
  const [previewError, setPreviewError] = useState<string | null>(null)

  // ✅ Fetch danh sách thành viên từ API
  useEffect(() => {
    const fetchMembers = async () => {
      const token = Cookies.get("token")
      if (!token || token === "null" || token === "undefined") {
        console.warn("Không có token để lấy danh sách thành viên")
        return
      }

      setLoadingMembers(true)
      try {
        const response = await axios.get(
          `https://travel-planner-imdw.onrender.com/api/thanh-vien/${tripId}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          }
        )

        // Backend trả về: { message, tong_so, danh_sach: [...] }
        const apiData = response.data?.danh_sach || []
        const tongSo = response.data?.tong_so || 0
        setMembersCount(tongSo)

        // Map API response to component format
        const mappedMembers: Member[] = apiData.map((item: any) => ({
          id: String(item.nguoi_dung_id || ""),
          nguoi_dung_id: item.nguoi_dung_id,
          name: item.ho_ten || "",
          ho_ten: item.ho_ten || "",
          email: item.email || "",
          avatar_url: item.avatar_url && item.avatar_url !== "null" ? item.avatar_url : "/placeholder-user.jpg",
          role: item.vai_tro === "owner" ? "owner" : item.vai_tro === "admin" ? "admin" : "member",
          vai_tro: item.vai_tro || "member",
          status: item.trang_thai_tham_gia === "accepted" ? "accepted" : item.trang_thai_tham_gia === "pending" ? "pending" : "declined",
          trang_thai_tham_gia: item.trang_thai_tham_gia || "pending",
          tham_gia_luc: item.tham_gia_luc || "",
          la_ban_be: Boolean(item.la_ban_be),
          bi_chan: Boolean(item.bi_chan),
        }))

        setMembers(mappedMembers)
      } catch (error: any) {
        console.error("❌ Lỗi khi lấy danh sách thành viên:", error)
        toast({
          title: "Lỗi",
          description: error.response?.data?.message || error.message || "Không thể tải danh sách thành viên",
          variant: "destructive",
        })
      } finally {
        setLoadingMembers(false)
      }
    }

    if (tripId) {
      fetchMembers()
    }
  }, [tripId, toast])


  const currentUser = members.find((m) => String(m.nguoi_dung_id) === String(currentUserId))
  const isOwner = currentUser?.role === "owner" || currentUser?.vai_tro === "owner"
  const canManageMembers = isOwner

  const getRoleIcon = (role: string) => {
    return role === "owner" ? <Crown className="h-4 w-4 text-yellow-500" /> : <User className="h-4 w-4" />
  }

  const getRoleLabel = (role: string) => {
    return role === "owner" ? "Chủ chuyến đi" : "Thành viên"
  }

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      accepted: { label: "Đã tham gia", variant: "default" as const },
      pending: { label: "Chờ phản hồi", variant: "secondary" as const },
      declined: { label: "Từ chối", variant: "destructive" as const },
    }
    return statusConfig[status as keyof typeof statusConfig] || statusConfig.pending
  }

  const handleCreateInviteLink = async () => {
    if (inviteInfo) {
      toast({ title: "Đã có link mời", description: "Link chỉ được tạo một lần." })
      return
    }
    const token = Cookies.get("token")
    if (!token || token === "null" || token === "undefined") {
      toast({ title: "Phiên đăng nhập hết hạn", description: "Vui lòng đăng nhập lại", variant: "destructive" })
      return
    }
    try {
      setCreatingInvite(true)
      const res = await axios.post(
        "https://travel-planner-imdw.onrender.com/api/moi-thanh-vien/tao",
        { chuyen_di_id: tripId, expireDays: 7 },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      )
      const data = res.data || {}
      if (data && (data.invite_link || data.ma_code)) {
        // ✅ Ưu tiên dùng link từ backend, nhưng đảm bảo dùng /invite/ thay vì /join/
        // Nếu không có, mới tự tạo với domain production
        const productionDomain = "https://do-an-04.vercel.app"
        let shareLink = data?.invite_link || ""

        // ✅ Nếu backend trả về link với /join/, thay thế thành /invite/
        if (shareLink && shareLink.includes("/join/")) {
          shareLink = shareLink.replace("/join/", "/invite/")
        }

        // ✅ Nếu không có link từ backend, tự tạo với /invite/
        if (!shareLink && data?.ma_code) {
          shareLink = `${productionDomain}/invite/${data.ma_code}`
        }

        setInviteInfo({
          ma_code: data.ma_code || "",
          invite_link: shareLink,
          backend_link: data.invite_link || "",
          qr_code: data.qr_code || "",
        })
        toast({ title: "Tạo mã mời thành công", description: data.message || "Đã tạo link mời." })
      } else {
        toast({ title: "Không nhận được dữ liệu hợp lệ", variant: "destructive" })
      }
    } catch (error: any) {
      const message = error?.response?.data?.message || error?.message || "Không thể tạo link mời"
      toast({ title: "Lỗi", description: message, variant: "destructive" })
    } finally {
      setCreatingInvite(false)
    }
  }
  
  // LẤY LINK MỜI TỰ ĐỘNG KHI LOAD TRANG
  useEffect(() => {
    const fetchExistingInvite = async () => {
      const token = Cookies.get("token")
      if (!token || token === "null" || token === "undefined") {
        return // Không có token thì thôi
      }

      try {
        const res = await axios.get(
          `https://travel-planner-imdw.onrender.com/api/moi-thanh-vien/${tripId}/invites`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          }
        )

        // Backend trả về: { chuyen_di_id, invites: [{ ma_code, tao_luc, het_han }] }
        const invites = res.data?.invites || []
        if (invites.length > 0) {
          const latest = invites[0] // Lấy invite đầu tiên (mới nhất)
          const maCode = latest.ma_code

          if (maCode) {
            const fullLink = `https://do-an-04.vercel.app/invite/${maCode}`
            setInviteInfo({
              ma_code: maCode,
              invite_link: fullLink,
              qr_code: "",
              backend_link: undefined,
            })
          }
        }
      } catch (err: any) {
        // Nếu lỗi (ví dụ: chưa có invite, 404, v.v.) → im lặng, không báo lỗi cho user
        console.log("Chưa có link mời hoặc lỗi khi lấy:", err.response?.status)
      }
    }

    if (tripId) {
      fetchExistingInvite()
    }
  }, [tripId])
// ----------------------------------------------------------------------------------------------


  const handlePreviewInvite = async () => {
    const inviteLink = inviteInfo?.invite_link?.trim()
    const maCodeFromLink = inviteLink ? inviteLink.split("/").filter(Boolean).pop() : ""
    const maCode = (inviteInfo?.ma_code || maCodeFromLink || "").trim()

    if (!maCode) {
      toast({ title: "Thiếu mã mời", description: "Không tìm thấy mã mời để xem trước", variant: "destructive" })
      return
    }

    setShowPreviewModal(true)
    setLoadingPreview(true)
    setPreviewInfo(null)
    setPreviewError(null)

    try {
      const token = Cookies.get("token")
      const headers: Record<string, string> = {}
      if (token && token !== "null" && token !== "undefined") {
        headers.Authorization = `Bearer ${token}`
      }

      const res = await axios.get(
        `https://travel-planner-imdw.onrender.com/api/moi-thanh-vien/xem-truoc/${maCode}`,
        { headers },
      )
      setPreviewInfo(res.data)
    } catch (err: any) {
      const message = err?.response?.data?.message || err?.message || "Không thể xem trước chuyến đi"
      setPreviewError(message)
      toast({ title: "Lỗi", description: message, variant: "destructive" })
    } finally {
      setLoadingPreview(false)
    }
  }

  const handleCopyInvite = async () => {
    const text = inviteInfo?.invite_link || ""
    if (!text) return
    try {
      await navigator.clipboard.writeText(text)
      toast({ title: "Đã sao chép link mời" })
    } catch {
      toast({ title: "Không thể sao chép", variant: "destructive" })
    }
  }

  const handlePromoteToOwner = (memberId: string, memberName: string) => {
    toast({
      title: "Chuyển quyền chủ chuyến đi",
      description: `${memberName} đã được chuyển thành chủ chuyến đi`,
    })
  }

  const handleRemoveMember = (memberId: string, memberName: string) => {
    toast({
      title: "Đã xóa thành viên",
      description: `${memberName} đã được xóa khỏi chuyến đi`,
      variant: "destructive",
    })
  }

  const handleChangeRole = (memberId: string, memberName: string, newRole: string) => {
    const roleLabel = newRole === "owner" ? "chủ chuyến đi" : "thành viên"
    toast({
      title: "Đã thay đổi vai trò",
      description: `${memberName} đã được chuyển thành ${roleLabel}`,
    })
  }

  const handleShowFriends = async () => {
    setShowFriendsModal(true)
    setLoadingFriends(true)
    try {
      const token = Cookies.get("token")
      if (!token || token === "null" || token === "undefined") throw new Error("Vui lòng đăng nhập lại")
      const res = await axios.get("https://travel-planner-imdw.onrender.com/api/ban-be", {
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      })
      const list = Array.isArray(res.data?.data) ? res.data.data : []
      setFriendList(list.filter((f: any) => f.trang_thai?.toLowerCase?.() === "accepted"))
    } catch {
      setFriendList([])
    } finally {
      setLoadingFriends(false)
    }
  }

  const handleShowPendingRequests = async () => {
    setShowPendingModal(true)
    setLoadingPending(true)
    try {
      const token = Cookies.get("token")
      console.log('[PendingRequests] token:', token, 'tripId:', tripId)
      if (!token || token === "null" || token === "undefined") throw new Error("Vui lòng đăng nhập lại")
      const res = await axios.get(
        `https://travel-planner-imdw.onrender.com/api/moi-thanh-vien/${tripId}/yeu-cau`,
        { headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" } }
      )
      // Backend trả { chuyen_di_id, tong_so, yeu_cau_tham_gia: [...] }
      const list = Array.isArray(res.data?.yeu_cau_tham_gia)
        ? res.data.yeu_cau_tham_gia
        : Array.isArray(res.data?.data)
          ? res.data.data
          : Array.isArray(res.data)
            ? res.data
            : []
      setPendingList(list)
    } catch (err: any) {
      setPendingList([])
      const message = err?.response?.data?.message || err?.response?.data?.error || err?.message || "Không thể tải danh sách chờ duyệt"
      toast({ title: "Lỗi", description: message, variant: "destructive" })
    } finally {
      setLoadingPending(false)
    }
  }

  const handleApproveMember = async (nguoiDungId: number, hoTen: string) => {
    try {
      const token = Cookies.get("token")
      if (!token || token === "null" || token === "undefined") {
        toast({ title: "Phiên đăng nhập hết hạn", description: "Vui lòng đăng nhập lại", variant: "destructive" })
        return
      }
      const res = await axios.patch(
        `https://travel-planner-imdw.onrender.com/api/moi-thanh-vien/${tripId}/duyet`,
        { nguoi_dung_id: nguoiDungId, action: 'accept' },
        { headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" } }
      )
      const data = res.data
      toast({
        title: data?.message || "Đã chấp nhận thành viên tham gia",
        description: `${hoTen} đã được chấp nhận tham gia chuyến đi`,
      })
      // Xóa thành viên đã duyệt khỏi danh sách pending
      setPendingList((prev) => prev.filter((p) => (p.nguoi_dung_id || p.id) !== nguoiDungId))
    } catch (err: any) {
      const message = err?.response?.data?.message || err?.response?.data?.error || err?.message || "Không thể duyệt thành viên"
      toast({ title: "Lỗi", description: message, variant: "destructive" })
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground font-[family-name:var(--font-space-grotesk)]">
            Thành Viên Chuyến Đi
          </h2>
          <p className="text-muted-foreground font-[family-name:var(--font-dm-sans)]">
            Chỉ chủ chuyến đi mới có thể mời và quản lý thành viên
          </p>
        </div>
        {canManageMembers && (
          <Button onClick={() => setShowInviteModal(true)} className="bg-primary hover:bg-primary/90">
            <Plus className="h-4 w-4 mr-2" />
            Mời Thành Viên
          </Button>
        )}
      </div>

      {/* {!isOwner && (
        <Card className="border-yellow-200 bg-yellow-50">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-yellow-800">
              <Shield className="h-4 w-4" />
              <span className="text-sm font-medium">Chỉ chủ chuyến đi mới có thể mời và quản lý thành viên</span>
            </div>
          </CardContent>
        </Card>
      )} */}

      {/* hiển thị thành viên ra bên ngoài */}

      {/* <div className="grid gap-4">
        {members.map((member) => (
          <Card key={member.id}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={member.avatar_url} alt={member.ho_ten} />
                    <AvatarFallback className="bg-primary text-primary-foreground">
                      {member.ho_ten
                        .split(" ")
                        .map((n: string) => n[0])
                        .join("")
                        .toUpperCase()
                        .slice(0, 2)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-foreground">{member.ho_ten}</h3>
                      {getRoleIcon(member.role)}
                      {String(member.nguoi_dung_id) === String(currentUserId) && (
                        <Badge variant="outline" className="text-xs">
                          Bạn
                        </Badge>
                      )}
                      {Boolean(member.la_ban_be) && (
                        <Badge variant="secondary" className="text-xs bg-green-100 text-green-800">
                          Bạn bè
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">{member.email}</p>
                    <p className="text-xs text-muted-foreground font-medium">{getRoleLabel(member.role)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge {...getStatusBadge(member.status)}>{getStatusBadge(member.status).label}</Badge>
                  {member.status === "pending" && <Clock className="h-4 w-4 text-muted-foreground" />}
                  {canManageMembers && String(member.nguoi_dung_id) !== String(currentUserId) && member.status === "accepted" && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={() =>
                            handleChangeRole(String(member.nguoi_dung_id), member.ho_ten, member.role === "owner" ? "member" : "owner")
                          }
                        >
                          <Settings className="h-4 w-4 mr-2" />
                          {member.role === "owner" ? "Chuyển thành thành viên" : "Chuyển thành chủ"}
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => handleRemoveMember(String(member.nguoi_dung_id), member.ho_ten)}
                          className="text-destructive focus:text-destructive"
                        >
                          <UserMinus className="h-4 w-4 mr-2" />
                          Xóa khỏi chuyến đi
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div> */}

      {/* LINK THAM GIA CHUYẾN ĐI */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Link className="h-5 w-5 text-primary" />
            Link Mời Tham Gia
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* <p className="text-sm text-muted-foreground">Chia sẻ link này để mời người khác tham gia chuyến đi</p> */}
          <div className="flex gap-2 items-stretch">
            <button
              type="button"
              className="flex-1 p-3 bg-muted rounded-md text-sm font-mono overflow-x-auto whitespace-nowrap text-left transition hover:bg-muted/80 disabled:cursor-not-allowed"
              // onClick={handlePreviewInvite}
              disabled={!inviteInfo?.invite_link && !inviteInfo?.ma_code}
              title={inviteInfo?.invite_link ? "Bấm để xem tổng quan chuyến đi" : undefined}
            >
              {inviteInfo?.invite_link || "Chưa có link mời"}
            </button>

            <Button variant="outline" onClick={handleCopyInvite} disabled={!inviteInfo?.invite_link}>
              Sao chép
            </Button>
          </div>
          <Button variant="outline" className="w-full bg-transparent" onClick={handleCreateInviteLink} disabled={!!inviteInfo || creatingInvite}>
            {inviteInfo ? "Đã tạo link" : creatingInvite ? "Đang tạo..." : "Tạo Link Mới"}
          </Button>
          {/* <Button
            variant="secondary"
            className="w-full"
            disabled={!inviteInfo?.invite_link && !inviteInfo?.ma_code}
            onClick={handlePreviewInvite}
          >
            Xem tổng quan chuyến đi
          </Button> */}
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent
            className="p-4 text-center  cursor-pointer rounded-lg transition select-none"
            onClick={() => setShowMembersModal(true)}
          >
            <Users className="h-6 w-6 text-primary mx-auto mb-2" />
            <p className="text-2xl font-bold text-foreground">{loadingMembers ? "..." : membersCount}</p>
            <p className="text-sm text-muted-foreground">Tổng thành viên</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent
            className="p-4 text-center cursor-pointer rounded-lg transition select-none"
            onClick={handleShowFriends}
          >
            <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-2">
              <div className="w-3 h-3 bg-green-500 rounded-full" />
            </div>
            {/* đếm bạn b */}
            {/* <p className="text-2xl font-bold text-foreground">
             {members.filter((m) => m.status === "accepted").length}
           </p> */}
            <p className="text-sm text-muted-foreground">Mời bạn bè tham gia</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent
            className="p-4 text-center cursor-pointer rounded-lg transition select-none"
            onClick={handleShowPendingRequests}
          >
            <Clock className="h-6 w-6 text-yellow-500 mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">Xét duyệt thành viên</p>
          </CardContent>
        </Card>
      </div>

      {/* Modals */}
      {showInviteModal && <InviteMemberModal onClose={() => setShowInviteModal(false)} tripId={tripId} />}
      {/* Modal danh sách bạn bè để mời tham gia */}
      <Dialog open={showFriendsModal} onOpenChange={setShowFriendsModal}>
        <DialogContent className="max-w-lg">
          <DialogTitle>Chọn bạn bè để mời tham gia chuyến đi</DialogTitle>
          {loadingFriends ? (
            <p>Đang tải danh sách bạn bè...</p>
          ) : (
            friendList.length === 0 ? (
              <p>Bạn chưa có bạn bè nào phù hợp.</p>
            ) : (
              <div className="flex flex-col gap-3 max-h-96 overflow-y-auto">
                {friendList.map(friend => {
                  const isRealFriend = ["accepted", "ban_be", "friend"].includes(String(friend.trang_thai).toLowerCase())
                  return (
                    <div key={friend.id} className="flex items-center gap-3 border-b p-2 pb-3 last:border-0">
                      <img src={friend.avatar_url || "/placeholder-user.jpg"} alt={friend.ho_ten} className="w-8 h-8 rounded-full" />
                      <div className="flex-1">
                        <div className="font-medium">{friend.ho_ten}</div>
                        <div className="text-xs text-muted-foreground">{friend.email}</div>
                        {!isRealFriend && (
                          <div className="text-xs text-orange-500">Chưa xác nhận kết bạn</div>
                        )}
                      </div>
                      {isRealFriend ? (
                        <Button
                          size="sm"
                          onClick={async () => {
                            try {
                              const token = Cookies.get('token')
                              if (!token || token === 'null' || token === 'undefined') {
                                throw new Error('Vui lòng đăng nhập lại')
                              }

                              // ✅ Lấy đúng ID người bạn cần mời (nguoi_dung_id trong danh sách bạn bè)
                              const banBeId = (friend as any).nguoi_dung_id
                              const chuyenDiId = tripId

                              if (!chuyenDiId) throw new Error('Thiếu chuyen_di_id (tripId) khi gửi lời mời')
                              if (!banBeId) throw new Error('Thiếu ban_be_id (ID người bạn) khi gửi lời mời')

                              const payload = { chuyen_di_id: chuyenDiId, ban_be_id: banBeId }
                              console.log('[InviteMember] payload gửi:', payload)

                              const res = await axios.post(
                                'https://travel-planner-imdw.onrender.com/api/moi-thanh-vien/moi-ban',
                                payload,
                                {
                                  headers: {
                                    Authorization: `Bearer ${token}`,
                                    'Content-Type': 'application/json'
                                  }
                                }
                              )

                              const data = res.data
                              toast({
                                title: data?.message || 'Đã gửi lời mời tham gia chuyến đi',
                                description: `ID chuyến đi: ${data?.chuyen_di_id || '-'}, ID bạn bè: ${data?.ban_be_id || '-'}, trạng thái: ${data?.trang_thai || 'pending'}`
                              })
                            } catch (err: any) {
                              console.error('[InviteMember] error:', err?.response?.data || err)
                              const backendMessage = err?.response?.data?.message || err?.response?.data?.error
                              const message = backendMessage || err?.message || 'Lỗi khi gửi lời mời'
                              toast({ title: 'Lỗi gửi lời mời', description: message, variant: 'destructive' })
                            }
                          }}
                        >
                          Mời tham gia
                        </Button>
                      ) : (
                        <Button size="sm" disabled variant="outline">Mời tham gia</Button>
                      )}
                    </div>
                  )
                })}
              </div>
            )
          )}
        </DialogContent>
      </Dialog>

      {/* Modal danh sách yêu cầu tham gia (pending) */}
      <Dialog open={showPendingModal} onOpenChange={setShowPendingModal}>
        <DialogContent className="max-w-lg">
          <DialogTitle>Thành viên chờ xét duyệt</DialogTitle>
          {loadingPending ? (
            <p>Đang tải danh sách...</p>
          ) : pendingList.length === 0 ? (
            <p>Hiện không có yêu cầu nào.</p>
          ) : (
            <div className="flex flex-col gap-3 max-h-96 overflow-y-auto">
              {pendingList.map((p) => {
                const id = p.nguoi_dung_id || p.id
                const name = p.ho_ten || p.name || "Người dùng"
                const email = p.email || ""
                const avatar = p.avatar_url || "/placeholder-user.jpg"
                const status = p.trang_thai_tham_gia || p.trang_thai || "pending"
                const role = p.vai_tro || p.role || "member"
                const joinedAt = p.tham_gia_luc || p.created_at || ""
                return (
                  <div key={id} className="flex items-center gap-3 border-b p-2 pb-3 last:border-0">
                    <img src={avatar} alt={name} className="w-8 h-8 rounded-full" />
                    <div className="flex-1">
                      <div className="font-medium">{name}</div>
                      <div className="text-xs text-muted-foreground">{email}</div>
                      {/* <div className="text-xs text-muted-foreground mt-1">
                        Trạng thái: {String(status)} • Vai trò: {String(role)}
                      </div> */}
                      {joinedAt && (
                        <div className="text-xs text-muted-foreground">Gửi lúc: {String(joinedAt)}</div>
                      )}
                    </div>
                    {/* Nút hành động */}
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        className="bg-[#b3f0f5] hover:bg-[#9be8ef] text-blue-900 shadow-md hover:shadow-lg transition-all duration-200"
                        onClick={() => handleApproveMember(Number(id), name)}
                      >
                        Duyệt
                      </Button>
                    </div>
                  </div>
                )
              })}

            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Modal danh sách thành viên */}
      <Dialog open={showMembersModal} onOpenChange={setShowMembersModal}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
          <DialogTitle>Danh sách thành viên ({membersCount})</DialogTitle>
          <div className="flex-1 overflow-y-auto">
            {loadingMembers ? (
              <div className="flex items-center justify-center py-8">
                <p className="text-muted-foreground">Đang tải danh sách thành viên...</p>
              </div>
            ) : members.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8">
                <Users className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground">Chưa có thành viên nào</p>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {members.map((member) => {
                  const isCurrentUser = String(member.nguoi_dung_id) === String(currentUserId)
                  const isFriend = Boolean(member.la_ban_be)
                  const isBlocked = Boolean(member.bi_chan)

                  return (
                    <div key={member.id} className="flex items-center gap-3 border-b p-3 pb-3 last:border-0 hover:bg-muted/50 rounded-md transition">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={member.avatar_url} alt={member.ho_ten} />
                        <AvatarFallback className="bg-primary text-primary-foreground">
                          {member.ho_ten
                            .split(" ")
                            .map((n: string) => n[0])
                            .join("")
                            .toUpperCase()
                            .slice(0, 2)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h4 className="font-semibold text-foreground truncate">{member.ho_ten}</h4>
                          {getRoleIcon(member.role)}
                          {isCurrentUser && (
                            <Badge variant="outline" className="text-xs">
                              Bạn
                            </Badge>
                          )}
                          {isFriend && (
                            <Badge variant="secondary" className="text-xs bg-green-100 text-green-800">
                              Bạn bè
                            </Badge>
                          )}
                          {isBlocked && (
                            <Badge variant="destructive" className="text-xs">
                              Đã chặn
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground truncate">{member.email}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge {...getStatusBadge(member.status)} className="text-xs">
                            {getStatusBadge(member.status).label}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {getRoleLabel(member.role)}
                          </span>
                          {member.tham_gia_luc && (
                            <span className="text-xs text-muted-foreground">
                              • {new Date(member.tham_gia_luc).toLocaleDateString("vi-VN")}
                            </span>
                          )}
                        </div>
                      </div>
                      {canManageMembers && !isCurrentUser && member.status === "accepted" && (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={() =>
                                handleChangeRole(String(member.nguoi_dung_id), member.ho_ten, member.role === "owner" ? "member" : "owner")
                              }
                            >
                              <Settings className="h-4 w-4 mr-2" />
                              {member.role === "owner" ? "Chuyển thành thành viên" : "Chuyển thành chủ"}
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => handleRemoveMember(String(member.nguoi_dung_id), member.ho_ten)}
                              className="text-destructive focus:text-destructive"
                            >
                              <UserMinus className="h-4 w-4 mr-2" />
                              Xóa khỏi chuyến đi
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal xem trước chuyến đi từ mã mời */}
      <Dialog
        open={showPreviewModal}
        onOpenChange={(open) => {
          setShowPreviewModal(open)
          if (!open) {
            setPreviewInfo(null)
            setPreviewError(null)
          }
        }}
      >
        <DialogContent className="max-w-lg">
          <DialogTitle>Xem tổng quan chuyến đi</DialogTitle>
          {loadingPreview ? (
            <p>Đang tải thông tin...</p>
          ) : previewError ? (
            <p className="text-destructive text-sm">{previewError}</p>
          ) : previewInfo ? (
            <div className="space-y-3 text-sm">
              <div>
                <span className="font-medium">Tên chuyến đi:</span> {previewInfo.ten_chuyen_di || "-"}
              </div>
              <div>
                <span className="font-medium">Mã chuyến đi:</span> {previewInfo.chuyen_di_id || "-"}
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <span className="font-medium">Ngày tạo:</span>{" "}
                  {previewInfo.ngay_tao ? new Date(previewInfo.ngay_tao).toLocaleString("vi-VN") : "-"}
                </div>
                <div>
                  <span className="font-medium">Ngày bắt đầu:</span>{" "}
                  {previewInfo.ngay_bat_dau ? new Date(previewInfo.ngay_bat_dau).toLocaleDateString("vi-VN") : "-"}
                </div>
                <div>
                  <span className="font-medium">Ngày kết thúc:</span>{" "}
                  {previewInfo.ngay_ket_thuc ? new Date(previewInfo.ngay_ket_thuc).toLocaleDateString("vi-VN") : "-"}
                </div>
                <div>
                  <span className="font-medium">Số lượng thành viên:</span> {previewInfo.so_luong_thanh_vien ?? 0}
                </div>
              </div>
              {Array.isArray(previewInfo.thanh_vien) && previewInfo.thanh_vien.length > 0 ? (
                <div className="space-y-2">
                  <p className="font-medium">Thành viên:</p>
                  <div className="flex flex-col gap-2 max-h-56 overflow-y-auto">
                    {previewInfo.thanh_vien.map((tv: any, idx: number) => (
                      <div key={`${tv.ho_ten}-${idx}`} className="flex items-center gap-3 border-b pb-2 last:border-0">
                        <Avatar className="h-9 w-9">
                          <AvatarImage src={tv.avatar_url || "/placeholder-user.jpg"} alt={tv.ho_ten || "Thành viên"} />
                          <AvatarFallback>
                            {(tv.ho_ten || "")
                              .split(" ")
                              .map((n: string) => n[0])
                              .join("")
                              .toUpperCase()
                              .slice(0, 2) || "TV"}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <div className="font-medium">{tv.ho_ten || "Thành viên"}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <p className="text-muted-foreground text-sm">Chưa có thành viên nào.</p>
              )}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">Chưa có dữ liệu để hiển thị.</p>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
