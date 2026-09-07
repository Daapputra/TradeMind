# Jurnal Trading

Aplikasi web sederhana untuk mencatat dan melacak performa trading. Dibuat buat mempermudah evaluasi setup, emosi, dan hasil (win rate & net pips) dari setiap trade.

## Fitur

*   **Pencatatan Detail**: Catat setiap posisi mulai dari pair, setup yang dipakai, target, risiko, hingga emosi saat entry.
*   **Statistik Otomatis**: Menghitung *Win Rate* dan *Net Pips* secara realtime.
*   **Grafik Equity Curve**: Visualisasi pertumbuhan pips dari waktu ke waktu.
*   **Manajemen Jurnal**: Bisa edit atau hapus catatan yang salah.

## Tech Stack

*   **Frontend**: Next.js 16 (App Router), React 19, TypeScript
*   **Styling & UI**: Tailwind CSS v4, shadcn/ui, Recharts
*   **Backend & Database**: Supabase (PostgreSQL)

## Persiapan & Cara Menjalankan

1.  **Clone repositori ini** (atau download ZIP-nya):
    ```bash
    git clone <url-repo>
    cd jurnal_trading
    ```

2.  **Install dependencies**:
    ```bash
    npm install
    ```

3.  **Setup Environment Variables**:
    Buat file `.env.local` di root folder dan isi dengan konfigurasi Supabase kamu:
    ```
    NEXT_PUBLIC_SUPABASE_URL=url_supabase_kamu
    NEXT_PUBLIC_SUPABASE_ANON_KEY=anon_key_supabase_kamu
    ```

4.  **Jalankan aplikasi di local**:
    ```bash
    npm run dev
    ```
    Buka `http://localhost:3000` di browser.

## Konfigurasi Database (Supabase)

Buat tabel bernama `jurnal` di Supabase dengan kolom-kolom berikut:
*   `id` (uuid / int8, Primary Key, auto increment)
*   `tanggal` (date)
*   `market` (text)
*   `pair` (text)
*   `setup` (text)
*   `emosi` (text)
*   `status` (text: PROFIT, LOSS, BE)
*   `hasil_pips` (numeric)
*   `risk` (numeric)
*   `target` (numeric)
*   `catatan` (text)
*   `created_at` (timestamp)

---

Dibuat untuk kebutuhan evaluasi mandiri. Kalau ada masukan atau mau bantu nambahin fitur, feel free to submit PR!
