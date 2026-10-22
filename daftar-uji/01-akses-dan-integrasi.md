# 01 — Akses & Integrasi Backend

[← Kembali ke ringkasan](README.md)

---

## UJ-01

**Membuka halaman utama & semua rute modul**

| Aspek | Isi |
|---|---|
| **Skenario** | Pengguna (operator BPBD/Manggala Agni) membuka SIGAP lewat browser, lalu berpindah ke setiap modul. |
| **Input** | `GET /`, `/map`, `/priority`, `/investigation`, `/reports` |
| **Hasil yang Diharapkan** | Semua rute membalas HTTP 200 dalam waktu < 5 detik. |
| **Hasil Aktual** | Semua rute membalas **HTTP 200**. Waktu respons saat instance masih dingin (cold start) 1,34–3,57 detik, saat sudah hangat 0,26–0,50 detik. Bundle yang dikirim adalah build produksi Next.js (nama chunk berisi hash). |
| **Status** | ✅ **Lulus** |
| **Kendala** | Cold start Cloud Run menambah ±2–3 detik pada akses pertama. Untuk sistem tanggap darurat, jeda ini perlu diperhitungkan. |
| **Pengawasan Manusia** | Tidak ada keputusan operasional pada tahap ini. Tim cukup memantau uptime, misalnya dengan Cloud Monitoring uptime check. Pertimbangkan `min-instances=1` selama musim kemarau. |

**Bukti:** [lampiran/log-uji-http.txt](lampiran/log-uji-http.txt), baris `GET / -> HTTP 200 …`

---

## UJ-02

**Proxy `/api/*` dari frontend ke backend**

| Aspek | Isi |
|---|---|
| **Skenario** | Frontend mengambil data titik panas, laporan, konteks spasial, segmentasi, citra, chat, dan investigasi dari backend lewat proxy same-origin `/api/*`. |
| **Input** | `GET /api/hotspots/monitoring?region=Indonesia&limit=35`<br>`GET /api/hotspots?region=Riau&limit=50`<br>`GET /api/reports?region=Indonesia&limit=15`<br>`GET /api/map/context?lat=-2.85&lon=114.12`<br>`GET /api/map/segmentation/live?lat=-2.85&lon=114.12`<br>`GET /api/map/imagery/live`<br>`GET /api/reports/SIGAP-2026-089/download`<br>`POST /api/chat` `{"message":"Ada titik api di Pulang Pisau?"}`<br>`POST /api/investigations` `{"query":"investigasi karhutla di Riau","region":"Riau"}` |
| **Hasil yang Diharapkan** | HTTP 200 dengan payload JSON dari backend FastAPI. |
| **Hasil Aktual** | **Semua 9 endpoint membalas HTTP 502**:<br>`{"error":"Upstream backend unreachable","detail":"TypeError: Failed to parse URL from $BACKEND_URL/api/...","targetUrl":"$BACKEND_URL/api/..."}`<br>Variabel `BACKEND_URL` di Cloud Run berisi teks literal `$BACKEND_URL`; nilainya tidak pernah disubstitusi. Path dengan garis miring di akhir (`/api/reports/`) di-redirect 308 ke path tanpa garis miring, lalu tetap berakhir 502. |
| **Status** | ❌ **Gagal (kritis)** |
| **Kendala** | 1. Kemungkinan env var diisi lewat `--set-env-vars BACKEND_URL=$BACKEND_URL` dengan tanda kutip tunggal atau di shell yang tidak mengekspansi variabel.<br>2. Akibatnya seluruh fitur "live" (NASA FIRMS, AWS STAC, DINOv3, OSM, Gemini) **tidak berjalan** di deployment, dan UI diam-diam memakai data sampel (lihat UJ-04, UJ-09 s/d UJ-16). |
| **Pengawasan Manusia** | **Wajib.** Sebelum dipakai operasional, admin harus memastikan `GET /api/hotspots/monitoring` membalas 200 dengan `"is_live": true`. Sampai itu terjadi, SIGAP **tidak boleh** dijadikan dasar keputusan dispatch. Tambahkan pemeriksaan ini ke checklist rilis. |

**Bukti:** [lampiran/log-uji-http.txt](lampiran/log-uji-http.txt)

**Perbaikan yang disarankan:**
```bash
gcloud run services update sigap-frontend --region us-west1 \
  --update-env-vars BACKEND_URL=https://<url-backend-sebenarnya>.run.app
```

---

## UJ-03

**Konsistensi kode repo vs deployment**

| Aspek | Isi |
|---|---|
| **Skenario** | Memastikan kode yang di-deploy sama dengan kode di repo, supaya hasil uji dan perbaikan bisa ditelusuri. |
| **Input** | Bundle JS produksi (12 chunk) dibandingkan dengan `frontend/src/lib/api.ts` di `main@0899560`. |
| **Hasil yang Diharapkan** | Logika alamat API di bundle sama dengan yang ada di repo. |
| **Hasil Aktual** | Bundle produksi berisi:<br>`NEXT_PUBLIC_API_URL \|\| (hostname !== "localhost" && hostname !== "127.0.0.1" ? "" : "http://localhost:8000")`<br>Repo hanya berisi `process.env.NEXT_PUBLIC_API_URL \|\| "http://localhost:8000"`. Route proxy yang menghasilkan pesan `"Upstream backend unreachable"` **tidak ada di branch mana pun** (`main`, `feat/frontend`, `feat/dinov3`). `frontend/Dockerfile` di repo juga menjalankan `npm run dev`, sedangkan deployment memakai build produksi. |
| **Status** | ⚠️ **Temuan** |
| **Kendala** | Ada kode yang di-deploy tapi belum di-commit. Bug di UJ-02 tidak bisa diperbaiki atau direview lewat repo, dan deploy ulang dari repo akan menghapus proxy tersebut. |
| **Pengawasan Manusia** | Pemilik deployment perlu meng-commit kode proxy dan Dockerfile produksi, lalu menetapkan aturan bahwa deploy hanya boleh dari commit yang sudah di-push. |

**Bukti:** [lampiran/potongan-bundle.txt](lampiran/potongan-bundle.txt)
