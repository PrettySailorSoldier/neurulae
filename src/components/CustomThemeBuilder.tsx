import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type { CustomTheme } from '@/types';
import { Card } from '@/components/ui/card';
import { Image as ImageIcon, Palette, ChevronDown, Minimize2, Maximize2 } from 'lucide-react';
import { ColorPicker } from '@/components/ColorPicker';
import { ColorHarmonyGenerator } from '@/components/ColorHarmonyGenerator';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { autoOptimizeThemeColors } from '@/lib/colorUtils';
import { cn } from '@/lib/utils';

interface CustomThemeBuilderProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (theme: CustomTheme) => void;
  existingTheme?: CustomTheme;
  templateTheme?: 'orchid' | 'jellyfish' | 'sunset' | 'bluebonnet' | 'ocean' | 'forest' | 'midnight' | 'candy';
}

// Theme templates based on preset themes
const themeTemplates: Record<string, Omit<CustomTheme, 'backgroundImage'>> = {
  orchid: {
    name: 'Orchid Velvet (Custom)',
    colors: {
      background: '281 20% 30%',
      foreground: '48 100% 92%',
      card: '281 25% 35%',
      cardForeground: '48 100% 92%',
      primary: '338 70% 50%',
      primaryForeground: '0 0% 100%',
      secondary: '321 45% 55%',
      secondaryForeground: '0 0% 100%',
      accent: '338 70% 55%',
      accentForeground: '0 0% 100%',
      muted: '281 15% 45%',
      mutedForeground: '48 50% 75%',
      border: '281 20% 40%',
      input: '281 20% 25%',
    },
  },
  jellyfish: {
    name: 'Jellyfish Dream (Custom)',
    colors: {
      background: '216 60% 8%',
      foreground: '325 30% 88%',
      card: '216 55% 12%',
      cardForeground: '325 30% 88%',
      primary: '325 40% 75%',
      primaryForeground: '216 60% 8%',
      secondary: '216 50% 30%',
      secondaryForeground: '325 30% 88%',
      accent: '325 40% 65%',
      accentForeground: '216 60% 8%',
      border: '216 45% 20%',
      input: '216 50% 15%',
      muted: '216 40% 25%',
      mutedForeground: '325 20% 65%',
    },
  },
  sunset: {
    name: 'Liquid Sunset (Custom)',
    colors: {
      background: '15 30% 88%',
      foreground: '215 40% 30%',
      card: '200 35% 85%',
      cardForeground: '215 40% 30%',
      primary: '5 70% 65%',
      primaryForeground: '0 0% 100%',
      secondary: '25 85% 70%',
      secondaryForeground: '215 40% 30%',
      accent: '10 75% 58%',
      accentForeground: '0 0% 100%',
      border: '200 25% 75%',
      input: '200 30% 90%',
      muted: '200 25% 80%',
      mutedForeground: '215 30% 45%',
    },
  },
  bluebonnet: {
    name: 'Bluebonnet Birch (Custom)',
    colors: {
      background: '225 50% 45%',
      foreground: '45 55% 88%',
      card: '225 45% 38%',
      cardForeground: '45 55% 88%',
      primary: '70 60% 65%',
      primaryForeground: '225 50% 20%',
      secondary: '30 35% 58%',
      secondaryForeground: '45 55% 88%',
      accent: '225 55% 70%',
      accentForeground: '225 50% 20%',
      border: '225 40% 25%',
      input: '225 45% 30%',
      muted: '225 35% 50%',
      mutedForeground: '45 35% 75%',
    },
  },
  ocean: {
    name: 'Ocean Breeze (Custom)',
    colors: {
      background: '195 60% 15%',
      foreground: '180 30% 92%',
      card: '195 55% 20%',
      cardForeground: '180 30% 92%',
      primary: '180 50% 55%',
      primaryForeground: '195 60% 10%',
      secondary: '195 45% 35%',
      secondaryForeground: '180 30% 92%',
      accent: '165 55% 50%',
      accentForeground: '0 0% 100%',
      border: '195 50% 25%',
      input: '195 55% 18%',
      muted: '195 40% 30%',
      mutedForeground: '180 25% 75%',
    },
  },
  forest: {
    name: 'Forest Calm (Custom)',
    colors: {
      background: '150 35% 20%',
      foreground: '50 40% 90%',
      card: '150 30% 25%',
      cardForeground: '50 40% 90%',
      primary: '140 45% 50%',
      primaryForeground: '0 0% 100%',
      secondary: '85 40% 55%',
      secondaryForeground: '150 35% 15%',
      accent: '160 50% 45%',
      accentForeground: '0 0% 100%',
      border: '150 30% 30%',
      input: '150 35% 22%',
      muted: '150 25% 35%',
      mutedForeground: '50 30% 75%',
    },
  },
  midnight: {
    name: 'Midnight Purple (Custom)',
    colors: {
      background: '265 45% 12%',
      foreground: '280 25% 92%',
      card: '265 40% 18%',
      cardForeground: '280 25% 92%',
      primary: '275 60% 60%',
      primaryForeground: '0 0% 100%',
      secondary: '260 45% 45%',
      secondaryForeground: '280 25% 92%',
      accent: '285 55% 65%',
      accentForeground: '265 45% 12%',
      border: '265 35% 22%',
      input: '265 40% 15%',
      muted: '265 30% 28%',
      mutedForeground: '280 20% 70%',
    },
  },
  candy: {
    name: 'Candy Store (Custom)',
    colors: {
      background: '0 0% 20%',
      foreground: '340 100% 85%',
      card: '195 50% 80%',
      cardForeground: '0 0% 20%',
      primary: '330 100% 70%',
      primaryForeground: '0 0% 100%',
      secondary: '200 70% 65%',
      secondaryForeground: '0 0% 20%',
      accent: '50 100% 60%',
      accentForeground: '0 0% 20%',
      border: '195 40% 70%',
      input: '195 45% 85%',
      muted: '195 35% 75%',
      mutedForeground: '0 0% 35%',
    },
  },
};

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
  backgroundImage: {
    url: '',
    size: 'cover',
    position: 'center',
    repeat: 'no-repeat',
    attachment: 'scroll',
    opacity: 100,
    blur: 0,
    overlayColor: '0 0% 0%',
    overlayOpacity: 0,
    filter: {
      grayscale: 0,
      sepia: 0,
      brightness: 100,
      contrast: 100,
      saturate: 100,
    },
  },
};

