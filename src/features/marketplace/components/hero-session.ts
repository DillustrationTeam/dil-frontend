/** Cờ sống trong bộ nhớ JS: tồn tại qua điều hướng client nhưng mất khi reload.
 *
 *  Đúng yêu cầu: vào trang chủ lần đầu (hoặc reload tại `/`) thì hero mở full màn;
 *  rời trang rồi quay lại bằng điều hướng nội bộ thì hero vào thẳng dạng card.
 *
 *  `mode` giữ quyết định của chu kỳ mount hiện tại (`expanded` | `locked`) để lần
 *  mount thứ hai do React StrictMode chạy ở dev dùng lại, không tự quyết lại —
 *  nếu không: lần đầu vào trang bị bỏ full màn, còn lần quay lại lại bung full màn.
 *
 *  `mountedAt` là mốc `performance.now()` của lần mount gần nhất, dùng để nhận ra
 *  cặp mount → cleanup → mount chạy trong cùng một frame.
 */
export const heroSession: {
  entered: boolean;
  mountedAt: number;
  mode: 'expanded' | 'locked' | null;
} = {
  entered: false,
  mountedAt: 0,
  mode: null,
};

/** Khoảng thời gian (ms) dưới ngưỡng này coi là StrictMode mount lại, không phải điều hướng thật. */
export const HERO_STRICT_MODE_WINDOW_MS = 500;

/**
 * Quyết định trạng thái hero cho lần mount hiện tại.
 *
 * - Mount đầu tiên của phiên (vừa reload vào `/`): `expanded` -> hero full màn.
 * - Mount lại sau khi rời trang rồi quay về: `locked` -> vào thẳng card.
 * - StrictMode (dev) mount hai lần liền trong cùng một frame: lần thứ hai trả lại
 *   đúng quyết định của lần đầu.
 *
 * @param now mốc thời gian hiện tại (`performance.now()`).
 */
export function decideHeroMode(now: number): 'expanded' | 'locked' {
  const isRemount = now - heroSession.mountedAt < HERO_STRICT_MODE_WINDOW_MS;
  if (!isRemount) {
    heroSession.mode = heroSession.entered ? 'locked' : 'expanded';
    heroSession.entered = true;
  }
  heroSession.mountedAt = now;
  return heroSession.mode ?? 'expanded';
}
