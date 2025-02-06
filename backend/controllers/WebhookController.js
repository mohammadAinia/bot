import { handleIncomingMessage } from '../services/whatsappService.js';

export const handleWebhook = async (req, res) => {
    try {
        await handleIncomingMessage(req.body,res);
        // res.sendStatus(200);
    } catch (error) {
        console.error('❌ Error:', error);
        res.sendStatus(500);
    }
};

export const verifyWebhook = (req, res) => {
    const mode = req.query['hub.mode'];
    const token = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];

    if (mode && token === "Mohammad") {
        console.log("✅ Webhook verified successfully.");
        res.status(200).send(challenge);
    } else {
        res.sendStatus(403);
    }
};