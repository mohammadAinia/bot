import dotenv from 'dotenv';
import express from 'express';
import axios from 'axios';
import bodyParser from 'body-parser';
import cors from 'cors';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

dotenv.config(); // Load environment variables

// Validate required environment variables
if (!process.env.OPENAI_API_KEY || !process.env.WHATSAPP_API_URL || !process.env.WHATSAPP_ACCESS_TOKEN) {
    console.error('❌ Missing required environment variables');
    process.exit(1);
}

const app = express();
const PORT = process.env.PORT || 5000;
const SECRET_KEY = process.env.SECRET_KEY || 'LoothTech12345';

const ADMIN_USERNAME = 'admin';
const ADMIN_PASSWORD = 'admin123';

// Middleware
app.use(cors({ origin: 'http://localhost:5173' })); // Allow requests from front-end
app.use(bodyParser.json());

// Default route
app.get('/', (req, res) => {
    res.send('Backend is running');
});

// Admin login endpoint
app.post('/admin/login', (req, res) => {
    const { username, password } = req.body;

    // Check credentials
    if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
        // Generate JWT token
        const token = jwt.sign({ username }, SECRET_KEY, { expiresIn: '1h' });
        return res.json({ token });
    }
    return res.status(401).json({ error: 'Invalid username or password' });
});

// Middleware to authenticate token
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

// VERIFY Webhook
const VERIFY_TOKEN = "Mohammad";

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

// // System message for the virtual assistant  
let systemMessage = `
"**Guidance Letter for OpenAI**  

**Company Name:** Lootah Biofuels  

**About Lootah Biofuels:**  
Lootah Biofuels was founded in 2010 in Dubai to address the growing demand for alternative fuels in the region. In alignment with the UAE’s vision for sustainable development, Lootah Biofuels aims to introduce and innovate sustainable solutions for the long-term energy requirements. By rapidly increasing production capacity, strengthening distribution channels, and redefining biodiesel quality, Lootah Biofuels continues to expand the reach of sustainable and environmentally friendly biofuels.  

**Our Mission:**  
Our mission is to deliver economic, operational, and environmental benefits for long-term customer satisfaction and sustainable growth.  

**Our Aim:**  
We aim to research, develop, and produce sustainable biofuels—clean, reliable alternatives to fossil fuels for transport that deliver real reductions in greenhouse gas emissions and help improve energy security.  

**Our Founder:**  
The CEO of Lootah Biofuels is Yousif Bin Saeed Al Lootah. A young and enthusiastic leader, Mr. Yousif Lootah oversees the daily operations of Lootah Biofuels in the UAE and globally, as well as the company’s strategic direction, growth, and expansion. With a vision for innovating sustainable solutions for long-term energy needs, Mr. Yousif Lootah launched Lootah Biofuels.  

Prior to founding Lootah Biofuels, Mr. Yousif was actively involved in sustainability initiatives such as the Green Car Program, which has significantly progressed since its inception. The initiative started with converting part of the company fleet to Compressed Natural Gas (CNG) and expanded to include hybrid, electric, biodiesel, and solar vehicles.

Mr. Yousif Lootah aims for 70% of transportation in the GCC market to come from renewable and sustainable sources by 2025. He envisions the UAE becoming the first nation in the region to mandate biofuel blends at all public stations. Many of the company’s ecological initiatives were his brainchild. Following the success of biofuel creation from waste management, Mr. Lootah recently signed agreements with educational institutions to raise awareness and provide training to the region’s youth, encouraging impactful sustainable practices.  

**Services:**  
- Biodiesel Production Plant  
- Containerized Fuel Storage Tanks  
- Biodiesel Production Plant Containerized  
- Fuel Delivery Tanks  

**UCO Division:**  
**Used Cooking Oil (UCO):**  
Lootah Biofuels has successfully developed a practical and viable solution to produce biofuel from Used Cooking Oil (UCO), resulting in a less expensive, renewable, and clean fuel. We are one of the largest UCO collectors authorized by Dubai Municipality and the only one with our own fuel outlets across Dubai.  

Key Highlights:  
- We provide financial incentives to UCO providers.  
- Our main UCO sources include restaurants, bakeries, and food chains.  
- By efficiently converting UCO waste into biofuel, we support the Municipality in preventing environmental hazards such as sewage problems.  
- As part of our Corporate Social Responsibility, we prevent UCO from re-entering the food chain by converting it into fuel.  
- UCO has the highest carbon-saving ratio among all available biodiesel feedstocks.  

**Products:**  
1. **Glycerine:**  
   Lootah Biofuels also produces glycerine, a by-product of the biodiesel production process. Glycerine is a versatile product used in various industries, including:  
   - Confectioneries  
   - Cosmetics  
   - Pharmaceuticals  
   - Tobacco  
   - Polyurethanes  
   - Alkyd resins  
   - Skincare applications (moisturizing and cleansing properties)  

2. **Biodiesel B5:**  
   Lootah Biofuels offers the UAE market an environmentally superior and performance-enhancing diesel blending agent at a competitive price. We produce Biodiesel B5, an ultra-low-sulfur diesel fuel blended with 5% biodiesel. This blend:  
   - Acts as a lubricant to reduce carbon footprint and greenhouse gas emissions.  
   - Is derived from converting used cooking oil to Biodiesel (B100) and blending it with high-quality ultra-low-sulfur petro-diesel in a 5:95 ratio.  
   - Provides an eco-friendly alternative to conventional diesel.  

For more details, visit: [Lootah Biofuels Website](https://www.lootahbiofuels.com/)  

**End of Guidance Letter**

`;

