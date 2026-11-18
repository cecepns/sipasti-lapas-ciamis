import { useState } from 'react';
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import {
  Award,
  BookOpen,
  BookOpenCheck,
  CalendarRange,
  ChevronLeft,
  ChevronRight,
  ClipboardCheck,
  ExternalLink,
  Handshake,
  LayoutDashboard,
  LogOut,
  Menu,
  ScanFace,
  ShieldCheck,
  UserCheck,
  Users,
  X,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { ROLE_COLORS, ROLE_LABELS } from '@/utils/formatters';
import toast from 'react-hot-toast';

const NAV_GROUPS = [
  {
    title: 'Dasbor',
    items: [
      { to: '/app/dasbor-umum', label: 'Dasbor Umum', icon: LayoutDashboard, badge: 'bg-emerald-500/25 text-emerald-300', roles: ['admin', 'wali_pas', 'mitra', 'kasubsi', 'kasi_binadik', 'kalapas'] },
      { to: '/app/dasbor-wbp', label: 'Dasbor & Profil WBP', icon: Award, badge: 'bg-amber-500/25 text-amber-300', roles: ['admin', 'wali_pas', 'mitra', 'kasubsi', 'kasi_binadik', 'kalapas'] },
      { to: '/app/dasbor-program', label: 'Dasbor Program', icon: BookOpenCheck, badge: 'bg-sky-500/25 text-sky-300', roles: ['admin', 'wali_pas', 'mitra', 'kasubsi', 'kasi_binadik', 'kalapas'] },
      { to: '/app/dasbor-asesor', label: 'Dasbor Asesor', icon: UserCheck, badge: 'bg-violet-500/25 text-violet-300', roles: ['admin', 'wali_pas', 'mitra', 'kasubsi', 'kasi_binadik', 'kalapas'] },
    ],
  },
  {
    title: 'Pelaksanaan & Laporan',
    items: [
      { to: '/app/penilaian', label: 'Penilaian SPPN & PPKS', icon: ClipboardCheck, badge: 'bg-teal-500/25 text-teal-300', roles: ['admin', 'wali_pas', 'mitra', 'kasubsi', 'kasi_binadik', 'kalapas'] },
      { to: '/app/rekap-penilaian', label: 'Rekap Penilaian', icon: CalendarRange, badge: 'bg-orange-500/25 text-orange-300', roles: ['admin', 'wali_pas', 'mitra', 'kasubsi', 'kasi_binadik', 'kalapas'] },
      { to: '/app/absensi', label: 'Absensi Face ID', icon: ScanFace, badge: 'bg-indigo-500/25 text-indigo-300', roles: ['admin', 'wali_pas', 'mitra', 'kasubsi', 'kasi_binadik', 'kalapas'] },
    ],
  },
  {
    title: 'Master Data',
    items: [
      { to: '/app/wbp', label: 'Data Warga Binaan', icon: Users, badge: 'bg-cyan-500/25 text-cyan-300', roles: ['admin', 'wali_pas', 'kasubsi', 'kasi_binadik', 'kalapas'] },
      { to: '/app/programs', label: 'Program Pembinaan', icon: BookOpenCheck, badge: 'bg-lime-500/25 text-lime-300', roles: ['admin', 'wali_pas', 'kasubsi', 'kasi_binadik', 'kalapas'] },
      { to: '/app/mitra', label: 'Data Mitra', icon: Handshake, badge: 'bg-pink-500/25 text-pink-300', roles: ['admin', 'mitra', 'kasubsi'] },
      { to: '/app/users', label: 'Manajemen Akun', icon: ShieldCheck, badge: 'bg-rose-500/25 text-rose-300', roles: ['admin'] },
    ],
  },
  {
    title: 'Dokumentasi',
    items: [
      { to: '/app/panduan', label: 'Buku Panduan', icon: BookOpen, badge: 'bg-yellow-500/25 text-yellow-300', roles: ['admin', 'wali_pas', 'mitra', 'kasubsi', 'kasi_binadik', 'kalapas'] },
    ],
  },
];

export function AdminLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  const handleLogout = () => {
    logout();
    toast.success('Anda telah keluar dari SIPASTI');
    navigate('/login');
  };

  const renderNavLinks = (isMobile = false) => (
    <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-5">
      {NAV_GROUPS.map((group) => {
        const visibleItems = group.items.filter((item) => item.roles.includes(user?.role));
        if (visibleItems.length === 0) return null;
        return (
          <div key={group.title}>
            {(!collapsed || isMobile) && (
              <p className="px-3 mb-2 text-[10px] font-extrabold uppercase tracking-widest text-emerald-300/70">
                {group.title}
              </p>
            )}
            <div className="space-y-1">
              {visibleItems.map((item) => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    onClick={() => isMobile && setSidebarOpen(false)}
                    title={collapsed && !isMobile ? item.label : undefined}
                    className={({ isActive }) =>
                      `group flex items-center gap-3 rounded-xl px-2.5 py-2 text-sm font-semibold transition-all duration-200 ${
                        isActive
                          ? 'bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 text-white shadow-lg shadow-emerald-950/40'
                          : 'text-slate-200 hover:bg-white/10 hover:text-white'
                      } ${collapsed && !isMobile ? 'justify-center px-2' : ''}`
                    }
                  >
                    {({ isActive }) => (
                      <>
                        <span
                          className={`flex h-7 w-7 items-center justify-center rounded-lg shrink-0 transition-colors ${
                            isActive ? 'bg-white/20 text-white' : item.badge
                          }`}
                        >
                          <Icon className="h-4 w-4" />
                        </span>
                        {(!collapsed || isMobile) && <span className="truncate">{item.label}</span>}
                      </>
                    )}
                  </NavLink>
                );
              })}
            </div>
          </div>
        );
      })}
    </nav>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 via-emerald-50/40 to-sky-50/40 flex">
      {/* Desktop Colorful Institutional Sidebar */}
      <aside
        className={`hidden lg:flex flex-col fixed inset-y-0 left-0 z-30 bg-gradient-to-b from-emerald-950 via-teal-950 to-slate-950 text-white shadow-2xl transition-all duration-300 ease-in-out ${
          collapsed ? 'w-[78px]' : 'w-64'
        }`}
      >
        <div className="flex items-center justify-between gap-2 border-b border-white/10 px-3.5 py-4">
          <Link to="/app/dasbor-umum" className="flex items-center gap-2.5 min-w-0">
            <img
              src="/logo-sipasti.png"
              alt="Logo SIPASTI"
              className="h-10 w-10 rounded-xl object-contain bg-white p-0.5 shadow-md shrink-0"
            />
            {!collapsed && (
              <div className="min-w-0">
                <span className="block text-base font-extrabold tracking-tight text-amber-300 leading-none">
                  SIPASTI
                </span>
                <span className="block text-[10px] font-semibold text-emerald-200/80 mt-0.5 truncate">
                  Lapas Kelas IIB Ciamis
                </span>
              </div>
            )}
          </Link>
          <button
            type="button"
            onClick={() => setCollapsed((c) => !c)}
            className="rounded-lg p-1.5 text-emerald-200 hover:bg-white/10 hover:text-white transition-colors shrink-0"
            title={collapsed ? 'Perluas sidebar' : 'Ciutkan sidebar'}
          >
            {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </button>
        </div>

        {renderNavLinks(false)}

        <div className="border-t border-white/10 p-3 space-y-2">
          <Link
            to="/absensi-kiosk"
            target="_blank"
            className={`flex items-center gap-2.5 rounded-xl bg-gradient-to-r from-amber-400 to-orange-400 px-3 py-2 text-xs font-extrabold text-slate-950 shadow-md hover:from-amber-300 hover:to-orange-300 transition-all ${
              collapsed ? 'justify-center px-2' : ''
            }`}
            title="Buka Kiosk Absensi WBP"
          >
            <ExternalLink className="h-4 w-4 shrink-0" />
            {!collapsed && <span>Kiosk Absensi WBP</span>}
          </Link>
          <button
            type="button"
            onClick={handleLogout}
            className={`flex w-full items-center gap-2.5 rounded-xl bg-rose-500/15 border border-rose-400/25 px-3 py-2 text-xs font-bold text-rose-200 hover:bg-rose-500/30 hover:text-white transition-colors ${
              collapsed ? 'justify-center px-2' : ''
            }`}
            title="Keluar"
          >
            <LogOut className="h-4 w-4 shrink-0" />
            {!collapsed && <span>Keluar Akun</span>}
          </button>
        </div>
      </aside>

      {/* Mobile Drawer Overlay */}
      <div
        className={`fixed inset-0 z-40 bg-slate-900/60 backdrop-blur-xs transition-opacity duration-300 lg:hidden ${
          sidebarOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
        onClick={() => setSidebarOpen(false)}
      />

      {/* Mobile Sidebar Drawer */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-72 max-w-[85vw] bg-gradient-to-b from-emerald-950 via-teal-950 to-slate-950 text-white shadow-2xl flex flex-col transform transition-transform duration-300 ease-in-out lg:hidden ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between border-b border-white/10 px-4 py-4">
          <div className="flex items-center gap-2.5">
            <img
              src="/logo-sipasti.png"
              alt="Logo SIPASTI"
              className="h-10 w-10 rounded-xl object-contain bg-white p-0.5"
            />
            <div>
              <span className="block text-base font-extrabold text-amber-300 leading-none">
                SIPASTI
              </span>
              <span className="block text-[10px] font-semibold text-emerald-200/80 mt-0.5">
                Lapas Kelas IIB Ciamis
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setSidebarOpen(false)}
            className="rounded-lg p-1.5 text-emerald-200 hover:bg-white/10"
            aria-label="Tutup menu"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {renderNavLinks(true)}

        <div className="border-t border-white/10 p-3 space-y-2">
          <Link
            to="/absensi-kiosk"
            className="flex items-center gap-2.5 rounded-xl bg-gradient-to-r from-amber-400 to-orange-400 px-3 py-2 text-xs font-extrabold text-slate-950"
            onClick={() => setSidebarOpen(false)}
          >
            <ExternalLink className="h-4 w-4" />
            Kiosk Absensi Face ID
          </Link>
          <button
            type="button"
            onClick={handleLogout}
            className="flex w-full items-center gap-2.5 rounded-xl bg-rose-500/20 px-3 py-2 text-xs font-bold text-rose-200 hover:bg-rose-500/30"
          >
            <LogOut className="h-4 w-4" />
            Keluar Akun
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div
        className={`flex-1 flex flex-col min-w-0 transition-all duration-300 ${
          collapsed ? 'lg:pl-[78px]' : 'lg:pl-64'
        }`}
      >
        <header className="sticky top-0 z-20 bg-white/95 backdrop-blur-md shadow-xs">
          <div className="h-1 w-full bg-gradient-to-r from-emerald-500 via-sky-500 via-50% to-amber-400" />
          <div className="flex items-center justify-between gap-3 border-b border-slate-200/80 px-4 py-3 sm:px-6">
            <div className="flex items-center gap-3 min-w-0">
              <button
                type="button"
                onClick={() => setSidebarOpen(true)}
                className="rounded-xl border border-emerald-200 bg-emerald-50 p-2 text-emerald-700 hover:bg-emerald-100 lg:hidden"
                aria-label="Buka navigasi"
              >
                <Menu className="h-5 w-5" />
              </button>
              <img
                src="/logo-kementerian.png"
                alt="Pemasyarakatan"
                className="hidden sm:block h-8 w-8 rounded-lg object-contain bg-white border border-slate-100 p-0.5 shrink-0"
              />
              <div className="min-w-0">
                <p className="text-xs font-extrabold text-emerald-800 uppercase tracking-wider truncate">
                  Sistem Informasi Penilaian Aktivitas Spiritual Terintegrasi
                </p>
                <p className="text-[11px] font-medium text-slate-500 hidden sm:block">
                  Kementerian Imigrasi & Pemasyarakatan RI — Lapas Kelas IIB Ciamis
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-bold text-slate-900 leading-tight">{user?.nama}</p>
                <span
                  className={`inline-block mt-0.5 rounded-full border px-2 py-0.2 text-[10px] font-bold ${
                    ROLE_COLORS[user?.role] || 'bg-slate-100 text-slate-700 border-slate-200'
                  }`}
                >
                  {ROLE_LABELS[user?.role] || user?.role}
                </span>
              </div>
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 via-teal-500 to-sky-600 text-sm font-extrabold text-white shadow-md">
                {(user?.nama || 'U').charAt(0).toUpperCase()}
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 p-4 sm:p-6 max-w-[1600px] w-full mx-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
