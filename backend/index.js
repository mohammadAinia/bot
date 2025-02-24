import dotenv from 'dotenv';
import express from 'express';
import axios from 'axios';
import bodyParser from 'body-parser';
import cors from 'cors';
import langdetect from 'langdetect';
import fs from 'fs';
import { OpenAI } from 'openai';
import mime from 'mime-types';
import path from 'path';
import FormData from 'form-data';





dotenv.config();

if (!process.env.OPENAI_API_KEY || !process.env.WHATSAPP_API_URL || !process.env.WHATSAPP_ACCESS_TOKEN) {
    console.error('❌ Missing required environment variables');
    process.exit(1);
}
// Initialize OpenAI client
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
const PORT = process.env.PORT || 5000;
const VERIFY_TOKEN = "Mohammad";

app.use(cors());
app.use(bodyParser.json());

// Webhook verification
app.get("/webhook", (req, res) => {
    if (req.query["hub.mode"] === "subscribe" && req.query["hub.verify_token"] === VERIFY_TOKEN) {
        res.status(200).send(req.query["hub.challenge"]);
    } else {
        res.sendStatus(403);
    }
});

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

// Guidance message (initially empty, can be updated by the admin)  
let guidanceMessage = "";

const defaultWelcomeMessage = `\ud83c\udf1f Welcome to *Lootah Biofuels Refining Company* \ud83c\udf1f\n\nYou can ask any question directly, and I will assist you. If you need further help, choose from the options below.`;

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

// Truncate text function (kept separate)
const truncateTextForAudio = (text, maxWords = 75) => {
    const words = text.split(" ");
    if (words.length > maxWords) {
        return words.slice(0, maxWords).join(" ") + "...";
    }
    return text;
};

