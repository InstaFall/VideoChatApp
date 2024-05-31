const path = require('path');
const { createServer } = require('http');

const express = require('express');
const { getIO, initIO } = require('./socket');

const app = express();

app.use('/', express.static(path.join(__dirname, 'static')));

app.use('/deneme', (req, res, next) => {
  res.json({ description: 'No content' });
});
const httpServer = createServer(app);

let port = process.env.PORT || 3500;

initIO(httpServer);

httpServer.listen(port, '0.0.0.0', () =>
  console.log(`Server running on port ${port}`),
);

getIO();
