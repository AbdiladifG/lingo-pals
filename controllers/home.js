const cloudinary = require("../middleware/cloudinary");
const User = require("../models/User");
module.exports = {
  getIndex: (req, res) => {
    res.render("index.ejs");
  },
  getFlashcards: (req, res) => {
    let language = req.params.language
    res.render(`${language}-flashcard.ejs`, { learnedCards: req.user.learnedCards, language: language });
  },
  saveCard: async (req, res) => {
    const userId = req.user.id; // Assume user is logged in
    const { cardId } = req.body;
    const language = req.params.language
    const user = await User.findById(userId);
    if (!user.learnedCards) {
      user.learnedCards = new Map();
    }

    // Get the array for this language, or initialize it if it doesn't exist
    let languageCards = user.learnedCards.get(language) || [];

    // Add the new card
    languageCards.push(cardId);

    // Set the updated array back to the Map
    user.learnedCards.set(language, languageCards);

    await user.save();
    console.log(user.learnedCards)
    res.json({ success: true });
  },
  getDecks: async (req, res) => {
    try {
      const { language } = req.params;
      const collection = req.db.collection(language);
      const decks = await collection.find({}).toArray();

      res.render('decks', {
        language,
        decks,
        user: req.user
      });
    } catch (err) {
      console.error(err);
      res.redirect('/dashboard');
    }
  },
  getCards: async (req, res) => {
    try {
      const { language, deckName } = req.params;
      const collection = req.db.collection(language);
      const deck = await collection.findOne({ [deckName]: { $exists: true } });

      if (!deck) {
        return res.redirect(`/decks/${language}`);
      }

      res.render('cards', {
        language,
        deckName,
        cards: deck[deckName],
        user: req.user
      });
    } catch (err) {
      console.error(err);
      res.redirect(`/decks/${language}`);
    }
  },
  saveLearnedCard: async (req, res) => {
    try {
        const userId = req.user.id;
        const { language, deckName } = req.params;
        const { cardId } = req.body;

        const user = await User.findById(userId);

        // Initialize the learnedCards Map if it doesn't exist
        if (!user.learnedCards) {
            user.learnedCards = new Map();
        }

        // Get or create the array for this deck
        const deckKey = `${language}-${deckName}`;
        let learnedCardIds = user.learnedCards.get(deckKey) || [];

        // Add the card ID if it's not already there
        const cardIdNum = parseInt(cardId);
        if (!learnedCardIds.includes(cardIdNum)) {
            learnedCardIds.push(cardIdNum);
            user.learnedCards.set(deckKey, learnedCardIds);
            await user.save();
        }

        res.redirect(`/decks/${language}/${deckName}`);
    } catch (err) {
        console.error('Error saving learned card:', err);
        res.redirect(`/decks/${req.params.language}/${req.params.deckName}`);
    }
},
deleteCard: async (req, res) => {
  try {
      const userId = req.user.id;
      const { language, deckName } = req.params;
      const { cardId } = req.body;

      const user = await User.findById(userId);
      
      // Check if learnedCards exists
      if (!user.learnedCards) {
          return res.redirect(`/decks/${language}/${deckName}`);
      }

      // Get the deck key and array
      const deckKey = `${language}-${deckName}`;
      let learnedCardIds = user.learnedCards.get(deckKey);

      // Check if this deck exists in learnedCards
      if (!learnedCardIds) {
          return res.redirect(`/decks/${language}/${deckName}`);
      }

      // Filter out the specific cardId
      const cardIdNum = parseInt(cardId);
      learnedCardIds = learnedCardIds.filter(id => id !== cardIdNum);

      // Update the array in the map
      user.learnedCards.set(deckKey, learnedCardIds);
      await user.save();

      res.redirect(`/decks/${language}/${deckName}`);
  } catch (err) {
      console.error('Error deleting learned card:', err);
      res.redirect(`/decks/${req.params.language}/${req.params.deckName}`);
  }
},
  updateAvatar: async (req, res) => {
    try {
      const result = await cloudinary.uploader.upload(req.file.path);
      await User.findOneAndUpdate(
        { userName: req.user.userName },
        {
          $set: { avatar: result.secure_url },
        }
      );
      res.redirect(`/dashboard`);
    } catch (err) {
      console.log(err);
    }
  },
  updateLanguage: async (req, res) => {
    try {
      await User.findOneAndUpdate(
        { userName: req.user.userName },
        {
          $set: { selectedLanguage: req.body.selectedLanguage },
        }
      );
      res.redirect(`/dashboard`);
    } catch (err) {
      console.log(err);
    }
  },
};
