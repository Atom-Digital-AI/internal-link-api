import type {
  ConfigResponse,
  SitemapResponse,
  AnalyzeResponse,
  BulkAnalyzeResponse,
  FilterOptions,
  TargetPageInfo,
} from '../types';

// Use relative URLs in production (same origin), absolute URL for local dev
const API_BASE = import.meta.env.VITE_API_URL || '';

// ─── Auth token refresh ────────────────────────────────────────────────────

// Callback registered by AuthContext so api.ts can refresh tokens
let _onRefresh: (() => Promise<string | null>) | null = null;
let _onClearAuth: (() => void) | null = null;

export function registerAuthCallbacks(
  onRefresh: () => Promise<string | null>,
  onClearAuth: () => void
) {
  _onRefresh = onRefresh;
  _onClearAuth = onClearAuth;
}

// ─── Core fetch helper ─────────────────────────────────────────────────────

async function fetchJson<T>(
  url: string,
  options?: RequestInit,
  token?: string | null,
  retry = true
): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options?.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(url, {
    ...options,
    headers,
    credentials: 'include',
  });

  // Attempt automatic token refresh on 401
  if (response.status === 401 && retry && _onRefresh) {
    const newToken = await _onRefresh();
    if (newToken) {
      return fetchJson<T>(url, options, newToken, false);
    }
    _onClearAuth?.();
    throw new Error('Session expired. Please log in again.');
  }

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: response.statusText }));
    throw new Error(error.detail || `HTTP ${response.status}`);
  }

  return response.json();
}

// ─── Auth-aware fetch helper ───────────────────────────────────────────────

export function createAuthenticatedFetch(accessToken: string | null) {
  return function authenticatedFetch<T>(url: string, options?: RequestInit): Promise<T> {
    return fetchJson<T>(url, options, accessToken);
  };
}

// ─── Existing API functions (updated to accept optional token) ─────────────

export async function getConfig(token?: string | null): Promise<ConfigResponse> {
  return fetchJson<ConfigResponse>(`${API_BASE}/config`, undefined, token);
}

export async function getSitemap(
  domain: string,
  sourcePattern: string,
  targetPattern: string,
  token?: string | null
): Promise<SitemapResponse> {
  return fetchJson<SitemapResponse>(
    `${API_BASE}/sitemap`,
    {
      method: 'POST',
      body: JSON.stringify({
        domain,
        source_pattern: sourcePattern,
        target_pattern: targetPattern,
      }),
    },
    token
  );
}

export async function analyzePage(
  url: string,
  targetPattern: string,
  token?: string | null
): Promise<AnalyzeResponse> {
  return fetchJson<AnalyzeResponse>(
    `${API_BASE}/analyze`,
    {
      method: 'POST',
      body: JSON.stringify({ url, target_pattern: targetPattern }),
    },
    token
  );
}

export async function bulkAnalyze(
  urls: string[],
  targetPattern: string,
  filterOptions?: FilterOptions,
  token?: string | null
): Promise<BulkAnalyzeResponse> {
  return fetchJson<BulkAnalyzeResponse>(
    `${API_BASE}/bulk-analyze`,
    {
      method: 'POST',
      body: JSON.stringify({
        urls,
        target_pattern: targetPattern,
        ...(filterOptions?.targetUrl && { filter_target_url: filterOptions.targetUrl }),
        ...(filterOptions?.keyword && { filter_keyword: filterOptions.keyword }),
        ...(filterOptions && { filter_match_type: filterOptions.matchType }),
      }),
    },
    token
  );
}

export async function fetchTargetPage(url: string, token?: string | null): Promise<TargetPageInfo> {
  return fetchJson<TargetPageInfo>(
    `${API_BASE}/fetch-target`,
    { method: 'POST', body: JSON.stringify({ url }) },
    token
  );
}

// ─── New SaaS API types ────────────────────────────────────────────────────

export interface UserProfile {
  id: string;
  email: string;
  plan: 'free' | 'starter' | 'pro';
  created_at: string;
}

