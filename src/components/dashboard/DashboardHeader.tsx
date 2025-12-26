import { Link } from 'react-router-dom';
import { Brain, Grid3x3, Calendar, CalendarCheck, Crown, HelpCircle, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Cloud } from 'lucide-react';
import { ThemeSwitcher } from '@/components/ThemeSwitcher';
import { SyncStatusIndicator } from '@/components/sync/SyncStatusIndicator';
import { Theme, CustomTheme } from '@/types';

interface DashboardHeaderProps {
  user: any;
  isPremium: boolean;
  isAdmin: boolean;
  plan: string;
  theme: Theme;
  customTheme?: CustomTheme | null;
  showSyncBanner: boolean;
  onSetSyncBanner: (show: boolean) => void;
  onSetEisenhowerOpen: (open: boolean) => void;
  onSetChatPanelOpen: (open: boolean) => void;
  onSetTutorialOpen: (open: boolean) => void;
  onThemeChange: (theme: Theme) => void;
  onCustomThemeClick: () => void;
  onEditCustomTheme: (theme?: CustomTheme, themeId?: string) => void;
  onDeleteCustomTheme: () => void;
  onUseAsTemplate: (preset: 'orchid' | 'jellyfish' | 'sunset' | 'bluebonnet' | 'ocean' | 'forest' | 'midnight' | 'candy') => void;
}

export function DashboardHeader({
  user,
  isPremium,
  isAdmin,
  plan,
  theme,
  customTheme,
  showSyncBanner,
  onSetSyncBanner,
  onSetEisenhowerOpen,
  onSetChatPanelOpen,
  onSetTutorialOpen,
  onThemeChange,
  onCustomThemeClick,
  onEditCustomTheme,
  onDeleteCustomTheme,
  onUseAsTemplate,
}: DashboardHeaderProps) {
  return (
    <>
      {/* Sync Banner for non-authenticated users */}
      {!user && showSyncBanner && (
        <Alert className="rounded-none border-x-0 border-t-0">
          <Cloud className="h-4 w-4" />
          <AlertDescription className="flex items-center justify-between">
            <span>
              Sign in to sync your data across devices and never lose your work
            </span>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" asChild>
                <Link to="/auth">Sign In</Link>
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onSetSyncBanner(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Brain className="h-8 w-8 text-primary" />
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold">Neurulae</h1>
                {isPremium && !isAdmin && (
                  <Badge variant="default" className="gap-1">
                    <Crown className="h-3 w-3" />
                    {plan === 'lifetime' ? 'Lifetime' : 'Premium'}
                  </Badge>
                )}
                {isAdmin && (
                  <Badge variant="default" className="gap-1">
                    <Crown className="h-3 w-3" />
                    Admin
                  </Badge>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onSetEisenhowerOpen(true)}
                title="Priority Matrix"
                data-tutorial="eisenhower-matrix"
              >
                <Grid3x3 className="h-5 w-5" />
              </Button>
              <Link to="/my-schedule" data-tutorial="my-availability">
                <Button
                  variant="ghost"
                  size="icon"
                  title="My Schedule"
                >
                  <Calendar className="h-5 w-5" />
                </Button>
              </Link>
              <Link to="/my-plan" data-tutorial="my-plan">
                <Button
                  variant="ghost"
                  size="icon"
                  title="My Plan"
                >
                  <CalendarCheck className="h-5 w-5" />
                </Button>
              </Link>
              <Button
                variant="default"
                size="sm"
                onClick={() => onSetChatPanelOpen(true)}
                className="gap-2"
                data-tutorial="ai-assistant"
              >
                <Brain className="h-4 w-4" />
                AI Assistant
              </Button>
              <Button 
                variant="ghost" 
                size="icon"
                onClick={() => onSetTutorialOpen(true)}
                title="Help & Tutorial"
                data-tutorial="timer-hub"
              >
                <HelpCircle className="h-5 w-5" />
              </Button>
              <SyncStatusIndicator />
              {user && isAdmin && (
                <Button variant="secondary" size="sm" asChild>
                  <Link to="/admin">Admin Panel</Link>
                </Button>
              )}
              {user && !isPremium && (
                <Button variant="default" size="sm" asChild>
                  <Link to="/pricing">
                    <Crown className="h-4 w-4 mr-1" />
                    Upgrade
                  </Link>
                </Button>
              )}
              {user && isPremium && (
                <Button variant="outline" size="sm" asChild>
                  <Link to="/settings">Settings</Link>
                </Button>
              )}
              {!user && (
                <Button variant="outline" size="sm" asChild>
                  <Link to="/auth">Sign In</Link>
                </Button>
              )}
              <ThemeSwitcher
                currentTheme={theme}
                currentCustomTheme={customTheme}
                onThemeChange={onThemeChange}
                onCustomThemeClick={onCustomThemeClick}
                onEditCustomTheme={onEditCustomTheme}
                onDeleteCustomTheme={onDeleteCustomTheme}
                onUseAsTemplate={onUseAsTemplate}
              />
            </div>
          </div>
        </div>
      </header>
    </>
  );
}