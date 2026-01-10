import { toast } from '@/hooks/use-toast';
import { DayPhase } from '@/lib/temporalContext';
import { StructureSuggestion } from '@/hooks/useStructureAnalysis';
import { Sunrise, Sun, UtensilsCrossed, Briefcase, Home, Moon, BedDouble } from 'lucide-react';

interface PhaseTransitionOptions {
  phase: DayPhase;
  phaseLabel: string;
  suggestion?: StructureSuggestion;
  onAcceptSuggestion?: (suggestion: StructureSuggestion) => void;
}

export function showPhaseTransitionToast({
  phase,
  phaseLabel,
  suggestion,
  onAcceptSuggestion
}: PhaseTransitionOptions) {
  const greeting = getPhaseGreeting(phase);
  const description = suggestion 
    ? `Consider: ${suggestion.title}`
    : getPhaseDescription(phase);
  
  toast({
    title: greeting,
    description,
    duration: 10000, // 10 seconds, dismissable
    action: suggestion && onAcceptSuggestion ? (
      <button
        onClick={() => onAcceptSuggestion(suggestion)}
        className="shrink-0 rounded-md bg-primary px-3 py-1 text-xs font-medium text-primary-foreground hover:bg-primary/90"
      >
        Add to schedule
      </button>
    ) : undefined,
  });
}

function getPhaseGreeting(phase: DayPhase): string {
  switch (phase) {
    case 'early-morning': return '🌅 Early morning - fresh start!';
    case 'morning': return '☀️ Good morning!';
    case 'midday': return '🍽️ Lunch time!';
    case 'afternoon': return '☀️ Afternoon focus time';
    case 'evening': return '🌅 Evening - time to wind down';
    case 'night': return '🌙 Night time - prepare for rest';
    case 'sleep-hours': return '😴 Time for rest';
    default: return `Entering ${phase}`;
  }
}

function getPhaseDescription(phase: DayPhase): string {
  switch (phase) {
    case 'early-morning': return 'Quiet time for morning routines';
    case 'morning': return 'Peak energy for focused work';
    case 'midday': return 'Take a break and recharge';
    case 'afternoon': return 'Good time for meetings and tasks';
    case 'evening': return 'Personal time and winding down';
    case 'night': return 'Prepare for sleep';
    case 'sleep-hours': return 'Rest and recovery time';
    default: return '';
  }
}

export function getPhaseIcon(phase: DayPhase) {
  switch (phase) {
    case 'early-morning': return Sunrise;
    case 'morning': return Sun;
    case 'midday': return UtensilsCrossed;
    case 'afternoon': return Briefcase;
    case 'evening': return Home;
    case 'night': return Moon;
    case 'sleep-hours': return BedDouble;
    default: return Sun;
  }
}
