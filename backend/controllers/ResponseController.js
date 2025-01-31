// controllers/ResponseController.js
import AppointmentModel from '../models/AppointmentModel.js';
import ResponseModel from '../models/ResponseModel.js';

let currentState = {};

const generateResponse = async (req, res) => {
    const { prompt } = req.body;

    try {
        let generatedResponse = await ResponseModel.generateResponse(prompt);

        // إذا كان الرد يتعلق بالحجز، نعرض المواعيد المتاحة.
        if (generatedResponse.includes("book")) {
            const availableTimes = AppointmentModel.getAvailableSlots();

            if (availableTimes.length > 0) {
                generatedResponse = `Here are the available slots for booking:\n${availableTimes.map(slot => `Appointment #${slot.id}: Date: ${slot.date}, Time: ${slot.time}`).join('\n')}\nPlease select a slot by its number.`;
            } else {
                generatedResponse = "Sorry, no slots are available at the moment.";
            }
        }

        // التحقق إذا كان المستخدم قد اختار موعدًا.
        if (generatedResponse.includes("Please select a slot")) {
            currentState = {
                ...currentState,
                waitingForSlotSelection: true,
            };
        }

        res.json({ reply: generatedResponse });
    } catch (error) {
        console.error('Error details:', error.message);
        res.status(500).json({ error: error.message });
    }
};

export default {
    generateResponse,
};