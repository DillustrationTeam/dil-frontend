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
};

/** Danh sách loại hợp lệ, dùng cho bộ lọc và kiểm tra dữ liệu. */
export const notificationTypes = Object.keys(notificationTypeLabels);
