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


const welcomeMessage = `🌟 مرحبًا بك في *شركة محمد لتكرير الزيوت* 🌟  
نحن نقدم الخدمات التالية:  
✅ *استفسارات عن منتجاتنا وخدماتنا*  
✅ *إنشاء طلب جديد:*  
   - *طلب التخلص من الزيت المستعمل* 🛢️  
   - *شراء الزيت المعاد تكريره* 🏭  
أخبرني كيف يمكنني مساعدتك اليوم؟ 😊`;

// دالة لإرسال رسالة إلى OpenAI مع توجيه الأسئلة ضمن نطاق الشركة
const getOpenAIResponse = async (userMessage) => {
    try {
        const response = await axios.post('https://api.openai.com/v1/chat/completions', {
            model: "gpt-4",
            messages: [
                {
                    role: "system",
                    content: `🌟 مرحبًا بك في شركة محمد لتكرير الزيوت 🌟  
الشركة متخصصة في إعادة تكرير الزيوت، وساعات العمل من الأحد إلى الخميس من 9 صباحًا حتى 2 مساءً.  
أنت مساعد افتراضي للشركة، مهمتك الإجابة فقط عن الأسئلة المتعلقة بالشركة، مثل الخدمات، الأسعار، أو طلبات التخلص من الزيت.  
إذا كان السؤال لا يتعلق بالشركة، فأجب بـ: "❌ عذرًا، يمكنني فقط الإجابة عن الأسئلة المتعلقة بخدمات شركتنا."`
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
        return "❌ عذرًا، حدث خطأ أثناء معالجة طلبك.";
    }
};
// دالة لإرسال رسائل WhatsApp
const sendToWhatsApp = async (to, message) => {
    try {
        await axios.post(process.env.WHATSAPP_API_URL, {
            messaging_product: 'whatsapp',
            recipient_type: 'individual',
            to: to,
            type: 'text',
            text: { body: message }
        }, {
            headers: { 'Authorization': `Bearer ${process.env.WHATSAPP_ACCESS_TOKEN}`, 'Content-Type': 'application/json' }
        });
    } catch (error) {
        console.error('❌ Failed to send message to WhatsApp:', error.response?.data || error.message);
    }
};

// استقبال رسائل واتساب
app.post('/webhook', async (req, res) => {
    try {
        const entry = req.body.entry?.[0];
        const changes = entry?.changes?.[0];
        const value = changes?.value;
        const messages = value?.messages;

        if (!messages || messages.length === 0) {
            return res.sendStatus(200);
        }

        const message = messages[0];
        const from = message.from;
        const text = message.text?.body?.toLowerCase();

        console.log(`📩 رسالة جديدة من ${from}: ${text}`);

        // التحقق مما إذا كان المستخدم لديه جلسة نشطة لجمع الطلبات
        if (!userSessions[from]) {
            userSessions[from] = { step: 0, data: {} };
        }

        const session = userSessions[from];

        if (session.step === 0) {
            if (text.includes("شراء زيت")) {
                session.data.type = "شراء زيت";
                session.step = 1;
                await sendToWhatsApp(from, "🔹 يرجى تزويدنا باسمك الكريم.");
            } else if (text.includes("التخلص من الزيت")) {
                session.data.type = "التخلص من الزيت المستعمل";
                session.step = 1;
                await sendToWhatsApp(from, "🔹 يرجى تزويدنا باسمك الكريم.");
            } else {
                // إذا لم يكن طلبًا، نرسل السؤال إلى ChatGPT
                const replyText = await getOpenAIResponse(text);
                await sendToWhatsApp(from, replyText);
            }
        } else if (session.step === 1) {
            session.data.name = text;
            session.step = 2;
            await sendToWhatsApp(from, "📞 يرجى تزويدنا برقم هاتفك للتواصل.");
        } else if (session.step === 2) {
            session.data.phone = text;
            session.step = 3;
            await sendToWhatsApp(from, "📧 يرجى تزويدنا ببريدك الإلكتروني.");
        } else if (session.step === 3) {
            session.data.email = text;
            session.step = 4;
            await sendToWhatsApp(from, "📍 يرجى تزويدنا بعنوانك بالكامل.");
        } else if (session.step === 4) {
            session.data.address = text;
            session.step = 5;

            // إرسال ملخص الطلب للمستخدم
            let summary = `✅ *ملخص الطلب:*\n\n`;
            summary += `🔹 *الاسم:* ${session.data.name}\n`;
            summary += `📞 *رقم الهاتف:* ${session.data.phone}\n`;
            summary += `📧 *البريد الإلكتروني:* ${session.data.email}\n`;
            summary += `📍 *العنوان:* ${session.data.address}\n`;
            summary += `🛢 *نوع الطلب:* ${session.data.type}\n\n`;
            summary += `هل المعلومات صحيحة؟ يرجى الرد بـ *نعم* أو *لا*`;

            await sendToWhatsApp(from, summary);
        } else if (session.step === 5) {
            if (text.includes("نعم")) {
                // إرسال الطلب إلى API
                await axios.post(process.env.ORDER_API_URL, session.data, {
                    headers: { 'Content-Type': 'application/json' }
                });

                await sendToWhatsApp(from, "✅ تم إرسال طلبك بنجاح! سيتم التواصل معك قريبًا.");
                delete userSessions[from]; // إنهاء الجلسة بعد الطلب
            } else {
                await sendToWhatsApp(from, "❌ تم إلغاء الطلب. يمكنك إعادة المحاولة في أي وقت.");
                delete userSessions[from]; // إنهاء الجلسة إذا رفض المستخدم الطلب
            }
        }

        res.sendStatus(200);
    } catch (error) {
        console.error('❌ خطأ:', error.response?.data || error.message);
        res.sendStatus(500);
    }
});

app.listen(PORT, () => console.log(`🚀 Server is running on http://localhost:${PORT}`));



