import { useState, useEffect } from 'react';
import { Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import api from '@/lib/axios';
import { toast } from 'sonner';
import NotificationModal from './NotificationModal';

const NotificationBell = () => {
  const { socket, isAuthenticated } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [selectedNotification, setSelectedNotification] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      fetchUnreadNotifications();
      fetchUnreadCount();
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (socket && isAuthenticated) {

      socket.on('notification-received', (notification) => {
        console.log('[NotificationBell] Nova notificação recebida:', notification);
        setNotifications(prev => [notification, ...prev]);
        setUnreadCount(prev => prev + 1);
        toast.info(notification.title, {
          description: 'Nova notificação recebida',
        });
      });

      socket.on('unread-count-updated', ({ count }) => {
        console.log('[NotificationBell] Contagem atualizada:', count);
        setUnreadCount(count);
      });

      return () => {
        socket.off('notification-received');
        socket.off('unread-count-updated');
      };
    }
  }, [socket, isAuthenticated]);

  const fetchUnreadNotifications = async () => {
    try {
      const response = await api.get('/notifications/me/unread');
      setNotifications(response.data);
    } catch (error) {
      console.error('Erro ao carregar notificações:', error);
    }
  };

  const fetchUnreadCount = async () => {
    try {
      const response = await api.get('/notifications/me/unread/count');
      setUnreadCount(response.data.count);
    } catch (error) {
      console.error('Erro ao carregar contagem:', error);
    }
  };

  const handleNotificationClick = (notification) => {
    setSelectedNotification(notification);
    setIsModalOpen(true);
  };

  const handleMarkAsRead = async (notificationId) => {
    try {
      await api.patch(`/notifications/${notificationId}/read`);
      setNotifications(prev => prev.filter(n => n.id !== notificationId));
      setUnreadCount(prev => Math.max(0, prev - 1));
      setIsModalOpen(false);
    } catch (error) {
      console.error('Erro ao marcar como lida:', error);
      toast.error('Erro ao marcar notificação como lida');
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await api.post('/notifications/me/read-all');
      setNotifications([]);
      setUnreadCount(0);
      toast.success('Todas as notificações foram marcadas como lidas');
    } catch (error) {
      console.error('Erro ao marcar todas como lidas:', error);
      toast.error('Erro ao marcar todas como lidas');
    }
  };

  const truncateText = (text, maxLength = 50) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  if (!isAuthenticated) return null;

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="relative text-neutral-300 hover:text-white hover:bg-white/10 px-3 py-2 rounded-lg transition-all"
          >
            <Bell className="h-5 w-5" />
            {unreadCount > 0 && (
              <Badge 
                className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 bg-red-500 text-white text-xs"
              >
                {unreadCount > 9 ? '9+' : unreadCount}
              </Badge>
            )}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent 
          align="end" 
          className="w-80 max-h-96 overflow-y-auto bg-neutral-900 border-neutral-800 text-white"
        >
          <div className="px-3 py-2 font-semibold border-b border-neutral-800 flex justify-between items-center">
            <span>Notificações</span>
            {unreadCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleMarkAllAsRead}
                className="text-xs text-blue-400 hover:text-blue-300"
              >
                Marcar todas como lidas
              </Button>
            )}
          </div>

          {notifications.length === 0 ? (
            <div className="px-3 py-8 text-center text-neutral-400">
              <Bell className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>Nenhuma notificação não lida</p>
            </div>
          ) : (
            notifications.map((notification) => (
              <DropdownMenuItem
                key={notification.id}
                onClick={() => handleNotificationClick(notification)}
                className="px-3 py-3 cursor-pointer hover:bg-white/10 border-b border-neutral-800 last:border-0"
              >
                <div className="flex-1">
                  <div className="font-semibold text-sm mb-1">{notification.title}</div>
                  <div className="text-xs text-neutral-400">
                    {truncateText(notification.message.replace(/[#*\[\]()]/g, ''))}
                  </div>
                  <div className="text-xs text-neutral-500 mt-1">
                    {new Date(notification.createdAt).toLocaleString('pt-BR')}
                  </div>
                </div>
              </DropdownMenuItem>
            ))
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      <NotificationModal
        notification={selectedNotification}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onMarkAsRead={handleMarkAsRead}
      />
    </>
  );
};

export default NotificationBell;
