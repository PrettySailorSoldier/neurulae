import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { CustomTheme } from '@/types';
import { Card } from '@/components/ui/card';

interface CustomThemeBuilderProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (theme: CustomTheme) => void;
  existingTheme?: CustomTheme;
}

const defaultTheme: CustomTheme = {
  name: 'My Custom Theme',
  colors: {
    background: '0 0% 100%',
    foreground: '0 0% 3.9%',
    card: '0 0% 100%',
    cardForeground: '0 0% 3.9%',
    primary: '262.1 83.3% 57.8%',
    primaryForeground: '0 0% 98%',
    secondary: '220 14.3% 95.9%',
    secondaryForeground: '220.9 39.3% 11%',
    accent: '220 14.3% 95.9%',
    accentForeground: '220.9 39.3% 11%',
    muted: '220 14.3% 95.9%',
    mutedForeground: '220 8.9% 46.1%',
    border: '220 13% 91%',
    input: '220 13% 91%',
  },
};

export function CustomThemeBuilder({ open, onOpenChange, onSave, existingTheme }: CustomThemeBuilderProps) {
  const [theme, setTheme] = useState<CustomTheme>(existingTheme || defaultTheme);
  const [previewMode, setPreviewMode] = useState(false);

  useEffect(() => {
    if (existingTheme) {
      setTheme(existingTheme);
    }
  }, [existingTheme]);

  useEffect(() => {
    if (previewMode && open) {
      applyThemePreview(theme);
    }
    return () => {
      if (previewMode) {
        removeThemePreview();
      }
    };
  }, [previewMode, theme, open]);

  const applyThemePreview = (themeData: CustomTheme) => {
    const root = document.documentElement;
    Object.entries(themeData.colors).forEach(([key, value]) => {
      const cssVar = `--${key.replace(/([A-Z])/g, '-$1').toLowerCase()}`;
      root.style.setProperty(cssVar, value);
    });
  };

  const removeThemePreview = () => {
    const root = document.documentElement;
    Object.keys(theme.colors).forEach((key) => {
      const cssVar = `--${key.replace(/([A-Z])/g, '-$1').toLowerCase()}`;
      root.style.removeProperty(cssVar);
    });
  };

  const handleColorChange = (colorKey: keyof CustomTheme['colors'], value: string) => {
    setTheme((prev) => ({
      ...prev,
      colors: {
        ...prev.colors,
        [colorKey]: value,
      },
    }));
  };

  const handleSave = () => {
    onSave(theme);
    removeThemePreview();
    setPreviewMode(false);
    onOpenChange(false);
  };

  const handleClose = () => {
    removeThemePreview();
    setPreviewMode(false);
    onOpenChange(false);
  };

  const colorFields: { key: keyof CustomTheme['colors']; label: string }[] = [
    { key: 'background', label: 'Background' },
    { key: 'foreground', label: 'Foreground' },
    { key: 'card', label: 'Card' },
    { key: 'cardForeground', label: 'Card Foreground' },
    { key: 'primary', label: 'Primary' },
    { key: 'primaryForeground', label: 'Primary Foreground' },
    { key: 'secondary', label: 'Secondary' },
    { key: 'secondaryForeground', label: 'Secondary Foreground' },
    { key: 'accent', label: 'Accent' },
    { key: 'accentForeground', label: 'Accent Foreground' },
    { key: 'muted', label: 'Muted' },
    { key: 'mutedForeground', label: 'Muted Foreground' },
    { key: 'border', label: 'Border' },
    { key: 'input', label: 'Input' },
  ];

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Custom Theme Builder</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          <div className="space-y-2">
            <Label>Theme Name</Label>
            <Input
              value={theme.name}
              onChange={(e) => setTheme({ ...theme, name: e.target.value })}
              placeholder="My Custom Theme"
            />
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant={previewMode ? 'default' : 'outline'}
              onClick={() => setPreviewMode(!previewMode)}
              className="flex-1"
            >
              {previewMode ? 'Preview Active' : 'Enable Live Preview'}
            </Button>
          </div>

          {previewMode && (
            <Card className="p-4 space-y-2 bg-card text-card-foreground">
              <h3 className="font-semibold text-primary">Preview Card</h3>
              <p className="text-muted-foreground">This is how muted text looks</p>
              <div className="flex gap-2">
                <Button size="sm">Primary Button</Button>
                <Button size="sm" variant="secondary">Secondary</Button>
                <Button size="sm" variant="outline">Outline</Button>
              </div>
            </Card>
          )}

          <div className="space-y-4">
            <h3 className="font-semibold">Colors (HSL format: "hue saturation% lightness%")</h3>
            <p className="text-sm text-muted-foreground">
              Example: "262 83% 58%" for a purple color
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {colorFields.map(({ key, label }) => (
                <div key={key} className="space-y-2">
                  <Label htmlFor={key} className="text-sm">{label}</Label>
                  <Input
                    id={key}
                    value={theme.colors[key]}
                    onChange={(e) => handleColorChange(key, e.target.value)}
                    placeholder="0 0% 100%"
                    className="font-mono text-sm"
                  />
                </div>
              ))}
            </div>
          </div>

          <div className="flex gap-2">
            <Button onClick={handleSave} className="flex-1">
              Save Theme
            </Button>
            <Button onClick={handleClose} variant="outline" className="flex-1">
              Cancel
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
