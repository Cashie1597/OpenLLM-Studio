import { useState, useCallback } from 'react';
import { searchHfModels } from '../lib/tauri';
import { useAppStore } from '../store/appStore';
import type { HfModel } from '../lib/types';

export function useHfSearch() {
  const { hfToken } = useAppStore();
  const [searchResults, setSearchResults] = useState<HfModel[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeSearchQuery, setActiveSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  
  const performSearch = async (query: string, page: number, append: boolean = false) => {
    if (!query.trim()) {
      setSearchResults([]);
      setHasMore(true);
      return;
    }

    setIsSearching(true);
    setError(null);
    
    try {
      const results = await searchHfModels(query, page, hfToken || undefined);
      
      if (append) {
        setSearchResults(prev => [...prev, ...results]);
      } else {
        setSearchResults(results);
      }
      
      // If we got fewer than 20 results, there are no more pages
      setHasMore(results.length === 20);
    } catch (err) {
      let errorMessage = 'Search failed';
      
      if (err instanceof Error) {
        errorMessage = err.message;
        
        // Check if it's a rate limit error
        if (errorMessage.includes('Rate limit exceeded')) {
          // Extract retry time if available
          const match = errorMessage.match(/retry after (\d+) seconds/);
          if (match) {
            const seconds = parseInt(match[1]);
            errorMessage = `Rate limit exceeded. Please wait ${seconds} seconds before searching again.`;
          }
        }
      }
      
      setError(errorMessage);
      console.error('Search error:', err);
    } finally {
      setIsSearching(false);
    }
  };

  const setQuery = useCallback((query: string) => {
    setSearchQuery(query);
  }, []);

  const searchModels = useCallback(async (query?: string) => {
    const nextQuery = (query ?? searchQuery).trim();
    setSearchQuery(query ?? searchQuery);
    setActiveSearchQuery(nextQuery);
    setCurrentPage(0);
    setHasMore(true);
    await performSearch(nextQuery, 0, false);
  }, [searchQuery, hfToken]);

  const loadMore = useCallback(() => {
    if (!isSearching && hasMore && activeSearchQuery.trim()) {
      const nextPage = currentPage + 1;
      setCurrentPage(nextPage);
      performSearch(activeSearchQuery, nextPage, true);
    }
  }, [isSearching, hasMore, activeSearchQuery, currentPage, hfToken]);

  return {
    searchResults,
    isSearching,
    error,
    searchQuery,
    activeSearchQuery,
    hasMore,
    setQuery,
    searchModels,
    loadMore,
  };
}
