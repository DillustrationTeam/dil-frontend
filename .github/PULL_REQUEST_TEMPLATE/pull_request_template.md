## 📋 Mô tả thay đổi

<!-- Mô tả ngắn gọn những gì PR này thực hiện -->

## 🔗 Liên quan đến Issue / Task

<!-- VD: Closes #42 -->

## 🎨 Feature bị ảnh hưởng

<!-- Đánh dấu [x] các feature liên quan -->
- [ ] Auth (`features/auth/`)
- [ ] Marketplace (`features/marketplace/`)
- [ ] Commission (`features/commission/`)
- [ ] Creator Studio (`features/creator-studio/`)
- [ ] Payment (`features/payment/`)
- [ ] Chat (`features/chat/`)
- [ ] Notification (`features/notification/`)
- [ ] Admin (`features/admin/`)
- [ ] Shared UI Components (`components/`)
- [ ] API Client / Lib (`lib/`)

## ✅ Checklist trước khi tạo PR

- [ ] `npm run build` **thành công — 0 errors**
- [ ] `npm run lint` **pass — 0 errors**
- [ ] Đã test trên trình duyệt (UI hiển thị đúng, responsive mobile)
- [ ] **Không** commit `node_modules/`, `.next/`, `.env.local`
- [ ] Import paths dùng `@/features/<feature>/...` theo đúng feature boundary
- [ ] Không có `console.log` thừa trong code

## 🖥️ Screenshots / Demo

<!-- Dán screenshot UI hoặc screen recording để reviewer dễ review hơn -->

| Before | After |
|:---:|:---:|
| | |

## 🧪 Cách test

<!-- Mô tả các bước test: mở trang nào, thao tác gì, expect kết quả gì -->

1. Mở `http://localhost:3000/...`
2. Thực hiện: ...
3. Kết quả mong đợi: ...

## 📝 Ghi chú cho Reviewer

<!-- Quyết định design / logic đặc biệt cần lưu ý -->
