import type { MatchResult } from '../types';

/**
 * Normalizes text for comparison by:
 * - Converting to lowercase
 * - Collapsing multiple whitespace to single space
 * - Trimming
 */
function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Decodes common HTML entities
 */
function decodeHtmlEntities(text: string): string {
  return text
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ');
}

/**
 * Calculates similarity between two strings using Levenshtein distance
 * Returns a value between 0 and 1 (1 being identical)
 */
function calculateSimilarity(str1: string, str2: string): number {
  const longer = str1.length > str2.length ? str1 : str2;
  const shorter = str1.length > str2.length ? str2 : str1;

  if (longer.length === 0) return 1.0;

  const distance = levenshteinDistance(longer, shorter);
  return (longer.length - distance) / longer.length;
}

/**
 * Computes Levenshtein distance between two strings
 */
function levenshteinDistance(str1: string, str2: string): number {
  const m = str1.length;
  const n = str2.length;

  // Use a single array for space optimization
  const dp: number[] = Array(n + 1).fill(0).map((_, i) => i);

  for (let i = 1; i <= m; i++) {
    let prev = dp[0];
    dp[0] = i;

    for (let j = 1; j <= n; j++) {
      const temp = dp[j];
      if (str1[i - 1] === str2[j - 1]) {
        dp[j] = prev;
      } else {
        dp[j] = 1 + Math.min(prev, dp[j], dp[j - 1]);
      }
      prev = temp;
    }
  }

  return dp[n];
}

/**
 * Finds text in content using multiple strategies:
 * 1. Exact match
 * 2. Normalized match (case-insensitive, whitespace-collapsed)
 * 3. Fuzzy match with similarity threshold
 */
export function findTextInContent(
  content: string,
  searchText: string,
  startFrom: number = 0
): MatchResult {
  // Decode any HTML entities in both strings
  const decodedContent = decodeHtmlEntities(content);
  const decodedSearch = decodeHtmlEntities(searchText);

  // 1. Try exact match first
  const exactIndex = decodedContent.indexOf(decodedSearch, startFrom);
  if (exactIndex !== -1) {
    return {
      found: true,
      range: { start: exactIndex, end: exactIndex + decodedSearch.length },
      confidence: 1.0,
      matchType: 'exact'
    };
  }

  // 2. Try normalized match
  const normalizedContent = normalizeText(decodedContent);
  const normalizedSearch = normalizeText(decodedSearch);

  // We need to map normalized positions back to original positions
  // Build a mapping from normalized index to original index
  const positionMap = buildPositionMap(decodedContent);

  const normalizedIndex = normalizedContent.indexOf(normalizedSearch,
    positionMap.findNormalizedIndex(startFrom));

  if (normalizedIndex !== -1) {
    const originalStart = positionMap.findOriginalIndex(normalizedIndex);
    const originalEnd = positionMap.findOriginalIndex(normalizedIndex + normalizedSearch.length);

    return {
      found: true,
      range: { start: originalStart, end: originalEnd },
      confidence: 0.95,
      matchType: 'normalized'
    };
  }

  // 3. Try fuzzy match using sliding window
  const fuzzyResult = findFuzzyMatch(decodedContent, decodedSearch, startFrom, 0.85);
  if (fuzzyResult.found) {
    return fuzzyResult;
  }

  return {
    found: false,
    confidence: 0,
    matchType: 'none'
  };
}

/**
 * Builds a mapping between original and normalized text positions
 */
