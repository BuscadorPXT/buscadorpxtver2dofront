import { useEffect, useState, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Users, Circle, Power, RefreshCw, Search, X, Command } from 'lucide-react';
import { usePresence } from '@/hooks/usePresence';

const OnlineUsersCard = () => {
  const { onlineUsers, isConnected, forceLogout, refreshOnlineUsers } = usePresence();
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredUsers, setFilteredUsers] = useState([]);
  const searchInputRef = useRef(null);

  console.log('[OnlineUsersCard] Render:', {
    isConnected,
    onlineUsersCount: onlineUsers.length,
    onlineUsers
  });

  useEffect(() => {
    if (searchTerm.trim() === '') {
      setFilteredUsers(onlineUsers);
    } else {
      const filtered = onlineUsers.filter(user => 
        user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredUsers(filtered);
    }
  }, [searchTerm, onlineUsers]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  const formatTime = (date) => {
    if (!date) return '';
    const d = new Date(date);
    return d.toLocaleTimeString('pt-BR', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const handleForceLogout = async (userId, userName) => {
    if (confirm(`Tem certeza que deseja desconectar ${userName}?`)) {
      forceLogout(userId);

      setTimeout(() => {
        refreshOnlineUsers();
      }, 500);
    }
  };

  return (
    <Card>
      <CardHeader className="p-4 sm:p-6">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <Users className="h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0" />
            <CardTitle className="text-base sm:text-lg lg:text-xl truncate">Usuários Online</CardTitle>
            <Badge 
              variant="outline" 
              className={`${
                isConnected 
                  ? 'bg-green-50 dark:bg-green-950/20 text-green-700 dark:text-green-400 border-green-200 dark:border-green-800' 
                  : 'bg-red-50 dark:bg-red-950/20 text-red-700 dark:text-red-400 border-red-200 dark:border-red-800'
              } text-[10px] sm:text-xs flex-shrink-0`}
            >
              <Circle className={`h-1.5 w-1.5 sm:h-2 sm:w-2 mr-1 ${isConnected ? 'fill-green-500' : 'fill-red-500'}`} />
              <span className="hidden sm:inline">{isConnected ? 'Conectado' : 'Desconectado'}</span>
              <span className="sm:hidden">{isConnected ? 'Online' : 'Offline'}</span>
            </Badge>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={refreshOnlineUsers}
            disabled={!isConnected}
            className="h-7 sm:h-8 flex-shrink-0"
          >
            <RefreshCw className="h-3 w-3 sm:h-4 sm:w-4" />
          </Button>
        </div>
        <CardDescription className="text-xs sm:text-sm mt-1 sm:mt-2">
          {filteredUsers.length} de {onlineUsers.length} {onlineUsers.length === 1 ? 'usuário' : 'usuários'}
          {searchTerm && ' (filtrado)'}
        </CardDescription>
      </CardHeader>
      <CardContent className="p-3 sm:p-4 lg:p-6">

        {onlineUsers.length > 0 && (
          <div className="mb-3 sm:mb-4 space-y-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-400 h-3.5 w-3.5 sm:h-4 sm:w-4" />
              <Input
                ref={searchInputRef}
                type="text"
                placeholder="Buscar... (Ctrl/⌘+K)"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 sm:pl-10 pr-9 sm:pr-10 h-9 sm:h-10 text-xs sm:text-sm"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  <X className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                </button>
              )}
            </div>
            {searchTerm && (
              <div className="flex items-center justify-between text-[10px] sm:text-xs text-muted-foreground px-1">
                <span>
                  {filteredUsers.length} de {onlineUsers.length} usuários
                </span>
                {filteredUsers.length > 0 && (
                  <Badge variant="secondary" className="text-[10px] sm:text-xs">
                    {filteredUsers.length} resultado{filteredUsers.length !== 1 ? 's' : ''}
                  </Badge>
                )}
              </div>
            )}
          </div>
        )}

        {onlineUsers.length === 0 ? (
          <div className="text-center py-6 sm:py-8 text-muted-foreground">
            <Users className="h-10 w-10 sm:h-12 sm:w-12 mx-auto mb-2 opacity-20" />
            <p className="text-xs sm:text-sm">Nenhum usuário online no momento</p>
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="text-center py-6 sm:py-8 text-muted-foreground">
            <Search className="h-10 w-10 sm:h-12 sm:w-12 mx-auto mb-2 opacity-20" />
            <p className="text-xs sm:text-sm">Nenhum usuário encontrado com "{searchTerm}"</p>
            <Button
              variant="link"
              onClick={() => setSearchTerm('')}
              className="mt-2 text-xs sm:text-sm"
            >
              Limpar busca
            </Button>
          </div>
        ) : (
          <div className="space-y-2 max-h-[400px] sm:max-h-[500px] overflow-y-auto pr-1 sm:pr-2">
            {filteredUsers.map((user) => (
              <div
                key={user.userId}
                className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-2 sm:p-3 border rounded-lg hover:bg-muted/50 transition-colors gap-2 sm:gap-0"
              >
                <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0 w-full sm:w-auto">
                  <div className="relative flex-shrink-0">
                    <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <Users className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                    </div>
                    <div className="absolute -bottom-0.5 -right-0.5 h-2 w-2 sm:h-3 sm:w-3 rounded-full bg-green-500 border-2 border-background"></div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                      <p className="font-medium text-xs sm:text-sm truncate">{user.name}</p>
                      {user.isAdmin && (
                        <Badge variant="secondary" className="text-[10px] sm:text-xs">
                          Admin
                        </Badge>
                      )}
                    </div>
                    <div className="flex flex-col sm:flex-row sm:items-center gap-0.5 sm:gap-2 text-[10px] sm:text-xs text-muted-foreground">
                      <span className="truncate">{user.email}</span>
                      <span className="hidden sm:inline">•</span>
                      <span className="whitespace-nowrap">Desde {formatTime(user.connectedAt)}</span>
                    </div>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleForceLogout(user.userId, user.name)}
                  className="text-destructive hover:text-destructive hover:bg-destructive/10 h-7 sm:h-8 w-full sm:w-auto self-end sm:self-auto"
                >
                  <Power className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-0" />
                  <span className="sm:hidden text-xs">Desconectar</span>
                </Button>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default OnlineUsersCard;
