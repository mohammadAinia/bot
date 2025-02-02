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

dotenv.config(); // ✅ تحميل متغيرات البيئة

// تحقق من المتغيرات
if (!process.env.OPENAI_API_KEY || !process.env.WHATSAPP_API_URL || !process.env.WHATSAPP_ACCESS_TOKEN) {
    console.error('❌ Missing required environment variables');
    process.exit(1);
}

const app = express();
const PORT = process.env.PORT || 5000;
app.use(bodyParser.json());

app.get('/', (req, res) => {
    res.send('Backend is running');
})

const userSessions = {};

const STATES = {
    WELCOME: 0,
    FAQ: "faq",
    NAME: 1,
    PHONE_CONFIRM: "phone_confirm",
    PHONE_INPUT: "phone_input",
    EMAIL: 3,
    ADDRESS: 4,
    CITY: 7,  // Existing state for city input
    LABEL: 8,  // New state for label input
    STREET: 9,  // New state for street input
    BUILDING_NAME: 10,  // New state for building name
    FLAT_NO: 11,  // New state for flat number
    LATITUDE: 12,  // New state for latitude
    LONGITUDE: 13,  // New state for longitude
    QUANTITY: 6,  // State for entering quantity
    CONFIRMATION: 5  // State for confirming the order
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

// // دالة لإرسال رسالة إلى OpenAI مع توجيه الأسئلة ضمن نطاق الشركة
const getOpenAIResponse = async (userMessage) => {
    try {
        const companyWebsite = "https://www.google.com/maps?q=33.5150,36.2910"; // Replace with the actual website
        const response = await axios.post('https://api.openai.com/v1/chat/completions', {
            model: "gpt-4",
            messages: [
                {
                    role: "system",
                    content: `🌟 Welcome to Mohammed Oil Refining Company 🌟  
                                The company specializes in oil re-refining, and working hours are from Sunday to Thursday, 9 AM to 2 PM.  
                                You are the company's virtual assistant, and your task is to answer only questions related to the company, such as services, prices, or oil disposal requests.  
                                If the question is not related to the company, respond with: "❌ Sorry, I can only answer questions related to our company's services."  

                                You can find more information on our website: ${companyWebsite}`
                },
                {
                    role: "user",
                    content: userMessage
                }
            ],
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

const isValidEmail = (email) => {
    const regex = /^\S+@\S+\.\S+$/;
    return regex.test(email);
};

const isValidPhone = (phone) => {
    const regex = /^[0-9]{10,15}$/; // تعديل هذا التعبير ليناسب تنسيق أرقام بلدك
    return regex.test(phone);
};

let dataStore = [];  // Array to temporarily store data


// Receiving WhatsApp messages
const defaultWelcomeMessage = `🌟 Welcome to *Mohammed Oil Refining Company* 🌟  
                                    We offer the following services:  
                                    1️⃣ *Inquiries about our products and services*  
                                    2️⃣ *Create a new request:*  
                                       - 2.1 *Request for used oil disposal* 🛢️  
                                       - 2.2 *Purchase of refined oil* 🏭  

                                    Please send the *service number* you wish to request.`;


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
                welcomeText = `Wa Alaikum Assalam wa Rahmatullahi wa Barakatuh, welcome to *Mohammed Oil Refining Company*.
                                                                                                                                                                
                                                                                                                                                                We offer the following services:
                                                                                                                                                                
                                                                                                                                                                1️⃣ *Inquiries about our products and services*
                                                                                                                                                                
                                                                                                                                                                2️⃣ *Create a new request:*
                                                                                                                                                                   - 2.1 *Request for used oil disposal* 🛢️
                                                                                                                                                                   - 2.2 *Purchase of refined oil* 🏭
                                                                                                                                                                
                                                                                                                                                                Please send the *service number* you wish to request.`;
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
                if (text === "1") {
                    await sendToWhatsApp(from, "❓ Please send your question regarding our services or products.");
                    session.step = STATES.FAQ;
                } else if (text === "2.1") {
                    session.data.type = "Used oil disposal";
                    session.step = STATES.NAME;
                    await sendToWhatsApp(from, "🔹 Please provide your full name.");
                } else if (text === "2.2") {
                    session.data.type = "Purchase of refined oil";
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
                    return res.sendStatus(200); // Ensure no further code is executed after session deletion
                }

                const aiResponse = await getOpenAIResponse(textRaw);
                const reply = `${aiResponse}\n\nTo continue your inquiry, you can ask another question. If you want to end the conversation, please type 'thank you' or 'end chat'.`;
                await sendToWhatsApp(from, reply);
                break;

            case STATES.NAME:
                session.data.name = textRaw;
                session.step = STATES.PHONE_CONFIRM;
                await sendToWhatsApp(from, "📞 Do you want to use the number you are messaging from? (Yes/No)");
                break;

            case STATES.PHONE_CONFIRM:
                if (text.includes("yes")) {
                    session.data.phone = from;
                    session.step = STATES.EMAIL;
                    await sendToWhatsApp(from, "📧 Your current number will be used. Please provide your email address.");
                } else if (text.includes("no")) {
                    session.step = STATES.PHONE_INPUT;
                    await sendToWhatsApp(from, "📞 Please enter your contact phone number.");
                } else {
                    await sendToWhatsApp(from, "❌ Please reply with Yes or No.");
                }
                break;

            case STATES.PHONE_INPUT:
                if (!isValidPhone(textRaw)) {
                    await sendToWhatsApp(from, "❌ Invalid phone number, please enter a valid number.");
                    return res.sendStatus(200);
                }
                session.data.phone = textRaw;
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
                session.data.city = textRaw;  // Store the city
                session.step = STATES.STREET;  // Move to the street step
                await sendToWhatsApp(from, "🏠 Please provide the street name.");
                break;

            case STATES.STREET:
                session.data.street = textRaw;  // Store the street
                session.step = STATES.BUILDING_NAME;  // Move to the building name step
                await sendToWhatsApp(from, "🏢 Please provide the building name.");
                break;

            case STATES.BUILDING_NAME:
                session.data.building_name = textRaw;  // Store the building name
                session.step = STATES.FLAT_NO;  // Move to the flat number step
                await sendToWhatsApp(from, "🏠 Please provide the flat number.");
                break;

            case STATES.FLAT_NO:
                session.data.flat_no = textRaw;  // Store the flat number
                session.step = STATES.LATITUDE;  // Move to the latitude step
                await sendToWhatsApp(from, "📍 Please provide the latitude.");
                break;

            case STATES.LATITUDE:
                if (isNaN(textRaw) || textRaw.trim() === "") {
                    await sendToWhatsApp(from, "❌ Please enter a valid latitude.");
                    return res.sendStatus(200);
                }
                session.data.latitude = textRaw;  // Store the latitude
                session.step = STATES.LONGITUDE;  // Move to the longitude step
                await sendToWhatsApp(from, "📍 Please provide the longitude.");
                break;

            case STATES.LONGITUDE:
                if (isNaN(textRaw) || textRaw.trim() === "") {
                    await sendToWhatsApp(from, "❌ Please enter a valid longitude.");
                    return res.sendStatus(200);
                }
                session.data.longitude = textRaw;  // Store the longitude
                session.step = STATES.LABEL;  // Proceed to the quantity step
                await sendToWhatsApp(from, "📦 Please provide the Label.");
                break;

            case STATES.LABEL:
                session.data.label = textRaw;  // Store the label
                session.step = STATES.QUANTITY;  // Proceed to the quantity step
                await sendToWhatsApp(from, "📦 Please provide the quantity (in liters) of the product.");
                break;

            case STATES.QUANTITY:
                // التأكد من أن الكمية هي نص
                if (isNaN(textRaw) || textRaw.trim() === "") {
                    await sendToWhatsApp(from, "❌ Please enter a valid quantity (numeric values only).");
                    return res.sendStatus(200);
                }
                session.data.quantity = textRaw; // سيتم تخزين الكمية كنص
                session.step = STATES.CONFIRMATION;

                let summary = `✅ *Order Summary:*\n\n`;
                summary += `🔹 *Name:* ${session.data.name}\n`;
                summary += `📞 *Phone Number:* ${session.data.phone}\n`;
                summary += `📧 *Email:* ${session.data.email}\n`;
                summary += `📍 *Address:* ${session.data.address}\n`;
                summary += `🌆 *City:* ${session.data.city}\n`;
                summary += `🔖 *Label:* ${session.data.label}\n`;
                summary += `🏠 *Street:* ${session.data.street}\n`;  // Add street to the summary
                summary += `🏢 *Building Name:* ${session.data.building_name}\n`;  // Add building name to the summary
                summary += `🏠 *Flat Number:* ${session.data.flat_no}\n`;  // Add flat number to the summary
                summary += `📍 *Latitude:* ${session.data.latitude}\n`;  // Add latitude to the summary
                summary += `📍 *Longitude:* ${session.data.longitude}\n`;  // Add longitude to the summary
                summary += `📦 *Quantity:* ${session.data.quantity}\n`;
                summary += `🛢 *Request Type:* ${session.data.type}\n\n`;
                summary += `Is the information correct? Please reply with *Yes* or *No*`;

                await sendToWhatsApp(from, summary);
                break;

            case STATES.CONFIRMATION:
                if (text.includes("yes")) {
                    // Send the data to the external API
                    const requestData = {
                        user_name: session.data.name,
                        email: session.data.email,
                        phone_number: session.data.phone,
                        city: session.data.city,
                        label: session.data.label,
                        address: session.data.address,
                        street: session.data.street,
                        building_name: session.data.building_name,
                        flat_no: session.data.flat_no,
                        latitude: session.data.latitude,
                        longitude: session.data.longitude,
                        quantity: session.data.quantity
                        // user_name: "John Doe",
                        // email: "johndoe@example.com",
                        // phone_number: "+971 501234567",
                        // city: "Dubai",
                        // label: "Home",
                        // address: "123 Street, Downtown",
                        // street: "Main Street",
                        // building_name: "Building A",
                        // flat_no: "101",
                        // latitude: "25.276987",
                        // longitude: "55.296249",
                        // quantity: "5"
                    };

                    console.log('Request Data:', requestData); // Log request data for debugging
                    dataStore.push(requestData);

                    // try {
                    //     const response = await axios.post('https://api.lootahbiofuels.com/api/v1/whatsapp_request', requestData, {
                    //         headers: {
                    //             'Content-Type': 'application/json',
                    //             'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
                    //         },
                    //         timeout: 50000  // 5-second timeout for the request
                    //     });

                    //     if (response.status === 200) {
                    //         console.log('API Response:', response.data); // Log successful response
                    //         await sendToWhatsApp(from, "✅ Your request has been successfully submitted! We will contact you soon.");
                    //     } else {
                    //         console.error(`❌ API returned unexpected status code: ${response.status}`);
                    //         await sendToWhatsApp(from, "❌ An error occurred. Please try again later.");
                    //     }
                    // } catch (error) {
                    //     if (error.response) {
                    //         // API responded with an error code
                    //         console.error('API Error Response:', error.response.data);
                    //         console.error('API Status Code:', error.response.status);
                    //     } else {
                    //         // Other errors (like network errors)
                    //         console.error('Network or request error:', error.message);
                    //     }
                    //     await sendToWhatsApp(from, "❌ An error occurred while submitting your request. Please try again later.");
                    // }
                } else {
                    await sendToWhatsApp(from, "❌ Order has been canceled. You can retry anytime.");
                }
                delete userSessions[from];  // Clear the session after confirmation
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

//         const message = messages[0];
//         const from = message.from;
//         const textRaw = message.text?.body || "";
//         const text = textRaw.toLowerCase().trim();

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
//                 welcomeText = `Wa Alaikum Assalam wa Rahmatullahi wa Barakatuh, welcome to *Mohammed Oil Refining Company*.
                                                                                                                                                                  
//                                                                                                                                                                   We offer the following services:
                                                                                                                                                                  
//                                                                                                                                                                   1️⃣ *Inquiries about our products and services*
                                                                                                                                                                  
//                                                                                                                                                                   2️⃣ *Create a new request:*
//                                                                                                                                                                      - 2.1 *Request for used oil disposal* 🛢️
//                                                                                                                                                                      - 2.2 *Purchase of refined oil* 🏭
                                                                                                                                                                  
//                                                                                                                                                                   Please send the *service number* you wish to request.`;
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
//                 if (text === "1") {
//                     await sendToWhatsApp(from, "❓ Please send your question regarding our services or products.");
//                     session.step = STATES.FAQ;
//                 } else if (text === "2.1") {
//                     session.data.type = "Used oil disposal";
//                     session.step = STATES.NAME;
//                     await sendToWhatsApp(from, "🔹 Please provide your full name.");
//                 } else if (text === "2.2") {
//                     session.data.type = "Purchase of refined oil";
//                     session.step = STATES.NAME;
//                     await sendToWhatsApp(from, "🔹 Please provide your full name.");
//                 } else {
//                     await sendToWhatsApp(from, "❌ Invalid option, please choose a number from the list.");
//                 }
//                 break;

//             // Other states remain the same as before

//             case STATES.CONFIRMATION:
//                 if (text.includes("yes")) {
//                     // Instead of sending data to API, store it in the array
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

//                     console.log('Stored Data:', requestData); // Log stored data for debugging

//                     // Push the collected data to the dataStore array
//                     dataStore.push(requestData);

//                     // Send a confirmation message
//                     await sendToWhatsApp(from, "✅ Your request has been stored successfully! We will contact you soon.");

//                 } else {
//                     await sendToWhatsApp(from, "❌ Order has been canceled. You can retry anytime.");
//                 }
//                 delete userSessions[from];  // Clear the session after confirmation
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



