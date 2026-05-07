import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "VLESS Clash Builder",
  description: "Convert VLESS links into a Clash/Mihomo subscription with bundled rules.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}
