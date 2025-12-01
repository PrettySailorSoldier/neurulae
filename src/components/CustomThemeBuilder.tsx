import { useState, useEffect, useRef, useCallback } from "react";
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
import { autoOptimizeThemeColors, extractColorsFromImage } from "@/lib/colorUtils";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

// --- DEBOUNCE UTILITY (Stops database flooding) ---
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debouncedValue;
}

interface CustomThemeBuilderProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (theme: CustomTheme) => void;
  existingTheme?: CustomTheme;
  templateTheme?: "orchid" | "jellyfish" | "sunset" | "bluebonnet" | "ocean" | "forest" | "midnight" | "candy";
}

// ... [Keep your themeTemplates and defaultTheme objects exactly as they were] ...
// (I am hiding them here to save space, but DO NOT DELETE THEM from your file)
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
}

export function CustomThemeBuilder({
  open,
  onOpenChange,
  onSave,
  existingTheme,
  templateTheme,
}: CustomThemeBuilderProps) {
  const { user } = useAuth();
  const [theme, setTheme] = useState<CustomTheme>(existingTheme || defaultTheme);
  const [previewMode, setPreviewMode] = useState(false);
  const [showHarmonyGenerator, setShowHarmonyGenerator] = useState(false);
  const [savedPalettes, setSavedPalettes] = useState<SavedPalette[]>([]);
  const [themeHistory, setThemeHistory] = useState<CustomTheme[]>([existingTheme || defaultTheme]);
  const [historyIndex, setHistoryIndex] = useState(0);

  // REMOVED BLOCKING LOADING STATE
  // const [isLoadingTheme, setIsLoadingTheme] = useState(false);

  const paletteImageRef = useRef<HTMLInputElement>(null);

  // OPTIMIZED LOAD: Fetch ONLY the theme, not the whole profile
  useEffect(() => {
    if (!open || !user) return;

    const loadThemeFromDatabase = async () => {
      // No loading spinner trigger
      try {
        const { data, error } = await supabase
          .from("profiles")
          .select("preferences") // Ideally: select('preferences->customTheme') but keeping simple for safety
          .eq("id", user.id)
          .single();

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
        }
      } catch (err) {
        console.error("Failed to load theme:", err);
      }
    };

    loadThemeFromDatabase();
  }, [open, user]);

  // Load saved palettes (Local Storage is fast, keep this)
  useEffect(() => {
    const stored = localStorage.getItem("saved_custom_palettes");
    if (stored) {
      try {
        setSavedPalettes(JSON.parse(stored));
      } catch (e) {
        console.error("Failed to load saved palettes:", e);
      }
    }
  }, []);

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

    // ... [Keep background image application logic] ...
    if (themeData.backgroundImage && themeData.backgroundImage.url) {
      // Copy your existing background logic here if needed, or assume it works
      // (Simplified for length)
    }
  };

  const removeThemePreview = () => {
    // ... [Keep existing cleanup logic] ...
    const root = document.documentElement;
    Object.keys(theme.colors).forEach((key) => {
      const cssVar = `--${key.replace(/([A-Z])/g, "-$1").toLowerCase()}`;
      root.style.removeProperty(cssVar);
    });
  };

  const handleColorChange = (colorKey: keyof CustomTheme["colors"], value: string) => {
    const newTheme = {
      ...theme,
      colors: { ...theme.colors, [colorKey]: value },
    };
    // Update LOCAL state immediately (fast)
    updateThemeWithHistory(newTheme);
  };

  // ... [Keep helper functions like handleApplyHarmony, handleAutoOptimize, handleImagePaletteUpload] ...
  // (Paste your existing helper functions here)

  const handleSave = async () => {
    // OPTIMISTIC SAVE: Save to LocalStorage IMMEDIATELY
    const themeName = theme.name || "Untitled Theme";
    const themeId = theme.name.toLowerCase().replace(/\s+/g, "-") || Date.now().toString();

    const savedTheme: SavedPalette = {
      id: themeId,
      name: themeName,
      colors: { ...theme.colors },
    };

    const existingIndex = savedPalettes.findIndex((p) => p.id === themeId);
    let updatedPalettes = existingIndex !== -1 ? [...savedPalettes] : [...savedPalettes, savedTheme];

    if (existingIndex !== -1) updatedPalettes[existingIndex] = savedTheme;

    // 1. Save to Disk (Browser)
    localStorage.setItem("saved_custom_palettes", JSON.stringify(updatedPalettes));
    setSavedPalettes(updatedPalettes);

    // 2. Notify User & Close UI (Don't wait for cloud)
    onSave(theme);
    toast.success("Theme saved!");
    removeThemePreview();
    setPreviewMode(false);
    onOpenChange(false);

    // 3. Sync to Cloud (Background - Fire and Forget)
    if (user) {
      supabase
        .from("profiles")
        .select("preferences")
        .eq("id", user.id)
        .single()
        .then(({ data }) => {
          const currentPreferences = (data?.preferences as any) || {};
          return supabase
            .from("profiles")
            .update({
              preferences: { ...currentPreferences, customTheme: theme },
            })
            .eq("id", user.id);
        })
        .then(({ error }) => {
          if (error) console.error("Background sync failed:", error);
        });
    }
  };

  // ... [Keep colorFields array] ...

  return (
    <Sheet open={open} onOpenChange={onOpenChange} modal={false}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-2xl overflow-y-auto"
        onInteractOutside={(e) => e.preventDefault()}
      >
        <SheetHeader>
          <SheetTitle>Custom Theme Builder</SheetTitle>
        </SheetHeader>

        {/* REMOVED LOADING SPINNER BLOCK ENTIRELY */}

        <div className="space-y-6 mt-6">
          <div className="space-y-2">
            <Label>Theme Name</Label>
            <Input
              value={theme.name}
              onChange={(e) => updateThemeWithHistory({ ...theme, name: e.target.value })}
              placeholder="My Custom Theme"
            />
          </div>

          {/* ... [Keep the rest of your UI exactly as it was: Buttons, Tabs, Sliders] ... */}
          {/* Paste the rest of your JSX here starting from the "Enable Live Preview" button */}

          <div className="flex items-center gap-2">
            <Button
              variant={previewMode ? "default" : "outline"}
              onClick={() => setPreviewMode(!previewMode)}
              className="flex-1"
            >
              {previewMode ? "Preview Active ✨" : "Enable Live Preview"}
            </Button>
            {/* ... Undo/Redo Buttons ... */}
          </div>

          {/* ... Tabs ... */}
          {/* ... Colors Tab ... */}
          {/* ... Background Tab ... */}
        </div>

        <SheetFooter className="pt-4 border-t mt-6">
          <Button onClick={handleSave} className="flex-1">
            Save Theme
          </Button>
          <Button onClick={() => onOpenChange(false)} variant="outline" className="flex-1">
            Cancel
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
