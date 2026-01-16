import type { SavedSession } from '../types';

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

export function createSession(
  domain: string,
  sourcePattern: string,
  targetPattern: string,
  sourcePages: SavedSession['sourcePages'],
  targetPages: SavedSession['targetPages'],
  results: SavedSession['results'],
  summary: SavedSession['summary']
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
  };
}
