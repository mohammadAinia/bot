import axios from 'axios';
import { getOpenAIResponse } from './openAIService.js';
import { getSystemMessages } from '../models/messageModel.js';

const userSessions = {};

export const handleIncomingMessage = async (body) => {
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

    // Initialize user session if it doesn't exist
    if (!userSessions[from]) {
        userSessions[from] = { step: STATES.WELCOME, data: {} };

        // Send welcome message with options
        await sendInteractiveButtons(from, defaultWelcomeMessage, [
            { type: "reply", reply: { id: "contact_us", title: "📞 Contact Us" } },
            { type: "reply", reply: { id: "new_request", title: "📝 New Request" } }
        ]);
        return res.sendStatus(200);
    }

    const session = userSessions[from];

    // Handle messages based on the current state
    switch (session.step) {
        case STATES.WELCOME:
            // If the user sends a message (not a button reply), treat it as a question
            if (message.type === "text") {
                const aiResponse = await getOpenAIResponse(textRaw);
                const reply = `${aiResponse}\n\nTo complete the inquiry, you can ask other questions. If you want to submit a request or contact us, choose from the following options:`;

                // Send the AI response with options to continue or proceed
                await sendInteractiveButtons(from, reply, [
                    { type: "reply", reply: { id: "contact_us", title: "📞 Contact Us" } },
                    { type: "reply", reply: { id: "new_request", title: "📝 New Request" } }
                ]);
            } else if (message.type === "interactive" && message.interactive.type === "button_reply") {
                const buttonId = message.interactive.button_reply.id;

                if (buttonId === "contact_us") {
                    await sendToWhatsApp(from, "📞 You can contact us at support@example.com or call +1234567890.");
                } else if (buttonId === "new_request") {
                    session.step = STATES.NAME;
                    await sendToWhatsApp(from, "🔹 Please provide your full name.");
                } else {
                    await sendToWhatsApp(from, "❌ Invalid option, please select a valid button.");
                }
            }
            break;

        //----------------------------------------------------------------------
        case STATES.NAME:
            session.data.name = textRaw;
            session.data.phone = formatPhoneNumber(from); // Automatically store the sender's number
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
            // If the system is already waiting for quantity input
            if (session.awaitingQuantityInput) {
                if (textRaw.trim() === "" || isNaN(textRaw)) {
                    await sendToWhatsApp(from, "❌ Please enter a valid quantity (numeric values only).");
                    return res.sendStatus(200);
                }

                // If valid, store the quantity and move to the next step
                session.data.quantity = textRaw;
                session.awaitingQuantityInput = false; // Reset flag
                session.step = STATES.CONFIRMATION;
                sendOrderSummary(from, session);
            } else {
                // If the system is not awaiting input, set the flag and ask for quantity
                session.awaitingQuantityInput = true;
                await sendToWhatsApp(from, "📦 Please enter the quantity (in liters) of the product.");
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
};

export const sendToWhatsApp = async (to, message) => {
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

export const sendInteractiveButtons = async (to, message, buttons) => {
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

export const sendWelcomeMessage = async (to) => {
    const { defaultWelcomeMessage } = getSystemMessages();
    await sendInteractiveButtons(to, defaultWelcomeMessage, [
        { type: "reply", reply: { id: "contact_us", title: "📞 Contact Us" } },
        { type: "reply", reply: { id: "new_request", title: "📝 New Request" } }
    ]);
};

export const verifyWebhookToken = (token) => {
    return token === process.env.WEBHOOK_VERIFY_TOKEN;
};
