// controllers/WebhookController.js
import WebhookModel from '../models/WebhookModel.js';

const processWebhook = async (req, res) => {
    try {
        await WebhookModel.processWebhookMessage(req, res);
    } catch (error) {
        console.error('Error in WebhookController:', error.message);
        res.status(500).json({ error: error.message });
    }
};

export default {
    processWebhook,
};