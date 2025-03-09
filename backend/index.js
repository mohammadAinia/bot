import dotenv from 'dotenv';
import express from 'express';
import axios from 'axios';
import bodyParser from 'body-parser';
import cors from 'cors';
import { OpenAI } from 'openai';

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

// User sessions to store booking data
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
        You are a friendly and intelligent WhatsApp assistant for a travel and tourism company. 
        Your goal is to assist users with their travel inquiries and reservations.
        Always respond concisely, use emojis sparingly, and maintain a helpful attitude.
        Generate the response in the user's language: ${language}.
        Keep your responses very short and to the point.
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
        const userMessage = message.text?.body || "";

        // Initialize user session if it doesn't exist
        if (!userSessions[userPhone]) {
            userSessions[userPhone] = {
                step: "WELCOME",
                data: {}
            };
        }

        const session = userSessions[userPhone];

        switch (session.step) {
            case "WELCOME":
                // Send welcome message with buttons
                await sendInteractiveButtons(userPhone, "Welcome! How can I assist you today?", [
                    { id: "inquiry", title: "Inquiry" },
                    { id: "book_ticket", title: "Book a Ticket" }
                ]);
                session.step = "ACTION_SELECTION";
                break;

            case "ACTION_SELECTION":
                if (userMessage === "inquiry") {
                    await sendToWhatsApp(userPhone, "Please type your inquiry:");
                    session.step = "HANDLE_INQUIRY";
                } else if (userMessage === "book_ticket") {
                    await sendToWhatsApp(userPhone, "Please provide the departure city:");
                    session.step = "DEPARTURE_CITY";
                }
                break;

            case "HANDLE_INQUIRY":
                const response = await getOpenAIResponse(userMessage);
                await sendToWhatsApp(userPhone, response);
                session.step = "WELCOME"; // Reset to welcome step
                break;

            case "DEPARTURE_CITY":
                session.data.departureCity = userMessage;
                await sendToWhatsApp(userPhone, "Please provide the arrival city:");
                session.step = "ARRIVAL_CITY";
                break;

            case "ARRIVAL_CITY":
                session.data.arrivalCity = userMessage;
                await sendInteractiveButtons(userPhone, "Please select the trip type:", [
                    { id: "one_way", title: "One Way" },
                    { id: "round_trip", title: "Round Trip" }
                ]);
                session.step = "TRIP_TYPE";
                break;

            case "TRIP_TYPE":
                session.data.tripType = userMessage;
                await sendToWhatsApp(userPhone, "Please provide the departure date (YYYY-MM-DD):");
                session.step = "DEPARTURE_DATE";
                break;

            case "DEPARTURE_DATE":
                session.data.departureDate = userMessage;
                if (session.data.tripType === "round_trip") {
                    await sendToWhatsApp(userPhone, "Please provide the return date (YYYY-MM-DD):");
                    session.step = "RETURN_DATE";
                } else {
                    await sendToWhatsApp(userPhone, "Please provide your email:");
                    session.step = "EMAIL";
                }
                break;

            case "RETURN_DATE":
                session.data.returnDate = userMessage;
                await sendToWhatsApp(userPhone, "Please provide your email:");
                session.step = "EMAIL";
                break;

            case "EMAIL":
                session.data.email = userMessage;
                await sendToWhatsApp(userPhone, "Please send a photo of your passport:");
                session.step = "PASSPORT_PHOTO";
                break;

            case "PASSPORT_PHOTO":
                if (message.type === "image") {
                    session.data.passportPhoto = message.image.id;
                    const summary = `📝 *Reservation Summary*\n
Departure City: ${session.data.departureCity}
Arrival City: ${session.data.arrivalCity}
Trip Type: ${session.data.tripType === "one_way" ? "One Way" : "Round Trip"}
Departure Date: ${session.data.departureDate}
Return Date: ${session.data.returnDate || "N/A"}
Email: ${session.data.email}`;

                    await sendToWhatsApp(userPhone, summary);
                    await sendInteractiveButtons(userPhone, "Please confirm your booking:", [
                        { id: "confirm", title: "Confirm ✅" },
                        { id: "cancel", title: "Cancel ❌" }
                    ]);
                    session.step = "CONFIRMATION";
                } else {
                    await sendToWhatsApp(userPhone, "Please send a valid photo of your passport.");
                }
                break;

            case "CONFIRMATION":
                if (userMessage === "confirm") {
                    await sendToWhatsApp(userPhone, "The request was sent successfully!");
                    delete userSessions[userPhone]; // Clear session
                } else {
                    await sendToWhatsApp(userPhone, "Booking canceled. You can start over.");
                    session.step = "WELCOME";
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