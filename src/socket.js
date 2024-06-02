import React, { createContext, useContext, useEffect, useState } from 'react';
import io from 'socket.io-client';
import { useSelector } from 'react-redux';
export const SocketContext = createContext(null);

export const SocketProvider = ({ children }) => {
  const localCallerId = useSelector(state => state.user.callerId);
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    if (localCallerId) {
      const newSocket = io('http://192.168.1.10:3500', {
        query: { callerId: localCallerId },
      });
      setSocket(newSocket);

      return () => newSocket.close();
    }
  }, [localCallerId]);

  return (
    <SocketContext.Provider value={socket}>{children}</SocketContext.Provider>
  );
};

export const useSocket = () => useContext(SocketContext);
