const express = require('express');
const app = express();
const server = require('http').Server(app);
const io = require('socket.io')(server);

// Указываем, где будут лежать наши картинки и скрипты
app.use(express.static('public'));

app.get('/', (req, res) => {
    res.sendFile(__dirname + '/public/index.html');
});

io.on('connection', (socket) => {
    console.log('Кто-то вошел в Бурмалдскорд!');
    
    socket.on('chat message', (msg) => {
        io.emit('chat message', msg); // Рассылаем сообщение всем
    });
});

server.listen(3000, () => {
    console.log('Бурмалдскорд запущен на порту 3000');
});