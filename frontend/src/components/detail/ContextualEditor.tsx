import { useState, useCallback, useEffect } from 'react';
import type { AnalyzeResponse, PageInfo, LinkSuggestion, EnhancedSuggestion, MatchType } from '../../types';
import { useTextHighlighter } from '../../hooks/useTextHighlighter';
import { useSuggestionState } from '../../hooks/useSuggestionState';
import { useSavedLinks } from '../../hooks/useSavedLinks';
import { DetailHeader } from './DetailHeader';
import { ArticlePreview } from './ArticlePreview';
import { ActionPanel } from './ActionPanel';
import { getInternalLinkSuggestions } from '../../services/gemini';
import { useAuth } from '../../contexts/AuthContext';
import { Link } from 'react-router-dom';

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
  const { user, accessToken } = useAuth();
  const isPro = user?.plan === 'pro';
  const [showAiProModal, setShowAiProModal] = useState(false);

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

  // Auto-fetch suggestions on mount if page needs links (Pro only)
  useEffect(() => {
    const needsLinks = pageData.link_density < 0.35;
    if (isPro && needsLinks && suggestions.length === 0 && !isLoadingSuggestions) {
      handleGetSuggestions();
    }
  }, []); // Only on mount

  // Fetch AI suggestions
  const handleGetSuggestions = useCallback(async () => {
    if (!isPro) {
      setShowAiProModal(true);
      return;
    }
    setIsLoadingSuggestions(true);
    setSuggestionsError(null);

    try {
      const result = await getInternalLinkSuggestions(
        pageData,
        targetPages,
        filterTargetUrl || undefined,
        filterKeyword || undefined,
        filterMatchType,
        accessToken
      );
      setSuggestions(result);
    } catch (error) {
      console.error('Failed to get suggestions:', error);
      setSuggestionsError(error instanceof Error ? error.message : 'Failed to get suggestions');
    } finally {
      setIsLoadingSuggestions(false);
    }
  }, [isPro, pageData, targetPages, filterTargetUrl, filterKeyword, filterMatchType]);

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
      {showAiProModal && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999,
        }}>
          <div style={{
            background: '#FFFFFF', borderRadius: '12px', padding: '32px',
            maxWidth: '400px', width: '90%', border: '1px solid rgba(0,0,0,0.08)',
            boxShadow: '0 20px 40px rgba(0,0,0,0.15)', textAlign: 'center',
          }}>
            <div style={{ fontSize: '2rem', marginBottom: '12px' }}>🤖</div>
            <h2 style={{ color: '#1D1D1F', fontSize: '1.25rem', fontWeight: 700, margin: '0 0 8px' }}>
              AI Suggestions is a Pro feature
            </h2>
            <p style={{ color: '#6E6E73', fontSize: '0.875rem', margin: '0 0 24px' }}>
              Upgrade to Pro to get AI-powered link suggestions, 500 URLs/scan, and unlimited saved sessions.
            </p>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
              <Link
                to="/pricing"
                style={{
                  padding: '8px 20px', background: '#0071E3',
                  borderRadius: '980px', border: 'none', color: '#fff',
                  textDecoration: 'none', fontWeight: 600, fontSize: '0.875rem',
                }}
              >
                Upgrade to Pro
              </Link>
              <button
                onClick={() => setShowAiProModal(false)}
                style={{
                  padding: '8px 20px', background: '#F5F5F7', border: '1px solid transparent',
                  borderRadius: '980px', color: '#1D1D1F', cursor: 'pointer', fontSize: '0.875rem',
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

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
