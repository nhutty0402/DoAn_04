import React, { useState, useEffect } from 'react';
import {
  Clock,
  AlertCircle,
  Trash2,
  Calendar,
  Plus,
  GripVertical,
  Edit,
} from 'lucide-react';
/*
import { Button } from '@/components/ui/button'; // Giả định đường dẫn shadcn
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card'; // Giả định đường dẫn shadcn
import { useToast } from '@/components/ui/use-toast'; // Giả định đường dẫn shadcn
*/
import { motion, Reorder } from 'framer-motion';

// --- Placeholder Components (thay thế cho shadcn/ui) ---
// Do môi trường này không thể import từ '@/',
// chúng ta tạo các component giữ chỗ đơn giản.

// Placeholder cho Button
const Button = ({
  variant,
  size,
  className = '',
  children,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: string;
  size?: string;
}) => (
  <button
    className={`inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none
      ${
        variant === 'destructive'
          ? 'bg-red-600 text-white hover:bg-red-700'
          : variant === 'outline'
          ? 'border border-gray-300 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800'
          : variant === 'ghost'
          ? 'hover:bg-gray-100 dark:hover:bg-gray-800'
          : 'bg-blue-600 text-white hover:bg-blue-700' // 'primary'
      }
      ${
        size === 'icon'
          ? 'h-10 w-10'
          : size === 'sm'
          ? 'h-9 px-3 rounded-md'
          : 'h-10 py-2 px-4' // default
      }
      ${className}`} // className ở cuối để cho phép ghi đè
    {...props}
  >
    {children}
  </button>
);

