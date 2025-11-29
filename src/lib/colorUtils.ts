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
 * Auto-optimize theme colors - ONLY adjusts text contrast, preserves base colors
 * This ensures foreground colors remain readable without changing user's color choices
 */
export const autoOptimizeThemeColors = (colors: Record<string, string>): Record<string, string> => {
  const background = parseHSL(colors.background || '0 0% 100%');
  const primary = parseHSL(colors.primary || '262 83% 58%');
  const secondary = parseHSL(colors.secondary || colors.primary);
  const accent = parseHSL(colors.accent || colors.primary);
  const card = parseHSL(colors.card || colors.background);
  
  // Only optimize foreground colors for contrast - preserve all base colors
  const optimized = {
    background: colors.background, // preserve
    foreground: ensureContrast(parseHSL(colors.foreground || '0 0% 0%'), background), // optimize text
    card: colors.card, // preserve
    cardForeground: ensureContrast(parseHSL(colors.cardForeground || colors.foreground || '0 0% 0%'), card), // optimize text
    primary: colors.primary, // preserve
    primaryForeground: ensureContrast(parseHSL(colors.primaryForeground || '0 0% 100%'), primary), // optimize text
    secondary: colors.secondary, // preserve
    secondaryForeground: ensureContrast(parseHSL(colors.secondaryForeground || colors.foreground || '0 0% 0%'), secondary), // optimize text
    accent: colors.accent, // preserve
    accentForeground: ensureContrast(parseHSL(colors.accentForeground || colors.foreground || '0 0% 0%'), accent), // optimize text
    muted: colors.muted, // preserve
    mutedForeground: ensureContrast(parseHSL(colors.mutedForeground || colors.foreground || '0 0% 0%'), parseHSL(colors.muted || colors.background)), // optimize text
    border: colors.border, // preserve
    input: colors.input, // preserve
  };
  
  return optimized;
};

/**
 * Extract dominant colors from an image
 */
export const extractColorsFromImage = async (imageFile: File): Promise<string[]> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    img.onload = () => {
      // Resize to improve performance
      const maxSize = 200;
      const scale = Math.min(maxSize / img.width, maxSize / img.height);
      canvas.width = img.width * scale;
      canvas.height = img.height * scale;

      if (!ctx) {
        reject(new Error('Could not get canvas context'));
        return;
      }

      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const pixels = imageData.data;

      // Sample every nth pixel for performance
      const sampleRate = 10;
      const colorMap = new Map<string, number>();

      for (let i = 0; i < pixels.length; i += 4 * sampleRate) {
        const r = pixels[i];
        const g = pixels[i + 1];
        const b = pixels[i + 2];
        const a = pixels[i + 3];

        // Skip transparent pixels
        if (a < 128) continue;

        // Convert to HSL
        const hsl = rgbToHsl(r, g, b);
        // Round to reduce color variance
        const key = `${Math.round(hsl.h / 10) * 10} ${Math.round(hsl.s / 5) * 5}% ${Math.round(hsl.l / 5) * 5}%`;
        
        colorMap.set(key, (colorMap.get(key) || 0) + 1);
      }

      // Sort by frequency and get top 4 distinct colors
      const sortedColors = Array.from(colorMap.entries())
        .sort((a, b) => b[1] - a[1])
        .map(([color]) => color)
        .slice(0, 4);

      resolve(sortedColors);
    };

    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = URL.createObjectURL(imageFile);
  });
};

/**
 * Convert RGB to HSL
 */
const rgbToHsl = (r: number, g: number, b: number): HSL => {
  r /= 255;
  g /= 255;
  b /= 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

    switch (max) {
      case r:
        h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
        break;
      case g:
        h = ((b - r) / d + 2) / 6;
        break;
      case b:
        h = ((r - g) / d + 4) / 6;
        break;
    }
  }

  return {
    h: Math.round(h * 360),
    s: Math.round(s * 100),
    l: Math.round(l * 100),
  };
};
