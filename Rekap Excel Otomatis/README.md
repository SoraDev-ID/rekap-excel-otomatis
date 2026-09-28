# Rekap Excel Otomatis — Multi-Tenant Enterprise Solution

Aplikasi web full-stack untuk pengolahan, pembersihan, dan agregasi ringkasan data spreadsheet Excel (.xlsx, .xls) dan CSV secara otomatis dengan fokus utama pada **keamanan tingkat enterprise**, **isolasi data multi-tenant**, dan **kebijakan Row-Level Security (RLS)**.

---

## 🏛️ Arsitektur Sistem

Aplikasi dibangun menggunakan arsitektur modern berbasis Next.js 14 App Router yang terintegrasi langsung dengan Supabase Managed PostgreSQL dan Cloud Storage.

```
                              [ Browser Client ]
                                      │
                         HTTPS / TLS 1.3 / REST API
                                      ▼
                        ┌───────────────────────────┐
                        │   Next.js 14 (App Router) │
                        │  Tailwind CSS + Recharts  │
                        └─────────────┬─────────────┘
                                      │
            ┌─────────────────────────┴─────────────────────────┐
            │ Server-Side Security Middleware & Route Handlers  │
            │  - Magic-Byte Binary MIME Validation              │
            │  - CSV / Formula Injection Sanitizer              │
            │  - Per-User Rate Limiting Engine                  │
            └─────────────┬─────────────────────────┬───────────┘
                          │                         │
               Anon Key + JWT Auth          Service Role Key
             (Scoped via User Session)    (Server-Only Operations)
                          ▼                         ▼
            ┌───────────────────────────┐ ┌─────────────────────┐
            │    Supabase PostgreSQL    │ │  Supabase Storage   │
            │  Row-Level Security (RLS) │ │   'excel-files'     │
            │  - tenants                │ │                     │
            │  - users_profile          │ │ Path Isolation:     │
            │  - uploaded_files         │ │ /{tenant_id}/       │
            │  - recap_results          │ │  {timestamp}_{file} │
            │  - activity_log           │ │                     │
            └───────────────────────────┘ └─────────────────────┘
```

---

## 🛡️ Analisis & Keputusan Keamanan

### 1. Row-Level Security (RLS) & Isolasi Multi-Tenant
Setiap entitas data dalam basis data diisolasi secara ketat berdasarkan `tenant_id`:
- **Staff**: Hanya memiliki hak akses `SELECT`, `INSERT`, `UPDATE`, dan `DELETE` atas data yang mereka unggah sendiri (`uploaded_by = auth.uid()`).
- **Admin**: Memiliki hak akses penuh untuk melihat seluruh file, ringkasan rekap, dan mengelola profil anggota tim dalam ruang lingkup `tenant_id` miliknya.
- **Super Admin**: Memiliki hak akses lintas tenant untuk kebutuhan pemeliharaan platform.
- **Viewer**: Bersifat *read-only* (`SELECT`), tidak dapat melakukan modifikasi maupun upload data.
- **Pencegahan Rekursi RLS**: Pengecekan peran dan tenant dilakukan melalui fungsi Postgres bertipe `SECURITY DEFINER` (`current_user_tenant_id()`, `current_user_role()`) untuk menghindari loop tak terbatas.

### 2. Sanitasi Formula Injection (CSV / Excel Injection)
Berdasarkan panduan OWASP, file spreadsheet yang diunggah oleh pengguna dapat berisi muatan berbahaya yang mengeksekusi kode perintah ketika dibuka di Microsoft Excel atau Google Sheets (seperti `=cmd|' /C calc'!A0` atau `=HYPERLINK("http://attacker.com")`).
- Sistem memindai setiap sel pada lembar kerja.
- Jika sel diawali dengan karakter berisiko (`=`, `+`, `-`, `@`, `|`, `\t`, `\r`) atau memuat pola formula eksternal, sistem secara otomatis menambahkan awalan tanda kutip tunggal (`'`) untuk menetralkan rumus menjadi teks biasa sebelum data diproses, disimpan, atau diekspor.
- Jumlah sel yang disanitasi dicatat dalam metadata rekap dan log audit.

### 3. Validasi MIME Type Berbasis Magic Bytes
Pemeriksaan keamanan tidak bergantung pada ekstensi nama file atau `Content-Type` header dari browser (yang mudah dipalsukan):
- **XLSX (Office Open XML)**: Wajib diawali dengan biner ZIP `50 4B 03 04` (`PK\x03\x04`).
- **XLS (Excel 97-2004)**: Wajib diawali dengan OLE2 Compound Document header `D0 CF 11 E0 A1 B1 1A E1`.
- **CSV**: Divalidasi sebagai teks terenkode ASCII/UTF-8 tanpa byte biner kontrol atau null bytes.
- File yang tidak memenuhi tanda biner asli ditolak sebelum disimpan.

### 4. Isolasi Supabase Storage
- Seluruh file disimpan dalam bucket privat `excel-files`.
- Struktur folder dipartisi ketat: `/{tenant_id}/{timestamp}_{sanitized_filename}`.
- Kebijakan penyimpanan (Storage RLS Policies) memastikan token pengguna hanya dapat mengunduh atau menghapus file yang berada di bawah folder `tenant_id` akun mereka sendiri.

