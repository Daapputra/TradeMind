"use client";
import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { supabase } from "@/lib/supabase";
export default function Home() {
  const [tanggal, setTanggal] = useState("");
  const [market, setMarket] = useState("");
  const [pair, setPair] = useState("");
  const [setup, setSetup] = useState("");
  const [emosi, setEmosi] = useState("");
  const [status, setStatus] = useState("");
  const [risk, setRisk] = useState("");
  const [target, setTarget] = useState("");
  const [hasilPips, setHasilPips] = useState("");
  const [catatan, setCatatan] = useState("");
  const [riwayat, setRiwayat] = useState<any[]>([]);
  const [idEdit, setIdEdit] = useState<any>(null);
  const [bukaEdit, setBukaEdit] = useState(false);
  const [bukaCatatan, setBukaCatatan] = useState(false);
  const [catatanPilihan, setCatatanPilihan] = useState("");

  async function simpanData() {
    let errorCek;

    // Mencegah error jika form belum diisi
    if (!tanggal || !market || !pair || !status || !risk || !target) {
      alert("Peringatan: Tanggal, Market, Pair, Risk, dan Target wajib diisi!");
      return; // Berhenti di sini, jangan kirim data ke Supabase
    }

    if (idEdit) {
      // mengubah data lama yang sudah ada di supabase
      const { error } = await supabase
        .from("jurnal")
        .update({
          tanggal: tanggal,
          market: market,
          pair: pair,
          setup: setup,
          emosi: emosi,
          status: status,
          hasil_pips: status === "BE" ? 0 : Number(hasilPips),
          risk: Number(risk),
          target: Number(target),
          catatan: catatan,
        })
        .eq("id", idEdit); // update yg id nya cocok dengan idEdit

      errorCek = error;
    } else {
      // memasukan data baru
      const { error } = await supabase
        .from("jurnal")
        .insert([{
          tanggal: tanggal,
          market: market,
          pair: pair,
          setup: setup,
          emosi: emosi,
          status: status,
          hasil_pips: status === "BE" ? 0 : Number(hasilPips),
          risk: Number(risk),
          target: Number(target),
          catatan: catatan,
        }]);

      errorCek = error;
    }

    // cek sukses atau gagal
    if (errorCek) {
      alert("Gagal Menyimpan Data:" + errorCek.message);
      console.log(errorCek);
    } else {
      alert("Jurnal Berhasil Disimpan!");
      ambilData(); // Refresh Tabel

      // bersihkan form dan matikan mode edit (kembali ke null)
      batalEdit();
    }
  }

  async function ambilData() {
    // meminta semua data dari tabel jurnal
    const { data } = await supabase.from("jurnal").select("*").order("id", { ascending: true });

    // jika datanya didapat, masuk ke memori 'riwayat'
    if (data) {
      setRiwayat(data);
    }
  }

  async function hapusData(idYangMauDiHapus: any) {
    // menghapus data yg ID nya cocok
    await supabase.from("jurnal").delete().eq("id", idYangMauDiHapus);

    // memanggil data terbaru agar tabel langsung diperabarui
    ambilData();
  }

  // otomatis agar ambilData() langsung jalan saat web dibuka
  useEffect(() => {
    ambilData();
  }, []);


  function batalEdit() {
    setIdEdit(null);
    setTanggal("");
    setMarket("");
    setPair("");
    setSetup("");
    setEmosi("");
    setStatus("");
    setHasilPips("");
    setRisk("");
    setTarget("");
    setCatatan("");
    setBukaEdit(false); // untuk menutup pop up edit
  }

  // --- MENGHITUNG STATISTIK ---
  const totalTrade = riwayat.length;

  // Mencari jumlah trade yang profit
  const jumlahProfit = riwayat.filter((data) => data.status === "PROFIT").length;

  // Menghitung Win Rate (Mencegah error jika data masih kosong)
  const winRate = totalTrade > 0 ? ((jumlahProfit / totalTrade) * 100).toFixed(1) : 0;

  // Menghitung Net Pips (Kumpulan profit dikurangi loss)
  let netPips = 0;
  riwayat.forEach((data) => {
    if (data.status === "PROFIT") {
      netPips += Number(data.hasil_pips);
    } else if (data.status === "LOSS") {
      netPips -= Number(data.hasil_pips);
    }
  });

  // MENGOLAH DATA GRAFIK (EQUITY CURVE)
  let saldoBerjalan = 0;
  const dataGrafik = riwayat.map((data, index) => {
    if (data.status === "PROFIT") {
      saldoBerjalan += Number(data.hasil_pips);
    } else if (data.status === "LOSS") {
      saldoBerjalan -= Number(data.hasil_pips);
    }

    return {
      nama: "Trade " + (index + 1),
      tanggal: data.tanggal,
      saldo: saldoBerjalan
    };
  });

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-8">Jurnal Trading</h1>
      {/* KARTU STATISTIK */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">

        <div className="border rounded-lg p-6 bg-white shadow-sm">
          <h3 className="text-slate-500 font-medium text-sm">Total Trade</h3>
          <p className="text-3xl font-bold mt-2 text-slate-800">{totalTrade}</p>
        </div>

        <div className="border rounded-lg p-6 bg-white shadow-sm">
          <h3 className="text-slate-500 font-medium text-sm">Win Rate</h3>
          <p className="text-3xl font-bold mt-2 text-blue-600">{winRate}%</p>
        </div>

        <div className="border rounded-lg p-6 bg-white shadow-sm">
          <h3 className="text-slate-500 font-medium text-sm">Net Pips</h3>
          <p className={`text-3xl font-bold mt-2 ${netPips >= 0 ? "text-green-600" : "text-red-600"}`}>
            {netPips >= 0 ? "+" + netPips : netPips} pips
          </p>
        </div>

      </div>

      {/* GRAFIK EQUITY CURVE */}
      <div className="border rounded-lg p-6 bg-white shadow-sm mb-8 h-[350px]">
        <h3 className="text-slate-800 font-bold mb-4">Grafik Pertumbuhan Pips (Equity Curve)</h3>

        <ResponsiveContainer width="100%" height="90%">
          <LineChart data={dataGrafik}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="nama" tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 12 }} />
            <Tooltip />
            <Line
              type="monotone"
              dataKey="saldo"
              stroke="#2563eb"
              strokeWidth={3}
              dot={{ r: 4, fill: "#2563eb" }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* pembelah layar */}
      <div className="flex gap-12">
        {/* kolom kiri */}
        <div className="flec flex-col gap-4 w-[400px]">
          <Input type="date" placeholder="Tanggal"
            value={tanggal}
            onChange={(e) => setTanggal(e.target.value)} />

          <Select value={market} onValueChange={(value) => setMarket(value)}>
            <SelectTrigger>
              <SelectValue placeholder="Pilih Market..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Forex">Forex</SelectItem>
              <SelectItem value="Metals">Metals (Gold/Silver)</SelectItem>
              <SelectItem value="Crypto">Crypto</SelectItem>
              <SelectItem value="Index">Index / Saham</SelectItem>
              <SelectItem value="Lainnya">Lainnya</SelectItem>
            </SelectContent>
          </Select>

          <Input placeholder="Pair Trading (misal: XAUUSD)"
            value={pair}
            onChange={(e) => setPair(e.target.value.toUpperCase())} />

          <Select value={setup} onValueChange={(value) => setSetup(value)}>
            <SelectTrigger>
              <SelectValue placeholder="Pilih Setup..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Support and Resistance">Support and Resistance</SelectItem>
              <SelectItem value="Supply and Demand">Supply and Demand</SelectItem>
              <SelectItem value="Far Value Gap">Far value Gap</SelectItem>
              <SelectItem value="Retest">Retest</SelectItem>
              <SelectItem value="Order Block">Order Block</SelectItem>
              <SelectItem value="Key Levels">Key levels</SelectItem>
              <SelectItem value="Liquidity">Liquidity</SelectItem>
              <SelectItem value="Other">Other</SelectItem>
            </SelectContent>
          </Select>

          <Select value={emosi} onValueChange={(value) => setEmosi(value)}>
            <SelectTrigger>
              <SelectValue placeholder="Pilih emosi saat entry..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Tenang">Tenang</SelectItem>
              <SelectItem value="FOMO">Fears Of Missing Out</SelectItem>
              <SelectItem value="Ragu-ragu">Ragu-ragu</SelectItem>
              <SelectItem value="Revenge">Revenge</SelectItem>
              <SelectItem value="Overconfidence">Overconfindence</SelectItem>
              <SelectItem value="Serakah">Serakah</SelectItem>
            </SelectContent>
          </Select>

          <Select value={status} onValueChange={(value) => setStatus(value)}>
            <SelectTrigger>
              <SelectValue placeholder="Pilih Status Trade..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="PROFIT">PROFIT</SelectItem>
              <SelectItem value="LOSS">LOSS</SelectItem>
              <SelectItem value="BE">BE (Break Even)</SelectItem>
            </SelectContent>
          </Select>

          <Input
            type="number"
            placeholder="Risiko dalam pips (contoh: 20)"
            value={risk}
            onChange={(e) => setRisk(e.target.value)} />

          <Input
            type="number"
            placeholder="Profit dalam pips (contoh: 40)"
            value={target}
            onChange={(e) => setTarget(e.target.value)} />

          {risk && target && (
            <p className="text-sm font-medium text-blue-600 px-2">
              → RR Plan: 1:{Number((Number(target) / Number(risk)).toFixed(1))}
            </p>
          )}

          <Input
            type="number"
            placeholder="Hasil aktual (pips)"
            value={status === "BE" ? 0 : hasilPips}
            disabled={status === "BE"}
            onChange={(e) => setHasilPips(e.target.value)} />

          <Textarea placeholder="Catatan trading (misal: Sesuai plan, tapi agak ragu pas mau entry"
            value={catatan}
            onChange={(e) => {
              const teks = e.target.value;
              setCatatan(teks.charAt(0).toUpperCase() + teks.slice(1));
            }}
          />
          <Button onClick={simpanData}>Simpan Jurnal</Button>
        </div>

        {/* kolom kanan */}
        <div className="flex-1 border rounded-lg p-6 bg-slate-50">
          <h2 className="font-semibold mb-4">Riwayat Trading</h2>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tanggal</TableHead>
                <TableHead>Pair</TableHead>
                <TableHead>Setup</TableHead>
                <TableHead>Emosi</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Hasil</TableHead>
                <TableHead>Risk</TableHead>
                <TableHead>RR Plan</TableHead>
                <TableHead>Actual RR</TableHead>
                <TableHead>Catatan</TableHead>
                <TableHead>Kelola</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {riwayat.map((data, index) => (
                <TableRow key={index}>
                  <TableCell>{data.tanggal}</TableCell>
                  <TableCell>{data.pair}</TableCell>
                  <TableCell>{data.setup}</TableCell>
                  <TableCell>{data.emosi}</TableCell>
                  <TableCell className={
                    data.status === "PROFIT" ? "text-green-600 font-bold" :
                      data.status === "LOSS" ? "text-red-600 font-bold" :
                        "text-gray-500 font-bold"
                  }>
                    {data.status}
                  </TableCell>

                  <TableCell className="font-bold">
                    {data.status === "PROFIT" ? "+" + data.hasil_pips + " pips" :
                      data.status === "LOSS" ? "-" + data.hasil_pips + " pips" :
                        "0 pips"
                    }
                  </TableCell>

                  <TableCell>{data.risk} pips</TableCell>

                  <TableCell className="font-semibold text-blue-600">
                    1:{Number((Number(data.target) / Number(data.risk)).toFixed(1))}
                  </TableCell>

                  <TableCell className="font-semibold text-purple-600">
                    {data.status === "BE" ? "0R" :
                      data.status === "PROFIT" ? "+" + Number((Number(data.hasil_pips) / Number(data.risk)).toFixed(1)) + "R" :
                        "-" + Number((Number(data.hasil_pips) / Number(data.risk)).toFixed(1)) + "R"}
                  </TableCell>

                  <TableCell className="max-w-[150px]">
                    <div className="flex items-center gap-2">
                      <span className="truncate">{data.catatan}</span>
                      {data.catatan && data.catatan.length > 15 && (
                        <button
                          className="text-xs text-blue-600 font-bold hover:underline shrink-0"
                          onClick={() => {
                            setCatatanPilihan(data.catatan);
                            setBukaCatatan(true); // untuk memunculkan pop up catatan
                          }}
                        >
                          [Lihat]
                        </button>
                      )}
                    </div>
                  </TableCell>

                  <TableCell>
                    {/* tombol edit */}
                    <Button
                      variant="outline"
                      onClick={() => {
                        setIdEdit(data.id);
                        setTanggal(data.tanggal);
                        setMarket(data.market);
                        setPair(data.pair);
                        setSetup(data.setup);
                        setEmosi(data.emosi);
                        setStatus(data.status);
                        setRisk(data.risk);
                        setTarget(data.target);
                        setHasilPips(data.hasil_pips);
                        setCatatan(data.catatan);
                        setBukaEdit(true); // pop up edit
                      }}
                    >
                      Edit
                    </Button>
                    {/* tombol hapus */}
                    <Button
                      variant="destructive"
                      onClick={() => hapusData(data.id)}
                    >
                      Hapus
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

      </div>
      {/* Pop Up Baca Catatan */}
      <Dialog open={bukaCatatan} onOpenChange={setBukaCatatan}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Catatan Trading</DialogTitle>
            <DialogDescription className="mt-4 text-slate-800 text-base leading-relaxed whitespace-pre-wrap">
              {catatanPilihan}
            </DialogDescription>
          </DialogHeader>
        </DialogContent>
      </Dialog>

      {/* Pop Up Edit Jurnal */}
      <Dialog open={bukaEdit} onOpenChange={batalEdit}>
        <DialogContent className="sm:max-w-[425px]" onOpenAutoFocus={(e) => e.preventDefault()}>
          <DialogHeader>
            <DialogTitle>Edit Jurnal Trading</DialogTitle>
          </DialogHeader>

          {/* Area Form Edit (Bisa di scroll jika kepanjangan) */}
          <div className="flex flex-col gap-4 mt-4 max-h-[65vh] overflow-y-auto px-1">
            <Input type="date" placeholder="Tanggal"
              value={tanggal}
              onChange={(e) => setTanggal(e.target.value)} />

            <Select value={market} onValueChange={(value) => setMarket(value)}>
              <SelectTrigger>
                <SelectValue placeholder="Pilih Market..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Forex">Forex</SelectItem>
                <SelectItem value="Metals">Metals (Gold/Silver)</SelectItem>
                <SelectItem value="Crypto">Crypto</SelectItem>
                <SelectItem value="Index">Index / Saham</SelectItem>
                <SelectItem value="Lainnya">Lainnya</SelectItem>
              </SelectContent>
            </Select>

            <Input placeholder="Pair Trading (misal: XAUUSD)"
              value={pair}
              onChange={(e) => setPair(e.target.value.toUpperCase())} />

            <Select value={setup} onValueChange={(value) => setSetup(value)}>
              <SelectTrigger>
                <SelectValue placeholder="Pilih Setup..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Support and Resistance">Support and Resistance</SelectItem>
                <SelectItem value="Supply and Demand">Supply and Demand</SelectItem>
                <SelectItem value="Far Value Gap">Far value Gap</SelectItem>
                <SelectItem value="Retest">Retest</SelectItem>
                <SelectItem value="Order Block">Order Block</SelectItem>
                <SelectItem value="Key Levels">Key levels</SelectItem>
                <SelectItem value="Liquidity">Liquidity</SelectItem>
                <SelectItem value="Other">Other</SelectItem>
              </SelectContent>
            </Select>

            <Select value={emosi} onValueChange={(value) => setEmosi(value)}>
              <SelectTrigger>
                <SelectValue placeholder="Pilih emosi saat entry..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Tenang">Tenang</SelectItem>
                <SelectItem value="FOMO">Fears Of Missing Out</SelectItem>
                <SelectItem value="Ragu-ragu">Ragu-ragu</SelectItem>
                <SelectItem value="Revenge">Revenge</SelectItem>
                <SelectItem value="Overconfidence">Overconfindence</SelectItem>
                <SelectItem value="Serakah">Serakah</SelectItem>
              </SelectContent>
            </Select>

            <Select value={status} onValueChange={(value) => setStatus(value)}>
              <SelectTrigger>
                <SelectValue placeholder="Pilih Status Trade..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="PROFIT">PROFIT</SelectItem>
                <SelectItem value="LOSS">LOSS</SelectItem>
                <SelectItem value="BE">BE (Break Even)</SelectItem>
              </SelectContent>
            </Select>

            <Input
              type="number"
              placeholder="Risiko dalam pips (contoh: 20)"
              value={risk}
              onChange={(e) => setRisk(e.target.value)} />

            <Input
              type="number"
              placeholder="Profit dalam pips (contoh: 40)"
              value={target}
              onChange={(e) => setTarget(e.target.value)} />

            {risk && target && (
              <p className="text-sm font-medium text-blue-600 px-2">
                → RR Plan: 1:{Number((Number(target) / Number(risk)).toFixed(1))}
              </p>
            )}

            <Input
              type="number"
              placeholder="Hasil aktual (pips)"
              value={status === "BE" ? 0 : hasilPips}
              disabled={status === "BE"}
              onChange={(e) => setHasilPips(e.target.value)} />

            <Textarea placeholder="Catatan trading (misal: Sesuai plan, tapi agak ragu pas mau entry"
              value={catatan}
              onChange={(e) => {
                const teks = e.target.value;
                setCatatan(teks.charAt(0).toUpperCase() + teks.slice(1));
              }}
            />
            <div className="flex gap-2 justify-end mt-4">
              <Button variant="outline" onClick={batalEdit}>Batal</Button>
              <Button onClick={simpanData}>Simpan Perubahan</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

    </div>
  );
}