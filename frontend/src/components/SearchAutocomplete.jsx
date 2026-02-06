import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { Search, Smartphone, Tag, Loader2, X, Clock, Trash2 } from 'lucide-react';
import api from '../lib/axios';
import { useAuth } from '../contexts/AuthContext';
import { useSearchHistory } from '../hooks/useSearchHistory';

const placeholderTexts = [
  "Buscar iPhone 16 Pro Max...",
  "Buscar iPhone 16 Pro...",
  "Buscar Macbook Air M4...",
  "Buscar iPad Pro...",
];

const categoryBadges = [
  { label: "Apple", icon: "🍎", searchTerms: ["ACSS", "IPD", "IPH", "MCB", "MNTR", "PODS", "RLG"] },
  { label: "Android", icon: "🤖", searchTerms: ["MI", "NOTE", "PAD", "POCO", "RDM", "REAL"] },
];

const SearchAutocomplete = ({ value, onChange, onSelect, onClear, onCategorySelect, localProducts = null }) => {
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
  const [isFocused, setIsFocused] = useState(false);
  const [placeholderIdx, setPlaceholderIdx] = useState(0);
  const [displayPlaceholder, setDisplayPlaceholder] = useState("");
  const [badgesVisible, setBadgesVisible] = useState([]);
  const wrapperRef = useRef(null);
  const inputRef = useRef(null);
  const searchBoxRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Typing placeholder animation
  useEffect(() => {
    if (isFocused || value.length > 0) return;

    const fullText = placeholderTexts[placeholderIdx];
    let charIdx = 0;
    let deleting = false;
    let timeout;

    const tick = () => {
      if (!deleting) {
        charIdx++;
        setDisplayPlaceholder(fullText.substring(0, charIdx));
        if (charIdx === fullText.length) {
          timeout = setTimeout(() => { deleting = true; tick(); }, 2000);
          return;
        }
        timeout = setTimeout(tick, 60 + Math.random() * 40);
      } else {
        charIdx--;
        setDisplayPlaceholder(fullText.substring(0, charIdx));
        if (charIdx === 0) {
          setPlaceholderIdx(prev => (prev + 1) % placeholderTexts.length);
          return;
        }
        timeout = setTimeout(tick, 30);
      }
    };

    timeout = setTimeout(tick, 500);
    return () => clearTimeout(timeout);
  }, [placeholderIdx, isFocused, value]);

  // Animate category badges
  useEffect(() => {
    categoryBadges.forEach((_, i) => {
      setTimeout(() => setBadgesVisible(v => [...v, i]), 300 + i * 100);
    });
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

      {/* Search Container */}
      <div className="relative">
        {/* Glow effect */}
        <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[90%] h-full rounded-2xl pointer-events-none transition-all duration-500 ${
          isFocused ? 'w-[105%] h-[140%] bg-primary/10' : ''
        }`} />

        {/* Search Box */}
        <div
          ref={searchBoxRef}
          className={`relative w-full bg-white dark:bg-neutral-900 rounded-2xl border-2 transition-all duration-300 ${
            isFocused
              ? 'border-primary shadow-lg shadow-primary/20 -translate-y-0.5'
              : 'border-neutral-200 dark:border-neutral-700 shadow-sm hover:border-neutral-300 dark:hover:border-neutral-600'
          }`}
        >
          {/* Shimmer effect */}
          {isFocused && (
            <div className="absolute inset-[-2px] rounded-2xl bg-gradient-to-r from-transparent via-primary/20 to-transparent bg-[length:200%_100%] animate-shimmer -z-10" />
          )}

          <div className="flex items-center px-4 lg:px-5 py-1 gap-3">
            {/* Search Icon */}
            <div className="relative flex-shrink-0">
              <Search className={`w-5 h-5 transition-all duration-300 ${
                isFocused ? 'text-primary scale-110 -rotate-6' : 'text-neutral-400'
              }`} />
              {isFocused && (
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-6 h-6 rounded-full border-2 border-primary/40 animate-ping" />
              )}
            </div>

            {/* Input */}
            <div className="flex-1 relative">
              <input
                ref={inputRef}
                type="text"
                className="w-full py-3 lg:py-4 text-base text-neutral-900 dark:text-white bg-transparent outline-none placeholder:text-neutral-400"
                placeholder={value.length === 0 && !isFocused ? "" : "Buscar produto, modelo ou fornecedor..."}
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
                  setIsFocused(true);
                  if (isCompletelyDisabled || shouldPreventOpen || ignoreFocus) return;
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
                onBlur={() => setIsFocused(false)}
              />
              {/* Animated placeholder */}
              {value.length === 0 && !isFocused && (
                <div className="absolute top-1/2 left-0 -translate-y-1/2 text-neutral-400 text-base pointer-events-none flex items-center">
                  {displayPlaceholder}
                  <span className="inline-block w-0.5 h-[18px] bg-neutral-400 ml-0.5 animate-blink" />
                </div>
              )}
            </div>

            {/* Keyboard hint */}
            {!isFocused && !value && (
              <div className="hidden sm:flex items-center gap-1 flex-shrink-0 mr-1">
                <span className="bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-md px-2 py-0.5 text-[11px] text-neutral-400 font-medium">⌘</span>
                <span className="bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-md px-2 py-0.5 text-[11px] text-neutral-400 font-medium">K</span>
              </div>
            )}

            {/* Loading */}
            {loading && (
              <Loader2 className="flex-shrink-0 h-4 w-4 text-neutral-400 animate-spin" />
            )}

            {/* Clear button */}
            {!loading && value && (
              <button
                onClick={handleClear}
                className="flex-shrink-0 p-1.5 text-neutral-400 hover:text-neutral-600 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Category Badges */}
      <div className="flex gap-2 flex-wrap mt-3 justify-start">
        {categoryBadges.map((cat, i) => (
          <button
            key={i}
            className={`flex items-center gap-1.5 px-3 lg:px-4 py-2 bg-white dark:bg-neutral-900 rounded-full border border-neutral-200 dark:border-neutral-700 text-sm font-medium text-neutral-600 dark:text-neutral-400 transition-all duration-300 hover:border-primary hover:text-primary hover:bg-primary/5 hover:-translate-y-0.5 hover:shadow-md hover:shadow-primary/10 active:translate-y-0 active:scale-[0.98] ${
              badgesVisible.includes(i) ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'
            }`}
            style={{ transitionDelay: `${i * 50}ms` }}
            onClick={() => {
              if (onCategorySelect) {
                onCategorySelect(cat.searchTerms);
              }
            }}
          >
            <span className="text-sm">{cat.icon}</span>
            {cat.label}
          </button>
        ))}
      </div>

      {isOpen && showHistory && history.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-neutral-900 rounded-2xl shadow-2xl border border-neutral-200 dark:border-neutral-700 overflow-hidden z-50">
          <div className="p-4 pb-2 border-b border-neutral-100 dark:border-neutral-800">
            <div className="flex items-center justify-between">
              <div className="text-[11px] font-semibold uppercase tracking-wider text-neutral-400">
                Buscas recentes
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  clearHistory();
                  setIsOpen(false);
                }}
                className="flex items-center gap-1 px-2 py-1 text-xs text-neutral-400 hover:text-red-500 rounded transition-colors"
                title="Limpar todo o histórico"
              >
                <Trash2 className="h-3 w-3" />
                <span>Limpar</span>
              </button>
            </div>
          </div>
          <div className="p-2 max-h-[300px] overflow-y-auto">
            {history.map((item, idx) => (
              <div
                key={`history-${idx}`}
                onClick={() => handleHistorySelect(item.term)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer transition-all duration-200 group ${highlightedIndex === idx ? 'bg-primary/10 translate-x-1' : 'hover:bg-neutral-50 dark:hover:bg-neutral-800 hover:translate-x-1'
                  }`}
              >
                <div className="w-8 h-8 rounded-lg bg-amber-50 dark:bg-amber-900/30 flex items-center justify-center text-amber-500 flex-shrink-0">
                  <Clock className="w-3.5 h-3.5" />
                </div>
                <span className="flex-1 text-sm text-neutral-700 dark:text-neutral-300">
                  {item.term}
                </span>
                <button
                  onClick={(e) => handleRemoveHistory(e, item.term)}
                  className="opacity-0 group-hover:opacity-100 p-1 hover:bg-neutral-200 dark:hover:bg-neutral-700 rounded-lg transition-all"
                  title="Remover do histórico"
                >
                  <X className="h-3.5 w-3.5 text-neutral-400" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {isOpen && !showHistory && hasResults && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-neutral-900 rounded-2xl shadow-2xl border border-neutral-200 dark:border-neutral-700 overflow-hidden z-50 max-h-[70vh] overflow-y-auto">
          <div className="p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="text-[11px] font-semibold uppercase tracking-wider text-neutral-400">
                Resultados
              </div>
              <div className="text-[11px] px-2.5 py-0.5 rounded-full bg-neutral-100 dark:bg-neutral-800 text-neutral-500 dark:text-neutral-400 font-medium">
                {suggestions.products.length}
              </div>
            </div>
            {suggestions.products.map((product, idx) => {
              const itemIndex = currentHighlightIndex++;
              return (
                <div
                  key={`product-${idx}`}
                  onClick={() => handleSelect(product.name, 'product')}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer transition-all duration-200 group ${
                    highlightedIndex === itemIndex ? 'bg-primary/10 translate-x-1' : 'hover:bg-neutral-50 dark:hover:bg-neutral-800 hover:translate-x-1'
                  }`}
                >
                  <div className="w-8 h-8 rounded-lg bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center text-neutral-500 flex-shrink-0">
                    <Search className="w-3.5 h-3.5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="text-sm text-neutral-700 dark:text-neutral-300 truncate block">
                      {product.name}
                    </span>
                    {product.category && (
                      <span className="text-[11px] text-neutral-400 mt-0.5 block">
                        {product.category}
                      </span>
                    )}
                  </div>
                  {product.price && (
                    <div className="text-[11px] px-2.5 py-1 rounded-full bg-neutral-100 dark:bg-neutral-800 text-neutral-500 dark:text-neutral-400 font-medium flex-shrink-0">
                      {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(product.price)}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {isOpen && loading && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-neutral-900 rounded-2xl shadow-2xl border border-neutral-200 dark:border-neutral-700 overflow-hidden z-50">
          <div className="px-4 py-8 flex flex-col items-center justify-center gap-3">
            <Loader2 className="h-8 w-8 text-primary animate-spin" />
            <span className="text-sm text-neutral-400">Buscando sugestões...</span>
          </div>
        </div>
      )}

      {isOpen && !loading && !hasResults && value.length >= 2 && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-neutral-900 rounded-2xl shadow-2xl border border-neutral-200 dark:border-neutral-700 overflow-hidden z-50">
          <div className="p-6 text-center">
            <span className="text-2xl block mb-2">🔍</span>
            <p className="text-neutral-400 text-sm">
              Nenhum resultado para "<span className="text-neutral-600 dark:text-neutral-300 font-medium">{value}</span>"
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default SearchAutocomplete;
