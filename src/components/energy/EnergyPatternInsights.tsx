import { useEnergyTemplates } from '@/hooks/useEnergyTemplates';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, TrendingDown, Minus, Battery } from 'lucide-react';
import { cn } from '@/lib/utils';

export function EnergyPatternInsights() {
  const { energyPatterns, checkIns } = useEnergyTemplates();
  
  if (checkIns.length < 3) {
    return (
      <Card className="border-l-4 border-l-purple-500 bg-card/50">
        <CardHeader className="pb-2 pt-3 px-4">
          <CardTitle className="text-sm flex items-center gap-2 font-medium">
            <Battery className="h-4 w-4 text-purple-500" />
            Energy Insights
          </CardTitle>
        </CardHeader>
        <CardContent className="px-4 pb-3">
          <p className="text-xs text-muted-foreground">
            Track your energy for a few days to see patterns
          </p>
        </CardContent>
      </Card>
    );
  }
  
  const TrendIcon = {
    improving: TrendingUp,
    stable: Minus,
    declining: TrendingDown,
  }[energyPatterns.trend];
  
  const trendColor = {
    improving: 'text-green-600',
    stable: 'text-blue-600',
    declining: 'text-amber-600',
  }[energyPatterns.trend];
  
  const getLevelColor = (level: string) => {
    switch (level) {
      case 'high': return 'text-green-600';
      case 'average': return 'text-blue-600';
      case 'low': return 'text-amber-600';
      default: return 'text-muted-foreground';
    }
  };
  
  return (
    <Card className="border-l-4 border-l-purple-500 bg-card/50">
      <CardHeader className="pb-2 pt-3 px-4">
        <CardTitle className="text-sm flex items-center gap-2 font-medium">
          <Battery className="h-4 w-4 text-purple-500" />
          Your Energy Patterns
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 px-4 pb-3">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <p className="text-xs text-muted-foreground">Most common</p>
            <p className={cn("text-sm font-medium capitalize", getLevelColor(energyPatterns.averageLevel))}>
              {energyPatterns.averageLevel}
            </p>
          </div>
          
          <div>
            <p className="text-xs text-muted-foreground">Morning typical</p>
            <p className={cn("text-sm font-medium capitalize", getLevelColor(energyPatterns.morningPattern))}>
              {energyPatterns.morningPattern}
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-2 pt-2 border-t">
          <TrendIcon className={cn("h-4 w-4", trendColor)} />
          <span className="text-xs">
            Energy trend: <strong className="capitalize">{energyPatterns.trend}</strong>
          </span>
        </div>
        
        <div className="text-xs text-muted-foreground flex gap-4">
          <span>
            Weekdays: <span className={cn("capitalize font-medium", getLevelColor(energyPatterns.weekdayPattern))}>
              {energyPatterns.weekdayPattern}
            </span>
          </span>
          <span>
            Weekends: <span className={cn("capitalize font-medium", getLevelColor(energyPatterns.weekendPattern))}>
              {energyPatterns.weekendPattern}
            </span>
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
