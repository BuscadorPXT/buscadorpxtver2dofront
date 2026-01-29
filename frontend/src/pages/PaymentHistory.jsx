import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import api from '@/lib/axios';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Receipt, History, CreditCard } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

const PaymentHistory = () => {
  const { isAdmin } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPaymentHistory();
  }, []);

  const fetchPaymentHistory = async () => {
    setLoading(true);
    try {
      const response = await api.get('/subscriptions/me/payment-history');
      setData(response.data);
    } catch (error) {
      console.error('Erro ao buscar histórico:', error);
      toast.error('Erro ao carregar histórico de pagamentos');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const getPaymentMethodLabel = (method) => {
    const methods = {
      pix: 'PIX',
      credit_card: 'Cartão de Crédito',
      bank_transfer: 'Transferência',
      cash: 'Dinheiro',
    };
    return methods[method] || method;
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6 max-w-4xl">
        <Card>
          <CardContent className="flex items-center justify-center h-64">
            <p>Carregando...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isAdmin) {
    return null;
  }

  if (!data || !data.subscription) {
    return (
      <div className="container mx-auto p-6 max-w-4xl">
        <Card>
          <CardContent className="flex flex-col items-center justify-center h-64 gap-4">
            <Receipt className="h-12 w-12 text-muted-foreground" />
            <div className="text-center">
              <h2 className="text-xl font-bold mb-2">Sem Assinatura</h2>
              <p className="text-muted-foreground">
                Você ainda não possui uma assinatura ativa.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const { subscription, history, totalPaid } = data;

  const sortedHistory = [...history].sort((a, b) => new Date(a.date) - new Date(b.date));
  
  const timeline = sortedHistory.map((record, index) => ({
    ...record,
    type: index === 0 ? 'initial' : 'renewal',
  })).sort((a, b) => new Date(b.date) - new Date(a.date));

  return (
    <div className="container mx-auto p-6 max-w-4xl space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Histórico de Pagamentos</h1>
        <p className="text-muted-foreground">Timeline das suas renovações e pagamentos</p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <History className="h-5 w-5" />
              <CardTitle>Timeline de Pagamentos</CardTitle>
            </div>
            <div className="text-right">
              <p className="text-sm text-muted-foreground">Total pago</p>
              <p className="text-2xl font-bold text-green-600">{formatCurrency(totalPaid)}</p>
            </div>
          </div>
          <CardDescription>
            {timeline.length === 1 
              ? 'Pagamento inicial realizado'
              : `${timeline.length} pagamento${timeline.length > 1 ? 's' : ''} registrado${timeline.length > 1 ? 's' : ''}`
            }
          </CardDescription>
        </CardHeader>
        <CardContent>
          {timeline.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Receipt className="h-16 w-16 mx-auto mb-4 opacity-30" />
              <p className="text-lg font-medium">Nenhum pagamento registrado</p>
              <p className="text-sm">Os pagamentos aparecerão aqui quando forem realizados</p>
            </div>
          ) : (
            <div className="relative">

              <div className="absolute left-5 top-0 bottom-0 w-0.5 bg-gradient-to-b from-primary via-primary/50 to-transparent"></div>

              <div className="space-y-6">
                {timeline.map((item, index) => (
                  <div key={index} className="relative pl-14">

                    <div className="absolute left-0 top-0">
                      <div className="h-10 w-10 rounded-full bg-background border-2 border-primary flex items-center justify-center shadow-lg">
                        {item.type === 'initial' ? (
                          <CreditCard className="h-5 w-5 text-primary" />
                        ) : (
                          <Receipt className="h-5 w-5 text-primary" />
                        )}
                      </div>
                    </div>

                    <Card className="hover:shadow-md transition-shadow">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              {item.type === 'initial' ? (
                                <Badge variant="default">Pagamento Inicial</Badge>
                              ) : (
                                <Badge variant="secondary">Renovação</Badge>
                              )}
                              <Badge variant="outline">
                                {getPaymentMethodLabel(item.paymentMethod)}
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground">
                              {format(new Date(item.date), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                            </p>
                            {item.type === 'renewal' && item.duration && (
                              <p className="text-xs text-muted-foreground mt-1">
                                Renovação de {item.duration} dias
                              </p>
                            )}
                          </div>
                          <div className="text-right">
                            <p className="text-2xl font-bold text-green-600">
                              {formatCurrency(item.amount)}
                            </p>
                          </div>
                        </div>

                        {item.type === 'renewal' && item.previousEndDate && item.newEndDate && (
                          <div className="mt-3 pt-3 border-t flex gap-4 text-xs text-muted-foreground">
                            <div>
                              <span className="font-medium">De:</span>{' '}
                              {format(new Date(item.previousEndDate), 'dd/MM/yyyy')}
                            </div>
                            <div>
                              <span className="font-medium">Até:</span>{' '}
                              {format(new Date(item.newEndDate), 'dd/MM/yyyy')}
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default PaymentHistory;
