// === Client-side chat logic ===
const socket = io();

// Ask for username
let username = prompt("Enter your username:") || "Anonymous";
socket.emit("user joined", username);

// --- DOM Elements ---
const messagesEl = document.getElementById("messages");
const usersListEl = document.getElementById("users-list");
const form = document.getElementById("message-form");
const input = document.getElementById("message-input");
const backButton = document.getElementById("back-button");
const userSearchInput = document.getElementById("user-search");

// --- Chat State ---
let privateReceiver = null; // null = public chat
let selectedUserEl = null;

// === Utility Functions ===

// Add message to chat
function addMessage(sender, text, type = "public") {
  const div = document.createElement("div");
  div.classList.add("message");
  if (type === "system") div.classList.add("system");
  if (type === "private") div.classList.add("private");

  div.innerHTML =
    type === "system"
      ? `<em>${text}</em>`
      : `<strong>${sender}:</strong> ${text}`;

  messagesEl.appendChild(div);
  messagesEl.scrollTop = messagesEl.scrollHeight;
}

// Load private chat history from API
async function loadPrivateMessages(user1, user2) {
  try {
    const res = await fetch(`/api/messages/${user1}/${user2}`);
    const data = await res.json();
    messagesEl.innerHTML = "";
    data.forEach((msg) => {
      addMessage(
        msg.sender,
        msg.text,
        msg.receiver ? "private" : "public"
      );
    });
  } catch (err) {
    console.error("Failed to load private messages:", err);
  }
}

// === Event Listeners ===

// Send message form
form.addEventListener("submit", (e) => {
  e.preventDefault();
  const text = input.value.trim();
  if (!text) return;

  if (privateReceiver) {
    socket.emit("private message", {
      sender: username,
      receiver: privateReceiver,
      text,
    });
  } else {
    socket.emit("chat message", {
      sender: username,
      receiver: null,
      text,
    });
  }

  input.value = "";
});

// Back to public chat
backButton.addEventListener("click", () => {
  privateReceiver = null;
  backButton.style.display = "none";
  messagesEl.innerHTML = "";
  addMessage("System", "You are now in the public chat", "system");
});

// Search users (client-side filter)
userSearchInput.addEventListener("input", () => {
  const term = userSearchInput.value.toLowerCase();
  const items = usersListEl.querySelectorAll(".user-item");
  items.forEach((li) => {
    const name = li.dataset.username.toLowerCase();
    li.style.display = name.includes(term) ? "" : "none";
  });
});

// === Socket.IO Events ===

// Receive all online users
socket.on("users list", (users) => {
  usersListEl.innerHTML = "";
  users.forEach((user) => {
    if (user.username === username) return; // skip yourself

    const li = document.createElement("li");
    li.classList.add("user-item");
    li.dataset.username = user.username;

    li.innerHTML = `
      <span>${user.username}</span>
      <span class="${user.online ? "online" : "offline"}">
        ${user.online ? "●" : "○"}
      </span>
    `;

    // Click user → private chat
    li.addEventListener("click", async () => {
      privateReceiver = user.username;
      backButton.style.display = "block";

      if (selectedUserEl) selectedUserEl.classList.remove("selected");
      li.classList.add("selected");
      selectedUserEl = li;

      messagesEl.innerHTML = "";
      addMessage("System", `Private chat with ${privateReceiver}`, "system");

      await loadPrivateMessages(username, privateReceiver);
    });

    usersListEl.appendChild(li);
  });
});

// Public messages
socket.on("chat message", (msg) => {
  addMessage(msg.sender, msg.text);
});

// Private messages
socket.on("private message", (msg) => {
  // Only show if relevant
  if (
    msg.sender === privateReceiver ||
    (msg.receiver === privateReceiver && msg.sender === username)
  ) {
    addMessage(msg.sender, msg.text, "private");
  } else {
    // Optional: show notification or highlight
    console.log(`New private message from ${msg.sender}`);
  }
});