"use client";
import { useState } from "react";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area, Cell } from "recharts";

export function DashboardView({ riwayat, loading }: { riwayat: any[], loading?: boolean }) {
  const [chartType, setChartType] = useState("Pips"); // Pips, Equity, P/L, Drawdown
  const [timeFilter, setTimeFilter] = useState("ALL"); // 7D, 30D, 3M, 6M, 1Y, ALL

  // --- FILTER WAKTU ---
  const getFilterDate = (filter: string) => {
    if (filter === "ALL") return null;
    const date = new Date();
    if (filter === "7D") date.setDate(date.getDate() - 7);
    if (filter === "30D") date.setDate(date.getDate() - 30);
    if (filter === "3M") date.setMonth(date.getMonth() - 3);
    if (filter === "6M") date.setMonth(date.getMonth() - 6);
    if (filter === "1Y") date.setFullYear(date.getFullYear() - 1);
    return date;
  };

  const batasTanggal = getFilterDate(timeFilter);

  // Data riwayat yang sudah disaring berdasarkan waktu
  const riwayatTersaring = riwayat.filter(data => {
    if (!batasTanggal) return true;
    return new Date(data.tanggal) >= batasTanggal;
  });

  // --- MENGHITUNG STATISTIK (DARI DATA TERSARING) ---
  const totalTrade = riwayatTersaring.length;
  const jumlahProfit = riwayatTersaring.filter((data) => data.status === "PROFIT").length;
  const jumlahLoss = riwayatTersaring.filter((data) => data.status === "LOSS").length;
  const winRate = totalTrade > 0 ? ((jumlahProfit / totalTrade) * 100).toFixed(1) : 0;

  let grossProfit = 0;
  let grossLoss = 0;
  let netPips = 0;
  let totalRR = 0;

  let peakPips = 0;
  let maxDrawdownPips = 0;
  let saldoPips = 0;
  let saldoRR = 0;

  // --- MENGOLAH DATA GRAFIK SEKALI JALAN ---
  const dataGrafik = riwayatTersaring.map((data, index) => {
    const pips = Number(data.hasil_pips);
    const risk = Number(data.risk) || 1; // Cegah bagi nol
    let currentRR = 0;
    let plTrade = 0;

    if (data.status === "PROFIT") {
      grossProfit += pips;
      netPips += pips;
      currentRR = (pips / risk);
      totalRR += currentRR;
      saldoPips += pips;
      saldoRR += currentRR;
      plTrade = pips;
    } else if (data.status === "LOSS") {
      grossLoss += pips;
      netPips -= pips;
      currentRR = -(pips / risk);
      totalRR += currentRR;
      saldoPips -= pips;
      saldoRR += currentRR;
      plTrade = -pips;
    }

    // Hitung Drawdown (Dari puncak Pips tertinggi)
    if (saldoPips > peakPips) peakPips = saldoPips;
    const currentDrawdown = peakPips - saldoPips;
    if (currentDrawdown > maxDrawdownPips) maxDrawdownPips = currentDrawdown;

    return {
      nama: "T" + (index + 1),
      tanggal: data.tanggal,
      pips: saldoPips, // Kumulatif Pips
      equity: Number(saldoRR.toFixed(2)), // Kumulatif RR (Proxy untuk Equity)
      pl: plTrade, // P/L per Trade individu
      drawdown: -currentDrawdown // Selalu negatif
    };
  });

  const profitFactor = grossLoss === 0 ? (grossProfit > 0 ? "MAX" : "0.00") : (grossProfit / grossLoss).toFixed(2);
  const avgRR = totalTrade > 0 ? (totalRR / totalTrade).toFixed(2) : "0.00";

  // menghitung statistik per pair //
  const pairStats: Record<string, { tradeCount: number, winCount: number, netPips: number }> = {};

  riwayatTersaring.forEach(data => {
    const p = data.pair || "Lainnya";
    const pips = Number(data.hasil_pips) || 0;

    if (!pairStats[p]) {
      pairStats[p] = { tradeCount: 0, winCount: 0, netPips: 0 };
    }

    pairStats[p].tradeCount += 1;

    if (data.status === "PROFIT") {
      pairStats[p].winCount += 1;
      pairStats[p].netPips += pips;
    } else if (data.status === "LOSS") {
      pairStats[p].netPips -= pips;
    }
  });

  // ubah data object jadi Array, lalu urutkan dari profit terbesar ke terkecil
  const pairBreakdown = Object.keys(pairStats).map(pair => {
    const stats = pairStats[pair];
    return {
      pair,
      tradeCount: stats.tradeCount,
      winRate: ((stats.winCount / stats.tradeCount) * 100).toFixed(1),
      netPips: stats.netPips
    };
  }).sort((a, b) => b.netPips - a.netPips);


  return (
    <div className={`w-full transition-opacity duration-200 ${loading ? "opacity-60" : "opacity-100"}`}>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
        <h2 className="text-2xl font-bold text-slate-800">Dashboard</h2>

        {/* FILTER PERIODE WAKTU (Mempengaruhi KPI dan Grafik) */}
        <div className="flex bg-white border rounded-md p-1 shadow-sm overflow-x-auto">
          {["7D", "30D", "3M", "6M", "1Y", "ALL"].map((filter) => (
            <button
              key={filter}
              onClick={() => setTimeFilter(filter)}
              className={`px-3 py-1 text-xs font-semibold rounded-sm transition-colors ${timeFilter === filter ? "bg-slate-800 text-white" : "text-slate-500 hover:text-slate-800"
                }`}
            >
              {filter}
            </button>
          ))}
        </div>
      </div>

      {/* 8 KARTU STATISTIK KPI */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="border rounded-lg p-5 bg-white shadow-sm border-l-4 border-l-slate-800">
          <h3 className="text-slate-500 font-medium text-xs uppercase tracking-wider">Total Trade</h3>
          <p className="text-2xl font-bold mt-1 text-slate-800">{totalTrade}</p>
        </div>
        <div className="border rounded-lg p-5 bg-white shadow-sm border-l-4 border-l-blue-500">
          <h3 className="text-slate-500 font-medium text-xs uppercase tracking-wider">Win Rate</h3>
          <p className="text-2xl font-bold mt-1 text-slate-800">{winRate}%</p>
        </div>
        <div className="border rounded-lg p-5 bg-white shadow-sm border-l-4 border-l-green-500">
          <h3 className="text-slate-500 font-medium text-xs uppercase tracking-wider">Net Pips</h3>
          <p className={`text-2xl font-bold mt-1 ${netPips >= 0 ? "text-green-600" : "text-red-600"}`}>
            {netPips >= 0 ? "+" + netPips : netPips}
          </p>
        </div>
        <div className="border rounded-lg p-5 bg-white shadow-sm border-l-4 border-l-amber-500">
          <h3 className="text-slate-500 font-medium text-xs uppercase tracking-wider">Profit Factor</h3>
          <p className="text-2xl font-bold mt-1 text-slate-800">{profitFactor}</p>
        </div>
        <div className="border rounded-lg p-5 bg-white shadow-sm border-l-4 border-l-purple-500">
          <h3 className="text-slate-500 font-medium text-xs uppercase tracking-wider">Average RR</h3>
          <p className="text-2xl font-bold mt-1 text-slate-800">{Number(avgRR) > 0 ? `+${avgRR}` : avgRR}R</p>
        </div>
        <div className="border rounded-lg p-5 bg-white shadow-sm border-l-4 border-l-red-500">
          <h3 className="text-slate-500 font-medium text-xs uppercase tracking-wider">Max Drawdown</h3>
          <p className="text-2xl font-bold mt-1 text-red-600">-{maxDrawdownPips} pips</p>
        </div>
        <div className="border rounded-lg p-5 bg-white shadow-sm border-l-4 border-l-emerald-400">
          <h3 className="text-slate-500 font-medium text-xs uppercase tracking-wider">Winning Trades</h3>
          <p className="text-2xl font-bold mt-1 text-slate-800">{jumlahProfit}</p>
        </div>
        <div className="border rounded-lg p-5 bg-white shadow-sm border-l-4 border-l-rose-400">
          <h3 className="text-slate-500 font-medium text-xs uppercase tracking-wider">Losing Trades</h3>
          <p className="text-2xl font-bold mt-1 text-slate-800">{jumlahLoss}</p>
        </div>
      </div>

      {/* GRAFIK PERFORMA LANJUTAN */}
      <div className="border rounded-lg p-6 bg-white shadow-sm mb-8 h-[450px] flex flex-col">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
          <div>
            <h3 className="text-slate-800 font-bold text-lg">Performance Chart</h3>
            <p className="text-xs text-slate-500">Perkembangan hasil trading berdasarkan tipe grafik</p>
          </div>

          {/* TABS TIPE GRAFIK */}
          <div className="flex bg-slate-100 p-1 rounded-md">
            {["Equity", "Pips", "P/L", "Drawdown"].map((type) => (
              <button
                key={type}
                onClick={() => setChartType(type)}
                className={`px-4 py-1.5 text-sm font-medium rounded-sm transition-all ${chartType === type ? "bg-white text-blue-600 shadow-sm" : "text-slate-500 hover:text-slate-800"
                  }`}
              >
                {type}
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 min-h-0">
          <ResponsiveContainer width="100%" height="100%">
            {chartType === "P/L" ? (
              // Bar Chart khusus untuk P/L individu
              <BarChart data={dataGrafik}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.5} />
                <XAxis dataKey="nama" tick={{ fontSize: 12 }} tickMargin={10} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip cursor={{ fill: 'transparent' }} />
                <Bar
                  dataKey="pl"
                  radius={[4, 4, 0, 0]}
                >
                  {
                    dataGrafik.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.pl >= 0 ? "#10b981" : "#ef4444"} />
                    ))
                  }
                </Bar>
              </BarChart>
            ) : chartType === "Drawdown" ? (
              // Area Chart khusus untuk Drawdown (merah)
              <AreaChart data={dataGrafik}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.5} />
                <XAxis dataKey="nama" tick={{ fontSize: 12 }} tickMargin={10} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Area type="step" dataKey="drawdown" stroke="#ef4444" fill="#fecaca" strokeWidth={2} />
              </AreaChart>
            ) : (
              // Line Chart untuk Pips dan Equity (RR)
              <LineChart data={dataGrafik}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.5} />
                <XAxis dataKey="nama" tick={{ fontSize: 12 }} tickMargin={10} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Line
                  type="monotone"
                  dataKey={chartType.toLowerCase()}
                  stroke={chartType === "Equity" ? "#8b5cf6" : "#2563eb"}
                  strokeWidth={3}
                  dot={{ r: 4, strokeWidth: 2 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            )}
          </ResponsiveContainer>
        </div>
      </div>
      {/* PERFORMANCE BREAKDOWN BY PAIR */}
      <div className="border rounded-lg p-6 bg-white shadow-sm mb-8">
        <h3 className="text-slate-800 font-bold text-lg mb-1">Analisa Pair Trading</h3>
        <p className="text-xs text-slate-500 mb-6">Melihat performa win rate dan profit/loss berdasarkan setiap pair</p>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b">
                <th className="p-3 font-semibold text-slate-600">Pair</th>
                <th className="p-3 font-semibold text-slate-600 text-center">Total Trade</th>
                <th className="p-3 font-semibold text-slate-600 text-center">Win Rate</th>
                <th className="p-3 font-semibold text-slate-600 text-right">Net Pips</th>
              </tr>
            </thead>
            <tbody>
              {pairBreakdown.map((item, idx) => (
                <tr key={idx} className="border-b hover:bg-slate-50 transition-colors">
                  <td className="p-3 font-bold text-slate-800">{item.pair}</td>
                  <td className="p-3 text-center text-slate-600">{item.tradeCount}</td>
                  <td className="p-3 text-center text-slate-600">{item.winRate}%</td>
                  <td className={`p-3 text-right font-bold ${item.netPips >= 0 ? "text-green-600" : "text-red-600"}`}>
                    {item.netPips > 0 ? "+" + item.netPips : item.netPips}
                  </td>
                </tr>
              ))}
              {pairBreakdown.length === 0 && (
                <tr>
                  <td colSpan={4} className="p-6 text-center text-slate-500">Belum ada data trading pada periode ini.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
