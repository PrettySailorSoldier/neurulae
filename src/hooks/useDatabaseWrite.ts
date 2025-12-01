import { useState, useCallback, useRef } from 'react';
import { toast } from 'sonner';

interface WriteMetadata {
  timestamp: number;
  success: boolean;
}

const FAILURE_THRESHOLD = 3;
const FAILURE_WINDOW_MS = 60000; // 60 seconds
const CIRCUIT_BREAKER_DURATION_MS = 30000; // 30 seconds

export function useDatabaseWrite() {
  const [isPaused, setIsPaused] = useState(false);
  const [inFlightRequest, setInFlightRequest] = useState(false);
  const writeHistory = useRef<WriteMetadata[]>([]);
  const pausedUntil = useRef<number | null>(null);

  const checkCircuitBreaker = useCallback(() => {
    const now = Date.now();

    // Resume if pause period has elapsed
    if (pausedUntil.current && now > pausedUntil.current) {
      pausedUntil.current = null;
      setIsPaused(false);
      writeHistory.current = [];
      toast.success('Sync resumed');
      return false;
    }

    // Check if we should trip the circuit breaker
    const recentWrites = writeHistory.current.filter(
      w => now - w.timestamp < FAILURE_WINDOW_MS
    );
    const recentFailures = recentWrites.filter(w => !w.success);

    if (recentFailures.length >= FAILURE_THRESHOLD) {
      pausedUntil.current = now + CIRCUIT_BREAKER_DURATION_MS;
      setIsPaused(true);
      toast.error('Offline mode: Too many sync failures. Retrying in 30s...');
      return true;
    }

    return isPaused;
  }, [isPaused]);

  const executeWrite = useCallback(async <T>(
    writeFn: () => Promise<T>,
    onSuccess?: (result: T) => void,
    onError?: (error: any) => void
  ): Promise<T | null> => {
    // Check circuit breaker
    if (checkCircuitBreaker()) {
      onError?.(new Error('Circuit breaker open'));
      return null;
    }

    // Prevent concurrent requests (deduplication)
    if (inFlightRequest) {
      console.warn('Write request already in flight, skipping duplicate');
      return null;
    }

    setInFlightRequest(true);
    const startTime = Date.now();

    try {
      const result = await writeFn();
      
      // Record success
      writeHistory.current.push({ timestamp: Date.now(), success: true });
      
      // Keep only recent history
      writeHistory.current = writeHistory.current.filter(
        w => Date.now() - w.timestamp < FAILURE_WINDOW_MS
      );

      onSuccess?.(result);
      return result;
    } catch (error) {
      // Record failure
      writeHistory.current.push({ timestamp: Date.now(), success: false });
      
      console.error('Database write failed:', error);
      onError?.(error);

      // Check if we should trip circuit breaker after this failure
      checkCircuitBreaker();

      return null;
    } finally {
      setInFlightRequest(false);
    }
  }, [checkCircuitBreaker, inFlightRequest]);

  return {
    executeWrite,
    isPaused,
    inFlightRequest,
  };
}
