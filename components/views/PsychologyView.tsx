"use client";

import { useMemo, useState } from "react";
import {
  AlertTriangle,
  Brain,
  CheckCircle2,
  Flame,
  Gauge,
  HeartPulse,
  Quote,
  Scale,
  Smile,
} from "lucide-react";

import {
  COLOR,
  Card,
  CardHeader,
  CategoryBars,
  CincinSkor,
  EmptyState,
  Label,
  MeterBagian,
  PageHeader,
  Pemisah,
  Segmented,
  StatCard,
  StatusBadge,
  inkTanda,
} from "@/components/ui/kit";
import {
  PERIODS,
  PERIOD_LABEL,
  computeStats,
  fmtPersen,
  fmtR,
  formatTanggal,
  groupStats,
  normalizeTrades,
  splitByPeriod,
  type Period,
  type Trade,
} from "@/lib/analytics";
import { EMOSI_BERISIKO, indeksBalasDendam, polaPsikologi, skorDisiplin, type Pola } from "@/lib/insight";
import { usePengaturan } from "@/lib/settings";

const WARNA_EMOSI: Record<string, string> = {
  Tenang: COLOR.good,
  FOMO: COLOR.bad,
  Revenge: "#b62d2d",
  Serakah: "#eb6834",
  Overconfidence: "#eda100",
  "Ragu-ragu": COLOR.neutral,
};

function mutuSkor(skor: number): { teks: string; warna: string; tone: "good" | "bad" | "neutral" } {
  if (skor >= 80) return { teks: "Sangat disiplin", warna: COLOR.good, tone: "good" };
  if (skor >= 60) return { teks: "Cukup disiplin", warna: "#eda100", tone: "neutral" };
  if (skor >= 40) return { teks: "Perlu perbaikan", warna: "#eb6834", tone: "neutral" };
  return { teks: "Rawan", warna: COLOR.bad, tone: "bad" };
}

