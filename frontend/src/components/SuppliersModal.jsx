import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Building, Eye, Package, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import api from '@/lib/axios';
import SupplierDetailsModal from './SupplierDetailsModal';

const SuppliersModal = ({ open, onOpenChange, selectedDate }) => {
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [stats, setStats] = useState({
    totalSuppliers: 0,
    activeSuppliers: 0,
    inactiveSuppliers: 0,
    totalProducts: 0,
    suppliers: [],
  });
  
  const [filteredSuppliers, setFilteredSuppliers] = useState([]);
  const [selectedSupplier, setSelectedSupplier] = useState(null);
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);

  useEffect(() => {
    if (open) {
      fetchSupplierStats();
    }
  }, [open, selectedDate]);

  useEffect(() => {
    if (searchTerm.trim() === '') {
      setFilteredSuppliers(stats.suppliers || []);
    } else {
      const filtered = (stats.suppliers || []).filter(supplier =>
        supplier.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredSuppliers(filtered);
    }
  }, [searchTerm, stats.suppliers]);

  const fetchSupplierStats = async () => {
    try {
      setLoading(true);

      const params = new URLSearchParams();
      if (selectedDate) {
        params.append('date', selectedDate);
      }
      
      const url = `/suppliers/stats${params.toString() ? `?${params.toString()}` : ''}`;
      console.log('🏪 Fetching supplier stats with URL:', url, 'selectedDate:', selectedDate);
      
      const response = await api.get(url);
      setStats(response.data || {
        totalSuppliers: 0,
        activeSuppliers: 0,
        inactiveSuppliers: 0,
        totalProducts: 0,
        suppliers: [],
      });
      setFilteredSuppliers(response.data?.suppliers || []);
    } catch (error) {
      console.error('Erro ao buscar estatísticas de fornecedores:', error);

      setStats({
        totalSuppliers: 0,
        activeSuppliers: 0,
        inactiveSuppliers: 0,
        totalProducts: 0,
        suppliers: [],
      });
      setFilteredSuppliers([]);
    } finally {
      setLoading(false);
    }
  };

  const handleViewSupplierProducts = (supplierName) => {
    onOpenChange(false);
    
    window.dispatchEvent(new CustomEvent('filterBySupplier', { 
      detail: { supplierName } 
    }));
  };

  const handleSupplierClick = (supplier) => {
    setSelectedSupplier(supplier);
    setDetailsModalOpen(true);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="!max-w-[95vw] sm:!max-w-[600px] md:!max-w-[700px] lg:!max-w-[900px] xl:!max-w-[1000px] max-h-[90vh] overflow-hidden flex flex-col p-4 sm:p-6">
        <DialogHeader>
          <DialogTitle className="flex flex-col sm:flex-row items-start sm:items-center gap-2 text-lg sm:text-xl">
            <div className="flex items-center gap-2">
              <Building className="h-5 w-5" />
              <span>Lista de Fornecedores</span>
            </div>
            <span className="text-xs sm:text-sm text-muted-foreground font-normal sm:ml-auto">
              {stats.totalSuppliers} de {stats.totalSuppliers}
            </span>
          </DialogTitle>
          <DialogDescription className="text-sm">
            Visualize todos os fornecedores disponíveis e seus produtos
            {selectedDate ? (
              <span className="block text-xs text-muted-foreground mt-1">
                📅 Dados da data: {selectedDate.replace('-', '/')}
              </span>
            ) : (
              <span className="block text-xs text-muted-foreground mt-1">
                📅 Dados da data mais recente
              </span>
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Buscar fornecedor..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        <div className="flex-1 overflow-y-auto space-y-2 pr-2">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : !filteredSuppliers || filteredSuppliers.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Building className="h-12 w-12 mx-auto mb-4 opacity-20" />
              <p>Nenhum fornecedor encontrado</p>
            </div>
          ) : (
            filteredSuppliers.map((supplier) => (
              <div
                key={supplier.id}
                className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center gap-3 flex-1">
                  <div className="bg-primary/10 rounded-lg p-2">
                    <Building className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 
                        className="font-medium text-foreground truncate hover:text-primary cursor-pointer transition-colors"
                        onClick={() => handleSupplierClick(supplier)}
                      >
                        {supplier.name}
                      </h3>
                      {supplier.isActive && (
                        <Badge variant="outline" className="bg-green-50 dark:bg-green-950/20 text-green-700 dark:text-green-400 border-green-200 dark:border-green-800">
                          Ativo
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5 text-sm text-muted-foreground mt-1">
                      <Package className="h-3.5 w-3.5" />
                      <span>{supplier.productCount} produtos disponíveis</span>
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => handleViewSupplierProducts(supplier.name)}
                  className="flex items-center gap-1.5 text-sm font-medium text-primary hover:text-primary/80 transition-colors px-3 py-1.5 rounded-md hover:bg-primary/10"
                  disabled={supplier.productCount === 0}
                >
                  <Eye className="h-4 w-4" />
                  Ver Todos
                </button>
              </div>
            ))
          )}
        </div>

        {!loading && (
          <div className="grid grid-cols-3 gap-4 mb-4">
            <div className="bg-blue-50 dark:bg-blue-950/20 rounded-lg p-4 text-center">
              <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                {stats.totalSuppliers || 0}
              </div>
              <div className="text-sm text-muted-foreground uppercase tracking-wide">
                Total Disponível
              </div>
            </div>
            <div className="bg-green-50 dark:bg-green-950/20 rounded-lg p-4 text-center">
              <div className="text-3xl font-bold text-green-600 dark:text-green-400">
                {stats.activeSuppliers || 0}
              </div>
              <div className="text-sm text-muted-foreground uppercase tracking-wide">
                Ativos
              </div>
            </div>
            <div className="bg-purple-50 dark:bg-purple-950/20 rounded-lg p-4 text-center">
              <div className="text-3xl font-bold text-purple-600 dark:text-purple-400">
                {(stats.totalProducts || 0).toLocaleString('pt-BR')}
              </div>
              <div className="text-sm text-muted-foreground uppercase tracking-wide">
                Produtos Total
              </div>
            </div>
          </div>
        )}

      </DialogContent>

      <SupplierDetailsModal
        open={detailsModalOpen}
        onOpenChange={setDetailsModalOpen}
        supplier={selectedSupplier}
        selectedDate={selectedDate}
      />
    </Dialog>
  );
};

export default SuppliersModal;
