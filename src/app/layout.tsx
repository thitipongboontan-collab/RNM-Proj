import type { Metadata } from "next";
import { Inter, Plus_Jakarta_Sans } from "next/font/google";
import localFont from "next/font/local";
import { PageShell } from "@/components/layout/PageShell";
import "./globals.css";

const notoSansThaiUi = localFont({
  src: "../fonts/noto-sans-thai-ui/NotoSansThaiUI.woff2",
  weight: "400 700",
  variable: "--font-noto-sans-thai-ui",
  display: "swap",
});

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-plus-jakarta",
  weight: ["500", "600", "700"],
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  weight: ["400", "500", "600"],
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
    <html lang="th" suppressHydrationWarning>
      <body
        className={`${notoSansThaiUi.variable} ${plusJakarta.variable} ${inter.variable} font-sans`}
        suppressHydrationWarning
      >
        <PageShell>{children}</PageShell>
      </body>
    </html>
  );
}
