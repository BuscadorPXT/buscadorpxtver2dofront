import { useState, useEffect } from 'react';
import { useAuth, api } from '../contexts/AuthContext';
import { Navigate, Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Loader2, Image, ExternalLink, Eye, EyeOff, Settings, Trash2, ArrowLeft, Upload } from 'lucide-react';

const AdminPartners = () => {
  const { isAdmin } = useAuth();
  const [partners, setPartners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState({});
  const [message, setMessage] = useState('');
  const [partnerDialog, setPartnerDialog] = useState({ open: false, partner: null });
  const [partnerFormData, setPartnerFormData] = useState({
    name: '',
    imageUrl: '',
    redirectUrl: '',
    displayOrder: 0,
    startDate: '',
    endDate: ''
  });
  const [uploadingImage, setUploadingImage] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);

  useEffect(() => {
    if (isAdmin) {
      fetchPartners();
    }
  }, [isAdmin]);

  const fetchPartners = async () => {
    try {
      const response = await api.get('/partners');
      setPartners(response.data);
    } catch (error) {
      console.error('Erro ao buscar parceiros:', error);
      setMessage('Erro ao carregar parceiros');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenPartnerDialog = (partner = null) => {
    if (partner) {
      setPartnerFormData({
        name: partner.name,
        imageUrl: partner.imageUrl,
        redirectUrl: partner.redirectUrl,
        displayOrder: partner.displayOrder,
        startDate: partner.startDate ? partner.startDate.split('T')[0] : '',
        endDate: partner.endDate ? partner.endDate.split('T')[0] : ''
      });
      setImagePreview(partner.imageUrl);
    } else {
      setPartnerFormData({
        name: '',
        imageUrl: '',
        redirectUrl: '',
        displayOrder: 0,
        startDate: '',
        endDate: ''
      });
      setImagePreview(null);
    }
    setSelectedFile(null);
    setUploadProgress(0);
    setPartnerDialog({ open: true, partner });
  };

  const handleClosePartnerDialog = () => {
    setPartnerDialog({ open: false, partner: null });
    setSelectedFile(null);
    setImagePreview(null);
    setUploadProgress(0);
  };

  const handlePartnerFormChange = (field, value) => {
    setPartnerFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.match(/image\/(jpg|jpeg|png|webp)/)) {
      setMessage('Apenas imagens JPG, PNG ou WebP são permitidas');
      setTimeout(() => setMessage(''), 3000);
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setMessage('A imagem deve ter no máximo 5MB');
      setTimeout(() => setMessage(''), 3000);
      return;
    }

    setSelectedFile(file);
    
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const uploadImage = async (file) => {
    const formData = new FormData();
    formData.append('file', file);

    const response = await api.post('/upload/partner-image', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress: (progressEvent) => {
        const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
        setUploadProgress(percentCompleted);
      },
    });

    return response.data.url;
  };

  const handleSavePartner = async () => {
    setActionLoading(prev => ({ ...prev, savePartner: true }));
    setUploadingImage(true);
    setUploadProgress(0);
    
    try {
      let imageUrl = partnerFormData.imageUrl;
      
      if (selectedFile) {
        imageUrl = await uploadImage(selectedFile);
      }

      const data = {
        ...partnerFormData,
        imageUrl,
        startDate: partnerFormData.startDate || null,
        endDate: partnerFormData.endDate || null
      };

      if (partnerDialog.partner) {
        await api.put(`/partners/${partnerDialog.partner.id}`, data);
        setMessage('Parceiro atualizado com sucesso!');
      } else {
        await api.post('/partners', data);
        setMessage('Parceiro criado com sucesso!');
      }
      
      setTimeout(() => setMessage(''), 3000);
      handleClosePartnerDialog();
      fetchPartners();
    } catch (error) {
      console.error('Erro ao salvar parceiro:', error);
      setMessage(error.response?.data?.message || 'Erro ao salvar parceiro');
      setTimeout(() => setMessage(''), 3000);
    } finally {
      setActionLoading(prev => ({ ...prev, savePartner: false }));
      setUploadingImage(false);
      setUploadProgress(0);
    }
  };

  const handleTogglePartnerActive = async (partnerId) => {
    setActionLoading(prev => ({ ...prev, [`partner_${partnerId}`]: true }));
    try {
      await api.patch(`/partners/${partnerId}/toggle`);
      setMessage('Status do parceiro atualizado!');
      setTimeout(() => setMessage(''), 3000);
      fetchPartners();
    } catch (error) {
      console.error('Erro ao atualizar status do parceiro:', error);
      setMessage('Erro ao atualizar status do parceiro');
      setTimeout(() => setMessage(''), 3000);
    } finally {
      setActionLoading(prev => ({ ...prev, [`partner_${partnerId}`]: false }));
    }
  };

  const handleDeletePartner = async (partnerId) => {
    if (!confirm('Tem certeza que deseja excluir este parceiro?')) return;
    
    setActionLoading(prev => ({ ...prev, [`delete_partner_${partnerId}`]: true }));
    try {
      await api.delete(`/partners/${partnerId}`);
      setMessage('Parceiro excluído com sucesso!');
      setTimeout(() => setMessage(''), 3000);
      fetchPartners();
    } catch (error) {
      console.error('Erro ao excluir parceiro:', error);
      setMessage('Erro ao excluir parceiro');
      setTimeout(() => setMessage(''), 3000);
    } finally {
      setActionLoading(prev => ({ ...prev, [`delete_partner_${partnerId}`]: false }));
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 py-4 sm:py-6 lg:py-8">
        
        <div className="mb-4 sm:mb-6">
          <Button variant="ghost" asChild className="mb-4">
            <Link to="/admin">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar ao Dashboard
            </Link>
          </Button>
          
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 mb-1 sm:mb-2">
            Gerenciamento de Parceiros
          </h1>
          <p className="text-sm sm:text-base text-gray-600">
            Configure banners de divulgação dos parceiros do sistema
          </p>
        </div>

        {message && (
          <Alert className="mb-4 sm:mb-6">
            <AlertDescription className="text-sm">{message}</AlertDescription>
          </Alert>
        )}

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Parceiros ({partners.length})</CardTitle>
              <Button onClick={() => handleOpenPartnerDialog()}>
                <Image className="h-4 w-4 mr-2" />
                Adicionar Parceiro
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {partners.length === 0 ? (
              <div className="text-center py-12">
                <Image className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                <p className="text-gray-500 text-sm">Nenhum parceiro cadastrado</p>
                <Button 
                  onClick={() => handleOpenPartnerDialog()} 
                  variant="outline" 
                  className="mt-4"
                >
                  Adicionar primeiro parceiro
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {partners.map((partner) => (
                  <Card key={partner.id} className="border-gray-200">
                    <CardContent className="p-4">
                      <div className="flex flex-col sm:flex-row gap-4">
                        <div className="w-full sm:w-40 h-40 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                          {partner.imageUrl ? (
                            <img
                              src={partner.imageUrl}
                              alt={partner.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-gray-400">
                              <Image className="h-10 w-10" />
                            </div>
                          )}
                        </div>

                        <div className="flex-1">
                          <div className="flex items-start justify-between mb-3">
                            <div>
                              <h3 className="font-semibold text-lg mb-2">{partner.name}</h3>
                              <div className="flex items-center gap-2">
                                <Badge variant={partner.isActive ? "default" : "secondary"}>
                                  {partner.isActive ? 'Ativo' : 'Inativo'}
                                </Badge>
                                <span className="text-xs text-gray-500">
                                  Ordem: {partner.displayOrder}
                                </span>
                              </div>
                            </div>
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleOpenPartnerDialog(partner)}
                                title="Editar"
                              >
                                <Settings className="h-4 w-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleTogglePartnerActive(partner.id)}
                                disabled={actionLoading[`partner_${partner.id}`]}
                                title={partner.isActive ? 'Desativar' : 'Ativar'}
                              >
                                {actionLoading[`partner_${partner.id}`] ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : partner.isActive ? (
                                  <EyeOff className="h-4 w-4" />
                                ) : (
                                  <Eye className="h-4 w-4" />
                                )}
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => handleDeletePartner(partner.id)}
                                disabled={actionLoading[`delete_partner_${partner.id}`]}
                                title="Excluir"
                              >
                                {actionLoading[`delete_partner_${partner.id}`] ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  <Trash2 className="h-4 w-4" />
                                )}
                              </Button>
                            </div>
                          </div>

                          <div className="space-y-2 text-sm">
                            <div className="flex items-center gap-2 text-gray-600">
                              <ExternalLink className="h-4 w-4 flex-shrink-0" />
                              <a
                                href={partner.redirectUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="hover:underline truncate"
                              >
                                {partner.redirectUrl}
                              </a>
                            </div>
                            {(partner.startDate || partner.endDate) && (
                              <div className="text-xs text-gray-500">
                                {partner.startDate && `Início: ${new Date(partner.startDate).toLocaleDateString('pt-BR')}`}
                                {partner.startDate && partner.endDate && ' - '}
                                {partner.endDate && `Fim: ${new Date(partner.endDate).toLocaleDateString('pt-BR')}`}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Dialog open={partnerDialog.open} onOpenChange={(open) => !open && handleClosePartnerDialog()}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {partnerDialog.partner ? 'Editar Parceiro' : 'Adicionar Parceiro'}
            </DialogTitle>
            <DialogDescription>
              Preencha as informações do parceiro para exibição no sistema
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="partnerName">Nome do Parceiro</Label>
              <Input
                id="partnerName"
                value={partnerFormData.name}
                onChange={(e) => handlePartnerFormChange('name', e.target.value)}
                placeholder="Nome do parceiro"
              />
            </div>

            <div className="space-y-2">
              <Label>Imagem do Banner</Label>
              <div className="flex gap-2">
                <div className="flex-1">
                  <Input
                    type="file"
                    accept="image/jpeg,image/jpg,image/png,image/webp,image/gif"
                    onChange={handleFileSelect}
                    disabled={uploadingImage}
                    className="cursor-pointer"
                  />
                </div>
              </div>
              <p className="text-xs text-gray-500">
                Formatos: JPG, PNG, WebP, GIF (máx. 5MB). Upload será feito ao salvar.
              </p>
              
              {uploadingImage && (
                <div className="mt-3 space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Fazendo upload...</span>
                    <span className="font-medium">{uploadProgress}%</span>
                  </div>
                  <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-blue-600 transition-all duration-300 ease-out"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                </div>
              )}
              
              {(imagePreview || partnerFormData.imageUrl) && !uploadingImage && (
                <div className="mt-2 w-full h-48 bg-gray-100 rounded-lg overflow-hidden border-2 border-dashed border-gray-300">
                  <img
                    src={imagePreview || partnerFormData.imageUrl}
                    alt="Preview"
                    className="w-full h-full object-contain"
                    onError={(e) => {
                      e.target.style.display = 'none';
                    }}
                  />
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="redirectUrl">URL de Redirecionamento</Label>
              <Input
                id="redirectUrl"
                value={partnerFormData.redirectUrl}
                onChange={(e) => handlePartnerFormChange('redirectUrl', e.target.value)}
                placeholder="https://exemplo.com ou https://wa.me/5511999999999"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="displayOrder">Ordem de Exibição</Label>
              <Input
                id="displayOrder"
                type="number"
                min="0"
                value={partnerFormData.displayOrder}
                onChange={(e) => handlePartnerFormChange('displayOrder', parseInt(e.target.value) || 0)}
                placeholder="0"
              />
              <p className="text-xs text-muted-foreground">
                Menor valor = maior prioridade
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="startDate">Data de Início (opcional)</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={partnerFormData.startDate}
                  onChange={(e) => handlePartnerFormChange('startDate', e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="endDate">Data de Fim (opcional)</Label>
                <Input
                  id="endDate"
                  type="date"
                  value={partnerFormData.endDate}
                  onChange={(e) => handlePartnerFormChange('endDate', e.target.value)}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={handleClosePartnerDialog} disabled={uploadingImage}>
              Cancelar
            </Button>
            <Button
              onClick={handleSavePartner}
              disabled={actionLoading.savePartner || uploadingImage || !partnerFormData.name || !selectedFile || !partnerFormData.redirectUrl}
            >
              {uploadingImage ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Enviando imagem... {uploadProgress}%
                </>
              ) : actionLoading.savePartner ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Salvando...
                </>
              ) : (
                'Salvar'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminPartners;
