const { io } = require("../server");
const Room = require("../models/Room");
const TwilioService = require("../services/twilioService");

exports.handleRoomEvent = async (req, res) => {
  try {
    const { RoomName, StatusCallbackEvent, ParticipantIdentity } = req.body;

    // Parse room info from RoomName (e.g., "english-1")
    const [language, roomNumber] = RoomName.split("-");

    // Get current participant count
    const participantCount = await TwilioService.getRoomParticipants(RoomName);

    switch (StatusCallbackEvent) {
      case "participant-connected":
        io.emit("participant-joined", {
          language,
          roomNumber: parseInt(roomNumber),
          participantCount,
        });
        break;

      case "participant-disconnected":
        io.emit("participant-left", {
          language,
          roomNumber: parseInt(roomNumber),
          participantCount,
        });
        break;

      case "room-ended":
        const room = await Room.findOne({
          language: language.toLowerCase(),
          roomNumber: parseInt(roomNumber),
        });
        if (room) {
          room.isActive = false;
          await room.save();
        }
        break;
    }

    // Update all clients with latest room status
    const updatedRooms = await getFormattedRooms();
    io.emit("room-update", updatedRooms);

    res.status(200).send("Event processed");
  } catch (error) {
    console.error("Webhook error:", error);
    res.status(500).send("Error processing webhook");
  }
};

async function getFormattedRooms() {
  const activeRooms = await TwilioService.listActiveRooms();
  const formattedRooms = [];

  for (const twilioRoom of activeRooms) {
    const [language, roomNumber] = twilioRoom.uniqueName.split("-");
    const participantCount = await TwilioService.getRoomParticipants(
      twilioRoom.uniqueName
    );

    formattedRooms.push({
      language: language.charAt(0).toUpperCase() + language.slice(1),
      roomNumber: parseInt(roomNumber),
      participants: participantCount,
    });
  }

  return formattedRooms;
}
