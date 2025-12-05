"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Separator } from "@/components/ui/separator"
import { Plus, MapPin, Calendar, DollarSign, Clock, ChevronDown } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface DiemDen {
  diem_den_id: number
  ten_diem_den: string
  thu_tu: number
  ngay_bat_dau: string
  ngay_ket_thuc: string
  dia_diem_xuat_phat: string
  ghi_chu: string
}

interface LichTrinh {
  lich_trinh_id: number
  diem_den_id: number
  ngay: string
  tieu_de: string
  ghi_chu: string
  gio_bat_dau: string
  gio_ket_thuc: string
}

interface ChiPhi {
  chi_phi_id: number
  diem_den_id: number
  nguoi_chi_id: number
  nguoi_chi_ten: string
  so_tien: number
  mo_ta: string
  nhom: string
  ngay: string
}

interface PlanningTabProps {
  tripId: string
}

export function PlanningTab({ tripId }: PlanningTabProps) {
  const { toast } = useToast()
  
  // Mock data mẫu
  const mockDiemDen: DiemDen[] = [
    {
      diem_den_id: 1,
      ten_diem_den: "Đà Nẵng",
      thu_tu: 1,
      ngay_bat_dau: "2024-12-01",
      ngay_ket_thuc: "2024-12-03",
      dia_diem_xuat_phat: "Sân bay Đà Nẵng",
      ghi_chu: "Thành phố biển xinh đẹp, nhiều điểm tham quan nổi tiếng"
    },
    {
      diem_den_id: 2,
      ten_diem_den: "Hội An",
      thu_tu: 2,
      ngay_bat_dau: "2024-12-04",
      ngay_ket_thuc: "2024-12-05",
      dia_diem_xuat_phat: "Từ Đà Nẵng",
      ghi_chu: "Phố cổ Hội An - Di sản văn hóa thế giới"
    },
    {
      diem_den_id: 3,
      ten_diem_den: "Huế",
      thu_tu: 3,
      ngay_bat_dau: "2024-12-06",
      ngay_ket_thuc: "2024-12-08",
      dia_diem_xuat_phat: "Từ Hội An",
      ghi_chu: "Cố đô Huế với nhiều di tích lịch sử"
    }
  ]

  const mockLichTrinh: LichTrinh[] = [
    {
      lich_trinh_id: 1,
      diem_den_id: 1,
      ngay: "2024-12-01",
      tieu_de: "Tham quan Cầu Rồng",
      ghi_chu: "Xem rồng phun lửa vào cuối tuần",
      gio_bat_dau: "09:00",
      gio_ket_thuc: "10:30"
    },
    {
      lich_trinh_id: 2,
      diem_den_id: 1,
      ngay: "2024-12-01",
      tieu_de: "Ăn trưa tại Chợ Hàn",
      ghi_chu: "Thử các món đặc sản địa phương",
      gio_bat_dau: "12:00",
      gio_ket_thuc: "13:30"
    },
    {
      lich_trinh_id: 3,
      diem_den_id: 1,
      ngay: "2024-12-02",
      tieu_de: "Tắm biển Mỹ Khê",
      ghi_chu: "Thư giãn và ngắm hoàng hôn",
      gio_bat_dau: "15:00",
      gio_ket_thuc: "18:00"
    },
    {
      lich_trinh_id: 4,
      diem_den_id: 2,
      ngay: "2024-12-04",
      tieu_de: "Tham quan Phố cổ Hội An",
      ghi_chu: "Đi bộ quanh phố cổ, chụp ảnh",
      gio_bat_dau: "08:00",
      gio_ket_thuc: "12:00"
    },
    {
      lich_trinh_id: 5,
      diem_den_id: 2,
      ngay: "2024-12-04",
      tieu_de: "Thả đèn hoa đăng",
      ghi_chu: "Hoạt động đặc trưng của Hội An",
      gio_bat_dau: "19:00",
      gio_ket_thuc: "21:00"
    },
    {
      lich_trinh_id: 6,
      diem_den_id: 3,
      ngay: "2024-12-06",
      tieu_de: "Tham quan Đại Nội Huế",
      ghi_chu: "Khám phá kiến trúc cung đình",
      gio_bat_dau: "08:00",
      gio_ket_thuc: "11:30"
    }
  ]

  const mockChiPhi: ChiPhi[] = [
    {
      chi_phi_id: 1,
      diem_den_id: 1,
      nguoi_chi_id: 1,
      nguoi_chi_ten: "Nguyễn Văn A",
      so_tien: 2400000,
      mo_ta: "Khách sạn Muong Thanh",
      nhom: "Lưu trú",
      ngay: "2024-12-01"
    },
    {
      chi_phi_id: 2,
      diem_den_id: 1,
      nguoi_chi_id: 2,
      nguoi_chi_ten: "Trần Thị B",
      so_tien: 480000,
      mo_ta: "Ăn trưa tại Chợ Hàn",
      nhom: "Ăn uống",
      ngay: "2024-12-01"
    },
    {
      chi_phi_id: 3,
      diem_den_id: 1,
      nguoi_chi_id: 3,
      nguoi_chi_ten: "Lê Văn C",
      so_tien: 500000,
      mo_ta: "Vé tham quan Bà Nà Hills",
      nhom: "Giải trí",
      ngay: "2024-12-02"
    },
    {
      chi_phi_id: 4,
      diem_den_id: 2,
      nguoi_chi_id: 1,
      nguoi_chi_ten: "Nguyễn Văn A",
      so_tien: 1500000,
      mo_ta: "Khách sạn Hội An",
      nhom: "Lưu trú",
      ngay: "2024-12-04"
    },
    {
      chi_phi_id: 5,
      diem_den_id: 2,
      nguoi_chi_id: 2,
      nguoi_chi_ten: "Trần Thị B",
      so_tien: 300000,
      mo_ta: "Vé thả đèn hoa đăng",
      nhom: "Giải trí",
      ngay: "2024-12-04"
    },
    {
      chi_phi_id: 6,
      diem_den_id: 3,
      nguoi_chi_id: 1,
      nguoi_chi_ten: "Nguyễn Văn A",
      so_tien: 2000000,
      mo_ta: "Khách sạn tại Huế",
      nhom: "Lưu trú",
      ngay: "2024-12-06"
    },
    {
      chi_phi_id: 7,
      diem_den_id: 3,
      nguoi_chi_id: 3,
      nguoi_chi_ten: "Lê Văn C",
      so_tien: 400000,
      mo_ta: "Vé tham quan Đại Nội",
      nhom: "Giải trí",
      ngay: "2024-12-06"
    }
  ]

  const [diemDenList, setDiemDenList] = useState<DiemDen[]>(mockDiemDen)
  const [lichTrinhList, setLichTrinhList] = useState<LichTrinh[]>(mockLichTrinh)
  const [chiPhiList, setChiPhiList] = useState<ChiPhi[]>(mockChiPhi)
  
  // Modal state
  const [showAddPlanModal, setShowAddPlanModal] = useState(false)
  const [activeTab, setActiveTab] = useState("diem-den")
  
  // Form states
  const [diemDenForm, setDiemDenForm] = useState({
    ten_diem_den: "",
    thu_tu: 1,
    ngay_bat_dau: "",
    ngay_ket_thuc: "",
    dia_diem_xuat_phat: "",
    ghi_chu: ""
  })
  
  const [lichTrinhForm, setLichTrinhForm] = useState({
    diem_den_id: 0,
    ngay: "",
    tieu_de: "",
    ghi_chu: "",
    gio_bat_dau: "",
    gio_ket_thuc: ""
  })
  
  const [chiPhiForm, setChiPhiForm] = useState({
    diem_den_id: 0,
    nguoi_chi_id: 0,
    nguoi_chi_ten: "",
    so_tien: 0,
    mo_ta: "",
    nhom: "",
    ngay: ""
  })
  
  // ID counters - bắt đầu từ số cao hơn để tránh trùng với mock data
  const [diemDenIdCounter, setDiemDenIdCounter] = useState(4)
  const [lichTrinhIdCounter, setLichTrinhIdCounter] = useState(7)
  const [chiPhiIdCounter, setChiPhiIdCounter] = useState(8)

  // Handle Diem Den - Frontend only
  const handleDiemDenSubmit = () => {
    if (!diemDenForm.ten_diem_den.trim()) {
      toast({
        title: "Lỗi",
        description: "Vui lòng nhập tên điểm đến",
        variant: "destructive",
      })
      return
    }

    const newDiemDen: DiemDen = {
      diem_den_id: diemDenIdCounter,
      ten_diem_den: diemDenForm.ten_diem_den.trim(),
      thu_tu: diemDenForm.thu_tu,
      ngay_bat_dau: diemDenForm.ngay_bat_dau,
      ngay_ket_thuc: diemDenForm.ngay_ket_thuc,
      dia_diem_xuat_phat: diemDenForm.dia_diem_xuat_phat,
      ghi_chu: diemDenForm.ghi_chu,
    }

    setDiemDenList([...diemDenList, newDiemDen])
    setDiemDenIdCounter(diemDenIdCounter + 1)
    
    toast({
      title: "Thành công",
      description: "Đã thêm điểm đến",
    })

    setDiemDenForm({
      ten_diem_den: "",
      thu_tu: diemDenList.length + 2,
      ngay_bat_dau: "",
      ngay_ket_thuc: "",
      dia_diem_xuat_phat: "",
      ghi_chu: ""
    })
  }

  // Handle Lich Trinh - Frontend only
  const handleLichTrinhSubmit = () => {
    if (!lichTrinhForm.tieu_de.trim()) {
      toast({
        title: "Lỗi",
        description: "Vui lòng nhập tiêu đề",
        variant: "destructive",
      })
      return
    }

    if (!lichTrinhForm.diem_den_id) {
      toast({
        title: "Lỗi",
        description: "Vui lòng chọn điểm đến",
        variant: "destructive",
      })
      return
    }

    if (!lichTrinhForm.ngay) {
      toast({
        title: "Lỗi",
        description: "Vui lòng chọn ngày",
        variant: "destructive",
      })
      return
    }

    const newLichTrinh: LichTrinh = {
      lich_trinh_id: lichTrinhIdCounter,
      diem_den_id: lichTrinhForm.diem_den_id,
      ngay: lichTrinhForm.ngay,
      tieu_de: lichTrinhForm.tieu_de.trim(),
      ghi_chu: lichTrinhForm.ghi_chu,
      gio_bat_dau: lichTrinhForm.gio_bat_dau,
      gio_ket_thuc: lichTrinhForm.gio_ket_thuc,
    }

    setLichTrinhList([...lichTrinhList, newLichTrinh])
    setLichTrinhIdCounter(lichTrinhIdCounter + 1)
    
    toast({
      title: "Thành công",
      description: "Đã thêm lịch trình",
    })

    setLichTrinhForm({
      diem_den_id: 0,
      ngay: "",
      tieu_de: "",
      ghi_chu: "",
      gio_bat_dau: "",
      gio_ket_thuc: ""
    })
  }

  // Handle Chi Phi - Frontend only
  const handleChiPhiSubmit = () => {
    if (!chiPhiForm.mo_ta.trim()) {
      toast({
        title: "Lỗi",
        description: "Vui lòng nhập mô tả",
        variant: "destructive",
      })
      return
    }

    if (!chiPhiForm.diem_den_id) {
      toast({
        title: "Lỗi",
        description: "Vui lòng chọn điểm đến",
        variant: "destructive",
      })
      return
    }

    if (!chiPhiForm.nguoi_chi_ten.trim()) {
      toast({
        title: "Lỗi",
        description: "Vui lòng nhập tên người chi",
        variant: "destructive",
      })
      return
    }

    if (chiPhiForm.so_tien <= 0) {
      toast({
        title: "Lỗi",
        description: "Vui lòng nhập số tiền hợp lệ",
        variant: "destructive",
      })
      return
    }

    const newChiPhi: ChiPhi = {
      chi_phi_id: chiPhiIdCounter,
      diem_den_id: chiPhiForm.diem_den_id,
      nguoi_chi_id: chiPhiForm.nguoi_chi_id || chiPhiIdCounter,
      nguoi_chi_ten: chiPhiForm.nguoi_chi_ten.trim(),
      so_tien: chiPhiForm.so_tien,
      mo_ta: chiPhiForm.mo_ta.trim(),
      nhom: chiPhiForm.nhom,
      ngay: chiPhiForm.ngay || new Date().toISOString().split("T")[0],
    }

    setChiPhiList([...chiPhiList, newChiPhi])
    setChiPhiIdCounter(chiPhiIdCounter + 1)
    
    toast({
      title: "Thành công",
      description: "Đã thêm chi phí",
    })

    setChiPhiForm({
      diem_den_id: 0,
      nguoi_chi_id: 0,
      nguoi_chi_ten: "",
      so_tien: 0,
      mo_ta: "",
      nhom: "",
      ngay: ""
    })
  }

  const getDiemDenName = (id: number) => {
    const diemDen = diemDenList.find(d => d.diem_den_id === id)
    return diemDen?.ten_diem_den || "N/A"
  }

  const getMemberName = (id: number) => {
    // For frontend only, we'll use the stored name
    const chiPhi = chiPhiList.find(cp => cp.nguoi_chi_id === id)
    return chiPhi?.nguoi_chi_ten || `ID: ${id}`
  }

  // Group lịch trình và chi phí theo điểm đến
  const getLichTrinhByDiemDen = (diemDenId: number) => {
    return lichTrinhList.filter(lt => lt.diem_den_id === diemDenId)
  }

  const getChiPhiByDiemDen = (diemDenId: number) => {
    return chiPhiList.filter(cp => cp.diem_den_id === diemDenId)
  }

  // Get chi phí theo ngày và điểm đến
  const getChiPhiByNgay = (diemDenId: number, ngay: string) => {
    return chiPhiList.filter(cp => cp.diem_den_id === diemDenId && cp.ngay === ngay)
  }

  // Sort điểm đến theo thứ tự
  const sortedDiemDenList = [...diemDenList].sort((a, b) => a.thu_tu - b.thu_tu)

  return (
    <div className="space-y-6">
      {/* Header với nút Thêm kế hoạch */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Kế hoạch chuyến đi</h2>
        <Button onClick={() => setShowAddPlanModal(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Thêm kế hoạch
        </Button>
      </div>

      {/* Hiển thị điểm đến với lịch trình và chi phí */}
      {sortedDiemDenList.length === 0 ? (
        <Card>
          <CardContent className="p-8">
            <p className="text-muted-foreground text-center">Chưa có điểm đến nào. Hãy thêm điểm đến để bắt đầu!</p>
          </CardContent>
        </Card>
      ) : (
        <Accordion type="multiple" className="w-full space-y-4">
          {sortedDiemDenList.map((diemDen) => {
            const lichTrinhOfDiemDen = getLichTrinhByDiemDen(diemDen.diem_den_id)
            const chiPhiOfDiemDen = getChiPhiByDiemDen(diemDen.diem_den_id)
            const totalChiPhi = chiPhiOfDiemDen.reduce((sum, cp) => sum + cp.so_tien, 0)

            return (
              <AccordionItem key={diemDen.diem_den_id} value={`diem-den-${diemDen.diem_den_id}`} className="border rounded-lg px-4">
                <AccordionTrigger className="hover:no-underline">
                  <div className="flex items-center justify-between w-full pr-4">
                    <div className="flex items-center gap-3 flex-1 text-left">
                      <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary font-bold">
                        {diemDen.thu_tu}
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-lg">{diemDen.ten_diem_den}</h3>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                          {diemDen.ngay_bat_dau && diemDen.ngay_ket_thuc && (
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {new Date(diemDen.ngay_bat_dau).toLocaleDateString("vi-VN")} - {new Date(diemDen.ngay_ket_thuc).toLocaleDateString("vi-VN")}
                            </span>
                          )}
                          {diemDen.dia_diem_xuat_phat && (
                            <span className="flex items-center gap-1">
                              <MapPin className="h-3 w-3" />
                              {diemDen.dia_diem_xuat_phat}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 text-sm">
                      <Badge variant="secondary" className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {lichTrinhOfDiemDen.length} lịch trình
                      </Badge>
                      <Badge variant="secondary" className="flex items-center gap-1">
                        <DollarSign className="h-3 w-3" />
                        {chiPhiOfDiemDen.length} chi phí
                        {totalChiPhi > 0 && (
                          <span className="ml-1 font-semibold">
                            ({totalChiPhi.toLocaleString("vi-VN")} VNĐ)
                          </span>
                        )}
                      </Badge>
                    </div>
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <div className="pt-4 space-y-6">
                    {/* Thông tin điểm đến */}
                    {diemDen.ghi_chu && (
                      <div className="bg-muted/50 p-3 rounded-md">
                        <p className="text-sm text-muted-foreground">
                          <span className="font-medium">Ghi chú: </span>
                          {diemDen.ghi_chu}
                        </p>
                      </div>
                    )}

                    {/* Lịch trình */}
                    <div>
                      <div className="flex items-center gap-2 mb-3">
                        <Calendar className="h-4 w-4 text-primary" />
                        <h4 className="font-semibold">Lịch trình</h4>
                        <Badge variant="outline">{lichTrinhOfDiemDen.length} hoạt động</Badge>
                      </div>
                      {lichTrinhOfDiemDen.length === 0 ? (
                        <p className="text-sm text-muted-foreground pl-6">Chưa có lịch trình nào cho điểm đến này</p>
                      ) : (
                        <div className="space-y-3 pl-6">
                          {lichTrinhOfDiemDen.map((lichTrinh) => {
                            const chiPhiOfNgay = getChiPhiByNgay(diemDen.diem_den_id, lichTrinh.ngay)
                            const totalChiPhiNgay = chiPhiOfNgay.reduce((sum, cp) => sum + cp.so_tien, 0)

                            return (
                              <Card key={lichTrinh.lich_trinh_id} className="border-l-4 border-l-primary">
                                <CardContent className="p-4">
                                  <div className="space-y-3">
                                    {/* Thông tin lịch trình */}
                                    <div>
                                      <h5 className="font-semibold mb-2">{lichTrinh.tieu_de}</h5>
                                      <div className="flex items-center gap-4 text-sm text-muted-foreground mb-2">
                                        <span className="flex items-center gap-1">
                                          <Calendar className="h-3 w-3" />
                                          {new Date(lichTrinh.ngay).toLocaleDateString("vi-VN")}
                                        </span>
                                        {lichTrinh.gio_bat_dau && lichTrinh.gio_ket_thuc && (
                                          <span className="flex items-center gap-1">
                                            <Clock className="h-3 w-3" />
                                            {lichTrinh.gio_bat_dau} - {lichTrinh.gio_ket_thuc}
                                          </span>
                                        )}
                                      </div>
                                      {lichTrinh.ghi_chu && (
                                        <p className="text-sm text-muted-foreground">{lichTrinh.ghi_chu}</p>
                                      )}
                                    </div>

                                    {/* Chi phí trong ngày này */}
                                    {chiPhiOfNgay.length > 0 && (
                                      <div className="mt-3 pt-3 border-t">
                                        <div className="flex items-center gap-2 mb-2">
                                          <DollarSign className="h-3 w-3 text-secondary" />
                                          <span className="text-sm font-medium text-muted-foreground">Chi phí trong ngày:</span>
                                          {totalChiPhiNgay > 0 && (
                                            <Badge variant="secondary" className="ml-auto">
                                              Tổng: {totalChiPhiNgay.toLocaleString("vi-VN")} VNĐ
                                            </Badge>
                                          )}
                                        </div>
                                        <div className="space-y-2 ml-5">
                                          {chiPhiOfNgay.map((chiPhi) => (
                                            <div key={chiPhi.chi_phi_id} className="flex items-center justify-between p-2 bg-muted/30 rounded-md">
                                              <div className="flex-1">
                                                <div className="flex items-center gap-2">
                                                  <span className="text-sm font-medium">{chiPhi.mo_ta}</span>
                                                  {chiPhi.nhom && (
                                                    <Badge variant="outline" className="text-xs">{chiPhi.nhom}</Badge>
                                                  )}
                                                </div>
                                                <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
                                                  <span>Người chi: {chiPhi.nguoi_chi_ten || getMemberName(chiPhi.nguoi_chi_id)}</span>
                                                </div>
                                              </div>
                                              <div className="text-right">
                                                <p className="text-sm font-bold text-primary">
                                                  {chiPhi.so_tien.toLocaleString("vi-VN")} VNĐ
                                                </p>
                                              </div>
                                            </div>
                                          ))}
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                </CardContent>
                              </Card>
                            )
                          })}
                        </div>
                      )}
                    </div>

                    {/* Tổng chi phí điểm đến */}
                    {totalChiPhi > 0 && (
                      <div className="mt-4 pt-4 border-t">
                        <div className="flex items-center justify-between p-3 bg-primary/5 rounded-md">
                          <div className="flex items-center gap-2">
                            <DollarSign className="h-4 w-4 text-primary" />
                            <span className="font-semibold">Tổng chi phí điểm đến:</span>
                          </div>
                          <Badge variant="default" className="text-lg px-3 py-1">
                            {totalChiPhi.toLocaleString("vi-VN")} VNĐ
                          </Badge>
                        </div>
                      </div>
                    )}
                  </div>
                </AccordionContent>
              </AccordionItem>
            )
          })}
        </Accordion>
      )}

      {/* Modal Thêm kế hoạch với Tabs */}
      <Dialog open={showAddPlanModal} onOpenChange={(open) => {
        setShowAddPlanModal(open)
        if (!open) {
          // Reset forms when closing
          setDiemDenForm({
            ten_diem_den: "",
            thu_tu: diemDenList.length + 1,
            ngay_bat_dau: "",
            ngay_ket_thuc: "",
            dia_diem_xuat_phat: "",
            ghi_chu: ""
          })
          setLichTrinhForm({
            diem_den_id: 0,
            ngay: "",
            tieu_de: "",
            ghi_chu: "",
            gio_bat_dau: "",
            gio_ket_thuc: ""
          })
          setChiPhiForm({
            diem_den_id: 0,
            nguoi_chi_id: 0,
            nguoi_chi_ten: "",
            so_tien: 0,
            mo_ta: "",
            nhom: "",
            ngay: ""
          })
          setActiveTab("diem-den")
        }
      }}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Thêm kế hoạch</DialogTitle>
          </DialogHeader>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="diem-den" className="flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                Điểm đến
              </TabsTrigger>
              <TabsTrigger value="lich-trinh" className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Lịch trình
              </TabsTrigger>
              <TabsTrigger value="chi-phi" className="flex items-center gap-2">
                <DollarSign className="h-4 w-4" />
                Chi phí
              </TabsTrigger>
            </TabsList>

            {/* Tab Điểm đến */}
            <TabsContent value="diem-den" className="space-y-4 mt-4">
              <div>
                <Label htmlFor="ten_diem_den">Tên điểm đến *</Label>
                <Input
                  id="ten_diem_den"
                  value={diemDenForm.ten_diem_den}
                  onChange={(e) => setDiemDenForm({ ...diemDenForm, ten_diem_den: e.target.value })}
                  placeholder="Nhập tên điểm đến"
                />
              </div>
              <div>
                <Label htmlFor="thu_tu">Thứ tự</Label>
                <Input
                  id="thu_tu"
                  type="number"
                  value={diemDenForm.thu_tu}
                  onChange={(e) => setDiemDenForm({ ...diemDenForm, thu_tu: parseInt(e.target.value) || 1 })}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="ngay_bat_dau">Ngày bắt đầu</Label>
                  <Input
                    id="ngay_bat_dau"
                    type="date"
                    value={diemDenForm.ngay_bat_dau}
                    onChange={(e) => setDiemDenForm({ ...diemDenForm, ngay_bat_dau: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="ngay_ket_thuc">Ngày kết thúc</Label>
                  <Input
                    id="ngay_ket_thuc"
                    type="date"
                    value={diemDenForm.ngay_ket_thuc}
                    onChange={(e) => setDiemDenForm({ ...diemDenForm, ngay_ket_thuc: e.target.value })}
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="dia_diem_xuat_phat">Địa điểm xuất phát</Label>
                <Input
                  id="dia_diem_xuat_phat"
                  value={diemDenForm.dia_diem_xuat_phat}
                  onChange={(e) => setDiemDenForm({ ...diemDenForm, dia_diem_xuat_phat: e.target.value })}
                  placeholder="Nhập địa điểm xuất phát"
                />
              </div>
              <div>
                <Label htmlFor="ghi_chu_diem_den">Ghi chú</Label>
                <Textarea
                  id="ghi_chu_diem_den"
                  value={diemDenForm.ghi_chu}
                  onChange={(e) => setDiemDenForm({ ...diemDenForm, ghi_chu: e.target.value })}
                  placeholder="Nhập ghi chú"
                  rows={3}
                />
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowAddPlanModal(false)}>
                  Hủy
                </Button>
                <Button onClick={() => {
                  handleDiemDenSubmit()
                  setShowAddPlanModal(false)
                }}>
                  Thêm
                </Button>
              </DialogFooter>
            </TabsContent>

            {/* Tab Lịch trình */}
            <TabsContent value="lich-trinh" className="space-y-4 mt-4">
              <div>
                <Label htmlFor="diem_den_id_lich_trinh">Điểm đến *</Label>
                <select
                  id="diem_den_id_lich_trinh"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  value={lichTrinhForm.diem_den_id}
                  onChange={(e) => setLichTrinhForm({ ...lichTrinhForm, diem_den_id: parseInt(e.target.value) })}
                >
                  <option value={0}>Chọn điểm đến</option>
                  {diemDenList.map((diemDen) => (
                    <option key={diemDen.diem_den_id} value={diemDen.diem_den_id}>
                      {diemDen.ten_diem_den}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <Label htmlFor="ngay_lich_trinh">Ngày *</Label>
                <Input
                  id="ngay_lich_trinh"
                  type="date"
                  value={lichTrinhForm.ngay}
                  onChange={(e) => setLichTrinhForm({ ...lichTrinhForm, ngay: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="tieu_de">Tiêu đề *</Label>
                <Input
                  id="tieu_de"
                  value={lichTrinhForm.tieu_de}
                  onChange={(e) => setLichTrinhForm({ ...lichTrinhForm, tieu_de: e.target.value })}
                  placeholder="Nhập tiêu đề"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="gio_bat_dau">Giờ bắt đầu</Label>
                  <Input
                    id="gio_bat_dau"
                    type="time"
                    value={lichTrinhForm.gio_bat_dau}
                    onChange={(e) => setLichTrinhForm({ ...lichTrinhForm, gio_bat_dau: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="gio_ket_thuc">Giờ kết thúc</Label>
                  <Input
                    id="gio_ket_thuc"
                    type="time"
                    value={lichTrinhForm.gio_ket_thuc}
                    onChange={(e) => setLichTrinhForm({ ...lichTrinhForm, gio_ket_thuc: e.target.value })}
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="ghi_chu_lich_trinh">Ghi chú</Label>
                <Textarea
                  id="ghi_chu_lich_trinh"
                  value={lichTrinhForm.ghi_chu}
                  onChange={(e) => setLichTrinhForm({ ...lichTrinhForm, ghi_chu: e.target.value })}
                  placeholder="Nhập ghi chú"
                  rows={3}
                />
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowAddPlanModal(false)}>
                  Hủy
                </Button>
                <Button onClick={() => {
                  handleLichTrinhSubmit()
                  setShowAddPlanModal(false)
                }}>
                  Thêm
                </Button>
              </DialogFooter>
            </TabsContent>

            {/* Tab Chi phí */}
            <TabsContent value="chi-phi" className="space-y-4 mt-4">
              <div>
                <Label htmlFor="diem_den_id_chi_phi">Điểm đến *</Label>
                <select
                  id="diem_den_id_chi_phi"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  value={chiPhiForm.diem_den_id}
                  onChange={(e) => setChiPhiForm({ ...chiPhiForm, diem_den_id: parseInt(e.target.value) })}
                >
                  <option value={0}>Chọn điểm đến</option>
                  {diemDenList.map((diemDen) => (
                    <option key={diemDen.diem_den_id} value={diemDen.diem_den_id}>
                      {diemDen.ten_diem_den}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <Label htmlFor="nguoi_chi_ten">Tên người chi *</Label>
                <Input
                  id="nguoi_chi_ten"
                  value={chiPhiForm.nguoi_chi_ten}
                  onChange={(e) => setChiPhiForm({ ...chiPhiForm, nguoi_chi_ten: e.target.value })}
                  placeholder="Nhập tên người chi"
                />
              </div>
              <div>
                <Label htmlFor="so_tien">Số tiền *</Label>
                <Input
                  id="so_tien"
                  type="number"
                  value={chiPhiForm.so_tien || ""}
                  onChange={(e) => setChiPhiForm({ ...chiPhiForm, so_tien: parseFloat(e.target.value) || 0 })}
                  placeholder="Nhập số tiền"
                />
              </div>
              <div>
                <Label htmlFor="mo_ta">Mô tả *</Label>
                <Input
                  id="mo_ta"
                  value={chiPhiForm.mo_ta}
                  onChange={(e) => setChiPhiForm({ ...chiPhiForm, mo_ta: e.target.value })}
                  placeholder="Nhập mô tả"
                />
              </div>
              <div>
                <Label htmlFor="nhom">Nhóm</Label>
                <Input
                  id="nhom"
                  value={chiPhiForm.nhom}
                  onChange={(e) => setChiPhiForm({ ...chiPhiForm, nhom: e.target.value })}
                  placeholder="Nhập nhóm"
                />
              </div>
              <div>
                <Label htmlFor="ngay_chi_phi">Ngày</Label>
                <Input
                  id="ngay_chi_phi"
                  type="date"
                  value={chiPhiForm.ngay}
                  onChange={(e) => setChiPhiForm({ ...chiPhiForm, ngay: e.target.value })}
                />
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowAddPlanModal(false)}>
                  Hủy
                </Button>
                <Button onClick={() => {
                  handleChiPhiSubmit()
                  setShowAddPlanModal(false)
                }}>
                  Thêm
                </Button>
              </DialogFooter>
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>
    </div>
  )
}