// OpenAI response function
const getOpenAIResponse = async (userMessage, context = "", language = "en") => {
    try {
        const systemMessage = `
            You are a friendly and intelligent WhatsApp assistant for Lootah Biofuels. 
            Your goal is to assist users in completing their orders and answering their questions.
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
            max_tokens: 100, // Limit the response to 100 tokens
            temperature: 0.7
        }, {
            headers: {
                'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
                'Content-Type': 'application/json'
            }
        });

        // Truncate the OpenAI response using the truncateTextForAudio function
        const responseText = response.data.choices[0].message.content.trim();
        return truncateTextForAudio(responseText, 75); // Truncate to 75 words
    } catch (error) {
        console.error('❌ Error with OpenAI:', error.response?.data || error.message);
        return "❌ Oops! Something went wrong. Please try again later.";
    }
};


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

const isValidEmail = (email) => {
    const regex = /^\S+@\S+\.\S+$/;
    return regex.test(email);
};

const isValidPhone = (phone) => {
    const regex = /^\+971(5\d{1}\s?\d{3}\s?\d{3}|\s?4\d{2}\s?\d{4})$/;
    return regex.test(phone);
};


async function sendOrderSummary(to, session) {
    try {
        // Ensure session exists
        if (!session) {
            console.error("❌ Error: session is undefined.");
            await sendToWhatsApp(to, "⚠️ Session error. Please restart the process.");
            return;
        }

        // Ensure session.data is an object, reinitialize if necessary
        if (!session.data || typeof session.data !== "object") {
            console.error("❌ Error: session.data is corrupted. Reinitializing.");
            session.data = {}; // Reset to an empty object
        }

        // Ensure language exists, default to English if undefined
        const language = session.language || 'en';

        const orderSummary = language === 'ar'
            ? `📝 *ملخص الطلب*\n
الاسم: ${session.data.name || 'غير متوفر'}
الهاتف: ${session.data.phone || 'غير متوفر'} 
البريد الإلكتروني: ${session.data.email || 'غير متوفر'}
المدينة: ${session.data.city || 'غير متوفر'}
العنوان: ${session.data.address || 'غير متوفر'}
الشارع: ${session.data.street || 'غير متوفر'}
اسم المبنى: ${session.data.building_name || 'غير متوفر'}
رقم الشقة: ${session.data.flat_no || 'غير متوفر'}
الكمية: ${session.data.quantity || 'غير متوفر'} لتر`
            : `📝 *Order Summary*\n
Name: ${session.data.name || 'Not provided'}
Phone: ${session.data.phone || 'Not provided'}
Email: ${session.data.email || 'Not provided'}
City: ${session.data.city || 'Not provided'}
Address: ${session.data.address || 'Not provided'}
Street: ${session.data.street || 'Not provided'}
Building: ${session.data.building_name || 'Not provided'}
Flat: ${session.data.flat_no || 'Not provided'}
Quantity: ${session.data.quantity || 'Not provided'} liters`;

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

        console.log("📦 Sending order summary:", orderSummary);
        await sendInteractiveButtons(to, orderSummary, confirmationButtons);

    } catch (error) {
        console.error("❌ Error sending order summary:", error);
        await sendToWhatsApp(to, "❌ An error occurred while generating your order summary.");
    }
}
const sendUpdatedSummary = async (to, session) => {
    try {
        // Ensure session exists
        if (!session) {
            console.error("❌ Error: session is undefined.");
            await sendToWhatsApp(to, "⚠️ Session error. Please restart the process.");
            return;
        }

        // Ensure session.data is an object, reinitialize if necessary
        if (!session.data || typeof session.data !== "object") {
            console.error("❌ Error: session.data is corrupted. Reinitializing.");
            session.data = {}; // Reset to an empty object
        }

        // Ensure language exists, default to English if undefined
        const language = session.language || 'en';

        const orderSummary = language === 'ar'
            ? `📝 * ملخص الطلب بعد التعديل*\n
الاسم: ${session.data.name || 'غير متوفر'}
الهاتف: ${session.data.phone || 'غير متوفر'} 
البريد الإلكتروني: ${session.data.email || 'غير متوفر'}
المدينة: ${session.data.city || 'غير متوفر'}
العنوان: ${session.data.address || 'غير متوفر'}
الشارع: ${session.data.street || 'غير متوفر'}
اسم المبنى: ${session.data.building_name || 'غير متوفر'}
رقم الشقة: ${session.data.flat_no || 'غير متوفر'}
الكمية: ${session.data.quantity || 'غير متوفر'} لتر`
            : `📝 *Summary of the Order after modification*\n
Name: ${session.data.name || 'Not provided'}
Phone: ${session.data.phone || 'Not provided'}
Email: ${session.data.email || 'Not provided'}
City: ${session.data.city || 'Not provided'}
Address: ${session.data.address || 'Not provided'}
Street: ${session.data.street || 'Not provided'}
Building: ${session.data.building_name || 'Not provided'}
Flat: ${session.data.flat_no || 'Not provided'}
Quantity: ${session.data.quantity || 'Not provided'} liters`;

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

        console.log("📦 Sending order summary:", orderSummary);
        await sendInteractiveButtons(to, orderSummary, confirmationButtons);

    } catch (error) {
        console.error("❌ Error sending order summary:", error);
        await sendToWhatsApp(to, "❌ An error occurred while generating your order summary.");
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
    MODIFY: "modify",  // New state for modification,
    CHANGE_INFO: "CHANGE_INFO",
    CHANGE_INFOO: "CHANGE_INFOO"
};

// Helper function to validate text length
const validateTextLength = (text) => {
    if (!text || typeof text !== "string" || text.trim().length === 0) {
        return false; // Text is empty or not a string
    }
    if (text.length > 1024) {
        return false; // Text exceeds the maximum length
    }
    return true;
};

// Helper function to truncate text if it exceeds the maximum length
const truncateText = (text, maxLength = 1024) => {
    return text.length > maxLength ? text.slice(0, maxLength) : text;
};

const sendInteractiveButtons = async (to, message, buttons) => {
    // Validate the message text length
    if (!validateTextLength(message)) {
        console.error("❌ Invalid message text length. Message must be between 1 and 1024 characters.");
        await sendToWhatsApp(to, "Sorry, there was an issue processing your request. Please try again.");
        return;
    }

    // Truncate the message if it exceeds 1024 characters
    const truncatedMessage = truncateText(message, 1024);

    try {
        // Construct the payload
        const payload = {
            messaging_product: "whatsapp",
            recipient_type: "individual",
            to: to,
            type: "interactive",
            interactive: {
                type: "button",
                body: { text: truncatedMessage }, // Use truncated message
                action: {
                    buttons: buttons.map(button => {
                        if (button.type === "location_request") {
                            return {
                                type: "location_request",
                                title: button.title || "📍 Send Location"
                            };
                        } else {
                            return {
                                type: "reply",
                                reply: {
                                    id: button.reply.id,
                                    title: button.reply.title
                                }
                            };
                        }
                    })
                }
            }
        };

        console.log("✅ Sending Interactive Buttons Payload:", JSON.stringify(payload, null, 2));

        // Send the payload to the WhatsApp API
        const response = await axios.post(process.env.WHATSAPP_API_URL, payload, {
            headers: {
                "Authorization": `Bearer ${process.env.WHATSAPP_ACCESS_TOKEN}`,
                "Content-Type": "application/json"
            }
        });

        console.log("✅ Interactive Buttons Response:", response.data);
    } catch (error) {
        console.error("❌ Failed to send interactive buttons:", error.response?.data || error.message);

        // Send a fallback message to the user if the request fails
        await sendToWhatsApp(to, "Sorry, there was an issue processing your request. Please try again.");
    }
};



const sendInteractiveButtons2 = async (to, message, buttons) => {
    // Validate the message text length
    if (!validateTextLength(message)) {
        console.error("❌ Invalid message text length. Message must be between 1 and 1024 characters.");
        await sendToWhatsApp(to, "Sorry, there was an issue processing your request. Please try again.");
        return;
    }

    // Truncate the message if it exceeds 1024 characters
    const truncatedMessage = truncateText(message, 1024);

    try {
        // Construct the payload
        const payload = {
            messaging_product: "whatsapp",
            recipient_type: "individual",
            to: to,
            type: "interactive",
            interactive: {
                type: "button",
                body: { text: truncatedMessage }, // Use truncated message
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

        console.log("✅ Sending Interactive Buttons Payload:", JSON.stringify(payload, null, 2));

        // Send the payload to the WhatsApp API
        const response = await axios.post(process.env.WHATSAPP_API_URL, payload, {
            headers: {
                "Authorization": `Bearer ${process.env.WHATSAPP_ACCESS_TOKEN}`,
                "Content-Type": "application/json"
            }
        });

        console.log("✅ Interactive Buttons Response:", response.data);
    } catch (error) {
        console.error("❌ Failed to send interactive buttons:", error.response?.data || error.message);

        // Send a fallback message to the user if the request fails
        await sendToWhatsApp(to, "Sorry, there was an issue processing your request. Please try again.");
    }
};


function extractQuantity(text) {
    // Match both Western Arabic (0-9) and Eastern Arabic (٠-٩) numerals
    const match = text.match(/[\d\u0660-\u0669]+/);
    if (match) {
        // Convert Eastern Arabic numerals to Western Arabic numerals
        return convertArabicNumbers(match[0]);
    }
    return null;
}

function convertArabicNumbers(arabicNumber) {
    const arabicToWestern = {
        "٠": "0", "١": "1", "٢": "2", "٣": "3", "٤": "4",
        "٥": "5", "٦": "6", "٧": "7", "٨": "8", "٩": "9"
    };
    return arabicNumber.replace(/[\u0660-\u0669]/g, d => arabicToWestern[d] || d);
}
const sendCitySelection = async (to, language) => {
    try {
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
        //
        console.log("Sending City Selection Payload:", JSON.stringify(payload, null, 2));

        const response = await axios.post(process.env.WHATSAPP_API_URL, payload, {
            headers: {
                Authorization: `Bearer ${process.env.WHATSAPP_ACCESS_TOKEN}`,
                "Content-Type": "application/json"
            }
        });

        console.log("City Selection Response:", response.data);
    } catch (error) {
        console.error("Error sending city selection:", error.response?.data || error.message);
    }
};


function extractCity(text, language = "en") {
    const cities = {
        en: ["Dubai", "Abu Dhabi", "Sharjah", "Ajman", "Ras Al Khaimah", "Fujairah", "Umm Al Quwain"],
        ar: ["دبي", "أبو ظبي", "الشارقة", "عجمان", "رأس الخيمة", "الفجيرة", "أم القيوين"]
    };

    const normalizedText = text.normalize("NFKC").toLowerCase().trim();
    console.log("Normalized user text:", normalizedText);

    for (const city of cities[language]) {
        const normalizedCity = city.normalize("NFKC").toLowerCase();
        console.log("Checking city:", normalizedCity);
        if (normalizedText.includes(normalizedCity) || normalizedText.includes(normalizedCity.replace(/\s/g, ""))) {
            console.log("Matched city:", city);
            return city;
        }
    }
    console.log("No city matched.");
    return null;
}
async function extractInformationFromText(text, language = "en") {
    // Use OpenAI for extraction
    const prompt = `
    Extract the following information from the text and return a valid JSON object:
    {
      "name": "The user's full name or null",
      "phone": "The user's phone number or null",
      "email": "The user's email address or null",
      "address": "The user's full address or null",
      "street": "The user's street name or null",
      "building_name": "The user's building name or null",
      "flat_no": "The user's flat number or null",
      "quantity": "The user's quantity (in liters) or null"
    }
    
    **Rules:**
    1. Extract the name even if it is part of a sentence (e.g., "My name is Yazan" → name: Yazan).
    2. Extract the email if it is part of a sentence (e.g., "my email is yazan@gmail.com" → email: yazan@gmail.com).
    3. Extract the quantity even if it is part of a sentence (e.g., "I have 23 liters" → quantity: 23).
    4. Extract the street name if it is part of a sentence (e.g., "I live on Main Street" → street: Main Street).
    5. Extract the apartment number if it is part of a sentence (e.g., "My flat number is 12" → flat_no: 12).
    6. If any information is missing, assign null to that field.

    **Examples:**
    1. Input: "My name is Yazan and I have 23 liters. My email is yazan@gmail.com, and I live on Main Street, flat 12."
       Output: { "name": "Yazan", "phone": null, "email": "yazan@gmail.com", "address": null, "street": "Main Street", "building_name": null, "flat_no": "12", "quantity": 23 }

    2. Input: "I am Mohammad and I have 50 liters. My phone is 0501234567."
       Output: { "name": "Mohammad", "phone": "0501234567", "email": null, "address": null, "street": null, "building_name": null, "flat_no": null, "quantity": 50 }

    3. Input: "أنا خالد ولدي 40 لتر. بريدي الإلكتروني هو khaled@gmail.com."
       Output: { "name": "خالد", "phone": null, "email": "khaled@gmail.com", "address": null, "street": null, "building_name": null, "flat_no": null, "quantity": 40 }

    4. Input: "I need a pickup for used oil."
       Output: { "name": null, "phone": null, "email": null, "address": null, "street": null, "building_name": null, "flat_no": null, "quantity": null }

    **Text:** ${text}
    `;

    const aiResponse = await getOpenAIResponse(prompt, ``, language); // Pass prompt, not textRaw

    try {
        const aiExtractedData = JSON.parse(aiResponse);
        return aiExtractedData;
    } catch (e) {
        console.error("❌ Failed to parse AI response as JSON:", aiResponse);
        return {
            name: null,
            phone: null,
            email: null,
            address: null,
            street: null,
            building_name: null,
            flat_no: null,
            quantity: null
        }; // Return an empty object if parsing fails
    }
}




// async function extractInformationFromText(text, language = "en") {
//     const extractedData = {
//         quantity: extractQuantity(text), // Extract quantity
//         city: extractCity(text, language) // Extract city
//     };

//     // Extract name using regex or simple logic
//     const nameMatch = text.match(/(?:انا|اسمي|my name is|name is)\s+([\u0600-\u06FF\s]+|[a-zA-Z\s]+)/i);
//     if (nameMatch && nameMatch[1]) {
//         extractedData.name = nameMatch[1].trim();
//     }

//     // Extract phone number using regex
//     const phoneRegex = /(?:\+971|0)?(?:5\d|4\d)\s?\d{3}\s?\d{3}/; // Matches UAE phone numbers
//     const phoneMatch = text.match(phoneRegex);
//     if (phoneMatch) {
//         extractedData.phone = formatPhoneNumber(phoneMatch[0]); // Format the phone number
//     }

//     // Use OpenAI for additional extraction
//     const prompt = `
//     Extract the following information from the text and return a valid JSON object:
//     {
//       "name": "The user's full name or null",
//       "phone": "The user's phone number or null",
//       "email": "The user's email address or null",
//       "address": "The user's full address or null",
//       "city": "The user's city (e.g., Dubai, Sharjah, Abu Dhabi) or null",
//       "street": "The user's street name or null",
//       "building_name": "The user's building name or null",
//       "flat_no": "The user's flat number or null",
//       "latitude": "The user's latitude or null",
//       "longitude": "The user's longitude or null",
//       "quantity": "The user's quantity (in liters) or null"
//     }
    
//     If any information is missing, assign null to that field.

//     **Rules for Arabic Text:**
//     1. Recognize city names in Arabic: دبي (Dubai), أبو ظبي (Abu Dhabi), الشارقة (Sharjah).
//     2. Extract names written in Arabic script.
//     3. Extract phone numbers in UAE format (e.g., +9715xxxxxxxx).

//     Text: ${text}
// `;

//     const aiResponse = await getOpenAIResponse(prompt, ``, language); // Pass prompt, not textRaw

//     try {
//         const aiExtractedData = JSON.parse(aiResponse);
//         return { ...aiExtractedData, ...extractedData };
//     } catch (e) {
//         console.error("❌ Failed to parse AI response as JSON:", aiResponse);
//         return extractedData; // Return at least the manually extracted data
//     }
// }
// async function extractInformationFromText(text, language = "en") {
//     const extractedData = {
//         quantity: extractQuantity(text), // Extract quantity
//         city: extractCity(text, language) // Extract city
//     };

//     // Extract name using regex or simple logic
//     const nameMatch = text.match(/(?:انا|اسمي|my name is|name is)\s+([\u0600-\u06FF\s]+|[a-zA-Z\s]+)/i);
//     if (nameMatch && nameMatch[1]) {
//         extractedData.name = nameMatch[1].trim();
//     }

//     // Extract phone number using regex
//     const phoneRegex = /(?:\+971|0)?(?:5\d|4\d)\s?\d{3}\s?\d{3}/; // Matches UAE phone numbers
//     const phoneMatch = text.match(phoneRegex);
//     if (phoneMatch) {
//         extractedData.phone = formatPhoneNumber(phoneMatch[0]); // Format the phone number
//     }

//     // Use OpenAI for additional extraction
//     const prompt = `
//     Extract the following information from the text and return a valid JSON object:
//     {
//       "name": "The user's full name or null",
//       "phone": "The user's phone number or null",
//       "email": "The user's email address or null",
//       "address": "The user's full address or null",
//       "city": "The user's city (e.g., Dubai, Sharjah, Abu Dhabi) or null",
//       "street": "The user's street name or null",
//       "building_name": "The user's building name or null",
//       "flat_no": "The user's flat number or null",
//       "latitude": "The user's latitude or null",
//       "longitude": "The user's longitude or null",
//       "quantity": "The user's quantity (in liters) or null"
//     }
    
//     If any information is missing, assign null to that field.

//     **Rules for Arabic Text:**
//     1. Recognize city names in Arabic: دبي (Dubai), أبو ظبي (Abu Dhabi), الشارقة (Sharjah).
//     2. Extract names written in Arabic script.
//     3. Extract phone numbers in UAE format (e.g., +9715xxxxxxxx).

//     Text: ${text}
// `;

//     const aiResponse = await getOpenAIResponse(prompt, ``, language); // Pass prompt, not textRaw

//     try {
//         const aiExtractedData = JSON.parse(aiResponse);
//         return { ...aiExtractedData, ...extractedData };
//     } catch (e) {
//         console.error("❌ Failed to parse AI response as JSON:", aiResponse);
//         return extractedData; // Return at least the manually extracted data
//     }
// }
function getMissingFields(sessionData) {
    // Define fields in the desired sequence
    const orderedFields = [
        'name',
        'phone',
        'email',
        'latitude',
        'longitude',
        'address',
        'city',
        'street',
        'building_name',
        'flat_no',
        'quantity'
    ];

    const missingFields = [];

    // Check fields in specified order
    orderedFields.forEach(field => {
        const value = sessionData[field];
        if (value === null ||
            value === undefined ||
            (typeof value === "string" &&
                (value.trim() === "" || value.trim().toLowerCase() === "null"))
        ) {
            missingFields.push(field);
        }
    });

    // Handle location fields
    if (missingFields.includes('latitude') || missingFields.includes('longitude')) {
        missingFields.push('location');
    }

    // Remove technical fields and preserve order
    return missingFields
        .filter(field => !['latitude', 'longitude'].includes(field))
        .sort((a, b) => orderedFields.indexOf(a) - orderedFields.indexOf(b));
}

async function askForNextMissingField(session, from) {
    const missingFields = getMissingFields(session.data);
    const lang = session.language; // Get current session language

    if (missingFields.length === 0) {
        session.step = STATES.CONFIRMATION;
        await sendOrderSummary(from, session);
    } else {
        const nextField = missingFields[0];
        session.step = `ASK_${nextField.toUpperCase()}`;

                // Add a reminder about cancellation
                // await sendToWhatsApp(from, lang === 'ar'
                //     ? "🔹 يمكنك إلغاء الطلب في أي وقت عن طريق كتابة 'إلغاء'."
                //     : "🔹 You can cancel your order at any time by typing 'cancel'.");

        switch (nextField) {
            case "city":
                await sendCitySelection(from, lang);
                break;
            case "email":
                await sendToWhatsApp(from, getEmailMessage(lang));
                break;
            case "name":
                await sendToWhatsApp(from, getNameMessage(lang));
                break;
            case "phone":
                await sendToWhatsApp(from, getPhoneMessage(lang));
                break;
            case "location":
                await sendToWhatsApp(from, getLocationMessage(lang));
                break;
            case "address":
                await sendToWhatsApp(from, getAddressMessage(lang));
                break;
            case "street":
                await sendToWhatsApp(from, getStreetMessage(lang));
                break;
            case "building_name":
                await sendToWhatsApp(from, getBuildingMessage(lang));
                break;
            case "flat_no":
                await sendToWhatsApp(from, getFlatMessage(lang));
                break;
            case "quantity":
                await sendQuantitySelection(from, lang);
                break;
            default:
                await sendToWhatsApp(from, lang === 'ar'
                    ? `🔹 يرجى تقديم ${nextField.replace(/_/g, " ")}`
                    : `🔹 Please provide your ${nextField.replace(/_/g, " ")}`);
                break;
        }
    }
}
//
// async function isQuestionOrRequest(text) {
//     const prompt = `
//     Classify the user's input into one of the following categories:

//     1️⃣ **"request"** → If the user is making a service request or wants to start a new request. Examples:
//        - "I want to create a request"
//        - "I want to create a new request"
//        - "I have oil I want to get rid of"
//        - "Hello, I have 50 liters of oil in Dubai"
//        - "Please collect oil from my location"
//        - "I need a pickup for used oil"
//        - "New order request"
//        - "I am Mohammad and I have 50 liters in Sharjah"
//         - "أريد إنشاء طلب جديد"
//         - "لدي زيت أريد التخلص منه"
//         - "الرجاء جمع الزيت من موقعي"
//         - "أحتاج إلى استلام الزيت المستعمل"
//         - "طلب جديد"
//         - "أنا محمد ولدي 50 لتر في الشارقة"

//     2️⃣ **"question"** → If the user is **asking for information** about the company, services, or anything general. Examples:
//        - "What services do you provide?"
//        - "How does your oil collection work?"
//        - "Where are you located?"
//        - "What is the cost of biodiesel?"

//     3️⃣ **"greeting"** → If the user is just saying hello. Examples:
//        - "Hi"
//        - "Hello"
//        - "Good morning"

//     4️⃣ **"other"** → If the input does not fit the above categories.

//     Respond ONLY with one of these words: "request", "question", "greeting", or "other".

//     **User Input:** "${text}"
// `;

//     const aiResponse = await getOpenAIResponse(prompt);
//     const response = aiResponse.trim().toLowerCase();

//     return response;
// }



// async function isQuestionOrRequest(text) {
//     const prompt = `
//     Classify the user's input into one of the following categories:

//     1️⃣ **"request"** → If the user is making a service request or wants to start a new request. Examples:
//        - "I want to create a request"
//        - "I want to create a new request"
//        - "I have oil I want to get rid of"
//        - "Hello, I have 50 liters of oil in Dubai"
//        - "Please collect oil from my location"
//        - "I need a pickup for used oil"
//        - "New order request"
//        - "I am Mohammad and I have 50 liters in Sharjah"
//         - "أريد إنشاء طلب جديد"
//         - "لدي زيت أريد التخلص منه"
//         - "الرجاء جمع الزيت من موقعي"
//         - "أحتاج إلى استلام الزيت المستعمل"
//         - "طلب جديد"
//         - "أنا محمد ولدي 50 لتر في الشارقة"

//     2️⃣ **"question"** → If the user is **asking for information** about the company, services, or anything general. Examples:
//        - "What services do you provide?"
//        - "How does your oil collection work?"
//        - "Where are you located?"
//        - "What is the cost of biodiesel?"

//     3️⃣ **"greeting"** → If the user is just saying hello. Examples:
//        - "Hi"
//        - "Hello"
//        - "Good morning"

//     4️⃣ **"answer"** → If the user is providing an answer to a specific question. Examples:
//        - "My name is John"
//        - "John"
//        - "khaled"
//        - "ahmed"
//        - "yazan"
//        - "mohammad"
//        - "ali"
//        - "my name is ayman"
//        - "mmyyttt@gmail.com"
//        - "yazan@gmail.com"
//        - "mohammaedAinia@gmail.com"


//     5️⃣ **"other"** → If the input does not fit the above categories.

//     Respond ONLY with one of these words: "request", "question", "greeting", "answer", or "other".

//     **User Input:** "${text}"
// `;

//     const aiResponse = await getOpenAIResponse(prompt);
//     const response = aiResponse.trim().toLowerCase();

//     return response;
// }


async function isQuestionOrRequest(text) {
    // Patterns for detecting answers
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/; // Basic email regex
    const namePattern = /^[A-Za-z\s]{2,30}$/; // Simple name regex (2-30 characters, letters and spaces)
    const quantityPattern = /(\d+)\s*liters?/i; // Matches "50 liters", "100 liter", etc.
    const addressPattern = /(street|st\.|avenue|ave\.|road|rd\.|building|bldg\.|flat|apartment|apt\.)/i; // Matches common address terms

    // Check if the input matches any answer pattern
    if (emailPattern.test(text)) {
        return "answer"; // Classify as answer if it's an email
    }
    if (namePattern.test(text)) {
        return "answer"; // Classify as answer if it looks like a name
    }
    if (quantityPattern.test(text)) {
        return "answer"; // Classify as answer if it's a quantity
    }
    if (addressPattern.test(text)) {
        return "answer"; // Classify as answer if it looks like an address
    }

    // If no patterns match, use the OpenAI prompt for classification
    const prompt = `
    Classify the user's input into one of the following categories:
    
    1️⃣ **"request"** → If the user is making a service request or wants to start a new request. Examples:
       - "I want to create a request"
       - "I want to create a new request"
       - "I have oil I want to get rid of"
       - "Hello, I have 50 liters of oil in Dubai"
       - "Please collect oil from my location"
       - "I need a pickup for used oil"
       - "New order request"
       - "I am Mohammad and I have 50 liters in Sharjah"
        - "أريد إنشاء طلب جديد"
        - "لدي زيت أريد التخلص منه"
        - "الرجاء جمع الزيت من موقعي"
        - "أحتاج إلى استلام الزيت المستعمل"
        - "طلب جديد"
        - "أنا محمد ولدي 50 لتر في الشارقة"
    
    2️⃣ **"question"** → If the user is **asking for information** about the company, services, or anything general. Examples:
       - "What services do you provide?"
       - "How does your oil collection work?"
       - "Where are you located?"
       - "What is the cost of biodiesel?"
    
    3️⃣ **"greeting"** → If the user is just saying hello. Examples:
       - "Hi"
       - "Hello"
       - "Good morning"
    
    4️⃣ **"answer"** → If the user is providing an answer to a specific question. Examples:
       - "My name is John"
       - "John"
       - "khaled"
       - "ahmed"
       - "yazan"
       - "mohammad"
       - "ali"
       - "my name is ayman"
       - "mmyyttt@gmail.com"
       - "yazan@gmail.com"
       - "mohammaedAinia@gmail.com"
       - "50 liters"
       - "100 liters"
       - "30 liters"
       - "My address is 123 Main Street"
       - "123 Main Street"
       - "Building 5, Flat 12"
       - "Flat 12, Building 5"
       - "My email is example@example.com"
       - "example@example.com"
       - "My quantity is 50 liters"
       - "50"
       - "100"
       - "30"
    
    5️⃣ **"other"** → If the input does not fit the above categories.
    
    Respond ONLY with one of these words: "request", "question", "greeting", "answer", or "other".

    **User Input:** "${text}"
`;

    const aiResponse = await getOpenAIResponse(prompt);
    const response = aiResponse.trim().toLowerCase();

    return response;
}

const getButtonTitle = (buttonId, language) => {
    const buttonTitles = {
        "contact_us": { en: "Contact Us", ar: "اتصل بنا" },
        "new_request": { en: "New Request", ar: "طلب جديد" },
        "send_site": { en: "Send Site", ar: "إرسال الموقع" }
    };

    return buttonTitles[buttonId]?.[language] || buttonTitles[buttonId]?.en || buttonId;
};
function getContactMessage(language) {
    return language === 'ar' ? '📞 يمكنك الاتصال بنا على support@example.com أو الاتصال على +1234567890.' : '📞 You can contact us at support@example.com or call +1234567890.';
}
function getNameMessage(language) {
    return language === 'ar' ? '🔹 يرجى تقديم اسمك الكامل.' : '🔹 Please provide your full name.';
}

function getEmailMessage(language) {
    return language === 'ar' ? '📧 يرجى تقديم عنوان بريدك الإلكتروني.' : '📧 Please provide your email address.';
}

function getInvalidOptionMessage(language) {
    return language === 'ar' ? '❌ خيار غير صالح، يرجى تحديد زر صالح.' : '❌ Invalid option, please select a valid button.';
}
function getPhoneMessage(language) {
    return language === 'ar' ? '📱 يرجى تقديم رقم هاتفك (يجب أن يكون رقم إماراتي).' : '📱 Please provide your phone number (must be a valid Emirati number).';
}

function getInvalidPhoneMessage(language) {
    return language === 'ar' ? '❌ رقم الهاتف غير صالح، يرجى إدخال رقم إماراتي صالح.' : '❌ Invalid phone number, please enter a valid Emirati number.';
}

function getAddressMessage(language) {
    return language === 'ar' ? '📍 يرجى تقديم عنوانك الكامل.' : '📍 Please provide your full address.';
}

function getCitySelectionMessage(language) {
    return language === 'ar' ? '🏙️ يرجى اختيار مدينتك من الخيارات أدناه.' : '🏙️ Please select your city from the options below.';
}

function getInvalidCityMessage(language) {
    return language === 'ar' ?
        '❌ المدينة المحددة لا تتطابق مع موقعك. يرجى اختيار المدينة الصحيحة.' :
        '❌ The selected city does not match your location. Please choose the correct city.';
}

function getStreetMessage(language) {
    return language === 'ar' ? '🏠 يرجى تقديم اسم الشارع.' : '🏠 Please provide the street name.';
}

function getBuildingMessage(language) {
    return language === 'ar' ? '🏢 يرجى تقديم اسم المبنى.' : '🏢 Please provide the building name.';
}

function getFlatMessage(language) {
    return language === 'ar' ? '🚪 يرجى تقديم رقم الشقة.' : '🚪 Please provide the flat number.';
}

const getLocationMessage = (language) => {
    return language === 'ar'
        ? "📍 يرجى مشاركة موقعك الحالي لتحديد موقعك."
        : "📍 Please share your current location to determine your site.";
};


function getQuantityMessage(language) {
    return language === 'ar' ? '📦 يرجى إدخال الكمية (باللترات).' : '📦 Please provide the quantity (in liters).';
}

function getInvalidQuantityMessage(language) {
    return language === 'ar' ? '❌ يرجى إدخال كمية صالحة (أرقام فقط).' : '❌ Please enter a valid quantity (numeric values only).';
}

function getConfirmationMessage(language) {
    return language === 'ar' ? '✅ يرجى التأكيد على صحة التفاصيل قبل الإرسال.' : '✅ Please confirm that the details are correct before submission.';
}
function getContinueMessage(language) {
    return language === 'ar' ?
        'لإكمال الاستفسار، يمكنك طرح أسئلة أخرى. إذا كنت ترغب في تقديم طلب أو الاتصال بنا، اختر من الخيارات التالية:' :
        'To complete the inquiry, you can ask other questions. If you want to submit a request or contact us, choose from the following options:';
}
function getInvalidUAERegionMessage(language) {
    return language === 'ar' ?
        '❌ الموقع الذي أرسلته خارج الإمارات. يرجى إرسال موقع داخل الإمارات.' :
        '❌ The location you shared is outside the UAE. Please send a location within the Emirates.';
}
//


//
const detectRequestStart = async (text) => {
    const prompt = `
        Determine if the user's message indicates the start of a request for Lootah Biofuels. 
        Respond with "true" if the message indicates a request start, otherwise respond with "false".

        Examples of request start:
        - "I want to create a request"
        - "I have oil I want to get rid of"
        - "Please collect oil from my location"
        - "I need a pickup for used oil"
        - "New order request"
        - "I am Mohammad and I have 50 liters in Sharjah"
        - "I am Khaled and I have 40 liters"
        - "أريد إنشاء طلب جديد"
        - "لدي زيت أريد التخلص منه"
        - "الرجاء جمع الزيت من موقعي"
        - "أحتاج إلى استلام الزيت المستعمل"
        - "طلب جديد"
        - "أنا محمد ولدي 50 لتر في الشارقة"
        - "أنا خالد ولدي 40 لتر"

        User Input: "${text}"
    `;

    const response = await getOpenAIResponse(prompt);
    return response.trim().toLowerCase() === "true";
};

function moveToNextStep(session, from) {  // ✅ Add parameters
    const missingFields = getMissingFields(session.data);
    if (missingFields.length === 0) {
        session.step = STATES.CONFIRMATION;
        sendOrderSummary(from, session);
    } else {
        session.step = `ASK_${missingFields[0].toUpperCase()}`;
        askForNextMissingField(session, from);
    }
}
const validateCityAndLocation = async (latitude, longitude, selectedCity) => {
    try {
        // If location is not available, accept the city without validation
        if (!latitude || !longitude) {
            return {
                isValid: true,
                actualCity: null
            };
        }

        // Use a geocoding API to get the city name from the latitude and longitude
        const response = await axios.get(
            `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`
        );
        const actualCity = response.data.city;

        // Normalize city names for comparison
        const normalizedSelectedCity = selectedCity.toLowerCase().trim();
        const normalizedActualCity = actualCity.toLowerCase().trim();

        // Return both the validation result and the actual city name
        return {
            isValid: normalizedSelectedCity === normalizedActualCity,
            actualCity: actualCity
        };
    } catch (error) {
        console.error("❌ Error validating city and location:", error);
        return {
            isValid: true, // Fail open
            actualCity: null
        };
    }
};

// with 532218805
async function checkUserRegistration(phoneNumber) {
    try {
        // Remove any non-numeric characters
        let cleanedNumber = phoneNumber.replace(/\D/g, '');

        // Remove country code if it's Saudi (+966 or 966) or UAE (+971 or 971)
        if (cleanedNumber.startsWith('966')) {
            cleanedNumber = cleanedNumber.slice(3); // Remove Saudi country code
        } else if (cleanedNumber.startsWith('971')) {
            cleanedNumber = cleanedNumber.slice(3); // Remove UAE country code
        }

        const response = await axios.get('https://dev.lootahbiofuels.com/api/v1/check-user', {
            headers: {
                'API-KEY': 'iUmcFyQUYa7l0u5J1aOxoGpIoh0iQSqpAlXX8Zho5vfxlTK4mXr41GvOHc4JwIkvltIUSoCDmc9VMbmJLajSIMK3NHx3M5ggaff8JMBTlZCryZlr8SmmhmYGGlmXo8uM',
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            },
            params: { phone_number: cleanedNumber }
        });

        console.log('🔹 API Response:', response.data);

        if (response.data?.exists && response.data.user) {
            const user = {
                id: response.data.user.id,
                name: response.data.user.first_name || 'User', // Use first_name or a default value
                email: response.data.user.email,
                phone: response.data.user.phone_number,
                city: response.data.addresses?.city,
                address: response.data.addresses?.address,
                street: response.data.addresses?.street,
                building_name: response.data.addresses?.building_name,
                flat_no: response.data.addresses?.flat_no,
                latitude: response.data.addresses?.latitude,
                longitude: response.data.addresses?.longitude
            };
            return user;
        } else {
            return null; // Explicitly return null if not registered
        }
    } catch (error) {
        console.error('❌ Error checking user registration:', error);
        if (error.response) {
            console.error('❌ API Error Response:', error.response.data);
            console.error('❌ API Status Code:', error.response.status);
        }
        return null;
    }
}

async function getAddressFromCoordinates(latitude, longitude) {
    try {
        const response = await axios.get(`https://nominatim.openstreetmap.org/reverse`, {
            params: { lat: latitude, lon: longitude, format: "json" }
        });

        if (response.data && response.data.address) {
            console.log("🔍 Address API Response:", response.data.address); // Debugging

            return formatAddress(response.data.address);
        }
        return null;
    } catch (error) {
        console.error("❌ Reverse Geocoding Error:", error);
        return null;
    }
}


// Function to format the address into a readable string
function formatAddress(address) {
    const street = address.road || address.street || address.neighbourhood || address.suburb || "";
    const city = address.city || address.town || address.village || address.state || "";
    const country = address.country || "";

    return [street, city, country].filter(Boolean).join(", "); // Join non-empty parts
}

function extractStreetName(address) {
    if (!address) return "Unknown Street";

    // Prioritize main street-related fields
    return address.road ||
        address.street ||
        address.residential || // Sometimes used in residential areas
        address.neighbourhood ||
        address.suburb ||
        address.city_district || // Extra fallback for districts
        "Unknown Street";
}
async function sendQuantitySelection(user, language) {
    const message = language === "ar"
        ? "🛢️ يرجى اختيار كمية الزيت أو إدخالها يدويًا:"
        : "🛢️ Please select the oil quantity or enter manually:";

    const buttons = [
        { id: "10", title: "10 Liters" },
        { id: "15", title: "15 Liters" },
        { id: "20", title: "20 Liters" }
    ];

    console.log("🔹 Sending interactive buttons for quantity selection...");
    await sendInteractiveButtons2(user, message, buttons);
}

// Function to validate and extract a single emoji
const extractSingleEmoji = (text) => {
    // Match a single emoji using a regex pattern
    const emojiRegex = /\p{Emoji}/u;
    const match = text.match(emojiRegex);
    return match ? match[0] : "👍"; // Default to "👍" if no valid emoji is found
};

// Function to get an emoji reaction based on the user's message
const getEmojiReaction = async (userMessage, language = "en") => {
    try {
        const systemMessage = `
            You are an emoji reaction generator. Based on the user's message, suggest an appropriate emoji reaction.
            Your response should ONLY contain the emoji, nothing else.
            Examples:
            - If the user says "thank you", respond with "❤️".
            - If the user says "hello" or "hi", respond with "👋".
            - If the user provides information, respond with "👍".
            - If the user seems confused, respond with "🤔".
            - If the user is happy, respond with "😊".
            - If the user is upset, respond with "😔".
            - If the user is joking, respond with "😂".
            - If the user is asking for help, respond with "🆘".
            - If the user is excited, respond with "🎉".
            - If the user is neutral, respond with "👍".
        `;

        const response = await getOpenAIResponse(userMessage, systemMessage, language);
        const emoji = extractSingleEmoji(response.trim()); // Extract a single emoji
        return emoji;
    } catch (error) {
        console.error('❌ Error getting emoji reaction:', error);
        return "👍"; // Default emoji if something goes wrong
    }
};

// Function to send a reaction (emoji) to a message
const sendReaction = async (to, messageId, emoji) => {
    try {
        await axios.post(process.env.WHATSAPP_API_URL, {
            messaging_product: 'whatsapp',
            recipient_type: 'individual',
            to: to,
            type: 'reaction',
            reaction: {
                message_id: messageId,
                emoji: emoji
            }
        }, {
            headers: {
                'Authorization': `Bearer ${process.env.WHATSAPP_ACCESS_TOKEN}`,
                'Content-Type': 'application/json'
            }
        });
    } catch (error) {
        console.error('❌ Failed to send reaction:', error.response?.data || error.message);
    }
};

// Function to validate a URL
const isValidUrl = (url) => {
    try {
        new URL(url); // This will throw an error if the URL is invalid
        return true;
    } catch (error) {
        return false;
    }
};

// Function to download a file from a URL
const downloadFile = async (url, filePath) => {
    const response = await axios({
        url,
        method: 'GET',
        responseType: 'stream',
        headers: {
            'Authorization': `Bearer ${process.env.WHATSAPP_ACCESS_TOKEN}`,
        },
    });
    const writer = fs.createWriteStream(filePath);
    response.data.pipe(writer);
    return new Promise((resolve, reject) => {
        writer.on('finish', resolve);
        writer.on('error', reject);
    });
};

// Function to transcribe a voice file using OpenAI's Whisper API
const transcribeVoiceMessage = async (filePath) => {
    try {
        const transcription = await openai.audio.transcriptions.create({
            file: fs.createReadStream(filePath),
            model: "whisper-1",
        });
        return transcription.text;
    } catch (error) {
        console.error('❌ Error transcribing voice message:', error);
        return null;
    }
};

const fetchMediaUrl = async (mediaId) => {
    try {
        const response = await axios.get(`https://graph.facebook.com/v19.0/${mediaId}`, {
            headers: {
                'Authorization': `Bearer ${process.env.WHATSAPP_ACCESS_TOKEN}`,
            },
        });
        return response.data.url; // Returns the URL of the media file
    } catch (error) {
        console.error('❌ Error fetching media URL:', error.response?.data || error.message);
        return null;
    }
};

const generateAudio = async (text, filePath) => {
    try {
        const mp3 = await openai.audio.speech.create({
            model: "tts-1",
            voice: "alloy", // Options: alloy, echo, fable, onyx, nova, shimmer
            input: text,
        });

        const buffer = Buffer.from(await mp3.arrayBuffer());
        fs.writeFileSync(filePath, buffer);
        console.log("🔹 Audio file generated successfully:", filePath);

        // Check MIME type of the generated file
        const mimeType = mime.lookup(filePath);
        if (mimeType !== "audio/mpeg") {
            console.error("❌ Invalid file format. Expected audio/mpeg, got:", mimeType);
            throw new Error("Invalid file format");
        }

        return filePath;
    } catch (error) {
        console.error("❌ Error generating audio:", error);
        throw error;
    }
};
const uploadMediaToWhatsApp = async (filePath) => {
    try {
        // Check file format
        const mimeType = mime.lookup(filePath);
        if (mimeType !== "audio/mpeg") {
            console.error("❌ Invalid file format. Expected audio/mpeg, got:", mimeType);
            throw new Error("Invalid file format");
        }

        // Check file size
        const fileStats = fs.statSync(filePath);
        const fileSizeInMB = fileStats.size / (1024 * 1024);
        if (fileSizeInMB > 16) {
            console.error("❌ File size exceeds WhatsApp's limit (16 MB):", fileSizeInMB);
            throw new Error("File size too large");
        }

        // Read file content
        const fileContent = fs.readFileSync(filePath);

        // Create FormData
        const formData = new FormData();
        formData.append("file", fileContent, {
            filename: path.basename(filePath), // Use path.basename to get the filename
            contentType: "audio/mpeg",
        });
        formData.append("messaging_product", "whatsapp");
        formData.append("type", "audio/mpeg");

        // Upload file to WhatsApp
        const response = await axios.post(
            `https://graph.facebook.com/v20.0/${process.env.PHONE_NUMBER_ID}/media`,
            formData,
            {
                headers: {
                    ...formData.getHeaders(),
                    "Authorization": `Bearer ${process.env.WHATSAPP_ACCESS_TOKEN}`,
                },
            }
        );

        console.log("✅ Media uploaded to WhatsApp:", response.data);
        return response.data.id; // Return the media ID
    } catch (error) {
        console.error("❌ Error uploading media to WhatsApp:", {
            message: error.message,
            response: error.response?.data,
            stack: error.stack,
        });
        throw error;
    }
};

const sendAudioUsingMediaId = async (to, mediaId) => {
    try {
        const payload = {
            messaging_product: "whatsapp",
            recipient_type: "individual",
            to: to,
            type: "audio",
            audio: {
                id: mediaId, // Use the media ID instead of a URL
            },
        };

        const response = await axios.post(process.env.WHATSAPP_API_URL, payload, {
            headers: {
                "Authorization": `Bearer ${process.env.WHATSAPP_ACCESS_TOKEN}`,
                "Content-Type": "application/json",
            },
        });

        console.log("✅ Audio sent successfully:", response.data);
    } catch (error) {
        console.error("❌ Failed to send audio:", error.response?.data || error.message);
        throw error;
    }
};

const isCancellationRequest = (text) => {
    const cancellationPhrases = [
        "cancel",
        "cancel the order",
        "i want to cancel the order",
        "i don't want the order",
        "i have cancelled the order",
        "i no longer want",
        "i no longer want the order",
        "أريد إلغاء الطلب",
        "الغاء الطلب",
        "لا أريد الطلب",
        "لقد ألغيت الطلب",
        "لم أعد أرغب في الطلب",
        "الغي الطلب"
    ];

    const normalizedText = text.toLowerCase().trim();
    return cancellationPhrases.some(phrase => normalizedText.includes(phrase));
};

async function handleCancellationRequest(from, session, message, res) {
    try {
        // Check if the user is in a request flow
        if (session.inRequest) {
            // Reset the session
            userSessions[from] = {
                step: STATES.WELCOME,
                data: {},
                language: session.language,
                inRequest: false,
                lastTimestamp: Number(message.timestamp)
            };

            // Notify the user in text
            const lang = session?.language || "en"; // Define lang based on session.language
            const cancellationMessage = lang === 'ar'
                ? "🔹 تم إلغاء الطلب بنجاح. يمكنك بدء طلب جديد في أي وقت."
                : "🔹 Your order has been cancelled. You can start a new request anytime.";

            await sendToWhatsApp(from, cancellationMessage);

            // Generate audio response for cancellation
            const audioFilePath = `./temp/${Date.now()}_cancellation_response.mp3`;
            await generateAudio(cancellationMessage, audioFilePath);

            // Upload audio file to WhatsApp's servers
            const uploadedMediaId = await uploadMediaToWhatsApp(audioFilePath);

            // Send audio to user using the media ID
            await sendAudioUsingMediaId(from, uploadedMediaId);

            // Clean up temporary files
            fs.unlinkSync(audioFilePath);
            console.log("✅ Temporary audio file deleted:", audioFilePath);

            return res.sendStatus(200);
        } else {
            // If the user is not in a request, inform them
            const lang = session?.language || "en"; // Define lang based on session.language
            const noActiveOrderMessage = lang === 'ar'
                ? "🔹 ليس لديك طلب نشط للإلغاء."
                : "🔹 You don't have an active order to cancel.";

            await sendToWhatsApp(from, noActiveOrderMessage);

            // Generate audio response for no active order
            const audioFilePath = `./temp/${Date.now()}_no_active_order_response.mp3`;
            await generateAudio(noActiveOrderMessage, audioFilePath);

            // Upload audio file to WhatsApp's servers
            const uploadedMediaId = await uploadMediaToWhatsApp(audioFilePath);

            // Send audio to user using the media ID
            await sendAudioUsingMediaId(from, uploadedMediaId);

            // Clean up temporary files
            fs.unlinkSync(audioFilePath);
            console.log("✅ Temporary audio file deleted:", audioFilePath);

            return res.sendStatus(200);
        }
    } catch (error) {
        console.error("❌ Error handling cancellation request:", error);
        await sendToWhatsApp(from, "Sorry, something went wrong while processing your request. Please try again.");
        return res.sendStatus(200);
    }
}

const getTranslation = (key, language) => {
    const translations = {
        change_information: { en: "Do you want to change your information?", ar: "هل ترغب في تغيير معلوماتك؟" },
        yes: { en: "Yes", ar: "نعم" },
        no: { en: "No", ar: "لا" }
    };
    return translations[key][language];
};

// Webhook endpoint
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
        let session = userSessions[from];

        const messageId = message.id; // Get the message ID for reactions
        let textRaw = message.text?.body || "";

        // Get an emoji reaction based on the user's message
        const emoji = await getEmojiReaction(textRaw, session?.language || "en");
        await sendReaction(from, messageId, emoji); // Send the reaction

        const text = textRaw.toLowerCase().trim();
        let detectedLanguage = "en";

        try {
            const detected = langdetect.detect(textRaw);
            if (Array.isArray(detected) && detected.length > 0) {
                detectedLanguage = detected[0].lang;
            }
            if (detectedLanguage !== "ar" && detectedLanguage !== "en") {
                detectedLanguage = "en";
            }
        } catch (error) {
            console.log("⚠️ Language detection failed. Defaulting to English.", error);
        }

        if (!session) {
            const user = await checkUserRegistration(from);
            if (user && user.name) {
                let welcomeMessage = await getOpenAIResponse(
                    `Welcome back, ${user.name}. Generate a WhatsApp welcome message for Lootah Biofuels.`,
                    "",
                    detectedLanguage
                );
                await sendInteractiveButtons(from, welcomeMessage, [
                    { type: "reply", reply: { id: "contact_us", title: getButtonTitle("contact_us", detectedLanguage) } },
                    { type: "reply", reply: { id: "new_request", title: getButtonTitle("new_request", detectedLanguage) } }
                ]);
                userSessions[from] = {
                    step: STATES.WELCOME,
                    data: user,
                    language: detectedLanguage,
                    inRequest: false,
                    lastTimestamp: Number(message.timestamp)
                };
            } else {
                userSessions[from] = {
                    step: STATES.WELCOME,
                    data: { phone: from },
                    language: detectedLanguage,
                    inRequest: false,
                    lastTimestamp: Number(message.timestamp)
                };
                const welcomeMessage = await getOpenAIResponse(
                    "Generate a WhatsApp welcome message for Lootah Biofuels.",
                    "",
                    detectedLanguage
                );
                await sendInteractiveButtons(from, welcomeMessage, [
                    { type: "reply", reply: { id: "contact_us", title: getButtonTitle("contact_us", detectedLanguage) } },
                    { type: "reply", reply: { id: "new_request", title: getButtonTitle("new_request", detectedLanguage) } }
                ]);
            }
            return res.sendStatus(200);
        }

        // Handle voice messages


        if (message.type === "audio" && message.audio) {
            const mediaId = message.audio.id; // Get the media ID

            // Fetch the media URL using the media ID
            const audioUrl = await fetchMediaUrl(mediaId);
            if (!audioUrl || !isValidUrl(audioUrl)) {
                console.error("❌ Invalid or missing audio URL:", audioUrl);
                await sendToWhatsApp(from, "Sorry, I couldn't process your voice message. Please try again.");
                return res.sendStatus(200);
            }

            const filePath = `./temp/${messageId}.ogg`; // Unique temporary file path

            try {
                // Download the voice file
                await downloadFile(audioUrl, filePath);
                console.log("🔹 Voice file downloaded successfully:", filePath);

                // Transcribe the voice file using OpenAI Whisper
                const transcription = await transcribeVoiceMessage(filePath);
                if (!transcription) {
                    console.error("❌ Failed to transcribe voice message. Transcription result is empty.");
                    await sendToWhatsApp(from, "Sorry, I couldn't understand your voice message. Please try again.");
                    return res.sendStatus(200);
                }

                console.log(`🔹 Transcribed voice message: ${transcription}`);
                const transcribedText = transcription; // Use the transcribed text as the message


                if (isCancellationRequest(transcribedText)) {
                    console.log("🔹 Cancellation request detected.");
                    await handleCancellationRequest(from, session, message, res); // Pass `res` here
                    return;
                }

                // Classify the transcribed text
                const classification = await isQuestionOrRequest(transcribedText);
                let aiResponse = ""; // Declare aiResponse here to avoid scope issues

                // Handle each classification in the specified order
                if (classification === "question") {
                    // Handle questions
                    aiResponse = await getOpenAIResponse(transcribedText, systemMessage, session.language);

                    // Send text response
                    if (session.inRequest) {
                        await sendToWhatsApp(from, `${aiResponse}\n\nPlease complete the request information.`);
                    } else {
                        const reply = `${aiResponse}\n\n${getContinueMessage(session.language)}`;
                        await sendInteractiveButtons(from, reply, [
                            { type: "reply", reply: { id: "contact_us", title: getButtonTitle("contact_us", session.language) } },
                            { type: "reply", reply: { id: "new_request", title: getButtonTitle("new_request", session.language) } }
                        ]);
                    }
                } else if (classification === "answer") {
                    // Handle answers
                    if (session.step === STATES.NAME) {
                        session.data.name = transcribedText;
                        session.step = STATES.EMAIL;
                        await sendToWhatsApp(from, getEmailMessage(session.language));
                        await sendToWhatsApp(from, aiResponse);
                    }
                    else if (session.step === STATES.EMAIL) {
                        if (!isValidEmail(transcribedText)) {
                            await sendToWhatsApp(from, "❌ Please provide a valid email address (e.g., example@domain.com).");
                            return res.sendStatus(200);
                        }
                        session.data.email = transcribedText;
                        session.step = STATES.LONGITUDE;
                        await sendToWhatsApp(from, getLocationMessage(session.language));
                    }
                    else if (session.step === STATES.STREET) {
                        session.data.street = transcribedText;
                        session.step = STATES.BUILDING_NAME;
                        await sendToWhatsApp(from, getBuildingMessage(session.language));
                    }
                    else if (session.step === STATES.BUILDING_NAME) {
                        session.data.building_name = transcribedText;
                        session.step = STATES.FLAT_NO;
                        await sendToWhatsApp(from, getFlatMessage(session.language));
                    }
                    else if (session.step === STATES.FLAT_NO) {
                        session.data.flat_no = transcribedText;
                        session.step = STATES.QUANTITY;
                        return await sendQuantitySelection(from, session.language);
                    }
                    else if (session.step === STATES.QUANTITY) {
                        // const quantity = parseInt(transcribedText.trim(), 10);

                        if (transcribedText < 10) {
                            await sendToWhatsApp(from, getInvalidQuantityMessage(session.language));
                            await sendQuantitySelection(from, session.language);
                            return res.sendStatus(200);
                        }
                        session.data.quantity = transcribedText;
                        session.step = STATES.CONFIRMATION;
                    }
                } else if (classification === "request") {
                    // Handle requests
                    if (!session.data || !session.data.name) {  // Check if the user doesn't have any data
                        // Start collecting information immediately if the user is new and doesn't have data
                        session.inRequest = true;
                        session.step = STATES.NAME;
                        aiResponse = "Please provide your name."; // Set aiResponse for voice generation
                        await sendToWhatsApp(from, aiResponse);
                    } else {
                        const extractedData = await extractInformationFromText(transcribedText, session.language);
                        if (Object.keys(extractedData).length > 0) {
                            session.step = STATES.CHANGE_INFOO;
                            aiResponse = "Do you want to change your information?"; // Set aiResponse for voice generation
                            await sendInteractiveButtons(from, aiResponse, [
                                { type: "reply", reply: { id: "yes_change", title: "Yes" } },
                                { type: "reply", reply: { id: "no_change", title: "No" } }
                            ]);
                            session.tempData = extractedData; // Store extracted data temporarily
                        } else {
                            aiResponse = "Do you want to change your information?"; // Set aiResponse for voice generation
                            await sendToWhatsApp(from, `${aiResponse}\n\nPlease provide more details about your request.`);
                            session.inRequest = true; // Set the session to indicate the user is in a request flow
                        }
                    }
                } else if (classification === "greeting" || classification === "other") {
                    // Handle greetings or other cases
                    aiResponse = await getOpenAIResponse(transcribedText, systemMessage, session.language);
                    await sendToWhatsApp(from, aiResponse);
                }

                // Generate audio response using OpenAI TTS (for all cases except when returning early)
                if (aiResponse) {
                    const audioFilePath = `./temp/${messageId}_response.mp3`;
                    await generateAudio(aiResponse, audioFilePath);

                    // Upload audio file to WhatsApp's servers
                    const uploadedMediaId = await uploadMediaToWhatsApp(audioFilePath);

                    // Send audio to user using the media ID
                    await sendAudioUsingMediaId(from, uploadedMediaId);

                    // Clean up temporary files
                    fs.unlinkSync(audioFilePath);
                    console.log("✅ Temporary audio file deleted:", audioFilePath);
                }

                return res.sendStatus(200);
            } catch (error) {
                console.error("❌ Error downloading or transcribing voice message:", error);
                await sendToWhatsApp(from, "Sorry, I couldn't process your voice message. Please try again.");
                return res.sendStatus(200);
            } finally {
                // Clean up the temporary file
                if (fs.existsSync(filePath)) {
                    fs.unlinkSync(filePath);
                    console.log("✅ Temporary file deleted:", filePath);
                }
            }
        }

        if (message.type === "interactive" && message.interactive?.type === "button_reply") {
            const buttonId = message.interactive.button_reply.id;
            if (buttonId === "new_request") {
                if (!session.data || !session.data.name) {  // Check if the user doesn't have any data
                    // Start collecting information immediately if the user is new and doesn't have data
                    const lang = session?.language || "en"; // Define lang based on session.language

                    await sendToWhatsApp(from, session.language === 'ar'
                        ? "🔹 يمكنك إلغاء الطلب في أي وقت عن طريق كتابة 'إلغاء'."
                        : "🔹 You can cancel your order at any time by typing 'cancel'.");
                    session.inRequest = true;
                    session.step = STATES.NAME;
                    await sendToWhatsApp(from, session.language === 'ar'
                        ? "من فضلك قم بإدخال اسمك."
                        : "Please provide your name.");
                    } else {
                    // Proceed to ask if the user wants to change information if they already have data
                    const lang = session?.language || "en"; // Define lang based on session.language

                    await sendToWhatsApp(from, lang === 'ar'
                        ? "🔹 يمكنك إلغاء الطلب في أي وقت عن طريق كتابة 'إلغاء'او التسجيل الصوتي."
                        : "🔹 You can cancel the order at any time by writing cancel or recording a voice message..");
                        session.inRequest = true;
                        await sendInteractiveButtons(from, getTranslation("change_information", session.language), [
                            { type: "reply", reply: { id: "yes_change", title: getTranslation("yes", session.language) } },
                            { type: "reply", reply: { id: "no_change", title: getTranslation("no", session.language) } }
                        ]);
                    session.step = STATES.CHANGE_INFO;
                }
                return res.sendStatus(200);
            }
        }

        if (session.lastTimestamp && Number(message.timestamp) < session.lastTimestamp) {
            console.log(`Ignoring out-of-order message for user ${from}`);
            return res.sendStatus(200);
        }
        session.lastTimestamp = Number(message.timestamp);

        const classification = await isQuestionOrRequest(textRaw);
        if (classification === "question") {
            const aiResponse = await getOpenAIResponse(textRaw, systemMessage, session.language);
            if (session.inRequest) {
                // await sendToWhatsApp(from, `${aiResponse}\n\nPlease complete the request information.`);

                const lang = session?.language || "en"; // Define lang based on session.language
                await sendToWhatsApp(from, lang ==='ar' ? `${aiResponse}\n\nمن فضلك اكمل معلومات الطلب.`:
                    `${aiResponse}\n\nPlease complete the request information.`
                );

            } else {
                const reply = `${aiResponse}\n\n${getContinueMessage(session.language)}`;
                await sendInteractiveButtons(from, reply, [
                    { type: "reply", reply: { id: "contact_us", title: getButtonTitle("contact_us", session.language) } },
                    { type: "reply", reply: { id: "new_request", title: getButtonTitle("new_request", session.language) } }
                ]);
            }
            return res.sendStatus(200);
        }

        // Check for cancellation requests
if (isCancellationRequest(textRaw)) {
    if (session.inRequest) {
        // Reset the session
        userSessions[from] = {
            step: STATES.WELCOME,
            data: {},
            language: session.language,
            inRequest: false,
            lastTimestamp: Number(message.timestamp)
        };

        // Notify the user
        const lang = session?.language || "en"; // Define lang based on session.language

        await sendToWhatsApp(from, lang === 'ar'
            ? "🔹 تم الغاء الطلب بنجاح'."
            : "🔹Your order has been cancelled. You can start a new request anytime.");
        // await sendToWhatsApp(from, "Your order has been cancelled. You can start a new request anytime.");
        return res.sendStatus(200);
    } else {
        // If the user is not in a request, inform them
        const lang = session?.language || "en"; // Define lang based on session.language

        await sendToWhatsApp(from, lang === 'ar'
            ? "🔹ليس لدك طلب للالغاء'."
            : "🔹You don't have an active order to cancel.");
        // await sendToWhatsApp(from, "You don't have an active order to cancel.");
        return res.sendStatus(200);
    }
}

        // Check if the user's message contains information
        if (session.step === STATES.WELCOME && message.type === "text") {
            // Check if the user's message indicates the start of a request
            const isRequestStart = await detectRequestStart(textRaw);
            if (isRequestStart) {
                session.inRequest = true;
        
                const lang = session?.language || "en"; // Define lang based on session.language
        
                await sendToWhatsApp(from, lang === 'ar'
                    ? "🔹 يمكنك إلغاء الطلب في أي وقت عن طريق كتابة 'إلغاء'او التسجيل الصوتي."
                    : "🔹 You can cancel the order at any time by writing cancel or recording a voice message..");
        
                // Extract information from the user's message
                const extractedData = await extractInformationFromText(textRaw, session.language);
        
                // Check if the user is registered
                const user = await checkUserRegistration(from);
                if (user && user.name) {
                    // User is registered, ask if they want to change their information
                    session.tempData = extractedData; // Store extracted data temporarily
                    await sendInteractiveButtons(from, getTranslation("change_information", session.language), [
                        { type: "reply", reply: { id: "yes_change", title: getTranslation("yes", session.language) } },
                        { type: "reply", reply: { id: "no_change", title: getTranslation("no", session.language) } }
                    ]);
                    session.step = STATES.CHANGE_INFOO;

                } else {
                    // User is not registered, start collecting information
                    session.data = { ...session.data, ...extractedData }; // Merge extracted data with session data
        
                    // Check for missing fields
                    const missingFields = getMissingFields(session.data);
                    if (missingFields.length > 0) {
                        session.step = `ASK_${missingFields[0].toUpperCase()}`;
                        await askForNextMissingField(session, from);
                    } else {
                        // If no missing fields, proceed to quantity selection
                        session.step = STATES.QUANTITY;
                        await sendQuantitySelection(from, session.language);
                    }
                }
            } else {
                // If the message is not a request, treat it as a general message
                const aiResponse = await getOpenAIResponse(textRaw, systemMessage, session.language);
                const reply = `${aiResponse}\n\n${getContinueMessage(session.language)}`;
        
                await sendInteractiveButtons(from, reply, [
                    { type: "reply", reply: { id: "contact_us", title: getButtonTitle("contact_us", session.language) } },
                    { type: "reply", reply: { id: "new_request", title: getButtonTitle("new_request", session.language) } }
                ]);
            }
            return res.sendStatus(200);
        }
        
        if (session.step === STATES.CHANGE_INFOO) {
            if (message.type === "interactive" && message.interactive?.type === "button_reply") {
                const buttonId = message.interactive.button_reply.id;
                if (buttonId === "yes_change") {
                    session.data = {}; // Clear all previous data
                    // User wants to change information, update session data with extracted information
                    session.data = { ...session.data, ...session.tempData }; // Merge extracted data with session data
                    delete session.tempData; // Clear temporary data
        
                    // Ensure the phone number is not overwritten if already present
                    if (!session.data.phone) {
                        session.data.phone = from; // Use the WhatsApp number as the default phone number
                    }
        
                    // Check for missing fields
                    const missingFields = getMissingFields(session.data);
                    if (missingFields.length > 0) {
                        session.step = `ASK_${missingFields[0].toUpperCase()}`;
                        await askForNextMissingField(session, from);
                    } else {
                        // If no missing fields, proceed to quantity selection
                        session.step = STATES.QUANTITY;
                        await sendQuantitySelection(from, session.language);
                    }
                } else if (buttonId === "no_change") {
                    // User does not want to change information, proceed to quantity selection
                    session.step = STATES.QUANTITY;
                    await sendQuantitySelection(from, session.language);
                }
            }
            return res.sendStatus(200);
        }

        let latitude
        let longitude
        switch (session.step) {
            case STATES.CHANGE_INFO:
                if (message.type === "interactive" && message.interactive?.type === "button_reply") {
                    const buttonId = message.interactive.button_reply.id;
                    if (buttonId === "yes_change") {
                        session.step = STATES.NAME;
                        await sendToWhatsApp(from, "Please provide your new name.");
                    } else if (buttonId === "no_change") {
                        session.step = STATES.QUANTITY;
                        await sendQuantitySelection(from, session.language);
                    }
                }
                break;
            case STATES.WELCOME:
                if (message.type === "text") {
                    const isRequestStart = await detectRequestStart(textRaw);
                    if (isRequestStart) {
                        session.inRequest = true;
                        const extractedData = await extractInformationFromText(textRaw, session.language);
                        // Initialize session data with extracted information
                        session.data = {
                            ...session.data, // Keep existing data including phone from WhatsApp
                            ...extractedData,
                            phone: extractedData.phone || session.data.phone // Only overwrite if new phone found
                        };
                        // Debugging: Log extracted data
                        console.log("Extracted data:", extractedData);
                        // Check for missing fields
                        const missingFields = getMissingFields(session.data);
                        if (missingFields.length === 0) {
                            session.step = STATES.CONFIRMATION;
                            await sendOrderSummary(from, session);
                        } else {
                            session.step = `ASK_${missingFields[0].toUpperCase()}`;
                            await askForNextMissingField(session, from);
                        }
                    } else {
                        const aiResponse = await getOpenAIResponse(textRaw, systemMessage, session.language);
                        const reply = `${aiResponse}\n\n${getContinueMessage(session.language)}`;

                        await sendInteractiveButtons(from, reply, [
                            { type: "reply", reply: { id: "contact_us", title: getButtonTitle("contact_us", session.language) } },
                            { type: "reply", reply: { id: "new_request", title: getButtonTitle("new_request", session.language) } }
                        ]);
                    }
                } else if (message.type === "interactive" && message.interactive?.type === "button_reply") {
                    const buttonId = message.interactive.button_reply.id;

                    if (buttonId === "contact_us") {
                        await sendToWhatsApp(from, getContactMessage(session.language));
                    } else if (buttonId === "new_request") {
                        session.inRequest = true; // Set inRequest to true
                        session.step = STATES.NAME;
                        await sendToWhatsApp(from, getNameMessage(session.language));
                    } else {
                        await sendToWhatsApp(from, getInvalidOptionMessage(session.language));
                    }
                }
                break;
            case STATES.NAME:
                if (!textRaw) {
                    await sendToWhatsApp(from, getNameMessage(session.language));
                } else {
                    if (textRaw.trim().length > 0) {
                        session.data.name = textRaw;
                        session.step = STATES.EMAIL;
                        await sendToWhatsApp(from, getEmailMessage(session.language));
                    } else {
                        const errorMsg = session.language === 'ar'
                            ? "❌ يرجى تقديم اسم صحيح"
                            : "❌ Please provide a valid full name";
                        await sendToWhatsApp(from, errorMsg);
                    }
                }
                break;
            case STATES.PHONE_INPUT:
                if (!isValidPhone(textRaw)) {
                    await sendToWhatsApp(from, getInvalidPhoneMessage(session.language));
                    return res.sendStatus(200);
                }
                session.data.phone = formatPhoneNumber(textRaw);
                session.step = STATES.EMAIL;
                await sendToWhatsApp(from, getEmailMessage(session.language)); // Ask for email
                break;
            case STATES.EMAIL:
                if (!isValidEmail(textRaw)) {
                    await sendToWhatsApp(from, "❌ Please provide a valid email address (e.g., example@domain.com).");
                    return res.sendStatus(200);
                }
                session.data.email = textRaw;
                session.step = STATES.LONGITUDE;
                await sendToWhatsApp(from, getLocationMessage(session.language)); // Ask for location
                break;
            case STATES.LONGITUDE:
                if (message.location) {
                    const { latitude: lat, longitude: lng } = message.location; // Use different variable names
                    latitude = lat;
                    longitude = lng;

                    // Validate UAE location
                    const UAE_BOUNDS = { minLat: 22.5, maxLat: 26.5, minLng: 51.6, maxLng: 56.5 };
                    if (
                        latitude >= UAE_BOUNDS.minLat &&
                        latitude <= UAE_BOUNDS.maxLat &&
                        longitude >= UAE_BOUNDS.minLng &&
                        longitude <= UAE_BOUNDS.maxLng
                    ) {
                        // Reverse Geocode to get address
                        const address = await getAddressFromCoordinates(latitude, longitude);
                        if (address) {
                            session.data.address = address;
                            session.data.street = extractStreetName(address); // Store street name separately
                        }


                        session.data.latitude = latitude;
                        session.data.longitude = longitude;
                        session.data.address = address; // Auto-fill address
                        session.step = STATES.CITY; // Proceed to city selection

                        return await sendCitySelection(from, session.language); // ✅ Ask user to select city
                    } else {
                        await sendToWhatsApp(from, getInvalidUAERegionMessage(session.language));
                    }
                } else {
                    if (!session.locationPromptSent) {
                        await sendInteractiveButtons(from, getLocationMessage(session.language), [
                            {
                                type: "location_request",
                                title: getButtonTitle("send_site", session.language) // "Send Location" button
                            }
                        ]);
                        session.locationPromptSent = true;
                    }
                }
                break;


            case STATES.CITY:
                if (message.interactive && message.interactive.type === "list_reply") {
                    const citySelection = message.interactive.list_reply.id; // Get selected city ID
                    const cityMap = {
                        "abu_dhabi": { en: "Abu Dhabi", ar: "أبو ظبي" },
                        "dubai": { en: "Dubai", ar: "دبي" },
                        "sharjah": { en: "Sharjah", ar: "الشارقة" },
                        "ajman": { en: "Ajman", ar: "عجمان" },
                        "umm_al_quwain": { en: "Umm Al Quwain", ar: "أم القيوين" },
                        "ras_al_khaimah": { en: "Ras Al Khaimah", ar: "رأس الخيمة" },
                        "fujairah": { en: "Fujairah", ar: "الفجيرة" }
                    };

                    if (cityMap[citySelection]) {
                        const selectedCity = cityMap[citySelection][session.language] || cityMap[citySelection].en;

                        // Validate the city using the actual location if available
                        if (session.data.latitude && session.data.longitude) {
                            const validationResult = await validateCityAndLocation(session.data.latitude, session.data.longitude, selectedCity);
                            if (!validationResult.isValid) {
                                const errorMessage = session.language === 'ar'
                                    ? `❌ يبدو أن موقعك يقع في *${validationResult.actualCity}*. يرجى اختيار *${validationResult.actualCity}* بدلاً من *${selectedCity}*.`
                                    : `❌ It seems your location is in *${validationResult.actualCity}*. Please select *${validationResult.actualCity}* instead of *${selectedCity}*.`;

                                await sendToWhatsApp(from, errorMessage);
                                await sendCitySelection(from, session.language);
                                return res.sendStatus(200);
                            }
                        }

                        // Store the selected city
                        session.data.city = selectedCity;
                        session.step = STATES.STREET;

                        const buildingPrompt = session.language === 'ar'
                            ? `✅ لقد اخترت *${session.data.city}*.\n\n🏢 يرجى تقديم اسم الشارع.`
                            : `✅ You selected *${session.data.city}*.\n\n🏢 Please provide the Street name.`;

                        await sendToWhatsApp(from, buildingPrompt);
                    } else {
                        const invalidSelectionMessage = session.language === 'ar'
                            ? "❌ اختيار غير صالح. يرجى الاختيار من الخيارات المتاحة."
                            : "❌ Invalid selection. Please choose from the provided options.";

                        await sendToWhatsApp(from, invalidSelectionMessage);
                        await sendCitySelection(from, session.language);
                    }
                }
                break;

            case STATES.STREET:
                session.data.street = textRaw;
                session.step = STATES.BUILDING_NAME;
                await sendToWhatsApp(from, getBuildingMessage(session.language)); // Ask for building name
                break;
            case STATES.BUILDING_NAME:
                if (!textRaw || textRaw.trim() === "") {
                    await sendToWhatsApp(from, getBuildingMessage(session.language));
                    return res.sendStatus(200);
                }
                session.data.building_name = textRaw;
                session.step = STATES.FLAT_NO;
                await sendToWhatsApp(from, getFlatMessage(session.language));
                break;

            case STATES.FLAT_NO:
                console.log("🔹 Entered FLAT_NO state for user:", from);
                console.log("🔹 Current session.data:", session.data);

                if (!session.data || typeof session.data !== "object") {
                    console.error("❌ Error: session.data is corrupted. Reinitializing.");
                    session.data = {};
                }

                if (!textRaw || textRaw.trim() === "") {
                    console.log("🔹 No flat number provided. Asking for flat number.");
                    await sendToWhatsApp(from, getFlatMessage(session.language));
                    return res.sendStatus(200);
                }

                console.log("🔹 Flat number provided:", textRaw);
                session.data.flat_no = textRaw;
                console.log("🔹 Updated session.data:", session.data);

                session.step = STATES.QUANTITY;

                console.log("🔹 Sending interactive quantity selection...");
                return await sendQuantitySelection(from, session.language);

            case STATES.QUANTITY:
                console.log("🔹 Entered QUANTITY state for user:", from);
                console.log("🔹 textRaw:", textRaw);

                // ✅ Handle button selection (interactive message)
                if (message.interactive && message.interactive.type === "button_reply") {
                    const selectedQuantity = message.interactive.button_reply.id;

                    if (["10", "15", "20"].includes(selectedQuantity)) {
                        console.log("🔹 User selected predefined quantity:", selectedQuantity);
                        session.data.quantity = parseInt(selectedQuantity, 10);
                    } else {
                        console.log("🔹 Invalid button selection. Asking for valid quantity.");
                        await sendQuantitySelection(from, session.language);
                        return res.sendStatus(200);
                    }
                }
                // ✅ Handle manual input
                else {
                    if (!textRaw || textRaw.trim() === "") {
                        console.log("🔹 No quantity provided. Asking for quantity.");
                        await sendQuantitySelection(from, session.language);
                        return res.sendStatus(200);
                    }
                    const convertedTextRaw = convertArabicNumbers(textRaw.trim());
                    const quantity = parseInt(convertedTextRaw.trim(), 10);

                    if (isNaN(quantity) || quantity < 10) {
                        console.log("🔹 Invalid quantity or less than 10 provided. Asking for a valid quantity.");
                        await sendToWhatsApp(from, getInvalidQuantityMessage(session.language));
                        await sendQuantitySelection(from, session.language);
                        return res.sendStatus(200);
                    }

                    console.log("🔹 Valid quantity provided:", quantity);
                    session.data.quantity = quantity;
                }

                // ✅ Proceed to the next step
                const missingFields = getMissingFields(session.data);
                console.log("🔹 Missing fields after quantity:", missingFields);

                if (missingFields.length === 0) {
                    session.step = STATES.CONFIRMATION;
                    await sendOrderSummary(from, session);
                } else {
                    session.step = `ASK_${missingFields[0].toUpperCase()}`;
                    await askForNextMissingField(session, from);
                }
                break;




            case "ASK_NAME":
                // If the user hasn't provided a name yet, ask for it
                if (!textRaw) {
                    await sendToWhatsApp(from, "👤 Please provide your full name.");
                    return res.sendStatus(200); // Exit and wait for the user's response
                }
                // If the name is provided, store it and proceed to the next step
                session.data.name = textRaw;
                // Check for other missing fields
                const missingFieldsName = getMissingFields(session.data);
                if (missingFieldsName.length === 0) {
                    session.step = STATES.CONFIRMATION;
                    await sendOrderSummary(from, session);
                } else {
                    session.step = `ASK_${missingFieldsName[0].toUpperCase()}`;
                    await askForNextMissingField(session, from);
                }
                break;
            case "ASK_PHONE":
                // If the user hasn't provided a phone number yet, ask for it
                if (!textRaw) {
                    await sendToWhatsApp(from, "📞 Please provide your phone number.");
                    return res.sendStatus(200); // Exit and wait for the user's response
                }
                // Validate the phone number after the user provides it
                if (!isValidPhone(textRaw)) {
                    await sendToWhatsApp(from, "❌ Invalid phone number, please enter a valid number.");
                    return res.sendStatus(200); // Exit and wait for the user to correct their input
                }
                // If the phone number is valid, store it and proceed to the next step
                session.data.phone = formatPhoneNumber(textRaw);
                // Check for other missing fields
                const missingFieldsPhone = getMissingFields(session.data);
                if (missingFieldsPhone.length === 0) {
                    session.step = STATES.CONFIRMATION;
                    await sendOrderSummary(from, session);
                } else {
                    session.step = `ASK_${missingFieldsPhone[0].toUpperCase()}`;
                    await askForNextMissingField(session, from);
                }
                break;
            case "ASK_EMAIL":
                // If the user hasn't provided an email yet, ask for it
                if (!textRaw) {
                    await sendToWhatsApp(from, "✉️ Could you please share your email address? We'll use it for sending updates on your order.");
                    return res.sendStatus(200); // Exit and wait for the user's response
                }
                // Validate the email after the user provides it
                if (!isValidEmail(textRaw)) {
                    await sendToWhatsApp(from, "❌ Invalid email address, please enter a valid one (e.g., example@domain.com).");
                    return res.sendStatus(200); // Exit and wait for the user to correct their input
                }
                // If the email is valid, store it and proceed to the next step
                session.data.email = textRaw;
                // Check for other missing fields
                const missingFieldsEmail = getMissingFields(session.data);
                if (missingFieldsEmail.length === 0) {
                    session.step = STATES.CONFIRMATION;
                    await sendOrderSummary(from, session);
                } else {
                    session.step = `ASK_${missingFieldsEmail[0].toUpperCase()}`;
                    await askForNextMissingField(session, from);
                }
                break;
            case "ASK_LOCATION":
                // If the user hasn't shared their location yet, ask for it
                if (!message.location) {
                    // Send a message with a button to share location
                    await sendInteractiveButtons(from, getLocationMessage(session.language), [
                        {
                            type: "location_request",
                            title: getButtonTitle("send_site", session.language) // "Send Location" button
                        }
                    ]);
                    return res.sendStatus(200); // Exit and wait for the user's response
                }
                // If the location is shared, store it and proceed to the next step
                const { latitude: lat2, longitude: lng2 } = message.location; // Use different variable names
                latitude = lat2;
                longitude = lng2;                // Validate UAE location
                const UAE_BOUNDS = { minLat: 22.5, maxLat: 26.5, minLng: 51.6, maxLng: 56.5 };
                if (
                    latitude >= UAE_BOUNDS.minLat &&
                    latitude <= UAE_BOUNDS.maxLat &&
                    longitude >= UAE_BOUNDS.minLng &&
                    longitude <= UAE_BOUNDS.maxLng
                ) {
                    const address = await getAddressFromCoordinates(latitude, longitude);
                    if (address) {
                        session.data.address = address;
                        // session.data.street = extractStreetName(address); // Store street name separately
                    }
                    session.data.address = address; // Auto-fill address
                    session.data.latitude = latitude;
                    session.data.longitude = longitude;
                    // Check for other missing fields
                    const missingFields = getMissingFields(session.data);
                    if (missingFields.length === 0) {
                        session.step = STATES.CONFIRMATION;
                        await sendOrderSummary(from, session);
                    } else {
                        console.log("hi" + session.data.latitude, "hii" + session.data.latitude)
                        session.step = `ASK_${missingFields[0].toUpperCase()}`;
                        await askForNextMissingField(session, from);
                    }
                } else {
                    await sendToWhatsApp(from, getInvalidUAERegionMessage(session.language));
                }
                break;
            case "ASK_ADDRESS":
                // If the user hasn't provided an address yet, ask for it
                if (!textRaw) {
                    await sendToWhatsApp(from, "🏠 Please provide your address.");
                    return res.sendStatus(200); // Exit and wait for the user's response
                }
                // If the address is provided, store it and proceed to the next step
                session.data.address = textRaw;
                // Check for other missing fields
                const missingFieldsAddress = getMissingFields(session.data);
                if (missingFieldsAddress.length === 0) {
                    session.step = STATES.CONFIRMATION;
                    await sendOrderSummary(from, session);
                } else {
                    session.step = `ASK_${missingFieldsAddress[0].toUpperCase()}`;
                    await askForNextMissingField(session, from);
                }
                break;
            case "ASK_CITY":
                if (!session) {
                    console.error("❌ Session is not defined.");
                    await sendToWhatsApp(from, "❌ An error occurred. Please try again.");
                    return res.sendStatus(200);
                }
                if (session.data.city) {
                    moveToNextStep(session, from);
                    return res.sendStatus(200);
                }

                // Handle interactive button replies
                if (message.type === "interactive" && message.interactive?.type === "list_reply") {
                    const citySelection = message.interactive.list_reply.id;
                    const cityMap = {
                        "abu_dhabi": { en: "Abu Dhabi", ar: "أبو ظبي" },
                        "dubai": { en: "Dubai", ar: "دبي" },
                        "sharjah": { en: "Sharjah", ar: "الشارقة" },
                        "ajman": { en: "Ajman", ar: "عجمان" },
                        "umm_al_quwain": { en: "Umm Al Quwain", ar: "أم القيوين" },
                        "ras_al_khaimah": { en: "Ras Al Khaimah", ar: "رأس الخيمة" },
                        "fujairah": { en: "Fujairah", ar: "الفجيرة" }
                    };
                    console.log(" before City set to:", session.data.city);

                    if (cityMap[citySelection]) {
                        session.data.city = cityMap[citySelection][session.language] || cityMap[citySelection].en;
                        console.log("City set to:", session.data.city);

                        // Validate against detected location (if available)
                        if (session.data.latitude && session.data.longitude) {
                            const validation = await validateCityAndLocation(
                                session.data.latitude,
                                session.data.longitude,
                                session.data.city
                            );
                            if (!validation.isValid) {
                                await sendToWhatsApp(
                                    from,
                                    `❌ Your selected city (${session.data.city}) does not match your detected location (${validation.actualCity}). Please select the correct city.`
                                );
                                return res.sendStatus(200);
                            }
                        }

                        moveToNextStep(session, from);
                    } else {
                        await sendToWhatsApp(from, "❌ Invalid city. Please select a valid city from the options.");
                        await sendCitySelection(from, session.language);
                    }
                }
                // Handle text input
                else if (message.type === "text") {
                    console.log("Checking user response for city:", textRaw);
                    const selectedCity = extractCity(textRaw, session.language);
                    if (selectedCity) {
                        session.data.city = selectedCity;
                        console.log("City set to:", selectedCity);

                        // Validate against detected location (if available)
                        if (session.data.latitude && session.data.longitude) {
                            const validation = await validateCityAndLocation(
                                session.data.latitude,
                                session.data.longitude,
                                session.data.city
                            );
                            if (!validation.isValid) {
                                await sendToWhatsApp(
                                    from,
                                    `❌ Your selected city (${session.data.city}) does not match your detected location (${validation.actualCity}). Please select the correct city.`
                                );
                                return res.sendStatus(200);
                            }
                        }

                        moveToNextStep(session, from);
                    } else {
                        await sendToWhatsApp(from, "❌ Invalid city. Please select a valid city from the options.");
                        await sendCitySelection(from, session.language);
                    }
                }
                // Handle invalid input
                else {
                    await sendToWhatsApp(from, "❌ Invalid input. Please select a city from the options.");
                    await sendCitySelection(from, session.language);
                }
                break;
            case "ASK_STREET":
                // If the user hasn't provided a street name yet, ask for it
                if (!textRaw) {
                    await sendToWhatsApp(from, "🛣️ Please provide your street name.");
                    return res.sendStatus(200); // Exit and wait for the user's response
                }
                // If the street name is provided, store it and proceed to the next step
                session.data.street = textRaw;
                // Check for other missing fields
                const missingFieldsStreet = getMissingFields(session.data);
                if (missingFieldsStreet.length === 0) {
                    session.step = STATES.CONFIRMATION;
                    await sendOrderSummary(from, session);
                } else {
                    session.step = `ASK_${missingFieldsStreet[0].toUpperCase()}`;
                    await askForNextMissingField(session, from);
                }
                break;
            case "ASK_BUILDING_NAME":
                // If the user hasn't provided a building name yet, ask for it
                if (!textRaw) {
                    await sendToWhatsApp(from, "🏢 Please provide your building name.");
                    return res.sendStatus(200); // Exit and wait for the user's response
                }
                // If the building name is provided, store it and proceed to the next step
                session.data.building_name = textRaw;
                // Check for other missing fields
                const missingFieldsBuilding = getMissingFields(session.data);
                if (missingFieldsBuilding.length === 0) {
                    session.step = STATES.CONFIRMATION;
                    await sendOrderSummary(from, session);
                } else {
                    session.step = `ASK_${missingFieldsBuilding[0].toUpperCase()}`;
                    await askForNextMissingField(session, from);
                }
                break;
            case "ASK_FLAT_NO":
                // If the user hasn't provided a flat number yet, ask for it
                if (!textRaw) {
                    await sendToWhatsApp(from, "🏠 Please provide your flat number.");
                    return res.sendStatus(200); // Exit and wait for the user's response
                }
                // If the flat number is provided, store it and proceed to the next step
                session.data.flat_no = textRaw;
                // Check for other missing fields
                const missingFieldsFlat = getMissingFields(session.data);
                if (missingFieldsFlat.length === 0) {
                    session.step = STATES.CONFIRMATION;
                    await sendOrderSummary(from, session);
                } else {
                    session.step = `ASK_${missingFieldsFlat[0].toUpperCase()}`;
                    await askForNextMissingField(session, from);
                }
                break;
            case "ASK_QUANTITY":
                console.log("🔹 Entered QUANTITY state for user:", from);
                console.log("🔹 textRaw:", textRaw);

                // ✅ Handle button selection (interactive message)
                if (message.interactive && message.interactive.type === "button_reply") {
                    const selectedQuantity = message.interactive.button_reply.id;

                    if (["10", "15", "20"].includes(selectedQuantity)) {
                        console.log("🔹 User selected predefined quantity:", selectedQuantity);
                        session.data.quantity = parseInt(selectedQuantity, 10);
                    } else {
                        console.log("🔹 Invalid button selection. Asking for valid quantity.");
                        await sendQuantitySelection(from, session.language);
                        return res.sendStatus(200);
                    }
                }
                // ✅ Handle manual input
                else {
                    if (!textRaw || textRaw.trim() === "") {
                        console.log("🔹 No quantity provided. Asking for quantity.");
                        await sendQuantitySelection(from, session.language);
                        return res.sendStatus(200);
                    }
                    const convertedTextRaw = convertArabicNumbers(textRaw.trim());
                    const quantity = parseInt(convertedTextRaw.trim(), 10);

                    if (isNaN(quantity) || quantity < 10) {
                        console.log("🔹 Invalid quantity or less than 10 provided. Asking for a valid quantity.");
                        await sendToWhatsApp(from, getInvalidQuantityMessage(session.language));
                        await sendQuantitySelection(from, session.language);
                        return res.sendStatus(200);
                    }

                    console.log("🔹 Valid quantity provided:", quantity);
                    session.data.quantity = quantity;
                }

                // ✅ Proceed to the next step
                const missingFields2 = getMissingFields(session.data);
                console.log("🔹 Missing fields after quantity:", missingFields2);

                if (missingFields2.length === 0) {
                    session.step = STATES.CONFIRMATION;
                    await sendOrderSummary(from, session);
                } else {
                    session.step = `ASK_${missingFields2[0].toUpperCase()}`;
                    await askForNextMissingField(session, from);
                }
                break;
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
                            const response = await axios.post('https://dev.lootahbiofuels.com/api/v1/whatsapp_request', requestData, {
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
                        await sendToWhatsApp(from, "Which information would you like to modify? Please reply with the corresponding number:\n\n1. Location\n2. Street\n3. Building Name\n4. Flat No\n5. Quantity");
                    }
                }
                break;

            case STATES.MODIFY:
                // Convert any Arabic digits in the text to English digits
                const normalizedText = convertArabicNumbers(text);
                const fieldToModify = parseInt(normalizedText);
                if (isNaN(fieldToModify) || fieldToModify < 1 || fieldToModify > 6) {
                    await sendToWhatsApp(from, "❌ Invalid option. Please choose a number between 1 and 11.");
                    return res.sendStatus(200);
                }

                const fieldMap = {
                    1: "location",
                    2: "street",
                    3: "building_name",
                    4: "flat_no",
                    5: "quantity"
                };

                const selectedField = fieldMap[fieldToModify];

                if (selectedField === "location") {
                    session.step = "MODIFY_LOCATION";
                    await sendToWhatsApp(from, getLocationMessage(session.language));
                }
                // else if (selectedField === "city") {
                //     session.step = "MODIFY_CITY_SELECTION";
                //     return await sendCitySelection(from, session.language);
                // }
                else if (selectedField === "quantity") {
                    session.step = "MODIFY_QUANTITY";
                    await sendQuantitySelection(from, session.language);
                }
                else {
                    session.modifyField = selectedField;
                    session.step = `MODIFY_${selectedField.toUpperCase()}`;
                    await sendToWhatsApp(from, `🔹 Please provide the new value for ${selectedField.replace(/_/g, " ")}.`);
                }
                break;
            case "MODIFY_LOCATION":
                // If the user hasn't shared their location yet, ask for it
                if (!message.location) {
                    // Send a message with a button to share location
                    await sendInteractiveButtons(from, getLocationMessage(session.language), [
                        {
                            type: "location_request",
                            title: getButtonTitle("send_site", session.language) // "Send Location" button
                        }
                    ]);
                    return res.sendStatus(200); // Exit and wait for the user's response
                }
                // If the location is shared, store it and proceed to the next step
                const { latitude: lat3, longitude: lng3 } = message.location; // Use different variable names
                latitude = lat3;
                longitude = lng3;
                const UAE_BOUNDS2 = { minLat: 22.0, maxLat: 27.0, minLng: 51.0, maxLng: 57.0 };

                if (
                    latitude >= UAE_BOUNDS2.minLat &&
                    latitude <= UAE_BOUNDS2.maxLat &&
                    longitude >= UAE_BOUNDS2.minLng &&
                    longitude <= UAE_BOUNDS2.maxLng
                ) {
                    const address = await getAddressFromCoordinates(latitude, longitude);
                    if (address) {
                        session.data.address = address;
                    }
                    session.data.latitude = latitude;
                    session.data.longitude = longitude;

                    session.step = "MODIFY_CITY_SELECTION";
                    return await sendCitySelection(from, session.language);

                } else {
                    await sendToWhatsApp(from, getInvalidUAERegionMessage(session.language));
                }
                break;
            case "MODIFY_CITY_SELECTION":
                if (!session) {
                    console.error("❌ Session is not defined.");
                    await sendToWhatsApp(from, "❌ An error occurred. Please try again.");
                    return res.sendStatus(200);
                }

                // Handle interactive button replies
                if (message.type === "interactive" && message.interactive?.type === "list_reply") {
                    const citySelection = message.interactive.list_reply.id;
                    const cityMap = {
                        "abu_dhabi": { en: "Abu Dhabi", ar: "أبو ظبي" },
                        "dubai": { en: "Dubai", ar: "دبي" },
                        "sharjah": { en: "Sharjah", ar: "الشارقة" },
                        "ajman": { en: "Ajman", ar: "عجمان" },
                        "umm_al_quwain": { en: "Umm Al Quwain", ar: "أم القيوين" },
                        "ras_al_khaimah": { en: "Ras Al Khaimah", ar: "رأس الخيمة" },
                        "fujairah": { en: "Fujairah", ar: "الفجيرة" }
                    };
                    console.log(" before City set to:", session.data.city);

                    if (cityMap[citySelection]) {
                        session.data.city = cityMap[citySelection][session.language] || cityMap[citySelection].en;
                        console.log("City set to:", session.data.city);

                        // Validate against detected location (if available)
                        if (session.data.latitude && session.data.longitude) {
                            const validation = await validateCityAndLocation(
                                session.data.latitude,
                                session.data.longitude,
                                session.data.city
                            );
                            if (!validation.isValid) {
                                await sendToWhatsApp(
                                    from,
                                    `❌ Your selected city (${session.data.city}) does not match your detected location (${validation.actualCity}). Please select the correct city.`
                                );
                                return res.sendStatus(200);
                            }
                        }

                        moveToNextStep(session, from);
                    } else {
                        await sendToWhatsApp(from, "❌ Invalid city. Please select a valid city from the options.");
                        await sendCitySelection(from, session.language);
                    }
                }
                // Handle text input
                else if (message.type === "text") {
                    console.log("Checking user response for city:", textRaw);
                    const selectedCity = extractCity(textRaw, session.language);
                    if (selectedCity) {
                        session.data.city = selectedCity;
                        console.log("City set to:", selectedCity);

                        // Validate against detected location (if available)
                        if (session.data.latitude && session.data.longitude) {
                            const validation = await validateCityAndLocation(
                                session.data.latitude,
                                session.data.longitude,
                                session.data.city,
                                session.step = STATES.CONFIRMATION,
                                await sendUpdatedSummary(from, session)
                            );
                            if (!validation.isValid) {
                                await sendToWhatsApp(
                                    from,
                                    `❌ Your selected city (${session.data.city}) does not match your detected location (${validation.actualCity}). Please select the correct city.`
                                );
                                return res.sendStatus(200);
                            }
                        }

                        moveToNextStep(session, from);
                    } else {
                        await sendToWhatsApp(from, "❌ Invalid city. Please select a valid city from the options.");
                        await sendCitySelection(from, session.language);
                    }
                }
                // Handle invalid input
                else {
                    await sendToWhatsApp(from, "❌ Invalid input. Please select a city from the options.");
                    await sendCitySelection(from, session.language);
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

            case "MODIFY_QUANTITY":
                console.log("🔹 Entered MODIFY_QUANTITY state for user:", from);
                console.log("🔹 User input:", textRaw);

                if (message.interactive && message.interactive.type === "button_reply") {
                    const selectedQuantity = message.interactive.button_reply.id;

                    if (["10", "15", "20"].includes(selectedQuantity)) {
                        console.log("✅ User selected predefined quantity:", selectedQuantity);
                        session.data.quantity = parseInt(selectedQuantity, 10);
                    } else {
                        console.log("❌ Invalid quantity selection. Asking again.");
                        await sendQuantitySelection(from, session.language);
                        return res.sendStatus(200);
                    }
                } else {
                    if (!textRaw || textRaw.trim() === "") {
                        console.log("❌ No quantity provided. Asking again.");
                        await sendQuantitySelection(from, session.language);
                        return res.sendStatus(200);
                    }

                    const quantity = parseInt(textRaw.trim(), 10);

                    if (isNaN(quantity) || quantity < 10) {
                        console.log("❌ Invalid quantity or less than 10 provided.");
                        await sendToWhatsApp(from, getInvalidQuantityMessage(session.language));
                        await sendQuantitySelection(from, session.language);
                        return res.sendStatus(200);
                    }

                    console.log("✅ Valid quantity received:", quantity);
                    session.data.quantity = quantity;
                }

                // Move to confirmation step and send summary
                session.step = STATES.CONFIRMATION;
                console.log("📦 Sending updated summary...");
                await sendUpdatedSummary(from, session);
                break;
        }
        res.sendStatus(200);

    } catch (error) {
        console.error('❌ Error:', error.response?.data || error.message || error);
        res.sendStatus(500);
    }
})












