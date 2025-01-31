// controllers/AppointmentController.js
import AppointmentModel from '../models/AppointmentModel.js';

const bookAppointment = (req, res) => {
    const { id } = req.body;

    const bookedSlot = AppointmentModel.bookAppointment(id);

    if (!bookedSlot) {
        return res.status(400).json({ message: 'This appointment is unavailable.' });
    }

    res.json({ message: `Your appointment has been successfully booked: ${bookedSlot.date} at ${bookedSlot.time}.` });
};

const getAvailableAppointments = (req, res) => {
    const availableSlots = AppointmentModel.getAvailableSlots();
    res.json(availableSlots);
};

export default {
    bookAppointment,
    getAvailableAppointments
};
