interface HSL {
  h: number;
  s: number;
  l: number;
}

export const parseHSL = (hsl: string): HSL => {
  const parts = hsl.trim().split(/\s+/);
  return {
    h: parseFloat(parts[0]) || 0,
    s: parseFloat(parts[1]) || 0,
    l: parseFloat(parts[2]) || 0,
  };
};

export const formatHSL = (hsl: HSL): string => {
  return `${Math.round(hsl.h)} ${Math.round(hsl.s)}% ${Math.round(hsl.l)}%`;
};

/**
 * Calculate relative luminance of an HSL color
 * Returns value between 0 (darkest) and 1 (lightest)
 */
export const calculateLuminance = (hsl: HSL): number => {
  // Convert HSL to RGB first
  const h = hsl.h / 360;
  const s = hsl.s / 100;
  const l = hsl.l / 100;

  let r, g, b;

  if (s === 0) {
    r = g = b = l;
  } else {
    const hue2rgb = (p: number, q: number, t: number) => {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1/6) return p + (q - p) * 6 * t;
      if (t < 1/2) return q;
      if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
      return p;
    };

    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;

    r = hue2rgb(p, q, h + 1/3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1/3);
  }

  // Calculate relative luminance
  const linearize = (c: number) => {
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  };

  return 0.2126 * linearize(r) + 0.7152 * linearize(g) + 0.0722 * linearize(b);
};

/**
 * Determine if a background is light or dark
 */
export const isLightBackground = (hsl: HSL): boolean => {
  return calculateLuminance(hsl) > 0.5;
};

/**
 * Generate optimal foreground color for a given background
 * Returns a color with high contrast
 */
export const generateForegroundColor = (background: HSL, baseHue?: number): string => {
  const isLight = isLightBackground(background);
  
  // For light backgrounds, use dark text; for dark backgrounds, use light text
  if (isLight) {
    // Dark foreground
    return formatHSL({
      h: baseHue ?? background.h,
      s: Math.min(background.s * 0.3, 15),
      l: 15 // Very dark
    });
  } else {
    // Light foreground
    return formatHSL({
      h: baseHue ?? background.h,
      s: Math.min(background.s * 0.2, 10),
      l: 92 // Very light
    });
  }
};

/**
 * Generate optimal card color based on background
 * Card should be slightly different from background for depth
 */
export const generateCardColor = (background: HSL): string => {
  const isLight = isLightBackground(background);
  
  return formatHSL({
    h: background.h,
    s: background.s,
    l: isLight ? Math.max(background.l - 5, 95) : Math.min(background.l + 5, 20)
  });
};

/**
 * Ensure sufficient contrast between two colors
 * Returns adjusted color if contrast is too low
 */
export const ensureContrast = (foreground: HSL, background: HSL, minRatio: number = 4.5): string => {
  const fgLum = calculateLuminance(foreground);
  const bgLum = calculateLuminance(background);
  
  const ratio = (Math.max(fgLum, bgLum) + 0.05) / (Math.min(fgLum, bgLum) + 0.05);
  
  if (ratio >= minRatio) {
    return formatHSL(foreground);
  }
  
  // Adjust lightness to improve contrast
  const isLight = isLightBackground(background);
  const adjusted = { ...foreground };
  
  if (isLight) {
    // Make foreground darker
    adjusted.l = Math.max(10, adjusted.l - 20);
  } else {
    // Make foreground lighter
    adjusted.l = Math.min(95, adjusted.l + 20);
  }
  
  return formatHSL(adjusted);
};

/**
 * Auto-optimize ONLY foreground/text colors for contrast
 * Does NOT modify base colors (primary, secondary, accent, background, etc.)
 */
export const autoOptimizeThemeColors = (colors: Record<string, string>): Record<string, string> => {
  const background = parseHSL(colors.background || '0 0% 100%');
  const primary = parseHSL(colors.primary || '262 83% 58%');
  const secondary = parseHSL(colors.secondary || '220 14% 96%');
  const accent = parseHSL(colors.accent || '220 14% 96%');
  const card = parseHSL(colors.card || colors.background || '0 0% 100%');
  const muted = parseHSL(colors.muted || '220 14% 96%');
  
  const optimized = {
    ...colors, // Keep all base colors unchanged
    // Only optimize foreground/text colors
    foreground: ensureContrast(parseHSL(colors.foreground || '0 0% 0%'), background),
    cardForeground: ensureContrast(parseHSL(colors.cardForeground || colors.foreground || '0 0% 0%'), card),
    primaryForeground: ensureContrast(parseHSL(colors.primaryForeground || '0 0% 98%'), primary),
    secondaryForeground: ensureContrast(parseHSL(colors.secondaryForeground || '0 0% 0%'), secondary),
    accentForeground: ensureContrast(parseHSL(colors.accentForeground || '0 0% 0%'), accent),
    mutedForeground: ensureContrast(parseHSL(colors.mutedForeground || '0 0% 46%'), muted),
  };
  
  return optimized;
};

/**
 * Extract dominant colors from an image
 * Returns array of HSL color strings (always returns exactly numColors)
 */
export const extractColorsFromImage = (imageData: ImageData, numColors: number = 4): string[] => {
  const pixels = imageData.data;
  const colorCounts: Map<string, number> = new Map();
  
  // Sample pixels (skip every 10 for performance)
  for (let i = 0; i < pixels.length; i += 40) {
    const r = pixels[i];
    const g = pixels[i + 1];
    const b = pixels[i + 2];
    const a = pixels[i + 3];
    
    // More lenient filtering - only skip fully transparent or extreme whites/blacks
    if (a < 50 || (r > 250 && g > 250 && b > 250) || (r < 5 && g < 5 && b < 5)) continue;
    
    const hsl = rgbToHSL(r, g, b);
    // Group colors more loosely (20-degree buckets instead of 10)
    const key = `${Math.round(hsl.h / 20) * 20} ${Math.round(hsl.s / 15) * 15}% ${Math.round(hsl.l / 15) * 15}%`;
    colorCounts.set(key, (colorCounts.get(key) || 0) + 1);
  }
  
  // Sort by frequency and take top N
  const extractedColors = Array.from(colorCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, numColors)
    .map(([color]) => color);
  
  // If we didn't find enough colors, generate variations of what we found
  if (extractedColors.length < numColors) {
    const baseColor = extractedColors.length > 0 
      ? parseHSL(extractedColors[0]) 
      : { h: 262, s: 83, l: 58 }; // Default purple if no colors found
    
    // Fill remaining slots with lightness variations
    while (extractedColors.length < numColors) {
      const variation = {
        h: baseColor.h,
        s: Math.max(20, baseColor.s - (extractedColors.length * 10)),
        l: Math.min(85, Math.max(15, baseColor.l + ((extractedColors.length - 1) * 20)))
      };
      extractedColors.push(formatHSL(variation));
    }
  }
  
  return extractedColors;
};

/**
 * Convert RGB to HSL
 */
const rgbToHSL = (r: number, g: number, b: number): HSL => {
  r /= 255;
  g /= 255;
  b /= 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0, s = 0;
  const l = (max + min) / 2;

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
    l: Math.round(l * 100),
  };
};
