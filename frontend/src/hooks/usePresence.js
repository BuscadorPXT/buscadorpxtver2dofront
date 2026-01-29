import { useEffect, useRef, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';

export const usePresence = () => {
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [isConnected, setIsConnected] = useState(false);
  const { socket } = useAuth();
  const socketRef = useRef(socket);

  useEffect(() => {
    console.log('[usePresence] useEffect triggered, socket:', socket ? 'EXISTS' : 'NULL');
    console.log('[usePresence] socket.id:', socket?.id);
    console.log('[usePresence] socket.connected:', socket?.connected);
    
    if (!socket) {
      console.log('[usePresence] No socket available from AuthContext');
      setIsConnected(false);
      setOnlineUsers([]);
      return;
    }

    console.log('[usePresence] Using global WebSocket from AuthContext:', socket.id);
    socketRef.current = socket;

    setIsConnected(socket.connected);

    const handleOnlineUsers = (users) => {
      console.log('[usePresence] Received online users:', users);
      setOnlineUsers(users);
    };

    const handleConnect = () => {
      console.log('[usePresence] WebSocket connected!', socket.id);
      setIsConnected(true);

      setTimeout(() => {
        console.log('[usePresence] Requesting online users...');
        socket.emit('getOnlineUsers');
      }, 500);
    };

    const handleDisconnect = (reason) => {
      console.log('[usePresence] WebSocket disconnected. Reason:', reason);
      setIsConnected(false);
    };

    const handleError = (error) => {
      console.error('[usePresence] ❌ Socket error received from backend:', error);
      console.error('[usePresence] This usually means the user is not authorized (not admin) or not found in backend Map');
    };

    socket.on('connect', handleConnect);
    socket.on('disconnect', handleDisconnect);
    socket.on('onlineUsers', handleOnlineUsers);
    socket.on('error', handleError);
    
    console.log('[usePresence] All listeners registered');

    if (socket.connected) {
      console.log('[usePresence] Socket already connected, requesting users...');
      setIsConnected(true);
      setTimeout(() => {
        console.log('[usePresence] Emitting getOnlineUsers...');
        socket.emit('getOnlineUsers');
      }, 500);
    } else {
      console.log('[usePresence] Socket not connected yet, waiting for connection...');
    }

    return () => {
      console.log('[usePresence] Cleaning up event listeners');
      socket.off('connect', handleConnect);
      socket.off('disconnect', handleDisconnect);
      socket.off('onlineUsers', handleOnlineUsers);
      socket.off('error', handleError);
    };
  }, [socket]);

  const forceLogout = (userId) => {
    if (socket && socket.connected) {
      socket.emit('forceLogout', { userId });
    }
  };

  const refreshOnlineUsers = () => {
    if (socket && socket.connected) {
      socket.emit('getOnlineUsers');
    }
  };

  return {
    onlineUsers,
    isConnected,
    forceLogout,
    refreshOnlineUsers,
  };
};
