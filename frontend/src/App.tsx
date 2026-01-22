import { useState, useEffect } from 'react';
import type {
  PageInfo,
  PageResult,
  AnalyzeResponse,
  ConfigResponse,
  SavedSession,
  TargetPageInfo,
  MatchType,
} from './types';
import { getConfig, getSitemap, analyzePage, fetchTargetPage } from './services/api';
import { calculateKeywordRelevance, buildKeywordList } from './utils/keywordRelevance';
import { getSavedSessions, saveSession, deleteSession, createSession } from './services/storage';
import { ContextualEditor } from './components/detail';
import { SavedSessions } from './components/SavedSessions';
import { SavedLinksPanel } from './components/SavedLinksPanel';
import { GuideModal } from './components/GuideModal';
import { getSavedLinks } from './services/storage';
import { Tooltip, TooltipIcon } from './components/Tooltip';
import './App.css';

type Step = 'setup' | 'select' | 'results' | 'detail';

function App() {
  const [step, setStep] = useState<Step>('setup');
  const [config, setConfig] = useState<ConfigResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Setup form
  const [domain, setDomain] = useState('');
  const [sourcePattern, setSourcePattern] = useState('/blog/');
  const [targetPattern, setTargetPattern] = useState('/services/');

  // Filter options for focused search
  const [filterTargetUrl, setFilterTargetUrl] = useState('');
  const [filterKeyword, setFilterKeyword] = useState('');
  const [filterMatchType, setFilterMatchType] = useState<MatchType>('stemmed');
  const [targetPageInfo, setTargetPageInfo] = useState<TargetPageInfo | null>(null);

  // Sitemap data
  const [sourcePages, setSourcePages] = useState<PageInfo[]>([]);
  const [targetPages, setTargetPages] = useState<PageInfo[]>([]);
  const [selectedUrls, setSelectedUrls] = useState<Set<string>>(new Set());

  // Analysis results
  const [results, setResults] = useState<PageResult[]>([]);
  const [summary, setSummary] = useState<{
    total_scanned: number;
    needs_links: number;
    has_good_density: number;
    failed: number;
  } | null>(null);

  // Analysis progress
  const [analysisProgress, setAnalysisProgress] = useState({ current: 0, total: 0 });

  // Detail view
  const [detailData, setDetailData] = useState<AnalyzeResponse | null>(null);

  // Saved sessions
  const [savedSessions, setSavedSessions] = useState<SavedSession[]>([]);
  const [showSavedSessions, setShowSavedSessions] = useState(false);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);

  // Saved links
  const [showSavedLinks, setShowSavedLinks] = useState(false);
  const [savedLinksCount, setSavedLinksCount] = useState(0);

  // Guide modal
  const [showGuide, setShowGuide] = useState(false);

  useEffect(() => {
    getConfig().then(setConfig).catch(console.error);
    setSavedSessions(getSavedSessions());
    setSavedLinksCount(getSavedLinks().length);
  }, []);

  // Update saved links count when modal closes (links may have changed)
  useEffect(() => {
    if (!showSavedLinks) {
      setSavedLinksCount(getSavedLinks().length);
    }
  }, [showSavedLinks]);

  const handleFetchSitemap = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const data = await getSitemap(domain, sourcePattern, targetPattern);
      setSourcePages(data.source_pages);
      setTargetPages(data.target_pages);
      setSelectedUrls(new Set(data.source_pages.slice(0, 10).map(p => p.url)));
      setStep('select');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch sitemap');
    } finally {
      setLoading(false);
    }
  };

  const handleAnalyze = async () => {
    if (selectedUrls.size === 0) {
      setError('Please select at least one URL to analyze');
      return;
    }

    setError(null);
    setLoading(true);

    const urls = Array.from(selectedUrls);
    const total = urls.length;
    setAnalysisProgress({ current: 0, total });

    // Fetch target page info if filter is active
    let fetchedTargetInfo: TargetPageInfo | null = null;
    let keywords: string[] = [];

    if (filterTargetUrl) {
      try {
        fetchedTargetInfo = await fetchTargetPage(filterTargetUrl);
        setTargetPageInfo(fetchedTargetInfo);
        keywords = buildKeywordList(fetchedTargetInfo.keywords, filterKeyword || null);
      } catch (err) {
        console.error('Failed to fetch target page:', err);
        // Continue without target page info
      }
    } else if (filterKeyword) {
      keywords = buildKeywordList([], filterKeyword);
    }

    const pageResults: PageResult[] = [];
    let needsLinks = 0;
    let hasGoodDensity = 0;
    let failed = 0;

    try {
      for (let i = 0; i < urls.length; i++) {
        const url = urls[i];
        const pageInfo = sourcePages.find(p => p.url === url);
        try {
          const data = await analyzePage(url, targetPattern);
          const linkDensity = data.word_count > 0
            ? data.word_count / (data.internal_links.to_target_pages || 1)
            : 0;
          const status = data.internal_links.to_target_pages === 0 || linkDensity > 500
            ? 'needs_links'
            : 'good';

          // Calculate keyword relevance if filters are active
          const keywordRelevance = keywords.length > 0
            ? calculateKeywordRelevance(data.extracted_content, keywords, filterMatchType)
            : null;

          pageResults.push({
            url: data.url,
            title: data.title,
            word_count: data.word_count,
            internal_link_count: data.internal_links.total,
            target_link_count: data.internal_links.to_target_pages,
            link_density: linkDensity,
            status,
            error: null,
            lastmod: pageInfo?.lastmod || null,
            keyword_relevance: keywordRelevance,
          });

          if (status === 'needs_links') {
            needsLinks++;
          } else {
            hasGoodDensity++;
          }
        } catch (err) {
          pageResults.push({
            url,
            title: null,
            word_count: 0,
            internal_link_count: 0,
            target_link_count: 0,
            link_density: 0,
            status: 'failed',
            error: err instanceof Error ? err.message : 'Failed to analyze',
            lastmod: pageInfo?.lastmod || null,
            keyword_relevance: null,
          });
          failed++;
        }

        setAnalysisProgress({ current: i + 1, total });
      }

      // Sort by relevance (if active) then by lastmod date
      pageResults.sort((a, b) => {
        // If relevance is active, sort by relevance first (highest first)
        if (keywords.length > 0) {
          const relA = a.keyword_relevance ?? -1;
          const relB = b.keyword_relevance ?? -1;
          if (relA !== relB) {
            return relB - relA;
          }
        }
        // Then by lastmod date, newest first (nulls at end)
        if (!a.lastmod && !b.lastmod) return 0;
        if (!a.lastmod) return 1;
        if (!b.lastmod) return -1;
        return new Date(b.lastmod).getTime() - new Date(a.lastmod).getTime();
      });

      setResults(pageResults);
      setSummary({
        total_scanned: total,
        needs_links: needsLinks,
        has_good_density: hasGoodDensity,
        failed,
      });
      setStep('results');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to analyze pages');
    } finally {
      setLoading(false);
      setAnalysisProgress({ current: 0, total: 0 });
    }
  };

  const handleViewDetail = async (url: string) => {
    setError(null);
    setLoading(true);

    try {
      const data = await analyzePage(url, targetPattern);
      setDetailData(data);
      setStep('detail');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to analyze page');
    } finally {
      setLoading(false);
    }
  };

  const toggleUrl = (url: string) => {
    const newSelected = new Set(selectedUrls);
    if (newSelected.has(url)) {
      newSelected.delete(url);
    } else if (config && newSelected.size < config.max_bulk_urls) {
      newSelected.add(url);
    }
    setSelectedUrls(newSelected);
  };

  const selectAll = () => {
    const max = config?.max_bulk_urls || 100;
    setSelectedUrls(new Set(sourcePages.slice(0, max).map(p => p.url)));
  };

  const selectNone = () => {
    setSelectedUrls(new Set());
  };

  const handleSaveSession = () => {
    if (!summary) return;

    const session = currentSessionId
      ? {
          id: currentSessionId,
          name: savedSessions.find(s => s.id === currentSessionId)?.name || `${new URL(domain).hostname} - ${new Date().toLocaleDateString()}`,
          createdAt: savedSessions.find(s => s.id === currentSessionId)?.createdAt || new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          domain,
          sourcePattern,
          targetPattern,
          sourcePages,
          targetPages,
          results,
          summary,
        }
      : createSession(domain, sourcePattern, targetPattern, sourcePages, targetPages, results, summary);

    saveSession(session);
    setCurrentSessionId(session.id);
    setSavedSessions(getSavedSessions());
  };

  const handleLoadSession = (session: SavedSession) => {
    setDomain(session.domain);
    setSourcePattern(session.sourcePattern);
    setTargetPattern(session.targetPattern);
    setSourcePages(session.sourcePages);
    setTargetPages(session.targetPages);
    setResults(session.results);
    setSummary(session.summary);
    setCurrentSessionId(session.id);
    setShowSavedSessions(false);
    setStep('results');
  };

  const handleDeleteSession = (id: string) => {
    deleteSession(id);
    setSavedSessions(getSavedSessions());
    if (currentSessionId === id) {
      setCurrentSessionId(null);
    }
  };

  const handleRefreshResults = async () => {
    if (selectedUrls.size === 0 && results.length === 0) return;

    setError(null);
    setLoading(true);

    const urls = selectedUrls.size > 0
      ? Array.from(selectedUrls)
      : results.map(r => r.url);

    const total = urls.length;
    setAnalysisProgress({ current: 0, total });

    // Use existing target page info or fetch if filter is active
    let keywords: string[] = [];
    if (targetPageInfo) {
      keywords = buildKeywordList(targetPageInfo.keywords, filterKeyword || null);
    } else if (filterTargetUrl) {
      try {
        const fetchedTargetInfo = await fetchTargetPage(filterTargetUrl);
        setTargetPageInfo(fetchedTargetInfo);
        keywords = buildKeywordList(fetchedTargetInfo.keywords, filterKeyword || null);
      } catch (err) {
        console.error('Failed to fetch target page:', err);
      }
    } else if (filterKeyword) {
      keywords = buildKeywordList([], filterKeyword);
    }

    const pageResults: PageResult[] = [];
    let needsLinks = 0;
    let hasGoodDensity = 0;
    let failed = 0;

    try {
      for (let i = 0; i < urls.length; i++) {
        const url = urls[i];
        const pageInfo = sourcePages.find(p => p.url === url);
        try {
          const data = await analyzePage(url, targetPattern);
          const linkDensity = data.word_count > 0
            ? data.word_count / (data.internal_links.to_target_pages || 1)
            : 0;
          const status = data.internal_links.to_target_pages === 0 || linkDensity > 500
            ? 'needs_links'
            : 'good';

          // Calculate keyword relevance if filters are active
          const keywordRelevance = keywords.length > 0
            ? calculateKeywordRelevance(data.extracted_content, keywords, filterMatchType)
            : null;

          pageResults.push({
            url: data.url,
            title: data.title,
            word_count: data.word_count,
            internal_link_count: data.internal_links.total,
            target_link_count: data.internal_links.to_target_pages,
            link_density: linkDensity,
            status,
            error: null,
            lastmod: pageInfo?.lastmod || null,
            keyword_relevance: keywordRelevance,
          });

          if (status === 'needs_links') {
            needsLinks++;
          } else {
            hasGoodDensity++;
          }
        } catch (err) {
          pageResults.push({
            url,
            title: null,
            word_count: 0,
            internal_link_count: 0,
            target_link_count: 0,
            link_density: 0,
            status: 'failed',
            error: err instanceof Error ? err.message : 'Failed to analyze',
            lastmod: pageInfo?.lastmod || null,
            keyword_relevance: null,
          });
          failed++;
        }

        setAnalysisProgress({ current: i + 1, total });
      }

      // Sort by relevance (if active) then by lastmod date
      pageResults.sort((a, b) => {
        // If relevance is active, sort by relevance first (highest first)
        if (keywords.length > 0) {
          const relA = a.keyword_relevance ?? -1;
          const relB = b.keyword_relevance ?? -1;
          if (relA !== relB) {
            return relB - relA;
          }
        }
        // Then by lastmod date, newest first (nulls at end)
        if (!a.lastmod && !b.lastmod) return 0;
        if (!a.lastmod) return 1;
        if (!b.lastmod) return -1;
        return new Date(b.lastmod).getTime() - new Date(a.lastmod).getTime();
      });

      setResults(pageResults);
      setSummary({
        total_scanned: total,
        needs_links: needsLinks,
        has_good_density: hasGoodDensity,
        failed,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to refresh results');
    } finally {
      setLoading(false);
      setAnalysisProgress({ current: 0, total: 0 });
    }
  };

  return (
    <div className="app">
      <header>
        <div className="header-content">
          <div>
            <h1>Internal Link Finder</h1>
            <p>Find pages that need internal links and get AI-powered suggestions</p>
          </div>
          <div className="header-actions">
            <button
              onClick={() => setShowGuide(true)}
              className="help-btn"
            >
              ? Help
            </button>
            <button
              onClick={() => setShowSavedLinks(true)}
              className="saved-links-btn"
            >
              Saved Links {savedLinksCount > 0 && `(${savedLinksCount})`}
            </button>
            {savedSessions.length > 0 && (
              <button
                onClick={() => setShowSavedSessions(true)}
                className="saved-sessions-btn"
              >
                Saved Sessions ({savedSessions.length})
              </button>
            )}
          </div>
        </div>
      </header>

      {error && (
        <div className="error">
          {error}
          <button onClick={() => setError(null)}>&times;</button>
        </div>
      )}

      {step === 'setup' && (
        <section className="setup">
          <form onSubmit={handleFetchSitemap}>
            <div className="form-group">
              <label htmlFor="domain" className="label-with-tooltip">
                Website Domain
                <TooltipIcon
                  content="Enter the full URL of your website (e.g., https://example.com). The sitemap will be fetched to find pages for analysis."
                  position="right"
                />
              </label>
              <input
                id="domain"
                type="url"
                placeholder="https://example.com"
                value={domain}
                onChange={e => setDomain(e.target.value)}
                required
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="source" className="label-with-tooltip">
                  Source Pattern (pages to analyze)
                  <TooltipIcon
                    content="URL pattern to identify pages to analyze for missing internal links. Example: '/blog/' matches all blog posts. Leave empty to include all pages."
                    position="right"
                  />
                </label>
                <input
                  id="source"
                  type="text"
                  placeholder="/blog/"
                  value={sourcePattern}
                  onChange={e => setSourcePattern(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label htmlFor="target" className="label-with-tooltip">
                  Target Pattern (pages to link to)
                  <TooltipIcon
                    content="URL pattern for pages you want to link TO. Example: '/services/' will suggest links from blog posts to service pages."
                    position="right"
                  />
                </label>
                <input
                  id="target"
                  type="text"
                  placeholder="/services/"
                  value={targetPattern}
                  onChange={e => setTargetPattern(e.target.value)}
                />
              </div>
            </div>

            <div className="filter-section">
              <h3 className="filter-section__title">
                Focus Your Search (Optional)
                <TooltipIcon
                  content="Optionally focus your search on building links to a specific page or for a specific keyword. Leave empty to find all opportunities."
                  position="right"
                />
              </h3>

              <div className="form-group">
                <label htmlFor="filterTargetUrl" className="label-with-tooltip">
                  Target Page URL
                  <TooltipIcon
                    content="Enter a specific URL you want to build internal links TO. The tool will analyze source pages for relevance to this target."
                    position="right"
                  />
                </label>
                <input
                  id="filterTargetUrl"
                  type="url"
                  placeholder="https://example.com/important-page"
                  value={filterTargetUrl}
                  onChange={e => setFilterTargetUrl(e.target.value)}
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="filterKeyword" className="label-with-tooltip">
                    Keyword
                    <TooltipIcon
                      content="Enter a keyword or phrase to focus on. Pages with content related to this keyword will be ranked higher."
                      position="right"
                    />
                  </label>
                  <input
                    id="filterKeyword"
                    type="text"
                    placeholder="e.g., SEO audit"
                    value={filterKeyword}
                    onChange={e => setFilterKeyword(e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label className="label-with-tooltip">
                    Match Type
                    <TooltipIcon
                      content="Exact: matches the keyword exactly. Stemmed: matches variations (e.g., 'audit' matches 'audits', 'auditing')."
                      position="right"
                    />
                  </label>
                  <div className="radio-group">
                    <label className="radio-label">
                      <input
                        type="radio"
                        name="matchType"
                        value="stemmed"
                        checked={filterMatchType === 'stemmed'}
                        onChange={() => setFilterMatchType('stemmed')}
                      />
                      Stemmed (Recommended)
                    </label>
                    <label className="radio-label">
                      <input
                        type="radio"
                        name="matchType"
                        value="exact"
                        checked={filterMatchType === 'exact'}
                        onChange={() => setFilterMatchType('exact')}
                      />
                      Exact
                    </label>
                  </div>
                </div>
              </div>

              {(filterTargetUrl || filterKeyword) && (
                <button
                  type="button"
                  className="clear-filters-btn"
                  onClick={() => {
                    setFilterTargetUrl('');
                    setFilterKeyword('');
                    setFilterMatchType('stemmed');
                  }}
                >
                  Clear Filters
                </button>
              )}
            </div>

            <button type="submit" disabled={loading} className="primary">
              {loading ? 'Fetching Sitemap...' : 'Fetch Sitemap'}
            </button>
          </form>
        </section>
      )}

      {step === 'select' && (
        <section className="select">
          <div className="select-header">
            <h2>Select Pages to Analyze</h2>
            <p>
              Found {sourcePages.length} source pages and {targetPages.length} target pages
              {config && ` (max ${config.max_bulk_urls} at a time)`}
            </p>
            <div className="select-actions">
              <Tooltip content="Select all available source pages (up to the maximum limit)." position="bottom">
                <button onClick={selectAll}>Select All</button>
              </Tooltip>
              <Tooltip content="Deselect all pages to start fresh." position="bottom">
                <button onClick={selectNone}>Select None</button>
              </Tooltip>
              <span className="selected-count">{selectedUrls.size} selected</span>
            </div>
          </div>

          <div className="page-list">
            {sourcePages.map(page => (
              <label key={page.url} className="page-item">
                <input
                  type="checkbox"
                  checked={selectedUrls.has(page.url)}
                  onChange={() => toggleUrl(page.url)}
                />
                <span className="page-url">{page.url}</span>
                {page.lastmod && (
                  <span className="page-date">{page.lastmod}</span>
                )}
              </label>
            ))}
          </div>

          <div className="actions">
            <button onClick={() => setStep('setup')}>Back</button>
            <Tooltip content="Scan selected pages for content and existing links. Pages with low link density will be flagged." position="top">
              <button
                onClick={handleAnalyze}
                disabled={loading || selectedUrls.size === 0}
                className="primary"
              >
                {loading ? 'Analyzing...' : `Analyze ${selectedUrls.size} Pages`}
              </button>
            </Tooltip>
          </div>
        </section>
      )}

      {step === 'results' && (
        <section className="results">
          <div className="results-header">
            <div className="results-title-row">
              <h2>Analysis Results</h2>
              <div className="results-actions-top">
                <Tooltip content="Re-analyze all pages with fresh data from your website." position="bottom">
                  <button
                    onClick={handleRefreshResults}
                    disabled={loading}
                    className="refresh-btn"
                  >
                    {loading ? 'Refreshing...' : '↻ Refresh'}
                  </button>
                </Tooltip>
                <Tooltip content="Save this analysis session to your browser for later access." position="bottom">
                  <button
                    onClick={handleSaveSession}
                    className="save-btn"
                  >
                    {currentSessionId ? '✓ Update Saved' : '💾 Save'}
                  </button>
                </Tooltip>
              </div>
            </div>

            {/* Filter banner */}
            {(filterTargetUrl || filterKeyword) && (
              <div className="filter-banner">
                <span className="filter-banner__label">Focused Search:</span>
                {filterTargetUrl && (
                  <span className="filter-banner__item">
                    <strong>Target:</strong> {targetPageInfo?.title || filterTargetUrl}
                  </span>
                )}
                {filterKeyword && (
                  <span className="filter-banner__item">
                    <strong>Keyword:</strong> "{filterKeyword}" ({filterMatchType})
                  </span>
                )}
                <button
                  className="filter-banner__clear"
                  onClick={() => {
                    setFilterTargetUrl('');
                    setFilterKeyword('');
                    setFilterMatchType('stemmed');
                    setTargetPageInfo(null);
                  }}
                >
                  Clear
                </button>
              </div>
            )}

            {summary && (
              <div className="summary">
                <div className="stat">
                  <span className="stat-value">{summary.total_scanned}</span>
                  <span className="stat-label">Scanned</span>
                </div>
                <div className="stat needs">
                  <span className="stat-value">{summary.needs_links}</span>
                  <span className="stat-label">Need Links</span>
                </div>
                <div className="stat good">
                  <span className="stat-value">{summary.has_good_density}</span>
                  <span className="stat-label">Good</span>
                </div>
                <div className="stat failed">
                  <span className="stat-value">{summary.failed}</span>
                  <span className="stat-label">Failed</span>
                </div>
              </div>
            )}
          </div>

          <table className="results-table">
            <thead>
              <tr>
                <th>Page</th>
                <th>Published</th>
                {(filterTargetUrl || filterKeyword) && <th>Relevance</th>}
                <th>Words</th>
                <th>Links</th>
                <th>Target Links</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {results.map(result => (
                <tr key={result.url} className={`status-${result.status}`}>
                  <td className="url-cell">
                    <div className="title">{result.title || 'Untitled'}</div>
                    <div className="url">{result.url}</div>
                  </td>
                  <td>{result.lastmod ? new Date(result.lastmod).toLocaleDateString() : '—'}</td>
                  {(filterTargetUrl || filterKeyword) && (
                    <td className="relevance-cell">
                      {result.keyword_relevance !== null ? (
                        <div className="relevance-indicator">
                          <div className="relevance-dots">
                            {[1, 2, 3, 4, 5].map(i => (
                              <span
                                key={i}
                                className={`relevance-dot ${i <= result.keyword_relevance! ? 'active' : ''}`}
                              />
                            ))}
                          </div>
                          <span className="relevance-label">
                            {result.keyword_relevance === 0 ? 'None' :
                             result.keyword_relevance <= 2 ? 'Low' :
                             result.keyword_relevance <= 3 ? 'Medium' : 'High'}
                          </span>
                        </div>
                      ) : '—'}
                    </td>
                  )}
                  <td>{result.word_count}</td>
                  <td>{result.internal_link_count}</td>
                  <td>{result.target_link_count}</td>
                  <td>
                    <span className={`badge ${result.status}`}>
                      {result.status === 'needs_links' ? 'Needs Links' :
                       result.status === 'good' ? 'Good' : 'Failed'}
                    </span>
                  </td>
                  <td>
                    {result.status !== 'failed' && (
                      <button
                        onClick={() => handleViewDetail(result.url)}
                        className="small"
                      >
                        Details
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="actions">
            <button onClick={() => setStep('select')}>Back to Selection</button>
            <button onClick={() => setStep('setup')}>New Analysis</button>
          </div>
        </section>
      )}

      {step === 'detail' && detailData && (
        <ContextualEditor
          pageData={detailData}
          targetPages={targetPages}
          onBack={() => setStep('results')}
        />
      )}

      {loading && step !== 'detail' && (
        <div className="loading-overlay">
          {analysisProgress.total > 0 ? (
            <div className="progress-container">
              <div className="progress-bar">
                <div
                  className="progress-fill"
                  style={{ width: `${(analysisProgress.current / analysisProgress.total) * 100}%` }}
                />
              </div>
              <p className="progress-text">
                {analysisProgress.current} of {analysisProgress.total} pages analyzed
              </p>
            </div>
          ) : (
            <>
              <div className="spinner"></div>
              <p>Loading...</p>
            </>
          )}
        </div>
      )}

      {showSavedSessions && (
        <SavedSessions
          sessions={savedSessions}
          onLoad={handleLoadSession}
          onDelete={handleDeleteSession}
          onClose={() => setShowSavedSessions(false)}
        />
      )}

      {showSavedLinks && (
        <SavedLinksPanel
          onClose={() => setShowSavedLinks(false)}
        />
      )}

      {showGuide && (
        <GuideModal
          onClose={() => setShowGuide(false)}
        />
      )}
    </div>
  );
}

export default App;
