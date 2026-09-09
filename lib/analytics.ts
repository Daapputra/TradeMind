// Semua perhitungan statistik jurnal trading dikumpulkan di sini supaya
// komponen tampilan cukup membaca hasilnya saja.

export type TradeStatus = "PROFIT" | "LOSS" | "BE";

export type Trade = {
  id?: number | string | null;
  tanggal?: string | null;
  market?: string | null;
  pair?: string | null;
  setup?: string | null;
  emosi?: string | null;
  status?: string | null;
  hasil_pips?: number | string | null;
  risk?: number | string | null;
  target?: number | string | null;
  catatan?: string | null;
  gambar_url?: string | null;
};

/** Trade yang sudah dinormalkan: pips bertanda, R aktual, dan RR rencana. */
export type TradeMetrics = Trade & {
  status: TradeStatus;
  date: Date | null;
  pips: number;
  risk: number;
  target: number;
  r: number;
  plannedRr: number;
};

export const PERIODS = ["7D", "30D", "3M", "6M", "1Y", "ALL"] as const;
export type Period = (typeof PERIODS)[number];

export const PERIOD_LABEL: Record<Period, string> = {
  "7D": "7 hari terakhir",
  "30D": "30 hari terakhir",
  "3M": "3 bulan terakhir",
  "6M": "6 bulan terakhir",
  "1Y": "1 tahun terakhir",
  ALL: "Seluruh riwayat",
};

const HARI = ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"];
const BULAN = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];

/** "2026-09-09" dibaca sebagai tanggal lokal, bukan UTC, agar hari tidak bergeser. */
export function parseTanggal(value?: string | null): Date | null {
  if (!value) return null;
  const [y, m, d] = String(value).slice(0, 10).split("-").map(Number);
  if (!y || !m || !d) return null;
  const date = new Date(y, m - 1, d);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function formatTanggal(value?: string | null): string {
  const date = parseTanggal(value);
  if (!date) return "-";
  return `${date.getDate()} ${BULAN[date.getMonth()]} ${date.getFullYear()}`;
}

export function formatTanggalPendek(value?: string | null): string {
  const date = parseTanggal(value);
  if (!date) return "-";
  return `${date.getDate()} ${BULAN[date.getMonth()]}`;
}

export function normalizeTrades(rows: Trade[]): TradeMetrics[] {
  return rows
    .map((row) => {
      const status: TradeStatus =
        row.status === "PROFIT" ? "PROFIT" : row.status === "LOSS" ? "LOSS" : "BE";

      // hasil_pips disimpan sebagai besaran; tandanya ditentukan oleh status.
      const besaran = Math.abs(Number(row.hasil_pips) || 0);
      const risk = Math.abs(Number(row.risk) || 0);
      const target = Math.abs(Number(row.target) || 0);
      const pips = status === "PROFIT" ? besaran : status === "LOSS" ? -besaran : 0;

      return {
        ...row,
        status,
        date: parseTanggal(row.tanggal),
        pips,
        risk,
        target,
        r: risk > 0 ? pips / risk : 0,
        plannedRr: risk > 0 ? target / risk : 0,
      };
    })
    .sort((a, b) => {
      const ta = a.date ? a.date.getTime() : 0;
      const tb = b.date ? b.date.getTime() : 0;
      if (ta !== tb) return ta - tb;
      return Number(a.id ?? 0) - Number(b.id ?? 0);
    });
}

function awalPeriode(period: Period, now: Date): Date | null {
  const d = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  if (period === "7D") d.setDate(d.getDate() - 6);
  else if (period === "30D") d.setDate(d.getDate() - 29);
  else if (period === "3M") d.setMonth(d.getMonth() - 3);
  else if (period === "6M") d.setMonth(d.getMonth() - 6);
  else if (period === "1Y") d.setFullYear(d.getFullYear() - 1);
  else return null;
  return d;
}

/** Membagi riwayat menjadi periode berjalan dan periode sebelumnya (untuk perbandingan). */
export function splitByPeriod(trades: TradeMetrics[], period: Period, now = new Date()) {
  const start = awalPeriode(period, now);
  if (!start) return { current: trades, previous: [] as TradeMetrics[], start: null as Date | null };

  const startMs = start.getTime();
  const endMs = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999).getTime();
  const prevStartMs = startMs - (endMs - startMs);

  const current: TradeMetrics[] = [];
  const previous: TradeMetrics[] = [];
  for (const t of trades) {
    if (!t.date) continue;
    const ms = t.date.getTime();
    if (ms >= startMs && ms <= endMs) current.push(t);
    else if (ms >= prevStartMs && ms < startMs) previous.push(t);
  }
  return { current, previous, start };
}

