# 03 — Investigasi AI (Chat Orkestrator)

[← Kembali ke ringkasan](README.md)

> Kondisi uji: `POST /api/investigations` dan `POST /api/chat` membalas 502, jadi `chatRes` bernilai `null` dan jawaban yang tampil adalah **template fallback** dari `hooks/use-chat.ts`. Wilayah dideteksi oleh `guessRegion()`, lalu data diambil lewat `fetchMonitoringHotspots(region, 5)` (yang juga jatuh ke sampel).

---

## UJ-09

**Investigasi wilayah yang ada di data sampel**

| Aspek | Isi |
|---|---|
| **Skenario** | Operator meminta agen memantau karhutla di Riau. |
| **Input** | `Pantau karhutla di Riau` |
| **Hasil yang Diharapkan** | Agen menjalankan 6 langkah (Perception, Citra STAC, DINOv3, Risk Scoring, Routing), lalu memberi rencana taktis berbasis data live FIRMS dan jawaban Gemini. |
| **Hasil Aktual** | Wilayah terdeteksi `Riau`. Data: `Local Fallback Cache`, 1 klaster, 44 titik. Klaster teratas **HS-0379 (Kec. Mandau, Kab. Bengkalis)**. Peta terbang ke klaster tersebut. Jawaban berupa template "Rencana Taktis Alokasi Sumber Daya Perimeter" dengan POS-1…POS-4 & UDP-1 dan label sumber **"FIRMS Cache"**. Segmentasi dan citra gagal, sehingga tampil nilai default: scene `S2A_49MFM_L2A` dan awan **6,8%**. Log langkah ke-6 berlabel "Perimeter Tactical Resource Allocation" (bukan Gemini). |
| **Status** | ⚠️ **Lulus bersyarat.** Alur berjalan, tapi bukan hasil analisis nyata. |
| **Kendala** | 1. ID scene dan persentase awan adalah **konstanta di kode**, tapi ditampilkan seakan hasil akuisisi citra.<br>2. Label "FIRMS Cache" bisa disangka cache data FIRMS sungguhan, padahal ini data sampel statis. |
| **Pengawasan Manusia** | Rencana POS/UDP **harus ditinjau Komandan Satgas** sebelum diteruskan ke regu. Koordinat pos perlu dicek terhadap akses jalan dan sumber air sebenarnya. |

**Bukti:** [lampiran/log-simulasi-fallback.txt](lampiran/log-simulasi-fallback.txt), baris `"q":"Pantau karhutla di Riau"`

---

## UJ-10

**Investigasi Pulang Pisau (wilayah prioritas, tidak ada di sampel)**

| Aspek | Isi |
|---|---|
| **Skenario** | Operator di Kalimantan Tengah menanyakan kondisi Pulang Pisau, wilayah yang dijadikan contoh utama di `AGENTS.md`. |
| **Input** | `Ada titik api di Pulang Pisau hari ini?` |
| **Hasil yang Diharapkan** | Agen menampilkan klaster aktif di Pulang Pisau dari data live. **Kalau data tidak tersedia, agen harus menyatakan bahwa data tidak tersedia, bukan menyatakan aman.** |
| **Hasil Aktual** | Wilayah terdeteksi `Pulang Pisau`. Data: `Local Fallback Cache`, **0 klaster, 0 titik**, sehingga `hasFires = false`. Agen menjawab:<br>> *"✅ Status Pantauan Kebakaran — Pulang Pisau (FIRMS Cache). **Tidak ditemukan kebakaran aktif (0 titik panas)** di wilayah Pulang Pisau berdasarkan pemindaian satelit **NASA FIRMS (VIIRS 375m NRT) dalam 48 jam terakhir**… Kelembapan permukaan stabil (~64% RH), kecepatan angin 12 km/j… **Tidak diperlukan pengerahan regu pemadam** untuk Pulang Pisau."*<br>Log keputusan: *"Status Risiko Pulang Pisau: AMAN (Nihil Kebakaran Aktif)"* dan *"Siaga Rutin: Tidak diperlukan pengerahan regu darurat"*.<br>Jawaban ini **bertentangan** dengan laporan **SIGAP-2026-089** di UI yang sama: Pulang Pisau, 18 titik panas VIIRS, 1.240 Ha, skor 95 (Kritis). |
| **Status** | ❌ **Gagal (kritis): false negative** |
| **Kendala** | 1. Ketiadaan data diperlakukan sama dengan ketiadaan api.<br>2. Teks jawaban mengklaim pemindaian FIRMS 48 jam yang **tidak pernah dilakukan**.<br>3. Nilai RH 64%, angin 12 km/j, dan flamabilitas 38% adalah **nilai tetap di kode**, bukan data BMKG. |
| **Pengawasan Manusia** | **Kritis.** Status "AMAN / tidak perlu pengerahan" **tidak boleh** keluar tanpa data live yang terverifikasi. Sampai diperbaiki, operator wajib mengecek ulang setiap jawaban "aman" di Sipongi KLHK / FIRMS / laporan MPA. Sebaiknya kesimpulan "aman" butuh tanda tangan petugas. |

