"use client";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { LayoutDashboard, BookOpen, BarChart3, Calendar, BrainCircuit, Settings, Menu, X, TrendingUp } from "lucide-react";

import { DashboardView } from "@/components/views/DashboardView";
import { JournalView } from "@/components/views/JournalView";

export default function Home() {
  const [riwayat, setRiwayat] = useState<any[]>([]);
  const [sedangMemuat, setSedangMemuat] = useState(true);
  const [activeMenu, setActiveMenu] = useState("Dashboard");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false); // for mobile toggle

  async function ambilData() {
    setSedangMemuat(true);
    const { data } = await supabase.from("jurnal").select("*").order("id", { ascending: true });
    if (data) {
      setRiwayat(data);
    }
    setSedangMemuat(false);
  }

  useEffect(() => {
    ambilData();
  }, []);

  const menuItems = [
    { name: "Dashboard", icon: <LayoutDashboard size={20} /> },
    { name: "Trading Journal", icon: <BookOpen size={20} /> },
    { name: "Analytics", icon: <BarChart3 size={20} /> },
    { name: "Calendar", icon: <Calendar size={20} /> },
    { name: "Psychology", icon: <BrainCircuit size={20} /> },
    { name: "Settings", icon: <Settings size={20} /> },
  ];

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed lg:static inset-y-0 left-0 z-50
        w-64 bg-white border-r flex flex-col transition-transform duration-300
        ${isSidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
      `}>
        <div className="p-6 border-b flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center shadow-sm">
              <TrendingUp size={21} className="text-white" />
            </div>

            <div>
              <h1 className="text-xl font-bold text-slate-800 tracking-tight">
                TradeMind
              </h1>
              <p className="text-[10px] font-medium text-slate-400 uppercase tracking-widest">
                Trading Journal
              </p>
            </div>
          </div>

          <button
            className="lg:hidden text-slate-500"
            onClick={() => setIsSidebarOpen(false)}
          >
            <X size={24} />
          </button>
        </div>
        
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {menuItems.map((item) => (
            <button
              key={item.name}
              onClick={() => {
                setActiveMenu(item.name);
                setIsSidebarOpen(false); // close sidebar on mobile after clicking
              }}
              className={`
                w-full flex items-center gap-3 px-4 py-3 rounded-md text-sm font-medium transition-colors
                ${activeMenu === item.name 
                  ? "bg-blue-50 text-blue-700" 
                  : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"}
              `}
            >
              {item.icon}
              {item.name}
            </button>
          ))}
        </nav>
        
        <div className="p-4 border-t text-xs text-center text-slate-400">
          Versi 2.0.0
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* Mobile Header */}
        <header className="lg:hidden bg-white border-b p-4 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <button onClick={() => setIsSidebarOpen(true)} className="text-slate-600">
              <Menu size={24} />
            </button>
            <h1 className="font-bold text-slate-800 tracking-tight">{activeMenu}</h1>
          </div>
        </header>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-4 md:p-8">
          {activeMenu === "Dashboard" && <DashboardView riwayat={riwayat} loading={sedangMemuat} />}
          {activeMenu === "Trading Journal" && <JournalView riwayat={riwayat} refreshData={ambilData} />}
          
          {/* Placeholder for other views */}
          {["Analytics", "Calendar", "Psychology", "Settings"].includes(activeMenu) && (
            <div className="flex flex-col items-center justify-center h-full text-slate-400">
              <div className="mb-4 opacity-50 scale-150">
                {menuItems.find(m => m.name === activeMenu)?.icon}
              </div>
              <h2 className="text-xl font-medium mt-4">Halaman {activeMenu}</h2>
              <p className="mt-2 text-sm">Sedang dalam tahap pengembangan...</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
