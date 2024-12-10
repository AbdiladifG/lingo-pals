const express = require("express");
const router = express.Router();
const roomController = require("../controllers/rooms");
const webhookController = require("../controllers/webhookController");
const { ensureAuth } = require("../middleware/auth");

router.get("/:language/:roomNumber", ensureAuth, roomController.joinRoom);
router.post("/webhook", webhookController.handleRoomEvent);

module.exports = router;
