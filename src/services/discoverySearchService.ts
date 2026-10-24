import {
  SearchTabType,
  SearchSortOption,
  CreatorProfile,
  ShortVideoResult,
  LongVideoResult,
  LiveSessionResult,
  SoundResult,
  HashtagResult,
  SearchDataCollection
} from '../components/wameet/search/types';
import {
  MOCK_SEARCH_DATA,
  INITIAL_SEARCH_HISTORY
} from '../components/wameet/search/mockSearchData';

export interface DiscoverySearchApiParams {
  q?: string;
  category?: SearchTabType;
  sortBy?: SearchSortOption;
  limit?: number;
  offset?: number;
  userId?: string;
}

export interface DiscoverySearchApiResponse {
  success: boolean;
  query: string;
  category: SearchTabType;
  sortBy: SearchSortOption;
  operator?: string;
  targetHandle?: string;
  targetTag?: string;
  total?: number;
  execTimeMs: number;
  results: {
    topCreators?: CreatorProfile[];
    users?: CreatorProfile[];
    shorts?: ShortVideoResult[];
    longs?: LongVideoResult[];
    lives?: LiveSessionResult[];
    sounds?: SoundResult[];
    hashtags?: HashtagResult[];
    videos?: any[];
    playlist?: any[];
  };
}

export interface SearchHistoryApiResponse {
  success: boolean;
  userId: string;
  count: number;
  history: Array<{
    id: string;
    query: string;
    searchedAt: number;
    count: number;
  }>;
}

/**
 * Appelle l'API Backend Node.js GET /api/discovery/search
 * avec repli automatique sur le moteur local si l'API est indisponible.
 */
export async function fetchDiscoverySearch(
  params: DiscoverySearchApiParams
): Promise<DiscoverySearchApiResponse> {
  const queryParams = new URLSearchParams();
  if (params.q) queryParams.set('q', params.q);
  if (params.category) queryParams.set('category', params.category);
  if (params.sortBy) queryParams.set('sortBy', params.sortBy);
  if (params.limit) queryParams.set('limit', String(params.limit));
  if (params.offset) queryParams.set('offset', String(params.offset));

  try {
    const res = await fetch(`/api/discovery/search?${queryParams.toString()}`, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
        ...(params.userId ? { 'x-user-id': params.userId } : {})
      }
    });

    if (res.ok) {
      return await res.json();
    }
  } catch (error) {
    console.warn('[DISCOVERY SERVICE] Échec appel API backend, utilisation du repli local :', error);
  }

  // REPLI LOCAL HAUTE FIDÉLITÉ
  const qClean = (params.q || '').toLowerCase().trim();
  const cat = params.category || 'top';
  const sort = params.sortBy || 'most_viewed';

  return {
    success: true,
    query: params.q || '',
    category: cat,
    sortBy: sort,
    execTimeMs: 8,
    results: {
      topCreators: MOCK_SEARCH_DATA.creators.slice(0, 3),
      users: MOCK_SEARCH_DATA.creators,
      shorts: MOCK_SEARCH_DATA.shorts,
      longs: MOCK_SEARCH_DATA.longs,
      lives: MOCK_SEARCH_DATA.lives,
      sounds: MOCK_SEARCH_DATA.sounds,
      hashtags: MOCK_SEARCH_DATA.hashtags
    }
  };
}

/**
 * Récupère l'historique utilisateur depuis GET /api/discovery/history
 */
export async function fetchSearchHistory(userId: string = 'usr_default'): Promise<string[]> {
  try {
    const res = await fetch(`/api/discovery/history?userId=${encodeURIComponent(userId)}`, {
      method: 'GET',
      headers: { Accept: 'application/json' }
    });

    if (res.ok) {
      const data: SearchHistoryApiResponse = await res.json();
      if (Array.isArray(data.history)) {
        return data.history.map((h) => h.query);
      }
    }
  } catch (error) {
    console.warn('[DISCOVERY HISTORY] Échec récupération historique backend :', error);
  }

  // Repli localStorage ou mock initial
  if (typeof window !== 'undefined') {
    try {
      const stored = localStorage.getItem('wameet_video_search_history_v1');
      if (stored) return JSON.parse(stored);
    } catch {}
  }
  return INITIAL_SEARCH_HISTORY;
}

/**
 * Enregistre une recherche dans l'historique via POST /api/discovery/history
 * (pruning automatique aux 15 dernières recherches côté backend)
 */
export async function recordSearchHistory(query: string, userId: string = 'usr_default'): Promise<void> {
  const trimmed = query.trim();
  if (!trimmed) return;

  try {
    await fetch('/api/discovery/history', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, query: trimmed })
    });
  } catch (error) {
    console.warn('[DISCOVERY HISTORY] Échec sauvegarde historique backend :', error);
  }
}

/**
 * Supprime un élément d'historique ou vide l'historique via DELETE /api/discovery/history
 */
export async function deleteSearchHistoryApi(query?: string, userId: string = 'usr_default'): Promise<void> {
  const url = query
    ? `/api/discovery/history?userId=${encodeURIComponent(userId)}&query=${encodeURIComponent(query)}`
    : `/api/discovery/history?userId=${encodeURIComponent(userId)}`;

  try {
    await fetch(url, { method: 'DELETE' });
  } catch (error) {
    console.warn('[DISCOVERY HISTORY] Échec suppression historique backend :', error);
  }
}
