import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertCircle, MessageCircle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

const AccessDenied = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleWhatsApp = () => {
    const phone = '5511999999999';
    const message = encodeURIComponent(
      `Olá! Meu acesso ao sistema está bloqueado.\n\nNome: ${user?.name}\nEmail: ${user?.email}\n\nGostaria de renovar minha assinatura.`
    );
    window.open(`https://wa.me/${phone}?text=${message}`, '_blank');
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center space-y-4">
          <div className="mx-auto w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center">
            <AlertCircle className="w-8 h-8 text-destructive" />
          </div>
          <CardTitle className="text-2xl">Acesso Bloqueado</CardTitle>
          <CardDescription className="text-base">
            Sua assinatura está pendente de pagamento
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-6">
          <div className="bg-muted rounded-lg p-4 space-y-2">
            <p className="text-sm text-center text-muted-foreground">
              Seu plano não possui mais saldo disponível para acessar o sistema.
            </p>
            <p className="text-sm text-center font-medium">
              Entre em contato conosco para renovar sua assinatura e continuar utilizando nossos serviços.
            </p>
          </div>

          <div className="space-y-3">
            <Button 
              className="w-full cursor-pointer bg-green-600 hover:bg-green-700 text-white"
              onClick={handleWhatsApp}
            >
              <MessageCircle className="w-4 h-4 mr-2" />
              Falar no WhatsApp
            </Button>

            <Button 
              variant="outline" 
              className="w-full cursor-pointer"
              onClick={handleLogout}
            >
              Sair da Conta
            </Button>
          </div>

          <div className="text-center">
            <p className="text-xs text-muted-foreground">
              Usuário: <strong>{user?.email}</strong>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AccessDenied;
