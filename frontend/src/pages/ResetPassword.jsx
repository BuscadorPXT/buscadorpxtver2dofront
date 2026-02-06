import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { GlassCard } from '@/components/ui/glass-card';
import { BackgroundDecoration } from '@/components/ui/background-decoration';
import { ArrowLeft, CheckCircle, Eye, EyeOff, Loader2, Lock, XCircle } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import api from '@/lib/axios';

const ResetPassword = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token');

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [validating, setValidating] = useState(true);
  const [tokenValid, setTokenValid] = useState(false);
  const [maskedEmail, setMaskedEmail] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const validateToken = async () => {
      if (!token) {
        setValidating(false);
        setTokenValid(false);
        return;
      }

      try {
        const response = await api.get(`/auth/validate-reset-token?token=${token}`);
        setTokenValid(response.data.valid);
        if (response.data.email) {
          setMaskedEmail(response.data.email);
        }
      } catch (err) {
        setTokenValid(false);
      } finally {
        setValidating(false);
      }
    };

    validateToken();
  }, [token]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (password.length < 6) {
      setError('A senha deve ter no minimo 6 caracteres');
      return;
    }

    if (password !== confirmPassword) {
      setError('As senhas nao coincidem');
      return;
    }

    setLoading(true);

    try {
      await api.post('/auth/reset-password', {
        token,
        newPassword: password,
      });
      setSuccess(true);
    } catch (err) {
      setError(err.response?.data?.message || 'Erro ao redefinir senha. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  if (validating) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-100 dark:bg-neutral-950 px-4 relative">
        <BackgroundDecoration variant="subtle" />
        <GlassCard variant="panel" padding="none" className="w-full max-w-md animate-fade-up">
          <div className="flex flex-col items-center justify-center py-12 px-6">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="mt-4 text-neutral-500 dark:text-neutral-400">Validando link...</p>
          </div>
        </GlassCard>
      </div>
    );
  }

  if (!tokenValid) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-100 dark:bg-neutral-950 px-4 relative">
        <BackgroundDecoration variant="subtle" />
        <GlassCard variant="panel" padding="none" className="w-full max-w-md animate-fade-up">
          <div className="p-6 pb-2 space-y-1">
            <div className="flex justify-center mb-4">
              <div className="bg-red-100 dark:bg-red-900/30 p-3 rounded-full">
                <XCircle className="h-8 w-8 text-red-600 dark:text-red-400" />
              </div>
            </div>
            <h2 className="text-2xl font-bold text-center text-neutral-900 dark:text-white">
              Link Invalido
            </h2>
            <p className="text-center text-neutral-500 dark:text-neutral-400 text-sm">
              O link de recuperacao e invalido ou expirou
            </p>
          </div>
          <div className="p-6 pt-2 space-y-4">
            <p className="text-center text-neutral-600 dark:text-neutral-400">
              Os links de recuperacao de senha sao validos por apenas 1 hora.
              Se voce ainda precisa redefinir sua senha, solicite um novo link.
            </p>

            <div className="flex flex-col gap-2 pt-4">
              <Link to="/forgot-password">
                <Button variant="accent" size="pill" className="w-full">
                  Solicitar Novo Link
                </Button>
              </Link>
              <Link to="/login">
                <Button variant="outline" className="w-full rounded-xl">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Voltar para o Login
                </Button>
              </Link>
            </div>
          </div>
        </GlassCard>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-100 dark:bg-neutral-950 px-4 relative">
        <BackgroundDecoration variant="subtle" />
        <GlassCard variant="panel" padding="none" className="w-full max-w-md animate-fade-up">
          <div className="p-6 pb-2 space-y-1">
            <div className="flex justify-center mb-4">
              <div className="bg-emerald-100 dark:bg-emerald-900/30 p-3 rounded-full">
                <CheckCircle className="h-8 w-8 text-emerald-600 dark:text-emerald-400" />
              </div>
            </div>
            <h2 className="text-2xl font-bold text-center text-neutral-900 dark:text-white">
              Senha Redefinida!
            </h2>
            <p className="text-center text-neutral-500 dark:text-neutral-400 text-sm">
              Sua senha foi alterada com sucesso
            </p>
          </div>
          <div className="p-6 pt-2 space-y-4">
            <p className="text-center text-neutral-600 dark:text-neutral-400">
              Agora voce ja pode fazer login com sua nova senha.
            </p>

            <div className="pt-4">
              <Button variant="accent" size="pill" className="w-full" onClick={() => navigate('/login')}>
                Ir para o Login
              </Button>
            </div>
          </div>
        </GlassCard>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-neutral-100 dark:bg-neutral-950 px-4 relative">
      <BackgroundDecoration variant="subtle" />
      <GlassCard variant="panel" padding="none" className="w-full max-w-md animate-fade-up">
        <div className="p-6 pb-2 space-y-1">
          <h2 className="text-2xl font-bold text-center text-neutral-900 dark:text-white">
            Redefinir Senha
          </h2>
          <p className="text-center text-neutral-500 dark:text-neutral-400 text-sm">
            {maskedEmail && (
              <>Criando nova senha para <strong>{maskedEmail}</strong></>
            )}
          </p>
        </div>
        <div className="p-6 pt-2">
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label htmlFor="password">Nova Senha</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-3.5 h-4 w-4 text-neutral-400" />
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 pr-10 h-12 rounded-xl border-neutral-200 dark:border-neutral-700"
                  required
                  minLength={6}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3.5 text-neutral-400 hover:text-neutral-600"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              <p className="text-xs text-neutral-400">
                Minimo de 6 caracteres
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirmar Nova Senha</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-3.5 h-4 w-4 text-neutral-400" />
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="pl-10 pr-10 h-12 rounded-xl border-neutral-200 dark:border-neutral-700"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-3.5 text-neutral-400 hover:text-neutral-600"
                >
                  {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <Button type="submit" variant="accent" size="pill" className="w-full" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Redefinindo...
                </>
              ) : (
                'Redefinir Senha'
              )}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <Link
              to="/login"
              className="text-sm text-neutral-500 hover:text-neutral-900 dark:hover:text-white hover:underline font-medium inline-flex items-center transition-colors"
            >
              <ArrowLeft className="mr-1 h-4 w-4" />
              Voltar para o Login
            </Link>
          </div>
        </div>
      </GlassCard>
    </div>
  );
};

export default ResetPassword;
