import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Eye, EyeOff, Loader2, Lock, Mail, MessageSquare, ShieldCheck } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '@/context/AuthContext';
import { extractErrorMessage } from '@/utils/request';

const DEMO_ACCOUNTS = [
  { label: 'Admin', email: 'admin@sipastilapasciamis.com' },
  { label: 'Ka. Lapas', email: 'kalapas@sipastilapasciamis.com' },
  { label: 'Kasi Binadik', email: 'kasibinadik@sipastilapasciamis.com' },
  { label: 'Kasubsi', email: 'kasubsi@sipastilapasciamis.com' },
  { label: 'Wali PAS', email: 'hendra.walipas@sipastilapasciamis.com' },
  { label: 'Mitra', email: 'mitra@sipastilapasciamis.com' },
];

export function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim() || !password) {
      toast.error('Mohon masukkan email dan kata sandi');
      return;
    }
    setSubmitting(true);
    try {
      const user = await login(email.trim(), password);
      toast.success(`Selamat datang, ${user.nama}`);
      navigate('/app/dashboard', { replace: true });
    } catch (err) {
      toast.error(extractErrorMessage(err, 'Gagal masuk. Periksa email dan kata sandi Anda.'));
    } finally {
      setSubmitting(false);
    }
  };

  const WA_RESET_URL =
    'https://wa.me/6285169841951?text=Halo%20Admin%20SIPASTI%20Lapas%20Ciamis,%20mohon%20bantuan%20reset%20kata%20sandi%20akun%20saya';

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-950 via-emerald-900 to-slate-900 flex flex-col justify-center p-4 sm:p-6">
      <div className="mx-auto w-full max-w-md">
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-200 hover:text-white mb-5 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Kembali ke Beranda SIPASTI
        </Link>

        <div className="rounded-3xl bg-white p-6 sm:p-8 shadow-2xl border border-slate-100">
          <div className="text-center mb-6">
            <img
              src="/logo-sipasti.png"
              alt="Logo SIPASTI"
              className="mx-auto h-20 w-20 rounded-2xl object-contain bg-white border border-emerald-100 p-1 shadow-xs"
            />
            <div className="mt-3 space-y-0.5">
              <p className="text-xs font-bold uppercase tracking-wider text-emerald-800">
                Portal Masuk
              </p>
              <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                SIPASTI
              </h1>
              <p className="text-xs font-semibold text-slate-600">
                Sistem Penilaian Aktivitas Spiritual Terintegrasi
              </p>
              <p className="text-[11px] font-medium text-slate-500">
                Lembaga Pemasyarakatan Kelas IIB Ciamis
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">Alamat Email</label>
              <div className="relative">
                <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="nama@sipastilapasciamis.com"
                  required
                  className="w-full rounded-xl border border-slate-200 py-2.5 pl-9 pr-3 text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-bold text-slate-700">Kata Sandi</label>
                {/* [REV0010] Permintaan Ubah Password WhatsApp */}
                <a
                  href={WA_RESET_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 hover:text-emerald-800 hover:underline"
                >
                  <MessageSquare className="h-3 w-3" />
                  Lupa / Ubah Kata Sandi?
                </a>
              </div>
              <div className="relative">
                <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  type={showPass ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full rounded-xl border border-slate-200 py-2.5 pl-9 pr-10 text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                />
                <button
                  type="button"
                  onClick={() => setShowPass((s) => !s)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 py-2.5 text-sm font-bold text-white shadow-md shadow-emerald-600/20 hover:bg-emerald-700 disabled:opacity-60 transition-all"
            >
              {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />}
              {submitting ? 'Memverifikasi...' : 'Masuk ke SIPASTI'}
            </button>
          </form>

          {/* Quick demo role picker */}
          {/* <div className="mt-6 pt-5 border-t border-slate-100">
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2">
              Akses Demo Cepat (Sandi: sipasti123)
            </p>
            <div className="grid grid-cols-3 gap-1.5">
              {DEMO_ACCOUNTS.map((acc) => (
                <button
                  key={acc.label}
                  type="button"
                  onClick={() => {
                    setEmail(acc.email);
                    setPassword('sipasti123');
                  }}
                  className="rounded-lg border border-slate-200 bg-slate-50 px-2 py-1.5 text-[11px] font-semibold text-slate-700 hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-700 transition-colors"
                >
                  {acc.label}
                </button>
              ))}
            </div>
          </div> */}

          {/* [REV0009] Ubah teks link registrasi */}
          <div className="mt-5 text-center text-xs text-slate-500">
            Mitra Keagamaan belum memiliki akun?{' '}
            <Link to="/registrasi-mitra" className="font-bold text-emerald-700 hover:underline">
              Mendaftar sebagai Mitra Pembina Spiritual
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
