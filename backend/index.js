import dotenv from 'dotenv';
import express from 'express';
import axios from 'axios';
import bodyParser from 'body-parser';
import cors from 'cors';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

dotenv.config(); // ✅ تحميل متغيرات البيئة

// تحقق من المتغيرات
if (!process.env.OPENAI_API_KEY || !process.env.WHATSAPP_API_URL || !process.env.WHATSAPP_ACCESS_TOKEN) {
    console.error('❌ Missing required environment variables');
    process.exit(1);
}

const app = express();

const ADMIN_USERNAME = 'admin';
const ADMIN_PASSWORD = 'admin123'; // In a real-world scenario, hash this password
const SECRET_KEY = process.env.SECRET_KEY || 'LoothTech12345'; // Use a strong secret key

// Allow requests from your front-end's origin (e.g., http://localhost:5173)
app.use(cors({
    origin: 'http://localhost:5173',
    // You can also allow multiple origins or use a function to check origins dynamically
}));
const PORT = process.env.PORT || 5000;
app.use(bodyParser.json());

app.get('/', (req, res) => {
    res.send('Backend is running');
})

// Login endpoint
app.post('/admin/login', (req, res) => {
    const { username, password } = req.body;

    // Check credentials
    if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
        // Generate JWT token
        const token = jwt.sign({ username }, SECRET_KEY, { expiresIn: '1h' });
        res.json({ token });
    } else {
        res.status(401).json({ error: 'Invalid username or password' });
    }
});

const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) return res.status(401).json({ error: 'Access denied. No token provided.' });

    jwt.verify(token, SECRET_KEY, (err, user) => {
        if (err) return res.status(403).json({ error: 'Invalid or expired token.' });
        req.user = user;
        next();
    });
};

// بيانات التحقق من Webhook
const VERIFY_TOKEN = "Mohammad";
// تحقق من الـ Webhook من Meta
app.get("/webhook", (req, res) => {
    const mode = req.query["hub.mode"];
    const token = req.query["hub.verify_token"];
    const challenge = req.query["hub.challenge"];

    if (mode && token === VERIFY_TOKEN) {
        console.log("✅ Webhook verified successfully.");
        res.status(200).send(challenge);
    } else {
        res.sendStatus(403);
    }
});

let systemMessage = `🌟 Welcome to Mohammed Oil Refining Company 🌟  
The company specializes in oil re-refining, and working hours are from Sunday to Thursday, 9 AM to 2 PM.  
You are the company's virtual assistant, and your task is to answer only questions related to the company, such as services, prices, or oil disposal requests.  
If the question is not related to the company, respond with: "❌ Sorry, I can only answer questions related to our company's services."`;

let guidanceMessage = ""; // Initially empty; can be updated by the admin
// Receiving WhatsApp messages
const defaultWelcomeMessage = `🌟 Welcome to *Mohammed Oil Refining Company* 🌟  
                                    We offer the following services:  
                                    1️⃣ *Inquiries about our products and services*  
                                    2️⃣ *Create a new request:*  
                              

                                    Please send the *service number* you wish to request.`;
// New endpoint to retrieve the messages
// Protected routes
app.get('/admin/messages', authenticateToken, (req, res) => {
    res.json({ systemMessage, guidanceMessage, defaultWelcomeMessage });
});

app.post('/admin/update-messages', authenticateToken, (req, res) => {
    const { newSystemMessage, newGuidance } = req.body;

    if (newSystemMessage) {
        if (typeof newSystemMessage !== 'string') {
            return res.status(400).json({ error: 'Invalid system message provided.' });
        }
        systemMessage = newSystemMessage;
        console.log('✅ System message updated:', systemMessage);
    }

    if (newGuidance) {
        if (typeof newGuidance !== 'string') {
            return res.status(400).json({ error: 'Invalid guidance message provided.' });
        }
        guidanceMessage = newGuidance;
        console.log('✅ Guidance message updated:', guidanceMessage);
    }

    res.json({ message: 'Messages updated successfully.' });
});

