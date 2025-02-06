export const formatPhoneNumber = (phoneNumber) => {
    let cleanedNumber = phoneNumber.replace(/\D/g, "");
    if (!cleanedNumber.startsWith("+")) {
        cleanedNumber = `+${cleanedNumber}`;
    }
    const match = cleanedNumber.match(/^\+(\d{1,4})(\d+)$/);
    if (match) {
        return `+${match[1]} ${match[2]}`;
    }
    return cleanedNumber;
};

export const convertArabicNumbers = (input) => {
    return input.replace(/[٠١٢٣٤٥٦٧٨٩]/g, d => "0123456789"["٠١٢٣٤٥٦٧٨٩".indexOf(d)]);
};