import { useState, useEffect } from 'react';
import { api } from '../contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Loader2, 
  Award, 
  Star, 
  Building, 
  Save, 
  X, 
  ArrowUp, 
  ArrowDown,
  Info,
  Trophy,
  Search
} from 'lucide-react';

const SupplierPriorityManager = () => {
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [editingPriorities, setEditingPriorities] = useState({});
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchSuppliers();
  }, []);

  const fetchSuppliers = async () => {
    try {
      setLoading(true);
      const response = await api.get('/suppliers/stats');

      const sortedSuppliers = response.data.suppliers.sort((a, b) => {
        if (a.priority !== null && b.priority !== null) {
          return a.priority - b.priority;
        }
        if (a.priority !== null) return -1;
        if (b.priority !== null) return 1;
        return a.name.localeCompare(b.name);
      });
      
      setSuppliers(sortedSuppliers);

      const initialPriorities = {};
      sortedSuppliers.forEach(supplier => {
        initialPriorities[supplier.id] = supplier.priority || '';
      });
      setEditingPriorities(initialPriorities);
    } catch (error) {
      console.error('Erro ao buscar fornecedores:', error);
      setMessage({ type: 'error', text: 'Erro ao carregar fornecedores' });
    } finally {
      setLoading(false);
    }
  };

  const handlePriorityChange = (supplierId, value) => {
    setEditingPriorities(prev => ({
      ...prev,
      [supplierId]: value === '' ? '' : parseInt(value) || ''
    }));
  };

  const handleSavePriority = async (supplier) => {
    try {
      setSaving(true);
      const priority = editingPriorities[supplier.id] === '' ? null : parseInt(editingPriorities[supplier.id]);
      
      await api.put(`/suppliers/${supplier.id}`, {
        priority: priority
      });

      setSuppliers(prev => 
        prev.map(s => s.id === supplier.id ? { ...s, priority } : s)
          .sort((a, b) => {
            if (a.priority !== null && b.priority !== null) {
              return a.priority - b.priority;
            }
            if (a.priority !== null) return -1;
            if (b.priority !== null) return 1;
            return a.name.localeCompare(b.name);
          })
      );

      setMessage({ 
        type: 'success', 
        text: `Prioridade de ${supplier.name} atualizada com sucesso!` 
      });
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
    } catch (error) {
      console.error('Erro ao salvar prioridade:', error);
      setMessage({ 
        type: 'error', 
        text: 'Erro ao salvar prioridade' 
      });
    } finally {
      setSaving(false);
    }
  };

  const handleRemovePriority = async (supplier) => {
    try {
      setSaving(true);
      await api.put(`/suppliers/${supplier.id}`, {
        priority: null
      });

      setSuppliers(prev => 
        prev.map(s => s.id === supplier.id ? { ...s, priority: null } : s)
          .sort((a, b) => {
            if (a.priority !== null && b.priority !== null) {
              return a.priority - b.priority;
            }
            if (a.priority !== null) return -1;
            if (b.priority !== null) return 1;
            return a.name.localeCompare(b.name);
          })
      );

      setEditingPriorities(prev => ({
        ...prev,
        [supplier.id]: ''
      }));

      setMessage({ 
        type: 'success', 
        text: `Patrocínio de ${supplier.name} removido com sucesso!` 
      });
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
    } catch (error) {
      console.error('Erro ao remover prioridade:', error);
      setMessage({ 
        type: 'error', 
        text: 'Erro ao remover prioridade' 
      });
    } finally {
      setSaving(false);
    }
  };

  const getPriorityBadge = (priority) => {
    if (!priority) return null;
    
    const colors = {
      1: 'bg-yellow-500 text-white',
      2: 'bg-neutral-400 text-white',
      3: 'bg-orange-600 text-white',
    };

    const icons = {
      1: <Trophy className="h-3 w-3" />,
      2: <Star className="h-3 w-3" />,
      3: <Award className="h-3 w-3" />,
    };

    return (
      <Badge className={`${colors[priority] || 'bg-blue-500 text-white'} flex items-center gap-1`}>
        {icons[priority] || <Star className="h-3 w-3" />}
        Prioridade {priority}
      </Badge>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const filteredSuppliers = suppliers.filter(supplier =>
    supplier.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-6">
          <CardTitle className="flex items-center gap-2">
            Gestão de Patrocínio de Fornecedores
          </CardTitle>
          <CardDescription className="mt-2">
            Defina a prioridade dos fornecedores nas buscas. Menor número = maior prioridade.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">

          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Buscar fornecedor..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          {message.text && (
            <Alert variant={message.type === 'error' ? 'destructive' : 'default'}>
              <AlertDescription>{message.text}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-3">
            {filteredSuppliers.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                Nenhum fornecedor encontrado
              </div>
            ) : (
              filteredSuppliers.map((supplier) => (
              <Card key={supplier.id} className="border-l-4" style={{
                borderLeftColor: supplier.priority ? '#fbbf24' : '#e5e7eb'
              }}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3 flex-1">
                      <Building className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{supplier.name}</span>
                          {getPriorityBadge(supplier.priority)}
                        </div>
                        <span className="text-sm text-muted-foreground">
                          {supplier.productCount} produtos
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Input
                        type="number"
                        min="1"
                        placeholder="Prioridade"
                        value={editingPriorities[supplier.id] || ''}
                        onChange={(e) => handlePriorityChange(supplier.id, e.target.value)}
                        className="w-28"
                        disabled={saving}
                      />
                      
                      <Button
                        size="sm"
                        onClick={() => handleSavePriority(supplier)}
                        disabled={saving || editingPriorities[supplier.id] === supplier.priority}
                      >
                        {saving ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <>
                            <Save className="h-4 w-4 mr-1" />
                            Salvar
                          </>
                        )}
                      </Button>

                      {supplier.priority && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleRemovePriority(supplier)}
                          disabled={saving}
                        >
                          <X className="h-4 w-4 mr-1" />
                          Remover
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SupplierPriorityManager;