export type Streak = { type: "WIN" | "LOSS" | "NONE"; count: number };

export type Stats = {
  total: number;
  wins: number;
  losses: number;
  breakEven: number;
  decisive: number;
  winRate: number;
  lossRate: number;
  grossProfitPips: number;
  grossLossPips: number;
  netPips: number;
  grossProfitR: number;
  grossLossR: number;
  netR: number;
  /** null berarti belum ada loss sama sekali (tak berhingga). */
  profitFactor: number | null;
  expectancyR: number;
  expectancyPips: number;
  avgWinPips: number;
  avgLossPips: number;
  avgWinR: number;
  avgLossR: number;
  /** avgWin / avgLoss; null bila belum ada loss. */
  payoff: number | null;
  maxDrawdownR: number;
  maxDrawdownPips: number;
  bestR: number;
  worstR: number;
  bestTrade: TradeMetrics | null;
  worstTrade: TradeMetrics | null;
  longestWinStreak: number;
  longestLossStreak: number;
  currentStreak: Streak;
  avgPlannedRr: number;
  activeDays: number;
  firstDate: Date | null;
  lastDate: Date | null;
};

export const EMPTY_STATS: Stats = {
  total: 0, wins: 0, losses: 0, breakEven: 0, decisive: 0, winRate: 0, lossRate: 0,
  grossProfitPips: 0, grossLossPips: 0, netPips: 0,
  grossProfitR: 0, grossLossR: 0, netR: 0,
  profitFactor: null, expectancyR: 0, expectancyPips: 0,
  avgWinPips: 0, avgLossPips: 0, avgWinR: 0, avgLossR: 0, payoff: null,
  maxDrawdownR: 0, maxDrawdownPips: 0, bestR: 0, worstR: 0,
  bestTrade: null, worstTrade: null,
  longestWinStreak: 0, longestLossStreak: 0, currentStreak: { type: "NONE", count: 0 },
  avgPlannedRr: 0, activeDays: 0, firstDate: null, lastDate: null,
};

