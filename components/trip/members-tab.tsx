"use client"

import { useState } from "react"
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

interface MembersTabProps {
  members: any[]
  tripId: string
  currentUserId?: string
}

export function MembersTab({ members, tripId, currentUserId = "user1" }: MembersTabProps) {
  const [showInviteModal, setShowInviteModal] = useState(false)
  const { toast } = useToast()

  const currentUser = members.find((m) => m.id === currentUserId)
  const isOwner = currentUser?.role === "owner"
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground font-[family-name:var(--font-space-grotesk)]">
            Thành Viên Chuyến Đi
          </h2>
          <p className="text-muted-foreground font-[family-name:var(--font-dm-sans)]">
            Quản lý và mời thêm thành viên tham gia chuyến đi
          </p>
        </div>
        {canManageMembers && (
          <Button onClick={() => setShowInviteModal(true)} className="bg-primary hover:bg-primary/90">
            <Plus className="h-4 w-4 mr-2" />
            Mời Thành Viên
          </Button>
        )}
      </div>

      {!isOwner && (
        <Card className="border-yellow-200 bg-yellow-50">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-yellow-800">
              <Shield className="h-4 w-4" />
              <span className="text-sm font-medium">Chỉ chủ chuyến đi mới có thể mời và quản lý thành viên</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Members List */}
      <div className="grid gap-4">
        {members.map((member) => (
          <Card key={member.id}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={`/generic-placeholder-icon.png?height=48&width=48`} alt={member.name} />
                    <AvatarFallback className="bg-primary text-primary-foreground">
                      {member.name
                        .split(" ")
                        .map((n: string) => n[0])
                        .join("")
                        .toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-foreground">{member.name}</h3>
                      {getRoleIcon(member.role)}
                      {member.id === currentUserId && (
                        <Badge variant="outline" className="text-xs">
                          Bạn
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
                  {canManageMembers && member.id !== currentUserId && member.status === "accepted" && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={() =>
                            handleChangeRole(member.id, member.name, member.role === "owner" ? "member" : "owner")
                          }
                        >
                          <Settings className="h-4 w-4 mr-2" />
                          {member.role === "owner" ? "Chuyển thành thành viên" : "Chuyển thành chủ"}
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => handleRemoveMember(member.id, member.name)}
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
      </div>

      {/* Invite Link Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Link className="h-5 w-5 text-primary" />
            Link Mời Tham Gia
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">Chia sẻ link này để mời người khác tham gia chuyến đi</p>
          <div className="flex gap-2">
            <div className="flex-1 p-3 bg-muted rounded-md text-sm font-mono">
              https://travelplan.app/join/abc123xyz
            </div>
            <Button variant="outline">Sao chép</Button>
          </div>
          <Button variant="outline" className="w-full bg-transparent">
            Tạo Link Mới
          </Button>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <Users className="h-6 w-6 text-primary mx-auto mb-2" />
            <p className="text-2xl font-bold text-foreground">{members.length}</p>
            <p className="text-sm text-muted-foreground">Tổng thành viên</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-2">
              <div className="w-3 h-3 bg-green-500 rounded-full" />
            </div>
            <p className="text-2xl font-bold text-foreground">
              {members.filter((m) => m.status === "accepted").length}
            </p>
            <p className="text-sm text-muted-foreground">Đã tham gia</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <Clock className="h-6 w-6 text-yellow-500 mx-auto mb-2" />
            <p className="text-2xl font-bold text-foreground">{members.filter((m) => m.status === "pending").length}</p>
            <p className="text-sm text-muted-foreground">Chờ phản hồi</p>
          </CardContent>
        </Card>
      </div>

      {/* Modals */}
      {showInviteModal && <InviteMemberModal onClose={() => setShowInviteModal(false)} tripId={tripId} />}
    </div>
  )
}
