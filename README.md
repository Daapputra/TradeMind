# 📈 TradeMind - Personal Trading Journal

Selamat datang di repositori **TradeMind**! Ini adalah aplikasi jurnal trading sederhana yang saya bangun untuk mencatat, melacak, dan mengevaluasi performa trading harian. 

Sebagai trader, seringkali kita lupa bahwa **data dan psikologi** adalah kunci utama. Aplikasi ini dibuat spesifik untuk menjawab kebutuhan itu: *gak* cuma mencatat profit/loss, tapi juga mencatat *setup* apa yang dipakai, dan bagaimana kondisi emosi kita saat nge-klik tombol "Buy" atau "Sell".

## 🚀 Kenapa Bikin Jurnal Sendiri?
Jurnal Excel itu bagus, tapi kadang bikin males ngisinya karena kurang interaktif. Di sini, setiap kali kita input data, dashboard analitik bakal langsung update secara otomatis.
- **Visualisasi Jelas:** Ada grafik P/L, Drawdown, dan Equity curve berbasis Risk (R).
- **Fokus ke Proses, Bukan Cuma Uang:** Form inputnya didesain ringkas. Fokus ke Pips dan rasio *Risk/Reward* (RR), bukan sekadar angka dolar.
- **Trek Psikologi:** Bisa lihat apakah kita sering loss karena *FOMO* atau *Revenge Trading*.

## ✨ Fitur Saat Ini
- **Dashboard KPI:** 8 kartu statistik mulai dari Win Rate, Net Pips, Average RR, sampai Max Drawdown.
- **Advanced Charts:** Filter data berdasarkan 7D, 30D, sampai 1 Tahun. Grafik interaktif memisahkan Equity, P/L per trade, dan Drawdown.
- **Manajemen Jurnal:** Input trade baru, edit catatan yang salah, hapus trade, dan lampirkan *screenshot* (langsung tersimpan di cloud).
- **Responsive:** Bisa dibuka lewat HP atau Laptop.

## 🛠️ Tech Stack yang Dipakai
- **Framework:** Next.js 16 (App Router) + React 19
- **Bahasa:** TypeScript
- **Styling:** Tailwind CSS v4 + Lucide Icons
- **Chart:** Recharts (Biar grafiknya mulus)
- **Database & Storage:** Supabase (Biar gratis dan gampang setup-nya ✌️)

## 💻 Cara Install & Jalanin di Local
Kalau kamu mau coba *clone* dan pake buat jurnal pribadi kamu, silakan ikuti cara ini:

1. **Clone repo ini**
   ```bash
   git clone https://github.com/Daapputra/TradeMind.git
   cd TradeMind
   ```

2. **Install paket npm**
   ```bash
   npm install
   ```

3. **Setup Supabase**
   Bikin project baru di Supabase. Terus, buat file `.env.local` di folder paling luar, isinya:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=link_project_supabase_kamu
   NEXT_PUBLIC_SUPABASE_ANON_KEY=anon_key_supabase_kamu
   ```

4. **Siapkan Database**
   Bikin tabel `jurnal` di Supabase kamu dengan kolom:
   - `id` (int8 / auto increment)
   - `tanggal` (date)
   - `market` (text)
   - `pair` (text)
   - `setup` (text)
   - `emosi` (text)
   - `status` (text: PROFIT, LOSS, BE)
   - `hasil_pips` (numeric)
   - `risk` (numeric)
   - `target` (numeric)
   - `catatan` (text)
   - `gambar_url` (text)
   *(Jangan lupa bikin Bucket Storage bernama `screenshots` biar fitur upload gambarnya jalan!)*

5. **Gass jalankan**
   ```bash
   npm run dev
   ```
   Buka `http://localhost:3000` dan selamat mencatat jurnal!

---
*Dibuat untuk disiplin dan evaluasi mandiri.* 🥂
