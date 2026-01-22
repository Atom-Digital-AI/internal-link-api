import { useState, useCallback, useEffect } from 'react';
import type { AnalyzeResponse, PageInfo, LinkSuggestion, EnhancedSuggestion, MatchType } from '../../types';
import { useTextHighlighter } from '../../hooks/useTextHighlighter';
import { useSuggestionState } from '../../hooks/useSuggestionState';
import { useSavedLinks } from '../../hooks/useSavedLinks';
import { DetailHeader } from './DetailHeader';
import { ArticlePreview } from './ArticlePreview';
import { ActionPanel } from './ActionPanel';
import { getInternalLinkSuggestions } from '../../services/gemini';

interface ContextualEditorProps {
  pageData: AnalyzeResponse;
  targetPages: PageInfo[];
  onBack: () => void;
}

/**
 * Main split-view contextual editor component
 * Orchestrates the article preview and action panel with synchronized interactions
 */
export function ContextualEditor({
  pageData,
  targetPages,
  onBack
}: ContextualEditorProps) {
  // Raw suggestions from AI
  const [suggestions, setSuggestions] = useState<LinkSuggestion[]>([]);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
  const [suggestionsError, setSuggestionsError] = useState<string | null>(null);

  // Active/hovered state for synchronization
  const [activeHighlightId, setActiveHighlightId] = useState<string | null>(null);
  const [scrollToHighlightId, setScrollToHighlightId] = useState<string | null>(null);
  const [scrollToCardId, setScrollToCardId] = useState<string | null>(null);

  // Control existing links section visibility from parent
  const [showExistingLinks, setShowExistingLinks] = useState(false);

  // Filter options for focused suggestions
  const [filterTargetUrl, setFilterTargetUrl] = useState('');
  const [filterKeyword, setFilterKeyword] = useState('');
  const [filterMatchType, setFilterMatchType] = useState<MatchType>('stemmed');

  // Saved links functionality
  const { saveLink, isLinkSaved } = useSavedLinks();

  // Compute highlight positions from content, suggestions, and existing links
  const { highlights, unmatchedSuggestions } = useTextHighlighter(
    pageData.extracted_content,
    suggestions,
    pageData.internal_links.links
  );

  // Manage suggestion accept/ignore states
  const {
    enhancedSuggestions,
    states: suggestionStates,
    accept,
    ignore,
    acceptedCount
  } = useSuggestionState(suggestions, highlights, unmatchedSuggestions);

  // Auto-fetch suggestions on mount if page needs links
  useEffect(() => {
    const needsLinks = pageData.internal_links.to_target_pages === 0 || pageData.link_density > 500;
    if (needsLinks && suggestions.length === 0 && !isLoadingSuggestions) {
      handleGetSuggestions();
    }
  }, []); // Only on mount

  // Fetch AI suggestions
  const handleGetSuggestions = useCallback(async () => {
    setIsLoadingSuggestions(true);
    setSuggestionsError(null);

    try {
      const result = await getInternalLinkSuggestions(
        pageData,
        targetPages,
        filterTargetUrl || undefined,
        filterKeyword || undefined,
        filterMatchType
      );
      setSuggestions(result);
    } catch (error) {
      console.error('Failed to get suggestions:', error);
      setSuggestionsError(error instanceof Error ? error.message : 'Failed to get suggestions');
    } finally {
      setIsLoadingSuggestions(false);
    }
  }, [pageData, targetPages, filterTargetUrl, filterKeyword, filterMatchType]);

  // Clear filters
  const handleClearFilters = useCallback(() => {
    setFilterTargetUrl('');
    setFilterKeyword('');
    setFilterMatchType('stemmed');
  }, []);

  // Handle highlight click - scroll to corresponding card
  const handleHighlightClick = useCallback((id: string) => {
    setActiveHighlightId(id);
    setScrollToCardId(id);
    // Clear scroll trigger after a short delay
    setTimeout(() => setScrollToCardId(null), 100);
  }, []);

  // Handle highlight hover - show corresponding card as active
  const handleHighlightHover = useCallback((id: string | null) => {
    setActiveHighlightId(id);
  }, []);

  // Handle card click - scroll to corresponding highlight
  const handleCardClick = useCallback((id: string) => {
    setActiveHighlightId(id);
    setScrollToHighlightId(id);
    setTimeout(() => setScrollToHighlightId(null), 100);
  }, []);

  // Handle card hover - scroll to and highlight the corresponding text
  const handleCardHover = useCallback((id: string | null) => {
    setActiveHighlightId(id);
    if (id) {
      setScrollToHighlightId(id);
      setTimeout(() => setScrollToHighlightId(null), 100);
    }
  }, []);

  // Handle existing link click - scroll to corresponding highlight
  const handleExistingLinkClick = useCallback((index: number) => {
    const id = `existing-${index}`;
    setActiveHighlightId(id);
    setScrollToHighlightId(id);
    setTimeout(() => setScrollToHighlightId(null), 100);
  }, []);

  // Handle existing link hover - scroll to and highlight the corresponding text
  const handleExistingLinkHover = useCallback((index: number | null) => {
    const id = index !== null ? `existing-${index}` : null;
    setActiveHighlightId(id);
    if (id) {
      setScrollToHighlightId(id);
      setTimeout(() => setScrollToHighlightId(null), 100);
    }
  }, []);

  // Handle clicks on existing links legend/stats - expand and scroll to existing links section
  const handleShowExistingLinks = useCallback(() => {
    setShowExistingLinks(true);
  }, []);

  // Handle copy - copy HTML link code to clipboard
  const handleCopy = useCallback(async (anchorText: string, targetUrl: string) => {
    const html = `<a href="${targetUrl}">${anchorText}</a>`;
    try {
      await navigator.clipboard.writeText(html);
    } catch (error) {
      console.error('Failed to copy to clipboard:', error);
    }
  }, []);

  // Handle save link to saved links list
  const handleSaveLink = useCallback((suggestion: EnhancedSuggestion) => {
    saveLink({
      sourceUrl: pageData.url,
      sourceTitle: pageData.title,
      targetUrl: suggestion.targetUrl,
      anchorText: suggestion.anchorText,
      reason: suggestion.reason,
      sentence: suggestion.sentence,
    });
  }, [pageData.url, pageData.title, saveLink]);

  // Check if a link is already saved (curried for ActionPanel)
  const checkIsLinkSaved = useCallback((targetUrl: string, anchorText: string) => {
    return isLinkSaved(pageData.url, targetUrl, anchorText);
  }, [pageData.url, isLinkSaved]);

  // Stats for header
  const stats = {
    wordCount: pageData.word_count,
    existingLinks: pageData.internal_links.total,
    targetLinks: pageData.internal_links.to_target_pages,
    suggestionsCount: suggestions.length,
    acceptedCount
  };

  return (
    <div className="contextual-editor">
      <DetailHeader
        title={pageData.title}
        url={pageData.url}
        stats={stats}
        onBack={onBack}
        onExistingLinksClick={handleShowExistingLinks}
      />

      {suggestionsError && (
        <div className="contextual-editor__error">
          <p>Error getting suggestions: {suggestionsError}</p>
          <button onClick={handleGetSuggestions}>Try Again</button>
        </div>
      )}

      <div className="contextual-editor__body">
        <ArticlePreview
          content={pageData.extracted_content}
          highlights={highlights}
          activeHighlightId={activeHighlightId}
          suggestionStates={suggestionStates}
          totalExistingLinks={pageData.internal_links.total}
          onHighlightClick={handleHighlightClick}
          onHighlightHover={handleHighlightHover}
          scrollToHighlightId={scrollToHighlightId}
          onExistingLinksLegendClick={handleShowExistingLinks}
        />

        <ActionPanel
          suggestions={enhancedSuggestions}
          existingLinks={pageData.internal_links.links}
          activeCardId={activeHighlightId}
          isLoading={isLoadingSuggestions}
          onAccept={accept}
          onIgnore={ignore}
          onCopy={handleCopy}
          onCardHover={handleCardHover}
          onCardClick={handleCardClick}
          onExistingLinkClick={handleExistingLinkClick}
          onExistingLinkHover={handleExistingLinkHover}
          onGetSuggestions={handleGetSuggestions}
          scrollToCardId={scrollToCardId}
          showExistingLinks={showExistingLinks}
          onShowExistingLinksChange={setShowExistingLinks}
          onSaveLink={handleSaveLink}
          isLinkSaved={checkIsLinkSaved}
          sourceUrl={pageData.url}
          targetPages={targetPages}
          filterTargetUrl={filterTargetUrl}
          filterKeyword={filterKeyword}
          filterMatchType={filterMatchType}
          onFilterTargetUrlChange={setFilterTargetUrl}
          onFilterKeywordChange={setFilterKeyword}
          onFilterMatchTypeChange={setFilterMatchType}
          onFilterClear={handleClearFilters}
        />
      </div>
    </div>
  );
}
