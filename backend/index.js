// import express from 'express'
// import axios from 'axios'
// import session from 'express-session';
// import dotenv from 'dotenv';
// dotenv.config(); // تحميل القيم من ملف .env


// const apiKey = process.env.OPENAI_API_KEY;
// console.log(apiKey);

// const app = express();
// const port = 5000;
// app.use(express.json()); // لدعم JSON في الطلبات


// app.use(session({
//     secret: 'Mohammed',
//     resave: false,
//     saveUninitialized: true,
//     cookie: { secure: false } // تأكد من أن الكوكي آمن في بيئة الإنتاج
// }));


// app.use(express.urlencoded({ extended: true }))



// let VERIFY_TOKEN = "Mohammad";
// const sessions = {}; // تخزين الجلسات في الذاكرة

// app.get('/webhook', (req, res) => {
//     let mode = req.query['hub.mode'];
//     let token = req.query['hub.verify_token'];
//     let challenge = req.query['hub.challenge'];

//     if (mode === "subscribe" && token === VERIFY_TOKEN) {
//         console.log("WEBHOOK_VERIFIED");
//         return res.status(200).send(challenge);
//     } else {
//         return res.sendStatus(403);
//     }
// });

// // مواعيد العمل المتاحة مع حالة التوافر
// let availableSlots = [
//     { id: 1, date: '2025-01-23', time: '09:00 AM', isAvailable: true },
//     { id: 2, date: '2025-01-23', time: '11:00 AM', isAvailable: true },
//     { id: 3, date: '2025-01-24', time: '02:00 PM', isAvailable: true },
//     { id: 4, date: '2025-01-25', time: '10:00 AM', isAvailable: true },
// ];
// // Helper function to get available slots
// const getAvailableSlots = () => {
//     return availableSlots.filter(slot => slot.isAvailable).map(slot =>
//         `Appointment #${slot.id}: Date: ${slot.date}, Time: ${slot.time}`).join('\n');
// };

// // Function to book an appointment
// app.post('/book-appointment', (req, res) => {
//     const { id } = req.body;

//     // Find the slot by ID
//     const slotIndex = availableSlots.findIndex(slot => slot.id === id && slot.isAvailable);

//     if (slotIndex === -1) {
//         return res.status(400).json({ message: 'This appointment is unavailable.' });
//     }

//     // Mark the appointment as unavailable
//     availableSlots[slotIndex].isAvailable = false;

//     res.json({ message: `Your appointment has been successfully booked: ${availableSlots[slotIndex].date} at ${availableSlots[slotIndex].time}.` });
// });



// app.get('/', (req, res) => {
//     res.send('Backend is runninggggggg');
// });

// app.post('/send-whatsapp', async (req, res) => {
//     const { to, message } = req.body;

//     // التحقق من صحة المدخلات
//     if (!to || !message) {
//         return res.status(400).json({ error: "Both 'to' (phone number) and 'message' are required." });
//     }

//     const apiUrl = process.env.WHATSAPP_API_URL;
//     const accessToken = process.env.WHATSAPP_ACCESS_TOKEN;

//     try {
//         // إعداد البيانات التي سيتم إرسالها
//         const data = {
//             messaging_product: 'whatsapp',
//             recipient_type: 'individual',
//             to: to, // رقم الهاتف المستلم بصيغة دولية
//             type: 'text',
//             text: {
//                 body: message, // نص الرسالة
//             },
//         };

//         // إجراء طلب POST إلى واجهة Meta API
//         const response = await axios.post(apiUrl, data, {
//             headers: {
//                 Authorization: `Bearer ${accessToken}`,
//                 'Content-Type': 'application/json',
//             },
//         });

//         // راقب محتوى الاستجابة من API
//         console.log(response.data);

//         res.json({
//             message: 'Message sent successfully',
//             response: response.data,
//         });
//     } catch (error) {
//         console.error('Error sending WhatsApp message:', error.response?.data || error.message);
//         res.status(500).json({ error: error.response?.data || error.message });
//     }
// });




// let currentState = {};

// // الرابط الثابت لموقع الشركة على خريطة جوجل
// const companyLocation = "https://www.google.com/maps?q=33.5150,36.2910";  // استبدل الإحداثيات بموقع شركتك الفعلي


// // إضافة شرط للتأكد من أن الإجابة لا تحتوي على كلمات تتعلق بأسئلة خارج نطاق الشركة
// const filterIrrelevantResponse = (response) => {
//     const irrelevantKeywords = ["Apple", "weather", "news", "sports"]; // كلمات غير مرتبطة بالشركة
//     for (let keyword of irrelevantKeywords) {
//         if (response.toLowerCase().includes(keyword.toLowerCase())) {
//             return "I'm sorry, I can only assist with company-related questions.";
//         }
//     }
//     return response;
// };


// app.post('/generate-response', async (req, res) => {
//     const { prompt } = req.body;

//     const companyInfo = `
//         Welcome! 👋 We are Mohamed Software Company, how can we assist you today?

//         Please choose the service you need:
//         1️⃣ General Inquiry  
//         2️⃣ Technical Support  
//         3️⃣ Appointment Booking  