**Bukti:** [lampiran/log-simulasi-fallback.txt](lampiran/log-simulasi-fallback.txt), baris `"q":"Ada titik api di Pulang Pisau hari ini?"`; template di `frontend/src/hooks/use-chat.ts:565-571`.

---

## UJ-11

**Investigasi wilayah di luar data sampel (Medan, Bogor)**

| Aspek | Isi |
|---|---|
| **Skenario** | Operator menanyakan wilayah yang tidak ada di 10 klaster sampel. |
| **Input** | (a) `Cek kebakaran di daerah medan kota`  (b) `Kebakaran di Kabupaten Bogor` |
| **Hasil yang Diharapkan** | Sama seperti UJ-10: data live, atau pernyataan bahwa data tidak tersedia. |
| **Hasil Aktual** | (a) Wilayah terdeteksi `Medan Kota`, 0 klaster. (b) Wilayah terdeteksi `Bogor` (lewat regex "di kabupaten …"), 0 klaster. Keduanya menghasilkan jawaban **"Tidak ditemukan kebakaran aktif… AMAN… Tidak diperlukan pengerahan"** seperti UJ-10. |
| **Status** | ❌ **Gagal (kritis)** |
| **Kendala** | Deteksi wilayah (`guessRegion`) sudah benar. Masalahnya ada di jalur fallback yang menyimpulkan "aman". Dari 7 input yang diuji, **3 menghasilkan status AMAN palsu**. |
| **Pengawasan Manusia** | Sama dengan UJ-10. |

**Bukti:** [lampiran/log-simulasi-fallback.txt](lampiran/log-simulasi-fallback.txt), baris `"q":"Cek kebakaran di daerah medan kota"` dan `"q":"Kebakaran di Kabupaten Bogor"`

---

## UJ-12

**Estimasi kerugian ekonomi**

| Aspek | Isi |
|---|---|
| **Skenario** | Pejabat BPBD menanyakan dampak ekonomi kalau api dibiarkan. |
| **Input** | `Berapa kerugian jika api di Ketapang dibiarkan?` |
| **Hasil yang Diharapkan** | Agen memberi estimasi kerugian 24 jam dan 72 jam beserta asumsi yang jelas. |
| **Hasil Aktual** | Wilayah terdeteksi `Ketapang` dan kata kunci "kerugian" dikenali. Klaster: **HS-0421 (Kec. Kendawangan, Kab. Ketapang)**, 192 titik. Jawaban memakai template "📉 Estimasi Kerugian Ekonomi & Ekologis", dengan proyeksi luas dan nilai kerugian (Rp Miliar) 24 jam & 72 jam, serta emisi CO₂e. |
| **Status** | ⚠️ **Lulus bersyarat** |
| **Kendala** | Angka dihitung dengan rumus heuristik di klien: biaya tetap **Rp 72 juta/Ha** (gambut) atau **Rp 38 juta/Ha**, faktor emisi **420 / 95 t CO₂e/Ha**, dan pengali sebaran dari angin. Rumus ini belum punya rujukan atau validasi, tapi angkanya ditampilkan tanpa catatan asumsi. |
| **Pengawasan Manusia** | Angka kerugian **hanya untuk indikasi**. Sebelum dikutip di SITREP atau ke media, angka harus divalidasi analis (BPBD/KLHK). Asumsi perlu ditampilkan di UI. |

---

## UJ-13

**Pesan sapaan non-investigasi**

| Aspek | Isi |
|---|---|
| **Skenario** | Pengguna baru menyapa agen. |
| **Input** | `Halo SIGAP` |
| **Hasil yang Diharapkan** | Agen membalas sapaan atau menjelaskan kemampuannya tanpa memulai investigasi. |
| **Hasil Aktual** | Wilayah default `Indonesia`. Agen tetap menjalankan **investigasi penuh 6 langkah**, memfokuskan peta ke **HS-0412 (Seruyan)**, dan mengeluarkan rencana taktis POS-1…UDP-1. |
| **Status** | ❌ **Gagal (minor)** |
| **Kendala** | Tidak ada deteksi maksud (intent): setiap pesan dianggap perintah investigasi. Ini bisa memicu rencana dispatch yang tidak diminta. |
| **Pengawasan Manusia** | Operator perlu mengabaikan rencana yang muncul dari pesan non-operasional. Sebaiknya tambahkan klasifikasi intent sebelum memicu orkestrasi. |
