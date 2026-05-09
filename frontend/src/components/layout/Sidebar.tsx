import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  BookOpen,
  BarChart3,
  FlaskConical,
  Settings,
  TrendingUp,
  LogOut,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';

const nav = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/journal', icon: BookOpen, label: 'Journal' },
  { to: '/analytics', icon: BarChart3, label: 'Analytics' },
  { to: '/backtest', icon: FlaskConical, label: 'Backtest' },
  { to: '/settings', icon: Settings, label: 'Settings' },
];

export function Sidebar() {
  const { user, logout } = useAuth();

  return (
    <aside className="fixed left-0 top-0 h-screen w-16 xl:w-56 bg-surface-1 border-r border-border flex flex-col z-40">
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 h-16 border-b border-border shrink-0">
        <div className="w-8 h-8 rounded-lg bg-accent flex items-center justify-center shrink-0">
          <TrendingUp className="h-4 w-4 text-white" />
        </div>
        <span className="hidden xl:block font-semibold text-zinc-100 text-sm tracking-wide">
          TradingLog
        </span>
      </div>

      {/* Nav links */}
      <nav className="flex-1 px-2 py-4 flex flex-col gap-1 overflow-y-auto">
        {nav.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors',
                isActive
                  ? 'bg-accent-muted text-accent font-medium'
                  : 'text-zinc-500 hover:text-zinc-100 hover:bg-surface-3'
              )
            }
          >
            <Icon className="h-4 w-4 shrink-0" />
            <span className="hidden xl:block">{label}</span>
          </NavLink>
        ))}
      </nav>

      {/* User */}
      <div className="px-2 py-3 border-t border-border">
        <div className="flex items-center gap-3 px-3 py-2">
          <div className="w-7 h-7 rounded-full bg-accent/20 text-accent flex items-center justify-center text-xs font-semibold shrink-0">
            {(user?.displayName ?? user?.email ?? '?')[0].toUpperCase()}
          </div>
          <div className="hidden xl:block flex-1 min-w-0">
            <p className="text-xs font-medium text-zinc-200 truncate">
              {user?.displayName ?? user?.email}
            </p>
            <p className="text-xs text-zinc-500 truncate">{user?.email}</p>
          </div>
          <button
            onClick={logout}
            className="hidden xl:block text-zinc-500 hover:text-zinc-100 transition-colors ml-auto"
            title="Sign out"
          >
            <LogOut className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </aside>
  );
}
