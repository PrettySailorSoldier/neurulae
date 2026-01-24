import { useState } from 'react';
import { useEnergyTemplates, EnergyLevel } from '@/hooks/useEnergyTemplates';
import { TimeBlock } from '@/types';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Battery, BatteryMedium, BatteryLow } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface MorningEnergyCheckInProps {
  open: boolean;
  onClose: () => void;
  onEnergySelected: (level: EnergyLevel, blocks: TimeBlock[]) => void;
  templateId?: string;  // Which template to apply (optional)
}

export function MorningEnergyCheckIn({ 
  open, 
  onClose, 
  onEnergySelected, 
  templateId 
}: MorningEnergyCheckInProps) {
  const { recordEnergyLevel, getTemplateBlocks, energyPatterns } = useEnergyTemplates();
  const { toast } = useToast();
  const [hoveredLevel, setHoveredLevel] = useState<EnergyLevel | null>(null);
  
  const handleSelectEnergy = (level: EnergyLevel) => {
    // Record the check-in
    recordEnergyLevel(level, 'morning', templateId);
    
    // Get appropriate template blocks if template is specified
    const blocks = templateId ? getTemplateBlocks(templateId, level) : [];
    
    // Apply them
    onEnergySelected(level, blocks);
    
    // Show confirmation with no-shame messaging
    const messages: Record<EnergyLevel, { title: string; description: string }> = {
      high: {
        title: "Great! Loading your full routine",
        description: "You've got the energy - make the most of it!"
      },
      average: {
        title: "Got it. Loading your standard routine",
        description: "A balanced approach for a solid day"
      },
      low: {
        title: "That's okay. Loading just the essentials",
        description: "All three versions are success - no judgment here"
      },
    };
    
    toast({
      title: messages[level].title,
      description: messages[level].description,
    });
    
    onClose();
  };
  
  const getDescription = (level: EnergyLevel) => {
    const descriptions: Record<EnergyLevel, string> = {
      high: "Full routine with all blocks - you're ready for it all",
      average: "Simplified routine - covers the key things without overwhelm",
      low: "Just the essentials - medication, hygiene, breakfast",
    };
    
    if (hoveredLevel === level) {
      return descriptions[level];
    }
    
    const defaults: Record<EnergyLevel, string> = {
      high: "Feeling alert and ready for the full routine",
      average: "Standard day - need the simplified version",
      low: "Struggling today - just the essentials",
    };
    return defaults[level];
  };
  
  const getTrendEmoji = () => {
    switch (energyPatterns.trend) {
      case 'improving': return '📈';
      case 'declining': return '📉';
      default: return '➡️';
    }
  };
  
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>How's your energy this morning?</DialogTitle>
          <DialogDescription>
            This helps us suggest the right routine for today. All versions are success!
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-3 py-4">
          <Button
            variant="outline"
            className="w-full h-auto py-4 flex flex-col items-start hover:bg-green-50 dark:hover:bg-green-950/50 transition-colors"
            onClick={() => handleSelectEnergy('high')}
            onMouseEnter={() => setHoveredLevel('high')}
            onMouseLeave={() => setHoveredLevel(null)}
          >
            <div className="flex items-center gap-2 mb-1">
              <Battery className="h-5 w-5 text-green-600" />
              <span className="font-semibold">High Energy</span>
            </div>
            <p className="text-xs text-left text-muted-foreground">
              {getDescription('high')}
            </p>
          </Button>
          
          <Button
            variant="outline"
            className="w-full h-auto py-4 flex flex-col items-start hover:bg-blue-50 dark:hover:bg-blue-950/50 transition-colors"
            onClick={() => handleSelectEnergy('average')}
            onMouseEnter={() => setHoveredLevel('average')}
            onMouseLeave={() => setHoveredLevel(null)}
          >
            <div className="flex items-center gap-2 mb-1">
              <BatteryMedium className="h-5 w-5 text-blue-600" />
              <span className="font-semibold">Average Energy</span>
            </div>
            <p className="text-xs text-left text-muted-foreground">
              {getDescription('average')}
            </p>
          </Button>
          
          <Button
            variant="outline"
            className="w-full h-auto py-4 flex flex-col items-start hover:bg-amber-50 dark:hover:bg-amber-950/50 transition-colors"
            onClick={() => handleSelectEnergy('low')}
            onMouseEnter={() => setHoveredLevel('low')}
            onMouseLeave={() => setHoveredLevel(null)}
          >
            <div className="flex items-center gap-2 mb-1">
              <BatteryLow className="h-5 w-5 text-amber-600" />
              <span className="font-semibold">Low Energy</span>
            </div>
            <p className="text-xs text-left text-muted-foreground">
              {getDescription('low')}
            </p>
          </Button>
        </div>
        
        {/* Show pattern insights */}
        <div className="text-xs text-muted-foreground text-center border-t pt-3 space-y-1">
          <p>
            Your typical morning energy: <strong className="capitalize">{energyPatterns.morningPattern}</strong>
          </p>
          <p>
            Trend: {getTrendEmoji()} <span className="capitalize">{energyPatterns.trend}</span>
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
