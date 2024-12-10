const twilio = require("twilio");
const client = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

class TwilioService {
  static async getOrCreateRoom(roomName) {
    try {
      // Try to fetch existing room
      let room = await client.video.rooms(roomName).fetch();
      return room;
    } catch (error) {
      if (error.code === 20404) {
        // Room doesn't exist, create it
        room = await client.video.rooms.create({
          uniqueName: roomName,
          type: "group",
          maxParticipants: 6,
        });
        return room;
      }
      throw error;
    }
  }

  static async getRoomParticipants(roomName) {
    try {
      const participants = await client.video
        .rooms(roomName)
        .participants.list();
      return participants.length;
    } catch (error) {
      console.error("Error getting room participants:", error);
      return 0;
    }
  }

  static async listActiveRooms() {
    try {
      const rooms = await client.video.rooms.list({
        status: "in-progress",
      });
      return rooms;
    } catch (error) {
      console.error("Error listing rooms:", error);
      return [];
    }
  }

  static async generateToken(identity, roomName) {
    const token = new twilio.jwt.AccessToken(
      process.env.TWILIO_ACCOUNT_SID,
      process.env.TWILIO_API_KEY,
      process.env.TWILIO_API_SECRET,
      { identity }
    );

    const videoGrant = new twilio.jwt.AccessToken.VideoGrant({
      room: roomName,
    });
    token.addGrant(videoGrant);

    return token.toJwt();
  }
}

module.exports = TwilioService;
