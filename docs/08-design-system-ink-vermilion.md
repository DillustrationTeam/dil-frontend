# Design System — INK & VERMILION

Nguồn gốc: `Docs/UI-UX/dillustration-redesign.html` (bản redesign 6 màn hình + 60 route).
Tài liệu này ghi lại **cách hệ đó đã được đưa vào Next.js app**, để lần sau không ai
dựng lại một hệ màu thứ hai.

## 1. Ba file quyết định giao diện

| File | Vai trò |
|:--|:--|
| `src/styles/gallery.css` | Toàn bộ token + component + motion. Port từ bản redesign, bỏ GSAP/Lenis. |
| `src/app/globals.css` | `@import "tailwindcss"` → `@import "../styles/gallery.css"`; map tên token cũ sang palette giấy; `@theme` cho Tailwind v4. |
| `src/app/layout.tsx` | Fraunces (`--font-heading`) + Inter (`--font-body-grotesk`), cả hai có subset `vietnamese`. |

## 2. Palette

```
paper      #F7F2E9   --ink       nền giấy
sheet      #FFFCF6   --ink-2     thẻ, panel, input
tint       #F0E7D8   --ink-3     hover, well, chip
edge       #E5D8C2   --ink-4     viền dày, vùng chìm
ink        #241F1A   --ivory     chữ chính
ash        #6E6459   --ash       chữ phụ
ash-dim    #746A5F   --ash-dim   nhãn, meta
lumen      #B24A26               accent duy nhất (nút, link, "live")
lumen-hi   #8C3718               hover / chữ accent trên giấy
cinnabar   #A8321C               lỗi, khiếu nại, phiên đang chạy
gold       #8A6A1F               sắp diễn ra, cảnh báo mềm
petrol     #2F6B63               hoàn tất, đã duyệt
hair       rgba(34,30,26,.11)    đường kẻ 1px
```

Luật: **không hex trong component**. Mọi thứ lấy từ `--lumen`, `--ink-2`, `--hair`…
Tailwind được dùng qua `bg-[#B24A26]/10` chỉ khi cần alpha (giá trị vẫn là hex của palette).

## 3. Chữ

| Vai trò | Face | Vì sao |
|:--|:--|:--|
| Display | **Fraunces** (variable, `opsz`) | Serif high-contrast, ở cỡ lớn nét mảnh như letterpress. |
| UI | **Inter** | Grotesque trung tính, số tabular, đọc tốt 14–16px. |
| Số | Inter + `tabular-nums` | Giá và đồng hồ đếm ngược không nhảy khi đổi số. |

Cả hai đều có subset `vietnamese` — bắt buộc, nếu không chữ có dấu sẽ fallback từng ký tự
và lệch nét (đúng lỗi Sora trước đây).

## 4. Component có sẵn (đừng viết lại)

`.btn` (`--primary/--outline/--ghost/--danger/--sm/--block`), `.badge` (`--live/--soon/--ok/--done/--info`),
`.chip`, `.tabs`/`.tab`, `.fpill`, `.input`+`.input-wrap`+`.field`, `.check`, `.pane`, `.panel`,
`.metric`/`.metrics`, `.statsline`, `.rows`, `.kv`, `.wcard` (workroom), `.acard` (auction),
`.art-card`, `.empty`, `.skeleton`, `.dlg`, `.drawer__*`, `.dock`, `.side`, `.tip`, `.loadmore`.

Class cũ vẫn sống: `.glass-container`, `.glass-panel`, `.commission-primary`, `.periwinkle-glow`
đã được map sang giấy nên màn hình chưa restyle vẫn đúng hệ.

## 5. Motion — `src/components/motion/`

| Export | Dùng cho |
|:--|:--|
| `Reveal` | IntersectionObserver thêm `.is-in`; `delay` để xếp lớp, `blur` cho nhịp kéo nét. |
| `CountUp` | Đếm số thật bằng rAF, dừng khi `prefers-reduced-motion`. |
| `Words` | Tách tiêu đề thành từng từ (`.words span > i` nổi lên). |
| `Magnetic` | CTA hút con trỏ, chỉ `hover:hover` + `pointer:fine`. |
| `ScrollProgress` | Sợi chỉ tiến trình ở đỉnh viewport (đã gắn trong `layout.tsx`). |
| `useScrolled` | Đổi `.is-stuck` cho header. |

CSS-only: `.stagger`, `.frame-draw`, `.beam` (chỉ phiên live), `.skeleton` shimmer, `.words`.
Tất cả nằm trong một khối `@media (prefers-reduced-motion: reduce)` duy nhất — bật giảm
chuyển động là mọi thứ đứng yên, không cần sửa từng component.

## 6. Nếu phải thêm màn hình mới

1. Bọc nội dung trong `.wrap` + `.page`; tiêu đề dùng `.page-head` + `.eyebrow` (italic serif).
2. Panel dùng `.pane`; số liệu dùng `.statsline` hoặc `.metric`; danh sách dùng `.rows` hoặc thẻ
   chuyên dụng (`.acard`, `.wcard`).
3. Trạng thái dùng `.badge--*`, không tự pha màu mới.
4. Hiệu ứng: `Reveal` cho khối, `CountUp` cho số, không thêm thư viện animation.
