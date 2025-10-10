import { Palette } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Theme } from '@/types';

const themes: { value: Theme; label: string; colors: string }[] = [
  { value: 'orchid', label: 'Orchid Velvet', colors: 'bg-gradient-to-r from-purple-600 to-pink-600' },
  { value: 'jellyfish', label: 'Jellyfish Dream', colors: 'bg-gradient-to-r from-blue-900 to-purple-400' },
  { value: 'sunset', label: 'Liquid Sunset', colors: 'bg-gradient-to-r from-orange-300 to-pink-400' },
  { value: 'bluebonnet', label: 'Bluebonnet Birch', colors: 'bg-gradient-to-r from-blue-600 to-yellow-400' },
  { value: 'ocean', label: 'Ocean Breeze', colors: 'bg-gradient-to-r from-cyan-700 to-teal-400' },
  { value: 'forest', label: 'Forest Calm', colors: 'bg-gradient-to-r from-green-700 to-lime-500' },
  { value: 'midnight', label: 'Midnight Purple', colors: 'bg-gradient-to-r from-purple-900 to-purple-500' },
  { value: 'candy', label: 'Candy Store', colors: 'bg-gradient-to-r from-pink-400 to-cyan-400' },
];

interface ThemeSwitcherProps {
  currentTheme: Theme;
  onThemeChange: (theme: Theme) => void;
}

export function ThemeSwitcher({ currentTheme, onThemeChange }: ThemeSwitcherProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="icon" className="relative">
          <Palette className="h-5 w-5" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        {themes.map((theme) => (
          <DropdownMenuItem
            key={theme.value}
            onClick={() => onThemeChange(theme.value)}
            className="flex items-center gap-3 cursor-pointer"
          >
            <div className={`w-8 h-8 rounded ${theme.colors}`} />
            <span className={currentTheme === theme.value ? 'font-semibold' : ''}>
              {theme.label}
            </span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
