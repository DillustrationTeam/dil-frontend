'use client';

import Link from 'next/link';
import { JetBrains_Mono } from 'next/font/google';
import { ArrowDown, Check, ChevronDown, Info, ShieldCheck, Sparkles } from 'lucide-react';
import { useLanguage } from '@/context/language-context';
import styles from './guide-page.module.css';
import { SupportContactTrigger } from './support-contact-trigger';

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin', 'vietnamese'],
  weight: ['500', '700', '800'],
  variable: '--font-guide-mono',
  display: 'swap',
});

interface OperationItem {
  step: string;
  align: 'left' | 'right';
  tag: string;
  subLabel: string;
  title: string;
  description: string;
  showMilestones?: boolean;
  footerCheck: string;
  footerChip: string;
}

interface MilestoneStage {
  order: number;
  label: string;
  pct: string;
}

interface FaqBullet {
  title: string;
  detail: string;
}

interface FaqItem {
  tag: string;
  question: string;
  lead: string;
  bullets: FaqBullet[];
  defaultOpen?: boolean;
}

interface SupportDetailItem {
  label: string;
  value?: string;
  isSupportTrigger?: boolean;
  href?: string;
  linkText?: string;
}

interface GuideCopy {
  heroTitle: string;
  heroSub: string;
  escrowTitle: string;
  escrowTag: string;
  escrowDesc: string;
  trustPills: string[];
  ctaDiscover: string;
  ctaAuctions: string;
  ctaFaq: string;
  opsTitle: string;
  opsSub: string;
  milestones: MilestoneStage[];
  operations: OperationItem[];
  faqTitle: string;
  faqSubtitle: string;
  faqs: FaqItem[];
  supportAria: string;
  supportTitle: string;
  supportIntro: string;
  supportDetails: SupportDetailItem[];
  artistQuestion: string;
  artistCta: string;
}

