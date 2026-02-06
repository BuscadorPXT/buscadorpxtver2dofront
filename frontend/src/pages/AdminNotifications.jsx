import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useTheme } from '@/contexts/ThemeContext';
import api from '@/lib/axios';
import MDEditor from '@uiw/react-md-editor';
import '@uiw/react-md-editor/markdown-editor.css';
import { ArrowLeft, Bell, Eye, FileText, Filter, Search, Send, Trash2, User as UserIcon, Users } from 'lucide-react';
import { useEffect, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { toast } from 'sonner';

const AdminNotifications = () => {
  const { theme } = useTheme();
  const [notifications, setNotifications] = useState([]);
  const [filteredNotifications, setFilteredNotifications] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [viewMode, setViewMode] = useState('list');
  const [selectedNotification, setSelectedNotification] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');

  const [formData, setFormData] = useState({
    title: '',
    message: '',
    imageUrl: '',
    recipientType: 'all',
    userId: '',
  });

  useEffect(() => {
    if (viewMode === 'list') {
      fetchNotifications();
      fetchUsers();
    }
  }, [viewMode]);

  useEffect(() => {
    filterNotifications();
  }, [notifications, searchTerm, filterType]);

  const fetchNotifications = async () => {
    try {
      const response = await api.get('/notifications/admin/all');
      setNotifications(response.data);
    } catch (error) {
      console.error('Erro ao carregar notificações:', error);
      toast.error('Erro ao carregar notificações');
    }
  };

  const filterNotifications = () => {
    let filtered = [...notifications];

    if (filterType === 'global') {
      filtered = filtered.filter(n => n.isGlobal);
    } else if (filterType === 'specific') {
      filtered = filtered.filter(n => !n.isGlobal);
    }

    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      filtered = filtered.filter(n =>
        n.title.toLowerCase().includes(search) ||
        n.message.toLowerCase().includes(search) ||
        getUserName(n.userId).toLowerCase().includes(search)
      );
    }

    setFilteredNotifications(filtered);
  };

  const fetchUsers = async () => {
    try {
      const response = await api.get('/users');
      setUsers(response.data);
    } catch (error) {
      console.error('Erro ao carregar usuários:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.title.trim()) {
      toast.error('Título é obrigatório');
      return;
    }

    if (!formData.message.trim()) {
      toast.error('Mensagem é obrigatória');
      return;
    }

    if (formData.recipientType === 'specific' && !formData.userId) {
      toast.error('Selecione um usuário');
      return;
    }

    setLoading(true);

    try {
      const payload = {
        title: formData.title,
        message: formData.message,
        imageUrl: formData.imageUrl || undefined,
        isGlobal: formData.recipientType === 'all',
        userId: formData.recipientType === 'specific' ? formData.userId : undefined,
      };

      await api.post('/notifications', payload);
      toast.success('Notificação enviada com sucesso!');
      resetForm();
      setViewMode('list');
    } catch (error) {
      console.error('Erro ao enviar notificação:', error);
      toast.error('Erro ao enviar notificação');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Deseja realmente deletar esta notificação?')) return;

    try {
      await api.delete(`/notifications/${id}`);
      toast.success('Notificação deletada');
      fetchNotifications();
    } catch (error) {
      console.error('Erro ao deletar notificação:', error);
      toast.error('Erro ao deletar notificação');
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      message: '',
      imageUrl: '',
      recipientType: 'all',
      userId: '',
    });
    setSelectedNotification(null);
  };

  const handleViewNotification = (notification) => {
    setSelectedNotification(notification);
  };

  const getUserName = (userId) => {
    const user = users.find(u => u.id === userId);
    return user ? user.name : 'Usuário não encontrado';
  };

  if (viewMode === 'create') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-neutral-50 via-neutral-100 to-neutral-200 dark:from-neutral-900 dark:via-neutral-800 dark:to-neutral-900 p-6">
        <div className="max-w-6xl mx-auto">

          <div className="mb-6">
            <Button
              variant="outline"
              onClick={() => {
                setViewMode('list');
                resetForm();
              }}
              className="mb-4"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar
            </Button>
            <h1 className="text-3xl font-bold text-neutral-900 dark:text-white flex items-center gap-3">
              Nova Notificação
            </h1>
            <p className="text-neutral-600 dark:text-neutral-400 mt-2">
              Use o editor abaixo para criar sua notificação com suporte a Markdown
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">

            <Card>
              <CardHeader>
                <CardTitle>Configurações</CardTitle>
                <CardDescription>Defina o destinatário e informações básicas</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 pt-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="title">Título da Notificação *</Label>
                    <Input
                      id="title"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      placeholder="Ex: Manutenção Programada"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="recipientType">Destinatário *</Label>
                    <Select
                      value={formData.recipientType}
                      onValueChange={(value) => setFormData({ ...formData, recipientType: value, userId: '' })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">
                          <div className="flex items-center gap-2">
                            <Users className="h-4 w-4" />
                            Todos os usuários
                          </div>
                        </SelectItem>
                        <SelectItem value="specific">
                          <div className="flex items-center gap-2">
                            <UserIcon className="h-4 w-4" />
                            Usuário específico
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {formData.recipientType === 'specific' && (
                    <div className="space-y-2 md:col-span-2">
                      <Label htmlFor="userId">Selecionar Usuário *</Label>
                      <Select
                        value={formData.userId}
                        onValueChange={(value) => setFormData({ ...formData, userId: value })}
                        required={formData.recipientType === 'specific'}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione um usuário" />
                        </SelectTrigger>
                        <SelectContent>
                          {users.map((user) => (
                            <SelectItem key={user.id} value={user.id}>
                              <div className="flex flex-col">
                                <span className="font-medium">{user.name}</span>
                                <span className="text-xs text-neutral-500">{user.email}</span>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Mensagem</CardTitle>
                <CardDescription>
                  Escreva sua mensagem usando Markdown. Use a barra de ferramentas para formatação.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div data-color-mode={theme === 'dark' ? 'dark' : 'light'}>
                  <MDEditor
                    value={formData.message}
                    onChange={(value) => setFormData({ ...formData, message: value || '' })}
                    height={400}
                    preview="live"
                    hideToolbar={false}
                    enableScroll={true}
                    textareaProps={{
                      placeholder: 'Digite sua mensagem aqui...\n\n**Dica:** Use Markdown para formatar o texto:\n- **Negrito**\n- *Itálico*\n- [Links](url)\n- ![Imagens](url)'
                    }}
                    previewOptions={{
                      rehypePlugins: [],
                    }}
                  />
                </div>
                <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-2">
                  💡 O editor mostra preview ao lado. Use a barra de ferramentas para formatar ou digite Markdown diretamente.
                </p>
              </CardContent>
            </Card>

            <div className="flex gap-3 justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setViewMode('list');
                  resetForm();
                }}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={loading}
                className="bg-primary hover:bg-blue-700"
              >
                <Send className="h-4 w-4 mr-2" />
                {loading ? 'Enviando...' : 'Enviar Notificação'}
              </Button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 py-4 sm:py-6 lg:py-8">

        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 mb-4 sm:mb-6 lg:mb-8">
          <div>
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-neutral-900 mb-1 sm:mb-2 flex items-center gap-2 sm:gap-3">
              Gerenciar Notificações
            </h1>
            <p className="text-sm sm:text-base text-neutral-600">
              Envie notificações para usuários específicos ou para todos
            </p>
          </div>
          <Button onClick={() => setViewMode('create')} className="w-full sm:w-auto">
            Nova Notificação
          </Button>
        </div>

        <Card className="mb-4 sm:mb-6">
          <CardContent className="">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
                  <Input
                    placeholder="Buscar por título, mensagem ou destinatário..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <div className="w-full md:w-48">
                <Select value={filterType} onValueChange={setFilterType}>
                  <SelectTrigger>
                    <Filter className="h-4 w-4 mr-2" />
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas</SelectItem>
                    <SelectItem value="global">Globais</SelectItem>
                    <SelectItem value="specific">Específicas</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {notifications.length === 0 ? (
          <Card className="text-center">
            <CardContent className="py-8 sm:py-12">
              <Bell className="h-12 w-12 sm:h-16 sm:w-16 mx-auto mb-3 sm:mb-4 text-neutral-400" />
              <h3 className="text-lg sm:text-xl font-semibold text-neutral-900 mb-1 sm:mb-2">
                Nenhuma notificação enviada
              </h3>
              <p className="text-sm sm:text-base text-neutral-600 mb-3 sm:mb-4">
                Crie sua primeira notificação para começar
              </p>
              <Button onClick={() => setViewMode('create')} className="bg-primary hover:bg-blue-700">
                <FileText className="h-4 w-4 mr-2" />
                Criar Notificação
              </Button>
            </CardContent>
          </Card>
        ) : filteredNotifications.length === 0 ? (
          <Card className="text-center">
            <CardContent className="py-8 sm:py-12">
              <Search className="h-12 w-12 sm:h-16 sm:w-16 mx-auto mb-3 sm:mb-4 text-neutral-400" />
              <h3 className="text-lg sm:text-xl font-semibold text-neutral-900 mb-1 sm:mb-2">
                Nenhuma notificação encontrada
              </h3>
              <p className="text-sm sm:text-base text-neutral-600">
                Tente ajustar os filtros de pesquisa
              </p>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="min-w-[200px] sm:w-[40%]">Título</TableHead>
                    <TableHead className="min-w-[150px] sm:w-[25%]">Destinatário</TableHead>
                    <TableHead className="min-w-[130px] sm:w-[20%]">Data</TableHead>
                    <TableHead className="min-w-[120px] sm:w-[15%] text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredNotifications.map((notification) => (
                    <TableRow key={notification.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="flex flex-col min-w-0">
                            <span className="font-medium text-neutral-900 text-sm sm:text-base truncate">
                              {notification.title}
                            </span>
                            {notification.imageUrl && (
                              <span className="text-xs text-neutral-500 flex items-center gap-1 mt-1">
                                <FileText className="h-3 w-3" />
                                Contém imagem
                              </span>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-xs sm:text-sm text-neutral-600">
                          {notification.isGlobal ? 'Todos os usuários' : getUserName(notification.userId)}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className="text-xs sm:text-sm text-neutral-600 whitespace-nowrap">
                          {new Date(notification.createdAt).toLocaleString('pt-BR', {
                            day: '2-digit',
                            month: '2-digit',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex gap-1 sm:gap-2 justify-end">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleViewNotification(notification)}
                            className="h-8 w-8 p-0"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleDelete(notification.id)}
                            className="h-8 w-8 p-0"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </Card>
        )}

        {selectedNotification && (
          <div
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            onClick={() => setSelectedNotification(null)}
          >
            <Card
              className="max-w-3xl w-full max-h-[80vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-2xl">{selectedNotification.title}</CardTitle>
                    <CardDescription className="mt-2">
                      {selectedNotification.isGlobal ? 'Enviado para todos os usuários' : `Enviado para: ${getUserName(selectedNotification.userId)}`}
                      {' • '}
                      {new Date(selectedNotification.createdAt).toLocaleString('pt-BR', {
                        dateStyle: 'long',
                        timeStyle: 'short',
                      })}
                    </CardDescription>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedNotification(null)}
                  >
                    ✕
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {selectedNotification.imageUrl && (
                  <img
                    src={selectedNotification.imageUrl}
                    alt="Anexo"
                    className="w-full rounded-lg mb-6"
                  />
                )}
                <div className="prose dark:prose-invert max-w-none">
                  <ReactMarkdown
                    components={{
                      a: ({ node, ...props }) => (
                        <a {...props} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:text-primary" />
                      ),
                      img: ({ node, ...props }) => (
                        <img {...props} className="rounded-lg max-w-full h-auto" />
                      ),
                      code: ({ node, inline, ...props }) => (
                        inline ? (
                          <code className="bg-neutral-100 dark:bg-neutral-800 px-1 py-0.5 rounded text-sm" {...props} />
                        ) : (
                          <code className="block bg-neutral-100 dark:bg-neutral-800 p-4 rounded-lg overflow-x-auto" {...props} />
                        )
                      ),
                    }}
                  >
                    {selectedNotification.message}
                  </ReactMarkdown>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminNotifications;