export function CustomThemeBuilder({ open, onOpenChange, onSave, existingTheme, templateTheme }: CustomThemeBuilderProps) {
  const [theme, setTheme] = useState<CustomTheme>(existingTheme || defaultTheme);
  const [previewMode, setPreviewMode] = useState(false);
  const [showHarmonyGenerator, setShowHarmonyGenerator] = useState(false);
  const [minimized, setMinimized] = useState(false);

  useEffect(() => {
    if (existingTheme) {
      setTheme(existingTheme);
    } else if (templateTheme && themeTemplates[templateTheme]) {
      setTheme({
        ...themeTemplates[templateTheme],
        backgroundImage: defaultTheme.backgroundImage,
      });
    } else {
      setTheme(defaultTheme);
    }
  }, [existingTheme, templateTheme, open]);

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

    // Apply background image directly to body
    if (themeData.backgroundImage && themeData.backgroundImage.url) {
      const bg = themeData.backgroundImage;
      const body = document.body;
      
      // Apply background styles
      body.style.backgroundImage = `url(${bg.url})`;
      body.style.backgroundSize = bg.size === 'stretch' ? '100% 100%' : bg.size;
      body.style.backgroundPosition = bg.position.replace('-', ' ');
      body.style.backgroundRepeat = bg.repeat;
      body.style.backgroundAttachment = bg.attachment;
      
      // Apply overlay and filters via CSS variables (consumed by body::before)
      root.style.setProperty('--bg-blur', `${bg.blur}px`);
      root.style.setProperty('--bg-opacity', `${bg.opacity / 100}`);
      root.style.setProperty('--overlay-color', bg.overlayColor);
      root.style.setProperty('--overlay-opacity', `${bg.overlayOpacity}%`);
      root.style.setProperty('--bg-filter-grayscale', `${bg.filter.grayscale}%`);
      root.style.setProperty('--bg-filter-sepia', `${bg.filter.sepia}%`);
      root.style.setProperty('--bg-filter-brightness', `${bg.filter.brightness}%`);
      root.style.setProperty('--bg-filter-contrast', `${bg.filter.contrast}%`);
      root.style.setProperty('--bg-filter-saturate', `${bg.filter.saturate}%`);
    }
  };

  const removeThemePreview = () => {
    const root = document.documentElement;
    const body = document.body;
    
    Object.keys(theme.colors).forEach((key) => {
      const cssVar = `--${key.replace(/([A-Z])/g, '-$1').toLowerCase()}`;
      root.style.removeProperty(cssVar);
    });

    // Remove background styles from body
    body.style.backgroundImage = '';
    body.style.backgroundSize = '';
    body.style.backgroundPosition = '';
    body.style.backgroundRepeat = '';
    body.style.backgroundAttachment = '';
    
    root.style.removeProperty('--bg-blur');
    root.style.removeProperty('--bg-opacity');
    root.style.removeProperty('--overlay-color');
    root.style.removeProperty('--overlay-opacity');
    root.style.removeProperty('--bg-filter-grayscale');
    root.style.removeProperty('--bg-filter-sepia');
    root.style.removeProperty('--bg-filter-brightness');
    root.style.removeProperty('--bg-filter-contrast');
    root.style.removeProperty('--bg-filter-saturate');
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

  const handleApplyHarmony = (harmonyColors: Partial<CustomTheme['colors']>) => {
    setTheme((prev) => {
      const updatedColors = {
        ...prev.colors,
        ...harmonyColors,
      };
      
      // Auto-optimize foreground colors for visibility
      const optimizedColors = autoOptimizeThemeColors(updatedColors) as CustomTheme['colors'];
      
      return {
        ...prev,
        colors: optimizedColors,
      };
    });
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
    setMinimized(false);
    onOpenChange(false);
  };

  const toggleMinimize = () => {
    setMinimized(!minimized);
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
    <>
      <Dialog open={open && !minimized} onOpenChange={handleClose}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <DialogTitle>Custom Theme Builder</DialogTitle>
              {previewMode && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={toggleMinimize}
                  className="gap-2"
                >
                  <Minimize2 className="w-4 h-4" />
                  Minimize for Color Picking
                </Button>
              )}
            </div>
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
              {previewMode ? 'Preview Active ✨' : 'Enable Live Preview'}
            </Button>
          </div>

          {previewMode && (
            <div className="space-y-3">
              <Card className="p-4 space-y-2 bg-card text-card-foreground">
                <h3 className="font-semibold text-primary">Preview Card</h3>
                <p className="text-muted-foreground">This is how muted text looks</p>
                <div className="flex gap-2">
                  <Button size="sm">Primary Button</Button>
                  <Button size="sm" variant="secondary">Secondary</Button>
                  <Button size="sm" variant="outline">Outline</Button>
                </div>
              </Card>
              <div className="p-3 bg-primary/10 border border-primary/20 rounded-lg">
                <p className="text-xs font-medium flex items-center gap-2">
                  <Minimize2 className="w-3 h-3" />
                  <span>Tip: Click "Minimize for Color Picking" above to hide this dialog and use the eye dropper tool to pick colors from your background image or other page elements</span>
                </p>
              </div>
            </div>
          )}

          <Tabs defaultValue="colors" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="colors">
                <Palette className="w-4 h-4 mr-2" />
                Colors
              </TabsTrigger>
              <TabsTrigger value="background">
                <ImageIcon className="w-4 h-4 mr-2" />
                Background Image
              </TabsTrigger>
            </TabsList>

            <TabsContent value="colors" className="space-y-6 mt-4">
              {/* Color Harmony Generator - Toggleable */}
              <Collapsible open={showHarmonyGenerator} onOpenChange={setShowHarmonyGenerator}>
                <CollapsibleTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-between"
                  >
                    <span className="flex items-center gap-2">
                      <Palette className="w-4 h-4" />
                      Color Harmony Generator (Auto-optimizes visibility)
                    </span>
                    <ChevronDown className={`w-4 h-4 transition-transform ${showHarmonyGenerator ? 'rotate-180' : ''}`} />
                  </Button>
                </CollapsibleTrigger>
                <CollapsibleContent className="pt-4">
                  <div className="space-y-3">
                    <div className="p-3 bg-muted/50 rounded-lg text-sm">
                      <p className="font-medium mb-1">✨ Smart Optimization Enabled</p>
                      <p className="text-xs text-muted-foreground">
                        Foreground colors automatically adjust to ensure text and UI elements remain visible on any background
                      </p>
                    </div>
                    <ColorHarmonyGenerator
                      baseColor={theme.colors.primary}
                      onApplyHarmony={handleApplyHarmony}
                    />
                  </div>
                </CollapsibleContent>
              </Collapsible>

              {/* Color Pickers */}
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold mb-2">Colors (HSL format)</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Use the color pickers below to customize each color with sliders, eye dropper, and saved palettes
                  </p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {colorFields.map(({ key, label }) => (
                    <ColorPicker
                      key={key}
                      label={label}
                      value={theme.colors[key]}
                      onChange={(value) => handleColorChange(key, value)}
                    />
                  ))}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="background" className="space-y-6 mt-4">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Background Image</Label>
                  <div className="flex gap-2">
                    <Input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onload = (event) => {
                            const url = event.target?.result as string;
                            setTheme({
                              ...theme,
                              backgroundImage: { ...theme.backgroundImage!, url }
                            });
                          };
                          reader.readAsDataURL(file);
                        }
                      }}
                      className="flex-1"
                    />
                  </div>
                  <Input
                    value={theme.backgroundImage?.url || ''}
                    onChange={(e) => setTheme({
                      ...theme,
                      backgroundImage: { ...theme.backgroundImage!, url: e.target.value }
                    })}
                    placeholder="Or paste image URL..."
                    className="mt-2"
                  />
                  <p className="text-xs text-muted-foreground">
                    Upload from device or use URL from Unsplash, Pexels, etc.
                  </p>
                </div>

                {theme.backgroundImage?.url && (
                  <>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Display Mode</Label>
                        <Select
                          value={theme.backgroundImage.size}
                          onValueChange={(value: any) => setTheme({
                            ...theme,
                            backgroundImage: { ...theme.backgroundImage!, size: value }
                          })}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="cover">Cover (fill)</SelectItem>
                            <SelectItem value="contain">Contain (fit)</SelectItem>
                            <SelectItem value="auto">Auto (original)</SelectItem>
                            <SelectItem value="stretch">Stretch</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label>Position</Label>
                        <Select
                          value={theme.backgroundImage.position}
                          onValueChange={(value: any) => setTheme({
                            ...theme,
                            backgroundImage: { ...theme.backgroundImage!, position: value }
                          })}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="center">Center</SelectItem>
                            <SelectItem value="top">Top</SelectItem>
                            <SelectItem value="bottom">Bottom</SelectItem>
                            <SelectItem value="left">Left</SelectItem>
                            <SelectItem value="right">Right</SelectItem>
                            <SelectItem value="top-left">Top Left</SelectItem>
                            <SelectItem value="top-right">Top Right</SelectItem>
                            <SelectItem value="bottom-left">Bottom Left</SelectItem>
                            <SelectItem value="bottom-right">Bottom Right</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label>Repeat</Label>
                        <Select
                          value={theme.backgroundImage.repeat}
                          onValueChange={(value: any) => setTheme({
                            ...theme,
                            backgroundImage: { ...theme.backgroundImage!, repeat: value }
                          })}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="no-repeat">No Repeat</SelectItem>
                            <SelectItem value="repeat">Repeat (tile)</SelectItem>
                            <SelectItem value="repeat-x">Repeat X</SelectItem>
                            <SelectItem value="repeat-y">Repeat Y</SelectItem>
                            <SelectItem value="space">Space</SelectItem>
                            <SelectItem value="round">Round</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label>Attachment</Label>
                        <Select
                          value={theme.backgroundImage.attachment}
                          onValueChange={(value: any) => setTheme({
                            ...theme,
                            backgroundImage: { ...theme.backgroundImage!, attachment: value }
                          })}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="scroll">Scroll</SelectItem>
                            <SelectItem value="fixed">Fixed (parallax)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="space-y-4 pt-4 border-t">
                      <h4 className="font-semibold text-sm">Effects & Overlays</h4>
                      
                      <div className="space-y-3">
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <Label>Image Opacity</Label>
                            <span className="text-sm text-muted-foreground">{theme.backgroundImage.opacity}%</span>
                          </div>
                          <Slider
                            value={[theme.backgroundImage.opacity]}
                            onValueChange={([value]) => setTheme({
                              ...theme,
                              backgroundImage: { ...theme.backgroundImage!, opacity: value }
                            })}
                            min={0}
                            max={100}
                            step={1}
                          />
                        </div>

                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <Label>Blur Effect</Label>
                            <span className="text-sm text-muted-foreground">{theme.backgroundImage.blur}px</span>
                          </div>
                          <Slider
                            value={[theme.backgroundImage.blur]}
                            onValueChange={([value]) => setTheme({
                              ...theme,
                              backgroundImage: { ...theme.backgroundImage!, blur: value }
                            })}
                            min={0}
                            max={20}
                            step={1}
                          />
                        </div>

                        <div className="space-y-2">
                          <Label>Overlay Color (HSL)</Label>
                          <Input
                            value={theme.backgroundImage.overlayColor}
                            onChange={(e) => setTheme({
                              ...theme,
                              backgroundImage: { ...theme.backgroundImage!, overlayColor: e.target.value }
                            })}
                            placeholder="0 0% 0%"
                            className="font-mono text-sm"
                          />
                        </div>

                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <Label>Overlay Opacity</Label>
                            <span className="text-sm text-muted-foreground">{theme.backgroundImage.overlayOpacity}%</span>
                          </div>
                          <Slider
                            value={[theme.backgroundImage.overlayOpacity]}
                            onValueChange={([value]) => setTheme({
                              ...theme,
                              backgroundImage: { ...theme.backgroundImage!, overlayOpacity: value }
                            })}
                            min={0}
                            max={100}
                            step={1}
                          />
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4 pt-4 border-t">
                      <h4 className="font-semibold text-sm">Image Filters</h4>
                      
                      <div className="space-y-3">
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <Label>Grayscale</Label>
                            <span className="text-sm text-muted-foreground">{theme.backgroundImage.filter.grayscale}%</span>
                          </div>
                          <Slider
                            value={[theme.backgroundImage.filter.grayscale]}
                            onValueChange={([value]) => setTheme({
                              ...theme,
                              backgroundImage: {
                                ...theme.backgroundImage!,
                                filter: { ...theme.backgroundImage!.filter, grayscale: value }
                              }
                            })}
                            min={0}
                            max={100}
                            step={1}
                          />
                        </div>

                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <Label>Sepia</Label>
                            <span className="text-sm text-muted-foreground">{theme.backgroundImage.filter.sepia}%</span>
                          </div>
                          <Slider
                            value={[theme.backgroundImage.filter.sepia]}
                            onValueChange={([value]) => setTheme({
                              ...theme,
                              backgroundImage: {
                                ...theme.backgroundImage!,
                                filter: { ...theme.backgroundImage!.filter, sepia: value }
                              }
                            })}
                            min={0}
                            max={100}
                            step={1}
                          />
                        </div>

                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <Label>Brightness</Label>
                            <span className="text-sm text-muted-foreground">{theme.backgroundImage.filter.brightness}%</span>
                          </div>
                          <Slider
                            value={[theme.backgroundImage.filter.brightness]}
                            onValueChange={([value]) => setTheme({
                              ...theme,
                              backgroundImage: {
                                ...theme.backgroundImage!,
                                filter: { ...theme.backgroundImage!.filter, brightness: value }
                              }
                            })}
                            min={0}
                            max={200}
                            step={1}
                          />
                        </div>

                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <Label>Contrast</Label>
                            <span className="text-sm text-muted-foreground">{theme.backgroundImage.filter.contrast}%</span>
                          </div>
                          <Slider
                            value={[theme.backgroundImage.filter.contrast]}
                            onValueChange={([value]) => setTheme({
                              ...theme,
                              backgroundImage: {
                                ...theme.backgroundImage!,
                                filter: { ...theme.backgroundImage!.filter, contrast: value }
                              }
                            })}
                            min={0}
                            max={200}
                            step={1}
                          />
                        </div>

                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <Label>Saturation</Label>
                            <span className="text-sm text-muted-foreground">{theme.backgroundImage.filter.saturate}%</span>
                          </div>
                          <Slider
                            value={[theme.backgroundImage.filter.saturate]}
                            onValueChange={([value]) => setTheme({
                              ...theme,
                              backgroundImage: {
                                ...theme.backgroundImage!,
                                filter: { ...theme.backgroundImage!.filter, saturate: value }
                              }
                            })}
                            min={0}
                            max={200}
                            step={1}
                          />
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </TabsContent>
          </Tabs>

          <div className="flex gap-2 pt-4 border-t">
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

    {/* Minimized floating button for color picking */}
    {minimized && previewMode && (
      <div className="fixed bottom-6 right-6 z-50">
        <Card className="p-4 shadow-2xl border-2 border-primary">
          <div className="flex items-center gap-3">
            <div className="space-y-1">
              <p className="font-semibold text-sm">Theme Preview Active</p>
              <p className="text-xs text-muted-foreground">Use eye dropper to pick colors</p>
            </div>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={toggleMinimize}
                title="Restore editor"
              >
                <Maximize2 className="w-4 h-4" />
              </Button>
              <Button
                size="sm"
                variant="default"
                onClick={handleSave}
              >
                Save
              </Button>
            </div>
          </div>
        </Card>
      </div>
    )}
  </>
  );
}
