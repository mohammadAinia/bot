// models/WhatsAppModel.js
import axios from 'axios';

const sendWhatsAppMessage = async (to, message) => {
    const apiUrl = process.env.WHATSAPP_API_URL;
    const accessToken = process.env.WHATSAPP_ACCESS_TOKEN;

    try {
        const data = {
            messaging_product: 'whatsapp',
            recipient_type: 'individual',
            to: to,
            type: 'text',
            text: {
                body: message,
            },
        };

        const response = await axios.post(apiUrl, data, {
            headers: {
                Authorization: `Bearer ${accessToken}`,
                'Content-Type': 'application/json',
            },
        });

        return response.data;
    } catch (error) {
        throw new Error(error.response?.data || error.message);
    }
};


export default {
    sendWhatsAppMessage,
};