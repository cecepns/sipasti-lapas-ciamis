import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, CheckCircle2, Handshake, Loader2, Send } from 'lucide-react';
import toast from 'react-hot-toast';
import { request, extractErrorMessage } from '@/utils/request';
import { API_ENDPOINTS } from '@/utils/endpoints';

export function PublicMitraRegisterPage() {
  const [form, setForm] = useState({
    nama_lengkap: '',
    lembaga_instansi: '',
    bidang_keahlian: '',
    email: '',
    no_hp: '',
    alamat: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.nama_lengkap || !form.lembaga_instansi || !form.bidang_keahlian || !form.email || !form.no_hp) {
      toast.error('Mohon lengkapi seluruh kolom bertanda bintang (*)');
      return;
    }
    setSubmitting(true);
    try {
      const res = await request.post(API_ENDPOINTS.PUBLIC.MITRA_REGISTER, form);
      toast.success(res.message || 'Registrasi Mitra berhasil dikirim!');
      setSubmitted(true);
    } catch (err) {
      toast.error(extractErrorMessage(err, 'Gagal mengirim registrasi mitra'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 py-10 px-4">
      <div className="mx-auto max-w-2xl">
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-emerald-700 hover:text-emerald-900 mb-6"
        >
          <ArrowLeft className="h-4 w-4" />
          Kembali ke Beranda SIPASTI
        </Link>

        <div className="rounded-3xl bg-white p-6 sm:p-8 shadow-xl border border-slate-200/80">
          {submitted ? (
            <div className="text-center py-6 space-y-4">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
                <CheckCircle2 className="h-9 w-9" />
              </div>
              <h2 className="text-2xl font-extrabold text-slate-900">Registrasi Terkirim!</h2>
              <p className="text-sm text-slate-600 max-w-md mx-auto">
                Terima kasih atas pendaftaran Anda sebagai Mitra Pembinaan Spiritual Lapas Kelas IIB
                Ciamis. Admin akan memverifikasi data Anda dan mengaktifkan akses akun SIPASTI.
              </p>
              <div className="pt-2 flex justify-center gap-3">
                <Link
                  to="/"
                  className="rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Ke Beranda
                </Link>
                <Link
                  to="/login"
                  className="rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700"
                >
                  Portal Login
                </Link>
              </div>
            </div>
          ) : (
            <>
              <div className="flex items-center gap-4 pb-6 border-b border-slate-100">
                <img
                  src="/logo-sipasti.png"
                  alt="Logo SIPASTI"
                  className="h-14 w-14 rounded-2xl object-contain border border-emerald-100 p-1"
                />
                <div>
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider text-emerald-700">
                    <Handshake className="h-3.5 w-3.5" />
                    Kemitraan Pembinaan Spiritual
                  </span>
                  <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900">
                    Registrasi Mitra Keagamaan
                  </h1>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="mt-6 space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      Nama Lengkap & Gelar *
                    </label>
                    <input
                      type="text"
                      required
                      value={form.nama_lengkap}
                      onChange={(e) => setForm({ ...form, nama_lengkap: e.target.value })}
                      placeholder="Contoh: Ust. Ahmad Fauzi, M.Ag"
                      className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      Lembaga / Instansi / Pesantren *
                    </label>
                    <input
                      type="text"
                      required
                      value={form.lembaga_instansi}
                      onChange={(e) => setForm({ ...form, lembaga_instansi: e.target.value })}
                      placeholder="Contoh: Kemenag Kab. Ciamis / Ponpes..."
                      className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Bidang Keahlian / Materi Pembinaan *
                  </label>
                  <input
                    type="text"
                    required
                    value={form.bidang_keahlian}
                    onChange={(e) => setForm({ ...form, bidang_keahlian: e.target.value })}
                    placeholder="Contoh: Tahsin Al-Quran, Kajian Akhlak, Konseling Rohani"
                    className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                  />
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      Email Aktif *
                    </label>
                    <input
                      type="email"
                      required
                      value={form.email}
                      onChange={(e) => setForm({ ...form, email: e.target.value })}
                      placeholder="mitra@instansi.go.id"
                      className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      No. WhatsApp / Telepon *
                    </label>
                    <input
                      type="text"
                      required
                      value={form.no_hp}
                      onChange={(e) => setForm({ ...form, no_hp: e.target.value })}
                      placeholder="08xxxxxxxxxx"
                      className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Alamat Lengkap</label>
                  <textarea
                    rows={3}
                    value={form.alamat}
                    onChange={(e) => setForm({ ...form, alamat: e.target.value })}
                    placeholder="Alamat domisili atau alamat lembaga..."
                    className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                  />
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 py-3 text-sm font-bold text-white shadow-md shadow-emerald-600/20 hover:bg-emerald-700 disabled:opacity-60 transition-all"
                >
                  {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                  {submitting ? 'Mengirim Pendaftaran...' : 'Kirim Registrasi Mitra'}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