// Placeholders cho Card
const Card = ({
  className = '',
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={`rounded-lg border dark:border-gray-800 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 shadow-sm ${className}`}
    {...props}
  />
);

const CardHeader = ({
  className = '',
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={`flex flex-col space-y-1.5 p-6 ${className}`} {...props} /> // shadcn default: p-6
);

const CardTitle = ({
  className = '',
  ...props
}: React.HTMLAttributes<HTMLHeadingElement>) => (
  <h3
    className={`text-2xl font-semibold leading-none tracking-tight ${className}`} // shadcn default: text-2xl
    {...props}
  />
);

const CardDescription = ({
  className = '',
  ...props
}: React.HTMLAttributes<HTMLParagraphElement>) => (
  <p
    className={`text-sm text-gray-600 dark:text-gray-400 ${className}`}
    {...props}
  /> // text-muted-foreground
);

const CardContent = ({
  className = '',
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={`p-6 pt-0 ${className}`} {...props} /> // shadcn default: p-6 pt-0
);

// Placeholder cho useToast
const useToast = () => {
  return {
    toast: ({
      title,
      description,
      variant,
    }: {
      title: string;
      description: string;
      variant?: string;
    }) => {
      console.log(
        `[Toast (${variant || 'default'})]: ${title} - ${description}`
      );
      // Trong môi trường này, chúng ta chỉ log ra console
    },
  };
};

// --- Kết thúc Placeholder Components ---

// --- Các kiểu dữ liệu (Types) ---
// Định nghĩa các kiểu dữ liệu cơ bản.
            {
              id: 'poi1',
              ten: 'Tham quan Dinh Độc Lập',
              hinhAnh:
                'https://placehold.co/100x100/e2e8f0/64748b?text=POI+1',
              gioBatDau: '09:00',
              gioKetThuc: '11:00',
              thoiGianDiChuyen: 30,
              ghiChu: 'Tìm hiểu về lịch sử Việt Nam.',
            },
            {
              id: 'poi2',
              ten: 'Ăn trưa tại Bến Thành',
              hinhAnh:
                'https://placehold.co/100x100/e2e8f0/64748b?text=POI+2',
              gioBatDau: '11:30',
              gioKetThuc: '13:00',
              thoiGianDiChuyen: 0,
              ghiChu: 'Thử các món ăn đường phố.',
            },
          ],
        },
        {
          id: 'day2',
          ngay: 'Ngày 2',
          moTa: 'Thứ ba, 29/10/2024',
          pois: [],
        },
      ]);
      setIsLoading(false);
      // Giả lập lỗi:
      // setError("Không thể tải lịch trình. Vui lòng thử lại.");
    }, 1500);
  }, []);

  // Hàm xử lý xóa POI
  const handleDeletePoi = (dayId: string, poiId: string) => {
    setDays((currentDays) =>
      currentDays.map((day) => {
        if (day.id === dayId) {
          return {
            ...day,
            pois: day.pois.filter((poi) => poi.id !== poiId),
          };
        }
        return day;
      })
    );
    toast({
      title: 'Đã xóa địa điểm',
      description: 'Địa điểm đã được xóa khỏi lịch trình.',
      variant: 'destructive',
    });
  };

  // Hàm xử lý thêm ngày mới
  const handleAddDay = (dayData: { ngay: string; moTa: string }) => {
    const newDay: Day = {
      id: `day${new Date().getTime()}`, // ID duy nhất
      ...dayData,
      pois: [],
    };
    setDays([...days, newDay]);
    setShowAddDayModal(false);
    toast({
      title: 'Đã thêm ngày',
      description: 'Ngày mới đã được thêm vào lịch trình.',
    });
  };

  // --- Render ---
  return (
    <div className="p-4 md:p-6 bg-gray-50 dark:bg-gray-950 min-h-screen">
      {/* Trạng thái đang tải */}
      {isLoading && (
        <div className="text-center py-12">
          <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4 animate-spin" />
          <p className="text-muted-foreground">Đang tải lịch trình...</p>
        </div>
      )}

      {/* Trạng thái lỗi */}
      {error && !isLoading && (
        <div className="text-center py-12 text-destructive-foreground bg-destructive/90 p-6 rounded-lg">
          <AlertCircle className="h-12 w-12 mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">Đã xảy ra lỗi</h3>
          <p>{error}</p>
        </div>
      )}

      {/* Nội dung khi đã tải xong và không có lỗi */}
      {!isLoading && !error && days.length > 0 && (
        <div className="flex flex-col gap-6">
          <Reorder.Group
            axis="y"
            values={days}
            onReorder={setDays}
            className="space-y-6"
          >
            {days.map((day) => (
              <Reorder.Item key={day.id} value={day}>
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <Card className="overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4 bg-gray-100/50 dark:bg-gray-900/50 border-b dark:border-gray-800">
                      <div>
                        <CardTitle className="text-xl font-bold text-primary">
                          {day.ngay}
                        </CardTitle>
                        <CardDescription>{day.moTa}</CardDescription>
                      </div>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setEditingDay(day)}
                          className="text-muted-foreground hover:text-primary"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="cursor-grab active:cursor-grabbing text-muted-foreground"
                        >
                          <GripVertical className="h-5 w-5" />
                        </Button>
                      </div>
                    </CardHeader>

                    <CardContent className="p-4 md:p-6">
                      {/* Danh sách POI */}
                      {day.pois.length > 0 ? (
                        <div className="space-y-4">
                          {day.pois.map((poi, index) => (
                            <div
                              key={poi.id}
                              className={`flex items-start gap-4 ${
                                index > 0
                                  ? 'pt-4 border-t border-dashed dark:border-gray-700'
                                  : ''
                              }`}
                            >
                              <img
                                src={poi.hinhAnh}
                                alt={poi.ten}
                                className="h-20 w-20 md:h-24 md:w-24 rounded-lg object-cover border dark:border-gray-700"
                                onError={(e) =>
                                  (e.currentTarget.src =
                                    'https://placehold.co/100x100/e2e8f0/64748b?text=Error')
                                }
                              />
                              <div className="flex-1">
                                <h4 className="font-semibold text-base text-foreground">
                                  {poi.ten}
                                </h4>

                                {/* --- KHỐI ĐÃ SỬA LỖI ---
                                  Đã loại bỏ ký tự '_' thừa từ đây 
                                */}
                                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground mb-2">
                                  <div className="flex items-center gap-1">
                                    <Clock className="h-4 w-4" />
                                    <span>
                                      {poi.gioBatDau} - {poi.gioKetThuc}
                                    </span>
                                  </div>
                                  {poi.thoiGianDiChuyen > 0 && (
                                    <div className="flex items-center gap-1 text-orange-600 dark:text-orange-500">
                                      <AlertCircle className="h-4 w-4" />
                                      <span>
                                        {poi.thoiGianDiChuyen} phút di chuyển
                                      </span>
                                    </div>
                                  )}
                                </div>
                                {/* Lỗi đã được sửa ở trên */}

                                {poi.ghiChu && (
                                  <p className="text-sm text-muted-foreground font-[family-name:var(--font-dm-sans)]">
                                    {poi.ghiChu}
                                    {/* Đã loại bỏ ký tự 's' thừa từ đây */}
                                  </p>
                                )}
                              </div>

                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleDeletePoi(day.id, poi.id)}
                                className="text-muted-foreground hover:text-destructive"
                              >
                                <Trash2 className="h-4 w-4" />
                                {/* Đã loại bỏ ký tự 'Â' thừa từ đây */}
                              </Button>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center text-muted-foreground py-6">
                          <p>Chưa có địa điểm nào cho ngày này.</p>
                          {/* Bạn có thể thêm nút "Thêm địa điểm" ở đây */}
                        </div>
                      )}
                      {/* Đã loại bỏ ký tự '_' thừa từ trước thẻ đóng </CardContent> */}
                    </CardContent>
                  </Card>
                </motion.div>
              </Reorder.Item>
            ))}
          </Reorder.Group>

          {/* Nút Thêm Ngày */}
          <div className="flex justify-center mt-4">
            <Button
              onClick={() => setShowAddDayModal(true)}
              variant="outline"
              className="w-full md:w-auto border-dashed hover:border-solid"
            >
              <Plus className="h-4 w-4 mr-2" />
              Thêm Ngày
            </Button>
          </div>
        </div>
      )}

      {/* Màn hình trống khi không có lịch trình (sau khi đã tải xong) */}
      {!isLoading && !error && days.length === 0 && (
        <div className="text-center py-12">
          <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-foreground mb-2">
            Chưa có lịch trình
          </h3>
          <p className="text-muted-foreground mb-4">
            Bắt đầu bằng cách thêm ngày đầu tiên
          </p>
          <Button
            onClick={() => setShowAddDayModal(true)}
            className="bg-primary hover:bg-primary/90"
          >
            <Plus className="h-4 w-4 mr-2" />
            Thêm Ngày Đầu Tiên
            {/* Đã loại bỏ ký tự 'A' thừa từ đây */}
          </Button>
        </div>
      )}

      {/* --- Các Modal --- */}
      {showAddDayModal && (
        <AddDayModal
          onClose={() => setShowAddDayModal(false)}
          onSubmit={handleAddDay}
        />
      )}

      {editingDay && (
        <EditDayModal
          day={editingDay}
          onClose={() => setEditingDay(null)}
          onSubmit={(dayData) => {
            // TODO: Cần gọi API PUT/PATCH để cập nhật ngày trên máy chủ
            setDays(
              days.map((day) =>
                day.id === editingDay.id ? { ...day, ...dayData } : day
              )
            );
            setEditingDay(null);
            toast({
              title: 'Đã cập nhật ngày',
              description: 'Thông tin ngày đã được cập nhật.',
            });
          }}
        />
      )}
    </div>
  );
}


