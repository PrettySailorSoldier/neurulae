import { useState, useEffect } from 'react';
import { SunlightAnchorWidget as SunlightAnchorWidgetType } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Settings, Trash2, Sun, Moon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SunlightAnchorWidgetProps {
  widget: SunlightAnchorWidgetType;
  onEdit: () => void;
  onDelete: () => void;
}

type TimeOfDay = 'morning' | 'midday' | 'golden' | 'night';

export function SunlightAnchorWidget({ widget, onEdit, onDelete }: SunlightAnchorWidgetProps) {
  const [timeOfDay, setTimeOfDay] = useState<TimeOfDay>('midday');
  const [celestialPosition, setCelestialPosition] = useState(50);

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const hour = now.getHours();
      const minutes = now.getMinutes();
      
      let period: TimeOfDay;
      let position: number;
      
      if (hour >= 6 && hour < 11) {
        period = 'morning';
        // 6am-11am: position from 10% to 40%
        const progress = (hour - 6 + minutes / 60) / 5;
        position = 10 + progress * 30;
      } else if (hour >= 11 && hour < 16) {
        period = 'midday';
        // 11am-4pm: position from 40% to 70%
        const progress = (hour - 11 + minutes / 60) / 5;
        position = 40 + progress * 30;
      } else if (hour >= 16 && hour < 19) {
        period = 'golden';
        // 4pm-7pm: position from 70% to 90%
        const progress = (hour - 16 + minutes / 60) / 3;
        position = 70 + progress * 20;
      } else {
        period = 'night';
        // Night: moon travels 10% to 90%
        if (hour >= 19) {
          const progress = (hour - 19 + minutes / 60) / 11;
          position = 10 + progress * 80;
        } else {
          const progress = (hour + minutes / 60) / 6;
          position = 10 + progress * 80;
        }
      }
      
      setTimeOfDay(period);
      setCelestialPosition(position);
    };

    updateTime();
    const interval = setInterval(updateTime, 60000); // Update every minute

    return () => clearInterval(interval);
  }, []);

  const gradientClasses = {
    morning: 'from-sky-300 via-amber-200 to-orange-200',
    midday: 'from-sky-400 to-blue-500',
    golden: 'from-orange-400 via-pink-500 to-purple-600',
    night: 'from-indigo-900 via-purple-900 to-slate-950',
  };

  const labels = {
    morning: 'Morning vibes ✨',
    midday: 'Midday energy ☀️',
    golden: 'Golden hour 🌅',
    night: 'Night time 🌙',
  };

  const isNight = timeOfDay === 'night';

  return (
    <Card className={cn(
      'border-0 rounded-2xl overflow-hidden transition-all duration-1000',
      'bg-gradient-to-br',
      gradientClasses[timeOfDay]
    )}>
      <CardHeader className="flex flex-row items-center justify-between pb-3 relative z-10">
        <CardTitle className="text-lg font-semibold text-white drop-shadow-lg">
          {widget.title}
        </CardTitle>
        <div className="flex gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={onEdit}
            className="h-8 w-8 text-white/80 hover:text-white hover:bg-white/10"
          >
            <Settings className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={onDelete}
            className="h-8 w-8 text-white/80 hover:text-red-400 hover:bg-red-950/30"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="relative h-32">
        {/* Celestial body */}
        <div
          className="absolute top-1/2 -translate-y-1/2 transition-all duration-1000 ease-in-out animate-sun-float"
          style={{ left: `${celestialPosition}%`, transform: `translate(-50%, -50%)` }}
        >
          {isNight ? (
            <Moon className="h-12 w-12 text-yellow-100 drop-shadow-[0_0_20px_rgba(255,255,255,0.5)]" />
          ) : (
            <Sun className="h-12 w-12 text-yellow-200 drop-shadow-[0_0_30px_rgba(255,215,0,0.8)]" />
          )}
        </div>

        {/* Time label */}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2">
          <p className="text-white font-medium text-sm drop-shadow-lg">
            {labels[timeOfDay]}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
