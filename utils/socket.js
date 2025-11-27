import io from 'socket.io-client';

let socket = null;

export const initializeSocket = (token, userId) => {
  if (socket) {
    socket.disconnect();
  }

  socket = io('https://vianney-server.onrender.com', {
    auth: {
      token: token
    }
  });

  socket.on('connect', () => {
    socket.emit('unir_usuario', userId);
  });

  socket.on('disconnect', () => {
  });

  return socket;
};

export const getSocket = () => {
  return socket;
};

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};