export function computeStats(trades: TradeMetrics[]): Stats {
  if (trades.length === 0) return EMPTY_STATS;

  let wins = 0, losses = 0, breakEven = 0;
  let grossProfitPips = 0, grossLossPips = 0;
  let grossProfitR = 0, grossLossR = 0;
  let plannedTotal = 0, plannedCount = 0;

  let saldoR = 0, puncakR = 0, maxDrawdownR = 0;
  let saldoPips = 0, puncakPips = 0, maxDrawdownPips = 0;

  let winStreak = 0, lossStreak = 0, longestWinStreak = 0, longestLossStreak = 0;
  let bestTrade: TradeMetrics | null = null;
  let worstTrade: TradeMetrics | null = null;

  const hariAktif = new Set<string>();

  for (const t of trades) {
    if (t.status === "PROFIT") {
      wins += 1;
      grossProfitPips += t.pips;
      grossProfitR += t.r;
      winStreak += 1;
      lossStreak = 0;
      if (winStreak > longestWinStreak) longestWinStreak = winStreak;
    } else if (t.status === "LOSS") {
      losses += 1;
      grossLossPips += Math.abs(t.pips);
      grossLossR += Math.abs(t.r);
      lossStreak += 1;
      winStreak = 0;
      if (lossStreak > longestLossStreak) longestLossStreak = lossStreak;
    } else {
      breakEven += 1;
      // BE tidak memutus rangkaian menang maupun kalah.
    }

    if (t.plannedRr > 0) {
      plannedTotal += t.plannedRr;
      plannedCount += 1;
    }

    saldoR += t.r;
    if (saldoR > puncakR) puncakR = saldoR;
    if (puncakR - saldoR > maxDrawdownR) maxDrawdownR = puncakR - saldoR;

    saldoPips += t.pips;
    if (saldoPips > puncakPips) puncakPips = saldoPips;
    if (puncakPips - saldoPips > maxDrawdownPips) maxDrawdownPips = puncakPips - saldoPips;

    if (!bestTrade || t.r > bestTrade.r) bestTrade = t;
    if (!worstTrade || t.r < worstTrade.r) worstTrade = t;

    if (t.tanggal) hariAktif.add(String(t.tanggal).slice(0, 10));
  }

  const total = trades.length;
  const decisive = wins + losses;
  const netPips = grossProfitPips - grossLossPips;
  const netR = grossProfitR - grossLossR;

  const currentStreak: Streak =
    winStreak > 0
      ? { type: "WIN", count: winStreak }
      : lossStreak > 0
        ? { type: "LOSS", count: lossStreak }
        : { type: "NONE", count: 0 };

  const tanggalAda = trades.map((t) => t.date).filter((d): d is Date => d instanceof Date);

  return {
    total,
    wins,
    losses,
    breakEven,
    decisive,
    winRate: decisive > 0 ? (wins / decisive) * 100 : 0,
    lossRate: decisive > 0 ? (losses / decisive) * 100 : 0,
    grossProfitPips,
    grossLossPips,
    netPips,
    grossProfitR,
    grossLossR,
    netR,
    profitFactor: grossLossR > 0 ? grossProfitR / grossLossR : null,
    expectancyR: netR / total,
    expectancyPips: netPips / total,
    avgWinPips: wins > 0 ? grossProfitPips / wins : 0,
    avgLossPips: losses > 0 ? grossLossPips / losses : 0,
    avgWinR: wins > 0 ? grossProfitR / wins : 0,
    avgLossR: losses > 0 ? grossLossR / losses : 0,
    payoff:
      wins > 0 && losses > 0 && grossLossR > 0
        ? grossProfitR / wins / (grossLossR / losses)
        : null,
    maxDrawdownR,
    maxDrawdownPips,
    bestR: bestTrade ? (bestTrade as TradeMetrics).r : 0,
    worstR: worstTrade ? (worstTrade as TradeMetrics).r : 0,
    bestTrade,
    worstTrade,
    longestWinStreak,
    longestLossStreak,
    currentStreak,
    avgPlannedRr: plannedCount > 0 ? plannedTotal / plannedCount : 0,
    activeDays: hariAktif.size,
    firstDate: tanggalAda.length ? tanggalAda[0] : null,
    lastDate: tanggalAda.length ? tanggalAda[tanggalAda.length - 1] : null,
  };
}

export type EquityPoint = {
  idx: number;
  label: string;
  tanggal: string;
  pair: string;
  status: TradeStatus;
  r: number;
  pips: number;
  cumR: number;
  cumPips: number;
  /** Selalu <= 0, jarak dari puncak ekuitas. */
  ddR: number;
  ddPips: number;
};

export function buildEquitySeries(trades: TradeMetrics[]): EquityPoint[] {
  let cumR = 0, cumPips = 0, puncakR = 0, puncakPips = 0;

  return trades.map((t, i) => {
    cumR += t.r;
    cumPips += t.pips;
    if (cumR > puncakR) puncakR = cumR;
    if (cumPips > puncakPips) puncakPips = cumPips;

    return {
      idx: i + 1,
      label: `#${i + 1}`,
      tanggal: String(t.tanggal ?? ""),
      pair: String(t.pair ?? "-"),
      status: t.status,
      r: Number(t.r.toFixed(2)),
      pips: t.pips,
      cumR: Number(cumR.toFixed(2)),
      cumPips: Number(cumPips.toFixed(1)),
      ddR: Number((cumR - puncakR).toFixed(2)),
      ddPips: Number((cumPips - puncakPips).toFixed(1)),
    };
  });
}

export type GroupStat = {
  key: string;
  trades: number;
  wins: number;
  losses: number;
  breakEven: number;
  winRate: number;
  netR: number;
  netPips: number;
  avgR: number;
};

