import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Pipette, Palette, Plus, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ColorPickerProps {
  label: string;
  value: string; // HSL format: "262 83% 58%"
  onChange: (value: string) => void;
  className?: string;
}

interface HSL {
  h: number; // 0-360
  s: number; // 0-100
  l: number; // 0-100
}

const parseHSL = (hsl: string): HSL => {
  const parts = hsl.trim().split(/\s+/);
  return {
    h: parseFloat(parts[0]) || 0,
    s: parseFloat(parts[1]) || 0,
    l: parseFloat(parts[2]) || 0,
  };
};

const formatHSL = (hsl: HSL): string => {
  return `${Math.round(hsl.h)} ${Math.round(hsl.s)}% ${Math.round(hsl.l)}%`;
};

const hslToHex = (h: number, s: number, l: number): string => {
  l /= 100;
  const a = s * Math.min(l, 1 - l) / 100;
  const f = (n: number) => {
    const k = (n + h / 30) % 12;
    const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
    return Math.round(255 * color).toString(16).padStart(2, '0');
  };
  return `#${f(0)}${f(8)}${f(4)}`;
};

const hexToHSL = (hex: string): HSL => {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0, s = 0, l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
      case g: h = ((b - r) / d + 2) / 6; break;
      case b: h = ((r - g) / d + 4) / 6; break;
    }
  }

  return {
    h: Math.round(h * 360),
    s: Math.round(s * 100),
    l: Math.round(l * 100)
  };
};

const SAVED_COLORS_KEY = 'neurulae-saved-colors';

