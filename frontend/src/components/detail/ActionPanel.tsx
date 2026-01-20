import { useRef, useEffect, useState } from 'react';
import type { EnhancedSuggestion, LinkInfo } from '../../types';
import { SuggestionCard } from './SuggestionCard';
import { Tooltip } from '../Tooltip';

interface ActionPanelProps {
  suggestions: EnhancedSuggestion[];
  existingLinks: LinkInfo[];
  activeCardId: string | null;
  isLoading: boolean;
  onAccept: (id: string) => void;
  onIgnore: (id: string) => void;
  onCopy: (anchorText: string, targetUrl: string) => void;
  onCardHover: (id: string | null) => void;
  onCardClick: (id: string) => void;
  onExistingLinkClick: (index: number) => void;
  onExistingLinkHover: (index: number | null) => void;
  onGetSuggestions: () => void;
  scrollToCardId: string | null;
  showExistingLinks?: boolean;
  onShowExistingLinksChange?: (show: boolean) => void;
  onSaveLink?: (suggestion: EnhancedSuggestion) => void;
  isLinkSaved?: (targetUrl: string, anchorText: string) => boolean;
  sourceUrl?: string;
}

/**
 * Right panel component showing suggestion cards and existing links
 */
export function ActionPanel({
  suggestions,
  existingLinks,
  activeCardId,
  isLoading,
  onAccept,
  onIgnore,
  onCopy,
  onCardHover,
  onCardClick,
  onExistingLinkClick,
  onExistingLinkHover,
  onGetSuggestions,
  scrollToCardId,
  showExistingLinks,
  onShowExistingLinksChange,
  onSaveLink,
  isLinkSaved,
  sourceUrl
}: ActionPanelProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const existingLinksRef = useRef<HTMLDivElement>(null);
  // Use controlled state if provided, otherwise use local state
  const [localShowExisting, setLocalShowExisting] = useState(false);
  const showExisting = showExistingLinks ?? localShowExisting;
  const setShowExisting = onShowExistingLinksChange ?? setLocalShowExisting;

  // Scroll to card when triggered externally (e.g., from highlight click)
  useEffect(() => {
    if (scrollToCardId && containerRef.current) {
      // Check if this is an existing link card
      if (scrollToCardId.startsWith('existing-')) {
        // Ensure the existing links section is visible and scroll to it
        if (!showExisting) {
          setShowExisting(true);
        }
        // Wait for the section to expand, then scroll to the card
        setTimeout(() => {
          const cardEl = containerRef.current?.querySelector(
            `[data-card-id="${scrollToCardId}"]`
          );
          if (cardEl) {
            cardEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
        }, 50);
      } else {
        const cardEl = containerRef.current.querySelector(
          `[data-card-id="${scrollToCardId}"]`
        );
        if (cardEl) {
          cardEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }
    }
  }, [scrollToCardId, showExisting, setShowExisting]);

  // Scroll to existing links section when it's opened
  useEffect(() => {
    if (showExisting && existingLinksRef.current) {
      existingLinksRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [showExisting]);

  // Separate suggestions by status
  const pendingSuggestions = suggestions.filter(s => s.status === 'pending');
  const acceptedSuggestions = suggestions.filter(s => s.status === 'accepted');
  const ignoredSuggestions = suggestions.filter(s => s.status === 'ignored');

  const handleCopy = (suggestion: EnhancedSuggestion) => {
    onCopy(suggestion.anchorText, suggestion.targetUrl);
  };

  return (
    <div className="action-panel" ref={containerRef}>
      {/* Suggestions Section */}
      <div className="action-panel__section">
        <div className="action-panel__section-header">
          <h3 className="action-panel__section-title">
            Link Opportunities
            {pendingSuggestions.length > 0 && (
              <span className="action-panel__count action-panel__count--pending">
                {pendingSuggestions.length}
              </span>
            )}
          </h3>
          <Tooltip content="Use AI to analyze this page and find natural opportunities for internal links." position="left">
            <button
              className="action-panel__refresh"
              onClick={onGetSuggestions}
              disabled={isLoading}
            >
              {isLoading ? 'Analyzing...' : 'Get AI Suggestions'}
            </button>
          </Tooltip>
        </div>

        {isLoading && (
          <div className="action-panel__loading">
            <div className="action-panel__spinner"></div>
            <p>Analyzing content for link opportunities...</p>
          </div>
        )}

        {!isLoading && suggestions.length === 0 && (
          <div className="action-panel__empty">
            <p>No suggestions yet.</p>
            <p>Click "Get AI Suggestions" to analyze this page for internal linking opportunities.</p>
          </div>
        )}

        {/* Pending suggestions */}
        {pendingSuggestions.length > 0 && (
          <div className="action-panel__cards">
            {pendingSuggestions.map(suggestion => (
              <SuggestionCard
                key={suggestion.id}
                suggestion={suggestion}
                isActive={suggestion.id === activeCardId}
                onAccept={() => onAccept(suggestion.id)}
                onIgnore={() => onIgnore(suggestion.id)}
                onCopy={() => handleCopy(suggestion)}
                onHover={(hovering) => onCardHover(hovering ? suggestion.id : null)}
                onClick={() => onCardClick(suggestion.id)}
                onSave={onSaveLink ? () => onSaveLink(suggestion) : undefined}
                isSaved={isLinkSaved && sourceUrl ? isLinkSaved(suggestion.targetUrl, suggestion.anchorText) : false}
              />
            ))}
          </div>
        )}

        {/* Accepted suggestions */}
        {acceptedSuggestions.length > 0 && (
          <>
            <div className="action-panel__divider">
              <span>Accepted ({acceptedSuggestions.length})</span>
            </div>
            <div className="action-panel__cards action-panel__cards--accepted">
              {acceptedSuggestions.map(suggestion => (
                <SuggestionCard
                  key={suggestion.id}
                  suggestion={suggestion}
                  isActive={suggestion.id === activeCardId}
                  onAccept={() => onAccept(suggestion.id)}
                  onIgnore={() => onIgnore(suggestion.id)}
                  onCopy={() => handleCopy(suggestion)}
                  onHover={(hovering) => onCardHover(hovering ? suggestion.id : null)}
                  onClick={() => onCardClick(suggestion.id)}
                  onSave={onSaveLink ? () => onSaveLink(suggestion) : undefined}
                  isSaved={isLinkSaved && sourceUrl ? isLinkSaved(suggestion.targetUrl, suggestion.anchorText) : false}
                />
              ))}
            </div>
          </>
        )}

        {/* Ignored suggestions (collapsed by default) */}
        {ignoredSuggestions.length > 0 && (
          <>
            <div className="action-panel__divider action-panel__divider--collapsed">
              <span>Ignored ({ignoredSuggestions.length})</span>
            </div>
          </>
        )}
      </div>

      {/* Existing Links Section */}
      <div className="action-panel__section" ref={existingLinksRef}>
        <Tooltip content="View all internal links currently on this page." position="left">
          <button
            className="action-panel__section-toggle"
            onClick={() => setShowExisting(!showExisting)}
          >
            <span>Existing Internal Links ({existingLinks.length})</span>
            <span className="action-panel__toggle-icon">
              {showExisting ? '−' : '+'}
            </span>
          </button>
        </Tooltip>

        {showExisting && (
          <div className="action-panel__existing-links">
            {existingLinks.length === 0 ? (
              <p className="action-panel__no-links">No internal links found on this page.</p>
            ) : (
              <ul className="action-panel__link-list">
                {existingLinks.map((link, index) => {
                  const cardId = `existing-${index}`;
                  const isActive = activeCardId === cardId;
                  return (
                    <li
                      key={index}
                      data-card-id={cardId}
                      className={`action-panel__link-item action-panel__link-item--clickable ${link.is_target ? 'action-panel__link-item--target' : ''} ${isActive ? 'action-panel__link-item--active' : ''}`}
                      onClick={() => onExistingLinkClick(index)}
                      onMouseEnter={() => onExistingLinkHover(index)}
                      onMouseLeave={() => onExistingLinkHover(null)}
                    >
                      {link.is_target && (
                        <span className="action-panel__target-badge">Target</span>
                      )}
                      <span className="action-panel__link-anchor">{link.anchor_text || '(no text)'}</span>
                      <a
                        href={link.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="action-panel__link-url"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {link.href}
                      </a>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
