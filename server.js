import express from 'express';
import cors from 'cors';
import fetch from 'node-fetch';
import dotenv from 'dotenv';

// 1. Sabse pehle .env variables ko load karo taaki poore project ko keys mil sakein
dotenv.config();

// 2. Ab jab keys load ho chuki hain, tab bot file ko dynamic import karo
import('./bot.cjs')
  .then(() => console.log("🤖 Bot file loaded successfully!"))
  .catch((err) => console.error("❌ Bot load karne mein dikkat:", err));

const app = express();

app.use(cors());
app.use(express.json());

const GROQ_API_KEY = process.env.GROQ_API_KEY;
console.log("LOADED KEY:", GROQ_API_KEY ? "HAAN, MIL GAYI!" : "NAHI MILI, UNDEFINED HAI!");

// XYZ API End-point
app.post('/xyz-api/chat', async (req, res) => {
    try {
        const { message, history } = req.body;

        if (!message) {
            return res.status(400).json({ error: "Message is required" });
        }

        const messagesToSend = history || [
            { role: "system", content: "You are a helpful AI assistant." },
            { role: "user", content: message }
        ];

        const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${GROQ_API_KEY}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                model: 'llama-3.1-8b-instant',
                messages: messagesToSend 
            })
        });

        const data = await response.json();

        if (!response.ok) {
            console.error("Groq API Error Details:", data);
            return res.status(response.status).json({ error: "Failed to communicate with Groq API" });
        }

        const aiResponse = data.choices[0].message.content;
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