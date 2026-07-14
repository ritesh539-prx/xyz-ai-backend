import express from 'express';
import cors from 'cors';
import fetch from 'node-fetch';
import dotenv from 'dotenv';

// .env file se variables load karne ke liye
dotenv.config();

const app = express();

// CORS configure kiya taaki local aur live frontend dono se request aaye toh block na ho
app.use(cors());
app.use(express.json());

const GROQ_API_KEY = process.env.GROQ_API_KEY;
console.log("LOADED KEY:", GROQ_API_KEY ? "HAAN, MIL GAYI!" : "NAHI MILI, UNDEFINED HAI!");

// 🧠 GLOBAL MEMORY SYSTEM (Vercel Serverless safe)
global.globalChatHistory = global.globalChatHistory || [
    {
        role: "system",
        content: "You are a helpful, friendly AI assistant. Always remember the context of the conversation and refer to previous messages when appropriate."
    }
];

// XYZ API End-point
app.post('/xyz-api/chat', async (req, res) => {
    try {
        const { message } = req.body;

        if (!message) {
            return res.status(400).json({ error: "Message is required" });
        }

        // 1. User ka naya message global history mein add karo
        global.globalChatHistory.push({ role: "user", content: message });

        // 2. Memory limit: Pichle ~15 messages tak dhyan mein rakhega (Server crash se bachne ke liye)
        if (global.globalChatHistory.length > 15) {
            global.globalChatHistory.splice(1, 2); // System prompt ko chhod kar purane messages hatao
        }

        // 3. Groq API ko direct curl style fetch call karo
        const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${GROQ_API_KEY}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                model: "llama3-8b-8192",
                messages: global.globalChatHistory
            })
        });

        const data = await response.json();

        if (!response.ok) {
            console.error("Groq API Error Details:", data);
            return res.status(response.status).json({ error: "Failed to communicate with Groq API" });
        }

        const aiResponse = data.choices[0].message.content;

        // 4. AI ka response bhi memory history mein add karo
        global.globalChatHistory.push({ role: "assistant", content: aiResponse });

        // 5. Response return karo frontend ko
        return res.json({ reply: aiResponse });

    } catch (error) {
        console.error("Caught Backend Error:", error);
        return res.status(500).json({ error: "Something went wrong in the backend" });
    }
});

// Vercel deployment ke liye app export karna zaroori hai
export default app;

// Local Environment Testing Setup
if (process.env.NODE_ENV !== 'production') {
    const PORT = process.env.PORT || 8000;
    app.listen(PORT, () => {
        console.log(`🚀 Local test running on port ${PORT}`);
    });
}