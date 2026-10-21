import type { Metadata } from "next";
import { Inter, JetBrains_Mono, Rajdhani } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  variable: "--font-jetbrains-mono",
});
const rajdhani = Rajdhani({
  subsets: ["latin"],
  weight: ["600", "700"],
  variable: "--font-rajdhani",
});

export const metadata: Metadata = {
  title: "SIGAP — Sistem Pemantauan Karhutla",
  description:
    "Platform Agentic AI untuk investigasi karhutla mandiri, pemantauan hotspot NASA FIRMS, analisis citra satelit Landsat/Sentinel, estimasi luas kebakaran U-Net, dan rekomendasi prioritas respons lapangan.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="id"
      className={`${inter.variable} ${jetbrainsMono.variable} ${rajdhani.variable}`}
    >
      <body className="min-h-screen bg-sigap-app text-slate-900 antialiased selection:bg-sigap-amber/30">
        {children}
      </body>
    </html>
  );
}
