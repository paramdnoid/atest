"use client";

import { useCallback, useEffect, useState } from "react";

const RECENT_SEARCHES_KEY = "faq-recent-searches";
const MAX_RECENT_SEARCHES = 5;

function loadRecentSearches(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(RECENT_SEARCHES_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter((entry): entry is string => typeof entry === "string")
      .slice(0, MAX_RECENT_SEARCHES);
  } catch {
    return [];
  }
}

/**
 * Manages a list of recent search terms persisted to localStorage.
 * Only persists while `active` is true (e.g., while a dialog is open).
 */
export function useRecentSearches(active: boolean) {
  const [recentSearches, setRecentSearches] = useState<string[]>(() =>
    loadRecentSearches(),
  );

  const rememberSearch = useCallback((rawTerm: string) => {
    const term = rawTerm.trim();
    if (term.length < 2) return;
    setRecentSearches((current) => {
      const next = [
        term,
        ...current.filter(
          (entry) => entry.toLowerCase() !== term.toLowerCase(),
        ),
      ];
      return next.slice(0, MAX_RECENT_SEARCHES);
    });
  }, []);

  const clearSearches = useCallback(() => setRecentSearches([]), []);

  // Persist to localStorage while active
  useEffect(() => {
    if (!active) return;
    localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(recentSearches));
  }, [active, recentSearches]);

  return { recentSearches, rememberSearch, clearSearches };
}
