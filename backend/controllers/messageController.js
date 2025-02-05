import { getOpenAIResponse } from '../models/openAI';
import { sendToWhatsApp } from '../models/whatsapp';

export const getMessages = (req, res) => {
    const { systemMessage, guidanceMessage, defaultWelcomeMessage } = req.body;
    res.json({ systemMessage, guidanceMessage, defaultWelcomeMessage });
};

export const updateMessages = (req, res) => {
    const { newSystemMessage, newGuidance } = req.body;

    // Update logic for system and guidance messages
    res.json({ message: 'Messages updated successfully.' });
};

export const sendMessage = async (req, res) => {
    const { to, message } = req.body;

    try {
        await sendToWhatsApp(to, message);
        res.json({ message: 'Message sent successfully.' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to send message' });
    }
};