app.post('/admin/update-welcome-message', authenticateToken, (req, res) => {
    const { newWelcomeMessage } = req.body;

    if (newWelcomeMessage && typeof newWelcomeMessage === 'string') {
        defaultWelcomeMessage = newWelcomeMessage;
        console.log('✅ Welcome message updated:', defaultWelcomeMessage);
        res.json({ message: 'Welcome message updated successfully.' });
    } else {
        res.status(400).json({ error: 'Invalid welcome message provided.' });
    }
});

const getOpenAIResponse = async (userMessage) => {
    try {
        const messages = [
            { role: "system", content: systemMessage },  // Editable default message
        ];

        // If a guidance message exists, include it as a second system message
        if (guidanceMessage && guidanceMessage.trim() !== "") {
            messages.push({ role: "system", content: guidanceMessage });
        }

        messages.push({ role: "user", content: userMessage });  // User query

        const response = await axios.post('https://api.openai.com/v1/chat/completions', {
            model: "gpt-4",
            messages,
            max_tokens: 150,
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
        return "❌ Sorry, an error occurred while processing your request.";
    }
};

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

function convertArabicNumbers(input) {
    return input.replace(/[٠١٢٣٤٥٦٧٨٩]/g, d => "0123456789"["٠١٢٣٤٥٦٧٨٩".indexOf(d)]);
}

const isValidEmail = (email) => {
    const regex = /^\S+@\S+\.\S+$/;
    return regex.test(email);
};

const isValidPhone = (phone) => {
    const regex = /^\+?\d{1,4}\s?\d{6,12}$/; // يسمح برمز الدولة والمسافة
    return regex.test(phone);
};

const sendCitySelection = async (to) => {
    try {
        await axios.post(process.env.WHATSAPP_API_URL, {
            messaging_product: "whatsapp",
            recipient_type: "individual",
            to: to,
            type: "interactive",
            interactive: {
                type: "button",  // Use "button" for quick replies
                body: {
                    text: "🌆 Please select your city:"
                },
                action: {
                    buttons: [
                        { type: "reply", reply: { id: "abu_dhabi", title: "Abu Dhabi" } },
                        { type: "reply", reply: { id: "dubai", title: "Dubai" } },
                        { type: "reply", reply: { id: "sharjah", title: "Sharjah" } }
                    ]
                }
            }
        }, {
            headers: {
                "Authorization": `Bearer ${process.env.WHATSAPP_ACCESS_TOKEN}`,
                "Content-Type": "application/json"
            }
        });
    } catch (error) {
        console.error("❌ Failed to send city selection:", error.response?.data || error.message);
    }
};

const sendOrderSummary = async (to, session) => {
    try {
        let summary = `✅ *Order Summary:*\n\n`;
        summary += `🔹 *Name:* ${session.data.name}\n`;
        summary += `📞 *Phone Number:* ${session.data.phone}\n`;
        summary += `📧 *Email:* ${session.data.email}\n`;
        summary += `📍 *Address:* ${session.data.address}\n`;
        summary += `🌆 *City:* ${session.data.city}\n`;
        summary += `🏠 *Street:* ${session.data.street}\n`;
        summary += `🏢 *Building Name:* ${session.data.building_name}\n`;
        summary += `🏠 *Flat Number:* ${session.data.flat_no}\n`;
        summary += `📍 *Latitude:* ${session.data.latitude}\n`;
        summary += `📍 *Longitude:* ${session.data.longitude}\n`;
        summary += `📦 *Quantity:* ${session.data.quantity}\n\n`;
        summary += `Is the information correct? Please confirm below:`;

        await axios.post(process.env.WHATSAPP_API_URL, {
            messaging_product: "whatsapp",
            recipient_type: "individual",
            to: to,
            type: "interactive",
            interactive: {
                type: "button",
                body: {
                    text: summary
                },
                action: {
                    buttons: [
                        { type: "reply", reply: { id: "yes_confirm", title: "Yes" } },
                        { type: "reply", reply: { id: "no_correct", title: "No" } }
                    ]
                }
            }
        }, {
            headers: {
                "Authorization": `Bearer ${process.env.WHATSAPP_ACCESS_TOKEN}`,
                "Content-Type": "application/json"
            }
        });
    } catch (error) {
        console.error("❌ Failed to send order summary:", error.response?.data || error.message);
    }
};

let dataStore = [];  // Array to temporarily store data

function formatPhoneNumber(phoneNumber) {
    // إزالة أي مسافات أو رموز غير ضرورية
    let cleanedNumber = phoneNumber.replace(/\D/g, "");

    // التأكد من أن الرقم يبدأ بـ "+"
    if (!cleanedNumber.startsWith("+")) {
        cleanedNumber = `+${cleanedNumber}`;
    }
    // إضافة مسافة بعد رمز الدولة (أول 3 أو 4 أرقام)
    const match = cleanedNumber.match(/^\+(\d{1,4})(\d+)$/);
    if (match) {
        return `+${match[1]} ${match[2]}`; // إضافة المسافة بعد كود الدولة
    }
    return cleanedNumber; // إرجاع الرقم إذا لم ينطبق النمط
}

const userSessions = {};

const STATES = {
    WELCOME: 0,
    FAQ: "faq",
    NAME: 1,
    PHONE_CONFIRM: "phone_confirm",
    PHONE_INPUT: "phone_input",
    EMAIL: 3,
    ADDRESS: 4,
    CITY: 7,
    STREET: 9,
    BUILDING_NAME: 10,
    FLAT_NO: 11,
    LATITUDE: 12,
    LONGITUDE: 13,
    QUANTITY: 6,
    CONFIRMATION: 5,
    MODIFY: "modify"  // New state for modification
};

const sendUpdatedSummary = async (to, session) => {
    try {
        let summary = `✅ *Updated Order Summary:*\n\n`;
        summary += `🔹 *Name:* ${session.data.name}\n`;
        summary += `📞 *Phone Number:* ${session.data.phone}\n`;
        summary += `📧 *Email:* ${session.data.email}\n`;
        summary += `📍 *Address:* ${session.data.address}\n`;
        summary += `🌆 *City:* ${session.data.city}\n`;
        summary += `🏠 *Street:* ${session.data.street}\n`;
        summary += `🏢 *Building Name:* ${session.data.building_name}\n`;
        summary += `🏠 *Flat Number:* ${session.data.flat_no}\n`;
        summary += `📍 *Latitude:* ${session.data.latitude}\n`;
        summary += `📍 *Longitude:* ${session.data.longitude}\n`;
        summary += `📦 *Quantity:* ${session.data.quantity}\n\n`;
        summary += `Is the information correct? Please confirm below:`;

        await axios.post(process.env.WHATSAPP_API_URL, {
            messaging_product: "whatsapp",
            recipient_type: "individual",
            to: to,
            type: "interactive",
            interactive: {
                type: "button",
                body: {
                    text: summary
                },
                action: {
                    buttons: [
                        { type: "reply", reply: { id: "yes_confirm", title: "✅ Yes" } },
                        { type: "reply", reply: { id: "no_correct", title: "❌ No" } }
                    ]
                }
            }
        }, {
            headers: {
                "Authorization": `Bearer ${process.env.WHATSAPP_ACCESS_TOKEN}`,
                "Content-Type": "application/json"
            }
        });
    } catch (error) {
        console.error("❌ Failed to send updated order summary:", error.response?.data || error.message);
    }
};

app.post('/webhook', async (req, res) => {
    try {
        console.log('Incoming Webhook Data:', req.body); // Log the incoming data for debugging

        const entry = req.body.entry?.[0];
        const changes = entry?.changes?.[0];
        const value = changes?.value;
        const messages = value?.messages;

        if (!messages || messages.length === 0) {
            console.log('No messages received, returning early.');
            return res.sendStatus(200);
        }

        const message = messages[0];
        const from = message.from;
        const textRaw = message.text?.body || "";
        const text = textRaw.toLowerCase().trim();

        console.log(`📩 New message from ${from}: ${text}`);

        if (!userSessions[from]) {
            userSessions[from] = { step: STATES.WELCOME, data: {} };

            // List of greeting phrases
            const greetings = [
                "hello", "hi", "hey", "greetings", "good day",
                "good morning", "good afternoon", "good evening"
            ];

            let isGreeting = greetings.some(greeting => text.toLowerCase().includes(greeting));

            let welcomeText = isGreeting
                ? `Welcome to *Mohammed Oil Refining Company*.\n\nWe offer the following services:\n\n1️⃣ *Inquiries about our products and services*\n2️⃣ *Create a new request:*\n\nPlease select an option below:`
                : `🌟 Welcome to *Mohammed Oil Refining Company* 🌟\n\nWe offer the following services:\n\n1️⃣ *Inquiries about our products and services*\n2️⃣ *Create a new request:*\n\nPlease select an option below:`;

            // Send interactive buttons (always included)
            await axios.post(process.env.WHATSAPP_API_URL, {
                messaging_product: "whatsapp",
                recipient_type: "individual",
                to: from,
                type: "interactive",
                interactive: {
                    type: "button",
                    body: {
                        text: welcomeText
                    },
                    action: {
                        buttons: [
                            { type: "reply", reply: { id: "faq_request", title: "🔍 Inquiries" } },
                            { type: "reply", reply: { id: "new_request", title: "📝 New Request" } }
                        ]
                    }
                }
            }, {
                headers: {
                    "Authorization": `Bearer ${process.env.WHATSAPP_ACCESS_TOKEN}`,
                    "Content-Type": "application/json"
                }
            });
            return res.sendStatus(200);
        }

        // If there is no session for the user, create one first
        // if (!userSessions[from]) {
        //     userSessions[from] = { step: STATES.WELCOME, data: {} };

        //     // List of greeting phrases
        //     const greetings = [
        //         "hello", "hi", "hey", "greetings", "good day",
        //         "good morning", "good afternoon", "good evening"
        //     ];

        //     let isGreeting = greetings.some(greeting => text.includes(greeting));

        //     // let welcomeText = "";
        //     // if (isGreeting) {
        //     //     welcomeText = `Welcome to *Mohammed Oil Refining Company*.\n\nWe offer the following services:\n\n1️⃣ *Inquiries about our products and services*\n2️⃣ *Create a new request:*\n\nPlease send the *service number* you wish to request.`;
        //     // } else {
        //     //     welcomeText = defaultWelcomeMessage;
        //     // }
        //     // console.log(`isGreeting: ${isGreeting} | Received text: "${text}"`);
        //     // await sendToWhatsApp(from, welcomeText);
        //     // return res.sendStatus(200);
        //     let welcomeText = "";
        //     if (isGreeting) {
        //         welcomeText = `Welcome to *Mohammed Oil Refining Company*.\n\nWe offer the following services:\n\n1️⃣ *Inquiries about our products and services*\n2️⃣ *Create a new request:*\n\nPlease select an option below:`;

        //         await axios.post(process.env.WHATSAPP_API_URL, {
        //             messaging_product: "whatsapp",
        //             recipient_type: "individual",
        //             to: from,
        //             type: "interactive",
        //             interactive: {
        //                 type: "button",
        //                 body: {
        //                     text: welcomeText
        //                 },
        //                 action: {
        //                     buttons: [
        //                         { type: "reply", reply: { id: "faq_request", title: "🔍 Inquiries" } },
        //                         { type: "reply", reply: { id: "new_request", title: "📝 New Request" } }
        //                     ]
        //                 }
        //             }
        //         }, {
        //             headers: {
        //                 "Authorization": `Bearer ${process.env.WHATSAPP_ACCESS_TOKEN}`,
        //                 "Content-Type": "application/json"
        //             }
        //         });

        //         return res.sendStatus(200);
        //     } else {
        //         welcomeText = defaultWelcomeMessage;
        //     }
        //     console.log(`isGreeting: ${isGreeting} | Received text: "${text}"`);
        //     await sendToWhatsApp(from, welcomeText);
        //     return res.sendStatus(200);
        // }

        const session = userSessions[from];

        // Handle messages based on the current state
        switch (session.step) {
            case STATES.WELCOME:
                if (message.type === "interactive" && message.interactive.type === "button_reply") {
                    const buttonId = message.interactive.button_reply.id; // Extract button ID

                    if (buttonId === "faq_request") {
                        await sendToWhatsApp(from, "❓ Please send your question regarding our services or products.");
                        session.step = STATES.FAQ;
                    } else if (buttonId === "new_request") {
                        session.step = STATES.NAME;
                        await sendToWhatsApp(from, "🔹 Please provide your full name.");
                    } else {
                        await sendToWhatsApp(from, "❌ Invalid option, please select a valid button.");
                    }
                } else {
                    await sendToWhatsApp(from, "❌ Invalid input. Please select an option using the buttons.");
                }
                break;

            case STATES.FAQ:
                // Check if the user clicked the "End Chat" button
                if (message.type === "interactive" && message.interactive.type === "button_reply") {
                    const buttonId = message.interactive.button_reply.id; // Get button ID

                    if (buttonId === "end_chat") {
                        await sendToWhatsApp(from, "✅ The chat has been closed. If you need any future assistance, feel free to reach out to us.");
                        delete userSessions[from];
                        return res.sendStatus(200);
                    }
                    break;
                }

                // Handle text-based termination phrases (fallback for users who type them)
                const terminationPhrases = ["thank you", "close", "end chat", "appreciate it"];
                if (terminationPhrases.some(phrase => text.toLowerCase().includes(phrase))) {
                    await sendToWhatsApp(from, "✅ The chat has been closed. If you need any future assistance, feel free to reach out to us.");
                    delete userSessions[from];
                    return res.sendStatus(200);
                }

                // Generate AI response
                const aiResponse = await getOpenAIResponse(textRaw);
                const reply = `${aiResponse}\n\nTo continue your inquiry, you can ask another question. If you want to end the conversation, please type 'thank you' or 'end chat'.`;

                // Send WhatsApp interactive message with only the "End Chat" button
                await axios.post(process.env.WHATSAPP_API_URL, {
                    messaging_product: "whatsapp",
                    recipient_type: "individual",
                    to: from,
                    type: "interactive",
                    interactive: {
                        type: "button",
                        body: {
                            text: reply
                        },
                        action: {
                            buttons: [
                                { type: "reply", reply: { id: "end_chat", title: "❌ End Chat" } }
                            ]
                        }
                    }
                }, {
                    headers: {
                        "Authorization": `Bearer ${process.env.WHATSAPP_ACCESS_TOKEN}`,
                        "Content-Type": "application/json"
                    }
                });
                break;

            case STATES.NAME:
                session.data.name = textRaw;
                session.data.phone = formatPhoneNumber(from); // Automatically store the sender's number
                session.step = STATES.EMAIL;
                await sendToWhatsApp(from, "📧 Please provide your email address.");
                break;

            // case STATES.PHONE_CONFIRM:
            //     if (text.includes("yes") || text.includes("yea")) {
            //         session.data.phone = formatPhoneNumber(from);
            //         session.step = STATES.EMAIL;
            //         await sendToWhatsApp(from, "📧 Your current number will be used. Please provide your email address.");
            //     } else if (text.includes("no")) {
            //         session.step = STATES.PHONE_INPUT;
            //         await sendToWhatsApp(from, "📞 Please enter the phone with country code starting from +.");
            //     } else {
            //         await sendToWhatsApp(from, "❌ Please reply with Yes or No.");
            //     }
            //     break;

            case STATES.PHONE_INPUT:
                if (!isValidPhone(textRaw)) {
                    await sendToWhatsApp(from, "❌ Invalid phone number, please enter a valid number.");
                    return res.sendStatus(200);
                }
                session.data.phone = formatPhoneNumber(textRaw);
                session.step = STATES.EMAIL;
                await sendToWhatsApp(from, "📧 Please provide your email address.");
                break;

            case STATES.EMAIL:
                if (!isValidEmail(textRaw)) {
                    await sendToWhatsApp(from, "❌ Invalid email address, please enter a valid one.");
                    return res.sendStatus(200);
                }
                session.data.email = textRaw;
                session.step = STATES.ADDRESS;
                await sendToWhatsApp(from, "📍 Please provide your full address.");
                break;

            case STATES.ADDRESS:
                session.data.address = textRaw;
                session.step = STATES.CITY_SELECTION;  // ✅ Move directly to CITY_SELECTION
                return await sendCitySelection(from);   // ✅ Immediately send the city selection and return

            case STATES.CITY_SELECTION:
                if (message.interactive && message.interactive.button_reply) {  // ✅ Handle button replies
                    const citySelection = message.interactive.button_reply.id;  // ✅ Get selected city ID

                    const cityMap = {
                        "abu_dhabi": "Abu Dhabi",
                        "dubai": "Dubai",
                        "sharjah": "Sharjah"
                    };

                    if (cityMap[citySelection]) {
                        session.data.city = cityMap[citySelection];
                        session.step = STATES.STREET;
                        await sendToWhatsApp(from, `✅ You selected *${session.data.city}*.\n\n🏠 Please provide the street name.`);
                    } else {
                        await sendToWhatsApp(from, "❌ Invalid selection. Please choose from the provided options.");
                        await sendCitySelection(from); // Re-send city selection if invalid
                    }
                } else {
                    await sendToWhatsApp(from, "❌ Please select a city from the provided options.");
                    await sendCitySelection(from); // Re-send the city selection buttons
                }
                break;

            case STATES.STREET:
                session.data.street = textRaw;
                session.step = STATES.BUILDING_NAME;
                await sendToWhatsApp(from, "🏢 Please provide the building name.");
                break;

            case STATES.BUILDING_NAME:
                session.data.building_name = textRaw;
                session.step = STATES.FLAT_NO;
                await sendToWhatsApp(from, "🏠 Please provide the flat number.");
                break;

            case STATES.FLAT_NO:
                session.data.flat_no = textRaw;
                session.step = STATES.LONGITUDE;

                // Only send the location prompt if it hasn't been sent already
                if (!session.locationPromptSent) {
                    await sendToWhatsApp(from, "📍 Please share your location using WhatsApp's location feature. Tap the 📎 icon and select 'Location'.");
                    session.locationPromptSent = true; // Mark the prompt as sent
                }
                break;

            case STATES.LONGITUDE:
                if (message.location) {
                    session.data.latitude = message.location.latitude;
                    session.data.longitude = message.location.longitude;
                    session.step = STATES.QUANTITY;
                    session.awaitingQuantityInput = true; // Set flag to wait for input

                    await sendToWhatsApp(from, "📦 Please provide the quantity (in liters) of the product.");
                } else {
                    // Only send an error message if the location prompt hasn't been sent before
                    if (!session.locationPromptSent) {
                        await sendToWhatsApp(from, "❌ Invalid input. Please share your location using WhatsApp's location feature. Tap the 📎 icon and select 'Location'.");
                        session.locationPromptSent = true; // Ensure it’s only sent once
                    }

                    console.error("Invalid input received in LONGITUDE state:", textRaw);
                }
                break;

            case STATES.QUANTITY:
                if (session.awaitingQuantityInput) {
                    session.awaitingQuantityInput = false; // Reset flag but continue processing
                }

                if (textRaw.trim() === "" || isNaN(textRaw)) {
                    await sendToWhatsApp(from, "❌ Please enter a valid quantity (numeric values only).");
                    return res.sendStatus(200);
                }

                session.data.quantity = textRaw;
                session.step = STATES.CONFIRMATION;
                sendOrderSummary(from, session);
                break;


            case STATES.CONFIRMATION:
                // Ensure we only process button replies, ignore other inputs
                if (message.type === "interactive" && message.interactive.type === "button_reply") {
                    const buttonId = message.interactive.button_reply.id; // Extract button ID

                    if (buttonId === "yes_confirm") {
                        // Send data to external API
                        const requestData = {
                            user_name: session.data.name,
                            email: session.data.email,
                            phone_number: session.data.phone,
                            city: session.data.city,
                            address: session.data.address,
                            street: session.data.street,
                            building_name: session.data.building_name,
                            flat_no: session.data.flat_no,
                            latitude: session.data.latitude,
                            longitude: session.data.longitude,
                            quantity: session.data.quantity
                        };

                        console.log('Request Data:', requestData);
                        try {
                            const response = await axios.post('https://api.lootahbiofuels.com/api/v1/whatsapp_request', requestData, {
                                headers: { 'Content-Type': 'application/json' },
                                timeout: 5000
                            });

                            if (response.status === 200) {
                                console.log('API Response:', response.data);
                                await sendToWhatsApp(from, "✅ Your request has been successfully submitted! We will contact you soon.");
                            } else {
                                console.error(`❌ API returned unexpected status code: ${response.status}`);
                                await sendToWhatsApp(from, "❌ An error occurred. Please try again later.");
                            }
                        } catch (error) {
                            if (error.response) {
                                console.error('API Error Response:', error.response.data);
                                console.error('API Status Code:', error.response.status);
                            } else {
                                console.error('Network or request error:', error.message);
                            }
                            await sendToWhatsApp(from, "❌ An error occurred while submitting your request. Please try again later.");
                        }
                        delete userSessions[from];

                    } else if (buttonId === "no_correct") {
                        session.step = STATES.MODIFY;
                        await sendToWhatsApp(from, "Which information would you like to modify? Please reply with the corresponding number:\n\n1. Name\n2. Phone Number\n3. Email\n4. Address\n5. City\n6. Street\n7. Building Name\n8. Flat Number\n9. Location\n10. Quantity");
                    }
                }
                break;

            case STATES.MODIFY:
                // Convert any Arabic digits in the text to English digits
                const normalizedText = convertArabicNumbers(text);
                const fieldToModify = parseInt(normalizedText);
                if (isNaN(fieldToModify) || fieldToModify < 1 || fieldToModify > 11) {
                    await sendToWhatsApp(from, "❌ Invalid option. Please choose a number between 1 and 11.");
                    return res.sendStatus(200);
                }

                const fieldMap = {
                    1: "name",
                    2: "phone",
                    3: "email",
                    4: "address",
                    5: "city",
                    6: "street",
                    7: "building_name",
                    8: "flat_no",
                    9: "location",
                    10: "quantity"
                };

                const selectedField = fieldMap[fieldToModify];

                if (selectedField === "location") {
                    await sendToWhatsApp(from, "📍 Please share your location using WhatsApp's location feature.");
                    session.step = "MODIFY_LOCATION";
                }
                else if (selectedField === "city") {
                    await sendCitySelection(from);  // ✅ Show city selection directly
                    session.step = "MODIFY_CITY_SELECTION";
                }
                else {
                    session.modifyField = selectedField;
                    session.step = `MODIFY_${selectedField.toUpperCase()}`;
                    await sendToWhatsApp(from, `🔹 Please provide the new value for ${selectedField.replace(/_/g, " ")}.`);
                }
                break;

            // Modification steps
            case "MODIFY_NAME":
                session.data.name = textRaw;
                session.step = STATES.CONFIRMATION;
                await sendUpdatedSummary(from, session);
                break;

            case "MODIFY_PHONE":
                if (!isValidPhone(textRaw)) {
                    await sendToWhatsApp(from, "❌ Invalid phone number, please enter a valid number.");
                    return res.sendStatus(200);
                }
                session.data.phone = formatPhoneNumber(textRaw);
                session.step = STATES.CONFIRMATION;
                await sendUpdatedSummary(from, session);
                break;

            case "MODIFY_EMAIL":
                if (!isValidEmail(textRaw)) {
                    await sendToWhatsApp(from, "❌ Invalid email address, please enter a valid one.");
                    return res.sendStatus(200);
                }
                session.data.email = textRaw;
                session.step = STATES.CONFIRMATION;
                await sendUpdatedSummary(from, session);
                break;

            case "MODIFY_ADDRESS":
                session.data.address = textRaw;
                session.step = STATES.CONFIRMATION;
                await sendUpdatedSummary(from, session);
                break;

            case "MODIFY_CITY_SELECTION":
                if (message.interactive && message.interactive.button_reply) {  // ✅ Handle button replies
                    const citySelection = message.interactive.button_reply.id;  // ✅ Get selected city ID

                    const cityMap = {
                        "abu_dhabi": "Abu Dhabi",
                        "dubai": "Dubai",
                        "sharjah": "Sharjah"
                    };

                    if (cityMap[citySelection]) {
                        session.data.city = cityMap[citySelection];  // Update the city in session data
                        session.step = STATES.CONFIRMATION;  // Transition to confirmation step after city is modified

                        // Ensure all fields are updated and send the confirmation summary
                        await sendUpdatedSummary(from, session);  // ✅ Show updated summary after modification
                    } else {
                        await sendToWhatsApp(from, "❌ Invalid selection. Please choose from the provided options.");
                        await sendCitySelection(from);  // Re-send city selection if invalid
                    }
                } else {
                    await sendToWhatsApp(from, "❌ Please select a city from the provided options.");
                    await sendCitySelection(from);  // Re-send the city selection buttons
                }
                break;

            case "MODIFY_STREET":
                session.data.street = textRaw;
                session.step = STATES.CONFIRMATION;
                await sendUpdatedSummary(from, session);
                break;

            case "MODIFY_BUILDING_NAME":
                session.data.building_name = textRaw;
                session.step = STATES.CONFIRMATION;
                await sendUpdatedSummary(from, session);
                break;

            case "MODIFY_FLAT_NO":
                session.data.flat_no = textRaw;
                session.step = STATES.CONFIRMATION;
                await sendUpdatedSummary(from, session);
                break;

            case "MODIFY_LOCATION":
                if (message.location) {
                    session.data.latitude = message.location.latitude;
                    session.data.longitude = message.location.longitude;
                    session.step = STATES.CONFIRMATION;
                    await sendUpdatedSummary(from, session);
                } else {
                    await sendToWhatsApp(from, "📍 Please share your location using WhatsApp's location feature.");
                }
                break;

            case "MODIFY_QUANTITY":
                if (isNaN(textRaw) || textRaw.trim() === "") {
                    await sendToWhatsApp(from, "❌ Please enter a valid quantity (numeric values only).");
                    return res.sendStatus(200);
                }
                session.data.quantity = textRaw;
                session.step = STATES.CONFIRMATION;
                await sendUpdatedSummary(from, session);
                break;

            default:
                await sendToWhatsApp(from, "❌ An unexpected error occurred. Please try again.");
                delete userSessions[from];
                break;
        }
        res.sendStatus(200);
    } catch (error) {
        console.error('❌ Error:', error.response?.data || error.message || error);
        res.sendStatus(500);
    }
});

app.listen(PORT, () => console.log(`🚀 Server is running on http://localhost:${PORT}`));