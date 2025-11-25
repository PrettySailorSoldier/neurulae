import { FocusTimer } from '@/components/FocusTimer';
import { CalendarWidget } from '@/components/CalendarWidget';

interface StatsOverviewProps {
  onOpenScheduler: () => void;
}

export function StatsOverview({ onOpenScheduler }: StatsOverviewProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-12 gap-6 mb-6">
      <div className="md:col-span-6" data-tutorial="focus-timer">
        <FocusTimer />
      </div>
      <div className="md:col-span-6">
        <CalendarWidget onOpenScheduler={onOpenScheduler} />
      </div>
    </div>
  );
}