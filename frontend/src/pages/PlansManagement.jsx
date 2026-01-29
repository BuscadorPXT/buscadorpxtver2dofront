import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import api from '@/lib/axios';
import { Calendar, Check, Clock, DollarSign, Edit, MessageCircle, Plus, Power, PowerOff, Trash2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

const formatWhatsApp = (value) => {
  if (!value) return '';
  const cleaned = value.replace(/\D/g, '');

  if (cleaned.length <= 2) {
    return `+${cleaned}`;
  } else if (cleaned.length <= 4) {
    return `+${cleaned.slice(0, 2)} (${cleaned.slice(2)}`;
  } else if (cleaned.length <= 9) {
    return `+${cleaned.slice(0, 2)} (${cleaned.slice(2, 4)}) ${cleaned.slice(4)}`;
  } else {
    return `+${cleaned.slice(0, 2)} (${cleaned.slice(2, 4)}) ${cleaned.slice(4, 9)}-${cleaned.slice(9, 13)}`;
  }
};

const PlansManagement = () => {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    durationType: 'hours',
    hours: '',
    price: '',
    features: '',
    color: '#3b82f6',
    displayOrder: 0,
    whatsappNumber: '',
    maxConcurrentIps: '',
    disableSupplierContact: false,
    hideSupplier: false,
  });

  useEffect(() => {
    fetchPlans();
  }, []);

  const fetchPlans = async () => {
    setLoading(true);
    try {
      const response = await api.get('/plans');
      setPlans(response.data);
    } catch (error) {
      console.error('Erro ao buscar planos:', error);
      toast.error('Erro ao carregar planos');
    } finally {
      setLoading(false);
    }
  };

  const openModal = (plan = null) => {
    if (plan) {
      setEditingPlan(plan);
      setFormData({
        name: plan.name,
        description: plan.description || '',
        durationType: plan.durationType || 'hours',
        hours: plan.hours,
        price: plan.price,
        features: plan.features?.join('\n') || '',
        color: plan.color || '#3b82f6',
        displayOrder: plan.displayOrder || 0,
        whatsappNumber: plan.whatsappNumber || '',
        maxConcurrentIps: plan.maxConcurrentIps || '',
        disableSupplierContact: plan.disableSupplierContact || false,
        hideSupplier: plan.hideSupplier || false,
      });
    } else {
      setEditingPlan(null);
      setFormData({
        name: '',
        description: '',
        durationType: 'hours',
        hours: '',
        price: '',
        features: '',
        color: '#3b82f6',
        displayOrder: 0,
        whatsappNumber: '',
        maxConcurrentIps: '',
        disableSupplierContact: false,
        hideSupplier: false,
      });
    }
    setModalOpen(true);
  };

  const handleSubmit = async () => {
    try {

      if (!formData.name || !formData.name.trim()) {
        toast.error('Nome do plano é obrigatório');
        return;
      }

      if (!formData.hours || parseFloat(formData.hours) <= 0) {
        toast.error('Horas devem ser maior que zero');
        return;
      }

      if (!formData.price || formData.price === '' || parseFloat(formData.price) < 0) {
        toast.error('Preço é obrigatório e não pode ser negativo');
        return;
      }

      if (!formData.maxConcurrentIps || parseInt(formData.maxConcurrentIps) < 1) {
        toast.error('Quantidade de IPs simultâneos deve ser no mínimo 1');
        return;
      }

      const payload = {
        ...formData,
        hours: parseFloat(formData.hours),
        price: parseFloat(formData.price),
        displayOrder: parseInt(formData.displayOrder) || 0,
        maxConcurrentIps: parseInt(formData.maxConcurrentIps),
        features: formData.features.split('\n').filter(f => f.trim()),
      };

      if (editingPlan) {
        await api.put(`/plans/${editingPlan.id}`, payload);
        toast.success('Plano atualizado com sucesso!');
      } else {
        await api.post('/plans', payload);
        toast.success('Plano criado com sucesso!');
      }

      setModalOpen(false);
      fetchPlans();
    } catch (error) {
      console.error('Erro ao salvar plano:', error);
      toast.error('Erro ao salvar plano');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Tem certeza que deseja excluir este plano?')) return;

    try {
      await api.delete(`/plans/${id}`);
      toast.success('Plano excluído com sucesso!');
      fetchPlans();
    } catch (error) {
      console.error('Erro ao excluir plano:', error);
      toast.error('Erro ao excluir plano');
    }
  };

  const handleToggleActive = async (id) => {
    try {
      await api.patch(`/plans/${id}/toggle`);
      toast.success('Status atualizado!');
      fetchPlans();
    } catch (error) {
      console.error('Erro ao atualizar status:', error);
      toast.error('Erro ao atualizar status');
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Gerenciamento de Planos</h1>
          <p className="text-muted-foreground">Crie e gerencie os planos disponíveis</p>
        </div>
        <Button onClick={() => openModal()}>
          <Plus className="w-4 h-4 mr-2" />
          Novo Plano
        </Button>
      </div>

      {loading ? (
        <Card>
          <CardContent className="flex items-center justify-center h-64">
            <p>Carregando...</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {plans.map((plan) => (
            <Card
              key={plan.id}
              className="hover:shadow-lg transition-shadow relative"
              style={{ borderTop: `4px solid ${plan.color}`, opacity: plan.isActive ? 1 : 0.6 }}
            >
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-xl">{plan.name}</CardTitle>
                    <CardDescription>{plan.description}</CardDescription>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleToggleActive(plan.id)}
                    title={plan.isActive ? 'Desativar' : 'Ativar'}
                  >
                    {plan.isActive ? (
                      <Power className="h-4 w-4 text-green-600" />
                    ) : (
                      <PowerOff className="h-4 w-4 text-gray-400" />
                    )}
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-baseline gap-2">
                  <DollarSign className="h-5 w-5 text-muted-foreground" />
                  <span className="text-2xl font-bold">
                    R$ {parseFloat(plan.price).toFixed(2)}
                  </span>
                </div>

                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  {plan.durationType === 'days' ? (
                    <>
                      <Calendar className="h-4 w-4" />
                      <span>{plan.hours} {plan.hours === 1 ? 'dia' : 'dias'}</span>
                    </>
                  ) : (
                    <>
                      <Clock className="h-4 w-4" />
                      <span>{plan.hours}h de uso</span>
                    </>
                  )}
                </div>

                {plan.maxConcurrentIps && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Power className="h-4 w-4" />
                    <span>{plan.maxConcurrentIps} {plan.maxConcurrentIps === 1 ? 'dispositivo' : 'dispositivos'} simultâneo{plan.maxConcurrentIps !== 1 ? 's' : ''}</span>
                  </div>
                )}

                {plan.whatsappNumber && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <MessageCircle className="h-4 w-4" />
                    <span>{plan.whatsappNumber}</span>
                  </div>
                )}

                {plan.features && plan.features.length > 0 && (
                  <ul className="space-y-1">
                    {plan.features.map((feature, index) => (
                      <li key={index} className="flex items-start gap-2 text-sm">
                        <Check className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                )}

                <div className="flex gap-2 pt-2 border-t">
                  <Button variant="outline" size="sm" onClick={() => openModal(plan)} className="flex-1">
                    <Edit className="w-4 h-4 mr-1" />
                    Editar
                  </Button>
                  <Button variant="destructive" size="sm" onClick={() => handleDelete(plan.id)}>
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingPlan ? 'Editar Plano' : 'Novo Plano'}</DialogTitle>
            <DialogDescription>
              Preencha os dados do plano abaixo
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nome *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Ex: Plano Básico"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="color">Cor</Label>
                <Input
                  id="color"
                  type="color"
                  value={formData.color}
                  onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Descrição</Label>
              <Input
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Breve descrição do plano"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="durationType">Tipo de Duração *</Label>
                <Select
                  value={formData.durationType}
                  onValueChange={(value) => setFormData({ ...formData, durationType: value })}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="hours">Horas</SelectItem>
                    <SelectItem value="days">Dias</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="hours">
                  {formData.durationType === 'days' ? 'Quantidade de Dias' : 'Horas'} *
                </Label>
                <Input
                  id="hours"
                  type="number"
                  step={formData.durationType === 'days' ? '1' : '0.5'}
                  min={formData.durationType === 'days' ? '1' : '0.5'}
                  value={formData.hours}
                  onChange={(e) => setFormData({ ...formData, hours: e.target.value })}
                  placeholder={formData.durationType === 'days' ? '30' : '10'}
                  required
                />
                <p className="text-xs text-muted-foreground">
                  {formData.durationType === 'days'
                    ? 'Quantidade de dias de acesso ao sistema'
                    : 'Quantidade de horas de uso disponíveis'
                  }
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="price">Preço (R$) *</Label>
                <Input
                  id="price"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  placeholder="99.90"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="maxConcurrentIps">IPs Simultâneos *</Label>
                <Input
                  id="maxConcurrentIps"
                  type="number"
                  min="1"
                  step="1"
                  value={formData.maxConcurrentIps}
                  onChange={(e) => setFormData({ ...formData, maxConcurrentIps: e.target.value })}
                  placeholder="2"
                  required
                />
                <p className="text-xs text-muted-foreground">
                  Quantos dispositivos podem usar simultaneamente
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="displayOrder">Ordem de Exibição</Label>
              <Input
                id="displayOrder"
                type="number"
                value={formData.displayOrder}
                onChange={(e) => setFormData({ ...formData, displayOrder: e.target.value })}
                placeholder="0"
              />
              <p className="text-xs text-muted-foreground">
                Ordem em que o plano aparecerá na listagem
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="whatsapp">WhatsApp (opcional)</Label>
              <Input
                id="whatsapp"
                value={formData.whatsappNumber ? formatWhatsApp(formData.whatsappNumber) : ''}
                onChange={(e) => {
                  const value = e.target.value.replace(/\D/g, '');
                  setFormData({ ...formData, whatsappNumber: value });
                }}
                placeholder="+55 (11) 99999-9999"
                maxLength={19}
              />
              <p className="text-xs text-muted-foreground">
                Formato: +55 (11) 99999-9999
              </p>
            </div>

            <div className="space-y-4 border-t pt-4">
              <div className="flex items-start space-x-3">
                <Checkbox
                  id="disableSupplierContact"
                  checked={formData.disableSupplierContact}
                  onCheckedChange={(checked) => 
                    setFormData({ ...formData, disableSupplierContact: checked })
                  }
                />
                <div className="space-y-1">
                  <Label 
                    htmlFor="disableSupplierContact" 
                    className="cursor-pointer font-medium"
                  >
                    Desabilita contato do fornecedor
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    O botão de WhatsApp do fornecedor ficará desabilitado na página de produtos
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <Checkbox
                  id="hideSupplier"
                  checked={formData.hideSupplier}
                  onCheckedChange={(checked) => 
                    setFormData({ ...formData, hideSupplier: checked })
                  }
                />
                <div className="space-y-1">
                  <Label 
                    htmlFor="hideSupplier" 
                    className="cursor-pointer font-medium"
                  >
                    Oculta Fornecedor
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    O nome e região do fornecedor ficam embaçados e o contato desabilitado
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="features">Features (uma por linha)</Label>
              <Textarea
                id="features"
                rows={5}
                value={formData.features}
                onChange={(e) => setFormData({ ...formData, features: e.target.value })}
                placeholder="Acesso completo&#10;Suporte prioritário&#10;10 horas de uso"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setModalOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSubmit}>
              {editingPlan ? 'Atualizar' : 'Criar'} Plano
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PlansManagement;
