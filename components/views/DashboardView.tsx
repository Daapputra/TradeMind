"use client";

import { useMemo, useState, type ReactNode } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  LabelList,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  Activity,
  Brain,
  CalendarDays,
  Coins,
  Flame,
  Gauge,
  Layers,
  Lightbulb,
  LineChart as LineChartIcon,
  Percent,
  Scale,
  ShieldAlert,
  Table as TableIcon,
  Target,
  Trophy,
  Wallet,
} from "lucide-react";

import { HariTick, SignedBar, SignedBarLabel } from "@/components/ui/charts";
import {
  COLOR,
  Card,
  CardHeader,
  CategoryBars,
  DeltaChip,
  EmptyState,
  MeterBagian,
  MiniTable,
  PageHeader,
  Pemisah,
  RING,
  Segmented,
  StatCard,
  StatusBadge,
  inkTanda,
} from "@/components/ui/kit";
import {
  PERIODS,
  PERIOD_LABEL,
  buildEquitySeries,
  computeStats,
  fmtPersen,
  fmtPips,
  fmtR,
  fmtRasio,
  fmtSigned,
  formatTanggal,
  formatTanggalPendek,
  groupStats,
  normalizeTrades,
  splitByPeriod,
  statsPerBulan,
  statsPerHari,
  type EquityPoint,
  type GroupStat,
  type Period,
  type PeriodBucket,
  type Trade,
  type TradeMetrics,
} from "@/lib/analytics";
import { formatUang, uangPerR, usePengaturan } from "@/lib/settings";

// --- Kartu utama -----------------------------------------------------------

