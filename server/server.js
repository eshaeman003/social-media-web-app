require('express-async-errors'); // lets async route errors reach the error handler
require('dns').setServers(['8.8.8.8', '1.1.1.1']); // fixes Atlas SRV lookup on some networks
require('dotenv').config();
const express = require('express');
const http = require('http');
const cors = require('cors');
const path = require('path');
const mongoose = require('mongoose');
const { initSocket } = require('./socket');

const app = express();
const server = http.createServer(app);

app.use(cors({ origin: process.env.CLIENT_URL }));
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.set('io', initSocket(server)); // routes reach Socket.IO with req.app.get('io')

app.use('/api/auth', require('./routes/auth'));
app.use('/api/users', require('./routes/users'));
app.use('/api/posts', require('./routes/posts'));
app.use('/api/friends', require('./routes/friends'));
app.use('/api/notifications', require('./routes/notifications'));
app.use('/api/chat', require('./routes/chat'));
app.use('/api/stories', require('./routes/stories'));

app.use((err, req, res, next) => res.status(500).json({ message: err.message }));

mongoose.connect(process.env.MONGO_URI).then(() => {
  server.listen(process.env.PORT || 5000, () => console.log('Server running on port ' + (process.env.PORT || 5000)));
}).catch(e => console.error('MongoDB connection failed:', e.message));
