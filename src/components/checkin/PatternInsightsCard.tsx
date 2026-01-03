import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { useCheckIns } from '@/hooks/useCheckIns';
import {
  TrendingUp,
  TrendingDown,
  Minus,
  Battery,
  ThumbsUp,
  ThumbsDown,
  Sparkles,
  Calendar,
  ChevronRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface PatternInsightsCardProps {
  onOpenCheckIn?: () => void;
  className?: string;
}

export function PatternInsightsCard({ onOpenCheckIn, className }: PatternInsightsCardProps) {
  const { patterns, recentCheckIns, shouldPromptDaily, todaysCheckIn } = useCheckIns();

  // Not enough data
  if (!patterns || recentCheckIns.length < 3) {
    return (
      <Card className={cn('', className)}>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            <CardTitle className="text-lg">Pattern Insights</CardTitle>
          </div>
          <CardDescription>
            Complete a few more check-ins to see your patterns
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-6">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
              <TrendingUp className="w-8 h-8 text-primary" />
            </div>
            <p className="text-sm text-muted-foreground mb-4">
              {recentCheckIns.length}/3 check-ins this week
            </p>
            <Progress value={(recentCheckIns.length / 3) * 100} className="h-2 mb-4" />
            {onOpenCheckIn && (
              <Button onClick={onOpenCheckIn} variant="outline" className="gap-2">
                <Calendar className="w-4 h-4" />
                Start Check-In
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  const getTrendIcon = () => {
    switch (patterns.feelingTrend) {
      case 'positive': return <TrendingUp className="w-4 h-4 text-green-500" />;
      case 'negative': return <TrendingDown className="w-4 h-4 text-red-500" />;
      default: return <Minus className="w-4 h-4 text-yellow-500" />;
    }
  };

  const getTrendLabel = () => {
    switch (patterns.feelingTrend) {
      case 'positive': return 'Trending up';
      case 'negative': return 'Needs attention';
      default: return 'Steady';
    }
  };

  const getEnergyColor = () => {
    if (patterns.avgEnergy >= 7) return 'text-green-500';
    if (patterns.avgEnergy >= 4) return 'text-yellow-500';
    return 'text-red-500';
  };

  return (
    <Card className={cn('', className)}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            <CardTitle className="text-lg">Pattern Insights</CardTitle>
          </div>
          <Badge variant="outline" className="text-xs">
            {patterns.checkInCount} check-ins
          </Badge>
        </div>
        <CardDescription className="flex items-center gap-1">
          {getTrendIcon()}
          {getTrendLabel()} this week
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Energy Level */}
        <div className="flex items-center justify-between p-3 bg-accent/30 rounded-lg">
          <div className="flex items-center gap-2">
            <Battery className={cn('w-5 h-5', getEnergyColor())} />
            <span className="text-sm">Average Energy</span>
          </div>
          <span className={cn('font-bold text-lg', getEnergyColor())}>
            {patterns.avgEnergy}/10
          </span>
        </div>

        {/* Top Wins */}
        {patterns.topWins.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm">
              <ThumbsUp className="w-4 h-4 text-green-500" />
              <span className="font-medium">Your strengths</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {patterns.topWins.map((win, i) => (
                <Badge key={i} variant="secondary" className="bg-green-500/10 text-green-700">
                  {win}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Top Struggles */}
        {patterns.topStruggles.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm">
              <ThumbsDown className="w-4 h-4 text-red-500" />
              <span className="font-medium">Areas to address</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {patterns.topStruggles.map((struggle, i) => (
                <Badge key={i} variant="secondary" className="bg-red-500/10 text-red-700">
                  {struggle}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Check-in prompt */}
        {shouldPromptDaily && !todaysCheckIn && onOpenCheckIn && (
          <Button onClick={onOpenCheckIn} className="w-full gap-2" variant="outline">
            <Calendar className="w-4 h-4" />
            Complete Today's Check-In
            <ChevronRight className="w-4 h-4 ml-auto" />
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

export default PatternInsightsCard;