// Guidance message (initially empty, can be updated by the admin)  
let guidanceMessage = "";

// Default welcome message  
const defaultWelcomeMessage = `\ud83c\udf1f Welcome to *Lootah Biofuels Refining Company* \ud83c\udf1f\n\nYou can ask any question directly, and I will assist you. If you need further help, choose from the options below.`;

// Protected route: Get system messages  
app.get('/admin/messages', authenticateToken, (req, res) => {
    res.json({ systemMessage, guidanceMessage, defaultWelcomeMessage });
});

// Protected route: Update system and guidance messages  
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

// Protected route: Update welcome message  
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

        // Include guidance message if available
        if (guidanceMessage && guidanceMessage.trim() !== "") {
            messages.push({ role: "system", content: guidanceMessage });
        }

        // Add user message
        messages.push({ role: "user", content: userMessage });

        // Send request to OpenAI API
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


// const userSessions = {};

// const getOpenAIResponse = async (userMessage, session = null) => {
//     try {
//         const messages = [
//             {
//                 role: "system",
//                 content: systemMessage // Include company information
//             },
//             {
//                 role: "system",
//                 content: `
//                     You are a helpful assistant for Lootah Biofuels. Your task is to guide users through the process of submitting a request for Used Cooking Oil (UCO) collection.
//                     The user needs to provide the following information:
//                     - Name
//                     - Phone Number
//                     - Email Address
//                     - Full Address
//                     - City (e.g., Dubai, Sharjah, Abu Dhabi)
//                     - Street Name
//                     - Building Name
//                     - Flat Number
//                     - Location (latitude and longitude)
//                     - Quantity of oil (in liters)
//                     If the user provides any of this information, extract it and store it. If the user asks a question, answer it politely and then guide them back to the request process.
//                     Always respond in a friendly and professional tone.
//                 `
//             }
//         ];

//         // Include session data if available
//         if (session) {
//             messages.push({
//                 role: "system",
//                 content: `Current session data: ${JSON.stringify(session.data)}`
//             });
//         }

//         // Add user message
//         messages.push({ role: "user", content: userMessage });

//         // Send request to OpenAI API
//         const response = await axios.post('https://api.openai.com/v1/chat/completions', {
//             model: "gpt-4",
//             messages,
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

// const sendToWhatsApp = async (to, message) => {
//     try {
//         await axios.post(process.env.WHATSAPP_API_URL, {
//             messaging_product: 'whatsapp',
//             recipient_type: 'individual',
//             to: to,
//             type: 'text',
//             text: { body: message }
//         }, {
//             headers: {
//                 'Authorization': `Bearer ${process.env.WHATSAPP_ACCESS_TOKEN}`,
//                 'Content-Type': 'application/json'
//             }
//         });
//     } catch (error) {
//         console.error('❌ Failed to send message to WhatsApp:', error.response?.data || error.message);
//     }
// };

// function convertArabicNumbers(input) {
//     return input.replace(/[٠١٢٣٤٥٦٧٨٩]/g, d => "0123456789"["٠١٢٣٤٥٦٧٨٩".indexOf(d)]);
// }

// const isValidEmail = (email) => {
//     const regex = /^\S+@\S+\.\S+$/;
//     return regex.test(email);
// };

// const isValidPhone = (phone) => {
//     const regex = /^\+971(5\d{1}\s?\d{3}\s?\d{3}|\s?4\d{2}\s?\d{4})$/;
//     return regex.test(phone);
// };

// const sendCitySelection = async (to) => {
//     try {
//         await axios.post(process.env.WHATSAPP_API_URL, {
//             messaging_product: "whatsapp",
//             recipient_type: "individual",
//             to: to,
//             type: "interactive",
//             interactive: {
//                 type: "button",
//                 body: {
//                     text: "🌆 Please select your city:"
//                 },
//                 action: {
//                     buttons: [
//                         { type: "reply", reply: { id: "abu_dhabi", title: "Abu Dhabi" } },
//                         { type: "reply", reply: { id: "dubai", title: "Dubai" } },
//                         { type: "reply", reply: { id: "sharjah", title: "Sharjah" } }
//                     ]
//                 }
//             }
//         }, {
//             headers: {
//                 "Authorization": `Bearer ${process.env.WHATSAPP_ACCESS_TOKEN}`,
//                 "Content-Type": "application/json"
//             }
//         });
//     } catch (error) {
//         console.error("❌ Failed to send city selection:", error.response?.data || error.message);
//     }
// };

