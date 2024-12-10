const express = require("express");
const router = express.Router();
const upload = require("../middleware/multer");
const authController = require("../controllers/auth");
const homeController = require("../controllers/home");
const postsController = require("../controllers/posts");
const roomsController = require("../controllers/rooms");

const { ensureAuth, ensureGuest } = require("../middleware/auth");

//Main Routes - simplified for now
router.get("/", homeController.getIndex);
router.put("/updateAvatar", upload.single("file"), homeController.updateAvatar);
router.put("/updateLanguage", homeController.updateLanguage);

router.get("/decks/:language", homeController.getDecks);
router.get("/decks/:language/:deckName", homeController.getCards);
router.post('/decks/:language/:deckName/learned', ensureAuth, homeController.saveLearnedCard);
router.delete('/decks/:language/:deckName/deleteCard', ensureAuth, homeController.deleteCard);

router.get("/login", authController.getLogin);
router.post("/login", authController.postLogin);
router.get("/logout", authController.logout);
router.get("/signup", authController.getSignup);
router.post("/signup", authController.postSignup);

router.get("/dashboard", ensureAuth, roomsController.getDashboard);
router.get("/feed/:feedLanguage", ensureAuth, postsController.getFeed);

module.exports = router;
