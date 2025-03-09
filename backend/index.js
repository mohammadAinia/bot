import dotenv from 'dotenv';
import express from 'express';
import axios from 'axios';
import bodyParser from 'body-parser';
import cors from 'cors';
import fs from 'fs';
import { OpenAI } from 'openai';
import mime from 'mime-types';
import path from 'path';
import FormData from 'form-data';
//
dotenv.config();

if (!process.env.OPENAI_API_KEY || !process.env.WHATSAPP_API_URL || !process.env.WHATSAPP_ACCESS_TOKEN) {
    console.error('❌ Missing required environment variables');
    process.exit(1);
}

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

if (!fs.existsSync('./temp')) {
    fs.mkdirSync('./temp');
    console.log("✅ Created ./temp directory.");
} else {
    console.log("✅ ./temp directory already exists.");
}

const app = express();
const PORT = process.env.PORT || 51030;
const VERIFY_TOKEN = "5IG[@ZFuM754";

app.use(cors());
app.use(bodyParser.json());

app.get("/webhook", (req, res) => {
    if (req.query["hub.mode"] === "subscribe" && req.query["hub.verify_token"] === VERIFY_TOKEN) {
        console.log("Webhook verified successfully!");
        res.status(200).send(req.query["hub.challenge"]);
    } else {
        console.log("Webhook verification failed!");
        res.sendStatus(403);
    }
});

app.get('/', (req, res) => {
    res.send('Travel and Tourism Bot is running');
});

const userSessions = {};

const sendToWhatsApp = async (to, message) => {
    try {
        await axios.post(process.env.WHATSAPP_API_URL, {
            messaging_product: 'whatsapp',
            recipient_type: 'individual',
            to: to,
            type: 'text',
            text: { body: message }
        }, {
            headers: {
                'Authorization': `Bearer ${process.env.WHATSAPP_ACCESS_TOKEN}`,
                'Content-Type': 'application/json'
            }
        });
    } catch (error) {
        console.error('❌ Failed to send message to WhatsApp:', error.response?.data || error.message);
    }
};

const sendInteractiveButtons = async (to, message, buttons) => {
    try {
        const payload = {
            messaging_product: "whatsapp",
            recipient_type: "individual",
            to: to,
            type: "interactive",
            interactive: {
                type: "button",
                body: { text: message },
                action: {
                    buttons: buttons.map(button => ({
                        type: "reply",
                        reply: {
                            id: button.id,
                            title: button.title
                        }
                    }))
                }
            }
        };

        await axios.post(process.env.WHATSAPP_API_URL, payload, {
            headers: {
                "Authorization": `Bearer ${process.env.WHATSAPP_ACCESS_TOKEN}`,
                "Content-Type": "application/json"
            }
        });
    } catch (error) {
        console.error("❌ Failed to send interactive buttons:", error.response?.data || error.message);
    }
};

const sendCitySelection = async (to, language) => {
    const cityPrompt = language === 'ar'
        ? 'يرجى اختيار المدينة من القائمة:'
        : 'Please select your city from the list:';

    const cityOptions = [
        { id: "abu_dhabi", title: language === 'ar' ? 'أبو ظبي' : 'Abu Dhabi' },
        { id: "dubai", title: language === 'ar' ? 'دبي' : 'Dubai' },
        { id: "sharjah", title: language === 'ar' ? 'الشارقة' : 'Sharjah' },
        { id: "ajman", title: language === 'ar' ? 'عجمان' : 'Ajman' },
        { id: "umm_al_quwain", title: language === 'ar' ? 'أم القيوين' : 'Umm Al Quwain' },
        { id: "ras_al_khaimah", title: language === 'ar' ? 'رأس الخيمة' : 'Ras Al Khaimah' },
        { id: "fujairah", title: language === 'ar' ? 'الفجيرة' : 'Fujairah' }
    ];

    const payload = {
        messaging_product: "whatsapp",
        recipient_type: "individual",
        to: to,
        type: "interactive",
        interactive: {
            type: "list",
            body: {
                text: cityPrompt
            },
            action: {
                button: language === 'ar' ? 'اختر المدينة' : 'Select City',
                sections: [
                    {
                        title: language === 'ar' ? 'المدن' : 'Cities',
                        rows: cityOptions.map(city => ({
                            id: city.id,
                            title: city.title
                        }))
                    }
                ]
            }
        }
    };

    await axios.post(process.env.WHATSAPP_API_URL, payload, {
        headers: {
            Authorization: `Bearer ${process.env.WHATSAPP_ACCESS_TOKEN}`,
            "Content-Type": "application/json"
        }
    });
};

