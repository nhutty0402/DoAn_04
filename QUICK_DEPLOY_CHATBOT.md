# 🚀 Hướng dẫn nhanh: Deploy Chatbot Backend lên Render

## ⚠️ Vấn đề hiện tại

Bạn đang gặp lỗi: **"Không kết nối được backend. Kiểm tra server backend tại localhost:5000"**

Điều này xảy ra vì:
- Frontend đang cố kết nối với `localhost:5000` (chỉ hoạt động khi chạy local)
- Khi deploy lên production, cần backend URL thực tế

## ✅ Giải pháp: Deploy Backend lên Render

### Bước 1: Chuẩn bị

1. **Có LLM API Key** (bắt buộc):
   - Đăng ký tại [OpenRouter](https://openrouter.ai/) hoặc LLM provider khác
   - Lấy API key

2. **Backend code sẵn sàng**:
   - Thư mục: `D:\CODE\FE 4\BOTTT\tour-chatbot-backend`
   - Đã có file `server.js` và các file data trong `data/`

### Bước 2: Deploy lên Render

#### Cách 1: Deploy từ Git (Khuyến nghị)

1. **Push code lên GitHub**:
   ```bash
   cd "D:\CODE\FE 4\BOTTT\tour-chatbot-backend"
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin <your-github-repo-url>
   git push -u origin main
   ```

2. **Tạo Web Service trên Render**:
   - Vào [Render Dashboard](https://dashboard.render.com)
   - Click **"New +"** → **"Web Service"**
   - Connect GitHub repository
   - Cấu hình:
     - **Name**: `tour-chatbot-backend`
     - **Environment**: `Node`
     - **Build Command**: `npm install`
     - **Start Command**: `node server.js`

3. **Thêm Environment Variables**:
   ```
   LLM_PROVIDER=openrouter
   LLM_API_KEY=<your_actual_api_key>
   LLM_BASE_URL=https://openrouter.ai/api/v1
   LLM_MODEL=google/gemma-2-9b-it
   NODE_ENV=production
   ```

4. **Deploy**: Click "Create Web Service"

#### Cách 2: Deploy thủ công (nếu không dùng Git)

1. Zip thư mục `tour-chatbot-backend`
2. Upload lên Render hoặc sử dụng Render CLI

### Bước 3: Lấy URL Backend

Sau khi deploy thành công, Render sẽ cung cấp URL như:
```
https://tour-chatbot-backend.onrender.com
```

### Bước 4: Cập nhật Frontend

1. **Tạo/Update file `.env.local`** trong `DoAn_04`:
   ```env
   NEXT_PUBLIC_CHATBOT_API_URL=https://tour-chatbot-backend.onrender.com
   ```

2. **Rebuild và deploy frontend**:
   ```bash
   npm run build
   ```

3. **Hoặc nếu deploy frontend lên Render**:
   - Thêm environment variable:
     ```
     NEXT_PUBLIC_CHATBOT_API_URL=https://tour-chatbot-backend.onrender.com
     ```

## 🧪 Test Local (Tạm thời)

Nếu chỉ cần test ngay, bạn có thể chạy backend local:

```bash
# Terminal 1: Chạy backend
cd "D:\CODE\FE 4\BOTTT\tour-chatbot-backend"
npm install
# Tạo file .env với LLM_API_KEY
npm start

# Terminal 2: Chạy frontend
cd "D:\CODE\FE 4\DoAn_04"
npm run dev
```

Frontend sẽ tự động kết nối với `http://localhost:5000` (mặc định).

## 📝 Checklist

- [ ] Có LLM API Key (OpenRouter hoặc provider khác)
- [ ] Backend code đã sẵn sàng
- [ ] Đã deploy backend lên Render
- [ ] Đã lấy URL backend từ Render
- [ ] Đã cập nhật `NEXT_PUBLIC_CHATBOT_API_URL` trong frontend
- [ ] Đã test chatbot hoạt động

## 🔗 Tài liệu chi tiết

Xem thêm: [CHATBOT_DEPLOY_RENDER.md](./CHATBOT_DEPLOY_RENDER.md)


