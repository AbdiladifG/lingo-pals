const mongoose = require("mongoose");

const roomSchema = new mongoose.Schema({
  language: {
    type: String,
    required: true,
    enum: ["arabic", "spanish", "french", "mandarin"],
  },
  roomNumber: {
    type: Number,
    required: true,
  },
  twilioSID: {
    type: String,
    unique: true,
    sparse: true,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const Room = mongoose.model("Room", roomSchema);
module.exports = Room;
