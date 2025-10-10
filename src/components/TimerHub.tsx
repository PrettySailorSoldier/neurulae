import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TaskSequencer } from './timer-hub/TaskSequencer';
import { IntervalTimer } from './timer-hub/IntervalTimer';
import { FlowtimeTracker } from './timer-hub/FlowtimeTracker';
import { TimeChime } from './timer-hub/TimeChime';
import { TodoTomatoes } from './timer-hub/TodoTomatoes';
import { TimerSession } from '@/types';
import { getTodayString } from '@/lib/timeUtils';

interface TimerHubProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaveSession: (session: TimerSession) => void;
}

export function TimerHub({ open, onOpenChange, onSaveSession }: TimerHubProps) {
  const handleSaveSession = (timerType: TimerSession['timerType']) => (taskId: string | undefined, minutes: number) => {
    const session: TimerSession = {
      id: crypto.randomUUID(),
      taskId,
      startTime: new Date().toISOString(),
      endTime: new Date().toISOString(),
      actualMinutes: minutes,
      date: getTodayString(),
      timerType,
    };
    onSaveSession(session);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-card border-border">
        <DialogHeader>
          <DialogTitle className="text-2xl">Timer Hub</DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="sequence" className="w-full">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="sequence">Task Sequencer</TabsTrigger>
            <TabsTrigger value="interval">Interval</TabsTrigger>
            <TabsTrigger value="flowtime">Flowtime</TabsTrigger>
            <TabsTrigger value="chime">Time Chime</TabsTrigger>
            <TabsTrigger value="tomatoes">To-Do 🍅</TabsTrigger>
          </TabsList>

          <TabsContent value="sequence" className="mt-6">
            <TaskSequencer onSaveSession={handleSaveSession('sequence')} />
          </TabsContent>

          <TabsContent value="interval" className="mt-6">
            <IntervalTimer onSaveSession={handleSaveSession('interval')} />
          </TabsContent>

          <TabsContent value="flowtime" className="mt-6">
            <FlowtimeTracker onSaveSession={handleSaveSession('flowtime')} />
          </TabsContent>

          <TabsContent value="chime" className="mt-6">
            <TimeChime />
          </TabsContent>

          <TabsContent value="tomatoes" className="mt-6">
            <TodoTomatoes />
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}