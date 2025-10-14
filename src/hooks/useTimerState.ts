import { useState, useEffect, useRef } from 'react';
import { useLocalStorage } from './useLocalStorage';

interface TimerState {
  isRunning: boolean;
  timeRemaining: number;
  timerType: 'chime' | 'interval' | 'flowtime' | 'sequence' | null;
  config?: any;
}

export function useTimerState() {
  const [timerState, setTimerState] = useLocalStorage<TimerState>('neupath-active-timer', {
    isRunning: false,
    timeRemaining: 0,
    timerType: null,
    config: null,
  });

  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (timerState.isRunning && timerState.timeRemaining > 0) {
      intervalRef.current = setInterval(() => {
        setTimerState((prev) => ({
          ...prev,
          timeRemaining: Math.max(0, prev.timeRemaining - 1),
        }));
      }, 1000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [timerState.isRunning, timerState.timeRemaining]);

  const startTimer = (type: TimerState['timerType'], seconds: number, config?: any) => {
    setTimerState({
      isRunning: true,
      timeRemaining: seconds,
      timerType: type,
      config,
    });
  };

  const stopTimer = () => {
    setTimerState({
      isRunning: false,
      timeRemaining: 0,
      timerType: null,
      config: null,
    });
  };

  const pauseTimer = () => {
    setTimerState((prev) => ({ ...prev, isRunning: false }));
  };

  const resumeTimer = () => {
    setTimerState((prev) => ({ ...prev, isRunning: true }));
  };

  return {
    timerState,
    startTimer,
    stopTimer,
    pauseTimer,
    resumeTimer,
  };
}
