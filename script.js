const socket = io();
let currentRoom = null;

const sendBtn = document.getElementById('sendBtn');
const joinRoomBtn = document.getElementById('joinRoomBtn');
const roomInput = document.getElementById('roomInput');
const messageInput = document.getElementById('messageInput');
const chatBox = document.querySelector('.chat-box');
const userCount = document.getElementById('userCount');

// For media upload
const uploadBtn = document.getElementById('uploadBtn');
const fileInput = document.getElementById('fileInput');

// === Join Room ===
joinRoomBtn.addEventListener('click', () => {
  const room = roomInput.value.trim();
  if (room) {
    socket.emit('joinRoom', room);
    currentRoom = room;
    chatBox.innerHTML = ''; // Clear chat
    appendSystemMessage(`Joined chat room: ${room}`);
  }
});

// === Send Text Message ===
sendBtn.addEventListener('click', () => {
  const msg = messageInput.value.trim();
  if (msg && currentRoom) {
    socket.emit('chatMessage', { room: currentRoom, message: msg });
    messageInput.value = '';
  }
});

// === Upload and Send Media File ===
uploadBtn.addEventListener('click', () => {
  const file = fileInput.files[0];
  if (!file || !currentRoom) return;

  const formData = new FormData();
  formData.append('media', file);

  fetch('/upload', {
    method: 'POST',
    body: formData
  })
    .then(res => res.json())
    .then(data => {
      const fileUrl = data.url; // e.g., /uploads/abc123.jpg
      socket.emit('chatMessage', { room: currentRoom, message: fileUrl });
      fileInput.value = ''; // Reset file input
    })
    .catch(err => {
      console.error('Upload failed:', err);
    });
});

// === Receive Chat Message (text or media) ===
socket.on('chatMessage', (msg) => {
  const msgDiv = document.createElement('div');
  msgDiv.classList.add('message');

  if (isImageURL(msg)) {
    const img = document.createElement('img');
    img.src = msg;
    img.alt = "Image";
    msgDiv.appendChild(img);
  } else if (isVideoURL(msg)) {
    const video = document.createElement('video');
    video.src = msg;
    video.controls = true;
    msgDiv.appendChild(video);
  } else if (isAudioURL(msg)) {
    const audio = document.createElement('audio');
    audio.src = msg;
    audio.controls = true;
    msgDiv.appendChild(audio);
  } else {
    msgDiv.textContent = msg; // plain text
  }

  chatBox.appendChild(msgDiv);
  chatBox.scrollTop = chatBox.scrollHeight;
});

// === Update Online User Count ===
socket.on('onlineUsers', (count) => {
  userCount.textContent = count;
});

// === System Message ===
function appendSystemMessage(text) {
  const div = document.createElement('div');
  div.classList.add('message');
  div.style.fontStyle = 'italic';
  div.style.color = 'yellow';
  div.textContent = `🔔 ${text}`;
  chatBox.appendChild(div);
}

// === Helpers for file type detection ===
function isImageURL(url) {
  return /\.(jpg|jpeg|png|gif|webp)$/i.test(url);
}

function isVideoURL(url) {
  return /\.(mp4|webm|ogg)$/i.test(url);
}

function isAudioURL(url) {
  return /\.(mp3|wav|m4a|ogg)$/i.test(url);
}