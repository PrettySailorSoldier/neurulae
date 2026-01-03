import { useState, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { useSyncedStorage } from '@/hooks/useSyncedStorage';
import {
  Battery,
  BatteryLow,
  BatteryMedium,
  BatteryFull,
  Zap,
  TrendingUp,
  TrendingDown,
  ArrowRight,
  Sparkles,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface EnergyLog {
  timestamp: string;
  level: number;
  note?: string;
}

interface EnergyCheckWidgetProps {
  onEnergyChange?: (energy: number) => void;
  className?: string;
  compact?: boolean;
}

const ENERGY_LABELS = [
  { min: 1, max: 2, label: 'Running on empty', icon: BatteryLow, color: 'text-red-500', bg: 'bg-red-500' },
  { min: 3, max: 4, label: 'Low energy', icon: BatteryLow, color: 'text-orange-500', bg: 'bg-orange-500' },
  { min: 5, max: 6, label: 'Moderate', icon: BatteryMedium, color: 'text-yellow-500', bg: 'bg-yellow-500' },
  { min: 7, max: 8, label: 'Good energy', icon: BatteryFull, color: 'text-green-500', bg: 'bg-green-500' },
  { min: 9, max: 10, label: 'Fully charged', icon: Zap, color: 'text-emerald-500', bg: 'bg-emerald-500' },
];

const ENERGY_SUGGESTIONS = {
  low: [
    'Use your low-energy routine variants',
    'Do one small thing, then rest',
    'It\'s okay to postpone if needed',
    'Consider a quick 10-minute nap',
  ],
  medium: [
    'Good time for routine tasks',
    'Start with your most important task',
    'Take breaks every 25-30 minutes',
    'Stay hydrated and stretch',
  ],
  high: [
    'Tackle your hardest tasks now',
    'Great time for creative work',
    'Batch similar tasks together',
    'Set ambitious but achievable goals',
  ],
};

export function EnergyCheckWidget({
  onEnergyChange,
  className,
  compact = false,
}: EnergyCheckWidgetProps) {
  const [energyLogs, setEnergyLogs] = useSyncedStorage<EnergyLog[]>('neurulae-energy-logs', []);
  const [currentEnergy, setCurrentEnergy] = useState(() => {
    // Get last logged energy or default to 5
    const today = new Date().toISOString().split('T')[0];
    const todayLog = energyLogs.find(log => log.timestamp.startsWith(today));
    return todayLog?.level ?? 5;
  });
  const [isExpanded, setIsExpanded] = useState(false);

  const getEnergyInfo = useCallback((level: number) => {
    return ENERGY_LABELS.find(e => level >= e.min && level <= e.max) || ENERGY_LABELS[2];
  }, []);

  const energyInfo = getEnergyInfo(currentEnergy);
  const EnergyIcon = energyInfo.icon;

  const handleEnergyChange = (value: number[]) => {
    const newEnergy = value[0];
    setCurrentEnergy(newEnergy);
    onEnergyChange?.(newEnergy);
  };

  const logEnergy = () => {
    const newLog: EnergyLog = {
      timestamp: new Date().toISOString(),
      level: currentEnergy,
    };
    
    setEnergyLogs(prev => {
      // Keep only last 30 days of logs
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const filtered = prev.filter(log => new Date(log.timestamp) >= thirtyDaysAgo);
      return [...filtered, newLog];
    });
  };

  const getTrend = () => {
    if (energyLogs.length < 2) return null;
    
    const recent = energyLogs.slice(-7);
    if (recent.length < 2) return null;
    
    const firstHalf = recent.slice(0, Math.floor(recent.length / 2));
    const secondHalf = recent.slice(Math.floor(recent.length / 2));
    
    const firstAvg = firstHalf.reduce((a, b) => a + b.level, 0) / firstHalf.length;
    const secondAvg = secondHalf.reduce((a, b) => a + b.level, 0) / secondHalf.length;
    
    if (secondAvg - firstAvg > 1) return 'up';
    if (firstAvg - secondAvg > 1) return 'down';
    return 'stable';
  };

  const trend = getTrend();

  const getSuggestions = () => {
    if (currentEnergy <= 4) return ENERGY_SUGGESTIONS.low;
    if (currentEnergy <= 7) return ENERGY_SUGGESTIONS.medium;
    return ENERGY_SUGGESTIONS.high;
  };

  if (compact) {
    return (
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className={cn(
          'flex items-center gap-2 px-3 py-2 rounded-lg bg-accent/50 hover:bg-accent transition-colors',
          className
        )}
      >
        <EnergyIcon className={cn('w-4 h-4', energyInfo.color)} />
        <span className="text-sm font-medium">{currentEnergy}/10</span>
        {trend === 'up' && <TrendingUp className="w-3 h-3 text-green-500" />}
        {trend === 'down' && <TrendingDown className="w-3 h-3 text-red-500" />}
      </button>
    );
  }

  return (
    <Card className={cn('', className)}>
      <CardContent className="p-4 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className={cn(
              'w-10 h-10 rounded-full flex items-center justify-center',
              'bg-gradient-to-br from-primary/20 to-accent/20'
            )}>
              <EnergyIcon className={cn('w-5 h-5', energyInfo.color)} />
            </div>
            <div>
              <p className="font-medium text-sm">Energy Check</p>
              <p className={cn('text-xs', energyInfo.color)}>{energyInfo.label}</p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <span className={cn('text-2xl font-bold', energyInfo.color)}>
              {currentEnergy}
            </span>
            <span className="text-muted-foreground">/10</span>
            {trend && (
              <Badge variant="outline" className="ml-2">
                {trend === 'up' && <TrendingUp className="w-3 h-3 mr-1 text-green-500" />}
                {trend === 'down' && <TrendingDown className="w-3 h-3 mr-1 text-red-500" />}
                {trend === 'up' ? 'Rising' : trend === 'down' ? 'Falling' : 'Stable'}
              </Badge>
            )}
          </div>
        </div>

        {/* Slider */}
        <div className="space-y-2">
          <Slider
            value={[currentEnergy]}
            onValueChange={handleEnergyChange}
            min={1}
            max={10}
            step={1}
            className="w-full"
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>🪫 Exhausted</span>
            <span>🔋 Full power</span>
          </div>
        </div>

        {/* Energy bar visualization */}
        <div className="flex gap-0.5">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((level) => (
            <div
              key={level}
              className={cn(
                'h-2 flex-1 rounded-full transition-colors',
                level <= currentEnergy
                  ? getEnergyInfo(level).bg
                  : 'bg-muted'
              )}
            />
          ))}
        </div>

        {/* Suggestions */}
        <div className="space-y-2">
          <p className="text-xs text-muted-foreground flex items-center gap-1">
            <Sparkles className="w-3 h-3" />
            Based on your energy:
          </p>
          <div className="text-sm p-2 bg-accent/30 rounded-lg">
            {getSuggestions()[0]}
          </div>
        </div>

        {/* Log button */}
        <Button
          variant="outline"
          size="sm"
          className="w-full"
          onClick={logEnergy}
        >
          <Battery className="w-4 h-4 mr-2" />
          Log Energy Level
        </Button>
      </CardContent>
    </Card>
  );
}

export default EnergyCheckWidget;
