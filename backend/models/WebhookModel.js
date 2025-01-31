// models/WebhookModel.js
import axios from 'axios';
import  AppointmentModel from './AppointmentModel.js';

// معالجة الرسالة الواردة من الويب هوك
const processWebhookMessage = async (req, res) => {
    const incomingMessage = req.body;
    const customerPhoneNumber = incomingMessage.entry[0].changes[0].value.messages[0].from;
    const customerMessage = incomingMessage.entry[0].changes[0].value.messages[0].text.body;

    console.log(`Received message from: ${customerPhoneNumber}`);
    console.log(`Message content: ${customerMessage}`);

    // تحقق من وجود جلسة لهذا المستخدم
    if (!req.session[customerPhoneNumber]) {
        req.session[customerPhoneNumber] = {
            context: {}, // يمكن استخدام هذا لتخزين حالة المحادثة
            history: [] // لتخزين رسائل المستخدم السابقة
        };
    }

    const userSession = req.session[customerPhoneNumber];
    userSession.history.push({ message: customerMessage, timestamp: new Date() });

    try {
        const openaiResponse = await axios.post('http://localhost:3000/generate-response', {
            prompt: customerMessage,
        });

        let generatedResponse = openaiResponse.data.reply;

        // إذا كانت الرسالة تشير إلى اختيار الموعد
        if (userSession.context.waitingForSlotSelection) {
            const selectedSlotId = parseInt(customerMessage);
            const slotIndex = AppointmentModel.getAvailableSlots().findIndex(slot => slot.id === selectedSlotId && slot.isAvailable);

            if (slotIndex !== -1) {
                AppointmentModel.bookAppointment(selectedSlotId);
                userSession.context.waitingForSlotSelection = false;
                await axios.post('http://localhost:3000/send-whatsapp', {
                    to: customerPhoneNumber,
                    message: `Your appointment has been successfully booked for ${AppointmentModel.getAvailableSlots()[slotIndex].date} at ${AppointmentModel.getAvailableSlots()[slotIndex].time}.`
                });
            } else {
                await axios.post('http://localhost:3000/send-whatsapp', {
                    to: customerPhoneNumber,
                    message: 'Invalid slot selected. Please try again.'
                });
            }
        } else {
            // إذا كانت الرسالة تحتوي على طلب لحجز موعد
            if (generatedResponse.includes("book")) {
                const availableTimes = AppointmentModel.getAvailableSlots();

                if (availableTimes.length > 0) {
                    generatedResponse = `Here are the available slots for booking:\n${availableTimes.map(slot => `Appointment #${slot.id}: Date: ${slot.date}, Time: ${slot.time}`).join('\n')}\nPlease select a slot by its number.`;
                    userSession.context.waitingForSlotSelection = true; // قم بتغيير الحالة
                } else {
                    generatedResponse = "Sorry, no slots are available at the moment.";
                }
            }

            // إرسال الرد عبر WhatsApp
            await axios.post('http://localhost:3000/send-whatsapp', {
                to: customerPhoneNumber,
                message: generatedResponse,
            });
        }

        res.status(200).send('Message processed successfully');
    } catch (error) {
        console.error('Error processing webhook message:', error.message);
        res.status(500).json({ error: error.message });
    }
};

export default {
    processWebhookMessage
};