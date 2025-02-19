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

const isValidEmail = (email) => {
    const regex = /^\S+@\S+\.\S+$/;
    return regex.test(email);
};

const isValidPhone = (phone) => {
    const regex = /^\+971(5\d{1}\s?\d{3}\s?\d{3}|\s?4\d{2}\s?\d{4})$/;
    return regex.test(phone);
};


//


// const sendOrderSummary = async (to, session) => {
//     try {
//         const summaryText = await getOpenAIResponse(
//             `Generate an order summary in a user-friendly way, including the following details:
//             Name: ${session.data.name},
//             Phone: ${session.data.phone},
//             Email: ${session.data.email},
//             Address: ${session.data.address},
//             City: ${session.data.city},
//             Street: ${session.data.street},
//             Building Name: ${session.data.building_name},
//             Flat Number: ${session.data.flat_no},
//             Location: (Latitude: ${session.data.latitude}, Longitude: ${session.data.longitude}),
//             Quantity: ${session.data.quantity}.
//             Also, ask the user to confirm if the details are correct.`,
//             session.language
//         );

//         await axios.post(process.env.WHATSAPP_API_URL, {
//             messaging_product: "whatsapp",
//             recipient_type: "individual",
//             to: to,
//             type: "interactive",
//             interactive: {
//                 type: "button",
//                 body: {
//                     text: summaryText
//                 },
//                 action: {
//                     buttons: [
//                         { type: "reply", reply: { id: "yes_confirm", title: session.language === 'ar' ? '✅ نعم' : '✅ Yes' } },
//                         { type: "reply", reply: { id: "no_correct", title: session.language === 'ar' ? '❌ لا' : '❌ No' } }
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
async function sendOrderSummary(to, session) {
    try {
        const orderSummary = session.language === 'ar'
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
                    title: session.language === 'ar' ? "تأكيد ✅" : "Confirm ✅"
                }
            },
            {
                type: "reply",
                reply: {
                    id: "no_correct",
                    title: session.language === 'ar' ? "تعديل ❌" : "Modify ❌"
                }
            }
        ];

        await sendInteractiveButtons(to, orderSummary, confirmationButtons);

    } catch (error) {
        console.error("Error sending order summary:", error);
    }
}


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
    CHANGE_INFOO:"CHANGE_INFOO"
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
    const extractedData = {
        quantity: extractQuantity(text), // Extract quantity
        city: extractCity(text, language) // Extract city
    };

    // Extract name using regex or simple logic
    const nameMatch = text.match(/(?:انا|اسمي|my name is|name is)\s+([\u0600-\u06FF\s]+|[a-zA-Z\s]+)/i);
    if (nameMatch && nameMatch[1]) {
        extractedData.name = nameMatch[1].trim();
    }

    // Extract phone number using regex
    const phoneRegex = /(?:\+971|0)?(?:5\d|4\d)\s?\d{3}\s?\d{3}/; // Matches UAE phone numbers
    const phoneMatch = text.match(phoneRegex);
    if (phoneMatch) {
        extractedData.phone = formatPhoneNumber(phoneMatch[0]); // Format the phone number
    }

    // Use OpenAI for additional extraction
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

    **Rules for Arabic Text:**
    1. Recognize city names in Arabic: دبي (Dubai), أبو ظبي (Abu Dhabi), الشارقة (Sharjah).
    2. Extract names written in Arabic script.
    3. Extract phone numbers in UAE format (e.g., +9715xxxxxxxx).

    Text: ${text}
