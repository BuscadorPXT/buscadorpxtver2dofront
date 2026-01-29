import { createContext, useContext, useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import api from '../lib/axios';
import { clearAccessCache } from '../components/ProtectedRoute';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider');
  }
  return context;
};

export { api };

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [socket, setSocket] = useState(null);
  const socketRef = useRef(null);

  api.defaults.baseURL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

  const connectWebSocket = (token) => {

    if (socketRef.current?.connected) {
      console.log('[AuthContext] ✅ Socket already connected, reusing existing connection');
      return;
    }

    if (socketRef.current) {
      console.log('[AuthContext] Cleaning up disconnected socket...');
      socketRef.current.disconnect();
      socketRef.current = null;
      setSocket(null);
    }

    if (!token) {
      console.log('[AuthContext] No token provided for socket connection');
      return;
    }

    console.log('[AuthContext] Setting up global WebSocket connection for duplicate login detection');

    const backendUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';
    console.log('[AuthContext] Backend URL:', backendUrl);
    
    const newSocket = io(backendUrl, {
      auth: { token },
      transports: ['websocket'],
      reconnection: false,
      timeout: 20000,
      autoConnect: true,
      path: '/socket.io',
    });

    console.log('[AuthContext] Socket instance created, setting refs...');
    socketRef.current = newSocket;
    setSocket(newSocket);
    console.log('[AuthContext] Socket refs updated');

    newSocket.on('duplicateLogin', (data) => {
      console.log('[AuthContext] ⚠️ DUPLICATE LOGIN DETECTED:', data);

      newSocket.disconnect();
      socketRef.current = null;
      setSocket(null);

      localStorage.removeItem('token');
      localStorage.removeItem('user');
      delete api.defaults.headers.common['Authorization'];
      setUser(null);

      alert(data.reason || 'Sua conta foi conectada em outro dispositivo ou aba. Esta sessão será encerrada.');
      window.location.href = '/login';
    });

    newSocket.on('forceLogout', (data) => {
      console.log('[AuthContext] Force logout received:', data);

      newSocket.disconnect();
      socketRef.current = null;
      setSocket(null);

      localStorage.removeItem('token');
      localStorage.removeItem('user');
      delete api.defaults.headers.common['Authorization'];
      setUser(null);

      alert(data.reason || 'Você foi desconectado pelo administrador');
      window.location.href = '/login';
    });

    newSocket.on('planUpdated', (data) => {
      console.log('[AuthContext] Plan updated event received:', data);

      newSocket.disconnect();
      socketRef.current = null;
      setSocket(null);

      localStorage.removeItem('token');
      localStorage.removeItem('user');
      delete api.defaults.headers.common['Authorization'];
      setUser(null);

      alert(data.message || 'Seu plano foi atualizado. Por favor, faça login novamente.');
      window.location.href = '/login';
    });

    newSocket.on('disconnect', (reason) => {
      console.log('[AuthContext] WebSocket disconnected:', reason);
      if (reason === 'io server disconnect' || reason === 'transport close') {

        console.log('[AuthContext] Server forced disconnect - likely duplicate login');
      }
    });

    newSocket.on('connect', () => {
      console.log('[AuthContext] ✅ Global WebSocket connected, socket ID:', newSocket.id);
      console.log('[AuthContext] Socket connected state:', newSocket.connected);
      console.log('[AuthContext] Setting socket state...');

      setSocket(prevSocket => {
        console.log('[AuthContext] Previous socket:', prevSocket?.id);
        console.log('[AuthContext] New socket:', newSocket.id);
        return newSocket;
      });
      console.log('[AuthContext] Socket state set!');
    });

    newSocket.on('connect_error', (error) => {
      console.error('[AuthContext] WebSocket connection error:', error);
    });
  };

  useEffect(() => {

    const initAuth = () => {
      console.log('🔄 [AuthContext] Initializing authentication...');
      try {
        const token = localStorage.getItem('token');
        const userData = localStorage.getItem('user');
        
        console.log('📦 [AuthContext] LocalStorage check:', { 
          hasToken: !!token, 
          hasUserData: !!userData,
          tokenPreview: token ? `${token.substring(0, 20)}...` : null
        });
        
        if (token && userData) {

          api.defaults.headers.common['Authorization'] = `Bearer ${token}`;

          const parsedUser = JSON.parse(userData);
          setUser(parsedUser);

          clearAccessCache();

          connectWebSocket(token);
          
          console.log('✅ [AuthContext] Auth restored successfully:', { 
            email: parsedUser.email, 
            isAdmin: parsedUser.isAdmin,
            userId: parsedUser.id 
          });
        } else {
          console.log('⚠️ [AuthContext] No saved session found in localStorage');
        }
      } catch (error) {
        console.error('❌ [AuthContext] Error restoring auth:', error);

        localStorage.removeItem('token');
        localStorage.removeItem('user');
        delete api.defaults.headers.common['Authorization'];
        setUser(null);
      } finally {
        console.log('🏁 [AuthContext] Auth initialization complete, loading:', false);
        setLoading(false);
      }
    };

    initAuth();

    const interceptor = api.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401 && window.location.pathname !== '/login') {
          console.log('Token expired or invalid, logging out');

          localStorage.removeItem('token');
          localStorage.removeItem('user');
          delete api.defaults.headers.common['Authorization'];
          setUser(null);

          window.location.href = '/login?expired=true';
        }
        return Promise.reject(error);
      }
    );

    const handleBeforeUnload = () => {
      console.log('[AuthContext] 🔌 Page unloading, disconnecting socket...');
      if (socketRef.current?.connected) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
    
    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      api.interceptors.response.eject(interceptor);
      window.removeEventListener('beforeunload', handleBeforeUnload);
      if (socketRef.current) {
        console.log('[AuthContext] 🔌 Component unmounting, disconnecting socket...');
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, []);

  const login = async (email, password) => {
    try {
      const response = await api.post('/auth/login', { email, password });
      const { access_token, user: userData } = response.data;
      
      console.log('Login successful, saving to localStorage:', { 
        email: userData.email, 
        isAdmin: userData.isAdmin,
        tokenLength: access_token?.length 
      });

      localStorage.setItem('token', access_token);
      localStorage.setItem('user', JSON.stringify(userData));

      api.defaults.headers.common['Authorization'] = `Bearer ${access_token}`;

      setUser(userData);

      clearAccessCache();

      connectWebSocket(access_token);
      
      console.log('Login state updated, user:', userData.email);
      
      return { success: true };
    } catch (error) {
      console.error('Login failed:', error.response?.data || error.message);
      return { 
        success: false, 
        message: error.response?.data?.message || 'Erro ao fazer login' 
      };
    }
  };

  const register = async (name, email, phone, password) => {
    try {
      const response = await api.post('/auth/register', { name, email, phone, password });
      return { success: true, message: response.data.message };
    } catch (error) {
      return { 
        success: false, 
        message: error.response?.data?.message || 'Erro ao registrar usuário' 
      };
    }
  };

  const logout = () => {
    console.log('Logging out, clearing localStorage and state');

    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
    }
    
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    delete api.defaults.headers.common['Authorization'];
    setUser(null);
  };

  const value = {
    user,
    login,
    register,
    logout,
    loading,
    isAuthenticated: !!user,
    isAdmin: user?.isAdmin || false,
    socket,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
