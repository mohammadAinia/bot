import dotenv from 'dotenv';
import express from 'express';
import axios from 'axios';
import bodyParser from 'body-parser';
import cors from 'cors';
import { OpenAI } from 'openai';
import langdetect from 'langdetect'; // Add language detection library

dotenv.config();

if (!process.env.OPENAI_API_KEY || !process.env.WHATSAPP_API_URL || !process.env.WHATSAPP_ACCESS_TOKEN) {
    console.error('❌ Missing required environment variables');
    process.exit(1);
}

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

const app = express();
const PORT = process.env.PORT || 51030;
const VERIFY_TOKEN = "5IG[@ZFuM754";

app.use(cors());
app.use(bodyParser.json());

// User sessions to store booking data and language
const userSessions = {};

// Send a message to WhatsApp
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

// Send interactive buttons
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

// Get OpenAI response
const getOpenAIResponse = async (userMessage, language = "en") => {
    try {
        const systemMessage = `
        You are a friendly and intelligent WhatsApp assistant for Al Shaheen Travel and Tourism Company. 
        Your goal is to assist users with their travel inquiries and reservations.
        Always respond concisely, use emojis sparingly, and maintain a helpful attitude.
        Generate the response in the user's language: ${language}.
        Keep your responses very short and to the point. Each response should be no longer than 30 seconds when spoken.
        For Arabic responses, ensure the answer is complete and concise, fitting within 100 tokens.
    
        Company Details:
        - Working hours during Ramadan: 10 AM - 4 PM & 9 PM - 1 AM.
        - Ticket Prices:
          - Riyadh to Damascus: 1840 SAR.
          - Damascus to Riyadh: 1440 SAR.
        - No flights available to Aleppo.
        - No flights from Dammam.
        - Available flights from Riyadh to Damascus this month: March 31, 14, and 16.
        - April flights are on Fridays and Sundays every week.
        - Flights available until October.
        - No discounted prices currently.
        - 📍 Company Location: [Google Maps](https://maps.app.goo.gl/mbzekpz5bwrKkAte9)
    `;

        const response = await openai.chat.completions.create({
            model: "gpt-4",
            messages: [
                { role: "system", content: systemMessage },
                { role: "user", content: userMessage }
            ],
            max_tokens: 100,
            temperature: 0.7
        });

        return response.choices[0].message.content.trim();
    } catch (error) {
        console.error('❌ Error with OpenAI:', error.response?.data || error.message);
        return "❌ Oops! Something went wrong. Please try again later.";
    }
};

// Detect user language
const detectLanguage = (text) => {
    try {
        const detected = langdetect.detect(text);
        return detected[0]?.lang || 'en'; // Default to English if detection fails
    } catch (error) {
        console.error('❌ Error detecting language:', error);
        return 'en'; // Default to English
    }
};

// Handle webhook verification
app.get("/webhook", (req, res) => {
    if (req.query["hub.mode"] === "subscribe" && req.query["hub.verify_token"] === VERIFY_TOKEN) {
        console.log("Webhook verified successfully!");
        res.status(200).send(req.query["hub.challenge"]);
    } else {
        console.log("Webhook verification failed!");
        res.sendStatus(403);
    }
});

const cities = [
    { id: "riyadh", title: { en: "Riyadh", ar: "الرياض" } },
    { id: "jeddah", title: { en: "Jeddah", ar: "جدة" } },
    { id: "damascus", title: { en: "Damascus", ar: "دمشق" } }
];