// import dotenv from 'dotenv';
// import express from 'express';
// import axios from 'axios';
// import bodyParser from 'body-parser';
// import cors from 'cors';
// import langdetect from 'langdetect';
// import fs from 'fs';
// import {OpenAI} from 'openai';
// import mime from 'mime-types';
// import path from 'path';
// import FormData from 'form-data';





// dotenv.config();

// if (!process.env.OPENAI_API_KEY || !process.env.WHATSAPP_API_URL || !process.env.WHATSAPP_ACCESS_TOKEN) {
//     console.error('❌ Missing required environment variables');
//     process.exit(1);
// }
// // Initialize OpenAI client
// const openai = new OpenAI({
//     apiKey: process.env.OPENAI_API_KEY,
// });
// if (!fs.existsSync('./temp')) {
//     fs.mkdirSync('./temp');
//     console.log("✅ Created ./temp directory.");
// } else {
//     console.log("✅ ./temp directory already exists.");
// }

// const app = express();
// const PORT = process.env.PORT || 5000;
// const VERIFY_TOKEN = "Mohammad";

// app.use(cors());
// app.use(bodyParser.json());

// // Webhook verification
// app.get("/webhook", (req, res) => {
//     if (req.query["hub.mode"] === "subscribe" && req.query["hub.verify_token"] === VERIFY_TOKEN) {
//         res.status(200).send(req.query["hub.challenge"]);
//     } else {
//         res.sendStatus(403);
//     }
// });

// // Default route
// app.get('/', (req, res) => {
//     res.send('Backend is running');
// });

// // Admin login endpoint
// app.post('/admin/login', (req, res) => {
//     const { username, password } = req.body;

//     // Check credentials
//     if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
//         // Generate JWT token
//         const token = jwt.sign({ username }, SECRET_KEY, { expiresIn: '1h' });
//         return res.json({ token });
//     }
//     return res.status(401).json({ error: 'Invalid username or password' });
// });

// // Middleware to authenticate token
// const authenticateToken = (req, res, next) => {
//     const authHeader = req.headers['authorization'];
//     const token = authHeader && authHeader.split(' ')[1];

//     if (!token) return res.status(401).json({ error: 'Access denied. No token provided.' });

//     jwt.verify(token, SECRET_KEY, (err, user) => {
//         if (err) return res.status(403).json({ error: 'Invalid or expired token.' });
//         req.user = user;
//         next();
//     });
// };

// app.get('/admin/messages', authenticateToken, (req, res) => {
//     res.json({ systemMessage, guidanceMessage, defaultWelcomeMessage });
// });

// // Protected route: Update system and guidance messages  
// app.post('/admin/update-messages', authenticateToken, (req, res) => {
//     const { newSystemMessage, newGuidance } = req.body;

//     if (newSystemMessage) {
//         if (typeof newSystemMessage !== 'string') {
//             return res.status(400).json({ error: 'Invalid system message provided.' });
//         }
//         systemMessage = newSystemMessage;
//         console.log('✅ System message updated:', systemMessage);
//     }

//     if (newGuidance) {
//         if (typeof newGuidance !== 'string') {
//             return res.status(400).json({ error: 'Invalid guidance message provided.' });
//         }
//         guidanceMessage = newGuidance;
//         console.log('✅ Guidance message updated:', guidanceMessage);
//     }

//     res.json({ message: 'Messages updated successfully.' });
// });

// // Protected route: Update welcome message  
// app.post('/admin/update-welcome-message', authenticateToken, (req, res) => {
//     const { newWelcomeMessage } = req.body;

//     if (newWelcomeMessage && typeof newWelcomeMessage === 'string') {
//         defaultWelcomeMessage = newWelcomeMessage;
//         console.log('✅ Welcome message updated:', defaultWelcomeMessage);
//         res.json({ message: 'Welcome message updated successfully.' });
//     } else {
//         res.status(400).json({ error: 'Invalid welcome message provided.' });
//     }
// });

// // Guidance message (initially empty, can be updated by the admin)  
// let guidanceMessage = "";

// const defaultWelcomeMessage = `\ud83c\udf1f Welcome to *Lootah Biofuels Refining Company* \ud83c\udf1f\n\nYou can ask any question directly, and I will assist you. If you need further help, choose from the options below.`;

// // // System message for the virtual assistant  
// let systemMessage = `
// "**Guidance Letter for OpenAI**  

// **Company Name:** Lootah Biofuels  

// **About Lootah Biofuels:**  
// Lootah Biofuels was founded in 2010 in Dubai to address the growing demand for alternative fuels in the region. In alignment with the UAE’s vision for sustainable development, Lootah Biofuels aims to introduce and innovate sustainable solutions for the long-term energy requirements. By rapidly increasing production capacity, strengthening distribution channels, and redefining biodiesel quality, Lootah Biofuels continues to expand the reach of sustainable and environmentally friendly biofuels.  

// **Our Mission:**  
// Our mission is to deliver economic, operational, and environmental benefits for long-term customer satisfaction and sustainable growth.  

// **Our Aim:**  
// We aim to research, develop, and produce sustainable biofuels—clean, reliable alternatives to fossil fuels for transport that deliver real reductions in greenhouse gas emissions and help improve energy security.  

// **Our Founder:**  
// The CEO of Lootah Biofuels is Yousif Bin Saeed Al Lootah. A young and enthusiastic leader, Mr. Yousif Lootah oversees the daily operations of Lootah Biofuels in the UAE and globally, as well as the company’s strategic direction, growth, and expansion. With a vision for innovating sustainable solutions for long-term energy needs, Mr. Yousif Lootah launched Lootah Biofuels.  

// Prior to founding Lootah Biofuels, Mr. Yousif was actively involved in sustainability initiatives such as the Green Car Program, which has significantly progressed since its inception. The initiative started with converting part of the company fleet to Compressed Natural Gas (CNG) and expanded to include hybrid, electric, biodiesel, and solar vehicles.

// Mr. Yousif Lootah aims for 70% of transportation in the GCC market to come from renewable and sustainable sources by 2025. He envisions the UAE becoming the first nation in the region to mandate biofuel blends at all public stations. Many of the company’s ecological initiatives were his brainchild. Following the success of biofuel creation from waste management, Mr. Lootah recently signed agreements with educational institutions to raise awareness and provide training to the region’s youth, encouraging impactful sustainable practices.  

// **Services:**  
// - Biodiesel Production Plant  
// - Containerized Fuel Storage Tanks  
// - Biodiesel Production Plant Containerized  
// - Fuel Delivery Tanks  

// **UCO Division:**  
// **Used Cooking Oil (UCO):**  
// Lootah Biofuels has successfully developed a practical and viable solution to produce biofuel from Used Cooking Oil (UCO), resulting in a less expensive, renewable, and clean fuel. We are one of the largest UCO collectors authorized by Dubai Municipality and the only one with our own fuel outlets across Dubai.  

// Key Highlights:  
// - We provide financial incentives to UCO providers.  
// - Our main UCO sources include restaurants, bakeries, and food chains.  
// - By efficiently converting UCO waste into biofuel, we support the Municipality in preventing environmental hazards such as sewage problems.  
// - As part of our Corporate Social Responsibility, we prevent UCO from re-entering the food chain by converting it into fuel.  
// - UCO has the highest carbon-saving ratio among all available biodiesel feedstocks.  

// **Products:**  
// 1. **Glycerine:**  
//    Lootah Biofuels also produces glycerine, a by-product of the biodiesel production process. Glycerine is a versatile product used in various industries, including:  
//    - Confectioneries  
//    - Cosmetics  
//    - Pharmaceuticals  
//    - Tobacco  
//    - Polyurethanes  
//    - Alkyd resins  
//    - Skincare applications (moisturizing and cleansing properties)  

// 2. **Biodiesel B5:**  
//    Lootah Biofuels offers the UAE market an environmentally superior and performance-enhancing diesel blending agent at a competitive price. We produce Biodiesel B5, an ultra-low-sulfur diesel fuel blended with 5% biodiesel. This blend:  
//    - Acts as a lubricant to reduce carbon footprint and greenhouse gas emissions.  
//    - Is derived from converting used cooking oil to Biodiesel (B100) and blending it with high-quality ultra-low-sulfur petro-diesel in a 5:95 ratio.  
//    - Provides an eco-friendly alternative to conventional diesel.  

// For more details, visit: [Lootah Biofuels Website](https://www.lootahbiofuels.com/)  

// **End of Guidance Letter**

// `;

// // Truncate text function (kept separate)
// const truncateTextForAudio = (text, maxWords = 75) => {
//     const words = text.split(" ");
//     if (words.length > maxWords) {
//         return words.slice(0, maxWords).join(" ") + "...";
//     }
//     return text;
// };

// // OpenAI response function
// const getOpenAIResponse = async (userMessage, context = "", language = "en") => {
//     try {
//         const systemMessage = `
//             You are a friendly and intelligent WhatsApp assistant for Lootah Biofuels. 
//             Your goal is to assist users in completing their orders and answering their questions.
//             Always respond concisely, use emojis sparingly, and maintain a helpful attitude.
//             Generate the response in the user's language: ${language}.
//             Keep your responses very short and to the point. Each response should be no longer than 30 seconds when spoken.
//             For Arabic responses, ensure the answer is complete and concise, fitting within 100 tokens.
//         `;

//         const messages = [
//             { role: "system", content: systemMessage },
//             { role: "user", content: userMessage },
//         ];

//         if (context && context.trim() !== "") {
//             messages.push({ role: "system", content: context });
//         }

//         const response = await axios.post('https://api.openai.com/v1/chat/completions', {
//             model: "gpt-4",
//             messages,
//             max_tokens: 100, // Limit the response to 100 tokens
//             temperature: 0.7
//         }, {
//             headers: {
//                 'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
//                 'Content-Type': 'application/json'
//             }
//         });

//         // Truncate the OpenAI response using the truncateTextForAudio function
//         const responseText = response.data.choices[0].message.content.trim();
//         return truncateTextForAudio(responseText, 75); // Truncate to 75 words
//     } catch (error) {
//         console.error('❌ Error with OpenAI:', error.response?.data || error.message);
//         return "❌ Oops! Something went wrong. Please try again later.";
//     }
// };


// const userSessions = {};
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

// const isValidEmail = (email) => {
//     const regex = /^\S+@\S+\.\S+$/;
//     return regex.test(email);
// };

// const isValidPhone = (phone) => {
//     const regex = /^\+971(5\d{1}\s?\d{3}\s?\d{3}|\s?4\d{2}\s?\d{4})$/;
//     return regex.test(phone);
// };


// async function sendOrderSummary(to, session) {
//     try {
//         // Ensure session exists
//         if (!session) {
//             console.error("❌ Error: session is undefined.");
//             await sendToWhatsApp(to, "⚠️ Session error. Please restart the process.");
//             return;
//         }

//         // Ensure session.data is an object, reinitialize if necessary
//         if (!session.data || typeof session.data !== "object") {
//             console.error("❌ Error: session.data is corrupted. Reinitializing.");
//             session.data = {}; // Reset to an empty object
//         }

//         // Ensure language exists, default to English if undefined
//         const language = session.language || 'en';

//         const orderSummary = language === 'ar'
//             ? `📝 *ملخص الطلب*\n
// الاسم: ${session.data.name || 'غير متوفر'}
// الهاتف: ${session.data.phone || 'غير متوفر'} 
// البريد الإلكتروني: ${session.data.email || 'غير متوفر'}
// المدينة: ${session.data.city || 'غير متوفر'}
// العنوان: ${session.data.address || 'غير متوفر'}
// الشارع: ${session.data.street || 'غير متوفر'}
// اسم المبنى: ${session.data.building_name || 'غير متوفر'}
// رقم الشقة: ${session.data.flat_no || 'غير متوفر'}
// الكمية: ${session.data.quantity || 'غير متوفر'} لتر`
//             : `📝 *Order Summary*\n
// Name: ${session.data.name || 'Not provided'}
// Phone: ${session.data.phone || 'Not provided'}
// Email: ${session.data.email || 'Not provided'}
// City: ${session.data.city || 'Not provided'}
// Address: ${session.data.address || 'Not provided'}
// Street: ${session.data.street || 'Not provided'}
// Building: ${session.data.building_name || 'Not provided'}
// Flat: ${session.data.flat_no || 'Not provided'}
// Quantity: ${session.data.quantity || 'Not provided'} liters`;

//         const confirmationButtons = [
//             {
//                 type: "reply",
//                 reply: {
//                     id: "yes_confirm",
//                     title: language === 'ar' ? "تأكيد ✅" : "Confirm ✅"
//                 }
//             },
//             {
//                 type: "reply",
//                 reply: {
//                     id: "no_correct",
//                     title: language === 'ar' ? "تعديل ❌" : "Modify ❌"
//                 }
//             }
//         ];

//         console.log("📦 Sending order summary:", orderSummary);
//         await sendInteractiveButtons(to, orderSummary, confirmationButtons);

//     } catch (error) {
//         console.error("❌ Error sending order summary:", error);
//         await sendToWhatsApp(to, "❌ An error occurred while generating your order summary.");
//     }
// }
// const sendUpdatedSummary = async (to, session) => {
//     try {
//         // Ensure session exists
//         if (!session) {
//             console.error("❌ Error: session is undefined.");
//             await sendToWhatsApp(to, "⚠️ Session error. Please restart the process.");
//             return;
//         }

//         // Ensure session.data is an object, reinitialize if necessary
//         if (!session.data || typeof session.data !== "object") {
//             console.error("❌ Error: session.data is corrupted. Reinitializing.");
//             session.data = {}; // Reset to an empty object
//         }

//         // Ensure language exists, default to English if undefined
//         const language = session.language || 'en';

//         const orderSummary = language === 'ar'
//             ? `📝 * ملخص الطلب بعد التعديل*\n
// الاسم: ${session.data.name || 'غير متوفر'}
// الهاتف: ${session.data.phone || 'غير متوفر'} 
// البريد الإلكتروني: ${session.data.email || 'غير متوفر'}
// المدينة: ${session.data.city || 'غير متوفر'}
// العنوان: ${session.data.address || 'غير متوفر'}
// الشارع: ${session.data.street || 'غير متوفر'}
// اسم المبنى: ${session.data.building_name || 'غير متوفر'}
// رقم الشقة: ${session.data.flat_no || 'غير متوفر'}
// الكمية: ${session.data.quantity || 'غير متوفر'} لتر`
//             : `📝 *Summary of the Order after modification*\n
// Name: ${session.data.name || 'Not provided'}
// Phone: ${session.data.phone || 'Not provided'}
// Email: ${session.data.email || 'Not provided'}
// City: ${session.data.city || 'Not provided'}
// Address: ${session.data.address || 'Not provided'}
// Street: ${session.data.street || 'Not provided'}
// Building: ${session.data.building_name || 'Not provided'}
// Flat: ${session.data.flat_no || 'Not provided'}
// Quantity: ${session.data.quantity || 'Not provided'} liters`;

//         const confirmationButtons = [
//             {
//                 type: "reply",
//                 reply: {
//                     id: "yes_confirm",
//                     title: language === 'ar' ? "تأكيد ✅" : "Confirm ✅"
//                 }
//             },
//             {
//                 type: "reply",
//                 reply: {
//                     id: "no_correct",
//                     title: language === 'ar' ? "تعديل ❌" : "Modify ❌"
//                 }
//             }
//         ];

//         console.log("📦 Sending order summary:", orderSummary);
//         await sendInteractiveButtons(to, orderSummary, confirmationButtons);

//     } catch (error) {
//         console.error("❌ Error sending order summary:", error);
//         await sendToWhatsApp(to, "❌ An error occurred while generating your order summary.");
//     }
// };



// let dataStore = [];  // Array to temporarily store data

// function formatPhoneNumber(phoneNumber) {
//     // إزالة أي مسافات أو رموز غير ضرورية
//     let cleanedNumber = phoneNumber.replace(/\D/g, "");

//     // التأكد من أن الرقم يبدأ بـ "+"
//     if (!cleanedNumber.startsWith("+")) {
//         cleanedNumber = `+${cleanedNumber}`;
//     }
//     // إضافة مسافة بعد رمز الدولة (أول 3 أو 4 أرقام)
//     const match = cleanedNumber.match(/^\+(\d{1,4})(\d+)$/);
//     if (match) {
//         return `+${match[1]} ${match[2]}`; // إضافة المسافة بعد كود الدولة
//     }
//     return cleanedNumber; // إرجاع الرقم إذا لم ينطبق النمط
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
//     MODIFY: "modify",  // New state for modification,
//     CHANGE_INFO: "CHANGE_INFO",
//     CHANGE_INFOO:"CHANGE_INFOO"
// };

// // Helper function to validate text length
// const validateTextLength = (text) => {
//     if (!text || typeof text !== "string" || text.trim().length === 0) {
//         return false; // Text is empty or not a string
//     }
//     if (text.length > 1024) {
//         return false; // Text exceeds the maximum length
//     }
//     return true;
// };

// // Helper function to truncate text if it exceeds the maximum length
// const truncateText = (text, maxLength = 1024) => {
//     return text.length > maxLength ? text.slice(0, maxLength) : text;
// };

// const sendInteractiveButtons = async (to, message, buttons) => {
//     // Validate the message text length
//     if (!validateTextLength(message)) {
//         console.error("❌ Invalid message text length. Message must be between 1 and 1024 characters.");
//         await sendToWhatsApp(to, "Sorry, there was an issue processing your request. Please try again.");
//         return;
//     }

//     // Truncate the message if it exceeds 1024 characters
//     const truncatedMessage = truncateText(message, 1024);

//     try {
//         // Construct the payload
//         const payload = {
//             messaging_product: "whatsapp",
//             recipient_type: "individual",
//             to: to,
//             type: "interactive",
//             interactive: {
//                 type: "button",
//                 body: { text: truncatedMessage }, // Use truncated message
//                 action: {
//                     buttons: buttons.map(button => {
//                         if (button.type === "location_request") {
//                             return {
//                                 type: "location_request",
//                                 title: button.title || "📍 Send Location"
//                             };
//                         } else {
//                             return {
//                                 type: "reply",
//                                 reply: {
//                                     id: button.reply.id,
//                                     title: button.reply.title
//                                 }
//                             };
//                         }
//                     })
//                 }
//             }
//         };

//         console.log("✅ Sending Interactive Buttons Payload:", JSON.stringify(payload, null, 2));

//         // Send the payload to the WhatsApp API
//         const response = await axios.post(process.env.WHATSAPP_API_URL, payload, {
//             headers: {
//                 "Authorization": `Bearer ${process.env.WHATSAPP_ACCESS_TOKEN}`,
//                 "Content-Type": "application/json"
//             }
//         });

//         console.log("✅ Interactive Buttons Response:", response.data);
//     } catch (error) {
//         console.error("❌ Failed to send interactive buttons:", error.response?.data || error.message);

//         // Send a fallback message to the user if the request fails
//         await sendToWhatsApp(to, "Sorry, there was an issue processing your request. Please try again.");
//     }
// };



// const sendInteractiveButtons2 = async (to, message, buttons) => {
//     // Validate the message text length
//     if (!validateTextLength(message)) {
//         console.error("❌ Invalid message text length. Message must be between 1 and 1024 characters.");
//         await sendToWhatsApp(to, "Sorry, there was an issue processing your request. Please try again.");
//         return;
//     }

