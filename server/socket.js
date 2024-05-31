const { Server } = require('socket.io');
let IO;

module.exports.initIO = httpServer => {
  IO = new Server(httpServer, {
    cors: {
      origin: '*',
    },
  });

  IO.use((socket, next) => {
    console.log('Handshake Query:', socket.handshake.query);
    if (socket.handshake.query && socket.handshake.query.callerId) {
      let callerId = socket.handshake.query.callerId;
      socket.user = callerId;
      next();
    } else {
      console.log('Caller ID not provided');
      next(new Error('Authentication error'));
    }
  });

  IO.on('connection', socket => {
    console.log(socket.user, 'Connected');
    socket.join(socket.user);

    socket.on('call', data => {
      let calleeId = data.calleeId;
      let rtcMessage = data.rtcMessage;

      // Debug log
      console.log(`Emitting newCall to ${calleeId} from ${socket.user}`);

      socket.to(calleeId).emit('newCall', {
        callerId: socket.user,
        rtcMessage,
      });
    });

    socket.on('answerCall', data => {
      let callerId = data.callerId;
      let rtcMessage = data.rtcMessage;

      socket.to(callerId).emit('callAnswered', {
        callee: socket.user,
        rtcMessage,
      });
    });

    socket.on('ICEcandidate', data => {
      console.log('ICEcandidate data.calleeId', data.calleeId);
      let calleeId = data.calleeId;
      let rtcMessage = data.rtcMessage;

      socket.to(calleeId).emit('ICEcandidate', {
        sender: socket.user,
        rtcMessage: rtcMessage,
      });
    });

    socket.on('endCall', props => {
      IO.sockets.emit('callEnded');
      //socket.broadcast.emit('callEnded');
    });
  });
};

module.exports.getIO = () => {
  if (!IO) {
    throw Error('IO not initialized.');
  } else {
    return IO;
  }
};
