"use client";

// Potongan tampilan yang dipakai bersama oleh seluruh menu, supaya kartu,
// tombol filter, tabel, dan form punya bahasa visual yang sama.

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { AlertTriangle, Check, ChevronDown, Inbox, X } from "lucide-react";

// Warna mark dari palet yang kontrasnya sudah divalidasi di atas permukaan
// putih maupun gelap. Hijau/merah hanya untuk makna untung/rugi dan selalu
// didampingi tanda +/- atau teks, jadi arah tetap terbaca tanpa warna.
export const COLOR = {
  series: "#2a78d6",
  seriesMuda: "#86b6ef",
  good: "#0ca30c",
  bad: "#d03b3b",
  goodInk: "#006300",
  badInk: "#b62d2d",
  grid: "#eceef2",
  axis: "#94a3b8",
  label: "#52514e",
  neutral: "#94a3b8",
};

export const RING = "shadow-[0_1px_2px_rgba(15,23,42,0.04),0_4px_12px_-4px_rgba(15,23,42,0.06)]";

export function inkTanda(nilai: number): string {
  return nilai > 0 ? COLOR.goodInk : nilai < 0 ? COLOR.badInk : "#64748b";
}

// --- Kerangka --------------------------------------------------------------

export function Card({ className = "", children }: { className?: string; children: ReactNode }) {
  return (
    <section className={`rounded-xl border border-slate-200/70 bg-white ${RING} ${className}`}>{children}</section>
  );
}

export function CardHeader({
  title,
  subtitle,
  icon,
  action,
}: {
  title: string;
  subtitle?: string;
  icon?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-100 px-5 py-4">
      <div className="flex items-start gap-3">
        {icon && (
          <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-50 text-slate-400 ring-1 ring-inset ring-slate-100">
            {icon}
          </span>
        )}
        <div>
          <h3 className="text-sm font-semibold tracking-tight text-slate-900">{title}</h3>
          {subtitle && <p className="mt-0.5 text-xs text-slate-500">{subtitle}</p>}
        </div>
      </div>
      {action}
    </div>
  );
}

export function PageHeader({
  judul,
  keterangan,
  aksi,
}: {
  judul: string;
  keterangan?: ReactNode;
  aksi?: ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
      <div>
        <h2 className="text-[28px] font-semibold leading-tight tracking-tight text-slate-900">{judul}</h2>
        {keterangan && (
          <div className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-slate-500">
            {keterangan}
          </div>
        )}
      </div>
      {aksi && <div className="flex flex-wrap items-center gap-2">{aksi}</div>}
    </div>
  );
}

export function Pemisah() {
  return <span className="text-slate-300">•</span>;
}

// --- Kontrol ---------------------------------------------------------------