`;

    const aiResponse = await getOpenAIResponse(prompt, ``, language); // Pass prompt, not textRaw

    try {
        const aiExtractedData = JSON.parse(aiResponse);
        return { ...aiExtractedData, ...extractedData };
    } catch (e) {
        console.error("❌ Failed to parse AI response as JSON:", aiResponse);
        return extractedData; // Return at least the manually extracted data
    }
}
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
                await sendToWhatsApp(from, getQuantityMessage(lang));
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
        - "أريد إنشاء طلب جديد"
        - "لدي زيت أريد التخلص منه"
        - "الرجاء جمع الزيت من موقعي"
        - "أحتاج إلى استلام الزيت المستعمل"
        - "طلب جديد"
        - "أنا محمد ولدي 50 لتر في الشارقة"

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
        if (!message?.from) {
            console.error("❌ Error: Missing 'from' field in message.");
            return res.sendStatus(400);
        }

        const from = message.from;
        console.log(`Processing message from ${from}. Current session:`, userSessions[from]);

        const textRaw = message.text?.body || "";
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

        let session = userSessions[from];
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

        if (message.type === "interactive" && message.interactive?.type === "button_reply") {
            const buttonId = message.interactive.button_reply.id;
            if (buttonId === "new_request") {
                if (!session.data || !session.data.name) {  // Check if the user doesn't have any data
                    // Start collecting information immediately if the user is new and doesn't have data
                    session.inRequest = true;
                    session.step = STATES.NAME;
                    await sendToWhatsApp(from, "Please provide your name.");
                } else {
                    // Proceed to ask if the user wants to change information if they already have data
                    await sendInteractiveButtons(from, "Do you want to change your information?", [
                        { type: "reply", reply: { id: "yes_change", title: "Yes" } },
                        { type: "reply", reply: { id: "no_change", title: "No" } }
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

        // Check if the user's message contains information
        if (session.step === STATES.WELCOME && message.type === "text") {
            const extractedData = await extractInformationFromText(textRaw, session.language);
            if (Object.keys(extractedData).length > 0) {
                session.step = STATES.CHANGE_INFOO;
                await sendInteractiveButtons(from, "Do you want to change your information?", [
                    { type: "reply", reply: { id: "yes_change", title: "Yes" } },
                    { type: "reply", reply: { id: "no_change", title: "No" } }
                ]);
                session.tempData = extractedData; // Store extracted data temporarily
                return res.sendStatus(200);
            }
        }

        // Handle CHANGE_INFO state
        if (session.step === STATES.CHANGE_INFOO) {
            if (message.type === "interactive" && message.interactive?.type === "button_reply") {
                const buttonId = message.interactive.button_reply.id;
                if (buttonId === "yes_change") {
                    // Update session data with extracted information
                    session.data = { ...session.data, ...session.tempData };
                    delete session.tempData; // Clear temporary data

                    // Ensure the phone number is not overwritten if already present
                    if (!session.data.phone) {
                        session.data.phone = from; // Use the WhatsApp number as the default phone number
                    }

                    const missingFields = getMissingFields(session.data);
                    if (missingFields.length > 0) {
                        session.step = `ASK_${missingFields[0].toUpperCase()}`;
                        await askForNextMissingField(session, from);
                    } else {
                        session.step = STATES.QUANTITY;
                        await sendToWhatsApp(from, "Please provide the quantity (in liters).");
                    }
                } else if (buttonId === "no_change") {
                    session.step = STATES.QUANTITY;
                    await sendToWhatsApp(from, "Please provide the quantity (in liters).");
                }
            }
            return res.sendStatus(200);
        }

        // Analyze the user's message first
        const classification = await isQuestionOrRequest(textRaw);

        if (classification === "question") {
            const aiResponse = await getOpenAIResponse(textRaw, systemMessage, session.language);
            if (session.inRequest) {
                await sendToWhatsApp(from, `${aiResponse}\n\nPlease complete the request information.`);
            } else {
                const reply = `${aiResponse}\n\n${getContinueMessage(session.language)}`;
                await sendInteractiveButtons(from, reply, [
                    { type: "reply", reply: { id: "contact_us", title: getButtonTitle("contact_us", session.language) } },
                    { type: "reply", reply: { id: "new_request", title: getButtonTitle("new_request", session.language) } }
                ]);
            }
            return res.sendStatus(200);
        } else if (classification === "request") {
            session.inRequest = true;
            const extractedData = await extractInformationFromText(textRaw, session.language);
            session.data = { ...session.data, ...extractedData };
            const missingFields = getMissingFields(session.data);
            if (missingFields.length === 0) {
                session.step = STATES.CONFIRMATION;
                await sendOrderSummary(from, session);
            } else {
                session.step = `ASK_${missingFields[0].toUpperCase()}`;
                await askForNextMissingField(session, from);
            }
            return res.sendStatus(200);
        } else if (classification === "greeting") {
            const greetingResponse = await getOpenAIResponse("Generate a friendly greeting response.", "", session.language);
            await sendToWhatsApp(from, greetingResponse);
            return res.sendStatus(200);
        } else {
            // Handle other cases
            await sendToWhatsApp(from, "I'm not sure how to help with that. Can you please clarify?");
            return res.sendStatus(200);
        }

        switch (session.step) {
            case STATES.CHANGE_INFO:
                if (message.type === "interactive" && message.interactive?.type === "button_reply") {
                    const buttonId = message.interactive.button_reply.id;
                    if (buttonId === "yes_change") {
                        session.step = STATES.NAME;
                        await sendToWhatsApp(from, "Please provide your new name.");
                    } else if (buttonId === "no_change") {
                        session.step = STATES.QUANTITY;
                        await sendToWhatsApp(from, "Please provide the quantity (in liters).");
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
                if (message.type === "interactive" && message.interactive?.type === "button_reply") {
                    const buttonId = message.interactive.button_reply.id;
                    if (buttonId === "send_site") {
                        // Send a message with a button to share location
                        await sendInteractiveButtons(from, getLocationMessage(session.language), [
                            {
                                type: "location_request",
                                title: getButtonTitle("send_site", session.language) // "Send Location" button
                            }
                        ]);
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
                        // Check if the selected city matches the location
                        if (session.data.city) {
                            const isValidCity = await validateCityAndLocation(latitude, longitude, session.data.city);
                            if (!isValidCity) {
                                await sendToWhatsApp(from, getInvalidCityMessage(session.language));
                                return res.sendStatus(200);
                            }
                        }
                        session.data.latitude = latitude;
                        session.data.longitude = longitude;
                        session.step = STATES.ADDRESS;
                        await sendToWhatsApp(from, getAddressMessage(session.language));
                    } else {
                        await sendToWhatsApp(from, getInvalidUAERegionMessage(session.language));
                    }
                } else {
                    if (!session.locationPromptSent) {
                        // Send a message with a button to share location
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
                case STATES.ADDRESS:
                    session.data.address = textRaw;
                    session.step = STATES.CITY;
                    return await sendCitySelection(from, session.language); // ✅ Ask user to select city
                    break;
                case STATES.CITY:
                    if (message.interactive && message.interactive.type === "list_reply") {
                        const citySelection = message.interactive.list_reply.id; // Get the selected city ID
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
                            // Validate the selected city against the actual city from the location (if location is available)
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
                            // If location is not available, accept the city without validation
                            session.data.city = selectedCity;
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
                        // If the user sends a text message instead of selecting from the list
                        const selectedCity = extractCity(textRaw, session.language);
                        if (selectedCity) {
                            // Validate the selected city against the actual city from the location (if location is available)
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
                            // If location is not available, accept the city without validation
                            session.data.city = selectedCity;
                            session.step = STATES.STREET;
                            const streetPrompt = session.language === 'ar'
                                ? `✅ لقد اخترت *${session.data.city}*.\n\n🏠 يرجى تقديم اسم الشارع.`
                                : `✅ You selected *${session.data.city}*.\n\n🏠 Please provide the street name.`;
    
                            await sendToWhatsApp(from, streetPrompt);
                        } else {
                            const selectCityMessage = session.language === 'ar'
                                ? "❌ يرجى اختيار مدينة من الخيارات المتاحة."
                                : "❌ Please select a city from the provided options.";
    
                            await sendToWhatsApp(from, selectCityMessage);
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
                    // If no building name is provided, ask for it again
                    await sendToWhatsApp(from, getBuildingMessage(session.language));
                    return res.sendStatus(200); // Exit and wait for the user's response
                }
                // If the building name is provided, store it and proceed to the next step
                session.data.building_name = textRaw;
                session.step = STATES.FLAT_NO;
                await sendToWhatsApp(from, getFlatMessage(session.language)); // Ask for flat number
                break;
            case STATES.FLAT_NO:
                if (!textRaw) {
                    await sendToWhatsApp(from, getFlatMessage(session.language));
                    return res.sendStatus(200);
                }
                session.data.flat_no = textRaw;
                const missingFields2 = getMissingFields(session.data); // Reuse the variable
                if (missingFields2.length === 0) {
                    session.step = STATES.CONFIRMATION;
                    await sendOrderSummary(from, session);
                } else {
                    session.step = `ASK_${missingFields2[0].toUpperCase()}`;
                    await askForNextMissingField(session, from);
                }
                break;
                case STATES.QUANTITY:
                    console.log("🔹 Entered QUANTITY state for user:", from);
                    console.log("🔹 textRaw:", textRaw);
                    if (!textRaw || textRaw.trim() === "") {
                        console.log("🔹 No quantity provided. Asking for quantity.");
                        await sendToWhatsApp(from, getQuantityMessage(session.language));
                        return res.sendStatus(200);
                    }
                    if (isNaN(textRaw)) {
                        console.log("🔹 Invalid quantity provided. Asking for valid quantity.");
                        await sendToWhatsApp(from, getInvalidQuantityMessage(session.language));
                        return res.sendStatus(200);
                    }
                    console.log("🔹 Valid quantity provided:", textRaw);
                    session.data.quantity = textRaw;
                
                    // Initialize missingFields after setting the quantity
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
                    // Check for other missing fields
                    const missingFields = getMissingFields(session.data);
                    if (missingFields.length === 0) {
                        session.step = STATES.CONFIRMATION;
                        await sendOrderSummary(from, session);
                    } else {
                        console.log("hi"+session.data.latitude ,"hii"+ session.data.latitude)
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
                // If the user hasn't provided a quantity yet, ask for it
                if (!textRaw) {
                    await sendToWhatsApp(from, "🔢 Please provide the quantity (in liters).");
                    return res.sendStatus(200); // Exit and wait for the user's response
                }
                // Validate the quantity after the user provides it
                if (isNaN(textRaw) || textRaw.trim() === "") {
                    await sendToWhatsApp(from, "❌ Please enter a valid quantity (numeric values only).");
                    return res.sendStatus(200); // Exit and wait for the user to correct their input
                }
                // If the quantity is valid, store it and proceed to the next step
                session.data.quantity = textRaw;

                // Check for other missing fields
                const missingFieldsQuantity = getMissingFields(session.data);
                if (missingFieldsQuantity.length === 0) {
                    session.step = STATES.CONFIRMATION;
                    await sendOrderSummary(from, session);
                } else {
                    session.step = `ASK_${missingFieldsQuantity[0].toUpperCase()}`;
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
        Determine if the user's input matches the requested field ("${expectedField}").

        Rules:
        1. For names: Accept both single-word (e.g., "Ahmed") and multi-word names (e.g., "John Doe").
        2. For addresses: Accept partial addresses (e.g., "Jazeer") and validate them later.
        3. Return "valid" if the input is appropriate for ${expectedField}.
        4. Return "invalid:<message>" only if the input is clearly unrelated (e.g., numbers for a name).

        Examples of valid names:
        - "Ahmed"
        - "John Doe"
        - "Maria"

        Examples of valid addresses:
        - "Jazeer"
        - "123 Main Street"

        User Input: "${input}"
        Your response (ONLY "valid" or "invalid:<reason>"):
    `;

    const response = await getOpenAIResponse(prompt, ``);
    return response.trim();
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


