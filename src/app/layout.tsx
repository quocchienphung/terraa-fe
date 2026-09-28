import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { SmoothScroll } from "@/components/sites/anodeenergy-framer-website-108d0ac2/shared/SmoothScroll";

// BDO Grotesk Variable (SIL OFL 1.1): the only face the Farmio reference loads. wght 300–900; every
// Farmio text style renders at 400.
const bdoGrotesk = localFont({
  src: "./fonts/BDOGroteskVariable.woff2",
  variable: "--font-bdo-grotesk",
  weight: "300 900",
  display: "swap",
});

const SEO = "/sites/farmio-framer-website-711ac6e6/shared";

export const metadata: Metadata = {
  title: "Farmio",
  description:
    "Farmio delivers smart farming solutions to improve productivity and promote sustainable agricultural growth.",
  icons: { icon: `${SEO}/favicon.svg`, apple: `${SEO}/apple-touch-icon.png` },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${bdoGrotesk.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col bg-white text-farm-body">
        <SmoothScroll />
        {children}
      </body>
    </html>
  );
}