export interface CloudSession {
  id: string;
  domain: string;
  is_saved: boolean;
  config: Record<string, unknown>;
  results: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface CloudSavedLink {
  id: string;
  link_data: Record<string, unknown>;
  session_id: string | null;
  created_at: string;
}

export interface AiSuggestionRequest {
  source_url: string;
  source_content: string;
  target_url: string;
  target_title: string;
  target_keywords: string[];
}

export interface AiSuggestionResponse {
  suggestion: string;
  reasoning: string;
}

export interface CheckoutSessionResponse {
  url: string;
}

export interface BillingPortalResponse {
  url: string;
}

// ─── New SaaS API functions ────────────────────────────────────────────────

export async function getMe(token: string | null): Promise<UserProfile> {
  return fetchJson<UserProfile>(`${API_BASE}/user/me`, undefined, token);
}

export async function getSessions(token: string | null): Promise<CloudSession[]> {
  return fetchJson<CloudSession[]>(`${API_BASE}/sessions`, undefined, token);
}

export async function createSession(
  token: string | null,
  data: { domain: string; config: Record<string, unknown>; results: Record<string, unknown>; is_saved?: boolean }
): Promise<CloudSession> {
  return fetchJson<CloudSession>(
    `${API_BASE}/sessions`,
    { method: 'POST', body: JSON.stringify(data) },
    token
  );
}

export async function deleteSession(token: string | null, sessionId: string): Promise<void> {
  await fetchJson<void>(
    `${API_BASE}/sessions/${sessionId}`,
    { method: 'DELETE' },
    token
  );
}

export async function updateSession(
  token: string | null,
  sessionId: string,
  data: { config?: Record<string, unknown>; results?: Record<string, unknown>; is_saved?: boolean }
): Promise<CloudSession> {
  return fetchJson<CloudSession>(
    `${API_BASE}/sessions/${sessionId}`,
    { method: 'PUT', body: JSON.stringify(data) },
    token
  );
}

export async function getSavedLinks(token: string | null): Promise<CloudSavedLink[]> {
  return fetchJson<CloudSavedLink[]>(`${API_BASE}/saved-links`, undefined, token);
}

export async function createSavedLink(
  token: string | null,
  data: { link_data: Record<string, unknown>; session_id?: string }
): Promise<CloudSavedLink> {
  return fetchJson<CloudSavedLink>(
    `${API_BASE}/saved-links`,
    { method: 'POST', body: JSON.stringify(data) },
    token
  );
}

export async function deleteSavedLink(token: string | null, linkId: string): Promise<void> {
  await fetchJson<void>(
    `${API_BASE}/saved-links/${linkId}`,
    { method: 'DELETE' },
    token
  );
}

export async function getAiSuggestion(
  token: string | null,
  data: AiSuggestionRequest
): Promise<AiSuggestionResponse> {
  return fetchJson<AiSuggestionResponse>(
    `${API_BASE}/ai/suggest`,
    { method: 'POST', body: JSON.stringify(data) },
    token
  );
}

export async function createCheckoutSession(
  token: string | null,
  plan: 'starter' | 'pro' = 'pro'
): Promise<CheckoutSessionResponse> {
  return fetchJson<CheckoutSessionResponse>(
    `${API_BASE}/billing/checkout`,
    { method: 'POST', body: JSON.stringify({ plan }) },
    token
  );
}

export async function upgradeToPro(token: string | null): Promise<{ plan: string }> {
  return fetchJson<{ plan: string }>(
    `${API_BASE}/billing/upgrade`,
    { method: 'POST' },
    token
  );
}

export async function getBillingPortal(token: string | null): Promise<BillingPortalResponse> {
  return fetchJson<BillingPortalResponse>(
    `${API_BASE}/billing/portal`,
    undefined,
    token
  );
}

export async function cancelSubscription(token: string | null): Promise<{ current_period_end: string | null }> {
  return fetchJson<{ current_period_end: string | null }>(
    `${API_BASE}/billing/cancel`,
    { method: 'POST' },
    token
  );
}

// ─── Account management ────────────────────────────────────────────────────

export interface SubscriptionInfo {
  has_subscription: boolean;
  status: string | null;
  current_period_end: string | null;
  stripe_subscription_id: string | null;
}

export interface UsageInfo {
  call_count: number;
  period_end: string | null;
  limit: number;
}

export async function getSubscription(token: string | null): Promise<SubscriptionInfo> {
  return fetchJson<SubscriptionInfo>(`${API_BASE}/user/me/subscription`, undefined, token);
}

export async function getUsage(token: string | null): Promise<UsageInfo> {
  return fetchJson<UsageInfo>(`${API_BASE}/user/me/usage`, undefined, token);
}

export async function updateEmail(
  token: string | null,
  newEmail: string,
  currentPassword: string
): Promise<UserProfile> {
  return fetchJson<UserProfile>(
    `${API_BASE}/user/me`,
    {
      method: 'PATCH',
      body: JSON.stringify({ new_email: newEmail, current_password: currentPassword }),
    },
    token
  );
}

export async function changePassword(
  token: string | null,
  currentPassword: string,
  newPassword: string,
  confirmPassword: string
): Promise<void> {
  await fetchJson<{ message: string }>(
    `${API_BASE}/user/change-password`,
    {
      method: 'POST',
      body: JSON.stringify({
        current_password: currentPassword,
        new_password: newPassword,
        confirm_password: confirmPassword,
      }),
    },
    token
  );
}

// ─── Blog types ────────────────────────────────────────────────────────────

export interface BlogPostSummary {
  id: string
  slug: string
  title: string
  excerpt: string | null
  cover_image: string | null
  published_at: string | null
  created_at: string
}

export interface BlogPostDetail extends BlogPostSummary {
  html_content: string
}

// ─── Blog API calls ─────────────────────────────────────────────────────────

export async function fetchBlogPosts(): Promise<BlogPostSummary[]> {
  return fetchJson<BlogPostSummary[]>(`${API_BASE}/blog/posts`)
}

export async function fetchBlogPost(slug: string): Promise<BlogPostDetail> {
  return fetchJson<BlogPostDetail>(`${API_BASE}/blog/posts/${slug}`)
}
