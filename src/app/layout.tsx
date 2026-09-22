import type { Metadata } from "next";
import { Toaster } from "react-hot-toast";
import "./globals.css";

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
      <body className="min-h-full flex flex-col bg-[#1F2335] text-[#E4E1E5]">
        {children}
        <Toaster position="top-right" toastOptions={{ duration: 4000 }} />
      </body>
    </html>
  );
}
