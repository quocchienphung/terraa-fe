import type { Metadata } from "next";
import { Fragment_Mono, Geist, Inter, PT_Mono, Spline_Sans_Mono } from "next/font/google";
import "./globals.css";
import { SmoothScroll } from "@/components/sites/anodeenergy-framer-website-108d0ac2/shared/SmoothScroll";

const geist = Geist({
  variable: "--font-geist",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

const splineSansMono = Spline_Sans_Mono({
  variable: "--font-spline-mono",
  subsets: ["latin"],
  weight: ["400"],
});

const fragmentMono = Fragment_Mono({
  variable: "--font-fragment-mono",
  subsets: ["latin"],
  weight: ["400"],
});

const ptMono = PT_Mono({
  variable: "--font-pt-mono",
  subsets: ["latin"],
  weight: ["400"],
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["400"],
});

export const metadata: Metadata = {
  title: "Anode Energy",
  description:
    "Grid-scale battery storage — built, deployed and run by one team, from the interconnection study to the megawatt-hours a site bids each morning.",
  icons: { icon: "/images/reference/favicon.jpg" },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geist.variable} ${splineSansMono.variable} ${fragmentMono.variable} ${ptMono.variable} ${inter.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-white text-ink-2">
        <SmoothScroll />
        {children}
      </body>
    </html>
  );
}
