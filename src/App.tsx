import { Routes, Route, useLocation } from 'react-router-dom';
import { AppProvider } from './context/AppContext';
import ErrorBoundary from './components/ErrorBoundary';
import BottomNav from './components/BottomNav';
import Home from './pages/Home';
import ReceiptCapture from './pages/ReceiptCapture';
import Profile from './pages/Profile';
import SubscriptionPage from './pages/SubscriptionPage';

function AppRoutes() {
  const location = useLocation();
  const hideNav = location.pathname === '/capture' || location.pathname === '/subscription';

  return (
    <div className="relative">
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/capture" element={<ReceiptCapture />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/subscription" element={<SubscriptionPage />} />
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
