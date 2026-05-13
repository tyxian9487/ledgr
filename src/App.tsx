import { Routes, Route, useLocation } from 'react-router-dom';
import { AppProvider } from './context/AppContext';
import ErrorBoundary from './components/ErrorBoundary';
import BottomNav from './components/BottomNav';
import Home from './pages/Home';
import ReceiptCapture from './pages/ReceiptCapture';
import Profile from './pages/Profile';
import SubscriptionPage from './pages/SubscriptionPage';
import BudgetPage from './pages/BudgetPage';
import TrendsPage from './pages/TrendsPage';

function AppRoutes() {
  const location = useLocation();
  const hideNav = ['/capture', '/subscription'].includes(location.pathname);

  return (
    <div className="relative">
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/capture" element={<ReceiptCapture />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/subscription" element={<SubscriptionPage />} />
        <Route path="/budget" element={<BudgetPage />} />
        <Route path="/trends" element={<TrendsPage />} />
      </Routes>
      {!hideNav && <BottomNav />}
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
