import type { Metadata } from "next";
import "./globals.css";
import "leaflet/dist/leaflet.css";
import { Sidebar } from "@/components/layout/sidebar";

export const metadata: Metadata = {
  title: "SIGAP — Agen Karhutla",
  description:
    "Platform Agentic AI untuk investigasi karhutla mandiri, pemantauan hotspot NASA FIRMS, analisis citra satelit Landsat/Sentinel, estimasi luas kebakaran U-Net, dan rekomendasi prioritas respons lapangan.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" className="dark">
      <body className="min-h-screen bg-slate-950 text-slate-100 antialiased selection:bg-amber-500/30 selection:text-amber-200">
        <div className="flex min-h-screen flex-col lg:flex-row">
          <Sidebar />
          <main className="flex-1 overflow-y-auto bg-gradient-to-b from-slate-950 via-slate-900/60 to-slate-950 p-4 md:p-6 lg:p-8">
            <div className="mx-auto max-w-7xl">{children}</div>
          </main>
        </div>
      </body>
    </html>
  );
}
