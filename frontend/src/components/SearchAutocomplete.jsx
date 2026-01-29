import { useState, useEffect, useRef, useMemo } from 'react';
import { Search, Smartphone, Tag, Loader2, X, Clock, Trash2 } from 'lucide-react';
import api from '../lib/axios';
import { useAuth } from '../contexts/AuthContext';
import { useSearchHistory } from '../hooks/useSearchHistory';

const SearchAutocomplete = ({ value, onChange, onSelect, onClear, localProducts = null }) => {
  const { user } = useAuth();
  const { history, addToHistory, removeFromHistory, clearHistory } = useSearchHistory(user?.id);
  const [isOpen, setIsOpen] = useState(false);
  const [suggestions, setSuggestions] = useState({ products: [], categories: [] });
  const [loading, setLoading] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const [shouldPreventOpen, setShouldPreventOpen] = useState(false);
  const [ignoreFocus, setIgnoreFocus] = useState(false);
  const [isCompletelyDisabled, setIsCompletelyDisabled] = useState(false);
  const [lastSelectedValue, setLastSelectedValue] = useState('');
  const [showHistory, setShowHistory] = useState(false);
  const [hasUserInteracted, setHasUserInteracted] = useState(false);
  const wrapperRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const fetchSuggestions = async () => {

      if (!value || value.length === 0) {
        setSuggestions({ products: [], categories: [] });
        setShowHistory(history.length > 0 && !shouldPreventOpen && !isCompletelyDisabled && hasUserInteracted);
        setIsOpen(history.length > 0 && !shouldPreventOpen && !isCompletelyDisabled && hasUserInteracted);
        setLoading(false);
        return;
      }

      if (value.length < 2) {
        setSuggestions({ products: [], categories: [] });
        setShowHistory(false);
        setIsOpen(false);
        setLoading(false);
        return;
      }

      if (value.toLowerCase() === lastSelectedValue) {
        setShowHistory(false);
        setIsOpen(false);
        setLoading(false);
        return;
      }

      if (shouldPreventOpen || isCompletelyDisabled) {
        setShowHistory(false);
        setIsOpen(false);
        setLoading(false);
        return;
      }

      setShowHistory(false);
      setLoading(true);

      try {

        if (localProducts && Array.isArray(localProducts)) {
          const searchLower = value.toLowerCase().trim();

          let matchedProducts = localProducts
            .filter(p =>
              p.name?.toLowerCase().includes(searchLower) ||
              p.description?.toLowerCase().includes(searchLower) ||
              p.supplier?.name?.toLowerCase().includes(searchLower)
            );

          const uniqueNames = new Map();
          matchedProducts.forEach(product => {
            const name = product.name || '';
            const nameLower = name.toLowerCase();

            if (!uniqueNames.has(nameLower)) {

              uniqueNames.set(nameLower, { ...product, name });
            } else {
              const existing = uniqueNames.get(nameLower);
              const existingPriority = existing.supplier?.priority ?? Infinity;
              const productPriority = product.supplier?.priority ?? Infinity;

              const shouldReplace = 
                (productPriority !== Infinity && existingPriority === Infinity) ||
                (productPriority < existingPriority) ||
                (productPriority === Infinity && existingPriority === Infinity && product.price < existing.price);
              
              if (shouldReplace) {
                uniqueNames.set(nameLower, { ...product, name });
              }
            }
          });

          matchedProducts = Array.from(uniqueNames.values());

          console.log('🔍 Produtos únicos no autocomplete:', matchedProducts.map(p => ({
            name: p.name,
            supplier: p.supplier?.name,
            priority: p.supplier?.priority,
            price: p.price
          })));

          matchedProducts.sort((a, b) => {
            const nameA = a.name?.toLowerCase() || '';
            const nameB = b.name?.toLowerCase() || '';

            const priorityA = a.supplier?.priority ?? Infinity;
            const priorityB = b.supplier?.priority ?? Infinity;
            
            if (priorityA !== priorityB) {
              return priorityA - priorityB;
            }

            const isNumericSearch = /^\d+$/.test(searchLower);
            
            if (isNumericSearch) {

              const isIPhoneA = nameA.includes('iphone') && nameA.includes(searchLower);
              const isIPhoneB = nameB.includes('iphone') && nameB.includes(searchLower);
              
              if (isIPhoneA && !isIPhoneB) return -1;
              if (!isIPhoneA && isIPhoneB) return 1;
            }

            const exactMatchA = nameA === searchLower;
            const exactMatchB = nameB === searchLower;
            if (exactMatchA && !exactMatchB) return -1;
            if (!exactMatchA && exactMatchB) return 1;

            const startsWithA = nameA.startsWith(searchLower);
            const startsWithB = nameB.startsWith(searchLower);
            if (startsWithA && !startsWithB) return -1;
            if (!startsWithA && startsWithB) return 1;

            const searchWords = searchLower.split(/\s+/);
            const wordsA = nameA.split(/\s+/);
            const wordsB = nameB.split(/\s+/);
            const wordMatchCountA = searchWords.filter(word => wordsA.includes(word)).length;
            const wordMatchCountB = searchWords.filter(word => wordsB.includes(word)).length;
            if (wordMatchCountB !== wordMatchCountA) {
              return wordMatchCountB - wordMatchCountA;
            }

            return (a.price || 0) - (b.price || 0);
          });

          console.log('✨ Produtos APÓS ordenação:', matchedProducts.slice(0, 10).map(p => ({
            name: p.name,
            supplier: p.supplier?.name,
            priority: p.supplier?.priority,
            price: p.price
          })));

          matchedProducts = matchedProducts.slice(0, 10);

          const matchedCategories = [...new Set(
            matchedProducts
              .map(p => p.category)
              .filter(Boolean)
          )].slice(0, 5);

          setSuggestions({
            products: matchedProducts,
            categories: matchedCategories
          });
          setIsOpen(true);
          setHighlightedIndex(-1);
          setLoading(false);
        } else {

          const response = await api.get(`/products/autocomplete?q=${encodeURIComponent(value)}`);

          const encryptionService = (await import('@/services/encryption.service')).default;
          const decryptedData = encryptionService.decrypt(response.data.data);
          setSuggestions(decryptedData);
          setIsOpen(true);
          setHighlightedIndex(-1);
          setLoading(false);
        }
      } catch (error) {
        console.error('Erro ao buscar sugestões:', error);
        setSuggestions({ products: [], categories: [] });
        setIsOpen(false);
        setLoading(false);
      }
    };

    const timeoutId = setTimeout(fetchSuggestions, localProducts ? 0 : 300);
    return () => clearTimeout(timeoutId);
  }, [value, shouldPreventOpen, isCompletelyDisabled, lastSelectedValue, history.length, localProducts]);

  const handleKeyDown = (e) => {

    const totalItems = showHistory
      ? history.length
      : suggestions.products.length;

    if (e.key === 'Enter') {
      e.preventDefault();
      if (isOpen && totalItems > 0 && highlightedIndex >= 0) {

        handleSelectByIndex(highlightedIndex);
      } else {

        if (value) {
          addToHistory(value);
        }
        onSelect(value, 'search');
        setIsOpen(false);
        setShowHistory(false);
      }
      return;
    }

    if (!isOpen || totalItems === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setHighlightedIndex((prev) => (prev < totalItems - 1 ? prev + 1 : prev));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : -1));
        break;
      case 'Escape':
        setIsOpen(false);
        setShowHistory(false);
        inputRef.current?.blur();
        break;
      default:
        break;
    }
  };

  const handleSelectByIndex = (index) => {

    if (showHistory) {
      if (index >= 0 && index < history.length) {
        const item = history[index];
        handleHistorySelect(item.term);
      }
      return;
    }

    if (index >= 0 && index < suggestions.products.length) {
      const product = suggestions.products[index];
      handleSelect(product.name, 'product');
      return;
    }
  };

  const handleSelect = (text, type) => {

    if (text && text.trim().length >= 2) {
      addToHistory(text);
    }

    setIsCompletelyDisabled(true);
    setShouldPreventOpen(true);
    setIgnoreFocus(true);
    setIsOpen(false);
    setShowHistory(false);
    setLastSelectedValue(text.toLowerCase());

    inputRef.current?.blur();

    setSuggestions({ products: [], categories: [] });

    onChange(text);
    onSelect(text, type);

  };

  const handleHistorySelect = (term) => {
    handleSelect(term, 'history');
  };

  const handleRemoveHistory = (e, term) => {
    e.stopPropagation();
    removeFromHistory(term);
  };

  const handleClear = () => {
    onChange('');
    setSuggestions({ products: [], categories: [] });
    setShowHistory(false);
    setIsOpen(false);
    setIsCompletelyDisabled(false);
    setShouldPreventOpen(false);
    setIgnoreFocus(false);
    setLastSelectedValue('');
    setHighlightedIndex(-1);
    setHasUserInteracted(false);
    inputRef.current?.focus();

    if (onClear) {
      onClear();
    }
  };

  const hasResults = suggestions.products.length > 0;

  let currentHighlightIndex = 0;

  return (
    <div ref={wrapperRef} className="relative w-full">

      <div className="relative flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 sm:h-5 sm:w-5 text-gray-400 pointer-events-none z-10" />
          <input
            ref={inputRef}
            type="text"
            placeholder="Buscar produtos ou categorias..."
            value={value}
            onChange={(e) => {
              const newValue = e.target.value;

              if (lastSelectedValue && newValue.toLowerCase() !== lastSelectedValue) {
                setIsCompletelyDisabled(false);
                setShouldPreventOpen(false);
                setIgnoreFocus(false);
                setLastSelectedValue('');
              }
              onChange(newValue);
            }}
            onKeyDown={handleKeyDown}
            onFocus={() => {
              if (isCompletelyDisabled || shouldPreventOpen || ignoreFocus) {
                return;
              }

              setHasUserInteracted(true);

              if (!value || value.length === 0) {
                if (history.length > 0) {
                  setShowHistory(true);
                  setIsOpen(true);
                }
                return;
              }

              if (value.length >= 2 && hasResults) {
                setShowHistory(false);
                setIsOpen(true);
              }
            }}
            className="w-full pl-9 sm:pl-10 pr-10 h-10 sm:h-11 text-sm sm:text-base border border-input rounded-xl focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none transition-all duration-200 bg-background text-foreground"
          />
          {loading && (
            <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 animate-spin" />
          )}
          {!loading && value && (
            <button
              onClick={handleClear}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {value && !loading && (
          <button
            onClick={() => {
              onSelect(value, 'search');
              setIsOpen(false);
            }}
            className="flex-shrink-0 px-4 h-10 sm:h-11 bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl transition-colors duration-200 flex items-center gap-2 font-medium text-sm sm:text-base shadow-sm hover:shadow-md"
          >
            <Search className="h-4 w-4" />
            <span className="hidden sm:inline">Buscar</span>
          </button>
        )}
      </div>

      {isOpen && showHistory && history.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden z-50">
          <div className="px-3 py-2 bg-gradient-to-r from-gray-100 to-gray-50 dark:from-gray-700 dark:to-gray-800 border-b border-gray-200 dark:border-gray-600">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wide">
                <Clock className="h-3.5 w-3.5" />
                <span>Histórico de Pesquisas</span>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  clearHistory();
                  setIsOpen(false);
                }}
                className="flex items-center gap-1 px-2 py-1 text-xs text-gray-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
                title="Limpar todo o histórico"
              >
                <Trash2 className="h-3 w-3" />
                <span>Limpar tudo</span>
              </button>
            </div>
          </div>
          <div className="py-1 max-h-[300px] overflow-y-auto">
            {history.map((item, idx) => (
              <button
                key={`history-${idx}`}
                onClick={() => handleHistorySelect(item.term)}
                className={`w-full px-4 py-2.5 text-left hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors flex items-center gap-3 group ${highlightedIndex === idx ? 'bg-gray-50 dark:bg-gray-700' : ''
                  }`}
              >
                <Clock className="h-4 w-4 text-gray-400 flex-shrink-0" />
                <span className="flex-1 text-sm text-gray-700 dark:text-gray-300">
                  {item.term}
                </span>
                <button
                  onClick={(e) => handleRemoveHistory(e, item.term)}
                  className="opacity-0 group-hover:opacity-100 p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded transition-all"
                  title="Remover do histórico"
                >
                  <Trash2 className="h-3.5 w-3.5 text-gray-500 dark:text-gray-400" />
                </button>
              </button>
            ))}
          </div>
          <div className="px-4 py-2 bg-gray-50 dark:bg-gray-900/50 border-t border-gray-100 dark:border-gray-700">
            <div className="flex items-center justify-center gap-4 text-xs text-gray-500 dark:text-gray-400">
              <div className="flex items-center gap-1.5">
                <kbd className="px-2 py-0.5 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded text-xs font-mono shadow-sm">↑↓</kbd>
                <span>Navegar</span>
              </div>
              <div className="flex items-center gap-1.5">
                <kbd className="px-2 py-0.5 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded text-xs font-mono shadow-sm">Enter</kbd>
                <span>Selecionar</span>
              </div>
              <div className="flex items-center gap-1.5">
                <kbd className="px-2 py-0.5 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded text-xs font-mono shadow-sm">Esc</kbd>
                <span>Fechar</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {isOpen && !showHistory && hasResults && (
        <div className="absolute top-full left-0 right-0 z-50 bg-white dark:bg-slate-900 border-x border-b border-slate-200 dark:border-slate-700 rounded-b-xl shadow-lg max-h-64 overflow-y-auto animate-in fade-in slide-in-from-top-2 duration-200" style={{ marginTop: '-1px' }}>

          <div className="px-4 py-3 bg-gradient-to-r from-slate-50 to-slate-100/50 dark:from-slate-800/70 dark:to-slate-900/50 border-b border-slate-200/50 dark:border-slate-700/50 sticky top-0 z-10">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-2 h-2 rounded-full animate-pulse bg-blue-500"></div>
                <span className="text-xs font-bold uppercase tracking-wide text-blue-700 dark:text-blue-400">
                  Sugestões ({new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })})
                </span>
                <div className="px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300">
                  {suggestions.products.length}
                </div>
              </div>
            </div>
          </div>

          <div className="py-2">
            {suggestions.products.length > 0 && suggestions.products.map((product, idx) => {
              const itemIndex = currentHighlightIndex++;
              return (
                <button
                  key={`product-${idx}`}
                  onClick={() => handleSelect(product.name, 'product')}
                  className={`w-full px-4 py-3.5 text-left transition-all duration-200 relative group hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 dark:hover:from-blue-900/20 dark:hover:to-purple-900/20 active:scale-[0.98] active:bg-blue-100 dark:active:bg-blue-900/30 hover:shadow-sm ${highlightedIndex === itemIndex ? 'bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20' : ''
                    }`}
                  style={{ opacity: 1, transform: 'none' }}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className="w-8 h-8 rounded-full flex items-center justify-center transition-all duration-200 bg-blue-100 dark:bg-blue-900/30 group-hover:bg-blue-200 dark:group-hover:bg-blue-800/50">
                        <Search className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <span className="text-sm font-semibold truncate block text-slate-900 dark:text-slate-100 group-hover:text-blue-900 dark:group-hover:text-blue-100">
                          {product.name}
                        </span>
                        {product.category && (
                          <span className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 block">
                            {product.category}
                          </span>
                        )}
                      </div>
                    </div>
                    {product.price && (
                      <div className="px-2.5 py-1 rounded-full text-xs font-medium transition-all duration-200 bg-gradient-to-r from-blue-100 to-purple-100 dark:from-blue-900/40 dark:to-purple-900/40 text-blue-700 dark:text-blue-300 group-hover:from-blue-200 group-hover:to-purple-200 dark:group-hover:from-blue-800/60 dark:group-hover:to-purple-800/60">
                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(product.price)}
                      </div>
                    )}
                  </div>
                </button>
              );
            })}
          </div>

          <div className="sticky bottom-0 px-4 py-3 bg-gradient-to-t from-slate-50 to-transparent dark:from-gray-800 border-t border-gray-100 dark:border-gray-700">
            <div className="flex items-center justify-center gap-2 text-xs text-gray-500 dark:text-gray-400">
              <div className="flex items-center gap-1">
                <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse"></div>
                <div className="w-1.5 h-1.5 rounded-full bg-purple-500 animate-pulse" style={{ animationDelay: '0.2s' }}></div>
                <div className="w-1.5 h-1.5 rounded-full bg-pink-500 animate-pulse" style={{ animationDelay: '0.4s' }}></div>
              </div>
              <span>Toque para selecionar ou continue digitando</span>
            </div>
          </div>
        </div>
      )}

      {isOpen && loading && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden z-50">
          <div className="px-4 py-8 flex flex-col items-center justify-center gap-3">
            <Loader2 className="h-8 w-8 text-blue-500 animate-spin" />
            <span className="text-sm text-gray-500 dark:text-gray-400">Buscando sugestões...</span>
          </div>
        </div>
      )}

      {isOpen && !loading && !hasResults && value.length >= 2 && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden z-50">
          <div className="px-4 py-8 flex flex-col items-center justify-center gap-3">
            <div className="h-12 w-12 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
              <Search className="h-6 w-6 text-gray-400" />
            </div>
            <div className="text-center">
              <p className="text-sm font-medium text-gray-900 dark:text-white">Nenhum resultado encontrado</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Tente buscar com outros termos
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SearchAutocomplete;
