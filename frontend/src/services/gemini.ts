import type { PageInfo, AnalyzeResponse, LinkSuggestion, MatchType } from '../types';
import { getAiSuggestion } from './api';

// Note: VITE_GEMINI_API_KEY and VITE_GEMINI_MODEL are no longer used.
// AI suggestions are proxied through the backend /ai/suggest endpoint.

export async function getInternalLinkSuggestions(
  pageData: AnalyzeResponse,
  targetPages: PageInfo[],
  filterTargetUrl?: string,
  _filterKeyword?: string,
  _filterMatchType?: MatchType,
  accessToken?: string | null
): Promise<LinkSuggestion[]> {
  // Determine which target pages to request suggestions for
  const pagesToAnalyze = filterTargetUrl
    ? targetPages.filter(p => p.url === filterTargetUrl).slice(0, 1)
    : targetPages.slice(0, 5);

  if (pagesToAnalyze.length === 0) {
    throw new Error('No target pages available for AI suggestions.');
  }

  const token = accessToken || null;
  const sourceContent = pageData.extracted_content.slice(0, 6000);

  // Call backend /ai/suggest for each target page and collect suggestions
  const results = await Promise.allSettled(
    pagesToAnalyze.map(target =>
      getAiSuggestion(token, {
        source_url: pageData.url,
        source_content: sourceContent,
        target_url: target.url,
        target_title: target.url,
        target_keywords: [],
      })
    )
  );

  const suggestions: LinkSuggestion[] = [];

  for (let i = 0; i < results.length; i++) {
    const result = results[i];
    if (result.status === 'fulfilled') {
      const { suggestion, reasoning } = result.value;
      // The backend returns a text suggestion, not structured JSON.
      // Wrap it into the LinkSuggestion format.
      suggestions.push({
        sentence: suggestion,
        targetUrl: pagesToAnalyze[i].url,
        anchorText: pagesToAnalyze[i].url.split('/').filter(Boolean).pop() || 'link',
        reason: reasoning,
      });
    }
  }

  if (suggestions.length === 0) {
    throw new Error('Failed to get AI suggestions. Please try again.');
  }

  return suggestions;
}
