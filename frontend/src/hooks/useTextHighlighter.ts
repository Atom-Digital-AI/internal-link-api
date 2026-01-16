import { useMemo } from 'react';
import type { TextRange, LinkSuggestion, LinkInfo } from '../types';
import { findTextInContent, findAnchorInRange, findAllOccurrences } from '../utils/textMatcher';

interface UseTextHighlighterResult {
  highlights: TextRange[];
  unmatchedSuggestions: number[];
}

/**
 * Hook that computes highlight positions for suggestions and existing links
 * in the article content.
 */
export function useTextHighlighter(
  content: string,
  suggestions: LinkSuggestion[],
  existingLinks: LinkInfo[]
): UseTextHighlighterResult {
  return useMemo(() => {
    if (!content) {
      return { highlights: [], unmatchedSuggestions: [] };
    }

    const highlights: TextRange[] = [];
    const usedRanges = new Set<string>();
    const unmatchedSuggestions: number[] = [];

    // Helper to check if a range overlaps with any used range
    const isRangeUsed = (start: number, end: number): boolean => {
      for (const rangeKey of usedRanges) {
        const [usedStart, usedEnd] = rangeKey.split('-').map(Number);
        // Check for overlap
        if (start < usedEnd && end > usedStart) {
          return true;
        }
      }
      return false;
    };

    // Helper to mark a range as used
    const markRangeUsed = (start: number, end: number) => {
      usedRanges.add(`${start}-${end}`);
    };

    // Process existing links first (they take priority)
    existingLinks.forEach((link, index) => {
      if (!link.anchor_text || link.anchor_text.trim() === '') return;

      // Find all occurrences of the anchor text
      const occurrences = findAllOccurrences(content, link.anchor_text);

      // Use the first occurrence that isn't already used
      for (const occurrence of occurrences) {
        if (!isRangeUsed(occurrence.start, occurrence.end)) {
          highlights.push({
            id: `existing-${index}`,
            startIndex: occurrence.start,
            endIndex: occurrence.end,
            type: 'existing-link',
            metadata: { linkInfo: link }
          });
          markRangeUsed(occurrence.start, occurrence.end);
          break;
        }
      }
    });

    // Process AI suggestions
    suggestions.forEach((suggestion, index) => {
      // First, find the sentence in the content
      const sentenceMatch = findTextInContent(content, suggestion.sentence);

      if (!sentenceMatch.found || !sentenceMatch.range) {
        unmatchedSuggestions.push(index);
        return;
      }

      // Then find the anchor text within that sentence range
      const anchorRange = findAnchorInRange(
        content,
        sentenceMatch.range.start,
        sentenceMatch.range.end,
        suggestion.anchorText
      );

      if (anchorRange && !isRangeUsed(anchorRange.start, anchorRange.end)) {
        highlights.push({
          id: `suggestion-${index}`,
          startIndex: anchorRange.start,
          endIndex: anchorRange.end,
          type: 'suggestion',
          metadata: {
            suggestionIndex: index,
            suggestion
          }
        });
        markRangeUsed(anchorRange.start, anchorRange.end);
      } else if (!anchorRange) {
        // Anchor not found within sentence, try to highlight the whole sentence area
        // but only if it's not too long
        if (sentenceMatch.range.end - sentenceMatch.range.start <= 200) {
          // Find just the anchor text anywhere in content near the sentence
          const nearbyAnchor = findAllOccurrences(
            content.slice(
              Math.max(0, sentenceMatch.range.start - 50),
              Math.min(content.length, sentenceMatch.range.end + 50)
            ),
            suggestion.anchorText
          );

          if (nearbyAnchor.length > 0) {
            const adjustedStart = Math.max(0, sentenceMatch.range.start - 50) + nearbyAnchor[0].start;
            const adjustedEnd = adjustedStart + suggestion.anchorText.length;

            if (!isRangeUsed(adjustedStart, adjustedEnd)) {
              highlights.push({
                id: `suggestion-${index}`,
                startIndex: adjustedStart,
                endIndex: adjustedEnd,
                type: 'suggestion',
                metadata: {
                  suggestionIndex: index,
                  suggestion
                }
              });
              markRangeUsed(adjustedStart, adjustedEnd);
              return;
            }
          }
        }
        unmatchedSuggestions.push(index);
      } else {
        // Range is already used (overlapping highlight)
        unmatchedSuggestions.push(index);
      }
    });

    // Sort highlights by position for proper rendering
    highlights.sort((a, b) => a.startIndex - b.startIndex);

    return { highlights, unmatchedSuggestions };
  }, [content, suggestions, existingLinks]);
}
