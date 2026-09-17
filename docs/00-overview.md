# 00 - Frontend Project Overview: dillustration

## 1. Giới thiệu Dự án
**dillustration** là nền tảng Đặt vẽ Tranh Kỹ thuật số (Digital Art Commission Marketplace) & Triển lãm Nghệ thuật Etherealism dành cho các Họa sĩ (Creators), Nhà sưu tầm (Collectors) và Khách hàng (Clients).

Ứng dụng Frontend được xây dựng theo triết lý **Digital Etherealism**, mang đến trải nghiệm thẩm mỹ cao cấp, mượt mà với hiệu ứng mờ nhám Glassmorphism, chuyển động mượt và tông màu tối bí ẩn (`#1F2335`, `#A7ACD9`).

---

## 2. Công nghệ Sử dụng (Tech Stack)

| Thành phần | Công nghệ / Thư viện | Mục đích |
| :--- | :--- | :--- |
| **Core Framework** | Next.js 14 (App Router) | Framework React hiện đại hỗ trợ Server Components, File-system Routing và SEO tối ưu. |
| **Language** | TypeScript (v5+) | Đảm bảo Type Safety tuyệt đối giữa Frontend và Backend DTOs. |
| **Styling & CSS** | Tailwind CSS v4 | Utility-first CSS framework kết hợp CSS Variables cho hệ màu Digital Etherealism. |
| **UI Design System** | Stitch UI Suite | Bộ giao diện mạ viền kim loại, Glassmorphic containers và hiệu ứng ánh sáng. |
| **State Management** | Zustand (with Persist) | Quản lý trạng thái đăng nhập, User Profile, Roles và JWT Tokens bền vững. |
| **Form & Validation** | React Hook Form + Zod | Xử lý Form và xác thực dữ liệu đầu vào phía Client theo chuẩn Schema. |
| **HTTP Client** | Axios Client | Tự động chèn Bearer Token và tự động xoay Refresh Token khi gặp lỗi 401. |
| **Notifications** | React Hot Toast | Thẻ thông báo Toast chuyển động mượt mà không làm vỡ bố cục. |

---

## 3. Kiến trúc Hệ thống Frontend & Backend

```
+-------------------------------------------------------------------+
|                  Client Browser (Next.js 14)                     |
|                                                                   |
|  +------------------+   +-------------------+   +--------------+  |
|  |  (auth) Pages    |   |   (main) Pages    |   | Zustand Store|  |
|  | /login, /register|   | / Marketplace Home|   | (Auth state) |  |
|  +--------+---------+   +---------+---------+   +------+-------+  |
|           |                       |                    |          |
|           +-----------------------+--------------------+          |
|                                   |                               |
|                      Axios API Client Interceptor                 |
|                      - Bearer JWT Auto Injection                  |
|                      - 401 Refresh Token Rotation                 |
+-----------------------------------|-------------------------------+
                                    | HTTP / HTTPS (REST API)
                                    v
+-------------------------------------------------------------------+
|               ASP.NET Core 8 Monolith Clean API                   |
|               Base URL: http://localhost:5075/api/v1              |
+-------------------------------------------------------------------+
```
