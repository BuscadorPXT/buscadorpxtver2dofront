import { useAuth } from '../contexts/AuthContext';

export function useSocket() {
  const { socket } = useAuth();
  return socket;
}
