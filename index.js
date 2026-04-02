const socket = io();
let myPeer, myStream, currentCall, myNick;

// Элементы интерфейса для быстрого доступа
const ringtone = document.getElementById('ring');
const callOverlay = document.getElementById('call-overlay');
const hangupBtn = document.getElementById('hangup-ui');

/**
 * ЗАПУСК СИСТЕМЫ
 * Срабатывает при нажатии на "ВОРВАТЬСЯ"
 */
function start() {
    myNick = document.getElementById('nick').value.trim();
    if(!myNick) return alert("Без позывного не пустим!");

    document.getElementById('auth-overlay').style.display = 'none';
    document.getElementById('app').style.display = 'flex';

    // Инициализация PeerJS с твоими путями
    myPeer = new Peer(undefined, {
        host: location.hostname,
        port: location.port || (location.protocol === 'https:' ? 443 : 80),
        path: '/peerjs',
        secure: location.protocol === 'https:'
    });

    // Когда получили свой ID от сервера
    myPeer.on('open', id => {
        console.log('Твой ID для кабанов:', id);
        socket.emit('register-user', { peerId: id, name: myNick });
    });

    // Обработка входящего звонка
    myPeer.on('call', c => {
        currentCall = c;
        callOverlay.style.display = 'flex';
        // Меллстрой начинает трястись, музыка орет
        ringtone.play().catch(() => console.log("Нужно нажать на экран для звука"));
    });

    myPeer.on('error', err => console.error('Ошибка связи:', err));
}

/**
 * ПРИНЯТЬ ЗВОНОК (Зеленая кнопка)
 */
async function accept() {
    try {
        // Берем только аудио
        myStream = await navigator.mediaDevices.getUserMedia({ audio: true });
        currentCall.answer(myStream);
        
        // Настраиваем прием звука от кента
        handleStream(currentCall);
        
        stopRingtone();
        hangupBtn.style.display = 'block'; // Показываем кнопку "Положить трубку"
    } catch (e) {
        alert("Микрофон не пашет, проверь HTTPS или настройки браузера!");
    }
}

/**
 * СБРОСИТЬ ВХОДЯЩИЙ (Красный крест на Меллстрое)
 */
function reject() {
    if(currentCall) currentCall.close();
    stopRingtone();
}

/**
 * ЗАВЕРШИТЬ ТЕКУЩИЙ БАЗАР (Кнопка в сайдбаре)
 */
function hangup() {
    if(currentCall) currentCall.close();
    if(myStream) {
        myStream.getTracks().forEach(track => track.stop()); // Выключаем микрофон полностью
    }
    hangupBtn.style.display = 'none';
    alert("Базар окончен.");
}

/**
 * ОСТАНОВКА РИНГТОНА И СКРЫТИЕ МЕЛЛСТРОЯ
 */
function stopRingtone() {
    callOverlay.style.display = 'none';
    ringtone.pause();
    ringtone.currentTime = 0;
}

/**
 * НАБРАТЬ КЕНТА (Клик по имени в списке)
 */
async function callUser(peerId) {
    try {
        myStream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const c = myPeer.call(peerId, myStream);
        currentCall = c;
        
        handleStream(c);
        hangupBtn.style.display = 'block';
    } catch (e) {
        alert("Без микрофона звонить нельзя!");
    }
}

/**
 * ОБРАБОТКА ПОТОКА ДАННЫХ
 */
function handleStream(call) {
    call.on('stream', remoteStream => {
        const audio = new Audio();
        audio.srcObject = remoteStream;
        audio.play();
    });
    
    // Если кент нажал "Сброс"
    call.on('close', () => {
        hangupBtn.style.display = 'none';
    });
}

/**
 * ЧАТ И СПИСОК ЮЗЕРОВ
 */
function send() {
    const m = document.getElementById('msg').value;
    if(m) {
        socket.emit('chat message', { name: myNick, text: m });
        document.getElementById('msg').value = '';
    }
}

socket.on('chat message', m => {
    const d = document.createElement('div');
    d.innerHTML = `<b style="color:#00ff41">${m.name}:</b> ${m.text}`;
    const chat = document.getElementById('chat');
    chat.appendChild(d);
    chat.scrollTop = chat.scrollHeight;
});

socket.on('update-user-list', users => {
    const list = document.getElementById('user-list');
    list.innerHTML = '';
    users.forEach(u => {
        if(myPeer && u.id !== myPeer.id) {
            const div = document.createElement('div');
            div.className = 'user-node';
            div.innerHTML = `● ${u.name}`;
            div.onclick = () => callUser(u.id);
            list.appendChild(div);
        }
    });
});