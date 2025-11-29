import { useState } from 'react';
import { Timer, ListTodo, Calendar } from 'lucide-react';
import { cn } from '@/lib/utils';

export type MobileTab = 'focus' | 'timeline' | 'tasks';

interface MobileTabBarProps {
  activeTab: MobileTab;
  onTabChange: (tab: MobileTab) => void;
}

export function MobileTabBar({ activeTab, onTabChange }: MobileTabBarProps) {
  const tabs = [
    { id: 'focus' as MobileTab, label: 'Focus', icon: Timer },
    { id: 'timeline' as MobileTab, label: 'Timeline', icon: Calendar },
    { id: 'tasks' as MobileTab, label: 'Tasks', icon: ListTodo },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-card/95 backdrop-blur-lg border-t border-border pb-[env(safe-area-inset-bottom)] md:hidden">
      <div className="flex justify-around items-center h-16">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={cn(
                "flex flex-col items-center justify-center flex-1 h-full gap-1 transition-colors",
                "min-w-[48px] min-h-[48px]",
                activeTab === tab.id
                  ? "text-primary" 
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Icon className="h-5 w-5" />
              <span className="text-xs">{tab.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
