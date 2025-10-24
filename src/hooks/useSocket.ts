import { useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from '../context/AuthContext';

export const useSocket = () => {
  const { token } = useAuth();
  const socketRef = useRef<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttempts = useRef(0);
  const maxReconnectAttempts = 5;

  useEffect(() => {
    if (token) {
      const connect = () => {
        const serverUrl = process.env.NODE_ENV === 'production' 
          ? window.location.origin 
          : 'http://localhost:5000';
        
        socketRef.current = io(serverUrl, {
          auth: { token },
          transports: ['websocket', 'polling'],
          timeout: 20000,
          forceNew: true
        });

        socketRef.current.on('connect', () => {
          setIsConnected(true);
          reconnectAttempts.current = 0;
          console.log('Connected to server');
        });

        socketRef.current.on('disconnect', (reason) => {
          setIsConnected(false);
          console.log('Disconnected from server:', reason);
          
          // Auto-reconnect on unexpected disconnections
          if (reason === 'io server disconnect') {
            // Server initiated disconnect, don't reconnect
            return;
          }
          
          if (reconnectAttempts.current < maxReconnectAttempts) {
            reconnectAttempts.current++;
            const delay = Math.min(1000 * Math.pow(2, reconnectAttempts.current), 30000);
            console.log(`Attempting to reconnect in ${delay}ms (attempt ${reconnectAttempts.current})`);
            
            reconnectTimeoutRef.current = setTimeout(() => {
              connect();
            }, delay);
          } else {
            console.log('Max reconnection attempts reached');
          }
        });

        socketRef.current.on('connect_error', (error) => {
          console.error('Connection error:', error);
          setIsConnected(false);
        });

        socketRef.current.on('reconnect', (attemptNumber) => {
          console.log('Reconnected after', attemptNumber, 'attempts');
          setIsConnected(true);
        });

        socketRef.current.on('reconnect_error', (error) => {
          console.error('Reconnection error:', error);
        });

        socketRef.current.on('reconnect_failed', () => {
          console.error('Reconnection failed');
          setIsConnected(false);
        });
      };

      connect();

      return () => {
        if (reconnectTimeoutRef.current) {
          clearTimeout(reconnectTimeoutRef.current);
        }
        if (socketRef.current) {
          socketRef.current.disconnect();
        }
      };
    }
  }, [token]);

  return { socket: socketRef.current, isConnected };
};