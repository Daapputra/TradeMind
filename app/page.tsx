"use client";
import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { supabase } from "@/lib/supabase";
export default function Home() {
  const [tanggal, setTanggal] = useState("");
  const [pair, setPair] = useState("");
  const [setup, setSetup] = useState("");
  const [emosi, setEmosi] = useState("");
  const [hasil, setHasil] = useState("");
  const [catatan, setCatatan] = useState("");
  const [riwayat, setRiwayat] = useState<any[]>([]);

  async function simpanData() {
    // memasukan data ke tabel 'jurnal'
    const { error } = await supabase
      .from("jurnal")
      .insert([
        {
          tanggal: tanggal,
          pair: pair,
          setup: setup,
          emosi: emosi,
          hasil: hasil,
          catatan: catatan
        }
      ]);

    // apakah data nya berhasil dimasukan atau tidak
    if (error) {
      alert("Gagal Menyimpan Data" + error.message);
      console.log(error);
    } else {
      alert("Jurnal Berhasil Disimpan");
    }
  }

  async function ambilData() {
    // meminta semua data dari tabel jurnal
    const { data } = await supabase.from("jurnal").select("*");

    // jika datanya didapat, masuk ke memori 'riwayat'
    if (data) {
      setRiwayat(data);
    }
  }

  // otomatis agar ambilData() langsung jalan saat web dibuka
  useEffect(() => {
    ambilData();
  }, []);

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-8">Jurnal Trading</h1>
      {/* pembelah layar */}
      <div className="flex gap-12">
        {/* kolom kiri */}
        <div className="flec flex-col gap-4 w-[400px]">
          <Input type="date" placeholder="Tanggal"
            value={tanggal}
            onChange={(e) => setTanggal(e.target.value)} />

          <Input placeholder="Pair Trading (misal: XAUUSD)"
            value={pair}
            onChange={(e) => setPair(e.target.value)} />

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

          <Input
            placeholder="Hasil (misal: +100 pips atau -50 pips)"
            value={hasil}
            onChange={(e) => setHasil(e.target.value)} />

          <Textarea placeholder="Catatan trading (misal: Sesuai plan, tapi agak ragu pas mau entry"
            value={catatan}
            onChange={(e) => setCatatan(e.target.value)} />
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
                <TableHead>Hasil</TableHead>
                <TableHead>Catatan</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {riwayat.map((data, index) => (
                <TableRow key={index}>
                  <TableCell>{data.tanggal}</TableCell>
                  <TableCell>{data.pair}</TableCell>
                  <TableCell>{data.setup}</TableCell>
                  <TableCell>{data.emosi}</TableCell>
                  <TableCell>{data.hasil}</TableCell>
                  <TableCell>{data.catatan}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

      </div>
    </div>
  );
}