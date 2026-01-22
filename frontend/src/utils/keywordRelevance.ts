import type { MatchType } from '../types';

/**
 * Simple stemming: lowercase, remove common suffixes.
 * Returns a set of stemmed words.
 */
function getWordStems(text: string): Set<string> {
  const words = text.toLowerCase().match(/\b[a-zA-Z]{3,}\b/g) || [];
  const stems = new Set<string>();

  const suffixes = ['ing', 'ed', 'es', 's', 'ly', 'tion', 'ment', 'ness', 'able', 'ible'];

  for (const word of words) {
    let stem = word;
    for (const suffix of suffixes) {
      if (stem.endsWith(suffix) && stem.length > suffix.length + 2) {
        stem = stem.slice(0, -suffix.length);
        break;
      }
    }
    stems.add(stem);
  }

  return stems;
}

/**
 * Calculate relevance score (0-5) based on keyword occurrences in content.
 *
 * @param content - The page content to search
 * @param keywords - List of keywords to look for
 * @param matchType - "exact" for exact match, "stemmed" for stemmed match
 * @returns Relevance score from 0-5
 */
export function calculateKeywordRelevance(
  content: string,
  keywords: string[],
  matchType: MatchType = 'stemmed'
): number {
  if (!keywords.length || !content) {
    return 0;
  }

  const contentLower = content.toLowerCase();
  let totalMatches = 0;

  if (matchType === 'exact') {
    // Exact match - case insensitive
    for (const keyword of keywords) {
      const keywordLower = keyword.toLowerCase();
      // Count occurrences
      let pos = 0;
      while ((pos = contentLower.indexOf(keywordLower, pos)) !== -1) {
        totalMatches++;
        pos += keywordLower.length;
      }
    }
  } else {
    // Stemmed match
    const contentStems = getWordStems(content);
    for (const keyword of keywords) {
      const keywordStems = getWordStems(keyword);
      // Check if any keyword stem appears in content stems
      for (const stem of keywordStems) {
        if (contentStems.has(stem)) {
          // Count how many times the stem pattern appears
          const pattern = new RegExp(`\\b${stem}\\w*\\b`, 'gi');
          const matches = content.match(pattern);
          totalMatches += matches ? matches.length : 0;
        }
      }
    }
  }

  // Convert to 0-5 scale
  // 0 matches = 0, 1-2 = 1, 3-5 = 2, 6-10 = 3, 11-20 = 4, 21+ = 5
  if (totalMatches === 0) {
    return 0;
  } else if (totalMatches <= 2) {
    return 1;
  } else if (totalMatches <= 5) {
    return 2;
  } else if (totalMatches <= 10) {
    return 3;
  } else if (totalMatches <= 20) {
    return 4;
  } else {
    return 5;
  }
}

/**
 * Build keyword list from target page info and optional explicit keyword
 */
export function buildKeywordList(
  targetPageKeywords: string[],
  explicitKeyword: string | null
): string[] {
  const keywords = [...targetPageKeywords];

  if (explicitKeyword) {
    keywords.push(explicitKeyword);
    // Also add individual words from multi-word keywords
    const words = explicitKeyword.split(/\s+/).filter(w => w.length > 2);
    if (words.length > 1) {
      keywords.push(...words);
    }
  }

  return keywords;
}
