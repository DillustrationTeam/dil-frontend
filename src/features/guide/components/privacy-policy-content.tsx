'use client';

import Link from 'next/link';
import { useLanguage } from '@/context/language-context';

const DATA_INVENTORY = {
  VIE: [
    {
      data: 'Họ tên, email, mật khẩu hoặc định danh Google OAuth',
      source: 'Form đăng ký (/register), đăng nhập (/login), thiết lập mật khẩu',
      purpose: 'Tạo tài khoản, xác thực đăng nhập, bảo mật 2 lớp (2FA) và gửi mã OTP khôi phục tài khoản',
    },
    {
      data: 'Ảnh đại diện, ảnh bìa, tiểu sử, bảng giá & tác phẩm',
      source: 'Cài đặt hồ sơ (/settings), Creator Studio (/creator/profile/edit)',
      purpose: 'Hiển thị hồ sơ công khai, giới thiệu dịch vụ vẽ và đăng tải tác phẩm trên sàn',
    },
    {
      data: 'Thông tin đối soát thanh toán, giao dịch ví & VietQR (Dữ liệu nhạy cảm)',
      source: 'Ký quỹ payOS, nạp/rút ví (/wallet, /deposit, /payout)',
      purpose: 'Tạm giữ ký quỹ theo chặng, hoàn tiền khi hủy/outbid và giải ngân thù lao cho họa sĩ',
    },
    {
      data: 'Brief đặt vẽ, tin nhắn Workroom/Art Trade, tệp WIP & file gốc',
      source: 'Workroom (/workroom/[id]), Art Trade (/art-trades/[id])',
      purpose: 'Thực hiện thỏa thuận đặt vẽ/trao đổi tranh và làm căn cứ đối soát khi có khiếu nại',
    },
    {
      data: 'Nội dung phản hồi báo lỗi và hội thoại Trợ lý AI',
      source: 'Hộp thoại Báo lỗi/Hỗ trợ, Trợ lý AI (/ai)',
      purpose: 'Kiểm tra sự cố kỹ thuật, phản hồi hỗ trợ và giải đáp hướng dẫn sử dụng nền tảng',
    },
  ],
  ENG: [
    {
      data: 'Full name, email, password, or Google OAuth identifier',
      source: 'Sign up (/register), sign in (/login), password setup forms',
      purpose: 'Account creation, authentication, 2FA security, and OTP account recovery',
    },
    {
      data: 'Avatar, cover image, bio, rate card & artworks',
      source: 'Profile Settings (/settings), Creator Studio (/creator/profile/edit)',
      purpose: 'Display public artist profiles, commission pricing, and marketplace artwork listings',
    },
    {
      data: 'Payment reconciliation, wallet transactions & VietQR bank details (Sensitive Data)',
      source: 'payOS escrow, wallet top-ups/payouts (/wallet, /deposit, /payout)',
      purpose: 'Hold milestone escrow, process outbid/order refunds, and disburse artist payouts',
    },
    {
      data: 'Commission briefs, Workroom/Art Trade messages, WIP & original files',
      source: 'Workroom (/workroom/[id]), Art Trade (/art-trades/[id])',
      purpose: 'Fulfill commission/trade agreements and retain records for dispute resolution',
    },
    {
      data: 'Bug report feedback and AI Assistant conversations',
      source: 'Support & Issue Report dialog, AI Assistant (/ai)',
      purpose: 'Diagnose technical issues, deliver support replies, and answer platform questions',
    },
  ],
};

