import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Zap, Brain } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface BrainDumpFABProps {
  onClick: () => void;
  className?: string;
}

const brainDumpLabels = [
  "Brain Dump",
  "Data Dump",
  "Knowledge Transfer",
  "Information Offload",
  "Mental Download",
  "Comprehensive Listing",
  "Thorough Compilation",
  "Exhaustive Record",
  "Detailed Inventory"
];

export const BrainDumpFAB = ({ onClick, className }: BrainDumpFABProps) => {
  const [labelIndex, setLabelIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    // Cycle labels every 3.5s
    const interval = setInterval(() => {
       setLabelIndex((prev) => (prev + 1) % brainDumpLabels.length);
    }, 3500);
    return () => clearInterval(interval);
  }, []);

  return (
    <TooltipProvider>
      <Tooltip open={isHovered}>
        <TooltipTrigger asChild>
          <Button
            onClick={onClick}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            className={cn(
              "fixed bottom-6 right-6 z-50 h-14 w-14 rounded-full shadow-lg",
              "bg-primary hover:bg-primary/90 text-primary-foreground",
              "transition-all duration-300 hover:scale-105 active:scale-95",
              "animate-pulse-glow", // Custom glow animation class needs to be added to tailwind
              className
            )}
            size="icon"
          >
            <Zap className="h-6 w-6 fill-current animate-pulse" />
          </Button>
        </TooltipTrigger>
        <TooltipContent side="left" className="mr-2 px-3 py-1.5 bg-primary text-primary-foreground border-none shadow-md overflow-hidden min-w-[140px] text-center">
            <AnimatePresence mode="wait">
                <motion.span
                    key={labelIndex}
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -5 }}
                    transition={{ duration: 0.2 }}
                    className="block text-sm font-medium"
                >
                    {brainDumpLabels[labelIndex]}
                </motion.span>
            </AnimatePresence>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};
