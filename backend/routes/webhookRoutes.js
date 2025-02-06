import express from 'express';
import { handleWebhook, verifyWebhook } from '../controllers/WebhookController.js';

const router = express.Router();

router.get('/', verifyWebhook);
router.post('/', handleWebhook);

export default router;