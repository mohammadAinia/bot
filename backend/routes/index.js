// routes/index.js
import express from 'express';
const router = express.Router();

import AppointmentController from '../controllers/AppointmentController.js';
import WhatsAppController from '../controllers/WhatsAppController.js';
import ResponseController from '../controllers/ResponseController.js';
import WebhookController from '../controllers/WebhookController.js';



router.get('/', (req, res) => {
    res.send("BackEnd is running");
});

// Routes for appointments
router.post('/book-appointment', AppointmentController.bookAppointment);
router.get('/available-appointments', AppointmentController.getAvailableAppointments);

// Routes for WhatsApp
router.post('/send-whatsapp', WhatsAppController.sendWhatsAppMessage);

// Route for generating responses
router.post('/generate-response', ResponseController.generateResponse);

// Route for webhook
router.post('/webhook', WebhookController.processWebhook);

export default router;