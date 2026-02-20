import type { PageInfo, AnalyzeResponse, LinkSuggestion, MatchType } from '../types';
import { getAiSuggestion, matchLinks } from './api';

/**
 * Get internal link suggestions using embedding matching + optional AI enhancement.
 *
 * Step 1: Call /match-links to find semantically similar content windows.
 * Step 2 (paid users): Call /ai/suggest for each match to get anchor text + reasoning.
 * Step 2 (free users): Return matches directly with matched_text as the suggestion.
 */
export async function getInternalLinkSuggestions(
  pageData: AnalyzeResponse,
  targetPages: PageInfo[],
  filterTargetUrl?: string,
  _filterKeyword?: string,
  _filterMatchType?: MatchType,
  accessToken?: string | null
): Promise<LinkSuggestion[]> {
  const token = accessToken || null;

  // Build target list with titles (use URL slug as fallback title)
  const pagesToMatch = filterTargetUrl
    ? targetPages.filter(p => p.url === filterTargetUrl)
    : targetPages.slice(0, 20);

  if (pagesToMatch.length === 0) {
    throw new Error('No target pages available for matching.');
  }

  const targets = pagesToMatch.map(p => ({
    url: p.url,
    title: p.url.split('/').filter(Boolean).slice(-2).join(' ').replace(/-/g, ' ') || p.url,
  }));

  // Step 1: Embedding-based matching (free, all users)
  const { matches } = await matchLinks(token, pageData.extracted_content, targets);

  if (matches.length === 0) {
    throw new Error('No relevant link opportunities found for this page.');
  }

  // Step 2: Enhance top matches with AI (paid users only)
  // Try AI suggestions — if it fails (free user / limit reached), fall back to raw matches
  const suggestions: LinkSuggestion[] = [];

  const aiResults = await Promise.allSettled(
    matches.slice(0, 5).map(match =>
      getAiSuggestion(token, {
        source_url: pageData.url,
        source_content: match.matched_text,
        target_url: match.target_url,
        target_title: match.target_title,
        target_keywords: [],
      })
    )
  );

  for (let i = 0; i < matches.length && i < 5; i++) {
    const match = matches[i];
    const aiResult = aiResults[i];

    if (aiResult.status === 'fulfilled') {
      // AI-enhanced suggestion
      suggestions.push({
        sentence: aiResult.value.suggestion,
        targetUrl: match.target_url,
        anchorText: match.target_title,
        reason: aiResult.value.reasoning,
      });
    } else {
      // Fallback: use the matched text window directly
      suggestions.push({
        sentence: match.matched_text,
        targetUrl: match.target_url,
        anchorText: match.target_title,
        reason: `Semantic match (${Math.round(match.similarity * 100)}% relevance)`,
      });
    }
  }

  if (suggestions.length === 0) {
    throw new Error('Failed to generate link suggestions. Please try again.');
  }

  return suggestions;
}
