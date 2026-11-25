/** Cờ sống trong bộ nhớ JS: tồn tại qua điều hướng client nhưng mất khi reload.
 *
 *  Đúng yêu cầu: vào trang chủ lần đầu (hoặc reload tại `/`) thì hero mở full màn;
 *  rời trang rồi quay lại bằng điều hướng nội bộ thì hero vào thẳng dạng card.
 */
export const heroSession = { entered: false };
