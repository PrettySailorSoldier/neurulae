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
  onAddList?: () => void;
}

export const CategorySidebar = ({ 
  categories, 
  selectedCategory, 
  onSelectCategory, 
  counts,
  className,
  onAddList,
}: CategorySidebarProps) => {
  return (
    <div className={cn(
      "flex flex-col h-full",
      // Solid background for the sidebar (collections)
      "bg-card",
      className
    )}>
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

      {/* Info text about lists */}
      <div className="px-4 py-3 border-t border-border/40">
        <p className="text-xs text-muted-foreground/70 leading-relaxed">
          Use "Add another list" in the task area to create new lists.
        </p>
      </div>
    </div>
  );
};
