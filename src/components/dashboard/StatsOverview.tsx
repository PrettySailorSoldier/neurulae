import { FocusTimer } from '@/components/FocusTimer';
import { CalendarWidget } from '@/components/CalendarWidget';
import { Task, Playbook } from '@/types';

interface StatsOverviewProps {
  onOpenScheduler: () => void;
  tasks?: Task[];
  playbooks?: Playbook[];
}

export function StatsOverview({ onOpenScheduler, tasks, playbooks }: StatsOverviewProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-12 gap-6 mb-6">
      <div className="md:col-span-6" data-tutorial="focus-timer">
        <FocusTimer tasks={tasks} playbooks={playbooks} />
      </div>
      <div className="md:col-span-6">
        <CalendarWidget onOpenScheduler={onOpenScheduler} />
      </div>
    </div>
  );
}