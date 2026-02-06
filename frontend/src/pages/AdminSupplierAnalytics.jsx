import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, ArrowLeft, TrendingUp, Users, MousePointerClick, Package } from 'lucide-react';
import api from '@/lib/axios';
import { Link } from 'react-router-dom';

const AdminSupplierAnalytics = () => {
  const { isAdmin } = useAuth();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(true);
  const [metricsLoading, setMetricsLoading] = useState(false);
  const [supplierMetrics, setSupplierMetrics] = useState([]);
  const [topProducts, setTopProducts] = useState([]);
  const [totalClicks, setTotalClicks] = useState(0);
  const [selectedSupplier, setSelectedSupplier] = useState(null);
  
  const [filters, setFilters] = useState({
    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
  });

  useEffect(() => {
    if (!isAdmin) {
      navigate('/');
      return;
    }
    loadMetrics();
  }, [isAdmin, navigate]);

  const loadMetrics = async () => {
    setMetricsLoading(true);
    try {
      const [metricsRes, totalRes] = await Promise.all([
        api.get('/supplier-clicks/metrics/suppliers', { params: filters }),
        api.get('/supplier-clicks/metrics/total', { params: filters }),
      ]);
      
      setSupplierMetrics(metricsRes.data);
      setTotalClicks(totalRes.data.total);
      
      if (selectedSupplier) {
        const productsRes = await api.get('/supplier-clicks/metrics/top-products', {
          params: { ...filters, supplierId: selectedSupplier, limit: 10 }
        });
        setTopProducts(productsRes.data);
      }
    } catch (error) {
      console.error('Erro ao carregar métricas:', error);
    } finally {
      setMetricsLoading(false);
      setLoading(false);
    }
  };

  const handleFilterChange = (field, value) => {
    setFilters(prev => ({ ...prev, [field]: value }));
  };

  const handleApplyFilters = () => {
    loadMetrics();
  };

  const handleSupplierSelect = async (supplierId) => {
    setSelectedSupplier(supplierId);
    try {
      const productsRes = await api.get('/supplier-clicks/metrics/top-products', {
        params: { ...filters, supplierId, limit: 10 }
      });
      setTopProducts(productsRes.data);
    } catch (error) {
      console.error('Erro ao carregar top produtos:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 py-4 sm:py-6 lg:py-8">
        
        <div className="mb-4 sm:mb-6">
          <Button variant="ghost" asChild className="mb-4">
            <Link to="/admin">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar ao Dashboard
            </Link>
          </Button>
          
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-neutral-900 mb-1 sm:mb-2">
            Analytics de Fornecedores
          </h1>
          <p className="text-sm sm:text-base text-neutral-600">
            Análise de cliques em links de WhatsApp dos fornecedores
          </p>
        </div>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Filtros</CardTitle>
            <CardDescription>Selecione o período para análise</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="startDate">Data Início</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={filters.startDate}
                  onChange={(e) => handleFilterChange('startDate', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="endDate">Data Fim</Label>
                <Input
                  id="endDate"
                  type="date"
                  value={filters.endDate}
                  onChange={(e) => handleFilterChange('endDate', e.target.value)}
                />
              </div>
              <div className="flex items-end">
                <Button onClick={handleApplyFilters} disabled={metricsLoading} className="w-full">
                  {metricsLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <TrendingUp className="h-4 w-4 mr-2" />
                  )}
                  Aplicar Filtros
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total de Cliques</CardTitle>
              <MousePointerClick className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalClicks.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">
                Período selecionado
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Fornecedores Ativos</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{supplierMetrics.length}</div>
              <p className="text-xs text-muted-foreground">
                Com cliques no período
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Média por Fornecedor</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {supplierMetrics.length > 0 ? Math.round(totalClicks / supplierMetrics.length) : 0}
              </div>
              <p className="text-xs text-muted-foreground">
                Cliques por fornecedor
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Ranking de Fornecedores</CardTitle>
              <CardDescription>Cliques por fornecedor no período</CardDescription>
            </CardHeader>
            <CardContent>
              {metricsLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin" />
                </div>
              ) : supplierMetrics.length === 0 ? (
                <div className="text-center py-8 text-neutral-500">
                  Nenhum dado disponível para o período selecionado
                </div>
              ) : (
                <div className="space-y-3">
                  {supplierMetrics.map((supplier, index) => (
                    <div
                      key={supplier.supplierId}
                      className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-colors ${
                        selectedSupplier === supplier.supplierId
                          ? 'bg-blue-50 border-blue-300'
                          : 'hover:bg-neutral-50'
                      }`}
                      onClick={() => handleSupplierSelect(supplier.supplierId)}
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 text-white font-bold text-sm">
                          {index + 1}
                        </div>
                        <div>
                          <div className="font-semibold">{supplier.suppliername}</div>
                          <div className="text-xs text-neutral-500">
                            {supplier.uniqueusers} usuários únicos
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-lg">{supplier.totalclicks}</div>
                        <div className="text-xs text-neutral-500">cliques</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Top 10 Produtos</CardTitle>
              <CardDescription>
                {selectedSupplier 
                  ? 'Produtos mais clicados do fornecedor selecionado' 
                  : 'Selecione um fornecedor para ver os produtos'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {!selectedSupplier ? (
                <div className="flex flex-col items-center justify-center py-12 text-neutral-500">
                  <Package className="h-12 w-12 mb-4 text-neutral-400" />
                  <p className="text-center">Selecione um fornecedor no ranking ao lado</p>
                </div>
              ) : topProducts.length === 0 ? (
                <div className="text-center py-8 text-neutral-500">
                  Nenhum produto com cliques neste período
                </div>
              ) : (
                <div className="space-y-2">
                  {topProducts.map((product, index) => (
                    <div
                      key={product.productid}
                      className="flex items-center justify-between p-3 rounded-lg border hover:bg-neutral-50 transition-colors"
                    >
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div className="flex items-center justify-center w-6 h-6 rounded-full bg-neutral-200 text-neutral-700 font-semibold text-xs flex-shrink-0">
                          {index + 1}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="font-medium truncate">{product.productname}</div>
                          <div className="text-xs text-neutral-500">{product.productcode}</div>
                        </div>
                      </div>
                      <div className="text-right flex-shrink-0 ml-2">
                        <div className="font-bold">{product.totalclicks}</div>
                        <div className="text-xs text-neutral-500">{product.uniqueusers} usuários</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default AdminSupplierAnalytics;
