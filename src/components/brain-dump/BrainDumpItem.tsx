import { BrainDumpItem as BrainDumpItemType } from '@/types';
import { cn } from '@/lib/utils';
import { GripVertical, Trash2 } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { motion } from 'framer-motion';
import { useState } from 'react';

interface BrainDumpItemProps {
  item: BrainDumpItemType;
  isSelected: boolean;
  onToggleSelect: (id: string) => void;
  onDelete: (id: string) => void;
  index: number;
}

export const BrainDumpItem = ({ item, isSelected, onToggleSelect, onDelete, index }: BrainDumpItemProps) => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, height: 0 }}
      transition={{ delay: index * 0.05 }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={cn(
        "group flex items-center gap-3 p-3 rounded-lg border border-transparent transition-all",
        "hover:bg-white/5 hover:border-white/10 hover:-translate-y-0.5",
        isSelected && "bg-primary/10 border-primary/20",
      )}
    >
      {/* Drag Handle */}
      <div className="text-muted-foreground/30 hover:text-muted-foreground cursor-grab active:cursor-grabbing">
        <GripVertical className="w-4 h-4" />
      </div>

      {/* Checkbox */}
      <Checkbox 
        checked={isSelected}
        onCheckedChange={() => onToggleSelect(item.id)}
        className={cn(
            "h-5 w-5 border-muted-foreground/50 transition-colors",
            isSelected && "border-primary bg-primary text-primary-foreground"
        )}
      />

      {/* Text Content */}
      <div className="flex-1 min-w-0">
        <p className={cn(
            "text-sm font-medium leading-none truncate transition-opacity",
            isSelected && "opacity-80"
        )}>
            {item.text}
        </p>
        <p className="text-[10px] text-muted-foreground mt-1 opacity-60">
            Received {new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </p>
      </div>

      {/* Delete Button */}
      <button
        onClick={(e) => {
            e.stopPropagation();
            onDelete(item.id);
        }}
        className={cn(
            "p-1.5 rounded-full hover:bg-destructive/20 hover:text-destructive transition-all opacity-0",
            (isHovered || isSelected) && "opacity-100" // Show on hover or selection
        )}
        aria-label="Delete item"
      >
        <Trash2 className="w-4 h-4" />
      </button>
    </motion.div>
  );
};
