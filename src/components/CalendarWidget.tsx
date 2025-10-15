import { Calendar } from 'lucide-react';
import { format } from 'date-fns';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface CalendarWidgetProps {
  onOpenScheduler: () => void;
}

export function CalendarWidget({ onOpenScheduler }: CalendarWidgetProps) {
  const today = new Date();
  
  return (
    <Card className="card-elevated border-2 h-full">
      <CardContent className="p-0">
        <Button
          onClick={onOpenScheduler}
          variant="ghost"
          className="w-full h-full flex flex-col items-center justify-center gap-2 p-6 hover:bg-card/70"
        >
          <Calendar className="h-8 w-8 text-primary" />
          <div className="text-center">
            <div className="text-2xl font-bold">
              {format(today, 'd')}
            </div>
            <div className="text-sm text-muted-foreground">
              {format(today, 'MMM yyyy')}
            </div>
          </div>
          <div className="text-xs text-muted-foreground">
            Schedule Tasks
          </div>
        </Button>
      </CardContent>
    </Card>
  );
}
