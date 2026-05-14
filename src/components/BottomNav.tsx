import { Home, Camera, User, LineChart, Target } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';

const NAV_ITEMS = [
  { label: 'Home', icon: Home, path: '/', tourId: 'nav-home' },
  { label: 'Trends', icon: LineChart, path: '/trends', tourId: 'nav-trends' },
];

const RIGHT_ITEMS = [
  { label: 'Budgets', icon: Target, path: '/budget', tourId: 'nav-budget' },
  { label: 'Profile', icon: User, path: '/profile', tourId: 'nav-profile' },
];

export default function BottomNav() {
  const navigate = useNavigate();
  const location = useLocation();
  const active = location.pathname;

  function NavBtn({ label, icon: Icon, path, tourId }: { label: string; icon: React.ElementType; path: string; tourId: string }) {
    const isActive = active === path;
    return (
      <button
        data-tour={tourId}
        onClick={() => navigate(path)}
        className="flex flex-col items-center gap-0.5 min-w-[52px]"
      >
        <Icon
          size={22}
          className={isActive ? 'text-green-600' : 'text-gray-400 dark:text-gray-500'}
          strokeWidth={isActive ? 2.5 : 1.8}
        />
        <span className={`text-[11px] font-medium ${isActive ? 'text-green-600' : 'text-gray-400 dark:text-gray-500'}`}>
          {label}
        </span>
      </button>
    );
  }

  return (
    <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[430px] bg-white dark:bg-gray-900 border-t border-gray-100 dark:border-gray-800 safe-bottom z-50">
      <div className="flex items-center justify-around px-2 pt-2 pb-3">
        {NAV_ITEMS.map(item => <NavBtn key={item.path} {...item} />)}

        {/* Centre Capture bubble */}
        <button
          data-tour="nav-capture"
          onClick={() => navigate('/capture')}
          className="flex flex-col items-center gap-0.5 -mt-5"
        >
          <div className="w-14 h-14 rounded-full bg-green-600 shadow-lg shadow-green-600/40 flex items-center justify-center">
            <Camera size={26} className="text-white" strokeWidth={2} />
          </div>
          <span className="text-[11px] font-medium text-gray-400 dark:text-gray-500 mt-0.5">Capture</span>
        </button>

        {RIGHT_ITEMS.map(item => <NavBtn key={item.path} {...item} />)}
      </div>
    </nav>
  );
}
