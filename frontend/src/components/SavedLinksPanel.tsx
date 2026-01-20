import { useState, useMemo } from 'react';
import type { SavedLinksPanelProps } from '../types';
import { useSavedLinks } from '../hooks/useSavedLinks';
import { Tooltip, TooltipIcon } from './Tooltip';

export function SavedLinksPanel({ onClose }: SavedLinksPanelProps) {
  const {
    savedLinks,
    deleteLink,
    toggleImplemented,
    clearAll,
    getUniqueDomains,
    exportCsv
  } = useSavedLinks();

  const [filterDomain, setFilterDomain] = useState<string>('');
  const [showImplemented, setShowImplemented] = useState(true);

  const domains = useMemo(() => getUniqueDomains(), [getUniqueDomains]);

  // Filter links based on domain and implemented status
  const filteredLinks = useMemo(() => {
    return savedLinks.filter(link => {
      if (filterDomain && link.domain !== filterDomain) return false;
      if (!showImplemented && link.isImplemented) return false;
      return true;
    });
  }, [savedLinks, filterDomain, showImplemented]);

  const handleExportCsv = () => {
    exportCsv(filteredLinks);
  };

  const handleClearAll = () => {
    const message = filterDomain
      ? `Delete all ${filteredLinks.length} saved links for ${filterDomain}?`
      : `Delete all ${filteredLinks.length} saved links?`;
    if (confirm(message)) {
      clearAll(filterDomain || undefined);
    }
  };

  // Extract path from URL for display
  const getDisplayPath = (url: string): string => {
    try {
      const urlObj = new URL(url);
      return urlObj.pathname;
    } catch {
      return url;
    }
  };

  if (savedLinks.length === 0) {
    return (
      <div className="saved-links-modal">
        <div className="saved-links-content">
          <div className="saved-links-header">
            <h2>Saved Links</h2>
            <button onClick={onClose} className="close-btn">&times;</button>
          </div>
          <p className="no-links">
            No saved links yet. Analyze pages and click "Save" on suggestions to build your link list.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="saved-links-modal">
      <div className="saved-links-content">
        <div className="saved-links-header">
          <h2>Saved Links</h2>
          <button onClick={onClose} className="close-btn">&times;</button>
        </div>

        {/* Filters and actions */}
        <div className="saved-links-toolbar">
          <div className="saved-links-filters">
            <Tooltip content="Filter saved links by website domain." position="bottom">
              <select
                value={filterDomain}
                onChange={(e) => setFilterDomain(e.target.value)}
                className="domain-filter"
              >
                <option value="">All Domains</option>
                {domains.map(domain => (
                  <option key={domain} value={domain}>{domain}</option>
                ))}
              </select>
            </Tooltip>

            <label className="implemented-toggle label-with-tooltip">
              <input
                type="checkbox"
                checked={showImplemented}
                onChange={(e) => setShowImplemented(e.target.checked)}
              />
              Show implemented
              <TooltipIcon content="Toggle visibility of links you've marked as done." position="right" />
            </label>
          </div>

          <div className="saved-links-actions">
            <Tooltip content="Download saved links as a CSV file for spreadsheets or CMS import." position="bottom">
              <button onClick={handleExportCsv} className="primary small">
                Export CSV
              </button>
            </Tooltip>
            <Tooltip content="Delete all saved links for the selected filter. Cannot be undone." position="bottom">
              <button onClick={handleClearAll} className="small danger">
                Clear All
              </button>
            </Tooltip>
          </div>
        </div>

        <div className="saved-links-count">
          {filteredLinks.length} link{filteredLinks.length !== 1 ? 's' : ''}
          {filterDomain && ` for ${filterDomain}`}
        </div>

        {/* Links table */}
        <div className="saved-links-table-wrapper">
          <table className="saved-links-table">
            <thead>
              <tr>
                <th className="col-implemented">
                  <span className="label-with-tooltip">
                    Done
                    <TooltipIcon content="Mark links as implemented after adding them to your content." position="bottom" />
                  </span>
                </th>
                <th className="col-source">Source Page</th>
                <th className="col-target">Link To</th>
                <th className="col-anchor">Anchor Text</th>
                <th className="col-context">Context</th>
                <th className="col-actions">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredLinks.map(link => (
                <tr key={link.id} className={link.isImplemented ? 'implemented' : ''}>
                  <td className="col-implemented">
                    <input
                      type="checkbox"
                      checked={link.isImplemented}
                      onChange={() => toggleImplemented(link.id)}
                      title={link.isImplemented ? 'Mark as not implemented' : 'Mark as implemented'}
                    />
                  </td>
                  <td className="col-source" title={link.sourceUrl}>
                    <div className="cell-content">
                      <span className="source-title">{link.sourceTitle || 'Untitled'}</span>
                      <span className="source-path">{getDisplayPath(link.sourceUrl)}</span>
                    </div>
                  </td>
                  <td className="col-target" title={link.targetUrl}>
                    <a href={link.targetUrl} target="_blank" rel="noopener noreferrer">
                      {getDisplayPath(link.targetUrl)}
                    </a>
                  </td>
                  <td className="col-anchor">
                    <span className="anchor-text">"{link.anchorText}"</span>
                  </td>
                  <td className="col-context" title={link.sentence}>
                    <span className="context-text">
                      {link.sentence.length > 80
                        ? `${link.sentence.slice(0, 80)}...`
                        : link.sentence}
                    </span>
                  </td>
                  <td className="col-actions">
                    <Tooltip content="Remove this link from your saved list." position="left">
                      <button
                        onClick={() => {
                          if (confirm('Delete this saved link?')) {
                            deleteLink(link.id);
                          }
                        }}
                        className="small danger"
                      >
                        Delete
                      </button>
                    </Tooltip>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
