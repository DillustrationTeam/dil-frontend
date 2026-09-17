# 🏛 ĐẶC TẢ HỆ THỐNG TOÀN CẢNH DILLUSTRATION
> **Dự án:** Sàn giao dịch & Triển lãm Nghệ thuật Kỹ thuật số dillustration (Art Commission Marketplace)  
> **Phiên bản:** v1.0 (Cập nhật CSDL 24 bảng `Dillustration_Database_v01.sql`)  
> **Kiến trúc:** Monolith Clean Architecture (.NET 8 ASP.NET Core) + Next.js 14 App Router  

---

## 1. TỔNG QUAN DỰ ÁN & TẦM NHÌN (PROJECT OVERVIEW)

**dillustration** là nền tảng Đặt vẽ Tranh Kỹ thuật số (Digital Art Commission Marketplace) & Triển lãm Nghệ thuật Etherealism phục vụ 3 nhóm đối tượng:
- **Clients (Khách hàng / Nhà sưu tầm):** Tìm kiếm họa sĩ, đặt vẽ tranh theo yêu cầu, thanh toán giữ tiền an toàn (Escrow) theo từng giai đoạn (Milestones).
- **Creators (Họa sĩ / Artist):** Đăng tải Portfolio tác phẩm, niêm yết bảng giá vẽ (RateCard), nhận đơn hàng và rút tiền về ngân hàng.
- **Moderators / Administrators (Quản trị viên):** Phân xử tranh chấp (Dispute), kiểm duyệt tác phẩm AI, quản lý hệ thống.

---

## 2. PHÂN HỆ VAI TRÒ & PHÂN QUYỀN ĐA VAI TRÒ (DUAL-ROLE ARCHITECTURE)

Hệ thống áp dụng cơ chế phân quyền linh hoạt (Dual-Role Permission Model):

```
                       [Người dùng Đăng ký]
                                │
                                v
               [Được gán mặc định Role "Client"]
               (Sở hữu 1 dòng tại bảng Users)
                                │
                                v
              [Kích hoạt tạo CreatorProfile]
                                │
               ┌────────────────┴────────────────┐
               │                                 │
   [Tạo 1 dòng CreatorProfile]     [Bổ sung Role "Creator"]
               │                                 │
               └────────────────┬────────────────┘
                                │
                                v
             [User sở hữu ĐỒNG THỜI 2 VAI TRÒ]
                 roles = ["Client", "Creator"]
```

1. **Khởi tạo:** Mọi người dùng đăng ký qua API `POST /api/v1/auth/register` đều nhận mặc định vai trò `"Client"`.
2. **Kích hoạt Creator:** Khi người dùng thiết lập `CreatorProfile`, hệ thống gọi API bổ sung vai trò `"Creator"` vào bảng `UserRoles`.
3. **Nguyên tắc:** Người dùng không bị tước bỏ vai trò `"Client"`. Trạng thái role trong JWT Token là mảng chứa cả hai vai trò: `["Client", "Creator"]`.

---

## 3. ĐẶC TẢ CƠ SỞ DỮ LIỆU (24 BẢNG - `Dillustration_Database_v01.sql`)

CSDL được thiết kế theo chuẩn SQL Server DDL với tính an toàn cao (Idempotent `IF NOT EXISTS`, Ràng buộc `UNIQUE` 1-1, và 14 Non-Clustered Indexes):

