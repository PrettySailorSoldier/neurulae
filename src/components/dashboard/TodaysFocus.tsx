import { TomorrowIntentions } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Check, Star, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

interface TodaysFocusProps {
  intentions: TomorrowIntentions | null;
  onToggleIntention: (id: string) => void;
  onOpenDailyReview: () => void;
}

export const TodaysFocus = ({ intentions, onToggleIntention, onOpenDailyReview }: TodaysFocusProps) => {
  // If no intentions set for today (or they are stale from yesterday), show prompt
  // In a real app we'd check dates more rigorously, but for now existence is the check
  const hasIntentions = intentions && intentions.intentions.length > 0;

  if (!hasIntentions) {
    return (
      <Card className="bg-gradient-to-br from-primary/5 to-background border-primary/20">
        <CardContent className="flex items-center justify-between p-6">
          <div>
            <h3 className="font-semibold text-lg mb-1">Ready to plan your day?</h3>
            <p className="text-muted-foreground">Select your top 3 priorities to get started.</p>
          </div>
          <Button onClick={onOpenDailyReview} className="gap-2">
            <Star className="w-4 h-4" />
            Set Intentions
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold flex items-center gap-2">
          <Star className="w-5 h-5 text-amber-400 fill-amber-400" />
          Today's Focus
        </h2>
        <Button variant="ghost" size="sm" onClick={onOpenDailyReview} className="text-muted-foreground hover:text-foreground">
          Edit Intentions
        </Button>
      </div>

      <div className="grid gap-3">
        {intentions.intentions.map((intention, index) => (
          <div 
            key={intention.id}
            onClick={() => onToggleIntention(intention.id)}
            className={cn(
              "group relative p-4 rounded-xl border transition-all cursor-pointer flex items-center gap-4",
              intention.completed 
                ? "bg-muted/30 border-border/50 opacity-60" 
                : "bg-card border-border shadow-sm hover:shadow-md hover:border-primary/30"
            )}
          >
            {/* Number/Check Circle */}
            <div className={cn(
              "w-8 h-8 rounded-full flex items-center justify-center border-2 transition-colors flex-shrink-0",
              intention.completed
                ? "bg-primary border-primary text-primary-foreground"
                : "border-primary/30 text-primary/50 group-hover:border-primary group-hover:text-primary"
            )}>
              {intention.completed ? <Check className="w-4 h-4" /> : <span className="font-bold">{index + 1}</span>}
            </div>

            <div className="flex-1">
              <div className={cn(
                "font-medium text-lg transition-all",
                intention.completed && "line-through text-muted-foreground"
              )}>
                {intention.title}
              </div>
            </div>

            {/* Hover Arrow */}
            <ArrowRight className={cn(
              "w-5 h-5 text-muted-foreground transition-all transform",
              intention.completed ? "opacity-0" : "opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0"
            )} />
          </div>
        ))}
      </div>
    </div>
  );
};
