require('../xyz-ai-backend/bot.js');
require('dotenv')config();
import express from 'express';
import cors from 'cors';
import fetch from 'node-fetch';
import dotenv from 'dotenv';

// .env file se variables load karne ke liye
dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

const GROQ_API_KEY = process.env.GROQ_API_KEY;
console.log("LOADED KEY:", GROQ_API_KEY ? "HAAN, MIL GAYI!" : "NAHI MILI, UNDEFINED HAI!");

// XYZ API End-point
app.post('/xyz-api/chat', async (req, res) => {
    try {
        // Frontend se message aur poori history dono aa rahi hain
        const { message, history } = req.body;

        if (!message) {
            return res.status(400).json({ error: "Message is required" });
        }

        // Agar frontend se history nahi aayi (fallback), toh sirf current message ka array banao
        const messagesToSend = history || [
            { role: "system", content: "You are a helpful AI assistant." },
            { role: "user", content: message }
        ];

        // Direct fetch call to Groq API with full context
        const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${GROQ_API_KEY}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                model: 'llama-3.1-8b-instant',
                messages: messagesToSend // Frontend wala updated array bhej rahe hain
            })
        });

        const data = await response.json();

        if (!response.ok) {
            console.error("Groq API Error Details:", data);
            return res.status(response.status).json({ error: "Failed to communicate with Groq API" });
        }

        const aiResponse = data.choices[0].message.content;

        // Response frontend ko return karo
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