export function ColorPicker({ label, value, onChange, className }: ColorPickerProps) {
  const [hsl, setHSL] = useState<HSL>(parseHSL(value));
  const [savedColors, setSavedColors] = useState<string[]>([]);
  const [recentColors, setRecentColors] = useState<string[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [initialValue, setInitialValue] = useState(value);

  useEffect(() => {
    const saved = localStorage.getItem(SAVED_COLORS_KEY);
    if (saved) {
      setSavedColors(JSON.parse(saved));
    }
  }, []);

  useEffect(() => {
    setHSL(parseHSL(value));
  }, [value]);

  const updateColor = (newHSL: Partial<HSL>) => {
    const updated = { ...hsl, ...newHSL };
    setHSL(updated);
    const formatted = formatHSL(updated);
    onChange(formatted);
  };

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    
    if (open) {
      // Store initial value when opening
      setInitialValue(value);
    } else {
      // Add to recent colors only when closing, if color changed
      const currentColor = formatHSL(hsl);
      if (currentColor !== initialValue) {
        setRecentColors(prev => {
          const filtered = prev.filter(c => c !== currentColor);
          return [currentColor, ...filtered].slice(0, 8);
        });
      }
    }
  };

  const handleEyeDropper = async () => {
    if ('EyeDropper' in window) {
      try {
        const eyeDropper = new (window as any).EyeDropper();
        const result = await eyeDropper.open();
        const newHSL = hexToHSL(result.sRGBHex);
        updateColor(newHSL);
      } catch (err) {
        console.log('Eye dropper cancelled or not supported');
      }
    } else {
      alert('Eye dropper not supported in this browser. Try Chrome or Edge.');
    }
  };

  const saveColor = () => {
    const currentColor = formatHSL(hsl);
    if (!savedColors.includes(currentColor)) {
      const updated = [...savedColors, currentColor];
      setSavedColors(updated);
      localStorage.setItem(SAVED_COLORS_KEY, JSON.stringify(updated));
    }
  };

  const removeSavedColor = (color: string) => {
    const updated = savedColors.filter(c => c !== color);
    setSavedColors(updated);
    localStorage.setItem(SAVED_COLORS_KEY, JSON.stringify(updated));
  };

  const currentHex = hslToHex(hsl.h, hsl.s, hsl.l);

  return (
    <div className={cn("space-y-2", className)}>
      <Label className="text-sm">{label}</Label>
      <Popover open={isOpen} onOpenChange={handleOpenChange}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className="w-full justify-start gap-3 h-auto py-2"
          >
            <div
              className="w-8 h-8 rounded border-2 border-border"
              style={{ backgroundColor: `hsl(${formatHSL(hsl)})` }}
            />
            <span className="font-mono text-xs flex-1 text-left">{formatHSL(hsl)}</span>
            <Palette className="w-4 h-4 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-80 p-4" align="start">
          <div className="space-y-4">
            {/* Color Preview */}
            <div className="flex items-center gap-3">
              <div
                className="w-16 h-16 rounded-lg border-2 border-border shadow-lg"
                style={{ backgroundColor: `hsl(${formatHSL(hsl)})` }}
              />
              <div className="flex-1 space-y-1">
                <div className="font-mono text-xs text-muted-foreground">HSL</div>
                <div className="font-mono text-sm font-semibold">{formatHSL(hsl)}</div>
                <div className="font-mono text-xs text-muted-foreground">{currentHex}</div>
              </div>
              <div className="flex flex-col gap-1">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleEyeDropper}
                  className="h-8 w-8 p-0"
                  title="Pick color from screen"
                >
                  <Pipette className="w-4 h-4" />
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={saveColor}
                  className="h-8 w-8 p-0"
                  title="Save to palette"
                >
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* HSL Sliders */}
            <div className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between text-xs">
                  <Label>Hue</Label>
                  <span className="font-mono text-muted-foreground">{Math.round(hsl.h)}°</span>
                </div>
                <Slider
                  value={[hsl.h]}
                  onValueChange={([h]) => updateColor({ h })}
                  max={360}
                  step={1}
                  className="[&_[role=slider]]:bg-white [&_[role=slider]]:border-2"
                  style={{
                    background: 'linear-gradient(to right, hsl(0, 100%, 50%), hsl(60, 100%, 50%), hsl(120, 100%, 50%), hsl(180, 100%, 50%), hsl(240, 100%, 50%), hsl(300, 100%, 50%), hsl(360, 100%, 50%))'
                  }}
                />
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-xs">
                  <Label>Saturation</Label>
                  <span className="font-mono text-muted-foreground">{Math.round(hsl.s)}%</span>
                </div>
                <Slider
                  value={[hsl.s]}
                  onValueChange={([s]) => updateColor({ s })}
                  max={100}
                  step={1}
                  className="[&_[role=slider]]:bg-white [&_[role=slider]]:border-2"
                  style={{
                    background: `linear-gradient(to right, hsl(${hsl.h}, 0%, ${hsl.l}%), hsl(${hsl.h}, 100%, ${hsl.l}%))`
                  }}
                />
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-xs">
                  <Label>Lightness</Label>
                  <span className="font-mono text-muted-foreground">{Math.round(hsl.l)}%</span>
                </div>
                <Slider
                  value={[hsl.l]}
                  onValueChange={([l]) => updateColor({ l })}
                  max={100}
                  step={1}
                  className="[&_[role=slider]]:bg-white [&_[role=slider]]:border-2"
                  style={{
                    background: `linear-gradient(to right, hsl(${hsl.h}, ${hsl.s}%, 0%), hsl(${hsl.h}, ${hsl.s}%, 50%), hsl(${hsl.h}, ${hsl.s}%, 100%))`
                  }}
                />
              </div>
            </div>

            {/* Recent Colors */}
            {recentColors.length > 0 && (
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">Recent</Label>
                <div className="grid grid-cols-8 gap-1">
                  {recentColors.map((color, idx) => (
                    <button
                      key={idx}
                      onClick={() => onChange(color)}
                      className="w-8 h-8 rounded border border-border hover:scale-110 transition-transform"
                      style={{ backgroundColor: `hsl(${color})` }}
                      title={color}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Saved Colors */}
            {savedColors.length > 0 && (
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">Saved Palette</Label>
                <div className="grid grid-cols-8 gap-1">
                  {savedColors.map((color, idx) => (
                    <div key={idx} className="relative group">
                      <button
                        onClick={() => onChange(color)}
                        className="w-8 h-8 rounded border border-border hover:scale-110 transition-transform"
                        style={{ backgroundColor: `hsl(${color})` }}
                        title={color}
                      />
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          removeSavedColor(color);
                        }}
                        className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-destructive text-destructive-foreground opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
