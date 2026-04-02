const express = require('express');
const app = express();
const server = require('http').Server(app);
const io = require('socket.io')(server);
const { ExpressPeerServer } = require('peer');

// Настройка PeerJS сервера для голосовых данных
const peerServer = ExpressPeerServer(server, {
    debug: true,
    path: '/myapp'
});

app.use('/peerjs', peerServer);
app.use(express.static('public'));

app.get('/', (req, res) => {
    res.sendFile(__dirname + '/public/index.html');
});

io.on('connection', (socket) => {
    // Когда кто-то заходит, выдаем ему ID для звонка
    socket.on('join-room', (userId) => {
        socket.broadcast.emit('user-connected', userId);
    });

    socket.on('chat message', (msg) => {
        io.emit('chat message', msg);
    });
});

// ПОРТ: Render сам подставит нужный, или используем 3000 локально
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log('Бурмалдскорд с голосом запущен на порту ' + PORT);
});
