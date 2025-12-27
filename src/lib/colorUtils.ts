interface HSL {
  h: number;
  s: number;
  l: number;
}

interface RGB {
  r: number;
  g: number;
  b: number;
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
 * Convert HSL to RGB
 */
export const hslToRGB = (hsl: HSL): RGB => {
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

  return {
    r: Math.round(r * 255),
    g: Math.round(g * 255),
    b: Math.round(b * 255),
  };
};

/**
 * Calculate relative luminance using WCAG formula
 * Returns value between 0 (darkest) and 1 (lightest)
 */
export const calculateLuminance = (hsl: HSL): number => {
  const rgb = hslToRGB(hsl);
  
  const linearize = (c: number) => {
    const sRGB = c / 255;
    return sRGB <= 0.03928 ? sRGB / 12.92 : Math.pow((sRGB + 0.055) / 1.055, 2.4);
  };

  return 0.2126 * linearize(rgb.r) + 0.7152 * linearize(rgb.g) + 0.0722 * linearize(rgb.b);
};

/**
 * Calculate WCAG contrast ratio between two colors
 * Returns ratio from 1 (no contrast) to 21 (max contrast)
 */
export const calculateContrastRatio = (color1: HSL, color2: HSL): number => {
  const lum1 = calculateLuminance(color1);
  const lum2 = calculateLuminance(color2);
  const lighter = Math.max(lum1, lum2);
  const darker = Math.min(lum1, lum2);
  return (lighter + 0.05) / (darker + 0.05);
};

/**
 * Determine if a background is light or dark
 */
export const isLightBackground = (hsl: HSL): boolean => {
  return calculateLuminance(hsl) > 0.179; // WCAG midpoint threshold
};

/**
 * Get the perceived brightness of a color (0-255 scale)
 */
export const getPerceivedBrightness = (hsl: HSL): number => {
  const rgb = hslToRGB(hsl);
  // Formula accounts for human perception of color brightness
  return Math.sqrt(
    0.299 * (rgb.r * rgb.r) +
    0.587 * (rgb.g * rgb.g) +
    0.114 * (rgb.b * rgb.b)
  );
};

/**
 * Generate optimal foreground color for WCAG AAA compliance (7:1 ratio)
 * Uses intelligent adjustments that maintain hue relationship when possible
 */
export const generateOptimalForeground = (
  background: HSL, 
  targetRatio: number = 7.0,
  preferDark: boolean | null = null // null = auto-detect
): HSL => {
  const isLight = preferDark !== null ? preferDark : isLightBackground(background);
  
  // Start with extreme lightness
  let foreground: HSL = {
    h: background.h,
    s: Math.min(15, background.s * 0.3), // Desaturate for text readability
    l: isLight ? 5 : 98,
  };
  
  // Iteratively adjust lightness to meet target contrast ratio
  for (let i = 0; i < 50; i++) {
    const ratio = calculateContrastRatio(foreground, background);
    if (ratio >= targetRatio) break;
    
    if (isLight) {
      foreground.l = Math.max(0, foreground.l - 2);
    } else {
      foreground.l = Math.min(100, foreground.l + 2);
    }
  }
  
  return foreground;
};

/**
 * Smart foreground generation that considers hue harmony
 */
export const generateForegroundColor = (background: HSL, baseHue?: number): string => {
  const optimal = generateOptimalForeground(background, 4.5);
  if (baseHue !== undefined) {
    optimal.h = baseHue;
  }
  return formatHSL(optimal);
};

/**
 * Generate optimal card color based on background
 * Card should be subtly different from background for depth
 */
export const generateCardColor = (background: HSL): string => {
  const isLight = isLightBackground(background);
  
  return formatHSL({
    h: background.h,
    s: Math.max(background.s - 5, 0),
    l: isLight ? Math.max(background.l - 3, 92) : Math.min(background.l + 5, 25)
  });
};

/**
 * Ensure minimum WCAG contrast ratio between foreground and background
 * Automatically adjusts foreground to meet or exceed minRatio
 */
export const ensureContrast = (
  foreground: HSL, 
  background: HSL, 
  minRatio: number = 4.5 // WCAG AA standard
): string => {
  let currentRatio = calculateContrastRatio(foreground, background);
  
  if (currentRatio >= minRatio) {
    return formatHSL(foreground);
  }
  
  // Determine adjustment direction
  const bgLum = calculateLuminance(background);
  const isLightBg = bgLum > 0.179;
  
  // Clone foreground for adjustment
  const adjusted = { ...foreground };
  
  // Iteratively adjust lightness until contrast is met
  const step = isLightBg ? -3 : 3;
  for (let i = 0; i < 40; i++) {
    adjusted.l = Math.max(0, Math.min(100, adjusted.l + step));
    currentRatio = calculateContrastRatio(adjusted, background);
    if (currentRatio >= minRatio) break;
  }
  
  // If still not enough contrast, also reduce saturation for better readability
  if (currentRatio < minRatio) {
    adjusted.s = Math.max(0, adjusted.s - 20);
    adjusted.l = isLightBg ? 5 : 95;
  }
  
  return formatHSL(adjusted);
};

/**
 * Enhanced auto-optimize theme colors for WCAG compliance
 * Guarantees minimum 4.5:1 contrast for all text colors
 */
export const autoOptimizeThemeColors = (colors: Record<string, string>): Record<string, string> => {
  const background = parseHSL(colors.background || '0 0% 100%');
  const primary = parseHSL(colors.primary || '262 83% 58%');
  const secondary = parseHSL(colors.secondary || '220 14% 96%');
  const accent = parseHSL(colors.accent || '220 14% 96%');
  const card = parseHSL(colors.card || colors.background || '0 0% 100%');
  const muted = parseHSL(colors.muted || '220 14% 96%');
  
  // Calculate optimal text colors with proper contrast
  const generateTextColor = (bg: HSL, existingFg: string | undefined, minRatio: number = 4.5): string => {
    const existing = parseHSL(existingFg || '0 0% 50%');
    const currentRatio = calculateContrastRatio(existing, bg);
    
    // If already meets contrast, keep it
    if (currentRatio >= minRatio) {
      return formatHSL(existing);
    }
    
    // Generate new optimal foreground
    const optimal = generateOptimalForeground(bg, minRatio);
    return formatHSL(optimal);
  };
  
  // For primary/accent buttons, we want text that contrasts with THOSE colors
  const primaryFg = generateTextColor(primary, colors.primaryForeground, 4.5);
  const secondaryFg = generateTextColor(secondary, colors.secondaryForeground, 4.5);
  const accentFg = generateTextColor(accent, colors.accentForeground, 4.5);
  
  // For general text, contrast against background/card
  const foregroundOptimal = generateOptimalForeground(background, 7.0); // AAA for main text
  const cardFgOptimal = generateOptimalForeground(card, 7.0);
  const mutedFgOptimal = generateOptimalForeground(muted, 4.5); // AA for muted
  
  // Preserve some hue from background for harmonious muted text
  mutedFgOptimal.h = background.h;
  mutedFgOptimal.s = Math.min(20, background.s * 0.5);
  
  const optimized = {
    ...colors,
    // Optimized text colors
    foreground: formatHSL(foregroundOptimal),
    cardForeground: formatHSL(cardFgOptimal),
    primaryForeground: primaryFg,
    secondaryForeground: secondaryFg,
    accentForeground: accentFg,
    mutedForeground: ensureContrast(mutedFgOptimal, muted, 4.5),
  };
  
  return optimized;
};

/**
 * Intelligent color scheme from image with better palette generation
 * Extracts more colors and groups them better for theme usage
 */
export const extractColorsFromImage = (imageData: ImageData, numColors: number = 6): string[] => {
  const pixels = imageData.data;
  const colorBuckets: Map<string, { hsl: HSL; count: number }> = new Map();
  
  // Sample pixels (skip every 5 for better coverage)
  for (let i = 0; i < pixels.length; i += 20) {
    const r = pixels[i];
    const g = pixels[i + 1];
    const b = pixels[i + 2];
    const a = pixels[i + 3];
    
    // Skip transparent, near-white, and near-black pixels
    if (a < 50) continue;
    
    const hsl = rgbToHSL(r, g, b);
    
    // Skip very desaturated colors (grays) unless they're useful
    if (hsl.s < 8 && (hsl.l < 15 || hsl.l > 85)) continue;
    
    // Skip pure whites and blacks
    if (hsl.l > 97 || hsl.l < 3) continue;
    
    // Bucket colors into 15-degree hue segments, 10% saturation/lightness segments
    const bucketH = Math.round(hsl.h / 15) * 15;
    const bucketS = Math.round(hsl.s / 10) * 10;
    const bucketL = Math.round(hsl.l / 10) * 10;
    const key = `${bucketH}-${bucketS}-${bucketL}`;
    
    const existing = colorBuckets.get(key);
    if (existing) {
      existing.count++;
      // Average the HSL values for smoother colors
      existing.hsl.h = (existing.hsl.h * (existing.count - 1) + hsl.h) / existing.count;
      existing.hsl.s = (existing.hsl.s * (existing.count - 1) + hsl.s) / existing.count;
      existing.hsl.l = (existing.hsl.l * (existing.count - 1) + hsl.l) / existing.count;
    } else {
      colorBuckets.set(key, { hsl: { ...hsl }, count: 1 });
    }
  }
  
  // Sort by frequency and get top colors
  const sortedColors = Array.from(colorBuckets.values())
    .filter(c => c.count > 5) // Minimum threshold
    .sort((a, b) => b.count - a.count);
  
  // Select diverse colors (avoid too similar hues)
  const selectedColors: HSL[] = [];
  const minHueDiff = 25; // Minimum hue difference for variety
  
  for (const colorData of sortedColors) {
    if (selectedColors.length >= numColors) break;
    
    const isDifferentEnough = selectedColors.every(existing => {
      const hueDiff = Math.abs(existing.h - colorData.hsl.h);
      const normalizedDiff = Math.min(hueDiff, 360 - hueDiff);
      return normalizedDiff > minHueDiff || Math.abs(existing.l - colorData.hsl.l) > 20;
    });
    
    if (isDifferentEnough || selectedColors.length === 0) {
      selectedColors.push(colorData.hsl);
    }
  }
  
  // Sort by vibrancy (saturation * distance from middle lightness)
  selectedColors.sort((a, b) => {
    const vibrancyA = a.s * (1 - Math.abs(a.l - 50) / 50);
    const vibrancyB = b.s * (1 - Math.abs(b.l - 50) / 50);
    return vibrancyB - vibrancyA;
  });
  
  // Generate variations if we didn't find enough colors
  while (selectedColors.length < numColors) {
    const baseColor = selectedColors[0] || { h: 262, s: 83, l: 58 };
    const index = selectedColors.length;
    
    // Create variations with different lightness and shifted hues
    const variation: HSL = {
      h: (baseColor.h + index * 30) % 360,
      s: Math.max(20, Math.min(90, baseColor.s - index * 8)),
      l: Math.max(20, Math.min(80, baseColor.l + (index % 2 === 0 ? 15 : -15))),
    };
    selectedColors.push(variation);
  }
  
  return selectedColors.slice(0, numColors).map(formatHSL);
};

/**
 * Generate a complete theme color palette from extracted image colors
 */
export const generateThemeFromImageColors = (extractedColors: string[]): Record<string, string> => {
  if (extractedColors.length < 4) {
    console.warn('Need at least 4 colors to generate theme');
    return {};
  }
  
  const colors = extractedColors.map(parseHSL);
  
  // Sort by vibrancy to pick best primary
  const byVibrancy = [...colors].sort((a, b) => {
    const vA = a.s * (1 - Math.abs(a.l - 50) / 50);
    const vB = b.s * (1 - Math.abs(b.l - 50) / 50);
    return vB - vA;
  });
  
  // Sort by lightness to find good background candidates
  const byLightness = [...colors].sort((a, b) => b.l - a.l);
  
  // Pick colors intelligently
  const primary = byVibrancy[0];
  const accent = byVibrancy.length > 1 ? byVibrancy[1] : { ...primary, h: (primary.h + 30) % 360 };
  
  // Background should be light or dark based on the overall palette mood
  const avgLightness = colors.reduce((sum, c) => sum + c.l, 0) / colors.length;
  const isDarkTheme = avgLightness < 50;
  
  let background: HSL;
  let card: HSL;
  
  if (isDarkTheme) {
    // Find darkest color for background
    background = byLightness[byLightness.length - 1];
    background = { ...background, l: Math.min(25, background.l), s: Math.max(10, background.s * 0.5) };
    card = { ...background, l: background.l + 5, s: background.s + 5 };
  } else {
    // Find lightest for background
    background = byLightness[0];
    background = { ...background, l: Math.max(90, background.l), s: Math.min(20, background.s * 0.3) };
    card = { ...background, l: background.l - 3, s: background.s + 2 };
  }
  
  // Secondary should be complementary or analogous
  const secondary: HSL = {
    h: (primary.h + 180) % 360,
    s: Math.min(60, primary.s * 0.7),
    l: isDarkTheme ? 40 : 60,
  };
  
  // Generate muted and border colors
  const muted: HSL = {
    h: background.h,
    s: Math.min(20, background.s),
    l: isDarkTheme ? 30 : 85,
  };
  
  const border: HSL = {
    h: background.h,
    s: Math.min(15, background.s),
    l: isDarkTheme ? 25 : 80,
  };
  
  const input: HSL = {
    h: background.h,
    s: Math.min(15, background.s),
    l: isDarkTheme ? 20 : 95,
  };
  
  // Generate theme with auto-optimized foreground colors
  const themeColors = {
    background: formatHSL(background),
    foreground: formatHSL(generateOptimalForeground(background, 7.0)),
    card: formatHSL(card),
    cardForeground: formatHSL(generateOptimalForeground(card, 7.0)),
    primary: formatHSL(primary),
    primaryForeground: formatHSL(generateOptimalForeground(primary, 4.5)),
    secondary: formatHSL(secondary),
    secondaryForeground: formatHSL(generateOptimalForeground(secondary, 4.5)),
    accent: formatHSL(accent),
    accentForeground: formatHSL(generateOptimalForeground(accent, 4.5)),
    muted: formatHSL(muted),
    mutedForeground: formatHSL(generateOptimalForeground(muted, 4.5)),
    border: formatHSL(border),
    input: formatHSL(input),
  };
  
  return themeColors;
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

/**
 * Check if a color combination meets WCAG AA standards
 */
export const meetsWCAG_AA = (foreground: HSL, background: HSL): boolean => {
  return calculateContrastRatio(foreground, background) >= 4.5;
};

/**
 * Check if a color combination meets WCAG AAA standards
 */
export const meetsWCAG_AAA = (foreground: HSL, background: HSL): boolean => {
  return calculateContrastRatio(foreground, background) >= 7.0;
};
