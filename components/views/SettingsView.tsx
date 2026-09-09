"use client";

import { useMemo, useState } from "react";
import {
  Database,
  Download,
  FileJson,
  Palette,
  RotateCcw,
  Save,
  ShieldAlert,
  Trash2,
  UserRound,
} from "lucide-react";

import {
  Card,
  CardHeader,
  Field,
  KonfirmasiDialog,
  Label,
  NotifHost,
  PageHeader,
  PilihInput,
  Sakelar,
  TeksInput,
  Tombol,
  useNotif,
} from "@/components/ui/kit";
import { PERIODS, PERIOD_LABEL, fmtR, normalizeTrades, type Period, type Trade } from "@/lib/analytics";
import { keCsv, unduhBerkas } from "@/lib/insight";
import {
  PENGATURAN_DEFAULT,
  formatUang,
  resetPengaturan,
  simpanPengaturan,
  uangPerR,
  usePengaturan,
  type Pengaturan,
} from "@/lib/settings";
import { supabase } from "@/lib/supabase";

const MATA_UANG = [
  { value: "USD", label: "USD ($)" },
  { value: "IDR", label: "IDR (Rp)" },
  { value: "EUR", label: "EUR (€)" },
];

const OPSI_PERIODE = PERIODS.map((p) => ({ value: p, label: PERIOD_LABEL[p] }));

