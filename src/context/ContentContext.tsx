'use client';
/**
 * ContentContext.tsx — Estado global com dados do banco via API
 *
 * Estratégia:
 * - useReducer para gerenciar estado local
 * - Optimistic updates: aplica mudanças imediatamente na UI,
 *   reverte em caso de erro na API
 */

import React, {
  createContext, useContext, useReducer, useEffect,
  useCallback, ReactNode,
} from 'react';
import { ContentItem } from '@/types/content';

interface State {
  items: ContentItem[];
  loading: boolean;
  error: string | null;
}

type Action =
  | { type: 'SET_LOADING' }
  | { type: 'SET_ITEMS'; items: ContentItem[] }
  | { type: 'SET_ERROR'; error: string }
  | { type: 'ADD_ITEM'; item: ContentItem }
  | { type: 'UPDATE_ITEM'; item: ContentItem }
  | { type: 'REMOVE_ITEM'; id: string };

interface ContentStore {
  items: ContentItem[];
  loading: boolean;
  error: string | null;
  getById: (id: string) => ContentItem | undefined;
  addItem: (data: Omit<ContentItem, 'id' | 'createdAt' | 'updatedAt'>) => Promise<ContentItem>;
  updateItem: (id: string, updates: Partial<ContentItem>) => Promise<ContentItem | null>;
  deleteItem: (id: string) => Promise<boolean>;
  toggleFeatured: (id: string) => Promise<void>;
  toggleStatus: (id: string) => Promise<void>;
  refresh: () => Promise<void>;
}

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'SET_LOADING': return { ...state, loading: true, error: null };
    case 'SET_ITEMS':   return { ...state, loading: false, items: action.items };
    case 'SET_ERROR':   return { ...state, loading: false, error: action.error };
    case 'ADD_ITEM':    return { ...state, items: [action.item, ...state.items] };
    case 'UPDATE_ITEM': return {
      ...state,
      items: state.items.map(i => i.id === action.item.id ? action.item : i),
    };
    case 'REMOVE_ITEM': return { ...state, items: state.items.filter(i => i.id !== action.id) };
    default: return state;
  }
}

const ContentContext = createContext<ContentStore | null>(null);

async function apiFetch<T>(url: string, opts?: RequestInit): Promise<T> {
  const res = await fetch(url, { headers: { 'Content-Type': 'application/json' }, ...opts });
  const json = await res.json();
  if (!json.ok) throw new Error(json.error ?? `HTTP ${res.status}`);
  return json.data as T;
}

export function ContentProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, { items: [], loading: true, error: null });

  const fetchAll = useCallback(async () => {
    try {
      dispatch({ type: 'SET_LOADING' });
      const result = await apiFetch<{ items: ContentItem[]; total: number }>('/api/content');
      dispatch({ type: 'SET_ITEMS', items: result.items });
    } catch (e) {
      dispatch({ type: 'SET_ERROR', error: (e as Error).message });
    }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const getById = useCallback((id: string) => state.items.find(i => i.id === id), [state.items]);

  const addItem = useCallback(async (data: Omit<ContentItem, 'id' | 'createdAt' | 'updatedAt'>): Promise<ContentItem> => {
    const item = await apiFetch<ContentItem>('/api/content', { method: 'POST', body: JSON.stringify(data) });
    dispatch({ type: 'ADD_ITEM', item });
    return item;
  }, []);

  const updateItem = useCallback(async (id: string, updates: Partial<ContentItem>): Promise<ContentItem | null> => {
    const prev = state.items.find(i => i.id === id);
    if (prev) dispatch({ type: 'UPDATE_ITEM', item: { ...prev, ...updates } });
    try {
      const item = await apiFetch<ContentItem>(`/api/content/${id}`, { method: 'PUT', body: JSON.stringify(updates) });
      dispatch({ type: 'UPDATE_ITEM', item });
      return item;
    } catch (e) {
      if (prev) dispatch({ type: 'UPDATE_ITEM', item: prev });
      throw e;
    }
  }, [state.items]);

  const deleteItem = useCallback(async (id: string): Promise<boolean> => {
    dispatch({ type: 'REMOVE_ITEM', id });
    try {
      await apiFetch(`/api/content/${id}`, { method: 'DELETE' });
      return true;
    } catch (e) {
      await fetchAll();
      throw e;
    }
  }, [fetchAll]);

  const toggleFeatured = useCallback(async (id: string): Promise<void> => {
    const prev = state.items.find(i => i.id === id);
    if (prev) dispatch({ type: 'UPDATE_ITEM', item: { ...prev, featured: !prev.featured } });
    try {
      const item = await apiFetch<ContentItem>(`/api/content/${id}/featured`, { method: 'PATCH' });
      dispatch({ type: 'UPDATE_ITEM', item });
    } catch (e) {
      if (prev) dispatch({ type: 'UPDATE_ITEM', item: prev });
      throw e;
    }
  }, [state.items]);

  const toggleStatus = useCallback(async (id: string): Promise<void> => {
    const prev = state.items.find(i => i.id === id);
    if (prev) {
      const next = prev.status === 'published' ? 'draft' : 'published';
      dispatch({ type: 'UPDATE_ITEM', item: { ...prev, status: next as ContentItem['status'] } });
    }
    try {
      const item = await apiFetch<ContentItem>(`/api/content/${id}/status`, { method: 'PATCH' });
      dispatch({ type: 'UPDATE_ITEM', item });
    } catch (e) {
      if (prev) dispatch({ type: 'UPDATE_ITEM', item: prev });
      throw e;
    }
  }, [state.items]);

  return (
    <ContentContext.Provider value={{
      items: state.items, loading: state.loading, error: state.error,
      getById, addItem, updateItem, deleteItem, toggleFeatured, toggleStatus, refresh: fetchAll,
    }}>
      {children}
    </ContentContext.Provider>
  );
}

export function useContent(): ContentStore {
  const ctx = useContext(ContentContext);
  if (!ctx) throw new Error('useContent deve ser usado dentro de ContentProvider');
  return ctx;
}
