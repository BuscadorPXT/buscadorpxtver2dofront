import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import logoWhite from '../assets/logo_branca.png';
import logoBlack from '../assets/logo_preta.png';
import { 
  ArrowRight, 
  Package, 
  Users, 
  Store, 
  MessageCircle, 
  Shield, 
  Search,
  TrendingUp,
  CheckCircle,
  Sparkles,
  Zap,
  Target,
  Smartphone,
  Laptop,
  Watch
} from 'lucide-react';

const Home = () => {
  const { user, isAuthenticated } = useAuth();

  const features = [
    {
      icon: Smartphone,
      title: 'Produtos Originais',
      description: 'Linha completa Apple com garantia de autenticidade.',
      gradient: 'from-blue-500 to-cyan-500'
    },
    {
      icon: TrendingUp,
      title: 'Melhor Preço',
      description: 'Compare e encontre as ofertas mais competitivas.',
      gradient: 'from-purple-500 to-pink-500'
    },
    {
      icon: Shield,
      title: 'Fornecedores Verificados',
      description: 'Parceiros confiáveis e certificados.',
      gradient: 'from-orange-500 to-red-500'
    },
    {
      icon: MessageCircle,
      title: 'Contato Direto',
      description: 'Negocie via WhatsApp instantaneamente.',
      gradient: 'from-green-500 to-emerald-500'
    }
  ];

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">

        <section className="relative overflow-hidden bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-900">
          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-0 sm:pt-10">
            <div className="text-center">

            <div className="mb-12 flex justify-center">
              <img src={logoBlack} alt="BuscadorPXT Logo" className="h-12 sm:h-16 w-auto opacity-90 dark:hidden" />
              <img src={logoWhite} alt="BuscadorPXT Logo" className="h-12 sm:h-16 w-auto opacity-90 hidden dark:block" />
            </div>

            {isAuthenticated && (
              <div className="mb-8 animate-fade-in">
                <Badge className="bg-black text-white border-0 px-4 py-2 text-sm font-medium rounded-full">
                  Bem-vindo{user?.isAdmin ? ' Admin' : ''}, {user?.name || 'Usuário'}
                </Badge>
              </div>
            )}

            <div className="mb-12">
              <h1 className="text-5xl sm:text-6xl lg:text-8xl font-bold text-gray-900 dark:text-white mb-6 leading-none tracking-tight">
                BuscadorPXT
              </h1>
              <p className="text-xl sm:text-2xl lg:text-3xl text-gray-600 dark:text-gray-300 font-semibold mb-4">
                Produtos Apple com os melhores preços.
              </p>
              <p className="text-base sm:text-lg text-gray-500 dark:text-gray-400 max-w-2xl mx-auto leading-relaxed">
                Compare preços de produtos Apple entre fornecedores verificados e encontre a melhor oferta.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-16">
              <Button asChild size="lg" className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-6 text-base font-semibold rounded-full shadow-lg hover:shadow-xl transition-all border-0">
                <Link to="/products">
                  Explorar produtos
                </Link>
              </Button>
              
              {!isAuthenticated && (
                <Button asChild variant="ghost" size="lg" className="text-blue-600 hover:text-blue-700 hover:bg-transparent px-8 py-6 text-base font-semibold">
                  <Link to="/register">
                    Criar conta →
                  </Link>
                </Button>
              )}
            </div>
          </div>
        </div>
      </section>

      <section className="py-24 bg-white dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <div key={index} className="text-center group">
                <div className={`mx-auto mb-6 p-6 bg-gradient-to-br ${feature.gradient} rounded-3xl w-fit shadow-lg group-hover:shadow-2xl transition-all duration-300 group-hover:scale-105`}>
                  <feature.icon className="h-10 w-10 text-white" strokeWidth={1.5} />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">{feature.title}</h3>
                <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-24 bg-gray-50 dark:bg-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-20">
            <h2 className="text-4xl sm:text-5xl font-bold text-gray-900 dark:text-white mb-4 tracking-tight">
              Explore a linha Apple.
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
              Compare preços em tempo real e encontre as melhores ofertas.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">

            <div className="bg-white dark:bg-gray-800 rounded-3xl p-8 shadow-sm hover:shadow-xl transition-all duration-300 group border border-gray-100 dark:border-gray-700">
              <div className="mb-6">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <Smartphone className="h-8 w-8 text-white" strokeWidth={1.5} />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">iPhone</h3>
                <p className="text-gray-600 dark:text-gray-300 leading-relaxed mb-6">
                  Do iPhone 15 Pro Max ao SE. Todas as capacidades, cores e modelos disponíveis.
                </p>
              </div>
              <Button asChild variant="ghost" className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-950/30 w-full justify-between group-hover:bg-blue-50 dark:group-hover:bg-blue-950/30">
                <Link to="/products">
                  Explorar
                  <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </Link>
              </Button>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-3xl p-8 shadow-sm hover:shadow-xl transition-all duration-300 group border border-gray-100 dark:border-gray-700">
              <div className="mb-6">
                <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <Laptop className="h-8 w-8 text-white" strokeWidth={1.5} />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">iPad & Mac</h3>
                <p className="text-gray-600 dark:text-gray-300 leading-relaxed mb-6">
                  MacBook Air, Pro, iPad Pro, Air e mini. Encontre a configuração perfeita.
                </p>
              </div>
              <Button asChild variant="ghost" className="text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 hover:bg-purple-50 dark:hover:bg-purple-950/30 w-full justify-between group-hover:bg-purple-50 dark:group-hover:bg-purple-950/30">
                <Link to="/products">
                  Explorar
                  <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </Link>
              </Button>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-3xl p-8 shadow-sm hover:shadow-xl transition-all duration-300 group border border-gray-100 dark:border-gray-700">
              <div className="mb-6">
                <div className="w-16 h-16 bg-gradient-to-br from-orange-500 to-red-500 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <Watch className="h-8 w-8 text-white" strokeWidth={1.5} />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">Acessórios</h3>
                <p className="text-gray-600 dark:text-gray-300 leading-relaxed mb-6">
                  Apple Watch, AirPods, Magic Keyboard e todos os acessórios originais.
                </p>
              </div>
              <Button asChild variant="ghost" className="text-orange-600 dark:text-orange-400 hover:text-orange-700 dark:hover:text-orange-300 hover:bg-orange-50 dark:hover:bg-orange-950/30 w-full justify-between group-hover:bg-orange-50 dark:group-hover:bg-orange-950/30">
                <Link to="/products">
                  Explorar
                  <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      <section className="py-32 bg-gradient-to-b from-white to-gray-50 dark:from-gray-900 dark:to-gray-800">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 dark:text-white mb-6 tracking-tight">
            Encontre seu próximo
            <br />
            produto Apple.
          </h2>
          <p className="text-xl text-gray-600 dark:text-gray-300 mb-12 max-w-2xl mx-auto">
            Compare preços de fornecedores verificados e economize em cada compra.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Button asChild size="lg" className="bg-blue-600 hover:bg-blue-700 text-white px-10 py-6 text-base font-semibold rounded-full shadow-lg hover:shadow-xl transition-all border-0">
              <Link to="/products">
                Ver todos os produtos
              </Link>
            </Button>
            
            {!isAuthenticated && (
              <Button asChild variant="ghost" size="lg" className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 hover:bg-transparent px-10 py-6 text-base font-semibold">
                <Link to="/login">
                  Fazer login →
                </Link>
              </Button>
            )}
          </div>
        </div>
      </section>

      <footer className="bg-gray-50 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
            <div>
              <div className="flex items-center mb-4">
                <img src={logoBlack} alt="BuscadorPXT Logo" className="h-8 w-auto opacity-80 dark:hidden" />
                <img src={logoWhite} alt="BuscadorPXT Logo" className="h-8 w-auto opacity-80 hidden dark:block" />
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                Plataforma especializada em produtos Apple. Compare preços e encontre as melhores ofertas.
              </p>
            </div>
            
            <div>
              <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">Navegação</h4>
              <ul className="space-y-2">
                <li>
                  <Link to="/products" className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors">
                    Produtos
                  </Link>
                </li>
                {!isAuthenticated ? (
                  <>
                    <li>
                      <Link to="/login" className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors">
                        Login
                      </Link>
                    </li>
                    <li>
                      <Link to="/register" className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors">
                        Criar conta
                      </Link>
                    </li>
                  </>
                ) : (
                  user?.isAdmin && (
                    <li>
                      <Link to="/admin" className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors">
                        Painel Admin
                      </Link>
                    </li>
                  )
                )}
              </ul>
            </div>
            
            <div>
              <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">Suporte</h4>
              <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed mb-3">
                Contato direto com fornecedores via WhatsApp.
              </p>
              <div className="flex gap-3">
                <div className="h-9 w-9 rounded-full bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 flex items-center justify-center cursor-pointer transition-all">
                  <MessageCircle className="h-4 w-4 text-gray-700 dark:text-gray-300" strokeWidth={2} />
                </div>
              </div>
            </div>
          </div>
          
          <div className="border-t border-gray-200 dark:border-gray-800 pt-6 flex flex-col sm:flex-row justify-between items-center gap-4">
            <p className="text-xs text-gray-500 dark:text-gray-400">
              &copy; 2025 BuscadorPXT. Todos os direitos reservados.
            </p>
            <div className="flex gap-6 text-xs text-gray-500 dark:text-gray-400">
              <a href="#" className="hover:text-gray-900 dark:hover:text-white transition-colors">Privacidade</a>
              <a href="#" className="hover:text-gray-900 dark:hover:text-white transition-colors">Termos de Uso</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Home;