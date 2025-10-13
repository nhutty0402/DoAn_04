"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { CreditCard, Smartphone, QrCode, CheckCircle } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface PaymentModalProps {
  isOpen: boolean
  onClose: () => void
  tripId: string
  amount: number
}

export function PaymentModal({ isOpen, onClose, tripId, amount }: PaymentModalProps) {
  const [paymentMethod, setPaymentMethod] = useState<"momo" | "bank" | "qr">("momo")
  const [phoneNumber, setPhoneNumber] = useState("")
  const [isProcessing, setIsProcessing] = useState(false)
  const [paymentSuccess, setPaymentSuccess] = useState(false)
  const { toast } = useToast()

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(amount)
  }

  const handlePayment = async () => {
    setIsProcessing(true)
    try {
      // Simulate payment processing
      await new Promise((resolve) => setTimeout(resolve, 3000))

      setPaymentSuccess(true)
      toast({
        title: "Thanh toán thành công!",
        description: `Đã thanh toán ${formatCurrency(amount)} cho chuyến đi`,
      })

      setTimeout(() => {
        setPaymentSuccess(false)
        onClose()
      }, 2000)
    } catch (error) {
      toast({
        title: "Lỗi thanh toán",
        description: "Không thể xử lý thanh toán. Vui lòng thử lại.",
        variant: "destructive",
      })
    } finally {
      setIsProcessing(false)
    }
  }

  if (paymentSuccess) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-md">
          <div className="text-center py-8">
            <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-foreground mb-2">Thanh toán thành công!</h3>
            <p className="text-muted-foreground mb-4">Giao dịch {formatCurrency(amount)} đã được xử lý thành công</p>
            <Badge variant="outline" className="text-green-600 border-green-600">
              Mã giao dịch: TXN{Date.now().toString().slice(-8)}
            </Badge>
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5 text-primary" />
            Thanh toán MoMo
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Payment Summary */}
          <Card>
            <CardContent className="p-4">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm text-muted-foreground">Tổng tiền cần thanh toán:</span>
                <span className="text-lg font-bold text-primary">{formatCurrency(amount)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Phí giao dịch:</span>
                <span className="text-sm">Miễn phí</span>
              </div>
            </CardContent>
          </Card>

          {/* Payment Methods */}
          <div className="space-y-3">
            <Label>Chọn phương thức thanh toán</Label>
            <div className="grid grid-cols-3 gap-3">
              <Card
                className={`cursor-pointer transition-colors ${paymentMethod === "momo" ? "border-primary bg-primary/5" : ""}`}
                onClick={() => setPaymentMethod("momo")}
              >
                <CardContent className="p-4 text-center">
                  <Smartphone className="h-6 w-6 text-pink-500 mx-auto mb-2" />
                  <p className="text-sm font-medium">MoMo Wallet</p>
                </CardContent>
              </Card>

              <Card
                className={`cursor-pointer transition-colors ${paymentMethod === "bank" ? "border-primary bg-primary/5" : ""}`}
                onClick={() => setPaymentMethod("bank")}
              >
                <CardContent className="p-4 text-center">
                  <CreditCard className="h-6 w-6 text-blue-500 mx-auto mb-2" />
                  <p className="text-sm font-medium">Thẻ ngân hàng</p>
                </CardContent>
              </Card>

              <Card
                className={`cursor-pointer transition-colors ${paymentMethod === "qr" ? "border-primary bg-primary/5" : ""}`}
                onClick={() => setPaymentMethod("qr")}
              >
                <CardContent className="p-4 text-center">
                  <QrCode className="h-6 w-6 text-green-500 mx-auto mb-2" />
                  <p className="text-sm font-medium">QR Code</p>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Payment Form */}
          {paymentMethod === "momo" && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="phone">Số điện thoại MoMo</Label>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="0987654321"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                />
              </div>
            </div>
          )}

          {paymentMethod === "bank" && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="cardNumber">Số thẻ</Label>
                <Input id="cardNumber" type="text" placeholder="1234 5678 9012 3456" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="expiry">MM/YY</Label>
                  <Input id="expiry" type="text" placeholder="12/25" />
                </div>
                <div>
                  <Label htmlFor="cvv">CVV</Label>
                  <Input id="cvv" type="text" placeholder="123" />
                </div>
              </div>
            </div>
          )}

          {paymentMethod === "qr" && (
            <div className="text-center py-8">
              <div className="w-48 h-48 bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg mx-auto mb-4 flex items-center justify-center">
                <QrCode className="h-24 w-24 text-gray-400" />
              </div>
              <p className="text-sm text-muted-foreground">Quét mã QR bằng ứng dụng MoMo để thanh toán</p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3">
            <Button variant="outline" onClick={onClose} className="flex-1 bg-transparent">
              Hủy
            </Button>
            <Button
              onClick={handlePayment}
              disabled={isProcessing || (paymentMethod === "momo" && !phoneNumber)}
              className="flex-1"
            >
              {isProcessing ? "Đang xử lý..." : `Thanh toán ${formatCurrency(amount)}`}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
