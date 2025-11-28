import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Sparkles, Wand2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { CustomTheme } from '@/types';

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
    { ...base, l: Math.min(base.l + 30, 95) }, // Lighter
    base,
    { ...base, l: Math.max(base.l - 20, 10) }, // Darker
    { ...base, l: Math.max(base.l - 35, 5) }   // Much darker
  ];
};

interface HarmonyScheme {
  name: string;
  description: string;
  colors: HSL[];
  icon: typeof Sparkles;
}

export function ColorHarmonyGenerator({ baseColor, onApplyHarmony }: ColorHarmonyGeneratorProps) {
  const [selectedScheme, setSelectedScheme] = useState<string | null>(null);
  const base = parseHSL(baseColor);

  const schemes: HarmonyScheme[] = [
    {
      name: 'Complementary',
      description: 'Opposite colors create high contrast',
      colors: generateComplementary(base),
      icon: Sparkles
    },
    {
      name: 'Analogous',
      description: 'Adjacent colors for harmony',
      colors: generateAnalogous(base),
      icon: Sparkles
    },
    {
      name: 'Triadic',
      description: 'Three evenly spaced colors',
      colors: generateTriadic(base),
      icon: Sparkles
    },
    {
      name: 'Split-Complementary',
      description: 'Softer than complementary',
      colors: generateSplitComplementary(base),
      icon: Sparkles
    },
    {
      name: 'Tetradic',
      description: 'Four balanced colors',
      colors: generateTetradic(base),
      icon: Sparkles
    },
    {
      name: 'Monochromatic',
      description: 'Variations of one color',
      colors: generateMonochromatic(base),
      icon: Sparkles
    }
  ];

  const applyScheme = (scheme: HarmonyScheme) => {
    setSelectedScheme(scheme.name);
    
    // Map harmony colors to theme colors intelligently
    const colors = scheme.colors;
    let themeColors: Partial<CustomTheme['colors']> = {};

    if (scheme.name === 'Complementary') {
      themeColors = {
        primary: formatHSL(colors[0]),
        secondary: formatHSL(colors[1]),
        accent: formatHSL({ ...colors[0], l: Math.min(colors[0].l + 10, 90) }),
      };
    } else if (scheme.name === 'Analogous') {
      themeColors = {
        primary: formatHSL(colors[1]),
        secondary: formatHSL(colors[0]),
        accent: formatHSL(colors[2]),
      };
    } else if (scheme.name === 'Triadic') {
      themeColors = {
        primary: formatHSL(colors[0]),
        secondary: formatHSL(colors[1]),
        accent: formatHSL(colors[2]),
      };
    } else if (scheme.name === 'Split-Complementary') {
      themeColors = {
        primary: formatHSL(colors[0]),
        secondary: formatHSL(colors[1]),
        accent: formatHSL(colors[2]),
      };
    } else if (scheme.name === 'Tetradic') {
      themeColors = {
        primary: formatHSL(colors[0]),
        secondary: formatHSL(colors[1]),
        accent: formatHSL(colors[2]),
        muted: formatHSL({ ...colors[3], l: 70 }),
      };
    } else if (scheme.name === 'Monochromatic') {
      themeColors = {
        primary: formatHSL(colors[1]),
        secondary: formatHSL(colors[0]),
        accent: formatHSL(colors[1]),
        muted: formatHSL(colors[2]),
        border: formatHSL(colors[3]),
      };
    }

    onApplyHarmony(themeColors);

    // Reset selection after a moment
    setTimeout(() => setSelectedScheme(null), 1000);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Wand2 className="w-5 h-5 text-primary" />
        <div>
          <Label className="text-base font-semibold">Color Harmony Generator</Label>
          <p className="text-xs text-muted-foreground mt-1">
            Generate harmonious color schemes based on your primary color
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {schemes.map((scheme) => (
          <Card
            key={scheme.name}
            className={cn(
              "p-3 cursor-pointer transition-all hover:shadow-lg hover:scale-[1.02]",
              selectedScheme === scheme.name && "ring-2 ring-primary"
            )}
            onClick={() => applyScheme(scheme)}
          >
            <div className="space-y-2">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h4 className="font-semibold text-sm">{scheme.name}</h4>
                  <p className="text-xs text-muted-foreground">{scheme.description}</p>
                </div>
                {selectedScheme === scheme.name && (
                  <Sparkles className="w-4 h-4 text-primary animate-pulse" />
                )}
              </div>
              
              <div className="flex gap-1.5">
                {scheme.colors.map((color, idx) => (
                  <div
                    key={idx}
                    className="flex-1 h-10 rounded border border-border"
                    style={{ backgroundColor: `hsl(${formatHSL(color)})` }}
                    title={formatHSL(color)}
                  />
                ))}
              </div>
            </div>
          </Card>
        ))}
      </div>

      <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg">
        <div className="w-8 h-8 rounded border-2 border-border" style={{ backgroundColor: `hsl(${baseColor})` }} />
        <div className="flex-1">
          <p className="text-xs font-medium">Base Color (Primary)</p>
          <p className="text-xs text-muted-foreground font-mono">{baseColor}</p>
        </div>
      </div>
    </div>
  );
}
