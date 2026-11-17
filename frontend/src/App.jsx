import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from '@/context/AuthContext';
import { ProtectedRoute } from '@/components/layout/ProtectedRoute';
import { AdminLayout } from '@/components/layout/AdminLayout';

import { LandingPage } from '@/pages/LandingPage';
import { LoginPage } from '@/pages/LoginPage';
import { PublicAbsensiPage } from '@/pages/PublicAbsensiPage';
import { PublicMitraRegisterPage } from '@/pages/PublicMitraRegisterPage';

import { DashboardUmumPage } from '@/pages/DashboardUmumPage';
import { DashboardWbpPage } from '@/pages/DashboardWbpPage';
import { DashboardProgramPage } from '@/pages/DashboardProgramPage';
import { DashboardAsesorPage } from '@/pages/DashboardAsesorPage';
import { AssessmentsPage } from '@/pages/AssessmentsPage';
import { AttendancesPage } from '@/pages/AttendancesPage';
import { WbpPage } from '@/pages/WbpPage';
import { ProgramsPage } from '@/pages/ProgramsPage';
import { MitraPage } from '@/pages/MitraPage';
import { UsersPage } from '@/pages/UsersPage';

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 3800,
            style: {
              borderRadius: '14px',
              background: '#0f172a',
              color: '#f8fafc',
              fontSize: '13px',
              fontWeight: 600,
            },
            success: {
              iconTheme: { primary: '#10b981', secondary: '#ffffff' },
            },
            error: {
              iconTheme: { primary: '#f43f5e', secondary: '#ffffff' },
            },
          }}
        />

        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/absensi-kiosk" element={<PublicAbsensiPage />} />
          <Route path="/registrasi-mitra" element={<PublicMitraRegisterPage />} />

          {/* Authenticated Portal Routes */}
          <Route
            path="/app"
            element={
              <ProtectedRoute>
                <AdminLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Navigate to="dasbor-umum" replace />} />
            <Route path="dasbor-umum" element={<DashboardUmumPage />} />
            <Route path="dasbor-wbp" element={<DashboardWbpPage />} />
            <Route path="dasbor-program" element={<DashboardProgramPage />} />
            <Route path="dasbor-asesor" element={<DashboardAsesorPage />} />
            <Route path="penilaian" element={<AssessmentsPage />} />
            <Route path="absensi" element={<AttendancesPage />} />
            <Route
              path="wbp"
              element={
                <ProtectedRoute allowedRoles={['admin', 'wali_pas', 'kasubsi', 'kasi_binadik', 'kalapas']}>
                  <WbpPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="programs"
              element={
                <ProtectedRoute allowedRoles={['admin', 'wali_pas', 'kasubsi', 'kasi_binadik', 'kalapas']}>
                  <ProgramsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="mitra"
              element={
                <ProtectedRoute allowedRoles={['admin', 'mitra', 'kasubsi']}>
                  <MitraPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="users"
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <UsersPage />
                </ProtectedRoute>
              }
            />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
