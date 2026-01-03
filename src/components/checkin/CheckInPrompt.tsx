import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { Card, CardContent } from '@/components/ui/card';
import { CheckIn } from '@/types';
import {
  Sparkles,
  ThumbsUp,
  ThumbsDown,
  Meh,
  Battery,
  Sun,
  Moon,
  TrendingUp,
  Plus,
  X,
  Check,
  MessageSquare,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface CheckInPromptProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  type: 'daily' | 'weekly' | 'ad-hoc';
  onSave: (checkIn: Omit<CheckIn, 'id' | 'completedAt' | 'aiInsights' | 'suggestedAdjustments'>) => void;
  previousCheckIns?: CheckIn[];
}

const FEELING_OPTIONS = [
  { id: 'great', label: 'Great', icon: ThumbsUp, color: 'text-green-500', bgColor: 'bg-green-500/10' },
  { id: 'okay', label: 'Okay', icon: Meh, color: 'text-yellow-500', bgColor: 'bg-yellow-500/10' },
  { id: 'struggling', label: 'Struggling', icon: ThumbsDown, color: 'text-red-500', bgColor: 'bg-red-500/10' },
] as const;

const COMMON_WINS = [
  'Completed my morning routine',
  'Started work on time',
  'Took breaks when needed',
  'Stayed focused on priorities',
  'Asked for help when stuck',
  'Finished what I started',
  'Managed energy well',
  'Used my anchor points',
];

const COMMON_STRUGGLES = [
  'Hard to get started',
  'Got distracted easily',
  'Forgot important things',
  'Felt overwhelmed',
  'Skipped routines',
  'Worked too long without breaks',
  'Perfectionism got in the way',
  'Time blindness issues',
];

