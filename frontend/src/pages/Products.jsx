import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { api, useAuth } from '../contexts/AuthContext';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Loader2, Search, Filter, X, Smartphone, Building, DollarSign, TrendingDown, Wifi, Clock, UserPlus, Bug, RefreshCw, Calendar, ChevronDown, Cable, Tablet, Watch, Headphones, Laptop } from 'lucide-react';
import MultiSelectFilter from '@/components/MultiSelectFilter';
import SuppliersModal from '@/components/SuppliersModal';
import SearchAutocomplete from '@/components/SearchAutocomplete';
import DateFilter from '@/components/DateFilter';
import PartnerBanner from '@/components/PartnerBanner';
import { getOfficialColors, categorizeColors, formatColorName, normalizeColorForDB } from '@/data/productColors';
import encryptionService from '@/services/encryption.service';
import useDollarRate from '@/hooks/useDollarRate';

const Products = () => {
  const { user } = useAuth();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const getTodayDDMM = () => {
    const today = new Date();
    const day = String(today.getDate()).padStart(2, '0');
    const month = String(today.getMonth() + 1).padStart(2, '0');
    return `${day}-${month}`;
  };

  const isToday = (date) => {
    return date === getTodayDDMM();
  };

  const [selectedDate, setSelectedDate] = useState(getTodayDDMM());
  const [debouncedDate, setDebouncedDate] = useState(getTodayDDMM());
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [showSuppliersModal, setShowSuppliersModal] = useState(false);

  const [page, setPage] = useState(1);
  const [totalProducts, setTotalProducts] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const [totalSuppliers, setTotalSuppliers] = useState(0);

  const { 
    dollarRate: liveDollarRate, 
    dollarVariation: liveDollarVariation, 
    isConnected: isDollarConnected,
    lastUpdate: dollarLastUpdate 
  } = useDollarRate();

  const [backendDollarRate, setBackendDollarRate] = useState(0);
  const [backendDollarVariation, setBackendDollarVariation] = useState(0);

  const dollarRate = liveDollarRate !== null ? liveDollarRate : backendDollarRate;
  const dollarVariation = liveDollarRate !== null ? liveDollarVariation : backendDollarVariation;

  const fetchProductsRef = useRef(null);

  const [totalUniqueProducts, setTotalUniqueProducts] = useState(0);
  const [totalUniqueSuppliers, setTotalUniqueSuppliers] = useState(0);

  const [selectedCategories, setSelectedCategories] = useState([]);
  const [selectedColors, setSelectedColors] = useState([]);
  const [selectedStorages, setSelectedStorages] = useState([]);
  const [selectedRegions, setSelectedRegions] = useState([]);
  const [selectedSuppliers, setSelectedSuppliers] = useState([]);

  const [debouncedCategories, setDebouncedCategories] = useState([]);
  const [debouncedColors, setDebouncedColors] = useState([]);
  const [debouncedStorages, setDebouncedStorages] = useState([]);
  const [debouncedRegions, setDebouncedRegions] = useState([]);
  const [debouncedSuppliers, setDebouncedSuppliers] = useState([]);

  const [dateSort, setDateSort] = useState('newest');
  const [showFilters, setShowFilters] = useState(true);

  const [categories, setCategories] = useState([]);
  const [colors, setColors] = useState([]);
  const [unavailableColors, setUnavailableColors] = useState([]);
  const [storages, setStorages] = useState([]);
  const [regions, setRegions] = useState([]);
  const [suppliers, setSuppliers] = useState({ updated: [], outdated: [] });

  const prevSearchTermRef = useRef('');

  const getProductTypePriority = (productName) => {
    if (!productName) return 4;
    const nameLower = productName.toLowerCase();

    if (nameLower.includes('lacrado') || nameLower.includes('lacrada') || nameLower.includes('novo lacrado')) {
      return 1;
    }

    if (nameLower.includes('asis') || nameLower.includes('as is') || nameLower.includes('as-is')) {
      return 2;
    }

    if (nameLower.includes('semi novo') || nameLower.includes('semi-novo') || nameLower.includes('seminovo') || 
        nameLower.includes('usado') || nameLower.includes('vitrine')) {
      return 3;
    }

    return 4;
  };

  const formatCurrency = (value) => {
    if (value === undefined || value === null) return '-';
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 2,
    }).format(Number(value));
  };

  const getCategoryIcon = (category, productName = '', className = "h-4 w-4") => {
    const categoryUpper = (category || '').toUpperCase();
    const nameUpper = (productName || '').toUpperCase();

    if (categoryUpper === 'IPH' || categoryUpper.includes('IPHONE') || nameUpper.includes('IPHONE')) {
      return <Smartphone className={`${className} text-blue-500`} />;
    }

    if (categoryUpper === 'IPD' || categoryUpper.includes('IPAD') || nameUpper.includes('IPAD')) {
      return <Tablet className={`${className} text-purple-500`} />;
    }

    if (categoryUpper === 'MAC' || categoryUpper.includes('MACBOOK') || categoryUpper.includes('IMAC') || 
        nameUpper.includes('MACBOOK') || nameUpper.includes('IMAC')) {
      return <Laptop className={`${className} text-purple-600 dark:text-purple-400`} />;
    }

    if (categoryUpper === 'AWA' || categoryUpper.includes('WATCH') || nameUpper.includes('WATCH')) {
      return <Laptop className={`${className} text-purple-600 dark:text-purple-400`} />;
    }

    if (categoryUpper === 'AIR' || categoryUpper.includes('AIRPOD') || categoryUpper.includes('PODS') || 
        nameUpper.includes('AIRPOD') || nameUpper.includes('PODS')) {
      return <Headphones className={`${className} text-indigo-500`} />;
    }

    return <Cable className={`${className} text-amber-600`} />;
  };

  const getColorHex = (colorName) => {
    if (!colorName) return '#888888';

    const colorMap = {

      'preto': '#000000',
      'branco': '#FFFFFF',
      'cinza': '#808080',
      'vermelho': '#FF0000',
      'azul': '#0000FF',
      'verde': '#00FF00',
      'amarelo': '#FFFF00',
      'laranja': '#FFA500',
      'rosa': '#FFC0CB',
      'roxo': '#800080',
      'violeta': '#EE82EE',
      'marrom': '#8B4513',
      'bege': '#F5F5DC',
      'dourado': '#FFD700',
      'prateado': '#C0C0C0',
      'prata': '#C0C0C0',

      'black': '#000000',
      'white': '#FFFFFF',
      'gray': '#808080',
      'grey': '#808080',
      'red': '#FF0000',
      'blue': '#0000FF',
      'green': '#00FF00',
      'yellow': '#FFFF00',
      'orange': '#FFA500',
      'pink': '#FFC0CB',
      'purple': '#800080',
      'violet': '#EE82EE',
      'brown': '#8B4513',
      'beige': '#F5F5DC',
      'gold': '#FFD700',
      'silver': '#C0C0C0',

      'midnight': '#191970',
      'graphite': '#383838',
      'titanium': '#878681',
      'starlight': '#F5F5DC',
      'sierra blue': '#69ABCE',
      'alpine green': '#4A5D51',
      'space gray': '#71706E',
      'rose gold': '#B76E79',
      'ultramarine': '#4166F5',
      'teal': '#5FBAA7',
      'desert titanium': '#9C8A7A',
      'lavender': '#E6E6FA',
      'sage': '#9DC183',
      'mist blue': '#B0C4DE',
    };

    const colorLower = colorName.toLowerCase().trim();

    if (colorMap[colorLower]) {
      return colorMap[colorLower];
    }

    for (const [key, value] of Object.entries(colorMap)) {
      if (colorLower.includes(key) || key.includes(colorLower)) {
        return value;
      }
    }

    return null;
  };

  const isLowestPrice = (product, productsList) => {
    const similarProducts = productsList.filter(p =>
      p.name === product.name &&
      p.category === product.category &&
      p.storage === product.storage &&
      p.color === product.color &&
      p.price !== null &&
      p.price !== undefined
    );

    if (similarProducts.length <= 1) return false;

    const lowestPrice = Math.min(...similarProducts.map(p => Number(p.price)));

    return Number(product.price) === lowestPrice;
  };

  const getWhatsAppUrl = (product) => {
    if (!product.supplier?.whatsappNumber) return '#';

    const phoneNumber = product.supplier.whatsappNumber.replace(/\D/g, '');
    const productName = `${product.name} ${product.storage || ''} ${product.color || ''}`.trim();
    const priceFormatted = formatCurrency(product.price);
    const message = `Olá! Vi o produto no *Buscador PXT* e gostaria de saber se tem disponível: ${productName} ${priceFormatted}`;

    return `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;
  };

  const handleWhatsAppClick = async (product) => {
    const whatsappUrl = getWhatsAppUrl(product);
    
    // Registrar clique de forma assíncrona sem bloquear
    api.post('/supplier-clicks/register', {
      supplierId: product.supplier?.id,
      productId: product.id,
      sessionInfo: {
        productName: product.name,
        productCode: product.code,
        price: product.price,
        timestamp: new Date().toISOString(),
      },
    }).catch(error => {
      console.error('Erro ao registrar clique:', error);
    });
    
    const link = document.createElement('a');
    link.href = whatsappUrl;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const isSupplierContactDisabled = () => {
    const disabled = user?.plan?.disableSupplierContact === true || user?.plan?.hideSupplier === true;
    console.log('isSupplierContactDisabled:', {
      hasUser: !!user,
      hasPlan: !!user?.plan,
      disableSupplierContact: user?.plan?.disableSupplierContact,
      hideSupplier: user?.plan?.hideSupplier,
      result: disabled
    });
    return disabled;
  };

  const isSupplierHidden = () => {
    return user?.plan?.hideSupplier === true;
  };

  useEffect(() => {
    setDebouncedSearchTerm(searchTerm);
  }, [searchTerm]);

  useEffect(() => {
    prevSearchTermRef.current = searchTerm;
  }, []);

  useEffect(() => {
    setDebouncedCategories(selectedCategories);
  }, [selectedCategories]);

  useEffect(() => {

    const normalizedColors = selectedColors.map(normalizeColorForDB);
    console.log('🎨 Colors Debug:', {
      selectedColors,
      normalizedColors,
      willSetDebouncedColors: normalizedColors
    });
    setDebouncedColors(normalizedColors);
  }, [selectedColors]);

  useEffect(() => {
    setDebouncedStorages(selectedStorages);
  }, [selectedStorages]);

  useEffect(() => {
    setDebouncedRegions(selectedRegions);
  }, [selectedRegions]);

  useEffect(() => {
    setDebouncedSuppliers(selectedSuppliers);
  }, [selectedSuppliers]);

  useEffect(() => {
    setDebouncedDate(selectedDate);
  }, [selectedDate]);

  useEffect(() => {
    const prevSearchTerm = prevSearchTermRef.current;
    const currentSearchTerm = searchTerm;

    console.log('🔍 SearchTerm changed:', {
      prevSearchTerm: `"${prevSearchTerm}"`,
      currentSearchTerm: `"${currentSearchTerm}"`,
      willClearFilters: prevSearchTerm !== '' && currentSearchTerm === ''
    });

    if (prevSearchTerm !== '' && currentSearchTerm === '') {
      const hasActiveFilters = selectedCategories.length > 0 ||
        selectedColors.length > 0 ||
        selectedStorages.length > 0 ||
        selectedRegions.length > 0 ||
        selectedSuppliers.length > 0;

      console.log('🧹 Limpando filtros automaticamente - usuário limpou o campo de busca', {
        prevSearchTerm,
        currentSearchTerm,
        hasActiveFilters,
        activeFilters: {
          categories: selectedCategories.length,
          colors: selectedColors.length,
          storages: selectedStorages.length,
          regions: selectedRegions.length,
          suppliers: selectedSuppliers.length
        }
      });

      setSelectedCategories([]);
      setSelectedColors([]);
      setSelectedStorages([]);
      setSelectedRegions([]);
      setSelectedSuppliers([]);

      setDebouncedCategories([]);
      setDebouncedColors([]);
      setDebouncedStorages([]);
      setDebouncedRegions([]);
      setDebouncedSuppliers([]);
      setDebouncedSearchTerm('');
      setPage(1);
    }

    prevSearchTermRef.current = currentSearchTerm;
  }, [searchTerm]);

  const executeSearch = useCallback((searchText) => {
    setDebouncedSearchTerm(searchText);
    setPage(1);
  }, []);

  const sortProductsByFilters = useCallback((products, filters) => {
    const { categories, colors, storages, regions, suppliers } = filters;

    console.log('🔄 sortProductsByFilters called with:', {
      totalProducts: products.length,
      filters: {
        categories: categories.length,
        colors: colors.length,
        storages: storages.length,
        regions: regions.length,
        suppliers: suppliers.length
      },
      colorFilters: colors
    });

    if (categories.length === 0 && colors.length === 0 &&
      storages.length === 0 && regions.length === 0 && suppliers.length === 0) {
      console.log('📍 No filters selected, returning original order');
      return products;
    }

    return [...products].sort((a, b) => {

      const priorityA = a.supplier?.priority ?? Infinity;
      const priorityB = b.supplier?.priority ?? Infinity;
      
      if (priorityA !== priorityB) {
        return priorityA - priorityB;
      }

      const typePriorityA = getProductTypePriority(a.name);
      const typePriorityB = getProductTypePriority(b.name);
      
      if (typePriorityA !== typePriorityB) {
        return typePriorityA - typePriorityB;
      }

      let scoreA = 0;
      let scoreB = 0;

      if (categories.length > 0) {
        if (categories.includes(a.category)) scoreA++;
        if (categories.includes(b.category)) scoreB++;
      }

      if (colors.length > 0) {

        const normalizedProductColorA = normalizeColorForDB(a.color);
        const normalizedProductColorB = normalizeColorForDB(b.color);

        const matchA = colors.includes(normalizedProductColorA);
        const matchB = colors.includes(normalizedProductColorB);

        if (matchA) scoreA++;
        if (matchB) scoreB++;

        if (products.indexOf(a) < 3 || products.indexOf(b) < 3) {
          console.log('🎨 Color Match Debug:', {
            productA: { name: a.name, originalColor: a.color, normalizedColor: normalizedProductColorA, match: matchA },
            productB: { name: b.name, originalColor: b.color, normalizedColor: normalizedProductColorB, match: matchB },
            filterColors: colors,
            scores: { scoreA, scoreB }
          });
        }
      }

      if (storages.length > 0) {
        if (storages.includes(a.storage)) scoreA++;
        if (storages.includes(b.storage)) scoreB++;
      }

      if (regions.length > 0) {
        if (regions.includes(a.region)) scoreA++;
        if (regions.includes(b.region)) scoreB++;
      }

      if (suppliers.length > 0 && a.supplier && b.supplier) {
        if (suppliers.includes(a.supplier.name)) scoreA++;
        if (suppliers.includes(b.supplier.name)) scoreB++;
      }

      if (scoreB !== scoreA) {
        return scoreB - scoreA;
      }

      return (a.price || 0) - (b.price || 0);
    });
  }, []);

  const fetchProducts = useCallback(async (options = {}) => {
    const { silent = false } = options;

    if (!silent) {
      setLoading(true);
    }

    try {
      const params = new URLSearchParams();

      if (debouncedDate) {
        params.append('date', debouncedDate);
      }

      const url = `/products?${params.toString()}`;
      console.log('🌐 HTTP REQUEST → Backend:', {
        url,
        fullUrl: api.defaults.baseURL + url,
        reason: 'Data filter changed',
        date: debouncedDate
      });
      const response = await api.get(url);

      let payload;
      try {
        const maybeEncrypted = response.data?.data ?? response.data;
        if (typeof maybeEncrypted === 'string') {

          payload = encryptionService.decrypt(maybeEncrypted);
        } else {

          payload = maybeEncrypted;
        }
      } catch (err) {
        console.error('Erro ao processar resposta (decrypt fallback):', err, { raw: response.data });

        payload = response.data;
      }

      let products = [];
      let total = 0;
      let backendTotalSuppliers = 0;
      let backendDollarRate = 0;
      let backendDollarVariation = 0;

      if (Array.isArray(payload)) {
        products = payload;
        total = payload.length;
      } else if (payload) {
        if (Array.isArray(payload.data)) {
          products = payload.data;
          total = payload.total ?? payload.data.length;
          backendTotalSuppliers = payload.totalSuppliers ?? 0;
          backendDollarRate = payload.dollarRate ?? 0;
          backendDollarVariation = payload.dollarVariation ?? 0;
        } else if (Array.isArray(payload.products)) {
          products = payload.products;
          total = payload.total ?? payload.products.length;
          backendTotalSuppliers = payload.totalSuppliers ?? 0;
          backendDollarRate = payload.dollarRate ?? 0;
          backendDollarVariation = payload.dollarVariation ?? 0;
        } else {

          console.warn('Resposta inesperada do backend (normalize):', payload);
          products = Array.isArray(payload.items) ? payload.items : [];
          total = payload.total ?? payload.count ?? products.length;
          backendTotalSuppliers = payload.totalSuppliers ?? 0;
        }
      }

      console.log('Normalized response:', { productsCount: products.length, total, backendTotalSuppliers, backendDollarRate, backendDollarVariation });

      const safeProducts = Array.isArray(products) ? products : [];

      console.log('🔍 Filter Debug:', {
        debouncedColors,
        selectedColors,
        receivedProducts: safeProducts.slice(0, 5).map(p => ({ name: p.name, color: p.color }))
      });

      setProducts(safeProducts);
      setTotalProducts(total);

      const calculatedTotalPages = Math.ceil(total / itemsPerPage);
      setTotalPages(calculatedTotalPages);

      setTotalSuppliers(backendTotalSuppliers || 0);
      setBackendDollarRate(backendDollarRate || 0);
      setBackendDollarVariation(backendDollarVariation || 0);

      console.log('Pagination status:', {
        totalProducts: total,
        itemsPerPage,
        totalPages: calculatedTotalPages,
        hasData: products?.length > 0
      });

    } catch (error) {
      console.error('Erro ao buscar produtos:', error);
      setProducts([]);
    } finally {

      if (!options?.silent) {
        setLoading(false);
      }
    }
  }, [debouncedCategories, debouncedColors, debouncedStorages, debouncedRegions, debouncedSuppliers, debouncedSearchTerm, debouncedDate, itemsPerPage]);

  useEffect(() => {
    fetchProductsRef.current = fetchProducts;
  }, [fetchProducts]);

  const fetchStats = useCallback(async () => {
    try {
      const response = await api.get('/products/stats');
      const { totalProducts, totalSuppliers } = response.data;
      setTotalUniqueProducts(totalProducts || 0);
      setTotalUniqueSuppliers(totalSuppliers || 0);
    } catch (error) {
      console.error('Erro ao buscar estatísticas:', error);
    }
  }, []);

  const calculateFilterOptions = useCallback(() => {
    console.log('📊 Calculando opções de filtro localmente...', {
      totalProducts: products.length,
      activeFilters: {
        search: debouncedSearchTerm,
        categories: debouncedCategories.length,
        colors: debouncedColors.length,
        storages: debouncedStorages.length,
        regions: debouncedRegions.length,
        suppliers: debouncedSuppliers.length
      }
    });

    const applyFiltersExcept = (excludeType) => {
      let filtered = [...products];

      if (debouncedSearchTerm) {
        const searchLower = debouncedSearchTerm.toLowerCase();
        
        const exactMatches = filtered.filter(product =>
          product.name?.toLowerCase() === searchLower
        );
        
        if (exactMatches.length > 0) {
          filtered = exactMatches;
        } else {
          filtered = filtered.filter(product =>
            product.name?.toLowerCase().includes(searchLower) ||
            product.description?.toLowerCase().includes(searchLower) ||
            product.supplier?.name?.toLowerCase().includes(searchLower)
          );
        }
      }

      if (excludeType !== 'category' && debouncedCategories.length > 0) {
        filtered = filtered.filter(product =>
          debouncedCategories.some(cat => cat?.toLowerCase() === product.category?.toLowerCase())
        );
      }

      if (excludeType !== 'color' && debouncedColors.length > 0) {
        filtered = filtered.filter(product =>
          debouncedColors.some(color => color?.toLowerCase() === product.color?.toLowerCase())
        );
      }

      if (excludeType !== 'storage' && debouncedStorages.length > 0) {
        filtered = filtered.filter(product =>
          debouncedStorages.some(storage => storage?.toLowerCase() === product.storage?.toLowerCase())
        );
      }

      if (excludeType !== 'region' && debouncedRegions.length > 0) {
        filtered = filtered.filter(product =>
          debouncedRegions.includes(product.region)
        );
      }

      if (excludeType !== 'supplier' && debouncedSuppliers.length > 0) {
        filtered = filtered.filter(product =>
          debouncedSuppliers.includes(product.supplier?.name)
        );
      }

      return filtered;
    };

    const filteredForCategories = applyFiltersExcept('category');
    const filteredForColors = applyFiltersExcept('color');
    const filteredForStorages = applyFiltersExcept('storage');
    const filteredForRegions = applyFiltersExcept('region');
    const filteredForSuppliers = applyFiltersExcept('supplier');

    console.log('📋 Produtos disponíveis para cada filtro:', {
      categories: filteredForCategories.length,
      colors: filteredForColors.length,
      storages: filteredForStorages.length,
      regions: filteredForRegions.length,
      suppliers: filteredForSuppliers.length
    });

    const cats = [...new Set(filteredForCategories.map(p => p.category).filter(Boolean))].sort();
    const cols = [...new Set(filteredForColors.map(p => p.color).filter(Boolean))].sort();
    const stors = [...new Set(filteredForStorages.map(p => p.storage).filter(Boolean))].sort();
    const regs = [...new Set(filteredForRegions.map(p => p.region).filter(Boolean))].sort();

    const suppliersData = filteredForSuppliers.reduce((acc, p) => {
      if (p.supplier?.name) {
        const isUpdated = p.supplier.isUpdated !== false;
        if (isUpdated) {
          acc.updated.add(p.supplier.name);
        } else {
          acc.outdated.add(p.supplier.name);
        }
      }
      return acc;
    }, { updated: new Set(), outdated: new Set() });

    const sups = {
      updated: Array.from(suppliersData.updated).sort(),
      outdated: Array.from(suppliersData.outdated).sort()
    };

    console.log('✅ Opções calculadas (independentes):', {
      categories: cats.length,
      colors: cols.length,
      storages: stors.length,
      regions: regs.length,
      suppliersCount: sups.updated.length + sups.outdated.length
    });

    const ensureSelectedInList = (list, selectedArray) => {
      const allValues = new Set([...list, ...selectedArray]);
      return Array.from(allValues).sort();
    };

    const ensureSelectedColorsInList = (list, selectedArray) => {
      const formattedList = list.map(formatColorName);
      const formattedSelected = selectedArray.map(formatColorName);
      const allValues = new Set([...formattedList, ...formattedSelected]);
      return Array.from(allValues).sort();
    };

    setCategories(ensureSelectedInList(cats, selectedCategories));

    const finalColors = ensureSelectedColorsInList(cols, selectedColors);
    
    setColors(finalColors);
    setUnavailableColors([]);

    setStorages(ensureSelectedInList(stors, selectedStorages));
    setRegions(ensureSelectedInList(regs, selectedRegions));

    const ensuredSuppliers = {
      updated: ensureSelectedInList(sups.updated, selectedSuppliers.filter(s => sups.updated.includes(s))),
      outdated: ensureSelectedInList(sups.outdated, selectedSuppliers.filter(s => sups.outdated.includes(s))),
    };
    setSuppliers(ensuredSuppliers);
  }, [
    products,
    debouncedSearchTerm,
    debouncedCategories,
    debouncedColors,
    debouncedStorages,
    debouncedRegions,
    debouncedSuppliers,
    selectedCategories,
    selectedColors,
    selectedStorages,
    selectedRegions,
    selectedSuppliers
  ]);

  useEffect(() => {
    console.log('📅 Date changed, fetching products from backend:', debouncedDate);
    setPage(1);
    fetchProducts();

  }, [debouncedDate]);

  useEffect(() => {
    if (products.length > 0) {
      calculateFilterOptions();
    }

  }, [
    products,
    debouncedSearchTerm,
    debouncedCategories,
    debouncedColors,
    debouncedStorages,
    debouncedRegions,
    debouncedSuppliers
  ]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  useEffect(() => {
    console.log('🔄 Aplicando filtros localmente...', {
      totalProducts: products.length,
      filters: {
        search: debouncedSearchTerm,
        categories: debouncedCategories.length,
        colors: debouncedColors.length,
        storages: debouncedStorages.length,
        regions: debouncedRegions.length,
        suppliers: debouncedSuppliers.length
      }
    });

    let filtered = [...products];

    if (debouncedSearchTerm) {
      const searchLower = debouncedSearchTerm.toLowerCase();
      filtered = filtered.filter(product =>
        product.name?.toLowerCase().includes(searchLower) ||
        product.description?.toLowerCase().includes(searchLower) ||
        product.supplier?.name?.toLowerCase().includes(searchLower)
      );
    }

    if (debouncedCategories.length > 0) {
      filtered = filtered.filter(product =>
        debouncedCategories.some(cat =>
          product.category?.toLowerCase() === cat?.toLowerCase()
        )
      );
    }

    if (debouncedColors.length > 0) {
      filtered = filtered.filter(product =>
        debouncedColors.some(color =>
          product.color?.toLowerCase() === color?.toLowerCase()
        )
      );
    }

    if (debouncedStorages.length > 0) {
      filtered = filtered.filter(product =>
        debouncedStorages.some(storage =>
          product.storage?.toLowerCase() === storage?.toLowerCase()
        )
      );
    }

    if (debouncedRegions.length > 0) {
      filtered = filtered.filter(product =>
        debouncedRegions.some(region =>
          product.region?.toLowerCase() === region?.toLowerCase()
        )
      );
    }

    if (debouncedSuppliers.length > 0) {
      filtered = filtered.filter(product =>
        debouncedSuppliers.includes(product.supplier?.name)
      );
    }

    filtered.sort((a, b) => {

      const priorityA = a.supplier?.priority ?? Infinity;
      const priorityB = b.supplier?.priority ?? Infinity;
      
      if (priorityA !== priorityB) {
        return priorityA - priorityB;
      }

      const typePriorityA = getProductTypePriority(a.name);
      const typePriorityB = getProductTypePriority(b.name);
      
      if (typePriorityA !== typePriorityB) {
        return typePriorityA - typePriorityB;
      }

      const searchLower = debouncedSearchTerm?.toLowerCase().trim();

      if (searchLower) {
        const nameA = a.name?.toLowerCase() || '';
        const nameB = b.name?.toLowerCase() || '';

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
      }

      const hasFilters = debouncedCategories.length > 0 ||
        debouncedColors.length > 0 ||
        debouncedStorages.length > 0 ||
        debouncedRegions.length > 0 ||
        debouncedSuppliers.length > 0;

      if (hasFilters) {
        let scoreA = 0;
        let scoreB = 0;

        if (debouncedCategories.length > 0) {
          if (debouncedCategories.some(cat => cat?.toLowerCase() === a.category?.toLowerCase())) scoreA++;
          if (debouncedCategories.some(cat => cat?.toLowerCase() === b.category?.toLowerCase())) scoreB++;
        }

        if (debouncedColors.length > 0) {
          if (debouncedColors.some(color => color?.toLowerCase() === a.color?.toLowerCase())) scoreA++;
          if (debouncedColors.some(color => color?.toLowerCase() === b.color?.toLowerCase())) scoreB++;
        }

        if (debouncedStorages.length > 0) {
          if (debouncedStorages.some(storage => storage?.toLowerCase() === a.storage?.toLowerCase())) scoreA++;
          if (debouncedStorages.some(storage => storage?.toLowerCase() === b.storage?.toLowerCase())) scoreB++;
        }

        if (debouncedRegions.length > 0) {
          if (debouncedRegions.includes(a.region)) scoreA++;
          if (debouncedRegions.includes(b.region)) scoreB++;
        }

        if (debouncedSuppliers.length > 0) {
          if (debouncedSuppliers.includes(a.supplier?.name)) scoreA++;
          if (debouncedSuppliers.includes(b.supplier?.name)) scoreB++;
        }

        if (scoreB !== scoreA) {
          return scoreB - scoreA;
        }
      }

      const priceA = a.price || 0;
      const priceB = b.price || 0;
      
      if (priceA !== priceB) {
        return priceA - priceB;
      }

      const dateA = new Date(a.createdAt || a.sheetDate);
      const dateB = new Date(b.createdAt || b.sheetDate);
      
      if (dateSort === 'newest') {
        return dateB - dateA;
      } else if (dateSort === 'oldest') {
        return dateA - dateB;
      }

      return 0;
    });

    console.log('✅ Filtros aplicados:', {
      resultCount: filtered.length,
      totalProducts: products.length
    });

    setFilteredProducts(filtered);
    setTotalProducts(filtered.length);

    const calculatedTotalPages = Math.ceil(filtered.length / itemsPerPage);
    setTotalPages(calculatedTotalPages);
  }, [
    products,
    debouncedSearchTerm,
    debouncedCategories,
    debouncedColors,
    debouncedStorages,
    debouncedRegions,
    debouncedSuppliers,
    dateSort,
    itemsPerPage
  ]);

  const paginatedProducts = useMemo(() => {
    const startIndex = (page - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filteredProducts.slice(startIndex, endIndex);
  }, [filteredProducts, page, itemsPerPage]);

  useEffect(() => {
    const handleFilterBySupplier = (event) => {
      const { supplierName } = event.detail;
      setSelectedSuppliers([supplierName]);
      setDebouncedSuppliers([supplierName]);
      setPage(1);
    };

    window.addEventListener('filterBySupplier', handleFilterBySupplier);

    return () => {
      window.removeEventListener('filterBySupplier', handleFilterBySupplier);
    };
  }, []);

  const clearFilters = () => {
    setSelectedCategories([]);
    setSelectedColors([]);
    setSelectedStorages([]);
    setSelectedRegions([]);
    setSelectedSuppliers([]);

    setDebouncedCategories([]);
    setDebouncedColors([]);
    setDebouncedStorages([]);
    setDebouncedRegions([]);
    setDebouncedSuppliers([]);

    setDateSort('newest');
    setSearchTerm('');
    setDebouncedSearchTerm('');
    setPage(1);
    setProducts([]);
  };

  const hasActiveFilters = () => {

    return selectedCategories.length > 0 ||
      selectedColors.length > 0 ||
      selectedStorages.length > 0 ||
      selectedRegions.length > 0 ||
      selectedSuppliers.length > 0 ||
      searchTerm !== '';
  };

  const clearAllFilters = () => {
    setSelectedCategories([]);
    setSelectedColors([]);
    setSelectedStorages([]);
    setSelectedRegions([]);
    setSelectedSuppliers([]);

    setSearchTerm('');
    setDebouncedCategories([]);
    setDebouncedColors([]);
    setDebouncedStorages([]);
    setDebouncedRegions([]);
    setDebouncedSuppliers([]);

    setDebouncedSearchTerm('');
    setPage(1);
  };

  return (
    <>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 dark:from-gray-900 dark:to-gray-800">
        <div className="w-full max-w-[95%] lg:w-[90%] mx-auto px-2 sm:px-4 lg:px-8 py-4 sm:py-6 lg:py-8">

          <div className="animate-in slide-in-from-top-4 duration-300">

            <div className="hidden md:flex items-center justify-between py-3 px-4 mb-6 text-xs border rounded-lg bg-background/50">
              <div className="flex items-center gap-4 lg:gap-6">

                <div className="flex items-center gap-1.5 text-muted-foreground">
                  <Smartphone className="h-3 w-3 text-blue-500" />
                  <span className="font-medium text-foreground">{totalProducts}</span>
                  <span className="text-muted-foreground hidden sm:inline">produtos</span>
                </div>

                <div className="hidden md:block w-px h-3 bg-border"></div>

                <button
                  onClick={() => setShowSuppliersModal(true)}
                  className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors cursor-pointer hover:bg-muted/50 rounded-md px-2 py-1"
                >
                  <Building className="h-3 w-3 text-green-500" />
                  <span className="font-medium text-foreground">{totalSuppliers}</span>
                  <span className="text-muted-foreground hidden sm:inline">fornecedores</span>
                </button>

                <div className="hidden md:block w-px h-3 bg-border"></div>

                <div className="flex items-center">
                  <div className="rounded-lg text-card-foreground w-full border-0 bg-transparent p-0 shadow-none text-xs">
                    <div className="p-6 py-3 px-4">
                      <div className="flex items-center gap-0.5 min-w-0 text-xs">
                        <div className="flex items-center gap-0.5 flex-shrink-0">
                          <DollarSign className="h-2.5 w-2.5 text-amber-500" />
                        </div>
                        <div className="flex items-center gap-0.5 min-w-0">
                          <span className="text-xs font-bold text-foreground truncate max-w-[80px] sm:max-w-none">
                            {liveDollarRate !== null ? `R$ ${liveDollarRate.toFixed(4).replace('.', ',')}` : <span className="text-muted-foreground animate-pulse">Carregando...</span>}
                          </span>
                          {liveDollarRate !== null && (
                            <div className={`hidden sm:flex items-center gap-0.5 text-xs flex-shrink-0 ${liveDollarVariation >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                              <TrendingDown className={`h-2 w-2 ${liveDollarVariation >= 0 ? 'rotate-180' : ''}`} />
                              <span className="font-medium text-xs">{liveDollarVariation >= 0 ? '+' : ''}{liveDollarVariation.toFixed(2).replace('.', ',')}%</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="hidden lg:block w-px h-3 bg-border"></div>

                <div className="flex items-center">
                  <div className="relative scale-75 origin-left">
                    <div className="flex items-center gap-3 px-4 py-2.5 bg-gradient-to-r from-emerald-50 to-blue-50 dark:from-emerald-900/20 dark:to-blue-900/20 rounded-xl border border-emerald-200/50 dark:border-emerald-700/30 shadow-sm backdrop-blur-sm">
                      <div className="flex items-center gap-2">
                        <div className="relative">
                          <Wifi className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                          <div className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                        </div>
                        <span className="text-sm font-semibold text-emerald-700 dark:text-emerald-300 tracking-wide">ONLINE</span>
                      </div>
                      <div className="w-px h-6 bg-gradient-to-b from-transparent via-gray-300 dark:via-gray-600 to-transparent"></div>
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                        <div className="flex flex-col">
                          <div className="font-mono text-lg font-bold text-gray-900 dark:text-gray-100 leading-none tracking-wider">
                            {new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                          </div>
                          <div className="text-xs text-gray-600 dark:text-gray-400 font-medium leading-none mt-0.5">
                            {new Date().toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: '2-digit', year: 'numeric' })} (SP)
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center">
                        <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-ping"></div>
                      </div>
                    </div>
                    <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/10 to-blue-500/10 rounded-xl blur-lg -z-10 opacity-60"></div>
                  </div>
                </div>
              </div>
            </div>

            <div className="md:hidden mb-2">
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-2 sm:p-3">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2 sm:gap-4">
                    <div className="flex items-center gap-1 sm:gap-1.5">
                      <Smartphone className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-blue-500" />
                      <span className="text-xs sm:text-sm font-bold text-gray-900 dark:text-white">{totalProducts}</span>
                      <span className="text-xs text-gray-500 hidden xs:inline">produtos</span>
                    </div>
                    <div className="w-px h-4 bg-gray-300 dark:bg-gray-600"></div>
                    <button
                      onClick={() => setShowSuppliersModal(true)}
                      className="flex items-center gap-1 sm:gap-1.5 hover:bg-gray-50 dark:hover:bg-gray-700 rounded px-1.5 sm:px-2 py-1 transition-colors"
                    >
                      <Building className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-green-500" />
                      <span className="text-xs sm:text-sm font-bold text-gray-900 dark:text-white">{totalSuppliers}</span>
                      <span className="text-xs text-gray-500">forn.</span>
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between mt-2 pt-2 border-t border-gray-100 dark:border-gray-700 overflow-x-auto">
                  <div className="flex items-center gap-2 flex-1 min-w-0">

                    <div className="relative scale-[0.65] sm:scale-75 origin-left flex-shrink-0">
                      <div className="flex items-center gap-3 px-4 py-2.5 bg-gradient-to-r from-emerald-50 to-blue-50 dark:from-emerald-900/20 dark:to-blue-900/20 rounded-xl border border-emerald-200/50 dark:border-emerald-700/30 shadow-sm backdrop-blur-sm">
                        <div className="flex items-center gap-2">
                          <div className="relative">
                            <Wifi className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                            <div className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                          </div>
                          <span className="text-sm font-semibold text-emerald-700 dark:text-emerald-300 tracking-wide">ONLINE</span>
                        </div>
                        <div className="w-px h-6 bg-gradient-to-b from-transparent via-gray-300 dark:via-gray-600 to-transparent"></div>
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                          <div className="flex flex-col">
                            <div className="font-mono text-lg font-bold text-gray-900 dark:text-gray-100 leading-none tracking-wider">
                              {new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center">
                          <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-ping"></div>
                        </div>
                      </div>
                      <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/10 to-blue-500/10 rounded-xl blur-lg -z-10 opacity-60"></div>
                    </div>

                    <div className="flex items-center min-w-0 flex-shrink-0">
                      <div className="rounded-lg text-card-foreground w-full border-0 bg-transparent p-0 shadow-none text-xs min-w-0">
                        <div className="py-2 px-2 sm:py-3 sm:px-4">
                          <div className="flex items-center gap-0.5 min-w-0 text-xs">
                            <div className="flex items-center gap-0.5 flex-shrink-0">
                              <DollarSign className="h-2 w-2 sm:h-2.5 sm:w-2.5 text-amber-500" />
                            </div>
                            <div className="flex items-center gap-0.5 min-w-0">
                              <span className="text-[10px] sm:text-xs font-bold text-foreground truncate">
                                {liveDollarRate !== null ? `R$ ${liveDollarRate.toFixed(4).replace('.', ',')}` : <span className="text-muted-foreground animate-pulse">Carregando...</span>}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <PartnerBanner />

          <div className="bg-white/95 dark:bg-gray-800/95 backdrop-blur-sm shadow-lg rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">

            <div className="sticky top-0 z-30 bg-white/95 dark:bg-gray-800/95 backdrop-blur-md border-b border-gray-200 dark:border-gray-700 px-3 sm:px-4 lg:px-6 py-3 sm:py-4">
              <SearchAutocomplete
                value={searchTerm}
                onChange={setSearchTerm}
                onSelect={(text, type) => {

                  setSelectedCategories([]);
                  setSelectedColors([]);
                  setSelectedStorages([]);
                  setSelectedRegions([]);
                  setSelectedSuppliers([]);
                  setDebouncedCategories([]);
                  setDebouncedColors([]);
                  setDebouncedStorages([]);
                  setDebouncedRegions([]);
                  setDebouncedSuppliers([]);
                  
                  setSearchTerm(text);
                  executeSearch(text);
                }}
                onClear={() => {

                  setSelectedCategories([]);
                  setSelectedColors([]);
                  setSelectedStorages([]);
                  setSelectedRegions([]);
                  setSelectedSuppliers([]);
                  setDebouncedCategories([]);
                  setDebouncedColors([]);
                  setDebouncedStorages([]);
                  setDebouncedRegions([]);
                  setDebouncedSuppliers([]);
                  setDebouncedSearchTerm('');
                  setPage(1);
                }}
                localProducts={products}
              />
            </div>

            <div className="space-y-4 sm:space-y-6 p-2 sm:p-4 lg:p-6">
              <div className="bg-card/50 backdrop-blur-sm rounded-xl border border-border/50 shadow-sm overflow-hidden relative z-10">
                <div className="rounded-lg border bg-card text-card-foreground shadow-lg relative overflow-hidden">

                  <div className="flex justify-between items-center p-2 sm:p-3 lg:p-4 bg-gradient-to-r from-background/95 to-muted/10 border-b border-border/20 flex-wrap gap-2">
                    <div className="flex items-center gap-1 sm:gap-1.5 text-muted-foreground">
                      <Clock className="h-3 w-3 text-orange-500 flex-shrink-0" />
                      <span className="text-[10px] sm:text-xs">
                        <span className="text-muted-foreground mr-1 hidden sm:inline">Última atualização:</span>
                        <span className="text-foreground font-medium">
                          {new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                        </span>
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1 sm:gap-2">
                        <div className="flex items-center gap-1">
                          <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-green-500 animate-pulse"></div>
                          <span className="text-[10px] sm:text-xs text-muted-foreground">Online</span>
                        </div>
                      </div>
                      {hasActiveFilters() && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={clearAllFilters}
                          className="h-6 sm:h-7 px-1.5 sm:px-2 text-[10px] sm:text-xs rounded-md text-muted-foreground hover:text-foreground"
                        >
                          <X className="h-2.5 w-2.5 sm:h-3 sm:w-3 sm:mr-1" />
                          <span className="hidden sm:inline">Limpar Filtros</span>
                        </Button>
                      )}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setPage(1);
                          fetchProducts();

                        }}
                        className="h-6 sm:h-7 px-1.5 sm:px-2 text-[10px] sm:text-xs rounded-md"
                      >
                        <RefreshCw className="h-2.5 w-2.5 sm:h-3 sm:w-3 sm:mr-1" />
                        <span className="hidden sm:inline">Atualizar</span>
                      </Button>
                    </div>
                  </div>

                  <div className={`transition-all duration-300 ease-in-out overflow-hidden ${showFilters ? 'block max-h-[2000px] opacity-100' : 'hidden max-h-0 opacity-0'}`}>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-2 sm:gap-3 p-2 sm:p-3 lg:p-4 bg-gradient-to-br from-gray-50 to-white dark:from-gray-800 dark:to-gray-700 transition-all duration-300 border-b border-border/20">

                      <div className="min-w-0">
                        <label className="block text-[10px] sm:text-xs font-medium text-foreground mb-1 sm:mb-1.5">📅 Data</label>
                        <DateFilter
                          selectedDate={selectedDate}
                          onDateChange={setSelectedDate}
                        />
                      </div>

                      <div className="min-w-0">
                        <label className="block text-[10px] sm:text-xs font-medium text-foreground mb-1 sm:mb-1.5">🏷️ Categoria</label>
                        <MultiSelectFilter
                          label="Categoria"
                          options={categories}
                          selectedValues={selectedCategories}
                          onChange={setSelectedCategories}
                          placeholder="Todas"
                        />
                      </div>

                      <div className="min-w-0">
                        <label className="block text-[10px] sm:text-xs font-medium text-foreground mb-1 sm:mb-1.5">💾 Capacidade</label>
                        <MultiSelectFilter
                          label="Capacidade / MM"
                          options={storages}
                          selectedValues={selectedStorages}
                          onChange={setSelectedStorages}
                          placeholder="Todas"
                        />
                      </div>

                      <div className="min-w-0">
                        <label className="block text-[10px] sm:text-xs font-medium text-foreground mb-1 sm:mb-1.5">🌍 Região</label>
                        <MultiSelectFilter
                          label="Região / GB-RAM"
                          options={regions}
                          selectedValues={selectedRegions}
                          onChange={setSelectedRegions}
                          placeholder="Todas"
                        />
                      </div>

                      <div className="min-w-0">
                        <label className="block text-[10px] sm:text-xs font-medium text-foreground mb-1 sm:mb-1.5">🎨 Cor</label>
                        <MultiSelectFilter
                          label="Cor"
                          options={colors}
                          unavailableOptions={unavailableColors}
                          selectedValues={selectedColors}
                          onChange={setSelectedColors}
                          placeholder="Todas"
                        />
                      </div>

                      <div className="min-w-0">
                        <label className="block text-[10px] sm:text-xs font-medium text-foreground mb-1 sm:mb-1.5">🏪 Fornecedor</label>
                        <MultiSelectFilter
                          label="Fornecedor"
                          options={{
                            groups: [
                              { title: 'Atualizados', options: suppliers.updated },
                              { title: 'Desatualizados', options: suppliers.outdated }
                            ]
                          }}
                          selectedValues={selectedSuppliers}
                          onChange={setSelectedSuppliers}
                          placeholder="Todos"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="block md:hidden p-2 sm:p-3 lg:p-4 border-b border-border/20 bg-gradient-to-r from-muted/30 to-muted/10">
                    <div className="relative group">
                      <div className="absolute inset-0 bg-gradient-to-r from-primary/10 to-primary/5 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 -z-10"></div>
                      <Button
                        variant="outline"
                        onClick={() => setShowFilters(!showFilters)}
                        className="w-full h-11 sm:h-12 hover:border-primary/50 shadow-lg hover:shadow-xl transition-all duration-200 rounded-xl backdrop-blur-sm font-medium bg-gradient-to-r from-primary/5 to-primary/10 border-primary/30"
                      >
                        <div className="flex items-center justify-center gap-2 sm:gap-3">
                          <div className="p-1 sm:p-1.5 rounded-lg transition-colors duration-200 bg-primary/20 text-primary">
                            <Filter className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                          </div>
                          <span className="text-sm sm:text-base font-medium">
                            {showFilters ? 'Ocultar Filtros' : 'Mostrar Filtros'}
                          </span>
                          <div className={`p-1 rounded-lg transition-all duration-200 bg-primary/20 text-primary ${showFilters ? 'rotate-180' : ''}`}>
                            <ChevronDown className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                          </div>
                        </div>
                      </Button>
                    </div>
                  </div>

                  <div className="p-0 relative">

                    {loading && (
                      <div className="absolute inset-0 bg-white/50 dark:bg-gray-900/50 backdrop-blur-[2px] z-20 flex items-center justify-center">
                        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-4 flex items-center gap-3 border border-gray-200 dark:border-gray-700">
                          <Loader2 className="h-5 w-5 animate-spin text-primary" />
                          <span className="text-sm font-medium text-muted-foreground">Carregando...</span>
                        </div>
                      </div>
                    )}

                    {filteredProducts.length === 0 && !loading ? (
                      <div className="text-center py-8 sm:py-12 px-4 sm:px-6">
                        <div className="mx-auto h-16 w-16 sm:h-24 sm:w-24 text-gray-400 mb-3 sm:mb-4">
                          <Search className="h-full w-full" />
                        </div>
                        <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-2">Nenhum produto encontrado</h3>
                        <p className="text-sm sm:text-base text-gray-500">
                          {searchTerm || hasActiveFilters() ? 'Tente ajustar seus filtros ou termo de busca.' : 'Não há produtos disponíveis no momento.'}
                        </p>
                      </div>
                    ) : (
                      <>
                        <div className="hidden md:block overflow-x-auto">
                          <div className="relative w-full overflow-auto">
                            <table className="w-full caption-bottom text-sm">
                              <thead className="[&amp;_tr]:border-b">
                                <tr className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted bg-muted/50">
                                  <th className="h-12 px-4 align-middle font-medium text-muted-foreground [&amp;:has([role=checkbox])]:pr-0 cursor-pointer select-none hover:bg-muted/50 transition-colors text-left">
                                    <div className="flex items-center gap-2 justify-start">
                                      <span className="font-bold text-foreground">Produto</span>
                                      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" className="lucide lucide-arrow-up-down h-4 w-4 opacity-50 group-hover:opacity-100">
                                        <path d="m21 16-4 4-4-4"></path>
                                        <path d="M17 20V4"></path>
                                        <path d="m3 8 4-4 4 4"></path>
                                        <path d="M7 4v16"></path>
                                      </svg>
                                    </div>
                                  </th>
                                  {!isSupplierHidden() && (
                                    <th className="h-12 px-4 align-middle font-medium text-muted-foreground [&amp;:has([role=checkbox])]:pr-0 cursor-pointer select-none hover:bg-muted/50 transition-colors text-center">
                                      <div className="flex items-center gap-2 justify-center">
                                        <span className="font-bold text-foreground">Fornecedor</span>
                                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" className="lucide lucide-arrow-up-down h-4 w-4 opacity-50 group-hover:opacity-100">
                                          <path d="m21 16-4 4-4-4"></path>
                                          <path d="M17 20V4"></path>
                                          <path d="m3 8 4-4 4 4"></path>
                                          <path d="M7 4v16"></path>
                                        </svg>
                                      </div>
                                    </th>
                                  )}
                                  <th className="h-12 px-4 align-middle font-medium text-muted-foreground [&amp;:has([role=checkbox])]:pr-0 cursor-pointer select-none hover:bg-muted/50 transition-colors text-center">
                                    <div className="flex items-center gap-2 justify-center">
                                      <span className="font-bold text-foreground">Storage</span>
                                      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" className="lucide lucide-arrow-up-down h-4 w-4 opacity-50 group-hover:opacity-100">
                                        <path d="m21 16-4 4-4-4"></path>
                                        <path d="M17 20V4"></path>
                                        <path d="m3 8 4-4 4 4"></path>
                                        <path d="M7 4v16"></path>
                                      </svg>
                                    </div>
                                  </th>
                                  <th className="h-12 px-4 align-middle font-medium text-muted-foreground [&amp;:has([role=checkbox])]:pr-0 cursor-pointer select-none hover:bg-muted/50 transition-colors text-center">
                                    <div className="flex items-center gap-2 justify-center">
                                      <span className="font-bold text-foreground">Cor</span>
                                      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" className="lucide lucide-arrow-up-down h-4 w-4 opacity-50 group-hover:opacity-100">
                                        <path d="m21 16-4 4-4-4"></path>
                                        <path d="M17 20V4"></path>
                                        <path d="m3 8 4-4 4 4"></path>
                                        <path d="M7 4v16"></path>
                                      </svg>
                                    </div>
                                  </th>
                                  <th className="h-12 px-4 align-middle font-medium text-muted-foreground [&amp;:has([role=checkbox])]:pr-0 cursor-pointer select-none hover:bg-muted/50 transition-colors text-center">
                                    <div className="flex items-center gap-2 justify-center">
                                      <span className="font-bold text-foreground">Categoria</span>
                                      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" className="lucide lucide-arrow-up-down h-4 w-4 opacity-50 group-hover:opacity-100">
                                        <path d="m21 16-4 4-4-4"></path>
                                        <path d="M17 20V4"></path>
                                        <path d="m3 8 4-4 4 4"></path>
                                        <path d="M7 4v16"></path>
                                      </svg>
                                    </div>
                                  </th>
                                  <th className="h-12 px-4 align-middle font-medium text-muted-foreground [&amp;:has([role=checkbox])]:pr-0 cursor-pointer select-none hover:bg-muted/50 transition-colors text-center">
                                    <div className="flex items-center gap-2 justify-center">
                                      <span className="font-bold text-foreground">Região</span>
                                      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" className="lucide lucide-arrow-up-down h-4 w-4 opacity-50 group-hover:opacity-100">
                                        <path d="m21 16-4 4-4-4"></path>
                                        <path d="M17 20V4"></path>
                                        <path d="m3 8 4-4 4 4"></path>
                                        <path d="M7 4v16"></path>
                                      </svg>
                                    </div>
                                  </th>
                                  <th className="h-12 px-4 align-middle font-medium text-muted-foreground [&amp;:has([role=checkbox])]:pr-0 cursor-pointer select-none hover:bg-muted/50 transition-colors text-right">
                                    <div className="flex items-center gap-2 justify-end">
                                      <span className="font-bold text-foreground">Preço</span>
                                      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" className="lucide lucide-arrow-up-down h-4 w-4 opacity-50 group-hover:opacity-100">
                                        <path d="m21 16-4 4-4-4"></path>
                                        <path d="M17 20V4"></path>
                                        <path d="m3 8 4-4 4 4"></path>
                                        <path d="M7 4v16"></path>
                                      </svg>
                                    </div>
                                  </th>
                                </tr>
                              </thead>
                              <tbody className="[&amp;_tr:last-child]:border-0">
                                {paginatedProducts.map((product) => (
                                  <tr key={product.id} className="border-b data-[state=selected]:bg-muted hover:bg-muted/50 transition-colors">
                                    <td className="p-4 align-middle [&amp;:has([role=checkbox])]:pr-0 font-medium">
                                      <div className="flex items-center gap-3">
                                        <div className="flex items-center">
                                          {getCategoryIcon(product.category, product.name, "h-4 w-4")}
                                        </div>
                                        <div>
                                          <div className="font-semibold text-sm">{product.name}</div>
                                        </div>
                                      </div>
                                    </td>
                                    {!isSupplierHidden() && (
                                      <td className="p-4 align-middle [&amp;:has([role=checkbox])]:pr-0 text-center">
                                        <div className="flex flex-col items-center gap-2">
                                          <div className="flex flex-col items-center text-center">
                                            <div className="flex items-center gap-1">
                                              <button
                                                onClick={() => {
                                                  if (product.supplier?.whatsappNumber && isToday(selectedDate) && !isSupplierContactDisabled()) {
                                                    handleWhatsAppClick(product);
                                                  }
                                                }}
                                                className={`text-sm font-medium transition-colors touch-manipulation select-none ${
                                                  product.supplier?.whatsappNumber && isToday(selectedDate) && !isSupplierContactDisabled()
                                                    ? 'text-green-600 hover:text-green-700 hover:underline cursor-pointer'
                                                    : 'text-gray-400 cursor-default pointer-events-none'
                                                  }`}
                                                title={
                                                  isSupplierContactDisabled() 
                                                    ? 'Contato desabilitado pelo seu plano' 
                                                    : !isToday(selectedDate) 
                                                      ? 'WhatsApp disponível apenas para produtos do dia atual' 
                                                      : ''
                                                }
                                              >
                                                {product.supplier?.name || 'N/A'}
                                              </button>
                                              {product.supplier?.whatsappNumber && isToday(selectedDate) && !isSupplierContactDisabled() && (
                                                <button
                                                  onClick={() => handleWhatsAppClick(product)}
                                                >
                                                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="text-green-600 cursor-pointer hover:text-green-700">
                                                    <path d="M17.472 14.382C17.233 14.262 15.963 13.635 15.754 13.545C15.545 13.456 15.395 13.411 15.244 13.65C15.094 13.889 14.616 14.485 14.495 14.635C14.375 14.785 14.254 14.802 14.015 14.682C13.776 14.562 12.985 14.308 12.042 13.465C11.313 12.808 10.829 12.005 10.708 11.766C10.588 11.527 10.695 11.414 10.815 11.295C10.924 11.186 11.054 11.015 11.174 10.895C11.294 10.775 11.339 10.685 11.429 10.535C11.518 10.385 11.474 10.265 11.414 10.145C11.354 10.025 10.874 8.755 10.695 8.275C10.521 7.809 10.342 7.869 10.207 7.862C10.078 7.855 9.928 7.854 9.778 7.854C9.628 7.854 9.389 7.914 9.18 8.154C8.971 8.393 8.314 9.02 8.314 10.29C8.314 11.56 9.21 12.79 9.33 12.94C9.45 13.09 10.869 15.29 13.109 16.43C13.649 16.68 14.069 16.83 14.399 16.94C14.939 17.11 15.429 17.09 15.819 17.03C16.259 16.96 17.289 16.41 17.519 15.8C17.749 15.19 17.749 14.67 17.689 14.57C17.629 14.47 17.479 14.41 17.24 14.29L17.472 14.382Z" fill="currentColor"></path>
                                                    <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.477 2 12C2 13.89 2.525 15.66 3.438 17.168L2.546 20.2C2.491 20.365 2.495 20.544 2.557 20.706C2.619 20.868 2.736 21.002 2.888 21.082C3.04 21.162 3.217 21.183 3.383 21.141L6.832 20.562C8.34 21.475 10.11 22 12 22C17.523 22 22 17.523 22 12C22 6.477 17.523 2 12 2ZM12 4C16.411 4 20 7.589 20 12C20 16.411 16.411 20 12 20C10.33 20 8.773 19.516 7.455 18.686L7.257 18.562L4.697 19.062L5.438 17.257L5.314 17.059C4.484 15.741 4 14.184 4 12.514C4 7.589 7.589 4 12 4Z" fill="currentColor"></path>
                                                  </svg>
                                                </button>
                                              )}
                                            </div>
                                            <span className="text-xs text-muted-foreground mt-1">{product.supplier?.address || 'N/A'}</span>
                                          </div>
                                        </div>
                                      </td>
                                    )}
                                    <td className="p-4 align-middle [&amp;:has([role=checkbox])]:pr-0 text-center">
                                      <div className="flex flex-col items-center gap-1">
                                        <div className="font-semibold text-sm">{product.storage || 'N/A'}</div>
                                      </div>
                                    </td>
                                    <td className="p-4 align-middle [&amp;:has([role=checkbox])]:pr-0 text-center">
                                      <div className="flex flex-col items-center gap-1">
                                        <div className="flex items-center gap-2 justify-center">
                                          {getColorHex(product.color) && (
                                            <div
                                              className="w-4 h-4 rounded-full border-2 border-gray-300 shadow-sm"
                                              style={{ backgroundColor: getColorHex(product.color) }}
                                              title={product.color || 'N/A'}
                                            ></div>
                                          )}
                                          <span className="font-semibold text-sm text-muted-foreground">{product.color || 'N/A'}</span>
                                        </div>
                                      </div>
                                    </td>
                                    <td className="p-4 align-middle [&amp;:has([role=checkbox])]:pr-0 text-center">
                                      <div className="flex flex-col items-center gap-1">
                                        <div className="font-semibold text-sm">{product.category || 'N/A'}</div>
                                      </div>
                                    </td>
                                    <td className="p-4 align-middle [&amp;:has([role=checkbox])]:pr-0 text-center">
                                      <div className="flex flex-col items-center gap-1">
                                        <div className="font-semibold text-sm">{product.region || 'N/A'}</div>
                                      </div>
                                    </td>
                                    <td className="p-4 align-middle [&amp;:has([role=checkbox])]:pr-0 text-right">
                                      <div className="flex flex-col items-end gap-1">
                                        <div className={`relative inline-block duration-200 hover:shadow-sm active:scale-95 font-bold text-lg cursor-pointer hover:bg-primary/5 rounded px-2 py-1 transition-colors ${isLowestPrice(product, filteredProducts)
                                            ? 'text-green-600 dark:text-green-400'
                                            : 'text-foreground'
                                          }`}>
                                          {formatCurrency(product.price)}
                                          <div className="absolute inset-0 rounded-md border-2 border-transparent transition-colors"></div>
                                        </div>
                                        {product.sheetTimestamp && (
                                          <div className="text-[10px] text-muted-foreground">
                                            {product.sheetTimestamp}
                                          </div>
                                        )}
                                      </div>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>

                        <div className="block md:hidden">
                          <div className="space-y-2 sm:space-y-3 p-2 sm:p-3">
                            {paginatedProducts.map((product) => (
                              <div key={product.id} className="rounded-lg bg-card text-card-foreground overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-200 border border-border/50">
                                <div className="p-0">
                                  <div className="bg-gradient-to-r from-primary/5 to-primary/10 px-3 sm:px-4 py-2 sm:py-3 border-b border-border/30">
                                    <div className="flex items-center justify-between gap-2">
                                      <div className="flex items-center gap-1.5 sm:gap-2 flex-1 min-w-0">
                                        <div className="flex items-center flex-shrink-0">
                                          {getCategoryIcon(product.category, product.name, "h-3.5 w-3.5 sm:h-4 sm:w-4")}
                                        </div>
                                        <h3 className="font-bold text-sm sm:text-base text-foreground leading-tight truncate">{product.name}</h3>
                                      </div>
                                      <div className="text-right flex-shrink-0">
                                        <div className="flex flex-col items-end gap-0.5">
                                          <div className={`relative inline-block duration-200 hover:shadow-sm active:scale-95 font-bold text-base sm:text-lg cursor-pointer hover:bg-primary/5 rounded px-1.5 sm:px-2 py-0.5 sm:py-1 transition-colors ${isLowestPrice(product, filteredProducts)
                                              ? 'text-green-600 dark:text-green-400'
                                              : 'text-foreground'
                                            }`}>
                                            {formatCurrency(product.price)}
                                            <div className="absolute inset-0 rounded-md border-2 border-transparent transition-colors"></div>
                                          </div>
                                          {product.sheetTimestamp && (
                                            <div className="text-[9px] sm:text-[10px] text-muted-foreground">
                                              {product.sheetTimestamp}
                                            </div>
                                          )}
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                  <div className="px-3 sm:px-4 py-2 sm:py-3 space-y-1.5 sm:space-y-2">
                                    <div className="flex items-center justify-between py-0.5 sm:py-1">
                                      <span className="text-xs sm:text-sm text-muted-foreground">Storage:</span>
                                      <div className="inline-flex items-center rounded-full border px-2 sm:px-2.5 py-0.5 transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 text-[10px] sm:text-xs font-medium bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300">{product.storage || 'N/A'}</div>
                                    </div>
                                    <div className="flex items-center justify-between py-0.5 sm:py-1">
                                      <span className="text-xs sm:text-sm text-muted-foreground">Cor:</span>
                                      <div className="flex items-center gap-2">
                                        {getColorHex(product.color) && (
                                          <div
                                            className="w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-full border-2 border-gray-300 shadow-sm flex-shrink-0"
                                            style={{ backgroundColor: getColorHex(product.color) }}
                                            title={product.color || 'N/A'}
                                          ></div>
                                        )}
                                        <span className="text-xs sm:text-sm text-muted-foreground">{product.color || 'N/A'}</span>
                                      </div>
                                    </div>
                                    <div className="flex items-center justify-between py-0.5 sm:py-1">
                                      <span className="text-xs sm:text-sm text-muted-foreground">Região:</span>
                                      <span className="text-xs sm:text-sm font-medium">{product.region || 'N/A'}</span>
                                    </div>
                                    {!isSupplierHidden() && (
                                      <div className="flex items-center justify-between py-0.5 sm:py-1">
                                        <span className="text-xs sm:text-sm text-muted-foreground">Fornecedor:</span>
                                        <button
                                          onClick={() => {
                                            if (product.supplier?.whatsappNumber && isToday(selectedDate) && !isSupplierContactDisabled()) {
                                              handleWhatsAppClick(product);
                                            }
                                          }}
                                          className={`text-xs sm:text-sm font-medium truncate max-w-[150px] ${
                                            product.supplier?.whatsappNumber && isToday(selectedDate) && !isSupplierContactDisabled()
                                              ? 'text-green-600 hover:text-green-700 hover:underline cursor-pointer'
                                              : 'text-gray-700 dark:text-gray-300 cursor-default pointer-events-none'
                                            }`}
                                          title={
                                            isSupplierContactDisabled() 
                                              ? 'Contato desabilitado pelo seu plano' 
                                              : !isToday(selectedDate) 
                                                ? 'WhatsApp disponível apenas para produtos do dia atual' 
                                                : ''
                                          }
                                        >
                                          {product.supplier?.name || 'N/A'}
                                        </button>
                                      </div>
                                    )}
                                  </div>
                                  {!isSupplierHidden() && (
                                    <div className="bg-muted/30 px-3 sm:px-4 py-2 sm:py-3 border-t border-border/30">
                                      <div className="space-y-1.5 sm:space-y-2">
                                        {product.supplier?.whatsappNumber && isToday(selectedDate) && !isSupplierContactDisabled() && (
                                          <button
                                            onClick={() => handleWhatsAppClick(product)}
                                            className="inline-flex items-center gap-1.5 sm:gap-2 whitespace-nowrap rounded-md text-xs sm:text-sm ring-offset-background transition-smooth focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&amp;_svg]:pointer-events-none [&amp;_svg]:size-4 [&amp;_svg]:shrink-0 btn-enhanced h-9 sm:h-10 px-3 sm:px-4 py-2 dark:bg-green-900/50 dark:hover:bg-green-800/50 dark:text-green-400 border-green-300 dark:border-green-700 transition-colors touch-manipulation select-none w-full justify-center bg-green-600 hover:bg-green-700 text-white font-medium"
                                          >
                                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-message-circle h-3.5 w-3.5 sm:h-4 sm:w-4">
                                              <path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z"></path>
                                            </svg>
                                            WhatsApp
                                          </button>
                                        )}
                                        {product.supplier?.whatsappNumber && isToday(selectedDate) && isSupplierContactDisabled() && (
                                          <div className="inline-flex items-center gap-1.5 sm:gap-2 whitespace-nowrap rounded-md text-xs sm:text-sm h-9 sm:h-10 px-3 sm:px-4 py-2 w-full justify-center bg-gray-400 text-white font-medium cursor-not-allowed opacity-60">
                                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-message-circle h-3.5 w-3.5 sm:h-4 sm:w-4">
                                              <path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z"></path>
                                            </svg>
                                            Contato desabilitado
                                          </div>
                                        )}
                                        {product.supplier?.whatsappNumber && !isToday(selectedDate) && (
                                          <div className="inline-flex items-center gap-1.5 sm:gap-2 whitespace-nowrap rounded-md text-xs sm:text-sm h-9 sm:h-10 px-3 sm:px-4 py-2 w-full justify-center bg-gray-400 text-white font-medium cursor-not-allowed opacity-60">
                                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-message-circle h-3.5 w-3.5 sm:h-4 sm:w-4">
                                              <path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z"></path>
                                            </svg>
                                            WhatsApp indisponível
                                          </div>
                                        )}
                                        <div className="text-[10px] sm:text-xs text-muted-foreground text-center truncate">📍 {product.supplier?.address || 'N/A'}</div>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>

                        <div className="flex flex-col sm:flex-row items-center justify-between px-3 sm:px-4 lg:px-6 py-3 sm:py-4 border-t border-border/50 gap-3">

                          <div className="flex items-center gap-3 sm:gap-4">
                            <div className="text-xs sm:text-sm text-muted-foreground">
                              {totalProducts} {totalProducts === 1 ? 'produto' : 'produtos'}
                              {hasActiveFilters() && <span className="text-primary"> (filtrado)</span>}
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-muted-foreground">Por página:</span>
                              <select
                                className="h-7 px-2 text-xs bg-background border border-border rounded-md focus:outline-none focus:ring-1 focus:ring-primary transition-colors cursor-pointer"
                                value={itemsPerPage}
                                onChange={(e) => setItemsPerPage(Number(e.target.value))}
                              >
                                <option value="10">10</option>
                                <option value="25">25</option>
                                <option value="50">50</option>
                                <option value="100">100</option>
                                <option value="200">200</option>
                              </select>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              disabled={page === 1}
                              onClick={() => setPage(prev => Math.max(1, prev - 1))}
                              className="h-8 px-3 text-xs"
                            >
                              Anterior
                            </Button>
                            <span className="text-xs font-medium px-2 min-w-[60px] text-center">
                              Página {page} de {totalPages}
                            </span>
                            <Button
                              variant="outline"
                              size="sm"
                              disabled={page >= totalPages}
                              onClick={() => setPage(prev => prev + 1)}
                              className="h-8 px-3 text-xs"
                            >
                              <span className="hidden sm:inline">Próxima</span>
                              <span className="sm:hidden">Prox.</span>
                            </Button>
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <SuppliersModal
        open={showSuppliersModal}
        onOpenChange={setShowSuppliersModal}
        selectedDate={debouncedDate}
      />
    </>
  );
};

export default Products;