const GUIDE_COPY: Record<'VIE' | 'ENG', GuideCopy> = {
  VIE: {
    heroTitle: 'DILLUSTRATION — Sàn Commission & Đấu giá tranh số',
    heroSub:
      'Nơi bạn kết nối trực tiếp với các họa sĩ vẽ tranh kỹ thuật số (2D Illustration, Anime, Chibi, VTuber) và giao dịch an toàn theo từng chặng minh bạch.',
    escrowTitle: 'Cơ chế Ký quỹ từng chặng (Milestone Escrow qua payOS)',
    escrowTag: 'Lời nhắn bảo chứng',
    escrowDesc:
      'Tiền cọc được hệ thống lưu giữ trung gian an toàn. Bạn kiểm tra phác thảo (sketch), nét viền (lineart) và lên màu trong Workroom, bấm duyệt từng chặng thì hệ thống mới giải ngân tiền cho họa sĩ.',
    trustPills: [
      '100% Ký quỹ qua payOS (VietQR)',
      'Workroom bảo vệ bản quyền & file gốc',
      'Thỏa thuận thương mại rõ ràng',
    ],
    ctaDiscover: 'Khám phá họa sĩ',
    ctaAuctions: 'Xem các phiên đấu giá',
    ctaFaq: 'Quy chế hoạt động & Escrow →',
    opsTitle: 'Những thao tác bạn có thể thực hiện trên DILLUSTRATION',
    opsSub:
      'Sáu luồng nghiệp vụ cốt lõi giúp người mua tranh, khách hàng đặt vẽ và họa sĩ cộng tác, tham gia sự kiện và trao đổi tác phẩm minh bạch từ bước đầu tiên.',
    milestones: [
      { order: 1, label: 'Phác thảo (Sketch)', pct: '30%' },
      { order: 2, label: 'Nét viền (Lineart)', pct: '30%' },
      { order: 3, label: 'Lên màu (Color)', pct: '40%' },
    ],
    operations: [
      {
        step: '01',
        align: 'left',
        tag: 'THAO TÁC 01 • MARKETPLACE',
        subLabel: 'Khám phá & Mua sẵn',
        title: 'Thư viện tranh',
        description:
          'Tìm kiếm hàng trăm tác phẩm kỹ thuật số theo phong cách (2D Illustration, Anime, Chibi, VTuber) hoặc tải ảnh mẫu tương đồng. Thanh toán minh bạch để nhận gói quyền sử dụng và tải ngay file gốc PSD/PNG/CLIP độ phân giải cao.',
        footerCheck: 'Bản quyền số & File gốc',
        footerChip: 'Instant Download',
      },
      {
        step: '02',
        align: 'right',
        tag: 'THAO TÁC 02 • WORKROOM',
        subLabel: 'Đặt vẽ & Ký quỹ',
        title: 'Quy trình đặt vẽ',
        description:
          'Gửi Brief chi tiết, chốt bảng giá và đặt cọc qua cổng payOS trung gian. Theo dõi tiến độ trực tiếp trong Workroom theo 3 chặng minh bạch; tiền chỉ được giải ngân sau khi bạn bấm xác nhận nghiệm thu từng chặng:',
        showMilestones: true,
        footerCheck: 'Hoàn tiền nếu trễ deadline',
        footerChip: 'Escrow 30-30-40',
      },
      {
        step: '03',
        align: 'left',
        tag: 'THAO TÁC 03 • AUCTION',
        subLabel: 'SignalR Real-Time',
        title: 'Đấu giá',
        description:
          'Tham gia các phiên đấu giá tranh độc bản hoặc Adoptable diễn ra trực tiếp với độ trễ bằng không. Hệ thống hỗ trợ đặt giá (Bid), mua đứt (Buyout) tức thì và hoàn lại tiền cọc ngay lập tức nếu bạn bị vượt giá.',
        footerCheck: 'Đặt giá tức thời & An toàn',
        footerChip: 'Auto Refund Outbid',
      },
      {
        step: '04',
        align: 'right',
        tag: 'THAO TÁC 04 • EVENTS',
        subLabel: 'Cuộc thi & Bình chọn',
        title: 'Sự kiện sáng tác',
        description:
          'Tham gia các cuộc thi vẽ theo chủ đề do nền tảng tổ chức qua 4 chặng minh bạch: Nộp bài dự thi, Ban giám khảo chấm điểm, Cộng đồng bình chọn và Công bố bảng xếp hạng. Bảng điểm được niêm phong tới thời điểm công bố kết quả và hỗ trợ khiếu nại minh bạch.',
        footerCheck: 'Chấm điểm & Bình chọn công khai',
        footerChip: '4 Stages Contest',
      },
      {
        step: '05',
        align: 'left',
        tag: 'THAO TÁC 05 • ART TRADE',
        subLabel: 'Trao đổi 1-1 cho Họa sĩ',
        title: 'Trao đổi tranh (Art Trade)',
        description:
          'Các họa sĩ gửi đề nghị trao đổi tranh trực tiếp 1–1 kèm ảnh mẫu, thỏa thuận deadline và trao đổi trong phòng chat riêng. Hệ thống gắn watermark bản xem trước khi nộp bài; file gốc chỉ mở khóa đồng thời khi cả hai bên xác nhận nghiệm thu, kèm Admin phân xử nếu phát sinh tranh chấp.',
        footerCheck: 'Mở khóa file gốc đồng thời',
        footerChip: 'Watermark Protected',
      },
      {
        step: '06',
        align: 'right',
        tag: 'THAO TÁC 06 • CREATOR STUDIO',
        subLabel: 'Mở gian hàng & Nhận đơn',
        title: 'Trở thành họa sĩ',
        description:
          'Xây dựng hồ sơ họa sĩ chứng thực, thiết lập bảng giá commission theo từng hạng mục (Rate Card) và chủ động kiểm soát slot nhận đơn. Hệ thống bảo đảm 100% thù lao qua quỹ giữ tạm và hỗ trợ rút tiền 24/7 qua VietQR.',
        footerCheck: 'Bảo hộ thu nhập & Tác quyền',
        footerChip: 'Payout VietQR 24/7',
      },
    ],
    faqTitle: 'Câu hỏi thường gặp & Bảo hộ pháp lý (FAQs)',
    faqSubtitle:
      'Tổng hợp quy chế vận hành Workroom và các căn cứ pháp luật Việt Nam về sở hữu trí tuệ, bảo vệ người tiêu dùng, giao dịch điện tử, thương mại điện tử, dữ liệu cá nhân và minh bạch AI (thông tin tham khảo, đối chiếu hiệu lực văn bản chính thức khi cần thiết).',
    faqs: [
      {
        tag: 'Luật SHTT 2022',
        question: 'Quyền tác giả và quyền sử dụng thương mại của tranh Commission được tính thế nào?',
        lead: 'Theo Luật Sở hữu trí tuệ sửa đổi 2022 và điều khoản Creator trên DILLUSTRATION:',
        bullets: [
          {
            title: 'Quyền nhân thân (Quyền đứng tên):',
            detail:
              'Luôn thuộc về Họa sĩ sáng tác tác phẩm gốc; Khách hàng cần ghi nhận tác quyền (requireCredit) nếu điều khoản họa sĩ yêu cầu và không được tự ý xóa chữ ký hay mạo nhận là tác giả.',
          },
          {
            title: 'Quyền tài sản & Phạm vi sử dụng:',
            detail:
              'Khách hàng được cấp phép sử dụng đúng phạm vi Cá nhân hoặc Thương mại đã chọn trên đơn hàng (livestream, YouTube, ấn phẩm thương hiệu). Nghiêm cấm tự ý bán lại file hoặc chuyển nhượng cho bên thứ ba nếu chưa có thỏa thuận.',
          },
        ],
        defaultOpen: true,
      },
      {
        tag: 'Luật BVNTD 19/2023',
        question: 'Tiền ký quỹ, khiếu nại và quy chế hủy đơn Workroom hoạt động thế nào?',
        lead: 'Kết hợp nghĩa vụ theo Luật Bảo vệ quyền lợi người tiêu dùng số 19/2023/QH15 và Quy chế Workroom do hai bên xác nhận:',
        bullets: [
          {
            title: 'Minh bạch giá & Tiếp nhận khiếu nại (Luật 19/2023/QH15):',
            detail:
              'Hiển thị rõ tổng giá trị đơn và phần ký quỹ trước khi thanh toán (Điều 21). Hệ thống thông báo đã tiếp nhận phản ánh, khiếu nại trong 03 ngày làm việc (Điều 31 khoản 2) và hoàn phần Escrow chưa giải ngân khi có căn cứ vi phạm.',
          },
          {
            title: 'Quy chế vận hành riêng của Workroom (thỏa thuận trước thanh toán):',
            detail:
              'Đơn dưới 2.000.000đ ký quỹ 100%; từ 2.000.000đ trở lên ký quỹ theo từng mốc. Mỗi mốc hỗ trợ tối đa 3 lần chỉnh sửa miễn phí; quá 72 giờ sau khi nộp WIP nếu Khách hàng không phản hồi, hệ thống tự nghiệm thu theo quy chế hai bên đã đồng ý (hủy đơn phản hồi trong 48 giờ; quá hạn gia hạn 24 giờ).',
          },
        ],
      },
      {
        tag: 'Luật GDĐT 20/2023',
        question: 'Biên bản bàn giao file gốc và dữ liệu Workroom có giá trị đối soát không?',
        lead: 'Áp dụng Luật Giao dịch điện tử số 20/2023/QH15 (Điều 8–12, 34–38) về thông điệp dữ liệu & hợp đồng điện tử:',
        bullets: [
          {
            title: 'Giá trị chứng cứ điện tử:',
            detail:
              'Brief, điều khoản họa sĩ đóng băng tại thời điểm đặt đơn (snapshot), bước tự tích xác nhận điều khoản, lịch sử trò chuyện và WIP đều được ghi nhận kèm dấu thời gian (timestamp) cố định làm căn cứ khi Admin phân xử tranh chấp.',
          },
          {
            title: 'Bàn giao & Bảo vệ file gốc:',
            detail:
              'Tệp gửi qua khung chat chỉ để trao đổi; sản phẩm chính thức phải nộp qua chức năng bàn giao từng chặng. Khi hoàn tất 100%, liên kết tải file gốc có hiệu lực 15 phút (có thể tạo lại nhiều lần) và được bảo vệ bằng Forensic Watermark.',
          },
        ],
      },
      {
        tag: 'Luật TMĐT 122/2025',
        question: 'Quy chế Đấu giá, Trao đổi tranh (Art Trade) & Sự kiện tuân thủ Luật Thương mại điện tử thế nào?',
        lead: 'Đối chiếu Luật Thương mại điện tử số 122/2025/QH15 (Điều 11, Điều 17 khoản 4) và Nghị định 248/2026/NĐ-CP:',
        bullets: [
          {
            title: 'Hệ thống khiếu nại trực tuyến & Định danh người bán:',
            detail:
              'Họa sĩ mở gian hàng được kiểm duyệt hồ sơ; người dùng có kênh gửi báo cáo sự cố và khiếu nại trực tuyến cho đơn hàng Workroom, Art Trade và Sự kiện để Admin giám sát xử lý (Điều 17 khoản 4). Thông tin chủ quản & chính sách bảo vệ dữ liệu được công bố công khai khi vận hành thương mại chính thức.',
          },
          {
            title: 'Minh bạch Đấu giá, Art Trade & Sự kiện:',
            detail:
              'Trong Đấu giá SignalR, tiền cọc được hoàn tức thì nếu bị vượt giá (outbid). Trong Art Trade, bản xem trước gắn watermark và file gốc chỉ mở khóa đồng thời khi cả hai họa sĩ cùng xác nhận. Trong Sự kiện sáng tác, điểm chấm Ban giám khảo được niêm phong cho tới ngày công bố.',
          },
        ],
      },
      {
        tag: 'Luật BVDLCN 91/2025',
        question: 'Dữ liệu cá nhân và thông tin thanh toán của người dùng được bảo vệ theo quy định nào?',
        lead: 'Áp dụng Luật Bảo vệ dữ liệu cá nhân số 91/2025/QH15, Nghị định 356/2025/NĐ-CP và Luật An ninh mạng 116/2025/QH15:',
        bullets: [
          {
            title: 'Thu thập theo sự đồng ý & Dữ liệu nhạy cảm:',
            detail:
              'Ô đồng ý không tích sẵn khi đăng ký; thông tin tài khoản ngân hàng/VietQR thuộc nhóm dữ liệu nhạy cảm (điểm i khoản 1 Điều 4 NĐ 356/2025) và chỉ xử lý phục vụ ký quỹ/giải ngân payOS. Xem đầy đủ tại Chính sách bảo vệ dữ liệu cá nhân (/privacy).',
          },
          {
            title: 'Quyền chủ thể & Thời hạn xử lý (Điều 5 NĐ 356/2025):',
            detail:
              'Người dùng có quyền xem, sửa hoặc vô hiệu hóa tài khoản tại /settings và gửi yêu cầu cung cấp/rút đồng ý/xóa dữ liệu qua kênh hỗ trợ: xác nhận hướng dẫn trong 02 ngày làm việc; xem/sửa trong 10–15 ngày; rút đồng ý trong 15–20 ngày; xóa dữ liệu trong 20–30 ngày.',
          },
        ],
      },
      {
        tag: 'Luật AI 134/2025',
        question: 'Nền tảng quy định ra sao về minh bạch AI và chống dùng tranh đặt vẽ để huấn luyện AI?',
        lead: 'Phân biệt nghĩa vụ minh bạch theo Luật Trí tuệ nhân tạo số 134/2025/QH15 (NĐ 142/2026/NĐ-CP) và thỏa thuận hợp đồng của Họa sĩ:',
        bullets: [
          {
            title: 'Minh bạch & Gắn nhãn AI theo luật (Điều 11 Luật 134/2025, Điều 18 NĐ 142/2026):',
            detail:
              'Tác phẩm đăng tải được kiểm duyệt quét nhận diện AI và gắn cờ minh bạch; khung chat trợ lý ghi rõ tên "Trợ lý AI Dillustration" để người dùng phân biệt với nhân viên/Admin thật.',
          },
          {
            title: 'Điều khoản hợp đồng riêng chống huấn luyện AI (Creator Terms):',
            detail:
              'Theo điều khoản dân sự mặc định của Họa sĩ (prohibitAiTraining), Khách hàng và bên thứ ba không được đưa tác phẩm commission, bản phác thảo WIP hoặc tệp gốc vào tập dữ liệu huấn luyện AI khi chưa có sự đồng ý bằng văn bản của Họa sĩ.',
          },
        ],
      },
    ],
    supportAria: 'Thông tin nền tảng và hỗ trợ',
    supportTitle: 'Về nền tảng & Hỗ trợ',
    supportIntro:
      'DILLUSTRATION là nền tảng kết nối họa sĩ và khách hàng vẽ tranh kỹ thuật số tại Việt Nam, chuẩn hóa quy trình đặt vẽ, đấu giá và bàn giao bản quyền.',
    supportDetails: [
      { label: 'Thanh toán & Ký quỹ:', value: 'payOS (VietQR 24/7) • Giải ngân 30–30–40' },
      { label: 'Kênh liên lạc:', isSupportTrigger: true },
      { label: 'Dữ liệu cá nhân:', href: '/privacy', linkText: 'Chính sách bảo mật (/privacy) →' },
      { label: 'Đơn vị vận hành:', value: 'DILLUSTRATION Team' },
      { label: 'Logo:', value: 'Buniré' },
    ],
    artistQuestion: 'Bạn là họa sĩ?',
    artistCta: 'Mở slot tại đây →',
  },
  ENG: {
    heroTitle: 'DILLUSTRATION — Digital Art Commission & Auction Platform',
    heroSub:
      'Connect directly with digital illustrators (2D Illustration, Anime, Chibi, VTuber) and trade safely through transparent milestone-by-milestone workflows.',
    escrowTitle: 'Milestone Escrow Protection (powered by payOS)',
    escrowTag: 'Verified Guarantee',
    escrowDesc:
      'Your deposit is safely held in intermediate escrow. You review the sketch, lineart, and color deliverables inside the Workroom — funds are only released to the artist when you approve each milestone.',
    trustPills: [
      '100% payOS Escrow (VietQR)',
      'Workroom IP & Source File Protection',
      'Clear Commercial Licensing',
    ],
    ctaDiscover: 'Explore Artists',
    ctaAuctions: 'Browse Live Auctions',
    ctaFaq: 'Rules & Escrow Protection →',
    opsTitle: 'Core Workflows on DILLUSTRATION',
    opsSub:
      'Six end-to-end operations that empower art collectors, commission clients, and digital creators to collaborate, compete in events, and trade artwork transparently.',
    milestones: [
      { order: 1, label: 'Sketch', pct: '30%' },
      { order: 2, label: 'Lineart', pct: '30%' },
      { order: 3, label: 'Color & Final', pct: '40%' },
    ],
    operations: [
      {
        step: '01',
        align: 'left',
        tag: 'STEP 01 • MARKETPLACE',
        subLabel: 'Discover & Buy Ready Art',
        title: 'Artwork Marketplace',
        description:
          'Browse hundreds of digital artworks by style (2D Illustration, Anime, Chibi, VTuber) or search visually using reference images. Pay transparently to obtain usage rights and download high-resolution PSD/PNG/CLIP source files immediately.',
        footerCheck: 'Digital Rights & Source Files',
        footerChip: 'Instant Download',
      },
      {
        step: '02',
        align: 'right',
        tag: 'STEP 02 • WORKROOM',
        subLabel: 'Commission & Escrow',
        title: 'Commission Workflow',
        description:
          'Submit a detailed Brief, lock in the rate card pricing, and deposit via payOS escrow. Track progress directly inside the Workroom across 3 transparent stages; payouts are only released after you approve each milestone:',
        showMilestones: true,
        footerCheck: 'Refund if deadline missed',
        footerChip: 'Escrow 30-30-40',
      },
      {
        step: '03',
        align: 'left',
        tag: 'STEP 03 • AUCTION',
        subLabel: 'SignalR Real-Time',
        title: 'Art Auctions',
        description:
          'Bid in real-time on exclusive one-of-a-kind artworks or Adoptables with near-zero latency. Supports instant bidding, immediate Buyout, and automatic deposit refund the moment you are outbid.',
        footerCheck: 'Instant & Safe Bidding',
        footerChip: 'Auto Refund Outbid',
      },
      {
        step: '04',
        align: 'right',
        tag: 'STEP 04 • EVENTS',
        subLabel: 'Contests & Community Voting',
        title: 'Creative Events',
        description:
          'Join themed drawing contests hosted on the platform across 4 transparent stages: Artwork Submission, Blind Jury Scoring, Community Voting, and Leaderboard Reveal. Scores remain sealed until publication with formal dispute review.',
        footerCheck: 'Transparent Judging & Voting',
        footerChip: '4 Stages Contest',
      },
      {
        step: '05',
        align: 'left',
        tag: 'STEP 05 • ART TRADE',
        subLabel: '1-on-1 Artist Exchange',
        title: 'Art Trade',
        description:
          'Artists send 1-on-1 trade proposals with portfolio previews, agree on deadlines, and collaborate in a dedicated trade chatroom. Previews carry automatic watermarks upon upload; final high-res files unlock simultaneously only after both artists confirm receipt, backed by Admin arbitration if needed.',
        footerCheck: 'Simultaneous File Unlock',
        footerChip: 'Watermark Protected',
      },
      {
        step: '06',
        align: 'right',
        tag: 'STEP 06 • CREATOR STUDIO',
        subLabel: 'Open Your Studio & Slots',
        title: 'Become a Creator',
        description:
          'Build a verified artist profile, configure commission Rate Cards and add-ons, and manage your open waitlist slots. 100% of earnings are secured through milestone escrow with 24/7 VietQR bank withdrawals.',
        footerCheck: 'Earnings & Copyright Protection',
        footerChip: 'Payout VietQR 24/7',
      },
    ],
    faqTitle: 'Frequently Asked Questions & Legal Protection (FAQs)',
    faqSubtitle:
      'Summary of Workroom operating rules and Vietnamese legal frameworks covering intellectual property, consumer protection, e-transactions, e-commerce, personal data protection, and AI transparency (reference overview — verify official texts where required).',
    faqs: [
      {
        tag: 'IP Law 2022',
        question: 'How are copyright and commercial usage rights handled for commissioned art?',
        lead: 'Under the amended Vietnam Intellectual Property Law 2022 and DILLUSTRATION Creator Terms:',
        bullets: [
          {
            title: 'Moral Rights (Attribution):',
            detail:
              'Always remain with the original Creator. Clients must credit the artist when requireCredit is enabled in the artist terms and may never remove signatures or falsely claim authorship.',
          },
          {
            title: 'Economic Rights & License Scope:',
            detail:
              'Clients receive a license strictly matching the Personal or Commercial scope chosen on the order (livestreaming, YouTube, brand campaigns). Reselling raw files or sublicensing to third parties without agreement is strictly prohibited.',
          },
        ],
        defaultOpen: true,
      },
      {
        tag: 'Consumer Law 19/2023',
        question: 'How do escrow deposits, complaints, and Workroom cancellation rules work?',
        lead: 'Combining obligations under Vietnam Consumer Protection Law 19/2023/QH15 and Workroom rules confirmed by both parties:',
        bullets: [
          {
            title: 'Price Transparency & Complaint Acknowledgment (Law 19/2023/QH15):',
            detail:
              'Total order fees and escrow breakdowns are shown clearly before payment (Art. 21). The platform acknowledges disputes within 03 business days (Art. 31.2) and refunds unreleased escrow where violations are substantiated.',
          },
          {
            title: 'Workroom Operating Rules (agreed prior to checkout):',
            detail:
              'Orders under 2,000,000 VND fund 100% escrow upfront; orders from 2,000,000 VND fund stage-by-stage. Each milestone includes up to 3 free revisions; if a client does not respond within 72 hours after WIP submission, auto-approval applies per agreed terms (cancellation requests reviewed within 48h; late extension 24h).',
          },
        ],
      },
      {
        tag: 'E-Transactions 20/2023',
        question: 'Do Workroom logs and original file handover records have evidentiary value?',
        lead: 'Pursuant to Vietnam Law on Electronic Transactions 20/2023/QH15 (Arts. 8–12, 34–38):',
        bullets: [
          {
            title: 'Electronic Evidence Validity:',
            detail:
              'Brief details, artist terms frozen as a snapshot at order placement, explicit checkbox consent, chat logs, and WIP uploads are timestamped permanently as evidence during Admin dispute arbitration.',
          },
          {
            title: 'Secure Original File Handover:',
            detail:
              'Files sent inside chat are for discussion only; official deliverables must be submitted through milestone handover. Once 100% completed, signed original download links remain valid for 15 minutes per request and are stamped with Forensic Watermarking.',
          },
        ],
      },
      {
        tag: 'E-Commerce 122/2025',
        question: 'How do Auctions, Art Trades, and Contests comply with E-Commerce regulations?',
        lead: 'Aligned with Vietnam E-Commerce Law 122/2025/QH15 (Art. 11, Art. 17.4) and Decree 248/2026/ND-CP:',
        bullets: [
          {
            title: 'Online Dispute Channels & Creator Verification:',
            detail:
              'Creators applying to sell commissions undergo profile verification; users have dedicated online channels to submit issue reports and disputes across Workroom orders, Art Trades, and Events under Admin oversight (Art. 17.4). Operator and privacy disclosures remain publicly accessible.',
          },
          {
            title: 'Auction, Art Trade & Contest Fairness:',
            detail:
              'In SignalR auctions, deposits are refunded immediately when outbid. In Art Trades, previews are watermarked and source files unlock simultaneously only upon mutual approval. In Creative Events, Jury scores remain cryptographically sealed until public reveal.',
          },
        ],
      },
      {
        tag: 'PDPL 91/2025',
        question: 'How are personal data and payment details protected under Vietnam PDPL?',
        lead: 'Compliant with Vietnam Personal Data Protection Law 91/2025/QH15, Decree 356/2025/ND-CP, and Cybersecurity Law 116/2025/QH15:',
        bullets: [
          {
            title: 'Opt-in Consent & Sensitive Personal Data:',
            detail:
              'Registration consent checkboxes are never pre-ticked. Bank account / VietQR payout details qualify as sensitive personal data (Art. 4.1(i) Decree 356/2025) and are processed solely for payOS escrow/payouts. See full details in the Personal Data Protection Policy (/privacy).',
          },
          {
            title: 'Data Subject Rights & Statutory Response SLAs (Art. 5 Decree 356/2025):',
            detail:
              'Users can inspect, update, or deactivate accounts in /settings and submit access, consent withdrawal, or deletion requests via Support: guidance acknowledged within 02 business days; view/edit in 10–15 days; consent withdrawal in 15–20 days; deletion in 20–30 days.',
          },
        ],
      },
      {
        tag: 'AI Law 134/2025',
        question: 'What are the rules on AI transparency and preventing commission art from AI training?',
        lead: 'Distinguishing statutory AI labeling under Vietnam AI Law 134/2025/QH15 (Decree 142/2026/ND-CP) from Creator contract terms:',
        bullets: [
          {
            title: 'Statutory AI Disclosure & Labeling (Art. 11 Law 134/2025, Art. 18 Decree 142/2026):',
            detail:
              'Uploaded artworks pass AI detection moderation and receive transparent AI tags when applicable. The platform assistant clearly displays "Dillustration AI Assistant" so users distinguish it from human staff/Admin.',
          },
          {
            title: 'Civil Anti-AI Training Clause (Creator Terms):',
            detail:
              'Under default Creator Terms (prohibitAiTraining), clients and third parties may not feed commissioned artworks, WIP drafts, or source files into generative AI training datasets without the Creator’s explicit written consent.',
          },
        ],
      },
    ],
    supportAria: 'Platform information and support',
    supportTitle: 'About Platform & Support',
    supportIntro:
      'DILLUSTRATION connects digital artists and commissioners in Vietnam with standardized escrow commissions, live auctions, and copyright protection.',
    supportDetails: [
      { label: 'Escrow & Payouts:', value: 'payOS (VietQR 24/7) • 30–30–40 Milestones' },
      { label: 'Support Channel:', isSupportTrigger: true },
      { label: 'Personal Data:', href: '/privacy', linkText: 'Privacy Policy (/privacy) →' },
      { label: 'Operator:', value: 'DILLUSTRATION Team' },
      { label: 'Logo:', value: 'Buniré' },
    ],
    artistQuestion: 'Are you an artist?',
    artistCta: 'Open studio slots here →',
  },
};

