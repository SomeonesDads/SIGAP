import type { Metadata } from "next";
import "leaflet/dist/leaflet.css";
import "./globals.css";

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
    <html lang="id">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@500;600;700&family=Rajdhani:wght@600;700&display=swap"
        />
      </head>
      <body className="min-h-screen bg-sigap-app text-slate-900 antialiased selection:bg-sigap-amber/30">
        {children}
      </body>
    </html>
  );
}
