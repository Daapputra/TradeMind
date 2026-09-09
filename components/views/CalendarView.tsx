"use client";

import { useMemo, useState } from "react";
import { CalendarDays, ChevronLeft, ChevronRight, Flag, Target, TrendingDown, TrendingUp } from "lucide-react";

import {
  COLOR,
  Card,
  CardHeader,
  Drawer,
  EmptyState,
  MeterBagian,
  PageHeader,
  Pemisah,
  StatCard,
  StatusBadge,
  Tombol,
  inkTanda,
} from "@/components/ui/kit";
import {
  computeStats,
  fmtPersen,
  fmtPips,
  fmtR,
  formatTanggal,
  normalizeTrades,
  type Trade,
  type TradeMetrics,
} from "@/lib/analytics";
import {
  HARI_PENDEK,
  bangunKalender,
  namaBulan,
  statsPerTanggal,
  tradeDiBulan,
  tradeDiTanggal,
  type HariStat,
} from "@/lib/insight";
import { formatUang, uangPerR, usePengaturan } from "@/lib/settings";

function warnaAlpha(hex: string, alpha: number): string {
  const n = parseInt(hex.slice(1), 16);
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${alpha})`;
}

export function CalendarView({ riwayat, loading = false }: { riwayat: Trade[]; loading?: boolean }) {
  const pengaturan = usePengaturan();
  const semua = useMemo(() => normalizeTrades(riwayat ?? []), [riwayat]);

  const [kursor, setKursor] = useState(() => {
    const kini = new Date();
    return { tahun: kini.getFullYear(), bulan: kini.getMonth() };
  });
  const [mulaiDisetel, setMulaiDisetel] = useState(false);
  const [hariTerpilih, setHariTerpilih] = useState<string | null>(null);

  const peta = useMemo(() => statsPerTanggal(semua), [semua]);

  // Sekali saja: lompat ke bulan trade terakhir kalau bulan ini belum ada isinya.
  if (!mulaiDisetel && semua.length > 0) {
    const akhir = semua[semua.length - 1].date;
    const kini = new Date();
    const bulanIniKosong = tradeDiBulan(semua, kini.getFullYear(), kini.getMonth()).length === 0;
    if (akhir && bulanIniKosong) {
      setKursor({ tahun: akhir.getFullYear(), bulan: akhir.getMonth() });
    }
    setMulaiDisetel(true);
  }

  const minggu = useMemo(() => bangunKalender(kursor.tahun, kursor.bulan, peta), [kursor, peta]);
  const tradeBulanIni = useMemo(
    () => tradeDiBulan(semua, kursor.tahun, kursor.bulan),
    [semua, kursor],
  );
  const stats = useMemo(() => computeStats(tradeBulanIni), [tradeBulanIni]);

  const hariBulanIni = useMemo(
    () =>
      minggu
        .flatMap((m) => m.sel)
        .filter((s) => s.diBulanIni && s.stat)
        .map((s) => s.stat as HariStat),
    [minggu],
  );

  const hariTerbaik = useMemo(
    () => [...hariBulanIni].sort((a, b) => b.netR - a.netR)[0] ?? null,
    [hariBulanIni],
  );
  const hariTerburuk = useMemo(
    () => [...hariBulanIni].sort((a, b) => a.netR - b.netR)[0] ?? null,
    [hariBulanIni],
  );

  const puncak = useMemo(
    () => Math.max(...hariBulanIni.map((h) => Math.abs(h.netR)), 1),
    [hariBulanIni],
  );

  const tradeHariIni = useMemo(
    () => (hariTerpilih ? tradeDiTanggal(semua, hariTerpilih) : []),
    [semua, hariTerpilih],
  );

  const target = pengaturan.targetBulananR;
  const kemajuan = target > 0 ? Math.max(0, Math.min(100, (stats.netR / target) * 100)) : 0;
  const uangBulan = pengaturan.tampilkanUang
    ? formatUang(stats.netR * uangPerR(pengaturan), pengaturan)
    : null;

  function geser(langkah: number) {
    setKursor((k) => {
      const d = new Date(k.tahun, k.bulan + langkah, 1);
      return { tahun: d.getFullYear(), bulan: d.getMonth() };
    });
  }

  if (semua.length === 0) {
    return (
      <div className="w-full">
        <PageHeader judul="Calendar" keterangan={<span>Peta hasil trading hari demi hari</span>} />
        <EmptyState
          judul="Kalender masih kosong"
          pesan="Setiap trade yang kamu catat akan muncul di tanggalnya, lengkap dengan hasil harian dan mingguan."
          icon={<CalendarDays size={26} />}
        />
      </div>
    );
  }

  return (
    <div className={`w-full transition-opacity duration-200 ${loading ? "opacity-60" : "opacity-100"}`}>
      <PageHeader
        judul="Calendar"
        keterangan={
          <>
            <span>{namaBulan(kursor.tahun, kursor.bulan)}</span>
            <Pemisah />
            <span className="tabular-nums">{stats.total} trade</span>
            <Pemisah />
            <span className="tabular-nums">{hariBulanIni.length} hari aktif</span>
          </>
        }
        aksi={
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => geser(-1)}
              aria-label="Bulan sebelumnya"
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 transition-colors hover:bg-slate-50"
            >
              <ChevronLeft size={16} />
            </button>
            <Tombol
              variant="garis"
              size="sm"
              onClick={() => {
                const kini = new Date();
                setKursor({ tahun: kini.getFullYear(), bulan: kini.getMonth() });
              }}
            >
              Bulan ini
            </Tombol>
            <button
              type="button"
              onClick={() => geser(1)}
              aria-label="Bulan berikutnya"
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 transition-colors hover:bg-slate-50"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        }
      />

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Hasil Bulan Ini"
          value={fmtR(stats.netR)}
          tone={stats.netR > 0 ? "good" : stats.netR < 0 ? "bad" : "neutral"}
          icon={<CalendarDays size={15} />}
          sub={
            <span className="tabular-nums">
              {uangBulan ? `${uangBulan} · ` : ""}
              {fmtPips(stats.netPips)}
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
          label="Target Bulanan"
          value={target > 0 ? `${kemajuan.toFixed(0)}%` : "–"}
          tone={kemajuan >= 100 ? "good" : "neutral"}
          icon={<Target size={15} />}
          sub={
            target > 0 ? (
              <span className="tabular-nums">
                {fmtR(stats.netR)} dari target {fmtR(target)}
              </span>
            ) : (
              <span>Atur target di menu Settings</span>
            )
          }
        >
          {target > 0 && (
            <div className="h-2 w-full rounded-full bg-slate-100">
              <div
                className="h-2 rounded-full transition-all"
                style={{
                  width: `${Math.max(kemajuan, 1.5)}%`,
                  background: stats.netR >= 0 ? COLOR.good : COLOR.bad,
                }}
              />
            </div>
          )}
        </StatCard>

        <StatCard
          label="Hari Terbaik"
          value={hariTerbaik ? fmtR(hariTerbaik.netR) : "–"}
          tone={hariTerbaik && hariTerbaik.netR > 0 ? "good" : "neutral"}
          icon={<TrendingUp size={15} />}
          sub={
            hariTerbaik ? (
              <span className="tabular-nums">
                {formatTanggal(hariTerbaik.tanggal)} · {hariTerbaik.trades} trade
              </span>
            ) : (
              <span>Belum ada trade bulan ini</span>
            )
          }
        />

        <StatCard
          label="Hari Terburuk"
          value={hariTerburuk ? fmtR(hariTerburuk.netR) : "–"}
          tone={hariTerburuk && hariTerburuk.netR < 0 ? "bad" : "neutral"}
          icon={<TrendingDown size={15} />}
          sub={
            hariTerburuk ? (
              <span className="tabular-nums">
                {formatTanggal(hariTerburuk.tanggal)} · {hariTerburuk.trades} trade
              </span>
            ) : (
              <span>Belum ada trade bulan ini</span>
            )
          }
        />
      </div>

      <Card className="overflow-hidden">
        <CardHeader
          title={namaBulan(kursor.tahun, kursor.bulan)}
          subtitle="Klik tanggal mana pun untuk melihat trade hari itu"
          icon={<CalendarDays size={16} />}
          action={
            <div className="flex items-center gap-3 text-[11px] text-slate-500">
              <span className="inline-flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded" style={{ background: warnaAlpha(COLOR.good, 0.55) }} />
                Untung
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded" style={{ background: warnaAlpha(COLOR.bad, 0.55) }} />
                Rugi
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded bg-slate-100" />
                Tanpa trade
              </span>
            </div>
          }
        />

        <div className="overflow-x-auto p-4">
          <div className="min-w-[820px]">
            {/* Kepala kolom: tujuh hari plus ringkasan mingguan */}
            <div className="mb-2 grid grid-cols-[repeat(7,1fr)_128px] gap-1.5">
              {HARI_PENDEK.map((h) => (
                <div
                  key={h}
                  className="py-1 text-center text-[10px] font-semibold uppercase tracking-wider text-slate-400"
                >
                  {h}
                </div>
              ))}
              <div className="py-1 text-center text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                Minggu
              </div>
            </div>

            <div className="space-y-1.5">
              {minggu.map((m, i) => (
                <div key={i} className="grid grid-cols-[repeat(7,1fr)_128px] gap-1.5">
                  {m.sel.map((s) => {
                    if (!s.diBulanIni) {
                      return <div key={s.tanggal} className="h-[86px] rounded-lg bg-slate-50/40" />;
                    }
                    const stat = s.stat;
                    const kuat = stat ? Math.abs(stat.netR) / puncak : 0;
                    const alpha = 0.12 + kuat * 0.6;
                    const dasar = stat && stat.netR >= 0 ? COLOR.good : COLOR.bad;
                    const terang = alpha > 0.45;

                    return (
                      <button
                        key={s.tanggal}
                        type="button"
                        onClick={() => stat && setHariTerpilih(s.tanggal)}
                        disabled={!stat}
                        className={`h-[86px] rounded-lg border p-2 text-left transition-all ${
                          stat
                            ? "cursor-pointer border-transparent hover:-translate-y-0.5 hover:shadow-md"
                            : "border-slate-100 bg-slate-50/60"
                        }`}
                        style={stat ? { background: warnaAlpha(dasar, alpha) } : undefined}
                      >
                        <div className="flex items-start justify-between">
                          <span
                            className="text-[12px] font-semibold tabular-nums"
                            style={{ color: stat ? (terang ? "#ffffff" : "#334155") : "#94a3b8" }}
                          >
                            {s.nomor}
                          </span>
                          {stat && (
                            <span
                              className="text-[10px] tabular-nums"
                              style={{ color: terang ? "rgba(255,255,255,0.85)" : "#64748b" }}
                            >
                              {stat.trades}T
                            </span>
                          )}
                        </div>
                        {stat && (
                          <div className="mt-3">
                            <span
                              className="block text-[13px] font-semibold tabular-nums"
                              style={{ color: terang ? "#ffffff" : inkTanda(stat.netR) }}
                            >
                              {fmtR(stat.netR)}
                            </span>
                            <span
                              className="block text-[10px] tabular-nums"
                              style={{ color: terang ? "rgba(255,255,255,0.8)" : "#64748b" }}
                            >
                              {stat.wins}M · {stat.losses}K
                            </span>
                          </div>
                        )}
                      </button>
                    );
                  })}

                  <div className="flex h-[86px] flex-col justify-center rounded-lg border border-slate-200 bg-slate-50/70 px-3">
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                      Minggu {i + 1}
                    </span>
                    <span
                      className="mt-1 text-[15px] font-semibold tabular-nums"
                      style={{ color: m.trades > 0 ? inkTanda(m.netR) : "#94a3b8" }}
                    >
                      {m.trades > 0 ? fmtR(m.netR) : "–"}
                    </span>
                    <span className="text-[10px] tabular-nums text-slate-400">{m.trades} trade</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Card>

      <Drawer
        buka={!!hariTerpilih}
        tutup={() => setHariTerpilih(null)}
        judul={hariTerpilih ? formatTanggal(hariTerpilih) : ""}
        keterangan={`${tradeHariIni.length} trade pada hari ini`}
      >
        <RingkasanHari daftar={tradeHariIni} />
      </Drawer>
    </div>
  );
}

function RingkasanHari({ daftar }: { daftar: TradeMetrics[] }) {
  const stats = computeStats(daftar);
  if (daftar.length === 0) {
    return <p className="py-10 text-center text-sm text-slate-400">Tidak ada trade pada hari ini.</p>;
  }

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Net R", nilai: fmtR(stats.netR), warna: inkTanda(stats.netR) },
          { label: "Win rate", nilai: fmtPersen(stats.winRate, 0), warna: "#0f172a" },
          { label: "Pips", nilai: fmtPips(stats.netPips), warna: inkTanda(stats.netPips) },
        ].map((k) => (
          <div key={k.label} className="rounded-lg border border-slate-200 bg-slate-50/60 px-3 py-2.5">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">{k.label}</p>
            <p className="mt-1 text-[15px] font-semibold tabular-nums" style={{ color: k.warna }}>
              {k.nilai}
            </p>
          </div>
        ))}
      </div>

      <ul className="space-y-2.5">
        {daftar.map((t, i) => (
          <li key={String(t.id ?? i)} className="rounded-xl border border-slate-200 p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="text-[14px] font-semibold text-slate-900">{t.pair || "–"}</span>
                <StatusBadge status={t.status} />
              </div>
              <span className="text-[15px] font-semibold tabular-nums" style={{ color: inkTanda(t.r) }}>
                {fmtR(t.r)}
              </span>
            </div>
            <p className="mt-1.5 flex flex-wrap items-center gap-x-2 text-[11px] text-slate-500">
              <span>{t.setup || "Tanpa setup"}</span>
              <Pemisah />
              <span>{t.emosi || "Emosi tidak diisi"}</span>
              <Pemisah />
              <span className="tabular-nums">{fmtPips(t.pips)}</span>
              <Pemisah />
              <span className="tabular-nums">Risiko {t.risk} pips</span>
            </p>
            {String(t.catatan ?? "").trim() && (
              <p className="mt-2.5 flex gap-2 rounded-lg bg-slate-50 p-3 text-[12px] leading-relaxed text-slate-600">
                <Flag size={13} className="mt-0.5 shrink-0 text-slate-400" />
                {t.catatan}
              </p>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