//     // Truncate the message if it exceeds 1024 characters
//     const truncatedMessage = truncateText(message, 1024);

//     try {
//         // Construct the payload
//         const payload = {
//             messaging_product: "whatsapp",
//             recipient_type: "individual",
//             to: to,
//             type: "interactive",
//             interactive: {
//                 type: "button",
//                 body: { text: truncatedMessage }, // Use truncated message
//                 action: {
//                     buttons: buttons.map(button => ({
//                         type: "reply",
//                         reply: {
//                             id: button.id, 
//                             title: button.title
//                         }
//                     }))
//                 }
//             }
//         };

//         console.log("✅ Sending Interactive Buttons Payload:", JSON.stringify(payload, null, 2));

//         // Send the payload to the WhatsApp API
//         const response = await axios.post(process.env.WHATSAPP_API_URL, payload, {
//             headers: {
//                 "Authorization": `Bearer ${process.env.WHATSAPP_ACCESS_TOKEN}`,
//                 "Content-Type": "application/json"
//             }
//         });

//         console.log("✅ Interactive Buttons Response:", response.data);
//     } catch (error) {
//         console.error("❌ Failed to send interactive buttons:", error.response?.data || error.message);

//         // Send a fallback message to the user if the request fails
//         await sendToWhatsApp(to, "Sorry, there was an issue processing your request. Please try again.");
//     }
// };


// function extractQuantity(text) {
//     // Match both Western Arabic (0-9) and Eastern Arabic (٠-٩) numerals
//     const match = text.match(/[\d\u0660-\u0669]+/);
//     if (match) {
//         // Convert Eastern Arabic numerals to Western Arabic numerals
//         return convertArabicNumbers(match[0]);
//     }
//     return null;
// }

// function convertArabicNumbers(arabicNumber) {
//     const arabicToWestern = {
//         "٠": "0", "١": "1", "٢": "2", "٣": "3", "٤": "4",
//         "٥": "5", "٦": "6", "٧": "7", "٨": "8", "٩": "9"
//     };
//     return arabicNumber.replace(/[\u0660-\u0669]/g, d => arabicToWestern[d] || d);
// }
// const sendCitySelection = async (to, language) => {
//     try {
//         const cityPrompt = language === 'ar'
//             ? 'يرجى اختيار المدينة من القائمة:'
//             : 'Please select your city from the list:';

//         const cityOptions = [
//             { id: "abu_dhabi", title: language === 'ar' ? 'أبو ظبي' : 'Abu Dhabi' },
//             { id: "dubai", title: language === 'ar' ? 'دبي' : 'Dubai' },
//             { id: "sharjah", title: language === 'ar' ? 'الشارقة' : 'Sharjah' },
//             { id: "ajman", title: language === 'ar' ? 'عجمان' : 'Ajman' },
//             { id: "umm_al_quwain", title: language === 'ar' ? 'أم القيوين' : 'Umm Al Quwain' },
//             { id: "ras_al_khaimah", title: language === 'ar' ? 'رأس الخيمة' : 'Ras Al Khaimah' },
//             { id: "fujairah", title: language === 'ar' ? 'الفجيرة' : 'Fujairah' }
//         ];

//         const payload = {
//             messaging_product: "whatsapp",
//             recipient_type: "individual",
//             to: to,
//             type: "interactive",
//             interactive: {
//                 type: "list",
//                 body: {
//                     text: cityPrompt
//                 },
//                 action: {
//                     button: language === 'ar' ? 'اختر المدينة' : 'Select City',
//                     sections: [
//                         {
//                             title: language === 'ar' ? 'المدن' : 'Cities',
//                             rows: cityOptions.map(city => ({
//                                 id: city.id,
//                                 title: city.title
//                             }))
//                         }
//                     ]
//                 }
//             }
//         };
// //
//         console.log("Sending City Selection Payload:", JSON.stringify(payload, null, 2));

//         const response = await axios.post(process.env.WHATSAPP_API_URL, payload, {
//             headers: {
//                 Authorization: `Bearer ${process.env.WHATSAPP_ACCESS_TOKEN}`,
//                 "Content-Type": "application/json"
//             }
//         });

//         console.log("City Selection Response:", response.data);
//     } catch (error) {
//         console.error("Error sending city selection:", error.response?.data || error.message);
//     }
// };


// function extractCity(text, language = "en") {
//     const cities = {
//         en: ["Dubai", "Abu Dhabi", "Sharjah", "Ajman", "Ras Al Khaimah", "Fujairah", "Umm Al Quwain"],
//         ar: ["دبي", "أبو ظبي", "الشارقة", "عجمان", "رأس الخيمة", "الفجيرة", "أم القيوين"]
//     };

//     const normalizedText = text.normalize("NFKC").toLowerCase().trim();
//     console.log("Normalized user text:", normalizedText);

//     for (const city of cities[language]) {
//         const normalizedCity = city.normalize("NFKC").toLowerCase();
//         console.log("Checking city:", normalizedCity);
//         if (normalizedText.includes(normalizedCity) || normalizedText.includes(normalizedCity.replace(/\s/g, ""))) {
//             console.log("Matched city:", city);
//             return city;
//         }
//     }
//     console.log("No city matched.");
//     return null;
// }
// async function extractInformationFromText(text, language = "en") {
//     const extractedData = {
//         quantity: extractQuantity(text), // Extract quantity
//         city: extractCity(text, language) // Extract city
//     };

//     // Extract name using regex or simple logic
//     const nameMatch = text.match(/(?:انا|اسمي|my name is|name is)\s+([\u0600-\u06FF\s]+|[a-zA-Z\s]+)/i);
//     if (nameMatch && nameMatch[1]) {
//         extractedData.name = nameMatch[1].trim();
//     }

//     // Extract phone number using regex
//     const phoneRegex = /(?:\+971|0)?(?:5\d|4\d)\s?\d{3}\s?\d{3}/; // Matches UAE phone numbers
//     const phoneMatch = text.match(phoneRegex);
//     if (phoneMatch) {
//         extractedData.phone = formatPhoneNumber(phoneMatch[0]); // Format the phone number
//     }

//     // Use OpenAI for additional extraction
//     const prompt = `
//     Extract the following information from the text and return a valid JSON object:
//     {
//       "name": "The user's full name or null",
//       "phone": "The user's phone number or null",
//       "email": "The user's email address or null",
//       "address": "The user's full address or null",
//       "city": "The user's city (e.g., Dubai, Sharjah, Abu Dhabi) or null",
//       "street": "The user's street name or null",
//       "building_name": "The user's building name or null",
//       "flat_no": "The user's flat number or null",
//       "latitude": "The user's latitude or null",
//       "longitude": "The user's longitude or null",
//       "quantity": "The user's quantity (in liters) or null"
//     }

//     If any information is missing, assign null to that field.

//     **Rules for Arabic Text:**
//     1. Recognize city names in Arabic: دبي (Dubai), أبو ظبي (Abu Dhabi), الشارقة (Sharjah).
//     2. Extract names written in Arabic script.
//     3. Extract phone numbers in UAE format (e.g., +9715xxxxxxxx).

//     Text: ${text}
// `;

//     const aiResponse = await getOpenAIResponse(prompt, ``, language); // Pass prompt, not textRaw

//     try {
//         const aiExtractedData = JSON.parse(aiResponse);
//         return { ...aiExtractedData, ...extractedData };
//     } catch (e) {
//         console.error("❌ Failed to parse AI response as JSON:", aiResponse);
//         return extractedData; // Return at least the manually extracted data
//     }
// }
// function getMissingFields(sessionData) {
//     // Define fields in the desired sequence
//     const orderedFields = [
//         'name',
//         'phone',
//         'email',
//         'latitude',
//         'longitude',
//         'address',
//         'city',
//         'street',
//         'building_name',
//         'flat_no',
//         'quantity'
//     ];

//     const missingFields = [];

//     // Check fields in specified order
//     orderedFields.forEach(field => {
//         const value = sessionData[field];
//         if (value === null ||
//             value === undefined ||
//             (typeof value === "string" &&
//                 (value.trim() === "" || value.trim().toLowerCase() === "null"))
//         ) {
//             missingFields.push(field);
//         }
//     });

//     // Handle location fields
//     if (missingFields.includes('latitude') || missingFields.includes('longitude')) {
//         missingFields.push('location');
//     }

//     // Remove technical fields and preserve order
//     return missingFields
//         .filter(field => !['latitude', 'longitude'].includes(field))
//         .sort((a, b) => orderedFields.indexOf(a) - orderedFields.indexOf(b));
// }

// async function askForNextMissingField(session, from) {
//     const missingFields = getMissingFields(session.data);
//     const lang = session.language; // Get current session language

//     if (missingFields.length === 0) {
//         session.step = STATES.CONFIRMATION;
//         await sendOrderSummary(from, session);
//     } else {
//         const nextField = missingFields[0];
//         session.step = `ASK_${nextField.toUpperCase()}`;

//         switch (nextField) {
//             case "city":
//                 await sendCitySelection(from, lang);
//                 break;
//             case "email":
//                 await sendToWhatsApp(from, getEmailMessage(lang));
//                 break;
//             case "name":
//                 await sendToWhatsApp(from, getNameMessage(lang));
//                 break;
//             case "phone":
//                 await sendToWhatsApp(from, getPhoneMessage(lang));
//                 break;
//             case "location":
//                 await sendToWhatsApp(from, getLocationMessage(lang));
//                 break;
//             case "address":
//                 await sendToWhatsApp(from, getAddressMessage(lang));
//                 break;
//             case "street":
//                 await sendToWhatsApp(from, getStreetMessage(lang));
//                 break;
//             case "building_name":
//                 await sendToWhatsApp(from, getBuildingMessage(lang));
//                 break;
//             case "flat_no":
//                 await sendToWhatsApp(from, getFlatMessage(lang));
//                 break;
//             case "quantity":
//                 await sendQuantitySelection(from, lang);
//                 break;
//             default:
//                 await sendToWhatsApp(from, lang === 'ar'
//                     ? `🔹 يرجى تقديم ${nextField.replace(/_/g, " ")}`
//                     : `🔹 Please provide your ${nextField.replace(/_/g, " ")}`);
//                 break;
//         }
//     }
// }
// //
// async function isQuestionOrRequest(text) {
//     const prompt = `
//     Classify the user's input into one of the following categories:

//     1️⃣ **"request"** → If the user is making a service request or wants to start a new request. Examples:
//        - "I want to create a request"
//        - "I want to create a new request"
//        - "I have oil I want to get rid of"
//        - "Hello, I have 50 liters of oil in Dubai"
//        - "Please collect oil from my location"
//        - "I need a pickup for used oil"
//        - "New order request"
//        - "I am Mohammad and I have 50 liters in Sharjah"
//         - "أريد إنشاء طلب جديد"
//         - "لدي زيت أريد التخلص منه"
//         - "الرجاء جمع الزيت من موقعي"
//         - "أحتاج إلى استلام الزيت المستعمل"
//         - "طلب جديد"
//         - "أنا محمد ولدي 50 لتر في الشارقة"

//     2️⃣ **"question"** → If the user is **asking for information** about the company, services, or anything general. Examples:
//        - "What services do you provide?"
//        - "How does your oil collection work?"
//        - "Where are you located?"
//        - "What is the cost of biodiesel?"

//     3️⃣ **"greeting"** → If the user is just saying hello. Examples:
//        - "Hi"
//        - "Hello"
//        - "Good morning"

//     4️⃣ **"other"** → If the input does not fit the above categories.

//     Respond ONLY with one of these words: "request", "question", "greeting", or "other".

//     **User Input:** "${text}"
// `;

//     const aiResponse = await getOpenAIResponse(prompt);
//     const response = aiResponse.trim().toLowerCase();

//     return response;
// }

// const getButtonTitle = (buttonId, language) => {
//     const buttonTitles = {
//         "contact_us": { en: "Contact Us", ar: "اتصل بنا" },
//         "new_request": { en: "New Request", ar: "طلب جديد" },
//         "send_site": { en: "Send Site", ar: "إرسال الموقع" }
//     };

//     return buttonTitles[buttonId]?.[language] || buttonTitles[buttonId]?.en || buttonId;
// };
// function getContactMessage(language) {
//     return language === 'ar' ? '📞 يمكنك الاتصال بنا على support@example.com أو الاتصال على +1234567890.' : '📞 You can contact us at support@example.com or call +1234567890.';
// }
// function getNameMessage(language) {
//     return language === 'ar' ? '🔹 يرجى تقديم اسمك الكامل.' : '🔹 Please provide your full name.';
// }

// function getEmailMessage(language) {
//     return language === 'ar' ? '📧 يرجى تقديم عنوان بريدك الإلكتروني.' : '📧 Please provide your email address.';
// }

// function getInvalidOptionMessage(language) {
//     return language === 'ar' ? '❌ خيار غير صالح، يرجى تحديد زر صالح.' : '❌ Invalid option, please select a valid button.';
// }
// function getPhoneMessage(language) {
//     return language === 'ar' ? '📱 يرجى تقديم رقم هاتفك (يجب أن يكون رقم إماراتي).' : '📱 Please provide your phone number (must be a valid Emirati number).';
// }

// function getInvalidPhoneMessage(language) {
//     return language === 'ar' ? '❌ رقم الهاتف غير صالح، يرجى إدخال رقم إماراتي صالح.' : '❌ Invalid phone number, please enter a valid Emirati number.';
// }

// function getAddressMessage(language) {
//     return language === 'ar' ? '📍 يرجى تقديم عنوانك الكامل.' : '📍 Please provide your full address.';
// }

// function getCitySelectionMessage(language) {
//     return language === 'ar' ? '🏙️ يرجى اختيار مدينتك من الخيارات أدناه.' : '🏙️ Please select your city from the options below.';
// }

// function getInvalidCityMessage(language) {
//     return language === 'ar' ?
//         '❌ المدينة المحددة لا تتطابق مع موقعك. يرجى اختيار المدينة الصحيحة.' :
//         '❌ The selected city does not match your location. Please choose the correct city.';
// }

// function getStreetMessage(language) {
//     return language === 'ar' ? '🏠 يرجى تقديم اسم الشارع.' : '🏠 Please provide the street name.';
// }

// function getBuildingMessage(language) {
//     return language === 'ar' ? '🏢 يرجى تقديم اسم المبنى.' : '🏢 Please provide the building name.';
// }

// function getFlatMessage(language) {
//     return language === 'ar' ? '🚪 يرجى تقديم رقم الشقة.' : '🚪 Please provide the flat number.';
// }

// const getLocationMessage = (language) => {
//     return language === 'ar'
//         ? "📍 يرجى مشاركة موقعك الحالي لتحديد موقعك."
//         : "📍 Please share your current location to determine your site.";
// };


// function getQuantityMessage(language) {
//     return language === 'ar' ? '📦 يرجى إدخال الكمية (باللترات).' : '📦 Please provide the quantity (in liters).';
// }

// function getInvalidQuantityMessage(language) {
//     return language === 'ar' ? '❌ يرجى إدخال كمية صالحة (أرقام فقط).' : '❌ Please enter a valid quantity (numeric values only).';
// }

// function getConfirmationMessage(language) {
//     return language === 'ar' ? '✅ يرجى التأكيد على صحة التفاصيل قبل الإرسال.' : '✅ Please confirm that the details are correct before submission.';
// }
// function getContinueMessage(language) {
//     return language === 'ar' ?
//         'لإكمال الاستفسار، يمكنك طرح أسئلة أخرى. إذا كنت ترغب في تقديم طلب أو الاتصال بنا، اختر من الخيارات التالية:' :
//         'To complete the inquiry, you can ask other questions. If you want to submit a request or contact us, choose from the following options:';
// }
// function getInvalidUAERegionMessage(language) {
//     return language === 'ar' ?
//         '❌ الموقع الذي أرسلته خارج الإمارات. يرجى إرسال موقع داخل الإمارات.' :
//         '❌ The location you shared is outside the UAE. Please send a location within the Emirates.';
// }
// //


// //
// const detectRequestStart = async (text) => {
//     const prompt = `
//         Determine if the user's message indicates the start of a request for Lootah Biofuels. 
//         Respond with "true" if the message indicates a request start, otherwise respond with "false".

//         Examples of request start:
//         - "I want to create a request"
//         - "I have oil I want to get rid of"
//         - "Please collect oil from my location"
//         - "I need a pickup for used oil"
//         - "New order request"
//         - "I am Mohammad and I have 50 liters in Sharjah"
//         - "أريد إنشاء طلب جديد"
//         - "لدي زيت أريد التخلص منه"
//         - "الرجاء جمع الزيت من موقعي"
//         - "أحتاج إلى استلام الزيت المستعمل"
//         - "طلب جديد"
//         - "أنا محمد ولدي 50 لتر في الشارقة"

//         User Input: "${text}"
//     `;

//     const response = await getOpenAIResponse(prompt);
//     return response.trim().toLowerCase() === "true";
// };
// function moveToNextStep(session, from) {  // ✅ Add parameters
//     const missingFields = getMissingFields(session.data);
//     if (missingFields.length === 0) {
//         session.step = STATES.CONFIRMATION;
//         sendOrderSummary(from, session);
//     } else {
//         session.step = `ASK_${missingFields[0].toUpperCase()}`;
//         askForNextMissingField(session, from);
//     }
// }
// const validateCityAndLocation = async (latitude, longitude, selectedCity) => {
//     try {
//         // If location is not available, accept the city without validation
//         if (!latitude || !longitude) {
//             return {
//                 isValid: true,
//                 actualCity: null
//             };
//         }

//         // Use a geocoding API to get the city name from the latitude and longitude
//         const response = await axios.get(
//             `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`
//         );
//         const actualCity = response.data.city;

//         // Normalize city names for comparison
//         const normalizedSelectedCity = selectedCity.toLowerCase().trim();
//         const normalizedActualCity = actualCity.toLowerCase().trim();

//         // Return both the validation result and the actual city name
//         return {
//             isValid: normalizedSelectedCity === normalizedActualCity,
//             actualCity: actualCity
//         };
//     } catch (error) {
//         console.error("❌ Error validating city and location:", error);
//         return {
//             isValid: true, // Fail open
//             actualCity: null
//         };
//     }
// };

// // with 532218805
// async function checkUserRegistration(phoneNumber) {
//     try {
//         // Remove any non-numeric characters
//         let cleanedNumber = phoneNumber.replace(/\D/g, '');

//         // Remove country code if it's Saudi (+966 or 966) or UAE (+971 or 971)
//         if (cleanedNumber.startsWith('966')) {
//             cleanedNumber = cleanedNumber.slice(3); // Remove Saudi country code
//         } else if (cleanedNumber.startsWith('971')) {
//             cleanedNumber = cleanedNumber.slice(3); // Remove UAE country code
//         }

//         const response = await axios.get('https://dev.lootahbiofuels.com/api/v1/check-user', {
//             headers: {
//                 'API-KEY': 'iUmcFyQUYa7l0u5J1aOxoGpIoh0iQSqpAlXX8Zho5vfxlTK4mXr41GvOHc4JwIkvltIUSoCDmc9VMbmJLajSIMK3NHx3M5ggaff8JMBTlZCryZlr8SmmhmYGGlmXo8uM',
//                 'Accept': 'application/json',
//                 'Content-Type': 'application/json'
//             },
//             params: { phone_number: cleanedNumber }
//         });

//         console.log('🔹 API Response:', response.data);

//         if (response.data?.exists && response.data.user) {
//             const user = {
//                 id: response.data.user.id,
//                 name: response.data.user.first_name || 'User', // Use first_name or a default value
//                 email: response.data.user.email,
//                 phone: response.data.user.phone_number,
//                 city: response.data.addresses?.city,
//                 address: response.data.addresses?.address,
//                 street: response.data.addresses?.street,
//                 building_name: response.data.addresses?.building_name,
//                 flat_no: response.data.addresses?.flat_no,
//                 latitude: response.data.addresses?.latitude,
//                 longitude: response.data.addresses?.longitude
//             };
//             return user;
//         } else {
//             return null; // Explicitly return null if not registered
//         }
//     } catch (error) {
//         console.error('❌ Error checking user registration:', error);
//         if (error.response) {
//             console.error('❌ API Error Response:', error.response.data);
//             console.error('❌ API Status Code:', error.response.status);
//         }
//         return null;
//     }
// }

// async function getAddressFromCoordinates(latitude, longitude) {
//     try {
//         const response = await axios.get(`https://nominatim.openstreetmap.org/reverse`, {
//             params: { lat: latitude, lon: longitude, format: "json" }
//         });

//         if (response.data && response.data.address) {
//             console.log("🔍 Address API Response:", response.data.address); // Debugging

//             return formatAddress(response.data.address);
//         }
//         return null;
//     } catch (error) {
//         console.error("❌ Reverse Geocoding Error:", error);
//         return null;
//     }
// }


// // Function to format the address into a readable string
// function formatAddress(address) {
//     const street = address.road || address.street || address.neighbourhood || address.suburb || "";
//     const city = address.city || address.town || address.village || address.state || "";
//     const country = address.country || "";

//     return [street, city, country].filter(Boolean).join(", "); // Join non-empty parts
// }

// function extractStreetName(address) {
//     if (!address) return "Unknown Street";

//     // Prioritize main street-related fields
//     return address.road || 
//            address.street || 
//            address.residential || // Sometimes used in residential areas
//            address.neighbourhood || 
//            address.suburb || 
//            address.city_district || // Extra fallback for districts
//            "Unknown Street"; 
// }
// async function sendQuantitySelection(user, language) {
//     const message = language === "ar"
//         ? "🛢️ يرجى اختيار كمية الزيت أو إدخالها يدويًا:"
//         : "🛢️ Please select the oil quantity or enter manually:";

//     const buttons = [
//         { id: "10", title: "10 Liters" },
//         { id: "15", title: "15 Liters" },
//         { id: "20", title: "20 Liters" }
//     ];

//     console.log("🔹 Sending interactive buttons for quantity selection...");
//     await sendInteractiveButtons2(user, message, buttons);
// }

// // Function to validate and extract a single emoji
// const extractSingleEmoji = (text) => {
//     // Match a single emoji using a regex pattern
//     const emojiRegex = /\p{Emoji}/u;
//     const match = text.match(emojiRegex);
//     return match ? match[0] : "👍"; // Default to "👍" if no valid emoji is found
// };

// // Function to get an emoji reaction based on the user's message
// const getEmojiReaction = async (userMessage, language = "en") => {
//     try {
//         const systemMessage = `
//             You are an emoji reaction generator. Based on the user's message, suggest an appropriate emoji reaction.
//             Your response should ONLY contain the emoji, nothing else.
//             Examples:
//             - If the user says "thank you", respond with "❤️".
//             - If the user says "hello" or "hi", respond with "👋".
//             - If the user provides information, respond with "👍".
//             - If the user seems confused, respond with "🤔".
//             - If the user is happy, respond with "😊".
//             - If the user is upset, respond with "😔".
//             - If the user is joking, respond with "😂".
//             - If the user is asking for help, respond with "🆘".
//             - If the user is excited, respond with "🎉".
//             - If the user is neutral, respond with "👍".
//         `;

//         const response = await getOpenAIResponse(userMessage, systemMessage, language);
//         const emoji = extractSingleEmoji(response.trim()); // Extract a single emoji
//         return emoji;
//     } catch (error) {
//         console.error('❌ Error getting emoji reaction:', error);
//         return "👍"; // Default emoji if something goes wrong
//     }
// };

// // Function to send a reaction (emoji) to a message
// const sendReaction = async (to, messageId, emoji) => {
//     try {
//         await axios.post(process.env.WHATSAPP_API_URL, {
//             messaging_product: 'whatsapp',
//             recipient_type: 'individual',
//             to: to,
//             type: 'reaction',
//             reaction: {
//                 message_id: messageId,
//                 emoji: emoji
//             }
//         }, {
//             headers: {
//                 'Authorization': `Bearer ${process.env.WHATSAPP_ACCESS_TOKEN}`,
//                 'Content-Type': 'application/json'
//             }
//         });
//     } catch (error) {
//         console.error('❌ Failed to send reaction:', error.response?.data || error.message);
//     }
// };

// // Function to validate a URL
// const isValidUrl = (url) => {
//     try {
//         new URL(url); // This will throw an error if the URL is invalid
//         return true;
//     } catch (error) {
//         return false;
//     }
// };

// // Function to download a file from a URL
// const downloadFile = async (url, filePath) => {
//     const response = await axios({
//         url,
//         method: 'GET',
//         responseType: 'stream',
//         headers: {
//             'Authorization': `Bearer ${process.env.WHATSAPP_ACCESS_TOKEN}`,
//         },
//     });
//     const writer = fs.createWriteStream(filePath);
//     response.data.pipe(writer);
//     return new Promise((resolve, reject) => {
//         writer.on('finish', resolve);
//         writer.on('error', reject);
//     });
// };

// // Function to transcribe a voice file using OpenAI's Whisper API
// const transcribeVoiceMessage = async (filePath) => {
//     try {
//         const transcription = await openai.audio.transcriptions.create({
//             file: fs.createReadStream(filePath),
//             model: "whisper-1",
//         });
//         return transcription.text;
//     } catch (error) {
//         console.error('❌ Error transcribing voice message:', error);
//         return null;
//     }
// };

// const fetchMediaUrl = async (mediaId) => {
//     try {
//         const response = await axios.get(`https://graph.facebook.com/v19.0/${mediaId}`, {
//             headers: {
//                 'Authorization': `Bearer ${process.env.WHATSAPP_ACCESS_TOKEN}`,
//             },
//         });
//         return response.data.url; // Returns the URL of the media file
//     } catch (error) {
//         console.error('❌ Error fetching media URL:', error.response?.data || error.message);
//         return null;
//     }
// };

// const generateAudio = async (text, filePath) => {
//     try {
//         const mp3 = await openai.audio.speech.create({
//             model: "tts-1",
//             voice: "alloy", // Options: alloy, echo, fable, onyx, nova, shimmer
//             input: text,
//         });

//         const buffer = Buffer.from(await mp3.arrayBuffer());
//         fs.writeFileSync(filePath, buffer);
//         console.log("🔹 Audio file generated successfully:", filePath);

//         // Check MIME type of the generated file
//         const mimeType = mime.lookup(filePath);
//         if (mimeType !== "audio/mpeg") {
//             console.error("❌ Invalid file format. Expected audio/mpeg, got:", mimeType);
//             throw new Error("Invalid file format");
//         }

//         return filePath;
//     } catch (error) {
//         console.error("❌ Error generating audio:", error);
//         throw error;
//     }
// };
// const uploadMediaToWhatsApp = async (filePath) => {
//     try {
//         // Check file format
//         const mimeType = mime.lookup(filePath);
//         if (mimeType !== "audio/mpeg") {
//             console.error("❌ Invalid file format. Expected audio/mpeg, got:", mimeType);
//             throw new Error("Invalid file format");
//         }

//         // Check file size
//         const fileStats = fs.statSync(filePath);
//         const fileSizeInMB = fileStats.size / (1024 * 1024);
//         if (fileSizeInMB > 16) {
//             console.error("❌ File size exceeds WhatsApp's limit (16 MB):", fileSizeInMB);
//             throw new Error("File size too large");
//         }

//         // Read file content
//         const fileContent = fs.readFileSync(filePath);

//         // Create FormData
//         const formData = new FormData();
//         formData.append("file", fileContent, {
//             filename: path.basename(filePath), // Use path.basename to get the filename
//             contentType: "audio/mpeg",
//         });
//         formData.append("messaging_product", "whatsapp");
//         formData.append("type", "audio/mpeg");

//         // Upload file to WhatsApp
//         const response = await axios.post(
//             `https://graph.facebook.com/v20.0/${process.env.PHONE_NUMBER_ID}/media`,
//             formData,
//             {
//                 headers: {
//                     ...formData.getHeaders(),
//                     "Authorization": `Bearer ${process.env.WHATSAPP_ACCESS_TOKEN}`,
//                 },
//             }
//         );

//         console.log("✅ Media uploaded to WhatsApp:", response.data);
//         return response.data.id; // Return the media ID
//     } catch (error) {
//         console.error("❌ Error uploading media to WhatsApp:", {
//             message: error.message,
//             response: error.response?.data,
//             stack: error.stack,
//         });
//         throw error;
//     }
// };

// const sendAudioUsingMediaId = async (to, mediaId) => {
//     try {
//         const payload = {
//             messaging_product: "whatsapp",
//             recipient_type: "individual",
//             to: to,
//             type: "audio",
//             audio: {
//                 id: mediaId, // Use the media ID instead of a URL
//             },
//         };

//         const response = await axios.post(process.env.WHATSAPP_API_URL, payload, {
//             headers: {
//                 "Authorization": `Bearer ${process.env.WHATSAPP_ACCESS_TOKEN}`,
//                 "Content-Type": "application/json",
//             },
//         });

//         console.log("✅ Audio sent successfully:", response.data);
//     } catch (error) {
//         console.error("❌ Failed to send audio:", error.response?.data || error.message);
//         throw error;
//     }
// };

// // Webhook endpoint
// app.post('/webhook', async (req, res) => {
//     try {
//         console.log("🔹 Incoming Webhook Data:", JSON.stringify(req.body, null, 2));
//         if (!req.body.entry || !Array.isArray(req.body.entry) || req.body.entry.length === 0) {
//             console.error("❌ Error: Missing or invalid 'entry' in webhook payload.");
//             return res.sendStatus(400);
//         }

//         const entry = req.body.entry[0];
//         if (!entry.changes || !Array.isArray(entry.changes) || entry.changes.length === 0) {
//             console.error("❌ Error: Missing or invalid 'changes' in webhook payload.");
//             return res.sendStatus(400);
//         }

//         const changes = entry.changes[0];
//         const value = changes.value;
//         if (!value?.messages || !Array.isArray(value.messages) || value.messages.length === 0) {
//             console.warn("⚠️ No messages found in webhook payload. Ignoring event.");
//             return res.sendStatus(200);
//         }

//         const message = value.messages[0];
//         const from = message.from;

//         if (!message?.from) {
//             console.error("❌ Error: Missing 'from' field in message.");
//             return res.sendStatus(400);
//         }
//         let session = userSessions[from];

//         const messageId = message.id; // Get the message ID for reactions
//         let textRaw = message.text?.body || "";

//         // Get an emoji reaction based on the user's message
//         const emoji = await getEmojiReaction(textRaw, session?.language || "en");
//         await sendReaction(from, messageId, emoji); // Send the reaction

//         const text = textRaw.toLowerCase().trim();
//         let detectedLanguage = "en";

//         try {
//             const detected = langdetect.detect(textRaw);
//             if (Array.isArray(detected) && detected.length > 0) {
//                 detectedLanguage = detected[0].lang;
//             }
//             if (detectedLanguage !== "ar" && detectedLanguage !== "en") {
//                 detectedLanguage = "en";
//             }
//         } catch (error) {
//             console.log("⚠️ Language detection failed. Defaulting to English.", error);
//         }

//         if (!session) {
//             const user = await checkUserRegistration(from);
//             if (user && user.name) {
//                 let welcomeMessage = await getOpenAIResponse(
//                     `Welcome back, ${user.name}. Generate a WhatsApp welcome message for Lootah Biofuels.`,
//                     "",
//                     detectedLanguage
//                 );
//                 await sendInteractiveButtons(from, welcomeMessage, [
//                     { type: "reply", reply: { id: "contact_us", title: getButtonTitle("contact_us", detectedLanguage) } },
//                     { type: "reply", reply: { id: "new_request", title: getButtonTitle("new_request", detectedLanguage) } }
//                 ]);
//                 userSessions[from] = {
//                     step: STATES.WELCOME,
//                     data: user,
//                     language: detectedLanguage,
//                     inRequest: false,
//                     lastTimestamp: Number(message.timestamp)
//                 };
//             } else {
//                 userSessions[from] = {
//                     step: STATES.WELCOME,
//                     data: { phone: from },
//                     language: detectedLanguage,
//                     inRequest: false,
//                     lastTimestamp: Number(message.timestamp)
//                 };
//                 const welcomeMessage = await getOpenAIResponse(
//                     "Generate a WhatsApp welcome message for Lootah Biofuels.",
//                     "",
//                     detectedLanguage
//                 );
//                 await sendInteractiveButtons(from, welcomeMessage, [
//                     { type: "reply", reply: { id: "contact_us", title: getButtonTitle("contact_us", detectedLanguage) } },
//                     { type: "reply", reply: { id: "new_request", title: getButtonTitle("new_request", detectedLanguage) } }
//                 ]);
//             }
//             return res.sendStatus(200);
//         }

//         // Handle voice messages
//         if (message.type === "audio" && message.audio) {
//             const mediaId = message.audio.id; // Get the media ID

//             // Fetch the media URL using the media ID
//             const audioUrl = await fetchMediaUrl(mediaId);
//             if (!audioUrl || !isValidUrl(audioUrl)) {
//                 console.error("❌ Invalid or missing audio URL:", audioUrl);
//                 await sendToWhatsApp(from, "Sorry, I couldn't process your voice message. Please try again.");
//                 return res.sendStatus(200);
//             }

//             const filePath = `./temp/${messageId}.ogg`; // Unique temporary file path

//             try {
//                 // Download the voice file
//                 await downloadFile(audioUrl, filePath);
//                 console.log("🔹 Voice file downloaded successfully:", filePath);

//                 // Transcribe the voice file using OpenAI Whisper
//                 const transcription = await transcribeVoiceMessage(filePath);
//                 if (!transcription) {
//                     console.error("❌ Failed to transcribe voice message. Transcription result is empty.");
//                     await sendToWhatsApp(from, "Sorry, I couldn't understand your voice message. Please try again.");
//                     return res.sendStatus(200);
//                 }

//                 console.log(`🔹 Transcribed voice message: ${transcription}`);
//                 const transcribedText = transcription; // Use the transcribed text as the message

//                 // Classify the transcribed text
//                 const classification = await isQuestionOrRequest(transcribedText);
//                 let aiResponse = ""; // Declare aiResponse here to avoid scope issues

//                 // Handle each classification
//                 if (classification === "question") {
//                     aiResponse = await getOpenAIResponse(transcribedText, systemMessage, session.language);

//                     // Send text response
//                     if (session.inRequest) {
//                         await sendToWhatsApp(from, `${aiResponse}\n\nPlease complete the request information.`);
//                     } else {
//                         const reply = `${aiResponse}\n\n${getContinueMessage(session.language)}`;
//                         await sendInteractiveButtons(from, reply, [
//                             { type: "reply", reply: { id: "contact_us", title: getButtonTitle("contact_us", session.language) } },
//                             { type: "reply", reply: { id: "new_request", title: getButtonTitle("new_request", session.language) } }
//                         ]);
//                     }
//                 } else if (classification === "request") {
//                     if (!session.data || !session.data.name) {  // Check if the user doesn't have any data
//                         // Start collecting information immediately if the user is new and doesn't have data
//                         session.inRequest = true;
//                         session.step = STATES.NAME;
//                         aiResponse = "Please provide your name."; // Set aiResponse for voice generation
//                         await sendToWhatsApp(from, aiResponse);
//                     } else {
//                         const extractedData = await extractInformationFromText(transcribedText, session.language);
//                         if (Object.keys(extractedData).length > 0) {
//                             session.step = STATES.CHANGE_INFOO;
//                             aiResponse = "Do you want to change your information?"; // Set aiResponse for voice generation
//                             await sendInteractiveButtons(from, aiResponse, [
//                                 { type: "reply", reply: { id: "yes_change", title: "Yes" } },
//                                 { type: "reply", reply: { id: "no_change", title: "No" } }
//                             ]);
//                             session.tempData = extractedData; // Store extracted data temporarily
//                         } else {
//                             aiResponse = "Do you want to change your information?"; // Set aiResponse for voice generation
//                             await sendToWhatsApp(from, `${aiResponse}\n\nPlease provide more details about your request.`);
//                             session.inRequest = true; // Set the session to indicate the user is in a request flow
//                         }
//                     }
//                 } else if (classification === "greeting") {
//                     // Generate a ChatGPT response for the greeting
//                     aiResponse = await getOpenAIResponse(transcribedText, systemMessage, session.language);
//                     await sendToWhatsApp(from, aiResponse);
//                 } else if (classification === "other") {
//                     // Generate a ChatGPT response for other cases
//                     aiResponse = await getOpenAIResponse(transcribedText, systemMessage, session.language);
//                     await sendToWhatsApp(from, aiResponse);
//                 }

//                 // Generate audio response using OpenAI TTS (for all cases except when returning early)
//                 if (aiResponse) {
//                     const audioFilePath = `./temp/${messageId}_response.mp3`;
//                     await generateAudio(aiResponse, audioFilePath);

//                     // Upload audio file to WhatsApp's servers
//                     const uploadedMediaId = await uploadMediaToWhatsApp(audioFilePath);

//                     // Send audio to user using the media ID
//                     await sendAudioUsingMediaId(from, uploadedMediaId);

//                     // Clean up temporary files
//                     fs.unlinkSync(audioFilePath);
//                     console.log("✅ Temporary audio file deleted:", audioFilePath);
//                 }

//                 return res.sendStatus(200);
//             } catch (error) {
//                 console.error("❌ Error downloading or transcribing voice message:", error);
//                 await sendToWhatsApp(from, "Sorry, I couldn't process your voice message. Please try again.");
//                 return res.sendStatus(200);
//             } finally {
//                 // Clean up the temporary file
//                 if (fs.existsSync(filePath)) {
//                     fs.unlinkSync(filePath);
//                     console.log("✅ Temporary file deleted:", filePath);
//                 }
//             }
//         }


// if (message.type === "interactive" && message.interactive?.type === "button_reply") {
//     const buttonId = message.interactive.button_reply.id;
//     if (buttonId === "new_request") {
//         if (!session.data || !session.data.name) {  // Check if the user doesn't have any data
//             // Start collecting information immediately if the user is new and doesn't have data
//             session.inRequest = true;
//             session.step = STATES.NAME;
//             await sendToWhatsApp(from, "Please provide your name.");
//         } else {
//             // Proceed to ask if the user wants to change information if they already have data
//             await sendInteractiveButtons(from, "Do you want to change your information?", [
//                 { type: "reply", reply: { id: "yes_change", title: "Yes" } },
//                 { type: "reply", reply: { id: "no_change", title: "No" } }
//             ]);
//             session.step = STATES.CHANGE_INFO;
//         }
//         return res.sendStatus(200);
//     }
// }

// if (session.lastTimestamp && Number(message.timestamp) < session.lastTimestamp) {
//     console.log(`Ignoring out-of-order message for user ${from}`);
//     return res.sendStatus(200);
// }
// session.lastTimestamp = Number(message.timestamp);

