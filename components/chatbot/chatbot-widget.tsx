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
          "flex w-full mb-3",
          isUser ? "justify-end" : "justify-start"
        )}
      >
        {!isUser && (
          <div className="mr-2 mt-1 flex h-8 w-8 items-center justify-center rounded-full bg-primary text-white text-sm shadow-md">
            🤖
          </div>
        )}

        <div
          className={cn(
            "max-w-[80%] whitespace-pre-line rounded-2xl px-4 py-2 text-sm leading-relaxed shadow-md",
            isUser
              ? "bg-primary text-white rounded-br-md"
              : "bg-card text-card-foreground rounded-bl-md border border-border"
          )}
        >
          {stripMarkdown(msg.text)}
        </div>

        {isUser && (
          <div className="ml-2 mt-1 flex h-8 w-8 items-center justify-center rounded-full bg-secondary text-secondary-foreground text-sm shadow-md">
            🧑
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
          className="fixed bottom-6 right-6 z-50 h-14 w-14 rounded-full bg-primary text-primary-foreground shadow-xl hover:bg-primary/90 transition-all hover:scale-105 flex items-center justify-center border-2 border-background/50"
          style={{
            boxShadow: "0 8px 24px rgba(0, 0, 0, 0.15), 0 0 0 1px rgba(0, 0, 0, 0.1)",
          }}
          aria-label="Mở chatbot"
        >
          <MessageCircle className="h-6 w-6" />
        </button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <div 
          className="fixed bottom-6 right-6 z-50 w-[400px] h-[600px] max-w-[calc(100vw-3rem)] max-h-[calc(100vh-3rem)] sm:w-[400px] sm:h-[600px] flex flex-col bg-card border-2 border-border rounded-2xl overflow-hidden shadow-2xl"
          style={{
            boxShadow: "0 20px 60px rgba(0, 0, 0, 0.2), 0 0 0 1px rgba(0, 0, 0, 0.05)",
          }}
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b-2 border-border px-4 py-3 bg-muted/80">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-primary to-secondary flex items-center justify-center text-white text-lg shadow-md">
                ✈️
              </div>
              <div>
                <div className="text-sm font-semibold">Travel AI Assistant</div>
                <div className="text-[11px] text-muted-foreground">
                  Gợi ý địa điểm – lịch trình – món ăn – chi phí
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1 text-[11px] text-emerald-500">
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>Online</span>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
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
            className="flex-1 overflow-y-auto px-4 py-3 bg-background"
          >
            {messages.map(renderMessage)}

            {isLoading && (
              <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
                <span className="flex gap-1">
                  <span className="h-2 w-2 rounded-full bg-primary animate-bounce" />
                  <span className="h-2 w-2 rounded-full bg-primary animate-bounce delay-100" />
                  <span className="h-2 w-2 rounded-full bg-primary animate-bounce delay-200" />
                </span>
                Mình đang suy nghĩ gợi ý cho bạn...
              </div>
            )}
          </div>

          {/* Quick Suggestions */}
          <div className="px-3 py-2 bg-muted/80 border-t-2 border-border">
            <div className="flex items-center gap-2 overflow-x-auto pb-1">
              {suggestions.map((s, i) => (
                <button
                  key={i}
                  onClick={() => handleSend(s)}
                  className="flex-shrink-0 bg-background text-foreground text-xs px-3 py-1.5 rounded-xl border border-border hover:bg-muted hover:border-primary/50 transition shadow-sm"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          {/* Input */}
          <div className="border-t-2 border-border bg-muted/80 px-3 py-2">
            <div className="flex items-end gap-2">
              <textarea
                ref={inputRef}
                className="flex-1 resize-none rounded-2xl border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary h-12 max-h-32 shadow-sm"
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
                className="h-10 w-10 rounded-2xl shadow-md"
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

