import { useState, useEffect } from 'react';
import { Clock } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import api from '@/lib/axios';

const HoursDisplay = () => {
  const { isAuthenticated, isAdmin, socket } = useAuth();
  const [hours, setHours] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    console.log('[HoursDisplay] useEffect - isAuthenticated:', isAuthenticated, 'isAdmin:', isAdmin, 'socket:', !!socket);
    
    if (isAuthenticated && !isAdmin) {
      console.log('[HoursDisplay] Fetching initial hours...');
      fetchHours();

      if (socket) {
        console.log('[HoursDisplay] Registering hours-updated listener on socket');
        
        const handleHoursUpdated = (data) => {
          console.log('[HoursDisplay] ⚡ Hours updated via WebSocket:', data);

          setIsUpdating(true);

          setHours({
            available: data.hoursAvailable,
            used: data.hoursUsed,
            remaining: data.remaining,
            durationType: data.durationType,
            daysRemaining: data.daysRemaining,
          });

          setTimeout(() => setIsUpdating(false), 500);
        };

        socket.on('hours-updated', handleHoursUpdated);
        console.log('[HoursDisplay] Listener registered successfully');

        return () => {
          console.log('[HoursDisplay] Cleaning up hours-updated listener');
          socket.off('hours-updated', handleHoursUpdated);
        };
      } else {
        console.warn('[HoursDisplay] Socket is not available');
      }
    } else {
      console.log('[HoursDisplay] Skipping - Not authenticated or is admin');
    }
  }, [isAuthenticated, isAdmin, socket]);

  const fetchHours = async () => {
    try {
      const response = await api.get('/subscriptions/me/hours');
      setHours(response.data);
    } catch (error) {
      console.error('Erro ao buscar horas:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatHoursToTime = (decimalHours) => {
    const hours = Math.floor(decimalHours);
    const minutes = Math.round((decimalHours - hours) * 60);
    return `${hours}:${minutes.toString().padStart(2, '0')}`;
  };

  if (!isAuthenticated || isAdmin || loading || !hours) {
    return null;
  }

  const durationType = hours.durationType || 'days';

  if (durationType === 'days') {
    const daysRemaining = hours.daysRemaining || 0;
    const isLow = daysRemaining <= 3;
    const isCritical = daysRemaining <= 0;

    return (
      <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/10 border transition-all duration-300 ${
        isUpdating 
          ? 'border-blue-500 shadow-lg shadow-blue-500/20 scale-105' 
          : 'border-gray-700'
      }`}>
        <Clock className={`h-4 w-4 transition-colors duration-300 ${
          isCritical ? 'text-red-400' : isLow ? 'text-yellow-400' : 'text-green-400'
        } ${isUpdating ? 'animate-pulse' : ''}`} />
        <div className="flex flex-col">
          <span className={`text-xs font-medium transition-colors duration-300 ${
            isCritical ? 'text-red-400' : isLow ? 'text-yellow-400' : 'text-white'
          }`}>
            {daysRemaining} {daysRemaining === 1 ? 'dia' : 'dias'}
          </span>
          <span className="text-[10px] text-gray-400">
            restante{daysRemaining !== 1 ? 's' : ''}
          </span>
        </div>
      </div>
    );
  }

  const percentage = (hours.remaining / hours.available) * 100;
  const isLow = percentage < 20;
  const isCritical = hours.remaining <= 0;

  return (
    <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/10 border transition-all duration-300 ${
      isUpdating 
        ? 'border-blue-500 shadow-lg shadow-blue-500/20 scale-105' 
        : 'border-gray-700'
    }`}>
      <Clock className={`h-4 w-4 transition-colors duration-300 ${
        isCritical ? 'text-red-400' : isLow ? 'text-yellow-400' : 'text-green-400'
      } ${isUpdating ? 'animate-pulse' : ''}`} />
      <div className="flex flex-col">
        <span className={`text-xs font-medium transition-colors duration-300 ${
          isCritical ? 'text-red-400' : isLow ? 'text-yellow-400' : 'text-white'
        }`}>
          {formatHoursToTime(hours.remaining)} restantes
        </span>
        <span className="text-[10px] text-gray-400">
          de {formatHoursToTime(hours.available)} totais
        </span>
      </div>
    </div>
  );
};

export default HoursDisplay;
