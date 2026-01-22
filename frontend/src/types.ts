// API Response Types
export interface PageInfo {
  url: string;
  lastmod: string | null;
}

export interface LinkInfo {
  href: string;
  anchor_text: string;
  is_target: boolean;
}

export interface SitemapResponse {
  source_pages: PageInfo[];
  target_pages: PageInfo[];
  total_found: number;
  sitemap_url: string | null;
}

export interface AnalyzeResponse {
  url: string;
  title: string | null;
  word_count: number;
  internal_links: {
    total: number;
    to_target_pages: number;
    links: LinkInfo[];
  };
  external_links: number;
  link_density: number;
  content_snippet: string;
  extracted_content: string;
  error: string | null;
}

export interface PageResult {
  url: string;
  title: string | null;
  word_count: number;
  internal_link_count: number;
  target_link_count: number;
  link_density: number;
  status: 'good' | 'needs_links' | 'failed';
  error: string | null;
  lastmod: string | null;
  keyword_relevance: number | null;  // 0-5 relevance score when filter is active
}

// Filter options for focused search
export type MatchType = 'exact' | 'stemmed';

export interface FilterOptions {
  targetUrl: string | null;  // Specific page to build links to
  keyword: string | null;    // Keyword to focus on
  matchType: MatchType;      // Match type for keyword
}

// Target page info returned from API
export interface TargetPageInfo {
  url: string;
  title: string | null;
  keywords: string[];
}

export interface BulkAnalyzeResponse {
  results: PageResult[];
  summary: {
    total_scanned: number;
    needs_links: number;
    has_good_density: number;
    failed: number;
  };
  target_page_info: TargetPageInfo | null;  // Info about the target page when filter is active
}

export interface ConfigResponse {
  max_bulk_urls: number;
}

export interface LinkSuggestion {
  sentence: string;
  targetUrl: string;
  anchorText: string;
  reason: string;
}

// Text highlighting types for the contextual editor
export type HighlightType = 'existing-link' | 'suggestion';

export interface HighlightMetadata {
  suggestionIndex?: number;
  linkInfo?: LinkInfo;
  suggestion?: LinkSuggestion;
}

export interface TextRange {
  id: string;
  startIndex: number;
  endIndex: number;
  type: HighlightType;
  metadata: HighlightMetadata;
}

export interface MatchResult {
  found: boolean;
  range?: { start: number; end: number };
  confidence: number;
  matchType: 'exact' | 'normalized' | 'fuzzy' | 'none';
}

// Suggestion state management
export type SuggestionStatus = 'pending' | 'accepted' | 'ignored';

export interface EnhancedSuggestion extends LinkSuggestion {
  id: string;
  status: SuggestionStatus;
  highlightRange: TextRange | null;
  matchConfidence: number;
}

// Component prop types
export interface ArticlePreviewProps {
  content: string;
  highlights: TextRange[];
  activeHighlightId: string | null;
  suggestionStates: Map<string, SuggestionStatus>;
  onHighlightClick: (id: string) => void;
  onHighlightHover: (id: string | null) => void;
}

export interface SuggestionCardProps {
  suggestion: EnhancedSuggestion;
  isActive: boolean;
  onAccept: () => void;
  onIgnore: () => void;
  onCopy: () => void;
  onHover: (hovering: boolean) => void;
  onClick: () => void;
}

export interface ActionPanelProps {
  suggestions: EnhancedSuggestion[];
  existingLinks: LinkInfo[];
  activeCardId: string | null;
  onAccept: (id: string) => void;
  onIgnore: (id: string) => void;
  onCopy: (anchorText: string, targetUrl: string) => void;
  onCardHover: (id: string | null) => void;
  onCardClick: (id: string) => void;
}

export interface DetailHeaderProps {
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
}

export interface ContextualEditorProps {
  pageData: AnalyzeResponse;
  targetPages: PageInfo[];
  onBack: () => void;
}

// Saved session types for persistence
export interface SavedSession {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  domain: string;
  sourcePattern: string;
  targetPattern: string;
  sourcePages: PageInfo[];
  targetPages: PageInfo[];
  results: PageResult[];
  summary: {
    total_scanned: number;
    needs_links: number;
    has_good_density: number;
    failed: number;
  };
  // Filter options (optional for backwards compatibility)
  filterOptions?: FilterOptions;
  targetPageInfo?: TargetPageInfo;
}

export interface SavedSessionsListProps {
  sessions: SavedSession[];
  onLoad: (session: SavedSession) => void;
  onDelete: (id: string) => void;
  onClose: () => void;
}

// Saved link types for persistent link list
export interface SavedLink {
  id: string;                    // Unique ID
  savedAt: string;               // ISO timestamp
  sourceUrl: string;             // Page where link should be added
  sourceTitle: string | null;    // Title of source page
  targetUrl: string;             // Page to link to
  anchorText: string;            // Text to make into link
  reason: string;                // AI reasoning
  sentence: string;              // Context sentence (position indicator)
  domain: string;                // Extracted hostname for filtering
  isImplemented: boolean;        // Track if user added the link
}

export interface SavedLinksPanelProps {
  onClose: () => void;
}