// const classification = await isQuestionOrRequest(textRaw);
// if (classification === "question") {
//     const aiResponse = await getOpenAIResponse(textRaw, systemMessage, session.language);
//     if (session.inRequest) {
//         await sendToWhatsApp(from, `${aiResponse}\n\nPlease complete the request information.`);
//     } else {
//         const reply = `${aiResponse}\n\n${getContinueMessage(session.language)}`;
//         await sendInteractiveButtons(from, reply, [
//             { type: "reply", reply: { id: "contact_us", title: getButtonTitle("contact_us", session.language) } },
//             { type: "reply", reply: { id: "new_request", title: getButtonTitle("new_request", session.language) } }
//         ]);
//     }
//     return res.sendStatus(200);
// }

// // Check if the user's message contains information
// if (session.step === STATES.WELCOME && message.type === "text") {
//     const extractedData = await extractInformationFromText(textRaw, session.language);
//     if (Object.keys(extractedData).length > 0) {
//         session.step = STATES.CHANGE_INFOO;
//         await sendInteractiveButtons(from, "Do you want to change your information?", [
//             { type: "reply", reply: { id: "yes_change", title: "Yes" } },
//             { type: "reply", reply: { id: "no_change", title: "No" } }
//         ]);
//         session.tempData = extractedData; // Store extracted data temporarily
//         return res.sendStatus(200);
//     }
// }

//         // Handle CHANGE_INFO state
//         if (session.step === STATES.CHANGE_INFOO) {
//             if (message.type === "interactive" && message.interactive?.type === "button_reply") {
//                 const buttonId = message.interactive.button_reply.id;
//                 if (buttonId === "yes_change") {
//                     // Update session data with extracted information
//                     session.data = { ...session.data, ...session.tempData };
//                     delete session.tempData; // Clear temporary data

//                     // Ensure the phone number is not overwritten if already present
//                     if (!session.data.phone) {
//                         session.data.phone = from; // Use the WhatsApp number as the default phone number
//                     }

//                     const missingFields = getMissingFields(session.data);
//                     if (missingFields.length > 0) {
//                         session.step = `ASK_${missingFields[0].toUpperCase()}`;
//                         await askForNextMissingField(session, from);
//                     } else {
//                         session.step = STATES.QUANTITY;
//                         await sendQuantitySelection(from, session.language);
//                     }
//                 } else if (buttonId === "no_change") {
//                     session.step = STATES.QUANTITY;
//                     await sendQuantitySelection(from, session.language);
//                 }
//             }
//             return res.sendStatus(200);
//         }

//         let latitude
//         let longitude
//         switch (session.step) {
//             case STATES.CHANGE_INFO:
//                 if (message.type === "interactive" && message.interactive?.type === "button_reply") {
//                     const buttonId = message.interactive.button_reply.id;
//                     if (buttonId === "yes_change") {
//                         session.step = STATES.NAME;
//                         await sendToWhatsApp(from, "Please provide your new name.");
//                     } else if (buttonId === "no_change") {
//                         session.step = STATES.QUANTITY;
//                         await sendQuantitySelection(from, session.language);
//                     }
//                 }
//                 break;
//             case STATES.WELCOME:
//                 if (message.type === "text") {
//                     const isRequestStart = await detectRequestStart(textRaw);
//                     if (isRequestStart) {
//                         session.inRequest = true;
//                         const extractedData = await extractInformationFromText(textRaw, session.language);
//                         // Initialize session data with extracted information
//                         session.data = {
//                             ...session.data, // Keep existing data including phone from WhatsApp
//                             ...extractedData,
//                             phone: extractedData.phone || session.data.phone // Only overwrite if new phone found
//                         };
//                         // Debugging: Log extracted data
//                         console.log("Extracted data:", extractedData);
//                         // Check for missing fields
//                         const missingFields = getMissingFields(session.data);
//                         if (missingFields.length === 0) {
//                             session.step = STATES.CONFIRMATION;
//                             await sendOrderSummary(from, session);
//                         } else {
//                             session.step = `ASK_${missingFields[0].toUpperCase()}`;
//                             await askForNextMissingField(session, from);
//                         }
//                     } else {
//                         const aiResponse = await getOpenAIResponse(textRaw, systemMessage, session.language);
//                         const reply = `${aiResponse}\n\n${getContinueMessage(session.language)}`;

//                         await sendInteractiveButtons(from, reply, [
//                             { type: "reply", reply: { id: "contact_us", title: getButtonTitle("contact_us", session.language) } },
//                             { type: "reply", reply: { id: "new_request", title: getButtonTitle("new_request", session.language) } }
//                         ]);
//                     }
//                 } else if (message.type === "interactive" && message.interactive?.type === "button_reply") {
//                     const buttonId = message.interactive.button_reply.id;

//                     if (buttonId === "contact_us") {
//                         await sendToWhatsApp(from, getContactMessage(session.language));
//                     } else if (buttonId === "new_request") {
//                         session.inRequest = true; // Set inRequest to true
//                         session.step = STATES.NAME;
//                         await sendToWhatsApp(from, getNameMessage(session.language));
//                     } else {
//                         await sendToWhatsApp(from, getInvalidOptionMessage(session.language));
//                     }
//                 }
//                 break;
//             case STATES.NAME:
//                 if (!textRaw) {
//                     await sendToWhatsApp(from, getNameMessage(session.language));
//                 } else {
//                     if (textRaw.trim().length > 0) {
//                         session.data.name = textRaw;
//                         session.step = STATES.EMAIL;
//                         await sendToWhatsApp(from, getEmailMessage(session.language));
//                     } else {
//                         const errorMsg = session.language === 'ar'
//                             ? "❌ يرجى تقديم اسم صحيح"
//                             : "❌ Please provide a valid full name";
//                         await sendToWhatsApp(from, errorMsg);
//                     }
//                 }
//                 break;
//             case STATES.PHONE_INPUT:
//                 if (!isValidPhone(textRaw)) {
//                     await sendToWhatsApp(from, getInvalidPhoneMessage(session.language));
//                     return res.sendStatus(200);
//                 }
//                 session.data.phone = formatPhoneNumber(textRaw);
//                 session.step = STATES.EMAIL;
//                 await sendToWhatsApp(from, getEmailMessage(session.language)); // Ask for email
//                 break;
//             case STATES.EMAIL:
//                 if (!isValidEmail(textRaw)) {
//                     await sendToWhatsApp(from, "❌ Please provide a valid email address (e.g., example@domain.com).");
//                     return res.sendStatus(200);
//                 }
//                 session.data.email = textRaw;
//                 session.step = STATES.LONGITUDE;
//                 await sendToWhatsApp(from, getLocationMessage(session.language)); // Ask for location
//                 break;
//                 case STATES.LONGITUDE:
//                     if (message.location) {
//                         const { latitude: lat, longitude: lng } = message.location; // Use different variable names
//                         latitude = lat;
//                         longitude = lng;

//                         // Validate UAE location
//                         const UAE_BOUNDS = { minLat: 22.5, maxLat: 26.5, minLng: 51.6, maxLng: 56.5 };
//                         if (
//                             latitude >= UAE_BOUNDS.minLat &&
//                             latitude <= UAE_BOUNDS.maxLat &&
//                             longitude >= UAE_BOUNDS.minLng &&
//                             longitude <= UAE_BOUNDS.maxLng
//                         ) {
//                             // Reverse Geocode to get address
//                             const address = await getAddressFromCoordinates(latitude, longitude);
//                             if (address) {
//                                 session.data.address = address; 
//                                 session.data.street = extractStreetName(address); // Store street name separately
//                             }


//                             session.data.latitude = latitude;
//                             session.data.longitude = longitude;
//                             session.data.address = address; // Auto-fill address
//                             session.step = STATES.CITY; // Proceed to city selection

//                             return await sendCitySelection(from, session.language); // ✅ Ask user to select city
//                         } else {
//                             await sendToWhatsApp(from, getInvalidUAERegionMessage(session.language));
//                         }
//                     } else {
//                         if (!session.locationPromptSent) {
//                             await sendInteractiveButtons(from, getLocationMessage(session.language), [
//                                 {
//                                     type: "location_request",
//                                     title: getButtonTitle("send_site", session.language) // "Send Location" button
//                                 }
//                             ]);
//                             session.locationPromptSent = true;
//                         }
//                     }
//                     break;


//                     case STATES.CITY:
//                         if (message.interactive && message.interactive.type === "list_reply") {
//                             const citySelection = message.interactive.list_reply.id; // Get selected city ID
//                             const cityMap = {
//                                 "abu_dhabi": { en: "Abu Dhabi", ar: "أبو ظبي" },
//                                 "dubai": { en: "Dubai", ar: "دبي" },
//                                 "sharjah": { en: "Sharjah", ar: "الشارقة" },
//                                 "ajman": { en: "Ajman", ar: "عجمان" },
//                                 "umm_al_quwain": { en: "Umm Al Quwain", ar: "أم القيوين" },
//                                 "ras_al_khaimah": { en: "Ras Al Khaimah", ar: "رأس الخيمة" },
//                                 "fujairah": { en: "Fujairah", ar: "الفجيرة" }
//                             };

//                             if (cityMap[citySelection]) {
//                                 const selectedCity = cityMap[citySelection][session.language] || cityMap[citySelection].en;

//                                 // Validate the city using the actual location if available
//                                 if (session.data.latitude && session.data.longitude) {
//                                     const validationResult = await validateCityAndLocation(session.data.latitude, session.data.longitude, selectedCity);
//                                     if (!validationResult.isValid) {
//                                         const errorMessage = session.language === 'ar'
//                                             ? `❌ يبدو أن موقعك يقع في *${validationResult.actualCity}*. يرجى اختيار *${validationResult.actualCity}* بدلاً من *${selectedCity}*.`
//                                             : `❌ It seems your location is in *${validationResult.actualCity}*. Please select *${validationResult.actualCity}* instead of *${selectedCity}*.`;

//                                         await sendToWhatsApp(from, errorMessage);
//                                         await sendCitySelection(from, session.language);
//                                         return res.sendStatus(200);
//                                     }
//                                 }

//                                 // Store the selected city
//                                 session.data.city = selectedCity;
//                                 session.step = STATES.STREET; 

//                                 const buildingPrompt = session.language === 'ar'
//                                     ? `✅ لقد اخترت *${session.data.city}*.\n\n🏢 يرجى تقديم اسم الشارع.`
//                                     : `✅ You selected *${session.data.city}*.\n\n🏢 Please provide the Street name.`;

//                                 await sendToWhatsApp(from, buildingPrompt);
//                             } else {
//                                 const invalidSelectionMessage = session.language === 'ar'
//                                     ? "❌ اختيار غير صالح. يرجى الاختيار من الخيارات المتاحة."
//                                     : "❌ Invalid selection. Please choose from the provided options.";

//                                 await sendToWhatsApp(from, invalidSelectionMessage);
//                                 await sendCitySelection(from, session.language);
//                             }
//                         }
//                         break;

//                         case STATES.STREET:
//                             session.data.street = textRaw;
//                             session.step = STATES.BUILDING_NAME;
//                             await sendToWhatsApp(from, getBuildingMessage(session.language)); // Ask for building name
//                             break;
//         case STATES.BUILDING_NAME:
//             if (!textRaw || textRaw.trim() === "") {
//                 await sendToWhatsApp(from, getBuildingMessage(session.language));
//                 return res.sendStatus(200);
//             }
//             session.data.building_name = textRaw;
//             session.step = STATES.FLAT_NO;
//             await sendToWhatsApp(from, getFlatMessage(session.language));
//             break;

//             case STATES.FLAT_NO:
//                 console.log("🔹 Entered FLAT_NO state for user:", from);
//                 console.log("🔹 Current session.data:", session.data);

//                 if (!session.data || typeof session.data !== "object") {
//                     console.error("❌ Error: session.data is corrupted. Reinitializing.");
//                     session.data = {};
//                 }

//                 if (!textRaw || textRaw.trim() === "") {
//                     console.log("🔹 No flat number provided. Asking for flat number.");
//                     await sendToWhatsApp(from, getFlatMessage(session.language));
//                     return res.sendStatus(200);
//                 }

//                 console.log("🔹 Flat number provided:", textRaw);
//                 session.data.flat_no = textRaw;
//                 console.log("🔹 Updated session.data:", session.data);

//                 session.step = STATES.QUANTITY;

//                 console.log("🔹 Sending interactive quantity selection...");
//                 return await sendQuantitySelection(from, session.language);

//                 case STATES.QUANTITY:
//                     console.log("🔹 Entered QUANTITY state for user:", from);
//                     console.log("🔹 textRaw:", textRaw);

//                     // ✅ Handle button selection (interactive message)
//                     if (message.interactive && message.interactive.type === "button_reply") {
//                         const selectedQuantity = message.interactive.button_reply.id;

//                         if (["10", "15", "20"].includes(selectedQuantity)) {
//                             console.log("🔹 User selected predefined quantity:", selectedQuantity);
//                             session.data.quantity = parseInt(selectedQuantity, 10);
//                         } else {
//                             console.log("🔹 Invalid button selection. Asking for valid quantity.");
//                             await sendQuantitySelection(from, session.language);
//                             return res.sendStatus(200);
//                         }
//                     }
//                     // ✅ Handle manual input
//                     else {
//                         if (!textRaw || textRaw.trim() === "") {
//                             console.log("🔹 No quantity provided. Asking for quantity.");
//                             await sendQuantitySelection(from, session.language);
//                             return res.sendStatus(200);
//                         }

//                         const quantity = parseInt(textRaw.trim(), 10);

//                         if (isNaN(quantity) || quantity < 10) {
//                             console.log("🔹 Invalid quantity or less than 10 provided. Asking for a valid quantity.");
//                             await sendToWhatsApp(from, getInvalidQuantityMessage(session.language));
//                             await sendQuantitySelection(from, session.language);
//                             return res.sendStatus(200);
//                         }

//                         console.log("🔹 Valid quantity provided:", quantity);
//                         session.data.quantity = quantity;
//                     }

//                     // ✅ Proceed to the next step
//                     const missingFields = getMissingFields(session.data);
//                     console.log("🔹 Missing fields after quantity:", missingFields);

//                     if (missingFields.length === 0) {
//                         session.step = STATES.CONFIRMATION;
//                         await sendOrderSummary(from, session);
//                     } else {
//                         session.step = `ASK_${missingFields[0].toUpperCase()}`;
//                         await askForNextMissingField(session, from);
//                     }
//                     break;




//             case "ASK_NAME":
//                 // If the user hasn't provided a name yet, ask for it
//                 if (!textRaw) {
//                     await sendToWhatsApp(from, "👤 Please provide your full name.");
//                     return res.sendStatus(200); // Exit and wait for the user's response
//                 }
//                 // If the name is provided, store it and proceed to the next step
//                 session.data.name = textRaw;
//                 // Check for other missing fields
//                 const missingFieldsName = getMissingFields(session.data);
//                 if (missingFieldsName.length === 0) {
//                     session.step = STATES.CONFIRMATION;
//                     await sendOrderSummary(from, session);
//                 } else {
//                     session.step = `ASK_${missingFieldsName[0].toUpperCase()}`;
//                     await askForNextMissingField(session, from);
//                 }
//                 break;
//             case "ASK_PHONE":
//                 // If the user hasn't provided a phone number yet, ask for it
//                 if (!textRaw) {
//                     await sendToWhatsApp(from, "📞 Please provide your phone number.");
//                     return res.sendStatus(200); // Exit and wait for the user's response
//                 }
//                 // Validate the phone number after the user provides it
//                 if (!isValidPhone(textRaw)) {
//                     await sendToWhatsApp(from, "❌ Invalid phone number, please enter a valid number.");
//                     return res.sendStatus(200); // Exit and wait for the user to correct their input
//                 }
//                 // If the phone number is valid, store it and proceed to the next step
//                 session.data.phone = formatPhoneNumber(textRaw);
//                 // Check for other missing fields
//                 const missingFieldsPhone = getMissingFields(session.data);
//                 if (missingFieldsPhone.length === 0) {
//                     session.step = STATES.CONFIRMATION;
//                     await sendOrderSummary(from, session);
//                 } else {
//                     session.step = `ASK_${missingFieldsPhone[0].toUpperCase()}`;
//                     await askForNextMissingField(session, from);
//                 }
//                 break;
//             case "ASK_EMAIL":
//                 // If the user hasn't provided an email yet, ask for it
//                 if (!textRaw) {
//                     await sendToWhatsApp(from, "✉️ Could you please share your email address? We'll use it for sending updates on your order.");
//                     return res.sendStatus(200); // Exit and wait for the user's response
//                 }
//                 // Validate the email after the user provides it
//                 if (!isValidEmail(textRaw)) {
//                     await sendToWhatsApp(from, "❌ Invalid email address, please enter a valid one (e.g., example@domain.com).");
//                     return res.sendStatus(200); // Exit and wait for the user to correct their input
//                 }
//                 // If the email is valid, store it and proceed to the next step
//                 session.data.email = textRaw;
//                 // Check for other missing fields
//                 const missingFieldsEmail = getMissingFields(session.data);
//                 if (missingFieldsEmail.length === 0) {
//                     session.step = STATES.CONFIRMATION;
//                     await sendOrderSummary(from, session);
//                 } else {
//                     session.step = `ASK_${missingFieldsEmail[0].toUpperCase()}`;
//                     await askForNextMissingField(session, from);
//                 }
//                 break;
//             case "ASK_LOCATION":
//                 // If the user hasn't shared their location yet, ask for it
//                 if (!message.location) {
//                     // Send a message with a button to share location
//                     await sendInteractiveButtons(from, getLocationMessage(session.language), [
//                         {
//                             type: "location_request",
//                             title: getButtonTitle("send_site", session.language) // "Send Location" button
//                         }
//                     ]);
//                     return res.sendStatus(200); // Exit and wait for the user's response
//                 }
//                 // If the location is shared, store it and proceed to the next step
//             const { latitude: lat2, longitude: lng2 } = message.location; // Use different variable names
//             latitude = lat2;
//             longitude = lng2;                // Validate UAE location
//                 const UAE_BOUNDS = { minLat: 22.5, maxLat: 26.5, minLng: 51.6, maxLng: 56.5 };
//                 if (
//                     latitude >= UAE_BOUNDS.minLat &&
//                     latitude <= UAE_BOUNDS.maxLat &&
//                     longitude >= UAE_BOUNDS.minLng &&
//                     longitude <= UAE_BOUNDS.maxLng
//                 ) {
//                     const address = await getAddressFromCoordinates(latitude, longitude);
//                     if (address) {
//                         session.data.address = address; 
//                         // session.data.street = extractStreetName(address); // Store street name separately
//                     }
//                     session.data.address = address; // Auto-fill address
//                     session.data.latitude = latitude;
//                     session.data.longitude = longitude;
//                     // Check for other missing fields
//                     const missingFields = getMissingFields(session.data);
//                     if (missingFields.length === 0) {
//                         session.step = STATES.CONFIRMATION;
//                         await sendOrderSummary(from, session);
//                     } else {
//                         console.log("hi"+session.data.latitude ,"hii"+ session.data.latitude)
//                         session.step = `ASK_${missingFields[0].toUpperCase()}`;
//                         await askForNextMissingField(session, from);
//                     }
//                 } else {
//                     await sendToWhatsApp(from, getInvalidUAERegionMessage(session.language));
//                 }
//                 break;
//             case "ASK_ADDRESS":
//                 // If the user hasn't provided an address yet, ask for it
//                 if (!textRaw) {
//                     await sendToWhatsApp(from, "🏠 Please provide your address.");
//                     return res.sendStatus(200); // Exit and wait for the user's response
//                 }
//                 // If the address is provided, store it and proceed to the next step
//                 session.data.address = textRaw;
//                 // Check for other missing fields
//                 const missingFieldsAddress = getMissingFields(session.data);
//                 if (missingFieldsAddress.length === 0) {
//                     session.step = STATES.CONFIRMATION;
//                     await sendOrderSummary(from, session);
//                 } else {
//                     session.step = `ASK_${missingFieldsAddress[0].toUpperCase()}`;
//                     await askForNextMissingField(session, from);
//                 }
//                 break;
//                 case "ASK_CITY":
//                     if (!session) {
//                         console.error("❌ Session is not defined.");
//                         await sendToWhatsApp(from, "❌ An error occurred. Please try again.");
//                         return res.sendStatus(200);
//                     }
//                     if (session.data.city) {
//                         moveToNextStep(session, from);
//                         return res.sendStatus(200);
//                     }

//                     // Handle interactive button replies
//                     if (message.type === "interactive" && message.interactive?.type === "list_reply") {
//                         const citySelection = message.interactive.list_reply.id;
//                         const cityMap = {
//                             "abu_dhabi": { en: "Abu Dhabi", ar: "أبو ظبي" },
//                             "dubai": { en: "Dubai", ar: "دبي" },
//                             "sharjah": { en: "Sharjah", ar: "الشارقة" },
//                             "ajman": { en: "Ajman", ar: "عجمان" },
//                             "umm_al_quwain": { en: "Umm Al Quwain", ar: "أم القيوين" },
//                             "ras_al_khaimah": { en: "Ras Al Khaimah", ar: "رأس الخيمة" },
//                             "fujairah": { en: "Fujairah", ar: "الفجيرة" }
//                         };
//                         console.log(" before City set to:", session.data.city);

//                         if (cityMap[citySelection]) {
//                             session.data.city = cityMap[citySelection][session.language] || cityMap[citySelection].en;
//                             console.log("City set to:", session.data.city);

//                             // Validate against detected location (if available)
//                             if (session.data.latitude && session.data.longitude) {
//                                 const validation = await validateCityAndLocation(
//                                     session.data.latitude,
//                                     session.data.longitude,
//                                     session.data.city
//                                 );
//                                 if (!validation.isValid) {
//                                     await sendToWhatsApp(
//                                         from,
//                                         `❌ Your selected city (${session.data.city}) does not match your detected location (${validation.actualCity}). Please select the correct city.`
//                                     );
//                                     return res.sendStatus(200);
//                                 }
//                             }

//                             moveToNextStep(session, from);
//                         } else {
//                             await sendToWhatsApp(from, "❌ Invalid city. Please select a valid city from the options.");
//                             await sendCitySelection(from, session.language);
//                         }
//                     }
//                     // Handle text input
//                     else if (message.type === "text") {
//                         console.log("Checking user response for city:", textRaw);
//                         const selectedCity = extractCity(textRaw, session.language);
//                         if (selectedCity) {
//                             session.data.city = selectedCity;
//                             console.log("City set to:", selectedCity);

//                             // Validate against detected location (if available)
//                             if (session.data.latitude && session.data.longitude) {
//                                 const validation = await validateCityAndLocation(
//                                     session.data.latitude,
//                                     session.data.longitude,
//                                     session.data.city
//                                 );
//                                 if (!validation.isValid) {
//                                     await sendToWhatsApp(
//                                         from,
//                                         `❌ Your selected city (${session.data.city}) does not match your detected location (${validation.actualCity}). Please select the correct city.`
//                                     );
//                                     return res.sendStatus(200);
//                                 }
//                             }

//                             moveToNextStep(session, from);
//                         } else {
//                             await sendToWhatsApp(from, "❌ Invalid city. Please select a valid city from the options.");
//                             await sendCitySelection(from, session.language);
//                         }
//                     }
//                     // Handle invalid input
//                     else {
//                         await sendToWhatsApp(from, "❌ Invalid input. Please select a city from the options.");
//                         await sendCitySelection(from, session.language);
//                     }
//                     break;
//             case "ASK_STREET":
//                 // If the user hasn't provided a street name yet, ask for it
//                 if (!textRaw) {
//                     await sendToWhatsApp(from, "🛣️ Please provide your street name.");
//                     return res.sendStatus(200); // Exit and wait for the user's response
//                 }
//                 // If the street name is provided, store it and proceed to the next step
//                 session.data.street = textRaw;
//                 // Check for other missing fields
//                 const missingFieldsStreet = getMissingFields(session.data);
//                 if (missingFieldsStreet.length === 0) {
//                     session.step = STATES.CONFIRMATION;
//                     await sendOrderSummary(from, session);
//                 } else {
//                     session.step = `ASK_${missingFieldsStreet[0].toUpperCase()}`;
//                     await askForNextMissingField(session, from);
//                 }
//                 break;
//             case "ASK_BUILDING_NAME":
//                 // If the user hasn't provided a building name yet, ask for it
//                 if (!textRaw) {
//                     await sendToWhatsApp(from, "🏢 Please provide your building name.");
//                     return res.sendStatus(200); // Exit and wait for the user's response
//                 }
//                 // If the building name is provided, store it and proceed to the next step
//                 session.data.building_name = textRaw;
//                 // Check for other missing fields
//                 const missingFieldsBuilding = getMissingFields(session.data);
//                 if (missingFieldsBuilding.length === 0) {
//                     session.step = STATES.CONFIRMATION;
//                     await sendOrderSummary(from, session);
//                 } else {
//                     session.step = `ASK_${missingFieldsBuilding[0].toUpperCase()}`;
//                     await askForNextMissingField(session, from);
//                 }
//                 break;
//             case "ASK_FLAT_NO":
//                 // If the user hasn't provided a flat number yet, ask for it
//                 if (!textRaw) {
//                     await sendToWhatsApp(from, "🏠 Please provide your flat number.");
//                     return res.sendStatus(200); // Exit and wait for the user's response
//                 }
//                 // If the flat number is provided, store it and proceed to the next step
//                 session.data.flat_no = textRaw;
//                 // Check for other missing fields
//                 const missingFieldsFlat = getMissingFields(session.data);
//                 if (missingFieldsFlat.length === 0) {
//                     session.step = STATES.CONFIRMATION;
//                     await sendOrderSummary(from, session);
//                 } else {
//                     session.step = `ASK_${missingFieldsFlat[0].toUpperCase()}`;
//                     await askForNextMissingField(session, from);
//                 }
//                 break;
//             case "ASK_QUANTITY":
//                 console.log("🔹 Entered QUANTITY state for user:", from);
//                 console.log("🔹 textRaw:", textRaw);

//                 // ✅ Handle button selection (interactive message)
//                 if (message.interactive && message.interactive.type === "button_reply") {
//                     const selectedQuantity = message.interactive.button_reply.id;

//                     if (["10", "15", "20"].includes(selectedQuantity)) {
//                         console.log("🔹 User selected predefined quantity:", selectedQuantity);
//                         session.data.quantity = parseInt(selectedQuantity, 10);
//                     } else {
//                         console.log("🔹 Invalid button selection. Asking for valid quantity.");
//                         await sendQuantitySelection(from, session.language);
//                         return res.sendStatus(200);
//                     }
//                 }
//                 // ✅ Handle manual input
//                 else {
//                     if (!textRaw || textRaw.trim() === "") {
//                         console.log("🔹 No quantity provided. Asking for quantity.");
//                         await sendQuantitySelection(from, session.language);
//                         return res.sendStatus(200);
//                     }

//                     const quantity = parseInt(textRaw.trim(), 10);

//                     if (isNaN(quantity) || quantity < 10) {
//                         console.log("🔹 Invalid quantity or less than 10 provided. Asking for a valid quantity.");
//                         await sendToWhatsApp(from, getInvalidQuantityMessage(session.language));
//                         await sendQuantitySelection(from, session.language);
//                         return res.sendStatus(200);
//                     }

//                     console.log("🔹 Valid quantity provided:", quantity);
//                     session.data.quantity = quantity;
//                 }

//                 // ✅ Proceed to the next step
//                 const missingFields2 = getMissingFields(session.data);
//                 console.log("🔹 Missing fields after quantity:", missingFields2);

//                 if (missingFields2.length === 0) {
//                     session.step = STATES.CONFIRMATION;
//                     await sendOrderSummary(from, session);
//                 } else {
//                     session.step = `ASK_${missingFields2[0].toUpperCase()}`;
//                     await askForNextMissingField(session, from);
//                 }
//                 break;
//             case STATES.CONFIRMATION:
//                 if (message.type === "interactive" && message.interactive.type === "button_reply") {
//                     const buttonId = message.interactive.button_reply.id; // Extract button ID
//                     if (buttonId === "yes_confirm") {
//                         const requestData = {
//                             user_name: session.data.name,
//                             email: session.data.email,
//                             phone_number: session.data.phone,
//                             city: session.data.city,
//                             address: session.data.address,
//                             street: session.data.street,
//                             building_name: session.data.building_name,
//                             flat_no: session.data.flat_no,
//                             latitude: session.data.latitude,
//                             longitude: session.data.longitude,
//                             quantity: session.data.quantity
//                         };
//                         console.log('Request Data:', requestData);
//                         try {
//                             const response = await axios.post('https://dev.lootahbiofuels.com/api/v1/whatsapp_request', requestData, {
//                                 headers: { 'Content-Type': 'application/json' },
//                                 timeout: 5000
//                             });

//                             if (response.status === 200) {
//                                 console.log('API Response:', response.data);
//                                 await sendToWhatsApp(from, "✅ Your request has been successfully submitted! We will contact you soon.");
//                             } else {
//                                 console.error(`❌ API returned unexpected status code: ${response.status}`);
//                                 await sendToWhatsApp(from, "❌ An error occurred. Please try again later.");
//                             }
//                         } catch (error) {
//                             if (error.response) {
//                                 console.error('API Error Response:', error.response.data);
//                                 console.error('API Status Code:', error.response.status);
//                                 // Explicitly check for status code 422
//                                 if (error.response.status === 422) {
//                                     await sendToWhatsApp(from, "❌ Your phone number must be Emirati to proceed with this request.");
//                                 } else {
//                                     await sendToWhatsApp(from, "❌ An error occurred while submitting your request. Please try again later.");
//                                 }
//                             } else {
//                                 console.error('Network or request error:', error.message);
//                                 await sendToWhatsApp(from, "❌ Unable to reach the server. Please check your internet connection and try again.");
//                             }
//                         }
//                         delete userSessions[from];

//                     } else if (buttonId === "no_correct") {
//                         session.step = STATES.MODIFY;
//                         await sendToWhatsApp(from, "Which information would you like to modify? Please reply with the corresponding number:\n\n1. Location\n2. Street\n3. Building Name\n4. Flat No\n5. Quantity");
//                     }
//                 }
//                 break;

//             case STATES.MODIFY:
//                 // Convert any Arabic digits in the text to English digits
//                 const normalizedText = convertArabicNumbers(text);
//                 const fieldToModify = parseInt(normalizedText);
//                 if (isNaN(fieldToModify) || fieldToModify < 1 || fieldToModify > 6) {
//                     await sendToWhatsApp(from, "❌ Invalid option. Please choose a number between 1 and 11.");
//                     return res.sendStatus(200);
//                 }

//                 const fieldMap = {
//                     1: "location",
//                     2: "street",
//                     3: "building_name",
//                     4: "flat_no",
//                     5: "quantity"
//                 };

//                 const selectedField = fieldMap[fieldToModify];

//                 if (selectedField === "location") {
//                     session.step = "MODIFY_LOCATION";
//                     await sendToWhatsApp(from, getLocationMessage(session.language));
//                 }
//                 // else if (selectedField === "city") {
//                 //     session.step = "MODIFY_CITY_SELECTION";
//                 //     return await sendCitySelection(from, session.language);
//                 // }
//                 else if (selectedField === "quantity") {
//                     session.step = "MODIFY_QUANTITY";
//                     await sendQuantitySelection(from, session.language);
//                 }
//                 else {
//                     session.modifyField = selectedField;
//                     session.step = `MODIFY_${selectedField.toUpperCase()}`;
//                     await sendToWhatsApp(from, `🔹 Please provide the new value for ${selectedField.replace(/_/g, " ")}.`);
//                 }
//                 break;
//             case "MODIFY_LOCATION":
//                 // If the user hasn't shared their location yet, ask for it
//                 if (!message.location) {
//                     // Send a message with a button to share location
//                     await sendInteractiveButtons(from, getLocationMessage(session.language), [
//                         {
//                             type: "location_request",
//                             title: getButtonTitle("send_site", session.language) // "Send Location" button
//                         }
//                     ]);
//                     return res.sendStatus(200); // Exit and wait for the user's response
//                 }
//                 // If the location is shared, store it and proceed to the next step
//                 const { latitude: lat3, longitude: lng3 } = message.location; // Use different variable names
//                 latitude = lat3;
//                 longitude = lng3;
//                 const UAE_BOUNDS2 = { minLat: 22.0, maxLat: 27.0, minLng: 51.0, maxLng: 57.0 };

//                 if (
//                     latitude >= UAE_BOUNDS2.minLat &&
//                     latitude <= UAE_BOUNDS2.maxLat &&
//                     longitude >= UAE_BOUNDS2.minLng &&
//                     longitude <= UAE_BOUNDS2.maxLng
//                 ) {
//                     const address = await getAddressFromCoordinates(latitude, longitude);
//                     if (address) {
//                         session.data.address = address; 
//                     }
//                     session.data.latitude = latitude;
//                     session.data.longitude = longitude;

//                     session.step = "MODIFY_CITY_SELECTION";
//                     return await sendCitySelection(from, session.language);

//                 } else {
//                     await sendToWhatsApp(from, getInvalidUAERegionMessage(session.language));
//                 }
//                 break;
//             case "MODIFY_CITY_SELECTION":
//                 if (!session) {
//                     console.error("❌ Session is not defined.");
//                     await sendToWhatsApp(from, "❌ An error occurred. Please try again.");
//                     return res.sendStatus(200);
//                 }

//                 // Handle interactive button replies
//                 if (message.type === "interactive" && message.interactive?.type === "list_reply") {
//                     const citySelection = message.interactive.list_reply.id;
//                     const cityMap = {
//                         "abu_dhabi": { en: "Abu Dhabi", ar: "أبو ظبي" },
//                         "dubai": { en: "Dubai", ar: "دبي" },
//                         "sharjah": { en: "Sharjah", ar: "الشارقة" },
//                         "ajman": { en: "Ajman", ar: "عجمان" },
//                         "umm_al_quwain": { en: "Umm Al Quwain", ar: "أم القيوين" },
//                         "ras_al_khaimah": { en: "Ras Al Khaimah", ar: "رأس الخيمة" },
//                         "fujairah": { en: "Fujairah", ar: "الفجيرة" }
//                     };
//                     console.log(" before City set to:", session.data.city);

//                     if (cityMap[citySelection]) {
//                         session.data.city = cityMap[citySelection][session.language] || cityMap[citySelection].en;
//                         console.log("City set to:", session.data.city);

//                         // Validate against detected location (if available)
//                         if (session.data.latitude && session.data.longitude) {
//                             const validation = await validateCityAndLocation(
//                                 session.data.latitude,
//                                 session.data.longitude,
//                                 session.data.city
//                             );
//                             if (!validation.isValid) {
//                                 await sendToWhatsApp(
//                                     from,
//                                     `❌ Your selected city (${session.data.city}) does not match your detected location (${validation.actualCity}). Please select the correct city.`
//                                 );
//                                 return res.sendStatus(200);
//                             }
//                         }

//                         moveToNextStep(session, from);
//                     } else {
//                         await sendToWhatsApp(from, "❌ Invalid city. Please select a valid city from the options.");
//                         await sendCitySelection(from, session.language);
//                     }
//                 }
//                 // Handle text input
//                 else if (message.type === "text") {
//                     console.log("Checking user response for city:", textRaw);
//                     const selectedCity = extractCity(textRaw, session.language);
//                     if (selectedCity) {
//                         session.data.city = selectedCity;
//                         console.log("City set to:", selectedCity);

//                         // Validate against detected location (if available)
//                         if (session.data.latitude && session.data.longitude) {
//                             const validation = await validateCityAndLocation(
//                                 session.data.latitude,
//                                 session.data.longitude,
//                                 session.data.city,
//                                 session.step = STATES.CONFIRMATION,
//                                 await sendUpdatedSummary(from, session)
//                             );
//                             if (!validation.isValid) {
//                                 await sendToWhatsApp(
//                                     from,
//                                     `❌ Your selected city (${session.data.city}) does not match your detected location (${validation.actualCity}). Please select the correct city.`
//                                 );
//                                 return res.sendStatus(200);
//                             }
//                         }

//                         moveToNextStep(session, from);
//                     } else {
//                         await sendToWhatsApp(from, "❌ Invalid city. Please select a valid city from the options.");
//                         await sendCitySelection(from, session.language);
//                     }
//                 }
//                 // Handle invalid input
//                 else {
//                     await sendToWhatsApp(from, "❌ Invalid input. Please select a city from the options.");
//                     await sendCitySelection(from, session.language);
//                 }
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

//                 case "MODIFY_QUANTITY":
//                     console.log("🔹 Entered MODIFY_QUANTITY state for user:", from);
//                     console.log("🔹 User input:", textRaw);

//                     if (message.interactive && message.interactive.type === "button_reply") {
//                         const selectedQuantity = message.interactive.button_reply.id;

//                         if (["10", "15", "20"].includes(selectedQuantity)) {
//                             console.log("✅ User selected predefined quantity:", selectedQuantity);
//                             session.data.quantity = parseInt(selectedQuantity, 10);
//                         } else {
//                             console.log("❌ Invalid quantity selection. Asking again.");
//                             await sendQuantitySelection(from, session.language);
//                             return res.sendStatus(200);
//                         }
//                     } else {
//                         if (!textRaw || textRaw.trim() === "") {
//                             console.log("❌ No quantity provided. Asking again.");
//                             await sendQuantitySelection(from, session.language);
//                             return res.sendStatus(200);
//                         }

//                         const quantity = parseInt(textRaw.trim(), 10);

//                         if (isNaN(quantity) || quantity < 10) {
//                             console.log("❌ Invalid quantity or less than 10 provided.");
//                             await sendToWhatsApp(from, getInvalidQuantityMessage(session.language));
//                             await sendQuantitySelection(from, session.language);
//                             return res.sendStatus(200);
//                         }

//                         console.log("✅ Valid quantity received:", quantity);
//                         session.data.quantity = quantity;
//                     }

//                     // Move to confirmation step and send summary
//                     session.step = STATES.CONFIRMATION;
//                     console.log("📦 Sending updated summary...");
//                     await sendUpdatedSummary(from, session);
//                     break;
//         }
//         res.sendStatus(200);

//     } catch (error) {
//         console.error('❌ Error:', error.response?.data || error.message || error);
//         res.sendStatus(500);
//     }
// })


// if (message.type === "audio" && message.audio) {
//     const mediaId = message.audio.id; // Get the media ID

