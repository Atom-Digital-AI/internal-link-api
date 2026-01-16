import { useMemo, Fragment, type ReactNode } from 'react';
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
 * Renders a line of text with basic markdown formatting
 * Supports: headings (#), bold (**), italic (*), and list items (- or *)
 */
function renderMarkdownLine(line: string, keyPrefix: string): ReactNode {
  // Check for headings
  const headingMatch = line.match(/^(#{1,6})\s+(.+)$/);
  if (headingMatch) {
    const level = headingMatch[1].length;
    const text = headingMatch[2];
    return (
      <span
        key={keyPrefix}
        className={`markdown-heading markdown-heading--h${level}`}
      >
        {text}
      </span>
    );
  }

  // Check for list items
  const listMatch = line.match(/^(\s*)[-*]\s+(.+)$/);
  if (listMatch) {
    const indent = listMatch[1].length;
    const text = listMatch[2];
    return (
      <span
        key={keyPrefix}
        className="markdown-list-item"
        style={{ paddingLeft: `${indent * 0.5 + 1}em` }}
      >
        <span className="markdown-bullet">•</span>
        {renderInlineFormatting(text)}
      </span>
    );
  }

  // Check for numbered list items
  const numberedMatch = line.match(/^(\s*)\d+\.\s+(.+)$/);
  if (numberedMatch) {
    const indent = numberedMatch[1].length;
    const text = numberedMatch[2];
    return (
      <span
        key={keyPrefix}
        className="markdown-list-item markdown-list-item--numbered"
        style={{ paddingLeft: `${indent * 0.5 + 1}em` }}
      >
        {renderInlineFormatting(text)}
      </span>
    );
  }

  // Regular text with inline formatting
  return <span key={keyPrefix}>{renderInlineFormatting(line)}</span>;
}

/**
 * Renders inline markdown formatting (bold, italic)
 */
function renderInlineFormatting(text: string): ReactNode {
  // Simple approach: just return the text with markdown symbols stripped
  // For a more complete solution, we'd parse and render bold/italic properly
  // But this keeps the highlighting logic simpler

  // Remove markdown bold/italic markers for cleaner display
  const cleaned = text
    .replace(/\*\*([^*]+)\*\*/g, '$1')  // Remove **bold**
    .replace(/\*([^*]+)\*/g, '$1')      // Remove *italic*
    .replace(/__([^_]+)__/g, '$1')      // Remove __bold__
    .replace(/_([^_]+)_/g, '$1');       // Remove _italic_

  return cleaned;
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

  /**
   * Renders text content with markdown formatting while preserving newlines
   */
  const renderTextContent = (text: string, keyPrefix: string): ReactNode => {
    const lines = text.split('\n');

    return lines.map((line, i) => {
      const isEmptyLine = line.trim() === '';
      const isLastLine = i === lines.length - 1;

      return (
        <Fragment key={`${keyPrefix}-line-${i}`}>
          {isEmptyLine ? (
            // Empty lines create paragraph breaks
            <span className="markdown-paragraph-break" />
          ) : (
            renderMarkdownLine(line, `${keyPrefix}-content-${i}`)
          )}
          {!isLastLine && <br />}
        </Fragment>
      );
    });
  };

  return (
    <div className="highlighted-content">
      {segments.map(segment => {
        if (segment.type === 'text') {
          return (
            <span key={segment.key}>
              {renderTextContent(segment.content, segment.key)}
            </span>
          );
        }

        // Highlighted segment (don't apply markdown formatting to highlights)
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
