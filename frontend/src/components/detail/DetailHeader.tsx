
interface DetailHeaderProps {
  title: string | null;
  url: string;
  stats: {
    wordCount: number;
    existingLinks: number;
    targetLinks: number;
    suggestionsCount: number;
    acceptedCount: number;
  };
  onBack: () => void;
  onExistingLinksClick?: () => void;
}

/**
 * Header component for the contextual editor with page info and stats
 */
export function DetailHeader({
  title,
  url,
  stats,
  onBack,
  onExistingLinksClick
}: DetailHeaderProps) {
  return (
    <div className="editor-header">
      <div className="editor-header__left">
        <button className="editor-header__back" onClick={onBack}>
          &larr; Back
        </button>
        <div className="editor-header__title-group">
          <h2 className="editor-header__title">
            {title || 'Untitled Page'}
          </h2>
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="editor-header__url"
          >
            {url}
          </a>
        </div>
      </div>

      <div className="editor-header__stats">
        <div className="editor-header__stat">
          <span className="editor-header__stat-value">{stats.wordCount.toLocaleString()}</span>
          <span className="editor-header__stat-label">words</span>
        </div>
        <div
          className={`editor-header__stat ${onExistingLinksClick ? 'editor-header__stat--clickable' : ''}`}
          onClick={onExistingLinksClick}
          role={onExistingLinksClick ? 'button' : undefined}
          tabIndex={onExistingLinksClick ? 0 : undefined}
          onKeyDown={onExistingLinksClick ? (e) => e.key === 'Enter' && onExistingLinksClick() : undefined}
        >
          <span className="editor-header__stat-value">{stats.existingLinks}</span>
          <span className="editor-header__stat-label">existing links</span>
        </div>
        <div className="editor-header__stat">
          <span className="editor-header__stat-value">{stats.targetLinks}</span>
          <span className="editor-header__stat-label">target links</span>
        </div>
        <div className="editor-header__stat editor-header__stat--highlight">
          <span className="editor-header__stat-value">
            {stats.suggestionsCount > 0
              ? `${stats.acceptedCount}/${stats.suggestionsCount}`
              : '0'}
          </span>
          <span className="editor-header__stat-label">opportunities</span>
        </div>
      </div>
    </div>
  );
}
