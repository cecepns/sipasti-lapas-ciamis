import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowLeft,
  CheckCircle2,
  Loader2,
  MapPin,
  ScanFace,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { request, extractErrorMessage } from '@/utils/request';
import { API_ENDPOINTS } from '@/utils/endpoints';
import { AsyncSelectInput } from '@/components/common/AsyncSelectInput';
import { SelectInput } from '@/components/common/SelectInput';
import { FaceIdCamera } from '@/components/common/FaceIdCamera';
import { formatDateTime } from '@/utils/formatters';

const STATUS_OPTIONS = [
  { value: 'Hadir', label: 'Hadir Tepat Waktu' },
  { value: 'Terlambat', label: 'Terlambat' },
];

export function PublicAbsensiPage() {
  const [selectedWbp, setSelectedWbp] = useState(null);
  const [programOptions, setProgramOptions] = useState([]);
  const [selectedProgram, setSelectedProgram] = useState(null);
  const [statusOption, setStatusOption] = useState(STATUS_OPTIONS[0]);
  const [lokasi, setLokasi] = useState('Masjid At-Taubah Lapas Kelas IIB Ciamis');
  const [catatan, setCatatan] = useState('');
  const [captureData, setCaptureData] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [receipt, setReceipt] = useState(null);

  useEffect(() => {
    request
      .get(API_ENDPOINTS.PUBLIC.PROGRAMS)
      .then((res) => {
        const opts = (res.data || []).map((p) => ({
          value: p.id,
          label: `${p.nama_program} (${p.jadwal || p.kategori})`,
          raw: p,
        }));
        setProgramOptions(opts);
        if (opts.length > 0) setSelectedProgram(opts[0]);
      })
      .catch(() => {});
  }, []);

  const loadWbpOptions = useCallback(async (inputValue) => {
    const res = await request.get(API_ENDPOINTS.PUBLIC.WBP_SEARCH, { search: inputValue, limit: 20 });
    return (res.data || []).map((w) => ({
      value: w.id,
      label: `${w.nama} — ${w.no_registrasi} (${w.blok_kamar || '-'})`,
      raw: w,
    }));
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedWbp) return toast.error('Silakan pilih nama Warga Binaan terlebih dahulu');
    if (!selectedProgram) return toast.error('Silakan pilih Program Spiritual');
    if (!captureData?.file) return toast.error('Silakan ambil foto selfie & scan Face ID terlebih dahulu');

    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('wbp_id', selectedWbp.value);
      formData.append('program_id', selectedProgram.value);
      formData.append('status_kehadiran', statusOption?.value || 'Hadir');
      formData.append('lokasi', lokasi);
      formData.append('catatan', catatan);
      formData.append('face_match_score', captureData.faceMatchScore);
      formData.append('face_verified', captureData.faceVerified ? '1' : '0');
      formData.append('foto_selfie', captureData.file);

      const res = await request.upload(API_ENDPOINTS.PUBLIC.ABSENSI, formData);
      toast.success(res.message || 'Absensi Face ID berhasil dicatat!');
      setReceipt({
        ...res.data,
        previewUrl: captureData.dataUrl,
      });
    } catch (err) {
      toast.error(extractErrorMessage(err, 'Gagal mengirim absensi Face ID'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleReset = () => {
    setReceipt(null);
    setCaptureData(null);
    setSelectedWbp(null);
    setCatatan('');
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-950 via-slate-900 to-slate-950 text-white py-6 px-4">
      <div className="mx-auto max-w-4xl">
        <div className="flex items-center justify-between gap-4 mb-6">
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-emerald-200 hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" />
            Beranda SIPASTI
          </Link>
          <div className="flex items-center gap-2.5">
            <img
              src="/logo-sipasti.png"
              alt="Logo SIPASTI"
              className="h-9 w-9 rounded-xl bg-white p-0.5 object-contain"
            />
            <div className="text-right">
              <span className="block text-sm font-extrabold leading-none text-amber-300">
                KIOSK ABSENSI FACE ID
              </span>
              <span className="text-[11px] text-emerald-200">Lapas Kelas IIB Ciamis</span>
            </div>
          </div>
        </div>

        {receipt ? (
          <div className="rounded-3xl bg-white text-slate-800 p-6 sm:p-8 shadow-2xl max-w-xl mx-auto text-center space-y-5">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
              <CheckCircle2 className="h-9 w-9" />
            </div>
            <div>
              <h2 className="text-2xl font-extrabold text-slate-900">Absensi Berhasil Dicatat!</h2>
              <p className="text-sm text-slate-500 mt-1">
                Kehadiran spiritual dan foto selfie Face ID telah tersimpan di SIPASTI.
              </p>
            </div>
            {receipt.previewUrl && (
              <img
                src={receipt.previewUrl}
                alt="Selfie Absensi"
                className="mx-auto h-40 w-52 rounded-2xl object-cover border-2 border-emerald-200 shadow-md"
              />
            )}
            <div className="rounded-2xl bg-slate-50 border border-slate-200 p-4 text-left text-xs sm:text-sm space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-500">Warga Binaan</span>
                <strong className="text-slate-900">{receipt.wbp_nama}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Program Spiritual</span>
                <strong className="text-emerald-700">{receipt.nama_program}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Waktu Kehadiran</span>
                <strong>{formatDateTime(receipt.tanggal_absen)}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Skor Face ID</span>
                <strong className="text-emerald-700">
                  {receipt.face_match_score}% ({receipt.face_verified ? 'Terverifikasi' : 'Tercatat'})
                </strong>
              </div>
            </div>
            <button
              type="button"
              onClick={handleReset}
              className="w-full rounded-xl bg-emerald-600 py-3 text-sm font-bold text-white hover:bg-emerald-700 transition-colors"
            >
              Catat Absensi Warga Binaan Berikutnya
            </button>
          </div>
        ) : (
          <form
            onSubmit={handleSubmit}
            className="rounded-3xl bg-white text-slate-800 p-5 sm:p-8 shadow-2xl grid gap-8 lg:grid-cols-12"
          >
            {/* Left: Selection form */}
            <div className="lg:col-span-5 space-y-4">
              <div>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-[11px] font-bold text-emerald-700">
                  <Sparkles className="h-3.5 w-3.5" />
                  Langkah 1 — Identitas & Program
                </span>
                <h1 className="text-xl font-extrabold text-slate-900 mt-2">
                  Absensi Kehadiran WBP
                </h1>
                <p className="text-xs text-slate-500 mt-1">
                  Cari nama Warga Binaan (pencarian otomatis dengan debounce), pilih kegiatan, lalu
                  lakukan pemindaian Face ID & selfie kamera.
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Nama Warga Binaan (WBP) *
                </label>
                <AsyncSelectInput
                  loadOptionsFn={loadWbpOptions}
                  value={selectedWbp}
                  onChange={(opt) => {
                    setSelectedWbp(opt);
                    setCaptureData(null);
                  }}
                  placeholder="Ketik nama atau no. registrasi..."
                />
                {selectedWbp?.raw && (
                  <div className="mt-2 flex items-center justify-between rounded-xl bg-emerald-50/70 border border-emerald-100 px-3 py-2 text-xs">
                    <span className="text-slate-600">
                      Blok: <strong>{selectedWbp.raw.blok_kamar || '-'}</strong>
                    </span>
                    <span
                      className={`font-bold ${
                        selectedWbp.raw.has_face_id ? 'text-emerald-700' : 'text-amber-700'
                      }`}
                    >
                      {selectedWbp.raw.has_face_id ? 'Face ID Terdaftar' : 'Selfie Langsung'}
                    </span>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Program Kegiatan Spiritual *
                </label>
                <SelectInput
                  options={programOptions}
                  value={selectedProgram}
                  onChange={setSelectedProgram}
                  placeholder="Pilih program kegiatan..."
                  isClearable={false}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Status Kehadiran
                </label>
                <SelectInput
                  options={STATUS_OPTIONS}
                  value={statusOption}
                  onChange={setStatusOption}
                  isClearable={false}
                  isSearchable={false}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Lokasi</label>
                <div className="relative">
                  <MapPin className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={lokasi}
                    onChange={(e) => setLokasi(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 py-2 pl-9 pr-3 text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Catatan (Opsional)
                </label>
                <input
                  type="text"
                  value={catatan}
                  onChange={(e) => setCatatan(e.target.value)}
                  placeholder="Contoh: Hadir tepat waktu sebelum adzan..."
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>
            </div>

            {/* Right: Face ID & Selfie Camera */}
            <div className="lg:col-span-7 flex flex-col justify-between space-y-4 border-t lg:border-t-0 lg:border-l border-slate-100 pt-6 lg:pt-0 lg:pl-8">
              <div>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-3 py-1 text-[11px] font-bold text-amber-700 mb-3">
                  <ScanFace className="h-3.5 w-3.5" />
                  Langkah 2 — Scan Face ID & Ambil Selfie
                </span>

                <FaceIdCamera
                  mode="verify"
                  subjectName={selectedWbp?.raw?.nama || ''}
                  referenceDescriptor={selectedWbp?.raw?.face_descriptor || null}
                  onCapture={setCaptureData}
                />
              </div>

              <button
                type="submit"
                disabled={submitting || !selectedWbp || !captureData?.file}
                className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 py-3.5 text-sm font-bold text-white shadow-lg shadow-emerald-600/25 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                {submitting ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <ShieldCheck className="h-5 w-5" />
                )}
                {submitting ? 'Menyimpan Absensi Face ID...' : 'Kirim Absensi Face ID Sekarang'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
