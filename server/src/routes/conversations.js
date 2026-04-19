const express = require('express');
const { protect } = require('../middleware/auth');
const { upload } = require('../config/cloudinary');
const {
  getOrCreateDM,
  getConversations,
  createGroup,
  addMember,
  removeMember,
  getPinnedMessages,
} = require('../controllers/conversationController');

const router = express.Router();

router.use(protect);

router.get('/', getConversations);
router.post('/dm', getOrCreateDM);
router.post('/group', upload.single('groupAvatar'), createGroup);
router.post('/:id/add-member', addMember);
router.delete('/:id/remove-member/:userId', removeMember);
router.get('/:id/pinned', getPinnedMessages);

module.exports = router;