export function CheckInPrompt({
  open,
  onOpenChange,
  type,
  onSave,
  previousCheckIns = [],
}: CheckInPromptProps) {
  const [step, setStep] = useState(1);
  const [feeling, setFeeling] = useState<'great' | 'okay' | 'struggling' | null>(null);
  const [energyLevel, setEnergyLevel] = useState(5);
  const [whatWorked, setWhatWorked] = useState<string[]>([]);
  const [whatDidnt, setWhatDidnt] = useState<string[]>([]);
  const [customWin, setCustomWin] = useState('');
  const [customStruggle, setCustomStruggle] = useState('');
  const [notes, setNotes] = useState('');

  // Reset form when dialog opens
  useEffect(() => {
    if (open) {
      setStep(1);
      setFeeling(null);
      setEnergyLevel(5);
      setWhatWorked([]);
      setWhatDidnt([]);
      setCustomWin('');
      setCustomStruggle('');
      setNotes('');
    }
  }, [open]);

  const toggleItem = (item: string, list: string[], setList: (items: string[]) => void) => {
    if (list.includes(item)) {
      setList(list.filter(i => i !== item));
    } else {
      setList([...list, item]);
    }
  };

  const addCustomItem = (
    value: string,
    setValue: (v: string) => void,
    list: string[],
    setList: (items: string[]) => void
  ) => {
    if (value.trim() && !list.includes(value.trim())) {
      setList([...list, value.trim()]);
      setValue('');
    }
  };

  const handleSave = () => {
    if (!feeling) return;

    onSave({
      type,
      scheduledFor: new Date().toISOString(),
      responses: {
        whatWorked,
        whatDidnt,
        energyLevel,
        overallFeeling: feeling,
        freeformNotes: notes || undefined,
      },
    });

    onOpenChange(false);
  };

  const canProceed = () => {
    switch (step) {
      case 1: return feeling !== null;
      case 2: return true; // Energy is always set
      case 3: return true; // Wins/struggles are optional
      case 4: return true; // Notes are optional
      default: return false;
    }
  };

  const getTitle = () => {
    switch (type) {
      case 'daily': return 'Daily Check-In';
      case 'weekly': return 'Weekly Reflection';
      case 'ad-hoc': return 'Quick Check-In';
    }
  };

  const getTimeOfDayEmoji = () => {
    const hour = new Date().getHours();
    if (hour < 12) return <Sun className="w-5 h-5 text-amber-500" />;
    if (hour < 18) return <Sparkles className="w-5 h-5 text-blue-500" />;
    return <Moon className="w-5 h-5 text-purple-500" />;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {getTimeOfDayEmoji()}
            {getTitle()}
          </DialogTitle>
          <DialogDescription>
            {type === 'daily' && 'A quick reflection on your day'}
            {type === 'weekly' && 'Let\'s look at how this week went'}
            {type === 'ad-hoc' && 'How are things going right now?'}
          </DialogDescription>
        </DialogHeader>

        {/* Progress indicator */}
        <div className="flex gap-1 mb-4">
          {[1, 2, 3, 4].map((s) => (
            <div
              key={s}
              className={cn(
                'h-1 flex-1 rounded-full transition-colors',
                s <= step ? 'bg-primary' : 'bg-muted'
              )}
            />
          ))}
        </div>

        <div className="min-h-[280px]">
          {/* Step 1: Overall Feeling */}
          {step === 1 && (
            <div className="space-y-4">
              <Label className="text-base">How are you feeling overall?</Label>
              <div className="grid grid-cols-3 gap-3">
                {FEELING_OPTIONS.map((option) => {
                  const Icon = option.icon;
                  const isSelected = feeling === option.id;
                  return (
                    <Card
                      key={option.id}
                      className={cn(
                        'cursor-pointer transition-all hover:scale-105',
                        isSelected
                          ? `border-2 border-primary ${option.bgColor}`
                          : 'hover:bg-accent'
                      )}
                      onClick={() => setFeeling(option.id as typeof feeling)}
                    >
                      <CardContent className="p-4 flex flex-col items-center gap-2">
                        <Icon className={cn('w-8 h-8', option.color)} />
                        <span className="font-medium text-sm">{option.label}</span>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          )}

          {/* Step 2: Energy Level */}
          {step === 2 && (
            <div className="space-y-6">
              <div className="space-y-2">
                <Label className="text-base flex items-center gap-2">
                  <Battery className="w-4 h-4" />
                  What's your energy level?
                </Label>
                <p className="text-sm text-muted-foreground">
                  1 = running on empty, 10 = fully charged
                </p>
              </div>

              <div className="space-y-4">
                <Slider
                  value={[energyLevel]}
                  onValueChange={([value]) => setEnergyLevel(value)}
                  min={1}
                  max={10}
                  step={1}
                  className="w-full"
                />
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>🪫 Low</span>
                  <span className="text-2xl font-bold text-primary">{energyLevel}</span>
                  <span>🔋 High</span>
                </div>
              </div>

              {energyLevel <= 3 && (
                <p className="text-sm text-amber-600 bg-amber-500/10 p-3 rounded-lg">
                  Running low? That's okay - be gentle with yourself today. Consider using low-energy routine variants.
                </p>
              )}
            </div>
          )}

          {/* Step 3: What Worked / What Didn't */}
          {step === 3 && (
            <div className="space-y-4">
              {/* What Worked */}
              <div className="space-y-2">
                <Label className="text-base flex items-center gap-2">
                  <ThumbsUp className="w-4 h-4 text-green-500" />
                  What worked well?
                </Label>
                <div className="flex flex-wrap gap-2">
                  {COMMON_WINS.slice(0, 6).map((win) => (
                    <Badge
                      key={win}
                      variant={whatWorked.includes(win) ? 'default' : 'outline'}
                      className="cursor-pointer"
                      onClick={() => toggleItem(win, whatWorked, setWhatWorked)}
                    >
                      {whatWorked.includes(win) && <Check className="w-3 h-3 mr-1" />}
                      {win}
                    </Badge>
                  ))}
                </div>
                <div className="flex gap-2 mt-2">
                  <input
                    type="text"
                    value={customWin}
                    onChange={(e) => setCustomWin(e.target.value)}
                    placeholder="Add your own..."
                    className="flex-1 px-3 py-1.5 text-sm border rounded-md bg-background"
                    onKeyDown={(e) => e.key === 'Enter' && addCustomItem(customWin, setCustomWin, whatWorked, setWhatWorked)}
                  />
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => addCustomItem(customWin, setCustomWin, whatWorked, setWhatWorked)}
                    disabled={!customWin.trim()}
                  >
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              {/* What Didn't */}
              <div className="space-y-2">
                <Label className="text-base flex items-center gap-2">
                  <ThumbsDown className="w-4 h-4 text-red-500" />
                  What was challenging?
                </Label>
                <div className="flex flex-wrap gap-2">
                  {COMMON_STRUGGLES.slice(0, 6).map((struggle) => (
                    <Badge
                      key={struggle}
                      variant={whatDidnt.includes(struggle) ? 'destructive' : 'outline'}
                      className="cursor-pointer"
                      onClick={() => toggleItem(struggle, whatDidnt, setWhatDidnt)}
                    >
                      {whatDidnt.includes(struggle) && <X className="w-3 h-3 mr-1" />}
                      {struggle}
                    </Badge>
                  ))}
                </div>
                <div className="flex gap-2 mt-2">
                  <input
                    type="text"
                    value={customStruggle}
                    onChange={(e) => setCustomStruggle(e.target.value)}
                    placeholder="Add your own..."
                    className="flex-1 px-3 py-1.5 text-sm border rounded-md bg-background"
                    onKeyDown={(e) => e.key === 'Enter' && addCustomItem(customStruggle, setCustomStruggle, whatDidnt, setWhatDidnt)}
                  />
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => addCustomItem(customStruggle, setCustomStruggle, whatDidnt, setWhatDidnt)}
                    disabled={!customStruggle.trim()}
                  >
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Step 4: Notes */}
          {step === 4 && (
            <div className="space-y-4">
              <Label className="text-base flex items-center gap-2">
                <MessageSquare className="w-4 h-4" />
                Anything else on your mind? (optional)
              </Label>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Free-form thoughts, observations, or things you want to remember..."
                rows={5}
                className="resize-none"
              />

              {/* Quick summary */}
              <div className="p-3 bg-accent/50 rounded-lg space-y-2 text-sm">
                <p className="font-medium flex items-center gap-2">
                  <TrendingUp className="w-4 h-4" />
                  Your summary:
                </p>
                <div className="flex items-center gap-2">
                  <span>Feeling:</span>
                  <Badge variant="outline">{feeling}</Badge>
                  <span>Energy:</span>
                  <Badge variant="outline">{energyLevel}/10</Badge>
                </div>
                {whatWorked.length > 0 && (
                  <p className="text-green-600">✓ {whatWorked.length} wins</p>
                )}
                {whatDidnt.length > 0 && (
                  <p className="text-red-500">✗ {whatDidnt.length} challenges</p>
                )}
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="flex gap-2">
          {step > 1 && (
            <Button variant="outline" onClick={() => setStep(step - 1)}>
              Back
            </Button>
          )}
          {step < 4 ? (
            <Button onClick={() => setStep(step + 1)} disabled={!canProceed()}>
              Continue
            </Button>
          ) : (
            <Button onClick={handleSave} className="gap-2">
              <Check className="w-4 h-4" />
              Save Check-In
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default CheckInPrompt;