### 5. Perlindungan Kredensial & Rate Limiting
- `SUPABASE_SERVICE_ROLE_KEY` **hanya** digunakan pada lingkungan server (`src/lib/supabase/admin.ts`) dan tidak pernah dikirim ke browser client.
- Frontend hanya menggunakan `NEXT_PUBLIC_SUPABASE_ANON_KEY` dengan otentikasi JWT berbasis cookie.
- Upload API dilindungi pembatas laju request (rate limit 20 request/menit per pengguna) dan batas ukuran file maksimal 10 MB.

---

## 👥 Akun Demo Siap Pakai

Telah disediakan 1 perusahaan contoh (**PT Nusantara Demo Corp**) dengan 3 akun pengujian untuk memverifikasi isolasi hak akses:

| Email | Kata Sandi | Peran (Role) | Hak Akses & Pembuktian RLS |
|---|---|---|---|
| `admin@demo.com` | `Password123!` | **Admin** | Dapat melihat **seluruh file** (Penjualan & Pengeluaran) dan mengakses halaman **Manajemen Tim**. |
| `staff1@demo.com` | `Password123!` | **Staff** | Hanya melihat file **Penjualan Q1** yang ia unggah sendiri. Tidak melihat file Staff 2. |
| `staff2@demo.com` | `Password123!` | **Staff** | Hanya melihat file **Pengeluaran 2026** yang ia unggah sendiri. Tidak melihat file Staff 1. |

> **Fitur 1-Klik**: Pada halaman login (`/login`), terdapat tombol cepat untuk mengisi akun demo tanpa perlu mengetik manual.

---

## 🚀 Panduan Setup & Menjalankan Lokal

### 1. Prasyarat
- Node.js versi 18 atau lebih baru.
- Akun Supabase (proyek telah terhubung).

### 2. Kloning & Instalasi
```bash
git clone <url-repository>
cd "Project/Rekap Excel Otomatis"
npm install
```

### 3. Konfigurasi Lingkungan (`.env.local`)
Buat file `.env.local` di dalam folder `Rekap Excel Otomatis/`:
```env
NEXT_PUBLIC_SUPABASE_URL="https://your-project-id.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="<your-anon-key>"

SUPABASE_URL="https://your-project-id.supabase.co"
SUPABASE_ANON_KEY="<your-anon-key>"
SUPABASE_SERVICE_ROLE_KEY="<your-service-role-key>"
```

### 4. Eksekusi Migrasi Database & Seeding
Skema database dan kebijakan RLS telah terpasang di Supabase. Anda dapat menjalankan ulang seed data kapan saja:
```bash
npm run seed
```

### 5. Jalankan Server Pengembangan
```bash
npm run dev
```
Akses aplikasi melalui peramban di: `http://localhost:3000`.

---

## 🚂 Panduan Deployment ke Railway

Proyek ini telah dikonfigurasi secara lengkap untuk otomatisasi build dan deploy di **Railway**.

### Metode 1: Menggunakan Dockerfile Standalone (Disarankan)
Repository telah memuat `Dockerfile` dan `railway.toml`. Ketika repository dihubungkan ke Railway:
1. Hubungkan repository GitHub ke layanan Railway.
2. Di Railway **Settings**, atur **Root Directory** ke: `Rekap Excel Otomatis`.
3. Railway akan mendeteksi `Dockerfile` secara otomatis dan melakukan build multi-stage yang hemat sumber daya.
4. Atur variabel lingkungan berikut di menu **Variables** Railway:
   - `NEXT_PUBLIC_SUPABASE_URL`: URL proyek Supabase Anda.
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Kunci anon Supabase.
   - `SUPABASE_URL`: URL proyek Supabase Anda.
   - `SUPABASE_ANON_KEY`: Kunci anon Supabase.
   - `SUPABASE_SERVICE_ROLE_KEY`: Kunci service_role Supabase (rahasia, server-side only).
5. Deploy akan berjalan otomatis dan menghasilkan domain publik HTTPS yang siap digunakan.

---

## 📊 Alur Kerja Aplikasi (Workflow)

1. **Autentikasi**: Pengguna masuk via form login atau mendaftarkan tenant perusahaan baru.
2. **Unggah File**: Pengguna mengunggah file `.xlsx` atau `.csv`. Sistem memverifikasi biner magic-bytes dan melakukan sanitasi formula.
3. **Pratinjau Data**: Ditampilkan 10 baris pertama data berserta deteksi tipe kolom (angka, teks, tanggal) dan peringatan sel yang dinetralkan.
4. **Konfigurasi Agregasi**: Pengguna memilih kolom pengelompokan (*Group By*), kolom metrik angka, serta metode agregasi (`SUM`, `AVERAGE`, `COUNT`, `MIN`, `MAX`).
5. **Dashboard Hasil**: Visualisasi interaktif disajikan menggunakan grafik batang (*Bar Chart*) dan garis (*Line Chart*) dari Recharts beserta tabel rekap.
6. **Ekspor Excel**: Hasil rekap dapat diunduh kembali dalam bentuk file spreadsheet `.xlsx` resmi yang memuat lembar ringkasan dan lembar audit metadata.
7. **Audit & Log**: Setiap aktivitas tercatat dalam tabel `activity_log` yang dapat ditinjau oleh Admin tenant.
