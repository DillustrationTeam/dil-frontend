# 05 - Frontend Routes & Page Specifications

## 1. Danh sách Trang & Endpoint Kết nối Backend

| Route | File TSX | Thiết kế Stitch UI | API Endpoints | Chức năng |
| :--- | :--- | :--- | :--- | :--- |
| `/login` | `src/app/(auth)/login/page.tsx` | `login_dillustration` | `POST /auth/login` | **UC-02**: Đăng nhập hệ thống, lưu JWT và Refresh Token. |
| `/register` | `src/app/(auth)/register/page.tsx` | `registration_dillustration` | `POST /auth/register` | **UC-01**: Đăng ký tài khoản mới (gán mặc định role Client). |
| `/forgot-password` | `src/app/(auth)/forgot-password/page.tsx` | `forgot_password_dillustration` | `POST /auth/forgot-password` | **UC-03**: Yêu cầu link reset mật khẩu. |
| `/` | `src/app/(main)/page.tsx` | `marketplace_home_dillustration` | `GET /auth/me`, `POST /auth/revoke-token` | **UC-05**: Trang chủ Marketplace hiển thị thông tin User & Đăng xuất. |

---

## 2. Kiểm thử Build Sản phẩm (Build Verification)
Lệnh kiểm tra tính đúng đắn của toàn bộ trang:

```bash
cd d:\SEP490_Final\Web\dil-frontend
npm run build
```

Kết quả: **`✓ Compiled successfully in 810ms (7/7 static pages)`**.
