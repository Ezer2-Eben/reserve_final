// src/hooks/useOptimizedFetch.js
import { useCallback, useEffect, useRef, useState } from 'react';

// Cache global pour les requêtes
const requestCache = new Map();

export const useOptimizedFetch = (fetchFunction, dependencies = [], options = {}) => {
  const {
    cacheKey = null,
    cacheTime = 5 * 60 * 1000, // 5 minutes
    retryAttempts = 3,
    retryDelay = 1000,
    enableCache = true,
    enableRetry = true,
  } = options;

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const abortControllerRef = useRef(null);
  const retryCountRef = useRef(0);

  const clearCache = useCallback(() => {
    if (cacheKey) {
      requestCache.delete(cacheKey);
    }
  }, [cacheKey]);

  const executeRequest = useCallback(async (isRetry = false) => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    abortControllerRef.current = new AbortController();

    try {
      setLoading(true);
      setError(null);

      // Vérifier le cache si activé
      if (enableCache && cacheKey && !isRetry) {
        const cachedData = requestCache.get(cacheKey);
        if (cachedData && Date.now() - cachedData.timestamp < cacheTime) {
          setData(cachedData.data);
          setLoading(false);
          return;
        }
      }

      const result = await fetchFunction(abortControllerRef.current.signal);
      
      // Mettre en cache si activé
      if (enableCache && cacheKey) {
        requestCache.set(cacheKey, {
          data: result,
          timestamp: Date.now(),
        });
      }

      setData(result);
      retryCountRef.current = 0;
    } catch (err) {
      if (err.name === 'AbortError') {
        return; // Requête annulée
      }

      console.error('Erreur de requête:', err);

      // Logique de retry
      if (enableRetry && retryCountRef.current < retryAttempts) {
        retryCountRef.current++;
        setTimeout(() => {
          executeRequest(true);
        }, retryDelay * retryCountRef.current);
        return;
      }

      setError(err);
      retryCountRef.current = 0;
    } finally {
      setLoading(false);
    }
  }, [fetchFunction, cacheKey, cacheTime, enableCache, enableRetry, retryAttempts, retryDelay]);

  useEffect(() => {
    executeRequest();
    
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, dependencies);

  const refetch = useCallback(() => {
    clearCache();
    executeRequest();
  }, [clearCache, executeRequest]);

  return {
    data,
    loading,
    error,
    refetch,
    clearCache,
  };
};