```
+-----------------------------------------------------------------------------------+
|                        DILLUSTRATION DATABASE SCHEMA (24 TABLES)                  |
+-----------------------------------------------------------------------------------+
| 1. AUTH & IDENTITY (8 Bảng):                                                      |
|    Users, Roles, UserRoles, UserClaims, RoleClaims, UserLogins, UserTokens,       |
|    RefreshTokens (JWT Rotation với Soft Delete UpdateAt/IsDeleted)                |
+-----------------------------------------------------------------------------------+
| 2. PORTFOLIO & SEARCH (5 Bảng):                                                   |
|    CreatorProfile (UNIQUE UserId), Artwork, Tag, ArtworkTag, Follow               |
+-----------------------------------------------------------------------------------+
| 3. COMMISSION & SERVICES (3 Bảng):                                               |
|    CommissionService, Commission, Milestone                                       |
+-----------------------------------------------------------------------------------+
| 4. PAYMENT, ESCROW & WALLET (5 Bảng):                                             |
|    Wallet (UNIQUE UserId), Payment, Transaction, EscrowTransaction, PayoutRequest |
+-----------------------------------------------------------------------------------+
| 5. CHAT, NOTIFICATION, REVIEWS & DISPUTES (4 Bảng):                               |
|    Message, Notification, Review (UNIQUE CommissionId), Dispute                   |
+-----------------------------------------------------------------------------------+
| 6. AUDIT TRAIL (1 Bảng):                                                          |
|    AuditLog                                                                       |
+-----------------------------------------------------------------------------------+
```

### Danh chi tiết 24 Bảng Dữ liệu:

1. **`Users`**: Lưu trữ tài khoản chuẩn AspNetUsers (`Id`, `UserName`, `Email`, `PasswordHash`, `FullName`, `IsVerified`, `CreatedAt`, `UpdatedAt`, `IsDeleted`).
2. **`Roles`**: Lưu trữ vai trò (`Administrator`, `Moderator`, `Creator`, `Client`).
3. **`UserRoles`**: Bảng trung gian n-n nối `UserId` và `RoleId`.
4. **`UserClaims`**: Lưu claims theo người dùng.
5. **`RoleClaims`**: Lưu claims theo vai trò.
6. **`UserLogins`**: Lưu thông tin đăng nhập Google/Facebook OAuth.
7. **`UserTokens`**: Lưu mã xác thực OTP / 2FA.
8. **`RefreshTokens`**: Lưu mã xoay JWT Refresh Token (`TokenHash`, `ExpiresAt`, `RevokedAt`, `ReplacedByTokenHash`, `CreatedAt`, `UpdatedAt`, `IsDeleted`).
9. **`CreatorProfile`**: Hồ sơ Họa sĩ (`UserId` UNIQUE, `DisplayName`, `Bio`, `RateCard` JSON, `CommissionSlots`, `RatingAvg`, `IsAiVerified`).
10. **`Artwork`**: Tác phẩm nghệ thuật (`CreatorId`, `Title`, `Description`, `ImageUrl`, `Style`, `Status`).
11. **`Tag`**: Thẻ phân loại tác phẩm (`Name` UNIQUE, `IsAiGenerated`).
12. **`ArtworkTag`**: Bảng trung gian n-n nối `ArtworkId` và `TagId`.
13. **`Follow`**: Mối quan hệ theo dõi giữa `FollowerId` và `FollowingId`.
14. **`CommissionService`**: Gói dịch vụ nhận vẽ (`CreatorId`, `Name`, `Category`, `Description`, `Price`, `Status`).
15. **`Commission`**: Đơn hàng đặt vẽ (`Title`, `Description`, `ClientId`, `CreatorId`, `ServiceId`, `TotalPrice`, `EscrowStatus`, `CurrentStage`, `Status`).
16. **`Milestone`**: Các giai đoạn thực hiện đơn vẽ (`CommissionId`, `Sequence`, `Title`, `Price`, `Status`, `WipPreviewUrl`, `SourceFilePath`, `RevisionLimit`, `RevisionCount`).
17. **`Wallet`**: Ví tiền người dùng (`UserId` UNIQUE, `Balance`, `UpdatedAt`).
18. **`Payment`**: Giao dịch thanh toán đơn vẽ (`CommissionId`, `Amount`, `EscrowStatus`, `TransactionRef`, `PaidAt`, `WalletId`, `PaymentMethod`).
19. **`Transaction`**: Biến động số dư ví (`WalletId`, `CommissionId`, `Type`, `Amount`, `Ref`).
20. **`EscrowTransaction`**: Giao dịch tạm giữ/giải ngân tiền ký quỹ (`CommissionId`, `MilestoneId`, `WalletId`, `Amount`, `Type`, `Status`, `AutoRelease`).
21. **`PayoutRequest`**: Yêu cầu rút tiền về ngân hàng (`WalletId`, `Amount`, `Status`, `BankInfo`, `RequestedAt`, `ProcessedAt`).
22. **`Message`**: Tin nhắn trao đổi trong đơn vẽ (`CommissionId`, `SenderId`, `Body`, `SentAt`, `IsRead`).
23. **`Notification`**: Thông báo hệ thống (`UserId`, `Type`, `Message`, `IsRead`).
24. **`Review`**: Đánh giá đơn vẽ (`CommissionId` UNIQUE, `ReviewerId`, `Rating`, `Comment`).
25. **`Dispute`**: Tranh chấp đơn vẽ (`CommissionId`, `RaisedBy`, `Reason`, `Status`, `RefundRate`, `AdminNote`, `ResolvedAt`).
26. **`AuditLog`**: Nhật ký thao tác hệ thống (`UserId`, `EntityType`, `EntityId`, `Action`, `Changes`).

