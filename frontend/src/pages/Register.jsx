import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { GlassCard } from '@/components/ui/glass-card';
import { BackgroundDecoration } from '@/components/ui/background-decoration';
import { Loader2, User, Mail, Lock, Phone } from 'lucide-react';
import { clearAccessCache } from '@/components/ProtectedRoute';

const countries = [
  { code: '+55', name: 'Brasil', flag: '🇧🇷', mask: '(XX) XXXXX-XXXX', length: 11 },
  { code: '+1', name: 'EUA/Canada', flag: '🇺🇸', mask: '(XXX) XXX-XXXX', length: 10 },
  { code: '+351', name: 'Portugal', flag: '🇵🇹', mask: 'XXX XXX XXX', length: 9 },
  { code: '+34', name: 'Espanha', flag: '🇪🇸', mask: 'XXX XX XX XX', length: 9 },
  { code: '+44', name: 'Reino Unido', flag: '🇬🇧', mask: 'XXXX XXX XXXX', length: 10 },
  { code: '+33', name: 'Franca', flag: '🇫🇷', mask: 'X XX XX XX XX', length: 9 },
  { code: '+49', name: 'Alemanha', flag: '🇩🇪', mask: 'XXX XXXXXXXX', length: 11 },
  { code: '+39', name: 'Italia', flag: '🇮🇹', mask: 'XXX XXX XXXX', length: 10 },
  { code: '+52', name: 'Mexico', flag: '🇲🇽', mask: 'XX XXXX XXXX', length: 10 },
  { code: '+54', name: 'Argentina', flag: '🇦🇷', mask: 'XX XXXX XXXX', length: 10 },
];