// const sendOrderSummary = async (to, session) => {
//     try {
//         let summary = `✅ *Order Summary:*\n\n`;
//         summary += `🔹 *Name:* ${session.data.name}\n`;
//         summary += `📞 *Phone Number:* ${session.data.phone}\n`;
//         summary += `📧 *Email:* ${session.data.email}\n`;
//         summary += `📍 *Address:* ${session.data.address}\n`;
//         summary += `🌆 *City:* ${session.data.city}\n`;
//         summary += `🏠 *Street:* ${session.data.street}\n`;
//         summary += `🏢 *Building Name:* ${session.data.building_name}\n`;
//         summary += `🏠 *Flat Number:* ${session.data.flat_no}\n`;
//         summary += `📍 *Latitude:* ${session.data.latitude}\n`;
//         summary += `📍 *Longitude:* ${session.data.longitude}\n`;
//         summary += `📦 *Quantity:* ${session.data.quantity}\n\n`;
//         summary += `Is the information correct? Please confirm below:`;

//         await axios.post(process.env.WHATSAPP_API_URL, {
//             messaging_product: "whatsapp",
//             recipient_type: "individual",
//             to: to,
//             type: "interactive",
//             interactive: {
//                 type: "button",
//                 body: {
//                     text: summary
//                 },
//                 action: {
//                     buttons: [
//                         { type: "reply", reply: { id: "yes_confirm", title: "Yes" } },
//                         { type: "reply", reply: { id: "no_correct", title: "No" } }
//                     ]
//                 }
//             }
//         }, {
//             headers: {
//                 "Authorization": `Bearer ${process.env.WHATSAPP_ACCESS_TOKEN}`,
//                 "Content-Type": "application/json"
//             }
//         });
//     } catch (error) {
//         console.error("❌ Failed to send order summary:", error.response?.data || error.message);
//     }
// };

// function formatPhoneNumber(phoneNumber) {
//     let cleanedNumber = phoneNumber.replace(/\D/g, "");
//     if (!cleanedNumber.startsWith("+")) {
//         cleanedNumber = `+${cleanedNumber}`;
//     }
//     const match = cleanedNumber.match(/^\+(\d{1,4})(\d+)$/);
//     if (match) {
//         return `+${match[1]} ${match[2]}`;
//     }
//     return cleanedNumber;
// }

// const STATES = {
//     WELCOME: 0,
//     FAQ: "faq",
//     NAME: 1,
//     PHONE_CONFIRM: "phone_confirm",
//     PHONE_INPUT: "phone_input",
//     EMAIL: 3,
//     ADDRESS: 4,
//     CITY: 7,
//     STREET: 9,
//     BUILDING_NAME: 10,
//     FLAT_NO: 11,
//     LATITUDE: 12,
//     LONGITUDE: 13,
//     QUANTITY: 6,
//     CONFIRMATION: 5,
//     MODIFY: "modify"
// };

// const sendUpdatedSummary = async (to, session) => {
//     try {
//         let summary = `✅ *Updated Order Summary:*\n\n`;
//         summary += `🔹 *Name:* ${session.data.name}\n`;
//         summary += `📞 *Phone Number:* ${session.data.phone}\n`;
//         summary += `📧 *Email:* ${session.data.email}\n`;
//         summary += `📍 *Address:* ${session.data.address}\n`;
//         summary += `🌆 *City:* ${session.data.city}\n`;
//         summary += `🏠 *Street:* ${session.data.street}\n`;
//         summary += `🏢 *Building Name:* ${session.data.building_name}\n`;
//         summary += `🏠 *Flat Number:* ${session.data.flat_no}\n`;
//         summary += `📍 *Latitude:* ${session.data.latitude}\n`;
//         summary += `📍 *Longitude:* ${session.data.longitude}\n`;
//         summary += `📦 *Quantity:* ${session.data.quantity}\n\n`;
//         summary += `Is the information correct? Please confirm below:`;

//         await axios.post(process.env.WHATSAPP_API_URL, {
//             messaging_product: "whatsapp",
//             recipient_type: "individual",
//             to: to,
//             type: "interactive",
//             interactive: {
//                 type: "button",
//                 body: {
//                     text: summary
//                 },
//                 action: {
//                     buttons: [
//                         { type: "reply", reply: { id: "yes_confirm", title: "✅ Yes" } },
//                         { type: "reply", reply: { id: "no_correct", title: "❌ No" } }
//                     ]
//                 }
//             }
//         }, {
//             headers: {
//                 "Authorization": `Bearer ${process.env.WHATSAPP_ACCESS_TOKEN}`,
//                 "Content-Type": "application/json"
//             }
//         });
//     } catch (error) {
//         console.error("❌ Failed to send updated order summary:", error.response?.data || error.message);
//     }
// };

// const sendInteractiveButtons = async (to, message, buttons) => {
//     await axios.post(process.env.WHATSAPP_API_URL, {
//         messaging_product: "whatsapp",
//         recipient_type: "individual",
//         to: to,
//         type: "interactive",
//         interactive: {
//             type: "button",
//             body: { text: message },
//             action: { buttons }
//         }
//     }, {
//         headers: {
//             "Authorization": `Bearer ${process.env.WHATSAPP_ACCESS_TOKEN}`,
//             "Content-Type": "application/json"
//         }
//     });
// };

