import { Home, CheckSquare, Timer, Settings, MoreHorizontal } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';

interface MobileBottomNavProps {
  onNavigate?: (path: string) => void;
}

export function MobileBottomNav({ onNavigate }: MobileBottomNavProps) {
  const location = useLocation();
  
  const navItems = [
    { icon: Home, label: 'Dashboard', path: '/app', active: location.pathname === '/app' },
    { icon: CheckSquare, label: 'Availability', path: '/my-availability', active: location.pathname === '/my-availability' },
    { icon: Timer, label: 'Plan', path: '/my-plan', active: location.pathname === '/my-plan' },
    { icon: Settings, label: 'Settings', path: '/settings', active: location.pathname === '/settings' },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-card border-t border-border pb-[env(safe-area-inset-bottom)] md:hidden">
      <div className="flex justify-around items-center h-16">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.path}
              to={item.path}
              onClick={() => onNavigate?.(item.path)}
              className={cn(
                "flex flex-col items-center justify-center flex-1 h-full gap-1 transition-colors",
                "min-w-[48px] min-h-[48px]",
                item.active 
                  ? "text-primary" 
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Icon className="h-5 w-5" />
              <span className="text-xs">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
