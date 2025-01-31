// controllers/WhatsAppController.js
import WhatsAppModel from '../models/WhatsAppModel.js';

const sendWhatsAppMessage = async (req, res) => {
    const { to, message } = req.body;

    try {
        const response = await WhatsAppModel.sendWhatsAppMessage(to, message);
        res.json({ message: 'Message sent successfully', response });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

export default {
    sendWhatsAppMessage
};