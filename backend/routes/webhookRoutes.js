import express from 'express';
import { handleWebhook } from './controllers/webhookController.js';

const router = express.Router();

router.get('/webhook', (req, res) => {
    const mode = req.query["hub.mode"];
    const token = req.query["hub.verify_token"];
    const challenge = req.query["hub.challenge"];

    if (mode && token === "Mohammad") {
        console.log("✅ Webhook verified successfully.");
        res.status(200).send(challenge);
    } else {
        res.sendStatus(403);
    }
});

router.post('/webhook', handleWebhook);

export default router;