export function Segmented<T extends string>({
  options,
  value,
  onChange,
  size = "md",
}: {
  options: readonly { value: T; label: string; icon?: ReactNode }[];
  value: T;
  onChange: (value: T) => void;
  size?: "sm" | "md";
}) {
  return (
    <div className="inline-flex shrink-0 rounded-lg bg-slate-100 p-1">
      {options.map((opt) => {
        const aktif = opt.value === value;
        return (
          <button
            key={opt.value}
            type="button"
            aria-pressed={aktif}
            onClick={() => onChange(opt.value)}
            className={`flex items-center gap-1.5 rounded-md font-medium transition-all ${
              size === "sm" ? "px-2.5 py-1 text-[11px]" : "px-3 py-1.5 text-xs"
            } ${
              aktif
                ? "bg-white text-slate-900 shadow-[0_1px_3px_rgba(15,23,42,0.10)]"
                : "text-slate-500 hover:text-slate-800"
            }`}
          >
            {opt.icon}
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}

export function Tombol({
  children,
  onClick,
  variant = "utama",
  size = "md",
  type = "button",
  disabled = false,
  className = "",
}: {
  children: ReactNode;
  onClick?: () => void;
  variant?: "utama" | "halus" | "garis" | "bahaya";
  size?: "sm" | "md";
  type?: "button" | "submit";
  disabled?: boolean;
  className?: string;
}) {
  const gaya = {
    utama: "bg-slate-900 text-white hover:bg-slate-800 shadow-[0_1px_2px_rgba(15,23,42,0.20)]",
    halus: "bg-slate-100 text-slate-700 hover:bg-slate-200",
    garis: "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50",
    bahaya: "bg-[#d03b3b] text-white hover:bg-[#b62d2d] shadow-[0_1px_2px_rgba(208,59,59,0.30)]",
  }[variant];

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`inline-flex shrink-0 items-center justify-center gap-1.5 rounded-lg font-medium transition-all outline-none focus-visible:ring-2 focus-visible:ring-slate-900/20 disabled:pointer-events-none disabled:opacity-50 ${
        size === "sm" ? "px-3 py-1.5 text-xs" : "px-4 py-2.5 text-[13px]"
      } ${gaya} ${className}`}
    >
      {children}
    </button>
  );
}

// --- Form ------------------------------------------------------------------

const DASAR_INPUT =
  "w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-[13px] text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-400 focus:ring-4 focus:ring-slate-900/5 disabled:bg-slate-50 disabled:text-slate-400";

export function Field({
  label,
  hint,
  error,
  wajib = false,
  className = "",
  children,
}: {
  label: string;
  hint?: string;
  error?: string;
  wajib?: boolean;
  className?: string;
  children: ReactNode;
}) {
  return (
    <label className={`block ${className}`}>
      <span className="mb-1.5 flex items-center gap-1 text-[11px] font-semibold uppercase tracking-[0.06em] text-slate-500">
        {label}
        {wajib && <span className="text-[#d03b3b]">*</span>}
      </span>
      {children}
      {error ? (
        <span className="mt-1.5 block text-[11px] font-medium text-[#b62d2d]">{error}</span>
      ) : hint ? (
        <span className="mt-1.5 block text-[11px] text-slate-400">{hint}</span>
      ) : null}
    </label>
  );
}

export function TeksInput({
  value,
  onChange,
  placeholder,
  type = "text",
  disabled = false,
  salah = false,
  min,
  step,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: "text" | "number" | "date";
  disabled?: boolean;
  salah?: boolean;
  min?: string;
  step?: string;
}) {
  return (
    <input
      type={type}
      value={value}
      min={min}
      step={step}
      disabled={disabled}
      placeholder={placeholder}
      onChange={(e) => onChange(e.target.value)}
      className={`${DASAR_INPUT} ${salah ? "border-[#d03b3b] focus:border-[#d03b3b] focus:ring-[#d03b3b]/10" : ""} ${
        type === "number" ? "tabular-nums" : ""
      }`}
    />
  );
}

export function PilihInput({
  value,
  onChange,
  options,
  placeholder = "Pilih...",
  salah = false,
}: {
  value: string;
  onChange: (v: string) => void;
  options: readonly { value: string; label: string }[];
  placeholder?: string;
  salah?: boolean;
}) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`${DASAR_INPUT} cursor-pointer appearance-none pr-9 ${
          salah ? "border-[#d03b3b] focus:border-[#d03b3b] focus:ring-[#d03b3b]/10" : ""
        } ${value ? "" : "text-slate-400"}`}
      >
        <option value="">{placeholder}</option>
        {options.map((o) => (
          <option key={o.value} value={o.value} className="text-slate-900">
            {o.label}
          </option>
        ))}
      </select>
      <ChevronDown
        size={15}
        className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
      />
    </div>
  );
}

export function AreaTeks({
  value,
  onChange,
  placeholder,
  rows = 3,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  rows?: number;
}) {
  return (
    <textarea
      value={value}
      rows={rows}
      placeholder={placeholder}
      onChange={(e) => onChange(e.target.value)}
      className={`${DASAR_INPUT} resize-y leading-relaxed`}
    />
  );
}