const RESPONSE_TIMELINES = {
  VIE: [
    {
      action: 'Xác nhận đã tiếp nhận yêu cầu & hướng dẫn thủ tục',
      timeline: 'Trong vòng 02 ngày làm việc (áp dụng cho mọi yêu cầu về dữ liệu cá nhân)',
    },
    {
      action: 'Tiếp nhận phản ánh, khiếu nại dịch vụ thương mại điện tử',
      timeline: 'Thông báo đã tiếp nhận trong 03 ngày làm việc',
    },
    {
      action: 'Xem, chỉnh sửa hoặc cung cấp bản sao dữ liệu cá nhân',
      timeline: '10 ngày (15 ngày nếu cần bên thứ ba cùng thực hiện; có thể gia hạn 1 lần tối đa 10 ngày)',
    },
    {
      action: 'Rút lại sự đồng ý, hạn chế hoặc phản đối xử lý dữ liệu',
      timeline: '15 ngày (20 ngày nếu cần bên thứ ba ngừng xử lý; có thể gia hạn 1 lần tối đa 15 ngày)',
    },
    {
      action: 'Xóa dữ liệu cá nhân',
      timeline: '20 ngày (30 ngày nếu cần bên thứ ba cùng xóa; có thể gia hạn 1 lần tối đa 20 ngày)',
    },
  ],
  ENG: [
    {
      action: 'Acknowledge request receipt & procedure guidance',
      timeline: 'Within 02 business days (applies to all personal data requests)',
    },
    {
      action: 'Acknowledge e-commerce complaints and disputes',
      timeline: 'Acknowledgment notice within 03 business days',
    },
    {
      action: 'Access, rectify, or obtain a copy of personal data',
      timeline: '10 days (15 days if third parties are involved; extendable once up to 10 days)',
    },
    {
      action: 'Withdraw consent, restrict, or object to processing',
      timeline: '15 days (20 days if third-party processors must halt; extendable once up to 15 days)',
    },
    {
      action: 'Delete personal data',
      timeline: '20 days (30 days if third-party deletion is required; extendable once up to 20 days)',
    },
  ],
};

const THIRD_PARTIES = {
  VIE: [
    {
      party: 'payOS (Cổng thanh toán VietQR)',
      data: 'Mã đơn hàng, số tiền, thông tin đối soát thanh toán/giải ngân',
      purpose: 'Xử lý nạp ký quỹ và chi trả giao dịch tại Việt Nam',
    },
    {
      party: 'Google OAuth (nếu bạn chọn đăng nhập bằng Google)',
      data: 'Email, tên hiển thị, mã định danh tài khoản Google',
      purpose: 'Xác thực đăng nhập một lần',
    },
    {
      party: 'Dịch vụ lưu trữ ảnh (Cloudinary) & Nhà cung cấp mô hình AI',
      data: 'Hình ảnh tải lên, nội dung câu hỏi gửi cho Trợ lý AI',
      purpose: 'Lưu trữ tác phẩm/ảnh mẫu và trả lời hỏi đáp AI (có thể đặt máy chủ ở nước ngoài)',
    },
  ],
  ENG: [
    {
      party: 'payOS (VietQR Payment Gateway)',
      data: 'Order code, amount, payment/payout reconciliation metadata',
      purpose: 'Process escrow deposits and artist payouts in Vietnam',
    },
    {
      party: 'Google OAuth (if you choose Google Sign-In)',
      data: 'Email address, display name, Google account identifier',
      purpose: 'Single Sign-On (SSO) authentication',
    },
    {
      party: 'Media Storage (Cloudinary) & AI Model Providers',
      data: 'Uploaded artwork images, prompts sent to the AI Assistant',
      purpose: 'Store artwork/reference images and generate AI replies (servers may be located outside Vietnam)',
    },
  ],
};

/**
 * Nội dung song ngữ (VIE / ENG) cho trang Chính sách bảo vệ dữ liệu cá nhân (/privacy).
 */
