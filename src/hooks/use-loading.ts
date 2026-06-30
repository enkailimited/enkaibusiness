import { useState, useCallback, useRef, useEffect } from "react";

export interface LoadingState<T = unknown> {
  loading: boolean;
  error: string | null;
  data: T | null;
  retry: () => void;
  reset: () => void;
}

const DEFAULT_TIMEOUT_MS = 15_000;

export function useLoadingWithTimeout(
  timeoutMs: number = DEFAULT_TIMEOUT_MS,
) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const mountedRef = useRef(true);
  const retryCountRef = useRef(0);

  useEffect(() => {
    return () => {
      mountedRef.current = false;
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  const startTimeout = useCallback(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      if (mountedRef.current) {
        setLoading(false);
        setError("Request timed out. Please check your connection and try again.");
      }
    }, timeoutMs);
  }, [timeoutMs]);

  const clearTimeout_ = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  const wrap = useCallback(<T>(promise: Promise<T>): Promise<T | undefined> => {
    startTimeout();
    retryCountRef.current = 0;
    return promise
      .then((data) => {
        if (mountedRef.current) {
          clearTimeout_();
          setLoading(false);
          setError(null);
        }
        return data;
      })
      .catch((err) => {
        if (mountedRef.current) {
          clearTimeout_();
          setLoading(false);
          setError(err?.message || "An unexpected error occurred");
        }
        return undefined;
      });
  }, [startTimeout, clearTimeout_]);

  const retry = useCallback(() => {
    retryCountRef.current++;
    setLoading(true);
    setError(null);
  }, []);

  const reset = useCallback(() => {
    clearTimeout_();
    setLoading(true);
    setError(null);
    retryCountRef.current = 0;
  }, [clearTimeout_]);

  return { loading, setLoading, error, setError, wrap, retry, reset, startTimeout, clearTimeout_ };
}

export function useAbortController() {
  const controllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    return () => {
      if (controllerRef.current) {
        controllerRef.current.abort();
      }
    };
  }, []);

  const getSignal = useCallback(() => {
    if (controllerRef.current) {
      controllerRef.current.abort();
    }
    controllerRef.current = new AbortController();
    return controllerRef.current.signal;
  }, []);

  const abort = useCallback(() => {
    if (controllerRef.current) {
      controllerRef.current.abort();
      controllerRef.current = null;
    }
  }, []);

  return { getSignal, abort };
}
