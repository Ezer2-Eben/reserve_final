// src/hooks/useOptimizedData.js
import { useState, useEffect, useCallback, useRef } from 'react';

// Cache simple pour les données
const dataCache = new Map();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export const useOptimizedData = (fetchFunction, dependencies = [], options = {}) => {
  const {
    cacheKey = null,
    cacheDuration = CACHE_DURATION,
    debounceDelay = 300,
    retryAttempts = 3,
    retryDelay = 1000,
  } = options;

  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);

  const abortControllerRef = useRef(null);
  const debounceTimeoutRef = useRef(null);
  const retryCountRef = useRef(0);

  // Fonction pour vérifier le cache
  const getCachedData = useCallback((key) => {
    if (!key) return null;
    
    const cached = dataCache.get(key);
    if (cached && Date.now() - cached.timestamp < cacheDuration) {
      return cached.data;
    }
    
    // Supprimer les données expirées
    dataCache.delete(key);
    return null;
  }, [cacheDuration]);

  // Fonction pour mettre en cache
  const setCachedData = useCallback((key, data) => {
    if (key) {
      dataCache.set(key, {
        data,
        timestamp: Date.now(),
      });
    }
  }, []);

  // Fonction de récupération des données avec retry
  const fetchDataWithRetry = useCallback(async (signal) => {
    try {
      const result = await fetchFunction(signal);
      setData(result);
      setError(null);
      setLastUpdated(new Date());
      
      if (cacheKey) {
        setCachedData(cacheKey, result);
      }
      
      retryCountRef.current = 0;
      return result;
    } catch (err) {
      if (err.name === 'AbortError') {
        return;
      }
      
      if (retryCountRef.current < retryAttempts) {
        retryCountRef.current++;
        setTimeout(() => {
          fetchDataWithRetry(signal);
        }, retryDelay * retryCountRef.current);
      } else {
        setError(err);
        retryCountRef.current = 0;
      }
    }
  }, [fetchFunction, cacheKey, setCachedData, retryAttempts, retryDelay]);

  // Fonction principale de récupération des données
  const fetchData = useCallback(async (forceRefresh = false) => {
    // Annuler la requête précédente
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // Créer un nouveau contrôleur d'annulation
    abortControllerRef.current = new AbortController();

    // Vérifier le cache si pas de forçage
    if (!forceRefresh && cacheKey) {
      const cachedData = getCachedData(cacheKey);
      if (cachedData) {
        setData(cachedData);
        setError(null);
        setIsLoading(false);
        return cachedData;
      }
    }

    setIsLoading(true);
    setError(null);

    try {
      const result = await fetchDataWithRetry(abortControllerRef.current.signal);
      setIsLoading(false);
      return result;
    } catch (err) {
      if (err.name !== 'AbortError') {
        setIsLoading(false);
      }
    }
  }, [cacheKey, getCachedData, fetchDataWithRetry]);

  // Fonction de rafraîchissement avec debouncing
  const refreshData = useCallback((forceRefresh = false) => {
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }

    debounceTimeoutRef.current = setTimeout(() => {
      fetchData(forceRefresh);
    }, debounceDelay);
  }, [fetchData, debounceDelay]);

  // Effet pour récupérer les données au montage et lors des changements de dépendances
  useEffect(() => {
    refreshData();
    
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
    };
  }, dependencies);

  // Fonction pour invalider le cache
  const invalidateCache = useCallback(() => {
    if (cacheKey) {
      dataCache.delete(cacheKey);
    }
  }, [cacheKey]);

  // Fonction pour forcer le rafraîchissement
  const forceRefresh = useCallback(() => {
    refreshData(true);
  }, [refreshData]);

  return {
    data,
    isLoading,
    error,
    lastUpdated,
    refresh: refreshData,
    forceRefresh,
    invalidateCache,
  };
};

// Hook pour les données en temps réel avec polling
export const useRealtimeData = (fetchFunction, dependencies = [], options = {}) => {
  const {
    pollingInterval = 30000, // 30 secondes par défaut
    enabled = true,
    ...otherOptions
  } = options;

  const {
    data,
    isLoading,
    error,
    lastUpdated,
    refresh,
    forceRefresh,
    invalidateCache,
  } = useOptimizedData(fetchFunction, dependencies, otherOptions);

  const pollingRef = useRef(null);

  // Démarrer le polling
  const startPolling = useCallback(() => {
    if (!enabled || pollingInterval <= 0) return;

    pollingRef.current = setInterval(() => {
      refresh();
    }, pollingInterval);
  }, [enabled, pollingInterval, refresh]);

  // Arrêter le polling
  const stopPolling = useCallback(() => {
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
      pollingRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (enabled) {
      startPolling();
    } else {
      stopPolling();
    }

    return () => {
      stopPolling();
    };
  }, [enabled, startPolling, stopPolling]);

  return {
    data,
    isLoading,
    error,
    lastUpdated,
    refresh,
    forceRefresh,
    invalidateCache,
    startPolling,
    stopPolling,
  };
};

// Hook pour les données avec pagination optimisée
export const usePaginatedData = (fetchFunction, dependencies = [], options = {}) => {
  const {
    pageSize = 10,
    initialPage = 1,
    ...otherOptions
  } = options;

  const [currentPage, setCurrentPage] = useState(initialPage);
  const [totalPages, setTotalPages] = useState(0);
  const [totalItems, setTotalItems] = useState(0);

  const fetchPaginatedData = useCallback(async (signal) => {
    const result = await fetchFunction(currentPage, pageSize, signal);
    
    // Supposer que l'API retourne { data, total, totalPages }
    if (result && typeof result === 'object') {
      setTotalPages(result.totalPages || Math.ceil(result.total / pageSize));
      setTotalItems(result.total || 0);
      return result.data || result;
    }
    
    return result;
  }, [fetchFunction, currentPage, pageSize]);

  const {
    data,
    isLoading,
    error,
    lastUpdated,
    refresh,
    forceRefresh,
    invalidateCache,
  } = useOptimizedData(fetchPaginatedData, [...dependencies, currentPage], otherOptions);

  const goToPage = useCallback((page) => {
    setCurrentPage(page);
  }, []);

  const nextPage = useCallback(() => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  }, [currentPage, totalPages]);

  const prevPage = useCallback(() => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  }, [currentPage]);

  return {
    data,
    isLoading,
    error,
    lastUpdated,
    currentPage,
    totalPages,
    totalItems,
    pageSize,
    goToPage,
    nextPage,
    prevPage,
    refresh,
    forceRefresh,
    invalidateCache,
  };
};
