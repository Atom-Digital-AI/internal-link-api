import { useState, useCallback, useMemo } from 'react';
import type { SuggestionStatus, LinkSuggestion, EnhancedSuggestion, TextRange } from '../types';

interface UseSuggestionStateResult {
  enhancedSuggestions: EnhancedSuggestion[];
  states: Map<string, SuggestionStatus>;
  accept: (id: string) => void;
  ignore: (id: string) => void;
  reset: (id: string) => void;
  resetAll: () => void;
  pendingCount: number;
  acceptedCount: number;
  ignoredCount: number;
}

/**
 * Hook to manage the accept/ignore state of suggestions
 */
export function useSuggestionState(
  suggestions: LinkSuggestion[],
  highlights: TextRange[],
  unmatchedIndices: number[]
): UseSuggestionStateResult {
  const [states, setStates] = useState<Map<string, SuggestionStatus>>(new Map());

  const accept = useCallback((id: string) => {
    setStates(prev => {
      const next = new Map(prev);
      next.set(id, 'accepted');
      return next;
    });
  }, []);

  const ignore = useCallback((id: string) => {
    setStates(prev => {
      const next = new Map(prev);
      next.set(id, 'ignored');
      return next;
    });
  }, []);

  const reset = useCallback((id: string) => {
    setStates(prev => {
      const next = new Map(prev);
      next.set(id, 'pending');
      return next;
    });
  }, []);

  const resetAll = useCallback(() => {
    setStates(new Map());
  }, []);

  // Create enhanced suggestions with status and highlight info
  const enhancedSuggestions: EnhancedSuggestion[] = useMemo(() => {
    return suggestions.map((suggestion, index) => {
      const id = `suggestion-${index}`;
      const highlight = highlights.find(h => h.id === id) || null;
      const matchConfidence = highlight
        ? 1.0
        : unmatchedIndices.includes(index)
          ? 0
          : 0.5;

      return {
        ...suggestion,
        id,
        status: states.get(id) || 'pending',
        highlightRange: highlight,
        matchConfidence
      };
    });
  }, [suggestions, highlights, unmatchedIndices, states]);

  // Calculate counts
  const counts = useMemo(() => {
    let pending = 0;
    let accepted = 0;
    let ignored = 0;

    enhancedSuggestions.forEach(s => {
      switch (s.status) {
        case 'pending':
          pending++;
          break;
        case 'accepted':
          accepted++;
          break;
        case 'ignored':
          ignored++;
          break;
      }
    });

    return { pending, accepted, ignored };
  }, [enhancedSuggestions]);

  return {
    enhancedSuggestions,
    states,
    accept,
    ignore,
    reset,
    resetAll,
    pendingCount: counts.pending,
    acceptedCount: counts.accepted,
    ignoredCount: counts.ignored
  };
}
