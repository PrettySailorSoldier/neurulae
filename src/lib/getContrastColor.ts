/**
 * Utility for calculating optimal text color based on background color
 * to ensure WCAG-compliant contrast ratios for accessibility.
 */

/**
 * Parses various color formats (hex, rgb, rgba, hsl, hsla) and returns RGB values
 */
export function parseColor(color: string): { r: number; g: number; b: number } | null {
  if (!color) return null;
  
  // Handle hex colors
  if (color.startsWith('#')) {
    const hex = color.slice(1);
    if (hex.length === 3) {
      return {
        r: parseInt(hex[0] + hex[0], 16),
        g: parseInt(hex[1] + hex[1], 16),
        b: parseInt(hex[2] + hex[2], 16),
      };
    }
    if (hex.length === 6) {
      return {
        r: parseInt(hex.slice(0, 2), 16),
        g: parseInt(hex.slice(2, 4), 16),
        b: parseInt(hex.slice(4, 6), 16),
      };
    }
  }

  // Handle rgb/rgba
  const rgbMatch = color.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
  if (rgbMatch) {
    return {
      r: parseInt(rgbMatch[1]),
      g: parseInt(rgbMatch[2]),
      b: parseInt(rgbMatch[3]),
    };
  }

  // Handle hsl/hsla
  const hslMatch = color.match(/hsla?\((\d+),\s*(\d+)%?,\s*(\d+)%?/);
  if (hslMatch) {
    return hslToRgb(
      parseInt(hslMatch[1]),
      parseInt(hslMatch[2]),
      parseInt(hslMatch[3])
    );
  }

  return null;
}

/**
 * Converts HSL to RGB
 */
function hslToRgb(h: number, s: number, l: number): { r: number; g: number; b: number } {
  s /= 100;
  l /= 100;
  const a = s * Math.min(l, 1 - l);
  const f = (n: number) => {
    const k = (n + h / 30) % 12;
    return l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
  };
  return {
    r: Math.round(f(0) * 255),
    g: Math.round(f(8) * 255),
    b: Math.round(f(4) * 255),
  };
}

/**
 * Calculates relative luminance according to WCAG 2.1 guidelines
 * @see https://www.w3.org/TR/WCAG21/#dfn-relative-luminance
 */
export function getRelativeLuminance(r: number, g: number, b: number): number {
  const [rs, gs, bs] = [r, g, b].map((c) => {
    const sRGB = c / 255;
    return sRGB <= 0.03928 ? sRGB / 12.92 : Math.pow((sRGB + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

/**
 * Checks if a background is considered "light" based on luminance
 * Uses a threshold of 0.179 (common for determining contrast needs)
 */
export function isLightBackground(color: string): boolean {
  const rgb = parseColor(color);
  if (!rgb) return true; // Default to assuming light background
  
  const luminance = getRelativeLuminance(rgb.r, rgb.g, rgb.b);
  return luminance > 0.179;
}

/**
 * Returns the optimal text color (dark or light) for a given background color
 * to ensure readable contrast.
 * 
 * @param backgroundColor - The background color in any CSS format
 * @param darkColor - The dark text color to use (default: near-black)
 * @param lightColor - The light text color to use (default: near-white)
 * @returns The appropriate text color for optimal contrast
 */
export function getContrastColor(
  backgroundColor: string,
  darkColor: string = 'hsl(0, 0%, 10%)',
  lightColor: string = 'hsl(0, 0%, 98%)'
): string {
  return isLightBackground(backgroundColor) ? darkColor : lightColor;
}

/**
 * Calculates the contrast ratio between two colors
 * WCAG AA requires 4.5:1 for normal text, 3:1 for large text
 * WCAG AAA requires 7:1 for normal text, 4.5:1 for large text
 */
export function getContrastRatio(color1: string, color2: string): number {
  const rgb1 = parseColor(color1);
  const rgb2 = parseColor(color2);
  
  if (!rgb1 || !rgb2) return 1;
  
  const L1 = getRelativeLuminance(rgb1.r, rgb1.g, rgb1.b);
  const L2 = getRelativeLuminance(rgb2.r, rgb2.g, rgb2.b);
  
  const lighter = Math.max(L1, L2);
  const darker = Math.min(L1, L2);
  
  return (lighter + 0.05) / (darker + 0.05);
}

/**
 * Checks if a color combination meets WCAG AA standards
 */
export function meetsWCAGAA(
  foreground: string,
  background: string,
  isLargeText: boolean = false
): boolean {
  const ratio = getContrastRatio(foreground, background);
  return isLargeText ? ratio >= 3 : ratio >= 4.5;
}

/**
 * A React-friendly hook-style function that returns text styling
 * for use with style props or className generation
 */
export function getAccessibleTextStyle(backgroundColor: string): {
  color: string;
  textShadow?: string;
} {
  const textColor = getContrastColor(backgroundColor);
  const isLight = isLightBackground(backgroundColor);
  
  return {
    color: textColor,
    // Add subtle text shadow for extra readability on complex backgrounds
    textShadow: isLight 
      ? undefined 
      : '0 1px 2px rgba(0,0,0,0.3)',
  };
}