export function SettingsView({ riwayat, refreshData }: { riwayat: Trade[]; refreshData: () => void }) {
  const pengaturan = usePengaturan();
  const [notif, beriNotif] = useNotif();

  const [draf, setDraf] = useState<Pengaturan>(pengaturan);
  const [bukaHapus, setBukaHapus] = useState(false);
  const [bukaReset, setBukaReset] = useState(false);
  const [menghapus, setMenghapus] = useState(false);

  // Ikut berubah kalau pengaturan diubah dari tempat lain.
  const [sumberDraf, setSumberDraf] = useState(pengaturan);
  if (sumberDraf !== pengaturan) {
    setSumberDraf(pengaturan);
    setDraf(pengaturan);
  }

  const berubah = useMemo(
    () => (Object.keys(pengaturan) as (keyof Pengaturan)[]).some((k) => draf[k] !== pengaturan[k]),
    [draf, pengaturan],
  );

  const semua = useMemo(() => normalizeTrades(riwayat ?? []), [riwayat]);
  const nilaiSatuR = uangPerR(draf);

  function ubah(bagian: Partial<Pengaturan>) {
    setDraf((d) => ({ ...d, ...bagian }));
  }

  function simpan() {
    simpanPengaturan(draf);
    beriNotif("Pengaturan tersimpan di peramban ini.");
  }

  function eksporCsv() {
    if (riwayat.length === 0) {
      beriNotif("Belum ada data untuk diekspor.", "buruk");
      return;
    }
    const tanggal = new Date().toISOString().slice(0, 10);
    unduhBerkas(`jurnal-trading-${tanggal}.csv`, keCsv(riwayat), "text/csv");
    beriNotif(`${riwayat.length} trade diekspor ke CSV.`);
  }

  function eksporJson() {
    if (riwayat.length === 0) {
      beriNotif("Belum ada data untuk diekspor.", "buruk");
      return;
    }
    const tanggal = new Date().toISOString().slice(0, 10);
    unduhBerkas(`jurnal-trading-${tanggal}.json`, JSON.stringify(riwayat, null, 2), "application/json");
    beriNotif(`${riwayat.length} trade diekspor ke JSON.`);
  }

  async function hapusSemua() {
    setMenghapus(true);
    const { error } = await supabase.from("jurnal").delete().not("id", "is", null);
    setMenghapus(false);
    if (error) {
      beriNotif(`Gagal menghapus data: ${error.message}`, "buruk");
      return;
    }
    beriNotif("Seluruh jurnal telah dihapus.");
    refreshData();
  }

  const alamatSupabase = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  const alamatTersamar = alamatSupabase
    ? alamatSupabase.replace(/^https?:\/\/([^.]{0,4})[^.]*/, (_m, awal) => `https://${awal}••••••`)
    : "Belum dikonfigurasi";

  const rentangData =
    semua.length > 0
      ? `${String(semua[0].tanggal ?? "").slice(0, 10)} sampai ${String(semua[semua.length - 1].tanggal ?? "").slice(0, 10)}`
      : "Belum ada data";

  return (
    <div className="w-full">
      <PageHeader
        judul="Settings"
        keterangan={<span>Preferensi tersimpan di peramban ini, data jurnal tetap di Supabase</span>}
        aksi={
          <>
            <Tombol variant="garis" onClick={() => setBukaReset(true)}>
              <RotateCcw size={15} />
              Kembalikan bawaan
            </Tombol>
            <Tombol onClick={simpan} disabled={!berubah}>
              <Save size={15} />
              {berubah ? "Simpan Perubahan" : "Tersimpan"}
            </Tombol>
          </>
        }
      />

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        {/* Profil dan ukuran risiko */}
        <Card>
          <CardHeader
            title="Profil Trader"
            subtitle="Dipakai untuk sapaan dan perkiraan nilai uang"
            icon={<UserRound size={16} />}
          />
          <div className="space-y-4 p-5">
            <Field label="Nama panggilan">
              <TeksInput
                value={draf.namaTrader}
                onChange={(v) => ubah({ namaTrader: v })}
                placeholder="Nama kamu"
              />
            </Field>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <Field label="Mata uang">
                <PilihInput
                  value={draf.mataUang}
                  onChange={(v) => ubah({ mataUang: v as Pengaturan["mataUang"] })}
                  options={MATA_UANG}
                  placeholder="Pilih"
                />
              </Field>
              <Field label="Saldo awal">
                <TeksInput
                  type="number"
                  min="0"
                  value={String(draf.saldoAwal)}
                  onChange={(v) => ubah({ saldoAwal: Number(v) || 0 })}
                />
              </Field>
              <Field label="Risiko / trade (%)">
                <TeksInput
                  type="number"
                  min="0"
                  step="0.1"
                  value={String(draf.risikoPersen)}
                  onChange={(v) => ubah({ risikoPersen: Number(v) || 0 })}
                />
              </Field>
            </div>

            <div className="flex flex-wrap items-center gap-2 rounded-lg bg-slate-50 px-4 py-3">
              <Label>
                1R setara <strong className="ml-1 tabular-nums">{formatUang(nilaiSatuR, draf).replace("+", "")}</strong>
              </Label>
              <Label tone={semua.length > 0 ? "netral" : "netral"}>
                Portofolio kini{" "}
                <strong className="ml-1 tabular-nums">
                  {formatUang(
                    normalizeTrades(riwayat ?? []).reduce((a, t) => a + t.r, 0) * nilaiSatuR,
                    draf,
                  )}
                </strong>
              </Label>
            </div>

            <Sakelar
              checked={draf.tampilkanUang}
              onChange={(v) => ubah({ tampilkanUang: v })}
              label="Tampilkan perkiraan nilai uang"
              keterangan="Menambahkan konversi rupiah atau dolar di samping angka R pada Dashboard dan Calendar."
            />
          </div>
        </Card>

        {/* Preferensi tampilan dan target */}
        <Card>
          <CardHeader
            title="Preferensi Analisa"
            subtitle="Nilai bawaan untuk Dashboard, Analytics, Calendar, dan Psychology"
            icon={<Palette size={16} />}
          />
          <div className="space-y-4 p-5">
            <Field
              label="Periode bawaan"
              hint="Rentang waktu yang otomatis terpilih saat membuka halaman analisa."
            >
              <PilihInput
                value={draf.periodeDefault}
                onChange={(v) => ubah({ periodeDefault: v as Period })}
                options={OPSI_PERIODE}
                placeholder="Pilih periode"
              />
            </Field>

            <Field label="Target bulanan (R)" hint="Dipakai sebagai batang kemajuan di menu Calendar.">
              <TeksInput
                type="number"
                min="0"
                step="0.5"
                value={String(draf.targetBulananR)}
                onChange={(v) => ubah({ targetBulananR: Number(v) || 0 })}
              />
            </Field>

            <Field
              label="Ambang overtrading (trade per hari)"
              hint="Hari dengan trade sebanyak ini atau lebih ditandai sebagai overtrading di menu Psychology."
            >
              <TeksInput
                type="number"
                min="2"
                value={String(draf.ambangOvertrade)}
                onChange={(v) => ubah({ ambangOvertrade: Math.max(2, Number(v) || 2) })}
              />
            </Field>

            <div className="rounded-lg bg-slate-50 px-4 py-3 text-[11px] leading-relaxed text-slate-500">
              Target {fmtR(draf.targetBulananR)} per bulan setara{" "}
              {formatUang(draf.targetBulananR * nilaiSatuR, draf)} dengan ukuran risiko saat ini.
            </div>
          </div>
        </Card>

        {/* Data */}
        <Card>
          <CardHeader
            title="Manajemen Data"
            subtitle="Cadangkan jurnal kamu kapan saja"
            icon={<Database size={16} />}
          />
          <div className="space-y-4 p-5">
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-lg border border-slate-200 px-4 py-3">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Total trade</p>
                <p className="mt-1 text-[20px] font-semibold tabular-nums text-slate-900">{riwayat.length}</p>
              </div>
              <div className="rounded-lg border border-slate-200 px-4 py-3">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Rentang data</p>
                <p className="mt-1 text-[12px] tabular-nums text-slate-700">{rentangData}</p>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <Tombol variant="garis" onClick={eksporCsv}>
                <Download size={15} />
                Ekspor CSV
              </Tombol>
              <Tombol variant="garis" onClick={eksporJson}>
                <FileJson size={15} />
                Ekspor JSON
              </Tombol>
            </div>

            <p className="text-[11px] leading-relaxed text-slate-500">
              Berkas CSV bisa dibuka di Excel atau Google Sheets. Berkas JSON menyimpan seluruh kolom apa adanya,
              termasuk tautan screenshot, sehingga cocok untuk cadangan penuh.
            </p>
          </div>
        </Card>

        {/* Koneksi dan zona bahaya */}
        <div className="flex flex-col gap-4">
          <Card>
            <CardHeader
              title="Koneksi Supabase"
              subtitle="Sumber data jurnal dan penyimpanan screenshot"
              icon={<Database size={16} />}
            />
            <div className="space-y-2.5 p-5 text-[12px]">
              {[
                ["Alamat proyek", alamatTersamar],
                ["Tabel jurnal", "jurnal"],
                ["Bucket screenshot", "screenshots"],
              ].map(([k, v]) => (
                <div key={k} className="flex items-center justify-between gap-3 border-b border-slate-50 pb-2.5 last:border-0 last:pb-0">
                  <span className="text-slate-500">{k}</span>
                  <span className="truncate font-medium text-slate-800">{v}</span>
                </div>
              ))}
              <div className="flex items-center justify-between gap-3 pt-1">
                <span className="text-slate-500">Status</span>
                <Label tone={alamatSupabase ? "baik" : "buruk"}>
                  {alamatSupabase ? "Terkonfigurasi" : "Belum diatur"}
                </Label>
              </div>
            </div>
          </Card>

          <Card className="flex-1 border-[#d03b3b]/30">
            <CardHeader
              title="Zona Bahaya"
              subtitle="Tindakan di bawah ini tidak bisa dibatalkan"
              icon={<ShieldAlert size={16} />}
            />
            <div className="p-5">
              <p className="text-[12px] leading-relaxed text-slate-600">
                Menghapus seluruh jurnal akan mengosongkan tabel di Supabase. Semua statistik, kalender, dan analisa
                ikut hilang. Ekspor cadangan dulu sebelum melanjutkan.
              </p>
              <div className="mt-4">
                <Tombol variant="bahaya" onClick={() => setBukaHapus(true)} disabled={riwayat.length === 0 || menghapus}>
                  <Trash2 size={15} />
                  {menghapus ? "Menghapus..." : `Hapus semua data (${riwayat.length})`}
                </Tombol>
              </div>
            </div>
          </Card>
        </div>
      </div>

      <KonfirmasiDialog
        buka={bukaHapus}
        tutup={() => setBukaHapus(false)}
        judul="Hapus seluruh jurnal?"
        pesan={`${riwayat.length} trade akan dihapus permanen dari Supabase. Tindakan ini tidak bisa dibatalkan.`}
        labelAksi="Hapus semuanya"
        kataKunci="HAPUS"
        onKonfirmasi={hapusSemua}
      />

      <KonfirmasiDialog
        buka={bukaReset}
        tutup={() => setBukaReset(false)}
        judul="Kembalikan pengaturan bawaan?"
        pesan={`Nama trader, mata uang, target, dan periode bawaan akan kembali seperti semula (${PENGATURAN_DEFAULT.namaTrader}, ${PENGATURAN_DEFAULT.mataUang}). Data jurnal tidak tersentuh.`}
        labelAksi="Kembalikan"
        onKonfirmasi={() => {
          resetPengaturan();
          beriNotif("Pengaturan dikembalikan ke bawaan.");
        }}
      />

      <NotifHost notif={notif} />
    </div>
  );
}