function PaperclipDecor() {
  return (
    <div className={styles.cardClipAnchor} aria-hidden="true">
      <svg className={styles.cardClipSvg} viewBox="0 0 24 36" fill="none">
        <path
          d="M16 10 V24 C16 28.4183 12.4183 32 8 32 C3.58172 32 0 28.4183 0 24 V9 C0 4.02944 4.02944 0 9 0 C13.9706 0 18 4.02944 18 9 V23 C18 25.7614 15.7614 28 13 28 C10.2386 28 8 25.7614 8 23 V10"
          transform="translate(3, 2)"
          stroke="#98A2D8"
          strokeWidth="2.2"
          strokeLinecap="round"
        />
      </svg>
    </div>
  );
}

function DeskPropsUnderlay() {
  return (
    <>
      <div className={styles.deskTablet} aria-hidden="true">
        <div className={styles.tabletScreen}>
          <div className={styles.tabletTouchDial} />
          <svg className={styles.tabletSketchCurve} width="260" height="140" viewBox="0 0 260 140">
            <path d="M 30 110 C 80 20, 150 120, 230 30" />
            <circle cx="230" cy="30" r="4" fill="#A4ACDF" />
          </svg>
        </div>
        <div className={styles.tabletKeys}>
          <div className={styles.tabletKey} />
          <div className={styles.tabletKey} />
          <div className={styles.tabletKey} />
          <div className={styles.tabletKey} />
        </div>
      </div>

      <svg className={styles.deskStylus} viewBox="0 0 220 20" aria-hidden="true">
        <path d="M2 10 L18 5 L18 15 Z" fill="#98A2D8" />
        <rect x="18" y="4" width="160" height="12" rx="4" fill="var(--guide-pen-body)" />
        <rect x="70" y="6" width="32" height="3" rx="1.5" fill="var(--guide-pen-accent)" />
        <rect x="178" y="5" width="38" height="10" rx="5" fill="#4A548E" />
      </svg>
    </>
  );
}

