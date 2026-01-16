import { useState, useEffect } from 'react';
import type {
  PageInfo,
  PageResult,
  AnalyzeResponse,
  ConfigResponse,
} from './types';
import { getConfig, getSitemap, bulkAnalyze, analyzePage } from './services/api';
import { ContextualEditor } from './components/detail';
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

  // Detail view
  const [detailData, setDetailData] = useState<AnalyzeResponse | null>(null);

  useEffect(() => {
    getConfig().then(setConfig).catch(console.error);
  }, []);

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

    try {
      const data = await bulkAnalyze(
        Array.from(selectedUrls),
        targetPattern,
        500
      );
      setResults(data.results);
      setSummary(data.summary);
      setStep('results');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to analyze pages');
    } finally {
      setLoading(false);
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

  return (
    <div className="app">
      <header>
        <h1>Internal Link Finder</h1>
        <p>Find pages that need internal links and get AI-powered suggestions</p>
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
              <label htmlFor="domain">Website Domain</label>
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
                <label htmlFor="source">Source Pattern (pages to analyze)</label>
                <input
                  id="source"
                  type="text"
                  placeholder="/blog/"
                  value={sourcePattern}
                  onChange={e => setSourcePattern(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label htmlFor="target">Target Pattern (pages to link to)</label>
                <input
                  id="target"
                  type="text"
                  placeholder="/services/"
                  value={targetPattern}
                  onChange={e => setTargetPattern(e.target.value)}
                />
              </div>
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
              <button onClick={selectAll}>Select All</button>
              <button onClick={selectNone}>Select None</button>
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
            <button
              onClick={handleAnalyze}
              disabled={loading || selectedUrls.size === 0}
              className="primary"
            >
              {loading ? 'Analyzing...' : `Analyze ${selectedUrls.size} Pages`}
            </button>
          </div>
        </section>
      )}

      {step === 'results' && (
        <section className="results">
          <div className="results-header">
            <h2>Analysis Results</h2>
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
          <div className="spinner"></div>
          <p>Analyzing pages... This may take a while.</p>
        </div>
      )}
    </div>
  );
}

export default App;