function buildPositionMap(original: string) {
  const normalizedToOriginal: number[] = [];
  const originalToNormalized: number[] = [];

  let normalizedIndex = 0;
  let lastWasSpace = false;

  for (let i = 0; i < original.length; i++) {
    const char = original[i].toLowerCase();
    const isWhitespace = /\s/.test(char);

    originalToNormalized[i] = normalizedIndex;

    if (isWhitespace) {
      if (!lastWasSpace && normalizedIndex > 0) {
        normalizedToOriginal[normalizedIndex] = i;
        normalizedIndex++;
      }
      lastWasSpace = true;
    } else {
      normalizedToOriginal[normalizedIndex] = i;
      normalizedIndex++;
      lastWasSpace = false;
    }
  }

  // Handle end position
  originalToNormalized[original.length] = normalizedIndex;
  normalizedToOriginal[normalizedIndex] = original.length;

  return {
    findOriginalIndex: (normalizedIdx: number) => {
      return normalizedToOriginal[Math.min(normalizedIdx, normalizedToOriginal.length - 1)] ?? 0;
    },
    findNormalizedIndex: (originalIdx: number) => {
      return originalToNormalized[Math.min(originalIdx, originalToNormalized.length - 1)] ?? 0;
    }
  };
}

/**
 * Finds a fuzzy match using sliding window comparison
 */
function findFuzzyMatch(
  content: string,
  searchText: string,
  startFrom: number,
  threshold: number
): MatchResult {
  const normalizedSearch = normalizeText(searchText);
  const searchLen = normalizedSearch.length;

  // Skip if search text is too short for fuzzy matching
  if (searchLen < 20) {
    return { found: false, confidence: 0, matchType: 'none' };
  }

  const normalizedContent = normalizeText(content);
  const positionMap = buildPositionMap(content);

  // Window size slightly larger than search to account for variations
  const windowSize = Math.floor(searchLen * 1.2);
  const startNormalized = positionMap.findNormalizedIndex(startFrom);

  let bestMatch: MatchResult = { found: false, confidence: 0, matchType: 'none' };

  // Slide window through content
  for (let i = startNormalized; i <= normalizedContent.length - searchLen; i += 10) {
    const window = normalizedContent.slice(i, i + windowSize);
    const similarity = calculateSimilarity(normalizedSearch, window.slice(0, searchLen));

    if (similarity >= threshold && similarity > bestMatch.confidence) {
      const originalStart = positionMap.findOriginalIndex(i);
      const originalEnd = positionMap.findOriginalIndex(i + searchLen);

      bestMatch = {
        found: true,
        range: { start: originalStart, end: originalEnd },
        confidence: similarity,
        matchType: 'fuzzy'
      };

      // If we found a very good match, stop searching
      if (similarity >= 0.95) break;
    }
  }

  return bestMatch;
}

/**
 * Finds anchor text within a specific range of content
 * Returns the position relative to the full content
 */
export function findAnchorInRange(
  content: string,
  rangeStart: number,
  rangeEnd: number,
  anchorText: string
): { start: number; end: number } | null {
  const rangeContent = content.slice(rangeStart, rangeEnd);

  // Try exact match first
  let anchorIndex = rangeContent.indexOf(anchorText);
  if (anchorIndex !== -1) {
    return {
      start: rangeStart + anchorIndex,
      end: rangeStart + anchorIndex + anchorText.length
    };
  }

  // Try case-insensitive match
  const lowerRange = rangeContent.toLowerCase();
  const lowerAnchor = anchorText.toLowerCase();
  anchorIndex = lowerRange.indexOf(lowerAnchor);

  if (anchorIndex !== -1) {
    return {
      start: rangeStart + anchorIndex,
      end: rangeStart + anchorIndex + anchorText.length
    };
  }

  return null;
}

/**
 * Finds all occurrences of text in content
 * Useful for finding existing link anchor texts
 */
export function findAllOccurrences(
  content: string,
  searchText: string
): Array<{ start: number; end: number }> {
  const results: Array<{ start: number; end: number }> = [];
  const lowerContent = content.toLowerCase();
  const lowerSearch = searchText.toLowerCase();

  let startIndex = 0;
  while (true) {
    const index = lowerContent.indexOf(lowerSearch, startIndex);
    if (index === -1) break;

    results.push({
      start: index,
      end: index + searchText.length
    });

    startIndex = index + 1;
  }

  return results;
}