/**
 * Toàn bộ màn hình Hướng dẫn nền tảng & Bảo hộ pháp lý Escrow (route /guide).
 */
export function PlatformGuideScreen() {
  const { lang } = useLanguage();
  const copy = GUIDE_COPY[lang];

  return (
    <div className={`${styles.guideWrapper} ${jetbrainsMono.variable}`} data-no-translate="true">
      <div className={styles.deskStage}>
        <div className={styles.guideFlowContainer}>
          {/* 1. TOP SECTION (HERO PANEL + TALKING BUBBLE + DESK TABLET UNDERLAY) */}
          <section className={styles.heroFlowPanel} aria-labelledby="guide-hero-title">
            <DeskPropsUnderlay />

            <div className={styles.heroFlowHeading}>
              <h1 id="guide-hero-title" className={styles.heroFlowTitle}>
                {copy.heroTitle}
              </h1>
              <p className={styles.heroFlowSub}>{copy.heroSub}</p>
            </div>

            <div className={styles.talkBubble}>
              <div className={styles.bubbleTailWrap} aria-hidden="true">
                <svg className={styles.bubbleTailSvg} viewBox="0 0 32 18">
                  <polygon className={styles.bubbleTailFill} points="4,17 14,1 26,17" />
                  <polyline className={styles.bubbleTailStroke} fill="none" points="4,17 14,1 26,17" />
                  <line className={styles.bubbleTailBase} x1="2" y1="17" x2="28" y2="17" />
                </svg>
              </div>

              <div className={styles.heroEscrowHead}>
                <ShieldCheck className={styles.heroEscrowIcon} aria-hidden="true" />
                <span>{copy.escrowTitle}</span>
                <span className={styles.bubbleSpeakerTag}>
                  <Sparkles size={12} aria-hidden="true" />
                  {copy.escrowTag}
                </span>
              </div>

              <p className={styles.heroEscrowDesc}>{copy.escrowDesc}</p>

              <div className={styles.trustBadgesRow}>
                {copy.trustPills.map((pill) => (
                  <span key={pill} className={styles.trustBadgeItem}>
                    <Sparkles size={13} className={styles.trustPlus} aria-hidden="true" />
                    {pill}
                  </span>
                ))}
              </div>
            </div>

            <div className={styles.heroFlowActions}>
              <Link href="/#artists" className={styles.btnBrandPrimary}>
                {copy.ctaDiscover}
              </Link>
              <Link href="/auctions" className={styles.btnGuideSecondary}>
                {copy.ctaAuctions}
              </Link>
              <a href="#guide-faq" className={styles.guideLinkSecondary}>
                {copy.ctaFaq}
              </a>
            </div>
          </section>

          {/* 2. MIDDLE SECTION: 6 CORE PLATFORM OPERATIONS (ZIG-ZAG TIMELINE) */}
          <section className={styles.timelineFlowPanel} aria-labelledby="guide-operations-title">
            <div className={styles.timelineFlowHeader}>
              <h2 id="guide-operations-title" className={styles.timelineFlowTitle}>
                {copy.opsTitle}
              </h2>
              <p className={styles.timelineFlowSub}>{copy.opsSub}</p>
            </div>

            <div className={styles.verticalZigzagTimeline}>
              <div className={styles.timelineCentralSpine} aria-hidden="true" />

              {copy.operations.map((item) => {
                const cardNode = (
                  <article
                    className={`${styles.timelineStepCard} ${
                      item.align === 'left' ? styles.cardTiltLeft : styles.cardTiltRight
                    }`}
                  >
                    <PaperclipDecor />

                    <div className={styles.cardStepHeader}>
                      <span className={styles.cardStepTag}>{item.tag}</span>
                      <span className={styles.cardStepSub}>{item.subLabel}</span>
                    </div>

                    <h3 className={styles.cardStepTitle}>{item.title}</h3>
                    <p className={styles.cardStepDesc}>{item.description}</p>

                    {item.showMilestones ? (
                      <div className={styles.cascadingFlowContainer}>
                        {copy.milestones.map((stage, idx) => (
                          <div key={stage.order}>
                            <div className={styles.cascadeStageRow}>
                              <span className={styles.cascadeStageBadge}>
                                <span className={styles.cascadeStepNum}>{stage.order}</span>
                                {stage.label}
                              </span>
                              <span className={styles.cascadePct}>{stage.pct}</span>
                            </div>
                            {idx < copy.milestones.length - 1 ? (
                              <div className={styles.cascadeConnectorDown} aria-hidden="true">
                                <ArrowDown size={11} />
                              </div>
                            ) : null}
                          </div>
                        ))}
                      </div>
                    ) : null}

                    <div className={styles.cardStepFooter}>
                      <span className={styles.footerChipPrimary}>
                        <Check size={14} aria-hidden="true" />
                        {item.footerCheck}
                      </span>
                      <span className={styles.footerChipSec}>{item.footerChip}</span>
                    </div>
                  </article>
                );

                return (
                  <div key={item.step} className={styles.timelineZigzagRow}>
                    {item.align === 'left' ? cardNode : <div className={styles.timelineSpacer} />}

                    <div className={styles.spineNodeAnchor}>
                      <div
                        className={`${styles.nodeConnectorArm} ${
                          item.align === 'left' ? styles.connectorLeft : styles.connectorRight
                        }`}
                        aria-hidden="true"
                      />
                      <div className={styles.spineNodeBadge}>{item.step}</div>
                    </div>

                    {item.align === 'right' ? cardNode : <div className={styles.timelineSpacer} />}
                  </div>
                );
              })}
            </div>
          </section>

          {/* 3. BOTTOM SECTION: FAQS ACCORDION & PLATFORM META HUB */}
          <section id="guide-faq" className={styles.faqHubSection} aria-labelledby="guide-faq-title">
            <div className={styles.faqFlatColumn}>
              <div className={styles.flatFaqHeader}>
                <h2 id="guide-faq-title" className={styles.flatFaqTitle}>
                  {copy.faqTitle}
                </h2>
                <p className={styles.flatFaqSubtitle}>{copy.faqSubtitle}</p>
              </div>

              <div className={styles.flatFaqList}>
                {copy.faqs.map((faq) => (
                  <details key={faq.tag} className={styles.flatFaqItem} open={faq.defaultOpen}>
                    <summary className={styles.flatFaqSummary}>
                      <div className={styles.flatFaqSummaryLeft}>
                        <span className={styles.faqTag}>{faq.tag}</span>
                        <span>{faq.question}</span>
                      </div>
                      <ChevronDown className={styles.faqChevron} aria-hidden="true" />
                    </summary>
                    <div className={styles.flatFaqBody}>
                      <strong>{faq.lead}</strong>
                      <ul>
                        {faq.bullets.map((bullet) => (
                          <li key={bullet.title}>
                            <strong>{bullet.title}</strong> {bullet.detail}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </details>
                ))}
              </div>
            </div>

            <aside className={styles.supportMetaSidebar} aria-label={copy.supportAria}>
              <div className={styles.supportMetaHead}>
                <h3 className={styles.supportMetaTitle}>
                  <Info className={styles.subCardIconSvg} aria-hidden="true" />
                  {copy.supportTitle}
                </h3>
                <span className={styles.subCardTag}>VN • 2026</span>
              </div>

              <div className={styles.supportMetaContent}>
                <p>
                  <strong>DILLUSTRATION</strong> {copy.supportIntro.replace(/^DILLUSTRATION\s*/, '')}
                </p>

                <div className={styles.supportMetaList}>
                  {copy.supportDetails.map((detail) => (
                    <div key={detail.label} className={styles.supportMetaItem}>
                      <span className={styles.supportMetaDot} aria-hidden="true">•</span>
                      <span>
                        <strong>{detail.label}</strong>{' '}
                        {detail.isSupportTrigger ? (
                          <SupportContactTrigger className={styles.supportMetaActionLink} />
                        ) : detail.href ? (
                          <Link href={detail.href} className={styles.supportMetaLink}>
                            {detail.linkText}
                          </Link>
                        ) : (
                          detail.value
                        )}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className={styles.supportMetaFooter}>
                <span>{copy.artistQuestion}</span>
                <Link href="/become-creator" className={styles.supportMetaLink}>
                  {copy.artistCta}
                </Link>
              </div>
            </aside>
          </section>
        </div>
      </div>
    </div>
  );
}
