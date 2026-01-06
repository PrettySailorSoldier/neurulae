import { Button } from '@/components/ui/button';
import { Calendar } from 'lucide-react';

interface StatsOverviewProps {
  onOpenScheduler: () => void;
}

export function StatsOverview({ onOpenScheduler }: StatsOverviewProps) {
  return (
    <div className="flex items-center justify-end mb-4">
      <Button
        variant="outline"
        size="sm"
        onClick={onOpenScheduler}
        className="gap-2"
      >
        <Calendar className="h-4 w-4" />
        Open Calendar
      </Button>
    </div>
  );
}