const Register = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [selectedCountry, setSelectedCountry] = useState(countries[0]);
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const { register } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    console.log('🧹 Limpando localStorage e cache ao abrir página de registro');
    localStorage.clear();
    clearAccessCache();
  }, []);

  const formatPhoneByCountry = (value, country) => {
    const numbers = value.replace(/\D/g, '');

    if (country.code === '+55') {
      if (numbers.length <= 2) return numbers;
      if (numbers.length <= 7) return `(${numbers.slice(0, 2)}) ${numbers.slice(2)}`;
      return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 7)}-${numbers.slice(7, 11)}`;
    }

    if (country.code === '+1') {
      if (numbers.length <= 3) return numbers;
      if (numbers.length <= 6) return `(${numbers.slice(0, 3)}) ${numbers.slice(3)}`;
      return `(${numbers.slice(0, 3)}) ${numbers.slice(3, 6)}-${numbers.slice(6, 10)}`;
    }

    if (country.code === '+351' || country.code === '+33') {
      if (numbers.length <= 3) return numbers;
      if (numbers.length <= 6) return `${numbers.slice(0, 3)} ${numbers.slice(3)}`;
      return `${numbers.slice(0, 3)} ${numbers.slice(3, 6)} ${numbers.slice(6, 9)}`;
    }

    if (country.code === '+34') {
      if (numbers.length <= 3) return numbers;
      if (numbers.length <= 5) return `${numbers.slice(0, 3)} ${numbers.slice(3)}`;
      if (numbers.length <= 7) return `${numbers.slice(0, 3)} ${numbers.slice(3, 5)} ${numbers.slice(5)}`;
      return `${numbers.slice(0, 3)} ${numbers.slice(3, 5)} ${numbers.slice(5, 7)} ${numbers.slice(7, 9)}`;
    }

    if (country.code === '+44') {
      if (numbers.length <= 4) return numbers;
      if (numbers.length <= 7) return `${numbers.slice(0, 4)} ${numbers.slice(4)}`;
      return `${numbers.slice(0, 4)} ${numbers.slice(4, 7)} ${numbers.slice(7, 11)}`;
    }

    if (country.code === '+52' || country.code === '+54') {
      if (numbers.length <= 2) return numbers;
      if (numbers.length <= 6) return `${numbers.slice(0, 2)} ${numbers.slice(2)}`;
      return `${numbers.slice(0, 2)} ${numbers.slice(2, 6)} ${numbers.slice(6, 10)}`;
    }

    return numbers;
  };

  const handlePhoneChange = (e) => {
    const formatted = formatPhoneByCountry(e.target.value, selectedCountry);
    setPhone(formatted);
  };

  const handleCountryChange = (e) => {
    const country = countries.find(c => c.code === e.target.value);
    setSelectedCountry(country);
    setPhone('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    if (password !== confirmPassword) {
      setError('As senhas nao coincidem');
      setLoading(false);
      return;
    }

    if (password.length < 6) {
      setError('A senha deve ter pelo menos 6 caracteres');
      setLoading(false);
      return;
    }

    const phoneNumbers = phone.replace(/\D/g, '');

    if (phoneNumbers.length !== selectedCountry.length) {
      setError(`Telefone invalido. Use o formato: ${selectedCountry.mask}`);
      setLoading(false);
      return;
    }

    const fullPhone = selectedCountry.code + phoneNumbers;
    const result = await register(name, email.toLowerCase(), fullPhone, password);

    if (result.success) {
      setSuccess(result.message);
      setTimeout(() => {
        navigate('/login');
      }, 3000);
    } else {
      setError(result.message);
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-neutral-100 dark:bg-neutral-950 px-4 relative">
      <BackgroundDecoration variant="subtle" />
      <GlassCard variant="panel" padding="none" className="w-full max-w-md animate-fade-up">
        <div className="p-6 pb-2 space-y-1">
          <h2 className="text-2xl font-bold text-center text-neutral-900 dark:text-white">Cadastrar</h2>
          <p className="text-center text-neutral-500 dark:text-neutral-400 mb-5 text-sm">
            Crie sua conta para acessar o sistema
          </p>
        </div>
        <div className="p-6 pt-2">
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {success && (
              <Alert>
                <AlertDescription className="text-green-700">
                  {success}
                </AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label htmlFor="name">Nome completo</Label>
              <div className="relative">
                <User className="absolute left-3 top-3.5 h-4 w-4 text-neutral-400" />
                <Input
                  id="name"
                  type="text"
                  placeholder="Seu nome completo"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="pl-10 h-12 rounded-xl border-neutral-200 dark:border-neutral-700"
                  required
                />
              </div>
            </div>

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
              <Label htmlFor="phone">WhatsApp</Label>
              <div className="flex gap-2">
                <select
                  value={selectedCountry.code}
                  onChange={handleCountryChange}
                  className="w-32 px-3 py-2 h-12 border border-neutral-200 dark:border-neutral-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-neutral-400 bg-white/50 dark:bg-white/5 backdrop-blur-sm"
                >
                  {countries.map((country) => (
                    <option key={country.code} value={country.code}>
                      {country.flag} {country.code}
                    </option>
                  ))}
                </select>
                <div className="relative flex-1">
                  <Phone className="absolute left-3 top-3.5 h-4 w-4 text-neutral-400" />
                  <Input
                    id="phone"
                    type="tel"
                    placeholder={selectedCountry.mask}
                    value={phone}
                    onChange={handlePhoneChange}
                    className="pl-10 h-12 rounded-xl border-neutral-200 dark:border-neutral-700"
                    required
                  />
                </div>
              </div>
              <p className="text-xs text-neutral-400">Formato: {selectedCountry.mask}</p>
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
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirmar senha</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-3.5 h-4 w-4 text-neutral-400" />
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="pl-10 h-12 rounded-xl border-neutral-200 dark:border-neutral-700"
                  required
                />
              </div>
            </div>

            <Button type="submit" variant="accent" size="pill" className="w-full cursor-pointer" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Cadastrando...
                </>
              ) : (
                'Cadastrar'
              )}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-neutral-500 dark:text-neutral-400">
              Ja tem uma conta?{' '}
              <Link to="/login" className="text-neutral-900 dark:text-white hover:underline font-medium">
                Entre aqui
              </Link>
            </p>
          </div>
        </div>
      </GlassCard>
    </div>
  );
};

export default Register;
