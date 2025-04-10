import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "ココパズル | ここだけの自分のパズルを作ろう",
  description: "お気に入りの画像からパズルを作成して、タイムを競おう！",
  openGraph: {
    title: "ココパズル | ここだけの自分のパズルを作ろう",
    description: "お気に入りの画像からパズルを作成して、タイムを競おう！",
    images: [
      {
        url: "/images/icon.webp",
        width: 1200,
        height: 630,
        alt: "ココパズル",
      },
    ],
    locale: "ja_JP",
    type: "website",
    siteName: "ココパズル",
  },
  twitter: {
    card: "summary_large_image",
    title: "ココパズル | ここだけの自分のパズルを作ろう",
    description: "お気に入りの画像からパズルを作成して、タイムを競おう！",
    images: ["/images/icon.webp"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased overflow-hidden bg-gray-50`}
      >
        {children}
      </body>
    </html>
  );
}
