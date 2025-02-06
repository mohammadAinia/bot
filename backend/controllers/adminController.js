import { getSystemMessages, updateSystemMessages, updateWelcomeMessage as updateWelcomeMsgFromModel } from '../models/messageModel.js';

export const getMessages = (req, res) => {
    const messages = getSystemMessages();
    res.json(messages);
};

export const updateMessages = (req, res) => {
    const { newSystemMessage, newGuidance } = req.body;
    updateSystemMessages(newSystemMessage, newGuidance);
    res.json({ message: 'Messages updated successfully.' });
};

export const updateWelcomeMessage = (req, res) => {  // ✅ Now it's safe
    const { newWelcomeMessage } = req.body;
    updateWelcomeMsgFromModel(newWelcomeMessage); // ✅ Calls the correct function
    res.json({ message: 'Welcome message updated successfully.' });
};