import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { useSocket } from './useSocket';
import { useAuth } from '../contexts/AuthContext';

export function usePageTracking() {
  const location = useLocation();
  const socket = useSocket();
  const { isAuthenticated } = useAuth();
  const currentPageViewId = useRef(null);
  const previousPath = useRef(null);

  useEffect(() => {
    if (!socket || !isAuthenticated) return;

    const pagePath = location.pathname;
    const pageTitle = document.title;
    const referrer = previousPath.current || document.referrer;

    console.log('[PageTracking] Entering page:', pagePath);
    socket.emit('page-enter', {
      pagePath,
      pageTitle,
      referrer,
    });

    previousPath.current = pagePath;

    return () => {
      if (socket && socket.connected) {
        console.log('[PageTracking] Leaving page:', pagePath);
        socket.emit('page-leave');
      }
    };
  }, [location.pathname, socket, isAuthenticated]);

  useEffect(() => {
    if (!socket || !isAuthenticated) return;

    const handleBeforeUnload = () => {
      console.log('[PageTracking] User leaving site (beforeunload)');

      if (socket && socket.connected) {

        socket.emit('page-leave');

        try {
          const backendUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';
          const token = localStorage.getItem('token');
          if (token && navigator.sendBeacon) {

            const data = JSON.stringify({ timestamp: Date.now() });
            const blob = new Blob([data], { type: 'application/json' });

            const url = `${backendUrl}/analytics/page-leave?token=${encodeURIComponent(token)}`;
            const sent = navigator.sendBeacon(url, blob);
            console.log('[PageTracking] Sent page-leave via sendBeacon:', sent);
          }
        } catch (err) {
          console.error('[PageTracking] sendBeacon failed:', err);
        }
      }
    };

    const handleVisibilityChange = () => {

      if (document.visibilityState === 'hidden') {
        console.log('[PageTracking] Page hidden, sending page-leave');
        if (socket && socket.connected) {
          socket.emit('page-leave');
        }
      }
    };

    const handlePageHide = () => {
      console.log('[PageTracking] Page hide event');
      if (socket && socket.connected) {
        socket.emit('page-leave');
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    window.addEventListener('pagehide', handlePageHide);

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      window.removeEventListener('pagehide', handlePageHide);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [socket, isAuthenticated]);
}
