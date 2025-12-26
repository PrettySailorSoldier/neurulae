import { useState, useEffect } from "react";
import { Palette, Plus, Edit, Trash2, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import type { Theme, CustomTheme } from "@/types";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
// Import the Bouncer logic
import { useDatabaseWrite } from "@/hooks/useDatabaseWrite";

// Preset themes configuration
const themes: { value: Theme; label: string; colors: string }[] = [
  { value: "orchid", label: "Orchid Velvet", colors: "bg-gradient-to-r from-purple-600 to-pink-600" },
  { value: "jellyfish", label: "Jellyfish Dream", colors: "bg-gradient-to-r from-blue-900 to-purple-400" },
  { value: "sunset", label: "Liquid Sunset", colors: "bg-gradient-to-r from-orange-300 to-pink-400" },
  { value: "bluebonnet", label: "Bluebonnet Birch", colors: "bg-gradient-to-r from-blue-600 to-yellow-400" },
  { value: "ocean", label: "Ocean Breeze", colors: "bg-gradient-to-r from-cyan-700 to-teal-400" },
  { value: "forest", label: "Forest Calm", colors: "bg-gradient-to-r from-green-700 to-lime-500" },
  { value: "midnight", label: "Midnight Purple", colors: "bg-gradient-to-r from-purple-900 to-purple-500" },
  { value: "candy", label: "Candy Store", colors: "bg-gradient-to-r from-pink-400 to-cyan-400" },
];

interface ThemeSwitcherProps {
  currentTheme: Theme;
  currentCustomTheme?: CustomTheme | null; // The currently active custom theme (for showing checkmark)
  onThemeChange: (theme: Theme) => void;
  onCustomThemeClick?: () => void;
  onEditCustomTheme?: (theme?: CustomTheme, themeId?: string) => void; // Now includes ID for proper editing
  onDeleteCustomTheme?: () => void;
  onApplyCustomTheme?: (theme: CustomTheme) => void; // Apply a saved theme to local state
  onUseAsTemplate?: (
    theme: "orchid" | "jellyfish" | "sunset" | "bluebonnet" | "ocean" | "forest" | "midnight" | "candy",
  ) => void;
}

interface SavedPalette {
  id: string;
  name: string;
  colors: CustomTheme["colors"];
  backgroundImage?: CustomTheme["backgroundImage"];
}

export function ThemeSwitcher({
  currentTheme,
  currentCustomTheme,
  onThemeChange,
  onCustomThemeClick,
  onEditCustomTheme,
  onApplyCustomTheme,
  onUseAsTemplate,
}: ThemeSwitcherProps) {
  const [savedThemes, setSavedThemes] = useState<SavedPalette[]>([]);
  // Initialize the Bouncer hook
  const { executeWrite } = useDatabaseWrite();

  // Check if a saved theme is the currently active one
  const isThemeActive = (savedTheme: SavedPalette): boolean => {
    if (currentTheme !== 'custom' || !currentCustomTheme) return false;
    // Match by name since the active theme doesn't carry an ID
    return savedTheme.name === currentCustomTheme.name;
  };

  const loadSavedThemes = () => {
    try {
      const stored = localStorage.getItem("saved_custom_palettes");
      if (stored) {
        setSavedThemes(JSON.parse(stored));
      }
    } catch (e) {
      console.error("Failed to load saved themes", e);
    }
  };

  useEffect(() => {
    loadSavedThemes();
    const handleThemeSaved = () => loadSavedThemes();
    window.addEventListener("theme-saved", handleThemeSaved);
    window.addEventListener("storage", handleThemeSaved);
    return () => {
      window.removeEventListener("theme-saved", handleThemeSaved);
      window.removeEventListener("storage", handleThemeSaved);
    };
  }, []);

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm("Delete this theme?")) {
      const newThemes = savedThemes.filter((t) => t.id !== id);
      localStorage.setItem("saved_custom_palettes", JSON.stringify(newThemes));
      setSavedThemes(newThemes);
      toast.success("Theme deleted from library");
    }
  };

  // The logic to APPLY a theme directly from the list
  const handleApplySavedTheme = async (savedTheme: SavedPalette) => {
    // Reconstruct full theme object (SavedPalette may have backgroundImage)
    const defaultBgImage = {
      url: "",
      size: "cover" as const,
      position: "center" as const,
      repeat: "no-repeat" as const,
      attachment: "scroll" as const,
      opacity: 100,
      blur: 0,
      overlayColor: "0 0% 0%",
      overlayOpacity: 0,
      filter: { grayscale: 0, sepia: 0, brightness: 100, contrast: 100, saturate: 100 },
    };

    const fullTheme: CustomTheme = {
      name: savedTheme.name,
      colors: savedTheme.colors,
      backgroundImage: savedTheme.backgroundImage || defaultBgImage,
    };

    // 1. Apply theme to LOCAL state immediately (this actually changes the UI!)
    if (onApplyCustomTheme) {
      onApplyCustomTheme(fullTheme);
    }

    // 2. Switch to custom theme mode
    onThemeChange("custom");
    toast.success(`${savedTheme.name} applied!`);

    // 3. Sync to database in background
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    executeWrite(
      async () => {
        const { data } = await supabase.from("profiles").select("preferences").eq("id", user.id).single();
        const currentPreferences = (data?.preferences as any) || {};

        await supabase
          .from("profiles")
          .update({
            preferences: { ...currentPreferences, customTheme: fullTheme },
          })
          .eq("id", user.id);
      },
      () => console.log("Theme synced to cloud"),
      (error) => {
        console.error("Failed to sync applied theme", error);
      },
    );
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="icon" className="relative">
          <Palette className="h-5 w-5" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64 max-h-[80vh] overflow-y-auto">
        <DropdownMenuLabel>Preset Themes</DropdownMenuLabel>
        {themes.map((theme) => (
          <DropdownMenuItem
            key={theme.value}
            className="flex items-center justify-between cursor-pointer group"
            onClick={() => onThemeChange(theme.value)}
          >
            <div className="flex items-center gap-3 flex-1">
              <div className={`w-8 h-8 rounded ${theme.colors}`} />
              <span className={currentTheme === theme.value ? "font-semibold" : ""}>{theme.label}</span>
            </div>
            {currentTheme === theme.value && <Check className="w-4 h-4 text-primary" />}
          </DropdownMenuItem>
        ))}

        {savedThemes.length > 0 && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuLabel>My Custom Themes</DropdownMenuLabel>
            {savedThemes.map((savedTheme) => {
              const isActive = isThemeActive(savedTheme);
              return (
                <DropdownMenuItem
                  key={savedTheme.id}
                  className="flex items-center justify-between cursor-pointer group"
                  // CLICKING THE ROW NOW APPLIES THE THEME
                  onClick={() => handleApplySavedTheme(savedTheme)}
                >
                  <div className="flex items-center gap-3 flex-1 overflow-hidden">
                    <div
                      className="w-8 h-8 rounded border shrink-0"
                      style={{ background: `hsl(${savedTheme.colors.primary})` }}
                    />
                    <span className={`truncate ${isActive ? "font-semibold" : ""}`}>{savedTheme.name}</span>
                  </div>

                  {/* Show checkmark if this is the active theme */}
                  {isActive && <Check className="w-4 h-4 text-primary shrink-0 mr-1" />}

                  {/* ACTION BUTTONS */}
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity bg-popover pl-2">
                    {onEditCustomTheme && (
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-6 w-6 p-0 hover:text-primary"
                        onClick={(e) => {
                          e.stopPropagation(); // Stop it from Applying
                          // Construct theme for editor - use saved backgroundImage if available
                          const defaultBgImage = {
                            url: "",
                            size: "cover" as const,
                            position: "center" as const,
                            repeat: "no-repeat" as const,
                            attachment: "scroll" as const,
                            opacity: 100,
                            blur: 0,
                            overlayColor: "0 0% 0%",
                            overlayOpacity: 0,
                            filter: { grayscale: 0, sepia: 0, brightness: 100, contrast: 100, saturate: 100 },
                          };
                          const fullTheme: CustomTheme = {
                            name: savedTheme.name,
                            colors: savedTheme.colors,
                            backgroundImage: savedTheme.backgroundImage || defaultBgImage,
                          };
                          // Pass both the theme AND its ID for proper editing
                          onEditCustomTheme(fullTheme, savedTheme.id);
                        }}
                        title="Edit"
                      >
                        <Edit className="w-3 h-3" />
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive"
                      onClick={(e) => handleDelete(savedTheme.id, e)}
                      title="Delete"
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                </DropdownMenuItem>
              );
            })}
          </>
        )}

        <DropdownMenuSeparator />

        {onCustomThemeClick && (
          <DropdownMenuItem
            onClick={onCustomThemeClick}
            className="flex items-center gap-3 cursor-pointer text-primary focus:text-primary"
          >
            <Plus className="w-4 h-4" />
            <span className="font-semibold">Create New Theme</span>
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