const getOpenAIResponse = async (userMessage, context = "", language = "en") => {
    try {
        const systemMessage = `
            You are a friendly and intelligent WhatsApp assistant for a travel and tourism company. 
            Your goal is to assist users with their travel inquiries and reservations.
            Always respond concisely, use emojis sparingly, and maintain a helpful attitude.
            Generate the response in the user's language: ${language}.
            Keep your responses very short and to the point. Each response should be no longer than 30 seconds when spoken.
            For Arabic responses, ensure the answer is complete and concise, fitting within 100 tokens.
        `;

        const messages = [
            { role: "system", content: systemMessage },
            { role: "user", content: userMessage },
        ];

        if (context && context.trim() !== "") {
            messages.push({ role: "system", content: context });
        }

        const response = await axios.post('https://api.openai.com/v1/chat/completions', {
            model: "gpt-4",
            messages,
            max_tokens: 100,
            temperature: 0.7
        }, {
            headers: {
                'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
                'Content-Type': 'application/json'
            }
        });

        return response.data.choices[0].message.content.trim();
    } catch (error) {
        console.error('❌ Error with OpenAI:', error.response?.data || error.message);
        return "❌ Oops! Something went wrong. Please try again later.";
    }
};

const STATES = {
    WELCOME: 0,
    INQUIRY: "inquiry",
    RESERVATION: "reservation",
    DEPARTURE_CITY: "departure_city",
    ARRIVAL_CITY: "arrival_city",
    TRIP_TYPE: "trip_type",
    DEPARTURE_DATE: "departure_date",
    RETURN_DATE: "return_date",
    PASSPORT_PHOTO: "passport_photo",
    CONFIRMATION: "confirmation"
};

