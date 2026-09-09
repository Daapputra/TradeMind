"use client";

// Bentuk batang, label, dan tooltip yang dipakai oleh beberapa grafik.

import type { ReactNode } from "react";
import { COLOR } from "@/components/ui/kit";
import { fmtSigned } from "@/lib/analytics";

/* eslint-disable @typescript-eslint/no-explicit-any */

/** Batang dengan ujung data membulat 4px dan sisi garis nol tetap siku. */
export function SignedBar(props: any) {
  const { x, y, width, height, value, warnaPositif, warnaNegatif } = props;
  const positif = Number(value) >= 0;
  const h = Math.max(Math.abs(height), 1);
  const r = Math.min(4, width / 2, h);
  const d = positif
    ? `M${x},${y + h} L${x},${y + r} Q${x},${y} ${x + r},${y} L${x + width - r},${y} Q${x + width},${y} ${x + width},${y + r} L${x + width},${y + h} Z`
    : `M${x},${y} L${x},${y + h - r} Q${x},${y + h} ${x + r},${y + h} L${x + width - r},${y + h} Q${x + width},${y + h} ${x + width},${y + h - r} L${x + width},${y} Z`;
  return <path d={d} fill={positif ? (warnaPositif ?? COLOR.good) : (warnaNegatif ?? COLOR.bad)} />;
}

/** Batang satu warna, untuk data hitungan yang tidak bertanda. */
export function PlainBar(props: any) {
  const { x, y, width, height, warna } = props;
  const h = Math.max(Math.abs(height), 1);
  const r = Math.min(4, width / 2, h);
  const d = `M${x},${y + h} L${x},${y + r} Q${x},${y} ${x + r},${y} L${x + width - r},${y} Q${x + width},${y} ${x + width},${y + r} L${x + width},${y + h} Z`;
  return <path d={d} fill={warna ?? COLOR.series} />;
}

/** Label langsung di ujung batang: di atas untuk positif, di bawah untuk negatif. */
export function SignedBarLabel(props: any) {
  const { x, y, width, height, value, satuan = "R", desimal = 1 } = props;
  const angka = Number(value);
  if (!angka) return null;
  const positif = angka >= 0;
  return (
    <text
      x={x + width / 2}
      y={positif ? y - 7 : y + Math.abs(height) + 14}
      textAnchor="middle"
      fontSize={10}
      fontWeight={600}
      fill={COLOR.label}
    >
      {fmtSigned(angka, desimal)}
      {satuan}
    </text>
  );
}

/** Label cacah di atas batang, tanpa tanda. */
export function CountLabel(props: any) {
  const { x, y, width, value } = props;
  const angka = Number(value);
  if (!angka) return null;
  return (
    <text x={x + width / 2} y={y - 7} textAnchor="middle" fontSize={10} fontWeight={600} fill={COLOR.label}>
      {angka}
    </text>
  );
}

/** Tick sumbu X dua baris: nama di atas, jumlah trade di bawahnya. */
export function HariTick(props: any) {
  const { x, y, payload, jumlah } = props;
  return (
    <g transform={`translate(${x},${y})`}>
      <text y={14} textAnchor="middle" fontSize={11} fontWeight={500} fill={COLOR.label}>
        {payload.value}
      </text>
      <text y={28} textAnchor="middle" fontSize={10} fill={COLOR.axis}>
        {(jumlah?.[payload.index] ?? 0) + "T"}
      </text>
    </g>
  );
}

/* eslint-enable @typescript-eslint/no-explicit-any */

/** Kotak tooltip: nilai memimpin, keterangan menyusul. */
export function TooltipKotak({
  nilai,
  label,
  rincian,
}: {
  nilai: string;
  label: string;
  rincian?: ReactNode;
}) {
  return (
    <div className="min-w-[160px] rounded-xl border border-slate-200 bg-white px-3.5 py-3 shadow-xl">
      <p className="text-lg font-semibold leading-none tabular-nums text-slate-900">{nilai}</p>
      <p className="mt-1 text-[11px] text-slate-500">{label}</p>
      {rincian && (
        <div className="mt-2.5 border-t border-slate-100 pt-2.5 text-[11px] text-slate-500">{rincian}</div>
      )}
    </div>
  );
}

export const SUMBU_Y = {
  tick: { fontSize: 11, fill: COLOR.axis },
  tickLine: false,
  axisLine: false,
  width: 48,
} as const;

export const SUMBU_X = {
  tick: { fontSize: 11, fill: COLOR.axis },
  tickLine: false,
  axisLine: { stroke: COLOR.grid },
  minTickGap: 24,
  tickMargin: 10,
} as const;