//         🔹 **Our services include:**  
//         - Innovative software solutions.  
//         - Custom systems tailored to client needs.  
//         - Our working hours are from Sunday to Thursday, from 9 AM to 5 PM.  
//         - Appointments can be booked via our website or by calling 📞 123456789.  

//         ❗ **Please note:** Only answer questions related to the company. Unrelated questions will not be answered.
//     `;

//     const customizedPrompt = `${companyInfo}\n\nQuestion: ${prompt}\nAnswer:`;

//     try {
//         console.log("Sending request to OpenAI:", { prompt: prompt });

//         const response = await axios.post(
//             'https://api.openai.com/v1/chat/completions',
//             {
//                 model: 'gpt-4',
//                 messages: [
//                     { role: 'system', content: companyInfo },
//                     { role: 'user', content: prompt },
//                 ],
//                 max_tokens: 150,
//             },
//             {
//                 headers: {
//                     'Authorization': `Bearer ${apiKey}`,
//                 },
//             }
//         );

//         // الحصول على الرد المولد من OpenAI
//         let generatedResponse = response.data.choices[0].message.content.trim();

//         // فلترة الرد لضمان أنه متعلق بالشركة فقط
//         generatedResponse = filterIrrelevantResponse(generatedResponse);

//         // التحقق من طلب الموقع وإضافة الرابط إلى جوجل ماب
//         if (generatedResponse.toLowerCase().includes("location") || generatedResponse.toLowerCase().includes("where is your company")) {
//             generatedResponse += `\n📍 You can find us on Google Maps: ${companyLocation}`;
//         }

//         // إذا كان الرد يتعلق بالحجز، نعرض المواعيد المتاحة.
//         if (generatedResponse.includes("book")) {
//             const availableTimes = getAvailableSlots();

//             if (availableTimes) {
//                 generatedResponse = `Here are the available slots for booking:\n${availableTimes}\nPlease select a slot by its number.`;
//             } else {
//                 generatedResponse = "Sorry, no slots are available at the moment.";
//             }
//         }

//         // التحقق إذا كان المستخدم قد اختار موعدًا.
//         if (generatedResponse.includes("Please select a slot")) {
//             currentState = {
//                 ...currentState,
//                 waitingForSlotSelection: true,
//             };
//         }

//         res.json({ reply: generatedResponse });
//     } catch (error) {
//         console.error('Error details:', error.response?.data || error.message);
//         res.status(500).json({ error: error.response?.data || error.message });
//     }
// });







// app.post('/webhook', async (req, res) => {
//     const incomingMessage = req.body;

//     // تحقق من تنسيق البيانات المستلمة
//     console.log("Received webhook data:", incomingMessage);

//     let customerPhoneNumber;
//     let customerMessage;
//     try {
//         customerPhoneNumber = incomingMessage.entry[0].changes[0].value.messages[0].from;
//         customerMessage = incomingMessage.entry[0].changes[0].value.messages[0].text.body;

//         console.log(`Received message from: ${customerPhoneNumber}`);
//         console.log(`Message content: ${customerMessage}`);
//     } catch (error) {
//         console.error("Error parsing incoming WhatsApp message:", error.message);
//         return res.status(400).json({ error: "Invalid message format" });
//     }

//     // تحقق من وجود جلسة لهذا المستخدم
//     if (!sessions[customerPhoneNumber]) {
//         sessions[customerPhoneNumber] = { context: {}, history: [] };
//     }
//     const userSession = sessions[customerPhoneNumber];

//     userSession.history.push({ message: customerMessage, timestamp: new Date() });

//     try {
//         const openaiResponse = await axios.post('http://localhost:5000/generate-response', {
//             prompt: customerMessage,
//         });

//         let generatedResponse = openaiResponse.data.reply;

//         // إذا كانت الرسالة تشير إلى اختيار الموعد
//         if (userSession.context.waitingForSlotSelection) {
//             const selectedSlotId = parseInt(customerMessage);
//             const slotIndex = availableSlots.findIndex(slot => slot.id === selectedSlotId && slot.isAvailable);

//             if (slotIndex !== -1) {
//                 availableSlots[slotIndex].isAvailable = false;
//                 userSession.context.waitingForSlotSelection = false;
//                 await axios.post('http://localhost:5000/send-whatsapp', {
//                     to: customerPhoneNumber,
//                     message: `Your appointment has been successfully booked for ${availableSlots[slotIndex].date} at ${availableSlots[slotIndex].time}.`
//                 });
//             } else {
//                 await axios.post('http://localhost:5000/send-whatsapp', {
//                     to: customerPhoneNumber,
//                     message: 'Invalid slot selected. Please try again.'
//                 });
//             }
//         } else {
//             // إذا كانت الرسالة تحتوي على طلب لحجز موعد
//             if (generatedResponse.includes("book")) {
//                 const availableTimes = getAvailableSlots();

//                 if (availableTimes) {
//                     generatedResponse = `Here are the available slots for booking:\n${availableTimes}\nPlease select a slot by its number.`;
//                     userSession.context.waitingForSlotSelection = true; // قم بتغيير الحالة
//                 } else {
//                     generatedResponse = "Sorry, no slots are available at the moment.";
//                 }
//             }

//             // إرسال الرد عبر WhatsApp
//             await axios.post('http://localhost:5000/send-whatsapp', {
//                 to: customerPhoneNumber,
//                 message: generatedResponse,
//             });
//         }

