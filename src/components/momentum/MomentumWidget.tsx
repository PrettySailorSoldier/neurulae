import { useMomentumBuilder } from '@/hooks/useMomentumBuilder';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Flame, Zap, Leaf, Timer, Sparkles, Trophy } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { useState, useEffect } from 'react';

interface MomentumWidgetProps {
  sessionMinutes?: number;
  compact?: boolean;
}

export function MomentumWidget({ sessionMinutes = 0, compact = false }: MomentumWidgetProps) {
  const { state, getSuggestion, recordWin, skipSuggestion, getStreakStatus } = useMomentumBuilder();
  const [suggestion, setSuggestion] = useState(getSuggestion(sessionMinutes));
  const [isAnimating, setIsAnimating] = useState(false);

  // Update suggestion when session changes
  useEffect(() => {
    setSuggestion(getSuggestion(sessionMinutes));
  }, [sessionMinutes, getSuggestion]);

  // Icon based on momentum level
  const MomentumIcon = {
    cold: Leaf,
    warming: Timer,
    hot: Zap,
    blazing: Flame,
  }[state.momentumLevel];

  const momentumColors = {
    cold: 'text-slate-400',
    warming: 'text-blue-400',
    hot: 'text-orange-400',
    blazing: 'text-red-500',
  };

  const momentumBg = {
    cold: 'from-slate-500/10 to-slate-600/5',
    warming: 'from-blue-500/10 to-blue-600/5',
    hot: 'from-orange-500/10 to-orange-600/5',
    blazing: 'from-red-500/10 to-red-600/5',
  };

  const handleCompleteWin = () => {
    if (!suggestion) return;
    
    setIsAnimating(true);
    recordWin(suggestion.microWin);
    
    // Show celebration toast
    toast.success(suggestion.celebrationMessage, {
      description: 'Way to keep momentum going!',
      icon: <Trophy className="h-4 w-4 text-yellow-500" />,
    });
    
    // Reset after animation
    setTimeout(() => {
      setIsAnimating(false);
      setSuggestion(null);
    }, 500);
  };

  const handleSkip = () => {
    skipSuggestion();
    setSuggestion(null);
  };

  // Compact view - just shows status
  if (compact) {
    return (
      <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-gradient-to-r from-purple-500/10 to-purple-600/5 border border-purple-500/20">
        <MomentumIcon className={cn('h-3.5 w-3.5', momentumColors[state.momentumLevel])} />
        <span className="text-xs font-medium">{state.winsToday} wins</span>
        {state.currentStreak >= 2 && (
          <span className="text-xs text-orange-400">🔥 {state.currentStreak}</span>
        )}
      </div>
    );
  }

  // No suggestion - just show status card
  if (!suggestion) {
    return (
      <Card className={cn(
        'border-l-4 border-l-purple-500 overflow-hidden',
        'bg-gradient-to-br', momentumBg[state.momentumLevel]
      )}>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <MomentumIcon className={cn('h-4 w-4', momentumColors[state.momentumLevel])} />
            Momentum
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="flex items-end justify-between">
            <div>
              <p className="text-3xl font-bold tracking-tight">{state.winsToday}</p>
              <p className="text-xs text-muted-foreground">wins today</p>
            </div>
            <div className="text-right">
              <p className={cn('text-sm font-medium', momentumColors[state.momentumLevel])}>
                {getStreakStatus()}
              </p>
              {state.longestStreak > 0 && state.longestStreak > state.currentStreak && (
                <p className="text-xs text-muted-foreground">
                  Best: {state.longestStreak}
                </p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Show suggestion
  return (
    <Card className={cn(
      'border-l-4 border-l-purple-500 overflow-hidden',
      'bg-gradient-to-br from-purple-500/10 to-violet-600/5',
      isAnimating && 'animate-pulse'
    )}>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-purple-400 animate-pulse" />
          Quick Win Available!
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 pt-0">
        <div>
          <p className="text-xs text-muted-foreground mb-1">{suggestion.reason}</p>
          <p className="text-sm font-medium">{suggestion.microWin.action}</p>
          <p className="text-xs text-muted-foreground mt-1">
            {suggestion.microWin.durationSeconds}s • {suggestion.microWin.category}
          </p>
        </div>

        <div className="flex gap-2">
          <Button
            size="sm"
            onClick={handleCompleteWin}
            className="flex-1 bg-gradient-to-r from-purple-500 to-violet-600 hover:from-purple-600 hover:to-violet-700"
          >
            ✓ Done!
          </Button>
          <Button size="sm" variant="ghost" onClick={handleSkip}>
            Later
          </Button>
        </div>

        <div className="text-center pt-2 border-t border-purple-500/10">
          <p className="text-xs text-muted-foreground">
            {state.winsToday} wins today • {getStreakStatus()}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
