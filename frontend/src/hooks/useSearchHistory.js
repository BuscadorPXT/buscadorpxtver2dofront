import { useState, useEffect, useCallback } from 'react';

const STORAGE_KEY_PREFIX = 'search_history_';
const MAX_HISTORY_ITEMS = 5;

export const useSearchHistory = (userId) => {
  const [history, setHistory] = useState([]);
  const storageKey = `${STORAGE_KEY_PREFIX}${userId || 'guest'}`;

  useEffect(() => {
    if (!userId) return;
    
    try {
      const stored = localStorage.getItem(storageKey);
      if (stored) {
        const parsed = JSON.parse(stored);
        setHistory(parsed);
      }
    } catch (error) {
      console.error('Erro ao carregar histórico de pesquisas:', error);
      setHistory([]);
    }
  }, [userId, storageKey]);

  const addToHistory = useCallback((searchTerm) => {
    if (!searchTerm || searchTerm.trim().length < 2) return;

    const trimmedTerm = searchTerm.trim();
    
    setHistory((prev) => {

      const filtered = prev.filter(
        (item) => item.term.toLowerCase() !== trimmedTerm.toLowerCase()
      );

      const newHistory = [
        { term: trimmedTerm, timestamp: Date.now() },
        ...filtered
      ].slice(0, MAX_HISTORY_ITEMS);

      try {
        localStorage.setItem(storageKey, JSON.stringify(newHistory));
      } catch (error) {
        console.error('Erro ao salvar histórico:', error);
      }

      return newHistory;
    });
  }, [storageKey]);

  const removeFromHistory = useCallback((term) => {
    setHistory((prev) => {
      const filtered = prev.filter((item) => item.term !== term);
      
      try {
        localStorage.setItem(storageKey, JSON.stringify(filtered));
      } catch (error) {
        console.error('Erro ao remover do histórico:', error);
      }
      
      return filtered;
    });
  }, [storageKey]);

  const clearHistory = useCallback(() => {
    setHistory([]);
    try {
      localStorage.removeItem(storageKey);
    } catch (error) {
      console.error('Erro ao limpar histórico:', error);
    }
  }, [storageKey]);

  return {
    history,
    addToHistory,
    removeFromHistory,
    clearHistory,
  };
};
