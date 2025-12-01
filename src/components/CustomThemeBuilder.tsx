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
import { autoOptimizeThemeColors, extractColorsFromImage } from "@/lib/colorUtils";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
// Import the Bouncer logic
import { useDatabaseWrite } from "@/hooks/useDatabaseWrite";

interface CustomThemeBuilderProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (theme: CustomTheme) => void;
  existingTheme?: CustomTheme;
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
      primaryForeground: "0 0%