---

## 4. KIẾN TRÚC VÀ HỆ THỐNG GIAO DIỆN FRONTEND (NEXT.JS 14)

### Triết lý Thiết kế: Digital Etherealism
- **Bảng màu:** Tông nền Brand Navy `#1F2335`, ánh sáng dịu Brand Periwinkle `#A7ACD9`, bề mặt thẻ `#131316`.
- **Hệ văn bản:** Font tiêu đề `Sora`, font nội dung `Space Grotesk`, biểu tượng `Material Symbols Outlined`.
- **Thẻ thủy tinh (Glassmorphism):** Sử dụng class `.glass-container` với hiệu ứng phủ mờ `backdrop-filter: blur(24px)` và đường viền mảnh `border-t border-white/15`.
- **Logo chính thức:** Hình ảnh thương hiệu `/weblogo.png` đã được làm sạch nền trong suốt, tỏa sáng trên nền tối.

### Cấu trúc Trang & Luồng Xác thực:
- `/login`: Đăng nhập hệ thống, gọi `POST /api/v1/auth/login`, lưu `accessToken` & `refreshToken` vào Zustand Auth Store (`localStorage`).
- `/register`: Đăng ký tài khoản Client mặc định, gọi `POST /api/v1/auth/register`, tự động chuyển hướng đăng nhập.
- `/forgot-password`: Yêu cầu khôi phục mật khẩu.
- `/`: Trang chủ Marketplace hiển thị Asymmetric Hero, Floating Showcase, Bento Grid highlights, con trỏ chuột tỏa sáng (`#cursor-glow`), và Session Header hiển thị thông tin User & Dual-Roles.

---

## 5. CƠ CHẾ KẾT NỐI API & BẢO MẬT (API INTEGRATION & SECURITY)

### 1. Chuẩn Envelope Response:
Mọi API do Backend xuất ra đều tuân theo chuẩn Envelope:
```json
{
  "data": { ... },
  "meta": null,
  "error": null
}
```

### 2. Tự động xoay Refresh Token (Axios Interceptor):
```
[Frontend Client] ──(HTTP Request + Bearer Token)──> [Backend API]
                                                            │
                                                     (401 Unauthorized)
                                                            │
[Gửi Request gốc trở lại] <──(Lưu JWT mới)── [Gọi POST /auth/refresh-token]
```

---

## 6. DANH SÁCH FILE VÀ TRẠNG THÁI HIỆN TẠI DỰ ÁN

| Thành phần | Đường dẫn | Trạng thái |
| :--- | :--- | :--- |
| **Backend Solution** | `dil-backend/ArtCommission.sln` | Build Succeeded (0 Errors, 0 Warnings) |
| **Backend Database Script** | `dil-backend/scripts/Dillustration_Database_v01.sql` | Executed & Verified (26 Tables) |
| **Backend ERD Diagram** | `dil-backend/docs/Dillustration_ERD.drawio` | Aligned 100% |
| **Frontend App Router** | `dil-frontend/src/app/` | Build Succeeded (`npm run build` 7/7 Static Pages) |
| **Frontend Master Guide** | `dil-frontend/docs/00-agent-developer-guide.md` | Active |
| **AI Agent Guidelines** | `dil-frontend/AGENTS.md` | Active |