//     // Fetch the media URL using the media ID
//     const audioUrl = await fetchMediaUrl(mediaId);
//     if (!audioUrl || !isValidUrl(audioUrl)) {
//         console.error("❌ Invalid or missing audio URL:", audioUrl);
//         await sendToWhatsApp(from, "Sorry, I couldn't process your voice message. Please try again.");
//         return res.sendStatus(200);
//     }

//     const filePath = `./temp/${messageId}.ogg`; // Unique temporary file path

//     try {
//         // Download the voice file
//         await downloadFile(audioUrl, filePath);
//         console.log("🔹 Voice file downloaded successfully:", filePath);

//         // Transcribe the voice file using OpenAI Whisper
//         const transcription = await transcribeVoiceMessage(filePath);
//         if (!transcription) {
//             console.error("❌ Failed to transcribe voice message. Transcription result is empty.");
//             await sendToWhatsApp(from, "Sorry, I couldn't understand your voice message. Please try again.");
//             return res.sendStatus(200);
//         }

//         console.log(`🔹 Transcribed voice message: ${transcription}`);
//         const transcribedText = transcription; // Use the transcribed text as the message

//         // Classify the transcribed text
//         const classification = await isQuestionOrRequest(transcribedText);
//         let aiResponse = ""; // Declare aiResponse here to avoid scope issues

//         // Handle each classification
//         if (classification === "question") {
//             aiResponse = await getOpenAIResponse(transcribedText, systemMessage, session.language);

//             // Send text response
//             if (session.inRequest) {
//                 await sendToWhatsApp(from, `${aiResponse}\n\nPlease complete the request information.`);
//             } else {
//                 const reply = `${aiResponse}\n\n${getContinueMessage(session.language)}`;
//                 await sendInteractiveButtons(from, reply, [
//                     { type: "reply", reply: { id: "contact_us", title: getButtonTitle("contact_us", session.language) } },
//                     { type: "reply", reply: { id: "new_request", title: getButtonTitle("new_request", session.language) } }
//                 ]);
//             }
//         } else if (classification === "request") {
//             if (!session.data || !session.data.name) {  // Check if the user doesn't have any data
//                 // Start collecting information immediately if the user is new and doesn't have data
//                 session.inRequest = true;
//                 session.step = STATES.NAME;
//                 aiResponse = "Please provide your name."; // Set aiResponse for voice generation
//                 await sendToWhatsApp(from, aiResponse);
//             } else {
//                 const extractedData = await extractInformationFromText(transcribedText, session.language);
//                 if (Object.keys(extractedData).length > 0) {
//                     session.step = STATES.CHANGE_INFOO;
//                     aiResponse = "Do you want to change your information?"; // Set aiResponse for voice generation
//                     await sendInteractiveButtons(from, aiResponse, [
//                         { type: "reply", reply: { id: "yes_change", title: "Yes" } },
//                         { type: "reply", reply: { id: "no_change", title: "No" } }
//                     ]);
//                     session.tempData = extractedData; // Store extracted data temporarily
//                 } else {
//                     aiResponse = "Do you want to change your information?"; // Set aiResponse for voice generation
//                     await sendToWhatsApp(from, `${aiResponse}\n\nPlease provide more details about your request.`);
//                     session.inRequest = true; // Set the session to indicate the user is in a request flow
//                 }
//             }
//         } else if (classification === "greeting") {
//             // Generate a ChatGPT response for the greeting
//             aiResponse = await getOpenAIResponse(transcribedText, systemMessage, session.language);
//             await sendToWhatsApp(from, aiResponse);
//         } else if (classification === "other") {
//             // Generate a ChatGPT response for other cases
//             aiResponse = await getOpenAIResponse(transcribedText, systemMessage, session.language);
//             await sendToWhatsApp(from, aiResponse);
//         }

//         // Generate audio response using OpenAI TTS (for all cases except when returning early)
//         if (aiResponse) {
//             const audioFilePath = `./temp/${messageId}_response.mp3`;
//             await generateAudio(aiResponse, audioFilePath);

//             // Upload audio file to WhatsApp's servers
//             const uploadedMediaId = await uploadMediaToWhatsApp(audioFilePath);

//             // Send audio to user using the media ID
//             await sendAudioUsingMediaId(from, uploadedMediaId);

//             // Clean up temporary files
//             fs.unlinkSync(audioFilePath);
//             console.log("✅ Temporary audio file deleted:", audioFilePath);
//         }

//         return res.sendStatus(200);
//     } catch (error) {
//         console.error("❌ Error downloading or transcribing voice message:", error);
//         await sendToWhatsApp(from, "Sorry, I couldn't process your voice message. Please try again.");
//         return res.sendStatus(200);
//     } finally {
//         // Clean up the temporary file
//         if (fs.existsSync(filePath)) {
//             fs.unlinkSync(filePath);
//             console.log("✅ Temporary file deleted:", filePath);
//         }
//     }
// }




        // if (message.type === "audio" && message.audio) {
        //     const mediaId = message.audio.id; // Get the media ID

        //     // Fetch the media URL using the media ID
        //     const audioUrl = await fetchMediaUrl(mediaId);
        //     if (!audioUrl || !isValidUrl(audioUrl)) {
        //         console.error("❌ Invalid or missing audio URL:", audioUrl);
        //         await sendToWhatsApp(from, "Sorry, I couldn't process your voice message. Please try again.");
        //         return res.sendStatus(200);
        //     }

        //     const filePath = `./temp/${messageId}.ogg`; // Unique temporary file path

        //     try {
        //         // Download the voice file
        //         await downloadFile(audioUrl, filePath);
        //         console.log("🔹 Voice file downloaded successfully:", filePath);

        //         // Transcribe the voice file using OpenAI Whisper
        //         const transcription = await transcribeVoiceMessage(filePath);
        //         if (!transcription) {
        //             console.error("❌ Failed to transcribe voice message. Transcription result is empty.");
        //             await sendToWhatsApp(from, "Sorry, I couldn't understand your voice message. Please try again.");
        //             return res.sendStatus(200);
        //         }

        //         console.log(`🔹 Transcribed voice message: ${transcription}`);
        //         const transcribedText = transcription; // Use the transcribed text as the message

        //         // Classify the transcribed text
        //         const classification = await isQuestionOrRequest(transcribedText);
        //         let aiResponse = ""; // Declare aiResponse here to avoid scope issues

        //         // Handle each classification
        //         if (classification === "question") {
        //             aiResponse = await getOpenAIResponse(transcribedText, systemMessage, session.language);

        //             // Send text response
        //             if (session.inRequest) {
        //                 await sendToWhatsApp(from, `${aiResponse}\n\nPlease complete the request information.`);
        //             } else {
        //                 const reply = `${aiResponse}\n\n${getContinueMessage(session.language)}`;
        //                 await sendInteractiveButtons(from, reply, [
        //                     { type: "reply", reply: { id: "contact_us", title: getButtonTitle("contact_us", session.language) } },
        //                     { type: "reply", reply: { id: "new_request", title: getButtonTitle("new_request", session.language) } }
        //                 ]);
        //             }
        //         } else if (classification === "request") {
        //             if (!session.data || !session.data.name) {  // Check if the user doesn't have any data
        //                 // Start collecting information immediately if the user is new and doesn't have data
        //                 session.inRequest = true;
        //                 session.step = STATES.NAME;
        //                 aiResponse = "Please provide your name."; // Set aiResponse for voice generation
        //                 await sendToWhatsApp(from, aiResponse);
        //             } else {
        //                 const extractedData = await extractInformationFromText(transcribedText, session.language);
        //                 if (Object.keys(extractedData).length > 0) {
        //                     session.step = STATES.CHANGE_INFOO;
        //                     aiResponse = "Do you want to change your information?"; // Set aiResponse for voice generation
        //                     await sendInteractiveButtons(from, aiResponse, [
        //                         { type: "reply", reply: { id: "yes_change", title: "Yes" } },
        //                         { type: "reply", reply: { id: "no_change", title: "No" } }
        //                     ]);
        //                     session.tempData = extractedData; // Store extracted data temporarily
        //                 } else {
        //                     aiResponse = "Do you want to change your information?"; // Set aiResponse for voice generation
        //                     await sendToWhatsApp(from, `${aiResponse}\n\nPlease provide more details about your request.`);
        //                     session.inRequest = true; // Set the session to indicate the user is in a request flow
        //                 }
        //             }
        //         } else if (classification === "greeting") {
        //             // Generate a ChatGPT response for the greeting
        //             aiResponse = await getOpenAIResponse(transcribedText, systemMessage, session.language);
        //             await sendToWhatsApp(from, aiResponse);
        //         } else if (classification === "other") {
        //             // Generate a ChatGPT response for other cases
        //             aiResponse = await getOpenAIResponse(transcribedText, systemMessage, session.language);
        //             await sendToWhatsApp(from, aiResponse);
        //         }

        //         // Generate audio response using OpenAI TTS (for all cases except when returning early)
        //         if (aiResponse) {
        //             const audioFilePath = `./temp/${messageId}_response.mp3`;
        //             await generateAudio(aiResponse, audioFilePath);

        //             // Upload audio file to WhatsApp's servers
        //             const uploadedMediaId = await uploadMediaToWhatsApp(audioFilePath);

        //             // Send audio to user using the media ID
        //             await sendAudioUsingMediaId(from, uploadedMediaId);

        //             // Clean up temporary files
        //             fs.unlinkSync(audioFilePath);
        //             console.log("✅ Temporary audio file deleted:", audioFilePath);
        //         }

        //         return res.sendStatus(200);
        //     } catch (error) {
        //         console.error("❌ Error downloading or transcribing voice message:", error);
        //         await sendToWhatsApp(from, "Sorry, I couldn't process your voice message. Please try again.");
        //         return res.sendStatus(200);
        //     } finally {
        //         // Clean up the temporary file
        //         if (fs.existsSync(filePath)) {
        //             fs.unlinkSync(filePath);
        //             console.log("✅ Temporary file deleted:", filePath);
        //         }
        //     }
        // }


app.listen(PORT, () => console.log(`🚀 Server running on http://localhost:${PORT}`));













// import dotenv from 'dotenv';
// import express from 'express';
// import axios from 'axios';
// import bodyParser from 'body-parser';
// import cors from 'cors';
// import langdetect from 'langdetect';
// import fs from 'fs';
// import { OpenAI } from 'openai';
// import mime from 'mime-types';
// import path from 'path';
// import FormData from 'form-data';





// dotenv.config();

// if (!process.env.OPENAI_API_KEY || !process.env.WHATSAPP_API_URL || !process.env.WHATSAPP_ACCESS_TOKEN) {
//     console.error('❌ Missing required environment variables');
//     process.exit(1);
// }
// // Initialize OpenAI client
// const openai = new OpenAI({
//     apiKey: process.env.OPENAI_API_KEY,
// });
// if (!fs.existsSync('./temp')) {
//     fs.mkdirSync('./temp');
//     console.log("✅ Created ./temp directory.");
// } else {
//     console.log("✅ ./temp directory already exists.");
// }

// const app = express();
// const PORT = process.env.PORT || 5000;
// const VERIFY_TOKEN = "Mohammad";

// app.use(cors());
// app.use(bodyParser.json());

// // Webhook verification
// app.get("/webhook", (req, res) => {
//     if (req.query["hub.mode"] === "subscribe" && req.query["hub.verify_token"] === VERIFY_TOKEN) {
//         res.status(200).send(req.query["hub.challenge"]);
//     } else {
//         res.sendStatus(403);
//     }
// });

// // Default route
// app.get('/', (req, res) => {
//     res.send('Backend is running');
// });

// // Admin login endpoint
// app.post('/admin/login', (req, res) => {
//     const { username, password } = req.body;

//     // Check credentials
//     if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
//         // Generate JWT token
//         const token = jwt.sign({ username }, SECRET_KEY, { expiresIn: '1h' });
//         return res.json({ token });
//     }
//     return res.status(401).json({ error: 'Invalid username or password' });
// });

// // Middleware to authenticate token
// const authenticateToken = (req, res, next) => {
//     const authHeader = req.headers['authorization'];
//     const token = authHeader && authHeader.split(' ')[1];

//     if (!token) return res.status(401).json({ error: 'Access denied. No token provided.' });

//     jwt.verify(token, SECRET_KEY, (err, user) => {
//         if (err) return res.status(403).json({ error: 'Invalid or expired token.' });
//         req.user = user;
//         next();
//     });
// };

// app.get('/admin/messages', authenticateToken, (req, res) => {
//     res.json({ systemMessage, guidanceMessage, defaultWelcomeMessage });
// });

// // Protected route: Update system and guidance messages  
// app.post('/admin/update-messages', authenticateToken, (req, res) => {
//     const { newSystemMessage, newGuidance } = req.body;

//     if (newSystemMessage) {
//         if (typeof newSystemMessage !== 'string') {
//             return res.status(400).json({ error: 'Invalid system message provided.' });
//         }
//         systemMessage = newSystemMessage;
//         console.log('✅ System message updated:', systemMessage);
//     }

//     if (newGuidance) {
//         if (typeof newGuidance !== 'string') {
//             return res.status(400).json({ error: 'Invalid guidance message provided.' });
//         }
//         guidanceMessage = newGuidance;
//         console.log('✅ Guidance message updated:', guidanceMessage);
//     }

//     res.json({ message: 'Messages updated successfully.' });
// });

// // Protected route: Update welcome message  
// app.post('/admin/update-welcome-message', authenticateToken, (req, res) => {
//     const { newWelcomeMessage } = req.body;

//     if (newWelcomeMessage && typeof newWelcomeMessage === 'string') {
//         defaultWelcomeMessage = newWelcomeMessage;
//         console.log('✅ Welcome message updated:', defaultWelcomeMessage);
//         res.json({ message: 'Welcome message updated successfully.' });
//     } else {
//         res.status(400).json({ error: 'Invalid welcome message provided.' });
//     }
// });

// // Guidance message (initially empty, can be updated by the admin)  
// let guidanceMessage = "";

// const defaultWelcomeMessage = `\ud83c\udf1f Welcome to *Lootah Biofuels Refining Company* \ud83c\udf1f\n\nYou can ask any question directly, and I will assist you. If you need further help, choose from the options below.`;

// // // System message for the virtual assistant  
// let systemMessage = `
// "**Guidance Letter for OpenAI**  

// **Company Name:** Lootah Biofuels  

// **About Lootah Biofuels:**  
// Lootah Biofuels was founded in 2010 in Dubai to address the growing demand for alternative fuels in the region. In alignment with the UAE’s vision for sustainable development, Lootah Biofuels aims to introduce and innovate sustainable solutions for the long-term energy requirements. By rapidly increasing production capacity, strengthening distribution channels, and redefining biodiesel quality, Lootah Biofuels continues to expand the reach of sustainable and environmentally friendly biofuels.  

// **Our Mission:**  
// Our mission is to deliver economic, operational, and environmental benefits for long-term customer satisfaction and sustainable growth.  

// **Our Aim:**  
// We aim to research, develop, and produce sustainable biofuels—clean, reliable alternatives to fossil fuels for transport that deliver real reductions in greenhouse gas emissions and help improve energy security.  

// **Our Founder:**  
// The CEO of Lootah Biofuels is Yousif Bin Saeed Al Lootah. A young and enthusiastic leader, Mr. Yousif Lootah oversees the daily operations of Lootah Biofuels in the UAE and globally, as well as the company’s strategic direction, growth, and expansion. With a vision for innovating sustainable solutions for long-term energy needs, Mr. Yousif Lootah launched Lootah Biofuels.  

// Prior to founding Lootah Biofuels, Mr. Yousif was actively involved in sustainability initiatives such as the Green Car Program, which has significantly progressed since its inception. The initiative started with converting part of the company fleet to Compressed Natural Gas (CNG) and expanded to include hybrid, electric, biodiesel, and solar vehicles.

// Mr. Yousif Lootah aims for 70% of transportation in the GCC market to come from renewable and sustainable sources by 2025. He envisions the UAE becoming the first nation in the region to mandate biofuel blends at all public stations. Many of the company’s ecological initiatives were his brainchild. Following the success of biofuel creation from waste management, Mr. Lootah recently signed agreements with educational institutions to raise awareness and provide training to the region’s youth, encouraging impactful sustainable practices.  

// **Services:**  
// - Biodiesel Production Plant  
// - Containerized Fuel Storage Tanks  
// - Biodiesel Production Plant Containerized  
// - Fuel Delivery Tanks  

// **UCO Division:**  
// **Used Cooking Oil (UCO):**  
// Lootah Biofuels has successfully developed a practical and viable solution to produce biofuel from Used Cooking Oil (UCO), resulting in a less expensive, renewable, and clean fuel. We are one of the largest UCO collectors authorized by Dubai Municipality and the only one with our own fuel outlets across Dubai.  

// Key Highlights:  
// - We provide financial incentives to UCO providers.  
// - Our main UCO sources include restaurants, bakeries, and food chains.  
// - By efficiently converting UCO waste into biofuel, we support the Municipality in preventing environmental hazards such as sewage problems.  
// - As part of our Corporate Social Responsibility, we prevent UCO from re-entering the food chain by converting it into fuel.  
// - UCO has the highest carbon-saving ratio among all available biodiesel feedstocks.  

// **Products:**  
// 1. **Glycerine:**  
//    Lootah Biofuels also produces glycerine, a by-product of the biodiesel production process. Glycerine is a versatile product used in various industries, including:  
//    - Confectioneries  
//    - Cosmetics  
//    - Pharmaceuticals  
//    - Tobacco  
//    - Polyurethanes  
//    - Alkyd resins  
//    - Skincare applications (moisturizing and cleansing properties)  

// 2. **Biodiesel B5:**  
//    Lootah Biofuels offers the UAE market an environmentally superior and performance-enhancing diesel blending agent at a competitive price. We produce Biodiesel B5, an ultra-low-sulfur diesel fuel blended with 5% biodiesel. This blend:  
//    - Acts as a lubricant to reduce carbon footprint and greenhouse gas emissions.  
//    - Is derived from converting used cooking oil to Biodiesel (B100) and blending it with high-quality ultra-low-sulfur petro-diesel in a 5:95 ratio.  
//    - Provides an eco-friendly alternative to conventional diesel.  

// For more details, visit: [Lootah Biofuels Website](https://www.lootahbiofuels.com/)  

// **End of Guidance Letter**

// `;

// // Truncate text function (kept separate)
// const truncateTextForAudio = (text, maxWords = 75) => {
//     const words = text.split(" ");
//     if (words.length > maxWords) {
//         return words.slice(0, maxWords).join(" ") + "...";
//     }
//     return text;
// };

// // OpenAI response function
// const getOpenAIResponse = async (userMessage, context = "", language = "en") => {
//     try {
//         const systemMessage = `
//             You are a friendly and intelligent WhatsApp assistant for Lootah Biofuels. 
//             Your goal is to assist users in completing their orders and answering their questions.
//             Always respond concisely, use emojis sparingly, and maintain a helpful attitude.
//             Generate the response in the user's language: ${language}.
//             Keep your responses very short and to the point. Each response should be no longer than 30 seconds when spoken.
//             For Arabic responses, ensure the answer is complete and concise, fitting within 100 tokens.
//         `;

//         const messages = [
//             { role: "system", content: systemMessage },
//             { role: "user", content: userMessage },
//         ];

//         if (context && context.trim() !== "") {
//             messages.push({ role: "system", content: context });
//         }

//         const response = await axios.post('https://api.openai.com/v1/chat/completions', {
//             model: "gpt-4",
//             messages,
//             max_tokens: 100, // Limit the response to 100 tokens
//             temperature: 0.7
//         }, {
//             headers: {
//                 'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
//                 'Content-Type': 'application/json'
//             }
//         });

//         // Truncate the OpenAI response using the truncateTextForAudio function
//         const responseText = response.data.choices[0].message.content.trim();
//         return truncateTextForAudio(responseText, 75); // Truncate to 75 words
//     } catch (error) {
//         console.error('❌ Error with OpenAI:', error.response?.data || error.message);
//         return "❌ Oops! Something went wrong. Please try again later.";
//     }
// };


// const userSessions = {};
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

// const isValidEmail = (email) => {
//     const regex = /^\S+@\S+\.\S+$/;
//     return regex.test(email);
// };

// const isValidPhone = (phone) => {
//     const regex = /^\+971(5\d{1}\s?\d{3}\s?\d{3}|\s?4\d{2}\s?\d{4})$/;
//     return regex.test(phone);
// };


// async function sendOrderSummary(to, session) {
//     try {
//         // Ensure session exists
//         if (!session) {
//             console.error("❌ Error: session is undefined.");
//             await sendToWhatsApp(to, "⚠️ Session error. Please restart the process.");
//             return;
//         }

//         // Ensure session.data is an object, reinitialize if necessary
//         if (!session.data || typeof session.data !== "object") {
//             console.error("❌ Error: session.data is corrupted. Reinitializing.");
//             session.data = {}; // Reset to an empty object
//         }

//         // Ensure language exists, default to English if undefined
//         const language = session.language || 'en';

//         const orderSummary = language === 'ar'
//             ? `📝 *ملخص الطلب*\n
// الاسم: ${session.data.name || 'غير متوفر'}
// الهاتف: ${session.data.phone || 'غير متوفر'} 
// البريد الإلكتروني: ${session.data.email || 'غير متوفر'}
// المدينة: ${session.data.city || 'غير متوفر'}
// العنوان: ${session.data.address || 'غير متوفر'}
// الشارع: ${session.data.street || 'غير متوفر'}
// اسم المبنى: ${session.data.building_name || 'غير متوفر'}
// رقم الشقة: ${session.data.flat_no || 'غير متوفر'}
// الكمية: ${session.data.quantity || 'غير متوفر'} لتر`
//             : `📝 *Order Summary*\n
// Name: ${session.data.name || 'Not provided'}
// Phone: ${session.data.phone || 'Not provided'}
// Email: ${session.data.email || 'Not provided'}
// City: ${session.data.city || 'Not provided'}
// Address: ${session.data.address || 'Not provided'}
// Street: ${session.data.street || 'Not provided'}
// Building: ${session.data.building_name || 'Not provided'}
// Flat: ${session.data.flat_no || 'Not provided'}
// Quantity: ${session.data.quantity || 'Not provided'} liters`;

//         const confirmationButtons = [
//             {
//                 type: "reply",
//                 reply: {
//                     id: "yes_confirm",
//                     title: language === 'ar' ? "تأكيد ✅" : "Confirm ✅"
//                 }
//             },
//             {
//                 type: "reply",
//                 reply: {
//                     id: "no_correct",
//                     title: language === 'ar' ? "تعديل ❌" : "Modify ❌"
//                 }
//             }
//         ];

//         console.log("📦 Sending order summary:", orderSummary);
//         await sendInteractiveButtons(to, orderSummary, confirmationButtons);

//     } catch (error) {
//         console.error("❌ Error sending order summary:", error);
//         await sendToWhatsApp(to, "❌ An error occurred while generating your order summary.");
//     }
// }
// const sendUpdatedSummary = async (to, session) => {
//     try {
//         // Ensure session exists
//         if (!session) {
//             console.error("❌ Error: session is undefined.");
//             await sendToWhatsApp(to, "⚠️ Session error. Please restart the process.");
//             return;
//         }

//         // Ensure session.data is an object, reinitialize if necessary
//         if (!session.data || typeof session.data !== "object") {
//             console.error("❌ Error: session.data is corrupted. Reinitializing.");
//             session.data = {}; // Reset to an empty object
//         }

//         // Ensure language exists, default to English if undefined
//         const language = session.language || 'en';

//         const orderSummary = language === 'ar'
//             ? `📝 * ملخص الطلب بعد التعديل*\n
// الاسم: ${session.data.name || 'غير متوفر'}
// الهاتف: ${session.data.phone || 'غير متوفر'} 
// البريد الإلكتروني: ${session.data.email || 'غير متوفر'}
// المدينة: ${session.data.city || 'غير متوفر'}
// العنوان: ${session.data.address || 'غير متوفر'}
// الشارع: ${session.data.street || 'غير متوفر'}
// اسم المبنى: ${session.data.building_name || 'غير متوفر'}
// رقم الشقة: ${session.data.flat_no || 'غير متوفر'}
// الكمية: ${session.data.quantity || 'غير متوفر'} لتر`
//             : `📝 *Summary of the Order after modification*\n
// Name: ${session.data.name || 'Not provided'}
// Phone: ${session.data.phone || 'Not provided'}
// Email: ${session.data.email || 'Not provided'}
// City: ${session.data.city || 'Not provided'}
// Address: ${session.data.address || 'Not provided'}
// Street: ${session.data.street || 'Not provided'}
// Building: ${session.data.building_name || 'Not provided'}
// Flat: ${session.data.flat_no || 'Not provided'}
// Quantity: ${session.data.quantity || 'Not provided'} liters`;

//         const confirmationButtons = [
//             {
//                 type: "reply",
//                 reply: {
//                     id: "yes_confirm",
//                     title: language === 'ar' ? "تأكيد ✅" : "Confirm ✅"
//                 }
//             },
//             {
//                 type: "reply",
//                 reply: {
//                     id: "no_correct",
//                     title: language === 'ar' ? "تعديل ❌" : "Modify ❌"
//                 }
//             }
//         ];

//         console.log("📦 Sending order summary:", orderSummary);
//         await sendInteractiveButtons(to, orderSummary, confirmationButtons);

//     } catch (error) {
//         console.error("❌ Error sending order summary:", error);
//         await sendToWhatsApp(to, "❌ An error occurred while generating your order summary.");
//     }
// };



// let dataStore = [];  // Array to temporarily store data

// function formatPhoneNumber(phoneNumber) {
//     // إزالة أي مسافات أو رموز غير ضرورية
//     let cleanedNumber = phoneNumber.replace(/\D/g, "");

//     // التأكد من أن الرقم يبدأ بـ "+"
//     if (!cleanedNumber.startsWith("+")) {
//         cleanedNumber = `+${cleanedNumber}`;
//     }
//     // إضافة مسافة بعد رمز الدولة (أول 3 أو 4 أرقام)
//     const match = cleanedNumber.match(/^\+(\d{1,4})(\d+)$/);
//     if (match) {
//         return `+${match[1]} ${match[2]}`; // إضافة المسافة بعد كود الدولة
//     }
//     return cleanedNumber; // إرجاع الرقم إذا لم ينطبق النمط
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
//     MODIFY: "modify",  // New state for modification,
//     CHANGE_INFO: "CHANGE_INFO",
//     CHANGE_INFOO: "CHANGE_INFOO"
// };

// // Helper function to validate text length
// const validateTextLength = (text) => {
//     if (!text || typeof text !== "string" || text.trim().length === 0) {
//         return false; // Text is empty or not a string
//     }
//     if (text.length > 1024) {
//         return false; // Text exceeds the maximum length
//     }
//     return true;
// };

// // Helper function to truncate text if it exceeds the maximum length
// const truncateText = (text, maxLength = 1024) => {
//     return text.length > maxLength ? text.slice(0, maxLength) : text;
// };

// const sendInteractiveButtons = async (to, message, buttons) => {
//     // Validate the message text length
//     if (!validateTextLength(message)) {
//         console.error("❌ Invalid message text length. Message must be between 1 and 1024 characters.");
//         await sendToWhatsApp(to, "Sorry, there was an issue processing your request. Please try again.");
//         return;
//     }

//     // Truncate the message if it exceeds 1024 characters
//     const truncatedMessage = truncateText(message, 1024);

//     try {
//         // Construct the payload
//         const payload = {
//             messaging_product: "whatsapp",
//             recipient_type: "individual",
//             to: to,
//             type: "interactive",
//             interactive: {
//                 type: "button",
//                 body: { text: truncatedMessage }, // Use truncated message
//                 action: {
//                     buttons: buttons.map(button => {
//                         if (button.type === "location_request") {
//                             return {
//                                 type: "location_request",
//                                 title: button.title || "📍 Send Location"
//                             };
//                         } else {
//                             return {
//                                 type: "reply",
//                                 reply: {
//                                     id: button.reply.id,
//                                     title: button.reply.title
//                                 }
//                             };
//                         }
//                     })
//                 }
//             }
//         };

//         console.log("✅ Sending Interactive Buttons Payload:", JSON.stringify(payload, null, 2));

//         // Send the payload to the WhatsApp API
//         const response = await axios.post(process.env.WHATSAPP_API_URL, payload, {
//             headers: {
//                 "Authorization": `Bearer ${process.env.WHATSAPP_ACCESS_TOKEN}`,
//                 "Content-Type": "application/json"
//             }
//         });

//         console.log("✅ Interactive Buttons Response:", response.data);
//     } catch (error) {
//         console.error("❌ Failed to send interactive buttons:", error.response?.data || error.message);

//         // Send a fallback message to the user if the request fails
//         await sendToWhatsApp(to, "Sorry, there was an issue processing your request. Please try again.");
//     }
// };



// const sendInteractiveButtons2 = async (to, message, buttons) => {
//     // Validate the message text length
//     if (!validateTextLength(message)) {
//         console.error("❌ Invalid message text length. Message must be between 1 and 1024 characters.");
//         await sendToWhatsApp(to, "Sorry, there was an issue processing your request. Please try again.");
//         return;
//     }

//     // Truncate the message if it exceeds 1024 characters
//     const truncatedMessage = truncateText(message, 1024);

//     try {
//         // Construct the payload
//         const payload = {
//             messaging_product: "whatsapp",
//             recipient_type: "individual",
//             to: to,
//             type: "interactive",
//             interactive: {
//                 type: "button",
//                 body: { text: truncatedMessage }, // Use truncated message
//                 action: {
//                     buttons: buttons.map(button => ({
//                         type: "reply",
//                         reply: {
//                             id: button.id,
//                             title: button.title
//                         }
//                     }))
//                 }
//             }
//         };

//         console.log("✅ Sending Interactive Buttons Payload:", JSON.stringify(payload, null, 2));

//         // Send the payload to the WhatsApp API
//         const response = await axios.post(process.env.WHATSAPP_API_URL, payload, {
//             headers: {
//                 "Authorization": `Bearer ${process.env.WHATSAPP_ACCESS_TOKEN}`,
//                 "Content-Type": "application/json"
//             }
//         });

//         console.log("✅ Interactive Buttons Response:", response.data);
//     } catch (error) {
//         console.error("❌ Failed to send interactive buttons:", error.response?.data || error.message);

//         // Send a fallback message to the user if the request fails
//         await sendToWhatsApp(to, "Sorry, there was an issue processing your request. Please try again.");
//     }
// };


// function extractQuantity(text) {
//     // Match both Western Arabic (0-9) and Eastern Arabic (٠-٩) numerals
//     const match = text.match(/[\d\u0660-\u0669]+/);
//     if (match) {
//         // Convert Eastern Arabic numerals to Western Arabic numerals
//         return convertArabicNumbers(match[0]);
//     }
//     return null;
// }

// function convertArabicNumbers(arabicNumber) {
//     const arabicToWestern = {
//         "٠": "0", "١": "1", "٢": "2", "٣": "3", "٤": "4",
//         "٥": "5", "٦": "6", "٧": "7", "٨": "8", "٩": "9"
//     };
//     return arabicNumber.replace(/[\u0660-\u0669]/g, d => arabicToWestern[d] || d);
// }
// const sendCitySelection = async (to, language) => {
//     try {
//         const cityPrompt = language === 'ar'
//             ? 'يرجى اختيار المدينة من القائمة:'
//             : 'Please select your city from the list:';

//         const cityOptions = [
//             { id: "abu_dhabi", title: language === 'ar' ? 'أبو ظبي' : 'Abu Dhabi' },
//             { id: "dubai", title: language === 'ar' ? 'دبي' : 'Dubai' },
//             { id: "sharjah", title: language === 'ar' ? 'الشارقة' : 'Sharjah' },
//             { id: "ajman", title: language === 'ar' ? 'عجمان' : 'Ajman' },
//             { id: "umm_al_quwain", title: language === 'ar' ? 'أم القيوين' : 'Umm Al Quwain' },
//             { id: "ras_al_khaimah", title: language === 'ar' ? 'رأس الخيمة' : 'Ras Al Khaimah' },
//             { id: "fujairah", title: language === 'ar' ? 'الفجيرة' : 'Fujairah' }
//         ];

//         const payload = {
//             messaging_product: "whatsapp",
//             recipient_type: "individual",
//             to: to,
//             type: "interactive",
//             interactive: {
//                 type: "list",
//                 body: {
//                     text: cityPrompt
//                 },
//                 action: {
//                     button: language === 'ar' ? 'اختر المدينة' : 'Select City',
//                     sections: [
//                         {
//                             title: language === 'ar' ? 'المدن' : 'Cities',
//                             rows: cityOptions.map(city => ({
//                                 id: city.id,
//                                 title: city.title
//                             }))
//                         }
//                     ]
//                 }
//             }
//         };
//         //
//         console.log("Sending City Selection Payload:", JSON.stringify(payload, null, 2));

//         const response = await axios.post(process.env.WHATSAPP_API_URL, payload, {
//             headers: {
//                 Authorization: `Bearer ${process.env.WHATSAPP_ACCESS_TOKEN}`,
//                 "Content-Type": "application/json"
//             }
//         });

//         console.log("City Selection Response:", response.data);
//     } catch (error) {
//         console.error("Error sending city selection:", error.response?.data || error.message);
//     }
// };


// function extractCity(text, language = "en") {
//     const cities = {
//         en: ["Dubai", "Abu Dhabi", "Sharjah", "Ajman", "Ras Al Khaimah", "Fujairah", "Umm Al Quwain"],
//         ar: ["دبي", "أبو ظبي", "الشارقة", "عجمان", "رأس الخيمة", "الفجيرة", "أم القيوين"]
//     };

//     const normalizedText = text.normalize("NFKC").toLowerCase().trim();
//     console.log("Normalized user text:", normalizedText);

//     for (const city of cities[language]) {
//         const normalizedCity = city.normalize("NFKC").toLowerCase();
//         console.log("Checking city:", normalizedCity);
//         if (normalizedText.includes(normalizedCity) || normalizedText.includes(normalizedCity.replace(/\s/g, ""))) {
//             console.log("Matched city:", city);
//             return city;
//         }
//     }
//     console.log("No city matched.");
//     return null;
// }
// async function extractInformationFromText(text, language = "en") {
//     const extractedData = {
//         quantity: extractQuantity(text), // Extract quantity
//         city: extractCity(text, language) // Extract city
//     };

//     // Extract name using regex or simple logic
//     const nameMatch = text.match(/(?:انا|اسمي|my name is|name is)\s+([\u0600-\u06FF\s]+|[a-zA-Z\s]+)/i);
//     if (nameMatch && nameMatch[1]) {
//         extractedData.name = nameMatch[1].trim();
//     }

//     // Extract phone number using regex
//     const phoneRegex = /(?:\+971|0)?(?:5\d|4\d)\s?\d{3}\s?\d{3}/; // Matches UAE phone numbers
//     const phoneMatch = text.match(phoneRegex);
//     if (phoneMatch) {
//         extractedData.phone = formatPhoneNumber(phoneMatch[0]); // Format the phone number
//     }

//     // Use OpenAI for additional extraction
//     const prompt = `
//     Extract the following information from the text and return a valid JSON object:
//     {
//       "name": "The user's full name or null",
//       "phone": "The user's phone number or null",
//       "email": "The user's email address or null",
//       "address": "The user's full address or null",
//       "city": "The user's city (e.g., Dubai, Sharjah, Abu Dhabi) or null",
//       "street": "The user's street name or null",
//       "building_name": "The user's building name or null",
//       "flat_no": "The user's flat number or null",
//       "latitude": "The user's latitude or null",
//       "longitude": "The user's longitude or null",
//       "quantity": "The user's quantity (in liters) or null"
//     }
    
//     If any information is missing, assign null to that field.

//     **Rules for Arabic Text:**
//     1. Recognize city names in Arabic: دبي (Dubai), أبو ظبي (Abu Dhabi), الشارقة (Sharjah).
//     2. Extract names written in Arabic script.
//     3. Extract phone numbers in UAE format (e.g., +9715xxxxxxxx).

//     Text: ${text}
// `;

//     const aiResponse = await getOpenAIResponse(prompt, ``, language); // Pass prompt, not textRaw

//     try {
//         const aiExtractedData = JSON.parse(aiResponse);
//         return { ...aiExtractedData, ...extractedData };
//     } catch (e) {
//         console.error("❌ Failed to parse AI response as JSON:", aiResponse);
//         return extractedData; // Return at least the manually extracted data
//     }
// }
// function getMissingFields(sessionData) {
//     // Define fields in the desired sequence
//     const orderedFields = [
//         'name',
//         'phone',
//         'email',
//         'latitude',
//         'longitude',
//         'address',
//         'city',
//         'street',
//         'building_name',
//         'flat_no',
//         'quantity'
//     ];

//     const missingFields = [];

//     // Check fields in specified order
//     orderedFields.forEach(field => {
//         const value = sessionData[field];
//         if (value === null ||
//             value === undefined ||
//             (typeof value === "string" &&
//                 (value.trim() === "" || value.trim().toLowerCase() === "null"))
//         ) {
//             missingFields.push(field);
//         }
//     });

//     // Handle location fields
//     if (missingFields.includes('latitude') || missingFields.includes('longitude')) {
//         missingFields.push('location');
//     }

//     // Remove technical fields and preserve order
//     return missingFields
//         .filter(field => !['latitude', 'longitude'].includes(field))
//         .sort((a, b) => orderedFields.indexOf(a) - orderedFields.indexOf(b));
// }

// async function askForNextMissingField(session, from) {
//     const missingFields = getMissingFields(session.data);
//     const lang = session.language; // Get current session language

//     if (missingFields.length === 0) {
//         session.step = STATES.CONFIRMATION;
//         await sendOrderSummary(from, session);
//     } else {
//         const nextField = missingFields[0];
//         session.step = `ASK_${nextField.toUpperCase()}`;

//         switch (nextField) {
//             case "city":
//                 await sendCitySelection(from, lang);
//                 break;
//             case "email":
//                 await sendToWhatsApp(from, getEmailMessage(lang));
//                 break;
//             case "name":
//                 await sendToWhatsApp(from, getNameMessage(lang));
//                 break;
//             case "phone":
//                 await sendToWhatsApp(from, getPhoneMessage(lang));
//                 break;
//             case "location":
//                 await sendToWhatsApp(from, getLocationMessage(lang));
//                 break;
//             case "address":
//                 await sendToWhatsApp(from, getAddressMessage(lang));
//                 break;
//             case "street":
//                 await sendToWhatsApp(from, getStreetMessage(lang));
//                 break;
//             case "building_name":
//                 await sendToWhatsApp(from, getBuildingMessage(lang));
//                 break;
//             case "flat_no":
//                 await sendToWhatsApp(from, getFlatMessage(lang));
//                 break;
//             case "quantity":
//                 await sendQuantitySelection(from, lang);
//                 break;
//             default:
//                 await sendToWhatsApp(from, lang === 'ar'
//                     ? `🔹 يرجى تقديم ${nextField.replace(/_/g, " ")}`
//                     : `🔹 Please provide your ${nextField.replace(/_/g, " ")}`);
//                 break;
//         }
//     }
// }
// //
// // async function isQuestionOrRequest(text) {
// //     const prompt = `
// //     Classify the user's input into one of the following categories:

