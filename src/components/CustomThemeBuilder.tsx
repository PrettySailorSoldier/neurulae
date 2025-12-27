import { useState, useEffect, useRef } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { CustomTheme } from "@/types";
import { Card } from "@/components/ui/card";
import { Image as ImageIcon, Palette, ChevronDown, Wand2, Upload, Save, X, Undo2, Redo2 } from "lucide-react";
import { ColorPicker } from "@/components/ColorPicker";
import { ColorHarmonyGenerator } from "@/components/ColorHarmonyGenerator";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { autoOptimizeThemeColors, extractColorsFromImage, generateThemeFromImageColors } from "@/lib/colorUtils";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { usePremium } from "@/contexts/PremiumContext";
// Import the Bouncer logic
import { useDatabaseWrite } from "@/hooks/useDatabaseWrite";

interface CustomThemeBuilderProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (theme: CustomTheme) => void;
  existingTheme?: CustomTheme;
  existingThemeId?: string; // Pass the ID when editing to ensure we update the correct theme
  templateTheme?: "orchid" | "jellyfish" | "sunset" | "bluebonnet" | "ocean" | "forest" | "midnight" | "candy";
}

// Theme templates based on preset themes
const themeTemplates: Record<string, Omit<CustomTheme, "backgroundImage">> = {
  orchid: {
    name: "Orchid Velvet (Custom)",
    colors: {
      background: "281 20% 30%",
      foreground: "48 100% 92%",
      card: "281 25% 35%",
      cardForeground: "48 100% 92%",
      primary: "338 70% 50%",
      primaryForeground: "0 0% 100%",
      secondary: "321 45% 55%",
      secondaryForeground: "0 0% 100%",
      accent: "338 70% 55%",
      accentForeground: "0 0% 100%",
      muted: "281 15% 45%",
      mutedForeground: "48 50% 75%",
      border: "281 20% 40%",
      input: "281 20% 25%",
    },
  },
  jellyfish: {
    name: "Jellyfish Dream (Custom)",
    colors: {
      background: "216 60% 8%",
      foreground: "325 30% 88%",
      card: "216 55% 12%",
      cardForeground: "325 30% 88%",
      primary: "325 40% 75%",
      primaryForeground: "216 60% 8%",
      secondary: "216 50% 30%",
      secondaryForeground: "325 30% 88%",
      accent: "325 40% 65%",
      accentForeground: "216 60% 8%",
      border: "216 45% 20%",
      input: "216 50% 15%",
      muted: "216 40% 25%",
      mutedForeground: "325 20% 65%",
    },
  },
  sunset: {
    name: "Liquid Sunset (Custom)",
    colors: {
      background: "15 30% 88%",
      foreground: "215 40% 30%",
      card: "200 35% 85%",
      cardForeground: "215 40% 30%",
      primary: "5 70% 65%",
      primaryForeground: "0 0% 100%",
      secondary: "25 85% 70%",
      secondaryForeground: "215 40% 30%",
      accent: "10 75% 58%",
      accentForeground: "0 0% 100%",
      border: "200 25% 75%",
      input: "200 30% 90%",
      muted: "200 25% 80%",
      mutedForeground: "215 30% 45%",
    },
  },
  bluebonnet: {
    name: "Bluebonnet Birch (Custom)",
    colors: {
      background: "225 50% 45%",
      foreground: "45 55% 88%",
      card: "225 45% 38%",
      cardForeground: "45 55% 88%",
      primary: "70 60% 65%",
      primaryForeground: "225 50% 20%",
      secondary: "30 35% 58%",
      secondaryForeground: "45 55% 88%",
      accent: "225 55% 70%",
      accentForeground: "225 50% 20%",
      border: "225 40% 25%",
      input: "225 45% 30%",
      muted: "225 35% 50%",
      mutedForeground: "45 35% 75%",
    },
  },
  ocean: {
    name: "Ocean Breeze (Custom)",
    colors: {
      background: "195 60% 15%",
      foreground: "180 30% 92%",
      card: "195 55% 20%",
      cardForeground: "180 30% 92%",
      primary: "180 50% 55%",
      primaryForeground: "195 60% 10%",
      secondary: "195 45% 35%",
      secondaryForeground: "180 30% 92%",
      accent: "165 55% 50%",
      accentForeground: "0 0% 100%",
      border: "195 50% 25%",
      input: "195 55% 18%",
      muted: "195 40% 30%",
      mutedForeground: "180 25% 75%",
    },
  },
  forest: {
    name: "Forest Calm (Custom)",
    colors: {
      background: "150 35% 20%",
      foreground: "50 40% 90%",
      card: "150 30% 25%",
      cardForeground: "50 40% 90%",
      primary: "140 45% 50%",
      primaryForeground: "0 0% 100%",
      secondary: "85 40% 55%",
      secondaryForeground: "150 35% 15%",
      accent: "160 50% 45%",
      accentForeground: "0 0% 100%",
      border: "150 30% 30%",
      input: "150 35% 22%",
      muted: "150 25% 35%",
      mutedForeground: "50 30% 75%",
    },
  },
  midnight: {
    name: "Midnight Purple (Custom)",
    colors: {
      background: "265 45% 12%",
      foreground: "280 25% 92%",
      card: "265 40% 18%",
      cardForeground: "280 25% 92%",
      primary: "275 60% 60%",
      primaryForeground: "0 0% 100%",
      secondary: "260 45% 45%",
      secondaryForeground: "280 25% 92%",
      accent: "285 55% 65%",
      accentForeground: "265 45% 12%",
      border: "265 35% 22%",
      input: "265 40% 15%",
      muted: "265 30% 28%",
      mutedForeground: "280 20% 70%",
    },
  },
  candy: {
    name: "Candy Store (Custom)",
    colors: {
      background: "0 0% 20%",
      foreground: "340 100% 85%",
      card: "195 50% 80%",
      cardForeground: "0 0% 20%",
      primary: "330 100% 70%",
      primaryForeground: "0 0% 100%",
      secondary: "200 70% 65%",
      secondaryForeground: "0 0% 20%",
      accent: "50 100% 60%",
      accentForeground: "0 0% 20%",
      border: "195 40% 70%",
      input: "195 45% 85%",
      muted: "195 35% 75%",
      mutedForeground: "0 0% 35%",
    },
  },
};

