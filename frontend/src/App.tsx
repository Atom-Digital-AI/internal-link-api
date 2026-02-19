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
import { getConfig, getSitemap, analyzePage, fetchTargetPage, createSession as apiCreateSession, deleteSession as apiDeleteSession, getSessions as apiGetSessions, updateSession as apiUpdateSession } from './services/api';
import { calculateKeywordRelevance, buildKeywordList } from './utils/keywordRelevance';
import { getSavedSessions, saveSession, deleteSession, createSession, pruneRecentSessions, updateSessionSaved } from './services/storage';
import { ContextualEditor } from './components/detail';
import { SavedSessions } from './components/SavedSessions';
import { SessionSidebar } from './components/SessionSidebar';
import { SavedLinksPanel } from './components/SavedLinksPanel';
import { GuideModal } from './components/GuideModal';
import { getSavedLinks } from './services/storage';
import { Tooltip, TooltipIcon } from './components/Tooltip';
import { useAuth } from './contexts/AuthContext';
import { Link } from 'react-router-dom';
import './App.css';
import linkiLogo from '../media/images/logos/Linki Logo - No Spacing - Transparent.png';

type Step = 'setup' | 'select' | 'results' | 'detail';

const STEPS: { key: Step; label: string; num: number }[] = [
  { key: 'setup', label: 'Configure', num: 1 },
  { key: 'select', label: 'Select Pages', num: 2 },
  { key: 'results', label: 'Results', num: 3 },
  { key: 'detail', label: 'Details', num: 4 },
];