export function groupStats(
  trades: TradeMetrics[],
  pick: (t: TradeMetrics) => string | null | undefined,
): GroupStat[] {
  const peta = new Map<string, GroupStat>();

  for (const t of trades) {
    const raw = pick(t);
    const key = raw && String(raw).trim() ? String(raw).trim() : "Tidak diisi";
    let g = peta.get(key);
    if (!g) {
      g = { key, trades: 0, wins: 0, losses: 0, breakEven: 0, winRate: 0, netR: 0, netPips: 0, avgR: 0 };
      peta.set(key, g);
    }
    g.trades += 1;
    if (t.status === "PROFIT") g.wins += 1;
    else if (t.status === "LOSS") g.losses += 1;
    else g.breakEven += 1;
    g.netR += t.r;
    g.netPips += t.pips;
  }

  return [...peta.values()]
    .map((g) => ({
      ...g,
      netR: Number(g.netR.toFixed(2)),
      netPips: Number(g.netPips.toFixed(1)),
      winRate: g.wins + g.losses > 0 ? (g.wins / (g.wins + g.losses)) * 100 : 0,
      avgR: g.trades > 0 ? Number((g.netR / g.trades).toFixed(2)) : 0,
    }))
    .sort((a, b) => b.netR - a.netR);
}

export type PeriodBucket = {
  key: string;
  trades: number;
  winRate: number;
  netR: number;
  netPips: number;
};

/** Senin sampai Minggu, tetap urut walau ada hari yang kosong. */
export function statsPerHari(trades: TradeMetrics[]): PeriodBucket[] {
  const urutan = [1, 2, 3, 4, 5, 6, 0];
  const grup = groupStats(trades, (t) => (t.date ? String(t.date.getDay()) : null));
  return urutan.map((hari) => {
    const g = grup.find((item) => item.key === String(hari));
    return {
      key: HARI[hari],
      trades: g ? g.trades : 0,
      winRate: g ? g.winRate : 0,
      netR: g ? g.netR : 0,
      netPips: g ? g.netPips : 0,
    };
  });
}

/** Bulan berurutan tanpa lompatan, dibatasi `maksimal` bulan terakhir. */
export function statsPerBulan(trades: TradeMetrics[], maksimal = 12): PeriodBucket[] {
  const bertanggal = trades.filter((t) => t.date);
  if (bertanggal.length === 0) return [];

  const peta = new Map<string, { netR: number; netPips: number; trades: number; wins: number; losses: number }>();
  for (const t of bertanggal) {
    const d = t.date as Date;
    const kunci = `${d.getFullYear()}-${d.getMonth()}`;
    const g = peta.get(kunci) ?? { netR: 0, netPips: 0, trades: 0, wins: 0, losses: 0 };
    g.netR += t.r;
    g.netPips += t.pips;
    g.trades += 1;
    if (t.status === "PROFIT") g.wins += 1;
    else if (t.status === "LOSS") g.losses += 1;
    peta.set(kunci, g);
  }

  const awal = bertanggal[0].date as Date;
  const akhir = bertanggal[bertanggal.length - 1].date as Date;
  const hasil: PeriodBucket[] = [];

  const cursor = new Date(awal.getFullYear(), awal.getMonth(), 1);
  const batas = new Date(akhir.getFullYear(), akhir.getMonth(), 1);
  while (cursor <= batas) {
    const kunci = `${cursor.getFullYear()}-${cursor.getMonth()}`;
    const g = peta.get(kunci);
    hasil.push({
      key: `${BULAN[cursor.getMonth()]} ${String(cursor.getFullYear()).slice(2)}`,
      netR: g ? Number(g.netR.toFixed(2)) : 0,
      netPips: g ? Number(g.netPips.toFixed(1)) : 0,
      trades: g ? g.trades : 0,
      winRate: g && g.wins + g.losses > 0 ? (g.wins / (g.wins + g.losses)) * 100 : 0,
    });
    cursor.setMonth(cursor.getMonth() + 1);
  }

  return hasil.slice(-maksimal);
}

// --- Pemformat angka -------------------------------------------------------

export function fmtSigned(value: number, digits = 2): string {
  const dibulatkan = Number(value.toFixed(digits));
  const tanda = dibulatkan === 0 ? "" : dibulatkan > 0 ? "+" : "−";
  return `${tanda}${Math.abs(dibulatkan).toFixed(digits)}`;
}

export function fmtR(value: number): string {
  return `${fmtSigned(value, 2)}R`;
}

export function fmtPips(value: number): string {
  const digits = Number.isInteger(Number(value.toFixed(1))) ? 0 : 1;
  return `${fmtSigned(value, digits)} pips`;
}

export function fmtPersen(value: number, digits = 1): string {
  return `${value.toFixed(digits)}%`;
}

export function fmtRasio(value: number | null): string {
  if (value === null) return "∞";
  return value.toFixed(2);
}