/** Angka pahlawan di atas permukaan gelap plus sparkline ekuitas. */
function HeroCard({
  netR,
  netPips,
  total,
  seri,
  delta,
  uang,
}: {
  netR: number;
  netPips: number;
  total: number;
  seri: EquityPoint[];
  delta: number | null;
  uang: string | null;
}) {
  const positif = netR >= 0;
  const warna = positif ? COLOR.good : COLOR.bad;

  return (
    <section
      className={`relative flex flex-col overflow-hidden rounded-xl border border-slate-800 bg-slate-900 p-5 text-white ${RING}`}
    >
      <div
        className="pointer-events-none absolute -right-20 -top-24 h-48 w-48 rounded-full blur-3xl"
        style={{ background: `${warna}26` }}
      />
      <div className="relative flex items-start justify-between gap-2">
        <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-400">Net P&amp;L</p>
        <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-white/5 text-slate-400 ring-1 ring-inset ring-white/10">
          <Wallet size={15} />
        </span>
      </div>

      <div className="relative mt-3 flex flex-wrap items-baseline gap-2">
        <span className="text-[38px] font-semibold leading-none tracking-tight">{fmtR(netR)}</span>
        <DeltaChip value={delta} suffix="R" dark />
      </div>
      <p className="relative mt-2 text-xs tabular-nums text-slate-400">
        {uang ? `${uang} · ` : ""}
        {fmtPips(netPips)} · {total} trade
      </p>

      <div className="relative -mx-2 mt-auto h-16 pt-4">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={seri} margin={{ top: 4, right: 4, left: 4, bottom: 0 }}>
            <defs>
              <linearGradient id="grad-hero" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={warna} stopOpacity={0.45} />
                <stop offset="100%" stopColor={warna} stopOpacity={0} />
              </linearGradient>
            </defs>
            <Area
              type="monotone"
              dataKey="cumR"
              stroke={warna}
              strokeWidth={2}
              strokeLinecap="round"
              fill="url(#grad-hero)"
              dot={false}
              activeDot={false}
              animationDuration={700}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}

// --- Tooltip grafik --------------------------------------------------------

type MetricKey = "cumR" | "cumPips" | "pips" | "ddR";

const METRIC_META: Record<MetricKey, { label: string; satuan: (n: number) => string }> = {
  cumR: { label: "Ekuitas kumulatif", satuan: (n) => fmtR(n) },
  cumPips: { label: "Pips kumulatif", satuan: (n) => fmtPips(n) },
  pips: { label: "Hasil trade", satuan: (n) => fmtPips(n) },
  ddR: { label: "Drawdown", satuan: (n) => fmtR(n) },
};

function EquityTooltip({
  active,
  payload,
  metric,
}: {
  active?: boolean;
  payload?: { payload: EquityPoint }[];
  metric: MetricKey;
}) {
  if (!active || !payload || payload.length === 0) return null;
  const titik = payload[0].payload;

  return (
    <div className="min-w-[184px] rounded-xl border border-slate-200 bg-white px-3.5 py-3 shadow-xl">
      <p className="text-lg font-semibold leading-none tabular-nums text-slate-900">
        {METRIC_META[metric].satuan(Number(titik[metric]))}
      </p>
      <p className="mt-1 text-[11px] text-slate-500">{METRIC_META[metric].label}</p>
      <div className="mt-2.5 space-y-1 border-t border-slate-100 pt-2.5 text-[11px] text-slate-500">
        <p className="flex items-center justify-between gap-3">
          <span>
            Trade {titik.label} · {titik.pair}
          </span>
          <StatusBadge status={titik.status} />
        </p>
        <p>{formatTanggal(titik.tanggal)}</p>
        <p className="tabular-nums">
          {fmtPips(titik.pips)} · {fmtR(titik.r)}
        </p>
      </div>
    </div>
  );
}

function BucketTooltip({ active, payload }: { active?: boolean; payload?: { payload: PeriodBucket }[] }) {
  if (!active || !payload || payload.length === 0) return null;
  const d = payload[0].payload;
  return (
    <div className="min-w-[156px] rounded-xl border border-slate-200 bg-white px-3.5 py-3 shadow-xl">
      <p className="text-lg font-semibold leading-none tabular-nums text-slate-900">{fmtR(d.netR)}</p>
      <p className="mt-1 text-[11px] text-slate-500">{d.key}</p>
      <p className="mt-2.5 border-t border-slate-100 pt-2.5 text-[11px] tabular-nums text-slate-500">
        {d.trades} trade · Win rate {fmtPersen(d.winRate, 0)} · {fmtPips(d.netPips)}
      </p>
    </div>
  );
}


// --- Komponen utama --------------------------------------------------------

const METRIC_TABS = [
  { value: "cumR" as MetricKey, label: "Ekuitas (R)" },
  { value: "cumPips" as MetricKey, label: "Pips" },
  { value: "pips" as MetricKey, label: "P/L per Trade" },
  { value: "ddR" as MetricKey, label: "Drawdown" },
];

function keBaris(g: GroupStat): { key: string; nilai: number; teksNilai: string; meta: string } {
  return {
    key: g.key,
    nilai: g.netR,
    teksNilai: fmtR(g.netR),
    meta: `${g.trades}T · ${fmtPersen(g.winRate, 0)}`,
  };
}

export function DashboardView({ riwayat, loading = false }: { riwayat: Trade[]; loading?: boolean }) {
  const pengaturan = usePengaturan();
  const [period, setPeriod] = useState<Period>(pengaturan.periodeDefault);
  const [metric, setMetric] = useState<MetricKey>("cumR");
  const [tampilan, setTampilan] = useState<"grafik" | "tabel">("grafik");

  const semua = useMemo(() => normalizeTrades(riwayat ?? []), [riwayat]);
  const { current, previous } = useMemo(() => splitByPeriod(semua, period), [semua, period]);

  const stats = useMemo(() => computeStats(current), [current]);
  const statsSebelum = useMemo(() => computeStats(previous), [previous]);
  const seri = useMemo(() => buildEquitySeries(current), [current]);

  const perSetup = useMemo(() => groupStats(current, (t) => t.setup).map(keBaris), [current]);
  const perEmosi = useMemo(() => groupStats(current, (t) => t.emosi).map(keBaris), [current]);
  const perPair = useMemo(() => groupStats(current, (t) => t.pair).slice(0, 6), [current]);
  const perHari = useMemo(() => statsPerHari(current), [current]);
  const perBulan = useMemo(() => statsPerBulan(current, 6).slice().reverse(), [current]);
  const jumlahPerHari = useMemo(() => perHari.map((h) => h.trades), [perHari]);
  const insight = useMemo(
    () => buildInsight(stats, groupStats(current, (t) => t.setup), groupStats(current, (t) => t.emosi), perHari),
    [stats, current, perHari],
  );

  const adaPembanding = period !== "ALL" && statsSebelum.total > 0;
  const deltaR = adaPembanding ? stats.netR - statsSebelum.netR : null;
  const deltaWinRate = adaPembanding ? stats.winRate - statsSebelum.winRate : null;

  const terakhir = useMemo(() => current.slice(-8).reverse(), [current]);
  const nilaiAkhir = seri.length > 0 ? seri[seri.length - 1] : null;
  const uangNet = pengaturan.tampilkanUang ? formatUang(stats.netR * uangPerR(pengaturan), pengaturan) : null;

  const rentang =
    current.length > 0
      ? `${formatTanggalPendek(current[0].tanggal)} – ${formatTanggal(current[current.length - 1].tanggal)}`
      : "Belum ada trade";

  return (
    <div className={`w-full transition-opacity duration-200 ${loading ? "opacity-60" : "opacity-100"}`}>
      <PageHeader
        judul="Dashboard"
        keterangan={
          <>
            <span>{PERIOD_LABEL[period]}</span>
            <Pemisah />
            <span className="tabular-nums">{stats.total} trade</span>
            <Pemisah />
            <span className="tabular-nums">{rentang}</span>
          </>
        }
        aksi={
          <Segmented options={PERIODS.map((p) => ({ value: p, label: p }))} value={period} onChange={setPeriod} />
        }
      />

      {semua.length === 0 ? (
        <EmptyState
          judul="Belum ada data trading"
          pesan="Catat trade pertama kamu di menu Trading Journal. Semua statistik di dashboard akan terisi otomatis."
          icon={<LineChartIcon size={26} />}
        />
      ) : stats.total === 0 ? (
        <EmptyState
          judul="Tidak ada trade pada periode ini"
          pesan={`Tidak ditemukan trade untuk ${PERIOD_LABEL[period].toLowerCase()}. Coba pilih rentang waktu yang lebih panjang.`}
          icon={<LineChartIcon size={26} />}
        />
      ) : (
        <>
          {/* Baris KPI utama */}
          <div className="mb-4 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <HeroCard
              netR={stats.netR}
              netPips={stats.netPips}
              total={stats.total}
              seri={seri}
              delta={deltaR}
              uang={uangNet}
            />
            <StatCard
              label="Win Rate"
              value={fmtPersen(stats.winRate)}
              icon={<Percent size={15} />}
              delta={deltaWinRate !== null ? <DeltaChip value={deltaWinRate} suffix="%" /> : undefined}
              sub={
                <span className="tabular-nums">
                  {stats.wins} menang / {stats.losses} rugi dari {stats.decisive} trade tegas
                </span>
              }
            >
              <MeterBagian
                bagian={[
                  { key: "Profit", jumlah: stats.wins, warna: COLOR.good },
                  { key: "Loss", jumlah: stats.losses, warna: COLOR.bad },
                  { key: "BE", jumlah: stats.breakEven, warna: COLOR.neutral },
                ]}
              />
            </StatCard>
            <StatCard
              label="Profit Factor"
              value={fmtRasio(stats.profitFactor)}
              icon={<Scale size={15} />}
              tone={
                stats.profitFactor === null
                  ? stats.grossProfitR > 0
                    ? "good"
                    : "neutral"
                  : stats.profitFactor >= 1
                    ? "good"
                    : "bad"
              }
              sub={
                <span className="tabular-nums">
                  Gross {fmtR(stats.grossProfitR)} lawan {fmtR(-stats.grossLossR)}
                </span>
              }
            />
            <StatCard
              label="Expectancy"
              value={fmtR(stats.expectancyR)}
              icon={<Target size={15} />}
              tone={stats.expectancyR > 0 ? "good" : stats.expectancyR < 0 ? "bad" : "neutral"}
              sub={<span className="tabular-nums">{fmtPips(stats.expectancyPips)} rata-rata per trade</span>}
            />
          </div>

          {/* Baris KPI pendukung */}
          <div className="mb-6 grid grid-cols-2 gap-4 xl:grid-cols-4">
            <StatCard
              label="Total Trade"
              value={String(stats.total)}
              icon={<Activity size={15} />}
              sub={
                <span className="tabular-nums">
                  {stats.activeDays} hari aktif · {stats.breakEven} BE
                </span>
              }
            />
            <StatCard
              label="Rata-rata Menang / Rugi"
              value={`${fmtSigned(stats.avgWinR, 2)} / ${fmtSigned(-stats.avgLossR, 2)}`}
              icon={<Coins size={15} />}
              sub={
                <span className="tabular-nums">
                  Payoff {fmtRasio(stats.payoff)} · {Math.round(stats.avgWinPips)} lawan{" "}
                  {Math.round(stats.avgLossPips)} pips
                </span>
              }
            />
            <StatCard
              label="Max Drawdown"
              value={fmtR(-stats.maxDrawdownR)}
              tone={stats.maxDrawdownR > 0 ? "bad" : "neutral"}
              icon={<ShieldAlert size={15} />}
              sub={<span className="tabular-nums">{fmtPips(-stats.maxDrawdownPips)} dari puncak ekuitas</span>}
            />
            <StatCard
              label="Rangkaian Berjalan"
              value={
                stats.currentStreak.type === "NONE"
                  ? "0"
                  : `${stats.currentStreak.count} ${stats.currentStreak.type === "WIN" ? "menang" : "rugi"}`
              }
              tone={
                stats.currentStreak.type === "WIN" ? "good" : stats.currentStreak.type === "LOSS" ? "bad" : "neutral"
              }
              icon={<Flame size={15} />}
              sub={
                <span className="tabular-nums">
                  Terpanjang {stats.longestWinStreak} menang · {stats.longestLossStreak} rugi
                </span>
              }
            />
          </div>

          {/* Grafik performa utama */}
          <Card className="mb-6">
            <CardHeader
              title="Kurva Performa"
              subtitle={
                nilaiAkhir
                  ? `Nilai akhir ${METRIC_META[metric].satuan(Number(nilaiAkhir[metric]))} setelah ${seri.length} trade`
                  : "Perkembangan hasil trading trade demi trade"
              }
              icon={<LineChartIcon size={16} />}
              action={
                <div className="flex flex-wrap items-center gap-2">
                  <Segmented options={METRIC_TABS} value={metric} onChange={setMetric} size="sm" />
                  <Segmented
                    options={[
                      { value: "grafik" as const, label: "Grafik", icon: <LineChartIcon size={12} /> },
                      { value: "tabel" as const, label: "Tabel", icon: <TableIcon size={12} /> },
                    ]}
                    value={tampilan}
                    onChange={setTampilan}
                    size="sm"
                  />
                </div>
              }
            />
            {tampilan === "grafik" ? (
              <div className="h-[360px] px-2 pb-4 pt-6">
                <PerformanceChart data={seri} metric={metric} />
              </div>
            ) : (
              <TradeTable data={seri} />
            )}
          </Card>

          {/* Pembedahan edge */}
          <div className="mb-6 grid grid-cols-1 gap-4 xl:grid-cols-3">
            <Card>
              <CardHeader title="Performa per Setup" subtitle="Net R per strategi" icon={<Layers size={16} />} />
              <CategoryBars data={perSetup} kosong="Belum ada setup yang tercatat." />
            </Card>
            <Card>
              <CardHeader
                title="Performa per Emosi"
                subtitle="Net R per kondisi mental saat entry"
                icon={<Brain size={16} />}
              />
              <CategoryBars data={perEmosi} kosong="Belum ada emosi yang tercatat." />
            </Card>
            <Card>
              <CardHeader
                title="Catatan Edge"
                subtitle="Kesimpulan otomatis dari periode ini"
                icon={<Lightbulb size={16} />}
              />
              <ul className="space-y-2 p-4">
                {insight.map((item, i) => (
                  <li key={i} className="flex gap-3 rounded-lg bg-slate-50/70 p-3">
                    <span
                      className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg"
                      style={{
                        background:
                          item.tone === "good" ? "#0ca30c1f" : item.tone === "bad" ? "#d03b3b1f" : "#e2e8f0",
                        color: item.tone === "good" ? COLOR.goodInk : item.tone === "bad" ? COLOR.badInk : "#64748b",
                      }}
                    >
                      {item.icon}
                    </span>
                    <div className="min-w-0">
                      <p className="text-[13px] font-semibold text-slate-800">{item.judul}</p>
                      <p className="mt-0.5 text-[11px] leading-relaxed text-slate-500">{item.detail}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </Card>
          </div>

          {/* Waktu dan instrumen */}
          <div className="mb-6 grid grid-cols-1 gap-4 xl:grid-cols-3">
            <Card className="flex flex-col">
              <CardHeader
                title="Performa per Hari"
                subtitle="Net R menurut hari perdagangan"
                icon={<CalendarDays size={16} />}
              />
              <div className="h-[248px] px-2 pb-3 pt-6">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={perHari} margin={{ top: 18, right: 8, left: 8, bottom: 0 }} barCategoryGap="24%">
                    <CartesianGrid stroke={COLOR.grid} strokeWidth={1} vertical={false} />
                    <XAxis
                      dataKey="key"
                      tick={<HariTick jumlah={jumlahPerHari} />}
                      height={38}
                      tickLine={false}
                      axisLine={{ stroke: COLOR.grid }}
                      interval={0}
                    />
                    {/* Domain dilebihkan supaya label di ujung batang tidak menabrak sumbu. */}
                    <YAxis
                      hide
                      domain={[
                        (min: number) => Math.min(0, min) * 1.45 - 0.2,
                        (max: number) => Math.max(0, max) * 1.45 + 0.2,
                      ]}
                    />
                    <ReferenceLine y={0} stroke="#cbd5e1" strokeWidth={1} />
                    <Tooltip content={<BucketTooltip />} cursor={{ fill: "rgba(15,23,42,0.04)" }} />
                    <Bar dataKey="netR" shape={<SignedBar />} maxBarSize={26} animationDuration={600}>
                      <LabelList dataKey="netR" content={<SignedBarLabel />} />
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Card>

            <Card className="flex flex-col overflow-hidden">
              <CardHeader title="Pair Teratas" subtitle="6 instrumen dengan net R terbaik" icon={<Trophy size={16} />} />
              <MiniTable
                kolom={["Pair", "Trade", "Win rate", "Net R"]}
                baris={perPair.map((p) => [
                  p.key,
                  String(p.trades),
                  fmtPersen(p.winRate, 0),
                  <span key="r" className="font-semibold" style={{ color: inkTanda(p.netR) }}>
                    {fmtR(p.netR)}
                  </span>,
                ])}
                kosong="Belum ada pair yang tercatat."
              />
            </Card>

            <Card className="flex flex-col overflow-hidden">
              <CardHeader
                title="Ringkasan Bulanan"
                subtitle="6 bulan terakhir dalam periode ini"
                icon={<Gauge size={16} />}
              />
              <MiniTable
                kolom={["Bulan", "Trade", "Win rate", "Net R"]}
                baris={perBulan.map((b) => [
                  b.key,
                  String(b.trades),
                  b.trades > 0 ? fmtPersen(b.winRate, 0) : "–",
                  <span key="r" className="font-semibold" style={{ color: inkTanda(b.netR) }}>
                    {b.trades > 0 ? fmtR(b.netR) : "–"}
                  </span>,
                ])}
                kosong="Belum ada data bulanan."
              />
            </Card>
          </div>

          {/* Trade terakhir */}
          <Card className="overflow-hidden">
            <CardHeader
              title="Trade Terakhir"
              subtitle="8 entri terbaru pada periode ini"
              icon={<Activity size={16} />}
            />
            <div className="overflow-x-auto">
              <table className="w-full min-w-[760px] text-left text-[13px]">
                <thead>
                  <tr className="bg-slate-50/70 text-[10px] uppercase tracking-wider text-slate-400">
                    <th className="px-5 py-2.5 font-semibold">Tanggal</th>
                    <th className="px-3 py-2.5 font-semibold">Pair</th>
                    <th className="px-3 py-2.5 font-semibold">Setup</th>
                    <th className="px-3 py-2.5 font-semibold">Emosi</th>
                    <th className="px-3 py-2.5 font-semibold">Status</th>
                    <th className="px-3 py-2.5 text-right font-semibold">RR Plan</th>
                    <th className="px-3 py-2.5 text-right font-semibold">Hasil</th>
                    <th className="px-5 py-2.5 text-right font-semibold">R Aktual</th>
                  </tr>
                </thead>
                <tbody>
                  {terakhir.map((t: TradeMetrics, i: number) => (
                    <tr key={String(t.id ?? i)} className="border-t border-slate-50 hover:bg-slate-50/70">
                      <td className="whitespace-nowrap px-5 py-3 tabular-nums text-slate-600">
                        {formatTanggal(t.tanggal)}
                      </td>
                      <td className="px-3 py-3 font-semibold text-slate-900">{t.pair || "–"}</td>
                      <td className="px-3 py-3 text-slate-600">{t.setup || "–"}</td>
                      <td className="px-3 py-3 text-slate-600">{t.emosi || "–"}</td>
                      <td className="px-3 py-3">
                        <StatusBadge status={t.status} />
                      </td>
                      <td className="px-3 py-3 text-right tabular-nums text-slate-500">
                        {t.plannedRr > 0 ? `1:${t.plannedRr.toFixed(1)}` : "–"}
                      </td>
                      <td className="px-3 py-3 text-right tabular-nums text-slate-700">{fmtPips(t.pips)}</td>
                      <td
                        className="px-5 py-3 text-right font-semibold tabular-nums"
                        style={{ color: inkTanda(t.r) }}
                      >
                        {fmtR(t.r)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </>
      )}
    </div>
  );
}

// --- Bagian pendukung ------------------------------------------------------

function PerformanceChart({ data, metric }: { data: EquityPoint[]; metric: MetricKey }) {
  const sumbuY = {
    tick: { fontSize: 11, fill: COLOR.axis },
    tickLine: false,
    axisLine: false,
    width: 48,
  } as const;
  const sumbuX = {
    dataKey: "label",
    tick: { fontSize: 11, fill: COLOR.axis },
    tickLine: false,
    axisLine: { stroke: COLOR.grid },
    minTickGap: 24,
    tickMargin: 10,
  } as const;

  if (metric === "pips") {
    return (
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 16, left: 0, bottom: 0 }} barCategoryGap="18%">
          <CartesianGrid stroke={COLOR.grid} strokeWidth={1} vertical={false} />
          <XAxis {...sumbuX} />
          <YAxis {...sumbuY} tickFormatter={(v: number) => String(Math.round(v))} />
          <ReferenceLine y={0} stroke="#cbd5e1" strokeWidth={1} />
          <Tooltip content={<EquityTooltip metric={metric} />} cursor={{ fill: "rgba(15,23,42,0.04)" }} />
          <Bar dataKey="pips" shape={<SignedBar />} maxBarSize={24} animationDuration={600} />
        </BarChart>
      </ResponsiveContainer>
    );
  }

  const negatif = metric === "ddR";
  const warna = negatif ? COLOR.bad : COLOR.series;
  const gradienId = `grad-${metric}`;

  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={data} margin={{ top: 8, right: 24, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id={gradienId} x1="0" y1={negatif ? "1" : "0"} x2="0" y2={negatif ? "0" : "1"}>
            <stop offset="0%" stopColor={warna} stopOpacity={0.2} />
            <stop offset="100%" stopColor={warna} stopOpacity={0.01} />
          </linearGradient>
        </defs>
        <CartesianGrid stroke={COLOR.grid} strokeWidth={1} vertical={false} />
        <XAxis {...sumbuX} />
        <YAxis
          {...sumbuY}
          tickFormatter={(v: number) => (metric === "cumPips" ? String(Math.round(v)) : v.toFixed(1))}
        />
        <ReferenceLine y={0} stroke="#cbd5e1" strokeWidth={1} />
        <Tooltip content={<EquityTooltip metric={metric} />} cursor={{ stroke: "#cbd5e1", strokeWidth: 1 }} />
        <Area
          type={negatif ? "stepAfter" : "monotone"}
          dataKey={metric}
          stroke={warna}
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
          fill={`url(#${gradienId})`}
          animationDuration={700}
          dot={false}
          activeDot={{ r: 4, fill: warna, stroke: "#ffffff", strokeWidth: 2 }}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}

function TradeTable({ data }: { data: EquityPoint[] }) {
  const baris = data.slice().reverse();
  return (
    <div className="max-h-[360px] overflow-auto rounded-b-xl">
      <table className="w-full min-w-[640px] text-left text-[13px]">
        <thead className="sticky top-0 z-10">
          <tr className="bg-slate-50 text-[10px] uppercase tracking-wider text-slate-400">
            <th className="px-5 py-2.5 font-semibold">#</th>
            <th className="px-3 py-2.5 font-semibold">Tanggal</th>
            <th className="px-3 py-2.5 font-semibold">Pair</th>
            <th className="px-3 py-2.5 font-semibold">Status</th>
            <th className="px-3 py-2.5 text-right font-semibold">Hasil</th>
            <th className="px-3 py-2.5 text-right font-semibold">R</th>
            <th className="px-3 py-2.5 text-right font-semibold">Kumulatif R</th>
            <th className="px-5 py-2.5 text-right font-semibold">Drawdown</th>
          </tr>
        </thead>
        <tbody>
          {baris.map((p) => (
            <tr key={p.idx} className="border-t border-slate-50 hover:bg-slate-50/70">
              <td className="px-5 py-2.5 tabular-nums text-slate-400">{p.label}</td>
              <td className="whitespace-nowrap px-3 py-2.5 tabular-nums text-slate-600">
                {formatTanggal(p.tanggal)}
              </td>
              <td className="px-3 py-2.5 font-semibold text-slate-900">{p.pair}</td>
              <td className="px-3 py-2.5">
                <StatusBadge status={p.status} />
              </td>
              <td className="px-3 py-2.5 text-right tabular-nums text-slate-700">{fmtPips(p.pips)}</td>
              <td className="px-3 py-2.5 text-right font-semibold tabular-nums" style={{ color: inkTanda(p.r) }}>
                {fmtR(p.r)}
              </td>
              <td className="px-3 py-2.5 text-right tabular-nums text-slate-700">{fmtR(p.cumR)}</td>
              <td className="px-5 py-2.5 text-right tabular-nums text-slate-500">{fmtR(p.ddR)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

type Insight = { judul: string; detail: string; tone: "good" | "bad" | "neutral"; icon: ReactNode };

/** Kesimpulan singkat yang bisa langsung ditindaklanjuti trader. */
function buildInsight(
  stats: ReturnType<typeof computeStats>,
  perSetup: GroupStat[],
  perEmosi: GroupStat[],
  perHari: PeriodBucket[],
): Insight[] {
  const hasil: Insight[] = [];
  const layak = (g: GroupStat) => g.trades >= 2 && g.key !== "Tidak diisi";

  const setupBaik = perSetup.filter(layak).find((g) => g.netR > 0);
  if (setupBaik) {
    hasil.push({
      judul: `Setup terkuat: ${setupBaik.key}`,
      detail: `${fmtR(setupBaik.netR)} dari ${setupBaik.trades} trade dengan win rate ${fmtPersen(setupBaik.winRate, 0)}. Perbesar porsi setup ini.`,
      tone: "good",
      icon: <Trophy size={14} />,
    });
  }

  const setupBuruk = [...perSetup].filter(layak).reverse().find((g) => g.netR < 0);
  if (setupBuruk) {
    hasil.push({
      judul: `Setup paling merugi: ${setupBuruk.key}`,
      detail: `${fmtR(setupBuruk.netR)} dari ${setupBuruk.trades} trade. Evaluasi ulang kriteria entry atau hentikan sementara.`,
      tone: "bad",
      icon: <ShieldAlert size={14} />,
    });
  }

  const emosiBuruk = [...perEmosi].filter(layak).reverse().find((g) => g.netR < 0);
  if (emosiBuruk) {
    hasil.push({
      judul: `Waspadai kondisi "${emosiBuruk.key}"`,
      detail: `Entry saat ${emosiBuruk.key.toLowerCase()} menghasilkan ${fmtR(emosiBuruk.netR)} dari ${emosiBuruk.trades} trade. Tunda entry saat merasakan ini.`,
      tone: "bad",
      icon: <Brain size={14} />,
    });
  } else {
    const emosiBaik = perEmosi.filter(layak).find((g) => g.netR > 0);
    if (emosiBaik) {
      hasil.push({
        judul: `Kondisi terbaik: ${emosiBaik.key}`,
        detail: `${fmtR(emosiBaik.netR)} dari ${emosiBaik.trades} trade saat kondisi ini. Pertahankan rutinitas sebelum entry.`,
        tone: "good",
        icon: <Brain size={14} />,
      });
    }
  }

  const hariTerbaik = [...perHari].filter((h) => h.trades >= 2).sort((a, b) => b.netR - a.netR)[0];
  if (hariTerbaik && hariTerbaik.netR !== 0) {
    hasil.push({
      judul: `Hari paling produktif: ${hariTerbaik.key}`,
      detail: `${fmtR(hariTerbaik.netR)} dari ${hariTerbaik.trades} trade. Sesuaikan jadwal analisa dengan pola ini.`,
      tone: hariTerbaik.netR > 0 ? "good" : "bad",
      icon: <CalendarDays size={14} />,
    });
  }

  if (stats.avgPlannedRr > 0) {
    const positif = stats.expectancyR >= 0;
    hasil.push({
      judul: `RR rencana rata-rata 1:${stats.avgPlannedRr.toFixed(1)}`,
      detail: positif
        ? `Realisasi rata-rata ${fmtR(stats.expectancyR)} per trade. Sistem sudah menghasilkan ekspektasi positif.`
        : `Realisasi rata-rata baru ${fmtR(stats.expectancyR)} per trade. Perketat manajemen exit agar mendekati rencana.`,
      tone: positif ? "good" : "bad",
      icon: <Target size={14} />,
    });
  }

  if (stats.currentStreak.type === "LOSS" && stats.currentStreak.count >= 3) {
    hasil.push({
      judul: `${stats.currentStreak.count} loss beruntun`,
      detail:
        "Pertimbangkan menurunkan ukuran risiko atau berhenti sejenak sampai kondisi pasar kembali sesuai sistem.",
      tone: "bad",
      icon: <Flame size={14} />,
    });
  }

  if (hasil.length === 0) {
    hasil.push({
      judul: "Data belum cukup",
      detail: "Perlu minimal dua trade per kategori agar pola setup dan emosi bisa disimpulkan.",
      tone: "neutral",
      icon: <Lightbulb size={14} />,
    });
  }

  return hasil.slice(0, 5);
}
