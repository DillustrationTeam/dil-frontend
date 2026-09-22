export interface NotificationDto {
  notificationId: string;
  notificationType: string;
  notificationTitle: string;
  body: string;
  refType: string | null;
  refId: string | null;
  channel: string;
  isRead: boolean;
  readAt: string | null;
  createdAt: string;
}

export interface NotificationPage {
  items: NotificationDto[];
  unreadCount: number;
  nextCursor: string | null;
}

/**
 * Nhãn tiếng Việt cho `NotificationType` — khớp đúng enum
 * `ArtCommission.Domain.Enums.NotificationType` ở backend.
 * Backend từ chối (400) mọi giá trị không nằm trong enum này.
 */
export const notificationTypeLabels: Record<string, string> = {
  OutbidAlert: 'Có người trả giá cao hơn',
  AuctionEndingSoon: 'Phiên sắp kết thúc',
  AuctionWon: 'Thắng phiên đấu giá',
  DeadlineRiskWarning: 'Cảnh báo trễ hạn',
  PaymentSucceeded: 'Nạp tiền thành công',
  PayoutStatusChanged: 'Trạng thái rút tiền',
  UserSanctionAlert: 'Chế tài tài khoản',
  PromotionAnnouncement: 'Khuyến mãi',
};

/** Danh sách loại hợp lệ, dùng cho bộ lọc và kiểm tra dữ liệu. */
export const notificationTypes = Object.keys(notificationTypeLabels);

/**
 * Bốn tab phân loại của Notification Center (SCR-45).
 * `id` khớp enum `NotificationCategory` ở backend; lọc ngay trong DB nên phân trang
 * theo từng tab vẫn đúng (xem `GetMyNotificationsQuery`).
 */
export const notificationCategories = [
  { id: 'Finance', label: 'Tài chính' },
  { id: 'Order', label: 'Đơn hàng' },
  { id: 'System', label: 'Hệ thống' },
  { id: 'Promotion', label: 'Khuyến mãi' },
] as const;

export type NotificationCategoryId = (typeof notificationCategories)[number]['id'];
