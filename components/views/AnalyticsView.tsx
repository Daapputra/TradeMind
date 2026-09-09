"use client";

import { useMemo, useState } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  LabelList,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  Activity,
  BarChart3,
  Boxes,
  Gauge,
  Grid3x3,
  Repeat,
  Ruler,
  ShieldCheck,
  Sparkles,
  ThumbsDown,
  ThumbsUp,
  TrendingUp,
} from "lucide-react";

import {
  CountLabel,
  SUMBU_X,
  SUMBU_Y,
  SignedBar,
  SignedBarLabel,
  TooltipKotak,
} from "@/components/ui/charts";
import {
  COLOR,
  Card,
  CardHeader,
  CategoryBars,
  EmptyState,
  MiniTable,
  PageHeader,
  Pemisah,
  PilihInput,
  Segmented,
  StatCard,
  inkTanda,
} from "@/components/ui/kit";
import {
  PERIODS,
  PERIOD_LABEL,
  computeStats,
  fmtPersen,
  fmtPips,
  fmtR,
  formatTanggal,
  groupStats,
  normalizeTrades,
  splitByPeriod,
  statsPerBulan,
  type Period,
  type Trade,
} from "@/lib/analytics";
import {
  ambilSel,
  bangunMatriks,
  distribusiR,
  ekspektasiBergulir,
  konsistensiRisiko,
  statistikLanjutan,
} from "@/lib/insight";
import { usePengaturan } from "@/lib/settings";

