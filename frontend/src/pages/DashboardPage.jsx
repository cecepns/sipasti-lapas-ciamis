import { useSearchParams } from 'react-router-dom';
import { DashboardTabs } from '@/components/dashboard/DashboardTabs';
import { DashboardUmumPage } from './DashboardUmumPage';
import { DashboardWbpPage } from './DashboardWbpPage';
import { DashboardProgramPage } from './DashboardProgramPage';
import { DashboardAsesorPage } from './DashboardAsesorPage';

export function DashboardPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get('tab') || 'umum';

  const handleTabChange = (tabId) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.set('tab', tabId);
      return next;
    });
  };

  return (
    <div className="space-y-4">
      {/* 1 Navigasi Tab Terpadu di Bagian Atas Dashboard */}
      <DashboardTabs activeTab={activeTab} onTabChange={handleTabChange} />

      {/* Konten Dashboard Sesuai Tab Terpilih */}
      {activeTab === 'umum' && <DashboardUmumPage isEmbedded />}
      {activeTab === 'wbp' && <DashboardWbpPage isEmbedded />}
      {activeTab === 'program' && <DashboardProgramPage isEmbedded />}
      {activeTab === 'asesor' && <DashboardAsesorPage isEmbedded />}
    </div>
  );
}