// function extractQuantity(text) {
//     const match = text.match(/\b\d+\b/);
//     return match ? match[0] : null;
// }

// async function extractInformationFromText(text) {
//     const extractedData = {
//         quantity: extractQuantity(text)
//     };

//     const prompt = `
//         Extract the following information from the text and return a valid JSON object:
//         {
//           "name": "The user's full name or null",
//           "phone": "The user's phone number or null",
//           "email": "The user's email address or null",
//           "address": "The user's full address or null",
//           "city": "The user's city (e.g., Dubai, Sharjah, Abu Dhabi) or null",
//           "street": "The user's street name or null",
//           "building_name": "The user's building name or null",
//           "flat_no": "The user's flat number or null",
//           "latitude": "The user's latitude or null",
//           "longitude": "The user's longitude or null"
//         }
        
//         If any information is missing, assign null to that field.

//         Text: ${text}
//     `;

//     const aiResponse = await getOpenAIResponse(prompt);

//     try {
//         const aiExtractedData = JSON.parse(aiResponse);
//         return { ...aiExtractedData, ...extractedData };
//     } catch (error) {
//         console.error("❌ AI response parsing failed:", aiResponse);
//         return extractedData; // Fallback to basic extraction
//     }
// }

// function getMissingFields(sessionData) {
//     const requiredFields = [
//         'name', 'email', 'address', 'city',
//         'street', 'building_name', 'flat_no', 'latitude',
//         'longitude', 'quantity'
//     ];
//     const missingFields = [];

//     requiredFields.forEach(field => {
//         const value = sessionData[field];
//         if (value === null || value === undefined || value.trim() === "" || value.trim().toLowerCase() === "null") {
//             missingFields.push(field);
//         }
//     });

//     return missingFields;
// }

// async function askForNextMissingField(session, from, missingFields) {
//     if (missingFields.length === 0) {
//         session.step = STATES.CONFIRMATION;
//         return await sendOrderSummary(from, session);
//     }

//     const nextMissingField = missingFields[0];
//     session.step = `ASK_${nextMissingField.toUpperCase()}`;

//     const fieldPromptMap = {
//         name: "🔹 Please provide your full name.",
//         phone: "📞 Please provide your phone number.",
//         email: "📧 Please provide your email address.",
//         address: "📍 Please provide your full address.",
//         city: "🌆 Please provide your city.",
//         street: "🏠 Please provide your street name.",
//         building_name: "🏢 Please provide your building name.",
//         flat_no: "🏠 Please provide your flat number.",
//         latitude: "📍 Please share your location using WhatsApp's location feature.",
//         longitude: "📍 Please share your location using WhatsApp's location feature.",
//         quantity: "📦 Please provide the quantity (in liters) of the product."
//     };

//     if (fieldPromptMap[nextMissingField]) {
//         await sendToWhatsApp(from, fieldPromptMap[nextMissingField]);
//     } else {
//         console.error(`❌ No prompt found for missing field: ${nextMissingField}`);
//     }
// }

// async function isQuestion(text) {
//     const prompt = `
//         Determine if the following text is a question. Respond with "true" if it is a question, otherwise respond with "false".
//         Text: ${text}
//     `;

//     const aiResponse = await getOpenAIResponse(prompt);
//     return aiResponse.trim().toLowerCase() === "true";
// }

// app.post('/webhook', async (req, res) => {
//     try {
//         console.log('Incoming Webhook Data:', req.body);

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

//         // Initialize user session if it doesn't exist
//         if (!userSessions[from]) {
//             userSessions[from] = { step: STATES.WELCOME, data: { phone: formatPhoneNumber(from) } };

//             // Send welcome message with options
//             await sendInteractiveButtons(from, defaultWelcomeMessage, [
//                 { type: "reply", reply: { id: "contact_us", title: "📞 Contact Us" } },
//                 { type: "reply", reply: { id: "new_request", title: "📝 New Request" } }
//             ]);
//             return res.sendStatus(200);
//         }

//         const session = userSessions[from];

//         // Check if the user is asking a general question or initiating an order
//         const isGeneralQuestion = await isQuestion(textRaw);
//         const isOrderRequest = text.includes("new request") || text.includes("order") || text.includes("request");

//         if (isGeneralQuestion && !isOrderRequest) {
//             // Handle general questions
//             const aiResponse = await getOpenAIResponse(textRaw, session);
//             await sendToWhatsApp(from, aiResponse);
//             return res.sendStatus(200);
//         }

//         // If the user is initiating an order, start the order process
//         if (isOrderRequest || session.step !== STATES.WELCOME) {
//             // Extract information from the user's message
//             const extractedData = await extractInformationFromText(textRaw);
//             session.data = { ...session.data, ...extractedData };

//             // Check for missing fields
//             const missingFields = getMissingFields(session.data);

