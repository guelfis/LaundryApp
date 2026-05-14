// routes/AppRoutes.tsx
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import AuthPage from '../auth/AuthPage';
import Dashboard from '../pages/Dashboard'; 
import ApartmentLogin from '../pages/ApartmentLogin';

export default function AppRoutes() {
  const { session, loading } = useAuth();

  // Block rendering while Supabase resolves the token
  if (loading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-gray-50 dark:bg-slate-900">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
      </div>
    );
  }

  return (
    <Routes>
      {!session ? (
        /* Public Shell Rules */
        <Route path="*" element={<AuthPage />} />
      ) : (
        /* Private App Shell Rules */
        <>
          <Route path="/apartment-login" element={<ApartmentLogin />} />
          
          {/* NOTICE: The trailing /* allows the dashboard to manage sub-routes [google:1, google:2] */}
          <Route path="/dashboard/*" element={<Dashboard />}/>

          {/* Catch-all fallback */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </>
      )}
    </Routes>
  );
}
