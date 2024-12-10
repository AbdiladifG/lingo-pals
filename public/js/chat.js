const Chat = {
  socket: null,
  roomName: null,
  userName: null,

  initialize(socket, roomName, userName, avatar) {
    this.socket = socket;
    this.roomName = roomName;
    this.userName = userName;
    this.avatar = avatar

    // Update initial participant count to at least 1 (yourself)
    this.updateParticipantCount(1);

    // Join the chat room
    this.socket.emit("join-room", this.roomName);

    // Set up event listeners
    this.setupEventListeners();

    // Send system message that user has joined
    this.addSystemMessage(`You joined the room`);
  },

  // Add a separate method for socket events
  setupEventListeners() {
    // Listen for chat messages
    this.socket.on("message", this.handleIncomingMessage.bind(this));

    // Listen for participant events
    this.socket.on(
      "participant-joined",
      this.handleParticipantJoined.bind(this)
    );
    this.socket.on("participant-left", this.handleParticipantLeft.bind(this));

    // Add direct participant count listener
    this.socket.on("participant-count", (count) => {
      this.updateParticipantCount(count);
    });
    // Set up send button
    document
      .querySelector(".send-btn")
      .addEventListener("click", this.sendMessage.bind(this));

    // Set up enter key press
    document.getElementById("chatInput").addEventListener("keypress", (e) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        this.sendMessage();
      }
    });
  },

  sendMessage() {
    const input = document.getElementById("chatInput");
    const message = input.value.trim();

    if (!message) return;

    // Emit message to server
    this.socket.emit("message", {
      room: this.roomName,
      text: message,
    });

    // Add message to chat immediately (local user's message)
    this.addMessage({
      sender: this.userName,
      avatar: this.avatar,
      text: message,
      isSelf: true,
      timestamp: new Date(),
    });

    // Clear input
    input.value = "";
  },

  handleIncomingMessage(data) {
    // Don't add the message again if it's from the current user
    if (data.sender !== this.userName) {
      this.addMessage({
        ...data,
        isSelf: false,
      });
    }
  },

  handleParticipantJoined(data) {
    this.addSystemMessage(`${data.userName} joined the room`);
    this.updateParticipantCount(data.participantCount);
  },

  handleParticipantLeft(data) {
    this.addSystemMessage(`${data.userName} left the room`);
    this.updateParticipantCount(data.participantCount);
  },

  addMessage(data) {
    const chatMessages = document.getElementById("chatMessages");
    const messageHTML = `
      <div class="message ${data.isSelf ? "own-message" : ""}">
        <img 
          src="${data.avatar}" 
          alt="${data.sender}" 
          class="message-avatar"
        >
        <div class="message-content">
          <div class="message-header">
            <span class="message-author">${
              data.isSelf ? "You" : data.sender
            }</span>
            <span class="message-time">
              ${new Date(data.timestamp).toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </span>
          </div>
          <p>${this.escapeHTML(data.text)}</p>
        </div>
      </div>
    `;

    chatMessages.insertAdjacentHTML("beforeend", messageHTML);
    this.scrollToBottom();
  },

  addSystemMessage(text) {
    const chatMessages = document.getElementById("chatMessages");
    const messageHTML = `
      <div class="message system-message">
        <div class="message-content">
          <p>${this.escapeHTML(text)}</p>
        </div>
      </div>
    `;

    chatMessages.insertAdjacentHTML("beforeend", messageHTML);
    this.scrollToBottom();
  },

  updateParticipantCount(count) {
    const countElement = document.getElementById("participantsCount");
    if (countElement) {
      countElement.textContent = `${count} participant${
        count !== 1 ? "s" : ""
      }`;
    }
  },

  scrollToBottom() {
    const chatMessages = document.getElementById("chatMessages");
    chatMessages.scrollTop = chatMessages.scrollHeight;
  },

  escapeHTML(str) {
    const div = document.createElement("div");
    div.textContent = str;
    return div.innerHTML;
  },
};

export default Chat;
