import express from 'express';
import cors from 'cors';
import fetch from 'node-fetch';
import dotenv from 'dotenv';

// .env file se variables load karne ke liye
dotenv.config();

const app = express();
const PORT = 8000;

// CORS allow karna zaroori hai taaki GitHub Pages tumhare laptop se baat kar sake
app.use(cors());
app.use(express.json());

const GROQ_API_KEY = process.env.GROQ_API_KEY;
console.log("LOADED KEY:", GROQ_API_KEY ? "HAAN, MIL GAYI!" : "NAHI MILI, UNDEFINED HAI!");

let chatHistory = [
    {
        role: "system",
        content: "You are a helpful, friendly AI assistant. Always remember the context of the conversation and refer to previous messages when appropriate."
    }
];
// Yeh hai tumhari apni XYZ API End-point
app.post('/xyz-api/chat', async (req, res) => {
    try {
        const { message } = req.body;

        if (!message) {
            return res.status(400).json({ error: "Message is required" });
        }

        // 1. User ka naya message history mein add karo
        chatHistory.push({ role: "user", content: message });

        // 2. Memory limits set karo (Optional: taaki history bohot badi hokar crash na ho, hum last 15-20 messages rakhte hain)
        if (chatHistory.length > 20) {
            // System prompt ko chhod kar sabse purane user/assistant message ko hata do
            chatHistory.splice(1, 2); 
        }

        // 3. Poori history ke sath Groq API ko call karo
        const chatCompletion = await groq.chat.completions.create({
            messages: chatHistory, // Ab bas single message nahi, poori chatHistory ja rahi hai!
            model: "llama3-8b-8192", // Jo bhi tumhara default model tha
        });

        const aiResponse = chatCompletion.choices[0].message.content;

        // 4. AI ka response bhi history mein add karo taaki agli baar use apna jawab bhi yaad rahe
        chatHistory.push({ role: "assistant", content: aiResponse });

        // 5. Response send karo frontend ko
        res.json({ reply: aiResponse });

    } catch (error) {
        console.error("Error in chat:", error);
        res.status(500).json({ error: "Something went wrong in the backend" });
    }
});

const PORT = process.env.PORT || 8000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

app.listen(PORT, () => {
    console.log(`🚀 Your XYZ API is running at http://localhost:${PORT}`);
});