export function PsychologyView({ riwayat, loading = false }: { riwayat: Trade[]; loading?: boolean }) {
  const pengaturan = usePengaturan();
  const [period, setPeriod] = useState<Period>(pengaturan.periodeDefault);

  const semua = useMemo(() => normalizeTrades(riwayat ?? []), [riwayat]);
  const { current } = useMemo(() => splitByPeriod(semua, period), [semua, period]);

  const stats = useMemo(() => computeStats(current), [current]);
  const disiplin = useMemo(() => skorDisiplin(current), [current]);
  const pola = useMemo(() => polaPsikologi(current, pengaturan.ambangOvertrade), [current, pengaturan.ambangOvertrade]);
  const grupEmosi = useMemo(() => groupStats(current, (t) => t.emosi), [current]);

  const barisEmosi = useMemo(
    () =>
      grupEmosi.map((g) => ({
        key: g.key,
        nilai: g.netR,
        teksNilai: fmtR(g.netR),
        meta: `${g.trades}T · ${fmtPersen(g.winRate, 0)}`,
      })),
    [grupEmosi],
  );

  const sebaranEmosi = useMemo(
    () =>
      grupEmosi
        .slice()
        .sort((a, b) => b.trades - a.trades)
        .map((g) => ({
          key: g.key,
          jumlah: g.trades,
          warna: WARNA_EMOSI[g.key] ?? COLOR.neutral,
        })),
    [grupEmosi],
  );

  const jumlahBerisiko = useMemo(
    () => current.filter((t) => EMOSI_BERISIKO.includes(String(t.emosi ?? ""))).length,
    [current],
  );
  const jumlahBalasDendam = useMemo(() => indeksBalasDendam(current).size, [current]);

  // Catatan dari trade rugi adalah bahan refleksi paling berguna.
  const refleksi = useMemo(
    () =>
      current
        .filter((t) => String(t.catatan ?? "").trim().length > 0)
        .slice(-6)
        .reverse(),
    [current],
  );

  const mutu = mutuSkor(disiplin.skor);

  if (semua.length === 0) {
    return (
      <div className="w-full">
        <PageHeader judul="Psychology" keterangan={<span>Sisi mental dari hasil trading kamu</span>} />
        <EmptyState
          judul="Belum ada bahan untuk dibaca"
          pesan="Isi kolom emosi dan catatan setiap kali mencatat trade. Dari sana pola mental kamu bisa dipetakan."
          icon={<Brain size={26} />}
        />
      </div>
    );
  }

  return (
    <div className={`w-full transition-opacity duration-200 ${loading ? "opacity-60" : "opacity-100"}`}>
      <PageHeader
        judul="Psychology"
        keterangan={
          <>
            <span>{PERIOD_LABEL[period]}</span>
            <Pemisah />
            <span className="tabular-nums">{stats.total} trade</span>
            <Pemisah />
            <span className="tabular-nums">{jumlahBerisiko} entry dengan emosi berisiko</span>
          </>
        }
        aksi={<Segmented options={PERIODS.map((p) => ({ value: p, label: p }))} value={period} onChange={setPeriod} />}
      />

      {stats.total === 0 ? (
        <EmptyState
          judul="Tidak ada trade pada periode ini"
          pesan="Pilih rentang waktu yang lebih panjang untuk melihat pola psikologi kamu."
          icon={<Brain size={26} />}
        />
      ) : (
        <>
          <div className="mb-6 grid grid-cols-1 gap-4 xl:grid-cols-3">
            {/* Skor disiplin */}
            <Card className="xl:col-span-2">
              <CardHeader
                title="Skor Disiplin"
                subtitle="Lima kebiasaan yang sepenuhnya ada di bawah kendali kamu"
                icon={<Gauge size={16} />}
                action={<Label tone={mutu.tone === "good" ? "baik" : mutu.tone === "bad" ? "buruk" : "netral"}>{mutu.teks}</Label>}
              />
              <div className="flex flex-col gap-6 p-5 sm:flex-row sm:items-center">
                <div className="flex shrink-0 justify-center">
                  <CincinSkor nilai={disiplin.skor} warna={mutu.warna} label="dari 100" />
                </div>

                <ul className="min-w-0 flex-1 space-y-3">
                  {disiplin.komponen.map((k) => {
                    const nilai = Math.min(100, Math.max(0, k.nilai));
                    return (
                      <li key={k.nama}>
                        <div className="flex items-baseline justify-between gap-3">
                          <span className="truncate text-[13px] font-medium text-slate-800">{k.nama}</span>
                          <span className="shrink-0 text-[12px] font-semibold tabular-nums text-slate-600">
                            {Math.round(nilai)}
                            <span className="ml-1 text-[10px] font-normal text-slate-400">bobot {k.bobot}%</span>
                          </span>
                        </div>
                        <div className="mt-1.5 h-2 rounded-full bg-slate-100">
                          <div
                            className="h-2 rounded-full transition-all"
                            style={{
                              width: `${Math.max(nilai, 1.5)}%`,
                              background: nilai >= 70 ? COLOR.good : nilai >= 40 ? "#eda100" : COLOR.bad,
                            }}
                          />
                        </div>
                        <p className="mt-1.5 text-[11px] text-slate-500">{k.detail}</p>
                      </li>
                    );
                  })}
                </ul>
              </div>
            </Card>

            <div className="flex flex-col gap-4">
              <StatCard
                label="Entry Tenang"
                value={fmtPersen(
                  stats.total > 0
                    ? ((grupEmosi.find((g) => g.key === "Tenang")?.trades ?? 0) / stats.total) * 100
                    : 0,
                  0,
                )}
                tone="neutral"
                icon={<Smile size={15} />}
                sub={<span className="tabular-nums">{grupEmosi.find((g) => g.key === "Tenang")?.trades ?? 0} dari {stats.total} trade</span>}
              />
              <StatCard
                label="Trade Balas Dendam"
                value={String(jumlahBalasDendam)}
                tone={jumlahBalasDendam > 0 ? "bad" : "good"}
                icon={<Flame size={15} />}
                sub={<span>Entry di hari yang sama tepat setelah loss</span>}
              />
              <Card className="flex-1 p-5">
                <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-400">
                  Sebaran Emosi
                </p>
                <div className="mt-4">
                  {sebaranEmosi.length > 0 ? (
                    <MeterBagian bagian={sebaranEmosi} />
                  ) : (
                    <p className="text-xs text-slate-400">Kolom emosi belum diisi pada jurnal.</p>
                  )}
                </div>
              </Card>
            </div>
          </div>

          <div className="mb-6 grid grid-cols-1 gap-4 xl:grid-cols-2">
            <Card>
              <CardHeader
                title="Hasil per Kondisi Emosi"
                subtitle="Net R untuk setiap kondisi mental saat entry"
                icon={<HeartPulse size={16} />}
              />
              <CategoryBars data={barisEmosi} kosong="Kolom emosi belum diisi pada jurnal." />
            </Card>

            <Card>
              <CardHeader
                title="Catatan Refleksi"
                subtitle="Enam catatan terakhir dari jurnal kamu"
                icon={<Quote size={16} />}
              />
              {refleksi.length === 0 ? (
                <p className="px-5 py-16 text-center text-xs text-slate-400">
                  Belum ada catatan. Menulis satu kalimat setiap trade sangat membantu evaluasi.
                </p>
              ) : (
                <ul className="space-y-2 p-4">
                  {refleksi.map((t, i) => (
                    <li key={String(t.id ?? i)} className="rounded-lg border border-slate-200 p-3.5">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className="flex items-center gap-2 text-[12px] font-semibold text-slate-800">
                          {t.pair || "–"}
                          <StatusBadge status={t.status} />
                        </span>
                        <span className="text-[11px] tabular-nums text-slate-400">
                          {formatTanggal(t.tanggal)} · {t.emosi || "emosi tidak diisi"}
                        </span>
                      </div>
                      <p className="mt-2 text-[12px] leading-relaxed text-slate-600">{t.catatan}</p>
                    </li>
                  ))}
                </ul>
              )}
            </Card>
          </div>

          <Card className="mb-6">
            <CardHeader
              title="Deteksi Pola Perilaku"
              subtitle="Membandingkan trade yang cocok dengan pola melawan trade lainnya"
              icon={<Scale size={16} />}
            />
            {pola.length === 0 ? (
              <p className="px-5 py-16 text-center text-xs text-slate-400">
                Butuh minimal empat trade agar pola perilaku bisa dibandingkan.
              </p>
            ) : (
              <div className="grid grid-cols-1 gap-4 p-4 lg:grid-cols-2">
                {pola.map((p) => (
                  <KartuPola key={p.kunci} pola={p} />
                ))}
              </div>
            )}
          </Card>
        </>
      )}
    </div>
  );
}