//             if (missingFields.length === 0) {
//                 // If no fields are missing, proceed to confirmation
//                 session.step = STATES.CONFIRMATION;
//                 await sendOrderSummary(from, session);
//             } else {
//                 // Ask for the next missing field
//                 const nextMissingField = missingFields[0];
//                 session.step = `ASK_${nextMissingField.toUpperCase()}`;

//                 // Send the AI response and prompt for the next missing field
//                 await sendToWhatsApp(from, `Please provide your ${nextMissingField}.`);
//             }
//         }

//         res.sendStatus(200);
//     } catch (error) {
//         console.error('❌ Error:', error.response?.data || error.message || error);
//         res.sendStatus(500);
//     }
// });
// const userSessions = {};

// const getOpenAIResponse = async (userMessage, session = null) => {
//     try {
//         const messages = [
//             {
//                 role: "system",
//                 content: `
//                     You are a helpful assistant for Lootah Biofuels. Your task is to guide users through the process of submitting a request for Used Cooking Oil (UCO) collection.

//                     The user needs to provide the following information:
//                     - Name
//                     - Phone Number
//                     - Email Address
//                     - Full Address
//                     - City (e.g., Dubai, Sharjah, Abu Dhabi)
//                     - Street Name
//                     - Building Name
//                     - Flat Number
//                     - Location (latitude and longitude)
//                     - Quantity of oil (in liters)

//                     If the user provides any of this information, extract it and store it. If the user asks a question, answer it politely and then guide them back to the request process.

//                     Always respond in a friendly and professional tone.
//                 `
//             }
//         ];

//         // Include session data if available
//         if (session) {
//             messages.push({
//                 role: "system",
//                 content: `Current session data: ${JSON.stringify(session.data)}`
//             });
//         }

//         // Add user message
//         messages.push({ role: "user", content: userMessage });

//         // Send request to OpenAI API
//         const response = await axios.post('https://api.openai.com/v1/chat/completions', {
//             model: "gpt-4",
//             messages,
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

function convertArabicNumbers(input) {
    return input.replace(/[٠١٢٣٤٥٦٧٨٩]/g, d => "0123456789"["٠١٢٣٤٥٦٧٨٩".indexOf(d)]);
}

const isValidEmail = (email) => {
    const regex = /^\S+@\S+\.\S+$/;
    return regex.test(email);
};

