import { Link } from 'react-router-dom';
import { Brain, Grid3x3, Calendar, CalendarCheck, Crown, HelpCircle, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Cloud } from 'lucide-react';
import { ThemeSwitcher } from '@/components/ThemeSwitcher';
import { SyncStatusIndicator } from '@/components/sync/SyncStatusIndicator';
import { BrainDumpTrigger } from '@/components/brain-dump/BrainDumpTrigger';
import { Theme, CustomTheme } from '@/types';
import { useIsMobile } from '@/hooks/use-mobile';

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
  onOpenBrainDump: () => void;
  onThemeChange: (theme: Theme) => void;
  onCustomThemeClick: () => void;
  onEditCustomTheme: (theme?: CustomTheme, themeId?: string) => void;
  onApplyCustomTheme: (theme: CustomTheme) => void;
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
  onOpenBrainDump,
  onThemeChange,
  onCustomThemeClick,
  onEditCustomTheme,
  onApplyCustomTheme,
  onDeleteCustomTheme,
  onUseAsTemplate,
}: DashboardHeaderProps) {
  const isMobile = useIsMobile();

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
              {/* Desktop: Show all buttons */}
              {!isMobile && (
                <>
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
                </>
              )}

              {/* Brain Dump Trigger - Always visible */}
              <BrainDumpTrigger onClick={onOpenBrainDump} />

              {/* AI Assistant - Icon only on mobile, with text on desktop */}
              <Button
                variant="default"
                size={isMobile ? "icon" : "sm"}
                onClick={() => onSetChatPanelOpen(true)}
                className={isMobile ? "" : "gap-2"}
                title={isMobile ? "AI Assistant" : undefined}
                data-tutorial="ai-assistant"
              >
                <Brain className="h-4 w-4" />
                {!isMobile && "AI Assistant"}
              </Button>

              {/* Help button - Always visible */}
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onSetTutorialOpen(true)}
                title="Help & Tutorial"
                data-tutorial="timer-hub"
              >
                <HelpCircle className="h-5 w-5" />
              </Button>

              {/* Sync indicator - Always visible */}
              <SyncStatusIndicator />

              {/* Admin Panel - Hidden on mobile */}
              {user && isAdmin && !isMobile && (
                <Button variant="secondary" size="sm" asChild>
                  <Link to="/admin">Admin Panel</Link>
                </Button>
              )}

              {/* Upgrade/Settings/Sign In - Always visible but compact on mobile */}
              {user && !isPremium && (
                <Button variant="default" size={isMobile ? "icon" : "sm"} asChild title={isMobile ? "Upgrade to Premium" : undefined}>
                  <Link to="/pricing">
                    <Crown className="h-4 w-4" />
                    {!isMobile && <span className="ml-1">Upgrade</span>}
                  </Link>
                </Button>
              )}
              {user && isPremium && (
                <Button variant="outline" size={isMobile ? "icon" : "sm"} asChild title={isMobile ? "Settings" : undefined}>
                  <Link to="/settings">
                    {isMobile ? <Crown className="h-4 w-4" /> : "Settings"}
                  </Link>
                </Button>
              )}
              {!user && (
                <Button variant="outline" size="sm" asChild>
                  <Link to="/auth">{isMobile ? "Sign In" : "Sign In"}</Link>
                </Button>
              )}

              {/* Theme switcher - Hidden on mobile */}
              {!isMobile && (
                <ThemeSwitcher
                  currentTheme={theme}
                  currentCustomTheme={customTheme}
                  onThemeChange={onThemeChange}
                  onCustomThemeClick={onCustomThemeClick}
                  onEditCustomTheme={onEditCustomTheme}
                  onApplyCustomTheme={onApplyCustomTheme}
                  onDeleteCustomTheme={onDeleteCustomTheme}
                  onUseAsTemplate={onUseAsTemplate}
                />
              )}
            </div>
          </div>
        </div>
      </header>
    </>
  );
}