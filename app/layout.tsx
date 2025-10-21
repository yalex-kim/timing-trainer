import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "타이밍 훈련 프로그램",
  description: "시청각 타이밍 훈련용 웹 애플리케이션",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
