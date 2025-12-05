# Hướng dẫn chạy dự án VN-Travel

## Yêu cầu hệ thống
- Node.js 18+ 
- npm hoặc pnpm

## Các bước chạy dự án

### 1. Cài đặt dependencies (nếu chưa có)
```bash
npm install
# hoặc
pnpm install
```

### 2. Chạy development server
```bash
npm run dev
# hoặc
pnpm dev
```

### 3. Mở trình duyệt
Truy cập: http://localhost:3000

## Các lệnh khác

### Build production
```bash
npm run build
```

### Chạy production server
```bash
npm run start
```

### Lint code
```bash
npm run lint
```

## Lưu ý

### Environment Variables (Tùy chọn)
Nếu cần sử dụng Google Places API (không bắt buộc), tạo file `.env.local`:
```env
NEXT_PUBLIC_GOOGLE_PLACES_API_KEY=your_api_key_here
```

**Lưu ý**: Bản đồ đường đi đã sử dụng Mapbox (miễn phí), không cần Google Maps API key.

### Backend API
Dự án kết nối với backend tại: `https://travel-planner-imdw.onrender.com/api/`

Đảm bảo backend đang hoạt động để các tính năng hoạt động đúng.

## Troubleshooting

### Lỗi: "Cannot find module"
Chạy lại: `npm install`

### Lỗi: "Port 3000 already in use"
- Đổi port: `npm run dev -- -p 3001`
- Hoặc tắt process đang dùng port 3000

### Lỗi: "Module not found"
Kiểm tra xem đã cài đầy đủ dependencies chưa: `npm install`