function KartuPola({ pola }: { pola: Pola }) {
  const selisih = pola.cocok.expectancyR - pola.sisa.expectancyR;
  const adaPembanding = pola.sisa.total > 0;

  return (
    <div className="rounded-xl border border-slate-200 p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h4 className="flex items-center gap-2 text-[13px] font-semibold text-slate-900">
            {pola.merugikan ? (
              <AlertTriangle size={14} className="shrink-0 text-[#b62d2d]" />
            ) : (
              <CheckCircle2 size={14} className="shrink-0 text-[#006300]" />
            )}
            {pola.judul}
          </h4>
          <p className="mt-1 text-[11px] leading-relaxed text-slate-500">{pola.deskripsi}</p>
        </div>
        <Label tone={pola.merugikan ? "buruk" : "baik"}>{pola.merugikan ? "Merugikan" : "Aman"}</Label>
      </div>

      <div className="mt-3.5 grid grid-cols-2 gap-2">
        <div className="rounded-lg bg-slate-50 px-3 py-2.5">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Pola ini</p>
          <p className="mt-1 text-[15px] font-semibold tabular-nums" style={{ color: inkTanda(pola.cocok.expectancyR) }}>
            {fmtR(pola.cocok.expectancyR)}
          </p>
          <p className="mt-0.5 text-[10px] tabular-nums text-slate-500">
            {pola.cocok.total} trade · WR {fmtPersen(pola.cocok.winRate, 0)}
          </p>
        </div>
        <div className="rounded-lg bg-slate-50 px-3 py-2.5">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Trade lainnya</p>
          <p className="mt-1 text-[15px] font-semibold tabular-nums" style={{ color: inkTanda(pola.sisa.expectancyR) }}>
            {adaPembanding ? fmtR(pola.sisa.expectancyR) : "–"}
          </p>
          <p className="mt-0.5 text-[10px] tabular-nums text-slate-500">
            {pola.sisa.total} trade{adaPembanding ? ` · WR ${fmtPersen(pola.sisa.winRate, 0)}` : ""}
          </p>
        </div>
      </div>

      {adaPembanding && (
        <p className="mt-3 text-[11px] leading-relaxed text-slate-600">
          {pola.merugikan
            ? `Ekspektasi turun ${fmtR(selisih)} per trade dibanding kondisi normal. Buat aturan jeda untuk memutus pola ini.`
            : `Ekspektasi justru naik ${fmtR(selisih)} per trade. Pola ini belum jadi masalah pada periode ini.`}
        </p>
      )}
    </div>
  );
}
