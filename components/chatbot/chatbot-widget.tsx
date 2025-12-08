"use client"

import { useState, useRef, useEffect } from "react"
import { MessageCircle, X, Send, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import Cookies from "js-cookie"

// Backend URL: Sử dụng backend chính của dự án (chatbot đã được tích hợp vào backend chính)
const BACKEND_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "https://travel-planner-imdw.onrender.com"

interface Message {
  id: string
  role: "user" | "assistant"
  text: string
}

export function ChatbotWidget() {
  const [isOpen, setIsOpen] = useState(false)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome-1",
      role: "assistant",
      text:
        "Xin chào, mình là trợ lý du lịch ✈️\n" +
        "Bạn có thể hỏi mình về: địa điểm, lịch trình, ăn ở, di chuyển...\n\n" +
        "Bạn đang muốn đi đâu và khoảng mấy ngày?",
    },
  ])
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [sessionId] = useState(() => `session-${Date.now()}`)

  const chatRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  // Kiểm tra đăng nhập
  useEffect(() => {
    const checkAuth = () => {
      const token = Cookies.get("token")
      if (token && token !== "null" && token !== "undefined") {
        setIsAuthenticated(true)
      } else {
        setIsAuthenticated(false)
      }
    }

    // Kiểm tra ngay khi component mount
    checkAuth()

    // Kiểm tra định kỳ để cập nhật khi token thay đổi
    const interval = setInterval(checkAuth, 1000)

    return () => clearInterval(interval)
  }, [])

  // Quick suggestions
  const suggestions = [
    "Đà Nẵng 4N3Đ cho cặp đôi",
    "Đà Lạt 3N2Đ nên đi đâu?",
    "Phú Quốc ăn gì ngon?",
    "Hà Giang tháng 10 có đẹp không?",
    "Gợi ý tour Nha Trang 2N1Đ",
  ]

  // Auto scroll to bottom
  useEffect(() => {
    if (chatRef.current) {
      chatRef.current.scrollTop = chatRef.current.scrollHeight
    }
  }, [messages, isLoading])

  // Auto focus input when opened
  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 100)
    }
  }, [isOpen])

  // Strip markdown formatting
  const stripMarkdown = (text: string) => {
    return text
      .replace(/\*\*/g, "")
      .replace(/\*/g, "")
      .replace(/_/g, "")
      .replace(/#+\s?/g, "")
      .replace(/>\s?/g, "")
  }

  // Send message
  const handleSend = async (customText: string | null = null) => {
    const msgText = customText || input.trim()
    if (!msgText || isLoading) return

    // Add user message
    setMessages((prev) => [
      ...prev,
      { id: `user-${Date.now()}`, role: "user", text: msgText },
    ])
    setInput("")
    setIsLoading(true)

    try {
      // Lấy token từ cookie để authenticate
      const token = Cookies.get("token")
      
      if (!token || token === "null" || token === "undefined") {
        setMessages((prev) => [
          ...prev,
          {
            id: `error-${Date.now()}`,
            role: "assistant",
            text: "⚠️ Vui lòng đăng nhập để sử dụng chatbot.",
          },
        ])
        setIsLoading(false)
        return
      }

      const res = await fetch(`${BACKEND_BASE_URL}/api/chatbot/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          message: msgText,
          sessionId: sessionId,
        }),
      })

      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        const errorMsg =
          data?.error ||
          `Lỗi server (HTTP ${res.status}). Vui lòng thử lại sau.`
        setMessages((prev) => [
          ...prev,
          {
            id: `error-${Date.now()}`,
            role: "assistant",
            text: `⚠️ ${errorMsg}`,
          },
        ])
      } else {
        const data = await res.json()
        setMessages((prev) => [
          ...prev,
          {
            id: `bot-${Date.now()}`,
            role: "assistant",
            text: data.reply || "Mình chưa nhận được nội dung trả lời.",
          },
        ])
      }
    } catch (err) {
      console.error("Chatbot error:", err)
      const errorMessage = err instanceof Error 
        ? `⚠️ Lỗi: ${err.message}`
        : "⚠️ Không kết nối được backend. Vui lòng thử lại sau."
      
      setMessages((prev) => [
        ...prev,
        {
          id: `error-${Date.now()}`,
          role: "assistant",
          text: errorMessage,
        },
      ])
    } finally {
      setIsLoading(false)
      inputRef.current?.focus()
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  // Render message
  const renderMessage = (msg: Message) => {
    const isUser = msg.role === "user"

    return (
      <div
        key={msg.id}
        className={cn(
          "flex w-full mb-4 animate-in fade-in slide-in-from-bottom-2 duration-300",
          isUser ? "justify-end" : "justify-start"
        )}
      >
        {!isUser && (
          <div className="mr-3 mt-1 flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-primary via-primary/90 to-primary/80 text-white text-base shadow-lg ring-2 ring-primary/20">
            ✈️
          </div>
        )}

        <div
          className={cn(
            "max-w-[75%] whitespace-pre-line rounded-2xl px-4 py-3 text-sm leading-relaxed shadow-lg",
            isUser
              ? "bg-gradient-to-br from-primary to-primary/90 text-white rounded-br-sm border border-primary/20"
              : "bg-gradient-to-br from-card to-card/95 text-card-foreground rounded-bl-sm border border-border/50 backdrop-blur-sm"
          )}
        >
          <p className="text-[13.5px] leading-relaxed">{stripMarkdown(msg.text)}</p>
        </div>

        {isUser && (
          <div className="ml-3 mt-1 flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-secondary to-secondary/80 text-secondary-foreground text-base shadow-lg ring-2 ring-secondary/20">
            👤
          </div>
        )}
      </div>
    )
  }

  // Chỉ hiển thị chatbot nếu đã đăng nhập
  if (!isAuthenticated) {
    return null
  }

  return (
    <>
      {/* Floating Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 z-50 h-16 w-16 rounded-full bg-gradient-to-br from-primary via-primary/95 to-primary/90 text-primary-foreground shadow-2xl hover:shadow-primary/30 hover:scale-110 transition-all duration-300 flex items-center justify-center border-2 border-white/20 backdrop-blur-sm group"
          style={{
            boxShadow: "0 10px 40px rgba(0, 0, 0, 0.2), 0 0 0 1px rgba(255, 255, 255, 0.1), 0 0 60px rgba(var(--primary), 0.3)",
          }}
          aria-label="Mở chatbot"
        >
          <MessageCircle className="h-7 w-7 group-hover:scale-110 transition-transform duration-300" />
        </button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <div 
          className="fixed bottom-6 right-6 z-50 w-[420px] h-[650px] max-w-[calc(100vw-3rem)] max-h-[calc(100vh-3rem)] sm:w-[420px] sm:h-[650px] flex flex-col bg-gradient-to-b from-card via-card to-card/95 border border-border/50 rounded-3xl overflow-hidden shadow-2xl backdrop-blur-xl animate-in fade-in slide-in-from-bottom-4 duration-300"
          style={{
            boxShadow: "0 25px 80px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(255, 255, 255, 0.1), 0 0 100px rgba(var(--primary), 0.15)",
          }}
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-border/50 px-5 py-4 bg-gradient-to-r from-primary/5 via-primary/3 to-transparent backdrop-blur-sm">
            <div className="flex items-center gap-3">
              <div className="h-11 w-11 rounded-2xl bg-gradient-to-br from-primary via-primary/90 to-primary/80 flex items-center justify-center text-white text-xl shadow-lg ring-2 ring-primary/20">
                ✈️
              </div>
              <div>
                <div className="text-base font-bold text-foreground">Travel AI</div>
                <div className="text-[11px] text-muted-foreground font-medium">
                  Gợi ý địa điểm • lịch trình • món ăn • chi phí
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20">
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse shadow-lg shadow-emerald-500/50" />
                <span className="text-[11px] font-medium text-emerald-600 dark:text-emerald-400">Online</span>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9 rounded-xl hover:bg-destructive/10 hover:text-destructive transition-colors"
                onClick={() => setIsOpen(false)}
                aria-label="Đóng chatbot"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Chat body */}
          <div
            ref={chatRef}
            className="flex-1 overflow-y-auto px-5 py-4 bg-gradient-to-b from-background via-background to-muted/20 scrollbar-thin scrollbar-thumb-primary/20 scrollbar-track-transparent"
          >
            {messages.map(renderMessage)}

            {isLoading && (
              <div className="mt-3 flex items-center gap-3 px-4 py-3 rounded-2xl bg-muted/50 border border-border/50 backdrop-blur-sm">
                <span className="flex gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-full bg-primary animate-bounce shadow-md" style={{ animationDelay: '0ms' }} />
                  <span className="h-2.5 w-2.5 rounded-full bg-primary/80 animate-bounce shadow-md" style={{ animationDelay: '150ms' }} />
                  <span className="h-2.5 w-2.5 rounded-full bg-primary/60 animate-bounce shadow-md" style={{ animationDelay: '300ms' }} />
                </span>
                <span className="text-xs font-medium text-muted-foreground">Đang suy nghĩ gợi ý cho bạn...</span>
              </div>
            )}
          </div>

          {/* Quick Suggestions */}
          <div className="px-4 py-3 bg-gradient-to-r from-muted/60 via-muted/40 to-transparent border-t border-border/50 backdrop-blur-sm">
            <div 
              className="flex items-center gap-2.5 overflow-x-auto pb-1 [&::-webkit-scrollbar]:h-0.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-primary/15 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:hover:bg-primary/25"
              style={{
                scrollbarWidth: 'thin',
                scrollbarColor: 'hsl(var(--primary) / 0.15) transparent',
              }}
            >
              {suggestions.map((s, i) => (
                <button
                  key={i}
                  onClick={() => handleSend(s)}
                  className="flex-shrink-0 bg-background/80 text-foreground text-xs font-medium px-4 py-2 rounded-full border border-border/50 hover:bg-primary/10 hover:border-primary/50 hover:text-primary transition-all duration-200 shadow-sm hover:shadow-md hover:scale-105 backdrop-blur-sm"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          {/* Input */}
          <div className="border-t border-border/50 bg-gradient-to-r from-muted/60 via-muted/40 to-transparent px-4 py-3 backdrop-blur-sm">
            <div className="flex items-end gap-3">
              <textarea
                ref={inputRef}
                className="flex-1 resize-none rounded-2xl border border-border/50 bg-background/90 px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground/70 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 h-12 max-h-32 shadow-md hover:shadow-lg transition-all duration-200 backdrop-blur-sm"
                placeholder="Nhập câu hỏi du lịch của bạn..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                rows={1}
              />
              <Button
                onClick={() => handleSend()}
                disabled={isLoading || !input.trim()}
                size="icon"
                className="h-12 w-12 rounded-2xl bg-gradient-to-br from-primary to-primary/90 hover:from-primary/90 hover:to-primary shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
              >
                {isLoading ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <Send className="h-5 w-5" />
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

