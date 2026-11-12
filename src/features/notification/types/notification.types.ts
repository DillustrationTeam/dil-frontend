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

export interface EventInvitationDto {
  id: string;
  eventId: string;
  eventTitle: string | null;
  eventBannerUrl: string | null;
  sentFromAdminId: string;
  sentFromAdminName: string | null;
  sentToCreatorId: string;
  sentToCreatorName: string | null;
  sentToCreatorEmail: string | null;
  sentToCreatorAvatarUrl: string | null;
  isHeadJury: boolean;
  status: 'Pending' | 'Accepted' | 'Declined' | 'Canceled' | 'Expired' | string;
  createdAt: string;
  respondedAt: string | null;
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
  CommissionStatusChanged: 'Trạng thái đặt vẽ',
  EscrowStatusChanged: 'Trạng thái ký quỹ',
  DisputeStatusChanged: 'Trạng thái tranh chấp',
  CreatorApplicationStatusChanged: 'Đơn đăng ký Creator',
  InvitationReceived: 'Lời mời sự kiện',
  InvitationAccepted: 'Chấp nhận lời mời sự kiện',
  InvitationDeclined: 'Từ chối lời mời sự kiện',
  InvitationCanceled: 'Lời mời sự kiện đã hủy',
  InvitationExpired: 'Lời mời sự kiện hết hạn',
  ArtTradeProposed: 'Lời mời trao đổi tác phẩm',
  ArtTradeAccepted: 'Chấp nhận trao đổi tác phẩm',
  ArtTradeDeclined: 'Từ chối trao đổi tác phẩm',
  ArtTradeCancelled: 'Hủy trao đổi tác phẩm',
  ArtTradeArtworkSubmitted: 'Đối tác đã nộp tác phẩm',
  ArtTradeCompleted: 'Giao dịch trao đổi hoàn tất',
  TradeDisputeCreated: 'Khiếu nại trao đổi tác phẩm',
  TradeDisputeResolved: 'Phân xử khiếu nại trao đổi',
  SubmissionDisputeCreated: 'Khiếu nại bài dự thi mới',
  BugReportReplied: 'Phản hồi báo cáo sự cố',
};

export const notificationTypeLabelsEn: Record<string, string> = {
  OutbidAlert: 'Outbid Alert',
  AuctionEndingSoon: 'Auction Ending Soon',
  AuctionWon: 'Auction Won',
  DeadlineRiskWarning: 'Deadline Risk Warning',
  PaymentSucceeded: 'Deposit Succeeded',
  PayoutStatusChanged: 'Payout Status Updated',
  UserSanctionAlert: 'Account Sanction',
  PromotionAnnouncement: 'Promotion',
  CommissionStatusChanged: 'Commission Status Updated',
  EscrowStatusChanged: 'Escrow Status Updated',
  DisputeStatusChanged: 'Dispute Status Updated',
  CreatorApplicationStatusChanged: 'Creator Application',
  InvitationReceived: 'Event Invitation',
  InvitationAccepted: 'Event Invitation Accepted',
  InvitationDeclined: 'Event Invitation Declined',
  InvitationCanceled: 'Event Invitation Canceled',
  InvitationExpired: 'Event Invitation Expired',
  ArtTradeProposed: 'Art Trade Proposed',
  ArtTradeAccepted: 'Art Trade Accepted',
  ArtTradeDeclined: 'Art Trade Declined',
  ArtTradeCancelled: 'Art Trade Cancelled',
  ArtTradeArtworkSubmitted: 'Trade Partner Submitted Artwork',
  ArtTradeCompleted: 'Art Trade Completed',
  TradeDisputeCreated: 'Art Trade Dispute Filed',
  TradeDisputeResolved: 'Art Trade Dispute Resolved',
  SubmissionDisputeCreated: 'New Event Submission Dispute',
  BugReportReplied: 'Bug Report Reply',
};

/** Danh sách loại hợp lệ, dùng cho bộ lọc và kiểm tra dữ liệu. */
export const notificationTypes = Object.keys(notificationTypeLabels);

/**
 * Bốn tab phân loại của Notification Center (SCR-45).
 * `id` khớp enum `NotificationCategory` ở backend; lọc ngay trong DB nên phân trang
 * theo từng tab vẫn đúng (xem `GetMyNotificationsQuery`).
 */
export const notificationCategories = [
  { id: 'Finance', label: 'Tài chính', labelEn: 'Finance' },
  { id: 'Order', label: 'Đơn hàng', labelEn: 'Orders' },
  { id: 'System', label: 'Hệ thống', labelEn: 'System' },
  { id: 'Promotion', label: 'Khuyến mãi', labelEn: 'Promotions' },
] as const;

export type NotificationCategoryId = (typeof notificationCategories)[number]['id'];
