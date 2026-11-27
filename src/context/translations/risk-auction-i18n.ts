/**
 * VI → EN cho module "AI Bid Fraud Detection" (hàng chờ rủi ro, phiếu kiểm duyệt, hộp xác nhận).
 *
 * VÌ SAO tách file riêng thay vì nhồi vào `vie-to-eng.ts` (2300 dòng): module này có hai loại chuỗi
 * khác hẳn nhau —
 *   1. chuỗi UI cố định: tra từ điển là xong;
 *   2. chuỗi do BACKEND sinh ra (nhãn mức rủi ro, nhãn dấu hiệu, câu bằng chứng có số liệu, câu tóm
 *      tắt) — không thể tra từ điển vì mỗi câu có số/tên khác nhau, phải dịch bằng mẫu (regex).
 * Gom cả hai vào một chỗ để lần sau thêm rule mới chỉ phải sửa một file.
 */

/** Bản đồ chuỗi UI cố định. Khoá là chuỗi tiếng Việt đúng như hiển thị. */
export const riskAuctionVieToEngMap: Record<string, string> = {
  // ---- trang hàng chờ ----
  'Kiểm duyệt đấu giá': 'Auction moderation',
  'Hàng chờ rủi ro': 'Risk queue',
  'Phiên bị bộ phát hiện gian lận gắn cờ, xếp theo điểm rủi ro. Mở phiếu để xem bằng chứng rồi quyết định bỏ qua hoặc xác nhận.':
    'Auctions flagged by the fraud detector, sorted by risk score. Open a sheet to review the evidence, then dismiss or confirm.',
  'Chờ xem': 'Pending',
  'Đang xem': 'In review',
  'Đã bỏ qua': 'Dismissed',
  'Đã xác nhận': 'Confirmed',
  'Tất cả': 'All',
  'Tất cả mức': 'All levels',
  'Điểm cao → thấp': 'Score: high → low',
  'Điểm thấp → cao': 'Score: low → high',
  'Quét lại hàng chờ': 'Refresh queue',
  'Quét lại ngay': 'Rescan now',
  'Điểm': 'Score',
  'Dấu hiệu': 'Signals',
  'Bid cuối': 'Last bid',
  'Phát hiện': 'Detected',
  'Thao tác': 'Actions',
  'Xem phiếu': 'View sheet',
  'Tải thêm': 'Load more',
  'Đang tải thêm…': 'Loading more…',
  'Đang tải hàng chờ rủi ro': 'Loading risk queue',
  'Không có phiên nào cần kiểm tra': 'No auctions need review',
  'Hàng chờ tự làm mới mỗi 5 phút. Bạn có thể quét lại ngay nếu vừa chốt phiên.':
    'The queue refreshes every 5 minutes. Rescan now if a session just closed.',
  'vừa xong': 'just now',
  'phút trước': 'minutes ago',
  'giờ trước': 'hours ago',
  'ngày trước': 'days ago',

  // ---- phiếu kiểm duyệt ----
  'Phiếu kiểm duyệt rủi ro': 'Risk review sheet',
  'Đóng phiếu kiểm duyệt': 'Close risk sheet',
  'Vì sao bị gắn cờ': 'Why it was flagged',
  'Bằng chứng đã ghi nhận': 'Recorded evidence',
  'Chưa ghi nhận dấu hiệu nào.': 'No signals recorded.',
  'dấu hiệu': 'signals',
  'Ghi chú kiểm duyệt': 'Moderation note',
  'Ví dụ: hai tài khoản dùng chung IP văn phòng, đã xác minh với người bán.':
    'Example: two accounts share an office IP, verified with the seller.',
  'Bắt buộc khi xác nhận gian lận (ít nhất 10 ký tự).': 'Required to confirm fraud (at least 10 characters).',
  'Nhận phiếu': 'Claim sheet',
  'Đang nhận…': 'Claiming…',
  'Nhả phiếu': 'Release sheet',
  'Đang nhả…': 'Releasing…',
  'Bỏ qua phiên này': 'Dismiss this auction',
  'Xác nhận gian lận': 'Confirm fraud',
  'Bạn đang xem phiếu này': 'You are reviewing this sheet',
  'Đang xem bởi': 'Being reviewed by',
  'một kiểm duyệt viên': 'another moderator',
  'Phiếu tự nhả về hàng chờ nếu không có quyết định trong 30 phút':
    'The sheet returns to the queue if no decision is made within 30 minutes',
  'Đã bỏ qua cảnh báo': 'Alert dismissed',
  'Đã xác nhận gian lận': 'Fraud confirmed',
  'Không có ghi chú.': 'No note.',
  'Phiên đã bị huỷ và toàn bộ tiền cọc đã hoàn về ví người tham gia.':
    'The auction was cancelled and all held deposits were refunded to the participants.',
  'Phiên đã kết thúc trước quyết định này nên không huỷ lại; cọc xử lý theo quy trình khiếu nại.':
    'The auction had already ended before this decision, so it was not cancelled again; deposits follow the dispute process.',
  'Người bán đã được thông báo phiên tiếp tục bình thường và không có vi phạm.':
    'The seller was notified that the auction continues normally with no violation.',
  'Phiếu đã đóng. Mở lại phiên sẽ tạo phiếu mới nếu có dấu hiệu mới.':
    'This sheet is closed. Reopening the auction creates a new sheet if new signals appear.',
  'Diễn biến đặt giá': 'Bid timeline',
  'Quét gần nhất': 'Last scan',
  'Quét lại phiên này': 'Rescan this auction',
  'Người kiểm duyệt': 'Reviewer',
  'Người đấu giá': 'Bidder',
  'Dấu thời gian': 'Time',
  'Xử lý': 'Actions',
  'Đóng': 'Close',

  // ---- hộp xác nhận ----
  'Xác nhận quyết định': 'Confirm decision',
  'Xác nhận gian lận cho phiên này?': 'Confirm fraud for this auction?',
  'Bỏ qua cảnh báo của phiên này?': 'Dismiss the alert for this auction?',
  'Phiên sẽ bị huỷ và toàn bộ tiền cọc đang giữ của người tham gia được hoàn về ví. Quyết định lưu kèm tên bạn.':
    'The auction will be cancelled and every held deposit refunded to the bidders. Your name is saved with the decision.',
  'Cảnh báo sẽ đóng lại, phiên tiếp tục nhận đặt giá bình thường và người bán được thông báo. Lý do bạn ghi sẽ được lưu để người sau đọc.':
    'The alert closes, the auction keeps taking bids as usual and the seller is notified. Your note is saved for the next reviewer.',
  'Bỏ qua cảnh báo': 'Dismiss alert',
  'Đang lưu…': 'Saving…',
  'Số dấu hiệu': 'Signal count',
  'Ghi chú': 'Note',
  'Điểm rủi ro': 'Risk score',

  // ---- strip trên trang chi tiết + thẻ phía người bán ----
  'Mở phiếu kiểm duyệt': 'Open review sheet',
  'Phiên đang được xem xét': 'Auction under review',
  '1 phiên của bạn đang được xem xét thêm': '1 of your auctions is under extra review',
  'Bộ phận kiểm duyệt đang xem lại các phiên dưới đây. Bạn không cần làm gì lúc này; phiên vẫn chạy bình thường.':
    'Moderation is reviewing the auctions below. You do not need to do anything; they keep running normally.',

  // ---- banner trên trang chi tiết phiên (component này viết chuỗi trực tiếp, không qua t()) ----
  'Phiên đã bị huỷ': 'Auction cancelled',
  'Phiên tạm dừng nhận giá': 'Bidding paused',
  'Phiên đã bị huỷ do kiểm duyệt xác nhận gian lận. Tiền cọc đã được hoàn về ví.':
    'This auction was cancelled after moderation confirmed fraud. Deposits were refunded to the bidders.',
  'Phiên đang tạm dừng nhận giá do kiểm duyệt xác nhận có dấu hiệu gian lận.':
    'Bidding is paused while moderation reviews a suspected fraud signal.',
  'Kiểm duyệt đang xử lý vi phạm của phiên này. Bạn chưa thể đặt giá.':
    'Moderation is handling a violation on this auction. You cannot bid right now.',

  // ---- nhãn mức rủi ro (BE trả về) ----
  'Nghiêm trọng': 'Critical',
  'Cao': 'High',
  'Vừa': 'Medium',
  'Thấp': 'Low',

  // ---- nhãn dấu hiệu (BE trả về) ----
  'Tài khoản trùng thiết bị với người bán': 'Account shares a device with the seller',
  'Nhiều tài khoản dùng chung thiết bị': 'Multiple accounts share a device',
  'Nhiều tài khoản đấu dồn dập trong thời gian ngắn': 'Several accounts bidding in a burst',
  'Tăng giá quá nhanh': 'Bidding too fast',
  'Nhảy giá bất thường': 'Unusual price jump',
  'Tự đẩy giá theo bước': 'Self-driven price ladder',
  'Từng thắng mà không thanh toán': 'Won without paying before',
  'Tỉ lệ bỏ thanh toán cao': 'High non-payment rate',
  'Hai tài khoản qua lại đẩy giá': 'Two accounts outbidding each other',
  'Tường giá tự động': 'Auto-bid wall',
  'Tài khoản mới đấu dồn dập': 'New account bidding aggressively',

  // ---- toast / lỗi ----
  'Bạn đang xem phiếu này. Phiếu tự nhả sau 30 phút nếu chưa quyết định.':
    'You are reviewing this sheet. It returns to the queue after 30 minutes without a decision.',
  'Đã nhả phiếu về hàng chờ.': 'Sheet returned to the queue.',
  'Đã xác nhận gian lận: phiên bị huỷ, tiền cọc đã hoàn về ví người tham gia và người bán đã được báo.':
    'Fraud confirmed: the auction was cancelled, deposits refunded and the seller notified.',
  'Đã bỏ qua cảnh báo: phiên tiếp tục nhận đặt giá và người bán đã được báo.':
    'Alert dismissed: the auction keeps taking bids and the seller was notified.',
  'Không lưu được quyết định.': 'Could not save the decision.',
  'Không nhả được phiếu.': 'Could not release the sheet.',
  'Không nhận được phiếu này.': 'Could not claim this sheet.',
  'Không quét lại được phiên này.': 'Could not rescan this auction.',
  'Không tải được hàng chờ rủi ro.': 'Could not load the risk queue.',
  'Không tải được phiếu rủi ro.': 'Could not load the risk sheet.',
};

