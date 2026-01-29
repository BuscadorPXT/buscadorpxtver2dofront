import { useState, useEffect, useRef, useCallback } from 'react';

const useCacheEvents = (onCacheUpdated) => {
  const [isConnected, setIsConnected] = useState(false);
  const [lastEvent, setLastEvent] = useState(null);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const eventSourceRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);
  const onCacheUpdatedRef = useRef(onCacheUpdated);

  useEffect(() => {
    onCacheUpdatedRef.current = onCacheUpdated;
  }, [onCacheUpdated]);

  const connect = useCallback(() => {

    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }

    const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
    const sseUrl = `${baseUrl}/cache/events`;
    
    console.log('[Cache SSE] Connecting to:', sseUrl);
    
    const eventSource = new EventSource(sseUrl);
    eventSourceRef.current = eventSource;

    eventSource.onopen = () => {
      console.log('[Cache SSE] Connection opened');
      setIsConnected(true);
    };

    eventSource.addEventListener('cache-updated', (event) => {
      try {
        const data = JSON.parse(event.data);
        console.log('[Cache SSE] Cache updated:', data);
        setLastEvent(data);
        setIsRegenerating(false);

        if (onCacheUpdatedRef.current) {
          onCacheUpdatedRef.current(data);
        }
      } catch (error) {
        console.error('[Cache SSE] Error parsing cache-updated event:', error);
      }
    });

    eventSource.addEventListener('cache-regenerating', (event) => {
      try {
        const data = JSON.parse(event.data);
        console.log('[Cache SSE] Cache regenerating:', data);
        setIsRegenerating(true);
      } catch (error) {
        console.error('[Cache SSE] Error parsing cache-regenerating event:', error);
      }
    });

    eventSource.onerror = (error) => {
      console.error('[Cache SSE] Error:', error);
      setIsConnected(false);
      eventSource.close();

      reconnectTimeoutRef.current = setTimeout(() => {
        console.log('[Cache SSE] Reconnecting...');
        connect();
      }, 5000);
    };
  }, []);

  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
    setIsConnected(false);
  }, []);

  useEffect(() => {
    connect();
    
    return () => {
      disconnect();
    };
  }, []);

  return {
    isConnected,
    lastEvent,
    isRegenerating,
    reconnect: connect,
  };
};

export default useCacheEvents;
