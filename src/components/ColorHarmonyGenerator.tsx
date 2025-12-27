import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Sparkles, Wand2, Sun, Moon, Palette, Shuffle, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { CustomTheme } from '@/types';
import { toast } from 'sonner';

interface ColorHarmonyGeneratorProps {
  baseColor: string; // HSL format
  onApplyHarmony: (colors: Partial<CustomTheme['colors']>) => void;
}

interface HSL {
  h: number;
  s: number;
  l: number;
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

const normalizeHue = (h: number): number => {
  return ((h % 360) + 360) % 360;
};

// ==================== HARMONY GENERATORS ====================

const generateComplementary = (base: HSL): HSL[] => {
  return [
    base,
    { ...base, h: normalizeHue(base.h + 180) }
  ];
};

const generateAnalogous = (base: HSL): HSL[] => {
  return [
    { ...base, h: normalizeHue(base.h - 30) },
    base,
    { ...base, h: normalizeHue(base.h + 30) }
  ];
};

const generateTriadic = (base: HSL): HSL[] => {
  return [
    base,
    { ...base, h: normalizeHue(base.h + 120) },
    { ...base, h: normalizeHue(base.h + 240) }
  ];
};

const generateSplitComplementary = (base: HSL): HSL[] => {
  return [
    base,
    { ...base, h: normalizeHue(base.h + 150) },
    { ...base, h: normalizeHue(base.h + 210) }
  ];
};

const generateTetradic = (base: HSL): HSL[] => {
  return [
    base,
    { ...base, h: normalizeHue(base.h + 90) },
    { ...base, h: normalizeHue(base.h + 180) },
    { ...base, h: normalizeHue(base.h + 270) }
  ];
};

const generateMonochromatic = (base: HSL): HSL[] => {
  return [
    { ...base, l: Math.min(base.l + 30, 95) },
    base,
    { ...base, l: Math.max(base.l - 20, 10) },
    { ...base, l: Math.max(base.l - 35, 5) }
  ];
};

// NEW HARMONIES

const generateDoubleSplitComplementary = (base: HSL): HSL[] => {
  return [
    base,
    { ...base, h: normalizeHue(base.h + 30) },
    { ...base, h: normalizeHue(base.h + 150) },
    { ...base, h: normalizeHue(base.h + 210) }
  ];
};

const generateHexadic = (base: HSL): HSL[] => {
  return [
    base,
    { ...base, h: normalizeHue(base.h + 60) },
    { ...base, h: normalizeHue(base.h + 120) },
    { ...base, h: normalizeHue(base.h + 180) },
    { ...base, h: normalizeHue(base.h + 240) },
    { ...base, h: normalizeHue(base.h + 300) }
  ];
};

const generateSquare = (base: HSL): HSL[] => {
  return [
    base,
    { ...base, h: normalizeHue(base.h + 90) },
    { ...base, h: normalizeHue(base.h + 180) },
    { ...base, h: normalizeHue(base.h + 270) }
  ];
};

const generateCompoundAnalogous = (base: HSL): HSL[] => {
  // Analogous on one side + complement
  return [
    { ...base, h: normalizeHue(base.h - 30) },
    base,
    { ...base, h: normalizeHue(base.h + 30) },
    { ...base, h: normalizeHue(base.h + 180) }
  ];
};

// ==================== MOOD GENERATORS ====================

const generateWarm = (base: HSL): HSL[] => {
  // Warm colors: reds, oranges, yellows (0-60 degrees)
  const baseWarm = { h: normalizeHue(base.h > 180 ? base.h - 180 : base.h), s: base.s, l: base.l };
  if (baseWarm.h > 60) baseWarm.h = Math.max(0, base.h % 60);
  return [
    { ...baseWarm, h: 0, s: Math.min(85, base.s) },
    { ...baseWarm, h: 20, s: Math.min(90, base.s + 10) },
    { ...baseWarm, h: 40, s: Math.min(95, base.s + 15) },
    { ...baseWarm, h: 55, s: Math.min(90, base.s + 5) }
  ];
};

const generateCool = (base: HSL): HSL[] => {
  // Cool colors: blues, greens, purples (180-300 degrees)
  return [
    { h: 180, s: Math.min(70, base.s), l: base.l },
    { h: 210, s: Math.min(80, base.s + 10), l: base.l },
    { h: 240, s: Math.min(75, base.s + 5), l: base.l },
    { h: 270, s: Math.min(70, base.s), l: base.l }
  ];
};

const generatePastel = (base: HSL): HSL[] => {
  // High lightness, low saturation
  return [
    { ...base, s: Math.min(45, base.s * 0.5), l: Math.max(80, base.l) },
    { ...base, h: normalizeHue(base.h + 60), s: Math.min(40, base.s * 0.45), l: Math.max(82, base.l) },
    { ...base, h: normalizeHue(base.h + 120), s: Math.min(35, base.s * 0.4), l: Math.max(85, base.l) },
    { ...base, h: normalizeHue(base.h + 180), s: Math.min(40, base.s * 0.45), l: Math.max(83, base.l) }
  ];
};

const generateVibrant = (base: HSL): HSL[] => {
  // High saturation, balanced lightness
  return [
    { ...base, s: Math.min(95, base.s + 30), l: 50 },
    { ...base, h: normalizeHue(base.h + 90), s: Math.min(90, base.s + 25), l: 55 },
    { ...base, h: normalizeHue(base.h + 180), s: Math.min(95, base.s + 30), l: 48 },
    { ...base, h: normalizeHue(base.h + 270), s: Math.min(90, base.s + 25), l: 52 }
  ];
};

const generateEarthy = (base: HSL): HSL[] => {
  // Browns, greens, tans
  return [
    { h: 30, s: 40, l: 35 },
    { h: 45, s: 35, l: 50 },
    { h: 90, s: 30, l: 40 },
    { h: 25, s: 50, l: 28 }
  ];
};

const generateNeon = (base: HSL): HSL[] => {
  // Ultra-vibrant neon colors
  return [
    { h: normalizeHue(base.h), s: 100, l: 55 },
    { h: 300, s: 100, l: 55 }, // Magenta
    { h: 180, s: 100, l: 50 }, // Cyan
    { h: 120, s: 100, l: 50 }  // Lime
  ];
};

const generateDark = (base: HSL): HSL[] => {
  // Dark mode friendly palette
  return [
    { ...base, l: 15 },
    { ...base, h: normalizeHue(base.h + 30), l: 20 },
    { ...base, l: 60, s: Math.min(80, base.s) }, // Accent
    { ...base, h: normalizeHue(base.h + 180), l: 55 }
  ];
};

const generateLight = (base: HSL): HSL[] => {
  // Light mode friendly palette
  return [
    { ...base, l: 95, s: 15 },
    { ...base, h: normalizeHue(base.h + 30), l: 92, s: 20 },
    { ...base, l: 45, s: Math.min(85, base.s + 10) }, // Primary accent
    { ...base, h: normalizeHue(base.h + 180), l: 50 }
  ];
};

const generateSunset = (base: HSL): HSL[] => {
  return [
    { h: 350, s: 75, l: 50 },
    { h: 25, s: 85, l: 55 },
    { h: 45, s: 90, l: 60 },
    { h: 280, s: 50, l: 35 }
  ];
};

const generateOcean = (base: HSL): HSL[] => {
  return [
    { h: 195, s: 70, l: 30 },
    { h: 180, s: 60, l: 45 },
    { h: 210, s: 50, l: 55 },
    { h: 165, s: 55, l: 50 }
  ];
};

const generateForest = (base: HSL): HSL[] => {
  return [
    { h: 120, s: 35, l: 25 },
    { h: 90, s: 40, l: 40 },
    { h: 150, s: 30, l: 50 },
    { h: 45, s: 50, l: 60 }
  ];
};

// ==================== RANDOM GENERATOR ====================

const generateRandom = (): HSL[] => {
  const baseHue = Math.random() * 360;
  const strategies = [
    generateTriadic,
    generateComplementary,
    generateAnalogous,
    generateSplitComplementary,
    generateSquare
  ];
  const strategy = strategies[Math.floor(Math.random() * strategies.length)];
  const base: HSL = {
    h: baseHue,
    s: 50 + Math.random() * 40,
    l: 40 + Math.random() * 30
  };
  return strategy(base);
};

interface HarmonyScheme {
  name: string;
  description: string;
  colors: HSL[];
  icon: typeof Sparkles;
  category: 'classic' | 'mood' | 'preset';
}

export function ColorHarmonyGenerator({ baseColor, onApplyHarmony }: ColorHarmonyGeneratorProps) {
  const [selectedScheme, setSelectedScheme] = useState<string | null>(null);
  const [saturationMod, setSaturationMod] = useState(0);
  const [lightnessMod, setLightnessMod] = useState(0);
  const base = parseHSL(baseColor);

  // Apply modifiers to colors
  const modifyColors = (colors: HSL[]): HSL[] => {
    return colors.map(c => ({
      h: c.h,
      s: Math.max(0, Math.min(100, c.s + saturationMod)),
      l: Math.max(0, Math.min(100, c.l + lightnessMod))
    }));
  };

  const classicSchemes: HarmonyScheme[] = [
    {
      name: 'Complementary',
      description: 'Opposite colors for high contrast',
      colors: modifyColors(generateComplementary(base)),
      icon: Sparkles,
      category: 'classic'
    },
    {
      name: 'Analogous',
      description: 'Neighboring colors for harmony',
      colors: modifyColors(generateAnalogous(base)),
      icon: Sparkles,
      category: 'classic'
    },
    {
      name: 'Triadic',
      description: 'Three evenly spaced colors',
      colors: modifyColors(generateTriadic(base)),
      icon: Sparkles,
      category: 'classic'
    },
    {
      name: 'Split-Complementary',
      description: 'Softer than pure complementary',
      colors: modifyColors(generateSplitComplementary(base)),
      icon: Sparkles,
      category: 'classic'
    },
    {
      name: 'Tetradic',
      description: 'Four balanced colors',
      colors: modifyColors(generateTetradic(base)),
      icon: Sparkles,
      category: 'classic'
    },
    {
      name: 'Square',
      description: 'Four colors, 90° apart',
      colors: modifyColors(generateSquare(base)),
      icon: Sparkles,
      category: 'classic'
    },
    {
      name: 'Monochromatic',
      description: 'Variations of one color',
      colors: modifyColors(generateMonochromatic(base)),
      icon: Sparkles,
      category: 'classic'
    },
    {
      name: 'Compound',
      description: 'Analogous + complement',
      colors: modifyColors(generateCompoundAnalogous(base)),
      icon: Sparkles,
      category: 'classic'
    }
  ];

  const moodSchemes: HarmonyScheme[] = [
    {
      name: 'Warm',
      description: 'Reds, oranges, yellows',
      colors: modifyColors(generateWarm(base)),
      icon: Sun,
      category: 'mood'
    },
    {
      name: 'Cool',
      description: 'Blues, greens, purples',
      colors: modifyColors(generateCool(base)),
      icon: Moon,
      category: 'mood'
    },
    {
      name: 'Pastel',
      description: 'Soft, light, calming',
      colors: modifyColors(generatePastel(base)),
      icon: Palette,
      category: 'mood'
    },
    {
      name: 'Vibrant',
      description: 'Bold, saturated, energetic',
      colors: modifyColors(generateVibrant(base)),
      icon: Zap,
      category: 'mood'
    },
    {
      name: 'Earthy',
      description: 'Natural, grounded tones',
      colors: generateEarthy(base),
      icon: Palette,
      category: 'mood'
    },
    {
      name: 'Neon',
      description: 'Ultra-bright, electric',
      colors: modifyColors(generateNeon(base)),
      icon: Zap,
      category: 'mood'
    }
  ];

  const presetSchemes: HarmonyScheme[] = [
    {
      name: 'Dark Mode',
      description: 'Optimized for dark themes',
      colors: modifyColors(generateDark(base)),
      icon: Moon,
      category: 'preset'
    },
    {
      name: 'Light Mode',
      description: 'Optimized for light themes',
      colors: modifyColors(generateLight(base)),
      icon: Sun,
      category: 'preset'
    },
    {
      name: 'Sunset',
      description: 'Warm sunset tones',
      colors: generateSunset(base),
      icon: Sun,
      category: 'preset'
    },
    {
      name: 'Ocean',
      description: 'Cool marine colors',
      colors: generateOcean(base),
      icon: Moon,
      category: 'preset'
    },
    {
      name: 'Forest',
      description: 'Natural forest palette',
      colors: generateForest(base),
      icon: Palette,
      category: 'preset'
    }
  ];

  const applyScheme = (scheme: HarmonyScheme) => {
    setSelectedScheme(scheme.name);
    
    // Map harmony colors to theme colors intelligently
    const colors = scheme.colors;
    let themeColors: Partial<CustomTheme['colors']> = {};

    // Get background-ready version (light or dark)
    const avgLightness = colors.reduce((sum, c) => sum + c.l, 0) / colors.length;
    const isDarkPalette = avgLightness < 50;
    
    // Sort by saturation to find primary (most vibrant)
    const bySaturation = [...colors].sort((a, b) => b.s - a.s);
    
    // Intelligent mapping based on scheme type
    if (colors.length >= 4) {
      themeColors = {
        primary: formatHSL(bySaturation[0]),
        secondary: formatHSL(colors[1] || bySaturation[1]),
        accent: formatHSL(colors[2] || bySaturation[0]),
        muted: formatHSL({ ...colors[colors.length - 1], s: Math.min(30, colors[colors.length - 1].s), l: isDarkPalette ? 25 : 85 }),
      };
    } else if (colors.length === 3) {
      themeColors = {
        primary: formatHSL(colors[0]),
        secondary: formatHSL(colors[1]),
        accent: formatHSL(colors[2]),
      };
    } else {
      themeColors = {
        primary: formatHSL(colors[0]),
        secondary: formatHSL(colors[1] || { ...colors[0], l: colors[0].l + 20 }),
        accent: formatHSL({ ...colors[0], l: Math.min(colors[0].l + 10, 90) }),
      };
    }

    onApplyHarmony(themeColors);
    toast.success(`Applied ${scheme.name} harmony`);

    // Reset selection after animation
    setTimeout(() => setSelectedScheme(null), 800);
  };

  const handleRandomize = () => {
    const randomColors = generateRandom();
    const scheme: HarmonyScheme = {
      name: 'Random',
      description: 'Randomly generated',
      colors: randomColors,
      icon: Shuffle,
      category: 'classic'
    };
    applyScheme(scheme);
  };

  const SchemeCard = ({ scheme }: { scheme: HarmonyScheme }) => (
    <Card
      className={cn(
        "p-3 cursor-pointer transition-all hover:shadow-lg hover:scale-[1.02] active:scale-[0.98]",
        selectedScheme === scheme.name && "ring-2 ring-primary shadow-lg"
      )}
      onClick={() => applyScheme(scheme)}
    >
      <div className="space-y-2">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <h4 className="font-semibold text-sm truncate">{scheme.name}</h4>
            <p className="text-xs text-muted-foreground truncate">{scheme.description}</p>
          </div>
          {selectedScheme === scheme.name && (
            <Sparkles className="w-4 h-4 text-primary animate-pulse shrink-0 ml-2" />
          )}
        </div>
        
        <div className="flex gap-1">
          {scheme.colors.slice(0, 5).map((color, idx) => (
            <div
              key={idx}
              className="flex-1 h-8 rounded border border-border/50 first:rounded-l-md last:rounded-r-md"
              style={{ backgroundColor: `hsl(${formatHSL(color)})` }}
              title={formatHSL(color)}
            />
          ))}
        </div>
      </div>
    </Card>
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Wand2 className="w-5 h-5 text-primary" />
          <div>
            <Label className="text-base font-semibold">Color Harmony Generator</Label>
            <p className="text-xs text-muted-foreground">
              Generate harmonious palettes from your base color
            </p>
          </div>
        </div>
        <Button 
          size="sm" 
          variant="outline" 
          onClick={handleRandomize}
          className="gap-1"
        >
          <Shuffle className="w-3 h-3" />
          Random
        </Button>
      </div>

      {/* Modifiers */}
      <div className="grid grid-cols-2 gap-4 p-3 bg-muted/30 rounded-lg">
        <div className="space-y-2">
          <div className="flex justify-between text-xs">
            <Label>Saturation</Label>
            <span className="font-mono text-muted-foreground">{saturationMod > 0 ? '+' : ''}{saturationMod}%</span>
          </div>
          <Slider
            value={[saturationMod]}
            onValueChange={([v]) => setSaturationMod(v)}
            min={-40}
            max={40}
            step={5}
          />
        </div>
        <div className="space-y-2">
          <div className="flex justify-between text-xs">
            <Label>Lightness</Label>
            <span className="font-mono text-muted-foreground">{lightnessMod > 0 ? '+' : ''}{lightnessMod}%</span>
          </div>
          <Slider
            value={[lightnessMod]}
            onValueChange={([v]) => setLightnessMod(v)}
            min={-30}
            max={30}
            step={5}
          />
        </div>
      </div>

      {/* Tabbed Schemes */}
      <Tabs defaultValue="classic" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="classic" className="text-xs">Classic</TabsTrigger>
          <TabsTrigger value="mood" className="text-xs">Mood</TabsTrigger>
          <TabsTrigger value="preset" className="text-xs">Presets</TabsTrigger>
        </TabsList>

        <TabsContent value="classic" className="mt-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {classicSchemes.map((scheme) => (
              <SchemeCard key={scheme.name} scheme={scheme} />
            ))}
          </div>
        </TabsContent>

        <TabsContent value="mood" className="mt-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {moodSchemes.map((scheme) => (
              <SchemeCard key={scheme.name} scheme={scheme} />
            ))}
          </div>
        </TabsContent>

        <TabsContent value="preset" className="mt-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {presetSchemes.map((scheme) => (
              <SchemeCard key={scheme.name} scheme={scheme} />
            ))}
          </div>
        </TabsContent>
      </Tabs>

      {/* Base Color Preview */}
      <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg">
        <div className="w-10 h-10 rounded-lg border-2 border-border shadow-sm" style={{ backgroundColor: `hsl(${baseColor})` }} />
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium">Base Color (Primary)</p>
          <p className="text-xs text-muted-foreground font-mono truncate">{baseColor}</p>
        </div>
      </div>
    </div>
  );
}
