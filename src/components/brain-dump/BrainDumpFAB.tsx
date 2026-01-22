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
          <button
            onClick={onClick}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            className={cn(
              "fixed bottom-8 right-8 z-50 h-16 w-16 rounded-full",
              "flex items-center justify-center",
              "transition-all duration-200 hover:scale-110 hover:rotate-[5deg] active:scale-105",
              className
            )}
            style={{
              background: 'linear-gradient(135deg, hsl(var(--primary)) 0%, hsl(var(--primary) / 0.8) 100%)',
              border: '2px solid rgba(255, 255, 255, 0.2)',
              boxShadow: `
                0 4px 8px rgba(0, 0, 0, 0.2),
                0 8px 16px rgba(0, 0, 0, 0.15),
                0 0 24px hsl(var(--primary) / 0.3)
              `,
              animation: 'fabPulse 2s ease-in-out infinite',
            }}
            aria-label="Open brain dump"
          >
            <Zap className="h-7 w-7 text-white fill-white" />
          </button>
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
