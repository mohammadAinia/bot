
let availableSlots = [
    { id: 1, date: '2025-01-23', time: '09:00 AM', isAvailable: true },
    { id: 2, date: '2025-01-23', time: '11:00 AM', isAvailable: true },
    { id: 3, date: '2025-01-24', time: '02:00 PM', isAvailable: true },
    { id: 4, date: '2025-01-25', time: '10:00 AM', isAvailable: true },
];

// الحصول على المواعيد المتاحة
const getAvailableSlots = () => {
    return availableSlots.filter(slot => slot.isAvailable);
};

// حجز موعد
const bookAppointment = (id) => {
    const slotIndex = availableSlots.findIndex(slot => slot.id === id && slot.isAvailable);

    if (slotIndex === -1) {
        return null; // الموعد غير متاح
    }

    availableSlots[slotIndex].isAvailable = false;
    return availableSlots[slotIndex];
};

export default {
    getAvailableSlots,
    bookAppointment,
};