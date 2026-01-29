import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../contexts/AuthContext';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import WhatsAppButton from '../components/WhatsAppButton';
import { 
  Loader2, 
  Search, 
  Eye, 
  Store, 
  Filter,
  SortAsc,
  SortDesc,
  Package,
  Star,
  TrendingUp,
  Grid3X3,
  List,
  RefreshCw,
  Calendar,
  Tag,
  HardDrive,
  Globe,
  Palette,
  Building
} from 'lucide-react';

const Products = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [sortBy, setSortBy] = useState('name');
  const [sortOrder, setSortOrder] = useState('asc');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');
  const [capacityFilter, setCapacityFilter] = useState('all');
  const [regionFilter, setRegionFilter] = useState('all');
  const [colorFilter, setColorFilter] = useState('all');
  const [supplierFilter, setSupplierFilter] = useState('all');
  const [viewMode, setViewMode] = useState('table');
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchProducts();
  }, []);

  useEffect(() => {
    let filtered = products.filter(product =>
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.supplier.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (categoryFilter !== 'all') {
      filtered = filtered.filter(product => {
        const category = product.category || getProductCategory(product.supplier.name).name;
        return category.toLowerCase().includes(categoryFilter.toLowerCase());
      });
    }

    if (dateFilter !== 'all') {
      const now = new Date();
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      
      filtered = filtered.filter(product => {
        const createdAt = new Date(product.createdAt);
        if (dateFilter === 'recent') return createdAt > thirtyDaysAgo;
        if (dateFilter === 'old') return createdAt <= thirtyDaysAgo;
        return true;
      });
    }

    if (capacityFilter !== 'all') {
      filtered = filtered.filter(product => {
        if (!product.storage) return false;
        return product.storage.toLowerCase().includes(capacityFilter.replace('gb', 'GB').replace('tb', 'TB').toLowerCase());
      });
    }

    if (regionFilter !== 'all') {
      filtered = filtered.filter(product => {
        return product.region && product.region.toLowerCase() === regionFilter.toLowerCase();
      });
    }

    if (colorFilter !== 'all') {
      filtered = filtered.filter(product => {
        return product.color && product.color.toLowerCase() === colorFilter.toLowerCase();
      });
    }

    if (supplierFilter !== 'all') {
      filtered = filtered.filter(product => 
        product.supplier.name.toLowerCase().includes(supplierFilter.toLowerCase())
      );
    }

    filtered.sort((a, b) => {
      let aValue, bValue;
      
      switch (sortBy) {
        case 'price':
          aValue = parseFloat(a.price);
          bValue = parseFloat(b.price);
          break;
        case 'supplier':
          aValue = a.supplier.name.toLowerCase();
          bValue = b.supplier.name.toLowerCase();
          break;
        default:
          aValue = a.name.toLowerCase();
          bValue = b.name.toLowerCase();
      }

      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    setFilteredProducts(filtered);
  }, [products, searchTerm, sortBy, sortOrder, categoryFilter, dateFilter, capacityFilter, regionFilter, colorFilter, supplierFilter]);

  const fetchProducts = async () => {
    try {
      setRefreshing(true);
      const response = await api.get('/products');
      setProducts(response.data);
    } catch (error) {
      console.error('Erro ao buscar produtos:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(price);
  };

  const getProductCategory = (supplierName) => {
    if (supplierName.includes('Tech')) return { 
      name: 'Tecnologia', 
      color: 'bg-blue-100 text-blue-700 border-blue-200',
      icon: Package 
    };
    if (supplierName.includes('Casa')) return { 
      name: 'Casa & Decoração', 
      color: 'bg-green-100 text-green-700 border-green-200',
      icon: Store 
    };
    if (supplierName.includes('Moda')) return { 
      name: 'Moda & Estilo', 
      color: 'bg-purple-100 text-purple-700 border-purple-200',
      icon: TrendingUp 
    };
    return { 
      name: 'Geral', 
      color: 'bg-gray-100 text-gray-700 border-gray-200',
      icon: Package 
    };
  };

  const getSupplierStats = () => {
    const stats = products.reduce((acc, product) => {
      const category = product.category || getProductCategory(product.supplier.name).name;
      acc[category] = (acc[category] || 0) + 1;
      return acc;
    }, {});
    return stats;
  };

  const getUniqueSuppliers = () => {
    const suppliers = [...new Set(products.map(product => product.supplier.name))];
    return suppliers.sort();
  };

  const getUniqueCategories = () => {
    const categories = [...new Set(products.map(product => product.category).filter(Boolean))];
    return categories.sort();
  };

  const getUniqueColors = () => {
    const colors = [...new Set(products.map(product => product.color).filter(Boolean))];
    return colors.sort();
  };

  const getUniqueStorages = () => {
    const storages = [...new Set(products.map(product => product.storage).filter(Boolean))];
    return storages.sort((a, b) => {
      const aNum = parseInt(a);
      const bNum = parseInt(b);
      return aNum - bNum;
    });
  };

  const getUniqueRegions = () => {
    const regions = [...new Set(products.map(product => product.region).filter(Boolean))];
    return regions.sort();
  };

  const getColorEmoji = (colorName) => {
    const colorMap = {
      'Azul': '🔵',
      'Verde': '🟢',
      'Roxo': '🟣',
      'Vermelho': '🔴',
      'Preto': '⚫',
      'Branco': '⚪'
    };
    return colorMap[colorName] || '🟠';
  };

  const clearAllFilters = () => {
    setSearchTerm('');
    setCategoryFilter('all');
    setDateFilter('all');
    setCapacityFilter('all');
    setRegionFilter('all');
    setColorFilter('all');
    setSupplierFilter('all');
  };

  const refreshData = async () => {
    if (!refreshing) {
      await fetchProducts();
    }
  };

  const toggleSort = (field) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 via-blue-50/30 to-purple-50/30">
        <div className="text-center max-w-sm">
          <div className="relative mb-6">
            <div className="w-24 h-24 mx-auto bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
              <Package className="h-12 w-12 text-white" />
            </div>
            <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-md">
              <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
            </div>
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">Carregando produtos</h3>
          <p className="text-gray-600">Aguarde enquanto buscamos os melhores produtos para você...</p>
        </div>
      </div>
    );
  }

  const supplierStats = getSupplierStats();

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-purple-50/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        <div className="mb-8">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl shadow-lg mb-4">
              <Store className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-4xl font-bold text-gray-900 mb-3 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Catálogo de Produtos
            </h1>
            <p className="text-gray-600 text-lg max-w-2xl mx-auto">
              Descubra os melhores produtos de nossos fornecedores parceiros
            </p>
          </div>

          <Card className="shadow-lg border-0 bg-white/70 backdrop-blur-sm mb-6">
            <CardContent className="p-6">

              <div className="mb-6">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <Input
                    type="text"
                    placeholder="Buscar produtos, descrições ou fornecedores..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-11 h-12 border-gray-200 focus:border-blue-500 focus:ring-blue-500 shadow-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-6">

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Calendar className="h-4 w-4 inline mr-1" />
                    📅 Data
                  </label>
                  <Select value={dateFilter} onValueChange={setDateFilter}>
                    <SelectTrigger className="h-10 border-gray-200 shadow-sm">
                      <SelectValue placeholder="Todas" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todas as datas</SelectItem>
                      <SelectItem value="recent">Recentes</SelectItem>
                      <SelectItem value="old">Antigas</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Tag className="h-4 w-4 inline mr-1" />
                    🏷️ Categoria
                  </label>
                  <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                    <SelectTrigger className="h-10 border-gray-200 shadow-sm">
                      <SelectValue placeholder="Todas" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todas as categorias</SelectItem>
                      {getUniqueCategories().map(category => (
                        <SelectItem key={category} value={category.toLowerCase()}>
                          {category}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <HardDrive className="h-4 w-4 inline mr-1" />
                    Storage
                  </label>
                  <Select value={capacityFilter} onValueChange={setCapacityFilter}>
                    <SelectTrigger className="h-10 border-gray-200 shadow-sm">
                      <SelectValue placeholder="Todos" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos os tamanhos</SelectItem>
                      {getUniqueStorages().map(storage => (
                        <SelectItem key={storage} value={storage.toLowerCase()}>
                          {storage}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Globe className="h-4 w-4 inline mr-1" />
                    🌍 Região
                  </label>
                  <Select value={regionFilter} onValueChange={setRegionFilter}>
                    <SelectTrigger className="h-10 border-gray-200 shadow-sm">
                      <SelectValue placeholder="Todas as Regiões" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todas as Regiões</SelectItem>
                      {getUniqueRegions().map(region => (
                        <SelectItem key={region} value={region.toLowerCase()}>
                          {region}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Palette className="h-4 w-4 inline mr-1" />
                    🎨 Cor
                  </label>
                  <Select value={colorFilter} onValueChange={setColorFilter}>
                    <SelectTrigger className="h-10 border-gray-200 shadow-sm">
                      <SelectValue placeholder="Todas" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todas as cores</SelectItem>
                      {getUniqueColors().map(color => (
                        <SelectItem key={color} value={color.toLowerCase()}>
                          {getColorEmoji(color)} {color}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Building className="h-4 w-4 inline mr-1" />
                    🏪 Fornecedor
                  </label>
                  <Select value={supplierFilter} onValueChange={setSupplierFilter}>
                    <SelectTrigger className="h-10 border-gray-200 shadow-sm">
                      <SelectValue placeholder="Todos" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos os fornecedores</SelectItem>
                      {getUniqueSuppliers().map(supplier => (
                        <SelectItem key={supplier} value={supplier.toLowerCase()}>
                          {supplier}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row justify-between items-center gap-4">

                <div className="flex flex-wrap gap-3">

                  <Select value={`${sortBy}-${sortOrder}`} onValueChange={(value) => {
                    const [field, order] = value.split('-');
                    setSortBy(field);
                    setSortOrder(order);
                  }}>
                    <SelectTrigger className="w-48 h-10 border-gray-200 shadow-sm">
                      <SortAsc className="h-4 w-4 mr-2" />
                      <SelectValue placeholder="Ordenar por" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="name-asc">Nome (A-Z)</SelectItem>
                      <SelectItem value="name-desc">Nome (Z-A)</SelectItem>
                      <SelectItem value="price-asc">Preço (Menor)</SelectItem>
                      <SelectItem value="price-desc">Preço (Maior)</SelectItem>
                      <SelectItem value="supplier-asc">Fornecedor (A-Z)</SelectItem>
                    </SelectContent>
                  </Select>

                  <div className="flex border border-gray-200 rounded-lg shadow-sm">
                    <Button
                      variant={viewMode === 'table' ? 'default' : 'ghost'}
                      size="sm"
                      onClick={() => setViewMode('table')}
                      className="rounded-r-none h-10 px-3"
                    >
                      <List className="h-4 w-4" />
                    </Button>
                    <Button
                      variant={viewMode === 'grid' ? 'default' : 'ghost'}
                      size="sm"
                      onClick={() => setViewMode('grid')}
                      className="rounded-l-none h-10 px-3"
                    >
                      <Grid3X3 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={clearAllFilters}
                    className="h-10 px-4 shadow-sm"
                  >
                    <Filter className="h-4 w-4 mr-2" />
                    Limpar Filtros
                  </Button>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={refreshData}
                    disabled={refreshing}
                    className="h-10 px-4 shadow-sm"
                  >
                    <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="flex flex-col sm:flex-row justify-between items-center mb-6 text-sm">
            <div className="text-gray-600 mb-2 sm:mb-0">
              <span className="font-semibold text-gray-900">{filteredProducts.length}</span> produto{filteredProducts.length !== 1 ? 's' : ''} encontrado{filteredProducts.length !== 1 ? 's' : ''}
              {searchTerm && ` para "${searchTerm}"`}

              {(() => {
                const activeFilters = [
                  categoryFilter !== 'all',
                  dateFilter !== 'all',
                  capacityFilter !== 'all',
                  regionFilter !== 'all',
                  colorFilter !== 'all',
                  supplierFilter !== 'all'
                ].filter(Boolean).length;
                
                return activeFilters > 0 && (
                  <span className="ml-2">
                    <Badge variant="secondary" className="bg-blue-100 text-blue-700">
                      {activeFilters} filtro{activeFilters > 1 ? 's' : ''} ativo{activeFilters > 1 ? 's' : ''}
                    </Badge>
                  </span>
                );
              })()}
            </div>
            
            <div className="text-gray-500">
              Total de {products.length} produto{products.length !== 1 ? 's' : ''} no catálogo
            </div>
          </div>
        </div>

        <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm overflow-hidden">
          <CardHeader className="border-b border-gray-100 bg-gradient-to-r from-gray-50 to-gray-100/50">
            <CardTitle className="text-2xl font-bold text-gray-900 flex items-center justify-between">
              <div className="flex items-center">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center mr-3">
                  <Store className="h-6 w-6 text-white" />
                </div>
                Catálogo de Produtos
              </div>
              <div className="flex items-center space-x-3">
                <Badge variant="secondary" className="bg-blue-100 text-blue-700 border-blue-200 px-3 py-1">
                  {filteredProducts.length} {filteredProducts.length === 1 ? 'item' : 'itens'}
                </Badge>
                {refreshing && <Loader2 className="h-5 w-5 animate-spin text-blue-600" />}
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {filteredProducts.length === 0 ? (
              <div className="text-center py-20">
                <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-gray-100 to-gray-200 rounded-2xl flex items-center justify-center">
                  <Package className="h-12 w-12 text-gray-400" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  {searchTerm ? 'Nenhum produto encontrado' : 'Nenhum produto disponível'}
                </h3>
                <p className="text-gray-500 text-lg mb-6 max-w-md mx-auto">
                  {searchTerm 
                    ? 'Tente ajustar os filtros ou termos de busca para encontrar produtos.' 
                    : 'No momento não há produtos cadastrados no sistema.'
                  }
                </p>
                {(searchTerm || categoryFilter !== 'all' || dateFilter !== 'all' || capacityFilter !== 'all' || regionFilter !== 'all' || colorFilter !== 'all' || supplierFilter !== 'all') && (
                  <Button 
                    variant="outline" 
                    onClick={clearAllFilters}
                    className="shadow-sm"
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Limpar todos os filtros
                  </Button>
                )}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-gray-100 bg-gradient-to-r from-gray-50/80 to-gray-100/80 hover:from-gray-100 hover:to-gray-200/80 transition-all duration-200">
                      <TableHead 
                        className="font-bold text-gray-700 cursor-pointer hover:text-blue-600 transition-colors py-4"
                        onClick={() => toggleSort('name')}
                      >
                        <div className="flex items-center">
                          Produto
                          {sortBy === 'name' && (
                            <div className="ml-2 p-1 bg-blue-100 rounded">
                              {sortOrder === 'asc' ? <SortAsc className="h-3 w-3 text-blue-600" /> : <SortDesc className="h-3 w-3 text-blue-600" />}
                            </div>
                          )}
                        </div>
                      </TableHead>
                      <TableHead 
                        className="font-bold text-gray-700 cursor-pointer hover:text-blue-600 transition-colors py-4"
                        onClick={() => toggleSort('supplier')}
                      >
                        <div className="flex items-center">
                          Fornecedor
                          {sortBy === 'supplier' && (
                            <div className="ml-2 p-1 bg-blue-100 rounded">
                              {sortOrder === 'asc' ? <SortAsc className="h-3 w-3 text-blue-600" /> : <SortDesc className="h-3 w-3 text-blue-600" />}
                            </div>
                          )}
                        </div>
                      </TableHead>
                      <TableHead className="font-bold text-gray-700 py-4">Storage</TableHead>
                      <TableHead className="font-bold text-gray-700 py-4">Cor</TableHead>
                      <TableHead className="font-bold text-gray-700 py-4">Categoria</TableHead>
                      <TableHead className="font-bold text-gray-700 py-4">Região</TableHead>
                      <TableHead 
                        className="font-bold text-gray-700 cursor-pointer hover:text-blue-600 transition-colors py-4"
                        onClick={() => toggleSort('price')}
                      >
                        <div className="flex items-center">
                          Preço
                          {sortBy === 'price' && (
                            <div className="ml-2 p-1 bg-blue-100 rounded">
                              {sortOrder === 'asc' ? <SortAsc className="h-3 w-3 text-blue-600" /> : <SortDesc className="h-3 w-3 text-blue-600" />}
                            </div>
                          )}
                        </div>
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredProducts.map((product, index) => {
                      const category = product.category ? 
                        { name: product.category, color: 'bg-blue-100 text-blue-700 border-blue-200', icon: Package } :
                        getProductCategory(product.supplier.name);
                      const IconComponent = category.icon;
                      
                      return (
                        <TableRow 
                          key={product.id} 
                          className={`border-gray-100 hover:bg-gradient-to-r hover:from-blue-50/50 hover:to-purple-50/50 transition-all duration-300 group ${
                            index % 2 === 0 ? 'bg-white' : 'bg-gray-50/30'
                          }`}
                        >

                          <TableCell className="py-4">
                            <div className="flex items-start space-x-3">
                              <div className="flex-shrink-0">
                                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center shadow-md group-hover:shadow-lg transition-all duration-300">
                                  <IconComponent className="h-6 w-6 text-white" />
                                </div>
                              </div>
                              <div className="flex-1 min-w-0">
                                <h3 className="font-semibold text-gray-900 mb-1 group-hover:text-blue-600 transition-colors">
                                  {product.name}
                                </h3>
                                <p className="text-sm text-gray-600 line-clamp-1 max-w-xs leading-relaxed">
                                  {product.description}
                                </p>
                              </div>
                            </div>
                          </TableCell>

                          <TableCell className="py-4">
                            <div className="space-y-1">
                              <p className="font-semibold text-gray-900">{product.supplier.name}</p>
                              <div className="flex items-center text-sm text-gray-500">
                                <Store className="h-3 w-3 mr-1" />
                                <span className="bg-gray-100 px-2 py-1 rounded text-xs">
                                  {product.supplier.whatsappNumber}
                                </span>
                              </div>
                            </div>
                          </TableCell>

                          <TableCell className="py-4">
                            {product.storage ? (
                              <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-300">
                                <HardDrive className="h-3 w-3 mr-1" />
                                {product.storage}
                              </Badge>
                            ) : (
                              <span className="text-gray-400 text-sm">N/A</span>
                            )}
                          </TableCell>

                          <TableCell className="py-4">
                            {product.color ? (
                              <div className="flex items-center space-x-2">
                                <span className="text-lg">{getColorEmoji(product.color)}</span>
                                <span className="text-sm font-medium text-gray-700">{product.color}</span>
                              </div>
                            ) : (
                              <span className="text-gray-400 text-sm">N/A</span>
                            )}
                          </TableCell>

                          <TableCell className="py-4">
                            <Badge className={`${category.color} border font-medium shadow-sm`}>
                              <IconComponent className="h-3 w-3 mr-1" />
                              {category.name}
                            </Badge>
                          </TableCell>

                          <TableCell className="py-4">
                            {product.region ? (
                              <div className="flex items-center space-x-1">
                                <Globe className="h-4 w-4 text-gray-500" />
                                <span className="text-sm font-medium text-gray-700">{product.region}</span>
                              </div>
                            ) : (
                              <span className="text-gray-400 text-sm">N/A</span>
                            )}
                          </TableCell>

                          <TableCell className="py-4">
                            <div className="text-right space-y-1">
                              <div className="text-xl font-bold text-green-600">
                                {formatPrice(product.price)}
                              </div>
                              <div className="text-xs text-gray-500 bg-green-50 px-2 py-1 rounded-full inline-block">
                                à vista
                              </div>
                              <div className="flex justify-end mt-2 gap-1">
                                <Button asChild variant="outline" size="sm" className="h-8 shadow-sm hover:bg-blue-50 hover:border-blue-200 transition-all duration-200">
                                  <Link to={`/products/${product.id}`}>
                                    <Eye className="h-3 w-3 mr-1" />
                                    Ver
                                  </Link>
                                </Button>
                                <WhatsAppButton
                                  whatsappNumber={product.supplier.whatsappNumber}
                                  productName={product.name}
                                  supplierName={product.supplier.name}
                                  className="h-8 px-2 text-xs shadow-sm hover:shadow-md transition-all duration-200"
                                  variant="default"
                                />
                              </div>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Products;