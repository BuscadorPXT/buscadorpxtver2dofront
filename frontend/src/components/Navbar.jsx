import { useState } from 'react';
import logoWhite from '../assets/logo_branca.png';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { useHoursCheck } from '../hooks/useHoursCheck';
import { Button } from '@/components/ui/button';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel
} from '@/components/ui/dropdown-menu';
import { User, LogOut, Settings, Menu, X, Home, Package, Shield, Moon, Sun, CreditCard, Layers, Receipt, Bell, Building2, Smartphone, ChevronDown, Users, BarChart3 } from 'lucide-react';
import HoursDisplay from './HoursDisplay';
import NotificationBell from './NotificationBell';

const Navbar = () => {
  const { user, logout, isAuthenticated, isAdmin } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { hours } = useHoursCheck();
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const hasAccess = isAdmin || (hours && (
    hours.durationType === 'days' ? hours.daysRemaining > 0 : hours.remaining > 0
  ));

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const handleProductsClick = (e) => {
    if (!hasAccess && isAuthenticated) {
      e.preventDefault();
      navigate('/access-denied');
      setIsMobileMenuOpen(false);
    }
  };

  return (
    <nav className="bg-black dark:bg-gray-950 border-b border-gray-800 dark:border-gray-700 sticky top-0 z-50 backdrop-blur-lg bg-opacity-95">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link to="/" className="flex-shrink-0 flex items-center group">
              <img 
                src={logoWhite} 
                alt="Logo" 
                className="h-10 w-auto transition-transform group-hover:scale-105"
              />
            </Link>
          </div>

          <div className="hidden md:flex items-center space-x-1">
            <Link to="/" className="text-gray-300 hover:text-white hover:bg-white/10 px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2">
              <Home className="h-4 w-4" />
              Início
            </Link>
            <Link 
              to="/products" 
              onClick={handleProductsClick}
              className="text-gray-300 hover:text-white hover:bg-white/10 px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2"
            >
              <Package className="h-4 w-4" />
              Produtos
            </Link>
            
            {isAuthenticated ? (
              <>
                  {isAdmin && (
                    <>
                      <Link to="/suppliers" className="text-gray-300 hover:text-white hover:bg-white/10 px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2">
                        <Building2 className="h-4 w-4" />
                        Fornecedores
                      </Link>

                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="text-gray-300 hover:text-white hover:bg-white/10 px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2">
                            <Shield className="h-4 w-4" />
                            Administração
                            <ChevronDown className="h-3 w-3" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="start" className="bg-gray-900 border-gray-800 text-white w-56">
                          <DropdownMenuLabel className="text-gray-400 text-xs">Painel</DropdownMenuLabel>
                          <DropdownMenuItem asChild className="hover:bg-white/10 cursor-pointer">
                            <Link to="/admin" className="flex items-center gap-2">
                              <BarChart3 className="h-4 w-4" />
                              Dashboard
                            </Link>
                          </DropdownMenuItem>
                          
                          <DropdownMenuSeparator className="bg-gray-800" />
                          <DropdownMenuLabel className="text-gray-400 text-xs">Gestão</DropdownMenuLabel>
                          
                          <DropdownMenuItem asChild className="hover:bg-white/10 cursor-pointer">
                            <Link to="/admin/subscriptions" className="flex items-center gap-2">
                              <CreditCard className="h-4 w-4" />
                              Assinaturas
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem asChild className="hover:bg-white/10 cursor-pointer">
                            <Link to="/admin/plans" className="flex items-center gap-2">
                              <Layers className="h-4 w-4" />
                              Planos
                            </Link>
                          </DropdownMenuItem>
                          
                          <DropdownMenuSeparator className="bg-gray-800" />
                          <DropdownMenuLabel className="text-gray-400 text-xs">Sistema</DropdownMenuLabel>
                          
                          <DropdownMenuItem asChild className="hover:bg-white/10 cursor-pointer">
                            <Link to="/admin/notifications" className="flex items-center gap-2">
                              <Bell className="h-4 w-4" />
                              Notificações
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem asChild className="hover:bg-white/10 cursor-pointer">
                            <Link to="/admin/settings" className="flex items-center gap-2">
                              <Settings className="h-4 w-4" />
                              Configurações
                            </Link>
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                  </>
                )}
                
                <HoursDisplay />

                <NotificationBell />

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={toggleTheme}
                  className="text-gray-300 hover:text-white hover:bg-white/10 px-3 py-2 rounded-lg transition-all"
                  title={theme === 'light' ? 'Ativar modo escuro' : 'Ativar modo claro'}
                >
                  {theme === 'light' ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
                </Button>
                
                <div className="ml-3 pl-3 border-l border-gray-700 dark:border-gray-600">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="flex items-center space-x-2 text-white hover:text-white hover:bg-white/10 border border-gray-700 hover:border-gray-600">
                        <User className="h-4 w-4" />
                        <span className="max-w-[100px] truncate">{user?.name}</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="bg-gray-900 border-gray-800 text-white">
                      <DropdownMenuItem onClick={() => navigate('/my-devices')} className="hover:bg-white/10 cursor-pointer">
                        <Smartphone className="mr-2 h-4 w-4" />
                        Meus Dispositivos
                      </DropdownMenuItem>
                      {!isAdmin && (
                        <DropdownMenuItem onClick={() => navigate('/payment-history')} className="hover:bg-white/10 cursor-pointer">
                          <Receipt className="mr-2 h-4 w-4" />
                          Histórico de Pagamentos
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuItem onClick={handleLogout} className="hover:bg-white/10 cursor-pointer">
                        <LogOut className="mr-2 h-4 w-4" />
                        Sair
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </>
            ) : (
              <div className="flex items-center space-x-2 ml-3 pl-3 border-l border-gray-700 dark:border-gray-600">

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={toggleTheme}
                  className="text-gray-300 hover:text-white hover:bg-white/10 px-3 py-2 rounded-lg transition-all"
                  title={theme === 'light' ? 'Ativar modo escuro' : 'Ativar modo claro'}
                >
                  {theme === 'light' ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
                </Button>
                <Button variant="ghost" className="text-white hover:bg-white/10 border border-gray-700 hover:border-gray-600" asChild>
                  <Link to="/login">Entrar</Link>
                </Button>
                <Button className="bg-white text-black hover:bg-gray-200" asChild>
                  <Link to="/register">Cadastrar</Link>
                </Button>
              </div>
            )}
          </div>

          <div className="md:hidden flex items-center space-x-2">

            <Button
              variant="ghost"
              size="sm"
              onClick={toggleTheme}
              className="text-white hover:bg-white/10"
              title={theme === 'light' ? 'Ativar modo escuro' : 'Ativar modo claro'}
            >
              {theme === 'light' ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="text-white hover:bg-white/10"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </Button>
          </div>
        </div>

        {isMobileMenuOpen && (
          <div className="md:hidden bg-gray-900 dark:bg-gray-950 border-t border-gray-800 dark:border-gray-700">
            <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
              <Link 
                to="/" 
                className="text-gray-300 hover:text-white hover:bg-white/10 flex items-center gap-3 px-3 py-3 rounded-lg text-base font-medium transition-all"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <Home className="h-5 w-5" />
                Início
              </Link>
              <Link 
                to="/products"
                onClick={handleProductsClick}
                className="text-gray-300 hover:text-white hover:bg-white/10 flex items-center gap-3 px-3 py-3 rounded-lg text-base font-medium transition-all"
              >
                <Package className="h-5 w-5" />
                Produtos
              </Link>
              
              {isAuthenticated ? (
                <>
                  {isAdmin && (
                    <>
                      <Link 
                        to="/suppliers" 
                        className="text-gray-300 hover:text-white hover:bg-white/10 flex items-center gap-3 px-3 py-3 rounded-lg text-base font-medium transition-all"
                        onClick={() => setIsMobileMenuOpen(false)}
                      >
                        <Building2 className="h-5 w-5" />
                        Fornecedores
                      </Link>

                      <div className="border-t border-gray-800 pt-2 mt-2">
                        <div className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider flex items-center gap-2">
                          <Shield className="h-4 w-4" />
                          Administração
                        </div>
                        <Link 
                          to="/admin" 
                          className="text-gray-300 hover:text-white hover:bg-white/10 flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ml-2"
                          onClick={() => setIsMobileMenuOpen(false)}
                        >
                          <BarChart3 className="h-4 w-4" />
                          Dashboard
                        </Link>
                        <Link 
                          to="/admin/subscriptions" 
                          className="text-gray-300 hover:text-white hover:bg-white/10 flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ml-2"
                          onClick={() => setIsMobileMenuOpen(false)}
                        >
                          <CreditCard className="h-4 w-4" />
                          Assinaturas
                        </Link>
                        <Link 
                          to="/admin/plans" 
                          className="text-gray-300 hover:text-white hover:bg-white/10 flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ml-2"
                          onClick={() => setIsMobileMenuOpen(false)}
                        >
                          <Layers className="h-4 w-4" />
                          Planos
                        </Link>
                        <Link 
                          to="/admin/notifications" 
                          className="text-gray-300 hover:text-white hover:bg-white/10 flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ml-2"
                          onClick={() => setIsMobileMenuOpen(false)}
                        >
                          <Bell className="h-4 w-4" />
                          Notificações
                        </Link>
                        <Link 
                          to="/admin/settings" 
                          className="text-gray-300 hover:text-white hover:bg-white/10 flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ml-2"
                          onClick={() => setIsMobileMenuOpen(false)}
                        >
                          <Settings className="h-4 w-4" />
                          Configurações
                        </Link>
                      </div>
                    </>
                  )}
                  <div className="border-t border-gray-800 pt-3 mt-2">
                    <div className="px-3 py-2 text-sm text-gray-400 flex items-center gap-2">
                      <User className="h-4 w-4" />
                      Logado como: <span className="text-white font-medium">{user?.name}</span>
                    </div>
                    <Link 
                      to="/my-devices" 
                      className="text-gray-300 hover:text-white hover:bg-white/10 flex items-center gap-3 px-3 py-3 rounded-lg text-base font-medium transition-all"
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      <Smartphone className="h-5 w-5" />
                      Meus Dispositivos
                    </Link>
                    {!isAdmin && (
                      <Link 
                        to="/payment-history" 
                        className="text-gray-300 hover:text-white hover:bg-white/10 flex items-center gap-3 px-3 py-3 rounded-lg text-base font-medium transition-all"
                        onClick={() => setIsMobileMenuOpen(false)}
                      >
                        <Receipt className="h-5 w-5" />
                        Histórico de Pagamentos
                      </Link>
                    )}
                    <Button 
                      variant="ghost" 
                      className="w-full justify-start text-gray-300 hover:text-white hover:bg-red-500/10 hover:text-red-400"
                      onClick={() => {
                        handleLogout();
                        setIsMobileMenuOpen(false);
                      }}
                    >
                      <LogOut className="mr-2 h-5 w-5" />
                      Sair
                    </Button>
                  </div>
                </>
              ) : (
                <div className="border-t border-gray-800 pt-3 mt-2 space-y-2">
                  <Button 
                    variant="ghost" 
                    className="w-full justify-start text-gray-300 hover:text-white hover:bg-white/10"
                    asChild
                  >
                    <Link to="/login" onClick={() => setIsMobileMenuOpen(false)}>
                      <User className="mr-2 h-5 w-5" />
                      Entrar
                    </Link>
                  </Button>
                  <Button 
                    className="w-full justify-start bg-white text-black hover:bg-gray-200"
                    asChild
                  >
                    <Link to="/register" onClick={() => setIsMobileMenuOpen(false)}>
                      Cadastrar
                    </Link>
                  </Button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
