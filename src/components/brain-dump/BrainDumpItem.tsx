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
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, height: 0 }}
      transition={{ delay: index * 0.05, duration: 0.3 }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={cn(
        "group flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all",
        "bg-white/[0.04] border-white/[0.08]",
        "hover:bg-white/[0.06] hover:border-white/[0.15] hover:-translate-y-0.5",
        isSelected && "border-primary bg-primary/10",
      )}
      style={{
        boxShadow: isSelected 
          ? '0 0 0 2px hsl(var(--primary) / 0.25)' 
          : isHovered 
            ? '0 4px 12px rgba(0, 0, 0, 0.15)' 
            : 'none',
      }}
      onClick={() => onToggleSelect(item.id)}
    >
      {/* Drag Handle */}
      <div className="text-white/30 hover:text-white/60 cursor-grab active:cursor-grabbing">
        <GripVertical className="w-4 h-4" />
      </div>

      {/* Checkbox */}
      <div
        className={cn(
          "w-[18px] h-[18px] rounded border-2 flex items-center justify-center transition-all flex-shrink-0",
          isSelected 
            ? "bg-primary border-primary" 
            : "border-white/30 hover:border-white/50"
        )}
      >
        {isSelected && (
          <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        )}
      </div>

      {/* Text Content */}
      <div className="flex-1 min-w-0">
        <p className={cn(
            "text-sm text-white/90 leading-snug truncate",
        )}>
            {item.text}
        </p>
      </div>

      {/* Delete Button */}
      <button
        onClick={(e) => {
            e.stopPropagation();
            onDelete(item.id);
        }}
        className={cn(
            "p-1.5 rounded text-white/50 hover:text-red-400 hover:scale-110 transition-all",
            isHovered ? "opacity-100" : "opacity-0"
        )}
        aria-label="Delete item"
      >
        <Trash2 className="w-4 h-4" />
      </button>
    </motion.div>
  );
};