export function Sakelar({
  checked,
  onChange,
  label,
  keterangan,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
  keterangan?: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className="flex w-full items-center justify-between gap-4 rounded-lg border border-slate-200 bg-white px-4 py-3 text-left transition-colors hover:bg-slate-50"
    >
      <span className="min-w-0">
        <span className="block text-[13px] font-medium text-slate-800">{label}</span>
        {keterangan && <span className="mt-0.5 block text-[11px] text-slate-500">{keterangan}</span>}
      </span>
      <span
        className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${
          checked ? "bg-slate-900" : "bg-slate-200"
        }`}
      >
        <span
          className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition-all ${
            checked ? "left-[22px]" : "left-0.5"
          }`}
        />
      </span>
    </button>
  );
}

// --- Penanda ---------------------------------------------------------------

export function StatusBadge({ status }: { status: "PROFIT" | "LOSS" | "BE" }) {
  const gaya =
    status === "PROFIT"
      ? "bg-[#0ca30c]/10 text-[#006300]"
      : status === "LOSS"
        ? "bg-[#d03b3b]/10 text-[#b62d2d]"
        : "bg-slate-100 text-slate-500";
  return (
    <span className={`inline-flex rounded-md px-1.5 py-0.5 text-[10px] font-bold tracking-wide ${gaya}`}>
      {status}
    </span>
  );
}

