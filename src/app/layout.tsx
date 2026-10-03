import type { Metadata } from "next";
import { GoogleOAuthProvider } from "@react-oauth/google";
import { LanguageProvider } from "@/context/language-context";
import { AiAssistantLauncher } from "@/features/navigation";
import { AppToaster } from "@/components/hover-fade-toast";
import "./globals.css";

const GOOGLE_CLIENT_ID =
  process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || "1234567890-dummyid.apps.googleusercontent.com";

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
    <html lang="en" className="dark h-full antialiased">
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
            <AppToaster />
          </LanguageProvider>
        </GoogleOAuthProvider>
      </body>
    </html>
  );
}
