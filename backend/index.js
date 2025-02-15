import dotenv from 'dotenv';
import express from 'express';
import axios from 'axios';
import bodyParser from 'body-parser';
import cors from 'cors';
import langdetect from 'langdetect';


dotenv.config();

if (!process.env.OPENAI_API_KEY || !process.env.WHATSAPP_API_URL || !process.env.WHATSAPP_ACCESS_TOKEN) {
    console.error('❌ Missing required environment variables');
    process.exit(1);
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

const getOpenAIResponse = async (userMessage, context = "", language = "en") => {
    try {
        const systemMessage = `
            You are a friendly and intelligent WhatsApp assistant for Lootah Biofuels. 
            Your goal is to assist users in completing their orders and answering their questions.
            Always respond concisely, use emojis sparingly, and maintain a helpful attitude.
            Generate the response in the user's language: ${language}.
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
            max_tokens: 350,
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

const sendCitySelection = async (to, language) => {
    try {
        const cityPrompt = language === 'ar'
            ? 'يرجى اختيار المدينة من الخيارات المتاحة:'
            : 'Please select your city from the available options:';

        const cityButtons = [
            { type: "reply", reply: { id: "abu_dhabi", title: language === 'ar' ? 'أبو ظبي' : 'Abu Dhabi' } },
            { type: "reply", reply: { id: "dubai", title: language === 'ar' ? 'دبي' : 'Dubai' } },
            { type: "reply", reply: { id: "sharjah", title: language === 'ar' ? 'الشارقة' : 'Sharjah' } }
        ];

        const payload = {
            messaging_product: "whatsapp",
            recipient_type: "individual",
            to: to,
            type: "interactive",
            interactive: {
                type: "button",
                body: { text: cityPrompt },
                action: { buttons: cityButtons }
            }
        };

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
//


const sendOrderSummary = async (to, session) => {
    try {
        const summaryText = await getOpenAIResponse(
            `Generate an order summary in a user-friendly way, including the following details:
            Name: ${session.data.name},
            Phone: ${session.data.phone},
            Email: ${session.data.email},
            Address: ${session.data.address},
            City: ${session.data.city},
            Street: ${session.data.street},
            Building Name: ${session.data.building_name},
            Flat Number: ${session.data.flat_no},
            Location: (Latitude: ${session.data.latitude}, Longitude: ${session.data.longitude}),
            Quantity: ${session.data.quantity}.
            Also, ask the user to confirm if the details are correct.`,
            session.language
        );

        await axios.post(process.env.WHATSAPP_API_URL, {
            messaging_product: "whatsapp",
            recipient_type: "individual",
            to: to,
            type: "interactive",
            interactive: {
                type: "button",
                body: {
                    text: summaryText
                },
                action: {
                    buttons: [
                        { type: "reply", reply: { id: "yes_confirm", title: session.language === 'ar' ? '✅ نعم' : '✅ Yes' } },
                        { type: "reply", reply: { id: "no_correct", title: session.language === 'ar' ? '❌ لا' : '❌ No' } }
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

// const sendInteractiveButtons = async (to, message, buttons) => {
//     try {
//         const payload = {
//             messaging_product: "whatsapp",
//             recipient_type: "individual",
//             to: to,
//             type: "interactive",
//             interactive: {
//                 type: "button",
//                 body: { text: message },
//                 action: { buttons }
//             }
//         };

//         console.log("Sending Interactive Buttons Payload:", JSON.stringify(payload, null, 2));

//         const response = await axios.post(process.env.WHATSAPP_API_URL, payload, {
//             headers: {
//                 "Authorization": `Bearer ${process.env.WHATSAPP_ACCESS_TOKEN}`,
//                 "Content-Type": "application/json"
//             }
//         });

//         console.log("Interactive Buttons Response:", response.data);
//     } catch (error) {
//         console.error("❌ Failed to send interactive buttons:", error.response?.data || error.message);
//     }
// };
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

        console.log("Sending Interactive Buttons Payload:", JSON.stringify(payload, null, 2));

        const response = await axios.post(process.env.WHATSAPP_API_URL, payload, {
            headers: {
                "Authorization": `Bearer ${process.env.WHATSAPP_ACCESS_TOKEN}`,
                "Content-Type": "application/json"
            }
        });

        console.log("Interactive Buttons Response:", response.data);
    } catch (error) {
        console.error("❌ Failed to send interactive buttons:", error.response?.data || error.message);
    }
};

const sendLocationRequest = async (to, message) => {
    await axios.post(process.env.WHATSAPP_API_URL, {
        messaging_product: "whatsapp",
        recipient_type: "individual",
        to: to,
        type: "text",
        text: {
            body: message + "\n\n📍 *Click here to send your location:*",
            preview_url: false
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

    const aiResponse = await getOpenAIResponse(prompt); // Pass prompt, not textRaw

    try {
        const aiExtractedData = JSON.parse(aiResponse);
        return { ...aiExtractedData, ...extractedData };
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

const askForNextMissingField = async (session, from) => {
    const missingFields = getMissingFields(session.data);

    if (missingFields.length === 0) {
        session.step = STATES.CONFIRMATION;
        return await sendOrderSummary(from, session);
    }

    const nextMissingField = missingFields[0];

    // Special handling for city
    if (nextMissingField === 'city') {
        session.step = STATES.CITY_SELECTION;
        return await sendCitySelection(from);
    }

    session.step = `ASK_${nextMissingField.toUpperCase()}`;

    const fieldPrompt = await generateMissingFieldPrompt(nextMissingField);
    if (fieldPrompt) {
        await sendToWhatsApp(from, fieldPrompt);
    } else {
        console.error(`No prompt found for field: ${nextMissingField}`);
        await sendToWhatsApp(from, `Please provide your ${nextMissingField}. 😊`);
    }
};
async function isQuestionOrRequest(text) {
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
    
    2️⃣ **"question"** → If the user is **asking for information** about the company, services, or anything general. Examples:
       - "What services do you provide?"
       - "How does your oil collection work?"
       - "Where are you located?"
       - "What is the cost of biodiesel?"
    
    3️⃣ **"greeting"** → If the user is just saying hello. Examples:
       - "Hi"
       - "Hello"
       - "Good morning"
    
    4️⃣ **"other"** → If the input does not fit the above categories.
    
    Respond ONLY with one of these words: "request", "question", "greeting", or "other".

    **User Input:** "${text}"
`;

    const aiResponse = await getOpenAIResponse(prompt);
    const response = aiResponse.trim().toLowerCase();

    return response;
}


const generateWelcomeMessage = async () => {
    const systemPrompt = `
        You are a friendly WhatsApp assistant for Lootah Biofuels. 
        Generate a concise and engaging welcome message that:
        - Introduces the company in a warm and professional tone.
        - Encourages users to ask questions or start a new request.
        - Uses emojis sparingly to make the message lively but not overwhelming.
    `;

    return await getOpenAIResponse("Generate a welcome message.", systemPrompt);
};



const generateMissingFieldPrompt = async (field) => {
    const fieldPromptMap = {
        name: "Ask the user to provide their full name in a friendly and casual tone. Example: 'May I have your full name, please? 😊'",
        phone: "Ask the user for their phone number in a casual and friendly way. Example: 'Could you share your phone number with us? 📱'",
        email: "Ask the user for their email address politely. Example: 'What’s your email address? We’ll use it to keep you updated! ✉️'",
        address: "Ask the user for their full address in a simple and friendly way. Example: 'Could you provide your complete address? 🏠'",
        street: "Ask the user for their street name in a cheerful tone. Example: 'What’s the name of your street? 🛣️'",
        building_name: "Ask the user for their building name in a friendly way. Example: 'Could you tell us the name of your building? 🏢'",
        flat_no: "Ask the user for their flat number politely. Example: 'What’s your flat number? 🏠'",
        latitude: "Ask the user to share their live location via WhatsApp. Example: 'Please share your live location to help us serve you better! 📍'",
        longitude: "Ask the user to share their live location via WhatsApp. Example: 'Please share your live location to help us serve you better! 📍'",
        quantity: "Ask the user how many liters they want in a friendly tone. Example: 'How many liters would you like to order? ⛽'",
        // Add city with null to prevent text prompt
        city: null
    };

    if (!fieldPromptMap[field]) return null;

    const prompt = `
        The user is filling out a form. They need to provide their "${field}".
        Ensure your response is **ONLY** a polite request for the missing field, without any unrelated information.
        Do **not** mention AI, email, or apologies.
        Do **not** generate anything except the request prompt.
        
        ${fieldPromptMap[field]}
    `;

    return await getOpenAIResponse(prompt, ``);
};
const analyzeInput = async (input, expectedField) => {
    const prompt = `
        You are a helpful assistant for Lootah Biofuels. Your task is to analyze the user's input and determine if it matches the expected field.

        - The user was asked to provide their "${expectedField}".
        - They responded with: "${input}".

        Rules:
        1. If the input matches the expected field, return "valid".
        2. If the input does not match the expected field but matches another valid field (e.g., phone number, email, address, etc.), return "alternative:<field_name>".
        3. If the input is completely invalid, return "invalid:<correction_message>".

        Examples:
        - If the expected field is "name" and the user provides "John Doe", return "valid".
        - If the expected field is "phone number" and the user provides "john@example.com", return "alternative:email".
        - If the expected field is "email" and the user provides "123", return "invalid:Please provide a valid email address. 😊".

        Important:
        - Do not respond as if you are the user. Your task is to analyze the input and provide a response based on the rules above.
    `;

    const response = await getOpenAIResponse(prompt, ``);
    console.log(`Analyze Input Response: ${response}`); // Debugging
    return response;
};
const shouldEndRequest = (text) => {
    const endPhrases = [
        "end the request",
        "cancel the request",
        "i do not want the request",
        "close",
        "end",
        "stop",
        "cancel",
        "i want to end the request",
        "i want to cancel the request"
    ];

    return endPhrases.some(phrase => text.includes(phrase));
};
function getButtonTitle(buttonId, language) {
    const buttons = {
        contact_us: { en: '📞 Contact Us', ar: '📞 اتصل بنا' },
        new_request: { en: '📝 New Request', ar: '📝 طلب جديد' }
    };
    return buttons[buttonId][language === 'ar' ? 'ar' : 'en'];
}
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
    return language === 'ar' ? '❌ خيار غير صالح، يرجى اختيار مدينة من الخيارات المتاحة.' : '❌ Invalid selection, please choose from the provided options.';
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
    if (language === 'ar') {
        return '🚗 لفضلك شارك موقعك الحالي عبر الزر المخصص للموقع. 😊';
    } else {
        return '🚗 Please share your current location using the location button. 😊';
    }
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
const sendLocationButton = async (to, language) => {
    try {
        const locationPrompt = language === 'ar'
            ? 'يرجى مشاركة موقعك الحالي باستخدام زر الموقع.'
            : 'Please share your current location using the location button.';

        const locationButton = [
            { type: "reply", reply: { id: "share_location", title: language === 'ar' ? 'مشاركة الموقع' : 'Share Location' } }
        ];

        const payload = {
            messaging_product: "whatsapp",
            recipient_type: "individual",
            to: to,
            type: "interactive",
            interactive: {
                type: "button",
                body: { text: locationPrompt },
                action: { buttons: locationButton }
            }
        };

        const response = await axios.post(process.env.WHATSAPP_API_URL, payload, {
            headers: {
                Authorization: `Bearer ${process.env.WHATSAPP_ACCESS_TOKEN}`,
                "Content-Type": "application/json"
            }
        });

        console.log("Location Button Response:", response.data);
    } catch (error) {
        console.error("Error sending location button:", error.response?.data || error.message);
    }
};



//


app.post('/webhook', async (req, res) => {
    try {
        console.log('Incoming Webhook Data:', JSON.stringify(req.body, null, 2));

        const entry = req.body.entry?.[0];
        const changes = entry?.changes?.[0];
        const value = changes?.value;
        const messages = value?.messages;

        if (!messages || !Array.isArray(messages) || messages.length === 0) {
            console.log('⚠️ No messages received, returning early.');
            return res.sendStatus(200);
        }

        const message = messages[0];

        if (!message?.from) {
            console.log("⚠️ No sender information found.");
            return res.sendStatus(400);
        }

        const from = message.from;
        const textRaw = message.text?.body || "";
        const text = textRaw.toLowerCase().trim();

        // Detect the language safely
        let detectedLanguage = "en"; // Default to English
        try {
            const detected = langdetect.detect(textRaw);
            if (Array.isArray(detected) && detected.length > 0) {
                detectedLanguage = detected[0].lang;
            }
        } catch (error) {
            console.log("⚠️ Language detection failed. Using default 'en'.", error);
        }

        console.log(`📩 New message from ${from}: ${text} (Language: ${detectedLanguage})`);

        // Initialize user session if it doesn't exist
        if (!userSessions[from]) {
            userSessions[from] = { step: STATES.WELCOME, data: {}, language: detectedLanguage };

            // Get dynamic welcome message from OpenAI
            const welcomeMessage = await getOpenAIResponse("Generate a WhatsApp welcome message for Lootah Biofuels.", "", detectedLanguage);

            // Send welcome message with buttons
            await sendInteractiveButtons(from, welcomeMessage, [
                { type: "reply", reply: { id: "contact_us", title: getButtonTitle("contact_us", detectedLanguage) } },
                { type: "reply", reply: { id: "new_request", title: getButtonTitle("new_request", detectedLanguage) } }
            ]);
            return res.sendStatus(200);
        }

        const session = userSessions[from];

        // Handle messages based on the current state
        switch (session.step) {
            case STATES.WELCOME:
                if (message.type === "text") {
                    const aiResponse = await getOpenAIResponse(textRaw, systemMessage, session.language);
                    const reply = `${aiResponse}\n\n${getContinueMessage(session.language)}`;

                    await sendInteractiveButtons(from, reply, [
                        { type: "reply", reply: { id: "contact_us", title: getButtonTitle("contact_us", session.language) } },
                        { type: "reply", reply: { id: "new_request", title: getButtonTitle("new_request", session.language) } }
                    ]);
                } else if (message.type === "interactive" && message.interactive?.type === "button_reply") {
                    const buttonId = message.interactive.button_reply.id;

                    if (buttonId === "contact_us") {
                        await sendToWhatsApp(from, getContactMessage(session.language));
                    } else if (buttonId === "new_request") {
                        session.step = STATES.NAME;
                        await sendToWhatsApp(from, getNameMessage(session.language));
                    } else {
                        await sendToWhatsApp(from, getInvalidOptionMessage(session.language));
                    }
                }
                break;

            case STATES.NAME:
                if (!textRaw) {
                    await sendToWhatsApp(from, getNameMessage(session.language)); // Ask for name again
                } else {
                    session.data.name = textRaw;

                    // Automatically detect the user's phone number
                    session.data.phone = from;

                    session.step = STATES.EMAIL; // Move to the email step
                    await sendToWhatsApp(from, getEmailMessage(session.language)); // Ask for email
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
                    await sendToWhatsApp(from, getInvalidEmailMessage(session.language)); // Ensure email validation message supports Arabic
                    return res.sendStatus(200);
                }
                session.data.email = textRaw;
                session.step = STATES.LONGITUDE;
                await sendToWhatsApp(from, getLocationMessage(session.language)); // Ask for location
                break;

                case STATES.LONGITUDE:
                    if (message.type === "interactive" && message.interactive?.type === "button_reply") {
                        const buttonId = message.interactive.button_reply.id;
                
                        if (buttonId === "share_location") {
                            // Send instructions to share location via WhatsApp
                            await sendToWhatsApp(from, getLocationMessage(session.language));
                        }
                    } else if (message.location) {
                        const { latitude, longitude } = message.location;
                
                        // Validate UAE location
                        const UAE_BOUNDS = { minLat: 22.5, maxLat: 26.5, minLng: 51.6, maxLng: 56.5 };
                        if (
                            latitude >= UAE_BOUNDS.minLat &&
                            latitude <= UAE_BOUNDS.maxLat &&
                            longitude >= UAE_BOUNDS.minLng &&
                            longitude <= UAE_BOUNDS.maxLng
                        ) {
                            session.data.latitude = latitude;
                            session.data.longitude = longitude;
                            session.step = STATES.ADDRESS;
                            await sendToWhatsApp(from, getAddressMessage(session.language));
                        } else {
                            await sendToWhatsApp(from, getInvalidUAERegionMessage(session.language));
                        }
                    } else {
                        if (!session.locationPromptSent) {
                            await sendLocationButton(from, session.language); // Send location button
                            session.locationPromptSent = true;
                        }
                    }
                    break;
                


            //


            case STATES.ADDRESS:
                session.data.address = textRaw;
                session.step = STATES.CITY_SELECTION;
                return await sendCitySelection(from, session.language); // ✅ Ask user to select city

            case STATES.CITY_SELECTION:
                if (message.interactive && message.interactive.button_reply) {
                    const citySelection = message.interactive.button_reply.id;

                    const cityMap = {
                        "abu_dhabi": { en: "Abu Dhabi", ar: "أبو ظبي" },
                        "dubai": { en: "Dubai", ar: "دبي" },
                        "sharjah": { en: "Sharjah", ar: "الشارقة" }
                    };

                    if (cityMap[citySelection]) {
                        session.data.city = cityMap[citySelection][session.language] || cityMap[citySelection].en;
                        session.step = STATES.STREET;

                        const streetPrompt = session.language === 'ar'
                            ? `✅ لقد اخترت *${session.data.city}*.\n\n🏠 يرجى تقديم اسم الشارع.`
                            : `✅ You selected *${session.data.city}*.\n\n🏠 Please provide the street name.`;

                        await sendToWhatsApp(from, streetPrompt);
                    } else {
                        const invalidSelectionMessage = session.language === 'ar'
                            ? "❌ اختيار غير صالح. يرجى الاختيار من الخيارات المتاحة."
                            : "❌ Invalid selection. Please choose from the provided options.";

                        await sendToWhatsApp(from, invalidSelectionMessage);
                        await sendCitySelection(from, session.language);
                    }
                } else {
                    const selectCityMessage = session.language === 'ar'
                        ? "❌ يرجى اختيار مدينة من الخيارات المتاحة."
                        : "❌ Please select a city from the provided options.";

                    await sendToWhatsApp(from, selectCityMessage);
                    await sendCitySelection(from, session.language);
                }
                break;

            case STATES.STREET:
                session.data.street = textRaw;
                session.step = STATES.BUILDING_NAME;
                await sendToWhatsApp(from, getBuildingMessage(session.language)); // Ask for building name
                break;

            case STATES.BUILDING_NAME:
                session.data.building_name = textRaw;
                session.step = STATES.FLAT_NO;
                await sendToWhatsApp(from, getFlatMessage(session.language)); // Ask for flat number
                break;

            case STATES.FLAT_NO:
                session.data.flat_no = textRaw;
                session.step = STATES.QUANTITY;

                await sendToWhatsApp(from, getQuantityMessage(session.language)); // Ask for quantity
                break;

            case STATES.QUANTITY:
                if (session.awaitingQuantityInput) {
                    if (textRaw.trim() === "" || isNaN(textRaw)) {
                        await sendToWhatsApp(from, getInvalidQuantityMessage(session.language)); // ❌ Invalid quantity message
                        return res.sendStatus(200);
                    }

                    session.data.quantity = textRaw;
                    session.awaitingQuantityInput = false;
                    session.step = STATES.CONFIRMATION;
                    sendOrderSummary(from, session);
                } else {
                    session.awaitingQuantityInput = true;
                    await sendToWhatsApp(from, getQuantityMessage(session.language)); // ✅ Ask for quantity dynamically
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

//         // 1. Check if the user wants to end the request
//         if (shouldEndRequest(text)) {
//             delete userSessions[from]; // Reset the session
//             const welcomeMessage = await generateWelcomeMessage();
//             await sendInteractiveButtons(from, welcomeMessage, [
//                 { type: "reply", reply: { id: "contact_us", title: "📞 Contact Us" } },
//                 { type: "reply", reply: { id: "new_request", title: "📝 New Request" } }
//             ]);
//             return res.sendStatus(200);
//         }

//         // 2. Initialize user session if it doesn't exist
//         if (!userSessions[from]) {
//             userSessions[from] = {
//                 step: STATES.WELCOME,
//                 data: { phone: formatPhoneNumber(from) },
//             };

//             const welcomeMessage = await generateWelcomeMessage();
//             await sendInteractiveButtons(from, welcomeMessage, [
//                 { type: "reply", reply: { id: "contact_us", title: "📞 Contact Us" } },
//                 { type: "reply", reply: { id: "new_request", title: "📝 New Request" } }
//             ]);
//             return res.sendStatus(200);
//         }

//         const session = userSessions[from];

//         if (!session.data.phone) {
//             session.data.phone = formatPhoneNumber(from);
//         }

//         // 3. Handle interactive button replies (e.g., new request, contact us)
//         if (message.interactive && message.interactive.button_reply) {
//             const buttonId = message.interactive.button_reply.id;

//             if (buttonId === "new_request") {
//                 // Reset session data for a new request
//                 session.data = { phone: formatPhoneNumber(from) };
//                 session.step = STATES.NAME;

//                 // Ask for the user's name
//                 const namePrompt = await generateMissingFieldPrompt("name");
//                 await sendToWhatsApp(from, namePrompt);
//                 return res.sendStatus(200);
//             } else if (buttonId === "contact_us") {
//                 await sendToWhatsApp(from, "You can reach us at support@example.com. 📞");
//                 return res.sendStatus(200);
//             }
//         }

//         // 4. Process message based on current step FIRST
//         switch (session.step) {
//             case STATES.WELCOME:
//                 if (message.type === "text") {
//                     const extractedData = await extractInformationFromText(textRaw);
//                     session.data = { ...session.data, ...extractedData };

//                     const missingFields = getMissingFields(session.data);
//                     if (missingFields.length === 0) {
//                         session.step = STATES.CONFIRMATION;
//                         await sendOrderSummary(from, session);
//                     } else if (missingFields.includes("city")) {
//                         session.step = STATES.CITY_SELECTION;
//                         await sendCitySelection(from);
//                     } else {
//                         await askForNextMissingField(session, from);
//                     }
//                 }
//                 break;

//             case STATES.NAME:
//                 const nameValidationResponse = await analyzeInput(textRaw, "name");

//                 if (nameValidationResponse.toLowerCase().includes("valid")) {
//                     session.data.name = textRaw.trim(); // Trim whitespace
//                     session.step = STATES.EMAIL;
//                     const nextPrompt = await getOpenAIResponse("Thanks! Now, please provide your email.", "");
//                     await sendToWhatsApp(from, nextPrompt);
//                 } else {
//                     await sendToWhatsApp(from, nameValidationResponse.replace("invalid:", ""));
//                 }
//                 break;

//             case STATES.EMAIL:
//                 const emailValidationResponse = await analyzeInput(textRaw, "email");

//                 if (emailValidationResponse.toLowerCase().includes("valid")) {
//                     session.data.email = textRaw;
//                     session.step = STATES.LONGITUDE;
//                     const locationPrompt = await getOpenAIResponse("Please share your location.");
//                     await sendToWhatsApp(from, locationPrompt);
//                     session.locationPromptSent = true;
//                 } else {
//                     await sendToWhatsApp(from, emailValidationResponse);
//                 }
//                 break;
//                 case STATES.LONGITUDE:
//                     if (message.location) {
//                         const { latitude, longitude } = message.location;
//                         const UAE_BOUNDS = {
//                             minLat: 22.5,
//                             maxLat: 26.5,
//                             minLng: 51.6,
//                             maxLng: 56.5
//                         };

//                         if (
//                             latitude >= UAE_BOUNDS.minLat &&
//                             latitude <= UAE_BOUNDS.maxLat &&
//                             longitude >= UAE_BOUNDS.minLng &&
//                             longitude <= UAE_BOUNDS.maxLng
//                         ) {
//                             session.data.latitude = latitude;
//                             session.data.longitude = longitude;
//                             session.step = STATES.CITY_SELECTION;
//                             await sendCitySelection(from);
//                         } else {
//                             await sendToWhatsApp(from, "Invalid location. Please share a valid location within the UAE.");
//                         }
//                     } else if (!session.locationPromptSent) {
//                         const locationPrompt = await getOpenAIResponse("Please share your location by clicking the button below.");

//                         // This sends a message with a clickable text to open the location-sharing feature
//                         await sendLocationRequest(from, locationPrompt);

//                         session.locationPromptSent = true;
//                     }
//                     break;




//             case STATES.CITY_SELECTION:
//                 if (message.interactive && message.interactive.button_reply) {
//                     const citySelection = message.interactive.button_reply.id;
//                     const cityMap = {
//                         "abu_dhabi": "Abu Dhabi",
//                         "dubai": "Dubai",
//                         "sharjah": "Sharjah"
//                     };

//                     if (cityMap[citySelection]) {
//                         session.data.city = cityMap[citySelection];
//                         session.step = STATES.ADDRESS;
//                         const addressPrompt = await generateMissingFieldPrompt("address");
//                         await sendToWhatsApp(from, addressPrompt);
//                     } else {
//                         await sendCitySelection(from);
//                     }
//                 }
//                 break;

//             case STATES.ADDRESS:
//                 const addressValidationResponse = await analyzeInput(textRaw, "address");

//                 if (addressValidationResponse.toLowerCase().includes("valid")) {
//                     session.data.address = textRaw;
//                     session.step = STATES.STREET;
//                     const streetPrompt = await generateMissingFieldPrompt("street");
//                     await sendToWhatsApp(from, streetPrompt);
//                 } else {
//                     await sendToWhatsApp(from, addressValidationResponse);
//                 }
//                 break;

//             case STATES.STREET:
//                 const streetValidationResponse = await analyzeInput(textRaw, "street name");

//                 if (streetValidationResponse.toLowerCase().includes("valid")) {
//                     session.data.street = textRaw;
//                     session.step = STATES.BUILDING_NAME;
//                     const buildingPrompt = await getOpenAIResponse("Please provide the building name.");
//                     await sendToWhatsApp(from, buildingPrompt);
//                 } else {
//                     await sendToWhatsApp(from, streetValidationResponse);
//                 }
//                 break;

//             case STATES.BUILDING_NAME:
//                 const buildingValidationResponse = await analyzeInput(textRaw, "building name");

//                 if (buildingValidationResponse.toLowerCase().includes("valid")) {
//                     session.data.building_name = textRaw;
//                     session.step = STATES.FLAT_NO;
//                     const flatPrompt = await getOpenAIResponse("Please provide your apartment number.");
//                     await sendToWhatsApp(from, flatPrompt);
//                 } else {
//                     await sendToWhatsApp(from, buildingValidationResponse);
//                 }
//                 break;

//             case STATES.FLAT_NO:
//                 const flatValidationResponse = await analyzeInput(textRaw, "flat number");

//                 if (flatValidationResponse.toLowerCase().includes("valid")) {
//                     session.data.flat_no = textRaw;
//                     session.step = STATES.QUANTITY;
//                     const quantityPrompt = await getOpenAIResponse("Please provide the quantity.");
//                     await sendToWhatsApp(from, quantityPrompt);
//                 } else {
//                     await sendToWhatsApp(from, flatValidationResponse);
//                 }
//                 break;

//             case STATES.QUANTITY:
//                 const quantityValidationResponse = await analyzeInput(textRaw, "quantity");

//                 if (quantityValidationResponse.toLowerCase().includes("valid")) {
//                     session.data.quantity = extractQuantity(textRaw);
//                     session.step = STATES.CONFIRMATION;
//                     const summary = await getOpenAIResponse("Here is your order summary. Please confirm.");
//                     sendOrderSummary(from, session, summary);
//                 } else {
//                     await sendToWhatsApp(from, quantityValidationResponse);
//                 }
//                 break;


//             case "ASK_NAME": {
//                 session.data.name = textRaw;
//                 const missingAfterName = getMissingFields(session.data);
//                 if (missingAfterName.length === 0) {
//                     session.step = STATES.CONFIRMATION;
//                     await sendOrderSummary(from, session);
//                 } else {
//                     await askForNextMissingField(session, from, missingAfterName);
//                 }
//                 break;
//             }

//             case "ASK_EMAIL": {
//                 if (!isValidEmail(textRaw)) {
//                     await sendToWhatsApp(from, "❌ Invalid email address, please enter a valid one.");
//                     return res.sendStatus(200);
//                 }
//                 session.data.email = textRaw;
//                 const missingAfterEmail = getMissingFields(session.data);
//                 if (missingAfterEmail.length === 0) {
//                     session.step = STATES.CONFIRMATION;
//                     await sendOrderSummary(from, session);
//                 } else {
//                     await askForNextMissingField(session, from, missingAfterEmail);
//                 }
//                 break;
//             }

//             case "ASK_ADDRESS": {
//                 session.data.address = textRaw;
//                 const missingAfterAddress = getMissingFields(session.data);
//                 if (missingAfterAddress.length === 0) {
//                     session.step = STATES.CONFIRMATION;
//                     await sendOrderSummary(from, session);
//                 } else {
//                     await askForNextMissingField(session, from, missingAfterAddress);
//                 }
//                 break;
//             }

//             case "ASK_CITY": {
//                 session.step = STATES.CITY_SELECTION;
//                 return await sendCitySelection(from);
//             }

//             case "ASK_STREET": {
//                 session.data.street = textRaw;
//                 const missingAfterStreet = getMissingFields(session.data);
//                 if (missingAfterStreet.length === 0) {
//                     session.step = STATES.CONFIRMATION;
//                     await sendOrderSummary(from, session);
//                 } else {
//                     await askForNextMissingField(session, from, missingAfterStreet);
//                 }
//                 break;
//             }

//             case "ASK_BUILDING_NAME": {
//                 session.data.building_name = textRaw;
//                 const missingAfterBuilding = getMissingFields(session.data);
//                 if (missingAfterBuilding.length === 0) {
//                     session.step = STATES.CONFIRMATION;
//                     await sendOrderSummary(from, session);
//                 } else {
//                     await askForNextMissingField(session, from, missingAfterBuilding);
//                 }
//                 break;
//             }

//             case "ASK_FLAT_NO": {
//                 session.data.flat_no = textRaw;
//                 const missingAfterFlat = getMissingFields(session.data);
//                 if (missingAfterFlat.length === 0) {
//                     session.step = STATES.CONFIRMATION;
//                     await sendOrderSummary(from, session);
//                 } else {
//                     await askForNextMissingField(session, from, missingAfterFlat);
//                 }
//                 break;
//             }

//             case "ASK_LATITUDE": {
//                 if (message.location) {
//                     session.data.latitude = message.location.latitude;
//                     session.data.longitude = message.location.longitude;
//                     const missingAfterLocation = getMissingFields(session.data);
//                     if (missingAfterLocation.length === 0) {
//                         session.step = STATES.CONFIRMATION;
//                         await sendOrderSummary(from, session);
//                     } else {
//                         await askForNextMissingField(session, from, missingAfterLocation);
//                     }
//                 } else {
//                     await sendToWhatsApp(from, "📍 Please share your location using WhatsApp's location feature.");
//                 }
//                 break;
//             }

//             case "ASK_LONGITUDE": {
//                 if (message.location) {
//                     session.data.latitude = message.location.latitude;
//                     session.data.longitude = message.location.longitude;
//                     const missingAfterLocation = getMissingFields(session.data);
//                     if (missingAfterLocation.length === 0) {
//                         session.step = STATES.CONFIRMATION;
//                         await sendOrderSummary(from, session);
//                     } else {
//                         await askForNextMissingField(session, from, missingAfterLocation);
//                     }
//                 } else {
//                     await sendToWhatsApp(from, "📍 Please share your location using WhatsApp's location feature.");
//                 }
//                 break;
//             }

//             case "ASK_QUANTITY": {
//                 const quantity = extractQuantity(textRaw);

//                 if (!quantity) {
//                     await sendToWhatsApp(from, "❌ Please enter a valid quantity (numeric values only).");
//                     return res.sendStatus(200);
//                 }

//                 session.data.quantity = quantity;
//                 const missingAfterQuantity = getMissingFields(session.data);

//                 if (missingAfterQuantity.length === 0) {
//                     session.step = STATES.CONFIRMATION;
//                     await sendOrderSummary(from, session);
//                 } else {
//                     await askForNextMissingField(session, from, missingAfterQuantity);
//                 }
//                 break;
//             }

//             case STATES.CONFIRMATION:
//                 if (message.type === "interactive" && message.interactive.type === "button_reply") {
//                     const buttonId = message.interactive.button_reply.id;

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
//                             const response = await axios.post('https://api.lootahbiofuels.com/api/v1/whatsapp_request', requestData, {
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
//                         await sendToWhatsApp(from, "Which information would you like to modify? Please reply with the corresponding number:\n\n1. Name\n2. Phone Number\n3. Email\n4. Address\n5. City\n6. Street\n7. Building Name\n8. Flat Number\n9. Location\n10. Quantity");
//                     }
//                 }
//                 break;

//             case STATES.MODIFY:
//                 const normalizedText = convertArabicNumbers(text);
//                 const fieldToModify = parseInt(normalizedText);
//                 if (isNaN(fieldToModify) || fieldToModify < 1 || fieldToModify > 11) {
//                     await sendToWhatsApp(from, "❌ Invalid option. Please choose a number between 1 and 11.");
//                     return res.sendStatus(200);
//                 }

//                 const fieldMap = {
//                     1: "name",
//                     2: "phone",
//                     3: "email",
//                     4: "address",
//                     5: "city",
//                     6: "street",
//                     7: "building_name",
//                     8: "flat_no",
//                     9: "location",
//                     10: "quantity"
//                 };

//                 const selectedField = fieldMap[fieldToModify];

//                 if (selectedField === "location") {
//                     await sendToWhatsApp(from, "📍 Please share your location using WhatsApp's location feature.");
//                     session.step = "MODIFY_LOCATION";
//                 } else if (selectedField === "city") {
//                     await sendCitySelection(from);
//                     session.step = "MODIFY_CITY_SELECTION";
//                 } else {
//                     session.modifyField = selectedField;
//                     session.step = `MODIFY_${selectedField.toUpperCase()}`;
//                     await sendToWhatsApp(from, `🔹 Please provide the new value for ${selectedField.replace(/_/g, " ")}.`);
//                 }
//                 break;

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

//             case "MODIFY_CITY_SELECTION":
//                 if (message.interactive && message.interactive.button_reply) {
//                     const citySelection = message.interactive.button_reply.id;
//                     const cityMap = {
//                         "abu_dhabi": "Abu Dhabi",
//                         "dubai": "Dubai",
//                         "sharjah": "Sharjah"
//                     };

//                     if (cityMap[citySelection]) {
//                         session.data.city = cityMap[citySelection];
//                         session.step = STATES.CONFIRMATION;
//                         await sendUpdatedSummary(from, session);
//                     } else {
//                         await sendToWhatsApp(from, "❌ Invalid selection. Please choose from the provided options.");
//                         await sendCitySelection(from);
//                     }
//                 } else {
//                     await sendToWhatsApp(from, "❌ Please select a city from the provided options.");
//                     await sendCitySelection(from);
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

//             case "MODIFY_LOCATION":
//                 if (message.location) {
//                     session.data.latitude = message.location.latitude;
//                     session.data.longitude = message.location.longitude;
//                     session.step = STATES.CONFIRMATION;
//                     await sendUpdatedSummary(from, session);
//                 } else {
//                     await sendToWhatsApp(from, "📍 Please share your location using WhatsApp's location feature.");
//                 }
//                 break;

//             case "MODIFY_QUANTITY": {
//                 const quantity = extractQuantity(textRaw);

//                 if (!quantity) {
//                     await sendToWhatsApp(from, "❌ Please enter a valid quantity (numeric values only).");
//                     return res.sendStatus(200);
//                 }

//                 session.data.quantity = quantity;
//                 session.step = STATES.CONFIRMATION;
//                 await sendUpdatedSummary(from, session);
//                 break;
//             }

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
// const getOpenAIResponse = async (userMessage) => {
//     try {
//         const messages = [
//             { role: "system", content: systemMessage },  // Editable default message
//         ];

//         if (guidanceMessage && guidanceMessage.trim() !== "") {
//             messages.push({ role: "system", content: guidanceMessage });
//         }

//         messages.push({ role: "user", content: userMessage });

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

//         if (!response.data.choices || !response.data.choices[0] || !response.data.choices[0].message) {
//             throw new Error("Invalid response structure from OpenAI API");
//         }

//         return response.data.choices[0].message.content.trim();
//     } catch (error) {
//         console.error('❌ Error with OpenAI:', error.response?.data || error.message);
//         return "❌ Sorry, an error occurred while processing your request.";
//     }
// };
// Helper function to check if all required fields have been collected.
// const areAllFieldsCollected = (session) => {
//     const requiredFields = ["name", "email", "buildingName", "apartmentNumber", "city", "location", "oilAmount"];
//     return requiredFields.every(field => session.data[field]);
//   };

//   // Improved extraction logic inside getOpenAIResponse:
//   // Only update a field if it hasn’t been set yet.
//   const getOpenAIResponse = async (userMessage, sessionData) => {
//     try {
//         const systemMessage = `
//         You are a friendly assistant for a WhatsApp bot used by Lootah Biofuels. Your task is to guide users through the request submission process in an engaging and lively way, and answer any questions they have about the company.

//         **Instructions:**
//         1. **Extract Data:** Parse the user's message to extract the following fields:
//            - Name (e.g., "John" from "My name is John")
//            - Email (e.g., "john@example.com")
//            - Building Name (e.g., "Sunrise Tower")
//            - Apartment Number (e.g., "Apt 101")
//            - City (e.g., "Dubai")
//            - Oil Amount (e.g., "50 liters" → "50")

//         2. **Confirm Values:** After extracting a value, ask the user to confirm it (e.g., "Just to confirm, your name is John, right?").
//         3. **Avoid Repetition:** Never ask for information already confirmed and stored in the session.
//         4. **Session Data:** Here is the current session data: ${JSON.stringify(sessionData.data)}

//         **Response Format:**
//         - Return a JSON object with two fields: 
//           \`response\` (your reply to the user) 
//           \`updates\` (key-value pairs of extracted data to save to the session)
//         `;

//         const messages = [
//             { role: "system", content: systemMessage },
//             { role: "user", content: userMessage }
//         ];

//         const response = await axios.post('https://api.openai.com/v1/chat/completions', {
//             model: "gpt-4-1106-preview", // Use the correct model
//             messages,
//             max_tokens: 300,
//             temperature: 0.2,
//             response_format: { type: "json_object" } // Force JSON output
//         }, {
//             headers: {
//                 'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
//                 'Content-Type': 'application/json'
//             }
//         });

//         const parsedResponse = response.data.choices?.[0]?.message?.content;
//         if (!parsedResponse) throw new Error("Invalid response from OpenAI API");

//         const { response: aiResponse, updates } = JSON.parse(parsedResponse);

//         // Update session data with extracted values
//         if (updates) {
//             Object.assign(sessionData.data, updates);
//         }

//         return aiResponse;
//     } catch (error) {
//         console.error('❌ Error with OpenAI:', error.response?.data || error.message);
//         return "❌ Oops! Something went wrong, can you please try again?";
//     }
// };


// app.post('/webhook', async (req, res) => {
//     try {
//         const entry = req.body.entry?.[0];
//         const changes = entry?.changes?.[0];
//         const value = changes?.value;
//         const messages = value?.messages;

//         if (!messages || messages.length === 0) {
//             return res.sendStatus(200);
//         }

//         const message = messages[0];
//         const from = message.from;
//         const textRaw = message.text?.body || "";

//         // Initialize user session if it doesn't exist
//         if (!userSessions[from]) {
//             userSessions[from] = { data: { phone: formatPhoneNumber(from) } };
//         }

//         const session = userSessions[from];

//         // Handle location sharing
//         if (message.location) {
//             const { latitude, longitude, name: streetName } = message.location;
//             session.data.location = { latitude, longitude, streetName };
//             await sendToWhatsApp(from, "📍 Thanks for sharing your location! Let’s proceed.");
//             return res.sendStatus(200);
//         }

//         // Handle oil amount
//         if (textRaw.match(/liters?/i)) {
//             const oilAmount = textRaw.match(/\d+/)?.[0];
//             if (oilAmount) {
//                 session.data.oilAmount = oilAmount;
//                 await sendToWhatsApp(from, `👍 Got it! You’ve mentioned ${oilAmount} liters of oil. Let’s proceed.`);
//             } else {
//                 await sendToWhatsApp(from, "🤔 Can you please share how much oil you used in liters?");
//             }
//             return res.sendStatus(200);
//         }

//         // Get ChatGPT's response
//         const aiResponse = await getOpenAIResponse(textRaw, session);

//         // Check if all required fields are collected
//         if (areAllFieldsCollected(session)) {
//             const summary = `
//             🎉 Here's what I have so far:
//             - Name: ${session.data.name}
//             - Email: ${session.data.email}
//             - Phone: ${session.data.phone}
//             - Building Name: ${session.data.buildingName}
//             - Apartment Number: ${session.data.apartmentNumber}
//             - City: ${session.data.city}
//             - Location: Latitude: ${session.data.location.latitude}, Longitude: ${session.data.location.longitude}, Street: ${session.data.location.streetName}
//             - Oil Amount: ${session.data.oilAmount}

//             🙌 Should I go ahead and submit your request? Just reply "Yes" to confirm or "No" to edit.
//             `;
//             await sendToWhatsApp(from, summary);
//             session.step = "CONFIRMATION";
//             return res.sendStatus(200);
//         }

//         // Handle confirmation
//         if (session.step === "CONFIRMATION" && textRaw.toLowerCase() === "yes") {
//             const requestData = session.data;
//             try {
//                 const apiResponse = await axios.post('https://api.lootahbiofuels.com/api/v1/whatsapp_request', requestData, {
//                     headers: { 'Content-Type': 'application/json' },
//                     timeout: 5000
//                 });

//                 if (apiResponse.status === 200) {
//                     await sendToWhatsApp(from, "✅ Your request has been successfully submitted! We'll contact you soon.");
//                 } else {
//                     await sendToWhatsApp(from, "❌ Something went wrong! Please try again later.");
//                 }
//             } catch (error) {
//                 await sendToWhatsApp(from, "❌ An error occurred while submitting your request. Please try again later.");
//             }

//             delete userSessions[from];
//         } else {
//             await sendToWhatsApp(from, aiResponse);
//         }

//         res.sendStatus(200);
//     } catch (error) {
//         console.error('❌ Error:', error.response?.data || error.message || error);
//         res.sendStatus(500);
//     }
// });

// async function askForNextMissingField(session, from, missingFields) {
//     if (!session.greetingSent) {
//         const greetingMessage = `Hey ${session.data.name || 'there'}! 👋 Ready to complete your order? Let's get started! 😊`;
//         await sendToWhatsApp(from, greetingMessage);
//         session.greetingSent = true;
//     }

//     if (missingFields.length === 0) {
//         session.step = STATES.CONFIRMATION;
//         return await sendOrderSummary(from, session);
//     }

//     const nextMissingField = missingFields[0];
//     session.step = `ASK_${nextMissingField.toUpperCase()}`;

//     const dynamicPrompt = `
//         The user is submitting an order to Lootah Biofuels. Missing field: "${nextMissingField}". Ask for it briefly with a friendly tone and emojis.

//         Example: "Hey, we just need your name to proceed! 😊"
//     `;

//     const dynamicResponse = await getOpenAIResponse(dynamicPrompt);
//     await sendToWhatsApp(from, dynamicResponse);
// }
// case STATES.CITY_SELECTION:
//     if (message.interactive && message.interactive.button_reply) {
//         const citySelection = message.interactive.button_reply.id;
//         const cityMap = {
//             "abu_dhabi": "Abu Dhabi",
//             "dubai": "Dubai",
//             "sharjah": "Sharjah"
//         };

//         if (cityMap[citySelection]) {
//             session.data.city = cityMap[citySelection];
//             session.step = STATES.STREET;
//             const cityResponse = await getOpenAIResponse("The user selected the city " + cityMap[citySelection] + ". Now, ask them for the street name.");
//             await sendToWhatsApp(from, cityResponse);
//         } else {
//             const invalidCityResponse = await getOpenAIResponse("The user made an invalid city selection. Ask them to choose from the provided options.");
//             await sendToWhatsApp(from, invalidCityResponse);
//             await sendCitySelection(from); // Re-send city selection
//         }
//     } else {
//         const noCityResponse = await getOpenAIResponse("The user didn't select a city. Ask them to choose from the provided options.");
//         await sendToWhatsApp(from, noCityResponse);
//         await sendCitySelection(from); // Re-send city selection buttons
//     }
//     break;

// case STATES.STREET:
//     session.data.street = textRaw;
//     session.step = STATES.BUILDING_NAME;
//     const streetResponse = await getOpenAIResponse("User provided the street " + textRaw + ". Ask them for the building name.");
//     await sendToWhatsApp(from, streetResponse);
//     break;

// case STATES.BUILDING_NAME:
//     session.data.building_name = textRaw;
//     session.step = STATES.FLAT_NO;
//     const buildingResponse = await getOpenAIResponse("User provided the building name " + textRaw + ". Ask them for the flat number.");
//     await sendToWhatsApp(from, buildingResponse);
//     break;

// case STATES.FLAT_NO:
//     session.data.flat_no = textRaw;
//     session.step = STATES.LONGITUDE;
//     const flatResponse = await getOpenAIResponse("User provided the flat number " + textRaw + ". Ask them to share their location.");
//     if (!session.locationPromptSent) {
//         await sendToWhatsApp(from, flatResponse);
//         session.locationPromptSent = true;
//     }
//     break;

// case STATES.LONGITUDE:
//     if (message.location) {
//         const { latitude, longitude } = message.location;
//         const UAE_BOUNDS = {
//             minLat: 22.5,
//             maxLat: 26.5,
//             minLng: 51.6,
//             maxLng: 56.5
//         };

//         if (
//             latitude >= UAE_BOUNDS.minLat &&
//             latitude <= UAE_BOUNDS.maxLat &&
//             longitude >= UAE_BOUNDS.minLng &&
//             longitude <= UAE_BOUNDS.maxLng
//         ) {
//             session.data.latitude = latitude;
//             session.data.longitude = longitude;
//             session.step = STATES.QUANTITY;
//             session.awaitingQuantityInput = true;
//             const locationResponse = await getOpenAIResponse("User shared a valid location within the UAE. Now, ask them for the quantity.");
//             await sendToWhatsApp(from, locationResponse);
//         } else {
//             const invalidLocationResponse = await getOpenAIResponse("User shared an invalid location outside the UAE. Ask them to provide a valid location within the UAE.");
//             await sendToWhatsApp(from, invalidLocationResponse);
//         }
//     } else {
//         if (!session.locationPromptSent) {
//             const missingPrompt = await generateMissingFieldPrompt("longitude");
//             await sendToWhatsApp(from, missingPrompt);
//             session.locationPromptSent = true;
//         }
//     }
//     break;
// Check if the user is asking a question
// const isUserAskingQuestion = await isQuestion(textRaw);

// if (isUserAskingQuestion) {
//     // Answer the question using ChatGPT
//     const aiResponse = await getOpenAIResponse(textRaw);

//     // Send the answer to the user
//     await sendToWhatsApp(from, aiResponse);

//     // If the user was in the middle of a request, remind them to continue
//     if (session.step !== STATES.WELCOME) {
//         const missingFields = getMissingFields(session.data);
//         if (missingFields.length > 0) {
//             const nextMissingField = missingFields[0];
//             const missingPrompt = await generateMissingFieldPrompt(nextMissingField);

//             if (missingPrompt) {
//                 await sendToWhatsApp(from, `Let’s go back to complete the request. ${missingPrompt}`);
//             }
//         }
//     }

//     return res.sendStatus(200);
// }
// const generateMissingFieldPrompt = async (field) => {
//     try {
//         const fieldPromptMap = {
//             name: "Ask the user to provide their full name. Keep it short, lively, and friendly with an emoji if possible.",
//             phone: "Ask the user for their phone number in a friendly and casual tone. Include an emoji if it feels appropriate.",
//             email: "Ask the user for their email address in a casual, short, and polite way, using emojis.",
//             address: "Ask the user to provide their full address, but keep it simple and friendly with a casual tone.",
//             city: "Ask the user for their city in a friendly, short way with some emojis.",
//             street: "Ask the user for their street name, but keep it short and cheerful.",
//             building_name: "Ask the user for their building name in a friendly and short tone.",
//             flat_no: "Ask the user for their flat number, ensuring it's friendly and concise.",
//             latitude: "Ask the user to share their live location via WhatsApp, keeping it casual with an emoji.",
//             longitude: "Ask the user to share their live location via WhatsApp. Keep it brief and friendly.",
//             quantity: "Ask the user how many liters they want in a friendly, short manner, with an emoji if appropriate."
//         };

//         if (!fieldPromptMap[field]) return null;

//         return await getOpenAIResponse(fieldPromptMap[field]);
//     } catch (error) {
//         console.error('❌ Error generating missing field prompt:', error);
//         return "I need more details to proceed. 😊";
//     }
// };
// async function isQuestion(text) {
//     const prompt = `
//         Determine if the following text is a question or a greeting.
//         Respond with:
//         - "question" if the text is a genuine question.
//         - "greeting" if the text is a casual greeting like "hi", "hello", "who are you".
//         - "other" if the text is neither a question nor a greeting.

//         Text: "${text}"
//     `;

//     const aiResponse = await getOpenAIResponse(prompt);
//     const response = aiResponse.trim().toLowerCase();

//     return response === "question" ? true : response === "greeting" ? false : "other";
// }

// const generateWelcomeMessage = async () => {
//     try {
//         const systemPrompt = `
//         You are a friendly WhatsApp assistant for Lootah Biofuels. 
//         Generate a concise and engaging welcome message that:
//         - Briefly introduces the company.
//         - Encourages users to ask any questions or select from the available options.
//         - Avoids unnecessary repetition.
//         - Uses emojis sparingly and professionally.
//         - Returns only the message text, without extra formatting.
//         `;

//         const response = await axios.post('https://api.openai.com/v1/chat/completions', {
//             model: "gpt-4",
//             messages: [{ role: "system", content: systemPrompt }],
//             max_tokens: 100,
//             temperature: 0.7
//         }, {
//             headers: {
//                 'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
//                 'Content-Type': 'application/json'
//             }
//         });

//         return response.data.choices?.[0]?.message?.content?.trim() || "Welcome to Lootah Biofuels!";
//     } catch (error) {
//         console.error('❌ Error generating welcome message:', error.response?.data || error.message);
//         return "🌟 Welcome to Lootah Biofuels Refining Company! 🌟\n\nYou can ask any question directly, and I will assist you. If you need further help, choose from the options below.";
//     }
// };

// const getOpenAIResponse = async (userMessage, context = "") => {
//     try {
//         const systemMessage = `
//             You are a friendly and intelligent WhatsApp assistant for Lootah Biofuels. 
//             Your goal is to assist users in completing their orders and answering their questions in a professional yet warm tone.
//             Always respond concisely, use emojis sparingly, and maintain a helpful attitude.
//             Do not start your responses with greetings like "Hello" or "Hi" unless explicitly asked to.
//             Your task is to analyze user input and provide responses based on the context provided.
//         `;

//         const messages = [
//             { role: "system", content: systemMessage },
//         ];

//         // Add context if provided
//         if (context && context.trim() !== "") {
//             messages.push({ role: "system", content: context });
//         }

//         // Add the user's message
//         messages.push({ role: "user", content: userMessage });

//         const response = await axios.post('https://api.openai.com/v1/chat/completions', {
//             model: "gpt-4",
//             messages,
//             max_tokens: 90,
//             temperature: 0.7
//         }, {
//             headers: {
//                 'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
//                 'Content-Type': 'application/json'
//             }
//         });

//         if (!response.data.choices || !response.data.choices[0] || !response.data.choices[0].message) {
//             throw new Error("Invalid response structure from OpenAI API");
//         }

//         const aiResponse = response.data.choices[0].message.content.trim();
//         console.log(`OpenAI Response: ${aiResponse}`); // Debugging
//         return aiResponse;
//     } catch (error) {
//         console.error('❌ Error with OpenAI:', error.response?.data || error.message);
//         return "❌ Oops! Something went wrong. Please try again later.";
//     }
// };


app.listen(PORT, () => console.log(`🚀 Server running on http://localhost:${PORT}`));
