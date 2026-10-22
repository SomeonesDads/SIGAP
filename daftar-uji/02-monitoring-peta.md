# 02 — Monitoring Peta (Dashboard Utama)

[← Kembali ke ringkasan](README.md)

> Kondisi uji: backend tidak terjangkau (lihat UJ-02), jadi semua hasil di bawah adalah perilaku **mode fallback**.

---

## UJ-04

**Memuat titik panas nasional saat dashboard dibuka**

| Aspek | Isi |
|---|---|
| **Skenario** | Operator membuka dashboard. Peta otomatis memuat klaster titik panas se-Indonesia dan memperbaruinya setiap 60 detik. |
| **Input** | Buka `/`. Frontend memanggil `fetchMonitoringHotspots("Indonesia", 35)`. |
| **Hasil yang Diharapkan** | Klaster live NASA FIRMS tampil di peta, badge **"LIVE FIRMS + STAC + DINOv3"** menyala, dan panel prioritas berisi 4 klaster teratas. |
| **Hasil Aktual** | API membalas 502. Frontend beralih ke `SAMPLE_HOTSPOTS`, yaitu **10 klaster contoh** dengan `source: "Local Fallback Cache"` dan `is_live: false`. Urutan prioritas: HS-0412 Seruyan (96,4), HS-0415 Muaro Jambi (94,8), HS-0418 Merauke (93,2), HS-0398 OKI (91,5). Komposisi: 7 klaster "tinggi" dan 3 "sedang". Badge LIVE tidak muncul. |
| **Status** | ⚠️ **Lulus bersyarat.** UI tetap jalan, tapi datanya bukan data live. |
| **Kendala** | 1. Tidak ada banner atau penanda yang jelas bahwa data adalah **sampel statis**. Satu-satunya tanda adalah badge LIVE yang tidak muncul, dan itu mudah terlewat.<br>2. Data sampel memakai tanggal dan angka yang terlihat realistis, sehingga mudah dikira kondisi nyata. |
| **Pengawasan Manusia** | Operator harus mengecek apakah badge **LIVE** menyala sebelum memakai peta untuk keputusan. Kalau tidak menyala, cocokkan dengan Sipongi KLHK atau FIRMS secara manual. |

**Bukti:** [lampiran/log-simulasi-fallback.txt](lampiran/log-simulasi-fallback.txt), baris `(dashboard poll Indonesia)`

---

## UJ-05

**Filter kriteria prioritas**

| Aspek | Isi |
|---|---|
| **Skenario** | Operator menyaring daftar prioritas berdasarkan kriteria: Semua, Kritis (skor ≥ 85), Lahan Gambut, dan Dekat Permukiman (≤ 3 km). |
| **Input** | Klik setiap chip filter di panel bawah peta. |
| **Hasil yang Diharapkan** (dihitung dari logika asli dengan data sampel) | **Kritis:** HS-0412, HS-0415, HS-0418, HS-0398, HS-0421 (5)<br>**Gambut:** HS-0412, HS-0415, HS-0418, HS-0398, HS-0421, HS-0379 (6)<br>**Permukiman ≤3 km:** HS-0412, HS-0415, HS-0418, HS-0398, HS-0421, HS-0405, HS-0379, HS-0388 (8) |
| **Hasil Aktual (logika)** | Sama dengan yang diharapkan (lihat log simulasi). |
| **Hasil Aktual (Manual)** | _diisi setelah dicek di browser + screenshot_ |
| **Status** | ✅ **Lulus (logika)** · Perlu verifikasi manual |
| **Kendala** | 8 dari 10 sampel lolos filter "Dekat Permukiman", jadi filter ini kurang membedakan pada data sampel. Perlu diuji ulang dengan data live. |
| **Pengawasan Manusia** | Ambang 85 dan 3 km ditetapkan di kode. Komandan perlu memvalidasi apakah ambang ini sesuai SOP daerah. |

**Bukti:** [lampiran/log-simulasi-fallback.txt](lampiran/log-simulasi-fallback.txt), baris `critical>=85`, `peatland`, `settlement<=3km`

---

## UJ-06

**Pencarian lokasi**

| Aspek | Isi |
|---|---|
| **Skenario** | Operator mengetik nama wilayah atau ID klaster di kolom "Cari lokasi…" untuk mengarahkan peta. |
| **Input** | (a) `Seruyan`  (b) `HS-0421`  (c) `Bogor` |
| **Hasil yang Diharapkan** | (a)(b) Muncul klaster yang cocok dan peta terbang ke lokasinya. (c) Muncul hasil geocoding OSM Nominatim untuk Bogor. |
| **Hasil Aktual** | (a)(b) Pencocokan klaster dilakukan di sisi klien terhadap data sampel, jadi **berfungsi**. (c) Geocoding memanggil backend (`searchGeocodePlaces`), yang gagal dan mengembalikan `[]`. Hasilnya hanya muncul kalau Bogor ada di daftar `PLACES` preset; di luar itu daftar kosong **tanpa pesan error**. |
| **Status** | ⚠️ **Lulus sebagian** |
| **Kendala** | Pencarian bebas sepenuhnya bergantung pada backend, dan kegagalannya tidak terlihat oleh pengguna. |
| **Pengawasan Manusia** | Kalau lokasi tidak ditemukan, operator perlu menavigasi peta secara manual atau memakai koordinat dari laporan lapangan. |

---

## UJ-07

**Toggle legenda keparahan**

| Aspek | Isi |
|---|---|
| **Skenario** | Operator menyembunyikan atau menampilkan klaster berdasarkan tingkat keparahan (Tinggi/Sedang/Rendah) lewat legenda. |
| **Input** | Klik "Tinggi" pada legenda, lalu klik lagi. |
| **Hasil yang Diharapkan** | Klik pertama menyembunyikan 7 klaster "tinggi" dari peta dan daftar prioritas; klik kedua menampilkannya lagi. Daftar prioritas hanya berisi klaster yang terlihat. |
| **Hasil Aktual (Manual)** | _diisi setelah dicek di browser + screenshot_ |
| **Status** | Perlu verifikasi manual |
| **Kendala** | Belum diuji di browser karena alat browser tidak tersedia di sesi pengujian. |
| **Pengawasan Manusia** | Pastikan operator tidak lupa menyalakan lagi filter "Tinggi", karena klaster kritis bisa hilang dari pandangan. Pertimbangkan indikator "filter aktif". |

---

## UJ-08

**Simulasi drone**

| Aspek | Isi |
|---|---|
| **Skenario** | Operator menyalakan toggle "Simulasi" untuk melihat 5 drone bergerak memadamkan klaster prioritas. |
| **Input** | Nyalakan toggle Simulasi, tunggu ±30 detik, lalu matikan. |
| **Hasil yang Diharapkan** | 5 drone (DRN-01…) muncul dan bergerak setiap 700 ms. Klaster yang dipadamkan hilang. Panel "Status Drone" menampilkan mode, baterai, dan muatan. Saat simulasi dimatikan, data klaster sebelum simulasi dikembalikan. |
| **Hasil Aktual (Manual)** | _diisi setelah dicek di browser + screenshot_ |
| **Status** | Perlu verifikasi manual |
| **Kendala** | Simulasi berjalan murni di klien dan tidak tersambung ke telemetri drone sungguhan. Hasilnya **bukan** rencana operasional. |
| **Pengawasan Manusia** | Mode simulasi harus diberi label jelas sebagai latihan atau demonstrasi, dan tidak boleh dipakai sebagai dasar penugasan drone nyata. |
