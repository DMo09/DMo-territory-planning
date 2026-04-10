import { Link, useLocation } from 'react-router-dom';
import { Settings, Home } from 'lucide-react';

const OsLogo = () => (
  <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="32" height="32" rx="4" fill="#E2001A"/>
    <text x="50%" y="50%" dominantBaseline="middle" textAnchor="middle" fill="white" fontSize="14" fontWeight="bold" fontFamily="Inter, sans-serif">OS</text>
  </svg>
);

const navItems = [
  { path: '/', label: 'Plans', icon: Home },
  { path: '/admin', label: 'Admin', icon: Settings },
];

export default function Layout({ children }: { children: React.ReactNode }) {
  const location = useLocation();

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      {/* Top nav */}
      <nav className="bg-os-navy border-b border-os-navy-surface sticky top-0 z-50">
        <div className="max-w-screen-2xl mx-auto px-4 flex items-center h-14 gap-6">
          <Link to="/" className="flex items-center gap-2.5 mr-4">
            <OsLogo />
            <span className="text-white font-semibold text-sm leading-tight">
              Territory<br />
              <span className="text-os-red font-bold">Planner</span>
            </span>
          </Link>

          <div className="flex items-center gap-1">
            {navItems.map(({ path, label, icon: Icon }) => (
              <Link
                key={path}
                to={path}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-sm font-medium transition-colors ${
                  location.pathname === path
                    ? 'bg-os-navy-surface text-white'
                    : 'text-gray-400 hover:text-white hover:bg-os-navy-light'
                }`}
              >
                <Icon size={14} />
                {label}
              </Link>
            ))}
          </div>

          <div className="ml-auto flex items-center gap-2">
            <span className="text-xs text-gray-500 bg-os-navy-surface px-2 py-0.5 rounded">
              OutSystems
            </span>
          </div>
        </div>
      </nav>

      {/* Page content */}
      <main className="flex-1">
        {children}
      </main>
    </div>
  );
}
