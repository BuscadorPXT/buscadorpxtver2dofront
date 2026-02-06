import { useState } from 'react';
import logoWhite from '../assets/logo_branca.png';
import logoBlack from '../assets/logo_preta.png';
import { Link, useNavigate, useLocation } from 'react-router-dom';
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
import { User, LogOut, Settings, Menu, X, Home, Package, Shield, Moon, Sun, CreditCard, Layers, Receipt, Bell, Building2, Smartphone, ChevronDown, Users, BarChart3, TrendingUp } from 'lucide-react';
import HoursDisplay from './HoursDisplay';
import NotificationBell from './NotificationBell';

const Navbar = () => {
  const { user, logout, isAuthenticated, isAdmin } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { hours } = useHoursCheck();
  const navigate = useNavigate();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const isActivePath = (path) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname === path || location.pathname.startsWith(path + '/');
  };

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
    <nav className="glass-panel sticky top-0 z-50 border-b border-neutral-200/50 dark:border-white/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link to="/" className="flex-shrink-0 flex items-center group">
              <img src={logoBlack} alt="Logo" className="h-10 w-auto transition-transform group-hover:scale-105 dark:hidden" />
              <img src={logoWhite} alt="Logo" className="h-10 w-auto transition-transform group-hover:scale-105 hidden dark:block" />
            </Link>
          </div>

          <div className="hidden md:flex items-center space-x-1">
            <nav className="flex items-center bg-white/50 dark:bg-white/5 backdrop-blur-sm rounded-full px-2 py-1.5 border border-neutral-200/50 dark:border-white/10">
              <Link to="/" className={`px-4 py-2 text-sm font-medium rounded-full transition-all duration-200 flex items-center gap-2 ${isActivePath('/') ? 'nav-active' : 'text-neutral-600 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white hover:bg-white/50 dark:hover:bg-white/10'}`}>
                <Home className="h-4 w-4" />
                Inicio
              </Link>
              <Link
                to="/products"
                onClick={handleProductsClick}
                className={`px-4 py-2 text-sm font-medium rounded-full transition-all duration-200 flex items-center gap-2 ${isActivePath('/products') ? 'nav-active' : 'text-neutral-600 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white hover:bg-white/50 dark:hover:bg-white/10'}`}
              >
                <Package className="h-4 w-4" />
                Produtos
              </Link>

              {isAuthenticated && isAdmin && (
                <>
                  <Link to="/suppliers" className={`px-4 py-2 text-sm font-medium rounded-full transition-all duration-200 flex items-center gap-2 ${isActivePath('/suppliers') ? 'nav-active' : 'text-neutral-600 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white hover:bg-white/50 dark:hover:bg-white/10'}`}>
                    <Building2 className="h-4 w-4" />
                    Fornecedores
                  </Link>

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 flex items-center gap-2 h-auto ${isActivePath('/admin') ? 'nav-active' : 'text-neutral-600 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white hover:bg-white/50 dark:hover:bg-white/10'}`}>
                        <Shield className="h-4 w-4" />
                        Admin
                        <ChevronDown className="h-3 w-3" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start" className="glass-card w-56">
                      <DropdownMenuLabel className="text-neutral-500 text-xs">Painel</DropdownMenuLabel>
                      <DropdownMenuItem asChild className="hover:bg-white/50 dark:hover:bg-white/10 cursor-pointer">
                        <Link to="/admin" className="flex items-center gap-2">
                          <BarChart3 className="h-4 w-4" />
                          Dashboard
                        </Link>
                      </DropdownMenuItem>

                      <DropdownMenuSeparator className="bg-neutral-200/50 dark:bg-white/10" />
                      <DropdownMenuLabel className="text-neutral-500 text-xs">Gestao</DropdownMenuLabel>

                      <DropdownMenuItem asChild className="hover:bg-white/50 dark:hover:bg-white/10 cursor-pointer">
                        <Link to="/admin/subscriptions" className="flex items-center gap-2">
                          <CreditCard className="h-4 w-4" />
                          Assinaturas
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild className="hover:bg-white/50 dark:hover:bg-white/10 cursor-pointer">
                        <Link to="/admin/plans" className="flex items-center gap-2">
                          <Layers className="h-4 w-4" />
                          Planos
                        </Link>
                      </DropdownMenuItem>

                      <DropdownMenuSeparator className="bg-neutral-200/50 dark:bg-white/10" />
                      <DropdownMenuLabel className="text-neutral-500 text-xs">Marketing</DropdownMenuLabel>

                      <DropdownMenuItem asChild className="hover:bg-white/50 dark:hover:bg-white/10 cursor-pointer">
                        <Link to="/admin/partners" className="flex items-center gap-2">
                          <Users className="h-4 w-4" />
                          Parceiros
                        </Link>
                      </DropdownMenuItem>

                      <DropdownMenuItem asChild className="hover:bg-white/50 dark:hover:bg-white/10 cursor-pointer">
                        <Link to="/admin/supplier-analytics" className="flex items-center gap-2">
                          <TrendingUp className="h-4 w-4" />
                          Analytics Fornecedores
                        </Link>
                      </DropdownMenuItem>

                      <DropdownMenuSeparator className="bg-neutral-200/50 dark:bg-white/10" />
                      <DropdownMenuLabel className="text-neutral-500 text-xs">Sistema</DropdownMenuLabel>

                      <DropdownMenuItem asChild className="hover:bg-white/50 dark:hover:bg-white/10 cursor-pointer">
                        <Link to="/admin/notifications" className="flex items-center gap-2">
                          <Bell className="h-4 w-4" />
                          Notificacoes
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild className="hover:bg-white/50 dark:hover:bg-white/10 cursor-pointer">
                        <Link to="/admin/settings" className="flex items-center gap-2">
                          <Settings className="h-4 w-4" />
                          Configuracoes
                        </Link>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </>
              )}
            </nav>

            {isAuthenticated ? (
              <>
                <HoursDisplay />

                <NotificationBell />

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={toggleTheme}
                  className="text-neutral-600 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white hover:bg-white/50 dark:hover:bg-white/10 px-3 py-2 rounded-full transition-all cursor-pointer"
                  title={theme === 'light' ? 'Ativar modo escuro' : 'Ativar modo claro'}
                >
                  {theme === 'light' ? <Moon className="h-4 w-4 cursor-pointer" /> : <Sun className="h-4 w-4 cursor-pointer" />}
                </Button>

                <div className="ml-3 pl-3 border-l border-neutral-200/50 dark:border-white/10">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="flex items-center space-x-2 hover:bg-white/50 dark:hover:bg-white/10 px-3 rounded-xl">
                        <div className="w-8 h-8 user-avatar rounded-full flex items-center justify-center font-medium text-sm shadow-sm">
                          {user?.name?.charAt(0).toUpperCase()}
                        </div>
                        <span className="hidden md:inline text-sm font-medium text-neutral-700 dark:text-neutral-200 max-w-[100px] truncate">
                          {user?.name?.split(' ')[0]}
                        </span>
                        <ChevronDown className="w-4 h-4 text-neutral-400" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="glass-card w-48">
                      <div className="px-3 py-2 border-b border-neutral-200/50 dark:border-white/10">
                        <p className="text-sm font-medium">{user?.name}</p>
                        <p className="text-xs text-neutral-500">{user?.email}</p>
                      </div>
                      <DropdownMenuItem onClick={() => navigate('/my-devices')} className="hover:bg-white/50 dark:hover:bg-white/10 cursor-pointer">
                        <Smartphone className="mr-2 h-4 w-4" />
                        Meus Dispositivos
                      </DropdownMenuItem>
                      {!isAdmin && (
                        <DropdownMenuItem onClick={() => navigate('/payment-history')} className="hover:bg-white/50 dark:hover:bg-white/10 cursor-pointer">
                          <Receipt className="mr-2 h-4 w-4" />
                          Historico de Pagamentos
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuItem onClick={handleLogout} className="hover:bg-white/50 dark:hover:bg-white/10 cursor-pointer">
                        <LogOut className="mr-2 h-4 w-4" />
                        Sair
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </>
            ) : (
              <div className="flex items-center space-x-2 ml-3 pl-3 border-l border-neutral-200/50 dark:border-white/10">

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={toggleTheme}
                  className="text-neutral-600 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white hover:bg-white/50 dark:hover:bg-white/10 px-3 py-2 rounded-full transition-all cursor-pointer"
                  title={theme === 'light' ? 'Ativar modo escuro' : 'Ativar modo claro'}
                >
                  {theme === 'light' ? <Moon className="h-4 w-4 cursor-pointer" /> : <Sun className="h-4 w-4 cursor-pointer" />}
                </Button>
                <Button variant="ghost" className="text-neutral-700 dark:text-neutral-200 hover:bg-white/50 dark:hover:bg-white/10 border border-neutral-200/50 dark:border-white/10 rounded-full" asChild>
                  <Link to="/login">Entrar</Link>
                </Button>
                <Button variant="accent" size="pillSm" asChild>
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
              className="text-neutral-600 dark:text-neutral-300 hover:bg-white/50 dark:hover:bg-white/10 rounded-full"
              title={theme === 'light' ? 'Ativar modo escuro' : 'Ativar modo claro'}
            >
              {theme === 'light' ? <Moon className="h-5 w-5 cursor-pointer" /> : <Sun className="h-5 w-5 cursor-pointer" />}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="text-neutral-600 dark:text-neutral-300 hover:bg-white/50 dark:hover:bg-white/10 rounded-full"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              {isMobileMenuOpen ? <X className="h-6 w-6 cursor-pointer" /> : <Menu className="h-6 w-6 cursor-pointer" />}
            </Button>
          </div>
        </div>

        {isMobileMenuOpen && (
          <div className="md:hidden glass-panel rounded-b-2xl border-t border-neutral-200/30 dark:border-white/5">
            <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
              <Link
                to="/"
                className="text-neutral-600 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white hover:bg-white/50 dark:hover:bg-white/10 flex items-center gap-3 px-3 py-3 rounded-xl text-base font-medium transition-all"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <Home className="h-5 w-5" />
                Inicio
              </Link>
              <Link
                to="/products"
                onClick={handleProductsClick}
                className="text-neutral-600 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white hover:bg-white/50 dark:hover:bg-white/10 flex items-center gap-3 px-3 py-3 rounded-xl text-base font-medium transition-all"
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
                        className="text-neutral-600 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white hover:bg-white/50 dark:hover:bg-white/10 flex items-center gap-3 px-3 py-3 rounded-xl text-base font-medium transition-all"
                        onClick={() => setIsMobileMenuOpen(false)}
                      >
                        <Building2 className="h-5 w-5" />
                        Fornecedores
                      </Link>

                      <div className="border-t border-neutral-200/30 dark:border-white/5 pt-2 mt-2">
                        <div className="px-3 py-2 text-xs font-semibold text-neutral-400 uppercase tracking-wider flex items-center gap-2">
                          <Shield className="h-4 w-4" />
                          Administracao
                        </div>
                        <Link
                          to="/admin"
                          className="text-neutral-600 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white hover:bg-white/50 dark:hover:bg-white/10 flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ml-2"
                          onClick={() => setIsMobileMenuOpen(false)}
                        >
                          <BarChart3 className="h-4 w-4" />
                          Dashboard
                        </Link>
                        <Link
                          to="/admin/subscriptions"
                          className="text-neutral-600 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white hover:bg-white/50 dark:hover:bg-white/10 flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ml-2"
                          onClick={() => setIsMobileMenuOpen(false)}
                        >
                          <CreditCard className="h-4 w-4" />
                          Assinaturas
                        </Link>
                        <Link
                          to="/admin/plans"
                          className="text-neutral-600 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white hover:bg-white/50 dark:hover:bg-white/10 flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ml-2"
                          onClick={() => setIsMobileMenuOpen(false)}
                        >
                          <Layers className="h-4 w-4" />
                          Planos
                        </Link>
                        <Link
                          to="/admin/notifications"
                          className="text-neutral-600 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white hover:bg-white/50 dark:hover:bg-white/10 flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ml-2"
                          onClick={() => setIsMobileMenuOpen(false)}
                        >
                          <Bell className="h-4 w-4" />
                          Notificacoes
                        </Link>
                        <Link
                          to="/admin/settings"
                          className="text-neutral-600 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white hover:bg-white/50 dark:hover:bg-white/10 flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ml-2"
                          onClick={() => setIsMobileMenuOpen(false)}
                        >
                          <Settings className="h-4 w-4" />
                          Configuracoes
                        </Link>
                      </div>
                    </>
                  )}
                  <div className="border-t border-neutral-200/30 dark:border-white/5 pt-3 mt-2">
                    <div className="px-3 py-2 text-sm text-neutral-500 flex items-center gap-2">
                      <User className="h-4 w-4" />
                      Logado como: <span className="text-neutral-900 dark:text-white font-medium">{user?.name}</span>
                    </div>
                    <Link
                      to="/my-devices"
                      className="text-neutral-600 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white hover:bg-white/50 dark:hover:bg-white/10 flex items-center gap-3 px-3 py-3 rounded-xl text-base font-medium transition-all"
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      <Smartphone className="h-5 w-5" />
                      Meus Dispositivos
                    </Link>
                    {!isAdmin && (
                      <Link
                        to="/payment-history"
                        className="text-neutral-600 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white hover:bg-white/50 dark:hover:bg-white/10 flex items-center gap-3 px-3 py-3 rounded-xl text-base font-medium transition-all"
                        onClick={() => setIsMobileMenuOpen(false)}
                      >
                        <Receipt className="h-5 w-5" />
                        Historico de Pagamentos
                      </Link>
                    )}
                    <Button
                      variant="ghost"
                      className="w-full justify-start text-neutral-600 dark:text-neutral-300 hover:text-red-600 hover:bg-red-50/50 dark:hover:bg-red-950/20 dark:hover:text-red-400 rounded-xl"
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
                <div className="border-t border-neutral-200/30 dark:border-white/5 pt-3 mt-2 space-y-2">
                  <Button
                    variant="ghost"
                    className="w-full justify-start text-neutral-600 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white hover:bg-white/50 dark:hover:bg-white/10 rounded-xl"
                    asChild
                  >
                    <Link to="/login" onClick={() => setIsMobileMenuOpen(false)}>
                      <User className="mr-2 h-5 w-5" />
                      Entrar
                    </Link>
                  </Button>
                  <Button
                    variant="accent"
                    className="w-full justify-start rounded-xl"
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