// //     1️⃣ **"request"** → If the user is making a service request or wants to start a new request. Examples:
// //        - "I want to create a request"
// //        - "I want to create a new request"
// //        - "I have oil I want to get rid of"
// //        - "Hello, I have 50 liters of oil in Dubai"
// //        - "Please collect oil from my location"
// //        - "I need a pickup for used oil"
// //        - "New order request"
// //        - "I am Mohammad and I have 50 liters in Sharjah"
// //         - "أريد إنشاء طلب جديد"
// //         - "لدي زيت أريد التخلص منه"
// //         - "الرجاء جمع الزيت من موقعي"
// //         - "أحتاج إلى استلام الزيت المستعمل"
// //         - "طلب جديد"
// //         - "أنا محمد ولدي 50 لتر في الشارقة"

// //     2️⃣ **"question"** → If the user is **asking for information** about the company, services, or anything general. Examples:
// //        - "What services do you provide?"
// //        - "How does your oil collection work?"
// //        - "Where are you located?"
// //        - "What is the cost of biodiesel?"

// //     3️⃣ **"greeting"** → If the user is just saying hello. Examples:
// //        - "Hi"
// //        - "Hello"
// //        - "Good morning"

// //     4️⃣ **"other"** → If the input does not fit the above categories.

// //     Respond ONLY with one of these words: "request", "question", "greeting", or "other".

// //     **User Input:** "${text}"
// // `;

// //     const aiResponse = await getOpenAIResponse(prompt);
// //     const response = aiResponse.trim().toLowerCase();

// //     return response;
// // }



// // async function isQuestionOrRequest(text) {
// //     const prompt = `
// //     Classify the user's input into one of the following categories:

// //     1️⃣ **"request"** → If the user is making a service request or wants to start a new request. Examples:
// //        - "I want to create a request"
// //        - "I want to create a new request"
// //        - "I have oil I want to get rid of"
// //        - "Hello, I have 50 liters of oil in Dubai"
// //        - "Please collect oil from my location"
// //        - "I need a pickup for used oil"
// //        - "New order request"
// //        - "I am Mohammad and I have 50 liters in Sharjah"
// //         - "أريد إنشاء طلب جديد"
// //         - "لدي زيت أريد التخلص منه"
// //         - "الرجاء جمع الزيت من موقعي"
// //         - "أحتاج إلى استلام الزيت المستعمل"
// //         - "طلب جديد"
// //         - "أنا محمد ولدي 50 لتر في الشارقة"

// //     2️⃣ **"question"** → If the user is **asking for information** about the company, services, or anything general. Examples:
// //        - "What services do you provide?"
// //        - "How does your oil collection work?"
// //        - "Where are you located?"
// //        - "What is the cost of biodiesel?"

// //     3️⃣ **"greeting"** → If the user is just saying hello. Examples:
// //        - "Hi"
// //        - "Hello"
// //        - "Good morning"

// //     4️⃣ **"answer"** → If the user is providing an answer to a specific question. Examples:
// //        - "My name is John"
// //        - "John"
// //        - "khaled"
// //        - "ahmed"
// //        - "yazan"
// //        - "mohammad"
// //        - "ali"
// //        - "my name is ayman"
// //        - "mmyyttt@gmail.com"
// //        - "yazan@gmail.com"
// //        - "mohammaedAinia@gmail.com"


// //     5️⃣ **"other"** → If the input does not fit the above categories.

// //     Respond ONLY with one of these words: "request", "question", "greeting", "answer", or "other".

// //     **User Input:** "${text}"
// // `;

// //     const aiResponse = await getOpenAIResponse(prompt);
// //     const response = aiResponse.trim().toLowerCase();

// //     return response;
// // }


// async function isQuestionOrRequest(text) {
//     // Patterns for detecting answers
//     const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/; // Basic email regex
//     const namePattern = /^[A-Za-z\s]{2,30}$/; // Simple name regex (2-30 characters, letters and spaces)
//     const quantityPattern = /(\d+)\s*liters?/i; // Matches "50 liters", "100 liter", etc.
//     const addressPattern = /(street|st\.|avenue|ave\.|road|rd\.|building|bldg\.|flat|apartment|apt\.)/i; // Matches common address terms

//     // Check if the input matches any answer pattern
//     if (emailPattern.test(text)) {
//         return "answer"; // Classify as answer if it's an email
//     }
//     if (namePattern.test(text)) {
//         return "answer"; // Classify as answer if it looks like a name
//     }
//     if (quantityPattern.test(text)) {
//         return "answer"; // Classify as answer if it's a quantity
//     }
//     if (addressPattern.test(text)) {
//         return "answer"; // Classify as answer if it looks like an address
//     }

//     // If no patterns match, use the OpenAI prompt for classification
//     const prompt = `
//     Classify the user's input into one of the following categories:
    
//     1️⃣ **"request"** → If the user is making a service request or wants to start a new request. Examples:
//        - "I want to create a request"
//        - "I want to create a new request"
//        - "I have oil I want to get rid of"
//        - "Hello, I have 50 liters of oil in Dubai"
//        - "Please collect oil from my location"
//        - "I need a pickup for used oil"
//        - "New order request"
//        - "I am Mohammad and I have 50 liters in Sharjah"
//         - "أريد إنشاء طلب جديد"
//         - "لدي زيت أريد التخلص منه"
//         - "الرجاء جمع الزيت من موقعي"
//         - "أحتاج إلى استلام الزيت المستعمل"
//         - "طلب جديد"
//         - "أنا محمد ولدي 50 لتر في الشارقة"
    
//     2️⃣ **"question"** → If the user is **asking for information** about the company, services, or anything general. Examples:
//        - "What services do you provide?"
//        - "How does your oil collection work?"
//        - "Where are you located?"
//        - "What is the cost of biodiesel?"
    
//     3️⃣ **"greeting"** → If the user is just saying hello. Examples:
//        - "Hi"
//        - "Hello"
//        - "Good morning"
    
//     4️⃣ **"answer"** → If the user is providing an answer to a specific question. Examples:
//        - "My name is John"
//        - "John"
//        - "khaled"
//        - "ahmed"
//        - "yazan"
//        - "mohammad"
//        - "ali"
//        - "my name is ayman"
//        - "mmyyttt@gmail.com"
//        - "yazan@gmail.com"
//        - "mohammaedAinia@gmail.com"
//        - "50 liters"
//        - "100 liters"
//        - "30 liters"
//        - "My address is 123 Main Street"
//        - "123 Main Street"
//        - "Building 5, Flat 12"
//        - "Flat 12, Building 5"
//        - "My email is example@example.com"
//        - "example@example.com"
//        - "My quantity is 50 liters"
//        - "50"
//        - "100"
//        - "30"
    
//     5️⃣ **"other"** → If the input does not fit the above categories.
    
//     Respond ONLY with one of these words: "request", "question", "greeting", "answer", or "other".

//     **User Input:** "${text}"
// `;

//     const aiResponse = await getOpenAIResponse(prompt);
//     const response = aiResponse.trim().toLowerCase();

//     return response;
// }

// const getButtonTitle = (buttonId, language) => {
//     const buttonTitles = {
//         "contact_us": { en: "Contact Us", ar: "اتصل بنا" },
//         "new_request": { en: "New Request", ar: "طلب جديد" },
//         "send_site": { en: "Send Site", ar: "إرسال الموقع" }
//     };

//     return buttonTitles[buttonId]?.[language] || buttonTitles[buttonId]?.en || buttonId;
// };
// function getContactMessage(language) {
//     return language === 'ar' ? '📞 يمكنك الاتصال بنا على support@example.com أو الاتصال على +1234567890.' : '📞 You can contact us at support@example.com or call +1234567890.';
// }
// function getNameMessage(language) {
//     return language === 'ar' ? '🔹 يرجى تقديم اسمك الكامل.' : '🔹 Please provide your full name.';
// }

// function getEmailMessage(language) {
//     return language === 'ar' ? '📧 يرجى تقديم عنوان بريدك الإلكتروني.' : '📧 Please provide your email address.';
// }

// function getInvalidOptionMessage(language) {
//     return language === 'ar' ? '❌ خيار غير صالح، يرجى تحديد زر صالح.' : '❌ Invalid option, please select a valid button.';
// }
// function getPhoneMessage(language) {
//     return language === 'ar' ? '📱 يرجى تقديم رقم هاتفك (يجب أن يكون رقم إماراتي).' : '📱 Please provide your phone number (must be a valid Emirati number).';
// }

// function getInvalidPhoneMessage(language) {
//     return language === 'ar' ? '❌ رقم الهاتف غير صالح، يرجى إدخال رقم إماراتي صالح.' : '❌ Invalid phone number, please enter a valid Emirati number.';
// }

// function getAddressMessage(language) {
//     return language === 'ar' ? '📍 يرجى تقديم عنوانك الكامل.' : '📍 Please provide your full address.';
// }

// function getCitySelectionMessage(language) {
//     return language === 'ar' ? '🏙️ يرجى اختيار مدينتك من الخيارات أدناه.' : '🏙️ Please select your city from the options below.';
// }

// function getInvalidCityMessage(language) {
//     return language === 'ar' ?
//         '❌ المدينة المحددة لا تتطابق مع موقعك. يرجى اختيار المدينة الصحيحة.' :
//         '❌ The selected city does not match your location. Please choose the correct city.';
// }

// function getStreetMessage(language) {
//     return language === 'ar' ? '🏠 يرجى تقديم اسم الشارع.' : '🏠 Please provide the street name.';
// }

// function getBuildingMessage(language) {
//     return language === 'ar' ? '🏢 يرجى تقديم اسم المبنى.' : '🏢 Please provide the building name.';
// }

// function getFlatMessage(language) {
//     return language === 'ar' ? '🚪 يرجى تقديم رقم الشقة.' : '🚪 Please provide the flat number.';
// }

// const getLocationMessage = (language) => {
//     return language === 'ar'
//         ? "📍 يرجى مشاركة موقعك الحالي لتحديد موقعك."
//         : "📍 Please share your current location to determine your site.";
// };


// function getQuantityMessage(language) {
//     return language === 'ar' ? '📦 يرجى إدخال الكمية (باللترات).' : '📦 Please provide the quantity (in liters).';
// }

// function getInvalidQuantityMessage(language) {
//     return language === 'ar' ? '❌ يرجى إدخال كمية صالحة (أرقام فقط).' : '❌ Please enter a valid quantity (numeric values only).';
// }

// function getConfirmationMessage(language) {
//     return language === 'ar' ? '✅ يرجى التأكيد على صحة التفاصيل قبل الإرسال.' : '✅ Please confirm that the details are correct before submission.';
// }
// function getContinueMessage(language) {
//     return language === 'ar' ?
//         'لإكمال الاستفسار، يمكنك طرح أسئلة أخرى. إذا كنت ترغب في تقديم طلب أو الاتصال بنا، اختر من الخيارات التالية:' :
//         'To complete the inquiry, you can ask other questions. If you want to submit a request or contact us, choose from the following options:';
// }
// function getInvalidUAERegionMessage(language) {
//     return language === 'ar' ?
//         '❌ الموقع الذي أرسلته خارج الإمارات. يرجى إرسال موقع داخل الإمارات.' :
//         '❌ The location you shared is outside the UAE. Please send a location within the Emirates.';
// }
// //


// //
// const detectRequestStart = async (text) => {
//     const prompt = `
//         Determine if the user's message indicates the start of a request for Lootah Biofuels. 
//         Respond with "true" if the message indicates a request start, otherwise respond with "false".

//         Examples of request start:
//         - "I want to create a request"
//         - "I have oil I want to get rid of"
//         - "Please collect oil from my location"
//         - "I need a pickup for used oil"
//         - "New order request"
//         - "I am Mohammad and I have 50 liters in Sharjah"
//         - "أريد إنشاء طلب جديد"
//         - "لدي زيت أريد التخلص منه"
//         - "الرجاء جمع الزيت من موقعي"
//         - "أحتاج إلى استلام الزيت المستعمل"
//         - "طلب جديد"
//         - "أنا محمد ولدي 50 لتر في الشارقة"

//         User Input: "${text}"
//     `;

//     const response = await getOpenAIResponse(prompt);
//     return response.trim().toLowerCase() === "true";
// };

// function moveToNextStep(session, from) {  // ✅ Add parameters
//     const missingFields = getMissingFields(session.data);
//     if (missingFields.length === 0) {
//         session.step = STATES.CONFIRMATION;
//         sendOrderSummary(from, session);
//     } else {
//         session.step = `ASK_${missingFields[0].toUpperCase()}`;
//         askForNextMissingField(session, from);
//     }
// }
// const validateCityAndLocation = async (latitude, longitude, selectedCity) => {
//     try {
//         // If location is not available, accept the city without validation
//         if (!latitude || !longitude) {
//             return {
//                 isValid: true,
//                 actualCity: null
//             };
//         }

//         // Use a geocoding API to get the city name from the latitude and longitude
//         const response = await axios.get(
//             `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`
//         );
//         const actualCity = response.data.city;

//         // Normalize city names for comparison
//         const normalizedSelectedCity = selectedCity.toLowerCase().trim();
//         const normalizedActualCity = actualCity.toLowerCase().trim();

//         // Return both the validation result and the actual city name
//         return {
//             isValid: normalizedSelectedCity === normalizedActualCity,
//             actualCity: actualCity
//         };
//     } catch (error) {
//         console.error("❌ Error validating city and location:", error);
//         return {
//             isValid: true, // Fail open
//             actualCity: null
//         };
//     }
// };

// // with 532218805
// async function checkUserRegistration(phoneNumber) {
//     try {
//         // Remove any non-numeric characters
//         let cleanedNumber = phoneNumber.replace(/\D/g, '');

//         // Remove country code if it's Saudi (+966 or 966) or UAE (+971 or 971)
//         if (cleanedNumber.startsWith('966')) {
//             cleanedNumber = cleanedNumber.slice(3); // Remove Saudi country code
//         } else if (cleanedNumber.startsWith('971')) {
//             cleanedNumber = cleanedNumber.slice(3); // Remove UAE country code
//         }

//         const response = await axios.get('https://dev.lootahbiofuels.com/api/v1/check-user', {
//             headers: {
//                 'API-KEY': 'iUmcFyQUYa7l0u5J1aOxoGpIoh0iQSqpAlXX8Zho5vfxlTK4mXr41GvOHc4JwIkvltIUSoCDmc9VMbmJLajSIMK3NHx3M5ggaff8JMBTlZCryZlr8SmmhmYGGlmXo8uM',
//                 'Accept': 'application/json',
//                 'Content-Type': 'application/json'
//             },
//             params: { phone_number: cleanedNumber }
//         });

//         console.log('🔹 API Response:', response.data);

//         if (response.data?.exists && response.data.user) {
//             const user = {
//                 id: response.data.user.id,
//                 name: response.data.user.first_name || 'User', // Use first_name or a default value
//                 email: response.data.user.email,
//                 phone: response.data.user.phone_number,
//                 city: response.data.addresses?.city,
//                 address: response.data.addresses?.address,
//                 street: response.data.addresses?.street,
//                 building_name: response.data.addresses?.building_name,
//                 flat_no: response.data.addresses?.flat_no,
//                 latitude: response.data.addresses?.latitude,
//                 longitude: response.data.addresses?.longitude
//             };
//             return user;
//         } else {
//             return null; // Explicitly return null if not registered
//         }
//     } catch (error) {
//         console.error('❌ Error checking user registration:', error);
//         if (error.response) {
//             console.error('❌ API Error Response:', error.response.data);
//             console.error('❌ API Status Code:', error.response.status);
//         }
//         return null;
//     }
// }

// async function getAddressFromCoordinates(latitude, longitude) {
//     try {
//         const response = await axios.get(`https://nominatim.openstreetmap.org/reverse`, {
//             params: { lat: latitude, lon: longitude, format: "json" }
//         });

//         if (response.data && response.data.address) {
//             console.log("🔍 Address API Response:", response.data.address); // Debugging

//             return formatAddress(response.data.address);
//         }
//         return null;
//     } catch (error) {
//         console.error("❌ Reverse Geocoding Error:", error);
//         return null;
//     }
// }


// // Function to format the address into a readable string
// function formatAddress(address) {
//     const street = address.road || address.street || address.neighbourhood || address.suburb || "";
//     const city = address.city || address.town || address.village || address.state || "";
//     const country = address.country || "";

//     return [street, city, country].filter(Boolean).join(", "); // Join non-empty parts
// }

// function extractStreetName(address) {
//     if (!address) return "Unknown Street";

//     // Prioritize main street-related fields
//     return address.road ||
//         address.street ||
//         address.residential || // Sometimes used in residential areas
//         address.neighbourhood ||
//         address.suburb ||
//         address.city_district || // Extra fallback for districts
//         "Unknown Street";
// }
// async function sendQuantitySelection(user, language) {
//     const message = language === "ar"
//         ? "🛢️ يرجى اختيار كمية الزيت أو إدخالها يدويًا:"
//         : "🛢️ Please select the oil quantity or enter manually:";

//     const buttons = [
//         { id: "10", title: "10 Liters" },
//         { id: "15", title: "15 Liters" },
//         { id: "20", title: "20 Liters" }
//     ];

//     console.log("🔹 Sending interactive buttons for quantity selection...");
//     await sendInteractiveButtons2(user, message, buttons);
// }

// // Function to validate and extract a single emoji
// const extractSingleEmoji = (text) => {
//     // Match a single emoji using a regex pattern
//     const emojiRegex = /\p{Emoji}/u;
//     const match = text.match(emojiRegex);
//     return match ? match[0] : "👍"; // Default to "👍" if no valid emoji is found
// };

// // Function to get an emoji reaction based on the user's message
// const getEmojiReaction = async (userMessage, language = "en") => {
//     try {
//         const systemMessage = `
//             You are an emoji reaction generator. Based on the user's message, suggest an appropriate emoji reaction.
//             Your response should ONLY contain the emoji, nothing else.
//             Examples:
//             - If the user says "thank you", respond with "❤️".
//             - If the user says "hello" or "hi", respond with "👋".
//             - If the user provides information, respond with "👍".
//             - If the user seems confused, respond with "🤔".
//             - If the user is happy, respond with "😊".
//             - If the user is upset, respond with "😔".
//             - If the user is joking, respond with "😂".
//             - If the user is asking for help, respond with "🆘".
//             - If the user is excited, respond with "🎉".
//             - If the user is neutral, respond with "👍".
//         `;

//         const response = await getOpenAIResponse(userMessage, systemMessage, language);
//         const emoji = extractSingleEmoji(response.trim()); // Extract a single emoji
//         return emoji;
//     } catch (error) {
//         console.error('❌ Error getting emoji reaction:', error);
//         return "👍"; // Default emoji if something goes wrong
//     }
// };

// // Function to send a reaction (emoji) to a message
// const sendReaction = async (to, messageId, emoji) => {
//     try {
//         await axios.post(process.env.WHATSAPP_API_URL, {
//             messaging_product: 'whatsapp',
//             recipient_type: 'individual',
//             to: to,
//             type: 'reaction',
//             reaction: {
//                 message_id: messageId,
//                 emoji: emoji
//             }
//         }, {
//             headers: {
//                 'Authorization': `Bearer ${process.env.WHATSAPP_ACCESS_TOKEN}`,
//                 'Content-Type': 'application/json'
//             }
//         });
//     } catch (error) {
//         console.error('❌ Failed to send reaction:', error.response?.data || error.message);
//     }
// };

// // Function to validate a URL
// const isValidUrl = (url) => {
//     try {
//         new URL(url); // This will throw an error if the URL is invalid
//         return true;
//     } catch (error) {
//         return false;
//     }
// };

// // Function to download a file from a URL
// const downloadFile = async (url, filePath) => {
//     const response = await axios({
//         url,
//         method: 'GET',
//         responseType: 'stream',
//         headers: {
//             'Authorization': `Bearer ${process.env.WHATSAPP_ACCESS_TOKEN}`,
//         },
//     });
//     const writer = fs.createWriteStream(filePath);
//     response.data.pipe(writer);
//     return new Promise((resolve, reject) => {
//         writer.on('finish', resolve);
//         writer.on('error', reject);
//     });
// };

// // Function to transcribe a voice file using OpenAI's Whisper API
// const transcribeVoiceMessage = async (filePath) => {
//     try {
//         const transcription = await openai.audio.transcriptions.create({
//             file: fs.createReadStream(filePath),
//             model: "whisper-1",
//         });
//         return transcription.text;
//     } catch (error) {
//         console.error('❌ Error transcribing voice message:', error);
//         return null;
//     }
// };

// const fetchMediaUrl = async (mediaId) => {
//     try {
//         const response = await axios.get(`https://graph.facebook.com/v19.0/${mediaId}`, {
//             headers: {
//                 'Authorization': `Bearer ${process.env.WHATSAPP_ACCESS_TOKEN}`,
//             },
//         });
//         return response.data.url; // Returns the URL of the media file
//     } catch (error) {
//         console.error('❌ Error fetching media URL:', error.response?.data || error.message);
//         return null;
//     }
// };

// const generateAudio = async (text, filePath) => {
//     try {
//         const mp3 = await openai.audio.speech.create({
//             model: "tts-1",
//             voice: "alloy", // Options: alloy, echo, fable, onyx, nova, shimmer
//             input: text,
//         });

//         const buffer = Buffer.from(await mp3.arrayBuffer());
//         fs.writeFileSync(filePath, buffer);
//         console.log("🔹 Audio file generated successfully:", filePath);

//         // Check MIME type of the generated file
//         const mimeType = mime.lookup(filePath);
//         if (mimeType !== "audio/mpeg") {
//             console.error("❌ Invalid file format. Expected audio/mpeg, got:", mimeType);
//             throw new Error("Invalid file format");
//         }

//         return filePath;
//     } catch (error) {
//         console.error("❌ Error generating audio:", error);
//         throw error;
//     }
// };
// const uploadMediaToWhatsApp = async (filePath) => {
//     try {
//         // Check file format
//         const mimeType = mime.lookup(filePath);
//         if (mimeType !== "audio/mpeg") {
//             console.error("❌ Invalid file format. Expected audio/mpeg, got:", mimeType);
//             throw new Error("Invalid file format");
//         }

//         // Check file size
//         const fileStats = fs.statSync(filePath);
//         const fileSizeInMB = fileStats.size / (1024 * 1024);
//         if (fileSizeInMB > 16) {
//             console.error("❌ File size exceeds WhatsApp's limit (16 MB):", fileSizeInMB);
//             throw new Error("File size too large");
//         }

//         // Read file content
//         const fileContent = fs.readFileSync(filePath);

//         // Create FormData
//         const formData = new FormData();
//         formData.append("file", fileContent, {
//             filename: path.basename(filePath), // Use path.basename to get the filename
//             contentType: "audio/mpeg",
//         });
//         formData.append("messaging_product", "whatsapp");
//         formData.append("type", "audio/mpeg");

//         // Upload file to WhatsApp
//         const response = await axios.post(
//             `https://graph.facebook.com/v20.0/${process.env.PHONE_NUMBER_ID}/media`,
//             formData,
//             {
//                 headers: {
//                     ...formData.getHeaders(),
//                     "Authorization": `Bearer ${process.env.WHATSAPP_ACCESS_TOKEN}`,
//                 },
//             }
//         );

//         console.log("✅ Media uploaded to WhatsApp:", response.data);
//         return response.data.id; // Return the media ID
//     } catch (error) {
//         console.error("❌ Error uploading media to WhatsApp:", {
//             message: error.message,
//             response: error.response?.data,
//             stack: error.stack,
//         });
//         throw error;
//     }
// };

// const sendAudioUsingMediaId = async (to, mediaId) => {
//     try {
//         const payload = {
//             messaging_product: "whatsapp",
//             recipient_type: "individual",
//             to: to,
//             type: "audio",
//             audio: {
//                 id: mediaId, // Use the media ID instead of a URL
//             },
//         };

//         const response = await axios.post(process.env.WHATSAPP_API_URL, payload, {
//             headers: {
//                 "Authorization": `Bearer ${process.env.WHATSAPP_ACCESS_TOKEN}`,
//                 "Content-Type": "application/json",
//             },
//         });

//         console.log("✅ Audio sent successfully:", response.data);
//     } catch (error) {
//         console.error("❌ Failed to send audio:", error.response?.data || error.message);
//         throw error;
//     }
// };

// // Webhook endpoint
// app.post('/webhook', async (req, res) => {
//     try {
//         console.log("🔹 Incoming Webhook Data:", JSON.stringify(req.body, null, 2));
//         if (!req.body.entry || !Array.isArray(req.body.entry) || req.body.entry.length === 0) {
//             console.error("❌ Error: Missing or invalid 'entry' in webhook payload.");
//             return res.sendStatus(400);
//         }

//         const entry = req.body.entry[0];
//         if (!entry.changes || !Array.isArray(entry.changes) || entry.changes.length === 0) {
//             console.error("❌ Error: Missing or invalid 'changes' in webhook payload.");
//             return res.sendStatus(400);
//         }

//         const changes = entry.changes[0];
//         const value = changes.value;
//         if (!value?.messages || !Array.isArray(value.messages) || value.messages.length === 0) {
//             console.warn("⚠️ No messages found in webhook payload. Ignoring event.");
//             return res.sendStatus(200);
//         }

//         const message = value.messages[0];
//         const from = message.from;

//         if (!message?.from) {
//             console.error("❌ Error: Missing 'from' field in message.");
//             return res.sendStatus(400);
//         }
//         let session = userSessions[from];

//         const messageId = message.id; // Get the message ID for reactions
//         let textRaw = message.text?.body || "";

//         // Get an emoji reaction based on the user's message
//         const emoji = await getEmojiReaction(textRaw, session?.language || "en");
//         await sendReaction(from, messageId, emoji); // Send the reaction

//         const text = textRaw.toLowerCase().trim();
//         let detectedLanguage = "en";

//         try {
//             const detected = langdetect.detect(textRaw);
//             if (Array.isArray(detected) && detected.length > 0) {
//                 detectedLanguage = detected[0].lang;
//             }
//             if (detectedLanguage !== "ar" && detectedLanguage !== "en") {
//                 detectedLanguage = "en";
//             }
//         } catch (error) {
//             console.log("⚠️ Language detection failed. Defaulting to English.", error);
//         }

//         if (!session) {
//             const user = await checkUserRegistration(from);
//             if (user && user.name) {
//                 let welcomeMessage = await getOpenAIResponse(
//                     `Welcome back, ${user.name}. Generate a WhatsApp welcome message for Lootah Biofuels.`,
//                     "",
//                     detectedLanguage
//                 );
//                 await sendInteractiveButtons(from, welcomeMessage, [
//                     { type: "reply", reply: { id: "contact_us", title: getButtonTitle("contact_us", detectedLanguage) } },
//                     { type: "reply", reply: { id: "new_request", title: getButtonTitle("new_request", detectedLanguage) } }
//                 ]);
//                 userSessions[from] = {
//                     step: STATES.WELCOME,
//                     data: user,
//                     language: detectedLanguage,
//                     inRequest: false,
//                     lastTimestamp: Number(message.timestamp)
//                 };
//             } else {
//                 userSessions[from] = {
//                     step: STATES.WELCOME,
//                     data: { phone: from },
//                     language: detectedLanguage,
//                     inRequest: false,
//                     lastTimestamp: Number(message.timestamp)
//                 };
//                 const welcomeMessage = await getOpenAIResponse(
//                     "Generate a WhatsApp welcome message for Lootah Biofuels.",
//                     "",
//                     detectedLanguage
//                 );
//                 await sendInteractiveButtons(from, welcomeMessage, [
//                     { type: "reply", reply: { id: "contact_us", title: getButtonTitle("contact_us", detectedLanguage) } },
//                     { type: "reply", reply: { id: "new_request", title: getButtonTitle("new_request", detectedLanguage) } }
//                 ]);
//             }
//             return res.sendStatus(200);
//         }

//         // Handle voice messages


//         if (message.type === "audio" && message.audio) {
//             const mediaId = message.audio.id; // Get the media ID

//             // Fetch the media URL using the media ID
//             const audioUrl = await fetchMediaUrl(mediaId);
//             if (!audioUrl || !isValidUrl(audioUrl)) {
//                 console.error("❌ Invalid or missing audio URL:", audioUrl);
//                 await sendToWhatsApp(from, "Sorry, I couldn't process your voice message. Please try again.");
//                 return res.sendStatus(200);
//             }

//             const filePath = `./temp/${messageId}.ogg`; // Unique temporary file path

//             try {
//                 // Download the voice file
//                 await downloadFile(audioUrl, filePath);
//                 console.log("🔹 Voice file downloaded successfully:", filePath);

//                 // Transcribe the voice file using OpenAI Whisper
//                 const transcription = await transcribeVoiceMessage(filePath);
//                 if (!transcription) {
//                     console.error("❌ Failed to transcribe voice message. Transcription result is empty.");
//                     await sendToWhatsApp(from, "Sorry, I couldn't understand your voice message. Please try again.");
//                     return res.sendStatus(200);
//                 }

//                 console.log(`🔹 Transcribed voice message: ${transcription}`);
//                 const transcribedText = transcription; // Use the transcribed text as the message

//                 // Classify the transcribed text
//                 const classification = await isQuestionOrRequest(transcribedText);
//                 let aiResponse = ""; // Declare aiResponse here to avoid scope issues

//                 // Handle each classification in the specified order
//                 if (classification === "question") {
//                     // Handle questions
//                     aiResponse = await getOpenAIResponse(transcribedText, systemMessage, session.language);

//                     // Send text response
//                     if (session.inRequest) {
//                         await sendToWhatsApp(from, `${aiResponse}\n\nPlease complete the request information.`);
//                     } else {
//                         const reply = `${aiResponse}\n\n${getContinueMessage(session.language)}`;
//                         await sendInteractiveButtons(from, reply, [
//                             { type: "reply", reply: { id: "contact_us", title: getButtonTitle("contact_us", session.language) } },
//                             { type: "reply", reply: { id: "new_request", title: getButtonTitle("new_request", session.language) } }
//                         ]);
//                     }
//                 } else if (classification === "answer") {
//                     // Handle answers
//                     if (session.step === STATES.NAME) {
//                         session.data.name = transcribedText;
//                         session.step = STATES.EMAIL;
//                         await sendToWhatsApp(from, getEmailMessage(session.language));
//                         await sendToWhatsApp(from, aiResponse);
//                     }
//                     else if (session.step === STATES.EMAIL) {
//                         if (!isValidEmail(transcribedText)) {
//                             await sendToWhatsApp(from, "❌ Please provide a valid email address (e.g., example@domain.com).");
//                             return res.sendStatus(200);
//                         }
//                         session.data.email = transcribedText;
//                         session.step = STATES.LONGITUDE;
//                         await sendToWhatsApp(from, getLocationMessage(session.language));
//                     }
//                     else if (session.step === STATES.STREET) {
//                         session.data.street = transcribedText;
//                         session.step = STATES.BUILDING_NAME;
//                         await sendToWhatsApp(from, getBuildingMessage(session.language));
//                     }
//                     else if (session.step === STATES.BUILDING_NAME) {
//                         session.data.building_name = transcribedText;
//                         session.step = STATES.FLAT_NO;
//                         await sendToWhatsApp(from, getFlatMessage(session.language));
//                     }
//                     else if (session.step === STATES.FLAT_NO) {
//                         session.data.flat_no = transcribedText;
//                         session.step = STATES.QUANTITY;
//                         return await sendQuantitySelection(from, session.language);
//                     }
//                     else if (session.step === STATES.QUANTITY) {
//                         // const quantity = parseInt(transcribedText.trim(), 10);

//                         if (transcribedText < 10) {
//                             await sendToWhatsApp(from, getInvalidQuantityMessage(session.language));
//                             await sendQuantitySelection(from, session.language);
//                             return res.sendStatus(200);
//                         }
//                         session.data.quantity = transcribedText;
//                         session.step = STATES.CONFIRMATION;
//                     }
//                 } else if (classification === "request") {
//                     // Handle requests
//                     if (!session.data || !session.data.name) {  // Check if the user doesn't have any data
//                         // Start collecting information immediately if the user is new and doesn't have data
//                         session.inRequest = true;
//                         session.step = STATES.NAME;
//                         aiResponse = "Please provide your name."; // Set aiResponse for voice generation
//                         await sendToWhatsApp(from, aiResponse);
//                     } else {
//                         const extractedData = await extractInformationFromText(transcribedText, session.language);
//                         if (Object.keys(extractedData).length > 0) {
//                             session.step = STATES.CHANGE_INFOO;
//                             aiResponse = "Do you want to change your information?"; // Set aiResponse for voice generation
//                             await sendInteractiveButtons(from, aiResponse, [
//                                 { type: "reply", reply: { id: "yes_change", title: "Yes" } },
//                                 { type: "reply", reply: { id: "no_change", title: "No" } }
//                             ]);
//                             session.tempData = extractedData; // Store extracted data temporarily
//                         } else {
//                             aiResponse = "Do you want to change your information?"; // Set aiResponse for voice generation
//                             await sendToWhatsApp(from, `${aiResponse}\n\nPlease provide more details about your request.`);
//                             session.inRequest = true; // Set the session to indicate the user is in a request flow
//                         }
//                     }
//                 } else if (classification === "greeting" || classification === "other") {
//                     // Handle greetings or other cases
//                     aiResponse = await getOpenAIResponse(transcribedText, systemMessage, session.language);
//                     await sendToWhatsApp(from, aiResponse);
//                 }

//                 // Generate audio response using OpenAI TTS (for all cases except when returning early)
//                 if (aiResponse) {
//                     const audioFilePath = `./temp/${messageId}_response.mp3`;
//                     await generateAudio(aiResponse, audioFilePath);

//                     // Upload audio file to WhatsApp's servers
//                     const uploadedMediaId = await uploadMediaToWhatsApp(audioFilePath);

//                     // Send audio to user using the media ID
//                     await sendAudioUsingMediaId(from, uploadedMediaId);

//                     // Clean up temporary files
//                     fs.unlinkSync(audioFilePath);
//                     console.log("✅ Temporary audio file deleted:", audioFilePath);
//                 }

//                 return res.sendStatus(200);
//             } catch (error) {
//                 console.error("❌ Error downloading or transcribing voice message:", error);
//                 await sendToWhatsApp(from, "Sorry, I couldn't process your voice message. Please try again.");
//                 return res.sendStatus(200);
//             } finally {
//                 // Clean up the temporary file
//                 if (fs.existsSync(filePath)) {
//                     fs.unlinkSync(filePath);
//                     console.log("✅ Temporary file deleted:", filePath);
//                 }
//             }
//         }


//         if (message.type === "interactive" && message.interactive?.type === "button_reply") {
//             const buttonId = message.interactive.button_reply.id;
//             if (buttonId === "new_request") {
//                 if (!session.data || !session.data.name) {  // Check if the user doesn't have any data
//                     // Start collecting information immediately if the user is new and doesn't have data
//                     session.inRequest = true;
//                     session.step = STATES.NAME;
//                     await sendToWhatsApp(from, "Please provide your name.");
//                 } else {
//                     // Proceed to ask if the user wants to change information if they already have data
//                     await sendInteractiveButtons(from, "Do you want to change your information?", [
//                         { type: "reply", reply: { id: "yes_change", title: "Yes" } },
//                         { type: "reply", reply: { id: "no_change", title: "No" } }
//                     ]);
//                     session.step = STATES.CHANGE_INFO;
//                 }
//                 return res.sendStatus(200);
//             }
//         }

//         if (session.lastTimestamp && Number(message.timestamp) < session.lastTimestamp) {
//             console.log(`Ignoring out-of-order message for user ${from}`);
//             return res.sendStatus(200);
//         }
//         session.lastTimestamp = Number(message.timestamp);

//         const classification = await isQuestionOrRequest(textRaw);
//         if (classification === "question") {
//             const aiResponse = await getOpenAIResponse(textRaw, systemMessage, session.language);
//             if (session.inRequest) {
//                 await sendToWhatsApp(from, `${aiResponse}\n\nPlease complete the request information.`);
//             } else {
//                 const reply = `${aiResponse}\n\n${getContinueMessage(session.language)}`;
//                 await sendInteractiveButtons(from, reply, [
//                     { type: "reply", reply: { id: "contact_us", title: getButtonTitle("contact_us", session.language) } },
//                     { type: "reply", reply: { id: "new_request", title: getButtonTitle("new_request", session.language) } }
//                 ]);
//             }
//             return res.sendStatus(200);
//         }

//         // Check if the user's message contains information
//         if (session.step === STATES.WELCOME && message.type === "text") {
//             // Check if the user's message indicates the start of a request
//             const isRequestStart = await detectRequestStart(textRaw);
//             if (isRequestStart) {
//                 session.inRequest = true;
        
//                 // Extract information from the user's message
//                 const extractedData = await extractInformationFromText(textRaw, session.language);
        
//                 // Check if the user is registered
//                 const user = await checkUserRegistration(from);
//                 if (user && user.name) {
//                     // User is registered, ask if they want to change their information
//                     session.step = STATES.CHANGE_INFOO;
//                     session.tempData = extractedData; // Store extracted data temporarily
//                     await sendInteractiveButtons(from, "Do you want to change your information?", [
//                         { type: "reply", reply: { id: "yes_change", title: "Yes" } },
//                         { type: "reply", reply: { id: "no_change", title: "No" } }
//                     ]);
//                 } else {
//                     // User is not registered, start collecting information
//                     session.data = { ...session.data, ...extractedData }; // Merge extracted data with session data
//                     const missingFields = getMissingFields(session.data);
//                     if (missingFields.length > 0) {
//                         session.step = `ASK_${missingFields[0].toUpperCase()}`;
//                         await askForNextMissingField(session, from);
//                     } else {
//                         session.step = STATES.QUANTITY;
//                         await sendQuantitySelection(from, session.language);
//                     }
//                 }
//             } else {
//                 // If the message is not a request, treat it as a general message
//                 const aiResponse = await getOpenAIResponse(textRaw, systemMessage, session.language);
//                 const reply = `${aiResponse}\n\n${getContinueMessage(session.language)}`;
        