const isValidPhone = (phone) => {
    const regex = /^\+971(5\d{1}\s?\d{3}\s?\d{3}|\s?4\d{2}\s?\d{4})$/;
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

const sendInteractiveButtons = async (to, message, buttons) => {
    await axios.post(process.env.WHATSAPP_API_URL, {
        messaging_product: "whatsapp",
        recipient_type: "individual",
        to: to,
        type: "interactive",
        interactive: {
            type: "button",
            body: { text: message },
            action: { buttons }
        }
    }, {
        headers: {
            "Authorization": `Bearer ${process.env.WHATSAPP_ACCESS_TOKEN}`,
            "Content-Type": "application/json"
        }
    });
};

function extractQuantity(text) {
    const match = text.match(/\b\d+\b/); // Extracts only the first numeric value
    return match ? match[0] : null; // Returns the number or null if not found
}

async function extractInformationFromText(text) {
    // Extract quantity directly from the text
    const extractedData = {
        quantity: extractQuantity(text) // Use extractQuantity function
    };

    const prompt = `
        Extract the following information from the text and return a valid JSON object:
        {
          "name": "The user's full name or null",
          "phone": "The user's phone number or null",
          "email": "The user's email address or null",
          "address": "The user's full address or null",
          "city": "The user's city (e.g., Dubai, Sharjah, Abu Dhabi) or null",
          "street": "The user's street name or null",
          "building_name": "The user's building name or null",
          "flat_no": "The user's flat number or null",
          "latitude": "The user's latitude or null",
          "longitude": "The user's longitude or null"
        }
        
        If any information is missing, assign null to that field.

        Text: ${text}
    `;

    const aiResponse = await getOpenAIResponse(prompt);

    try {
        const aiExtractedData = JSON.parse(aiResponse);
        return { ...aiExtractedData, ...extractedData }; // Merge AI-extracted data with manually extracted quantity
    } catch (e) {
        console.error("❌ Failed to parse AI response as JSON:", aiResponse);
        return extractedData; // Return at least the manually extracted data
    }
}


function getMissingFields(sessionData) {
    const requiredFields = [
        'name', 'email', 'address', 'city',
        'street', 'building_name', 'flat_no', 'latitude',
        'longitude', 'quantity'
    ];
    const missingFields = [];

    requiredFields.forEach(field => {
        const value = sessionData[field];
        if (value === null || value === undefined) {
            missingFields.push(field);
        } else if (typeof value === "string") {
            if (value.trim() === "" || value.trim().toLowerCase() === "null") {
                missingFields.push(field);
            }
        }
        // For non-string values (like numbers), assume they are valid if they are not null or undefined.
    });

    return missingFields;
}



async function askForNextMissingField(session, from, missingFields) {
    if (missingFields.length === 0) {
        session.step = STATES.CONFIRMATION;
        return await sendOrderSummary(from, session);
    }

    const nextMissingField = missingFields[0]; // Get the first missing field
    session.step = `ASK_${nextMissingField.toUpperCase()}`; // Set the step dynamically

    // Define prompts for each missing field
    const fieldPromptMap = {
        name: "🔹 Please provide your full name.",
        phone: "📞 Please provide your phone number.",
        email: "📧 Please provide your email address.",
        address: "📍 Please provide your full address.",
        city: "🌆 Please provide your city.",
        street: "🏠 Please provide your street name.",
        building_name: "🏢 Please provide your building name.",
        flat_no: "🏠 Please provide your flat number.",
        latitude: "📍 Please share your location using WhatsApp's location feature.",
        longitude: "📍 Please share your location using WhatsApp's location feature.",
        quantity: "📦 Please provide the quantity (in liters) of the product."
    };

    if (fieldPromptMap[nextMissingField]) {
        await sendToWhatsApp(from, fieldPromptMap[nextMissingField]);
    } else {
        console.error(`❌ No prompt found for missing field: ${nextMissingField}`);
    }
}
async function isQuestion(text) {
    const prompt = `
        Determine if the following text is a question. Respond with "true" if it is a question, otherwise respond with "false".
        Text: ${text}
    `;

    const aiResponse = await getOpenAIResponse(prompt);
    return aiResponse.trim().toLowerCase() === "true";
}

app.post('/webhook', async (req, res) => {
    try {
        console.log('Incoming Webhook Data:', req.body);

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

        // Initialize user session if it doesn't exist
        if (!userSessions[from]) {
            userSessions[from] = { step: STATES.WELCOME, data: { phone: formatPhoneNumber(from) } };

            // Send welcome message with options
            await sendInteractiveButtons(from, defaultWelcomeMessage, [
                { type: "reply", reply: { id: "contact_us", title: "📞 Contact Us" } },
                { type: "reply", reply: { id: "new_request", title: "📝 New Request" } }
            ]);
            return res.sendStatus(200);
        }

        const session = userSessions[from];

        // Use ChatGPT to handle the message
        const aiResponse = await getOpenAIResponse(textRaw, session);

        // Extract information from the user's message
        const extractedData = await extractInformationFromText(textRaw);
        session.data = { ...session.data, ...extractedData };

        // Check for missing fields
        const missingFields = getMissingFields(session.data);

        if (missingFields.length === 0) {
            // If no fields are missing, proceed to confirmation
            session.step = STATES.CONFIRMATION;
            await sendOrderSummary(from, session);
        } else {
            // Ask for the next missing field
            const nextMissingField = missingFields[0];
            session.step = `ASK_${nextMissingField.toUpperCase()}`;

            // Send the AI response and prompt for the next missing field
            await sendToWhatsApp(from, `${aiResponse}\n\nPlease provide your ${nextMissingField}.`);
        }

        res.sendStatus(200);
    } catch (error) {
        console.error('❌ Error:', error.response?.data || error.message || error);
        res.sendStatus(500);
    }
});

app.post('/webhook', async (req, res) => {
    try {
        console.log('Incoming Webhook Data:', req.body);

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

        // Initialize user session if it doesn't exist
        if (!userSessions[from]) {
            userSessions[from] = { step: STATES.WELCOME, data: { phone: formatPhoneNumber(from) } };

            // Send welcome message with options
            await sendInteractiveButtons(from, defaultWelcomeMessage, [
                { type: "reply", reply: { id: "contact_us", title: "📞 Contact Us" } },
                { type: "reply", reply: { id: "new_request", title: "📝 New Request" } }
            ]);
            return res.sendStatus(200);
        }

        const session = userSessions[from];

        if (!session.data.phone) {
            session.data.phone = formatPhoneNumber(from)
        }

        // Check if the user is asking a question
        const isUserAskingQuestion = await isQuestion(textRaw);

        if (isUserAskingQuestion) {
            // Answer the question using ChatGPT
            const aiResponse = await getOpenAIResponse(textRaw);

            // Send the answer to the user
            await sendToWhatsApp(from, aiResponse);

            // Remind the user to continue with the request
            const missingFields = getMissingFields(session.data);
            if (missingFields.length > 0) {
                const nextMissingField = missingFields[0];
                const fieldPromptMap = {
                    name: "🔹 Please provide your full name.",
                    phone: "📞 Please provide your phone number.",
                    email: "📧 Please provide your email address.",
                    address: "📍 Please provide your full address.",
                    city: "🌆 Please provide your city.",
                    street: "🏠 Please provide your street name.",
                    building_name: "🏢 Please provide your building name.",
                    flat_no: "🏠 Please provide your flat number.",
                    latitude: "📍 Please share your location using WhatsApp's location feature.",
                    longitude: "📍 Please share your location using WhatsApp's location feature.",
                    quantity: "📦 Please provide the quantity (in liters) of the product."
                };

                if (fieldPromptMap[nextMissingField]) {
                    await sendToWhatsApp(from, `Let’s go back to complete the request. ${fieldPromptMap[nextMissingField]}`);
                }
            }

            return res.sendStatus(200);
        }

        // Handle messages based on the current state
        switch (session.step) {
            case STATES.WELCOME:
                if (message.type === "text") {
                    const extractedData = await extractInformationFromText(textRaw);

                    // Merge extracted data into the session
                    session.data = { ...session.data, ...extractedData };

                    // Check for missing fields
                    const missingFields = getMissingFields(session.data);
                    session.data.phone = formatPhoneNumber(from);


                    if (missingFields.length === 0) {
                        // If no fields are missing, proceed to confirmation
                        session.step = STATES.CONFIRMATION;
                        await sendOrderSummary(from, session);
                    } else {
                        // Ask for the next missing field
                        await askForNextMissingField(session, from, missingFields);
                    }
                }
                break;


            //----------------------------------------------------------------------
            case STATES.NAME:
                session.data.name = textRaw;
                // The phone is already set in the session initialization
                session.step = STATES.EMAIL;
                await sendToWhatsApp(from, "📧 Please provide your email address.");
                break;

            case STATES.PHONE_INPUT:
                if (!isValidPhone(textRaw)) {
                    await sendToWhatsApp(from, "❌ Invalid phone number. Please enter a valid Emirati phone number.");
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
                    const { latitude, longitude } = message.location;

                    // UAE geographical boundaries
                    const UAE_BOUNDS = {
                        minLat: 22.5,
                        maxLat: 26.5,
                        minLng: 51.6,
                        maxLng: 56.5
                    };

                    // Validate if the location is within UAE
                    if (
                        latitude >= UAE_BOUNDS.minLat &&
                        latitude <= UAE_BOUNDS.maxLat &&
                        longitude >= UAE_BOUNDS.minLng &&
                        longitude <= UAE_BOUNDS.maxLng
                    ) {
                        session.data.latitude = latitude;
                        session.data.longitude = longitude;
                        session.step = STATES.QUANTITY;
                        session.awaitingQuantityInput = true; // Set flag to wait for input

                        await sendToWhatsApp(from, "📦 Please provide the quantity (in liters) of the product.");
                    } else {
                        await sendToWhatsApp(from, "❌ The location you shared is outside the UAE. Please send a valid location within the Emirates.");
                        console.error("Location outside UAE received:", { latitude, longitude });
                    }
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
                    const quantity = extractQuantity(textRaw);

                    if (!quantity) {
                        await sendToWhatsApp(from, "❌ Please enter a valid quantity (numeric values only).");
                        return res.sendStatus(200);
                    }

                    session.data.quantity = quantity; // Store only the number
                    session.awaitingQuantityInput = false;
                    session.step = STATES.CONFIRMATION;
                    sendOrderSummary(from, session);
                } else {
                    session.awaitingQuantityInput = true;
                    await sendToWhatsApp(from, "📦 Please enter the quantity (numeric values only).");
                }
                break;
            case "ASK_NAME": {
                session.data.name = textRaw;
                const missingAfterName = getMissingFields(session.data);
                if (missingAfterName.length === 0) {
                    session.step = STATES.CONFIRMATION;
                    await sendOrderSummary(from, session);
                } else {
                    await askForNextMissingField(session, from, missingAfterName);
                }
                break;
            }
            case "ASK_EMAIL": {
                if (!isValidEmail(textRaw)) {
                    await sendToWhatsApp(from, "❌ Invalid email address, please enter a valid one.");
                    return res.sendStatus(200);
                }
                session.data.email = textRaw;
                const missingAfterEmail = getMissingFields(session.data);
                if (missingAfterEmail.length === 0) {
                    session.step = STATES.CONFIRMATION;
                    await sendOrderSummary(from, session);
                } else {
                    await askForNextMissingField(session, from, missingAfterEmail);
                }
                break;
            }

            case "ASK_ADDRESS": {
                session.data.address = textRaw;
                const missingAfterAddress = getMissingFields(session.data);
                if (missingAfterAddress.length === 0) {
                    session.step = STATES.CONFIRMATION;
                    await sendOrderSummary(from, session);
                } else {
                    await askForNextMissingField(session, from, missingAfterAddress);
                }
                break;
            }

            case "ASK_CITY": {
                session.data.city = textRaw;
                const missingAfterCity = getMissingFields(session.data);
                if (missingAfterCity.length === 0) {
                    session.step = STATES.CONFIRMATION;
                    await sendOrderSummary(from, session);
                } else {
                    await askForNextMissingField(session, from, missingAfterCity);
                }
                break;
            }

            case "ASK_STREET": {
                session.data.street = textRaw;
                const missingAfterStreet = getMissingFields(session.data);
                if (missingAfterStreet.length === 0) {
                    session.step = STATES.CONFIRMATION;
                    await sendOrderSummary(from, session);
                } else {
                    await askForNextMissingField(session, from, missingAfterStreet);
                }
                break;
            }

            case "ASK_BUILDING_NAME": {
                session.data.building_name = textRaw;
                const missingAfterBuilding = getMissingFields(session.data);
                if (missingAfterBuilding.length === 0) {
                    session.step = STATES.CONFIRMATION;
                    await sendOrderSummary(from, session);
                } else {
                    await askForNextMissingField(session, from, missingAfterBuilding);
                }
                break;
            }

            case "ASK_FLAT_NO": {
                session.data.flat_no = textRaw;
                const missingAfterFlat = getMissingFields(session.data);
                if (missingAfterFlat.length === 0) {
                    session.step = STATES.CONFIRMATION;
                    await sendOrderSummary(from, session);
                } else {
                    await askForNextMissingField(session, from, missingAfterFlat);
                }
                break;
            }

            case "ASK_LATITUDE": {
                if (message.location) {
                    session.data.latitude = message.location.latitude;
                    session.data.longitude = message.location.longitude;
                    const missingAfterLocation = getMissingFields(session.data);
                    if (missingAfterLocation.length === 0) {
                        session.step = STATES.CONFIRMATION;
                        await sendOrderSummary(from, session);
                    } else {
                        await askForNextMissingField(session, from, missingAfterLocation);
                    }
                } else {
                    await sendToWhatsApp(from, "📍 Please share your location using WhatsApp's location feature.");
                }
                break;
            }

            case "ASK_LONGITUDE": {
                // In many cases latitude and longitude are provided together via location messages.
                if (message.location) {
                    session.data.latitude = message.location.latitude;
                    session.data.longitude = message.location.longitude;
                    const missingAfterLocation = getMissingFields(session.data);
                    if (missingAfterLocation.length === 0) {
                        session.step = STATES.CONFIRMATION;
                        await sendOrderSummary(from, session);
                    } else {
                        await askForNextMissingField(session, from, missingAfterLocation);
                    }
                } else {
                    await sendToWhatsApp(from, "📍 Please share your location using WhatsApp's location feature.");
                }
                break;
            }

            case "ASK_QUANTITY": {
                const quantity = extractQuantity(textRaw);

                if (!quantity) {
                    await sendToWhatsApp(from, "❌ Please enter a valid quantity (numeric values only).");
                    return res.sendStatus(200);
                }

                session.data.quantity = quantity; // Store only the number
                const missingAfterQuantity = getMissingFields(session.data);

                if (missingAfterQuantity.length === 0) {
                    session.step = STATES.CONFIRMATION;
                    await sendOrderSummary(from, session);
                } else {
                    await askForNextMissingField(session, from, missingAfterQuantity);
                }
                break;
            }


            // Add similar cases for other fields (ADDRESS, CITY, STREET, etc.)

            case STATES.CONFIRMATION:
                if (message.type === "interactive" && message.interactive.type === "button_reply") {
                    const buttonId = message.interactive.button_reply.id; // Extract button ID

                    if (buttonId === "yes_confirm") {
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

                                // Explicitly check for status code 422
                                if (error.response.status === 422) {
                                    await sendToWhatsApp(from, "❌ Your phone number must be Emirati to proceed with this request.");
                                } else {
                                    await sendToWhatsApp(from, "❌ An error occurred while submitting your request. Please try again later.");
                                }
                            } else {
                                console.error('Network or request error:', error.message);
                                await sendToWhatsApp(from, "❌ Unable to reach the server. Please check your internet connection and try again.");
                            }
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

            case "MODIFY_QUANTITY": {
                const quantity = extractQuantity(textRaw);

                if (!quantity) {
                    await sendToWhatsApp(from, "❌ Please enter a valid quantity (numeric values only).");
                    return res.sendStatus(200);
                }

                session.data.quantity = quantity; // Store only the number
                session.step = STATES.CONFIRMATION;
                await sendUpdatedSummary(from, session);
                break;
            }

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


// case STATES.WELCOME:
//     // If the user sends a message (not a button reply), treat it as a question
//     if (message.type === "text") {
//         const aiResponse = await getOpenAIResponse(textRaw);
//         const reply = `${aiResponse}\n\nTo complete the inquiry, you can ask other questions. If you want to submit a request or contact us, choose from the following options:`;

//         // Send the AI response with options to continue or proceed
//         await sendInteractiveButtons(from, reply, [
//             { type: "reply", reply: { id: "contact_us", title: "📞 Contact Us" } },
//             { type: "reply", reply: { id: "new_request", title: "📝 New Request" } }
//         ]);
//     } else if (message.type === "interactive" && message.interactive.type === "button_reply") {
//         const buttonId = message.interactive.button_reply.id;

//         if (buttonId === "contact_us") {
//             await sendToWhatsApp(from, "📞 You can contact us at support@example.com or call +1234567890.");
//         } else if (buttonId === "new_request") {
//             session.step = STATES.NAME;
//             await sendToWhatsApp(from, "🔹 Please provide your full name.");
//         } else {
//             await sendToWhatsApp(from, "❌ Invalid option, please select a valid button.");
//         }
//     }
//     break;