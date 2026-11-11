import { BugReportFloatingButton } from '@/components/feedback/BugReportFloatingButton';
import type { Metadata } from "next";
import { Be_Vietnam_Pro, Space_Grotesk } from "next/font/google";
import { GoogleOAuthProvider } from "@react-oauth/google";
import { LanguageProvider } from "@/context/language-context";
import { AiAssistantLauncher } from "@/features/navigation";
import { AppToaster } from "@/components/hover-fade-toast";
import "./globals.css";

const GOOGLE_CLIENT_ID =
  process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || "1234567890-dummyid.apps.googleusercontent.com";

/**
 * Font tiêu đề: Be Vietnam Pro — bộ glyph tiếng Việt đầy đủ (subset `vietnamese`).
 *
 * VÌ SAO đổi khỏi Sora: Sora KHÔNG có subset tiếng Việt, chỉ có latin + latin-ext.
 * Các ký tự như ẩ ở ữ ạ (U+1EA0–U+1EF9) không nằm trong hai subset đó nên trình duyệt
 * phải fallback từng ký tự sang font hệ thống → chữ có dấu bị lệch nét, sai weight,
 * đúng như lỗi hiển thị trước đây. Space Grotesk thì vẫn giữ cho phần body vì đã có
 * subset tiếng Việt.
 */
const headingFont = Be_Vietnam_Pro({
  subsets: ["latin", "vietnamese"],
  weight: ["400", "500", "600", "700", "800", "900"],
  variable: "--font-heading",
  display: "swap",
});

const bodyFont = Space_Grotesk({
  subsets: ["latin", "vietnamese"],
  weight: ["300", "400", "500", "700"],
  variable: "--font-body-grotesk",
  display: "swap",
});

export const metadata: Metadata = {
  title: "dillustration | Digital Gallery & Art Marketplace",
  description: "Enter the digital gallery of etherealism and commission unique digital artwork.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="vi"
      className={`dark h-full antialiased ${headingFont.variable} ${bodyFont.variable}`}
    >
      <head>
        {/* eslint-disable-next-line @next/next/no-page-custom-font -- rule này viết cho Pages Router
            (`pages/_document.js`). Ở App Router, `layout.tsx` bọc MỌI trang nên font chỉ tải một lần;
            Material Symbols là font biến thiên có trục FILL/GRAD nên `next/font/google` không hỗ trợ. */}
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200&display=swap"
        />
      </head>
      <body className="min-h-full flex flex-col text-[#E4E1E5]">
        <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
          <LanguageProvider>
            {children}
            <AiAssistantLauncher />
            <BugReportFloatingButton />
            <AppToaster />
          </LanguageProvider>
        </GoogleOAuthProvider>
      </body>
    </html>
  );
}
