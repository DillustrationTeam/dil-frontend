'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import toast from 'react-hot-toast';

export type Language = 'VIE' | 'ENG';

const dictionary: Record<string, { VIE: string; ENG: string }> = {
  // Navigation & Workspace
  'My Commissions': { VIE: 'Đơn vẽ của tôi', ENG: 'My Commissions' },
  'Auctions & Trade': { VIE: 'Đấu giá & Mua bán', ENG: 'Auctions & Trade' },
  'Workroom Chat': { VIE: 'Phòng làm việc', ENG: 'Workroom Chat' },
  'My Vouchers': { VIE: 'Mã giảm giá', ENG: 'My Vouchers' },
  'Client Workspace': { VIE: 'Không gian Client', ENG: 'Client Workspace' },
  
  // Wallet & Payment
  'Ví & Thanh toán': { VIE: 'Ví & Thanh toán', ENG: 'Wallet & Payment' },
  'Ví của tôi': { VIE: 'Ví của tôi', ENG: 'My Wallet' },
  'Nạp tiền': { VIE: 'Nạp tiền', ENG: 'Deposit' },
  'Rút tiền': { VIE: 'Rút tiền', ENG: 'Payout' },
  'Lịch sử giao dịch': { VIE: 'Lịch sử giao dịch', ENG: 'Transaction History' },
  
  // Creator Workspace
  'Commissions': { VIE: 'Đơn hàng & Studio', ENG: 'Commissions' },
  'Studio Overview': { VIE: 'Tổng quan Studio', ENG: 'Studio Overview' },
  'Incoming Requests': { VIE: 'Yêu cầu mới', ENG: 'Incoming Requests' },
  'Waitlist': { VIE: 'Danh sách chờ', ENG: 'Waitlist' },
  'Art Auctions': { VIE: 'Đấu giá nghệ thuật', ENG: 'Art Auctions' },
  'Doanh thu & Rút tiền': { VIE: 'Doanh thu & Rút tiền', ENG: 'Revenue & Payout' },
  'Tổng quan doanh thu': { VIE: 'Tổng quan doanh thu', ENG: 'Revenue Overview' },
  'Yêu cầu rút tiền': { VIE: 'Yêu cầu rút tiền', ENG: 'Withdrawal Request' },
  'Workstation': { VIE: 'Khu vực làm việc', ENG: 'Workstation' },
  'Artworks Portfolio': { VIE: 'Bộ sưu tập tác phẩm', ENG: 'Artworks Portfolio' },
  'Rate Card & Services': { VIE: 'Bảng giá & Dịch vụ', ENG: 'Rate Card & Services' },
  'Terms & Licensing': { VIE: 'Điều khoản & Bản quyền', ENG: 'Terms & Licensing' },
  'AI Auto-reply': { VIE: 'Tự động phản hồi AI', ENG: 'AI Auto-reply' },
  'Asset & Presets': { VIE: 'Tài nguyên & Presets', ENG: 'Asset & Presets' },
  
  // Header / Actions
  'Client Mode': { VIE: 'Chế độ Client', ENG: 'Client Mode' },
  'Creator Studio': { VIE: 'Creator Studio', ENG: 'Creator Studio' },
  'Account Settings': { VIE: 'Cài đặt tài khoản', ENG: 'Account Settings' },
  'Sign Out': { VIE: 'Đăng xuất', ENG: 'Sign Out' },
  'Sign In': { VIE: 'Đăng nhập', ENG: 'Sign In' },
  'Join Collective': { VIE: 'Tham gia Collective', ENG: 'Join Collective' },
  'Creator Dashboard': { VIE: 'Bảng điều khiển Creator', ENG: 'Creator Dashboard' },
  'Marketplace': { VIE: 'Chợ nghệ thuật', ENG: 'Marketplace' },
  'Artists': { VIE: 'Tác giả & Họa sĩ', ENG: 'Artists' },
  'Collections': { VIE: 'Bộ sưu tập', ENG: 'Collections' },
  'Đấu giá': { VIE: 'Đấu giá', ENG: 'Auctions' },
  'Phòng làm việc': { VIE: 'Phòng làm việc', ENG: 'Workroom' },
  'Escrow Verified': { VIE: 'Xác thực Escrow', ENG: 'Escrow Verified' },
  'Admin Console': { VIE: 'Quản trị Admin', ENG: 'Admin Console' },
  'System Admin': { VIE: 'Quản trị viên', ENG: 'System Admin' },
  'Trợ lý AI Dillustration': { VIE: 'Trợ lý AI Dillustration', ENG: 'Dillustration AI Assistant' },
  'Search curated art...': { VIE: 'Tìm tác phẩm tuyển chọn...', ENG: 'Search curated art...' },
};

