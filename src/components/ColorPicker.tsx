import { useState, useEffect, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Pipette, Palette, Plus, X, Copy, Check, RotateCcw, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

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

const hslToRGB = (h: number, s: number, l: number): { r: number; g: number; b: number } => {
  s /= 100;
  l /= 100;
  const a = s * Math.min(l, 1 - l);
  const f = (n: number) => {
    const k = (n + h / 30) % 12;
    return Math.round(255 * (l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1)));
  };
  return { r: f(0), g: f(8), b: f(4) };
};

const SAVED_COLORS_KEY = 'neurulae-saved-colors';

// Preset color palettes
const PRESET_PALETTES = {
  'Material': [
    '4 90% 58%',    // Red
    '340 82% 52%',  // Pink
    '291 64% 42%',  // Purple
    '262 52% 47%',  // Deep Purple
    '231 48% 48%',  // Indigo
    '207 90% 54%',  // Blue
    '199 98% 48%',  // Light Blue
    '187 100% 42%', // Cyan
    '174 100% 29%', // Teal
    '122 39% 49%',  // Green
    '88 50% 53%',   // Light Green
    '66 70% 54%',   // Lime
    '54 100% 50%',  // Yellow
    '45 100% 51%',  // Amber
    '36 100% 50%',  // Orange
    '14 100% 57%',  // Deep Orange
  ],
  'Pastels': [
    '0 67% 85%',
    '30 67% 85%',
    '60 67% 85%',
    '120 45% 85%',
    '180 45% 85%',
    '210 67% 85%',
    '270 67% 85%',
    '300 45% 85%',
  ],
  'Earth': [
    '30 50% 28%',   // Dark brown
    '35 45% 40%',   // Brown
    '40 40% 55%',   // Tan
    '45 35% 70%',   // Beige
    '90 25% 35%',   // Olive
    '120 20% 40%',  // Forest
    '25 60% 25%',   // Chocolate
    '15 70% 45%',   // Rust
  ],
  'Neon': [
    '320 100% 50%', // Hot pink
    '280 100% 60%', // Electric purple
    '180 100% 50%', // Cyan
    '120 100% 50%', // Lime
    '60 100% 50%',  // Yellow
    '30 100% 50%',  // Orange
    '0 100% 50%',   // Red
    '210 100% 60%', // Electric blue
  ],
  'Neutrals': [
    '0 0% 10%',
    '0 0% 25%',
    '0 0% 40%',
    '0 0% 55%',
    '0 0% 70%',
    '0 0% 85%',
    '0 0% 95%',
    '0 0% 100%',
  ]
};

