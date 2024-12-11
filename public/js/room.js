import VideoChat from "./videoChat.js";
import Chat from "./chat.js";

document.addEventListener("DOMContentLoaded", async () => {
  try {
    // Get room details from hidden inputs
    const token = document.getElementById("twilioToken").value;
    const roomName = document.getElementById("roomName").value;
    const userName = document.getElementById("userName").value;
    const avatar = document.getElementById("avatar").value;

    if (!token || !roomName || !userName) {
      throw new Error("Missing required room parameters");
    }

    // Initialize Socket.io
    const socket = io();

    // Initialize video chat
    await VideoChat.initialize(token, roomName);

    // Initialize chat with userName
    Chat.initialize(socket, roomName, userName, avatar);

    // Handle room leaving
    const handleLeaveRoom = async () => {
      try {
        // Clean up video chat
        await VideoChat.cleanup();

        // Emit leave room event
        socket.emit("leave-room", {
          roomName,
          userName,
        });

        // Redirect to dashboard
        window.location.href = "/dashboard";
      } catch (error) {
        console.error("Error leaving room:", error);
        // Force redirect if cleanup fails
        window.location.href = "/dashboard";
      }
    };

    // Set up leave room button handlers
    document.querySelectorAll(".leave-room-btn").forEach((btn) => {
      btn.addEventListener("click", async (e) => {
        e.preventDefault();
        await handleLeaveRoom();
      });
    });

    // Handle page unload
    window.addEventListener("beforeunload", async (e) => {
      try {
        await VideoChat.cleanup();
        socket.emit("leave-room", {
          roomName,
          userName,
        });
      } catch (error) {
        console.error("Error during cleanup:", error);
      }
    });

    // Handle socket disconnection
    socket.on("disconnect", async () => {
      try {
        await VideoChat.cleanup();
        alert("You have been disconnected. Returning to dashboard...");
        window.location.href = "/dashboard";
      } catch (error) {
        console.error("Error handling disconnect:", error);
        window.location.href = "/dashboard";
      }
    });
  } catch (error) {
    console.error("Error initializing room:", error);
    alert("Failed to join room. Returning to dashboard...");
    window.location.href = "/dashboard";
  }
});
