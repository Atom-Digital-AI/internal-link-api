import { useRef, useEffect } from 'react';
import type { TextRange, SuggestionStatus } from '../../types';
import { HighlightedContent } from './HighlightedContent';

interface ArticlePreviewProps {
  content: string;
  highlights: TextRange[];
  activeHighlightId: string | null;
  suggestionStates: Map<string, SuggestionStatus>;
  totalExistingLinks: number;
  onHighlightClick: (id: string) => void;
  onHighlightHover: (id: string | null) => void;
  scrollToHighlightId: string | null;
  onExistingLinksLegendClick?: () => void;
}

/**
 * Left panel component showing the article content with highlights
 */
export function ArticlePreview({
  content,
  highlights,
  activeHighlightId,
  suggestionStates,
  totalExistingLinks,
  onHighlightClick,
  onHighlightHover,
  scrollToHighlightId,
  onExistingLinksLegendClick
}: ArticlePreviewProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  // Scroll to highlight when triggered externally (e.g., from card hover)
  useEffect(() => {
    if (scrollToHighlightId && containerRef.current) {
      const highlightEl = containerRef.current.querySelector(
        `[data-highlight-id="${scrollToHighlightId}"]`
      );
      if (highlightEl) {
        highlightEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  }, [scrollToHighlightId]);

  // Count highlights by type for the legend
  const existingCount = highlights.filter(h => h.type === 'existing-link').length;
  const suggestionCount = highlights.filter(h => h.type === 'suggestion').length;

  if (!content) {
    return (
      <div className="article-preview" ref={containerRef}>
        <div className="article-preview__empty">
          <p>No content could be extracted from this page.</p>
          <p>This may happen if the page uses JavaScript rendering or has restricted access.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="article-preview" ref={containerRef}>
      {/* Legend */}
      <div className="article-preview__legend">
        <span
          className={`article-preview__legend-item ${onExistingLinksLegendClick ? 'article-preview__legend-item--clickable' : ''}`}
          onClick={onExistingLinksLegendClick}
          role={onExistingLinksLegendClick ? 'button' : undefined}
          tabIndex={onExistingLinksLegendClick ? 0 : undefined}
          onKeyDown={onExistingLinksLegendClick ? (e) => e.key === 'Enter' && onExistingLinksLegendClick() : undefined}
        >
          <span className="article-preview__legend-color article-preview__legend-color--existing"></span>
          Existing Links ({existingCount}{totalExistingLinks > existingCount ? ` of ${totalExistingLinks} highlighted` : ''})
        </span>
        <span className="article-preview__legend-item">
          <span className="article-preview__legend-color article-preview__legend-color--suggestion"></span>
          Suggested Links ({suggestionCount})
        </span>
      </div>

      {/* Article content */}
      <div className="article-preview__content">
        <HighlightedContent
          content={content}
          highlights={highlights}
          activeHighlightId={activeHighlightId}
          suggestionStates={suggestionStates}
          onHighlightClick={onHighlightClick}
          onHighlightHover={onHighlightHover}
        />
      </div>
    </div>
  );
}
