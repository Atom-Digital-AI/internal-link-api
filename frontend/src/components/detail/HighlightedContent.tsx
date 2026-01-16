import { useMemo, Fragment } from 'react';
import type { TextRange, SuggestionStatus } from '../../types';

interface HighlightedContentProps {
  content: string;
  highlights: TextRange[];
  activeHighlightId: string | null;
  suggestionStates: Map<string, SuggestionStatus>;
  onHighlightClick: (id: string) => void;
  onHighlightHover: (id: string | null) => void;
}

/**
 * Renders article content with highlighted spans for existing links and suggestions
 */
export function HighlightedContent({
  content,
  highlights,
  activeHighlightId,
  suggestionStates,
  onHighlightClick,
  onHighlightHover
}: HighlightedContentProps) {
  // Build segments of text with highlights
  const segments = useMemo(() => {
    if (!content || highlights.length === 0) {
      return [{ type: 'text' as const, content, key: 'full' }];
    }

    const result: Array<
      | { type: 'text'; content: string; key: string }
      | { type: 'highlight'; content: string; highlight: TextRange; key: string }
    > = [];

    let lastIndex = 0;

    highlights.forEach((highlight, idx) => {
      // Add text before this highlight
      if (highlight.startIndex > lastIndex) {
        result.push({
          type: 'text',
          content: content.slice(lastIndex, highlight.startIndex),
          key: `text-${idx}`
        });
      }

      // Add the highlighted segment
      result.push({
        type: 'highlight',
        content: content.slice(highlight.startIndex, highlight.endIndex),
        highlight,
        key: `highlight-${highlight.id}`
      });

      lastIndex = highlight.endIndex;
    });

    // Add remaining text after last highlight
    if (lastIndex < content.length) {
      result.push({
        type: 'text',
        content: content.slice(lastIndex),
        key: 'text-end'
      });
    }

    return result;
  }, [content, highlights]);

  // Get CSS class for a highlight based on its type and state
  const getHighlightClass = (highlight: TextRange): string => {
    const classes = ['highlight'];

    if (highlight.type === 'existing-link') {
      classes.push('highlight--existing');
      if (highlight.metadata.linkInfo?.is_target) {
        classes.push('highlight--target');
      }
    } else {
      classes.push('highlight--suggestion');

      // Check suggestion state
      const status = suggestionStates.get(highlight.id);
      if (status === 'accepted') {
        classes.push('highlight--accepted');
      } else if (status === 'ignored') {
        classes.push('highlight--ignored');
      }
    }

    if (highlight.id === activeHighlightId) {
      classes.push('highlight--active');
    }

    return classes.join(' ');
  };

  return (
    <div className="highlighted-content">
      {segments.map(segment => {
        if (segment.type === 'text') {
          // Preserve whitespace and newlines
          return (
            <span key={segment.key}>
              {segment.content.split('\n').map((line, i, arr) => (
                <Fragment key={i}>
                  {line}
                  {i < arr.length - 1 && <br />}
                </Fragment>
              ))}
            </span>
          );
        }

        // Highlighted segment
        return (
          <span
            key={segment.key}
            className={getHighlightClass(segment.highlight)}
            data-highlight-id={segment.highlight.id}
            onClick={() => onHighlightClick(segment.highlight.id)}
            onMouseEnter={() => onHighlightHover(segment.highlight.id)}
            onMouseLeave={() => onHighlightHover(null)}
            title={
              segment.highlight.type === 'existing-link'
                ? `Existing link to: ${segment.highlight.metadata.linkInfo?.href}`
                : `Suggested link: ${segment.highlight.metadata.suggestion?.targetUrl}`
            }
          >
            {segment.content}
          </span>
        );
      })}
    </div>
  );
}
