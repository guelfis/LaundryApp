// routes/AppRoutes.tsx
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import AuthPage from '../auth/AuthPage';
import Dashboard from '../pages/Dashboard'; 
import ApartmentLogin from '../pages/ApartmentLogin';
import { getCleanStorageItem } from '../auth/authUtils';
import HouseholdLogin from '../pages/HouseholdLogin';
import CreateHousehold from '../pages/CreateHousehold';

export default function AppRoutes() {
  const { session, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-gray-50 dark:bg-slate-900">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
      </div>
    );
  }

  // 1. Dynamic Check: Does the user have an active apartment linked?
  const hasApartment = !!getCleanStorageItem('apartmentId');

  return (
    <Routes>
      {!session ? (
        <Route path="*" element={<AuthPage />} />
      ) : (
        <>
          <Route path="/household-login" element={<HouseholdLogin />} />
          <Route path="/household-setup" element={<CreateHousehold />} />
          <Route path="/apartment-login" element={<ApartmentLogin />} />
          <Route path="/dashboard/*" element={<Dashboard />} />

          {/* 
            2. FIXED DYNAMIC ROUTING FALLBACK:
            If they have an apartment, send them to the dashboard.
            If they don't, gracefully drop them onto the setup screen!
          */}
          <Route path="*" element={
            <Navigate to={hasApartment ? "/dashboard" : "/apartment-login"} replace />
          } />
        </>
      )}
    </Routes>
  );
}
