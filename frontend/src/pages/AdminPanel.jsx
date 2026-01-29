import { useState, useEffect } from 'react';
import { useAuth, api } from '../contexts/AuthContext';
import { Navigate, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Loader2, Users, CheckCircle, XCircle, Shield, Trash2, Search, Ban, Check, Smartphone, MessageCircle, Settings, Bell, BellOff } from 'lucide-react';
import OnlineUsersCard from '@/components/OnlineUsersCard';
import SupplierPriorityManager from '@/components/SupplierPriorityManager';

const AdminPanel = () => {
  const { isAdmin, user } = useAuth();
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState({});
  const [message, setMessage] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [editIpsDialog, setEditIpsDialog] = useState({ open: false, user: null, value: '' });

  useEffect(() => {
    if (isAdmin) {
      fetchUsers();
    }
  }, [isAdmin]);

  const fetchUsers = async () => {
    try {
      const response = await api.get('/users');
      setUsers(response.data);
    } catch (error) {
      console.error('Erro ao buscar usuários:', error);
      setMessage('Erro ao carregar usuários');
    } finally {
      setLoading(false);
    }
  };

  const handleApproveUser = async (userId) => {
    setActionLoading(prev => ({ ...prev, [userId]: true }));
    try {
      await api.put(`/users/${userId}/approve`);
      setUsers(users.map(u => u.id === userId ? { ...u, isApproved: true } : u));
      setMessage('Usuário aprovado com sucesso!');
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      console.error('Erro ao aprovar usuário:', error);
      setMessage('Erro ao aprovar usuário');
    } finally {
      setActionLoading(prev => ({ ...prev, [userId]: false }));
    }
  };

  const handleMakeAdmin = async (userId) => {
    setActionLoading(prev => ({ ...prev, [`admin_${userId}`]: true }));
    try {
      await api.put(`/users/${userId}/make-admin`);
      setUsers(users.map(u => u.id === userId ? { ...u, isAdmin: true } : u));
      setMessage('Usuário promovido a administrador!');
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      console.error('Erro ao promover usuário:', error);
      setMessage('Erro ao promover usuário');
    } finally {
      setActionLoading(prev => ({ ...prev, [`admin_${userId}`]: false }));
    }
  };

  const handleRemoveAdmin = async (userId) => {
    if (!confirm('Tem certeza que deseja remover as permissões de administrador deste usuário?')) return;
    
    setActionLoading(prev => ({ ...prev, [`remove_admin_${userId}`]: true }));
    try {
      await api.put(`/users/${userId}/remove-admin`);
      setUsers(users.map(u => u.id === userId ? { ...u, isAdmin: false } : u));
      setMessage('Permissões de administrador removidas com sucesso!');
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      console.error('Erro ao remover permissões de administrador:', error);
      setMessage('Erro ao remover permissões de administrador');
    } finally {
      setActionLoading(prev => ({ ...prev, [`remove_admin_${userId}`]: false }));
    }
  };

  const handleToggleActive = async (userId, currentStatus) => {
    const newStatus = !currentStatus;
    const action = newStatus ? 'ativar' : 'inativar';
    
    if (!confirm(`Tem certeza que deseja ${action} este usuário?`)) return;
    
    setActionLoading(prev => ({ ...prev, [`active_${userId}`]: true }));
    try {
      await api.put(`/users/${userId}/toggle-active`, { isActive: newStatus });
      setUsers(users.map(u => u.id === userId ? { ...u, isActive: newStatus } : u));
      setMessage(`Usuário ${action === 'ativar' ? 'ativado' : 'inativado'} com sucesso!`);
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      console.error(`Erro ao ${action} usuário:`, error);
      setMessage(`Erro ao ${action} usuário`);
    } finally {
      setActionLoading(prev => ({ ...prev, [`active_${userId}`]: false }));
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!confirm('Tem certeza que deseja excluir este usuário? Esta ação é irreversível!')) return;
    
    setActionLoading(prev => ({ ...prev, [`delete_${userId}`]: true }));
    try {
      await api.delete(`/users/${userId}`);
      setUsers(users.filter(u => u.id !== userId));
      setMessage('Usuário excluído com sucesso!');
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      console.error('Erro ao excluir usuário:', error);
      setMessage('Erro ao excluir usuário');
    } finally {
      setActionLoading(prev => ({ ...prev, [`delete_${userId}`]: false }));
    }
  };

  const handleOpenEditIps = (user) => {
    setEditIpsDialog({
      open: true,
      user,
      value: user.maxConcurrentIps !== null && user.maxConcurrentIps !== undefined ? user.maxConcurrentIps.toString() : '',
    });
  };

  const handleCloseEditIps = () => {
    setEditIpsDialog({ open: false, user: null, value: '' });
  };

  const handleSaveMaxConcurrentIps = async () => {
    if (!editIpsDialog.user) return;

    const userId = editIpsDialog.user.id;
    const value = editIpsDialog.value === '' ? null : parseInt(editIpsDialog.value);

    if (value !== null && (isNaN(value) || value < 1)) {
      setMessage('O valor deve ser um número maior que 0 ou vazio para usar o padrão do plano');
      setTimeout(() => setMessage(''), 3000);
      return;
    }

    setActionLoading(prev => ({ ...prev, [`edit_ips_${userId}`]: true }));
    try {
      await api.put(`/users/${userId}/max-concurrent-ips`, { maxConcurrentIps: value });
      setUsers(users.map(u => u.id === userId ? { ...u, maxConcurrentIps: value } : u));
      setMessage(`Limite de IPs atualizado com sucesso! ${value === null ? '(usando padrão do plano)' : ''}`);
      setTimeout(() => setMessage(''), 3000);
      handleCloseEditIps();
    } catch (error) {
      console.error('Erro ao atualizar limite de IPs:', error);
      setMessage('Erro ao atualizar limite de IPs');
      setTimeout(() => setMessage(''), 3000);
    } finally {
      setActionLoading(prev => ({ ...prev, [`edit_ips_${userId}`]: false }));
    }
  };

  const handleToggleBillingNotifications = async (userId, currentStatus) => {
    const newStatus = !currentStatus;
    
    setActionLoading(prev => ({ ...prev, [`billing_${userId}`]: true }));
    try {
      await api.put(`/users/${userId}/billing-notifications`, { enableBillingNotifications: newStatus });
      setUsers(users.map(u => u.id === userId ? { ...u, enableBillingNotifications: newStatus } : u));
      setMessage(`Notificações de cobrança ${newStatus ? 'ativadas' : 'desativadas'} para este usuário!`);
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      console.error('Erro ao atualizar notificações:', error);
      setMessage('Erro ao atualizar notificações de cobrança');
      setTimeout(() => setMessage(''), 3000);
    } finally {
      setActionLoading(prev => ({ ...prev, [`billing_${userId}`]: false }));
    }
  };

  if (!isAdmin) {
    return <Navigate to="/" replace />;
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  const filteredUsers = users.filter(u => 
    u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const pendingUsers = filteredUsers.filter(u => !u.isApproved);
  const approvedUsers = filteredUsers.filter(u => u.isApproved);
  const adminUsers = filteredUsers.filter(u => u.isAdmin);
  const inactiveUsers = filteredUsers.filter(u => !u.isActive);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 py-4 sm:py-6 lg:py-8">

        <div className="mb-4 sm:mb-6 lg:mb-8">
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 mb-1 sm:mb-2">Painel Administrativo</h1>
          <p className="text-sm sm:text-base text-gray-600">Gerencie usuários e permissões do sistema</p>
        </div>

        {message && (
          <Alert className="mb-4 sm:mb-6">
            <AlertDescription className="text-sm">{message}</AlertDescription>
          </Alert>
        )}

        <Card className="mb-4 sm:mb-6">
          <CardContent className="">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                type="text"
                placeholder="Buscar usuários..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 text-sm sm:text-base h-9 sm:h-10"
              />
            </div>
            {searchTerm && (
              <p className="text-xs sm:text-sm text-gray-600 mt-2">
                Encontrados: {filteredUsers.length} usuário(s)
              </p>
            )}
          </CardContent>
        </Card>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 sm:gap-3 lg:gap-4 mb-4 sm:mb-6 lg:mb-8">
          <Card>
            <CardContent className="pt-3 sm:pt-4 lg:pt-6 p-3 sm:p-4 lg:p-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center">
                <Users className="h-6 w-6 sm:h-7 sm:w-7 lg:h-8 lg:w-8 text-blue-600 mb-2 sm:mb-0" />
                <div className="sm:ml-3 lg:ml-4">
                  <p className="text-[10px] sm:text-xs lg:text-sm font-medium text-gray-600">Total</p>
                  <p className="text-lg sm:text-xl lg:text-2xl font-bold">{users.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-3 sm:pt-4 lg:pt-6 p-3 sm:p-4 lg:p-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center">
                <CheckCircle className="h-6 w-6 sm:h-7 sm:w-7 lg:h-8 lg:w-8 text-green-600 mb-2 sm:mb-0" />
                <div className="sm:ml-3 lg:ml-4">
                  <p className="text-[10px] sm:text-xs lg:text-sm font-medium text-gray-600">Aprovados</p>
                  <p className="text-lg sm:text-xl lg:text-2xl font-bold">{users.filter(u => u.isApproved).length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-3 sm:pt-4 lg:pt-6 p-3 sm:p-4 lg:p-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center">
                <XCircle className="h-6 w-6 sm:h-7 sm:w-7 lg:h-8 lg:w-8 text-orange-600 mb-2 sm:mb-0" />
                <div className="sm:ml-3 lg:ml-4">
                  <p className="text-[10px] sm:text-xs lg:text-sm font-medium text-gray-600">Pendentes</p>
                  <p className="text-lg sm:text-xl lg:text-2xl font-bold">{users.filter(u => !u.isApproved).length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-3 sm:pt-4 lg:pt-6 p-3 sm:p-4 lg:p-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center">
                <Shield className="h-6 w-6 sm:h-7 sm:w-7 lg:h-8 lg:w-8 text-purple-600 mb-2 sm:mb-0" />
                <div className="sm:ml-3 lg:ml-4">
                  <p className="text-[10px] sm:text-xs lg:text-sm font-medium text-gray-600">Admins</p>
                  <p className="text-lg sm:text-xl lg:text-2xl font-bold">{users.filter(u => u.isAdmin).length}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="col-span-2 sm:col-span-1">
            <CardContent className="pt-3 sm:pt-4 lg:pt-6 p-3 sm:p-4 lg:p-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center">
                <Ban className="h-6 w-6 sm:h-7 sm:w-7 lg:h-8 lg:w-8 text-red-600 mb-2 sm:mb-0" />
                <div className="sm:ml-3 lg:ml-4">
                  <p className="text-[10px] sm:text-xs lg:text-sm font-medium text-gray-600">Inativos</p>
                  <p className="text-lg sm:text-xl lg:text-2xl font-bold">{users.filter(u => !u.isActive).length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="mb-4 sm:mb-6 lg:mb-8">
          <OnlineUsersCard />
        </div>

        <Card className="mb-4 sm:mb-6 lg:mb-8">
          <CardHeader className="p-4 sm:p-6">
            <CardTitle className="text-lg sm:text-xl lg:text-2xl flex items-center gap-2">
              <svg className="h-5 w-5 sm:h-6 sm:w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              Analytics & Rastreamento
            </CardTitle>
            <CardDescription className="text-xs sm:text-sm">
              Visualize métricas, mapa de calor e rastreamento de usuários em tempo real
            </CardDescription>
          </CardHeader>
          <CardContent className="p-3 sm:p-4 lg:p-6">
            <Button 
              onClick={() => navigate('/admin/analytics')}
              className="w-full sm:w-auto"
            >
              <svg className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
              Ver Analytics Completo
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="p-4 sm:p-6">
            <CardTitle className="text-lg sm:text-xl lg:text-2xl">Gerenciamento de Usuários</CardTitle>
            <CardDescription className="text-xs sm:text-sm">
              Aprove novos usuários e gerencie permissões
            </CardDescription>
          </CardHeader>
          <CardContent className="p-3 sm:p-4 lg:p-6">
            <Tabs defaultValue="pending" className="w-full">
              <TabsList className="grid w-full grid-cols-2 sm:grid-cols-5 gap-1 h-auto p-1">
                <TabsTrigger value="pending" className="text-xs sm:text-sm py-2 sm:py-2.5">
                  <span className="hidden sm:inline">Pendentes</span>
                  <span className="sm:hidden">Pend.</span> ({pendingUsers.length})
                </TabsTrigger>
                <TabsTrigger value="approved" className="text-xs sm:text-sm py-2 sm:py-2.5">
                  <span className="hidden sm:inline">Aprovados</span>
                  <span className="sm:hidden">Aprov.</span> ({approvedUsers.filter(u => !u.isAdmin).length})
                </TabsTrigger>
                <TabsTrigger value="admins" className="text-xs sm:text-sm py-2 sm:py-2.5">
                  <span className="hidden sm:inline">Administradores</span>
                  <span className="sm:hidden">Admins</span> ({adminUsers.length})
                </TabsTrigger>
                <TabsTrigger value="inactive" className="text-xs sm:text-sm py-2 sm:py-2.5">
                  <span className="hidden sm:inline">Inativos</span>
                  <span className="sm:hidden">Inat.</span> ({inactiveUsers.length})
                </TabsTrigger>
                <TabsTrigger value="suppliers" className="text-xs sm:text-sm py-2 sm:py-2.5">
                  <span className="hidden sm:inline">Fornecedores</span>
                  <span className="sm:hidden">Forn.</span>
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="pending" className="space-y-2 sm:space-y-3 lg:space-y-4 mt-3 sm:mt-4">
                {pendingUsers.length === 0 ? (
                  <p className="text-center text-gray-500 py-6 sm:py-8 text-sm">
                    Nenhum usuário pendente de aprovação
                  </p>
                ) : (
                  pendingUsers.map((user) => (
                    <Card key={user.id}>
                      <CardContent className="pt-3 sm:pt-4 lg:pt-6 p-3 sm:p-4 lg:p-6">
                        <div className="flex flex-col sm:flex-row items-start sm:items-center sm:justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-sm sm:text-base truncate">{user.name}</h3>
                            <p className="text-xs sm:text-sm text-gray-600 truncate">{user.email}</p>
                            {user.phone && (
                              <a
                                href={`https://wa.me/55${user.phone}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-[10px] sm:text-xs text-green-600 hover:text-green-700 flex items-center gap-1 mt-1"
                              >
                                <MessageCircle className="h-3 w-3" />
                                {user.phone.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3')}
                              </a>
                            )}
                            <p className="text-[10px] sm:text-xs text-gray-500">
                              Cadastrado: {new Date(user.createdAt).toLocaleDateString('pt-BR')}
                            </p>
                          </div>
                          <div className="flex items-center gap-2 w-full sm:w-auto">
                            <Badge variant="outline" className="text-orange-600 border-orange-600 text-[10px] sm:text-xs">
                              Pendente
                            </Badge>
                            <Button
                              size="sm"
                              onClick={() => handleApproveUser(user.id)}
                              disabled={actionLoading[user.id]}
                              className="flex-1 sm:flex-none h-8 sm:h-9 text-xs sm:text-sm"
                            >
                              {actionLoading[user.id] ? (
                                <Loader2 className="h-3 w-3 sm:h-4 sm:w-4 animate-spin" />
                              ) : (
                                <>
                                  <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                                  Aprovar
                                </>
                              )}
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </TabsContent>
              
              <TabsContent value="approved" className="space-y-2 sm:space-y-3 lg:space-y-4 mt-3 sm:mt-4">
                {approvedUsers.filter(u => !u.isAdmin && u.isActive).length === 0 ? (
                  <p className="text-center text-gray-500 py-6 sm:py-8 text-sm">
                    Nenhum usuário aprovado ativo
                  </p>
                ) : (
                  approvedUsers.filter(u => !u.isAdmin && u.isActive).map((user) => (
                    <Card key={user.id}>
                      <CardContent className="pt-3 sm:pt-4 lg:pt-6 p-3 sm:p-4 lg:p-6">
                        <div className="flex flex-col gap-3">
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-sm sm:text-base truncate">{user.name}</h3>
                            <p className="text-xs sm:text-sm text-gray-600 truncate">{user.email}</p>
                            {user.phone && (
                              <a
                                href={`https://wa.me/55${user.phone}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-[10px] sm:text-xs text-green-600 hover:text-green-700 flex items-center gap-1 mt-1"
                              >
                                <MessageCircle className="h-3 w-3" />
                                {user.phone.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3')}
                              </a>
                            )}
                            <p className="text-[10px] sm:text-xs text-gray-500">
                              Aprovado: {new Date(user.updatedAt).toLocaleDateString('pt-BR')}
                            </p>
                          </div>
                          <div className="flex flex-wrap items-center gap-2">
                            <Badge variant="outline" className="text-green-600 border-green-600 text-[10px] sm:text-xs">
                              <CheckCircle className="h-2.5 w-2.5 sm:h-3 sm:w-3 mr-1" />
                              Ativo
                            </Badge>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => navigate(`/admin/users/${user.id}/sessions`)}
                              className="border-blue-600 text-blue-600 hover:bg-blue-50 h-7 sm:h-8 text-xs sm:text-sm"
                            >
                              <Smartphone className="h-3 w-3 sm:h-4 sm:w-4 sm:mr-1" />
                              <span className="hidden sm:inline">Dispositivos</span>
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleOpenEditIps(user)}
                              className="border-gray-600 text-gray-600 hover:bg-gray-50 h-7 sm:h-8 text-xs sm:text-sm"
                            >
                              <Settings className="h-3 w-3 sm:h-4 sm:w-4 sm:mr-1" />
                              <span className="hidden sm:inline">IPs</span>
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleToggleBillingNotifications(user.id, user.enableBillingNotifications)}
                              disabled={actionLoading[`billing_${user.id}`]}
                              className={`h-7 sm:h-8 text-xs sm:text-sm ${
                                user.enableBillingNotifications !== false
                                  ? 'border-green-600 text-green-600 hover:bg-green-50'
                                  : 'border-red-600 text-red-600 hover:bg-red-50'
                              }`}
                              title={user.enableBillingNotifications !== false ? 'Notificações de cobrança ativadas' : 'Notificações de cobrança desativadas'}
                            >
                              {actionLoading[`billing_${user.id}`] ? (
                                <Loader2 className="h-3 w-3 sm:h-4 sm:w-4 animate-spin" />
                              ) : user.enableBillingNotifications !== false ? (
                                <>
                                  <Bell className="h-3 w-3 sm:h-4 sm:w-4 sm:mr-1" />
                                  <span className="hidden sm:inline">Cobrança</span>
                                </>
                              ) : (
                                <>
                                  <BellOff className="h-3 w-3 sm:h-4 sm:w-4 sm:mr-1" />
                                  <span className="hidden sm:inline">Cobrança</span>
                                </>
                              )}
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleMakeAdmin(user.id)}
                              disabled={actionLoading[`admin_${user.id}`]}
                              className="h-7 sm:h-8 text-xs sm:text-sm"
                            >
                              {actionLoading[`admin_${user.id}`] ? (
                                <Loader2 className="h-3 w-3 sm:h-4 sm:w-4 animate-spin" />
                              ) : (
                                <>
                                  <Shield className="h-3 w-3 sm:h-4 sm:w-4 sm:mr-1" />
                                  <span className="hidden sm:inline">Admin</span>
                                </>
                              )}
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleToggleActive(user.id, user.isActive)}
                              disabled={actionLoading[`active_${user.id}`]}
                              className="border-orange-600 text-orange-600 hover:bg-orange-50 h-7 sm:h-8 text-xs sm:text-sm"
                            >
                              {actionLoading[`active_${user.id}`] ? (
                                <Loader2 className="h-3 w-3 sm:h-4 sm:w-4 animate-spin" />
                              ) : (
                                <>
                                  <Ban className="h-3 w-3 sm:h-4 sm:w-4 sm:mr-1" />
                                  <span className="hidden sm:inline">Inativar</span>
                                </>
                              )}
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => handleDeleteUser(user.id)}
                              disabled={actionLoading[`delete_${user.id}`]}
                              className="h-7 sm:h-8"
                            >
                              {actionLoading[`delete_${user.id}`] ? (
                                <Loader2 className="h-3 w-3 sm:h-4 sm:w-4 animate-spin" />
                              ) : (
                                <Trash2 className="h-3 w-3 sm:h-4 sm:w-4" />
                              )}
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </TabsContent>
              
              <TabsContent value="admins" className="space-y-2 sm:space-y-3 lg:space-y-4 mt-3 sm:mt-4">
                {adminUsers.filter(u => u.isActive).map((admin) => (
                  <Card key={admin.id}>
                    <CardContent className="pt-3 sm:pt-4 lg:pt-6 p-3 sm:p-4 lg:p-6">
                      <div className="flex flex-col gap-3">
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-sm sm:text-base truncate">{admin.name}</h3>
                          <p className="text-xs sm:text-sm text-gray-600 truncate">{admin.email}</p>
                          {admin.phone && (
                            <a
                              href={`https://wa.me/55${admin.phone}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-[10px] sm:text-xs text-green-600 hover:text-green-700 flex items-center gap-1 mt-1"
                            >
                              <MessageCircle className="h-3 w-3" />
                              {admin.phone.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3')}
                            </a>
                          )}
                          <p className="text-[10px] sm:text-xs text-gray-500">
                            Admin desde: {new Date(admin.updatedAt).toLocaleDateString('pt-BR')}
                          </p>
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                          <Badge className="bg-purple-600 text-[10px] sm:text-xs">
                            <Shield className="h-2.5 w-2.5 sm:h-3 sm:w-3 mr-1" />
                            Administrador
                          </Badge>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => navigate(`/admin/users/${admin.id}/sessions`)}
                            className="border-blue-600 text-blue-600 hover:bg-blue-50 h-7 sm:h-8 text-xs sm:text-sm"
                          >
                            <Smartphone className="h-3 w-3 sm:h-4 sm:w-4 sm:mr-1" />
                            <span className="hidden sm:inline">Dispositivos</span>
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleOpenEditIps(admin)}
                            className="border-gray-600 text-gray-600 hover:bg-gray-50 h-7 sm:h-8 text-xs sm:text-sm"
                          >
                            <Settings className="h-3 w-3 sm:h-4 sm:w-4 sm:mr-1" />
                            <span className="hidden sm:inline">IPs</span>
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleToggleBillingNotifications(admin.id, admin.enableBillingNotifications)}
                            disabled={actionLoading[`billing_${admin.id}`]}
                            className={`h-7 sm:h-8 text-xs sm:text-sm ${
                              admin.enableBillingNotifications !== false
                                ? 'border-green-600 text-green-600 hover:bg-green-50'
                                : 'border-red-600 text-red-600 hover:bg-red-50'
                            }`}
                            title={admin.enableBillingNotifications !== false ? 'Notificações de cobrança ativadas' : 'Notificações de cobrança desativadas'}
                          >
                            {actionLoading[`billing_${admin.id}`] ? (
                              <Loader2 className="h-3 w-3 sm:h-4 sm:w-4 animate-spin" />
                            ) : admin.enableBillingNotifications !== false ? (
                              <>
                                <Bell className="h-3 w-3 sm:h-4 sm:w-4 sm:mr-1" />
                                <span className="hidden sm:inline">Cobrança</span>
                              </>
                            ) : (
                              <>
                                <BellOff className="h-3 w-3 sm:h-4 sm:w-4 sm:mr-1" />
                                <span className="hidden sm:inline">Cobrança</span>
                              </>
                            )}
                          </Button>
                          {admin.id !== user?.id && (
                            <>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleRemoveAdmin(admin.id)}
                                disabled={actionLoading[`remove_admin_${admin.id}`]}
                                className="border-purple-600 text-purple-600 hover:bg-purple-50 h-7 sm:h-8 text-xs sm:text-sm"
                              >
                                {actionLoading[`remove_admin_${admin.id}`] ? (
                                  <Loader2 className="h-3 w-3 sm:h-4 sm:w-4 animate-spin" />
                                ) : (
                                  <>
                                    <XCircle className="h-3 w-3 sm:h-4 sm:w-4 sm:mr-1" />
                                    <span className="hidden sm:inline">Remover Admin</span>
                                  </>
                                )}
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleToggleActive(admin.id, admin.isActive)}
                                disabled={actionLoading[`active_${admin.id}`]}
                                className="border-orange-600 text-orange-600 hover:bg-orange-50 h-7 sm:h-8 text-xs sm:text-sm"
                              >
                                {actionLoading[`active_${admin.id}`] ? (
                                  <Loader2 className="h-3 w-3 sm:h-4 sm:w-4 animate-spin" />
                                ) : (
                                  <>
                                    <Ban className="h-3 w-3 sm:h-4 sm:w-4 sm:mr-1" />
                                    <span className="hidden sm:inline">Inativar</span>
                                  </>
                                )}
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => handleDeleteUser(admin.id)}
                                disabled={actionLoading[`delete_${admin.id}`]}
                                className="h-7 sm:h-8"
                              >
                                {actionLoading[`delete_${admin.id}`] ? (
                                  <Loader2 className="h-3 w-3 sm:h-4 sm:w-4 animate-spin" />
                                ) : (
                                  <Trash2 className="h-3 w-3 sm:h-4 sm:w-4" />
                                )}
                              </Button>
                            </>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </TabsContent>

              <TabsContent value="inactive" className="space-y-2 sm:space-y-3 lg:space-y-4 mt-3 sm:mt-4">
                {inactiveUsers.length === 0 ? (
                  <p className="text-center text-gray-500 py-6 sm:py-8 text-sm">
                    Nenhum usuário inativo
                  </p>
                ) : (
                  inactiveUsers.map((user) => (
                    <Card key={user.id} className="border-red-200 bg-red-50">
                      <CardContent className="pt-3 sm:pt-4 lg:pt-6 p-3 sm:p-4 lg:p-6">
                        <div className="flex flex-col gap-3">
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-gray-900 text-sm sm:text-base truncate">{user.name}</h3>
                            <p className="text-xs sm:text-sm text-gray-600 truncate">{user.email}</p>
                            {user.phone && (
                              <a
                                href={`https://wa.me/55${user.phone}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-[10px] sm:text-xs text-green-600 hover:text-green-700 flex items-center gap-1 mt-1"
                              >
                                <MessageCircle className="h-3 w-3" />
                                {user.phone.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3')}
                              </a>
                            )}
                            <div className="flex flex-wrap items-center gap-2 mt-1">
                              {user.isAdmin && (
                                <Badge variant="outline" className="text-purple-600 border-purple-600 text-[10px] sm:text-xs">
                                  <Shield className="h-2.5 w-2.5 sm:h-3 sm:w-3 mr-1" />
                                  Admin
                                </Badge>
                              )}
                              <p className="text-[10px] sm:text-xs text-gray-500">
                                Inativado: {new Date(user.updatedAt).toLocaleDateString('pt-BR')}
                              </p>
                            </div>
                          </div>
                          <div className="flex flex-wrap items-center gap-2">
                            <Badge variant="outline" className="text-red-600 border-red-600 text-[10px] sm:text-xs">
                              <Ban className="h-2.5 w-2.5 sm:h-3 sm:w-3 mr-1" />
                              Inativo
                            </Badge>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => navigate(`/admin/users/${user.id}/sessions`)}
                              className="border-blue-600 text-blue-600 hover:bg-blue-50 h-7 sm:h-8 text-xs sm:text-sm"
                            >
                              <Smartphone className="h-3 w-3 sm:h-4 sm:w-4 sm:mr-1" />
                              <span className="hidden sm:inline">Dispositivos</span>
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleOpenEditIps(user)}
                              className="border-gray-600 text-gray-600 hover:bg-gray-50 h-7 sm:h-8 text-xs sm:text-sm"
                            >
                              <Settings className="h-3 w-3 sm:h-4 sm:w-4 sm:mr-1" />
                              <span className="hidden sm:inline">IPs</span>
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleToggleBillingNotifications(user.id, user.enableBillingNotifications)}
                              disabled={actionLoading[`billing_${user.id}`]}
                              className={`h-7 sm:h-8 text-xs sm:text-sm ${
                                user.enableBillingNotifications !== false
                                  ? 'border-green-600 text-green-600 hover:bg-green-50'
                                  : 'border-red-600 text-red-600 hover:bg-red-50'
                              }`}
                              title={user.enableBillingNotifications !== false ? 'Notificações de cobrança ativadas' : 'Notificações de cobrança desativadas'}
                            >
                              {actionLoading[`billing_${user.id}`] ? (
                                <Loader2 className="h-3 w-3 sm:h-4 sm:w-4 animate-spin" />
                              ) : user.enableBillingNotifications !== false ? (
                                <>
                                  <Bell className="h-3 w-3 sm:h-4 sm:w-4 sm:mr-1" />
                                  <span className="hidden sm:inline">Cobrança</span>
                                </>
                              ) : (
                                <>
                                  <BellOff className="h-3 w-3 sm:h-4 sm:w-4 sm:mr-1" />
                                  <span className="hidden sm:inline">Cobrança</span>
                                </>
                              )}
                            </Button>
                            {user.isAdmin && user.id !== user?.id && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleRemoveAdmin(user.id)}
                                disabled={actionLoading[`remove_admin_${user.id}`]}
                                className="border-purple-600 text-purple-600 hover:bg-purple-50 h-7 sm:h-8 text-xs sm:text-sm"
                              >
                                {actionLoading[`remove_admin_${user.id}`] ? (
                                  <Loader2 className="h-3 w-3 sm:h-4 sm:w-4 animate-spin" />
                                ) : (
                                  <>
                                    <XCircle className="h-3 w-3 sm:h-4 sm:w-4 sm:mr-1" />
                                    <span className="hidden sm:inline">Remover Admin</span>
                                  </>
                                )}
                              </Button>
                            )}
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleToggleActive(user.id, user.isActive)}
                              disabled={actionLoading[`active_${user.id}`]}
                              className="border-green-600 text-green-600 hover:bg-green-50 h-7 sm:h-8 text-xs sm:text-sm"
                            >
                              {actionLoading[`active_${user.id}`] ? (
                                <Loader2 className="h-3 w-3 sm:h-4 sm:w-4 animate-spin" />
                              ) : (
                                <>
                                  <Check className="h-3 w-3 sm:h-4 sm:w-4 sm:mr-1" />
                                  <span className="hidden sm:inline">Reativar</span>
                                </>
                              )}
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => handleDeleteUser(user.id)}
                              disabled={actionLoading[`delete_${user.id}`]}
                              className="h-7 sm:h-8"
                            >
                              {actionLoading[`delete_${user.id}`] ? (
                                <Loader2 className="h-3 w-3 sm:h-4 sm:w-4 animate-spin" />
                              ) : (
                                <Trash2 className="h-3 w-3 sm:h-4 sm:w-4" />
                              )}
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </TabsContent>

              <TabsContent value="suppliers" className="mt-3 sm:mt-4">
                <SupplierPriorityManager />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>

      <Dialog open={editIpsDialog.open} onOpenChange={(open) => !open && handleCloseEditIps()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Limite de IPs Simultâneos</DialogTitle>
            <DialogDescription>
              Configure o número máximo de dispositivos simultâneos para {editIpsDialog.user?.name}.
              Deixe vazio para usar o limite do plano.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="maxConcurrentIps">IPs Simultâneos</Label>
              <Input
                id="maxConcurrentIps"
                type="number"
                min="1"
                placeholder="Deixe vazio para usar o padrão do plano"
                value={editIpsDialog.value}
                onChange={(e) => setEditIpsDialog({ ...editIpsDialog, value: e.target.value })}
              />
              <p className="text-xs text-muted-foreground">
                Valor atual: {editIpsDialog.user?.maxConcurrentIps ?? 'Usando padrão do plano'}
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={handleCloseEditIps}>
              Cancelar
            </Button>
            <Button
              onClick={handleSaveMaxConcurrentIps}
              disabled={actionLoading[`edit_ips_${editIpsDialog.user?.id}`]}
            >
              {actionLoading[`edit_ips_${editIpsDialog.user?.id}`] ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : null}
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminPanel;
