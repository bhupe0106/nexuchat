const express = require('express');
const { protect } = require('../middleware/auth');
const {
  searchUsers,
  getAllUsers,
  getUserById,
  toggleStarMessage,
  getStarredMessages,
  toggleBlockUser,
} = require('../controllers/userController');

const router = express.Router();

router.use(protect);

router.get('/', getAllUsers);
router.get('/search', searchUsers);
router.get('/starred', getStarredMessages);
router.get('/:id', getUserById);
router.post('/star/:messageId', toggleStarMessage);
router.post('/block/:userId', toggleBlockUser);

module.exports = router;
