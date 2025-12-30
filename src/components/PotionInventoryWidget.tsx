import { useEffect, useMemo } from 'react';
import { PotionInventoryWidget as PotionInventoryWidgetType, MealSchedule } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Settings, Trash2, Utensils, Droplets, Moon } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface PotionInventoryWidgetProps {
  widget: PotionInventoryWidgetType;
  onEdit: () => void;
  onDelete: () => void;
  onUpdateLevels: (updates: Partial<PotionInventoryWidgetType>) => void;
}

// Default meal schedule (3 meals + 2 snacks)
const DEFAULT_SCHEDULE: MealSchedule = {
  breakfast: '07:30',
  morningSnack: '10:00',
  lunch: '12:30',
  afternoonSnack: '15:00',
  dinner: '18:30',
  bedtime: '22:00',
};

// Get time in minutes since midnight
const getMinutesSinceMidnight = (timeStr?: string): number => {
  if (!timeStr) return 0;
  const [hours, minutes] = timeStr.split(':').map(Number);
  return hours * 60 + minutes;
};

// Get current time as "HH:MM" string
const getCurrentTimeStr = (): string => {
  const now = new Date();
  return `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
};

// Calculate food level based on time since last meal and next meal
const calculateFoodLevel = (
  lastFoodTime: string,
  schedule: MealSchedule
): { level: number; nextMeal: string; nextMealName: string } => {
  const now = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();

  // Define meal times in order
  const meals = [
    { name: 'Breakfast', time: schedule.breakfast },
    { name: 'Morning Snack', time: schedule.morningSnack },
    { name: 'Lunch', time: schedule.lunch },
    { name: 'Afternoon Snack', time: schedule.afternoonSnack },
    { name: 'Dinner', time: schedule.dinner },
  ];

  const mealMinutes = meals.map(m => ({
    ...m,
    minutes: getMinutesSinceMidnight(m.time)
  }));

  // Find next upcoming meal
  let nextMeal = mealMinutes.find(m => m.minutes > currentMinutes);
  if (!nextMeal) {
    // After dinner, next is breakfast tomorrow
    nextMeal = { ...mealMinutes[0], name: 'Breakfast (tomorrow)' };
  }

  // Find previous meal
  let prevMeal = [...mealMinutes].reverse().find(m => m.minutes <= currentMinutes);
  if (!prevMeal) {
    // Before breakfast, previous was dinner yesterday
    prevMeal = mealMinutes[mealMinutes.length - 1];
  }

  // Calculate how much time has passed since last meal as percentage to next meal
  const lastMealMinutes = getMinutesSinceMidnight(lastFoodTime);
  const minutesSinceLastMeal = currentMinutes - lastMealMinutes;

  // If more than 4 hours since eating, level drops significantly
  // Each hour without food = ~15% drop, max decay at 6+ hours
  const hoursSinceFood = minutesSinceLastMeal / 60;
  let level = 100 - (hoursSinceFood * 15);
  level = Math.max(0, Math.min(100, level));

  return {
    level: Math.round(level),
    nextMeal: nextMeal.time,
    nextMealName: nextMeal.name,
  };
};

// Calculate water level (should drink every 1-2 hours while awake)
const calculateWaterLevel = (lastWaterTime: string): number => {
  const now = new Date();
  const lastDrink = new Date(lastWaterTime);
  const hoursSinceDrink = (now.getTime() - lastDrink.getTime()) / (1000 * 60 * 60);

  // Ideal: drink every 1-2 hours
  // Level drops ~30% per hour without water
  let level = 100 - (hoursSinceDrink * 30);
  return Math.max(0, Math.min(100, Math.round(level)));
};

// Calculate sleep/energy level based on hours since waking
const calculateSleepLevel = (wakeTime: string, bedtime: string): number => {
  const now = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  const wakeMinutes = getMinutesSinceMidnight(wakeTime);
  const bedMinutes = getMinutesSinceMidnight(bedtime);

  // Calculate hours awake
  let minutesAwake = currentMinutes - wakeMinutes;
  if (minutesAwake < 0) minutesAwake += 24 * 60; // Wrapped past midnight

  const hoursAwake = minutesAwake / 60;
  const totalAwakeHours = (bedMinutes - wakeMinutes) / 60;

  // Energy decreases throughout the day
  // Start at 100%, drop to ~20% by bedtime
  const decayRate = 80 / Math.max(totalAwakeHours, 1);
  let level = 100 - (hoursAwake * decayRate);

  return Math.max(0, Math.min(100, Math.round(level)));
};

// Get status message based on level
const getStatusMessage = (level: number, type: 'food' | 'water' | 'sleep'): string => {
  if (level >= 80) {
    return type === 'food' ? 'Well fed' : type === 'water' ? 'Hydrated' : 'Energized';
  } else if (level >= 50) {
    return type === 'food' ? 'Getting hungry' : type === 'water' ? 'Could use water' : 'Moderate energy';
  } else if (level >= 25) {
    return type === 'food' ? 'Hungry!' : type === 'water' ? 'Thirsty!' : 'Getting tired';
  } else {
    return type === 'food' ? 'Very hungry!' : type === 'water' ? 'Dehydrated!' : 'Exhausted!';
  }
};

// Get bar color based on level
const getBarColor = (level: number, baseColor: string): string => {
  if (level >= 50) return baseColor;
  if (level >= 25) return 'from-yellow-600 to-yellow-500';
  return 'from-red-600 to-red-500';
};

export function PotionInventoryWidget({ widget, onEdit, onDelete, onUpdateLevels }: PotionInventoryWidgetProps) {
  const schedule = widget.mealSchedule || DEFAULT_SCHEDULE;

  // Migration: convert legacy fields to new format
  useEffect(() => {
    if (widget.healthLevel !== undefined && widget.foodLevel === undefined) {
      onUpdateLevels({
        foodLevel: widget.healthLevel,
        waterLevel: widget.manaLevel || 100,
        sleepLevel: widget.staminaLevel || 100,
        lastFoodTime: new Date().toISOString(),
        lastWaterTime: new Date().toISOString(),
        lastSleepTime: new Date().toISOString(),
        wakeTime: '07:00',
        mealSchedule: DEFAULT_SCHEDULE,
        useCustomSchedule: false,
      });
    }
  }, []);

  // Calculate current levels
  const foodData = useMemo(() => {
    if (!widget.lastFoodTime) return { level: 100, nextMeal: '', nextMealName: '' };
    return calculateFoodLevel(
      new Date(widget.lastFoodTime).toTimeString().slice(0, 5),
      schedule
    );
  }, [widget.lastFoodTime, schedule]);

  const waterLevel = useMemo(() => {
    if (!widget.lastWaterTime) return 100;
    return calculateWaterLevel(widget.lastWaterTime);
  }, [widget.lastWaterTime]);

  const sleepLevel = useMemo(() => {
    const wake = widget.wakeTime || '07:00';
    const bed = schedule.bedtime || '22:00';
    return calculateSleepLevel(wake, bed);
  }, [widget.wakeTime, schedule.bedtime]);

  // Update levels periodically (every minute)
  useEffect(() => {
    if (!widget.decayEnabled) return;

    const interval = setInterval(() => {
      // Trigger re-render by updating a timestamp
      onUpdateLevels({
        // This forces recalculation
      });
    }, 60000);

    return () => clearInterval(interval);
  }, [widget.decayEnabled, onUpdateLevels]);

  const logMeal = () => {
    onUpdateLevels({
      lastFoodTime: new Date().toISOString(),
      foodLevel: 100,
    });
  };

  const logWater = () => {
    onUpdateLevels({
      lastWaterTime: new Date().toISOString(),
      waterLevel: 100,
    });
  };

  const logSleep = () => {
    // Mark as rested (just woke up)
    onUpdateLevels({
      wakeTime: getCurrentTimeStr(),
      lastSleepTime: new Date().toISOString(),
      sleepLevel: 100,
    });
  };

  const displayFoodLevel = widget.foodLevel ?? foodData.level;
  const displayWaterLevel = widget.waterLevel ?? waterLevel;
  const displaySleepLevel = widget.sleepLevel ?? sleepLevel;

  return (
    <Card className="bg-gradient-to-b from-slate-900 to-slate-950 border-2 border-amber-900/40 rounded-2xl shadow-xl">
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <CardTitle className="text-lg font-semibold text-amber-200 flex items-center gap-2">
          <span className="text-xl">🧪</span>
          {widget.title}
        </CardTitle>
        <div className="flex gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={onEdit}
            className="h-8 w-8 text-amber-300 hover:text-amber-100 hover:bg-amber-950/50"
          >
            <Settings className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={onDelete}
            className="h-8 w-8 text-amber-300 hover:text-red-400 hover:bg-red-950/50"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Food/Hunger Bar */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Utensils className="h-4 w-4 text-orange-400" />
              <span className="text-sm font-medium text-orange-300">Food</span>
              <span className="text-xs text-orange-400/60">
                ({getStatusMessage(displayFoodLevel, 'food')})
              </span>
            </div>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    size="sm"
                    onClick={logMeal}
                    className="h-8 px-3 bg-orange-600/20 hover:bg-orange-600/40 border border-orange-500/50 rounded-lg text-xs"
                  >
                    Log Meal
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>I just ate!</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          <div className="relative h-6 bg-slate-800 rounded-full overflow-hidden border border-orange-900/50">
            <div
              className={`absolute inset-0 bg-gradient-to-r ${getBarColor(displayFoodLevel, 'from-orange-600 to-orange-500')} transition-all duration-500 ease-out`}
              style={{ width: `${displayFoodLevel}%` }}
            />
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-xs font-bold text-white drop-shadow-lg">
                {displayFoodLevel}%
              </span>
            </div>
          </div>
          {foodData.nextMealName && (
            <p className="text-xs text-orange-400/60">
              Next: {foodData.nextMealName} at {foodData.nextMeal}
            </p>
          )}
        </div>

        {/* Water/Hydration Bar */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Droplets className="h-4 w-4 text-blue-400" />
              <span className="text-sm font-medium text-blue-300">Water</span>
              <span className="text-xs text-blue-400/60">
                ({getStatusMessage(displayWaterLevel, 'water')})
              </span>
            </div>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    size="sm"
                    onClick={logWater}
                    className="h-8 px-3 bg-blue-600/20 hover:bg-blue-600/40 border border-blue-500/50 rounded-lg text-xs"
                  >
                    Log Water
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>I just drank water!</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          <div className="relative h-6 bg-slate-800 rounded-full overflow-hidden border border-blue-900/50">
            <div
              className={`absolute inset-0 bg-gradient-to-r ${getBarColor(displayWaterLevel, 'from-blue-600 to-blue-500')} transition-all duration-500 ease-out`}
              style={{ width: `${displayWaterLevel}%` }}
            />
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-xs font-bold text-white drop-shadow-lg">
                {displayWaterLevel}%
              </span>
            </div>
          </div>
          <p className="text-xs text-blue-400/60">
            Aim to drink water every 1-2 hours
          </p>
        </div>

        {/* Sleep/Energy Bar */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Moon className="h-4 w-4 text-purple-400" />
              <span className="text-sm font-medium text-purple-300">Energy</span>
              <span className="text-xs text-purple-400/60">
                ({getStatusMessage(displaySleepLevel, 'sleep')})
              </span>
            </div>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    size="sm"
                    onClick={logSleep}
                    className="h-8 px-3 bg-purple-600/20 hover:bg-purple-600/40 border border-purple-500/50 rounded-lg text-xs"
                  >
                    Just Woke Up
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Reset energy (slept well!)</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          <div className="relative h-6 bg-slate-800 rounded-full overflow-hidden border border-purple-900/50">
            <div
              className={`absolute inset-0 bg-gradient-to-r ${getBarColor(displaySleepLevel, 'from-purple-600 to-purple-500')} transition-all duration-500 ease-out`}
              style={{ width: `${displaySleepLevel}%` }}
            />
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-xs font-bold text-white drop-shadow-lg">
                {displaySleepLevel}%
              </span>
            </div>
          </div>
          {widget.wakeTime && (
            <p className="text-xs text-purple-400/60">
              Awake since {widget.wakeTime} - bedtime at {schedule.bedtime}
            </p>
          )}
        </div>

        <p className="text-xs text-amber-400/50 text-center pt-2 border-t border-amber-900/30">
          Tap buttons to log meals, water, and sleep
        </p>
      </CardContent>
    </Card>
  );
}
