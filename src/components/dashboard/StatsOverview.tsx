import { FocusTimer } from '@/components/FocusTimer';
import { Task, Playbook } from '@/types';
import { Button } from '@/components/ui/button';
import { Calendar } from 'lucide-react';

interface StatsOverviewProps {
  onOpenScheduler: () => void;
  tasks?: Task[];
  playbooks?: Playbook[];
}

export function StatsOverview({ onOpenScheduler, tasks, playbooks }: StatsOverviewProps) {
  return (
    <div className="mb-6">
      <div className="flex items-center justify-between mb-4">
        <div />
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
      <div data-tutorial="focus-timer">
        <FocusTimer tasks={tasks} playbooks={playbooks} />
      </div>
    </div>
  );
}