app.listen(PORT, () => console.log(`🚀 Server running on http://localhost:${PORT}`));





























// import dotenv from 'dotenv';
// import express from 'express';
// import axios from 'axios';
// import bodyParser from 'body-parser';
// import cors from 'cors';
// import langdetect from 'langdetect';


// dotenv.config();

// if (!process.env.OPENAI_API_KEY || !process.env.WHATSAPP_API_URL || !process.env.WHATSAPP_ACCESS_TOKEN) {
//     console.error('❌ Missing required environment variables');
//     process.exit(1);
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

// const getOpenAIResponse = async (userMessage, context = "", language = "en") => {
//     try {
//         const systemMessage = `
//             You are a friendly and intelligent WhatsApp assistant for Lootah Biofuels. 
//             Your goal is to assist users in completing their orders and answering their questions.
//             Always respond concisely, use emojis sparingly, and maintain a helpful attitude.
//             Generate the response in the user's language: ${language}.
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
//             max_tokens: 350,
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


// //


// // const sendOrderSummary = async (to, session) => {
// //     try {
// //         const summaryText = await getOpenAIResponse(
// //             `Generate an order summary in a user-friendly way, including the following details:
// //             Name: ${session.data.name},
// //             Phone: ${session.data.phone},
// //             Email: ${session.data.email},
// //             Address: ${session.data.address},
// //             City: ${session.data.city},
// //             Street: ${session.data.street},
// //             Building Name: ${session.data.building_name},
// //             Flat Number: ${session.data.flat_no},
// //             Location: (Latitude: ${session.data.latitude}, Longitude: ${session.data.longitude}),
// //             Quantity: ${session.data.quantity}.
// //             Also, ask the user to confirm if the details are correct.`,
// //             session.language
// //         );

