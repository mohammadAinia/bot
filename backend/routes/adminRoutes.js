import express from 'express';
import { login, getAllMessages, updateMessages, updateAdminWelcomeMessage } from '../controllers/adminController.js';
import authenticateToken from '../middlewares/authMiddleware.js';

const router = express.Router();

router.post('/login', login);
router.get('/messages', authenticateToken, getAllMessages); // Use getAllMessages instead of getMessages
router.post('/update-messages', authenticateToken, updateMessages);
router.post('/update-welcome-message', authenticateToken, updateAdminWelcomeMessage); // Use updateAdminWelcomeMessage instead of updateWelcomeMessage

export default router;