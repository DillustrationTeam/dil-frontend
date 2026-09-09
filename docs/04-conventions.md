# 03 - Frontend Conventions & Coding Standards

## 1. Quy chuẩn Đặt tên (Naming Conventions)
- **Files & Components**: Sử dụng `kebab-case` cho tên file (ví dụ: `api-client.ts`, `use-auth-store.ts`, `auth.service.ts`).
- **React TSX Components**: Sử dụng `PascalCase` cho tên hàm Component (`LoginPage`, `RegisterPage`, `MarketplaceHomePage`).
- **Interfaces & Types**: Định nghĩa chuẩn đuôi DTO/Request (`LoginRequest`, `AuthResponseDto`, `UserDto`).

---

## 2. Quy chuẩn Xử lý Form & Validation (React Hook Form + Zod)
Mọi Form nhập liệu đều sử dụng Zod Schema để validate phía Client trước khi gửi request:

```typescript
const registerSchema = z.object({
  fullName: z.string().min(2, 'Full name must be at least 2 characters'),
  email: z.string().min(1, 'Email address is required').email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  terms: z.literal(true, {
    errorMap: () => ({ message: 'You must accept the community guidelines' }),
  }),
});
```

---

## 3. Quy chuẩn Tiêu thụ API Response Envelope
Frontend giải nén đúng cấu trúc Envelope do Backend gửi về (`{ data, meta, error }`):

```typescript
export interface ApiResponse<T = any> {
  data: T | null;
  meta: Record<string, any> | null;
  error: {
    title?: string;
    details?: string[];
  } | null;
}
```
