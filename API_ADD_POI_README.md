# Hướng dẫn sử dụng API thêm điểm

## Tổng quan
Đã cập nhật thành công chức năng thêm điểm vào lịch trình với API call Axios.

## Các thay đổi chính

### 1. Cập nhật AddPoiModal (`components/itinerary/add-poi-modal.tsx`)
- ✅ Thêm trường `tripId` vào props
- ✅ Thêm các trường mới:
  - `googlePlaceId`: Google Place ID (tùy chọn)
  - `viDo`: Vĩ độ
  - `kinhDo`: Kinh độ
- ✅ Cập nhật enum loại địa điểm theo API:
  - `POI`: Điểm tham quan
  - `hotel`: Khách sạn
  - `transport`: Phương tiện
  - `activity`: Hoạt động
  - `other`: Khác

### 2. Cập nhật ItineraryTab (`components/trip/itinerary-tab.tsx`)
- ✅ Thêm API call POST đến `https://travel-planner-imdw.onrender.com/api/dia-diem/them`
- ✅ Cập nhật `handleAddPoi` để gọi API thay vì chỉ cập nhật local state
- ✅ Thêm xử lý lỗi chi tiết (401, 400, 404)
- ✅ Cập nhật `getPoiTypeLabel` để hỗ trợ enum mới

## Format API Request

```json
{
  "dia_diem_id": null,
  "chuyen_di_id": "trip_id",
  "lich_trinh_ngay_id": "day_id", 
  "ten_dia_diem": "Tên địa điểm",
  "loai_dia_diem": "POI|hotel|transport|activity|other",
  "google_place_id": "ChIJ...",
  "vi_do": "16.0544",
  "kinh_do": "108.2272",
  "thoi_gian_bat_dau": "09:00",
  "thoi_gian_ket_thuc": "10:30",
  "ghi_chu": "Ghi chú",
  "tao_luc": "2024-01-01T00:00:00.000Z"
}
```

## Cách sử dụng

1. Mở trang trip detail
2. Chuyển đến tab "Lịch Trình"
3. Nhấn "Thêm Ngày" nếu chưa có ngày nào
4. Nhấn "Thêm Điểm" trên ngày muốn thêm điểm
5. Điền thông tin:
   - Tên địa điểm (bắt buộc)
   - Loại địa điểm (bắt buộc)
   - Google Place ID (tùy chọn)
   - Vĩ độ, Kinh độ (tùy chọn)
   - Giờ bắt đầu, kết thúc (bắt buộc)
   - Ghi chú (tùy chọn)
6. Nhấn "Thêm Điểm Đến"

## Xử lý lỗi

- **401**: Token hết hạn → Chuyển về trang login
- **400**: Dữ liệu không hợp lệ → Hiển thị thông báo lỗi
- **404**: Không tìm thấy ngày → Hiển thị thông báo lỗi
- **Khác**: Lỗi chung → Hiển thị thông báo lỗi

## Test API

Sử dụng file `test-add-poi-api.js` để test API:

```bash
node test-add-poi-api.js
```

Nhớ thay thế `YOUR_TOKEN_HERE`, `YOUR_TRIP_ID`, và `YOUR_DAY_ID` bằng giá trị thực tế.
































