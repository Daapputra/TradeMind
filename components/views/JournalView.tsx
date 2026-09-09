import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { supabase } from "@/lib/supabase";

export function JournalView({ riwayat, refreshData }: { riwayat: any[], refreshData: () => void }) {
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
  const [gambarUrl, setGambarUrl] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [idEdit, setIdEdit] = useState<any>(null);
  const [bukaEdit, setBukaEdit] = useState(false);
  const [bukaCatatan, setBukaCatatan] = useState(false);
  const [catatanPilihan, setCatatanPilihan] = useState("");
  const [gambarPilihan, setGambarPilihan] = useState("");

  async function uploadGambar(e: any) {
    const file = e.target.files[0];
    if (!file) return;

    setIsUploading(true); // animasi lagi mengunggah

    // mengubah nama file menjadi kode acak agar tidak bertabrakan dengan gambar lama
    const namaFileAcak = Math.random() + "-" + file.name;

    // mengirim file ke supabase
    const { error } = await supabase.storage
      .from("screenshots")
      .upload(namaFileAcak, file);

    if (error) {
      alert("Gagal mengunggah gambar: " + error.message);
      setIsUploading(false);
      return;
    }

    // mengambil URL dari gambar tersebut
    const { data } = supabase.storage.from("screenshots").getPublicUrl(namaFileAcak);
    setGambarUrl(data.publicUrl);
    setIsUploading(false);
  }

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
          gambar_url: gambarUrl,
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
          gambar_url: gambarUrl,
        }]);

      errorCek = error;
    }

    // cek sukses atau gagal
    if (errorCek) {
      alert("Gagal Menyimpan Data:" + errorCek.message);
      console.log(errorCek);
    } else {
      alert("Jurnal Berhasil Disimpan!");
      refreshData(); // Refresh Tabel

      // bersihkan form dan matikan mode edit (kembali ke null)
      batalEdit();
    }
  }

  async function hapusData(idYangMauDiHapus: any) {
    // menghapus data yg ID nya cocok
    await supabase.from("jurnal").delete().eq("id", idYangMauDiHapus);

    // memanggil data terbaru agar tabel langsung diperabarui
    refreshData();
  }

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
    setGambarUrl("");
    setBukaEdit(false); // untuk menutup pop up edit
  }

  return (
    <div className="w-full">
      <h2 className="text-2xl font-bold mb-6 text-slate-800">Trading Journal</h2>
      
      {/* pembelah layar */}
      <div className="flex flex-col xl:flex-row gap-8">
        
        {/* kolom kiri - Form Input */}
        <div className="flex flex-col gap-4 w-full xl:w-[400px] shrink-0 bg-white p-6 rounded-lg border shadow-sm">
          <h3 className="font-semibold text-slate-700 mb-2">Input Jurnal Baru</h3>
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

          <Textarea placeholder="Catatan trading (misal: Sesuai plan, tapi agak ragu pas mau entry)"
            value={catatan}
            onChange={(e) => {
              const teks = e.target.value;
              setCatatan(teks.charAt(0).toUpperCase() + teks.slice(1));
            }}
          />
          <div className="flex flex-col gap-2">
            <span className="text-sm font-medium text-slate-500">Screenshot Trade (Opsional)</span>
            <Input
              type="file"
              accept="image/*"
              disabled={isUploading}
              onChange={uploadGambar}
              className="file:text-slate-500 file:font-medium file:mr-4 file:bg-slate-100 file:border-0 file:rounded-md hover:file:bg-slate-200 cursor-pointer"
            />
            {isUploading && <span className="text-xs text-blue-500 animate-pulse">Sedang mengunggah gambar...</span>}
            {gambarUrl && <span className="text-xs text-green-600 font-medium">✓ Gambar berhasil terlampir</span>}
          </div>

          <Button onClick={simpanData} className="mt-2">Simpan Jurnal</Button>
        </div>

        {/* kolom kanan - Riwayat Trading */}
        <div className="flex-1 bg-white border rounded-lg p-6 shadow-sm overflow-x-auto min-w-[300px]">
          <h3 className="font-semibold text-slate-700 mb-4">Riwayat Trading</h3>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tanggal</TableHead>
                <TableHead>Market</TableHead>
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
                  <TableCell>{data.market}</TableCell>
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
                      
                      {/* Tombol Pintar: Hanya muncul 1 tombol jika ada Foto ATAU Catatan Panjang */}
                      { (data.gambar_url || (data.catatan && data.catatan.length > 15)) && (
                        <button
                          className="text-xs text-blue-600 font-bold hover:underline shrink-0"
                          onClick={() => {
                            setCatatanPilihan(data.catatan);
                            setGambarPilihan(data.gambar_url);
                            setBukaCatatan(true);
                          }}
                        >
                          {data.gambar_url ? "[🖼️ Lihat SS]" : "[Catatan]"}
                        </button>
                      )}
                    </div>
                  </TableCell>

                  <TableCell>
                    <div className="flex gap-2">
                      {/* tombol edit */}
                      <Button
                        variant="outline"
                        size="sm"
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
                          setGambarUrl(data.gambar_url);
                          setBukaEdit(true); // pop up edit
                        }}
                      >
                        Edit
                      </Button>
                      {/* tombol hapus */}
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => hapusData(data.id)}
                      >
                        Hapus
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              
              {riwayat.length === 0 && (
                <TableRow>
                  <TableCell colSpan={12} className="text-center text-slate-500 py-8">
                    Belum ada riwayat trading.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Pop Up Baca Catatan */}
      <Dialog open={bukaCatatan} onOpenChange={setBukaCatatan}>
        <DialogContent className="sm:max-w-[700px]">
          <DialogHeader>
            <DialogTitle>Detail Trading</DialogTitle>
            <DialogDescription className="mt-4 text-slate-800 text-base leading-relaxed whitespace-pre-wrap">
              {gambarPilihan && (
                <img src={gambarPilihan} alt="Screenshot Trade" className="w-full h-auto rounded-md mb-4 border shadow-sm" />
              )}
              <div className="bg-slate-50 p-4 rounded-md border">
                {catatanPilihan || "Tidak ada catatan."}
              </div>
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

          {/* Area Form Edit */}
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

            <Textarea placeholder="Catatan trading (misal: Sesuai plan, tapi agak ragu pas mau entry)"
              value={catatan}
              onChange={(e) => {
                const teks = e.target.value;
                setCatatan(teks.charAt(0).toUpperCase() + teks.slice(1));
              }}
            />
            <div className="flex flex-col gap-2">
              <span className="text-sm font-medium text-slate-500">Screenshot Trade (Opsional)</span>
              <Input
                type="file"
                accept="image/*"
                disabled={isUploading}
                onChange={uploadGambar}
                className="file:text-slate-500 file:font-medium file:mr-4 file:bg-slate-100 file:border-0 file:rounded-md hover:file:bg-slate-200 cursor-pointer"
              />
              {isUploading && <span className="text-xs text-blue-500 animate-pulse">Sedang mengunggah gambar...</span>}
              {gambarUrl && <span className="text-xs text-green-600 font-medium">✓ Gambar berhasil terlampir</span>}
            </div>
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
