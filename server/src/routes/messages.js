const express = require('express');
const { protect } = require('../middleware/auth');
const { upload } = require('../config/cloudinary');
const {
  getMessages,
  sendMessage,
  deleteMessage,
  searchMessages,
  togglePinMessage,
  reactToMessage,
} = require('../controllers/messageController');

const router = express.Router();

router.use(protect);

router.get('/search', searchMessages);
router.get('/:conversationId', getMessages);
router.post('/', upload.single('file'), sendMessage);
router.delete('/:id', deleteMessage);
router.post('/:id/pin', togglePinMessage);
router.post('/:id/react', reactToMessage);

module.exports = router;
