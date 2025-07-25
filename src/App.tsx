import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from '@/contexts/theme-provider';
import { AuthProvider, useAuth } from '@/hooks/use-auth';
import { WorkplaceProvider, useWorkplaces } from '@/contexts/workplace-context';
import { Toaster } from '@/components/ui/toaster';
import { useDataCleanup } from '@/hooks/use-data-cleanup';
import WorkplaceSetup from '@/components/WorkplaceSetup';
import MainDashboardPage from '@/pages/MainDashboardPage';
import LoginPage from '@/pages/login';
import './index.css';

function AppContent() {
  const { user, loading: authLoading } = useAuth();
  
  // Use data cleanup hook
  useDataCleanup();

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return (
      <Router>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
        <Toaster />
      </Router>
    );
  }

  return (
    <WorkplaceProvider>
      <WorkplaceContent />
      <Toaster />
    </WorkplaceProvider>
  );
}

function WorkplaceContent() {
  const { user } = useAuth();
  const { workplaces, loading: workplacesLoading, switchWorkplace } = useWorkplaces();

  // Show loading while workplaces are being fetched
  if (workplacesLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="text-lg font-medium">Setting up your workspace...</div>
          <p className="text-muted-foreground mt-2">Please wait while we load your workplaces.</p>
        </div>
      </div>
    );
  }

  // If user has no workplaces, show the workplace setup
  if (workplaces.length === 0) {
    return (
      <WorkplaceSetup 
        onWorkplaceCreated={(workplaceId, workplaceName) => {
          // Find and switch to the new workplace
          const newWorkplace = {
            id: workplaceId,
            name: workplaceName,
            userId: user!.uid,
            createdAt: new Date(),
            isActive: true
          };
          switchWorkplace(newWorkplace);
        }}
      />
    );
  }

  // Show main dashboard if user has workplaces
  return (
    <Router>
      <Routes>
        <Route path="/" element={<MainDashboardPage />} />
        <Route path="/dashboard" element={<MainDashboardPage />} />
        <Route path="/login" element={<Navigate to="/" replace />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
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