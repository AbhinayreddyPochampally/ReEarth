'use client';

import { useSyncExternalStore } from 'react';

export const DAILY_LOG_STORAGE_KEY = 'reearth:demo-daily-logs';
const DAILY_LOG_EVENT = 'reearth:demo-daily-logs-changed';

export type StoredDailyLog = {
  parameterCode: string;
  value: number;
  unit: string;
};

const EMPTY_LOGS: StoredDailyLog[] = [];
let lastRaw: string | null = null;
let lastParsed: StoredDailyLog[] = EMPTY_LOGS;

function parseLogs(raw: string | null): StoredDailyLog[] {
  if (raw === lastRaw) return lastParsed;
  lastRaw = raw;
  if (!raw) {
    lastParsed = EMPTY_LOGS;
    return lastParsed;
  }
  try {
    const parsed = JSON.parse(raw) as StoredDailyLog[];
    lastParsed = Array.isArray(parsed) ? parsed : EMPTY_LOGS;
    return lastParsed;
  } catch {
    lastParsed = EMPTY_LOGS;
    return lastParsed;
  }
}

export function readStoredDailyLogs(): StoredDailyLog[] {
  if (typeof window === 'undefined') return EMPTY_LOGS;
  return parseLogs(window.localStorage.getItem(DAILY_LOG_STORAGE_KEY));
}

export function writeStoredDailyLogs(logs: StoredDailyLog[]): void {
  window.localStorage.setItem(DAILY_LOG_STORAGE_KEY, JSON.stringify(logs));
  window.dispatchEvent(new Event(DAILY_LOG_EVENT));
}

function subscribe(callback: () => void): () => void {
  window.setTimeout(callback, 0);
  window.addEventListener(DAILY_LOG_EVENT, callback);
  window.addEventListener('storage', callback);
  return () => {
    window.removeEventListener(DAILY_LOG_EVENT, callback);
    window.removeEventListener('storage', callback);
  };
}

export function useStoredDailyLogs(): StoredDailyLog[] {
  return useSyncExternalStore(subscribe, readStoredDailyLogs, () => EMPTY_LOGS);
}
