import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Building, Package, Layers, TrendingDown, Smartphone, Search } from 'lucide-react';
import api from '@/lib/axios';

export default function SupplierDetailsModal({ open, onOpenChange, supplier, selectedDate }) {
  const [loading, setLoading] = useState(false);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [stats, setStats] = useState({
    totalProducts: 0,
    uniqueVariants: 0,
    lowestPriceCount: 0
  });
  const [products, setProducts] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  useEffect(() => {
    if (open && supplier) {
      fetchSupplierDetails();
      fetchSupplierProducts();
    }
  }, [open, supplier, selectedDate]);

  const fetchSupplierDetails = async () => {
    try {
      setLoading(true);
      
      const params = new URLSearchParams();
      params.append('supplierName', supplier.name);
      if (selectedDate) {
        params.append('date', selectedDate);
      }
      
      const response = await api.get(`/suppliers/details?${params.toString()}`);
      setStats(response.data);
    } catch (error) {
      console.error('Erro ao buscar detalhes do fornecedor:', error);
      setStats({
        totalProducts: 0,
        uniqueVariants: 0,
        lowestPriceCount: 0,
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchSupplierProducts = async () => {
    try {
      setLoadingProducts(true);
      
      const params = new URLSearchParams();
      params.append('suppliers', supplier.name);
      if (selectedDate) {
        params.append('date', selectedDate);
      }
      
      const response = await api.get(`/products?${params.toString()}`);
      setProducts(response.data.data || []);
    } catch (error) {
      console.error('Erro ao buscar produtos do fornecedor:', error);
      setProducts([]);
    } finally {
      setLoadingProducts(false);
    }
  };

  const formatCurrency = (value) => {
    if (value === undefined || value === null) return '-';
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 2,
    }).format(Number(value));
  };

  const isLowestPrice = (product, productsList) => {
    const similarProducts = productsList.filter(p => 
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

  const filteredProducts = products
    .filter(product => {
      if (!searchTerm.trim()) return true;
      
      const searchLower = searchTerm.toLowerCase();
      return (
        product.name?.toLowerCase().includes(searchLower) ||
        product.storage?.toLowerCase().includes(searchLower) ||
        product.color?.toLowerCase().includes(searchLower) ||
        product.region?.toLowerCase().includes(searchLower) ||
        product.category?.toLowerCase().includes(searchLower)
      );
    })
    .sort((a, b) => {

      const aIsLowest = isLowestPrice(a, products);
      const bIsLowest = isLowestPrice(b, products);
      
      if (aIsLowest && !bIsLowest) return -1;
      if (!aIsLowest && bIsLowest) return 1;

      return Number(a.price || 0) - Number(b.price || 0);
    });

  if (!supplier) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="!max-w-[95vw] sm:!max-w-[700px] md:!max-w-[900px] lg:!max-w-[1100px] max-h-[90vh] overflow-hidden flex flex-col p-4 sm:p-6">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg sm:text-xl">
            <Building className="h-5 w-5 text-primary" />
            <span>{supplier.name}</span>
          </DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : (
          <div className="flex flex-col gap-4 overflow-hidden">

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950/20 dark:to-blue-900/20 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
                <div className="flex items-center gap-2 mb-2">
                  <div className="bg-blue-500 rounded-lg p-1.5">
                    <Package className="h-4 w-4 text-white" />
                  </div>
                  <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    Total de Produtos
                  </span>
                </div>
                <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                  {stats.totalProducts.toLocaleString('pt-BR')}
                </div>
              </div>

              <div className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950/20 dark:to-purple-900/20 rounded-lg p-4 border border-purple-200 dark:border-purple-800">
                <div className="flex items-center gap-2 mb-2">
                  <div className="bg-purple-500 rounded-lg p-1.5">
                    <Layers className="h-4 w-4 text-white" />
                  </div>
                  <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    Variantes Únicas
                  </span>
                </div>
                <div className="text-3xl font-bold text-purple-600 dark:text-purple-400">
                  {stats.uniqueVariants.toLocaleString('pt-BR')}
                </div>
              </div>

              <div className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950/20 dark:to-green-900/20 rounded-lg p-4 border border-green-200 dark:border-green-800">
                <div className="flex items-center gap-2 mb-2">
                  <div className="bg-green-500 rounded-lg p-1.5">
                    <TrendingDown className="h-4 w-4 text-white" />
                  </div>
                  <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    Menores Preços
                  </span>
                </div>
                <div className="text-3xl font-bold text-green-600 dark:text-green-400">
                  {stats.lowestPriceCount.toLocaleString('pt-BR')}
                </div>
              </div>
            </div>

            <div className="flex-1 overflow-hidden flex flex-col">
              <div className="flex items-center justify-between gap-3 mb-3">
                <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                  <Smartphone className="h-4 w-4" />
                  Produtos ({filteredProducts.length})
                </h3>
                <div className="relative flex-1 max-w-xs">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                  <Input
                    type="text"
                    placeholder="Buscar produtos..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9 h-8 text-sm shadow-none focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:border-primary"
                  />
                </div>
              </div>
              
              {loadingProducts ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                </div>
              ) : filteredProducts.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Package className="h-8 w-8 mx-auto mb-2 opacity-20" />
                  <p className="text-sm">
                    {searchTerm.trim() ? 'Nenhum produto encontrado com esse termo' : 'Nenhum produto encontrado'}
                  </p>
                </div>
              ) : (
                <div className="overflow-y-auto space-y-2 pr-2 flex-1">
                  {filteredProducts.map((product) => (
                    <div
                      key={product.id}
                      className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-sm truncate">{product.name}</div>
                        <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                          <span>{product.storage || 'N/A'}</span>
                          <span>•</span>
                          <span>{product.color || 'N/A'}</span>
                          <span>•</span>
                          <span>{product.region || 'N/A'}</span>
                        </div>
                      </div>
                      <div className="text-right ml-4">
                        <div className={`font-bold text-sm ${
                          isLowestPrice(product, products) 
                            ? 'text-green-600 dark:text-green-400' 
                            : 'text-foreground'
                        }`}>
                          {formatCurrency(product.price)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {selectedDate && (
              <div className="text-center text-xs text-muted-foreground pt-2 border-t">
                📅 Dados referentes à data: {selectedDate.replace('-', '/')}
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
