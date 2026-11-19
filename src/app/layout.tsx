import type { Metadata } from "next";
import { Inter } from "next/font/google";
import localFont from "next/font/local";
import { ConditionalPageShell } from "@/components/layout/ConditionalPageShell";
import "./globals.css";

const notoSansThaiUi = localFont({
  src: "../fonts/noto-sans-thai-ui/NotoSansThaiUI.woff2",
  weight: "400 700",
  variable: "--font-noto-sans-thai-ui",
  display: "swap",
  adjustFontFallback: false,
  declarations: [
    {
      prop: "unicode-range",
      value: "U+0E00-0E7F, U+200C-200D, U+25CC",
    },
  ],
});

const inter = Inter({
  subsets: ["latin", "latin-ext"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-inter",
  display: "swap",
  adjustFontFallback: false,
});

export const metadata: Metadata = {
  title: "Research Nexus Matching",
  description:
    "ระบบสนับสนุนความร่วมมือทางวิชาการและงานวิจัยอัจฉริยะ",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="th"
      className={`${notoSansThaiUi.variable} ${inter.variable}`}
      suppressHydrationWarning
    >
      <body className="font-sans" suppressHydrationWarning>
        <ConditionalPageShell>{children}</ConditionalPageShell>
      </body>
    </html>
  );
}
