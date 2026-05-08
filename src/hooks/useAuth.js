import { useState, useEffect, useContext, useCallback } from 'react';
import { TokenContext } from '../Contexts/TokenContext.jsx';
import { UserContext } from '../Contexts/UserContext.jsx';
import { AuthSyncContext } from '../Contexts/AuthSyncContext.jsx';
import { useApiCallHook } from './useApiCallHook.js';
import { GameSessionContext } from '../Contexts/GameSessionContext.jsx';
import { StompContext } from '../Contexts/StompContext.jsx';

export const useAuth = () => {
  const { token, setToken } = useContext(TokenContext);
  const { userCurrentStatus, setUserCurrentStatus } = useContext(UserContext);
  const { broadcastLogin, broadcastLogout, broadcastTokenRefresh } = useContext(AuthSyncContext);
  const { setGameSession, setPlayerSelf, setValidPlays } = useContext(GameSessionContext);
  const { get, post } = useApiCallHook();
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const { clientRef, disconnectFromSocket } = useContext(StompContext);

  // Token lejáratának ellenőrzése
  const isTokenExpiringSoon = useCallback((token) => {
    if (!token) {
      return true;
    }

    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const now = Date.now() / 1000;
      return payload.exp - now < 300; // 5 percen belül lejár
    } catch {
      return true;
    }
  }, []);

  // Token frissítése
  const refreshToken = useCallback(async () => {
    if (isRefreshing) {
      return null;
    }
    setIsRefreshing(true);

    try {
      const response = await post('https://farao-backend-fa2bcbbfec38.herokuapp.com/auth/refreshToken');

      if (response?.accessToken) {
        setToken(response.accessToken);

        // Broadcast más tabok felé - MOST MÁR A TOKENNEL
        broadcastTokenRefresh(response.accessToken);

        return response.accessToken;
      }
      throw new Error('No access token received');
    } catch (error) {
      console.error('[AUTH] Token refresh failed:', error);
      await logout();
      return null;
    } finally {
      setIsRefreshing(false);
    }
  }, [post, isRefreshing, setToken, broadcastTokenRefresh]);

  // User status lekérdezése
  const getCurrentStatus = useCallback(async (token = token) => {

    if (!token) {
      return null;
    }

    try {
      const userStatus = await post('https://farao-backend-fa2bcbbfec38.herokuapp.com/user/current-status', { token });

      if (userStatus?.authenticated) {
        const currentAndManagedRoom = await post(
          'https://farao-backend-fa2bcbbfec38.herokuapp.com/room/current-and-managed-room',
          {
            currentRoomId: userStatus?.currentRoomId,
            managedRoomId: userStatus?.managedRoomId,
          },
          token,
        );

        const userStatusWRooms = {
          userInfo: userStatus?.userInfo,
          authenticated: userStatus?.authenticated,
          currentRoom: currentAndManagedRoom?.currentRoom,
          managedRoom: currentAndManagedRoom?.managedRoom,
        };

        setUserCurrentStatus(userStatusWRooms);

        // Game session lekérdezése ha van szoba
        if (userStatusWRooms.currentRoom?.roomId) {
          await getGameSession(token, userStatusWRooms);
        }

        return userStatusWRooms;
      }
      throw new Error('User not authenticated');
    } catch (error) {
      console.error('[AUTH] Get current status failed:', error);
      setUserCurrentStatus(prev => ({ ...prev, authenticated: false }));
      return null;
    }
  }, [post, token, setUserCurrentStatus]);

  const getGameSession = async (token, userStatusWRooms) => {
    if (!token) {
      return null;
    }

    try {
      const gameSession = await get('https://farao-backend-fa2bcbbfec38.herokuapp.com/game/state', token);

      if (gameSession) {
        const { validPlays, ...rest } = gameSession;
        setGameSession(rest);
        setValidPlays(validPlays || []);

        const player = gameSession?.players.find(
          (p) => p.userId === userStatusWRooms.userInfo.userId,
        );
        setPlayerSelf(player);
      }
    } catch (error) {
      setGameSession({});
      setValidPlays([]);
      setPlayerSelf({});
    }
  };

  // Bejelentkezés + Broadcast
  const login = useCallback(async (username, password) => {

    try {
      const response = await post('https://farao-backend-fa2bcbbfec38.herokuapp.com/auth/login', {
        username,
        password,
      });

      if (response?.success && response?.accessToken) {
        setToken(response.accessToken);

        // Szobák lekérése
        const currentAndManagedRoom = await post(
          'https://farao-backend-fa2bcbbfec38.herokuapp.com/room/current-and-managed-room',
          {
            currentRoomId: response.userCurrentStatus?.currentRoomId,
            managedRoomId: response.userCurrentStatus?.managedRoomId,
          },
          response.accessToken,
        );

        if (currentAndManagedRoom) {
          const userStatusWRooms = {
            userInfo: response.userCurrentStatus?.userInfo,
            authenticated: response.userCurrentStatus?.authenticated,
            currentRoom: currentAndManagedRoom?.currentRoom,
            managedRoom: currentAndManagedRoom?.managedRoom,
          };

          setUserCurrentStatus(userStatusWRooms);

          // Broadcast LOGIN más tabok felé - MOST MÁR A TOKENNEL
          broadcastLogin(response.accessToken);

          if (userStatusWRooms.currentRoom?.roomId) {
            await getGameSession(response.accessToken, userStatusWRooms);
          }
        }

        return { success: true };
      }

      throw new Error(response?.message || 'Login failed');
    } catch (error) {
      console.error('[AUTH] Login failed:', error);

      return { success: false, message: error.message };
    }
  }, [post, setToken, setUserCurrentStatus, broadcastLogin]);

  // Kijelentkezés + Broadcast
  const logout = useCallback(async () => {

    try {
      const currentToken = token;

      // State törlése
      setToken(null);
      setUserCurrentStatus({
        userInfo: {
          userId: '',
          username: '',
          role: '',
        },
        currentRoom: null,
        managedRoom: null,
        authenticated: false,
      });
      setGameSession({});
      setPlayerSelf({});
      setValidPlays([]);

      broadcastLogout();

      // WebSocket disconnect
      if (disconnectFromSocket) {
        try {
          disconnectFromSocket();
        } catch (error) {
          console.error('[LOGOUT] WebSocket disconnect error:', error);
        }
      }

      // Backend logout
      if (currentToken) {
        try {
          await post('https://farao-backend-fa2bcbbfec38.herokuapp.com/auth/logout', {}, currentToken);
        } catch (error) {
          console.error('[LOGOUT] Backend logout failed:', error);
        }
      }

    } catch (error) {
      console.error('[LOGOUT] Logout error:', error);
    }
  }, [
    post,
    token,
    setToken,
    setUserCurrentStatus,
    setGameSession,
    setPlayerSelf,
    setValidPlays,
    disconnectFromSocket,
    broadcastLogout,
  ]);

  // Automatikus token validáció
  const ensureValidToken = useCallback(async () => {
    const currentToken = token;

    if (!currentToken) {
      setUserCurrentStatus(prev => ({ ...prev, authenticated: false }));
      return false;
    }

    if (isTokenExpiringSoon(currentToken)) {
      const newToken = await refreshToken();
      if (!newToken) {
        return false;
      }
      return true;
    }

    if (!userCurrentStatus.authenticated) {
      const status = await getCurrentStatus();
      return !!status;
    }

    return true;
  }, [token, userCurrentStatus.authenticated, isTokenExpiringSoon, refreshToken, getCurrentStatus, setUserCurrentStatus]);

  // Inicializálás
  useEffect(() => {
    const initAuth = async () => {
      setIsLoading(true);

      if (!token) {
        const newToken = await refreshToken();

        if (newToken) {
          await getCurrentStatus(newToken);
        } else {
          setUserCurrentStatus(prev => ({ ...prev, authenticated: false }));
        }
      } else {
        await ensureValidToken();
      }

      setIsLoading(false);
    };

    initAuth();
  }, []);

  // Automatikus token frissítés
  useEffect(() => {
    if (!userCurrentStatus.authenticated || !token) {
      return;
    }

    const interval = setInterval(async () => {
      if (isTokenExpiringSoon(token)) {
        await refreshToken();
      }
    }, 240000);

    return () => clearInterval(interval);
  }, [userCurrentStatus.authenticated, token, isTokenExpiringSoon, refreshToken]);

  return {
    isAuthenticated: userCurrentStatus.authenticated,
    userCurrentStatus,
    isLoading,
    isRefreshing,
    login,
    logout,
    refreshToken,
    getCurrentStatus,
    ensureValidToken,
  };
};