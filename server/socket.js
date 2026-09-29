const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');

exports.initSocket = (server) => {
  const io = new Server(server, { cors: { origin: process.env.CLIENT_URL } });

  // Reject sockets without a valid token
  io.use((socket, next) => {
    try {
      socket.userId = jwt.verify(socket.handshake.auth.token, process.env.JWT_SECRET).id;
      next();
    } catch { next(new Error('Unauthorized')); }
  });

  // Every user joins a private room named after their user id
  io.on('connection', (socket) => socket.join(socket.userId));
  return io;
};