// Global DOM Auto-Translation Map for Client-side text node replacement
const translationMap: Record<string, string> = {
  // Marketplace & Art Discovery
  'Khám phá nghệ thuật': 'Explore Art',
  'KHÁM PHÁ NGHỆ THUẬT': 'EXPLORE ART',
  'Chợ tranh dành riêng cho bạn': 'Curated Art Marketplace for You',
  'CHỢ TRANH DÀNH RIÊNG CHO BẠN': 'CURATED ART MARKETPLACE FOR YOU',
  'Khám phá tác phẩm và những nghệ sĩ phù hợp với gu thẩm mỹ của bạn.': 'Discover artwork and artists matching your unique aesthetic style.',
  'Tìm bằng hình ảnh': 'Visual Search',
  'Tim bằng hình ảnh': 'Visual Search',
  'SỰ KIỆN NỔI BẬT': 'FEATURED EVENT',
  'Sự kiện nổi bật': 'Featured Event',
  'Khám phá sự kiện': 'Explore Event',
  'Khám phá': 'Explore',
  'Tìm tác phẩm, nghệ sĩ hoặc phong cách...': 'Search artwork, artist or style...',
  'Bộ lọc': 'Filters',
  'Phong cách': 'Style',
  'PHONG CÁCH': 'STYLE',
  'Khoảng giá': 'Price Range',
  'KHOẢNG GIÁ': 'PRICE RANGE',
  'Đánh giá': 'Rating',
  'ĐÁNH GIÁ': 'RATING',
  'Bản quyền': 'Licensing',
  'BẢN QUYỀN': 'LICENSING',
  'Artist còn slot': 'Artist has open slots',
  'Dành cho bạn': 'For You',
  'Đang theo dõi': 'Following',
  'tác phẩm phù hợp': 'matching artworks',
  'Tất cả đánh giá': 'All Ratings',
  '4★ trở lên': '4★ and above',
  '4.5★ trở lên': '4.5★ and above',
  'Tất cả': 'All',
  'Cá nhân': 'Personal',
  'Thương mại': 'Commercial',
  'Từ': 'Min',
  'Đến': 'Max',
  'Đang tải chợ tranh...': 'Loading marketplace...',
  'Chưa tìm thấy tác phẩm phù hợp': 'No matching artworks found',
  'Xóa bộ lọc': 'Clear filters',
  
  // Collections & Favorites
  'Thư viện cá nhân': 'Personal Library',
  'THƯ VIỆN CÁ NHÂN': 'PERSONAL LIBRARY',
  'Bộ sưu tập & yêu thích': 'Collections & Favorites',
  'Lưu giữ các tác phẩm để quay lại bất cứ lúc nào.': 'Keep your artworks saved to revisit anytime.',
  'Album của bạn': 'Your Albums',
  'Tạo album mới': 'Create New Album',
  'Tên album': 'Album Name',
  'Công khai album': 'Public Album',
  'Tạo album': 'Create Album',
  'Tác phẩm đã thích': 'Liked Artworks',
  'Chưa có tác phẩm yêu thích': 'No liked artworks yet',
  'Khám phá chợ tranh': 'Explore Marketplace',
  'Bỏ yêu thích': 'Remove Favorite',
  'Công khai': 'Public',
  'Riêng tư': 'Private',
  'AI Visual Search': 'AI Visual Search',
  'Tìm phong cách bằng hình ảnh': 'Search Style by Image',
  'Tải ảnh tham khảo để khám phá các tác phẩm có phong cách tương đồng.': 'Upload a reference image to explore artworks with similar styles.',
  'Kéo thả ảnh vào đây hoặc chọn ảnh': 'Drag & drop image here or browse file',
  'Tác phẩm gợi ý': 'Suggested Artworks',
  'kết quả tương đồng': 'matching results',
  'Xem chi tiết tác phẩm': 'View Artwork Details',

  // Wallet & Payment Screens
  'Ví của tôi': 'My Wallet',
  'Nạp tiền': 'Deposit',
  'Rút tiền': 'Payout',
  'Doanh thu': 'Revenue',
  'Số dư khả dụng': 'Available Balance',
  'Số dư ký quỹ': 'Escrow Balance',
  'Lịch sử giao dịch': 'Transaction History',
  'Tất cả loại giao dịch': 'All Transaction Types',
  'Nạp tiền ví': 'Wallet Deposit',
  'Thanh toán đợt vẽ': 'Milestone Payment',
  'Nhận doanh thu': 'Revenue Received',
  'Hoàn tiền': 'Refund',
  'Rút tiền về ngân hàng': 'Withdraw to Bank',
  'Nạp tiền vào ví': 'Deposit into Wallet',
  'Số dư dùng để đặt giá đấu giá, thanh toán tranh nghệ thuật và đặt vẽ tranh.': 'Balance used for auctions, artwork purchases, and custom commissions.',
  'Cổng thanh toán bảo mật': 'Secure Payment Gateway',
  'Chọn nhanh số tiền nạp': 'Quick Select Amount',
  'Hoặc nhập số tiền tùy ý (₫)': 'Or enter custom amount (₫)',
  'Nhập số tiền tối thiểu 10.000 ₫': 'Minimum amount 10,000 ₫',
  'Tối thiểu: 10.000 ₫ · Miễn phí giao dịch': 'Min: 10,000 ₫ · Zero transaction fee',
  'Quét mã VietQR để thanh toán': 'Scan VietQR Code to Pay',
  'Mở trang thanh toán ngân hàng': 'Open Bank Payment Page',
  'Thông tin chuyển khoản': 'Transfer Details',
  'Số tiền cần chuyển:': 'Transfer Amount:',
  'Số tài khoản nhận:': 'Receiving Bank Account:',
  'Chủ tài khoản:': 'Account Holder:',
  'Nội dung chuyển khoản (bắt buộc):': 'Transfer Memo (Required):',
  'Tôi đã chuyển khoản': 'I Have Transferred',
  'Nạp tiền thành công!': 'Deposit Successful!',
  'Xem số dư ví': 'View Wallet Balance',
  'Tạo đơn nạp khác': 'Create Another Deposit',
  'Yêu cầu rút tiền về ngân hàng': 'Request Bank Withdrawal',
  'Tài khoản ngân hàng nhận tiền': 'Receiving Bank Account',
  'Số tiền muốn rút (₫)': 'Withdrawal Amount (₫)',
  'Gửi yêu cầu rút tiền': 'Submit Withdrawal Request',
  'Tên ngân hàng': 'Bank Name',
  'Tên chủ tài khoản': 'Account Holder Name',
  'Số tài khoản': 'Account Number',
  'Xác nhận rút tiền': 'Confirm Withdrawal',
  'Mọi chuyển động của dòng tiền, trong một nơi.': 'Every financial movement, in one place.',
  'Tiền vào': 'Money In',
  'Tiền ra': 'Money Out',
  'Mới nhất trước': 'Newest first',
  'Mới hơn': 'Newer',
  'Cũ hơn': 'Older',
  'Làm mới': 'Refresh',
  'Tổng quan số dư của tài khoản': 'Account balance overview',
  'Trạng thái ví:': 'Wallet status:',
  'Đơn vị tiền tệ:': 'Currency:',
  'Tiền đang tạm giữ': 'Escrow Held',
  'Đang giữ cho các giao dịch': 'Held for active commissions & transactions',
  'Đang chờ rút': 'Pending Payout',
  'Đã gửi yêu cầu, chờ Admin xử lý': 'Request submitted, awaiting Admin processing',
  'Tổng tiền đã rút': 'Total Withdrawn',
  'Các yêu cầu rút đã được xử lý': 'Processed withdrawal requests',
  'Sẵn sàng cho giao dịch của bạn': 'Ready for your transactions',
  'Tra cứu và đối chiếu biến động số dư.': 'Search and verify balance changes.',
  'Đăng nhập để xem ví của bạn': 'Sign in to view your wallet',
  'Số dư và lịch sử giao dịch chỉ hiển thị cho chủ tài khoản.': 'Balance and transaction history are visible to account holder only.',
  'Giao dịch': 'Transaction',
  'Thời gian': 'Time',
  'Nội dung': 'Description / Note',
  'Chiều': 'Direction',
  'Số tiền': 'Amount',
  'Số dư sau giao dịch': 'Balance After',
  'Không tìm thấy giao dịch phù hợp': 'No matching transactions found',
  'Ví của bạn chưa có giao dịch': 'Your wallet has no transactions yet',
  'Thử đổi khoảng thời gian hoặc xóa bộ lọc để xem thêm.': 'Try changing date range or clearing filters.',
  'Các khoản tiền vào và tiền ra sẽ xuất hiện tại đây khi bạn bắt đầu giao dịch.': 'Incoming and outgoing funds will appear here when transactions occur.',
  'Loại giao dịch': 'Transaction Type',
  'Tất cả giao dịch': 'All Transactions',
  'Chiều giao dịch': 'Transaction Direction',
  'Tiền vào & tiền ra': 'Money In & Money Out',
  'Từ ngày': 'From Date',
  'Đến ngày': 'To Date',
  'Áp dụng': 'Apply',
  'Ngày giao dịch theo giờ Việt Nam (GMT+7).': 'Transaction date in Vietnam Time (GMT+7).',
  'Clear Filters': 'Clear Filters',
  'Vui lòng đăng nhập để thực hiện nạp tiền.': 'Please sign in to deposit funds.',
  'Số tiền nạp tối thiểu là 10.000 ₫.': 'Minimum deposit amount is 10,000 ₫.',
  'Tạo đơn nạp tiền thất bại. Vui lòng thử lại.': 'Failed to create deposit order. Please try again.',
  'Không thể kiểm tra trạng thái đơn.': 'Unable to verify order status.',
  'Phương thức thanh toán:': 'Payment Method:',
  'Chuyển khoản VietQR qua PayOS': 'VietQR Transfer via PayOS',
  'Hệ thống tự động ghi nhận tiền vào ví trong vòng 1-3 phút sau khi chuyển khoản thành công.': 'System automatically credits your wallet within 1-3 minutes after successful transfer.',
  'Đang khởi tạo đơn…': 'Initializing order…',
  'Đã sao chép vào bộ nhớ tạm!': 'Copied to clipboard!',
  'Đang kiểm tra...': 'Checking status...',
  'Chuyển số dư tích lũy từ hoạt động vẽ tranh và đấu giá về tài khoản ngân hàng nội địa Việt Nam.': 'Transfer accumulated balance from commissions and auctions to domestic Vietnamese bank account.',
  'Tạo yêu cầu rút tiền': 'Create Payout Request',
  'Bạn chưa có tài khoản ngân hàng nào để nhận tiền.': 'You do not have any receiving bank account.',
  'Thêm tài khoản ngân hàng': 'Add Bank Account',
  'Chọn tài khoản nhận tiền': 'Select Receiving Bank Account',
  'Mặc định': 'Default',
  'Tối thiểu 50.000 ₫': 'Minimum 50,000 ₫',
  'Ghi chú (tùy chọn)': 'Notes (optional)',
  'Thời gian giải ngân thông thường từ 1-24 giờ làm việc. Phí rút tiền: Miễn phí.': 'Processing time 1-24 working hours. Withdrawal fee: Free.',
  'Lịch sử yêu cầu rút tiền': 'Payout Request History',
  'Chưa có yêu cầu rút tiền nào.': 'No payout requests yet.',
  'Tài khoản ngân hàng': 'Bank Accounts',
  'Thêm tài khoản mới': 'Add New Account',
  'Tên chủ tài khoản (in hoa, không dấu)': 'Account Holder Name (UPPERCASE)',
  'Hủy': 'Cancel',
  'Lưu': 'Save',
  'Chờ xử lý': 'Pending',
  'Đã duyệt': 'Approved',
  'Đang chuyển khoản': 'Processing',
  'Thành công': 'Completed',
  'Bị từ chối': 'Rejected',
  'Đã hủy': 'Cancelled',

  // Workroom & Auctions & Chat
  'Phòng làm việc & Trao đổi hợp đồng': 'Workroom & Contract Exchange',
  'Mỗi đơn đặt vẽ hoặc phiên đấu giá sẽ có một phòng làm việc riêng để tác giả và khách hàng trao đổi phác thảo, duyệt tiến độ và gửi tệp hoàn thiện. Phòng được mở từ đơn hàng hoặc từ phiên đấu giá.': 'Each commission order or auction has a dedicated workroom for creator and client to exchange sketches, approve progress, and deliver final files.',
  'Mọi tin nhắn và tệp trao đổi đều được lưu làm bằng chứng ký quỹ': 'All messages and files are stored as escrow proof',
  'Mở từ sàn đấu giá': 'Open from auction marketplace',
  'Về trang chủ': 'Back to Home',
  'Sàn đấu giá tác phẩm nghệ thuật': 'Art Auction Marketplace',
  'Đấu giá trực tiếp các bức tranh kỹ thuật số độc bản có bản quyền xác thực.': 'Live auctions for authenticated exclusive digital artworks.',
  'Mở phiên đấu giá': 'Launch Auction',
  'Mở phiên đấu giá mới': 'Launch New Auction',
  'Làm mới danh sách': 'Refresh list',
  'Đang diễn ra': 'Live / Active',
  'Sắp diễn ra': 'Upcoming',
  'Đã hoàn tất': 'Settled',
  'Tất cả trạng thái': 'All Statuses',
  'Tìm theo tên tranh...': 'Search by artwork title...',
  'Sắp kết thúc': 'Ending Soon',
  'Giá cao nhất': 'Highest Price',
  'Giá thấp nhất': 'Lowest Price',
  'Nhiều lượt đặt giá': 'Most Bids',
  'Mới nhất': 'Newest',
  'Không tìm thấy phiên đấu giá nào': 'No auctions found',
  'Hãy thử thay đổi bộ lọc trạng thái hoặc mở phiên đấu giá mới ngay hôm nay.': 'Try changing status filters or launch a new auction today.',
  'Chưa có ảnh xem trước': 'No preview image available',
  'Tác phẩm độc bản': 'Exclusive Artwork',
  'Kỹ thuật số': 'Digital',
  'lượt đặt': 'bids',
  'quan tâm': 'watchers',
  'Xem chi tiết & Đặt giá': 'View Details & Bid',
  'Đang tải thêm...': 'Loading more...',
  'Tải thêm phiên đấu giá': 'Load More Auctions',
  'Khiếu nại': 'Dispute / Claim',
  'Duyệt mốc': 'Approve Milestone',
  'Kho file': 'File Vault',
  'Kho file gốc': 'Original File Vault',
  'Bàn giao & Tải file HD': 'Deliver & Download HD Files',
  'Tiến độ & Hạn chót': 'Progress & Deadline',
  'An toàn 100%': '100% On Track',
  'Cần chú ý': 'Attention Needed',

  // Notifications, Vouchers & Revenue
  'Trung tâm thông báo': 'Notification Center',
  'mới': 'new',
  'Cập nhật hoạt động đặt vẽ tranh, biến động số dư và diễn biến các phiên đấu giá.': 'Stay updated on custom commissions, wallet balance changes, and auction updates.',
  'Đánh dấu đã đọc tất cả': 'Mark all as read',
  'Tài chính': 'Finance',
  'Đơn hàng': 'Orders',
  'Hệ thống': 'System',
  'Khuyến mãi': 'Promotions',
  'Chỉ chưa đọc': 'Unread only',
  'Không có thông báo nào': 'No notifications',
  'Bạn đã xem hết tất cả thông báo hiện có.': "You've caught up with all notifications.",
  'Đã đọc': 'Read',
  'Chưa đọc': 'Unread',
  'Xem các thông báo cũ hơn': 'View older notifications',
  'Trung tâm mã giảm giá': 'Voucher Hub',
  'Khám phá mã ưu đãi áp dụng cho đặt tranh hoa hồng nghệ thuật và các phiên đấu giá độc quyền.': 'Discover promotional vouchers applicable to art commissions and exclusive auctions.',
  'Quay lại ví': 'Back to Wallet',
  'Tạo mã giảm giá mới': 'Create New Voucher',
  'Tạo mã ưu đãi mới': 'Create New Discount Voucher',
  'Mã giảm giá (viết hoa liền nhau)': 'Voucher Code (uppercase)',
  'Tên chương trình ưu đãi': 'Promotion Program Name',
  'Hình thức giảm': 'Discount Type',
  'Theo phần trăm (%)': 'Percentage (%)',
  'Số tiền cố định (₫)': 'Fixed Amount (₫)',
  'Giảm tối đa (để trống nếu không giới hạn)': 'Max Discount (leave blank for unlimited)',
  'Ngày bắt đầu': 'Start Date',
  'Ngày kết thúc': 'End Date',
  'Tổng lượt sử dụng': 'Total Usage Limit',
  'Lưu mã giảm giá': 'Save Voucher',
  'Đang hiệu lực': 'Active',
  'Hết hạn': 'Expired',
  'Hiện chưa có mã giảm giá nào phù hợp với bộ lọc.': 'No vouchers currently match the selected filter.',
  'Xóa mã': 'Delete code',
  'Đã dùng': 'Used',
  'lượt': 'times',
  'Thống kê doanh thu': 'Revenue Statistics',
  'Theo dõi thu nhập từ nhận vẽ tranh kỹ thuật số và bán tranh qua các phiên đấu giá.': 'Track earnings from custom art commissions and art auctions.',
  'ngày qua': 'days ago',
  'Làm mới dữ liệu': 'Refresh data',
  'Thu nhập thực nhận': 'Net Income Received',
  'Đã khấu trừ phí nền tảng': 'After platform fee deduction',
  'Tổng doanh thu gộp': 'Total Gross Revenue',
  'Đơn hoàn tất': 'Completed Orders',
  'Hợp đồng và phiên đấu giá': 'Contracts and auctions',
  'Giá trị trung bình mỗi đơn': 'Average Order Value',
  'Trung bình trên đơn hàng': 'Average per order',
  'Biến động doanh thu theo thời gian': 'Revenue Trend Over Time',
  'Đường: thu nhập ròng · đưa chuột lên điểm để xem gộp/phí': 'Line: Net income · Hover data points for gross/fee',
  'Cơ cấu nguồn thu': 'Revenue Structure',
  'Vẽ tranh theo yêu cầu': 'Custom Art Commissions',
  'Đấu giá tác phẩm': 'Artwork Auctions',
  'Chưa có phân loại nguồn thu.': 'No revenue breakdown available.',
  'Lịch sử kết toán doanh thu định kỳ': 'Periodic Revenue Settlement History',
  'Chưa có bản ghi kết toán nào.': 'No settlement records found.',
  'Ngày kết toán': 'Settlement Date',
  'Phạm vi': 'Scope',
  'Phí sàn': 'Platform Fee',
  'Thực nhận': 'Net Received',
  'Số đơn': 'Order Count',
  'Doanh thu tác giả': 'Creator Revenue',

  // Creator & Studio
  'Tổng quan Studio': 'Studio Overview',
  'Yêu cầu mới': 'Incoming Requests',
  'Danh sách chờ': 'Waitlist',
  'Doanh thu & Rút tiền': 'Revenue & Payout',
  'Tổng quan doanh thu': 'Revenue Overview',
  'Yêu cầu rút tiền': 'Withdrawal Request',
  'Khu vực làm việc': 'Workstation',
  'Bộ sưu tập tác phẩm': 'Artworks Portfolio',
  'Bảng giá & Dịch vụ': 'Rate Card & Services',
  'Điều khoản & Bản quyền': 'Terms & Licensing',
  'Tự động phản hồi AI': 'AI Auto-reply',
  'Tài nguyên & Presets': 'Asset & Presets',
  'Tổng doanh thu tích lũy': 'Total Cumulative Revenue',
  'Doanh thu tháng này': 'This Month Revenue',
  'Đang chờ quyết toán': 'Pending Settlement',
  'Đã rút về ngân hàng': 'Total Withdrawn',

  // Auctions & Workroom
  'Đấu giá nghệ thuật': 'Art Auctions',
  'Phiên đấu giá đang diễn ra': 'Live Auctions',
  'Đặt giá ngay': 'Place Bid Now',
  'Giá hiện tại': 'Current Price',
  'Thời gian còn lại': 'Time Remaining',
  'Lịch sử đặt giá': 'Bid History',
  'Đặt giá cao nhất': 'Highest Bid',
  'Phòng làm việc': 'Workroom',
  'Tiến độ dự án': 'Project Progress',
  'Gửi tin nhắn...': 'Type a message...',
  'Tải bản thảo': 'Upload Sketch/Draft',
  'Yêu cầu chỉnh sửa': 'Request Revision',
  'Nghiệm thu & Bàn giao': 'Approve & Deliver',
  'Trợ lý AI': 'AI Assistant',

  // Header, Search, Navigation
  'Đơn vẽ của tôi': 'My Commissions',
  'Đấu giá & Mua bán': 'Auctions & Trade',
  'Mã giảm giá': 'My Vouchers',
  'Không gian Client': 'Client Workspace',
  'Tìm tác phẩm': 'Search Artworks',
  'Nhập tên tranh hoặc tác giả...': 'Enter artwork title or artist name...',
  'Tranh kỹ thuật số': 'Digital Art',
  'Concept art': 'Concept Art',
  'Phong cảnh': 'Landscape',
  'Đăng xuất': 'Sign Out',
  'Đăng nhập': 'Sign In',
  'Chế độ Client': 'Client Mode',
  'Creator Studio': 'Creator Studio',
  'Bảng điều khiển Creator': 'Creator Dashboard',
  'Cài đặt tài khoản': 'Account Settings',
};

