# 02 - Digital Etherealism Design System

## 1. Triết lý Thiết kế: Digital Etherealism
Hệ thống thiết kế của **dillustration** kết hợp giữa nét hiện đại, tối giản và không gian huyền ảo của nghệ thuật kỹ thuật số:
- **Tông nền đêm sâu (Deep Navy & Dark Atmosphere)**: Tăng độ nổi bật cho tác phẩm nghệ thuật.
- **Lớp thủy tinh mờ nhám (Glassmorphism)**: Thẻ containers phủ lớp mờ `backdrop-filter: blur(24px)` với đường viền mạ kim loại `border-top: 1px solid rgba(255,255,255,0.15)`.
- **Ánh sáng tỏa dịu (Periwinkle Glow)**: Hiệu ứng tỏa sáng mềm `#A7ACD9` thay cho hiệu ứng đổ bóng đen truyền thống.

---

## 2. Bảng Màu Chuẩn (Color Palette Tokens)

```css
:root {
  --brand-navy: #1F2335;       /* Tông nền chính của toàn bộ hệ thống */
  --brand-periwinkle: #A7ACD9; /* Tông màu đại diện cho ánh sáng Ethereal */
  --background: #131316;       /* Tông tối sâu của thẻ chứa bài viết */
  --on-surface: #E4E1E5;        /* Màu chữ chính có độ tương phản cao */
  --on-surface-variant: #C7C5CF;/* Màu chữ phụ cho mô tả và nhãn */
  --outline: #919099;           /* Màu đường viền khung */
}
```

---

## 3. Font Chữ (Typography Tokens)

| Loại Font | Font Family | Vai trò |
| :--- | :--- | :--- |
| **Headings (H1 - H3)** | `Sora`, sans-serif | Tiêu đề hình học sắc nét, mang hơi hướng tương lai. |
| **Body & Labels** | `Space Grotesk`, sans-serif | Văn bản nội dung và nhãn nhãn có tỉ lệ chữ chuẩn mực. |
| **Icons** | `Material Symbols Outlined` | Biểu tượng mỏng nhẹ nét 300 tương thích hệ thiết kế. |

---

## 4. Hiệu ứng Micro-interactions
- **Custom Cursor Glow (`#cursor-glow`)**: Vùng sáng theo sau con trỏ chuột người dùng trên màn hình Desktop.
- **Floating Showcase (`animate-float`)**: Khung tranh anh hùng chuyển động nổi bồng bềnh 6s lặp vô tận.
- **Rim Light Effect**: Dải sáng kim loại mảnh ở viền trên các thẻ Glass Container.
