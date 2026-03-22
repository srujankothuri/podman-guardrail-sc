import { useState, useEffect, useRef, useCallback } from 'react';
import { getJobStatus, JobStatusValue } from '../lib/api';

interface UseJobPollerResult {
  status: JobStatusValue | null;
  answer: string | null;
  insufficientData: boolean;
  error: string | null;
  reset: () => void;
}

const TERMINAL_STATUSES: JobStatusValue[] = ['completed', 'blocked', 'failed'];
const POLL_INTERVAL = 3000;

export function useJobPoller(jobId: string | null): UseJobPollerResult {
  const [status, setStatus] = useState<JobStatusValue | null>(null);
  const [answer, setAnswer] = useState<string | null>(null);
  const [insufficientData, setInsufficientData] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const reset = useCallback(() => {
    setStatus(null);
    setAnswer(null);
    setInsufficientData(false);
    setError(null);
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (!jobId) return;

    let cancelled = false;

    const poll = async () => {
      try {
        const data = await getJobStatus(jobId);
        if (cancelled) return;

        setStatus(data.status);

        if (data.answer) {
          setAnswer(data.answer);
        }
        if (data.insufficient_data) {
          setInsufficientData(true);
        }

        if (TERMINAL_STATUSES.includes(data.status)) {
          if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
          }
        }
      } catch (err) {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : 'Polling failed');
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
      }
    };

    // Initial poll immediately
    poll();

    // Then poll every 3s
    intervalRef.current = setInterval(poll, POLL_INTERVAL);

    return () => {
      cancelled = true;
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [jobId]);

  return { status, answer, insufficientData, error, reset };
}