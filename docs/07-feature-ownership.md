# 06 - Feature Ownership & Task Assignment Matrix

> **Mục đích:** Tài liệu này xác định rõ ai chịu trách nhiệm module/feature nào trong codebase. Cập nhật file này khi có thay đổi phân công.

---

## 📦 Ma Trận Phân Công (Feature Ownership Matrix)

| Feature Folder | Module | Screens Liên Quan | Thành Viên Phụ Trách | Trạng Thái |
|:---|:---|:---|:---|:---|
| `features/auth/` | Auth & Identity | Login, Register, Forgot Password, OTP Verify | *(điền tên)* | 🟡 Cơ bản xong |
| `features/marketplace/` | Marketplace | Trang chủ, Artwork Feed, Search & Filter, Artwork Detail | *(điền tên)* | 🔴 Chưa bắt đầu |
| `features/commission/` | Commission | Đặt vẽ, Brief Review, Milestone Tracker, Workroom | *(điền tên)* | 🔴 Chưa bắt đầu |
| `features/creator-studio/` | Creator Studio | Creator Profile, Portfolio, Rate Card, Application | *(điền tên)* | 🔴 Chưa bắt đầu |
| `features/payment/` | Payment & Escrow | Checkout, QR PayOS, Wallet, Transaction History, Payout | *(điền tên)* | 🔴 Chưa bắt đầu |
| `features/chat/` | Chat Real-time | Chat trong Workroom (SignalR) | *(điền tên)* | 🔴 Chưa bắt đầu |
| `features/notification/` | Notification | Notification Center, Toast Alerts | *(điền tên)* | 🔴 Chưa bắt đầu |
| `features/admin/` | Admin Panel | Dashboard KPI, Moderation Queue, User Management, Dispute | *(điền tên)* | 🔴 Chưa bắt đầu |

**Chú giải trạng thái:**
- 🟢 Hoàn thành
- 🟡 Đang phát triển
- 🔴 Chưa bắt đầu

---

## 🏗️ Cấu Trúc Mỗi Feature Folder

```
features/<tên-feature>/
├── components/    # React components của feature này
├── hooks/         # Custom React hooks (useXxx)
├── services/      # Hàm gọi API (xxx.service.ts)
├── store/         # Zustand store nếu cần state management cục bộ
├── types/         # TypeScript interfaces/types riêng của feature
└── index.ts       # Barrel export — mọi import từ ngoài vào feature dùng file này
```

---

## 📏 Quy Tắc Feature Boundary — Chống Conflict

1. **Nguyên tắc Silo:** Code của feature `commission/` không được import trực tiếp từ `features/marketplace/`. Nếu cần chia sẻ → đưa vào `components/ui/` hoặc `types/`.

2. **Entry Point duy nhất:** File ngoài feature chỉ được import thông qua `features/<tên>/index.ts`:
   ```typescript
   // ✅ Đúng
   import { authService } from '@/features/auth';
   
   // ❌ Sai — import trực tiếp vào internal file
   import { authService } from '@/features/auth/services/auth.service';
   ```

3. **Shared UI Components:** Buttons, Modals, Input fields → dùng `components/ui/` (không nhét vào feature).

4. **API Client** (`lib/api-client.ts`) và **Shared Types** (`types/api.types.ts`) → Dùng chung, không duplicate.

---

## 🔗 API Endpoint → Feature Mapping

| Backend Endpoint Group | Feature Frontend |
|:---|:---|
| `/api/v1/auth/*` | `features/auth/` |
| `/api/v1/artworks/*`, `/api/v1/creators/*` (browse) | `features/marketplace/` |
| `/api/v1/commissions/*`, `/api/v1/milestones/*` | `features/commission/` |
| `/api/v1/creator-profile/*`, `/api/v1/commission-services/*` | `features/creator-studio/` |
| `/api/v1/payments/*`, `/api/v1/wallets/*`, `/api/v1/payout-requests/*` | `features/payment/` |
| `/api/v1/messages/*` + SignalR ChatHub | `features/chat/` |
| `/api/v1/notifications/*` | `features/notification/` |
| `/api/v1/admin/*`, `/api/v1/disputes/*` | `features/admin/` |

---

## 📅 Timeline Phát Triển (Tham khảo)

*(Cập nhật theo sprint planning của team — xem file Todo chính trong `docs/todos.md` phía Backend)*

| Giai Đoạn | Sprint | Các Feature Cần Xong |
|:---|:---|:---|
| Phase 1 | Sprint 1-2 | `auth`, giao diện `marketplace` cơ bản |
| Phase 2 | Sprint 3-4 | `commission`, `creator-studio` |
| Phase 3 | Sprint 5-6 | `payment`, `chat` |
| Phase 4 | Sprint 7-8 | `notification`, `admin`, Polish & Bug Fix |