// //         await axios.post(process.env.WHATSAPP_API_URL, {
// //             messaging_product: "whatsapp",
// //             recipient_type: "individual",
// //             to: to,
// //             type: "interactive",
// //             interactive: {
// //                 type: "button",
// //                 body: {
// //                     text: summaryText
// //                 },
// //                 action: {
// //                     buttons: [
// //                         { type: "reply", reply: { id: "yes_confirm", title: session.language === 'ar' ? '✅ نعم' : '✅ Yes' } },
// //                         { type: "reply", reply: { id: "no_correct", title: session.language === 'ar' ? '❌ لا' : '❌ No' } }
// //                     ]
// //                 }
// //             }
// //         }, {
// //             headers: {
// //                 "Authorization": `Bearer ${process.env.WHATSAPP_ACCESS_TOKEN}`,
// //                 "Content-Type": "application/json"
// //             }
// //         });
// //     } catch (error) {
// //         console.error("❌ Failed to send order summary:", error.response?.data || error.message);
// //     }
// // };
// async function sendOrderSummary(to, session) {
//     try {
//         const orderSummary = session.language === 'ar'
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
//                     title: session.language === 'ar' ? "تأكيد ✅" : "Confirm ✅"
//                 }
//             },
//             {
//                 type: "reply",
//                 reply: {
//                     id: "no_correct",
//                     title: session.language === 'ar' ? "تعديل ❌" : "Modify ❌"
//                 }
//             }
//         ];