//                 await sendInteractiveButtons(from, reply, [
//                     { type: "reply", reply: { id: "contact_us", title: getButtonTitle("contact_us", session.language) } },
//                     { type: "reply", reply: { id: "new_request", title: getButtonTitle("new_request", session.language) } }
//                 ]);
//             }
//             return res.sendStatus(200);
//         }
        
//         if (session.step === STATES.CHANGE_INFOO) {
//             if (message.type === "interactive" && message.interactive?.type === "button_reply") {
//                 const buttonId = message.interactive.button_reply.id;
//                 if (buttonId === "yes_change") {
//                     // User wants to change information, update session data with extracted information
//                     session.data = { ...session.data, ...session.tempData }; // Merge extracted data with session data
//                     delete session.tempData; // Clear temporary data
        
//                     // Ensure the phone number is not overwritten if already present
//                     if (!session.data.phone) {
//                         session.data.phone = from; // Use the WhatsApp number as the default phone number
//                     }
        
//                     // Check for missing fields
//                     const missingFields = getMissingFields(session.data);
//                     if (missingFields.length > 0) {
//                         session.step = `ASK_${missingFields[0].toUpperCase()}`;
//                         await askForNextMissingField(session, from);
//                     } else {
//                         session.step = STATES.QUANTITY;
//                         await sendQuantitySelection(from, session.language);
//                     }
//                 } else if (buttonId === "no_change") {
//                     // User does not want to change information, proceed to quantity selection
//                     session.step = STATES.QUANTITY;
//                     await sendQuantitySelection(from, session.language);
//                 }
//             }
//             return res.sendStatus(200);
//         }

//         // Handle CHANGE_INFO state
//         // if (session.step === STATES.CHANGE_INFOO) {
//         //     if (message.type === "interactive" && message.interactive?.type === "button_reply") {
//         //         const buttonId = message.interactive.button_reply.id;
//         //         if (buttonId === "yes_change") {
//         //             // Update session data with extracted information
//         //             session.data = { ...session.data, ...session.tempData };
//         //             delete session.tempData; // Clear temporary data

//         //             // Ensure the phone number is not overwritten if already present
//         // if (!session.data.phone) {
//         //     session.data.phone = from; // Use the WhatsApp number as the default phone number
//         // }

//         //             const missingFields = getMissingFields(session.data);
//         //             if (missingFields.length > 0) {
//         //                 session.step = `ASK_${missingFields[0].toUpperCase()}`;
//         //                 await askForNextMissingField(session, from);
//         //             } else {
//         //                 session.step = STATES.QUANTITY;
//         //                 await sendQuantitySelection(from, session.language);
//         //             }
//         //         } else if (buttonId === "no_change") {
//         //             session.step = STATES.QUANTITY;
//         //             await sendQuantitySelection(from, session.language);
//         //         }
//         //     }
//         //     return res.sendStatus(200);
//         // }

//         let latitude
//         let longitude
//         switch (session.step) {
//             case STATES.CHANGE_INFO:
//                 if (message.type === "interactive" && message.interactive?.type === "button_reply") {
//                     const buttonId = message.interactive.button_reply.id;
//                     if (buttonId === "yes_change") {
//                         session.step = STATES.NAME;
//                         await sendToWhatsApp(from, "Please provide your new name.");
//                     } else if (buttonId === "no_change") {
//                         session.step = STATES.QUANTITY;
//                         await sendQuantitySelection(from, session.language);
//                     }
//                 }
//                 break;
//             case STATES.WELCOME:
//                 if (message.type === "text") {
//                     const isRequestStart = await detectRequestStart(textRaw);
//                     if (isRequestStart) {
//                         session.inRequest = true;
//                         const extractedData = await extractInformationFromText(textRaw, session.language);
//                         // Initialize session data with extracted information
//                         session.data = {
//                             ...session.data, // Keep existing data including phone from WhatsApp
//                             ...extractedData,
//                             phone: extractedData.phone || session.data.phone // Only overwrite if new phone found
//                         };
//                         // Debugging: Log extracted data
//                         console.log("Extracted data:", extractedData);
//                         // Check for missing fields
//                         const missingFields = getMissingFields(session.data);
//                         if (missingFields.length === 0) {
//                             session.step = STATES.CONFIRMATION;
//                             await sendOrderSummary(from, session);
//                         } else {
//                             session.step = `ASK_${missingFields[0].toUpperCase()}`;
//                             await askForNextMissingField(session, from);
//                         }
//                     } else {
//                         const aiResponse = await getOpenAIResponse(textRaw, systemMessage, session.language);
//                         const reply = `${aiResponse}\n\n${getContinueMessage(session.language)}`;

//                         await sendInteractiveButtons(from, reply, [
//                             { type: "reply", reply: { id: "contact_us", title: getButtonTitle("contact_us", session.language) } },
//                             { type: "reply", reply: { id: "new_request", title: getButtonTitle("new_request", session.language) } }
//                         ]);
//                     }
//                 } else if (message.type === "interactive" && message.interactive?.type === "button_reply") {
//                     const buttonId = message.interactive.button_reply.id;

//                     if (buttonId === "contact_us") {
//                         await sendToWhatsApp(from, getContactMessage(session.language));
//                     } else if (buttonId === "new_request") {
//                         session.inRequest = true; // Set inRequest to true
//                         session.step = STATES.NAME;
//                         await sendToWhatsApp(from, getNameMessage(session.language));
//                     } else {
//                         await sendToWhatsApp(from, getInvalidOptionMessage(session.language));
//                     }
//                 }
//                 break;
//             case STATES.NAME:
//                 if (!textRaw) {
//                     await sendToWhatsApp(from, getNameMessage(session.language));
//                 } else {
//                     if (textRaw.trim().length > 0) {
//                         session.data.name = textRaw;
//                         session.step = STATES.EMAIL;
//                         await sendToWhatsApp(from, getEmailMessage(session.language));
//                     } else {
//                         const errorMsg = session.language === 'ar'
//                             ? "❌ يرجى تقديم اسم صحيح"
//                             : "❌ Please provide a valid full name";
//                         await sendToWhatsApp(from, errorMsg);
//                     }
//                 }
//                 break;
//             case STATES.PHONE_INPUT:
//                 if (!isValidPhone(textRaw)) {
//                     await sendToWhatsApp(from, getInvalidPhoneMessage(session.language));
//                     return res.sendStatus(200);
//                 }
//                 session.data.phone = formatPhoneNumber(textRaw);
//                 session.step = STATES.EMAIL;
//                 await sendToWhatsApp(from, getEmailMessage(session.language)); // Ask for email
//                 break;
//             case STATES.EMAIL:
//                 if (!isValidEmail(textRaw)) {
//                     await sendToWhatsApp(from, "❌ Please provide a valid email address (e.g., example@domain.com).");
//                     return res.sendStatus(200);
//                 }
//                 session.data.email = textRaw;
//                 session.step = STATES.LONGITUDE;
//                 await sendToWhatsApp(from, getLocationMessage(session.language)); // Ask for location
//                 break;
//             case STATES.LONGITUDE:
//                 if (message.location) {
//                     const { latitude: lat, longitude: lng } = message.location; // Use different variable names
//                     latitude = lat;
//                     longitude = lng;

//                     // Validate UAE location
//                     const UAE_BOUNDS = { minLat: 22.5, maxLat: 26.5, minLng: 51.6, maxLng: 56.5 };
//                     if (
//                         latitude >= UAE_BOUNDS.minLat &&
//                         latitude <= UAE_BOUNDS.maxLat &&
//                         longitude >= UAE_BOUNDS.minLng &&
//                         longitude <= UAE_BOUNDS.maxLng
//                     ) {
//                         // Reverse Geocode to get address
//                         const address = await getAddressFromCoordinates(latitude, longitude);
//                         if (address) {
//                             session.data.address = address;
//                             session.data.street = extractStreetName(address); // Store street name separately
//                         }


//                         session.data.latitude = latitude;
//                         session.data.longitude = longitude;
//                         session.data.address = address; // Auto-fill address
//                         session.step = STATES.CITY; // Proceed to city selection

//                         return await sendCitySelection(from, session.language); // ✅ Ask user to select city
//                     } else {
//                         await sendToWhatsApp(from, getInvalidUAERegionMessage(session.language));
//                     }
//                 } else {
//                     if (!session.locationPromptSent) {
//                         await sendInteractiveButtons(from, getLocationMessage(session.language), [
//                             {
//                                 type: "location_request",
//                                 title: getButtonTitle("send_site", session.language) // "Send Location" button
//                             }
//                         ]);
//                         session.locationPromptSent = true;
//                     }
//                 }
//                 break;


//             case STATES.CITY:
//                 if (message.interactive && message.interactive.type === "list_reply") {
//                     const citySelection = message.interactive.list_reply.id; // Get selected city ID
//                     const cityMap = {
//                         "abu_dhabi": { en: "Abu Dhabi", ar: "أبو ظبي" },
//                         "dubai": { en: "Dubai", ar: "دبي" },
//                         "sharjah": { en: "Sharjah", ar: "الشارقة" },
//                         "ajman": { en: "Ajman", ar: "عجمان" },
//                         "umm_al_quwain": { en: "Umm Al Quwain", ar: "أم القيوين" },
//                         "ras_al_khaimah": { en: "Ras Al Khaimah", ar: "رأس الخيمة" },
//                         "fujairah": { en: "Fujairah", ar: "الفجيرة" }
//                     };

//                     if (cityMap[citySelection]) {
//                         const selectedCity = cityMap[citySelection][session.language] || cityMap[citySelection].en;

//                         // Validate the city using the actual location if available
//                         if (session.data.latitude && session.data.longitude) {
//                             const validationResult = await validateCityAndLocation(session.data.latitude, session.data.longitude, selectedCity);
//                             if (!validationResult.isValid) {
//                                 const errorMessage = session.language === 'ar'
//                                     ? `❌ يبدو أن موقعك يقع في *${validationResult.actualCity}*. يرجى اختيار *${validationResult.actualCity}* بدلاً من *${selectedCity}*.`
//                                     : `❌ It seems your location is in *${validationResult.actualCity}*. Please select *${validationResult.actualCity}* instead of *${selectedCity}*.`;

//                                 await sendToWhatsApp(from, errorMessage);
//                                 await sendCitySelection(from, session.language);
//                                 return res.sendStatus(200);
//                             }
//                         }

//                         // Store the selected city
//                         session.data.city = selectedCity;
//                         session.step = STATES.STREET;

//                         const buildingPrompt = session.language === 'ar'
//                             ? `✅ لقد اخترت *${session.data.city}*.\n\n🏢 يرجى تقديم اسم الشارع.`
//                             : `✅ You selected *${session.data.city}*.\n\n🏢 Please provide the Street name.`;

//                         await sendToWhatsApp(from, buildingPrompt);
//                     } else {
//                         const invalidSelectionMessage = session.language === 'ar'
//                             ? "❌ اختيار غير صالح. يرجى الاختيار من الخيارات المتاحة."
//                             : "❌ Invalid selection. Please choose from the provided options.";

//                         await sendToWhatsApp(from, invalidSelectionMessage);
//                         await sendCitySelection(from, session.language);
//                     }
//                 }
//                 break;

//             case STATES.STREET:
//                 session.data.street = textRaw;
//                 session.step = STATES.BUILDING_NAME;
//                 await sendToWhatsApp(from, getBuildingMessage(session.language)); // Ask for building name
//                 break;
//             case STATES.BUILDING_NAME:
//                 if (!textRaw || textRaw.trim() === "") {
//                     await sendToWhatsApp(from, getBuildingMessage(session.language));
//                     return res.sendStatus(200);
//                 }
//                 session.data.building_name = textRaw;
//                 session.step = STATES.FLAT_NO;
//                 await sendToWhatsApp(from, getFlatMessage(session.language));
//                 break;

//             case STATES.FLAT_NO:
//                 console.log("🔹 Entered FLAT_NO state for user:", from);
//                 console.log("🔹 Current session.data:", session.data);

//                 if (!session.data || typeof session.data !== "object") {
//                     console.error("❌ Error: session.data is corrupted. Reinitializing.");
//                     session.data = {};
//                 }

//                 if (!textRaw || textRaw.trim() === "") {
//                     console.log("🔹 No flat number provided. Asking for flat number.");
//                     await sendToWhatsApp(from, getFlatMessage(session.language));
//                     return res.sendStatus(200);
//                 }

//                 console.log("🔹 Flat number provided:", textRaw);
//                 session.data.flat_no = textRaw;
//                 console.log("🔹 Updated session.data:", session.data);

//                 session.step = STATES.QUANTITY;

//                 console.log("🔹 Sending interactive quantity selection...");
//                 return await sendQuantitySelection(from, session.language);

//             case STATES.QUANTITY:
//                 console.log("🔹 Entered QUANTITY state for user:", from);
//                 console.log("🔹 textRaw:", textRaw);

//                 // ✅ Handle button selection (interactive message)
//                 if (message.interactive && message.interactive.type === "button_reply") {
//                     const selectedQuantity = message.interactive.button_reply.id;

//                     if (["10", "15", "20"].includes(selectedQuantity)) {
//                         console.log("🔹 User selected predefined quantity:", selectedQuantity);
//                         session.data.quantity = parseInt(selectedQuantity, 10);
//                     } else {
//                         console.log("🔹 Invalid button selection. Asking for valid quantity.");
//                         await sendQuantitySelection(from, session.language);
//                         return res.sendStatus(200);
//                     }
//                 }
//                 // ✅ Handle manual input
//                 else {
//                     if (!textRaw || textRaw.trim() === "") {
//                         console.log("🔹 No quantity provided. Asking for quantity.");
//                         await sendQuantitySelection(from, session.language);
//                         return res.sendStatus(200);
//                     }

//                     const quantity = parseInt(textRaw.trim(), 10);

//                     if (isNaN(quantity) || quantity < 10) {
//                         console.log("🔹 Invalid quantity or less than 10 provided. Asking for a valid quantity.");
//                         await sendToWhatsApp(from, getInvalidQuantityMessage(session.language));
//                         await sendQuantitySelection(from, session.language);
//                         return res.sendStatus(200);
//                     }

//                     console.log("🔹 Valid quantity provided:", quantity);
//                     session.data.quantity = quantity;
//                 }

//                 // ✅ Proceed to the next step
//                 const missingFields = getMissingFields(session.data);
//                 console.log("🔹 Missing fields after quantity:", missingFields);

//                 if (missingFields.length === 0) {
//                     session.step = STATES.CONFIRMATION;
//                     await sendOrderSummary(from, session);
//                 } else {
//                     session.step = `ASK_${missingFields[0].toUpperCase()}`;
//                     await askForNextMissingField(session, from);
//                 }
//                 break;




//             case "ASK_NAME":
//                 // If the user hasn't provided a name yet, ask for it
//                 if (!textRaw) {
//                     await sendToWhatsApp(from, "👤 Please provide your full name.");
//                     return res.sendStatus(200); // Exit and wait for the user's response
//                 }
//                 // If the name is provided, store it and proceed to the next step
//                 session.data.name = textRaw;
//                 // Check for other missing fields
//                 const missingFieldsName = getMissingFields(session.data);
//                 if (missingFieldsName.length === 0) {
//                     session.step = STATES.CONFIRMATION;
//                     await sendOrderSummary(from, session);
//                 } else {
//                     session.step = `ASK_${missingFieldsName[0].toUpperCase()}`;
//                     await askForNextMissingField(session, from);
//                 }
//                 break;
//             case "ASK_PHONE":
//                 // If the user hasn't provided a phone number yet, ask for it
//                 if (!textRaw) {
//                     await sendToWhatsApp(from, "📞 Please provide your phone number.");
//                     return res.sendStatus(200); // Exit and wait for the user's response
//                 }
//                 // Validate the phone number after the user provides it
//                 if (!isValidPhone(textRaw)) {
//                     await sendToWhatsApp(from, "❌ Invalid phone number, please enter a valid number.");
//                     return res.sendStatus(200); // Exit and wait for the user to correct their input
//                 }
//                 // If the phone number is valid, store it and proceed to the next step
//                 session.data.phone = formatPhoneNumber(textRaw);
//                 // Check for other missing fields
//                 const missingFieldsPhone = getMissingFields(session.data);
//                 if (missingFieldsPhone.length === 0) {
//                     session.step = STATES.CONFIRMATION;
//                     await sendOrderSummary(from, session);
//                 } else {
//                     session.step = `ASK_${missingFieldsPhone[0].toUpperCase()}`;
//                     await askForNextMissingField(session, from);
//                 }
//                 break;
//             case "ASK_EMAIL":
//                 // If the user hasn't provided an email yet, ask for it
//                 if (!textRaw) {
//                     await sendToWhatsApp(from, "✉️ Could you please share your email address? We'll use it for sending updates on your order.");
//                     return res.sendStatus(200); // Exit and wait for the user's response
//                 }
//                 // Validate the email after the user provides it
//                 if (!isValidEmail(textRaw)) {
//                     await sendToWhatsApp(from, "❌ Invalid email address, please enter a valid one (e.g., example@domain.com).");
//                     return res.sendStatus(200); // Exit and wait for the user to correct their input
//                 }
//                 // If the email is valid, store it and proceed to the next step
//                 session.data.email = textRaw;
//                 // Check for other missing fields
//                 const missingFieldsEmail = getMissingFields(session.data);
//                 if (missingFieldsEmail.length === 0) {
//                     session.step = STATES.CONFIRMATION;
//                     await sendOrderSummary(from, session);
//                 } else {
//                     session.step = `ASK_${missingFieldsEmail[0].toUpperCase()}`;
//                     await askForNextMissingField(session, from);
//                 }
//                 break;
//             case "ASK_LOCATION":
//                 // If the user hasn't shared their location yet, ask for it
//                 if (!message.location) {
//                     // Send a message with a button to share location
//                     await sendInteractiveButtons(from, getLocationMessage(session.language), [
//                         {
//                             type: "location_request",
//                             title: getButtonTitle("send_site", session.language) // "Send Location" button
//                         }
//                     ]);
//                     return res.sendStatus(200); // Exit and wait for the user's response
//                 }
//                 // If the location is shared, store it and proceed to the next step
//                 const { latitude: lat2, longitude: lng2 } = message.location; // Use different variable names
//                 latitude = lat2;
//                 longitude = lng2;                // Validate UAE location
//                 const UAE_BOUNDS = { minLat: 22.5, maxLat: 26.5, minLng: 51.6, maxLng: 56.5 };
//                 if (
//                     latitude >= UAE_BOUNDS.minLat &&
//                     latitude <= UAE_BOUNDS.maxLat &&
//                     longitude >= UAE_BOUNDS.minLng &&
//                     longitude <= UAE_BOUNDS.maxLng
//                 ) {
//                     const address = await getAddressFromCoordinates(latitude, longitude);
//                     if (address) {
//                         session.data.address = address;
//                         // session.data.street = extractStreetName(address); // Store street name separately
//                     }
//                     session.data.address = address; // Auto-fill address
//                     session.data.latitude = latitude;
//                     session.data.longitude = longitude;
//                     // Check for other missing fields
//                     const missingFields = getMissingFields(session.data);
//                     if (missingFields.length === 0) {
//                         session.step = STATES.CONFIRMATION;
//                         await sendOrderSummary(from, session);
//                     } else {
//                         console.log("hi" + session.data.latitude, "hii" + session.data.latitude)
//                         session.step = `ASK_${missingFields[0].toUpperCase()}`;
//                         await askForNextMissingField(session, from);
//                     }
//                 } else {
//                     await sendToWhatsApp(from, getInvalidUAERegionMessage(session.language));
//                 }
//                 break;
//             case "ASK_ADDRESS":
//                 // If the user hasn't provided an address yet, ask for it
//                 if (!textRaw) {
//                     await sendToWhatsApp(from, "🏠 Please provide your address.");
//                     return res.sendStatus(200); // Exit and wait for the user's response
//                 }
//                 // If the address is provided, store it and proceed to the next step
//                 session.data.address = textRaw;
//                 // Check for other missing fields
//                 const missingFieldsAddress = getMissingFields(session.data);
//                 if (missingFieldsAddress.length === 0) {
//                     session.step = STATES.CONFIRMATION;
//                     await sendOrderSummary(from, session);
//                 } else {
//                     session.step = `ASK_${missingFieldsAddress[0].toUpperCase()}`;
//                     await askForNextMissingField(session, from);
//                 }
//                 break;
//             case "ASK_CITY":
//                 if (!session) {
//                     console.error("❌ Session is not defined.");
//                     await sendToWhatsApp(from, "❌ An error occurred. Please try again.");
//                     return res.sendStatus(200);
//                 }
//                 if (session.data.city) {
//                     moveToNextStep(session, from);
//                     return res.sendStatus(200);
//                 }

//                 // Handle interactive button replies
//                 if (message.type === "interactive" && message.interactive?.type === "list_reply") {
//                     const citySelection = message.interactive.list_reply.id;
//                     const cityMap = {
//                         "abu_dhabi": { en: "Abu Dhabi", ar: "أبو ظبي" },
//                         "dubai": { en: "Dubai", ar: "دبي" },
//                         "sharjah": { en: "Sharjah", ar: "الشارقة" },
//                         "ajman": { en: "Ajman", ar: "عجمان" },
//                         "umm_al_quwain": { en: "Umm Al Quwain", ar: "أم القيوين" },
//                         "ras_al_khaimah": { en: "Ras Al Khaimah", ar: "رأس الخيمة" },
//                         "fujairah": { en: "Fujairah", ar: "الفجيرة" }
//                     };
//                     console.log(" before City set to:", session.data.city);

//                     if (cityMap[citySelection]) {
//                         session.data.city = cityMap[citySelection][session.language] || cityMap[citySelection].en;
//                         console.log("City set to:", session.data.city);

//                         // Validate against detected location (if available)
//                         if (session.data.latitude && session.data.longitude) {
//                             const validation = await validateCityAndLocation(
//                                 session.data.latitude,
//                                 session.data.longitude,
//                                 session.data.city
//                             );
//                             if (!validation.isValid) {
//                                 await sendToWhatsApp(
//                                     from,
//                                     `❌ Your selected city (${session.data.city}) does not match your detected location (${validation.actualCity}). Please select the correct city.`
//                                 );
//                                 return res.sendStatus(200);
//                             }
//                         }

//                         moveToNextStep(session, from);
//                     } else {
//                         await sendToWhatsApp(from, "❌ Invalid city. Please select a valid city from the options.");
//                         await sendCitySelection(from, session.language);
//                     }
//                 }
//                 // Handle text input
//                 else if (message.type === "text") {
//                     console.log("Checking user response for city:", textRaw);
//                     const selectedCity = extractCity(textRaw, session.language);
//                     if (selectedCity) {
//                         session.data.city = selectedCity;
//                         console.log("City set to:", selectedCity);

//                         // Validate against detected location (if available)
//                         if (session.data.latitude && session.data.longitude) {
//                             const validation = await validateCityAndLocation(
//                                 session.data.latitude,
//                                 session.data.longitude,
//                                 session.data.city
//                             );
//                             if (!validation.isValid) {
//                                 await sendToWhatsApp(
//                                     from,
//                                     `❌ Your selected city (${session.data.city}) does not match your detected location (${validation.actualCity}). Please select the correct city.`
//                                 );
//                                 return res.sendStatus(200);
//                             }
//                         }

//                         moveToNextStep(session, from);
//                     } else {
//                         await sendToWhatsApp(from, "❌ Invalid city. Please select a valid city from the options.");
//                         await sendCitySelection(from, session.language);
//                     }
//                 }
//                 // Handle invalid input
//                 else {
//                     await sendToWhatsApp(from, "❌ Invalid input. Please select a city from the options.");
//                     await sendCitySelection(from, session.language);
//                 }
//                 break;
//             case "ASK_STREET":
//                 // If the user hasn't provided a street name yet, ask for it
//                 if (!textRaw) {
//                     await sendToWhatsApp(from, "🛣️ Please provide your street name.");
//                     return res.sendStatus(200); // Exit and wait for the user's response
//                 }
//                 // If the street name is provided, store it and proceed to the next step
//                 session.data.street = textRaw;
//                 // Check for other missing fields
//                 const missingFieldsStreet = getMissingFields(session.data);
//                 if (missingFieldsStreet.length === 0) {
//                     session.step = STATES.CONFIRMATION;
//                     await sendOrderSummary(from, session);
//                 } else {
//                     session.step = `ASK_${missingFieldsStreet[0].toUpperCase()}`;
//                     await askForNextMissingField(session, from);
//                 }
//                 break;
//             case "ASK_BUILDING_NAME":
//                 // If the user hasn't provided a building name yet, ask for it
//                 if (!textRaw) {
//                     await sendToWhatsApp(from, "🏢 Please provide your building name.");
//                     return res.sendStatus(200); // Exit and wait for the user's response
//                 }
//                 // If the building name is provided, store it and proceed to the next step
//                 session.data.building_name = textRaw;
//                 // Check for other missing fields
//                 const missingFieldsBuilding = getMissingFields(session.data);
//                 if (missingFieldsBuilding.length === 0) {
//                     session.step = STATES.CONFIRMATION;
//                     await sendOrderSummary(from, session);
//                 } else {
//                     session.step = `ASK_${missingFieldsBuilding[0].toUpperCase()}`;
//                     await askForNextMissingField(session, from);
//                 }
//                 break;
//             case "ASK_FLAT_NO":
//                 // If the user hasn't provided a flat number yet, ask for it
//                 if (!textRaw) {
//                     await sendToWhatsApp(from, "🏠 Please provide your flat number.");
//                     return res.sendStatus(200); // Exit and wait for the user's response
//                 }
//                 // If the flat number is provided, store it and proceed to the next step
//                 session.data.flat_no = textRaw;
//                 // Check for other missing fields
//                 const missingFieldsFlat = getMissingFields(session.data);
//                 if (missingFieldsFlat.length === 0) {
//                     session.step = STATES.CONFIRMATION;
//                     await sendOrderSummary(from, session);
//                 } else {
//                     session.step = `ASK_${missingFieldsFlat[0].toUpperCase()}`;
//                     await askForNextMissingField(session, from);
//                 }
//                 break;
//             case "ASK_QUANTITY":
//                 console.log("🔹 Entered QUANTITY state for user:", from);
//                 console.log("🔹 textRaw:", textRaw);

//                 // ✅ Handle button selection (interactive message)
//                 if (message.interactive && message.interactive.type === "button_reply") {
//                     const selectedQuantity = message.interactive.button_reply.id;

//                     if (["10", "15", "20"].includes(selectedQuantity)) {
//                         console.log("🔹 User selected predefined quantity:", selectedQuantity);
//                         session.data.quantity = parseInt(selectedQuantity, 10);
//                     } else {
//                         console.log("🔹 Invalid button selection. Asking for valid quantity.");
//                         await sendQuantitySelection(from, session.language);
//                         return res.sendStatus(200);
//                     }
//                 }
//                 // ✅ Handle manual input
//                 else {
//                     if (!textRaw || textRaw.trim() === "") {
//                         console.log("🔹 No quantity provided. Asking for quantity.");
//                         await sendQuantitySelection(from, session.language);
//                         return res.sendStatus(200);
//                     }

//                     const quantity = parseInt(textRaw.trim(), 10);

//                     if (isNaN(quantity) || quantity < 10) {
//                         console.log("🔹 Invalid quantity or less than 10 provided. Asking for a valid quantity.");
//                         await sendToWhatsApp(from, getInvalidQuantityMessage(session.language));
//                         await sendQuantitySelection(from, session.language);
//                         return res.sendStatus(200);
//                     }

//                     console.log("🔹 Valid quantity provided:", quantity);
//                     session.data.quantity = quantity;
//                 }

//                 // ✅ Proceed to the next step
//                 const missingFields2 = getMissingFields(session.data);
//                 console.log("🔹 Missing fields after quantity:", missingFields2);

//                 if (missingFields2.length === 0) {
//                     session.step = STATES.CONFIRMATION;
//                     await sendOrderSummary(from, session);
//                 } else {
//                     session.step = `ASK_${missingFields2[0].toUpperCase()}`;
//                     await askForNextMissingField(session, from);
//                 }
//                 break;
//             case STATES.CONFIRMATION:
//                 if (message.type === "interactive" && message.interactive.type === "button_reply") {
//                     const buttonId = message.interactive.button_reply.id; // Extract button ID
//                     if (buttonId === "yes_confirm") {
//                         const requestData = {
//                             user_name: session.data.name,
//                             email: session.data.email,
//                             phone_number: session.data.phone,
//                             city: session.data.city,
//                             address: session.data.address,
//                             street: session.data.street,
//                             building_name: session.data.building_name,
//                             flat_no: session.data.flat_no,
//                             latitude: session.data.latitude,
//                             longitude: session.data.longitude,
//                             quantity: session.data.quantity
//                         };
//                         console.log('Request Data:', requestData);
//                         try {
//                             const response = await axios.post('https://dev.lootahbiofuels.com/api/v1/whatsapp_request', requestData, {
//                                 headers: { 'Content-Type': 'application/json' },
//                                 timeout: 5000
//                             });

//                             if (response.status === 200) {
//                                 console.log('API Response:', response.data);
//                                 await sendToWhatsApp(from, "✅ Your request has been successfully submitted! We will contact you soon.");
//                             } else {
//                                 console.error(`❌ API returned unexpected status code: ${response.status}`);
//                                 await sendToWhatsApp(from, "❌ An error occurred. Please try again later.");
//                             }
//                         } catch (error) {
//                             if (error.response) {
//                                 console.error('API Error Response:', error.response.data);
//                                 console.error('API Status Code:', error.response.status);
//                                 // Explicitly check for status code 422
//                                 if (error.response.status === 422) {
//                                     await sendToWhatsApp(from, "❌ Your phone number must be Emirati to proceed with this request.");
//                                 } else {
//                                     await sendToWhatsApp(from, "❌ An error occurred while submitting your request. Please try again later.");
//                                 }
//                             } else {
//                                 console.error('Network or request error:', error.message);
//                                 await sendToWhatsApp(from, "❌ Unable to reach the server. Please check your internet connection and try again.");
//                             }
//                         }
//                         delete userSessions[from];

//                     } else if (buttonId === "no_correct") {
//                         session.step = STATES.MODIFY;
//                         await sendToWhatsApp(from, "Which information would you like to modify? Please reply with the corresponding number:\n\n1. Location\n2. Street\n3. Building Name\n4. Flat No\n5. Quantity");
//                     }
//                 }
//                 break;

//             case STATES.MODIFY:
//                 // Convert any Arabic digits in the text to English digits
//                 const normalizedText = convertArabicNumbers(text);
//                 const fieldToModify = parseInt(normalizedText);
//                 if (isNaN(fieldToModify) || fieldToModify < 1 || fieldToModify > 6) {
//                     await sendToWhatsApp(from, "❌ Invalid option. Please choose a number between 1 and 11.");
//                     return res.sendStatus(200);
//                 }

//                 const fieldMap = {
//                     1: "location",
//                     2: "street",
//                     3: "building_name",
//                     4: "flat_no",
//                     5: "quantity"
//                 };

//                 const selectedField = fieldMap[fieldToModify];

//                 if (selectedField === "location") {
//                     session.step = "MODIFY_LOCATION";
//                     await sendToWhatsApp(from, getLocationMessage(session.language));
//                 }
//                 // else if (selectedField === "city") {
//                 //     session.step = "MODIFY_CITY_SELECTION";
//                 //     return await sendCitySelection(from, session.language);
//                 // }
//                 else if (selectedField === "quantity") {
//                     session.step = "MODIFY_QUANTITY";
//                     await sendQuantitySelection(from, session.language);
//                 }
//                 else {
//                     session.modifyField = selectedField;
//                     session.step = `MODIFY_${selectedField.toUpperCase()}`;
//                     await sendToWhatsApp(from, `🔹 Please provide the new value for ${selectedField.replace(/_/g, " ")}.`);
//                 }
//                 break;
//             case "MODIFY_LOCATION":
//                 // If the user hasn't shared their location yet, ask for it
//                 if (!message.location) {
//                     // Send a message with a button to share location
//                     await sendInteractiveButtons(from, getLocationMessage(session.language), [
//                         {
//                             type: "location_request",
//                             title: getButtonTitle("send_site", session.language) // "Send Location" button
//                         }
//                     ]);
//                     return res.sendStatus(200); // Exit and wait for the user's response
//                 }
//                 // If the location is shared, store it and proceed to the next step
//                 const { latitude: lat3, longitude: lng3 } = message.location; // Use different variable names
//                 latitude = lat3;
//                 longitude = lng3;
//                 const UAE_BOUNDS2 = { minLat: 22.0, maxLat: 27.0, minLng: 51.0, maxLng: 57.0 };

//                 if (
//                     latitude >= UAE_BOUNDS2.minLat &&
//                     latitude <= UAE_BOUNDS2.maxLat &&
//                     longitude >= UAE_BOUNDS2.minLng &&
//                     longitude <= UAE_BOUNDS2.maxLng
//                 ) {
//                     const address = await getAddressFromCoordinates(latitude, longitude);
//                     if (address) {
//                         session.data.address = address;
//                     }
//                     session.data.latitude = latitude;
//                     session.data.longitude = longitude;

//                     session.step = "MODIFY_CITY_SELECTION";
//                     return await sendCitySelection(from, session.language);

//                 } else {
//                     await sendToWhatsApp(from, getInvalidUAERegionMessage(session.language));
//                 }
//                 break;
//             case "MODIFY_CITY_SELECTION":
//                 if (!session) {
//                     console.error("❌ Session is not defined.");
//                     await sendToWhatsApp(from, "❌ An error occurred. Please try again.");
//                     return res.sendStatus(200);
//                 }

//                 // Handle interactive button replies
//                 if (message.type === "interactive" && message.interactive?.type === "list_reply") {
//                     const citySelection = message.interactive.list_reply.id;
//                     const cityMap = {
//                         "abu_dhabi": { en: "Abu Dhabi", ar: "أبو ظبي" },
//                         "dubai": { en: "Dubai", ar: "دبي" },
//                         "sharjah": { en: "Sharjah", ar: "الشارقة" },
//                         "ajman": { en: "Ajman", ar: "عجمان" },
//                         "umm_al_quwain": { en: "Umm Al Quwain", ar: "أم القيوين" },
//                         "ras_al_khaimah": { en: "Ras Al Khaimah", ar: "رأس الخيمة" },
//                         "fujairah": { en: "Fujairah", ar: "الفجيرة" }
//                     };
//                     console.log(" before City set to:", session.data.city);

//                     if (cityMap[citySelection]) {
//                         session.data.city = cityMap[citySelection][session.language] || cityMap[citySelection].en;
//                         console.log("City set to:", session.data.city);

//                         // Validate against detected location (if available)
//                         if (session.data.latitude && session.data.longitude) {
//                             const validation = await validateCityAndLocation(
//                                 session.data.latitude,
//                                 session.data.longitude,
//                                 session.data.city
//                             );
//                             if (!validation.isValid) {
//                                 await sendToWhatsApp(
//                                     from,
//                                     `❌ Your selected city (${session.data.city}) does not match your detected location (${validation.actualCity}). Please select the correct city.`
//                                 );
//                                 return res.sendStatus(200);
//                             }
//                         }

//                         moveToNextStep(session, from);
//                     } else {
//                         await sendToWhatsApp(from, "❌ Invalid city. Please select a valid city from the options.");
//                         await sendCitySelection(from, session.language);
//                     }
//                 }
//                 // Handle text input
//                 else if (message.type === "text") {
//                     console.log("Checking user response for city:", textRaw);
//                     const selectedCity = extractCity(textRaw, session.language);
//                     if (selectedCity) {
//                         session.data.city = selectedCity;
//                         console.log("City set to:", selectedCity);

//                         // Validate against detected location (if available)
//                         if (session.data.latitude && session.data.longitude) {
//                             const validation = await validateCityAndLocation(
//                                 session.data.latitude,
//                                 session.data.longitude,
//                                 session.data.city,
//                                 session.step = STATES.CONFIRMATION,
//                                 await sendUpdatedSummary(from, session)
//                             );
//                             if (!validation.isValid) {
//                                 await sendToWhatsApp(
//                                     from,
//                                     `❌ Your selected city (${session.data.city}) does not match your detected location (${validation.actualCity}). Please select the correct city.`
//                                 );
//                                 return res.sendStatus(200);
//                             }
//                         }

//                         moveToNextStep(session, from);
//                     } else {
//                         await sendToWhatsApp(from, "❌ Invalid city. Please select a valid city from the options.");
//                         await sendCitySelection(from, session.language);
//                     }
//                 }
//                 // Handle invalid input
//                 else {
//                     await sendToWhatsApp(from, "❌ Invalid input. Please select a city from the options.");
//                     await sendCitySelection(from, session.language);
//                 }
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

//             case "MODIFY_QUANTITY":
//                 console.log("🔹 Entered MODIFY_QUANTITY state for user:", from);
//                 console.log("🔹 User input:", textRaw);

//                 if (message.interactive && message.interactive.type === "button_reply") {
//                     const selectedQuantity = message.interactive.button_reply.id;

//                     if (["10", "15", "20"].includes(selectedQuantity)) {
//                         console.log("✅ User selected predefined quantity:", selectedQuantity);
//                         session.data.quantity = parseInt(selectedQuantity, 10);
//                     } else {
//                         console.log("❌ Invalid quantity selection. Asking again.");
//                         await sendQuantitySelection(from, session.language);
//                         return res.sendStatus(200);
//                     }
//                 } else {
//                     if (!textRaw || textRaw.trim() === "") {
//                         console.log("❌ No quantity provided. Asking again.");
//                         await sendQuantitySelection(from, session.language);
//                         return res.sendStatus(200);
//                     }

//                     const quantity = parseInt(textRaw.trim(), 10);

//                     if (isNaN(quantity) || quantity < 10) {
//                         console.log("❌ Invalid quantity or less than 10 provided.");
//                         await sendToWhatsApp(from, getInvalidQuantityMessage(session.language));
//                         await sendQuantitySelection(from, session.language);
//                         return res.sendStatus(200);
//                     }

//                     console.log("✅ Valid quantity received:", quantity);
//                     session.data.quantity = quantity;
//                 }

//                 // Move to confirmation step and send summary
//                 session.step = STATES.CONFIRMATION;
//                 console.log("📦 Sending updated summary...");
//                 await sendUpdatedSummary(from, session);
//                 break;
//         }
//         res.sendStatus(200);

//     } catch (error) {
//         console.error('❌ Error:', error.response?.data || error.message || error);
//         res.sendStatus(500);
//     }
// })