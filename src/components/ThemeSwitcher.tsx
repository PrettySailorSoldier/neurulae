import { Palette, Plus, Edit, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu';
import type { Theme } from '@/types';

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
  onCustomThemeClick?: () => void;
  onEditCustomTheme?: () => void;
  onDeleteCustomTheme?: () => void;
  onUseAsTemplate?: (theme: 'orchid' | 'jellyfish' | 'sunset' | 'bluebonnet' | 'ocean' | 'forest' | 'midnight' | 'candy') => void;
}

export function ThemeSwitcher({ currentTheme, onThemeChange, onCustomThemeClick, onEditCustomTheme, onDeleteCustomTheme, onUseAsTemplate }: ThemeSwitcherProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="icon" className="relative">
          <Palette className="h-5 w-5" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64">
        <DropdownMenuLabel>Preset Themes</DropdownMenuLabel>
        {themes.map((theme) => (
          <DropdownMenuItem
            key={theme.value}
            className="flex items-center justify-between cursor-pointer group"
          >
            <div 
              className="flex items-center gap-3 flex-1"
              onClick={() => onThemeChange(theme.value)}
            >
              <div className={`w-8 h-8 rounded ${theme.colors}`} />
              <span className={currentTheme === theme.value ? 'font-semibold' : ''}>
                {theme.label}
              </span>
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
              >
                <Edit className="w-3 h-3" />
              </Button>
            )}
          </DropdownMenuItem>
        ))}
        {(onCustomThemeClick || onEditCustomTheme || onDeleteCustomTheme) && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuLabel>Custom Theme</DropdownMenuLabel>
            {currentTheme === 'custom' && onEditCustomTheme && (
              <DropdownMenuItem
                onClick={onEditCustomTheme}
                className="flex items-center gap-3 cursor-pointer"
              >
                <div className="w-8 h-8 rounded bg-gradient-to-r from-primary to-secondary" />
                <span className="font-semibold">Edit Custom Theme</span>
                <Edit className="w-4 h-4 ml-auto" />
              </DropdownMenuItem>
            )}
            {currentTheme === 'custom' && onDeleteCustomTheme && (
              <DropdownMenuItem
                onClick={onDeleteCustomTheme}
                className="flex items-center gap-3 cursor-pointer text-destructive focus:text-destructive"
              >
                <Trash2 className="w-4 h-4" />
                <span>Delete Custom Theme</span>
              </DropdownMenuItem>
            )}
            {onCustomThemeClick && (
              <DropdownMenuItem
                onClick={onCustomThemeClick}
                className="flex items-center gap-3 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Create New Custom Theme</span>
              </DropdownMenuItem>
            )}
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