//         await sendInteractiveButtons(to, orderSummary, confirmationButtons);

//     } catch (error) {
//         console.error("Error sending order summary:", error);
//     }
// }


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
//     CHANGE_INFO: "CHANGE_INFO"
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

// // const sendInteractiveButtons = async (to, message, buttons) => {
// //     try {
// //         const payload = {
// //             messaging_product: "whatsapp",
// //             recipient_type: "individual",
// //             to: to,
// //             type: "interactive",
// //             interactive: {
// //                 type: "button",
// //                 body: { text: message },
// //                 action: { buttons }
// //             }
// //         };

// //         console.log("Sending Interactive Buttons Payload:", JSON.stringify(payload, null, 2));

// //         const response = await axios.post(process.env.WHATSAPP_API_URL, payload, {
// //             headers: {
// //                 "Authorization": `Bearer ${process.env.WHATSAPP_ACCESS_TOKEN}`,
// //                 "Content-Type": "application/json"
// //             }
// //         });

// //         console.log("Interactive Buttons Response:", response.data);
// //     } catch (error) {
// //         console.error("❌ Failed to send interactive buttons:", error.response?.data || error.message);
// //     }
// // };
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
//                     button: language === 'ar' ? 'اختر المدينة' : 'Select City', // Button text
//                     sections: [
//                         {
//                             title: language === 'ar' ? 'المدن' : 'Cities', // Section title
//                             rows: cityOptions.map(city => ({
//                                 id: city.id,
//                                 title: city.title
//                             }))
//                         }
//                     ]
//                 }
//             }
//         };

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
//       "longitude": "The user's longitude or null"
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
//                 await sendToWhatsApp(from, getQuantityMessage(lang));
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
//         if (!message?.from) {
//             console.error("❌ Error: Missing 'from' field in message.");
//             return res.sendStatus(400);
//         }
//         const from = message.from;
//         console.log(`Processing message from ${from}. Current session:`, userSessions[from]);
//         const textRaw = message.text?.body || "";
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

//         let session = userSessions[from];
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
//                     step: STATES.CHANGE_INFO,
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

//         if (session.lastTimestamp && Number(message.timestamp) < session.lastTimestamp) {
//             console.log(`Ignoring out-of-order message for user ${from}`);
//             return res.sendStatus(200);
//         }
//         session.lastTimestamp = Number(message.timestamp);

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

