import { useState } from 'react';
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import {
  Award,
  BookOpenCheck,
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
    title: 'Visualisasi Dasbor',
    items: [
      { to: '/app/dasbor-umum', label: 'Dasbor Umum', icon: LayoutDashboard, roles: ['admin', 'wali_pas', 'mitra', 'kasubsi', 'kasi_binadik', 'kalapas'] },
      { to: '/app/dasbor-wbp', label: 'Dasbor & Profil WBP', icon: Award, roles: ['admin', 'wali_pas', 'mitra', 'kasubsi', 'kasi_binadik', 'kalapas'] },
      { to: '/app/dasbor-program', label: 'Dasbor Program', icon: BookOpenCheck, roles: ['admin', 'wali_pas', 'mitra', 'kasubsi', 'kasi_binadik', 'kalapas'] },
      { to: '/app/dasbor-asesor', label: 'Dasbor Asesor', icon: UserCheck, roles: ['admin', 'wali_pas', 'mitra', 'kasubsi', 'kasi_binadik', 'kalapas'] },
    ],
  },
  {
    title: 'Pelaksanaan & Respon',
    items: [
      { to: '/app/penilaian', label: 'Penilaian SPPN & PPKS', icon: ClipboardCheck, roles: ['admin', 'wali_pas', 'mitra', 'kasubsi', 'kasi_binadik', 'kalapas'] },
      { to: '/app/absensi', label: 'Absensi Face ID', icon: ScanFace, roles: ['admin', 'wali_pas', 'mitra', 'kasubsi', 'kasi_binadik', 'kalapas'] },
    ],
  },
  {
    title: 'Master Data SIPASTI',
    items: [
      { to: '/app/wbp', label: 'Data WBP (SDP)', icon: Users, roles: ['admin', 'wali_pas', 'kasubsi', 'kasi_binadik', 'kalapas'] },
      { to: '/app/programs', label: 'Data Program', icon: BookOpenCheck, roles: ['admin', 'wali_pas', 'kasubsi', 'kasi_binadik', 'kalapas'] },
      { to: '/app/mitra', label: 'Registrasi Mitra', icon: Handshake, roles: ['admin', 'mitra', 'kasubsi'] },
      { to: '/app/users', label: 'Wali PAS & Akun', icon: ShieldCheck, roles: ['admin'] },
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
              <p className="px-3 mb-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">
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
                      `group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition-all duration-200 ${
                        isActive
                          ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
                          : 'text-slate-600 hover:bg-emerald-50 hover:text-emerald-700'
                      } ${collapsed && !isMobile ? 'justify-center px-2' : ''}`
                    }
                  >
                    <Icon className="h-[18px] w-[18px] shrink-0" />
                    {(!collapsed || isMobile) && <span className="truncate">{item.label}</span>}
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
    <div className="min-h-screen bg-slate-50 flex">
      {/* Desktop Sidebar */}
      <aside
        className={`hidden lg:flex flex-col fixed inset-y-0 left-0 z-30 border-r border-slate-200/80 bg-white transition-all duration-300 ease-in-out ${
          collapsed ? 'w-[76px]' : 'w-64'
        }`}
      >
        <div className="flex items-center justify-between gap-2 border-b border-slate-100 px-3.5 py-3.5">
          <Link to="/app/dasbor-umum" className="flex items-center gap-2.5 min-w-0">
            <img
              src="/logo-sipasti.png"
              alt="Logo SIPASTI"
              className="h-10 w-10 rounded-xl object-contain bg-white p-0.5 border border-emerald-100 shrink-0"
            />
            {!collapsed && (
              <div className="min-w-0">
                <span className="block text-base font-extrabold tracking-tight text-emerald-700 leading-none">
                  SIPASTI
                </span>
                <span className="block text-[10px] font-semibold text-slate-500 mt-0.5 truncate">
                  Lapas Kelas IIB Ciamis
                </span>
              </div>
            )}
          </Link>
          <button
            type="button"
            onClick={() => setCollapsed((c) => !c)}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors shrink-0"
            title={collapsed ? 'Perluas sidebar' : 'Ciutkan sidebar'}
          >
            {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </button>
        </div>

        {renderNavLinks(false)}

        <div className="border-t border-slate-100 p-3 space-y-2">
          <Link
            to="/absensi-kiosk"
            target="_blank"
            className={`flex items-center gap-2.5 rounded-xl border border-emerald-200 bg-emerald-50/70 px-3 py-2 text-xs font-semibold text-emerald-700 hover:bg-emerald-100 transition-colors ${
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
            className={`flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 transition-colors ${
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
        className={`fixed inset-0 z-40 bg-slate-900/55 backdrop-blur-xs transition-opacity duration-300 lg:hidden ${
          sidebarOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
        onClick={() => setSidebarOpen(false)}
      />

      {/* Mobile Sidebar Drawer */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-72 max-w-[85vw] bg-white shadow-2xl flex flex-col transform transition-transform duration-300 ease-in-out lg:hidden ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3.5">
          <div className="flex items-center gap-2.5">
            <img
              src="/logo-sipasti.png"
              alt="Logo SIPASTI"
              className="h-10 w-10 rounded-xl object-contain border border-emerald-100 p-0.5"
            />
            <div>
              <span className="block text-base font-extrabold text-emerald-700 leading-none">
                SIPASTI
              </span>
              <span className="block text-[10px] font-semibold text-slate-500 mt-0.5">
                Lapas Kelas IIB Ciamis
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setSidebarOpen(false)}
            className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100"
            aria-label="Tutup menu"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {renderNavLinks(true)}

        <div className="border-t border-slate-100 p-3 space-y-2">
          <Link
            to="/absensi-kiosk"
            className="flex items-center gap-2.5 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-700"
            onClick={() => setSidebarOpen(false)}
          >
            <ExternalLink className="h-4 w-4" />
            Kiosk Absensi Face ID
          </Link>
          <button
            type="button"
            onClick={handleLogout}
            className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50"
          >
            <LogOut className="h-4 w-4" />
            Keluar Akun
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div
        className={`flex-1 flex flex-col min-w-0 transition-all duration-300 ${
          collapsed ? 'lg:pl-[76px]' : 'lg:pl-64'
        }`}
      >
        <header className="sticky top-0 z-20 flex items-center justify-between gap-3 border-b border-slate-200/80 bg-white/90 backdrop-blur-md px-4 py-3 sm:px-6">
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={() => setSidebarOpen(true)}
              className="rounded-xl border border-slate-200 p-2 text-slate-600 hover:bg-slate-100 lg:hidden"
              aria-label="Buka navigasi"
            >
              <Menu className="h-5 w-5" />
            </button>
            <div className="min-w-0">
              <p className="text-xs font-bold text-emerald-700 uppercase tracking-wider truncate">
                Sistem Informasi Penilaian Aktivitas Spiritual Terintegrasi
              </p>
              <p className="text-[11px] text-slate-500 hidden sm:block">
                Lembaga Pemasyarakatan Kelas IIB Ciamis
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
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-600 to-teal-700 text-sm font-bold text-white shadow-sm">
              {(user?.nama || 'U').charAt(0).toUpperCase()}
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
