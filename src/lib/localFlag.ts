"use client";

import { useSyncExternalStore } from "react";

/**
 * A yes/no preference kept in localStorage — "don't show me this again" and
 * friends. Read through useSyncExternalStore so the server render and the first
 * client paint agree (both start false) and every reader updates together.
 */
const listeners = new Set<() => void>();

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function readLocalFlag(key: string): boolean {
  try {
    return localStorage.getItem(key) === "1";
  } catch {
    return false;
  }
}

export function setLocalFlag(key: string, value: boolean): void {
  try {
    if (value) localStorage.setItem(key, "1");
    else localStorage.removeItem(key);
  } catch {
    /* private browsing — the preference just doesn't stick */
  }
  listeners.forEach((listener) => listener());
}

export function useLocalFlag(key: string): boolean {
  return useSyncExternalStore(
    subscribe,
    () => readLocalFlag(key),
    () => false,
  );
}
