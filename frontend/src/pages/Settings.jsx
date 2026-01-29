import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { MessageSquare, Loader2, CheckCircle2, XCircle, Save, Eye, EyeOff, Mail, Send, FileText } from 'lucide-react';
import api from '@/lib/axios';
import { toast } from 'sonner';
import { Textarea } from '@/components/ui/textarea';

const Settings = () => {
  const { isAdmin, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState(null);
  const [showToken, setShowToken] = useState(false);
  const [showInstanceId, setShowInstanceId] = useState(false);
  const [showTestModal, setShowTestModal] = useState(false);
  const [testPhone, setTestPhone] = useState('');
  const [sendingTest, setSendingTest] = useState(false);
  
  const [formData, setFormData] = useState({
    clientToken: '',
    instanceId: '',
    instanceToken: '',
    baseUrl: 'https://api.z-api.io'
  });

  const [mailjetLoading, setMailjetLoading] = useState(false);
  const [mailjetTesting, setMailjetTesting] = useState(false);
  const [showMailjetApiKey, setShowMailjetApiKey] = useState(false);
  const [showMailjetSecret, setShowMailjetSecret] = useState(false);
  const [showMailjetTestModal, setShowMailjetTestModal] = useState(false);
  const [mailjetTestEmail, setMailjetTestEmail] = useState('');
  const [mailjetFormData, setMailjetFormData] = useState({
    apiKey: '',
    apiSecret: '',
    senderEmail: '',
    senderName: ''
  });

  const [templatesLoading, setTemplatesLoading] = useState(false);
  const [templatesSaving, setTemplatesSaving] = useState(false);
  const [welcomeTemplate, setWelcomeTemplate] = useState('');

  useEffect(() => {

    if (authLoading) {
      return;
    }
    
    if (!isAdmin) {
      console.log('⚠️ Settings: Not admin, redirecting to home');
      navigate('/');
      return;
    }
    
    console.log('✅ Settings: Admin access confirmed, loading settings');
    loadSettings();
    loadMailjetSettings();
    loadTemplates();
  }, [isAdmin, authLoading, navigate]);

  const loadSettings = async () => {
    try {
      const response = await api.get('/settings/zapi');
      setFormData({
        clientToken: response.data.clientToken || '',
        instanceId: response.data.instanceId || '',
        instanceToken: response.data.instanceToken || '',
        baseUrl: response.data.baseUrl || 'https://api.z-api.io',
      });
    } catch (error) {
      console.error('Erro ao carregar configurações:', error);
      toast.error('Erro ao carregar configurações');
    }
  };

  const loadMailjetSettings = async () => {
    try {
      const response = await api.get('/settings/mailjet');
      setMailjetFormData({
        apiKey: response.data.apiKey || '',
        apiSecret: response.data.apiSecret || '',
        senderEmail: response.data.senderEmail || '',
        senderName: response.data.senderName || '',
      });
    } catch (error) {
      console.error('Erro ao carregar configurações Mailjet:', error);
    }
  };

  const loadTemplates = async () => {
    setTemplatesLoading(true);
    try {
      const response = await api.get('/settings/templates');
      setWelcomeTemplate(response.data.welcomeMessage || '');
    } catch (error) {
      console.error('Erro ao carregar templates:', error);
    } finally {
      setTemplatesLoading(false);
    }
  };

  const handleSaveTemplates = async () => {
    setTemplatesSaving(true);
    try {
      await api.put('/settings/templates', {
        welcomeMessage: welcomeTemplate,
      });
      toast.success('Template salvo com sucesso!');
    } catch (error) {
      console.error('Erro ao salvar template:', error);
      toast.error(error.response?.data?.message || 'Erro ao salvar template');
    } finally {
      setTemplatesSaving(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const checkConnection = async () => {
    setChecking(true);
    setConnectionStatus(null);
    try {
      const response = await api.get('/notifications/whatsapp/status');
      setConnectionStatus(response.data.connected ? 'connected' : 'disconnected');
      if (response.data.connected) {
        toast.success('WhatsApp conectado com sucesso!');
      } else {
        toast.error('WhatsApp não está conectado');
      }
    } catch (error) {
      console.error('Erro ao verificar conexão:', error);
      setConnectionStatus('error');
      toast.error('Erro ao verificar conexão');
    } finally {
      setChecking(false);
    }
  };

  const handleSave = async () => {
    if (!formData.clientToken || !formData.instanceId || !formData.instanceToken) {
      toast.error('Por favor, preencha todos os campos obrigatórios');
      return;
    }

    setLoading(true);
    try {
      await api.put('/settings/zapi', formData);
      toast.success('Configurações salvas com sucesso!');

      setTimeout(() => {
        checkConnection();
      }, 1000);
    } catch (error) {
      console.error('Erro ao salvar configurações:', error);
      toast.error(error.response?.data?.message || 'Erro ao salvar configurações');
    } finally {
      setLoading(false);
    }
  };

  const handleTestMessage = () => {
    if (!formData.clientToken || !formData.instanceId || !formData.instanceToken) {
      toast.error('Configure o Z-API antes de enviar mensagem de teste');
      return;
    }
    setShowTestModal(true);
  };

  const sendTestMessage = async () => {
    if (!testPhone) {
      toast.error('Digite um número de telefone');
      return;
    }

    setSendingTest(true);
    try {
      await api.post('/notifications/whatsapp/test', { phone: testPhone });
      toast.success('Mensagem de teste enviada com sucesso!');
      setShowTestModal(false);
      setTestPhone('');
    } catch (error) {
      console.error('Erro ao enviar mensagem de teste:', error);
      toast.error(error.response?.data?.message || 'Erro ao enviar mensagem de teste');
    } finally {
      setSendingTest(false);
    }
  };

  const handleMailjetInputChange = (e) => {
    const { name, value } = e.target;
    setMailjetFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleMailjetSave = async () => {
    if (!mailjetFormData.apiKey || !mailjetFormData.apiSecret) {
      toast.error('Por favor, preencha API Key e API Secret');
      return;
    }

    setMailjetLoading(true);
    try {
      await api.put('/settings/mailjet', mailjetFormData);
      toast.success('Configurações do Mailjet salvas com sucesso!');
    } catch (error) {
      console.error('Erro ao salvar configurações Mailjet:', error);
      toast.error(error.response?.data?.message || 'Erro ao salvar configurações');
    } finally {
      setMailjetLoading(false);
    }
  };

  const sendMailjetTestEmail = async () => {
    if (!mailjetTestEmail) {
      toast.error('Digite um email');
      return;
    }

    setMailjetTesting(true);
    try {
      await api.post('/settings/mailjet/test', { email: mailjetTestEmail });
      toast.success('Email de teste enviado com sucesso!');
      setShowMailjetTestModal(false);
      setMailjetTestEmail('');
    } catch (error) {
      console.error('Erro ao enviar email de teste:', error);
      toast.error(error.response?.data?.message || 'Erro ao enviar email de teste');
    } finally {
      setMailjetTesting(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600 dark:text-gray-300">Carregando...</p>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">

        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Configurações do Sistema
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Gerencie as configurações de integração com serviços externos
          </p>
        </div>

        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-500/10 rounded-lg">
                  <MessageSquare className="h-6 w-6 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <CardTitle>Configuração Z-API WhatsApp</CardTitle>
                  <CardDescription>
                    Configure a integração com Z-API para envio de notificações via WhatsApp
                  </CardDescription>
                </div>
              </div>
              {connectionStatus && (
                <div className="flex items-center gap-2">
                  {connectionStatus === 'connected' && (
                    <>
                      <CheckCircle2 className="h-5 w-5 text-green-600" />
                      <span className="text-sm font-medium text-green-600">Conectado</span>
                    </>
                  )}
                  {connectionStatus === 'disconnected' && (
                    <>
                      <XCircle className="h-5 w-5 text-red-600" />
                      <span className="text-sm font-medium text-red-600">Desconectado</span>
                    </>
                  )}
                  {connectionStatus === 'error' && (
                    <>
                      <XCircle className="h-5 w-5 text-orange-600" />
                      <span className="text-sm font-medium text-orange-600">Erro</span>
                    </>
                  )}
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">

              <div className="space-y-2">
                <Label htmlFor="clientToken" className="text-sm font-medium">
                  Token do Cliente <span className="text-red-500">*</span>
                </Label>
                <div className="relative">
                  <Input
                    id="clientToken"
                    name="clientToken"
                    type="password"
                    placeholder="token-do-cliente"
                    value={formData.clientToken}
                    onChange={handleInputChange}
                    className="pr-10"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="instanceId" className="text-sm font-medium">
                  ID da Instância <span className="text-red-500">*</span>
                </Label>
                <div className="relative">
                  <Input
                    id="instanceId"
                    name="instanceId"
                    type={showInstanceId ? "text" : "password"}
                    placeholder="id-da-instancia"
                    value={formData.instanceId}
                    onChange={handleInputChange}
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowInstanceId(!showInstanceId)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showInstanceId ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="instanceToken" className="text-sm font-medium">
                  Token da Instância <span className="text-red-500">*</span>
                </Label>
                <div className="relative">
                  <Input
                    id="instanceToken"
                    name="instanceToken"
                    type={showToken ? "text" : "password"}
                    placeholder="token-da-instancia"
                    value={formData.instanceToken}
                    onChange={handleInputChange}
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowToken(!showToken)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showToken ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="baseUrl" className="text-sm font-medium">
                  URL Base
                </Label>
                <Input
                  id="baseUrl"
                  name="baseUrl"
                  type="text"
                  placeholder="https://api.z-api.io"
                  value={formData.baseUrl}
                  onChange={handleInputChange}
                />
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Deixe como padrão a menos que esteja usando um servidor personalizado
                </p>
              </div>
            </div>

            <div className="flex flex-wrap gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
              <Button
                onClick={handleSave}
                disabled={loading || checking}
                className="flex items-center gap-2"
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Save className="h-4 w-4" />
                )}
                Salvar Configurações
              </Button>

              <Button
                onClick={checkConnection}
                disabled={loading || checking || !formData.clientToken || !formData.instanceId || !formData.instanceToken}
                variant="outline"
                className="flex items-center gap-2"
              >
                {checking ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <CheckCircle2 className="h-4 w-4" />
                )}
                Verificar Conexão
              </Button>

              <Button
                onClick={handleTestMessage}
                disabled={loading || checking || !formData.clientToken || !formData.instanceId || !formData.instanceToken}
                variant="secondary"
                className="flex items-center gap-2"
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <MessageSquare className="h-4 w-4" />
                )}
                Enviar Teste
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-500/10 rounded-lg">
                <Mail className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <CardTitle>Configuração Mailjet (Email)</CardTitle>
                <CardDescription>
                  Configure a integração com Mailjet para envio de emails (recuperação de senha, notificações)
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">

              <div className="space-y-2">
                <Label htmlFor="apiKey" className="text-sm font-medium">
                  API Key <span className="text-red-500">*</span>
                </Label>
                <div className="relative">
                  <Input
                    id="apiKey"
                    name="apiKey"
                    type={showMailjetApiKey ? "text" : "password"}
                    placeholder="sua-api-key"
                    value={mailjetFormData.apiKey}
                    onChange={handleMailjetInputChange}
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowMailjetApiKey(!showMailjetApiKey)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showMailjetApiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="apiSecret" className="text-sm font-medium">
                  API Secret <span className="text-red-500">*</span>
                </Label>
                <div className="relative">
                  <Input
                    id="apiSecret"
                    name="apiSecret"
                    type={showMailjetSecret ? "text" : "password"}
                    placeholder="sua-api-secret"
                    value={mailjetFormData.apiSecret}
                    onChange={handleMailjetInputChange}
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowMailjetSecret(!showMailjetSecret)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showMailjetSecret ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="senderEmail" className="text-sm font-medium">
                  Email do Remetente
                </Label>
                <Input
                  id="senderEmail"
                  name="senderEmail"
                  type="email"
                  placeholder="noreply@seudominio.com"
                  value={mailjetFormData.senderEmail}
                  onChange={handleMailjetInputChange}
                />
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Deve ser um email verificado no Mailjet
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="senderName" className="text-sm font-medium">
                  Nome do Remetente
                </Label>
                <Input
                  id="senderName"
                  name="senderName"
                  type="text"
                  placeholder="Nome da sua empresa"
                  value={mailjetFormData.senderName}
                  onChange={handleMailjetInputChange}
                />
              </div>
            </div>

            <div className="flex flex-wrap gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
              <Button
                onClick={handleMailjetSave}
                disabled={mailjetLoading}
                className="flex items-center gap-2"
              >
                {mailjetLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Save className="h-4 w-4" />
                )}
                Salvar Configurações
              </Button>

              <Button
                onClick={() => setShowMailjetTestModal(true)}
                disabled={mailjetLoading || !mailjetFormData.apiKey || !mailjetFormData.apiSecret}
                variant="secondary"
                className="flex items-center gap-2"
              >
                <Send className="h-4 w-4" />
                Enviar Email Teste
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-500/10 rounded-lg">
                <FileText className="h-6 w-6 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <CardTitle>Templates de Mensagens</CardTitle>
                <CardDescription>
                  Configure os templates de mensagens automáticas enviadas pelo sistema
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {templatesLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
              </div>
            ) : (
              <>
                <div className="space-y-4">

                  <div className="space-y-2">
                    <Label htmlFor="welcomeTemplate" className="text-sm font-medium">
                      Mensagem de Boas-Vindas (WhatsApp)
                    </Label>
                    <Textarea
                      id="welcomeTemplate"
                      placeholder="Digite o template da mensagem de boas-vindas..."
                      value={welcomeTemplate}
                      onChange={(e) => setWelcomeTemplate(e.target.value)}
                      rows={4}
                      className="resize-none"
                    />
                    <div className="space-y-1">
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        Mensagem enviada automaticamente após o cadastro de novos usuários.
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        <strong>Variáveis disponíveis:</strong>
                      </p>
                      <ul className="text-xs text-gray-500 dark:text-gray-400 list-disc list-inside ml-2">
                        <li><code className="bg-gray-100 dark:bg-gray-800 px-1 rounded">[primeiro-nome]</code> → Primeiro nome do usuário</li>
                        <li><code className="bg-gray-100 dark:bg-gray-800 px-1 rounded">[nome-completo]</code> → Nome completo do usuário</li>
                        <li><code className="bg-gray-100 dark:bg-gray-800 px-1 rounded">[e-mail]</code> → E-mail cadastrado pelo usuário</li>
                      </ul>
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <Button
                    onClick={handleSaveTemplates}
                    disabled={templatesSaving}
                    className="flex items-center gap-2"
                  >
                    {templatesSaving ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Save className="h-4 w-4" />
                    )}
                    Salvar Template
                  </Button>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        <Dialog open={showTestModal} onOpenChange={setShowTestModal}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Enviar Mensagem de Teste</DialogTitle>
              <DialogDescription>
                Digite o número de telefone com DDD para receber uma mensagem de teste do WhatsApp
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="testPhone">Número de Telefone</Label>
                <Input
                  id="testPhone"
                  type="tel"
                  placeholder="11999999999"
                  value={testPhone}
                  onChange={(e) => setTestPhone(e.target.value)}
                  disabled={sendingTest}
                />
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Digite apenas números com DDD (ex: 11999999999)
                </p>
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setShowTestModal(false);
                  setTestPhone('');
                }}
                disabled={sendingTest}
              >
                Cancelar
              </Button>
              <Button
                onClick={sendTestMessage}
                disabled={sendingTest || !testPhone}
              >
                {sendingTest ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Enviando...
                  </>
                ) : (
                  <>
                    <MessageSquare className="h-4 w-4 mr-2" />
                    Enviar
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={showMailjetTestModal} onOpenChange={setShowMailjetTestModal}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Enviar Email de Teste</DialogTitle>
              <DialogDescription>
                Digite o email para receber uma mensagem de teste
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="mailjetTestEmail">Email</Label>
                <Input
                  id="mailjetTestEmail"
                  type="email"
                  placeholder="seu@email.com"
                  value={mailjetTestEmail}
                  onChange={(e) => setMailjetTestEmail(e.target.value)}
                  disabled={mailjetTesting}
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setShowMailjetTestModal(false);
                  setMailjetTestEmail('');
                }}
                disabled={mailjetTesting}
              >
                Cancelar
              </Button>
              <Button
                onClick={sendMailjetTestEmail}
                disabled={mailjetTesting || !mailjetTestEmail}
              >
                {mailjetTesting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Enviando...
                  </>
                ) : (
                  <>
                    <Mail className="h-4 w-4 mr-2" />
                    Enviar
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default Settings;
