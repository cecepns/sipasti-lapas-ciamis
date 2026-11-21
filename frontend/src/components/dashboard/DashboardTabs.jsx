import { useSearchParams } from 'react-router-dom';
import { Layers, Award, BookOpen, UserCheck } from 'lucide-react';

export const DASHBOARD_TABS = [
  {
    id: 'umum',
    label: 'Dashboard Umum',
    shortLabel: 'Umum',
    icon: Layers,
    desc: 'Overview Eksekutif & Pareto 80/20',
    color: 'emerald',
  },
  {
    id: 'wbp',
    label: 'Dashboard WBP',
    shortLabel: 'Warga Binaan',
    icon: Award,
    desc: 'Evaluasi Personal, Rapor & Face ID',
    color: 'amber',
  },
  {
    id: 'program',
    label: 'Dashboard Program',
    shortLabel: 'Program',
    icon: BookOpen,
    desc: 'Capaian Kurikulum Pembinaan Spiritual',
    color: 'sky',
  },
  {
    id: 'asesor',
    label: 'Dashboard Asesor',
    shortLabel: 'Asesor',
    icon: UserCheck,
    desc: 'Monitoring Kinerja Wali PAS & Mitra',
    color: 'violet',
  },
];

export function DashboardTabs({ activeTab, onTabChange }) {
  const [searchParams, setSearchParams] = useSearchParams();
  const currentTab = activeTab || searchParams.get('tab') || 'umum';

  const handleTabClick = (tabId) => {
    if (onTabChange) {
      onTabChange(tabId);
    } else {
      setSearchParams((prev) => {
        const next = new URLSearchParams(prev);
        next.set('tab', tabId);
        return next;
      });
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 p-2 shadow-xs">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
        {DASHBOARD_TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = currentTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => handleTabClick(tab.id)}
              className={`flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all text-left ${
                isActive
                  ? 'bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 text-white shadow-md shadow-emerald-950/20 ring-2 ring-emerald-500/20'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 border border-transparent'
              }`}
            >
              <span
                className={`p-1.5 rounded-lg shrink-0 transition-colors ${
                  isActive ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'
                }`}
              >
                <Icon className="h-4 w-4" />
              </span>
              <div className="min-w-0">
                <p className="truncate leading-tight font-extrabold">{tab.label}</p>
                <p
                  className={`text-[10px] font-normal truncate mt-0.5 ${
                    isActive ? 'text-emerald-100' : 'text-slate-400'
                  }`}
                >
                  {tab.desc}
                </p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
