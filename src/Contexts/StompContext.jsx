import {
  createContext, useContext,
  useEffect,
  useRef,
  useState,
} from 'react';
import SockJS from 'sockjs-client';
import { Client } from '@stomp/stompjs';
import { TokenContext } from './TokenContext.jsx';
import { UserContext } from './UserContext.jsx';
import { RoomsDataContext } from './RoomsDataContext.jsx';

export const StompContext = createContext(null);

export const StompContextProvider = ({ children }) => {

  const { userCurrentStatus } = useContext(UserContext);
  const { token } = useContext(TokenContext);
  const { setRooms } = useContext(RoomsDataContext);

  const [connected, setConnected] = useState(false);
  const [reconnecting, setReconnecting] = useState(false);
  const [hasError, setHasError] = useState(false);
  const subscriptionRef = useRef(new Map);
  const clientRef = useRef(null);

  // Token tracking
  const lastTokenRef = useRef(null);

  const connectToSocket = () => {

    if (clientRef.current) {
      setReconnecting(true);
      clientRef.current.deactivate();
      clientRef.current = null;
    }

    const socket = new SockJS(`https://farao-backend-fa2bcbbfec38.herokuapp.com/gs-guide-websocket?token=${token}`);

    const client = new Client({
      connectHeaders: {
        Authorization: 'Bearer ' + token,
      },
      webSocketFactory: () => socket,
      reconnectDelay: 0,
      heartbeatIncoming: 10000,
      heartbeatOutgoing: 10000,
      onConnect: () => {
        setConnected(true);
        setHasError(false);
        setReconnecting(false);

        lastTokenRef.current = token;

      },

      onDisconnect: () => {
        setConnected(false);
        setHasError(true);
      },

      onStompError: (frame) => {
        console.error('[STOMP] STOMP Error:', frame.headers['message'], frame.body);
        setHasError(true);
        setConnected(false);
      },

      onWebSocketClose: (event) => {
        setConnected(false);
        setHasError(true);
      },

      onWebSocketError: (error) => {
        console.error('[STOMP] WebSocket error:', error);
        setHasError(true);
        setConnected(false);
      },

      debug: (str) => {
      },
    });

    client.activate();
    clientRef.current = client;
  };

  const disconnectFromSocket = () => {
    if (clientRef.current) {
      try {
        clientRef.current.deactivate();
      } catch (error) {
        console.error('[STOMP] Disconnect error:', error);
      }
      clientRef.current = null;
    }
    setConnected(false);
    setHasError(false);
    setReconnecting(false);
    lastTokenRef.current = null;
  };

  useEffect(() => {


    if (userCurrentStatus.authenticated && token && !connected) {
      const isNewToken = lastTokenRef.current !== token;

      if (isNewToken || !clientRef.current) {
        connectToSocket();
      } else {
      }
    }

    // Disconnect ha nincs token
    if (!token && (connected || clientRef.current)) {
      disconnectFromSocket();
    }
  }, [userCurrentStatus.authenticated, token, connected]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      disconnectFromSocket();
    };
  }, []);

  const contextValue = {
    clientRef,
    connected,
    connectToSocket,
    subscriptionRef,
    reconnecting,
    setReconnecting,
    hasError,
    disconnectFromSocket,
  };

  return <StompContext.Provider
    value={contextValue}>{children}</StompContext.Provider>;
};