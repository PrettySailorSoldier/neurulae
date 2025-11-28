import { useEffect } from 'react';
import { PotionInventoryWidget as PotionInventoryWidgetType } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Settings, Trash2, Heart, Droplet, Moon } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface PotionInventoryWidgetProps {
  widget: PotionInventoryWidgetType;
  onEdit: () => void;
  onDelete: () => void;
  onUpdateLevels: (updates: Partial<Pick<PotionInventoryWidgetType, 'healthLevel' | 'manaLevel' | 'staminaLevel' | 'lastDecayTime'>>) => void;
}

export function PotionInventoryWidget({ widget, onEdit, onDelete, onUpdateLevels }: PotionInventoryWidgetProps) {
  
  // Decay mechanic - runs every 5 seconds if enabled
  useEffect(() => {
    if (!widget.decayEnabled) return;
    
    const interval = setInterval(() => {
      onUpdateLevels({
        healthLevel: Math.max(0, widget.healthLevel - 10),
        manaLevel: Math.max(0, widget.manaLevel - 10),
        staminaLevel: Math.max(0, widget.staminaLevel - 10),
        lastDecayTime: new Date().toISOString(),
      });
    }, 5000);

    return () => clearInterval(interval);
  }, [widget.healthLevel, widget.manaLevel, widget.staminaLevel, widget.decayEnabled, onUpdateLevels]);

  const refillHealth = () => {
    onUpdateLevels({ healthLevel: 100 });
  };

  const refillMana = () => {
    onUpdateLevels({ manaLevel: 100 });
  };

  const refillStamina = () => {
    onUpdateLevels({ staminaLevel: 100 });
  };

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
        {/* Health Bar */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Heart className="h-4 w-4 text-red-400" />
              <span className="text-sm font-medium text-red-300">Health</span>
            </div>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    size="sm"
                    onClick={refillHealth}
                    className="h-8 w-8 p-0 bg-red-600/20 hover:bg-red-600/40 border border-red-500/50 rounded-lg animate-pulse-glow"
                  >
                    <span className="text-lg">🧪</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Refill Health</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          <div className="relative h-6 bg-slate-800 rounded-full overflow-hidden border border-red-900/50">
            <div
              className="absolute inset-0 bg-gradient-to-r from-red-600 to-red-500 transition-all duration-500 ease-out"
              style={{ width: `${widget.healthLevel}%` }}
            />
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-xs font-bold text-white drop-shadow-lg">
                {widget.healthLevel}%
              </span>
            </div>
          </div>
        </div>

        {/* Mana Bar */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Droplet className="h-4 w-4 text-blue-400" />
              <span className="text-sm font-medium text-blue-300">Mana</span>
            </div>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    size="sm"
                    onClick={refillMana}
                    className="h-8 w-8 p-0 bg-blue-600/20 hover:bg-blue-600/40 border border-blue-500/50 rounded-lg animate-pulse-glow"
                  >
                    <span className="text-lg">🧪</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Refill Mana</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          <div className="relative h-6 bg-slate-800 rounded-full overflow-hidden border border-blue-900/50">
            <div
              className="absolute inset-0 bg-gradient-to-r from-blue-600 to-blue-500 transition-all duration-500 ease-out"
              style={{ width: `${widget.manaLevel}%` }}
            />
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-xs font-bold text-white drop-shadow-lg">
                {widget.manaLevel}%
              </span>
            </div>
          </div>
        </div>

        {/* Stamina Bar */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Moon className="h-4 w-4 text-green-400" />
              <span className="text-sm font-medium text-green-300">Stamina</span>
            </div>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    size="sm"
                    onClick={refillStamina}
                    className="h-8 w-8 p-0 bg-green-600/20 hover:bg-green-600/40 border border-green-500/50 rounded-lg animate-pulse-glow"
                  >
                    <span className="text-lg">🧪</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Refill Stamina</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          <div className="relative h-6 bg-slate-800 rounded-full overflow-hidden border border-green-900/50">
            <div
              className="absolute inset-0 bg-gradient-to-r from-green-600 to-green-500 transition-all duration-500 ease-out"
              style={{ width: `${widget.staminaLevel}%` }}
            />
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-xs font-bold text-white drop-shadow-lg">
                {widget.staminaLevel}%
              </span>
            </div>
          </div>
        </div>

        {widget.decayEnabled && (
          <p className="text-xs text-amber-400/70 text-center pt-2">
            ⚠️ Bars decay by 10% every 5 seconds (demo mode)
          </p>
        )}
      </CardContent>
    </Card>
  );
}
