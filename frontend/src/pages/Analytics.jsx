import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import api from '@/lib/axios';
import { useSocket } from '../hooks/useSocket';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { 
  Users, 
  Globe, 
  Eye, 
  Clock, 
  TrendingUp, 
  MapPin, 
  Activity,
  Loader2,
  RefreshCw
} from 'lucide-react';
import { toast } from 'sonner';
import UserLocationMap from '../components/admin/UserLocationMap';

export default function Analytics() {
  const { user } = useAuth();
  const socket = useSocket();
  const [loading, setLoading] = useState(true);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [heatmapData, setHeatmapData] = useState([]);
  const [topPages, setTopPages] = useState([]);
  const [generalStats, setGeneralStats] = useState(null);

  useEffect(() => {
    if (!user?.isAdmin) {
      window.location.href = '/';
      return;
    }
  }, [user]);

  useEffect(() => {
    if (!user?.isAdmin) return;
    loadAnalyticsData();
  }, [user]);

  useEffect(() => {
    if (!socket) {
      console.log('[Analytics] Socket not available yet');
      return;
    }

    console.log('[Analytics] Socket available, checking connection status...');
    console.log('[Analytics] Socket ID:', socket.id);
    console.log('[Analytics] Socket connected:', socket.connected);

    let retryCount = 0;
    const maxRetries = 10;
    
    const requestOnlineUsers = () => {

      if (socket.connected && socket.id) {
        console.log('[Analytics] ✅ Socket connected with ID, emitting get-online-users-with-location...');
        socket.emit('get-online-users-with-location');
        retryCount = 0;
      } else {
        retryCount++;
        console.log('[Analytics] ⏳ Socket not fully initialized, waiting... (attempt ${retryCount}/${maxRetries})', {
          connected: socket.connected,
          hasId: !!socket.id
        });

        if (retryCount < maxRetries) {
          setTimeout(requestOnlineUsers, 500);
        } else {
          console.error('[Analytics] ❌ Max retries reached, socket not initialized');
        }
      }
    };

    requestOnlineUsers();

    socket.on('online-users-with-location', (users) => {
      console.log('[Analytics] ✅ Received online users with location:', users);
      setOnlineUsers(users);

      if (users.length === 0 && retryCount < 3) {
        console.log('[Analytics] Received empty list, retrying in 1s...');
        setTimeout(() => {
          if (socket.connected && socket.id) {
            socket.emit('get-online-users-with-location');
          }
        }, 1000);
      }
    });

    socket.on('onlineUsers', (users) => {
      console.log('[Analytics] ✅ Received online users (fallback):', users);
      
      setOnlineUsers(prevUsers => {

        const mergedUsers = users.map(user => {
          const existingUser = prevUsers.find(u => u.userId === user.userId);

          if (existingUser && existingUser.latitude && existingUser.longitude) {
            console.log('[Analytics] 🔄 Preserving coordinates for:', user.name);
            return {
              ...existingUser,
              lastSeen: user.lastSeen,
              isOnline: user.isOnline
            };
          }

          console.log('[Analytics] 📍 Using fallback data for:', user.name);
          return user;
        });
        
        console.log('[Analytics] 🔄 Merged users:', mergedUsers);
        return mergedUsers;
      });
    });

    socket.on('error', (error) => {
      console.error('[Analytics] ❌ Socket error:', error);

      if (error !== 'Unauthorized' && error !== 'Unauthorized - Admin access required') {
        toast.error(`Erro WebSocket: ${error}`);
      } else {
        console.log('[Analytics] Authorization error (may be timing issue), will retry...');
      }
    });

    socket.on('connect', () => {
      console.log('[Analytics] Socket reconnected, requesting users again...');

      setTimeout(requestOnlineUsers, 500);
    });

    return () => {
      socket.off('online-users-with-location');
      socket.off('onlineUsers');
      socket.off('error');
      socket.off('connect');
    };
  }, [socket]);

  const loadAnalyticsData = async () => {
    setLoading(true);
    try {
      const [heatmap, pages, stats] = await Promise.all([
        api.get('/analytics/heatmap?limit=100'),
        api.get('/analytics/top-pages?limit=10'),
        api.get('/analytics/stats'),
      ]);

      setHeatmapData(heatmap.data);
      setTopPages(pages.data);
      setGeneralStats(stats.data);
    } catch (error) {
      console.error('[Analytics] Error loading data:', error);
      toast.error('Erro ao carregar dados de analytics');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = () => {
    loadAnalyticsData();
    if (socket) {
      socket.emit('get-online-users-with-location');
    }
    toast.success('Dados atualizados');
  };

  const formatDuration = (seconds) => {
    if (!seconds || seconds === 0 || isNaN(seconds)) return '0s';
    
    const totalSeconds = Math.floor(seconds);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const secs = totalSeconds % 60;

    const parts = [];
    
    if (hours > 0) {
      parts.push(`${hours}h`);
      if (minutes > 0) parts.push(`${minutes}m`);
    } else if (minutes > 0) {
      parts.push(`${minutes}m`);
      if (secs > 0) parts.push(`${secs}s`);
    } else {
      parts.push(`${secs}s`);
    }

    return parts.join(' ');
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('pt-BR', {
      dateStyle: 'short',
      timeStyle: 'short',
    }).format(date);
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="ml-2">Carregando analytics...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-neutral-900 dark:text-white">
            Analytics & Rastreamento
          </h1>
          <p className="text-neutral-600 dark:text-neutral-400 mt-1">
            Visualize usuários online e estatísticas de acesso
          </p>
        </div>
        <Button onClick={handleRefresh} variant="outline">
          <RefreshCw className="h-4 w-4 mr-2" />
          Atualizar
        </Button>
      </div>

      {generalStats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total de Sessões</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{generalStats.totalSessions}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Usuários Únicos</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{generalStats.uniqueUsers}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Páginas Visualizadas</CardTitle>
              <Eye className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{generalStats.totalPageViews}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Tempo Médio de Sessão</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatDuration(generalStats.avgSessionDuration)}
              </div>
              {onlineUsers.length > 0 && (
                <p className="text-xs text-muted-foreground mt-1">
                  <span className="inline-flex items-center gap-1">
                    <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                    Incluindo {onlineUsers.length} sessão(ões) ativa(s)
                  </span>
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Usuários Online ({onlineUsers.length})
          </CardTitle>
          <CardDescription>
            Lista detalhada de usuários conectados
          </CardDescription>
        </CardHeader>
        <CardContent>
          {onlineUsers.length === 0 ? (
            <p className="text-neutral-500 text-center py-4">Nenhum usuário online no momento</p>
          ) : (
            <div className="space-y-3">
              {onlineUsers.map((user) => (
                <div
                  key={user.userId}
                  className="flex items-center justify-between p-3 bg-neutral-50 dark:bg-neutral-800 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <Users className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium text-neutral-900 dark:text-white">
                        {user.name}
                      </p>
                      <p className="text-sm text-neutral-600 dark:text-neutral-400">
                        {user.email}
                      </p>
                      {user.currentPage && (
                        <p className="text-xs text-neutral-500 mt-1">
                          📄 {user.currentPage}
                        </p>
                      )}
                      {user.city && (
                        <p className="text-xs text-neutral-500 mt-1 flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {user.city}{user.region ? `, ${user.region}` : ''}{user.country ? ` - ${user.country}` : ''}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    {user.isAdmin && (
                      <Badge variant="secondary">Admin</Badge>
                    )}
                    <div className="flex items-center gap-2 text-sm text-neutral-600 dark:text-neutral-400">
                      <Clock className="h-3 w-3" />
                      {formatDate(user.connectedAt)}
                    </div>
                    {user.ipAddress && user.ipAddress !== 'unknown' && (
                      <div className="flex items-center gap-1 text-xs text-neutral-500">
                        <Globe className="h-3 w-3" />
                        {user.ipAddress}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {(onlineUsers.length > 0 || heatmapData.length > 0) && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="h-5 w-5" />
              Mapa de Calor - Acessos
            </CardTitle>
            <CardDescription>
              {onlineUsers.length > 0 && (
                <span className="text-green-600 font-medium">
                  {onlineUsers.length} usuário(s) online agora
                </span>
              )}
              {onlineUsers.length > 0 && heatmapData.length > 0 && ' · '}
              {heatmapData.length > 0 && (
                <span>
                  {heatmapData.length} localização(ões) histórica(s)
                </span>
              )}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <UserLocationMap 
              users={onlineUsers
                .map(user => {
                  const mapped = {
                    userId: user.userId,
                    name: user.name,
                    email: user.email,
                    latitude: user.latitude,
                    longitude: user.longitude,
                    city: user.city,
                    region: user.region,
                    country: user.country,
                    isOnline: true,
                    connectedAt: user.connectedAt,
                    currentPage: user.currentPage,
                    ipAddress: user.ipAddress,
                  };
                  console.log('[Analytics] Mapping user to map:', {
                    name: mapped.name,
                    hasLat: !!mapped.latitude,
                    hasLng: !!mapped.longitude,
                    lat: mapped.latitude,
                    lng: mapped.longitude,
                    latType: typeof mapped.latitude,
                    lngType: typeof mapped.longitude
                  });
                  return mapped;
                })
                .filter(user => {

                  const hasValidCoords = user.latitude && user.longitude && 
                                        !isNaN(parseFloat(user.latitude)) && 
                                        !isNaN(parseFloat(user.longitude));
                  if (!hasValidCoords) {
                    console.warn('[Analytics] User without valid coordinates:', user.name, {
                      lat: user.latitude,
                      lng: user.longitude
                    });
                  }
                  return hasValidCoords;
                })
              } 
            />
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="h-5 w-5" />
              Top Localizações
            </CardTitle>
            <CardDescription>
              Top {heatmapData.length} localizações mais acessadas
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-[400px] overflow-y-auto">
              {heatmapData.slice(0, 20).map((location, index) => (
                <div key={index} className="flex items-center justify-between p-3 hover:bg-neutral-50 dark:hover:bg-neutral-800 rounded-lg transition-colors border border-transparent hover:border-neutral-200 dark:hover:border-neutral-700">
                  <div className="flex items-center gap-3 flex-1">
                    <span className="text-2xl">{location.countryCode ? `${String.fromCodePoint(0x1F1E6 - 65 + location.countryCode.charCodeAt(0))}${String.fromCodePoint(0x1F1E6 - 65 + location.countryCode.charCodeAt(1))}` : '🌍'}</span>
                    <div className="flex-1">
                      <p className="font-medium text-sm text-neutral-900 dark:text-white">
                        {location.city ? `${location.city}, ${location.region}` : location.country}
                      </p>
                      <div className="flex items-center gap-3 text-xs text-neutral-500 mt-1">
                        <span className="flex items-center gap-1">
                          <Activity className="h-3 w-3" />
                          {location.totalSessions} sessões
                        </span>
                        <span className="flex items-center gap-1">
                          <Users className="h-3 w-3" />
                          {location.totalUsers} usuários
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {formatDuration(location.avgDurationSeconds)}
                        </span>
                      </div>
                    </div>
                  </div>
                  <Badge variant="outline" className="shrink-0">
                    #{index + 1}
                  </Badge>
                </div>
              ))}
              {heatmapData.length === 0 && (
                <p className="text-neutral-500 text-center py-4">
                  Nenhum dado de localização disponível
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Páginas Mais Acessadas
            </CardTitle>
            <CardDescription>
              Top {topPages.length} páginas com mais visualizações
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {topPages.map((page, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-sm">
                      {page.pagePath}
                    </p>
                    <p className="text-xs text-neutral-500">
                      {page.totalViews} visualizações · {page.uniqueUsers} usuários únicos
                    </p>
                  </div>
                  <Badge variant="outline">
                    {formatDuration(page.avgDurationSeconds)}
                  </Badge>
                </div>
              ))}
              {topPages.length === 0 && (
                <p className="text-neutral-500 text-center py-4">
                  Nenhum dado de páginas disponível
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}