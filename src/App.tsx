import { Routes, Route, useLocation, Navigate } from 'react-router-dom';
import { AppProvider, useApp } from './context/AppContext';
import ErrorBoundary from './components/ErrorBoundary';
import BottomNav from './components/BottomNav';
import Home from './pages/Home';
import ReceiptCapture from './pages/ReceiptCapture';
import Profile from './pages/Profile';
import SubscriptionPage from './pages/SubscriptionPage';
import BudgetPage from './pages/BudgetPage';
import TrendsPage from './pages/TrendsPage';
import LoginPage from './pages/LoginPage';
import OnboardingPage from './pages/OnboardingPage';
import AchievementsPage from './pages/AchievementsPage';

function AuthGuard({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, hasCompletedOnboarding } = useApp();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (!hasCompletedOnboarding) return <Navigate to="/onboarding" replace />;
  return <>{children}</>;
}

function AppRoutes() {
  const { isAuthenticated, hasCompletedOnboarding } = useApp();
  const location = useLocation();
  const hideNav = ['/capture', '/subscription', '/login', '/onboarding'].includes(location.pathname);

  return (
    <div className="relative">
      <Routes>
        <Route
          path="/login"
          element={
            isAuthenticated
              ? <Navigate to={hasCompletedOnboarding ? '/' : '/onboarding'} replace />
              : <LoginPage />
          }
        />
        <Route
          path="/onboarding"
          element={
            !isAuthenticated
              ? <Navigate to="/login" replace />
              : hasCompletedOnboarding
              ? <Navigate to="/" replace />
              : <OnboardingPage />
          }
        />
        <Route path="/" element={<AuthGuard><Home /></AuthGuard>} />
        <Route path="/capture" element={<AuthGuard><ReceiptCapture /></AuthGuard>} />
        <Route path="/profile" element={<AuthGuard><Profile /></AuthGuard>} />
        <Route path="/subscription" element={<AuthGuard><SubscriptionPage /></AuthGuard>} />
        <Route path="/budget" element={<AuthGuard><BudgetPage /></AuthGuard>} />
        <Route path="/trends" element={<AuthGuard><TrendsPage /></AuthGuard>} />
        <Route path="/achievements" element={<AuthGuard><AchievementsPage /></AuthGuard>} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      {!hideNav && isAuthenticated && hasCompletedOnboarding && <BottomNav />}
    </div>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <AppProvider>
        <AppRoutes />
      </AppProvider>
    </ErrorBoundary>
  );
}