app.post('/webhook', async (req, res) => {
    try {
        console.log("🔹 Incoming Webhook Data:", JSON.stringify(req.body, null, 2));

        if (!req.body.entry || !Array.isArray(req.body.entry) || req.body.entry.length === 0) {
            console.error("❌ Error: Missing or invalid 'entry' in webhook payload.");
            return res.sendStatus(400);
        }

        const entry = req.body.entry[0];
        if (!entry.changes || !Array.isArray(entry.changes) || entry.changes.length === 0) {
            console.error("❌ Error: Missing or invalid 'changes' in webhook payload.");
            return res.sendStatus(400);
        }

        const changes = entry.changes[0];
        const value = changes.value;
        if (!value?.messages || !Array.isArray(value.messages) || value.messages.length === 0) {
            console.warn("⚠️ No messages found in webhook payload. Ignoring event.");
            return res.sendStatus(200);
        }

        const message = value.messages[0];
        const from = message.from;

        if (!message?.from) {
            console.error("❌ Error: Missing 'from' field in message.");
            return res.sendStatus(400);
        }

        let session = userSessions[from] || { step: STATES.WELCOME, data: {}, language: "en" };

        if (message.type === "text") {
            const text = message.text.body;

            if (session.step === STATES.WELCOME) {
                const welcomeMessage = session.language === 'ar'
                    ? "مرحبًا بكم في شركة السفر والسياحة! كيف يمكننا مساعدتك اليوم؟"
                    : "Welcome to the Travel and Tourism Company! How can we assist you today?";

                const buttons = [
                    { id: "inquiry", title: session.language === 'ar' ? "استفسار" : "Inquiry" },
                    { id: "reservation", title: session.language === 'ar' ? "حجز" : "Reservation" }
                ];

                await sendInteractiveButtons(from, welcomeMessage, buttons);
                session.step = STATES.WELCOME;
                userSessions[from] = session;
            } else if (session.step === STATES.INQUIRY) {
                const response = await getOpenAIResponse(text, "", session.language);
                await sendToWhatsApp(from, response);
            } else if (session.step === STATES.RESERVATION) {
                if (text === "inquiry") {
                    session.step = STATES.INQUIRY;
                    await sendToWhatsApp(from, session.language === 'ar' ? "ما هو استفسارك؟" : "What is your inquiry?");
                } else if (text === "reservation") {
                    session.step = STATES.DEPARTURE_CITY;
                    await sendCitySelection(from, session.language);
                }
            } else if (session.step === STATES.DEPARTURE_CITY) {
                session.data.departureCity = text;
                session.step = STATES.ARRIVAL_CITY;
                await sendCitySelection(from, session.language);
            } else if (session.step === STATES.ARRIVAL_CITY) {
                session.data.arrivalCity = text;
                session.step = STATES.TRIP_TYPE;
                const tripTypeMessage = session.language === 'ar'
                    ? "هل تريد حجز ذهاب فقط أم ذهاب وعودة؟"
                    : "Do you want a one-way or round trip?";
                const tripTypeButtons = [
                    { id: "one_way", title: session.language === 'ar' ? "ذهاب فقط" : "One Way" },
                    { id: "round_trip", title: session.language === 'ar' ? "ذهاب وعودة" : "Round Trip" }
                ];
                await sendInteractiveButtons(from, tripTypeMessage, tripTypeButtons);
            } else if (session.step === STATES.TRIP_TYPE) {
                session.data.tripType = text;
                session.step = STATES.DEPARTURE_DATE;
                await sendToWhatsApp(from, session.language === 'ar' ? "يرجى إدخال تاريخ المغادرة (YYYY-MM-DD):" : "Please enter the departure date (YYYY-MM-DD):");
            } else if (session.step === STATES.DEPARTURE_DATE) {
                session.data.departureDate = text;
                if (session.data.tripType === "round_trip") {
                    session.step = STATES.RETURN_DATE;
                    await sendToWhatsApp(from, session.language === 'ar' ? "يرجى إدخال تاريخ العودة (YYYY-MM-DD):" : "Please enter the return date (YYYY-MM-DD):");
                } else {
                    session.step = STATES.PASSPORT_PHOTO;
                    await sendToWhatsApp(from, session.language === 'ar' ? "يرجى إرسال صورة جواز السفر." : "Please send a photo of your passport.");
                }
            } else if (session.step === STATES.RETURN_DATE) {
                session.data.returnDate = text;
                session.step = STATES.PASSPORT_PHOTO;
                await sendToWhatsApp(from, session.language === 'ar' ? "يرجى إرسال صورة جواز السفر." : "Please send a photo of your passport.");
            } else if (session.step === STATES.PASSPORT_PHOTO) {
                if (message.type === "image") {
                    session.data.passportPhoto = message.image.id;
                    session.step = STATES.CONFIRMATION;
                    await sendReservationSummary(from, session);
                } else {
                    await sendToWhatsApp(from, session.language === 'ar' ? "يرجى إرسال صورة جواز السفر." : "Please send a photo of your passport.");
                }
            } else if (session.step === STATES.CONFIRMATION) {
                if (text === "yes_confirm") {
                    await sendToWhatsApp(from, session.language === 'ar' ? "تم تأكيد الحجز بنجاح!" : "Reservation confirmed successfully!");
                    session.step = STATES.WELCOME;
                } else if (text === "no_correct") {
                    session.step = STATES.RESERVATION;
                    await sendToWhatsApp(from, session.language === 'ar' ? "يرجى إعادة إدخال معلومات الحجز." : "Please re-enter your reservation details.");
                }
            }
        }

        userSessions[from] = session;
        return res.sendStatus(200);
    } catch (error) {
        console.error("❌ Error processing webhook:", error);
        return res.sendStatus(500);
    }
});

const sendReservationSummary = async (to, session) => {
    const language = session.language || 'en';
    const summary = language === 'ar'
        ? `📝 *ملخص الحجز*\n
مدينة المغادرة: ${session.data.departureCity || 'غير متوفر'}
مدينة الوصول: ${session.data.arrivalCity || 'غير متوفر'}
نوع الرحلة: ${session.data.tripType === "one_way" ? "ذهاب فقط" : "ذهاب وعودة" || 'غير متوفر'}
تاريخ المغادرة: ${session.data.departureDate || 'غير متوفر'}
تاريخ العودة: ${session.data.returnDate || 'غير متوفر'}`
        : `📝 *Reservation Summary*\n
Departure City: ${session.data.departureCity || 'Not provided'}
Arrival City: ${session.data.arrivalCity || 'Not provided'}
Trip Type: ${session.data.tripType === "one_way" ? "One Way" : "Round Trip" || 'Not provided'}
Departure Date: ${session.data.departureDate || 'Not provided'}
Return Date: ${session.data.returnDate || 'Not provided'}`;

    const confirmationButtons = [
        {
            type: "reply",
            reply: {
                id: "yes_confirm",
                title: language === 'ar' ? "تأكيد ✅" : "Confirm ✅"
            }
        },
        {
            type: "reply",
            reply: {
                id: "no_correct",
                title: language === 'ar' ? "تعديل ❌" : "Modify ❌"
            }
        }
    ];

    await sendInteractiveButtons(to, summary, confirmationButtons);
};

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});