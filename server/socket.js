const { Server } = require('socket.io');
let IO;

module.exports.initIO = (httpServer) => {
  IO = new Server(httpServer, {
    cors: {
      origin: '*',
    },
  });

  const User = require('./models/user');
  IO.use((socket, next) => {
    const callerId = socket.handshake.query.callerId;
    if (callerId) {
      User.findOne({ callerId }).then((user) => {
        if (user) {
          socket.user = callerId;
          next();
        } else {
          next(new Error('Invalid caller ID'));
        }
      });
    } else {
      next(new Error('Caller ID not provided'));
    }
  });

  IO.on('connection', (socket) => {
    console.log(socket.user, 'Connected');
    socket.join(socket.user);

    socket.on('call', (data) => {
      let calleeId = data.calleeId;
      let rtcMessage = data.rtcMessage;

      // Debug log
      console.log(`Emitting newCall to ${calleeId} from ${socket.user}`);

      socket.to(calleeId).emit('newCall', {
        callerId: socket.user,
        rtcMessage,
      });
    });

    socket.on('answerCall', (data) => {
      let callerId = data.callerId;
      let rtcMessage = data.rtcMessage;

      socket.to(callerId).emit('callAnswered', {
        callee: socket.user,
        rtcMessage,
      });
    });

    socket.on('ICEcandidate', (data) => {
      console.log('ICEcandidate data.calleeId', data.calleeId);
      let calleeId = data.calleeId;
      let rtcMessage = data.rtcMessage;

      socket.to(calleeId).emit('ICEcandidate', {
        sender: socket.user,
        rtcMessage: rtcMessage,
      });
    });

    socket.on('endCall', (props) => {
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
