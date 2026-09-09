"use client";

// Preferensi pengguna disimpan di localStorage peramban. Dibaca lewat
// useSyncExternalStore supaya seluruh komponen ikut berubah begitu pengaturan
// disimpan, tanpa perlu memuat ulang halaman.

import { useSyncExternalStore } from "react";
import type { Period } from "./analytics";

export type Pengaturan = {
  namaTrader: string;
  mataUang: "USD" | "IDR" | "EUR";
  saldoAwal: number;
  risikoPersen: number;
  /** Tampilkan perkiraan nilai uang di samping angka R. */
  tampilkanUang: boolean;
  periodeDefault: Period;
  targetBulananR: number;
  ambangOvertrade: number;
};

export const PENGATURAN_DEFAULT: Pengaturan = {
  namaTrader: "Trader",
  mataUang: "USD",
  saldoAwal: 1000,
  risikoPersen: 1,
  tampilkanUang: false,
  periodeDefault: "ALL",
  targetBulananR: 10,
  ambangOvertrade: 3,
};

const KUNCI = "jurnal-trading:pengaturan";

const SIMBOL: Record<Pengaturan["mataUang"], string> = {
  USD: "$",
  IDR: "Rp",
  EUR: "€",
};

let cache: Pengaturan | null = null;
const pendengar = new Set<() => void>();

function baca(): Pengaturan {
  if (typeof window === "undefined") return PENGATURAN_DEFAULT;
  try {
    const mentah = window.localStorage.getItem(KUNCI);
    if (!mentah) return PENGATURAN_DEFAULT;
    const tersimpan = JSON.parse(mentah) as Partial<Pengaturan>;
    return { ...PENGATURAN_DEFAULT, ...tersimpan };
  } catch {
    return PENGATURAN_DEFAULT;
  }
}

function snapshot(): Pengaturan {
  if (!cache) cache = baca();
  return cache;
}

function snapshotServer(): Pengaturan {
  return PENGATURAN_DEFAULT;
}

function subscribe(fn: () => void) {
  pendengar.add(fn);
  return () => {
    pendengar.delete(fn);
  };
}

export function simpanPengaturan(perubahan: Partial<Pengaturan>) {
  cache = { ...snapshot(), ...perubahan };
  try {
    window.localStorage.setItem(KUNCI, JSON.stringify(cache));
  } catch {
    // Mode penyamaran atau penyimpanan penuh: pengaturan tetap berlaku
    // untuk sesi ini walau gagal disimpan.
  }
  pendengar.forEach((fn) => fn());
}

export function resetPengaturan() {
  cache = { ...PENGATURAN_DEFAULT };
  try {
    window.localStorage.removeItem(KUNCI);
  } catch {
    // abaikan
  }
  pendengar.forEach((fn) => fn());
}

export function usePengaturan(): Pengaturan {
  return useSyncExternalStore(subscribe, snapshot, snapshotServer);
}

/** Nilai satu R dalam mata uang, dari saldo awal dan risiko per trade. */
export function uangPerR(p: Pengaturan): number {
  return (p.saldoAwal * p.risikoPersen) / 100;
}

export function formatUang(nilai: number, p: Pengaturan): string {
  const tanda = nilai < 0 ? "−" : nilai > 0 ? "+" : "";
  const angka = Math.abs(nilai);
  const teks =
    p.mataUang === "IDR"
      ? angka.toLocaleString("id-ID", { maximumFractionDigits: 0 })
      : angka.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  return `${tanda}${SIMBOL[p.mataUang]}${teks}`;
}
