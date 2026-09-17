# 01 - Frontend Architecture & Folder Structure

## 1. Cấu trúc Thư mục Dự án (`src/`)

Dự án áp dụng cấu trúc thư mục tiêu chuẩn của Next.js 14 App Router:

```
dil-frontend/
├── docs/                             # Tài liệu kỹ thuật Frontend
├── public/                           # Tài nguyên tĩnh (Images, Favicons)
├── src/
│   ├── app/                          # App Router Pages & Layouts
│   │   ├── (auth)/                   # Route Group xác thực
│   │   │   ├── login/page.tsx        # UC-02: Đăng nhập
│   │   │   ├── register/page.tsx     # UC-01: Đăng ký
│   │   │   └── forgot-password/page.tsx # UC-03: Quên mật khẩu
│   │   ├── (main)/                   # Route Group chính
│   │   │   └── page.tsx              # UC-05: Marketplace Home Page
│   │   ├── globals.css               # CSS Độc quyền Digital Etherealism & Google Fonts
│   │   └── layout.tsx                # Root Layout với Toaster & Global Fonts
│   ├── lib/
│   │   └── api-client.ts             # Axios Instance & Interceptors (JWT + Refresh)
│   ├── services/
│   │   └── auth.service.ts           # Service gọi API Auth Controller
│   ├── store/
│   │   └── use-auth-store.ts         # Zustand Persist Store quản lý Session
│   └── types/
│       ├── api.types.ts              # API Response Envelope ({ data, meta, error })
│       └── auth.types.ts             # TypeScript Interfaces cho Auth DTOs
├── .env.local                        # Cấu hình biến môi trường NEXT_PUBLIC_API_URL
├── next.config.ts                    # Cấu hình Next.js
├── tailwind.config.ts                # Tailwind CSS Configuration
└── tsconfig.json                     # TypeScript Configuration
```

---

## 2. Mô hình Đa vai trò (Dual-Role User Architecture)

Mọi tài khoản trên hệ thống **dillustration** tuân theo nguyên tắc phân quyền linh hoạt:

1. **Mặc định là Client (`UserRoleNames.Client`)**: Mọi người dùng khi đăng ký tài khoản đều nhận vai trò Client để khám phá và đặt mua tranh.
2. **Kích hoạt vai trò Creator (`UserRoleNames.Creator`)**: Khi người dùng đăng ký hoặc tạo `CreatorProfile`, hệ thống tự động bổ sung thêm vai trò `Creator` vào tài khoản mà không xóa bỏ vai trò `Client`.
3. Trạng thái Role của User trong JWT Token và Zustand Store là mảng: `["Client", "Creator"]`.
