# 04 — Laporan Kasus & Human-in-the-Loop

[← Kembali ke ringkasan](README.md)

---

## UJ-14

**Daftar laporan kasus**

| Aspek | Isi |
|---|---|
| **Skenario** | Analis membuka panel Laporan untuk melihat kasus karhutla terbaru dan menyaringnya berdasarkan teks atau status. |
| **Input** | Buka tab Laporan. Cari `Pulang`, lalu filter status `Draft`. |
| **Hasil yang Diharapkan** | Laporan live dari `GET /api/reports` (sumber "LIVE NASA FIRMS + DINOv3") dan bisa disaring. |
| **Hasil Aktual** | API membalas 502 (`fetchReports` mengembalikan `null`), sehingga UI tetap menampilkan `INITIAL_REPORTS`: **1 laporan statis SIGAP-2026-089** (Pulang Pisau, Draft, 1.240 Ha, skor 95). Pencarian dan filter berjalan di sisi klien terhadap 1 laporan ini. |
| **Status** | ⚠️ **Lulus bersyarat** |
| **Kendala** | Laporan statis tampil dengan pemeriksa "SIGAP Agent AI (Manggala Agni Daops Kapuas)" seakan kasus nyata. Isinya juga bertentangan dengan jawaban chat di UJ-10. |
| **Pengawasan Manusia** | Laporan berstatus **Draft** harus ditinjau dan disetujui analis sebelum berubah ke "Ditinjau/Selesai". Laporan contoh perlu diberi label "CONTOH". |

**Bukti:** [lampiran/log-uji-http.txt](lampiran/log-uji-http.txt), baris `GET /api/reports?region=Indonesia&limit=15`

---

## UJ-15

**Unduh laporan PDF**

| Aspek | Isi |
|---|---|
| **Skenario** | Analis mengunduh PDF laporan untuk dilampirkan ke SITREP. |
| **Input** | Klik tombol **PDF** pada SIGAP-2026-089. Ini memanggil `GET /api/reports/SIGAP-2026-089/download?lat=-2.85&lon=114.12`. |
| **Hasil yang Diharapkan** | File PDF valid terunduh. |
| **Hasil Aktual** | Endpoint membalas **HTTP 502** dengan body JSON error. Karena unduhan dibuat lewat tautan `<a download>` same-origin tanpa cek status, browser **berpotensi menyimpan JSON error sebagai `SIGAP_Report_SIGAP-2026-089.pdf`** yang rusak, tanpa pemberitahuan. |
| **Status** | ❌ **Gagal** |
| **Kendala** | Tidak ada pengecekan status HTTP sebelum unduhan dan tidak ada pesan error ke pengguna. |
| **Pengawasan Manusia** | Analis harus membuka dan mengecek isi PDF sebelum melampirkannya ke dokumen resmi. |

**Bukti:** [lampiran/log-uji-http.txt](lampiran/log-uji-http.txt), baris `GET /api/reports/SIGAP-2026-089/download`

---

## UJ-16

**Unduh GeoJSON per kasus**

| Aspek | Isi |
|---|---|
| **Skenario** | Analis GIS mengunduh perimeter kasus dalam format GeoJSON untuk QGIS/ArcGIS. |
| **Input** | Klik tombol **GeoJSON** pada SIGAP-2026-089. |
| **Hasil yang Diharapkan** | File `.geojson` berisi poligon perimeter terunduh. |
| **Hasil Aktual** | `fetchReportGeoJSON` gagal (502) dan mengembalikan `null`. Fungsi lalu berhenti di `if (!geojson) return;`: **tidak ada file dan tidak ada pesan apa pun**. Tombol hanya berhenti loading. |
| **Status** | ❌ **Gagal (tanpa pesan error)** |
| **Kendala** | Kegagalan tidak terlihat oleh pengguna, sehingga analis bisa mengira klik tidak terbaca dan mengulanginya terus. |
| **Pengawasan Manusia** | Sampai diperbaiki, analis perlu mengambil perimeter langsung dari backend atau GEE secara manual. |

---

## UJ-17

**Persetujuan komandan sebelum dispatch (HITL)**

| Aspek | Isi |
|---|---|
| **Skenario** | Sesuai `AGENTS.md` §8, rencana dispatch, evakuasi, atau pengerahan lintas wilayah harus disetujui Komandan Satgas sebelum dikirim ke regu. |
| **Input** | Jalankan investigasi (UJ-09), lalu cari kontrol "Setujui / Ubah / Tolak" pada rencana POS-1…UDP-1. |
| **Hasil yang Diharapkan** | Ada status `confirmed → DispatchApproved` yang memerlukan aksi manusia, beserta jejak audit (siapa menyetujui dan kapan). |
| **Hasil Aktual** | Di komponen frontend **tidak ditemukan** kontrol persetujuan, penolakan, atau modifikasi (pencarian `approve`, `setuju`, `komandan`, `commander` di `components/` dan `hooks/` tidak memberi hasil). Rencana langsung tampil sebagai jawaban final. |
| **Status** | ❌ **Belum tersedia** |
| **Kendala** | Belum ada alur kerja HITL di UI. Status `unconfirmed / needs_field_check / confirmed / false_alarm` juga belum terlihat. |
| **Pengawasan Manusia** | **Wajib dan saat ini sepenuhnya manual.** Semua keluaran SIGAP diperlakukan sebagai **rekomendasi**. Komandan menyetujui lewat kanal resmi (radio/WhatsApp/surat perintah) di luar sistem, dan persetujuan dicatat manual. |

---

## Matriks Pengawasan Manusia

| Titik Keputusan | Kasus Terkait | Siapa | Wajib? | Kondisi Saat Ini |
|---|---|---|---|---|
| Validasi data live sebelum operasional | UJ-02, UJ-04 | Admin sistem / operator | Ya | Manual (cek badge LIVE) |
| Konfirmasi status "AMAN" | UJ-10, UJ-11 | Operator posko | Ya | Tidak ada kontrol, **berisiko** |
| Persetujuan rencana dispatch POS/UDP | UJ-09, UJ-17 | Komandan Satgas Karhutla | Ya | Di luar sistem |
| Validasi estimasi kerugian | UJ-12 | Analis BPBD/KLHK | Ya (sebelum publikasi) | Di luar sistem |
| Review laporan Draft | UJ-14, UJ-15 | Analis | Ya | Status bisa dilihat, tapi belum ada alur persetujuan |
| Pemakaian simulasi drone | UJ-08 | Operator | Ya (larangan untuk operasi nyata) | Belum ada label "latihan" |
