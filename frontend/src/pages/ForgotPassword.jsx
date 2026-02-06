import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { GlassCard } from '@/components/ui/glass-card';
import { BackgroundDecoration } from '@/components/ui/background-decoration';
import { ArrowLeft, CheckCircle, Loader2, Mail } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import api from '@/lib/axios';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await api.post('/auth/forgot-password', { email });
      setSuccess(true);
    } catch (err) {
      setError(err.response?.data?.message || 'Erro ao processar solicitacao. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

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
              Email Enviado!
            </h2>
            <p className="text-center text-neutral-500 dark:text-neutral-400 text-sm">
              Verifique sua caixa de entrada
            </p>
          </div>
          <div className="p-6 pt-2 space-y-4">
            <p className="text-center text-neutral-600 dark:text-neutral-400">
              Se o email <strong className="text-neutral-900 dark:text-white">{email}</strong> estiver
              cadastrado em nossa base, voce recebera um link para redefinir sua senha.
            </p>

            <div className="pt-4">
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

  return (
    <div className="min-h-screen flex items-center justify-center bg-neutral-100 dark:bg-neutral-950 px-4 relative">
      <BackgroundDecoration variant="subtle" />
      <GlassCard variant="panel" padding="none" className="w-full max-w-md animate-fade-up">
        <div className="p-6 pb-2 space-y-1">
          <h2 className="text-2xl font-bold text-center text-neutral-900 dark:text-white">
            Esqueceu sua senha?
          </h2>
          <p className="text-center text-neutral-500 dark:text-neutral-400 text-sm">
            Digite seu email e enviaremos um link para redefinir sua senha
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

            <Button type="submit" variant="accent" size="pill" className="w-full" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Enviando...
                </>
              ) : (
                'Enviar Link de Recuperacao'
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

export default ForgotPassword;