// Case-insensitive lookup dictionary built automatically
const lowerTranslationMap: Record<string, string> = {};
Object.entries(translationMap).forEach(([k, v]) => {
  lowerTranslationMap[k.toLowerCase().trim()] = v;
});

// Dynamic Regex Replacements for strings with numbers or dynamic parts
const regexReplacements: Array<{ pattern: RegExp; replacement: string }> = [
  { pattern: /^(\d+)\s+tác phẩm phù hợp$/i, replacement: '$1 matching artworks' },
  { pattern: /^(\d+)\s+tác phẩm$/i, replacement: '$1 artworks' },
  { pattern: /^(\d+)\s+album$/i, replacement: '$1 albums' },
  { pattern: /^(\d+)\s+kết quả tương đồng$/i, replacement: '$1 matching results' },
  { pattern: /^(\d+)\s+kết quả$/i, replacement: '$1 results' },
  { pattern: /^(\d+)\s+yêu cầu$/i, replacement: '$1 requests' },
  { pattern: /^(\d+)\s+đơn hàng$/i, replacement: '$1 orders' },
  { pattern: /^(\d+)\s+đơn vẽ$/i, replacement: '$1 commissions' },
  { pattern: /^(\d+)\s+ngày$/i, replacement: '$1 days' },
  { pattern: /^(\d+)\s+giờ$/i, replacement: '$1 hours' },
  { pattern: /^(\d+)\s+phút$/i, replacement: '$1 minutes' },
  { pattern: /^(\d+)\s+giây$/i, replacement: '$1 seconds' },
];

