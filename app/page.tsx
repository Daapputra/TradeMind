"use client";

import { useCallback, useEffect, useState } from "react";
import {
  BarChart3,
  BookOpen,
  BrainCircuit,
  Calendar,
  LayoutDashboard,
  Menu,
  Settings,
  TrendingUp,
  X,
} from "lucide-react";

import { supabase } from "@/lib/supabase";
import { usePengaturan } from "@/lib/settings";
import type { Trade } from "@/lib/analytics";

import { AnalyticsView } from "@/components/views/AnalyticsView";
import { CalendarView } from "@/components/views/CalendarView";
import { DashboardView } from "@/components/views/DashboardView";
import { JournalView } from "@/components/views/JournalView";
import { PsychologyView } from "@/components/views/PsychologyView";
import { SettingsView } from "@/components/views/SettingsView";

const MENU = [
  { name: "Dashboard", icon: LayoutDashboard, keterangan: "Ringkasan performa" },
  { name: "Trading Journal", icon: BookOpen, keterangan: "Catatan setiap trade" },
  { name: "Analytics", icon: BarChart3, keterangan: "Pembedahan edge" },
  { name: "Calendar", icon: Calendar, keterangan: "Hasil harian" },
  { name: "Psychology", icon: BrainCircuit, keterangan: "Disiplin dan emosi" },
  { name: "Settings", icon: Settings, keterangan: "Preferensi dan data" },
] as const;

type NamaMenu = (typeof MENU)[number]["name"];

export default function Home() {
  const pengaturan = usePengaturan();
  const [riwayat, setRiwayat] = useState<Trade[]>([]);
  const [sedangMemuat, setSedangMemuat] = useState(true);
  const [menuAktif, setMenuAktif] = useState<NamaMenu>("Dashboard");
  const [sidebarBuka, setSidebarBuka] = useState(false);

  const ambilData = useCallback(async () => {
    setSedangMemuat(true);
    const { data } = await supabase.from("jurnal").select("*").order("id", { ascending: true });
    if (data) setRiwayat(data as Trade[]);
    setSedangMemuat(false);
  }, []);

  // Pemuatan pertama: state memuat sudah true sejak awal, jadi efek ini
  // tidak perlu menyetel apa pun sebelum permintaan selesai.
  useEffect(() => {
    let batal = false;
    (async () => {
      const { data } = await supabase.from("jurnal").select("*").order("id", { ascending: true });
      if (batal) return;
      if (data) setRiwayat(data as Trade[]);
      setSedangMemuat(false);
    })();
    return () => {
      batal = true;
    };
  }, []);

  const inisial = (pengaturan.namaTrader.trim()[0] ?? "T").toUpperCase();
  const menuTerpilih = MENU.find((m) => m.name === menuAktif);

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50">
      {sidebarBuka && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-[2px] lg:hidden"
          onClick={() => setSidebarBuka(false)}
          aria-hidden
        />
      )}

      {/* Panel navigasi gelap sebagai penopang visual seluruh aplikasi */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-[264px] flex-col bg-slate-900 transition-transform duration-300 lg:static ${
          sidebarBuka ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
      >
        <div className="flex items-center justify-between gap-3 px-5 py-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-white to-slate-300 shadow-lg shadow-black/20">
              <TrendingUp size={20} className="text-slate-900" />
            </div>
            <div>
              <h1 className="text-[17px] font-semibold leading-none tracking-tight text-white">TradeMind</h1>
              <p className="mt-1 text-[10px] font-medium uppercase tracking-[0.14em] text-slate-500">
                Trading Journal
              </p>
            </div>
          </div>
          <button
            className="text-slate-400 transition-colors hover:text-white lg:hidden"
            onClick={() => setSidebarBuka(false)}
            aria-label="Tutup menu"
          >
            <X size={22} />
          </button>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-2">
          {MENU.map((item) => {
            const Ikon = item.icon;
            const aktif = menuAktif === item.name;
            return (
              <button
                key={item.name}
                onClick={() => {
                  setMenuAktif(item.name);
                  setSidebarBuka(false);
                }}
                aria-current={aktif ? "page" : undefined}
                className={`group relative flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-all ${
                  aktif ? "bg-white/10 text-white" : "text-slate-400 hover:bg-white/5 hover:text-slate-100"
                }`}
              >
                {aktif && (
                  <span className="absolute left-0 top-1/2 h-6 w-[3px] -translate-y-1/2 rounded-r-full bg-white" />
                )}
                <Ikon size={18} className="shrink-0" />
                <span className="min-w-0">
                  <span className="block truncate text-[13px] font-medium">{item.name}</span>
                  <span
                    className={`block truncate text-[10px] ${aktif ? "text-slate-400" : "text-slate-600 group-hover:text-slate-500"}`}
                  >
                    {item.keterangan}
                  </span>
                </span>
              </button>
            );
          })}
        </nav>

        <div className="border-t border-white/10 p-3">
          <button
            onClick={() => {
              setMenuAktif("Settings");
              setSidebarBuka(false);
            }}
            className="flex w-full items-center gap-3 rounded-xl px-2 py-2 text-left transition-colors hover:bg-white/5"
          >
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-slate-600 to-slate-800 text-[13px] font-semibold text-white ring-1 ring-white/15">
              {inisial}
            </span>
            <span className="min-w-0">
              <span className="block truncate text-[13px] font-medium text-white">{pengaturan.namaTrader}</span>
              <span className="block text-[10px] text-slate-500">
                {riwayat.length} trade tercatat · v3.0
              </span>
            </span>
          </button>
        </div>
      </aside>

      <main className="flex h-screen flex-1 flex-col overflow-hidden">
        <header className="flex shrink-0 items-center justify-between border-b border-slate-200 bg-white px-4 py-3 lg:hidden">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarBuka(true)}
              className="text-slate-600"
              aria-label="Buka menu"
            >
              <Menu size={22} />
            </button>
            <div>
              <h1 className="text-[15px] font-semibold tracking-tight text-slate-900">{menuAktif}</h1>
              <p className="text-[10px] text-slate-400">{menuTerpilih?.keterangan}</p>
            </div>
          </div>
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-900 text-[12px] font-semibold text-white">
            {inisial}
          </span>
        </header>

        <div className="flex-1 overflow-y-auto p-4 md:p-8">
          {menuAktif === "Dashboard" && <DashboardView riwayat={riwayat} loading={sedangMemuat} />}
          {menuAktif === "Trading Journal" && (
            <JournalView riwayat={riwayat} refreshData={ambilData} loading={sedangMemuat} />
          )}
          {menuAktif === "Analytics" && <AnalyticsView riwayat={riwayat} loading={sedangMemuat} />}
          {menuAktif === "Calendar" && <CalendarView riwayat={riwayat} loading={sedangMemuat} />}
          {menuAktif === "Psychology" && <PsychologyView riwayat={riwayat} loading={sedangMemuat} />}
          {menuAktif === "Settings" && <SettingsView riwayat={riwayat} refreshData={ambilData} />}
        </div>
      </main>
    </div>
  );
}