function App() {
  const { user, accessToken } = useAuth();
  const isFree = !user || user.plan === 'free';

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
    low_density: number;
    good_density: number;
    high_density: number;
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
    if (!isFree && accessToken) {
      // Pro: load sessions from API
      apiGetSessions(accessToken).then(cloudSessions => {
        // Map cloud sessions to local SavedSession format for the existing UI
        const mapped = cloudSessions.map(cs => ({
          id: cs.id,
          name: `${cs.domain} - ${new Date(cs.created_at).toLocaleDateString()}`,
          createdAt: cs.created_at,
          updatedAt: cs.updated_at,
          domain: cs.domain,
          sourcePattern: (cs.config as { sourcePattern?: string }).sourcePattern || '',
          targetPattern: (cs.config as { targetPattern?: string }).targetPattern || '',
          sourcePages: (cs.results as { sourcePages?: SavedSession['sourcePages'] }).sourcePages || [],
          targetPages: (cs.results as { targetPages?: SavedSession['targetPages'] }).targetPages || [],
          results: (cs.results as { results?: SavedSession['results'] }).results || [],
          summary: (cs.results as { summary?: SavedSession['summary'] }).summary || { total_scanned: 0, low_density: 0, good_density: 0, high_density: 0, failed: 0 },
          isSaved: cs.is_saved,
        })) as SavedSession[];
        setSavedSessions(mapped);
      }).catch(() => setSavedSessions(getSavedSessions()));
    } else {
      setSavedSessions(getSavedSessions().map(s => ({ ...s, isSaved: s.isSaved ?? true })));
    }
    setSavedLinksCount(getSavedLinks().length);
  }, [isFree, accessToken]);

  // Update saved links count when modal closes (links may have changed)
  useEffect(() => {
    if (!showSavedLinks) {
      setSavedLinksCount(getSavedLinks().length);
    }
  }, [showSavedLinks]);

  // Frosted header on scroll
  useEffect(() => {
    const header = document.querySelector('.app-header');
    if (!header) return;
    const onScroll = () => {
      header.classList.toggle('is-scrolled', window.scrollY > 0);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
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
      }
    } else if (filterKeyword) {
      keywords = buildKeywordList([], filterKeyword);
    }

    const pageResults: PageResult[] = [];
    let lowDensity = 0;
    let goodDensity = 0;
    let highDensity = 0;
    let failed = 0;

    try {
      for (let i = 0; i < urls.length; i++) {
        const url = urls[i];
        const pageInfo = sourcePages.find(p => p.url === url);
        try {
          const data = await analyzePage(url, targetPattern);
          const linkDensity = data.word_count > 0
            ? (data.internal_links.total / data.word_count) * 100
            : 0;

          const minGood = Math.floor(data.word_count * 0.0035);
          const maxGood = Math.floor(data.word_count * 0.007);
          const current = data.internal_links.total;

          let status: 'low' | 'good' | 'high' | 'failed';
          let linksAvailable: string;

          if (linkDensity < 0.35) {
            status = 'low';
            const addMin = Math.max(0, minGood - current);
            const addMax = maxGood - current;
            linksAvailable = `+${addMin} to +${addMax}`;
          } else if (linkDensity > 0.7) {
            status = 'high';
            const removeMin = Math.max(0, current - maxGood);
            const removeMax = current - minGood;
            linksAvailable = `-${removeMin} to -${removeMax}`;
          } else {
            status = 'good';
            const headroom = maxGood - current;
            linksAvailable = headroom > 0 ? `0 to +${headroom}` : '0';
          }

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
            links_available: linksAvailable,
            status,
            error: null,
            lastmod: pageInfo?.lastmod || null,
            keyword_relevance: keywordRelevance,
          });

          if (status === 'low') {
            lowDensity++;
          } else if (status === 'high') {
            highDensity++;
          } else {
            goodDensity++;
          }
        } catch (err) {
          pageResults.push({
            url,
            title: null,
            word_count: 0,
            internal_link_count: 0,
            target_link_count: 0,
            link_density: 0,
            links_available: '',
            status: 'failed',
            error: err instanceof Error ? err.message : 'Failed to analyze',
            lastmod: pageInfo?.lastmod || null,
            keyword_relevance: null,
          });
          failed++;
        }

        setAnalysisProgress({ current: i + 1, total });
      }

      pageResults.sort((a, b) => {
        if (keywords.length > 0) {
          const relA = a.keyword_relevance ?? -1;
          const relB = b.keyword_relevance ?? -1;
          if (relA !== relB) {
            return relB - relA;
          }
        }
        if (!a.lastmod && !b.lastmod) return 0;
        if (!a.lastmod) return 1;
        if (!b.lastmod) return -1;
        return new Date(b.lastmod).getTime() - new Date(a.lastmod).getTime();
      });

      setResults(pageResults);
      // Auto-save as recent session
      const newSummary = {
        total_scanned: total,
        low_density: lowDensity,
        good_density: goodDensity,
        high_density: highDensity,
        failed,
      };
      setSummary(newSummary);
      autoSaveRecentSession(domain, sourcePattern, targetPattern, sourcePages, targetPages, pageResults, newSummary);
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

  const handleSaveSession = async () => {
    if (!summary) return;

    if (!isFree && accessToken) {
      try {
        if (currentSessionId) {
          // Update existing session and mark as saved
          await apiUpdateSession(accessToken, currentSessionId, {
            config: { sourcePattern, targetPattern },
            results: { sourcePages, targetPages, results, summary },
            is_saved: true,
          });
          setSavedSessions(prev =>
            prev.map(s => s.id === currentSessionId
              ? { ...s, domain, sourcePattern, targetPattern, sourcePages, targetPages, results, summary, isSaved: true, updatedAt: new Date().toISOString() }
              : s
            )
          );
        } else {
          const cloudSession = await apiCreateSession(accessToken, {
            domain,
            config: { sourcePattern, targetPattern },
            results: { sourcePages, targetPages, results, summary },
            is_saved: true,
          });
          const mapped: SavedSession = {
            id: cloudSession.id,
            name: `${domain} - ${new Date(cloudSession.created_at).toLocaleDateString()}`,
            createdAt: cloudSession.created_at,
            updatedAt: cloudSession.updated_at,
            domain,
            sourcePattern,
            targetPattern,
            sourcePages,
            targetPages,
            results,
            summary,
            isSaved: true,
          };
          setCurrentSessionId(mapped.id);
          setSavedSessions(prev => [mapped, ...prev.filter(s => s.id !== mapped.id)]);
        }
      } catch (err) {
        console.error('Failed to save session to cloud:', err);
      }
      return;
    }

    // Free/localStorage: save with isSaved true
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
          isSaved: true,
        }
      : createSession(domain, sourcePattern, targetPattern, sourcePages, targetPages, results, summary, true);

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

  const handleDeleteSession = async (id: string) => {
    if (!isFree && accessToken) {
      try {
        await apiDeleteSession(accessToken, id);
        setSavedSessions(prev => prev.filter(s => s.id !== id));
      } catch (err) {
        console.error('Failed to delete session from cloud:', err);
      }
    } else {
      deleteSession(id);
      setSavedSessions(getSavedSessions());
    }
    if (currentSessionId === id) {
      setCurrentSessionId(null);
    }
  };

  const handlePromoteSession = async (id: string) => {
    if (isFree || !accessToken) return;

    try {
      await apiUpdateSession(accessToken, id, { is_saved: true });
      setSavedSessions(prev =>
        prev.map(s => s.id === id ? { ...s, isSaved: true } : s)
      );
    } catch (err) {
      console.error('Failed to save session:', err);
    }
  };

  const autoSaveRecentSession = async (
    analysisDomain: string,
    analysisSourcePattern: string,
    analysisTargetPattern: string,
    analysisSourcePages: PageInfo[],
    analysisTargetPages: PageInfo[],
    analysisResults: PageResult[],
    analysisSummary: NonNullable<typeof summary>,
  ) => {
    const sessionData = {
      domain: analysisDomain,
      sourcePattern: analysisSourcePattern,
      targetPattern: analysisTargetPattern,
      sourcePages: analysisSourcePages,
      targetPages: analysisTargetPages,
      results: analysisResults,
      summary: analysisSummary,
    };

    if (!isFree && accessToken) {
      try {
        if (currentSessionId) {
          const existing = savedSessions.find(s => s.id === currentSessionId);
          if (existing) {
            await apiUpdateSession(accessToken, currentSessionId, {
              config: { sourcePattern: analysisSourcePattern, targetPattern: analysisTargetPattern },
              results: { sourcePages: analysisSourcePages, targetPages: analysisTargetPages, results: analysisResults, summary: analysisSummary },
            });
            setSavedSessions(prev =>
              prev.map(s => s.id === currentSessionId
                ? { ...s, ...sessionData, updatedAt: new Date().toISOString() }
                : s
              )
            );
            return;
          }
        }
        const cloudSession = await apiCreateSession(accessToken, {
          domain: analysisDomain,
          config: { sourcePattern: analysisSourcePattern, targetPattern: analysisTargetPattern },
          results: { sourcePages: analysisSourcePages, targetPages: analysisTargetPages, results: analysisResults, summary: analysisSummary },
          is_saved: false,
        });
        const mapped: SavedSession = {
          id: cloudSession.id,
          name: `${analysisDomain} - ${new Date(cloudSession.created_at).toLocaleDateString()}`,
          createdAt: cloudSession.created_at,
          updatedAt: cloudSession.updated_at,
          ...sessionData,
          isSaved: false,
        };
        setCurrentSessionId(mapped.id);
        setSavedSessions(prev => {
          const updated = [mapped, ...prev];
          const recent = updated.filter(s => !s.isSaved);
          if (recent.length > 5) {
            recent.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
            const oldest = recent[recent.length - 1];
            apiDeleteSession(accessToken, oldest.id).catch(() => {});
            return updated.filter(s => s.id !== oldest.id);
          }
          return updated;
        });
      } catch (err) {
        console.error('Failed to auto-save session:', err);
      }
    } else {
      if (currentSessionId) {
        const existing = savedSessions.find(s => s.id === currentSessionId);
        if (existing) {
          saveSession({ ...existing, ...sessionData, updatedAt: new Date().toISOString() });
          setSavedSessions(getSavedSessions());
          return;
        }
      }
      const session = createSession(analysisDomain, analysisSourcePattern, analysisTargetPattern, analysisSourcePages, analysisTargetPages, analysisResults, analysisSummary, false);
      saveSession(session);
      pruneRecentSessions();
      setCurrentSessionId(session.id);
      setSavedSessions(getSavedSessions());
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
    let lowDensity = 0;
    let goodDensity = 0;
    let highDensity = 0;
    let failed = 0;

    try {
      for (let i = 0; i < urls.length; i++) {
        const url = urls[i];
        const pageInfo = sourcePages.find(p => p.url === url);
        try {
          const data = await analyzePage(url, targetPattern);
          const linkDensity = data.word_count > 0
            ? (data.internal_links.total / data.word_count) * 100
            : 0;

          const minGood = Math.floor(data.word_count * 0.0035);
          const maxGood = Math.floor(data.word_count * 0.007);
          const current = data.internal_links.total;

          let status: 'low' | 'good' | 'high' | 'failed';
          let linksAvailable: string;

          if (linkDensity < 0.35) {
            status = 'low';
            const addMin = Math.max(0, minGood - current);
            const addMax = maxGood - current;
            linksAvailable = `+${addMin} to +${addMax}`;
          } else if (linkDensity > 0.7) {
            status = 'high';
            const removeMin = Math.max(0, current - maxGood);
            const removeMax = current - minGood;
            linksAvailable = `-${removeMin} to -${removeMax}`;
          } else {
            status = 'good';
            const headroom = maxGood - current;
            linksAvailable = headroom > 0 ? `0 to +${headroom}` : '0';
          }

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
            links_available: linksAvailable,
            status,
            error: null,
            lastmod: pageInfo?.lastmod || null,
            keyword_relevance: keywordRelevance,
          });

          if (status === 'low') {
            lowDensity++;
          } else if (status === 'high') {
            highDensity++;
          } else {
            goodDensity++;
          }
        } catch (err) {
          pageResults.push({
            url,
            title: null,
            word_count: 0,
            internal_link_count: 0,
            target_link_count: 0,
            link_density: 0,
            links_available: '',
            status: 'failed',
            error: err instanceof Error ? err.message : 'Failed to analyze',
            lastmod: pageInfo?.lastmod || null,
            keyword_relevance: null,
          });
          failed++;
        }

        setAnalysisProgress({ current: i + 1, total });
      }

      pageResults.sort((a, b) => {
        if (keywords.length > 0) {
          const relA = a.keyword_relevance ?? -1;
          const relB = b.keyword_relevance ?? -1;
          if (relA !== relB) {
            return relB - relA;
          }
        }
        if (!a.lastmod && !b.lastmod) return 0;
        if (!a.lastmod) return 1;
        if (!b.lastmod) return -1;
        return new Date(b.lastmod).getTime() - new Date(a.lastmod).getTime();
      });

      setResults(pageResults);
      setSummary({
        total_scanned: total,
        low_density: lowDensity,
        good_density: goodDensity,
        high_density: highDensity,
        failed,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to refresh results');
    } finally {
      setLoading(false);
      setAnalysisProgress({ current: 0, total: 0 });
    }
  };

  const stepIndex = STEPS.findIndex(s => s.key === step);

  return (
    <div className="app-shell">
      {/* ── DARK HEADER ── */}
      <header className="app-header">
        <div className="app-header__inner">
          <Link to="/app" className="app-header__brand">
            <div className="app-header__logo">
              <img src={linkiLogo} alt="" />
            </div>
            <span className="app-header__title">Linki</span>
          </Link>

          <nav className="step-nav" aria-label="Progress">
            {STEPS.map((s, i) => (
              <div
                key={s.key}
                className={`step-nav__item ${i === stepIndex ? 'step-nav__item--active' : ''} ${i < stepIndex ? 'step-nav__item--done' : ''}`}
              >
                <span className="step-nav__num">{i < stepIndex ? '\u2713' : s.num}</span>
                <span className="step-nav__label">{s.label}</span>
                {i < STEPS.length - 1 && <span className="step-nav__sep" />}
              </div>
            ))}
          </nav>

          <div className="app-header__actions">
            <button onClick={() => setShowGuide(true)} className="header-btn">
              <span className="header-btn__icon">?</span>
              <span className="header-btn__text">Help</span>
            </button>
            <button onClick={() => setShowSavedLinks(true)} className="header-btn">
              <span className="header-btn__text">Saved Links</span>
              {savedLinksCount > 0 && <span className="header-btn__badge">{savedLinksCount}</span>}
            </button>
            {isFree && step !== 'setup' ? (
              <Tooltip content="Saved sessions require a subscription." position="bottom">
                <Link to="/pricing" className="header-btn" style={{ textDecoration: 'none' }}>
                  <span className="header-btn__text">Sessions</span>
                </Link>
              </Tooltip>
            ) : step === 'setup' ? (
              <button onClick={() => {
                document.querySelector('.session-sidebar')?.scrollIntoView({ behavior: 'smooth' });
              }} className="header-btn">
                <span className="header-btn__text">Sessions</span>
                {savedSessions.length > 0 && <span className="header-btn__badge">{savedSessions.length}</span>}
              </button>
            ) : (
              <button onClick={() => setShowSavedSessions(true)} className="header-btn">
                <span className="header-btn__text">Sessions</span>
                {savedSessions.length > 0 && <span className="header-btn__badge">{savedSessions.length}</span>}
              </button>
            )}
            <Link to="/account" className="header-btn" style={{ textDecoration: 'none' }}>
              <span className="header-btn__text">Account</span>
            </Link>
          </div>
        </div>
      </header>

      {/* ── MAIN CONTENT ── */}
      <main className="app-main">
        <div className="app-content">
          {error && (
            <div className="error">
              <span>{error}</span>
              <button onClick={() => setError(null)}>&times;</button>
            </div>
          )}

          {step === 'setup' && (
            <section className="setup">
              <div className="setup__form">
                <div className="setup__hero">
                <h2 className="setup__heading">Analyze Your Internal Links</h2>
                <p className="setup__desc">Enter your website details to discover linking opportunities and get AI-powered suggestions.</p>
              </div>
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
              </div>
              <SessionSidebar
                sessions={savedSessions}
                currentSessionId={currentSessionId}
                userPlan={user?.plan ?? 'free'}
                onLoad={handleLoadSession}
                onDelete={handleDeleteSession}
                onSave={handlePromoteSession}
              />
            </section>
          )}

          {step === 'select' && (
            <section className="select">
              {isFree && selectedUrls.size > 10 && (
                <div className="error" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span>Free plan supports up to 10 URLs. Upgrade to Pro for 500 URLs.</span>
                  <Link to="/pricing" style={{ color: 'inherit', fontWeight: 600, whiteSpace: 'nowrap', marginLeft: '12px' }}>Upgrade to Pro →</Link>
                </div>
              )}
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
                        {loading ? 'Refreshing...' : 'Refresh'}
                      </button>
                    </Tooltip>
                    {isFree ? (
                      <Tooltip content="Sessions require a Pro subscription. Upgrade at /pricing." position="bottom">
                        <Link
                          to="/pricing"
                          className="save-btn"
                          style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                        >
                          🔒 Save Session
                        </Link>
                      </Tooltip>
                    ) : (
                      <Tooltip content="Save this analysis session to your account for later access." position="bottom">
                        <button
                          onClick={handleSaveSession}
                          className="save-btn"
                        >
                          {currentSessionId ? 'Update Saved' : 'Save Session'}
                        </button>
                      </Tooltip>
                    )}
                  </div>
                </div>

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
                        <strong>Keyword:</strong> &ldquo;{filterKeyword}&rdquo; ({filterMatchType})
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
                    <div className="stat low">
                      <span className="stat-value">{summary.low_density}</span>
                      <span className="stat-label">Low</span>
                    </div>
                    <div className="stat good">
                      <span className="stat-value">{summary.good_density}</span>
                      <span className="stat-label">Good</span>
                    </div>
                    <div className="stat high">
                      <span className="stat-value">{summary.high_density}</span>
                      <span className="stat-label">High</span>
                    </div>
                    <div className="stat failed">
                      <span className="stat-value">{summary.failed}</span>
                      <span className="stat-label">Failed</span>
                    </div>
                  </div>
                )}
              </div>

              <div className="table-wrap">
                <table className="results-table">
                  <thead>
                    <tr>
                      <th>Page</th>
                      <th>Published</th>
                      {(filterTargetUrl || filterKeyword) && <th>Relevance</th>}
                      <th>Words</th>
                      <th>Links</th>
                      <th>
                        <span className="label-with-tooltip">
                          Density
                          <TooltipIcon content={<>&lt; 0.35% = Low (add links)<br/>0.35% – 0.7% = Good<br/>&gt; 0.7% = High (consider removing)</>} position="bottom" />
                        </span>
                      </th>
                      <th>Links Available</th>
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
                        <td>{result.lastmod ? new Date(result.lastmod).toLocaleDateString() : '\u2014'}</td>
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
                            ) : '\u2014'}
                          </td>
                        )}
                        <td>{result.word_count.toLocaleString()}</td>
                        <td>{result.internal_link_count}</td>
                        <td>
                          <span className={`density-value density-${result.status !== 'failed' ? result.status : ''}`}>
                            {result.status !== 'failed' ? `${result.link_density.toFixed(2)}%` : '\u2014'}
                          </span>
                        </td>
                        <td>{result.status !== 'failed' ? result.links_available : '\u2014'}</td>
                        <td>
                          <span className={`badge ${result.status}`}>
                            {result.status === 'low' ? 'Low' :
                             result.status === 'good' ? 'Good' :
                             result.status === 'high' ? 'High' : 'Failed'}
                          </span>
                        </td>
                        <td>
                          {result.status !== 'failed' && (
                            <button
                              onClick={() => handleViewDetail(result.url)}
                              className="small primary"
                            >
                              Details
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

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
        </div>
      </main>

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
                Analyzing {analysisProgress.current} of {analysisProgress.total} pages
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
