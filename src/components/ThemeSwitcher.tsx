import { useState, useEffect } from "react";
import { Palette, Plus, Edit, Trash2 } from "lucide-react";
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
  onThemeChange: (theme: Theme) => void;
  // Renamed prop to match intent: Open the builder for a NEW theme
  onCustomThemeClick?: () => void;
  // New prop: Open builder with a SPECIFIC saved theme loaded
  onEditCustomTheme?: (theme: CustomTheme) => void;
  onDeleteCustomTheme?: () => void; // Kept for backward compatibility but unused internally now
  onUseAsTemplate?: (
    theme: "orchid" | "jellyfish" | "sunset" | "bluebonnet" | "ocean" | "forest" | "midnight" | "candy",
  ) => void;
}

interface SavedPalette {
  id: string;
  name: string;
  colors: CustomTheme["colors"];
}

export function ThemeSwitcher({
  currentTheme,
  onThemeChange,
  onCustomThemeClick,
  onEditCustomTheme,
  onUseAsTemplate,
}: ThemeSwitcherProps) {
  const [savedThemes, setSavedThemes] = useState<SavedPalette[]>([]);

  // Function to load saved themes from local storage
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

  // Initial load
  useEffect(() => {
    loadSavedThemes();

    // Listen for custom event triggered by the builder when saving
    // This makes the list update instantly without refresh!
    const handleThemeSaved = () => loadSavedThemes();
    window.addEventListener("theme-saved", handleThemeSaved);

    // Also listen for storage events (if changed in another tab)
    window.addEventListener("storage", handleThemeSaved);

    return () => {
      window.removeEventListener("theme-saved", handleThemeSaved);
      window.removeEventListener("storage", handleThemeSaved);
    };
  }, []);

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm("Are you sure you want to delete this theme?")) {
      const newThemes = savedThemes.filter((t) => t.id !== id);
      localStorage.setItem("saved_custom_palettes", JSON.stringify(newThemes));
      setSavedThemes(newThemes);
      // If the deleted theme was active, maybe revert to default? (Optional logic)
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="icon" className="relative">
          <Palette className="h-5 w-5" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64 max-h-[80vh] overflow-y-auto">
        {/* SECTION 1: PRESETS */}
        <DropdownMenuLabel>Preset Themes</DropdownMenuLabel>
        {themes.map((theme) => (
          <DropdownMenuItem key={theme.value} className="flex items-center justify-between cursor-pointer group">
            <div className="flex items-center gap-3 flex-1" onClick={() => onThemeChange(theme.value)}>
              <div className={`w-8 h-8 rounded ${theme.colors}`} />
              <span className={currentTheme === theme.value ? "font-semibold" : ""}>{theme.label}</span>
            </div>
            {onUseAsTemplate && (
              <Button
                size="sm"
                variant="ghost"
                className="opacity-0 group-hover:opacity-100 h-6 px-2"
                onClick={(e) => {
                  e.stopPropagation();
                  onUseAsTemplate(theme.value as any);
                }}
                title="Use as template"
              >
                <Edit className="w-3 h-3" />
              </Button>
            )}
          </DropdownMenuItem>
        ))}

        {/* SECTION 2: MY SAVED THEMES (Dynamic!) */}
        {savedThemes.length > 0 && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuLabel>My Custom Themes</DropdownMenuLabel>
            {savedThemes.map((savedTheme) => (
              <DropdownMenuItem key={savedTheme.id} className="flex items-center justify-between cursor-pointer group">
                <div
                  className="flex items-center gap-3 flex-1"
                  onClick={() => {
                    // When clicking a saved theme, apply it!
                    // Note: You might need to update your parent component to handle loading a custom theme object
                    // For now, we simulate switching to 'custom' and maybe the parent loads the data?
                    // Ideally, onThemeChange should handle this, or we emit a separate event.
                    // Assuming the app state handles 'custom' looking at the profile preferences.
                    // For simplicity, let's just trigger the 'Edit' flow which loads it into the builder/app.
                    if (onEditCustomTheme) {
                      // Construct a full CustomTheme object to pass back
                      const fullTheme: CustomTheme = {
                        name: savedTheme.name,
                        colors: savedTheme.colors,
                        // Fallback for background since savedPalette might not have it
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
                          filter: { grayscale: 0, sepia: 0, brightness: 100, contrast: 100, saturate: 100 },
                        },
                      };
                      onEditCustomTheme(fullTheme);
                    }
                  }}
                >
                  <div className="w-8 h-8 rounded border" style={{ background: `hsl(${savedTheme.colors.primary})` }} />
                  <span className="truncate max-w-[120px]">{savedTheme.name}</span>
                </div>

                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  {onEditCustomTheme && (
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-6 w-6 p-0"
                      onClick={(e) => {
                        e.stopPropagation();
                        // Construct theme object for editing
                        const fullTheme: CustomTheme = {
                          name: savedTheme.name,
                          colors: savedTheme.colors,
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
                            filter: { grayscale: 0, sepia: 0, brightness: 100, contrast: 100, saturate: 100 },
                          },
                        };
                        onEditCustomTheme(fullTheme);
                      }}
                    >
                      <Edit className="w-3 h-3" />
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-6 w-6 p-0 text-destructive hover:text-destructive"
                    onClick={(e) => handleDelete(savedTheme.id, e)}
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              </DropdownMenuItem>
            ))}
          </>
        )}

        <DropdownMenuSeparator />

        {/* CREATE NEW BUTTON */}
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
