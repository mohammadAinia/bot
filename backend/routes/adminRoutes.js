import express from 'express';
import { getMessages, updateMessages, updateWelcomeMessage } from '../controllers/adminController.js';
import { authenticateToken } from '../services/authService.js';


const router = express.Router();

router.get('/messages', authenticateToken, getMessages);
router.post('/update-messages', authenticateToken, updateMessages);
router.post('/update-welcome-message', authenticateToken, updateWelcomeMessage);

export default router;