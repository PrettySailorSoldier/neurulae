import { useState, useCallback } from 'react';
import { History, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Routine, ScheduledRoutine, RoutineCompletionRecord, ROUTINE_STORAGE_KEYS } from '@/types';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { useActiveRoutine } from '@/hooks/useActiveRoutine';
import { RoutineList } from './RoutineList';
import { RoutineExecutionView } from './RoutineExecutionView';
import { RoutineCompletionSummary } from './RoutineCompletionSummary';
import { RoutinePauseScreen } from './RoutinePauseScreen';
import { ScheduleRoutineModal } from './ScheduleRoutineModal';
import { RoutineHistoryView } from './RoutineHistoryView';
import { RoutineNotificationManager } from './RoutineNotificationManager';
import { ActiveRoutineBanner } from './ActiveRoutineBanner';

interface RoutinesPanelProps {
  onOpenSettings?: () => void;
  showBannerOnly?: boolean;
}

export function RoutinesPanel({ onOpenSettings, showBannerOnly = false }: RoutinesPanelProps) {
  const [routines, setRoutines] = useLocalStorage<Routine[]>(ROUTINE_STORAGE_KEYS.ROUTINES, []);
  const [scheduledRoutines, setScheduledRoutines] = useLocalStorage<ScheduledRoutine[]>(
    ROUTINE_STORAGE_KEYS.SCHEDULED_ROUTINES,
    []
  );
  const [history, setHistory] = useLocalStorage<RoutineCompletionRecord[]>(
    ROUTINE_STORAGE_KEYS.ROUTINE_HISTORY,
    []
  );

  const [showHistory, setShowHistory] = useState(false);
  const [showExecution, setShowExecution] = useState(false);
  const [showCompletion, setShowCompletion] = useState(false);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [routineToSchedule, setRoutineToSchedule] = useState<Routine | null>(null);
  const [completionData, setCompletionData] = useState<RoutineCompletionRecord | null>(null);

  const activeRoutine = useActiveRoutine();

  // CRUD operations for routines
  const handleAddRoutine = useCallback((routineData: Omit<Routine, 'id' | 'createdAt' | 'updatedAt' | 'timesCompleted' | 'lastUsedAt'>) => {
    const newRoutine: Routine = {
      ...routineData,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      timesCompleted: 0,
    };
    setRoutines([...routines, newRoutine]);
  }, [routines, setRoutines]);

  const handleUpdateRoutine = useCallback((routine: Routine) => {
    setRoutines(routines.map(r => r.id === routine.id ? routine : r));
  }, [routines, setRoutines]);

  const handleDeleteRoutine = useCallback((routineId: string) => {
    setRoutines(routines.filter(r => r.id !== routineId));
    // Also remove any scheduled instances
    setScheduledRoutines(scheduledRoutines.filter(s => s.routineId !== routineId));
  }, [routines, setRoutines, scheduledRoutines, setScheduledRoutines]);

  // Start routine
  const handleStartRoutine = useCallback((routine: Routine | ScheduledRoutine) => {
    const baseRoutine = 'routineId' in routine
      ? routines.find(r => r.id === routine.routineId)
      : routine;

    if (baseRoutine) {
      activeRoutine.startRoutine(baseRoutine);
      setShowExecution(true);
    }
  }, [routines, activeRoutine]);

  // Schedule routine
  const handleScheduleRoutine = useCallback((routine: Routine) => {
    setRoutineToSchedule(routine);
    setShowScheduleModal(true);
  }, []);

  const handleConfirmSchedule = useCallback((scheduled: ScheduledRoutine) => {
    setScheduledRoutines([...scheduledRoutines, scheduled]);
    setShowScheduleModal(false);
    setRoutineToSchedule(null);
  }, [scheduledRoutines, setScheduledRoutines]);

  // Handle routine completion
  const handleCompleteRoutine = useCallback(() => {
    if (!activeRoutine.activeRoutine) return;

    const routine = routines.find(r => r.id === activeRoutine.activeRoutine?.routineId || r.id === activeRoutine.activeRoutine?.id);
    if (!routine) return;

    // Calculate totals
    let totalActual = 0;
    let totalEstimated = 0;
    const stepBreakdown = routine.steps.map(step => {
      totalEstimated += step.estimatedMinutes;
      totalActual += step.actualMinutes || step.estimatedMinutes;
      return {
        stepName: step.name,
        estimated: step.estimatedMinutes,
        actual: step.actualMinutes || step.estimatedMinutes,
        wasSkipped: step.status === 'skipped',
      };
    });

    const record: RoutineCompletionRecord = {
      id: crypto.randomUUID(),
      routineId: routine.id,
      date: new Date().toISOString(),
      actualMinutes: totalActual,
      estimatedMinutes: totalEstimated,
      stepsCompleted: activeRoutine.progress.completedSteps,
      stepsSkipped: activeRoutine.progress.skippedSteps,
      stepBreakdown,
    };

    setHistory([record, ...history]);
    setCompletionData(record);

    // Update routine stats
    setRoutines(routines.map(r => {
      if (r.id === routine.id) {
        return {
          ...r,
          timesCompleted: (r.timesCompleted || 0) + 1,
          lastUsedAt: new Date().toISOString(),
        };
      }
      return r;
    }));

    activeRoutine.exitRoutine(false);
    setShowExecution(false);
    setShowCompletion(true);
  }, [activeRoutine, routines, history, setHistory, setRoutines]);

  // Handle exit
  const handleExitRoutine = useCallback((saveProgress?: boolean) => {
    activeRoutine.exitRoutine(saveProgress);
    setShowExecution(false);
  }, [activeRoutine]);

  // Adjust estimates based on history
  const handleAdjustEstimates = useCallback((routineId: string, suggestions: { stepName: string; suggested: number }[]) => {
    setRoutines(routines.map(r => {
      if (r.id !== routineId) return r;

      return {
        ...r,
        steps: r.steps.map(step => {
          const suggestion = suggestions.find(s => s.stepName === step.name);
          if (suggestion) {
            return { ...step, estimatedMinutes: suggestion.suggested };
          }
          return step;
        }),
        totalEstimatedMinutes: r.steps.reduce((sum, step) => {
          const suggestion = suggestions.find(s => s.stepName === step.name);
          return sum + (suggestion?.suggested || step.estimatedMinutes);
        }, 0),
        updatedAt: new Date().toISOString(),
      };
    }));
  }, [routines, setRoutines]);

  // If showing banner only mode (for integration), just render the banner
  if (showBannerOnly) {
    return (
      <>
        <RoutineNotificationManager
          routines={routines}
          scheduledRoutines={scheduledRoutines}
          onStartRoutine={handleStartRoutine}
        />

        {activeRoutine.activeRoutine && !showExecution && (
          <ActiveRoutineBanner
            routine={routines.find(r => r.id === activeRoutine.activeRoutine?.routineId) || activeRoutine.activeRoutine as unknown as Routine}
            currentStep={activeRoutine.currentStep}
            currentStepIndex={activeRoutine.currentStepIndex}
            isRunning={activeRoutine.isRunning}
            isPaused={activeRoutine.isPaused}
            elapsedSeconds={activeRoutine.elapsedSeconds}
            progress={activeRoutine.progress}
            onResume={activeRoutine.resume}
            onPause={activeRoutine.pause}
            onCompleteStep={activeRoutine.completeStep}
            onSkipStep={activeRoutine.skipStep}
            onExit={() => handleExitRoutine(true)}
            onExpand={() => setShowExecution(true)}
          />
        )}

        {/* Execution View Dialog */}
        {showExecution && activeRoutine.activeRoutine && (
          <RoutineExecutionView
            routine={routines.find(r => r.id === activeRoutine.activeRoutine?.routineId) || activeRoutine.activeRoutine as unknown as Routine}
            currentStep={activeRoutine.currentStep}
            currentStepIndex={activeRoutine.currentStepIndex}
            isRunning={activeRoutine.isRunning}
            isPaused={activeRoutine.isPaused}
            elapsedSeconds={activeRoutine.elapsedSeconds}
            progress={activeRoutine.progress}
            onResume={activeRoutine.resume}
            onPause={activeRoutine.pause}
            onCompleteStep={activeRoutine.completeStep}
            onSkipStep={activeRoutine.skipStep}
            onComplete={handleCompleteRoutine}
            onExit={() => {
              setShowExecution(false);
              // Don't exit routine, just close the modal - banner will still show
            }}
          />
        )}

        {/* Completion Summary */}
        {showCompletion && completionData && (
          <RoutineCompletionSummary
            open={showCompletion}
            onOpenChange={setShowCompletion}
            record={completionData}
            routine={routines.find(r => r.id === completionData.routineId)}
            onViewHistory={() => {
              setShowCompletion(false);
              setShowHistory(true);
            }}
          />
        )}
      </>
    );
  }

  // Full panel view
  return (
    <div className="space-y-4">
      {/* Header Actions */}
      <div className="flex justify-end gap-2">
        <Button variant="outline" size="sm" onClick={() => setShowHistory(true)} className="gap-2">
          <History className="h-4 w-4" />
          History
        </Button>
        {onOpenSettings && (
          <Button variant="outline" size="sm" onClick={onOpenSettings} className="gap-2">
            <Settings className="h-4 w-4" />
            Settings
          </Button>
        )}
      </div>

      {/* Main Routine List */}
      <RoutineList
        routines={routines}
        onAddRoutine={handleAddRoutine}
        onUpdateRoutine={handleUpdateRoutine}
        onDeleteRoutine={handleDeleteRoutine}
        onStartRoutine={handleStartRoutine}
        onScheduleRoutine={handleScheduleRoutine}
      />

      {/* Notification Manager */}
      <RoutineNotificationManager
        routines={routines}
        scheduledRoutines={scheduledRoutines}
        onStartRoutine={handleStartRoutine}
      />

      {/* Active Routine Banner */}
      {activeRoutine.activeRoutine && !showExecution && (
        <ActiveRoutineBanner
          routine={routines.find(r => r.id === activeRoutine.activeRoutine?.routineId) || activeRoutine.activeRoutine as unknown as Routine}
          currentStep={activeRoutine.currentStep}
          currentStepIndex={activeRoutine.currentStepIndex}
          isRunning={activeRoutine.isRunning}
          isPaused={activeRoutine.isPaused}
          elapsedSeconds={activeRoutine.elapsedSeconds}
          progress={activeRoutine.progress}
          onResume={activeRoutine.resume}
          onPause={activeRoutine.pause}
          onCompleteStep={activeRoutine.completeStep}
          onSkipStep={activeRoutine.skipStep}
          onExit={() => handleExitRoutine(true)}
          onExpand={() => setShowExecution(true)}
        />
      )}

      {/* Modals & Dialogs */}
      <ScheduleRoutineModal
        open={showScheduleModal}
        onOpenChange={setShowScheduleModal}
        routine={routineToSchedule}
        onSchedule={handleConfirmSchedule}
      />

      <RoutineHistoryView
        open={showHistory}
        onOpenChange={setShowHistory}
        routines={routines}
        onAdjustEstimates={handleAdjustEstimates}
      />

      {showExecution && activeRoutine.activeRoutine && (
        <RoutineExecutionView
          routine={routines.find(r => r.id === activeRoutine.activeRoutine?.routineId) || activeRoutine.activeRoutine as unknown as Routine}
          currentStep={activeRoutine.currentStep}
          currentStepIndex={activeRoutine.currentStepIndex}
          isRunning={activeRoutine.isRunning}
          isPaused={activeRoutine.isPaused}
          elapsedSeconds={activeRoutine.elapsedSeconds}
          progress={activeRoutine.progress}
          onResume={activeRoutine.resume}
          onPause={activeRoutine.pause}
          onCompleteStep={activeRoutine.completeStep}
          onSkipStep={activeRoutine.skipStep}
          onComplete={handleCompleteRoutine}
          onExit={() => handleExitRoutine(true)}
        />
      )}

      {showCompletion && completionData && (
        <RoutineCompletionSummary
          open={showCompletion}
          onOpenChange={setShowCompletion}
          record={completionData}
          routine={routines.find(r => r.id === completionData.routineId)}
          onViewHistory={() => {
            setShowCompletion(false);
            setShowHistory(true);
          }}
        />
      )}

      {/* Pause Screen */}
      {activeRoutine.isPaused && activeRoutine.activeRoutine && (
        <RoutinePauseScreen
          routine={routines.find(r => r.id === activeRoutine.activeRoutine?.routineId) || activeRoutine.activeRoutine as unknown as Routine}
          currentStep={activeRoutine.currentStep}
          onResume={activeRoutine.resume}
          onExit={() => handleExitRoutine(true)}
        />
      )}
    </div>
  );
}
