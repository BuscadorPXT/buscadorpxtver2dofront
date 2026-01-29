import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Clock, MessageCircle, Check, DollarSign } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import api from '@/lib/axios';

const PlanExpiredModal = ({ open, onOpenChange }) => {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (open) {
      fetchPlans();
    }
  }, [open]);

  const fetchPlans = async () => {
    try {
      const response = await api.get('/plans?activeOnly=true');
      setPlans(response.data);
    } catch (error) {
      console.error('Erro ao buscar planos:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDuration = (plan) => {
    if (plan.durationType === 'days') {
      const days = Math.floor(plan.hours || 0);
      return `${days} ${days === 1 ? 'dia' : 'dias'}`;
    }
    return `${plan.hours} ${plan.hours === 1 ? 'hora' : 'horas'}`;
  };

  const handleContactWhatsApp = (plan) => {
    const duration = formatDuration(plan);
    const message = encodeURIComponent(
      `Olá! Gostaria de contratar o plano *${plan.name}* (${duration} por R$ ${plan.price})`
    );
    const phone = plan.whatsappNumber || '5511999999999';
    window.open(`https://wa.me/${phone}?text=${message}`, '_blank');
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[90vw] lg:max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="mb-4">
            <DialogTitle className="text-2xl font-bold text-gray-900 dark:text-white">
              Seu tempo acabou
            </DialogTitle>
            <DialogDescription className="text-base mt-2">
              Escolha um plano para continuar usando o sistema
            </DialogDescription>
          </div>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="text-center">
              <div className="animate-spin rounded-full h-10 w-10 border-2 border-gray-300 border-t-blue-600 mx-auto mb-4"></div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Carregando planos...</p>
            </div>
          </div>
        ) : plans.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-600 dark:text-gray-400">Nenhum plano disponível no momento.</p>
          </div>
        ) : (
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3 mt-4">
            {plans.map((plan) => (
              <Card 
                key={plan.id} 
                className="hover:shadow-lg transition-all duration-200 relative overflow-hidden"
                style={{ borderTop: `3px solid ${plan.color || '#3b82f6'}` }}
              >
                <CardHeader className="pb-3">
                  <CardTitle className="text-xl">{plan.name}</CardTitle>
                  {plan.description && (
                    <CardDescription>{plan.description}</CardDescription>
                  )}
                </CardHeader>
                
                <CardContent className="space-y-4">

                  <div className="text-center py-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                    <div className="flex items-baseline justify-center gap-1">
                      <span className="text-3xl font-bold text-gray-900 dark:text-white">
                        {parseFloat(plan.price).toLocaleString('pt-BR', {
                          style: 'currency',
                          currency: 'BRL'
                        })}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                    <Clock className="h-4 w-4" />
                    <span className="font-medium">{formatDuration(plan)} de uso</span>
                  </div>

                  {plan.features && plan.features.length > 0 && (
                    <ul className="space-y-2 pt-2 border-t">
                      {plan.features.map((feature, index) => (
                        <li key={index} className="flex items-start gap-2 text-sm">
                          <Check className="h-4 w-4 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" />
                          <span className="text-gray-700 dark:text-gray-300">{feature}</span>
                        </li>
                      ))}
                    </ul>
                  )}

                  <Button 
                    className="w-full gap-2 mt-4" 
                    onClick={() => handleContactWhatsApp(plan)}
                    style={{ 
                      backgroundColor: plan.color || '#3b82f6'
                    }}
                  >
                    <MessageCircle className="h-4 w-4" />
                    Contratar via WhatsApp
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        <div className="flex justify-end gap-3 mt-6 pt-4 border-t">
          <Button variant="outline" onClick={handleLogout}>
            Sair do sistema
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PlanExpiredModal;
