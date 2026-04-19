const express = require('express');
const { protect } = require('../middleware/auth');
const { aiChat, summarizeChat, analyzeSentiment, getSuggestions, translateMessage } = require('../controllers/aiController');

const router = express.Router();

router.use(protect);

router.post('/chat', aiChat);
router.post('/summarize', summarizeChat);
router.post('/sentiment', analyzeSentiment);
router.post('/suggestions', getSuggestions);
router.post('/translate', translateMessage);

module.exports = router;