//         switch (session.step) {
//             case STATES.CHANGE_INFO:
//                 if (message.type === "interactive" && message.interactive?.type === "button_reply") {
//                     const buttonId = message.interactive.button_reply.id;
//                     if (buttonId === "yes_change") {
//                         session.step = STATES.NAME;
//                         await sendToWhatsApp(from, "Please provide your new name.");
//                     } else if (buttonId === "no_change") {
//                         session.step = STATES.QUANTITY;
//                         await sendToWhatsApp(from, "Please provide the quantity (in liters).");
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
//                 if (message.type === "interactive" && message.interactive?.type === "button_reply") {
//                     const buttonId = message.interactive.button_reply.id;
//                     if (buttonId === "send_site") {
//                         // Send a message with a button to share location
//                         await sendInteractiveButtons(from, getLocationMessage(session.language), [
//                             {
//                                 type: "location_request",
//                                 title: getButtonTitle("send_site", session.language) // "Send Location" button
//                             }
//                         ]);
//                     }
//                 } else if (message.location) {
//                     const { latitude, longitude } = message.location;
//                     // Validate UAE location
//                     const UAE_BOUNDS = { minLat: 22.5, maxLat: 26.5, minLng: 51.6, maxLng: 56.5 };
//                     if (
//                         latitude >= UAE_BOUNDS.minLat &&
//                         latitude <= UAE_BOUNDS.maxLat &&
//                         longitude >= UAE_BOUNDS.minLng &&
//                         longitude <= UAE_BOUNDS.maxLng
//                     ) {
//                         // Check if the selected city matches the location
//                         if (session.data.city) {
//                             const isValidCity = await validateCityAndLocation(latitude, longitude, session.data.city);
//                             if (!isValidCity) {
//                                 await sendToWhatsApp(from, getInvalidCityMessage(session.language));
//                                 return res.sendStatus(200);
//                             }
//                         }
//                         session.data.latitude = latitude;
//                         session.data.longitude = longitude;
//                         session.step = STATES.ADDRESS;
//                         await sendToWhatsApp(from, getAddressMessage(session.language));
//                     } else {
//                         await sendToWhatsApp(from, getInvalidUAERegionMessage(session.language));
//                     }
//                 } else {
//                     if (!session.locationPromptSent) {
//                         // Send a message with a button to share location
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
//                 case STATES.ADDRESS:
//                     session.data.address = textRaw;
//                     session.step = STATES.CITY;
//                     return await sendCitySelection(from, session.language); // ✅ Ask user to select city
//                     break;
//                 case STATES.CITY:
//                     if (message.interactive && message.interactive.type === "list_reply") {
//                         const citySelection = message.interactive.list_reply.id; // Get the selected city ID
//                         const cityMap = {
//                             "abu_dhabi": { en: "Abu Dhabi", ar: "أبو ظبي" },
//                             "dubai": { en: "Dubai", ar: "دبي" },
//                             "sharjah": { en: "Sharjah", ar: "الشارقة" },
//                             "ajman": { en: "Ajman", ar: "عجمان" },
//                             "umm_al_quwain": { en: "Umm Al Quwain", ar: "أم القيوين" },
//                             "ras_al_khaimah": { en: "Ras Al Khaimah", ar: "رأس الخيمة" },
//                             "fujairah": { en: "Fujairah", ar: "الفجيرة" }
//                         };
//                         if (cityMap[citySelection]) {
//                             const selectedCity = cityMap[citySelection][session.language] || cityMap[citySelection].en;
//                             // Validate the selected city against the actual city from the location (if location is available)
//                             if (session.data.latitude && session.data.longitude) {
//                                 const validationResult = await validateCityAndLocation(session.data.latitude, session.data.longitude, selectedCity);
//                                 if (!validationResult.isValid) {
//                                     const errorMessage = session.language === 'ar'
//                                         ? `❌ يبدو أن موقعك يقع في *${validationResult.actualCity}*. يرجى اختيار *${validationResult.actualCity}* بدلاً من *${selectedCity}*.`
//                                         : `❌ It seems your location is in *${validationResult.actualCity}*. Please select *${validationResult.actualCity}* instead of *${selectedCity}*.`;
    
//                                     await sendToWhatsApp(from, errorMessage);
//                                     await sendCitySelection(from, session.language);
//                                     return res.sendStatus(200);
//                                 }
//                             }
//                             // If location is not available, accept the city without validation
//                             session.data.city = selectedCity;
//                             session.step = STATES.STREET;
//                             const streetPrompt = session.language === 'ar'
//                                 ? `✅ لقد اخترت *${session.data.city}*.\n\n🏠 يرجى تقديم اسم الشارع.`
//                                 : `✅ You selected *${session.data.city}*.\n\n🏠 Please provide the street name.`;
    
//                             await sendToWhatsApp(from, streetPrompt);
//                         } else {
//                             const invalidSelectionMessage = session.language === 'ar'
//                                 ? "❌ اختيار غير صالح. يرجى الاختيار من الخيارات المتاحة."
//                                 : "❌ Invalid selection. Please choose from the provided options.";
    
