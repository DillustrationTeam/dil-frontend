# Yêu thích và lưu tranh

`features/marketplace/components/artwork-actions.tsx` dùng chung cho trang chi tiết và popup tranh.

- ❤️ ghi trạng thái yêu thích qua API; số tim và trạng thái được đọc lại từ database.
- 🔖 mở danh sách album thật của người dùng, cho phép chọn nhiều album, tạo album riêng tư và gỡ từng bookmark.
- `/collections` hiển thị nội dung album và danh sách yêu thích riêng biệt. Gỡ bookmark không bỏ tim; bỏ tim không gỡ bookmark.

Không dùng mock hoặc thông báo thành công khi API thất bại. Nút bị khóa trong lúc tải trạng thái/gửi yêu cầu; lỗi có thông báo và có thể thử lại. Các phản hồi cũ không cập nhật trạng thái sau khi đổi tác phẩm hoặc tài khoản. Popup hỗ trợ Escape, giữ focus bàn phím bên trong và trả focus khi đóng. Tên album được kiểm tra bằng Zod (1–100 ký tự sau trim).

Dữ liệu cũ từ nút bookmark được backend bảo toàn trong album riêng tư “Tranh đã lưu trước đây”. Chi tiết API, migration và kiểm tra SQL/HTTP nằm tại `../../dil-backend/docs/09-artwork-interactions.md`.

Đã kiểm tra build, ESLint các file thay đổi, tải lại trình duyệt, tạo album, xem nội dung album và tính độc lập của hai nút.
