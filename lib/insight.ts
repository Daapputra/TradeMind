// Analisa lanjutan di atas lib/analytics: kalender harian, distribusi hasil,
// matriks setup x emosi, deteksi pola psikologi, dan ekspor data.

import {
  computeStats,
  type Stats,
  type Trade,
  type TradeMetrics,
} from "./analytics";

const BULAN_PANJANG = [
  "Januari", "Februari", "Maret", "April", "Mei", "Juni",
  "Juli", "Agustus", "September", "Oktober", "November", "Desember",
];

export const HARI_PENDEK = ["Sen", "Sel", "Rab", "Kam", "Jum", "Sab", "Min"];

export function kunciTanggal(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function namaBulan(tahun: number, bulan: number): string {
  return `${BULAN_PANJANG[bulan]} ${tahun}`;
}

// --- Rekap harian dan kalender --------------------------------------------

export type HariStat = {
  tanggal: string;
  trades: number;
  wins: number;
  losses: number;
  breakEven: number;
  netR: number;
  netPips: number;
};

export function statsPerTanggal(trades: TradeMetrics[]): Map<string, HariStat> {
  const peta = new Map<string, HariStat>();
  for (const t of trades) {
    if (!t.date) continue;
    const kunci = kunciTanggal(t.date);
    const g =
      peta.get(kunci) ??
      { tanggal: kunci, trades: 0, wins: 0, losses: 0, breakEven: 0, netR: 0, netPips: 0 };
    g.trades += 1;
    if (t.status === "PROFIT") g.wins += 1;
    else if (t.status === "LOSS") g.losses += 1;
    else g.breakEven += 1;
    g.netR += t.r;
    g.netPips += t.pips;
    peta.set(kunci, g);
  }
  for (const g of peta.values()) {
    g.netR = Number(g.netR.toFixed(2));
    g.netPips = Number(g.netPips.toFixed(1));
  }
  return peta;
}

export type SelKalender = {
  tanggal: string;
  nomor: number;
  diBulanIni: boolean;
  stat: HariStat | null;
};

export type MingguKalender = { sel: SelKalender[]; netR: number; trades: number };

/** Kisi kalender mulai hari Senin, termasuk sisa hari dari bulan tetangga. */
export function bangunKalender(
  tahun: number,
  bulan: number,
  peta: Map<string, HariStat>,
): MingguKalender[] {
  const pertama = new Date(tahun, bulan, 1);
  const geser = (pertama.getDay() + 6) % 7; // Senin dianggap kolom pertama
  const cursor = new Date(tahun, bulan, 1 - geser);
  const hariTerakhir = new Date(tahun, bulan + 1, 0);
  const minggu: MingguKalender[] = [];

  for (let w = 0; w < 6; w++) {
    const sel: SelKalender[] = [];
    let netR = 0;
    let trades = 0;

    for (let d = 0; d < 7; d++) {
      const kunci = kunciTanggal(cursor);
      const diBulanIni = cursor.getMonth() === bulan && cursor.getFullYear() === tahun;
      const stat = diBulanIni ? (peta.get(kunci) ?? null) : null;
      if (stat) {
        netR += stat.netR;
        trades += stat.trades;
      }
      sel.push({ tanggal: kunci, nomor: cursor.getDate(), diBulanIni, stat });
      cursor.setDate(cursor.getDate() + 1);
    }

    minggu.push({ sel, netR: Number(netR.toFixed(2)), trades });
    if (cursor > hariTerakhir) break;
  }

  return minggu;
}

export function tradeDiTanggal(trades: TradeMetrics[], tanggal: string): TradeMetrics[] {
  return trades.filter((t) => t.date && kunciTanggal(t.date) === tanggal);
}

export function tradeDiBulan(trades: TradeMetrics[], tahun: number, bulan: number): TradeMetrics[] {
  return trades.filter((t) => t.date && t.date.getFullYear() === tahun && t.date.getMonth() === bulan);
}

// --- Distribusi dan deret lanjutan ----------------------------------------

export type EmberR = { label: string; jumlah: number; positif: boolean };

const EMBER: { label: string; positif: boolean; uji: (r: number) => boolean }[] = [
  { label: "≤ −2R", positif: false, uji: (r) => r <= -2 },
  { label: "−2 s/d −1R", positif: false, uji: (r) => r > -2 && r <= -1 },
  { label: "−1 s/d 0R", positif: false, uji: (r) => r > -1 && r < 0 },
  { label: "0R", positif: true, uji: (r) => r === 0 },
  { label: "0 s/d 1R", positif: true, uji: (r) => r > 0 && r <= 1 },
  { label: "1 s/d 2R", positif: true, uji: (r) => r > 1 && r <= 2 },
  { label: "2 s/d 3R", positif: true, uji: (r) => r > 2 && r <= 3 },
  { label: "> 3R", positif: true, uji: (r) => r > 3 },
];

export function distribusiR(trades: TradeMetrics[]): EmberR[] {
  return EMBER.map((e) => ({
    label: e.label,
    positif: e.positif,
    jumlah: trades.filter((t) => e.uji(Number(t.r.toFixed(4)))).length,
  }));
}

export type TitikBergulir = { label: string; nilai: number; tanggal: string };

/** Rata-rata R pada `jendela` trade terakhir, digeser satu per satu. */
export function ekspektasiBergulir(trades: TradeMetrics[], jendela = 10): TitikBergulir[] {
  if (trades.length < jendela) return [];
  const hasil: TitikBergulir[] = [];
  let jumlah = 0;
  for (let i = 0; i < trades.length; i++) {
    jumlah += trades[i].r;
    if (i >= jendela) jumlah -= trades[i - jendela].r;
    if (i >= jendela - 1) {
      hasil.push({
        label: `#${i + 1}`,
        nilai: Number((jumlah / jendela).toFixed(3)),
        tanggal: String(trades[i].tanggal ?? ""),
      });
    }
  }
  return hasil;
}

export function simpanganBaku(nilai: number[]): number {
  if (nilai.length < 2) return 0;
  const rata = nilai.reduce((a, b) => a + b, 0) / nilai.length;
  const ragam = nilai.reduce((a, b) => a + (b - rata) ** 2, 0) / (nilai.length - 1);
  return Math.sqrt(ragam);
}

export type Risiko = {
  rata: number;
  simpangan: number;
  /** Koefisien variasi; makin kecil makin konsisten ukuran risikonya. */
  cv: number;
  data: { label: string; risk: number; tanggal: string }[];
};

export function konsistensiRisiko(trades: TradeMetrics[]): Risiko {
  const dipakai = trades.filter((t) => t.risk > 0);
  const nilai = dipakai.map((t) => t.risk);
  const rata = nilai.length ? nilai.reduce((a, b) => a + b, 0) / nilai.length : 0;
  const simpangan = simpanganBaku(nilai);
  return {
    rata: Number(rata.toFixed(1)),
    simpangan: Number(simpangan.toFixed(1)),
    cv: rata > 0 ? Number((simpangan / rata).toFixed(3)) : 0,
    data: dipakai.map((t, i) => ({
      label: `#${i + 1}`,
      risk: t.risk,
      tanggal: String(t.tanggal ?? ""),
    })),
  };
}

export type StatLanjutan = {
  simpanganR: number;
  /** Rata-rata R dibagi simpangannya; ukuran mutu hasil per satuan gejolak. */
  rasioKestabilan: number;
  /** Net R dibagi drawdown terdalam. */
  recoveryFactor: number | null;
  cvRisiko: number;
};

export function statistikLanjutan(trades: TradeMetrics[], stats: Stats): StatLanjutan {
  const nilaiR = trades.map((t) => t.r);
  const simpanganR = simpanganBaku(nilaiR);
  const risiko = konsistensiRisiko(trades);
  return {
    simpanganR: Number(simpanganR.toFixed(2)),
    rasioKestabilan: simpanganR > 0 ? Number((stats.expectancyR / simpanganR).toFixed(2)) : 0,
    recoveryFactor: stats.maxDrawdownR > 0 ? Number((stats.netR / stats.maxDrawdownR).toFixed(2)) : null,
    cvRisiko: risiko.cv,
  };
}

// --- Matriks setup x emosi -------------------------------------------------

export type SelMatriks = { trades: number; netR: number; winRate: number };

export type Matriks = {
  baris: string[];
  kolom: string[];
  sel: Map<string, SelMatriks>;
  puncak: number;
};

function kunciSel(baris: string, kolom: string) {
  return `${baris}||${kolom}`;
}

export function ambilSel(m: Matriks, baris: string, kolom: string): SelMatriks | null {
  return m.sel.get(kunciSel(baris, kolom)) ?? null;
}

/** Silang dua dimensi kategori, dibatasi kategori paling sering dipakai. */
export function bangunMatriks(
  trades: TradeMetrics[],
  ambilBaris: (t: TradeMetrics) => string | null | undefined,
  ambilKolom: (t: TradeMetrics) => string | null | undefined,
  maks = 6,
): Matriks {
  const hitungBaris = new Map<string, number>();
  const hitungKolom = new Map<string, number>();
  const sel = new Map<string, SelMatriks & { wins: number; losses: number }>();

  for (const t of trades) {
    const b = (ambilBaris(t) || "").trim();
    const k = (ambilKolom(t) || "").trim();
    if (!b || !k) continue;

    hitungBaris.set(b, (hitungBaris.get(b) ?? 0) + 1);
    hitungKolom.set(k, (hitungKolom.get(k) ?? 0) + 1);

    const kunci = kunciSel(b, k);
    const g = sel.get(kunci) ?? { trades: 0, netR: 0, winRate: 0, wins: 0, losses: 0 };
    g.trades += 1;
    g.netR += t.r;
    if (t.status === "PROFIT") g.wins += 1;
    else if (t.status === "LOSS") g.losses += 1;
    sel.set(kunci, g);
  }

  const urut = (peta: Map<string, number>) =>
    [...peta.entries()].sort((a, b) => b[1] - a[1]).slice(0, maks).map(([k]) => k);

  const baris = urut(hitungBaris);
  const kolom = urut(hitungKolom);

  const bersih = new Map<string, SelMatriks>();
  let puncak = 0;
  for (const b of baris) {
    for (const k of kolom) {
      const g = sel.get(kunciSel(b, k));
      if (!g) continue;
      const netR = Number(g.netR.toFixed(2));
      bersih.set(kunciSel(b, k), {
        trades: g.trades,
        netR,
        winRate: g.wins + g.losses > 0 ? (g.wins / (g.wins + g.losses)) * 100 : 0,
      });
      puncak = Math.max(puncak, Math.abs(netR));
    }
  }

  return { baris, kolom, sel: bersih, puncak: puncak || 1 };
}

// --- Pola psikologi --------------------------------------------------------

export const EMOSI_BERISIKO = ["FOMO", "Revenge", "Serakah", "Overconfidence", "Ragu-ragu"];

export type Pola = {
  kunci: string;
  judul: string;
  deskripsi: string;
  /** Trade yang cocok dengan pola ini. */
  cocok: Stats;
  /** Trade sisanya, sebagai pembanding. */
  sisa: Stats;
  /** true bila pola ini merugikan dibanding sisanya. */
  merugikan: boolean;
};

function belah(trades: TradeMetrics[], uji: (t: TradeMetrics, i: number) => boolean) {
  const cocok: TradeMetrics[] = [];
  const sisa: TradeMetrics[] = [];
  trades.forEach((t, i) => (uji(t, i) ? cocok : sisa).push(t));
  return { cocok, sisa };
}

/** Trade yang dibuka di hari yang sama tepat setelah sebuah kerugian. */
export function indeksBalasDendam(trades: TradeMetrics[]): Set<number> {
  const hasil = new Set<number>();
  for (let i = 1; i < trades.length; i++) {
    const sebelum = trades[i - 1];
    const kini = trades[i];
    if (sebelum.status !== "LOSS") continue;
    if (!sebelum.date || !kini.date) continue;
    if (kunciTanggal(sebelum.date) === kunciTanggal(kini.date)) hasil.add(i);
  }
  return hasil;
}

export function polaPsikologi(trades: TradeMetrics[], ambangOvertrade = 3): Pola[] {
  const hasil: Pola[] = [];
  if (trades.length < 4) return hasil;

  const perHari = statsPerTanggal(trades);
  const balasDendam = indeksBalasDendam(trades);

  const daftar: { kunci: string; judul: string; deskripsi: string; uji: (t: TradeMetrics, i: number) => boolean }[] = [
    {
      kunci: "balas-dendam",
      judul: "Trade balas dendam",
      deskripsi: "Entry yang dibuka di hari yang sama tepat setelah kena loss.",
      uji: (_t, i) => balasDendam.has(i),
    },
    {
      kunci: "overtrading",
      judul: "Overtrading",
      deskripsi: `Entry pada hari dengan ${ambangOvertrade} trade atau lebih.`,
      uji: (t) => {
        if (!t.date) return false;
        const g = perHari.get(kunciTanggal(t.date));
        return !!g && g.trades >= ambangOvertrade;
      },
    },
    {
      kunci: "emosi-berisiko",
      judul: "Entry dengan emosi berisiko",
      deskripsi: "Entry saat FOMO, revenge, serakah, overconfidence, atau ragu-ragu.",
      uji: (t) => EMOSI_BERISIKO.includes(String(t.emosi ?? "")),
    },
    {
      kunci: "setelah-menang",
      judul: "Entry setelah menang",
      deskripsi: "Trade yang dibuka tepat sesudah trade profit.",
      uji: (_t, i) => i > 0 && trades[i - 1].status === "PROFIT",
    },
  ];

  for (const d of daftar) {
    const { cocok, sisa } = belah(trades, d.uji);
    if (cocok.length === 0) continue;
    const statCocok = computeStats(cocok);
    const statSisa = computeStats(sisa);
    hasil.push({
      kunci: d.kunci,
      judul: d.judul,
      deskripsi: d.deskripsi,
      cocok: statCocok,
      sisa: statSisa,
      merugikan: sisa.length > 0 ? statCocok.expectancyR < statSisa.expectancyR : statCocok.expectancyR < 0,
    });
  }

  return hasil;
}

export type KomponenDisiplin = { nama: string; nilai: number; bobot: number; detail: string };
export type Disiplin = { skor: number; komponen: KomponenDisiplin[] };

/** Skor 0-100 dari lima kebiasaan yang bisa dikendalikan trader. */
export function skorDisiplin(trades: TradeMetrics[]): Disiplin {
  if (trades.length === 0) return { skor: 0, komponen: [] };

  const total = trades.length;
  const tenang = trades.filter((t) => String(t.emosi ?? "") === "Tenang").length;

  const rugi = trades.filter((t) => t.status === "LOSS" && t.risk > 0);
  const rugiTerkendali = rugi.filter((t) => Math.abs(t.r) <= 1.1).length;

  const risiko = konsistensiRisiko(trades);
  const nilaiKonsistensi = risiko.rata > 0 ? Math.max(0, 100 - risiko.cv * 200) : 0;

  const adaCatatan = trades.filter((t) => String(t.catatan ?? "").trim().length >= 10).length;
  const balasDendam = indeksBalasDendam(trades).size;

  const komponen: KomponenDisiplin[] = [
    {
      nama: "Ketenangan entry",
      nilai: (tenang / total) * 100,
      bobot: 25,
      detail: `${tenang} dari ${total} entry dilakukan dalam kondisi tenang.`,
    },
    {
      nama: "Kepatuhan stop loss",
      nilai: rugi.length > 0 ? (rugiTerkendali / rugi.length) * 100 : 100,
      bobot: 25,
      detail:
        rugi.length > 0
          ? `${rugiTerkendali} dari ${rugi.length} kerugian berhenti di sekitar 1R.`
          : "Belum ada kerugian pada periode ini.",
    },
    {
      nama: "Konsistensi ukuran risiko",
      nilai: nilaiKonsistensi,
      bobot: 20,
      detail: `Rata-rata risiko ${risiko.rata} pips dengan simpangan ${risiko.simpangan} pips.`,
    },
    {
      nama: "Kelengkapan catatan",
      nilai: (adaCatatan / total) * 100,
      bobot: 15,
      detail: `${adaCatatan} dari ${total} trade punya catatan yang memadai.`,
    },
    {
      nama: "Bebas balas dendam",
      nilai: Math.max(0, 100 - (balasDendam / total) * 100 * 3),
      bobot: 15,
      detail:
        balasDendam > 0
          ? `${balasDendam} entry dibuka tepat setelah loss di hari yang sama.`
          : "Tidak ada entry menyusul kerugian di hari yang sama.",
    },
  ];

  const skor = komponen.reduce((a, k) => a + (Math.min(100, Math.max(0, k.nilai)) * k.bobot) / 100, 0);
  return { skor: Math.round(skor), komponen };
}

// --- Ekspor ----------------------------------------------------------------

const KOLOM_CSV = [
  "tanggal", "market", "pair", "setup", "emosi", "status",
  "hasil_pips", "risk", "target", "catatan", "gambar_url",
] as const;

function selCsv(nilai: unknown): string {
  const teks = nilai === null || nilai === undefined ? "" : String(nilai);
  return /[",\n]/.test(teks) ? `"${teks.replace(/"/g, '""')}"` : teks;
}

export function keCsv(rows: Trade[]): string {
  const baris = [KOLOM_CSV.join(",")];
  for (const r of rows) {
    baris.push(KOLOM_CSV.map((k) => selCsv((r as Record<string, unknown>)[k])).join(","));
  }
  return baris.join("\n");
}

export function unduhBerkas(namaBerkas: string, isi: string, tipe: string) {
  const blob = new Blob([isi], { type: `${tipe};charset=utf-8` });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = namaBerkas;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
