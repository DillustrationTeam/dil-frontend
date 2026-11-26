import { BugReportFloatingButton } from '@/components/feedback/BugReportFloatingButton';
import { FloatingUtilitiesDock } from '@/components/feedback/FloatingUtilitiesDock';
import type { Metadata } from "next";
import { Be_Vietnam_Pro, Fraunces, Playfair_Display } from "next/font/google";
import { GoogleOAuthProvider } from "@react-oauth/google";
import { LanguageProvider } from "@/context/language-context";
import { AiAssistantLauncher } from "@/features/navigation";
import { AppToaster } from "@/components/hover-fade-toast";
import { ScrollProgress } from "@/components/motion";
import "./globals.css";

const GOOGLE_CLIENT_ID =
  process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || "1234567890-dummyid.apps.googleusercontent.com";

/**
 * Font tiêu đề: Fraunces — serif high-contrast có trục optical size.
 *
 * Chọn theo hệ "INK & VERMILION" của `Docs/UI-UX/dillustration-redesign.html`:
 * ở cỡ 68px nét mảnh như chữ in letterpress, ở cỡ 17px nét dày lên nên caption
 * vẫn đọc được. Subset `vietnamese` có sẵn nên chữ ẩ ữ ạ không rơi về font hệ thống
 * (đúng lỗi Sora trước đây). Fraunces là variable font: không truyền `weight`,
 * chỉ khai báo trục `opsz` để next/font sinh đúng @font-face.
 */
const headingFont = Fraunces({
  subsets: ["latin", "vietnamese"],
  axes: ["opsz"],
  variable: "--font-heading",
  display: "swap",
});

/**
 * Font UI: Inter — grotesque trung tính, số tabular, tốt ở 14–16px.
 * Cũng có subset `vietnamese`. Đây là mặt chữ đứng sau Fraunces, không tranh chỗ.
 */
const bodyFont = Be_Vietnam_Pro({
  subsets: ["latin", "vietnamese"],
  weight: ["300", "400", "500", "600"],
  variable: "--font-body-grotesk",
  display: "swap",
});

/**
 * Wordmark: Playfair Display italic — serif tương phản cao, dáng nghiêng gần với
 * logo gốc (chữ thường, ascender cao, chấm son bên phải).
 */
const wordmarkFont = Playfair_Display({
  subsets: ["latin"],
  style: ["italic"],
  weight: ["500", "600", "700"],
  variable: "--font-wordmark",
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
      data-theme="paper"
      suppressHydrationWarning
      className={`h-full antialiased ${headingFont.variable} ${bodyFont.variable} ${wordmarkFont.variable}`}
    >
      <head>
        {/* Theme: chạy TRƯỚC khi paint để không nháy nền sáng rồi mới tối */}
        <script
          dangerouslySetInnerHTML={{
            __html:
              "(function(){try{var t=localStorage.getItem('dil-theme');if(t==='ink'||t==='paper'){document.documentElement.dataset.theme=t;}}catch(e){}})();",
          }}
        />
      </head>
      <body className="min-h-full flex flex-col text-[#241F1A]">
        <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
          <LanguageProvider>
            <ScrollProgress />
            {children}
            <FloatingUtilitiesDock>
              <AiAssistantLauncher />
              <BugReportFloatingButton />
            </FloatingUtilitiesDock>
            <AppToaster />
          </LanguageProvider>
        </GoogleOAuthProvider>
      </body>
    </html>
  );
}