/** hex 6 digit menjadi rgba dengan alpha, untuk isian sel heatmap. */
function warnaAlpha(hex: string, alpha: number): string {
  const n = parseInt(hex.slice(1), 16);
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${alpha})`;
}

const JENDELA = [
  { value: "5", label: "5 trade" },
  { value: "10", label: "10 trade" },
  { value: "20", label: "20 trade" },
];

export function AnalyticsView({ riwayat, loading = false }: { riwayat: Trade[]; loading?: boolean }) {
  const pengaturan = usePengaturan();
  const [period, setPeriod] = useState<Period>(pengaturan.periodeDefault);
  const [market, setMarket] = useState("");
  const [jendela, setJendela] = useState("10");

  const semua = useMemo(() => normalizeTrades(riwayat ?? []), [riwayat]);
  const { current } = useMemo(() => splitByPeriod(semua, period), [semua, period]);

  const opsiMarket = useMemo(() => {
    const daftar = [...new Set(semua.map((t) => String(t.market ?? "").trim()).filter(Boolean))].sort();
    return daftar.map((m) => ({ value: m, label: m }));
  }, [semua]);

  const data = useMemo(
    () => (market ? current.filter((t) => String(t.market ?? "") === market) : current),
    [current, market],
  );

  const stats = useMemo(() => computeStats(data), [data]);
  const lanjutan = useMemo(() => statistikLanjutan(data, stats), [data, stats]);
  const distribusi = useMemo(() => distribusiR(data), [data]);
  const bergulir = useMemo(() => ekspektasiBergulir(data, Number(jendela)), [data, jendela]);
  const risiko = useMemo(() => konsistensiRisiko(data), [data]);
  const bulanan = useMemo(() => statsPerBulan(data, 12), [data]);
  const perMarket = useMemo(
    () =>
      groupStats(data, (t) => t.market).map((g) => ({
        key: g.key,
        nilai: g.netR,
        teksNilai: fmtR(g.netR),
        meta: `${g.trades}T · ${fmtPersen(g.winRate, 0)}`,
      })),
    [data],
  );
  const matriks = useMemo(() => bangunMatriks(data, (t) => t.setup, (t) => t.emosi), [data]);

  const terbaik = useMemo(() => [...data].sort((a, b) => b.r - a.r).slice(0, 5), [data]);
  const terburuk = useMemo(() => [...data].sort((a, b) => a.r - b.r).slice(0, 5), [data]);

  const mutuKonsistensi =
    risiko.cv === 0 ? "–" : risiko.cv < 0.2 ? "Sangat konsisten" : risiko.cv < 0.5 ? "Cukup konsisten" : "Berubah-ubah";

  if (semua.length === 0) {
    return (
      <div className="w-full">
        <PageHeader judul="Analytics" keterangan={<span>Pembedahan mendalam atas performa trading</span>} />
        <EmptyState
          judul="Belum ada data untuk dianalisa"
          pesan="Catat beberapa trade di menu Trading Journal. Analytics butuh minimal beberapa entri agar polanya bermakna."
          icon={<BarChart3 size={26} />}
        />
      </div>
    );
  }

  return (
    <div className={`w-full transition-opacity duration-200 ${loading ? "opacity-60" : "opacity-100"}`}>
      <PageHeader
        judul="Analytics"
        keterangan={
          <>
            <span>{PERIOD_LABEL[period]}</span>
            <Pemisah />
            <span className="tabular-nums">{stats.total} trade dianalisa</span>
            {market && (
              <>
                <Pemisah />
                <span>Market {market}</span>
              </>
            )}
          </>
        }
        aksi={
          <>
            <div className="w-[170px]">
              <PilihInput value={market} onChange={setMarket} options={opsiMarket} placeholder="Semua market" />
            </div>
            <Segmented options={PERIODS.map((p) => ({ value: p, label: p }))} value={period} onChange={setPeriod} />
          </>
        }
      />

      {stats.total === 0 ? (
        <EmptyState
          judul="Tidak ada trade pada saringan ini"
          pesan="Longgarkan periode atau pilih market lain untuk melihat analisanya."
          icon={<BarChart3 size={26} />}
        />
      ) : (
        <>
          <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard
              label="Expectancy / Trade"
              value={fmtR(stats.expectancyR)}
              tone={stats.expectancyR > 0 ? "good" : stats.expectancyR < 0 ? "bad" : "neutral"}
              icon={<TrendingUp size={15} />}
              sub={<span className="tabular-nums">{fmtPips(stats.expectancyPips)} rata-rata per trade</span>}
            />
            <StatCard
              label="Rasio Kestabilan"
              value={lanjutan.rasioKestabilan.toFixed(2)}
              tone={lanjutan.rasioKestabilan > 0 ? "good" : lanjutan.rasioKestabilan < 0 ? "bad" : "neutral"}
              icon={<Activity size={15} />}
              sub={
                <span className="tabular-nums">
                  Expectancy dibagi simpangan {lanjutan.simpanganR.toFixed(2)}R
                </span>
              }
            />
            <StatCard
              label="Recovery Factor"
              value={lanjutan.recoveryFactor === null ? "–" : lanjutan.recoveryFactor.toFixed(2)}
              tone={
                lanjutan.recoveryFactor === null
                  ? "neutral"
                  : lanjutan.recoveryFactor >= 1
                    ? "good"
                    : "bad"
              }
              icon={<Repeat size={15} />}
              sub={<span className="tabular-nums">Net R dibagi drawdown {fmtR(-stats.maxDrawdownR)}</span>}
            />
            <StatCard
              label="Konsistensi Risiko"
              value={risiko.cv === 0 ? "–" : risiko.cv.toFixed(2)}
              tone={risiko.cv === 0 ? "neutral" : risiko.cv < 0.3 ? "good" : "bad"}
              icon={<Ruler size={15} />}
              sub={
                <span className="tabular-nums">
                  {mutuKonsistensi} · rata-rata {risiko.rata} pips
                </span>
              }
            />
          </div>

          <div className="mb-6 grid grid-cols-1 gap-4 xl:grid-cols-2">
            <Card>
              <CardHeader
                title="Distribusi Hasil"
                subtitle="Berapa banyak trade yang jatuh di setiap rentang R"
                icon={<Boxes size={16} />}
              />
              <div className="h-[280px] px-2 pb-3 pt-6">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={distribusi} margin={{ top: 18, right: 12, left: 4, bottom: 0 }} barCategoryGap="22%">
                    <CartesianGrid stroke={COLOR.grid} strokeWidth={1} vertical={false} />
                    <XAxis
                      {...SUMBU_X}
                      dataKey="label"
                      interval={0}
                      minTickGap={0}
                      tick={{ fontSize: 9.5, fill: COLOR.axis }}
                      height={34}
                    />
                    <YAxis {...SUMBU_Y} width={32} allowDecimals={false} />
                    <Tooltip
                      cursor={{ fill: "rgba(15,23,42,0.04)" }}
                      content={({ active, payload }) =>
                        active && payload?.length ? (
                          <TooltipKotak
                            nilai={`${payload[0].payload.jumlah} trade`}
                            label={`Hasil ${payload[0].payload.label}`}
                            rincian={
                              <span className="tabular-nums">
                                {fmtPersen((payload[0].payload.jumlah / stats.total) * 100, 0)} dari total trade
                              </span>
                            }
                          />
                        ) : null
                      }
                    />
                    <Bar dataKey="jumlah" maxBarSize={40} radius={[4, 4, 0, 0]} animationDuration={600}>
                      <LabelList dataKey="jumlah" content={<CountLabel />} />
                      {distribusi.map((d) => (
                        <Cell key={d.label} fill={d.positif ? COLOR.good : COLOR.bad} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <p className="border-t border-slate-100 px-5 py-3 text-[11px] text-slate-500">
                Sebaran ideal punya ekor kanan panjang: kerugian ditahan di sekitar 1R, keuntungan dibiarkan tumbuh.
              </p>
            </Card>

            <Card>
              <CardHeader
                title="Ekspektasi Bergulir"
                subtitle={`Rata-rata R pada ${jendela} trade terakhir, digeser satu per satu`}
                icon={<Sparkles size={16} />}
                action={<Segmented options={JENDELA} value={jendela} onChange={setJendela} size="sm" />}
              />
              {bergulir.length === 0 ? (
                <p className="px-5 py-16 text-center text-xs text-slate-400">
                  Butuh minimal {jendela} trade untuk menghitung ekspektasi bergulir.
                </p>
              ) : (
                <div className="h-[280px] px-2 pb-3 pt-6">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={bergulir} margin={{ top: 8, right: 20, left: 0, bottom: 0 }}>
                      <defs>
                        <linearGradient id="grad-bergulir" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor={COLOR.series} stopOpacity={0.2} />
                          <stop offset="100%" stopColor={COLOR.series} stopOpacity={0.01} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid stroke={COLOR.grid} strokeWidth={1} vertical={false} />
                      <XAxis {...SUMBU_X} dataKey="label" />
                      <YAxis {...SUMBU_Y} width={44} tickFormatter={(v: number) => v.toFixed(1)} />
                      <ReferenceLine y={0} stroke="#cbd5e1" strokeWidth={1} />
                      <Tooltip
                        cursor={{ stroke: "#cbd5e1", strokeWidth: 1 }}
                        content={({ active, payload }) =>
                          active && payload?.length ? (
                            <TooltipKotak
                              nilai={fmtR(payload[0].payload.nilai)}
                              label={`Rata-rata ${jendela} trade sampai ${payload[0].payload.label}`}
                              rincian={formatTanggal(payload[0].payload.tanggal)}
                            />
                          ) : null
                        }
                      />
                      <Area
                        type="monotone"
                        dataKey="nilai"
                        stroke={COLOR.series}
                        strokeWidth={2}
                        strokeLinecap="round"
                        fill="url(#grad-bergulir)"
                        dot={false}
                        animationDuration={700}
                        activeDot={{ r: 4, fill: COLOR.series, stroke: "#ffffff", strokeWidth: 2 }}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              )}
            </Card>
          </div>

          <div className="mb-6 grid grid-cols-1 gap-4 xl:grid-cols-2">
            <Card>
              <CardHeader
                title="Konsistensi Ukuran Risiko"
                subtitle="Risiko per trade dalam pips dibanding rata-ratanya"
                icon={<ShieldCheck size={16} />}
              />
              {risiko.data.length === 0 ? (
                <p className="px-5 py-16 text-center text-xs text-slate-400">Belum ada trade dengan risiko terisi.</p>
              ) : (
                <>
                  <div className="h-[260px] px-2 pb-3 pt-6">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={risiko.data} margin={{ top: 8, right: 20, left: 0, bottom: 0 }}>
                        <CartesianGrid stroke={COLOR.grid} strokeWidth={1} vertical={false} />
                        <XAxis {...SUMBU_X} dataKey="label" />
                        <YAxis {...SUMBU_Y} width={40} />
                        <ReferenceLine
                          y={risiko.rata}
                          stroke={COLOR.axis}
                          strokeWidth={1}
                          label={{
                            value: `rata-rata ${risiko.rata}`,
                            position: "insideTopLeft",
                            fontSize: 10,
                            fill: COLOR.label,
                          }}
                        />
                        <Tooltip
                          cursor={{ stroke: "#cbd5e1", strokeWidth: 1 }}
                          content={({ active, payload }) =>
                            active && payload?.length ? (
                              <TooltipKotak
                                nilai={`${payload[0].payload.risk} pips`}
                                label={`Risiko trade ${payload[0].payload.label}`}
                                rincian={formatTanggal(payload[0].payload.tanggal)}
                              />
                            ) : null
                          }
                        />
                        <Line
                          type="monotone"
                          dataKey="risk"
                          stroke={COLOR.series}
                          strokeWidth={2}
                          dot={false}
                          animationDuration={600}
                          activeDot={{ r: 4, fill: COLOR.series, stroke: "#ffffff", strokeWidth: 2 }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                  <p className="border-t border-slate-100 px-5 py-3 text-[11px] text-slate-500">
                    Simpangan {risiko.simpangan} pips dari rata-rata {risiko.rata} pips. Garis yang mendatar berarti
                    ukuran risiko terjaga, sehingga satu R selalu berarti sama.
                  </p>
                </>
              )}
            </Card>

            <Card>
              <CardHeader
                title="Performa Bulanan"
                subtitle="Net R tiap bulan pada periode terpilih"
                icon={<Gauge size={16} />}
              />
              <div className="h-[260px] px-2 pb-3 pt-6">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={bulanan} margin={{ top: 20, right: 12, left: 4, bottom: 0 }} barCategoryGap="26%">
                    <CartesianGrid stroke={COLOR.grid} strokeWidth={1} vertical={false} />
                    <XAxis
                      {...SUMBU_X}
                      dataKey="key"
                      interval={0}
                      minTickGap={0}
                      tick={{ fontSize: 10, fill: COLOR.axis }}
                    />
                    <YAxis
                      hide
                      domain={[
                        (min: number) => Math.min(0, min) * 1.45 - 0.2,
                        (max: number) => Math.max(0, max) * 1.45 + 0.2,
                      ]}
                    />
                    <ReferenceLine y={0} stroke="#cbd5e1" strokeWidth={1} />
                    <Tooltip
                      cursor={{ fill: "rgba(15,23,42,0.04)" }}
                      content={({ active, payload }) =>
                        active && payload?.length ? (
                          <TooltipKotak
                            nilai={fmtR(payload[0].payload.netR)}
                            label={payload[0].payload.key}
                            rincian={
                              <span className="tabular-nums">
                                {payload[0].payload.trades} trade · Win rate{" "}
                                {fmtPersen(payload[0].payload.winRate, 0)}
                              </span>
                            }
                          />
                        ) : null
                      }
                    />
                    <Bar dataKey="netR" shape={<SignedBar />} maxBarSize={30} animationDuration={600}>
                      <LabelList dataKey="netR" content={<SignedBarLabel />} />
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Card>
          </div>

          <div className="mb-6 grid grid-cols-1 gap-4 xl:grid-cols-3">
            <Card className="xl:col-span-2">
              <CardHeader
                title="Matriks Setup × Emosi"
                subtitle="Net R untuk setiap kombinasi strategi dan kondisi mental"
                icon={<Grid3x3 size={16} />}
              />
              {matriks.baris.length === 0 || matriks.kolom.length === 0 ? (
                <p className="px-5 py-16 text-center text-xs text-slate-400">
                  Isi kolom setup dan emosi pada jurnal untuk melihat matriks ini.
                </p>
              ) : (
                <div className="overflow-x-auto p-4">
                  <table className="w-full min-w-[560px] border-separate border-spacing-[3px] text-[12px]">
                    <thead>
                      <tr>
                        <th className="w-[150px] px-2 pb-1 text-left text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                          Setup \ Emosi
                        </th>
                        {matriks.kolom.map((k) => (
                          <th
                            key={k}
                            className="px-1 pb-1 text-center text-[10px] font-semibold uppercase tracking-wider text-slate-400"
                          >
                            {k}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {matriks.baris.map((b) => (
                        <tr key={b}>
                          <td className="truncate px-2 text-[12px] font-medium text-slate-700">{b}</td>
                          {matriks.kolom.map((k) => {
                            const sel = ambilSel(matriks, b, k);
                            if (!sel) {
                              return (
                                <td key={k} className="rounded-md bg-slate-50 py-2.5 text-center text-slate-300">
                                  –
                                </td>
                              );
                            }
                            const kuat = Math.abs(sel.netR) / matriks.puncak;
                            const alpha = 0.14 + kuat * 0.66;
                            const dasar = sel.netR >= 0 ? COLOR.good : COLOR.bad;
                            return (
                              <td
                                key={k}
                                title={`${b} saat ${k}: ${fmtR(sel.netR)} dari ${sel.trades} trade`}
                                className="rounded-md py-2 text-center"
                                style={{ background: warnaAlpha(dasar, alpha) }}
                              >
                                <span
                                  className="block text-[12px] font-semibold tabular-nums"
                                  style={{ color: alpha > 0.5 ? "#ffffff" : inkTanda(sel.netR) }}
                                >
                                  {fmtR(sel.netR)}
                                </span>
                                <span
                                  className="block text-[10px] tabular-nums"
                                  style={{ color: alpha > 0.5 ? "rgba(255,255,255,0.8)" : "#64748b" }}
                                >
                                  {sel.trades}T
                                </span>
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <p className="mt-3 px-2 text-[11px] text-slate-500">
                    Warna menunjukkan besar dan arah hasil, angka di dalam sel tetap menuliskan nilainya. Sel kosong
                    berarti kombinasi itu belum pernah terjadi.
                  </p>
                </div>
              )}
            </Card>

            <Card>
              <CardHeader title="Performa per Market" subtitle="Net R per jenis instrumen" icon={<Boxes size={16} />} />
              <CategoryBars data={perMarket} kosong="Belum ada market yang tercatat." />
            </Card>
          </div>

          <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
            <Card className="overflow-hidden">
              <CardHeader title="Lima Trade Terbaik" subtitle="Hasil R tertinggi" icon={<ThumbsUp size={16} />} />
              <MiniTable
                kolom={["Pair", "Tanggal", "Setup", "R"]}
                baris={terbaik.map((t) => [
                  t.pair || "–",
                  formatTanggal(t.tanggal),
                  t.setup || "–",
                  <span key="r" className="font-semibold" style={{ color: inkTanda(t.r) }}>
                    {fmtR(t.r)}
                  </span>,
                ])}
                kosong="Belum ada trade."
              />
            </Card>
            <Card className="overflow-hidden">
              <CardHeader title="Lima Trade Terburuk" subtitle="Hasil R terendah" icon={<ThumbsDown size={16} />} />
              <MiniTable
                kolom={["Pair", "Tanggal", "Setup", "R"]}
                baris={terburuk.map((t) => [
                  t.pair || "–",
                  formatTanggal(t.tanggal),
                  t.setup || "–",
                  <span key="r" className="font-semibold" style={{ color: inkTanda(t.r) }}>
                    {fmtR(t.r)}
                  </span>,
                ])}
                kosong="Belum ada trade."
              />
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
