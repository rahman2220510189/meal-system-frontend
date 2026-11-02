import type { Metadata, Viewport } from "next";
import "@fontsource/hind-siliguri/400.css";
import "@fontsource/hind-siliguri/500.css";
import "@fontsource/hind-siliguri/600.css";
import "@fontsource/hind-siliguri/700.css";
import "@fontsource/baloo-da-2/600.css";
import "@fontsource/baloo-da-2/700.css";
import "@fontsource/baloo-da-2/800.css";
import "./globals.css";
import { Providers } from "@/components/Providers";
import { themeScript } from "@/lib/theme";
import { SITE_URL } from "@/lib/site";

const title = "মিল সিস্টেম — মেসের মিল ও বাজারের হিসাব | Meal System";
const description =
  "মেস ও হোস্টেলের মিল হিসাবের ফ্রি ওয়েবসাইট। কে কয়টা মিল খেল, বাজার খরচ, মিল রেট, ডিউ আর প্লাস — সব নিজে থেকে হিসাব হয়। গেস্ট মিল, ফিক্সড মিল, অ্যাডমিন অ্যাপ্রুভাল আর মাস শেষে PDF রিপোর্ট।";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: title, template: "%s · মিল সিস্টেম" },
  description,
  applicationName: "Meal System",
  keywords: [
    "মেস হিসাব",
    "মিল হিসাব",
    "মিল রেট",
    "মেস ম্যানেজার",
    "বাজার হিসাব",
    "ব্যাচেলর মেস",
    "হোস্টেল মিল",
    "meal system",
    "mess meal calculator",
    "meal rate calculator",
    "mess management Bangladesh",
    "bazar hisab",
  ],
  authors: [{ name: "Meal System" }],
  creator: "Meal System",
  category: "finance",
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    locale: "bn_BD",
    alternateLocale: ["en_US"],
    url: "/",
    siteName: "মিল সিস্টেম · Meal System",
    title,
    description,
  },
  twitter: { card: "summary_large_image", title, description },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-image-preview": "large", "max-snippet": -1 },
  },
  formatDetection: { telephone: false },
  appleWebApp: { capable: true, title: "মিল সিস্টেম", statusBarStyle: "default" },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f1f5f1" },
    { media: "(prefers-color-scheme: dark)", color: "#0d1512" },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="bn" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
