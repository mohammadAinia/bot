import axios from 'axios';

// Ensure systemMessage and guidanceMessage are always valid strings before use
export const getOpenAIResponse = async (userMessage, systemMessage, guidanceMessage) => {
    try {
        // If no system message is provided, use an empty string to avoid null errors
        const validSystemMessage = systemMessage && typeof systemMessage === 'string' ? systemMessage : '';
        const validGuidanceMessage = guidanceMessage && typeof guidanceMessage === 'string' ? guidanceMessage : '';

        const messages = [
            { role: "system", content: validSystemMessage },
        ];

        // Add guidanceMessage if valid
        if (validGuidanceMessage) {
            messages.push({ role: "system", content: validGuidanceMessage });
        }

        // Add user message to the messages array
        messages.push({ role: "user", content: userMessage });

        // Make the API call to OpenAI
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
