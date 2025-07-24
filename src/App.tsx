import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from '@/contexts/theme-provider';
import { AuthProvider, useAuth } from '@/hooks/use-auth';
import { Toaster } from '@/components/ui/toaster';
import { useDataCleanup } from '@/hooks/use-data-cleanup';
import HomePage from '@/pages/home';
import ClinicPage from '@/pages/clinic';
import LoginPage from '@/pages/login';
import './index.css';

function AppContent() {
  const { user, loading } = useAuth();
  
  // Use data cleanup hook
  useDataCleanup();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  return (
    <Router>
      <Routes>
        {user ? (
          <>
            <Route path="/home" element={<HomePage />} />
            <Route path="/clinic" element={<ClinicPage />} />
            <Route path="/" element={<Navigate to="/home" replace />} />
            <Route path="/login" element={<Navigate to="/home" replace />} />
          </>
        ) : (
          <>
            <Route path="/login" element={<LoginPage />} />
            <Route path="*" element={<Navigate to="/login" replace />} />
          </>
        )}
      </Routes>
      <Toaster />
    </Router>
  );
}

function App() {
  return (
    <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;