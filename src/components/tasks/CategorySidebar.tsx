import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';

interface CategorySidebarProps {
  categories: { id: string; name: string; icon: string }[];
  selectedCategory: string;
  onSelectCategory: (id: string) => void;
  counts: Record<string, number>;
  className?: string;
}

export const CategorySidebar = ({ 
  categories, 
  selectedCategory, 
  onSelectCategory, 
  counts,
  className 
}: CategorySidebarProps) => {
  return (
    <div className={cn("flex flex-col h-full bg-muted/10 border-r border-border/40", className)}>
      <div className="p-4 pb-2">
        <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-4 px-2">
          Collections
        </h2>
        <div className="space-y-1">
          {categories.map(category => (
            <Button
              key={category.id}
              variant="ghost"
              className={cn(
                "w-full justify-between font-normal",
                selectedCategory === category.id 
                  ? "bg-primary/10 text-primary hover:bg-primary/15" 
                  : "hover:bg-muted/50 text-muted-foreground hover:text-foreground"
              )}
              onClick={() => onSelectCategory(category.id)}
            >
              <div className="flex items-center gap-2">
                <span className="text-base">{category.icon}</span>
                <span className="truncate">{category.name}</span>
              </div>
              {counts[category.id] > 0 && (
                <span className={cn(
                  "text-xs px-2 py-0.5 rounded-full",
                  selectedCategory === category.id
                    ? "bg-primary/20 text-primary"
                    : "bg-muted text-muted-foreground"
                )}>
                  {counts[category.id]}
                </span>
              )}
            </Button>
          ))}
        </div>
      </div>
      
      {/* Spacer */}
      <div className="flex-1" />

      {/* Add List Button (Placeholder for future feature) */}
      <div className="p-4 border-t border-border/40">
        <Button variant="ghost" className="w-full justify-start text-muted-foreground opacity-50 cursor-not-allowed">
          <Plus className="w-4 h-4 mr-2" />
          New Collection
        </Button>
      </div>
    </div>
  );
};
