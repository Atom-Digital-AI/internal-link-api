import { useState, useCallback, useMemo, useEffect } from 'react';
import type { SavedLink } from '../types';
import {
  getSavedLinks,
  addSavedLink,
  deleteSavedLink as localDeleteSavedLink,
  updateSavedLink,
  clearAllSavedLinks,
  exportSavedLinksToCsv,
} from '../services/storage';
import {
  getSavedLinks as apiGetSavedLinks,
  createSavedLink as apiCreateSavedLink,
  deleteSavedLink as apiDeleteSavedLink,
} from '../services/api';
import { useAuth } from '../contexts/AuthContext';

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
  const { user, accessToken } = useAuth();
  const isPro = user?.plan === 'pro';

  const [savedLinks, setSavedLinks] = useState<SavedLink[]>(() => getSavedLinks());

  // Load links from the appropriate source based on plan
  const refreshLinks = useCallback(() => {
    if (isPro && accessToken) {
      apiGetSavedLinks(accessToken).then(cloudLinks => {
        const mapped = cloudLinks.map(cl => {
          const ld = cl.link_data as Record<string, unknown>;
          return {
            id: cl.id,
            savedAt: cl.created_at,
            sourceUrl: (ld.sourceUrl as string) || '',
            sourceTitle: (ld.sourceTitle as string | null) || null,
            targetUrl: (ld.targetUrl as string) || '',
            anchorText: (ld.anchorText as string) || '',
            reason: (ld.reason as string) || '',
            sentence: (ld.sentence as string) || '',
            domain: (ld.domain as string) || '',
            isImplemented: (ld.isImplemented as boolean) || false,
          } as SavedLink;
        });
        setSavedLinks(mapped);
      }).catch(() => setSavedLinks(getSavedLinks()));
    } else {
      setSavedLinks(getSavedLinks());
    }
  }, [isPro, accessToken]);

  // Load on mount and plan change
  useEffect(() => {
    refreshLinks();
  }, [refreshLinks]);

  // Listen for localStorage changes (free users only)
  useEffect(() => {
    if (isPro) return;
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'internal-link-finder-saved-links') {
        setSavedLinks(getSavedLinks());
      }
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [isPro]);

  // Set of saved link keys for O(1) duplicate lookup
  const savedKeys = useMemo(() => {
    return new Set(
      savedLinks.map(link => generateLinkKey(link.sourceUrl, link.targetUrl, link.anchorText))
    );
  }, [savedLinks]);

  const saveLink = useCallback((data: SaveLinkData) => {
    if (isPro && accessToken) {
      let domain = '';
      try { domain = new URL(data.sourceUrl).hostname; } catch { domain = data.sourceUrl; }
      const linkData = { ...data, domain, isImplemented: false };
      apiCreateSavedLink(accessToken, { link_data: linkData as Record<string, unknown> }).then(cl => {
        const mapped: SavedLink = {
          id: cl.id,
          savedAt: cl.created_at,
          ...linkData,
        };
        setSavedLinks(prev => [mapped, ...prev]);
      }).catch(err => console.error('Failed to save link to cloud:', err));
    } else {
      const newLink = addSavedLink(data);
      setSavedLinks(prev => [newLink, ...prev]);
    }
  }, [isPro, accessToken]);

  const deleteLink = useCallback((id: string) => {
    if (isPro && accessToken) {
      apiDeleteSavedLink(accessToken, id).then(() => {
        setSavedLinks(prev => prev.filter(link => link.id !== id));
      }).catch(err => console.error('Failed to delete link from cloud:', err));
    } else {
      localDeleteSavedLink(id);
      setSavedLinks(prev => prev.filter(link => link.id !== id));
    }
  }, [isPro, accessToken]);

  const toggleImplemented = useCallback((id: string) => {
    // Toggle implemented is localStorage-only for now (cloud doesn't track this)
    setSavedLinks(prev => {
      const link = prev.find(l => l.id === id);
      if (link) {
        const newValue = !link.isImplemented;
        if (!isPro) {
          updateSavedLink(id, { isImplemented: newValue });
        }
        return prev.map(l => (l.id === id ? { ...l, isImplemented: newValue } : l));
      }
      return prev;
    });
  }, [isPro]);

  const clearAll = useCallback((domain?: string) => {
    if (!isPro) {
      clearAllSavedLinks(domain);
    }
    if (domain) {
      setSavedLinks(prev => prev.filter(link => link.domain !== domain));
    } else {
      setSavedLinks([]);
    }
  }, [isPro]);

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
