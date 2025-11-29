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
 * Auto-optimize all theme colors based on background
 */
export const autoOptimizeThemeColors = (colors: Record<string, string>): Record<string, string> => {
  const background = parseHSL(colors.background || '0 0% 100%');
  const primary = parseHSL(colors.primary || '262 83% 58%');
  const isLight = isLightBackground(background);
  
  const optimized = {
    background: colors.background,
    foreground: generateForegroundColor(background),
    card: generateCardColor(background),
    cardForeground: generateForegroundColor(parseHSL(generateCardColor(background))),
    primary: colors.primary,
    primaryForeground: ensureContrast({ h: primary.h, s: 0, l: isLight ? 10 : 98 }, primary),
    secondary: colors.secondary,
    secondaryForeground: generateForegroundColor(background),
    accent: colors.accent,
    accentForeground: generateForegroundColor(background),
    muted: colors.muted,
    mutedForeground: formatHSL({
      h: background.h,
      s: Math.min(background.s * 0.5, 20),
      l: isLight ? 45 : 65
    }),
    border: formatHSL({
      h: background.h,
      s: Math.min(background.s * 0.3, 15),
      l: isLight ? 85 : 25
    }),
    input: formatHSL({
      h: background.h,
      s: background.s,
      l: isLight ? 92 : 18
    }),
  };
  
  // Preserve any other custom colors that might exist
  return { ...colors, ...optimized };
};
