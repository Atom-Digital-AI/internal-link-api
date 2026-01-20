import { useState, useCallback, useMemo, useEffect } from 'react';
import type { SavedLink } from '../types';
import {
  getSavedLinks,
  addSavedLink,
  deleteSavedLink,
  updateSavedLink,
  clearAllSavedLinks,
  exportSavedLinksToCsv,
} from '../services/storage';

type SaveLinkData = Omit<SavedLink, 'id' | 'savedAt' | 'domain' | 'isImplemented'>;

interface UseSavedLinksReturn {
  savedLinks: SavedLink[];
  saveLink: (data: SaveLinkData) => void;
  deleteLink: (id: string) => void;
  toggleImplemented: (id: string) => void;
  clearAll: (domain?: string) => void;
  isLinkSaved: (sourceUrl: string, targetUrl: string, anchorText: string) => boolean;
  getUniqueDomains: () => string[];
  exportCsv: (links?: SavedLink[]) => void;
  refreshLinks: () => void;
}

// Generate a composite key for duplicate detection
function generateLinkKey(sourceUrl: string, targetUrl: string, anchorText: string): string {
  return `${sourceUrl}|${targetUrl}|${anchorText}`;
}

export function useSavedLinks(): UseSavedLinksReturn {
  const [savedLinks, setSavedLinks] = useState<SavedLink[]>(() => getSavedLinks());

  // Refresh links from localStorage
  const refreshLinks = useCallback(() => {
    setSavedLinks(getSavedLinks());
  }, []);

  // Listen for storage events from other tabs
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'internal-link-finder-saved-links') {
        refreshLinks();
      }
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [refreshLinks]);

  // Set of saved link keys for O(1) duplicate lookup
  const savedKeys = useMemo(() => {
    return new Set(
      savedLinks.map(link => generateLinkKey(link.sourceUrl, link.targetUrl, link.anchorText))
    );
  }, [savedLinks]);

  const saveLink = useCallback((data: SaveLinkData) => {
    const newLink = addSavedLink(data);
    setSavedLinks(prev => [newLink, ...prev]);
  }, []);

  const deleteLink = useCallback((id: string) => {
    deleteSavedLink(id);
    setSavedLinks(prev => prev.filter(link => link.id !== id));
  }, []);

  const toggleImplemented = useCallback((id: string) => {
    setSavedLinks(prev => {
      const link = prev.find(l => l.id === id);
      if (link) {
        const newValue = !link.isImplemented;
        updateSavedLink(id, { isImplemented: newValue });
        return prev.map(l => (l.id === id ? { ...l, isImplemented: newValue } : l));
      }
      return prev;
    });
  }, []);

  const clearAll = useCallback((domain?: string) => {
    clearAllSavedLinks(domain);
    if (domain) {
      setSavedLinks(prev => prev.filter(link => link.domain !== domain));
    } else {
      setSavedLinks([]);
    }
  }, []);

  const isLinkSaved = useCallback(
    (sourceUrl: string, targetUrl: string, anchorText: string): boolean => {
      return savedKeys.has(generateLinkKey(sourceUrl, targetUrl, anchorText));
    },
    [savedKeys]
  );

  const getUniqueDomains = useCallback((): string[] => {
    const domains = new Set(savedLinks.map(link => link.domain));
    return Array.from(domains).sort();
  }, [savedLinks]);

  const exportCsv = useCallback((links?: SavedLink[]) => {
    exportSavedLinksToCsv(links || savedLinks);
  }, [savedLinks]);

  return {
    savedLinks,
    saveLink,
    deleteLink,
    toggleImplemented,
    clearAll,
    isLinkSaved,
    getUniqueDomains,
    exportCsv,
    refreshLinks,
  };
}
