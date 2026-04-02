const express = require('express');
const app = express();
const server = require('http').Server(app);
const io = require('socket.io')(server);
const { ExpressPeerServer } = require('peer');

const peerServer = ExpressPeerServer(server, {
    debug: true,
    path: '/'
});

app.use('/peerjs', peerServer);
app.use(express.static('public'));

let activeUsers = [];

io.on('connection', (socket) => {
    socket.on('register-user', (data) => {
        socket.userId = data.peerId;
        // Удаляем старые записи с таким же именем, если они есть
        activeUsers = activeUsers.filter(u => u.name !== data.name);
        activeUsers.push({ id: data.peerId, name: data.name });
        io.emit('update-user-list', activeUsers);
    });

    socket.on('chat message', (msg) => {
        io.emit('chat message', msg);
    });

    socket.on('disconnect', () => {
        activeUsers = activeUsers.filter(u => u.id !== socket.userId);
        io.emit('update-user-list', activeUsers);
    });
});

const PORT = process.env.PORT || 10000;
server.listen(PORT, () => {
    console.log('HQ LIVE ON PORT ' + PORT);
});