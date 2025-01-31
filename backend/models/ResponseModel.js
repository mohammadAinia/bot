// models/ResponseModel.js
import axios from 'axios';
import dotenv from'dotenv';
dotenv.config();

const apiKey = process.env.OPENAI_API_KEY;

// معلومات الشركة
const companyInfo = `
    Welcome! 👋 We are Mohamed Software Company, how can we assist you today?

    Please choose the service you need:
    1️⃣ General Inquiry  
    2️⃣ Technical Support  
    3️⃣ Appointment Booking  

    🔹 **Our services include:**  
    - Innovative software solutions.  
    - Custom systems tailored to client needs.  
    - Our working hours are from Sunday to Thursday, from 9 AM to 5 PM.  
    - Appointments can be booked via our website or by calling 📞 123456789.  

    ❗ **Please note:** Only answer questions related to the company. Unrelated questions will not be answered.
`;

// الرابط الثابت لموقع الشركة على خريطة جوجل
const companyLocation = "https://www.google.com/maps?q=33.5150,36.2910";

// إنشاء رد باستخدام OpenAI
const generateResponse = async (prompt) => {
    const customizedPrompt = `${companyInfo}\n\nQuestion: ${prompt}\nAnswer:`;

    try {
        const response = await axios.post(
            'https://api.openai.com/v1/chat/completions',
            {
                model: 'gpt-4',
                messages: [
                    { role: 'system', content: companyInfo },
                    { role: 'user', content: prompt },
                ],
                max_tokens: 150,
            },
            {
                headers: {
                    'Authorization': `Bearer ${apiKey}`,
                },
            }
        );

        let generatedResponse = response.data.choices[0].message.content.trim();

        // التحقق من طلب الموقع وإضافة الرابط إلى جوجل ماب
        if (generatedResponse.toLowerCase().includes("location") || generatedResponse.toLowerCase().includes("where is your company")) {
            generatedResponse += `\n📍 You can find us on Google Maps: ${companyLocation}`;
        }

        return generatedResponse;
    } catch (error) {
        throw new Error(error.response?.data || error.message);
    }
};

export default {
    generateResponse,
};