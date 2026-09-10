# 🤝 Hướng Dẫn Đóng Góp — dil-frontend (dillustration Frontend)

> Đọc file này trước khi bắt đầu code lần đầu. Sau đó đọc thêm theo thứ tự trong [`AGENTS.md`](AGENTS.md) và toàn bộ `docs/`.

---

## 🚀 Setup Môi Trường Phát Triển

### Yêu Cầu
| Công cụ | Phiên bản | Link |
|:---|:---|:---|
| Node.js | 20 LTS+ | [nodejs.org](https://nodejs.org) |
| npm | 10+ | đi kèm Node.js |
| VS Code | Bất kỳ | + Extensions: ESLint, Prettier, Tailwind CSS IntelliSense |
| Git | 2.40+ | [git-scm.com](https://git-scm.com) |

### Các Bước Setup Lần Đầu

```bash
# 1. Clone repo
git clone https://github.com/<org>/dil-frontend.git
cd dil-frontend

# 2. Tạo file .env từ mẫu (CHỈ LÀM LẦN ĐẦU)
copy .env.example .env.local
# → Mở .env.local và điều chỉnh NEXT_PUBLIC_API_URL nếu Backend chạy khác port

# 3. Cài đặt dependencies
npm install

# 4. Chạy dev server (port mặc định: http://localhost:3000)
npm run dev

# 5. Mở trình duyệt: http://localhost:3000
```

> ⚠️ **Quan trọng:** Backend (`dil-backend`) phải đang chạy trước thì Frontend mới kết nối được API.

---

## 📁 Cấu Trúc Thư Mục

```
src/
├── app/                    # Next.js App Router — CHỈ chứa page.tsx, layout.tsx
│   ├── (auth)/             # Các trang Auth (login, register, ...)
│   └── (main)/             # Các trang chính (marketplace, commission, ...)
├── components/             
│   ├── ui/                 # Button, Input, Modal, Card... — Shared UI
│   └── workroom/           # Workroom specific components
├── features/               # ⭐ FEATURE-BASED CODE — Phân chia theo chức năng
│   ├── auth/               # Auth: login, register, token management
│   ├── marketplace/        # Marketplace: artwork listing, search, filter
│   ├── commission/         # Commission: create, track, manage orders
│   ├── creator-studio/     # Creator: profile, portfolio, rate card
│   ├── payment/            # Payment: escrow, checkout, wallet
│   ├── chat/               # Chat: real-time messaging (SignalR)
│   ├── notification/       # Notification: alerts, notification center
│   └── admin/              # Admin: dashboard, moderation, dispute
├── lib/                    # Shared utilities (api-client.ts, ...)
├── types/                  # Shared TypeScript types (api.types.ts)
└── store/                  # (Legacy) — Đang migrate sang features/*/store/
```

### Quy tắc Feature Boundary (QUAN TRỌNG)

1. **Code của feature nào nằm trong folder feature đó** — không import chéo giữa features
2. **Shared code** → đặt trong `components/ui/` hoặc `lib/` hoặc `types/`
3. **Mỗi feature có `index.ts`** — export tất cả ra ngoài, không import file internal trực tiếp từ ngoài feature

---

## 📦 Feature Ownership — Ai làm gì

| Feature Folder | Module | Phụ trách |
|:---|:---|:---|
| `features/auth/` | Đăng nhập, đăng ký, JWT refresh | *(điền tên)* |
| `features/marketplace/` | Trang chủ, feed artwork, search | *(điền tên)* |
| `features/commission/` | Đặt vẽ, quản lý đơn hàng | *(điền tên)* |
| `features/creator-studio/` | Hồ sơ họa sĩ, portfolio, rate card | *(điền tên)* |
| `features/payment/` | Thanh toán, escrow, ví | *(điền tên)* |
| `features/chat/` | Chat real-time SignalR | *(điền tên)* |
| `features/notification/` | Thông báo hệ thống | *(điền tên)* |
| `features/admin/` | Admin dashboard, kiểm duyệt | *(điền tên)* |

> 🎯 **Nguyên tắc:** Mỗi người phụ trách feature folder riêng → không lo conflict Git khi cùng làm việc.

---

## 🌿 Quy Tắc Git

### Đặt Tên Branch
```
feature/<dev-id>-<feature>-<mo-ta-ngan>   → feature/nam-marketplace-artwork-grid
fix/<dev-id>-<feature>-<mo-ta-ngan>       → fix/nam-auth-redirect-after-login
chore/<dev-id>-<mo-ta-ngan>               → chore/nam-update-contributing-docs
```

### Commit Message (Conventional Commits)
```
feat(marketplace): add artwork card component with hover effect
fix(auth): redirect to login when token expired
style(commission): fix responsive layout on mobile
docs(api): update auth service JSDoc comments
chore: upgrade next.js to 16.3.1
```

---

## 🔄 Quy Trình PR

1. `git checkout main && git pull origin main`
2. `git checkout -b feature/<dev-id>-<feature>-<mo-ta>`
3. Code → commit thường xuyên
4. Trước khi push: `npm run build` + `npm run lint` phải pass
5. Tạo PR → điền PR Template → assign reviewer
6. Cần **1 thành viên approve** trước khi merge
7. **Không self-merge**

---

## 🎨 Design System

Mọi UI đều tuân theo **Digital Etherealism** design system:
- **Màu nền chính:** `#1F2335` (Brand Navy)
- **Màu accent:** `#A7ACD9` (Brand Periwinkle)  
- **Card surface:** `#131316`
- **Font heading:** `Sora` (Google Fonts)
- **Font body:** `Space Grotesk` (Google Fonts)
- **Hiệu ứng card:** Glassmorphism `.glass-container` (backdrop-blur + border-white/15)

Chi tiết đầy đủ xem: [`docs/02-design-system.md`](docs/02-design-system.md)

---

## ❓ Cần Giúp Đỡ?

- Đọc `docs/00-agent-developer-guide.md` (full guide đầy đủ nhất)
- Hỏi trong kênh Discord/Zalo của team
- Tạo Issue GitHub để thảo luận
