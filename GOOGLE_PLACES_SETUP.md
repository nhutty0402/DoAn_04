# Hướng dẫn cài đặt Google Places API

## Bước 1: Tạo Google Cloud Project
1. Truy cập [Google Cloud Console](https://console.cloud.google.com/)
2. Tạo project mới hoặc chọn project hiện có
3. Bật billing cho project (cần thiết để sử dụng Places API)

## Bước 2: Bật Google Places API
1. Vào **APIs & Services** > **Library**
2. Tìm kiếm "Places API"
3. Chọn **Places API** và nhấn **Enable**

## Bước 3: Tạo API Key
1. Vào **APIs & Services** > **Credentials**
2. Nhấn **Create Credentials** > **API Key**
3. Copy API key được tạo

## Bước 4: Cấu hình API Key
1. Tạo file `.env.local` trong thư mục gốc của project
2. Thêm dòng sau:
```
NEXT_PUBLIC_GOOGLE_PLACES_API_KEY=your_api_key_here
```

## Bước 5: Giới hạn API Key (Tùy chọn nhưng khuyến nghị)
1. Vào **APIs & Services** > **Credentials**
2. Nhấn vào API key vừa tạo
3. Trong **Application restrictions**, chọn **HTTP referrers**
4. Thêm domain của bạn (ví dụ: `localhost:3000/*`, `yourdomain.com/*`)
5. Trong **API restrictions**, chọn **Restrict key**
6. Chọn **Places API**

## Bước 6: Kiểm tra
1. Restart development server: `npm run dev`
2. Mở trang thêm điểm trong lịch trình
3. Thử tìm kiếm địa điểm trong trường "Tìm kiếm địa điểm"

## Lưu ý
- Google Places API có giới hạn miễn phí: $200/tháng
- Sau khi vượt quá giới hạn, sẽ tính phí $0.017 cho mỗi request
- Có thể theo dõi usage trong Google Cloud Console

## Troubleshooting
- Nếu không tìm thấy địa điểm: Kiểm tra API key và Places API đã được enable
- Nếu có lỗi CORS: Đảm bảo domain được thêm vào HTTP referrers
- Nếu có lỗi quota: Kiểm tra billing account đã được kích hoạt









