// Build ID: 308308718
const express = require('express');
const app = express();
const server = require('http').Server(app);
const io = require('socket.io')(server);
const { ExpressPeerServer } = require('peer');

const peerServer = ExpressPeerServer(server, { debug: true, path: '/myapp' });
app.use('/peerjs', peerServer);
app.use(express.static('public'));

let activeUsers = [];

io.on('connection', (socket) => {
    socket.on('register-user', (data) => {
        socket.userId = data.peerId;
        activeUsers.push({ id: data.peerId, name: data.name });
        io.emit('update-user-list', activeUsers);
    });
    socket.on('join-voice-room', (userId) => {
        socket.broadcast.emit('user-connected-voice', userId);
    });
    socket.on('chat message', (msg) => { io.emit('chat message', msg); });
    socket.on('disconnect', () => {
        activeUsers = activeUsers.filter(u => u.id !== socket.userId);
        io.emit('update-user-list', activeUsers);
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => { console.log('HQ LIVE [' + 308308718 + '] ON PORT ' + PORT); });
