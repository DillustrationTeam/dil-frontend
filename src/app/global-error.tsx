'use client';

import Link from 'next/link';

/**
 * Lỗi mức cao nhất: xảy ra khi chính root layout không dựng được.
 * Next yêu cầu file này tự render <html>/<body> và KHÔNG dùng được CSS của app
 * (globals.css do root layout nạp), nên toàn bộ style ở đây là inline.
 */
export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html lang="vi">
      <body
        style={{
          margin: 0,
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#F7F2E9',
          color: '#241F1A',
          fontFamily: 'system-ui, -apple-system, "Segoe UI", Roboto, Arial, sans-serif',
          padding: '24px',
        }}
      >
        <div
          style={{
            width: '100%',
            maxWidth: '32rem',
            background: '#FFFCF6',
            border: '1px solid rgba(34,30,26,0.12)',
            borderRadius: 20,
            padding: '40px 32px',
            textAlign: 'center',
            boxShadow: '0 30px 70px -52px rgba(74,52,30,0.9)',
          }}
        >
          <p style={{ margin: 0, fontSize: 11, letterSpacing: '0.22em', textTransform: 'uppercase', color: '#8C7A63' }}>
            Lỗi nghiêm trọng
          </p>
          <h1 style={{ margin: '10px 0 0', fontSize: 24, lineHeight: 1.2, fontFamily: 'Georgia, serif' }}>
            Ứng dụng không khởi động được
          </h1>
          <p style={{ margin: '12px 0 0', fontSize: 14, lineHeight: 1.6, color: '#6E6459' }}>
            Giao diện gặp lỗi khi nạp cấu hình chung. Hãy tải lại trang; nếu vẫn lỗi, gửi mã bên dưới cho bộ phận hỗ trợ.
          </p>
          <div style={{ marginTop: 24, display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            <button
              type="button"
              onClick={reset}
              style={{
                minHeight: 44,
                padding: '0 24px',
                borderRadius: 999,
                border: 0,
                background: '#B24A26',
                color: '#FFFCF6',
                fontSize: 14,
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Thử lại
            </button>
            <Link
              href="/"
              style={{
                minHeight: 44,
                display: 'inline-flex',
                alignItems: 'center',
                padding: '0 24px',
                borderRadius: 999,
                border: '1px solid rgba(34,30,26,0.15)',
                color: '#241F1A',
                fontSize: 14,
                textDecoration: 'none',
              }}
            >
              Về trang chủ
            </Link>
          </div>
          {error.digest ? (
            <p style={{ margin: '20px 0 0', fontSize: 12, color: '#8C7A63' }}>Mã lỗi: {error.digest}</p>
          ) : null}
        </div>
      </body>
    </html>
  );
}