/** "người đấu giá #3" / "người bán" → tiếng Anh, dùng lại cho mọi câu bằng chứng. */
function translateActors(text: string): string {
  return text
    .replace(/người đấu giá #(\d+)/g, 'bidder #$1')
    .replace(/người bán/g, 'the seller')
    .replace(/một kiểm duyệt viên/g, 'another moderator');
}

/**
 * Dịch từng nhãn dấu hiệu trong danh sách của câu tóm tắt; nhãn nào không có trong từ điển thì
 * giữ nguyên (thà lẫn một nhãn còn hơn làm hỏng cả câu).
 */
function translateLabels(list: string): string {
  // Hàng chờ cắt bớt câu tóm tắt bằng "…" và backend luôn kết câu bằng ".", nên nhãn cuối có thể
  // dính dấu câu — phải tách ra trước khi tra từ điển, nếu không nhãn cuối luôn trượt.
  const suffix = list.match(/(\s*(?:\.\.\.|…)|\.)$/)?.[1] ?? '';
  const body = suffix ? list.slice(0, list.length - suffix.length) : list;

  const translated = body
    .split(', ')
    .map((rawLabel) => {
      const label = rawLabel.trim();
      const exact = riskAuctionVieToEngMap[label];
      if (exact) {
        return exact;
      }

      // Nhãn bị cắt giữa từ: "Hai tài khoản qua lại đẩ" vẫn là tiền tố của khoá đầy đủ.
      const prefixKey = Object.keys(riskAuctionVieToEngMap).find((key) => key.startsWith(label));
      if (prefixKey && label.length >= 12) {
        return riskAuctionVieToEngMap[prefixKey];
      }

      return translateActors(label);
    })
    .join(', ');

  return translated + suffix;
}

/**
 * Dịch câu do BACKEND sinh ra (bằng chứng, tóm tắt, thông báo có số liệu).
 * Trả `null` khi không khớp mẫu nào để hàm gọi rơi về từ điển thường.
 *
 * Thứ tự quan trọng: mẫu cụ thể hơn phải đứng trước (BidBurstCluster trước BidVelocity, vì câu của
 * burst cũng bắt đầu bằng "N lượt ...").
 */
export function translateRiskSentence(text: string): string | null {
  // Câu tóm tắt của backend có thể gồm NHIỀU câu ("… dấu hiệu: A, B, C. Nhiều dấu hiệu cùng lúc nên
  // cộng thêm 10 điểm."). Tách theo ". " rồi dịch từng câu, nếu không thì mẫu danh sách sẽ nuốt luôn
  // câu thứ hai vào danh sách nhãn và cả hai câu đều không dịch được.
  if (text.includes('. ')) {
    const sentences = text.split('. ');
    // Câu nào không khớp mẫu thì GIỮ NGUYÊN. Nếu để null lọt vào rồi join, câu đã dịch xong sẽ bị
    // ghi đè thành rỗng khi observer dịch lại lần hai (đã từng ra đúng một dấu ".").
    const translated = sentences.map((sentence, index) => translateSingleSentence(sentence) ?? sentences[index]);
    if (translated.some((value, index) => value !== sentences[index])) {
      return translated.join('. ');
    }

    return null;
  }

  return translateSingleSentence(text);
}

function translateSingleSentence(input: string): string | null {
  const text = input.trim();
  const rules: Array<[RegExp, (...m: string[]) => string]> = [
    // bằng chứng: cụm dồn dập nhiều tài khoản
    [
      /^(\d+) lượt trong ([\d.,]+) giây bởi (\d+) tài khoản, cách nhau trung bình ([\d.,]+) giây$/,
      (_m, n, span, accounts, gap) =>
        `${n} bids in ${span}s from ${accounts} accounts, ${gap}s apart on average`,
    ],
    // bằng chứng: tốc độ đặt giá
    [
      /^(\d+) lượt đặt giá trong ([\d.,]+) giây bởi (.+)$/,
      (_m, n, span, who) => `${n} bids in ${span}s by ${translateActors(who)}`,
    ],
    // bằng chứng: dùng chung thiết bị
    [
      /^Dùng chung IP (\S+) giữa (.+) và (.+?)( \(cùng trình duyệt\))?$/,
      (_m, ip, left, right, sameBrowser) =>
        `Shared IP ${ip} between ${translateActors(left)} and ${translateActors(right)}`
        + (sameBrowser ? ' (same browser)' : ''),
    ],
    // bằng chứng: trùng thiết bị với người bán
    [
      /^(.+?) dùng chung IP (\S+) với người bán$/,
      (_m, who, ip) => `${translateActors(who)} shares IP ${ip} with the seller`,
    ],
    // bằng chứng: nhảy giá
    [
      /^Nhảy giá ([\d.,]+) so với mức trước ([\d.,]+) bởi (.+)$/,
      (_m, delta, previous, who) => `Price jump of ${delta} from ${previous} by ${translateActors(who)}`,
    ],
    // bằng chứng: thang giá tự đẩy
    [
      /^(\d+) lượt liên tiếp, mỗi lượt đúng một bước giá, bởi (.+)$/,
      (_m, n, who) => `${n} consecutive one-step bids by ${translateActors(who)}`,
    ],
    // bằng chứng: tường giá tự động
    [
      /^(\d+) trần đặt giá tự động nằm trong ([\d.,]+)% \(([\d.,]+)-([\d.,]+)\), lượt cuối bởi (.+)$/,
      (_m, n, spread, min, max, who) =>
        `${n} auto-bid ceilings within ${spread}% (${min}-${max}), last one by ${translateActors(who)}`,
    ],
    // bằng chứng: từng thắng mà không thanh toán
    [
      /^(.+?) đã để (\d+) phiên thắng quá hạn thanh toán$/,
      (_m, who, n) => `${translateActors(who)} let ${n} won auctions expire unpaid`,
    ],
    // bằng chứng: tỉ lệ bỏ thanh toán
    [
      /^(.+?): (\d+)\/(\d+) phiên thắng không thanh toán \((.+)\)$/,
      (_m, who, unpaid, won, rate) => `${translateActors(who)}: ${unpaid}/${won} wins unpaid (${rate})`,
    ],
    // bằng chứng: hai tài khoản qua lại
    [
      /^(.+?) và (.+?) qua lại (\d+) lượt đặt giá$/,
      (_m, left, right, n) => `${translateActors(left)} and ${translateActors(right)} traded ${n} bids back and forth`,
    ],
    // bằng chứng: tài khoản mới
    [
      /^Tài khoản của (.+?) mới (\d+) giờ nhưng đã đặt (\d+) lượt$/,
      (_m, who, hours, n) =>
        `${translateActors(who)} has an account ${hours}h old but already placed ${n} bids`,
    ],
    // tóm tắt: "N dấu hiệu: A, B, C" — danh sách là NHÃN dấu hiệu, phải dịch từng nhãn trước,
    // nếu chỉ đổi phần "N dấu hiệu" thì câu tiếng Anh còn lẫn các nhãn tiếng Việt ở giữa.
    [
      /^(\d+) dấu hiệu: (.+)$/,
      (_m, n, list) => `${n} signals: ${translateLabels(list)}`,
    ],
    // tóm tắt: câu cộng điểm leo thang
    [
      /^Nhiều dấu hiệu cùng lúc nên cộng thêm ([\d.,]+) điểm\.$/,
      (_m, points) => `Multiple signals at once, so ${points} extra points were added.`,
    ],
    // toast quét lại
    [
      /^Đã quét lại: ([\d.,]+)\/100 · (\d+) dấu hiệu\.$/,
      (_m, score, n) => `Rescanned: ${score}/100 · ${n} signals.`,
    ],
    // thẻ phía người bán: "N phiên của bạn đang được xem xét thêm"
    [
      /^(\d+) phiên của bạn đang được xem xét thêm$/,
      (_m, n) => `${n} of your auctions are under extra review`,
    ],
  ];

  for (const [pattern, build] of rules) {
    const match = text.match(pattern);
    if (match) {
      return build(...(match as unknown as string[]));
    }
  }

  return null;
}
