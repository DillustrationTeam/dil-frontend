# 04 - API Client & Security (JWT Refresh Token Rotation)

## 1. Cơ chế Tự động Chèn JWT Bearer Token
Mọi HTTP Request từ Frontend qua `apiClient` (`src/lib/api-client.ts`) đều được gán tự động Header `Authorization: Bearer <accessToken>` từ Zustand Auth Store:

```typescript
apiClient.interceptors.request.use((config) => {
  const accessToken = useAuthStore.getState().accessToken;
  if (accessToken && config.headers) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }
  return config;
});
```

---

## 2. Quy trình Xoay Token Tự động khi bị lỗi 401 Unauthorized

```
[User Request] 
      │
      v
[Backend API] ──(401 Unauthorized)──> [Axios Response Interceptor]
                                                  │
                                                  v
                                      [POST /auth/refresh-token]
                                      (Gửi RefreshToken từ Store)
                                                  │
                                      ┌───────────┴───────────┐
                                      │                       │
                                 (Thành công)             (Thất bại)
                                      │                       │
                                      v                       v
                           [Cập nhật Zustand Store]   [Xóa Session Zustand]
                           [Thực hiện lại Request]    [Chuyển về /login]
```

---

## 3. Lưu trữ Trạng thái Xác thực Bền vững (Zustand Persist)
Thông tin User và Token được lưu tại `localStorage` với key `dillustration-auth-storage`, tự động đồng bộ khi F5 hoặc mở lại trình duyệt.
