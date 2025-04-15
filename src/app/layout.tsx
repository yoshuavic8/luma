import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";
import { Toaster } from "@/components/ui/toaster";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Luma - AI Platform for Church Leaders",
  description: "AI-powered platform for sermon preparation, Bible study, and ministry resources",
  icons: {
    icon: [
      { url: "/assets/images/logo/AppIcons/favicon/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/assets/images/logo/AppIcons/favicon/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/assets/images/logo/AppIcons/favicon/favicon-96x96.png", sizes: "96x96", type: "image/png" },
    ],
    apple: [
      { url: "/assets/images/logo/AppIcons/pwa/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
    other: [
      {
        rel: "mask-icon",
        url: "/assets/images/logo/AppIcons/pwa/maskable-icon.png",
      },
    ],
  },
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Luma",
  },
  applicationName: "Luma",
  keywords: ["church", "sermon", "AI", "Bible", "ministry", "preparation"],
  authors: [{ name: "Luma Team" }],
  creator: "Luma",
  publisher: "Luma",
  formatDetection: {
    telephone: false,
  },
  metadataBase: new URL("https://luma-ai.vercel.app"),
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://luma-ai.vercel.app",
    title: "Luma - AI Platform for Church Leaders",
    description: "AI-powered platform for sermon preparation, Bible study, and ministry resources",
    siteName: "Luma",
    images: [
      {
        url: "/assets/images/logo/AppIcons/pwa/maskable-icon.png",
        width: 512,
        height: 512,
        alt: "Luma Logo",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Luma - AI Platform for Church Leaders",
    description: "AI-powered platform for sermon preparation, Bible study, and ministry resources",
    images: ["/assets/images/logo/AppIcons/pwa/maskable-icon.png"],
    creator: "@luma",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body suppressHydrationWarning className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <Providers>
          {children}
          <Toaster />
        </Providers>
      </body>
    </html>
  );
}
