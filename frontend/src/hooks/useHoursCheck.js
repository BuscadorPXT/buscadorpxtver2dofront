import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import api from '@/lib/axios';

export const useHoursCheck = () => {
  const { isAuthenticated, isAdmin, socket, logout } = useAuth();
  const [showExpiredModal, setShowExpiredModal] = useState(false);
  const [hours, setHours] = useState(null);

  useEffect(() => {
    if (isAuthenticated && !isAdmin) {

      checkHours();

      if (socket) {
        const handleHoursUpdated = (data) => {
          console.log('[useHoursCheck] ⚡ Hours updated via WebSocket:', data);
          setHours({
            available: data.hoursAvailable,
            used: data.hoursUsed,
            remaining: data.remaining,
          });

          if (data.remaining > 0 && data.remaining <= 0.5) {
            console.warn('[useHoursCheck] ⚠️ Low hours warning:', data.remaining.toFixed(2), 'hours remaining');
          }
        };

        const handleHoursExpired = (data) => {
          console.log('[useHoursCheck] ❌ Hours expired:', data);
          setShowExpiredModal(true);

          setTimeout(() => {
            logout();
          }, 3000);
        };

        socket.on('hours-updated', handleHoursUpdated);
        socket.on('hours-expired', handleHoursExpired);

        return () => {
          socket.off('hours-updated', handleHoursUpdated);
          socket.off('hours-expired', handleHoursExpired);
        };
      }
    }
  }, [isAuthenticated, isAdmin, socket]);

  const checkHours = async () => {
    try {
      const response = await api.get('/subscriptions/me/hours');
      setHours(response.data);
      
      if (response.data.remaining <= 0) {
        setShowExpiredModal(true);
      }
    } catch (error) {
      console.error('Erro ao verificar horas:', error);
    }
  };

  return {
    showExpiredModal,
    setShowExpiredModal,
    hours,
    hasHoursRemaining: hours?.remaining > 0,
  };
};
