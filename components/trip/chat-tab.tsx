"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Send, Paperclip, ImageIcon, Smile, Check, CheckCheck, X, Phone, Video, Search, Settings } from "lucide-react"
import { ScrollArea } from "@/components/ui/scroll-area"
import { motion, AnimatePresence } from "framer-motion"
import { useToast } from "@/hooks/use-toast"

const mockMessages = [
  {
    id: "msg1",
    userId: "user2",
    userName: "Trần Thị B",
    content: "Chào mọi người! Mình vừa book được khách sạn ở Đà Nẵng rồi",
    timestamp: "2024-03-14T10:30:00Z",
    type: "text",
    readBy: ["user1", "user3"],
  },
  {
    id: "msg2",
    userId: "user1",
    userName: "Nguyễn Văn A",
    content: "Tuyệt vời! Khách sạn nào vậy B?",
    timestamp: "2024-03-14T10:32:00Z",
    type: "text",
    readBy: ["user2", "user3"],
  },
  {
    id: "msg3",
    userId: "user2",
    userName: "Trần Thị B",
    content: "Muong Thanh Grand Da Nang, view biển đẹp lắm",
    timestamp: "2024-03-14T10:33:00Z",
    type: "text",
    readBy: ["user1"],
  },
  {
    id: "msg4",
    userId: "user3",
    userName: "Lê Văn C",
    content: "Mình vừa thêm vé Bà Nà Hills vào chi phí rồi nhé",
    timestamp: "2024-03-14T11:15:00Z",
    type: "text",
    readBy: [],
  },
  {
    id: "msg5",
    userId: "user1",
    userName: "Nguyễn Văn A",
    content: "Ok, mình sẽ check lại. Btw, ai muốn đi thêm Hội An không?",
    timestamp: "2024-03-14T11:20:00Z",
    type: "text",
    readBy: [],
  },
  {
    id: "msg6",
    userId: "user4",
    userName: "Phạm Thị D",
    content: "",
    timestamp: "2024-03-14T11:25:00Z",
    type: "image",
    images: ["/bana-hills-golden-bridge.jpg"],
    readBy: ["user1"],
  },
]

const mockMembers = [
  {
    id: "user1",
    name: "Nguyễn Văn A",
    status: "online",
    lastSeen: null,
    role: "owner",
    avatar: "NA",
    isTyping: false,
  },
  {
    id: "user2",
    name: "Trần Thị B",
    status: "online",
    lastSeen: null,
    role: "member",
    avatar: "TB",
    isTyping: false,
  },
  {
    id: "user3",
    name: "Lê Văn C",
    status: "away",
    lastSeen: "2024-03-14T10:45:00Z",
    role: "member",
    avatar: "LC",
    isTyping: false,
  },
  {
    id: "user4",
    name: "Phạm Thị D",
    status: "online",
    lastSeen: null,
    role: "member",
    avatar: "PD",
    isTyping: false,
  },
  {
    id: "user5",
    name: "Hoàng Văn E",
    status: "offline",
    lastSeen: "2024-03-14T09:30:00Z",
    role: "member",
    avatar: "HE",
    isTyping: false,
  },
]

const currentUserId = "user1"

interface ChatTabProps {
  tripId: string
}