//                             await sendToWhatsApp(from, invalidSelectionMessage);
//                             await sendCitySelection(from, session.language);
//                         }
//                     } else {
//                         // If the user sends a text message instead of selecting from the list
//                         const selectedCity = extractCity(textRaw, session.language);
//                         if (selectedCity) {
//                             // Validate the selected city against the actual city from the location (if location is available)
//                             if (session.data.latitude && session.data.longitude) {
//                                 const validationResult = await validateCityAndLocation(session.data.latitude, session.data.longitude, selectedCity);
//                                 if (!validationResult.isValid) {
//                                     const errorMessage = session.language === 'ar'
//                                         ? `❌ يبدو أن موقعك يقع في *${validationResult.actualCity}*. يرجى اختيار *${validationResult.actualCity}* بدلاً من *${selectedCity}*.`
//                                         : `❌ It seems your location is in *${validationResult.actualCity}*. Please select *${validationResult.actualCity}* instead of *${selectedCity}*.`;
    
//                                     await sendToWhatsApp(from, errorMessage);
//                                     await sendCitySelection(from, session.language);
//                                     return res.sendStatus(200);
//                                 }
//                             }
//                             // If location is not available, accept the city without validation
//                             session.data.city = selectedCity;
//                             session.step = STATES.STREET;
//                             const streetPrompt = session.language === 'ar'
//                                 ? `✅ لقد اخترت *${session.data.city}*.\n\n🏠 يرجى تقديم اسم الشارع.`
//                                 : `✅ You selected *${session.data.city}*.\n\n🏠 Please provide the street name.`;
    
//                             await sendToWhatsApp(from, streetPrompt);
//                         } else {
//                             const selectCityMessage = session.language === 'ar'
//                                 ? "❌ يرجى اختيار مدينة من الخيارات المتاحة."
//                                 : "❌ Please select a city from the provided options.";
    
//                             await sendToWhatsApp(from, selectCityMessage);
//                             await sendCitySelection(from, session.language);
//                         }
//                     }
//                     break;
//                 case STATES.STREET:
//                     session.data.street = textRaw;
//                     session.step = STATES.BUILDING_NAME;
//                     await sendToWhatsApp(from, getBuildingMessage(session.language)); // Ask for building name
//                     break;
                    
//             case STATES.BUILDING_NAME:
//                 if (!textRaw || textRaw.trim() === "") {
//                     // If no building name is provided, ask for it again
//                     await sendToWhatsApp(from, getBuildingMessage(session.language));
//                     return res.sendStatus(200); // Exit and wait for the user's response
//                 }
//                 // If the building name is provided, store it and proceed to the next step
//                 session.data.building_name = textRaw;
//                 session.step = STATES.FLAT_NO;
//                 await sendToWhatsApp(from, getFlatMessage(session.language)); // Ask for flat number
//                 break;
//             case STATES.FLAT_NO:
//                 if (!textRaw) {
//                     await sendToWhatsApp(from, getFlatMessage(session.language));
//                     return res.sendStatus(200);
//                 }
//                 session.data.flat_no = textRaw;
//                 const missingFields2 = getMissingFields(session.data); // Reuse the variable
//                 if (missingFields2.length === 0) {
//                     session.step = STATES.CONFIRMATION;
//                     await sendOrderSummary(from, session);
//                 } else {
//                     session.step = `ASK_${missingFields2[0].toUpperCase()}`;
//                     await askForNextMissingField(session, from);
//                 }
//                 break;
//                 case STATES.QUANTITY:
//                     console.log("🔹 Entered QUANTITY state for user:", from);
//                     console.log("🔹 textRaw:", textRaw);
//                     if (!textRaw || textRaw.trim() === "") {
//                         console.log("🔹 No quantity provided. Asking for quantity.");
//                         await sendToWhatsApp(from, getQuantityMessage(session.language));
//                         return res.sendStatus(200);
//                     }
//                     if (isNaN(textRaw)) {
//                         console.log("🔹 Invalid quantity provided. Asking for valid quantity.");
//                         await sendToWhatsApp(from, getInvalidQuantityMessage(session.language));
//                         return res.sendStatus(200);
//                     }
//                     console.log("🔹 Valid quantity provided:", textRaw);
//                     session.data.quantity = textRaw;
                