//         res.status(200).send('Message processed successfully');
//     } catch (error) {
//         console.error('Error processing webhook message:', error.message);
//         res.status(500).json({ error: error.message });
//     }
// });


// app.listen(port, () => {
//     console.log(`Server is running on http://localhost:${port}`);
// });














// // الحجز بعد اختيار الموعد
// // app.post('/book-appointment', (req, res) => {
// //     const { id } = req.body;

// //     // تحقق إذا كان الموعد متاح
// //     const slotIndex = availableSlots.findIndex(slot => slot.id === parseInt(id) && slot.isAvailable);

// //     if (slotIndex === -1) {
// //         return res.status(400).json({ message: 'This appointment is unavailable.' });
// //     }

// //     // حجز الموعد
// //     availableSlots[slotIndex].isAvailable = false;

// //     res.json({ message: `Your appointment has been successfully booked: ${availableSlots[slotIndex].date} at ${availableSlots[slotIndex].time}.` });
// // });




// // app.post('/send-whatsapp', async (req, res) => {
// //     const { to, message } = req.body;

// //     // قيم Twilio من ملف .env
// //     const accountSid = process.env.TWILIO_ACCOUNT_SID;
// //     const authToken = process.env.TWILIO_AUTH_TOKEN;
// //     const twilioNumber = 'whatsapp:+14155238886'; // رقم Twilio المخصص لـ WhatsApp

// //     try {
// //         // إعداد Twilio client
// //         const client = require('twilio')(accountSid, authToken);

// //         // إرسال الرسالة
// //         const response = await client.messages.create({
// //             from: twilioNumber,
// //             to: `whatsapp:${to}`,
// //             body: message,
// //         });

// //         res.json({ message: 'Message sent successfully', sid: response.sid });
// //     } catch (error) {
// //         res.status(500).json({ error: error.message });
// //     }
// // });














































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
// const sendToWhatsApp = async (to, message, buttons = []) => {
//     try {
//         const payload = {
//             messaging_product: 'whatsapp',
//             recipient_type: 'individual',
//             to: to,
//             type: 'interactive',
//             interactive: {
//                 type: 'button',
//                 body: {
//                     text: message
//                 },
//                 action: {
//                     buttons: buttons.map((button, index) => ({
//                         type: 'reply',
//                         reply: {
//                             id: `btn_${index + 1}`,
//                             title: button
//                         }
//                     }))
//                 }
//             }
//         };