function translateString(text: string): string {
  if (!text) return text;
  const trimmed = text.trim();
  if (!trimmed) return text;

  // Direct match
  if (translationMap[trimmed]) {
    return text.replace(trimmed, translationMap[trimmed]);
  }

  // Case-insensitive match
  const lower = trimmed.toLowerCase();
  if (lowerTranslationMap[lower]) {
    return text.replace(trimmed, lowerTranslationMap[lower]);
  }

  // Dynamic regex match
  for (const { pattern, replacement } of regexReplacements) {
    if (pattern.test(trimmed)) {
      return text.replace(trimmed, trimmed.replace(pattern, replacement));
    }
  }

  return text;
}

interface LanguageContextType {
  lang: Language;
  setLang: (lang: Language) => void;
  toggleLang: () => void;
  t: (text: string) => string;
}

const LanguageContext = createContext<LanguageContextType>({
  lang: 'VIE',
  setLang: () => {},
  toggleLang: () => {},
  t: (text: string) => text,
});

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Language>('VIE');

  useEffect(() => {
    void Promise.resolve().then(() => {
      const saved = localStorage.getItem('app-lang') as Language | null;
      if (saved) {
        setLangState(saved);
        document.documentElement.lang = saved === 'VIE' ? 'vi' : 'en';
      }
    });
  }, []);

  // DOM Auto-Translator effect whenever language changes
  useEffect(() => {
    if (lang !== 'ENG') return;

    function translateNode(node: Node) {
      if (node.nodeType === Node.TEXT_NODE) {
        const val = node.nodeValue;
        if (val) {
          const translated = translateString(val);
          if (translated !== val) {
            node.nodeValue = translated;
          }
        }
      } else if (node.nodeType === Node.ELEMENT_NODE) {
        const el = node as HTMLElement;
        if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
          const inputEl = el as HTMLInputElement;
          if (inputEl.placeholder) {
            const translated = translateString(inputEl.placeholder);
            if (translated !== inputEl.placeholder) {
              inputEl.placeholder = translated;
            }
          }
        }
        for (let i = 0; i < el.childNodes.length; i++) {
          translateNode(el.childNodes[i]);
        }
      }
    }

    // Translate current DOM
    translateNode(document.body);

    // Observe future DOM mutations (e.g. dynamic state changes or API loads)
    const observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        for (let i = 0; i < mutation.addedNodes.length; i++) {
          translateNode(mutation.addedNodes[i]);
        }
        if (mutation.type === 'characterData' && mutation.target) {
          translateNode(mutation.target);
        }
      }
    });

    observer.observe(document.body, { childList: true, subtree: true, characterData: true });

    return () => {
      observer.disconnect();
    };
  }, [lang]);

  const setLang = (newLang: Language) => {
    setLangState(newLang);
    localStorage.setItem('app-lang', newLang);
    document.documentElement.lang = newLang === 'VIE' ? 'vi' : 'en';
    if (typeof window !== 'undefined') {
      window.location.reload();
    }
  };

  const toggleLang = () => {
    const nextLang = lang === 'VIE' ? 'ENG' : 'VIE';
    setLang(nextLang);
    toast.success(nextLang === 'VIE' ? 'Đã chuyển sang Tiếng Việt' : 'Switched to English');
  };

  const t = (text: string): string => {
    if (!text) return text;
    const entry = dictionary[text];
    if (entry) return entry[lang];
    if (lang === 'ENG') {
      return translateString(text);
    }
    return text;
  };

  return (
    <LanguageContext.Provider value={{ lang, setLang, toggleLang, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  return useContext(LanguageContext);
}