const defaultTheme: CustomTheme = {
  name: "My Custom Theme",
  colors: {
    background: "0 0% 100%",
    foreground: "0 0% 3.9%",
    card: "0 0% 100%",
    cardForeground: "0 0% 3.9%",
    primary: "262.1 83.3% 57.8%",
    primaryForeground: "0 0% 98%",
    secondary: "220 14.3% 95.9%",
    secondaryForeground: "220.9 39.3% 11%",
    accent: "220 14.3% 95.9%",
    accentForeground: "220.9 39.3% 11%",
    muted: "220 14.3% 95.9%",
    mutedForeground: "220 8.9% 46.1%",
    border: "220 13% 91%",
    input: "220 13% 91%",
  },
  backgroundImage: {
    url: "",
    size: "cover",
    position: "center",
    repeat: "no-repeat",
    attachment: "scroll",
    opacity: 100,
    blur: 0,
    overlayColor: "0 0% 0%",
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

interface SavedPalette {
  id: string;
  name: string;
  colors: CustomTheme["colors"];
  backgroundImage?: CustomTheme["backgroundImage"];
}

// Generate a unique ID that won't collide even with rapid saves
const generateUniqueId = (): string => {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
};
// Storage keys - IMPORTANT: These are separate!
const PALETTES_STORAGE_KEY = "saved_color_palettes"; // Internal palettes for the builder
const THEMES_STORAGE_KEY = "saved_custom_palettes"; // Full themes shown in ThemeSwitcher dropdown

export function CustomThemeBuilder({
  open,
  onOpenChange,
  onSave,
  existingTheme,
  existingThemeId,
  templateTheme,
}: CustomThemeBuilderProps) {
  const { user } = useAuth();
  const [theme, setTheme] = useState<CustomTheme>(existingTheme || defaultTheme);
  const [previewMode, setPreviewMode] = useState(false);
  const [showHarmonyGenerator, setShowHarmonyGenerator] = useState(false);
  const [savedPalettes, setSavedPalettes] = useState<SavedPalette[]>([]); // Internal palettes
  const [savedThemes, setSavedThemes] = useState<SavedPalette[]>([]); // Full themes for dropdown
  const [themeHistory, setThemeHistory] = useState<CustomTheme[]>([existingTheme || defaultTheme]);
  const [historyIndex, setHistoryIndex] = useState(0);

  const paletteImageRef = useRef<HTMLInputElement>(null);

  // Initialize the "Bouncer"
  const { executeWrite } = useDatabaseWrite();
  const { isPremium } = usePremium();

  // OPTIMIZED LOAD: Fetch ONLY the theme, not the whole profile
  useEffect(() => {
    if (!open || !user) return;

    const loadThemeFromDatabase = async () => {
      try {
        const { data, error } = await supabase.from("profiles").select("preferences").eq("id", user.id).single();

        if (error) {
          console.error("Error loading theme:", error);
          return;
        }

        const preferences = data?.preferences as any;
        if (preferences?.customTheme) {
          const loadedTheme = preferences.customTheme as CustomTheme;
          setTheme(loadedTheme);
          setThemeHistory([loadedTheme]);
          setHistoryIndex(0);
        } else if (existingTheme) {
          // Fallback logic
          setTheme(existingTheme);
          setThemeHistory([existingTheme]);
          setHistoryIndex(0);
        }
      } catch (err) {
        console.error("Failed to load theme:", err);
      }
    };

    loadThemeFromDatabase();
  }, [open, user, existingTheme]);

  // Load saved palettes (internal) and themes (for dropdown) from localStorage when sheet opens
  useEffect(() => {
    if (!open) return;

    // Load internal color palettes
    const storedPalettes = localStorage.getItem(PALETTES_STORAGE_KEY);
    if (storedPalettes) {
      try {
        setSavedPalettes(JSON.parse(storedPalettes));
      } catch (e) {
        console.error("Failed to load saved palettes:", e);
      }
    }

    // Load saved themes (for the dropdown)
    const storedThemes = localStorage.getItem(THEMES_STORAGE_KEY);
    if (storedThemes) {
      try {
        setSavedThemes(JSON.parse(storedThemes));
      } catch (e) {
        console.error("Failed to load saved themes:", e);
      }
    }
  }, [open]);

  // Standard History Logic
  const updateThemeWithHistory = (newTheme: CustomTheme) => {
    setTheme(newTheme);
    setThemeHistory((prev) => {
      const newHistory = prev.slice(0, historyIndex + 1);
      return [...newHistory, newTheme];
    });
    setHistoryIndex((prev) => prev + 1);
  };

  const canUndo = historyIndex > 0;
  const canRedo = historyIndex < themeHistory.length - 1;

  const handleUndo = () => {
    if (canUndo) {
      const newIndex = historyIndex - 1;
      setHistoryIndex(newIndex);
      setTheme(themeHistory[newIndex]);
      toast.success("Undone");
    }
  };

  const handleRedo = () => {
    if (canRedo) {
      const newIndex = historyIndex + 1;
      setHistoryIndex(newIndex);
      setTheme(themeHistory[newIndex]);
      toast.success("Redone");
    }
  };

  // Standard Preview Logic
  useEffect(() => {
    if (previewMode && open) {
      applyThemePreview(theme);
    }
    return () => {
      if (previewMode) removeThemePreview();
    };
  }, [previewMode, theme, open]);

  const applyThemePreview = (themeData: CustomTheme) => {
    const root = document.documentElement;
    Object.entries(themeData.colors).forEach(([key, value]) => {
      const cssVar = `--${key.replace(/([A-Z])/g, "-$1").toLowerCase()}`;
      root.style.setProperty(cssVar, value);
    });

    if (themeData.backgroundImage && themeData.backgroundImage.url) {
      const bg = themeData.backgroundImage;
      const body = document.body;

      // Apply background styles
      body.style.backgroundImage = `url(${bg.url})`;
      body.style.backgroundSize = bg.size === "stretch" ? "100% 100%" : bg.size;
      body.style.backgroundPosition = bg.position.replace("-", " ");
      body.style.backgroundRepeat = bg.repeat;
      body.style.backgroundAttachment = bg.attachment;

      // Apply overlay and filters via CSS variables (consumed by body::before)
      root.style.setProperty("--bg-blur", `${bg.blur}px`);
      root.style.setProperty("--bg-opacity", `${bg.opacity / 100}`);
      root.style.setProperty("--overlay-color", bg.overlayColor);
      root.style.setProperty("--overlay-opacity", `${bg.overlayOpacity}%`);
      root.style.setProperty("--bg-filter-grayscale", `${bg.filter.grayscale}%`);
      root.style.setProperty("--bg-filter-sepia", `${bg.filter.sepia}%`);
      root.style.setProperty("--bg-filter-brightness", `${bg.filter.brightness}%`);
      root.style.setProperty("--bg-filter-contrast", `${bg.filter.contrast}%`);
      root.style.setProperty("--bg-filter-saturate", `${bg.filter.saturate}%`);
    }
  };

  const removeThemePreview = () => {
    const root = document.documentElement;
    const body = document.body;

    Object.keys(theme.colors).forEach((key) => {
      const cssVar = `--${key.replace(/([A-Z])/g, "-$1").toLowerCase()}`;
      root.style.removeProperty(cssVar);
    });

    // Remove background styles from body
    body.style.backgroundImage = "";
    body.style.backgroundSize = "";
    body.style.backgroundPosition = "";
    body.style.backgroundRepeat = "";
    body.style.backgroundAttachment = "";

    root.style.removeProperty("--bg-blur");
    root.style.removeProperty("--bg-opacity");
    root.style.removeProperty("--overlay-color");
    root.style.removeProperty("--overlay-opacity");
    root.style.removeProperty("--bg-filter-grayscale");
    root.style.removeProperty("--bg-filter-sepia");
    root.style.removeProperty("--bg-filter-brightness");
    root.style.removeProperty("--bg-filter-contrast");
    root.style.removeProperty("--bg-filter-saturate");
  };

  const handleColorChange = (colorKey: keyof CustomTheme["colors"], value: string) => {
    const newTheme = {
      ...theme,
      colors: { ...theme.colors, [colorKey]: value },
    };
    // Update LOCAL state immediately (fast)
    updateThemeWithHistory(newTheme);
  };

  const handleApplyHarmony = (harmonyColors: Partial<CustomTheme["colors"]>) => {
    const updatedColors = { ...theme.colors, ...harmonyColors };
    const optimizedColors = autoOptimizeThemeColors(updatedColors) as CustomTheme["colors"];
    const newTheme = { ...theme, colors: optimizedColors };
    updateThemeWithHistory(newTheme);
  };

  const handleAutoOptimize = () => {
    const optimizedColors = autoOptimizeThemeColors(theme.colors) as CustomTheme["colors"];
    const newTheme = { ...theme, colors: optimizedColors };
    updateThemeWithHistory(newTheme);
    toast.success("Text colors optimized for readability");
  };

  const handleImagePaletteUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    toast.info("Extracting colors from image...");

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        // Scale down large images for faster processing
        const maxSize = 400;
        const scale = Math.min(1, maxSize / Math.max(img.width, img.height));
        canvas.width = img.width * scale;
        canvas.height = img.height * scale;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        
        // Extract 6 colors for better variety
        const dominantColors = extractColorsFromImage(imageData, 6);

        if (dominantColors.length >= 4) {
          // Generate a complete, optimized theme from the colors
          const generatedColors = generateThemeFromImageColors(dominantColors);
          
          if (Object.keys(generatedColors).length > 0) {
            const newTheme = {
              ...theme,
              colors: {
                ...theme.colors,
                ...generatedColors,
              } as typeof theme.colors,
            };
            updateThemeWithHistory(newTheme);
            toast.success(`Generated theme with ${dominantColors.length} colors!`);
          } else {
            // Fallback to simple color assignment
            const newTheme = {
              ...theme,
              colors: {
                ...theme.colors,
                primary: dominantColors[0],
                secondary: dominantColors[1],
                accent: dominantColors[2],
                background: dominantColors[dominantColors.length - 1],
              },
            };
            updateThemeWithHistory(newTheme);
            toast.success("Colors extracted from image!");
          }
        } else {
          toast.error("Could not extract enough colors from the image");
        }
      };
      img.onerror = () => {
        toast.error("Failed to load image");
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleSavePalette = () => {
    const paletteName = prompt("Enter a name for this palette:");
    if (!paletteName) return;

    const newPalette: SavedPalette = {
      id: Date.now().toString(),
      name: paletteName,
      colors: { ...theme.colors },
    };

    const updated = [...savedPalettes, newPalette];
    setSavedPalettes(updated);
    // Save to INTERNAL palettes storage (NOT the themes dropdown)
    localStorage.setItem(PALETTES_STORAGE_KEY, JSON.stringify(updated));
    toast.success(`Palette "${paletteName}" saved!`);
  };

  const handleLoadPalette = (palette: SavedPalette) => {
    const newTheme = {
      ...theme,
      name: palette.name, // Ensure the name updates too!
      colors: palette.colors,
      backgroundImage: palette.backgroundImage || theme.backgroundImage, // Restore background image
    };
    updateThemeWithHistory(newTheme);
    toast.success(`Palette "${palette.name}" loaded`);
  };

  const handleDeletePalette = (paletteId: string) => {
    const updated = savedPalettes.filter((p) => p.id !== paletteId);
    setSavedPalettes(updated);
    // Delete from INTERNAL palettes storage
    localStorage.setItem(PALETTES_STORAGE_KEY, JSON.stringify(updated));
    toast.success("Palette deleted");
  };

  const handleSave = async () => {
    // OPTIMISTIC SAVE: Save to LocalStorage IMMEDIATELY
    const themeName = theme.name?.trim() || "Untitled Theme";

    // Validate base64 image size (warn if > 1MB, which could cause localStorage issues)
    const bgImageUrl = theme.backgroundImage?.url || "";
    if (bgImageUrl.startsWith("data:image")) {
      const base64Size = Math.ceil((bgImageUrl.length * 3) / 4); // Approximate byte size
      const sizeMB = base64Size / (1024 * 1024);
      console.log(`[Theme] Background image size: ${sizeMB.toFixed(2)}MB`);
      
      if (sizeMB > 4) {
        toast.error("Background image is too large (>4MB). Please use a smaller image or an external URL.");
        return;
      } else if (sizeMB > 1) {
        toast.warning(`Large image (${sizeMB.toFixed(1)}MB) may cause sync issues. Consider using an external URL.`);
      }
    }

    // Check if we're editing an existing theme by ID (most reliable) or by name fallback
    // Priority: 1) existingThemeId prop, 2) match by existingTheme.name
    let existingThemeEntry: SavedPalette | null = null;

    if (existingThemeId) {
      // Best case: we have the exact ID to match
      existingThemeEntry = savedThemes.find((t) => t.id === existingThemeId) || null;
    } else if (existingTheme) {
      // Fallback: match by original name (for backwards compatibility)
      existingThemeEntry = savedThemes.find((t) => t.name === existingTheme.name) || null;
    }

    const isNewTheme = !existingThemeEntry;

    // FREE TIER LIMIT: Max 3 custom themes for free users
    if (!isPremium && isNewTheme && savedThemes.length >= 3) {
      toast.error("Free tier limit reached! Upgrade to Premium for unlimited themes.");
      return;
    }

    // For new themes, check if a theme with the same name already exists
    let finalName = themeName;
    if (isNewTheme) {
      const nameConflict = savedThemes.find((t) => t.name === themeName);
      if (nameConflict) {
        // Append a number to make it unique
        let counter = 2;
        let uniqueName = `${themeName} (${counter})`;
        while (savedThemes.find((t) => t.name === uniqueName)) {
          counter++;
          uniqueName = `${themeName} (${counter})`;
        }
        finalName = uniqueName;
      }
    }

    // Generate a unique ID for NEW themes using timestamp + random suffix
    // Only reuse an existing ID if we're explicitly editing a saved theme
    const themeId = existingThemeEntry?.id || generateUniqueId();

    const savedThemeEntry: SavedPalette = {
      id: themeId,
      name: finalName,
      colors: { ...theme.colors },
      backgroundImage: theme.backgroundImage, // Preserve background image
    };

    // Debug: Log what we're saving
    console.log("[Theme] Saving theme:", {
      name: finalName,
      hasBackgroundImage: !!theme.backgroundImage?.url,
      backgroundImageUrlPreview: theme.backgroundImage?.url?.substring(0, 80),
      blur: theme.backgroundImage?.blur,
      opacity: theme.backgroundImage?.opacity,
    });

    // If editing an existing theme (matched by ID), update it; otherwise, append
    const existingIndex = existingThemeEntry
      ? savedThemes.findIndex((t) => t.id === existingThemeEntry.id)
      : -1;
    let updatedThemes: SavedPalette[];

    if (existingIndex !== -1) {
      // Update existing theme
      updatedThemes = [...savedThemes];
      updatedThemes[existingIndex] = savedThemeEntry;
    } else {
      // Append new theme
      updatedThemes = [...savedThemes, savedThemeEntry];
    }

    // 1. Save to THEMES storage (for the ThemeSwitcher dropdown)
    try {
      localStorage.setItem(THEMES_STORAGE_KEY, JSON.stringify(updatedThemes));
      setSavedThemes(updatedThemes);
    } catch (storageError) {
      console.error("[Theme] Failed to save to localStorage:", storageError);
      toast.error("Failed to save theme - storage may be full. Try using an external image URL instead.");
      return;
    }

    // Notify ThemeSwitcher component to reload saved themes
    window.dispatchEvent(new Event("theme-saved"));

    // 2. Update theme with final name and notify parent
    const finalTheme = { ...theme, name: finalName };
    onSave(finalTheme);
    toast.success(`Theme "${finalName}" saved!`);
    removeThemePreview();
    setPreviewMode(false);
    onOpenChange(false);

    // 3. Sync to Cloud using the "Bouncer" (Safe Write)
    // This syncs both the active theme AND the saved themes library
    if (user) {
      executeWrite(
        async () => {
          const { data } = await supabase.from("profiles").select("preferences").eq("id", user.id).single();

          const currentPreferences = (data?.preferences as any) || {};
          await supabase
            .from("profiles")
            .update({
              preferences: {
                ...currentPreferences,
                customTheme: finalTheme,
                savedCustomThemes: updatedThemes, // Sync the entire themes library
              },
            })
            .eq("id", user.id);
        },
        () => {
          console.log("[Theme] Synced to cloud successfully (active theme + library)");
        },
        (error) => {
          console.error("[Theme] Failed to sync to cloud:", error);
          toast.error("Theme saved locally but cloud sync failed. It will retry on next save.");
        },
      );
    }
  };

  const handleClose = () => {
    removeThemePreview();
    setPreviewMode(false);
    onOpenChange(false);
  };

  const colorFields: { key: keyof CustomTheme["colors"]; label: string }[] = [
    { key: "background", label: "Background" },
    { key: "foreground", label: "Foreground" },
    { key: "card", label: "Card" },
    { key: "cardForeground", label: "Card Foreground" },
    { key: "primary", label: "Primary" },
    { key: "primaryForeground", label: "Primary Foreground" },
    { key: "secondary", label: "Secondary" },
    { key: "secondaryForeground", label: "Secondary Foreground" },
    { key: "accent", label: "Accent" },
    { key: "accentForeground", label: "Accent Foreground" },
    { key: "muted", label: "Muted" },
    { key: "mutedForeground", label: "Muted Foreground" },
    { key: "border", label: "Border" },
    { key: "input", label: "Input" },
  ];

  return (
    <Sheet open={open} onOpenChange={handleClose} modal={false}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-2xl overflow-y-auto"
        onInteractOutside={(e) => e.preventDefault()}
      >
        <SheetHeader>
          <SheetTitle>Custom Theme Builder</SheetTitle>
        </SheetHeader>

        {/* UI renders immediately (No loading blocker) */}

        <div className="space-y-6 mt-6">
          <div className="space-y-2">
            <Label>Theme Name</Label>
            <Input
              value={theme.name}
              onChange={(e) => updateThemeWithHistory({ ...theme, name: e.target.value })}
              placeholder="My Custom Theme"
            />
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant={previewMode ? "default" : "outline"}
              onClick={() => setPreviewMode(!previewMode)}
              className="flex-1"
            >
              {previewMode ? "Preview Active ✨" : "Enable Live Preview"}
            </Button>
            <Button variant="outline" size="icon" onClick={handleUndo} disabled={!canUndo} title="Undo">
              <Undo2 className="w-4 h-4" />
            </Button>
            <Button variant="outline" size="icon" onClick={handleRedo} disabled={!canRedo} title="Redo">
              <Redo2 className="w-4 h-4" />
            </Button>
          </div>

          {previewMode && (
            <Card className="p-4 space-y-2 bg-card text-card-foreground">
              <h3 className="font-semibold text-primary">Preview Card</h3>
              <p className="text-muted-foreground">This is how muted text looks</p>
              <div className="flex gap-2">
                <Button size="sm">Primary Button</Button>
                <Button size="sm" variant="secondary">
                  Secondary
                </Button>
                <Button size="sm" variant="outline">
                  Outline
                </Button>
              </div>
            </Card>
          )}

          <Tabs defaultValue="colors" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="colors">
                <Palette className="w-4 h-4 mr-2" />
                Colors
              </TabsTrigger>
              <TabsTrigger value="background">
                <ImageIcon className="w-4 h-4 mr-2" />
                Background
              </TabsTrigger>
            </TabsList>

            <TabsContent value="colors" className="space-y-6 mt-4">
              {/* Generate from Image */}
              <div className="space-y-4 pb-4 border-b">
                <div>
                  <h3 className="font-semibold mb-2">Generate from Image</h3>
                  <p className="text-sm text-muted-foreground mb-4">Upload an image to extract its dominant colors</p>
                </div>
                <input
                  ref={paletteImageRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImagePaletteUpload}
                  className="hidden"
                />
                <Button variant="outline" className="w-full" onClick={() => paletteImageRef.current?.click()}>
                  <Upload className="w-4 h-4 mr-2" />
                  Upload Image to Extract Colors
                </Button>
              </div>

              {/* My Saved Palettes */}
              <div className="space-y-4 pb-4 border-b">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold mb-2">My Saved Palettes</h3>
                    <p className="text-sm text-muted-foreground">Save and load your custom color combinations</p>
                  </div>
                  <Button size="sm" onClick={handleSavePalette} className="shrink-0">
                    <Save className="w-4 h-4 mr-2" />
                    Save Current
                  </Button>
                </div>
                {savedPalettes.length > 0 ? (
                  <div className="grid grid-cols-1 gap-2 mt-4">
                    {savedPalettes.map((palette) => (
                      <button
                        key={palette.id}
                        onClick={() => handleLoadPalette(palette)}
                        className="flex items-center gap-3 p-3 rounded-lg border hover:border-primary transition-colors group"
                      >
                        <div className="flex gap-1 h-8 flex-1">
                          <div className="flex-1 rounded" style={{ background: `hsl(${palette.colors.primary})` }} />
                          <div className="flex-1 rounded" style={{ background: `hsl(${palette.colors.secondary})` }} />
                          <div className="flex-1 rounded" style={{ background: `hsl(${palette.colors.accent})` }} />
                          <div className="flex-1 rounded" style={{ background: `hsl(${palette.colors.background})` }} />
                        </div>
                        <span className="text-sm font-medium flex-shrink-0">{palette.name}</span>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeletePalette(palette.id);
                          }}
                          className="opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </button>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No saved palettes yet. Click "Save Current" to save your first palette.
                  </p>
                )}
              </div>

              {/* Color Pickers */}
              <div className="space-y-4">
                <Collapsible open={showHarmonyGenerator} onOpenChange={setShowHarmonyGenerator}>
                  <CollapsibleTrigger asChild>
                    <Button variant="outline" className="w-full justify-between">
                      <span className="flex items-center gap-2">
                        <Palette className="w-4 h-4" />
                        Color Harmony Generator
                      </span>
                      <ChevronDown
                        className={`w-4 h-4 transition-transform ${showHarmonyGenerator ? "rotate-180" : ""}`}
                      />
                    </Button>
                  </CollapsibleTrigger>
                  <CollapsibleContent className="pt-4">
                    <ColorHarmonyGenerator baseColor={theme.colors.primary} onApplyHarmony={handleApplyHarmony} />
                  </CollapsibleContent>
                </Collapsible>
                <Button variant="outline" onClick={handleAutoOptimize} className="w-full">
                  <Wand2 className="w-4 h-4 mr-2" />
                  Auto-Optimize Text Contrast
                </Button>
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
                {/* ... Background controls ... */}
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
                              backgroundImage: { ...theme.backgroundImage!, url },
                            });
                          };
                          reader.readAsDataURL(file);
                        }
                      }}
                      className="flex-1"
                    />
                  </div>
                  <Input
                    value={theme.backgroundImage?.url || ""}
                    onChange={(e) =>
                      setTheme({
                        ...theme,
                        backgroundImage: { ...theme.backgroundImage!, url: e.target.value },
                      })
                    }
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
                          onValueChange={(value: any) =>
                            setTheme({
                              ...theme,
                              backgroundImage: { ...theme.backgroundImage!, size: value },
                            })
                          }
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
                          onValueChange={(value: any) =>
                            setTheme({
                              ...theme,
                              backgroundImage: { ...theme.backgroundImage!, position: value },
                            })
                          }
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
                          onValueChange={(value: any) =>
                            setTheme({
                              ...theme,
                              backgroundImage: { ...theme.backgroundImage!, repeat: value },
                            })
                          }
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
                          onValueChange={(value: any) =>
                            setTheme({
                              ...theme,
                              backgroundImage: { ...theme.backgroundImage!, attachment: value },
                            })
                          }
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
                            onValueChange={([value]) =>
                              setTheme({
                                ...theme,
                                backgroundImage: { ...theme.backgroundImage!, opacity: value },
                              })
                            }
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
                            onValueChange={([value]) =>
                              setTheme({
                                ...theme,
                                backgroundImage: { ...theme.backgroundImage!, blur: value },
                              })
                            }
                            min={0}
                            max={20}
                            step={1}
                          />
                        </div>

                        <div className="space-y-2">
                          <Label>Overlay Color (HSL)</Label>
                          <Input
                            value={theme.backgroundImage.overlayColor}
                            onChange={(e) =>
                              setTheme({
                                ...theme,
                                backgroundImage: { ...theme.backgroundImage!, overlayColor: e.target.value },
                              })
                            }
                            placeholder="0 0% 0%"
                            className="font-mono text-sm"
                          />
                        </div>

                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <Label>Overlay Opacity</Label>
                            <span className="text-sm text-muted-foreground">
                              {theme.backgroundImage.overlayOpacity}%
                            </span>
                          </div>
                          <Slider
                            value={[theme.backgroundImage.overlayOpacity]}
                            onValueChange={([value]) =>
                              setTheme({
                                ...theme,
                                backgroundImage: { ...theme.backgroundImage!, overlayOpacity: value },
                              })
                            }
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
                            <span className="text-sm text-muted-foreground">
                              {theme.backgroundImage.filter.grayscale}%
                            </span>
                          </div>
                          <Slider
                            value={[theme.backgroundImage.filter.grayscale]}
                            onValueChange={([value]) =>
                              setTheme({
                                ...theme,
                                backgroundImage: {
                                  ...theme.backgroundImage!,
                                  filter: { ...theme.backgroundImage!.filter, grayscale: value },
                                },
                              })
                            }
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
                            onValueChange={([value]) =>
                              setTheme({
                                ...theme,
                                backgroundImage: {
                                  ...theme.backgroundImage!,
                                  filter: { ...theme.backgroundImage!.filter, sepia: value },
                                },
                              })
                            }
                            min={0}
                            max={100}
                            step={1}
                          />
                        </div>

                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <Label>Brightness</Label>
                            <span className="text-sm text-muted-foreground">
                              {theme.backgroundImage.filter.brightness}%
                            </span>
                          </div>
                          <Slider
                            value={[theme.backgroundImage.filter.brightness]}
                            onValueChange={([value]) =>
                              setTheme({
                                ...theme,
                                backgroundImage: {
                                  ...theme.backgroundImage!,
                                  filter: { ...theme.backgroundImage!.filter, brightness: value },
                                },
                              })
                            }
                            min={0}
                            max={200}
                            step={1}
                          />
                        </div>

                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <Label>Contrast</Label>
                            <span className="text-sm text-muted-foreground">
                              {theme.backgroundImage.filter.contrast}%
                            </span>
                          </div>
                          <Slider
                            value={[theme.backgroundImage.filter.contrast]}
                            onValueChange={([value]) =>
                              setTheme({
                                ...theme,
                                backgroundImage: {
                                  ...theme.backgroundImage!,
                                  filter: { ...theme.backgroundImage!.filter, contrast: value },
                                },
                              })
                            }
                            min={0}
                            max={200}
                            step={1}
                          />
                        </div>

                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <Label>Saturation</Label>
                            <span className="text-sm text-muted-foreground">
                              {theme.backgroundImage.filter.saturate}%
                            </span>
                          </div>
                          <Slider
                            value={[theme.backgroundImage.filter.saturate]}
                            onValueChange={([value]) =>
                              setTheme({
                                ...theme,
                                backgroundImage: {
                                  ...theme.backgroundImage!,
                                  filter: { ...theme.backgroundImage!.filter, saturate: value },
                                },
                              })
                            }
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
        </div>

        <SheetFooter className="pt-4 border-t mt-6">
          <Button onClick={handleSave} className="flex-1">
            Save Theme
          </Button>
          <Button onClick={handleClose} variant="outline" className="flex-1">
            Cancel
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
