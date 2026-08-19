# 🤖 FRONTEND AGENT & DEVELOPER COLLABORATION GUIDE
> **Project:** dillustration Frontend (`dil-frontend`)  
> **Target Audience:** Human Developers & AI Coding Agents  
> **Purpose:** Quy chuẩn đồng bộ phát triển, nguyên tắc kiến trúc và hướng dẫn từng bước để mở rộng codebase mà không vỡ hệ thống.

---

## 1. Core Tech Stack & System Architecture

| Thành phần | Công nghệ / Quy chuẩn | Quy định bắt buộc |
| :--- | :--- | :--- |
| **Framework** | Next.js 14 (App Router `src/app`) | Mọi trang mới phải nằm trong `src/app/` dưới dạng Server hoặc Client Component (`'use client'`). |
| **Language** | TypeScript (v5+) | Bắt buộc 100% Type Safety. Định nghĩa type DTO trong `src/types/`. Cấm dùng `any`. |
| **Styling** | Tailwind CSS v4 | Dùng CSS Variable & Tailwind Tokens. Khống chế tông màu `#1F2335` & `#A7ACD9`. |
| **State** | Zustand (`src/store/`) | Quản lý state toàn cục. Lưu trữ `accessToken`, `refreshToken`, `user`, `roles` vào `localStorage`. |
| **API Client** | Axios (`src/lib/api-client.ts`) | Dùng duy nhất `apiClient` instance. Tự động chèn Bearer Token và tự xoay Refresh Token khi lỗi 401. |
| **Forms** | React Hook Form + Zod | 100% Form nhập liệu phải validate bằng Zod Schema trước khi gọi API. |

---

## 2. Quy tắc Phân quyền Đa vai trò (Dual-Role Architecture)

AI Agent & Developer cần lưu ý quy tắc phân quyền người dùng trong ứng dụng:

1. **Mặc định là Client (`"Client"`)**:
   - Khi đăng ký tài khoản mới (`POST /api/v1/auth/register`), mọi người dùng đều mặc định có vai trò `"Client"`.
2. **Kích hoạt vai trò Creator (`"Creator"`)**:
   - Khi người dùng tạo `CreatorProfile`, hệ thống gọi API bổ sung vai trò `"Creator"`.
   - **LƯU Ý:** Người dùng sẽ sở hữu **ĐỒNG THỜI CẢ 2 VAI TRÒ**: `roles = ["Client", "Creator"]`. Không bao giờ ghi đè làm mất vai trò `"Client"`.

---

## 3. Digital Etherealism Design System Rules

Mọi trang UI mới được tạo ra phải tuân thủ 100% ngôn ngữ thiết kế **Digital Etherealism**:

1. **Logo chính thức**: Sử dụng duy nhất file hình ảnh `/weblogo.png` (đã được làm sạch nền trong suốt).
   ```tsx
   <img src="/weblogo.png" alt="dillustration" className="h-14 md:h-16 w-auto object-contain" />
   ```
2. **Lớp phủ Thủy tinh (Glassmorphism)**: Thẻ chứa nội dung phải dùng class `.glass-container`:
   - Phủ mờ background `backdrop-filter: blur(24px)`.
   - Viền kim loại trên `border-t border-white/15`.
   - Bo góc `rounded-3xl` hoặc `rounded-[32px]`.
3. **Màu sắc & Fonts**:
   - Background chính: `#1F2335` (Brand Navy).
   - Tông sáng nhấn: `#A7ACD9` (Brand Periwinkle).
   - Font Tiêu đề (H1-H3): `font-h1` (`Sora`).
   - Font Nội dung & Nhãn: `font-body` (`Space Grotesk`).

---

## 4. Chuẩn Quy trình Gọi Backend API

Backend API hoạt động tại `http://localhost:5075/api/v1` với chuẩn Response Envelope:

```json
{
  "data": { ... },
  "meta": null,
  "error": null
}
```

### Hướng dẫn bổ sung API Service mới:
1. Tạo interface DTO trong `src/types/`.
2. Tạo file service mới trong `src/services/` (ví dụ: `creator.service.ts`).
3. Gọi qua `apiClient` từ `src/lib/api-client.ts`:
   ```typescript
   import { apiClient } from '@/lib/api-client';
   import { ApiResponse } from '@/types/api.types';

   export const creatorService = {
     async getCreators(): Promise<CreatorDto[]> {
       const response = await apiClient.get<ApiResponse<CreatorDto[]>>('/creators');
       if (response.data.error || !response.data.data) {
         throw new Error(response.data.error?.details?.join(', ') || 'Failed to fetch creators');
       }
       return response.data.data;
     }
   };
   ```

---

## 5. Các bước triển khai Tính năng mới cho AI Agent & Developer

Khi nhận yêu cầu thêm trang/tính năng mới, Agent/Dev cần thực hiện đúng 5 bước:

- [ ] **Bước 1**: Kiểm tra/Định nghĩa Types DTO tại `src/types/`.
- [ ] **Bước 2**: Viết API Service trong `src/services/` tiêu thụ API qua `apiClient`.
- [ ] **Bước 3**: Cập nhật Zustand Store tại `src/store/` (nếu cần quản lý state toàn cục).
- [ ] **Bước 4**: Xây dựng UI Component trong `src/app/` theo chuẩn Stitch Design System (`.glass-container`, `weblogo.png`, `Sora` + `Space Grotesk`).
- [ ] **Bước 5**: Chạy `npm run build` để đảm bảo 0 lỗi TypeScript & ESLint trước khi bàn giao.
