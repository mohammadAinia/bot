export const convertArabicNumbers = (input) => {
    return input.replace(/[٠١٢٣٤٥٦٧٨٩]/g, d => "0123456789"["٠١٢٣٤٥٦٧٨٩".indexOf(d)]);
};

export const isValidEmail = (email) => {
    const regex = /^\S+@\S+\.\S+$/;
    return regex.test(email);
};

export const isValidPhone = (phone) => {
    const regex = /^\+971(5\d{1}\s?\d{3}\s?\d{3}|\s?4\d{2}\s?\d{4})$/;
    return regex.test(phone);
};
