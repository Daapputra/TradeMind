"use client";

import { useMemo, useState } from "react";
import {
  ArrowDownUp,
  ChevronLeft,
  ChevronRight,
  ImageIcon,
  NotebookPen,
  Pencil,
  Plus,
  Search,
  Trash2,
  X,
} from "lucide-react";

import {
  AreaTeks,
  Card,
  Drawer,
  EmptyState,
  Field,
  KonfirmasiDialog,
  Label,
  NotifHost,
  PageHeader,
  Pemisah,
  PilihInput,
  StatusBadge,
  TeksInput,
  Tombol,
  inkTanda,
  useNotif,
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
import { kunciTanggal } from "@/lib/insight";
import { supabase } from "@/lib/supabase";

export const MARKETS = [
  { value: "Forex", label: "Forex" },
  { value: "Metals", label: "Metals (Gold/Silver)" },
  { value: "Crypto", label: "Crypto" },
  { value: "Index", label: "Index / Saham" },
  { value: "Lainnya", label: "Lainnya" },
];

export const SETUPS = [
  { value: "Support and Resistance", label: "Support and Resistance" },
  { value: "Supply and Demand", label: "Supply and Demand" },
  { value: "Far Value Gap", label: "Fair Value Gap" },
  { value: "Retest", label: "Retest" },
  { value: "Order Block", label: "Order Block" },
  { value: "Key Levels", label: "Key Levels" },
  { value: "Liquidity", label: "Liquidity" },
  { value: "Other", label: "Lainnya" },
];

export const EMOSI = [
  { value: "Tenang", label: "Tenang" },
  { value: "FOMO", label: "FOMO (takut ketinggalan)" },
  { value: "Ragu-ragu", label: "Ragu-ragu" },
  { value: "Revenge", label: "Revenge (balas dendam)" },
  { value: "Overconfidence", label: "Overconfidence" },
  { value: "Serakah", label: "Serakah" },
];

const STATUS = [
  { value: "PROFIT", label: "PROFIT" },
  { value: "LOSS", label: "LOSS" },
  { value: "BE", label: "BE (Break Even)" },
];

const URUTAN = [
  { value: "baru", label: "Terbaru" },
  { value: "lama", label: "Terlama" },
  { value: "r-tinggi", label: "R tertinggi" },
  { value: "r-rendah", label: "R terendah" },
];

type Form = {
  tanggal: string;
  market: string;
  pair: string;
  setup: string;
  emosi: string;
  status: string;
  risk: string;
  target: string;
  hasilPips: string;
  catatan: string;
  gambarUrl: string;
};

const FORM_KOSONG: Form = {
  tanggal: "",
  market: "",
  pair: "",
  setup: "",
  emosi: "",
  status: "",
  risk: "",
  target: "",
  hasilPips: "",
  catatan: "",
  gambarUrl: "",
};

function periksaForm(f: Form): Partial<Record<keyof Form, string>> {
  const salah: Partial<Record<keyof Form, string>> = {};
  if (!f.tanggal) salah.tanggal = "Tanggal wajib diisi.";
  if (!f.market) salah.market = "Pilih market.";
  if (!f.pair.trim()) salah.pair = "Pair wajib diisi.";
  if (!f.status) salah.status = "Pilih status trade.";
  if (!f.risk || Number(f.risk) <= 0) salah.risk = "Risiko harus lebih dari 0 pips.";
  if (!f.target || Number(f.target) <= 0) salah.target = "Target harus lebih dari 0 pips.";
  if (f.status !== "BE" && (f.hasilPips === "" || Number(f.hasilPips) < 0)) {
    salah.hasilPips = "Isi hasil aktual dalam pips (tanpa tanda minus).";
  }
  return salah;
}

export function JournalView({
  riwayat,
  refreshData,
  loading = false,
}: {
  riwayat: Trade[];
  refreshData: () => void;
  loading?: boolean;
}) {
  const [notif, beriNotif] = useNotif();

  const [cari, setCari] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [filterMarket, setFilterMarket] = useState("");
  const [filterSetup, setFilterSetup] = useState("");
  const [urutan, setUrutan] = useState("baru");
  const [halaman, setHalaman] = useState(1);
  const perHalaman = 10;

  const [formBuka, setFormBuka] = useState(false);
  const [idEdit, setIdEdit] = useState<Trade["id"]>(null);
  const [form, setForm] = useState<Form>(FORM_KOSONG);
  const [salah, setSalah] = useState<Partial<Record<keyof Form, string>>>({});
  const [mengunggah, setMengunggah] = useState(false);
  const [menyimpan, setMenyimpan] = useState(false);

  const [detail, setDetail] = useState<TradeMetrics | null>(null);
  const [targetHapus, setTargetHapus] = useState<TradeMetrics | null>(null);

  const semua = useMemo(() => normalizeTrades(riwayat ?? []), [riwayat]);

  const tersaring = useMemo(() => {
    const kunci = cari.trim().toLowerCase();
    const hasil = semua.filter((t) => {
      if (filterStatus && t.status !== filterStatus) return false;
      if (filterMarket && String(t.market ?? "") !== filterMarket) return false;
      if (filterSetup && String(t.setup ?? "") !== filterSetup) return false;
      if (!kunci) return true;
      return [t.pair, t.setup, t.emosi, t.market, t.catatan]
        .map((v) => String(v ?? "").toLowerCase())
        .some((v) => v.includes(kunci));
    });

    const urut = [...hasil];
    if (urutan === "baru") urut.reverse();
    else if (urutan === "r-tinggi") urut.sort((a, b) => b.r - a.r);
    else if (urutan === "r-rendah") urut.sort((a, b) => a.r - b.r);
    return urut;
  }, [semua, cari, filterStatus, filterMarket, filterSetup, urutan]);

  const stats = useMemo(() => computeStats(tersaring), [tersaring]);

  const totalHalaman = Math.max(1, Math.ceil(tersaring.length / perHalaman));

  // Begitu saringan berubah, kembali ke halaman pertama.
  const kunciSaringan = [cari, filterStatus, filterMarket, filterSetup, urutan].join("|");
  const [kunciSebelum, setKunciSebelum] = useState(kunciSaringan);
  if (kunciSebelum !== kunciSaringan) {
    setKunciSebelum(kunciSaringan);
    setHalaman(1);
  }

  const halamanAman = Math.min(halaman, totalHalaman);
  const terlihat = tersaring.slice((halamanAman - 1) * perHalaman, halamanAman * perHalaman);
  const adaFilter = Boolean(cari || filterStatus || filterMarket || filterSetup);

  function ubah(bagian: Partial<Form>) {
    setForm((f) => ({ ...f, ...bagian }));
  }

  function bukaTambah() {
    setIdEdit(null);
    setForm({ ...FORM_KOSONG, tanggal: kunciTanggal(new Date()) });
    setSalah({});
    setFormBuka(true);
  }

  function bukaEdit(t: TradeMetrics) {
    setIdEdit(t.id ?? null);
    setForm({
      tanggal: String(t.tanggal ?? ""),
      market: String(t.market ?? ""),
      pair: String(t.pair ?? ""),
      setup: String(t.setup ?? ""),
      emosi: String(t.emosi ?? ""),
      status: t.status,
      risk: String(t.risk || ""),
      target: String(t.target || ""),
      hasilPips: String(Math.abs(Number(t.hasil_pips) || 0)),
      catatan: String(t.catatan ?? ""),
      gambarUrl: String(t.gambar_url ?? ""),
    });
    setSalah({});
    setDetail(null);
    setFormBuka(true);
  }

  async function unggahGambar(berkas: File | null) {
    if (!berkas) return;
    setMengunggah(true);
    const nama = `${Date.now()}-${Math.random().toString(36).slice(2)}-${berkas.name}`;
    const { error } = await supabase.storage.from("screenshots").upload(nama, berkas);
    if (error) {
      beriNotif(`Gagal mengunggah gambar: ${error.message}`, "buruk");
      setMengunggah(false);
      return;
    }
    const { data } = supabase.storage.from("screenshots").getPublicUrl(nama);
    ubah({ gambarUrl: data.publicUrl });
    setMengunggah(false);
    beriNotif("Screenshot berhasil dilampirkan.");
  }

  async function simpan() {
    const cek = periksaForm(form);
    setSalah(cek);
    if (Object.keys(cek).length > 0) {
      beriNotif("Masih ada kolom yang perlu diperbaiki.", "buruk");
      return;
    }

    setMenyimpan(true);
    const isi = {
      tanggal: form.tanggal,
      market: form.market,
      pair: form.pair.trim().toUpperCase(),
      setup: form.setup,
      emosi: form.emosi,
      status: form.status,
      hasil_pips: form.status === "BE" ? 0 : Math.abs(Number(form.hasilPips)),
      risk: Number(form.risk),
      target: Number(form.target),
      catatan: form.catatan,
      gambar_url: form.gambarUrl,
    };

    const { error } = idEdit
      ? await supabase.from("jurnal").update(isi).eq("id", idEdit)
      : await supabase.from("jurnal").insert([isi]);

    setMenyimpan(false);

    if (error) {
      beriNotif(`Gagal menyimpan: ${error.message}`, "buruk");
      return;
    }

    beriNotif(idEdit ? "Perubahan jurnal tersimpan." : "Jurnal baru tersimpan.");
    setFormBuka(false);
    setIdEdit(null);
    setForm(FORM_KOSONG);
    refreshData();
  }

  async function hapus(t: TradeMetrics) {
    const { error } = await supabase.from("jurnal").delete().eq("id", t.id);
    if (error) {
      beriNotif(`Gagal menghapus: ${error.message}`, "buruk");
      return;
    }
    beriNotif(`Trade ${t.pair ?? ""} pada ${formatTanggal(t.tanggal)} dihapus.`);
    setDetail(null);
    refreshData();
  }

  const rrRencana =
    Number(form.risk) > 0 && Number(form.target) > 0 ? Number(form.target) / Number(form.risk) : 0;
  const rPerkiraan =
    Number(form.risk) > 0 && form.status
      ? form.status === "BE"
        ? 0
        : (form.status === "PROFIT" ? 1 : -1) * (Math.abs(Number(form.hasilPips) || 0) / Number(form.risk))
      : null;

  return (
    <div className={`w-full transition-opacity duration-200 ${loading ? "opacity-60" : "opacity-100"}`}>
      <PageHeader
        judul="Trading Journal"
        keterangan={
          <>
            <span className="tabular-nums">{tersaring.length} trade tampil</span>
            <Pemisah />
            <span className="tabular-nums" style={{ color: inkTanda(stats.netR) }}>
              {fmtR(stats.netR)}
            </span>
            <Pemisah />
            <span className="tabular-nums">Win rate {fmtPersen(stats.winRate, 0)}</span>
          </>
        }
        aksi={
          <Tombol onClick={bukaTambah}>
            <Plus size={16} />
            Tambah Trade
          </Tombol>
        }
      />

      {/* Satu baris alat saring di atas tabel */}
      <Card className="mb-4 p-3">
        <div className="flex flex-col gap-2 lg:flex-row lg:items-center">
          <div className="relative min-w-0 flex-1">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              value={cari}
              onChange={(e) => setCari(e.target.value)}
              placeholder="Cari pair, setup, emosi, atau isi catatan..."
              className="w-full rounded-lg border border-slate-200 bg-white py-2.5 pl-9 pr-9 text-[13px] text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-400 focus:ring-4 focus:ring-slate-900/5"
            />
            {cari && (
              <button
                type="button"
                onClick={() => setCari("")}
                aria-label="Bersihkan pencarian"
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700"
              >
                <X size={15} />
              </button>
            )}
          </div>

          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:w-[560px]">
            <PilihInput value={filterStatus} onChange={setFilterStatus} options={STATUS} placeholder="Semua status" />
            <PilihInput value={filterMarket} onChange={setFilterMarket} options={MARKETS} placeholder="Semua market" />
            <PilihInput value={filterSetup} onChange={setFilterSetup} options={SETUPS} placeholder="Semua setup" />
            <PilihInput
              value={urutan}
              onChange={setUrutan}
              options={URUTAN}
              placeholder="Urutkan"
            />
          </div>
        </div>

        {adaFilter && (
          <div className="mt-2.5 flex items-center gap-2 border-t border-slate-100 pt-2.5">
            <ArrowDownUp size={13} className="text-slate-400" />
            <span className="text-[11px] text-slate-500">
              Menampilkan {tersaring.length} dari {semua.length} trade
            </span>
            <button
              type="button"
              onClick={() => {
                setCari("");
                setFilterStatus("");
                setFilterMarket("");
                setFilterSetup("");
              }}
              className="text-[11px] font-semibold text-slate-700 underline-offset-2 hover:underline"
            >
              Bersihkan filter
            </button>
          </div>
        )}
      </Card>

      {semua.length === 0 ? (
        <EmptyState
          judul="Jurnal masih kosong"
          pesan="Mulai catat trade pertama kamu. Setiap entri langsung dihitung ke dashboard, analytics, dan kalender."
          icon={<NotebookPen size={26} />}
          aksi={
            <Tombol onClick={bukaTambah}>
              <Plus size={16} />
              Tambah Trade
            </Tombol>
          }
        />
      ) : tersaring.length === 0 ? (
        <EmptyState
          judul="Tidak ada yang cocok"
          pesan="Kata kunci atau filter yang dipakai tidak menemukan trade apa pun. Coba longgarkan filternya."
          icon={<Search size={26} />}
        />
      ) : (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] text-left text-[13px]">
              <thead>
                <tr className="bg-slate-50/70 text-[10px] uppercase tracking-wider text-slate-400">
                  <th className="px-5 py-3 font-semibold">Tanggal</th>
                  <th className="px-3 py-3 font-semibold">Pair</th>
                  <th className="px-3 py-3 font-semibold">Setup</th>
                  <th className="px-3 py-3 font-semibold">Emosi</th>
                  <th className="px-3 py-3 font-semibold">Status</th>
                  <th className="px-3 py-3 text-right font-semibold">Risk</th>
                  <th className="px-3 py-3 text-right font-semibold">RR Plan</th>
                  <th className="px-3 py-3 text-right font-semibold">Hasil</th>
                  <th className="px-3 py-3 text-right font-semibold">R Aktual</th>
                  <th className="px-5 py-3 text-right font-semibold">Kelola</th>
                </tr>
              </thead>
              <tbody>
                {terlihat.map((t, i) => (
                  <tr
                    key={String(t.id ?? i)}
                    onClick={() => setDetail(t)}
                    className="cursor-pointer border-t border-slate-50 transition-colors hover:bg-slate-50/70"
                  >
                    <td className="whitespace-nowrap px-5 py-3 tabular-nums text-slate-600">
                      {formatTanggal(t.tanggal)}
                    </td>
                    <td className="px-3 py-3">
                      <span className="flex items-center gap-1.5 font-semibold text-slate-900">
                        {t.pair || "–"}
                        {t.gambar_url && <ImageIcon size={12} className="text-slate-400" />}
                      </span>
                      <span className="text-[11px] text-slate-400">{t.market || "–"}</span>
                    </td>
                    <td className="px-3 py-3 text-slate-600">{t.setup || "–"}</td>
                    <td className="px-3 py-3 text-slate-600">{t.emosi || "–"}</td>
                    <td className="px-3 py-3">
                      <StatusBadge status={t.status} />
                    </td>
                    <td className="px-3 py-3 text-right tabular-nums text-slate-500">
                      {t.risk > 0 ? `${t.risk} pips` : "–"}
                    </td>
                    <td className="px-3 py-3 text-right tabular-nums text-slate-500">
                      {t.plannedRr > 0 ? `1:${t.plannedRr.toFixed(1)}` : "–"}
                    </td>
                    <td className="px-3 py-3 text-right tabular-nums text-slate-700">{fmtPips(t.pips)}</td>
                    <td
                      className="px-3 py-3 text-right font-semibold tabular-nums"
                      style={{ color: inkTanda(t.r) }}
                    >
                      {fmtR(t.r)}
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex justify-end gap-1" onClick={(e) => e.stopPropagation()}>
                        <button
                          type="button"
                          onClick={() => bukaEdit(t)}
                          aria-label="Edit trade"
                          className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-800"
                        >
                          <Pencil size={14} />
                        </button>
                        <button
                          type="button"
                          onClick={() => setTargetHapus(t)}
                          aria-label="Hapus trade"
                          className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-[#d03b3b]/10 hover:text-[#b62d2d]"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {totalHalaman > 1 && (
            <div className="flex items-center justify-between gap-3 border-t border-slate-100 px-5 py-3">
              <span className="text-[11px] tabular-nums text-slate-500">
                Halaman {halamanAman} dari {totalHalaman}
              </span>
              <div className="flex gap-1.5">
                <button
                  type="button"
                  disabled={halamanAman <= 1}
                  onClick={() => setHalaman(halamanAman - 1)}
                  className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-slate-500 transition-colors hover:bg-slate-50 disabled:opacity-40"
                  aria-label="Halaman sebelumnya"
                >
                  <ChevronLeft size={15} />
                </button>
                <button
                  type="button"
                  disabled={halamanAman >= totalHalaman}
                  onClick={() => setHalaman(halamanAman + 1)}
                  className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-slate-500 transition-colors hover:bg-slate-50 disabled:opacity-40"
                  aria-label="Halaman berikutnya"
                >
                  <ChevronRight size={15} />
                </button>
              </div>
            </div>
          )}
        </Card>
      )}

      {/* Form tambah / edit */}
      <Drawer
        buka={formBuka}
        tutup={() => setFormBuka(false)}
        judul={idEdit ? "Edit Jurnal Trading" : "Tambah Trade Baru"}
        keterangan="Kolom bertanda bintang wajib diisi."
        footer={
          <div className="flex justify-end gap-2">
            <Tombol variant="garis" onClick={() => setFormBuka(false)}>
              Batal
            </Tombol>
            <Tombol onClick={simpan} disabled={menyimpan || mengunggah}>
              {menyimpan ? "Menyimpan..." : idEdit ? "Simpan Perubahan" : "Simpan Jurnal"}
            </Tombol>
          </div>
        }
      >
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Tanggal" wajib error={salah.tanggal}>
              <TeksInput
                type="date"
                value={form.tanggal}
                onChange={(v) => ubah({ tanggal: v })}
                salah={!!salah.tanggal}
              />
            </Field>
            <Field label="Market" wajib error={salah.market}>
              <PilihInput
                value={form.market}
                onChange={(v) => ubah({ market: v })}
                options={MARKETS}
                placeholder="Pilih market..."
                salah={!!salah.market}
              />
            </Field>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Pair" wajib error={salah.pair} hint="Contoh: XAUUSD">
              <TeksInput
                value={form.pair}
                onChange={(v) => ubah({ pair: v.toUpperCase() })}
                placeholder="XAUUSD"
                salah={!!salah.pair}
              />
            </Field>
            <Field label="Setup">
              <PilihInput
                value={form.setup}
                onChange={(v) => ubah({ setup: v })}
                options={SETUPS}
                placeholder="Pilih setup..."
              />
            </Field>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Emosi saat entry" hint="Dipakai di menu Psychology">
              <PilihInput
                value={form.emosi}
                onChange={(v) => ubah({ emosi: v })}
                options={EMOSI}
                placeholder="Pilih emosi..."
              />
            </Field>
            <Field label="Status" wajib error={salah.status}>
              <PilihInput
                value={form.status}
                onChange={(v) => ubah({ status: v, hasilPips: v === "BE" ? "0" : form.hasilPips })}
                options={STATUS}
                placeholder="Pilih status..."
                salah={!!salah.status}
              />
            </Field>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <Field label="Risiko (pips)" wajib error={salah.risk}>
              <TeksInput
                type="number"
                min="0"
                value={form.risk}
                onChange={(v) => ubah({ risk: v })}
                placeholder="20"
                salah={!!salah.risk}
              />
            </Field>
            <Field label="Target (pips)" wajib error={salah.target}>
              <TeksInput
                type="number"
                min="0"
                value={form.target}
                onChange={(v) => ubah({ target: v })}
                placeholder="40"
                salah={!!salah.target}
              />
            </Field>
            <Field label="Hasil aktual (pips)" error={salah.hasilPips} hint="Tanpa tanda minus">
              <TeksInput
                type="number"
                min="0"
                value={form.status === "BE" ? "0" : form.hasilPips}
                disabled={form.status === "BE"}
                onChange={(v) => ubah({ hasilPips: v })}
                placeholder="40"
                salah={!!salah.hasilPips}
              />
            </Field>
          </div>

          {(rrRencana > 0 || rPerkiraan !== null) && (
            <div className="flex flex-wrap gap-2 rounded-lg bg-slate-50 px-4 py-3">
              {rrRencana > 0 && (
                <Label>
                  RR rencana <strong className="ml-1 tabular-nums">1:{rrRencana.toFixed(1)}</strong>
                </Label>
              )}
              {rPerkiraan !== null && (
                <Label tone={rPerkiraan > 0 ? "baik" : rPerkiraan < 0 ? "buruk" : "netral"}>
                  Perkiraan hasil <strong className="ml-1 tabular-nums">{fmtR(rPerkiraan)}</strong>
                </Label>
              )}
            </div>
          )}

          <Field label="Catatan" hint="Apa yang berjalan sesuai rencana, apa yang tidak?">
            <AreaTeks
              value={form.catatan}
              onChange={(v) => ubah({ catatan: v })}
              rows={4}
              placeholder="Sesuai plan, tapi agak ragu saat entry karena spread melebar..."
            />
          </Field>

          <Field label="Screenshot chart" hint="Opsional, tersimpan di Supabase Storage">
            <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50/50 p-4">
              <input
                type="file"
                accept="image/*"
                disabled={mengunggah}
                onChange={(e) => unggahGambar(e.target.files?.[0] ?? null)}
                className="w-full cursor-pointer text-[12px] text-slate-500 file:mr-3 file:cursor-pointer file:rounded-lg file:border-0 file:bg-slate-900 file:px-3 file:py-2 file:text-[12px] file:font-medium file:text-white hover:file:bg-slate-800"
              />
              {mengunggah && <p className="mt-2 animate-pulse text-[11px] text-slate-500">Sedang mengunggah...</p>}
              {form.gambarUrl && !mengunggah && (
                <div className="mt-3 flex items-start gap-3">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={form.gambarUrl}
                    alt="Pratinjau screenshot"
                    className="h-20 w-32 rounded-lg border border-slate-200 object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => ubah({ gambarUrl: "" })}
                    className="text-[11px] font-semibold text-[#b62d2d] underline-offset-2 hover:underline"
                  >
                    Lepas gambar
                  </button>
                </div>
              )}
            </div>
          </Field>
        </div>
      </Drawer>

      {/* Detail trade */}
      <Drawer
        buka={!!detail}
        tutup={() => setDetail(null)}
        judul={detail ? `${detail.pair || "Trade"} · ${formatTanggal(detail.tanggal)}` : ""}
        keterangan={detail ? `${detail.market || "-"} · ${detail.setup || "Tanpa setup"}` : ""}
        footer={
          detail && (
            <div className="flex justify-between gap-2">
              <Tombol variant="garis" onClick={() => setTargetHapus(detail)}>
                <Trash2 size={15} />
                Hapus
              </Tombol>
              <Tombol onClick={() => bukaEdit(detail)}>
                <Pencil size={15} />
                Edit Trade
              </Tombol>
            </div>
          )
        }
      >
        {detail && (
          <div className="space-y-5">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {[
                { label: "Status", nilai: <StatusBadge status={detail.status} /> },
                {
                  label: "R Aktual",
                  nilai: (
                    <span className="font-semibold tabular-nums" style={{ color: inkTanda(detail.r) }}>
                      {fmtR(detail.r)}
                    </span>
                  ),
                },
                { label: "Hasil", nilai: <span className="tabular-nums">{fmtPips(detail.pips)}</span> },
                {
                  label: "RR Plan",
                  nilai: (
                    <span className="tabular-nums">
                      {detail.plannedRr > 0 ? `1:${detail.plannedRr.toFixed(1)}` : "–"}
                    </span>
                  ),
                },
              ].map((k) => (
                <div key={k.label} className="rounded-lg border border-slate-200 bg-slate-50/60 px-3 py-2.5">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">{k.label}</p>
                  <div className="mt-1.5 text-[13px] text-slate-800">{k.nilai}</div>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-lg border border-slate-200 px-3 py-2.5">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Risiko</p>
                <p className="mt-1 text-[13px] tabular-nums text-slate-800">{detail.risk} pips</p>
              </div>
              <div className="rounded-lg border border-slate-200 px-3 py-2.5">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Emosi saat entry</p>
                <p className="mt-1 text-[13px] text-slate-800">{detail.emosi || "Tidak diisi"}</p>
              </div>
            </div>

            {detail.gambar_url && (
              <div>
                <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.06em] text-slate-500">
                  Screenshot chart
                </p>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={String(detail.gambar_url)}
                  alt="Screenshot trade"
                  className="w-full rounded-xl border border-slate-200"
                />
              </div>
            )}

            <div>
              <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.06em] text-slate-500">Catatan</p>
              <p className="whitespace-pre-wrap rounded-xl border border-slate-200 bg-slate-50/60 p-4 text-[13px] leading-relaxed text-slate-700">
                {String(detail.catatan ?? "").trim() || "Belum ada catatan untuk trade ini."}
              </p>
            </div>
          </div>
        )}
      </Drawer>

      <KonfirmasiDialog
        buka={!!targetHapus}
        tutup={() => setTargetHapus(null)}
        judul="Hapus trade ini?"
        pesan={
          targetHapus
            ? `Trade ${targetHapus.pair ?? ""} pada ${formatTanggal(targetHapus.tanggal)} akan dihapus permanen dan hilang dari seluruh statistik.`
            : ""
        }
        labelAksi="Hapus permanen"
        onKonfirmasi={() => targetHapus && hapus(targetHapus)}
      />

      <NotifHost notif={notif} />
    </div>
  );
}

