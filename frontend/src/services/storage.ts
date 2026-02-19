import type { SavedSession, SavedLink } from '../types';

const STORAGE_KEY = 'internal-link-finder-sessions';

export function generateSessionId(): string {
  return `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

export function getSavedSessions(): SavedSession[] {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (!data) return [];
    return JSON.parse(data);
  } catch {
    console.error('Failed to load saved sessions');
    return [];
  }
}

export function saveSession(session: SavedSession): void {
  try {
    const sessions = getSavedSessions();
    const existingIndex = sessions.findIndex(s => s.id === session.id);

    if (existingIndex >= 0) {
      sessions[existingIndex] = { ...session, updatedAt: new Date().toISOString() };
    } else {
      sessions.unshift(session);
    }

    localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions));
  } catch {
    console.error('Failed to save session');
  }
}

export function deleteSession(id: string): void {
  try {
    const sessions = getSavedSessions();
    const filtered = sessions.filter(s => s.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
  } catch {
    console.error('Failed to delete session');
  }
}

const MAX_RECENT = 5;

export function pruneRecentSessions(): void {
  try {
    const sessions = getSavedSessions();
    const recentSessions = sessions.filter(s => !s.isSaved);
    if (recentSessions.length > MAX_RECENT) {
      recentSessions.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
      const toDelete = recentSessions.slice(MAX_RECENT);
      const idsToDelete = new Set(toDelete.map(s => s.id));
      const filtered = sessions.filter(s => !idsToDelete.has(s.id));
      localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
    }
  } catch {
    console.error('Failed to prune recent sessions');
  }
}

export function updateSessionSaved(id: string, isSaved: boolean): void {
  try {
    const sessions = getSavedSessions();
    const index = sessions.findIndex(s => s.id === id);
    if (index >= 0) {
      sessions[index] = { ...sessions[index], isSaved, updatedAt: new Date().toISOString() };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions));
    }
  } catch {
    console.error('Failed to update session saved status');
  }
}

export function createSession(
  domain: string,
  sourcePattern: string,
  targetPattern: string,
  sourcePages: SavedSession['sourcePages'],
  targetPages: SavedSession['targetPages'],
  results: SavedSession['results'],
  summary: SavedSession['summary'],
  isSaved: boolean = false
): SavedSession {
  const now = new Date().toISOString();
  const hostname = new URL(domain).hostname;

  return {
    id: generateSessionId(),
    name: `${hostname} - ${new Date().toLocaleDateString()}`,
    createdAt: now,
    updatedAt: now,
    domain,
    sourcePattern,
    targetPattern,
    sourcePages,
    targetPages,
    results,
    summary,
    isSaved,
  };
}

// ============================================
// Saved Links Storage Functions
// ============================================

const SAVED_LINKS_KEY = 'internal-link-finder-saved-links';

export function generateLinkId(): string {
  return `link-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

export function getSavedLinks(): SavedLink[] {
  try {
    const data = localStorage.getItem(SAVED_LINKS_KEY);
    if (!data) return [];
    return JSON.parse(data);
  } catch {
    console.error('Failed to load saved links');
    return [];
  }
}

function saveLinksList(links: SavedLink[]): void {
  try {
    localStorage.setItem(SAVED_LINKS_KEY, JSON.stringify(links));
  } catch {
    console.error('Failed to save links');
  }
}

export function addSavedLink(
  linkData: Omit<SavedLink, 'id' | 'savedAt' | 'domain' | 'isImplemented'>
): SavedLink {
  const links = getSavedLinks();

  // Extract domain from sourceUrl
  let domain = '';
  try {
    domain = new URL(linkData.sourceUrl).hostname;
  } catch {
    domain = linkData.sourceUrl;
  }

  const newLink: SavedLink = {
    ...linkData,
    id: generateLinkId(),
    savedAt: new Date().toISOString(),
    domain,
    isImplemented: false,
  };

  links.unshift(newLink);
  saveLinksList(links);
  return newLink;
}

export function deleteSavedLink(id: string): void {
  const links = getSavedLinks();
  const filtered = links.filter(link => link.id !== id);
  saveLinksList(filtered);
}

export function updateSavedLink(id: string, updates: Partial<SavedLink>): void {
  const links = getSavedLinks();
  const index = links.findIndex(link => link.id === id);
  if (index >= 0) {
    links[index] = { ...links[index], ...updates };
    saveLinksList(links);
  }
}

export function clearAllSavedLinks(domain?: string): void {
  if (domain) {
    const links = getSavedLinks();
    const filtered = links.filter(link => link.domain !== domain);
    saveLinksList(filtered);
  } else {
    localStorage.removeItem(SAVED_LINKS_KEY);
  }
}

// CSV Export utility
function escapeCsvField(field: string): string {
  if (field.includes(',') || field.includes('"') || field.includes('\n')) {
    return `"${field.replace(/"/g, '""')}"`;
  }
  return field;
}

export function exportSavedLinksToCsv(links: SavedLink[]): void {
  const headers = [
    'Source URL',
    'Source Title',
    'Target URL',
    'Anchor Text',
    'Context',
    'Reason',
    'Domain',
    'Saved At',
    'Implemented'
  ];

  const rows = links.map(link => [
    link.sourceUrl,
    link.sourceTitle || '',
    link.targetUrl,
    link.anchorText,
    link.sentence,
    link.reason,
    link.domain,
    link.savedAt.split('T')[0], // Just the date portion
    link.isImplemented ? 'Yes' : 'No'
  ]);

  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.map(escapeCsvField).join(','))
  ].join('\n');

  // Trigger download
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `saved-links-${new Date().toISOString().split('T')[0]}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}
