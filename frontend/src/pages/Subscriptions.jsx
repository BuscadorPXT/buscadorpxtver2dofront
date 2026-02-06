import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/contexts/AuthContext';
import api from '@/lib/axios';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { AlertCircle, CheckCircle, Clock, CreditCard, DollarSign, MessageCircle, Search, Users, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { clearAccessCache } from '@/components/ProtectedRoute';

const Subscriptions = () => {
  const { user } = useAuth();
  const isAdmin = user?.isAdmin;

  const [subscriptions, setSubscriptions] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(isAdmin ? 'users' : 'all');
  const [renewModalOpen, setRenewModalOpen] = useState(false);
  const [applyPlanModalOpen, setApplyPlanModalOpen] = useState(false);
  const [selectedSubscription, setSelectedSubscription] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);
  const [renewForm, setRenewForm] = useState({
    amount: 289.90,
    paymentMethod: 'pix',
    duration: 30,
  });
  const [plans, setPlans] = useState([]);
  const [selectedPlanId, setSelectedPlanId] = useState('');
  const [useCustomDates, setUseCustomDates] = useState(false);
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  const [useCustomDatesRenew, setUseCustomDatesRenew] = useState(false);
  const [customStartDateRenew, setCustomStartDateRenew] = useState('');
  const [customEndDateRenew, setCustomEndDateRenew] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (activeTab === 'users' && isAdmin) {
      fetchUsers();
    } else if (activeTab !== 'users') {
      fetchSubscriptions();
    }
  }, [activeTab, isAdmin]);

  useEffect(() => {
    fetchPlans();
  }, []);

  const fetchSubscriptions = async () => {
    setLoading(true);
    try {
      let url = '/subscriptions';

      switch (activeTab) {
        case 'expiring5':
          url = '/subscriptions/expiring/5';
          break;
        case 'expiring3':
          url = '/subscriptions/expiring/3';
          break;
        case 'expiring2':
          url = '/subscriptions/expiring/2';
          break;
        case 'expiring1':
          url = '/subscriptions/expiring/1';
          break;
        case 'expired':
          url = '/subscriptions/expired';
          break;
        case 'inactive':
          url = '/subscriptions/inactive';
          break;
        case 'active':
          url = '/subscriptions/active';
          break;
        default:
          url = '/subscriptions';
      }

      const response = await api.get(url);
      setSubscriptions(response.data);
    } catch (error) {
      console.error('Erro ao buscar assinaturas:', error);
      toast.error('Erro ao carregar assinaturas');
    } finally {
      setLoading(false);
    }
  };

  const openRenewModal = (subscription) => {
    setSelectedSubscription(subscription);

    const currentPlan = plans.find(p =>
      p.durationType === subscription.durationType &&
      p.hours === subscription.hoursAvailable
    );

    setSelectedPlanId(currentPlan?.id || '');
    setRenewForm({
      amount: subscription.amount || 289.90,
      paymentMethod: subscription.paymentMethod || 'pix',
      duration: currentPlan?.hours || 30,
    });
    setRenewModalOpen(true);
  };

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const [usersResponse, subscriptionsResponse] = await Promise.all([
        api.get('/users'),
        api.get('/subscriptions'),
      ]);

      const usersWithSubscriptions = usersResponse.data.map(user => {
        const subscription = subscriptionsResponse.data.find(sub => sub.userId === user.id);
        return {
          ...user,
          subscription: subscription || null,
        };
      });

      setUsers(usersWithSubscriptions);
    } catch (error) {
      console.error('Erro ao buscar usuários:', error);
      toast.error('Erro ao carregar usuários');
    } finally {
      setLoading(false);
    }
  };

  const fetchPlans = async () => {
    try {
      const response = await api.get('/plans?activeOnly=true');
      setPlans(response.data);
    } catch (error) {
      console.error('Erro ao buscar planos:', error);
      toast.error('Erro ao carregar planos');
    }
  };

  const openApplyPlanModal = (user) => {
    setSelectedUser(user);
    setSelectedSubscription(user.subscription);
    setSelectedPlanId('');
    setUseCustomDates(false);
    setCustomStartDate('');
    setCustomEndDate('');
    setApplyPlanModalOpen(true);
  };

  const handleApplyPlan = async () => {
    if (!selectedUser || !selectedPlanId) {
      toast.error('Selecione um plano');
      return;
    }

    if (useCustomDates && (!customStartDate || !customEndDate)) {
      toast.error('Preencha as datas de início e fim');
      return;
    }

    if (useCustomDates && new Date(customEndDate) <= new Date(customStartDate)) {
      toast.error('A data de fim deve ser maior que a data de início');
      return;
    }

    try {
      const payload = {
        userId: selectedUser.id,
        planId: selectedPlanId,
      };

      if (useCustomDates) {
        payload.startDate = new Date(customStartDate).toISOString();
        payload.endDate = new Date(customEndDate).toISOString();
      }

      await api.post('/subscriptions/apply-plan', payload);

      clearAccessCache();
      
      toast.success('Plano aplicado com sucesso!');
      setApplyPlanModalOpen(false);

      if (activeTab === 'users') {
        fetchUsers();
      } else {
        fetchSubscriptions();
      }
    } catch (error) {
      console.error('Erro ao aplicar plano:', error);
      toast.error(error.response?.data?.message || 'Erro ao aplicar plano');
    }
  };

  const handleRenew = async () => {
    if (!selectedSubscription) return;

    try {
      const selectedPlan = plans.find(p => p.id === selectedPlanId);
      const payload = { 
        ...renewForm,

        durationType: selectedPlan?.durationType || selectedSubscription.durationType
      };
      
      if (useCustomDatesRenew && customStartDateRenew && customEndDateRenew) {
        payload.startDate = new Date(customStartDateRenew).toISOString();
        payload.endDate = new Date(customEndDateRenew).toISOString();
      }
      
      await api.post(`/subscriptions/${selectedSubscription.id}/renew`, payload);

      clearAccessCache();

      const isExpired = new Date(selectedSubscription.endDate) < new Date();
      if (isExpired) {
        toast.success('Assinatura renovada com sucesso! O usuário pode acessar novamente.');
      } else {
        toast.success('Assinatura renovada com sucesso!');
      }

      setRenewModalOpen(false);
      setUseCustomDatesRenew(false);
      setCustomStartDateRenew('');
      setCustomEndDateRenew('');
      fetchSubscriptions();
    } catch (error) {
      console.error('Erro ao renovar assinatura:', error);
      toast.error('Erro ao renovar assinatura');
    }
  };

  const isSubscriptionExpired = (subscription) => {
    const now = new Date();
    const endDate = new Date(subscription.endDate);
    return endDate < now || !subscription.isActive;
  };

  const formatDuration = (value, durationType) => {
    if (!durationType || durationType === 'hours') {
      return `${value || 0}h`;
    }
    return `${Math.floor(value || 0)}d`;
  };

  const calculateRemaining = (subscription) => {
    if (!subscription) return { value: 0, unit: 'h' };

    const durationType = subscription.durationType;

    if (durationType === 'days') {

      const now = new Date();
      const endDate = new Date(subscription.endDate);
      const daysRemaining = Math.max(0, Math.ceil((endDate - now) / (1000 * 60 * 60 * 24)));
      return { value: daysRemaining, unit: 'd' };
    } else {

      const available = parseFloat(subscription.hoursAvailable) || 0;
      const used = parseFloat(subscription.hoursUsed) || 0;
      const remaining = Math.max(0, available - used);
      return { value: remaining.toFixed(2), unit: 'h' };
    }
  };

  const getStatusBadge = (subscription) => {
    const now = new Date();
    const endDate = new Date(subscription.endDate);
    const daysUntilExpiry = Math.ceil((endDate - now) / (1000 * 60 * 60 * 24));

    if (!subscription.isActive) {
      return <Badge variant="destructive">Inativo</Badge>;
    }

    if (daysUntilExpiry < 0) {
      return <Badge variant="destructive">Vencido</Badge>;
    }

    if (daysUntilExpiry <= 1) {
      return <Badge variant="destructive">Vence em {daysUntilExpiry} dia</Badge>;
    }

    if (daysUntilExpiry <= 5) {
      return <Badge variant="warning">Vence em {daysUntilExpiry} dias</Badge>;
    }

    return <Badge variant="success">Ativo</Badge>;
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const filteredUsers = users.filter(user => {
    const searchLower = searchTerm.toLowerCase();
    return (
      user.name?.toLowerCase().includes(searchLower) ||
      user.email?.toLowerCase().includes(searchLower)
    );
  });

  const stats = {
    total: subscriptions.length,
    active: subscriptions.filter(s => s.isActive && new Date(s.endDate) > new Date()).length,
    expiring: subscriptions.filter(s => {
      const days = Math.ceil((new Date(s.endDate) - new Date()) / (1000 * 60 * 60 * 24));
      return days >= 0 && days <= 5;
    }).length,
    expired: subscriptions.filter(s => new Date(s.endDate) < new Date()).length,
  };

  if (!isAdmin) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="flex flex-col items-center justify-center h-64 gap-4">
            <AlertCircle className="h-12 w-12 text-muted-foreground" />
            <div className="text-center">
              <h2 className="text-xl font-bold mb-2">Acesso Negado</h2>
              <p className="text-muted-foreground">
                Você não tem permissão para acessar esta página.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Gerenciamento de Assinaturas</h1>
          <p className="text-muted-foreground">Controle de renovações e vencimentos</p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ativos</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.active}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">A Vencer</CardTitle>
            <Clock className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.expiring}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Vencidos</CardTitle>
            <AlertCircle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.expired}</div>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className={`grid w-full ${isAdmin ? 'grid-cols-9' : 'grid-cols-8'}`}>
          {isAdmin && <TabsTrigger value="users">Usuários</TabsTrigger>}
          <TabsTrigger value="all">Todos</TabsTrigger>
          <TabsTrigger value="expiring5">5 dias</TabsTrigger>
          <TabsTrigger value="expiring3">3 dias</TabsTrigger>
          <TabsTrigger value="expiring2">2 dias</TabsTrigger>
          <TabsTrigger value="expiring1">1 dia</TabsTrigger>
          <TabsTrigger value="expired">Vencidos</TabsTrigger>
          <TabsTrigger value="inactive">Inativos</TabsTrigger>
          <TabsTrigger value="active">Ativos</TabsTrigger>
        </TabsList>

        {isAdmin && (
          <TabsContent value="users" className="space-y-4 mt-6">
            {loading ? (
              <Card>
                <CardContent className="flex items-center justify-center h-64">
                  <p>Carregando...</p>
                </CardContent>
              </Card>
            ) : users.length === 0 ? (
              <Card>
                <CardContent className="flex items-center justify-center h-64">
                  <p className="text-muted-foreground">Nenhum usuário encontrado</p>
                </CardContent>
              </Card>
            ) : (
              <>

                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm text-muted-foreground">
                    {filteredUsers.length} de {users.length} usuário{users.length !== 1 ? 's' : ''}
                  </p>
                </div>
                <div className="flex items-center gap-4 mb-4">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Buscar por nome ou email..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 pr-24 bg-white"
                    />
                    {searchTerm && (
                      <>
                        <button
                          onClick={() => setSearchTerm('')}
                          className="absolute right-20 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
                        >
                          <X className="h-4 w-4" />
                        </button>
                        <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-xs text-muted-foreground">
                          {filteredUsers.length} resultado{filteredUsers.length !== 1 ? 's' : ''}
                        </div>
                      </>
                    )}
                  </div>
                </div>

                {filteredUsers.length === 0 ? (
                  <Card>
                    <CardContent className="flex items-center justify-center h-32">
                      <p className="text-muted-foreground">Nenhum usuário encontrado com "{searchTerm}"</p>
                    </CardContent>
                  </Card>
                ) : (
                  <Card>
                    <CardContent className="p-0">
                      <div className="overflow-x-auto">
                        <table className="w-full min-w-[800px]">
                          <thead className="bg-muted/50">
                            <tr>
                              <th className="text-left p-4 font-medium whitespace-nowrap">Nome</th>
                              <th className="text-left p-4 font-medium whitespace-nowrap">Email</th>
                              <th className="text-center p-4 font-medium whitespace-nowrap">WhatsApp</th>
                              <th className="text-center p-4 font-medium whitespace-nowrap">Status</th>
                              <th className="text-center p-4 font-medium whitespace-nowrap">Total</th>
                              <th className="text-center p-4 font-medium whitespace-nowrap">Restante</th>
                              <th className="text-center p-4 font-medium whitespace-nowrap">Ações</th>
                            </tr>
                          </thead>
                          <tbody>
                            {filteredUsers.map((user) => (
                              <tr key={user.id} className="border-t hover:bg-muted/30 transition-colors">
                                <td className="p-4 font-medium">{user.name}</td>
                                <td className="p-4 text-muted-foreground">{user.email}</td>
                                <td className="p-4 text-center">
                                  {user.phone ? (
                                    <a
                                      href={`https://wa.me/55${user.phone.replace(/\D/g, '')}`}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-green-600 hover:text-green-700 hover:bg-green-50 transition-colors"
                                      title={`Abrir conversa com ${user.phone}`}
                                    >
                                      <MessageCircle className="w-4 h-4" />
                                      <span className="text-sm">{user.phone}</span>
                                    </a>
                                  ) : (
                                    <span className="text-muted-foreground text-sm">-</span>
                                  )}
                                </td>
                                <td className="p-4 text-center">
                                  {user.subscription ? (
                                    getStatusBadge(user.subscription)
                                  ) : (
                                    <Badge variant="secondary">Sem Assinatura</Badge>
                                  )}
                                </td>
                                <td className="p-4 text-center">
                                  {user.subscription ? (
                                    <span className="font-medium">
                                      {formatDuration(user.subscription.hoursAvailable, user.subscription.durationType)}
                                    </span>
                                  ) : (
                                    <span className="text-muted-foreground">-</span>
                                  )}
                                </td>
                                <td className="p-4 text-center">
                                  {user.subscription ? (
                                    <span className="font-medium">
                                      {calculateRemaining(user.subscription).value}{calculateRemaining(user.subscription).unit}
                                    </span>
                                  ) : (
                                    <span className="text-muted-foreground">-</span>
                                  )}
                                </td>
                                <td className="p-4 text-center">
                                  {user.subscription && isSubscriptionExpired(user.subscription) ? (
                                    <Button
                                      size="sm"
                                      onClick={() => openRenewModal(user.subscription)}
                                      className="bg-green-600 hover:bg-green-700 text-white cursor-pointer"
                                    >
                                      <CheckCircle className="w-3 h-3 mr-1" />
                                      Renovar
                                    </Button>
                                  ) : (
                                    <Button
                                      size="sm"
                                      onClick={() => openApplyPlanModal(user)}
                                      variant="default"
                                      className="cursor-pointer"
                                    >
                                      <CreditCard className="w-3 h-3 mr-1" />
                                      Aplicar Plano
                                    </Button>
                                  )}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </>
            )}
          </TabsContent>
        )}

        {activeTab !== 'users' && (
          <TabsContent value={activeTab} className="space-y-4 mt-6">
            {loading ? (
              <Card>
                <CardContent className="flex items-center justify-center h-64">
                  <p>Carregando...</p>
                </CardContent>
              </Card>
            ) : subscriptions.length === 0 ? (
              <Card>
                <CardContent className="flex items-center justify-center h-64">
                  <p className="text-muted-foreground">Nenhuma assinatura encontrada</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {subscriptions.map((subscription) => (
                  <Card key={subscription.id} className="hover:shadow-lg transition-shadow">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-lg">{subscription.user?.name || 'Usuário'}</CardTitle>
                        {getStatusBadge(subscription)}
                      </div>
                      <CardDescription>{subscription.user?.email}</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Plano:</span>
                          <span className="font-medium capitalize">{subscription.plan}</span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Valor:</span>
                          <span className="font-medium">{formatCurrency(subscription.amount)}</span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Vencimento:</span>
                          <span className="font-medium">
                            {format(new Date(subscription.endDate), 'dd/MM/yyyy', { locale: ptBR })}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Método:</span>
                          <span className="font-medium capitalize">{subscription.paymentMethod.replace('_', ' ')}</span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">
                          {subscription.durationType === 'days' ? 'Total de Dias:' : 'Total de Horas:'}
                        </span>
                        <span className="font-medium">
                          {formatDuration(subscription.hoursAvailable, subscription.durationType)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">
                          {subscription.durationType === 'days' ? 'Dias Restantes:' : 'Horas Restantes:'}
                        </span>
                        <span className="font-medium">
                          {calculateRemaining(subscription).value}{calculateRemaining(subscription).unit}
                        </span>
                      </div>

                      {subscription.renewalHistory && subscription.renewalHistory.length > 0 && (
                        <div className="pt-2 border-t">
                          <p className="text-xs font-medium text-muted-foreground mb-2">
                            Histórico de Renovações ({subscription.renewalHistory.length})
                          </p>
                          <div className="space-y-1 max-h-24 overflow-y-auto">
                            {subscription.renewalHistory
                              .slice()
                              .reverse()
                              .slice(0, 3)
                              .map((renewal, index) => (
                                <div key={index} className="text-xs bg-muted/50 p-2 rounded">
                                  <p className="font-medium">
                                    {format(new Date(renewal.date), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                                  </p>
                                  <p className="text-muted-foreground">
                                    {formatCurrency(renewal.amount)} - {renewal.paymentMethod?.replace('_', ' ')}
                                  </p>
                                </div>
                              ))}
                          </div>
                          {subscription.renewalHistory.length > 3 && (
                            <p className="text-xs text-muted-foreground mt-1">
                              +{subscription.renewalHistory.length - 3} mais...
                            </p>
                          )}
                        </div>
                      )}

                      <div className="flex gap-2">
                        <Button
                          className="flex-1 cursor-pointer"
                          onClick={() => openApplyPlanModal({
                            id: subscription.userId,
                            name: subscription.user?.name,
                            email: subscription.user?.email,
                            subscription
                          })}
                          variant="outline"
                        >
                          <CreditCard className="w-4 h-4 mr-2" />
                          Aplicar Plano
                        </Button>
                        <Button
                          className={isSubscriptionExpired(subscription)
                            ? "flex-1 bg-green-600 hover:bg-green-700 text-white cursor-pointer"
                            : "flex-1 cursor-pointer"
                          }
                          onClick={() => openRenewModal(subscription)}
                          variant={isSubscriptionExpired(subscription) ? undefined : "default"}
                        >
                          {isSubscriptionExpired(subscription) ? (
                            <>
                              <CheckCircle className="w-4 h-4 mr-2" />
                              Renovar (Vencido)
                            </>
                          ) : (
                            <>
                              <DollarSign className="w-4 h-4 mr-2" />
                              Renovar
                            </>
                          )}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        )}
      </Tabs>

      <Dialog open={applyPlanModalOpen} onOpenChange={setApplyPlanModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Aplicar Plano</DialogTitle>
            <DialogDescription>
              {selectedUser?.name} - {selectedUser?.email}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="plan">Selecionar Plano</Label>
              <Select value={selectedPlanId} onValueChange={setSelectedPlanId}>
                <SelectTrigger>
                  <SelectValue placeholder="Escolha um plano..." />
                </SelectTrigger>
                <SelectContent>
                  {plans.map((plan) => (
                    <SelectItem key={plan.id} value={plan.id}>
                      {plan.name} - {plan.hours}{plan.durationType === 'days' ? (plan.hours === 1 ? ' dia' : ' dias') : 'h'} - {formatCurrency(plan.price)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selectedPlanId && (
              <div className="bg-muted p-4 rounded-lg space-y-2">
                <p className="text-sm font-medium">Detalhes do Plano</p>
                {plans.find(p => p.id === selectedPlanId) && (
                  <>
                    <p className="text-sm text-muted-foreground">
                      <strong>{plans.find(p => p.id === selectedPlanId).durationType === 'days' ? 'Duração:' : 'Horas:'}</strong>{' '}
                      {plans.find(p => p.id === selectedPlanId).hours}
                      {plans.find(p => p.id === selectedPlanId).durationType === 'days'
                        ? (plans.find(p => p.id === selectedPlanId).hours === 1 ? ' dia' : ' dias')
                        : 'h'
                      }
                    </p>
                    <p className="text-sm text-muted-foreground">
                      <strong>Preço:</strong> {formatCurrency(plans.find(p => p.id === selectedPlanId).price)}
                    </p>
                    {plans.find(p => p.id === selectedPlanId).description && (
                      <p className="text-sm text-muted-foreground">
                        <strong>Descrição:</strong> {plans.find(p => p.id === selectedPlanId).description}
                      </p>
                    )}
                  </>
                )}
                <div className="mt-3 pt-3 border-t">
                  {selectedSubscription ? (
                    <>
                      <p className="text-xs text-muted-foreground mb-1">
                        <strong>Saldo Atual:</strong> {formatDuration(selectedSubscription.hoursAvailable, selectedSubscription.durationType)} disponíveis
                      </p>
                      <p className="text-xs text-green-600 font-medium">
                        Novo Saldo: {formatDuration(
                          parseFloat(plans.find(p => p.id === selectedPlanId)?.hours) || 0,
                          plans.find(p => p.id === selectedPlanId)?.durationType || selectedSubscription.durationType
                        )}
                      </p>
                    </>
                  ) : (
                    <p className="text-xs text-muted-foreground">
                      Este usuário não possui assinatura. Uma nova será criada.
                    </p>
                  )}
                </div>
              </div>
            )}

            <div className="space-y-3 pt-2 border-t">
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="useCustomDates"
                  checked={useCustomDates}
                  onChange={(e) => setUseCustomDates(e.target.checked)}
                  className="h-4 w-4 rounded border-neutral-300"
                />
                <Label htmlFor="useCustomDates" className="text-sm font-medium cursor-pointer">
                  Definir datas manualmente
                </Label>
              </div>

              {useCustomDates && (
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="startDate">Data de Início</Label>
                    <Input
                      id="startDate"
                      type="datetime-local"
                      value={customStartDate}
                      onChange={(e) => setCustomStartDate(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="endDate">Data de Fim</Label>
                    <Input
                      id="endDate"
                      type="datetime-local"
                      value={customEndDate}
                      onChange={(e) => setCustomEndDate(e.target.value)}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setApplyPlanModalOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleApplyPlan} disabled={!selectedPlanId}>
              Aplicar Plano
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={renewModalOpen} onOpenChange={setRenewModalOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Renovação de Assinatura</DialogTitle>
            <DialogDescription className="text-left">
              Cliente: <strong>{selectedSubscription?.user?.name}</strong>
              <br />
              {selectedSubscription?.user?.email}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-5 py-2">
            <div className="space-y-2">
              <Label htmlFor="planSelect">Plano</Label>
              <Select
                value={selectedPlanId}
                onValueChange={(value) => {
                  setSelectedPlanId(value);
                  const plan = plans.find(p => p.id === value);
                  if (plan) {
                    setRenewForm({
                      ...renewForm,
                      amount: plan.price,
                      duration: plan.hours
                    });
                  }
                }}
              >
                <SelectTrigger className="cursor-pointer">
                  <SelectValue placeholder="Selecione um plano" />
                </SelectTrigger>
                <SelectContent>
                  {plans.map((plan) => (
                    <SelectItem key={plan.id} value={plan.id}>
                      {plan.name} - {plan.hours}{plan.durationType === 'days' ? ' dias' : 'h'} - {formatCurrency(plan.price)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="paymentMethod">Forma de Pagamento</Label>
              <Select
                value={renewForm.paymentMethod}
                onValueChange={(value) => setRenewForm({ ...renewForm, paymentMethod: value })}
              >
                <SelectTrigger className="cursor-pointer">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pix">PIX</SelectItem>
                  <SelectItem value="credit_card">Cartão de Crédito</SelectItem>
                  <SelectItem value="bank_transfer">Transferência Bancária</SelectItem>
                  <SelectItem value="cash">Dinheiro</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="useCustomDatesRenew"
                checked={useCustomDatesRenew}
                onChange={(e) => setUseCustomDatesRenew(e.target.checked)}
                className="rounded border-neutral-300 cursor-pointer"
              />
              <Label htmlFor="useCustomDatesRenew" className="cursor-pointer">
                Especificar data de início e fim
              </Label>
            </div>

            {useCustomDatesRenew && (
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="customStartDateRenew">Data de Início</Label>
                  <Input
                    id="customStartDateRenew"
                    type="date"
                    value={customStartDateRenew}
                    onChange={(e) => setCustomStartDateRenew(e.target.value)}
                    className="cursor-pointer"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="customEndDateRenew">Data de Fim</Label>
                  <Input
                    id="customEndDateRenew"
                    type="date"
                    value={customEndDateRenew}
                    onChange={(e) => setCustomEndDateRenew(e.target.value)}
                    className="cursor-pointer"
                  />
                </div>
              </div>
            )}

            {selectedSubscription && selectedPlanId && (
              <div className="bg-muted/50 rounded-lg p-4 space-y-3">
                <div className="flex items-center justify-between pb-2 border-b">
                  <span className="text-sm font-semibold">Resumo da Renovação</span>
                  <span className="text-lg font-bold">{formatCurrency(renewForm.amount)}</span>
                </div>

                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Saldo Atual:</span>
                    <span className="font-medium">
                      {isSubscriptionExpired(selectedSubscription)
                        ? formatDuration(0, selectedSubscription.durationType)
                        : formatDuration(calculateRemaining(selectedSubscription).value, selectedSubscription.durationType)
                      }
                    </span>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Adicionar:</span>
                    <span className="font-medium">
                      {formatDuration(renewForm.duration, plans.find(p => p.id === selectedPlanId)?.durationType || selectedSubscription.durationType)}
                    </span>
                  </div>

                  <div className="flex justify-between pt-2 border-t">
                    <span className="font-semibold">Novo Saldo:</span>
                    <span className="font-bold">
                      {formatDuration(
                        renewForm.duration,
                        plans.find(p => p.id === selectedPlanId)?.durationType || selectedSubscription.durationType
                      )}
                    </span>
                  </div>

                  {(plans.find(p => p.id === selectedPlanId)?.durationType === 'days' || selectedSubscription.durationType === 'days') && (
                    <div className="flex justify-between pt-2 mt-2 border-t">
                      <span className="text-muted-foreground">Novo Vencimento:</span>
                      <span className="font-medium">
                        {format(
                          new Date(new Date(selectedSubscription.endDate) > new Date()
                            ? new Date(selectedSubscription.endDate).getTime() + renewForm.duration * 24 * 60 * 60 * 1000
                            : new Date().getTime() + renewForm.duration * 24 * 60 * 60 * 1000
                          ),
                          'dd/MM/yyyy'
                        )}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setRenewModalOpen(false);
              setUseCustomDatesRenew(false);
              setCustomStartDateRenew('');
              setCustomEndDateRenew('');
            }} className="cursor-pointer">
              Cancelar
            </Button>
            <Button onClick={handleRenew} disabled={!selectedPlanId} className="cursor-pointer">
              Confirmar Renovação
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Subscriptions;