export function Label({ children, tone = "netral" }: { children: ReactNode; tone?: "netral" | "baik" | "buruk" }) {
  const gaya = {
    netral: "bg-slate-100 text-slate-600",
    baik: "bg-[#0ca30c]/10 text-[#006300]",
    buruk: "bg-[#d03b3b]/10 text-[#b62d2d]",
  }[tone];
  return (
    <span className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[11px] font-medium ${gaya}`}>
      {children}
    </span>
  );
}

export function DeltaChip({
  value,
  suffix = "",
  dark = false,
}: {
  value: number | null;
  suffix?: string;
  dark?: boolean;
}) {
  if (value === null) return null;
  const naik = value > 0;
  const datar = Number(value.toFixed(2)) === 0;

  const terang = datar
    ? "bg-slate-100 text-slate-500"
    : naik
      ? "bg-[#0ca30c]/10 text-[#006300]"
      : "bg-[#d03b3b]/10 text-[#b62d2d]";
  const gelap = datar
    ? "bg-white/10 text-slate-300"
    : naik
      ? "bg-[#0ca30c]/20 text-[#5fd35f]"
      : "bg-[#d03b3b]/20 text-[#f08a8a]";

  return (
    <span
      className={`inline-flex items-center gap-0.5 rounded-md px-1.5 py-0.5 text-[11px] font-semibold tabular-nums ${dark ? gelap : terang}`}
    >
      {datar ? "±" : naik ? "▲" : "▼"}
      {datar ? "0" : Math.abs(value).toFixed(2)}
      {suffix}
    </span>
  );
}

export function StatCard({
  label,
  value,
  tone = "neutral",
  icon,
  sub,
  delta,
  children,
}: {
  label: string;
  value: string;
  tone?: "neutral" | "good" | "bad";
  icon?: ReactNode;
  sub?: ReactNode;
  delta?: ReactNode;
  children?: ReactNode;
}) {
  const warnaNilai =
    tone === "good" ? "text-[#006300]" : tone === "bad" ? "text-[#b62d2d]" : "text-slate-900";

  return (
    <Card className="flex flex-col p-5">
      <div className="flex items-start justify-between gap-2">
        <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-400">{label}</p>
        {icon && (
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-slate-50 text-slate-400 ring-1 ring-inset ring-slate-100">
            {icon}
          </span>
        )}
      </div>
      <div className="mt-3 flex flex-wrap items-baseline gap-2">
        <span className={`text-[28px] font-semibold leading-none tracking-tight ${warnaNilai}`}>{value}</span>
        {delta}
      </div>
      {sub && <div className="mt-2 text-xs text-slate-500">{sub}</div>}
      {children && <div className="mt-auto pt-4">{children}</div>}
    </Card>
  );
}

/** Bar bertumpuk dengan jeda 2px berwarna permukaan sebagai pemisah. */
export function MeterBagian({ bagian }: { bagian: { key: string; jumlah: number; warna: string }[] }) {
  const dipakai = bagian.filter((b) => b.jumlah > 0);
  const total = dipakai.reduce((a, b) => a + b.jumlah, 0);
  if (total === 0) return null;

  return (
    <div>
      <div className="flex h-2 w-full gap-[2px]">
        {dipakai.map((b) => (
          <span
            key={b.key}
            className="h-full rounded-full"
            style={{ width: `${(b.jumlah / total) * 100}%`, background: b.warna }}
          />
        ))}
      </div>
      <div className="mt-2.5 flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-slate-500">
        {dipakai.map((b) => (
          <span key={b.key} className="inline-flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full" style={{ background: b.warna }} />
            {b.key} {b.jumlah}
          </span>
        ))}
      </div>
    </div>
  );
}

export type BarisKategori = {
  key: string;
  nilai: number;
  teksNilai: string;
  meta: string;
};

/**
 * Bar per kategori di atas track abu-abu. Saat semua nilai searah, bar memakai
 * lebar penuh dari kiri; sumbu nol di tengah hanya muncul ketika ada nilai
 * positif dan negatif sekaligus, supaya tidak ada ruang yang menganggur.
 */
export function CategoryBars({ data, kosong }: { data: BarisKategori[]; kosong: string }) {
  if (data.length === 0) {
    return <p className="px-5 py-10 text-center text-xs text-slate-400">{kosong}</p>;
  }

  const bercabang = data.some((d) => d.nilai < 0) && data.some((d) => d.nilai > 0);
  const maks = Math.max(...data.map((d) => Math.abs(d.nilai)), 0.0001);
  const lebarMaks = bercabang ? 49 : 100;

  return (
    <ul className="space-y-0.5 px-3 py-3">
      {data.map((d) => {
        const positif = d.nilai >= 0;
        const lebar = d.nilai === 0 ? 0 : Math.max((Math.abs(d.nilai) / maks) * lebarMaks, 1.5);
        return (
          <li key={d.key} className="rounded-lg px-2 py-2.5 transition-colors hover:bg-slate-50">
            <div className="flex items-baseline gap-2">
              <span className="min-w-0 flex-1 truncate text-[13px] font-medium text-slate-800">{d.key}</span>
              <span className="shrink-0 text-[11px] tabular-nums text-slate-400">{d.meta}</span>
              <span
                className="w-[66px] shrink-0 text-right text-[13px] font-semibold tabular-nums"
                style={{ color: positif ? COLOR.goodInk : COLOR.badInk }}
              >
                {d.teksNilai}
              </span>
            </div>
            <div className="relative mt-2 h-2 rounded-full bg-slate-100">
              <span
                className="absolute inset-y-0 rounded-full"
                style={{
                  width: `${lebar}%`,
                  background: positif ? COLOR.good : COLOR.bad,
                  ...(bercabang ? (positif ? { left: "51%" } : { right: "51%" }) : { left: 0 }),
                }}
              />
              {bercabang && <span className="absolute inset-y-[-2px] left-1/2 w-px -translate-x-1/2 bg-slate-300" />}
            </div>
          </li>
        );
      })}
    </ul>
  );
}

/** Cincin kemajuan untuk skor 0-100. */
export function CincinSkor({
  nilai,
  ukuran = 132,
  warna,
  label,
}: {
  nilai: number;
  ukuran?: number;
  warna: string;
  label?: string;
}) {
  const tebal = 10;
  const jari = (ukuran - tebal) / 2;
  const keliling = 2 * Math.PI * jari;
  const terisi = (Math.min(100, Math.max(0, nilai)) / 100) * keliling;

  return (
    <div className="relative" style={{ width: ukuran, height: ukuran }}>
      <svg width={ukuran} height={ukuran} className="-rotate-90">
        <circle cx={ukuran / 2} cy={ukuran / 2} r={jari} fill="none" stroke="#eef1f5" strokeWidth={tebal} />
        <circle
          cx={ukuran / 2}
          cy={ukuran / 2}
          r={jari}
          fill="none"
          stroke={warna}
          strokeWidth={tebal}
          strokeLinecap="round"
          strokeDasharray={`${terisi} ${keliling - terisi}`}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-[32px] font-semibold leading-none tracking-tight text-slate-900">
          {Math.round(nilai)}
        </span>
        {label && <span className="mt-1 text-[11px] font-medium text-slate-500">{label}</span>}
      </div>
    </div>
  );
}

// --- Tabel -----------------------------------------------------------------

export function MiniTable({
  kolom,
  baris,
  kosong,
}: {
  kolom: string[];
  baris: ReactNode[][];
  kosong: string;
}) {
  if (baris.length === 0) {
    return <p className="px-5 py-10 text-center text-xs text-slate-400">{kosong}</p>;
  }
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-[13px]">
        <thead>
          <tr className="bg-slate-50/70 text-[10px] uppercase tracking-wider text-slate-400">
            {kolom.map((k, i) => (
              <th
                key={k}
                className={`py-2.5 font-semibold ${i === 0 ? "pl-5 pr-3" : "px-3 text-right"} ${
                  i === kolom.length - 1 ? "pr-5" : ""
                }`}
              >
                {k}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {baris.map((r, i) => (
            <tr key={i} className="border-t border-slate-50 hover:bg-slate-50/70">
              {r.map((sel, j) => (
                <td
                  key={j}
                  className={`py-2.5 tabular-nums ${
                    j === 0 ? "pl-5 pr-3 font-medium text-slate-800" : "px-3 text-right text-slate-600"
                  } ${j === r.length - 1 ? "pr-5" : ""}`}
                >
                  {sel}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function EmptyState({
  judul,
  pesan,
  icon,
  aksi,
}: {
  judul: string;
  pesan: string;
  icon?: ReactNode;
  aksi?: ReactNode;
}) {
  return (
    <Card className="flex flex-col items-center justify-center px-6 py-20 text-center">
      <span className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-50 text-slate-400 ring-1 ring-inset ring-slate-100">
        {icon ?? <Inbox size={26} />}
      </span>
      <h3 className="text-base font-semibold text-slate-800">{judul}</h3>
      <p className="mt-1.5 max-w-sm text-sm text-slate-500">{pesan}</p>
      {aksi && <div className="mt-5">{aksi}</div>}
    </Card>
  );
}

// --- Notifikasi ------------------------------------------------------------

export type Notif = { pesan: string; tone: "baik" | "buruk" } | null;

export function useNotif(): [Notif, (pesan: string, tone?: "baik" | "buruk") => void] {
  const [notif, setNotif] = useState<Notif>(null);
  const jam = useRef<ReturnType<typeof setTimeout> | null>(null);

  const tampilkan = useCallback((pesan: string, tone: "baik" | "buruk" = "baik") => {
    setNotif({ pesan, tone });
    if (jam.current) clearTimeout(jam.current);
    jam.current = setTimeout(() => setNotif(null), 4000);
  }, []);

  useEffect(() => () => {
    if (jam.current) clearTimeout(jam.current);
  }, []);

  return [notif, tampilkan];
}

export function NotifHost({ notif }: { notif: Notif }) {
  if (!notif) return null;
  const baik = notif.tone === "baik";
  return (
    <div className="pointer-events-none fixed bottom-6 right-6 z-[60] animate-in fade-in slide-in-from-bottom-2">
      <div
        className={`flex items-center gap-2.5 rounded-xl px-4 py-3 text-[13px] font-medium text-white shadow-xl ${
          baik ? "bg-slate-900" : "bg-[#b62d2d]"
        }`}
      >
        <span
          className="flex h-5 w-5 items-center justify-center rounded-full"
          style={{ background: baik ? COLOR.good : "rgba(255,255,255,0.2)" }}
        >
          {baik ? <Check size={13} strokeWidth={3} /> : <AlertTriangle size={13} />}
        </span>
        {notif.pesan}
      </div>
    </div>
  );
}

/** Panel geser dari kanan untuk detail atau form panjang. */
export function Drawer({
  buka,
  tutup,
  judul,
  keterangan,
  lebar = "max-w-xl",
  children,
  footer,
}: {
  buka: boolean;
  tutup: () => void;
  judul: string;
  keterangan?: string;
  lebar?: string;
  children: ReactNode;
  footer?: ReactNode;
}) {
  useEffect(() => {
    if (!buka) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") tutup();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [buka, tutup]);

  if (!buka) return null;

  return (
    <div className="fixed inset-0 z-[70] flex justify-end">
      <div
        className="absolute inset-0 bg-slate-900/25 backdrop-blur-[2px] animate-in fade-in"
        onClick={tutup}
        aria-hidden
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={judul}
        className={`relative flex h-full w-full ${lebar} flex-col bg-white shadow-2xl animate-in slide-in-from-right duration-200`}
      >
        <div className="flex items-start justify-between gap-4 border-b border-slate-100 px-6 py-5">
          <div>
            <h3 className="text-base font-semibold tracking-tight text-slate-900">{judul}</h3>
            {keterangan && <p className="mt-0.5 text-xs text-slate-500">{keterangan}</p>}
          </div>
          <button
            type="button"
            onClick={tutup}
            aria-label="Tutup"
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700"
          >
            <X size={18} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-6 py-5">{children}</div>
        {footer && <div className="border-t border-slate-100 bg-slate-50/70 px-6 py-4">{footer}</div>}
      </div>
    </div>
  );
}

export function KonfirmasiDialog({
  buka,
  tutup,
  judul,
  pesan,
  labelAksi,
  onKonfirmasi,
  kataKunci,
}: {
  buka: boolean;
  tutup: () => void;
  judul: string;
  pesan: string;
  labelAksi: string;
  onKonfirmasi: () => void;
  /** Bila diisi, pengguna harus mengetik kata ini dulu. */
  kataKunci?: string;
}) {
  const [ketikan, setKetikan] = useState("");
  const [bukaSebelum, setBukaSebelum] = useState(buka);

  // Penyesuaian saat render: lebih murah daripada efek yang memicu render ulang.
  if (bukaSebelum !== buka) {
    setBukaSebelum(buka);
    setKetikan("");
  }

  if (!buka) return null;
  const boleh = !kataKunci || ketikan.trim().toUpperCase() === kataKunci.toUpperCase();

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/30 backdrop-blur-[2px] animate-in fade-in" onClick={tutup} aria-hidden />
      <div
        role="alertdialog"
        aria-modal="true"
        className="relative w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl animate-in fade-in zoom-in-95"
      >
        <div className="flex items-start gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#d03b3b]/10 text-[#b62d2d]">
            <AlertTriangle size={19} />
          </span>
          <div className="min-w-0">
            <h3 className="text-base font-semibold text-slate-900">{judul}</h3>
            <p className="mt-1.5 text-[13px] leading-relaxed text-slate-500">{pesan}</p>
          </div>
        </div>

        {kataKunci && (
          <div className="mt-4">
            <Field label={`Ketik ${kataKunci} untuk melanjutkan`}>
              <TeksInput value={ketikan} onChange={setKetikan} placeholder={kataKunci} />
            </Field>
          </div>
        )}

        <div className="mt-6 flex justify-end gap-2">
          <Tombol variant="garis" size="sm" onClick={tutup}>
            Batal
          </Tombol>
          <Tombol
            variant="bahaya"
            size="sm"
            disabled={!boleh}
            onClick={() => {
              onKonfirmasi();
              tutup();
            }}
          >
            {labelAksi}
          </Tombol>
        </div>
      </div>
    </div>
  );
}
