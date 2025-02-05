import axios from 'axios';

const getOpenAIResponse = async (userMessage, systemMessage, guidanceMessage) => {
    try {
        const messages = [
            { role: "system", content: systemMessage },
        ];

        if (guidanceMessage && guidanceMessage.trim() !== "") {
            messages.push({ role: "system", content: guidanceMessage });
        }

        messages.push({ role: "user", content: userMessage });

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

export { getOpenAIResponse };