export function PrivacyPolicyContent() {
  const { lang } = useLanguage();
  const isEng = lang === 'ENG';
  const inventory = DATA_INVENTORY[lang];
  const timelines = RESPONSE_TIMELINES[lang];
  const thirdParties = THIRD_PARTIES[lang];

  return (
    <div className="mx-auto max-w-4xl px-4 py-12 text-[#E4E1E5] sm:px-6" data-no-translate="true">
      <div className="mb-8 rounded-2xl border border-amber-400/25 bg-amber-400/10 p-4 text-xs leading-relaxed text-amber-100">
        {isEng ? (
          <>
            <strong>Notice (Reference Draft):</strong> This policy is compiled from the actual platform data schema on 12/11/2026 for user transparency. The platform operator should complete placeholders marked{' '}
            <code className="rounded bg-black/30 px-1.5 py-0.5 text-amber-200">[FILL: ...]</code> and obtain formal legal review prior to commercial launch.
          </>
        ) : (
          <>
            <strong>Lưu ý (Bản nháp tham khảo):</strong> Tài liệu này được tổng hợp từ cấu trúc dữ liệu thực tế trong mã nguồn ngày 12/11/2026 để minh bạch với người dùng. Chủ sở hữu nền tảng cần hoàn thiện các mục đánh dấu{' '}
            <code className="rounded bg-black/30 px-1.5 py-0.5 text-amber-200">[ĐIỀN: ...]</code> và tham vấn người có chuyên môn pháp lý trước khi công bố vận hành thương mại chính thức.
          </>
        )}
      </div>

      <header className="mb-10 border-b border-white/10 pb-6">
        <p className="text-xs font-bold uppercase tracking-widest text-[#A7ACD9]">
          {isEng
            ? 'Vietnam PDPL 91/2025/QH15 & Decree 356/2025/ND-CP'
            : 'Luật 91/2025/QH15 & Nghị định 356/2025/NĐ-CP'}
        </p>
        <h1 className="font-h1 mt-2 text-3xl font-extrabold tracking-tight text-white">
          {isEng ? 'Personal Data Protection Policy' : 'Chính sách bảo vệ dữ liệu cá nhân'}
        </h1>
        <p className="mt-2 text-sm text-[#C7C5CF]">
          {isEng
            ? 'Last updated: 12/11/2026 • Version: 1.0 (Draft)'
            : 'Cập nhật lần cuối: 12/11/2026 • Phiên bản: 1.0 (Bản nháp)'}
        </p>
      </header>

      <div className="space-y-10 text-sm leading-7 text-[#C7C5CF]">
        <section className="space-y-3">
          <h2 className="font-h1 text-xl font-bold text-white">
            {isEng ? '1. Data Controller' : '1. Đơn vị kiểm soát dữ liệu cá nhân'}
          </h2>
          <p>
            <strong className="text-white">DILLUSTRATION Team</strong>{' '}
            {isEng
              ? 'acts as the personal data controller for data collected through the DILLUSTRATION website. Full corporate particulars upon official launch:'
              : 'là bên kiểm soát dữ liệu cá nhân thu thập qua website DILLUSTRATION. Thông tin pháp nhân đầy đủ khi vận hành chính thức:'}
          </p>
          <ul className="list-disc space-y-1.5 pl-5">
            <li>
              <strong className="text-white">
                {isEng ? 'Legal Entity / Business Name:' : 'Tên pháp nhân / Hộ kinh doanh:'}
              </strong>{' '}
              {isEng ? '[FILL: Legal entity / owner name]' : '[ĐIỀN: Tên pháp nhân / chủ sở hữu]'}
            </li>
            <li>
              <strong className="text-white">
                {isEng ? 'Enterprise / Tax ID:' : 'Mã số doanh nghiệp / Mã số thuế:'}
              </strong>{' '}
              {isEng ? '[FILL: Registration / Tax Code]' : '[ĐIỀN: Mã số ĐKKD / MST]'}
            </li>
            <li>
              <strong className="text-white">
                {isEng ? 'Registered Address:' : 'Địa chỉ liên hệ:'}
              </strong>{' '}
              {isEng ? '[FILL: Official headquarters address]' : '[ĐIỀN: Địa chỉ trụ sở chính thức]'}
            </li>
            <li>
              <strong className="text-white">
                {isEng ? 'Request Channel:' : 'Kênh tiếp nhận yêu cầu:'}
              </strong>{' '}
              {isEng ? (
                <>
                  [FILL: Official contact email] or submit directly via the{' '}
                  <strong className="text-white">Support &amp; Issue Report</strong> dialog on the website.
                </>
              ) : (
                <>
                  [ĐIỀN: Email chính thức] hoặc gửi trực tiếp qua hộp thoại{' '}
                  <strong className="text-white">Hỗ trợ &amp; Báo cáo sự cố</strong> trên website.
                </>
              )}
            </li>
          </ul>
        </section>

        <section className="space-y-4">
          <h2 className="font-h1 text-xl font-bold text-white">
            {isEng ? '2. Data Collected & Processing Purposes' : '2. Dữ liệu thu thập và mục đích xử lý'}
          </h2>
          <p>
            {isEng
              ? 'We only collect data strictly necessary for active platform features and will not use it for unrelated purposes without your consent:'
              : 'Chúng tôi chỉ thu thập dữ liệu cần thiết cho các chức năng thực tế của nền tảng và không dùng cho mục đích khác nếu chưa có sự đồng ý của bạn:'}
          </p>
          <div className="overflow-x-auto rounded-2xl border border-white/10 bg-[#181B29]">
            <table className="w-full border-collapse text-left text-xs sm:text-sm">
              <thead>
                <tr className="border-b border-white/10 bg-white/[0.03] text-[#A7ACD9]">
                  <th className="p-3.5 font-bold">{isEng ? 'Data Category' : 'Loại dữ liệu'}</th>
                  <th className="p-3.5 font-bold">{isEng ? 'Collection Point' : 'Nơi thu thập'}</th>
                  <th className="p-3.5 font-bold">{isEng ? 'Purpose' : 'Mục đích sử dụng'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {inventory.map((row) => (
                  <tr key={row.data}>
                    <td className="p-3.5 font-medium text-white">{row.data}</td>
                    <td className="p-3.5 text-[#C7C5CF]">{row.source}</td>
                    <td className="p-3.5 text-[#C7C5CF]">{row.purpose}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="space-y-3">
          <h2 className="font-h1 text-xl font-bold text-white">
            {isEng ? '3. Sensitive Personal Data Processing' : '3. Xử lý dữ liệu cá nhân nhạy cảm'}
          </h2>
          <p>
            {isEng ? (
              <>
                Bank account / VietQR details used for deposits/payouts and identity verification data are classified as{' '}
                <strong className="text-white">sensitive personal data</strong> under Article 4.1 of Decree 356/2025/ND-CP. We process these details exclusively to fulfill escrow deposits, refunds, and payouts upon your explicit request.
              </>
            ) : (
              <>
                Thông tin tài khoản ngân hàng/VietQR dùng để đối soát nạp rút tiền và thông tin bảo mật định danh thuộc nhóm{' '}
                <strong className="text-white">dữ liệu cá nhân nhạy cảm</strong> theo khoản 1 Điều 4 Nghị định 356/2025/NĐ-CP. Chúng tôi chỉ xử lý dữ liệu này để thực hiện giao dịch ký quỹ, hoàn tiền và giải ngân thù lao theo đúng yêu cầu giao dịch của bạn.
              </>
            )}
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="font-h1 text-xl font-bold text-white">
            {isEng ? '4. Third-Party Sharing & Data Retention' : '4. Chia sẻ bên thứ ba & Lưu trữ'}
          </h2>
          <p>
            {isEng
              ? 'We do not sell your personal data. Certain technical operations require transmitting relevant fields to integrated service providers:'
              : 'Chúng tôi không mua bán dữ liệu cá nhân của bạn. Một số tác vụ kỹ thuật cần truyền dữ liệu tới các bên cung cấp dịch vụ tích hợp:'}
          </p>
          <div className="overflow-x-auto rounded-2xl border border-white/10 bg-[#181B29]">
            <table className="w-full border-collapse text-left text-xs sm:text-sm">
              <thead>
                <tr className="border-b border-white/10 bg-white/[0.03] text-[#A7ACD9]">
                  <th className="p-3.5 font-bold">{isEng ? 'Recipient' : 'Bên tiếp nhận'}</th>
                  <th className="p-3.5 font-bold">{isEng ? 'Relevant Data' : 'Dữ liệu liên quan'}</th>
                  <th className="p-3.5 font-bold">{isEng ? 'Purpose' : 'Mục đích'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {thirdParties.map((item) => (
                  <tr key={item.party}>
                    <td className="p-3.5 font-medium text-white">{item.party}</td>
                    <td className="p-3.5 text-[#C7C5CF]">{item.data}</td>
                    <td className="p-3.5 text-[#C7C5CF]">{item.purpose}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-xs text-[#919099]">
            {isEng
              ? 'Note: Using cloud storage, OAuth, or AI models hosted outside Vietnam falls under cross-border data transfer regulations (Article 20 of Law 91/2025/QH15). Post-closure data retention period: [FILL: Retention period / tax & accounting statutory period].'
              : 'Lưu ý: Khi sử dụng dịch vụ đám mây, xác thực hoặc mô hình AI có máy chủ đặt ngoài lãnh thổ Việt Nam, hoạt động này thuộc phạm vi chuyển dữ liệu xuyên biên giới theo Điều 20 Luật 91/2025/QH15. Thời hạn lưu trữ dữ liệu sau khi đóng tài khoản: [ĐIỀN: Thời hạn lưu trữ / quy định kế toán - thuế liên quan].'}
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="font-h1 text-xl font-bold text-white">
            {isEng ? '5. Your Rights & Statutory Response Timelines' : '5. Quyền của bạn & Thời hạn xử lý yêu cầu'}
          </h2>
          <p>
            {isEng ? (
              <>
                You have the right to be informed, consent, withdraw consent, access, rectify, request copies, restrict processing, or delete your personal data (Art. 4.1 Law 91/2025/QH15). You can update or deactivate your account in{' '}
                <Link href="/settings" className="font-semibold text-[#A7ACD9] underline hover:text-white">
                  Profile Settings (/settings)
                </Link>
                , or submit data requests via Support within statutory SLAs:
              </>
            ) : (
              <>
                Bạn có quyền được biết, đồng ý, rút lại sự đồng ý, xem, chỉnh sửa, yêu cầu cung cấp, hạn chế xử lý hoặc xóa dữ liệu cá nhân của mình (Điều 4 khoản 1 Luật 91/2025/QH15). Bạn có thể tự chỉnh sửa hồ sơ hoặc vô hiệu hóa tài khoản tại{' '}
                <Link href="/settings" className="font-semibold text-[#A7ACD9] underline hover:text-white">
                  Cài đặt hồ sơ (/settings)
                </Link>
                , hoặc gửi yêu cầu xóa/cung cấp dữ liệu qua kênh hỗ trợ để được xử lý đúng thời hạn luật định:
              </>
            )}
          </p>
          <ul className="space-y-2 rounded-2xl border border-white/10 bg-[#181B29] p-5 text-xs sm:text-sm">
            {timelines.map((item) => (
              <li key={item.action} className="flex flex-col justify-between gap-1 border-b border-white/10 pb-2 last:border-0 last:pb-0 sm:flex-row sm:gap-4">
                <span className="font-semibold text-white">{item.action}:</span>
                <span className="text-[#A7ACD9]">{item.timeline}</span>
              </li>
            ))}
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="font-h1 text-xl font-bold text-white">
            {isEng ? '6. Browser Storage & Incident Notification' : '6. Phiên đăng nhập & Thông báo sự cố'}
          </h2>
          <p>
            {isEng ? (
              <>
                This website uses browser storage (<code className="rounded bg-white/10 px-1.5 py-0.5 text-xs">localStorage</code>) strictly for essential login sessions and language preferences. In the event of a personal data breach, the operator notifies the competent authority within <strong className="text-white">72 hours</strong> of discovery pursuant to Article 23.1 of Law 91/2025/QH15.
              </>
            ) : (
              <>
                Trang web hiện sử dụng bộ nhớ trình duyệt (<code className="rounded bg-white/10 px-1.5 py-0.5 text-xs">localStorage</code>) cho mục đích thiết yếu là duy trì phiên đăng nhập và tùy chọn ngôn ngữ/giao diện. Nếu xảy ra sự cố lộ, mất dữ liệu cá nhân, đơn vị vận hành thực hiện thông báo cho cơ quan chuyên trách chậm nhất <strong className="text-white">72 giờ</strong> kể từ khi phát hiện theo Điều 23 khoản 1 Luật 91/2025/QH15.
              </>
            )}
          </p>
        </section>
      </div>

      <div className="mt-10 flex flex-wrap items-center justify-between gap-4 border-t border-white/10 pt-6 text-sm">
        <Link href="/guide" className="font-semibold text-[#A7ACD9] hover:underline">
          {isEng ? '← Back to Guide' : '← Quay lại trang Hướng dẫn'}
        </Link>
        <Link href="/register" className="font-semibold text-[#A7ACD9] hover:underline">
          {isEng ? 'Go to Registration →' : 'Đi tới Đăng ký tài khoản →'}
        </Link>
      </div>
    </div>
  );
}
