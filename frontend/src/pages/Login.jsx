import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { GlassCard } from '@/components/ui/glass-card';
import { BackgroundDecoration } from '@/components/ui/background-decoration';
import { Info, Loader2, Lock, Mail } from 'lucide-react';
import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { clearAccessCache } from '@/components/ProtectedRoute';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    console.log('🧹 Limpando localStorage e cache ao abrir página de login');
    localStorage.clear();
    clearAccessCache();
  }, []);

  const from = location.state?.from?.pathname || null;
  const requiresAuth = location.state?.from?.pathname && location.state.from.pathname !== '/';

  const sessionExpired = new URLSearchParams(location.search).get('expired') === 'true';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const result = await login(email, password);

    if (result.success) {

      const defaultRoute = result.user?.isAdmin ? '/' : '/products';
      const destination = from || defaultRoute;

      navigate(destination, { replace: true });
    } else {

      if (result.statusCode === 403 && result.message?.includes('Limite de dispositivos')) {
        setError({
          type: 'ip-limit',
          message: result.message,
        });
      } else {
        setError(result.message);
      }
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-neutral-100 dark:bg-neutral-950 px-4 relative">
      <BackgroundDecoration variant="subtle" />
      <GlassCard variant="panel" padding="none" className="w-full max-w-md animate-fade-up">
        <div className="p-6 pb-2 space-y-1">
          <h2 className="text-2xl font-bold text-center text-neutral-900 dark:text-white">Entrar</h2>
          <p className="text-center text-neutral-500 dark:text-neutral-400 mb-5 text-sm">
            Entre com suas credenciais para acessar o sistema
          </p>
        </div>
        <div className="p-6 pt-2">
          <form onSubmit={handleSubmit} className="space-y-4">
            {sessionExpired && (
              <Alert className="bg-orange-50 border-orange-200">
                <Info className="h-4 w-4 text-orange-600" />
                <AlertDescription className="text-orange-800">
                  Sua sessao expirou. Por favor, faca login novamente.
                </AlertDescription>
              </Alert>
            )}

            {requiresAuth && !sessionExpired && (
              <Alert className="bg-blue-50 border-blue-200">
                <Info className="h-4 w-4 text-primary" />
                <AlertDescription className="text-blue-800">
                  Voce precisa fazer login para acessar os produtos.
                </AlertDescription>
              </Alert>
            )}

            {error && (
              <>
                {error.type === 'ip-limit' ? (
                  <Alert className="bg-red-50 border-red-200">
                    <AlertDescription className="text-red-900">
                      <p className="font-semibold mb-2">{error.message}</p>
                      <p className="text-sm text-red-700 mb-3">
                        Para fazer login neste dispositivo, voce precisa desconectar um dos dispositivos atualmente em uso.
                      </p>
                    </AlertDescription>
                  </Alert>
                ) : (
                  <Alert variant="destructive">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}
              </>
            )}

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-3.5 h-4 w-4 text-neutral-400" />
                <Input
                  id="email"
                  type="email"
                  placeholder="seu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10 h-12 rounded-xl border-neutral-200 dark:border-neutral-700"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Senha</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-3.5 h-4 w-4 text-neutral-400" />
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 h-12 rounded-xl border-neutral-200 dark:border-neutral-700"
                  required
                />
              </div>
              <div className="text-right">
                <Link
                  to="/forgot-password"
                  className="text-xs text-neutral-500 hover:text-neutral-900 dark:hover:text-white hover:underline transition-colors"
                >
                  Esqueceu a senha?
                </Link>
              </div>
            </div>

            <Button type="submit" variant="accent" size="pill" className="w-full cursor-pointer" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Entrando...
                </>
              ) : (
                'Entrar'
              )}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-neutral-500 dark:text-neutral-400">
              Nao tem uma conta?{' '}
              <Link to="/register" className="text-neutral-900 dark:text-white hover:underline font-medium">
                Cadastre-se aqui
              </Link>
            </p>
          </div>
        </div>
      </GlassCard>
    </div>
  );
};

export default Login;