export function ColorPicker({ label, value, onChange, className }: ColorPickerProps) {
  const [hsl, setHSL] = useState<HSL>(parseHSL(value));
  const [savedColors, setSavedColors] = useState<string[]>([]);
  const [recentColors, setRecentColors] = useState<string[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [initialValue, setInitialValue] = useState(value);
  const [hexInput, setHexInput] = useState(hslToHex(hsl.h, hsl.s, hsl.l));
  const [copied, setCopied] = useState(false);
  
  const satLightnessRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);

  useEffect(() => {
    const saved = localStorage.getItem(SAVED_COLORS_KEY);
    if (saved) {
      setSavedColors(JSON.parse(saved));
    }
  }, []);

  useEffect(() => {
    setHSL(parseHSL(value));
    setHexInput(hslToHex(parseHSL(value).h, parseHSL(value).s, parseHSL(value).l));
  }, [value]);

  const updateColor = useCallback((newHSL: Partial<HSL>) => {
    const updated = { ...hsl, ...newHSL };
    setHSL(updated);
    const formatted = formatHSL(updated);
    onChange(formatted);
    setHexInput(hslToHex(updated.h, updated.s, updated.l));
  }, [hsl, onChange]);

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    
    if (open) {
      setInitialValue(value);
    } else {
      const currentColor = formatHSL(hsl);
      if (currentColor !== initialValue) {
        setRecentColors(prev => {
          const filtered = prev.filter(c => c !== currentColor);
          return [currentColor, ...filtered].slice(0, 12);
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
        toast.success('Color picked!');
      } catch (err) {
        console.log('Eye dropper cancelled');
      }
    } else {
      toast.error('Eye dropper not supported. Try Chrome or Edge.');
    }
  };

  const saveColor = () => {
    const currentColor = formatHSL(hsl);
    if (!savedColors.includes(currentColor)) {
      const updated = [...savedColors, currentColor];
      setSavedColors(updated);
      localStorage.setItem(SAVED_COLORS_KEY, JSON.stringify(updated));
      toast.success('Color saved to palette');
    }
  };

  const removeSavedColor = (color: string) => {
    const updated = savedColors.filter(c => c !== color);
    setSavedColors(updated);
    localStorage.setItem(SAVED_COLORS_KEY, JSON.stringify(updated));
  };

  const handleHexChange = (hex: string) => {
    setHexInput(hex);
    if (/^#[0-9A-Fa-f]{6}$/.test(hex)) {
      const newHSL = hexToHSL(hex);
      updateColor(newHSL);
    }
  };

  const copyToClipboard = async () => {
    const currentHex = hslToHex(hsl.h, hsl.s, hsl.l);
    await navigator.clipboard.writeText(currentHex);
    setCopied(true);
    toast.success('Copied to clipboard');
    setTimeout(() => setCopied(false), 1500);
  };

  const resetColor = () => {
    const initial = parseHSL(initialValue);
    updateColor(initial);
    toast.info('Color reset');
  };

  // Saturation-Lightness 2D picker
  const handleSatLightness = useCallback((e: React.MouseEvent<HTMLDivElement> | MouseEvent) => {
    if (!satLightnessRef.current) return;
    const rect = satLightnessRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(rect.width, e.clientX - rect.left));
    const y = Math.max(0, Math.min(rect.height, e.clientY - rect.top));
    
    const s = Math.round((x / rect.width) * 100);
    const l = Math.round(100 - (y / rect.height) * 100);
    updateColor({ s, l });
  }, [updateColor]);

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    isDragging.current = true;
    handleSatLightness(e);
    
    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging.current) handleSatLightness(e);
    };
    
    const handleMouseUp = () => {
      isDragging.current = false;
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
    
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  const currentHex = hslToHex(hsl.h, hsl.s, hsl.l);
  const rgb = hslToRGB(hsl.h, hsl.s, hsl.l);

  return (
    <div className={cn("space-y-2", className)}>
      <Label className="text-sm font-medium">{label}</Label>
      <Popover open={isOpen} onOpenChange={handleOpenChange}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className="w-full justify-start gap-3 h-auto py-2 group"
          >
            <div
              className="w-8 h-8 rounded-md border-2 border-border shadow-sm transition-transform group-hover:scale-105"
              style={{ backgroundColor: `hsl(${formatHSL(hsl)})` }}
            />
            <div className="flex-1 text-left">
              <span className="font-mono text-xs block">{formatHSL(hsl)}</span>
              <span className="font-mono text-[10px] text-muted-foreground">{currentHex}</span>
            </div>
            <Palette className="w-4 h-4 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-96 p-0" align="start">
          <Tabs defaultValue="picker" className="w-full">
            <div className="border-b px-3 py-2">
              <TabsList className="grid w-full grid-cols-3 h-8">
                <TabsTrigger value="picker" className="text-xs">Picker</TabsTrigger>
                <TabsTrigger value="palettes" className="text-xs">Palettes</TabsTrigger>
                <TabsTrigger value="saved" className="text-xs">Saved</TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="picker" className="p-4 space-y-4">
              {/* Color Preview & Tools */}
              <div className="flex items-start gap-3">
                <div
                  className="w-20 h-20 rounded-xl border-2 border-border shadow-lg"
                  style={{ backgroundColor: `hsl(${formatHSL(hsl)})` }}
                />
                <div className="flex-1 space-y-2">
                  <div className="flex gap-1">
                    <Input
                      value={hexInput}
                      onChange={(e) => handleHexChange(e.target.value)}
                      className="font-mono text-xs h-8"
                      placeholder="#000000"
                    />
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={copyToClipboard}
                      className="h-8 w-8 p-0 shrink-0"
                      title="Copy hex"
                    >
                      {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                    </Button>
                  </div>
                  <div className="flex gap-1">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={handleEyeDropper}
                      className="h-7 flex-1 text-xs gap-1"
                      title="Pick from screen"
                    >
                      <Pipette className="w-3 h-3" />
                      Pick
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={saveColor}
                      className="h-7 flex-1 text-xs gap-1"
                      title="Save color"
                    >
                      <Plus className="w-3 h-3" />
                      Save
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={resetColor}
                      className="h-7 w-7 p-0"
                      title="Reset"
                    >
                      <RotateCcw className="w-3 h-3" />
                    </Button>
                  </div>
                  <div className="text-[10px] text-muted-foreground font-mono">
                    RGB: {rgb.r}, {rgb.g}, {rgb.b}
                  </div>
                </div>
              </div>

              {/* 2D Saturation-Lightness Picker */}
              <div className="space-y-2">
                <Label className="text-xs">Saturation & Lightness</Label>
                <div
                  ref={satLightnessRef}
                  className="relative w-full h-40 rounded-lg border cursor-crosshair overflow-hidden"
                  style={{
                    background: `
                      linear-gradient(to bottom, white, transparent, black),
                      linear-gradient(to right, #808080, hsl(${hsl.h}, 100%, 50%))
                    `
                  }}
                  onMouseDown={handleMouseDown}
                >
                  <div
                    className="absolute w-4 h-4 border-2 border-white rounded-full shadow-lg pointer-events-none"
                    style={{
                      left: `calc(${hsl.s}% - 8px)`,
                      top: `calc(${100 - hsl.l}% - 8px)`,
                      backgroundColor: `hsl(${formatHSL(hsl)})`,
                      boxShadow: '0 0 0 1px rgba(0,0,0,0.3), 0 2px 4px rgba(0,0,0,0.3)'
                    }}
                  />
                </div>
              </div>

              {/* Hue Slider */}
              <div className="space-y-2">
                <div className="flex justify-between text-xs">
                  <Label>Hue</Label>
                  <span className="font-mono text-muted-foreground">{Math.round(hsl.h)}°</span>
                </div>
                <div className="relative">
                  <Slider
                    value={[hsl.h]}
                    onValueChange={([h]) => updateColor({ h })}
                    max={360}
                    step={1}
                    className="[&_[role=slider]]:bg-white [&_[role=slider]]:border-2 [&_[role=slider]]:shadow-md"
                  />
                  <div 
                    className="absolute inset-0 -z-10 rounded-full h-2 top-1/2 -translate-y-1/2"
                    style={{
                      background: 'linear-gradient(to right, hsl(0, 100%, 50%), hsl(60, 100%, 50%), hsl(120, 100%, 50%), hsl(180, 100%, 50%), hsl(240, 100%, 50%), hsl(300, 100%, 50%), hsl(360, 100%, 50%))'
                    }}
                  />
                </div>
              </div>

              {/* Fine-tune Sliders */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <div className="flex justify-between text-[10px]">
                    <Label className="text-[10px]">Saturation</Label>
                    <span className="font-mono text-muted-foreground">{Math.round(hsl.s)}%</span>
                  </div>
                  <Slider
                    value={[hsl.s]}
                    onValueChange={([s]) => updateColor({ s })}
                    max={100}
                    step={1}
                    className="h-1"
                  />
                </div>
                <div className="space-y-1">
                  <div className="flex justify-between text-[10px]">
                    <Label className="text-[10px]">Lightness</Label>
                    <span className="font-mono text-muted-foreground">{Math.round(hsl.l)}%</span>
                  </div>
                  <Slider
                    value={[hsl.l]}
                    onValueChange={([l]) => updateColor({ l })}
                    max={100}
                    step={1}
                    className="h-1"
                  />
                </div>
              </div>

              {/* Recent Colors */}
              {recentColors.length > 0 && (
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">Recent</Label>
                  <div className="flex flex-wrap gap-1">
                    {recentColors.map((color, idx) => (
                      <button
                        key={idx}
                        onClick={() => onChange(color)}
                        className="w-6 h-6 rounded border border-border hover:scale-110 transition-transform shadow-sm"
                        style={{ backgroundColor: `hsl(${color})` }}
                        title={color}
                      />
                    ))}
                  </div>
                </div>
              )}
            </TabsContent>

            <TabsContent value="palettes" className="p-4 space-y-4 max-h-80 overflow-y-auto">
              {Object.entries(PRESET_PALETTES).map(([name, colors]) => (
                <div key={name} className="space-y-2">
                  <Label className="text-xs text-muted-foreground">{name}</Label>
                  <div className="grid grid-cols-8 gap-1">
                    {colors.map((color, idx) => (
                      <button
                        key={idx}
                        onClick={() => onChange(color)}
                        className="w-8 h-8 rounded border border-border hover:scale-110 transition-transform shadow-sm hover:z-10"
                        style={{ backgroundColor: `hsl(${color})` }}
                        title={color}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </TabsContent>

            <TabsContent value="saved" className="p-4 space-y-4">
              {savedColors.length > 0 ? (
                <div className="grid grid-cols-6 gap-2">
                  {savedColors.map((color, idx) => (
                    <div key={idx} className="relative group">
                      <button
                        onClick={() => onChange(color)}
                        className="w-10 h-10 rounded-lg border border-border hover:scale-105 transition-transform shadow-sm"
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
              ) : (
                <div className="text-center py-8 text-muted-foreground text-sm">
                  <Sparkles className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p>No saved colors yet</p>
                  <p className="text-xs mt-1">Use the + button to save colors</p>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </PopoverContent>
      </Popover>
    </div>
  );
}
