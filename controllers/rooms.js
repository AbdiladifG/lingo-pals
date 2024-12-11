const Room = require("../models/Room");
const twilio = require("twilio");
const { io } = require("../server");

const client = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

module.exports = {
  getDashboard: async (req, res) => {
    try {
      const languages = ["Arabic", "Spanish", "French", "Mandarin"];
      const rooms = [];

      // Get all active Twilio rooms
      const twilioRooms = await client.video.v1.rooms.list({
        status: "in-progress",
      });

      // Process each language
      for (const language of languages) {
        // Get or create room in DB
        let room = await Room.findOne({
          language: language.toLowerCase(),
          isActive: true,
        });

        if (!room) {
          room = await Room.create({
            language: language.toLowerCase(),
            roomNumber: 1,
            isActive: true,
          });
        }

        // Get participant count from Twilio
        const roomName = `${room.language}-${room.roomNumber}`;
        const twilioRoom = twilioRooms.find((tr) => tr.uniqueName === roomName);

        const participantCount = twilioRoom
          ? await client.video.v1
              .rooms(roomName)
              .participants.list()
              .then((participants) => participants.length)
          : 0;

        rooms.push({
          language,
          roomNumber: room.roomNumber,
          participants: participantCount,
        });
      }

      res.render("dashboard", {
        user: req.user,
        rooms: rooms,
      });
    } catch (error) {
      console.error("Error in getDashboard:", error);
      res.status(500).send("Server error");
    }
  },

  joinRoom: async (req, res) => {
    try {
      const { language, roomNumber } = req.params;
      const roomName = `${language}-${roomNumber}`;

      if (!req.user.userName) {
        throw new Error("User identity not found");
      }

      // Check for existing Twilio room
      try {
        const room = await client.video.v1.rooms(roomName).fetch();
        const participants = await client.video.v1
          .rooms(roomName)
          .participants.list();

        if (participants.length >= 9) {
          const nextRoomNumber = parseInt(roomNumber) + 1;
          return res.redirect(`/room/${language}/${nextRoomNumber}`);
        }
      } catch (error) {
        // Room doesn't exist yet - that's okay
        console.log("Room will be created when first user joins");
      }

      // Ensure room exists in our DB
      let dbRoom = await Room.findOneAndUpdate(
        {
          language: language.toLowerCase(),
          roomNumber: parseInt(roomNumber),
        },
        {
          language: language.toLowerCase(),
          roomNumber: parseInt(roomNumber),
          isActive: true,
        },
        { upsert: true, new: true }
      );

      // Generate token for Twilio
      const token = await generateTwilioToken({
        identity: req.user.userName,
        roomName: roomName,
      });

      res.render("room", {
        language,
        roomNumber,
        token,
        user: req.user,
        roomName: roomName,
      });
    } catch (error) {
      console.error("Join room error:", error);
      const errorMessage =
        process.env.NODE_ENV === "development" ? error.message : "Server error";
      res.status(500).send(errorMessage);
    }
  },

  leaveRoom: async (req, res) => {
    try {
      // No need to handle room leaving logic here
      // Twilio webhooks will handle participant tracking
      res.redirect("/dashboard");
    } catch (error) {
      console.error("Leave room error:", error);
      res.status(500).send("Server error");
    }
  },
};

async function generateTwilioToken({ identity, roomName }) {
  if (!identity || !roomName) {
    throw new Error("Identity and room name are required for token generation");
  }

  const requiredVars = [
    "TWILIO_ACCOUNT_SID",
    "TWILIO_API_KEY",
    "TWILIO_API_SECRET",
  ];

  requiredVars.forEach((varName) => {
    if (!process.env[varName]) {
      throw new Error(`Missing required environment variable: ${varName}`);
    }
  });

  try {
    const token = new twilio.jwt.AccessToken(
      process.env.TWILIO_ACCOUNT_SID,
      process.env.TWILIO_API_KEY,
      process.env.TWILIO_API_SECRET,
      { identity: identity }
    );

    const videoGrant = new twilio.jwt.AccessToken.VideoGrant({
      room: roomName,
    });

    token.addGrant(videoGrant);
    return token.toJwt();
  } catch (error) {
    console.error("Token generation error:", error);
    throw new Error(`Failed to generate Twilio token: ${error.message}`);
  }
}
