import jwt from 'jsonwebtoken';
import { getMessages as fetchMessages, updateSystemMessage, updateGuidanceMessage, updateWelcomeMessage as modelUpdateWelcomeMessage } from '../models/messageModel.js';

const SECRET_KEY = process.env.SECRET_KEY || 'LoothTech12345';
const ADMIN_USERNAME = 'admin';
const ADMIN_PASSWORD = 'admin123';

const login = (req, res) => {
    const { username, password } = req.body;

    if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
        const token = jwt.sign({ username }, SECRET_KEY, { expiresIn: '1h' });
        return res.json({ token });
    }
    return res.status(401).json({ error: 'Invalid username or password' });
};

const getAllMessages = (req, res) => {
    res.json(fetchMessages());
};

const updateMessages = (req, res) => {
    const { newSystemMessage, newGuidance } = req.body;

    if (newSystemMessage) updateSystemMessage(newSystemMessage);
    if (newGuidance) updateGuidanceMessage(newGuidance);

    res.json({ message: 'Messages updated successfully.' });
};

const updateAdminWelcomeMessage = (req, res) => {
    const { newWelcomeMessage } = req.body;

    if (newWelcomeMessage && typeof newWelcomeMessage === 'string') {
        modelUpdateWelcomeMessage(newWelcomeMessage);
        res.json({ message: 'Welcome message updated successfully.' });
    } else {
        res.status(400).json({ error: 'Invalid welcome message provided.' });
    }
};

export { login, getAllMessages, updateMessages, updateAdminWelcomeMessage };