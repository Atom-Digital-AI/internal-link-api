import { useState } from 'react';
import type { EnhancedSuggestion } from '../../types';
import { Tooltip } from '../Tooltip';

interface SuggestionCardProps {
  suggestion: EnhancedSuggestion;
  isActive: boolean;
  onAccept: () => void;
  onIgnore: () => void;
  onCopy: () => void;
  onHover: (hovering: boolean) => void;
  onClick: () => void;
  onSave?: () => void;
  isSaved?: boolean;
}

/**
 * Card component displaying a single link suggestion with actions
 */
export function SuggestionCard({
  suggestion,
  isActive,
  onAccept,
  onIgnore,
  onCopy,
  onHover,
  onClick,
  onSave,
  isSaved = false
}: SuggestionCardProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    onCopy();
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleAccept = (e: React.MouseEvent) => {
    e.stopPropagation();
    onAccept();
  };

  const handleIgnore = (e: React.MouseEvent) => {
    e.stopPropagation();
    onIgnore();
  };

  const handleSave = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onSave && !isSaved) {
      onSave();
    }
  };

  // Build class names based on state
  const cardClasses = [
    'suggestion-card',
    isActive && 'suggestion-card--active',
    suggestion.status === 'accepted' && 'suggestion-card--accepted',
    suggestion.status === 'ignored' && 'suggestion-card--ignored',
    !suggestion.highlightRange && 'suggestion-card--no-match'
  ].filter(Boolean).join(' ');

  // Extract domain from target URL for display
  const targetDomain = (() => {
    try {
      const url = new URL(suggestion.targetUrl);
      return url.pathname;
    } catch {
      return suggestion.targetUrl;
    }
  })();

  return (
    <div
      className={cardClasses}
      data-card-id={suggestion.id}
      onClick={onClick}
      onMouseEnter={() => onHover(true)}
      onMouseLeave={() => onHover(false)}
    >
      {/* Status indicator */}
      {suggestion.status !== 'pending' && (
        <div className={`suggestion-card__status suggestion-card__status--${suggestion.status}`}>
          {suggestion.status === 'accepted' ? 'Accepted' : 'Ignored'}
        </div>
      )}

      {/* No match warning */}
      {!suggestion.highlightRange && (
        <div className="suggestion-card__warning">
          Could not locate in article
        </div>
      )}

      {/* Anchor text */}
      <div className="suggestion-card__anchor">
        <span className="suggestion-card__label">Link text:</span>
        <span className="suggestion-card__value suggestion-card__value--anchor">
          "{suggestion.anchorText}"
        </span>
      </div>

      {/* Target URL */}
      <div className="suggestion-card__target">
        <span className="suggestion-card__label">Link to:</span>
        <span className="suggestion-card__value suggestion-card__value--url" title={suggestion.targetUrl}>
          {targetDomain}
        </span>
      </div>

      {/* Reason */}
      <div className="suggestion-card__reason">
        <span className="suggestion-card__label">Why:</span>
        <span className="suggestion-card__value">{suggestion.reason}</span>
      </div>

      {/* Context sentence */}
      <div className="suggestion-card__context">
        <span className="suggestion-card__label">Context:</span>
        <span className="suggestion-card__value suggestion-card__value--context">
          "...{suggestion.sentence.slice(0, 100)}{suggestion.sentence.length > 100 ? '...' : ''}"
        </span>
      </div>

      {/* Actions */}
      <div className="suggestion-card__actions">
        <Tooltip content="Copy HTML link code to clipboard for pasting into your CMS." position="top">
          <button
            className="suggestion-card__btn suggestion-card__btn--copy"
            onClick={handleCopy}
          >
            {copied ? 'Copied!' : 'Copy Code'}
          </button>
        </Tooltip>

        {onSave && (
          <Tooltip content={isSaved ? "Already saved to your links list." : "Add this suggestion to your Saved Links list."} position="top">
            <button
              className={`suggestion-card__btn suggestion-card__btn--save ${isSaved ? 'suggestion-card__btn--saved' : ''}`}
              onClick={handleSave}
              disabled={isSaved}
            >
              {isSaved ? 'Saved' : 'Save'}
            </button>
          </Tooltip>
        )}

        {suggestion.status === 'pending' ? (
          <>
            <Tooltip content="Approve this suggestion. It will be highlighted green in the preview." position="top">
              <button
                className="suggestion-card__btn suggestion-card__btn--accept"
                onClick={handleAccept}
              >
                Accept
              </button>
            </Tooltip>
            <Tooltip content="Dismiss this suggestion. Can be reset later." position="top">
              <button
                className="suggestion-card__btn suggestion-card__btn--ignore"
                onClick={handleIgnore}
              >
                Ignore
              </button>
            </Tooltip>
          </>
        ) : (
          <Tooltip content="Undo your accept/ignore decision." position="top">
            <button
              className="suggestion-card__btn suggestion-card__btn--reset"
              onClick={handleIgnore}
            >
              Reset
            </button>
          </Tooltip>
        )}
      </div>
    </div>
  );
}