export function ChatTab({ tripId }: ChatTabProps) {
  const [messages, setMessages] = useState(mockMessages)
  const [newMessage, setNewMessage] = useState("")
  const [typingUsers, setTypingUsers] = useState<string[]>([])
  const [isTyping, setIsTyping] = useState(false)
  const [selectedImages, setSelectedImages] = useState<File[]>([])
  const [previewImages, setPreviewImages] = useState<string[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [showSearch, setShowSearch] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { toast } = useToast()

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  // Simulate typing indicator
  useEffect(() => {
    if (isTyping) {
      const timer = setTimeout(() => {
        setIsTyping(false)
      }, 3000)
      return () => clearTimeout(timer)
    }
  }, [isTyping])

  // Simulate other users typing
  useEffect(() => {
    const interval = setInterval(() => {
      if (Math.random() > 0.8) {
        const randomUser = mockMembers[Math.floor(Math.random() * mockMembers.length)]
        if (randomUser.id !== currentUserId) {
          setTypingUsers([randomUser.name])
          setTimeout(() => setTypingUsers([]), 2000)
        }
      }
    }, 5000)
    return () => clearInterval(interval)
  }, [])

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newMessage.trim() && selectedImages.length === 0) return

    const message = {
      id: `msg${Date.now()}`,
      userId: currentUserId,
      userName: "Nguyễn Văn A",
      content: newMessage,
      timestamp: new Date().toISOString(),
      type: selectedImages.length > 0 ? ("image" as const) : ("text" as const),
      images: selectedImages.length > 0 ? previewImages : undefined,
      readBy: [],
    }

    setMessages([...messages, message])
    setNewMessage("")
    setSelectedImages([])
    setPreviewImages([])
    setIsTyping(false)

    toast({
      title: "Tin nhắn đã gửi",
      description:
        selectedImages.length > 0 ? "Hình ảnh đã được gửi đến nhóm" : "Tin nhắn của bạn đã được gửi đến nhóm",
    })
  }

  const handleTyping = (value: string) => {
    setNewMessage(value)
    if (value && !isTyping) {
      setIsTyping(true)
    }
  }

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    if (files.length > 0) {
      setSelectedImages((prev) => [...prev, ...files])

      // Create preview URLs
      files.forEach((file) => {
        const reader = new FileReader()
        reader.onload = (e) => {
          setPreviewImages((prev) => [...prev, e.target?.result as string])
        }
        reader.readAsDataURL(file)
      })
    }
  }

  const removeImage = (index: number) => {
    setSelectedImages((prev) => prev.filter((_, i) => i !== index))
    setPreviewImages((prev) => prev.filter((_, i) => i !== index))
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "online":
        return "bg-green-500"
      case "away":
        return "bg-yellow-500"
      default:
        return "bg-gray-400"
    }
  }

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString("vi-VN", {
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const formatLastSeen = (timestamp: string) => {
    const now = new Date()
    const lastSeen = new Date(timestamp)
    const diffInMinutes = Math.floor((now.getTime() - lastSeen.getTime()) / (1000 * 60))

    if (diffInMinutes < 1) return "Vừa xong"
    if (diffInMinutes < 60) return `${diffInMinutes} phút trước`
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)} giờ trước`
    return lastSeen.toLocaleDateString("vi-VN")
  }

  const getReadStatus = (message: any) => {
    if (message.userId === currentUserId) {
      const totalMembers = mockMembers.length - 1 // Exclude sender
      const readCount = message.readBy.length

      if (readCount === 0) return <Check className="h-3 w-3 text-muted-foreground" />
      if (readCount === totalMembers) return <CheckCheck className="h-3 w-3 text-blue-500" />
      return <CheckCheck className="h-3 w-3 text-muted-foreground" />
    }
    return null
  }

  const filteredMessages = messages.filter(
    (message) =>
      message.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
      message.userName.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  const onlineMembers = mockMembers.filter((m) => m.status === "online")
  const awayMembers = mockMembers.filter((m) => m.status === "away")
  const offlineMembers = mockMembers.filter((m) => m.status === "offline")

  return (
    <div className="flex h-[700px] bg-background rounded-lg border border-border overflow-hidden shadow-lg">
      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {/* Enhanced Chat Header */}
        <div className="p-4 border-b border-border bg-gradient-to-r from-blue-50 to-sky-50 dark:from-blue-950/20 dark:to-sky-950/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center">
                  <span className="text-primary-foreground font-semibold text-sm">TC</span>
                </div>
                <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-background"></div>
              </div>
              <div>
                <h3 className="font-semibold text-foreground font-[family-name:var(--font-space-grotesk)]">
                  Chat Nhóm - Chuyến đi Đà Nẵng
                </h3>
                <p className="text-sm text-muted-foreground">
                  {onlineMembers.length} thành viên đang online • {mockMembers.length} tổng cộng
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowSearch(!showSearch)}
                className={showSearch ? "bg-muted" : ""}
              >
                <Search className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon">
                <Phone className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon">
                <Video className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon">
                <Settings className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <AnimatePresence>
            {showSearch && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-3"
              >
                <Input
                  placeholder="Tìm kiếm tin nhắn..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="bg-background"
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Enhanced Messages Area */}
        <ScrollArea className="flex-1 p-4 bg-gradient-to-b from-blue-50/30 to-transparent dark:from-blue-950/10">
          <div className="space-y-4">
            <AnimatePresence>
              {(searchQuery ? filteredMessages : messages).map((message, index) => {
                const isCurrentUser = message.userId === currentUserId
                const showAvatar = index === 0 || messages[index - 1].userId !== message.userId
                const showTimestamp =
                  index === messages.length - 1 ||
                  messages[index + 1].userId !== message.userId ||
                  new Date(messages[index + 1].timestamp).getTime() - new Date(message.timestamp).getTime() > 300000

                return (
                  <motion.div
                    key={message.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className={`flex gap-3 ${isCurrentUser ? "flex-row-reverse" : ""}`}
                  >
                    <div className={`flex-shrink-0 ${showAvatar ? "" : "invisible"}`}>
                      <Avatar className="h-8 w-8 ring-2 ring-background shadow-sm">
                        <AvatarFallback className="bg-primary text-primary-foreground text-xs font-semibold">
                          {message.userName
                            .split(" ")
                            .map((n) => n[0])
                            .join("")}
                        </AvatarFallback>
                      </Avatar>
                    </div>

                    <div className={`flex-1 max-w-[70%] ${isCurrentUser ? "items-end" : "items-start"} flex flex-col`}>
                      {showAvatar && !isCurrentUser && (
                        <span className="text-xs text-muted-foreground mb-1 font-medium">{message.userName}</span>
                      )}

                      <div
                        className={`px-4 py-2 rounded-2xl shadow-sm ${
                          isCurrentUser
                            ? "bg-primary text-primary-foreground rounded-br-md"
                            : "bg-card text-foreground border border-border rounded-bl-md"
                        }`}
                      >
                        {message.type === "image" && message.images ? (
                          <div className="space-y-2">
                            <div className="grid grid-cols-2 gap-2">
                              {message.images.map((img, imgIndex) => (
                                <img
                                  key={imgIndex}
                                  src={img || "/placeholder.svg"}
                                  alt="Shared image"
                                  className="rounded-lg max-w-full h-auto cursor-pointer hover:opacity-80 transition-opacity"
                                  onClick={() => window.open(img, "_blank")}
                                />
                              ))}
                            </div>
                            {message.content && (
                              <p className="text-sm font-[family-name:var(--font-dm-sans)]">{message.content}</p>
                            )}
                          </div>
                        ) : (
                          <p className="text-sm font-[family-name:var(--font-dm-sans)] leading-relaxed">
                            {message.content}
                          </p>
                        )}
                      </div>

                      {showTimestamp && (
                        <div className={`flex items-center gap-1 mt-1 ${isCurrentUser ? "flex-row-reverse" : ""}`}>
                          <span className="text-xs text-muted-foreground">{formatTime(message.timestamp)}</span>
                          {getReadStatus(message)}
                        </div>
                      )}
                    </div>
                  </motion.div>
                )
              })}
            </AnimatePresence>

            {/* Enhanced Typing Indicator */}
            <AnimatePresence>
              {typingUsers.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="flex items-center gap-3"
                >
                  <Avatar className="h-6 w-6">
                    <AvatarFallback className="bg-muted text-muted-foreground text-xs">
                      {typingUsers[0]
                        ?.split(" ")
                        .map((n) => n[0])
                        .join("")}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex items-center gap-2 bg-muted px-3 py-2 rounded-full">
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-primary rounded-full animate-bounce" />
                      <div
                        className="w-2 h-2 bg-primary rounded-full animate-bounce"
                        style={{ animationDelay: "0.1s" }}
                      />
                      <div
                        className="w-2 h-2 bg-primary rounded-full animate-bounce"
                        style={{ animationDelay: "0.2s" }}
                      />
                    </div>
                    <span className="text-sm text-muted-foreground">{typingUsers.join(", ")} đang nhập...</span>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>

        {/* Enhanced Message Input */}
        <div className="p-4 border-t border-border bg-card">
          {/* Image Preview */}
          {previewImages.length > 0 && (
            <div className="mb-3 p-3 bg-muted rounded-lg border border-border">
              <div className="flex items-center gap-2 mb-2">
                <ImageIcon className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium">Hình ảnh đã chọn ({previewImages.length})</span>
              </div>
              <div className="flex gap-2 overflow-x-auto">
                {previewImages.map((img, index) => (
                  <div key={index} className="relative flex-shrink-0">
                    <img
                      src={img || "/placeholder.svg"}
                      alt={`Preview ${index + 1}`}
                      className="w-16 h-16 object-cover rounded-lg border border-border"
                    />
                    <Button
                      type="button"
                      variant="destructive"
                      size="icon"
                      className="absolute -top-2 -right-2 h-6 w-6 shadow-lg"
                      onClick={() => removeImage(index)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}

          <form onSubmit={handleSendMessage} className="flex items-center gap-2">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={handleImageSelect}
            />
            <Button type="button" variant="ghost" size="icon" className="hover:bg-muted">
              <Paperclip className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => fileInputRef.current?.click()}
              className="hover:bg-muted"
            >
              <ImageIcon className="h-4 w-4" />
            </Button>
            <div className="flex-1 relative">
              <Input
                value={newMessage}
                onChange={(e) => handleTyping(e.target.value)}
                placeholder="Nhập tin nhắn..."
                className="pr-12 bg-background border-border focus:ring-2 focus:ring-primary/20"
              />
              <Button type="button" variant="ghost" size="icon" className="absolute right-1 top-1 h-8 w-8">
                <Smile className="h-4 w-4" />
              </Button>
            </div>
            <Button
              type="submit"
              disabled={!newMessage.trim() && selectedImages.length === 0}
              className="bg-primary hover:bg-primary/90 shadow-sm"
            >
              <Send className="h-4 w-4" />
            </Button>
          </form>
        </div>
      </div>

      {/* Enhanced Members Sidebar */}
      <div className="w-72 border-l border-border bg-card">
        <div className="p-4 border-b border-border bg-gradient-to-r from-blue-50 to-sky-50 dark:from-blue-950/20 dark:to-sky-950/20">
          <h4 className="font-semibold text-foreground font-[family-name:var(--font-space-grotesk)]">
            Thành Viên ({mockMembers.length})
          </h4>
          <p className="text-xs text-muted-foreground mt-1">{onlineMembers.length} đang online</p>
        </div>
        <ScrollArea className="flex-1">
          <div className="p-3 space-y-4">
            {onlineMembers.length > 0 && (
              <div>
                <h5 className="text-xs font-semibold text-green-600 dark:text-green-400 mb-2 uppercase tracking-wide">
                  Đang Online ({onlineMembers.length})
                </h5>
                <div className="space-y-1">
                  {onlineMembers.map((member) => (
                    <motion.div
                      key={member.id}
                      className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <div className="relative">
                        <Avatar className="h-9 w-9 ring-2 ring-green-500/20">
                          <AvatarFallback className="bg-primary text-primary-foreground text-xs font-semibold">
                            {member.avatar}
                          </AvatarFallback>
                        </Avatar>
                        <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 rounded-full border-2 border-card shadow-sm" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium text-foreground truncate">
                            {member.name}
                            {member.id === currentUserId && " (Bạn)"}
                          </p>
                          {member.role === "owner" && (
                            <span className="text-xs bg-primary/10 text-primary px-1.5 py-0.5 rounded-full font-medium">
                              Owner
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-green-600 dark:text-green-400 font-medium">Đang hoạt động</p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}

            {awayMembers.length > 0 && (
              <div>
                <h5 className="text-xs font-semibold text-yellow-600 dark:text-yellow-400 mb-2 uppercase tracking-wide">
                  Vắng Mặt ({awayMembers.length})
                </h5>
                <div className="space-y-1">
                  {awayMembers.map((member) => (
                    <div
                      key={member.id}
                      className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <div className="relative">
                        <Avatar className="h-9 w-9 ring-2 ring-yellow-500/20">
                          <AvatarFallback className="bg-muted text-muted-foreground text-xs">
                            {member.avatar}
                          </AvatarFallback>
                        </Avatar>
                        <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-yellow-500 rounded-full border-2 border-card" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium text-foreground truncate">{member.name}</p>
                          {member.role === "owner" && (
                            <span className="text-xs bg-primary/10 text-primary px-1.5 py-0.5 rounded-full font-medium">
                              Owner
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-yellow-600 dark:text-yellow-400">
                          {member.lastSeen ? formatLastSeen(member.lastSeen) : "Vắng mặt"}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {offlineMembers.length > 0 && (
              <div>
                <h5 className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wide">
                  Offline ({offlineMembers.length})
                </h5>
                <div className="space-y-1">
                  {offlineMembers.map((member) => (
                    <div
                      key={member.id}
                      className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors opacity-75"
                    >
                      <div className="relative">
                        <Avatar className="h-9 w-9">
                          <AvatarFallback className="bg-muted text-muted-foreground text-xs">
                            {member.avatar}
                          </AvatarFallback>
                        </Avatar>
                        <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-gray-400 rounded-full border-2 border-card" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium text-muted-foreground truncate">{member.name}</p>
                          {member.role === "owner" && (
                            <span className="text-xs bg-muted text-muted-foreground px-1.5 py-0.5 rounded-full font-medium">
                              Owner
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {member.lastSeen ? formatLastSeen(member.lastSeen) : "Offline"}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </ScrollArea>
      </div>
    </div>
  )
}