//         await axios.post(process.env.WHATSAPP_API_URL, payload, {
//             headers: {
//                 'Authorization': `Bearer ${process.env.WHATSAPP_ACCESS_TOKEN}`,
//                 'Content-Type': 'application/json'
//             }
//         });
//     } catch (error) {
//         console.error('❌ Failed to send message to WhatsApp:', error.response?.data || error.message);
//     }
// };

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
                type: "list",
                header: {
                    type: "text",
                    text: "🌆 City Selection"
                },
                body: {
                    text: "Please select your city from the options below:"
                },
                action: {
                    button: "Select City",
                    sections: [
                        {
                            title: "Available Cities",
                            rows: [
                                { id: "abu_dhabi", title: "Abu Dhabi" },
                                { id: "dubai", title: "Dubai" },
                                { id: "sharjah", title: "Sharjah" }
                            ]
                        }
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
    // LABEL: 8,
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
    summary += `📦 *Quantity:* ${session.data.quantity}\n`;
    summary += `Is the information correct? Please reply with *Yes* or *No*`;

    await sendToWhatsApp(to, summary);
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

        // If there is no session for the user, create one first
        if (!userSessions[from]) {
            userSessions[from] = { step: STATES.WELCOME, data: {} };

            // List of greeting phrases
            const greetings = [
                "hello", "hi", "hey", "greetings", "good day",
                "good morning", "good afternoon", "good evening"
            ];

            let isGreeting = greetings.some(greeting => text.includes(greeting));

            let welcomeText = "";
            if (isGreeting) {
                welcomeText = `Welcome to *Mohammed Oil Refining Company*.\n\nWe offer the following services:\n\n1️⃣ *Inquiries about our products and services*\n2️⃣ *Create a new request:*\n\nPlease send the *service number* you wish to request.`;
            } else {
                welcomeText = defaultWelcomeMessage;
            }
            console.log(`isGreeting: ${isGreeting} | Received text: "${text}"`);
            await sendToWhatsApp(from, welcomeText);
            return res.sendStatus(200);
        }

        const session = userSessions[from];

        // Handle messages based on the current state
        switch (session.step) {
            case STATES.WELCOME:
                if (convertArabicNumbers(text) === "1") {
                    await sendToWhatsApp(from, "❓ Please send your question regarding our services or products.");
                    session.step = STATES.FAQ;
                } else if (convertArabicNumbers(text) === "2") {
                    session.step = STATES.NAME;
                    await sendToWhatsApp(from, "🔹 Please provide your full name.");
                } else {
                    await sendToWhatsApp(from, "❌ Invalid option, please choose a number from the list.");
                }
                break;

            case STATES.FAQ:
                // List of phrases to end the conversation
                const terminationPhrases = ["thank you", "close", "end chat", "appreciate it"];
                if (terminationPhrases.some(phrase => text.includes(phrase))) {
                    await sendToWhatsApp(from, "The chat has been closed. If you need any future assistance, feel free to reach out to us.");
                    delete userSessions[from];
                    return res.sendStatus(200);
                }

                const aiResponse = await getOpenAIResponse(textRaw);
                const reply = `${aiResponse}\n\nTo continue your inquiry, you can ask another question. If you want to end the conversation, please type 'thank you' or 'end chat'.`;
                await sendToWhatsApp(from, reply);
                break;

            case STATES.NAME:
                session.data.name = textRaw;
                session.data.phone = formatPhoneNumber(from); // Automatically store the sender's number
                session.step = STATES.EMAIL;
                await sendToWhatsApp(from, "📧 Please provide your email address.");
                break;

            case STATES.PHONE_CONFIRM:
                if (text.includes("yes") || text.includes("yea")) {
                    session.data.phone = formatPhoneNumber(from);
                    session.step = STATES.EMAIL;
                    await sendToWhatsApp(from, "📧 Your current number will be used. Please provide your email address.");
                } else if (text.includes("no")) {
                    session.step = STATES.PHONE_INPUT;
                    await sendToWhatsApp(from, "📞 Please enter the phone with country code starting from +.");
                } else {
                    await sendToWhatsApp(from, "❌ Please reply with Yes or No.");
                }
                break;

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
                session.step = STATES.CITY;
                await sendToWhatsApp(from, "📦 Please provide the City.");
                break;

            case STATES.CITY:
                await sendCitySelection(from);
                session.step = STATES.CITY_SELECTION; // Use a proper state from STATES enum
                break;

            case STATES.CITY_SELECTION:
                const citySelection = textRaw.toLowerCase();
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
                    await sendToWhatsApp(from, "❌ Invalid selection. Please choose from the provided list.");
                    await sendCitySelection(from); // Re-prompt the user to select a city
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
                session.step = STATES.LATITUDE;
                await sendToWhatsApp(from, "📍 Please share your location using WhatsApp's location feature.");
                break;

            case STATES.LATITUDE:
            case STATES.LONGITUDE:
                if (message.location) {
                    session.data.latitude = message.location.latitude;
                    session.data.longitude = message.location.longitude;
                    session.step = STATES.QUANTITY;
                    await sendToWhatsApp(from, "📦 Please provide the quantity (in liters) of the product.");
                } else {
                    await sendToWhatsApp(from, "📍 Please share your location using WhatsApp's location feature.");
                }
                break;

            case STATES.QUANTITY:
                if (isNaN(textRaw) || textRaw.trim() === "") {
                    await sendToWhatsApp(from, "❌ Please enter a valid quantity (numeric values only).");
                    return res.sendStatus(200);
                }
                session.data.quantity = textRaw;
                session.step = STATES.CONFIRMATION;

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
                summary += `📦 *Quantity:* ${session.data.quantity}\n`;
                summary += `Is the information correct? Please reply with *Yes* or *No*`;

                await sendToWhatsApp(from, summary);
                break;

            case STATES.CONFIRMATION:
                if (text.includes("yes") || text.includes("yea")) {
                    // Send the data to the external API
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
                            headers: {
                                'Content-Type': 'application/json',
                            },
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
                } else if (text.includes("no")) {
                    session.step = STATES.MODIFY;
                    await sendToWhatsApp(from, "Which information would you like to modify? Please reply with the corresponding number:\n\n1. Name\n2. Phone Number\n3. Email\n4. Address\n5. City\n6. Street\n7. Building Name\n8. Flat Number\n9. Location\n10. Quantity");
                } else {
                    await sendToWhatsApp(from, "❌ Invalid input. Please reply with *Yes* or *No*.");
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
                } else {
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

            case "MODIFY_CITY":
                session.data.city = textRaw;
                session.step = STATES.CONFIRMATION;
                await sendUpdatedSummary(from, session);
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

// app.post('/webhook', async (req, res) => {
//     try {
//         console.log('Incoming Webhook Data:', req.body); // Log the incoming data for debugging

//         const entry = req.body.entry?.[0];
//         const changes = entry?.changes?.[0];
//         const value = changes?.value;
//         const messages = value?.messages;

//         if (!messages || messages.length === 0) {
//             console.log('No messages received, returning early.');
//             return res.sendStatus(200);
//         }

//         // const message = messages[0];
//         // const from = message.from;
//         // const textRaw = message.text?.body || "";
//         // const text = textRaw.toLowerCase().trim();
//         const message = messages[0];
//         const from = message.from;
//         const textRaw = message.text?.body || "";
//         // const buttonId = message.interactive?.button_reply?.id || ""; // Get button ID if clicked
//         // const text = (textRaw || buttonId).toLowerCase().trim(); // Use button ID if no text
//         const text = (textRaw).toLowerCase().trim(); // Use button ID if no text

//         console.log(`📩 New message from ${from}: ${text}`);

//         // If there is no session for the user, create one first
//         if (!userSessions[from]) {
//             userSessions[from] = { step: STATES.WELCOME, data: {} };

//             // List of greeting phrases
//             const greetings = [
//                 "hello", "hi", "hey", "greetings", "good day",
//                 "good morning", "good afternoon", "good evening"
//             ];

//             let isGreeting = greetings.some(greeting => text.includes(greeting));

//             let welcomeText = "";
//             if (isGreeting) {
//                 welcomeText = `welcome to *Mohammed Oil Refining Company*.

//                                                                                                                                                                 We offer the following services:

//                                                                                                                                                                 1️⃣ *Inquiries about our products and services*

//                                                                                                                                                                 2️⃣ *Create a new request:*


//                                                                                                                                                                 Please send the *service number* you wish to request.`;
//             } else {
//                 welcomeText = defaultWelcomeMessage;
//             }
//             console.log(`isGreeting: ${isGreeting} | Received text: "${text}"`);
//             await sendToWhatsApp(from, welcomeText);
//             return res.sendStatus(200);
//         }
//         const session = userSessions[from];

//         // Handle messages based on the current state
//         switch (session.step) {
//             case STATES.WELCOME:
//                 if (convertArabicNumbers(text) === "1") {
//                     await sendToWhatsApp(from, "❓ Please send your question regarding our services or products.");
//                     session.step = STATES.FAQ;
//                 } else if (convertArabicNumbers(text) === "2") {
//                     session.step = STATES.NAME;
//                     await sendToWhatsApp(from, "🔹 Please provide your full name.");
//                 }
//                 else {
//                     await sendToWhatsApp(from, "❌ Invalid option, please choose a number from the list.");
//                 }
//                 break;

//             case STATES.FAQ:
//                 // List of phrases to end the conversation
//                 const terminationPhrases = ["thank you", "close", "end chat", "appreciate it"];
//                 if (terminationPhrases.some(phrase => text.includes(phrase))) {
//                     await sendToWhatsApp(from, "The chat has been closed. If you need any future assistance, feel free to reach out to us.");
//                     delete userSessions[from];
//                     return res.sendStatus(200); // Ensure no further code is executed after session deletion
//                 }

//                 const aiResponse = await getOpenAIResponse(textRaw);
//                 const reply = `${aiResponse}\n\nTo continue your inquiry, you can ask another question. If you want to end the conversation, please type 'thank you' or 'end chat'.`;
//                 await sendToWhatsApp(from, reply);
//                 break;

//             case STATES.NAME:
//                 session.data.name = textRaw;
//                 session.step = STATES.PHONE_CONFIRM;
//                 await sendToWhatsApp(from, "📞 Do you want to use the number you are messaging from? (Yes/No)");
//                 break;

//             case STATES.PHONE_CONFIRM:
//                 if (text.includes("yes") || text.includes("yea")) {
//                     session.data.phone = formatPhoneNumber(from); // ✅ الرقم الآن سيكون بتنسيق "+971 501234567"
//                     session.step = STATES.EMAIL;
//                     await sendToWhatsApp(from, "📧 Your current number will be used. Please provide your email address.");
//                 } else if (text.includes("no")) {
//                     session.step = STATES.PHONE_INPUT;
//                     await sendToWhatsApp(from, "📞 Please enter the phone with country code starting from +.");
//                 } else {
//                     await sendToWhatsApp(from, "❌ Please reply with Yes or No.");
//                 }
//                 break;

//             case STATES.PHONE_INPUT:
//                 if (!isValidPhone(textRaw)) {
//                     await sendToWhatsApp(from, "❌ Invalid phone number, please enter a valid number.");
//                     return res.sendStatus(200);
//                 }
//                 session.data.phone = formatPhoneNumber(textRaw); // ✅ الآن يتم تنسيق الرقم قبل تخزينه
//                 session.step = STATES.EMAIL;
//                 await sendToWhatsApp(from, "📧 Please provide your email address.");
//                 break;

//             case STATES.EMAIL:
//                 if (!isValidEmail(textRaw)) {
//                     await sendToWhatsApp(from, "❌ Invalid email address, please enter a valid one.");
//                     return res.sendStatus(200);
//                 }
//                 session.data.email = textRaw;
//                 session.step = STATES.ADDRESS;
//                 await sendToWhatsApp(from, "📍 Please provide your full address.");
//                 break;

//             case STATES.ADDRESS:
//                 session.data.address = textRaw;
//                 session.step = STATES.CITY;
//                 await sendToWhatsApp(from, "📦 Please provide the City.");
//                 break;

//             case STATES.CITY:
//                 session.data.city = textRaw;  // Store the city
//                 session.step = STATES.STREET;  // Move to the street step
//                 await sendToWhatsApp(from, "🏠 Please provide the street name.");
//                 break;

//             case STATES.STREET:
//                 session.data.street = textRaw;  // Store the street
//                 session.step = STATES.BUILDING_NAME;  // Move to the building name step
//                 await sendToWhatsApp(from, "🏢 Please provide the building name.");
//                 break;

//             case STATES.BUILDING_NAME:
//                 session.data.building_name = textRaw;  // Store the building name
//                 session.step = STATES.FLAT_NO;  // Move to the flat number step
//                 await sendToWhatsApp(from, "🏠 Please provide the flat number.");
//                 break;

//             case STATES.FLAT_NO:
//                 session.data.flat_no = textRaw;  // Store the flat number
//                 session.step = STATES.LATITUDE;  // Move to the latitude step
//                 await sendToWhatsApp(from, "📍 Please provide the latitude.");
//                 break;

//             case STATES.LATITUDE:
//                 if (isNaN(textRaw) || textRaw.trim() === "") {
//                     await sendToWhatsApp(from, "❌ Please enter a valid latitude.");
//                     return res.sendStatus(200);
//                 }
//                 session.data.latitude = textRaw;  // Store the latitude
//                 session.step = STATES.LONGITUDE;  // Move to the longitude step
//                 await sendToWhatsApp(from, "📍 Please provide the longitude.");
//                 break;

//             case STATES.LONGITUDE:
//                 if (isNaN(textRaw) || textRaw.trim() === "") {
//                     await sendToWhatsApp(from, "❌ Please enter a valid longitude.");
//                     return res.sendStatus(200);
//                 }
//                 session.data.longitude = textRaw;  // Store the longitude
//                 session.step = STATES.LABEL;  // Proceed to the quantity step
//                 await sendToWhatsApp(from, "📦 Please provide the Label.");
//                 break;

//             case STATES.LABEL:
//                 session.data.label = textRaw;  // Store the label
//                 session.step = STATES.QUANTITY;  // Proceed to the quantity step
//                 await sendToWhatsApp(from, "📦 Please provide the quantity (in liters) of the product.");
//                 break;

//             case STATES.QUANTITY:
//                 // التأكد من أن الكمية هي نص
//                 if (isNaN(textRaw) || textRaw.trim() === "") {
//                     await sendToWhatsApp(from, "❌ Please enter a valid quantity (numeric values only).");
//                     return res.sendStatus(200);
//                 }
//                 session.data.quantity = textRaw; // سيتم تخزين الكمية كنص
//                 session.step = STATES.CONFIRMATION;

//                 let summary = `✅ *Order Summary:*\n\n`;
//                 summary += `🔹 *Name:* ${session.data.name}\n`;
//                 summary += `📞 *Phone Number:* ${session.data.phone}\n`;
//                 summary += `📧 *Email:* ${session.data.email}\n`;
//                 summary += `📍 *Address:* ${session.data.address}\n`;
//                 summary += `🌆 *City:* ${session.data.city}\n`;
//                 summary += `🔖 *Label:* ${session.data.label}\n`;
//                 summary += `🏠 *Street:* ${session.data.street}\n`;  // Add street to the summary
//                 summary += `🏢 *Building Name:* ${session.data.building_name}\n`;  // Add building name to the summary
//                 summary += `🏠 *Flat Number:* ${session.data.flat_no}\n`;  // Add flat number to the summary
//                 summary += `📍 *Latitude:* ${session.data.latitude}\n`;  // Add latitude to the summary
//                 summary += `📍 *Longitude:* ${session.data.longitude}\n`;  // Add longitude to the summary
//                 summary += `📦 *Quantity:* ${session.data.quantity}\n`;
//                 summary += `🛢 *Request Type:* ${session.data.type}\n\n`;
//                 summary += `Is the information correct? Please reply with *Yes* or *No*`;

//                 await sendToWhatsApp(from, summary);
//                 break;

//             case STATES.CONFIRMATION:
//                 if (text.includes("yes") || text.includes("yea")) {
//                     // Send the data to the external API
//                     const requestData = {
//                         user_name: session.data.name,
//                         email: session.data.email,
//                         phone_number: session.data.phone,
//                         city: session.data.city,
//                         label: session.data.label,
//                         address: session.data.address,
//                         street: session.data.street,
//                         building_name: session.data.building_name,
//                         flat_no: session.data.flat_no,
//                         latitude: session.data.latitude,
//                         longitude: session.data.longitude,
//                         quantity: session.data.quantity
//                     };

//                     console.log('Request Data:', requestData); // Log request data for debugging
//                     try {
//                         const response = await axios.post('https://api.lootahbiofuels.com/api/v1/whatsapp_request', requestData, {
//                             headers: {
//                                 'Content-Type': 'application/json',
//                             },
//                             timeout: 5000  // 5-second timeout for the request
//                         });

//                         if (response.status === 200) {
//                             console.log('API Response:', response.data); // Log successful response
//                             await sendToWhatsApp(from, "✅ Your request has been successfully submitted! We will contact you soon.");
//                         } else {
//                             console.error(`❌ API returned unexpected status code: ${response.status}`);
//                             await sendToWhatsApp(from, "❌ An error occurred. Please try again later.");
//                         }
//                     } catch (error) {
//                         if (error.response) {
//                             // API responded with an error code
//                             console.error('API Error Response:', error.response.data);
//                             console.error('API Status Code:', error.response.status);
//                         } else {
//                             // Other errors (like network errors)
//                             console.error('Network or request error:', error.message);
//                         }
//                         await sendToWhatsApp(from, "❌ An error occurred while submitting your request. Please try again later.");
//                     }
//                     delete userSessions[from];  // Clear the session after confirmation
//                 } else if (text.includes("no")) {
//                     session.step = STATES.MODIFY;
//                     await sendToWhatsApp(from, "Which information would you like to modify? Please reply with the corresponding number:\n\n1. Name\n2. Phone Number\n3. Email\n4. Address\n5. City\n6. Label\n7. Street\n8. Building Name\n9. Flat Number\n10. Latitude\n11. Longitude\n12. Quantity");
//                 } else {
//                     await sendToWhatsApp(from, "❌ Invalid input. Please reply with *Yes* or *No*.");
//                 }
//                 break;

//             case STATES.MODIFY:
//                 const fieldToModify = parseInt(text);
//                 if (isNaN(fieldToModify) || fieldToModify < 1 || fieldToModify > 12) {
//                     await sendToWhatsApp(from, "❌ Invalid option. Please choose a number between 1 and 12.");
//                     return res.sendStatus(200);
//                 }

//                 // Map the selected number to the corresponding field
//                 const fieldMap = {
//                     1: "name",
//                     2: "phone",
//                     3: "email",
//                     4: "address",
//                     5: "city",
//                     6: "label",
//                     7: "street",
//                     8: "building_name",
//                     9: "flat_no",
//                     10: "latitude",
//                     11: "longitude",
//                     12: "quantity"
//                 };

//                 const selectedField = fieldMap[fieldToModify];
//                 session.modifyField = selectedField; // Store the field to modify
//                 session.step = `MODIFY_${selectedField.toUpperCase()}`; // Transition to the specific modification step

//                 await sendToWhatsApp(from, `🔹 Please provide the new value for ${selectedField.replace(/_/g, " ")}.`);
//                 break;

//             // Add cases for each modification step
//             case "MODIFY_NAME":
//                 session.data.name = textRaw;
//                 session.step = STATES.CONFIRMATION;
//                 await sendUpdatedSummary(from, session);
//                 break;

//             case "MODIFY_PHONE":
//                 if (!isValidPhone(textRaw)) {
//                     await sendToWhatsApp(from, "❌ Invalid phone number, please enter a valid number.");
//                     return res.sendStatus(200);
//                 }
//                 session.data.phone = formatPhoneNumber(textRaw);
//                 session.step = STATES.CONFIRMATION;
//                 await sendUpdatedSummary(from, session);
//                 break;

//             case "MODIFY_EMAIL":
//                 if (!isValidEmail(textRaw)) {
//                     await sendToWhatsApp(from, "❌ Invalid email address, please enter a valid one.");
//                     return res.sendStatus(200);
//                 }
//                 session.data.email = textRaw;
//                 session.step = STATES.CONFIRMATION;
//                 await sendUpdatedSummary(from, session);
//                 break;

//             case "MODIFY_ADDRESS":
//                 session.data.address = textRaw;
//                 session.step = STATES.CONFIRMATION;
//                 await sendUpdatedSummary(from, session);
//                 break;

//             case "MODIFY_CITY":
//                 session.data.city = textRaw;
//                 session.step = STATES.CONFIRMATION;
//                 await sendUpdatedSummary(from, session);
//                 break;

//             case "MODIFY_LABEL":
//                 session.data.label = textRaw;
//                 session.step = STATES.CONFIRMATION;
//                 await sendUpdatedSummary(from, session);
//                 break;

//             case "MODIFY_STREET":
//                 session.data.street = textRaw;
//                 session.step = STATES.CONFIRMATION;
//                 await sendUpdatedSummary(from, session);
//                 break;

//             case "MODIFY_BUILDING_NAME":
//                 session.data.building_name = textRaw;
//                 session.step = STATES.CONFIRMATION;
//                 await sendUpdatedSummary(from, session);
//                 break;

//             case "MODIFY_FLAT_NO":
//                 session.data.flat_no = textRaw;
//                 session.step = STATES.CONFIRMATION;
//                 await sendUpdatedSummary(from, session);
//                 break;

//             case "MODIFY_LATITUDE":
//                 if (isNaN(textRaw) || textRaw.trim() === "") {
//                     await sendToWhatsApp(from, "❌ Please enter a valid latitude.");
//                     return res.sendStatus(200);
//                 }
//                 session.data.latitude = textRaw;
//                 session.step = STATES.CONFIRMATION;
//                 await sendUpdatedSummary(from, session);
//                 break;

//             case "MODIFY_LONGITUDE":
//                 if (isNaN(textRaw) || textRaw.trim() === "") {
//                     await sendToWhatsApp(from, "❌ Please enter a valid longitude.");
//                     return res.sendStatus(200);
//                 }
//                 session.data.longitude = textRaw;
//                 session.step = STATES.CONFIRMATION;
//                 await sendUpdatedSummary(from, session);
//                 break;

//             case "MODIFY_QUANTITY":
//                 if (isNaN(textRaw) || textRaw.trim() === "") {
//                     await sendToWhatsApp(from, "❌ Please enter a valid quantity (numeric values only).");
//                     return res.sendStatus(200);
//                 }
//                 session.data.quantity = textRaw;
//                 session.step = STATES.CONFIRMATION;
//                 await sendUpdatedSummary(from, session);
//                 break;


//             default:
//                 await sendToWhatsApp(from, "❌ An unexpected error occurred. Please try again.");
//                 delete userSessions[from];
//                 break;
//         }

//         res.sendStatus(200);
//     } catch (error) {
//         console.error('❌ Error:', error.response?.data || error.message || error);
//         res.sendStatus(500);
//     }
// });

app.listen(PORT, () => console.log(`🚀 Server is running on http://localhost:${PORT}`));






// const sendButtons = async (to, text, buttons) => {
//     const formattedButtons = buttons.map(({ id, title }) => ({
//         type: "reply",
//         reply: { id, title },
//     }));
//     const payload = {
//         messaging_product: "whatsapp",
//         recipient_type: "individual",
//         to,
//         type: "interactive",
//         interactive: {
//             type: "button",
//             body: { text },
//             action: { buttons: formattedButtons },
//         },
//     };
//     try {
//         await axios.post(
//             `${process.env.WHATSAPP_API_URL}`,
//             payload,
//             {
//                 headers: {
//                     Authorization: `Bearer ${process.env.WHATSAPP_ACCESS_TOKEN}`,
//                     "Content-Type": "application/json",
//                 },
//             }
//         );
//     } catch (error) {
//         console.error("❌ Error sending buttons:", error.response?.data || error.message);
//     }
// };

// const sendToWhatsApp = async (to, text, buttons = []) => {
//     if (buttons.length > 0) {
//         await sendButtons(to, text, buttons);
//     } else {
//         // قم بتنظيف النص هنا باستخدام trim() وتحقق من أنه ليس فارغاً
//         const cleanText = text.trim();
//         if (cleanText.length === 0) {
//             console.error("The text is empty!");
//             return; // أو يمكنك إرسال رسالة بديلة
//         }

//         const payload = {
//             messaging_product: "whatsapp",
//             recipient_type: "individual",
//             to: to,
//             type: "text",
//             text: {
//                 body: cleanText,
//             },
//         };
//         await axios.post(`${process.env.WHATSAPP_API_URL}`, payload, {
//             headers: {
//                 Authorization: `Bearer ${process.env.WHATSAPP_ACCESS_TOKEN}`,
//                 "Content-Type": "application/json",
//             },
//         });
//     }
// };



// // دالة لإرسال رسالة إلى OpenAI مع توجيه الأسئلة ضمن نطاق الشركة
// const getOpenAIResponse = async (userMessage) => {
//     try {
//         const companyWebsite = "https://www.google.com/maps?q=33.5150,36.2910"; // Replace with the actual website
//         const response = await axios.post('https://api.openai.com/v1/chat/completions', {
//             model: "gpt-4",
//             messages: [
//                 {
//                     role: "system",
//                     content: `🌟 Welcome to Mohammed Oil Refining Company 🌟
//                                 The company specializes in oil re-refining, and working hours are from Sunday to Thursday, 9 AM to 2 PM.
//                                 You are the company's virtual assistant, and your task is to answer only questions related to the company, such as services, prices, or oil disposal requests.
//                                 If the question is not related to the company, respond with: "❌ Sorry, I can only answer questions related to our company's services."

//                                 You can find more information on our website: ${companyWebsite}`
//                 },
//                 {
//                     role: "user",
//                     content: userMessage
//                 }
//             ],
//             max_tokens: 150,
//             temperature: 0.7
//         }, {
//             headers: {
//                 'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
//                 'Content-Type': 'application/json'
//             }
//         });

//         return response.data.choices[0].message.content.trim();
//     } catch (error) {
//         console.error('❌ Error with OpenAI:', error.response?.data || error.message);
//         return "❌ Sorry, an error occurred while processing your request.";
//     }
// };


// const getOpenAIResponse = async (userMessage, guidance) => {
//     try {
//         const companyWebsite = "https://www.google.com/maps?q=33.5150,36.2910"; // Replace with actual website
//         const response = await axios.post('https://api.openai.com/v1/chat/completions', {
//             model: "gpt-4",
//             messages: [
//                 {
//                     role: "system",
//                     content: `🌟 Welcome to Mohammed Oil Refining Company 🌟
//                                 The company specializes in oil re-refining, and working hours are from Sunday to Thursday, 9 AM to 2 PM.
//                                 You are the company's virtual assistant, and your task is to answer only questions related to the company, such as services, prices, or oil disposal requests.
//                                 If the question is not related to the company, respond with: "❌ Sorry, I can only answer questions related to our company's services."

//                                 `
//                 },
//                 {
//                     role: "system",
//                     content: guidance
//                 },
//                 {
//                     role: "user",
//                     content: userMessage
//                 },

//             ],
//             max_tokens: 150,
//             temperature: 0.7
//         }, {
//             headers: {
//                 'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
//                 'Content-Type': 'application/json'
//             }
//         });

//         return response.data.choices[0].message.content.trim();
//     } catch (error) {
//         console.error('❌ Error with OpenAI:', error.response?.data || error.message);
//         return "❌ Sorry, an error occurred while processing your request.";
//     }
// };

// API endpoint to receive question and guidance
// app.post('/api/ask-question', async (req, res) => {
//     const { userQuestion, guidance } = req.body;

//     if (!userQuestion || !guidance) {
//         return res.status(400).json({ error: 'Both userQuestion and guidance are required.' });
//     }

//     try {
//         const aiResponse = await getOpenAIResponse(userQuestion, guidance);

//         // Send the AI response back to the frontend
//         return res.json({ response: aiResponse });
//     } catch (error) {
//         console.error('❌ Error processing request:', error);
//         return res.status(500).json({ error: 'An error occurred while processing your request.' });
//     }
// });