// Handle incoming messages
app.post('/webhook', async (req, res) => {
    try {
        const entry = req.body.entry?.[0];
        const changes = entry?.changes?.[0];
        const value = changes?.value;
        const message = value?.messages?.[0];

        if (!message) {
            return res.sendStatus(200);
        }

        const userPhone = message.from;
        let userMessage = "";

        // Check if the message is a button click
        if (message.interactive && message.interactive.type === "button_reply") {
            userMessage = message.interactive.button_reply.id; // Get the button ID
        } else if (message.text) {
            userMessage = message.text.body; // Get the text message
        }

        // Initialize user session if it doesn't exist
        if (!userSessions[userPhone]) {
            userSessions[userPhone] = {
                step: "WELCOME",
                data: {},
                language: detectLanguage(userMessage) // Detect user language
            };
        }

        const session = userSessions[userPhone];

        // Update language if not already set
        if (!session.language) {
            session.language = detectLanguage(userMessage);
        }

        // Define messages in Arabic and English
        const messages = {
            WELCOME: {
                en: "Welcome! How can I assist you today?",
                ar: "مرحبًا! كيف يمكنني مساعدتك اليوم؟"
            },
            INQUIRY_PROMPT: {
                en: "Please type your inquiry:",
                ar: "من فضلك اكتب استفسارك:"
            },
            DEPARTURE_CITY_PROMPT: {
                en: "Please provide the departure city:",
                ar: "من فضلك قم بإدخال مدينة المغادرة:"
            },
            ARRIVAL_CITY_PROMPT: {
                en: "Please provide the arrival city:",
                ar: "من فضلك قم بإدخال مدينة الوصول:"
            },
            TRIP_TYPE_PROMPT: {
                en: "Please select the trip type:",
                ar: "من فضلك اختر نوع الرحلة:"
            },
            DEPARTURE_DATE_PROMPT: {
                en: "Please provide the departure date (YYYY-MM-DD):",
                ar: "من فضلك قم بإدخال تاريخ المغادرة (YYYY-MM-DD):"
            },
            RETURN_DATE_PROMPT: {
                en: "Please provide the return date (YYYY-MM-DD):",
                ar: "من فضلك قم بإدخال تاريخ العودة (YYYY-MM-DD):"
            },
            EMAIL_PROMPT: {
                en: "Please provide your email:",
                ar: "من فضلك قم بإدخال بريدك الإلكتروني:"
            },
            PASSPORT_PHOTO_PROMPT: {
                en: "Please send a photo of your passport:",
                ar: "من فضلك قم بإرسال صورة جواز السفر:"
            },
            CONFIRMATION_PROMPT: {
                en: "Please confirm your booking:",
                ar: "من فضلك قم بتأكيد الحجز:"
            },
            SUCCESS_MESSAGE: {
                en: "The request was sent successfully!",
                ar: "تم إرسال الطلب بنجاح!"
            },
            CANCEL_MESSAGE: {
                en: "Booking canceled. You can start over.",
                ar: "تم إلغاء الحجز. يمكنك البدء من جديد."
            }
        };

        switch (session.step) {
            case "WELCOME":
                // Generate a welcome message using OpenAI
                const welcomeMessage = await getOpenAIResponse(
                    "Generate a brief and friendly welcome message for a travel and tourism company. Keep it very short and include an emoji.",
                    session.language
                );

                // Send the welcome message with interactive buttons
                await sendInteractiveButtons(userPhone, welcomeMessage, [
                    { id: "inquiry", title: session.language === 'ar' ? "استفسار" : "Inquiry" },
                    { id: "book_ticket", title: session.language === 'ar' ? "حجز تذكرة" : "Book a Ticket" }
                ]);
                session.step = "ACTION_SELECTION";
                break;

            case "ACTION_SELECTION":
                if (userMessage === "inquiry") {
                    await sendToWhatsApp(userPhone, messages.INQUIRY_PROMPT[session.language]);
                    session.step = "HANDLE_INQUIRY";
                } else if (userMessage === "book_ticket") {
                    await sendInteractiveButtons(userPhone, messages.DEPARTURE_CITY_PROMPT[session.language], [
                        { id: "riyadh", title: cities[0].title[session.language] },
                        { id: "jeddah", title: cities[1].title[session.language] },
                        { id: "damascus", title: cities[2].title[session.language] }
                    ]);
                    session.step = "DEPARTURE_CITY_SELECTION";
                }
                break;

            case "HANDLE_INQUIRY":
                if (userMessage) {
                    // Get the OpenAI response for the user's inquiry
                    const response = await getOpenAIResponse(userMessage, session.language);

                    // Send the response to the user
                    await sendToWhatsApp(userPhone, response);

                    // Send a follow-up message with interactive buttons
                    const followUpMessage = session.language === 'ar'
                        ? "يمكنك الاستمرار في طرح الأسئلة أو النقر على زر حجز تذكرة."
                        : "You can continue asking questions or click on the Book a Ticket button.";

                    await sendInteractiveButtons(userPhone, followUpMessage, [
                        { id: "inquiry", title: session.language === 'ar' ? "استفسار" : "Inquiry" },
                        { id: "book_ticket", title: session.language === 'ar' ? "حجز تذكرة" : "Book a Ticket" }
                    ]);

                    // Stay in the HANDLE_INQUIRY step to allow the user to continue asking questions
                    session.step = "HANDLE_INQUIRY";
                } else {
                    // Prompt the user to type their inquiry
                    await sendToWhatsApp(userPhone, messages.INQUIRY_PROMPT[session.language]);
                }
                break;

            case "DEPARTURE_CITY_SELECTION":
                if (["riyadh", "jeddah", "damascus"].includes(userMessage)) {
                    session.data.departureCity = userMessage;
                    await sendInteractiveButtons(userPhone, messages.ARRIVAL_CITY_PROMPT[session.language], [
                        { id: "riyadh", title: cities[0].title[session.language] },
                        { id: "jeddah", title: cities[1].title[session.language] },
                        { id: "damascus", title: cities[2].title[session.language] }
                    ]);
                    session.step = "ARRIVAL_CITY_SELECTION";
                } else {
                    await sendToWhatsApp(userPhone, "Invalid city selection. Please try again.");
                }
                break;

            case "ARRIVAL_CITY_SELECTION":
                session.data.arrivalCity = userMessage;
                await sendInteractiveButtons(userPhone, messages.TRIP_TYPE_PROMPT[session.language], [
                    { id: "one_way", title: session.language === 'ar' ? "ذهاب فقط" : "One Way" },
                    { id: "round_trip", title: session.language === 'ar' ? "ذهاب وعودة" : "Round Trip" }
                ]);
                session.step = "TRIP_TYPE";
                break;

            case "TRIP_TYPE":
                session.data.tripType = userMessage;
                await sendToWhatsApp(userPhone, messages.DEPARTURE_DATE_PROMPT[session.language]);
                session.step = "DEPARTURE_DATE";
                break;

            case "DEPARTURE_DATE":
                session.data.departureDate = userMessage;
                if (session.data.tripType === "round_trip") {
                    await sendToWhatsApp(userPhone, messages.RETURN_DATE_PROMPT[session.language]);
                    session.step = "RETURN_DATE";
                } else {
                    await sendToWhatsApp(userPhone, messages.EMAIL_PROMPT[session.language]);
                    session.step = "EMAIL";
                }
                break;

            case "RETURN_DATE":
                session.data.returnDate = userMessage;
                await sendToWhatsApp(userPhone, messages.EMAIL_PROMPT[session.language]);
                session.step = "EMAIL";
                break;

            case "EMAIL":
                session.data.email = userMessage;
                await sendToWhatsApp(userPhone, messages.PASSPORT_PHOTO_PROMPT[session.language]);
                session.step = "PASSPORT_PHOTO";
                break;

            case "PASSPORT_PHOTO":
                if (message.type === "image") {
                    session.data.passportPhoto = message.image.id;
                    const summary = session.language === 'ar'
                        ? `📝 *ملخص الحجز*\n
مدينة المغادرة: ${session.data.departureCity}
مدينة الوصول: ${session.data.arrivalCity}
نوع الرحلة: ${session.data.tripType === "one_way" ? "ذهاب فقط" : "ذهاب وعودة"}
تاريخ المغادرة: ${session.data.departureDate}
تاريخ العودة: ${session.data.returnDate || "غير متوفر"}
البريد الإلكتروني: ${session.data.email}`
                        : `📝 *Reservation Summary*\n
Departure City: ${session.data.departureCity}
Arrival City: ${session.data.arrivalCity}
Trip Type: ${session.data.tripType === "one_way" ? "One Way" : "Round Trip"}
Departure Date: ${session.data.departureDate}
Return Date: ${session.data.returnDate || "N/A"}
Email: ${session.data.email}`;

                    // Send the summary and buttons in a single interactive message
                    await sendInteractiveButtons(userPhone, summary, [
                        { id: "confirm", title: session.language === 'ar' ? "تأكيد ✅" : "Confirm ✅" },
                        { id: "modify", title: session.language === 'ar' ? "تعديل ✏️" : "Modify ✏️" },
                        { id: "delete", title: session.language === 'ar' ? "حذف 🗑️" : "Delete 🗑️" }
                    ]);
                    session.step = "CONFIRMATION";
                } else {
                    await sendToWhatsApp(userPhone, messages.PASSPORT_PHOTO_PROMPT[session.language]);
                }
                break;

            case "CONFIRMATION":
                if (userMessage === "confirm") {
                    await sendToWhatsApp(userPhone, messages.SUCCESS_MESSAGE[session.language]);
                    delete userSessions[userPhone]; // Clear session
                } else if (userMessage === "modify") {
                    await sendToWhatsApp(userPhone, messages.DEPARTURE_CITY_PROMPT[session.language]);
                    session.step = "DEPARTURE_CITY"; // Restart the booking process
                } else if (userMessage === "delete") {
                    await sendToWhatsApp(userPhone, messages.CANCEL_MESSAGE[session.language]);
                    delete userSessions[userPhone]; // Clear session
                }
                break;
        }

        return res.sendStatus(200);
    } catch (error) {
        console.error("❌ Error processing webhook:", error);
        return res.sendStatus(500);
    }
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});