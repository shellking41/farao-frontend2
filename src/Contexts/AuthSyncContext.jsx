import React, { createContext, useContext, useEffect, useRef } from 'react';
import { TokenContext } from './TokenContext';
import { UserContext } from './UserContext';
import { StompContext } from './StompContext';

export const AuthSyncContext = createContext(null);

export const AuthSyncProvider = ({ children }) => {
  const { setToken } = useContext(TokenContext);
  const { setUserCurrentStatus } = useContext(UserContext);
  const { disconnectFromSocket } = useContext(StompContext);
  const channelRef = useRef(null);
  const tabIdRef = useRef(`tab-${Date.now()}-${Math.random()}`);

  useEffect(() => {
    channelRef.current = new BroadcastChannel('auth-sync');

    channelRef.current.onmessage = async (event) => {
      const { type, senderId, accessToken } = event.data;

      if (senderId === tabIdRef.current) {
        return;
      }

      switch (type) {
        case 'LOGIN':

          if (accessToken) {
            setToken(accessToken);
          }

          window.location.reload();
          break;

        case 'LOGOUT':

          setToken(null);
          setUserCurrentStatus({
            userInfo: { userId: '', username: '', role: '' },
            currentRoom: null,
            managedRoom: null,
            authenticated: false,
          });

          if (disconnectFromSocket) {
            disconnectFromSocket();
          }

          break;

        case 'TOKEN_REFRESH':

          if (accessToken) {
            setToken(accessToken);
          }

          break;

        default:
          break;
      }
    };

    return () => {
      channelRef.current?.close();
    };
  }, [setToken, setUserCurrentStatus, disconnectFromSocket]);

  const broadcastLogin = (accessToken) => {
    channelRef.current?.postMessage({
      type: 'LOGIN',
      senderId: tabIdRef.current,
      accessToken: accessToken,
    });
  };

  const broadcastLogout = () => {
    channelRef.current?.postMessage({
      type: 'LOGOUT',
      senderId: tabIdRef.current,
    });
  };

  const broadcastTokenRefresh = (accessToken) => {
    channelRef.current?.postMessage({
      type: 'TOKEN_REFRESH',
      senderId: tabIdRef.current,
      accessToken: accessToken,
    });
  };

  return (
    <AuthSyncContext.Provider value={{
      broadcastLogin,
      broadcastLogout,
      broadcastTokenRefresh,
    }}>
      {children}
    </AuthSyncContext.Provider>
  );
};