//                     // Initialize missingFields after setting the quantity
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
//                 const { latitude, longitude } = message.location;
//                 // Validate UAE location
//                 const UAE_BOUNDS = { minLat: 22.5, maxLat: 26.5, minLng: 51.6, maxLng: 56.5 };
//                 if (
//                     latitude >= UAE_BOUNDS.minLat &&
//                     latitude <= UAE_BOUNDS.maxLat &&
//                     longitude >= UAE_BOUNDS.minLng &&
//                     longitude <= UAE_BOUNDS.maxLng
//                 ) {
//                     session.data.latitude = latitude;
//                     session.data.longitude = longitude;
//                     // Check for other missing fields
//                     const missingFields = getMissingFields(session.data);
//                     if (missingFields.length === 0) {
//                         session.step = STATES.CONFIRMATION;
//                         await sendOrderSummary(from, session);
//                     } else {
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
//                 // Handle button replies
//                 if (message.type === "interactive" && message.interactive?.type === "button_reply") {
//                     const citySelection = message.interactive.button_reply.id;
//                     // Updated cityMap to include all cities from sendCitySelection
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
//                         session.data.city = cityMap[citySelection][session.language] || cityMap[citySelection].en;
//                         console.log("City set to:", session.data.city);
//                         // If the user has already shared a location, validate it
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
//                         // Validate against detected location
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
//                 // If the user hasn't provided a quantity yet, ask for it
//                 if (!textRaw) {
//                     await sendToWhatsApp(from, "🔢 Please provide the quantity (in liters).");
//                     return res.sendStatus(200); // Exit and wait for the user's response
//                 }
//                 // Validate the quantity after the user provides it
//                 if (isNaN(textRaw) || textRaw.trim() === "") {
//                     await sendToWhatsApp(from, "❌ Please enter a valid quantity (numeric values only).");
//                     return res.sendStatus(200); // Exit and wait for the user to correct their input
//                 }
//                 // If the quantity is valid, store it and proceed to the next step
//                 session.data.quantity = textRaw;

//                 // Check for other missing fields
//                 const missingFieldsQuantity = getMissingFields(session.data);
//                 if (missingFieldsQuantity.length === 0) {
//                     session.step = STATES.CONFIRMATION;
//                     await sendOrderSummary(from, session);
//                 } else {
//                     session.step = `ASK_${missingFieldsQuantity[0].toUpperCase()}`;
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
//                         await sendToWhatsApp(from, "Which information would you like to modify? Please reply with the corresponding number:\n\n1. Name\n2. Phone Number\n3. Email\n4. Address\n5. City\n6. Street\n7. Building Name\n8. Flat Number\n9. Location\n10. Quantity");
//                     }
//                 }
//                 break;

//             case STATES.MODIFY:
//                 // Convert any Arabic digits in the text to English digits
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
//                 }
//                 else if (selectedField === "city") {
//                     await sendCitySelection(from);  // ✅ Show city selection directly
//                     session.step = "MODIFY_CITY_SELECTION";
//                 }
//                 else {
//                     session.modifyField = selectedField;
//                     session.step = `MODIFY_${selectedField.toUpperCase()}`;
//                     await sendToWhatsApp(from, `🔹 Please provide the new value for ${selectedField.replace(/_/g, " ")}.`);
//                 }
//                 break;

//             // Modification steps
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
//                 if (message.interactive && message.interactive.button_reply) {  // ✅ Handle button replies
//                     const citySelection = message.interactive.button_reply.id;  // ✅ Get selected city ID

//                     const cityMap = {
//                         "abu_dhabi": "Abu Dhabi",
//                         "dubai": "Dubai",
//                         "sharjah": "Sharjah"
//                     };

//                     if (cityMap[citySelection]) {
//                         session.data.city = cityMap[citySelection];  // Update the city in session data
//                         session.step = STATES.CONFIRMATION;  // Transition to confirmation step after city is modified

//                         // Ensure all fields are updated and send the confirmation summary
//                         await sendUpdatedSummary(from, session);  // ✅ Show updated summary after modification
//                     } else {
//                         await sendToWhatsApp(from, "❌ Invalid selection. Please choose from the provided options.");
//                         await sendCitySelection(from);  // Re-send city selection if invalid
//                     }
//                 } else {
//                     await sendToWhatsApp(from, "❌ Please select a city from the provided options.");
//                     await sendCitySelection(from);  // Re-send the city selection buttons
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